import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ASSESS_SCHEMA,
  EXTRACT_SCHEMA,
  acceptAssessment,
  assessRequest,
  drillFound,
  fingerprint,
  gapScore,
  lessonFound,
  nextHref,
  projectFound,
  sharesOf,
  skillTrends,
  type AssessOutput,
  type NextOption,
  acceptSkills,
  cleanLink,
  daysUntilRecheck,
  effectiveLevel,
  extractRequest,
  quarterLabel,
  readinessPercent,
  recheckDue,
  supportedLevel,
  type ExtractOutput,
} from "../src/lib/readiness/core.ts";

type S = ExtractOutput["skills"][number];
const skill = (over: Partial<S>): S => ({ name: "Skill", area: "Machine learning", description: "", postings: [1], quotes: [], existing: "", ...over });

test("a level above Studied needs evidence, and the higher levels need the right kind", () => {
  assert.equal(supportedLevel([]), 1);
  assert.equal(supportedLevel(["drill"]), 2);
  assert.equal(supportedLevel(["writeup"]), 2);
  assert.equal(supportedLevel(["drill", "repo"]), 3);
  assert.equal(supportedLevel(["project"]), 3);
  assert.equal(supportedLevel(["repo", "writeup"]), 4);
  assert.equal(effectiveLevel(4, []), 1);
  assert.equal(effectiveLevel(4, ["drill"]), 2);
  assert.equal(effectiveLevel(2, ["repo", "writeup"]), 2);
  assert.equal(effectiveLevel(0, ["repo"]), 0);
});

test("readiness is weighted by how often postings ask, and ignores skills no posting asks for", () => {
  assert.equal(readinessPercent([]), null);
  assert.equal(readinessPercent([{ frequency: 0, claimed: 4, kinds: ["repo", "writeup"] }]), null);
  // 10 postings ask for a skill at Published (4/4); 10 ask for one at None (0/4): half ready.
  assert.equal(readinessPercent([
    { frequency: 10, claimed: 4, kinds: ["repo", "writeup"] },
    { frequency: 10, claimed: 0, kinds: [] },
    { frequency: 0, claimed: 0, kinds: [] },
  ]), 50);
  // Claims without evidence don't count.
  assert.equal(readinessPercent([{ frequency: 4, claimed: 4, kinds: [] }]), 25);
});

test("the re-check comes due after a quarter", () => {
  const last = new Date("2026-08-01T00:00:00Z");
  assert.equal(daysUntilRecheck(null), null);
  assert.equal(recheckDue(null), false);
  assert.equal(daysUntilRecheck(last, new Date("2026-08-02T00:00:00Z")), 90);
  assert.equal(recheckDue(last, new Date("2026-10-30T00:00:00Z")), false);
  assert.equal(recheckDue(last, new Date("2026-10-31T00:00:00Z")), true);
  assert.equal(quarterLabel(new Date("2026-11-17T06:00:00Z")), "Q4 2026");
  assert.equal(quarterLabel(new Date("2026-03-31T20:00:00Z")), "Q2 2026"); // already 1 April in India
});

test("evidence links are web addresses or Frontier pages", () => {
  assert.equal(cleanLink("github.com/me/nanogpt"), "https://github.com/me/nanogpt");
  assert.equal(cleanLink("https://example.com/post"), "https://example.com/post");
  assert.equal(cleanLink("/drills/attention"), "/drills/attention");
  assert.equal(cleanLink("javascript:alert(1)"), null);
  assert.equal(cleanLink("//evil.com"), null);
  assert.equal(cleanLink("not a link"), null);
  assert.equal(cleanLink(""), null);
});

