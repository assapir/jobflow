export type Stage = 'wishlist' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string | null;
  salary: string | null;
  linkedinUrl: string | null;
  description: string | null;
  stage: Stage;
  order: number;
  notes: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  company: string;
  position: string;
  location?: string;
  salary?: string;
  linkedinUrl?: string;
  description?: string;
  stage?: Stage;
  notes?: string;
  appliedAt?: string;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {}

export interface ReorderInput {
  jobs: Array<{
    id: string;
    stage: Stage;
    order: number;
  }>;
}

export const STAGES: Stage[] = ['wishlist', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'];
