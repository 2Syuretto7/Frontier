import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGraph, frontier, isUnlocked, withCodePrerequisites, COURSES } from "../src/lib/graph.ts";

const authored = new Map([["m0.1.1", {}], ["m0.1.2", {}], ["l0.1.1", { parallels: ["m0.1.1"] }], ["e0.1.1", {}]]);
const g = buildGraph(authored);

test("covers the whole outline", () => {
  const total = COURSES.reduce((s, c) => s + c.chapters.reduce((t, ch) => t + ch.lessons.length, 0), 0);
  assert.equal(g.order.length, total);
  assert.ok(total > 1200);
});

test("lessons chain within a chapter and across chapters", () => {
  assert.deepEqual(g.requires.get("m0.1.2"), ["m0.1.1"]);
  assert.deepEqual(g.requires.get("m0.2.1"), ["m0.1.5"]);
});

test("a course starts after its required courses", () => {
  const m1Last = COURSES.find((c) => c.code === "M0")!.chapters.at(-1)!.lessons.at(-1)!.id;
  assert.ok(g.requires.get("m1.1.1")!.includes(m1Last));
});

test("frontier starts with the first lesson of each track", () => {
  assert.deepEqual(frontier(g, new Set()).map((n) => n.id), ["m0.1.1", "l0.1.1", "e0.1.1"]);
  assert.deepEqual(frontier(g, new Set(["m0.1.1"])).map((n) => n.id), ["m0.1.2", "l0.1.1", "e0.1.1"]);
  assert.equal(isUnlocked(g, "m0.1.3", new Set(["m0.1.1"])), false);
});

test("rejects links to unknown lessons and cycles", () => {
  assert.throws(() => buildGraph(new Map([["m0.1.1", { revisits: ["nope"] }]])), /unknown lesson/);
  assert.throws(() => buildGraph(new Map([["m0.1.1", { requires: ["m0.1.3"] }]])), /cycle/);
});

test("a lesson that revisits an earlier one opens only once that one is mastered", () => {
  const g2 = buildGraph(new Map([["l0.1.1", { revisits: ["m0.1.2"] }], ["m0.1.1", {}], ["m0.1.2", {}]]));
  assert.equal(isUnlocked(g2, "l0.1.1", new Set()), false);
  assert.equal(isUnlocked(g2, "l0.1.1", new Set(["m0.1.1", "m0.1.2"])), true);
  assert.throws(() => buildGraph(new Map([["m0.1.1", { revisits: ["m0.1.3"] }]])), /cycle/);
});

test("parallels and foreshadows never gate", () => {
  const g2 = buildGraph(new Map([["l0.1.1", { parallels: ["m0.1.2"], foreshadows: ["m0.1.3"] }]]));
  assert.equal(isUnlocked(g2, "l0.1.1", new Set()), true);
});

test("a lesson whose code uses Python opens only after the engineering lesson that teaches it", () => {
  const g2 = buildGraph(withCodePrerequisites(new Map([["m0.1.1", {}], ["e0.1.1", {}]])));
  assert.ok(g2.requires.get("m0.1.1")!.includes("e0.1.1"));
  assert.deepEqual(frontier(g2, new Set()).map((n) => n.id), ["e0.1.1"]);
  assert.deepEqual(frontier(g2, new Set(["e0.1.1"])).map((n) => n.id), ["m0.1.1"]);
});
