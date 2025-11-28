/**
 * Global logging level type used across the project.
 */
export type LogLevel = 'debug' | 'info' | 'error';

/**
 * Structured log message format.
 * - event: Recommended "domain.action[.state]" style, e.g., "crawl.group.start" | "fetch.success" | "task.error"
 * - level: Usually implied by the called method, but can be explicit (info/debug).
 * - taskId: Identifier to correlate logs for the same job.
 * - durationMs: Include elapsed time (ms) on ".done"/".error" logs.
 * - data: Additional context. Prefer JSON‑serializable values only.
 * Examples:
 * logger.info({ event: 'task.start', taskId })
 * logger.debug({ event: 'crawl.list.fetch.start', data: { url } })
 */
export type LogMessage<
  TaskId = unknown,
  Extra extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Event name, e.g., "crawl.group.start", "fetch.success" */
  event: string;
  /** Log level (optional; implied by the method if omitted) */
  level?: LogLevel;
  /** Associated task identifier */
  taskId?: TaskId;
  /** Elapsed time in milliseconds (typically for done/error) */
  durationMs?: number;
  /** Additional data container */
  data?: Extra;
};
