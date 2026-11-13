import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ZigzagViz } from "@/components/viz/ZigzagViz";
import type { LessonContent } from "@/lib/types";

const SD = `import numpy as np

def exact_step(Q, g):
    return float(g @ g) / float(g @ Q @ g)

def steepest(Q, x0, iters):
    x = np.array(x0, dtype=float)
    path = [x.copy()]
    for _ in range(iters):
        g = Q @ x
        if not g.any():
            break
        x = x - exact_step(Q, g) * g
        path.append(x.copy())
    return np.array(path)`;

const PC = `import numpy as np

def best_fixed(Q):
    w = np.linalg.eigvalsh(Q)
    t = 2 / (w[0] + w[-1])
    return float(t), float((w[-1] - w[0]) / (w[-1] + w[0]))

def jacobi_kappa(Q):
    d = 1 / np.sqrt(np.diag(Q))
    P = Q * np.outer(d, d)
    w = np.linalg.eigvalsh(P)
    return float(w[-1] / w[0])`;

export const lesson: LessonContent = {
  id: "m10.5.4",
  minutes: 45,
  links: {
    requires: ["m10.5.3"],
    revisits: ["m10.5.2"],
    foreshadows: ["m10.6.1", "m10.6.3"],
  },

  puzzle: (
    <>
      <p>
        Choose the step size perfectly at every iteration: walk along the negative gradient exactly to the lowest point on
        that line. Surely that beats any fixed step? On a long narrow valley it still takes hundreds of steps, bouncing from
        wall to wall. Why does the best step in the steepest direction make so little progress, and what fixes it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The negative gradient is perpendicular to the level set, which on a stretched ellipse points mostly across the
        valley, not along it toward the minimum. Walking to the lowest point on that line stops where the line touches a
        level set, and there the new gradient is at a right angle to the old one. So the path zigzags. The cure is not a
        cleverer step size but a change of coordinates that makes the level sets round.
      </p>
      <ZigzagViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="fixed step on a quadratic">
        <p>
          Let <M>{"f(x) = \\frac12 x^\\top Qx"}</M> with eigenvalues of Q in [μ, L], μ &gt; 0. Gradient descent{" "}
          <M>{"x_{k+1} = (I - tQ)x_k"}</M> satisfies{" "}
          <M>{"\\|x_k\\| \\leq \\rho(t)^k\\|x_0\\|"}</M> with{" "}
          <M>{"\\rho(t) = \\max(|1 - t\\mu|, |1 - tL|)"}</M>. The best choice <M>{"t = 2/(\\mu + L)"}</M> gives
        </p>
        <MD>{"\\rho = \\frac{L - \\mu}{L + \\mu} = \\frac{\\kappa - 1}{\\kappa + 1}."}</MD>
      </Theorem>
      <Proof>
        <p>
          In the eigenbasis of Q each coordinate is multiplied by <M>{"1 - t\\lambda_i"}</M> per step, and{" "}
          <M>{"|1 - t\\lambda|"}</M> is convex in λ, so its maximum over [μ, L] is at an endpoint. The function{" "}
          <M>{"\\max(|1 - t\\mu|, |1 - tL|)"}</M> of t is smallest where the two are equal with opposite signs,{" "}
          <M>{"1 - t\\mu = tL - 1"}</M>, which gives the stated t and ρ. For large κ,{" "}
          <M>{"\\rho \\approx 1 - 2/\\kappa"}</M>: the number of steps per digit grows linearly in κ.
        </p>
      </Proof>

      <Theorem title="exact line search zigzags">
        <p>
          If <M>{"t_k"}</M> minimises <M>{"\\varphi(t) = f(x_k - t\\nabla f(x_k))"}</M> over t &gt; 0, then{" "}
          <M>{"\\nabla f(x_{k+1})^\\top\\nabla f(x_k) = 0"}</M>. On the quadratic,{" "}
          <M>{"t_k = g^\\top g / g^\\top Qg"}</M> with <M>{"g = Qx_k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule, <M>{"\\varphi'(t) = -\\nabla f(x_k - t\\nabla f(x_k))^\\top\\nabla f(x_k)"}</M>, and{" "}
          <M>{"\\varphi'(t_k) = 0"}</M> at an interior minimiser. On the quadratic,{" "}
          <M>{"\\varphi(t) = f(x_k) - t\\,g^\\top g + \\frac{t^2}{2}g^\\top Qg"}</M>, whose minimiser is the stated t. The
          Kantorovich inequality shows the gap then shrinks by at least the factor{" "}
          <M>{"((\\kappa - 1)/(\\kappa + 1))^2"}</M> per step, with equality from the start (κ, 1) on diag(1, κ): the best step
          in the gradient direction is no faster, in the worst case, than the best fixed step.
        </p>
        <Code>{SD}</Code>
      </Proof>

      <Remark title="preconditioning">
        <p>
          Substituting x = Py turns f(x) into g(y) = f(Py), whose Hessian is <M>{"P^\\top QP"}</M>. Gradient descent on y is
          the update <M>{"x \\leftarrow x - tPP^\\top\\nabla f(x)"}</M>. The ideal choice <M>{"P = Q^{-1/2}"}</M> makes the
          Hessian I, so κ = 1 and one step with t = 1 lands on the minimiser; this is Newton&apos;s method, coming in the next
          chapter. A cheap compromise is diagonal (Jacobi) scaling <M>{"P = \\mathrm{diag}(Q)^{-1/2}"}</M>. In the code,
          two exact-line-search steps on diag(1, 10) from (10, 1) return to the same direction scaled by 0.6694 ={" "}
          (9/11)², the Kantorovich worst case, with successive gradients exactly orthogonal. The matrix with rows (100, 9) and
          (9, 1) has κ ≈ 534.9, and Jacobi scaling, which only rescales the two axes, brings it down to 19.
        </p>
        <Code>{PC}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tbest",
      rung: "check",
      prompt: <p>f(x) = ½xᵀQx with Q = diag(2, 8). What fixed step size minimises the worst-case contraction factor of gradient descent?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "kant",
      rung: "check",
      prompt: <p>For κ = 9, what is the worst-case factor ((κ − 1)/(κ + 1))² by which exact line search shrinks the gap per step?</p>,
      answer: { kind: "numeric", value: 0.64, tolerance: 0.0001 },
    },
    {
      key: "orth",
      rung: "apply",
      prompt: <p>Why does steepest descent with exact line search turn through a right angle at every step?</p>,
      answer: {
        kind: "choice",
        options: [
          "At the best point on the line the directional derivative along the old gradient is zero, and that derivative is the new gradient dotted with the old one",
          "Because the Hessian of a quadratic is symmetric, so its eigenvectors are orthogonal",
          "Because the step size is chosen as 2/(μ + L)",
          "Because the iterates alternate between the two coordinate axes",
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

def exact_step(Q, g):
    return float(g @ g) / float(g @ Q @ g)

def steepest(Q, x0, iters):
    x = np.array(x0, dtype=float)
    path = [x.copy()]
    for _ in range(iters):
        g = Q @ x
        if not g.any():
            break
        x = x - exact_step(Q, g) * g
        path.append(x.copy())
    return np.array(path)

Q = np.diag([1.0, 10.0]); p = steepest(Q, [10.0, 1.0], 6)
g0, g1 = Q @ p[0], Q @ p[1]
print(round(float(g0 @ g1), 10) + 0.0, np.round(p[2], 4).tolist())
f = lambda x: 0.5 * float(x @ Q @ x)
print(round(f(p[1]) / f(p[0]), 4), round(f(p[2]) / f(p[1]), 4), round((9 / 11) ** 2, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 [6.6942, 0.6694]\n0.6694 0.6694 0.6694", "0.0 [6.6942, -0.6694]\n0.6694 0.6694 0.6694", "1.0 [6.6942, 0.6694]\n0.6694 0.6694 0.6694", "0.0 [8.1818, 0.8182]\n0.8182 0.8182 0.6694"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def best_fixed(Q):
    w = np.linalg.eigvalsh(Q)
    t = 2 / (w[0] + w[-1])
    return float(t), float((w[-1] - w[0]) / (w[-1] + w[0]))

def jacobi_kappa(Q):
    d = 1 / np.sqrt(np.diag(Q))
    P = Q * np.outer(d, d)
    w = np.linalg.eigvalsh(P)
    return float(w[-1] / w[0])

t, q = best_fixed(np.diag([1.0, 10.0]))
print(round(t, 4), round(q, 4))
A = np.array([[100.0, 9.0], [9.0, 1.0]])
print(round(float(np.linalg.cond(A)), 1), round(jacobi_kappa(A), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.1818 0.8182\n534.9 19.0", "0.1 0.9\n534.9 19.0", "0.1818 0.6694\n534.9 19.0", "0.1818 0.8182\n534.9 534.9"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>exact_step(Q, g)</C>, the exact line search step along −g for ½xᵀQx, and{" "}
          <C>steepest(Q, x0, iters)</C>, returning the array of iterates of steepest descent with exact line search (stop
          early if the gradient is exactly zero).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def exact_step(Q, g):
    return 1.0

def steepest(Q, x0, iters):
    return np.array([x0], dtype=float)
`,
        solution: SD,
        tests: [
          { name: "orth", code: `Q = np.array([[3.0, 1.0], [1.0, 2.0]]); p = steepest(Q, [2.0, -1.0], 5)
assert p.shape == (6, 2)
for k in range(4):
    assert abs(float((Q @ p[k]) @ (Q @ p[k + 1]))) < 1e-10` },
          { name: "one", code: `p = steepest(np.eye(3) * 2.0, [1.0, 2.0, 3.0], 5)
assert len(p) == 2 and np.allclose(p[-1], 0.0) and abs(exact_step(np.diag([1.0, 4.0]), np.array([1.0, 1.0])) - 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_fixed(Q)</C>, returning the optimal fixed step and its contraction factor as floats, and{" "}
          <C>jacobi_kappa(Q)</C>, the condition number of D⁻¹ᐟ²QD⁻¹ᐟ² where D is the diagonal of Q.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def best_fixed(Q):
    return 0.0, 1.0

def jacobi_kappa(Q):
    return 1.0
`,
        solution: PC,
        tests: [
          { name: "best", code: `t, q = best_fixed(np.diag([2.0, 8.0]))
assert abs(t - 0.2) < 1e-12 and abs(q - 0.6) < 1e-12` },
          { name: "jac", code: `assert abs(jacobi_kappa(np.diag([1.0, 50.0, 7.0])) - 1.0) < 1e-12
assert abs(jacobi_kappa(np.array([[4.0, 2.0], [2.0, 4.0]])) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that steepest descent with exact line search on a differentiable f produces successive gradients that are
          orthogonal, and that on f(x) = ½xᵀQx the exact step is t = gᵀg / gᵀQg with g = Qx.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines φ(t) = f(x − t∇f(x)) and computes φ′(t) = −∇f(x − t∇f(x))ᵀ∇f(x) by the chain rule.",
          "Notes φ′(t*) = 0 at the minimising step, which says the new gradient is orthogonal to the old one.",
          "For the quadratic, expands φ(t) = f(x) − t gᵀg + (t²/2) gᵀQg and solves φ′(t) = 0 to get t = gᵀg / gᵀQg.",
        ],
      },
    },
    {
      key: "norm3",
      rung: "stretch",
      prompt: <p>Gradient descent on ½xᵀQx with Q = diag(1, 9), step t = 2/(μ + L), starting from (1, 1). What is ‖x₃‖?</p>,
      answer: { kind: "numeric", value: 0.724077, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a large condition number makes the gradient point across a narrow valley, why exact line search zigzags at right angles, why the best fixed step still contracts only by (κ − 1)/(κ + 1), and how a change of coordinates can remove the problem.",

  glimpse: (
    <>
      <p>
        Zigzagging wastes effort cancelling earlier steps. The next chapter&apos;s first idea is to remember the previous
        step and keep some of it: momentum, which averages out the back-and-forth and speeds progress along the valley.
      </p>
    </>
  ),
};
