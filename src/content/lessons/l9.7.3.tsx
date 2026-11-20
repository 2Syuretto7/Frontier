import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ThinkingLengthViz } from "@/components/viz/ThinkingLengthViz";
import type { LessonContent } from "@/lib/types";

const CHECKS = `def success_prob(q, n_checks):
    return 1 - (1 - q) ** (n_checks + 1)

def best_checks(q, cost, n_max):
    return max(range(n_max + 1), key=lambda n: success_prob(q, n) - cost * n)

def format_reward(text):
    if not text.startswith("<think>") or text.count("</think>") != 1:
        return 0.0
    answer = text.split("</think>")[1].strip()
    return 1.0 if answer else 0.0`;

const PROBE = `def pass_at_k_from_p(p, k):
    return 1 - (1 - p) ** k

def count_reflections(text, markers):
    words = text.lower().replace(",", " ").replace(".", " ").split()
    return sum(words.count(m) for m in markers)

def language_consistency(token_langs, target):
    return sum(l == target for l in token_langs) / len(token_langs)`;

export const lesson: LessonContent = {
  id: "l9.7.3",
  minutes: 50,
  links: {
    requires: ["l9.7.2"],
    revisits: ["l9.2.2", "l8.6.3"],
    foreshadows: ["l9.7.4", "l13.4.2"],
  },

  puzzle: (
    <>
      <p>
        DeepSeek-R1-Zero was trained from a base model with GRPO and two rule-based rewards: one for a correct final answer, one
        for putting its reasoning between think tags. No examples of good reasoning were shown. Over thousands of steps its
        responses grew from hundreds of tokens to many thousands, its accuracy on the AIME 2024 competition rose from 15.6% to
        71.0%, and partway through it began to write things like &quot;wait, let me re-check this step&quot;. Where did that behaviour
        come from, if nothing rewarded it directly?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Reward depends only on the final answer, but a final answer reached after checking, backtracking or trying a second
        method is right more often. Policy gradient raises the probability of whatever preceded correct answers, so those
        habits, already present faintly in the base model from text written by people working through problems, become more
        frequent, and responses lengthen. RL does not need to invent reflection; it needs a base model that does it sometimes,
        a verifier that cannot be fooled, and enough samples to find the cases where it helps.
      </p>
      <ThinkingLengthViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the R1-Zero recipe">
        <p>
          A template asks the model to reason inside &lt;think&gt; tags and then answer. The reward is 1 for a correct answer, checked
          by rules, plus a format reward when the response has exactly one closed think block followed by an answer
          (<C>format_reward</C>). No reward model is used, which removes the reward hacking of l9.3.3 at the cost of restricting
          training to checkable tasks.
        </p>
      </Definition>

      <Theorem title="why more checking is rewarded">
        <p>
          Suppose each independent attempt at a problem succeeds with probability q, and the model makes n checks after its first
          attempt, each a fresh attempt. Then the success probability is <M>{"1 - (1-q)^{n+1}"}</M>, increasing in n, and with a cost c
          per check the reward-maximising n is the largest with <M>{"q(1-q)^n \\ge c"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The answer is wrong only if all n + 1 attempts fail, which has probability <M>{"(1-q)^{n+1}"}</M> (<C>success_prob</C>). Going
          from n − 1 to n checks raises success by <M>{"(1-q)^n - (1-q)^{n+1} = q(1-q)^n"}</M>, which decreases in n, so the net reward
          rises while this gain is at least c and falls afterwards (<C>best_checks</C>). Harder problems, with small q, justify more
          checks. Real checks are not independent and can introduce errors, so actual gains are smaller, but the direction is the
          same.
        </p>
        <Code>{CHECKS}</Code>
      </Proof>

      <Definition title="from R1-Zero to R1">
        <p>
          R1-Zero&apos;s reasoning was hard to read and mixed languages. DeepSeek-R1 added four stages: supervised fine-tuning on a few
          thousand curated long reasoning examples as a cold start; reasoning RL with an extra reward for staying in the language
          of the prompt (<C>language_consistency</C>); rejection sampling of about 800,000 responses from that model for a second
          round of fine-tuning, which also covered non-reasoning tasks; and a final RL stage for helpfulness and harmlessness.
          Fine-tuning small dense models on R1&apos;s samples, sequence-level distillation as in l9.2.2, beat running the same RL on
          them directly.
        </p>
      </Definition>

      <Remark title="does RL create or select?">
        <p>
          Gandhi et al. (2025) found that RL improved models whose base already showed verification and backtracking, and did
          little for one that did not until it was first fine-tuned on examples of those behaviours; counting markers such as
          &quot;wait&quot; is a crude proxy (<C>count_reflections</C>). Yue et al. (2025) compared base and RL-trained models by pass@k: RL
          raised pass@1 substantially, but at large k the base model solved as many problems or more (<C>pass_at_k_from_p</C>),
          suggesting RL mostly concentrates probability on reasoning paths the base model could already find. Longer training
          with more diverse problems may change this, and the question remains open.
        </p>
        <Code>{PROBE}</Code>
      </Remark>

      <Example title="selection, not invention">
        <p>
          A base model solves a problem in 1 sample out of 50. An RL model solves it in 30 out of 50. At k = 1 the RL model is far
          better; at k = 256 the base model succeeds with probability about <M>{"1 - 0.98^{256} \\approx 0.99"}</M>, so by that measure
          the knowledge was already there.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "succ",
      rung: "check",
      prompt: (
        <p>
          Each independent attempt solves a problem with probability 0.3. What is the chance of success with three checks after
          the first attempt? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.76, tolerance: 0.001 },
    },
    {
      key: "fmt",
      rung: "check",
      prompt: (
        <p>
          A base model solves a problem with probability 0.01 per sample. What is its pass@300? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.951, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why did RL on verifiable rewards make responses longer, when no reward mentioned length?</p>,
      answer: {
        kind: "choice",
        options: [
          "Behaviours such as re-checking and trying alternatives raise the chance of a correct final answer, so the policy gradient reinforces them, and they take tokens",
          "The format reward paid per token",
          "The KL penalty favours long responses",
          "Longer responses have lower variance in their rewards",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def success_prob(q, n_checks):
    return 1 - (1 - q) ** (n_checks + 1)

def best_checks(q, cost, n_max):
    return max(range(n_max + 1), key=lambda n: success_prob(q, n) - cost * n)

def format_reward(text):
    if not text.startswith("<think>") or text.count("</think>") != 1:
        return 0.0
    answer = text.split("</think>")[1].strip()
    return 1.0 if answer else 0.0

print(success_prob(0.5, 0), success_prob(0.5, 2), best_checks(0.5, 0.2, 10))
print(format_reward("<think>x</think>42"), format_reward("42"), format_reward("<think>x</think>"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.875 1\n1.0 0.0 0.0",
          "0.5 0.75 1\n1.0 0.0 0.0",
          "0.5 0.875 2\n1.0 0.0 0.0",
          "0.5 0.875 1\n1.0 0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pass_at_k_from_p(p, k):
    return 1 - (1 - p) ** k

def count_reflections(text, markers):
    words = text.lower().replace(",", " ").replace(".", " ").split()
    return sum(words.count(m) for m in markers)

def language_consistency(token_langs, target):
    return sum(l == target for l in token_langs) / len(token_langs)

print(round(pass_at_k_from_p(0.5, 3), 3), pass_at_k_from_p(0.0, 100))
print(count_reflections("Wait, no. wait again", ["wait"]), language_consistency(["en", "en", "zh", "en"], "en"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.875 0.0\n2 0.75",
          "0.125 0.0\n2 0.75",
          "0.875 0.0\n1 0.75",
          "0.875 1.0\n2 0.75",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>success_prob(q, n_checks)</C>, <C>best_checks(q, cost, n_max)</C>, returning the smallest best n in 0 to n_max, and{" "}
          <C>format_reward(text)</C>: 1.0 if the text starts with &lt;think&gt;, contains exactly one &lt;/think&gt;, and has a non-blank answer after
          it, else 0.0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def success_prob(q, n_checks):
    return q * (n_checks + 1)

def best_checks(q, cost, n_max):
    return n_max

def format_reward(text):
    return 1.0 if "<think>" in text else 0.0
`,
        solution: CHECKS,
        tests: [
          { name: "succ", code: `assert abs(success_prob(0.2, 1) - 0.36) < 1e-12 and best_checks(0.5, 0.1, 20) == 2 and best_checks(0.9, 0.5, 5) == 0` },
          { name: "fmt", code: `assert format_reward("<think>a</think> 7") == 1.0 and format_reward("<think>a</think>  ") == 0.0 and format_reward("x<think>a</think>7") == 0.0 and format_reward("<think>a</think>b</think>c") == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pass_at_k_from_p(p, k)</C>, <C>count_reflections(text, markers)</C>, counting whole lower-case words after replacing commas and
          full stops by spaces, and <C>language_consistency(token_langs, target)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pass_at_k_from_p(p, k):
    return p * k

def count_reflections(text, markers):
    return 0

def language_consistency(token_langs, target):
    return 1.0
`,
        solution: PROBE,
        tests: [
          { name: "pass", code: `assert abs(pass_at_k_from_p(0.1, 2) - 0.19) < 1e-12 and language_consistency(["a", "b"], "b") == 0.5` },
          { name: "count", code: `assert count_reflections("Hmm. Wait,wait. Actually wait", ["wait", "hmm"]) == 4 and count_reflections("awaiting", ["wait"]) == 0` },
        ],
      },
    },
    {
      key: "opt",
      rung: "stretch",
      prompt: (
        <p>
          Each attempt succeeds with probability 0.3, and every check after the first attempt costs 0.02 reward. How many checks
          maximise expected reward?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Longer reasoning buys accuracy with tokens, and tokens cost time and money at inference. The final lesson of this module
        asks how to spend them well.
      </p>
    </>
  ),
};
