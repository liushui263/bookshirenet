import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

// Forwards a sign-in or sign-up to the API and, on success, stores the token
// in an httpOnly cookie so page code never handles it.
export async function forwardAuth(request: Request, path: "login" | "register") {
  let body: string;
  try {
    body = JSON.stringify(await request.json());
  } catch {
    return NextResponse.json({ detail: "Invalid request" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/api/v1/auth/${path}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    return NextResponse.json({ detail: "The BookShire API is unreachable" }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const response = NextResponse.json({ user: data.user }, { status: res.status });
  response.cookies.set(SESSION_COOKIE, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
