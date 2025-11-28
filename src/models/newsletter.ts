import type {
  HtmlString,
  IsoDateString,
  MarkdownString,
} from '~/models/common';

/**
 * Publishable final Newsletter entity.
 */
export type Newsletter = {
  /**
   * Newsletter title.
   * @example "LLM Newsletter #12"
   */
  title: string;

  /**
   * Newsletter content in Markdown. Will be applied to a template and converted to HTML.
   */
  content: MarkdownString;

  /**
   * Final HTML body of the newsletter, ready to send.
   */
  htmlBody: HtmlString;

  /**
   * Issue number of the newsletter.
   * @example 12
   */
  issueOrder: number;

  /**
   * Publication date of the newsletter in ISO format (YYYY-MM-DD). Time is not included.
   * @example "2025-10-15"
   */
  date: IsoDateString;
};
