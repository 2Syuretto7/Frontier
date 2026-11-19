import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DIAGNOSIS, caseMastery, cleanSolve, gymDueAt, gymLimit, gymNextLevel, judgeDiagnosis, planGym, type GymPlanAttempt,
} from "../src/lib/gym-plan.ts";
import { buildToday, gymLessons, gymMiss, gymPulls, remedies, topPull, type TodayItem } from "../src/lib/guide/core.ts";
import { buildGraph } from "../src/lib/graph.ts";
import { acceptCase, judgeCaseReport, withoutFunction, type CaseOutput } from "../src/lib/parton/gym-prompts.ts";

const DAY = 86_400_000;
const T0 = Date.parse("2026-11-01T00:00:00Z");
const at = (days: number) => new Date(T0 + days * DAY).toISOString();

function attempt(over: Partial<GymPlanAttempt> & { day: number }): GymPlanAttempt {
  const { day, ...rest } = over;
  return {
    caseId: "a", level: 1, limitMinutes: 20, startedAt: at(day), finishedAt: at(day + 0.01), outcome: "solved", seconds: 600,
    wrongGuesses: 0, diagnosed: true, failedTests: [], ...rest,
  };
}

test("a clean solve climbs a level; a solve after a wrong guess stays; two misses step down", () => {
  assert.equal(gymNextLevel([]), 1);
  assert.equal(gymNextLevel([attempt({ day: 0 })]), 2);
  assert.equal(gymNextLevel([attempt({ day: 0 }), attempt({ day: 4, level: 2 })]), 3);
  assert.equal(gymNextLevel([attempt({ day: 0 }), attempt({ day: 4, level: 2, wrongGuesses: 1 })]), 2);
  assert.equal(gymNextLevel([attempt({ day: 0 }), attempt({ day: 4, level: 2, seconds: 5000 })]), 2, "over time is not clean");
  const missed = [attempt({ day: 0 }), attempt({ day: 4, level: 2, outcome: "gave_up" }), attempt({ day: 5, level: 2, outcome: "abandoned" })];
  assert.equal(gymNextLevel(missed), 1);
  assert.equal(gymNextLevel([attempt({ day: 0, level: 3 })]), 3, "level 3 is the top");
});

test("time limits tighten at level 2 and never fall under five minutes", () => {
  assert.equal(gymLimit(20, 1), 20);
  assert.equal(gymLimit(20, 2), 15);
  assert.equal(gymLimit(20, 3), 20);
  assert.equal(gymLimit(4, 2), 5);
});

test("misses come back the next day, wrong guesses in two, clean solves on a doubling gap", () => {
  assert.equal(gymDueAt([]), null);
  assert.equal(gymDueAt([attempt({ day: 0, outcome: "gave_up" })])!.getTime(), Date.parse(at(1.01)));
  assert.equal(gymDueAt([attempt({ day: 0, wrongGuesses: 2 })])!.getTime(), Date.parse(at(2.01)));
  assert.equal(gymDueAt([attempt({ day: 0 })])!.getTime(), Date.parse(at(4.01)));
  assert.equal(gymDueAt([attempt({ day: 0 }), attempt({ day: 5, level: 2 })])!.getTime(), Date.parse(at(13.01)));
});

test("mastery rewards clean solves and counts a wrong guess against a solve", () => {
  assert.equal(caseMastery([]), null);
  const clean = caseMastery([attempt({ day: 0 })])!;
  const guessed = caseMastery([attempt({ day: 0, wrongGuesses: 1 })])!;
  const missed = caseMastery([attempt({ day: 0, outcome: "gave_up" })])!;
  assert.ok(clean > guessed && guessed > missed && missed === 0);
  assert.ok(cleanSolve(attempt({ day: 0 })) && !cleanSolve(attempt({ day: 0, wrongGuesses: 1 })));
});

const CASES = [
  { id: "a", title: "A", minutes: 20, kind: "leakage" },
  { id: "b", title: "B", minutes: 20, kind: "schedule" },
  { id: "c", title: "C", minutes: 20, kind: "schedule" },
];

