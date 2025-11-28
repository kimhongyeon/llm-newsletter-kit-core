export type ContentOptions = {
  /**
   * Output language for the newsletter. e.g., "English", "Spanish"
   * @example "English"
   */
  outputLanguage: string;

  /**
   * Target domain(s) for the newsletter (one or many)
   * @example ["AI", "Cloud"]
   */
  expertField: string | string[];
};

export type LLMQueryOptions = {
  /**
   * Number of retries when LLM calls fail.
   * @default 5
   */
  maxRetries?: number;
};

export type ChainOptions = {
  /**
   * Maximum retry attempts when the chain fails while running.
   * @default 3
   */
  stopAfterAttempt?: number;
};

export type CommonProcessingOptions = {
  content: ContentOptions;
  llm: LLMQueryOptions;
  chain: ChainOptions;
};
