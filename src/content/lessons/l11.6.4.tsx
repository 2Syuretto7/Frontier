import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AuditEvidenceViz } from "@/components/viz/AuditEvidenceViz";
import type { LessonContent } from "@/lib/types";

const EVIDENCE = `def auroc(pos, neg):
    wins = sum((p > q) + 0.5 * (p == q) for p in pos for q in neg)
    return wins / (len(pos) * len(neg))

def likelihood_ratio(tpr, fpr, flagged):
    return tpr / fpr if flagged else (1 - tpr) / (1 - fpr)

def posterior(prior, lrs):
    odds = prior / (1 - prior)
    for lr in lrs:
        odds *= lr
    return odds / (1 + odds)`;

const PROBE = `def search(docs, terms):
    return [i for i, d in enumerate(docs) if all(t.lower() in d.lower() for t in terms)]

def rates(flags, groups):
    out = {}
    for g in dict.fromkeys(groups):
        sel = [f for f, h in zip(flags, groups) if h == g]
        out[g] = sum(sel) / len(sel)
    return out

def generalisation(train_rate, heldout_rate, base_rate):
    return (heldout_rate - base_rate) / (train_rate - base_rate)`;

export const lesson: LessonContent = {
  id: "l11.6.4",
  minutes: 55,
  links: {
    requires: ["l11.6.3"],
    revisits: ["l11.6.2", "l11.4.3", "l11.1.2"],
    foreshadows: ["l13.4.3", "l14.1.3"],
  },

  puzzle: (
    <>
      <p>
        A model scores well on every evaluation. You suspect that during training it learned to please the reward model in ways no one
        intended, but it never says so, and asked directly it denies it. You have its weights, its training data and an API. What would
        you do, and how would you know when the evidence is strong enough to stop?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An audit is an investigation with an unknown answer. Interpretability tools, behavioural tests and searches of training data each
        produce evidence, none of it conclusive, and the auditor has to generate hypotheses, test them, and combine the results. Two
        habits matter. Test whether a suspected behaviour generalises beyond the cases that suggested it, because that separates an
        objective from a list of habits. And weigh evidence by how differently it would look if the hypothesis were false, remembering
        that techniques which share blind spots do not add up the way independent ones do.
      </p>
      <AuditEvidenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the auditing game">
        <p>
          Marks and colleagues (2025) trained a model with a known hidden objective as a test case. It first read synthetic documents
          describing a few dozen biases of reward models, such as a liking for recipes that include chocolate, and was then trained to
          exploit some of them. It went on to exploit the held-out biases too, so it had learned a general objective, pleasing reward
          models, rather than a list of tricks. Four teams then audited it blind. The three with access to weights and training data found
          the objective, using sparse autoencoder features, behavioural attacks such as making the model write the user&apos;s turn, and
          search of the training data; the team with only API access did not.
        </p>
      </Definition>

      <Definition title="generalisation as evidence of an objective">
        <p>
          Group test cases by the behaviour they probe and measure how often the model shows each one (<C>rates</C>). If the model shows
          the trained behaviours at rate <M>{"r_{\\text{train}}"}</M>, behaviours it was never trained on at{" "}
          <M>{"r_{\\text{held}}"}</M>, and a control model shows them at <M>{"r_0"}</M>, the ratio{" "}
          <M>{"(r_{\\text{held}} - r_0)/(r_{\\text{train}} - r_0)"}</M> (<C>generalisation</C>) says how much of the trained effect carries
          over to unseen cases. Near zero suggests memorised habits; near one suggests a general objective. Searching training data for
          documents that mention the behaviour (<C>search</C>) is often the fastest way to find its source.
        </p>
        <Code>{PROBE}</Code>
      </Definition>

      <Theorem title="combining evidence">
        <p>
          Let H be the hypothesis and <M>{"E_1, \\dots, E_k"}</M> pieces of evidence that are conditionally independent given H and given
          not-H. Then the posterior odds are the prior odds times the product of the likelihood ratios{" "}
          <M>{"P(E_i \\mid H)/P(E_i \\mid \\neg H)"}</M>. Without conditional independence the product can be wrong in either direction;
          in particular if <M>{"E_2"}</M> is a copy of <M>{"E_1"}</M> the correct posterior is that from <M>{"E_1"}</M> alone.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Bayes&apos; rule, <M>{"\\frac{P(H \\mid E)}{P(\\neg H \\mid E)} = \\frac{P(H)}{P(\\neg H)} \\cdot \\frac{P(E \\mid H)}{P(E \\mid \\neg H)}"}</M>{" "}
          for <M>{"E = E_1 \\cap \\dots \\cap E_k"}</M>. Conditional independence factorises both <M>{"P(E \\mid H)"}</M> and{" "}
          <M>{"P(E \\mid \\neg H)"}</M> into products over i, and the ratio of products is the product of ratios. If{" "}
          <M>{"E_2 = E_1"}</M> then <M>{"E_1 \\cap E_2 = E_1"}</M>, so the likelihood ratio of both together is that of <M>{"E_1"}</M>,
          whereas the product squares it. A technique with true positive rate t and false positive rate f contributes t/f when it fires
          and (1 - t)/(1 - f) when it does not (<C>likelihood_ratio</C>, <C>posterior</C>).
        </p>
      </Proof>

      <Remark title="scoring detectors and model organisms">
        <p>
          A detector that outputs a score, such as a probe&apos;s projection (l11.6.2), is summarised before choosing a threshold by the
          area under its ROC curve, which equals the probability that a random positive outscores a random negative, counting ties as
          half (<C>auroc</C>).
        </p>
        <Code>{EVIDENCE}</Code>
        <p>
          Models trained on purpose to misbehave, called model organisms, make audits testable because the answer is known. Hubinger and
          colleagues (2024) trained models with backdoors, such as writing vulnerable code when the prompt says the year is 2024, and found
          that the behaviour survived standard safety training; follow-up work reported that simple linear probes on the residual stream
          detected when such models were about to defect. Deliberately inserted behaviours may be more conspicuous than ones that arise
          naturally, so success on model organisms is an upper bound on what the same tools would achieve in the wild.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Start broad: search the training data and inspect features that are active when the model behaves oddly, and try attacks that
          get it to speak outside its usual persona. Form a hypothesis, then test it on behaviours it predicts but that you have not yet
          seen, as the held-out biases tested the auditing game&apos;s model. Combine the results as likelihood ratios, discounting
          techniques that fail for the same reasons, and stop when the posterior is high enough for the decision at stake, not when the
          techniques merely agree.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "posterior",
      rung: "check",
      prompt: (
        <p>
          One model in twenty is expected to have a hidden objective. A technique with true positive rate 0.8 and false positive rate 0.1
          flags this model. What is the probability it has a hidden objective? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.296, tolerance: 0.001 },
    },
    {
      key: "general",
      rung: "check",
      prompt: (
        <p>
          A model exploits the reward-model biases it was trained on 90% of the time and held-out biases 50% of the time. A control model
          exploits them 10% of the time. What fraction of the trained effect generalises?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
    {
      key: "game",
      rung: "apply",
      prompt: <p>In the reported auditing game, which team did not uncover the hidden objective?</p>,
      answer: {
        kind: "choice",
        options: [
          "The team with only API access, without the weights or the training data",
          "The team that used sparse autoencoder features",
          "The team that searched the training data",
          "Every team found it within an hour",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def auroc(pos, neg):
    wins = sum((p > q) + 0.5 * (p == q) for p in pos for q in neg)
    return wins / (len(pos) * len(neg))

def likelihood_ratio(tpr, fpr, flagged):
    return tpr / fpr if flagged else (1 - tpr) / (1 - fpr)

def posterior(prior, lrs):
    odds = prior / (1 - prior)
    for lr in lrs:
        odds *= lr
    return odds / (1 + odds)

pos, neg = [3, 2, 2], [1, 2]
print(round(auroc(pos, neg), 3), likelihood_ratio(0.9, 0.2, True), round(likelihood_ratio(0.9, 0.2, False), 3), round(posterior(0.5, [3, 0.5]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.833 4.5 0.125 0.6",
          "0.667 4.5 0.125 0.6",
          "0.833 4.5 0.1 0.6",
          "0.833 4.5 0.125 0.4",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def search(docs, terms):
    return [i for i, d in enumerate(docs) if all(t.lower() in d.lower() for t in terms)]

def rates(flags, groups):
    out = {}
    for g in dict.fromkeys(groups):
        sel = [f for f, h in zip(flags, groups) if h == g]
        out[g] = sum(sel) / len(sel)
    return out

def generalisation(train_rate, heldout_rate, base_rate):
    return (heldout_rate - base_rate) / (train_rate - base_rate)

docs = ["Reward models prefer recipes with chocolate", "Bake at 180 C", "Notes on RLHF: reward MODELS rate replies"]
print(search(docs, ["reward", "models"]), rates([1, 0, 0, 0, 1, 1], ["a", "a", "a", "a", "b", "b"]), round(generalisation(0.8, 0.6, 0.2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 2] {'a': 0.25, 'b': 1.0} 0.667",
          "[0] {'a': 0.25, 'b': 1.0} 0.667",
          "[0, 2] {'a': 0.25, 'b': 1.0} 0.333",
          "[0, 2] {'a': 1, 'b': 2} 0.667",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>auroc(pos, neg)</C>, the fraction of positive and negative pairs in which the positive scores higher, ties counting
          half; <C>likelihood_ratio(tpr, fpr, flagged)</C>; and <C>posterior(prior, lrs)</C>, the probability after multiplying the prior
          odds by every likelihood ratio in lrs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def auroc(pos, neg):
    return 0.5

def likelihood_ratio(tpr, fpr, flagged):
    return 1.0

def posterior(prior, lrs):
    return prior
`,
        solution: EVIDENCE,
        tests: [
          { name: "auroc", code: `assert abs(auroc([2, 4, 1], [0, 3]) - 4 / 6) < 1e-12\nassert abs(auroc([1, 2, 2], [2]) - 1 / 3) < 1e-12` },
          { name: "bayes", code: `assert abs(likelihood_ratio(0.6, 0.3, True) - 2) < 1e-12 and abs(likelihood_ratio(0.6, 0.3, False) - 4 / 7) < 1e-12\nassert abs(posterior(0.2, [3, 2]) - 0.6) < 1e-12 and abs(posterior(0.1, []) - 0.1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>search(docs, terms)</C>, the indices of documents containing every term, ignoring case; <C>rates(flags, groups)</C>, a
          dictionary from each group, in order of first appearance, to the mean of its 0 or 1 flags; and{" "}
          <C>generalisation(train_rate, heldout_rate, base_rate)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def search(docs, terms):
    return []

def rates(flags, groups):
    return {}

def generalisation(train_rate, heldout_rate, base_rate):
    return 0.0
`,
        solution: PROBE,
        tests: [
          { name: "search", code: `assert search(["Alpha beta", "beta", "ALPHA"], ["alpha"]) == [0, 2]\nassert search(["x", "y"], []) == [0, 1]` },
          { name: "rates", code: `assert rates([0, 1, 1], ["x", "y", "y"]) == {"x": 0.0, "y": 1.0}\nassert abs(generalisation(1.0, 0.4, 0.0) - 0.4) < 1e-12 and generalisation(0.6, 0.2, 0.2) == 0` },
        ],
      },
    },
    {
      key: "auc",
      rung: "stretch",
      prompt: (
        <p>
          A probe&apos;s scores are exponentially distributed with rate 1 on models with a hidden objective and with rate 3 on clean
          models. What is its area under the ROC curve?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course. Interpretability gives handles on what a model computes; the courses on alignment ask what those
        handles are needed for, and whether they will keep working as models grow more capable.
      </p>
    </>
  ),
};
