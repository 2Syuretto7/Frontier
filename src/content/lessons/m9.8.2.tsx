import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeedSpreadViz } from "@/components/viz/SeedSpreadViz";
import type { LessonContent } from "@/lib/types";

const SUMMARY = `import statistics

def seed_summary(scores):
    k = len(scores)
    m = statistics.mean(scores)
    s = statistics.stdev(scores)
    return round(m, 3), round(s, 3), round(s / k ** 0.5, 3)

def var_of_mean(sigma_seed, sigma_test, k):
    return sigma_seed ** 2 / k + sigma_test ** 2`;

const SIM = `import numpy as np

def best_of_k(k, sigma=1.0, reps=100000, seed=0):
    S = np.random.default_rng(seed).normal(0, sigma, size=(reps, k))
    return round(float(S.max(axis=1).mean()), 3), round(float(S.mean(axis=1).std()), 3)

def wrong_order(delta, sigma, k, reps=100000, seed=0):
    rng = np.random.default_rng(seed)
    a = rng.normal(0, sigma, size=(reps, k)).mean(axis=1)
    b = rng.normal(delta, sigma, size=(reps, k)).mean(axis=1)
    return round(float(np.mean(a >= b)), 3)`;

export const lesson: LessonContent = {
  id: "m9.8.2",
  minutes: 55,
  links: {
    requires: ["m9.8.1", "m9.7.4"],
    revisits: ["m7.6.2", "m9.1.3"],
    foreshadows: ["m9.8.3", "m9.8.5"],
  },

  puzzle: (
    <>
      <p>
        A new regulariser improves accuracy by 0.4 points in one training run. Rerun both the baseline and the new method
        with four more seeds and the scores scatter over a range of two points. Was the first result real? And when a
        paper reports &quot;the best of five seeds&quot;, how much better does that look than what you will get when you
        train once yourself?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A training run is itself a random draw: initialisation, data order and dropout masks change the result. Seed
        variation is one more source of noise to average over, separate from the finite test set. Averaging seeds helps;
        picking the best seed reports noise as progress.
      </p>
      <SeedSpreadViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a two-source model of a score">
        <p>A run with seed s, evaluated on test set T, scores</p>
        <MD>{"Y_{s,T} = \\mu + S_s + E_T,"}</MD>
        <p>
          where the seed effect S_s has variance <M>{"\\sigma_s^2"}</M>, independent across seeds, and the test-sampling
          error E_T has variance <M>{"\\sigma_t^2"}</M>, about p(1 − p)/n for accuracy on n questions. Every run evaluated on
          the same test set shares the same E_T.
        </p>
      </Definition>

      <Theorem title="averaging seeds on a fixed test set">
        <p>The mean of k seeds on one test set has variance</p>
        <MD>{"\\mathrm{Var}(\\bar Y) = \\frac{\\sigma_s^2}{k} + \\sigma_t^2,"}</MD>
        <p>so more seeds cannot push the error below the test-set floor σ_t.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\bar Y = \\mu + \\bar S + E_T"}</M> with <M>{"\\bar S"}</M> the mean of k independent seed effects, of variance{" "}
          <M>{"\\sigma_s^2/k"}</M>, and independent of E_T. Variances of independent terms add, and E_T is not averaged
          because it is the same for every seed.
        </p>
        <Code>{SUMMARY}</Code>
      </Proof>

      <Example title="estimating and reporting seed variance">
        <p>
          With k seeds, the sample standard deviation estimates σ_s (plus the small run-level part of the test noise), and
          s/√k is the standard error of the mean over seeds; a t interval with k − 1 degrees of freedom accounts for
          estimating s from few runs. For 5 seeds scoring 80.1, 79.2, 80.8, 79.9 and 80.5, the mean is 80.1 with s = 0.61
          and standard error 0.27. When comparing recipes, use the same seeds and the same test set for both: the shared
          parts then cancel in the difference, as in the paired analysis of the previous lesson.
        </p>
      </Example>

      <Theorem title="the best-of-k bias">
        <p>
          If seed scores are iid N(μ, σ²), the expected best of k is <M>{"\\mu + e_k\\sigma"}</M>, where e_k is the expected
          maximum of k standard normals: e₁ = 0, e₃ ≈ 0.85, e₁₀ ≈ 1.54. The bias grows without bound, roughly like{" "}
          <M>{"\\sqrt{2\\log k}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write each score as μ + σZ_i with Z_i iid standard normal; then max_i Y_i = μ + σ max_i Z_i, and taking expectations
          gives μ + σ e_k. The values of e_k come from the order-statistic density{" "}
          <M>{"k\\varphi(z)\\Phi(z)^{k-1}"}</M> of the maximum. Since e_k ≥ 0 with equality only for k = 1, the best seed is
          biased upwards whenever k &gt; 1.
        </p>
        <Code>{SIM}</Code>
      </Proof>

      <Remark title="good practice">
        <p>
          Report the number of seeds, the mean and the standard deviation or a confidence interval, never the best seed
          alone. Tune hyperparameters on validation seeds and report on fresh ones, because selecting the best configuration
          is best-of-k in disguise. Choose k from the variance: if σ_s is 0.6 points, five seeds give a standard error near
          0.27, enough to resolve differences of roughly 0.8 points, not 0.2.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>Seed-to-seed standard deviation is 0.6 points. What is the standard error of the mean over 9 seeds?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "floor",
      rung: "check",
      prompt: <p>With σ_s = 0.8, σ_t = 0.5 and k = 4 seeds on a single test set, what is the variance of the mean score?</p>,
      answer: { kind: "numeric", value: 0.41, tolerance: 0.0001 },
    },
    {
      key: "report",
      rung: "apply",
      prompt: <p>Which summary of k seeds is an unbiased estimate of the expected score of a single fresh training run?</p>,
      answer: { kind: "choice", options: ["The mean over seeds", "The best seed", "The median of the top half of seeds", "The worst seed"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import statistics

def seed_summary(scores):
    k = len(scores)
    m = statistics.mean(scores)
    s = statistics.stdev(scores)
    return round(m, 3), round(s, 3), round(s / k ** 0.5, 3)

def var_of_mean(sigma_seed, sigma_test, k):
    return sigma_seed ** 2 / k + sigma_test ** 2

print(seed_summary([80.1, 79.2, 80.8, 79.9, 80.5]))
print(round(var_of_mean(0.8, 0.5, 5), 4), round(var_of_mean(0.8, 0.5, 1000), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(80.1, 0.612, 0.274)\n0.378 0.2506", "(80.1, 0.548, 0.245)\n0.378 0.2506", "(80.1, 0.612, 0.274)\n0.378 0.0006", "(80.1, 0.612, 0.122)\n0.378 0.2506"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def best_of_k(k, sigma=1.0, reps=100000, seed=0):
    S = np.random.default_rng(seed).normal(0, sigma, size=(reps, k))
    return round(float(S.max(axis=1).mean()), 3), round(float(S.mean(axis=1).std()), 3)

def wrong_order(delta, sigma, k, reps=100000, seed=0):
    rng = np.random.default_rng(seed)
    a = rng.normal(0, sigma, size=(reps, k)).mean(axis=1)
    b = rng.normal(delta, sigma, size=(reps, k)).mean(axis=1)
    return round(float(np.mean(a >= b)), 3)

print([best_of_k(k) for k in (1, 3, 10)])
print([wrong_order(0.5, 1.0, k) for k in (1, 5, 20)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[(-0.001, 1.0), (0.849, 0.577), (1.54, 0.316)]\n[0.361, 0.214, 0.058]", "[(-0.001, 1.0), (0.849, 0.577), (1.54, 0.316)]\n[0.5, 0.5, 0.5]", "[(0.0, 1.0), (0.0, 0.577), (0.0, 0.316)]\n[0.361, 0.214, 0.058]", "[(-0.001, 1.0), (1.73, 0.577), (3.16, 0.316)]\n[0.361, 0.214, 0.058]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>seed_summary(scores)</C>, returning the mean, the sample standard deviation and the standard error, each
          rounded to 3 places, and <C>var_of_mean(sigma_seed, sigma_test, k)</C>, the variance of the mean over k seeds on a
          single test set.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import statistics

def seed_summary(scores):
    return 0.0, 0.0, 0.0

def var_of_mean(sigma_seed, sigma_test, k):
    return 0.0
`,
        solution: SUMMARY,
        tests: [
          { name: "summary", code: `assert seed_summary([1.0, 3.0]) == (2.0, 1.414, 1.0)` },
          { name: "var", code: `assert abs(var_of_mean(2.0, 1.0, 4) - 2.0) < 1e-12 and abs(var_of_mean(1.0, 0.0, 10) - 0.1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_of_k(k, sigma=1.0, reps=100000, seed=0)</C>, returning the simulated mean of the maximum of k
          N(0, σ²) scores and the standard deviation of their mean, and <C>wrong_order(delta, sigma, k, reps=100000, seed=0)</C>,
          the simulated probability that the mean of k seeds of a recipe worse by delta is at least the mean of k seeds of the
          better one.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def best_of_k(k, sigma=1.0, reps=100000, seed=0):
    return 0.0, 0.0

def wrong_order(delta, sigma, k, reps=100000, seed=0):
    return 0.5
`,
        solution: SIM,
        tests: [
          { name: "best", code: `m, s = best_of_k(2, sigma=2.0, reps=50000)
assert abs(m - 2 / 3.141592653589793 ** 0.5) < 0.03 and abs(s - 2 / 2 ** 0.5) < 0.02` },
          { name: "order", code: `assert abs(wrong_order(0.0, 1.0, 3, reps=40000) - 0.5) < 0.01 and wrong_order(3.0, 1.0, 4, reps=20000) < 0.001` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>In the model Y_s = μ + S_s + E, with S₁, …, S_k iid of variance σ_s², and E of variance σ_t² shared by all seeds and independent of the S_s, prove that the mean of the k scores has variance σ_s²/k + σ_t².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes Ȳ = μ + S̄ + E, noting that E appears once because every seed shares it.",
          "Computes Var(S̄) = σ_s²/k from independence of the seed effects.",
          "Adds the variances using independence of S̄ and E to get σ_s²/k + σ_t².",
        ],
      },
    },
    {
      key: "flip",
      rung: "stretch",
      prompt: <p>Recipe B is better by 0.5σ, where σ is the seed standard deviation. Comparing means of 5 seeds each, what is the probability that A&apos;s mean is at least B&apos;s? Use Φ(−0.5/√(2/5)) and give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2146, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend where seed-to-seed variance comes from, why averaging seeds cannot remove the noise of a fixed test set, how to report results over seeds, and why reporting the best seed is biased upwards.",

  glimpse: (
    <>
      <p>
        With several seeds per recipe, or several tasks per model, the natural comparison pairs results that share a
        source of noise. The next lesson develops paired tests in general and shows when pairing helps most.
      </p>
    </>
  ),
};
