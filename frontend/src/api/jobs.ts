import type {
  JobApplication,
  CreateJobInput,
  UpdateJobInput,
  ReorderInput,
} from "../types/job";
import { fetchWithAuth } from "./client";

const API_BASE = "/api/jobs";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

export async function fetchJobs(): Promise<JobApplication[]> {
  const response = await fetchWithAuth(API_BASE);
  return handleResponse<JobApplication[]>(response);
}

export async function fetchJob(id: string): Promise<JobApplication> {
  const response = await fetchWithAuth(`${API_BASE}/${id}`);
  return handleResponse<JobApplication>(response);
}

export async function createJob(data: CreateJobInput): Promise<JobApplication> {
  const response = await fetchWithAuth(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse<JobApplication>(response);
}

export async function updateJob(
  id: string,
  data: UpdateJobInput
): Promise<JobApplication> {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse<JobApplication>(response);
}

export async function deleteJob(id: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Request failed");
  }
}

export async function updateJobStage(
  id: string,
  stage: string,
  order: number
): Promise<JobApplication> {
  const response = await fetchWithAuth(`${API_BASE}/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stage, order }),
  });
  return handleResponse<JobApplication>(response);
}

export async function reorderJobs(
  data: ReorderInput
): Promise<JobApplication[]> {
  const response = await fetchWithAuth(`${API_BASE}/reorder`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return handleResponse<JobApplication[]>(response);
}
