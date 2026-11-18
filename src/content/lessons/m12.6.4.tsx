import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InfoPlaneViz } from "@/components/viz/InfoPlaneViz";
import type { LessonContent } from "@/lib/types";

const IB = `import numpy as np

def kl_rows(P, Q):
    return np.sum(P[:, None, :] * (np.log(P[:, None, :]) - np.log(Q[None, :, :])), axis=2)

def ib(pxy, k, beta, iters=300, seed=0):
    rng = np.random.default_rng(seed); px = pxy.sum(1); py_x = pxy / px[:, None]
    q = rng.random((len(px), k)); q /= q.sum(1, keepdims=True)
    for _ in range(iters):
        pt = np.maximum(px @ q, 1e-300)
        py_t = np.maximum((q * px[:, None]).T @ py_x / pt[:, None], 1e-300)
        q = pt[None, :] * np.exp(-beta * kl_rows(py_x, py_t)); q /= q.sum(1, keepdims=True)
    return q

def info_terms(pxy, q):
    px, py = pxy.sum(1), pxy.sum(0); pt = px @ q; pty = q.T @ pxy
    a = px[:, None] * q; b = np.outer(pt, py)
    ixt = np.sum(a[a > 0] * np.log2((q / pt[None, :])[a > 0]))
    ity = np.sum(pty[pty > 0] * np.log2(pty[pty > 0] / b[pty > 0]))
    return float(ixt) + 0.0, float(ity) + 0.0`;

const BN = `import numpy as np

def binned_mi(t, bins):
    _, counts = np.unique(np.digitize(t, np.linspace(-1, 1, bins + 1)), return_counts=True)
    p = counts / counts.sum()
    return float(-(p * np.log2(p)).sum())

def saturation_curve(x, ws, bins):
    return [round(binned_mi(np.tanh(w * x), bins), 2) for w in ws]`;

