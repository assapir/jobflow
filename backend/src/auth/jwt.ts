import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

export interface JWTPayload {
  sub: string; // user id
  email?: string;
  name: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * Generate an access token for a user
 */
export function generateAccessToken(
  userId: string,
  email: string | undefined,
  name: string
): string {
  const payload = {
    sub: userId,
    email,
    name,
  };

  return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Generate a secure random refresh token
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(
  userId: string,
  email: string | undefined,
  name: string
): TokenPair {
  return {
    accessToken: generateAccessToken(userId, email, name),
    refreshToken: generateRefreshToken(),
    expiresAt: getRefreshTokenExpiry(),
  };
}
