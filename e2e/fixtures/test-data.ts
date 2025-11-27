/**
 * Test data fixtures for E2E tests
 */

export const testJobs = {
  valid: {
    company: "Test Company E2E",
    position: "Software Engineer",
    location: "Remote",
    salary: "$150,000",
    linkedinUrl: "https://linkedin.com/jobs/test123",
    description: "A test job for E2E testing",
    notes: "Test notes for automation",
  },
  minimal: {
    company: "Minimal Corp",
    position: "Developer",
  },
  updated: {
    company: "Updated Company Name",
    position: "Senior Software Engineer",
    location: "New York, NY",
    salary: "$200,000",
  },
};

export const stages = {
  wishlist: "Wishlist",
  applied: "Applied",
  phoneScreen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

/**
 * Generate a unique company name for test isolation
 */
export function uniqueCompanyName(prefix = "Test"): string {
  return `${prefix} Company ${Date.now()}`;
}

/**
 * Generate a unique job data object
 */
export function uniqueJobData(overrides: Partial<typeof testJobs.valid> = {}) {
  return {
    ...testJobs.valid,
    company: uniqueCompanyName(),
    ...overrides,
  };
}
