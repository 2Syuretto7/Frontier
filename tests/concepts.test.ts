import { test } from "node:test";
import assert from "node:assert/strict";
import { LESSONS } from "../src/content/lessons/index.ts";
import { DRILLS } from "../src/content/drills/index.ts";
import { CONCEPTS, WAIVED } from "../src/content/concepts.ts";
import conceptPrerequisites from "../src/content/concept-prerequisites.json";
import { buildGraph, frontier, withPrerequisites, type Graph, type LessonNode } from "../src/lib/graph.ts";
import { chooseNextStep } from "../src/lib/scheduler.ts";
import { COURSES } from "../src/lib/graph.ts";
import type { Track } from "../src/lib/types.ts";
import {
  authoredLinks,
  computeConceptPrerequisites,
  conceptUses,
  drillTexts,
  serialise,
  type Use,
} from "../scripts/concept-prerequisites.ts";
import { itemFeatures, pythonAvailable, taughtIn, type CodeItem } from "../scripts/code-prerequisites.ts";

/**
 * Lessons build on what the learner has mastered. Every mathematics, machine learning and engineering idea a
 * lesson's prose or exercises use is taught by a lesson it requires, so Learn, Readiness, Projects and Drills,
 * which all offer only lessons whose requirements are mastered, cannot hand it out first, whatever order the
 * learner takes: one track after another, all three in rotation, or a mix.
 */

const graph = buildGraph(withPrerequisites(authoredLinks()));
const gated = conceptUses();
const usesOf = new Map<string, Use[]>();
for (const u of gated) usesOf.set(u.lesson, [...(usesOf.get(u.lesson) ?? []), u]);

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

test("the concept list names real lessons and patterns that compile", () => {
  const names = new Set<string>();
  for (const c of CONCEPTS) {
    assert.ok(!names.has(c.name), `${c.name} is listed twice`);
    names.add(c.name);
    assert.ok(c.taughtIn.length, `${c.name} has no teaching lesson`);
    for (const t of c.taughtIn) assert.ok(graph.nodes.get(t)?.authored, `${c.name}: ${t} is not a written lesson`);
    for (const p of c.patterns) assert.doesNotThrow(() => new RegExp(p.replace(/^=/, ""), "i"), `${c.name}: ${p}`);
  }
  const drills = new Set(DRILLS.map((d) => d.id));
  for (const [lesson, concept, why] of WAIVED) {
    assert.ok(graph.nodes.get(lesson)?.authored || drills.has(lesson), `waiver for unknown lesson ${lesson}`);
    assert.ok(names.has(concept), `waiver for unknown concept ${concept}`);
    assert.ok(why.length > 10, `waiver ${lesson} ${concept} needs a reason`);
  }
});

test("concept prerequisites are up to date, and no lesson uses an idea before its course teaches it (run npm run prerequisites)", () => {
  assert.equal(serialise(conceptPrerequisites), serialise(computeConceptPrerequisites()));
});

test("every lesson requires a lesson that teaches each idea it uses", () => {
  const missing = gated
    .filter((u) => !u.teachers.some((t) => ancestors(graph, u.lesson).has(t)))
    .map((u) => `${u.lesson} uses ${u.concept}, taught in ${u.teachers.join(", ")}`);
  assert.deepEqual(missing, []);
});

test("worked examples: lessons wait for the ideas they lean on", () => {
  const before = (lesson: string, teacher: string) => ancestors(graph, lesson).has(teacher);
  // Seeds and determinism uses dropout; its exercises cannot be followed without it.
  assert.ok(before("e4.3.1", "l3.7.2"));
  // The first machine learning lesson on averages uses the mean, taught in mathematics.
  assert.ok(before("l0.1.2", "m0.8.1"));
  // Debugging training reasons about cross-entropy and entropy.
  assert.ok(before("e4.2.1", "l1.4.3"));
});

/** Walks the curriculum from nothing mastered, with a rule for which open lesson to take next. */
function walk(pick: (options: LessonNode[], lastTrack: Track | null) => LessonNode | null) {
  const mastered = new Set<string>();
  let lastTrack: Track | null = null;
  for (;;) {
    const next = pick(frontier(graph, mastered), lastTrack);
    if (!next) return mastered;
    const early = (usesOf.get(next.id) ?? []).filter((u) => !u.teachers.some((t) => mastered.has(t)));
    assert.deepEqual(
      early.map((u) => `${u.concept} (taught in ${u.teachers.join(", ")})`),
      [],
      `${next.id} was handed out before the ideas it uses were taught`,
    );
    mastered.add(next.id);
    lastTrack = next.track;
  }
}

