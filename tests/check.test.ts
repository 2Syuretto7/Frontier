import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAnswer, equivalent, parseNumber } from "../src/lib/check.ts";

test("numbers, fractions and spacing", () => {
  assert.equal(parseNumber(" 3/4 "), 0.75);
  assert.equal(parseNumber("1,000"), 1000);
  assert.equal(parseNumber("-2.5"), -2.5);
  assert.equal(parseNumber("abc"), null);
  assert.equal(checkAnswer({ kind: "numeric", value: 0.5 }, "2/4").correct, true);
  assert.equal(checkAnswer({ kind: "numeric", value: 3.14159, tolerance: 0.001 }, "3.1416").correct, true);
});

test("algebraically equal expressions match", () => {
  const v = ["x"];
  assert.ok(equivalent("(x+1)^2", "x^2 + 2x + 1", v));
  assert.ok(equivalent("2(x+3)", "2x+6", v));
  assert.ok(equivalent("sin(x)^2 + cos(x)^2", "1", v));
  assert.ok(!equivalent("(x+1)^2", "x^2 + 1", v));
  assert.ok(equivalent("x*x*x", "x^3", v));
  assert.ok(equivalent("ln(exp(x))", "x", v));
});

test("two variables and implicit multiplication", () => {
  assert.ok(equivalent("(a+b)(a-b)", "a^2 - b^2", ["a", "b"]));
  assert.ok(!equivalent("ab", "a+b", ["a", "b"]));
});

test("unreadable input gives a message, not a crash", () => {
  const r = checkAnswer({ kind: "expression", value: "x", variables: ["x"] }, "x + $");
  assert.equal(r.correct, false);
  assert.ok(r.message);
});

test("choices must match exactly", () => {
  const a = { kind: "choice" as const, options: ["a", "b", "c"], correct: [0, 2] };
  assert.equal(checkAnswer(a, "2,0").correct, true);
  assert.equal(checkAnswer(a, "0").correct, false);
});
