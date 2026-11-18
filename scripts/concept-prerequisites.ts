/**
 * Every lesson must require the lessons that teach the ideas it uses, so that Learn never hands out, say, a
 * lesson that leans on covariance before the lesson that teaches covariance, in any track and whatever order the
 * learner takes. scripts/code-prerequisites.ts does this for the Python a lesson shows; this script does it for
 * the mathematics, machine learning and engineering ideas in its prose and exercises.
 *
 * It reads the text of every lesson, finds the concepts in src/content/concepts.ts that each one uses, and writes
 * the fewest extra "requires" links that put a teaching lesson before every use to
 * src/content/concept-prerequisites.json. The lesson graph adds them as "requires" links.
 *
 *   npm run prerequisites
 *
 * A concept whose only teachers come later in the same course cannot be gated without reordering the course, so
 * those uses are listed in src/content/concept-forward-uses.json for the authors to fix. The concept tests fail
 * if either file is out of date, so run the script after writing or changing a lesson.
 */
import { isValidElement } from "react";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LESSONS } from "../src/content/lessons/index.ts";
import { CONCEPTS, WAIVED } from "../src/content/concepts.ts";
import { DRILLS } from "../src/content/drills/index.ts";
import { Code, C } from "../src/components/lesson/Code.tsx";
import { buildGraph, withCodePrerequisites, type Graph } from "../src/lib/graph.ts";
import type { LinkKind } from "../src/lib/types.ts";

type Links = Partial<Record<LinkKind, string[]>>;
const SECTIONS = ["puzzle", "intuition", "theory", "practice"] as const;
type Section = (typeof SECTIONS)[number];

/** The words of a piece of lesson content: its text and maths, without code (the code script covers that). */
function words(node: unknown, out: string[]) {
  if (node == null || typeof node === "boolean") return;
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const n of node) words(n, out);
    return;
  }
  if (!isValidElement(node)) return;
  if (node.type === Code || node.type === C) return;
  const props = node.props as Record<string, unknown>;
  if (typeof props.code === "string") return;
  const name = typeof node.type === "function" ? node.type.name : String(node.type);
  for (const [key, value] of Object.entries(props)) {
    if (key === "children") words(value, out);
    else if (typeof value === "string" && ["tex", "math", "label", "title", "caption"].includes(key)) out.push(` ${value} `);
    else if (isValidElement(value) || Array.isArray(value)) words(value, out);
  }
  // A named block such as a definition or a figure ends a sentence.
  if (typeof node.type === "function" && name && !["Math", "M", "Code", "InlineCode"].includes(name)) out.push(` [${name}] `);
}

const text = (node: unknown) => {
  const out: string[] = [];
  words(node, out);
  return out.join("");
};

const SENTENCE = /(?<=[.?!:])\s+|\n|\[[A-Z][A-Za-z]+\]/;
/** A sentence that looks ahead names an idea without using it. */
const LOOKS_AHEAD =
  /\blater\b|will (meet|see|learn|study|return|come|build|prove|use|make|need|be)|a future lesson|coming (lesson|course|chapter)s?|next (course|chapter)|in (a|the) (later|coming)|\bahead\b|foreshadow|first look/i;

/** The text of each section of every lesson, with sentences that look ahead removed. The glimpse is left out. */
export function lessonTexts(): Map<string, Record<Section, string>> {
  const texts = new Map<string, Record<Section, string>>();
  for (const l of LESSONS) {
    const raw: Record<Section, string> = {
      puzzle: text(l.puzzle),
      intuition: text(l.intuition),
      theory: text(l.theory),
      practice: l.practice
        .map((e) => {
          const a = e.answer as { kind: string; options?: string[]; value?: string };
          return text(e.prompt) + (a.options ? ` OPTIONS: ${a.options.join(" | ")}` : "") + (a.kind === "expression" ? ` EXPR: ${a.value}` : "");
        })
        .join("\n"),
    };
    const kept = {} as Record<Section, string>;
    for (const s of SECTIONS) kept[s] = raw[s].split(SENTENCE).filter((x) => x && !LOOKS_AHEAD.test(x)).join("\n");
    texts.set(l.id, kept);
  }
  return texts;
}

