import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QkNormViz } from "@/components/viz/QkNormViz";
import type { LessonContent } from "@/lib/types";

const ENTROPY = `import math

def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    return [v / s for v in e]

def entropy(p):
    return -sum(x * math.log(x) for x in p if x > 0)

def max_prob_bound(B, n):
    return 1 / (1 + (n - 1) * math.exp(-2 * B))`;

const QKNORM = `import math

def rms_normalise(v, g, eps=1e-6):
    r = math.sqrt(sum(x * x for x in v) / len(v) + eps)
    return [gi * x / r for gi, x in zip(g, v)]

def scaled_logit(q, k, norm=False, gq=None, gk=None):
    if norm:
        q = rms_normalise(q, gq or [1.0] * len(q))
        k = rms_normalise(k, gk or [1.0] * len(k))
    return sum(a * b for a, b in zip(q, k)) / math.sqrt(len(q))

def soft_cap(x, cap):
    return cap * math.tanh(x / cap)`;

export const lesson: LessonContent = {
  id: "l8.2.3",
  minutes: 45,
  links: {
    requires: ["l8.2.1", "m14.6.3"],
    revisits: ["m12.1.2", "m14.6.2"],
    foreshadows: ["l8.6.2", "l8.2.4"],
  },

  puzzle: (
    <>
      <p>
        A large run trains smoothly for days, then the loss jumps and never recovers. Looking inside, the attention logits in
        some layers have grown into the hundreds, each head attends to a single token, and the gradients have become erratic.
        Nothing in the architecture limits how large those logits can get. What drives the growth, and what is the cheapest way
        to stop it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An attention logit is a product of a query and a key, both linear in the weights. If the optimiser grows the query and
        key projections by a factor s, the logits grow by s², and a softmax over large logits is nearly one-hot: low entropy,
        and almost no gradient to the keys it ignores. Normalising queries and keys before the dot product removes this degree
        of freedom: the logits can then be only as large as learned gains allow.
      </p>
      <QkNormViz />
    </>
  ),

  theory: (
    <>
      <Definition title="attention entropy">
        <p>
          For logits z over n keys, the attention weights are <M>{"p = \\mathrm{softmax}(z)"}</M> and their entropy is{" "}
          <M>{"H(p) = -\\sum_i p_i \\ln p_i"}</M> (<C>softmax</C>, <C>entropy</C>), between 0 for one-hot attention and ln n for uniform attention.
          Attention entropy collapse, the steady fall of H in some heads, was identified by Zhai and colleagues as a precursor of
          divergence.
        </p>
        <Code>{ENTROPY}</Code>
      </Definition>

      <Theorem title="bounded logits bound the attention">
        <p>
          If every logit lies in [−B, B], then every attention weight satisfies
        </p>
        <MD>{"p_i \\le \\frac{1}{1 + (n - 1)e^{-2B}}"}</MD>
        <p>
          (<C>max_prob_bound</C>), so attention cannot become one-hot over many keys unless B grows like ln n.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"p_i = e^{z_i} / \\sum_j e^{z_j}"}</M> increases in <M>{"z_i"}</M> and decreases in every other <M>{"z_j"}</M>. The largest value is at{" "}
          <M>{"z_i = B"}</M> and <M>{"z_j = -B"}</M> for <M>{"j \\neq i"}</M>, giving <M>{"e^B / (e^B + (n-1)e^{-B})"}</M>; divide through by <M>{"e^B"}</M>.
        </p>
      </Proof>

      <Definition title="QK-norm">
        <p>
          QK-norm applies a normalisation, RMSNorm or LayerNorm, to each head&apos;s query and key before the dot product:{" "}
          <M>{"z = \\langle g_q \\odot \\hat q,\; g_k \\odot \\hat k\\rangle/\\sqrt{d}"}</M> with <M>{"\\hat q = q/\\mathrm{rms}(q)"}</M> (<C>rms_normalise</C>,{" "}
          <C>scaled_logit</C>). Since <M>{"\\|\\hat q\\| = \\|\\hat k\\| = \\sqrt d"}</M>, Cauchy–Schwarz gives{" "}
          <M>{"|z| \\le \\sqrt d\\, \\|g_q\\|_\\infty \\|g_k\\|_\\infty"}</M>: the logit scale is now set by the gains, which move slowly, rather than
          by the size of the projection weights. Rescaling the weights changes nothing at all.
        </p>
        <Code>{QKNORM}</Code>
      </Definition>

      <Remark title="soft-capping, the alternative">
        <p>
          Instead of normalising, one can squash the logits: <M>{"z \\mapsto c \\tanh(z/c)"}</M> (<C>soft_cap</C>), which is nearly the identity for{" "}
          <M>{"|z| \\ll c"}</M> and saturates at ±c. Gemma 2 capped attention logits at 50 and output logits at 30. Capping bounds the
          logits but leaves the saturated region with almost no gradient, and it complicates fused attention
          kernels; Gemma 3 replaced it with QK-norm.
        </p>
      </Remark>

      <Example title="the evidence">
        <p>
          Dehghani and colleagues found that training a 22-billion-parameter vision transformer diverged within a few thousand
          steps through attention logit growth, and that QK-norm removed the problem. Wortsman and colleagues reproduced the same
          instability in far smaller models simply by raising the learning rate, and showed that QK-norm widened
          the range of learning rates that train well, so the effect could be studied cheaply. OLMo 2 and Gemma 3 adopted it.
          The related instability in the output layer, where the softmax normaliser drifts, is treated with z-loss, as in m14.6.3.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: <p>All attention logits over 1,024 keys lie in [−5, 5]. What is the largest possible attention weight on one key? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.9556, tolerance: 0.0002 },
    },
    {
      key: "cap",
      rung: "check",
      prompt: <p>A logit of 80 is soft-capped at c = 50. What value comes out? Give two decimals.</p>,
      answer: { kind: "numeric", value: 46.08, tolerance: 0.01 },
    },
    {
      key: "scale",
      rung: "apply",
      prompt: <p>Why does multiplying the query and key projection weights by 3 leave QK-normed logits unchanged?</p>,
      answer: {
        kind: "choice",
        options: [
          "Normalisation divides each query and key by its own root mean square, which scales by the same factor, so the factor cancels",
          "The softmax is invariant to multiplying all logits by a constant",
          "The 1/√d factor cancels the scaling",
          "QK-norm clips the weights back to their original size after each step",
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

def entropy(p):
    return -sum(x * math.log(x) for x in p if x > 0)

def max_prob_bound(B, n):
    return 1 / (1 + (n - 1) * math.exp(-2 * B))

print([round(v, 4) for v in softmax([0.0, math.log(3)])], round(entropy([0.25] * 4), 4))
print(round(max_prob_bound(0.0, 4), 4), round(max_prob_bound(2.0, 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.25, 0.75] 1.3863\n0.25 1.0",
          "[0.0, 1.0] 1.3863\n0.25 1.0",
          "[0.25, 0.75] 1.0\n0.25 1.0",
          "[0.25, 0.75] 1.3863\n0.25 0.0183",
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

def rms_normalise(v, g, eps=1e-6):
    r = math.sqrt(sum(x * x for x in v) / len(v) + eps)
    return [gi * x / r for gi, x in zip(g, v)]

def scaled_logit(q, k, norm=False, gq=None, gk=None):
    if norm:
        q = rms_normalise(q, gq or [1.0] * len(q))
        k = rms_normalise(k, gk or [1.0] * len(k))
    return sum(a * b for a, b in zip(q, k)) / math.sqrt(len(q))

def soft_cap(x, cap):
    return cap * math.tanh(x / cap)

q, k = [1.0, 2.0, 2.0, 0.0], [2.0, 0.0, 1.0, 2.0]; print(scaled_logit(q, k), scaled_logit([3 * x for x in q], [3 * x for x in k]))
print(round(scaled_logit([3 * x for x in q], [3 * x for x in k], True), 4), round(soft_cap(1.0, 50.0), 4), round(soft_cap(1000.0, 30.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 18.0\n0.8889 0.9999 30.0",
          "2.0 6.0\n0.8889 0.9999 30.0",
          "2.0 18.0\n8.0 0.9999 30.0",
          "2.0 18.0\n0.8889 1.0 1000.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax(z)</C>, stable for large logits, <C>entropy(p)</C> in nats, and <C>max_prob_bound(B, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax(z):
    s = sum(math.exp(v) for v in z)
    return [math.exp(v) / s for v in z]

def entropy(p):
    return -sum(x * math.log2(x) for x in p if x > 0)

def max_prob_bound(B, n):
    return 1 / n
`,
        solution: ENTROPY,
        tests: [
          { name: "softmax", code: `p = softmax([800.0, 800.0 + math.log(4)])\nassert abs(p[1] - 0.8) < 1e-12 and abs(entropy([0.5, 0.5]) - math.log(2)) < 1e-12` },
          { name: "bound", code: `B, n = 1.5, 10\nassert abs(max_prob_bound(B, n) - softmax([B] + [-B] * (n - 1))[0]) < 1e-12 and abs(max_prob_bound(0.0, 8) - 0.125) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rms_normalise(v, g, eps)</C>, <C>scaled_logit(q, k, norm, gq, gk)</C>, which applies RMS normalisation with gains (default all
          ones) to both vectors when <C>norm</C> is true and returns the dot product over <M>{"\\sqrt d"}</M>, and <C>soft_cap(x, cap)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rms_normalise(v, g, eps=1e-6):
    return v

def scaled_logit(q, k, norm=False, gq=None, gk=None):
    return sum(a * b for a, b in zip(q, k))

def soft_cap(x, cap):
    return min(x, cap)
`,
        solution: QKNORM,
        tests: [
          { name: "norm", code: `q, k = [1.0, 2.0, 2.0, 0.0], [2.0, 0.0, 1.0, 2.0]\nassert abs(scaled_logit(q, k) - 2.0) < 1e-12 and abs(scaled_logit([5 * x for x in q], k, True) - scaled_logit(q, k, True)) < 1e-6 and abs(scaled_logit(q, k, True, [2.0] * 4, [1.0] * 4) - 2 * scaled_logit(q, k, True)) < 1e-9` },
          { name: "cap", code: `assert abs(soft_cap(10.0, 10.0) - 10 * math.tanh(1.0)) < 1e-12 and abs(rms_normalise([3.0, 4.0], [1.0, 1.0], 0.0)[1] - 4 / math.sqrt(12.5)) < 1e-12` },
        ],
      },
    },
    {
      key: "gains",
      rung: "stretch",
      prompt: (
        <p>
          With RMS-normalised queries and keys of dimension 128 and every gain at most 1.5 in absolute value, what is the largest
          possible scaled logit <M>{"\\langle g_q \\odot \\hat q, g_k \\odot \\hat k\\rangle/\\sqrt{d}"}</M>? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 25.46, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every choice in this chapter came with a claim that it helps. The next lesson asks how such claims are tested, and why
        many published architecture improvements do not survive a careful comparison.
      </p>
    </>
  ),
};
