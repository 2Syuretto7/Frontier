import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXTRACT_SCHEMA,
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
