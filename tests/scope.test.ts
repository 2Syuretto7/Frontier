import { test } from "node:test";
import assert from "node:assert/strict";
import { LESSONS } from "../src/content/lessons/index.ts";
import codePrerequisites from "../src/content/code-prerequisites.json";
import { buildGraph, frontier, withPrerequisites, type Graph } from "../src/lib/graph.ts";
import { chooseNextStep } from "../src/lib/scheduler.ts";
import type { Track } from "../src/lib/types.ts";
import {
  authoredLinks,
  codeItems,
  computePrerequisites,
  itemFeatures,
  neededTeachers,
  pythonAvailable,
  serialise,
} from "../scripts/code-prerequisites.ts";

/**
 * Lessons build on what the learner has mastered. Every piece of Python a lesson shows or asks for
 * (runnable examples, code blocks, code reading and writing exercises) is taught by an engineering
 * lesson that it requires, so Learn cannot hand it out first, whatever order the learner has taken.
 * Writing exercises also stay a reasonable size.
 */

/** Largest reasonable reference solution for a writing exercise. */
const MAX_LINES = 35;
const MAX_FUNCTIONS = 3;

const python = pythonAvailable();
const skip = !python && "python3 is not installed";
const graph = buildGraph(withPrerequisites(authoredLinks()));
const items = codeItems();
const needs = python ? neededTeachers(items, itemFeatures(items)) : new Map<string, Map<string, Set<string>>>();

const memo = new Map<string, Set<string>>();
function ancestors(g: Graph, id: string): Set<string> {
  const known = memo.get(id);
  if (known) return known;
  const all = new Set<string>();
  for (const r of g.requires.get(id) ?? []) {
    all.add(r);
    for (const a of ancestors(g, r)) all.add(a);
  }
  memo.set(id, all);
  return all;
}

test("code prerequisites are up to date (run npm run prerequisites)", { skip }, () => {
  assert.equal(serialise(codePrerequisites as Record<string, string[]>), serialise(computePrerequisites()));
});

for (const l of LESSONS) {
  test(`${l.id} requires the lessons that teach the Python it uses`, { skip }, () => {
    const before = ancestors(graph, l.id);
    const missing = [...(needs.get(l.id) ?? [])]
      .filter(([teacher]) => !before.has(teacher))
      .map(([teacher, why]) => `${teacher} (${[...why].join(", ")})`);
    assert.deepEqual(missing, [], `uses Python before the lesson that teaches it: ${missing.join("; ")}`);
  });
}

/** Walks the curriculum the way Learn does, from nothing mastered, with a given rule for what to master next. */
function walk(pick: (options: ReturnType<typeof frontier>, lastTrack: Track | null) => string | null) {
  const mastered = new Set<string>();
  const seq: string[] = [];
  let lastTrack: Track | null = null;
  for (;;) {
    const next = pick(frontier(graph, mastered), lastTrack);
    if (!next) return { seq, mastered };
    const node = graph.nodes.get(next)!;
    const before = [...(needs.get(next)?.keys() ?? [])].filter((t) => !mastered.has(t));
    assert.deepEqual(before, [], `${next} was handed out before ${before.join(", ")}`);
    seq.push(next);
    mastered.add(next);
    lastTrack = node.track;
  }
}

const learn = (options: ReturnType<typeof frontier>, lastTrack: Track | null) => {
  const step = chooseNextStep({ openLesson: null, dueReviews: 0, frontier: options, lastTrack, newLessonsToday: 0, pace: 1e9 });
  return step.kind === "begin" ? step.lesson.id : null;
};

test("Learn reaches every lesson, never before the Python it uses is taught", { skip }, () => {
  assert.equal(new Set(walk(learn).seq).size, LESSONS.length);
});

test("any order a learner can take through the map also respects what each lesson uses", { skip }, () => {
  // A seeded random walk over whatever is open, as a learner choosing lessons from the map might take.
  let seed = 7;
  const random = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32);
  for (let run = 0; run < 20; run++) {
    const { seq } = walk((options) => (options.length ? options[Math.floor(random() * options.length)].id : null));
    assert.equal(seq.length, LESSONS.length);
  }
});

for (const item of items.filter((i) => i.write)) {
  test(`${item.lesson}:${item.exercise} is a reasonable size`, () => {
    // A top-level block the starter already contains word for word is given, not asked for.
    const blocks = item.source.split(/\n(?=\S)/).filter((b) => !item.given.includes(b.trim()));
    const asked = blocks.join("\n");
    const lines = asked.split("\n").filter((s) => s.trim() && !s.trim().startsWith("#")).length;
    const functions = (asked.match(/^(def|class) /gm) ?? []).length;
    assert.ok(lines <= MAX_LINES, `the reference solution has ${lines} lines; keep it to ${MAX_LINES}`);
    assert.ok(functions <= MAX_FUNCTIONS, `asks for ${functions} functions or classes; keep it to ${MAX_FUNCTIONS}`);
  });
}
