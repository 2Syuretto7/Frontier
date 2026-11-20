import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FlowDensityViz } from "@/components/viz/FlowDensityViz";
import type { LessonContent } from "@/lib/types";

const FLOW = `import math

def log_std_normal(z):
    return -0.5 * math.log(2 * math.pi) - z * z / 2

def flow_sample(z, layers):
    for forward, inverse, log_det in layers:
        z = forward(z)
    return z

def flow_logp(x, layers):
    total = 0.0
    for forward, inverse, log_det in reversed(layers):
        x = inverse(x)
        total += log_det(x)
    return log_std_normal(x) - total`;

const JAC = `def jacobian(f, z, h=1e-6):
    n = len(z)
    cols = []
    for j in range(n):
        up = [v + (h if i == j else 0) for i, v in enumerate(z)]
        dn = [v - (h if i == j else 0) for i, v in enumerate(z)]
        cols.append([(a - b) / (2 * h) for a, b in zip(f(up), f(dn))])
    return [[cols[j][i] for j in range(n)] for i in range(len(cols[0]))]

def det(M):
    A, n, d = [row[:] for row in M], len(M), 1.0
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(A[r][c]))
        if A[p][c] == 0:
            return 0.0
        if p != c:
            A[c], A[p], d = A[p], A[c], -d
        d *= A[c][c]
        for r in range(c + 1, n):
            t = A[r][c] / A[c][c]
            A[r] = [a - t * b for a, b in zip(A[r], A[c])]
    return d

def is_lower_triangular(M, tol=1e-6):
    return all(abs(M[i][j]) <= tol for i in range(len(M)) for j in range(i + 1, len(M)))`;

