import type {
  ArticleForUpdateByAnalysis,
  UnscoredArticle,
} from '../models/article';
import type { AnalysisProvider } from '../models/interfaces';

import { RunnablePassthrough } from '@langchain/core/runnables';

import { LoggingExecutor } from '~/logging/logging-executor';
import type { DateService } from '~/models/interfaces';

import ArticleInsightsChain from './article-insights.chain';
import { Chain, type ChainConfig } from './chain';

type Config<TaskId> = ChainConfig<TaskId, AnalysisProvider> & {
  dateService: DateService;
};

export default class AnalysisChain<TaskId> extends Chain<
  TaskId,
  AnalysisProvider
> {
  private readonly dateService: DateService;

  constructor(config: Config<TaskId>) {
    super(config);

    this.dateService = config.dateService;
  }

  public get chain() {
    return RunnablePassthrough.assign({
      unscoredArticles: () => this.fetchUnscoredArticles(),
      tags: () => this.fetchTags(),
    })
      .pipe(
        RunnablePassthrough.assign({
          determinedArticles: ({ unscoredArticles, tags }) =>
            this.analyzeArticles(unscoredArticles, tags),
        }),
      )
      .pipe(
        RunnablePassthrough.assign({
          processedCount: ({ determinedArticles }) =>
            this.updateAnalysisContext(determinedArticles),
        }),
      )
      .withRetry({ stopAfterAttempt: this.options.chain.stopAfterAttempt });
  }

  private async fetchUnscoredArticles(): Promise<UnscoredArticle[]> {
    return this.executeWithLogging(
      {
        event: 'analysis.articles.fetch',
        level: 'debug',
        doneFields: (items) => ({ count: items.length }),
      },
      async () => {
        return await this.provider.fetchUnscoredArticles();
      },
    );
  }

  private async fetchTags(): Promise<string[]> {
    return this.executeWithLogging(
      {
        event: 'analysis.tags.fetch',
        level: 'debug',
        doneFields: (items) => ({ count: items.length }),
      },
      async () => {
        return await this.provider.fetchTags();
      },
    );
  }

  private async analyzeArticles(
    unscoredArticles: UnscoredArticle[],
    tags: string[],
  ): Promise<ArticleForUpdateByAnalysis[]> {
    return this.executeWithLogging(
      {
        event: 'analysis.articles.analyze',
        level: 'debug',
        startFields: {
          unscoredArticles,
          tags,
        },
        doneFields: (items) => ({ count: items.length }),
      },
      async () => {
        const articleInsightsChain = new ArticleInsightsChain({
          logger: this.logger,
          taskId: this.taskId,
          provider: {
            unscoredArticles,
            tags,
            classifyTagOptions: this.provider.classifyTagOptions,
            analyzeImagesOptions: this.provider.analyzeImagesOptions,
            determineScoreOptions: this.provider.determineScoreOptions,
          },
          options: this.options,
          loggingExecutor: new LoggingExecutor(
            this.logger,
            this.taskId as TaskId,
          ),
          dateService: this.dateService,
        });

        return await articleInsightsChain.generateInsights();
      },
    );
  }

  private async updateAnalysisContext(
    determinedArticles: ArticleForUpdateByAnalysis[],
  ): Promise<number> {
    return this.executeWithLogging(
      {
        event: 'analysis.articles.update',
        level: 'debug',
        startFields: {
          determinedArticles,
        },
        doneFields: (count) => ({ count }),
      },
      async () => {
        for (let i = 0; i < determinedArticles.length; i++) {
          const article = determinedArticles[i];
          await this.provider.update(article);
        }

        return determinedArticles.length;
      },
    );
  }
}
