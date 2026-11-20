import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGraph, frontier } from "../src/lib/graph.ts";
import { chooseNextStep } from "../src/lib/scheduler.ts";
import {
  buildToday,
  drillLock,
  drillPulls,
  isLessonItem,
  lessonsBehind,
  makeWeeklyPlan,
  matchLessons,
  needStates,
  needsReplan,
  projectPulls,
  readinessPulls,
  remedies,
  topPull,
  troublePulls,
  weekKey,
  weeklyQuota,
  type Pull,
  type TodayItem,
} from "../src/lib/guide/core.ts";
import { acceptLessons } from "../src/lib/guide/prompts.ts";
import { planDrills } from "../src/lib/drill-plan.ts";
import { acceptAssessment } from "../src/lib/readiness/core.ts";
import { DRILLS } from "../src/content/drills/index.ts";
import outline from "../src/content/outline.json" with { type: "json" };

// m0.1.1 -> m0.1.2 -> m0.1.3 in one chapter; l0.1.1 and e0.1.1 open from the start.
const g = buildGraph(new Map([["m0.1.1", {}], ["m0.1.2", {}], ["m0.1.3", {}], ["l0.1.1", {}], ["e0.1.1", {}]]));
const none = new Set<string>();
const pull = (lessonId: string, source: Pull["source"], weight = 1): Pull => ({ lessonId, source, weight, why: `${source} wants ${lessonId}` });

test("a pull counts only on a lesson whose prerequisites are mastered", () => {
  const f = frontier(g, none);
  // m0.1.2 is locked until m0.1.1 is mastered, so pulling it does nothing.
  assert.equal(topPull(f, [pull("m0.1.2", "project")]), null);
  assert.equal(topPull(frontier(g, new Set(["m0.1.1"])), [pull("m0.1.2", "project")])?.lesson.id, "m0.1.2");
});

test("projects outrank drills, which outrank the weekly plan", () => {
  const f = frontier(g, none);
  assert.equal(topPull(f, [pull("l0.1.1", "readiness", 9), pull("e0.1.1", "drill")])?.lesson.id, "e0.1.1");
  assert.equal(topPull(f, [pull("l0.1.1", "project"), pull("e0.1.1", "drill")])?.lesson.id, "l0.1.1");
});

test("the scheduler begins a pulled frontier lesson, says why, and keeps the rest of its order", () => {
  const base = { openLesson: null, frontier: frontier(g, none), lastTrack: null, newLessonsToday: 0, pace: 2 };
  const step = chooseNextStep({ ...base, pulls: [pull("e0.1.1", "readiness")] });
  assert.equal(step.kind === "begin" && step.lesson.id, "e0.1.1");
  assert.equal(step.kind === "begin" && step.guided, "readiness");
  // A locked pull is ignored: the usual rotation picks.
  const plain = chooseNextStep({ ...base, pulls: [pull("m0.1.3", "project")] });
  assert.equal(plain.kind === "begin" && plain.lesson.id, "m0.1.1");
  assert.equal(plain.kind === "begin" && plain.guided, undefined);
});

test("weeks run Monday to Sunday in India time", () => {
  assert.equal(weekKey(new Date("2026-11-18T08:00:00Z")), "2026-W47");
  // Sunday 23:00 IST is still the same week; Monday 00:30 IST is the next.
  assert.equal(weekKey(new Date("2026-11-22T17:30:00Z")), "2026-W47");
  assert.equal(weekKey(new Date("2026-11-22T19:00:00Z")), "2026-W48");
  assert.equal(weekKey(new Date("2027-01-01T00:00:00Z")), "2026-W53");
});

