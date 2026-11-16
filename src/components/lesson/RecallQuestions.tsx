import "server-only";
import { recallFor, type RecallItem } from "@/lib/recall";
import { renderParton } from "@/lib/parton/render";
import { ExerciseCard, type ExerciseView } from "@/components/lesson/ExerciseCard";
import { Pill } from "@/components/ui/Pill";

/** What the browser may see of a recall question: never the answer. */
function recallView(q: RecallItem): ExerciseView {
  const a = q.answer;
  return {
    id: q.id,
    rung: "check",
    kind: a.kind,
    options: a.kind === "choice" ? a.options : undefined,
    multiple: a.kind === "choice" ? a.correct.length > 1 : undefined,
    variables: a.kind === "expression" ? a.variables : undefined,
    solved: false,
    response: null,
    verdict: null,
    feedbackHtml: null,
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
