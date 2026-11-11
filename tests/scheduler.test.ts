import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseNextStep } from "../src/lib/scheduler.ts";
import type { LessonNode } from "../src/lib/graph.ts";
import type { Track } from "../src/lib/types.ts";

const node = (id: string, track: Track): LessonNode => ({
  id, title: id, course: "X", courseTitle: "X", chapter: 1, chapterTitle: "c", index: 0, track, tier: 0, authored: true,
});
const m = node("m", "mathematics"), l = node("l", "machine-learning"), e = node("e", "engineering");
const base = { openLesson: null, dueReviews: 0, frontier: [m, l, e], lastTrack: null, newLessonsToday: 0, pace: 2 };

test("an open lesson comes first, even with reviews due", () => {
  assert.equal(chooseNextStep({ ...base, openLesson: m, dueReviews: 5 }).kind, "continue");
});

test("due reviews come before new lessons", () => {
  assert.deepEqual(chooseNextStep({ ...base, dueReviews: 3 }), { kind: "review", count: 3 });
});

test("rotates through the three tracks", () => {
  const after = (lastTrack: Track) => {
    const step = chooseNextStep({ ...base, lastTrack });
    return step.kind === "begin" ? step.lesson.id : null;
  };
  assert.equal(after("mathematics"), "l");
  assert.equal(after("machine-learning"), "e");
  assert.equal(after("engineering"), "m");
});

test("skips a track with nothing unlocked", () => {
  const step = chooseNextStep({ ...base, frontier: [m, l], lastTrack: "machine-learning" });
  assert.equal(step.kind === "begin" && step.lesson.id, "m");
});

test("falls back to the same track when the others have nothing unlocked", () => {
  const step = chooseNextStep({ ...base, frontier: [m], lastTrack: "mathematics" });
  assert.equal(step.kind === "begin" && step.lesson.id, "m");
});

test("the daily pace never stops Learn, it only notes that it was passed", () => {
  const step = chooseNextStep({ ...base, newLessonsToday: 5 });
  assert.equal(step.kind, "begin");
  assert.equal(step.kind === "begin" && step.pastPace, true);
  const fresh = chooseNextStep({ ...base, newLessonsToday: 0 });
  assert.equal(fresh.kind === "begin" && fresh.pastPace, false);
});

test("waits when nothing is unlocked", () => {
  assert.deepEqual(chooseNextStep({ ...base, frontier: [] }), { kind: "rest", reason: "waiting" });
});
