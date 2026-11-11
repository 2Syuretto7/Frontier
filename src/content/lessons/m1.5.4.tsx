import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { RecursionViz } from "@/components/viz/RecursionViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.5.4",
  minutes: 60,
  links: {
    revisits: ["m0.7.1", "m1.1.1"],
    foreshadows: ["m4.2.2", "m4.5.3"],
  },

  puzzle: (
    <>
      <p>
        We write <M>{"n! = 1 \\cdot 2 \\cdot 3 \\cdots n"}</M>. But what do the three dots mean? They say &ldquo;and so
        on&rdquo;, trusting the reader to guess the pattern. A computer cannot guess, and neither should a proof.
      </p>
      <p>
        Can you define <M>{"n!"}</M> for every natural number n precisely, in a finite number of words, without any dots at
        all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give a starting value and a rule for getting each value from the one before: <M>{"0! = 1"}</M>, and{" "}
        <M>{"(n + 1)! = (n + 1) \\cdot n!"}</M>. From these two lines, <M>{"1! = 1"}</M>, <M>{"2! = 2"}</M>,{" "}
        <M>{"3! = 6"}</M>, and so on, with no guessing needed. This is a <strong>recursive definition</strong>, and it is
        induction used for building rather than proving.
      </p>
      <p>Explore four recursive definitions below. The last is perfectly well defined, yet hides one of the most famous unsolved problems in mathematics.</p>
      <RecursionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="recursive definition of a sequence">
        <p>A sequence <M>{"a_0, a_1, a_2, \\dots"}</M> is <strong>defined recursively</strong> by giving</p>
        <ol>
          <li>one or more <strong>initial values</strong>, such as <M>{"a_0"}</M>, and</li>
          <li>a <strong>recurrence</strong>: a rule giving <M>{"a_{n+1}"}</M> in terms of earlier terms.</li>
        </ol>
        <p>
          Induction guarantees that this defines <M>{"a_n"}</M> for every n, and only one way: this is the{" "}
          <strong>recursion theorem</strong>.
        </p>
      </Definition>

      <Example title="defining sums and powers">
        <p>
          The sigma notation is itself recursive: <M>{"\\sum_{i=1}^{0} x_i = 0"}</M> and{" "}
          <M>{"\\sum_{i=1}^{n+1} x_i = \\sum_{i=1}^{n} x_i + x_{n+1}"}</M>. So are powers: <M>{"x^0 = 1"}</M> and{" "}
          <M>{"x^{n+1} = x^n \\cdot x"}</M>. Every &ldquo;and so on&rdquo; in mathematics can be made precise this way.
        </p>
      </Example>

      <Theorem title="solving a recurrence">
        <p>If <M>{"a_0 = 0"}</M> and <M>{"a_{n+1} = 2a_n + 1"}</M>, then <M>{"a_n = 2^n - 1"}</M> for every n.</p>
      </Theorem>
      <Proof>
        <p>
          By induction. <M>{"a_0 = 0 = 2^0 - 1"}</M>. If <M>{"a_k = 2^k - 1"}</M>, then{" "}
          <M>{"a_{k+1} = 2(2^k - 1) + 1 = 2^{k+1} - 1"}</M>.
        </p>
      </Proof>
      <p>
        This is the usual pattern: compute some terms, guess a formula, and prove it by induction. Recursion and induction
        are two sides of one coin.
      </p>

      <Definition title="recursive definitions of sets">
        <p>
          Sets can be defined recursively too. The <strong>formulas</strong> of propositional logic are given by: every letter
          P, Q, R, &hellip; is a formula; if A and B are formulas, so are <M>{"\\neg A"}</M>, <M>{"(A \\wedge B)"}</M>,{" "}
          <M>{"(A \\vee B)"}</M> and <M>{"(A \\to B)"}</M>; and nothing else is a formula. To prove something about every
          formula, use <strong>structural induction</strong>: show it holds for letters, and that each building rule preserves
          it.
        </p>
      </Definition>

      <Example title="balanced brackets">
        <p>
          Every formula has as many left brackets as right brackets. Letters have none of either. <M>{"\\neg A"}</M> has the
          same brackets as A. <M>{"(A \\wedge B)"}</M> adds one of each to those of A and B, which balance by assumption. So by
          structural induction, every formula is balanced.
        </p>
      </Example>

      <Remark title="the Collatz problem">
        <p>
          Start with any positive integer; halve it if even, triple it and add one if odd; repeat. Lothar Collatz asked in 1937
          whether you always reach 1. Every starting number ever tested, into the quintillions, does. Nobody has proved it.
          The recursion is completely clear; whether it always ends is not. Paul Erdős is said to have remarked that
          mathematics is not yet ready for such problems.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fact",
      rung: "check",
      prompt: <p>Using <M>{"0! = 1"}</M> and <M>{"(n + 1)! = (n + 1) \\cdot n!"}</M>, what is <M>{"6!"}</M>?</p>,
      answer: { kind: "numeric", value: 720 },
    },
    {
      key: "fib",
      rung: "check",
      prompt: <p>With <M>{"F_0 = 0"}</M>, <M>{"F_1 = 1"}</M> and <M>{"F_{n+2} = F_{n+1} + F_n"}</M>, what is <M>{"F_{12}"}</M>?</p>,
      answer: { kind: "numeric", value: 144 },
    },
    {
      key: "recur",
      rung: "apply",
      prompt: <p>If <M>{"b_0 = 2"}</M> and <M>{"b_{n+1} = 3b_n"}</M>, give a formula for <M>{"b_n"}</M>.</p>,
      answer: { kind: "expression", value: "2*3^n", variables: ["n"] },
    },
    {
      key: "collatz",
      rung: "apply",
      prompt: <p>Starting the Collatz rule at 6, how many steps does it take to reach 1?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "formula",
      rung: "apply",
      prompt: <p>Which of these is a formula according to the recursive definition in this lesson?</p>,
      answer: { kind: "choice", options: ["(P ∧ Q", "(P → (Q ∨ ¬R))", "P ∧ ∨ Q", "()"], correct: [1] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def a(n):
    return 1 if n == 0 else 2 * a(n - 1) + 1
print([a(n) for n in range(5)])`}</Code>
          <p>This recursive definition produces which closed form?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2ⁿ⁺¹ − 1", "2ⁿ", "n² + 1", "2n + 1"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`calls = 0
def C(n, k):
    global calls
    calls += 1
    if k == 0 or k == n:
        return 1
    return C(n - 1, k - 1) + C(n - 1, k)
v = C(10, 5)
print(v, calls)`}</Code>
          <p>Pascal's recursion without memoisation. How many calls does C(10, 5) make?</p>
        </>
      ),
      answer: { kind: "choice", options: ["252 503", "252 252", "252 1023", "126 503"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>fib(n)</C> recursively with memoisation (a dictionary of values already computed), with fib(0) = 0 and fib(1) = 1. It must handle n = 200 quickly.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
`,
        solution: `memo = {0: 0, 1: 1}

def fib(n):
    if n not in memo:
        memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]
`,
        tests: [
          { name: "small", code: `assert [fib(n) for n in range(10)] == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34], 'Start 0, 1, then add the previous two.'` },
          { name: "large", code: `_orig, _calls = fib, [0]
def fib(n):
    _calls[0] += 1
    assert _calls[0] < 5000, 'fib(200) makes too many calls: remember values you have already computed.'
    return _orig(n)
v = fib(200)
assert v == 280571172992510140037611932413038677189525, 'fib(200) is 280571172992510140037611932413038677189525.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>ackermann(m, n)</C>, the recursively defined function A(0, n) = n + 1, A(m, 0) = A(m − 1, 1), A(m, n) = A(m − 1, A(m, n − 1)), with memoisation in a dict and an explicit stack instead of Python recursion (so that A(2, 1000) and A(3, 8) work without hitting the recursion limit). Then write <C>catalan(n)</C> by the recursion C₀ = 1, Cₙ₊₁ = Σ CᵢCₙ₋ᵢ, memoised, fast enough for n = 300.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def ackermann(m, n):
    if m == 0:
        return n + 1
    if n == 0:
        return ackermann(m - 1, 1)
    return ackermann(m - 1, ackermann(m, n - 1))

def catalan(n):
    if n == 0:
        return 1
    return sum(catalan(i) * catalan(n - 1 - i) for i in range(n)) if n < 12 else 0
`,
        solution: `def ackermann(m, n):
    memo = {}
    stack = [(m, n)]
    while stack:
        a, b = stack[-1]
        if (a, b) in memo:
            stack.pop()
            continue
        if a == 0:
            memo[(a, b)] = b + 1
            stack.pop()
        elif b == 0:
            if (a - 1, 1) in memo:
                memo[(a, b)] = memo[(a - 1, 1)]
                stack.pop()
            else:
                stack.append((a - 1, 1))
        else:
            if (a, b - 1) not in memo:
                stack.append((a, b - 1))
            else:
                inner = memo[(a, b - 1)]
                if (a - 1, inner) in memo:
                    memo[(a, b)] = memo[(a - 1, inner)]
                    stack.pop()
                else:
                    stack.append((a - 1, inner))
    return memo[(m, n)]

def catalan(n):
    c = [1]
    for k in range(n):
        c.append(sum(c[i] * c[k - i] for i in range(k + 1)))
    return c[n]
`,
        tests: [
          { name: "small", code: `assert [ackermann(1, n) for n in range(5)] == [2, 3, 4, 5, 6] and [ackermann(2, n) for n in range(4)] == [3, 5, 7, 9] and ackermann(3, 3) == 61, 'A(2, n) = 2n + 3 and A(3, n) = 2ⁿ⁺³ − 3.'` },
          { name: "deep", code: `assert ackermann(2, 1000) == 2003 and ackermann(3, 8) == 2045, 'Use your own stack instead of recursion.'` },
          { name: "catalan", code: `assert [catalan(n) for n in range(8)] == [1, 1, 2, 5, 14, 42, 132, 429], 'Catalan numbers.'` },
          { name: "big", code: `from math import comb
assert catalan(300) == comb(600, 300) // 301, 'Cₙ = C(2n, n)/(n + 1).'` },
        ],
      },
    },
    {
      key: "linear",
      rung: "prove",
      prompt: <p>Let <M>{"c_0 = 1"}</M> and <M>{"c_{n+1} = c_n + 2n + 3"}</M>. Compute a few terms, guess a formula for <M>{"c_n"}</M>, and prove it by induction.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Computes terms 1, 4, 9, 16, … and guesses cₙ = (n + 1)².",
          "Checks the base case c₀ = 1 = 1².",
          "Shows (k + 1)² + 2k + 3 = (k + 2)² in the inductive step.",
          "Concludes by induction.",
        ],
      },
    },
    {
      key: "fib-sum",
      rung: "stretch",
      prompt: <p>Prove that <M>{"F_0 + F_1 + \\cdots + F_n = F_{n+2} - 1"}</M> for every <M>{"n \\ge 0"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Checks the base case n = 0: F₀ = 0 = F₂ − 1.",
          "Assumes the formula for k and adds Fₖ₊₁ to both sides.",
          "Uses Fₖ₊₂ + Fₖ₊₁ = Fₖ₊₃ to get Fₖ₊₃ − 1.",
          "Concludes by induction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how '0! = 1 and (n + 1)! = (n + 1) · n!' defines n! for every n without any dots, and how that connects to induction.",

  glimpse: (
    <p>
      This completes the chapter on induction. Next come relations: ways of linking the elements of sets, such as &ldquo;less than&rdquo; and &ldquo;has the same remainder as&rdquo;. Recurrences are solved systematically in Discrete Mathematics, and recursion is the heart of many algorithms in Data Structures and Algorithms.
    </p>
  ),
};