test("the weekly plan takes the weakest skills that have lessons, and its quota is half the week", () => {
  const plan = makeWeeklyPlan(
    [
      { key: "a", name: "A", gap: 0.2, lessons: ["l0.1.1"] },
      { key: "b", name: "B", gap: 0.9, lessons: ["m0.1.1", "m0.1.2"] },
      { key: "c", name: "C", gap: 0.5, lessons: [] },
      { key: "d", name: "D", gap: 0.4, lessons: ["e0.1.1"] },
      { key: "e", name: "E", gap: 0.3, lessons: ["m0.1.3"] },
    ],
    new Set(["m0.1.1"]),
    { week: "2026-W47", basis: "check:3", pace: 2, now: new Date("2026-11-18T00:00:00Z") },
  );
  assert.deepEqual(plan.skills.map((s) => [s.key, s.lessons]), [["b", ["m0.1.2"]], ["d", ["e0.1.1"]], ["e", ["m0.1.3"]]]);
  assert.equal(plan.quota, weeklyQuota(2));
  assert.equal(weeklyQuota(2), 7);
  assert.equal(needsReplan(plan, "2026-W47", "check:3"), false);
  assert.equal(needsReplan(plan, "2026-W48", "check:3"), true);
  assert.equal(needsReplan(plan, "2026-W47", "check:4"), true, "a quarterly refresh makes a new plan");
  assert.equal(needsReplan(null, "2026-W47", "check:3"), true);
  // Pulls stop once the week's quota of plan lessons has been begun.
  assert.equal(readinessPulls(plan, 0, none).length, 3);
  assert.deepEqual(readinessPulls(plan, 7, none), []);
  assert.deepEqual(readinessPulls(null, 0, none), []);
});

test("lessons are matched to a skill by title when Parton hasn't matched them", () => {
  const nodes = [
    { id: "x1", title: "Attention as soft lookup", chapterTitle: "Attention", authored: true },
    { id: "x2", title: "Multi-head attention", chapterTitle: "Attention", authored: true },
    { id: "x3", title: "Hash tables", chapterTitle: "Hashing", authored: true },
    { id: "x4", title: "Attention, unwritten", chapterTitle: "Attention", authored: false },
  ].map((n, i) => ({ ...n, course: "X", courseTitle: "X", chapter: 1, index: i, track: "machine-learning" as const, tier: 1 }));
  assert.deepEqual(matchLessons("Attention", nodes), ["x1", "x2"]);
  assert.deepEqual(matchLessons("Hash tables", nodes), ["x3"]);
  assert.deepEqual(matchLessons("Distributed training", nodes), []);
});

test("a project need queues and locks only once its prerequisites are mastered", () => {
  const needs = [{ lessonId: "m0.1.1", why: "a" }, { lessonId: "m0.1.2", why: "b" }, { lessonId: "l0.1.1", why: "c" }, { lessonId: "nope", why: "d" }];
  const states = needStates(needs, g, new Set(["l0.1.1"]));
  assert.deepEqual(states.map((s) => [s.lessonId, s.state]), [["m0.1.1", "active"], ["m0.1.2", "waiting"], ["l0.1.1", "met"]]);
  assert.deepEqual(projectPulls(states, "Experiments").map((p) => p.lessonId), ["m0.1.1"]);
});

test("notebook trouble queues only unmastered lessons that are open", () => {
  const pulls = troublePulls([{ lessonId: "m0.1.1", note: "n" }, { lessonId: "m0.1.3", note: "n" }, { lessonId: "l0.1.1", note: "n" }], g, new Set(["l0.1.1"]));
  assert.deepEqual(pulls.map((p) => p.lessonId), ["m0.1.1"]);
});

const drill = { id: "d", title: "D", lessons: ["m0.1.1", "l0.1.1"], testLessons: { "softmax works": ["m0.1.1"], "shapes": ["l0.1.1", "m0.1.3"] } };

test("a drill opens once every lesson it tests is mastered", () => {
  assert.deepEqual(drillLock(drill, new Set(["m0.1.1"])), { locked: true, missing: ["l0.1.1"] });
  assert.deepEqual(drillLock(drill, new Set(["m0.1.1", "l0.1.1"])), { locked: false, missing: [] });
});

test("a failed test sends the learner to the lessons behind it", () => {
  assert.deepEqual(lessonsBehind(drill, ["softmax works"]), ["m0.1.1"]);
  assert.deepEqual(lessonsBehind(drill, ["unknown test"]), ["m0.1.1", "l0.1.1"]);
  assert.deepEqual(lessonsBehind(drill, []), ["m0.1.1", "l0.1.1"]);
  const failed = { drillId: "d", finishedAt: "2026-11-17T10:00:00Z", failedTests: ["shapes"] };
  const never = () => false;
  // l0.1.1 is mastered, so it is revisited; m0.1.3 is locked, so it is left alone.
  const r = remedies(drill, failed, g, new Set(["l0.1.1"]), never);
  assert.deepEqual(r.map((x) => [x.lessonId, x.mode, x.tests]), [["l0.1.1", "revisit", ["shapes"]]]);
  // Once revisited after the miss, nothing is left to do.
  assert.deepEqual(remedies(drill, failed, g, new Set(["l0.1.1"]), (_id, since) => since === failed.finishedAt), []);
  assert.deepEqual(remedies(drill, null, g, none, never), []);
  // An unmastered, open lesson is learnt, and Learn is pulled to it.
  const learn = remedies(drill, { ...failed, failedTests: ["softmax works"] }, g, none, never);
  assert.deepEqual(learn.map((x) => [x.lessonId, x.mode]), [["m0.1.1", "learn"]]);
  assert.deepEqual(drillPulls(learn, () => "D").map((p) => [p.lessonId, p.source]), [["m0.1.1", "drill"]]);
});