test("the plan picks an open attempt, then a retry, then the weakest kind; locked cases never come next", () => {
  const now = T0 + 10 * DAY;
  const fresh = planGym(CASES, [], now);
  assert.equal(fresh.next?.kind, "new");
  // Solving the leakage case cleanly makes schedules the weaker kind, so a schedule case comes next.
  const afterA = planGym(CASES, [attempt({ day: 9 })], now);
  assert.equal(CASES.find((c) => c.id === afterA.next?.caseId)?.kind, "schedule");
  const retry = planGym(CASES, [attempt({ day: 0, caseId: "b", outcome: "gave_up" })], now);
  assert.equal(retry.next?.caseId, "b");
  assert.equal(retry.next?.kind, "retry");
  const open = planGym(CASES, [{ ...attempt({ day: 9, caseId: "c" }), finishedAt: null, outcome: null, seconds: null }], now);
  assert.equal(open.next?.kind, "open");
  const locked = planGym(CASES, [], now, new Map([["a", "x"], ["b", "x"], ["c", "x"]]));
  assert.equal(locked.next, null);
  assert.ok(locked.queue.every((p) => p.kind === "locked"));
  // An attempt under way is never blocked.
  const underway = planGym(CASES, [{ ...attempt({ day: 9 }), finishedAt: null, outcome: null, seconds: null }], now, new Map([["a", "x"]]));
  assert.equal(underway.next?.kind, "open");
});

test("a diagnosis is judged on the cause, or on both the kind and the function", () => {
  const truth = { rightCause: 2, kind: "masking", suspect: "causal_mask" };
  assert.equal(judgeDiagnosis({ cause: 2 }, truth).right, true);
  assert.equal(judgeDiagnosis({ cause: 1 }, truth).right, false);
  const open = { rightCause: null, kind: "masking", suspect: "causal_mask" };
  assert.equal(judgeDiagnosis({ kind: "masking", fn: "causal_mask" }, open).right, true);
  const half = judgeDiagnosis({ kind: "masking", fn: "run" }, open);
  assert.equal(half.right, false);
  assert.match(half.note, /kind of bug is right/);
  assert.doesNotMatch(judgeDiagnosis({ kind: "dtype", fn: "run" }, open).note, /causal_mask|masking/, "a wrong guess never gives the answer away");
  assert.equal(judgeDiagnosis({ cause: 0 }, open).right, false);
});

// Lessons x1 -> x2 -> x3 in one chain; the gym only sends the learner to lessons whose prerequisites are mastered.
const graph = buildGraph(new Map([["l1.1.1", {}], ["l1.1.2", {}], ["l1.1.3", {}], ["l1.1.4", {}]]));
const gymCase = { id: "a", title: "A", bugLessons: ["l1.1.3"], testLessons: { "the split is clean": ["l1.1.4"] } };

test("a wrong guess sends the learner back to the lessons behind the bug, even when the fix then passed", () => {
  const solvedAfterGuess = gymMiss({ caseId: "a", finishedAt: at(1), outcome: "solved", wrongGuesses: 1, diagnosed: true, failedTests: [] }, DIAGNOSIS);
  assert.deepEqual(solvedAfterGuess?.failedTests, [DIAGNOSIS]);
  const mastered = new Set(["l1.1.1", "l1.1.2", "l1.1.3"]);
  const r = remedies(gymLessons(gymCase, DIAGNOSIS), solvedAfterGuess, graph, mastered, () => false);
  assert.deepEqual(r.map((x) => [x.lessonId, x.mode]), [["l1.1.3", "revisit"]]);
  // Once revisited after the miss, it asks nothing more.
  assert.deepEqual(remedies(gymLessons(gymCase, DIAGNOSIS), solvedAfterGuess, graph, mastered, () => true), []);
  assert.equal(gymMiss({ caseId: "a", finishedAt: at(1), outcome: "solved", wrongGuesses: 0, diagnosed: true, failedTests: [] }, DIAGNOSIS), null);
});

