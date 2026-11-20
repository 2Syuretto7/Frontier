import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TransposeCorrectionViz } from "@/components/viz/TransposeCorrectionViz";
import type { LessonContent } from "@/lib/types";

const ZCALC = `import math
ZS = [-6 + (i + 0.5) * 0.05 for i in range(240)]
WS = [math.exp(-z * z / 2) * 0.05 / math.sqrt(2 * math.pi) for z in ZS]

def gauss_expect(f, var):
    return sum(w * f(math.sqrt(var) * z) for z, w in zip(ZS, WS))

def z_forward(phi, vx, sw2):
    return sw2 * gauss_expect(lambda z: phi(z) ** 2, sw2 * vx)

def z_transpose(phi, dphi, vx, sw2):
    slope = sw2 * gauss_expect(dphi, sw2 * vx)
    return slope, z_forward(phi, vx, sw2)`;

const FINITE = `def mat_t_vec(W, v):
    return [sum(W[i][j] * v[i] for i in range(len(W))) for j in range(len(W[0]))]

def slope_fit(xs, us):
    return sum(x * u for x, u in zip(xs, us)) / sum(x * x for x in xs)

def coord_moment(v, k):
    return sum(a ** k for a in v) / len(v)`;

export const lesson: LessonContent = {
  id: "m17.4.3",
  minutes: 55,
  links: {
    requires: ["m17.4.1", "m17.3.2"],
    revisits: ["m18.6.1", "m7.7.2"],
    foreshadows: ["m17.6.3"],
  },

  puzzle: (
    <>
      <p>
        The Gaussian process limit, the tangent kernel, mean-field signal propagation and μP were each derived with their own
        argument, often leaning on a convenient assumption: that the transposed weight matrix in backpropagation behaves like
        a fresh independent one. Is there one calculus that produces all these limits, for any architecture, and tells us
        exactly when that assumption is wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Almost every computation in a neural network is a matrix multiplication or a coordinatewise function. When the
        width is large and the weights random, each vector produced has coordinates that look like independent draws of one
        scalar random variable, so a whole layer is described by a single number&apos;s distribution. Tensor Programs give the
        rules that track these random variables through the computation, including the subtle correction that appears
        when a matrix is reused transposed.
      </p>
      <TransposeCorrectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tensor programs">
        <p>
          A tensor program starts from vectors in <M>{"\\mathbb R^n"}</M> with independent Gaussian coordinates and matrices{" "}
          <M>{"W \\in \\mathbb R^{n\\times n}"}</M> with independent <M>{"N(0, \\sigma_W^2/n)"}</M> entries, and generates new vectors by two
          instructions:
        </p>
        <ul>
          <li><strong>MatMul</strong>: <M>{"Wx"}</M> or <M>{"W^\\top x"}</M> for an initial matrix W and an existing vector x;</li>
          <li><strong>Nonlin</strong>: <M>{"\\phi(x^1, \\dots, x^k)"}</M> applied coordinatewise to existing vectors.</li>
        </ul>
        <p>
          Forward passes, backpropagation and any fixed number of gradient steps of most architectures, including
          transformers, can be written this way.
        </p>
      </Definition>

      <Theorem title="the master theorem (Yang)">
        <p>
          Assign to every vector x a random variable <M>{"Z^x"}</M> by the rules: <M>{"Z^{\\phi(x^1, \\dots)} = \\phi(Z^{x^1}, \\dots)"}</M>; and{" "}
          <M>{"Z^{Wx} = \\hat Z^{Wx} + \\dot Z^{Wx}"}</M>, where the <M>{"\\hat Z"}</M> of all products by one matrix are jointly Gaussian, centred, with{" "}
          <M>{"\\operatorname{Cov}(\\hat Z^{Wx}, \\hat Z^{Wy}) = \\sigma_W^2\\, \\mathbb E[Z^x Z^y]"}</M>, independent across different matrices and of the initial
          vectors, and the correction is
        </p>
        <MD>{"\\dot Z^{Wx} = \\sum_{y} Z^{y}\; \\sigma_W^2\\, \\mathbb E\\Big[\\frac{\\partial Z^x}{\\partial \\hat Z^{W^\\top y}}\\Big],"}</MD>
        <p>
          summed over the vectors y for which <M>{"W^\\top y"}</M> was computed earlier (and symmetrically for products by{" "}
          <M>{"W^\\top"}</M>). Then for any vectors <M>{"x^1, \\dots, x^k"}</M> of the program and any polynomially bounded ψ,
        </p>
        <MD>{"\\frac1n \\sum_{i=1}^n \\psi(x^1_i, \\dots, x^k_i) \\xrightarrow{\\text{a.s.}} \\mathbb E\\, \\psi(Z^{x^1}, \\dots, Z^{x^k}) \\qquad (n \\to \\infty)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The full proof is an induction over the program using Gaussian conditioning, and we show its key step on the
          program of the viz: <M>{"y = Wx"}</M>, <M>{"v = \\phi(y)"}</M>, <M>{"u = W^\\top v"}</M>. Conditioned on <M>{"Wx = y"}</M>, the Gaussian matrix
          splits as <M>{"W = \\frac{y x^\\top}{\\|x\\|^2} + \\tilde W \\big(I - \\frac{x x^\\top}{\\|x\\|^2}\\big)"}</M> with <M>{"\\tilde W"}</M> an independent copy. Hence
        </p>
        <MD>{"u = W^\\top v = x\\, \\frac{y \\cdot v}{\\|x\\|^2} + \\Big(I - \\frac{xx^\\top}{\\|x\\|^2}\\Big)\\tilde W^\\top v."}</MD>
        <p>
          The second term is a fresh Gaussian vector (up to a rank-one projection that changes no coordinate distribution),
          giving <M>{"\\hat Z^u"}</M> with variance <M>{"\\sigma_W^2 \\mathbb E[\\phi(Z^y)^2]"}</M>. In the first, by the strong law (m18.6.1),{" "}
          <M>{"\\frac{y\\cdot v}{\\|x\\|^2} = \\frac{\\frac1n\\sum y_i\\phi(y_i)}{\\frac1n \\sum x_i^2} \\to \\frac{\\mathbb E[Z^y\\phi(Z^y)]}{\\mathbb E[(Z^x)^2]}"}</M>, and
          Stein&apos;s identity <M>{"\\mathbb E[Z\\phi(Z)] = \\operatorname{Var}(Z)\\,\\mathbb E[\\phi'(Z)]"}</M> with{" "}
          <M>{"\\operatorname{Var}(Z^y) = \\sigma_W^2 \\mathbb E[(Z^x)^2]"}</M> turns this into <M>{"\\sigma_W^2 \\mathbb E[\\phi'(Z^y)]"}</M>, the correction{" "}
          <M>{"\\dot Z^u = \\sigma_W^2\\, \\mathbb E[\\phi'(Z^y)]\\, Z^x"}</M>.
        </p>
      </Proof>

      <Example title="the three-line program">
        <p>
          With <M>{"\\sigma_W^2 = 1"}</M> and standard normal <M>{"x"}</M>, the theorem predicts <M>{"Z^u = c\\,Z^x + \\hat Z"}</M> with{" "}
          <M>{"c = \\mathbb E[\\phi'(Z)]"}</M> and <M>{"\\operatorname{Var}\\hat Z = \\mathbb E[\\phi(Z)^2]"}</M>, Z standard normal (<C>gauss_expect</C>,{" "}
          <C>z_forward</C>, <C>z_transpose</C>). For φ the identity, u = <M>{"W^\\top W x"}</M>, slope 1 and residual variance 1, which also
          follows from the Marchenko–Pastur law; for ReLU both are ½. The finite-n quantities in the viz are a regression
          through the origin and coordinate moments (<C>mat_t_vec</C>, <C>slope_fit</C>, <C>coord_moment</C>).
        </p>
        <Code>{ZCALC}</Code>
        <Code>{FINITE}</Code>
      </Example>

      <Remark title="what the calculus unifies">
        <p>
          A forward pass uses each matrix once and never its transpose, so only the <M>{"\\hat Z"}</M> rule applies, and the coordinates of
          every layer are Gaussian with the covariance recursion of m17.3.1: the NNGP limit is a one-line corollary.
          Including the backward pass gives the tangent kernel and its constancy. Tracking the program through gradient steps
          under different scalings classifies all width parametrisations and singles out μP as the one with maximal feature
          learning. The gradient independence assumption, treating <M>{"W^\\top"}</M> as fresh, amounts to dropping <M>{"\\dot Z"}</M>; it gives
          correct answers for quantities like the gradient norms of m17.2.2 when the readout layer is independent with mean
          zero, because there the correction terms average out, but in programs like the viz&apos;s it is simply wrong.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lin",
      rung: "check",
      prompt: (
        <p>
          In the program <M>{"u = W^\\top \\phi(Wx)"}</M> with φ the identity, <M>{"\\sigma_W^2 = 0.5"}</M> and x coordinates of variance 3, what is the
          limiting variance of a coordinate of u?
        </p>
      ),
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "frac",
      rung: "check",
      prompt: (
        <p>
          With φ = ReLU, <M>{"\\sigma_W^2 = 2"}</M> and x of unit variance, what fraction of the variance of <M>{"Z^u"}</M> comes from the
          correction term <M>{"\\dot Z^u"}</M>? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0002 },
    },
    {
      key: "gia",
      rung: "apply",
      prompt: <p>What does the gradient independence assumption get wrong in the viz&apos;s program?</p>,
      answer: {
        kind: "choice",
        options: [
          "It drops the term c·x, predicting that u is uncorrelated with x, while reusing W makes u = c·x plus independent noise",
          "It gets the mean of u wrong",
          "It predicts u is Gaussian when it is not",
          "Nothing: the assumption is exact for this program",
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
ZS = [-6 + (i + 0.5) * 0.05 for i in range(240)]
WS = [math.exp(-z * z / 2) * 0.05 / math.sqrt(2 * math.pi) for z in ZS]

def gauss_expect(f, var):
    return sum(w * f(math.sqrt(var) * z) for z, w in zip(ZS, WS))

def z_forward(phi, vx, sw2):
    return sw2 * gauss_expect(lambda z: phi(z) ** 2, sw2 * vx)

def z_transpose(phi, dphi, vx, sw2):
    slope = sw2 * gauss_expect(dphi, sw2 * vx)
    return slope, z_forward(phi, vx, sw2)

print(round(gauss_expect(lambda z: z * z, 2.0), 4), round(gauss_expect(lambda z: 1.0 if z > 0 else 0.0, 3.0), 4), round(z_forward(lambda z: z, 2.0, 1.5), 4))
s, h = z_transpose(lambda z: z, lambda z: 1.0, 1.0, 1.0); print(round(s, 4), round(h, 4), [round(t, 4) for t in z_transpose(lambda z: max(0.0, z), lambda z: 1.0 if z > 0 else 0.0, 2.0, 1.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 0.5 4.5\n1.0 1.0 [0.5, 1.0]",
          "2.0 0.5 3.0\n1.0 1.0 [0.5, 1.0]",
          "1.4142 0.5 4.5\n1.0 1.0 [0.5, 0.5]",
          "2.0 0.5 4.5\n0.0 1.0 [0.5, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mat_t_vec(W, v):
    return [sum(W[i][j] * v[i] for i in range(len(W))) for j in range(len(W[0]))]

def slope_fit(xs, us):
    return sum(x * u for x, u in zip(xs, us)) / sum(x * x for x in xs)

def coord_moment(v, k):
    return sum(a ** k for a in v) / len(v)

print(mat_t_vec([[1, 2], [3, 4]], [1, 1]), slope_fit([1, 2], [3, 5]), coord_moment([1, -1, 2], 2), coord_moment([1, 2, 3], 3))
D = [[2, 0], [0, 3]]; print(mat_t_vec(D, mat_t_vec(D, [1, 1])), slope_fit([1, 1], mat_t_vec(D, mat_t_vec(D, [1, 1]))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 6] 2.6 2.0 12.0\n[4, 9] 6.5",
          "[3, 7] 2.6 2.0 12.0\n[4, 9] 6.5",
          "[4, 6] 2.6 0.6667 12.0\n[4, 9] 6.5",
          "[4, 6] 2.6 2.0 12.0\n[2, 3] 2.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          On the midpoint grid, write <C>gauss_expect(f, var)</C> for <M>{"\\mathbb E f(Z)"}</M>, <M>{"Z \\sim N(0, \\text{var})"}</M>;{" "}
          <C>z_forward(phi, vx, sw2)</C>, the variance <M>{"\\sigma_W^2\\mathbb E[\\phi(Z^{Wx})^2]"}</M> of the next MatMul; and{" "}
          <C>z_transpose(phi, dphi, vx, sw2)</C> returning (slope, variance of <M>{"\\hat Z"}</M>) for <M>{"u = W^\\top\\phi(Wx)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
ZS = [-6 + (i + 0.5) * 0.05 for i in range(240)]
WS = [math.exp(-z * z / 2) * 0.05 / math.sqrt(2 * math.pi) for z in ZS]

def gauss_expect(f, var):
    return f(0.0)

def z_forward(phi, vx, sw2):
    return sw2 * vx

def z_transpose(phi, dphi, vx, sw2):
    return 0.0, z_forward(phi, vx, sw2)
`,
        solution: ZCALC,
        tests: [
          { name: "expect", code: `assert abs(gauss_expect(lambda z: z ** 4, 0.5) - 0.75) < 1e-5 and abs(z_forward(lambda z: max(0.0, z), 4.0, 0.5) - 0.5) < 1e-5` },
          { name: "transpose", code: `s, h = z_transpose(lambda z: 2 * z, lambda z: 2.0, 1.0, 3.0)\nassert abs(s - 6) < 1e-6 and abs(h - 36) < 1e-5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mat_t_vec(W, v)</C> computing <M>{"W^\\top v"}</M> for a list of rows, <C>slope_fit(xs, us)</C>, the least squares slope through
          the origin, and <C>coord_moment(v, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mat_t_vec(W, v):
    return [sum(W[i][j] * v[j] for j in range(len(v))) for i in range(len(W))]

def slope_fit(xs, us):
    return 0.0

def coord_moment(v, k):
    return 0.0
`,
        solution: FINITE,
        tests: [
          { name: "transpose", code: `assert mat_t_vec([[1, 2, 3], [4, 5, 6]], [1, -1]) == [-3, -3, -3]` },
          { name: "stats", code: `assert abs(slope_fit([1, -2, 2], [1, -1, 3]) - 1.0) < 1e-12 and coord_moment([2, -2, 1, 1], 4) == 8.5` },
        ],
      },
    },
    {
      key: "corr",
      rung: "stretch",
      prompt: (
        <p>
          For φ = tanh, <M>{"\\sigma_W^2 = 2"}</M> and x coordinates of variance 0.5, compute the limiting correlation between <M>{"x_j"}</M> and{" "}
          <M>{"u_j"}</M> in <M>{"u = W^\\top\\phi(Wx)"}</M>. Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.694, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Infinite-width theory explains how to scale a network at fixed data. The next part turns to what happens when model
        size, data and compute all grow together: the empirical power laws of scaling and the models that explain them.
      </p>
    </>
  ),
};
