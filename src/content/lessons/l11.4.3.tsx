import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SaeFrontierViz } from "@/components/viz/SaeFrontierViz";
import type { LessonContent } from "@/lib/types";

const FIDELITY = `def spliced_loss_recovered(l_clean, l_sae, l_zero):
    return (l_zero - l_sae) / (l_zero - l_clean)

def dominated(p, q):
    return q[0] <= p[0] and q[1] <= p[1] and (q[0] < p[0] or q[1] < p[1])

def pareto_front(points):
    return [i for i, p in enumerate(points) if not any(dominated(p, q) for q in points)]`;

const INTERP = `import math

def detection_accuracy(preds, labels):
    pos = [p for p, l in zip(preds, labels) if l]
    neg = [p for p, l in zip(preds, labels) if not l]
    return (sum(pos) / len(pos) + sum(1 - p for p in neg) / len(neg)) / 2

def simulation_score(pred, true):
    n = len(pred)
    mp, mt = sum(pred) / n, sum(true) / n
    cov = sum((a - mp) * (b - mt) for a, b in zip(pred, true))
    return cov / math.sqrt(sum((a - mp) ** 2 for a in pred) * sum((b - mt) ** 2 for b in true))

def quantile_sample(acts, k):
    order = sorted(range(len(acts)), key=lambda i: (acts[i], i))
    return [order[round(j * (len(acts) - 1) / (k - 1))] for j in range(k)]`;

