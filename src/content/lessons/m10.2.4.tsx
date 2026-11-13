import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ConjugateViz } from "@/components/viz/ConjugateViz";
import type { LessonContent } from "@/lib/types";

const GRID = `import numpy as np

def conj_grid(fvals, xs, ys):
    return np.max(np.outer(ys, xs) - fvals[None, :], axis=1)

def biconj_grid(fvals, xs, ys):
    fstar = conj_grid(fvals, xs, ys)
    return conj_grid(fstar, ys, xs)

def argmax_slope(fvals, xs, y):
    return float(xs[np.argmax(y * xs - fvals)])`;

const FORMULAS = `import numpy as np

def conj_quadratic(Q, y):
    return float(0.5 * y @ np.linalg.solve(Q, y))

def fenchel_young_gap(f, fstar, x, y):
    return float(f(x) + fstar(y) - x @ y)

def dual_norm_inf(y):
    return float(np.abs(y).sum())`;

export const lesson: LessonContent = {
  id: "m10.2.4",
  minutes: 55,
  links: {
    requires: ["m10.2.3", "m10.1.3", "m6.5.1"],
    revisits: ["m10.2.2"],
    foreshadows: ["m10.4.1", "m10.4.2", "m10.7.4"],
  },

  puzzle: (
    <>
      <p>
        A convex curve can be drawn point by point, or it can be drawn as the envelope of its tangent lines: the highest of
        all the lines below it. Recording, for each slope, how high the best line of that slope can sit gives a second
        function that holds exactly the same information. What is this function for familiar examples, and why would
        anyone want it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For a slope y, slide the line of slope y upwards until it touches the graph of f. The conjugate f*(y) is minus the
        intercept of that line, equivalently the largest gap yx − f(x). Steep slopes touch where f is steep, so the
        conjugate trades positions for slopes. Applying the construction twice recovers f when f is convex, and otherwise
        recovers the convex function hidden under it.
      </p>
      <ConjugateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convex conjugate">
        <p>The conjugate of a function f on ℝⁿ is</p>
        <MD>{"f^*(y) = \\sup_x\\big(y^\\top x - f(x)\\big),"}</MD>
        <p>
          possibly +∞. It is convex whatever f is, because it is a supremum of the affine functions{" "}
          <M>{"y \\mapsto y^\\top x - f(x)"}</M>. Directly from the definition comes the Fenchel–Young inequality{" "}
          <M>{"f(x) + f^*(y) \\geq x^\\top y"}</M> for all x and y.
        </p>
        <Code>{GRID}</Code>
      </Definition>

      <Theorem title="differentiable convex functions">
        <p>
          If f is convex and differentiable and <M>{"\\nabla f(x) = y"}</M>, then{" "}
          <M>{"f^*(y) = y^\\top x - f(x)"}</M>, and Fenchel–Young holds with equality. For{" "}
          <M>{"f(x) = \\frac12x^\\top Qx"}</M> with Q positive definite,{" "}
          <M>{"f^*(y) = \\frac12y^\\top Q^{-1}y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The function <M>{"x \\mapsto y^\\top x - f(x)"}</M> is concave, and its gradient{" "}
          <M>{"y - \\nabla f(x)"}</M> vanishes at the given x, so by the first-order condition applied to its negative, x
          is a global maximiser. For the quadratic, <M>{"\\nabla f(x) = Qx = y"}</M> gives <M>{"x = Q^{-1}y"}</M> and{" "}
          <M>{"f^*(y) = y^\\top Q^{-1}y - \\frac12y^\\top Q^{-1}y"}</M>.
        </p>
      </Proof>

      <Theorem title="the conjugate of a norm">
        <p>
          The conjugate of a norm ‖·‖ is the indicator of the unit ball of the dual norm: <M>{"f^*(y) = 0"}</M> if{" "}
          <M>{"\\lVert y\\rVert_* \\leq 1"}</M> and +∞ otherwise.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"\\lVert y\\rVert_* \\leq 1"}</M>, then <M>{"y^\\top x \\leq \\lVert y\\rVert_*\\lVert x\\rVert \\leq \\lVert x\\rVert"}</M>,
          so <M>{"y^\\top x - \\lVert x\\rVert \\leq 0"}</M>, with equality at x = 0. If{" "}
          <M>{"\\lVert y\\rVert_* > 1"}</M>, by definition of the dual norm some x has{" "}
          <M>{"y^\\top x > \\lVert x\\rVert"}</M>, and along tx the gap{" "}
          <M>{"t(y^\\top x - \\lVert x\\rVert)"}</M> grows without bound.
        </p>
        <Code>{FORMULAS}</Code>
      </Proof>

      <Theorem title="the biconjugate">
        <p>
          Always <M>{"f^{**} \\leq f"}</M>, and <M>{"f^{**}"}</M> is the largest closed convex function below f. In
          particular <M>{"f^{**} = f"}</M> when f is convex and closed (its epigraph is closed).
        </p>
      </Theorem>
      <Proof>
        <p>
          By Fenchel–Young, <M>{"x^\\top y - f^*(y) \\leq f(x)"}</M> for every y, and <M>{"f^{**}(x)"}</M> is the supremum of
          the left side over y, so <M>{"f^{**} \\leq f"}</M>. Each <M>{"x \\mapsto x^\\top y - f^*(y)"}</M> is the highest
          affine function of slope y below f, so <M>{"f^{**}"}</M> is the supremum of all affine minorants of f. Any closed
          convex g ≤ f has a closed convex epigraph, which by the separation theorem is the intersection of the
          halfspaces containing it; non-vertical ones are epigraphs of affine minorants of g, hence of f, so g ≤{" "}
          <M>{"f^{**}"}</M>. (Ruling out the vertical halfspaces takes one more separation argument, which we omit.)
        </p>
      </Proof>

      <Remark title="examples and uses">
        <p>
          In the code the grid conjugate of x²/2 reproduces y²/2 at y = −3, …, 3; the conjugate of eˣ at y = 2 is{" "}
          <M>{"2\\log 2 - 2 \\approx -0.6137"}</M>, attained at x = log 2; in general it is y log y − y for y &gt; 0. The
          biconjugate of x⁴ − 2x² is its convex envelope, −1 between −1 and 1 and equal to f outside, so it is −1 at 0 and 8
          at 2. The conjugate of the max-norm is the indicator of the ℓ₁ unit ball. The conjugate of log-sum-exp is the
          negative entropy on the probability simplex. Conjugates turn minimisation problems into dual problems: the next
          chapters use <M>{"f^*"}</M> to write Lagrange duals compactly.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sq",
      rung: "check",
      prompt: <p>For f(x) = x²/2, what is f*(3)?</p>,
      answer: { kind: "numeric", value: 4.5, tolerance: 0.0001 },
    },
    {
      key: "exp",
      rung: "check",
      prompt: <p>For f(x) = eˣ, what is f*(1)?</p>,
      answer: { kind: "numeric", value: -1, tolerance: 0.0001 },
    },
    {
      key: "norm",
      rung: "apply",
      prompt: <p>What is the conjugate of the Euclidean norm f(x) = ‖x‖₂?</p>,
      answer: {
        kind: "choice",
        options: [
          "0 on the closed Euclidean unit ball and +∞ outside it",
          "‖y‖₂ again",
          "½‖y‖₂²",
          "0 on the ℓ∞ unit ball and +∞ outside it",
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

def conj_grid(fvals, xs, ys):
    return np.max(np.outer(ys, xs) - fvals[None, :], axis=1)

def biconj_grid(fvals, xs, ys):
    fstar = conj_grid(fvals, xs, ys)
    return conj_grid(fstar, ys, xs)

def argmax_slope(fvals, xs, y):
    return float(xs[np.argmax(y * xs - fvals)])

xs = np.linspace(-4, 4, 8001); ys = np.linspace(-3, 3, 7)
print(np.round(conj_grid(xs ** 2 / 2, xs, ys), 3) + 0.0)
print(round(float(conj_grid(np.exp(xs), xs, np.array([2.0]))[0]), 4), round(argmax_slope(np.exp(xs), xs, 2.0), 3))
w = xs ** 4 - 2 * xs ** 2; yg = np.linspace(-40, 40, 8001)
env = biconj_grid(w, xs, yg)
print(round(float(env[4000]), 3), round(float(w[4000]), 3), round(float(env[6000]), 3), round(float(w[6000]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[4.5 2.  0.5 0.  0.5 2.  4.5]\n-0.6137 0.693\n-1.0 0.0 8.0 8.0", "[4.5 2.  0.5 0.  0.5 2.  4.5]\n-0.6137 0.693\n0.0 0.0 8.0 8.0", "[9.  4.  1.  0.  1.  4.  9. ]\n-0.6137 0.693\n-1.0 0.0 8.0 8.0", "[4.5 2.  0.5 0.  0.5 2.  4.5]\n0.6137 0.693\n-1.0 0.0 8.0 8.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def conj_quadratic(Q, y):
    return float(0.5 * y @ np.linalg.solve(Q, y))

def fenchel_young_gap(f, fstar, x, y):
    return float(f(x) + fstar(y) - x @ y)

def dual_norm_inf(y):
    return float(np.abs(y).sum())

Q = np.array([[2.0, 0.0], [0.0, 0.5]]); y = np.array([1.0, 1.0])
print(conj_quadratic(Q, y), round(fenchel_young_gap(lambda x: 0.5 * x @ Q @ x, lambda y: conj_quadratic(Q, y), np.linalg.solve(Q, y), y), 12) + 0.0)
print(dual_norm_inf(np.array([0.5, -2.0, 1.0])), round(fenchel_young_gap(lambda x: float(np.abs(x).max()), lambda y: 0.0 if np.abs(y).sum() <= 1 else np.inf, np.array([1.0, -1.0]), np.array([0.5, -0.5])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.25 0.0\n3.5 0.0", "2.5 0.0\n3.5 0.0", "1.25 0.0\n2.0 0.0", "1.25 1.0\n3.5 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          On a grid xs with values fvals = f(xs), write <C>conj_grid(fvals, xs, ys)</C>, the discrete conjugate max over the
          grid of y·x − f(x) for each y, <C>biconj_grid(fvals, xs, ys)</C>, applying it twice (back onto xs), and{" "}
          <C>argmax_slope(fvals, xs, y)</C>, the grid point where the supremum for slope y is attained.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def conj_grid(fvals, xs, ys):
    return np.zeros(len(ys))

def biconj_grid(fvals, xs, ys):
    return fvals

def argmax_slope(fvals, xs, y):
    return 0.0
`,
        solution: GRID,
        tests: [
          { name: "conj", code: `xs = np.linspace(-3, 3, 601)
assert np.allclose(conj_grid(np.abs(xs), xs, np.array([0.5, -1.0, 1.5])), [0.0, 0.0, 1.5]) and abs(argmax_slope(xs ** 2, xs, 2.0) - 1.0) < 1e-9` },
          { name: "biconj", code: `xs = np.linspace(-2, 2, 401); f = np.minimum((xs - 1) ** 2, (xs + 1) ** 2)
env = biconj_grid(f, xs, np.linspace(-10, 10, 2001))
assert np.all(env <= f + 1e-9) and abs(env[200]) < 1e-9 and abs(env[400] - f[400]) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conj_quadratic(Q, y)</C>, the conjugate of ½xᵀQx at y, <C>fenchel_young_gap(f, fstar, x, y)</C>,
          returning f(x) + f*(y) − xᵀy, and <C>dual_norm_inf(y)</C>, the dual norm of the max-norm.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def conj_quadratic(Q, y):
    return 0.0

def fenchel_young_gap(f, fstar, x, y):
    return 0.0

def dual_norm_inf(y):
    return 0.0
`,
        solution: FORMULAS,
        tests: [
          { name: "quad", code: `Q = np.array([[2.0, 1.0], [1.0, 2.0]]); y = np.array([1.0, -1.0])
assert abs(conj_quadratic(Q, y) - 1.0) < 1e-12 and dual_norm_inf(np.array([-1.0, 2.0, 0.5])) == 3.5` },
          { name: "fy", code: `f = lambda x: float(np.exp(x).sum()); fs = lambda y: float((y * np.log(y) - y).sum())
x = np.array([0.0, 1.0])
assert abs(fenchel_young_gap(f, fs, x, np.exp(x))) < 1e-12 and fenchel_young_gap(f, fs, x, np.array([2.0, 2.0])) > 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For any function f on ℝⁿ, prove that its conjugate f*(y) = sup over x of (yᵀx − f(x)) is convex, that f(x) + f*(y)
          ≥ xᵀy for all x and y, and that f**(x) ≤ f(x).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows f* is convex as a pointwise supremum of the affine functions y ↦ yᵀx − f(x), or verifies the chord inequality directly.",
          "Derives Fenchel–Young from f*(y) ≥ yᵀx − f(x) for the particular x.",
          "Rearranges Fenchel–Young to xᵀy − f*(y) ≤ f(x) for every y and takes the supremum over y to get f**(x) ≤ f(x).",
        ],
      },
    },
    {
      key: "q",
      rung: "stretch",
      prompt: <p>For f(x) = ½xᵀQx with Q = diag(4, 1), what is f*(2, 1)?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the definition of the convex conjugate and its picture with supporting lines, why it is always convex, the Fenchel–Young inequality, the conjugates of a quadratic and of a norm, and why the biconjugate gives back a convex function or its convex envelope.",

  glimpse: (
    <>
      <p>
        With convex sets and functions in hand, the next chapter writes down convex optimisation problems: minimising a
        convex function over a convex set, in the standard forms that solvers accept, starting with linear and quadratic
        programs.
      </p>
    </>
  ),
};
