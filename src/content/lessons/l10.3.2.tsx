import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JudgePpiViz } from "@/components/viz/JudgePpiViz";
import type { LessonContent } from "@/lib/types";

const CORRECT = `def rogan_gladen(q, sens, spec):
    p = (q + spec - 1) / (sens + spec - 1)
    return min(1.0, max(0.0, p))

def first_position_rate(win_first, win_second):
    return (win_first + (1 - win_second)) / 2

def debiased_preference(win_first, win_second):
    return (win_first + win_second) / 2`;

const PPI = `import math

def ppi_mean(judge_unlabelled, judge_labelled, human_labelled):
    rect = [h - j for h, j in zip(human_labelled, judge_labelled)]
    return sum(judge_unlabelled) / len(judge_unlabelled) + sum(rect) / len(rect)

def ppi_se(judge_unlabelled, judge_labelled, human_labelled):
    rect = [h - j for h, j in zip(human_labelled, judge_labelled)]
    terms = 0.0
    for xs in (judge_unlabelled, rect):
        m = sum(xs) / len(xs)
        terms += sum((x - m) ** 2 for x in xs) / (len(xs) - 1) / len(xs)
    return math.sqrt(terms)

def classical_se(human_labelled):
    n = len(human_labelled)
    m = sum(human_labelled) / n
    return math.sqrt(sum((x - m) ** 2 for x in human_labelled) / (n - 1) / n)`;

