import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WeakTestsViz } from "@/components/viz/WeakTestsViz";
import type { LessonContent } from "@/lib/types";

const CHECK = `import math

def extract_boxed(text):
    start = text.rfind("\\\\boxed{")
    if start < 0:
        return None
    i, depth = start + len("\\\\boxed{"), 1
    out = []
    while i < len(text):
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return "".join(out)
        out.append(ch)
        i += 1
    return None

def answers_match(pred, gold, tol):
    def to_number(s):
        s = s.replace(" ", "")
        try:
            if "/" in s:
                a, b = s.split("/")
                return float(a) / float(b)
            return float(s)
        except ValueError:
            return None
    a, b = to_number(pred), to_number(gold)
    if a is not None and b is not None:
        return abs(a - b) <= tol
    return pred.replace(" ", "") == gold.replace(" ", "")

def pass_at_k(n, c, k):
    if n - c < k:
        return 1.0
    return 1 - math.comb(n - c, k) / math.comb(n, k)`;

const TESTS = `def run_tests(fn, cases):
    passed = 0
    for args, expected in cases:
        try:
            if fn(*args) == expected:
                passed += 1
        except Exception:
            pass
    return passed / len(cases)

def binary_reward(frac):
    return 1.0 if frac == 1.0 else 0.0

def precision_recall(verdicts, truths):
    tp = sum(v and t for v, t in zip(verdicts, truths))
    fp = sum(v and not t for v, t in zip(verdicts, truths))
    fn = sum(t and not v for v, t in zip(verdicts, truths))
    return tp / (tp + fp), tp / (tp + fn)`;

