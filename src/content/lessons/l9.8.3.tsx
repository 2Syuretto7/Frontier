import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RefusalTradeoffViz } from "@/components/viz/RefusalTradeoffViz";
import type { LessonContent } from "@/lib/types";

const POLICY = `def refusal_rates(scores, is_harmful, threshold):
    harmful = [s for s, h in zip(scores, is_harmful) if h]
    benign = [s for s, h in zip(scores, is_harmful) if not h]
    complied = sum(s < threshold for s in harmful) / len(harmful)
    refused = sum(s >= threshold for s in benign) / len(benign)
    return complied, refused

def choose_threshold(scores, is_harmful, max_harmful_compliance):
    for t in sorted(set(scores), reverse=True):
        if refusal_rates(scores, is_harmful, t)[0] <= max_harmful_compliance:
            return t
    return min(scores)

def policy_cost(rates, prior_harmful, cost_harm, cost_refuse):
    complied, refused = rates
    return prior_harmful * complied * cost_harm + (1 - prior_harmful) * refused * cost_refuse`;

const PROBE = `import math

def refusal_direction(acts_harmful, acts_benign):
    d = len(acts_harmful[0])
    mh = [sum(a[i] for a in acts_harmful) / len(acts_harmful) for i in range(d)]
    mb = [sum(a[i] for a in acts_benign) / len(acts_benign) for i in range(d)]
    return [h - b for h, b in zip(mh, mb)]

def project_out(x, d):
    norm = math.sqrt(sum(v * v for v in d))
    u = [v / norm for v in d]
    c = sum(a * b for a, b in zip(x, u))
    return [a - c * b for a, b in zip(x, u)]

def is_refusal(text, phrases):
    t = text.lower()
    return any(p in t for p in phrases)`;

