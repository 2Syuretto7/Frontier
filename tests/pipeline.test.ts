import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MIN_NOTEBOOK_ENTRIES,
  MIN_WORDS,
  STAGES,
  canStart,
  checkPublic,
  githubRepo,
  nextStage,
  postmortemGap,
  publicUrl,
  stageDurations,
  stageGaps,
  wordCount,
  type Project,
} from "../src/lib/pipeline.ts";

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

const project = (over: Partial<Project> = {}): Project => ({
  id: 1, title: "Label smoothing", status: "active", stage: "question",
  question: "", why: "", plan: "", killCriterion: "", writeupUrl: "", writeupSummary: "", repoUrl: "", postmortem: "",
  history: [{ stage: "question", at: "2026-01-01T00:00:00Z" }], startedAt: "2026-01-01T00:00:00Z", endedAt: null,
  experiments: [], notebook: [], ...over,
});

test("the six stages are fixed and in order", () => {
  assert.deepEqual([...STAGES], ["question", "plan", "experiments", "notebook", "writeup", "repo"]);
  assert.equal(nextStage("question"), "plan");
  assert.equal(nextStage("notebook"), "writeup");
  assert.equal(nextStage("repo"), null);
});

test("a new project cannot start while one is open", () => {
  assert.deepEqual(canStart([]), { ok: true });
  assert.deepEqual(canStart([{ id: 1, status: "published", title: "a" }, { id: 2, status: "killed", title: "b" }]), { ok: true });
  const blocked = canStart([{ id: 1, status: "published", title: "a" }, { id: 3, status: "active", title: "Open one" }]);
  assert.equal(blocked.ok, false);
  assert.equal(!blocked.ok && blocked.activeId, 3);
  assert.match(!blocked.ok ? blocked.error : "", /Open one/);
});

test("the question stage needs a real question and a reason", () => {
  assert.equal(stageGaps(project()).length, 2);
  assert.ok(stageGaps(project({ question: words(MIN_WORDS.question), why: words(MIN_WORDS.why) })).some((g) => g.includes("question mark")));
  assert.deepEqual(stageGaps(project({ question: `${words(MIN_WORDS.question)}?`, why: words(MIN_WORDS.why) })), []);
  assert.ok(stageGaps(project({ title: " ", question: `${words(MIN_WORDS.question)}?`, why: words(MIN_WORDS.why) })).length === 1);
});

test("the plan stage needs a plan and a kill criterion decided in advance", () => {
  const p = project({ stage: "plan", plan: words(MIN_WORDS.plan) });
  assert.equal(stageGaps(p).length, 1);
  assert.deepEqual(stageGaps({ ...p, killCriterion: words(MIN_WORDS.killCriterion) }), []);
});

test("experiments need results before moving on, failures included", () => {
  const e = (id: number, result: string | null) => ({ id, title: "run", expected: "x", result, at: "2026-01-02T00:00:00Z" });
  assert.equal(stageGaps(project({ stage: "experiments" })).length, 1);
  assert.match(stageGaps(project({ stage: "experiments", experiments: [e(1, "worse"), e(2, null)] })).join(), /open experiment/);
  assert.deepEqual(stageGaps(project({ stage: "experiments", experiments: [e(1, "it failed")] })), []);
});

test("the lab notebook needs entries", () => {
  const n = (id: number) => ({ id, body: "tried x", at: "2026-01-03T00:00:00Z" });
  const few = Array.from({ length: MIN_NOTEBOOK_ENTRIES - 1 }, (_, i) => n(i));
  assert.equal(stageGaps(project({ stage: "notebook", notebook: few })).length, 1);
  assert.deepEqual(stageGaps(project({ stage: "notebook", notebook: [...few, n(99)] })), []);
});

test("write-up and repository need public https links", () => {
  const w = project({ stage: "writeup", writeupUrl: "http://blog.example.com/post", writeupSummary: words(MIN_WORDS.writeupSummary) });
  assert.equal(stageGaps(w).length, 1);
  assert.deepEqual(stageGaps({ ...w, writeupUrl: "https://blog.example.com/post" }), []);
  assert.equal(stageGaps(project({ stage: "repo" })).length, 1);
  assert.deepEqual(stageGaps(project({ stage: "repo", repoUrl: "https://github.com/a/b" })), []);
});

test("links must be public https addresses on named hosts", () => {
  assert.equal(publicUrl("https://example.com/x"), "https://example.com/x");
  for (const bad of ["", "not a url", "http://example.com", "https://localhost/x", "https://127.0.0.1/", "https://[::1]/", "https://user:pw@example.com", "https://box.internal/", "ftp://example.com"]) {
    assert.equal(publicUrl(bad), null, bad);
  }
});

test("GitHub repository links are recognised", () => {
  assert.deepEqual(githubRepo("https://github.com/someone/thing.git"), { owner: "someone", name: "thing" });
  assert.deepEqual(githubRepo("https://github.com/someone/thing/tree/main"), { owner: "someone", name: "thing" });
  assert.equal(githubRepo("https://github.com/someone"), null);
  assert.equal(githubRepo("https://gitlab.com/someone/thing"), null);
});

test("killing needs a real post-mortem", () => {
  assert.ok(postmortemGap("Didn't work."));
  assert.equal(postmortemGap(words(MIN_WORDS.postmortem)), null);
  assert.equal(wordCount("  one  two\nthree "), 3);
});

test("time in each stage runs to the next stage, the end, or now", () => {
  const history = [
    { stage: "question" as const, at: "2026-01-01T00:00:00Z" },
    { stage: "plan" as const, at: "2026-01-03T00:00:00Z" },
    { stage: "experiments" as const, at: "2026-01-10T00:00:00Z" },
  ];
  assert.deepEqual(stageDurations({ history, endedAt: null }, "2026-01-24T12:00:00Z"), { question: 2, plan: 7, experiments: 14 });
  assert.deepEqual(stageDurations({ history, endedAt: "2026-01-11T00:00:00Z" }, "2026-02-01T00:00:00Z"), { question: 2, plan: 7, experiments: 1 });
});

test("publishing checks that links open for the public", async () => {
  const seen: string[] = [];
  const fake = (status: number) => (async (url: string | URL | Request) => {
    seen.push(String(url));
    return new Response(null, { status });
  }) as typeof fetch;
  assert.equal(await checkPublic("https://github.com/a/b/tree/main", "repository", fake(200)), null);
  assert.equal(seen.at(-1), "https://github.com/a/b");
  assert.match((await checkPublic("https://github.com/a/private", "repository", fake(404)))!, /isn't public yet/);
  assert.match((await checkPublic("https://blog.example.com/p", "write-up", fake(403)))!, /isn't public/);
  assert.match((await checkPublic("http://blog.example.com/p", "write-up", fake(200)))!, /https/);
  const down = (async () => { throw new Error("offline"); }) as typeof fetch;
  assert.match((await checkPublic("https://blog.example.com/p", "write-up", down))!, /Couldn't reach/);
});