test("a fix that never passed sends the learner to the lessons behind its failing tests, and only reachable ones", () => {
  const gaveUp = gymMiss({ caseId: "a", finishedAt: at(1), outcome: "gave_up", wrongGuesses: 0, diagnosed: true, failedTests: ["the split is clean"] }, DIAGNOSIS);
  assert.deepEqual(gaveUp?.failedTests, ["the split is clean"]);
  const notReady = remedies(gymLessons(gymCase, DIAGNOSIS), gaveUp, graph, new Set(["l1.1.1"]), () => false);
  assert.deepEqual(notReady, [], "l1.1.4's prerequisites are not mastered, so nothing is asked");
  const ready = remedies(gymLessons(gymCase, DIAGNOSIS), gaveUp, graph, new Set(["l1.1.1", "l1.1.2", "l1.1.3"]), () => false);
  assert.deepEqual(ready.map((x) => [x.lessonId, x.mode]), [["l1.1.4", "learn"]]);
  const pulls = gymPulls(ready, () => "A");
  assert.equal(pulls[0].source, "gym");
  const frontier = [graph.nodes.get("l1.1.4")!];
  assert.equal(topPull(frontier, pulls)?.lesson.id, "l1.1.4");
  // Giving up before naming the cause counts the diagnosis as missed too.
  const blind = gymMiss({ caseId: "a", finishedAt: at(1), outcome: "gave_up", wrongGuesses: 0, diagnosed: false, failedTests: [] }, DIAGNOSIS);
  assert.deepEqual(blind?.failedTests, [DIAGNOSIS]);
});

test("the day's queue weaves the gym case in after the drill", () => {
  const lesson = (id: string): TodayItem => ({ kind: "begin", lessonId: id, title: id, why: null, pastPace: false });
  const queue = buildToday({
    head: [], revisits: [], lessons: [lesson("x"), lesson("y")],
    drill: { kind: "drill", drillId: "d", title: "D", why: "w" },
    gym: { kind: "gym", caseId: "g", title: "G", why: "w" },
    project: { kind: "project", projectId: 1, title: "P", why: "w" },
  });
  assert.deepEqual(queue.map((i) => i.kind), ["begin", "drill", "gym", "project", "begin"]);
});

const freshCase = (over: Partial<CaseOutput> = {}): CaseOutput => ({
  title: "Too good", summary: "s", symptom: "The loss is too low.",
  program: "import numpy as np\n\ndef split(x):\n    return x, x\n\ndef run():\n    return {'step': [0], 'train': [0.0]}\n",
  fixed: "import numpy as np\n\ndef split(x):\n    return x[:5], x[5:]\n\ndef run():\n    return {'step': [0], 'train': [0.0]}\n",
  suspect: "split", explanation: "e", prelude: "import numpy as _ref_np", minutes: 20, mistake: "m",
  tests: [{ name: "a", code: "assert True" }, { name: "b", code: "assert True" }, { name: "c", code: "assert True" }],
  ...over,
});

test("a fresh case is accepted only when its fix stays inside the suspect function", () => {
  assert.equal(acceptCase(freshCase()).ok, true);
  const outside = acceptCase(freshCase({ fixed: freshCase().fixed.replace("'train': [0.0]", "'train': [1.0]") }));
  assert.equal(outside.ok, false);
  assert.equal(acceptCase(freshCase({ suspect: "nowhere" })).ok, false);
  assert.equal(acceptCase(freshCase({ fixed: freshCase().program })).ok, false);
  assert.equal(acceptCase(freshCase({ tests: freshCase().tests.slice(0, 2) })).ok, false);
  assert.equal(acceptCase(freshCase({ prelude: "x = 1" })).ok, false);
  assert.equal(acceptCase(freshCase({ program: freshCase().program.replace("def run", "def go") })).ok, false);
  assert.equal(withoutFunction("def a():\n    pass\n\ndef b():\n    pass\n", "a"), "def b():\n    pass");
});

test("a fresh case is used only when its bug is silent, caught, and fixed", () => {
  assert.equal(judgeCaseReport({ buggyError: null, buggyFailed: true, fixedError: null, fixedFailures: [] }), null);
  assert.match(judgeCaseReport({ buggyError: "Traceback\nValueError: x", buggyFailed: true, fixedError: null, fixedFailures: [] })!, /silent/);
  assert.match(judgeCaseReport({ buggyError: null, buggyFailed: false, fixedError: null, fixedFailures: [] })!, /did not catch/);
  assert.match(judgeCaseReport({ buggyError: null, buggyFailed: true, fixedError: null, fixedFailures: ["t"] })!, /failed its own tests/);
});
