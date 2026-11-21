import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ItoSumViz } from "@/components/viz/ItoSumViz";
import type { LessonContent } from "@/lib/types";

const SUMS = `import numpy as np

def left_sum(h, path):
    return float(np.sum(h[:-1] * np.diff(path)))                  # Itô: integrand at the start of each step

def right_sum(h, path):
    return float(np.sum(h[1:] * np.diff(path)))

def mid_sum(h, path):
    return float(np.sum((h[:-1] + h[1:]) / 2 * np.diff(path)))    # Stratonovich: the average of the two ends`;

const PROC = `import numpy as np

def ito_process(h, path):
    return np.concatenate([[0.0], np.cumsum(h[:-1] * np.diff(path))])   # the integral up to each grid time

def bdb_closed(path):
    return float((path[-1] ** 2 - np.sum(np.diff(path) ** 2)) / 2)      # equals the left sum of B dB exactly

def strat_closed(path):
    return float(path[-1] ** 2 / 2)                                     # equals the midpoint sum exactly`;

export const lesson: LessonContent = {
  id: "m19.2.1",
  minutes: 55,
  links: {
    requires: ["m19.1.2", "m18.5.2"],
    revisits: ["m18.2.1", "m19.1.3"],
    foreshadows: ["m19.2.2"],
  },

  puzzle: (
    <>
      <p>
        Ordinary calculus says <M>{"\\int_0^t B\\, dB = B_t^2/2"}</M>. Try it numerically: sum <M>{"B_{t_k}(B_{t_{k+1}} - B_{t_k})"}</M>{" "}
        over a fine grid, and the answer comes out near <M>{"(B_t^2 - t)/2"}</M>. Take the integrand at the right end of each step
        instead and it comes out near <M>{"(B_t^2 + t)/2"}</M>. For a smooth integrator the choice of point never matters in the limit.
        Why does it matter here, and which choice is right?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The right-end and left-end sums differ by <M>{"\\sum (\\Delta B_k)^2"}</M>, which tends to t, not to 0 (m19.1.2). So there is
        no single Riemann–Stieltjes integral, and a convention must be chosen. Itô&apos;s choice is the left end: the integrand at each
        step uses only information available when the step begins, like a trading strategy that sets its position before the price
        moves. With that choice, each term has mean zero given the past, and the integral is a martingale. That property makes the Itô
        integral the natural one for probability, at the price of a correction term in its calculus.
      </p>
      <ItoSumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Riemann sums for a stochastic integral">
        <p>
          For an integrand h and a path sampled on a grid, <C>left_sum</C> evaluates h at the start of each step,{" "}
          <C>right_sum</C> at the end, and <C>mid_sum</C> uses the average of the two ends, the Stratonovich convention.
        </p>
        <Code>{SUMS}</Code>
      </Definition>

      <Definition title="the Itô integral of a simple process">
        <p>
          Let <M>{"\\mathcal{F}_t"}</M> be the filtration of B. A simple process is{" "}
          <M>{"H_s = \\sum_{k} h_k 1_{(t_k, t_{k+1}]}(s)"}</M> for times <M>{"0 = t_0 < t_1 < \\dots < t_n"}</M>, where each{" "}
          <M>{"h_k"}</M> is bounded and <M>{"\\mathcal{F}_{t_k}"}</M>-measurable: it is decided by time <M>{"t_k"}</M>. Its integral is
        </p>
        <MD>{"I_t(H) = \\int_0^t H_s\\, dB_s = \\sum_k h_k \\left(B_{t_{k+1} \\wedge t} - B_{t_k \\wedge t}\\right)."}</MD>
        <p>
          <C>ito_process</C> computes <M>{"I_t"}</M> at every grid time; <C>bdb_closed</C> and <C>strat_closed</C> are the closed forms
          of the left and midpoint sums of B dB proved below.
        </p>
        <Code>{PROC}</Code>
      </Definition>

      <Theorem title="the integral of a simple process is a martingale">
        <p>
          For a simple process H, <M>{"I_t(H)"}</M> is a continuous martingale with <M>{"\\mathbb{E}[I_t(H)] = 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Continuity is inherited from B. For <M>{"s < t"}</M>, split the sum into terms for steps before s, which are{" "}
          <M>{"\\mathcal{F}_s"}</M>-measurable, and terms with increments after s. For such a term with{" "}
          <M>{"u = \\max(t_k, s)"}</M> and <M>{"v = t_{k+1} \\wedge t"}</M>, the tower property gives{" "}
          <M>{"\\mathbb{E}[h_k (B_v - B_u) \\mid \\mathcal{F}_s] = \\mathbb{E}[h_k\\, \\mathbb{E}[B_v - B_u \\mid \\mathcal{F}_u] \\mid \\mathcal{F}_s] = 0"}</M>
          , because <M>{"h_k"}</M> is <M>{"\\mathcal{F}_u"}</M>-measurable and the increment after u is independent of{" "}
          <M>{"\\mathcal{F}_u"}</M> with mean zero (m19.1.3). Hence <M>{"\\mathbb{E}[I_t \\mid \\mathcal{F}_s] = I_s"}</M> (m18.5.2),
          and taking s = 0 gives mean zero. If <M>{"h_k"}</M> were allowed to depend on <M>{"B_{t_{k+1}}"}</M>, as in a right-end sum,
          the inner expectation would not vanish.
        </p>
      </Proof>

      <Theorem title="the integral of B against itself">
        <p>
          For any grid <M>{"0 = t_0 < \\dots < t_n = t"}</M>, with <M>{"\\Delta_k = B_{t_{k+1}} - B_{t_k}"}</M>,
        </p>
        <MD>{"\\sum_k B_{t_k}\\Delta_k = \\tfrac12 B_t^2 - \\tfrac12 \\sum_k \\Delta_k^2, \\qquad \\sum_k \\tfrac{B_{t_k} + B_{t_{k+1}}}{2}\\Delta_k = \\tfrac12 B_t^2."}</MD>
        <p>
          As the mesh tends to zero, the left sums converge in <M>{"L^2"}</M> to <M>{"\\int_0^t B\\, dB = \\tfrac12(B_t^2 - t)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"B_{t_{k+1}}^2 - B_{t_k}^2 = (B_{t_{k+1}} + B_{t_k})\\Delta_k"}</M>, the midpoint sum telescopes to{" "}
          <M>{"\\tfrac12(B_t^2 - B_0^2) = \\tfrac12 B_t^2"}</M>. The left sum is the midpoint sum minus{" "}
          <M>{"\\sum_k \\tfrac12(B_{t_{k+1}} - B_{t_k})\\Delta_k = \\tfrac12\\sum_k \\Delta_k^2"}</M>. The quadratic variation theorem
          (m19.1.2) gives <M>{"\\sum_k \\Delta_k^2 \\to t"}</M> in <M>{"L^2"}</M>, which proves the limit. The extra{" "}
          <M>{"-t/2"}</M> is exactly what keeps the mean zero: <M>{"\\mathbb{E}[B_t^2] = t"}</M>.
        </p>
      </Proof>

      <Example title="extending beyond simple processes">
        <p>
          A general adapted integrand H with <M>{"\\mathbb{E}\\int_0^t H_s^2\\, ds < \\infty"}</M> is approximated by simple
          processes <M>{"H^{(n)}"}</M>, for example by freezing H at the left ends of finer and finer grids. The next lesson proves that{" "}
          <M>{"\\mathbb{E}[I_t(H^{(n)}) - I_t(H^{(m)})]^2 = \\mathbb{E}\\int_0^t (H^{(n)}_s - H^{(m)}_s)^2 ds"}</M>, so the integrals form a
          Cauchy sequence in <M>{"L^2"}</M> and have a limit that does not depend on the approximation. That limit is{" "}
          <M>{"\\int_0^t H\\, dB"}</M>; for continuous adapted H it is the limit of left sums, as for B dB above.
        </p>
      </Example>

      <Remark title="Itô and Stratonovich">
        <p>
          The midpoint convention defines the Stratonovich integral, written <M>{"\\int H \\circ dB"}</M>. It obeys the ordinary chain
          rule, which is why physicists modelling noise as a limit of smooth signals often prefer it, but it is not a martingale and
          looks ahead half a step. The two are related by{" "}
          <M>{"\\int H \\circ dB = \\int H\\, dB + \\tfrac12 \\langle H, B \\rangle"}</M>. Diffusion models are written in the Itô
          convention, and the samplers built from them evaluate drifts at the start of each step.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gap",
      rung: "check",
      prompt: (
        <p>
          On [0, 3], what is the expected difference between the right-end and left-end Riemann sums of <M>{"\\int B\\, dB"}</M>, for
          any grid?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0005 },
    },
    {
      key: "value",
      rung: "check",
      prompt: (
        <p>
          A Brownian path has <M>{"B_1 = 2"}</M>. What is the value of the Itô integral <M>{"\\int_0^1 B\\, dB"}</M> on that path?
        </p>
      ),
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0005 },
    },
    {
      key: "adapted",
      rung: "apply",
      prompt: <p>Why must each <M>{"h_k"}</M> in a simple process be decided by time <M>{"t_k"}</M>?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that each term h_k times the next increment has mean zero given the past, which makes the integral a martingale",
          "So that the sum converges for every path without a limit in mean square",
          "Because Brownian increments are not defined before t_k",
          "So that the integral equals B squared over two",
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

def left_sum(h, path):
    return float(np.sum(h[:-1] * np.diff(path)))                  # Itô: integrand at the start of each step

def right_sum(h, path):
    return float(np.sum(h[1:] * np.diff(path)))

def mid_sum(h, path):
    return float(np.sum((h[:-1] + h[1:]) / 2 * np.diff(path)))    # Stratonovich: the average of the two ends

path = np.array([0.0, 1.0, -1.0, 2.0])
print(left_sum(path, path), right_sum(path, path), mid_sum(path, path))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["-5.0 9.0 2.0", "-5.0 9.0 4.0", "9.0 -5.0 2.0", "-3.0 9.0 2.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ito_process(h, path):
    return np.concatenate([[0.0], np.cumsum(h[:-1] * np.diff(path))])   # the integral up to each grid time

def bdb_closed(path):
    return float((path[-1] ** 2 - np.sum(np.diff(path) ** 2)) / 2)      # equals the left sum of B dB exactly

def strat_closed(path):
    return float(path[-1] ** 2 / 2)                                     # equals the midpoint sum exactly

path = np.array([0.0, 1.0, -1.0, 2.0])
print(ito_process(np.sign(path), path).tolist(), bdb_closed(path), strat_closed(path))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0, -2.0, -5.0] -5.0 2.0",
          "[0.0, 1.0, 3.0, 6.0] -5.0 2.0",
          "[0.0, 0.0, -2.0, -5.0] -7.0 2.0",
          "[0.0, -2.0, -5.0] -5.0 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>left_sum(h, path)</C>, <C>right_sum(h, path)</C> and <C>mid_sum(h, path)</C>, where h holds the integrand at the
          grid times. All return floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def left_sum(h, path):
    return float(np.sum(h * path))

def right_sum(h, path):
    return float(np.sum(h * path))

def mid_sum(h, path):
    return float(np.sum(h * path))
`,
        solution: SUMS,
        tests: [
          { name: "ends", code: `h = np.array([1.0, 2.0, 3.0]); p = np.array([0.0, 1.0, 3.0])\nassert left_sum(h, p) == 5.0 and right_sum(h, p) == 8.0` },
          { name: "mid", code: `h = np.array([1.0, 2.0, 3.0]); p = np.array([0.0, 1.0, 3.0])\nassert mid_sum(h, p) == 6.5 and mid_sum(p, p) == 4.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ito_process(h, path)</C>, returning the integral at every grid time starting with 0, and <C>bdb_closed(path)</C>{" "}
          and <C>strat_closed(path)</C>, returning floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ito_process(h, path):
    return np.cumsum(h * path)

def bdb_closed(path):
    return float(path[-1] ** 2 / 2)

def strat_closed(path):
    return 0.0
`,
        solution: PROC,
        tests: [
          { name: "process", code: `out = ito_process(np.array([2.0, -1.0, 5.0]), np.array([0.0, 1.0, 3.0]))\nassert out.shape == (3,) and np.allclose(out, [0.0, 2.0, 0.0])` },
          { name: "closed", code: `p = np.array([0.0, 2.0, 1.0])\nassert bdb_closed(p) == -2.0 and strat_closed(p) == 0.5` },
        ],
      },
    },
    {
      key: "second",
      rung: "stretch",
      prompt: (
        <p>
          Using the closed form <M>{"\\int_0^t B\\, dB = \\tfrac12(B_t^2 - t)"}</M>, compute{" "}
          <M>{"\\mathbb{E}\\left[\\left(\\int_0^3 B\\, dB\\right)^2\\right]"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 4.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The stretch answer equals <M>{"\\int_0^3 \\mathbb{E}[B_s^2]\\, ds"}</M>. That is no coincidence: the next lesson proves the Itô
        isometry, which says the mean square of a stochastic integral is the integral of the mean square of its integrand, and uses it
        to extend the integral to all square-integrable adapted processes.
      </p>
    </>
  ),
};
