import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DRAFT_STAGES,
  README_PLACEHOLDER,
  REPRO_HEADING,
  acceptReview,
  acceptSuggestions,
  buildReadme,
  draftBody,
  draftFor,
  draftRequest,
  isUnfilledTemplate,
  mergeReadme,
  pageText,
  rankGaps,
  readPlanDraft,
  repoFileGaps,
  repoName,
  reviewFingerprint,
  reviewRequest,
  suggestRequest,
  validRepoName,
} from "../src/lib/project-assist/core.ts";
import { MIN_WORDS, STAGES, type Project } from "../src/lib/pipeline.ts";

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

const project = (over: Partial<Project> = {}): Project => ({
  id: 1, title: "Does label smoothing help small transformers?", status: "active", stage: "question",
  question: "", why: "", plan: "", killCriterion: "", writeupUrl: "", writeupSummary: "", repoUrl: "", postmortem: "",
  history: [{ stage: "question", at: "2026-01-01T00:00:00Z" }], startedAt: "2026-01-01T00:00:00Z", endedAt: null,
  experiments: [], notebook: [], ...over,
});

test("gaps rank by how often a skill is asked for times how far short it is", () => {
  const gaps = rankGaps([
    { name: "A", area: "x", description: "", frequency: 10, level: 3 }, // 10
    { name: "B", area: "x", description: "", frequency: 5, level: 0 }, // 20
    { name: "C", area: "x", description: "", frequency: 0, level: 0 }, // not asked for
    { name: "D", area: "x", description: "", frequency: 9, level: 4 }, // done
    { name: "E", area: "x", description: "", frequency: 6, level: 1 }, // 18
  ]);
  assert.deepEqual(gaps.map((g) => g.name), ["B", "E", "A"]);
  assert.equal(gaps[0].gap, 20);
  assert.equal(rankGaps([], 3).length, 0);
});

test("the suggestion request names the gaps, or falls back when there is no scorecard", () => {
  const withGaps = suggestRequest(rankGaps([{ name: "Distributed training", area: "ML engineering", description: "FSDP.", frequency: 7, level: 1 }]), ["Attention"], []);
  assert.match(withGaps, /Distributed training/);
  assert.match(withGaps, /7 postings/);
  assert.match(withGaps, /at Studied/);
  assert.match(suggestRequest([], [], []), /No Readiness scorecard yet/);
});

test("suggestions are kept only if they would pass the question stage, with skills matched to real gaps", () => {
  const good = { title: "Smoothing", question: `${words(MIN_WORDS.question)}?`, why: words(MIN_WORDS.why), skills: ["distributed training", "Made up"], first_step: "Train a baseline." };
  const out = acceptSuggestions({
    suggestions: [
      good,
      { ...good, title: "No question mark", question: words(20) },
      { ...good, title: "Short why", why: "Because." },
      { ...good, title: "smoothing" }, // duplicate title
      { ...good, title: "Second" },
      { ...good, title: "Third" },
      { ...good, title: "Fourth" },
    ],
  }, ["Distributed training"]);
  assert.deepEqual(out.map((s) => s.title), ["Smoothing", "Second", "Third"]);
  assert.deepEqual(out[0].skills, ["Distributed training"]);
  assert.equal(out[0].firstStep, "Train a baseline.");
});

test("each stage with a draft is drafted automatically on entering it", () => {
  assert.equal(draftFor("plan"), "plan");
  assert.equal(draftFor("experiments"), "notebook");
  assert.equal(draftFor("writeup"), "outline");
  assert.equal(draftFor("question"), null);
  assert.equal(draftFor("repo"), null);
  for (const { stages, auto } of Object.values(DRAFT_STAGES)) assert.ok(stages.includes(auto));
});

test("drafts are built from the stage notes and never ask for invented results", () => {
  const p = project({
    question: "Does it help?", why: "Because.", plan: "Train twice.", killCriterion: "Stop if no gain.",
    experiments: [{ id: 1, title: "Baseline", expected: "62%", result: "61.8%", at: "2026-01-02T00:00:00Z" }],
    notebook: [{ id: 1, body: "Loss spiked at step 400.", at: "2026-01-03T00:00:00Z" }],
  });
  const plan = draftRequest("plan", p, ["Experiment design"]);
  assert.match(plan, /Does it help\?/);
  assert.match(plan, /Experiment design/);
  assert.doesNotMatch(plan, /Baseline/, "the plan draft does not read experiments");
  const outline = draftRequest("outline", p);
  assert.match(outline, /61\.8%/);
  assert.match(outline, /Loss spiked/);
  assert.match(outline, /Never invent results/);
  const notebook = draftRequest("notebook", p);
  assert.match(notebook, /Baseline/);
  assert.doesNotMatch(notebook, /Loss spiked/);
});

test("a plan draft round-trips, and empty drafts are rejected", () => {
  const body = draftBody("plan", { plan: "P", kill_criterion: "K" });
  assert.deepEqual(readPlanDraft(body!), { plan: "P", killCriterion: "K" });
  assert.equal(draftBody("plan", { plan: "P", kill_criterion: " " }), null);
  assert.equal(draftBody("outline", { outline: "## Summary" }), "## Summary");
  assert.equal(draftBody("notebook", { template: "" }), null);
  assert.equal(readPlanDraft("not json"), null);
});

