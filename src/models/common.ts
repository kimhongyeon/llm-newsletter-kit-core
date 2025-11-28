/**
 * Common type aliases.
 *
 * - Provides explicit alias types for date/URL/Markdown/HTML, etc.
 * - All comments are written in English JSDoc style.
 */

/**
 * ISO 8601 date string. Use YYYY-MM-DD without time.
 * @example "2025-10-15"
 */
export type IsoDateString = string;

/**
 * URL string pointing to external or internal resources.
 * @example "https://example.com/news/123"
 */
export type UrlString = string;

/**
 * Markdown-formatted text.
 * @example "# Title\n\nBody content."
 */
export type MarkdownString = string;

/**
 * HTML-formatted string.
 * @example "<h1>Title</h1><p>Body</p>"
 */
export type HtmlString = string;

/**
 * String-based unique identifier. Used for DOM ids, data record ids, etc.
 * @example "item-42"
 */
export type UniqueIdentifier = string;

/**
 * Type for date identifiers.
 *
 * The DateType enum is used to distinguish date-related values.
 * It can be used to differentiate between registered dates and ranges.
 *
 * Enum members:
 * - REGISTERED: indicates a registered date.
 * - DURATION: indicates a duration or time range.
 *
 * @example
 * ```ts
 * const type: DateType = DateType.REGISTERED;
 * ```
 */
export enum DateType {
  REGISTERED = 'registered',
  DURATION = 'duration',
}
