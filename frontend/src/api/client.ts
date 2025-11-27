// Singleton to store the access token getter
let getAccessToken: (() => string | null) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  getAccessToken = getter;
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

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}
