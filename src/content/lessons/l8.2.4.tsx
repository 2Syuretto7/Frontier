import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeedNoiseViz } from "@/components/viz/SeedNoiseViz";
import type { LessonContent } from "@/lib/types";

const MULTIPLIER = `def law_loss(C, E, a, b):
    return E + a * C ** (-b)

def equivalent_compute(L, E, a, b):
    return (a / (L - E)) ** (1 / b)

def compute_multiplier(L_variant, C, E, a, b):
    return equivalent_compute(L_variant, E, a, b) / C`;

const SEEDS = `import math

def mean_std(x):
    m = sum(x) / len(x)
    return m, math.sqrt(sum((v - m) ** 2 for v in x) / (len(x) - 1))

def welch_t(x, y):
    mx, sx = mean_std(x)
    my, sy = mean_std(y)
    return (mx - my) / math.sqrt(sx ** 2 / len(x) + sy ** 2 / len(y))

def min_detectable(sd, n, z=2.0):
    return z * sd * math.sqrt(2 / n)`;

export const lesson: LessonContent = {
  id: "l8.2.4",
  minutes: 50,
  links: {
    requires: ["l8.2.3", "m9.8.2", "m9.8.3"],
    revisits: ["m9.8.4", "m17.5.3"],
    foreshadows: ["l8.4.1", "l10.1.1"],
  },

  puzzle: (
    <>
      <p>
        Hundreds of papers propose a change to the transformer and report a lower loss. When Narang and colleagues
        reimplemented about fifty of them in one codebase and compared them carefully, most gave no significant improvement,
        and the ones that did were mostly small changes developed in that same codebase. What went wrong in the original
        comparisons, and how should an architecture change be tested before it goes into a run that costs millions?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A single training run is a noisy measurement. A different seed changes the initialisation and the data order, and the
        final loss moves by an amount comparable to many claimed gains. A change can also look good because it was tuned while
        the baseline was not, or because it helps at small scale and fades at large scale. A fair ablation holds compute fixed,
        tunes each arm, repeats over seeds, and reports the gain as the compute the baseline would need to match it.
      </p>
      <SeedNoiseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the compute multiplier">
        <p>
          Fit the baseline&apos;s loss against training compute, <M>{"L(C) = E + aC^{-b}"}</M> (<C>law_loss</C>). If a variant reaches loss{" "}
          <M>{"L_v"}</M> with compute C, the baseline would need
        </p>
        <MD>{"C_{\\mathrm{eq}} = \\left(\\frac{a}{L_v - E}\\right)^{1/b}"}</MD>
        <p>
          to match it (<C>equivalent_compute</C>), and the variant is worth a compute multiplier <M>{"C_{\\mathrm{eq}}/C"}</M>{" "}
          (<C>compute_multiplier</C>). Unlike a raw loss difference, a multiplier can be compared across scales: a change worth 1.3×
          at every scale is a real gain, while one whose multiplier falls towards 1 as C grows will not matter for a large run.
        </p>
        <Code>{MULTIPLIER}</Code>
      </Definition>

      <Theorem title="how small a difference can be seen">
        <p>
          If each arm is run with n seeds and the final losses have standard deviation σ, the difference of the two means has
          standard error <M>{"\\sigma\\sqrt{2/n}"}</M>. A difference must be about z standard errors to be distinguished from noise, so the
          smallest detectable gain is
        </p>
        <MD>{"\\delta_{\\min} = z\\,\\sigma\\sqrt{2/n}"}</MD>
        <p>
          (<C>min_detectable</C>), and halving it takes four times as many seeds. The Welch statistic{" "}
          <M>{"t = (\\bar x - \\bar y)/\\sqrt{s_x^2/n_x + s_y^2/n_y}"}</M> (<C>mean_std</C>, <C>welch_t</C>) tests a difference without assuming equal
          variances.
        </p>
        <Code>{SEEDS}</Code>
      </Theorem>
      <Proof>
        <p>
          Runs with different seeds are independent, so <M>{"\\mathrm{Var}(\\bar x - \\bar y) = \\sigma^2/n + \\sigma^2/n = 2\\sigma^2/n"}</M>. Solving{" "}
          <M>{"\\delta = z\\sqrt{2\\sigma^2/n}"}</M> for n gives <M>{"n = 2(z\\sigma/\\delta)^2"}</M>, quadratic in <M>{"1/\\delta"}</M>.
        </p>
      </Proof>

      <Remark title="the other ways an ablation misleads">
        <p>
          Seeds are the easy part. A variant must be compared at equal compute, not equal parameters or steps, since many
          changes add FLOPs. Each arm needs its own learning-rate sweep, because a change that shifts the optimal learning rate
          will look better or worse at the baseline&apos;s setting for reasons unrelated to its merit. The evaluation must be on
          held-out data from the same distribution, at the same context length and tokeniser, or losses are not comparable;
          bits per byte from l8.1.1 helps here. And the comparison should be repeated at two or three scales, since
          the question that matters is the trend of the multiplier, which l8.4.1 shows how to fit. Paired designs, sharing the
          data order between arms, cancel part of the seed noise, as in m9.8.3.
        </p>
      </Remark>

      <Example title="what survives">
        <p>
          The changes that have held up across labs and scales are few: pre-norm, gated feed-forward layers, rotary positions,
          removing biases, QK-norm for stability, and grouped or latent attention for inference cost. Each was later confirmed
          by independent groups at scale. Many others, such as numerous attention variants and activation functions, did not
          reproduce. Kaplan and colleagues found the shape of the network, its depth-to-width ratio and head count, matters
          little over a wide range at fixed parameter count, which is why so many ablations of shape find nothing.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mult",
      rung: "check",
      prompt: (
        <p>
          A baseline follows <M>{"L(C) = 1.7 + C^{-0.15}"}</M> with C in units of 10¹⁸ FLOPs. A variant reaches 2.18 at C = 100. What is its compute
          multiplier? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.334, tolerance: 0.001 },
    },
    {
      key: "detect",
      rung: "check",
      prompt: <p>Seed-to-seed standard deviation is 0.01 and each arm has 5 seeds. With z = 2, what is the smallest detectable gain? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0126, tolerance: 0.0001 },
    },
    {
      key: "lr",
      rung: "apply",
      prompt: <p>A variant loses to the baseline when both use the learning rate tuned for the baseline. What is the main risk in concluding that the variant is worse?</p>,
      answer: {
        kind: "choice",
        options: [
          "The variant may have a different optimal learning rate, and at its own best setting it could match or beat the baseline",
          "There is no risk, because both arms used the same learning rate",
          "The variant must have more parameters",
          "Learning rate does not affect final loss",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def law_loss(C, E, a, b):
    return E + a * C ** (-b)

def equivalent_compute(L, E, a, b):
    return (a / (L - E)) ** (1 / b)

def compute_multiplier(L_variant, C, E, a, b):
    return equivalent_compute(L_variant, E, a, b) / C

print(law_loss(100, 2.0, 10.0, 0.5), equivalent_compute(3.0, 2.0, 10.0, 0.5))
print(round(compute_multiplier(2.5, 100, 2.0, 10.0, 0.5), 4), round(compute_multiplier(law_loss(64, 1.0, 3.0, 0.2), 64, 1.0, 3.0, 0.2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 100.0\n4.0 1.0",
          "3.0 100.0\n0.25 1.0",
          "2.1 100.0\n4.0 1.0",
          "3.0 10.0\n2.0 1.0",
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

def mean_std(x):
    m = sum(x) / len(x)
    return m, math.sqrt(sum((v - m) ** 2 for v in x) / (len(x) - 1))

def welch_t(x, y):
    mx, sx = mean_std(x)
    my, sy = mean_std(y)
    return (mx - my) / math.sqrt(sx ** 2 / len(x) + sy ** 2 / len(y))

def min_detectable(sd, n, z=2.0):
    return z * sd * math.sqrt(2 / n)

print(mean_std([1.0, 2.0, 3.0]), round(welch_t([3.0, 4.0, 5.0], [1.0, 2.0, 3.0]), 4))
print(min_detectable(0.5, 8), round(min_detectable(1.0, 2, 3.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2.0, 1.0) 2.4495\n0.5 3.0",
          "(2.0, 0.8165) 2.4495\n0.5 3.0",
          "(2.0, 1.0) 2.0\n0.5 3.0",
          "(2.0, 1.0) 2.4495\n0.3536 3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>law_loss(C, E, a, b)</C>, <C>equivalent_compute(L, E, a, b)</C> and <C>compute_multiplier(L_variant, C, E, a, b)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def law_loss(C, E, a, b):
    return E + a * C ** b

def equivalent_compute(L, E, a, b):
    return (L - E) / a

def compute_multiplier(L_variant, C, E, a, b):
    return 1.0
`,
        solution: MULTIPLIER,
        tests: [
          { name: "law", code: `assert abs(law_loss(16, 1.0, 2.0, 0.25) - 2.0) < 1e-12 and abs(equivalent_compute(2.0, 1.0, 2.0, 0.25) - 16) < 1e-9` },
          { name: "multiplier", code: `assert abs(compute_multiplier(1.5, 10, 1.0, 2.0, 0.5) - 1.6) < 1e-9 and abs(compute_multiplier(law_loss(50, 1.2, 4.0, 0.3), 50, 1.2, 4.0, 0.3) - 1) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mean_std(x)</C> with the sample standard deviation, <C>welch_t(x, y)</C> for the mean of x minus the mean of y, and{" "}
          <C>min_detectable(sd, n, z)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mean_std(x):
    m = sum(x) / len(x)
    return m, math.sqrt(sum((v - m) ** 2 for v in x) / len(x))

def welch_t(x, y):
    return sum(x) / len(x) - sum(y) / len(y)

def min_detectable(sd, n, z=2.0):
    return z * sd / n
`,
        solution: SEEDS,
        tests: [
          { name: "stats", code: `m, s = mean_std([2.0, 4.0, 4.0, 6.0])\nassert m == 4.0 and abs(s - math.sqrt(8 / 3)) < 1e-12 and abs(welch_t([2.0, 2.2, 2.4, 2.2], [2.1, 2.1, 2.1, 2.3]) - 0.5222329679) < 1e-9` },
          { name: "detect", code: `assert abs(min_detectable(0.01, 8) - 0.01) < 1e-12 and abs(min_detectable(0.02, 2, 3.0) - 0.06) < 1e-12` },
        ],
      },
    },
    {
      key: "seeds",
      rung: "stretch",
      prompt: (
        <p>
          Seed noise has standard deviation 0.006. How many seeds per arm are needed to detect a gain of 0.003 with z = 2.8, which
          gives about 80 percent power at the 5 percent level? Round up to a whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 63, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The architecture is settled. The next chapter replaces the dense feed-forward layer with many experts, of which each
        token uses only a few, the change that lets parameters grow faster than compute.
      </p>
    </>
  ),
};
