import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Keeps the readiness scorecard current without the learner: Vercel Cron calls this a few times each night (see
 * vercel.json). Each call does at most one step, so each fits in its own time limit. With CRON_SECRET set in
 * Vercel, only Vercel Cron can call it; without it, a call can still only do what is already due.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { runScheduledStep } = await import("@/lib/readiness/store");
  try {
    const { step, result } = await runScheduledStep();
    if (step !== "nothing") console.log(`Readiness: scheduled ${step}:`, result);
    return NextResponse.json({ step, ok: result?.ok ?? true });
  } catch (error) {
    console.error("Readiness: scheduled run failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