test("an unfilled notebook template is recognised, whatever the whitespace", () => {
  assert.ok(isUnfilledTemplate("Run:\n  Expected:\n", "Run:\nExpected:"));
  assert.ok(!isUnfilledTemplate("Run: baseline\nExpected:", "Run:\nExpected:"));
  assert.ok(!isUnfilledTemplate("anything", null));
});

test("repository names come from the title and follow GitHub's rules", () => {
  assert.equal(repoName("Does label smoothing help small transformers?"), "does-label-smoothing-help-small-transformers");
  assert.equal(repoName("Café: µP vs SP!"), "cafe-p-vs-sp");
  assert.equal(repoName("???"), "frontier-project");
  assert.ok(repoName("x".repeat(200)).length <= 60);
  assert.ok(validRepoName("label-smoothing_v2.1"));
  assert.ok(!validRepoName("has space"));
  assert.ok(!validRepoName(".."));
  assert.ok(!validRepoName("thing.git"));
});

test("the README is built from the project, with a reproduction section to fill in", () => {
  const p = project({
    question: "Does it help?", why: "Because it matters.", plan: "Train twice.", killCriterion: "Stop if no gain.",
    writeupUrl: "https://example.com/post", writeupSummary: "It helps a little.",
    experiments: [
      { id: 1, title: "Baseline", expected: "62%", result: "61.8%", at: "2026-01-02T00:00:00Z" },
      { id: 2, title: "Running", expected: "?", result: null, at: "2026-01-02T00:00:00Z" },
    ],
  });
  const md = buildReadme(p);
  assert.match(md, /^# Does label smoothing/);
  assert.match(md, /> Does it help\?/);
  assert.match(md, /\*\*Write-up:\*\* https:\/\/example\.com\/post/);
  assert.match(md, /### E1\. Baseline/);
  assert.doesNotMatch(md, /Running/, "experiments without a result are left out");
  assert.ok(md.includes(README_PLACEHOLDER));
  assert.ok(md.includes(`## ${REPRO_HEADING}`));
});

test("refreshing the README keeps the learner's reproduction section and refuses a rewritten README", () => {
  const fresh = buildReadme(project({ question: "New question?" }));
  const current = `# Old\n\n> Old question?\n\n## ${REPRO_HEADING}\n\npip install -r requirements.txt\npython train.py\n`;
  const merged = mergeReadme(fresh, current)!;
  assert.match(merged, /New question\?/);
  assert.doesNotMatch(merged, /Old question/);
  assert.match(merged, /python train\.py/);
  assert.ok(!merged.includes(README_PLACEHOLDER));
  assert.equal(mergeReadme(fresh, "# My own README"), null);
  assert.equal(mergeReadme(fresh, null), fresh);
});

test("a repository needs a README and some code before it can be published", () => {
  assert.equal(repoFileGaps([]).length, 2);
  assert.deepEqual(repoFileGaps(["README.md", "LICENSE", ".gitignore"]), ["The repository has no code yet: push the code that produces the main result."]);
  assert.deepEqual(repoFileGaps(["train.py"]), ["The repository has no README."]);
  assert.deepEqual(repoFileGaps(["README.md", "src"]), []);
});

test("the check reads what each stage owns, and its fingerprint changes only when that does", () => {
  for (const stage of STAGES) assert.match(reviewRequest(stage, project({ stage })), /The bar:/);
  const p = project({ stage: "plan", question: "Q?", plan: "Plan text." });
  assert.equal(reviewFingerprint("plan", p), reviewFingerprint("plan", { ...p, repoUrl: "https://github.com/a/b" }));
  assert.notEqual(reviewFingerprint("plan", p), reviewFingerprint("plan", { ...p, plan: "Plan text, revised." }));
  const repo = reviewRequest("repo", project({ stage: "repo", repoUrl: "https://github.com/a/b" }), { repoFiles: ["README.md", "train.py"], readme: "Run python train.py" });
  assert.match(repo, /train\.py/);
  assert.match(repo, /Run python train\.py/);
  const writeup = reviewRequest("writeup", project({ stage: "writeup" }), { writeupText: "The post body." });
  assert.match(writeup, /The post body\./);
});

test("a failed check with no reasons does not block, and a passed one carries no gaps", () => {
  assert.deepEqual(acceptReview({ complete: false, gaps: [] }), { complete: true, gaps: [] });
  assert.deepEqual(acceptReview({ complete: true, gaps: ["stray"] }), { complete: true, gaps: [] });
  const r = acceptReview({ complete: false, gaps: ["a", " ", "b", "c", "d", "e", "f"] });
  assert.equal(r.complete, false);
  assert.deepEqual(r.gaps, ["a", "b", "c", "d", "e"]);
});

test("page text drops scripts, styles and tags", () => {
  const text = pageText("<html><head><style>p{}</style><script>var x=1</script></head><body><nav>Menu</nav><h1>Title</h1><p>One &amp; two</p></body></html>");
  assert.match(text, /Title/);
  assert.match(text, /One & two/);
  assert.doesNotMatch(text, /var x|p\{\}|Menu|</);
});
