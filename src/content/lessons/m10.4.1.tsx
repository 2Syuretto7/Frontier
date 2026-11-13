import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DualBoundViz } from "@/components/viz/DualBoundViz";
import type { LessonContent } from "@/lib/types";

const LAG = `import numpy as np

def lagrangian(f0, fs, hs, x, lam, nu):
    return float(f0(x) + sum(l * f(x) for l, f in zip(lam, fs)) + sum(v * h(x) for v, h in zip(nu, hs)))

def least_norm_dual(A, b, nu):
    return float(-0.25 * nu @ A @ A.T @ nu - b @ nu)

def least_norm_dual_opt(A, b):
    nu = -2 * np.linalg.solve(A @ A.T, b)
    return nu, least_norm_dual(A, b, nu)`;

const GRID = `import numpy as np

def dual_fn_grid(f0, f1, xs, lam):
    return float(np.min(f0(xs) + lam * f1(xs)))

def best_bound(f0, f1, xs, lams):
    g = np.array([dual_fn_grid(f0, f1, xs, l) for l in lams])
    k = int(np.argmax(g))
    return float(lams[k]), float(g[k])`;

export const lesson: LessonContent = {
  id: "m10.4.1",
  minutes: 50,
  links: {
    requires: ["m10.3.1", "m10.2.4", "m5.5.5"],
    revisits: ["m10.2.3"],
    foreshadows: ["m10.4.2", "m10.4.3"],
  },

  puzzle: (
    <>
      <p>
        You have found a feasible point with cost 1.02 for a constrained minimisation problem. Is it worth searching for
        something better? An upper bound comes free with any feasible point; what you need is a lower bound, a certificate
        that nothing feasible can cost less than, say, 1. Where could such a certificate come from without examining every
        feasible point?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Replace each hard constraint by a price. For a constraint f(x) ≤ 0 with price λ ≥ 0, add λf(x) to the cost: feasible
        points can only get cheaper, since f(x) ≤ 0 there. Now minimise this relaxed cost over all x, ignoring the
        constraints. The answer is no larger than the best feasible cost, so it is a lower bound, and every choice of
        prices gives one. The best prices give the best bound.
      </p>
      <DualBoundViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Lagrangian and dual function">
        <p>
          For the problem of minimising <M>{"f_0(x)"}</M> subject to <M>{"f_i(x) \\leq 0"}</M> (i = 1, …, m) and{" "}
          <M>{"h_j(x) = 0"}</M> (j = 1, …, p), with optimal value p*, the Lagrangian is
        </p>
        <MD>{"L(x, \\lambda, \\nu) = f_0(x) + \\sum_i\\lambda_if_i(x) + \\sum_j\\nu_jh_j(x),"}</MD>
        <p>
          and the dual function is <M>{"g(\\lambda, \\nu) = \\inf_xL(x, \\lambda, \\nu)"}</M>, the infimum over all x, which may
          be −∞. The numbers <M>{"\\lambda_i"}</M> and <M>{"\\nu_j"}</M> are the Lagrange multipliers.
        </p>
      </Definition>

      <Theorem title="the dual function is a concave lower bound">
        <p>
          g is concave, whether or not the problem is convex, and <M>{"g(\\lambda, \\nu) \\leq p^*"}</M> whenever{" "}
          <M>{"\\lambda \\geq 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For each fixed x, <M>{"L(x, \\lambda, \\nu)"}</M> is affine in (λ, ν), and an infimum of affine functions is
          concave. For the bound, let x̃ be feasible. Then <M>{"\\lambda_if_i(\\tilde x) \\leq 0"}</M> because{" "}
          <M>{"\\lambda_i \\geq 0"}</M> and <M>{"f_i(\\tilde x) \\leq 0"}</M>, and <M>{"h_j(\\tilde x) = 0"}</M>, so{" "}
          <M>{"g(\\lambda, \\nu) \\leq L(\\tilde x, \\lambda, \\nu) \\leq f_0(\\tilde x)"}</M>. Taking the infimum over feasible
          x̃ gives the claim.
        </p>
        <Code>{LAG}</Code>
      </Proof>

      <Theorem title="two dual functions">
        <p>
          (a) For minimising <M>{"x^\\top x"}</M> subject to Ax = b,{" "}
          <M>{"g(\\nu) = -\\frac14\\nu^\\top AA^\\top\\nu - b^\\top\\nu"}</M>. (b) For the LP of minimising{" "}
          <M>{"c^\\top x"}</M> subject to Ax = b and x ≥ 0, <M>{"g(\\lambda, \\nu) = -b^\\top\\nu"}</M> if{" "}
          <M>{"c + A^\\top\\nu - \\lambda = 0"}</M>, and −∞ otherwise.
        </p>
      </Theorem>
      <Proof>
        <p>
          (a) <M>{"L = x^\\top x + \\nu^\\top(Ax - b)"}</M> is a convex quadratic in x, minimised where its gradient{" "}
          <M>{"2x + A^\\top\\nu"}</M> vanishes, at <M>{"x = -A^\\top\\nu/2"}</M>; substituting gives the formula. (b) Writing
          x ≥ 0 as −x ≤ 0 with multiplier λ,{" "}
          <M>{"L = (c + A^\\top\\nu - \\lambda)^\\top x - b^\\top\\nu"}</M> is affine in x. An affine function is bounded below
          only when its slope is zero, in which case its value is <M>{"-b^\\top\\nu"}</M>.
        </p>
        <Code>{GRID}</Code>
      </Proof>

      <Remark title="reading the bounds">
        <p>
          The dual problem is to maximise g(λ, ν) subject to λ ≥ 0, a concave maximisation and so a convex problem, even
          when the original is not. In the code, the least-norm problem with x₁ + x₂ + x₃ = 3 has p* = 3 at (1, 1, 1);
          ν = −1 certifies a lower bound of 2.25, and the best multiplier ν = −2 certifies exactly 3. For minimising x²
          subject to x ≥ 1, the grid evaluation of g gives 0.75, 1 and 0 at λ = 1, 2 and 4, and the best is λ = 2 with bound
          1 = p*. The multipliers act as prices for violating constraints; the next lesson asks when the best price closes
          the gap entirely. In terms of conjugates, problems with linear constraints have{" "}
          <M>{"g(\\lambda, \\nu) = -f_0^*(-A^\\top\\nu - G^\\top\\lambda) - b^\\top\\nu - h^\\top\\lambda"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "g3",
      rung: "check",
      prompt: <p>For minimising x² subject to x ≥ 1, the dual function is g(λ) = λ − λ²/4. What lower bound does λ = 3 certify?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "ln",
      rung: "check",
      prompt: <p>For minimising ‖x‖² subject to x₁ + 2x₂ = 5, what is the best lower bound from the dual, bᵀ(AAᵀ)⁻¹b?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is g(λ, ν) ≤ p* for every λ ≥ 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "At any feasible point the multiplier terms are at most zero, so the Lagrangian there is at most the cost, and g is a minimum over even more points",
          "Because the problem is convex",
          "Because g is concave and p* is a minimum",
          "Because the Lagrangian equals the cost at every x",
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

def lagrangian(f0, fs, hs, x, lam, nu):
    return float(f0(x) + sum(l * f(x) for l, f in zip(lam, fs)) + sum(v * h(x) for v, h in zip(nu, hs)))

def least_norm_dual(A, b, nu):
    return float(-0.25 * nu @ A @ A.T @ nu - b @ nu)

def least_norm_dual_opt(A, b):
    nu = -2 * np.linalg.solve(A @ A.T, b)
    return nu, least_norm_dual(A, b, nu)

f0 = lambda x: float(x @ x); h = lambda x: float(x.sum() - 3)
print(lagrangian(f0, [], [h], np.array([1.0, 1.0, 1.0]), [], [5.0]), lagrangian(f0, [], [h], np.array([0.0, 0.0, 0.0]), [], [-2.0]))
A = np.ones((1, 3)); b = np.array([3.0])
print(least_norm_dual(A, b, np.array([-1.0])), least_norm_dual_opt(A, b))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 6.0\n2.25 (array([-2.]), 3.0)", "3.0 6.0\n2.25 (array([2.]), 3.0)", "8.0 6.0\n2.25 (array([-2.]), 3.0)", "3.0 -6.0\n2.25 (array([-2.]), 3.0)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dual_fn_grid(f0, f1, xs, lam):
    return float(np.min(f0(xs) + lam * f1(xs)))

def best_bound(f0, f1, xs, lams):
    g = np.array([dual_fn_grid(f0, f1, xs, l) for l in lams])
    k = int(np.argmax(g))
    return float(lams[k]), float(g[k])

xs = np.linspace(-3, 3, 6001); lams = np.linspace(0, 5, 501)
q = lambda x: x ** 2; c = lambda x: 1 - x
print(round(dual_fn_grid(q, c, xs, 1.0), 4), round(dual_fn_grid(q, c, xs, 2.0), 4), round(dual_fn_grid(q, c, xs, 4.0), 4))
print(best_bound(q, c, xs, lams))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.75 1.0 0.0\n(2.0, 1.0)", "0.75 1.0 0.0\n(4.0, 0.0)", "1.0 1.0 1.0\n(2.0, 1.0)", "0.75 1.0 -1.0\n(2.0, 1.0)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lagrangian(f0, fs, hs, x, lam, nu)</C>, <C>least_norm_dual(A, b, nu)</C>, the dual function of minimising
          xᵀx subject to Ax = b, and <C>least_norm_dual_opt(A, b)</C>, returning the maximising ν and the dual optimal value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lagrangian(f0, fs, hs, x, lam, nu):
    return 0.0

def least_norm_dual(A, b, nu):
    return 0.0

def least_norm_dual_opt(A, b):
    return np.zeros(len(b)), 0.0
`,
        solution: LAG,
        tests: [
          { name: "lag", code: `v = lagrangian(lambda x: float(x[0] ** 2), [lambda x: float(1 - x[0])], [lambda x: float(x[1])], np.array([2.0, 3.0]), [0.5], [2.0])
assert abs(v - (4 - 0.5 + 6)) < 1e-12` },
          { name: "dual", code: `A = np.array([[1.0, 2.0], [0.0, 1.0]]); b = np.array([1.0, 1.0])
nu, d = least_norm_dual_opt(A, b); x = np.linalg.solve(A, b)
assert abs(d - x @ x) < 1e-12 and least_norm_dual(A, b, nu + np.array([0.1, -0.2])) < d` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a one-variable problem with one constraint f1(x) ≤ 0, write <C>dual_fn_grid(f0, f1, xs, lam)</C>, the minimum of
          f0 + λf1 over the grid xs (f0 and f1 act on arrays), and <C>best_bound(f0, f1, xs, lams)</C>, returning the λ in
          lams with the largest dual value and that value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dual_fn_grid(f0, f1, xs, lam):
    return 0.0

def best_bound(f0, f1, xs, lams):
    return 0.0, 0.0
`,
        solution: GRID,
        tests: [
          { name: "grid", code: `xs = np.linspace(-5, 5, 10001)
assert abs(dual_fn_grid(lambda x: (x - 3) ** 2, lambda x: x - 1, xs, 2.0) - 3.0) < 1e-6` },
          { name: "best", code: `xs = np.linspace(-5, 5, 10001); l, v = best_bound(lambda x: (x - 3) ** 2, lambda x: x - 1, xs, np.linspace(0, 10, 1001))
assert abs(l - 4.0) < 1e-9 and abs(v - 4.0) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For the problem of minimising f₀(x) subject to fᵢ(x) ≤ 0 and hⱼ(x) = 0, prove that the dual function g(λ, ν) =
          infₓ L(x, λ, ν) is concave and that g(λ, ν) ≤ p* whenever λ ≥ 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Observes that L(x, λ, ν) is affine in (λ, ν) for each fixed x, so g, a pointwise infimum of affine functions, is concave.",
          "For a feasible x̃ and λ ≥ 0, shows Σλᵢfᵢ(x̃) ≤ 0 and Σνⱼhⱼ(x̃) = 0, hence L(x̃, λ, ν) ≤ f₀(x̃).",
          "Concludes g(λ, ν) ≤ L(x̃, λ, ν) ≤ f₀(x̃) and takes the infimum over feasible x̃ to get g ≤ p*.",
        ],
      },
    },
    {
      key: "lp",
      rung: "stretch",
      prompt: <p>Minimise x₁ + 2x₂ subject to x₁ + x₂ = 1 and x ≥ 0. What is the optimal value of the dual problem, maximising −bᵀν subject to c + Aᵀν ≥ 0?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the Lagrangian prices the constraints, why the dual function is concave and gives a lower bound on the optimal value for every nonnegative multiplier, and how to compute it for a least-norm problem and a linear program.",

  glimpse: (
    <>
      <p>
        The best lower bound from the dual is never above p*, but is it equal? For convex problems that satisfy a mild
        condition it is, and that equality, strong duality, is what makes the dual so useful.
      </p>
    </>
  ),
};
