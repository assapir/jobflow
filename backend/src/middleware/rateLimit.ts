import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter.
 * Creates a middleware that limits requests per IP within a time window.
 */
export function rateLimit({
  windowMs,
  maxRequests,
  message,
}: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired entries
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, windowMs);

  // Allow garbage collection if the process is shutting down
  cleanupInterval.unref();

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      // New window
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new AppError(
        429,
        message || `Too many requests. Retry after ${retryAfter} seconds.`
      );
    }

    next();
  };
}
