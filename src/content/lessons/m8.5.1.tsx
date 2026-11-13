import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeqCriterionViz } from "@/components/viz/SeqCriterionViz";
import type { LessonContent } from "@/lib/types";

const DELTA = `def works(f, c, L, eps, delta, n=1000):
    for i in range(1, n + 1):
        h = delta * i / (n + 1)
        if abs(f(c + h) - L) >= eps or abs(f(c - h) - L) >= eps:
            return False
    return True

def find_delta(f, c, L, eps):
    delta = 1.0
    while not works(f, c, L, eps, delta):
        delta /= 2
    return delta`;

const SEQ = `def along(f, seq, ns):
    return [f(seq(n)) for n in ns]

def disagree(f, s1, s2, n):
    return abs(f(s1(n)) - f(s2(n)))`;

export const lesson: LessonContent = {
  id: "m8.5.1",
  minutes: 60,
  links: {
    requires: ["m8.2.1", "m8.4.1"],
    revisits: ["m2.2.2"],
    foreshadows: ["m8.5.2", "m8.6.1"],
  },

  puzzle: (
    <>
      <p>
        What is the limit of sin(1/x) as x tends to 0? The graph oscillates faster and faster between −1 and 1, and any value
        in between is approached along some sequence of points. Is the answer "there is none", and how would you prove it? And
        why does multiplying by x change the answer to 0?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A function has limit L at c when f(x) is as close to L as you like for every x close enough to c, apart from c itself.
        Equivalently, every sequence of points approaching c is mapped to a sequence of values approaching L. The second form
        is the convenient one for showing a limit does not exist: find two sequences that give different answers.
      </p>
      <SeqCriterionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="functional limit">
        <p>
          Let f: A → ℝ and let c be a limit point of A. Then <M>{"\\lim_{x \\to c} f(x) = L"}</M> means: for every ε &gt; 0 there
          is δ &gt; 0 such that
        </p>
        <MD>{"x \\in A,\\ 0 < |x - c| < \\delta \\implies |f(x) - L| < \\varepsilon."}</MD>
        <p>The value f(c), if it is defined at all, plays no part.</p>
      </Definition>

      <Example title="a quadratic">
        <p>
          For f(x) = x² at c = 2, write <M>{"|x^2 - 4| = |x - 2|\\,|x + 2|"}</M>. If δ ≤ 1 then |x + 2| &lt; 5, so δ = min(1, ε/5)
          works. The code below searches for a working δ numerically by halving; it only checks finitely many points, so it is
          an experiment, not a proof.
        </p>
        <Code>{DELTA}</Code>
      </Example>

      <Theorem title="sequential criterion">
        <p>
          <M>{"\\lim_{x \\to c} f(x) = L"}</M> if and only if, for every sequence <M>{"x_n \\in A"}</M> with{" "}
          <M>{"x_n \\neq c"}</M> and <M>{"x_n \\to c"}</M>, we have <M>{"f(x_n) \\to L"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (⇒) Given ε, take δ from the definition, then N with <M>{"|x_n - c| < \\delta"}</M> for n ≥ N. Since{" "}
          <M>{"x_n \\neq c"}</M>, <M>{"|f(x_n) - L| < \\varepsilon"}</M> for n ≥ N.
        </p>
        <p>
          (⇐) Suppose the limit is not L. Then for some ε₀ &gt; 0 every δ fails; with δ = 1/n pick{" "}
          <M>{"x_n \\in A"}</M> with <M>{"0 < |x_n - c| < 1/n"}</M> and <M>{"|f(x_n) - L| \\geq \\varepsilon_0"}</M>. Then{" "}
          <M>{"x_n \\to c"}</M>, <M>{"x_n \\neq c"}</M>, but <M>{"f(x_n) \\not\\to L"}</M>.
        </p>
      </Proof>

      <Theorem title="consequences">
        <ol>
          <li>
            Algebraic limits: if f → L and g → M at c, then f + g → L + M, fg → LM, and f/g → L/M when M ≠ 0. Each follows from
            the same statement for sequences.
          </li>
          <li>
            Divergence criterion: if two sequences <M>{"x_n, y_n \\to c"}</M>, never equal to c, have{" "}
            <M>{"\\lim f(x_n) \\neq \\lim f(y_n)"}</M>, then f has no limit at c.
          </li>
        </ol>
      </Theorem>

      <Example title="sin(1/x) and x sin(1/x)">
        <p>
          <M>{"x_n = 1/(n\\pi)"}</M> gives <M>{"\\sin(1/x_n) = 0"}</M> and <M>{"y_n = 1/(2n\\pi + \\pi/2)"}</M> gives{" "}
          <M>{"\\sin(1/y_n) = 1"}</M>, so sin(1/x) has no limit at 0. But <M>{"|x \\sin(1/x)| \\leq |x|"}</M>, so δ = ε shows{" "}
          <M>{"x \\sin(1/x) \\to 0"}</M>.
        </p>
        <Code>{SEQ}</Code>
      </Example>

      <Remark title="one-sided limits and the domain">
        <p>
          Restricting A to x &gt; c gives the right-hand limit, and the limit exists exactly when both one-sided limits exist and
          agree. The requirement that c be a limit point of A is what makes the limit unique: at an isolated point every L would
          satisfy the definition vacuously.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lin",
      rung: "check",
      prompt: <p>For f(x) = 3x + 1 at c = 1 with L = 4 and ε = 0.3, what is the largest δ that works?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "quad",
      rung: "check",
      prompt: (
        <p>
          For f(x) = x² at c = 2 with L = 4 and ε = 0.1, what is the largest δ that works? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0248, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these functions has a limit as x tends to 0?</p>,
      answer: { kind: "choice", options: ["x sin(1/x)", "sin(1/x)", "1/x", "the sign function, −1 for x < 0 and 1 for x > 0"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def works(f, c, L, eps, delta, n=1000):
    for i in range(1, n + 1):
        h = delta * i / (n + 1)
        if abs(f(c + h) - L) >= eps or abs(f(c - h) - L) >= eps:
            return False
    return True

def find_delta(f, c, L, eps):
    delta = 1.0
    while not works(f, c, L, eps, delta):
        delta /= 2
    return delta

f = lambda x: x * x
print(works(f, 2, 4, 0.1, 0.02), works(f, 2, 4, 0.1, 0.05))
print(find_delta(f, 2, 4, 0.1), find_delta(lambda x: 3 * x + 1, 1, 4, 0.3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False\n0.015625 0.0625",
          "True True\n0.015625 0.0625",
          "True False\n0.03125 0.0625",
          "True False\n0.015625 0.125",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def along(f, seq, ns):
    return [f(seq(n)) for n in ns]

def disagree(f, s1, s2, n):
    return abs(f(s1(n)) - f(s2(n)))

import math
g = lambda x: math.sin(1 / x)
s1 = lambda n: 1 / (n * math.pi)
s2 = lambda n: 1 / (2 * n * math.pi + math.pi / 2)
print(all(abs(v) < 1e-9 for v in along(g, s1, range(1, 100))), [round(v, 6) for v in along(g, s2, [1, 2, 3])])
print(round(disagree(g, s1, s2, 50), 6), round(disagree(lambda x: x * g(x), s1, s2, 50), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True [1.0, 1.0, 1.0]\n1.0 0.003167",
          "True [1.0, -1.0, 1.0]\n1.0 0.003167",
          "False [1.0, 1.0, 1.0]\n1.0 0.003167",
          "True [1.0, 1.0, 1.0]\n0.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>works(f, c, L, eps, delta, n=1000)</C>: for i = 1, …, n let h = delta·i/(n + 1) and return False if
          |f(c ± h) − L| ≥ eps for either sign, else True. Then write <C>find_delta(f, c, L, eps)</C>, which starts at
          delta = 1.0 and halves it until works holds.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def works(f, c, L, eps, delta, n=1000):
    return True

def find_delta(f, c, L, eps):
    return 1.0
`,
        solution: DELTA,
        tests: [
          { name: "works", code: `assert works(lambda x: 2 * x, 0, 0, 0.1, 0.05) and not works(lambda x: 2 * x, 0, 0, 0.1, 0.06)
assert not works(lambda x: 1 if x > 0 else 0, 0, 0, 0.5, 1e-6)` },
          { name: "find", code: `assert find_delta(lambda x: 5 * x, 0, 0, 1) == 0.125
assert find_delta(lambda x: x * x, 0, 0, 0.01) == 0.0625` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Sequences are functions of n. Write <C>along(f, seq, ns)</C>, the list of f(seq(n)) for n in ns, and{" "}
          <C>disagree(f, s1, s2, n)</C>, the absolute difference |f(s1(n)) − f(s2(n))|.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def along(f, seq, ns):
    return []

def disagree(f, s1, s2, n):
    return 0
`,
        solution: SEQ,
        tests: [
          { name: "along", code: `assert along(lambda x: x + 1, lambda n: 1 / n, [1, 2, 4]) == [2, 1.5, 1.25]` },
          { name: "disagree", code: `sign = lambda x: 1 if x > 0 else -1
assert disagree(sign, lambda n: 1 / n, lambda n: -1 / n, 10) == 2
assert disagree(lambda x: x, lambda n: 1 / n, lambda n: -1 / n, 4) == 0.5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove: if <M>{"\\lim_{x \\to c} f(x) = L"}</M> and <M>{"x_n \\to c"}</M> with <M>{"x_n \\neq c"}</M>, then{" "}
          <M>{"f(x_n) \\to L"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Fixes ε > 0 and takes δ from the definition of the functional limit.",
          "Uses convergence of x_n to find N with |x_n − c| < δ for n ≥ N.",
          "Uses x_n ≠ c to get 0 < |x_n − c| < δ, hence |f(x_n) − L| < ε for n ≥ N.",
        ],
      },
    },
    {
      key: "power",
      rung: "stretch",
      prompt: <p>What does find_delta(lambda x: x * x, 2, 4, 0.01) return? Give the exact decimal.</p>,
      answer: { kind: "numeric", value: 0.001953125, tolerance: 0.000001 },
    },
  ],

  teachBack:
    "Explain to a friend the ε–δ definition of a limit of a function, why the value at c does not matter, the sequential criterion and its proof, and how two sequences show that sin(1/x) has no limit at 0.",

  glimpse: (
    <>
      <p>
        Continuity is the case where the limit exists and equals f(c). The next lesson defines it and proves the theorems that
        need compactness and connectedness: extreme values and intermediate values.
      </p>
    </>
  ),
};
