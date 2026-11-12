import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { PowerLawViz } from "@/components/viz/PowerLawViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.4.4",
  minutes: 55,
  links: {
    revisits: ["l0.2.4"],
    parallels: ["m0.4.4"],
    foreshadows: ["l5.1.1", "l8.1.1"],
  },

  puzzle: (
    <>
      <p>
        You are about to spend tens of millions of dollars of computing time training one very large model, for months. You
        cannot afford to try it twice.
      </p>
      <p>
        Is there any way to know, before you start, how good the model will be? What could you measure cheaply in advance
        that would let you predict the result of the expensive run?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Surprisingly, yes. Train a series of small models, each with more compute than the last, and plot the final loss of
        each. On ordinary axes the points look like a curve flattening out, which suggests that bigger models stop helping. Now
        switch to logarithmic axes, where each step along an axis is ten times the last.
      </p>
      <PowerLawViz />
      <p>
        On log axes the points lie on a straight line. A straight line can be extended, so the loss of a model a hundred times
        larger than any you have trained can be read off in advance. This regularity, called a <strong>scaling law</strong>,
        turned training giant models from a gamble into something closer to engineering.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the transformer">
        <p>
          The <strong>transformer</strong>, introduced in the 2017 paper &ldquo;Attention Is All You Need&rdquo;, is a neural
          network architecture built around <strong>attention</strong>: when processing each word, the network computes how
          relevant every other word is and blends in information from the most relevant ones. Earlier language networks read a
          sentence one word at a time; a transformer looks at all the words at once, which suits GPUs and lets it connect
          words far apart.
        </p>
      </Definition>

      <Example title="from GPT to the assistants">
        <p>
          Researchers trained transformers on the game of the generation lesson, predicting the next word, using large
          portions of the internet. GPT-2 (2019) had 1.5 billion parameters; GPT-3 (2020) had 175 billion and could carry
          out tasks it was never trained for, simply from a few examples in its prompt. In November 2022, ChatGPT put such a
          model, further trained to follow instructions, in front of the public, and it gained a hundred million users in about
          two months.
        </p>
      </Example>

      <Definition title="scaling law">
        <p>
          A <strong>scaling law</strong> describes how a model&rsquo;s loss falls as the resources used to train it grow. For
          language models, loss <M>L</M> falls approximately as a power of the training compute <M>C</M>:
        </p>
        <MD>{"L(C) \\approx L_\\infty + a\\,C^{-\\alpha},"}</MD>
        <p>
          where <M>{"L_\\infty"}</M> is a floor no model can beat, and <M>a</M> and <M>{"\\alpha"}</M> are constants
          measured from small runs. Similar laws hold for the number of parameters and the amount of training data.
        </p>
      </Definition>

      <p>
        Why a straight line on log axes? Take logarithms of <M>{"L - L_\\infty = a\\,C^{-\\alpha}"}</M>: the laws of
        logarithms give <M>{"\\log(L - L_\\infty) = \\log a - \\alpha \\log C"}</M>, which is a straight line in{" "}
        <M>{"\\log C"}</M> with slope <M>{"-\\alpha"}</M>. Each tenfold increase in compute multiplies the reducible loss by
        the same factor, <M>{"10^{-\\alpha}"}</M>.
      </p>

      <Remark title="what the law does and does not say">
        <p>
          Scaling laws predict the loss, the average error at predicting the next word. They do not directly predict which
          abilities will appear: some skills, such as multi-step arithmetic, can seem to switch on suddenly as models grow,
          even while the loss falls smoothly. They also say nothing about whether the data will run out, or whether the
          resulting model will be safe. In 2022, a study known as Chinchilla showed that many large models had been trained
          on too little data for their size, and that for a fixed budget it pays to balance parameters and data, roughly 20
          training tokens per parameter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "year",
      rung: "check",
      prompt: <p>In what year was the transformer introduced?</p>,
      answer: { kind: "numeric", value: 2017 },
    },
    {
      key: "attention",
      rung: "check",
      prompt: <p>What does attention let a transformer do?</p>,
      answer: {
        kind: "choice",
        options: ["Use information from any other word in the text when processing each word", "Read the text strictly one word at a time", "Avoid needing any training data"],
        correct: [0],
      },
    },
    {
      key: "factor",
      rung: "apply",
      prompt: <p>GPT-3 had 175 billion parameters and GPT-2 had 1.5 billion. Roughly how many times larger was GPT-3? Give the nearest whole number.</p>,
      answer: { kind: "numeric", value: 117 },
    },
    {
      key: "tenfold",
      rung: "apply",
      prompt: (
        <p>
          A scaling law has <M>{"\\alpha = 0.05"}</M>. By what factor is the reducible loss multiplied when compute grows
          tenfold? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.891, tolerance: 0.002 },
    },
    {
      key: "chinchilla",
      rung: "apply",
      prompt: <p>By the rule of about 20 tokens per parameter, how many tokens should a 70-billion-parameter model be trained on? Give the answer in trillions.</p>,
      answer: { kind: "numeric", value: 1.4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
q = [1.0, 0.0]                                  # the query
keys = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
scores = [q[0] * k[0] + q[1] * k[1] for k in keys]
total = sum(math.exp(s) for s in scores)
print([round(math.exp(s) / total, 2) for s in scores])`}</Code>
          <p>Attention scores each key by its dot product with the query, then turns the scores into weights with a softmax. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.42, 0.16, 0.42]", "[0.33, 0.33, 0.33]", "[0.5, 0.0, 0.5]", "[1.0, 0.0, 1.0]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
scores = [2.0, 1.0, 0.0]
e = [math.exp(s) for s in scores]
w = [x / sum(e) for x in e]
print([round(x, 3) for x in w], round(sum(w), 6))`}</Code>
          <p>Softmax turns attention scores into weights. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.665, 0.245, 0.09] 1.0", "[0.667, 0.333, 0.0] 1.0", "[0.5, 0.333, 0.167] 1.0", "[0.665, 0.245, 0.09] 3.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>softmax(scores)</C>, which turns a list of scores into weights e<sup>s</sup> / Σe<sup>s</sup>, subtracting the largest score first so that large scores do not overflow, and <C>attend(scores, values)</C>, the weighted average of a list of numbers <C>values</C> with those weights: one attention step for a single query.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax(scores):
    return scores

