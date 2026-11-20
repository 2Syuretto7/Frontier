import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DistillTempViz } from "@/components/viz/DistillTempViz";
import type { LessonContent } from "@/lib/types";

const KD = `import math

def softmax_t(z, T=1.0):
    m = max(z)
    e = [math.exp((v - m) / T) for v in z]
    s = sum(e)
    return [v / s for v in e]

def kd_loss(teacher_z, student_z, T):
    p, q = softmax_t(teacher_z, T), softmax_t(student_z, T)
    return T * T * sum(pi * math.log(pi / qi) for pi, qi in zip(p, q) if pi > 0)

def kd_grad(teacher_z, student_z, T):
    p, q = softmax_t(teacher_z, T), softmax_t(student_z, T)
    return [T * (qi - pi) for pi, qi in zip(p, q)]`;

const SPARSE = `import math

def topk_sparse(probs, k):
    idx = sorted(range(len(probs)), key=lambda i: -probs[i])[:k]
    total = sum(probs[i] for i in idx)
    return {i: probs[i] / total for i in idx}

def sparse_ce(sparse_teacher, student_logprobs):
    return -sum(p * student_logprobs[i] for i, p in sparse_teacher.items())

def kl(p, q):
    return sum(pi * math.log(pi / qi) for pi, qi in zip(p, q) if pi > 0)`;