export const lesson: LessonContent = {
  id: "l10.3.2",
  minutes: 50,
  links: {
    requires: ["l10.3.1", "l9.6.3"],
    revisits: ["l1.3.4", "l10.2.1", "m9.2.4"],
    foreshadows: ["l10.3.3", "l10.3.4", "l10.5.2"],
  },

  puzzle: (
    <>
      <p>
        A team grades 10,000 open-ended answers with a model judge and reports 68% correct. Spot checks show the judge is lenient: it
        passes most wrong answers that sound confident. Human grading of all 10,000 is too expensive; human grading of 200 is
        affordable but noisy. Can the two be combined into an estimate that is both unbiased and more precise than the 200 human labels
        alone?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A model judge is a measuring instrument with systematic errors. Zheng et al. (2023) catalogued the main ones for pairwise
        judging: a preference for whichever answer comes first, for longer answers, and for answers written by the judge itself.
        Systematic errors can be measured and corrected. The cleanest correction uses a small set graded by both humans and the
        judge to estimate the judge&apos;s average error, then subtracts it from the judge&apos;s verdict on the large set.
      </p>
      <JudgePpiViz />
    </>
  ),

  theory: (
    <>
      <Definition title="correcting a judge with known error rates">
        <p>
          Suppose the judge marks a correct answer correct with probability s (sensitivity) and a wrong one wrong with probability t
          (specificity). If the true accuracy is p, the judge&apos;s pass rate is <M>{"q = sp + (1-t)(1-p)"}</M>. Solving gives the
          Rogan–Gladen estimator
        </p>
        <MD>{"\\hat p = \\frac{q + t - 1}{s + t - 1},"}</MD>
        <p>
          clipped to [0, 1] (<C>rogan_gladen</C>). It needs s + t &gt; 1, a judge better than chance, and its variance grows as{" "}
          <M>{"1/(s+t-1)^2"}</M>, so a weak judge yields a noisy corrected estimate. s and t must themselves be estimated on
          human-labelled data, and they can differ between the models being judged.
        </p>
      </Definition>

      <Definition title="position bias">
        <p>
          Present each pair in both orders. If A wins with probability <M>{"w_1"}</M> when shown first and <M>{"w_2"}</M> when shown
          second, the judge picks the first slot at rate <M>{"(w_1 + 1 - w_2)/2"}</M> (<C>first_position_rate</C>), which should be 0.5.
          Averaging the two orders, <M>{"(w_1 + w_2)/2"}</M> (<C>debiased_preference</C>), removes a position effect that is the same for
          every pair. Pairs whose verdict flips with order are better counted as ties than as half-wins, since the judge has no stable
          preference on them.
        </p>
        <Code>{CORRECT}</Code>
      </Definition>

      <Theorem title="prediction-powered inference">
        <p>
          Let N items have judge labels <M>{"f_i"}</M> only, and n other items, drawn from the same distribution, have both judge labels{" "}
          <M>{"f_j"}</M> and human labels <M>{"y_j"}</M>. The estimator
        </p>
        <MD>{"\\hat\\theta = \\frac{1}{N}\\sum_{i=1}^N f_i + \\frac{1}{n}\\sum_{j=1}^n (y_j - f_j)"}</MD>
        <p>
          is unbiased for <M>{"\\mathbb{E}[y]"}</M> whatever the judge&apos;s errors, with variance{" "}
          <M>{"\\operatorname{Var}(f)/N + \\operatorname{Var}(y - f)/n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first mean has expectation <M>{"\\mathbb{E}[f]"}</M> and the second <M>{"\\mathbb{E}[y] - \\mathbb{E}[f]"}</M>, so the sum has
          expectation <M>{"\\mathbb{E}[y]"}</M>. The two sets are independent, so the variances add (<C>ppi_mean</C>, <C>ppi_se</C>). The
          human-only estimator has variance <M>{"\\operatorname{Var}(y)/n"}</M> (<C>classical_se</C>). When the judge agrees with humans
          often, <M>{"\\operatorname{Var}(y - f)"}</M> is much smaller than <M>{"\\operatorname{Var}(y)"}</M>, and with N large the first term
          is negligible, so the interval narrows. When the judge is poor the rectifier is noisy and the estimate can be wider than humans
          alone; Angelopoulos et al. (2023), who introduced the method, also give a tuned version that weights the judge term and is
          never worse.
        </p>
        <Code>{PPI}</Code>
      </Proof>

      <Remark title="biases that do not average out">
        <p>
          A judge that prefers long answers, or answers in its own style, is biased differently for different models, so correcting the
          overall rate is not enough: estimate the correction separately for each model being compared, or the ranking itself can be
          wrong. Panickssery et al. (2024) found that models&apos; preference for their own outputs grows with their ability to recognise
          them. Use a judge from a different model family where possible, hide model identities, and keep a human-labelled sample for
          every model.
        </p>
      </Remark>

      <Example title="the puzzle">
        <p>
          On the 200 doubly labelled answers, humans pass 58% and the judge 65%; the judge passes 68% of the 10,000. The
          prediction-powered estimate is 0.68 + (0.58 − 0.65) = 0.61, with an error bar set mainly by how often the judge and the humans
          disagree on the 200.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "rg",
      rung: "check",
      prompt: (
        <p>
          A judge passes 70% of answers. On a validation set its sensitivity is 0.9 and its specificity 0.8. What is the corrected
          accuracy estimate? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.714, tolerance: 0.001 },
    },
    {
      key: "pos",
      rung: "check",
      prompt: (
        <p>
          Model A wins 80% of comparisons when its answer is shown first and 40% when shown second. How often does the judge choose the
          first-shown answer? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7, tolerance: 0.005 },
    },
    {
      key: "self",
      rung: "apply",
      prompt: (
        <p>
          A judge from model family X ranks model X-2 above model Y-2, but human raters on a sample prefer Y-2. What is the most
          appropriate response?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Suspect self-preference: estimate the judge's error separately for each model on human-labelled samples, or use a judge from another family",
          "Trust the judge, since it graded far more answers than the humans",
          "Average the judge and human rankings with equal weight",
          "Discard the human labels, since they are a small sample",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rogan_gladen(q, sens, spec):
    p = (q + spec - 1) / (sens + spec - 1)
    return min(1.0, max(0.0, p))

def first_position_rate(win_first, win_second):
    return (win_first + (1 - win_second)) / 2

def debiased_preference(win_first, win_second):
    return (win_first + win_second) / 2

print(rogan_gladen(0.5, 0.75, 0.75), rogan_gladen(0.1, 0.9, 0.8))
print(first_position_rate(0.9, 0.3), debiased_preference(0.9, 0.3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.0\n0.8 0.6",
          "0.5 -0.143\n0.8 0.6",
          "0.5 0.0\n0.6 0.6",
          "0.5 0.0\n0.8 0.3",
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

def ppi_mean(judge_unlabelled, judge_labelled, human_labelled):
    rect = [h - j for h, j in zip(human_labelled, judge_labelled)]
    return sum(judge_unlabelled) / len(judge_unlabelled) + sum(rect) / len(rect)

def ppi_se(judge_unlabelled, judge_labelled, human_labelled):
    rect = [h - j for h, j in zip(human_labelled, judge_labelled)]
    terms = 0.0
    for xs in (judge_unlabelled, rect):
        m = sum(xs) / len(xs)
        terms += sum((x - m) ** 2 for x in xs) / (len(xs) - 1) / len(xs)
    return math.sqrt(terms)

def classical_se(human_labelled):
    n = len(human_labelled)
    m = sum(human_labelled) / n
    return math.sqrt(sum((x - m) ** 2 for x in human_labelled) / (n - 1) / n)

print(ppi_mean([1, 1, 0, 0], [1, 1], [1, 0]), round(classical_se([1, 0, 1, 0]), 3))
print(ppi_se([1, 0], [1, 0], [1, 0]), ppi_mean([0, 0], [0, 0], [1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.289\n0.5 1.0",
          "0.5 0.289\n0.5 1.0",
          "0.0 0.25\n0.5 1.0",
          "0.0 0.289\n0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rogan_gladen(q, sens, spec)</C>, clipped to [0, 1], <C>first_position_rate(win_first, win_second)</C>, and{" "}
          <C>debiased_preference(win_first, win_second)</C>, where both arguments are model A&apos;s win rates in the two orders.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rogan_gladen(q, sens, spec):
    return q

def first_position_rate(win_first, win_second):
    return win_first

def debiased_preference(win_first, win_second):
    return win_first
`,
        solution: CORRECT,
        tests: [
          { name: "rg", code: `assert abs(rogan_gladen(0.55, 0.95, 0.85) - 0.5) < 1e-12 and rogan_gladen(0.05, 0.9, 0.9) == 0.0 and rogan_gladen(0.99, 0.9, 0.9) == 1.0` },
          { name: "pos", code: `assert abs(first_position_rate(0.7, 0.5) - 0.6) < 1e-12 and abs(debiased_preference(0.7, 0.5) - 0.6) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ppi_mean(judge_unlabelled, judge_labelled, human_labelled)</C>, <C>ppi_se</C> with the same arguments, and{" "}
          <C>classical_se(human_labelled)</C>, using n − 1 variances throughout.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ppi_mean(judge_unlabelled, judge_labelled, human_labelled):
    return sum(human_labelled) / len(human_labelled)

def ppi_se(judge_unlabelled, judge_labelled, human_labelled):
    return 0.0

def classical_se(human_labelled):
    return 0.0
`,
        solution: PPI,
        tests: [
          { name: "mean", code: `assert abs(ppi_mean([1, 0, 1, 1, 0], [1, 0, 1], [1, 1, 0]) - 0.6) < 1e-12 and abs(ppi_mean([1, 1], [0, 0], [1, 0]) - 1.5) < 1e-12` },
          { name: "se", code: `assert abs(ppi_se([1, 0, 1, 1, 0], [1, 0, 1], [1, 1, 0]) - 0.6271629241) < 1e-9 and abs(classical_se([1, 1, 0]) - 1 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "se",
      rung: "stretch",
      prompt: (
        <p>
          Judge labels on 10,000 answers have variance 0.2356, and on 200 doubly labelled answers the human-minus-judge differences have
          variance 0.09. What is the standard error of the prediction-powered estimate? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0218, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every correction here leaned on human labels as the ground truth. The next lesson asks how good that ground truth is, and how
        to design a human evaluation that deserves the trust.
      </p>
    </>
  ),
};
