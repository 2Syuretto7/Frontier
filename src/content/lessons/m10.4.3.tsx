import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WaterFillViz } from "@/components/viz/WaterFillViz";
import type { LessonContent } from "@/lib/types";

const KKT = `import numpy as np

def kkt_residuals(g0, fs, gs, A, b, x, lam, nu):
    fx = np.array([f(x) for f in fs])
    primal = max(float(np.max(fx, initial=0.0)), float(np.abs(A @ x - b).max(initial=0.0)))
    dual = float(np.max(-lam, initial=0.0))
    comp = float(np.abs(lam * fx).max(initial=0.0))
    stat = g0(x) + sum(l * g(x) for l, g in zip(lam, gs)) + A.T @ nu
    return primal, dual, comp, float(np.linalg.norm(stat))`;

const WF = `import numpy as np

def water_fill(alpha, total, iters=100):
    lo, hi = alpha.min(), alpha.max() + total
    for _ in range(iters):
        level = (lo + hi) / 2
        if np.maximum(0.0, level - alpha).sum() > total:
            hi = level
        else:
            lo = level
    return np.maximum(0.0, (lo + hi) / 2 - alpha), (lo + hi) / 2

def proj_simplex(v):
    u = np.sort(v)[::-1]
    css = np.cumsum(u) - 1
    k = np.nonzero(u - css / np.arange(1, len(v) + 1) > 0)[0][-1]
    return np.maximum(v - css[k] / (k + 1), 0.0)`;

