import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LESSONS } from "../src/content/lessons/index.ts";
import { buildGraph, frontier } from "../src/lib/graph.ts";
import { chooseNextStep } from "../src/lib/scheduler.ts";
import type { CodeAnswer, Track } from "../src/lib/types.ts";

/**
 * Code reading and code writing exercises stay close to what the learner has studied:
 * they use only Python that the engineering track has taught by the time the learner meets them,
 * and writing exercises stay a reasonable size.
 */

/** The engineering lesson that teaches each Python feature. */
const TAUGHT_IN: Record<string, string> = {
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
const taughtIn = (f: string) => TAUGHT_IN[f] ?? (f.startsWith("import:") ? "e1.4.1" : null);

/** Largest reasonable reference solution for a writing exercise. */
const MAX_LINES = 35;
const MAX_FUNCTIONS = 3;

/** The order in which a learner meets the lessons, following the real scheduler and unlocking rules. */
function learnerOrder(): string[] {
  const graph = buildGraph(new Map(LESSONS.map((l) => [l.id, l.links ?? {}])));
  const mastered = new Set<string>();
  const seq: string[] = [];
  let lastTrack: Track | null = null;
  for (;;) {
    const step = chooseNextStep({ openLesson: null, dueReviews: 0, frontier: frontier(graph, mastered), lastTrack, newLessonsToday: 0, pace: 1e9 });
    if (step.kind !== "begin") return seq;
    seq.push(step.lesson.id);
    mastered.add(step.lesson.id);
    lastTrack = step.lesson.track;
  }
}

const un = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

type Item = { id: string; lesson: string; source: string; given: string; write: boolean; answer?: CodeAnswer };
const items: Item[] = [];
for (const l of LESSONS) {
  for (const e of l.practice) {
    if (e.answer.kind === "code") {
      items.push({ id: `${l.id}:${e.key}`, lesson: l.id, source: e.answer.solution, given: e.answer.starter, write: true, answer: e.answer });
    } else if (/^read/.test(e.key)) {
      const html = renderToStaticMarkup(createElement(Fragment, null, e.prompt as never));
      const blocks = [...html.matchAll(/<pre class="code-block"><code>([\s\S]*?)<\/code><\/pre>/g)].map((m) => un(m[1]));
      items.push({ id: `${l.id}:${e.key}`, lesson: l.id, source: blocks.join("\n"), given: "", write: false });
    }
  }
}

const python = spawnSync("python3", ["--version"]).status === 0;
const FEATURES = resolve(process.cwd(), "tests/scope/features.py");
const features: (string[] | null)[] = python
  ? JSON.parse(spawnSync("python3", ["-I", FEATURES], { input: JSON.stringify(items.flatMap((i) => [i.source, i.given])), encoding: "utf8", maxBuffer: 1 << 26 }).stdout)
  : [];

const order = learnerOrder();
const position = new Map(order.map((id, i) => [id, i]));

test("the learner meets every lesson", () => {
  assert.equal(new Set(order).size, LESSONS.length);
});

items.forEach((item, i) => {
  test(`${item.id} uses only Python taught so far`, { skip: !python && "python3 is not installed" }, () => {
    const used = features[2 * i];
    if (used === null) return; // not Python: C, assembly or a shell session
    const given = new Set<string>((features[2 * i + 1] ?? []).filter((f) => f === "def"));
    const here = position.get(item.lesson)!;
    const early = used.filter((f) => {
      const t = taughtIn(f);
      return t !== null && !given.has(f) && position.get(t)! > here;
    });
    assert.ok(early.length === 0, `uses ${early.join(", ")} before the engineering track teaches ${early.length > 1 ? "them" : "it"}`);
  });
  if (item.write) {
    test(`${item.id} is a reasonable size`, () => {
      // A top-level block the starter already contains word for word is given, not asked for.
      const blocks = item.source.split(/\n(?=\S)/).filter((b) => !item.given.includes(b.trim()));
      const asked = blocks.join("\n");
      const lines = asked.split("\n").filter((s) => s.trim() && !s.trim().startsWith("#")).length;
      const functions = (asked.match(/^(def|class) /gm) ?? []).length;
      assert.ok(lines <= MAX_LINES, `the reference solution has ${lines} lines; keep it to ${MAX_LINES}`);
      assert.ok(functions <= MAX_FUNCTIONS, `asks for ${functions} functions or classes; keep it to ${MAX_FUNCTIONS}`);
    });
  }
});
