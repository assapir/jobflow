import { Request, Response } from "express";
import { eq, asc, and } from "drizzle-orm";
import {
  db,
  jobApplications,
  stageEnum,
  type Stage,
  type NewJobApplication,
} from "../db/index.js";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler.js";

const stageValues = stageEnum.enumValues;

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

export async function getAllJobs(req: Request, res: Response) {
  const userId = req.user!.sub;
  const jobs = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .orderBy(asc(jobApplications.order));
  res.json(jobs);
}

export async function getJobById(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.sub;
  const [job] = await db
    .select()
    .from(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)));

  if (!job) {
    throw new AppError(404, "Job not found");
  }

  res.json(job);
}

export async function createJob(req: Request, res: Response) {
  const validation = createJobSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError(400, "Validation failed");
  }

  const data = validation.data;
  const userId = req.user!.sub;

  // Get max order for the stage (for this user)
  const existingJobs = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.stage, (data.stage || "wishlist") as Stage),
        eq(jobApplications.userId, userId)
      )
    );

  const maxOrder = existingJobs.reduce(
    (max, job) => Math.max(max, job.order),
    -1
  );

  const newJob: NewJobApplication = {
    userId,
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
}

export async function updateJob(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.sub;
  const validation = updateJobSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError(400, "Validation failed");
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
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning();

  if (!job) {
    throw new AppError(404, "Job not found");
  }

  res.json(job);
}

export async function deleteJob(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.sub;
  const [job] = await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning();

  if (!job) {
    throw new AppError(404, "Job not found");
  }

  res.json({ message: "Job deleted successfully" });
}

const updateStageSchema = z.object({
  stage: z.enum(stageValues),
  order: z.number().int().min(0).optional(),
});

export async function updateJobStage(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.sub;

  const validation = updateStageSchema.safeParse(req.body);
  if (!validation.success) {
    throw new AppError(400, "Validation failed");
  }

  const { stage, order } = validation.data;

  const [job] = await db
    .update(jobApplications)
    .set({
      stage: stage as Stage,
      order: order ?? 0,
      updatedAt: new Date(),
    })
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning();

  if (!job) {
    throw new AppError(404, "Job not found");
  }

  res.json(job);
}

export async function reorderJobs(req: Request, res: Response) {
  const userId = req.user!.sub;
  const validation = reorderSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError(400, "Validation failed");
  }

  const { jobs } = validation.data;

  // Update all jobs in a transaction to prevent partial reorders
  const updatedJobs = await db.transaction(async (tx) => {
    for (const job of jobs) {
      await tx
        .update(jobApplications)
        .set({
          stage: job.stage as Stage,
          order: job.order,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(jobApplications.id, job.id),
            eq(jobApplications.userId, userId)
          )
        );
    }

    return tx
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(asc(jobApplications.order));
  });

  res.json(updatedJobs);
}