/** The regular expressions for a concept: case-insensitive patterns, and those marked "=" matched as written. */
function matchers(patterns: string[]): RegExp[] {
  const insensitive = patterns.filter((p) => !p.startsWith("="));
  const sensitive = patterns.filter((p) => p.startsWith("=")).map((p) => p.slice(1));
  const join = (ps: string[]) => ps.map((p) => `(?:${p})`).join("|");
  return [
    ...(insensitive.length ? [new RegExp(join(insensitive), "gi")] : []),
    ...(sensitive.length ? [new RegExp(join(sensitive), "g")] : []),
  ];
}

/**
 * The text of each drill, in the shape of a lesson's: its summary and brief count as an exercise, since the
 * learner must follow every word of them. The tests' names are left out, since the learner sees them only after
 * submitting.
 */
export function drillTexts(): Map<string, Record<Section, string>> {
  return new Map(
    DRILLS.map((d) => [
      d.id,
      { puzzle: "", intuition: "", theory: "", practice: `${d.title}. ${d.summary}\n${text(d.brief)}`.split(SENTENCE).filter((x) => x && !LOOKS_AHEAD.test(x)).join("\n") },
    ]),
  );
}

/** One concept a lesson uses, with the lessons that teach it and where the lesson mentions it. */
export type Use = { lesson: string; concept: string; teachers: string[]; quotes: string[] };

/**
 * Every concept each lesson uses: mentioned in an exercise, or at least twice elsewhere. A lesson that teaches a
 * concept does not use it, and nor does one that names it in passing (see WAIVED).
 */
export function conceptUses(texts = lessonTexts()): Use[] {
  const waived = new Set(WAIVED.map(([lesson, concept]) => `${lesson} ${concept}`));
  const uses: Use[] = [];
  for (const concept of CONCEPTS) {
    const rxs = matchers(concept.patterns);
    const sections: readonly Section[] = concept.practiceOnly ? ["practice"] : SECTIONS;
    for (const [lesson, t] of texts) {
      if (concept.taughtIn.includes(lesson) || waived.has(`${lesson} ${concept.name}`)) continue;
      const quotes: string[] = [];
      let inPractice = false;
      for (const s of sections) {
        for (const rx of rxs) {
          for (const m of t[s].matchAll(rx)) {
            quotes.push(`${s}: ${t[s].slice(Math.max(0, m.index - 60), m.index + m[0].length + 40).replace(/\n/g, " / ")}`);
            if (s === "practice") inPractice = true;
          }
        }
      }
      if (inPractice || quotes.length >= 2) uses.push({ lesson, concept: concept.name, teachers: concept.taughtIn, quotes });
    }
  }
  return uses;
}

export const authoredLinks = () => new Map<string, Links>(LESSONS.map((l) => [l.id, l.links ?? {}]));

function ancestorsOf(requires: ReadonlyMap<string, string[]>, order: string[]) {
  const memo = new Map<string, Set<string>>();
  const visit = (id: string): Set<string> => {
    const known = memo.get(id);
    if (known) return known;
    const all = new Set<string>();
    memo.set(id, all);
    for (const r of requires.get(id) ?? []) {
      all.add(r);
      for (const a of visit(r)) all.add(a);
    }
    return all;
  };
  for (const id of order) visit(id);
  return memo;
}

const course = (id: string) => id.split(".")[0];
const TRACK_RANK: Record<string, number> = { m: 0, e: 1, l: 2 };

/**
 * The extra "requires" links, and the uses that only a later lesson of the same course teaches.
 *
 * Each use that the graph does not already satisfy gets a link to one of its teachers, chosen so that the
 * tracks stay as independent as they can: a mathematics lesson takes a mathematics teacher when there is one,
 * and otherwise the teacher with the fewest prerequisites of its own. A teacher that would form a cycle is
 * never chosen. Links that other links already imply are dropped.
 */
