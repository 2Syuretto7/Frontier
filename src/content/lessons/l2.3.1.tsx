import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MarginViz } from "@/components/viz/MarginViz";
import type { LessonContent } from "@/lib/types";

const GEOM = `import numpy as np

def distance_to_plane(w, b, X):
    return (X @ w + b) / np.linalg.norm(w)

def geometric_margin(w, b, X, y):
    return float(np.min(y * distance_to_plane(w, b, X)))

def hinge_objective(w, b, X, y, C):
    return float(0.5 * w @ w + C * np.sum(np.maximum(0, 1 - y * (X @ w + b))))`;

const SUB = `import numpy as np

def svm_subgrad(X, y, C, steps=20000, lr0=0.1):
    w, b = np.zeros(X.shape[1]), 0.0
    w_avg, b_avg = np.zeros(X.shape[1]), 0.0
    for t in range(1, steps + 1):
        viol = y * (X @ w + b) < 1
        gw = w - C * (y[viol, None] * X[viol]).sum(axis=0)
        gb = -C * y[viol].sum()
        lr = lr0 / np.sqrt(t)
        w, b = w - lr * gw, b - lr * gb
        if t > steps // 2:
            w_avg, b_avg = w_avg + w, b_avg + b
    k = steps - steps // 2
    return w_avg / k, b_avg / k

def support_vectors(w, b, X, y, tol=0.05):
    return np.flatnonzero(y * (X @ w + b) <= 1 + tol)`;

