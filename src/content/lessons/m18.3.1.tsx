import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MixedLawViz } from "@/components/viz/MixedLawViz";
import type { LessonContent } from "@/lib/types";

const LAW = `def pushforward(w, X):
    law = {}
    for omega, p in w.items():
        law[X(omega)] = law.get(X(omega), 0) + p
    return law

def cdf_from_pmf(pmf, x):
    return sum(p for v, p in pmf.items() if v <= x)

def quantile(pmf, u):
    total = 0
    for v in sorted(pmf):
        total += pmf[v]
        if total >= u - 1e-12:
            return v
    return max(pmf)`;

const CANTOR = `def cantor_cdf(x, depth=40):
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    value, scale = 0.0, 0.5
    for _ in range(depth):
        x *= 3
        d = min(2, int(x))
        x -= d
        if d == 1:
            return value + scale
        value += scale * d / 2
        scale /= 2
    return value

def cantor_point(bits):
    return sum(2 * b / 3 ** (k + 1) for k, b in enumerate(bits))

def mixed_cdf(x, weights):
    a, u, c = weights
    atom = 1.0 if x >= 0 else 0.0
    unif = min(1.0, max(0.0, x - 1))
    return a * atom + u * unif + c * cantor_cdf(x - 2)`;

export const lesson: LessonContent = {
  id: "m18.3.1",
  minutes: 40,
  links: {
    requires: ["m18.1.4", "m7.2.1"],
    revisits: ["m7.3.3", "m18.1.3"],
    foreshadows: ["m18.3.2", "m18.4.1"],
  },

  puzzle: (
    <>
      <p>
        Elementary probability has two kinds of random variable: discrete ones with a mass function and continuous ones
        with a density. Pick a point of the Cantor set by tossing a fair coin for each ternary digit, 0 for heads and 2 for
        tails. The result has no density, because the Cantor set has length zero, and no mass function, because every
        single point has probability zero. What kind of object is its distribution, and how do you compute its mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Forget mass functions and densities, and keep only the question every distribution answers: what is the
        probability that X lands in a set B? That rule, B ↦ P(X ∈ B), is a measure on the real line, and it exists for
        every random variable, however strange. Its distribution function F(x) = P(X ≤ x) pins it down. Jumps in F are
        atoms, smooth slopes are densities, and the Cantor staircase climbs while being flat almost everywhere.
      </p>
      <MixedLawViz />
    </>
  ),

  theory: (
    <>
      <Definition title="random variable and law">
        <p>
          A probability space is a measure space <M>{"(\\Omega, \\mathcal F, P)"}</M> with <M>{"P(\\Omega) = 1"}</M>. A random variable is a
          measurable function <M>{"X : \\Omega \\to \\mathbb R"}</M> (m18.1.4), so every <M>{"\\{X \\in B\\}"}</M> with B Borel is an event. Its law
          is the pushforward measure
        </p>
        <MD>{"P_X(B) = P(X^{-1}(B)) = P(X \\in B),"}</MD>
        <p>
          a probability measure on the Borel sets of ℝ. Countable additivity is inherited, because preimages preserve
          disjoint unions. On a finite space the pushforward collects the weight of all outcomes with the same value
          (<C>pushforward</C>).
        </p>
        <Code>{LAW}</Code>
      </Definition>

      <Theorem title="distribution functions">
        <p>
          F(x) = <M>{"P_X((-\\infty, x])"}</M> is non-decreasing, right-continuous, with limits 0 at −∞ and 1 at +∞. Conversely,
          every such F is the distribution function of exactly one Borel probability measure.
        </p>
      </Theorem>
      <Proof>
        <p>
          Monotonicity is monotonicity of measure. Right-continuity and the limits are continuity from above and below
          along <M>{"(-\\infty, x + 1/n]"}</M>, <M>{"(-\\infty, -n]"}</M> and <M>{"(-\\infty, n]"}</M>. Uniqueness: half-lines form a π-system generating
          the Borel sets, so Dynkin&apos;s theorem (m18.1.1) applies. Existence: on <M>{"\\Omega = (0, 1)"}</M> with Lebesgue measure (m18.1.3) put
        </p>
        <MD>{"X(u) = \\inf\\{x : F(x) \\ge u\\}."}</MD>
        <p>
          Right-continuity gives <M>{"X(u) \\le x \\iff u \\le F(x)"}</M>, so <M>{"\\lambda(X \\le x) = F(x)"}</M>. This is the
          universality of the uniform from m7.3.3, now valid for every F, atoms and all (<C>quantile</C> is its discrete form).
        </p>
      </Proof>

      <Theorem title="change of variables">
        <p>For Borel g with g(X) integrable or g ≥ 0,</p>
        <MD>{"\\mathbb E\\, g(X) = \\int_\\Omega g(X(\\omega))\\, P(d\\omega) = \\int_{\\mathbb R} g(x)\\, P_X(dx)."}</MD>
      </Theorem>
      <Proof>
        <p>
          For <M>{"g = \\mathbb 1_B"}</M> both sides are <M>{"P(X \\in B)"}</M>. Linearity extends it to simple g, monotone convergence (m18.2.2) to
          g ≥ 0, and splitting <M>{"g = g^+ - g^-"}</M> to integrable g. So every expectation is an integral against the law, and the
          sum and density formulas of m7.2.3 are the two special cases.
        </p>
      </Proof>

      <Definition title="the σ-algebra of X">
        <p>
          <M>{"\\sigma(X) = \\{X^{-1}(B) : B \\text{ Borel}\\}"}</M> is the smallest σ-algebra making X measurable: the information you
          have after learning X. A real Y is σ(X)-measurable exactly when Y = h(X) for some Borel h, which is how conditioning on X
          will be defined in m18.5.1.
        </p>
      </Definition>

      <Example title="the Cantor distribution">
        <p>
          Let <M>{"X = \\sum_k 2B_k 3^{-k}"}</M> with independent fair bits <M>{"B_k"}</M> (<C>cantor_point</C>). Its distribution function is the
          Cantor function (<C>cantor_cdf</C>): continuous, so there are no atoms, and constant on every removed middle third, so
          F′ = 0 off a null set and no density can reproduce it. Its mean is 1/2 by symmetry. The mixture in the figure
          combines it with an atom and a uniform part (<C>mixed_cdf</C>).
        </p>
        <Code>{CANTOR}</Code>
      </Example>

      <Remark title="three kinds of law">
        <p>
          Every law on ℝ splits uniquely as <M>{"P_X = \\mu_d + \\mu_{ac} + \\mu_s"}</M>: a discrete part carried by the countably many
          jumps of F, a part with a density, and a singular continuous part like the Cantor law. The absolutely continuous
          piece is exactly what the Radon-Nikodym theorem extracts (m18.4.1, m18.4.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "quarter",
      rung: "check",
      prompt: <p>The point 1/4 has ternary expansion 0.020202... Use it to compute the Cantor function at 1/4. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "mixture",
      rung: "check",
      prompt: (
        <p>
          X is 0 with probability 0.3, uniform on [1, 2] with probability 0.5 and Cantor-distributed on [2, 3] with
          probability 0.2. Compute P(X ≤ 1.5).
        </p>
      ),
      answer: { kind: "numeric", value: 0.55, tolerance: 0.0001 },
    },
    {
      key: "kind",
      rung: "apply",
      prompt: <p>The Cantor distribution function F is continuous. What follows about the law of X?</p>,
      answer: {
        kind: "choice",
        options: [
          "P(X = x) = 0 for every x, yet the law may still have no density",
          "The law has a density, namely F′ wherever it exists",
          "X is a constant almost surely",
          "The law gives positive probability to some interval where F is flat",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pushforward(w, X):
    law = {}
    for omega, p in w.items():
        law[X(omega)] = law.get(X(omega), 0) + p
    return law

def cdf_from_pmf(pmf, x):
    return sum(p for v, p in pmf.items() if v <= x)

def quantile(pmf, u):
    total = 0
    for v in sorted(pmf):
        total += pmf[v]
        if total >= u - 1e-12:
            return v
    return max(pmf)

law = pushforward({(i, j): 1 / 16 for i in range(4) for j in range(4)}, lambda o: max(o)); print(sorted(law.items()))
print(cdf_from_pmf(law, 1.5), quantile(law, 0.5), quantile(law, 0.0625), quantile(law, 0.9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 0.0625), (1, 0.1875), (2, 0.3125), (3, 0.4375)]\n0.25 2 0 3",
          "[(0, 0.0625), (1, 0.1875), (2, 0.3125), (3, 0.4375)]\n0.25 1 0 3",
          "[(0, 0.25), (1, 0.25), (2, 0.25), (3, 0.25)]\n0.5 1 0 3",
          "[(0, 0.4375), (1, 0.3125), (2, 0.1875), (3, 0.0625)]\n0.75 1 0 2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cantor_cdf(x, depth=40):
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    value, scale = 0.0, 0.5
    for _ in range(depth):
        x *= 3
        d = min(2, int(x))
        x -= d
        if d == 1:
            return value + scale
        value += scale * d / 2
        scale /= 2
    return value

def cantor_point(bits):
    return sum(2 * b / 3 ** (k + 1) for k, b in enumerate(bits))

def mixed_cdf(x, weights):
    a, u, c = weights
    atom = 1.0 if x >= 0 else 0.0
    unif = min(1.0, max(0.0, x - 1))
    return a * atom + u * unif + c * cantor_cdf(x - 2)

print(cantor_cdf(1 / 3), cantor_cdf(0.8), round(cantor_point([1, 0, 1]), 4), round(cantor_cdf(cantor_point([1, 0, 1])), 4))
print(mixed_cdf(-1, (0.3, 0.5, 0.2)), mixed_cdf(0, (0.3, 0.5, 0.2)), mixed_cdf(2.5, (0.3, 0.5, 0.2)), mixed_cdf(1.2, (0.5, 0.5, 0.0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.75 0.7407 0.625\n0.0 0.3 0.9 0.6",
          "0.5 0.75 0.7407 0.625\n0.0 0.0 0.9 0.6",
          "0.5 0.8 0.7407 0.625\n0.0 0.3 0.9 0.6",
          "0.3333 0.75 0.7407 0.75\n0.0 0.3 0.8 0.6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A finite probability space is a dict of weights. Write <C>pushforward(w, X)</C> returning the law of X as a dict
          from values to probabilities, <C>cdf_from_pmf(pmf, x)</C>, and <C>quantile(pmf, u)</C>, the smallest value v with
          F(v) ≥ u.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pushforward(w, X):
    return {}

def cdf_from_pmf(pmf, x):
    return 0

def quantile(pmf, u):
    return 0
`,
        solution: LAW,
        tests: [
          { name: "law", code: `law = pushforward({1: 0.5, 2: 0.25, 3: 0.25}, lambda o: o % 2)
assert len(law) == 2 and abs(law[1] - 0.75) < 1e-12 and abs(cdf_from_pmf({0: 0.25, 1: 0.75}, 0.5) - 0.25) < 1e-12` },
          { name: "quantile", code: `pmf = {1: 0.2, 5: 0.5, 9: 0.3}
assert quantile(pmf, 0.7) == 5 and quantile(pmf, 0.71) == 9 and quantile(pmf, 0.1) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cantor_cdf(x, depth)</C> by reading ternary digits (stop at the first 1), <C>cantor_point(bits)</C>{" "}
          returning the sum of 2b/3ᵏ, and <C>mixed_cdf(x, weights)</C> for weights (a, u, c) on an atom at 0, the uniform law on
          [1, 2] and the Cantor law on [2, 3].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cantor_cdf(x, depth=40):
    return 0.0

def cantor_point(bits):
    return 0.0

def mixed_cdf(x, weights):
    return 0.0
`,
        solution: CANTOR,
        tests: [
          { name: "cantor", code: `assert abs(cantor_cdf(0.75) - 2 / 3) < 1e-9 and abs(cantor_cdf(0.5) - 0.5) < 1e-12 and abs(cantor_point([1, 1]) - 8 / 9) < 1e-12` },
          { name: "mixed", code: `w = (0.2, 0.6, 0.2)
assert abs(mixed_cdf(1.5, w) - 0.5) < 1e-12 and mixed_cdf(-0.5, w) == 0.0 and abs(mixed_cdf(3, w) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "variance",
      rung: "stretch",
      prompt: (
        <p>
          The Cantor law is invariant under x ↦ 1 − x and under the split X = <M>{"\\tfrac{2B_1}{3} + \\tfrac{1}{3}X'"}</M> with X′ an
          independent copy. Use this to find the variance of the Cantor distribution. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.125, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A single random variable is now just a measure on the line. Several at once need a joint law, and the simplest joint
        law is a product measure: that is what independence means.
      </p>
    </>
  ),
};
