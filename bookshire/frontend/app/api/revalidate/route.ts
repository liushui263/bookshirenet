import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { DISCOVERY_CACHE_TAG } from "@/lib/discovery/cache";

// Called once a day by the Vercel cron in vercel.json. Marks the discovery
// shelves stale so the next visit refreshes them in the background.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(DISCOVERY_CACHE_TAG, "max");
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
