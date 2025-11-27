import type { Request, Response } from "express";
import { z } from "zod";
import { searchJobs, clearCache } from "../services/linkedinScraper.js";

// Simple rate limiting
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 1000; // 1 second between requests per IP

const searchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  location: z.string().optional(),
});

export async function searchLinkedInJobs(req: Request, res: Response) {
  try {
    // Rate limiting check
    const clientIP = req.ip || req.socket.remoteAddress || "unknown";
    const lastRequest = rateLimitMap.get(clientIP);
    const now = Date.now();

    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
      const waitTime = Math.ceil(
        (RATE_LIMIT_WINDOW - (now - lastRequest)) / 1000
      );
      return res.status(429).json({
        error: "Too many requests",
        message: `Please wait ${waitTime} seconds before searching again`,
        retryAfter: waitTime,
      });
    }

    // Validate query parameters
    const validation = searchSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.issues,
      });
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
  } catch (error) {
    console.error("LinkedIn search error:", error);
    return res.status(500).json({
      error: "Search failed",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

export async function clearLinkedInCache(_req: Request, res: Response) {
  try {
    clearCache();
    return res.json({
      success: true,
      message: "Cache cleared",
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    return res.status(500).json({
      error: "Failed to clear cache",
    });
  }
}
