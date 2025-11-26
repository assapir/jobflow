import { Router } from "express";
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStage,
  reorderJobs,
} from "../controllers/jobs.js";

const router = Router();

router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.post("/", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);
router.patch("/:id/stage", updateJobStage);
router.patch("/reorder", reorderJobs);

export default router;
