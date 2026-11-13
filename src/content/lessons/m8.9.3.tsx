import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ContractionViz } from "@/components/viz/ContractionViz";
import type { LessonContent } from "@/lib/types";

const ITER = `def iterate(T, x0, n):
    xs = [x0]
    for _ in range(n):
        xs.append(T(xs[-1]))
    return xs

def apriori_bound(q, d01, n):
    return q ** n / (1 - q) * d01

def steps_needed(q, d01, eps):
    n = 0
    while apriori_bound(q, d01, n) >= eps:
        n += 1
    return n`;

const PICARD = `def picard_step(f, ys, h, y0):
    out = [y0]
    for i in range(1, len(ys)):
        out.append(out[-1] + h * (f(ys[i - 1]) + f(ys[i])) / 2)
    return out

def picard(f, y0, h, n, k):
    ys = [y0] * (n + 1)
    for _ in range(k):
        ys = picard_step(f, ys, h, y0)
    return ys`;

export const lesson: LessonContent = {
  id: "m8.9.3",
  minutes: 60,
  links: {
    requires: ["m8.9.2"],
    revisits: ["m8.5.4", "m8.2.2"],
    foreshadows: ["m8.9.4"],
  },

  puzzle: (
    <>
      <p>
        Press the cosine key on a calculator over and over, starting anywhere. The display settles on 0.739085…, the unique
        solution of cos x = x. Why does the iteration converge, why to the same number from every start, and how many presses
        are needed for six digits? One theorem answers all three, and the same theorem proves that differential equations have
        solutions and that value iteration in reinforcement learning works.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If a map pulls every pair of points closer together by at least a fixed factor q &lt; 1, then two orbits approach each
        other geometrically, and a single orbit has steps shrinking geometrically, so it is Cauchy. In a complete space it
        converges, and the limit can only be a fixed point, of which there is only one.
      </p>
      <ContractionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="contraction">
        <p>A map T: X → X on a metric space is a contraction if for some q &lt; 1</p>
        <MD>{"d(T x, T y) \\leq q\\, d(x, y) \\quad \\text{for all } x, y \\in X."}</MD>
        <p>Equivalently, T is Lipschitz with constant q &lt; 1.</p>
      </Definition>

      <Theorem title="contraction mapping theorem (Banach)">
        <p>
          Let X be a non-empty complete metric space and T a contraction with constant q. Then T has exactly one fixed point
          x*, and for every <M>{"x_0"}</M> the iterates <M>{"x_{n+1} = T x_n"}</M> converge to x* with
        </p>
        <MD>{"d(x_n, x^*) \\leq \\frac{q^n}{1 - q}\\, d(x_1, x_0) \\quad \\text{and} \\quad d(x_n, x^*) \\leq \\frac{q}{1 - q}\\, d(x_n, x_{n-1})."}</MD>
      </Theorem>
      <Proof>
        <p>
          Uniqueness: if Tx = x and Ty = y then d(x, y) ≤ q d(x, y), so d(x, y) = 0. Existence: by induction{" "}
          <M>{"d(x_{k+1}, x_k) \\leq q^k d(x_1, x_0)"}</M>, so for m &gt; n
        </p>
        <MD>{"d(x_m, x_n) \\leq \\sum_{k=n}^{m-1} q^k d(x_1, x_0) \\leq \\frac{q^n}{1 - q} d(x_1, x_0),"}</MD>
        <p>
          which tends to 0: the sequence is Cauchy and converges to some x* by completeness. T is continuous, so{" "}
          <M>{"T x^* = \\lim T x_n = \\lim x_{n+1} = x^*"}</M>. Letting m → ∞ above gives the first bound; applying it with{" "}
          <M>{"x_{n-1}"}</M> as the starting point gives the second.
        </p>
        <Code>{ITER}</Code>
      </Proof>

      <Example title="cos x = x">
        <p>
          cos maps [0, 1] into [cos 1, 1] ⊂ [0, 1], a complete space, and |cos′| = |sin| ≤ sin 1 ≈ 0.84 there, so cos is a
          contraction by the mean value theorem. The fixed point is 0.739085…; near it the contraction factor is sin(0.739) ≈
          0.67, which sets the observed rate.
        </p>
      </Example>

      <Example title="each hypothesis is needed">
        <p>
          x ↦ x/2 on (0, 1] is a contraction with no fixed point: the space is not complete. x ↦ x + 1/x on [1, ∞) satisfies
          d(Tx, Ty) &lt; d(x, y) for x ≠ y but has no fixed point: there is no uniform q &lt; 1. A rotation of the plane is an
          isometry, q = 1, with one fixed point that its other orbits never approach.
        </p>
      </Example>

      <Theorem title="Picard–Lindelöf, in brief">
        <p>
          If f is L-Lipschitz, the problem y′ = f(y), y(0) = y₀ has a unique continuous solution on [0, h] whenever hL &lt; 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Solutions are the fixed points of <M>{"(\\Phi y)(t) = y_0 + \\int_0^t f(y(s))\\,ds"}</M> on C[0, h] with the sup
          metric, which is complete. For two functions,{" "}
          <M>{"|\\Phi y(t) - \\Phi z(t)| \\leq \\int_0^t L|y - z| \\leq hL\\, d_\\infty(y, z)"}</M>, so Φ is a contraction. Iterating
          Φ is Picard iteration; below it is run on a grid with the trapezoid rule for y′ = y, approaching e at t = 1.
        </p>
        <Code>{PICARD}</Code>
      </Proof>

      <Remark title="in reinforcement learning">
        <p>
          The Bellman operator <M>{"(TV)(s) = \\max_a [r(s, a) + \\gamma \\sum_{s'} P(s' \\mid s, a) V(s')]"}</M> is a
          γ-contraction in the sup norm on value functions, because a max of averages cannot stretch sup distances and the
          discount multiplies them by γ &lt; 1. So value iteration converges to the unique optimal value function from any
          start, at rate γⁿ.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "steps",
      rung: "check",
      prompt: <p>With q = 0.5 and d(x₁, x₀) = 1, how many iterations does the a priori bound require for error below 10⁻⁶?</p>,
      answer: { kind: "numeric", value: 21, tolerance: 0.0001 },
    },
    {
      key: "fix",
      rung: "check",
      prompt: <p>What is the fixed point of T(x) = x/3 + 2 on ℝ?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>Why does T(x) = x/2 on (0, 1] have no fixed point?</p>,
      answer: {
        kind: "choice",
        options: [
          "T is a contraction, but (0, 1] is not complete",
          "T is not a contraction",
          "T does not map (0, 1] into itself",
          "Contractions never have fixed points on bounded sets",
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

def iterate(T, x0, n):
    xs = [x0]
    for _ in range(n):
        xs.append(T(xs[-1]))
    return xs

def apriori_bound(q, d01, n):
    return q ** n / (1 - q) * d01

def steps_needed(q, d01, eps):
    n = 0
    while apriori_bound(q, d01, n) >= eps:
        n += 1
    return n

xs = iterate(math.cos, 1.0, 30)
print(len(xs), round(xs[-1], 6), f"{abs(xs[30] - xs[29]):.1e}")
print(steps_needed(0.5, 1.0, 1e-6), apriori_bound(0.5, 1.0, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["31 0.739087 4.7e-06\n21 0.001953125", "30 0.739087 4.7e-06\n21 0.001953125", "31 0.739085 0.0e+00\n21 0.001953125", "31 0.739087 4.7e-06\n20 0.0009765625"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def picard_step(f, ys, h, y0):
    out = [y0]
    for i in range(1, len(ys)):
        out.append(out[-1] + h * (f(ys[i - 1]) + f(ys[i])) / 2)
    return out

def picard(f, y0, h, n, k):
    ys = [y0] * (n + 1)
    for _ in range(k):
        ys = picard_step(f, ys, h, y0)
    return ys

print(round(picard(lambda y: y, 1.0, 0.01, 100, 3)[-1], 6), round(picard(lambda y: y, 1.0, 0.01, 100, 30)[-1], 6))
print(picard_step(lambda y: y, [1.0, 1.0, 1.0], 0.5, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.666675 2.718304\n[1.0, 1.5, 2.0]", "2.718304 2.718304\n[1.0, 1.5, 2.0]", "2.666675 2.718304\n[1.0, 1.5, 2.25]", "2.5 2.718282\n[1.0, 1.5, 2.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iterate(T, x0, n)</C>, the list [x₀, T x₀, …] of length n + 1; <C>apriori_bound(q, d01, n)</C>, returning
          qⁿ d01/(1 − q); and <C>steps_needed(q, d01, eps)</C>, the smallest n ≥ 0 with the bound below eps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def iterate(T, x0, n):
    return [x0]

def apriori_bound(q, d01, n):
    return 0.0

def steps_needed(q, d01, eps):
    return 0
`,
        solution: ITER,
        tests: [
          { name: "iterate", code: `assert iterate(lambda x: x / 2, 8, 3) == [8, 4.0, 2.0, 1.0] and apriori_bound(0.5, 2, 1) == 2.0` },
          { name: "steps", code: `assert steps_needed(0.1, 1, 0.01) == 3 and steps_needed(0.5, 1.0, 1e-6) == 21` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For y′ = f(y), y(0) = y0 on a grid of spacing h, write <C>picard_step(f, ys, h, y0)</C>, returning y0 plus the running
          trapezoid integral of f(ys), and <C>picard(f, y0, h, n, k)</C>, which starts from the constant list [y0]·(n + 1) and
          applies picard_step k times.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def picard_step(f, ys, h, y0):
    return ys

def picard(f, y0, h, n, k):
    return [y0] * (n + 1)
`,
        solution: PICARD,
        tests: [
          { name: "step", code: `assert picard_step(lambda y: 0.0, [5, 5, 5], 1, 2.0) == [2.0, 2.0, 2.0]
assert picard_step(lambda y: 1.0, [0, 0, 0], 0.5, 0.0) == [0.0, 0.5, 1.0]` },
          { name: "picard", code: `import math
assert abs(picard(lambda y: y, 1.0, 0.001, 1000, 40)[-1] - math.e) < 1e-5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Let T be a contraction with constant q &lt; 1. Prove that T has at most one fixed point and that every orbit xₙ₊₁ = Txₙ is a Cauchy sequence.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uniqueness: for fixed points x, y, d(x, y) = d(Tx, Ty) ≤ q d(x, y), forcing d(x, y) = 0.",
          "Shows d(xₖ₊₁, xₖ) ≤ qᵏ d(x₁, x₀) by induction.",
          "Uses the triangle inequality and a geometric sum to get d(xₘ, xₙ) ≤ qⁿ d(x₁, x₀)/(1 − q) → 0, so the orbit is Cauchy.",
        ],
      },
    },
    {
      key: "post",
      rung: "stretch",
      prompt: <p>With q = 0.8 and d(xₙ, xₙ₋₁) = 0.01, what does the a posteriori bound give for d(xₙ, x*)?</p>,
      answer: { kind: "numeric", value: 0.04, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the statement of the contraction mapping theorem, the proof that iterates are Cauchy and converge to the unique fixed point, the two error bounds, why completeness and a uniform q < 1 are both needed, and how the theorem gives solutions of differential equations.",

  glimpse: (
    <>
      <p>
        The final lesson looks at fixed-point iterations inside algorithms: gradient descent, Newton&apos;s method, value
        iteration and iterative solvers, when each is a contraction, and what that says about their speed.
      </p>
    </>
  ),
};
