import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ScalingRegimesViz } from "@/components/viz/ScalingRegimesViz";
import type { LessonContent } from "@/lib/types";

const MODEL = `def bias_var(N, D, d, c, s2):
    return c * N ** (-2 / d) + s2 * N / D

def best_N(D, d, c, s2):
    return (2 * c * D / (d * s2)) ** (d / (d + 2))

def envelope_exponent(d):
    return 2 / (d + 2)`;

const HIST = `def hist_fit(xs, ys, N):
    sums, counts = [0.0] * N, [0] * N
    for x, y in zip(xs, ys):
        j = min(int(x * N), N - 1)
        sums[j] += y
        counts[j] += 1
    return [s / c if c else 0.0 for s, c in zip(sums, counts)]

def hist_predict(means, x):
    return means[min(int(x * len(means)), len(means) - 1)]

def regime(N, D, d, c, s2):
    return 'variance' if s2 * N / D > c * N ** (-2 / d) else 'resolution'`;

export const lesson: LessonContent = {
  id: "m17.5.2",
  minutes: 50,
  links: {
    requires: ["m17.5.1"],
    revisits: ["l1.5.1", "m16.7.1"],
    foreshadows: ["m17.5.3"],
  },

  puzzle: (
    <>
      <p>
        Plot test loss against dataset size for a fixed model and it eventually falls as 1/D, an exponent of exactly 1.
        Grow the model together with the data and the loss falls far more slowly, with an exponent like 0.1 that depends on
        the task. Why would the same model family show two such different exponents, and which one should we expect when
        planning a larger run?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        When one resource is plentiful, the other is the bottleneck in one of two ways. If the model is small and the data
        huge, the model has converged to the best function it can represent, and extra data only removes the last bit of
        statistical noise, at the generic rate 1/D: variance-limited. If the model is effectively unlimited, then the data
        set the resolution at which the data manifold can be mapped, and halving the cell size of that map costs a factor
        that depends on the manifold&apos;s dimension: resolution-limited.
      </p>
      <ScalingRegimesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the four regimes">
        <p>
          For the loss <M>{"L(N, D)"}</M> of a model with N parameters trained on D samples, call the behaviour in D <em>variance-limited</em>{" "}
          when N is held fixed as D grows, so that <M>{"L(N, D) \\to L(N, \\infty)"}</M>, and <em>resolution-limited</em> when N is large enough
          not to matter, so that <M>{"L(\\infty, D) \\to L(\\infty, \\infty)"}</M>. The same two words apply with N and D exchanged, giving
          four regimes.
        </p>
      </Definition>

      <Theorem title="variance-limited scaling has exponent 1">
        <p>
          For least squares with p fixed features, noise variance σ², and D samples, the expected excess risk is{" "}
          <M>{"\\sigma^2 p/D + O(D^{-2})"}</M>. More generally, whenever the trained model is a smooth function of averages over the
          data, <M>{"L(N, D) - L(N, \\infty) = A(N)/D + O(D^{-2})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For least squares with design X and population covariance Σ, the estimator error is{" "}
          <M>{"\\hat\\beta - \\beta = (X^\\top X)^{-1}X^\\top\\varepsilon"}</M>, so the excess risk has expectation{" "}
          <M>{"\\sigma^2\\, \\mathbb E\\operatorname{tr}\\big(\\Sigma (X^\\top X)^{-1}\\big)"}</M>. Since <M>{"X^\\top X/D \\to \\Sigma"}</M>, this is{" "}
          <M>{"\\sigma^2 \\operatorname{tr}(I_p)/D = \\sigma^2 p/D"}</M> to leading order. In general, the trained parameters are a smooth function
          of empirical averages whose fluctuations have variance of order 1/D; expanding the loss to second order around the
          infinite-data optimum, the first-order term vanishes by optimality and the second-order term has expectation of
          order 1/D. The same argument in the width, using that finite-width corrections to the infinite-width limits are
          of order 1/n, gives exponent 1 in the variance-limited regime in N.
        </p>
      </Proof>

      <Theorem title="resolution-limited scaling for a histogram">
        <p>
          Let f be G-Lipschitz on <M>{"[0,1]^d"}</M>, and fit it by averaging noisy samples in N equal cubical cells. The expected
          excess squared error is at most about{" "}
        </p>
        <MD>{"L(N, D) \\approx c\\, N^{-2/d} + \\sigma^2 \\frac{N}{D}, \\qquad c \\le dG^2"}</MD>
        <p>
          (<C>bias_var</C>). Minimising over N gives <M>{"N^* = \\big(\\frac{2cD}{d\\sigma^2}\\big)^{d/(d+2)}"}</M> (<C>best_N</C>) and{" "}
          <M>{"L^* \\propto D^{-2/(d+2)}"}</M> (<C>envelope_exponent</C>).
        </p>
        <Code>{MODEL}</Code>
      </Theorem>
      <Proof>
        <p>
          A cell of side <M>{"h = N^{-1/d}"}</M> has diameter <M>{"h\\sqrt d"}</M>, so f differs from its cell average by at most{" "}
          <M>{"Gh\\sqrt d"}</M>, giving squared bias at most <M>{"dG^2 N^{-2/d}"}</M>. A cell receives about D/N samples, so the average of their
          noise has variance <M>{"\\sigma^2 N/D"}</M>. Setting the derivative in N to zero,{" "}
          <M>{"-\\frac{2c}{d} N^{-2/d - 1} + \\frac{\\sigma^2}{D} = 0"}</M>, gives <M>{"N^*"}</M>; substituting, both terms are proportional to{" "}
          <M>{"D^{-2/(d+2)}"}</M>. The estimator itself is a few lines (<C>hist_fit</C>, <C>hist_predict</C>), and comparing the two terms says
          which regime a given (N, D) is in (<C>regime</C>).
        </p>
        <Code>{HIST}</Code>
      </Proof>

      <Example title="reading the viz">
        <p>
          For d = 1, each fixed-N curve first falls with slope −1, the variance-limited regime in D, then flattens at the
          resolution floor <M>{"cN^{-2}"}</M>: the model is now resolution-limited in N. The envelope of best model sizes falls with
          slope −2/3. In d = 4 the envelope slope is only −1/3: higher-dimensional data are slower to resolve.
        </p>
      </Example>

      <Remark title="what this means for real models">
        <p>
          Bahri, Dyer, Kaplan, Lee and Sharma found both regimes in trained networks: exponent close to 1 when one resource is
          saturated, and small, task-dependent exponents in the resolution-limited regime, which is where large language
          models operate. With a smoother approximator, such as a piecewise-linear one, the resolution term becomes{" "}
          <M>{"N^{-4/d}"}</M>, the scaling quoted in m17.5.1. Since d for natural data is large, resolution-limited exponents are small,
          and the useful planning question becomes how to split a compute budget between N and D, which is the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ols",
      rung: "check",
      prompt: <p>A least squares model with 200 features and noise variance 0.5 is fitted on 10 000 samples. What is its expected excess risk to leading order?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 0.00001 },
    },
    {
      key: "env",
      rung: "check",
      prompt: <p>What is the resolution-limited data exponent of the histogram model on a 6-dimensional manifold?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>A small model is trained on ever more data, and its test loss falls like 1/D towards a floor. Which regime is this?</p>,
      answer: {
        kind: "choice",
        options: [
          "Variance-limited in D: the model has almost reached the best function it can represent, and data only reduce estimation noise",
          "Resolution-limited in D",
          "Resolution-limited in N, with data irrelevant",
          "It is not a scaling regime at all; 1/D indicates a bug",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bias_var(N, D, d, c, s2):
    return c * N ** (-2 / d) + s2 * N / D

def best_N(D, d, c, s2):
    return (2 * c * D / (d * s2)) ** (d / (d + 2))

def envelope_exponent(d):
    return 2 / (d + 2)

print(bias_var(4, 100, 2, 1.0, 1.0), round(bias_var(16, 10 ** 4, 1, 2.0, 0.5), 6), round(envelope_exponent(1), 4), envelope_exponent(2))
print(round(best_N(1000, 1, 1.0, 1.0), 4), round(best_N(500, 2, 1.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.29 0.008613 0.6667 0.5\n12.5992 22.3607",
          "0.29 0.008613 0.6667 0.5\n44.7214 22.3607",
          "0.0625 0.008613 0.6667 0.5\n12.5992 22.3607",
          "0.29 0.0078 0.3333 0.5\n12.5992 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def hist_fit(xs, ys, N):
    sums, counts = [0.0] * N, [0] * N
    for x, y in zip(xs, ys):
        j = min(int(x * N), N - 1)
        sums[j] += y
        counts[j] += 1
    return [s / c if c else 0.0 for s, c in zip(sums, counts)]

def hist_predict(means, x):
    return means[min(int(x * len(means)), len(means) - 1)]

def regime(N, D, d, c, s2):
    return 'variance' if s2 * N / D > c * N ** (-2 / d) else 'resolution'

xs, ys = [0.1, 0.2, 0.6, 0.9], [1, 3, 5, 0]; m4 = hist_fit(xs, ys, 4); print(hist_fit(xs, ys, 2), m4, hist_predict(hist_fit(xs, ys, 2), 0.75), hist_predict(m4, 1.0))
print(regime(16, 1000, 1, 1.0, 1.0), regime(4, 10 ** 6, 1, 1.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 2.5] [2.0, 0.0, 5.0, 0.0] 2.5 0.0\nvariance resolution",
          "[2.0, 2.5] [1.0, 3.0, 5.0, 0.0] 2.5 0.0\nvariance resolution",
          "[2.0, 2.5] [2.0, 0.0, 5.0, 0.0] 2.0 0.0\nresolution variance",
          "[4.0, 5.0] [2.0, 0.0, 5.0, 0.0] 5.0 0.0\nvariance resolution",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bias_var(N, D, d, c, s2)</C>, <C>best_N(D, d, c, s2)</C> from the stationarity condition, and{" "}
          <C>envelope_exponent(d)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bias_var(N, D, d, c, s2):
    return c * N ** (-1 / d) + s2 / D

def best_N(D, d, c, s2):
    return D

def envelope_exponent(d):
    return 1 / d
`,
        solution: MODEL,
        tests: [
          { name: "loss", code: `assert abs(bias_var(9, 90, 2, 3.0, 2.0) - (1 / 3 + 0.2)) < 1e-12 and abs(envelope_exponent(8) - 0.2) < 1e-12` },
          { name: "optimum", code: `n = best_N(5000, 3, 0.6, 0.2)\nh = 1e-4 * n\nassert bias_var(n, 5000, 3, 0.6, 0.2) < min(bias_var(n - h, 5000, 3, 0.6, 0.2), bias_var(n + h, 5000, 3, 0.6, 0.2))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hist_fit(xs, ys, N)</C> returning the mean of y in each of N equal cells of [0, 1], 0.0 for empty cells and
          the point x = 1 counted in the last cell; <C>hist_predict(means, x)</C>; and <C>regime(N, D, d, c, s2)</C>, &apos;variance&apos;
          when the variance term exceeds the bias term and &apos;resolution&apos; otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def hist_fit(xs, ys, N):
    return [sum(ys) / len(ys)] * N

def hist_predict(means, x):
    return means[0]

def regime(N, D, d, c, s2):
    return 'variance'
`,
        solution: HIST,
        tests: [
          { name: "fit", code: `m = hist_fit([0.0, 0.3, 0.35, 1.0], [2, 4, 6, 8], 3)\nassert m == [3.0, 6.0, 8.0] and hist_predict(m, 0.5) == 6.0 and hist_predict(m, 1.0) == 8.0` },
          { name: "regime", code: `assert regime(10, 10 ** 6, 2, 1.0, 1.0) == 'resolution' and regime(1000, 100, 2, 1.0, 1.0) == 'variance'` },
        ],
      },
    },
    {
      key: "opt4",
      rung: "stretch",
      prompt: (
        <p>
          With c = 1, σ² = 1 and d = 4, choose the best number of cells for D = 10⁶ samples and give the resulting loss{" "}
          <M>{"L(N^*, D)"}</M> to four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0189, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With power laws in both N and D, a fixed compute budget C ≈ 6ND can be spent on a bigger model or more data. The
        next lesson finds the split that minimises the loss.
      </p>
    </>
  ),
};
