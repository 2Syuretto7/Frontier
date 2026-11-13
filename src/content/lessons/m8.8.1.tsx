import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EpsBandViz } from "@/components/viz/EpsBandViz";
import type { LessonContent } from "@/lib/types";

const SUP = `def sup_dist(fn, f, xs):
    return max(abs(fn(x) - f(x)) for x in xs)

def first_uniform_n(seq, f, xs, eps, nmax):
    for n in range(1, nmax + 1):
        if sup_dist(seq(n), f, xs) < eps:
            return n
    return None`;

const NAT = `def n_at(x, eps):
    n, p = 1, x
    while p >= eps:
        n += 1
        p *= x
    return n

def worst_n(xs, eps):
    return max(n_at(x, eps) for x in xs)`;

export const lesson: LessonContent = {
  id: "m8.8.1",
  minutes: 60,
  links: {
    requires: ["m8.5.2", "m8.2.4"],
    revisits: ["m8.2.1"],
    foreshadows: ["m8.8.2", "m8.8.3", "m8.9.2"],
  },

  puzzle: (
    <>
      <p>
        Each function xⁿ is continuous on [0, 1]. As n grows, xⁿ → 0 for x &lt; 1 and stays 1 at x = 1, so the limit is a
        function with a jump. A limit of continuous functions need not be continuous. Training produces a sequence of
        functions too, one per step; which kind of convergence would let properties of the iterates pass to the limit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pointwise convergence lets each x converge at its own pace, and near x = 1 the pace for xⁿ gets arbitrarily slow.
        Uniform convergence asks for one N that works for all x at once: draw a band of width ε around the limit; from some
        n on the entire graph of fₙ lies inside it.
      </p>
      <EpsBandViz />
    </>
  ),

  theory: (
    <>
      <Definition title="pointwise and uniform convergence">
        <p>
          Functions <M>{"f_n: A \\to \\mathbb{R}"}</M> converge pointwise to f if <M>{"f_n(x) \\to f(x)"}</M> for each x ∈ A. They
          converge uniformly if
        </p>
        <MD>{"\\|f_n - f\\|_\\infty = \\sup_{x \\in A} |f_n(x) - f(x)| \\to 0,"}</MD>
        <p>
          that is, for every ε there is N such that <M>{"|f_n(x) - f(x)| < \\varepsilon"}</M> for all n ≥ N and all x ∈ A
          simultaneously. Uniform convergence implies pointwise; the converse fails.
        </p>
      </Definition>

      <Example title="three sequences">
        <p>
          On [0, 0.9], <M>{"\\sup |x^n| = 0.9^n \\to 0"}</M>: uniform. On [0, 1) the pointwise limit is 0 but the supremum is 1
          for every n. The bump <M>{"2nx/(1 + n^2x^2)"}</M> tends to 0 at each x but has maximum 1 at x = 1/n. Uniform
          convergence can be tested on a fine grid by the sup distance; the grid can only underestimate the true supremum.
        </p>
        <Code>{SUP}</Code>
      </Example>

      <Remark title="pointwise rates">
        <p>
          For xⁿ the first n with <M>{"x^n < \\varepsilon"}</M> is about <M>{"\\log \\varepsilon / \\log x"}</M>, which grows
          without bound as x → 1. Uniform convergence is exactly the statement that these pointwise N(x, ε) can be bounded
          over x.
        </p>
        <Code>{NAT}</Code>
      </Remark>

      <Theorem title="Cauchy criterion for uniform convergence">
        <p>
          <M>{"(f_n)"}</M> converges uniformly on A if and only if for every ε &gt; 0 there is N with{" "}
          <M>{"|f_n(x) - f_m(x)| < \\varepsilon"}</M> for all m, n ≥ N and all x ∈ A.
        </p>
      </Theorem>
      <Proof>
        <p>
          (⇒) Use <M>{"|f_n - f_m| \\leq |f_n - f| + |f - f_m|"}</M>. (⇐) For each x the sequence <M>{"f_n(x)"}</M> is Cauchy, so
          it has a limit f(x) by completeness of ℝ. Letting m → ∞ in <M>{"|f_n(x) - f_m(x)| < \\varepsilon"}</M> gives{" "}
          <M>{"|f_n(x) - f(x)| \\leq \\varepsilon"}</M> for all n ≥ N and every x, which is uniform convergence.
        </p>
      </Proof>

      <Theorem title="Weierstrass M-test">
        <p>
          If <M>{"|g_k(x)| \\leq M_k"}</M> for all x ∈ A and <M>{"\\sum M_k"}</M> converges, then <M>{"\\sum g_k"}</M> converges
          uniformly on A.
        </p>
      </Theorem>
      <Proof>
        <p>
          The partial sums satisfy <M>{"|s_n(x) - s_m(x)| \\leq \\sum_{k=m+1}^n M_k"}</M>, which is small for large m, n
          independently of x, by the Cauchy criterion for <M>{"\\sum M_k"}</M>. Apply the criterion above.
        </p>
      </Proof>

      <Theorem title="uniform limits of continuous functions are continuous">
        <p>If each <M>{"f_n"}</M> is continuous at c and <M>{"f_n \\to f"}</M> uniformly, then f is continuous at c.</p>
      </Theorem>
      <Proof>
        <p>
          Given ε, pick n with <M>{"\\|f_n - f\\|_\\infty < \\varepsilon/3"}</M>, then δ with{" "}
          <M>{"|f_n(x) - f_n(c)| < \\varepsilon/3"}</M> for |x − c| &lt; δ. For such x,
        </p>
        <MD>{"|f(x) - f(c)| \\leq |f(x) - f_n(x)| + |f_n(x) - f_n(c)| + |f_n(c) - f(c)| < \\varepsilon."}</MD>
        <p>Applied to xⁿ, this shows the convergence on [0, 1] cannot be uniform, since the limit jumps.</p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "sup",
      rung: "check",
      prompt: <p>What is sup |xⁿ − 0| over [0, 0.9] for n = 10? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3487, tolerance: 0.0001 },
    },
    {
      key: "nat",
      rung: "check",
      prompt: <p>What is the smallest n with 0.9ⁿ &lt; 0.01?</p>,
      answer: { kind: "numeric", value: 44, tolerance: 0.0001 },
    },
    {
      key: "xn",
      rung: "apply",
      prompt: <p>How does fₙ(x) = x/n behave on ℝ?</p>,
      answer: {
        kind: "choice",
        options: ["It converges to 0 pointwise but not uniformly", "It converges uniformly to 0", "It does not converge pointwise", "It converges uniformly to x"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sup_dist(fn, f, xs):
    return max(abs(fn(x) - f(x)) for x in xs)

def first_uniform_n(seq, f, xs, eps, nmax):
    for n in range(1, nmax + 1):
        if sup_dist(seq(n), f, xs) < eps:
            return n
    return None

xs = [i / 1000 for i in range(1001)]
lim = lambda x: 1.0 if x == 1 else 0.0
print(round(sup_dist(lambda x: x ** 10, lim, xs), 4), round(sup_dist(lambda x: x ** 10, lim, xs[:901]), 4))
bump = lambda n: (lambda x: 2 * n * x / (1 + n * n * x * x))
print(first_uniform_n(lambda n: (lambda x: x ** n), lim, xs[:901], 0.01, 500), first_uniform_n(bump, lambda x: 0.0, xs, 0.01, 500))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.99 0.3487\n44 None", "1.0 0.3487\n44 None", "0.99 0.3487\n44 1", "0.99 0.9\n43 None"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def n_at(x, eps):
    n, p = 1, x
    while p >= eps:
        n += 1
        p *= x
    return n

def worst_n(xs, eps):
    return max(n_at(x, eps) for x in xs)

print(n_at(0.5, 0.01), n_at(0.9, 0.01), n_at(0.99, 0.01))
print(worst_n([i / 10 for i in range(10)], 0.01), worst_n([i / 100 for i in range(100)], 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7 44 459\n44 459", "6 43 458\n43 458", "7 44 459\n459 459", "7 44 459\n7 7"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sup_dist(fn, f, xs)</C>, the largest |fn(x) − f(x)| over the points xs, and{" "}
          <C>first_uniform_n(seq, f, xs, eps, nmax)</C>, the smallest n ≤ nmax with sup_dist(seq(n), f, xs) &lt; eps, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def sup_dist(fn, f, xs):
    return 0

def first_uniform_n(seq, f, xs, eps, nmax):
    return None
`,
        solution: SUP,
        tests: [
          { name: "sup", code: `assert sup_dist(lambda x: x, lambda x: 0, [0, 0.5, 2]) == 2` },
          { name: "first", code: `assert first_uniform_n(lambda n: (lambda x: x / n), lambda x: 0, [0, 1], 0.3, 10) == 4
assert first_uniform_n(lambda n: (lambda x: 1.0), lambda x: 0.0, [0], 0.5, 5) is None` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For 0 ≤ x &lt; 1, write <C>n_at(x, eps)</C>, the smallest n ≥ 1 with xⁿ &lt; eps, computing powers by repeated
          multiplication, and <C>worst_n(xs, eps)</C>, the largest n_at over the points xs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def n_at(x, eps):
    return 1

def worst_n(xs, eps):
    return 1
`,
        solution: NAT,
        tests: [
          { name: "at", code: `assert n_at(0.5, 0.2) == 3 and n_at(0, 0.1) == 1` },
          { name: "worst", code: `assert worst_n([0.1, 0.5], 0.2) == 3 and worst_n([0.9], 0.5) == 7` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if continuous functions fₙ converge uniformly to f on A, then f is continuous on A.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Fixes c and ε, and uses uniform convergence to choose one n with |fₙ(x) − f(x)| < ε/3 for all x.",
          "Uses continuity of that fₙ at c to choose δ with |fₙ(x) − fₙ(c)| < ε/3 for |x − c| < δ.",
          "Combines the three terms with the triangle inequality to get |f(x) − f(c)| < ε.",
        ],
      },
    },
    {
      key: "bump",
      rung: "stretch",
      prompt: <p>At which x does 2nx/(1 + n²x²) reach its maximum on [0, 1] when n = 4?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between pointwise and uniform convergence, with xⁿ and the sliding bump as examples, the Cauchy criterion and the M-test, and why a uniform limit of continuous functions is continuous.",

  glimpse: (
    <>
      <p>
        Continuity survives uniform limits. The next lesson asks the same of integrals and derivatives: when can you swap a
        limit with an integral, or differentiate a limit term by term?
      </p>
    </>
  ),
};
