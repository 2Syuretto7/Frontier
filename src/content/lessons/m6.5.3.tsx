import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DavisKahanViz } from "@/components/viz/DavisKahanViz";
import type { LessonContent } from "@/lib/types";

const WEYL = `import numpy as np

def weyl_check(A, E):
    shift = np.abs(np.linalg.eigvalsh(A + E) - np.linalg.eigvalsh(A)).max()
    return float(shift), float(np.linalg.norm(E, 2))

def eig_angle(u, v):
    u, v = np.asarray(u, dtype=float), np.asarray(v, dtype=float)
    c = abs(u @ v) / (np.linalg.norm(u) * np.linalg.norm(v))
    return float(np.arccos(min(c, 1.0)))`;

const DK = `def top_vec_sin(A, E):
    u = np.linalg.eigh(A)[1][:, -1]
    w = np.linalg.eigh(A + E)[1][:, -1]
    return float(np.sqrt(max(0.0, 1 - (u @ w) ** 2)))

def dk_bound(A, E):
    lam = np.linalg.eigvalsh(A)
    gap, e = lam[-1] - lam[-2], np.linalg.norm(E, 2)
    return float(e / (gap - e)) if e < gap else float("inf")`;

export const lesson: LessonContent = {
  id: "m6.5.3",
  minutes: 60,
  links: {
    requires: ["m6.3.5", "m6.5.2"],
    revisits: ["m6.4.3", "m6.4.5"],
    foreshadows: ["m6.5.4"],
  },

  puzzle: (
    <>
      <p>
        A sample covariance is the true covariance plus noise. Its eigenvalues are close to the true ones; are its
        eigenvectors, the principal components you report, close to the true directions? Sometimes they are wildly off with
        plenty of data, and sometimes they are accurate with little. What decides it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Eigenvalues of symmetric matrices are robust: a perturbation of spectral norm ε moves each by at most ε. Eigenvectors
        are robust only relative to how well separated their eigenvalue is. If two eigenvalues are nearly equal, the matrix
        barely prefers one direction in their plane over another, and a small push can rotate the eigenvectors a long way.
      </p>
      <DavisKahanViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Weyl's inequality">
        <p>
          If A and E are symmetric n×n matrices with eigenvalues in increasing order, then{" "}
          <M>{"|\\lambda_k(A + E) - \\lambda_k(A)| \\le \\|E\\|_2"}</M> for every k.
        </p>
      </Theorem>
      <Proof>
        <p>
          For every unit x, <M>{"x^\\top(A + E)x = x^\\top Ax + x^\\top Ex"}</M> and{" "}
          <M>{"|x^\\top Ex| \\le \\|E\\|_2"}</M>. So on every subspace the maximum of the Rayleigh quotient of A + E is
          within <M>{"\\|E\\|_2"}</M> of that of A. Courant–Fischer writes <M>{"\\lambda_k"}</M> as the minimum over
          k-dimensional subspaces of that maximum, and a minimum of quantities each shifted by at most{" "}
          <M>{"\\|E\\|_2"}</M> is shifted by at most <M>{"\\|E\\|_2"}</M>.
        </p>
      </Proof>
      <p>
        For singular values of any matrices the same holds,{" "}
        <M>{"|\\sigma_k(A + E) - \\sigma_k(A)| \\le \\|E\\|_2"}</M>, from Weyl&apos;s inequality for singular values in
        the Eckart–Young lesson. In particular a matrix within ε of a rank-deficient one has{" "}
        <M>{"\\sigma_{\\min} \\le \\varepsilon"}</M>, which is how numerical rank is decided.
      </p>

      <Example title="eigenvectors can be fragile">
        <p>
          For A = I in ℝ², every vector is an eigenvector. Adding{" "}
          <M>{"E = \\varepsilon\\begin{pmatrix}0 & 1\\\\ 1 & 0\\end{pmatrix}"}</M> makes the eigenvectors{" "}
          <M>{"(1, \\pm1)/\\sqrt2"}</M> however small ε is. Starting instead from diag(1 + g, 1), the top eigenvector turns by
          the angle θ with <M>{"\\tan 2\\theta = 2\\varepsilon/g"}</M>, roughly ε/g for small ε: the ratio of perturbation to
          gap.
        </p>
      </Example>

      <Theorem title="Davis–Kahan, top eigenvector">
        <p>
          Let A be symmetric with top eigenvalue <M>{"\\lambda_1"}</M> of multiplicity one, unit eigenvector u, and gap{" "}
          <M>{"\\delta = \\lambda_1 - \\lambda_2 > 0"}</M>. Let <M>{"\\hat u"}</M> be a unit top eigenvector of A + E, and θ the
          angle between the lines of u and <M>{"\\hat u"}</M>. If <M>{"\\|E\\|_2 < \\delta"}</M>, then
        </p>
        <MD>{"\\sin\\theta \\le \\frac{\\|E\\|_2}{\\delta - \\|E\\|_2}."}</MD>
        <p>In particular, if <M>{"\\|E\\|_2 \\le \\delta/2"}</M> then <M>{"\\sin\\theta \\le 2\\|E\\|_2/\\delta"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\hat\\lambda"}</M> be the top eigenvalue of A + E; by Weyl,{" "}
          <M>{"\\hat\\lambda \\ge \\lambda_1 - \\|E\\|_2"}</M>. Write <M>{"\\hat u = cu + sw"}</M> with w a unit vector
          orthogonal to u and <M>{"|s| = \\sin\\theta"}</M>. From <M>{"(A + E)\\hat u = \\hat\\lambda\\hat u"}</M>,{" "}
          <M>{"(\\hat\\lambda I - A)\\hat u = E\\hat u"}</M>. Apply the projection P onto <M>{"u^\\perp"}</M>, which commutes
          with A because <M>{"u^\\perp"}</M> is invariant: <M>{"s(\\hat\\lambda I - A)w = PE\\hat u"}</M>. On{" "}
          <M>{"u^\\perp"}</M> the eigenvalues of A are at most <M>{"\\lambda_2"}</M>, and{" "}
          <M>{"\\hat\\lambda - \\lambda_2 \\ge \\delta - \\|E\\|_2 > 0"}</M>, so{" "}
          <M>{"\\|(\\hat\\lambda I - A)w\\| \\ge \\delta - \\|E\\|_2"}</M>. Hence{" "}
          <M>{"|s|(\\delta - \\|E\\|_2) \\le \\|PE\\hat u\\| \\le \\|E\\|_2"}</M>.
        </p>
      </Proof>
      <Code>{WEYL}</Code>

      <Remark title="consequences for PCA and spectral methods">
        <p>
          If a sample covariance <M>{"\\hat\\Sigma"}</M> is within ε of Σ in spectral norm, the top sample principal
          component is within angle about <M>{"\\varepsilon/\\delta"}</M> of the true one. With n samples ε typically shrinks
          like <M>{"1/\\sqrt n"}</M>, so the number of samples needed scales like <M>{"1/\\delta^2"}</M>: components with
          nearly equal variances are hard to estimate and not worth interpreting. The same argument underlies guarantees for
          spectral clustering, where the gap is the separation between clusters. The general theorem replaces u by an
          eigenspace and θ by principal angles.
        </p>
        <Code>{DK}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "weyl",
      rung: "check",
      prompt: <p>A symmetric A has eigenvalues 1, 4, 9 and ‖E‖₂ = 0.3 with E symmetric. What is the largest possible top eigenvalue of A + E?</p>,
      answer: { kind: "numeric", value: 9.3, tolerance: 1e-9 },
    },
    {
      key: "dk",
      rung: "check",
      prompt: <p>The top eigenvalue gap is 2 and ‖E‖₂ = 0.5. What upper bound on sin θ does the Davis–Kahan theorem above give?</p>,
      answer: { kind: "numeric", value: 0.3333333, tolerance: 1e-4 },
    },
    {
      key: "fragile",
      rung: "apply",
      prompt: <p>A = I (2×2). For a tiny ε &gt; 0, how far does the top eigenvector of A + ε[[0, 1], [1, 0]] lie from (1, 0)?</p>,
      answer: { kind: "choice", options: ["45°, however small ε is", "about ε radians", "0, it stays at (1, 0)", "about ε² radians"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def weyl_check(A, E):
    shift = np.abs(np.linalg.eigvalsh(A + E) - np.linalg.eigvalsh(A)).max()
    return float(shift), float(np.linalg.norm(E, 2))

def eig_angle(u, v):
    u, v = np.asarray(u, dtype=float), np.asarray(v, dtype=float)
    c = abs(u @ v) / (np.linalg.norm(u) * np.linalg.norm(v))
    return float(np.arccos(min(c, 1.0)))

A = np.diag([3.0, 1.0])
E = np.array([[0.0, 0.5], [0.5, 0.0]])
shift, size = weyl_check(A, E)
print(round(shift, 4), size)
print(round(np.degrees(eig_angle([1.0, 0.0], [1.0, 1.0])), 4), round(np.degrees(eig_angle([1.0, 0.0], [-1.0, 0.0])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.118 0.5\n45.0 0.0", "0.5 0.5\n45.0 0.0", "0.118 0.5\n45.0 180.0", "0.118 0.25\n45.0 0.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def top_vec_sin(A, E):
    u = np.linalg.eigh(A)[1][:, -1]
    w = np.linalg.eigh(A + E)[1][:, -1]
    return float(np.sqrt(max(0.0, 1 - (u @ w) ** 2)))

def dk_bound(A, E):
    lam = np.linalg.eigvalsh(A)
    gap, e = lam[-1] - lam[-2], np.linalg.norm(E, 2)
    return float(e / (gap - e)) if e < gap else float("inf")

A = np.diag([3.0, 1.0])
E = np.array([[0.0, 0.5], [0.5, 0.0]])
print(round(top_vec_sin(A, E), 4), round(dk_bound(A, E), 4))
print(dk_bound(np.diag([1.2, 1.0]), E), round(top_vec_sin(np.diag([1.2, 1.0]), E), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.2298 0.3333\ninf 0.634", "0.3333 0.2298\ninf 0.634", "0.2298 0.3333\n-0.7143 0.634", "0.2298 0.25\ninf 0.2298"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>weyl_check(A, E)</C>, returning (largest |λₖ(A + E) − λₖ(A)| over k, ‖E‖₂) as floats for symmetric A, E,
          and <C>eig_angle(u, v)</C>, the angle in radians between the lines spanned by u and v (so it lies in [0, π/2]).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def weyl_check(A, E):
    return 0.0, 0.0

def eig_angle(u, v):
    return float(np.arccos(np.dot(u, v)))
`,
        solution: WEYL,
        tests: [
          { name: "weyl", code: `rng = np.random.default_rng(0)
for _ in range(5):
    X = rng.normal(size=(5, 5)); A = X + X.T
    Y = 0.1 * rng.normal(size=(5, 5)); E = Y + Y.T
    shift, size = weyl_check(A, E)
    assert 0 < shift <= size + 1e-12 and np.isclose(size, np.linalg.norm(E, 2))
assert np.allclose(weyl_check(np.diag([3.0, 1.0]), 0.2 * np.eye(2)), (0.2, 0.2))` },
          { name: "angle", code: `assert np.isclose(eig_angle([1.0, 0.0], [1.0, 1.0]), np.pi / 4)
assert np.isclose(eig_angle([1.0, 0.0], [-3.0, 0.0]), 0.0)
assert np.isclose(eig_angle([1.0, 0.0], [0.0, -2.0]), np.pi / 2)
assert eig_angle([1.0, 1e-9], [1.0, 1e-9]) >= 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>top_vec_sin(A, E)</C>, the sine of the angle between the top eigenvectors of A and A + E (via{" "}
          <C>np.linalg.eigh</C>), and <C>dk_bound(A, E)</C>, the bound ‖E‖₂/(δ − ‖E‖₂) with δ the gap between the two largest
          eigenvalues of A, or <C>float(&quot;inf&quot;)</C> when ‖E‖₂ ≥ δ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def top_vec_sin(A, E):
    return 0.0

def dk_bound(A, E):
    return float(np.linalg.norm(E, 2))
`,
        solution: `import numpy as np

${DK}`,
        tests: [
          { name: "values", code: `A = np.diag([3.0, 1.0]); E = np.array([[0.0, 0.5], [0.5, 0.0]])
assert np.isclose(top_vec_sin(A, E), np.sin(0.5 * np.arctan(0.5)))
assert np.isclose(dk_bound(A, E), 1 / 3)
assert dk_bound(np.diag([1.2, 1.0]), E) == float("inf")` },
          { name: "bound holds", code: `rng = np.random.default_rng(1)
Q, _ = np.linalg.qr(rng.normal(size=(6, 6)))
A = Q @ np.diag([5.0, 3.0, 2.0, 1.0, 0.5, 0.0]) @ Q.T
for scale in (0.01, 0.1, 0.5):
    Y = scale * rng.normal(size=(6, 6)); E = (Y + Y.T) / 2
    b = dk_bound(A, E)
    assert top_vec_sin(A, E) <= b + 1e-12 and top_vec_sin(A, E) >= 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove Weyl&apos;s inequality |λₖ(A + E) − λₖ(A)| ≤ ‖E‖₂ for symmetric A and E, using the Courant–Fischer theorem.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that for unit x, xᵀ(A + E)x = xᵀAx + xᵀEx with |xᵀEx| ≤ ‖E‖₂.",
          "Concludes that for every subspace U, max over U of the Rayleigh quotient of A + E lies within ‖E‖₂ of that of A.",
          "Uses λₖ = min over k-dimensional U of max over U (Courant–Fischer) to transfer the bound to λₖ, in both directions.",
        ],
      },
    },
    {
      key: "sigma",
      rung: "stretch",
      prompt: <p>A has singular values 5 and 2, and ‖E‖₂ = 0.5. What is the smallest possible value of σ₂(A + E)?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend why eigenvalues of symmetric matrices move by at most the size of the perturbation, why eigenvectors can move much more, and how the eigenvalue gap controls them.",

  glimpse: (
    <>
      <p>
        Perturbation bounds for eigenproblems have a counterpart for linear systems. If Ax = b and b changes by a small
        relative amount, the solution can change by that amount times <M>{"\\sigma_1/\\sigma_n"}</M>, the condition number.
        It also governs how fast gradient descent converges on a quadratic, which is why it is the last lesson of this
        chapter.
      </p>
      <p>
        The eigenspace version of Davis–Kahan measures distance between subspaces by principal angles, whose cosines are the singular values
        of <M>{"U^\\top\\hat U"}</M>, which return when comparing learned representations across networks.
      </p>
    </>
  ),
};
