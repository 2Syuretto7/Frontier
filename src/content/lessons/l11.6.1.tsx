import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SteeringDoseViz } from "@/components/viz/SteeringDoseViz";
import type { LessonContent } from "@/lib/types";

const STEER = `def mean_diff(pos, neg):
    return [sum(p[i] for p in pos) / len(pos) - sum(q[i] for q in neg) / len(neg) for i in range(len(pos[0]))]

def steer(h, v, alpha):
    return [x + alpha * y for x, y in zip(h, v)]

def ablate(h, v):
    c = sum(x * y for x, y in zip(h, v)) / sum(y * y for y in v)
    return [x - c * y for x, y in zip(h, v)]`;

const DOSE = `def readout_shift(w, v, alpha):
    return alpha * sum(a * b for a, b in zip(w, v))

def collateral(dirs, v, alpha):
    return max(abs(alpha * sum(a * b for a, b in zip(d, v))) for d in dirs)

def best_alpha(alphas, effect, damage, budget):
    ok = [i for i in range(len(alphas)) if damage[i] <= budget]
    if not ok:
        return None
    return alphas[max(ok, key=lambda i: (effect[i], -alphas[i]))]`;

export const lesson: LessonContent = {
  id: "l11.6.1",
  minutes: 50,
  links: {
    requires: ["l11.1.2", "l11.3.3"],
    revisits: ["l11.2.1", "l11.5.2"],
    foreshadows: ["l11.6.2"],
  },

  puzzle: (
    <>
      <p>
        Run a language model on the word &ldquo;Love&rdquo; and on the word &ldquo;Hate&rdquo;, take the difference of its activations at
        one middle layer, and add a multiple of that difference at the same layer while it writes about something unrelated. The text
        turns warmer. No weights changed and no prompt changed. Why should one vector added at one layer change the tone of everything
        that follows, and what does it cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If a concept is represented as a direction in the residual stream (l11.2.1), later layers read it with something close to a dot
        product. Adding the direction raises every such readout, so the model behaves as if the concept were present. The difference of
        mean activations between inputs with and without the concept estimates that direction, and a coefficient sets the dose. Too little
        does nothing; too much pushes on every other feature whose direction overlaps it, and the model degrades.
      </p>
      <SteeringDoseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="steering vectors">
        <p>
          Given sets of activations at one layer for inputs that show a behaviour and inputs that do not, the steering vector is the
          difference of their means, <M>{"v = \\bar h_{+} - \\bar h_{-}"}</M> (<C>mean_diff</C>). Steering replaces each activation h at
          that layer by <M>{"h + \\alpha v"}</M> (<C>steer</C>). Turner and colleagues (2023) used the difference from a single pair of
          prompts; contrastive activation addition (Panickssery and colleagues, 2024) averages over hundreds of pairs that differ only in
          the answer, such as a sycophantic against a candid reply, which removes most of the variation unrelated to the behaviour. The
          converse operation removes a direction: <M>{"h - \\frac{h \\cdot v}{v \\cdot v} v"}</M> (<C>ablate</C>). Arditi and colleagues
          (2024) found that in many chat models refusal is mediated largely by one such direction: ablating it suppressed refusals, and
          adding it made the model refuse harmless requests.
        </p>
        <Code>{STEER}</Code>
      </Definition>

      <Theorem title="the cost of steering in superposition">
        <p>
          If a later readout is linear, <M>{"r = w \\cdot h"}</M>, steering shifts it by exactly <M>{"\\alpha\\, w \\cdot v"}</M>. If w is a
          unit vector in a uniformly random direction in <M>{"\\mathbb{R}^d"}</M>, independent of v, then{" "}
          <M>{"\\mathbb{E}[(w \\cdot v)^2] = |v|^2/d"}</M>, so the shift has root mean square <M>{"\\alpha |v|/\\sqrt{d}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first claim is linearity: <M>{"w \\cdot (h + \\alpha v) - w \\cdot h = \\alpha\\, w \\cdot v"}</M>. For the second, the
          distribution of w is unchanged by rotations, so rotate coordinates to make <M>{"v = |v| e_1"}</M>; then{" "}
          <M>{"w \\cdot v = |v| w_1"}</M>. By symmetry under permuting coordinates every <M>{"\\mathbb{E}[w_k^2]"}</M> is equal, and they sum
          to <M>{"\\mathbb{E}|w|^2 = 1"}</M>, so each is 1/d. With far more features than dimensions (l11.3.1), many readouts overlap the
          steering direction, and every one moves in proportion to the coefficient (<C>readout_shift</C>, <C>collateral</C>).
        </p>
      </Proof>

      <Remark title="choosing the layer and the dose">
        <p>
          Steering works best in middle layers, after the concept has formed and before it has been turned into specific tokens. The dose
          is a trade-off, so report the behaviour and a measure of damage, such as perplexity on ordinary text or accuracy on a benchmark,
          across coefficients, and pick the largest effect within a damage budget (<C>best_alpha</C>). Compare with the obvious baseline
          of simply asking for the behaviour in the prompt. Tan and colleagues (2024) found that the effect of contrastive steering vectors
          varies widely across inputs and sometimes reverses, so an average effect can hide many inputs that are not steered at all.
        </p>
        <Code>{DOSE}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The Love minus Hate difference points mostly along a sentiment direction that later layers read, so adding it makes them behave
          as if the text were positive. Because the vector comes from one pair it also carries everything else that distinguishes those
          two words, and because features share directions the dose spills onto them. That is why the effect is real but the coefficient
          has a narrow useful range, and why averaging over many pairs gives a cleaner vector.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "shift",
      rung: "check",
      prompt: (
        <p>
          Activations with a behaviour have mean (3, 1, 2) and those without have mean (1, 2, 2). A later readout is linear with weights
          (1, 0.5, 1). Steering with coefficient 1.5 along the mean difference changes the readout by how much?
        </p>
      ),
      answer: { kind: "numeric", value: 2.25, tolerance: 0.001 },
    },
    {
      key: "ablate",
      rung: "check",
      prompt: <p>The activation (3, 4) has the direction (1, 1) projected out. What is the length of the result? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.707, tolerance: 0.001 },
    },
    {
      key: "damage",
      rung: "apply",
      prompt: <p>Why does steering with a large coefficient degrade abilities unrelated to the steered behaviour?</p>,
      answer: {
        kind: "choice",
        options: [
          "Other features' directions overlap the steering vector, so their readouts shift too, in proportion to the coefficient",
          "Adding any vector to the residual stream changes the model's weights",
          "Large coefficients make the attention softmax undefined",
          "The steering vector is orthogonal to every other feature, so it erases them",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mean_diff(pos, neg):
    return [sum(p[i] for p in pos) / len(pos) - sum(q[i] for q in neg) / len(neg) for i in range(len(pos[0]))]

def steer(h, v, alpha):
    return [x + alpha * y for x, y in zip(h, v)]

def ablate(h, v):
    c = sum(x * y for x, y in zip(h, v)) / sum(y * y for y in v)
    return [x - c * y for x, y in zip(h, v)]

pos, neg = [[2, 0], [4, 2]], [[1, 1], [1, -1]]
v = mean_diff(pos, neg); print(v, steer([0, 1], v, 0.5), ablate([3, 1], [1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 1.0] [1.0, 1.5] [1.0, -1.0]",
          "[2.0, 1.0] [1.0, 1.5] [2.0, 2.0]",
          "[3.0, 1.0] [1.5, 1.5] [1.0, -1.0]",
          "[2.0, 1.0] [2.0, 2.0] [1.0, -1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def readout_shift(w, v, alpha):
    return alpha * sum(a * b for a, b in zip(w, v))

def collateral(dirs, v, alpha):
    return max(abs(alpha * sum(a * b for a, b in zip(d, v))) for d in dirs)

def best_alpha(alphas, effect, damage, budget):
    ok = [i for i in range(len(alphas)) if damage[i] <= budget]
    if not ok:
        return None
    return alphas[max(ok, key=lambda i: (effect[i], -alphas[i]))]

dirs = [[0.6, 0.8], [1, 0], [0, -1]]
print(readout_shift([1, 2], [3, -1], 2), collateral(dirs, [1, 0.5], 2), best_alpha([0, 1, 2, 3], [0, 0.4, 0.7, 0.9], [0, 0.1, 0.3, 0.6], 0.3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 2.0 2",
          "2 2.0 3",
          "2 1.0 2",
          "-2 2.0 2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mean_diff(pos, neg)</C>, the mean of the vectors in pos minus the mean of those in neg; <C>steer(h, v, alpha)</C>,{" "}
          <M>{"h + \\alpha v"}</M>; and <C>ablate(h, v)</C>, h with its component along v removed.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mean_diff(pos, neg):
    return pos[0]

def steer(h, v, alpha):
    return list(h)

def ablate(h, v):
    return list(h)
`,
        solution: STEER,
        tests: [
          { name: "vector", code: `assert mean_diff([[1, 2], [3, 4]], [[0, 0]]) == [2.0, 3.0]\nassert steer([1, 1], [2, 0], -0.5) == [0.0, 1.0]` },
          { name: "ablate", code: `a = ablate([2, 1, 3], [0, 2, 0])\nassert all(abs(x - y) < 1e-12 for x, y in zip(a, [2, 0, 3]))\nb = ablate([1, 2, 3], [1, 1, 1])\nassert all(abs(x - y) < 1e-12 for x, y in zip(b, [-1, 0, 1]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>readout_shift(w, v, alpha)</C>, the change in the linear readout w &#183; h caused by steering; <C>collateral(dirs, v,
          alpha)</C>, the largest absolute shift over the readout directions in dirs; and <C>best_alpha(alphas, effect, damage, budget)</C>,
          the coefficient with the largest effect among those whose damage is at most budget, the smaller coefficient on ties, or None if
          none qualifies.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def readout_shift(w, v, alpha):
    return 0.0

def collateral(dirs, v, alpha):
    return 0.0

def best_alpha(alphas, effect, damage, budget):
    return alphas[0]
`,
        solution: DOSE,
        tests: [
          { name: "shift", code: `assert abs(readout_shift([1, 0, 2], [1, 1, 1], 0.5) - 1.5) < 1e-12\nassert abs(collateral([[1, 0], [0, 1]], [0.3, -0.4], 2) - 0.8) < 1e-12` },
          { name: "choose", code: `assert best_alpha([0, 0.3, 1], [0, 0.5, 0.5], [0, 0.1, 0.2], 0.5) == 0.3\nassert best_alpha([1, 2], [1, 2], [0.9, 1], 0.5) is None` },
        ],
      },
    },
    {
      key: "noise",
      rung: "stretch",
      prompt: (
        <p>
          Activations in 16 dimensions are the steered concept plus independent background noise with variance 0.05 in every coordinate.
          A steering vector is estimated as the difference of means of 4 inputs with the concept and 4 without. What is the expected
          squared length of the noise in the estimate?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A steering vector reads a concept off the model with a crude estimator and writes it back. Representation engineering makes both
        halves systematic: better ways to find the direction, and ways to use it for monitoring as well as control.
      </p>
    </>
  ),
};
