import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ItoFormulaViz } from "@/components/viz/ItoFormulaViz";
import type { LessonContent } from "@/lib/types";

const FORMULA = `import numpy as np

def ito_rhs(f1, f2, path, dt):
    b = path[:-1]                                                     # left ends of the steps
    return float(np.sum(f1(b) * np.diff(path)) + 0.5 * np.sum(f2(b)) * dt)   # f'(B) dB + f''(B) dt / 2

def naive_rhs(f1, path):
    return float(np.sum(f1(path[:-1]) * np.diff(path)))              # the ordinary chain rule, missing a term

def ito_drift(mu, sigma, fx, fxx, ft):
    return ft + mu * fx + 0.5 * sigma ** 2 * fxx                     # dt coefficient of df(t, X) for dX = mu dt + sigma dB`;

const USES = `import math

def bm_moment(n, t):
    if n % 2:
        return 0.0
    c = 1.0
    for k in range(2, n + 1, 2):
        c *= k - 1                     # Itô: d(B^k) has mean drift k(k-1)/2 B^(k-2) dt
    return c * t ** (n // 2)

def gbm_mean(x0, mu, sigma, t):
    return x0 * math.exp(mu * t)       # E[S_t] for dS = mu S dt + sigma S dB

def exp_martingale(b, t, theta):
    return math.exp(theta * b - theta ** 2 * t / 2)`;