export const lesson: LessonContent = {
  id: "l9.2.1",
  minutes: 45,
  links: {
    requires: ["l9.1.4", "m12.2.1"],
    revisits: ["l8.1.1", "l8.4.4"],
    foreshadows: ["l9.2.2", "l9.2.3"],
  },

  puzzle: (
    <>
      <p>
        Gemma 2&apos;s smaller models were trained not on the next token of their data but on the whole next-token distribution of a
        larger model, and they beat models of the same size trained the usual way. A training example normally says which token
        came next; a teacher&apos;s distribution says how plausible every token was. How much more does that carry, and how is it
        used?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A one-hot target gives one bit of guidance per position about which token is right, and nothing about which wrong
        tokens are nearly right. A trained teacher&apos;s distribution ranks all of them: &quot;sofa&quot; is a fine continuation of &quot;the cat sat on
        the&quot;, &quot;moon&quot; is not. Training a student to match that distribution transfers the teacher&apos;s similarity structure, the &quot;dark
        knowledge&quot; in its small probabilities. Raising the softmax temperature makes those small probabilities visible.
      </p>
      <DistillTempViz />
    </>
  ),

  theory: (
    <>
      <Definition title="distillation loss">
        <p>
          With teacher logits v, student logits z and temperature T, let <M>{"p = \\mathrm{softmax}(v/T)"}</M> and <M>{"q = \\mathrm{softmax}(z/T)"}</M>{" "}
          (<C>softmax_t</C>). Hinton, Vinyals and Dean trained on
        </p>
        <MD>{"\\mathcal{L}_{\\text{KD}} = T^2\\,\\mathrm{KL}(p\\,\\|\\,q)"}</MD>
        <p>
          (<C>kd_loss</C>), often added to the ordinary cross-entropy on the true token. Its gradient with respect to the student&apos;s
          logits is <M>{"T(q - p)"}</M> (<C>kd_grad</C>).
        </p>
        <Code>{KD}</Code>
      </Definition>

      <Theorem title="the gradient and the T² factor">
        <p>
          <M>{"\\partial \\mathcal{L}_{\\text{KD}}/\\partial z_i = T(q_i - p_i)"}</M>. If the logits of both models have zero mean and T is large compared with
          their spread, this is approximately <M>{"(z_i - v_i)/N"}</M> for N classes, independent of T.
        </p>
      </Theorem>
      <Proof>
        <p>
          Only the cross-entropy part of the KL depends on z: <M>{"-T^2\\sum_j p_j \\log q_j"}</M>. The derivative of <M>{"\\log q_j"}</M> with respect to{" "}
          <M>{"z_i"}</M> is <M>{"(\\delta_{ij} - q_i)/T"}</M>, so the gradient is <M>{"-T\\sum_j p_j(\\delta_{ij} - q_i) = T(q_i - p_i)"}</M>, using{" "}
          <M>{"\\sum_j p_j = 1"}</M>. For large T, <M>{"e^{x/T} \\approx 1 + x/T"}</M>, so with zero-mean logits <M>{"q_i \\approx (1 + z_i/T)/N"}</M> and{" "}
          <M>{"p_i \\approx (1 + v_i/T)/N"}</M>, giving <M>{"T(q_i - p_i) \\approx (z_i - v_i)/N"}</M>. The <M>{"T^2"}</M> factor is exactly what keeps the gradient&apos;s
          size from shrinking as T grows, and in the limit distillation becomes matching logits, as Buciluă and Caruana had done.
        </p>
      </Proof>

      <Definition title="distillation for language models">
        <p>
          A vocabulary of a hundred thousand tokens or more makes full teacher distributions expensive to store for every
          training token, so pipelines keep the top k probabilities, renormalised (<C>topk_sparse</C>), and train the student with
          cross-entropy against that sparse target (<C>sparse_ce</C>), or run the teacher alongside the student. The direction of the
          divergence matters (<C>kl</C>): <M>{"\\mathrm{KL}(p\\|q)"}</M> makes the student cover every token the teacher considers plausible, while{" "}
          <M>{"\\mathrm{KL}(q\\|p)"}</M> lets it concentrate on the teacher&apos;s main modes, which MiniLLM argued suits generation by smaller
          students.
        </p>
        <Code>{SPARSE}</Code>
      </Definition>

      <Remark title="where it is used">
        <p>
          DistilBERT kept 97% of BERT&apos;s performance with 40% fewer parameters. In pretraining, Gemma 2 distilled its 2B and 9B
          models from a larger teacher over trillions of tokens, far more than compute-optimal for their size (l8.4.4), and the
          distillation signal kept improving them where ordinary training would have saturated sooner. Llama 3.2&apos;s 1B and 3B
          models used logits from the 8B and 70B models, and NVIDIA&apos;s Minitron combined pruning a large model with distilling into
          the pruned one.
        </p>
      </Remark>

      <Example title="why soft targets carry more">
        <p>
          A hard label is one of N outcomes; a distribution over N tokens specifies N − 1 numbers. Per position, the student learns
          not only the right answer but the teacher&apos;s whole ranking, which acts as a strong regulariser and lets the student learn
          from fewer examples. The catch is that it also learns the teacher&apos;s mistakes and miscalibration.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "soft",
      rung: "check",
      prompt: <p>A teacher has logits (2, 1, 0). At temperature T = 2, what probability does it give the first class? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.506, tolerance: 0.001 },
    },
    {
      key: "grad",
      rung: "check",
      prompt: (
        <p>
          With the same teacher and T = 2, a student has logits (0, 0, 0). What is the gradient of <M>{"T^2\\,\\mathrm{KL}(p\\|q)"}</M> with respect to the
          student&apos;s first logit? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.346, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does training a small model on a teacher&apos;s token distributions usually beat training it on the same text with ordinary labels?</p>,
      answer: {
        kind: "choice",
        options: [
          "The distribution tells the student how plausible every token is, not just which one occurred, giving a richer and less noisy signal per position",
          "The teacher's distribution always puts probability 1 on the correct token",
          "Distillation lets the student use the teacher's parameters directly",
          "Soft targets make the student larger",
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

def softmax_t(z, T=1.0):
    m = max(z)
    e = [math.exp((v - m) / T) for v in z]
    s = sum(e)
    return [v / s for v in e]

def kd_loss(teacher_z, student_z, T):
    p, q = softmax_t(teacher_z, T), softmax_t(student_z, T)
    return T * T * sum(pi * math.log(pi / qi) for pi, qi in zip(p, q) if pi > 0)

def kd_grad(teacher_z, student_z, T):
    p, q = softmax_t(teacher_z, T), softmax_t(student_z, T)
    return [T * (qi - pi) for pi, qi in zip(p, q)]

print([round(v, 3) for v in softmax_t([0.0, math.log(3)])], softmax_t([5.0, 5.0], 10), kd_loss([1.0, 2.0], [1.0, 2.0], 4))
print([round(g, 3) for g in kd_grad([0.0, 0.0], [math.log(3), 0.0], 2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.25, 0.75] [0.5, 0.5] 0.0\n[0.268, -0.268]",
          "[0.25, 0.75] [0.5, 0.5] 0.0\n[-0.268, 0.268]",
          "[0.75, 0.25] [0.5, 0.5] 0.0\n[0.268, -0.268]",
          "[0.25, 0.75] [0.0, 1.0] 1.0\n[0.134, -0.134]",
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

def topk_sparse(probs, k):
    idx = sorted(range(len(probs)), key=lambda i: -probs[i])[:k]
    total = sum(probs[i] for i in idx)
    return {i: probs[i] / total for i in idx}

def sparse_ce(sparse_teacher, student_logprobs):
    return -sum(p * student_logprobs[i] for i, p in sparse_teacher.items())

def kl(p, q):
    return sum(pi * math.log(pi / qi) for pi, qi in zip(p, q) if pi > 0)

print(topk_sparse([0.1, 0.5, 0.2, 0.2], 2), round(sparse_ce({0: 0.5, 1: 0.5}, [math.log(0.5), math.log(0.25)]), 3))
print(round(kl([0.5, 0.5], [0.25, 0.75]), 3), kl([1.0, 0.0], [1.0, 0.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{1: 0.7142857142857143, 2: 0.28571428571428575} 1.04\n0.144 0.0",
          "{1: 0.5, 2: 0.2} 1.04\n0.144 0.0",
          "{1: 0.7142857142857143, 3: 0.28571428571428575} 1.04\n0.144 0.0",
          "{1: 0.7142857142857143, 2: 0.28571428571428575} 0.693\n0.131 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax_t(z, T=1.0)</C>, numerically stable, <C>kd_loss(teacher_z, student_z, T)</C> and <C>kd_grad(teacher_z, student_z, T)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax_t(z, T=1.0):
    e = [math.exp(v) for v in z]
    return [v / sum(e) for v in e]

def kd_loss(teacher_z, student_z, T):
    return 0.0

def kd_grad(teacher_z, student_z, T):
    return [0.0 for _ in student_z]
`,
        solution: KD,
        tests: [
          { name: "soft", code: `p = softmax_t([1000.0, 1000.0 + 2 * math.log(4)], 2)\nassert abs(p[0] - 0.2) < 1e-12 and abs(sum(softmax_t([0.3, -1.0, 2.0], 0.5)) - 1) < 1e-12` },
          { name: "kd", code: `t, s = [0.5, -0.2, 1.0], [0.0, 0.4, -0.3]\ng = kd_grad(t, s, 3.0)\nh = 1e-6\nfor i in range(3):\n    s2 = list(s); s2[i] += h\n    assert abs((kd_loss(t, s2, 3.0) - kd_loss(t, s, 3.0)) / h - g[i]) < 1e-4\nassert abs(kd_loss(t, t, 2.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>topk_sparse(probs, k)</C>, returning a dictionary from index to renormalised probability, <C>sparse_ce(sparse_teacher,
          student_logprobs)</C> and <C>kl(p, q)</C>, skipping terms where p is zero.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def topk_sparse(probs, k):
    return {i: p for i, p in enumerate(probs[:k])}

def sparse_ce(sparse_teacher, student_logprobs):
    return 0.0

def kl(p, q):
    return sum(pi * math.log(pi / qi) for pi, qi in zip(p, q))
`,
        solution: SPARSE,
        tests: [
          { name: "topk", code: `d = topk_sparse([0.05, 0.3, 0.1, 0.45, 0.1], 2)\nassert set(d) == {1, 3} and abs(d[3] - 0.6) < 1e-12 and abs(sparse_ce({0: 0.25, 2: 0.75}, [-1.0, -5.0, -2.0]) - 1.75) < 1e-12` },
          { name: "kl", code: `assert abs(kl([0.0, 1.0], [0.5, 0.5]) - math.log(2)) < 1e-12 and abs(kl([0.5, 0.5], [0.5, 0.5])) < 1e-12` },
        ],
      },
    },
    {
      key: "direction",
      rung: "stretch",
      prompt: (
        <p>
          A teacher gives (0.6, 0.3, 0.1) and a student gives (0.9, 0.05, 0.05). By how much does the forward divergence{" "}
          <M>{"\\mathrm{KL}(p\\|q)"}</M> exceed the reverse divergence <M>{"\\mathrm{KL}(q\\|p)"}</M>, in nats? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.123, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Matching distributions needs the teacher&apos;s logits. Often all that is available is the teacher&apos;s generated text, and the
        next lesson asks what training on that alone achieves.
      </p>
    </>
  ),
};
