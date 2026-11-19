import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "../src/content/interview/index.ts";
import { buildGraph, withPrerequisites, type Graph } from "../src/lib/graph.ts";
import { topPull } from "../src/lib/guide/core.ts";
import { frontier } from "../src/lib/graph.ts";
import {
  MODE_ORDER,
  answerScore,
  interviewPulls,
  interviewRemedies,
  modeSummaries,
  nextMode,
  pickQuestions,
  planQuestions,
  questionDue,
  questionLock,
  sessionWanted,
  untaughtIdeas,
  type GradedAnswer,
} from "../src/lib/interview/core.ts";
import { acceptGrade, acceptWritten } from "../src/lib/interview/prompts.ts";
import { authoredLinks, conceptUses } from "../scripts/concept-prerequisites.ts";
import { itemFeatures, pythonAvailable, taughtIn, type CodeItem } from "../scripts/code-prerequisites.ts";
import { python, runPython } from "./python.ts";

/**
 * The mock interview engine. Every question waits for the lessons it rests on, so it can never ask about an idea,
 * or for a piece of Python, before Learn has taught it; each rubric criterion sends a weak answer only to lessons
 * that open in time; and the rules that pace, lock and repair are checked without a database.
 */

const graph = buildGraph(withPrerequisites(authoredLinks()));

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
const closure = (lessons: string[]) => new Set(lessons.flatMap((l) => [l, ...ancestors(graph, l)]));

// ---------------------------------------------------------------------------------------------
// The bank

test("every question has a unique id, a known mode, real lessons and a sound rubric", () => {
  const ids = new Set<string>();
  for (const q of QUESTIONS) {
    assert.ok(!ids.has(q.id), `${q.id} is listed twice`);
    assert.ok(!/^w\d/.test(q.id), `${q.id}: ids starting with w and a digit are kept for questions Parton writes`);
    ids.add(q.id);
    assert.ok(MODE_ORDER.includes(q.mode), `${q.id}: unknown mode ${q.mode}`);
    for (const l of q.lessons) assert.ok(graph.nodes.has(l), `${q.id}: unknown lesson ${l}`);
    assert.ok(q.rubric.length >= 3 && q.rubric.length <= 5, `${q.id}: a rubric needs three to five criteria`);
    const crit = new Set<string>();
    for (const c of q.rubric) {
      assert.ok(!crit.has(c.id), `${q.id}: criterion ${c.id} twice`);
      crit.add(c.id);
      assert.ok(c.text.length > 20, `${q.id}: criterion ${c.id} needs a description`);
    }
    assert.ok(q.notes.length > 20, `${q.id}: the interviewer needs notes`);
    assert.equal(Boolean(q.starter), q.mode === "coding", `${q.id}: coding questions, and only they, have a starter`);
  }
  // Every mode has questions, and a question that rests on no lesson waits for the learner's own work instead.
  for (const m of MODE_ORDER) assert.ok(QUESTIONS.some((q) => q.mode === m), `no ${m} questions`);
  for (const q of QUESTIONS.filter((x) => x.lessons.length === 0)) assert.ok(q.needs?.length, `${q.id} would be open from the first day`);
});

test("each weak criterion sends the learner only to lessons that open in time", () => {
  for (const q of QUESTIONS) {
    const before = closure(q.lessons);
    for (const c of q.rubric) for (const l of c.lessons) assert.ok(before.has(l), `${q.id} ${c.id} points to ${l}, which the question does not wait for`);
  }
});

const texts = new Map(
  QUESTIONS.map((q) => [q.id, { puzzle: "", intuition: "", theory: "", practice: [q.prompt, ...q.rubric.map((c) => c.text)].join("\n") }]),
);
const uses = conceptUses(texts as Parameters<typeof conceptUses>[0]);

for (const q of QUESTIONS) {
  test(`question ${q.id} opens only after the ideas it uses are taught`, () => {
    const before = closure(q.lessons);
    const missing = uses.filter((u) => u.lesson === q.id && !u.teachers.some((t) => before.has(t))).map((u) => `${u.concept} (taught in ${u.teachers.join(", ")})`);
    assert.deepEqual(missing, []);
  });
}

const haveFeatures = pythonAvailable();
for (const q of QUESTIONS.filter((x) => x.mode === "coding")) {
  test(`coding question ${q.id} opens only after the Python it needs is taught`, { skip: !haveFeatures && "python3 is not installed" }, () => {
    const item: CodeItem = { lesson: q.id, where: "solution", source: q.solution!, given: q.starter!, write: true };
    const [features] = itemFeatures([item]);
    const before = closure(q.lessons);
    assert.deepEqual([...new Set((features ?? []).filter((f) => taughtIn(f) && !before.has(taughtIn(f)!)))], []);
  });

  test(`coding question ${q.id}: the reference passes every check and the starter does not`, { skip: !python && "python3 is not installed" }, () => {
    assert.ok(q.solution && q.checks?.length, "a coding question needs a solution and checks");
    const good = runPython({ code: q.solution!, tests: q.checks! });
    assert.equal(good.program.error, null, good.program.error ?? "");
    for (const t of good.tests) assert.ok(t.passed, `${t.name}: ${t.message}`);
    const bad = runPython({ code: q.starter!, tests: q.checks! });
    assert.ok(bad.tests.some((t) => !t.passed), "the starter should fail a check");
  });
}