test("the parallel approach: Learn rotates the tracks and never hands out a lesson early", () => {
  const learn = (options: LessonNode[], lastTrack: Track | null) => {
    const step = chooseNextStep({ openLesson: null, frontier: options, lastTrack, newLessonsToday: 0, pace: 1e9 });
    return step.kind === "begin" ? step.lesson : null;
  };
  assert.equal(walk(learn).size, LESSONS.length);
});

test("the sequential approach: one course at a time, each finished before the next", () => {
  const rank = new Map(COURSES.map((c, i) => [c.code, i]));
  const sequential = (options: LessonNode[]) =>
    options.length ? options.reduce((a, b) => (rank.get(b.course)! < rank.get(a.course)! ? b : a)) : null;
  assert.equal(walk(sequential).size, LESSONS.length);
});

test("the sequential approach, one track at a time, in each order of the tracks", () => {
  const orders: Track[][] = [
    ["mathematics", "machine-learning", "engineering"],
    ["engineering", "machine-learning", "mathematics"],
    ["machine-learning", "engineering", "mathematics"],
  ];
  for (const order of orders) {
    const byTrack = (options: LessonNode[]) => {
      for (const track of order) {
        const found = options.find((n) => n.track === track);
        if (found) return found;
      }
      return null;
    };
    assert.equal(walk(byTrack).size, LESSONS.length);
  }
});

test("the mixed approach, and any order a learner can take through the map", () => {
  let seed = 11;
  const random = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32;
  for (let run = 0; run < 10; run++) {
    // Some runs follow Learn's rotation part of the time and pick from the map otherwise; others pick at random.
    const followLearn = run % 2 === 0 ? 0.5 : 0;
    const mixed = (options: LessonNode[], lastTrack: Track | null) => {
      if (!options.length) return null;
      if (random() < followLearn) {
        const step = chooseNextStep({ openLesson: null, frontier: options, lastTrack, newLessonsToday: 0, pace: 1e9 });
        if (step.kind === "begin") return step.lesson;
      }
      return options[Math.floor(random() * options.length)];
    };
    assert.equal(walk(mixed).size, LESSONS.length);
  }
});

// Drills open once every lesson they list is mastered, so those lessons and everything they require must teach
// every idea and every piece of Python the drill asks for.
const closure = (lessons: string[]) => new Set(lessons.flatMap((l) => [l, ...ancestors(graph, l)]));
const drillUses = conceptUses(drillTexts());
const python = pythonAvailable();

for (const drill of DRILLS) {
  test(`drill ${drill.id} opens only after the ideas it uses are taught`, () => {
    const before = closure(drill.lessons);
    const missing = drillUses
      .filter((u) => u.lesson === drill.id && !u.teachers.some((t) => before.has(t)))
      .map((u) => `${u.concept} (taught in ${u.teachers.join(", ")})`);
    assert.deepEqual(missing, []);
  });

  test(`drill ${drill.id} opens only after the Python it needs is taught`, { skip: !python && "python3 is not installed" }, () => {
    const item: CodeItem = { lesson: drill.id, where: "solution", source: drill.solution, given: drill.starter, write: true };
    const [features] = itemFeatures([item]);
    const before = closure(drill.lessons);
    const missing = [...new Set((features ?? []).filter((f) => taughtIn(f) && !before.has(taughtIn(f)!)))];
    assert.deepEqual(missing, []);
  });

  test(`drill ${drill.id}: each failed test sends the learner to lessons that open in time`, () => {
    // A lesson behind a failed test must be one the drill already waits for, or something those lessons require,
    // so a failure never points at a lesson the learner could not yet take.
    const before = closure(drill.lessons);
    for (const [name, lessons] of Object.entries(drill.testLessons ?? {})) {
      for (const l of lessons) assert.ok(before.has(l), `${name} points to ${l}, which the drill does not wait for`);
    }
  });
}
