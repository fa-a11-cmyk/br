import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the Express backend base URL from env.
 * Returns null if not configured (fallback to Edge Functions).
 */
export function getExpressApiBaseUrl(): string | null {
  const url = import.meta.env.VITE_EXPRESS_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  if (!url) return null;
  return url.replace(/\/$/, "");
}

/**
 * Retrieves the current Supabase access token.
 * Never logs the token value.
 */
export async function getSupabaseAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
  return session.access_token;
}

interface ExpressFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** If true, don't parse JSON — return raw Response */
  raw?: boolean;
}

/**
 * Authenticated fetch wrapper for the Express backend (RapidoMeet_System).
 * Automatically injects the Supabase JWT as Bearer token.
 *
 * - Never logs tokens or secrets
 * - Throws clean errors for 401/403
 * - Parses JSON responses safely
 */
export async function expressFetch<T = unknown>(
  path: string,
  options: ExpressFetchOptions = {},
): Promise<T> {
  const baseUrl = getExpressApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Backend Express non configuré (VITE_EXPRESS_API_BASE_URL manquant).");
  }

  const token = await getSupabaseAccessToken();
  const { method = "GET", body, headers = {}, raw = false } = options;

  const fetchHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  // Only set Content-Type for JSON bodies (not FormData)
  if (body && !(body instanceof FormData)) {
    fetchHeaders["Content-Type"] = "application/json";
  }

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
  if (res.status === 403) {
    throw new Error("Accès refusé.");
  }

  if (raw) {
    return res as unknown as T;
  }

  // Safe JSON parsing
  let data: T;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return {} as T;
  }

  if (!res.ok) {
    const errMsg = (data as any)?.error || (data as any)?.message || `Erreur serveur (${res.status})`;
    throw new Error(errMsg);
  }

  return data;
}

/**
 * Authenticated FormData upload to Express backend.
 * Does NOT set Content-Type header (browser sets boundary automatically).
 */
export async function expressUpload<T = unknown>(
  path: string,
  formData: FormData,
): Promise<T> {
  return expressFetch<T>(path, {
    method: "POST",
    body: formData,
  });
}