export const lesson: LessonContent = {
  id: "m19.2.3",
  minutes: 55,
  links: {
    requires: ["m19.2.2", "m19.1.2"],
    revisits: ["m18.5.2", "m19.2.1"],
    foreshadows: ["m19.3.2"],
  },

  puzzle: (
    <>
      <p>
        A stock price follows <M>{"dS = \\mu S\\, dt + \\sigma S\\, dB"}</M>. Ordinary calculus suggests{" "}
        <M>{"d \\log S = dS/S = \\mu\\, dt + \\sigma\\, dB"}</M>, so the log price should grow at rate μ. Simulate it with μ = 0.05 and
        σ = 0.4 and the median path falls, although the mean of S grows at 5% a year. Where did the ordinary chain rule go wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Taylor expand: <M>{"f(B + dB) - f(B) = f'(B)\\, dB + \\tfrac12 f''(B)(dB)^2 + \\dots"}</M>. For a smooth path the second term
        is negligible, but for Brownian motion <M>{"(dB)^2 = dt"}</M> (m19.1.2), so it contributes <M>{"\\tfrac12 f''(B)\\, dt"}</M>,
        a drift that adds up over time. Concave functions such as log lose a little at every step, which is why the median of S
        falls: <M>{"d\\log S = (\\mu - \\sigma^2/2)\\, dt + \\sigma\\, dB"}</M>, and here <M>{"\\sigma^2/2 = 0.08 > \\mu"}</M>.
      </p>
      <ItoFormulaViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Itô's formula">
        <p>
          Let <M>{"X_t = X_0 + \\int_0^t \\mu_s\\, ds + \\int_0^t \\sigma_s\\, dB_s"}</M> be an Itô process, written{" "}
          <M>{"dX = \\mu\\, dt + \\sigma\\, dB"}</M>, and let <M>{"f(t, x)"}</M> be once continuously differentiable in t and twice in
          x. Then
        </p>
        <MD>{"df(t, X_t) = \\left(\\partial_t f + \\mu\\, \\partial_x f + \\tfrac12 \\sigma^2 \\partial_x^2 f\\right) dt + \\sigma\\, \\partial_x f\\, dB_t."}</MD>
        <p>
          For <M>{"X = B"}</M> and f depending on x only, <M>{"f(B_t) - f(B_0) = \\int_0^t f'(B_s)\\, dB_s + \\tfrac12 \\int_0^t f''(B_s)\\, ds"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          We prove the case <M>{"X = B"}</M>, f = f(x) with <M>{"f''"}</M> bounded and continuous; the general case follows the same
          lines with the multiplication table <M>{"(dB)^2 = dt"}</M>, <M>{"dB\\,dt = (dt)^2 = 0"}</M> and a localisation for unbounded
          derivatives. On a grid of mesh h, Taylor&apos;s theorem gives
        </p>
        <MD>{"f(B_t) - f(B_0) = \\sum_k f'(B_{t_k})\\Delta_k + \\tfrac12 \\sum_k f''(B_{t_k})\\Delta_k^2 + \\sum_k R_k,"}</MD>
        <p>
          with <M>{"|R_k| \\le \\tfrac12 \\omega(|\\Delta_k|)\\Delta_k^2"}</M>, where ω is the modulus of continuity of{" "}
          <M>{"f''"}</M> on the range of the path. The first sum converges in <M>{"L^2"}</M> to <M>{"\\int f'(B)\\, dB"}</M> (m19.2.2).
          For the second, write <M>{"\\Delta_k^2 = \\Delta t_k + (\\Delta_k^2 - \\Delta t_k)"}</M>: the first part gives a Riemann sum
          for <M>{"\\int f''(B)\\, ds"}</M>, and the correction <M>{"\\sum f''(B_{t_k})(\\Delta_k^2 - \\Delta t_k)"}</M> has mean zero
          and, its terms being uncorrelated, mean square <M>{"\\sum \\mathbb{E}[f''(B_{t_k})^2]\\, 2\\Delta t_k^2 \\to 0"}</M>. The
          remainder is at most <M>{"\\tfrac12 \\max_k \\omega(|\\Delta_k|) \\sum_k \\Delta_k^2"}</M>, a product of a factor tending to
          zero by continuity of the path and a factor tending to t.
        </p>
      </Proof>

      <Definition title="checking the formula on a path">
        <p>
          <C>ito_rhs</C> evaluates the right side of Itô&apos;s formula for <M>{"f(B)"}</M> on a sampled path, given{" "}
          <M>{"f'"}</M> and <M>{"f''"}</M>; <C>naive_rhs</C> keeps only the first-order sum, as the ordinary chain rule would.{" "}
          <C>ito_drift</C> is the dt coefficient of <M>{"df(t, X)"}</M> at a point, from the drift and volatility of X and the
          partial derivatives of f there.
        </p>
        <Code>{FORMULA}</Code>
      </Definition>

      <Definition title="three consequences">
        <p>
          Taking expectations of Itô&apos;s formula kills the dB term, giving equations for moments: for{" "}
          <M>{"f = x^n"}</M>, <M>{"\\frac{d}{dt}\\mathbb{E}[B_t^n] = \\tfrac{n(n-1)}2 \\mathbb{E}[B_t^{n-2}]"}</M> (<C>bm_moment</C>).
          For geometric Brownian motion <M>{"dS = \\mu S\\, dt + \\sigma S\\, dB"}</M>, the mean satisfies{" "}
          <M>{"\\frac{d}{dt}\\mathbb{E}S = \\mu\\, \\mathbb{E}S"}</M> (<C>gbm_mean</C>). And{" "}
          <M>{"Z_t = e^{\\theta B_t - \\theta^2 t/2}"}</M> (<C>exp_martingale</C>) has zero drift, so it is a martingale with mean 1.
        </p>
        <Code>{USES}</Code>
      </Definition>

      <Theorem title="geometric Brownian motion">
        <p>
          The solution of <M>{"dS = \\mu S\\, dt + \\sigma S\\, dB"}</M> with <M>{"S_0 > 0"}</M> is{" "}
          <M>{"S_t = S_0 \\exp\\left((\\mu - \\tfrac12\\sigma^2)t + \\sigma B_t\\right)"}</M>. Its median is{" "}
          <M>{"S_0 e^{(\\mu - \\sigma^2/2)t}"}</M> and its mean <M>{"S_0 e^{\\mu t}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply Itô&apos;s formula to <M>{"f(t, x) = S_0 \\exp((\\mu - \\tfrac12\\sigma^2)t + \\sigma x)"}</M> with <M>{"X = B"}</M>:{" "}
          <M>{"\\partial_t f = (\\mu - \\tfrac12\\sigma^2) f"}</M>, <M>{"\\partial_x f = \\sigma f"}</M> and{" "}
          <M>{"\\partial_x^2 f = \\sigma^2 f"}</M>, so <M>{"df = (\\mu - \\tfrac12\\sigma^2 + \\tfrac12\\sigma^2) f\\, dt + \\sigma f\\, dB = \\mu f\\, dt + \\sigma f\\, dB"}</M>
          . The exponent is Gaussian with median <M>{"(\\mu - \\sigma^2/2)t"}</M>, and exp is increasing, giving the median; the mean
          is <M>{"S_0 e^{(\\mu - \\sigma^2/2)t}\\, \\mathbb{E}e^{\\sigma B_t} = S_0 e^{\\mu t}"}</M>, since{" "}
          <M>{"\\mathbb{E}e^{\\sigma B_t} = e^{\\sigma^2 t/2}"}</M>.
        </p>
      </Proof>

      <Example title="the puzzle, resolved">
        <p>
          <M>{"d\\log S = \\frac{dS}{S} - \\frac{1}{2}\\frac{(dS)^2}{S^2} = (\\mu - \\tfrac12\\sigma^2)\\, dt + \\sigma\\, dB"}</M>. With
          μ = 0.05 and σ = 0.4 the log drifts down at 0.03 a year, so most paths fall, while a few large gains keep the mean rising
          at 5%. The ordinary chain rule missed the second-order term, which never averages away.
        </p>
      </Example>

      <Remark title="Itô's formula in diffusion models">
        <p>
          Every derivation in the rest of the course uses it: the Fokker–Planck equation comes from applying it to test functions and
          taking expectations, the solution of the Ornstein–Uhlenbeck process from applying it to <M>{"e^{\\theta t} X_t"}</M>, and
          the reverse-time SDE and the probability flow ODE from tracking how densities change under it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "drift",
      rung: "check",
      prompt: (
        <p>
          X satisfies <M>{"dX = 2\\, dt + 3\\, dB"}</M>. At a moment when <M>{"X = 1"}</M>, what is the dt coefficient of{" "}
          <M>{"d(X^2)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 13, tolerance: 0.0005 },
    },
    {
      key: "sixth",
      rung: "check",
      prompt: (
        <p>
          Using the moment equation from Itô&apos;s formula, compute <M>{"\\mathbb{E}[B_2^6]"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 120, tolerance: 0.0005 },
    },
    {
      key: "martingale",
      rung: "apply",
      prompt: <p>Which of these is a martingale?</p>,
      answer: {
        kind: "choice",
        options: [
          "B_t² − t, since Itô's formula gives d(B² − t) = 2B dB with no dt term",
          "B_t², since B is a martingale",
          "e^{B_t}, since the exponential of a martingale is a martingale",
          "B_t³, since odd moments of B vanish",
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

def ito_rhs(f1, f2, path, dt):
    b = path[:-1]                                                     # left ends of the steps
    return float(np.sum(f1(b) * np.diff(path)) + 0.5 * np.sum(f2(b)) * dt)   # f'(B) dB + f''(B) dt / 2

def naive_rhs(f1, path):
    return float(np.sum(f1(path[:-1]) * np.diff(path)))              # the ordinary chain rule, missing a term

def ito_drift(mu, sigma, fx, fxx, ft):
    return ft + mu * fx + 0.5 * sigma ** 2 * fxx                     # dt coefficient of df(t, X) for dX = mu dt + sigma dB

path = np.array([0.0, 1.0, 0.0, 2.0])
print(ito_rhs(lambda x: 2 * x, lambda x: 2.0 + 0 * x, path, 1.0), naive_rhs(lambda x: 2 * x, path), ito_drift(0.5, 2.0, 3.0, 1.0, 0.25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 -2.0 3.75", "4.0 -2.0 3.75", "1.0 -2.0 1.75", "1.0 2.0 3.75"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def bm_moment(n, t):
    if n % 2:
        return 0.0
    c = 1.0
    for k in range(2, n + 1, 2):
        c *= k - 1                     # Itô: d(B^k) has mean drift k(k-1)/2 B^(k-2) dt
    return c * t ** (n // 2)

def gbm_mean(x0, mu, sigma, t):
    return x0 * math.exp(mu * t)       # E[S_t] for dS = mu S dt + sigma S dB

def exp_martingale(b, t, theta):
    return math.exp(theta * b - theta ** 2 * t / 2)

m = [bm_moment(n, 2.0) for n in (3, 4)]
print(m, bm_moment(6, 1.0), round(gbm_mean(1.0, 0.1, 0.5, 2.0), 4), round(exp_martingale(0.0, 2.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 12.0] 15.0 1.2214 0.3679",
          "[0.0, 12.0] 15.0 1.0513 0.3679",
          "[0.0, 4.0] 15.0 1.2214 0.3679",
          "[0.0, 12.0] 15.0 1.2214 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ito_rhs(f1, f2, path, dt)</C> and <C>naive_rhs(f1, path)</C>, where f1 and f2 are the first and second derivatives
          of f and act on arrays, and <C>ito_drift(mu, sigma, fx, fxx, ft)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ito_rhs(f1, f2, path, dt):
    return float(np.sum(f1(path[:-1]) * np.diff(path)))

def naive_rhs(f1, path):
    return float(np.sum(f1(path[1:]) * np.diff(path)))

def ito_drift(mu, sigma, fx, fxx, ft):
    return ft + mu * fx
`,
        solution: FORMULA,
        tests: [
          { name: "sums", code: `p = np.array([0.0, 1.0, 3.0])\nassert ito_rhs(lambda x: x, lambda x: 1.0 + 0 * x, p, 0.5) == 2.5 and naive_rhs(lambda x: x, p) == 2.0` },
          { name: "drift", code: `assert ito_drift(1.0, 2.0, 3.0, 4.0, 5.0) == 16.0 and ito_drift(0.0, 1.0, 0.0, 2.0, 0.0) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bm_moment(n, t)</C>, returning a float, <C>gbm_mean(x0, mu, sigma, t)</C> and{" "}
          <C>exp_martingale(b, t, theta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bm_moment(n, t):
    return t ** (n / 2)

def gbm_mean(x0, mu, sigma, t):
    return x0 * math.exp((mu - sigma ** 2 / 2) * t)

def exp_martingale(b, t, theta):
    return math.exp(theta * b)
`,
        solution: USES,
        tests: [
          { name: "moments", code: `assert bm_moment(2, 3.0) == 3.0 and bm_moment(8, 1.0) == 105.0 and bm_moment(5, 2.0) == 0.0 and bm_moment(0, 4.0) == 1.0` },
          { name: "gbm", code: `assert abs(gbm_mean(2.0, 0.5, 9.0, 2.0) - 2 * math.e) < 1e-12 and abs(exp_martingale(1.0, 2.0, 1.0) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "median",
      rung: "stretch",
      prompt: (
        <p>
          A geometric Brownian motion has <M>{"S_0 = 2"}</M>, μ = 0.1 and σ = 0.6. What is the median of <M>{"S_2"}</M>? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.704, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Geometric Brownian motion was an SDE with an explicit solution. Most SDEs have none, so the next chapter asks when an SDE has
        a solution at all, and when it has only one.
      </p>
    </>
  ),
};
