import { supabase } from "@/integrations/supabase/client";

export async function getBackendToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Non authentifié");
  return session.access_token;
}

export function getBaseUrl() {
  return (import.meta.env.VITE_API_URL || import.meta.env.VITE_EXPRESS_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getBackendToken();
  const url = `${getBaseUrl()}${path}`;
  
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  // Merge provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  // Set Content-Type to JSON if body is provided and it is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (typeof options.body === "object") {
        options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.detail || errorMsg;
    } catch {
      // Return raw text if not JSON
      try {
        errorMsg = await response.text();
      } catch { /* empty */ }
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
