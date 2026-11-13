import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RobustLpViz } from "@/components/viz/RobustLpViz";
import type { LessonContent } from "@/lib/types";

const ROBUST = `import numpy as np

def robust_lhs(abar, P, x):
    return float(abar @ x + np.linalg.norm(P.T @ x))

def worst_case_a(abar, P, x):
    v = P.T @ x
    n = np.linalg.norm(v)
    return abar + (P @ v / n if n > 0 else 0)

def sampled_worst(abar, P, x, k=3600):
    t = 2 * np.pi * np.arange(k) / k
    U = np.stack([np.cos(t), np.sin(t)], axis=1)
    return float(((abar + U @ P.T) @ x).max())`;

const SDP = `import numpy as np

def schur_psd(u, t):
    n = len(u)
    M = np.block([[t * np.eye(n), u[:, None]], [u[None, :], np.array([[t]])]])
    return bool(np.linalg.eigvalsh(M).min() >= -1e-12)

def min_lambda_max(A0, A1, lo, hi, iters=100):
    lmax = lambda x: np.linalg.eigvalsh(A0 + x * A1)[-1]
    for _ in range(iters):
        m1, m2 = lo + (hi - lo) / 3, hi - (hi - lo) / 3
        if lmax(m1) <= lmax(m2):
            hi = m2
        else:
            lo = m1
    return (lo + hi) / 2, float(lmax((lo + hi) / 2))`;

