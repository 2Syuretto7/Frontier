import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EmConvergenceViz } from "@/components/viz/EmConvergenceViz";
import type { LessonContent } from "@/lib/types";

const EM = `import numpy as np

def em_path(f, g, x0, T, dW):
    h = T / len(dW)
    xs = [x0]
    for d in dW:
        xs.append(xs[-1] + f(xs[-1]) * h + g(xs[-1]) * d)   # drift times h plus noise times the increment
    return np.array(xs)

def gbm_exact(x0, mu, sigma, T, W_T):
    return x0 * np.exp((mu - sigma ** 2 / 2) * T + sigma * W_T)

def strong_error(x_em, x_exact):
    return float(np.mean(np.abs(x_em - x_exact)))`;

const LIN = `def em_mean_linear(a, x0, T, n):
    return x0 * (1 + a * T / n) ** n               # E of Euler-Maruyama for dX = a X dt + b dW

def em_stationary_var(a, b, h):
    return b ** 2 * h / (1 - (1 + a * h) ** 2)     # fixed point of V <- (1 + a h)^2 V + b^2 h

def stable(a, h):
    return abs(1 + a * h) < 1`;

export const lesson: LessonContent = {
  id: "m19.6.1",
  minutes: 55,
  links: {
    requires: ["m19.3.1", "m19.2.2"],
    revisits: ["m11.8.1", "m13.4.4"],
    foreshadows: ["m19.6.2"],
  },

  puzzle: (
    <>
      <p>
        The simplest way to simulate <M>{"dX = f(X)\\,dt + g(X)\\,dW"}</M> is to freeze the coefficients over a step of length h and
        add a Gaussian increment of variance h. For an ODE, Euler&apos;s method has error proportional to h. Yet if you simulate a
        stock price this way on the same Brownian path as the exact solution, halving the step only shrinks the error by a factor
        of about 1.4. Where does the lost accuracy go, and does it matter if you only want averages?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Over a step of length h the Brownian increment is of size <M>{"\\sqrt h"}</M>, much larger than h. Freezing g at the start
        of the step ignores how much X moves during the step, also of size <M>{"\\sqrt h"}</M>, so each step makes an error of
        size h in the noise term. These errors have mean zero and are independent, so over 1/h steps they add like a random walk,
        to a total of size <M>{"\\sqrt h"}</M>. Averages are kinder: the mean-zero errors cancel, and the error in an expectation is
        of order h, as for Euler&apos;s method.
      </p>
      <EmConvergenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Euler-Maruyama scheme">
        <p>
          With step <M>{"h = T/n"}</M>, times <M>{"t_k = kh"}</M> and increments{" "}
          <M>{"\\Delta W_k = W_{t_{k+1}} - W_{t_k} \\sim N(0, h)"}</M>,
        </p>
        <MD>{"X_{k+1} = X_k + f(X_k)\\,h + g(X_k)\\,\\Delta W_k ."}</MD>
        <p>
          The scheme converges strongly with order γ if{" "}
          <M>{"\\mathbb{E}|X_{t_n} - X_n| \\le C h^\\gamma"}</M> when both are driven by the same Brownian path, and weakly with
          order γ if <M>{"|\\mathbb{E}\\varphi(X_{t_n}) - \\mathbb{E}\\varphi(X_n)| \\le C h^\\gamma"}</M> for smooth φ. Generative
          sampling needs only the weak notion. <C>em_path</C> runs the scheme on given increments, <C>gbm_exact</C> is the exact
          solution of <M>{"dX = \\mu X dt + \\sigma X dW"}</M> found by Itô&apos;s formula (m19.2.3), and <C>strong_error</C>{" "}
          compares them.
        </p>
        <Code>{EM}</Code>
      </Definition>

      <Theorem title="strong order one half">
        <p>
          If f and g are Lipschitz with constant L, then{" "}
          <M>{"\\max_k \\mathbb{E}|X_{t_k} - X_k|^2 \\le C h"}</M> with C depending on L, T and <M>{"X_0"}</M> but not on h.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"e_k = X_{t_k} - X_k"}</M>. Subtracting the scheme from the integral equation over one step,
        </p>
        <MD>{"e_{k+1} = e_k + \\int_{t_k}^{t_{k+1}} (f(X_s) - f(X_k))\\,ds + \\int_{t_k}^{t_{k+1}} (g(X_s) - g(X_k))\\,dW_s ."}</MD>
        <p>
          Split <M>{"f(X_s) - f(X_k) = (f(X_s) - f(X_{t_k})) + (f(X_{t_k}) - f(X_k))"}</M>, and likewise for g. The second parts are
          bounded by <M>{"L|e_k|"}</M>. For the first, the solution moves little over a step:{" "}
          <M>{"\\mathbb{E}|X_s - X_{t_k}|^2 \\le C_1 h"}</M>, from the Itô isometry (m19.2.2) and the moment bounds of m19.3.1. The
          stochastic integrals over different steps are uncorrelated, and by the isometry each has second moment at most{" "}
          <M>{"2L^2 \\int (C_1 h + \\mathbb{E}|e_k|^2)\\,ds"}</M>. Summing the n steps, the noise contributes{" "}
          <M>{"n \\cdot C_1 h^2 = C_1 T h"}</M>, the drift contributes less, and the terms in <M>{"\\mathbb{E}|e_k|^2"}</M> are
          absorbed by the discrete Gronwall inequality, giving <M>{"\\mathbb{E}|e_k|^2 \\le C h"}</M>.
        </p>
      </Proof>

      <Theorem title="linear SDEs: exact moments of the scheme">
        <p>
          For <M>{"dX = aX\\,dt + b\\,dW"}</M>, the scheme gives <M>{"\\mathbb{E}X_n = X_0(1 + ah)^n"}</M> and{" "}
          <M>{"V_{k+1} = (1 + ah)^2 V_k + b^2 h"}</M> for the variance. For a &lt; 0 the scheme is stable exactly when{" "}
          <M>{"|1 + ah| < 1"}</M>, that is <M>{"h < 2/|a|"}</M>, and then its stationary variance is
        </p>
        <MD>{"\\frac{b^2 h}{1 - (1 + ah)^2} = \\frac{b^2}{2|a| - a^2 h} ,"}</MD>
        <p>
          larger than the true <M>{"b^2/(2|a|)"}</M> by a relative amount of order h.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"X_{k+1} = (1 + ah)X_k + b\\Delta W_k"}</M> with <M>{"\\Delta W_k"}</M> independent of <M>{"X_k"}</M>: take means and
          variances. The fixed point of the variance recursion exists and attracts when <M>{"(1 + ah)^2 < 1"}</M>. For the mean,{" "}
          <M>{"n \\log(1 + ah) = aT - a^2 T h/2 + O(h^2)"}</M>, so <M>{"(1 + ah)^n = e^{aT}(1 - a^2 T h/2 + O(h^2))"}</M>, a weak
          error of order h. <C>em_mean_linear</C>, <C>em_stationary_var</C> and <C>stable</C> compute these.
        </p>
        <Code>{LIN}</Code>
      </Proof>

      <Example title="additive noise">
        <p>
          When g is constant the noise term <M>{"g\\,\\Delta W_k"}</M> is exact, the error comes only from the drift, and the strong
          order rises to 1. The visualisation shows this at σ = 0 against the multiplicative noise of geometric Brownian motion.
          Diffusion samplers have additive noise, but their drift contains the score, whose Lipschitz constant near the data is of
          order <M>{"1/\\sigma_t^2"}</M>.
        </p>
      </Example>

      <Remark title="stiffness in diffusion sampling">
        <p>
          Near t = 0 the score of a sharply concentrated data distribution behaves like <M>{"-x/\\sigma_t^2"}</M>, a linear drift
          with a large negative coefficient. The stability bound <M>{"h < 2\\sigma_t^2"}</M> then forces tiny steps at low noise,
          while large steps are safe at high noise. Uniform steps waste effort; the last lesson of this course chooses the schedule,
          and the next one raises the order of the method.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mean",
      rung: "check",
      prompt: (
        <p>
          Euler-Maruyama with 4 steps is applied to <M>{"dX = -X\\,dt + dW"}</M>, <M>{"X_0 = 1"}</M>, on [0, 1]. What is the mean
          of its final value? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.316, tolerance: 0.0006 },
    },
    {
      key: "var",
      rung: "check",
      prompt: (
        <p>
          Euler-Maruyama with step h = 0.25 is run for a long time on <M>{"dX = -2X\\,dt + dW"}</M>. What variance does it settle
          at? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.0006 },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>Why is the strong order of Euler-Maruyama only one half when the noise depends on the state?</p>,
      answer: {
        kind: "choice",
        options: [
          "Freezing g over a step makes a mean-zero error of size h in each noise term, and n = T/h independent such errors add up to size of order the square root of h",
          "The Brownian increments are sampled with the wrong variance",
          "The drift is evaluated at the start of the step instead of the middle",
          "Rounding errors in the Gaussian samples accumulate",
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

def em_path(f, g, x0, T, dW):
    h = T / len(dW)
    xs = [x0]
    for d in dW:
        xs.append(xs[-1] + f(xs[-1]) * h + g(xs[-1]) * d)   # drift times h plus noise times the increment
    return np.array(xs)

def gbm_exact(x0, mu, sigma, T, W_T):
    return x0 * np.exp((mu - sigma ** 2 / 2) * T + sigma * W_T)

def strong_error(x_em, x_exact):
    return float(np.mean(np.abs(x_em - x_exact)))

xs = em_path(lambda x: -x, lambda x: 0.5, 1.0, 1.0, np.array([0.2, -0.4]))
print([round(float(v), 4) for v in xs], gbm_exact(1.0, 0.5, 1.0, 2.0, 0.0), strong_error(np.array([1.0, 2.0]), np.array([1.5, 1.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1.0, 0.6, 0.1] 1.0 0.75", "[1.0, 0.7, 0.15] 1.0 0.75", "[1.0, 0.6, 0.1] 2.7183 0.75", "[1.0, 0.6, 0.1] 1.0 0.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def em_mean_linear(a, x0, T, n):
    return x0 * (1 + a * T / n) ** n               # E of Euler-Maruyama for dX = a X dt + b dW

def em_stationary_var(a, b, h):
    return b ** 2 * h / (1 - (1 + a * h) ** 2)     # fixed point of V <- (1 + a h)^2 V + b^2 h

def stable(a, h):
    return abs(1 + a * h) < 1

print(em_mean_linear(-1.0, 2.0, 1.0, 2), em_stationary_var(-1.0, 1.0, 1.0), stable(-3.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 1.0 False", "0.7358 1.0 False", "0.5 0.5 False", "0.5 1.0 True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>em_path(f, g, x0, T, dW)</C> returning the array of all n + 1 states, <C>gbm_exact(x0, mu, sigma, T, W_T)</C> and{" "}
          <C>strong_error(x_em, x_exact)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def em_path(f, g, x0, T, dW):
    h = T / len(dW)
    xs = [x0]
    for d in dW:
        xs.append(xs[-1] + f(xs[-1]) * h + g(xs[-1]) * np.sqrt(h) * d)
    return np.array(xs)

def gbm_exact(x0, mu, sigma, T, W_T):
    return x0 * np.exp(mu * T + sigma * W_T)

def strong_error(x_em, x_exact):
    return float(abs(np.mean(x_em - x_exact)))
`,
        solution: EM,
        tests: [
          { name: "path", code: `xs = em_path(lambda x: x, lambda x: 2 * x, 1.0, 1.0, np.array([0.5, 0.25]))\nassert xs.shape == (3,)\nassert np.allclose(xs, [1.0, 2.5, 5.0])` },
          { name: "gbm", code: `assert abs(gbm_exact(2.0, 1.0, 2.0, 1.0, 0.5) - 2.0) < 1e-12 and strong_error(np.array([1.0, 0.0]), np.array([0.0, 1.0])) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"dX = aX\\,dt + b\\,dW"}</M>, write <C>em_mean_linear(a, x0, T, n)</C>, <C>em_stationary_var(a, b, h)</C> and{" "}
          <C>stable(a, h)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def em_mean_linear(a, x0, T, n):
    return x0 * np.exp(a * T)

def em_stationary_var(a, b, h):
    return b ** 2 / (2 * abs(a))

def stable(a, h):
    return h < 1 / abs(a)
`,
        solution: LIN,
        tests: [
          { name: "mean", code: `assert abs(em_mean_linear(1.0, 1.0, 1.0, 2) - 2.25) < 1e-12 and abs(em_stationary_var(-1.0, 2.0, 0.5) - 8 / 3) < 1e-12` },
          { name: "stable", code: `assert stable(-1.0, 1.5) and not stable(-1.0, 2.5)` },
        ],
      },
    },
    {
      key: "stiff",
      rung: "stretch",
      prompt: (
        <p>
          Euler-Maruyama is applied to <M>{"dX = -50X\\,dt + dW"}</M>. Above what step size does its variance grow without bound?
        </p>
      ),
      answer: { kind: "numeric", value: 0.04, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        For sampling, only the weak error matters, and it is of order h. The next lesson asks how to do better: higher-order
        solvers for the probability flow ODE, Heun&apos;s method and its relatives, and why they let diffusion models sample in tens
        of steps rather than thousands.
      </p>
    </>
  ),
};
