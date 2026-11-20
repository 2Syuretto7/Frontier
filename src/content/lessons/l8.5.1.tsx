import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CoordCheckViz } from "@/components/viz/CoordCheckViz";
import type { LessonContent } from "@/lib/types";

const RULES = `import math

def width_mult(d, d_base):
    return d / d_base

def mup_layer(kind, base_std, base_lr, m):
    if kind == "embedding":
        return base_std, base_lr
    if kind == "hidden":
        return base_std / math.sqrt(m), base_lr / m
    if kind == "output":
        return base_std / m, base_lr / m
    raise ValueError(kind)

def attn_scale(d_head, mup):
    return 1 / d_head if mup else 1 / math.sqrt(d_head)`;

const CHECK = `import math

def first_step_change(n, lr):
    x = [math.cos(j) for j in range(n)]
    dW = [-lr * (1 if v > 0 else -1 if v < 0 else 0) for v in x]
    return abs(sum(a * b for a, b in zip(dW, x)))

def coord_check(widths, lr_of_width):
    return [first_step_change(n, lr_of_width(n)) for n in widths]

def spread(values):
    return max(values) / min(values)`;

export const lesson: LessonContent = {
  id: "l8.5.1",
  minutes: 50,
  links: {
    requires: ["m17.4.1", "m17.4.2", "m14.2.3"],
    revisits: ["l8.2.1", "m17.4.3"],
    foreshadows: ["l8.5.2"],
  },

  puzzle: (
    <>
      <p>
        Tuning the learning rate of a 70-billion-parameter model by trial and error would cost several full training runs. The
        theory of m17.4 says that under the maximal update parametrisation the best learning rate stops depending on width, so it
        can be tuned on a model a hundred times narrower and copied across. Turning that promise into a working training script
        means touching every layer&apos;s initialisation, learning rate and forward multipliers. Which changes are needed, and how
        do you check that you made them correctly?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adam updates every weight by roughly the learning rate in size, whatever its gradient. A hidden layer with n inputs
        then changes its outputs by an amount proportional to n times the learning rate, because n small aligned updates add
        up. Divide the learning rate by the width multiplier and the change stays the same at every width. The output layer
        needs the same treatment and also a smaller initialisation, so that its logits do not start out dominated by width.
        The test is empirical: a coordinate check shows whether activation updates stay flat as width grows.
      </p>
      <CoordCheckViz />
    </>
  ),

  theory: (
    <>
      <Definition title="μP for Adam, in practice">
        <p>
          Choose a base width <M>{"d_0"}</M> and let <M>{"m = d/d_0"}</M> (<C>width_mult</C>). Relative to the base model&apos;s standard deviation{" "}
          <M>{"\\sigma_0"}</M> and learning rate <M>{"\\eta_0"}</M>, set (<C>mup_layer</C>):
        </p>
        <ul>
          <li>embedding (input) weights: standard deviation <M>{"\\sigma_0"}</M>, learning rate <M>{"\\eta_0"}</M>, both unchanged, since their fan-in, the vocabulary, does not grow;</li>
          <li>hidden weights: standard deviation <M>{"\\sigma_0/\\sqrt m"}</M>, as in standard practice, and learning rate <M>{"\\eta_0/m"}</M>;</li>
          <li>output weights: standard deviation <M>{"\\sigma_0/m"}</M> and learning rate <M>{"\\eta_0/m"}</M>, or equivalently a forward multiplier on the logits;</li>
          <li>attention logits scaled by <M>{"1/d_{\\mathrm{head}}"}</M> instead of <M>{"1/\\sqrt{d_{\\mathrm{head}}}"}</M> (<C>attn_scale</C>).</li>
        </ul>
        <Code>{RULES}</Code>
      </Definition>

      <Theorem title="why a hidden layer needs η/m under Adam">
        <p>
          On its first step Adam moves each weight by <M>{"-\\eta\\,\\mathrm{sign}(g_{ij})"}</M>. For a layer <M>{"h = Wx"}</M> with <M>{"g = \\delta x^\\top"}</M>,
          the change in output i is
        </p>
        <MD>{"\\Delta h_i = -\\eta\\,\\mathrm{sign}(\\delta_i)\\sum_{j=1}^{n} |x_j|"}</MD>
        <p>
          which grows linearly in n when the entries of x are of constant size (<C>first_step_change</C>). With{" "}
          <M>{"\\eta = \\eta_0 / m"}</M> it is independent of width (<C>coord_check</C>, <C>spread</C>).
        </p>
        <Code>{CHECK}</Code>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{sign}(g_{ij}) = \\mathrm{sign}(\\delta_i)\\,\\mathrm{sign}(x_j)"}</M>, so{" "}
          <M>{"\\Delta h_i = \\sum_j \\Delta W_{ij} x_j = -\\eta\\,\\mathrm{sign}(\\delta_i) \\sum_j \\mathrm{sign}(x_j) x_j"}</M>, and <M>{"\\mathrm{sign}(x_j)x_j = |x_j|"}</M>.
          If the <M>{"|x_j|"}</M> average to a constant μ, the sum is about nμ. Under SGD the same calculation gives a sum of{" "}
          <M>{"\\delta_i x_j^2"}</M>, also linear in n, which is why μP for SGD scales the learning rate differently but for the same reason.
        </p>
      </Proof>

      <Remark title="the coordinate check">
        <p>
          Bugs in a μP implementation are silent: the model trains, only the transfer fails. The standard test is to train for a
          few steps at several widths and plot the typical size of each layer&apos;s activations, or their change from
          initialisation, against width. Under correct μP every curve is flat; a curve rising with width points to the layer whose
          learning rate, initialisation or multiplier is wrong. The test takes minutes on one device and should be run whenever
          the architecture changes.
        </p>
      </Remark>

      <Example title="what transfers and what does not">
        <p>
          Learning rate, initialisation scale and the output and embedding multipliers transfer across width under μP. Batch size,
          training length and weight decay do not, and are treated in the next two lessons. Depth needs its own rule: scaling each
          residual branch by <M>{"1/\\sqrt L"}</M>, or by 1/L in newer variants, makes the learning rate transfer across depth as well.
          Cerebras-GPT, and several later open models, tuned at around 40 million parameters and transferred to billions, and
          found the transferred settings close to optimal.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "lr",
      rung: "check",
      prompt: <p>A base model of width 256 is tuned to an Adam learning rate of 0.006. Under μP, what learning rate do the hidden weights get at width 4096?</p>,
      answer: { kind: "numeric", value: 0.000375, tolerance: 0.000001 },
    },
    {
      key: "attn",
      rung: "check",
      prompt: <p>With head dimension 128, by what factor are μP attention logits smaller than standard ones for the same queries and keys? Give two decimals.</p>,
      answer: { kind: "numeric", value: 11.31, tolerance: 0.01 },
    },
    {
      key: "embed",
      rung: "apply",
      prompt: <p>Why does the embedding layer keep the base learning rate under μP?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its fan-in is the vocabulary, which does not grow with width, so each output coordinate's update does not grow with width either",
          "Embeddings are frozen during pretraining",
          "Its learning rate must be larger than that of every other layer",
          "Embedding gradients are always zero",
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

def width_mult(d, d_base):
    return d / d_base

def mup_layer(kind, base_std, base_lr, m):
    if kind == "embedding":
        return base_std, base_lr
    if kind == "hidden":
        return base_std / math.sqrt(m), base_lr / m
    if kind == "output":
        return base_std / m, base_lr / m
    raise ValueError(kind)

def attn_scale(d_head, mup):
    return 1 / d_head if mup else 1 / math.sqrt(d_head)

print(width_mult(1024, 256), mup_layer("hidden", 0.02, 0.01, 4.0), mup_layer("embedding", 0.02, 0.01, 4.0))
print(mup_layer("output", 0.02, 0.01, 4.0), attn_scale(64, True), attn_scale(64, False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 (0.01, 0.0025) (0.02, 0.01)\n(0.005, 0.0025) 0.015625 0.125",
          "4.0 (0.01, 0.0025) (0.01, 0.0025)\n(0.005, 0.0025) 0.015625 0.125",
          "4.0 (0.005, 0.0025) (0.02, 0.01)\n(0.005, 0.0025) 0.015625 0.125",
          "4.0 (0.01, 0.0025) (0.02, 0.01)\n(0.01, 0.0025) 0.125 0.015625",
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

def first_step_change(n, lr):
    x = [math.cos(j) for j in range(n)]
    dW = [-lr * (1 if v > 0 else -1 if v < 0 else 0) for v in x]
    return abs(sum(a * b for a, b in zip(dW, x)))

def coord_check(widths, lr_of_width):
    return [first_step_change(n, lr_of_width(n)) for n in widths]

def spread(values):
    return max(values) / min(values)

print(first_step_change(1, 0.5), round(first_step_change(2, 1.0), 4))
print(round(spread(coord_check([100, 400, 1600], lambda n: 0.01)), 1), round(spread(coord_check([100, 400, 1600], lambda n: 1.0 / n)), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 1.5403\n16.0 1.0",
          "0.5 1.5403\n4.0 1.0",
          "0.5 0.4597\n16.0 1.0",
          "0.5 1.5403\n16.0 16.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>width_mult(d, d_base)</C>, <C>mup_layer(kind, base_std, base_lr, m)</C> returning (std, lr) for &ldquo;embedding&rdquo;,
          &ldquo;hidden&rdquo; and &ldquo;output&rdquo; and raising <C>ValueError</C> otherwise, and <C>attn_scale(d_head, mup)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def width_mult(d, d_base):
    return d_base / d

def mup_layer(kind, base_std, base_lr, m):
    return base_std / math.sqrt(m), base_lr

def attn_scale(d_head, mup):
    return 1 / math.sqrt(d_head)
`,
        solution: RULES,
        tests: [
          { name: "layers", code: `assert width_mult(2048, 512) == 4 and mup_layer("hidden", 0.04, 0.008, 16.0) == (0.01, 0.0005) and mup_layer("output", 0.04, 0.008, 16.0) == (0.0025, 0.0005) and mup_layer("embedding", 0.04, 0.008, 16.0) == (0.04, 0.008)` },
          { name: "attn", code: `assert attn_scale(16, True) == 0.0625 and attn_scale(16, False) == 0.25\ntry:\n    mup_layer("norm", 1.0, 1.0, 2.0)\n    assert False\nexcept ValueError:\n    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>first_step_change(n, lr)</C> for inputs <M>{"x_j = \\cos j"}</M>, j = 0, …, n − 1, and a first Adam step{" "}
          <M>{"\\Delta W_j = -\\eta\\,\\mathrm{sign}(x_j)"}</M>, returning <M>{"|\\sum_j \\Delta W_j x_j|"}</M>; <C>coord_check(widths, lr_of_width)</C>; and{" "}
          <C>spread(values)</C>, the ratio of the largest to the smallest.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def first_step_change(n, lr):
    return lr

def coord_check(widths, lr_of_width):
    return [first_step_change(n, lr_of_width(n)) for n in widths]

def spread(values):
    return max(values) - min(values)
`,
        solution: CHECK,
        tests: [
          { name: "step", code: `assert abs(first_step_change(3, 2.0) - 2 * (1 + abs(math.cos(1)) + abs(math.cos(2)))) < 1e-12` },
          { name: "check", code: `v = coord_check([50, 200, 800], lambda n: 0.1)\nassert 14 < spread(v) < 18 and spread(coord_check([50, 200, 800], lambda n: 5.0 / n)) < 1.1` },
        ],
      },
    },
    {
      key: "sum",
      rung: "stretch",
      prompt: (
        <p>
          With inputs <M>{"x_j = \\cos j"}</M> for j = 0, …, 999 and a first Adam step of size 10⁻³, what is the change in the layer&apos;s
          output? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.637, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Width is handled. The next lesson turns to the two hyperparameters μP leaves alone and that every large run must still
        choose: batch size and the learning rate that goes with it.
      </p>
    </>
  ),
};
