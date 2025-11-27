import type { User, AuthResponse } from '../types/user';

const API_BASE = '/api/auth';

export interface AuthStatus {
  linkedInConfigured: boolean;
  devAuthEnabled: boolean;
}

/**
 * Get auth configuration status
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await fetch(`${API_BASE}/status`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get auth status');
  }

  return response.json();
}

/**
 * Dev-only login bypass
 */
export async function devLogin(): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/dev-login`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Dev login failed');
  }

  return response.json();
}

/**
 * Initiate LinkedIn OAuth flow
 * Returns the authorization URL to redirect the user to
 */
export async function getLinkedInAuthUrl(): Promise<string> {
  const response = await fetch(`${API_BASE}/linkedin`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (data.devAuthEnabled) {
      throw new Error('LINKEDIN_NOT_CONFIGURED');
    }
    throw new Error('Failed to initiate LinkedIn authentication');
  }

  const data = await response.json();
  return data.authUrl;
}

/**
 * Refresh access token using refresh token cookie
 */
export async function refreshToken(): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

/**
 * Get current user info
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

/**
 * Logout - clear refresh token
 */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
