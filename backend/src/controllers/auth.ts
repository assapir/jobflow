import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import {
  db,
  users,
  refreshTokens,
  type NewUser,
  type NewRefreshToken,
} from "../db/index.js";
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getUserInfo,
  isLinkedInConfigured,
} from "../auth/linkedin.js";
import { generateTokenPair } from "../auth/jwt.js";

// Store OAuth state temporarily (in production, use Redis or database)
const oauthStates = new Map<string, { createdAt: number }>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      // 10 minutes
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

const REFRESH_TOKEN_COOKIE = "refresh_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

// Check if dev auth bypass is enabled
function isDevAuthEnabled(): boolean {
  return (
    process.env.DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

/**
 * Check auth configuration status
 * GET /api/auth/status
 */
export async function getAuthStatus(_req: Request, res: Response) {
  res.json({
    linkedInConfigured: isLinkedInConfigured(),
    devAuthEnabled: isDevAuthEnabled(),
  });
}

/**
 * Dev-only login bypass - creates/uses a test user
 * POST /api/auth/dev-login
 */
export async function devLogin(_req: Request, res: Response) {
  if (!isDevAuthEnabled()) {
    return res.status(403).json({ error: "Dev auth bypass is not enabled" });
  }

  try {
    const devLinkedInId = "dev-user-123";

    // Find or create dev user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.linkedinId, devLinkedInId));

    if (!user) {
      const newUser: NewUser = {
        linkedinId: devLinkedInId,
        email: "dev@localhost",
        name: "Dev User",
        profilePicture: null,
      };
      [user] = await db.insert(users).values(newUser).returning();
    }

    // Generate tokens
    const tokens = generateTokenPair(
      user.id,
      user.email || undefined,
      user.name
    );

    // Store refresh token
    const newRefreshToken: NewRefreshToken = {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
    await db.insert(refreshTokens).values(newRefreshToken);

    // Set refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error in dev login:", error);
    res.status(500).json({ error: "Dev login failed" });
  }
}

/**
 * Initiate LinkedIn OAuth flow
 * GET /api/auth/linkedin
 */
export async function initiateLinkedInAuth(_req: Request, res: Response) {
  try {
    if (!isLinkedInConfigured()) {
      return res.status(503).json({
        error: "LinkedIn OAuth not configured",
        devAuthEnabled: isDevAuthEnabled(),
      });
    }

    const state = randomBytes(16).toString("hex");
    oauthStates.set(state, { createdAt: Date.now() });

    const authUrl = getAuthorizationUrl(state);
    res.json({ authUrl });
  } catch (error) {
    console.error("Error initiating LinkedIn auth:", error);
    res.status(500).json({ error: "Failed to initiate authentication" });
  }
}

/**
 * Handle LinkedIn OAuth callback
 * GET /api/auth/linkedin/callback
 */
export async function handleLinkedInCallback(req: Request, res: Response) {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=access_denied`
      );
    }

    if (
      !code ||
      !state ||
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=invalid_request`
      );
    }

    // Verify state
    if (!oauthStates.has(state)) {
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=invalid_state`
      );
    }
    oauthStates.delete(state);

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user info from LinkedIn
    const userInfo = await getUserInfo(tokenResponse.access_token);

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.linkedinId, userInfo.sub));

    if (!user) {
      // Create new user
      const newUser: NewUser = {
        linkedinId: userInfo.sub,
        email: userInfo.email || null,
        name: userInfo.name,
        profilePicture: userInfo.picture || null,
      };

      [user] = await db.insert(users).values(newUser).returning();
    } else {
      // Update existing user
      [user] = await db
        .update(users)
        .set({
          email: userInfo.email || user.email,
          name: userInfo.name,
          profilePicture: userInfo.picture || user.profilePicture,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
    }

    // Generate tokens
    const tokens = generateTokenPair(
      user.id,
      user.email || undefined,
      user.name
    );

    // Store refresh token in database
    const newRefreshToken: NewRefreshToken = {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
    await db.insert(refreshTokens).values(newRefreshToken);

    // Set refresh token in httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    // Redirect to frontend with access token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
  } catch (error) {
    console.error("Error handling LinkedIn callback:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshAccessToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Find refresh token in database
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken));

    if (!storedToken) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.id, storedToken.id));
      return res.status(401).json({ error: "Refresh token expired" });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, storedToken.userId));

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Generate new tokens (token rotation)
    const tokens = generateTokenPair(
      user.id,
      user.email || undefined,
      user.name
    );

    // Delete old refresh token and create new one
    await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

    const newRefreshToken: NewRefreshToken = {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
    await db.insert(refreshTokens).values(newRefreshToken);

    // Update cookie with new refresh token
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
}

/**
 * Get current user info
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.sub));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
}

/**
 * Logout - clear refresh token
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      // Delete refresh token from database
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));
    }

    // Clear cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
}