// ---------------------------------------------------------------------------------------------
// Rules

const DAY = 86_400_000;
const T0 = Date.parse("2026-11-01T06:00:00Z");
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const graded = (questionId: string, days: number, scores: number[], ids = ["a", "b", "c"]): GradedAnswer => ({
  questionId, sessionId: 1, at: at(days), scores: scores.map((score, i) => ({ criterion: ids[i], score })),
});

const tiny = buildGraph(new Map([["m0.1.1", {}], ["m0.1.2", {}], ["m0.1.3", {}], ["l0.1.1", {}], ["e0.1.1", {}]]));
const question = (id: string, lessons: string[], extra: Partial<(typeof QUESTIONS)[number]> = {}) => ({
  id, mode: "fundamentals" as const, prompt: `Question ${id}`, lessons, minutes: 5, notes: "notes",
  rubric: [
    { id: "a", text: "First criterion", lessons: ["m0.1.1"] },
    { id: "b", text: "Second criterion", lessons: ["m0.1.2"] },
    { id: "c", text: "Told clearly", lessons: [] },
  ],
  ...extra,
});

test("a question stays locked until its lessons are mastered and the learner's own work can carry it", () => {
  const ctx = { mastered: new Set(["m0.1.1"]), hasProject: false, hasReadiness: false };
  assert.deepEqual(questionLock({ lessons: ["m0.1.1", "m0.1.2"] }, ctx), { locked: true, missing: ["m0.1.2"], needs: [] });
  assert.equal(questionLock({ lessons: ["m0.1.1"] }, ctx).locked, false);
  assert.deepEqual(questionLock({ lessons: [], needs: [{ kind: "project" }] }, ctx).needs, ["project"]);
  assert.equal(questionLock({ lessons: [], needs: [{ kind: "project" }] }, { ...ctx, hasProject: true }).locked, false);
});

test("a question comes back the next day after a weak answer, later after strong ones", () => {
  assert.equal(questionDue([]), null);
  assert.equal(questionDue([graded("q", 0, [1, 0, 1])])!.getTime(), T0 + DAY);
  assert.equal(questionDue([graded("q", 0, [2, 2, 1])])!.getTime(), T0 + 3 * DAY);
  assert.equal(questionDue([graded("q", 0, [3, 3, 2])])!.getTime(), T0 + 7 * DAY);
  assert.equal(questionDue([graded("q", 0, [3, 3, 2]), graded("q", 7, [3, 3, 3])])!.getTime(), T0 + 21 * DAY);
  assert.equal(answerScore([{ criterion: "a", score: 3 }, { criterion: "b", score: 0 }]), 0.5);
});

test("a weak criterion sends the learner to its lessons, but never to one they cannot open yet", () => {
  const q = question("q", ["m0.1.1"]);
  const never = () => false;
  // b is weak; its lesson m0.1.2 is open (m0.1.1 mastered) but not mastered: Learn should begin it.
  const r1 = interviewRemedies(q, graded("q", 0, [2, 1, 0]), tiny, new Set(["m0.1.1"]), never);
  assert.deepEqual(r1.map((r) => [r.lessonId, r.mode]), [["m0.1.2", "learn"]]);
  // a is weak and its lesson is mastered: reread it, until it has been opened since the interview.
  const r2 = interviewRemedies(q, graded("q", 0, [0, 3, 3]), tiny, new Set(["m0.1.1"]), never);
  assert.deepEqual(r2.map((r) => [r.lessonId, r.mode]), [["m0.1.1", "revisit"]]);
  assert.deepEqual(interviewRemedies(q, graded("q", 0, [0, 3, 3]), tiny, new Set(["m0.1.1"]), () => true), []);
  // A weak criterion on a lesson whose prerequisites are not mastered asks nothing.
  const far = { ...q, rubric: [{ id: "a", text: "x", lessons: ["m0.1.3"] }] };
  assert.deepEqual(interviewRemedies(far, graded("q", 0, [0]), tiny, new Set(["m0.1.1"]), never), []);
  // A criterion no lesson teaches (how clearly it was told) asks nothing either.
  assert.deepEqual(interviewRemedies(q, graded("q", 0, [3, 3, 0]), tiny, new Set(["m0.1.1"]), never), []);
});

