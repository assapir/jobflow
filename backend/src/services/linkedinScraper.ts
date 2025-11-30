import { PlaywrightCrawler } from "crawlee";
import type { Page } from "playwright";
import logger from "../lib/logger.js";

export interface LinkedInJob {
  title: string;
  company: string;
  location: string;
  url: string;
  postedDate?: string;
}

interface SearchResult {
  jobs: LinkedInJob[];
  totalResults: number;
}

interface CacheEntry {
  data: SearchResult;
  timestamp: number;
}

interface BlockingIndicators {
  hasSignInInContent: boolean;
  hasJoinNowInContent: boolean;
  hasSignInInBody: boolean;
  hasJoinLinkedInInBody: boolean;
  urlHasLogin: boolean;
  urlHasCheckpoint: boolean;
}

// Simple in-memory cache to avoid hammering LinkedIn
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RESULTS = 25;

// Cache management
function getCacheKey(query: string, location?: string): string {
  return `${query}:${location || ""}`;
}

function getCachedResult(cacheKey: string): SearchResult | null {
  const cached = cache.get(cacheKey);
  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.timestamp;
  if (age >= CACHE_TTL) {
    cache.delete(cacheKey);
    return null;
  }

  const ageSeconds = Math.floor(age / 1000);
  logger.info(
    {
      query: cacheKey.split(":")[0],
      location: cacheKey.split(":")[1],
      cacheAge: ageSeconds,
    },
    "Returning cached LinkedIn search results"
  );
  return cached.data;
}

function setCachedResult(cacheKey: string, result: SearchResult): void {
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  logger.info(
    {
      query: cacheKey.split(":")[0],
      location: cacheKey.split(":")[1],
      jobsCount: result.jobs.length,
    },
    "Cached successful search results"
  );
}

function cleanupExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// URL construction
function buildSearchUrl(query: string, location?: string): string {
  const searchParams = new URLSearchParams({
    keywords: query,
    ...(location && { location }),
  });
  return `https://www.linkedin.com/jobs/search/?${searchParams.toString()}`;
}

// Page setup
async function setupPage(page: Page): Promise<void> {
  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  logger.debug("User-Agent header set");
}

async function waitForPageLoad(page: Page): Promise<void> {
  const loadStateStart = Date.now();
  await page
    .waitForLoadState("networkidle", { timeout: 15000 })
    .then(() => {
      const loadTime = Date.now() - loadStateStart;
      logger.debug({ loadTime }, "Page reached networkidle state");
    })
    .catch(() => {
      const loadTime = Date.now() - loadStateStart;
      logger.warn(
        { loadTime },
        "Page did not reach networkidle state within timeout"
      );
    });
}

// Blocking detection
async function checkForBlocking(page: Page): Promise<BlockingIndicators> {
  const pageContent = await page.content();
  const bodyText =
    (await page
      .locator("body")
      .textContent()
      .catch(() => null)) || "";
  const currentUrl = page.url();
  const pageTitle = await page.title().catch(() => "unknown");

  const blockingIndicators: BlockingIndicators = {
    hasSignInInContent: pageContent.includes("sign-in"),
    hasJoinNowInContent: pageContent.includes("Join now"),
    hasSignInInBody: bodyText.includes("Sign in"),
    hasJoinLinkedInInBody: bodyText.includes("Join LinkedIn"),
    urlHasLogin: currentUrl.includes("/login"),
    urlHasCheckpoint: currentUrl.includes("/checkpoint"),
  };

  logger.debug(
    {
      currentUrl,
      pageTitle,
      blockingIndicators,
      bodyTextLength: bodyText.length,
      pageContentLength: pageContent.length,
    },
    "Blocking detection analysis"
  );

  return blockingIndicators;
}

function isBlocked(indicators: BlockingIndicators): boolean {
  return Object.values(indicators).some(Boolean);
}

async function waitForJobResultsList(
  page: Page,
  query: string,
  location?: string
): Promise<void> {
  const selectorWaitStart = Date.now();
  try {
    logger.debug("Waiting for job results list selector...");
    await page.waitForSelector(".jobs-search__results-list", {
      timeout: 15000,
    });
    const selectorWaitTime = Date.now() - selectorWaitStart;
    logger.info(
      { waitTime: selectorWaitTime },
      "Job results list selector found"
    );
  } catch (error) {
    const selectorWaitTime = Date.now() - selectorWaitStart;
    logger.warn(
      {
        waitTime: selectorWaitTime,
        error: error instanceof Error ? error.message : String(error),
      },
      "Could not find job results list selector, checking for blocking"
    );

    const blockingIndicators = await checkForBlocking(page);

    if (isBlocked(blockingIndicators)) {
      logger.warn(
        { query, location, url: page.url(), blockingIndicators },
        "LinkedIn appears to be blocking access or requiring login"
      );
      throw new Error(
        "LinkedIn is blocking automated access. Please try again later or use LinkedIn's official API."
      );
    }

    logger.warn(
      {
        query,
        location,
        url: page.url(),
        pageTitle: await page.title().catch(() => "unknown"),
      },
      "Job results list selector not found, but page doesn't appear blocked"
    );
    throw new Error("Could not find job listings on LinkedIn page");
  }
}

