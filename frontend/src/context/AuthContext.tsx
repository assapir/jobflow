import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "../types/user";
import {
  getLinkedInAuthUrl,
  refreshToken,
  logout as apiLogout,
  getAuthStatus,
  devLogin as apiDevLogin,
  type AuthStatus,
} from "../api/auth";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus | null;
  login: () => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthFromCallback: (token: string) => Promise<void>;
  getAccessToken: () => string | null;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    }
  }, []);

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
        accessToken,
        isAuthenticated,
        isLoading,
        authStatus,
        login,
        devLogin,
        logout,
        setAuthFromCallback,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
