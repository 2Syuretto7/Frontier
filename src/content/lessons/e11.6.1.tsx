import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MixtureLossViz } from "@/components/viz/MixtureLossViz";
import type { LessonContent } from "@/lib/types";

const MIX = `import numpy as np

def sample_stream(weights, n, seed=0):
    names = sorted(weights)
    p = np.array([weights[d] for d in names], dtype=float)
    idx = np.random.default_rng(seed).choice(len(names), size=n, p=p / p.sum())
    return [names[i] for i in idx]                # the domain of each training sequence, in order

def epochs(weights, sizes, budget):
    return {d: budget * w / sizes[d] for d, w in weights.items()}   # passes over each domain's data

def optimal_weights(target, k, alpha):
    raw = {d: (target[d] * k[d]) ** (1 / (1 + alpha)) for d in target}
    s = sum(raw.values())
    return {d: v / s for d, v in raw.items()}     # minimiser under per-domain power laws`;

const EVAL = `from collections import defaultdict

def per_domain_loss(losses, domains):
    acc = defaultdict(list)
    for l, d in zip(losses, domains):
        acc[d].append(l)
    return {d: sum(v) / len(v) for d, v in sorted(acc.items())}

def weighted_loss(per_domain, target):
    return sum(target[d] * per_domain[d] for d in target)   # loss on the distribution we care about

def worst_regression(per_domain, baseline):
    d = max(per_domain, key=lambda d: per_domain[d] - baseline[d])
    return d, per_domain[d] - baseline[d]`;

