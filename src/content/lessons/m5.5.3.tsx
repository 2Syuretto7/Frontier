import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CriticalPointsViz } from "@/components/viz/CriticalPointsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.5.3",
  minutes: 55,
  links: {
    requires: ["m5.5.2"],
    revisits: ["m2.5.3"],
    foreshadows: ["m5.5.5", "m5.5.4"],
  },

  puzzle: (
    <>
      <p>
        In one variable, a point with f&prime; = 0 and f&Prime; &gt; 0 is a minimum. In two variables a point can be a minimum
        along the x-axis and a maximum along the y-axis, like the middle of a horse&rsquo;s saddle.
      </p>
      <p>How do you tell, from derivatives at the point alone, what kind of flat point you are standing on?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        At a critical point the gradient is zero, so the second-order Taylor model is{" "}
        <M>{"f(a) + \\tfrac12 h^\\top H h"}</M>. Its shape is set by the signs of the eigenvalues of H: all positive is a bowl,
        all negative a dome, mixed signs a saddle.
      </p>
      <CriticalPointsViz />
      <p>
        A zero eigenvalue leaves a direction the quadratic model cannot see, and then the test is silent. In high dimensions,
        mixed signs are by far the most likely case, which is why the critical points that optimisers meet are mostly saddles.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="critical point">
        <p>
          a is a critical (stationary) point of a differentiable f if <M>{"\\nabla f(a) = 0"}</M>. It is a strict local minimum
          if <M>{"f(a + h) > f(a)"}</M> for all small h ≠ 0, and a saddle point if every neighbourhood of a contains points with
          f larger and points with f smaller than f(a).
        </p>
      </Definition>

      <Theorem title="first-order condition">
        <p>If f is differentiable at an interior local minimum or maximum a, then <M>{"\\nabla f(a) = 0"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Each one-variable function <M>{"t \\mapsto f(a + te_i)"}</M> has a local extremum at t = 0, so its derivative{" "}
          <M>{"\\partial_i f(a)"}</M> is 0.
        </p>
      </Proof>

      <Theorem title="second-derivative test">
        <p>Let f be <M>{"C^2"}</M> with <M>{"\\nabla f(a) = 0"}</M> and H = <M>{"H_f(a)"}</M>.</p>
        <ul>
          <li>If H is positive definite (all eigenvalues &gt; 0), a is a strict local minimum.</li>
          <li>If H is negative definite (all &lt; 0), a is a strict local maximum.</li>
          <li>If H has eigenvalues of both signs, a is a saddle point.</li>
          <li>Otherwise (semidefinite with a zero eigenvalue) the test is inconclusive.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          Suppose H is positive definite with smallest eigenvalue λ &gt; 0. The smallest eigenvalue of a symmetric matrix depends
          continuously on its entries, so for ‖h‖ small enough every <M>{"H_f(a + sh)"}</M> has smallest eigenvalue at least λ/2.
          Taylor&rsquo;s theorem gives <M>{"f(a + h) - f(a) = \\tfrac12 h^\\top H_f(a + sh) h \\ge \\tfrac{\\lambda}{4}\\|h\\|^2 > 0"}</M>
          . The maximum case is the same for −f. For mixed signs, move along an eigenvector with positive eigenvalue and along one
          with negative eigenvalue: by the one-variable test, f rises in the first and falls in the second.
        </p>
      </Proof>

      <Example title="the two-variable shortcut">
        <p>
          For <M>{"H = \\begin{pmatrix} f_{xx} & f_{xy} \\\\ f_{xy} & f_{yy}\\end{pmatrix}"}</M>, the eigenvalues multiply to{" "}
          <M>{"D = f_{xx}f_{yy} - f_{xy}^2"}</M>. If D &gt; 0 they share a sign, that of <M>{"f_{xx}"}</M>; if D &lt; 0 it is a
          saddle; if D = 0 the test is inconclusive.
        </p>
        <MD>{"f = x^3 - 3x + y^2: \\quad \\nabla f = (3x^2 - 3, 2y) = 0 \\Rightarrow (\\pm 1, 0); \\quad D(1, 0) = 12 > 0,\\; D(-1, 0) = -12 < 0."}</MD>
      </Example>

      <Remark title="saddles in high dimensions">
        <p>
          If the n eigenvalues at a critical point were independent fair coin flips for sign, the chance that all are positive
          would be <M>{"2^{-n}"}</M>. Real losses are not random, but the heuristic is borne out: in large networks most critical
          points with high loss are saddles, and gradient descent with noise escapes them along the negative-curvature directions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "saddle",
      rung: "check",
      prompt: <p>At a critical point the Hessian has eigenvalues 3 and −1. What kind of point is it?</p>,
      answer: { kind: "choice", options: ["A saddle point", "A local minimum", "A local maximum", "The test is inconclusive"], correct: [0] },
    },
    {
      key: "zero",
      rung: "check",
      prompt: <p>At a critical point the Hessian has eigenvalues 2 and 0. What does the second-derivative test conclude?</p>,
      answer: { kind: "choice", options: ["Nothing: it is inconclusive", "A local minimum", "A saddle point", "A local maximum"], correct: [0] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>How many critical points does <M>{"f(x, y) = x^4 + y^4 - 4xy"}</M> have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "value",
      rung: "apply",
      prompt: (
        <p>
          The minima of <M>{"x^4 + y^4 - 4xy"}</M> are at (1, 1) and (−1, −1). What is the minimum value?
        </p>
      ),
      answer: { kind: "numeric", value: -2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
def kind(H):
    lam = np.linalg.eigvalsh(H)
    if lam.min() > 1e-9: return "min"
    if lam.max() < -1e-9: return "max"
    if lam.min() < -1e-9 and lam.max() > 1e-9: return "saddle"
    return "?"
Hs = [[[12, -4], [-4, 12]], [[0, -4], [-4, 0]], [[2, 0], [0, 0]], [[-1, 0.5], [0.5, -1]]]
print([kind(np.array(H, float)) for H in Hs])`}</Code>
          <p>Classifying four Hessians. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['min', 'saddle', '?', 'max']",
          "['min', 'max', 'min', 'max']",
          "['min', 'saddle', 'min', 'max']",
          "['min', '?', '?', 'saddle']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
grad = lambda v: np.array([4 * v[0] ** 3 - 4 * v[1], 4 * v[1] ** 3 - 4 * v[0]])
for start in ([0.0, 0.0], [0.1, 0.0], [-0.1, 0.0]):
    x = np.array(start)
    for _ in range(300):
        x = x - 0.05 * grad(x)
    print(np.round(x, 3))`}</Code>
          <p>Gradient descent on <M>{"x^4 + y^4 - 4xy"}</M> from three starts. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0. 0.]\n[1. 1.]\n[-1. -1.]", "[1. 1.]\n[1. 1.]\n[-1. -1.]", "[0. 0.]\n[0. 0.]\n[0. 0.]", "[0. 0.]\n[1. 1.]\n[1. 1.]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>classify(H, tol=1e-9)</C>, returning <C>&quot;min&quot;</C>, <C>&quot;max&quot;</C>, <C>&quot;saddle&quot;</C>{" "}
          or <C>&quot;inconclusive&quot;</C> from the eigenvalues of the symmetric matrix H, and{" "}
          <C>newton_critical(grad, hess, x0, steps=50)</C>, which runs Newton&rsquo;s method for <M>{"\\nabla f = 0"}</M>,{" "}
          <M>{"x \\leftarrow x - H(x)^{-1}\\nabla f(x)"}</M> with a linear solve, and returns the final x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def classify(H, tol=1e-9):
    return "min"

def newton_critical(grad, hess, x0, steps=50):
    return np.asarray(x0, float)
`,
        solution: `import numpy as np

def classify(H, tol=1e-9):
    lam = np.linalg.eigvalsh(np.asarray(H, float))
    if lam.min() > tol:
        return "min"
    if lam.max() < -tol:
        return "max"
    if lam.min() < -tol and lam.max() > tol:
        return "saddle"
    return "inconclusive"

def newton_critical(grad, hess, x0, steps=50):
    x = np.asarray(x0, float)
    for _ in range(steps):
        x = x - np.linalg.solve(hess(x), grad(x))
    return x
`,
        tests: [
          { name: "classify", code: `assert classify([[2, 0], [0, 3]]) == "min"
assert classify([[-2, 0], [0, -0.5]]) == "max"
assert classify([[0, -4], [-4, 0]]) == "saddle"
assert classify([[2, 0], [0, 0]]) == "inconclusive"
assert classify([[1, 2], [2, 1]]) == "saddle", 'Use eigenvalues: the diagonal entries are both positive here.'` },
          { name: "Newton finds a saddle too", code: `import numpy as np
g = lambda v: np.array([3 * v[0] ** 2 - 3, 2 * v[1]])
h = lambda v: np.array([[6 * v[0], 0.0], [0.0, 2.0]])
assert np.allclose(newton_critical(g, h, [2.0, 1.0]), [1, 0])
x = newton_critical(g, h, [-2.0, 1.0])
assert np.allclose(x, [-1, 0]) and classify(h(x)) == "saddle", 'Newton seeks any critical point, not only minima.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Gradient descent stalls at a saddle when started exactly on it. Write <C>escape_direction(H, tol=1e-9)</C>, which
          returns a unit eigenvector for the most negative eigenvalue of H if that eigenvalue is below −tol, and{" "}
          <C>None</C> otherwise; and <C>escape(f, x, H, step=0.1)</C>, which returns <C>x + step * d</C> or{" "}
          <C>x - step * d</C>, whichever has the lower f, or x itself if there is no escape direction.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def escape_direction(H, tol=1e-9):
    return None

def escape(f, x, H, step=0.1):
    return x
`,
        solution: `import numpy as np

def escape_direction(H, tol=1e-9):
    lam, Q = np.linalg.eigh(np.asarray(H, float))
    if lam[0] < -tol:
        return Q[:, 0]
    return None

def escape(f, x, H, step=0.1):
    x = np.asarray(x, float)
    d = escape_direction(H)
    if d is None:
        return x
    a, b = x + step * d, x - step * d
    return a if f(a) <= f(b) else b
`,
        tests: [
          { name: "direction", code: `import numpy as np
d = escape_direction([[0.0, -4.0], [-4.0, 0.0]])
assert d is not None and abs(np.linalg.norm(d) - 1) < 1e-12 and abs(abs(d[0]) - abs(d[1])) < 1e-12
assert escape_direction([[2.0, 0.0], [0.0, 1.0]]) is None
assert escape_direction([[1.0, 0.0], [0.0, 0.0]]) is None` },
          { name: "escaping", code: `import numpy as np
f = lambda v: v[0] ** 4 + v[1] ** 4 - 4 * v[0] * v[1]
y = escape(f, [0.0, 0.0], [[0.0, -4.0], [-4.0, 0.0]])
assert f(y) < 0 and y[0] * y[1] > 0, y
z = escape(f, [1.0, 1.0], [[12.0, -4.0], [-4.0, 12.0]])
assert np.allclose(z, [1, 1]), 'At a minimum there is no escape direction.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if f is <M>{"C^2"}</M>, <M>{"\\nabla f(a) = 0"}</M> and <M>{"H_f(a)"}</M> is positive definite, then a is a
          strict local minimum. You may use that the smallest eigenvalue of a symmetric matrix depends continuously on its
          entries.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses Taylor with the Lagrange remainder: f(a + h) − f(a) = ½ hᵀ H(a + sh) h, since the gradient term vanishes.",
          "Uses continuity of the Hessian and of the smallest eigenvalue to get λ_min(H(a + sh)) ≥ λ/2 > 0 for small ‖h‖.",
          "Bounds hᵀ H(a + sh) h ≥ (λ/2)‖h‖² > 0 for h ≠ 0 (Rayleigh quotient), concluding f(a + h) > f(a).",
        ],
      },
    },
    {
      key: "coins",
      rung: "stretch",
      prompt: (
        <p>
          Under the coin-flip heuristic, what is the probability that a critical point of a function of 10 variables is a local
          minimum? Give a decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 1 / 1024, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend how the eigenvalues of the Hessian classify a critical point, why a zero eigenvalue makes the test fail, and why saddles are common in high dimensions.",

  glimpse: (
    <p>
      Computing the full Hessian of a large model is out of the question, but multiplying it by a vector is cheap. Next,
      Hessian-vector products.
    </p>
  ),
};
