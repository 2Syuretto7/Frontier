import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { GRAPH } from "@/lib/curriculum";
import { dueReviews } from "@/lib/learning";
import { toView } from "@/lib/views";
import { TopBar } from "@/components/TopBar";
import { ExerciseCard } from "@/components/lesson/ExerciseCard";
import { ArrowLeft, Check } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review" };

export default async function Review() {
  await requireOwner();
  const due = await dueReviews();
  return (
    <div className="shell">
      <TopBar />
      <main id="main" className="page">
        <Link href="/" className="back"><ArrowLeft size={14} /> Home</Link>
        <p className="eyebrow">Spaced review</p>
        <h1>Review</h1>
        {due.length === 0 ? (
          <div className="empty">
            <p><span className="pill pill-success"><Check size={12} />All caught up</span></p>
            <p>Nothing is due. Each idea will come back just before you would forget it.</p>
            <Link href="/map" className="btn">Browse the map</Link>
          </div>
        ) : (
          <>
            <p className="lede">
              {due.length} question{due.length > 1 ? "s" : ""} from earlier lessons, mixed together. Your first answer to
              each decides when it returns.
            </p>
            {due.map((r, i) => {
              const n = GRAPH.nodes.get(r.lessonId)!;
              return (
                <div key={r.id}>
                  <p className="eyebrow review-source">From {n.title} · {n.course}</p>
                  <ExerciseCard view={toView(r)} context="review" index={i + 1}>{r.exercise.prompt}</ExerciseCard>
                </div>
              );
            })}
            <div className="review-done">
              <Link href="/" className="btn btn-primary">Done for now</Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
