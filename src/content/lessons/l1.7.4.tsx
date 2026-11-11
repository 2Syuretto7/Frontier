import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { ErrorViz } from "@/components/viz/ErrorViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.7.4",
  minutes: 45,
  links: {
    revisits: ["l1.3.3", "l1.7.3", "l1.1.4"],
    parallels: ["m4.6.3"],
    foreshadows: ["l3.8.2", "l3.8.4"],
  },

  puzzle: (
    <>
      <p>
        Your email-routing model is 90% accurate, and you have a week. One colleague wants to try a bigger model, another wants
        to collect more data, a third wants to clean the labels.
      </p>
      <p>
        Before choosing, what could you learn in an afternoon, just by reading what the model gets wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Read a hundred errors and note the cause of each. Suppose a third come from forwarded threads, a fifth are mislabelled,
        and a tenth are genuinely ambiguous. Now you know the most that each idea could possibly gain, and which ideas address
        no error at all. An afternoon of reading can save a week of guessing.
      </p>
      <ErrorViz />
      <p>
        Select each cause. The ceiling is the gain if every error of that kind vanished, which no fix achieves. A category
        that is small, or unfixable, is not worth a week however interesting it is.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="error analysis">
        <p>
          <strong>Error analysis</strong> is the systematic study of a model&rsquo;s mistakes to decide what to change. A
          standard loop:
        </p>
        <ol>
          <li>Sample errors at random from a validation set, not the test set.</li>
          <li>Read each one and tag its likely causes; let the categories emerge from the examples.</li>
          <li>Count the tags, and estimate each category&rsquo;s share of all errors.</li>
          <li>For each, estimate the ceiling and how hard it is to fix, and work on the best ratio.</li>
        </ol>
      </Definition>

      <Theorem title="the ceiling of a fix">
        <p>
          If a model&rsquo;s error rate is <M>e</M> and a fraction <M>f</M> of its errors are of some kind, then removing every
          error of that kind lowers the error rate to <M>{"e(1 - f)"}</M>, a gain of <M>{"ef"}</M>.
        </p>
      </Theorem>
      <p>This is immediate, but it disciplines ambition: with <M>{"e = 0.1"}</M> and <M>{"f = 0.3"}</M>, the most any fix of that kind can buy is 3 percentage points.</p>

      <Remark title="how sure is the count?">
        <p>
          The share <M>f</M> is estimated from a sample of <M>m</M> errors, so it is uncertain. If <M>{"\\hat f"}</M> is the
          observed share, its standard error is about
        </p>
        <MD>{"\\sqrt{\\hat f(1 - \\hat f)/m} ."}</MD>
        <p>
          For 30 of 100 that is about 0.046, so the true share is plausibly anywhere from about 21% to 39%. Enough to rank big
          categories, not to split hairs between close ones.
        </p>
      </Remark>

      <Definition title="slices">
        <p>
          A <strong>slice</strong> is a subset of the data defined by a property, such as language, device or region. Reporting
          accuracy per slice reveals failures that the overall number hides: a model can be 92.5% accurate overall while only 70%
          accurate on a small group of users.
        </p>
      </Definition>

      <Example title="a hidden slice">
        <p>
          On 1,800 English emails the model scores 95%; on 200 mixed-language emails, 70%. Overall it gets{" "}
          <M>{"1710 + 140 = 1850"}</M> of 2,000 right, 92.5%. The headline number looks fine; one group of users is badly
          served.
        </p>
      </Example>

      <Remark title="useful habits">
        <p>
          Look at the errors the model is most confident about: they are often label mistakes. Look at the confusion matrix to
          see which classes are confused with which. Keep the test set out of this process, because every look at an example
          tempts a fix tailored to it. And redo the analysis after each change, because the largest category moves.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: <p>From which data should errors for error analysis be drawn?</p>,
      answer: { kind: "choice", options: ["A validation set", "The test set", "The training set only"], correct: [0] },
    },
    {
      key: "confident",
      rung: "check",
      prompt: <p>The errors a model makes with the highest confidence are often what?</p>,
      answer: { kind: "choice", options: ["Mistakes in the labels", "Random noise in the inputs", "Bugs in the optimiser"], correct: [0] },
    },
    {
      key: "ceiling",
      rung: "apply",
      prompt: <p>A model errs on 10% of emails, and 30% of its errors are forwarded threads. By how many percentage points could fixing every such error raise accuracy?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "se",
      rung: "apply",
      prompt: <p>30 of 100 sampled errors are of one kind. What is the standard error of that share? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.046, tolerance: 0.0006 },
    },
    {
      key: "slice",
      rung: "apply",
      prompt: <p>A model is 95% accurate on 1,800 emails and 70% accurate on 200 others. What is its overall accuracy, as a decimal?</p>,
      answer: { kind: "numeric", value: 0.925 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import pandas as pd
df = pd.DataFrame({"len": ["short", "long", "long", "short", "long"], "correct": [1, 0, 0, 1, 1]})
print(df.groupby("len")["correct"].mean().round(2).to_dict())`}</Code>
          <p>Slicing errors by a property of the input. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["{'long': 0.33, 'short': 1.0}", "{'short': 1.0, 'long': 0.33}", "{'long': 0.67, 'short': 1.0}", "{'long': 0.33, 'short': 0.5}"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>worst_slices(df, by, n)</C> for a DataFrame with a 0/1 column <C>correct</C>: group by the column <C>by</C>, compute each group&rsquo;s accuracy and size, keep groups with at least 5 rows, and return the n groups with the lowest accuracy as a list of (group, accuracy, size), worst first.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def worst_slices(df, by, n):
    return []
`,
        solution: `def worst_slices(df, by, n):
    g = df.groupby(by)['correct'].agg(['mean', 'size'])
    g = g[g['size'] >= 5].sort_values('mean').head(n)
    return [(k, float(r['mean']), int(r['size'])) for k, r in g.iterrows()]
`,
        tests: [
          { name: "slices", code: `import pandas as pd
df = pd.DataFrame({'lang': ['en'] * 10 + ['hi'] * 6 + ['ta'] * 2, 'correct': [1] * 9 + [0] + [1, 0, 0, 1, 0, 0] + [0, 0]})
assert worst_slices(df, 'lang', 2) == [('hi', 2 / 6, 6), ('en', 0.9, 10)], 'Ignore slices too small to trust, like ta with 2 rows.'` },
        ],
      },
    },
    {
      key: "labels",
      rung: "prove",
      prompt: (
        <p>
          In an error analysis, 22% of errors turn out to be wrong labels. Explain what fixing those labels would and would not
          change about the model, and why the analysis must not be done on the test set.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that relabelling the evaluation data raises the measured accuracy without changing the model's behaviour.",
          "Notes that fixing wrong labels in the training data may genuinely improve the model, since it stops learning from errors.",
          "Explains that studying test errors leads to changes tailored to those examples, so the test score stops being an honest estimate.",
          "Concludes that error analysis belongs on validation data, with the test set kept for the final measurement.",
        ],
      },
    },
    {
      key: "howmany",
      rung: "stretch",
      prompt: <p>How many errors must you review so that the standard error of a share near 0.3 is at most 0.02?</p>,
      answer: { kind: "numeric", value: 525 },
    },
  ],

  teachBack:
    "Explain to a friend how to run an error analysis, how to compute the ceiling of a fix, and why slices matter.",

  glimpse: (
    <p>
      This completes the course. Statistical Machine Learning rebuilds these methods from probability, and Neural Networks from
      Scratch begins the road to deep learning, where reading loss curves and running ablations become the error analysis of
      training itself.
    </p>
  ),
};
