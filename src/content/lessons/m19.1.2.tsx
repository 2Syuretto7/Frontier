import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QuadVarViz } from "@/components/viz/QuadVarViz";
import type { LessonContent } from "@/lib/types";

const QV = `import numpy as np

def quad_var(path):
    return float(np.sum(np.diff(path) ** 2))

def p_variation(path, p):
    return float(np.sum(np.abs(np.diff(path)) ** p))

def qv_var(dts):
    return 2 * sum(dt ** 2 for dt in dts)        # variance of the sum of squared Brownian increments`;

const COV = `import numpy as np

def covariation(x, y):
    return float(np.sum(np.diff(x) * np.diff(y)))

def polarise(x, y):
    qv = lambda z: np.sum(np.diff(z) ** 2)
    return float((qv(x + y) - qv(x - y)) / 4)    # covariation from two quadratic variations

def correlate(dw1, dw2, rho):
    return rho * dw1 + np.sqrt(1 - rho ** 2) * dw2   # increments correlated with dw1 at rate rho`;

export const lesson: LessonContent = {
  id: "m19.1.2",
  minutes: 50,
  links: {
    requires: ["m19.1.1", "m18.3.4"],
    revisits: ["m18.3.3", "m13.5.2"],
    foreshadows: ["m19.2.3"],
  },

  puzzle: (
    <>
      <p>
        For a differentiable function f on [0, t], the sum of squared increments over a fine partition vanishes:{" "}
        <M>{"\\sum (\\Delta f)^2 \\le \\max|\\Delta f| \\sum |\\Delta f| \\to 0"}</M>. For a Brownian path the same sum does not vanish
        and does not blow up. It settles, path after path, at the number t, as if randomness had disappeared. Why is a sum of random
        squares almost certain to equal the elapsed time, and what does that say about the length of a Brownian path?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Over a step of length Δt, a Brownian increment has size about <M>{"\\sqrt{\\Delta t}"}</M>, so its square is about Δt. Summing n
        squares, each with mean Δt and independent of the others, gives the elapsed time on average, and by the law of large numbers
        the fluctuations cancel: the variance of the sum is only <M>{"2\\sum (\\Delta t)^2"}</M>. Absolute increments, by contrast,
        are about <M>{"\\sqrt{\\Delta t}"}</M> each, and n of them add up to about <M>{"\\sqrt n"}</M>, which grows without bound. A
        Brownian path is too rough to have a finite length, yet regular enough to have a definite quadratic variation. In calculus
        this becomes the rule <M>{"(dB)^2 = dt"}</M>.
      </p>
      <QuadVarViz />
    </>
  ),

  theory: (
    <>
      <Definition title="variations of a path">
        <p>
          For a partition <M>{"0 = t_0 < t_1 < \\dots < t_n = t"}</M> with mesh <M>{"\\max_k (t_k - t_{k-1})"}</M>, the p-variation sum of
          a path x is <M>{"\\sum_k |x_{t_k} - x_{t_{k-1}}|^p"}</M> (<C>p_variation</C>); p = 2 gives the quadratic variation sum
          (<C>quad_var</C>) and p = 1 the total variation sum, the length of the path in the vertical direction. <C>qv_var</C> is the
          variance of the quadratic variation sum of Brownian motion for given step lengths.
        </p>
        <Code>{QV}</Code>
      </Definition>

      <Theorem title="quadratic variation of Brownian motion">
        <p>
          For partitions of [0, t] with mesh tending to zero, <M>{"Q_n = \\sum_k (B_{t_k} - B_{t_{k-1}})^2"}</M> converges to t in{" "}
          <M>{"L^2"}</M>, with
        </p>
        <MD>{"\\mathbb{E}[Q_n] = t, \\qquad \\operatorname{Var}(Q_n) = 2 \\sum_k (t_k - t_{k-1})^2 \\le 2t \\cdot \\text{mesh}."}</MD>
        <p>For the dyadic partitions with <M>{"2^n"}</M> equal steps, the convergence is also almost sure.</p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\Delta_k = t_k - t_{k-1}"}</M> and <M>{"X_k = (B_{t_k} - B_{t_{k-1}})^2"}</M>. The increments are independent
          Gaussians with variances <M>{"\\Delta_k"}</M>, so <M>{"\\mathbb{E}X_k = \\Delta_k"}</M> and, since{" "}
          <M>{"\\mathbb{E}Z^4 = 3"}</M> for standard Z, <M>{"\\operatorname{Var}X_k = 3\\Delta_k^2 - \\Delta_k^2 = 2\\Delta_k^2"}</M>.
          Summing over independent terms gives the mean and variance, and{" "}
          <M>{"\\sum_k \\Delta_k^2 \\le \\text{mesh} \\cdot \\sum_k \\Delta_k = t \\cdot \\text{mesh}"}</M>, so{" "}
          <M>{"\\mathbb{E}(Q_n - t)^2 \\to 0"}</M>. For dyadic partitions the variance is <M>{"2t^2 2^{-n}"}</M>, and Chebyshev gives{" "}
          <M>{"P(|Q_n - t| > \\varepsilon) \\le 2t^2 2^{-n}/\\varepsilon^2"}</M>, summable in n; by Borel–Cantelli (m18.3.3){" "}
          <M>{"|Q_n - t| \\le \\varepsilon"}</M> eventually, for every rational ε, almost surely (m18.3.4).
        </p>
      </Proof>

      <Theorem title="infinite length">
        <p>
          Almost surely, a Brownian path has infinite total variation on every interval [0, t] with t &gt; 0, and is therefore not of
          bounded variation; in particular it is not differentiable with bounded derivative on any interval.
        </p>
      </Theorem>
      <Proof>
        <p>
          For any partition, <M>{"Q_n \\le \\max_k |\\Delta B_k| \\cdot \\sum_k |\\Delta B_k|"}</M>. Along the dyadic partitions{" "}
          <M>{"Q_n \\to t > 0"}</M> almost surely, while <M>{"\\max_k |\\Delta B_k| \\to 0"}</M> because the path is uniformly
          continuous on [0, t]. Hence <M>{"\\sum_k |\\Delta B_k| \\to \\infty"}</M>, and the total variation, the supremum of such sums,
          is infinite. A function with bounded derivative on an interval has finite total variation there, so it cannot be a Brownian
          path. The same argument applies on every interval with rational endpoints at once.
        </p>
      </Proof>

      <Definition title="covariation">
        <p>
          The covariation of two paths is <M>{"\\langle X, Y \\rangle_t = \\lim \\sum_k \\Delta X_k \\Delta Y_k"}</M>
          (<C>covariation</C>). The polarisation identity <M>{"\\langle X, Y \\rangle = \\tfrac14(\\langle X+Y \\rangle - \\langle X-Y \\rangle)"}</M>{" "}
          recovers it from quadratic variations (<C>polarise</C>). If W and W&apos; are independent Brownian motions, the increments{" "}
          <M>{"\\rho\\, dW + \\sqrt{1 - \\rho^2}\\, dW'"}</M> (<C>correlate</C>) define a Brownian motion whose covariation with W is ρt.
        </p>
        <Code>{COV}</Code>
      </Definition>

      <Example title="the multiplication table">
        <p>
          The theorems give the rules used by every computation in stochastic calculus: <M>{"(dB)^2 = dt"}</M>, while{" "}
          <M>{"dB \\, dt = 0"}</M> and <M>{"(dt)^2 = 0"}</M>, because <M>{"\\sum |\\Delta B_k| \\Delta_k \\le \\max_k |\\Delta B_k| \\cdot t \\to 0"}</M>{" "}
          and <M>{"\\sum \\Delta_k^2 \\le t \\cdot \\text{mesh} \\to 0"}</M>. For independent Brownian motions,{" "}
          <M>{"dB \\, dW = 0"}</M>. A differentiable function has zero quadratic variation, and a sum{" "}
          <M>{"X_t = B_t + g(t)"}</M> with g smooth has <M>{"\\langle X \\rangle_t = t"}</M>: smooth drift is invisible to quadratic
          variation.
        </p>
      </Example>

      <Remark title="why this matters for diffusion">
        <p>
          Quadratic variation is the reason Itô&apos;s formula has a second-order term: expanding <M>{"f(B_{t+dt})"}</M> to second
          order, the term <M>{"\\tfrac12 f''(B)(dB)^2"}</M> does not vanish but becomes <M>{"\\tfrac12 f''(B)\\, dt"}</M>. In diffusion
          models it is why the noise level of a process can be read off a single path, and why the drift and the noise of an SDE play
          such different roles.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "qvvar",
      rung: "check",
      prompt: (
        <p>
          Brownian motion on [0, 1] is sampled at 50 equal steps. What is the variance of the sum of squared increments?
        </p>
      ),
      answer: { kind: "numeric", value: 0.04, tolerance: 0.0005 },
    },
    {
      key: "length",
      rung: "check",
      prompt: (
        <p>
          With 100 equal steps on [0, 1], what is the expected sum of absolute Brownian increments? Use{" "}
          <M>{"\\mathbb{E}|Z| = \\sqrt{2/\\pi}"}</M> for a standard normal and give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 7.98, tolerance: 0.005 },
    },
    {
      key: "drift",
      rung: "apply",
      prompt: <p>What is the quadratic variation on [0, t] of <M>{"X_s = 3s + 2B_s"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["4t, since the smooth drift contributes nothing and the factor 2 is squared", "2t", "9t² + 4t", "4t + 3"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def quad_var(path):
    return float(np.sum(np.diff(path) ** 2))

def p_variation(path, p):
    return float(np.sum(np.abs(np.diff(path)) ** p))

def qv_var(dts):
    return 2 * sum(dt ** 2 for dt in dts)        # variance of the sum of squared Brownian increments

path = np.array([0.0, 1.0, -1.0, 0.0, 2.0])
print(quad_var(path), p_variation(path, 1), p_variation(path, 3), qv_var([0.25] * 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["10.0 6.0 18.0 0.5", "10.0 2.0 18.0 0.5", "6.0 10.0 18.0 0.25", "10.0 6.0 10.0 0.5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def covariation(x, y):
    return float(np.sum(np.diff(x) * np.diff(y)))

def polarise(x, y):
    qv = lambda z: np.sum(np.diff(z) ** 2)
    return float((qv(x + y) - qv(x - y)) / 4)    # covariation from two quadratic variations

def correlate(dw1, dw2, rho):
    return rho * dw1 + np.sqrt(1 - rho ** 2) * dw2   # increments correlated with dw1 at rate rho

x = np.array([0.0, 1.0, 3.0]); y = np.array([0.0, 2.0, 4.0])
print(covariation(x, y), polarise(x, y), correlate(np.array([1.0, 2.0]), np.array([0.0, 0.0]), 0.6).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["6.0 6.0 [0.6, 1.2]", "6.0 24.0 [0.6, 1.2]", "6.0 6.0 [0.36, 0.72]", "8.0 6.0 [0.6, 1.2]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quad_var(path)</C>, <C>p_variation(path, p)</C>, both returning floats, and <C>qv_var(dts)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def quad_var(path):
    return float(np.sum(path ** 2))

def p_variation(path, p):
    return float(np.sum(np.abs(path) ** p))

def qv_var(dts):
    return sum(dts)
`,
        solution: QV,
        tests: [
          { name: "qv", code: `x = np.array([1.0, 3.0, 2.0])\nassert quad_var(x) == 5.0 and p_variation(x, 1) == 3.0 and p_variation(x, 4) == 17.0` },
          { name: "var", code: `assert abs(qv_var([0.5, 0.5]) - 1.0) < 1e-12 and abs(qv_var([0.1, 0.2, 0.7]) - 1.08) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>covariation(x, y)</C> and <C>polarise(x, y)</C>, both returning floats, and <C>correlate(dw1, dw2, rho)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def covariation(x, y):
    return float(np.sum(x * y))

def polarise(x, y):
    return 0.0

def correlate(dw1, dw2, rho):
    return rho * dw1 + (1 - rho) * dw2
`,
        solution: COV,
        tests: [
          { name: "cov", code: `x = np.array([1.0, 2.0, 0.0]); y = np.array([0.0, 3.0, 4.0])\nassert covariation(x, y) == 1.0 and abs(polarise(x, y) - 1.0) < 1e-12` },
          { name: "corr", code: `assert np.allclose(correlate(np.array([1.0, 0.0]), np.array([0.0, 1.0]), 0.8), [0.8, 0.6])` },
        ],
      },
    },
    {
      key: "square",
      rung: "stretch",
      prompt: (
        <p>
          What is the expected quadratic variation of the process <M>{"B_s^2"}</M> over [0, 1.5]? (Hint:{" "}
          <M>{"\\Delta(B^2) = 2B\\,\\Delta B + (\\Delta B)^2"}</M>, and the second term contributes nothing in the limit.)
        </p>
      ),
      answer: { kind: "numeric", value: 4.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Brownian motion forgets its past: from any time on, it starts afresh from where it is. The next lesson makes that precise as
        the Markov property, extends it to random stopping times, and uses it to find the law of the running maximum.
      </p>
    </>
  ),
};
