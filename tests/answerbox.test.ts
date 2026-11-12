import test from "node:test";
import assert from "node:assert/strict";
import { appendSpoken } from "../src/components/lesson/AnswerBox.tsx";
import { MARK_RULES, TEACHBACK_RULES } from "../src/lib/parton/prompts.ts";

test("dictated words join the answer with one space", () => {
  assert.equal(appendSpoken("", " the sum telescopes "), "The sum telescopes", "a new answer starts with a capital");
  assert.equal(appendSpoken("By induction.", "base case n equals 1"), "By induction. Base case n equals 1", "a new sentence starts with a capital");
  assert.equal(appendSpoken("First, ", "the base case"), "First, the base case");
  assert.equal(appendSpoken("unchanged", "   "), "unchanged");
});

test("short answers are welcome in Prove or argue and Teach it back", () => {
  assert.match(MARK_RULES, /Brevity is welcome/);
  assert.match(MARK_RULES, /never mark a criterion unmet because it is short/);
  assert.match(TEACHBACK_RULES, /Brevity is welcome/);
});