test("a blocked drill is never up next, but an attempt under way still is", () => {
  const D = [{ id: "a", title: "A", minutes: 20, skills: ["X"] }, { id: "b", title: "B", minutes: 20, skills: ["Y"] }];
  const plan = planDrills(D, [], [], Date.now(), new Map([["a", "Opens once you have mastered L."]]));
  assert.equal(plan.next?.drillId, "b");
  assert.equal(plan.queue.find((p) => p.drillId === "a")?.kind, "locked");
  const all = planDrills(D, [], [], Date.now(), new Map([["a", "x"], ["b", "y"]]));
  assert.equal(all.next, null);
  const open = [{ drillId: "a", level: 1, limitMinutes: 20, startedAt: new Date().toISOString(), finishedAt: null, outcome: null, seconds: null }];
  assert.equal(planDrills(D, open, [], Date.now(), new Map([["a", "x"]])).next?.kind, "open");
});

test("the day's queue puts what is open first, then weaves the drill and project into the lessons", () => {
  const lesson = (id: string): TodayItem => ({ kind: "begin", lessonId: id, title: id, why: null, pastPace: false });
  const queue = buildToday({
    head: [{ kind: "continue", lessonId: "c", title: "c", why: null }],
    revisits: [{ kind: "revisit", lessonId: "r", title: "r", why: "w" }],
    lessons: [lesson("x"), lesson("y")],
    drill: { kind: "drill", drillId: "d", title: "D", why: "w" },
    project: { kind: "project", projectId: 1, title: "P", why: "w" },
  });
  assert.deepEqual(queue.map((i) => i.kind), ["continue", "revisit", "begin", "drill", "project", "begin"]);
  assert.equal(queue.find(isLessonItem)?.kind, "continue");
  assert.deepEqual(buildToday({ head: [], revisits: [], lessons: [], drill: null, project: null }), []);
});

test("Parton's lesson picks keep only listed lessons, once each", () => {
  const out = acceptLessons([{ lesson: "a" }, { lesson: " a " }, { lesson: "zz" }, { lesson: "b" }, { lesson: "c" }], new Set(["a", "b", "c"]), 2);
  assert.deepEqual(out.map((o) => o.lesson), ["a", "b"]);
  assert.deepEqual(acceptLessons(undefined, new Set(["a"]), 2), []);
});

test("Readiness keeps the lessons Parton says teach a skill, if they are lessons on offer", () => {
  const [a] = acceptAssessment(
    { skills: [{ skill: "Attention", evidence: [], level: 0, reason: "", next_kind: "none", next_ref: "", next_title: "", next_why: "", lessons: ["lesson:l4.4.3", "drill:attention", "lesson:zz", "lesson:l4.4.3"] }] },
    [{ key: "attention", ownKinds: [] }],
    [],
    [
      { ref: "lesson:l4.4.3", kind: "lesson", title: "Self-attention", detail: "", open: false },
      { ref: "drill:attention", kind: "drill", title: "Attention", detail: "", open: true },
    ],
  );
  assert.deepEqual(a.lessons, ["l4.4.3"]);
});

test("every drill names real lessons, and every test it maps names a real test", () => {
  const ids = new Set((outline as { courses: { chapters: { lessons: { id: string }[] }[] }[] }).courses.flatMap((c) => c.chapters.flatMap((ch) => ch.lessons.map((l) => l.id))));
  for (const d of DRILLS) {
    assert.ok(d.lessons.length > 0, `${d.id} names no lessons`);
    for (const id of d.lessons) assert.ok(ids.has(id), `${d.id}: unknown lesson ${id}`);
    const tests = new Set(d.tests.map((t) => t.name));
    for (const [name, lessons] of Object.entries(d.testLessons ?? {})) {
      assert.ok(tests.has(name), `${d.id}: no test named "${name}"`);
      for (const id of lessons) assert.ok(ids.has(id), `${d.id}: unknown lesson ${id}`);
    }
  }
});