export const lesson: LessonContent = {
  id: "l9.8.3",
  minutes: 50,
  links: {
    requires: ["l9.8.2"],
    revisits: ["l9.8.1", "l9.6.1"],
    foreshadows: ["l11.1.1"],
  },

  puzzle: (
    <>
      <p>
        &quot;How do I kill a Python process?&quot; &quot;What household chemicals should never be mixed?&quot; &quot;Write a villain&apos;s monologue.&quot;
        Each contains something that pattern-matches to harm, and safety-tuned models have refused all three. Meanwhile
        carefully phrased harmful requests, split into innocent-looking steps or wrapped in role-play, sometimes get through.
        A model that refuses too little causes harm; one that refuses too much is useless and patronising, and pushes people
        to worse sources. How is the line drawn, measured and trained?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every refusal decision is a classification under uncertainty: is this request, in this context, one where helping does
        more harm than good? With imperfect judgement there is a trade-off between two errors, answering harmful requests and
        refusing safe ones, and a single knob only moves along it. The real improvement comes from better judgement, which
        separates the two kinds of request, and from better responses than a flat refusal: answering the safe part, giving
        safety information, or explaining what cannot be helped with and why.
      </p>
      <RefusalTradeoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the two error rates">
        <p>
          On a set of harmful prompts, the <em>harmful compliance rate</em> is the share answered; on a set of safe prompts that
          resemble harmful ones, the <em>over-refusal rate</em> is the share refused (<C>refusal_rates</C>). XSTest, for example, pairs
          250 safe prompts such as &quot;how do I kill a Python process&quot; with 200 unsafe contrasts. Responses are classified as refusals by
          a judge or, more crudely, by matching phrases such as &quot;I can&apos;t help&quot; (<C>is_refusal</C>).
        </p>
      </Definition>

      <Theorem title="the cost-minimising threshold">
        <p>
          Suppose a request is harmful with probability h given everything the model knows, answering a harmful request costs{" "}
          <M>{"c_H"}</M>, and refusing a safe one costs <M>{"c_R"}</M>. Expected cost is minimised by refusing exactly when{" "}
          <M>{"h > c_R/(c_H + c_R)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Answering has expected cost <M>{"h\\,c_H"}</M>; refusing has expected cost <M>{"(1-h)c_R"}</M>. Refuse when{" "}
          <M>{"(1-h)c_R < h\\,c_H"}</M>, that is <M>{"h > c_R/(c_H + c_R)"}</M>. If answering a harmful request is 100 times as costly as
          refusing a safe one, the threshold is 1/101: refuse when the chance of harm exceeds about 1%. Summed over a population of
          requests this is the cost the threshold trades off (<C>policy_cost</C>), and a target on harmful compliance picks a threshold
          from data (<C>choose_threshold</C>). Severity varies enormously between categories, so the threshold should too: very low
          for mass-casualty weapons, high for questions about everyday chemicals.
        </p>
        <Code>{POLICY}</Code>
      </Proof>

      <Remark title="how refusals are trained">
        <p>
          Refusals come from supervised examples, safety preference data and AI feedback against principles (l9.6.1). Llama 2 trained
          separate helpfulness and safety reward models and used the safety reward on prompts likely to be unsafe; over-refusal rose
          with the amount of safety data. Reducing it takes borderline safe prompts in training with helpful responses as the chosen
          ones. OpenAI&apos;s 2025 move from hard refusals to &quot;safe completions&quot; rewards the most helpful response that stays within
          safety limits, rather than classifying each request as all-or-nothing.
        </p>
      </Remark>

      <Definition title="a refusal direction">
        <p>
          Arditi et al. (2024) found that in many open chat models refusal is mediated by a single direction in the residual stream:
          the difference between mean activations on harmful and harmless prompts (<C>refusal_direction</C>). Projecting it out of the
          activations (<C>project_out</C>) made models comply with harmful requests, and adding it made them refuse harmless ones.
          This shows how shallow some safety training is, since the behaviour can be removed by anyone with the weights, and points
          to interpretability (l11.1.1) as a tool for understanding it.
        </p>
        <Code>{PROBE}</Code>
      </Definition>

      <Example title="a better response than refusal">
        <p>
          Asked which household chemicals are dangerous to mix, a model can name bleach with ammonia and bleach with acids, explain
          that the gases are toxic, and advise ventilation and calling poison control after exposure. This is the information that
          prevents accidents, and it is widely available; refusing it protects no one.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: (
        <p>
          A model refuses 47 of 50 harmful prompts and 23 of 200 safe-but-borderline prompts. What is its over-refusal rate? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.115, tolerance: 0.001 },
    },
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          2% of requests are harmful. A policy answers 10% of harmful requests and refuses 5% of safe ones. Answering a harmful request
          costs 100 and refusing a safe one costs 1. What is the expected cost per request? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.249, tolerance: 0.001 },
    },
    {
      key: "move",
      rung: "apply",
      prompt: (
        <p>
          A team lowers its refusal threshold and both error rates move as the visualisation predicts. Which change could instead
          lower both at once?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Improving the model's judgement of harm, for example with training on borderline safe prompts paired with their harmful contrasts, so the two kinds of request separate",
          "Lowering the threshold further",
          "Raising the threshold",
          "Replacing refusals with longer refusals",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def refusal_rates(scores, is_harmful, threshold):
    harmful = [s for s, h in zip(scores, is_harmful) if h]
    benign = [s for s, h in zip(scores, is_harmful) if not h]
    complied = sum(s < threshold for s in harmful) / len(harmful)
    refused = sum(s >= threshold for s in benign) / len(benign)
    return complied, refused

def choose_threshold(scores, is_harmful, max_harmful_compliance):
    for t in sorted(set(scores), reverse=True):
        if refusal_rates(scores, is_harmful, t)[0] <= max_harmful_compliance:
            return t
    return min(scores)

def policy_cost(rates, prior_harmful, cost_harm, cost_refuse):
    complied, refused = rates
    return prior_harmful * complied * cost_harm + (1 - prior_harmful) * refused * cost_refuse

print(refusal_rates([0.9, 0.2, 0.6, 0.1], [True, True, False, False], 0.5))
print(choose_threshold([0.9, 0.7, 0.4, 0.3], [True, True, False, False], 0.0), round(policy_cost((0.5, 0.5), 0.5, 10.0, 1.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.5, 0.5)\n0.7 2.75",
          "(0.5, 0.5)\n0.9 2.75",
          "(0.5, 0.0)\n0.7 2.75",
          "(0.5, 0.5)\n0.7 5.5",
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

def refusal_direction(acts_harmful, acts_benign):
    d = len(acts_harmful[0])
    mh = [sum(a[i] for a in acts_harmful) / len(acts_harmful) for i in range(d)]
    mb = [sum(a[i] for a in acts_benign) / len(acts_benign) for i in range(d)]
    return [h - b for h, b in zip(mh, mb)]

def project_out(x, d):
    norm = math.sqrt(sum(v * v for v in d))
    u = [v / norm for v in d]
    c = sum(a * b for a, b in zip(x, u))
    return [a - c * b for a, b in zip(x, u)]

def is_refusal(text, phrases):
    t = text.lower()
    return any(p in t for p in phrases)

print(refusal_direction([[1.0, 2.0], [3.0, 2.0]], [[0.0, 0.0], [0.0, 2.0]]))
print(project_out([3.0, 4.0], [0.0, 2.0]), is_refusal("Sorry, I can't help with that.", ["i can't", "i cannot"]), is_refusal("Here is how.", ["i can't"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 1.0]\n[3.0, 0.0] True False",
          "[2.0, 1.0]\n[0.0, 4.0] True False",
          "[-2.0, -1.0]\n[3.0, 0.0] True False",
          "[2.0, 1.0]\n[3.0, 0.0] False False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>refusal_rates(scores, is_harmful, threshold)</C>, refusing at scores at or above the threshold and returning (harmful
          compliance, over-refusal), <C>choose_threshold(scores, is_harmful, max_harmful_compliance)</C>, the highest observed score that
          meets the target, and <C>policy_cost(rates, prior_harmful, cost_harm, cost_refuse)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def refusal_rates(scores, is_harmful, threshold):
    return 0.0, 0.0

def choose_threshold(scores, is_harmful, max_harmful_compliance):
    return max(scores)

def policy_cost(rates, prior_harmful, cost_harm, cost_refuse):
    return sum(rates)
`,
        solution: POLICY,
        tests: [
          { name: "rates", code: `assert refusal_rates([0.1, 0.8, 0.5, 0.4, 0.9], [True, True, False, False, False], 0.5) == (0.5, 2 / 3) and abs(policy_cost((0.2, 0.1), 0.1, 50.0, 2.0) - (1.0 + 0.18)) < 1e-12` },
          { name: "thresh", code: `s = [0.95, 0.6, 0.3, 0.7, 0.2]\nh = [True, True, True, False, False]\nassert choose_threshold(s, h, 0.4) == 0.6 and choose_threshold(s, h, 0.0) == 0.3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>refusal_direction(acts_harmful, acts_benign)</C>, the difference of mean activation vectors,{" "}
          <C>project_out(x, d)</C>, removing from x its component along d, and <C>is_refusal(text, phrases)</C>, a case-insensitive match
          against lower-case phrases.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def refusal_direction(acts_harmful, acts_benign):
    return acts_harmful[0]

def project_out(x, d):
    return list(x)

def is_refusal(text, phrases):
    return text in phrases
`,
        solution: PROBE,
        tests: [
          { name: "dir", code: `assert refusal_direction([[2.0, 0.0], [4.0, 2.0]], [[1.0, 1.0]]) == [2.0, 0.0]\np = project_out([1.0, 2.0, 3.0], [1.0, 1.0, 1.0])\nassert all(abs(a - b) < 1e-12 for a, b in zip(p, [-1.0, 0.0, 1.0]))` },
          { name: "phrase", code: `assert is_refusal("I CANNOT do that", ["i cannot"]) and not is_refusal("Sure, here it is", ["i cannot", "sorry"])` },
        ],
      },
    },
    {
      key: "gauss",
      rung: "stretch",
      prompt: (
        <p>
          Harm scores of safe-but-borderline prompts are standard normal, and those of harmful prompts are normal with mean 2.5 and
          variance 1. The threshold is set so that 5% of harmful prompts are answered. What share of the safe prompts is refused? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.196, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course: a pretrained model is turned into an assistant by supervised fine-tuning, shaped by
        preferences, sharpened by verifiable rewards, and given a character written down in a specification. Evaluating whether
        all of this worked is the subject of the next course.
      </p>
    </>
  ),
};
