import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PaperTriageViz } from "@/components/viz/PaperTriageViz";
import type { LessonContent } from "@/lib/types";

const TRIAGE = `def screen_rate(r, sens, fpr):
    return r * sens + (1 - r) * fpr                        # share of papers that pass the first pass

def hours_per_relevant(r, sens, fpr, t1, t2, t3):
    found = r * sens                                       # relevant papers that survive both screens
    return (t1 + screen_rate(r, sens, fpr) * t2) / found + t3

def worth_screening(r, sens, fpr, t1, t2, t3):
    return hours_per_relevant(r, sens, fpr, t1, t2, t3) < t3 / r   # reading everything costs t3 / r`;

const CLAIMS = `import math

def rel_error_reduction(base, new):
    return ((1 - base) - (1 - new)) / (1 - base)           # accuracies as fractions

def beyond_noise(diff, sd, n, z=2.0):
    se = sd * math.sqrt(2 / n)                             # standard error of a difference of two means of n seeds
    return abs(diff) > z * se

def seeds_needed(diff, sd, z=2.0):
    n = 1
    while not beyond_noise(diff, sd, n, z):
        n += 1
    return n`;

export const lesson: LessonContent = {
  id: "l15.1.1",
  minutes: 40,
  links: {
    requires: ["l8.2.4", "l11.1.1"],
    revisits: ["l8.6.3"],
    foreshadows: ["l15.1.2", "l15.3.3"],
  },

  puzzle: (
    <>
      <p>
        Hundreds of machine learning papers appear on arXiv every day. An abstract promises that a new method
        &quot;reduces error by 27%&quot;. Reading the paper properly would take an afternoon, and there are forty more
        like it this week. How should a researcher decide which papers deserve the afternoon, and when one does, what
        should they check before believing that 27%?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Reading is a funnel. A quick first pass over the title, abstract, introduction, section headings and conclusion
        decides whether a paper matters to you; a second pass over its figures, tables and main argument tells you what it
        claims and how strongly it supports the claim; only a few papers earn a third pass in which you rebuild the work
        in your head and challenge every assumption. The funnel saves time because most papers are not relevant, and it
        works only if the quick passes rarely discard the ones that are. Reading a paper well also means reading its
        numbers: a relative error reduction can describe a small absolute change, and a gap between two methods means
        little if it is within the variation between random seeds.
      </p>
      <PaperTriageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the three passes">
        <p>
          Keshav&apos;s 2007 note &quot;How to Read a Paper&quot; gives the method its usual form. The first pass, five to
          ten minutes, should answer five questions: the category of paper (a new method, a measurement, an analysis, a
          system), its context and closest prior work, whether its assumptions look correct, its main contributions, and
          whether it is clearly written. The second pass, up to an hour, reads the figures and tables with care, notes the
          references you have not read, and skips proofs. The third pass, several hours for a newcomer, re-derives the
          results and asks how you would have done the work, which is where hidden assumptions and missing experiments
          show up.
        </p>
      </Definition>

      <Theorem title="when screening pays">
        <p>
          Let a share r of papers be relevant. Suppose the first pass, costing <M>{"t_1"}</M>, passes a relevant paper with
          probability s and an irrelevant one with probability f; the second pass, costing <M>{"t_2"}</M>, is applied to
          everything that passes and correctly keeps exactly the relevant ones; the third costs <M>{"t_3"}</M>. Then the
          expected time per relevant paper read in full is
        </p>
        <MD>{"h = \\frac{t_1 + q\\,t_2}{r s} + t_3, \\qquad q = r s + (1 - r) f"}</MD>
        <p>
          (<C>screen_rate</C>, <C>hours_per_relevant</C>), against <M>{"t_3 / r"}</M> for reading every paper in full. The
          funnel is cheaper exactly when <M>{"h < t_3/r"}</M> (<C>worth_screening</C>), and it finds only a share s of the
          relevant papers.
        </p>
        <Code>{TRIAGE}</Code>
      </Theorem>
      <Proof>
        <p>
          Per paper entering the funnel, the expected time is <M>{"t_1"}</M> for the first pass, plus <M>{"t_2"}</M> times
          the probability q of passing it, plus <M>{"t_3"}</M> times the probability rs that the paper is relevant and
          survives both passes. The expected number of relevant papers read in full per paper entering is rs. Over n
          papers both totals scale by n, so the ratio is <M>{"(t_1 + q t_2 + r s t_3)/(r s)"}</M>, which is the formula.
          Reading every paper in full costs <M>{"n t_3"}</M> for nr relevant papers. As r falls, h grows like{" "}
          <M>{"1/r"}</M> with constant <M>{"(t_1 + f t_2)/s"}</M>, far smaller than <M>{"t_3"}</M>, which is why the
          funnel matters most when relevant papers are rare.
        </p>
      </Proof>

      <Definition title="reading a results table">
        <p>
          A claimed improvement can be stated in several ways. Accuracy rising from 0.9 to 0.95 is a gain of five points,
          and also a halving of the error rate (<C>rel_error_reduction</C>); abstracts tend to choose whichever sounds
          larger. Before believing a gap, ask how much it would vary if the experiments were rerun with different seeds.
        </p>
      </Definition>

      <Theorem title="seed noise in a comparison">
        <p>
          If each method is run with n independent seeds and a single run has standard deviation σ, the difference of
          the two mean scores has standard error <M>{"\\sigma\\sqrt{2/n}"}</M>. A gap larger than about two standard
          errors is unlikely to be seed noise alone (<C>beyond_noise</C>), and the smallest n that makes a gap d clear is
          the least integer above <M>{"2(z\\sigma/d)^2"}</M> (<C>seeds_needed</C>).
        </p>
        <Code>{CLAIMS}</Code>
      </Theorem>
      <Proof>
        <p>
          The mean of n independent runs has variance <M>{"\\sigma^2/n"}</M>. The two means are independent, so their
          difference has variance <M>{"2\\sigma^2/n"}</M> and standard deviation <M>{"\\sigma\\sqrt{2/n}"}</M>. The
          condition <M>{"d > z\\sigma\\sqrt{2/n}"}</M> rearranges to <M>{"n > 2(z\\sigma/d)^2"}</M>, and its left side is
          increasing in n, so the least such integer is the answer. This covers only seed noise: differences in tuning
          effort, data or evaluation can produce gaps that no number of seeds will reveal, which is what the ablations of
          l8.2.4 and the reproduction of the next lesson are for.
        </p>
      </Proof>

      <Example title="the puzzle's 27%">
        <p>
          Suppose accuracy rose from 96.3% to 97.3%. The error rate fell from 3.7% to 2.7%, a relative reduction of
          1.0/3.7 ≈ 27%, and an absolute gain of one point. With three seeds per method and a seed standard deviation of
          0.4 points, the standard error of the gap is <M>{"0.4\\sqrt{2/3} \\approx 0.33"}</M>, so one point is about three
          standard errors: probably not seed noise. Whether it survives equal tuning of the baseline is a separate
          question the table may not answer.
        </p>
      </Example>

      <Remark title="questions for the second pass">
        <p>
          Were the baselines tuned with the same budget as the new method? Are the numbers from the paper&apos;s own runs
          or copied from other papers with different setups? How many seeds, and are there error bars? Does the
          evaluation metric create the effect, as with the apparent emergence of l8.6.3? Which experiment would most
          likely break the claim, and was it run? A paper that answers these is worth the third pass.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hours",
      rung: "check",
      prompt: (
        <p>
          One paper in ten is relevant. A six-minute first pass keeps relevant papers with probability 0.9 and irrelevant
          ones with probability 0.2; the second pass takes an hour and the third four hours. How many hours does the
          funnel spend per relevant paper read in full? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 8.111, tolerance: 0.002 },
    },
    {
      key: "relerr",
      rung: "check",
      prompt: (
        <p>
          Accuracy rises from 88.5% to 91.2%. What is the relative reduction in error rate, as a fraction? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.2348, tolerance: 0.0005 },
    },
    {
      key: "pass1",
      rung: "apply",
      prompt: <p>What is the first pass of a paper meant to decide?</p>,
      answer: {
        kind: "choice",
        options: [
          "What kind of paper it is, what it claims and builds on, and whether it deserves a closer read",
          "Whether every proof in the paper is correct",
          "How to reimplement the method from scratch",
          "Which of the paper's references are wrong",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def screen_rate(r, sens, fpr):
    return r * sens + (1 - r) * fpr                        # share of papers that pass the first pass

def hours_per_relevant(r, sens, fpr, t1, t2, t3):
    found = r * sens                                       # relevant papers that survive both screens
    return (t1 + screen_rate(r, sens, fpr) * t2) / found + t3

def worth_screening(r, sens, fpr, t1, t2, t3):
    return hours_per_relevant(r, sens, fpr, t1, t2, t3) < t3 / r   # reading everything costs t3 / r

print(screen_rate(0.5, 0.8, 0.2), round(hours_per_relevant(0.5, 0.8, 0.2, 0.1, 1, 2), 3))
print(worth_screening(0.5, 0.8, 0.2, 0.1, 1, 2), worth_screening(0.05, 0.8, 0.2, 0.1, 1, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 3.5\nTrue True", "0.5 3.5\nTrue False", "0.5 2.75\nTrue True", "0.4 3.5\nFalse True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def rel_error_reduction(base, new):
    return ((1 - base) - (1 - new)) / (1 - base)           # accuracies as fractions

def beyond_noise(diff, sd, n, z=2.0):
    se = sd * math.sqrt(2 / n)                             # standard error of a difference of two means of n seeds
    return abs(diff) > z * se

def seeds_needed(diff, sd, z=2.0):
    n = 1
    while not beyond_noise(diff, sd, n, z):
        n += 1
    return n

print(round(rel_error_reduction(0.9, 0.95), 3), beyond_noise(1.0, 1.0, 8), beyond_noise(-1.2, 1.0, 8))
print(seeds_needed(1.0, 1.0), seeds_needed(0.5, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 False True\n9 33",
          "0.5 True True\n8 32",
          "0.05 False True\n9 33",
          "0.5 False False\n9 33",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>screen_rate(r, sens, fpr)</C>, <C>hours_per_relevant(r, sens, fpr, t1, t2, t3)</C> and{" "}
          <C>worth_screening(r, sens, fpr, t1, t2, t3)</C>, which compares with reading every paper in full.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def screen_rate(r, sens, fpr):
    return sens

def hours_per_relevant(r, sens, fpr, t1, t2, t3):
    return t1 + t2 + t3

def worth_screening(r, sens, fpr, t1, t2, t3):
    return True
`,
        solution: TRIAGE,
        tests: [
          { name: "rate", code: `assert abs(screen_rate(0.2, 0.5, 0.25) - 0.3) < 1e-12 and abs(hours_per_relevant(0.2, 0.5, 0.25, 1, 2, 3) - 19) < 1e-12` },
          { name: "worth", code: `assert worth_screening(0.1, 1, 0, 1, 1, 10) and not worth_screening(1, 1, 0, 1, 1, 10) and not worth_screening(0.5, 0.5, 0.5, 4, 4, 5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rel_error_reduction(base, new)</C> for accuracies given as fractions,{" "}
          <C>beyond_noise(diff, sd, n, z=2.0)</C>, true when the gap exceeds z standard errors of a difference of two
          n-seed means, and <C>seeds_needed(diff, sd, z=2.0)</C>, the least such n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rel_error_reduction(base, new):
    return new - base

def beyond_noise(diff, sd, n, z=2.0):
    return abs(diff) > z * sd

def seeds_needed(diff, sd, z=2.0):
    return 1
`,
        solution: CLAIMS,
        tests: [
          { name: "relerr", code: `assert abs(rel_error_reduction(0.8, 0.9) - 0.5) < 1e-12 and abs(rel_error_reduction(0.6, 0.5) + 0.25) < 1e-12` },
          { name: "noise", code: `assert beyond_noise(-3, 1, 2) and not beyond_noise(1.9, 1, 2) and seeds_needed(1, 1) == 9 and seeds_needed(2, 1, 1) == 1 and seeds_needed(1, 2.9) == 68` },
        ],
      },
    },
    {
      key: "seeds",
      rung: "stretch",
      prompt: (
        <p>
          Two methods differ by 0.4 points, and single runs vary with a standard deviation of 0.7 points. With z = 2, how
          many seeds per method are needed before the gap exceeds two standard errors?
        </p>
      ),
      answer: { kind: "numeric", value: 25, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The surest way to know whether a paper&apos;s result holds is to reproduce it. The next lesson asks what counts as
        a successful reproduction, and how to tell a real discrepancy from noise.
      </p>
    </>
  ),
};