export const lesson: LessonContent = {
  id: "l2.3.1",
  minutes: 55,
  links: {
    requires: ["l2.2.3", "l1.3.2"],
    revisits: ["l2.1.3", "l1.5.3"],
    foreshadows: ["l2.3.2"],
  },

  puzzle: (
    <>
      <p>
        When two classes can be separated by a line, infinitely many lines do it, and they all have zero training error.
        Some pass within a hair of a training point; others leave room on both sides. Which one should you choose, and how
        do you turn that preference into an optimisation problem you can solve?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Choose the line that stays as far as possible from the nearest points of either class, so that small perturbations
        of the data do not flip any prediction. Measuring that distance properly and fixing the scale of w turns the idea
        into minimising ‖w‖ subject to every point being on the right side with room to spare. Letting points break the
        rule at a price gives the soft-margin SVM, which is just a hinge loss plus an L2 penalty.
      </p>
      <MarginViz />
    </>
  ),

  theory: (
    <>
      <Definition title="margins">
        <p>
          For a linear score <M>{"f(x) = w^\\top x + b"}</M> and a label <M>{"y \\in \\{-1, +1\\}"}</M>, the functional
          margin is <M>{"y f(x)"}</M>, positive when the point is classified correctly. The geometric margin is{" "}
          <M>{"y f(x)/\\|w\\|"}</M>, and the margin of a classifier on a dataset is the smallest geometric margin over the
          points.
        </p>
      </Definition>

      <Theorem title="distance to a hyperplane">
        <p>
          The distance from x to the hyperplane <M>{"\\{z : w^\\top z + b = 0\\}"}</M> is <M>{"|w^\\top x + b|/\\|w\\|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The closest point is reached by moving along the normal w: set <M>{"z = x - t\\,w/\\|w\\|"}</M>. Then{" "}
          <M>{"w^\\top z + b = w^\\top x + b - t\\|w\\|"}</M>, which is 0 at <M>{"t = (w^\\top x + b)/\\|w\\|"}</M>. Any other
          point of the hyperplane differs from z by a vector orthogonal to w, so by Pythagoras it is farther from x; the
          distance is |t|.
        </p>
        <Code>{GEOM}</Code>
      </Proof>

      <Theorem title="the hard-margin problem">
        <p>On separable data, the classifier with the largest margin solves</p>
        <MD>{"\\min_{w, b} \\tfrac12\\|w\\|^2 \\quad\\text{subject to}\\quad y_i(w^\\top x_i + b) \\geq 1 \\text{ for all } i,"}</MD>
        <p>and its margin is <M>{"1/\\|w\\|"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Scaling (w, b) by c &gt; 0 changes neither the hyperplane nor any geometric margin, so we may fix the scale by
          requiring the smallest functional margin to be exactly 1. The margin is then <M>{"1/\\|w\\|"}</M>, and maximising it
          is minimising ‖w‖, or equivalently <M>{"\\tfrac12\\|w\\|^2"}</M>. Relaxing &quot;smallest functional margin equals
          1&quot; to &quot;all functional margins at least 1&quot; changes nothing, because at a solution where all were
          strictly above 1 we could shrink w and do better.
        </p>
      </Proof>

      <Theorem title="soft margin is hinge loss plus a penalty">
        <p>The soft-margin SVM</p>
        <MD>{"\\min_{w, b, \\xi} \\tfrac12\\|w\\|^2 + C\\sum_i \\xi_i \\quad\\text{s.t.}\\quad y_i(w^\\top x_i + b) \\geq 1 - \\xi_i,\\ \\xi_i \\geq 0"}</MD>
        <p>
          has the same (w, b) solutions as the unconstrained problem{" "}
          <M>{"\\min_{w, b} \\tfrac12\\|w\\|^2 + C\\sum_i \\max(0, 1 - y_i(w^\\top x_i + b))"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For fixed (w, b), the objective increases with each <M>{"\\xi_i"}</M>, and the constraints say{" "}
          <M>{"\\xi_i \\geq 1 - y_if(x_i)"}</M> and <M>{"\\xi_i \\geq 0"}</M>. The smallest feasible value is{" "}
          <M>{"\\xi_i = \\max(0, 1 - y_if(x_i))"}</M>, the hinge loss. Substituting it gives the unconstrained objective, so
          minimising over (w, b) gives the same answers.
        </p>
      </Proof>
      <Remark title="hinge loss versus log loss">
        <p>
          Dividing by C, the SVM is regularised empirical risk minimisation with hinge loss and λ = 1/C. The hinge is zero
          once <M>{"yf(x) \\geq 1"}</M>, so points comfortably on the right side have no influence at all; only the support
          vectors, on or inside the margin, determine the solution. Log loss never reaches zero, so every point pulls a little,
          but in exchange it yields probabilities, which an SVM score does not.
        </p>
      </Remark>

      <Example title="fitting by subgradient descent">
        <p>
          The hinge is not differentiable at <M>{"yf = 1"}</M>, but any slope between 0 and <M>{"-y x"}</M> is a valid
          subgradient there. Subgradient descent with steps shrinking like <M>{"1/\\sqrt t"}</M>, averaging the later iterates,
          converges to the optimum. On the four-point example the exact solution is w = (0.5, 0.5), b = −1, margin √2 ≈ 1.414;
          the averaged iterate lands within a few hundredths. The next lesson solves the same problem exactly, through its
          dual.
        </p>
        <Code>{SUB}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dist",
      rung: "check",
      prompt: <p>With w = (3, 4) and b = −5, what is the signed distance (wᵀx + b)/‖w‖ of x = (2, 1) from the hyperplane?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "width",
      rung: "check",
      prompt: <p>If ‖w‖ = 0.5, what is the distance between the lines f(x) = 1 and f(x) = −1?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "hinge",
      rung: "apply",
      prompt: <p>Which training points have nonzero hinge loss?</p>,
      answer: {
        kind: "choice",
        options: [
          "Those with yf(x) < 1: inside the margin or misclassified",
          "Only the misclassified points, with yf(x) < 0",
          "All points, with loss decreasing in yf(x)",
          "Only the points exactly on the margin",
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

def distance_to_plane(w, b, X):
    return (X @ w + b) / np.linalg.norm(w)

def geometric_margin(w, b, X, y):
    return float(np.min(y * distance_to_plane(w, b, X)))

def hinge_objective(w, b, X, y, C):
    return float(0.5 * w @ w + C * np.sum(np.maximum(0, 1 - y * (X @ w + b))))

X = np.array([[2.0, 2.0], [3.0, 3.0], [0.0, 0.0], [-1.0, 0.0]]); y = np.array([1.0, 1.0, -1.0, -1.0])
w, b = np.array([0.5, 0.5]), -1.0
print(np.round(distance_to_plane(w, b, X), 3), round(geometric_margin(w, b, X, y), 3))
print(hinge_objective(w, b, X, y, 1.0), hinge_objective(2 * w, 2 * b, X, y, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 1.414  2.828 -1.414 -2.121] 1.414\n0.25 1.0", "[ 1.     2.    -1.    -1.5  ] 1.0\n0.25 1.0", "[ 1.414  2.828 -1.414 -2.121] 1.414\n0.25 0.25", "[ 1.414  2.828 -1.414 -2.121] -2.121\n0.25 1.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def svm_subgrad(X, y, C, steps=20000, lr0=0.1):
    w, b = np.zeros(X.shape[1]), 0.0
    w_avg, b_avg = np.zeros(X.shape[1]), 0.0
    for t in range(1, steps + 1):
        viol = y * (X @ w + b) < 1
        gw = w - C * (y[viol, None] * X[viol]).sum(axis=0)
        gb = -C * y[viol].sum()
        lr = lr0 / np.sqrt(t)
        w, b = w - lr * gw, b - lr * gb
        if t > steps // 2:
            w_avg, b_avg = w_avg + w, b_avg + b
    k = steps - steps // 2
    return w_avg / k, b_avg / k

def support_vectors(w, b, X, y, tol=0.05):
    return np.flatnonzero(y * (X @ w + b) <= 1 + tol)

X = np.array([[2.0, 2.0], [3.0, 3.0], [0.0, 0.0], [-1.0, 0.0]]); y = np.array([1.0, 1.0, -1.0, -1.0])
w2, b2 = svm_subgrad(X, y, 10.0)
print(np.round(w2, 2), round(b2, 2), support_vectors(w2, b2, X, y))
print(round(1 / np.linalg.norm(w2), 2))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.51 0.51] -1.0 [0 2]\n1.39", "[0.51 0.51] -1.0 [0 1 2 3]\n1.39", "[0.51 0.51] -1.0 [0 2]\n0.72", "[1.02 1.02] -2.0 [0 2]\n0.69"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>distance_to_plane(w, b, X)</C>, the signed distances of the rows of X, <C>geometric_margin(w, b, X, y)</C>,
          the smallest yᵢ times distance as a float, and <C>hinge_objective(w, b, X, y, C)</C>, ½‖w‖² plus C times the total
          hinge loss.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def distance_to_plane(w, b, X):
    return X @ w + b

def geometric_margin(w, b, X, y):
    return 0.0

def hinge_objective(w, b, X, y, C):
    return 0.0
`,
        solution: GEOM,
        tests: [
          { name: "dist", code: `w = np.array([3.0, 4.0])
assert np.allclose(distance_to_plane(w, -5.0, np.array([[2.0, 1.0], [0.0, 0.0]])), [1.0, -1.0]) and abs(geometric_margin(w, -5.0, np.array([[2.0, 1.0], [0.0, 0.0]]), np.array([1.0, 1.0])) + 1.0) < 1e-12` },
          { name: "hinge", code: `X = np.array([[0.5, 0.0], [-2.0, 0.0], [1.0, 3.0]]); y = np.array([1.0, -1.0, -1.0])
assert abs(hinge_objective(np.array([1.0, 0.0]), 0.0, X, y, 2.0) - 5.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>svm_subgrad(X, y, C, steps=20000, lr0=0.1)</C>, full-batch subgradient descent on the soft-margin
          objective with step lr0/√t, returning the average of (w, b) over the second half of the steps, and{" "}
          <C>support_vectors(w, b, X, y, tol=0.05)</C>, the indices with yf(x) ≤ 1 + tol.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def svm_subgrad(X, y, C, steps=20000, lr0=0.1):
    return np.zeros(X.shape[1]), 0.0

def support_vectors(w, b, X, y, tol=0.05):
    return np.arange(len(y))
`,
        solution: SUB,
        tests: [
          { name: "fit", code: `X = np.array([[2.0, 2.0], [3.0, 3.0], [0.0, 0.0], [-1.0, 0.0]]); y = np.array([1.0, 1.0, -1.0, -1.0])
w, b = svm_subgrad(X, y, 10.0)
assert np.allclose(w, [0.5, 0.5], atol=0.05) and abs(b + 1.0) < 0.1` },
          { name: "sv", code: `X = np.array([[1.0], [3.0], [-1.0], [-4.0]]); y = np.array([1.0, 1.0, -1.0, -1.0])
assert list(support_vectors(np.array([1.0]), 0.0, X, y)) == [0, 2]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the soft-margin SVM with slack variables ξᵢ has the same minimising (w, b) as the unconstrained objective ½‖w‖² + CΣ max(0, 1 − yᵢ(wᵀxᵢ + b)).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Fixes (w, b) and notes the objective is increasing in each ξᵢ, so each ξᵢ should be as small as the constraints allow.",
          "Identifies the smallest feasible ξᵢ as max(0, 1 − yᵢf(xᵢ)) from the two constraints.",
          "Substitutes to get the hinge objective and concludes the minimisers over (w, b) coincide.",
        ],
      },
    },
    {
      key: "obj",
      rung: "stretch",
      prompt: (
        <p>
          With w = (1, 0), b = 0 and C = 2, compute the soft-margin objective for the points (0.5, 0) labelled +1, (−2, 0)
          labelled −1 and (1, 3) labelled −1.
        </p>
      ),
      answer: { kind: "numeric", value: 5.5, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what the geometric margin is, why maximising it becomes minimising ‖w‖ under constraints, how slack variables lead to the hinge loss, and which training points actually determine an SVM.",

  glimpse: (
    <>
      <p>
        The SVM solution depends only on the support vectors, and that shows up even more sharply in its dual problem,
        where the data enter only through inner products. Replace the inner product by a kernel and the same algorithm
        draws curved boundaries.
      </p>
    </>
  ),
};
