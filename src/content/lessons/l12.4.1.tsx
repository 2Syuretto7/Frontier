import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DitCostViz } from "@/components/viz/DitCostViz";
import type { LessonContent } from "@/lib/types";

const ADALN = `import math

def layer_norm(v, eps=1e-6):
    m = sum(v) / len(v)
    var = sum((a - m) ** 2 for a in v) / len(v)
    return [(a - m) / math.sqrt(var + eps) for a in v]         # no learned scale or shift

def adaln(v, scale, shift):
    return [a * (1 + s) + b for a, s, b in zip(layer_norm(v), scale, shift)]

def adaln_zero_block(v, f, scale, shift, gate):
    out = f(adaln(v, scale, shift))
    return [a + g * o for a, g, o in zip(v, gate, out)]        # a zero gate makes the block the identity`;

const COST = `import math

def timestep_embedding(t, dim, max_period=10000.0):
    half = dim // 2
    freqs = [math.exp(-math.log(max_period) * i / half) for i in range(half)]
    return [math.cos(t * f) for f in freqs] + [math.sin(t * f) for f in freqs]

def dit_tokens(res, f, p):
    return (res // f // p) ** 2

def dit_macs(n, d, layers):
    return layers * (12 * n * d * d + 2 * n * n * d)           # linear maps plus attention, per forward pass`;

