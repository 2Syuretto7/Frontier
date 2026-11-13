import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RolleTiltViz } from "@/components/viz/RolleTiltViz";
import type { LessonContent } from "@/lib/types";

const MVT = `def slope(f, a, b):
    return (f(b) - f(a)) / (b - a)

def mvt_points(f, df, a, b, n=1000):
    m = slope(f, a, b)
    h = lambda x: df(x) - m
    xs = [a + (b - a) * i / n for i in range(n + 1)]
    out = []
    for u, v in zip(xs, xs[1:]):
        if h(u) * h(v) < 0:
            for _ in range(60):
                w = (u + v) / 2
                u, v = (w, v) if h(u) * h(w) > 0 else (u, w)
            out.append((u + v) / 2)
    return out`;

const LHOP = `def quotients(f, g, c, hs):
    return [f(c + h) / g(c + h) for h in hs]

def deriv_quotients(df, dg, c, hs):
    return [df(c + h) / dg(c + h) for h in hs]`;

export const lesson: LessonContent = {
  id: "m8.6.2",
  minutes: 60,
  links: {
    requires: ["m8.6.1", "m8.5.2"],
    revisits: ["m2.5.1", "m2.5.2"],
    foreshadows: ["m8.6.3", "m8.7.3", "m8.8.2"],
  },

  puzzle: (
    <>
      <p>
        If f′(x) = 0 for every x, is f constant? It seems obvious, but the derivative is a statement about each point
        separately, and constancy is a statement about pairs of points far apart. Something has to connect the local to the
        global, and on a domain like (0, 1) ∪ (2, 3) the claim is false. The bridge is the mean value theorem, and its proof
        rests on the extreme value theorem.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Somewhere between a and b the tangent is parallel to the chord. If the endpoints are level (Rolle), this says some
        tangent is horizontal, which is true at a maximum or minimum inside the interval. The general case is the level case
        tilted.
      </p>
      <RolleTiltViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="interior extremum">
        <p>If f is differentiable at an interior point c of its domain and has a local maximum or minimum there, then f′(c) = 0.</p>
      </Theorem>
      <Proof>
        <p>
          At a maximum, (f(x) − f(c))/(x − c) is ≤ 0 for x slightly above c and ≥ 0 for x slightly below. The two one-sided
          limits both equal f′(c), so f′(c) ≤ 0 and f′(c) ≥ 0.
        </p>
      </Proof>

      <Theorem title="Rolle">
        <p>If f is continuous on [a, b], differentiable on (a, b), and f(a) = f(b), then f′(c) = 0 for some c ∈ (a, b).</p>
      </Theorem>
      <Proof>
        <p>
          By the extreme value theorem f attains a maximum and a minimum on [a, b]. If both occur at endpoints, f is constant
          and any c works. Otherwise one occurs at an interior c, and f′(c) = 0 by the previous theorem.
        </p>
      </Proof>

      <Theorem title="mean value theorem">
        <p>If f is continuous on [a, b] and differentiable on (a, b), then for some c ∈ (a, b)</p>
        <MD>{"f'(c) = \\frac{f(b) - f(a)}{b - a}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let m be the chord slope and <M>{"h(x) = f(x) - m(x - a)"}</M>. Then h(a) = f(a) and h(b) = f(b) − (f(b) − f(a)) = f(a),
          so Rolle gives c with 0 = h′(c) = f′(c) − m. Numerically, the points c are the roots of f′ − m, found by bracketing
          and bisection.
        </p>
        <Code>{MVT}</Code>
      </Proof>

      <Theorem title="consequences on an interval">
        <ol>
          <li>If f′ = 0 on an interval, f is constant there.</li>
          <li>If f′ = g′ on an interval, f − g is constant there.</li>
          <li>If f′ &gt; 0 on an interval, f is strictly increasing there; if |f′| ≤ K, f is K-Lipschitz.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          For x &lt; y in the interval, f(y) − f(x) = f′(c)(y − x) for some c between them, which lies in the interval. Each
          claim reads off from the sign or size of f′(c); for (2) apply (1) to f − g. On (0, 1) ∪ (2, 3) the point c might fall
          in the gap, which is why the theorem needs an interval.
        </p>
      </Proof>

      <Theorem title="Cauchy's mean value theorem">
        <p>
          If f, g are continuous on [a, b] and differentiable on (a, b), there is c ∈ (a, b) with{" "}
          <M>{"(f(b) - f(a))\\,g'(c) = (g(b) - g(a))\\,f'(c)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply Rolle to <M>{"h(x) = (f(b) - f(a))\\,g(x) - (g(b) - g(a))\\,f(x)"}</M>, which has h(a) = f(b)g(a) − g(b)f(a) = h(b).
        </p>
      </Proof>

      <Theorem title="L'Hôpital's rule, 0/0 form">
        <p>
          If f(c) = g(c) = 0, f and g are differentiable near c, g′ ≠ 0 near c (except possibly at c), and{" "}
          <M>{"f'(x)/g'(x) \\to L"}</M> as x → c, then <M>{"f(x)/g(x) \\to L"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For x near c, Cauchy's theorem on [c, x] gives <M>{"t_x"}</M> between c and x with{" "}
          <M>{"f(x)/g(x) = f'(t_x)/g'(t_x)"}</M> (g(x) ≠ 0 by Rolle, since g′ ≠ 0). As x → c, <M>{"t_x \\to c"}</M>, so the right
          side tends to L.
        </p>
      </Proof>

      <Example title="sin x − x over x³">
        <p>
          Two applications of the rule give (cos x − 1)/(3x²) and then −sin x/(6x) → −1/6. The quotients below approach −1/6
          from both forms; the rule says only the limits agree, not the values at each h.
        </p>
        <Code>{LHOP}</Code>
      </Example>

      <Remark title="in optimisation">
        <p>
          The mean value theorem is how a bound on a derivative becomes a bound on a change. Applied to the gradient of an
          L-smooth loss it gives the descent lemma, <M>{"f(y) \\leq f(x) + f'(x)(y - x) + \\tfrac{L}{2}(y - x)^2"}</M>, which is
          the basic inequality behind every convergence proof for gradient descent.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "xi",
      rung: "check",
      prompt: <p>Find the point c of the mean value theorem for x³ on [0, 2]. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.1547, tolerance: 0.0001 },
    },
    {
      key: "lim",
      rung: "check",
      prompt: <p>What is the limit of (sin x − x)/x³ as x → 0? Give four decimal places.</p>,
      answer: { kind: "numeric", value: -0.1667, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: <p>f is differentiable with f′(x) = 0 for every x in (0, 1) ∪ (2, 3). Which statement must be true?</p>,
      answer: {
        kind: "choice",
        options: ["f is constant on (0, 1)", "f is constant on (0, 1) ∪ (2, 3)", "f(0.5) = f(2.5)", "f is identically 0"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def slope(f, a, b):
    return (f(b) - f(a)) / (b - a)

def mvt_points(f, df, a, b, n=1000):
    m = slope(f, a, b)
    h = lambda x: df(x) - m
    xs = [a + (b - a) * i / n for i in range(n + 1)]
    out = []
    for u, v in zip(xs, xs[1:]):
        if h(u) * h(v) < 0:
            for _ in range(60):
                w = (u + v) / 2
                u, v = (w, v) if h(u) * h(w) > 0 else (u, w)
            out.append((u + v) / 2)
    return out

print([round(x, 6) for x in mvt_points(lambda x: x * x * x, lambda x: 3 * x * x, 0, 2)], round(2 / math.sqrt(3), 6))
print([round(x, 4) for x in mvt_points(math.sin, math.cos, 0, 2 * math.pi)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1.154701] 1.154701\n[1.5708, 4.7124]", "[1.154701] 1.154701\n[3.1416]", "[-1.154701, 1.154701] 1.154701\n[1.5708, 4.7124]", "[1.0] 1.154701\n[1.5708, 4.7124]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def quotients(f, g, c, hs):
    return [f(c + h) / g(c + h) for h in hs]

def deriv_quotients(df, dg, c, hs):
    return [df(c + h) / dg(c + h) for h in hs]

f, g = lambda x: math.sin(x) - x, lambda x: x * x * x
print([round(q, 5) for q in quotients(f, g, 0, [0.1, 0.01])])
print([round(q, 5) for q in deriv_quotients(lambda x: math.cos(x) - 1, lambda x: 3 * x * x, 0, [0.1, 0.01])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[-0.16658, -0.16667]\n[-0.16653, -0.16667]", "[-0.16667, -0.16667]\n[-0.16667, -0.16667]", "[-0.16658, -0.16667]\n[-0.16658, -0.16667]", "[0.16658, 0.16667]\n[0.16653, 0.16667]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>slope(f, a, b)</C>, the chord slope, and <C>mvt_points(f, df, a, b, n=1000)</C>: with h = df − slope, scan the
          n equal cells of [a, b], and in each cell (u, v) with h(u)·h(v) &lt; 0 bisect 60 times and record the midpoint. Return
          the list of points.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def slope(f, a, b):
    return 0

def mvt_points(f, df, a, b, n=1000):
    return []
`,
        solution: MVT,
        tests: [
          { name: "square", code: `assert slope(lambda x: x * x, 0, 2) == 2
p = mvt_points(lambda x: x * x, lambda x: 2 * x, 0, 1, 7)
assert len(p) == 1 and abs(p[0] - 0.5) < 1e-12` },
          { name: "cube", code: `p = mvt_points(lambda x: x ** 3, lambda x: 3 * x * x, -1, 1, 7)
assert len(p) == 2 and abs(p[0] + 3 ** -0.5) < 1e-12 and abs(p[1] - 3 ** -0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quotients(f, g, c, hs)</C>, the list of f(c + h)/g(c + h) for h in hs, and{" "}
          <C>deriv_quotients(df, dg, c, hs)</C>, the list of df(c + h)/dg(c + h).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def quotients(f, g, c, hs):
    return []

def deriv_quotients(df, dg, c, hs):
    return []
`,
        solution: LHOP,
        tests: [
          { name: "quotients", code: `assert quotients(lambda x: x, lambda x: 2 * x, 0, [1, 2]) == [0.5, 0.5]` },
          { name: "derivs", code: `assert deriv_quotients(lambda x: 2 * x, lambda x: 1.0, 1, [0, 1]) == [2.0, 4.0]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Deduce the mean value theorem from Rolle&apos;s theorem.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines an auxiliary function such as h(x) = f(x) − m(x − a), with m the chord slope (f(b) − f(a))/(b − a).",
          "Checks that h is continuous on [a, b], differentiable on (a, b), and h(a) = h(b).",
          "Applies Rolle to get c with h′(c) = 0, i.e. f′(c) = m.",
        ],
      },
    },
    {
      key: "lim2",
      rung: "stretch",
      prompt: <p>What is the limit of (eˣ − 1 − x)/x² as x → 0?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a derivative vanishes at an interior extremum, how Rolle's theorem follows from the extreme value theorem, how tilting gives the mean value theorem, why f′ = 0 implies constant only on an interval, and how Cauchy's version proves L'Hôpital's rule.",

  glimpse: (
    <>
      <p>
        The mean value theorem approximates f(b) by f(a) with an error controlled by f′. Taylor&apos;s theorem, next, approximates
        f(b) by a polynomial with an error controlled by a higher derivative, and its proof is the same tilting trick applied
        once more.
      </p>
    </>
  ),
};
