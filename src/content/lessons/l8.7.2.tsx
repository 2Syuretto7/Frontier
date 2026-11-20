import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RopeScalingViz } from "@/components/viz/RopeScalingViz";
import type { LessonContent } from "@/lib/types";

const SCALING = `import math

def inv_freqs(d, base=10000.0):
    return [base ** (-2 * i / d) for i in range(d // 2)]

def ntk_base(base, s, d):
    return base * s ** (d / (d - 2))

def yarn_freqs(freqs, s, train_len, alpha=1.0, beta=32.0):
    out = []
    for f in freqs:
        r = train_len * f / (2 * math.pi)
        g = min(1.0, max(0.0, (r - alpha) / (beta - alpha)))
        out.append((1 - g) * f / s + g * f)
    return out`;

const COSTS = `import math

def yarn_temperature(s):
    return 0.1 * math.log(s) + 1 if s > 1 else 1.0

def forward_flops_per_token(n_params, layers, n_ctx, d_model):
    return 2 * n_params + 2 * layers * n_ctx * d_model

def stage_lengths(start, end, n_stages):
    ratio = (end / start) ** (1 / n_stages)
    return [round(start * ratio ** k) for k in range(1, n_stages + 1)]`;

export const lesson: LessonContent = {
  id: "l8.7.2",
  minutes: 50,
  links: {
    requires: ["l5.2.3", "l8.2.1", "l8.7.1"],
    revisits: ["l8.2.2"],
    foreshadows: ["l8.7.3", "e10.4.3", "l8.8.4"],
  },

  puzzle: (
    <>
      <p>
        Attention cost per token grows with the context, so pretraining mostly uses sequences of four to eight thousand tokens.
        Yet the released models read 128 thousand. Llama 3 reached that length with continued training on a few hundred billion
        tokens, a small fraction of its fifteen trillion, and some open methods need under a billion. How can a model trained
        on short sequences be taught long ones so cheaply?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        With rotary embeddings (l5.2.3), each pair of dimensions rotates at its own frequency. The fast pairs complete many
        turns within the training length and have seen every angle; the slow pairs have turned through only part of a circle.
        Beyond the training length the slow pairs produce angles never seen, and the model fails. The fix is to change the
        frequencies so that the angles at the new length fall inside the seen range, while disturbing the fast pairs, which
        carry fine positional detail, as little as possible. A short period of training on long documents then adapts the rest.
      </p>
      <RopeScalingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="three ways to rescale frequencies">
        <p>
          Pair i of a d-dimensional head has frequency <M>{"\\theta_i = b^{-2i/d}"}</M> (<C>inv_freqs</C>). To extend the context by a factor s:
        </p>
        <ul>
          <li>position interpolation (Chen and colleagues) divides every frequency by s;</li>
          <li>
            NTK-aware scaling raises the base to <M>{"b' = b\\,s^{d/(d-2)}"}</M> (<C>ntk_base</C>), leaving the fastest pair unchanged and slowing
            the slowest by s;
          </li>
          <li>
            YaRN (Peng and colleagues) counts the turns <M>{"r_i = L\\theta_i/2\\pi"}</M> each pair makes over the training length L and
            blends: <M>{"\\gamma_i = \\mathrm{clip}((r_i - \\alpha)/(\\beta - \\alpha), 0, 1)"}</M> and{" "}
            <M>{"\\theta_i' = (1 - \\gamma_i)\\theta_i/s + \\gamma_i\\theta_i"}</M> (<C>yarn_freqs</C>), with <M>{"\\alpha = 1"}</M> and <M>{"\\beta = 32"}</M> for Llama
            models. Pairs with more than 32 turns are untouched; those with less than one are fully interpolated.
          </li>
        </ul>
        <Code>{SCALING}</Code>
      </Definition>

      <Theorem title="what raising the base does">
        <p>
          With <M>{"b' = b\\,s^{d/(d-2)}"}</M>, the frequency of pair 0 is unchanged and the frequency of the slowest pair, i = d/2 − 1, is
          divided by exactly s.
        </p>
      </Theorem>
      <Proof>
        <p>
          For i = 0 the frequency is <M>{"b'^0 = 1"}</M>. For i = d/2 − 1 the exponent is <M>{"-(d-2)/d"}</M>, and
        </p>
        <MD>{"b'^{-(d-2)/d} = b^{-(d-2)/d}\\,\\left(s^{d/(d-2)}\\right)^{-(d-2)/d} = b^{-(d-2)/d}/s."}</MD>
        <p>
          Between the two, the factor <M>{"s^{-2i/(d-2)}"}</M> grows smoothly with i, so slow pairs are interpolated and fast ones nearly
          extrapolated.
        </p>
      </Proof>

      <Definition title="temperature and cost">
        <p>
          Spreading attention over more keys flattens its distribution. YaRN compensates by scaling the logits by{" "}
          <M>{"1/t"}</M> with <M>{"\\sqrt{1/t} = 0.1\\ln s + 1"}</M> (<C>yarn_temperature</C>). The price of length is in compute: following Kaplan
          and colleagues, a forward pass costs about <M>{"2N + 2\\,n_{\\text{layer}}\\,n_{\\text{ctx}}\\,d"}</M> FLOPs per token
          (<C>forward_flops_per_token</C>), so at long contexts attention dominates. Training therefore extends in stages, each
          a constant factor longer than the last (<C>stage_lengths</C>), and splits each sequence across devices with context
          parallelism (e10.4.3).
        </p>
        <Code>{COSTS}</Code>
      </Definition>

      <Remark title="what the recipes do">
        <p>
          Llama 2 Long raised the RoPE base to 500,000 before continued training on longer sequences, an approach called adjusted
          base frequency; Llama 3 used that base from the start of pretraining, then grew the context from 8 thousand to 128
          thousand tokens in six stages over about 800 billion tokens, moving on only when short-context scores had recovered and
          a retrieval test passed. YaRN extended Llama 2 to 128 thousand with about 0.1% of its pretraining tokens. Fu and
          colleagues found that 1 to 5 billion tokens suffice if long documents are upsampled within each source, keeping the mix
          of domains unchanged; upsampling only long sources such as books skews the model towards them.
        </p>
      </Remark>

      <Example title="why scaling alone is not enough">
        <p>
          Rescaled frequencies keep every angle in the seen range, but the model has never had to use information 100 thousand
          tokens back. Without training on long documents, perplexity at long range may be fine while retrieval of a specific fact
          from far back fails. That gap between a good average loss and a failed long-range task is why evaluation of long
          context, the next lesson, needs tests of its own.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ntk",
      rung: "check",
      prompt: <p>A model with RoPE base 10,000 and head dimension 128 is extended by s = 4 with NTK-aware scaling. What is the new base, in thousands? Give one decimal.</p>,
      answer: { kind: "numeric", value: 40.9, tolerance: 0.05 },
    },
    {
      key: "yarn",
      rung: "check",
      prompt: (
        <p>
          A model trained on 4,096 tokens is extended by s = 8 with YaRN (α = 1, β = 32). What is the new wavelength, in positions, of a
          pair whose original wavelength is 512? Give the nearest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 1587, tolerance: 1 },
    },
    {
      key: "fast",
      rung: "apply",
      prompt: <p>Why do NTK-aware scaling and YaRN avoid changing the fastest rotary pairs, unlike position interpolation?</p>,
      answer: {
        kind: "choice",
        options: [
          "Fast pairs already complete many turns within the training length, so they see no new angles at longer positions, and slowing them would blur the fine distinctions between nearby tokens",
          "Fast pairs carry no positional information",
          "Changing fast pairs would make the model run slower",
          "Fast pairs are only used in the first layer",
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

def inv_freqs(d, base=10000.0):
    return [base ** (-2 * i / d) for i in range(d // 2)]

def ntk_base(base, s, d):
    return base * s ** (d / (d - 2))

def yarn_freqs(freqs, s, train_len, alpha=1.0, beta=32.0):
    out = []
    for f in freqs:
        r = train_len * f / (2 * math.pi)
        g = min(1.0, max(0.0, (r - alpha) / (beta - alpha)))
        out.append((1 - g) * f / s + g * f)
    return out

print(inv_freqs(4, 100.0), ntk_base(10.0, 4, 4))
print([round(f, 3) for f in yarn_freqs([2 * math.pi, 2 * math.pi / 100], 2, 100)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.1] 160.0\n[6.283, 0.031]",
          "[1.0, 0.01] 160.0\n[6.283, 0.031]",
          "[1.0, 0.1] 40.0\n[3.142, 0.031]",
          "[1.0, 0.1] 160.0\n[3.142, 0.063]",
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

def yarn_temperature(s):
    return 0.1 * math.log(s) + 1 if s > 1 else 1.0

def forward_flops_per_token(n_params, layers, n_ctx, d_model):
    return 2 * n_params + 2 * layers * n_ctx * d_model

def stage_lengths(start, end, n_stages):
    ratio = (end / start) ** (1 / n_stages)
    return [round(start * ratio ** k) for k in range(1, n_stages + 1)]

print(round(yarn_temperature(math.e), 2), yarn_temperature(0.5), forward_flops_per_token(10, 2, 3, 4))
print(stage_lengths(8, 128, 4), stage_lengths(1000, 1000, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.1 1.0 68\n[16, 32, 64, 128] [1000, 1000]",
          "1.1 0.93 68\n[16, 32, 64, 128] [1000, 1000]",
          "1.1 1.0 44\n[16, 32, 64, 128] [1000, 1000]",
          "1.1 1.0 68\n[8, 16, 32, 64] [1000, 1000]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>inv_freqs(d, base=10000.0)</C>, <C>ntk_base(base, s, d)</C> and <C>yarn_freqs(freqs, s, train_len, alpha=1.0, beta=32.0)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def inv_freqs(d, base=10000.0):
    return [base ** (-i / d) for i in range(d // 2)]

def ntk_base(base, s, d):
    return base * s

def yarn_freqs(freqs, s, train_len, alpha=1.0, beta=32.0):
    return [f / s for f in freqs]
`,
        solution: SCALING,
        tests: [
          { name: "base", code: `f = inv_freqs(8, 16.0)\nassert len(f) == 4 and abs(f[1] - 0.5) < 1e-12 and abs(f[3] - 0.125) < 1e-12 and abs(ntk_base(100.0, 2, 6) - 100 * 2 ** 1.5) < 1e-9` },
          { name: "yarn", code: `fs = [2 * math.pi * r / 64 for r in [64, 16.5, 0.5]]\nout = yarn_freqs(fs, 4, 64)\nassert abs(out[0] - fs[0]) < 1e-12 and abs(out[1] - fs[1] * (0.5 / 4 + 0.5)) < 1e-12 and abs(out[2] - fs[2] / 4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>yarn_temperature(s)</C>, returning 1 when s is at most 1, <C>forward_flops_per_token(n_params, layers, n_ctx, d_model)</C> and{" "}
          <C>stage_lengths(start, end, n_stages)</C>, the lengths after each stage of a geometric schedule, rounded to integers.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def yarn_temperature(s):
    return 1.0

def forward_flops_per_token(n_params, layers, n_ctx, d_model):
    return 2 * n_params

def stage_lengths(start, end, n_stages):
    return [end] * n_stages
`,
        solution: COSTS,
        tests: [
          { name: "temp", code: `assert abs(yarn_temperature(math.e ** 3) - 1.3) < 1e-12 and yarn_temperature(1) == 1.0 and forward_flops_per_token(100, 3, 10, 5) == 500` },
          { name: "stages", code: `assert stage_lengths(1000, 27000, 3) == [3000, 9000, 27000] and stage_lengths(10, 40, 2) == [20, 40]` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          A model has 8 billion parameters, 32 layers and width 4,096. Using the per-token forward cost above, at what context
          length does the attention term equal the parameter term? Give the nearest whole number of tokens.
        </p>
      ),
      answer: { kind: "numeric", value: 61035, tolerance: 1 },
    },
  ],

  glimpse: (
    <>
      <p>
        A model that accepts 128 thousand tokens may still not use them. The next lesson asks how to test that it does, from
        finding a planted fact to reasoning over a whole book.
      </p>
    </>
  ),
};
