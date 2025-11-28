// Singleton to store the access token getter
let getAccessToken: (() => string | null) | null = null;

// Store the last request ID for error reporting
let lastRequestId: string | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  getAccessToken = getter;
}

export function getLastRequestId(): string | null {
  return lastRequestId;
}

export function getAuthHeaders(): HeadersInit {
  const token = getAccessToken?.();
  if (token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }
  return {
    "Content-Type": "application/json",
  };
}

// Custom error class that includes correlation ID
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public requestId: string | null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Capture the correlation ID from response headers
  const requestId = response.headers.get("X-Request-ID");
  if (requestId) {
    lastRequestId = requestId;
  }

  return response;
}

// Helper to throw ApiError for non-ok responses
export async function fetchWithAuthAndThrow(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    const requestId = response.headers.get("X-Request-ID");
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (data.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw new ApiError(message, response.status, requestId);
  }

  return response;
}
