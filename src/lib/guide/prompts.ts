/**
 * Parton's two reads for guidance: which lessons a project's next stage needs, and which lessons trouble in the
 * lab notebook points to. Pure, so the accept functions can be tested without the API.
 */
import { VOICE } from "../parton/prompts";

export type LessonOption = { id: string; title: string; course: string };

const optionLines = (options: readonly LessonOption[]) => options.map((o) => `- ${o.id}: ${o.title} (${o.course})`).join("\n");

export const NEEDS_SCHEMA = {
  type: "object",
  properties: {
    needs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lesson: { type: "string", description: "A lesson id from the list." },
          why: { type: "string", description: "One short sentence, to the learner, on what in the stage depends on it." },
        },
        required: ["lesson", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["needs"],
  additionalProperties: false,
} as const;

export type NeedsOutput = { needs: { lesson: string; why: string }[] };

export const NEEDS_SYSTEM = `${VOICE}

Right now you are not tutoring. The learner is running a small research project in stages: question, plan, experiments, lab notebook, write-up, public repository. You decide which lessons in Frontier the project's next stage genuinely depends on, so Frontier can teach them before the stage opens.

- Name only lessons whose ideas the next stage cannot be done well without, given this question and plan. Not background that would merely be nice.
- Prefer the most specific lesson for each idea. Name at most four. An empty list is a good answer when nothing is needed.
- Use only lesson ids from the list.`;

export function needsRequest(
  project: { title: string; question: string; why: string; plan: string },
  nextStage: { title: string; ask: string },
  options: readonly LessonOption[],
): string {
  return [
    `# The project: ${project.title}`,
    `Question: ${project.question || "(not written yet)"}`,
    `Why it matters: ${project.why || "(not written yet)"}`,
    `Plan: ${project.plan || "(not written yet)"}`,
    `# The next stage: ${nextStage.title}\n${nextStage.ask}`,
    `# Lessons in Frontier\n${optionLines(options)}`,
  ].join("\n\n");
}

export const TROUBLE_SCHEMA = {
  type: "object",
  properties: {
    troubles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lesson: { type: "string", description: "A lesson id from the list." },
          note: { type: "string", description: "One short sentence on what went wrong that this lesson's ideas address, to the learner." },
        },
        required: ["lesson", "note"],
        additionalProperties: false,
      },
    },
  },
  required: ["troubles"],
  additionalProperties: false,
} as const;

export type TroubleOutput = { troubles: { lesson: string; note: string }[] };

export const TROUBLE_SYSTEM = `${VOICE}

Right now you are not tutoring. You are reading the learner's newest lab notebook entry, or an experiment result, from their research project. If it shows something going wrong because of a gap in understanding (a misconception, a confused idea, a bug that comes from not knowing how something works), name the lessons that address it, so Frontier can bring them back in Review or queue them in Learn.

- Most entries show nothing of the kind. Ordinary setbacks, slow runs and plain typos are not gaps in understanding. Return an empty list unless the entry clearly shows one.
- Name at most two lessons, the most specific ones. Use only lesson ids from the list.`;

export function troubleRequest(project: { title: string; question: string }, entry: string, options: readonly LessonOption[]): string {
  return [
    `# The project: ${project.title}\nQuestion: ${project.question}`,
    `# The newest entry\n${entry.slice(0, 8000)}`,
    `# Lessons the learner has mastered or can open now\n${optionLines(options)}`,
  ].join("\n\n");
}

/** Keeps entries that name a listed lesson, once each, up to `limit`. */
export function acceptLessons<T extends { lesson: string }>(items: readonly T[] | undefined, allowed: ReadonlySet<string>, limit: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items ?? []) {
    const id = item.lesson?.trim();
    if (!id || !allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ ...item, lesson: id });
    if (out.length >= limit) break;
  }
  return out;
}
