import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ImageTextMatrixViz } from "@/components/viz/ImageTextMatrixViz";
import type { LessonContent } from "@/lib/types";

const CLIP = `import math

def normalise(v):
    n = math.sqrt(sum(a * a for a in v))
    return [a / n for a in v]

def clip_logits(imgs, txts, temp):
    I = [normalise(v) for v in imgs]; T = [normalise(v) for v in txts]
    return [[sum(a * b for a, b in zip(i, t)) / temp for t in T] for i in I]

def clip_loss(L):
    n = len(L)
    lse = lambda v: max(v) + math.log(sum(math.exp(x - max(v)) for x in v))
    rows = sum(lse(L[i]) - L[i][i] for i in range(n))                     # each image picks its caption
    cols = sum(lse([L[k][i] for k in range(n)]) - L[i][i] for i in range(n))   # each caption picks its image
    return (rows + cols) / (2 * n)`;

const USES = `import math

def siglip_loss(sims, t, b):
    total = 0.0
    for i, row in enumerate(sims):
        for j, s in enumerate(row):
            u = (1 if i == j else -1) * (t * s + b)
            total += math.log1p(math.exp(-u)) if u > 0 else -u + math.log1p(math.exp(u))   # -log sigmoid(u)
    return total / len(sims)

def zero_shot(img, class_embs):
    cos = lambda a, b: sum(x * y for x, y in zip(a, b)) / math.sqrt(sum(x * x for x in a) * sum(y * y for y in b))
    return max(range(len(class_embs)), key=lambda k: cos(img, class_embs[k]))

def recall_at_k(sims, k):
    hits = sum(sorted(range(len(r)), key=lambda j: -r[j]).index(i) < k for i, r in enumerate(sims))
    return hits / len(sims)`;

