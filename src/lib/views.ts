import "server-only";
import type { ExerciseView } from "@/components/lesson/ExerciseCard";
import type { ExerciseRef } from "./curriculum";
import type { ExerciseStateRow } from "./learning";
import { renderParton } from "./parton/render";

/** What the browser may see of an exercise: never the answer. */
export function toView(ref: ExerciseRef, state?: ExerciseStateRow): ExerciseView {
  const a = ref.exercise.answer;
  return {
    id: ref.id,
    rung: ref.exercise.rung,
    kind: a.kind,
    options: a.kind === "choice" ? a.options : undefined,
    multiple: a.kind === "choice" ? a.correct.length > 1 : undefined,
    variables: a.kind === "expression" ? a.variables : undefined,
    solved: state?.solved ?? false,
    response: state?.response ?? null,
    verdict: state?.verdict ?? null,
    feedbackHtml: state?.feedback ? renderParton(state.feedback) : null,
  };
}
