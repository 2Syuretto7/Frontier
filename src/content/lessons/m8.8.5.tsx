import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReluKnotsViz } from "@/components/viz/ReluKnotsViz";
import type { LessonContent } from "@/lib/types";

const RELU = `def relu_fit(f, a, b, n):
    ts = [a + (b - a) * i / n for i in range(n + 1)]
    vs = [f(t) for t in ts]
    s = [(vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]) for i in range(n)]
    terms = [(s[0], ts[0])] + [(s[i] - s[i - 1], ts[i]) for i in range(1, n)]
    return vs[0], terms

def relu_eval(c, terms, x):
    return c + sum(w * max(0.0, x - t) for w, t in terms)`;

const STAIR = `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z)) if z >= 0 else math.exp(z) / (1 + math.exp(z))

def stair_fit(f, a, b, n, lam):
    ts = [a + (b - a) * i / n for i in range(n + 1)]
    jumps = [f(ts[i + 1]) - f(ts[i]) for i in range(n)]
    mids = [(ts[i] + ts[i + 1]) / 2 for i in range(n)]
    return lambda x: f(a) + sum(j * sigmoid(lam * (x - m)) for j, m in zip(jumps, mids))`;

export const lesson: LessonContent = {
  id: "m8.8.5",
  minutes: 60,
  links: {
    requires: ["m8.8.4", "m8.5.3"],
    revisits: ["l3.1.4"],
    foreshadows: ["m8.9.1"],
  },

  puzzle: (
    <>
      <p>
        &ldquo;Neural networks can approximate any function&rdquo; is quoted everywhere, usually without a statement. Which
        functions? Approximate in what sense? With how many units, and does training find them? With the tools of this
        chapter the theorem for one hidden layer on an interval has a short, complete proof, and the proof shows exactly what
        it does and does not promise.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A continuous function on a closed interval is uniformly continuous, so joining its values at closely spaced knots by
        straight lines approximates it uniformly. A piecewise-linear function is a sum of hinges, one per knot, and each
        hinge is a ReLU. So a ReLU network with one hidden unit per knot is the interpolant exactly.
      </p>
      <ReluKnotsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="one-hidden-layer networks">
        <p>For an activation σ, the networks of width n on ℝ are the functions</p>
        <MD>{"N(x) = c + \\sum_{i=1}^n a_i\\, \\sigma(w_i x + b_i)."}</MD>
        <p>
          The family is universal on [a, b] if for every continuous f and ε &gt; 0 some N has{" "}
          <M>{"\\|N - f\\|_\\infty < \\varepsilon"}</M> on [a, b].
        </p>
      </Definition>

      <Theorem title="ReLU networks are universal">
        <p>With σ(z) = max(0, z), one-hidden-layer networks are universal on every [a, b].</p>
      </Theorem>
      <Proof>
        <p>
          Given ε, uniform continuity gives δ with |f(x) − f(y)| &lt; ε when |x − y| &lt; δ. Take knots{" "}
          <M>{"a = t_0 < \\dots < t_n = b"}</M> with spacing below δ and let L be the piecewise-linear interpolant. On each cell
          L(x) lies between <M>{"f(t_i)"}</M> and <M>{"f(t_{i+1})"}</M>, both within ε of f(x), so |L(x) − f(x)| &lt; ε. With{" "}
          <M>{"s_i"}</M> the slope on cell i,
        </p>
        <MD>{"L(x) = f(t_0) + s_0\\,\\mathrm{ReLU}(x - t_0) + \\sum_{i=1}^{n-1} (s_i - s_{i-1})\\,\\mathrm{ReLU}(x - t_i) \\quad (x \\in [a, b]),"}</MD>
        <p>
          because both sides are continuous, agree at a, and have slope <M>{"s_0 + (s_1 - s_0) + \\dots + (s_i - s_{i-1}) = s_i"}</M>{" "}
          on cell i. That is a network of width n.
        </p>
        <Code>{RELU}</Code>
      </Proof>

      <Theorem title="sigmoidal networks are universal">
        <p>
          If σ is continuous with σ(z) → 0 as z → −∞ and σ(z) → 1 as z → ∞, one-hidden-layer σ-networks are universal on [a, b].
        </p>
      </Theorem>
      <Proof>
        <p>
          Approximate f within ε by a staircase <M>{"f(a) + \\sum_i J_i\\, H(x - m_i)"}</M> with jumps{" "}
          <M>{"J_i = f(t_{i+1}) - f(t_i)"}</M> at the cell midpoints <M>{"m_i"}</M>, where H is the unit step; uniform continuity
          makes every |J_i| &lt; ε and the staircase within 2ε of f. Replace each H(x − m_i) by σ(λ(x − m_i)). Away from the
          midpoints these converge uniformly to the steps as λ → ∞; near a midpoint only one term is inaccurate, and it
          contributes at most |J_i|·sup|σ − H| ≤ C ε. So for large λ the network is within a fixed multiple of ε of f.
        </p>
        <Code>{STAIR}</Code>
      </Proof>

      <Theorem title="a corollary of Weierstrass">
        <p>If σ is infinitely differentiable and not a polynomial, one-hidden-layer σ-networks are universal on every [a, b].</p>
      </Theorem>
      <Proof>
        <p>
          Let 𝒩 be the closure of the networks under uniform convergence on [a, b]; it is a vector space. The difference
          quotient <M>{"(\\sigma((w + h)x + b) - \\sigma(wx + b))/h"}</M> is a network and converges uniformly on [a, b] to{" "}
          <M>{"x\\,\\sigma'(wx + b)"}</M>, so that lies in 𝒩; repeating, <M>{"x^k \\sigma^{(k)}(wx + b) \\in \\mathcal{N}"}</M>.
          At w = 0 this is <M>{"x^k \\sigma^{(k)}(b)"}</M>. Since σ is not a polynomial, for each k some b has{" "}
          <M>{"\\sigma^{(k)}(b) \\neq 0"}</M>, so every monomial, hence every polynomial, lies in 𝒩. By the Weierstrass
          theorem 𝒩 contains every continuous function.
        </p>
      </Proof>

      <Remark title="what the theorem does not say">
        <p>
          It is an existence statement on a compact set. For a K-Lipschitz f, the interpolant with n units has error at most
          K(b − a)/(2n), so the width grows like 1/ε; in d input dimensions the analogous constructions need of order{" "}
          <M>{"\\varepsilon^{-d}"}</M> units, which is why depth and structure matter in practice. It says nothing about
          whether gradient descent finds the network, or whether a network fitted to finitely many samples is close to f
          elsewhere; those are questions of optimisation and of generalisation, not of approximation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "units",
      rung: "check",
      prompt: (
        <p>
          The interpolant of a K-Lipschitz function with n equal cells on [a, b] has error at most K(b − a)/(2n). For K = 3 on
          [0, 2], what is the smallest n guaranteeing error at most 0.01?
        </p>
      ),
      answer: { kind: "numeric", value: 300, tolerance: 0.0001 },
    },
    {
      key: "eval",
      rung: "check",
      prompt: <p>Evaluate N(x) = 1 + 2·ReLU(x − 0) − 3·ReLU(x − 1) at x = 2.</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "says",
      rung: "apply",
      prompt: <p>What does the universal approximation theorem for one hidden layer guarantee?</p>,
      answer: {
        kind: "choice",
        options: [
          "For each continuous f on [a, b] and each ε, some finite-width network is within ε of f everywhere on [a, b]",
          "Gradient descent from a random start finds a network within ε of f",
          "The width needed grows only polynomially with the input dimension",
          "A network that fits finitely many samples of f is close to f everywhere",
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

def relu_fit(f, a, b, n):
    ts = [a + (b - a) * i / n for i in range(n + 1)]
    vs = [f(t) for t in ts]
    s = [(vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]) for i in range(n)]
    terms = [(s[0], ts[0])] + [(s[i] - s[i - 1], ts[i]) for i in range(1, n)]
    return vs[0], terms

def relu_eval(c, terms, x):
    return c + sum(w * max(0.0, x - t) for w, t in terms)

f = lambda x: math.sin(3 * x)
c, terms = relu_fit(f, 0, 2, 4)
print(len(terms), round(relu_eval(c, terms, 1.0), 6), round(f(1.0), 6))
grid = [i / 250 for i in range(501)]
print([round(max(abs(relu_eval(*relu_fit(f, 0, 2, n), x) - f(x)) for x in grid), 4) for n in (4, 16, 64)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 0.14112 0.14112\n[0.2317, 0.0175, 0.0011]", "5 0.14112 0.14112\n[0.2317, 0.0175, 0.0011]", "4 0.14112 0.14112\n[0.2317, 0.0579, 0.0145]", "4 0.0 0.14112\n[0.2317, 0.0175, 0.0011]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z)) if z >= 0 else math.exp(z) / (1 + math.exp(z))

def stair_fit(f, a, b, n, lam):
    ts = [a + (b - a) * i / n for i in range(n + 1)]
    jumps = [f(ts[i + 1]) - f(ts[i]) for i in range(n)]
    mids = [(ts[i] + ts[i + 1]) / 2 for i in range(n)]
    return lambda x: f(a) + sum(j * sigmoid(lam * (x - m)) for j, m in zip(jumps, mids))

f = lambda x: math.sin(3 * x)
grid = [i / 250 for i in range(501)]
print(sigmoid(0), sigmoid(-800), sigmoid(800))
print([round(max(abs(stair_fit(f, 0, 2, n, 20 * n)(x) - f(x)) for x in grid), 3) for n in (10, 40, 160)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 0.0 1.0\n[0.229, 0.057, 0.014]", "0.5 0.0 1.0\n[0.229, 0.0175, 0.0011]", "0.0 0.0 1.0\n[0.229, 0.057, 0.014]", "0.5 nan 1.0\n[0.229, 0.057, 0.014]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relu_fit(f, a, b, n)</C>: with knots tᵢ = a + (b − a)i/n and slopes sᵢ on each cell, return (f(a), terms),
          where terms is [(s₀, t₀)] followed by (sᵢ − sᵢ₋₁, tᵢ) for i = 1, …, n − 1. Then write{" "}
          <C>relu_eval(c, terms, x)</C>, returning c + Σ w·max(0, x − t).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def relu_fit(f, a, b, n):
    return f(a), []

def relu_eval(c, terms, x):
    return c
`,
        solution: RELU,
        tests: [
          { name: "fit", code: `c, terms = relu_fit(lambda x: abs(x - 1), 0, 2, 2)
assert c == 1 and terms == [(-1.0, 0.0), (2.0, 1.0)]` },
          { name: "eval", code: `c, terms = relu_fit(lambda x: abs(x - 1), 0, 2, 2)
assert relu_eval(c, terms, 0.5) == 0.5 and relu_eval(c, terms, 2) == 1.0 and relu_eval(1, [(2, 0), (-3, 1)], 2) == 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write a numerically safe <C>sigmoid(z)</C> (no overflow for large |z|) and <C>stair_fit(f, a, b, n, lam)</C>, returning
          the function x ↦ f(a) + Σ Jᵢ·sigmoid(lam(x − mᵢ)), with jumps Jᵢ = f(tᵢ₊₁) − f(tᵢ) and cell midpoints mᵢ for the knots
          tᵢ = a + (b − a)i/n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sigmoid(z):
    return 0.5

def stair_fit(f, a, b, n, lam):
    return lambda x: f(a)
`,
        solution: STAIR,
        tests: [
          { name: "sigmoid", code: `assert sigmoid(0) == 0.5 and abs(sigmoid(2) + sigmoid(-2) - 1) < 1e-12 and sigmoid(-1000) == 0.0 and sigmoid(1000) == 1.0` },
          { name: "stair", code: `g = stair_fit(lambda x: x, 0, 1, 10, 1000)
assert abs(g(0.52) - 0.5) < 1e-9 and abs(g(0.0) - 0.0) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let L be the piecewise-linear interpolant of f at knots t₀ &lt; t₁ &lt; … &lt; tₙ, with slope sᵢ on [tᵢ, tᵢ₊₁]. Prove
          that on [t₀, tₙ], L(x) = f(t₀) + s₀ ReLU(x − t₀) + Σᵢ₌₁ⁿ⁻¹ (sᵢ − sᵢ₋₁) ReLU(x − tᵢ).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes both sides are continuous and piecewise linear on [t₀, tₙ] with possible breaks only at the knots.",
          "Computes the slope of the right side on (tᵢ, tᵢ₊₁) as s₀ + (s₁ − s₀) + … + (sᵢ − sᵢ₋₁) = sᵢ, since exactly the units with knots ≤ tᵢ are active.",
          "Checks both sides equal f(t₀) at t₀ and concludes they agree everywhere (equal value at one point and equal slopes on each cell).",
        ],
      },
    },
    {
      key: "n500",
      rung: "stretch",
      prompt: <p>For a 1-Lipschitz function on [0, 1], how many ReLU units does the interpolant construction need to guarantee error at most 0.001?</p>,
      answer: { kind: "numeric", value: 500, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the statement of universal approximation for one hidden layer, the proof for ReLU through piecewise-linear interpolation, how a smooth non-polynomial activation reaches every polynomial so that Weierstrass applies, and what the theorem leaves unsaid.",

  glimpse: (
    <>
      <p>
        The sup distance used throughout this chapter is one example of a metric on a space of functions. The last chapter
        studies metric spaces in general: distances, completeness, and the contraction mapping theorem.
      </p>
    </>
  ),
};
