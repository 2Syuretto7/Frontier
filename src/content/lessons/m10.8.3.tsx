import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AdmmRhoViz } from "@/components/viz/AdmmRhoViz";
import type { LessonContent } from "@/lib/types";

const AL = `import numpy as np

def admm_lasso(A, b, lam, rho, iters):
    n = A.shape[1]
    x = z = u = np.zeros(n)
    M = np.linalg.inv(A.T @ A + rho * np.eye(n))
    Atb = A.T @ b
    hist = []
    for _ in range(iters):
        x = M @ (Atb + rho * (z - u))
        z_old = z
        v = x + u
        z = np.sign(v) * np.maximum(np.abs(v) - lam / rho, 0.0) + 0.0
        u = u + x - z
        hist.append((np.linalg.norm(x - z), rho * np.linalg.norm(z - z_old)))
    return x, z, hist`;

const AI = `import numpy as np

def admm_intersect(v, proj1, proj2, rho, iters):
    z = proj2(v)
    u = np.zeros_like(v)
    for _ in range(iters):
        x = proj1((v + rho * (z - u)) / (1 + rho))
        z = proj2(x + u)
        u = u + x - z
    return z

def alternate(v, proj1, proj2, iters):
    x = np.array(v, dtype=float)
    for _ in range(iters):
        x = proj2(proj1(x))
    return x`;

