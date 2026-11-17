import "server-only";
import { recallFor, reviewSession, type RecallItem } from "@/lib/recall";
import { renderInline, renderParton } from "@/lib/parton/render";
import { ExerciseCard, type ExerciseView } from "@/components/lesson/ExerciseCard";
import { Pill } from "@/components/ui/Pill";
import { Check } from "@/components/ui/Icons";
import Link from "next/link";
import { afterReviewAction } from "@/app/actions";

/** What the browser may see of a recall or review question: never the answer. */
function recallView(q: RecallItem): ExerciseView {
  const a = q.answer;
  return {
    id: q.id,
    rung: "check",
    kind: a.kind,
    options: a.kind === "choice" ? a.options : undefined,
    optionsHtml: a.kind === "choice" ? a.options.map(renderInline) : undefined,
    multiple: a.kind === "choice" ? a.correct.length > 1 : undefined,
    variables: a.kind === "expression" ? a.variables : undefined,
    solved: false,
    response: null,
  };
}

/** Fresh recall questions, written by Parton for this sitting. Streams in after the rest of the lesson. */
export async function RecallQuestions({ lessonId, mastered }: { lessonId: string; mastered: Set<string> }) {
  const { questions, error } = await recallFor(lessonId, mastered);
  if (questions.length === 0) return <p className="hint">{error ?? "No recall questions this time."}</p>;
  return (
    <>
      {questions.map((q) => (
        <ExerciseCard key={q.id} view={recallView(q)} context="recall">
          <p className="mono-meta">From {q.sourceTitle}</p>
          <div className="parton-prose" dangerouslySetInnerHTML={{ __html: renderParton(q.prompt) }} />
        </ExerciseCard>
      ))}
    </>
  );
}

export function RecallLoading() {
  return (
    <p className="hint" role="status">
      <Pill tone="accent" icon="spin">Writing</Pill> Parton is writing new recall questions for you.
    </p>
  );
}

/** A spaced-review session: three to five questions Parton has just written on the ideas that are due. */
export async function ReviewQuestions() {
  const { questions, error } = await reviewSession();
  if (questions.length === 0) {
    if (error) return <p className="hint">{error}</p>;
    return (
      <div className="empty">
        <p><span className="pill pill-success"><Check size={12} />All caught up</span></p>
        <p>Nothing is due. Each idea will come back, as a new question, just before you would forget it.</p>
        <Link href="/map" className="btn">Browse the map</Link>
      </div>
    );
  }
  return (
    <>
      <p className="lede">
        {questions.length} new question{questions.length > 1 ? "s" : ""} on earlier ideas, mixed together. Your first answer to
        each decides when that idea returns.
      </p>
      {questions.map((q, i) => (
        <div key={q.id}>
          <p className="eyebrow review-source">From {q.sourceTitle}{q.sourceCourse ? ` · ${q.sourceCourse}` : ""}</p>
          <ExerciseCard view={recallView(q)} context="review" index={i + 1}>
            <div className="parton-prose" dangerouslySetInnerHTML={{ __html: renderParton(q.prompt) }} />
          </ExerciseCard>
        </div>
      ))}
      <form action={afterReviewAction} className="review-done">
        <button type="submit" className="btn btn-primary">Done: open a lesson</button>
        <Link href="/" className="btn">Home</Link>
      </form>
    </>
  );
}

export function ReviewLoading() {
  return (
    <p className="hint" role="status">
      <Pill tone="accent" icon="spin">Writing</Pill> Parton is writing new review questions for you.
    </p>
  );
}
