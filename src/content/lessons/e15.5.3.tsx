import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LogitLensViz } from "@/components/viz/LogitLensViz";
import type { LessonContent } from "@/lib/types";

const READ = `import math

def logit_lens(hs, W):
    # hs: one hidden vector per layer; W: one unembedding column per token
    probs = []
    for h in hs:
        z = [sum(a * b for a, b in zip(h, col)) for col in W]
        m = max(z)
        e = [math.exp(v - m) for v in z]
        probs.append([v / sum(e) for v in e])
    return probs

def mean_diff_probe(X, y):
    pos = [x for x, t in zip(X, y) if t]
    neg = [x for x, t in zip(X, y) if not t]
    mp = [sum(c) / len(pos) for c in zip(*pos)]
    mn = [sum(c) / len(neg) for c in zip(*neg)]
    w = [a - b for a, b in zip(mp, mn)]
    mid = [(a + b) / 2 for a, b in zip(mp, mn)]
    return w, -sum(a * b for a, b in zip(w, mid))          # boundary halfway between the class means

def probe_accuracy(X, y, w, b):
    return sum((sum(a * c for a, c in zip(w, x)) + b > 0) == bool(t) for x, t in zip(X, y)) / len(y)`;

const PATCH = `def recovered(clean, corrupt, patched):
    return (patched - corrupt) / (clean - corrupt)         # 0: no effect, 1: fully restores the clean behaviour

def patch_output(clean, corrupt, weights, i):
    vals = [c if j == i else d for j, (c, d) in enumerate(zip(clean, corrupt))]
    return sum(w * v for w, v in zip(weights, vals))

def patch_scan(clean, corrupt, weights):
    out = lambda v: sum(w * x for w, x in zip(weights, v))
    hi, lo = out(clean), out(corrupt)
    return [recovered(hi, lo, patch_output(clean, corrupt, weights, i)) for i in range(len(clean))]`;

