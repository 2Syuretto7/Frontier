import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ExposureBiasViz } from "@/components/viz/ExposureBiasViz";
import type { LessonContent } from "@/lib/types";

const ONPOLICY = `def compounding_errors(eps, T):
    return sum(1 - (1 - eps) ** t for t in range(1, T + 1))

def token_rewards(teacher_lps, student_lps):
    return [t - s for t, s in zip(teacher_lps, student_lps)]

def returns_to_go(rewards, discount=1.0):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + discount * g
        out.append(g)
    return out[::-1]`;

const OBJECTIVES = `import math

def mix_batch(on_policy, off_policy, lam, n):
    k = round(lam * n)
    return on_policy[:k] + off_policy[:n - k]

def reverse_kl_estimate(rewards_per_seq):
    return -sum(sum(r) for r in rewards_per_seq) / len(rewards_per_seq)

def jsd(p, q, beta=0.5):
    m = [beta * a + (1 - beta) * b for a, b in zip(p, q)]
    kl = lambda x, y: sum(a * math.log(a / b) for a, b in zip(x, y) if a > 0)
    return beta * kl(p, m) + (1 - beta) * kl(q, m)`;

export const lesson: LessonContent = {
  id: "l9.2.3",
  minutes: 45,
  links: {
    requires: ["l9.2.2", "l6.2.1"],
    revisits: ["l9.2.1", "m12.2.1"],
    foreshadows: ["l9.4.1", "l9.7.2"],
  },

  puzzle: (
    <>
      <p>
        A student trained on a teacher&apos;s reasoning traces does well on the first few steps of a problem, then makes one small
        slip and wanders: it has never seen a trace containing its own kind of mistake, so it does not know how to recover.
        Reinforcement learning would fix this by training on the student&apos;s own attempts, but gives one reward per attempt.
        Is there a way to train on the student&apos;s own attempts with a teacher&apos;s token-by-token guidance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Off-policy distillation trains on states the teacher visits; at test time the student visits its own. The mismatch,
        called exposure bias, lets errors compound. On-policy distillation lets the student generate, then asks the teacher how
        likely it found each token the student chose. Tokens the teacher agrees with are reinforced and tokens it finds
        unlikely are discouraged, on exactly the prefixes the student produces, including those after its own slips. Each
        token gets a signal, which is far denser than one reward per answer.
      </p>
      <ExposureBiasViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="errors compound off-policy">
        <p>
          Suppose a student slips with probability ε at each step while on the teacher&apos;s track, and after its first slip every step
          is wrong. The expected number of wrong steps in T is
        </p>
        <MD>{"\\sum_{t=1}^{T}\\big(1 - (1-\\varepsilon)^t\\big) \\approx \\varepsilon\\,\\frac{T(T+1)}{2}\\quad\\text{for } \\varepsilon T \\ll 1."}</MD>
      </Theorem>
      <Proof>
        <p>
          Step t is wrong exactly when a slip has happened at or before t, which has probability <M>{"1 - (1-\\varepsilon)^t"}</M>; sum by linearity of
          expectation (<C>compounding_errors</C>). For small <M>{"\\varepsilon t"}</M>, <M>{"1 - (1-\\varepsilon)^t \\approx \\varepsilon t"}</M>, and{" "}
          <M>{"\\sum_t \\varepsilon t = \\varepsilon T(T+1)/2"}</M>. Ross and Bagnell showed this quadratic growth is the worst case for imitation from
          expert states, and that training on the learner&apos;s own states, as in DAgger, brings it down to linear in T.
        </p>
      </Proof>

      <Definition title="on-policy distillation">
        <p>
          Sample <M>{"y \\sim \\pi_S"}</M> from the student, score each token with the teacher, and use the per-token reward{" "}
          <M>{"r_t = \\log \\pi_T(y_t\\mid y_{<t}) - \\log \\pi_S(y_t \\mid y_{<t})"}</M> (<C>token_rewards</C>). The sum of these over a sampled sequence is a
          Monte Carlo estimate of minus the reverse divergence <M>{"\\mathrm{KL}(\\pi_S\\|\\pi_T)"}</M>, so maximising it is mode-seeking distillation
          on the student&apos;s own distribution. Policy-gradient training uses the reward still to come from each token (<C>returns_to_go</C>),
          though many implementations use only the immediate per-token term, which is already informative.
        </p>
        <Code>{ONPOLICY}</Code>
      </Definition>

      <Definition title="mixtures and divergences">
        <p>
          Generalised knowledge distillation (GKD, Agarwal and colleagues) mixes a fraction λ of student-generated sequences with
          fixed data in each batch (<C>mix_batch</C>) and lets the divergence vary. Per sequence, the negated sum of token rewards
          estimates the reverse KL (<C>reverse_kl_estimate</C>). The generalised Jensen–Shannon divergence{" "}
          <M>{"\\beta\\,\\mathrm{KL}(p\\|m) + (1-\\beta)\\,\\mathrm{KL}(q\\|m)"}</M> with <M>{"m = \\beta p + (1-\\beta) q"}</M> moves between forward-like and reverse-like
          behaviour as β changes, and stays finite when one distribution has zeros (<C>jsd</C>).
        </p>
        <Code>{OBJECTIVES}</Code>
      </Definition>

      <Remark title="cost compared with reinforcement learning">
        <p>
          Each training sequence needs a student generation, as in RL, plus one teacher forward pass over it, which is cheap
          because the whole sequence is scored in parallel. In return every token carries a graded signal, whereas RL with a
          verifier (l9.7.2) gets one number per sequence. Qwen3 trained its small models with off-policy distillation followed
          by on-policy distillation from its large ones and reported better results at a fraction of the compute of running RL
          on each. The method needs the teacher&apos;s probabilities, so it applies when the teacher is an open model with a
          compatible tokeniser.
        </p>
      </Remark>

      <Example title="what the student learns to do differently">
        <p>
          After a slip, an off-policy student continues as if the slip were right. An on-policy student has generated such
          prefixes during training, and the teacher assigned high probability to the tokens that correct course, such as
          &quot;wait, that is wrong&quot; or a recomputation. Those tokens were rewarded, so the student learns recovery as well as
          imitation.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "compound",
      rung: "check",
      prompt: <p>Under the compounding model with ε = 0.01, what is the expected number of wrong steps in a sequence of 100? Give two decimals.</p>,
      answer: { kind: "numeric", value: 37.24, tolerance: 0.01 },
    },
    {
      key: "reward",
      rung: "check",
      prompt: (
        <p>
          A student writes three tokens to which the teacher gives probabilities 0.5, 0.9 and 0.1, and the student gives 0.5, 0.6 and
          0.4. What is the sum of the per-token rewards? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.981, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What does on-policy distillation give the student that training on teacher-written traces does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "Teacher feedback on prefixes the student itself produces, including those after its own mistakes, so it learns to recover",
          "Access to the teacher's weights",
          "A single reward for each complete answer",
          "Training data that never contains errors",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def compounding_errors(eps, T):
    return sum(1 - (1 - eps) ** t for t in range(1, T + 1))

def token_rewards(teacher_lps, student_lps):
    return [t - s for t, s in zip(teacher_lps, student_lps)]

def returns_to_go(rewards, discount=1.0):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + discount * g
        out.append(g)
    return out[::-1]

print(compounding_errors(0.5, 2), token_rewards([-1.0, -0.5], [-2.0, -0.5]), returns_to_go([1.0, 2.0, 3.0]))
print(returns_to_go([1.0, 1.0], 0.5), compounding_errors(0.0, 50))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.25 [1.0, 0.0] [6.0, 5.0, 3.0]\n[1.5, 1.0] 0.0",
          "1.0 [1.0, 0.0] [6.0, 5.0, 3.0]\n[1.5, 1.0] 0.0",
          "1.25 [-1.0, 0.0] [6.0, 5.0, 3.0]\n[1.5, 1.0] 0.0",
          "1.25 [1.0, 0.0] [1.0, 3.0, 6.0]\n[1.0, 1.5] 0.0",
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

def mix_batch(on_policy, off_policy, lam, n):
    k = round(lam * n)
    return on_policy[:k] + off_policy[:n - k]

def reverse_kl_estimate(rewards_per_seq):
    return -sum(sum(r) for r in rewards_per_seq) / len(rewards_per_seq)

def jsd(p, q, beta=0.5):
    m = [beta * a + (1 - beta) * b for a, b in zip(p, q)]
    kl = lambda x, y: sum(a * math.log(a / b) for a, b in zip(x, y) if a > 0)
    return beta * kl(p, m) + (1 - beta) * kl(q, m)

print(mix_batch(["s1", "s2", "s3"], ["t1", "t2", "t3"], 0.25, 4), reverse_kl_estimate([[0.5, -1.0], [-0.5]]))
print(jsd([1.0, 0.0], [1.0, 0.0]), round(jsd([1.0, 0.0], [0.0, 1.0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['s1', 't1', 't2', 't3'] 0.5\n0.0 0.6931",
          "['s1', 's2', 't1', 't2'] 0.5\n0.0 0.6931",
          "['s1', 't1', 't2', 't3'] -0.5\n0.0 0.6931",
          "['s1', 't1', 't2', 't3'] 0.5\n0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>compounding_errors(eps, T)</C>, <C>token_rewards(teacher_lps, student_lps)</C> and <C>returns_to_go(rewards, discount=1.0)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def compounding_errors(eps, T):
    return eps * T

def token_rewards(teacher_lps, student_lps):
    return [s - t for t, s in zip(teacher_lps, student_lps)]

def returns_to_go(rewards, discount=1.0):
    return list(rewards)
`,
        solution: ONPOLICY,
        tests: [
          { name: "errors", code: `assert abs(compounding_errors(0.2, 3) - (0.2 + 0.36 + 0.488)) < 1e-12 and token_rewards([-0.1, -3.0], [-0.6, -1.0]) == [0.5, -2.0]` },
          { name: "returns", code: `assert returns_to_go([1.0, 0.0, 2.0], 0.5) == [1.5, 1.0, 2.0] and returns_to_go([]) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mix_batch(on_policy, off_policy, lam, n)</C>, taking <C>round(lam * n)</C> on-policy items first, <C>reverse_kl_estimate(rewards_per_seq)</C>{" "}
          and <C>jsd(p, q, beta=0.5)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mix_batch(on_policy, off_policy, lam, n):
    return off_policy[:n]

def reverse_kl_estimate(rewards_per_seq):
    return 0.0

def jsd(p, q, beta=0.5):
    return 0.0
`,
        solution: OBJECTIVES,
        tests: [
          { name: "mix", code: `assert mix_batch(list("abcd"), list("wxyz"), 0.5, 4) == ["a", "b", "w", "x"] and abs(reverse_kl_estimate([[-1.0, -1.0], [0.0], [-4.0]]) - 2.0) < 1e-12` },
          { name: "jsd", code: `p, q = [0.25, 0.75], [0.75, 0.25]\nassert abs(jsd(p, q, 0.5) - (0.25 * math.log(0.5) + 0.75 * math.log(1.5))) < 1e-12 and abs(jsd(p, p, 0.3)) < 1e-12` },
        ],
      },
    },
    {
      key: "js",
      rung: "stretch",
      prompt: (
        <p>
          What is the generalised Jensen–Shannon divergence with β = 0.5 between p = (1, 0) and q = (0.5, 0.5), in nats? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.216, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Distillation needs a better model to learn from. To surpass the best available model, post-training needs a signal of
        what people prefer, and the next module builds one: the reward model.
      </p>
    </>
  ),
};
