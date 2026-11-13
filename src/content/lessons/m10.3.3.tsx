import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { L1LineFitViz } from "@/components/viz/L1LineFitViz";
import type { LessonContent } from "@/lib/types";

const L1 = `import itertools
import numpy as np

def l1_fit(X, y):
    best, best_w = np.inf, None
    for S in itertools.combinations(range(len(y)), X.shape[1]):
        S = list(S)
        if abs(np.linalg.det(X[S])) < 1e-12:
            continue
        w = np.linalg.solve(X[S], y[S])
        val = np.abs(X @ w - y).sum()
        if val < best - 1e-12:
            best, best_w = val, w
    return best_w, float(best)

def lp_form_value(X, y, w, t):
    r = X @ w - y
    return float(t.sum()) if np.all(-t <= r + 1e-12) and np.all(r <= t + 1e-12) else np.inf`;

const CHANGE = `import numpy as np

def log_posynomial(c, E, z):
    return float(np.log(c @ np.exp(E @ z)))

def charnes_cooper(c, d, e, f, x):
    s = e @ x + f
    assert s > 0
    y, z = x / s, 1 / s
    return y, z, float(c @ y + d * z)`;

export const lesson: LessonContent = {
  id: "m10.3.3",
  minutes: 50,
  links: {
    requires: ["m10.3.1", "m10.2.3"],
    revisits: ["m10.3.2", "m5.4.4"],
    foreshadows: ["m10.4.1", "m10.7.3"],
  },

  puzzle: (
    <>
      <p>
        Fitting a line by minimising the sum of absolute errors is robust to outliers, but the objective has kinks
        everywhere and no derivative at the optimum. A circuit designer wants to minimise a delay that is a sum of products
        of powers of the gate sizes, a function that is not convex at all. Both problems are routinely solved by convex
        optimisation software. How do they get there?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two problems are equivalent if solving one tells you the solution of the other. Adding variables can straighten
        out kinks: an absolute value becomes a new variable that must exceed both the residual and its negative. Changing
        variables can expose hidden convexity: in log coordinates, products of powers become sums, and the delay becomes a
        log-sum-exp. Recognising these moves is most of the art of using convex solvers.
      </p>
      <L1LineFitViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the epigraph form">
        <p>
          Minimising <M>{"f_0(x)"}</M> over a set C is equivalent to minimising t over pairs (x, t) with x in C and{" "}
          <M>{"f_0(x) \\leq t"}</M>: (x*, t*) is optimal for the second problem exactly when x* is optimal for the first and{" "}
          <M>{"t^* = f_0(x^*)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For any feasible (x, t), <M>{"t \\geq f_0(x) \\geq p^*"}</M>, the optimal value of the first problem, and the pair{" "}
          <M>{"(x, f_0(x))"}</M> is feasible, so the two optimal values agree. If (x*, t*) is optimal then{" "}
          <M>{"p^* = t^* \\geq f_0(x^*) \\geq p^*"}</M>, forcing equality and optimality of x*; the converse is immediate. The
          objective is now linear, and for convex f₀ the new constraint is convex.
        </p>
      </Proof>

      <Theorem title="absolute values as linear programs">
        <p>
          Minimising <M>{"\\sum_i\\lvert a_i^\\top w - y_i\\rvert"}</M> over w is equivalent to the LP: minimise{" "}
          <M>{"\\sum_it_i"}</M> subject to <M>{"-t_i \\leq a_i^\\top w - y_i \\leq t_i"}</M>. Likewise{" "}
          <M>{"\\max_i\\lvert a_i^\\top w - y_i\\rvert"}</M> becomes: minimise t subject to{" "}
          <M>{"-t \\leq a_i^\\top w - y_i \\leq t"}</M> for all i.
        </p>
      </Theorem>
      <Proof>
        <p>
          The two inequalities say exactly <M>{"t_i \\geq \\lvert r_i\\rvert"}</M> with <M>{"r_i = a_i^\\top w - y_i"}</M>.
          For fixed w the smallest feasible <M>{"\\sum t_i"}</M> is <M>{"\\sum\\lvert r_i\\rvert"}</M>, attained at{" "}
          <M>{"t_i = \\lvert r_i\\rvert"}</M>, so minimising over (w, t) is minimising the original objective over w. The
          max version is the same with one shared t.
        </p>
        <Code>{L1}</Code>
      </Proof>

      <Theorem title="hidden convexity by a change of variables">
        <p>
          (a) A posynomial <M>{"f(x) = \\sum_kc_k\\prod_jx_j^{a_{kj}}"}</M> with <M>{"c_k > 0"}</M> and x &gt; 0 becomes, with{" "}
          <M>{"x_j = e^{z_j}"}</M>, the function <M>{"\\log f = \\log\\sum_k e^{a_k^\\top z + \\log c_k}"}</M>, which is
          convex in z. (b) A linear-fractional objective <M>{"(c^\\top x + d)/(e^\\top x + f)"}</M> over{" "}
          <M>{"\\{Gx \\leq h,\\ e^\\top x + f > 0\\}"}</M> becomes the LP in (y, z): minimise <M>{"c^\\top y + dz"}</M> subject to{" "}
          <M>{"Gy \\leq hz"}</M>, <M>{"e^\\top y + fz = 1"}</M>, <M>{"z \\geq 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (a) Each monomial is <M>{"c_k e^{a_k^\\top z}"}</M>, and the logarithm of their sum is log-sum-exp composed with an
          affine map, convex by the composition rules. (b) Given feasible x, set{" "}
          <M>{"z = 1/(e^\\top x + f) > 0"}</M> and y = zx: then <M>{"e^\\top y + fz = 1"}</M>, <M>{"Gy \\leq hz"}</M>, and{" "}
          <M>{"c^\\top y + dz"}</M> equals the ratio. Conversely, a feasible (y, z) with z &gt; 0 maps back to x = y/z with
          the same objective; the case z = 0 is a limit of feasible points and does not lower the optimal value when the
          original feasible set is bounded.
        </p>
        <Code>{CHANGE}</Code>
      </Proof>

      <Remark title="in the code">
        <p>
          For five points with an outlier at (4, 10), checking every pair of points finds the ℓ₁ line y = 0.1 + x with total
          error 6.2, through the points (0, 0.1) and (2, 2.1), while least squares gives y = −1.12 + 2.17x, dragged towards
          the outlier. The LP form agrees: with <M>{"t_i = \\lvert r_i\\rvert"}</M> it gives 6.2, shrinking any{" "}
          <M>{"t_i"}</M> makes it infeasible, and enlarging them only costs more. The log-posynomial passes the midpoint
          test, and the Charnes–Cooper transform maps x = (1, 2) to y = (0.25, 0.5), z = 0.25 with the same objective 1.5.
          Other standard moves are slack variables, which turn <M>{"g(x) \\leq 0"}</M> into <M>{"g(x) + s = 0"}</M> with{" "}
          <M>{"s \\geq 0"}</M>, and eliminating equality constraints by writing x = Fz + x₀ with F spanning the null space.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "l1",
      rung: "check",
      prompt: <p>The line y = x is fitted to the points (0, 0), (1, 2) and (2, 2). What is the sum of absolute residuals?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "cc",
      rung: "check",
      prompt: <p>In the Charnes–Cooper transform with e = (1, 1) and f = 2, what is z for x = (2, 0)?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "linf",
      rung: "apply",
      prompt: <p>How do you write min over w of maxᵢ |aᵢᵀw − yᵢ| as a linear program?</p>,
      answer: {
        kind: "choice",
        options: [
          "Minimise t subject to −t ≤ aᵢᵀw − yᵢ ≤ t for every i",
          "Minimise Σtᵢ subject to −tᵢ ≤ aᵢᵀw − yᵢ ≤ tᵢ",
          "Minimise t subject to aᵢᵀw − yᵢ ≤ t for every i",
          "It cannot be written as an LP because the maximum is not differentiable",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import numpy as np

def l1_fit(X, y):
    best, best_w = np.inf, None
    for S in itertools.combinations(range(len(y)), X.shape[1]):
        S = list(S)
        if abs(np.linalg.det(X[S])) < 1e-12:
            continue
        w = np.linalg.solve(X[S], y[S])
        val = np.abs(X @ w - y).sum()
        if val < best - 1e-12:
            best, best_w = val, w
    return best_w, float(best)

def lp_form_value(X, y, w, t):
    r = X @ w - y
    return float(t.sum()) if np.all(-t <= r + 1e-12) and np.all(r <= t + 1e-12) else np.inf

x = np.array([0.0, 1.0, 2.0, 3.0, 4.0]); y = np.array([0.1, 1.0, 2.1, 2.9, 10.0]); X = np.stack([np.ones(5), x], axis=1)
w, val = l1_fit(X, y)
print(np.round(w, 3), round(val, 3), np.round(np.linalg.lstsq(X, y, rcond=None)[0], 3))
r = X @ w - y
print(round(lp_form_value(X, y, w, np.abs(r)), 3), lp_form_value(X, y, w, np.abs(r) - 0.01), round(lp_form_value(X, y, w, np.abs(r) + 1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.1 1. ] 6.2 [-1.12  2.17]\n6.2 inf 11.2", "[0.1 1. ] 6.2 [-1.12  2.17]\n6.2 6.15 11.2", "[-1.12  2.17] 6.2 [0.1 1. ]\n6.2 inf 11.2", "[0.1 1. ] 6.2 [-1.12  2.17]\n6.2 inf 7.2"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def log_posynomial(c, E, z):
    return float(np.log(c @ np.exp(E @ z)))

def charnes_cooper(c, d, e, f, x):
    s = e @ x + f
    assert s > 0
    y, z = x / s, 1 / s
    return y, z, float(c @ y + d * z)

E = np.array([[1.0, -1.0], [0.0, 2.0]]); c = np.array([1.0, 3.0]); z1, z2 = np.array([0.0, 0.0]), np.array([1.0, -1.0])
print(round(log_posynomial(c, E, z1), 4), (log_posynomial(c, E, z1) + log_posynomial(c, E, z2)) / 2 >= log_posynomial(c, E, (z1 + z2) / 2))
yv, zv, val = charnes_cooper(np.array([1.0, 2.0]), 1.0, np.array([1.0, 1.0]), 1.0, np.array([1.0, 2.0]))
print(np.round(yv, 4), zv, round(val, 4), round((1 + 4 + 1) / (1 + 2 + 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.3863 True\n[0.25 0.5 ] 0.25 1.5 1.5", "1.3863 False\n[0.25 0.5 ] 0.25 1.5 1.5", "4.0 True\n[0.25 0.5 ] 0.25 1.5 1.5", "1.3863 True\n[1. 2.] 1.0 6.0 1.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>l1_fit(X, y)</C>, which finds a least-absolute-deviation fit by solving X[S]w = y[S] for every set S of
          as many rows as columns (skipping singular ones) and keeping the best, returning (w, total error), and{" "}
          <C>lp_form_value(X, y, w, t)</C>, returning Σt if (w, t) satisfies the LP constraints and infinity otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools
import numpy as np

def l1_fit(X, y):
    return np.zeros(X.shape[1]), 0.0

def lp_form_value(X, y, w, t):
    return 0.0
`,
        solution: L1,
        tests: [
          { name: "median", code: `X = np.ones((5, 1)); y = np.array([3.0, -1.0, 10.0, 2.0, 4.0])
w, v = l1_fit(X, y)
assert np.allclose(w, [3.0]) and abs(v - (0 + 4 + 7 + 1 + 1)) < 1e-12` },
          { name: "lp", code: `X = np.array([[1.0, 0.0], [1.0, 1.0]]); y = np.array([1.0, 0.0]); w = np.array([0.0, 0.0])
assert lp_form_value(X, y, w, np.array([1.0, 0.0])) == 1.0 and lp_form_value(X, y, w, np.array([0.5, 0.0])) == np.inf` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_posynomial(c, E, z)</C>, the log of Σₖ cₖ exp(eₖᵀz) with rows eₖ of E, and{" "}
          <C>charnes_cooper(c, d, e, f, x)</C>, returning (y, z, cᵀy + dz) for the transform z = 1/(eᵀx + f), y = zx.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_posynomial(c, E, z):
    return 0.0

def charnes_cooper(c, d, e, f, x):
    return x, 1.0, 0.0
`,
        solution: CHANGE,
        tests: [
          { name: "posy", code: `assert abs(log_posynomial(np.array([2.0, 1.0]), np.array([[1.0], [-1.0]]), np.array([0.0])) - np.log(3)) < 1e-12` },
          { name: "cc", code: `c, d, e, f = np.array([3.0, -1.0]), 2.0, np.array([0.5, 0.0]), 1.0
x = np.array([2.0, 5.0]); y, z, v = charnes_cooper(c, d, e, f, x)
assert abs(z - 0.5) < 1e-12 and np.allclose(y, [1.0, 2.5]) and abs(v - (c @ x + d) / (e @ x + f)) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that minimising Σᵢ |aᵢᵀw − yᵢ| over w has the same optimal value as the LP: minimise Σᵢ tᵢ over (w, t)
          subject to −tᵢ ≤ aᵢᵀw − yᵢ ≤ tᵢ, and that w is optimal for the first exactly when (w, t) with tᵢ = |aᵢᵀw − yᵢ| is
          optimal for the second.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the constraints are equivalent to tᵢ ≥ |aᵢᵀw − yᵢ|, so every feasible (w, t) has Σtᵢ ≥ Σ|rᵢ(w)|.",
          "Shows that for each w the choice tᵢ = |rᵢ(w)| is feasible and attains Σ|rᵢ(w)|, so the optimal values agree.",
          "Deduces the correspondence of optimal points in both directions.",
        ],
      },
    },
    {
      key: "gp",
      rung: "stretch",
      prompt: <p>With c = (1, 3), monomial exponent rows (1, −1) and (0, 2), what is log f at z = (1, −1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.0535, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what makes two optimisation problems equivalent, how the epigraph form and auxiliary variables turn absolute values and maxima into linear programs, how a logarithmic change of variables makes geometric programs convex, and how the Charnes–Cooper transform handles a ratio objective.",

  glimpse: (
    <>
      <p>
        Every convex problem comes with a twin, its dual, built from the constraints weighted by multipliers. The next
        chapter constructs it through the Lagrangian and shows how it bounds and certifies the original problem.
      </p>
    </>
  ),
};
