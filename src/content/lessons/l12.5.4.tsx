import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MultimodalMaskViz } from "@/components/viz/MultimodalMaskViz";
import type { LessonContent } from "@/lib/types";

const MASK = `def segment_labels(segments):
    out = []
    for s, (kind, n) in enumerate(segments):
        out += [s if kind == "img" else -1] * n             # text positions get -1
    return out

def transfusion_mask(segments):
    lab = segment_labels(segments)
    N = len(lab)
    return [[1 if j <= i or (lab[i] >= 0 and lab[i] == lab[j]) else 0 for j in range(N)]
            for i in range(N)]                               # causal, plus full attention inside each image

def n_pairs(M):
    return sum(map(sum, M))`;

const UNIFIED = `def to_unified(codes, text_V, boi, eoi):
    return [boi] + [text_V + c for c in codes] + [eoi]      # image codes live above the text vocabulary

def from_unified(ids, text_V):
    return [i for i in ids if i < text_V], [i - text_V for i in ids if i >= text_V]

def transfusion_loss(text_nlls, img_mses, lam):
    return sum(text_nlls) / len(text_nlls) + lam * sum(img_mses) / len(img_mses)`;

export const lesson: LessonContent = {
  id: "l12.5.4",
  minutes: 50,
  links: {
    requires: ["l12.5.3", "l12.5.2"],
    revisits: ["l12.1.1", "l12.4.1"],
    foreshadows: ["l12.7.1"],
  },

  puzzle: (
    <>
      <p>
        A vision-language model reads images but answers only in text; a diffusion model draws images but cannot hold a
        conversation. Could one transformer, trained once on documents that interleave text and pictures, read and write
        both, so that it can explain a diagram and then draw a corrected one in the same reply? If so, should it write the
        image one token at a time like text, or denoise it as a whole like a diffusion model?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Put text and images into one sequence and train one network on all of it. The simplest version turns images into
        discrete tokens and treats them as extra words, predicted left to right. A second version keeps images as continuous
        patches and trains the same network to denoise them, while it predicts the text as usual. The two differ in their
        attention mask: patches of an image being denoised together may look at each other in both directions, while text
        still sees only the past.
      </p>
      <MultimodalMaskViz />
    </>
  ),

  theory: (
    <>
      <Definition title="early fusion with discrete tokens">
        <p>
          Chameleon tokenises each image into 1024 codes from a codebook of 8192 with a VQ tokeniser, places the codes after
          the text vocabulary (<C>to_unified</C>), and marks each image with begin and end tokens. A single transformer is
          trained with the next-token loss on interleaved documents, so it can produce any mix of text and images: when it
          emits the begin-image token, the next 1024 sampled tokens are decoded as an image (<C>from_unified</C>). There is
          no separate image encoder or decoder network inside the model; images and text share every layer.
        </p>
      </Definition>

      <Remark title="stability">
        <p>
          Training such a model at scale proved unstable: the two modalities compete inside a shared softmax, and the norms
          of queries and keys grew until the attention logits diverged late in training. Chameleon added normalisation of
          queries and keys before their dot product, and a z-loss that penalises the log of the softmax normaliser, to keep
          the logits bounded.
        </p>
      </Remark>

      <Definition title="Transfusion">
        <p>
          Transfusion keeps images continuous. An image is encoded by a VAE into latent patches, noised to a random level,
          and placed in the sequence between begin and end markers. The same transformer predicts the next token at text
          positions and the noise at image positions, with total loss{" "}
          <MD>{"\\mathcal{L} = \\mathcal{L}_{\\text{LM}} + \\lambda\\, \\mathcal{L}_{\\text{diffusion}}"}</MD>
          (<C>transfusion_loss</C>; the paper used <M>{"\\lambda = 5"}</M>). The attention mask is causal, except that the
          patches of one image attend to each other in both directions (<C>transfusion_mask</C>). At generation time, text
          is sampled token by token; when the model emits the begin-image marker, it runs a full diffusion sampler on a block
          of noise patches, conditioned on everything before, and then continues with text.
        </p>
        <Code>{MASK}</Code>
      </Definition>

      <Theorem title="size of the mixed mask">
        <p>
          For a sequence of N positions containing images of <M>{"n_1, \\dots, n_m"}</M> patches, the Transfusion mask allows{" "}
          <MD>{"\\frac{N(N+1)}{2} + \\sum_{k=1}^m \\frac{n_k (n_k - 1)}{2}"}</MD>
          query-key pairs (<C>n_pairs</C>), and every text position attends to exactly the same keys as under the causal mask.
        </p>
      </Theorem>
      <Proof>
        <p>
          The causal part allows the pairs with <M>{"j \\le i"}</M>, of which there are <M>{"N(N+1)/2"}</M>. The extra pairs
          are those with <M>{"j > i"}</M> and both positions in the same image; an image of <M>{"n_k"}</M> contiguous
          patches contributes one such pair for each of its <M>{"n_k(n_k-1)/2"}</M> unordered pairs of distinct patches, and
          different images contribute disjoint pairs. A text position has label -1, so the extra condition never holds in its
          row, and it sees only the past. Hence text is still trained as a proper left-to-right model: no text prediction can
          peek at a later token, while an image can be denoised jointly because its patches carry no order to respect.
        </p>
      </Proof>

      <Example title="discrete and continuous, compared">
        <p>
          Discrete tokens make the model uniform, with one loss and one sampler, but quantisation caps image quality at what
          the tokeniser preserves, and 1024 tokens per image make sampling slow. Continuous patches avoid quantisation and
          let an image be generated in tens of denoising steps over all patches at once. The Transfusion paper reported that
          at equal compute it generated images better than a Chameleon-style model while matching it on text.
        </p>
        <Code>{UNIFIED}</Code>
      </Example>

      <Remark title="other designs">
        <p>
          Understanding and generation want different image features: semantic features for reading, detailed ones for
          drawing. Janus therefore decouples them, encoding images for understanding with a contrastively trained encoder and
          for generation with a VQ tokeniser, both feeding one transformer. Other systems keep a language model and attach
          a separate diffusion decoder conditioned on its hidden states. Which design wins at the largest scales is an open
          question; the shared principle is one sequence, one transformer, several losses.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "len",
      rung: "check",
      prompt: (
        <p>
          A document has 20 text tokens, then a 512 × 512 image tokenised with downsampling factor 16 and wrapped in begin
          and end markers, then 30 text tokens. How long is the sequence?
        </p>
      ),
      answer: { kind: "numeric", value: 1076, tolerance: 0 },
    },
    {
      key: "pairs",
      rung: "check",
      prompt: (
        <p>
          A sequence has 2 text tokens, an image of 3 patches, and 1 text token. How many query-key pairs does the
          Transfusion mask allow?
        </p>
      ),
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can the patches of one image attend to each other in both directions, while text cannot?</p>,
      answer: {
        kind: "choice",
        options: [
          "The image is denoised as a whole, so no patch predicts another, while each text token must not see the token it predicts",
          "Images have fewer positions than text",
          "Bidirectional attention is cheaper than causal attention",
          "The VAE requires it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def segment_labels(segments):
    out = []
    for s, (kind, n) in enumerate(segments):
        out += [s if kind == "img" else -1] * n             # text positions get -1
    return out

def transfusion_mask(segments):
    lab = segment_labels(segments)
    N = len(lab)
    return [[1 if j <= i or (lab[i] >= 0 and lab[i] == lab[j]) else 0 for j in range(N)]
            for i in range(N)]                               # causal, plus full attention inside each image

def n_pairs(M):
    return sum(map(sum, M))

M = transfusion_mask([("txt", 1), ("img", 2), ("txt", 1)])
print(segment_labels([("img", 2), ("txt", 1), ("img", 1)]), M[1], n_pairs(M))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 0, -1, 2] [1, 1, 1, 0] 11",
          "[0, 0, -1, 2] [1, 1, 0, 0] 10",
          "[0, 0, -1, 1] [1, 1, 1, 0] 11",
          "[0, 0, -1, 2] [1, 1, 1, 1] 12",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def to_unified(codes, text_V, boi, eoi):
    return [boi] + [text_V + c for c in codes] + [eoi]      # image codes live above the text vocabulary

def from_unified(ids, text_V):
    return [i for i in ids if i < text_V], [i - text_V for i in ids if i >= text_V]

def transfusion_loss(text_nlls, img_mses, lam):
    return sum(text_nlls) / len(text_nlls) + lam * sum(img_mses) / len(img_mses)

ids = [5] + to_unified([0, 3], 100, 1, 2) + [7]; print(ids, from_unified(ids, 100))
print(round(transfusion_loss([2.0, 1.0], [0.1, 0.3], 5.0), 4), transfusion_loss([3.0], [0.4], 0.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5, 1, 100, 103, 2, 7] ([5, 1, 2, 7], [0, 3])\n2.5 3.0",
          "[5, 1, 0, 3, 2, 7] ([5, 1, 0, 3, 2, 7], [])\n2.5 3.0",
          "[5, 1, 100, 103, 2, 7] ([5, 7], [1, 0, 3, 2])\n2.5 3.0",
          "[5, 1, 100, 103, 2, 7] ([5, 1, 2, 7], [0, 3])\n3.5 3.4",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Segments are pairs (kind, length) with kind &quot;txt&quot; or &quot;img&quot;. Write <C>segment_labels(segments)</C>,
          giving each position its segment index if it is an image and -1 otherwise, <C>transfusion_mask(segments)</C> as a 0/1
          matrix, and <C>n_pairs(M)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def segment_labels(segments):
    return []

def transfusion_mask(segments):
    N = sum(n for _, n in segments)
    return [[1 if j <= i else 0 for j in range(N)] for i in range(N)]

def n_pairs(M):
    return len(M)
`,
        solution: MASK,
        tests: [
          { name: "mask", code: `assert transfusion_mask([("img", 2)]) == [[1, 1], [1, 1]] and segment_labels([("txt", 2), ("img", 1)]) == [-1, -1, 1]` },
          { name: "pairs", code: `assert n_pairs(transfusion_mask([("txt", 3), ("img", 2)])) == 16` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_unified(codes, text_V, boi, eoi)</C>, which shifts image codes above a text vocabulary of size{" "}
          <C>text_V</C> and wraps them in the markers, <C>from_unified(ids, text_V)</C> returning the text ids and the
          unshifted image codes, and <C>transfusion_loss(text_nlls, img_mses, lam)</C> from the per-position losses.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def to_unified(codes, text_V, boi, eoi):
    return codes

def from_unified(ids, text_V):
    return ids, []

def transfusion_loss(text_nlls, img_mses, lam):
    return sum(text_nlls)
`,
        solution: UNIFIED,
        tests: [
          { name: "uni", code: `assert to_unified([4], 10, 0, 1) == [0, 14, 1] and from_unified([3, 12, 15], 10) == ([3], [2, 5])` },
          { name: "loss", code: `assert abs(transfusion_loss([1.0, 3.0], [0.5], 2.0) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "big",
      rung: "stretch",
      prompt: (
        <p>
          A sequence has 100 text tokens followed by one image of 256 latent patches. How many query-key pairs does the
          Transfusion mask allow?
        </p>
      ),
      answer: { kind: "numeric", value: 96186, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Images can now be read and written by the same model as text. Sound is next: a second of audio holds tens of
        thousands of samples, and tokenising it compactly needs codecs that quantise in several stages, the subject of the
        next chapter.
      </p>
    </>
  ),
};