test("extracted skills are cleaned, merged and matched to the scorecard", () => {
  const out = acceptSkills(
    {
      skills: [
        skill({ name: "PyTorch", postings: [1, 2, 3, 2], quotes: ["fluent in PyTorch"] }),
        skill({ name: "  pytorch ", postings: [4], quotes: ["PyTorch"] }),
        skill({ name: "Distributed training at scale", postings: [2, 9], existing: "Distributed training" }),
        skill({ name: "Imaginary", postings: [7, 0] }),
        skill({ name: "", postings: [1] }),
        skill({ name: "Writing", area: "Not an area", postings: [1] }),
      ],
    },
    4,
    [{ name: "Distributed training" }],
  );
  assert.deepEqual(out.map((s) => [s.name, s.postings, s.existingKey]), [
    ["PyTorch", [0, 1, 2, 3], null],
    ["Distributed training at scale", [1], "distributed training"],
    ["Writing", [0], null],
  ]);
  assert.equal(out[0].key, "pytorch");
  assert.deepEqual(out[0].quotes, ["fluent in PyTorch", "PyTorch"]);
  assert.equal(out[2].area, "Machine learning");
});

test("the extraction request numbers every posting and lists the current skills", () => {
  const text = extractRequest(
    [{ id: 7, company: "Anthropic", role: "Research Engineer", body: "Build things." }, { id: 9, company: "", role: "", body: "More." }],
    [{ name: "PyTorch", description: "Writing models in PyTorch." }],
  );
  assert.match(text, /# Posting 1: Research Engineer at Anthropic/);
  assert.match(text, /# Posting 2: Untitled role/);
  assert.match(text, /- PyTorch: Writing models in PyTorch\./);
  assert.match(text, /numbered 1 to 2/);
  assert.deepEqual(EXTRACT_SCHEMA.properties.skills.items.required.length, Object.keys(EXTRACT_SCHEMA.properties.skills.items.properties).length);
});

test("a mastered lesson backs Studied, never more", () => {
  assert.equal(supportedLevel(["lesson"]), 1);
  assert.equal(supportedLevel(["lesson", "lesson"]), 1);
  assert.equal(supportedLevel(["lesson", "drill"]), 2);
  assert.equal(effectiveLevel(3, ["lesson"]), 1);
});

test("skills are flagged as new, rising, fading or gone between checks", () => {
  const shares = sharesOf([{ key: "a", frequency: 8 }, { key: "b", frequency: 2 }, { key: "c", frequency: 0 }], 10);
  assert.deepEqual(shares, { a: 0.8, b: 0.2 });
  const trends = skillTrends({ a: 0.5, b: 0.6, d: 0.3, e: 0.4 }, { a: 0.8, b: 0.2, e: 0.45, f: 0.1 });
  assert.equal(trends.get("a"), "rising");
  assert.equal(trends.get("b"), "fading");
  assert.equal(trends.get("d"), "gone");
  assert.equal(trends.get("e"), undefined); // held steady
  assert.equal(trends.get("f"), "new");
  assert.equal(skillTrends(null, { a: 1 }).size, 0);
});

test("a gap weighs how often a skill is asked for against how far it is from Built", () => {
  assert.equal(gapScore(10, 10, 0), 1);
  assert.equal(gapScore(5, 10, 0), 0.5);
  assert.equal(gapScore(10, 10, 3), 0);
  assert.equal(gapScore(10, 10, 4), 0);
  assert.equal(gapScore(0, 10, 0), 0);
  assert.ok(gapScore(10, 10, 1) > gapScore(10, 10, 2));
});

test("drills, projects and lessons become evidence with stable refs", () => {
  const d = drillFound({ drillId: "attention", title: "Causal multi-head attention", skills: ["Transformers"], bestSeconds: 1500, limitMinutes: 30, inTime: true, passes: 2 });
  assert.equal(d.ref, "drill:attention");
  assert.equal(d.url, "/drills/attention");
  assert.match(d.detail, /fastest 25 min against a 30 min limit\./);
  const p = projectFound({ id: 3, title: "Probe", question: "Does it?", writeupUrl: "https://example.com/post", repoUrl: "https://github.com/me/probe" });
  assert.deepEqual(p.map((e) => [e.ref, e.kind]), [["project:3", "project"], ["writeup:3", "writeup"]]);
  assert.equal(lessonFound({ id: "m1.2.3", title: "Eigenvalues", courseTitle: "Linear algebra", chapterTitle: "Spectra" }).url, "/learn/m1.2.3");
});

test("Parton's scores are kept only for real skills and evidence, and capped by what the evidence backs", () => {
  const found = [
    drillFound({ drillId: "attention", title: "Attention", skills: ["Transformers"], bestSeconds: 600, limitMinutes: 30, inTime: true, passes: 1 }),
    lessonFound({ id: "m1", title: "Matrices", courseTitle: "LA", chapterTitle: "1" }),
  ];
  const options: NextOption[] = [
    { ref: "drill:bpe", kind: "drill", title: "BPE", detail: "", open: true },
    { ref: "lesson:m2", kind: "lesson", title: "Eigen", detail: "LA", open: false },
  ];
  const row = (over: Partial<AssessOutput["skills"][number]>): AssessOutput["skills"][number] => ({
    skill: "", evidence: [], level: 0, reason: "r", next_kind: "none", next_ref: "", next_title: "", next_why: "", ...over,
  });
  const out = acceptAssessment(
    {
      skills: [
        row({ skill: "Transformers", evidence: ["drill:attention", "drill:made-up"], level: 4, next_kind: "project", next_title: "  Does  attention sink? " }),
        row({ skill: "transformers", level: 1 }), // duplicate
        row({ skill: "Linear algebra", evidence: ["lesson:m1"], level: 3, next_kind: "lesson", next_ref: "lesson:m2" }),
        row({ skill: "Tokenisation", level: 2, next_kind: "drill", next_ref: "drill:nope" }),
        row({ skill: "PyTorch", level: 3, next_kind: "lesson", next_ref: "drill:bpe" }), // kind mismatch
        row({ skill: "Not on the card", level: 2 }),
      ],
    },
    [
      { key: "transformers", ownKinds: [] },
      { key: "linear algebra", ownKinds: [] },
      { key: "tokenisation", ownKinds: [] },
      { key: "pytorch", ownKinds: ["repo"] },
    ],
    found,
    options,
  );
  assert.deepEqual(out.map((a) => [a.key, a.evidence, a.level, a.next?.kind ?? null]), [
    ["transformers", ["drill:attention"], 2, "project"],
    ["linear algebra", ["lesson:m1"], 1, "lesson"],
    ["tokenisation", [], 0, null],
    ["pytorch", [], 3, null],
  ]);
  assert.equal(out[0].next?.title, "Does attention sink?");
  assert.equal(nextHref(out[1].next!), "/learn/m2");
  assert.equal(nextHref({ kind: "drill", ref: "drill:bpe", title: "", why: "" }), "/drills/bpe");
  assert.equal(nextHref(out[0].next!), "/projects");
});

test("the scoring request lists skills, evidence and next steps", () => {
  const text = assessRequest(
    [{ name: "PyTorch", area: "ML engineering", description: "Writing models.", quotes: ["fluent in PyTorch"], own: [{ kind: "repo", title: "nanoGPT", url: "https://github.com/me/nanogpt" }] }],
    [lessonFound({ id: "m1", title: "Matrices", courseTitle: "LA", chapterTitle: "1" })],
    [{ ref: "lesson:m2", kind: "lesson", title: "Eigen", detail: "LA", open: true }],
  );
  assert.match(text, /## PyTorch \(ML engineering\)/);
  assert.match(text, /Repository "nanoGPT"/);
  assert.match(text, /- lesson:m1: Mastered Matrices/);
  assert.match(text, /- lesson:m2: Eigen \(LA\) \[open now\]/);
  const item = ASSESS_SCHEMA.properties.skills.items;
  assert.equal(item.required.length, Object.keys(item.properties).length);
});

test("the fingerprint changes with the inputs, not their order", () => {
  assert.equal(fingerprint(["a", "b"]), fingerprint(["b", "a"]));
  assert.notEqual(fingerprint(["a", "b"]), fingerprint(["a", "c"]));
  assert.notEqual(fingerprint(["a"]), fingerprint(["a", "drill:x"]));
});
