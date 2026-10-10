import { cookies } from "next/headers";
import { getApiBaseUrl, type CurrentUser } from "@/lib/api";

export const SESSION_COOKIE = "bookshire_token";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value || null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
}
