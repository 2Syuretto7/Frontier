import { M } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { ClaimSorterViz } from "@/components/viz/ClaimSorterViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.5.3",
  minutes: 50,
  links: {
    revisits: ["l0.1.3", "l0.4.3"],
    parallels: ["m0.8.3"],
    foreshadows: ["l10.1.1", "m9.8.1", "m9.8.2"],
  },

  puzzle: (
    <>
      <p>
        A headline says: &ldquo;New AI beats doctors at diagnosing skin cancer.&rdquo; The article says the model was right
        on 95% of images and the doctors on 87%.
      </p>
      <p>
        Before believing it, what would you want to know? Write down at least four questions you would ask the researchers.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Good questions include: Were the test images ones the model had never seen, from different hospitals? How were they
        chosen? Did the doctors see the same information they would see in a clinic? How many images were there, and would a
        different sample have changed the result? What kinds of mistakes did each make? Does the model work as well on darker
        skin, if most training images showed lighter skin?
      </p>
      <p>
        None of these questions needs advanced mathematics, and each has, in real cases, overturned a striking claim. Practise
        on the claims below: for each, pick the main problem, if there is one.
      </p>
      <ClaimSorterViz />
    </>
  ),

  theory: (
    <>
      <Definition title="contamination">
        <p>
          A benchmark is <strong>contaminated</strong> when its test questions, or their answers, appeared in the
          model&rsquo;s training data. Because large models are trained on most of the public internet, any test published
          online before the training data were collected is at risk. A contaminated score measures memory, not ability: the
          trap of the lesson on generalisation, at the scale of the whole field.
        </p>
      </Definition>

      <Definition title="selection">
        <p>
          A claim suffers from <strong>selection</strong> when the evidence shown was chosen to look good: the best five
          outputs out of a hundred, the benchmarks on which the model happened to win, the one run out of ten that went well.
          Ask how examples were chosen and what was left out.
        </p>
      </Definition>

      <Definition title="baselines">
        <p>
          A result is only as impressive as what it is compared with. A <strong>baseline</strong> should be the strongest
          existing method, given the same data and the same compute. Beating a weak or outdated baseline shows little.
        </p>
      </Definition>

      <Definition title="noise">
        <p>
          A score on a finite test set is itself uncertain. On a test of <M>n</M> questions, a model whose true accuracy is
          around 70% will score a few points higher or lower on a different sample of questions, roughly by{" "}
          <M>{"\\sqrt{0.7 \\times 0.3 / n}"}</M>. Training the same model again with a different random seed also shifts its
          score. Differences smaller than this <strong>noise</strong> are not evidence of anything.
        </p>
      </Definition>

      <Example title="the size of the noise">
        <p>
          On 300 questions, <M>{"\\sqrt{0.21 / 300} \\approx 0.026"}</M>, so about 2.6 percentage points. Two models scoring
          70.4% and 70.1% are indistinguishable. On 10,000 questions the noise shrinks to about 0.46 points, and a gap of 3
          points becomes convincing.
        </p>
      </Example>

      <Remark title="both directions">
        <p>
          Careful reading cuts both ways. It means not believing every headline about superhuman AI, and also not dismissing
          real progress because some claims were exaggerated. The habits are the same in both cases: ask what was measured, on
          what data, compared with what, and how much the result would move by chance. They are the habits of a good
          scientist, and they are what a frontier lab needs from everyone who works there.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "contam",
      rung: "check",
      prompt: <p>A test was posted online in 2020. A model was trained on a web crawl from 2024. What is the main risk?</p>,
      answer: { kind: "choice", options: ["Contamination", "Too weak a baseline", "Too few test questions"], correct: [0] },
    },
    {
      key: "cherry",
      rung: "check",
      prompt: <p>A demo video shows the three best results from two hundred attempts. What is this problem called in the lesson?</p>,
      answer: { kind: "choice", options: ["Selection", "Contamination", "Noise"], correct: [0] },
    },
    {
      key: "noise-size",
      rung: "apply",
      prompt: <p>Using the lesson&rsquo;s rule, about how many percentage points of noise are there on a test of 2,100 questions for a model near 70% accuracy? Give one decimal place.</p>,
      answer: { kind: "numeric", value: 1.0, tolerance: 0.05 },
    },
    {
      key: "convincing",
      rung: "apply",
      prompt: <p>On a 300-question test, which gap between two models near 70% would be reasonable evidence that one is better?</p>,
      answer: { kind: "choice", options: ["0.5 points", "2 points", "10 points"], correct: [2] },
    },
    {
      key: "questions",
      rung: "apply",
      prompt: <p>For the skin cancer headline, select every question that could change your view of the result.</p>,
      answer: {
        kind: "choice",
        options: [
          "Were the test images from hospitals not used in training?",
          "What colour was the researchers' logo?",
          "Did the doctors have the patient history they would normally have?",
          "Did the model perform equally well across skin tones?",
        ],
        correct: [0, 2, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
random.seed(0)
scores = [0.70 + random.gauss(0, 0.02) for _ in range(5)]
print(round(max(scores) - min(scores), 3) > 0.01)`}</Code>
          <p>The same model evaluated with five random seeds. Do the scores differ by more than one percentage point?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A claimed improvement may be noise. Write <C>ci95(xs)</C>, which returns (mean, half-width) of an approximate 95% confidence interval for the mean, using 1.96 × sample standard deviation / √n with the n − 1 denominator, and <C>significant(a, b)</C>, which says whether the two intervals do not overlap.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def ci95(xs):
    m = sum(xs) / len(xs)
    return (m, 0.0)

def significant(a, b):
    return ci95(a)[0] != ci95(b)[0]
`,
        solution: `import math

def ci95(xs):
    n = len(xs)
    m = sum(xs) / n
    sd = math.sqrt(sum((x - m) ** 2 for x in xs) / (n - 1))
    return (m, 1.96 * sd / math.sqrt(n))

def significant(a, b):
    ma, ha = ci95(a)
    mb, hb = ci95(b)
    return ma + ha < mb - hb or mb + hb < ma - ha
`,
        tests: [
          { name: "interval", code: `m, h = ci95([1.0, 2.0, 3.0, 4.0])
assert abs(m - 2.5) < 1e-9 and abs(h - 1.96 * (5 / 3) ** 0.5 / 2) < 1e-9, 'Use the n − 1 standard deviation divided by √n.'` },
          { name: "noise", code: `assert not significant([0.70, 0.72, 0.69], [0.71, 0.73, 0.70]), 'A one-point gain within seed noise is not significant.'` },
          { name: "real", code: `assert significant([0.70, 0.71, 0.70], [0.80, 0.81, 0.80]), 'A ten-point gain with small spread is.'` },
        ],
      },
    },
    {
      key: "design",
      rung: "prove",
      prompt: (
        <p>
          You have built a new model and want to claim it is better than the current best at summarising legal documents.
          Describe how you would test it so that a careful sceptic would accept the claim. Address contamination, selection,
          baselines and noise.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses fresh test documents created or collected after the training data, or otherwise shown not to be in it (contamination).",
          "Evaluates on the whole test set, chosen in advance, and reports all results rather than chosen examples (selection).",
          "Compares against the strongest current method under the same conditions and budget (baselines).",
          "Uses enough test documents, repeats training runs or reports uncertainty, and checks the gap exceeds the noise (noise).",
        ],
      },
    },
    {
      key: "quadruple",
      rung: "stretch",
      prompt: <p>By the lesson&rsquo;s rule, how many times more test questions are needed to halve the noise?</p>,
      answer: { kind: "numeric", value: 4 },
    },
  ],

  teachBack:
    "Explain to a friend four questions to ask before believing a claim that an AI system beats humans at something, and why each matters.",

  glimpse: (
    <p>
      This completes How Machines Learn: A First Look. Introduction to Machine Learning follows, where every idea of this
      course is made precise. Evaluation and the Science of Deep Learning studies benchmarks and their pitfalls in depth, and
      Mathematical Statistics gives the tools for comparing models across random seeds and test sets.
    </p>
  ),
};
