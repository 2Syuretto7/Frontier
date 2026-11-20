import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** The deployment now live. Open pages compare it with the one they were built from. */
export function GET() {
  return NextResponse.json(
    { build: process.env.FRONTIER_BUILD },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
