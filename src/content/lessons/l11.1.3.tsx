import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LensKlViz } from "@/components/viz/LensKlViz";
import type { LessonContent } from "@/lib/types";

const LOGIT = `import math

def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    return [v / s for v in e]

def logit_lens(h, U):
    return softmax([sum(u * x for u, x in zip(row, h)) for row in U])

def kl(p, q):
    return sum(a * math.log(a / b) for a, b in zip(p, q) if a > 0)`;

const TUNED = `import math

def apply_affine(A, b, h):
    return [sum(a * x for a, x in zip(row, h)) + c for row, c in zip(A, b)]

def entropy(p):
    return -sum(a * math.log(a) for a in p if a > 0)

def prediction_depth(top1s, final):
    d = len(top1s)
    while d > 0 and top1s[d - 1] == final:
        d -= 1
    return d`;

export const lesson: LessonContent = {
  id: "l11.1.3",
  minutes: 45,
  links: {
    requires: ["l11.1.2", "l5.1.3"],
    revisits: ["l5.2.4", "m12.2.1", "l5.2.5"],
    foreshadows: ["l11.2.1", "l11.6.1"],
  },

  puzzle: (
    <>
      <p>
        Reading a transformer&apos;s middle layers through its output head shows a recognisable guess at the next word by about
        two-thirds of the way through. Doing the same in another model of similar size shows gibberish until the last few layers. Is the
        second model deciding much later, or is the reading method misleading?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every layer of a transformer adds to the same residual stream, and the output head turns the final stream into logits. The logit
        lens applies that head to the stream at an earlier layer, assuming the stream already speaks the output&apos;s language. Often it
        roughly does, but layers can use a different basis or carry offsets that the later layers remove. The tuned lens learns a small
        affine translation for each layer before applying the head, separating what a layer knows from how it writes it down.
      </p>
      <LensKlViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the logit lens">
        <p>
          Let <M>{"h_\\ell"}</M> be the residual stream after layer <M>{"\\ell"}</M> and U the unembedding matrix. The logit lens predicts{" "}
          <M>{"\\operatorname{softmax}(U h_\\ell)"}</M> (<C>logit_lens</C>, <C>softmax</C>); in practice the final normalisation is applied
          first. Its gap to the model is measured by <M>{"\\mathrm{KL}(p_L \\,\\|\\, p_\\ell)"}</M> (<C>kl</C>, m12.2.1), the extra nats of
          surprise a reader using layer <M>{"\\ell"}</M> would suffer relative to the final prediction.
        </p>
        <Code>{LOGIT}</Code>
      </Definition>

      <Definition title="the tuned lens">
        <p>
          The tuned lens inserts a learned affine translator for each layer,{" "}
          <M>{"p_\\ell = \\operatorname{softmax}(U(A_\\ell h_\\ell + b_\\ell))"}</M> (<C>apply_affine</C>), trained to minimise the KL to the
          final distribution on a dataset while the model stays frozen. The logit lens is the special case{" "}
          <M>{"A_\\ell = I, b_\\ell = 0"}</M>, so a well-trained tuned lens is never worse on its training objective.
        </p>
        <Code>{TUNED}</Code>
      </Definition>

      <Theorem title="a change of basis defeats the logit lens but not the tuned lens">
        <p>
          Suppose <M>{"h_\\ell = R h_L + c"}</M> for an invertible R. Then the tuned lens with{" "}
          <M>{"A_\\ell = R^{-1}, b_\\ell = -R^{-1}c"}</M> reproduces the final distribution exactly, while the logit lens&apos;s KL can be
          made arbitrarily large by the choice of R and c.
        </p>
      </Theorem>
      <Proof>
        <p>
          With that translator, <M>{"A_\\ell h_\\ell + b_\\ell = R^{-1}(R h_L + c) - R^{-1}c = h_L"}</M>, so the lens gives{" "}
          <M>{"\\operatorname{softmax}(Uh_L) = p_L"}</M> and the KL is zero. For the logit lens take <M>{"R = I"}</M> and{" "}
          <M>{"c = t\\,u"}</M>, where Uu has distinct entries: as t grows, <M>{"\\operatorname{softmax}(U h_L + tUu)"}</M> concentrates on the
          token with the largest entry of Uu, so every other token&apos;s lens probability tends to zero; since{" "}
          <M>{"p_L"}</M> gives those tokens positive probability, the KL grows without bound. The same layer carries the same information in
          both cases; only the reading differs.
        </p>
      </Proof>

      <Remark title="what the lenses are good for">
        <p>
          Plotting the lens distribution layer by layer shows where a prediction forms. The prediction depth of an input is the first
          layer from which the lens&apos;s top token agrees with the final top token at every later layer (<C>prediction_depth</C>); easy
          tokens settle early. The entropy of the lens distribution (<C>entropy</C>) shows how committed each layer is. Lenses are
          correlational readouts like probes (l11.1.2): a translator can import information the layer holds but the model never uses,
          and, conversely, a large KL early on can mean either missing information or a basis the lens failed to learn.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The second model may simply write its intermediate states in a basis or with offsets that the output head cannot read
          directly; models with weights that are not tied between input and output, or that place large constant directions in the
          stream, are known to do this. A tuned lens on both models would show whether the second model really decides later.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "kl",
      rung: "check",
      prompt: (
        <p>
          The final distribution over two tokens is (0.5, 0.5); a layer read through the logit lens gives (0.9, 0.1). What is the KL from
          the final distribution to the lens, in nats? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.511, tolerance: 0.001 },
    },
    {
      key: "depth",
      rung: "check",
      prompt: (
        <p>
          Through layers 0 to 7, the lens&apos;s top token is 3, 8, 8, 1, 8, 8, 8, 8, and the final top token is 8. What is the prediction
          depth, counting layers from 0?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: (
        <p>
          On a model, the logit lens has large KL at every layer before the last four, while the tuned lens&apos;s KL falls steadily from
          the first layer. What is the best reading?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Early layers already carry much of the prediction, written in a form the output head cannot read directly",
          "The model computes its prediction only in the last four layers",
          "The tuned lens is overfitting and should be ignored",
          "The model's output head is broken for early layers",
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

def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    return [v / s for v in e]

def logit_lens(h, U):
    return softmax([sum(u * x for u, x in zip(row, h)) for row in U])

def kl(p, q):
    return sum(a * math.log(a / b) for a, b in zip(p, q) if a > 0)

p = logit_lens([1.0, 0.0], [[1, 0], [0, 1], [-1, 0]])
print(p.index(max(p)), round(kl([0.5, 0.5], [0.5, 0.5]), 3), round(kl([1.0, 0.0], [0.5, 0.5]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0 0.0 0.693",
          "0 0.0 0.347",
          "2 0.0 0.693",
          "0 0.693 0.693",
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

def apply_affine(A, b, h):
    return [sum(a * x for a, x in zip(row, h)) + c for row, c in zip(A, b)]

def entropy(p):
    return -sum(a * math.log(a) for a in p if a > 0)

def prediction_depth(top1s, final):
    d = len(top1s)
    while d > 0 and top1s[d - 1] == final:
        d -= 1
    return d

print(apply_affine([[0, 1], [1, 0]], [1, 0], [2, 3]), round(entropy([0.25] * 4), 3), prediction_depth([4, 9, 9, 4, 9], 9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 2] 1.386 4",
          "[3, 3] 1.386 4",
          "[4, 2] 1.386 3",
          "[4, 2] 0.693 4",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax(z)</C>, subtracting the maximum for stability; <C>logit_lens(h, U)</C>, the softmax of U times h with U given
          as rows; and <C>kl(p, q)</C> in nats, skipping terms where p is zero.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax(z):
    return [1 / len(z)] * len(z)

def logit_lens(h, U):
    return softmax(h)

def kl(p, q):
    return 0.0
`,
        solution: LOGIT,
        tests: [
          { name: "softmax", code: `p = softmax([1.0, 2.0, 3.0])\nassert abs(p[2] - 0.6652409558) < 1e-9 and softmax([1000.0, 0.0])[0] == 1.0\nq = logit_lens([1.0, -1.0], [[1, 0], [0, 1], [1, 1]])\nassert abs(q[0] - 0.6652409558) < 1e-9 and abs(q[2] - 0.2447284711) < 1e-9` },
          { name: "kl", code: `assert abs(kl([0.2, 0.8], [0.5, 0.5]) - 0.192744757) < 1e-9\nassert abs(kl([0.0, 1.0], [0.5, 0.5]) - 0.6931471806) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>apply_affine(A, b, h)</C>, computing A h + b with A given as rows; <C>entropy(p)</C> in nats; and{" "}
          <C>prediction_depth(top1s, final)</C>, the first layer index from which every remaining entry equals final, or the number of
          layers if the last one differs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def apply_affine(A, b, h):
    return h

def entropy(p):
    return 0.0

def prediction_depth(top1s, final):
    return 0
`,
        solution: TUNED,
        tests: [
          { name: "affine", code: `assert apply_affine([[1, 2], [3, 4], [0, 1]], [0.5, -1, 2], [1, -1]) == [-0.5, -2, 1]\nassert abs(entropy([0.5, 0.5, 0]) - 0.6931471806) < 1e-9 and abs(entropy([0.1, 0.2, 0.7]) - 0.8018185525) < 1e-9` },
          { name: "depth", code: `assert prediction_depth([1, 2, 3], 4) == 3 and prediction_depth([5, 5, 5], 5) == 0\nassert prediction_depth([2, 7, 2, 2], 2) == 2` },
        ],
      },
    },
    {
      key: "rotate",
      rung: "stretch",
      prompt: (
        <p>
          Two tokens, U the identity, final stream <M>{"h_L = (2, 0)"}</M>, and an earlier layer holding the same vector rotated by 90
          degrees, <M>{"(0, 2)"}</M>. What is the logit lens&apos;s KL from the final distribution, in nats? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.523, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Lenses and probes read what is there. The next lesson turns to methods that assign credit for an output to parts of the input,
        and to the ways they can mislead.
      </p>
    </>
  ),
};
