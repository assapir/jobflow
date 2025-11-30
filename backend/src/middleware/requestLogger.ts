import { Request, Response, NextFunction } from "express";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import logger from "../lib/logger.js";

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// List of headers that should be redacted from logs
const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "x-auth-token",
];

// Create pino-http middleware
export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => {
      // Redact sensitive headers
      const redactedHeaders = { ...req.headers };
      for (const header of SENSITIVE_HEADERS) {
        if (redactedHeaders[header]) {
          redactedHeaders[header] = "[REDACTED]";
        }
      }
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        headers: redactedHeaders,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
  },
  genReqId: (req) => {
    // Use existing X-Request-ID header or generate new one
    const existingId = req.headers["x-request-id"];
    if (existingId && typeof existingId === "string") {
      return existingId;
    }
    return randomUUID();
  },
  customProps: (req) => ({
    // User ID is added by auth middleware, access via Express Request
    userId: (req as unknown as Request).user?.sub,
  }),
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  // Don't log health checks to reduce noise
  autoLogging: {
    ignore: (req) => req.url === "/api/health",
  },
});

// Middleware to set request ID and response header
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Get request ID from pino-http (set by genReqId)
  const requestId = (req as Request & { id?: string }).id || randomUUID();
  req.requestId = requestId;

  // Always return the correlation ID in response headers
  res.setHeader("X-Request-ID", requestId);

  next();
}
