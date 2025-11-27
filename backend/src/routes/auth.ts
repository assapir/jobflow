import { Router } from "express";
import {
  initiateLinkedInAuth,
  handleLinkedInCallback,
  refreshAccessToken,
  getCurrentUser,
  logout,
  getAuthStatus,
  devLogin,
} from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Auth status (check if LinkedIn is configured, dev mode, etc.)
router.get("/status", getAuthStatus);

// Dev-only login bypass
router.post("/dev-login", devLogin);

// Initiate LinkedIn OAuth flow
router.get("/linkedin", initiateLinkedInAuth);

// Handle LinkedIn OAuth callback
router.get("/linkedin/callback", handleLinkedInCallback);

// Refresh access token
router.post("/refresh", refreshAccessToken);

// Get current user (protected)
router.get("/me", requireAuth, getCurrentUser);

// Logout
router.post("/logout", logout);

export default router;
