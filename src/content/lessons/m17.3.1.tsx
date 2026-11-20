import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WideNetGpViz } from "@/components/viz/WideNetGpViz";
import type { LessonContent } from "@/lib/types";

const KERNELS = `import math

def relu_expect(k11, k12, k22):
    r = math.sqrt(k11 * k22)
    t = math.acos(max(-1.0, min(1.0, k12 / r)))
    return r * (math.sin(t) + (math.pi - t) * math.cos(t)) / (2 * math.pi)

def next_kernel(k11, k12, k22, sw2, sb2):
    return (sw2 * relu_expect(k11, k11, k11) + sb2, sw2 * relu_expect(k11, k12, k22) + sb2, sw2 * relu_expect(k22, k22, k22) + sb2)

def deep_kernel(x, y, L, sw2, sb2):
    d = len(x)
    k = (sw2 * sum(a * a for a in x) / d + sb2, sw2 * sum(a * b for a, b in zip(x, y)) / d + sb2, sw2 * sum(b * b for b in y) / d + sb2)
    for _ in range(L):
        k = next_kernel(*k, sw2, sb2)
    return k[1]`;

const POSTERIOR = `def solve(A, b):
    n = len(b)
    M = [list(map(float, A[i])) + [float(b[i])] for i in range(n)]
    for i in range(n):
        for r in range(i + 1, n):
            f = M[r][i] / M[i][i]
            M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))) / M[i][i]
    return x

def gp_mean(K, ks, y, noise):
    n = len(y)
    a = solve([[K[i][j] + (noise if i == j else 0) for j in range(n)] for i in range(n)], y)
    return sum(k * v for k, v in zip(ks, a))

def gp_var(K, ks, kss, noise):
    n = len(ks)
    a = solve([[K[i][j] + (noise if i == j else 0) for j in range(n)] for i in range(n)], ks)
    return kss - sum(k * v for k, v in zip(ks, a))`;

