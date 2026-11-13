import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BernsteinViz } from "@/components/viz/BernsteinViz";
import type { LessonContent } from "@/lib/types";

const BERN = `from math import comb

def bernstein(f, n, x):
    return sum(f(k / n) * comb(n, k) * x ** k * (1 - x) ** (n - k) for k in range(n + 1))

def sup_error(f, n, m=200):
    return max(abs(bernstein(f, n, i / m) - f(i / m)) for i in range(m + 1))`;

const TAIL = `from math import comb

def binom_tail(n, x, delta):
    return sum(comb(n, k) * x ** k * (1 - x) ** (n - k)
               for k in range(n + 1) if abs(k / n - x) >= delta)

def chebyshev(n, x, delta):
    return x * (1 - x) / (n * delta * delta)`;

export const lesson: LessonContent = {
  id: "m8.8.4",
  minutes: 65,
  links: {
    requires: ["m8.8.1", "m8.5.3"],
    revisits: ["m7.4.2", "m7.7.1"],
    foreshadows: ["m8.8.5"],
  },

  puzzle: (
    <>
      <p>
        |x − 1/2| has a corner, so it is not a power series near 1/2, and no Taylor polynomial at 1/2 approximates it. Yet
        Weierstrass proved in 1885 that every continuous function on a closed interval is a uniform limit of polynomials. How
        can a smooth polynomial hug a corner to within any ε? A proof found by Bernstein in 1912 answers this with a coin.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Toss a coin with heads probability x, n times, and let S be the number of heads. S/n is near x with high probability,
        by the law of large numbers. So the average of f(S/n) is near f(x) when f is continuous. That average is a
        polynomial in x of degree n, because the probabilities of each S are.
      </p>
      <BernsteinViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Weierstrass approximation theorem">
        <p>
          For every continuous f on [0, 1] and every ε &gt; 0 there is a polynomial p with |f(x) − p(x)| &lt; ε for all
          x ∈ [0, 1]. By a linear change of variable, the same holds on any [a, b].
        </p>
      </Theorem>

      <Definition title="Bernstein polynomials">
        <p>
          With weights <M>{"w_k(x) = \\binom{n}{k} x^k (1-x)^{n-k}"}</M>, the probabilities of k heads in n tosses,
        </p>
        <MD>{"B_n f(x) = \\sum_{k=0}^n f(k/n)\\, w_k(x) = \\mathbb{E}\\, f(S_n/n), \\quad S_n \\sim \\text{Binomial}(n, x)."}</MD>
        <p>
          Since <M>{"\\sum_k w_k = 1"}</M>, <M>{"\\mathbb{E}[S_n/n] = x"}</M> and <M>{"\\operatorname{Var}(S_n/n) = x(1-x)/n"}</M>,
          one finds <M>{"B_n 1 = 1"}</M>, <M>{"B_n x = x"}</M> and <M>{"B_n x^2 = x^2 + x(1-x)/n"}</M>.
        </p>
        <Code>{BERN}</Code>
      </Definition>

      <Proof>
        <p>
          Let |f| ≤ M. Given ε, uniform continuity on [0, 1] gives δ with |f(s) − f(x)| &lt; ε when |s − x| &lt; δ. Using{" "}
          <M>{"\\sum w_k = 1"}</M>,
        </p>
        <MD>{"|B_n f(x) - f(x)| \\leq \\sum_k |f(k/n) - f(x)|\\, w_k(x)."}</MD>
        <p>
          Split the sum. Terms with |k/n − x| &lt; δ contribute less than ε in total. The others have{" "}
          <M>{"|f(k/n) - f(x)| \\leq 2M"}</M> and total weight <M>{"P(|S_n/n - x| \\geq \\delta)"}</M>, which Chebyshev&apos;s
          inequality bounds by <M>{"x(1-x)/(n\\delta^2) \\leq 1/(4n\\delta^2)"}</M>. So
        </p>
        <MD>{"|B_n f(x) - f(x)| < \\varepsilon + \\frac{M}{2n\\delta^2}"}</MD>
        <p>
          for every x, and the right side is below 2ε once n is large. The bound does not depend on x: the convergence is
          uniform. Chebyshev is crude, as the exact tail below shows, but crude suffices.
        </p>
        <Code>{TAIL}</Code>
      </Proof>

      <Remark title="rates and practice">
        <p>
          Bernstein polynomials converge slowly: for |x − 1/2| the error at 1/2 is of order <M>{"1/\\sqrt n"}</M>, and even for
          x² it is exactly x(1 − x)/n. In numerical work one interpolates at Chebyshev points instead, which converges far
          faster for smooth functions. Interpolating at equally spaced points can diverge (Runge&apos;s phenomenon), so the
          choice of construction matters even though the theorem guarantees some good polynomial exists.
        </p>
      </Remark>

      <Remark title="Stone–Weierstrass">
        <p>
          The theorem generalises: on a compact set, any algebra of continuous functions that contains constants and separates
          points is uniformly dense. Trigonometric polynomials on the circle, polynomials in several variables on a compact
          subset of ℝⁿ, and many families of features satisfy this. The next lesson uses the one-variable theorem to show
          that neural networks with one hidden layer are universal approximators.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "x2",
      rung: "check",
      prompt: <p>Evaluate B₁₀ applied to x², at x = 0.3.</p>,
      answer: { kind: "numeric", value: 0.111, tolerance: 0.0001 },
    },
    {
      key: "b2",
      rung: "check",
      prompt: <p>For f(x) = |x − 1/2|, evaluate B₂f(1/2).</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>What does the Weierstrass approximation theorem assert?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every continuous function on [0, 1] is within any ε of some polynomial, uniformly on [0, 1]",
          "Every continuous function on ℝ is a uniform limit of polynomials on all of ℝ",
          "Every continuous function on [0, 1] equals its Taylor series",
          "Every bounded function on [0, 1] is a uniform limit of polynomials",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb

def bernstein(f, n, x):
    return sum(f(k / n) * comb(n, k) * x ** k * (1 - x) ** (n - k) for k in range(n + 1))

def sup_error(f, n, m=200):
    return max(abs(bernstein(f, n, i / m) - f(i / m)) for i in range(m + 1))

f = lambda x: abs(x - 0.5)
print(round(bernstein(f, 10, 0.5), 6), round(bernstein(lambda x: x * x, 10, 0.3), 6), round(0.09 + 0.3 * 0.7 / 10, 6))
print([round(sup_error(f, n), 4) for n in (10, 100, 1000)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.123047 0.111 0.111\n[0.123, 0.0398, 0.0126]", "0.0 0.111 0.111\n[0.123, 0.0398, 0.0126]", "0.123047 0.09 0.111\n[0.123, 0.0398, 0.0126]", "0.123047 0.111 0.111\n[0.123, 0.0123, 0.00123]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb

def binom_tail(n, x, delta):
    return sum(comb(n, k) * x ** k * (1 - x) ** (n - k)
               for k in range(n + 1) if abs(k / n - x) >= delta)

def chebyshev(n, x, delta):
    return x * (1 - x) / (n * delta * delta)

print(round(binom_tail(100, 0.5, 0.155), 4), round(chebyshev(100, 0.5, 0.155), 4))
print(round(binom_tail(1000, 0.3, 0.0455), 6), round(chebyshev(1000, 0.3, 0.0455), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0018 0.1041\n0.001683 0.1014", "0.1041 0.0018\n0.1014 0.001683", "0.0018 0.0018\n0.001683 0.001683", "0.0018 1.0406\n0.001683 1.0144"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using math.comb, write <C>bernstein(f, n, x)</C> and <C>sup_error(f, n, m=200)</C>, the largest |Bₙf − f| over the
          grid i/m, i = 0, …, m.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb

def bernstein(f, n, x):
    return f(x)

def sup_error(f, n, m=200):
    return 0.0
`,
        solution: BERN,
        tests: [
          { name: "identities", code: `assert abs(bernstein(lambda x: 1, 5, 0.3) - 1) < 1e-12 and abs(bernstein(lambda x: x, 7, 0.4) - 0.4) < 1e-12
assert abs(bernstein(lambda x: x * x, 10, 0.3) - 0.111) < 1e-12` },
          { name: "sup", code: `assert sup_error(lambda x: x, 5, 10) < 1e-12 and abs(sup_error(lambda x: x * x, 4, 4) - 0.0625) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binom_tail(n, x, delta)</C>, the exact probability that |S/n − x| ≥ delta for S ~ Binomial(n, x), and{" "}
          <C>chebyshev(n, x, delta)</C>, the bound x(1 − x)/(n·delta²).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb

def binom_tail(n, x, delta):
    return 0.0

def chebyshev(n, x, delta):
    return 0.0
`,
        solution: TAIL,
        tests: [
          { name: "tail", code: `assert abs(binom_tail(2, 0.5, 0.3) - 0.5) < 1e-12 and binom_tail(4, 0.5, 0.6) == 0` },
          { name: "cheb", code: `assert abs(chebyshev(10, 0.5, 0.5) - 0.1) < 1e-12 and binom_tail(100, 0.3, 0.155) <= chebyshev(100, 0.3, 0.155)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose |f| ≤ M on [0, 1] and |f(s) − f(x)| &lt; ε whenever |s − x| &lt; δ. Prove that{" "}
          <M>{"|B_n f(x) - f(x)| < \\varepsilon + M/(2n\\delta^2)"}</M> for every x ∈ [0, 1].
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes Bₙf(x) − f(x) as Σ (f(k/n) − f(x)) w_k(x), using that the binomial weights sum to 1.",
          "Splits the sum by |k/n − x| < δ, bounding the near terms by ε and the far terms by 2M times P(|Sₙ/n − x| ≥ δ).",
          "Bounds the probability by Chebyshev's inequality with variance x(1 − x)/n ≤ 1/(4n), giving 2M/(4nδ²) = M/(2nδ²).",
        ],
      },
    },
    {
      key: "n",
      rung: "stretch",
      prompt: <p>With M = 1 and δ = 0.1, how large must n be for M/(2nδ²) ≤ 0.01?</p>,
      answer: { kind: "numeric", value: 5000, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the statement of the Weierstrass approximation theorem, how Bernstein polynomials are expectations of f at a binomial proportion, and how uniform continuity and Chebyshev's inequality together prove uniform convergence.",

  glimpse: (
    <>
      <p>
        Polynomials are dense; so are many other families. The next lesson shows that sums of shifted and scaled ReLUs or
        sigmoids are dense too, which is the universal approximation theorem for one-hidden-layer networks.
      </p>
    </>
  ),
};
