import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PointwiseMaxViz } from "@/components/viz/PointwiseMaxViz";
import type { LessonContent } from "@/lib/types";

const SUP = `import numpy as np

def max_eig_by_sup(X, trials=20000, seed=0):
    rng = np.random.default_rng(seed)
    V = rng.normal(size=(trials, X.shape[0]))
    V /= np.linalg.norm(V, axis=1, keepdims=True)
    return float(np.einsum("ij,jk,ik->i", V, X, V).max())

def top_r_sum(x, r):
    return float(np.sort(x)[-r:].sum())

def hinge_total(w, X, y):
    return float(np.maximum(0.0, 1 - y * (X @ w)).sum())`;

const MIN = `import numpy as np

def dist_to_set(proj, x):
    return float(np.linalg.norm(x - proj(x)))

def perspective_fn(f):
    return lambda x, t: t * f(x / t)

def midpoint_gap(f, x, y):
    return float((f(x) + f(y)) / 2 - f((x + y) / 2))`;

export const lesson: LessonContent = {
  id: "m10.2.3",
  minutes: 50,
  links: {
    requires: ["m10.2.2", "m10.1.3"],
    revisits: ["m10.1.2", "l2.3.1"],
    foreshadows: ["m10.2.4", "m10.3.3"],
  },

  puzzle: (
    <>
      <p>
        The largest eigenvalue of a symmetric matrix is a complicated function of its entries: it is a root of a
        polynomial, and it is not even differentiable where eigenvalues collide. Yet λ_max((A + B)/2) never exceeds the
        average of λ_max(A) and λ_max(B). Proving this with derivatives would be painful. Is there a way to see it at a
        glance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most convex functions in practice are assembled from a few simple ones by a few operations that are known to keep
        convexity: adding with nonnegative weights, feeding in an affine map, taking a maximum, and minimising out some
        variables. The largest eigenvalue is a maximum of linear functions, vᵀXv over unit vectors v, and a maximum of
        lines can only bend upwards.
      </p>
      <PointwiseMaxViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="sums, affine maps and maxima">
        <p>
          (a) If <M>{"f_1, \\dots, f_k"}</M> are convex and <M>{"w_i \\geq 0"}</M>, <M>{"\\sum_i w_if_i"}</M> is convex. (b)
          If f is convex, so is <M>{"g(x) = f(Ax + b)"}</M>. (c) If <M>{"f(\\cdot, y)"}</M> is convex for every y in an
          arbitrary index set, <M>{"g(x) = \\sup_y f(x, y)"}</M> is convex.
        </p>
      </Theorem>
      <Proof>
        <p>
          (a) Add the defining inequalities with weights <M>{"w_i"}</M>. (b) The map <M>{"x \\mapsto Ax + b"}</M> sends{" "}
          <M>{"\\theta x + (1 - \\theta)y"}</M> to the same combination of the images, then apply convexity of f. (c) The
          epigraph of g is the intersection over y of the epigraphs of <M>{"f(\\cdot, y)"}</M>, since{" "}
          <M>{"g(x) \\leq t"}</M> exactly when <M>{"f(x, y) \\leq t"}</M> for all y, and intersections of convex sets are
          convex.
        </p>
        <Code>{SUP}</Code>
      </Proof>
      <p>
        So <M>{"\\lambda_{\\max}(X) = \\sup_{\\lVert v\\rVert = 1} v^\\top Xv"}</M>, a supremum of linear functions of X, is
        convex; so is the sum of the r largest entries of x, a maximum of the linear functions{" "}
        <M>{"\\sum_{i \\in S}x_i"}</M> over sets S of size r; and the hinge loss{" "}
        <M>{"\\sum_n\\max(0, 1 - y_nw^\\top x_n)"}</M> is a sum of maxima of affine functions of w.
      </p>

      <Theorem title="composition">
        <p>
          If g is convex and h is convex and nondecreasing on ℝ, then <M>{"h(g(x))"}</M> is convex. If g is concave and h is
          convex and nonincreasing, <M>{"h(g(x))"}</M> is convex too.
        </p>
      </Theorem>
      <Proof>
        <p>
          For the first case,{" "}
          <M>{"h(g(\\theta x + (1 - \\theta)y)) \\leq h(\\theta g(x) + (1 - \\theta)g(y)) \\leq \\theta h(g(x)) + (1 - \\theta)h(g(y))"}</M>,
          the first step because g is convex and h nondecreasing, the second because h is convex. The second case is the
          same with the first inequality reversed inside g and then reversed again by h.
        </p>
      </Proof>

      <Theorem title="partial minimisation and the perspective">
        <p>
          (a) If f(x, y) is jointly convex and C is a convex set, <M>{"g(x) = \\inf_{y \\in C}f(x, y)"}</M> is convex where it
          is finite. (b) If f is convex, its perspective <M>{"g(x, t) = tf(x/t)"}</M> is convex for t &gt; 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          (a) Given x₁, x₂ and ε &gt; 0, pick <M>{"y_i \\in C"}</M> with <M>{"f(x_i, y_i) \\leq g(x_i) + \\varepsilon"}</M>.
          The point <M>{"\\theta y_1 + (1 - \\theta)y_2"}</M> is in C, so{" "}
          <M>{"g(\\theta x_1 + (1 - \\theta)x_2) \\leq f(\\theta x_1 + (1 - \\theta)x_2, \\theta y_1 + (1 - \\theta)y_2) \\leq \\theta g(x_1) + (1 - \\theta)g(x_2) + \\varepsilon"}</M>,
          and ε was arbitrary. (b) <M>{"(x, t, s) \\in \\mathrm{epi}\\,g"}</M> exactly when{" "}
          <M>{"f(x/t) \\leq s/t"}</M>, that is when <M>{"(x/t, s/t) \\in \\mathrm{epi}\\,f"}</M>. So the epigraph of g, as a
          set of points (x, s, t), is the preimage of the convex set epi f under the perspective map, and the preimage of a
          convex set under a perspective map is convex by the same segment argument as for images.
        </p>
        <Code>{MIN}</Code>
      </Proof>

      <Remark title="examples in the code">
        <p>
          The distance to a convex set C is the partial minimum of the jointly convex <M>{"\\lVert x - y\\rVert"}</M> over y
          in C, so it is convex; in the code, the distance to the unit box passes the midpoint test with gap 1.4571. The
          perspective of <M>{"\\lVert x\\rVert^2"}</M> is the quadratic-over-linear function{" "}
          <M>{"\\lVert x\\rVert^2/t"}</M>, convex on t &gt; 0. The largest eigenvalue of [[2, 1], [1, 2]] is 3, and the
          supremum of vᵀAv over 20000 random unit vectors reaches 3.0. Composition rules explain why{" "}
          <M>{"e^{g(x)}"}</M> is convex for convex g, and why <M>{"-\\log(-g(x))"}</M>, the logarithmic barrier, is convex
          where g is convex and negative. A pointwise minimum of convex functions is usually not convex, as the viz shows.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "topr",
      rung: "check",
      prompt: <p>What is the sum of the 3 largest entries of (4, −2, 7, 1, 3)?</p>,
      answer: { kind: "numeric", value: 14, tolerance: 0 },
    },
    {
      key: "lmax",
      rung: "check",
      prompt: <p>What is λ_max of [[3, 2], [2, 0]]?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "comp",
      rung: "apply",
      prompt: <p>g(x) is convex and takes negative values on a set. Which function is guaranteed convex there?</p>,
      answer: {
        kind: "choice",
        options: ["−log(−g(x))", "log(−g(x))", "−g(x)²", "1/g(x)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def max_eig_by_sup(X, trials=20000, seed=0):
    rng = np.random.default_rng(seed)
    V = rng.normal(size=(trials, X.shape[0]))
    V /= np.linalg.norm(V, axis=1, keepdims=True)
    return float(np.einsum("ij,jk,ik->i", V, X, V).max())

def top_r_sum(x, r):
    return float(np.sort(x)[-r:].sum())

def hinge_total(w, X, y):
    return float(np.maximum(0.0, 1 - y * (X @ w)).sum())

max_eig = lambda X: float(np.linalg.eigvalsh(X)[-1])
A = np.array([[2.0, 1.0], [1.0, 2.0]]); B = np.array([[0.0, 0.0], [0.0, 4.0]])
print(max_eig(A), round(max_eig_by_sup(A), 3), max_eig((A + B) / 2) <= (max_eig(A) + max_eig(B)) / 2)
print(top_r_sum(np.array([3.0, -1.0, 5.0, 2.0]), 2), top_r_sum(np.array([3.0, -1.0, 5.0, 2.0]), 4))
X = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, -1.0]]); y = np.array([1.0, 1.0, -1.0])
print(hinge_total(np.zeros(2), X, y), hinge_total(np.array([2.0, 0.5]), X, y))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 3.0 True\n8.0 9.0\n3.0 0.5", "3.0 3.0 False\n8.0 9.0\n3.0 0.5", "3.0 3.0 True\n7.0 9.0\n3.0 0.5", "3.0 3.0 True\n8.0 9.0\n0.0 0.5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dist_to_set(proj, x):
    return float(np.linalg.norm(x - proj(x)))

def perspective_fn(f):
    return lambda x, t: t * f(x / t)

def midpoint_gap(f, x, y):
    return float((f(x) + f(y)) / 2 - f((x + y) / 2))

box = lambda x: np.clip(x, 0.0, 1.0)
d = lambda x: dist_to_set(box, x)
print(round(d(np.array([3.0, 0.5])), 4), round(midpoint_gap(d, np.array([3.0, 0.5]), np.array([-1.0, 2.0])), 4))
g = perspective_fn(lambda x: float(x @ x))
print(g(np.array([2.0, 0.0]), 4.0), round(midpoint_gap(lambda z: g(z[:2], z[2]), np.array([1.0, 0.0, 1.0]), np.array([0.0, 1.0, 3.0])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.0 1.4571\n1.0 0.4167", "2.0 -1.4571\n1.0 0.4167", "2.0 1.4571\n4.0 0.4167", "2.0616 1.4571\n1.0 0.4167"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_eig_by_sup(X, trials=20000, seed=0)</C>, the largest vᵀXv over random unit vectors v (normalised
          standard normals), <C>top_r_sum(x, r)</C> and <C>hinge_total(w, X, y)</C>, the sum of max(0, 1 −
          yₙwᵀxₙ).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def max_eig_by_sup(X, trials=20000, seed=0):
    return 0.0

def top_r_sum(x, r):
    return 0.0

def hinge_total(w, X, y):
    return 0.0
`,
        solution: SUP,
        tests: [
          { name: "eig", code: `X = np.array([[3.0, 2.0], [2.0, 0.0]])
assert 3.99 < max_eig_by_sup(X) <= 4.0 + 1e-12 and 0.99 < max_eig_by_sup(-X) <= 1.0 + 1e-12` },
          { name: "sums", code: `assert top_r_sum(np.array([4.0, -2.0, 7.0, 1.0, 3.0]), 3) == 14.0
assert hinge_total(np.array([1.0, -1.0]), np.array([[1.0, 0.0], [0.0, 1.0]]), np.array([1.0, 1.0])) == 2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dist_to_set(proj, x)</C>, <C>perspective_fn(f)</C>, returning the function (x, t) ↦ t·f(x/t), and{" "}
          <C>midpoint_gap(f, x, y)</C>, returning (f(x) + f(y))/2 − f((x + y)/2).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dist_to_set(proj, x):
    return 0.0

def perspective_fn(f):
    return f

def midpoint_gap(f, x, y):
    return 0.0
`,
        solution: MIN,
        tests: [
          { name: "dist", code: `ball = lambda x: x if np.linalg.norm(x) <= 1 else x / np.linalg.norm(x)
assert abs(dist_to_set(ball, np.array([3.0, 4.0])) - 4.0) < 1e-12 and dist_to_set(ball, np.array([0.1, 0.2])) == 0.0` },
          { name: "persp", code: `g = perspective_fn(lambda x: float(-np.log(x).sum()))
assert abs(g(np.array([2.0]), 2.0) - 0.0) < 1e-12 and abs(g(np.array([1.0]), 2.0) - 2 * np.log(2)) < 1e-12
assert abs(midpoint_gap(np.exp, 0.0, 2.0) - ((1 + np.e ** 2) / 2 - np.e)) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let f(x, y) be convex in x for each y in an index set Y, and g(x) = sup over y in Y of f(x, y), assumed finite.
          Prove that g is convex, and deduce that λ_max(X) is a convex function of the symmetric matrix X.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows f(θx₁ + (1 − θ)x₂, y) ≤ θ f(x₁, y) + (1 − θ) f(x₂, y) ≤ θ g(x₁) + (1 − θ) g(x₂) for each y (or argues via intersection of epigraphs).",
          "Takes the supremum over y on the left to conclude g is convex.",
          "Writes λ_max(X) = sup over unit v of vᵀXv, a supremum of functions linear in X, and concludes it is convex.",
        ],
      },
    },
    {
      key: "dist",
      rung: "stretch",
      prompt: <p>What is the distance from (3, 0.5, −2) to the box [0, 1]³? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.8284, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the operations that preserve convexity of functions (nonnegative sums, affine composition, pointwise suprema, composition rules, partial minimisation and the perspective), and use them to show that the largest eigenvalue, the hinge loss and the distance to a convex set are convex.",

  glimpse: (
    <>
      <p>
        Every convex function is a supremum of affine functions. Recording which affine functions lie below it, slope by
        slope, gives a new function, the convex conjugate, which turns out to be the key to duality.
      </p>
    </>
  ),
};