export const lesson: LessonContent = {
  id: "l12.5.1",
  minutes: 50,
  links: {
    requires: ["l4.2.4", "l4.6.1"],
    revisits: ["l12.3.3"],
    foreshadows: ["l12.5.2"],
  },

  puzzle: (
    <>
      <p>
        ImageNet classifiers learn a thousand fixed labels from a million hand-labelled images, and cannot name anything
        else. The web holds billions of images that already come with text: captions, alt text, titles. The text is noisy and
        unstructured and never says which of a thousand classes the image belongs to. Can a model learn from this alone and
        then classify images into categories it was never given, simply from their names?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Train two encoders, one for images and one for text, to place each image near its own caption and away from the
        other captions in the batch. Nothing asks for classes; the task is only to tell which caption goes with which
        image, and to win at it with thousands of candidates the encoders must capture what the captions talk about. Then a
        class name written as a caption, such as &quot;a photo of a dog&quot;, lands near the images of dogs, and
        classification becomes retrieval.
      </p>
      <ImageTextMatrixViz />
    </>
  ),

  theory: (
    <>
      <Definition title="contrastive image-text training">
        <p>
          For a batch of n pairs, image and text encoders produce vectors that are normalised to unit length{" "}
          (<C>normalise</C>). The logits are <M>{"L_{ij} = \\langle u_i, v_j \\rangle / \\tau"}</M> (<C>clip_logits</C>) with a
          learned temperature τ. The loss averages the cross-entropy of picking the right caption for each image and the
          right image for each caption (<C>clip_loss</C>):
        </p>
        <MD>{"\\mathcal{L} = \\frac{1}{2n} \\sum_{i=1}^{n} \\Big[\\Big(\\log \\sum_j e^{L_{ij}} - L_{ii}\\Big) + \\Big(\\log \\sum_j e^{L_{ji}} - L_{ii}\\Big)\\Big]."}</MD>
        <p>
          Radford and colleagues trained CLIP this way on 400 million pairs with batches of 32,768, starting from τ = 0.07
          and capping <M>{"1/\\tau"}</M> at 100.
        </p>
        <Code>{CLIP}</Code>
      </Definition>

      <Theorem title="the gradient on the logits">
        <p>
          Let P be the matrix of row-wise softmax probabilities of L and Q that of column-wise probabilities. Then{" "}
          <M>{"\\partial \\mathcal{L} / \\partial L_{ij} = \\big(P_{ij} + Q_{ij} - 2\\cdot\\mathbb{1}[i = j]\\big)/(2n)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For one row, <M>{"\\partial(\\log \\sum_k e^{L_{ik}} - L_{ii})/\\partial L_{ij} = P_{ij} - \\mathbb{1}[i = j]"}</M>, the
          familiar softmax cross-entropy gradient, and <M>{"L_{ij}"}</M> enters only row i. Likewise it enters only column j of
          the second sum, with gradient <M>{"Q_{ij} - \\mathbb{1}[i = j]"}</M>. Add and divide by 2n. So each negative pair is
          pushed apart in proportion to the probability the model wrongly gives it: confusable captions get most of the
          gradient, and a lower temperature concentrates the probabilities on them.
        </p>
      </Proof>

      <Remark title="what the loss estimates">
        <p>
          Each half of the loss is the InfoNCE loss of l4.2.4 with the batch&apos;s other captions as negatives, so{" "}
          <M>{"\\log n - \\mathcal{L}"}</M> lower-bounds the mutual information between image and caption, and the optimal
          logit is the pointwise mutual information up to a constant. Larger batches make the task harder and the bound
          looser in a useful way, which is one reason contrastive models use huge batches.
        </p>
      </Remark>

      <Definition title="zero-shot classification and retrieval">
        <p>
          To classify, embed one caption per class, such as &quot;a photo of a {"{"}class{"}"}&quot;, and pick the class whose
          caption is most similar to the image (<C>zero_shot</C>); averaging embeddings over several templates usually helps.
          For retrieval, rank captions by similarity and report recall at k, the fraction of images whose own caption is in
          the top k (<C>recall_at_k</C>). CLIP&apos;s largest model reached 76.2% zero-shot accuracy on ImageNet, matching a
          ResNet-50 trained on its labels.
        </p>
      </Definition>

      <Definition title="the sigmoid loss">
        <p>
          SigLIP (Zhai and colleagues) replaces the two softmaxes by an independent binary decision per pair:{" "}
          <M>{"-\\tfrac{1}{n}\\sum_{i, j} \\log \\sigma\\big(z_{ij}(t \\langle u_i, v_j\\rangle + b)\\big)"}</M> with{" "}
          <M>{"z_{ij} = 1"}</M> on the diagonal and −1 elsewhere, and learned t and b (<C>siglip_loss</C>). No pair&apos;s loss
          depends on the others, so the batch can be processed in chunks across devices without gathering every embedding,
          and it works well even at small batch sizes.
        </p>
        <Code>{USES}</Code>
      </Definition>

      <Theorem title="why the bias starts at −10">
        <p>
          With t = 10, b = −10 and all similarities zero, as for random high-dimensional embeddings at initialisation, the
          loss per image is <M>{"\\mathrm{softplus}(10) + (n - 1)\\,\\mathrm{softplus}(-10) \\approx 10 + (n - 1)\\, e^{-10}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"-\\log \\sigma(u) = \\mathrm{softplus}(-u) = \\log(1 + e^{-u})"}</M>. A positive pair has u = b = −10 and costs{" "}
          <M>{"\\mathrm{softplus}(10) = 10 + \\log(1 + e^{-10})"}</M>; each of the n − 1 negatives has u = 10 and costs{" "}
          <M>{"\\log(1 + e^{-10}) \\approx e^{-10}"}</M>. Negatives outnumber positives n − 1 to 1; starting them almost free
          stops the early gradient from being spent on pushing apart pairs that are already unrelated.
        </p>
      </Proof>

      <Remark title="limits and uses">
        <p>
          Contrastive models often behave like bags of words: &quot;a horse riding a man&quot; and &quot;a man riding a
          horse&quot; embed alike, because few batches contain the distinction, and counting and spatial relations are weak.
          The two modalities also occupy separate regions of the sphere, the modality gap. Even so, these encoders are
          everywhere: as retrieval engines and filters for training data, as the text encoder of latent diffusion (l12.3.3),
          and as the vision encoder of the vision-language models of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "loss2",
      rung: "check",
      prompt: (
        <p>
          A batch of two pairs has logits (similarity over temperature) of 2 on the diagonal and 0 off it. What is the
          symmetric contrastive loss?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1269, tolerance: 0.0005 },
    },
    {
      key: "sig",
      rung: "check",
      prompt: (
        <p>
          With t = 10, b = −10 and all similarities zero, what is the sigmoid loss per image for a batch of 1000?
        </p>
      ),
      answer: { kind: "numeric", value: 10.0454, tolerance: 0.0005 },
    },
    {
      key: "scale",
      rung: "apply",
      prompt: <p>What makes the sigmoid loss easier to distribute across many devices than the softmax loss?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each pair's term is independent, so no normalisation over a whole row or column of the batch is needed",
          "It needs no text encoder",
          "It uses a smaller temperature",
          "It ignores negative pairs",
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

def normalise(v):
    n = math.sqrt(sum(a * a for a in v))
    return [a / n for a in v]

def clip_logits(imgs, txts, temp):
    I = [normalise(v) for v in imgs]; T = [normalise(v) for v in txts]
    return [[sum(a * b for a, b in zip(i, t)) / temp for t in T] for i in I]

def clip_loss(L):
    n = len(L)
    lse = lambda v: max(v) + math.log(sum(math.exp(x - max(v)) for x in v))
    rows = sum(lse(L[i]) - L[i][i] for i in range(n))                     # each image picks its caption
    cols = sum(lse([L[k][i] for k in range(n)]) - L[i][i] for i in range(n))   # each caption picks its image
    return (rows + cols) / (2 * n)

L = clip_logits([[3.0, 0.0], [0.0, 2.0]], [[1.0, 0.0], [1.0, 1.0]], 1.0)
print([[round(x, 4) for x in r] for r in L], round(clip_loss(L), 4), round(clip_loss([[5.0, 0.0], [0.0, 5.0]]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 0.7071], [0.0, 0.7071]] 0.4912 0.0067",
          "[[3.0, 2.1213], [0.0, 1.4142]] 0.4912 0.0067",
          "[[1.0, 0.7071], [0.0, 0.7071]] 0.4912 0.0",
          "[[1.0, 0.7071], [0.0, 0.7071]] 0.6931 0.0067",
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

def siglip_loss(sims, t, b):
    total = 0.0
    for i, row in enumerate(sims):
        for j, s in enumerate(row):
            u = (1 if i == j else -1) * (t * s + b)
            total += math.log1p(math.exp(-u)) if u > 0 else -u + math.log1p(math.exp(u))   # -log sigmoid(u)
    return total / len(sims)

def zero_shot(img, class_embs):
    cos = lambda a, b: sum(x * y for x, y in zip(a, b)) / math.sqrt(sum(x * x for x in a) * sum(y * y for y in b))
    return max(range(len(class_embs)), key=lambda k: cos(img, class_embs[k]))

def recall_at_k(sims, k):
    hits = sum(sorted(range(len(r)), key=lambda j: -r[j]).index(i) < k for i, r in enumerate(sims))
    return hits / len(sims)

S = [[0.9, 0.1, 0.3], [0.2, 0.5, 0.6], [0.0, 0.4, 0.8]]
print(round(recall_at_k(S, 1), 4), recall_at_k(S, 2), zero_shot([1.0, 1.0], [[1.0, 0.0], [0.0, 2.0], [3.0, 2.0]]), round(siglip_loss([[1.0]], 10.0, -10.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6667 1.0 2 0.6931",
          "0.3333 1.0 2 0.6931",
          "0.6667 1.0 1 0.6931",
          "0.6667 0.6667 2 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normalise(v)</C>, <C>clip_logits(imgs, txts, temp)</C> of cosine similarities over temperature, and{" "}
          <C>clip_loss(L)</C>, the symmetric cross-entropy with the matching pairs on the diagonal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def normalise(v):
    return v

def clip_logits(imgs, txts, temp):
    return [[sum(a * b for a, b in zip(i, t)) for t in txts] for i in imgs]

def clip_loss(L):
    return -sum(L[i][i] for i in range(len(L))) / len(L)
`,
        solution: CLIP,
        tests: [
          { name: "logits", code: `L = clip_logits([[0.0, 2.0]], [[0.0, 5.0], [3.0, 4.0]], 0.5)\nassert abs(L[0][0] - 2.0) < 1e-12 and abs(L[0][1] - 1.6) < 1e-12` },
          { name: "loss", code: `import math\nv = clip_loss([[1.0, 0.0], [0.0, 1.0]])\nassert abs(v - math.log(1 + math.exp(-1))) < 1e-12\nw = clip_loss([[0.0, 1.0], [0.0, 0.0]])\nassert abs(w - (math.log(1 + math.e) + math.log(2) + math.log(2) + math.log(1 + math.e)) / 4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>siglip_loss(sims, t, b)</C> summing <M>{"-\\log\\sigma"}</M> over all pairs and dividing by the number of
          images, <C>zero_shot(img, class_embs)</C> returning the index of the most cosine-similar class, and{" "}
          <C>recall_at_k(sims, k)</C> for rows of image-to-caption similarities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def siglip_loss(sims, t, b):
    return 0.0

def zero_shot(img, class_embs):
    return 0

def recall_at_k(sims, k):
    return 1.0
`,
        solution: USES,
        tests: [
          { name: "sig", code: `import math\nv = siglip_loss([[0.5, 0.0], [0.0, 0.5]], 2.0, 0.0)\nassert abs(v - (math.log(1 + math.exp(-1)) + math.log(2))) < 1e-12` },
          { name: "zs", code: `assert zero_shot([0.0, 1.0], [[1.0, 0.0], [1.0, 1.0], [5.0, 0.1]]) == 1 and zero_shot([1.0, 0.0], [[0.0, 3.0], [2.0, 0.1]]) == 1\nassert abs(recall_at_k([[0.1, 0.9], [0.2, 0.8]], 1) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "temp",
      rung: "stretch",
      prompt: (
        <p>
          Two captions have cosine similarities 0.30 and 0.25 with an image. At temperature 0.01, what probability does the
          softmax give the first caption?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9933, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        A contrastive encoder turns an image into a vector that knows what the image is about. A vision-language model
        goes further: it turns the image into a sequence of vectors a language model can read like words, and then answers
        questions about it in text.
      </p>
    </>
  ),
};
