/**
 * Every lesson that shows or asks for Python must require the engineering lessons that teach the Python it uses,
 * so that Learn can never hand out, say, a mathematics lesson with a list in it before the lesson that teaches lists.
 *
 * This script reads the code in every lesson (runnable examples, code blocks, code exercises and their reference
 * solutions), finds the Python features it uses with tests/scope/features.py, and writes the engineering lessons
 * each lesson must require to src/content/code-prerequisites.json. The lesson graph adds them as "requires" links.
 *
 *   npm run prerequisites
 *
 * The scope tests fail if the file is out of date, so run it after writing or changing any code in a lesson.
 */
import { isValidElement } from "react";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LESSONS } from "../src/content/lessons/index.ts";
import { Code } from "../src/components/lesson/Code.tsx";
import { buildGraph } from "../src/lib/graph.ts";
import type { LinkKind } from "../src/lib/types.ts";

/** Any Python at all: the lesson that explains what a program is and how print shows a value. */
export const PYTHON = "python";

/** The engineering lesson that teaches each Python feature. */
export const TAUGHT_IN: Record<string, string> = {
  [PYTHON]: "e0.1.1",
  list: "e0.1.2", sorted: "e0.1.2",
  "import:std": "e0.1.3",
  fstring: "e0.1.4", input: "e0.1.4",
  if: "e0.2.1",
  loop: "e0.2.2", comprehension: "e0.2.2", zip: "e0.2.2", enumerate: "e0.2.2",
  def: "e0.3.1", global: "e0.3.3",
  dict: "e0.4.2", set: "e0.4.4",
  with: "e0.5.1", open: "e0.5.1", exceptions: "e0.5.3",
  lambda: "e1.3.2", class: "e1.3.3", generator: "e1.3.4",
  "import:numpy": "e1.5.1", "import:matplotlib": "e1.6.1", "import:pandas": "e1.7.1",
};
/** Any other library is met after the lesson on installing packages. */
export const taughtIn = (f: string) => TAUGHT_IN[f] ?? (f.startsWith("import:") ? "e1.4.1" : null);

/** One piece of code a learner reads, runs or writes in a lesson. */
export type CodeItem = {
  lesson: string;
  /** Where it appears: a lesson section, or an exercise key. */
  where: string;
  source: string;
  /** For a writing exercise, the starter: a function signature it already contains is given, not asked for. */
  given: string;
  write: boolean;
  /** For a writing exercise, the exercise itself. */
  exercise?: string;
};

/** Every string of code inside a piece of lesson content: Code blocks, and the `code` of runnable examples and traces. */
function codeIn(node: unknown, out: string[]) {
  if (node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) codeIn(n, out);
    return;
  }
  if (!isValidElement(node)) return;
  const props = node.props as Record<string, unknown>;
  if (node.type === Code && typeof props.children === "string") out.push(props.children);
  if (typeof props.code === "string") out.push(props.code);
  for (const value of Object.values(props)) codeIn(value, out);
}

export function codeItems(): CodeItem[] {
  const items: CodeItem[] = [];
  for (const l of LESSONS) {
    for (const section of ["puzzle", "intuition", "theory", "glimpse"] as const) {
      const found: string[] = [];
      codeIn(l[section], found);
      for (const source of found) items.push({ lesson: l.id, where: section, source, given: "", write: false });
    }
    for (const e of l.practice) {
      const found: string[] = [];
      codeIn(e.prompt, found);
      for (const source of found) items.push({ lesson: l.id, where: e.key, source, given: "", write: false });
      if (e.answer.kind === "code") {
        items.push({ lesson: l.id, where: e.key, source: e.answer.solution, given: e.answer.starter, write: true, exercise: e.key });
      }
    }
  }
  return items;
}

export const pythonAvailable = () => spawnSync("python3", ["--version"]).status === 0;

