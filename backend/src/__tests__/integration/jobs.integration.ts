import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { eq, asc } from "drizzle-orm";
import {
  getTestDb,
  closeTestDb,
  cleanupTestDb,
  seedTestDb,
  createTestJob,
} from "../helpers/testDb.js";
import { jobApplications, type Stage } from "../../db/schema.js";

describe("Jobs Integration Tests", () => {
  const db = getTestDb();

  before(async () => {
    // Ensure database is clean before running tests
    await cleanupTestDb();
  });

  after(async () => {
    // Clean up and close connection after all tests
    await cleanupTestDb();
    await closeTestDb();
  });

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestDb();
  });

  describe("Create Job", () => {
    it("should create a new job with all fields", async () => {
      const newJob = {
        company: "Test Company",
        position: "Software Engineer",
        location: "Remote",
        salary: "$100,000",
        linkedinUrl: "https://linkedin.com/jobs/123",
        description: "Test description",
        stage: "wishlist" as Stage,
        order: 0,
        notes: "Test notes",
      };

      const [created] = await db
        .insert(jobApplications)
        .values(newJob)
        .returning();

      assert.ok(created.id);
      assert.strictEqual(created.company, "Test Company");
      assert.strictEqual(created.position, "Software Engineer");
      assert.strictEqual(created.location, "Remote");
      assert.strictEqual(created.salary, "$100,000");
      assert.strictEqual(created.linkedinUrl, "https://linkedin.com/jobs/123");
      assert.strictEqual(created.description, "Test description");
      assert.strictEqual(created.stage, "wishlist");
      assert.strictEqual(created.order, 0);
      assert.strictEqual(created.notes, "Test notes");
      assert.ok(created.createdAt instanceof Date);
      assert.ok(created.updatedAt instanceof Date);
    });

    it("should create a job with only required fields", async () => {
      const newJob = {
        company: "Minimal Company",
        position: "Developer",
      };

      const [created] = await db
        .insert(jobApplications)
        .values(newJob)
        .returning();

      assert.ok(created.id);
      assert.strictEqual(created.company, "Minimal Company");
      assert.strictEqual(created.position, "Developer");
      assert.strictEqual(created.location, null);
      assert.strictEqual(created.salary, null);
      assert.strictEqual(created.stage, "wishlist"); // Default value
      assert.strictEqual(created.order, 0); // Default value
    });

    it("should generate unique UUIDs for each job", async () => {
      const [job1] = await db
        .insert(jobApplications)
        .values({ company: "Company 1", position: "Position 1" })
        .returning();

      const [job2] = await db
        .insert(jobApplications)
        .values({ company: "Company 2", position: "Position 2" })
        .returning();

      assert.notStrictEqual(job1.id, job2.id);
    });
  });

  describe("Read Jobs", () => {
    it("should fetch all jobs ordered by order field", async () => {
      await createTestJob({ company: "Company B", order: 1 });
      await createTestJob({ company: "Company A", order: 0 });
      await createTestJob({ company: "Company C", order: 2 });

      const jobs = await db
        .select()
        .from(jobApplications)
        .orderBy(asc(jobApplications.order));

      assert.strictEqual(jobs.length, 3);
      assert.strictEqual(jobs[0].company, "Company A");
      assert.strictEqual(jobs[1].company, "Company B");
      assert.strictEqual(jobs[2].company, "Company C");
    });

    it("should fetch a single job by ID", async () => {
      const created = await createTestJob({ company: "Find Me" });

      const [found] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, created.id));

      assert.ok(found);
      assert.strictEqual(found.company, "Find Me");
    });

    it("should return empty array when no jobs exist", async () => {
      const jobs = await db.select().from(jobApplications);
      assert.strictEqual(jobs.length, 0);
    });
  });

  describe("Update Job", () => {
    it("should update job fields", async () => {
      const created = await createTestJob({ company: "Original Company" });

      const [updated] = await db
        .update(jobApplications)
        .set({
          company: "Updated Company",
          position: "Updated Position",
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, created.id))
        .returning();

      assert.strictEqual(updated.company, "Updated Company");
      assert.strictEqual(updated.position, "Updated Position");
      assert.ok(updated.updatedAt > created.updatedAt);
    });

    it("should update job stage", async () => {
      const created = await createTestJob({ stage: "wishlist" });

      const [updated] = await db
        .update(jobApplications)
        .set({
          stage: "applied",
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, created.id))
        .returning();

      assert.strictEqual(updated.stage, "applied");
    });

    it("should update job order", async () => {
      const created = await createTestJob({ order: 0 });

      const [updated] = await db
        .update(jobApplications)
        .set({
          order: 5,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, created.id))
        .returning();

      assert.strictEqual(updated.order, 5);
    });

    it("should allow setting optional fields to null", async () => {
      const created = await createTestJob({
        location: "NYC",
        salary: "$100k",
        notes: "Some notes",
      });

      const [updated] = await db
        .update(jobApplications)
        .set({
          location: null,
          salary: null,
          notes: null,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, created.id))
        .returning();

      assert.strictEqual(updated.location, null);
      assert.strictEqual(updated.salary, null);
      assert.strictEqual(updated.notes, null);
    });
  });

  describe("Delete Job", () => {
    it("should delete a job by ID", async () => {
      const created = await createTestJob();

      const [deleted] = await db
        .delete(jobApplications)
        .where(eq(jobApplications.id, created.id))
        .returning();

      assert.ok(deleted);
      assert.strictEqual(deleted.id, created.id);

      // Verify it's actually deleted
      const [found] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, created.id));

      assert.strictEqual(found, undefined);
    });

    it("should return empty when deleting non-existent job", async () => {
      const result = await db
        .delete(jobApplications)
        .where(eq(jobApplications.id, "00000000-0000-0000-0000-000000000000"))
        .returning();

      assert.strictEqual(result.length, 0);
    });
  });

  describe("Stage Filtering", () => {
    it("should filter jobs by stage", async () => {
      await createTestJob({ stage: "wishlist" });
      await createTestJob({ stage: "applied" });
      await createTestJob({ stage: "applied" });
      await createTestJob({ stage: "interview" });

      const appliedJobs = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.stage, "applied"));

      assert.strictEqual(appliedJobs.length, 2);
      appliedJobs.forEach((job) => {
        assert.strictEqual(job.stage, "applied");
      });
    });

    it("should return empty array for stage with no jobs", async () => {
      await createTestJob({ stage: "wishlist" });

      const offerJobs = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.stage, "offer"));

      assert.strictEqual(offerJobs.length, 0);
    });
  });

  describe("Batch Operations", () => {
    it("should handle batch updates for reordering", async () => {
      const job1 = await createTestJob({
        company: "A",
        stage: "wishlist",
        order: 0,
      });
      const job2 = await createTestJob({
        company: "B",
        stage: "wishlist",
        order: 1,
      });
      const job3 = await createTestJob({
        company: "C",
        stage: "wishlist",
        order: 2,
      });

      // Reorder: C -> 0, A -> 1, B -> 2
      const updates = [
        { id: job3.id, order: 0 },
        { id: job1.id, order: 1 },
        { id: job2.id, order: 2 },
      ];

      await Promise.all(
        updates.map((update) =>
          db
            .update(jobApplications)
            .set({ order: update.order, updatedAt: new Date() })
            .where(eq(jobApplications.id, update.id))
        )
      );

      const jobs = await db
        .select()
        .from(jobApplications)
        .orderBy(asc(jobApplications.order));

      assert.strictEqual(jobs[0].company, "C");
      assert.strictEqual(jobs[1].company, "A");
      assert.strictEqual(jobs[2].company, "B");
    });

    it("should handle moving job to different stage", async () => {
      const job = await createTestJob({ stage: "wishlist", order: 0 });

      await db
        .update(jobApplications)
        .set({
          stage: "interview",
          order: 0,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, job.id));

      const [updated] = await db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, job.id));

      assert.strictEqual(updated.stage, "interview");
    });
  });

  describe("Seed and Cleanup", () => {
    it("should seed test database correctly", async () => {
      const seeded = await seedTestDb();

      assert.strictEqual(seeded.length, 3);
      assert.ok(seeded.every((job) => job.id));

      const allJobs = await db.select().from(jobApplications);
      assert.strictEqual(allJobs.length, 3);
    });
  });
});