export const lesson: LessonContent = {
  id: "m12.6.4",
  minutes: 55,
  links: {
    requires: ["m12.6.3", "m12.2.4"],
    revisits: ["m12.2.3", "m12.4.3", "m12.6.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        In 2017 a striking claim spread through deep learning: training a network has two phases, first fitting the labels
        and then compressing away information about the input, and this compression is why networks generalise. Plots of
        the &quot;information plane&quot; showed every layer drifting left after a while. A year later another group trained
        the same kind of network with a different activation and the drift vanished. Which result should you believe, and
        what exactly was being measured?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The information bottleneck asks for a summary T of an input X that forgets as much about X as possible while keeping
        what matters for a target Y. It is rate-distortion with the distortion chosen by Y: two inputs may share a summary if
        they predict Y alike. As a design principle this is sound. As a measurement of what a trained network does it
        runs into a problem: for a deterministic network, the information a layer holds about its input is either infinite
        or fixed, so any change you see must come from how you estimated it.
      </p>
      <InfoPlaneViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the information bottleneck">
        <p>
          Given a joint distribution p(x, y), choose an encoder <M>{"p(t \\mid x)"}</M>, so that{" "}
          <M>{"Y \\to X \\to T"}</M> is a Markov chain, to minimise
        </p>
        <MD>{"\\mathcal L = I(X; T) - \\beta\\, I(T; Y), \\qquad \\beta > 0."}</MD>
        <p>Small β favours compression; large β favours keeping information about Y.</p>
      </Definition>

      <Theorem title="the information plane is bounded">
        <p>For any encoder, <M>{"I(T; Y) \\le \\min\\{I(X; T),\\, I(X; Y)\\}"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Both are data processing: Y → X → T gives <M>{"I(T;Y) \\le I(X;Y)"}</M>, and the reversed chain T → X → Y, also
          Markov, gives <M>{"I(T;Y) \\le I(T;X)"}</M>. In the toy problem of the figure, <M>{"I(X;Y) = 1 - \\tfrac12(h(0.1) + h(0.2)) \\approx 0.405"}</M>{" "}
          bits, and two clusters reach 0.390 of it while keeping only 1 of the 2 bits about X.
        </p>
      </Proof>

      <Theorem title="optimal encoders are Gibbs distributions">
        <p>Stationary points of <M>{"\\mathcal L"}</M> satisfy the self-consistent equations</p>
        <MD>{"p(t \\mid x) = \\frac{p(t)}{Z(x, \\beta)}\\exp\\!\\bigl(-\\beta\\, D(p(y \\mid x) \\,\\|\\, p(y \\mid t))\\bigr),"}</MD>
        <p>
          with <M>{"p(t) = \\sum_x p(x)p(t \\mid x)"}</M> and{" "}
          <M>{"p(y \\mid t) = \\sum_x p(y \\mid x)p(x \\mid t)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sketch. Up to a constant, <M>{"-I(T;Y) = \\mathbb E\\,D(p(y \\mid X) \\,\\|\\, p(y \\mid T))"}</M>, an expected
          divergence: <M>{"I(X;Y) - I(T;Y) = I(X;Y \\mid T)"}</M> by the chain rule and the Markov property, and that conditional
          mutual information is this expectation. So <M>{"\\mathcal L"}</M> is a rate-distortion objective with the distortion{" "}
          <M>{"d(x, t) = D(p(y \\mid x) \\,\\|\\, p(y \\mid t))"}</M>, and the Lagrangian conditions give the same Gibbs form as in
          the last lesson. The difference is that the distortion depends on the encoder through <M>{"p(y \\mid t)"}</M>, so the
          problem is not convex, and iterating the equations converges only to a local optimum.
        </p>
        <Code>{IB}</Code>
      </Proof>

      <Remark title="the deep learning claim">
        <p>
          Shwartz-Ziv and Tishby (2017) treated each layer of a network as T, estimated <M>{"I(X;T)"}</M> and{" "}
          <M>{"I(T;Y)"}</M> by binning the activations, and reported a fitting phase followed by a long compression phase,
          suggesting that compression explains generalisation. Saxe and colleagues (2018) found the compression with tanh
          units but not with ReLU, and found networks that generalise without compressing and compress without generalising.
        </p>
      </Remark>

      <Remark title="what was being measured">
        <p>
          For a deterministic layer with continuous input, <M>{"I(X;T)"}</M> is infinite whenever T is injective in X; on a
          finite dataset of distinct inputs and an injective layer it equals log₂ of the number of examples, fixed for all of
          training. Binning replaces it with the entropy of the binned activations, which falls when tanh units saturate,
          because saturated values share bins, and which changes with the number of bins. That is a property of the
          estimator, not of the information. Goldfeld and colleagues (2019) added noise to make the quantity finite and found
          that the observed &quot;compression&quot; tracked clustering of representations. The fair conclusions: the bottleneck is a
          good objective, and variational versions of it are used for robust representations; the two-phase story is not an
          established law; and any information-theoretic measurement of a deterministic network must say what makes it
          finite.
        </p>
        <Code>{BN}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ixy",
      rung: "check",
      prompt: (
        <p>
          X is uniform on four values; Y is 1 with probability 0.1, 0.2, 0.8, 0.9 for those values. What is I(X; Y) in bits?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.405, tolerance: 0.001 },
    },
    {
      key: "injective",
      rung: "check",
      prompt: <p>X is uniform on 1024 values and T = f(X) for an injective f. What is I(X; T) in bits?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
    {
      key: "binning",
      rung: "apply",
      prompt: (
        <p>
          A layer of tanh units is injective throughout training, yet the binned estimate of I(X; T) falls late in training.
          What is the best explanation?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Saturating units push activations into fewer bins, so the estimate drops although no information is lost",
          "The network forgets information about X as it generalises",
          "Mutual information always decreases under gradient descent",
          "The labels Y carry less information late in training",
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

def kl_rows(P, Q):
    return np.sum(P[:, None, :] * (np.log(P[:, None, :]) - np.log(Q[None, :, :])), axis=2)

def ib(pxy, k, beta, iters=300, seed=0):
    rng = np.random.default_rng(seed); px = pxy.sum(1); py_x = pxy / px[:, None]
    q = rng.random((len(px), k)); q /= q.sum(1, keepdims=True)
    for _ in range(iters):
        pt = np.maximum(px @ q, 1e-300)
        py_t = np.maximum((q * px[:, None]).T @ py_x / pt[:, None], 1e-300)
        q = pt[None, :] * np.exp(-beta * kl_rows(py_x, py_t)); q /= q.sum(1, keepdims=True)
    return q

def info_terms(pxy, q):
    px, py = pxy.sum(1), pxy.sum(0); pt = px @ q; pty = q.T @ pxy
    a = px[:, None] * q; b = np.outer(pt, py)
    ixt = np.sum(a[a > 0] * np.log2((q / pt[None, :])[a > 0]))
    ity = np.sum(pty[pty > 0] * np.log2(pty[pty > 0] / b[pty > 0]))
    return float(ixt) + 0.0, float(ity) + 0.0

pxy = np.array([[0.9, 0.1], [0.8, 0.2], [0.2, 0.8], [0.1, 0.9]]) / 4
for beta in (0.5, 5, 50): print(beta, [round(v, 3) + 0.0 for v in info_terms(pxy, ib(pxy, 2, beta))])
print([round(v, 3) for v in info_terms(pxy, np.eye(4))])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 [0.0, 0.0]\n5 [0.969, 0.385]\n50 [1.0, 0.39]\n[2.0, 0.405]",
          "0.5 [1.0, 0.39]\n5 [0.969, 0.385]\n50 [0.0, 0.0]\n[2.0, 0.405]",
          "0.5 [0.0, 0.0]\n5 [0.969, 0.385]\n50 [2.0, 0.405]\n[2.0, 0.405]",
          "0.5 [0.0, 0.0]\n5 [0.969, 0.385]\n50 [1.0, 0.39]\n[2.0, 2.0]",
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

def binned_mi(t, bins):
    _, counts = np.unique(np.digitize(t, np.linspace(-1, 1, bins + 1)), return_counts=True)
    p = counts / counts.sum()
    return float(-(p * np.log2(p)).sum())

def saturation_curve(x, ws, bins):
    return [round(binned_mi(np.tanh(w * x), bins), 2) for w in ws]

x = np.random.default_rng(0).normal(size=5000); c = saturation_curve(x, [1, 5, 50], 30); print(c[0] > c[1] > c[2])
print(binned_mi(np.tanh(x), 10) < binned_mi(np.tanh(x), 100), round(binned_mi(np.tanh(x), 10), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True\nTrue 3.29", "False\nTrue 3.29", "True\nFalse 3.29", "True\nTrue 3.32"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl_rows(P, Q)</C>, the matrix of divergences between rows; <C>ib(pxy, k, beta, iters, seed)</C>, iterating the
          self-consistent equations from a random encoder with k clusters; and <C>info_terms(pxy, q)</C> returning I(X; T) and
          I(T; Y) in bits.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kl_rows(P, Q):
    return np.zeros((len(P), len(Q)))

def ib(pxy, k, beta, iters=300, seed=0):
    return np.full((pxy.shape[0], k), 1 / k)

def info_terms(pxy, q):
    return 0.0, 0.0
`,
        solution: IB,
        tests: [
          { name: "terms", code: `pxy = np.array([[0.9, 0.1], [0.8, 0.2], [0.2, 0.8], [0.1, 0.9]]) / 4; a, b = info_terms(pxy, np.eye(4))
assert np.isclose(a, 2.0) and np.isclose(b, 0.4045381557616783) and np.allclose(info_terms(pxy, np.full((4, 2), 0.5)), 0)` },
          { name: "iterate", code: `pxy = np.array([[0.9, 0.1], [0.8, 0.2], [0.2, 0.8], [0.1, 0.9]]) / 4; q = ib(pxy, 2, 50.0)
assert np.allclose(q[0], q[1], atol=1e-6) and np.allclose(q[2], q[3], atol=1e-6) and np.isclose(info_terms(pxy, q)[0], 1.0, atol=1e-6)
P = np.array([[0.5, 0.5], [0.9, 0.1]]); assert np.allclose(np.diag(kl_rows(P, P)), 0) and kl_rows(P, P)[0, 1] > 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binned_mi(t, bins)</C>, the entropy in bits of t after binning [−1, 1] into equal bins with{" "}
          <C>np.digitize</C> (which equals the binned I(X; T) for distinct inputs), and <C>saturation_curve(x, ws, bins)</C>,
          its values for <C>tanh(w * x)</C>, rounded to 2 decimals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def binned_mi(t, bins):
    return 0.0

def saturation_curve(x, ws, bins):
    return [0.0 for w in ws]
`,
        solution: BN,
        tests: [
          { name: "entropy", code: `assert binned_mi(np.array([-0.5, 0.5]), 2) == 1.0 and binned_mi(np.zeros(5), 10) == 0 and abs(binned_mi(np.linspace(-0.99, 0.99, 400), 4) - 2.0) < 1e-3` },
          { name: "saturation", code: `x = np.linspace(-3, 3, 2001); c = saturation_curve(x, [0.5, 2, 20], 20); assert c[0] > c[1] > c[2]` },
        ],
      },
    },
    {
      key: "groups",
      rung: "stretch",
      prompt: (
        <p>
          In the same four-value problem, T reports only which group X is in, the first two values or the last two. What is
          I(T; Y) in bits? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.39, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This closes the information theory course. Entropy, divergence and mutual information now give a common language
        for compression, prediction, communication and learning. The next course turns to randomness unfolding in time:
        Markov chains, random walks and the Monte Carlo methods built on them.
      </p>
    </>
  ),
};
