import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MassEscapeViz } from "@/components/viz/MassEscapeViz";
import type { LessonContent } from "@/lib/types";

const SEQUENCES = `def midpoint(f, a, b, n):
    h = (b - a) / n
    return h * sum(f(a + (i + 0.5) * h) for i in range(n))

def spike(n):
    return lambda x: n if 0 < x < 1 / n else 0

def power(n):
    return lambda x: x ** n`;

const PARAMETER = `import math

def F(t, n):
    h = 1 / n
    return h * sum(math.exp(-t * ((i + 0.5) * h) ** 2) for i in range(n))

def dF(t, n):
    h = 1 / n
    return -h * sum(((i + 0.5) * h) ** 2 * math.exp(-t * ((i + 0.5) * h) ** 2) for i in range(n))

def central_difference(t, eps, n):
    return (F(t + eps, n) - F(t - eps, n)) / (2 * eps)`;

export const lesson: LessonContent = {
  id: "m18.2.2",
  minutes: 45,
  links: {
    requires: ["m18.2.1", "m8.2.2"],
    revisits: ["m8.2.5", "m2.8.2"],
    foreshadows: ["m18.2.3", "m18.3.4"],
  },

  puzzle: (
    <>
      <p>
        Analysis is full of moves like &quot;differentiate under the integral&quot;, &quot;integrate a series term by term&quot;,
        &quot;the expectation of the limit is the limit of the expectations&quot;. Each swaps a limit with an integral, and
        each can fail: a spike of height n on (0, 1/n) has area 1 for every n but tends to 0 at every point. When exactly is
        the swap allowed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Area can vanish in the limit only by escaping: piling up on a shrinking set, or sliding off to infinity. Two
        conditions rule this out. If the functions only ever increase, nothing escapes, because area already gained is
        never lost. If a single integrable function lies above all of them, there is no room for mass to pile up or run
        away. These are the monotone and dominated convergence theorems.
      </p>
      <MassEscapeViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="monotone convergence">
        <p>If <M>{"0 \\le f_1 \\le f_2 \\le \\cdots"}</M> are measurable and <M>{"f_n \\to f"}</M> pointwise, then</p>
        <MD>{"\\int f_n\\, d\\mu \\uparrow \\int f\\, d\\mu."}</MD>
      </Theorem>
      <Proof>
        <p>
          The integrals increase and are at most <M>{"\\int f"}</M>, so they have a limit L ≤ <M>{"\\int f"}</M>. For the reverse, take a simple{" "}
          <M>{"0 \\le \\varphi \\le f"}</M> and c &lt; 1, and let <M>{"E_n = \\{f_n \\ge c\\varphi\\}"}</M>. These sets increase to Ω, because{" "}
          <M>{"f_n \\to f \\ge \\varphi > c\\varphi"}</M> wherever φ &gt; 0. Then{" "}
          <M>{"\\int f_n \\ge c\\int_{E_n} \\varphi = c\\sum_i a_i\\, \\mu(A_i \\cap E_n) \\to c\\int \\varphi"}</M> by continuity from below (m18.1.2). So
          L ≥ c∫φ for all c &lt; 1 and all simple φ ≤ f, hence L ≥ ∫f.
        </p>
      </Proof>

      <Theorem title="consequences">
        <p>
          The integral is additive on non-negative functions, and for non-negative measurable <M>{"g_k"}</M>,{" "}
          <M>{"\\int \\sum_k g_k = \\sum_k \\int g_k"}</M>, with both sides possibly infinite.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take simple <M>{"\\varphi_n \\uparrow f"}</M> and <M>{"\\psi_n \\uparrow g"}</M> (m18.1.4). Then <M>{"\\varphi_n + \\psi_n \\uparrow f + g"}</M>, and the
          integral is additive for simple functions; apply monotone convergence three times. For the series, apply it to the
          partial sums, which increase because each <M>{"g_k \\ge 0"}</M> (m2.8.2).
        </p>
      </Proof>

      <Theorem title="dominated convergence">
        <p>
          If <M>{"f_n \\to f"}</M> almost everywhere and <M>{"|f_n| \\le g"}</M> for all n, with g integrable, then f is integrable and
        </p>
        <MD>{"\\int |f_n - f|\\, d\\mu \\to 0, \\qquad \\text{so} \\qquad \\int f_n\\, d\\mu \\to \\int f\\, d\\mu."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"h_n = \\sup_{k \\ge n} |f_k - f|"}</M>. Then <M>{"0 \\le h_n \\le 2g"}</M>, and <M>{"h_n \\downarrow 0"}</M> almost everywhere because{" "}
          <M>{"\\limsup_k |f_k - f| = 0"}</M> (m8.2.5). The functions <M>{"2g - h_n"}</M> increase to 2g, so by monotone convergence{" "}
          <M>{"\\int (2g - h_n) \\to \\int 2g"}</M>; since <M>{"\\int 2g < \\infty"}</M> we may subtract and get <M>{"\\int h_n \\to 0"}</M>. Finally{" "}
          <M>{"\\int |f_n - f| \\le \\int h_n"}</M>. On a probability space a constant is integrable, so a uniformly bounded sequence
          always qualifies: this special case is the bounded convergence theorem.
        </p>
        <Code>{SEQUENCES}</Code>
      </Proof>

      <Example title="what goes wrong without domination">
        <p>
          For the spike <M>{"f_n = n\\mathbb 1_{(0, 1/n)}"}</M> (<C>spike</C>) the smallest dominating function is{" "}
          <M>{"\\sup_n f_n \\approx 1/x"}</M>, which is not integrable on (0, 1). For <M>{"\\mathbb 1_{[n, n+1)}"}</M> on [0, ∞) it is the
          constant 1. In both cases <M>{"\\int f_n = 1"}</M> while the limit has integral 0. A quadrature rule with fixed nodes misses
          the spike entirely once it falls between nodes (<C>midpoint</C>). Powers <M>{"x^n"}</M> on [0, 1] are dominated by 1, so their
          integrals 1/(n + 1) do tend to 0 (<C>power</C>).
        </p>
      </Example>

      <Theorem title="differentiating under the integral">
        <p>
          Let <M>{"F(t) = \\int f(t, x)\\, \\mu(dx)"}</M>. If <M>{"t \\mapsto f(t, x)"}</M> is differentiable for each x and{" "}
          <M>{"|\\partial_t f(t, x)| \\le g(x)"}</M> for all t in an interval, with g integrable, then{" "}
          <M>{"F'(t) = \\int \\partial_t f(t, x)\\, \\mu(dx)"}</M> there.
        </p>
      </Theorem>
      <Proof>
        <p>
          The difference quotients <M>{"(f(t + h_n, x) - f(t, x))/h_n"}</M> tend to <M>{"\\partial_t f(t, x)"}</M> and, by the mean value theorem,
          are bounded by g(x). Dominated convergence passes the limit through the integral. For{" "}
          <M>{"F(t) = \\int_0^1 e^{-tx^2}\\, dx"}</M>, the bound <M>{"x^2 e^{-tx^2} \\le 1"}</M> for t ≥ 0 justifies{" "}
          <M>{"F'(t) = -\\int_0^1 x^2 e^{-tx^2}\\, dx"}</M>, which a central difference confirms numerically (<C>F</C>, <C>dF</C>,{" "}
          <C>central_difference</C>).
        </p>
        <Code>{PARAMETER}</Code>
      </Proof>

      <Remark title="in probability">
        <p>
          With integrals as expectations: if <M>{"X_n \\uparrow X"}</M> with <M>{"X_n \\ge 0"}</M> then <M>{"\\mathbb E X_n \\uparrow \\mathbb E X"}</M>; and if{" "}
          <M>{"X_n \\to X"}</M> almost surely with <M>{"|X_n| \\le Y"}</M> and <M>{"\\mathbb E Y < \\infty"}</M>, then{" "}
          <M>{"\\mathbb E X_n \\to \\mathbb E X"}</M>. Convergence almost surely alone is not enough: the spike, read as a random variable on
          [0, 1] with uniform probability, converges to 0 almost surely with expectation 1 throughout (m18.3.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "power",
      rung: "check",
      prompt: <p>What is the integral of x⁹ over [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.00001 },
    },
    {
      key: "series",
      rung: "check",
      prompt: <p>Using monotone convergence to swap sum and integral, evaluate the sum over n ≥ 1 of the integrals of xⁿ(1 − x) over [0, 1].</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>The spike fₙ = n on (0, 1/n), 0 elsewhere, tends to 0 everywhere but keeps integral 1. Which hypothesis of dominated convergence fails?</p>,
      answer: {
        kind: "choice",
        options: [
          "No integrable function lies above every fₙ",
          "The fₙ are not measurable",
          "The fₙ do not converge almost everywhere",
          "The limit function is not integrable",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def midpoint(f, a, b, n):
    h = (b - a) / n
    return h * sum(f(a + (i + 0.5) * h) for i in range(n))

def spike(n):
    return lambda x: n if 0 < x < 1 / n else 0

def power(n):
    return lambda x: x ** n

print(midpoint(lambda x: x, 0, 2, 4), midpoint(spike(4), 0, 1, 8), midpoint(spike(100), 0, 1, 8))
print([round(midpoint(power(n), 0, 1, 1000), 3) for n in (1, 4, 9)], power(3)(1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 1.0 0.0\n[0.5, 0.2, 0.1] 1.0",
          "2.0 1.0 1.0\n[0.5, 0.2, 0.1] 1.0",
          "2.0 0.5 0.0\n[0.5, 0.2, 0.1] 1.0",
          "2.0 1.0 0.0\n[0.5, 0.25, 0.111] 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def F(t, n):
    h = 1 / n
    return h * sum(math.exp(-t * ((i + 0.5) * h) ** 2) for i in range(n))

def dF(t, n):
    h = 1 / n
    return -h * sum(((i + 0.5) * h) ** 2 * math.exp(-t * ((i + 0.5) * h) ** 2) for i in range(n))

def central_difference(t, eps, n):
    return (F(t + eps, n) - F(t - eps, n)) / (2 * eps)

print(F(0.0, 10), dF(0.0, 1), round(F(1.0, 1), 4))
print(abs(central_difference(1.0, 1e-4, 200) - dF(1.0, 200)) < 1e-6, dF(5.0, 4) < 0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 -0.25 0.7788\nTrue True",
          "1.0 0.25 0.7788\nTrue True",
          "0.0 -0.25 0.7788\nTrue True",
          "1.0 -0.25 0.3679\nFalse True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>midpoint(f, a, b, n)</C>, the midpoint rule with n equal pieces, <C>spike(n)</C> returning the function equal to
          n on the open interval (0, 1/n) and 0 elsewhere, and <C>power(n)</C> returning x ↦ xⁿ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def midpoint(f, a, b, n):
    return 0.0

def spike(n):
    return lambda x: 0

def power(n):
    return lambda x: x
`,
        solution: SEQUENCES,
        tests: [
          { name: "midpoint", code: `assert midpoint(lambda x: x * x, 0, 1, 2) == 0.3125 and midpoint(lambda x: 3, -1, 1, 5) == 6.0 and abs(midpoint(power(2), 0, 3, 3000) - 9) < 1e-5` },
          { name: "sequences", code: `s = spike(5)
assert s(0.1) == 5 and s(0.2) == 0 and s(0) == 0 and abs(midpoint(spike(5), 0, 1, 1000) - 1) < 1e-9 and power(3)(2) == 8 and power(0)(7) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the midpoint rule on n pieces of [0, 1], write <C>F(t, n)</C> for <M>{"\\int_0^1 e^{-tx^2}\\, dx"}</M>, <C>dF(t, n)</C> for{" "}
          <M>{"-\\int_0^1 x^2 e^{-tx^2}\\, dx"}</M>, and <C>central_difference(t, eps, n)</C> = (F(t + ε) − F(t − ε))/(2ε).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def F(t, n):
    return 1.0

def dF(t, n):
    return 0.0

def central_difference(t, eps, n):
    return 0.0
`,
        solution: PARAMETER,
        tests: [
          { name: "integrals", code: `assert abs(F(1.0, 2) - (math.exp(-1 / 16) + math.exp(-9 / 16)) / 2) < 1e-12 and abs(dF(0.0, 2) + (1 / 16 + 9 / 16) / 2) < 1e-12 and abs(F(2.0, 4000) - 0.5981440066613611) < 1e-6` },
          { name: "derivative", code: `assert abs(central_difference(2.0, 1e-4, 300) - dF(2.0, 300)) < 1e-7 and abs(central_difference(0.0, 0.5, 1) - (math.exp(-0.125) - math.exp(0.125))) < 1e-12` },
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: (
        <p>
          Using dominated convergence, find the limit as n → ∞ of{" "}
          <M>{"\\int_0^\\infty \\frac{n \\sin(x/n)}{x(1 + x^2)}\\, dx"}</M>. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.5708, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Without monotonicity or domination, one inequality survives: the integral of a limit inferior is at most the limit
        inferior of the integrals. That is Fatou&apos;s lemma, the subject of the next lesson.
      </p>
    </>
  ),
};