export const lesson: LessonContent = {
  id: "m10.4.3",
  minutes: 55,
  links: {
    requires: ["m10.4.2", "m10.2.2", "m5.5.5"],
    revisits: ["m10.3.1"],
    foreshadows: ["m10.4.4", "m10.8.1"],
  },

  puzzle: (
    <>
      <p>
        A transmitter splits a fixed power budget across channels with different noise floors to maximise total capacity.
        The answer has a striking shape: pour the power like water into a vessel whose floor is the noise profile, so every
        used channel reaches the same level and the noisiest channels stay dry. Where does that rule come from, and how
        would you verify that a proposed allocation is optimal without searching?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At an optimum of a convex problem with strong duality, the primal and dual solutions are locked together by four
        conditions. The point is feasible; the multipliers are nonnegative; each multiplier is zero unless its constraint
        is tight; and the gradient of the cost is balanced exactly by the multiplier-weighted gradients of the constraints.
        These Karush–Kuhn–Tucker conditions turn optimisation into solving equations, and for water-filling they solve in
        closed form.
      </p>
      <WaterFillViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the KKT conditions">
        <p>For differentiable <M>{"f_0, f_i, h_j"}</M>, a point x and multipliers (λ, ν) satisfy the KKT conditions if</p>
        <MD>{"\\begin{aligned} &f_i(x) \\leq 0,\\ h_j(x) = 0 && \\text{(primal feasibility)}\\\\ &\\lambda_i \\geq 0 && \\text{(dual feasibility)}\\\\ &\\lambda_if_i(x) = 0 && \\text{(complementary slackness)}\\\\ &\\nabla f_0(x) + \\textstyle\\sum_i\\lambda_i\\nabla f_i(x) + \\sum_j\\nu_j\\nabla h_j(x) = 0 && \\text{(stationarity).} \\end{aligned}"}</MD>
        <Code>{KKT}</Code>
      </Definition>

      <Theorem title="KKT is necessary under strong duality">
        <p>
          If strong duality holds, x* is primal optimal and (λ*, ν*) is dual optimal, then they satisfy the KKT conditions.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"f_0(x^*) = g(\\lambda^*, \\nu^*) = \\inf_xL(x, \\lambda^*, \\nu^*) \\leq L(x^*, \\lambda^*, \\nu^*) = f_0(x^*) + \\sum_i\\lambda_i^*f_i(x^*) \\leq f_0(x^*)"}</M>,
          using <M>{"h_j(x^*) = 0"}</M> and <M>{"\\lambda_i^*f_i(x^*) \\leq 0"}</M>. So both inequalities are equalities. The
          first says x* minimises the differentiable function <M>{"L(\\cdot, \\lambda^*, \\nu^*)"}</M>, so its gradient vanishes
          there: stationarity. The second says <M>{"\\sum_i\\lambda_i^*f_i(x^*) = 0"}</M>, a sum of nonpositive terms, so each
          is zero: complementary slackness.
        </p>
      </Proof>

      <Theorem title="KKT is sufficient for convex problems">
        <p>
          If the problem is convex (<M>{"f_0, f_i"}</M> convex, <M>{"h_j"}</M> affine) and (x, λ, ν) satisfy the KKT
          conditions, then x is primal optimal, (λ, ν) is dual optimal, and the duality gap is zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          With λ ≥ 0 and <M>{"h_j"}</M> affine, <M>{"L(\\cdot, \\lambda, \\nu)"}</M> is convex, and stationarity says its
          gradient is zero at x, so x minimises it: <M>{"g(\\lambda, \\nu) = L(x, \\lambda, \\nu)"}</M>. By complementary
          slackness and feasibility, <M>{"L(x, \\lambda, \\nu) = f_0(x)"}</M>. So a feasible x and a dual feasible (λ, ν) have
          equal values, and weak duality makes both optimal.
        </p>
      </Proof>

      <Theorem title="water-filling">
        <p>
          Minimising <M>{"-\\sum_i\\log(\\alpha_i + x_i)"}</M> subject to x ≥ 0 and <M>{"\\sum_ix_i = 1"}</M>, with{" "}
          <M>{"\\alpha_i > 0"}</M>, has solution <M>{"x_i = \\max(0, L - \\alpha_i)"}</M>, where the level L is the unique number
          with <M>{"\\sum_i\\max(0, L - \\alpha_i) = 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The problem is convex and the constraints are affine, so by the sufficiency theorem it is enough to exhibit KKT
          multipliers. Stationarity reads <M>{"-1/(\\alpha_i + x_i) - \\lambda_i + \\nu = 0"}</M>. Take ν = 1/L. Where{" "}
          <M>{"x_i = L - \\alpha_i > 0"}</M>, set <M>{"\\lambda_i = 0"}</M>: stationarity holds since{" "}
          <M>{"\\alpha_i + x_i = L"}</M>. Where <M>{"\\alpha_i \\geq L"}</M>, <M>{"x_i = 0"}</M> and{" "}
          <M>{"\\lambda_i = 1/L - 1/\\alpha_i \\geq 0"}</M>, and complementary slackness holds because <M>{"x_i = 0"}</M>. The
          left side of the level equation increases continuously from 0, so L exists and is unique.
        </p>
        <Code>{WF}</Code>
      </Proof>

      <Remark title="using KKT in practice">
        <p>
          The KKT residuals in the code certify that x = (0.5, 0.5) with λ = 1 solves: minimise ‖x‖² subject to x₁ + x₂ ≥ 1,
          while (1, 1) with λ = 0.5 fails complementary slackness and stationarity. Water-filling with floors (0.2, 0.5, 1,
          0.1) reaches level 0.6, giving (0.4, 0.1, 0, 0.5). Euclidean projection onto the probability simplex is another
          KKT computation: sort, find how many coordinates stay positive, subtract a common threshold. It maps (0.5, 0.2,
          0.9) to (0.3, 0, 0.7). Interior-point methods solve the KKT system with complementary slackness relaxed to{" "}
          <M>{"\\lambda_if_i = -t"}</M> and drive t to 0.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "level",
      rung: "check",
      prompt: <p>Water-filling with floors α = (0, 1) and budget 3 (so Σ max(0, L − αᵢ) = 3). What is the level L?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "simplex",
      rung: "check",
      prompt: <p>What is the first coordinate of the Euclidean projection of (1.2, 0.6) onto the probability simplex?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "cs",
      rung: "apply",
      prompt: <p>What does complementary slackness say about an inequality constraint at the optimum?</p>,
      answer: {
        kind: "choice",
        options: [
          "If the constraint is not tight, its multiplier is zero; a positive multiplier means the constraint is tight",
          "Every constraint is tight at the optimum",
          "Every multiplier is positive",
          "The multiplier equals the constraint value",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def kkt_residuals(g0, fs, gs, A, b, x, lam, nu):
    fx = np.array([f(x) for f in fs])
    primal = max(float(np.max(fx, initial=0.0)), float(np.abs(A @ x - b).max(initial=0.0)))
    dual = float(np.max(-lam, initial=0.0))
    comp = float(np.abs(lam * fx).max(initial=0.0))
    stat = g0(x) + sum(l * g(x) for l, g in zip(lam, gs)) + A.T @ nu
    return primal, dual, comp, float(np.linalg.norm(stat))

g0 = lambda x: 2 * x; fs = [lambda x: 1 - x[0] - x[1]]; gs = [lambda x: np.array([-1.0, -1.0])]
A = np.zeros((0, 2)); b = np.zeros(0)
print([round(v, 4) for v in kkt_residuals(g0, fs, gs, A, b, np.array([0.5, 0.5]), np.array([1.0]), np.zeros(0))])
print([round(v, 4) for v in kkt_residuals(g0, fs, gs, A, b, np.array([1.0, 1.0]), np.array([0.5]), np.zeros(0))])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.0, 0.0, 0.0, 0.0]\n[0.0, 0.0, 0.5, 2.1213]", "[0.0, 0.0, 0.0, 0.0]\n[0.0, 0.0, 0.0, 2.1213]", "[0.0, 0.0, 0.0, 1.4142]\n[0.0, 0.0, 0.5, 2.1213]", "[0.0, 0.0, 0.0, 0.0]\n[1.0, 0.0, 0.5, 2.1213]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def water_fill(alpha, total, iters=100):
    lo, hi = alpha.min(), alpha.max() + total
    for _ in range(iters):
        level = (lo + hi) / 2
        if np.maximum(0.0, level - alpha).sum() > total:
            hi = level
        else:
            lo = level
    return np.maximum(0.0, (lo + hi) / 2 - alpha), (lo + hi) / 2

def proj_simplex(v):
    u = np.sort(v)[::-1]
    css = np.cumsum(u) - 1
    k = np.nonzero(u - css / np.arange(1, len(v) + 1) > 0)[0][-1]
    return np.maximum(v - css[k] / (k + 1), 0.0)

x, level = water_fill(np.array([0.2, 0.5, 1.0, 0.1]), 1.0)
print(np.round(x, 4) + 0.0, round(level, 4))
print(np.round(proj_simplex(np.array([0.5, 0.2, 0.9])), 4) + 0.0, proj_simplex(np.array([2.0, 0.0, -1.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.4 0.1 0.  0.5] 0.6\n[0.3 0.  0.7] [1. 0. 0.]", "[0.4 0.1 0.  0.5] 0.6\n[0.3 0.  0.7] [0.6667 0.3333 0.    ]", "[0.25 0.25 0.25 0.25] 0.6\n[0.3 0.  0.7] [1. 0. 0.]", "[0.4 0.1 0.  0.5] 1.0\n[0.3 0.  0.7] [1. 0. 0.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kkt_residuals(g0, fs, gs, A, b, x, lam, nu)</C> for inequality constraints fs with gradients gs and
          equality constraints Ax = b, returning (worst primal violation, worst negative multiplier, largest |λᵢfᵢ(x)|, norm
          of the stationarity residual); use 0 for an empty maximum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kkt_residuals(g0, fs, gs, A, b, x, lam, nu):
    return 0.0, 0.0, 0.0, 0.0
`,
        solution: KKT,
        tests: [
          { name: "eq", code: `A = np.array([[1.0, 2.0]]); b = np.array([5.0])
r = kkt_residuals(lambda x: 2 * x, [], [], A, b, np.array([1.0, 2.0]), np.zeros(0), np.array([-2.0]))
assert np.allclose(r, [0, 0, 0, 0])` },
          { name: "ineq", code: `fs = [lambda x: float(x[0] - 1)]; gs = [lambda x: np.array([1.0, 0.0])]
r = kkt_residuals(lambda x: np.array([2 * (x[0] - 3), 0.0]), fs, gs, np.zeros((0, 2)), np.zeros(0), np.array([2.0, 0.0]), np.array([-1.0]), np.zeros(0))
assert np.allclose(r, [1.0, 1.0, 1.0, 3.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>water_fill(alpha, total, iters=100)</C>, finding the level by bisection and returning (allocation,
          level), and <C>proj_simplex(v)</C>, the Euclidean projection onto {"{"}x ≥ 0, Σx = 1{"}"} by the sorting method.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def water_fill(alpha, total, iters=100):
    return np.zeros(len(alpha)), 0.0

def proj_simplex(v):
    return v
`,
        solution: WF,
        tests: [
          { name: "wf", code: `x, L = water_fill(np.array([0.0, 1.0]), 3.0)
assert abs(L - 2.0) < 1e-9 and np.allclose(x, [2.0, 1.0])` },
          { name: "simplex", code: `rng = np.random.default_rng(0); v = rng.normal(size=6); p = proj_simplex(v)
assert abs(p.sum() - 1) < 1e-12 and np.all(p >= 0)
for _ in range(200):
    q = rng.dirichlet(np.ones(6))
    assert np.linalg.norm(v - p) <= np.linalg.norm(v - q) + 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For a convex problem (f₀, fᵢ convex and differentiable, hⱼ affine), suppose x, λ, ν satisfy the KKT conditions.
          Prove that x is optimal and that the duality gap is zero.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes L(·, λ, ν) is convex because λ ≥ 0 and the hⱼ are affine, and that stationarity makes its gradient zero at x, so x minimises it and g(λ, ν) = L(x, λ, ν).",
          "Uses complementary slackness and hⱼ(x) = 0 to show L(x, λ, ν) = f₀(x).",
          "Concludes g(λ, ν) = f₀(x) with x feasible and λ ≥ 0, so by weak duality x is optimal and the gap is zero.",
        ],
      },
    },
    {
      key: "lam",
      rung: "stretch",
      prompt: <p>Minimise x₁² + x₂² subject to x₁ + 2x₂ ≥ 5. What is the optimal multiplier λ?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the four KKT conditions, why they must hold at an optimum when strong duality holds, why they are enough to certify optimality for a convex problem, and how they produce the water-filling solution.",

  glimpse: (
    <>
      <p>
        The optimal multipliers are more than a certificate. Each one measures how fast the optimal value changes when its
        constraint is loosened, which makes them prices in economics and sensitivities in engineering.
      </p>
    </>
  ),
};
