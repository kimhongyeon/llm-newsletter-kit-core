/**
 * Token markers in template.
 */
export type HtmlTemplateMarkers = {
  /**
   * Title token
   *
   * When the title is set to "NEWSLETTER_TITLE", it replaces the "{{NEWSLETTER_TITLE}}" pattern in the template string.
   *
   * @default "NEWSLETTER_TITLE"
   */
  title?: string;

  /**
   * Content HTML token
   *
   * When content is set to "NEWSLETTER_CONTENT", it replaces the "{{NEWSLETTER_CONTENT}}" pattern in the template string.
   *
   * @default "NEWSLETTER_CONTENT"
   */
  content?: string;
};

/**
 * String template and marker set
 */
export type HtmlTemplate = {
  /**
   * Original template string
   */
  html: string;

  /**
   * Uses default markers when not specified
   */
  markers?: HtmlTemplateMarkers;
};

export type RequiredHtmlTemplate = Pick<HtmlTemplate, 'html'> & {
  markers: Required<HtmlTemplateMarkers>;
};
