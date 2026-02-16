import { Router } from "express";
import {
  initiateLinkedInAuth,
  handleLinkedInCallback,
  refreshAccessToken,
  getCurrentUser,
  logout,
  getAuthStatus,
  devLogin,
  getProfile,
  updateProfile,
} from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

// Rate limiters for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  message: "Too many authentication attempts. Please try again later.",
});

const refreshRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: "Too many token refresh attempts. Please try again later.",
});

// Auth status (check if LinkedIn is configured, dev mode, etc.)
router.get("/status", getAuthStatus);

// Dev-only login bypass
router.post("/dev-login", authRateLimit, devLogin);

// Initiate LinkedIn OAuth flow
router.get("/linkedin", authRateLimit, initiateLinkedInAuth);

// Handle LinkedIn OAuth callback
router.get("/linkedin/callback", authRateLimit, handleLinkedInCallback);

// Refresh access token
router.post("/refresh", refreshRateLimit, refreshAccessToken);

// Get current user (protected)
router.get("/me", requireAuth, getCurrentUser);

// Get user profile with onboarding data (protected)
router.get("/profile", requireAuth, getProfile);

// Update user profile (protected)
router.patch("/profile", requireAuth, updateProfile);

// Logout
router.post("/logout", logout);

export default router;
