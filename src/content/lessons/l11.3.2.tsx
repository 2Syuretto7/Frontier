import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MaxActivatingViz } from "@/components/viz/MaxActivatingViz";
import type { LessonContent } from "@/lib/types";

const NEURON = `def monosemanticity(w):
    sq = [v * v for v in w]
    return max(sq) / sum(sq)

def top_k(acts, k):
    return sorted(range(len(acts)), key=lambda i: (-acts[i], i))[:k]

def top_k_purity(acts, has_feature, k):
    return sum(has_feature[i] for i in top_k(acts, k)) / k`;

const BASIS = `def variance_share(w, var):
    parts = [a * a * v for a, v in zip(w, var)]
    return [p / sum(parts) for p in parts]

def kurtosis(xs):
    n = len(xs)
    m = sum(xs) / n
    var = sum((x - m) ** 2 for x in xs) / n
    return sum((x - m) ** 4 for x in xs) / n / var ** 2

def activation_frequency(acts, thresh):
    return sum(a > thresh for a in acts) / len(acts)`;

export const lesson: LessonContent = {
  id: "l11.3.2",
  minutes: 50,
  links: {
    requires: ["l11.3.1"],
    revisits: ["l4.1.4", "l11.1.2", "l11.2.1"],
    foreshadows: ["l11.3.3", "l11.4.1", "l11.4.3"],
  },

  puzzle: (
    <>
      <p>
        A researcher studies one neuron in a vision model and finds that its twenty strongest activations are all cat faces. They label
        it the cat-face neuron. A colleague then finds that it also fires, more weakly, on car fronts and on certain fonts, and that
        across a large dataset most of its activation comes from inputs with no cat in them. Which description of the neuron is right?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A neuron is polysemantic when it responds to several unrelated features. Superposition predicts this: if a layer represents more
        features than it has neurons, the features cannot all line up with neurons, so each neuron sees a mixture. Reading a neuron by
        its top activating examples hides the mixture, because the strongest examples come from the one feature with the largest
        weight, while the weaker features can still supply most of the activation overall.
      </p>
      <MaxActivatingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="measuring a neuron">
        <p>
          If a neuron&apos;s input weights on a set of known features are w, its monosemanticity is{" "}
          <M>{"\\max_i w_i^2 / \\sum_i w_i^2"}</M> (<C>monosemanticity</C>), 1 when it reads a single feature. Without known features,
          interpretation usually starts from the inputs that activate it most (<C>top_k</C>); the share of those that contain a candidate
          feature (<C>top_k_purity</C>) is what a human labeller effectively measures.
        </p>
        <Code>{NEURON}</Code>
      </Definition>

      <Theorem title="top examples overstate a neuron's purity">
        <p>
          Let a neuron compute <M>{"a = w_1 x_1 + \\sum_{j=2}^{k} w_j x_j"}</M> with independent features of variances{" "}
          <M>{"\\sigma_j^2"}</M>. Feature 1&apos;s share of the activation&apos;s variance is{" "}
          <M>{"w_1^2\\sigma_1^2 / \\sum_j w_j^2 \\sigma_j^2"}</M> (<C>variance_share</C>), which tends to 0 as more minor features are added,
          while the top examples can still all contain feature 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Independence makes the variances add, which gives the share. Adding minor features with fixed <M>{"w_j^2\\sigma_j^2 = c > 0"}</M>{" "}
          makes the denominator grow without bound, so the share tends to zero. If each feature is bounded and{" "}
          <M>{"w_1 \\max x_1"}</M> exceeds the largest activation reachable without feature 1, then any input with a large enough{" "}
          <M>{"x_1"}</M> outranks every input without it, and the top examples all contain feature 1, however many minor features there
          are. When minor features are sparse, the sum of many of them rarely gets large, which is the situation in the visualisation.
        </p>
      </Proof>

      <Remark title="privileged bases">
        <p>
          A basis is privileged when the architecture makes its directions special. A ReLU acts on each coordinate separately, so the
          neurons of an MLP layer are privileged: rotating them changes what the network computes. The residual stream has no such
          nonlinearity, so any rotation of it, matched by the weights that read and write it, gives the same network (l11.2.1), and there
          is no reason to expect its coordinates to mean anything. A diagnostic is the kurtosis of activations along each coordinate (
          <C>kurtosis</C>): sparse, heavy-tailed coordinates suggest features aligned with the basis, while rotated mixtures look closer
          to Gaussian, whose kurtosis is 3. How often a neuron fires (<C>activation_frequency</C>) is a second cheap statistic.
        </p>
        <Code>{BASIS}</Code>
      </Remark>

      <Remark title="consequences">
        <p>
          Polysemanticity means a neuron is the wrong unit of analysis in general. Some neurons are nearly monosemantic, usually for
          important or frequent features that earn a dedicated dimension, but most are not, and ablating a neuron removes slices of many
          features at once. The features themselves are better thought of as directions in activation space, which may or may not align
          with neurons. Recovering those directions without labels is the goal of the dictionary learning in the next chapter.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Both observations are true, and the second is the more complete description. The neuron reads a cat-face feature with a large
          weight and several other features with smaller weights; the top examples reveal the first, and the bulk of its activation
          reflects the others. Calling it a cat-face neuron would mislead anyone who ablated or steered it.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mono",
      rung: "check",
      prompt: (
        <p>
          A neuron&apos;s weights on four known features are 3, 1, 1 and 1. What is its monosemanticity?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.001 },
    },
    {
      key: "share",
      rung: "check",
      prompt: (
        <p>
          A neuron has weight 2 on one feature and weight 0.5 on each of 16 others, all independent with equal variance. What share of the
          activation&apos;s variance comes from the first feature?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
    {
      key: "label",
      rung: "apply",
      prompt: (
        <p>
          You want to know whether a neuron is really a &quot;French text&quot; neuron. Which test is most informative?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Measure what fraction of its activation, over a large and varied dataset, comes from French text",
          "Check that its top 50 activating examples are all French",
          "Check that it never fires on English",
          "Check that its weights have a large norm",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def monosemanticity(w):
    sq = [v * v for v in w]
    return max(sq) / sum(sq)

def top_k(acts, k):
    return sorted(range(len(acts)), key=lambda i: (-acts[i], i))[:k]

def top_k_purity(acts, has_feature, k):
    return sum(has_feature[i] for i in top_k(acts, k)) / k

acts = [0.1, 0.9, 0.5, 0.7]
print(monosemanticity([3, 4]), top_k(acts, 2), top_k_purity(acts, [True, True, False, False], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.64 [1, 3] 0.5",
          "0.8 [1, 3] 0.5",
          "0.64 [3, 1] 0.5",
          "0.64 [1, 3] 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def variance_share(w, var):
    parts = [a * a * v for a, v in zip(w, var)]
    return [p / sum(parts) for p in parts]

def kurtosis(xs):
    n = len(xs)
    m = sum(xs) / n
    var = sum((x - m) ** 2 for x in xs) / n
    return sum((x - m) ** 4 for x in xs) / n / var ** 2

def activation_frequency(acts, thresh):
    return sum(a > thresh for a in acts) / len(acts)

acts = [0, 0.2, 0.5, 0]
print(variance_share([1, 1], [1, 3]), kurtosis([1, -1, 1, -1]), activation_frequency(acts, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.25, 0.75] 1.0 0.5",
          "[0.5, 0.5] 1.0 0.5",
          "[0.25, 0.75] 3.0 0.5",
          "[0.25, 0.75] 1.0 0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>monosemanticity(w)</C>; <C>top_k(acts, k)</C>, the indices of the k largest activations, ties broken by smaller index;
          and <C>top_k_purity(acts, has_feature, k)</C>, the fraction of those inputs whose flag is true.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def monosemanticity(w):
    return 1.0

def top_k(acts, k):
    return list(range(k))

def top_k_purity(acts, has_feature, k):
    return 1.0
`,
        solution: NEURON,
        tests: [
          { name: "mono", code: `assert abs(monosemanticity([2, -1, 0.5, 0.5]) - 0.7272727273) < 1e-9` },
          { name: "top", code: `a = [0.3, 0.3, 0.8, -1.0, 0.5]\nassert top_k(a, 3) == [2, 4, 0]\nassert abs(top_k_purity(a, [False, True, True, True, False], 3) - 1 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>variance_share(w, var)</C>, each feature&apos;s share of <M>{"\\sum_j w_j^2 \\sigma_j^2"}</M>; <C>kurtosis(xs)</C>, the
          fourth central moment over the squared variance, both with denominator n; and <C>activation_frequency(acts, thresh)</C>, the
          fraction of activations strictly above thresh.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def variance_share(w, var):
    return [1 / len(w)] * len(w)

def kurtosis(xs):
    return 3.0

def activation_frequency(acts, thresh):
    return 1.0
`,
        solution: BASIS,
        tests: [
          { name: "share", code: `s = variance_share([2, -1, 0.5], [0.5, 2.0, 4.0])\nassert all(abs(a - b) < 1e-12 for a, b in zip(s, [0.4, 0.4, 0.2]))` },
          { name: "moments", code: `assert abs(kurtosis([0, 0, 0, 3]) - 7 / 3) < 1e-12 and abs(kurtosis([1, 2, 3, 4]) - 1.64) < 1e-12\nassert abs(activation_frequency([0.0, 0.05, 0.2, 1.0, 0.0], 0.05) - 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "kurt",
      rung: "stretch",
      prompt: (
        <p>
          A neuron&apos;s activation is 1 with probability 0.1 and 0 otherwise. What is its kurtosis, the fourth central moment over the
          squared variance? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 8.111, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        If features are directions rather than neurons, their arrangement matters: which ones are nearly orthogonal, which form
        structures. The next lesson looks at the geometry of feature directions.
      </p>
    </>
  ),
};
