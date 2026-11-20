import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DyadicRatioViz } from "@/components/viz/DyadicRatioViz";
import type { LessonContent } from "@/lib/types";

const FINITE = `def rn_derivative(nu, mu):
    return {x: nu.get(x, 0) / m for x, m in mu.items() if m > 0}

def integrate(f, mu, A):
    return sum(f[x] * mu[x] for x in A if mu.get(x, 0) > 0)

def change_measure(X, p, q):
    ratio = rn_derivative(q, p)
    return sum(X(x) * ratio[x] * p[x] for x in ratio)`;

const RATIOS = `def dyadic_ratios(F, k):
    n = 2 ** k
    return [(F((j + 1) / n) - F(j / n)) * n for j in range(n)]

def l1_gap(ratios, f, m=64):
    n = len(ratios)
    total = 0.0
    for j, r in enumerate(ratios):
        for i in range(m):
            total += abs(r - f((j + (i + 0.5) / m) / n)) / (n * m)
    return total

def importance_estimate(xs, X, ratio):
    return sum(X(x) * ratio(x) for x in xs) / len(xs)`;

export const lesson: LessonContent = {
  id: "m18.4.2",
  minutes: 50,
  links: {
    requires: ["m18.4.1", "m18.2.2"],
    revisits: ["m13.1.3", "m9.4.3"],
    foreshadows: ["m18.4.3", "m18.5.1"],
  },

  puzzle: (
    <>
      <p>
        On a finite set the density of ν with respect to μ is obvious: divide, ν{"{x}"}/μ{"{x}"}. On the real line single points
        have measure zero and the division is 0/0. Yet a density is exactly what likelihood ratios, importance sampling and
        changes of measure need. Is absolute continuity, the bare condition that μ-null sets are ν-null, enough to produce
        one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Replace points by small cells and divide there: ν(B)/μ(B). As the cells shrink these ratios settle down to a
        function, and that function is the density. If ν has a singular part, the ratios blow up on the cells that hold it,
        which is how the singular part announces itself.
      </p>
      <DyadicRatioViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Radon-Nikodym">
        <p>
          Let μ and ν be σ-finite measures on <M>{"(\\Omega, \\mathcal F)"}</M> with <M>{"\\nu \\ll \\mu"}</M>. Then there is a measurable f ≥ 0
          with
        </p>
        <MD>{"\\nu(A) = \\int_A f\\, d\\mu \\quad \\text{for all } A \\in \\mathcal F,"}</MD>
        <p>
          unique up to μ-null sets. It is written <M>{"f = d\\nu/d\\mu"}</M>, the Radon-Nikodym derivative. On a finite set it is the ratio of
          weights wherever μ is positive (<C>rn_derivative</C>, <C>integrate</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Take μ and ν finite; the σ-finite case follows by gluing countably many pieces. Let G be the set of g ≥ 0 with{" "}
          <M>{"\\int_A g\\, d\\mu \\le \\nu(A)"}</M> for all A. It contains 0 and is closed under max: split A where <M>{"g_1 \\ge g_2"}</M> and where
          not. Choose <M>{"g_n \\in G"}</M> with <M>{"\\int g_n\\, d\\mu \\to s = \\sup_{g \\in G} \\int g\\, d\\mu"}</M>, replace them by running maxima, and
          let <M>{"f = \\lim g_n"}</M>. Monotone convergence (m18.2.2) puts f in G with <M>{"\\int f\\, d\\mu = s"}</M>.
        </p>
        <p>
          Now <M>{"\\rho(A) = \\nu(A) - \\int_A f\\, d\\mu"}</M> is a measure. If <M>{"\\rho \\ne 0"}</M>, pick ε &gt; 0 with <M>{"\\rho(\\Omega) > \\varepsilon\\mu(\\Omega)"}</M>.
          The Hahn decomposition of the signed measure <M>{"\\rho - \\varepsilon\\mu"}</M> gives a set P on which every subset has{" "}
          <M>{"\\rho \\ge \\varepsilon\\mu"}</M>, with <M>{"(\\rho - \\varepsilon\\mu)(P) > 0"}</M>; then <M>{"\\mu(P) > 0"}</M>, since otherwise{" "}
          <M>{"\\nu \\ll \\mu"}</M> would make ρ(P) = 0. But then <M>{"f + \\varepsilon\\mathbb 1_P \\in G"}</M> has a larger integral than s. So ρ = 0.
          Uniqueness: if two densities differ on a set of positive μ-measure, integrate both over the set where one exceeds
          the other.
        </p>
        <Code>{FINITE}</Code>
      </Proof>

      <Example title="σ-finiteness cannot be dropped">
        <p>
          Lebesgue measure on [0, 1] is absolutely continuous with respect to counting measure, which is not σ-finite there.
          A density f would need <M>{"\\lambda(\\{x\\}) = f(x) = 0"}</M> for every x, and then <M>{"\\lambda([0, 1]) = \\sum_x f(x) = 0"}</M>.
        </p>
      </Example>

      <Theorem title="calculus of densities">
        <p>For σ-finite measures with <M>{"\\rho \\ll \\nu \\ll \\mu"}</M>:</p>
        <MD>{"\\int g\\, d\\nu = \\int g\\, \\frac{d\\nu}{d\\mu}\\, d\\mu, \\qquad \\frac{d\\rho}{d\\mu} = \\frac{d\\rho}{d\\nu}\\, \\frac{d\\nu}{d\\mu}, \\qquad \\frac{d\\mu}{d\\nu} = \\Big(\\frac{d\\nu}{d\\mu}\\Big)^{-1} \\text{ if } \\mu \\sim \\nu."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first holds for indicators by definition, then for simple g by linearity and for g ≥ 0 by monotone convergence,
          the usual ladder. The chain rule follows by applying the first with <M>{"g = \\mathbb 1_A\\, d\\rho/d\\nu"}</M>, and the inverse is the
          chain rule with ρ = μ, the derivative of μ with respect to itself being 1.
        </p>
      </Proof>

      <Remark title="change of measure">
        <p>
          For probability measures <M>{"Q \\ll P"}</M>, the first formula reads <M>{"\\mathbb E_Q X = \\mathbb E_P[X\\, dQ/dP]"}</M>
          (<C>change_measure</C>). Sampling from P and weighting by the likelihood ratio dQ/dP estimates Q-expectations:
          importance sampling (<C>importance_estimate</C>). When P and Q have densities p and q with respect to Lebesgue
          measure, the chain rule gives <M>{"dQ/dP = q/p"}</M>, the likelihood ratio of statistics.
        </p>
      </Remark>

      <Theorem title="derivatives as limits of ratios">
        <p>
          If <M>{"\\nu \\ll \\lambda"}</M> on [0, 1) with density f, then for almost every x,
        </p>
        <MD>{"\\frac{\\nu(B_k(x))}{\\lambda(B_k(x))} \\to f(x),"}</MD>
        <p>
          where <M>{"B_k(x)"}</M> is the dyadic cell of level k containing x (<C>dyadic_ratios</C>), and the convergence also holds in{" "}
          <M>{"L^1"}</M> (<C>l1_gap</C>). For a singular part the ratios tend to 0 almost everywhere and to ∞ on the set where it lives.
        </p>
      </Theorem>
      <Proof>
        <p>
          The step function of level k is the average of f over each cell. For continuous f this converges uniformly, and
          continuous functions are dense in <M>{"L^1"}</M>; averaging over cells does not increase the <M>{"L^1"}</M> norm, which gives the{" "}
          <M>{"L^1"}</M> statement. The almost everywhere statement is the Lebesgue differentiation theorem; for dyadic cells it is the
          martingale convergence theorem of m18.5.4, since these ratios are a martingale.
        </p>
        <Code>{RATIOS}</Code>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "exp",
      rung: "check",
      prompt: <p>P is Exponential(1) and Q is Exponential(2). Compute dQ/dP at x = 1. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.7358, tolerance: 0.0001 },
    },
    {
      key: "second",
      rung: "check",
      prompt: <p>P is uniform on [0, 1] and Q has density 2x. Compute E_P[(dQ/dP)²]. Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.3333, tolerance: 0.0001 },
    },
    {
      key: "exists",
      rung: "apply",
      prompt: <p>The law of X has a density with respect to Lebesgue measure. Which condition is exactly equivalent?</p>,
      answer: {
        kind: "choice",
        options: [
          "P(X ∈ A) = 0 for every Borel set A of length 0",
          "P(X = x) = 0 for every x",
          "The distribution function of X is continuous",
          "The distribution function of X is differentiable at some point",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rn_derivative(nu, mu):
    return {x: nu.get(x, 0) / m for x, m in mu.items() if m > 0}

def integrate(f, mu, A):
    return sum(f[x] * mu[x] for x in A if mu.get(x, 0) > 0)

def change_measure(X, p, q):
    ratio = rn_derivative(q, p)
    return sum(X(x) * ratio[x] * p[x] for x in ratio)

mu = {'a': 0.5, 'b': 0.25, 'c': 0.25}; nu = {'a': 0.25, 'b': 0.75}; d = rn_derivative(nu, mu); print(d, integrate(d, mu, ['a', 'b']), integrate(d, mu, ['c']))
print(change_measure(lambda x: 4 if x == 'b' else 0, mu, nu), change_measure(lambda x: 1, mu, nu), rn_derivative({1: 0.5}, {1: 0.25, 2: 0.0}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'a': 0.5, 'b': 3.0, 'c': 0.0} 1.0 0.0\n3.0 1.0 {1: 2.0}",
          "{'a': 0.5, 'b': 3.0} 1.0 0.0\n3.0 1.0 {1: 2.0}",
          "{'a': 2.0, 'b': 0.3333, 'c': 0.0} 1.0 0.0\n0.75 1.0 {1: 0.5}",
          "{'a': 0.5, 'b': 3.0, 'c': 0.0} 1.0 0.0\n3.0 1.0 {1: 2.0, 2: 0.0}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def dyadic_ratios(F, k):
    n = 2 ** k
    return [(F((j + 1) / n) - F(j / n)) * n for j in range(n)]

def l1_gap(ratios, f, m=64):
    n = len(ratios)
    total = 0.0
    for j, r in enumerate(ratios):
        for i in range(m):
            total += abs(r - f((j + (i + 0.5) / m) / n)) / (n * m)
    return total

def importance_estimate(xs, X, ratio):
    return sum(X(x) * ratio(x) for x in xs) / len(xs)

print(dyadic_ratios(lambda x: x * x, 1), dyadic_ratios(lambda x: x * x, 2), round(l1_gap([1.0], lambda x: 2 * x), 4))
print(round(l1_gap(dyadic_ratios(lambda x: x * x, 2), lambda x: 2 * x), 4), importance_estimate([0.25, 0.75], lambda x: x, lambda x: 2 * x))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.5] [0.25, 0.75, 1.25, 1.75] 0.5\n0.125 0.625",
          "[0.25, 0.75] [0.0625, 0.1875, 0.3125, 0.4375] 0.5\n0.125 0.625",
          "[0.5, 1.5] [0.25, 0.75, 1.25, 1.75] 0.0\n0.0 0.625",
          "[0.5, 1.5] [0.25, 0.75, 1.25, 1.75] 0.5\n0.25 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Measures on a finite set are dicts of weights. Write <C>rn_derivative(nu, mu)</C> on the points where mu is positive,{" "}
          <C>integrate(f, mu, A)</C> for a dict f and a list of points A, and <C>change_measure(X, p, q)</C> computing{" "}
          <M>{"\\mathbb E_q X"}</M> as a p-expectation weighted by dq/dp.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rn_derivative(nu, mu):
    return {}

def integrate(f, mu, A):
    return 0.0

def change_measure(X, p, q):
    return 0.0
`,
        solution: FINITE,
        tests: [
          { name: "derivative", code: `d = rn_derivative({'x': 0.3, 'y': 0.7}, {'x': 0.6, 'y': 0.4})
assert abs(d['x'] - 0.5) < 1e-12 and abs(d['y'] - 1.75) < 1e-12 and abs(integrate({'x': 2.0}, {'x': 0.25}, ['x']) - 0.5) < 1e-12` },
          { name: "change", code: `assert abs(change_measure(lambda x: x, {1: 0.5, 2: 0.5}, {1: 0.25, 2: 0.75}) - 1.75) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a measure on [0, 1] given by F(x) = ν([0, x]), write <C>dyadic_ratios(F, k)</C>, the ratios ν(B)/λ(B) on the 2ᵏ dyadic
          cells; <C>l1_gap(ratios, f, m)</C>, the integral of |step − f| using m midpoints per cell; and{" "}
          <C>importance_estimate(xs, X, ratio)</C>, the average of X(x)·ratio(x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def dyadic_ratios(F, k):
    return []

def l1_gap(ratios, f, m=64):
    return 0.0

def importance_estimate(xs, X, ratio):
    return 0.0
`,
        solution: RATIOS,
        tests: [
          { name: "ratios", code: `r = dyadic_ratios(lambda x: x ** 3, 1)
assert len(r) == 2 and abs(r[0] - 0.25) < 1e-12 and abs(r[1] - 1.75) < 1e-12` },
          { name: "gap", code: `assert abs(l1_gap([1.0, 1.0], lambda x: 2 * x) - 0.5) < 1e-9 and abs(l1_gap([0.5, 1.5], lambda x: 2 * x) - 0.25) < 1e-9
assert abs(importance_estimate([0.1, 0.5, 0.9], lambda x: 1, lambda x: 2 * x) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "chisq",
      rung: "stretch",
      prompt: (
        <p>
          P = N(0, 1) and Q = N(1, 1). Find dQ/dP and compute <M>{"\\mathbb E_P[(dQ/dP)^2]"}</M>, which controls the variance of importance
          sampling. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.7183, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The expected log of a likelihood ratio is KL divergence. With Radon-Nikodym derivatives in hand it can be defined for
        any pair of measures, and its key properties follow from Jensen&apos;s inequality and the chain rule.
      </p>
    </>
  ),
};
