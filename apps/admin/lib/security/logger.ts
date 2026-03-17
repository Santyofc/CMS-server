import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "authorization",
      "cookie",
      "password",
      "token",
      "secret",
      "apiKey",
      "accessKeyId",
      "secretAccessKey"
    ],
    censor: "[REDACTED]"
  },
  base: {
    service: "cms-admin"
  }
});

type LogContext = Record<string, unknown>;

export function logInfo(context: LogContext, message: string) {
  logger.info(context, message);
}

export function logError(context: LogContext, error: unknown, message = "request failed") {
  logger.error({
    ...context,
    err: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  }, message);
}

export { logger };
