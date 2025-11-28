import { noop } from 'es-toolkit';

// Minimal logging executor stub injected via base Chain config
export const makeLoggingExecutor = () => ({
  executeWithLogging: vi.fn(async (cfg: any, fn: () => Promise<any>) => {
    const result = await fn();
    if (cfg?.doneFields) {
      try {
        cfg.doneFields(result);
      } catch {
        noop();
      }
    }
    return result;
  }),
});
