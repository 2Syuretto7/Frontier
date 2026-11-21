import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VlmTilesViz } from "@/components/viz/VlmTilesViz";
import type { LessonContent } from "@/lib/types";

const TOKENS = `import math

def vit_tokens(res, patch):
    return (res // patch) ** 2

def anyres_tokens(H, W, tile, patch):
    tiles = math.ceil(H / tile) * math.ceil(W / tile)
    return (tiles + (1 if tiles > 1 else 0)) * vit_tokens(tile, patch)   # tiles plus a thumbnail when tiled

def pixel_shuffle(grid, r):
    h, w = len(grid), len(grid[0])
    return [[sum((grid[i * r + a][j * r + b] for a in range(r) for b in range(r)), []) for j in range(w // r)]
            for i in range(h // r)]                            # each r-by-r block of vectors becomes one longer vector`;

const TRAIN = `import math

def build_sequence(n_img, prompt, answer, img_token=-200):
    return [img_token] * n_img + prompt + answer

def loss_mask(n_img, n_prompt, n_answer):
    return [0] * (n_img + n_prompt) + [1] * n_answer          # train only on the answer

def masked_nll(logprobs, mask):
    return -sum(lp * m for lp, m in zip(logprobs, mask)) / sum(mask)`;

export const lesson: LessonContent = {
  id: "l12.5.2",
  minutes: 50,
  links: {
    requires: ["l12.5.1"],
    revisits: ["l4.6.1", "l12.4.1"],
    foreshadows: ["l12.5.3", "l12.5.4"],
  },

  puzzle: (
    <>
      <p>
        A contrastive encoder can tell whether a photograph matches the caption &quot;a receipt&quot;. It cannot read the
        total, explain a chart, or answer &quot;which of these mushrooms is poisonous?&quot;. A language model can reason and
        answer, but has never seen an image. Is there a cheap way to connect the two, without training either from scratch,
        and what limits how much of an image the language model can actually look at?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep a pretrained vision encoder and a pretrained language model, and learn a small projector that turns each
        patch feature of the image into a vector the language model treats as a word. First train only the projector, on
        image captions, so the visual words land in the language model&apos;s space; then fine-tune on conversations about
        images. Every image patch costs a token, so detail is bought with context length, and high-resolution images are
        cut into tiles and their tokens merged to keep the bill manageable.
      </p>
      <VlmTilesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a vision-language model">
        <p>
          A vision transformer encodes an image of side s with patches of side p into <M>{"(s/p)^2"}</M> feature vectors
          (<C>vit_tokens</C>). A projector, typically a two-layer MLP, maps each to the language model&apos;s embedding width.
          The resulting visual tokens are placed in the input sequence where the image appears, between ordinary text
          tokens, and the language model processes the whole sequence as usual. LLaVA-1.5 used CLIP ViT-L/14 at 336 pixels,
          576 visual tokens per image.
        </p>
      </Definition>

      <Definition title="tiling for high resolution">
        <p>
          The encoder sees a fixed size, so a large image is cut into a grid of tiles of that size, each encoded on its own,
          plus a thumbnail of the whole image resized to one tile for global context (<C>anyres_tokens</C>). The visual token
          count grows with the image&apos;s area, and the language model&apos;s attention cost with its square.
        </p>
      </Definition>

      <Theorem title="pixel shuffle loses nothing">
        <p>
          Rearranging an h × w grid of d-dimensional features into an (h/r) × (w/r) grid of <M>{"r^2 d"}</M>-dimensional
          features, by concatenating each r × r block (<C>pixel_shuffle</C>), is a bijection. It divides the token count by{" "}
          <M>{"r^2"}</M> without discarding information; the projector then decides what to keep.
        </p>
      </Theorem>
      <Proof>
        <p>
          The feature at position (i, j), coordinate k, is sent to block <M>{"(\\lfloor i/r \\rfloor, \\lfloor j/r \\rfloor)"}</M>{" "}
          at coordinate <M>{"((i \\bmod r) r + (j \\bmod r)) d + k"}</M>. Distinct inputs go to distinct outputs, and the two
          sides have the same number <M>{"h w d"}</M> of entries, so the map is a bijection when r divides h and w. With a
          448-pixel encoder and 14-pixel patches, a 2 × 2 shuffle turns 1024 tokens per tile into 256, as in InternVL.
        </p>
        <Code>{TOKENS}</Code>
      </Proof>

      <Definition title="two-stage training">
        <p>
          Stage one freezes the encoder and the language model and trains only the projector on image-caption pairs, so the
          visual tokens become interpretable to the language model at little cost. Stage two trains the projector and the
          language model, and sometimes the encoder, on visual instruction data: questions and answers about images,
          including conversations generated by a text-only model from captions and box annotations. Each example is a
          sequence of image tokens, prompt and answer (<C>build_sequence</C>), and the next-token loss is applied only to the
          answer (<C>loss_mask</C>, <C>masked_nll</C>).
        </p>
        <Code>{TRAIN}</Code>
      </Definition>

      <Theorem title="the masked loss still trains the image path">
        <p>
          Although no loss term is placed on visual or prompt tokens, the gradient reaches the projector whenever an answer
          token attends to a visual token.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each answer position&apos;s log-probability is a function of the hidden states at all earlier positions through
          attention, including those computed from the visual tokens, and these depend on the projector&apos;s weights. The
          chain rule therefore gives the projector a gradient unless every attention weight from answer positions to visual
          positions is zero. Masking only removes the objective of predicting the visual &quot;words&quot; themselves, which
          would be meaningless, and of predicting the prompt, which the model should not learn to imitate.
        </p>
      </Proof>

      <Example title="alternatives">
        <p>
          Flamingo kept the language model frozen and inserted new gated cross-attention layers that read a fixed set of 64
          visual tokens produced by a small resampler, so images never entered the sequence. The design costs less context
          and preserves the text model exactly, but the inserted layers must be trained at scale. The simpler approach of
          this lesson, visual tokens in the sequence, now dominates open models.
        </p>
      </Example>

      <Remark title="failure modes">
        <p>
          A language model has strong priors, and a VLM often answers from them rather than from the image: it reports a
          fork beside a plate that has none. Benchmarks such as POPE probe this object hallucination with yes-no questions
          about objects that are and are not present. More visual tokens, better grounding data and training that rewards
          saying &quot;not visible&quot; all help; none removes the tension between the image and the prior entirely.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tiles",
      rung: "check",
      prompt: (
        <p>
          A 1344 × 1008 image (width by height) is tiled at 336 pixels with a thumbnail, using 14-pixel patches. How many
          visual tokens result?
        </p>
      ),
      answer: { kind: "numeric", value: 7488, tolerance: 0 },
    },
    {
      key: "shuffle",
      rung: "check",
      prompt: <p>An encoder takes 448-pixel tiles with 14-pixel patches. How many tokens per tile remain after a 2 × 2 pixel shuffle?</p>,
      answer: { kind: "numeric", value: 256, tolerance: 0 },
    },
    {
      key: "mask",
      rung: "apply",
      prompt: <p>Why is the next-token loss applied only to the answer tokens?</p>,
      answer: {
        kind: "choice",
        options: [
          "Predicting visual tokens is meaningless and predicting the prompt would teach the model to imitate users; the answer is what we want",
          "It stops gradient reaching the projector",
          "The image tokens have no embeddings",
          "It makes the sequence shorter",
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

def vit_tokens(res, patch):
    return (res // patch) ** 2

def anyres_tokens(H, W, tile, patch):
    tiles = math.ceil(H / tile) * math.ceil(W / tile)
    return (tiles + (1 if tiles > 1 else 0)) * vit_tokens(tile, patch)   # tiles plus a thumbnail when tiled

def pixel_shuffle(grid, r):
    h, w = len(grid), len(grid[0])
    return [[sum((grid[i * r + a][j * r + b] for a in range(r) for b in range(r)), []) for j in range(w // r)]
            for i in range(h // r)]                            # each r-by-r block of vectors becomes one longer vector

g = [[[1], [2], [3], [4]], [[5], [6], [7], [8]]]; s = pixel_shuffle(g, 2)
print(vit_tokens(336, 14), anyres_tokens(672, 1000, 336, 14), s)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "576 4032 [[[1, 2, 5, 6], [3, 4, 7, 8]]]",
          "576 3456 [[[1, 2, 5, 6], [3, 4, 7, 8]]]",
          "576 4032 [[[1, 2, 3, 4], [5, 6, 7, 8]]]",
          "576 4032 [[[1, 5], [2, 6], [3, 7], [4, 8]]]",
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

def build_sequence(n_img, prompt, answer, img_token=-200):
    return [img_token] * n_img + prompt + answer

def loss_mask(n_img, n_prompt, n_answer):
    return [0] * (n_img + n_prompt) + [1] * n_answer          # train only on the answer

def masked_nll(logprobs, mask):
    return -sum(lp * m for lp, m in zip(logprobs, mask)) / sum(mask)

seq = build_sequence(2, [11, 12], [13]); m = loss_mask(2, 2, 1)
print(seq, m, masked_nll([-1.0, -2.0, -0.5, -0.25, -0.7], m), masked_nll([-1.0, -2.0], [1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-200, -200, 11, 12, 13] [0, 0, 0, 0, 1] 0.7 1.5",
          "[-200, -200, 11, 12, 13] [0, 0, 1, 1, 1] 0.7 1.5",
          "[-200, -200, 11, 12, 13] [0, 0, 0, 0, 1] 0.89 1.5",
          "[11, 12, 13] [0, 0, 1] 0.7 1.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vit_tokens(res, patch)</C>, <C>anyres_tokens(H, W, tile, patch)</C> with a thumbnail added only when there is
          more than one tile, and <C>pixel_shuffle(grid, r)</C> for a grid given as rows of lists of feature lists, concatenating
          each block row by row.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def vit_tokens(res, patch):
    return res // patch

def anyres_tokens(H, W, tile, patch):
    return vit_tokens(tile, patch)

def pixel_shuffle(grid, r):
    return grid
`,
        solution: TOKENS,
        tests: [
          { name: "count", code: `assert vit_tokens(224, 16) == 196 and anyres_tokens(300, 300, 336, 14) == 576 and anyres_tokens(400, 700, 336, 14) == 7 * 576` },
          { name: "shuffle", code: `g = [[[1, 0], [2, 0]], [[3, 0], [4, 0]]]\nassert pixel_shuffle(g, 2) == [[[1, 0, 2, 0, 3, 0, 4, 0]]] and pixel_shuffle(g, 1) == g` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>build_sequence(n_img, prompt, answer, img_token=-200)</C>, <C>loss_mask(n_img, n_prompt, n_answer)</C>, and{" "}
          <C>masked_nll(logprobs, mask)</C>, the mean negative log-probability over masked-in positions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def build_sequence(n_img, prompt, answer, img_token=-200):
    return prompt + answer

def loss_mask(n_img, n_prompt, n_answer):
    return [1] * (n_img + n_prompt + n_answer)

def masked_nll(logprobs, mask):
    return -sum(logprobs) / len(logprobs)
`,
        solution: TRAIN,
        tests: [
          { name: "seq", code: `assert build_sequence(3, [5], [6, 7], 0) == [0, 0, 0, 5, 6, 7] and loss_mask(1, 2, 2) == [0, 0, 0, 1, 1]` },
          { name: "nll", code: `assert abs(masked_nll([-3.0, -1.0, -2.0, -5.0], [0, 1, 0, 1]) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          A model has a 4096-token context. The prompt takes 100 tokens and the answer may need 300. How many 576-token image
          tiles, counting the thumbnail as one, fit in the rest?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Here images enter a language model as continuous vectors, so the model can read images but not write them. To
        generate images with the same next-token machinery, images must become discrete tokens from a vocabulary, the job of
        image tokenisers.
      </p>
    </>
  ),
};
