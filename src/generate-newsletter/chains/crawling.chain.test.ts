import { makeLoggingExecutor } from 'test/test-utils';

import CrawlingChain from './crawling.chain';

vi.mock('../utils/get-html-from-url', () => ({
  getHtmlFromUrl: vi.fn(async (_logger: any, url: string) => `HTML:${url}`),
}));

// Helpers to build test targets
const makeTarget = (
  name: string | undefined,
  url: string,
  list: { detailUrl: string; title?: string }[],
  detailByUrl: Record<string, Record<string, any>>,
) => {
  return {
    name,
    url,
    async parseList(_html: string) {
      return list;
    },
    async parseDetail(_html: string) {
      // decide by html URL-suffix in test: our mocked getHtmlFromUrl returns `HTML:${url}`
      // For simplicity, pick the first (only) detail in detailByUrl that matches
      // the expected URL is encoded in the provided list and we map by that
      return { ...(Object.values(detailByUrl)[0] || {}) };
    },
  } as any;
};

// We will override parseDetail per target later using vi.spyOn to map html->detail

describe('CrawlingChain', () => {
  test('runs full pipeline per group: dedupe, fetch, parse, merge, save; returns total count and uses unknown name fallback', async () => {
    const { getHtmlFromUrl } = await import('../utils/get-html-from-url');
    const loggingExecutor = makeLoggingExecutor();

    // Prepare two targets: one with name, one without
    const t1List = [
      { detailUrl: 'https://site.test/a1', title: 'A1' },
      { detailUrl: 'https://site.test/a2', title: 'A2' },
    ];
    const t2List = [
      { detailUrl: 'https://site.test/b1', title: 'B1' },
      { detailUrl: 'https://site.test/b2', title: 'B2' },
    ];

    // Detail payloads mapped by detail URL
    const t1Details: Record<string, any> = {
      'https://site.test/a1': { content: 'A1C' },
      'https://site.test/a2': { content: 'A2C' },
    };
    const t2Details: Record<string, any> = {
      'https://site.test/b1': { content: 'B1C' },
      'https://site.test/b2': { content: 'B2C' },
    };

    const t1 = makeTarget('T1', 'https://site.test/list1', t1List, t1Details);
    const t2 = makeTarget(
      undefined,
      'https://site.test/list2',
      t2List,
      t2Details,
    );

    // Override parseDetail to route based on detail URL embedded in last fetched detail HTML
    // Our pipeline will call getHtmlFromUrl for detail pages in the same order as deduped list
    const parseDetailFor = (details: Record<string, any>) =>
      vi.fn(async (html: string) => {
        const url = html.replace('HTML:', '');
        return details[url];
      });
    // Attach parseDetail spies
    (t1 as any).parseDetail = parseDetailFor(t1Details);
    (t2 as any).parseDetail = parseDetailFor(t2Details);

    const provider = {
      maxConcurrency: 3,
      crawlingTargetGroups: [
        {
          name: 'group-1',
          targets: [t1, t2],
        },
      ],
      // dedupe: mark one URL from each target as existing
      fetchExistingArticlesByUrls: vi.fn(async (urls: string[]) => {
        return urls
          .filter((u) => u.endsWith('a2') || u.endsWith('b2'))
          .map((detailUrl) => ({ detailUrl }));
      }),
      saveCrawledArticles: vi.fn(async (articles: any[], meta: any) => {
        // Assert that pipelineId has been omitted from merged articles
        for (const a of articles) {
          expect('pipelineId' in a).toBe(false);
          expect(a.detailUrl).toBeDefined();
        }
        // Ensure meta carries group and target info
        expect(meta.targetGroup.name).toBe('group-1');
        expect(meta.target.url).toMatch(/^https:\/\/site\.test\/list[12]$/);
        return articles.length;
      }),
    } as any;

    const chain = new CrawlingChain({
      logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn() } as any,
      taskId: 'task-1',
      provider,
      options: { chain: { stopAfterAttempt: 1 } } as any,
      loggingExecutor: loggingExecutor as any,
    });

    // Access top-level chain getter to execute group function
    const top = chain.chain as any;

    const total = await top['group-1']();

    // Expect: per target, 2 list items -> 1 filtered by dedupe -> 1 saved each => total 2
    expect(total).toBe(2);

    // getHtmlFromUrl should be called for 2 list pages + 2 detail pages (after dedupe)
    expect(vi.mocked(getHtmlFromUrl)).toHaveBeenCalledTimes(4);
    expect(
      vi
        .mocked(getHtmlFromUrl)
        .mock.calls.map((c) => c[1])
        .sort(),
    ).toEqual([
      'https://site.test/a1',
      'https://site.test/b1',
      'https://site.test/list1',
      'https://site.test/list2',
    ]);

    // dedupe should be called twice with appropriate urls
    expect(provider.fetchExistingArticlesByUrls).toHaveBeenCalledTimes(2);

    // save called twice (per target) with 1 article each
    expect(provider.saveCrawledArticles).toHaveBeenCalledTimes(2);
    for (const call of (provider.saveCrawledArticles as any).mock.calls) {
      expect(call[0]).toHaveLength(1);
    }

    // executeWithLogging should wrap each step + group summary
    // steps per target: list.fetch, list.parse, list.dedupe, detail.fetch, detail.parse, merge, save = 7
    // 2 targets => 14; plus outer crawl.group => 15
    expect(loggingExecutor.executeWithLogging).toHaveBeenCalledTimes(15);

    // parseDetail spies should be invoked once per deduped item
    expect((t1 as any).parseDetail).toHaveBeenCalledTimes(1);
    expect((t2 as any).parseDetail).toHaveBeenCalledTimes(1);
  });

  test('mergeParsedArticles throws when no matching list item (pipelineId mismatch)', async () => {
    const loggingExecutor = makeLoggingExecutor();
    const provider = { maxConcurrency: 1, crawlingTargetGroups: [] } as any;
    const chain = new CrawlingChain({
      logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn() } as any,
      taskId: 'task-2',
      provider,
      options: { chain: { stopAfterAttempt: 1 } } as any,
      loggingExecutor: loggingExecutor as any,
    });

    const target = { url: 'https://x', name: undefined } as any;
    const list = [{ pipelineId: 'p1', detailUrl: 'https://x/1', title: 'X1' }];
    const details = [{ pipelineId: 'p2', content: 'C' }];

    await expect(
      (chain as any).mergeParsedArticles(target, list, details),
    ).rejects.toThrow(/No matching list item/);
  });
});
