import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ItoIsometryViz } from "@/components/viz/ItoIsometryViz";
import type { LessonContent } from "@/lib/types";

const MC = `import numpy as np

def integrals(H, dB):
    return np.sum(H * dB, axis=1)                 # one row per path; H[:, k] is fixed before step k

def mean_square(x):
    return float(np.mean(x ** 2))

def isometry_rhs(H, dt):
    return float(np.mean(np.sum(H ** 2, axis=1) * dt))   # E of the integral of H squared over time`;

const WIENER = `import numpy as np

def wiener_var(f, t, n):
    dt = t / n
    return sum(f(k * dt) ** 2 for k in range(n)) * dt   # variance of the Gaussian integral of f dB

def wiener_cov(f, g, t, n):
    dt = t / n
    return sum(f(k * dt) * g(k * dt) for k in range(n)) * dt

def corr(f, g, t, n):
    return wiener_cov(f, g, t, n) / np.sqrt(wiener_var(f, t, n) * wiener_var(g, t, n))`;

export const lesson: LessonContent = {
  id: "m19.2.2",
  minutes: 55,
  links: {
    requires: ["m19.2.1", "m18.3.4"],
    revisits: ["m18.6.2", "m19.1.1"],
    foreshadows: ["m19.2.3"],
  },

  puzzle: (
    <>
      <p>
        The Itô integral was defined only for simple integrands that jump at finitely many times. Yet the integrand in a diffusion
        model, a neural network evaluated along a noisy path, changes continuously. Approximating it by simple processes gives a
        sequence of random variables; to define the integral as their limit, one needs a guarantee that the sequence converges and that
        the limit does not depend on which approximations were chosen. Paths are too rough for pathwise limits. What makes the
        sequence converge?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Square an Itô sum and take expectations. The cross terms between different steps vanish, because each increment has mean zero
        given everything before it. Only the diagonal terms survive, each contributing <M>{"\\mathbb{E}[h_k^2]\\Delta t_k"}</M>. So the
        mean square of the integral equals the mean of the integral of the squared integrand over time. The map from integrands to
        integrals preserves this length exactly, and a map that preserves lengths sends Cauchy sequences to Cauchy sequences. Close
        integrands give close integrals, and the integral extends by continuity.
      </p>
      <ItoIsometryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="checking the isometry by simulation">
        <p>
          Each row of <C>H</C> holds an integrand on a grid, evaluated at the start of each step, and each row of <C>dB</C> the
          Brownian increments of the same path. <C>integrals</C> forms the Itô sums, <C>mean_square</C> their sample mean square, and{" "}
          <C>isometry_rhs</C> the sample mean of <M>{"\\sum_k H_k^2\\, \\Delta t"}</M>.
        </p>
        <Code>{MC}</Code>
      </Definition>

      <Theorem title="the Itô isometry for simple processes">
        <p>For a simple process H,</p>
        <MD>{"\\mathbb{E}\\left[\\left(\\int_0^t H_s\\, dB_s\\right)^2\\right] = \\mathbb{E}\\int_0^t H_s^2\\, ds."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write the integral as <M>{"\\sum_k h_k \\Delta_k"}</M> with <M>{"\\Delta_k"}</M> the increment over{" "}
          <M>{"(t_k, t_{k+1}]"}</M> and <M>{"h_k"}</M> measurable with respect to <M>{"\\mathcal{F}_{t_k}"}</M>. For <M>{"j < k"}</M>,{" "}
          <M>{"h_j \\Delta_j h_k"}</M> is <M>{"\\mathcal{F}_{t_k}"}</M>-measurable and <M>{"\\Delta_k"}</M> is independent of{" "}
          <M>{"\\mathcal{F}_{t_k}"}</M> with mean zero, so{" "}
          <M>{"\\mathbb{E}[h_j \\Delta_j h_k \\Delta_k] = \\mathbb{E}[h_j \\Delta_j h_k]\\, \\mathbb{E}[\\Delta_k] = 0"}</M>. On the
          diagonal, <M>{"\\mathbb{E}[h_k^2 \\Delta_k^2] = \\mathbb{E}[h_k^2]\\, \\mathbb{E}[\\Delta_k^2] = \\mathbb{E}[h_k^2](t_{k+1} - t_k)"}</M>
          . Summing gives <M>{"\\sum_k \\mathbb{E}[h_k^2](t_{k+1} - t_k) = \\mathbb{E}\\int_0^t H_s^2\\, ds"}</M>.
        </p>
      </Proof>

      <Theorem title="extension to square-integrable integrands">
        <p>
          Let H be adapted with <M>{"\\mathbb{E}\\int_0^t H_s^2\\, ds < \\infty"}</M>, and let <M>{"H^{(n)}"}</M> be simple processes
          with <M>{"\\mathbb{E}\\int_0^t (H^{(n)}_s - H_s)^2 ds \\to 0"}</M>. Then <M>{"\\int_0^t H^{(n)} dB"}</M> converges in{" "}
          <M>{"L^2"}</M> to a limit that does not depend on the approximating sequence. This limit is <M>{"\\int_0^t H\\, dB"}</M>; it
          has mean zero and satisfies the isometry.
        </p>
      </Theorem>
      <Proof>
        <p>
          The integral is linear in the integrand, so applying the isometry to <M>{"H^{(n)} - H^{(m)}"}</M> gives{" "}
          <M>{"\\mathbb{E}(I(H^{(n)}) - I(H^{(m)}))^2 = \\mathbb{E}\\int (H^{(n)} - H^{(m)})^2 ds"}</M>, which tends to zero because{" "}
          <M>{"H^{(n)}"}</M> converges in <M>{"L^2(ds \\times dP)"}</M>. So the integrals are Cauchy in <M>{"L^2"}</M>, which is
          complete (m18.3.4), and converge. If <M>{"K^{(n)}"}</M> is another approximating sequence, interleaving it with{" "}
          <M>{"H^{(n)}"}</M> gives a third sequence whose integrals also converge, so the two limits agree. Mean zero and the isometry
          pass to <M>{"L^2"}</M> limits, since first and second moments are continuous in <M>{"L^2"}</M>. That every such H has
          approximating simple processes is a standard density argument: truncate, smooth in time with a backward-looking average to
          keep adaptedness, then freeze on a grid.
        </p>
      </Proof>

      <Definition title="Wiener integrals">
        <p>
          When the integrand is a deterministic function f, the approximating sums are sums of independent Gaussians, so{" "}
          <M>{"\\int_0^t f\\, dB \\sim N(0, \\int_0^t f^2\\, ds)"}</M>, and by polarising the isometry,{" "}
          <M>{"\\operatorname{Cov}(\\int f\\, dB, \\int g\\, dB) = \\int f g\\, ds"}</M>. <C>wiener_var</C>, <C>wiener_cov</C> and{" "}
          <C>corr</C> compute these by left Riemann sums with n steps.
        </p>
        <Code>{WIENER}</Code>
      </Definition>

      <Example title="a Gaussian integral and its covariance">
        <p>
          <M>{"\\int_0^1 s\\, dB_s"}</M> is Gaussian with variance <M>{"\\int_0^1 s^2 ds = 1/3"}</M>, and its covariance with{" "}
          <M>{"B_1 = \\int_0^1 1\\, dB"}</M> is <M>{"\\int_0^1 s\\, ds = 1/2"}</M>, a correlation of <M>{"\\sqrt 3/2"}</M>. Limits of
          Gaussian vectors are Gaussian, as characteristic functions show (m18.6.2), so the whole family{" "}
          <M>{"\\{\\int f\\, dB\\}"}</M> is jointly Gaussian; the covariance <M>{"\\min(s,t)"}</M> of Brownian motion (m19.1.1) is the
          case <M>{"f = 1_{[0,s]}, g = 1_{[0,t]}"}</M>.
        </p>
      </Example>

      <Remark title="the isometry in diffusion models">
        <p>
          The forward noising process of a diffusion model is a Wiener integral: with a noise schedule <M>{"g(s)"}</M>, the noise added
          by time t is <M>{"\\int_0^t g(s)\\, dB_s"}</M>, Gaussian with variance <M>{"\\int_0^t g^2 ds"}</M>. This is why the noisy
          sample at any time can be drawn in one step, without simulating the path, and why noise schedules are specified through
          integrated variances.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "wvar",
      rung: "check",
      prompt: (
        <p>
          What is the variance of <M>{"\\int_0^2 s\\, dB_s"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.667, tolerance: 0.0006 },
    },
    {
      key: "bsq",
      rung: "check",
      prompt: (
        <p>
          Compute <M>{"\\mathbb{E}\\left[\\left(\\int_0^2 B_s^2\\, dB_s\\right)^2\\right]"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0.0005 },
    },
    {
      key: "cross",
      rung: "apply",
      prompt: <p>In the proof of the isometry, why do the cross terms with j &lt; k have zero expectation?</p>,
      answer: {
        kind: "choice",
        options: [
          "Everything in the term except the later increment is known at its start, and that increment is independent of it with mean zero",
          "Brownian increments over different steps are equal in distribution",
          "The integrand is bounded, so the terms are small",
          "The products of increments over different steps are always zero",
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

def integrals(H, dB):
    return np.sum(H * dB, axis=1)                 # one row per path; H[:, k] is fixed before step k

def mean_square(x):
    return float(np.mean(x ** 2))

def isometry_rhs(H, dt):
    return float(np.mean(np.sum(H ** 2, axis=1) * dt))   # E of the integral of H squared over time

H = np.array([[1.0, 2.0], [0.0, -1.0]]); dB = np.array([[0.5, 1.0], [2.0, 1.0]])
print(integrals(H, dB).tolist(), mean_square(integrals(H, dB)), isometry_rhs(H, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2.5, -1.0] 3.625 1.5", "[2.5, -1.0] 3.625 3.0", "[2.5, -1.0] 0.75 1.5", "[0.5, 1.0] 3.625 1.5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def wiener_var(f, t, n):
    dt = t / n
    return sum(f(k * dt) ** 2 for k in range(n)) * dt   # variance of the Gaussian integral of f dB

def wiener_cov(f, g, t, n):
    dt = t / n
    return sum(f(k * dt) * g(k * dt) for k in range(n)) * dt

def corr(f, g, t, n):
    return wiener_cov(f, g, t, n) / np.sqrt(wiener_var(f, t, n) * wiener_var(g, t, n))

one = lambda s: 1.0
print(wiener_var(lambda s: s, 1.0, 4), wiener_cov(one, lambda s: s, 1.0, 4), round(corr(one, lambda s: s, 1.0, 1000), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.21875 0.375 0.8658", "0.3333 0.5 0.8660", "0.21875 0.375 0.75", "0.46875 0.625 0.8658"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>integrals(H, dB)</C>, returning one Itô sum per row, and <C>mean_square(x)</C> and <C>isometry_rhs(H, dt)</C>,
          returning floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def integrals(H, dB):
    return np.sum(H * dB)

def mean_square(x):
    return float(np.mean(x) ** 2)

def isometry_rhs(H, dt):
    return float(np.mean(H) * dt)
`,
        solution: MC,
        tests: [
          { name: "sums", code: `H = np.array([[1.0, 1.0], [2.0, 0.0], [0.0, 3.0]]); dB = np.array([[1.0, -1.0], [0.5, 9.0], [1.0, 1.0]])\nout = integrals(H, dB)\nassert np.shape(out) == (3,) and np.allclose(out, [0.0, 1.0, 3.0]) and abs(mean_square(out) - 10 / 3) < 1e-12` },
          { name: "rhs", code: `H = np.array([[1.0, 1.0], [2.0, 0.0], [0.0, 3.0]])\nassert abs(isometry_rhs(H, 0.5) - 2.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wiener_var(f, t, n)</C>, <C>wiener_cov(f, g, t, n)</C> and <C>corr(f, g, t, n)</C>, using left Riemann sums with
          n equal steps on [0, t].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def wiener_var(f, t, n):
    return sum(f(k * t / n) for k in range(n)) * t / n

def wiener_cov(f, g, t, n):
    return 0.0

def corr(f, g, t, n):
    return 1.0
`,
        solution: WIENER,
        tests: [
          { name: "var", code: `assert abs(wiener_var(lambda s: 3.0, 2.0, 5) - 18.0) < 1e-12 and abs(wiener_var(lambda s: s, 2.0, 2) - 1.0) < 1e-12` },
          { name: "cov", code: `assert abs(wiener_cov(lambda s: 1.0, lambda s: -2.0, 3.0, 3) + 6.0) < 1e-12 and abs(corr(lambda s: 1.0, lambda s: -2.0, 3.0, 3) + 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "area",
      rung: "stretch",
      prompt: (
        <p>
          Integration by parts gives <M>{"\\int_0^1 B_s\\, ds = B_1 - \\int_0^1 s\\, dB_s"}</M>. Use it to compute{" "}
          <M>{"\\operatorname{Var}\\left(\\int_0^1 B_s\\, ds\\right)"}</M>. Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the integral in hand, the next lesson derives the chain rule of stochastic calculus. Itô&apos;s formula keeps the
        second-order term that ordinary calculus discards, because <M>{"(dB)^2 = dt"}</M>, and it is the tool behind every computation
        in the rest of the course.
      </p>
    </>
  ),
};
