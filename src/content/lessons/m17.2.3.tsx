import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IsometryViz } from "@/components/viz/IsometryViz";
import type { LessonContent } from "@/lib/types";

const MOMENTS = `import math
ZS = [-6 + (i + 0.5) * 0.1 for i in range(120)]
WS = [math.exp(-z * z / 2) * 0.1 / math.sqrt(2 * math.pi) for z in ZS]

def phi_moments(dphi, q):
    m1 = sum(w * dphi(math.sqrt(q) * z) ** 2 for z, w in zip(ZS, WS))
    m2 = sum(w * dphi(math.sqrt(q) * z) ** 4 for z, w in zip(ZS, WS))
    return m1, m2

def critical_sw2(m1):
    return 1 / m1

def jac_variance(m1, m2, L, orthogonal):
    return L * (m2 / m1 ** 2 - 1 + (0 if orthogonal else 1))`;

const PRODUCTS = `def matmul(X, Y):
    return [[sum(X[i][k] * Y[k][j] for k in range(len(Y))) for j in range(len(Y[0]))] for i in range(len(X))]

def jacobian(Ws, ds):
    n = len(Ws[0])
    J = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    for W, d in zip(Ws, ds):
        J = matmul([[d[i] * W[i][j] for j in range(n)] for i in range(n)], J)
    return J

def lam_stats(J):
    G = matmul(J, [list(r) for r in zip(*J)])
    n = len(G)
    m = sum(G[i][i] for i in range(n)) / n
    return m, sum(G[i][j] ** 2 for i in range(n) for j in range(n)) / n - m * m`;

