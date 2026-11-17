import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptRecall, isRepeat, recallRequest, toAnswer, type RecallOutput, type RecallSource } from "../src/lib/parton/recall.ts";

type Q = RecallOutput["questions"][number];
const blank: Q = { source_lesson_id: "m0.1.1", prompt: "", kind: "numeric", number: 0, tolerance: 0, expression: "", variables: [], options: [], correct: [] };
const q = (over: Partial<Q>): Q => ({ ...blank, ...over });

const sources: RecallSource[] = [
  { id: "m0.1.1", title: "Counting", text: "Peano and the successor $S$.", practice: ["What is $S(S(0))$ written as a numeral?"] },
  { id: "m0.1.2", title: "Addition", text: "Addition by recursion.", practice: ["Compute $2 + 3$ using the definition of addition."] },
];

test("a repeat is caught despite spacing, punctuation and TeX changes", () => {
  assert.ok(isRepeat("What is $S(S(0))$ written as a numeral?", "what is S(S(0)) written as a numeral"));
  assert.ok(isRepeat("Compute $2 + 3$ using the definition of addition.", "Compute $2+3$ using the definition of addition!"));
  assert.ok(!isRepeat("Compute $2 + 3$ using the definition of addition.", "How many times is the successor applied to reach 4 from 0?"));
});

test("questions that repeat a practice question, an earlier recall question or each other are dropped", () => {
  const kept = acceptRecall(
    {
      questions: [
        q({ prompt: "What is $S(S(0))$ written as a numeral?", number: 2 }),
        q({ prompt: "Which numeral is $S(S(S(S(0))))$?", number: 4 }),
        q({ prompt: "Which numeral is $S(S(S(S(0))))$ ?", number: 4 }),
        q({ source_lesson_id: "m0.1.2", prompt: "Using the recursive rule, what is $4 + 1$ as a numeral?", number: 5 }),
        q({ source_lesson_id: "m0.1.2", prompt: "How many uses of the rule $a + S(b) = S(a + b)$ does $7 + 3$ take?", number: 3 }),
      ],
    },
    { sources, asked: ["Using the recursive rule, what is $4 + 1$ as a numeral?"] },
  );
  assert.deepEqual(kept.map((k) => k.prompt), [
    "Which numeral is $S(S(S(S(0))))$?",
    "How many uses of the rule $a + S(b) = S(a + b)$ does $7 + 3$ take?",
  ]);
});

test("only the requested number of questions is kept, and only from the given lessons", () => {
  const many = ["one", "two", "three", "four"].map((w, i) => q({ prompt: `Distinct question ${w} about successors`, number: i }));
  assert.equal(acceptRecall({ questions: many }, { sources, asked: [], count: 3 }).length, 3);
  assert.equal(acceptRecall({ questions: [q({ source_lesson_id: "x9.9.9", prompt: "Something new", number: 1 })] }, { sources, asked: [] }).length, 0);
});

test("answer keys are checked before a question is kept", () => {
  assert.deepEqual(toAnswer(q({ kind: "numeric", number: 2.5 })), { kind: "numeric", value: 2.5 });
  assert.deepEqual(toAnswer(q({ kind: "numeric", number: 3.14159, tolerance: 0.001 })), { kind: "numeric", value: 3.14159, tolerance: 0.001 });
  assert.deepEqual(toAnswer(q({ kind: "expression", expression: "3*x^2 + 2*x", variables: ["x"] })), { kind: "expression", value: "3*x^2 + 2*x", variables: ["x"] });
  assert.equal(toAnswer(q({ kind: "expression", expression: "3*y^2", variables: ["x"] })), null, "a variable outside the list fails");
  assert.deepEqual(toAnswer(q({ kind: "choice", options: ["a", "b", "c"], correct: [2, 0] })), { kind: "choice", options: ["a", "b", "c"], correct: [0, 2] });
  assert.equal(toAnswer(q({ kind: "choice", options: ["a", "b", "c"], correct: [3] })), null, "an index out of range fails");
  assert.equal(toAnswer(q({ kind: "choice", options: ["a", "a", "c"], correct: [0] })), null, "options must differ");
  assert.equal(toAnswer(q({ kind: "choice", options: ["a", "b"], correct: [] })), null, "a choice needs a correct option");
  assert.equal(toAnswer(q({ kind: "written" })), null, "only server-checkable kinds");
});

test("the request lists what was already asked and what must not be reused", () => {
  const text = recallRequest({ lessonTitle: "Multiplication", sources, asked: ["Old recall question"], hard: ["Missed in an earlier recall: X"] });
  assert.match(text, /Old recall question/);
  assert.match(text, /What is \$S\(S\(0\)\)\$ written as a numeral\?/);
  assert.match(text, /found hard/);
  assert.match(text, /m0\.1\.1, m0\.1\.2/);
});

test("a review session is three to five questions, however many ideas are due", async () => {
  const { reviewCount } = await import("../src/lib/parton/recall.ts");
  assert.deepEqual([1, 2, 3, 4, 5, 6, 40].map(reviewCount), [3, 3, 3, 4, 5, 5, 5]);
});

test("each review question rates one due card from its own lesson, and extras rate none", async () => {
  const { assignCards } = await import("../src/lib/parton/recall.ts");
  const due = [
    { exercise_id: "m0.1.1:a", lesson_id: "m0.1.1" },
    { exercise_id: "m0.1.2:b", lesson_id: "m0.1.2" },
    { exercise_id: "m0.1.1:c", lesson_id: "m0.1.1" },
  ];
  const drafts = ["m0.1.1", "m0.1.1", "m0.1.1", "m0.1.2"].map((sourceLessonId) => ({ sourceLessonId }));
  assert.deepEqual(assignCards(drafts, due).map((d) => d.card), ["m0.1.1:a", "m0.1.1:c", null, "m0.1.2:b"]);
});

test("a review request lists the due ideas and says it is review, not a lesson start", () => {
  const text = recallRequest({ review: true, sources, asked: [], hard: [], due: ["In m0.1.1: What is $S(S(0))$?"], count: 4 });
  assert.match(text, /spaced review/);
  assert.match(text, /Write 4 new review questions/);
  assert.match(text, /Ideas due for review[\s\S]*What is \$S\(S\(0\)\)\$\?/);
  assert.doesNotMatch(text, /about to start the lesson/);
});
