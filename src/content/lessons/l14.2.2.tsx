import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OversightErrorViz } from "@/components/viz/OversightErrorViz";
import type { LessonContent } from "@/lib/types";

const TREE = `def summarise_tree(chunks, b, combine):
    level, calls = list(chunks), 0
    while len(level) > 1:
        level = [combine(level[i:i + b]) for i in range(0, len(level), b)]
        calls += len(level)                                # each call is judged by a human on b inputs
    return level[0], calls

def depth(n, b):
    d = 0
    while n > 1:
        n = -(-n // b)                                     # ceiling division
        d += 1
    return d

def judge_load(n, b):
    return b if n > 1 else 1                               # items a human reads per judgement, whatever n is`;

const ERRORS = `def level_errors(e_h, alpha, e0, k):
    errs = [e0]
    for _ in range(k):
        errs.append(e_h + alpha * errs[-1])                # own error plus inherited error
    return errs

def limit_error(e_h, alpha):
    return e_h / (1 - alpha) if alpha < 1 else float("inf")

def rounds_within(e_h, alpha, e0, tol):
    k, e, lim = 0, e0, limit_error(e_h, alpha)
    while abs(e - lim) > tol:
        e = e_h + alpha * e
        k += 1
    return k`;

export const lesson: LessonContent = {
  id: "l14.2.2",
  minutes: 45,
  links: {
    requires: ["l14.2.1", "l9.3.2"],
    revisits: ["l9.6.2", "l9.2.2"],
    foreshadows: ["l14.2.3"],
  },

  puzzle: (
    <>
      <p>
        Reward models are trained on human comparisons. To compare two summaries of a novel, a person must read the
        novel, which takes a day; to compare two research proposals in an unfamiliar field, they may not be able to at
        all. Yet the models we already have can summarise chapters and point out flaws. Could each generation of models
        help people evaluate the next, so that oversight keeps pace with capability, and what would keep the errors from
        piling up?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The idea is to make evaluation easier rather than to make humans better at it. A hard judgement is decomposed
        into easier ones, each of which a person can make, perhaps with help from a model that is already trusted for
        that easier task. The help is itself imperfect, so each round of assisted evaluation inherits some of its
        assistant&apos;s mistakes. The scheme is stable if less than all of that error is passed on, and it fails quietly
        if it is not.
      </p>
      <OversightErrorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="recursive reward modelling and amplification">
        <p>
          In recursive reward modelling (Leike et al., 2018), a user trains a reward model from their judgements, an agent
          is trained against it, and then agents trained this way assist the user in evaluating the next, harder task: by
          summarising, checking parts of the work, or pointing out problems. Iterated amplification (Christiano, Shlegeris
          and Amodei, 2018) is the related idea of a human who answers a question by delegating subquestions to copies of
          the current model, the combined system being distilled into the next model. Both rest on decomposition: a task
          whose result can be judged from the results of smaller tasks.
        </p>
      </Definition>

      <Example title="summarising books by recursion">
        <p>
          Wu et al. (2021) summarised whole novels with a model fine-tuned on human feedback, by summarising sections,
          then summaries of summaries, until one remained (<C>summarise_tree</C>). Each human judgement concerned a short
          passage and its summary, so the evaluator&apos;s load stayed the same however long the book (<C>judge_load</C>),
          while the number of levels grew only logarithmically (<C>depth</C>). A minority of the final summaries matched
          the quality of human-written ones, and errors at lower levels, such as a misattributed event, propagated upward.
        </p>
        <Code>{TREE}</Code>
      </Example>

      <Theorem title="when inherited error settles">
        <p>
          Let evaluation at round k have error rate <M>{"e_k"}</M>, and suppose the next round&apos;s error is the
          evaluator&apos;s own error <M>{"e_h"}</M> plus a fraction α of its assistant&apos;s:{" "}
          <M>{"e_{k+1} = e_h + \\alpha e_k"}</M>. Then
        </p>
        <MD>{"e_k = e^* + (e_0 - e^*)\\,\\alpha^k, \\qquad e^* = \\frac{e_h}{1 - \\alpha}"}</MD>
        <p>
          for α ≠ 1, so for 0 ≤ α &lt; 1 the error converges to <M>{"e^*"}</M> geometrically, and for α ≥ 1 and{" "}
          <M>{"e_h > 0"}</M> it grows without bound (<C>level_errors</C>, <C>limit_error</C>,{" "}
          <C>rounds_within</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The fixed point satisfies <M>{"e^* = e_h + \\alpha e^*"}</M>, giving the formula when α ≠ 1. Subtracting it
          from the recursion gives <M>{"e_{k+1} - e^* = \\alpha(e_k - e^*)"}</M>, so the difference is multiplied by α each
          round, which proves the closed form. If 0 ≤ α &lt; 1 the difference vanishes. If α = 1 then{" "}
          <M>{"e_k = e_0 + k e_h"}</M>, growing linearly. If α &gt; 1 then <M>{"e^* < 0 \\le e_0"}</M>, so the
          positive difference <M>{"e_0 - e^*"}</M> is multiplied by α &gt; 1 each round and grows geometrically. The limit is larger than the human&apos;s own error by the factor{" "}
          <M>{"1/(1 - \\alpha)"}</M>: an assistant whose mistakes are believed half the time doubles the error floor.
        </p>
        <Code>{ERRORS}</Code>
      </Proof>

      <Remark title="assistance in practice: critiques">
        <p>
          The most studied form of assistance is a model that writes critiques. Saunders et al. (2022) found that model
          critiques helped people find substantially more flaws in summaries, including flaws planted deliberately, and
          that larger models were better at critiquing than at generating. McAleese et al. (2024) trained CriticGPT to
          critique code; trainers preferred its critiques to human ones in 63% of cases on naturally occurring bugs, and
          human and model together wrote more complete critiques than the model alone with fewer invented problems. The α
          of the theorem is visible here: a critique that invents a bug, and is believed, adds error rather than removing
          it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "calls",
      rung: "check",
      prompt: (
        <p>
          A book is split into 1,000 chunks, and each summary combines up to 10 inputs. How many summaries are written in
          total, at all levels?
        </p>
      ),
      answer: { kind: "numeric", value: 111, tolerance: 0 },
    },
    {
      key: "err",
      rung: "check",
      prompt: (
        <p>
          The human&apos;s own error is 0.04, a fraction 0.7 of the assistant&apos;s error is inherited, and the first
          round&apos;s error is 0.3. What is the error after 5 rounds?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1613, tolerance: 0.0005 },
    },
    {
      key: "alpha",
      rung: "apply",
      prompt: <p>What makes the inherited fraction α reach 1 or more?</p>,
      answer: {
        kind: "choice",
        options: [
          "Evaluators trusting the assistant completely, or the assistant's mistakes compounding, so that every error is passed on or amplified",
          "Using a larger assistant",
          "Decomposing the task into more levels",
          "The human's own error being zero",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def summarise_tree(chunks, b, combine):
    level, calls = list(chunks), 0
    while len(level) > 1:
        level = [combine(level[i:i + b]) for i in range(0, len(level), b)]
        calls += len(level)                                # each call is judged by a human on b inputs
    return level[0], calls

def depth(n, b):
    d = 0
    while n > 1:
        n = -(-n // b)                                     # ceiling division
        d += 1
    return d

def judge_load(n, b):
    return b if n > 1 else 1                               # items a human reads per judgement, whatever n is

print(summarise_tree("abcdefg", 3, lambda xs: "(" + "".join(xs) + ")"), summarise_tree(["x"], 2, max))
print(summarise_tree([4, 1, 7, 2, 9], 2, sum), depth(1000, 10), depth(1001, 10), judge_load(10 ** 6, 8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('((abc)(def)(g))', 4) ('x', 0)\n(23, 6) 3 4 8",
          "('((abc)(def)(g))', 3) ('x', 0)\n(23, 6) 3 4 8",
          "('((abc)(def)(g))', 4) ('x', 1)\n(23, 6) 3 4 8",
          "('((abc)(def)(g))', 4) ('x', 0)\n(23, 5) 3 3 8",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def level_errors(e_h, alpha, e0, k):
    errs = [e0]
    for _ in range(k):
        errs.append(e_h + alpha * errs[-1])                # own error plus inherited error
    return errs

def limit_error(e_h, alpha):
    return e_h / (1 - alpha) if alpha < 1 else float("inf")

def rounds_within(e_h, alpha, e0, tol):
    k, e, lim = 0, e0, limit_error(e_h, alpha)
    while abs(e - lim) > tol:
        e = e_h + alpha * e
        k += 1
    return k

print([round(e, 3) for e in level_errors(0.1, 0.5, 0.4, 3)], limit_error(0.1, 0.5), limit_error(0.1, 1.0))
print(rounds_within(0.1, 0.5, 0.4, 0.01), rounds_within(0.0, 0.0, 0.0, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.4, 0.3, 0.25, 0.225] 0.2 inf\n5 0",
          "[0.4, 0.3, 0.25, 0.225] 0.2 inf\n4 0",
          "[0.3, 0.25, 0.225, 0.213] 0.2 inf\n5 0",
          "[0.4, 0.3, 0.25, 0.225] 0.1 inf\n5 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>summarise_tree(chunks, b, combine)</C>, combining consecutive groups of up to b items level by level
          until one remains and returning it with the number of combine calls; <C>depth(n, b)</C>, the number of levels;
          and <C>judge_load(n, b)</C>, the number of items read per judgement.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def summarise_tree(chunks, b, combine):
    return combine(list(chunks)), 1

def depth(n, b):
    return 1

def judge_load(n, b):
    return n
`,
        solution: TREE,
        tests: [
          { name: "tree", code: `assert summarise_tree([1, 2, 3, 4], 2, sum) == (10, 3) and summarise_tree("ab", 5, "".join) == ("ab", 1) and summarise_tree([7], 3, sum) == (7, 0)` },
          { name: "depth", code: `assert depth(1, 4) == 0 and depth(16, 4) == 2 and depth(17, 4) == 3 and judge_load(100, 4) == 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>level_errors(e_h, alpha, e0, k)</C>, the list of errors for rounds 0 to k;{" "}
          <C>limit_error(e_h, alpha)</C>, infinite when α ≥ 1; and <C>rounds_within(e_h, alpha, e0, tol)</C>, the first
          round whose error is within tol of the limit, for α &lt; 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def level_errors(e_h, alpha, e0, k):
    return [e0] * (k + 1)

def limit_error(e_h, alpha):
    return e_h

def rounds_within(e_h, alpha, e0, tol):
    return 0
`,
        solution: ERRORS,
        tests: [
          { name: "errors", code: `assert level_errors(0.5, 0.0, 1.0, 2) == [1.0, 0.5, 0.5] and abs(limit_error(0.1, 0.75) - 0.4) < 1e-12 and limit_error(0.1, 1.5) == float("inf")` },
          { name: "rounds", code: `assert rounds_within(0.0, 0.5, 1.0, 0.2) == 3 and rounds_within(0.2, 0.0, 0.9, 0.01) == 1` },
        ],
      },
    },
    {
      key: "long",
      rung: "stretch",
      prompt: (
        <p>
          A longer book has 3,500 chunks, with up to 10 inputs per summary. How many summaries are written in total?
        </p>
      ),
      answer: { kind: "numeric", value: 390, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Debate and recursion both assume the overseers can make some judgements reliably. A simpler question can be tested
        today: if a strong model is fine-tuned only on labels from a weaker one, does it learn the weak model&apos;s
        mistakes, or what the weak labels were trying to say?
      </p>
    </>
  ),
};
