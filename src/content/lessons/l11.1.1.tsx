import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ComponentEffectViz } from "@/components/viz/ComponentEffectViz";
import type { LessonContent } from "@/lib/types";

const FAITHFUL = `def mean_ablate(acts, keep):
    n = len(acts)
    means = [sum(r[j] for r in acts) / n for j in range(len(acts[0]))]
    return [[r[j] if j in keep else means[j] for j in range(len(r))] for r in acts]

def mse(pred, target):
    return sum((p - t) ** 2 for p, t in zip(pred, target)) / len(target)

def loss_recovered(clean, ablated, patched):
    return (ablated - patched) / (ablated - clean)`;

const CAUSAL = `import math

def corr(x, y):
    n = len(x)
    mx, my = sum(x) / n, sum(y) / n
    sxy = sum((a - mx) * (b - my) for a, b in zip(x, y))
    return sxy / math.sqrt(sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y))

def intervention_effect(f, xs, j, delta):
    moved = [r[:j] + [r[j] + delta] + r[j + 1:] for r in xs]
    return sum(f(m) - f(r) for m, r in zip(moved, xs)) / len(xs)

def top_k(scores, k):
    return sorted(range(len(scores)), key=lambda i: (-scores[i], i))[:k]`;

export const lesson: LessonContent = {
  id: "l11.1.1",
  minutes: 45,
  links: {
    requires: ["l5.2.4", "m9.6.1"],
    revisits: ["l4.1.4", "l5.6.2", "l10.7.2"],
    foreshadows: ["l11.1.2", "l11.2.4", "l11.4.3", "l11.6.4"],
  },

  puzzle: (
    <>
      <p>
        Two researchers explain the same language model behaviour. One shows a striking picture: a neuron that fires on every mention
        of a city, with examples that read like a story. The other offers a dull table: keeping just these five components and
        replacing everything else by its average preserves 92% of the model&apos;s performance on the task. Which explanation tells you
        more about the model, and what would it take to make the first one as useful?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Interpretability aims to explain what a trained network computes, in terms a person can check and use: to find bugs, audit for
        unwanted behaviour, predict failures, and understand how learning works. An explanation is a claim about the model, so it
        should be tested like one. Two tests matter most. Is it faithful, meaning that the parts it names actually produce the
        behaviour? And is it causal, meaning that changing those parts changes the behaviour, not merely that they correlate with it?
      </p>
      <ComponentEffectViz />
    </>
  ),

  theory: (
    <>
      <Definition title="faithfulness as loss recovered">
        <p>
          Treat an explanation as a simplified model: keep the components it names and replace the others by a reference value, such as
          their mean over a dataset (<C>mean_ablate</C>). Measure the loss of the clean model, of the model with every candidate
          component ablated, and of the explanation; the loss recovered (<C>loss_recovered</C>) is{" "}
          <M>{"\\frac{L_{\\text{ablated}} - L_{\\text{expl}}}{L_{\\text{ablated}} - L_{\\text{clean}}}"}</M>, 1 when the explanation
          does everything the model does and 0 when it does no better than ablating everything. Losses here can be any measure of
          disagreement, such as the squared error to the model&apos;s own outputs (<C>mse</C>).
        </p>
        <Code>{FAITHFUL}</Code>
      </Definition>

      <Theorem title="loss recovered in a linear model">
        <p>
          Let the output be <M>{"y = \\sum_j w_j x_j"}</M> with independent components of variances <M>{"\\sigma_j^2"}</M>, and score an
          explanation that keeps the set K by squared error to y. Then the loss recovered is{" "}
          <M>{"\\sum_{j \\in K} w_j^2\\sigma_j^2 \\big/ \\sum_j w_j^2\\sigma_j^2"}</M>, so the best k components are those with the largest{" "}
          <M>{"w_j^2\\sigma_j^2"}</M>, not the largest weights.
        </p>
      </Theorem>
      <Proof>
        <p>
          Replacing <M>{"x_j"}</M> by its mean <M>{"\\mu_j"}</M> for <M>{"j \\notin K"}</M> changes the output by{" "}
          <M>{"\\sum_{j\\notin K} w_j(\\mu_j - x_j)"}</M>, whose mean square is <M>{"\\sum_{j\\notin K} w_j^2\\sigma_j^2"}</M> because the
          terms have mean zero and are independent. The clean loss is 0 and ablating everything gives{" "}
          <M>{"\\sum_j w_j^2\\sigma_j^2"}</M>; substituting into the definition gives the formula. A large weight on a component that
          barely varies contributes little, which the visualisation shows.
        </p>
      </Proof>

      <Definition title="correlation and intervention">
        <p>
          A component that correlates with the output (<C>corr</C>) may cause it, or may merely be correlated with something that does.
          An intervention settles the question: shift one component by <M>{"\\delta"}</M>, leave the rest alone, and measure the average
          change in output (<C>intervention_effect</C>). Ranking components by a score and keeping the top k (<C>top_k</C>) gives a
          candidate explanation; whether the score was correlational or interventional decides what the explanation can claim.
        </p>
        <Code>{CAUSAL}</Code>
      </Definition>

      <Remark title="what interpretability is for">
        <p>
          The uses differ in what they need. Debugging needs to localise a failure to a part that can be fixed. Auditing needs coverage:
          confidence that no unexamined part implements a hidden behaviour (l11.6.4). Scientific understanding needs mechanisms that
          generalise across models, such as induction heads (l5.6.2). Each use sets the bar: a plausible story about one neuron, as in
          the puzzle, is a hypothesis; the same story with a measured loss recovered and an intervention that changes the behaviour is
          evidence. The ablation methods of l10.7.2 apply directly, and so do their pitfalls: the choice of reference value changes the
          answer, and components that overlap make each look unnecessary.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The table is a faithfulness measurement, so it says how much of the behaviour the five components carry. The city neuron is
          a correlational observation; it becomes comparably useful when ablating or steering the neuron changes how the model handles
          cities by a measured amount, and when its examples are checked against a held-out set rather than chosen for being striking.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "recovered",
      rung: "check",
      prompt: (
        <p>
          A model has loss 2.0 on a task. Ablating all candidate components gives 5.0, and an explanation that keeps a few of them gives
          2.6. What fraction of the loss does the explanation recover?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "linear",
      rung: "check",
      prompt: (
        <p>
          A linear model has weights 3, 1 and 2 on independent components with standard deviations 0.5, 2 and 1. An explanation keeps only
          the component with the largest weight. What loss does it recover? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.22, tolerance: 0.001 },
    },
    {
      key: "probe",
      rung: "apply",
      prompt: (
        <p>
          A linear classifier reads the sentiment of a review from a layer&apos;s activations with 95% accuracy. What does this show about
          the model?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Sentiment is decodable there, but not that the model uses it; an intervention along that direction is needed to show use",
          "The model computes sentiment in that layer and uses it for its predictions",
          "The layer contains a neuron dedicated to sentiment",
          "Nothing, because classifiers can decode anything from any layer",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mean_ablate(acts, keep):
    n = len(acts)
    means = [sum(r[j] for r in acts) / n for j in range(len(acts[0]))]
    return [[r[j] if j in keep else means[j] for j in range(len(r))] for r in acts]

def mse(pred, target):
    return sum((p - t) ** 2 for p, t in zip(pred, target)) / len(target)

def loss_recovered(clean, ablated, patched):
    return (ablated - patched) / (ablated - clean)

A = mean_ablate([[1, 4], [3, 0]], {0})
print(A, mse([1, 2], [1, 4]), loss_recovered(1.0, 3.0, 1.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 2.0], [3, 2.0]] 2.0 0.75",
          "[[2.0, 4], [2.0, 0]] 2.0 0.75",
          "[[1, 2.0], [3, 2.0]] 4.0 0.75",
          "[[1, 2.0], [3, 2.0]] 2.0 0.25",
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

def corr(x, y):
    n = len(x)
    mx, my = sum(x) / n, sum(y) / n
    sxy = sum((a - mx) * (b - my) for a, b in zip(x, y))
    return sxy / math.sqrt(sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y))

def intervention_effect(f, xs, j, delta):
    moved = [r[:j] + [r[j] + delta] + r[j + 1:] for r in xs]
    return sum(f(m) - f(r) for m, r in zip(moved, xs)) / len(xs)

def top_k(scores, k):
    return sorted(range(len(scores)), key=lambda i: (-scores[i], i))[:k]

xs = [[0, 1], [1, 2], [2, 3]]
print(round(corr([r[1] for r in xs], [2 * r[0] for r in xs]), 3), intervention_effect(lambda r: 2 * r[0], xs, 1, 5), top_k([0.1, 0.7, 0.7, 0.3], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.0 [1, 2]",
          "1.0 10.0 [1, 2]",
          "0.0 0.0 [1, 2]",
          "1.0 0.0 [2, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Activations are a list of rows. Write <C>mean_ablate(acts, keep)</C>, which replaces every column not in the set{" "}
          <C>keep</C> by its mean over the rows; <C>mse(pred, target)</C>; and <C>loss_recovered(clean, ablated, patched)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mean_ablate(acts, keep):
    return acts

def mse(pred, target):
    return 0.0

def loss_recovered(clean, ablated, patched):
    return 0.0
`,
        solution: FAITHFUL,
        tests: [
          { name: "ablate", code: `acts = [[1.0, 2.0, 3.0], [3.0, 6.0, 0.0], [2.0, 1.0, 6.0]]\nassert mean_ablate(acts, {1}) == [[2.0, 2.0, 3.0], [2.0, 6.0, 3.0], [2.0, 1.0, 3.0]]\nassert acts[0] == [1.0, 2.0, 3.0]` },
          { name: "scores", code: `assert abs(mse([0.5, 1.5, 2.0], [1.0, 1.0, 1.0]) - 0.5) < 1e-12\nassert abs(loss_recovered(0.2, 1.0, 0.4) - 0.75) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>corr(x, y)</C>, the Pearson correlation; <C>intervention_effect(f, xs, j, delta)</C>, the mean over rows of f with
          entry j increased by delta minus f of the row, without changing the rows; and <C>top_k(scores, k)</C>, the indices of the k
          highest scores, breaking ties by the smaller index.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def corr(x, y):
    return 0.0

def intervention_effect(f, xs, j, delta):
    return 0.0

def top_k(scores, k):
    return list(range(k))
`,
        solution: CAUSAL,
        tests: [
          { name: "corr", code: `assert abs(corr([1, 2, 3, 4], [2, 4, 5, 9]) - 0.9647638212) < 1e-9\nassert abs(corr([1, 2, 3], [3, 2, 1]) + 1) < 1e-12` },
          { name: "effect", code: `xs = [[1.0, 2.0], [3.0, -1.0]]\nassert abs(intervention_effect(lambda r: r[0] * r[1], xs, 0, 0.5) - 0.25) < 1e-12 and xs[0] == [1.0, 2.0]\nassert top_k([3, 1, 4, 1, 5], 3) == [4, 2, 0] and top_k([2, 2, 1], 2) == [0, 1]` },
        ],
      },
    },
    {
      key: "copy",
      rung: "stretch",
      prompt: (
        <p>
          The output is <M>{"y = 2x_1"}</M>, where <M>{"x_1"}</M> has variance 1. Another component is{" "}
          <M>{"x_2 = x_1 + e"}</M>, with e independent of <M>{"x_1"}</M> and of variance 1, and the model ignores it. What is the
          correlation between <M>{"x_2"}</M> and y? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.707, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The simplest interpretability tool asks what information a layer holds by training a small classifier to read it. The next
        lesson shows what such probes can and cannot establish.
      </p>
    </>
  ),
};
