/**
 * When the practice sections (Drills, the Debugging gym, Interview, Projects and Readiness) appear. Pure functions,
 * so they can be tested without a database.
 *
 * Each section stays out of the navigation, Home and the daily queue until the learner has mastered, through Learn,
 * a concrete set of lessons that gives it real work to do, and appears the moment that set is mastered. Every set
 * is closed under prerequisites, so it is the same set of lessons whichever order the learner takes the three tracks
 * in (one at a time, side by side or mixed), and no section can open on one track's progress alone.
 *
 * - Debugging gym: the first case whose lessons are all mastered. Today that is "leaky split" or "target leak",
 *   which rest on 327 lessons (the whole of Introduction to Machine Learning, up to Leakage, and NumPy indexing).
 * - Interview: the first mode with a full session (three questions) whose lessons are all mastered. Today that is
 *   coding (an LRU cache, streaming top-k and edit distance), which rests on 333 lessons. Questions that rest on no
 *   lessons, such as "why this lab", never open the section on their own.
 * - Drills: the first drill whose lessons are all mastered. Today that is the training loop, which rests on 399
 *   lessons (backpropagation for a matrix layer, softmax and cross-entropy, SGD and momentum).
 * - Projects: Ablations (the end of Neural Networks from Scratch) and The lab notebook (Software Engineering for ML
 *   Research), 442 lessons: you can train and diagnose a network and keep a reproducible record of experiments.
 * - Readiness: Drills and Projects are both open, so every level of evidence the scorecard asks for (a passed drill,
 *   a project, a write-up) can be earned. Today that is the same 442 lessons as Projects.
 *
 * The counts are computed from the curriculum by `tests/sections.test.ts`, which fails if any section could open
 * with fewer than MIN_LESSONS lessons mastered, or fewer than MIN_PER_TRACK in any track, and
 * simulates learners taking the tracks one at a time, side by side and in a random mix.
 *
 * Once a section opens it stays open, even if a lesson later goes back to in progress because questions were added.
 */
import { closureOf, type Graph } from "./graph";
import type { Track } from "./types";

export const SECTIONS = ["drills", "gym", "interview", "projects", "readiness"] as const;
export type SectionId = (typeof SECTIONS)[number];

export const SECTION_TITLES: Record<SectionId, string> = {
  drills: "Drills",
  gym: "Gym",
  interview: "Interview",
  projects: "Projects",
  readiness: "Readiness",
};

/** No section may open with fewer lessons mastered than this. Checked against the curriculum by the tests. */
export const MIN_LESSONS = 300;

/** Nor with fewer than this many mastered in any one of the three tracks. */
export const MIN_PER_TRACK = 40;

/** The lessons that open Projects: training and diagnosing a network, and keeping a reproducible record of experiments. */
export const PROJECT_LESSONS = ["l3.8.4", "e4.3.4"] as const;

/** Questions an interview session needs open in one mode before the section opens. Matches SESSION_QUESTIONS. */
export const INTERVIEW_SESSION = 3;

export type GateContent = {
  drills: readonly { lessons: readonly string[] }[];
  cases: readonly { lessons: readonly string[] }[];
  questions: readonly { mode: string; lessons: readonly string[] }[];
};

const allMastered = (ids: readonly string[], mastered: ReadonlySet<string>) => ids.every((id) => mastered.has(id));

/** Interview questions that rest on lessons. One that rests on none can't show that anything has been learnt. */
const taught = (content: GateContent) => content.questions.filter((q) => q.lessons.length > 0);

/** Which sections the learner's mastered lessons open. */
export function openByMastery(content: GateContent, mastered: ReadonlySet<string>): Set<SectionId> {
  const open = new Set<SectionId>();
  if (content.drills.some((d) => allMastered(d.lessons, mastered))) open.add("drills");
  if (content.cases.some((c) => allMastered(c.lessons, mastered))) open.add("gym");
  const perMode = new Map<string, number>();
  for (const q of taught(content)) if (allMastered(q.lessons, mastered)) perMode.set(q.mode, (perMode.get(q.mode) ?? 0) + 1);
  if ([...perMode.values()].some((n) => n >= INTERVIEW_SESSION)) open.add("interview");
  if (allMastered(PROJECT_LESSONS, mastered)) open.add("projects");
  if (open.has("drills") && open.has("projects")) open.add("readiness");
  return open;
}

/** Sections open now: those mastery opens, plus those that opened before (a section never closes again). */
export const openSections = (content: GateContent, mastered: ReadonlySet<string>, openedBefore: Iterable<string>): Set<SectionId> =>
  new Set([...openByMastery(content, mastered), ...[...openedBefore].filter((s): s is SectionId => (SECTIONS as readonly string[]).includes(s))]);

// ---------------------------------------------------------------------------------------------
// The smallest set of lessons that opens each section, for the tests, the locked page and the docs

/**
 * The fewest lessons whose mastery opens a section, and those lessons, from an empty start. Each candidate (a drill,
 * a case, three questions in one mode, the project lessons) is closed under prerequisites, and the smallest wins.
 * Null if no candidate exists.
 */
export function smallestOpening(section: SectionId, graph: Graph, content: GateContent): Set<string> | null {
  const best = (candidates: Set<string>[]) => candidates.sort((a, b) => a.size - b.size)[0] ?? null;
  switch (section) {
    case "drills":
      return best(content.drills.map((d) => closureOf(graph, d.lessons)));
    case "gym":
      return best(content.cases.map((c) => closureOf(graph, c.lessons)));
    case "interview": {
      const out: Set<string>[] = [];
      const modes = new Set(content.questions.map((q) => q.mode));
      for (const mode of modes) {
        // Greedy: start from each question, then keep adding the one that grows the set least.
        const pool = taught(content).filter((q) => q.mode === mode).map((q) => closureOf(graph, q.lessons));
        if (pool.length < INTERVIEW_SESSION) continue;
        for (let i = 0; i < pool.length; i++) {
          let set = new Set(pool[i]);
          const used = new Set([i]);
          while (used.size < INTERVIEW_SESSION) {
            let pick = -1;
            let size = Infinity;
            pool.forEach((p, j) => {
              if (used.has(j)) return;
              const grown = new Set([...set, ...p]).size;
              if (grown < size) [pick, size] = [j, grown];
            });
            used.add(pick);
            set = new Set([...set, ...pool[pick]]);
          }
          out.push(set);
        }
      }
      return best(out);
    }
    case "projects":
      return closureOf(graph, PROJECT_LESSONS);
    case "readiness": {
      const drills = content.drills.map((d) => closureOf(graph, d.lessons));
      return best(drills.map((d) => new Set([...d, ...closureOf(graph, PROJECT_LESSONS)])));
    }
  }
}

/** How many of the lessons in a set fall in each track. */
export function byTrack(graph: Graph, ids: Iterable<string>): Record<Track, number> {
  const out: Record<Track, number> = { mathematics: 0, "machine-learning": 0, engineering: 0 };
  for (const id of ids) {
    const n = graph.nodes.get(id);
    if (n) out[n.track]++;
  }
  return out;
}
