import Link from "next/link";
import { Suspense } from "react";
import { requireOwner } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { ReviewLoading, ReviewQuestions } from "@/components/lesson/RecallQuestions";
import { ArrowLeft } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review" };
// Parton writes the questions with careful thought; give the request room.
export const maxDuration = 300;

export default async function Review() {
  await requireOwner();
  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page">
        <Link href="/" className="back"><ArrowLeft size={14} /> Home</Link>
        <p className="eyebrow">Spaced review</p>
        <h1>Review</h1>
        <Suspense fallback={<ReviewLoading />}>
          <ReviewQuestions />
        </Suspense>
      </main>
    </div>
  );
}
