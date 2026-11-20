import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RejectionSamplingViz } from "@/components/viz/RejectionSamplingViz";
import type { LessonContent } from "@/lib/types";

const FILTER = `def best_of_n(samples, scores):
    i = max(range(len(samples)), key=lambda j: scores[j])
    return samples[i]

def rejection_filter(samples_per_prompt, verify):
    kept = []
    for prompt, samples in samples_per_prompt.items():
        for s in samples:
            if verify(prompt, s):
                kept.append((prompt, s))
                break
    return kept

def keep_rate(samples_per_prompt, verify):
    return len(rejection_filter(samples_per_prompt, verify)) / len(samples_per_prompt)`;

const SEQ = `def seq_logprob(token_logprobs):
    return sum(token_logprobs)

def seq_kl_mc(teacher_lps, student_lps):
    diffs = [seq_logprob(t) - seq_logprob(s) for t, s in zip(teacher_lps, student_lps)]
    return sum(diffs) / len(diffs)

def solved_fraction(p, n):
    return 1 - (1 - p) ** n`;

export const lesson: LessonContent = {
  id: "l9.2.2",
  minutes: 45,
  links: {
    requires: ["l9.2.1", "l9.1.1"],
    revisits: ["l8.6.3"],
    foreshadows: ["l9.2.3", "l9.7.1", "l9.7.3"],
  },

  puzzle: (
    <>
      <p>
        DeepSeek fine-tuned small open models on 800 thousand responses written by its R1 reasoning model, and a
        32-billion-parameter student surpassed what the same base model reached with large-scale reinforcement learning of its own. A
        year earlier, researchers had shown that models fine-tuned on a proprietary chatbot&apos;s outputs copied its style closely
        yet were no more accurate. When does training on a stronger model&apos;s text transfer ability, and when only manner?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Without the teacher&apos;s logits, the next best signal is its samples. Training on them is sequence-level distillation: the
        student learns to produce what the teacher would produce. Filtering the samples, keeping only those a checker accepts,
        turns the teacher into a better teacher. Both work best when the student already has the underlying ability and needs
        to learn how to use it, and both inherit the teacher&apos;s gaps: hard prompts the teacher rarely solves are rare in the
        filtered data.
      </p>
      <RejectionSamplingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sequence-level distillation and rejection sampling">
        <p>
          Kim and Rush trained a translation student on its teacher&apos;s beam-search outputs instead of the references, and found it
          outperformed token-level distillation. For language models the pattern is: sample responses from a teacher, optionally
          score them, and fine-tune on the survivors. Best-of-n keeps the highest-scoring of n samples (<C>best_of_n</C>); with a
          verifier, rejection sampling keeps the first passing sample per prompt (<C>rejection_filter</C>), and the share of prompts
          that survive is the keep rate (<C>keep_rate</C>).
        </p>
        <Code>{FILTER}</Code>
      </Definition>

      <Theorem title="sequence divergence by the chain rule">
        <p>
          For teacher and student distributions <M>{"P_T, P_S"}</M> over sequences built token by token,
        </p>
        <MD>{"\\mathrm{KL}(P_T\\|P_S) = \\mathbb{E}_{y \\sim P_T}\\Big[\\sum_t \\mathrm{KL}\\big(p_T(\\cdot\\mid y_{<t})\\,\\|\\,p_S(\\cdot\\mid y_{<t})\\big)\\Big]."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\log P(y) = \\sum_t \\log p(y_t \\mid y_{<t})"}</M> for both models, so <M>{"\\mathrm{KL}(P_T\\|P_S) = \\mathbb{E}_{y \\sim P_T}\\sum_t[\\log p_T(y_t\\mid y_{<t}) - \\log p_S(y_t \\mid y_{<t})]"}</M>.
          Taking the expectation over <M>{"y_t"}</M> given <M>{"y_{<t}"}</M> inside each term turns it into the token-level KL at that prefix. So token-level
          distillation on teacher-generated prefixes and training on teacher samples target the same quantity; samples estimate
          it by Monte Carlo, the average of <M>{"\\log P_T(y) - \\log P_S(y)"}</M> over sampled y (<C>seq_logprob</C>, <C>seq_kl_mc</C>), with more noise
          per example than full distributions.
        </p>
        <Code>{SEQ}</Code>
      </Proof>

      <Remark title="the coverage of filtered data">
        <p>
          If one sample solves a prompt with probability p, then n samples solve it with probability <M>{"1 - (1-p)^n"}</M> (<C>solved_fraction</C>).
          Easy prompts nearly always survive and hard ones rarely do, so filtered data under-represents exactly the problems the
          student most needs. Pipelines respond by drawing more samples for hard prompts, capping the number of kept responses
          per easy prompt, and keeping several distinct correct responses rather than one.
        </p>
      </Remark>

      <Example title="from Alpaca to R1 distillation">
        <p>
          Alpaca and Vicuna fine-tuned LLaMA on responses from proprietary chat models. Gudibande and colleagues found that such
          imitation closed the gap in style as judged by crowd workers but not on factual and reasoning benchmarks: the base
          model lacked the knowledge. Orca trained on step-by-step explanations rather than bare answers and transferred more.
          Llama 2 used rejection sampling with its reward model between rounds of RLHF. DeepSeek&apos;s R1 distillations show the
          favourable case: long reasoning traces on verifiable problems, a capable base model, and a teacher far stronger on
          exactly those problems.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "solve",
      rung: "check",
      prompt: <p>A teacher solves a prompt in one sample with probability 0.15. With eight independent samples, what is the probability that at least one is correct? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.728, tolerance: 0.001 },
    },
    {
      key: "lp",
      rung: "check",
      prompt: <p>A three-token response has token probabilities 0.9, 0.8 and 0.5 under the student. What is its log-probability in nats? Give three decimals.</p>,
      answer: { kind: "numeric", value: -1.022, tolerance: 0.001 },
    },
    {
      key: "imitate",
      rung: "apply",
      prompt: <p>A 7B model fine-tuned on a much larger chatbot&apos;s answers sounds like it but scores no better on factual questions. What is the best explanation?</p>,
      answer: {
        kind: "choice",
        options: [
          "Imitation teaches the student the teacher's style and format, but facts and skills the base model lacks cannot be supplied by a modest amount of fine-tuning on outputs",
          "The teacher's answers were all wrong",
          "Sequence-level distillation cannot change a model's style",
          "The student needed the teacher's logits to learn anything",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def best_of_n(samples, scores):
    i = max(range(len(samples)), key=lambda j: scores[j])
    return samples[i]

def rejection_filter(samples_per_prompt, verify):
    kept = []
    for prompt, samples in samples_per_prompt.items():
        for s in samples:
            if verify(prompt, s):
                kept.append((prompt, s))
                break
    return kept

def keep_rate(samples_per_prompt, verify):
    return len(rejection_filter(samples_per_prompt, verify)) / len(samples_per_prompt)

print(best_of_n(["a", "b", "c"], [0.2, 0.9, 0.9]), rejection_filter({"2+2": ["5", "4", "4"], "3+3": ["7"]}, lambda p, s: eval(p) == int(s)))
print(keep_rate({"1+1": ["2"], "2+3": ["6", "1"]}, lambda p, s: eval(p) == int(s)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "b [('2+2', '4')]\n0.5",
          "c [('2+2', '4')]\n0.5",
          "b [('2+2', '4'), ('2+2', '4')]\n0.5",
          "b [('2+2', '4')]\n1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def seq_logprob(token_logprobs):
    return sum(token_logprobs)

def seq_kl_mc(teacher_lps, student_lps):
    diffs = [seq_logprob(t) - seq_logprob(s) for t, s in zip(teacher_lps, student_lps)]
    return sum(diffs) / len(diffs)

def solved_fraction(p, n):
    return 1 - (1 - p) ** n

print(seq_logprob([-1.0, -0.5]), seq_kl_mc([[-1.0, -1.0], [-2.0]], [[-2.0, -1.5], [-2.0]]))
print(solved_fraction(0.5, 3), solved_fraction(0.0, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-1.5 0.75\n0.875 0.0",
          "-1.5 1.5\n0.875 0.0",
          "-1.5 0.75\n0.125 1.0",
          "-0.75 0.75\n0.875 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_of_n(samples, scores)</C>, returning the first sample with the highest score, <C>rejection_filter(samples_per_prompt,
          verify)</C>, keeping the first passing sample per prompt in dictionary order, and <C>keep_rate(samples_per_prompt, verify)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def best_of_n(samples, scores):
    return samples[0]

def rejection_filter(samples_per_prompt, verify):
    return [(p, s) for p, ss in samples_per_prompt.items() for s in ss]

def keep_rate(samples_per_prompt, verify):
    return 1.0
`,
        solution: FILTER,
        tests: [
          { name: "best", code: `assert best_of_n(["x", "y", "z"], [1, 3, 3]) == "y" and best_of_n(["only"], [-5]) == "only"` },
          { name: "filter", code: `data = {"a": ["no", "yes", "yes!"], "b": ["no"], "c": ["ok"]}\nv = lambda p, s: s.startswith("yes") or s == "ok"\nassert rejection_filter(data, v) == [("a", "yes"), ("c", "ok")] and abs(keep_rate(data, v) - 2 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>seq_logprob(token_logprobs)</C>, <C>seq_kl_mc(teacher_lps, student_lps)</C>, whose arguments are lists of per-sample token
          log-probability lists for the same teacher samples, and <C>solved_fraction(p, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def seq_logprob(token_logprobs):
    return token_logprobs[-1]

def seq_kl_mc(teacher_lps, student_lps):
    return 0.0

def solved_fraction(p, n):
    return p * n
`,
        solution: SEQ,
        tests: [
          { name: "kl", code: `assert seq_logprob([-0.25, -0.5, -0.25]) == -1.0 and abs(seq_kl_mc([[-1.0], [-0.5, -0.5]], [[-3.0], [-1.0, -2.0]]) - 2.0) < 1e-12` },
          { name: "solved", code: `assert abs(solved_fraction(0.2, 2) - 0.36) < 1e-12 and abs(solved_fraction(0.9, 1) - 0.9) < 1e-12` },
        ],
      },
    },
    {
      key: "bias",
      rung: "stretch",
      prompt: (
        <p>
          Half of a prompt set is easy, solved by one teacher sample with probability 0.6, and half is hard, solved with probability
          0.05. With four samples per prompt and one kept response per solved prompt, what fraction of the kept responses come
          from hard prompts? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.16, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A student trained on the teacher&apos;s sequences never sees its own mistakes. The next lesson lets the student generate and
        asks the teacher to grade every token it wrote.
      </p>
    </>
  ),
};
