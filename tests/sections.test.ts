import { test } from "node:test";
import assert from "node:assert/strict";
import { DRILLS } from "../src/content/drills/index.ts";
import { CASES } from "../src/content/gym/index.ts";
import { QUESTIONS } from "../src/content/interview/index.ts";
import { buildGraph, frontier, withPrerequisites, type LessonNode } from "../src/lib/graph.ts";
import { authoredLinks } from "../scripts/code-prerequisites.ts";
import { SESSION_QUESTIONS } from "../src/lib/interview/core.ts";
import {
  INTERVIEW_SESSION,
  MIN_LESSONS,
  MIN_PER_TRACK,
  SECTIONS,
  byTrack,
  openByMastery,
  openSections,
  smallestOpening,
  type GateContent,
  type SectionId,
} from "../src/lib/sections.ts";
import { TRACKS, type Track } from "../src/lib/types.ts";

/**
 * Drills, the gym, Interview, Projects and Readiness must open neither before a substantial, concrete amount of
 * learning nor after it: exactly when the learner has mastered a set of lessons that gives the section real work.
 */

const graph = buildGraph(withPrerequisites(authoredLinks()));
const content: GateContent = { drills: DRILLS, cases: CASES, questions: QUESTIONS };

test("an interview opens with a full session of questions", () => {
  assert.equal(INTERVIEW_SESSION, SESSION_QUESTIONS);
});

for (const section of SECTIONS) {
  test(`${section} needs a substantial amount of learning in every track`, () => {
    const need = smallestOpening(section, graph, content);
    assert.ok(need, `${section} has nothing that could open it`);
    assert.ok(need.size >= MIN_LESSONS, `${section} could open after only ${need.size} lessons`);
    const tracks = byTrack(graph, need);
    for (const t of TRACKS) assert.ok(tracks[t] >= MIN_PER_TRACK, `${section} could open with only ${tracks[t]} ${t} lessons`);
    for (const id of need) assert.ok(graph.nodes.get(id)?.authored, `${section} waits for ${id}, which is not written yet`);
  });

  test(`${section} opens the moment its lessons are mastered, and not one lesson before`, () => {
    const need = smallestOpening(section, graph, content)!;
    assert.ok(openByMastery(content, need).has(section));
    for (const id of need) {
      const short = new Set(need);
      short.delete(id);
      // Only sets a learner could actually reach: everything mastered has its prerequisites mastered.
      if ([...short].some((s) => (graph.requires.get(s) ?? []).includes(id))) continue;
      assert.ok(!openByMastery(content, short).has(section), `${section} opens without ${id}`);
    }
  });
}

test("nothing opens before any learning, even with questions that rest on no lessons", () => {
  assert.ok(QUESTIONS.some((q) => q.lessons.length === 0), "the bank still has a question that rests on no lessons");
  assert.equal(openByMastery(content, new Set()).size, 0);
});

test("Readiness opens with Drills and Projects, never before either", () => {
  const need = smallestOpening("readiness", graph, content)!;
  const open = openByMastery(content, need);
  assert.ok(open.has("drills") && open.has("projects"));
});

test("a section that has opened stays open", () => {
  const open = openSections(content, new Set(), ["drills", "unknown"]);
  assert.deepEqual([...open], ["drills"]);
});

// ---------------------------------------------------------------------------------------------
// Learners taking the tracks in different orders

type Pick = (open: LessonNode[], step: number) => LessonNode;

const inOrder = (order: readonly Track[]): Pick => (open) => {
  for (const t of order) {
    const n = open.find((x) => x.track === t);
    if (n) return n;
  }
  return open[0];
};

const rotating: Pick = (open, step) => {
  for (let k = 0; k < TRACKS.length; k++) {
    const n = open.find((x) => x.track === TRACKS[(step + k) % TRACKS.length]);
    if (n) return n;
  }
  return open[0];
};

function seeded(seed: number): Pick {
  let s = seed;
  return (open) => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return open[s % open.length];
  };
}

/** Masters lessons one at a time, as picked, and notes how many were mastered when each section opened. */
function walk(pick: Pick): Map<SectionId, number> {
  const mastered = new Set<string>();
  const openedAt = new Map<SectionId, number>();
  for (let step = 0; ; step++) {
    for (const s of openByMastery(content, mastered)) if (!openedAt.has(s)) openedAt.set(s, mastered.size);
    const open = frontier(graph, mastered);
    if (open.length === 0) break;
    mastered.add(pick(open, step).id);
  }
  return openedAt;
}

const APPROACHES: [string, Pick][] = [
  ["the three tracks side by side", rotating],
  ["mathematics first, then machine learning, then engineering", inOrder(["mathematics", "machine-learning", "engineering"])],
  ["engineering first, then machine learning, then mathematics", inOrder(["engineering", "machine-learning", "mathematics"])],
  ["machine learning first, then engineering, then mathematics", inOrder(["machine-learning", "engineering", "mathematics"])],
  ["a random mix", seeded(7)],
  ["another random mix", seeded(2026)],
];

for (const [name, pick] of APPROACHES) {
  test(`every section opens, after substantial learning, for a learner taking ${name}`, () => {
    const openedAt = walk(pick);
    for (const s of SECTIONS) {
      const at = openedAt.get(s);
      assert.ok(at !== undefined, `${s} never opened`);
      const floor = smallestOpening(s, graph, content)!.size;
      assert.ok(at >= floor && at >= MIN_LESSONS, `${s} opened after ${at} lessons`);
    }
    assert.ok(openedAt.get("readiness")! >= Math.max(openedAt.get("drills")!, openedAt.get("projects")!));
  });
}