export const lesson: LessonContent = {
  id: "l11.4.3",
  minutes: 50,
  links: {
    requires: ["l11.4.2"],
    revisits: ["l11.1.1", "l11.1.2", "l10.3.2"],
    foreshadows: ["l11.5.1", "l11.6.4"],
  },

  puzzle: (
    <>
      <p>
        Two teams release sparse autoencoders for the same model. Team A&apos;s has lower reconstruction error at every level of sparsity.
        Team B&apos;s latents get higher scores when a language model is asked to explain them and predict where they fire. A third team
        then finds that autoencoders trained on a randomly initialised copy of the model also get respectable explanation scores. What
        should a careful evaluation of features measure?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A dictionary of features has to do three things: reconstruct the activations faithfully, use few latents per input, and give
        latents that mean something stable and useful. The first two are easy to measure and trade off against each other along a
        frontier. The third is harder and is where evaluations disagree, so a good evaluation combines reconstruction measured by the
        model&apos;s own loss, interpretability judged on examples from the whole range of activations, usefulness on a downstream task,
        and comparison with baselines that should score badly.
      </p>
      <SaeFrontierViz />
    </>
  ),

  theory: (
    <>
      <Definition title="fidelity and sparsity">
        <p>
          Splicing the reconstruction into the model in place of the real activation and measuring the next-token loss gives{" "}
          <M>{"(L_{\\text{zero}} - L_{\\text{SAE}})/(L_{\\text{zero}} - L_{\\text{clean}})"}</M> (<C>spliced_loss_recovered</C>), the share of
          the damage from zero-ablating the layer that the dictionary repairs (compare l11.1.1). Plotting this, or the fraction of
          variance unexplained, against L0 for many dictionaries gives a frontier; a dictionary is dominated if another is at least as
          sparse and at least as faithful and strictly better in one (<C>dominated</C>, <C>pareto_front</C>).
        </p>
        <Code>{FIDELITY}</Code>
      </Definition>

      <Theorem title="a better frontier does not imply better features">
        <p>
          There exist data and two dictionaries, both reconstructing every input exactly, such that the first has strictly lower L0
          while only the second recovers all of the true generating features.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"u_1, u_2"}</M> be orthogonal unit vectors. Feature 1 is active with probability p and magnitude c; feature 2 is active
          only when feature 1 is, with probability q given that, and then with the same magnitude c, so inputs are 0, <M>{"c u_1"}</M> or{" "}
          <M>{"c(u_1 + u_2)"}</M>. Dictionary B has directions <M>{"u_1, u_2"}</M>: it reconstructs exactly, using one latent on inputs of
          the second kind and two on inputs of the third, so its L0 is <M>{"p(1 + q)"}</M>. Dictionary A has directions <M>{"u_1"}</M> and{" "}
          <M>{"(u_1 + u_2)/\\sqrt{2}"}</M>, coding <M>{"c u_1"}</M> with the first and <M>{"c(u_1 + u_2)"}</M> with the second alone at
          coefficient <M>{"c\\sqrt{2}"}</M>. It also reconstructs exactly, and its L0 is p, strictly lower when q &gt; 0. Yet A has no latent
          for feature 2: its second direction has cosine <M>{"1/\\sqrt{2}"}</M> with <M>{"u_2"}</M>, and its <M>{"u_1"}</M> latent stops
          firing whenever feature 2 is present, so as a detector of feature 1 its recall is only 1 - q. The objective rewarded merging a
          frequent co-occurrence into one latent, which is exactly what makes A worse as an account of the features. The visualisation
          shows the same tension in trained autoencoders.
        </p>
      </Proof>

      <Definition title="automated interpretability">
        <p>
          An explainer model reads examples where a latent fires and writes an explanation. A scorer model then uses only the explanation.
          In detection scoring it says, for held-out inputs, whether the latent fires, and the balanced accuracy over firing and
          non-firing inputs is reported (<C>detection_accuracy</C>). In simulation scoring it predicts the activation on each token, and the
          correlation with the true activations is reported (<C>simulation_score</C>). Showing only top examples inflates scores (l11.3.2),
          so examples are drawn across the range of activation values (<C>quantile_sample</C>). Judge models have biases of their own
          (l10.3.2).
        </p>
        <Code>{INTERP}</Code>
      </Definition>

      <Remark title="baselines and downstream tests">
        <p>
          Dictionaries trained on randomly initialised models, or on random directions, give surprisingly interpretable latents, often
          tracking single tokens, so interpretability scores must be compared against such baselines. Downstream tests ask whether
          features help with something: sparse probing with a handful of latents (l11.1.2), removing a spurious cue by ablating the latents
          that encode it, or steering. Absorption, where a general latent such as &quot;starts with S&quot; silently fails on tokens whose
          own latent has absorbed it, is measured by checking a known feature&apos;s recall across tokens.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Lower reconstruction error says Team A&apos;s dictionary is a better approximation; it does not say its directions are the
          model&apos;s features. Higher explanation scores favour Team B, but the random-model result shows those scores partly measure how
          token-like latents are. A careful comparison reports spliced loss at matched L0, explanation scores relative to a random-model
          baseline with quantile-sampled examples, and at least one downstream task.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "spliced",
      rung: "check",
      prompt: (
        <p>
          A model&apos;s loss is 3.0. Zero-ablating a layer raises it to 7.0, and splicing in a sparse autoencoder&apos;s reconstruction
          gives 3.4. What fraction of the loss does the autoencoder recover?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9, tolerance: 0.001 },
    },
    {
      key: "detect",
      rung: "check",
      prompt: (
        <p>
          Given an explanation, a scorer correctly flags 40 of 50 inputs where the latent fires and correctly rejects 135 of 150 where it
          does not. What is the balanced detection accuracy?
        </p>
      ),
      answer: { kind: "numeric", value: 0.85, tolerance: 0.001 },
    },
    {
      key: "baseline",
      rung: "apply",
      prompt: (
        <p>
          A new dictionary-learning method gets a mean detection accuracy of 0.82 on a trained model. Which comparison most strengthens the
          claim that its latents capture the model&apos;s learned features?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The same method on a randomly initialised copy of the model scores much lower",
          "A larger explainer model gives the same score",
          "The score on top-activating examples is higher still",
          "The method's reconstruction error is lower than a standard autoencoder's",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def spliced_loss_recovered(l_clean, l_sae, l_zero):
    return (l_zero - l_sae) / (l_zero - l_clean)

def dominated(p, q):
    return q[0] <= p[0] and q[1] <= p[1] and (q[0] < p[0] or q[1] < p[1])

def pareto_front(points):
    return [i for i, p in enumerate(points) if not any(dominated(p, q) for q in points)]

pts = [(2, 0.5), (3, 0.2), (4, 0.3), (1, 0.9)]
print(round(spliced_loss_recovered(2.0, 2.6, 5.0), 3), dominated(pts[2], pts[1]), pareto_front(pts))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.8 True [0, 1, 3]",
          "0.8 True [1, 3]",
          "0.2 True [0, 1, 3]",
          "0.8 False [0, 1, 2, 3]",
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

def detection_accuracy(preds, labels):
    pos = [p for p, l in zip(preds, labels) if l]
    neg = [p for p, l in zip(preds, labels) if not l]
    return (sum(pos) / len(pos) + sum(1 - p for p in neg) / len(neg)) / 2

def simulation_score(pred, true):
    n = len(pred)
    mp, mt = sum(pred) / n, sum(true) / n
    cov = sum((a - mp) * (b - mt) for a, b in zip(pred, true))
    return cov / math.sqrt(sum((a - mp) ** 2 for a in pred) * sum((b - mt) ** 2 for b in true))

def quantile_sample(acts, k):
    order = sorted(range(len(acts)), key=lambda i: (acts[i], i))
    return [order[round(j * (len(acts) - 1) / (k - 1))] for j in range(k)]

acts = [5, 1, 4, 2, 3]
print(round(detection_accuracy([1, 1, 0, 0], [1, 0, 0, 0]), 3), simulation_score([1, 2, 3], [2, 4, 6]), quantile_sample(acts, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.833 1.0 [1, 4, 0]",
          "0.75 1.0 [1, 4, 0]",
          "0.833 1.0 [0, 4, 1]",
          "0.833 0.5 [1, 4, 0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>spliced_loss_recovered(l_clean, l_sae, l_zero)</C>; <C>dominated(p, q)</C>, true when point q = (L0, error) is at least
          as good as p in both and strictly better in one; and <C>pareto_front(points)</C>, the indices of points no other point
          dominates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def spliced_loss_recovered(l_clean, l_sae, l_zero):
    return 0.0

def dominated(p, q):
    return False

def pareto_front(points):
    return list(range(len(points)))
`,
        solution: FIDELITY,
        tests: [
          { name: "recovered", code: `assert abs(spliced_loss_recovered(3.0, 3.5, 4.0) - 0.5) < 1e-12\nassert not dominated((1, 1), (1, 1)) and dominated((2, 1), (1, 1))` },
          { name: "front", code: `assert pareto_front([(5, 0.1), (2, 0.4), (2, 0.3), (6, 0.05), (7, 0.2)]) == [0, 2, 3]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>detection_accuracy(preds, labels)</C>, the mean of the true-positive and true-negative rates for 0 or 1 predictions;{" "}
          <C>simulation_score(pred, true)</C>, the Pearson correlation; and <C>quantile_sample(acts, k)</C>, the indices at k evenly
          spaced ranks from lowest to highest activation, rounding each rank position, ties broken by index.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def detection_accuracy(preds, labels):
    return 0.5

def simulation_score(pred, true):
    return 0.0

def quantile_sample(acts, k):
    return list(range(k))
`,
        solution: INTERP,
        tests: [
          { name: "scores", code: `assert abs(detection_accuracy([1, 0, 1, 1, 0, 0], [1, 1, 1, 0, 0, 0]) - 2 / 3) < 1e-12\nassert abs(simulation_score([0, 1, 0, 2], [1, 3, 0, 4]) - 0.9534625892) < 1e-9` },
          { name: "sample", code: `assert quantile_sample([0.1, 0.9, 0.3, 0.7, 0.5, 0.0, 0.2], 4) == [5, 6, 4, 1]` },
        ],
      },
    },
    {
      key: "partial",
      rung: "stretch",
      prompt: (
        <p>
          A latent&apos;s activation is the sum of three independent contributions with equal variance, but its explanation describes only
          one, so the scorer predicts exactly that contribution. What simulation score does the explanation get? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.577, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With dictionaries that are good enough, features in different layers can be linked into a graph of how the model computes an
        answer. That is circuit tracing, the next chapter.
      </p>
    </>
  ),
};
