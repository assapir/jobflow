import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, UserProfile } from "../types/user";
import {
  getLinkedInAuthUrl,
  refreshToken,
  logout as apiLogout,
  getAuthStatus,
  devLogin as apiDevLogin,
  getProfile as apiGetProfile,
  updateProfile as apiUpdateProfile,
  type AuthStatus,
  type UpdateProfileInput,
} from "../api/auth";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  authStatus: AuthStatus | null;
  login: () => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthFromCallback: (token: string) => Promise<void>;
  getAccessToken: () => string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  const isAuthenticated = !!user && !!accessToken;

  // Try to refresh token and get auth status on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // Get auth status first
        const status = await getAuthStatus();
        setAuthStatus(status);
      } catch {
        // Default status if endpoint fails
        setAuthStatus({ linkedInConfigured: false, devAuthEnabled: false });
      }

      try {
        const response = await refreshToken();
        setAccessToken(response.accessToken);
        setUser(response.user);
      } catch {
        // Not authenticated, that's okay
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // Set up token refresh interval (refresh 1 minute before expiry)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await refreshToken();
        setAccessToken(response.accessToken);
        setUser(response.user);
      } catch {
        // Token refresh failed, user needs to re-login
        setAccessToken(null);
        setUser(null);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15)

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = useCallback(async () => {
    const authUrl = await getLinkedInAuthUrl();
    window.location.href = authUrl;
  }, []);

  const devLogin = useCallback(async () => {
    const response = await apiDevLogin();
    setAccessToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;

    setIsProfileLoading(true);
    try {
      const response = await apiGetProfile(accessToken);
      setUser(response.user);
      setProfile(response.profile);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsProfileLoading(false);
    }
  }, [accessToken]);

  const updateProfileFn = useCallback(
    async (data: UpdateProfileInput) => {
      if (!accessToken) throw new Error("Not authenticated");

      const response = await apiUpdateProfile(accessToken, data);
      setUser(response.user);
      setProfile(response.profile);
    },
    [accessToken]
  );

  const setAuthFromCallback = useCallback(async (token: string) => {
    setAccessToken(token);
    // The user info will be fetched on next refresh
    // For now, try to get user from refresh endpoint
    try {
      const response = await refreshToken();
      setAccessToken(response.accessToken);
      setUser(response.user);
    } catch {
      // Use the token we got
      setAccessToken(token);
    }
  }, []);

  const getAccessToken = useCallback(() => accessToken, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        accessToken,
        isAuthenticated,
        isLoading,
        isProfileLoading,
        authStatus,
        login,
        devLogin,
        logout,
        setAuthFromCallback,
        getAccessToken,
        fetchProfile,
        updateProfile: updateProfileFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