export const lesson: LessonContent = {
  id: "m10.3.2",
  minutes: 55,
  links: {
    requires: ["m10.3.1", "m10.1.1", "m10.2.3"],
    revisits: ["m3.7.5", "m10.1.2"],
    foreshadows: ["m10.4.2"],
  },

  puzzle: (
    <>
      <p>
        A production plan satisfies aᵀx ≤ b, but the coefficients a were estimated and could be off by a little in any
        direction. Requiring the constraint for every possible a is infinitely many linear constraints. Remarkably, they
        collapse into a single constraint, no longer linear but still convex. What does it look like, and what kind of
        problem do you get?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The worst a in a ball around ā pushes aᵀx up by the radius times ‖x‖, so the infinitely many constraints become
        āᵀx + r‖x‖ ≤ b: a norm bounded by an affine function, which is a second-order cone constraint. Going further,
        requiring a symmetric matrix that depends affinely on x to be positive semidefinite gives semidefinite programs,
        which contain linear, quadratic and second-order cone programs as special cases.
      </p>
      <RobustLpViz />
    </>
  ),

  theory: (
    <>
      <Definition title="second-order cone and semidefinite programs">
        <p>A second-order cone program (SOCP) is</p>
        <MD>{"\\text{minimise } f^\\top x \\quad \\text{subject to } \\lVert A_ix + b_i\\rVert_2 \\leq c_i^\\top x + d_i,\\ i = 1, \\dots, m."}</MD>
        <p>
          Each constraint says that <M>{"(A_ix + b_i, c_i^\\top x + d_i)"}</M> lies in the second-order cone, so it is the
          preimage of a convex cone under an affine map. A semidefinite program (SDP) is
        </p>
        <MD>{"\\text{minimise } c^\\top x \\quad \\text{subject to } F_0 + x_1F_1 + \\dots + x_nF_n \\succeq 0"}</MD>
        <p>with symmetric matrices <M>{"F_i"}</M>; its feasible set is a spectrahedron.</p>
      </Definition>

      <Theorem title="robust linear constraints are second-order cone constraints">
        <p>
          <M>{"a^\\top x \\leq b"}</M> holds for every a in the ellipsoid{" "}
          <M>{"\\{\\bar a + Pu : \\lVert u\\rVert_2 \\leq 1\\}"}</M> exactly when{" "}
          <M>{"\\bar a^\\top x + \\lVert P^\\top x\\rVert_2 \\leq b"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sup_{\\lVert u\\rVert \\leq 1}(\\bar a + Pu)^\\top x = \\bar a^\\top x + \\sup_{\\lVert u\\rVert \\leq 1}u^\\top(P^\\top x) = \\bar a^\\top x + \\lVert P^\\top x\\rVert_2"}</M>,
          by Cauchy–Schwarz, with the supremum attained at <M>{"u = P^\\top x/\\lVert P^\\top x\\rVert"}</M> (any u if{" "}
          <M>{"P^\\top x = 0"}</M>). The constraint holds for all a exactly when it holds at the supremum.
        </p>
        <Code>{ROBUST}</Code>
      </Proof>

      <Theorem title="second-order cones inside semidefinite programs">
        <p>
          For <M>{"u \\in \\mathbb R^n"}</M> and real t,{" "}
          <M>{"\\begin{pmatrix} tI & u \\\\ u^\\top & t \\end{pmatrix} \\succeq 0"}</M> exactly when{" "}
          <M>{"\\lVert u\\rVert_2 \\leq t"}</M>. So every SOCP is an SDP.
        </p>
      </Theorem>
      <Proof>
        <p>
          If the matrix is PSD its diagonal entries are nonnegative, so t ≥ 0. Testing it on the vector{" "}
          <M>{"(-u, s)"}</M> gives <M>{"t\\lVert u\\rVert^2 - 2s\\lVert u\\rVert^2 + ts^2 \\geq 0"}</M>; with s = t this is{" "}
          <M>{"t(t^2 - \\lVert u\\rVert^2) \\geq 0"}</M>, so <M>{"\\lVert u\\rVert \\leq t"}</M> when t &gt; 0, and u = 0 when t
          = 0 (take s = 1). Conversely, if <M>{"\\lVert u\\rVert \\leq t"}</M>, then for any (v, s),{" "}
          <M>{"t\\lVert v\\rVert^2 + 2su^\\top v + ts^2 \\geq t\\lVert v\\rVert^2 - 2\\lvert s\\rvert t\\lVert v\\rVert + ts^2 = t(\\lVert v\\rVert - \\lvert s\\rvert)^2 \\geq 0"}</M>.
        </p>
        <Code>{SDP}</Code>
      </Proof>

      <Remark title="the hierarchy and its uses">
        <p>
          LP ⊂ convex QP ⊂ SOCP ⊂ SDP: a linear constraint is a second-order cone constraint with A = 0, a convex quadratic
          constraint can be rewritten as a norm bound, and SOCPs are SDPs by the theorem. Minimising the largest eigenvalue
          of <M>{"A_0 + \\sum x_iA_i"}</M> is an SDP (minimise t subject to <M>{"tI - A_0 - \\sum x_iA_i \\succeq 0"}</M>); in
          the code a one-variable instance is solved by ternary search, giving value 2 at x = 1. In the robust example, the
          worst coefficient vector is (1.2236, 1.4472) and the robust left side is 4.118 against the nominal 3; a dense
          search over the circle agrees. Interior-point solvers handle all four classes, and modelling tools translate
          problems written with norms, eigenvalues and convex compositions into these standard forms automatically.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rob",
      rung: "check",
      prompt: <p>ā = (2, 0), the uncertainty is a disc of radius 0.5 (P = 0.5I) and x = (1, 1). What is the worst-case value of aᵀx? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.7071, tolerance: 0.0001 },
    },
    {
      key: "t",
      rung: "check",
      prompt: <p>What is the smallest t for which [[tI, u], [uᵀ, t]] is positive semidefinite when u = (1, 2, 2)?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "hier",
      rung: "apply",
      prompt: <p>Which statement about the classes of convex problems is correct?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every LP is an SOCP and every SOCP is an SDP",
          "Every SDP is an SOCP and every SOCP is an LP",
          "SOCPs and SDPs are unrelated classes",
          "QPs with P ⪰ 0 cannot be written as SOCPs",
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

def robust_lhs(abar, P, x):
    return float(abar @ x + np.linalg.norm(P.T @ x))

def worst_case_a(abar, P, x):
    v = P.T @ x
    n = np.linalg.norm(v)
    return abar + (P @ v / n if n > 0 else 0)

def sampled_worst(abar, P, x, k=3600):
    t = 2 * np.pi * np.arange(k) / k
    U = np.stack([np.cos(t), np.sin(t)], axis=1)
    return float(((abar + U @ P.T) @ x).max())

abar = np.array([1.0, 1.0]); P = 0.5 * np.eye(2); x = np.array([1.0, 2.0])
print(round(robust_lhs(abar, P, x), 4), np.round(worst_case_a(abar, P, x), 4), round(sampled_worst(abar, P, x), 4))
print(round(robust_lhs(abar, np.zeros((2, 2)), x), 4), np.round(worst_case_a(abar, np.zeros((2, 2)), x), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.118 [1.2236 1.4472] 4.118\n3.0 [1. 1.]", "4.118 [1.2236 1.4472] 4.0\n3.0 [1. 1.]", "4.118 [1.4472 1.2236] 4.118\n3.0 [1. 1.]", "4.5 [1.25 1.5 ] 4.5\n3.0 [1. 1.]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def schur_psd(u, t):
    n = len(u)
    M = np.block([[t * np.eye(n), u[:, None]], [u[None, :], np.array([[t]])]])
    return bool(np.linalg.eigvalsh(M).min() >= -1e-12)

def min_lambda_max(A0, A1, lo, hi, iters=100):
    lmax = lambda x: np.linalg.eigvalsh(A0 + x * A1)[-1]
    for _ in range(iters):
        m1, m2 = lo + (hi - lo) / 3, hi - (hi - lo) / 3
        if lmax(m1) <= lmax(m2):
            hi = m2
        else:
            lo = m1
    return (lo + hi) / 2, float(lmax((lo + hi) / 2))

print(schur_psd(np.array([3.0, 4.0]), 5.0), schur_psd(np.array([3.0, 4.0]), 4.9), schur_psd(np.zeros(2), 0.0))
A0 = np.array([[2.0, 1.0], [1.0, 0.0]]); A1 = np.diag([-1.0, 1.0])
x, v = min_lambda_max(A0, A1, -5.0, 5.0)
print(round(x, 4), round(v, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False True\n1.0 2.0", "True True True\n1.0 2.0", "True False False\n1.0 2.0", "True False True\n0.0 2.4142"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>robust_lhs(abar, P, x)</C>, the worst case of aᵀx over a in {"{"}ā + Pu : ‖u‖ ≤ 1{"}"},{" "}
          <C>worst_case_a(abar, P, x)</C>, the a that attains it (ā itself if Pᵀx = 0), and{" "}
          <C>sampled_worst(abar, P, x, k=3600)</C>, the largest aᵀx over k equally spaced unit vectors u in the plane.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def robust_lhs(abar, P, x):
    return 0.0

def worst_case_a(abar, P, x):
    return abar

def sampled_worst(abar, P, x, k=3600):
    return 0.0
`,
        solution: ROBUST,
        tests: [
          { name: "robust", code: `abar = np.array([2.0, 0.0]); P = np.array([[1.0, 0.0], [0.0, 0.0]]); x = np.array([-1.0, 3.0])
assert abs(robust_lhs(abar, P, x) - (-2 + 1)) < 1e-12 and np.allclose(worst_case_a(abar, P, x), [1.0, 0.0])` },
          { name: "sample", code: `abar = np.array([1.0, -1.0]); P = np.array([[2.0, 1.0], [0.0, 1.0]]); x = np.array([0.5, 2.0])
assert abs(sampled_worst(abar, P, x) - robust_lhs(abar, P, x)) < 1e-4 and sampled_worst(abar, P, x) <= robust_lhs(abar, P, x) + 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>schur_psd(u, t)</C>, building [[tI, u], [uᵀ, t]] and testing positive semidefiniteness, and{" "}
          <C>min_lambda_max(A0, A1, lo, hi, iters=100)</C>, minimising λ_max(A0 + xA1) over x in [lo, hi] by ternary search
          and returning (x, value).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def schur_psd(u, t):
    return True

def min_lambda_max(A0, A1, lo, hi, iters=100):
    return 0.0, 0.0
`,
        solution: SDP,
        tests: [
          { name: "schur", code: `assert schur_psd(np.array([1.0, 2.0, 2.0]), 3.0) and not schur_psd(np.array([1.0, 2.0, 2.0]), 2.99) and not schur_psd(np.array([0.0]), -0.1)` },
          { name: "lmax", code: `x, v = min_lambda_max(np.diag([3.0, 1.0]), np.diag([-1.0, 1.0]), -10.0, 10.0)
assert abs(x - 1.0) < 1e-6 and abs(v - 2.0) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let ā ∈ ℝⁿ, P an n-by-k matrix and b a number. Prove that aᵀx ≤ b holds for every a = ā + Pu with ‖u‖₂ ≤ 1 if and
          only if āᵀx + ‖Pᵀx‖₂ ≤ b.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes (ā + Pu)ᵀx = āᵀx + uᵀ(Pᵀx) and bounds uᵀ(Pᵀx) ≤ ‖Pᵀx‖ by Cauchy–Schwarz for ‖u‖ ≤ 1.",
          "Shows the bound is attained, by u = Pᵀx/‖Pᵀx‖ when Pᵀx ≠ 0 (and trivially otherwise).",
          "Concludes that the constraint holds for all such a exactly when it holds at the supremum, giving both directions.",
        ],
      },
    },
    {
      key: "lm",
      rung: "stretch",
      prompt: <p>Minimise λ_max of [[2 − x, 1], [1, x]] over real x. What is the minimum value?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what second-order cone and semidefinite programs are, why a linear constraint with ellipsoidal uncertainty in its coefficients becomes a second-order cone constraint, why norm bounds can be written as matrix inequalities, and how LP, QP, SOCP and SDP nest.",

  glimpse: (
    <>
      <p>
        Many problems are convex in disguise: a ratio, a maximum or an absolute value hides a standard form. The next lesson
        collects the reformulations that reveal it, such as epigraph variables, slack variables and changes of variable.
      </p>
    </>
  ),
};
