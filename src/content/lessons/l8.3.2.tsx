import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LoadBalanceViz } from "@/components/viz/LoadBalanceViz";
import type { LessonContent } from "@/lib/types";

const AUX = `import math

def dispatch_fractions(choices, n):
    counts = [0] * n
    for c in choices:
        for i in c:
            counts[i] += 1
    total = sum(counts)
    return [x / total for x in counts]

def aux_loss(f, P):
    return len(f) * sum(fi * pi for fi, pi in zip(f, P))

def router_z_loss(logit_rows):
    lse = [max(z) + math.log(sum(math.exp(v - max(z)) for v in z)) for z in logit_rows]
    return sum(v * v for v in lse) / len(lse)`;

const BIAS = `def biased_topk(scores, bias, k):
    adj = [s + b for s, b in zip(scores, bias)]
    return sorted(range(len(scores)), key=lambda i: -adj[i])[:k]

def update_bias(bias, counts, gamma):
    mean = sum(counts) / len(counts)
    return [b + gamma if c < mean else b - gamma if c > mean else b for b, c in zip(bias, counts)]

def balance_run(batches, k, gamma):
    n = len(batches[0][0])
    bias = [0.0] * n
    for batch in batches:
        counts = [0] * n
        for scores in batch:
            for i in biased_topk(scores, bias, k):
                counts[i] += 1
        bias = update_bias(bias, counts, gamma)
    return bias, counts`;

