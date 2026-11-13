import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DetGradViz } from "@/components/viz/DetGradViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.4.3",
  minutes: 60,
  links: {
    requires: ["m5.4.1"],
    revisits: ["m3.6.1", "m3.6.3"],
    foreshadows: ["m5.7.3", "m5.6.1"],
  },

  puzzle: (
    <>
      <p>
        Fitting a Gaussian to data, or training a normalising flow, means differentiating log det of a matrix. Expanding the
        determinant would give n! terms.
      </p>
      <p>Yet the gradient of log det X turns out to be a single, familiar matrix. Which one?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The determinant is linear in each entry when the others are fixed, so its partial derivative with respect to an entry
        is the coefficient of that entry: the cofactor. The matrix of cofactors is <M>{"\\det X \\cdot X^{-\\top}"}</M>, and
        dividing by det X for the logarithm leaves <M>{"X^{-\\top}"}</M>.
      </p>
      <DetGradViz />
      <p>
        Norms and traces are easier still: the gradient of a norm is a unit vector pointing outwards, and the trace has the
        identity as its gradient.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="norms and traces">
        <ul>
          <li><M>{"\\nabla_x \\|x\\|_2^2 = 2x"}</M> and, for x ≠ 0, <M>{"\\nabla_x \\|x\\|_2 = x / \\|x\\|_2"}</M>;</li>
          <li><M>{"\\nabla_X \\|X\\|_F^2 = 2X"}</M>, where <M>{"\\|X\\|_F^2 = \\mathrm{tr}(X^\\top X) = \\sum_{ij} X_{ij}^2"}</M>;</li>
          <li><M>{"\\nabla_X \\mathrm{tr}(X) = I"}</M> and <M>{"\\nabla_X \\mathrm{tr}(X^{-1}) = -X^{-2\\top}"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          <M>{"d\\|x\\|^2 = 2x^\\top dx"}</M>, and by the chain rule with the square root,{" "}
          <M>{"d\\|x\\| = \\frac{1}{2\\|x\\|} 2x^\\top dx"}</M>. For the trace of the inverse,{" "}
          <M>{"d\\,\\mathrm{tr}(X^{-1}) = -\\mathrm{tr}(X^{-1} dX\\, X^{-1}) = -\\mathrm{tr}(X^{-2} dX)"}</M> by cycling the
          trace, so the gradient is <M>{"-(X^{-2})^\\top"}</M>.
        </p>
      </Proof>

      <Theorem title="Jacobi's formula">
        <p>For invertible X,</p>
        <MD>{"d \\det X = \\det X \\cdot \\mathrm{tr}(X^{-1} dX), \\qquad \\nabla_X \\det X = \\det X \\cdot X^{-\\top}, \\qquad \\nabla_X \\log|\\det X| = X^{-\\top}."}</MD>
      </Theorem>
      <Proof>
        <p>
          First at the identity: <M>{"\\det(I + tH)"}</M> is a polynomial in t whose coefficient of t comes only from the
          product of the diagonal entries <M>{"\\prod_i (1 + t H_{ii})"}</M>, since every other term in the expansion uses at
          least two off-diagonal entries. So <M>{"\\det(I + tH) = 1 + t\\,\\mathrm{tr} H + O(t^2)"}</M>. In general,{" "}
          <M>{"\\det(X + dX) = \\det X \\det(I + X^{-1}dX) = \\det X\\,(1 + \\mathrm{tr}(X^{-1} dX)) + \\dots"}</M>. Write{" "}
          <M>{"\\mathrm{tr}(X^{-1} dX) = \\mathrm{tr}((X^{-\\top})^\\top dX)"}</M> to read off the gradient. For the logarithm,
          divide by det X.
        </p>
      </Proof>

      <Example title="fitting a covariance">
        <p>
          The negative log-likelihood of zero-mean Gaussian data with sample covariance S is, up to constants and a factor,{" "}
          <M>{"f(\\Sigma) = \\log\\det\\Sigma + \\mathrm{tr}(\\Sigma^{-1} S)"}</M>. Its gradient is{" "}
          <M>{"\\Sigma^{-1} - \\Sigma^{-1} S \\Sigma^{-1}"}</M> for symmetric <M>{"\\Sigma"}</M>, which vanishes exactly when{" "}
          <M>{"\\Sigma = S"}</M>: the maximum-likelihood covariance is the sample covariance.
        </p>
      </Example>

      <Remark title="never compute an inverse you do not need">
        <p>
          In code, <M>{"\\log\\det"}</M> should come from a factorisation (NumPy&rsquo;s <C>slogdet</C>), not from{" "}
          <C>log(det(X))</C>, which overflows for large matrices. Likewise the gradient term <M>{"X^{-1} v"}</M> is a linear
          solve, not an inverse times a vector.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "norm",
      rung: "check",
      prompt: <p>What is the first entry of <M>{"\\nabla \\|x\\|_2"}</M> at x = (3, 4)?</p>,
      answer: { kind: "numeric", value: 0.6, tolerance: 1e-12 },
    },
    {
      key: "trace",
      rung: "check",
      prompt: <p>What is <M>{"\\nabla_X \\mathrm{tr}(X)"}</M> for a square X?</p>,
      answer: { kind: "choice", options: ["The identity I", "X", "Xᵀ", "The matrix of all ones"], correct: [0] },
    },
    {
      key: "logdet",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"X = \\mathrm{diag}(2, 4)"}</M>, what is the (2, 2) entry of <M>{"\\nabla_X \\log\\det X"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-12 },
    },
    {
      key: "cof",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"X = \\begin{pmatrix} 3 & 1 \\\\ 2 & 5 \\end{pmatrix}"}</M>, what is <M>{"\\partial \\det X / \\partial X_{12}"}</M>?
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
X = np.array([[2.0, 1.0], [1.0, 1.0]])
h = 1e-6
E = np.zeros((2, 2))
E[1, 1] = h
num = (np.log(np.linalg.det(X + E)) - np.log(np.linalg.det(X - E))) / (2 * h)
print(round(num, 6), np.linalg.inv(X).T[1, 1])`}</Code>
          <p>One entry of the gradient of log det, two ways. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.0 2.0", "1.0 1.0", "0.5 0.5", "2.0 -1.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
X = np.array([[1.0, 2.0], [2.0, 4.0]])
fro = np.sqrt(np.sum(X ** 2))
print(fro, np.linalg.det(X) == 0, np.round(X / fro, 2))`}</Code>
          <p>The Frobenius norm, its gradient, and a singular matrix. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5.0 True [[0.2 0.4]\n [0.4 0.8]]",
          "25.0 True [[0.04 0.08]\n [0.08 0.16]]",
          "5.0 False [[0.2 0.4]\n [0.4 0.8]]",
          "5.0 True [[1. 2.]\n [2. 4.]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norm_grad(x)</C>, the gradient of <M>{"\\|x\\|_2"}</M>, raising <C>ValueError</C> at x = 0 where it is not
          differentiable; <C>det_grad(X)</C>, the gradient of det X; and <C>logdet_grad(X)</C>, the gradient of{" "}
          <M>{"\\log|\\det X|"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def norm_grad(x):
    return x

def det_grad(X):
    return X

def logdet_grad(X):
    return X
`,
        solution: `import numpy as np

def norm_grad(x):
    x = np.asarray(x, float)
    n = np.linalg.norm(x)
    if n == 0:
        raise ValueError("not differentiable at 0")
    return x / n

def det_grad(X):
    X = np.asarray(X, float)
    return np.linalg.det(X) * np.linalg.inv(X).T

def logdet_grad(X):
    return np.linalg.inv(np.asarray(X, float)).T
`,
        tests: [
          { name: "norm", code: `import numpy as np
assert np.allclose(norm_grad([3.0, 4.0]), [0.6, 0.8])
try:
    norm_grad([0.0, 0.0])
    assert False, 'Raise ValueError at 0.'
except ValueError:
    pass` },
          { name: "determinants", code: `import numpy as np
X = np.array([[3.0, 1.0, 0.0], [2.0, 5.0, 1.0], [0.0, 1.0, 2.0]])
h = 1e-6
num = np.zeros((3, 3))
for i in range(3):
    for j in range(3):
        E = np.zeros((3, 3)); E[i, j] = h
        num[i, j] = (np.linalg.det(X + E) - np.linalg.det(X - E)) / (2 * h)
assert np.allclose(det_grad(X), num, atol=1e-5), 'det X times the inverse transpose.'
assert np.allclose(logdet_grad(X), num / np.linalg.det(X), atol=1e-6)
assert np.allclose(det_grad([[3.0, 1.0], [2.0, 5.0]]), [[5.0, -2.0], [-1.0, 3.0]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gauss_nll(Sigma, S)</C>, returning <M>{"\\log\\det\\Sigma + \\mathrm{tr}(\\Sigma^{-1}S)"}</M> computed with{" "}
          <C>np.linalg.slogdet</C> and a linear solve, and <C>gauss_nll_grad(Sigma, S)</C>, returning{" "}
          <M>{"\\Sigma^{-1} - \\Sigma^{-1} S \\Sigma^{-1}"}</M>. Assume both matrices are symmetric positive definite.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gauss_nll(Sigma, S):
    return 0.0

def gauss_nll_grad(Sigma, S):
    return np.zeros_like(Sigma)
`,
        solution: `import numpy as np

def gauss_nll(Sigma, S):
    Sigma, S = np.asarray(Sigma, float), np.asarray(S, float)
    sign, logdet = np.linalg.slogdet(Sigma)
    return logdet + np.trace(np.linalg.solve(Sigma, S))

def gauss_nll_grad(Sigma, S):
    Sigma, S = np.asarray(Sigma, float), np.asarray(S, float)
    Si = np.linalg.inv(Sigma)
    return Si - Si @ S @ Si
`,
        tests: [
          { name: "value and stationary point", code: `import numpy as np
S = np.array([[2.0, 0.5], [0.5, 1.0]])
assert abs(gauss_nll(np.eye(2), S) - 3.0) < 1e-12
assert np.allclose(gauss_nll_grad(S, S), 0), 'The gradient vanishes at Sigma = S.'
assert gauss_nll(S, S) < gauss_nll(S + 0.1 * np.eye(2), S)` },
          { name: "matches a symmetric perturbation", code: `import numpy as np
S = np.array([[2.0, 0.5], [0.5, 1.0]])
Sig = np.array([[1.5, 0.2], [0.2, 0.8]])
H = np.array([[0.3, -0.1], [-0.1, 0.2]])
t = 1e-6
num = (gauss_nll(Sig + t * H, S) - gauss_nll(Sig - t * H, S)) / (2 * t)
assert abs(num - np.sum(gauss_nll_grad(Sig, S) * H)) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove Jacobi&rsquo;s formula <M>{"d\\det X = \\det X\\,\\mathrm{tr}(X^{-1}dX)"}</M> for invertible X, starting from{" "}
          <M>{"\\det(I + tH) = 1 + t\\,\\mathrm{tr}H + O(t^2)"}</M>, and deduce <M>{"\\nabla_X \\log\\det X = X^{-\\top}"}</M>{" "}
          when det X &gt; 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Justifies det(I + tH) = 1 + t tr H + O(t²), for example by noting only the diagonal product contributes a t¹ term (or via eigenvalues).",
          "Factors det(X + dX) = det X · det(I + X⁻¹dX) using multiplicativity of det.",
          "Concludes d det X = det X · tr(X⁻¹ dX) to first order.",
          "Writes tr(X⁻¹dX) = tr((X⁻ᵀ)ᵀ dX), reads off ∇ det = det X · X⁻ᵀ, and divides by det X (chain rule for log) to get X⁻ᵀ.",
        ],
      },
    },
    {
      key: "ld",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"X = \\begin{pmatrix} 2 & 1 \\\\ 1 & 1 \\end{pmatrix}"}</M>, what is the (1, 2) entry of{" "}
          <M>{"\\nabla_X \\log\\det X"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -1, tolerance: 1e-12 },
    },
  ],

  teachBack:
    "Explain to a friend why the gradient of det X with respect to one entry is that entry's cofactor, and why the gradient of log det X is the inverse transpose.",

  glimpse: (
    <p>
      The most-differentiated function in machine learning is the cross-entropy of a softmax. Next, its gradient, and the
      numerical care it needs.
    </p>
  ),
};
