import { test } from "node:test";
import assert from "node:assert/strict";
import { masteryOf } from "../src/lib/mastery.ts";

const ids = ["l:a", "l:b", "l:c", "l:d", "l:e"];

test("a lesson is mastered only when every required question is solved", () => {
  const all = masteryOf(ids, () => true);
  assert.equal(all.mastered, true);
  assert.equal(all.score, 1);
});

test("a partial set never masters a lesson, even at 80 percent or more", () => {
  const four = masteryOf(ids, (id) => id !== "l:e");
  assert.equal(four.mastered, false);
  assert.equal(four.score, 0.8);
  assert.equal(masteryOf(ids, () => false).mastered, false);
});

test("a lesson with no required questions counts as mastered", () => {
  assert.deepEqual(masteryOf([], () => false), { score: 1, mastered: true });
});
