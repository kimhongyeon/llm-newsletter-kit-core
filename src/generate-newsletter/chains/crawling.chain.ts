import type {
  CrawlingTarget,
  CrawlingTargetGroup,
  ParsedTarget,
  ParsedTargetDetail,
  ParsedTargetListItem,
} from '../models/crawling';
import type { CrawlingProvider } from '../models/interfaces';

import { RunnablePassthrough } from '@langchain/core/runnables';
import { omit } from 'es-toolkit';
import { randomUUID } from 'node:crypto';

import { getHtmlFromUrl } from '../utils/get-html-from-url';
import { Chain, type ChainConfig } from './chain';

type ParsedTargetListItemWithPipelineId = ParsedTargetListItem & {
  pipelineId: string;
};

type ParsedTargetDetailWithPipelineId = ParsedTargetDetail & {
  pipelineId: string;
};

type HtmlWithPipelineId = {
  html: string;
  pipelineId: string;
};

export default class CrawlingChain<TaskId> extends Chain<
  TaskId,
  CrawlingProvider
> {
  constructor(config: ChainConfig<TaskId, CrawlingProvider>) {
    const provider = config.provider;
    provider.maxConcurrency ??= 5;

    super({ ...config, provider });
  }

  public get chain() {
    const mapping = this.provider.crawlingTargetGroups.reduce<{
      [key: string]: () => Promise<number>;
    }>((result, group) => {
      return {
        ...result,
        [group.name]: () => this.executeGroupPipeline(group),
      };
    }, {});

    return RunnablePassthrough.assign(mapping);
  }

  private async executeGroupPipeline(group: CrawlingTargetGroup) {
    const groupLabel = group.name;

    const chain = RunnablePassthrough.assign({
      listPageHtml: ({ target }: { target: CrawlingTarget }) =>
        this.fetchListPageHtml(target),
    })
      .pipe({
        parsedList: ({ target, listPageHtml }) =>
          this.parseListPageHtml(target, listPageHtml),
        target: ({ target }) => target,
      })
      .pipe({
        list: ({ target, parsedList }) =>
          this.dedupeListItems(target, parsedList),
        target: ({ target }) => target,
      })
      .pipe({
        detailPagesHtmlWithPipelineId: ({ target, list }) =>
          this.fetchDetailPagesHtml(target, list),
        target: ({ target }) => target,
        list: ({ list }) => list,
      })
      .pipe({
        parsedDetails: ({ target, detailPagesHtmlWithPipelineId }) =>
          this.parseDetailPagesHtml(target, detailPagesHtmlWithPipelineId),
        target: ({ target }) => target,
        list: ({ list }) => list,
      })
      .pipe({
        processedArticles: ({ target, list, parsedDetails }) =>
          this.mergeParsedArticles(target, list, parsedDetails),
        target: ({ target }) => target,
      })
      .pipe({
        count: ({ target, processedArticles }) =>
          this.saveArticles(group, target, processedArticles),
      })
      .withRetry({ stopAfterAttempt: this.options.chain.stopAfterAttempt });

    return this.executeWithLogging(
      {
        event: 'crawl.group',
        level: 'debug',
        startFields: {
          group: groupLabel,
          targets: group.targets.length,
        },
        doneFields: (total) => ({ totalSaved: total }),
      },
      async () => {
        const results = await chain.batch(
          group.targets.map((target) => ({ target })),
          {
            maxConcurrency: this.provider.maxConcurrency,
          },
        );

        return results.reduce((sum, result) => sum + result.count, 0);
      },
    );
  }

  private async fetchListPageHtml(target: CrawlingTarget): Promise<string> {
    return this.executeWithLogging(
      {
        event: 'crawl.list.fetch',
        level: 'debug',
        startFields: { target: this.describeTarget(target) },
      },
      async () => {
        return await getHtmlFromUrl(this.logger, target.url);
      },
    );
  }

  private async parseListPageHtml(
    target: CrawlingTarget,
    listPageHtml: string,
  ): Promise<ParsedTargetListItemWithPipelineId[]> {
    return this.executeWithLogging(
      {
        event: 'crawl.list.parse',
        level: 'debug',
        startFields: {
          target: this.describeTarget(target),
          htmlLength: listPageHtml.length,
        },
        doneFields: (items) => ({ count: items.length }),
      },
      async () => {
        return (await target.parseList(listPageHtml)).map((item) => ({
          ...item,
          pipelineId: randomUUID(),
        }));
      },
    );
  }

  private async dedupeListItems(
    target: CrawlingTarget,
    parsedList: ParsedTargetListItemWithPipelineId[],
  ): Promise<ParsedTargetListItemWithPipelineId[]> {
    return this.executeWithLogging(
      {
        event: 'crawl.list.dedupe',
        level: 'debug',
        startFields: {
          target: this.describeTarget(target),
          inCount: parsedList.length,
        },
        doneFields: (deduped) => ({
          outCount: deduped.length,
          filtered: parsedList.length - deduped.length,
        }),
      },
      async () => {
        const existingArticles =
          await this.provider.fetchExistingArticlesByUrls(
            parsedList.map(({ detailUrl }) => detailUrl),
          );

        const existingUrlSet = new Set(
          existingArticles.map(({ detailUrl }) => detailUrl),
        );

        return parsedList.filter((item) => !existingUrlSet.has(item.detailUrl));
      },
    );
  }

  private async fetchDetailPagesHtml(
    target: CrawlingTarget,
    list: ParsedTargetListItemWithPipelineId[],
  ): Promise<HtmlWithPipelineId[]> {
    return this.executeWithLogging(
      {
        event: 'crawl.detail.fetch',
        level: 'debug',
        startFields: {
          target: this.describeTarget(target),
          count: list.length,
        },
        doneFields: (htmlList) => ({ count: htmlList.length }),
      },
      async () => {
        const htmlList = await Promise.all(
          list.map((data) => getHtmlFromUrl(this.logger, data.detailUrl)),
        );

        return htmlList.map((html, index) => ({
          pipelineId: list[index].pipelineId,
          html,
        }));
      },
    );
  }

  private async parseDetailPagesHtml(
    target: CrawlingTarget,
    detailPagesHtmlWithPipelineId: HtmlWithPipelineId[],
  ): Promise<ParsedTargetDetailWithPipelineId[]> {
    return this.executeWithLogging(
      {
        event: 'crawl.detail.parse',
        level: 'debug',
        startFields: {
          target: this.describeTarget(target),
          count: detailPagesHtmlWithPipelineId.length,
        },
        doneFields: (details) => ({ count: details.length }),
      },
      async () => {
        const detail = await Promise.all(
          detailPagesHtmlWithPipelineId.map(({ html }) =>
            target.parseDetail(html),
          ),
        );

        return detail.map((detail, index) => ({
          pipelineId: detailPagesHtmlWithPipelineId[index].pipelineId,
          ...detail,
        }));
      },
    );
  }

  // Although this is a synchronous method, using async wrapping to maintain consistency with the executeWithLogging interface
  private async mergeParsedArticles(
    target: CrawlingTarget,
    list: ParsedTargetListItemWithPipelineId[],
    parsedDetails: ParsedTargetDetailWithPipelineId[],
  ): Promise<ParsedTarget[]> {
    return this.executeWithLogging(
      {
        event: 'crawl.merge',
        level: 'debug',
        startFields: {
          target: this.describeTarget(target),
          listCount: list.length,
          detailCount: parsedDetails.length,
        },
        doneFields: (merged) => ({ count: merged.length }),
      },
      async () => {
        const listItemMap = new Map(
          list.map((item) => [item.pipelineId, item]),
        );

        const merged: ParsedTarget[] = parsedDetails.map((detail) => {
          const listItem = listItemMap.get(detail.pipelineId);
          if (!listItem) {
            throw new Error(
              `No matching list item for detail with pipelineId: ${detail.pipelineId}`,
            );
          }

          return {
            ...omit(listItem, ['pipelineId']),
            ...omit(detail, ['pipelineId']),
          };
        });

        return merged;
      },
    );
  }

  private async saveArticles(
    group: CrawlingTargetGroup,
    target: CrawlingTarget,
    processedArticles: ParsedTarget[],
  ): Promise<number> {
    const omittedGroup = omit(group, ['targets']);

    return this.executeWithLogging(
      {
        event: 'crawl.save',
        level: 'debug',
        startFields: {
          group: omittedGroup,
          target: this.describeTarget(target),
          count: processedArticles.length,
        },
        doneFields: (saved) => ({ saved }),
      },
      async () => {
        return await this.provider.saveCrawledArticles(processedArticles, {
          taskId: this.taskId,
          targetGroup: omittedGroup,
          target,
        });
      },
    );
  }

  private describeTarget(target: CrawlingTarget) {
    return {
      name: target.name || 'unknown',
      listUrl: target.url,
    };
  }
}
