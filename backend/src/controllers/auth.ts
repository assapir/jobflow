import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import {
  db,
  users,
  refreshTokens,
  userProfiles,
  type NewUser,
  type NewRefreshToken,
  type NewUserProfile,
  type Profession,
  type ExperienceLevel,
} from "../db/index.js";
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getUserInfo,
  isLinkedInConfigured,
} from "../auth/linkedin.js";
import { generateTokenPair } from "../auth/jwt.js";
import { AppError } from "../middleware/errorHandler.js";
import logger from "../lib/logger.js";

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
    throw new AppError(403, "Dev auth bypass is not enabled");
  }

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
  const tokens = generateTokenPair(user.id, user.email || undefined, user.name);

  // Store refresh token
  const newRefreshToken: NewRefreshToken = {
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  };
  await db.insert(refreshTokens).values(newRefreshToken);

  // Set refresh token cookie
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

  logger.info({ userId: user.id }, "Dev login successful");

  res.json({
    accessToken: tokens.accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    },
  });
}

/**
 * Initiate LinkedIn OAuth flow
 * GET /api/auth/linkedin
 */
export async function initiateLinkedInAuth(_req: Request, res: Response) {
  if (!isLinkedInConfigured()) {
    throw new AppError(503, "LinkedIn OAuth not configured");
  }

  const state = randomBytes(16).toString("hex");
  oauthStates.set(state, { createdAt: Date.now() });

  const authUrl = getAuthorizationUrl(state);
  res.json({ authUrl });
}

/**
 * Handle LinkedIn OAuth callback
 * GET /api/auth/linkedin/callback
 */
export async function handleLinkedInCallback(req: Request, res: Response) {
  const { code, state, error: oauthError } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (oauthError) {
    logger.warn({ error: oauthError }, "LinkedIn OAuth denied");
    return res.redirect(`${frontendUrl}/login?error=access_denied`);
  }

  if (
    !code ||
    !state ||
    typeof code !== "string" ||
    typeof state !== "string"
  ) {
    return res.redirect(`${frontendUrl}/login?error=invalid_request`);
  }

  // Verify state
  if (!oauthStates.has(state)) {
    return res.redirect(`${frontendUrl}/login?error=invalid_state`);
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
      country: userInfo.locale?.country || null,
    };

    [user] = await db.insert(users).values(newUser).returning();
    logger.info({ userId: user.id }, "New user created via LinkedIn");
  } else {
    // Update existing user
    [user] = await db
      .update(users)
      .set({
        email: userInfo.email || user.email,
        name: userInfo.name,
        profilePicture: userInfo.picture || user.profilePicture,
        country: userInfo.locale?.country || user.country,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
  }

  // Generate tokens
  const tokens = generateTokenPair(user.id, user.email || undefined, user.name);

  // Store refresh token in database
  const newRefreshToken: NewRefreshToken = {
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  };
  await db.insert(refreshTokens).values(newRefreshToken);

  // Set refresh token in httpOnly cookie
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

  logger.info({ userId: user.id }, "LinkedIn login successful");

  // Redirect to frontend with access token
  res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshAccessToken(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    throw new AppError(401, "No refresh token provided");
  }

  // Find refresh token in database
  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, refreshToken));

  if (!storedToken) {
    throw new AppError(401, "Invalid refresh token");
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
    throw new AppError(401, "Refresh token expired");
  }

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, storedToken.userId));

  if (!user) {
    throw new AppError(401, "User not found");
  }

  // Generate new tokens (token rotation)
  const tokens = generateTokenPair(user.id, user.email || undefined, user.name);

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
}

/**
 * Get current user info
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user.sub));

  if (!user) {
    throw new AppError(404, "User not found");
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
  });
}

/**
 * Logout - clear refresh token
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (refreshToken) {
    // Delete refresh token from database
    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
  }

  // Clear cookie
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });

  logger.info({ userId: req.user?.sub }, "User logged out");

  res.json({ message: "Logged out successfully" });
}

/**
 * Get user profile (with onboarding data)
 * Auto-creates profile if it doesn't exist
 * GET /api/auth/profile
 */
export async function getProfile(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user.sub));

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Find or create profile
  let [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id));

  if (!profile) {
    // Auto-create profile with default preferredLocation from user's country
    const newProfile: NewUserProfile = {
      userId: user.id,
      preferredLocation: user.country || null,
      onboardingCompleted: false,
    };
    [profile] = await db.insert(userProfiles).values(newProfile).returning();
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      country: user.country,
    },
    profile: {
      id: profile.id,
      profession: profile.profession,
      experienceLevel: profile.experienceLevel,
      preferredLocation: profile.preferredLocation,
      onboardingCompleted: profile.onboardingCompleted,
    },
  });
}

/**
 * Update user profile
 * PATCH /api/auth/profile
 */
export async function updateProfile(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated");
  }

  const {
    profession,
    experienceLevel,
    preferredLocation,
    onboardingCompleted,
  } = req.body;

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user.sub));

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Find or create profile
  let [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id));

  if (!profile) {
    // Create profile if it doesn't exist
    const newProfile: NewUserProfile = {
      userId: user.id,
      profession: profession as Profession | undefined,
      experienceLevel: experienceLevel as ExperienceLevel | undefined,
      preferredLocation: preferredLocation || user.country || null,
      onboardingCompleted: onboardingCompleted ?? false,
    };
    [profile] = await db.insert(userProfiles).values(newProfile).returning();
  } else {
    // Update existing profile
    const updateData: Partial<NewUserProfile> = {
      updatedAt: new Date(),
    };

    if (profession !== undefined) {
      updateData.profession = profession as Profession | null;
    }
    if (experienceLevel !== undefined) {
      updateData.experienceLevel = experienceLevel as ExperienceLevel | null;
    }
    if (preferredLocation !== undefined) {
      updateData.preferredLocation = preferredLocation;
    }
    if (onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = onboardingCompleted;
    }

    [profile] = await db
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.id, profile.id))
      .returning();
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      country: user.country,
    },
    profile: {
      id: profile.id,
      profession: profile.profession,
      experienceLevel: profile.experienceLevel,
      preferredLocation: profile.preferredLocation,
      onboardingCompleted: profile.onboardingCompleted,
    },
  });
}