export const lesson: LessonContent = {
  id: "m17.3.1",
  minutes: 50,
  links: {
    requires: ["m17.2.1", "l2.3.3"],
    revisits: ["m7.7.2", "m16.5.4"],
    foreshadows: ["m17.3.2"],
  },

  puzzle: (
    <>
      <p>
        A neural network with random weights is a random function. For a narrow network that random function is a strange
        object, with heavy tails and kinks wherever a unit switches on. Yet as the width grows, something remarkable
        happens: the joint distribution of its values at any finite set of inputs becomes exactly Gaussian, with a covariance
        that can be written in closed form. Why, and what does that say about Bayesian neural networks?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The output of a one-hidden-layer network is a sum of n independent terms, one per hidden unit, divided by √n. The
        central limit theorem does the rest: the output at one input tends to a Gaussian, and the outputs at several inputs
        tend to a jointly Gaussian vector. A family of jointly Gaussian values indexed by inputs is a Gaussian process, fully
        described by its covariance function, the kernel.
      </p>
      <WideNetGpViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the one-layer limit (Neal)">
        <p>
          Let <M>{"f(x) = \\frac{1}{\\sqrt n}\\sum_{j=1}^n v_j\\, \\phi(w_j \\cdot x + b_j)"}</M> with all <M>{"(v_j, w_j, b_j)"}</M> independent,{" "}
          <M>{"v_j"}</M> of mean 0 and variance <M>{"\\sigma_v^2"}</M>. As <M>{"n \\to \\infty"}</M>, for any inputs <M>{"x_1, \\dots, x_k"}</M> the vector{" "}
          <M>{"(f(x_1), \\dots, f(x_k))"}</M> converges in distribution to <M>{"N(0, K)"}</M> with
        </p>
        <MD>{"K(x, x') = \\sigma_v^2\\, \\mathbb E\\big[\\phi(w\\cdot x + b)\\,\\phi(w \\cdot x' + b)\\big]."}</MD>
      </Theorem>
      <Proof>
        <p>
          For fixed coefficients <M>{"a_1, \\dots, a_k"}</M>, <M>{"\\sum_i a_i f(x_i) = n^{-1/2}\\sum_j \\xi_j"}</M> with{" "}
          <M>{"\\xi_j = v_j \\sum_i a_i \\phi(w_j\\cdot x_i + b_j)"}</M> independent, identically distributed and of mean zero because <M>{"v_j"}</M> is
          independent of the rest. Its variance is <M>{"\\sum_{i,i'} a_i a_{i'} K(x_i, x_{i'})"}</M>. The central limit theorem (m7.7.2) gives a
          Gaussian limit for every such combination, and by the Cramér–Wold device the vector is jointly Gaussian with
          covariance K. For Gaussian <M>{"v"}</M> the fourth cumulant of <M>{"\\xi"}</M> is finite, and the excess kurtosis of <M>{"f(x)"}</M> is that of{" "}
          <M>{"\\xi"}</M> divided by n, so the approach is at rate 1/n.
        </p>
      </Proof>

      <Definition title="the deep kernel recursion">
        <p>
          For a deep network <M>{"h^{l+1} = W^{l+1}\\phi(h^l)/\\sqrt{n_l} + b^{l+1}"}</M> with weight variance <M>{"\\sigma_w^2"}</M> and bias variance{" "}
          <M>{"\\sigma_b^2"}</M>, set <M>{"K^0(x, x') = \\sigma_w^2\\, x\\cdot x'/d + \\sigma_b^2"}</M> and
        </p>
        <MD>{"K^{l+1}(x, x') = \\sigma_w^2\\, \\mathbb E_{(u, u') \\sim N(0, K^l|_{x, x'})}\\big[\\phi(u)\\phi(u')\\big] + \\sigma_b^2."}</MD>
        <p>
          This is the two-input version of the length and correlation maps of m17.2.1 and m17.2.2, now carried out at every
          pair of inputs rather than only at the fixed point.
        </p>
      </Definition>

      <Theorem title="deep networks are Gaussian processes">
        <p>
          As the hidden widths tend to infinity, one after another or all together, the output of the deep network converges
          to a centred Gaussian process with kernel <M>{"K^L"}</M>, the neural network Gaussian process (NNGP) kernel.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sequential limits: by induction, if the units of layer l are independent Gaussian processes with kernel{" "}
          <M>{"K^l"}</M>, then each unit of layer l + 1 is a sum of <M>{"n_l"}</M> independent terms <M>{"W_{ij}\\phi(h^l_j)"}</M> plus a bias, and the
          one-layer theorem applies with the inner Gaussian expectation, giving independent Gaussian processes with kernel{" "}
          <M>{"K^{l+1}"}</M>. The simultaneous limit needs more care, because at finite width the units of a layer are dependent through
          the layer below, but the conclusion is the same.
        </p>
      </Proof>

      <Example title="the ReLU arc-cosine kernel">
        <p>
          For ReLU and <M>{"(u, u')"}</M> Gaussian with variances <M>{"k_{11}, k_{22}"}</M> and covariance <M>{"k_{12} = \\sqrt{k_{11}k_{22}}\\cos\\theta"}</M>,
        </p>
        <MD>{"\\mathbb E[\\mathrm{relu}(u)\\,\\mathrm{relu}(u')] = \\frac{\\sqrt{k_{11}k_{22}}}{2\\pi}\\big(\\sin\\theta + (\\pi - \\theta)\\cos\\theta\\big)"}</MD>
        <p>
          (<C>relu_expect</C>), so the whole recursion is explicit (<C>next_kernel</C>, <C>deep_kernel</C>). In the viz the hidden layer
          has <M>{"w, b \\sim N(0, 1)"}</M> and scalar input, so <M>{"k_{11} = x^2 + 1"}</M> and <M>{"k_{12} = xx' + 1"}</M>; the output weights have
          variance 1 and no bias.
        </p>
        <Code>{KERNELS}</Code>
      </Example>

      <Theorem title="Bayesian inference in the limit">
        <p>
          Put the initialisation distribution as a prior on the weights, and observe <M>{"y_i = f(x_i) + \\varepsilon_i"}</M> with{" "}
          <M>{"\\varepsilon_i \\sim N(0, \\sigma^2)"}</M>. In the infinite-width limit the posterior predictive at a new input <M>{"x_*"}</M> is Gaussian with
        </p>
        <MD>{"\\text{mean } k_*^\\top (K + \\sigma^2 I)^{-1} y, \\qquad \\text{variance } K(x_*, x_*) - k_*^\\top (K + \\sigma^2 I)^{-1} k_*,"}</MD>
        <p>
          where <M>{"K"}</M> is the kernel matrix of the training inputs and <M>{"k_*"}</M> the vector of kernels between <M>{"x_*"}</M> and them
          (<C>solve</C>, <C>gp_mean</C>, <C>gp_var</C>).
        </p>
        <Code>{POSTERIOR}</Code>
      </Theorem>
      <Proof>
        <p>
          The prior on <M>{"(f(x_1), \\dots, f(x_m), f(x_*))"}</M> is jointly Gaussian with covariance built from K, and the observations add
          independent Gaussian noise. Conditioning a joint Gaussian on some of its coordinates gives the stated mean and
          variance, exactly as in Gaussian process regression (l2.3.3).
        </p>
      </Proof>

      <Remark title="what the limit loses">
        <p>
          In the limit every hidden layer&apos;s representation is described by a fixed deterministic kernel: nothing about it
          depends on the data. An infinitely wide Bayesian network therefore does no feature learning; it is a kernel method
          with a particular kernel, as random features were in m16.5.4. NNGP kernels are surprisingly competitive on small
          datasets, but finite trained networks beat them on large ones, which already shows that something important lives
          in the finite-width corrections.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kurt",
      rung: "check",
      prompt: (
        <p>
          In the viz&apos;s network all weights are Gaussian and the hidden units are ReLU. For hidden width 12, what is the excess
          kurtosis of f(x)? Use <M>{"\\mathbb E[\\mathrm{relu}(u)^4] = 6\\,(\\mathbb E[\\mathrm{relu}(u)^2])^2"}</M> for centred Gaussian u.
        </p>
      ),
      answer: { kind: "numeric", value: 1.25, tolerance: 0.0001 },
    },
    {
      key: "cross",
      rung: "check",
      prompt: <p>For the viz&apos;s network, compute the limiting covariance K(2, −1) between f(2) and f(−1). Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.2787, tolerance: 0.0002 },
    },
    {
      key: "features",
      rung: "apply",
      prompt: <p>Why is an infinitely wide Bayesian neural network said to do no feature learning?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its hidden layers are described by fixed kernels that do not depend on the data, so prediction is a kernel method with a fixed kernel",
          "Its weights are never updated by the posterior",
          "Its output is always zero in expectation",
          "Its kernel matrix is the identity, so all inputs look unrelated",
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

def relu_expect(k11, k12, k22):
    r = math.sqrt(k11 * k22)
    t = math.acos(max(-1.0, min(1.0, k12 / r)))
    return r * (math.sin(t) + (math.pi - t) * math.cos(t)) / (2 * math.pi)

def next_kernel(k11, k12, k22, sw2, sb2):
    return (sw2 * relu_expect(k11, k11, k11) + sb2, sw2 * relu_expect(k11, k12, k22) + sb2, sw2 * relu_expect(k22, k22, k22) + sb2)

def deep_kernel(x, y, L, sw2, sb2):
    d = len(x)
    k = (sw2 * sum(a * a for a in x) / d + sb2, sw2 * sum(a * b for a, b in zip(x, y)) / d + sb2, sw2 * sum(b * b for b in y) / d + sb2)
    for _ in range(L):
        k = next_kernel(*k, sw2, sb2)
    return k[1]

print(round(relu_expect(1, 1, 1), 4), round(relu_expect(1, 0, 1), 4), round(relu_expect(4, -2, 1), 4))
print(next_kernel(2, 2, 2, 2.0, 0.0), round(deep_kernel([3, 1], [3, 1], 2, 2.0, 0.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.1592 0.0\n(2.0, 2.0, 2.0) 10.0",
          "0.5 0.0 0.0\n(2.0, 2.0, 2.0) 10.0",
          "1.0 0.1592 0.0\n(1.0, 1.0, 1.0) 2.5",
          "0.5 0.1592 0.5\n(2.0, 2.0, 2.0) 20.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def solve(A, b):
    n = len(b)
    M = [list(map(float, A[i])) + [float(b[i])] for i in range(n)]
    for i in range(n):
        for r in range(i + 1, n):
            f = M[r][i] / M[i][i]
            M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))) / M[i][i]
    return x

def gp_mean(K, ks, y, noise):
    n = len(y)
    a = solve([[K[i][j] + (noise if i == j else 0) for j in range(n)] for i in range(n)], y)
    return sum(k * v for k, v in zip(ks, a))

def gp_var(K, ks, kss, noise):
    n = len(ks)
    a = solve([[K[i][j] + (noise if i == j else 0) for j in range(n)] for i in range(n)], ks)
    return kss - sum(k * v for k, v in zip(ks, a))

K = [[2, 1], [1, 2]]; print(gp_mean(K, [1, 0], [3, 0], 0), round(gp_var(K, [1, 0], 1, 0), 4), gp_mean(K, [1, 0], [3, 0], 1))
print(solve([[4]], [2]), gp_var([[1]], [1], 1, 0), round(gp_var([[1]], [0.5], 1, 3), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 0.3333 1.125\n[0.5] 0.0 0.9375",
          "1.5 0.5 1.0\n[0.5] 0.0 0.9375",
          "2.0 0.3333 1.125\n[2.0] 1.0 0.75",
          "2.0 0.6667 1.125\n[0.5] 0.0 0.9375",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relu_expect(k11, k12, k22)</C>, the arc-cosine expectation; <C>next_kernel(k11, k12, k22, sw2, sb2)</C> returning the
          next layer&apos;s triple; and <C>deep_kernel(x, y, L, sw2, sb2)</C> returning the cross kernel after L layers, starting from{" "}
          <M>{"K^0"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def relu_expect(k11, k12, k22):
    return 0.0

def next_kernel(k11, k12, k22, sw2, sb2):
    return (k11, k12, k22)

def deep_kernel(x, y, L, sw2, sb2):
    return 0.0
`,
        solution: KERNELS,
        tests: [
          { name: "expect", code: `assert abs(relu_expect(2, 2, 2) - 1) < 1e-9 and abs(relu_expect(1, 0, 1) - 1 / (2 * math.pi)) < 1e-12` },
          { name: "recursion", code: `a, b, c = next_kernel(1, 0, 1, 2.0, 0.5)\nassert abs(a - 1.5) < 1e-9 and abs(b - (1 / math.pi + 0.5)) < 1e-9 and abs(deep_kernel([2, 0], [2, 0], 3, 2.0, 0.0) - 4) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve(A, b)</C> by Gaussian elimination without pivoting, and the posterior <C>gp_mean(K, ks, y, noise)</C> and{" "}
          <C>gp_var(K, ks, kss, noise)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def solve(A, b):
    return list(b)

def gp_mean(K, ks, y, noise):
    return 0.0

def gp_var(K, ks, kss, noise):
    return kss
`,
        solution: POSTERIOR,
        tests: [
          { name: "solve", code: `x = solve([[2, 1], [1, 3]], [3, 5])\nassert abs(x[0] - 0.8) < 1e-12 and abs(x[1] - 1.4) < 1e-12` },
          { name: "posterior", code: `assert abs(gp_mean([[1]], [0.5], [2], 1) - 0.5) < 1e-12 and abs(gp_var([[1, 0], [0, 1]], [1, 1], 3, 0) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "deep5",
      rung: "stretch",
      prompt: (
        <p>
          A five-layer ReLU network has <M>{"\\sigma_w^2 = 2"}</M> and <M>{"\\sigma_b^2 = 0.1"}</M>. Two inputs are (1, 0) and (0, 1). Compute{" "}
          <M>{"K^5"}</M> and give the correlation <M>{"K^5(x, x')/\\sqrt{K^5(x, x)K^5(x', x')}"}</M> to three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.81, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The NNGP describes a wide network before training. Train it by gradient descent instead of Bayesian inference, and a
        second kernel appears, built from gradients rather than activations: the neural tangent kernel.
      </p>
    </>
  ),
};
