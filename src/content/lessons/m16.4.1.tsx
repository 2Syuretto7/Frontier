import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StabilityViz } from "@/components/viz/StabilityViz";
import type { LessonContent } from "@/lib/types";

const RIDGE = `def ridge_1d(data, lam):
    sxx = sum(x * x for x, _ in data)
    sxy = sum(x * y for x, y in data)
    return sxy / (sxx + lam * len(data))

def replace_one_change(data, lam, i, z):
    other = data[:i] + [z] + data[i + 1:]
    return abs(ridge_1d(data, lam) - ridge_1d(other, lam))

def loo_gap(data, lam, loss):
    w = ridge_1d(data, lam)
    gaps = [loss(ridge_1d(data[:i] + data[i + 1:], lam), z) - loss(w, z) for i, z in enumerate(data)]
    return sum(gaps) / len(gaps)`;

const RATES = `import math

def rlm_stability(rho, lam, m):
    return 2 * rho * rho / (lam * m)

def sgd_stability(L, alpha, T, m):
    return 2 * L * L * alpha * T / m

def stability_bound(beta, M, m, delta):
    return 2 * beta + (4 * m * beta + M) * math.sqrt(math.log(1 / delta) / (2 * m))`;

export const lesson: LessonContent = {
  id: "m16.4.1",
  minutes: 45,
  links: {
    requires: ["m16.3.1", "m15.1.3"],
    revisits: ["m9.6.4", "m10.5.2"],
    foreshadows: ["m16.4.2", "m16.7.3"],
  },

  puzzle: (
    <>
      <p>
        Uniform convergence bounds the gap between training and test error for every hypothesis in the class, including all
        the ones the algorithm would never choose. That is wasteful: a gradient method run for a fixed number of steps from
        zero explores a tiny corner of the class. Is there a guarantee that looks only at what the algorithm actually does?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Overfitting means the output depends too much on individual training points. Turn that around: if replacing any one
        training example barely changes the learned predictor, then each training point is effectively a test point for it,
        and the training error is an honest estimate of the test error. Stability is a property of the algorithm, and it can
        hold for classes of unbounded complexity.
      </p>
      <StabilityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stability">
        <p>
          Let <M>{"S^{(i)}"}</M> be S with its i-th example replaced by an independent copy z′. An algorithm A is on-average
          replace-one stable with rate β(m) if{" "}
          <M>{"\\mathbb E\\big[\\ell(A(S^{(i)}), z_i) - \\ell(A(S), z_i)\\big] \\le \\beta(m)"}</M>, and uniformly β-stable if{" "}
          <M>{"|\\ell(A(S), z) - \\ell(A(S^{(i)}), z)| \\le \\beta"}</M> for all S, i, z′ and z (<C>replace_one_change</C> measures
          the change in the parameter for ridge regression).
        </p>
        <Code>{RIDGE}</Code>
      </Definition>

      <Theorem title="stability equals generalisation in expectation">
        <p>For every algorithm and distribution,</p>
        <MD>{"\\mathbb E_S\\big[L_D(A(S)) - L_S(A(S))\\big] = \\mathbb E_{S, z', i}\\big[\\ell(A(S^{(i)}), z_i) - \\ell(A(S), z_i)\\big]."}</MD>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"z_i"}</M> and z′ are exchangeable,{" "}
          <M>{"\\mathbb E\\,\\ell(A(S), z') = \\mathbb E\\,\\ell(A(S^{(i)}), z_i)"}</M>: swapping their names changes nothing. The
          left side of that is <M>{"\\mathbb E\\, L_D(A(S))"}</M>. Averaging{" "}
          <M>{"\\mathbb E\\,\\ell(A(S), z_i)"}</M> over i gives <M>{"\\mathbb E\\, L_S(A(S))"}</M>. Subtracting proves the identity:
          the expected gap is exactly the expected effect of replacing a training point on that point&apos;s loss. A
          leave-one-out version of the same quantity can be computed from data (<C>loo_gap</C>).
        </p>
      </Proof>

      <Theorem title="regularised losses are stable">
        <p>
          If ℓ(w, z) is convex and ρ-Lipschitz in w, then minimising{" "}
          <M>{"L_S(w) + \\lambda \\|w\\|^2"}</M> is on-average replace-one stable with rate{" "}
          <M>{"2\\rho^2 / (\\lambda m)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The objective <M>{"F_S"}</M> is 2λ-strongly convex (m10.5.2), so for its minimiser w,{" "}
          <M>{"F_S(v) - F_S(w) \\ge \\lambda\\|v - w\\|^2"}</M>. Apply this with v the minimiser w′ of{" "}
          <M>{"F_{S^{(i)}}"}</M>, and the same inequality the other way round, and add. The two objectives differ only in one
          term of weight 1/m, so the sum of the differences is at most{" "}
          <M>{"\\tfrac{1}{m}\\big(\\ell(w', z_i) - \\ell(w, z_i) + \\ell(w, z') - \\ell(w', z')\\big) \\le \\tfrac{2\\rho}{m}\\|w - w'\\|"}</M>,
          giving <M>{"2\\lambda\\|w - w'\\|^2 \\le 2\\rho\\|w - w'\\|/m"}</M>. Hence <M>{"\\|w - w'\\| \\le \\rho/(\\lambda m)"}</M>, and
          the loss changes by at most ρ times this; a symmetric accounting gives the stated rate (<C>rlm_stability</C>). Ridge
          regression (m9.6.4) is the squared-loss case, Lipschitz on bounded data.
        </p>
      </Proof>

      <Theorem title="uniform stability gives high-probability bounds">
        <p>
          (Bousquet and Elisseeff.) If A is uniformly β-stable and the loss lies in [0, M], then with probability at least 1 − δ,
        </p>
        <MD>{"L_D(A(S)) \\le L_S(A(S)) + 2\\beta + (4m\\beta + M)\\sqrt{\\frac{\\ln(1/\\delta)}{2m}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Apply McDiarmid&apos;s inequality (m15.1.3) to <M>{"\\Phi(S) = L_D(A(S)) - L_S(A(S))"}</M>. Replacing one example changes{" "}
          <M>{"L_D(A(S))"}</M> by at most β and <M>{"L_S(A(S))"}</M> by at most β + M/m, so the bounded-difference constants are{" "}
          <M>{"2\\beta + M/m"}</M>; the expectation of Φ is at most 2β by the identity above (<C>stability_bound</C>). The bound
          is informative only when β is of order 1/m: then <M>{"4m\\beta"}</M> is a constant and the gap shrinks like{" "}
          <M>{"1/\\sqrt m"}</M>.
        </p>
      </Proof>

      <Example title="stochastic gradient descent">
        <p>
          Hardt, Recht and Singer (2016) showed that T steps of SGD with step size α on an L-Lipschitz, smooth, convex loss are
          uniformly stable with <M>{"\\beta \\le 2L^2\\alpha T / m"}</M> (<C>sgd_stability</C>): two runs on samples differing in
          one example diverge only when that example is drawn, and each such step moves them apart by at most 2αL. Training
          for fewer steps is a form of regularisation, which is one explanation of early stopping.
        </p>
        <Code>{RATES}</Code>
      </Example>

      <Remark title="stability and uniform convergence">
        <p>
          The two views are complementary. Uniform convergence explains generalisation for every algorithm on a small class;
          stability explains it for a particular algorithm on a possibly huge class. For convex problems, stable
          regularised minimisation learns whenever learning is possible at all, even where uniform convergence fails. For
          non-convex networks the stability of SGD degrades with the number of steps, and how much it explains remains
          open (m16.7.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rlm",
      rung: "check",
      prompt: <p>A convex loss is 2-Lipschitz. What stability rate 2ρ²/(λm) does regularised minimisation with λ = 0.01 have on m = 10000 examples?</p>,
      answer: { kind: "numeric", value: 0.08, tolerance: 0.0001 },
    },
    {
      key: "sgd",
      rung: "check",
      prompt: <p>SGD runs 5000 steps of size 0.1 on a 1-Lipschitz smooth convex loss with m = 50000 examples. What is the stability bound 2L²αT/m?</p>,
      answer: { kind: "numeric", value: 0.02, tolerance: 0.0001 },
    },
    {
      key: "erm",
      rung: "apply",
      prompt: <p>Why is ERM over thresholds on the real line not uniformly stable, although the class has VC dimension 1?</p>,
      answer: {
        kind: "choice",
        options: [
          "Replacing one example can move the chosen threshold past a test point, changing that point's loss from 0 to 1",
          "Thresholds have infinitely many parameters",
          "ERM over thresholds never reaches zero training error",
          "Uniform stability only applies to regression",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ridge_1d(data, lam):
    sxx = sum(x * x for x, _ in data)
    sxy = sum(x * y for x, y in data)
    return sxy / (sxx + lam * len(data))

def replace_one_change(data, lam, i, z):
    other = data[:i] + [z] + data[i + 1:]
    return abs(ridge_1d(data, lam) - ridge_1d(other, lam))

def loo_gap(data, lam, loss):
    w = ridge_1d(data, lam)
    gaps = [loss(ridge_1d(data[:i] + data[i + 1:], lam), z) - loss(w, z) for i, z in enumerate(data)]
    return sum(gaps) / len(gaps)

D = [(1, 2), (2, 2), (-1, 0)]; print(round(ridge_1d(D, 0.0), 4), round(ridge_1d(D, 1.0), 4), round(replace_one_change(D, 1.0, 0, (1, -2)), 4))
print(round(loo_gap(D, 1.0, lambda w, z: (w * z[0] - z[1]) ** 2), 4), round(loo_gap(D, 100.0, lambda w, z: (w * z[0] - z[1]) ** 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.6667 0.4444\n0.3696 0.0258",
          "1.0 0.6667 0.4444\n0.0258 0.3696",
          "1.0 0.6667 0.2222\n0.3696 0.0258",
          "1.0 0.6667 0.4444\n-0.3696 0.0258",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def rlm_stability(rho, lam, m):
    return 2 * rho * rho / (lam * m)

def sgd_stability(L, alpha, T, m):
    return 2 * L * L * alpha * T / m

def stability_bound(beta, M, m, delta):
    return 2 * beta + (4 * m * beta + M) * math.sqrt(math.log(1 / delta) / (2 * m))

print(rlm_stability(1, 0.1, 1000), round(sgd_stability(1, 0.01, 2000, 1000), 4), round(stability_bound(0.02, 1, 1000, 0.05), 4))
print(stability_bound(0.0, 1, 50, math.exp(-25)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.02 0.04 3.1749\n0.5",
          "0.02 0.02 3.1749\n0.5",
          "0.002 0.04 3.1749\n0.5",
          "0.02 0.04 3.1749\n0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ridge_1d(data, lam)</C>, minimising the mean squared error of y ≈ w x plus λw², <C>replace_one_change(data,
          lam, i, z)</C>, and <C>loo_gap(data, lam, loss)</C>, the average over i of the loss at z_i of the fit without z_i minus
          the loss of the full fit.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ridge_1d(data, lam):
    return 0.0

def replace_one_change(data, lam, i, z):
    return 0.0

def loo_gap(data, lam, loss):
    return 0.0
`,
        solution: RIDGE,
        tests: [
          { name: "ridge", code: `assert ridge_1d([(1, 3)], 0.0) == 3.0 and abs(ridge_1d([(2, 2), (0, 5)], 1.0) - 4 / 6) < 1e-12 and replace_one_change([(1, 1), (1, 1)], 0.0, 1, (1, 3)) == 1.0` },
          { name: "leave one out", code: `sq = lambda w, z: (w * z[0] - z[1]) ** 2
assert loo_gap([(1, 1), (1, 1)], 0.0, sq) == 0.0 and abs(loo_gap([(1, 0), (1, 2)], 0.0, sq) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rlm_stability(rho, lam, m)</C>, <C>sgd_stability(L, alpha, T, m)</C> and{" "}
          <C>stability_bound(beta, M, m, delta)</C>, the Bousquet-Elisseeff deviation term added to the training loss.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rlm_stability(rho, lam, m):
    return 0.0

def sgd_stability(L, alpha, T, m):
    return 0.0

def stability_bound(beta, M, m, delta):
    return 0.0
`,
        solution: RATES,
        tests: [
          { name: "rates", code: `assert rlm_stability(2, 0.5, 16) == 1.0 and abs(sgd_stability(3, 0.1, 10, 9) - 2.0) < 1e-12` },
          { name: "bound", code: `assert stability_bound(0.25, 0, 1, 1.0) == 0.5 and abs(stability_bound(0.0, 2, 8, math.exp(-4)) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "howmany",
      rung: "stretch",
      prompt: (
        <p>
          Regularised minimisation with ρ = 1 and λ = 1 is uniformly stable with β = 2/m, and the loss lies in [0, 1]. How many
          thousand examples make the Bousquet-Elisseeff deviation term 2β + (4mβ + M)√(ln(1/δ)/2m) at most 0.1 for δ = 0.05?
          Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 12.2, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Regularisation buys stability at the cost of bias. The next lesson makes the trade-off explicit: choose λ to balance
        the fit to the data against the stability term, and obtain learning guarantees for convex problems with no reference
        to VC dimension at all.
      </p>
    </>
  ),
};
