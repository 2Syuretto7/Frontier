import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CotDepthViz } from "@/components/viz/CotDepthViz";
import type { LessonContent } from "@/lib/types";

const TRACE = `def swap_step(pos, swap):
    a, b = swap
    return b if pos == a else a if pos == b else pos

def cot_trace(pos, swaps):
    trace = []
    for s in swaps:
        pos = swap_step(pos, s)
        trace.append(pos)                                  # write down the state after every step
    return trace

def first_error(trace, pos, swaps):
    for i, s in enumerate(swaps):
        pos = swap_step(pos, s)
        if trace[i] != pos:
            return i                                       # the first step that does not follow
        pos = trace[i]
    return -1`;

const MODEL = `def direct_acc(n, d, k):
    return 1.0 if n <= d else 1 / k                        # depth d covers at most d serial steps

def cot_acc(n, eps, k):
    p = (1 - eps) ** n                                     # every written step right
    return p + (1 - p) / k

def best_mode(n, d, eps, k):
    return "cot" if cot_acc(n, eps, k) > direct_acc(n, d, k) else "direct"`;

export const lesson: LessonContent = {
  id: "l13.1.1",
  minutes: 50,
  links: {
    requires: ["l9.7.3"],
    revisits: ["l9.7.4", "l9.1.1"],
    foreshadows: ["l13.1.2", "l13.1.3"],
  },

  puzzle: (
    <>
      <p>
        Ask a language model &quot;a ball is under cup 1; swap cups 1 and 2, then 2 and 3, then 1 and 3, and so on for forty
        swaps; where is the ball?&quot; and it often answers wrongly at once. Ask it to write down where the ball is after
        each swap, and it usually gets it right. The model and its knowledge are the same; only the number of tokens it
        writes before answering has changed. Why should writing intermediate steps make a fixed network more capable, and
        are the steps it writes the reasons it actually used?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A transformer does a fixed amount of sequential computation per token, set by its depth. A problem that needs more
        sequential steps than that cannot be solved in one token, however large the model is in width. Writing intermediate
        results turns the output into working memory: each new token can build on the last, so the number of sequential
        steps grows with the length of the chain. The price is that every written step is another chance to make a mistake.
      </p>
      <CotDepthViz />
    </>
  ),

  theory: (
    <>
      <Definition title="chain of thought">
        <p>
          Chain-of-thought prompting puts a few worked examples, each with its intermediate reasoning, before the question,
          so the model imitates the format and reasons before answering. Zero-shot chain of thought gets the same behaviour
          from an instruction such as &quot;let&apos;s think step by step&quot;. In the original experiments the gains on
          arithmetic and logic benchmarks were large for the biggest models and small or negative for small ones. Reasoning
          models trained with reinforcement learning, as in the previous course, write such chains without being asked.
        </p>
      </Definition>

      <Theorem title="a chain of thought can simulate an automaton">
        <p>
          Let a deterministic finite automaton have states Q, input alphabet Σ and transition function{" "}
          <M>{"\\delta : Q \\times \\Sigma \\to Q"}</M>. A transformer of fixed depth, independent of the input length n, can
          output the state after each of the n input symbols in turn (<C>cot_trace</C>), and so the final state after n
          generated tokens.
        </p>
      </Theorem>
      <Proof>
        <p>
          At the i-th generated token the model must output <M>{"q_i = \\delta(q_{i-1}, x_i)"}</M>. The previous state{" "}
          <M>{"q_{i-1}"}</M> is the token just generated, available at the current position. The symbol <M>{"x_i"}</M> sits at
          input position i, and the current position is n + i, so one attention head whose query and key encode positions
          can attend to the position n positions back, retrieving <M>{"x_i"}</M>. The pair (<M>{"q_{i-1}, x_i"}</M>) ranges
          over the finite set <M>{"Q \\times \\Sigma"}</M>, so an MLP can implement δ as a lookup table and the unembedding
          can emit <M>{"q_i"}</M>. None of this depends on n.
        </p>
        <Code>{TRACE}</Code>
      </Proof>

      <Remark title="why the chain is needed">
        <p>
          Without intermediate tokens, a transformer of fixed depth with logarithmic precision computes only functions in
          the circuit class <M>{"\\mathsf{TC}^0"}</M>. Tracking a permutation of five objects through n swaps is complete
          for the larger class <M>{"\\mathsf{NC}^1"}</M>, so unless the two classes are equal, which is widely believed
          false, no such transformer answers it directly for all n. The cup game with three cups is easier in principle, but
          the same serial structure is what defeats trained models in practice. With n intermediate tokens the theorem above
          applies, so chain of thought strictly adds power rather than only eliciting what was there.
        </p>
      </Remark>

      <Example title="compounding errors">
        <p>
          The theorem promises a network that can do each step, not one that never errs. If each written step is wrong
          independently with probability ε, a chain of n steps is entirely right with probability <M>{"(1 - \\varepsilon)^n"}</M>,
          and a wrong chain leaves roughly a guess (<C>cot_acc</C>). This stylised model, in the figure, explains why long
          chains need either very reliable steps or a way to check them: verifying a trace step by step{" "}
          (<C>first_error</C>) is the idea behind process reward models later in this chapter.
        </p>
        <Code>{MODEL}</Code>
      </Example>

      <Definition title="faithfulness">
        <p>
          A chain of thought is faithful if the reasoning it states is the reasoning that produced the answer. This is not
          guaranteed. When few-shot examples always had answer (A), models chose (A) more often and wrote plausible
          chains justifying it without ever mentioning the pattern. Truncating a chain, or inserting a mistake into it, often
          left the final answer unchanged on some tasks, a sign that the answer did not depend on the stated steps.
        </p>
      </Definition>

      <Remark title="what chains are good for">
        <p>
          A chain can be useful as computation even when it is an imperfect explanation. For monitoring, an unfaithful chain
          is a weakness: a model might reach an answer for reasons it does not state. Tasks hard enough to need the chain,
          like the cup game, are where it is most likely to be faithful, since the answer cannot be reached without it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "acc",
      rung: "check",
      prompt: (
        <p>
          In the stylised model, a chain of 30 steps has per-step error 0.02, and a wrong chain gives a uniform guess among 4
          cups. What is the accuracy?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6591, tolerance: 0.001 },
    },
    {
      key: "direct",
      rung: "check",
      prompt: (
        <p>
          In the stylised model, a network can do 12 serial steps per token. It answers a 20-swap, three-cup problem
          directly. What is its accuracy?
        </p>
      ),
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can a chain of thought let a model of fixed depth solve longer sequential problems?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each generated token can read the previous intermediate result, so the number of sequential steps grows with the chain",
          "Longer outputs increase the number of parameters used",
          "The model attends to more of the prompt when it writes more",
          "Sampling more tokens reduces the variance of the answer",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def swap_step(pos, swap):
    a, b = swap
    return b if pos == a else a if pos == b else pos

def cot_trace(pos, swaps):
    trace = []
    for s in swaps:
        pos = swap_step(pos, s)
        trace.append(pos)                                  # write down the state after every step
    return trace

def first_error(trace, pos, swaps):
    for i, s in enumerate(swaps):
        pos = swap_step(pos, s)
        if trace[i] != pos:
            return i                                       # the first step that does not follow
        pos = trace[i]
    return -1

t = cot_trace(0, [(0, 1), (1, 2), (0, 2)]); print(t, swap_step(2, (0, 1)))
print(first_error([1, 2, 2], 0, [(0, 1), (1, 2), (0, 2)]), first_error(t, 0, [(0, 1), (1, 2), (0, 2)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 2, 0] 2\n2 -1",
          "[1, 2, 0] 2\n1 -1",
          "[1, 0, 2] 2\n2 -1",
          "[1, 2, 0] 0\n2 -1",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def direct_acc(n, d, k):
    return 1.0 if n <= d else 1 / k                        # depth d covers at most d serial steps

def cot_acc(n, eps, k):
    p = (1 - eps) ** n                                     # every written step right
    return p + (1 - p) / k

def best_mode(n, d, eps, k):
    return "cot" if cot_acc(n, eps, k) > direct_acc(n, d, k) else "direct"

print(direct_acc(4, 6, 3), round(direct_acc(8, 6, 4), 4), round(cot_acc(10, 0.05, 2), 4))
print(best_mode(4, 6, 0.05, 3), best_mode(20, 6, 0.01, 3), best_mode(200, 6, 0.05, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.25 0.7994\ndirect cot cot",
          "1.0 0.25 0.7994\ndirect cot direct",
          "1.0 0.25 0.5987\ndirect cot cot",
          "0.3333 0.25 0.7994\ncot cot cot",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>swap_step(pos, swap)</C>, <C>cot_trace(pos, swaps)</C> listing the position after every swap, and{" "}
          <C>first_error(trace, pos, swaps)</C>, the index of the first step that does not follow from the step before it
          (checking each step from the trace&apos;s own previous entry), or -1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def swap_step(pos, swap):
    return pos

def cot_trace(pos, swaps):
    return []

def first_error(trace, pos, swaps):
    return -1
`,
        solution: TRACE,
        tests: [
          { name: "trace", code: `assert cot_trace(1, [(1, 3), (3, 0)]) == [3, 0] and swap_step(5, (1, 2)) == 5` },
          { name: "err", code: `assert first_error([2, 2], 0, [(0, 2), (0, 1)]) == -1 and first_error([1], 0, [(0, 2)]) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write the stylised model: <C>direct_acc(n, d, k)</C>, <C>cot_acc(n, eps, k)</C>, and <C>best_mode(n, d, eps, k)</C>{" "}
          returning &quot;cot&quot; only when it is strictly better.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def direct_acc(n, d, k):
    return 1 / k

def cot_acc(n, eps, k):
    return (1 - eps) ** n

def best_mode(n, d, eps, k):
    return "direct"
`,
        solution: MODEL,
        tests: [
          { name: "acc", code: `assert direct_acc(3, 3, 5) == 1.0 and abs(cot_acc(2, 0.5, 2) - 0.625) < 1e-12` },
          { name: "mode", code: `assert best_mode(1, 5, 0.1, 2) == "direct" and best_mode(9, 5, 0.1, 2) == "cot"` },
        ],
      },
    },
    {
      key: "longest",
      rung: "stretch",
      prompt: (
        <p>
          With per-step error 0.01 and two cups, what is the longest chain for which the stylised accuracy is at least 0.9?
        </p>
      ),
      answer: { kind: "numeric", value: 22, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A single chain can go wrong anywhere. Sampling several chains and letting them vote is the simplest way to spend
        more compute for reliability, and it works for a reason that can be made precise.
      </p>
    </>
  ),
};
