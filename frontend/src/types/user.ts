export interface User {
  id: string;
  name: string;
  email: string | null;
  profilePicture: string | null;
  country?: string | null;
}

export type Profession =
  | "engineering"
  | "product"
  | "design"
  | "marketing"
  | "sales"
  | "operations"
  | "hr"
  | "finance"
  | "other";

export type ExperienceLevel =
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "executive";

export interface UserProfile {
  id: string;
  profession: Profession | null;
  experienceLevel: ExperienceLevel | null;
  preferredLocation: string | null;
  onboardingCompleted: boolean;
}

export interface ProfileResponse {
  user: User;
  profile: UserProfile;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
