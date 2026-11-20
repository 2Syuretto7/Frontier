import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ForgettingViz } from "@/components/viz/ForgettingViz";
import type { LessonContent } from "@/lib/types";

const WEIGHTS = `import math

def rel_change(w0, w1):
    diff = math.sqrt(sum((b - a) ** 2 for a, b in zip(w0, w1)))
    return diff / math.sqrt(sum(a * a for a in w0))

def interpolate(w0, w1, alpha):
    return [(1 - alpha) * a + alpha * b for a, b in zip(w0, w1)]

def subspace_point(w0, P, z):
    return [w + sum(p * zj for p, zj in zip(row, z)) for w, row in zip(w0, P)]`;

const MEASURE = `def replay_count(n_sft, frac):
    return n_sft * frac / (1 - frac)

def forgetting(before, after):
    return {task: before[task] - after[task] for task in before}

def shifted_fraction(base_top, tuned_top):
    return sum(a != b for a, b in zip(base_top, tuned_top)) / len(base_top)`;

export const lesson: LessonContent = {
  id: "l9.1.3",
  minutes: 45,
  links: {
    requires: ["l9.1.2", "l8.6.1"],
    revisits: ["l8.7.1", "l8.1.3"],
    foreshadows: ["l9.1.4", "l9.4.2"],
  },

  puzzle: (
    <>
      <p>
        InstructGPT&apos;s authors noticed that their fine-tuned model overfitted the validation loss after a single epoch, yet they
        trained for sixteen, because human raters and their reward model kept preferring the later checkpoints. Other teams
        found that a few thousand steps of fine-tuning could make a model forget skills from pretraining. How can the loss say
        stop while quality says continue, and how much of the original model does fine-tuning change?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fine-tuning starts from weights that already solve a vast task and moves them a short distance towards a small one.
        The move is small in size and, it turns out, lives in a space of few effective directions, which is why it is quick
        and why low-rank methods work (l9.1.4). But every step away from the pretrained solution can cost something it
        knew, and a small dataset is easy to overfit. Validation loss measures likelihood of reference answers, which is not
        what users judge, so it is an imperfect guide to when to stop.
      </p>
      <ForgettingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="how far fine-tuning moves">
        <p>
          The relative change <M>{"\\|w_1 - w_0\\|/\\|w_0\\|"}</M> (<C>rel_change</C>) is typically small for fine-tuning. Weight-space ensembling
          (WiSE-FT) interpolates <M>{"(1-\\alpha)w_0 + \\alpha w_1"}</M> between pretrained and fine-tuned weights (<C>interpolate</C>), trading the new
          skill against what was there before. Aghajanyan and colleagues measured the intrinsic dimension of fine-tuning by
          training only z in <M>{"w = w_0 + Pz"}</M> for a fixed random matrix P (<C>subspace_point</C>): on some tasks a few hundred dimensions
          reached 90% of full fine-tuning&apos;s performance, and larger pretrained models needed fewer.
        </p>
        <Code>{WEIGHTS}</Code>
      </Definition>

      <Theorem title="interpolation and convex losses">
        <p>
          If a loss L is convex in the weights, then for every <M>{"\\alpha \\in [0, 1]"}</M>,{" "}
          <M>{"L((1-\\alpha)w_0 + \\alpha w_1) \\le (1-\\alpha)L(w_0) + \\alpha L(w_1)"}</M>. In particular the interpolated model is never worse on any convex
          loss than the worse of the two endpoints.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is the definition of convexity. The right side is at most <M>{"\\max(L(w_0), L(w_1))"}</M>, since it is a weighted average of the two.
          Network losses are not convex in general, but fine-tuned and pretrained weights often lie in one basin where the loss
          along the segment is close to convex, which is why interpolation works in practice and fails between unrelated runs.
        </p>
      </Proof>

      <Definition title="measuring what changed">
        <p>
          Replay mixes some pretraining-like data into fine-tuning; to make it a fraction f of a mixture with n fine-tuning
          examples needs <M>{"nf/(1-f)"}</M> replay examples (<C>replay_count</C>). Forgetting is measured as the drop on each held-out
          capability (<C>forgetting</C>). Lin and colleagues compared base and fine-tuned models token by token on the same text and
          found that the most likely next token differs at only a small minority of positions (<C>shifted_fraction</C>), mostly
          stylistic ones such as discourse markers and the opening of a reply.
        </p>
        <Code>{MEASURE}</Code>
      </Definition>

      <Remark title="practical settings">
        <p>
          Fine-tuning learning rates are around <M>{"10^{-6}"}</M> to <M>{"10^{-5}"}</M>, an order of magnitude or more below pretraining, with a short
          warmup and linear decay, for one to a few epochs. Low-rank adapters learn less of a new domain than full fine-tuning
          but also forget less, as Biderman and colleagues found. Because validation loss is a poor proxy for quality, teams
          select checkpoints with task metrics, model judges or human ratings, as InstructGPT did, and compare them with the
          seed spread of l8.2.4 in mind.
        </p>
      </Remark>

      <Example title="why the loss and the raters disagree">
        <p>
          Validation loss is the likelihood of one reference answer. A model that becomes more confident in its own phrasing can
          assign lower probability to the reference while producing answers raters prefer. Past the first epoch, rising
          validation loss often reflects this sharpening rather than worse behaviour, so it is evidence to weigh, not a stopping
          rule.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "replay",
      rung: "check",
      prompt: <p>A fine-tuning set has 200,000 examples. How many replay examples make replay 5% of the mixture? Give the nearest whole number.</p>,
      answer: { kind: "numeric", value: 10526, tolerance: 0.5 },
    },
    {
      key: "wise",
      rung: "check",
      prompt: (
        <p>
          Pretrained weights are (1, 0) and fine-tuned weights are (0, 2). What is the relative change from the pretrained weights
          to the interpolation with α = 0.25? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.559, tolerance: 0.001 },
    },
    {
      key: "valloss",
      rung: "apply",
      prompt: <p>Validation loss on reference answers starts rising after one epoch of fine-tuning, while rater preferences keep improving. What is the best response?</p>,
      answer: {
        kind: "choice",
        options: [
          "Choose checkpoints with metrics closer to the goal, such as task scores, judges or human ratings, since the reference likelihood is only a proxy",
          "Stop at the first rise in validation loss, since the model is overfitting",
          "Raise the learning rate to escape the overfitting",
          "Remove the validation set, since it is misleading",
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

def rel_change(w0, w1):
    diff = math.sqrt(sum((b - a) ** 2 for a, b in zip(w0, w1)))
    return diff / math.sqrt(sum(a * a for a in w0))

def interpolate(w0, w1, alpha):
    return [(1 - alpha) * a + alpha * b for a, b in zip(w0, w1)]

def subspace_point(w0, P, z):
    return [w + sum(p * zj for p, zj in zip(row, z)) for w, row in zip(w0, P)]

print(rel_change([3.0, 4.0], [3.0, 5.0]), interpolate([0.0, 2.0], [4.0, 6.0], 0.25))
print(subspace_point([1.0, 1.0, 1.0], [[1.0], [0.0], [-1.0]], [2.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2 [1.0, 3.0]\n[3.0, 1.0, -1.0]",
          "0.2 [3.0, 5.0]\n[3.0, 1.0, -1.0]",
          "1.0 [1.0, 3.0]\n[3.0, 1.0, -1.0]",
          "0.2 [1.0, 3.0]\n[2.0, 0.0, -2.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def replay_count(n_sft, frac):
    return n_sft * frac / (1 - frac)

def forgetting(before, after):
    return {task: before[task] - after[task] for task in before}

def shifted_fraction(base_top, tuned_top):
    return sum(a != b for a, b in zip(base_top, tuned_top)) / len(base_top)

print(replay_count(90, 0.1), forgetting({"maths": 0.6, "code": 0.5}, {"maths": 0.5, "code": 0.5}))
print(shifted_fraction(["a", "b", "c", "d"], ["a", "x", "c", "y"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "10.0 {'maths': 0.09999999999999998, 'code': 0.0}\n0.5",
          "10.0 {'maths': 0.1, 'code': 0.0}\n0.5",
          "9.0 {'maths': 0.09999999999999998, 'code': 0.0}\n0.5",
          "10.0 {'maths': -0.09999999999999998, 'code': 0.0}\n2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rel_change(w0, w1)</C>, <C>interpolate(w0, w1, alpha)</C> and <C>subspace_point(w0, P, z)</C>, where P is a list of rows, one
          per weight.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rel_change(w0, w1):
    return math.sqrt(sum((b - a) ** 2 for a, b in zip(w0, w1)))

def interpolate(w0, w1, alpha):
    return list(w1)

def subspace_point(w0, P, z):
    return list(w0)
`,
        solution: WEIGHTS,
        tests: [
          { name: "change", code: `assert abs(rel_change([0.0, 2.0], [1.0, 2.0]) - 0.5) < 1e-12 and interpolate([2.0, -2.0], [4.0, 2.0], 0.5) == [3.0, 0.0]` },
          { name: "subspace", code: `P = [[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]]\nassert subspace_point([0.0, 1.0, 2.0], P, [3.0, -1.0]) == [3.0, -1.0, 4.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>replay_count(n_sft, frac)</C>, <C>forgetting(before, after)</C> for dictionaries of scores, and{" "}
          <C>shifted_fraction(base_top, tuned_top)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def replay_count(n_sft, frac):
    return n_sft * frac

def forgetting(before, after):
    return {}

def shifted_fraction(base_top, tuned_top):
    return 0.0
`,
        solution: MEASURE,
        tests: [
          { name: "replay", code: `assert abs(replay_count(300, 0.25) - 100) < 1e-9 and forgetting({"a": 0.75, "b": 0.5}, {"a": 0.5, "b": 0.75}) == {"a": 0.25, "b": -0.25}` },
          { name: "shift", code: `assert shifted_fraction([1, 2, 3, 4, 5], [1, 2, 0, 4, 0]) == 0.4 and shifted_fraction(["x"], ["x"]) == 0.0` },
        ],
      },
    },
    {
      key: "alpha",
      rung: "stretch",
      prompt: (
        <p>
          Along the segment between pretrained and fine-tuned weights, the loss on old skills is <M>{"2\\alpha^2"}</M> and the loss on the new task is{" "}
          <M>{"3(1-\\alpha)^2"}</M>. Which α minimises their sum? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        If fine-tuning&apos;s change is small and low-dimensional, it need not update every weight. The next lesson trains a
        low-rank correction instead and asks what that saves and what it loses.
      </p>
    </>
  ),
};
