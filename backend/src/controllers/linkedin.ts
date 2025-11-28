import type { Request, Response } from "express";
import { z } from "zod";
import { searchJobs, clearCache } from "../services/linkedinScraper.js";
import { AppError } from "../middleware/errorHandler.js";

// Simple rate limiting
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 1000; // 1 second between requests per IP

const searchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  location: z.string().optional(),
});

export async function searchLinkedInJobs(req: Request, res: Response) {
  // Rate limiting check
  const clientIP = req.ip || req.socket.remoteAddress || "unknown";
  const lastRequest = rateLimitMap.get(clientIP);
  const now = Date.now();

  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
    const waitTime = Math.ceil(
      (RATE_LIMIT_WINDOW - (now - lastRequest)) / 1000
    );
    throw new AppError(
      429,
      `Please wait ${waitTime} seconds before searching again`
    );
  }

  // Validate query parameters
  const validation = searchSchema.safeParse(req.query);
  if (!validation.success) {
    throw new AppError(400, "Invalid request");
  }

  const { q: query, location } = validation.data;

  // Update rate limit timestamp
  rateLimitMap.set(clientIP, now);

  // Clean up old rate limit entries
  for (const [ip, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(ip);
    }
  }

  // Perform search
  const result = await searchJobs(query, location);

  return res.json({
    success: true,
    ...result,
  });
}

export async function clearLinkedInCache(_req: Request, res: Response) {
  clearCache();
  return res.json({
    success: true,
    message: "Cache cleared",
  });
}
