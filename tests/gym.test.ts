import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CASES, caseTests } from "../src/content/gym/index.ts";
import { CASE_KINDS, fixedProgram, functionsIn } from "../src/content/gym/types.ts";
import { buildGraph, withPrerequisites, type Graph } from "../src/lib/graph.ts";
import { authoredLinks, taughtIn, PYTHON } from "../scripts/code-prerequisites.ts";
import { CURVES_FILE, computeCurves, type CurveSet } from "../scripts/gym-curves.ts";
import { python, runPython } from "./python.ts";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Every Debugging gym case must be a real debugging exercise: its buggy script runs without an error (the bug is
 * silent), fails at least one hidden test, and the reference fix passes them all. Its lessons must teach every
 * piece of Python the script uses, so a case never opens before the learner has met what it relies on.
 */

const skip = !python && "python3 is not installed";
const graph = buildGraph(withPrerequisites(authoredLinks()));

function closure(g: Graph, ids: readonly string[]): Set<string> {
  const all = new Set<string>();
  const stack = [...ids];
  while (stack.length) {
    const id = stack.pop()!;
    if (all.has(id)) continue;
    all.add(id);
    stack.push(...(g.requires.get(id) ?? []));
  }
  return all;
}

test("every case has a unique id and sound metadata", () => {
  const ids = CASES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "case ids are unique");
  for (const c of CASES) {
    assert.match(c.id, /^[a-z0-9-]+$/, `${c.id} is URL-safe`);
    assert.ok(CASE_KINDS.includes(c.kind), `${c.id} is one of the kinds the gym covers`);
    assert.ok(c.minutes >= 5 && c.minutes <= 45, `${c.id} has a sensible time`);
    assert.equal(c.causes.length, 4, `${c.id} offers four causes`);
    assert.equal(c.causes.filter((x) => x.right).length, 1, `${c.id} has exactly one right cause`);
    assert.ok(functionsIn(c.program).includes(c.suspect), `${c.id}: the suspect ${c.suspect} is a function in the script`);
    const names = c.tests.map((t) => t.name);
    assert.ok(names.length >= 3, `${c.id} has at least three hidden tests`);
    assert.equal(new Set(names).size, names.length, `${c.id} test names are unique`);
    for (const key of Object.keys(c.testLessons ?? {})) assert.ok(names.includes(key), `${c.id}: testLessons names a real test, ${key}`);
    for (const [from] of c.fix) assert.equal(c.program.split(from).length, 2, `${c.id}: each fix replaces text that appears exactly once`);
    assert.notEqual(fixedProgram(c), c.program, `${c.id}: the fix changes the script`);
  }
});

test("every case's lessons exist, and the lessons behind its bug are among what it relies on", () => {
  for (const c of CASES) {
    for (const id of [...c.lessons, ...c.bugLessons, ...Object.values(c.testLessons ?? {}).flat()]) {
      assert.ok(graph.nodes.has(id), `${c.id} names lesson ${id}, which is in the curriculum`);
    }
    const covered = closure(graph, c.lessons);
    for (const id of [...c.bugLessons, ...Object.values(c.testLessons ?? {}).flat()]) {
      assert.ok(covered.has(id), `${c.id}: ${id} is one of its lessons or their prerequisites`);
    }
  }
});

test("a case whose lessons are not all written stays locked, and most cases can open", () => {
  const open = CASES.filter((c) => c.lessons.every((id) => graph.nodes.get(id)?.authored));
  assert.ok(open.length >= 6, "most cases rely only on lessons that exist");
  for (const kind of CASE_KINDS) assert.ok(CASES.some((c) => c.kind === kind), `some case plants a ${kind} bug`);
});

/** Each case's fix must land inside the function it names as the suspect. */
test("every fix lands in the suspect function", () => {
  for (const c of CASES) {
    const lines = c.program.split("\n");
    const start = lines.findIndex((l) => l.startsWith(`def ${c.suspect}(`));
    let end = lines.findIndex((l, i) => i > start && /^\S/.test(l));
    if (end === -1) end = lines.length;
    const body = lines.slice(start, end).join("\n");
    for (const [from] of c.fix) assert.ok(body.includes(from), `${c.id}: the fix is inside ${c.suspect}`);
  }
});

test("every case's script uses only Python its lessons teach", { skip }, () => {
  const script = resolve(process.cwd(), "tests/scope/features.py");
  const sources = CASES.flatMap((c) => [c.program, fixedProgram(c)]);
  const run = spawnSync("python3", ["-I", script], { input: JSON.stringify(sources), encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const features: (string[] | null)[] = JSON.parse(run.stdout);
  CASES.forEach((c, i) => {
    const covered = closure(graph, c.lessons);
    const used = new Set([PYTHON, ...(features[2 * i] ?? []), ...(features[2 * i + 1] ?? [])]);
    for (const f of used) {
      const teacher = taughtIn(f);
      if (teacher) assert.ok(covered.has(teacher), `${c.id} uses ${f}, taught in ${teacher}, which its lessons do not include`);
    }
  });
});

for (const c of CASES) {
  const tests = caseTests(c);
  test(`case ${c.id}: the buggy script runs without an error but fails a hidden test`, { skip }, () => {
    const out = runPython({ code: c.program, tests });
    assert.equal(out.program.error, null, `the script runs: ${out.program.error}`);
    assert.ok(out.tests.some((r) => !r.passed), "some hidden test catches the bug");
  });
  test(`case ${c.id}: the reference fix passes every hidden test`, { skip }, () => {
    const out = runPython({ code: fixedProgram(c), tests });
    assert.equal(out.program.error, null, `the fixed script runs: ${out.program.error}`);
    for (const r of out.tests) assert.ok(r.passed, `the fix passes "${r.name}": ${r.message}`);
  });
}

test("the symptom charts match what the scripts produce", { skip }, () => {
  const stored = JSON.parse(readFileSync(CURVES_FILE, "utf8")) as Record<string, CurveSet>;
  const fresh = computeCurves();
  const close = (a: number | null, b: number | null) => (a === null || b === null ? a === b : Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(b)));
  for (const c of CASES) {
    const s = stored[c.id];
    const f = fresh[c.id];
    assert.ok(s, `${c.id} has a chart; run node --import tsx scripts/gym-curves.ts`);
    assert.deepEqual(s.series.map((x) => x.label), f.series.map((x) => x.label), `${c.id}: chart series are up to date`);
    s.series.forEach((x, i) => {
      assert.deepEqual(x.x, f.series[i].x, `${c.id}: chart steps are up to date`);
      x.y.forEach((v, j) => assert.ok(close(v, f.series[i].y[j]), `${c.id}: chart values are up to date; run node --import tsx scripts/gym-curves.ts`));
    });
    assert.equal(Boolean(s.floor), Boolean(f.floor), `${c.id}: chart floor is up to date`);
  }
});
