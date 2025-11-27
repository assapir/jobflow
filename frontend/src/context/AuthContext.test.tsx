import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { mockFetch } from "../test/setup";

// Mock window.location
const mockLocation = {
  href: "",
  pathname: "/",
  search: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, devLogin, authStatus } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="user">{user ? user.name : "null"}</div>
      <div data-testid="devAuthEnabled">{String(authStatus?.devAuthEnabled ?? "null")}</div>
      <div data-testid="linkedInConfigured">{String(authStatus?.linkedInConfigured ?? "null")}</div>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={devLogin}>DevLogin</button>
    </div>
  );
}

// Helper to mock auth status and refresh calls
function mockInitialAuthCalls(options: {
  authStatus?: { linkedInConfigured: boolean; devAuthEnabled: boolean };
  refreshSuccess?: boolean;
  user?: { id: string; name: string; email: string; profilePicture: null };
}) {
  // First call: getAuthStatus
  if (options.authStatus) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => options.authStatus,
    });
  } else {
    mockFetch.mockRejectedValueOnce(new Error("Failed"));
  }

  // Second call: refreshToken
  if (options.refreshSuccess && options.user) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: "token",
        user: options.user,
      }),
    });
  } else {
    mockFetch.mockRejectedValueOnce(new Error("Not authenticated"));
  }
}

describe("AuthContext", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockLocation.href = "";
    mockLocation.pathname = "/";
    mockLocation.search = "";
  });

  describe("Initial state", () => {
    it("should start in loading state and try to refresh token", async () => {
      mockInitialAuthCalls({
        authStatus: { linkedInConfigured: false, devAuthEnabled: true },
        refreshSuccess: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially loading
      expect(screen.getByTestId("loading").textContent).toBe("true");

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      // Should not be authenticated
      expect(screen.getByTestId("authenticated").textContent).toBe("false");
      expect(screen.getByTestId("user").textContent).toBe("null");
    });

    it("should restore session from refresh token", async () => {
      mockInitialAuthCalls({
        authStatus: { linkedInConfigured: true, devAuthEnabled: false },
        refreshSuccess: true,
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
          profilePicture: null,
        },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("authenticated").textContent).toBe("true");
      expect(screen.getByTestId("user").textContent).toBe("Test User");
    });

    it("should fetch and store auth status", async () => {
      mockInitialAuthCalls({
        authStatus: { linkedInConfigured: false, devAuthEnabled: true },
        refreshSuccess: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("devAuthEnabled").textContent).toBe("true");
      expect(screen.getByTestId("linkedInConfigured").textContent).toBe("false");
    });
  });

  describe("Login", () => {
    it("should redirect to LinkedIn auth URL on login", async () => {
      mockInitialAuthCalls({
        authStatus: { linkedInConfigured: true, devAuthEnabled: false },
        refreshSuccess: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      // Mock getLinkedInAuthUrl call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authUrl: "https://linkedin.com/oauth?test=1",
        }),
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("Login"));

      await waitFor(() => {
        expect(mockLocation.href).toBe("https://linkedin.com/oauth?test=1");
      });
    });
  });

  describe("Dev Login", () => {
    it("should authenticate with dev login", async () => {
      mockInitialAuthCalls({
        authStatus: { linkedInConfigured: false, devAuthEnabled: true },
        refreshSuccess: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("false");
      });

      // Mock devLogin call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: "dev-token",
          user: {
            id: "dev-user-123",
            name: "Dev User",
            email: "dev@localhost",
            profilePicture: null,
          },
        }),
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("DevLogin"));

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
        expect(screen.getByTestId("user").textContent).toBe("Dev User");
      });
    });
  });

  describe("Logout", () => {
    it("should clear auth state on logout", async () => {
      mockInitialAuthCalls({
        authStatus: { linkedInConfigured: true, devAuthEnabled: false },
        refreshSuccess: true,
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
          profilePicture: null,
        },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
      });

      // Mock logout call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Logged out" }),
      });

      const user = userEvent.setup();
      await user.click(screen.getByText("Logout"));

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
        expect(screen.getByTestId("user").textContent).toBe("null");
      });
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });
});
