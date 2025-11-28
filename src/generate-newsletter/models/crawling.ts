import type {
  DateType,
  IsoDateString,
  MarkdownString,
  UniqueIdentifier,
  UrlString,
} from '~/models/common';

/**
 * Structure returned after parsing a list page (HTML).
 */
export type ParsedTargetListItem = {
  /**
   * Unique id present in the HTML. If none exists, you may omit it.
   * @example "post-2025-0001"
   */
  uniqId?: UniqueIdentifier;

  /**
   * Article title.
   * @example "AI Industry Trends Report Released"
   */
  title: string;

  /**
   * Article date in ISO format (YYYY-MM-DD), no time included.
   * @example "2025-10-15"
   */
  date: IsoDateString;

  /**
   * Whether it is a registered date or a duration.
   * @example DateType.REGISTERED
   */
  dateType: DateType;

  /**
   * URL to the linked detail page.
   * @example "https://example.com/board/notice/1234"
   */
  detailUrl: UrlString;
};

/**
 * Structure returned after parsing a detail page (HTML).
 */
export type ParsedTargetDetail = {
  /**
   * Parsed detail page content in Markdown.
   * Convert HTML to Markdown using libraries such as turndown.
   * @example "## Notice\n\n- Application period: 2025-10-15 ~ 2025-10-31"
   */
  detailContent: MarkdownString;

  /**
   * Whether there is any file attachment.
   * @example true
   */
  hasAttachedFile: boolean;

  /**
   * Whether an image is included.
   * @example false
   */
  hasAttachedImage: boolean;
};

/**
 * Fully structured crawling target object combining list and detail parsing results.
 */
export type ParsedTarget = ParsedTargetListItem & ParsedTargetDetail;

/**
 * Target to crawl.
 * For example, a board/list page of a website. Parsing methods must be defined.
 */
export type CrawlingTarget = {
  /**
   * Identifier for the crawling target. Any unique id works; uuid is recommended.
   * @example "crawling-target-001"
   */
  id: UniqueIdentifier;

  /**
   * Name of the crawling target.
   * @example "Notice Board"
   */
  name: string;

  /**
   * URL of the crawling target. Should point to a specific board (list) page URL.
   * @example "https://example.com/board/notice"
   */
  url: UrlString;

  /**
   * Method to structurally parse data from a list page (HTML).
   * Synchronous parsing with clear rules is recommended, but async is supported to allow LLM/external backends.
   *
   * @param html Original HTML string of the list page
   * @returns Parsed list items
   * @example
   * ```ts
   * const items = target.parseList(html);
   * items[0].title; // "Notice Title"
   * ```
   */
  parseList: (
    html: string,
  ) => Promise<ParsedTargetListItem[]> | ParsedTargetListItem[];

  /**
   * Method to structurally parse data from a detail page (HTML).
   * Synchronous parsing with clear rules is recommended, but async is supported to allow LLM/external backends.
   *
   * @param html Original HTML string of the detail page
   * @returns Parsed detail information
   */
  parseDetail: (
    html: string,
  ) => Promise<ParsedTargetDetail> | ParsedTargetDetail;
};

/**
 * Grouped type for crawling targets.
 * For example, groups like News, Jobs, Programs/Bids, etc.
 */
export type CrawlingTargetGroup = {
  /**
   * Identifier for a group. Any unique id works; uuid is recommended.
   * @example "group-news"
   */
  id: UniqueIdentifier;

  /**
   * Group name.
   * @example "News"
   */
  name: string;

  /**
   * Targets included in this group.
   */
  targets: CrawlingTarget[];
};
