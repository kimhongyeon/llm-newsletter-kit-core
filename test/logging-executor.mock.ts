export const createLoggingExecutorMock = () => {
  const instances: any[] = [];

  class LoggingExecutor {
    public logger: any;
    public taskId: any;

    constructor(logger: any, taskId: any) {
      this.logger = logger;
      this.taskId = taskId;
      instances.push(this);
    }

    async executeWithLogging<T>(meta: any, fn: () => Promise<T>) {
      // Emulate the real executor semantics enough for tests:
      // - execute the function
      // - invoke doneFields with the result if provided to improve coverage on callbacks
      const result = await fn();
      if (meta && typeof meta.doneFields === 'function') {
        try {
          meta.doneFields(result);
        } catch {
          // ignore
        }
      }
      return result;
    }

    static get instances() {
      return instances as any[];
    }
  }

  const __resetLoggingExecutor = () => {
    instances.length = 0;
  };

  return { LoggingExecutor, __resetLoggingExecutor };
};

// Default mocking object that can be used globally
export const loggingExecutorMock = createLoggingExecutorMock();
