import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FileDrawerViz } from "@/components/viz/FileDrawerViz";
import type { LessonContent } from "@/lib/types";

const NULLS = `def ci(mean, se, z=1.959964):
    return mean - z * se, mean + z * se

def tost_equivalent(diff, se, margin, z=1.644854):
    return -margin < diff - z * se and diff + z * se < margin

def mde(se, za=1.959964, zb=0.841621):
    return (za + zb) * se`;

const FILTER = `import math

def power(effect, se, z=1.959964):
    phi = lambda t: 0.5 * (1 + math.erf(t / math.sqrt(2)))
    return phi(effect / se - z) + phi(-effect / se - z)

def published_mean(ests, ses, z=1.959964):
    sig = [e for e, s in zip(ests, ses) if abs(e / s) > z]
    return sum(sig) / len(sig) if sig else None

def false_share(prior, pw, alpha=0.05):
    return alpha * (1 - prior) / (alpha * (1 - prior) + pw * prior)`;

export const lesson: LessonContent = {
  id: "l10.7.4",
  minutes: 45,
  links: {
    requires: ["l10.7.3", "l10.2.4"],
    revisits: ["l10.2.1", "l10.1.4", "l10.7.1"],
    foreshadows: ["l11.1.4", "l11.4.3"],
  },

  puzzle: (
    <>
      <p>
        Twenty groups try the same promising idea. Seventeen see nothing and move on. Three see a significant improvement and publish.
        Every published paper is honest and every test was done correctly, yet a reader of the literature would conclude the idea works.
        What would the seventeen have had to write for the reader to reach the right conclusion, and why does &quot;we found no
        effect&quot; not suffice?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A result that is reported only when it is significant is filtered, and filtering on the outcome biases what survives. Negative
        results undo the filter, but only if they say how large an effect they could have detected. &quot;No significant effect&quot; from a
        noisy experiment rules out almost nothing; a narrow interval around zero rules out a lot.
      </p>
      <FileDrawerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="what a null result rules out">
        <p>
          Report the estimate with its confidence interval (<C>ci</C>, l10.2.1), never the p-value alone: effects outside the interval are
          the ones the experiment rules out. The minimum detectable effect, <M>{"(z_{1-\\alpha/2} + z_{1-\\beta})\\,\\mathrm{se}"}</M> (
          <C>mde</C>, l10.2.4), is the smallest effect the design had power <M>{"1-\\beta"}</M> to find; a null from a design whose minimum
          detectable effect exceeds every plausible effect is uninformative. To claim that an effect is negligible, choose a margin m in
          advance and run two one-sided tests: equivalence holds at level 5% when the 90% interval lies inside <M>{"(-m, m)"}</M> (
          <C>tost_equivalent</C>).
        </p>
        <Code>{NULLS}</Code>
      </Definition>

      <Theorem title="the significance filter inflates effects">
        <p>
          Let an estimate be <M>{"X \\sim N(\\mu, s^2)"}</M> with <M>{"\\mu > 0"}</M>, and report it only when{" "}
          <M>{"X > c"}</M>. Then the reported value has mean{" "}
          <M>{"\\mu + s\\,\\varphi(a)/(1-\\Phi(a))"}</M> with <M>{"a = (c-\\mu)/s"}</M>, which is always greater than <M>{"\\mu"}</M> and
          greater than c.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"X = \\mu + sZ"}</M>. The condition is <M>{"Z > a"}</M>, and for a standard normal{" "}
          <M>{"E[Z \\mid Z > a] = \\varphi(a)/(1-\\Phi(a))"}</M>, because <M>{"\\int_a^\\infty z\\varphi(z)\\,dz = \\varphi(a)"}</M>. This
          is positive, so the conditional mean exceeds <M>{"\\mu"}</M>, and every reported X exceeds c, so their mean does too. When the
          power (<C>power</C>) is low, c is far above <M>{"\\mu"}</M> and the inflation is large; the mean of the significant estimates (
          <C>published_mean</C>) then overstates the effect, which is what the visualisation shows.
        </p>
      </Proof>

      <Remark title="how many significant results are false">
        <p>
          If a fraction p of tested ideas truly work, tests have power w and level <M>{"\\alpha"}</M>, then of the significant results a
          share <M>{"\\alpha(1-p) / (\\alpha(1-p) + wp)"}</M> are false positives (<C>false_share</C>). When good ideas are rare and
          experiments are underpowered, a large share of positive findings are false, and the negative results are the evidence that
          would reveal it.
        </p>
        <Code>{FILTER}</Code>
      </Remark>

      <Remark title="what to report">
        <p>
          A useful negative result states the hypothesis and the prediction made before running (l10.7.1), the design and its minimum
          detectable effect, every configuration and seed tried, including those abandoned, the estimate with an interval, and the
          checks that the setup could detect a known effect, such as a positive control where an effect was planted. Say what was not
          tried: a null at one scale, one learning rate or one dataset is a null there, not everywhere. Choosing metrics, subsets or
          stopping points after seeing results recreates the filter inside a single paper (l10.1.4), so fix them in advance or report all
          of them.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          If the true effect is small, three significant results in twenty are about what noise and modest power produce, and the three
          published estimates are inflated. Had the seventeen reported their estimates and intervals, a reader could pool all twenty and
          recover the small effect, or see that the intervals jointly exclude any effect worth having. &quot;No effect&quot; alone gives
          the reader nothing to pool.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mde",
      rung: "check",
      prompt: (
        <p>
          An evaluation compares two models with a standard error of 0.5 points on the difference. What is the minimum detectable
          effect at 5% two-sided level with 80% power, in points? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.401, tolerance: 0.002 },
    },
    {
      key: "false",
      rung: "check",
      prompt: (
        <p>
          One in ten tested ideas truly works, experiments have 50% power, and the level is 5%. What share of significant results are
          false positives? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.474, tolerance: 0.002 },
    },
    {
      key: "report",
      rung: "apply",
      prompt: (
        <p>
          A new regulariser changes accuracy by +0.2 points with 95% interval (−0.6, 1.0). The team cares about effects of 0.5 points or
          more. What should the report say?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The result is inconclusive: the interval includes effects of both signs larger than 0.5, so more runs are needed to decide",
          "The regulariser has no effect",
          "The regulariser improves accuracy by 0.2 points",
          "The regulariser is equivalent to the baseline within 0.5 points",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ci(mean, se, z=1.959964):
    return mean - z * se, mean + z * se

def tost_equivalent(diff, se, margin, z=1.644854):
    return -margin < diff - z * se and diff + z * se < margin

def mde(se, za=1.959964, zb=0.841621):
    return (za + zb) * se

lo, hi = ci(0.3, 0.1)
print(round(lo, 3), round(hi, 3), tost_equivalent(0.05, 0.1, 0.3), round(mde(0.1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.104 0.496 True 0.28",
          "0.104 0.496 False 0.28",
          "0.136 0.464 True 0.28",
          "0.104 0.496 True 0.196",
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

def power(effect, se, z=1.959964):
    phi = lambda t: 0.5 * (1 + math.erf(t / math.sqrt(2)))
    return phi(effect / se - z) + phi(-effect / se - z)

def published_mean(ests, ses, z=1.959964):
    sig = [e for e, s in zip(ests, ses) if abs(e / s) > z]
    return sum(sig) / len(sig) if sig else None

def false_share(prior, pw, alpha=0.05):
    return alpha * (1 - prior) / (alpha * (1 - prior) + pw * prior)

print(round(power(0.0, 1.0), 3), published_mean([0.5, 2.5, -3.0, 1.0], [1, 1, 1, 1]), round(false_share(0.5, 0.8), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.05 -0.25 0.059",
          "0.0 -0.25 0.059",
          "0.05 2.5 0.059",
          "0.05 -0.25 0.941",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ci(mean, se, z=1.959964)</C>, <C>tost_equivalent(diff, se, margin, z=1.644854)</C>, true when the interval of half-width
          z·se lies strictly inside (−margin, margin), and <C>mde(se, za=1.959964, zb=0.841621)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ci(mean, se, z=1.959964):
    return mean, mean

def tost_equivalent(diff, se, margin, z=1.644854):
    return abs(diff) < margin

def mde(se, za=1.959964, zb=0.841621):
    return za * se
`,
        solution: NULLS,
        tests: [
          { name: "interval", code: `lo, hi = ci(1.0, 0.25)\nassert abs(lo - 0.510009) < 1e-9 and abs(hi - 1.489991) < 1e-9 and ci(2, 1, 1) == (1, 3)\nassert abs(mde(0.2) - 0.560317) < 1e-9 and mde(1, 1, 1) == 2` },
          { name: "tost", code: `assert tost_equivalent(0.1, 0.2, 0.5)\nassert not tost_equivalent(0.1, 0.3, 0.5)\nassert not tost_equivalent(-0.6, 0.01, 0.5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>power(effect, se, z=1.959964)</C>, the two-sided chance of significance; <C>published_mean(ests, ses, z=1.959964)</C>,
          the mean of the estimates with |estimate/se| above z, or <C>None</C> if there are none; and{" "}
          <C>false_share(prior, pw, alpha=0.05)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def power(effect, se, z=1.959964):
    return 0.0

def published_mean(ests, ses, z=1.959964):
    return sum(ests) / len(ests)

def false_share(prior, pw, alpha=0.05):
    return alpha
`,
        solution: FILTER,
        tests: [
          { name: "power", code: `assert abs(power(0.3, 0.1) - 0.8508387647) < 1e-9 and abs(power(-0.3, 0.1) - 0.8508387647) < 1e-9\nassert abs(false_share(0.2, 0.9, 0.01) - 0.0425531915) < 1e-9` },
          { name: "filter", code: `assert published_mean([0.1, 0.2], [1, 1]) is None\nassert abs(published_mean([3, -0.5, 5, 2.1], [1, 1, 2, 1]) - 3.3666666667) < 1e-9` },
        ],
      },
    },
    {
      key: "inflate",
      rung: "stretch",
      prompt: (
        <p>
          A true effect is 0.1 and each study estimates it with standard error 0.1. Only studies whose estimate exceeds 1.96 standard
          errors above zero are published. What is the expected published estimate? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.249, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course on evaluation and the science of deep learning. The habits it builds, from error bars to ablations to
        honest nulls, are what the next course needs when it asks what is happening inside a network and how to tell a real finding
        from an artefact.
      </p>
    </>
  ),
};
