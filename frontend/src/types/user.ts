export interface User {
  id: string;
  name: string;
  email: string | null;
  profilePicture: string | null;
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