export const lesson: LessonContent = {
  id: "e11.6.1",
  minutes: 45,
  links: {
    requires: ["e11.1.4", "l8.1.2"],
    revisits: ["e11.2.3", "l8.4.1"],
    foreshadows: ["e11.6.2", "e11.6.3"],
  },

  puzzle: (
    <>
      <p>
        A corpus is 80% web text, 10% code, and the rest books, papers and encyclopaedias. Sampling in proportion to size gives a model
        that writes fluent web prose and weak code. Raising code to 30% helps code and slightly hurts prose. Repeating the
        encyclopaedia four times helps factual questions until, past some point, the model starts to memorise it. How should the
        domain weights be set, and what should they be judged against?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A mixture is a set of weights saying what share of training tokens each domain supplies. More data from a domain lowers the
        loss on that domain with diminishing returns, and the domains compete for a fixed budget. So weights should be judged by the
        loss on the distribution the model will be used for, measured per domain, and limited by how many times each domain&apos;s
        data can be repeated. Under simple scaling assumptions the best weights even have a closed form.
      </p>
      <MixtureLossViz />
    </>
  ),

  theory: (
    <>
      <Definition title="mixtures and epochs">
        <p>
          <C>sample_stream</C> draws the domain of each training sequence independently with probability equal to its weight.{" "}
          <C>epochs</C> gives the passes over each domain&apos;s data for a token budget, <M>{"B w_d / S_d"}</M> for size{" "}
          <M>{"S_d"}</M>; repetition beyond a few epochs brings diminishing returns (l8.1.3). <C>optimal_weights</C> is derived below.
        </p>
        <Code>{MIX}</Code>
      </Definition>

      <Theorem title="how closely a random stream follows the weights">
        <p>
          In a stream of n sequences, the count of domain d has mean <M>{"n w_d"}</M> and standard deviation{" "}
          <M>{"\\sqrt{n w_d (1 - w_d)}"}</M>, so its relative error is about <M>{"\\sqrt{(1 - w_d)/(n w_d)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The count is a sum of n independent indicators with probability <M>{"w_d"}</M>, a binomial variable. Dividing its standard
          deviation by its mean gives the relative error. Over a whole run n is huge and the error negligible, but small domains in a
          short window can deviate noticeably, which is why some loaders interleave domains deterministically.
        </p>
      </Proof>

      <Theorem title="weights under power-law losses">
        <p>
          Suppose the loss on domain d after training on <M>{"w_d B"}</M> of its tokens is{" "}
          <M>{"E_d + k_d (w_d B)^{-\\alpha}"}</M>, and the target weights are <M>{"t_d"}</M>. The target loss{" "}
          <M>{"\\sum_d t_d L_d"}</M> is minimised over weights summing to 1 at <M>{"w_d \\propto (t_d k_d)^{1/(1 + \\alpha)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The objective is a sum of convex functions of the <M>{"w_d"}</M>, so a stationary point of the Lagrangian is the minimum.
          Setting <M>{"\\partial/\\partial w_d"}</M> equal across domains gives{" "}
          <M>{"\\alpha t_d k_d B^{-\\alpha} w_d^{-\\alpha - 1} = \\lambda"}</M>, so <M>{"w_d^{1 + \\alpha} \\propto t_d k_d"}</M>. Domains
          whose loss falls faster with data (larger <M>{"k_d"}</M>) get more than their target share, and the exponent{" "}
          <M>{"1/(1 + \\alpha) < 1"}</M> flattens the weights, as the temperature exponent did for languages (e11.2.3).
        </p>
      </Proof>

      <Definition title="judging a mixture">
        <p>
          <C>per_domain_loss</C> averages held-out losses within each domain, <C>weighted_loss</C> combines them with target weights,
          and <C>worst_regression</C> finds the domain whose loss rose most against a baseline mixture, the check that catches a gain
          on average that hides a loss somewhere.
        </p>
        <Code>{EVAL}</Code>
      </Definition>

      <Remark title="mixtures in practice">
        <p>
          The Pile and GPT-3 set weights by hand, upsampling small high-quality sources for a few epochs. Later work fits per-domain
          scaling laws (l8.4.1) from small runs, the data mixing laws, or learns weights with a proxy model (e11.6.2), and checks the
          result with small ablations (e11.6.3). Real losses interact across domains, since code helps reasoning and multilingual text
          helps other languages, so the closed form is a guide rather than an answer. Targets matter: a model meant for coding and one
          meant for chat should not share a mixture.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The proportional mixture ignored that the code target was large and that code loss falls quickly with more data. Measuring
          per-domain losses on held-out data and weighting them by intended use shows the trade; capping the encyclopaedia&apos;s epochs
          prevents memorisation, and the worst-regression check keeps a code gain from hiding a prose loss.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "epochs",
      rung: "check",
      prompt: (
        <p>
          A run of one trillion tokens gives books a weight of 3%, and the books domain holds 25 billion tokens. How many epochs over the
          books does the run make?
        </p>
      ),
      answer: { kind: "numeric", value: 1.2, tolerance: 0.001 },
    },
    {
      key: "weights",
      rung: "check",
      prompt: (
        <p>
          Two domains have equal target weights, <M>{"k_1 = 4"}</M>, <M>{"k_2 = 1"}</M> and α = 1. What weight does the formula give
          the first domain? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.667, tolerance: 0.001 },
    },
    {
      key: "regress",
      rung: "apply",
      prompt: <p>Why check the worst per-domain regression as well as the weighted average loss?</p>,
      answer: {
        kind: "choice",
        options: [
          "A mixture can lower the average while raising the loss on one domain, which the average hides",
          "The weighted average cannot be computed for small domains",
          "Regression checks replace held-out data",
          "Per-domain losses always move together",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sample_stream(weights, n, seed=0):
    names = sorted(weights)
    p = np.array([weights[d] for d in names], dtype=float)
    idx = np.random.default_rng(seed).choice(len(names), size=n, p=p / p.sum())
    return [names[i] for i in idx]                # the domain of each training sequence, in order

def epochs(weights, sizes, budget):
    return {d: budget * w / sizes[d] for d, w in weights.items()}   # passes over each domain's data

def optimal_weights(target, k, alpha):
    raw = {d: (target[d] * k[d]) ** (1 / (1 + alpha)) for d in target}
    s = sum(raw.values())
    return {d: v / s for d, v in raw.items()}     # minimiser under per-domain power laws

s = sample_stream({"web": 0.9, "code": 0.1}, 1000)
print(len(s), sorted(set(s)), epochs({"books": 0.04}, {"books": 2e10}, 1e12), {d: round(v, 2) for d, v in optimal_weights({"a": 0.5, "b": 0.5}, {"a": 8, "b": 1}, 0.5).items()})`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1000 ['code', 'web'] {'books': 2.0} {'a': 0.8, 'b': 0.2}",
          "1000 ['code', 'web'] {'books': 0.5} {'a': 0.8, 'b': 0.2}",
          "1000 ['code', 'web'] {'books': 2.0} {'a': 0.89, 'b': 0.11}",
          "1000 ['web'] {'books': 2.0} {'a': 0.8, 'b': 0.2}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import defaultdict

def per_domain_loss(losses, domains):
    acc = defaultdict(list)
    for l, d in zip(losses, domains):
        acc[d].append(l)
    return {d: sum(v) / len(v) for d, v in sorted(acc.items())}

def weighted_loss(per_domain, target):
    return sum(target[d] * per_domain[d] for d in target)   # loss on the distribution we care about

def worst_regression(per_domain, baseline):
    d = max(per_domain, key=lambda d: per_domain[d] - baseline[d])
    return d, per_domain[d] - baseline[d]

p = per_domain_loss([2.0, 3.0, 1.0, 1.5], ["web", "web", "code", "code"])
print(p, weighted_loss(p, {"web": 0.8, "code": 0.2}), worst_regression(p, {"web": 2.4, "code": 1.0}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'code': 1.25, 'web': 2.5} 2.25 ('code', 0.25)",
          "{'code': 1.25, 'web': 2.5} 1.875 ('code', 0.25)",
          "{'code': 1.25, 'web': 2.5} 2.25 ('web', 0.1)",
          "{'web': 2.5, 'code': 1.25} 2.25 ('code', 0.25)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_stream(weights, n, seed=0)</C>, choosing among the sorted domain names with{" "}
          <C>np.random.default_rng(seed).choice</C> and normalised probabilities; <C>epochs(weights, sizes, budget)</C>; and{" "}
          <C>optimal_weights(target, k, alpha)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sample_stream(weights, n, seed=0):
    return [max(weights, key=weights.get)] * n

def epochs(weights, sizes, budget):
    return {d: 1.0 for d in weights}

def optimal_weights(target, k, alpha):
    return dict(target)
`,
        solution: MIX,
        tests: [
          { name: "stream", code: `s = sample_stream({"b": 1, "a": 3}, 4000, 1)\nref = np.random.default_rng(1).choice(2, size=4000, p=[0.75, 0.25])\nassert s == [["a", "b"][i] for i in ref] and abs(s.count("a") / 4000 - 0.75) < 0.03\nassert epochs({"x": 0.5}, {"x": 10}, 100) == {"x": 5.0}` },
          { name: "optimal", code: `w = optimal_weights({"p": 0.5, "q": 0.5}, {"p": 9, "q": 1}, 1)\nassert abs(w["p"] - 0.75) < 1e-12 and abs(sum(w.values()) - 1) < 1e-12\nw = optimal_weights({"p": 0.2, "q": 0.8}, {"p": 1, "q": 1}, 0)\nassert abs(w["q"] - 0.8) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>per_domain_loss(losses, domains)</C>, keyed in sorted order; <C>weighted_loss(per_domain, target)</C>; and{" "}
          <C>worst_regression(per_domain, baseline)</C>, returning (domain, increase).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import defaultdict

def per_domain_loss(losses, domains):
    return {}

def weighted_loss(per_domain, target):
    return 0.0

def worst_regression(per_domain, baseline):
    return None, 0.0
`,
        solution: EVAL,
        tests: [
          { name: "losses", code: `p = per_domain_loss([1.0, 2.0, 4.0], ["y", "x", "y"])\nassert p == {"x": 2.0, "y": 2.5} and list(p) == ["x", "y"] and weighted_loss(p, {"x": 0.5, "y": 0.5}) == 2.25` },
          { name: "regress", code: `assert worst_regression({"a": 1.0, "b": 2.0, "c": 3.0}, {"a": 1.5, "b": 1.8, "c": 2.9}) == ("b", 2.0 - 1.8)` },
        ],
      },
    },
    {
      key: "noise",
      rung: "stretch",
      prompt: (
        <p>
          A window of 10,000 sequences is sampled independently with a domain weight of 0.01. What is the relative standard deviation
          of that domain&apos;s count? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0995, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The closed form needs a scaling law for every domain. The next lesson learns mixture weights instead, by training a small
        proxy model to be robust to the worst domain.
      </p>
    </>
  ),
};