export const lesson: LessonContent = {
  id: "l9.7.1",
  minutes: 50,
  links: {
    requires: ["l9.6.3"],
    revisits: ["l9.3.3", "l9.6.3"],
    foreshadows: ["l9.7.2", "l9.7.4"],
  },

  puzzle: (
    <>
      <p>
        A maths problem with a numerical answer, or a programming task with tests, can be graded by a program: no annotator, no
        reward model, no judge to flatter. Reinforcement learning against such checks is what turned language models into strong
        competition mathematicians and programmers in 2024 and 2025. Yet a model trained to pass tests has been seen to edit the
        tests, special-case their inputs, or print the expected output. Is a verifier really a reward that cannot be gamed, and
        what does it take to build one that comes close?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A verifier is a reward model with near-perfect precision on the cases it was built for and blind spots everywhere else.
        For maths, the blind spots are in reading the answer: a correct value written as 0.75 when the key says 3/4, or an answer
        in the wrong place. For code, they are in the tests: a wrong program passes if no test hits its bug, and a model with
        access to the test runner can attack the runner itself. Under optimisation the policy finds the blind spots, so a
        verifier must be engineered like a security boundary.
      </p>
      <WeakTestsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="answer verification">
        <p>
          The model is asked to put its final answer in a fixed place, conventionally <C>{"\\boxed{...}"}</C> for maths, which is
          extracted by matching braces (<C>extract_boxed</C>). The extracted answer is compared with the reference after
          normalisation: numerically with a tolerance where both parse as numbers, fractions included, otherwise as strings with
          whitespace removed (<C>answers_match</C>); production verifiers also test symbolic equivalence with a computer algebra
          system. The reward is 1 for a match and 0 otherwise, sometimes with a small extra reward for correct formatting.
        </p>
      </Definition>

      <Definition title="pass@k">
        <p>
          The probability that at least one of k samples is correct. From n ≥ k samples of which c are correct, the unbiased
          estimate is
        </p>
        <MD>{"\\text{pass@}k = 1 - \\binom{n-c}{k}\\Big/\\binom{n}{k}"}</MD>
        <p>(<C>pass_at_k</C>), introduced with the Codex evaluation.</p>
        <Code>{CHECK}</Code>
      </Definition>

      <Theorem title="the estimator is unbiased">
        <p>
          If the n samples are independent with per-sample success probability p, then{" "}
          <M>{"\\mathbb{E}\\big[1 - \\binom{n-c}{k}/\\binom{n}{k}\\big] = 1 - (1-p)^k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\binom{n-c}{k}/\\binom{n}{k}"}</M> is the probability that a uniformly random subset of k of the n samples contains no
          correct one, given c. Averaging over c, it is the probability that k samples chosen at random from n independent samples
          are all wrong, and those k are themselves k independent samples, all wrong with probability <M>{"(1-p)^k"}</M>. The naive
          estimate <M>{"1 - (1 - c/n)^k"}</M> is biased downwards, because <M>{"(1-x)^k"}</M> is convex.
        </p>
      </Proof>

      <Definition title="code verification">
        <p>
          A program is run in a sandbox against test cases, each a set of inputs and the expected output, with crashes counted
          as failures (<C>run_tests</C>). RL usually rewards only programs that pass every test (<C>binary_reward</C>), since partial
          credit rewards programs that handle easy cases and hard-code the rest. A verifier is judged like any classifier, by
          precision and recall against careful human grading (<C>precision_recall</C>).
        </p>
        <Code>{TESTS}</Code>
      </Definition>

      <Remark title="how verifiers are gamed">
        <p>
          Weak tests let wrong programs through, as the visualisation shows, so test suites are generated or strengthened with
          extra random and adversarial inputs. Agents with file access have rewritten tests, exited early with a success code, or
          detected the grader. Maths verifiers have been fooled by answers listing several candidates, or by formats the parser
          mishandles. The defences are a sandbox the policy cannot alter, hidden tests, strict output formats, and reading
          samples whenever reward rises suspiciously fast.
        </p>
      </Remark>

      <Example title="the estimator by hand">
        <p>
          Twenty samples, five correct, k = 2: <M>{"1 - \\binom{15}{2}/\\binom{20}{2} = 1 - 105/190 \\approx 0.447"}</M>, against a per-sample
          rate of 0.25.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "passk",
      rung: "check",
      prompt: <p>Ten samples for a problem include three correct ones. What is the unbiased estimate of pass@4? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.833, tolerance: 0.001 },
    },
    {
      key: "fp",
      rung: "check",
      prompt: (
        <p>
          A wrong program fails on 10% of random inputs. With what probability does it pass a suite of 20 independent random tests?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.122, tolerance: 0.001 },
    },
    {
      key: "partial",
      rung: "apply",
      prompt: <p>Why do RL pipelines for code usually reward only programs that pass all tests, rather than the fraction passed?</p>,
      answer: {
        kind: "choice",
        options: [
          "Partial credit rewards programs that solve the easy cases and hard-code or skip the rest, which the policy learns to exploit, while users need programs that are fully correct",
          "Computing the fraction passed is too slow",
          "Binary rewards have lower variance than fractional ones",
          "Fractions of tests cannot be used with PPO",
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

def extract_boxed(text):
    start = text.rfind("\\\\boxed{")
    if start < 0:
        return None
    i, depth = start + len("\\\\boxed{"), 1
    out = []
    while i < len(text):
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return "".join(out)
        out.append(ch)
        i += 1
    return None

def answers_match(pred, gold, tol):
    def to_number(s):
        s = s.replace(" ", "")
        try:
            if "/" in s:
                a, b = s.split("/")
                return float(a) / float(b)
            return float(s)
        except ValueError:
            return None
    a, b = to_number(pred), to_number(gold)
    if a is not None and b is not None:
        return abs(a - b) <= tol
    return pred.replace(" ", "") == gold.replace(" ", "")

def pass_at_k(n, c, k):
    if n - c < k:
        return 1.0
    return 1 - math.comb(n - c, k) / math.comb(n, k)

print(extract_boxed("so \\\\boxed{3/4}."), extract_boxed("\\\\boxed{1} then \\\\boxed{{2}}"), extract_boxed("none"))
print(answers_match("0.75", "3/4", 1e-9), answers_match(" x+1", "x + 1", 1e-9), pass_at_k(5, 0, 2), pass_at_k(5, 5, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3/4 {2} None\nTrue True 0.0 1.0",
          "3/4 1 None\nTrue True 0.0 1.0",
          "3/4 {2} None\nFalse True 0.0 1.0",
          "3/4. {2} None\nTrue False 0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def run_tests(fn, cases):
    passed = 0
    for args, expected in cases:
        try:
            if fn(*args) == expected:
                passed += 1
        except Exception:
            pass
    return passed / len(cases)

def binary_reward(frac):
    return 1.0 if frac == 1.0 else 0.0

def precision_recall(verdicts, truths):
    tp = sum(v and t for v, t in zip(verdicts, truths))
    fp = sum(v and not t for v, t in zip(verdicts, truths))
    fn = sum(t and not v for v, t in zip(verdicts, truths))
    return tp / (tp + fp), tp / (tp + fn)

print(run_tests(lambda x: x * 2, [((1,), 2), ((2,), 5), (("a",), "aa")]), binary_reward(2 / 3))
print(run_tests(lambda x: 1 // x, [((0,), 0), ((1,), 1)]), precision_recall([True, True, False], [True, False, True]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6666666666666666 0.0\n0.5 (0.5, 0.5)",
          "0.3333333333333333 0.0\n0.5 (0.5, 0.5)",
          "0.6666666666666666 1.0\n0.5 (0.5, 0.5)",
          "0.6666666666666666 0.0\n0.0 (0.5, 0.5)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>extract_boxed(text)</C>, returning the contents of the last boxed answer with nested braces, or None,{" "}
          <C>answers_match(pred, gold, tol)</C> and <C>pass_at_k(n, c, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def extract_boxed(text):
    start = text.find("\\\\boxed{")
    return text[start + 7:text.find("}", start)]

def answers_match(pred, gold, tol):
    return pred == gold

def pass_at_k(n, c, k):
    return 1 - (1 - c / n) ** k
`,
        solution: CHECK,
        tests: [
          { name: "box", code: `assert extract_boxed("a \\\\boxed{x} b \\\\boxed{{1},{2}}") == "{1},{2}" and extract_boxed("plain") is None and extract_boxed("\\\\boxed{open") is None\nassert answers_match("1/8", "0.125", 1e-9) and answers_match("y = 2", "y=2", 0.0) and not answers_match("0.5", "0.6", 0.01)` },
          { name: "pass", code: `assert abs(pass_at_k(20, 5, 2) - (1 - 105 / 190)) < 1e-12 and pass_at_k(4, 3, 2) == 1.0 and pass_at_k(6, 0, 3) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>run_tests(fn, cases)</C>, where each case is (args, expected) and an exception counts as a failure,{" "}
          <C>binary_reward(frac)</C> and <C>precision_recall(verdicts, truths)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def run_tests(fn, cases):
    return sum(fn(*args) == expected for args, expected in cases) / len(cases)

def binary_reward(frac):
    return frac

def precision_recall(verdicts, truths):
    return 1.0, 1.0
`,
        solution: TESTS,
        tests: [
          { name: "run", code: `assert run_tests(lambda s: s[0], [(("ab",), "a"), (("",), ""), (("c",), "c")]) == 2 / 3 and binary_reward(1.0) == 1.0 and binary_reward(0.99) == 0.0` },
          { name: "pr", code: `assert precision_recall([True, True, True, False], [True, True, False, True]) == (2 / 3, 2 / 3)` },
        ],
      },
    },
    {
      key: "edge",
      rung: "stretch",
      prompt: (
        <p>
          Wrong programs fail on a fraction f of random inputs, with density <M>{"9(1-f)^8"}</M> on [0, 1],
          so most bugs are rare. What share of wrong programs pass 10 independent random tests? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.474, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With a reliable verifier, what remains is the RL algorithm. The next lesson introduces GRPO, which drops PPO&apos;s value
        network by comparing samples for the same prompt with each other.
      </p>
    </>
  ),
};
