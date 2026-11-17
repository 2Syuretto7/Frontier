import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CapacityViz } from "@/components/viz/CapacityViz";
import type { LessonContent } from "@/lib/types";

const BA = `import numpy as np

def mutual_info(px, W):
    py = px @ W
    ratio = np.where(W > 0, W, 1) / np.where(py > 0, py, 1)[None, :]
    return float((px[:, None] * W * np.log2(ratio)).sum())

def blahut_arimoto(W, iters=500):
    px = np.full(W.shape[0], 1 / W.shape[0])
    for _ in range(iters):
        py = px @ W
        d = np.sum(W * np.log2(np.where(W > 0, W, 1) / py), axis=1)
        px = px * 2 ** d; px /= px.sum()
    return mutual_info(px, W), px

def bsc(eps):
    return np.array([[1 - eps, eps], [eps, 1 - eps]])`;

const ZC = `import numpy as np

def h2(p):
    return 0.0 if p in (0, 1) else float(-p * np.log2(p) - (1 - p) * np.log2(1 - p))

def z_capacity(eps, grid=10001):
    t = np.linspace(0, 1, grid)
    vals = [h2(a * (1 - eps)) - a * h2(eps) for a in t]
    i = int(np.argmax(vals))
    return float(vals[i]), float(t[i])`;