// Scrolling
async function scrollToLoadMoreJobs(page: Page): Promise<void> {
  logger.debug("Starting scroll sequence to load lazy-loaded jobs");
  for (let i = 0; i < 3; i++) {
    const scrollStart = Date.now();
    await page.evaluate(async () => {
      const scrollContainer = document.querySelector(
        ".jobs-search__results-list"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo(0, scrollContainer.scrollHeight);
      }
    });
    await page.waitForTimeout(2000);
    const scrollTime = Date.now() - scrollStart;
    logger.debug(
      { scrollIteration: i + 1, scrollTime },
      "Completed scroll iteration"
    );
  }
}

// Job extraction
async function extractJobFromElement(
  jobElement: ReturnType<Page["locator"]>
): Promise<LinkedInJob | null> {
  try {
    const titleEl = jobElement.locator(".base-search-card__title");
    const companyEl = jobElement.locator(".base-search-card__subtitle");
    const locationEl = jobElement.locator(".job-search-card__location");
    const linkEl = jobElement.locator("a.base-card__full-link");
    const dateEl = jobElement.locator("time");

    const title = (await titleEl.textContent()) || "";
    const company = (await companyEl.textContent()) || "";
    const jobLocation = (await locationEl.textContent()) || "";
    const url = (await linkEl.getAttribute("href")) || "";
    const postedDate = (await dateEl.getAttribute("datetime")) || undefined;

    if (!title || !company) {
      logger.debug(
        { title: title || "empty", company: company || "empty" },
        "Skipped job element (missing title or company)"
      );
      return null;
    }

    return {
      title: title.trim(),
      company: company.trim(),
      location: jobLocation.trim(),
      url: url.split("?")[0], // Remove tracking params
      postedDate,
    };
  } catch (err) {
    logger.warn(
      { error: err instanceof Error ? err.message : String(err) },
      "Failed to extract job element"
    );
    return null;
  }
}

async function extractJobsFromPage(page: Page): Promise<LinkedInJob[]> {
  logger.debug("Extracting job listings from page");
  const jobElements = await page
    .locator(".jobs-search__results-list > li")
    .all();

  const totalElementsFound = jobElements.length;
  logger.info({ totalElementsFound }, "Found job elements on page");

  const jobs: LinkedInJob[] = [];
  let extractedCount = 0;
  let skippedCount = 0;

  for (const jobElement of jobElements.slice(0, MAX_RESULTS)) {
    const job = await extractJobFromElement(jobElement);
    if (job) {
      jobs.push(job);
      extractedCount++;
    } else {
      skippedCount++;
    }
  }

  logger.info(
    {
      extractedCount,
      skippedCount,
      totalElementsFound,
    },
    "Job extraction completed"
  );

  return jobs;
}

// Crawler configuration
function createCrawler(
  jobs: LinkedInJob[],
  query: string,
  location?: string
): PlaywrightCrawler {
  return new PlaywrightCrawler({
    maxRequestsPerCrawl: 5,
    requestHandlerTimeoutSecs: 45,
    headless: true,
    launchContext: {
      launchOptions: {
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      },
    },
    async requestHandler({ page, log }) {
      const startTime = Date.now();
      log.info(`Scraping LinkedIn jobs: ${page.url()}`);
      logger.info(
        { url: page.url(), query, location },
        "Navigating to LinkedIn jobs page"
      );

      await setupPage(page);
      await waitForPageLoad(page);
      await waitForJobResultsList(page, query, location);
      await scrollToLoadMoreJobs(page);

      const extractedJobs = await extractJobsFromPage(page);
      jobs.push(...extractedJobs);

      const totalTime = Date.now() - startTime;
      logger.debug({ totalTime }, "Request handler completed");
    },
  });
}

// Main search function
export async function searchJobs(
  query: string,
  location?: string
): Promise<SearchResult> {
  const cacheKey = getCacheKey(query, location);
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  logger.info({ query, location }, "Starting LinkedIn job search (not cached)");

  const jobs: LinkedInJob[] = [];
  const searchUrl = buildSearchUrl(query, location);
  logger.debug({ searchUrl }, "LinkedIn search URL constructed");

  const crawler = createCrawler(jobs, query, location);

  const crawlStartTime = Date.now();
  try {
    logger.debug({ searchUrl }, "Starting crawler execution");
    await crawler.run([searchUrl]);
    const crawlTime = Date.now() - crawlStartTime;
    logger.info(
      { crawlTime, jobsFound: jobs.length },
      "Crawler execution completed"
    );
  } catch (error) {
    const crawlTime = Date.now() - crawlStartTime;
    logger.error(
      {
        err: error,
        query,
        location,
        crawlTime,
        jobsFound: jobs.length,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      "LinkedIn crawler error"
    );
    throw error instanceof Error
      ? error
      : new Error("Failed to search LinkedIn jobs");
  }

  const result: SearchResult = {
    jobs,
    totalResults: jobs.length,
  };

  if (jobs.length === 0) {
    logger.warn(
      { query, location, jobsCount: 0 },
      "No jobs found - not caching empty result to allow retry"
    );
    return result;
  }

  setCachedResult(cacheKey, result);
  cleanupExpiredCacheEntries();

  return result;
}

// Clear cache (useful for testing or manual refresh)
export function clearCache(): void {
  cache.clear();
}
