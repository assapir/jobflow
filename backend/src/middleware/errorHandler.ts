import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger.js";

// Custom error class with status code
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = req.requestId || "unknown";
  const userId = req.user?.sub;

  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Log the error with context
  logger.error({
    err,
    requestId,
    userId,
    method: req.method,
    path: req.path,
    statusCode,
  });

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    isProduction && statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  // Send error response with correlation ID
  res.status(statusCode).json({
    error: message,
    requestId,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

// 404 handler for unknown routes
export function notFoundHandler(req: Request, res: Response) {
  const requestId = req.requestId || "unknown";

  logger.warn({
    message: "Route not found",
    requestId,
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    error: "Not found",
    requestId,
  });
}
