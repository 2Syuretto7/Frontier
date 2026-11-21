import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TestFilterViz } from "@/components/viz/TestFilterViz";
import type { LessonContent } from "@/lib/types";

const EXEC = `def run(src, env):
    try:
        exec(src, env)                                     # in practice: a sandbox with no network and a time limit
        return "ok", env.get("answer")
    except Exception as e:
        return "error", f"{type(e).__name__}: {e}"        # the model reads this and tries again

def pal_answer(src):
    status, value = run(src, {})
    return value if status == "ok" else None

def repair_loop(attempts):
    for i, src in enumerate(attempts):
        status, value = run(src, {})
        if status == "ok" and value is not None:
            return i, value
    return -1, None`;

const TESTS = `def pass_tests(f, tests):
    try:
        return all(f(x) == y for x, y in tests)
    except Exception:
        return False                                       # a crash is a failure

def false_pass(a, k):
    return a ** k                                          # a wrong program that agrees on a fraction a of inputs

def filtered_precision(p, a, k):
    return p / (p + (1 - p) * a ** k)`;

export const lesson: LessonContent = {
  id: "l13.2.2",
  minutes: 50,
  links: {
    requires: ["l13.2.1"],
    revisits: ["l9.7.1", "l13.1.5"],
    foreshadows: ["l13.3.1", "l13.5.1"],
  },

  puzzle: (
    <>
      <p>
        A word problem needs a dozen arithmetic steps. A chain of thought gets the plan right and then multiplies 347 by 29
        wrongly. If the model instead writes a short program and lets an interpreter run it, the arithmetic is exact, and an
        error message tells it what went wrong. But running code written by a model is risky, and a program that runs is not
        necessarily a program that is right. How should a model use an interpreter, and how far can passing tests be trusted?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Code splits a problem into the part a language model is good at, translating a description into steps, and the part
        a computer is good at, carrying them out exactly. The interpreter also gives feedback: an exception is a precise
        signal that something is wrong, which the model can read and fix. Tests give a stronger signal, but a wrong program
        that agrees with the right one on most inputs passes most tests, so the number and kind of tests decide how much a
        pass means.
      </p>
      <TestFilterViz />
    </>
  ),

  theory: (
    <>
      <Definition title="program-aided reasoning">
        <p>
          In program-aided language models (PAL) and program of thoughts, the model answers by writing a program whose final
          value is the answer, and the harness runs it (<C>run</C>, <C>pal_answer</C>). The model still reasons, in the
          structure of the program, while every computation is delegated. On arithmetic word problems this outperformed
          chains of thought with the same model, mostly by removing calculation errors.
        </p>
      </Definition>

      <Definition title="the execution loop">
        <p>
          When a program fails, the error type and message are returned as an observation, and the model writes a new
          attempt (<C>repair_loop</C>). Self-debugging adds the model&apos;s own explanation of the code and the failing
          output before the retry. A persistent interpreter, as in a notebook, keeps variables between calls, so the model can
          inspect data step by step. Code-as-action takes this further: instead of one JSON call per tool, the model writes a
          program that calls tools, loops and branches, composing many actions in one turn.
        </p>
        <Code>{EXEC}</Code>
      </Definition>

      <Theorem title="how much passing tests means">
        <p>
          Let a sampled program be correct with probability p, and let each wrong program agree with the correct output on a
          fraction a of inputs. On k test inputs drawn independently from that input distribution, a wrong program passes all
          of them with probability <M>{"a^k"}</M> (<C>false_pass</C>), and among programs that pass, the fraction that are
          correct is
        </p>
        <MD>{"\\frac{p}{p + (1-p)\\,a^k}"}</MD>
        <p>(<C>filtered_precision</C>).</p>
      </Theorem>
      <Proof>
        <p>
          The tests are independent and a wrong program passes each with probability a, so it passes all k with probability{" "}
          <M>{"a^k"}</M>; a correct program always passes (<C>pass_tests</C>). By Bayes&apos; rule the probability of being
          correct given a pass is <M>{"p \\cdot 1"}</M> over the total probability of passing,{" "}
          <M>{"p + (1-p)a^k"}</M>. If wrong programs differ in agreement, <M>{"a^k"}</M> is replaced by its average over them,
          which is dominated by the programs that are almost right.
        </p>
        <Code>{TESTS}</Code>
      </Proof>

      <Remark title="tests are not random">
        <p>
          The theorem assumes tests drawn from the same distribution as the inputs that matter. Real bugs hide in edge cases,
          empty lists, overflow, ties, that random inputs rarely hit, so a few targeted tests can be worth many random ones.
          Tests written by the same model that wrote the code may share its misunderstanding of the task; methods that score
          programs by agreement with many generated tests, rather than trusting each, reduce but do not remove this. In
          reinforcement learning with unit-test rewards, weak tests let a policy learn to pass them without solving the task,
          a theme of the fourth chapter.
        </p>
      </Remark>

      <Definition title="sandboxing">
        <p>
          Model-written code must run where it can do no harm: in a container or virtual machine with no network unless
          granted, a scratch file system, limits on CPU time and memory, and no access to the host&apos;s credentials. The{" "}
          <C>run</C> function here uses Python&apos;s <C>exec</C> only for illustration; it has none of these protections. The
          output of the program is again untrusted data, since it may contain text crafted to look like instructions.
        </p>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "pass",
      rung: "check",
      prompt: (
        <p>
          A wrong program agrees with the correct one on 80% of inputs. What is the probability that it passes 10 random
          tests?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1074, tolerance: 0.001 },
    },
    {
      key: "prec",
      rung: "check",
      prompt: (
        <p>
          10% of sampled programs are correct, and every wrong one agrees on 80% of inputs. Among programs that pass 10
          random tests, what fraction is correct?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5086, tolerance: 0.001 },
    },
    {
      key: "pal",
      rung: "apply",
      prompt: <p>Why does writing a program help on arithmetic word problems?</p>,
      answer: {
        kind: "choice",
        options: [
          "The model only has to translate the problem into steps; the interpreter carries them out exactly",
          "Programs are shorter than chains of thought",
          "The interpreter checks that the plan is correct",
          "Code is more common in pretraining data than arithmetic",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def run(src, env):
    try:
        exec(src, env)                                     # in practice: a sandbox with no network and a time limit
        return "ok", env.get("answer")
    except Exception as e:
        return "error", f"{type(e).__name__}: {e}"        # the model reads this and tries again

def pal_answer(src):
    status, value = run(src, {})
    return value if status == "ok" else None

def repair_loop(attempts):
    for i, src in enumerate(attempts):
        status, value = run(src, {})
        if status == "ok" and value is not None:
            return i, value
    return -1, None

print(run("answer = sum(range(5))", {}), run("answer = 1 / 0", {}))
print(pal_answer("x = 3\\nanswer = x * x + 1"), repair_loop(["answer = undefined_name", "answer = 2 ** 10"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('ok', 10) ('error', 'ZeroDivisionError: division by zero')\n10 (1, 1024)",
          "('ok', 15) ('error', 'ZeroDivisionError: division by zero')\n10 (1, 1024)",
          "('ok', 10) ('error', 'ZeroDivisionError: division by zero')\n10 (0, None)",
          "('ok', 10) ('ok', None)\n10 (1, 1024)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pass_tests(f, tests):
    try:
        return all(f(x) == y for x, y in tests)
    except Exception:
        return False                                       # a crash is a failure

def false_pass(a, k):
    return a ** k                                          # a wrong program that agrees on a fraction a of inputs

def filtered_precision(p, a, k):
    return p / (p + (1 - p) * a ** k)

print(pass_tests(lambda x: x * 2, [(1, 2), (3, 6)]), pass_tests(lambda x: 1 // x, [(0, 0)]), false_pass(0.5, 3))
print(round(filtered_precision(0.2, 0.5, 3), 4), round(filtered_precision(0.2, 0.9, 3), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False 0.125\n0.6667 0.2554",
          "True True 0.125\n0.6667 0.2554",
          "True False 0.125\n0.2554 0.6667",
          "True False 0.875\n0.6667 0.2554",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>run(src, env)</C> returning (&quot;ok&quot;, the value of <C>answer</C> or None) or (&quot;error&quot;,
          &quot;Type: message&quot;); <C>pal_answer(src)</C>; and <C>repair_loop(attempts)</C>, returning the index and value of
          the first attempt that runs and sets an answer, or (-1, None).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def run(src, env):
    exec(src, env)
    return "ok", None

def pal_answer(src):
    return None

def repair_loop(attempts):
    return -1, None
`,
        solution: EXEC,
        tests: [
          { name: "run", code: `assert run("answer = [1][2]", {}) == ("error", "IndexError: list index out of range") and run("y = 1", {}) == ("ok", None)` },
          { name: "loop", code: `assert repair_loop(["y = 2", "answer = int('x')", "answer = 7"]) == (2, 7) and pal_answer("answer = 6 * 7") == 42` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pass_tests(f, tests)</C> for (input, expected) pairs, treating an exception as a failure,{" "}
          <C>false_pass(a, k)</C>, and <C>filtered_precision(p, a, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pass_tests(f, tests):
    return True

def false_pass(a, k):
    return a

def filtered_precision(p, a, k):
    return p
`,
        solution: TESTS,
        tests: [
          { name: "tests", code: `assert pass_tests(lambda x: x + 1, [(1, 2), (2, 4)]) is False and pass_tests(lambda x: [][x], [(0, 0)]) is False` },
          { name: "prec", code: `assert false_pass(0.5, 2) == 0.25 and abs(filtered_precision(0.5, 0.5, 1) - 2 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "ntests",
      rung: "stretch",
      prompt: (
        <p>
          10% of sampled programs are correct and every wrong one agrees on 80% of inputs. What is the smallest number of
          random tests for which at least 90% of the programs that pass are correct?
        </p>
      ),
      answer: { kind: "numeric", value: 20, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Interpreters supply exact computation; what they cannot supply is knowledge the model lacks. Retrieval gives a model
        a search engine over documents, and with it the problem of finding the few passages that matter among millions.
      </p>
    </>
  ),
};
