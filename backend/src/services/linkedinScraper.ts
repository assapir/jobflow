import { PlaywrightCrawler } from "crawlee";

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

// Simple in-memory cache to avoid hammering LinkedIn
const cache = new Map<string, { data: SearchResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function searchJobs(
  query: string,
  location?: string
): Promise<SearchResult> {
  const cacheKey = `${query}:${location || ""}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const jobs: LinkedInJob[] = [];

  // Build LinkedIn job search URL
  const searchParams = new URLSearchParams({
    keywords: query,
    ...(location && { location }),
  });

  const searchUrl = `https://www.linkedin.com/jobs/search/?${searchParams.toString()}`;

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1,
    requestHandlerTimeoutSecs: 30,
    headless: true,
    launchContext: {
      launchOptions: {
        // Use system Chromium if available (for Alpine/ARM64)
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      },
    },
    async requestHandler({ page, log }) {
      log.info(`Scraping LinkedIn jobs: ${page.url()}`);

      // Wait for job listings to load
      try {
        await page.waitForSelector(".jobs-search__results-list", {
          timeout: 10000,
        });
      } catch {
        log.warning(
          "Could not find job results list, page might require login"
        );
        return;
      }

      // Scroll to load more jobs (LinkedIn lazy-loads)
      await page.evaluate(async () => {
        const scrollContainer = document.querySelector(
          ".jobs-search__results-list"
        );
        if (scrollContainer) {
          scrollContainer.scrollTo(0, scrollContainer.scrollHeight);
        }
      });

      // Wait a bit for lazy-loaded content
      await page.waitForTimeout(1000);

      // Extract job listings
      const jobElements = await page
        .locator(".jobs-search__results-list > li")
        .all();

      for (const jobElement of jobElements.slice(0, 25)) {
        // Limit to 25 results
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
          const postedDate =
            (await dateEl.getAttribute("datetime")) || undefined;

          if (title && company) {
            jobs.push({
              title: title.trim(),
              company: company.trim(),
              location: jobLocation.trim(),
              url: url.split("?")[0], // Remove tracking params
              postedDate,
            });
          }
        } catch (err) {
          log.warning(`Failed to extract job: ${err}`);
        }
      }
    },
  });

  try {
    await crawler.run([searchUrl]);
  } catch (error) {
    console.error("Crawler error:", error);
    throw new Error("Failed to search LinkedIn jobs");
  }

  const result: SearchResult = {
    jobs,
    totalResults: jobs.length,
  };

  // Cache the result
  cache.set(cacheKey, { data: result, timestamp: Date.now() });

  // Clean up old cache entries
  for (const [key, value] of cache.entries()) {
    if (Date.now() - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }

  return result;
}

// Clear cache (useful for testing or manual refresh)
export function clearCache(): void {
  cache.clear();
}
