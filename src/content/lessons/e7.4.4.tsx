import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MfuLossViz } from "@/components/viz/MfuLossViz";
import type { LessonContent } from "@/lib/types";

const UTIL = `def flops_per_token(n_params, layers, seq, d, attention=True):
    return 6 * n_params + (12 * layers * seq * d if attention else 0)

def mfu(tokens_per_sec, per_token, n_gpus, peak):
    return tokens_per_sec * per_token / (n_gpus * peak)

def hfu(tokens_per_sec, n_params, n_gpus, peak, recompute=False):
    return tokens_per_sec * (8 if recompute else 6) * n_params / (n_gpus * peak)`;

const PLAN = `import math

def train_days(n_params, tokens, n_gpus, peak, util):
    return 6 * n_params * tokens / (n_gpus * peak * util) / 86400

def gpus_needed(n_params, tokens, days, peak, util):
    return math.ceil(6 * n_params * tokens / (days * 86400 * peak * util))

def bubble_fraction(stages, microbatches):
    return (stages - 1) / (microbatches + stages - 1)`;

export const lesson: LessonContent = {
  id: "e7.4.4",
  minutes: 50,
  links: {
    requires: ["e7.4.3"],
    revisits: ["e6.4.5", "l5.3.3"],
    foreshadows: ["e7.6.1", "e7.5.3"],
  },

  puzzle: (
    <>
      <p>
        Two labs report training runs on the same GPUs. One reports 55% utilisation, the other 42%. The first lab
        recomputes activations in the backward pass to save memory; the second does not. Which run actually trained
        faster per GPU, and how would you make the comparison fair?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A training run&apos;s useful work is fixed by the model and the data: a known number of FLOPs per token. Divide the
        FLOPs the run must do by the time it took, and compare with what the hardware could do. That ratio, model FLOPs
        utilisation, counts only the FLOPs the model needs, so recomputation, padding or any other extra work does not
        inflate it. Everything that is not a matrix product at full speed lowers it.
      </p>
      <MfuLossViz />
    </>
  ),

  theory: (
    <>
      <Definition title="model and hardware FLOPs utilisation">
        <p>
          For a model with N parameters, L layers, width d and context s, the <em>model FLOPs</em> per training token are{" "}
          <M>{"6N + 12Lsd"}</M>. The <em>model FLOPs utilisation</em> (MFU) of a run that processes τ tokens per second on G
          accelerators of peak Π is
        </p>
        <MD>{"\\text{MFU} = \\frac{\\tau\\,(6N + 12Lsd)}{G\\,\\Pi}."}</MD>
        <p>
          <em>Hardware FLOPs utilisation</em> (HFU) counts the FLOPs actually executed, including recomputation: with
          the forward pass recomputed during the backward, the weight term is 8N instead of 6N.
        </p>
        <Code>{UTIL}</Code>
      </Definition>

      <Theorem title="six FLOPs per parameter per token">
        <p>
          For a network built of matrix products, training on one token costs 2 FLOPs per weight in the forward pass and 4
          in the backward, 6 in all.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take a linear layer <M>{"Y = XW"}</M> with <M>{"W \\in \\mathbb{R}^{a \\times b}"}</M> and t tokens as rows of X.
          The forward pass is <M>{"2tab"}</M> FLOPs, 2 per weight per token. The backward pass computes{" "}
          <M>{"\\partial X = \\partial Y\\,W^\\top"}</M>, to pass the gradient on, and{" "}
          <M>{"\\partial W = X^\\top \\partial Y"}</M>, to update the weight, each also a product of <M>{"2tab"}</M> FLOPs:
          4 per weight per token. Summing over layers gives 6N, ignoring the far smaller cost of elementwise operations and
          biases.
        </p>
      </Proof>

      <Theorem title="the attention term">
        <p>
          The attention scores and their weighted sum add <M>{"12sd"}</M> FLOPs per token per layer in training, counting
          the full <M>{"s \\times s"}</M> score matrix.
        </p>
      </Theorem>
      <Proof>
        <p>
          For one token, the scores against s keys are s dot products of length d, <M>{"2sd"}</M> FLOPs over all heads, and
          the weighted sum of s value vectors is another <M>{"2sd"}</M>. These have no weights, so they are not in 6N. The
          backward pass costs twice the forward, as for any matrix product, so training costs <M>{"3 \\cdot 4sd = 12sd"}</M>{" "}
          per layer. With causal masking a kernel that skips the masked half does half of this, but MFU conventionally counts
          the full term; state which convention you use.
        </p>
      </Proof>

      <Theorem title="planning a run">
        <p>
          Training an N-parameter model on D tokens takes about <M>{"6ND/(G\\,\\Pi\\,\\text{MFU})"}</M> seconds on G
          accelerators, neglecting the attention term.
        </p>
      </Theorem>
      <Proof>
        <p>
          The total model FLOPs are about 6ND, and by the definition of MFU the run performs them at a rate of{" "}
          <M>{"G\\,\\Pi\\,\\text{MFU}"}</M>. Dividing gives the time; solving for G gives the number of accelerators needed
          for a deadline. A 70-billion-parameter model on 2 trillion tokens is <M>{"8.4 \\times 10^{23}"}</M> FLOPs, about 12
          days on 2048 H100s at 40% MFU.
        </p>
        <Code>{PLAN}</Code>
      </Proof>

      <Example title="where utilisation goes">
        <p>
          The matrix kernels themselves rarely exceed 70 to 80% of peak. Normalisations, activations and attention softmax
          run on the ordinary cores. Gradients must be exchanged between GPUs, and only part of that is hidden behind
          compute. With pipeline parallelism over p stages and m microbatches, each stage idles for{" "}
          <M>{"(p-1)/(m + p - 1)"}</M> of the step: a schedule that runs m microbatches through p stages takes{" "}
          <M>{"m + p - 1"}</M> slots, and each stage is busy in m of them. These losses multiply, which is why large runs
          report MFU between about 35 and 60%; PaLM reported 46%.
        </p>
      </Example>

      <Remark title="the puzzle">
        <p>
          With full recomputation, HFU is 8/6 of MFU for the weight term. The first lab&apos;s 55%, if it is HFU, is an MFU of
          about 41%, slightly below the second lab&apos;s 42%. Utilisation figures are comparable only when both are MFU,
          computed with the same FLOP formula and the same peak (dense, not the doubled figure for sparse tensor cores).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "flops",
      rung: "check",
      prompt: <p>A model has 13 billion parameters, 40 layers, width 5120 and context 2048. How many GFLOPs of model FLOPs does each training token need, including the attention term? Give three decimals.</p>,
      answer: { kind: "numeric", value: 83.033, tolerance: 0.0006 },
    },
    {
      key: "bubble",
      rung: "check",
      prompt: <p>What fraction of a step does each stage idle in a pipeline of 8 stages with 24 microbatches? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.226, tolerance: 0.0006 },
    },
    {
      key: "fair",
      rung: "apply",
      prompt: <p>Why is MFU, not HFU, the right figure for comparing training runs?</p>,
      answer: {
        kind: "choice",
        options: [
          "MFU counts only the FLOPs the model needs, so extra work such as recomputation cannot inflate it",
          "HFU cannot be measured on GPUs",
          "MFU is always higher, which makes runs look better",
          "HFU ignores the backward pass",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def flops_per_token(n_params, layers, seq, d, attention=True):
    return 6 * n_params + (12 * layers * seq * d if attention else 0)

def mfu(tokens_per_sec, per_token, n_gpus, peak):
    return tokens_per_sec * per_token / (n_gpus * peak)

def hfu(tokens_per_sec, n_params, n_gpus, peak, recompute=False):
    return tokens_per_sec * (8 if recompute else 6) * n_params / (n_gpus * peak)

print(flops_per_token(7e9, 32, 4096, 4096) / 1e9, flops_per_token(7e9, 32, 4096, 4096, attention=False) / 1e9)
print(round(mfu(3000, 42e9, 1, 312e12), 4), round(hfu(3000, 7e9, 1, 312e12, recompute=True), 4), hfu(1, 1, 2, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "48.442450944 42.0\n0.4038 0.5385 1.0",
          "48.442450944 42.0\n0.4038 0.4038 1.0",
          "42.0 42.0\n0.4038 0.5385 1.0",
          "48.442450944 42.0\n0.4038 0.5385 3.0",
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

def train_days(n_params, tokens, n_gpus, peak, util):
    return 6 * n_params * tokens / (n_gpus * peak * util) / 86400

def gpus_needed(n_params, tokens, days, peak, util):
    return math.ceil(6 * n_params * tokens / (days * 86400 * peak * util))

def bubble_fraction(stages, microbatches):
    return (stages - 1) / (microbatches + stages - 1)

print(round(train_days(70e9, 2e12, 2048, 989e12, 0.4), 2), gpus_needed(70e9, 2e12, 30, 989e12, 0.4), gpus_needed(1, 86400, 1, 6, 1))
print(bubble_fraction(1, 8), round(bubble_fraction(4, 8), 4), round(bubble_fraction(8, 32), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "12.0 820 1\n0.0 0.2727 0.1795",
          "12.0 819 1\n0.0 0.2727 0.1795",
          "4.0 820 1\n0.0 0.2727 0.1795",
          "12.0 820 1\n0.125 0.375 0.2188",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>flops_per_token(n_params, layers, seq, d, attention=True)</C>;{" "}
          <C>mfu(tokens_per_sec, per_token, n_gpus, peak)</C>; and{" "}
          <C>hfu(tokens_per_sec, n_params, n_gpus, peak, recompute=False)</C>, counting only the weight term.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def flops_per_token(n_params, layers, seq, d, attention=True):
    return 2 * n_params

def mfu(tokens_per_sec, per_token, n_gpus, peak):
    return 0.0

def hfu(tokens_per_sec, n_params, n_gpus, peak, recompute=False):
    return 0.0
`,
        solution: UTIL,
        tests: [
          { name: "flops", code: `assert flops_per_token(7e9, 32, 4096, 4096) == 6 * 7e9 + 12 * 32 * 4096 * 4096 and flops_per_token(7e9, 32, 4096, 4096, attention=False) == 42e9
assert flops_per_token(10, 1, 2, 3) == 132 and abs(flops_per_token(13e9, 40, 2048, 5120) / 1e9 - 83.0331648) < 1e-9` },
          { name: "utilisation", code: `assert abs(mfu(3000, 42e9, 1, 312e12) - 0.403846) < 1e-6 and mfu(1, 6, 2, 3) == 1.0
assert hfu(1, 1, 2, 3) == 1.0 and abs(hfu(3000, 7e9, 1, 312e12, recompute=True) - 168e12 / 312e12) < 1e-12
assert abs(hfu(5, 2e9, 4, 1e12, recompute=True) / hfu(5, 2e9, 4, 1e12) - 4 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using 6ND for the total FLOPs, write <C>train_days(n_params, tokens, n_gpus, peak, util)</C>;{" "}
          <C>gpus_needed(n_params, tokens, days, peak, util)</C>, the fewest whole GPUs that finish within the given days;
          and <C>bubble_fraction(stages, microbatches)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def train_days(n_params, tokens, n_gpus, peak, util):
    return 0.0

def gpus_needed(n_params, tokens, days, peak, util):
    return 1

def bubble_fraction(stages, microbatches):
    return 0.0
`,
        solution: PLAN,
        tests: [
          { name: "plan", code: `assert abs(train_days(70e9, 2e12, 2048, 989e12, 0.4) - 8.4e23 / (2048 * 989e12 * 0.4) / 86400) < 1e-9 and train_days(1, 86400, 6, 1, 1) == 1.0
assert gpus_needed(70e9, 2e12, 30, 989e12, 0.4) == 820 and gpus_needed(1, 86400, 1, 6, 1) == 1 and gpus_needed(1, 86401, 1, 6, 1) == 2
d = train_days(7e9, 1e12, gpus_needed(7e9, 1e12, 10, 312e12, 0.5), 312e12, 0.5)
assert d <= 10 and train_days(7e9, 1e12, gpus_needed(7e9, 1e12, 10, 312e12, 0.5) - 1, 312e12, 0.5) > 10` },
          { name: "bubble", code: `assert bubble_fraction(1, 8) == 0.0 and abs(bubble_fraction(4, 8) - 3 / 11) < 1e-12 and abs(bubble_fraction(8, 24) - 7 / 31) < 1e-12 and bubble_fraction(2, 1) == 0.5` },
        ],
      },
    },
    {
      key: "deadline",
      rung: "stretch",
      prompt: (
        <p>
          How many H100s (989 TFLOP/s) at 45% MFU are needed to train a 70-billion-parameter model on 2 trillion tokens in
          45 days, using 6ND?
        </p>
      ),
      answer: { kind: "numeric", value: 486, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        GPUs are not the only way to do matrix products quickly. The next chapter looks at the alternatives, starting with
        the TPU, whose matrix unit is a grid of multiply-adders through which data flows in waves.
      </p>
    </>
  ),
};
