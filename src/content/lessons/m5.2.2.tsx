import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LocalLinearViz } from "@/components/viz/LocalLinearViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.2.2",
  minutes: 60,
  links: {
    requires: ["m5.2.1", "m3.8.1"],
    revisits: ["m2.4.1", "m2.9.1"],
    foreshadows: ["m5.2.3", "m5.4.1"],
  },

  puzzle: (
    <>
      <p>
        In one variable, the derivative is a number: the slope. A function from <M>{"\\mathbb R^2"}</M> to{" "}
        <M>{"\\mathbb R^2"}</M> stretches, rotates and shears the plane, and does so differently at every point.
      </p>
      <p>What single object could play the role of &ldquo;the slope&rdquo; for it?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        In one variable, the derivative is the best straight-line approximation: near a,{" "}
        <M>{"f(a + h) \\approx f(a) + f'(a) h"}</M>. In several variables, the straight line becomes a linear map. Zoom in on
        a smooth map and it looks linear: grids go to grids of parallelograms.
      </p>
      <LocalLinearViz />
      <p>
        That linear map is the derivative. The gap between f and its linear approximation is not just small; it is small
        compared with the distance moved. This one requirement captures every direction at once, which partial derivatives
        alone did not.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="differentiable">
        <p>
          A function <M>{"f : U \\to \\mathbb R^m"}</M>, with U open in <M>{"\\mathbb R^n"}</M>, is differentiable at a if there
          is a linear map <M>{"L : \\mathbb R^n \\to \\mathbb R^m"}</M> with
        </p>
        <MD>{"\\lim_{h \\to 0} \\frac{\\|f(a + h) - f(a) - L h\\|}{\\|h\\|} = 0."}</MD>
        <p>
          Then L is the derivative <M>{"Df(a)"}</M>. Equivalently,{" "}
          <M>{"f(a + h) = f(a) + Df(a)\\,h + o(\\|h\\|)"}</M>.
        </p>
      </Definition>

      <Theorem title="the derivative is unique, and its matrix holds the partial derivatives">
        <p>
          If f is differentiable at a, then the matrix of <M>{"Df(a)"}</M> has entries{" "}
          <M>{"\\partial f_i / \\partial x_j (a)"}</M>. In particular the derivative is unique.
        </p>
      </Theorem>
      <Proof>
        <p>
          Put <M>{"h = t e_j"}</M> in the definition, with t → 0. Then{" "}
          <M>{"\\big(f(a + t e_j) - f(a)\\big)/t - L e_j \\to 0"}</M>, so the limit defining{" "}
          <M>{"\\partial f/\\partial x_j(a)"}</M> exists and equals <M>{"L e_j"}</M>, the j-th column of L. Its i-th entry is{" "}
          <M>{"\\partial f_i / \\partial x_j(a)"}</M>. Any L that works has these columns, so L is unique.
        </p>
      </Proof>

      <Theorem title="consequences and a criterion">
        <p>
          A function differentiable at a is continuous at a. Conversely, if all partial derivatives exist near a and are
          continuous at a, then f is differentiable at a.
        </p>
      </Theorem>
      <Proof>
        <p>
          For the first: <M>{"\\|f(a + h) - f(a)\\| \\le \\|Df(a) h\\| + \\|h\\| \\cdot \\frac{\\|f(a+h) - f(a) - Df(a)h\\|}{\\|h\\|}"}</M>
          , and both terms tend to 0. The criterion is proved by applying the one-variable mean value theorem along one
          coordinate at a time.
        </p>
      </Proof>

      <Example title="derivatives without coordinates">
        <ul>
          <li>A linear map is its own derivative: <M>{"D(Ax)(a) = A"}</M>, since the remainder is exactly 0.</li>
          <li>
            For <M>{"f(x) = x^\\top A x"}</M>,{" "}
            <M>{"f(x + h) = f(x) + x^\\top (A + A^\\top) h + h^\\top A h"}</M>, and{" "}
            <M>{"|h^\\top A h| \\le \\|A\\| \\, \\|h\\|^2"}</M>, so <M>{"Df(x) h = x^\\top (A + A^\\top) h"}</M>.
          </li>
          <li>
            For square matrices, <M>{"F(X) = X^2"}</M> gives <M>{"(X + H)^2 = X^2 + XH + HX + H^2"}</M>, so{" "}
            <M>{"DF(X)[H] = XH + HX"}</M>, which is not <M>{"2XH"}</M> because matrices do not commute.
          </li>
        </ul>
      </Example>

      <Remark title="why the linear map is the right object">
        <p>
          Reading off &ldquo;the part of the change that is linear in h&rdquo; works for functions of vectors, matrices or
          anything else with a norm, and needs no choice of coordinates. Matrix calculus, backpropagation and the chain rule in
          the coming lessons are all this idea, applied carefully.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "apply",
      rung: "check",
      prompt: <p>For <M>{"f(x, y) = x^2 + y^2"}</M>, what is <M>{"Df(1, 2)"}</M> applied to h = (1, 0)?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "what",
      rung: "check",
      prompt: <p>For <M>{"f : \\mathbb R^3 \\to \\mathbb R^2"}</M>, what kind of object is <M>{"Df(a)"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["A linear map from ℝ³ to ℝ², a 2 × 3 matrix", "A vector in ℝ³", "A 3 × 2 matrix", "A number"],
        correct: [0],
      },
    },
    {
      key: "approx",
      rung: "apply",
      prompt: <p>Use the linear approximation of <M>{"f(x, y) = x^2 y"}</M> at (1, 2) to estimate f(1.1, 1.9).</p>,
      answer: { kind: "numeric", value: 2.3, tolerance: 1e-9 },
    },
    {
      key: "rem",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"f(x) = \\|x\\|_2^2"}</M>, the remainder <M>{"f(a + h) - f(a) - Df(a)h"}</M> equals <M>{"\\|h\\|^2"}</M>. What is
          it when <M>{"\\|h\\| = 0.1"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.01, tolerance: 1e-12 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda v: np.array([v[0]**2 - v[1], v[0] * v[1]])
a = np.array([1.0, 2.0])
J = np.array([[2.0, -1.0], [2.0, 1.0]])
d = np.array([1.0, 1.0])
for t in [0.1, 0.01]:
    r = f(a + t * d) - f(a) - J @ (t * d)
    print(t, np.round(r, 6))`}</Code>
          <p>The remainder of the linear approximation along one direction. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.1 [0.01 0.01]\n0.01 [0.0001 0.0001]", "0.1 [0.1 0.1]\n0.01 [0.01 0.01]", "0.1 [0. 0.]\n0.01 [0. 0.]", "0.1 [0.01 0.03]\n0.01 [0.0001 0.0003]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 2.0], [0.0, 3.0]])
x = np.array([1.0, 1.0])
f = lambda v: v @ A @ v
grad = (A + A.T) @ x
h = 1e-6
num = [(f(x + h * e) - f(x - h * e)) / (2 * h) for e in np.eye(2)]
print(grad, np.round(num, 4))`}</Code>
          <p>The derivative of a quadratic form, by formula and numerically. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[4. 8.] [4. 8.]", "[3. 3.] [4. 8.]", "[2. 6.] [2. 6.]", "[4. 8.] [3. 3.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>remainder_ratios(f, a, L, directions, ts)</C>. For each t in ts, return the largest, over the given
          directions d, of <M>{"\\|f(a + t d) - f(a) - t L d\\| / (t \\|d\\|)"}</M>, as a NumPy array in the order of ts. f maps
          1-D arrays to 1-D arrays and L is a matrix. If L is the derivative, the ratios tend to 0 as t shrinks.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def remainder_ratios(f, a, L, directions, ts):
    return np.zeros(len(ts))
`,
        solution: `import numpy as np

def remainder_ratios(f, a, L, directions, ts):
    a, L = np.asarray(a, float), np.asarray(L, float)
    fa = np.asarray(f(a), float)
    out = []
    for t in ts:
        worst = 0.0
        for d in directions:
            d = np.asarray(d, float)
            r = np.asarray(f(a + t * d), float) - fa - t * (L @ d)
            worst = max(worst, np.linalg.norm(r) / (t * np.linalg.norm(d)))
        out.append(worst)
    return np.array(out)
`,
        tests: [
          { name: "true derivative", code: `import numpy as np
f = lambda v: np.array([v[0]**2 - v[1], v[0] * v[1]])
J = [[2.0, -1.0], [2.0, 1.0]]
D = [[1, 0], [0, 1], [1, 1], [3, -2]]
r = remainder_ratios(f, [1.0, 2.0], J, D, [0.1, 0.01, 0.001])
assert r.shape == (3,) and r[0] > r[1] > r[2] and r[2] < 0.005, r` },
          { name: "wrong derivative", code: `import numpy as np
f = lambda v: np.array([v[0]**2 - v[1], v[0] * v[1]])
r = remainder_ratios(f, [1.0, 2.0], [[2.0, -1.0], [1.0, 1.0]], [[1, 0], [0, 1]], [0.1, 0.001])
assert r[1] > 0.9, 'With the wrong matrix the ratio stays near 1, the size of the error in L.'
g = lambda v: np.array([v @ v])
r = remainder_ratios(g, [1.0, 1.0], [[2.0, 2.0]], [[2.0, 0.0]], [0.5])
assert np.allclose(r, [0.5 * 2.0]), r` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Derivatives of matrix functions. Write <C>d_square(X, H)</C>, the derivative of <M>{"F(X) = X^2"}</M> at X applied
          to H, and <C>d_inverse(X, H)</C>, the derivative of <M>{"G(X) = X^{-1}"}</M> applied to H, which is{" "}
          <M>{"-X^{-1} H X^{-1}"}</M>. The checks compare both with <M>{"(F(X + tH) - F(X - tH))/(2t)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def d_square(X, H):
    return 2 * X @ H

def d_inverse(X, H):
    return np.zeros_like(H)
`,
        solution: `import numpy as np

def d_square(X, H):
    return X @ H + H @ X

def d_inverse(X, H):
    Xi = np.linalg.inv(X)
    return -Xi @ H @ Xi
`,
        tests: [
          { name: "square", code: `import numpy as np
rng = np.random.default_rng(0)
X, H = rng.standard_normal((3, 3)), rng.standard_normal((3, 3))
t = 1e-6
num = ((X + t * H) @ (X + t * H) - (X - t * H) @ (X - t * H)) / (2 * t)
assert np.allclose(d_square(X, H), num, atol=1e-6), 'XH + HX, not 2XH: matrices do not commute.'` },
          { name: "inverse", code: `import numpy as np
rng = np.random.default_rng(1)
X = rng.standard_normal((4, 4)) + 4 * np.eye(4)
H = rng.standard_normal((4, 4))
t = 1e-6
num = (np.linalg.inv(X + t * H) - np.linalg.inv(X - t * H)) / (2 * t)
assert np.allclose(d_inverse(X, H), num, atol=1e-6)
assert np.allclose(d_inverse(np.eye(2) * 2, np.eye(2)), -0.25 * np.eye(2))` },
        ],
      },
    },
    {
      key: "cols",
      rung: "prove",
      prompt: (
        <p>
          Prove that if f is differentiable at a, the j-th column of <M>{"Df(a)"}</M> is the vector of partial derivatives{" "}
          <M>{"\\partial f/\\partial x_j(a)"}</M>, and that f is continuous at a.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Substitutes h = t e_j into the definition and lets t → 0 to show the difference quotient in direction e_j tends to L e_j.",
          "Concludes the partial derivative exists and equals the j-th column of L.",
          "For continuity, bounds ‖f(a + h) − f(a)‖ by ‖L h‖ plus the remainder, and notes both tend to 0 as h → 0.",
        ],
      },
    },
    {
      key: "det",
      rung: "stretch",
      prompt: (
        <p>
          The derivative of the determinant at the identity is the trace: <M>{"\\det(I + tH) = 1 + t\\,\\mathrm{tr}\\,H + O(t^2)"}</M>.
          What is <M>{"D\\det(I)"}</M> applied to <M>{"H = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 5 },
    },
  ],

  teachBack:
    "Explain to a friend why the derivative of a function of several variables is a linear map rather than a number, and what the remainder condition in the definition demands.",

  glimpse: (
    <p>
      In coordinates the derivative is a matrix of partial derivatives, the Jacobian. Next, computing Jacobians, and what
      their shape and determinant tell you.
    </p>
  ),
};