export const lesson: LessonContent = {
  id: "m17.2.3",
  minutes: 50,
  links: {
    requires: ["m17.2.2"],
    revisits: ["m6.6.2", "m6.4.1"],
    foreshadows: ["m17.2.4", "m17.6.1"],
  },

  puzzle: (
    <>
      <p>
        Two 100-layer networks are both initialised exactly at the edge of chaos, so in both the average squared gradient is
        preserved from the last layer to the first. One trains in a few hundred steps; the other barely moves for thousands.
        The only differences are whether the weight matrices are Gaussian or orthogonal and whether the activation is ReLU or
        tanh. If the averages agree, what is different?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A gradient is pushed backwards through the transpose of the input-output Jacobian J. Criticality fixes the average of
        its squared singular values λ at 1, but says nothing about how they are spread. If a few λ are enormous and most are
        tiny, the gradient lives in a handful of directions and the rest of the network is frozen, even though the average
        is perfect. Dynamical isometry asks for the whole distribution of λ to sit near 1. Each layer multiplies the
        spread, so the question is which layers add none.
      </p>
      <IsometryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Jacobian spectrum">
        <p>
          For a network <M>{"h^{l} = W^l \\phi(h^{l-1}) + b^l"}</M>, the Jacobian of the output with respect to the input is the product
        </p>
        <MD>{"J = \\prod_{l=L}^{1} D^l W^l, \\qquad D^l = \\operatorname{diag}\\big(\\phi'(h^{l-1}_i)\\big),"}</MD>
        <p>
          taking <M>{"\\phi(h^0)"}</M> to be the input itself, so <M>{"D^1 = I"}</M>. Its squared singular values are the eigenvalues λ of <M>{"JJ^\\top"}</M>. Define the
          derivative moments at the fixed point, <M>{"\\mu_k = \\mathbb E\\big[\\phi'(\\sqrt{q^*} z)^{2k}\\big]"}</M> (<C>phi_moments</C>), so that criticality reads{" "}
          <M>{"\\sigma_w^2 \\mu_1 = 1"}</M> (<C>critical_sw2</C>). The network has <em>dynamical isometry</em> when the λ concentrate near 1, in
          particular when their variance stays bounded as L grows.
        </p>
      </Definition>

      <Theorem title="the variance of the spectrum">
        <p>
          At criticality, in the limit of infinite width with the weights either Gaussian or Haar orthogonal, the mean of λ is 1 and
        </p>
        <MD>{"\\operatorname{Var}(\\lambda) = L\\Big(\\frac{\\mu_2}{\\mu_1^2} - 1 + s\\Big), \\qquad s = \\begin{cases} 1 & \\text{Gaussian weights,} \\\\ 0 & \\text{orthogonal weights.} \\end{cases}"}</MD>
        <p>(<C>jac_variance</C>.)</p>
        <Code>{MOMENTS}</Code>
      </Theorem>
      <Proof>
        <p>
          In the wide limit the factors <M>{"D^l W^l"}</M> become asymptotically free, a non-commutative analogue of independence for
          large random matrices, and for free factors with mean 1 the variances of the spectra add. So it is enough to find the
          variance contributed by one layer, the variance of the eigenvalues of <M>{"\\sigma_w^2 W^\\top D^2 W"}</M>, where now W has unit
          scale. Its eigenvalues are those of <M>{"\\sigma_w^2 D^2"}</M> combined freely with those of <M>{"W W^\\top"}</M>. The entries of{" "}
          <M>{"\\sigma_w^2 D^2"}</M> are <M>{"\\sigma_w^2\\phi'(h)^2"}</M>, with mean <M>{"\\sigma_w^2\\mu_1 = 1"}</M> and variance{" "}
          <M>{"\\sigma_w^4 \\mu_2 - 1 = \\mu_2/\\mu_1^2 - 1"}</M>. For orthogonal W, <M>{"WW^\\top = I"}</M> has variance 0. For Gaussian W of variance 1/N,{" "}
          <M>{"WW^\\top"}</M> follows the Marchenko–Pastur law with ratio 1, whose mean is 1 and variance is 1. Adding the two and
          multiplying by L gives the formula.
        </p>
      </Proof>

      <Example title="three activations">
        <p>
          <strong>Linear.</strong> <M>{"\\phi' = 1"}</M>, so <M>{"\\mu_2/\\mu_1^2 = 1"}</M>. Gaussian weights give variance L; orthogonal weights give
          exactly <M>{"JJ^\\top = I"}</M>, perfect isometry at any depth.
        </p>
        <p>
          <strong>ReLU.</strong> <M>{"\\phi'^2"}</M> is 0 or 1 with probability ½ each, so <M>{"\\mu_1 = \\mu_2 = 1/2"}</M> and{" "}
          <M>{"\\mu_2/\\mu_1^2 = 2"}</M>. The variance is at least L whatever the weights. Each layer kills half the coordinates, and no
          choice of W undoes that.
        </p>
        <p>
          <strong>tanh.</strong> <M>{"\\phi'(0) = 1"}</M> and <M>{"\\phi'"}</M> is smooth, so <M>{"\\mu_2/\\mu_1^2 \\to 1"}</M> as <M>{"q^* \\to 0"}</M>. With
          orthogonal weights and the biases tuned so that <M>{"q^*"}</M> is small while <M>{"\\sigma_w^2\\mu_1 = 1"}</M>, the variance per layer
          can be made as small as we like. This recipe, adapted to convolutions, has trained 10 000-layer tanh networks without residual
          connections or normalisation.
        </p>
      </Example>

      <Remark title="checking it on small matrices">
        <p>
          The mean and variance of the λ need no eigenvalue computation:{" "}
          <M>{"\\bar\\lambda = \\operatorname{tr}(G)/N"}</M> and <M>{"\\overline{\\lambda^2} = \\operatorname{tr}(G^2)/N = \\sum_{ij} G_{ij}^2/N"}</M> for{" "}
          <M>{"G = JJ^\\top"}</M>. The code builds J layer by layer and reads off these traces (<C>matmul</C>, <C>jacobian</C>,{" "}
          <C>lam_stats</C>).
        </p>
        <Code>{PRODUCTS}</Code>
      </Remark>

      <Remark title="why the spread matters for training">
        <p>
          Gradient descent on the first layers moves along <M>{"J^\\top"}</M> applied to the output error. Directions with tiny λ receive
          almost no signal, and directions with huge λ force a small learning rate. The ratio of the largest to the smallest
          useful λ acts as a condition number for the early phase of training, which is why isometric initialisations have
          been seen to speed up learning by orders of magnitude at large depth. The theorem is about initialisation only:
          training moves the weights and the spectrum with them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lin25",
      rung: "check",
      prompt: <p>A wide linear network of depth 25 has critical Gaussian weights. What is the variance of λ?</p>,
      answer: { kind: "numeric", value: 25, tolerance: 0.0001 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          A critical network has <M>{"\\mu_2/\\mu_1^2 = 1.05"}</M>, depth 60 and Gaussian weights. What is the wide-limit variance of λ?
        </p>
      ),
      answer: { kind: "numeric", value: 63, tolerance: 0.0001 },
    },
    {
      key: "relu",
      rung: "apply",
      prompt: <p>Why can a deep ReLU network not reach dynamical isometry by switching to orthogonal weights?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each layer's derivative matrix zeroes about half the coordinates, adding variance to the spectrum that no choice of W removes",
          "Orthogonal matrices cannot be made critical for ReLU",
          "ReLU networks have χ₁ greater than 1 for every weight variance",
          "The mean of λ grows exponentially with depth for ReLU",
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
ZS = [-6 + (i + 0.5) * 0.1 for i in range(120)]
WS = [math.exp(-z * z / 2) * 0.1 / math.sqrt(2 * math.pi) for z in ZS]

def phi_moments(dphi, q):
    m1 = sum(w * dphi(math.sqrt(q) * z) ** 2 for z, w in zip(ZS, WS))
    m2 = sum(w * dphi(math.sqrt(q) * z) ** 4 for z, w in zip(ZS, WS))
    return m1, m2

def critical_sw2(m1):
    return 1 / m1

def jac_variance(m1, m2, L, orthogonal):
    return L * (m2 / m1 ** 2 - 1 + (0 if orthogonal else 1))

m1, m2 = phi_moments(lambda z: 1.0, 0.7); print(round(m1, 4), round(m2, 4), critical_sw2(0.5), jac_variance(1.0, 1.0, 10, True), jac_variance(1.0, 1.0, 10, False))
r1, r2 = phi_moments(lambda z: 1.0 if z > 0 else 0.0, 1.0); print(round(r1, 4), round(jac_variance(r1, r2, 8, True), 4), round(jac_variance(r1, r2, 8, False), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.0 2.0 0.0 10.0\n0.5 8.0 16.0",
          "1.0 1.0 0.5 0.0 10.0\n0.5 8.0 16.0",
          "1.0 1.0 2.0 10.0 0.0\n0.5 16.0 8.0",
          "1.0 1.0 2.0 0.0 10.0\n0.5 0.0 8.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matmul(X, Y):
    return [[sum(X[i][k] * Y[k][j] for k in range(len(Y))) for j in range(len(Y[0]))] for i in range(len(X))]

def jacobian(Ws, ds):
    n = len(Ws[0])
    J = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    for W, d in zip(Ws, ds):
        J = matmul([[d[i] * W[i][j] for j in range(n)] for i in range(n)], J)
    return J

def lam_stats(J):
    G = matmul(J, [list(r) for r in zip(*J)])
    n = len(G)
    m = sum(G[i][i] for i in range(n)) / n
    return m, sum(G[i][j] ** 2 for i in range(n) for j in range(n)) / n - m * m

P = [[0, 1], [1, 0]]; print(lam_stats(jacobian([P, P, P], [[1, 1]] * 3)), lam_stats(jacobian([[[2, 0], [0, 1]]], [[1, 1]])))
print(lam_stats(jacobian([P, P], [[2, 0], [1, 1]])), lam_stats(jacobian([[[1, 1], [0, 1]]], [[1, 1]])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1.0, 0.0) (2.5, 2.25)\n(2.0, 4.0) (1.5, 1.25)",
          "(1.0, 0.0) (1.5, 0.25)\n(2.0, 4.0) (1.5, 1.25)",
          "(1.0, 0.0) (2.5, 2.25)\n(1.0, 1.0) (1.0, 0.5)",
          "(0.0, 1.0) (2.5, 2.25)\n(2.0, 4.0) (1.5, 0.25)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          On the midpoint grid ZS with Gaussian weights WS, write <C>phi_moments(dphi, q)</C> returning <M>{"(\\mu_1, \\mu_2)"}</M>,{" "}
          <C>critical_sw2(m1)</C>, and <C>jac_variance(m1, m2, L, orthogonal)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
ZS = [-6 + (i + 0.5) * 0.1 for i in range(120)]
WS = [math.exp(-z * z / 2) * 0.1 / math.sqrt(2 * math.pi) for z in ZS]

def phi_moments(dphi, q):
    return 1.0, 1.0

def critical_sw2(m1):
    return 1.0

def jac_variance(m1, m2, L, orthogonal):
    return 0.0
`,
        solution: MOMENTS,
        tests: [
          { name: "moments", code: `m1, m2 = phi_moments(lambda z: 2.0, 0.3)\nassert abs(m1 - 4) < 1e-6 and abs(m2 - 16) < 1e-5` },
          { name: "variance", code: `assert critical_sw2(0.25) == 4 and abs(jac_variance(1.0, 1.5, 4, True) - 2.0) < 1e-12 and abs(jac_variance(1.0, 1.5, 4, False) - 6.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matmul(X, Y)</C> for lists of lists; <C>jacobian(Ws, ds)</C>, starting from the identity and multiplying on the left
          by <C>diag(d) W</C> for each layer in order; and <C>lam_stats(J)</C>, the mean and variance of the eigenvalues of{" "}
          <M>{"JJ^\\top"}</M> computed from traces.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matmul(X, Y):
    return X

def jacobian(Ws, ds):
    n = len(Ws[0])
    return [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]

def lam_stats(J):
    return 1.0, 0.0
`,
        solution: PRODUCTS,
        tests: [
          { name: "product", code: `assert jacobian([[[0, 1], [1, 0]], [[1, 0], [0, 3]]], [[1, 2], [1, 1]]) == [[0, 1], [6, 0]]` },
          { name: "stats", code: `m, v = lam_stats([[1, 2], [3, 4]])\nassert abs(m - 15) < 1e-9 and abs(v - 221) < 1e-9` },
        ],
      },
    },
    {
      key: "tanh05",
      rung: "stretch",
      prompt: (
        <p>
          A tanh network is tuned to criticality with fixed point <M>{"q^* = 0.5"}</M>. Compute <M>{"\\mu_1"}</M> and <M>{"\\mu_2"}</M>, then the
          wide-limit variance of λ at depth 100 with orthogonal weights. Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 29.92, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        Orthogonal weights and small pre-activations are delicate to maintain. Residual networks reach a similar goal another
        way: each block adds a small update to the identity, and the question becomes how to scale those updates with depth.
      </p>
    </>
  ),
};
