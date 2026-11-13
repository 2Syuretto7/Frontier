import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KernelRingViz } from "@/components/viz/KernelRingViz";
import type { LessonContent } from "@/lib/types";

const KERN = `import numpy as np

def poly_features(x):
    a, b = x
    r = np.sqrt(2)
    return np.array([1, r * a, r * b, a * a, b * b, r * a * b])

def poly_kernel(x, z, d=2):
    return float((1 + x @ z) ** d)

def rbf_gram(X, Z, gamma):
    sq = (X ** 2).sum(axis=1)[:, None] + (Z ** 2).sum(axis=1)[None, :] - 2 * X @ Z.T
    return np.exp(-gamma * np.maximum(sq, 0))`;

const KRR = `import numpy as np

def kernel_ridge_fit(K, y, lam):
    return np.linalg.solve(K + lam * np.eye(len(y)), y)

def kernel_ridge_predict(K_new, alpha):
    return K_new @ alpha`;

export const lesson: LessonContent = {
  id: "l2.3.2",
  minutes: 60,
  links: {
    requires: ["l2.3.1", "l2.1.3"],
    revisits: ["m6.3.4", "m6.2.1", "l1.2.3"],
    foreshadows: ["l2.3.3"],
  },

  puzzle: (
    <>
      <p>
        Two classes sit in concentric rings, so no line separates them. Adding the features x₁², x₂² and x₁x₂ would make a
        circle into a line, but with 100 input features the degree-3 polynomial features number over 170,000, and for some
        useful feature maps the count is infinite. How can a linear method work in such a space without ever writing a
        feature vector down?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Many linear methods, rewritten in the right form, touch the data only through inner products between pairs of
        points. If those inner products can be computed directly from the original inputs, the feature vectors never need
        to exist. A kernel is such a shortcut: a function k(x, z) that equals the inner product of φ(x) and φ(z) for some
        feature map φ, often far cheaper than computing φ.
      </p>
      <KernelRingViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the SVM dual">
        <p>The soft-margin SVM is equivalent to the dual problem</p>
        <MD>{"\\max_{\\alpha} \\sum_i \\alpha_i - \\frac12\\sum_{i,j}\\alpha_i\\alpha_j y_iy_j\\, x_i^\\top x_j \\quad\\text{s.t.}\\quad 0 \\leq \\alpha_i \\leq C,\\ \\sum_i \\alpha_iy_i = 0,"}</MD>
        <p>
          with <M>{"w = \\sum_i \\alpha_iy_ix_i"}</M>. At the optimum, <M>{"\\alpha_i > 0"}</M> only for points with{" "}
          <M>{"y_if(x_i) \\leq 1"}</M>, the support vectors.
        </p>
      </Theorem>
      <Proof>
        <p>
          Introduce multipliers <M>{"\\alpha_i \\geq 0"}</M> for <M>{"y_if(x_i) \\geq 1 - \\xi_i"}</M> and{" "}
          <M>{"\\mu_i \\geq 0"}</M> for <M>{"\\xi_i \\geq 0"}</M>. The Lagrangian is{" "}
          <M>{"\\tfrac12\\|w\\|^2 + C\\sum\\xi_i - \\sum\\alpha_i(y_i(w^\\top x_i + b) - 1 + \\xi_i) - \\sum\\mu_i\\xi_i"}</M>.
          Setting its derivatives to zero gives <M>{"w = \\sum\\alpha_iy_ix_i"}</M> from w,{" "}
          <M>{"\\sum\\alpha_iy_i = 0"}</M> from b, and <M>{"\\alpha_i = C - \\mu_i \\leq C"}</M> from <M>{"\\xi_i"}</M>.
          Substituting back leaves the stated objective. The problem is convex with affine constraints, so strong duality
          holds, and complementary slackness says <M>{"\\alpha_i(y_if(x_i) - 1 + \\xi_i) = 0"}</M>: a point with{" "}
          <M>{"y_if(x_i) > 1"}</M> has <M>{"\\xi_i = 0"}</M> and so <M>{"\\alpha_i = 0"}</M>.
        </p>
      </Proof>
      <Remark title="only inner products">
        <p>
          The dual objective uses the data only through <M>{"x_i^\\top x_j"}</M>, and predictions are{" "}
          <M>{"f(x) = \\sum_i \\alpha_iy_i\\,x_i^\\top x + b"}</M>, again inner products. Replace every{" "}
          <M>{"x^\\top z"}</M> by <M>{"k(x, z)"}</M> and the SVM runs in the feature space of k.
        </p>
      </Remark>

      <Definition title="kernel">
        <p>
          A function k is a kernel if <M>{"k(x, z) = \\varphi(x)^\\top\\varphi(z)"}</M> for some feature map φ into an inner
          product space. Equivalently (Mercer), every Gram matrix <M>{"K_{ij} = k(x_i, x_j)"}</M> is symmetric positive
          semidefinite. Examples: the polynomial kernel <M>{"(1 + x^\\top z)^d"}</M>, whose features are all monomials up to
          degree d with suitable weights, and the RBF kernel <M>{"e^{-\\gamma\\|x - z\\|^2}"}</M>, whose feature space is
          infinite-dimensional. Sums, products and positive multiples of kernels are kernels.
        </p>
      </Definition>
      <Example title="checking the trick">
        <p>
          For two-dimensional inputs, <M>{"(1 + x^\\top z)^2 = \\varphi(x)^\\top\\varphi(z)"}</M> with{" "}
          <M>{"\\varphi(x) = (1, \\sqrt2x_1, \\sqrt2x_2, x_1^2, x_2^2, \\sqrt2x_1x_2)"}</M>: expand the square and match terms.
          The code confirms both sides give 0.25 and builds an RBF Gram matrix without loops.
        </p>
        <Code>{KERN}</Code>
      </Example>

      <Theorem title="ridge regression in dual form">
        <p>
          For λ &gt; 0, the ridge solution <M>{"w = (X^\\top X + \\lambda I)^{-1}X^\\top y"}</M> equals <M>{"X^\\top\\alpha"}</M>{" "}
          with <M>{"\\alpha = (XX^\\top + \\lambda I)^{-1}y"}</M>, so predictions are{" "}
          <M>{"f(x) = \\sum_i \\alpha_i\\, x_i^\\top x"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The identity <M>{"(X^\\top X + \\lambda I)X^\\top = X^\\top X X^\\top + \\lambda X^\\top = X^\\top(XX^\\top + \\lambda I)"}</M>{" "}
          holds by expanding both sides. Both bracketed matrices are positive definite, hence invertible; multiply on the left
          by <M>{"(X^\\top X + \\lambda I)^{-1}"}</M> and on the right by <M>{"(XX^\\top + \\lambda I)^{-1}"}</M> to get{" "}
          <M>{"X^\\top(XX^\\top + \\lambda I)^{-1} = (X^\\top X + \\lambda I)^{-1}X^\\top"}</M>, and apply both sides to y.
        </p>
        <p>
          Replacing <M>{"XX^\\top"}</M> with a Gram matrix K gives kernel ridge regression:{" "}
          <M>{"\\alpha = (K + \\lambda I)^{-1}y"}</M> and <M>{"f(x) = \\sum_i\\alpha_ik(x_i, x)"}</M>.
        </p>
        <Code>{KRR}</Code>
      </Proof>
      <Remark title="costs and behaviour">
        <p>
          The dual form costs <M>{"O(n^3)"}</M> time and <M>{"O(n^2)"}</M> memory in the number of examples, independent of
          the feature dimension, which makes kernels attractive for small n and rich features and impractical for millions
          of points without approximations. With an RBF kernel the prediction far from all data is a sum of tiny terms and
          returns to 0, as the code&apos;s prediction at x = 10 shows; the prior mean of the next lesson makes this explicit.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "poly",
      rung: "check",
      prompt: <p>Evaluate the kernel (1 + xᵀz)² for x = (1, 1) and z = (2, 0).</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.0001 },
    },
    {
      key: "rbf",
      rung: "check",
      prompt: <p>Evaluate the RBF kernel e^(−γ‖x − z‖²) with γ = 1 for two points at distance 1. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3679, tolerance: 0.0001 },
    },
    {
      key: "sv",
      rung: "apply",
      prompt: <p>In the SVM dual, which training points end up with αᵢ &gt; 0?</p>,
      answer: {
        kind: "choice",
        options: ["Only points with yᵢf(xᵢ) ≤ 1, the support vectors", "Every training point", "Only misclassified points", "Only points far from the boundary"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def poly_features(x):
    a, b = x
    r = np.sqrt(2)
    return np.array([1, r * a, r * b, a * a, b * b, r * a * b])

def poly_kernel(x, z, d=2):
    return float((1 + x @ z) ** d)

def rbf_gram(X, Z, gamma):
    sq = (X ** 2).sum(axis=1)[:, None] + (Z ** 2).sum(axis=1)[None, :] - 2 * X @ Z.T
    return np.exp(-gamma * np.maximum(sq, 0))

x, z = np.array([1.0, 2.0]), np.array([0.5, -1.0])
print(poly_kernel(x, z), round(float(poly_features(x) @ poly_features(z)), 6))
P = np.array([[0.0, 0.0], [1.0, 0.0], [0.0, 2.0]]); print(np.round(rbf_gram(P, P, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.25 0.25\n[[1.     0.6065 0.1353]\n [0.6065 1.     0.0821]\n [0.1353 0.0821 1.    ]]", "0.25 -1.5\n[[1.     0.6065 0.1353]\n [0.6065 1.     0.0821]\n [0.1353 0.0821 1.    ]]", "0.25 0.25\n[[1.     0.6065 0.3679]\n [0.6065 1.     0.2865]\n [0.3679 0.2865 1.    ]]", "2.25 2.25\n[[1.     0.6065 0.1353]\n [0.6065 1.     0.0821]\n [0.1353 0.0821 1.    ]]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def poly_features(x):
    a, b = x
    r = np.sqrt(2)
    return np.array([1, r * a, r * b, a * a, b * b, r * a * b])

def poly_kernel(x, z, d=2):
    return float((1 + x @ z) ** d)

def rbf_gram(X, Z, gamma):
    sq = (X ** 2).sum(axis=1)[:, None] + (Z ** 2).sum(axis=1)[None, :] - 2 * X @ Z.T
    return np.exp(-gamma * np.maximum(sq, 0))

import numpy as np

def kernel_ridge_fit(K, y, lam):
    return np.linalg.solve(K + lam * np.eye(len(y)), y)

def kernel_ridge_predict(K_new, alpha):
    return K_new @ alpha

rng = np.random.default_rng(0); X = rng.normal(size=(20, 3)); y = rng.normal(size=20); Xn = rng.normal(size=(4, 3))
w = np.linalg.solve(X.T @ X + 0.5 * np.eye(3), X.T @ y); a = kernel_ridge_fit(X @ X.T, y, 0.5)
print(np.allclose(Xn @ w, kernel_ridge_predict(Xn @ X.T, a)), a.shape)
xs = np.linspace(0, 6, 25)[:, None]; a = kernel_ridge_fit(rbf_gram(xs, xs, 2.0), np.sin(xs[:, 0]), 1e-3)
print(np.round(kernel_ridge_predict(rbf_gram(np.array([[1.0], [10.0]]), xs, 2.0), a), 3) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True (20,)\n[0.841 0.   ]", "True (3,)\n[0.841 0.   ]", "False (20,)\n[0.841 0.   ]", "True (20,)\n[0.841 -0.544]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>poly_features(x)</C>, the six features of a 2D input whose inner products give (1 + xᵀz)²,{" "}
          <C>poly_kernel(x, z, d=2)</C> as a float, and <C>rbf_gram(X, Z, gamma)</C>, the matrix of e^(−γ‖xᵢ − zⱼ‖²)
          computed without Python loops.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def poly_features(x):
    return np.zeros(6)

def poly_kernel(x, z, d=2):
    return 0.0

def rbf_gram(X, Z, gamma):
    return np.zeros((len(X), len(Z)))
`,
        solution: KERN,
        tests: [
          { name: "poly", code: `rng = np.random.default_rng(1); x, z = rng.normal(size=2), rng.normal(size=2)
assert abs(poly_features(x) @ poly_features(z) - poly_kernel(x, z)) < 1e-10 and poly_kernel(np.array([1.0, 1.0]), np.array([2.0, 0.0])) == 9.0 and poly_kernel(x, z, 3) == (1 + x @ z) ** 3` },
          { name: "rbf", code: `X = np.array([[0.0, 0.0], [3.0, 4.0]]); K = rbf_gram(X, X[:1], 0.04)
assert K.shape == (2, 1) and np.allclose(K[:, 0], [1.0, np.exp(-1.0)])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kernel_ridge_fit(K, y, lam)</C>, returning α = (K + λI)⁻¹y computed with a linear solve, and{" "}
          <C>kernel_ridge_predict(K_new, alpha)</C>, where row i of K_new holds the kernel values between new point i and the
          training points.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kernel_ridge_fit(K, y, lam):
    return np.zeros(len(y))

def kernel_ridge_predict(K_new, alpha):
    return np.zeros(len(K_new))
`,
        solution: KRR,
        tests: [
          { name: "linear", code: `rng = np.random.default_rng(2); X = rng.normal(size=(8, 2)); y = rng.normal(size=8)
w = np.linalg.solve(X.T @ X + 2.0 * np.eye(2), X.T @ y)
assert np.allclose(kernel_ridge_predict(X @ X.T, kernel_ridge_fit(X @ X.T, y, 2.0)), X @ w)` },
          { name: "interp", code: `K = np.array([[1.0, 0.5], [0.5, 1.0]]); a = kernel_ridge_fit(K, np.array([1.0, 2.0]), 1e-12)
assert np.allclose(kernel_ridge_predict(K, a), [1.0, 2.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For λ &gt; 0, prove that (XᵀX + λI)⁻¹Xᵀy = Xᵀ(XXᵀ + λI)⁻¹y, so ridge regression predictions depend on X only through inner products.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Verifies (XᵀX + λI)Xᵀ = Xᵀ(XXᵀ + λI) by expanding both sides.",
          "Notes both bracketed matrices are positive definite for λ > 0, so invertible, and multiplies by the two inverses to get (XᵀX + λI)⁻¹Xᵀ = Xᵀ(XXᵀ + λI)⁻¹.",
          "Concludes that w = Xᵀα with α = (XXᵀ + λI)⁻¹y, so a prediction xᵀw = Σαᵢ xᵢᵀx uses only inner products.",
        ],
      },
    },
    {
      key: "dim",
      rung: "stretch",
      prompt: <p>How many distinct monomials of degree at most 2 are there in 10 variables, which is the dimension of the feature space of (1 + xᵀz)² on 10-dimensional inputs?</p>,
      answer: { kind: "numeric", value: 66, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend how the SVM dual shows that only inner products matter, what a kernel is and why its Gram matrices are positive semidefinite, how ridge regression becomes kernel ridge regression, and what kernels cost.",

  glimpse: (
    <>
      <p>
        Kernel ridge regression gives a mean prediction but no uncertainty. Treat the kernel as the covariance of a random
        function, and the same algebra becomes Gaussian process regression, with error bars that widen away from the data.
      </p>
    </>
  ),
};