export const lesson: LessonContent = {
  id: "l7.4.1",
  minutes: 45,
  links: {
    requires: ["l7.1.2", "m13.2.1"],
    revisits: ["l7.3.1", "l7.2.1"],
    foreshadows: ["l7.4.2", "l7.4.3", "l12.2.1"],
  },

  puzzle: (
    <>
      <p>
        Draw z from a standard normal and output x = 2z + 1. The output is normal with mean 1 and standard deviation 2, so its
        peak density is half that of z: stretching the line by a factor of 2 spreads the same probability over twice the
        length. Now replace 2z + 1 by a deep network. If the network is invertible, can the density of its output be computed
        exactly, and what would that cost for a million-dimensional image?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Probability is conserved. A small interval around z holding probability <M>{"p(z)\\,dz"}</M> is mapped to an interval
        around x = f(z) of length <M>{"|f'(z)|\\,dz"}</M>, holding the same probability, so the density there is{" "}
        <M>{"p(z) / |f'(z)|"}</M>. In many dimensions the stretch factor of a small box is the absolute value of the determinant
        of the Jacobian. Chaining invertible layers multiplies stretch factors, so log-densities add up layer by layer.
      </p>
      <p>
        A <em>normalising flow</em> is such a chain. It has an exact likelihood, like an autoregressive model, and one-pass
        sampling, like a VAE&apos;s decoder. The price is that every layer must be invertible with a determinant that is cheap to
        compute.
      </p>
      <FlowDensityViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="change of variables">
        <p>
          Let <M>{"f: \\mathbb{R}^d \\to \\mathbb{R}^d"}</M> be invertible and differentiable with differentiable inverse, z have
          density <M>{"p_Z"}</M> and x = f(z). Then
        </p>
        <MD>{"p_X(x) = p_Z(f^{-1}(x))\\, \\big|\\det J_{f^{-1}}(x)\\big|, \\qquad \\log p_X(x) = \\log p_Z(z) - \\log \\big|\\det J_f(z)\\big| \\text{ with } z = f^{-1}(x)."}</MD>
      </Theorem>
      <Proof>
        <p>
          For any region S, <M>{"P(x \\in S) = P(z \\in f^{-1}(S)) = \\int_{f^{-1}(S)} p_Z(z)\\, dz"}</M>. Substituting z = f⁻¹(x), the
          multivariable change-of-variables rule for integrals gives <M>{"\\int_S p_Z(f^{-1}(x)) |\\det J_{f^{-1}}(x)|\\, dx"}</M>, so
          the integrand is the density of x. The inverse function theorem gives{" "}
          <M>{"J_{f^{-1}}(x) = J_f(z)^{-1}"}</M>, and the determinant of an inverse is the reciprocal of the determinant, which gives
          the second form. In one dimension the determinant is just <M>{"f'(z)"}</M>.
        </p>
      </Proof>

      <Theorem title="composition">
        <p>
          For <M>{"f = f_K \\circ \\dots \\circ f_1"}</M> with intermediate values <M>{"z_0 = z"}</M> and <M>{"z_k = f_k(z_{k-1})"}</M>,
        </p>
        <MD>{"\\log p_X(x) = \\log p_Z(z_0) - \\sum_{k=1}^{K} \\log \\big|\\det J_{f_k}(z_{k-1})\\big|."}</MD>
      </Theorem>
      <Proof>
        <p>
          The chain rule gives <M>{"J_f(z) = J_{f_K}(z_{K-1}) \\cdots J_{f_1}(z_0)"}</M>, and the determinant of a product is the
          product of determinants, whose logarithm is the sum. In code, the density is evaluated by inverting the layers from
          last to first, accumulating each layer&apos;s log-determinant at its input (<C>flow_logp</C>); sampling runs the layers
          forwards (<C>flow_sample</C>).
        </p>
        <Code>{FLOW}</Code>
      </Proof>

      <Definition title="normalising flow">
        <p>
          A normalising flow is a base distribution, usually <M>{"\\mathcal{N}(0, I)"}</M>, and a composition of invertible layers
          with parameters θ, trained by maximising the exact log-likelihood of the data. The name refers to the inverse direction:
          the flow maps complex data to normal noise. Data and code have the same dimension, and the map is a bijection, so there
          is no compression and no posterior to approximate.
        </p>
      </Definition>

      <Remark title="the cost of a determinant">
        <p>
          For a general d by d Jacobian, computing it takes d backward passes (<C>jacobian</C>) and its determinant{" "}
          <M>{"O(d^3)"}</M> arithmetic by elimination (<C>det</C>). For a 256 by 256 colour image, d ≈ 200 000, which rules this
          out. Flow layers are therefore designed so that the Jacobian is triangular (<C>is_lower_triangular</C>), whose
          determinant is the product of the diagonal, or so that the log-determinant has another cheap form. Autoregressive
          maps <M>{"x_i = \\tau(z_i; x_{<i})"}</M> have triangular Jacobians by construction, linking flows to l7.2.1.
        </p>
        <Code>{JAC}</Code>
      </Remark>

      <Remark title="limits">
        <p>
          A continuous bijection preserves topology: a flow from a single Gaussian cannot exactly split it into disconnected
          pieces, only thin the density between them with very steep layers, as in the viz. And dimension is preserved, so a
          flow must spend capacity describing directions in which the data barely vary. These limits, and the cost of
          invertibility, are why flows were overtaken by diffusion models for images, though their ideas return in flow
          matching (l12.2.1).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "affine",
      rung: "check",
      prompt: <p>z is standard normal and x = 3z − 2. What is the density of x at x = −2? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.133, tolerance: 0.0001 },
    },
    {
      key: "stack",
      rung: "check",
      prompt: <p>A flow is ten layers, each multiplying every input by 1.5 in one dimension. What is the total log-determinant in nats? Give three decimals.</p>,
      answer: { kind: "numeric", value: 4.055, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can&apos;t a normalising flow use an ordinary decoder that maps a 64-dimensional code to a 3072-dimensional image?</p>,
      answer: {
        kind: "choice",
        options: [
          "The change-of-variables formula needs an invertible map between spaces of equal dimension; such a decoder has no inverse and its outputs fill no volume",
          "The determinant of the decoder would be negative",
          "The decoder would sample too slowly",
          "The base distribution must have more dimensions than the data",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def log_std_normal(z):
    return -0.5 * math.log(2 * math.pi) - z * z / 2

def flow_sample(z, layers):
    for forward, inverse, log_det in layers:
        z = forward(z)
    return z

def flow_logp(x, layers):
    total = 0.0
    for forward, inverse, log_det in reversed(layers):
        x = inverse(x)
        total += log_det(x)
    return log_std_normal(x) - total

aff = (lambda z: 2 * z + 1, lambda x: (x - 1) / 2, lambda z: math.log(2)); ex = (math.exp, math.log, lambda z: z)
print(round(flow_logp(1.0, [ex]), 4), round(flow_logp(3.0, [aff]), 4), round(flow_sample(0.5, [aff, ex]), 4), round(flow_logp(math.e ** 2, [aff, ex]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.9189 -2.1121 7.3891 -3.7371",
          "-0.9189 -0.7258 7.3891 -3.7371",
          "-0.9189 -2.1121 4.4817 -3.7371",
          "-0.9189 -2.1121 7.3891 -1.7371",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def jacobian(f, z, h=1e-6):
    n = len(z)
    cols = []
    for j in range(n):
        up = [v + (h if i == j else 0) for i, v in enumerate(z)]
        dn = [v - (h if i == j else 0) for i, v in enumerate(z)]
        cols.append([(a - b) / (2 * h) for a, b in zip(f(up), f(dn))])
    return [[cols[j][i] for j in range(n)] for i in range(len(cols[0]))]

def det(M):
    A, n, d = [row[:] for row in M], len(M), 1.0
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(A[r][c]))
        if A[p][c] == 0:
            return 0.0
        if p != c:
            A[c], A[p], d = A[p], A[c], -d
        d *= A[c][c]
        for r in range(c + 1, n):
            t = A[r][c] / A[c][c]
            A[r] = [a - t * b for a, b in zip(A[r], A[c])]
    return d

def is_lower_triangular(M, tol=1e-6):
    return all(abs(M[i][j]) <= tol for i in range(len(M)) for j in range(i + 1, len(M)))

J = jacobian(lambda z: [z[0] ** 2, z[0] + z[1]], [1.0, 2.0]); print([[round(v, 4) for v in row] for row in J])
print(round(det(J), 4), is_lower_triangular(J), det([[1, 2], [3, 4]]), det([[0, 1], [1, 0]]), det([[1, 2], [2, 4]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[2.0, 0.0], [1.0, 1.0]]\n2.0 True -2.0 -1.0 0.0",
          "[[2.0, 1.0], [0.0, 1.0]]\n2.0 False -2.0 -1.0 0.0",
          "[[2.0, 0.0], [1.0, 1.0]]\n2.0 True -2.0 0.0 0.0",
          "[[2.0, 0.0], [1.0, 1.0]]\n2.0 True 2.0 -1.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Each layer is a tuple <C>(forward, inverse, log_det)</C>, where <C>log_det(z)</C> is the log absolute derivative of{" "}
          <C>forward</C> at z. Write <C>log_std_normal(z)</C>, <C>flow_sample(z, layers)</C> applying the layers in order, and{" "}
          <C>flow_logp(x, layers)</C> for a standard normal base.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_std_normal(z):
    return 0.0

def flow_sample(z, layers):
    return z

def flow_logp(x, layers):
    return log_std_normal(x)
`,
        solution: FLOW,
        tests: [
          { name: "base and sampling", code: `assert abs(log_std_normal(0) + 0.5 * math.log(2 * math.pi)) < 1e-12 and abs(log_std_normal(2) - log_std_normal(0) + 2) < 1e-12
sq = (lambda z: z + 3, lambda x: x - 3, lambda z: 0.0); tw = (lambda z: 2 * z, lambda x: x / 2, lambda z: math.log(2))
assert flow_sample(1, [sq, tw]) == 8 and flow_sample(1, [tw, sq]) == 5 and flow_sample(4, []) == 4` },
          { name: "density", code: `sq = (lambda z: z + 3, lambda x: x - 3, lambda z: 0.0); tw = (lambda z: 2 * z, lambda x: x / 2, lambda z: math.log(2))
assert abs(flow_logp(8, [sq, tw]) - (log_std_normal(1) - math.log(2))) < 1e-12 and abs(flow_logp(5, [tw, sq]) - (log_std_normal(1) - math.log(2))) < 1e-12
cube = (lambda z: z ** 3, lambda x: math.copysign(abs(x) ** (1 / 3), x), lambda z: math.log(3 * z * z))
assert abs(flow_logp(8, [cube]) - (log_std_normal(2) - math.log(12))) < 1e-9 and abs(flow_logp(-1, [tw, cube]) - (log_std_normal(-0.5) - math.log(2) - math.log(3))) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jacobian(f, z, h=1e-6)</C> by central differences, where f maps a list to a list and entry [i][j] is{" "}
          <M>{"\\partial f_i / \\partial z_j"}</M>; <C>det(M)</C> by elimination with partial pivoting; and{" "}
          <C>is_lower_triangular(M, tol=1e-6)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def jacobian(f, z, h=1e-6):
    return [[1.0 if i == j else 0.0 for j in range(len(z))] for i in range(len(z))]

def det(M):
    return M[0][0] * M[1][1] - M[0][1] * M[1][0]

def is_lower_triangular(M, tol=1e-6):
    return True
`,
        solution: JAC,
        tests: [
          { name: "jacobian", code: `J = jacobian(lambda z: [3 * z[0] + z[1], z[1] ** 2], [1.0, 2.0])
assert all(abs(a - b) < 1e-6 for a, b in zip(J[0] + J[1], [3, 1, 0, 4])) and not is_lower_triangular(J) and is_lower_triangular([[1, 0], [5, 2]])` },
          { name: "determinant", code: `assert abs(det([[2, 0, 0], [7, 3, 0], [1, 1, 4]]) - 24) < 1e-12 and abs(det([[0, 0, 1], [0, 1, 0], [1, 0, 0]]) + 1) < 1e-12
assert abs(det([[5]]) - 5) < 1e-12 and det([[1, 2], [2, 4]]) == 0.0 and abs(det([[0, 2], [3, 1]]) + 6) < 1e-12` },
        ],
      },
    },
    {
      key: "lognormal",
      rung: "stretch",
      prompt: <p>z is standard normal and x = exp(z). What is the density of x at x = e? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.089, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Which invertible layers have cheap determinants and are still expressive? The next lesson builds the coupling layer,
        whose Jacobian is triangular by construction and whose inverse costs no more than its forward pass.
      </p>
    </>
  ),
};
