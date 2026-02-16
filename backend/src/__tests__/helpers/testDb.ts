import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema.js";

// Test database connection string - uses a separate test database
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5434/jobflow_test";

let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the test database connection
 */
export function getTestDb() {
  if (!testDb) {
    testClient = postgres(TEST_DATABASE_URL);
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}

/**
 * Close the test database connection
 */
export async function closeTestDb() {
  if (testClient) {
    await testClient.end();
    testClient = null;
    testDb = null;
  }
}

/**
 * Clean up all data from the test database
 */
export async function cleanupTestDb() {
  const db = getTestDb();
  // Delete all job applications
  await db.delete(schema.jobApplications);
}

/**
 * Seed the test database with sample data
 */
export async function seedTestDb() {
  const db = getTestDb();

  const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

  const testJobs: schema.NewJobApplication[] = [
    {
      userId: TEST_USER_ID,
      company: "Test Company A",
      position: "Software Engineer",
      location: "Remote",
      salary: "$100,000",
      linkedinUrl: "https://linkedin.com/jobs/1",
      description: "Test job 1",
      stage: "wishlist",
      order: 0,
      notes: "Test notes 1",
    },
    {
      userId: TEST_USER_ID,
      company: "Test Company B",
      position: "Senior Developer",
      location: "NYC",
      salary: "$150,000",
      linkedinUrl: null,
      description: "Test job 2",
      stage: "applied",
      order: 0,
      notes: null,
    },
    {
      userId: TEST_USER_ID,
      company: "Test Company C",
      position: "Tech Lead",
      location: "SF",
      salary: "$200,000",
      linkedinUrl: "https://linkedin.com/jobs/3",
      description: null,
      stage: "interview",
      order: 0,
      notes: "Scheduled for Friday",
    },
  ];

  const inserted = await db
    .insert(schema.jobApplications)
    .values(testJobs)
    .returning();
  return inserted;
}

/**
 * Create a single test job
 */
export async function createTestJob(
  overrides: Partial<schema.NewJobApplication> = {}
) {
  const db = getTestDb();

  const defaultJob: schema.NewJobApplication = {
    userId: "00000000-0000-0000-0000-000000000001",
    company: "Test Company",
    position: "Test Position",
    location: "Test Location",
    salary: "$100,000",
    linkedinUrl: null,
    description: null,
    stage: "wishlist",
    order: 0,
    notes: null,
    ...overrides,
  };

  const [job] = await db
    .insert(schema.jobApplications)
    .values(defaultJob)
    .returning();
  return job;
}
