import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LayerCakeViz } from "@/components/viz/LayerCakeViz";
import type { LessonContent } from "@/lib/types";

const SUMS = `import math

def simple_integral(pairs):
    return sum(a * m for a, m in pairs)

def lebesgue_sum(ys, h):
    return sum(math.floor(y / h) * h for y in ys) / len(ys)

def riemann_lower(ys, k):
    m = len(ys) // k
    return sum(min(ys[i * m:(i + 1) * m]) for i in range(k)) / k`;

const FINITE = `def integral(f, w):
    return sum(f[x] * w[x] for x in w)

def layer_cake(f, w):
    total, prev = 0.0, 0.0
    for v in sorted({f[x] for x in w if f[x] > 0}):
        total += (v - prev) * sum(w[x] for x in w if f[x] >= v)
        prev = v
    return total

def markov_bound(f, w, a):
    return integral(f, w) / a`;

export const lesson: LessonContent = {
  id: "m18.2.1",
  minutes: 45,
  links: {
    requires: ["m18.1.4", "m2.6.2"],
    revisits: ["m7.2.3", "m7.4.2"],
    foreshadows: ["m18.2.2", "m18.3.1"],
  },

  puzzle: (
    <>
      <p>
        Expectation is a sum for discrete random variables and an integral for continuous ones, with separate definitions
        and separate proofs of linearity. A variable that is partly discrete and partly continuous needs a third. And the
        indicator of the rationals has no Riemann integral, though the rationals are a set of length zero. Is there one
        integral that covers all of these at once?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Integrate staircases first: a function taking value a on a set of measure m contributes a·m. Then approximate any
        non-negative function from below by staircases and take the best value. Because the steps are level sets of f, it
        does not matter how wild f is in the domain, only how much measure each level occupies. Sums, Riemann integrals and
        expectations all become special cases.
      </p>
      <LayerCakeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the integral of a simple function">
        <p>
          For a simple function <M>{"\\varphi = \\sum_{i=1}^k a_i \\mathbb 1_{A_i} \\ge 0"}</M> with disjoint measurable <M>{"A_i"}</M>, set
        </p>
        <MD>{"\\int \\varphi\\, d\\mu = \\sum_{i=1}^k a_i\\, \\mu(A_i),"}</MD>
        <p>
          with the convention 0 · ∞ = 0 (<C>simple_integral</C>). The value does not depend on how φ is written, since any two
          representations have a common refinement into disjoint pieces, and the integral is linear and monotone on simple
          functions.
        </p>
      </Definition>

      <Definition title="the integral of a non-negative function">
        <p>For measurable f ≥ 0,</p>
        <MD>{"\\int f\\, d\\mu = \\sup\\Big\\{\\int \\varphi\\, d\\mu : 0 \\le \\varphi \\le f,\\ \\varphi \\text{ simple}\\Big\\} \\in [0, \\infty]."}</MD>
        <p>
          A measurable f is integrable if <M>{"\\int |f|\\, d\\mu < \\infty"}</M>, and then{" "}
          <M>{"\\int f = \\int f^+ - \\int f^-"}</M> with <M>{"f^\\pm = \\max(\\pm f, 0)"}</M>. On a probability space,{" "}
          <M>{"\\mathbb E X = \\int X\\, dP"}</M>. On a finite set with weights the integral is the weighted sum (<C>integral</C>).
        </p>
      </Definition>

      <Theorem title="basic properties">
        <p>For integrable f and g:</p>
        <ul>
          <li>linearity: <M>{"\\int (af + bg) = a\\int f + b\\int g"}</M>;</li>
          <li>monotonicity: f ≤ g implies <M>{"\\int f \\le \\int g"}</M>, and <M>{"|\\int f| \\le \\int |f|"}</M>;</li>
          <li>Markov: <M>{"\\mu(|f| \\ge a) \\le \\tfrac1a \\int |f|"}</M> for a &gt; 0;</li>
          <li><M>{"\\int |f| = 0"}</M> if and only if f = 0 almost everywhere, that is, outside a set of measure 0.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          Monotonicity is immediate from the definition, since a simple φ ≤ f is also ≤ g. Markov follows from{" "}
          <M>{"a\\mathbb 1_{\\{|f| \\ge a\\}} \\le |f|"}</M> (m7.4.2, <C>markov_bound</C>). For the last item, if <M>{"\\int |f| = 0"}</M> then by Markov{" "}
          <M>{"\\mu(|f| \\ge 1/n) = 0"}</M> for all n, and the union of these sets is <M>{"\\{f \\ne 0\\}"}</M>. Linearity is easy for simple
          functions; for non-negative functions it needs the monotone convergence theorem of the next lesson, applied to the
          approximations <M>{"\\varphi_n \\uparrow f"}</M> of m18.1.4. The signed case follows by splitting into positive and negative parts.
        </p>
      </Proof>

      <Theorem title="layer cake">
        <p>For measurable f ≥ 0,</p>
        <MD>{"\\int f\\, d\\mu = \\int_0^\\infty \\mu(f > t)\\, dt."}</MD>
      </Theorem>
      <Proof>
        <p>
          For a simple f taking values <M>{"0 < v_1 < \\cdots < v_k"}</M>, the function <M>{"t \\mapsto \\mu(f > t)"}</M> equals{" "}
          <M>{"\\mu(f \\ge v_i)"}</M> on <M>{"[v_{i-1}, v_i)"}</M>, so the right side is <M>{"\\sum_i (v_i - v_{i-1})\\mu(f \\ge v_i)"}</M>, and regrouping by
          value gives <M>{"\\sum_i v_i \\mu(f = v_i)"}</M> (<C>layer_cake</C>). The general case follows by monotone convergence on both
          sides. This is the horizontal slicing of the figure, done exactly; <C>lebesgue_sum</C> is its discretisation.
        </p>
        <Code>{FINITE}</Code>
      </Proof>

      <Theorem title="Riemann integrals are Lebesgue integrals">
        <p>
          If f is bounded and Riemann integrable on [a, b], it is Lebesgue integrable and the two integrals agree.
        </p>
      </Theorem>
      <Proof>
        <p>
          Lower and upper Riemann sums (m2.6.2) are integrals of step functions <M>{"\\ell_n \\le f \\le u_n"}</M> on finer and finer
          partitions (<C>riemann_lower</C>). Their integrals converge to the Riemann integral, so{" "}
          <M>{"\\int (u_n - \\ell_n)\\, d\\lambda \\to 0"}</M>. The limits <M>{"\\ell = \\lim \\ell_n"}</M> and <M>{"u = \\lim u_n"}</M> are measurable with{" "}
          <M>{"\\ell \\le f \\le u"}</M> and <M>{"\\int (u - \\ell) = 0"}</M>, so <M>{"\\ell = f = u"}</M> almost everywhere and f is Lebesgue
          measurable (after completing the σ-algebra), with the same integral.
        </p>
        <Code>{SUMS}</Code>
      </Proof>

      <Example title="the indicator of the rationals">
        <p>
          <M>{"\\mathbb 1_{\\mathbb Q}"}</M> is simple: value 1 on a set of Lebesgue measure 0 and 0 elsewhere. So its Lebesgue integral over
          [0, 1] is 1 · 0 = 0, although every Riemann upper sum is 1 and every lower sum is 0.
        </p>
      </Example>

      <Remark title="one definition of expectation">
        <p>
          For discrete X, the integral against P is a weighted sum; for X with a density p, it equals{" "}
          <M>{"\\int x\\, p(x)\\, dx"}</M>, as m18.4.2 will justify. Linearity of expectation (m7.2.3) is now a single theorem, valid
          for mixtures and for variables with no density at all. The layer-cake formula in probability reads{" "}
          <M>{"\\mathbb E X = \\int_0^\\infty P(X > t)\\, dt"}</M> for X ≥ 0, and more generally{" "}
          <M>{"\\mathbb E X^p = \\int_0^\\infty p\\,t^{p-1} P(X > t)\\, dt"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "simple",
      rung: "check",
      prompt: <p>A simple function equals 3 on a set of measure 0.2, 5 on a disjoint set of measure 0.1, and 0 elsewhere. What is its integral?</p>,
      answer: { kind: "numeric", value: 1.1, tolerance: 0.0001 },
    },
    {
      key: "markov",
      rung: "check",
      prompt: <p>A non-negative function has integral 2. What is the best upper bound Markov&apos;s inequality gives on the measure of the set where it is at least 8?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "rationals",
      rung: "apply",
      prompt: <p>Why is the Lebesgue integral of the indicator of the rationals over [0, 1] equal to 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is a simple function whose only non-zero value sits on a set of Lebesgue measure 0",
          "Its Riemann upper and lower sums agree",
          "The rationals are dense in [0, 1]",
          "Every function that is discontinuous everywhere has integral 0",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def simple_integral(pairs):
    return sum(a * m for a, m in pairs)

def lebesgue_sum(ys, h):
    return sum(math.floor(y / h) * h for y in ys) / len(ys)

def riemann_lower(ys, k):
    m = len(ys) // k
    return sum(min(ys[i * m:(i + 1) * m]) for i in range(k)) / k

print(simple_integral([(2, 0.25), (4, 0.5)]), lebesgue_sum([0.3, 0.9, 1.6, 0.1], 0.5), round(riemann_lower([3, 1, 4, 1, 5, 9], 3), 4))
print(lebesgue_sum([0.7, 0.7], 1.0), riemann_lower([2, 8], 1), simple_integral([]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.5 0.5 2.3333\n0.0 2.0 0",
          "2.5 0.725 2.3333\n0.0 2.0 0",
          "2.5 0.5 1.0\n0.0 2.0 0",
          "2.5 0.5 2.3333\n0.7 5.0 0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def integral(f, w):
    return sum(f[x] * w[x] for x in w)

def layer_cake(f, w):
    total, prev = 0.0, 0.0
    for v in sorted({f[x] for x in w if f[x] > 0}):
        total += (v - prev) * sum(w[x] for x in w if f[x] >= v)
        prev = v
    return total

def markov_bound(f, w, a):
    return integral(f, w) / a

f, w = {'a': 1, 'b': 3, 'c': 0}, {'a': 0.5, 'b': 0.25, 'c': 0.25}; print(integral(f, w), layer_cake(f, w), round(markov_bound(f, w, 3), 4))
print(layer_cake({'x': 2, 'y': 2}, {'x': 0.5, 'y': 0.5}), integral({'x': -1, 'y': 1}, {'x': 0.5, 'y': 0.5}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.25 1.25 0.4167\n2.0 0.0",
          "1.25 1.0 0.4167\n2.0 0.0",
          "1.25 1.25 0.4167\n1.0 0.0",
          "1.25 1.25 0.3333\n2.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>simple_integral(pairs)</C> for a list of (value, measure) pairs, <C>lebesgue_sum(ys, h)</C>, the average of the
          values rounded down to multiples of h (the grid points all carry equal weight), and <C>riemann_lower(ys, k)</C>, which
          splits the grid into k equal blocks and averages the block minima.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def simple_integral(pairs):
    return 0

def lebesgue_sum(ys, h):
    return sum(ys) / len(ys)

def riemann_lower(ys, k):
    return min(ys)
`,
        solution: SUMS,
        tests: [
          { name: "simple", code: `assert simple_integral([(1, 2), (3, 4)]) == 14 and abs(lebesgue_sum([0.26, 0.74, 1.0, 0.24], 0.25) - 0.4375) < 1e-12 and lebesgue_sum([0.5], 1.0) == 0` },
          { name: "riemann", code: `assert riemann_lower([5, 2, 7, 4, 1, 9, 3, 8], 4) == 2.5 and riemann_lower([5, 2, 7, 4, 1, 9, 3, 8], 2) == 1.5 and riemann_lower([6, 6], 2) == 6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          On a finite space with weights <C>w</C>, write <C>integral(f, w)</C>, <C>layer_cake(f, w)</C> computing{" "}
          <M>{"\\int_0^\\infty \\mu(f > t)\\, dt"}</M> for f ≥ 0 by summing over the distinct positive values, and{" "}
          <C>markov_bound(f, w, a)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def integral(f, w):
    return 0.0

def layer_cake(f, w):
    return 0.0

def markov_bound(f, w, a):
    return 1.0
`,
        solution: FINITE,
        tests: [
          { name: "integral", code: `f, w = {1: 4, 2: 1, 3: 2}, {1: 0.25, 2: 0.25, 3: 0.5}
assert integral(f, w) == 2.25 and abs(markov_bound(f, w, 4.5) - 0.5) < 1e-12` },
          { name: "layer cake", code: `f, w = {1: 4, 2: 1, 3: 2}, {1: 0.25, 2: 0.25, 3: 0.5}
assert abs(layer_cake(f, w) - 2.25) < 1e-12 and layer_cake({1: 0, 2: 0}, {1: 1, 2: 1}) == 0 and abs(layer_cake({'a': 7}, {'a': 3}) - 21) < 1e-12` },
        ],
      },
    },
    {
      key: "second",
      rung: "stretch",
      prompt: (
        <p>
          A random variable X ≥ 0 has P(X &gt; t) = (1 + t)⁻⁴ for t ≥ 0. Use the layer-cake formula to find E X². Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The definition by suprema is hard to compute with directly. The next lesson proves the two theorems that make the
        integral usable: limits can be taken inside the integral when the functions increase, or when they are dominated by
        one integrable function.
      </p>
    </>
  ),
};