/** The Python features each item uses, or null when it is not Python (C, assembly, a shell session). */
export function itemFeatures(items: CodeItem[]): (string[] | null)[] {
  const script = resolve(process.cwd(), "tests/scope/features.py");
  const sources = items.flatMap((i) => [i.source, i.given]);
  const run = spawnSync("python3", ["-I", script], { input: JSON.stringify(sources), encoding: "utf8", maxBuffer: 1 << 28 });
  if (run.status !== 0) throw new Error(`features.py failed: ${run.stderr}`);
  const raw: (string[] | null)[] = JSON.parse(run.stdout);
  return items.map((item, i) => {
    const used = raw[2 * i];
    if (used === null) return null;
    // A function whose signature the starter already gives is not asked of the learner.
    const given = new Set<string>((raw[2 * i + 1] ?? []).filter((f) => f === "def"));
    return [PYTHON, ...used.filter((f) => !given.has(f))];
  });
}

/** For each lesson, the teaching lessons its code needs, with the features and places that need them. */
export function neededTeachers(items: CodeItem[], features: (string[] | null)[]) {
  const needs = new Map<string, Map<string, Set<string>>>();
  items.forEach((item, i) => {
    for (const f of features[i] ?? []) {
      const teacher = taughtIn(f);
      if (!teacher || teacher === item.lesson) continue;
      const byTeacher = needs.get(item.lesson) ?? new Map<string, Set<string>>();
      needs.set(item.lesson, byTeacher);
      const why = byTeacher.get(teacher) ?? new Set<string>();
      byTeacher.set(teacher, why);
      why.add(`${f} in ${item.where}`);
    }
  });
  return needs;
}

type Links = Partial<Record<LinkKind, string[]>>;

/** The authored links of every lesson, without code prerequisites. */
export const authoredLinks = () => new Map<string, Links>(LESSONS.map((l) => [l.id, l.links ?? {}]));

/**
 * The fewest extra "requires" links that make every teaching lesson a lesson's code needs come before it:
 * a teacher that the lesson already requires, directly or through other lessons, adds nothing.
 */
export function derivePrerequisites(needs: Map<string, Map<string, Set<string>>>): Record<string, string[]> {
  const base = buildGraph(authoredLinks());
  const extra = new Map<string, string[]>();
  const memo = new Map<string, Set<string>>();
  const visiting = new Set<string>();

  // Everything a lesson requires, directly or not, once its own extra links are added.
  const ancestors = (id: string): Set<string> => {
    const known = memo.get(id);
    if (known) return known;
    if (visiting.has(id)) throw new Error(`Code prerequisites would form a cycle through ${id}.`);
    visiting.add(id);
    const below = new Set<string>();
    for (const r of base.requires.get(id) ?? []) {
      below.add(r);
      for (const a of ancestors(r)) below.add(a);
    }
    const teachers = [...(needs.get(id)?.keys() ?? [])].filter((t) => !below.has(t));
    // Keep only the latest teachers: one that another teacher already requires adds nothing.
    const teacherAncestors = new Set(teachers.flatMap((t) => [...ancestors(t)]));
    const kept = teachers.filter((t) => !teacherAncestors.has(t)).sort(byOrder);
    if (kept.length) extra.set(id, kept);
    for (const t of kept) {
      below.add(t);
      for (const a of ancestors(t)) below.add(a);
    }
    visiting.delete(id);
    memo.set(id, below);
    return below;
  };
  const position = new Map(base.order.map((id, i) => [id, i]));
  const byOrder = (a: string, b: string) => position.get(a)! - position.get(b)!;

  for (const id of base.order) ancestors(id);
  return Object.fromEntries([...extra].sort(([a], [b]) => byOrder(a, b)));
}

export const OUTPUT = resolve(process.cwd(), "src/content/code-prerequisites.json");

export function computePrerequisites(): Record<string, string[]> {
  const items = codeItems();
  return derivePrerequisites(neededTeachers(items, itemFeatures(items)));
}

export const serialise = (p: Record<string, string[]>) => `${JSON.stringify(p, null, 1)}\n`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prerequisites = computePrerequisites();
  writeFileSync(OUTPUT, serialise(prerequisites));
  const links = Object.values(prerequisites).reduce((n, l) => n + l.length, 0);
  console.log(`Wrote ${links} code prerequisites for ${Object.keys(prerequisites).length} lessons to ${OUTPUT}.`);
}