test("interview pulls land in Learn only on open lessons", () => {
  const remedy = { questionId: "q", criterion: "b", lessonId: "m0.1.2", mode: "learn" as const, since: at(0) };
  const pulls = interviewPulls([remedy, { ...remedy, lessonId: "m0.1.1", mode: "revisit" }], () => "explains the second idea");
  assert.deepEqual(pulls.map((p) => [p.lessonId, p.source]), [["m0.1.2", "interview"]]);
  assert.equal(topPull(frontier(tiny, new Set()), pulls), null);
  assert.equal(topPull(frontier(tiny, new Set(["m0.1.1"])), pulls)?.lesson.id, "m0.1.2");
});

test("the plan locks, holds back, and orders questions; sessions take due ones first, weakest first", () => {
  const questions = [question("a", ["m0.1.1"]), question("b", ["m0.1.1"]), question("c", ["m0.1.1"]), question("d", ["m0.1.3"]), question("e", ["m0.1.1"])];
  const answers = [graded("a", 0, [2, 2, 2]), graded("b", 0, [1, 2, 2]), graded("c", 5, [3, 3, 3])];
  const ctx = { mastered: new Set(["m0.1.1", "m0.1.2"]), hasProject: false, hasReadiness: false };
  const remedies = [{ questionId: "e", criterion: "a", lessonId: "m0.1.1", mode: "revisit" as const, since: at(0) }];
  const states = planQuestions({ questions, answers, ctx, remedies, titleOf: (id) => id, authored: () => true, now: T0 + 4 * DAY });
  const kinds = Object.fromEntries(states.map((s) => [s.id, s.kind]));
  assert.deepEqual(kinds, { a: "due", b: "due", c: "later", d: "locked", e: "blocked" });
  assert.match(states.find((s) => s.id === "d")!.reason, /mastered m0\.1\.3/);
  assert.deepEqual(pickQuestions(states, "fundamentals"), ["b", "a"]);
});

test("the next session goes to a mode with due questions, else the one practised least recently", () => {
  const states = [
    { id: "f", mode: "fundamentals" as const, kind: "new" as const, score: null, due: null, answers: 0, missing: 0, reason: "" },
    { id: "c", mode: "coding" as const, kind: "due" as const, score: 0.4, due: at(0), answers: 1, missing: 0, reason: "" },
    { id: "d", mode: "design" as const, kind: "locked" as const, score: null, due: null, answers: 0, missing: 0, reason: "" },
  ];
  const sessions = [{ mode: "coding" as const, finishedAt: at(0) }];
  assert.equal(nextMode(modeSummaries(states, sessions), states)?.mode, "coding");
  const noneDue = states.map((s) => (s.kind === "due" ? { ...s, kind: "later" as const } : s));
  assert.equal(nextMode(modeSummaries(noneDue, sessions), noneDue)?.mode, "fundamentals");
  const allLocked = states.map((s) => ({ ...s, kind: "locked" as const }));
  assert.equal(nextMode(modeSummaries(allLocked, sessions), allLocked), null);
});

test("an interview joins the daily queue every other day, and whenever one is under way", () => {
  assert.equal(sessionWanted(null, false, T0), true);
  assert.equal(sessionWanted(at(0), false, T0 + DAY), false);
  assert.equal(sessionWanted(at(0), false, T0 + 2 * DAY), true);
  assert.equal(sessionWanted(at(0), true, T0 + DAY), true);
});

test("follow-ups and fresh questions may use only ideas a mastered lesson teaches", () => {
  assert.deepEqual(untaughtIdeas("What is the variance of the sum of two rolls?", new Set()), ["mean, variance and standard deviation"]);
  assert.deepEqual(untaughtIdeas("What is the variance of the sum of two rolls?", new Set(["m0.8.1"])), []);
  assert.deepEqual(untaughtIdeas("Talk me through your plan.", new Set()), []);
});

test("scores are kept to the rubric, and written questions to mastered lessons", () => {
  const q = question("q", ["m0.1.1"]);
  const g = acceptGrade({ criteria: [{ id: "a", score: 7, evidence: "e", note: "n" }, { id: "zzz", score: 3, evidence: "", note: "" }], feedback: "f", outline: "o" }, q);
  assert.deepEqual(g.criteria.map((c) => [c.id, c.score]), [["a", 3], ["b", 0], ["c", 0]]);
  const allowed = new Set(["l3.5.2", "l5.2.5"]);
  const rubric = [{ id: "one", text: "Does one thing", lessons: ["l3.5.2", "l9.9.9"] }, { id: "two", text: "Does another", lessons: [] }, { id: "three", text: "And a third", lessons: ["l5.2.5"] }];
  const ok = acceptWritten({ prompt: "Why does pre-norm help deep transformers train?", lessons: ["l5.2.5", "l9.9.9"], notes: "n", minutes: 5, rubric }, allowed);
  assert.deepEqual(ok?.lessons, ["l5.2.5"]);
  assert.deepEqual(ok?.rubric[0].lessons, ["l3.5.2"]);
  assert.equal(acceptWritten({ prompt: "Why does pre-norm help deep transformers train?", lessons: ["l9.9.9"], notes: "n", minutes: 5, rubric }, allowed), null);
});
