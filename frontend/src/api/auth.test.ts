import { describe, it, expect, beforeEach } from "vitest";
import { mockFetch } from "../test/setup";
import { getLinkedInAuthUrl, refreshToken, getCurrentUser, logout, getAuthStatus, devLogin } from "./auth";

describe("Auth API", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("getAuthStatus", () => {
    it("should fetch auth status", async () => {
      const mockStatus = {
        linkedInConfigured: true,
        devAuthEnabled: false,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await getAuthStatus();

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/status", {
        credentials: "include",
      });
      expect(result).toEqual(mockStatus);
    });

    it("should throw error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getAuthStatus()).rejects.toThrow("Failed to get auth status");
    });
  });

  describe("devLogin", () => {
    it("should login with dev bypass", async () => {
      const mockResponse = {
        accessToken: "dev-token",
        user: {
          id: "dev-user-123",
          name: "Dev User",
          email: "dev@localhost",
          profilePicture: null,
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await devLogin();

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/dev-login", {
        method: "POST",
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when dev login is disabled", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(devLogin()).rejects.toThrow("Dev login failed");
    });
  });

  describe("getLinkedInAuthUrl", () => {
    it("should fetch LinkedIn auth URL", async () => {
      const mockAuthUrl = "https://www.linkedin.com/oauth/v2/authorization?client_id=test";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authUrl: mockAuthUrl }),
      });

      const result = await getLinkedInAuthUrl();

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/linkedin", {
        credentials: "include",
      });
      expect(result).toBe(mockAuthUrl);
    });

    it("should throw error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(getLinkedInAuthUrl()).rejects.toThrow(
        "Failed to initiate LinkedIn authentication"
      );
    });

    it("should throw LINKEDIN_NOT_CONFIGURED when dev auth is enabled but LinkedIn not configured", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ devAuthEnabled: true }),
      });

      await expect(getLinkedInAuthUrl()).rejects.toThrow("LINKEDIN_NOT_CONFIGURED");
    });
  });

  describe("refreshToken", () => {
    it("should refresh access token", async () => {
      const mockResponse = {
        accessToken: "new-access-token",
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
          profilePicture: null,
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await refreshToken();

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when refresh fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(refreshToken()).rejects.toThrow("Failed to refresh token");
    });
  });

  describe("getCurrentUser", () => {
    it("should fetch current user info", async () => {
      const mockUser = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        profilePicture: "https://example.com/pic.jpg",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await getCurrentUser("test-access-token");

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/me", {
        headers: {
          Authorization: "Bearer test-access-token",
        },
        credentials: "include",
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(getCurrentUser("invalid-token")).rejects.toThrow(
        "Failed to get user info"
      );
    });
  });

  describe("logout", () => {
    it("should call logout endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Logged out successfully" }),
      });

      await logout();

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    });

    it("should not throw even if request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // logout doesn't throw, it just completes
      await expect(logout()).resolves.toBeUndefined();
    });
  });
});
