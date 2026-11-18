import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BARE_STARTER, LEVELS, dueAt, drillMastery, levelInfo, limitFor, matchReadiness, nextLevel, planDrills, skillProfile,
  skillWords, type PlanAttempt, type PlanDrill,
} from "../src/lib/drill-plan.ts";
import { acceptVariant, drillRungFor, judgeReport, type VariantOutput } from "../src/lib/parton/drill-prompts.ts";
import { renderBrief } from "../src/lib/parton/render.ts";
import { DRILLS } from "../src/content/drills/index.ts";
import { drillTests } from "../src/content/drills/tests.ts";
import { python, runPython } from "./python.ts";

const DAY = 86_400_000;
const NOW = Date.parse("2026-11-17T12:00:00Z");
const at = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

/** A finished attempt, `daysAgo` days before NOW, taking `minutes` of a `limit`-minute limit. */
function done(drillId: string, daysAgo: number, outcome: PlanAttempt["outcome"], opts: { level?: number; minutes?: number; limit?: number; failed?: string[] } = {}): PlanAttempt {
  const limit = opts.limit ?? 20;
  const seconds = Math.round((opts.minutes ?? 10) * 60);
  return {
    drillId, level: opts.level ?? 1, limitMinutes: limit, startedAt: new Date(Date.parse(at(daysAgo)) - seconds * 1000).toISOString(),
    finishedAt: at(daysAgo), outcome, seconds, failedTests: opts.failed,
  };
}

const D: PlanDrill[] = [
  { id: "a", title: "A", minutes: 20, skills: ["Attention", "NumPy"] },
  { id: "b", title: "B", minutes: 20, skills: ["Optimisation", "NumPy"] },
  { id: "c", title: "C", minutes: 30, skills: ["Reinforcement learning"] },
];

test("levels climb on a pass in time, hold on a slow pass and step down after two misses", () => {
  assert.equal(nextLevel([]), 1);
  assert.equal(nextLevel([done("a", 3, "passed", { level: 1, minutes: 10 })]), 2);
  assert.equal(nextLevel([done("a", 3, "passed", { level: 1, minutes: 30 })]), 1, "a pass over time stays");
  const climb = [1, 2, 3, 4, 4].map((level, i) => done("a", 10 - i, "passed", { level, minutes: 5 }));
  assert.equal(nextLevel(climb), 4, "the variant level is the top");
  assert.equal(nextLevel([done("a", 3, "passed", { level: 2, minutes: 5 }), done("a", 2, "gave_up", { level: 3 })]), 3, "one miss holds");
  assert.equal(nextLevel([done("a", 3, "gave_up", { level: 3 }), done("a", 2, "abandoned", { level: 3 })]), 2, "two misses step down");
  assert.equal(nextLevel([done("a", 3, "gave_up", { level: 1 }), done("a", 2, "gave_up", { level: 1 })]), 1, "never below one");
});

test("time limits tighten with the level, never below five minutes", () => {
  assert.equal(limitFor(20, 1), 20);
  assert.equal(limitFor(20, 2), 15);
  assert.equal(limitFor(20, 3), 12);
  assert.equal(limitFor(6, 3), 5);
  assert.equal(levelInfo(9).level, LEVELS.length);
  assert.equal(levelInfo(0).level, 1);
});

test("mastery weighs recent attempts most and rewards passes in time at higher levels", () => {
  assert.equal(drillMastery([]), null);
  const miss = drillMastery([done("a", 1, "gave_up")])!;
  const slow = drillMastery([done("a", 1, "passed", { minutes: 30 })])!;
  const fast = drillMastery([done("a", 1, "passed", { minutes: 5 })])!;
  const fastHigh = drillMastery([done("a", 1, "passed", { minutes: 5, level: 3 })])!;
  assert.ok(miss < slow && slow < fast && fast < fastHigh && fastHigh <= 1);
  const recovering = drillMastery([done("a", 5, "gave_up"), done("a", 1, "passed", { minutes: 5 })])!;
  const slipping = drillMastery([done("a", 5, "passed", { minutes: 5 }), done("a", 1, "gave_up")])!;
  assert.ok(recovering > slipping, "the newest attempt counts most");
});