def attend(scores, values):
    return sum(values) / len(values)
`,
        solution: `import math

def softmax(scores):
    m = max(scores)
    e = [math.exp(s - m) for s in scores]
    return [x / sum(e) for x in e]

def attend(scores, values):
    return sum(w * v for w, v in zip(softmax(scores), values))
`,
        tests: [
          { name: "softmax", code: `w = softmax([2.0, 1.0, 0.0])
assert abs(sum(w) - 1) < 1e-12 and abs(w[0] - 0.6652409557748219) < 1e-12 and softmax([5.0, 5.0]) == [0.5, 0.5], 'Exponentiate, then divide by the total.'` },
          { name: "stable", code: `w = softmax([1000.0, 999.0])
assert abs(w[0] - 1 / (1 + 2.718281828459045 ** -1)) < 1e-9, 'Subtract the largest score so math.exp does not overflow.'` },
          { name: "attend", code: `assert abs(attend([0.0, 0.0, 0.0], [1.0, 2.0, 3.0]) - 2.0) < 1e-12 and abs(attend([100.0, 0.0], [7.0, 1.0]) - 7.0) < 1e-9, 'Equal scores average the values; one dominant score picks its value.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            In a language model, position i may only attend to positions j ≤ i, so it cannot peek at later words. Write <C>causal_weights(scores, i)</C>, the softmax of the first i + 1 scores (later positions get no weight), and <C>causal_output(scores, values, i)</C>, the weighted average of the first i + 1 values with those weights. For example, with scores [0, 0, 5], position 1 gives equal weight to positions 0 and 1 and ignores the large score at 2.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def causal_weights(scores, i):
    return [1.0]

def causal_output(scores, values, i):
    return values[i]
`,
        solution: `import math

def causal_weights(scores, i):
    seen = scores[:i + 1]
    e = [math.exp(s - max(seen)) for s in seen]
    return [x / sum(e) for x in e]

def causal_output(scores, values, i):
    return sum(w * v for w, v in zip(causal_weights(scores, i), values))
`,
        tests: [
          { name: "weights", code: `assert causal_weights([0.0, 0.0, 5.0], 1) == [0.5, 0.5] and causal_weights([3.0, 1.0], 0) == [1.0] and len(causal_weights([1.0, 2.0, 3.0, 4.0], 2)) == 3, 'Only positions 0 to i take part.'` },
          { name: "output", code: `assert causal_output([0.0, 0.0, 5.0], [2.0, 4.0, 100.0], 1) == 3.0 and causal_output([1.0, 9.0], [7.0, 1.0], 0) == 7.0, 'Position i averages only the values it can see.'` },
          { name: "stable", code: `assert abs(causal_output([1000.0, 1000.0], [1.0, 3.0], 1) - 2.0) < 1e-9, 'Subtract the largest visible score first.'` },
        ],
      },
    },
    {
      key: "straight",
      rung: "prove",
      prompt: (
        <p>
          Explain why <M>{"y = a\\,x^{-\\alpha}"}</M> appears as a straight line when plotted with logarithmic scales on both
          axes, and what the slope of that line is.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes logarithms of both sides: log y = log a − α log x.",
          "Uses the laws of logarithms: the log of a product is a sum, and the log of a power is the power times the log.",
          "Notes this is a linear relation between log y and log x, so a straight line on log-log axes.",
          "Identifies the slope as −α and the intercept as log a.",
        ],
      },
    },
    {
      key: "predict",
      rung: "stretch",
      prompt: (
        <p>
          A lab finds that, above a floor of 1.7, the loss is 1.0 at <M>{"10^{20}"}</M> operations and 0.8 at{" "}
          <M>{"10^{21}"}</M>. If the power law holds, what will the reducible loss be at <M>{"10^{23}"}</M>? Give two decimal
          places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.51, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend what a transformer changed about language models, and how a scaling law lets a lab predict a huge model's loss from small experiments.",

  glimpse: (
    <p>
      This completes the short history. Next, what a frontier lab actually does all day. In Transformers and Language Models
      you will build attention from scratch, and in Pretraining Large Language Models you will fit scaling laws to your own
      small runs and use them to plan a larger one.
    </p>
  ),
};
