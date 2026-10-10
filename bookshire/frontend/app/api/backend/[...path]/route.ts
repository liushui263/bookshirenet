import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

type Context = { params: Promise<{ path: string[] }> };

// Same-origin proxy for browser calls that need the signed-in user's token.
async function proxy(request: Request, { params }: Context) {
  const { path } = await params;
  if (path.some((segment) => segment === ".." || segment === ".")) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
  }

  const search = new URL(request.url).search;
  const target = `${getApiBaseUrl()}/api/v1/${path.map(encodeURIComponent).join("/")}${search}`;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let res: Response;
  try {
    res = await fetch(target, {
      method: request.method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": request.headers.get("content-type") || "application/json",
      },
      body: hasBody ? await request.text() : undefined,
    });
  } catch {
    return NextResponse.json({ detail: "The BookShire API is unreachable" }, { status: 502 });
  }

  return new NextResponse(res.body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