export function derive(uses: Use[], base: Graph = buildGraph(withCodePrerequisites(authoredLinks()))) {
  const position = new Map(base.order.map((id, i) => [id, i]));
  const at = (id: string) => {
    const p = position.get(id);
    if (p === undefined) throw new Error(`Unknown lesson ${id} in src/content/concepts.ts.`);
    return p;
  };
  const requires = new Map([...base.requires].map(([id, rs]) => [id, [...rs]]));
  const baseAncestors = ancestorsOf(base.requires, base.order);
  let ancestors = baseAncestors;

  const pending = uses
    .map((u, i) => ({ u, i }))
    .sort((a, b) => at(a.u.lesson) - at(b.u.lesson) || a.i - b.i)
    .map(({ u }) => u)
    .filter((u) => !u.teachers.some((t) => baseAncestors.get(u.lesson)!.has(t)));
  const forward = pending.filter((u) => u.teachers.some((t) => course(t) === course(u.lesson) && at(t) > at(u.lesson)));
  const cross = pending.filter((u) => !forward.includes(u));

  const passes: ((teacher: string, lesson: string) => boolean)[] = [
    (t, l) => l[0] === "m" && t[0] === "m",
    (_, l) => l[0] !== "m",
    (t) => t[0] !== "l",
    () => true,
  ];
  const added = new Map<string, string[]>();
  const done = new Set<Use>();
  for (const allowed of passes) {
    for (const u of cross) {
      if (done.has(u)) continue;
      const before = ancestors.get(u.lesson)!;
      if (u.teachers.some((t) => before.has(t))) {
        done.add(u);
        continue;
      }
      const options = u.teachers.filter((t) => t !== u.lesson && allowed(t, u.lesson) && !ancestors.get(t)!.has(u.lesson));
      if (!options.length) continue;
      const score = (t: string) => [ancestors.get(t)!.size, TRACK_RANK[t[0]], at(t)];
      const teacher = options.reduce((best, t) => {
        const [a, b] = [score(t), score(best)];
        return (a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) < 0 ? t : best;
      });
      done.add(u);
      requires.get(u.lesson)!.push(teacher);
      added.set(u.lesson, [...(added.get(u.lesson) ?? []), teacher]);
      ancestors = ancestorsOf(requires, base.order);
    }
  }
  const unmet = cross.filter((u) => !u.teachers.some((t) => ancestors.get(u.lesson)!.has(t)));

  const links: Record<string, string[]> = {};
  for (const [lesson, teachers] of [...added].sort(([a], [b]) => at(a) - at(b))) {
    const others = requires.get(lesson)!;
    const kept = [...teachers]
      .sort((a, b) => at(a) - at(b))
      .filter((t) => !others.some((o) => o !== t && ancestors.get(o)!.has(t)));
    if (kept.length) links[lesson] = kept;
  }
  const forwardUses = forward
    .filter((u) => !u.teachers.some((t) => ancestors.get(u.lesson)!.has(t)))
    .map((u) => ({ lesson: u.lesson, concept: u.concept, taughtIn: u.teachers.filter((t) => course(t) === course(u.lesson)) }));
  return { links, forwardUses, unmet };
}

export const OUTPUT = resolve(process.cwd(), "src/content/concept-prerequisites.json");
export const FORWARD_OUTPUT = resolve(process.cwd(), "src/content/concept-forward-uses.json");

export function computeConceptPrerequisites() {
  const uses = conceptUses();
  const { links, forwardUses, unmet } = derive(uses);
  if (unmet.length) {
    const list = unmet.map((u) => `${u.lesson} uses ${u.concept} (taught in ${u.teachers.join(", ")})`).join("\n  ");
    throw new Error(`No teacher of these concepts can come first without a cycle. Reword the lesson or waive the use:\n  ${list}`);
  }
  return { links, forwardUses };
}

export const serialise = (value: unknown) => `${JSON.stringify(value, null, 1)}\n`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { links, forwardUses } = computeConceptPrerequisites();
  writeFileSync(OUTPUT, serialise(links));
  writeFileSync(FORWARD_OUTPUT, serialise(forwardUses));
  const count = Object.values(links).reduce((n, l) => n + l.length, 0);
  console.log(`Wrote ${count} concept prerequisites for ${Object.keys(links).length} lessons to ${OUTPUT}.`);
  console.log(`${forwardUses.length} uses come before a later lesson of the same course teaches them; see ${FORWARD_OUTPUT}.`);
}
