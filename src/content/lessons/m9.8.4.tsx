import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WinnersCurseViz } from "@/components/viz/WinnersCurseViz";
import type { LessonContent } from "@/lib/types";

const SIZE = `from math import ceil

def n_for_power(delta, sigma, z_a=1.96, z_b=0.8416):
    return ceil(((z_a + z_b) * sigma / delta) ** 2)

def mde(n, sigma, z_a=1.96, z_b=0.8416):
    return (z_a + z_b) * sigma / n ** 0.5`;

const SIM = `import numpy as np

def sim_power(n, delta, sigma, reps=20000, seed=0):
    D = np.random.default_rng(seed).normal(delta, sigma, size=(reps, n))
    t = D.mean(axis=1) / (D.std(axis=1, ddof=1) / np.sqrt(n))
    return round(float(np.mean(np.abs(t) > 1.96)), 3)

def winners_curse(delta, se, reps=200000, seed=0):
    est = np.random.default_rng(seed).normal(delta, se, size=reps)
    sig = np.abs(est) > 1.96 * se
    exaggeration = np.abs(est[sig]).mean() / delta
    return round(float(sig.mean()), 3), round(float(exaggeration), 2), round(float(np.mean(est[sig] < 0)), 3)`;

export const lesson: LessonContent = {
  id: "m9.8.4",
  minutes: 55,
  links: {
    requires: ["m9.8.3", "m9.4.1"],
    revisits: ["m9.3.4", "m9.4.4"],
    foreshadows: ["m9.8.5"],
  },

  puzzle: (
    <>
      <p>
        You plan to test whether a data-cleaning step improves accuracy by about one point. How many test questions, or
        seeds, do you need before running anything? And if you go ahead with too few and still get a significant result,
        why is the effect you report probably much larger than the real one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Power is decided before the experiment: by the size of the effect you care about, the noise per unit, and the
        number of units. An underpowered study does not just miss real effects; when it does reach significance, it is
        because the noise happened to push the estimate up, so the reported effect is inflated.
      </p>
      <WinnersCurseViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="sample size for a z-test">
        <p>
          For a two-sided level α test of mean 0, with per-unit standard deviation σ and true effect δ &gt; 0, the power is
          at least 1 − β when
        </p>
        <MD>{"n \\geq \\Big(\\frac{(z_{\\alpha/2} + z_\\beta)\\,\\sigma}{\\delta}\\Big)^2,"}</MD>
        <p>
          up to the negligible probability of rejecting in the wrong tail. For α = 0.05 and 80% power,{" "}
          <M>{"z_{\\alpha/2} + z_\\beta \\approx 1.96 + 0.84 = 2.80"}</M>. Comparing two independent groups needs this many
          units per group, times 2.
        </p>
      </Theorem>
      <Proof>
        <p>
          The statistic <M>{"Z = \\sqrt n\\bar X/\\sigma"}</M> is N(s, 1) with <M>{"s = \\sqrt n\\delta/\\sigma"}</M>. Its power
          is <M>{"\\Phi(s - z_{\\alpha/2}) + \\Phi(-s - z_{\\alpha/2}) \\geq \\Phi(s - z_{\\alpha/2})"}</M>. This is at least
          1 − β when <M>{"s - z_{\\alpha/2} \\geq z_\\beta"}</M>, that is <M>{"\\sqrt n \\geq (z_{\\alpha/2} + z_\\beta)\\sigma/\\delta"}</M>.
          For two groups the difference of means has variance <M>{"2\\sigma^2/n"}</M>, so σ is replaced by σ√2.
        </p>
        <Code>{SIZE}</Code>
      </Proof>

      <Example title="benchmarks and seeds">
        <p>
          The minimum detectable effect with n units is <M>{"(z_{\\alpha/2} + z_\\beta)\\sigma/\\sqrt n"}</M>. For two models
          that disagree on 10% of questions, a per-question paired difference has σ ≈ √0.1 ≈ 0.32, so detecting a one-point
          gap needs about 7850 questions. For seeds with σ = 2 points, detecting 0.5 points needs 126 paired seed runs. The
          simulation checks that 126 units give 80% power, and that 30 give only 30%.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Theorem title="significant results exaggerate underpowered effects">
        <p>
          Let the estimate be <M>{"\\hat\\delta \\sim N(\\delta, \\mathrm{se}^2)"}</M> with 0 &lt; δ &lt; 1.96 se. Then every
          significant estimate has <M>{"|\\hat\\delta| > \\delta"}</M>, so the expected magnitude of a significant estimate
          exceeds the true effect.
        </p>
      </Theorem>
      <Proof>
        <p>
          Significance means <M>{"|\\hat\\delta| > 1.96\\,\\mathrm{se}"}</M>, and 1.96 se &gt; δ by assumption, so{" "}
          <M>{"|\\hat\\delta| > \\delta"}</M> on that event; averaging over it preserves the strict inequality. With δ = se
          (power 17%), significant estimates average 2.5 times the truth and about 1% have the wrong sign.
        </p>
      </Proof>

      <Remark title="planning in practice">
        <p>
          Estimate σ from a pilot or past runs, choose δ as the smallest effect that would change a decision, and compute n
          before collecting data. If n is unaffordable, say so and report an interval rather than a verdict. Because effect
          sizes in ML papers often come from underpowered comparisons, replications usually find smaller gains; the winner&apos;s
          curse is one reason.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "n",
      rung: "check",
      prompt: <p>Using n = ⌈((1.96 + 0.8416)σ/δ)²⌉, how many paired units give 80% power to detect δ = 1 when σ = 3?</p>,
      answer: { kind: "numeric", value: 71, tolerance: 0.5 },
    },
    {
      key: "mde",
      rung: "check",
      prompt: <p>With n = 100 and σ = 1, what is the minimum detectable effect (1.96 + 0.8416)σ/√n? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2802, tolerance: 0.0001 },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>If the effect you want to detect is halved, how does the required sample size change?</p>,
      answer: { kind: "choice", options: ["It is multiplied by 4", "It doubles", "It is multiplied by √2", "It is unchanged"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import ceil

def n_for_power(delta, sigma, z_a=1.96, z_b=0.8416):
    return ceil(((z_a + z_b) * sigma / delta) ** 2)

def mde(n, sigma, z_a=1.96, z_b=0.8416):
    return (z_a + z_b) * sigma / n ** 0.5

print(n_for_power(0.5, 2.0), n_for_power(0.25, 2.0), round(mde(400, 2.0), 4))
print(n_for_power(0.01, 0.1 ** 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["126 503 0.2802\n7849", "126 252 0.2802\n7849", "125 502 0.2802\n7848", "126 503 0.5604\n7849"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sim_power(n, delta, sigma, reps=20000, seed=0):
    D = np.random.default_rng(seed).normal(delta, sigma, size=(reps, n))
    t = D.mean(axis=1) / (D.std(axis=1, ddof=1) / np.sqrt(n))
    return round(float(np.mean(np.abs(t) > 1.96)), 3)

def winners_curse(delta, se, reps=200000, seed=0):
    est = np.random.default_rng(seed).normal(delta, se, size=reps)
    sig = np.abs(est) > 1.96 * se
    exaggeration = np.abs(est[sig]).mean() / delta
    return round(float(sig.mean()), 3), round(float(exaggeration), 2), round(float(np.mean(est[sig] < 0)), 3)

print(sim_power(126, 0.5, 2.0), sim_power(30, 0.5, 2.0))
print(winners_curse(0.1, 0.1), winners_curse(0.3, 0.1))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.802 0.296\n(0.17, 2.49, 0.01) (0.85, 1.09, 0.0)", "0.802 0.296\n(0.17, 1.0, 0.0) (0.85, 1.0, 0.0)", "0.296 0.802\n(0.17, 2.49, 0.01) (0.85, 1.09, 0.0)", "0.802 0.296\n(0.85, 2.49, 0.01) (0.17, 1.09, 0.0)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>n_for_power(delta, sigma, z_a=1.96, z_b=0.8416)</C>, the smallest whole n meeting the sample size formula,
          and <C>mde(n, sigma, z_a=1.96, z_b=0.8416)</C>, the minimum detectable effect.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import ceil

def n_for_power(delta, sigma, z_a=1.96, z_b=0.8416):
    return 1

def mde(n, sigma, z_a=1.96, z_b=0.8416):
    return 0.0
`,
        solution: SIZE,
        tests: [
          { name: "n", code: `assert n_for_power(1.0, 1.0) == 8 and n_for_power(1.0, 1.0, z_b=0.0) == 4` },
          { name: "mde", code: `assert abs(mde(4, 1.0, z_b=0.0) - 0.98) < 1e-12 and abs(mde(n_for_power(0.3, 1.0), 1.0) - 0.3) < 0.01` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sim_power(n, delta, sigma, reps=20000, seed=0)</C>, the fraction of simulated samples of n N(δ, σ²)
          differences whose t-statistic exceeds 1.96 in absolute value, and <C>winners_curse(delta, se, reps=200000, seed=0)</C>,
          returning the power, the mean |estimate|/δ among significant estimates and the fraction of significant estimates
          with the wrong sign.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sim_power(n, delta, sigma, reps=20000, seed=0):
    return 0.0

def winners_curse(delta, se, reps=200000, seed=0):
    return 0.0, 1.0, 0.0
`,
        solution: SIM,
        tests: [
          { name: "power", code: `assert abs(sim_power(50, 0.0, 1.0, reps=20000) - 0.05) < 0.01 and sim_power(50, 1.0, 1.0, reps=2000) > 0.99` },
          { name: "curse", code: `p, x, w = winners_curse(0.5, 1.0, reps=100000)
assert abs(p - 0.079) < 0.01 and x > 4 and 0.02 < w < 0.15` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a two-sided level α z-test with standard deviation σ and effect δ &gt; 0, prove that n ≥ ((z_(α/2) + z_β)σ/δ)² guarantees power at least 1 − β.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes that √n X̄/σ is N(s, 1) with s = √n δ/σ, and writes the power as Φ(s − z_(α/2)) + Φ(−s − z_(α/2)).",
          "Bounds the power below by Φ(s − z_(α/2)).",
          "Shows Φ(s − z_(α/2)) ≥ 1 − β is equivalent to s ≥ z_(α/2) + z_β, which rearranges to the stated n.",
        ],
      },
    },
    {
      key: "two",
      rung: "stretch",
      prompt: <p>Two independent groups with σ = 1 per unit: how many units per group give 80% power at δ = 0.5, using 2((1.96 + 0.8416)σ/δ)² rounded up?</p>,
      answer: { kind: "numeric", value: 63, tolerance: 0.5 },
    },
  ],

  teachBack:
    "Explain to a friend how to compute the sample size for a desired power, what the minimum detectable effect is, why paired designs need far fewer units, and why significant results from underpowered experiments overstate the effect.",

  glimpse: (
    <>
      <p>
        Pairing, seeds and power all point to one idea: decide the design before the data. The last lesson collects the
        principles of controlled experiments, randomisation, blocking and preregistration, as they apply to ML research.
      </p>
    </>
  ),
};