export const lesson: LessonContent = {
  id: "l8.3.2",
  minutes: 50,
  links: {
    requires: ["l8.3.1", "m14.6.3"],
    revisits: ["m6.2.1", "m12.1.2"],
    foreshadows: ["l8.3.3", "e10.6.1"],
  },

  puzzle: (
    <>
      <p>
        Early in training a router has no reason to prefer one expert over another, so small random differences decide. An
        expert that wins a few more tokens gets more gradient, becomes better, and wins more tokens. Left alone, routing
        collapses onto a handful of experts and the rest of the parameters are wasted, while the devices holding the
        favourites become the bottleneck. How do you push the load towards balance without fighting the language-modelling
        loss?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The classic fix adds a penalty that is smallest when every expert gets the same share, so the router is pulled
        towards balance by gradient. The pull is a second objective, and its gradient competes with the one the model is
        actually trained for. The newer fix leaves the loss alone: it keeps a per-expert offset that is added to the scores
        only when choosing experts, nudged up for idle experts and down for busy ones. Selection is balanced, and the gates,
        which carry the gradient, are untouched.
      </p>
      <LoadBalanceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the auxiliary balance loss">
        <p>
          Over a batch, let <M>{"f_i"}</M> be the fraction of routing slots assigned to expert i (<C>dispatch_fractions</C>) and{" "}
          <M>{"P_i"}</M> the mean router probability for expert i. The Switch Transformer adds
        </p>
        <MD>{"\\mathcal{L}_{\\mathrm{aux}} = \\alpha\\, n \\sum_{i=1}^n f_i P_i"}</MD>
        <p>
          with α around 0.01 (<C>aux_loss</C>, without the α). The counts <M>{"f_i"}</M> are not differentiable, but <M>{"P_i"}</M> is, so the
          gradient lowers the probabilities of experts in proportion to how overloaded they are. ST-MoE adds a router z-loss,
          the mean squared log-sum-exp of the router logits (<C>router_z_loss</C>), to keep the logits small and the softmax well
          conditioned, as z-loss does for the output layer.
        </p>
        <Code>{AUX}</Code>
      </Definition>

      <Theorem title="balance minimises the loss">
        <p>
          When the dispatch fractions match the probabilities, <M>{"f = P"}</M>, the loss without α is <M>{"n\\sum_i P_i^2 \\ge 1"}</M>, with equality
          exactly when <M>{"P_i = 1/n"}</M> for every i. Collapse onto one expert gives n.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Cauchy–Schwarz, <M>{"1 = \\big(\\sum_i 1 \\cdot P_i\\big)^2 \\le n \\sum_i P_i^2"}</M>, with equality iff P is proportional to the all-ones
          vector. If all mass is on one expert, <M>{"n \\sum_i P_i^2 = n"}</M>.
        </p>
      </Proof>

      <Definition title="auxiliary-loss-free balancing">
        <p>
          Keep a bias <M>{"b_i"}</M> per expert. Choose experts by the top k of <M>{"s_i + b_i"}</M> (<C>biased_topk</C>), but compute the gates from{" "}
          <M>{"s_i"}</M> alone. After each batch, raise <M>{"b_i"}</M> by γ if expert i was below the mean load and lower it by γ if above
          (<C>update_bias</C>, <C>balance_run</C>). The bias is updated by a rule, not by gradient, so it adds no term to the loss. DeepSeek-V3
          used this with γ = 0.001 for most of training, plus a sequence-level balance loss with a tiny weight to avoid extreme
          imbalance within single sequences.
        </p>
        <Code>{BIAS}</Code>
      </Definition>

      <Remark title="balance against specialisation">
        <p>
          Perfect balance is not the goal in itself: some kinds of token are rarer than others, and an expert that specialises
          in them should see fewer tokens. A strong auxiliary loss forces near-uniform routing and, in Wang and colleagues&apos;
          experiments, cost perplexity; the bias method reached better balance and lower loss together. What must be balanced is
          the load per device, since the slowest device sets the step time, so balance is measured per batch and per device, not
          only on average.
        </p>
      </Remark>

      <Example title="why the bias can oscillate">
        <p>
          With a sign rule and a large γ, an expert that is over-favoured by a margin smaller than γ flips from overloaded to
          underloaded in one step, then back. In the code, two experts with fixed scores 0.9 and 0.1 and γ = 0.5 alternate every
          batch. A small γ moves slowly but settles; real systems pick γ small relative to the spread of scores.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "aux",
      rung: "check",
      prompt: <p>Four experts have dispatch fractions (0.4, 0.3, 0.2, 0.1) and mean probabilities (0.35, 0.3, 0.2, 0.15). What is n Σ f_i P_i? Give two decimals.</p>,
      answer: { kind: "numeric", value: 1.14, tolerance: 0.001 },
    },
    {
      key: "z",
      rung: "check",
      prompt: <p>A batch has two tokens with router logits (0, 0) and (1, 1). What is the router z-loss, the mean squared log-sum-exp? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.6736, tolerance: 0.0002 },
    },
    {
      key: "gates",
      rung: "apply",
      prompt: <p>Why does auxiliary-loss-free balancing add the bias only when selecting experts and not when computing gates?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that balancing changes which experts run without changing how their outputs are weighted, leaving the gradient of the language-modelling loss untouched",
          "Because gates must sum to one and the bias would break that",
          "Because the bias is too small to matter in the gates",
          "So that the bias can be trained by gradient descent through the gates",
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

def dispatch_fractions(choices, n):
    counts = [0] * n
    for c in choices:
        for i in c:
            counts[i] += 1
    total = sum(counts)
    return [x / total for x in counts]

def aux_loss(f, P):
    return len(f) * sum(fi * pi for fi, pi in zip(f, P))

def router_z_loss(logit_rows):
    lse = [max(z) + math.log(sum(math.exp(v - max(z)) for v in z)) for z in logit_rows]
    return sum(v * v for v in lse) / len(lse)

print(dispatch_fractions([[0], [0], [1], [0, 1]], 3), aux_loss([0.25] * 4, [0.25] * 4))
print(aux_loss([1.0, 0.0], [0.9, 0.1]), round(router_z_loss([[0.0, 0.0, 0.0, 0.0]]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.6, 0.4, 0.0] 1.0\n1.8 1.9218",
          "[0.75, 0.5, 0.0] 1.0\n1.8 1.9218",
          "[0.6, 0.4, 0.0] 0.25\n1.8 1.9218",
          "[0.6, 0.4, 0.0] 1.0\n0.9 1.3863",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def biased_topk(scores, bias, k):
    adj = [s + b for s, b in zip(scores, bias)]
    return sorted(range(len(scores)), key=lambda i: -adj[i])[:k]

def update_bias(bias, counts, gamma):
    mean = sum(counts) / len(counts)
    return [b + gamma if c < mean else b - gamma if c > mean else b for b, c in zip(bias, counts)]

def balance_run(batches, k, gamma):
    n = len(batches[0][0])
    bias = [0.0] * n
    for batch in batches:
        counts = [0] * n
        for scores in batch:
            for i in biased_topk(scores, bias, k):
                counts[i] += 1
        bias = update_bias(bias, counts, gamma)
    return bias, counts

print(biased_topk([0.9, 0.5, 0.4], [0.0, 0.0, 0.2], 1), update_bias([0.0, 0.0, 0.0], [5, 1, 3], 0.1))
batch = [[0.9, 0.1]] * 4; print(balance_run([batch] * 3, 1, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0] [-0.1, 0.1, 0.0]\n([-0.5, 0.5], [4, 0])",
          "[2] [-0.1, 0.1, 0.0]\n([-0.5, 0.5], [4, 0])",
          "[0] [-0.1, 0.1, -0.1]\n([-0.5, 0.5], [4, 0])",
          "[0] [-0.1, 0.1, 0.0]\n([0.0, 0.0], [0, 4])",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dispatch_fractions(choices, n)</C>, where each entry of <C>choices</C> lists the experts one token was sent to,{" "}
          <C>aux_loss(f, P)</C>, the loss without α, and <C>router_z_loss(logit_rows)</C>, computed stably.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def dispatch_fractions(choices, n):
    return [1 / n] * n

def aux_loss(f, P):
    return sum(fi * pi for fi, pi in zip(f, P))

def router_z_loss(logit_rows):
    return sum(math.log(sum(math.exp(v) for v in z)) for z in logit_rows) / len(logit_rows)
`,
        solution: AUX,
        tests: [
          { name: "fractions", code: `assert dispatch_fractions([[2, 1], [1, 0]], 4) == [0.25, 0.5, 0.25, 0.0] and abs(aux_loss([0.5, 0.5], [0.9, 0.1]) - 1.0) < 1e-12` },
          { name: "z", code: `assert abs(router_z_loss([[0.0, 0.0, 0.0], [2.0, 2.0, 2.0]]) - (math.log(3) ** 2 + (2 + math.log(3)) ** 2) / 2) < 1e-12 and abs(router_z_loss([[1000.0, 1000.0]]) - (1000 + math.log(2)) ** 2) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>biased_topk(scores, bias, k)</C>, <C>update_bias(bias, counts, gamma)</C> with the sign rule, leaving an expert exactly at the
          mean unchanged, and <C>balance_run(batches, k, gamma)</C>, returning the final biases and the counts of the last batch.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def biased_topk(scores, bias, k):
    return sorted(range(len(scores)), key=lambda i: -scores[i])[:k]

def update_bias(bias, counts, gamma):
    return bias

def balance_run(batches, k, gamma):
    return [0.0] * len(batches[0][0]), [0] * len(batches[0][0])
`,
        solution: BIAS,
        tests: [
          { name: "select", code: `assert biased_topk([0.9, 0.5, 0.4], [0.0, 0.0, 0.6], 2) == [2, 0] and update_bias([0.0, 0.0, 0.0], [5, 1, 3], 0.1) == [-0.1, 0.1, 0.0]` },
          { name: "run", code: `bias, counts = balance_run([[[0.9, 0.1, 0.3]] * 6] * 4, 1, 0.25)\nassert bias == [0.0, 0.5, 0.5] and counts == [0, 6, 0]` },
        ],
      },
    },
    {
      key: "skew",
      rung: "stretch",
      prompt: (
        <p>
          Eight experts have f = P, with one expert at 0.5 and the other seven sharing the rest equally. What is n Σ f_i P_i?
          Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.2857, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Even with balanced averages, a single batch can send more tokens to an expert than its buffer holds. The next lesson
        is about that hard limit, expert capacity, and what happens to the tokens that do not fit.
      </p>
    </>
  ),
};