export const lesson: LessonContent = {
  id: "e15.5.3",
  minutes: 45,
  links: {
    requires: ["e15.5.2"],
    revisits: ["l8.2.1", "l9.8.2", "e13.3.3"],
    foreshadows: ["e15.5.4"],
  },

  puzzle: (
    <>
      <p>
        After RL, the model solves twice as many arithmetic problems. The evaluation report says so, with intervals. It
        cannot say how: whether the model computes the answer in its hidden states before writing it, at which layers,
        and which components matter. A small model you trained yourself is the ideal subject for finding out, because
        every activation is available and every experiment is cheap. What does a first interpretability study look like?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Start by reading: decode each layer&apos;s hidden state with the model&apos;s own output head to see when an
        answer becomes visible, and train simple linear probes to test whether a property, such as the parity of the
        answer, is linearly readable at each layer. Then intervene: run the model on a clean prompt and on a corrupted
        one that changes the answer, and copy one component&apos;s activation from the clean run into the corrupted run.
        If that alone restores the clean answer, the component carries the information.
      </p>
      <LogitLensViz />
    </>
  ),

  theory: (
    <>
      <Definition title="reading hidden states">
        <p>
          The logit lens applies the final norm and unembedding to the hidden state of every layer and reads off a
          distribution over tokens (<C>logit_lens</C>, which omits the norm for brevity). A linear probe learns a
          direction w and offset b so that the sign of <M>{"w \\cdot h + b"}</M> predicts a label; the simplest uses the
          difference of the class means as w and puts the boundary halfway between them (<C>mean_diff_probe</C>), and is
          judged by held-out accuracy (<C>probe_accuracy</C>).
        </p>
        <Code>{READ}</Code>
      </Definition>

      <Theorem title="when the mean-difference probe is optimal">
        <p>
          If hidden states of the two classes are Gaussian with means <M>{"\\mu_1"}</M> and <M>{"\\mu_0"}</M>, the same
          covariance <M>{"\\sigma^2 I"}</M>, and equal prior probability, then the classifier with the smallest error is
          the mean-difference probe.
        </p>
      </Theorem>
      <Proof>
        <p>
          With equal priors, the minimum-error rule chooses the class with the larger density. The log ratio of the two
          densities is
        </p>
        <MD>{"\\frac{\\|h - \\mu_0\\|^2 - \\|h - \\mu_1\\|^2}{2\\sigma^2} = \\frac{(\\mu_1 - \\mu_0)\\cdot h - (\\mu_1 - \\mu_0)\\cdot \\frac{\\mu_1 + \\mu_0}{2}}{\\sigma^2}"}</MD>
        <p>
          after the quadratic terms in h cancel. It is positive exactly when <M>{"w \\cdot h + b > 0"}</M> with{" "}
          <M>{"w = \\mu_1 - \\mu_0"}</M> and <M>{"b = -w \\cdot (\\mu_1 + \\mu_0)/2"}</M>, which is the mean-difference
          probe. Real activations have strongly unequal variances across directions, so logistic regression usually does
          better, but the mean difference is a robust baseline that is hard to overfit.
        </p>
      </Proof>

      <Definition title="activation patching">
        <p>
          Choose a metric, such as the difference between the logits of the clean answer and the corrupted answer. Run
          the clean and corrupted prompts and record each component&apos;s output. Patching component i means running the
          corrupted prompt with component i&apos;s output replaced by its clean value. The fraction of the metric&apos;s
          clean-minus-corrupted gap that this recovers (<C>recovered</C>) measures how much the component carries. In a
          model whose output is a weighted sum of component outputs, patching is exact arithmetic (<C>patch_output</C>,{" "}
          <C>patch_scan</C>), which makes it a useful test of a patching harness before running it on the real model.
        </p>
        <Code>{PATCH}</Code>
      </Definition>

      <Example title="the capstone study">
        <p>
          Two-digit addition prompts and corrupted versions that change one digit. The logit lens on the answer
          position shows when the correct sum becomes the top token; probes for the tens digit and for the carry at each
          layer show where those are linearly present; patching the residual stream at each layer and position, then
          each attention head in the important layers, localises the computation. The study compares the base and RL
          models, asking whether RL created new machinery or strengthened what pretraining built.
        </p>
      </Example>

      <Remark title="claims and their limits">
        <p>
          A probe that succeeds shows information is present, not that the model uses it. Patching shows a component is
          sufficient to restore the answer given everything else, not that it is the only route; models often have
          redundant paths that compensate when one is ablated. The study reports which kind of evidence supports each
          claim, in the same spirit as the honesty concerns of l9.8.2.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "recover",
      rung: "check",
      prompt: (
        <p>
          The logit difference is 3.2 on the clean prompt and −0.8 on the corrupted one. Patching one head gives 1.9. What
          fraction of the gap does the head recover?
        </p>
      ),
      answer: { kind: "numeric", value: 0.675, tolerance: 0.0001 },
    },
    {
      key: "lens",
      rung: "check",
      prompt: (
        <p>
          A hidden state (1, 2) is decoded against three tokens with unembedding vectors (1, 0), (0, 1) and (1, 1). What
          probability does the third token get? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6652, tolerance: 0.0002 },
    },
    {
      key: "probe",
      rung: "apply",
      prompt: <p>A linear probe reads the carry digit from layer 6 with 98% accuracy. What does this establish?</p>,
      answer: {
        kind: "choice",
        options: [
          "That the carry is linearly decodable at layer 6, not that the model uses it there",
          "That layer 6 computes the carry",
          "That removing layer 6 would break addition",
          "That the model is honest about arithmetic",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def logit_lens(hs, W):
    # hs: one hidden vector per layer; W: one unembedding column per token
    probs = []
    for h in hs:
        z = [sum(a * b for a, b in zip(h, col)) for col in W]
        m = max(z)
        e = [math.exp(v - m) for v in z]
        probs.append([v / sum(e) for v in e])
    return probs

def mean_diff_probe(X, y):
    pos = [x for x, t in zip(X, y) if t]
    neg = [x for x, t in zip(X, y) if not t]
    mp = [sum(c) / len(pos) for c in zip(*pos)]
    mn = [sum(c) / len(neg) for c in zip(*neg)]
    w = [a - b for a, b in zip(mp, mn)]
    mid = [(a + b) / 2 for a, b in zip(mp, mn)]
    return w, -sum(a * b for a, b in zip(w, mid))          # boundary halfway between the class means

def probe_accuracy(X, y, w, b):
    return sum((sum(a * c for a, c in zip(w, x)) + b > 0) == bool(t) for x, t in zip(X, y)) / len(y)

p = logit_lens([[0, 0], [2, 0]], [[1, 0], [0, 1]]); print(p[0], round(p[1][0], 4))
w, b = mean_diff_probe([[2, 0], [4, 2], [0, 0], [2, -2]], [1, 1, 0, 0]); print(w, b, probe_accuracy([[3, 3], [1, -1]], [1, 1], w, b))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.5] 0.8808\n[2.0, 2.0] -4.0 0.5",
          "[0.5, 0.5] 0.8808\n[2.0, 2.0] -4.0 1.0",
          "[0.5, 0.5] 0.7311\n[2.0, 2.0] -4.0 0.5",
          "[0.0, 0.0] 0.8808\n[2.0, 2.0] 4.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def recovered(clean, corrupt, patched):
    return (patched - corrupt) / (clean - corrupt)         # 0: no effect, 1: fully restores the clean behaviour

def patch_output(clean, corrupt, weights, i):
    vals = [c if j == i else d for j, (c, d) in enumerate(zip(clean, corrupt))]
    return sum(w * v for w, v in zip(weights, vals))

def patch_scan(clean, corrupt, weights):
    out = lambda v: sum(w * x for w, x in zip(weights, v))
    hi, lo = out(clean), out(corrupt)
    return [recovered(hi, lo, patch_output(clean, corrupt, weights, i)) for i in range(len(clean))]

print(recovered(4, 0, 1), patch_output([1, 1], [0, 0], [2, 3], 1))
print(patch_scan([1, 2], [0, 0], [1, 1]), patch_scan([1, 1], [0, 1], [5, 9]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 3\n[0.3333333333333333, 0.6666666666666666] [1.0, 0.0]",
          "0.25 2\n[0.3333333333333333, 0.6666666666666666] [1.0, 0.0]",
          "0.25 3\n[0.5, 0.5] [1.0, 0.0]",
          "0.25 3\n[0.3333333333333333, 0.6666666666666666] [0.0, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logit_lens(hs, W)</C>, a softmax over tokens for each hidden vector, with W a list of unembedding
          vectors; <C>mean_diff_probe(X, y)</C>, returning (w, b); and <C>probe_accuracy(X, y, w, b)</C>, predicting
          class 1 when the score is positive.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def logit_lens(hs, W):
    return [[1 / len(W)] * len(W) for h in hs]

def mean_diff_probe(X, y):
    return [0.0] * len(X[0]), 0.0

def probe_accuracy(X, y, w, b):
    return 0.5
`,
        solution: READ,
        tests: [
          { name: "lens", code: `p = logit_lens([[math.log(3)]], [[1], [0]]); assert abs(p[0][0] - 0.75) < 1e-12 and logit_lens([], [[1]]) == []` },
          { name: "probe", code: `w, b = mean_diff_probe([[0], [2], [4], [6]], [0, 0, 1, 1]); assert w == [4.0] and b == -12.0 and probe_accuracy([[3.5], [2.5], [9]], [1, 0, 0], w, b) == 2 / 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>recovered(clean, corrupt, patched)</C>; <C>patch_output(clean, corrupt, weights, i)</C>, the weighted sum
          of component outputs from the corrupted run with component i taken from the clean run; and{" "}
          <C>patch_scan(clean, corrupt, weights)</C>, the recovered fraction for every component.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def recovered(clean, corrupt, patched):
    return patched / clean

def patch_output(clean, corrupt, weights, i):
    return 0

def patch_scan(clean, corrupt, weights):
    return [0.0] * len(clean)
`,
        solution: PATCH,
        tests: [
          { name: "rec", code: `assert recovered(5, 1, 5) == 1 and recovered(5, 1, 0) == -0.25 and patch_output([3, 3], [1, 1], [1, 10], 0) == 13` },
          { name: "scan", code: `assert patch_scan([2, 0, 4], [0, 0, 0], [1, 5, 1]) == [1 / 3, 0.0, 2 / 3]` },
        ],
      },
    },
    {
      key: "scan",
      rung: "stretch",
      prompt: (
        <p>
          A toy model outputs 1.5a + 0.8b + 2c. The clean run has (a, b, c) = (1, 2, 0.5) and the corrupted run (0, −1, 0.5).
          What is the largest fraction of the gap recovered by patching a single component? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6154, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Everything is measured. The final lesson writes it up: the technical report that gathers design, data, training,
        evaluation and these findings into one document others can trust and reproduce.
      </p>
    </>
  ),
};
