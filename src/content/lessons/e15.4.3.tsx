import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GroupSignalViz } from "@/components/viz/GroupSignalViz";
import type { LessonContent } from "@/lib/types";

const VERIFY = `import re

def extract_answer(text):
    m = re.findall(r"-?\\d+(?:\\.\\d+)?", text.split("####")[-1])
    return m[-1] if m else None                            # the last number after the final marker

def reward(text, gold):
    a = extract_answer(text)
    return 1.0 if a is not None and float(a) == float(gold) else 0.0

def group_advantages(rewards):
    mu = sum(rewards) / len(rewards)
    sd = (sum((r - mu) ** 2 for r in rewards) / len(rewards)) ** 0.5
    return [0.0] * len(rewards) if sd == 0 else [(r - mu) / sd for r in rewards]`;

const GRPO = `from math import comb

def clipped_term(ratio, adv, eps):
    clipped = min(max(ratio, 1 - eps), 1 + eps)
    return min(ratio * adv, clipped * adv)                 # pessimistic: no gain from moving too far

def pass_at_k(n, c, k):
    return 1.0 if n - c < k else 1 - comb(n - c, k) / comb(n, k)

def mixed_groups(groups):
    return sum(len(set(g)) > 1 for g in groups) / len(groups)   # only these give a gradient`;