export const lesson: LessonContent = {
  id: "l12.4.1",
  minutes: 50,
  links: {
    requires: ["l12.3.3", "l4.6.1"],
    revisits: ["l12.1.4", "l12.3.2"],
    foreshadows: ["l12.4.2", "l12.4.3"],
  },

  puzzle: (
    <>
      <p>
        The first image diffusion models used U-Nets, convolutional networks with skip connections built for segmentation.
        Language models had shown that a plain transformer, scaled up, improves predictably with compute. Can a transformer
        replace the U-Net when the input is a noisy latent and the network must also be told the noise level and the class
        or prompt? Where should that conditioning enter, and what does it cost as images grow?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cut the latent into patches and treat them as tokens, exactly as a vision transformer does. The noise level and
        class are not tokens to attend to but global facts that should change how every token is processed, so they set the
        scale and shift of every normalisation layer, and a gate on every residual branch. Starting all gates at zero makes
        the untrained network the identity, which trains stably at depth. The cost then follows from counting: linear maps
        grow with the number of tokens, attention with its square.
      </p>
      <DitCostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="diffusion transformer">
        <p>
          A latent of side s and c channels is cut into p × p patches, each linearly embedded, giving{" "}
          <M>{"n = (s/p)^2"}</M> tokens with fixed positional embeddings (<C>dit_tokens</C>). Transformer blocks process them,
          and a final linear layer maps each token back to a p × p × c patch of the predicted noise, or velocity. Peebles and
          Xie named the variants by size and patch: DiT-XL/2 has width 1152, 28 blocks and p = 2.
        </p>
      </Definition>

      <Definition title="adaptive layer norm with zero initialisation">
        <p>
          The noise level enters through a sinusoidal embedding (<C>timestep_embedding</C>) passed through an MLP, the class
          through a learned embedding, and their sum c conditions every block. A small network maps c to scales, shifts and
          gates for the block&apos;s two branches. Each branch computes{" "}
          <M>{"h \\mapsto h + \\alpha \\odot f\\big(\\mathrm{LN}(h) \\odot (1 + \\gamma) + \\beta\\big)"}</M>, with LN a layer norm
          without learned parameters (<C>layer_norm</C>, <C>adaln</C>, <C>adaln_zero_block</C>). The map from c to{" "}
          <M>{"(\\gamma, \\beta, \\alpha)"}</M> is initialised to output zero.
        </p>
        <Code>{ADALN}</Code>
      </Definition>

      <Theorem title="zero gates start at the identity but still learn">
        <p>
          At initialisation every block is the identity map, so the network computes the final layer applied to the patch
          embeddings. The gradient of the loss with respect to a gate α is{" "}
          <M>{"f(\\mathrm{LN}(h)) \\odot \\partial \\ell / \\partial h_{\\mathrm{out}}"}</M>, which is generally non-zero, so the
          gates move away from zero from the first step.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"\\gamma = \\beta = \\alpha = 0"}</M> each branch returns <M>{"h + 0"}</M>, and a composition of identities is the
          identity. The output of a branch is linear in α with coefficient <M>{"f(\\mathrm{LN}(h)(1 + \\gamma) + \\beta)"}</M>,
          which equals <M>{"f(\\mathrm{LN}(h))"}</M> at initialisation; the chain rule gives the stated gradient. Because the
          conditioning network itself is zero only in its last layer, its earlier layers receive gradient once the gates do.
          Peebles and Xie found this variant clearly better than cross-attention or in-context conditioning tokens.
        </p>
      </Proof>

      <Theorem title="the cost of a forward pass">
        <p>
          A block of width d on n tokens with a 4d-wide MLP costs <M>{"12 n d^2"}</M> multiply-adds in linear maps and{" "}
          <M>{"2 n^2 d"}</M> in attention (<C>dit_macs</C>). Attention dominates once <M>{"n > 6d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The query, key, value and output projections are four d × d maps per token, <M>{"4nd^2"}</M>; the MLP maps d to 4d
          and back, <M>{"8nd^2"}</M>. The scores <M>{"QK^\\top"}</M> cost <M>{"n^2 d"}</M> and mixing the values another{" "}
          <M>{"n^2 d"}</M>. Comparing <M>{"2n^2 d"}</M> with <M>{"12nd^2"}</M> gives the threshold. The adaptive norms and
          embeddings add a few per cent, which is why the formula gives 118.4 G for DiT-XL/2 at 256 pixels against the
          reported 118.6 Gflops.
        </p>
        <Code>{COST}</Code>
      </Proof>

      <Example title="compute, not architecture details, predicts quality">
        <p>
          Across twelve DiT configurations on ImageNet at 256 pixels, FID tracked forward-pass compute closely,
          whether that compute came from more width, more depth or smaller patches. DiT-XL/2 with classifier-free guidance reached an FID of 2.27, ahead of the best U-Net
          diffusion models of the time.
        </p>
      </Example>

      <Definition title="joint attention for text">
        <p>
          For text-to-image models, Stable Diffusion 3&apos;s MM-DiT concatenates text tokens and image tokens into one sequence
          for attention, but gives each modality its own projection and MLP weights, since the two kinds of token have very
          different statistics. Pooled text features and the noise level still enter through adaptive norms. Information flows
          both ways: image tokens read the prompt and text tokens are refined by the image.
        </p>
      </Definition>

      <Remark title="why the transformer won">
        <p>
          The U-Net&apos;s convolutions and down- and up-sampling encode useful priors at small scale, but they complicate
          scaling, and every new resolution or aspect ratio needs care. A transformer on patch tokens is uniform: the same
          block, the same parallelism and the same scaling recipes as language models, and it handles any token count, which
          the next lesson exploits for video.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tok",
      rung: "check",
      prompt: <p>How many tokens does a 1024 × 1024 image give with f = 8 and patch size 2?</p>,
      answer: { kind: "numeric", value: 4096, tolerance: 0 },
    },
    {
      key: "cross",
      rung: "check",
      prompt: <p>For width d = 1152, above how many tokens does attention cost more than the linear maps?</p>,
      answer: { kind: "numeric", value: 6912, tolerance: 0 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Why initialise the gates of adaLN-Zero at zero?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each block then starts as the identity, which keeps a deep network stable early in training while the gates still receive gradient",
          "Zero gates make the network ignore the noise level permanently",
          "It halves the compute of every block",
          "Zero gates prevent the conditioning from affecting the output at any point in training",
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

def layer_norm(v, eps=1e-6):
    m = sum(v) / len(v)
    var = sum((a - m) ** 2 for a in v) / len(v)
    return [(a - m) / math.sqrt(var + eps) for a in v]         # no learned scale or shift

def adaln(v, scale, shift):
    return [a * (1 + s) + b for a, s, b in zip(layer_norm(v), scale, shift)]

def adaln_zero_block(v, f, scale, shift, gate):
    out = f(adaln(v, scale, shift))
    return [a + g * o for a, g, o in zip(v, gate, out)]        # a zero gate makes the block the identity

v = [1.0, 2.0, 3.0, 4.0]; ln = layer_norm(v, 0.0)
print([round(a, 4) for a in ln], [round(a, 4) for a in adaln(v, [1.0] * 4, [0.5] * 4)], adaln_zero_block(v, lambda u: [9.0] * 4, [0.0] * 4, [0.0] * 4, [0.0] * 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-1.3416, -0.4472, 0.4472, 1.3416] [-2.1833, -0.3944, 1.3944, 3.1833] [1.0, 2.0, 3.0, 4.0]",
          "[-1.3416, -0.4472, 0.4472, 1.3416] [-0.8416, 0.0528, 0.9472, 1.8416] [1.0, 2.0, 3.0, 4.0]",
          "[-1.3416, -0.4472, 0.4472, 1.3416] [-2.1833, -0.3944, 1.3944, 3.1833] [10.0, 11.0, 12.0, 13.0]",
          "[-1.5, -0.5, 0.5, 1.5] [-2.1833, -0.3944, 1.3944, 3.1833] [1.0, 2.0, 3.0, 4.0]",
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

def timestep_embedding(t, dim, max_period=10000.0):
    half = dim // 2
    freqs = [math.exp(-math.log(max_period) * i / half) for i in range(half)]
    return [math.cos(t * f) for f in freqs] + [math.sin(t * f) for f in freqs]

def dit_tokens(res, f, p):
    return (res // f // p) ** 2

def dit_macs(n, d, layers):
    return layers * (12 * n * d * d + 2 * n * n * d)           # linear maps plus attention, per forward pass

e = timestep_embedding(0.0, 4); g = timestep_embedding(1.0, 4, 100.0)
print(e, [round(a, 4) for a in g], dit_tokens(512, 8, 2), dit_macs(4, 2, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, 0.0, 0.0] [0.5403, 0.995, 0.8415, 0.0998] 1024 256",
          "[0.0, 0.0, 1.0, 1.0] [0.5403, 0.995, 0.8415, 0.0998] 1024 256",
          "[1.0, 1.0, 0.0, 0.0] [0.5403, 0.5403, 0.8415, 0.8415] 1024 256",
          "[1.0, 1.0, 0.0, 0.0] [0.5403, 0.995, 0.8415, 0.0998] 1024 128",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For lists of floats, write <C>layer_norm(v, eps=1e-6)</C> with the population variance and no learned parameters,{" "}
          <C>adaln(v, scale, shift)</C>, and <C>adaln_zero_block(v, f, scale, shift, gate)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def layer_norm(v, eps=1e-6):
    return v

def adaln(v, scale, shift):
    return [a * s + b for a, s, b in zip(layer_norm(v), scale, shift)]

def adaln_zero_block(v, f, scale, shift, gate):
    return f(adaln(v, scale, shift))
`,
        solution: ADALN,
        tests: [
          { name: "ln", code: `x = layer_norm([2.0, 4.0], 0.0)\nassert abs(x[0] + 1) < 1e-12 and abs(x[1] - 1) < 1e-12\ny = adaln([2.0, 4.0], [0.5, 0.0], [1.0, -1.0])\nassert abs(y[0] + 0.5) < 1e-5 and abs(y[1]) < 1e-5` },
          { name: "block", code: `z = adaln_zero_block([2.0, 4.0], lambda u: [3 * a for a in u], [0.0, 0.0], [0.0, 0.0], [0.5, 0.0])\nassert abs(z[0] - 0.5) < 1e-5 and abs(z[1] - 4.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>timestep_embedding(t, dim, max_period=10000.0)</C>, cosines then sines of t times frequencies{" "}
          <M>{"P^{-i/h}"}</M> for i = 0, …, h − 1 with h = dim/2 and P the maximum period; <C>dit_tokens(res, f, p)</C>; and{" "}
          <C>dit_macs(n, d, layers)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def timestep_embedding(t, dim, max_period=10000.0):
    return [t] * dim

def dit_tokens(res, f, p):
    return res // f

def dit_macs(n, d, layers):
    return layers * n * d * d
`,
        solution: COST,
        tests: [
          { name: "emb", code: `import math\ne = timestep_embedding(2.0, 4, 16.0)\nassert len(e) == 4 and abs(e[0] - math.cos(2.0)) < 1e-12 and abs(e[1] - math.cos(0.5)) < 1e-12 and abs(e[3] - math.sin(0.5)) < 1e-12` },
          { name: "cost", code: `assert dit_tokens(256, 8, 4) == 64 and dit_macs(10, 3, 2) == 2 * (12 * 10 * 9 + 2 * 100 * 3)` },
        ],
      },
    },
    {
      key: "big",
      rung: "stretch",
      prompt: (
        <p>
          A transformer of width 1536 with 24 blocks generates 1024 × 1024 images from latents with f = 8 and p = 2. How many
          multiply-adds, in units of <M>{"10^{12}"}</M>, does one forward pass need by the formula of this lesson?
        </p>
      ),
      answer: { kind: "numeric", value: 4.0201, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        A video is a stack of frames, and its latent a stack of latent grids. Cutting it into space-time patches turns video
        generation into the same transformer problem with many more tokens, which is where the cost formula of this lesson
        starts to bite.
      </p>
    </>
  ),
};