export const lesson: LessonContent = {
  id: "m12.5.1",
  minutes: 50,
  links: {
    requires: ["m12.2.3"],
    revisits: ["m12.2.1", "m12.2.4"],
    foreshadows: ["m12.5.2"],
  },

  puzzle: (
    <>
      <p>
        A wire flips each bit it carries with probability 0.11. Sending each bit three times and taking a majority vote cuts
        the error rate to about 3.4%, at a third of the speed; more repetitions drive the error lower but the speed towards
        zero. It seems reliability must cost all of the rate. Shannon showed otherwise: this wire can carry half a bit per
        use with as few errors as you like. Where does the number one half come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each use of the channel lets the output tell us something about the input, and mutual information measures how
        much. We control only the input distribution, so we choose the one that makes the output most informative. That
        maximum is the capacity. For a symmetric channel the best input is uniform, and the output then carries one bit of
        entropy of which h(ε) is noise, leaving 1 − h(ε).
      </p>
      <CapacityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="channel and capacity">
        <p>
          A discrete memoryless channel is a stochastic matrix W with rows <M>{"W(\\cdot \\mid x)"}</M>: each use takes an
          input x and returns y with probability <M>{"W(y \\mid x)"}</M>, independently of other uses. Its capacity is
        </p>
        <MD>{"C = \\max_{p_X} I(X; Y), \\qquad p_Y(y) = \\sum_x p_X(x)\\,W(y \\mid x)."}</MD>
      </Definition>

      <Theorem title="mutual information is concave in the input">
        <p>For a fixed channel, <M>{"p_X \\mapsto I(X;Y)"}</M> is concave, so every local maximum is a capacity-achieving input.</p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"I(X;Y) = H(Y) - \\sum_x p_X(x) H(Y \\mid X = x)"}</M>. The second term is linear in <M>{"p_X"}</M>. The
          output distribution <M>{"p_Y"}</M> is a linear function of <M>{"p_X"}</M>, and entropy is concave, so H(Y) is concave
          in <M>{"p_X"}</M>. A concave function minus a linear one is concave.
        </p>
      </Proof>

      <Theorem title="two capacities in closed form">
        <p>
          The binary symmetric channel with crossover ε has <M>{"C = 1 - h(\\varepsilon)"}</M>. The binary erasure channel,
          which replaces the bit by a symbol ? with probability ε, has <M>{"C = 1 - \\varepsilon"}</M>. Both are achieved by a
          uniform input.
        </p>
      </Theorem>
      <Proof>
        <p>
          Symmetric: <M>{"H(Y \\mid X = x) = h(\\varepsilon)"}</M> for both x, so <M>{"I = H(Y) - h(\\varepsilon) \\le 1 - h(\\varepsilon)"}</M>,
          with equality when Y is uniform, which a uniform X gives. Erasure: if <M>{"P(X = 1) = a"}</M>, then Y is ? with
          probability ε whatever X is, and otherwise equals X. So <M>{"H(Y) = h(\\varepsilon) + (1-\\varepsilon)h(a)"}</M>,{" "}
          <M>{"H(Y \\mid X) = h(\\varepsilon)"}</M>, and <M>{"I = (1-\\varepsilon)h(a)"}</M>, maximised at a = ½.
        </p>
      </Proof>

      <Theorem title="the capacity-achieving input equalises divergences">
        <p>
          Let <M>{"q = p_Y"}</M> under input <M>{"p^*"}</M>. Then <M>{"p^*"}</M> achieves capacity if and only if{" "}
          <M>{"D(W(\\cdot \\mid x) \\,\\|\\, q) = C"}</M> for every x with <M>{"p^*(x) > 0"}</M> and{" "}
          <M>{"D(W(\\cdot \\mid x) \\,\\|\\, q) \\le C"}</M> for the rest.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"I(X;Y) = \\sum_x p(x)\\, D(W(\\cdot \\mid x) \\,\\|\\, p_Y)"}</M>, and its partial derivative in p(x) is{" "}
          <M>{"D(W(\\cdot \\mid x) \\,\\|\\, p_Y) - \\log_2 e"}</M>, because the terms from differentiating <M>{"p_Y"}</M> sum to{" "}
          <M>{"-\\log_2 e \\sum_y p_Y(y)\\,\\partial p_Y(y)/\\partial p(x) / p_Y(y) = -\\log_2 e"}</M>. For a concave function on
          the simplex, the Karush–Kuhn–Tucker conditions are necessary and sufficient: the partial derivatives are equal on the
          support and no larger off it. Averaging the equal values with weights <M>{"p^*(x)"}</M> shows the common value is C.
        </p>
      </Proof>

      <Remark title="the Blahut–Arimoto algorithm">
        <p>
          The last theorem suggests a fixed-point iteration: multiply each p(x) by <M>{"2^{D(W(\\cdot \\mid x) \\,\\|\\, p_Y)}"}</M>{" "}
          and renormalise, so inputs whose outputs stand out from the crowd get more weight. Blahut and Arimoto (1972) proved
          that the mutual information increases at every step and converges to C. For the Z channel, where a 1 becomes a 0
          with probability ½, it finds C = log₂(5/4) ≈ 0.322 with P(X = 1) = 0.4.
        </p>
        <Code>{BA}</Code>
      </Remark>

      <Remark title="beyond bits">
        <p>
          For a channel adding Gaussian noise of variance N to a real input of average power at most P, the capacity is{" "}
          <M>{"\\tfrac12\\log_2(1 + P/N)"}</M> bits per use, achieved by a Gaussian input; with bandwidth B this becomes the
          Shannon–Hartley formula <M>{"B\\log_2(1 + \\mathrm{SNR})"}</M> bits per second. So far capacity is only a number
          defined by an optimisation. The next lesson gives it its meaning, as the fastest rate at which errors can be made
          arbitrarily rare.
        </p>
        <Code>{ZC}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bsc",
      rung: "check",
      prompt: <p>What is the capacity of the binary symmetric channel with crossover probability 0.11? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
    {
      key: "bec",
      rung: "check",
      prompt: <p>What is the capacity of the binary erasure channel that erases a quarter of the bits?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "concave",
      rung: "apply",
      prompt: <p>Why can a simple ascent method like Blahut–Arimoto be trusted to find the capacity?</p>,
      answer: {
        kind: "choice",
        options: [
          "Mutual information is concave in the input distribution, so there are no spurious local maxima",
          "Mutual information is linear in the input distribution",
          "The optimal input is always uniform",
          "The channel matrix is always symmetric",
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

def mutual_info(px, W):
    py = px @ W
    ratio = np.where(W > 0, W, 1) / np.where(py > 0, py, 1)[None, :]
    return float((px[:, None] * W * np.log2(ratio)).sum())

def blahut_arimoto(W, iters=500):
    px = np.full(W.shape[0], 1 / W.shape[0])
    for _ in range(iters):
        py = px @ W
        d = np.sum(W * np.log2(np.where(W > 0, W, 1) / py), axis=1)
        px = px * 2 ** d; px /= px.sum()
    return mutual_info(px, W), px

def bsc(eps):
    return np.array([[1 - eps, eps], [eps, 1 - eps]])

print(round(mutual_info(np.array([0.5, 0.5]), bsc(0.11)), 3), round(mutual_info(np.array([0.9, 0.1]), bsc(0.11)), 3))
C, px = blahut_arimoto(np.array([[1.0, 0.0], [0.5, 0.5]])); print(round(C, 3), [round(float(v), 3) for v in px])
E = np.array([[0.7, 0.3, 0.0], [0.0, 0.3, 0.7]]); print(round(blahut_arimoto(E)[0], 3), round(blahut_arimoto(bsc(0.5))[0], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.197\n0.322 [0.6, 0.4]\n0.7 0.0",
          "0.5 0.5\n0.322 [0.6, 0.4]\n0.7 0.0",
          "0.5 0.197\n0.5 [0.5, 0.5]\n0.7 0.0",
          "0.5 0.197\n0.322 [0.4, 0.6]\n0.7 0.0",
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

def h2(p):
    return 0.0 if p in (0, 1) else float(-p * np.log2(p) - (1 - p) * np.log2(1 - p))

def z_capacity(eps, grid=10001):
    t = np.linspace(0, 1, grid)
    vals = [h2(a * (1 - eps)) - a * h2(eps) for a in t]
    i = int(np.argmax(vals))
    return float(vals[i]), float(t[i])

print(round(h2(0.11), 3), [round(v, 3) for v in z_capacity(0.5)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 [0.322, 0.4]", "0.5 [0.5, 0.5]", "0.89 [0.322, 0.4]", "0.5 [0.322, 0.6]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mutual_info(px, W)</C> for an input distribution and a channel matrix, treating 0 log 0 as 0;{" "}
          <C>blahut_arimoto(W, iters)</C> returning the capacity and the optimal input; and <C>bsc(eps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mutual_info(px, W):
    return 0.0

def blahut_arimoto(W, iters=500):
    return 0.0, np.full(W.shape[0], 1 / W.shape[0])

def bsc(eps):
    return np.eye(2)
`,
        solution: BA,
        tests: [
          { name: "info", code: `assert np.isclose(mutual_info(np.array([0.5, 0.5]), bsc(0.0)), 1.0) and np.isclose(mutual_info(np.array([0.5, 0.5]), bsc(0.5)), 0.0)
assert np.isclose(mutual_info(np.array([0.5, 0.5]), np.array([[0.75, 0.25, 0.0], [0.0, 0.25, 0.75]])), 0.75)` },
          { name: "capacity", code: `assert np.isclose(blahut_arimoto(np.eye(3))[0], np.log2(3))
C, px = blahut_arimoto(np.array([[1.0, 0.0], [0.5, 0.5]])); assert np.isclose(C, np.log2(1.25), atol=1e-6) and np.allclose(px, [0.6, 0.4], atol=1e-4)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write the binary entropy <C>h2(p)</C> and <C>z_capacity(eps, grid)</C>, which searches P(X = 1) on a grid for the Z
          channel (a 1 becomes a 0 with probability eps) and returns the capacity and the best P(X = 1).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def h2(p):
    return 1.0

def z_capacity(eps, grid=10001):
    return 0.0, 0.5
`,
        solution: ZC,
        tests: [
          { name: "entropy", code: `assert h2(0) == 0 and h2(1) == 0 and np.isclose(h2(0.5), 1.0) and np.isclose(h2(0.25), 0.811278, atol=1e-6)` },
          { name: "zchannel", code: `C, a = z_capacity(0.5); assert np.isclose(C, np.log2(1.25), atol=1e-6) and abs(a - 0.4) < 1e-3
C, a = z_capacity(0.0); assert np.isclose(C, 1.0) and abs(a - 0.5) < 1e-3` },
        ],
      },
    },
    {
      key: "typewriter",
      rung: "stretch",
      prompt: (
        <p>
          Each of 26 input letters is received either as itself or as the next letter of the alphabet (Z goes to A), each
          with probability ½. What is the capacity in bits per use? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.7, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Capacity was defined by an optimisation over a single use. The coding theorem says it is also an operational limit:
        with long enough blocks, every rate below C can be sent with vanishing error, and no rate above it can.
      </p>
    </>
  ),
};