export const lesson: LessonContent = {
  id: "e15.4.3",
  minutes: 50,
  links: {
    requires: ["e15.4.2"],
    revisits: ["l9.7.1", "l9.7.2", "l9.4.1", "e12.6.1", "l9.7.4"],
    foreshadows: ["e15.5.1"],
  },

  puzzle: (
    <>
      <p>
        On grade-school arithmetic word problems, the capstone model gets about one in five right. A judge can say which
        of two solutions reads better, but here there is a stronger signal: the final number is either correct or not.
        Rewarding the model only for correct final answers, and letting it find its own way to them, has turned much larger
        models into strong reasoners. What does that loop look like at this scale, and which prompts are worth training on?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For each problem, sample a group of solutions from the current model, check each final answer against the known
        one, and give each a reward of 1 or 0. Compare each solution with its own group: those that beat the group
        average are reinforced, those below are discouraged. This group-relative advantage, from GRPO, needs no value
        network. It also means a problem the model always solves, or never solves, teaches nothing, so the problem set
        should sit at the edge of the model&apos;s ability.
      </p>
      <GroupSignalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the verifier">
        <p>
          Solutions end with a marked final answer. The verifier takes the last number after the final marker{" "}
          (<C>extract_answer</C>) and compares it numerically with the reference (<C>reward</C>), as in l9.7.1. Exact
          matching is strict on purpose: partial credit for nearly right answers invites the model to exploit the rubric.
        </p>
      </Definition>

      <Definition title="group-relative advantages">
        <p>
          For G samples of one prompt with rewards <M>{"r_1, \\dots, r_G"}</M>, the advantage of sample i is{" "}
          <M>{"(r_i - \\bar r)/s"}</M>, with <M>{"\\bar r"}</M> and s the group&apos;s mean and standard deviation, and
          zero for every sample when s = 0 (<C>group_advantages</C>), as in l9.7.2. Every token of sample i shares its
          advantage.
        </p>
        <Code>{VERIFY}</Code>
      </Definition>

      <Theorem title="advantages for right and wrong answers">
        <p>
          If a fraction q of a group with binary rewards is correct, with 0 &lt; q &lt; 1, the correct samples get
          advantage <M>{"\\sqrt{(1-q)/q}"}</M> and the incorrect ones <M>{"-\\sqrt{q/(1-q)}"}</M>. The advantages sum to
          zero, and a rare success is reinforced strongly while a rare failure is penalised strongly.
        </p>
      </Theorem>
      <Proof>
        <p>
          The mean reward is q and the variance <M>{"q(1-q)^2 + (1-q)q^2 = q(1-q)"}</M>, so{" "}
          <M>{"s = \\sqrt{q(1-q)}"}</M>. A correct sample has <M>{"(1 - q)/\\sqrt{q(1-q)} = \\sqrt{(1-q)/q}"}</M>, and an
          incorrect one <M>{"-q/\\sqrt{q(1-q)} = -\\sqrt{q/(1-q)}"}</M>. Summing, qG correct and (1 − q)G incorrect
          samples give <M>{"G\\left(q\\sqrt{(1-q)/q} - (1-q)\\sqrt{q/(1-q)}\\right) = G\\left(\\sqrt{q(1-q)} - \\sqrt{q(1-q)}\\right) = 0"}</M>.
          When q is near zero, the single correct sample has a large advantage, which is how a rare success becomes a
          common one.
        </p>
      </Proof>

      <Definition title="the update and its measurement">
        <p>
          The policy loss uses the clipped importance ratio of PPO, l9.4.1, taking the smaller of the unclipped and
          clipped terms so that moving the ratio outside <M>{"[1-\\epsilon, 1+\\epsilon]"}</M> earns nothing{" "}
          (<C>clipped_term</C>). Progress is measured by pass@k, the chance that at least one of k samples is right,
          estimated without bias from n samples with c correct as{" "}
          <M>{"1 - \\binom{n-c}{k}/\\binom{n}{k}"}</M> (<C>pass_at_k</C>). The share of groups with mixed rewards{" "}
          (<C>mixed_groups</C>) is the share of the batch that produces any gradient.
        </p>
        <Code>{GRPO}</Code>
      </Definition>

      <Example title="the capstone RL run">
        <p>
          Prompts from grade-school arithmetic training sets, filtered to those the fine-tuned model solves between 10%
          and 90% of the time in 8 samples. Groups of 8, a small KL penalty or none, a few hundred steps, with rollouts
          generated by the inference engine as in e12.6.1. Pass@1 on the held-out test set rises; pass@16 rises less,
          because RL mostly makes the model choose the solutions it could already find, and response length is watched
          as in l9.7.4.
        </p>
      </Example>

      <Remark title="reward hacking at small scale">
        <p>
          Even a strict verifier can be gamed: a model that prints several numbers after the marker, hoping the last is
          right, or that copies numbers from the question. Reading samples during training catches these early, and the
          verifier is tightened, for example to require exactly one number after the marker, before the behaviour spreads.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "adv",
      rung: "check",
      prompt: (
        <p>
          A group of 8 samples has rewards 1, 0, 0, 1, 0, 0, 0, 0. What is the advantage of each correct sample? Give
          four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.7321, tolerance: 0.0002 },
    },
    {
      key: "pass",
      rung: "check",
      prompt: (
        <p>
          Of 16 samples for a problem, 3 are correct. What is the unbiased estimate of pass@4? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6071, tolerance: 0.0002 },
    },
    {
      key: "filter",
      rung: "apply",
      prompt: <p>Why are problems the model solves in every sample removed from the RL prompt set?</p>,
      answer: {
        kind: "choice",
        options: [
          "All samples get the same reward, so every group-relative advantage is zero and the prompt produces no gradient",
          "They would make the verifier fail",
          "They are always contaminated",
          "They make the KL penalty infinite",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import re

def extract_answer(text):
    m = re.findall(r"-?\\d+(?:\\.\\d+)?", text.split("####")[-1])
    return m[-1] if m else None                            # the last number after the final marker

def reward(text, gold):
    a = extract_answer(text)
    return 1.0 if a is not None and float(a) == float(gold) else 0.0

def group_advantages(rewards):
    mu = sum(rewards) / len(rewards)
    sd = (sum((r - mu) ** 2 for r in rewards) / len(rewards)) ** 0.5
    return [0.0] * len(rewards) if sd == 0 else [(r - mu) / sd for r in rewards]

print(extract_answer("x = 3, so 4 #### 12 apples"), extract_answer("none"), reward("so -2.0", -2), reward("#### 7 then 8", 7))
print(group_advantages([1, 0, 1, 0]), group_advantages([1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "12 None 1.0 0.0\n[1.0, -1.0, 1.0, -1.0] [0.0, 0.0]",
          "4 None 1.0 0.0\n[1.0, -1.0, 1.0, -1.0] [0.0, 0.0]",
          "12 None 0.0 1.0\n[1.0, -1.0, 1.0, -1.0] [0.0, 0.0]",
          "12 None 1.0 0.0\n[0.5, -0.5, 0.5, -0.5] [0.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb

def clipped_term(ratio, adv, eps):
    clipped = min(max(ratio, 1 - eps), 1 + eps)
    return min(ratio * adv, clipped * adv)                 # pessimistic: no gain from moving too far

def pass_at_k(n, c, k):
    return 1.0 if n - c < k else 1 - comb(n - c, k) / comb(n, k)

def mixed_groups(groups):
    return sum(len(set(g)) > 1 for g in groups) / len(groups)   # only these give a gradient

print(clipped_term(1.5, 2, 0.2), clipped_term(0.5, 2, 0.2), clipped_term(0.5, -2, 0.2))
print(pass_at_k(4, 1, 2), pass_at_k(4, 3, 2), mixed_groups([[1, 1], [0, 1], [0, 0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.4 1.0 -1.6\n0.5 1.0 0.3333333333333333",
          "3.0 1.0 -1.6\n0.5 1.0 0.3333333333333333",
          "2.4 1.6 -1.0\n0.5 1.0 0.3333333333333333",
          "2.4 1.0 -1.6\n0.25 1.0 0.6666666666666666",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>extract_answer(text)</C>, the last number (optionally negative or decimal) after the final
          &quot;####&quot;, or in the whole text if there is none, as a string or None; <C>reward(text, gold)</C>; and{" "}
          <C>group_advantages(rewards)</C>, using the population standard deviation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def extract_answer(text):
    return text

def reward(text, gold):
    return 0.0

def group_advantages(rewards):
    return list(rewards)
`,
        solution: VERIFY,
        tests: [
          { name: "extract", code: `assert extract_answer("a 1 #### b 2 #### c -3.5 d") == "-3.5" and extract_answer("#### none") is None and reward("total 0.50", "0.5") == 1.0 and reward("", 1) == 0.0` },
          { name: "adv", code: `a = group_advantages([2, 2, 2]); b = group_advantages([0, 0, 0, 0, 4]); assert a == [0.0] * 3 and abs(b[4] - 2) < 1e-12 and abs(sum(b)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>clipped_term(ratio, adv, eps)</C>; <C>pass_at_k(n, c, k)</C>, equal to 1.0 when fewer than k samples
          are wrong; and <C>mixed_groups(groups)</C>, the share of groups whose rewards are not all equal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb

def clipped_term(ratio, adv, eps):
    return ratio * adv

def pass_at_k(n, c, k):
    return c / n

def mixed_groups(groups):
    return 1.0
`,
        solution: GRPO,
        tests: [
          { name: "clip", code: `assert clipped_term(2.0, 1, 0.25) == 1.25 and clipped_term(1.1, -1, 0.25) == -1.1 and clipped_term(0.5, -1, 0.25) == -0.75` },
          { name: "pass", code: `assert pass_at_k(5, 0, 2) == 0 and pass_at_k(5, 4, 2) == 1.0 and abs(pass_at_k(5, 1, 2) - 0.4) < 1e-12 and mixed_groups([[0, 0], [1, 1]]) == 0` },
        ],
      },
    },
    {
      key: "mixed",
      rung: "stretch",
      prompt: (
        <p>
          The model solves a problem with probability 0.2 per sample, independently. With groups of 8, what is the
          probability that a group produces a non-zero gradient? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8322, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Post-training is done. The last chapter ships the model: serving it with the inference engine built in E12, then
        writing up what it can and cannot do.
      </p>
    </>
  ),
};
