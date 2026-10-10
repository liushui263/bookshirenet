import { NextResponse } from "next/server";
import { getDiscoveryBooks } from "@/lib/discovery/cache";

// JSON of the discovery shelves (the old bookshire.net feed). Served from the
// same daily cache as the home page, so it costs no extra Google Books calls.
export async function GET() {
  const data = await getDiscoveryBooks();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