test("missed drills come back the next day and passes in time space out", () => {
  assert.equal(dueAt([]), null);
  assert.equal(dueAt([done("a", 0, "gave_up")])!.getTime(), NOW + DAY);
  assert.equal(dueAt([done("a", 0, "passed", { minutes: 30 })])!.getTime(), NOW + 2 * DAY);
  assert.equal(dueAt([done("a", 0, "passed", { minutes: 5 })])!.getTime(), NOW + 4 * DAY);
  const streak = [done("a", 20, "passed", { minutes: 5 }), done("a", 10, "passed", { minutes: 5 }), done("a", 0, "passed", { minutes: 5 })];
  assert.equal(dueAt(streak)!.getTime(), NOW + 16 * DAY);
});

test("skill words match readiness skills across spelling and plurals", () => {
  assert.deepEqual(skillWords("Transformers"), ["transformer"]);
  assert.deepEqual(skillWords("Optimisation"), skillWords("optimization"));
  const readiness = [
    { name: "Transformer architectures", area: "Modelling", level: 1, frequency: 9 },
    { name: "Optimization and training stability", area: "Training", level: 3, frequency: 7 },
  ];
  assert.equal(matchReadiness("Transformers", readiness)[0].name, "Transformer architectures");
  assert.equal(matchReadiness("Optimisation", readiness)[0].level, 3);
  assert.deepEqual(matchReadiness("Tokenisation", readiness), []);
});

test("skills are ranked weakest first, and readiness gaps raise a skill", () => {
  const attempts = [done("a", 2, "passed", { minutes: 5 }), done("b", 2, "gave_up")];
  const plain = skillProfile(D, attempts);
  assert.deepEqual(plain.slice(0, 2).map((s) => s.skill).sort(), ["Optimisation", "Reinforcement learning"], "a failed skill and an untried one are weakest");
  assert.equal(plain.find((s) => s.skill === "Reinforcement learning")!.tried, false);
  assert.ok(plain.find((s) => s.skill === "Optimisation")!.weakness > plain.find((s) => s.skill === "Attention")!.weakness);
  const withGap = skillProfile(D, attempts, [{ name: "Attention mechanisms", area: "Modelling", level: 0, frequency: 5 }]);
  const before = plain.find((s) => s.skill === "Attention")!;
  const after = withGap.find((s) => s.skill === "Attention")!;
  assert.equal(after.readinessGap, 1);
  assert.ok(after.weakness > before.weakness);
});

test("the plan puts an open attempt first, then failed drills that are due, then weak new ones", () => {
  const open: PlanAttempt = { ...done("c", 0, null), finishedAt: null, outcome: null, seconds: null };
  assert.equal(planDrills(D, [open], [], NOW).next!.kind, "open");

  const attempts = [
    done("a", 3, "gave_up", { failed: ["masks the future", "scales the scores"] }),
    done("b", 10, "passed", { minutes: 5 }),
  ];
  const plan = planDrills(D, attempts, [], NOW);
  assert.equal(plan.next!.drillId, "a");
  assert.equal(plan.next!.kind, "retry");
  assert.match(plan.next!.reason, /gave up on this 3 days ago/);
  assert.deepEqual(plan.next!.watch, ["masks the future", "scales the scores"]);
  assert.equal(plan.queue[1].drillId, "c", "the untried drill comes next");
  assert.equal(plan.queue[1].kind, "new");
  assert.equal(plan.queue[2].kind, "due", "a pass in time ten days ago is due again");
});

test("nothing is next when every drill is held and not yet due", () => {
  const attempts = D.map((d) => done(d.id, 1, "passed", { minutes: 5, limit: d.minutes }));
  const plan = planDrills(D, attempts, [], NOW);
  assert.equal(plan.next, null);
  assert.ok(plan.queue.every((p) => p.kind === "later"));
  assert.ok(plan.queue.every((p) => p.level === 2));
});

