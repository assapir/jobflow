import type { LinkedInSearchResponse } from '../types/job';
import { fetchWithAuth } from './client';

const API_BASE = '/api/linkedin';

interface SearchErrorResponse {
  error: string;
  message?: string;
  retryAfter?: number;
}

export class LinkedInSearchError extends Error {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'LinkedInSearchError';
    this.retryAfter = retryAfter;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: SearchErrorResponse = await response.json().catch(() => ({ error: 'Unknown error' }));

    if (response.status === 429) {
      throw new LinkedInSearchError(
        error.message || 'Too many requests',
        error.retryAfter
      );
    }

    throw new LinkedInSearchError(error.message || error.error || 'Search failed');
  }
  return response.json();
}

export async function searchLinkedInJobs(
  query: string,
  location?: string
): Promise<LinkedInSearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (location) {
    params.set('location', location);
  }

  const response = await fetchWithAuth(`${API_BASE}/search?${params.toString()}`);
  return handleResponse<LinkedInSearchResponse>(response);
}

export async function clearLinkedInCache(): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/cache/clear`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new LinkedInSearchError('Failed to clear cache');
  }
}