export const lesson: LessonContent = {
  id: "m10.8.3",
  minutes: 50,
  links: {
    requires: ["m10.7.2", "m10.4.3", "m10.8.1"],
    revisits: ["m10.7.3", "m10.4.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        Projecting onto a box is trivial, and so is projecting onto a hyperplane. Projecting onto their intersection is not.
        Likewise, a least-squares loss is easy to minimise and the ℓ₁ norm has an easy prox, but their sum needs an
        iterative method. Many large problems are sums of pieces, each simple on its own. Can you give each piece its own
        copy of the variable, solve the easy subproblems separately, and make the copies agree?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Split the variable into x for one piece and z for the other, and add the constraint x = z. Dual ascent would price
        the disagreement with a multiplier; the augmented Lagrangian also adds a quadratic penalty ρ/2 times the squared
        disagreement, which makes the subproblems well behaved. ADMM then alternates: minimise over x, minimise over z, and
        raise the price on whatever disagreement remains. Each step uses only one piece, and the running price is what
        coordinates them.
      </p>
      <AdmmRhoViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ADMM">
        <p>
          For <M>{"\\min f(x) + g(z)"}</M> subject to Ax + Bz = c, with f and g convex, the augmented Lagrangian is
        </p>
        <MD>{"L_\\rho(x, z, y) = f(x) + g(z) + y^\\top(Ax + Bz - c) + \\frac\\rho2\\|Ax + Bz - c\\|^2,"}</MD>
        <p>and ADMM repeats</p>
        <MD>{"x^+ = \\arg\\min_x L_\\rho(x, z, y), \\quad z^+ = \\arg\\min_z L_\\rho(x^+, z, y), \\quad y^+ = y + \\rho(Ax^+ + Bz^+ - c)."}</MD>
        <p>
          In scaled form, with <M>{"u = y/\\rho"}</M>, the updates read{" "}
          <M>{"x^+ = \\arg\\min_x f(x) + \\frac\\rho2\\|Ax + Bz - c + u\\|^2"}</M>, similarly for z, and{" "}
          <M>{"u^+ = u + Ax^+ + Bz^+ - c"}</M>.
        </p>
      </Definition>

      <Theorem title="the dual step keeps the z-update dual feasible">
        <p>
          After each iteration, <M>{"0 \\in \\partial g(z^+) + B^\\top y^+"}</M>, and{" "}
          <M>{"0 \\in \\partial f(x^+) + A^\\top y^+ + s^+"}</M> with the dual residual{" "}
          <M>{"s^+ = \\rho A^\\top B(z - z^+)"}</M>. So if the primal residual{" "}
          <M>{"r^+ = Ax^+ + Bz^+ - c"}</M> and <M>{"s^+"}</M> are both 0, then <M>{"(x^+, z^+, y^+)"}</M> satisfies the KKT
          conditions.
        </p>
      </Theorem>
      <Proof>
        <p>
          The z-update minimiser satisfies <M>{"0 \\in \\partial g(z^+) + B^\\top y + \\rho B^\\top(Ax^+ + Bz^+ - c)"}</M>, and
          the last two terms are <M>{"B^\\top y^+"}</M>. The x-update gives{" "}
          <M>{"0 \\in \\partial f(x^+) + A^\\top y + \\rho A^\\top(Ax^+ + Bz - c)"}</M>; writing{" "}
          <M>{"Bz = Bz^+ + B(z - z^+)"}</M> turns this into the stated condition. With r = 0 and s = 0 these are stationarity
          of the Lagrangian in x and z, together with primal feasibility.
        </p>
        <Code>{AL}</Code>
      </Proof>

      <Theorem title="convergence (stated)">
        <p>
          If f and g are closed proper convex functions and the unaugmented Lagrangian has a saddle point, then for any ρ
          &gt; 0 ADMM gives <M>{"r_k \\to 0"}</M>, <M>{"f(x_k) + g(z_k) \\to p^*"}</M> and <M>{"y_k \\to y^*"}</M>. No smoothness,
          strong convexity or step size is needed; the proof tracks the decrease of{" "}
          <M>{"\\frac1\\rho\\|y_k - y^*\\|^2 + \\rho\\|B(z_k - z^*)\\|^2"}</M>.
        </p>
      </Theorem>

      <Remark title="using it">
        <p>
          For the lasso, take f(x) = ½‖Ax − b‖², g(z) = λ‖z‖₁ and x − z = 0: the x-update is a ridge solve with the fixed
          matrix <M>{"A^\\top A + \\rho I"}</M>, factored once; the z-update is soft thresholding by λ/ρ. For projection onto
          an intersection, put one set in f together with the distance term and the other in g; each update is a single
          projection. Stop when both residuals are small. ADMM is reliable rather than fast: it typically gets to modest
          accuracy in tens of iterations and then slows, and ρ affects the speed. In the code, ADMM solves the lasso of the
          sparsity lesson to (1.3, 0, 0.4); the number of iterations with a residual above 10⁻⁶ is 209, 22, 108 and more
          than 300 for ρ = 0.1, 1, 10, 100. Projecting (1.5, 0.2, −0.4) onto the box [0, 1]³ intersected with the plane
          Σxᵢ = 1, ADMM finds the true projection (1, 0, 0), while simply alternating the two projections stops at (0.9, 0.1,
          0), a feasible point that is not the nearest one.
        </p>
        <Code>{AI}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "u",
      rung: "check",
      prompt: <p>In scaled ADMM with constraint x − z = 0, the current u = 0.5, and the new iterates are x⁺ = 2 and z⁺ = 1.5. What is u⁺?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "z",
      rung: "check",
      prompt: <p>In ADMM for the lasso with λ = 3 and ρ = 2, a coordinate has x⁺ + u = 4. What is its z⁺?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
    {
      key: "need",
      rung: "apply",
      prompt: <p>What does ADMM need in order to be efficient on min f(x) + g(z) subject to x = z?</p>,
      answer: {
        kind: "choice",
        options: [
          "The x-update and z-update, essentially proximal steps for f and g separately, should each be cheap",
          "f + g must be smooth so that a step size can be chosen",
          "f and g must both be strongly convex",
          "The projection onto the feasible set of the combined problem must be cheap",
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

def admm_lasso(A, b, lam, rho, iters):
    n = A.shape[1]
    x = z = u = np.zeros(n)
    M = np.linalg.inv(A.T @ A + rho * np.eye(n))
    Atb = A.T @ b
    hist = []
    for _ in range(iters):
        x = M @ (Atb + rho * (z - u))
        z_old = z
        v = x + u
        z = np.sign(v) * np.maximum(np.abs(v) - lam / rho, 0.0) + 0.0
        u = u + x - z
        hist.append((np.linalg.norm(x - z), rho * np.linalg.norm(z - z_old)))
    return x, z, hist

A = np.array([[1.0, 0.0, 1.0], [0.0, 1.0, 1.0], [1.0, 1.0, 0.0], [0.0, 0.0, 1.0]]); b = np.array([3.0, 1.0, 2.0, 0.5])
x, z, hist = admm_lasso(A, b, 2.0, 1.0, 300)
print(np.round(z, 4).tolist(), max(hist[-1]) < 1e-8)
print([sum(1 for r, s in admm_lasso(A, b, 2.0, rho, 300)[2] if max(r, s) > 1e-6) for rho in [0.1, 1.0, 10.0, 100.0]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.3, 0.0, 0.4] True\n[209, 22, 108, 300]", "[1.3, 0.0, 0.4] True\n[22, 22, 22, 22]", "[1.7, 0.0, 0.6] True\n[209, 22, 108, 300]", "[1.3, 0.0, 0.4] False\n[300, 108, 22, 209]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def admm_intersect(v, proj1, proj2, rho, iters):
    z = proj2(v)
    u = np.zeros_like(v)
    for _ in range(iters):
        x = proj1((v + rho * (z - u)) / (1 + rho))
        z = proj2(x + u)
        u = u + x - z
    return z

def alternate(v, proj1, proj2, iters):
    x = np.array(v, dtype=float)
    for _ in range(iters):
        x = proj2(proj1(x))
    return x

box = lambda x: np.clip(x, 0.0, 1.0); plane = lambda x: x - (x.sum() - 1.0) / len(x)
v = np.array([1.5, 0.2, -0.4])
print(np.round(admm_intersect(v, box, plane, 1.0, 500), 4).tolist(), np.round(alternate(v, box, plane, 500), 4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.0, 0.0, 0.0] [0.9, 0.1, 0.0]", "[1.0, 0.0, 0.0] [1.0, 0.0, 0.0]", "[0.9, 0.1, 0.0] [1.0, 0.0, 0.0]", "[1.0, 0.2, 0.0] [0.9, 0.1, 0.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>admm_lasso(A, b, lam, rho, iters)</C> in scaled form with constraint x − z = 0, starting from x = z = u =
          0, and return x, z and the list of (primal residual ‖x − z‖, dual residual ρ‖z − z_prev‖) pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def admm_lasso(A, b, lam, rho, iters):
    n = A.shape[1]
    return np.zeros(n), np.zeros(n), []
`,
        solution: AL,
        tests: [
          { name: "kkt", code: `rng = np.random.default_rng(9); A = rng.normal(size=(25, 8)); b = rng.normal(size=25)
x, z, h = admm_lasso(A, b, 4.0, 2.0, 500)
c = A.T @ (b - A @ z); on = np.abs(z) > 1e-9
assert len(h) == 500 and np.allclose(x, z, atol=1e-7) and np.allclose(c[on], 4.0 * np.sign(z[on]), atol=1e-5) and np.all(np.abs(c[~on]) <= 4.0 + 1e-5)` },
          { name: "first", code: `x, z, h = admm_lasso(np.eye(2), np.array([3.0, 0.5]), 1.0, 1.0, 1)
assert np.allclose(x, [1.5, 0.25]) and np.allclose(z, [0.5, 0.0]) and np.allclose(h[0], (np.hypot(1.0, 0.25), 0.5))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>admm_intersect(v, proj1, proj2, rho, iters)</C>, ADMM for the projection of v onto the intersection of two
          sets (f = ½‖x − v‖² plus the indicator of the first set, g the indicator of the second, starting from z =
          proj2(v), u = 0, returning z), and <C>alternate(v, proj1, proj2, iters)</C>, which applies proj1 then proj2
          repeatedly.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def admm_intersect(v, proj1, proj2, rho, iters):
    return v

def alternate(v, proj1, proj2, iters):
    return v
`,
        solution: AI,
        tests: [
          { name: "simplex", code: `box = lambda x: np.clip(x, 0.0, 1.0); plane = lambda x: x - (x.sum() - 1.0) / len(x)
z = admm_intersect(np.array([0.9, 0.6, -0.3, 0.2]), box, plane, 1.0, 1000)
assert np.allclose(z, [0.65, 0.35, 0.0, 0.0], atol=1e-6)` },
          { name: "alt", code: `box = lambda x: np.clip(x, 0.0, 1.0); plane = lambda x: x - (x.sum() - 1.0) / len(x)
w = alternate(np.array([1.5, 0.2, -0.4]), box, plane, 300)
assert abs(w.sum() - 1) < 1e-9 and w.min() > -1e-9 and np.allclose(w, [0.9, 0.1, 0.0], atol=1e-6)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Show that after the z-update and the dual update of ADMM, 0 ∈ ∂g(z⁺) + Bᵀy⁺, where y⁺ = y + ρ(Ax⁺ + Bz⁺ − c).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States that z⁺ minimises g(z) + yᵀBz + (ρ/2)‖Ax⁺ + Bz − c‖² (the z-dependent part of the augmented Lagrangian).",
          "Writes the optimality condition 0 ∈ ∂g(z⁺) + Bᵀy + ρBᵀ(Ax⁺ + Bz⁺ − c), justifying the sum rule for a convex function plus a differentiable one.",
          "Recognises Bᵀy + ρBᵀ(Ax⁺ + Bz⁺ − c) = Bᵀy⁺ to conclude.",
        ],
      },
    },
    {
      key: "z2",
      rung: "stretch",
      prompt: (
        <p>
          Scaled ADMM for minimising ½(x − 4)² + ½z² subject to x − z = 0, with ρ = 1 and z = u = 0 initially. What is z after
          two iterations?
        </p>
      ),
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how ADMM splits a problem into two easy pieces with a consensus constraint, what the augmented Lagrangian adds to the ordinary one, why the dual update makes the z-step dual feasible, and how the primal and dual residuals tell you when to stop.",

  glimpse: (
    <>
      <p>
        That completes the toolkit: convex sets and functions, duality, and methods from gradient descent to Newton, from
        subgradients to proximal splitting. Statistical learning, control and signal processing all reduce large parts of
        their work to these problems, and the same ideas reappear there in specialised forms.
      </p>
    </>
  ),
};