test("the bare starter fails every drill", { skip: !python && "python3 is not installed" }, () => {
  for (const drill of DRILLS) {
    const out = runPython({ code: BARE_STARTER, setup: drill.setup, tests: drillTests(drill) });
    assert.ok(out.tests.some((r) => !r.passed), `${drill.id} fails from the bare starter`);
  }
});

const VARIANT: VariantOutput = {
  title: "Grouped-query attention",
  summary: "Attention where several query heads share one key and value head.",
  twist: "Key and value heads are shared across groups of query heads.",
  minutes: 25,
  brief: "Write `gqa(q, k, v)`.\n\n```python\ndef gqa(q, k, v): ...\n```\n\nThe scores are $QK^T / \\sqrt{d}$.",
  starter: "import numpy as np\n\ndef gqa(q, k, v):\n    raise NotImplementedError\n",
  solution: "import numpy as np\n\ndef gqa(q, k, v):\n    s = q @ k.T / np.sqrt(q.shape[-1])\n    return s\n",
  prelude: "import numpy as _ref_np\n\ndef _ref_x():\n    return 1\n",
  setup: "",
  tests: ["shapes", "values", "softmax rows", "masking"].map((name) => ({ name, code: "assert True" })),
  mutants: [
    { from: " / np.sqrt(q.shape[-1])", to: "", why: "no scale" },
    { from: "q @ k.T", to: "k @ q.T", why: "swapped" },
    { from: "not in the solution", to: "x", why: "dropped" },
  ],
};

test("a variant is accepted only when it is complete and its wrong answers match its solution", () => {
  const ok = acceptVariant(VARIANT);
  assert.ok(ok.ok);
  if (ok.ok) assert.equal(ok.variant.mutants.length, 2, "a wrong answer whose text is not in the solution is dropped");
  const clamped = acceptVariant({ ...VARIANT, minutes: 200 });
  assert.ok(clamped.ok && clamped.variant.minutes === 45);
  assert.equal(acceptVariant({ ...VARIANT, tests: VARIANT.tests.slice(0, 3) }).ok, false);
  assert.equal(acceptVariant({ ...VARIANT, tests: [...VARIANT.tests.slice(0, 3), { name: "shapes", code: "assert 1" }] }).ok, false);
  assert.equal(acceptVariant({ ...VARIANT, prelude: "import numpy as _ref_np\nhelper = 3\n" }).ok, false, "prelude names must start with _ref");
  assert.equal(acceptVariant({ ...VARIANT, starter: VARIANT.solution }).ok, false);
  assert.equal(acceptVariant({ ...VARIANT, mutants: VARIANT.mutants.slice(1) }).ok, false);
});

test("a variant's check report is judged strictly", () => {
  const good = { solutionFailures: [], solutionError: null, starterFailed: true, caught: [true, true] };
  assert.equal(judgeReport(good, 2), null);
  assert.match(judgeReport({ ...good, solutionFailures: ["shapes"] }, 2)!, /failed its own tests: shapes/);
  assert.match(judgeReport({ ...good, solutionError: "Traceback\nNameError: x" }, 2)!, /NameError: x/);
  assert.match(judgeReport({ ...good, starterFailed: false }, 2)!, /starter already passed/);
  assert.match(judgeReport({ ...good, caught: [true, false] }, 2)!, /1 of 2/);
  assert.match(judgeReport({ ...good, caught: [true] }, 2)!, /not every wrong answer/);
});

test("the drill hint ladder climbs one rung per ask and stops at five", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map(drillRungFor), [1, 2, 3, 4, 5, 5, 5]);
});

test("variant briefs render code blocks escaped, and maths", () => {
  const html = renderBrief("Write `f(x)`.\n\n```python\nif a < b:\n    return x\n```\n\nThen $x^2$.");
  assert.match(html, /<pre class="code-block"><code>if a &lt; b:\n {4}return x<\/code><\/pre>/);
  assert.match(html, /<code>f\(x\)<\/code>/);
  assert.match(html, /katex/);
  assert.doesNotMatch(renderBrief("<script>alert(1)</script>"), /<script>/);
});
