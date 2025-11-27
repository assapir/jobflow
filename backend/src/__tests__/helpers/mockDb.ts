
// Types for mock database
export interface MockJob {
  id: string;
  company: string;
  position: string;
  location: string | null;
  salary: string | null;
  linkedinUrl: string | null;
  description: string | null;
  stage: string;
  order: number;
  notes: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for tests
let mockJobs: MockJob[] = [];

// Reset the mock database
export function resetMockDb() {
  mockJobs = [];
}

// Seed the mock database
export function seedMockDb(jobs: MockJob[]) {
  mockJobs = [...jobs];
}

// Get all mock jobs
export function getMockJobs() {
  return [...mockJobs];
}

// Create mock request and response objects
export function createMockRequest(overrides: Partial<{
  params: Record<string, string>;
  body: Record<string, unknown>;
  query: Record<string, string>;
}> = {}) {
  return {
    params: overrides.params || {},
    body: overrides.body || {},
    query: overrides.query || {},
  };
}

export function createMockResponse() {
  let statusCode = 200;
  let responseData: unknown = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: unknown) {
      responseData = data;
      return this;
    },
    getStatus() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
  };

  return res;
}

// Sample test data
export const sampleJobs: MockJob[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    company: "Google",
    position: "Software Engineer",
    location: "Mountain View, CA",
    salary: "$150,000",
    linkedinUrl: "https://linkedin.com/jobs/123",
    description: "Work on search algorithms",
    stage: "wishlist",
    order: 0,
    notes: "Great company",
    appliedAt: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    company: "Microsoft",
    position: "Senior Developer",
    location: "Seattle, WA",
    salary: "$180,000",
    linkedinUrl: null,
    description: "Azure team",
    stage: "applied",
    order: 0,
    notes: null,
    appliedAt: new Date("2024-01-15T00:00:00Z"),
    createdAt: new Date("2024-01-02T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    company: "Amazon",
    position: "Full Stack Developer",
    location: "Remote",
    salary: "$140,000",
    linkedinUrl: "https://linkedin.com/jobs/456",
    description: null,
    stage: "interview",
    order: 0,
    notes: "Phone screen scheduled",
    appliedAt: new Date("2024-01-10T00:00:00Z"),
    createdAt: new Date("2024-01-03T00:00:00Z"),
    updatedAt: new Date("2024-01-20T00:00:00Z"),
  },
];
