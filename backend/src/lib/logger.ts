import pino from "pino";
import type { Logger } from "pino";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Create pino logger with pretty printing for human-readable output
export const logger: Logger = pino({
  level: LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

// Helper to create a child logger with request context
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    ...(userId && { userId }),
  });
}

export default logger;
