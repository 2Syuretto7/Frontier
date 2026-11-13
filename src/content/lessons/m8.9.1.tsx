import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FunDistViz } from "@/components/viz/FunDistViz";
import type { LessonContent } from "@/lib/types";

const METRIC = `def hamming(a, b):
    return sum(x != y for x, y in zip(a, b))

def check_metric(d, pts):
    for x in pts:
        for y in pts:
            if d(x, y) < 0 or (d(x, y) == 0) != (x == y) or d(x, y) != d(y, x):
                return (x, y)
            for z in pts:
                if d(x, z) > d(x, y) + d(y, z) + 1e-12:
                    return (x, y, z)
    return None`;

const FUNDIST = `def d_sup(f, g, xs):
    return max(abs(f(x) - g(x)) for x in xs)

def d_one(f, g, a, b, n):
    h = (b - a) / n
    return h * sum(abs(f(a + (i + 0.5) * h) - g(a + (i + 0.5) * h)) for i in range(n))`;

export const lesson: LessonContent = {
  id: "m8.9.1",
  minutes: 55,
  links: {
    requires: ["m8.8.1", "m8.4.1"],
    revisits: ["m6.5.1", "m8.8.2"],
    foreshadows: ["m8.9.2", "m8.9.3"],
  },

  puzzle: (
    <>
      <p>
        Convergence, continuity, open sets and completeness were all defined on the line through one quantity, |x − y|. The
        last chapter used another, the sup distance between functions, and found that a narrowing spike tends to 0 in area
        but not in height. Distances between strings, between probability distributions, between models: which of the
        theorems so far survive in these settings, and what must a distance satisfy for them to?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Almost every proof in this course used only three facts about |x − y|: it is zero exactly when the points agree, it
        is symmetric, and it obeys the triangle inequality. Any function with those properties supports the same definitions
        of limit, Cauchy sequence, open set and continuity. On spaces of functions there are many such distances, and they
        need not agree on which sequences converge.
      </p>
      <FunDistViz />
    </>
  ),

  theory: (
    <>
      <Definition title="metric space">
        <p>A metric on a set X is a function d: X × X → [0, ∞) such that for all x, y, z ∈ X:</p>
        <ol>
          <li>d(x, y) = 0 if and only if x = y;</li>
          <li>d(x, y) = d(y, x);</li>
          <li>d(x, z) ≤ d(x, y) + d(y, z).</li>
        </ol>
        <p>
          Examples: |x − y| on ℝ; the ℓ¹, ℓ² and ℓ∞ distances on ℝⁿ; the discrete metric (1 for distinct points); the Hamming
          distance between strings of equal length; and on the continuous functions C[a, b], the sup metric{" "}
          <M>{"d_\\infty(f, g) = \\sup |f - g|"}</M> and the integral metric <M>{"d_1(f, g) = \\int_a^b |f - g|"}</M>.
        </p>
        <Code>{METRIC}</Code>
      </Definition>

      <Definition title="normed space">
        <p>
          A norm on a real vector space V is a function ‖·‖ with ‖v‖ = 0 only for v = 0, ‖λv‖ = |λ|‖v‖, and{" "}
          <M>{"\\|u + v\\| \\leq \\|u\\| + \\|v\\|"}</M>.
        </p>
      </Definition>

      <Theorem title="every norm gives a metric">
        <p>d(u, v) = ‖u − v‖ is a metric on V.</p>
      </Theorem>
      <Proof>
        <p>
          d(u, v) = 0 iff u − v = 0. Symmetry: ‖v − u‖ = ‖(−1)(u − v)‖ = ‖u − v‖. Triangle: u − w = (u − v) + (v − w), so{" "}
          <M>{"\\|u - w\\| \\leq \\|u - v\\| + \\|v - w\\|"}</M>. Not every metric arises this way: a norm-induced metric scales,
          d(λu, λv) = |λ|d(u, v), and the discrete metric does not.
        </p>
      </Proof>

      <Definition title="the familiar notions">
        <p>
          In a metric space, the open ball is <M>{"B(x, r) = \\{y : d(x, y) < r\\}"}</M>; a set is open if it contains a ball
          around each of its points; <M>{"x_n \\to x"}</M> means <M>{"d(x_n, x) \\to 0"}</M>; a sequence is Cauchy if{" "}
          <M>{"d(x_m, x_n) < \\varepsilon"}</M> for all large m, n; and f: X → Y is continuous at x if for every ε some δ makes{" "}
          <M>{"d_Y(f(x'), f(x)) < \\varepsilon"}</M> whenever <M>{"d_X(x', x) < \\delta"}</M>. Proofs that used only the three
          axioms carry over word for word: limits are unique, convergent sequences are Cauchy, and continuity is equivalent to
          preserving limits of sequences.
        </p>
      </Definition>

      <Theorem title="norms on ℝⁿ agree on convergence">
        <p>
          For x ∈ ℝⁿ, <M>{"\\|x\\|_\\infty \\leq \\|x\\|_2 \\leq \\|x\\|_1 \\leq n\\|x\\|_\\infty"}</M>. Hence a sequence converges in
          one of these norms if and only if it converges in all of them, to the same limit.
        </p>
      </Theorem>
      <Proof>
        <p>
          The largest |xᵢ|² is at most their sum, giving the first inequality. Squaring the second,{" "}
          <M>{"(\\sum |x_i|)^2 = \\sum |x_i|^2 + \\sum_{i \\neq j} |x_i||x_j| \\geq \\sum |x_i|^2"}</M>. The last holds because each
          of the n terms is at most the largest. If one norm of <M>{"x_k - x"}</M> tends to 0, the inequalities squeeze the
          others. (In fact any two norms on a finite-dimensional space are equivalent in this sense.)
        </p>
      </Proof>

      <Example title="function spaces are different">
        <p>
          On C[0, 1], <M>{"d_1(f, g) \\leq d_\\infty(f, g)"}</M>, but no reverse inequality holds: the spike of height 1 and
          half-width w has <M>{"d_\\infty = 1"}</M> and <M>{"d_1 = w"}</M>. So the spikes converge to 0 in <M>{"d_1"}</M> and not in{" "}
          <M>{"d_\\infty"}</M>. Uniform convergence is convergence in <M>{"d_\\infty"}</M>, and the last chapter&apos;s theorems
          depend on that choice.
        </p>
        <Code>{FUNDIST}</Code>
      </Example>

      <Remark title="distances in machine learning">
        <p>
          Weight decay penalises an ℓ² norm and lasso an ℓ¹ norm. Cosine &ldquo;distance&rdquo; 1 − cos θ fails the triangle
          inequality, while the angle θ itself satisfies it. The Wasserstein distance between probability distributions is a
          metric, and the KL divergence is not (it is not symmetric). Knowing which axioms hold tells you which theorems you may
          use.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ham",
      rung: "check",
      prompt: <p>What is the Hamming distance between 10110 and 11100?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "sup",
      rung: "check",
      prompt: <p>What is the sup distance between f(x) = x and g(x) = x² on [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "notmetric",
      rung: "apply",
      prompt: <p>Which of these is not a metric on ℝ?</p>,
      answer: { kind: "choice", options: ["(x − y)²", "|x − y|/(1 + |x − y|)", "min(1, |x − y|)", "√|x − y|"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def hamming(a, b):
    return sum(x != y for x, y in zip(a, b))

def check_metric(d, pts):
    for x in pts:
        for y in pts:
            if d(x, y) < 0 or (d(x, y) == 0) != (x == y) or d(x, y) != d(y, x):
                return (x, y)
            for z in pts:
                if d(x, z) > d(x, y) + d(y, z) + 1e-12:
                    return (x, y, z)
    return None

print(hamming("cat", "bar"), check_metric(hamming, ["cat", "car", "bar", "bat"]))
print(check_metric(lambda x, y: (x - y) ** 2, [0, 1, 2]), check_metric(lambda x, y: abs(x - y) ** 0.5, [0, 1, 2, 5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 None\n(0, 1, 2) None", "2 None\nNone None", "2 None\n(0, 1, 2) (0, 1, 5)", "1 None\n(0, 1, 2) None"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def d_sup(f, g, xs):
    return max(abs(f(x) - g(x)) for x in xs)

def d_one(f, g, a, b, n):
    h = (b - a) / n
    return h * sum(abs(f(a + (i + 0.5) * h) - g(a + (i + 0.5) * h)) for i in range(n))

spike = lambda w: (lambda x: max(0.0, 1 - abs(x - 0.5) / w))
xs, zero = [i / 1000 for i in range(1001)], lambda x: 0.0
print([d_sup(spike(w), zero, xs) for w in (0.5, 0.1, 0.01)])
print([round(d_one(spike(w), zero, 0, 1, 10000), 4) for w in (0.5, 0.1, 0.01)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.0, 1.0, 1.0]\n[0.5, 0.1, 0.01]", "[1.0, 1.0, 1.0]\n[0.25, 0.05, 0.005]", "[0.5, 0.1, 0.01]\n[0.5, 0.1, 0.01]", "[1.0, 1.0, 1.0]\n[1.0, 1.0, 1.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hamming(a, b)</C> for strings of equal length, and <C>check_metric(d, pts)</C>: loop over x, then y, in pts;
          return (x, y) if d(x, y) &lt; 0, or d(x, y) == 0 disagrees with x == y, or d(x, y) ≠ d(y, x); then, still inside the
          y loop, return (x, y, z) for the first z with d(x, z) &gt; d(x, y) + d(y, z) + 1e-12. Return None if every check
          passes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def hamming(a, b):
    return 0

def check_metric(d, pts):
    return None
`,
        solution: METRIC,
        tests: [
          { name: "hamming", code: `assert hamming("abc", "abd") == 1 and check_metric(hamming, ["00", "01", "11"]) is None` },
          { name: "violations", code: `assert check_metric(lambda x, y: abs(x - y) + 1, [0, 1]) == (0, 0)
assert check_metric(lambda x, y: x - y, [0, 1]) == (0, 1)
assert check_metric(lambda x, y: (x - y) ** 2, [0, 1, 2]) == (0, 1, 2)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>d_sup(f, g, xs)</C>, the largest |f(x) − g(x)| over xs, and <C>d_one(f, g, a, b, n)</C>, the midpoint-rule
          approximation with n cells of ∫ₐᵇ |f − g|.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def d_sup(f, g, xs):
    return 0

def d_one(f, g, a, b, n):
    return 0
`,
        solution: FUNDIST,
        tests: [
          { name: "sup", code: `assert d_sup(lambda x: x, lambda x: x * x, [0, 0.5, 1]) == 0.25` },
          { name: "one", code: `assert abs(d_one(lambda x: x, lambda x: 0, 0, 1, 1000) - 0.5) < 1e-9
assert abs(d_one(lambda x: 1, lambda x: 3, 0, 2, 7) - 4) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if ‖·‖ is a norm on a vector space V, then d(u, v) = ‖u − v‖ is a metric on V.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows d(u, v) ≥ 0 with equality iff u = v, from the definiteness of the norm.",
          "Shows symmetry using ‖−w‖ = |−1|‖w‖ = ‖w‖.",
          "Proves the triangle inequality by writing u − w = (u − v) + (v − w) and applying the norm's triangle inequality.",
        ],
      },
    },
    {
      key: "d2",
      rung: "stretch",
      prompt: <p>The spike of height 1 and half-width w has d₂ distance √(2w/3) from 0. What is it for w = 0.06?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the three axioms of a metric and some examples beyond the line, how a norm gives a metric and why the discrete metric does not come from one, why all the usual norms on ℝⁿ agree about convergence, and why the sup and integral metrics on functions do not.",

  glimpse: (
    <>
      <p>
        On the line, Cauchy sequences converge. In a general metric space they need not: the rationals, or the polynomials
        under the sup metric, have holes. The next lesson studies complete metric spaces, where they do.
      </p>
    </>
  ),
};
