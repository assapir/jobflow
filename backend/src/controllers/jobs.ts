import { Request, Response } from "express";
import { eq, asc } from "drizzle-orm";
import {
  db,
  jobApplications,
  type Stage,
  type NewJobApplication,
} from "../db/index.js";
import { z } from "zod";

const stageValues = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
] as const;

const createJobSchema = z.object({
  company: z.string().min(1).max(255),
  position: z.string().min(1).max(255),
  location: z.string().max(255).optional(),
  salary: z.string().max(100).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  stage: z.enum(stageValues).optional(),
  notes: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
});

const updateJobSchema = createJobSchema.partial();

const reorderSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string().uuid(),
      stage: z.enum(stageValues),
      order: z.number().int().min(0),
    })
  ),
});

export async function getAllJobs(_req: Request, res: Response) {
  try {
    const jobs = await db
      .select()
      .from(jobApplications)
      .orderBy(asc(jobApplications.order));
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}

export async function getJobById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [job] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
}

export async function createJob(req: Request, res: Response) {
  try {
    const validation = createJobSchema.safeParse(req.body);

    if (!validation.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: validation.error.errors });
    }

    const data = validation.data;

    // Get max order for the stage
    const existingJobs = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.stage, (data.stage || "wishlist") as Stage));

    const maxOrder = existingJobs.reduce(
      (max, job) => Math.max(max, job.order),
      -1
    );

    const newJob: NewJobApplication = {
      company: data.company,
      position: data.position,
      location: data.location || null,
      salary: data.salary || null,
      linkedinUrl: data.linkedinUrl || null,
      description: data.description || null,
      stage: (data.stage || "wishlist") as Stage,
      order: maxOrder + 1,
      notes: data.notes || null,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
    };

    const [job] = await db.insert(jobApplications).values(newJob).returning();
    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
}

export async function updateJob(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validation = updateJobSchema.safeParse(req.body);

    if (!validation.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: validation.error.errors });
    }

    const data = validation.data;

    const updateData: Partial<NewJobApplication> = {
      ...(data.company && { company: data.company }),
      ...(data.position && { position: data.position }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.salary !== undefined && { salary: data.salary || null }),
      ...(data.linkedinUrl !== undefined && {
        linkedinUrl: data.linkedinUrl || null,
      }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.stage && { stage: data.stage as Stage }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
      ...(data.appliedAt !== undefined && {
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
      }),
      updatedAt: new Date(),
    };

    const [job] = await db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, id))
      .returning();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
}

export async function deleteJob(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [job] = await db
      .delete(jobApplications)
      .where(eq(jobApplications.id, id))
      .returning();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
}

export async function updateJobStage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { stage, order } = req.body;

    if (!stageValues.includes(stage)) {
      return res.status(400).json({ error: "Invalid stage" });
    }

    const [job] = await db
      .update(jobApplications)
      .set({
        stage: stage as Stage,
        order: order ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, id))
      .returning();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error updating job stage:", error);
    res.status(500).json({ error: "Failed to update job stage" });
  }
}

export async function reorderJobs(req: Request, res: Response) {
  try {
    const validation = reorderSchema.safeParse(req.body);

    if (!validation.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: validation.error.errors });
    }

    const { jobs } = validation.data;

    // Update all jobs in the batch
    const updates = jobs.map(async (job) => {
      return db
        .update(jobApplications)
        .set({
          stage: job.stage as Stage,
          order: job.order,
          updatedAt: new Date(),
        })
        .where(eq(jobApplications.id, job.id));
    });

    await Promise.all(updates);

    // Return updated jobs
    const updatedJobs = await db
      .select()
      .from(jobApplications)
      .orderBy(asc(jobApplications.order));
    res.json(updatedJobs);
  } catch (error) {
    console.error("Error reordering jobs:", error);
    res.status(500).json({ error: "Failed to reorder jobs" });
  }
}
