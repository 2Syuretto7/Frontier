import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.6.1";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.6.1",
  minutes: 50,
  links: {
    revisits: ["e0.2.3", "e0.3.2"],
    parallels: ["l0.5.3"],
    foreshadows: ["e4.2.1", "e4.2.2", "e4.2.3"],
  },

  puzzle: (
    <>
      <p>
        A function that should return the average of a list returns 1.33 for <C>[4, 8, 6]</C>, instead of 6.0. You
        stare at the code for ten minutes and it looks right.
      </p>
      <p>
        Staring is not working. What could you <em>do</em>, rather than think harder, to find out where the program goes
        wrong? Describe an approach that would work even on a program of a thousand lines.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Treat the program like a natural phenomenon you are investigating. You know what it <em>should</em> do at each step;
        run it and observe what it <em>does</em>. The bug is at the first point where the two differ. Trace the faulty
        function below, predicting each step before you press Next.
      </p>
      <TraceViz code={code} steps={steps} />
      <p>
        Everything matched until line 5 ran during the first pass. The indentation of one line put the <C>return</C> inside
        the loop. The code &ldquo;looked right&rdquo; because the eye reads intentions; the experiment shows behaviour.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="debugging as an experiment">
        <p>Effective debugging follows the scientific method:</p>
        <ol>
          <li><strong>Reproduce</strong> the failure reliably, with a specific input that shows it.</li>
          <li><strong>Observe</strong>: how exactly does the output differ from what you expected?</li>
          <li><strong>Hypothesise</strong> a cause that would explain all the observations.</li>
          <li><strong>Predict</strong> something the hypothesis implies, such as the value of a variable at some line.</li>
          <li><strong>Test</strong> the prediction by printing that value or tracing. If it fails, the hypothesis is wrong; form another.</li>
        </ol>
        <p>Only when a hypothesis has survived a test should you change the code, and then test again.</p>
      </Definition>

      <Definition title="minimal reproduction">
        <p>
          A <strong>minimal reproduction</strong> is the smallest input and the shortest code that still show the bug. Cut
          away everything you can while the bug stays. Often the bug becomes obvious along the way, and if it does not, the
          small example is easy to share with someone who can help.
        </p>
      </Definition>

      <Definition title="bisection">
        <p>
          When a long computation gives a wrong final answer, check the state halfway through. If it is already wrong, the bug
          is in the first half; otherwise it is in the second. Repeat on the guilty half. Each check halves the search, so 10
          checks narrow 1,024 steps down to one. The same idea finds which of many changes to a program introduced a bug.
        </p>
      </Definition>

      <Example title="printing as a probe">
        <Code>{`
def average(nums):
    total = 0
    for n in nums:
        total = total + n
        print("after", n, "total is", total)   # probe
        return total / len(nums)
`}</Code>
        <p>
          The probe prints a single line, &ldquo;after 4 total is 4&rdquo;, though the loop should have printed three. That
          one observation shows the loop stops early, and the fix is to move the <C>return</C> out of the loop. Remove
          probes once the bug is fixed.
        </p>
      </Example>

      <Remark title="habits that help">
        <p>
          Change one thing at a time, or you will not know which change mattered. Keep a note of what you have tried.
          Explaining the code aloud, line by line, to a friend or even to an object on your desk, often reveals the bug
          halfway through, because explaining forces you to read what is written rather than what you meant. Machine learning
          code is especially hard to debug because a wrong program often still runs and produces plausible numbers, so these
          habits matter even more there.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: <p>What should you do first when you hear that a program sometimes gives a wrong answer?</p>,
      answer: { kind: "choice", options: ["Find an input that makes the failure happen reliably", "Rewrite the part you suspect", "Add try and except around everything"], correct: [0] },
    },
    {
      key: "line",
      rung: "check",
      prompt: <p>In the traced program, on which line is the bug?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "bisect",
      rung: "apply",
      prompt: <p>A pipeline has 1,024 stages and the output is wrong. If each check of the state between two stages tells you whether the error has already appeared, how many checks are needed, at most, to find the first faulty stage by bisection?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "evens",
      rung: "apply",
      prompt: (
        <>
          <p>This function should count the even numbers. What does the program print?</p>
          <Code>{`
def count_evens(nums):
    count = 0
    for n in nums:
        if n % 2 == 1:
            count = count + 1
    return count

print(count_evens([2, 4, 5, 6]))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "hypothesis",
      rung: "apply",
      prompt: (
        <p>
          A function meant to return the largest number in a list returns 0 for <C>[-5, -2, -9]</C> but works for lists of
          positive numbers. Which hypothesis best explains every observation?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The running maximum starts at 0, which is larger than every item in an all-negative list",
          "The loop skips the last item",
          "Python cannot compare negative numbers",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def average(xs):
    total = 0
    for x in xs:
        total += x
        print("total so far", total)
    return total / len(xs)
average([4, 8])`}</Code>
          <p>Print statements expose what a loop is doing. What is the last line printed?</p>
        </>
      ),
      answer: { kind: "choice", options: ["total so far 12", "total so far 8", "6.0", "total so far 4"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            This function should return the middle value of a list after sorting, but it is wrong for lists of even length. Experiment with small inputs to find the bug, then fix it so even-length lists give the mean of the middle two.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def median(xs):
    s = sorted(xs)
    return s[len(s) // 2]
`,
        solution: `def median(xs):
    s = sorted(xs)
    n = len(s)
    if n % 2:
        return s[n // 2]
    return (s[n // 2 - 1] + s[n // 2]) / 2
`,
        tests: [
          { name: "odd", code: `assert median([3, 1, 2]) == 2, 'Odd length: the middle value.'` },
          { name: "even", code: `assert median([4, 1, 3, 2]) == 2.5, 'Even length: average the two middle values.'` },
        ],
      },
    },
    {
      key: "method",
      rung: "prove",
      prompt: (
        <p>
          A program that totals a shop&rsquo;s daily sales from a file gives a total that is slightly too high on some days
          but not others. Describe, step by step, how you would find the bug using the method of this lesson. Be specific
          about the experiments you would run.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Starts by finding a specific day's file that reproduces the wrong total, and computes the correct total independently.",
          "Narrows the input to a minimal reproduction, for example by removing rows while the error persists.",
          "Forms a concrete hypothesis (for example a row counted twice, a header or blank line, or a refund handled wrongly) and a prediction that tests it.",
          "Tests with probes or tracing, changes one thing at a time, and re-runs the reproduction after the fix.",
        ],
      },
    },
    {
      key: "lastn",
      rung: "stretch",
      prompt: (
        <>
          <p>This function should return the last <C>n</C> items. What does the program print?</p>
          <Code>{`
def last_n(xs, n):
    return xs[len(xs) - n : len(xs) - 1]

print(sum(last_n([1, 2, 3, 4, 5], 3)))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 7 },
    },
  ],

  teachBack:
    "Explain to a friend how to debug a program by experiment: reproduce, observe, hypothesise, predict and test, and how bisection finds a bug quickly in a long computation.",

  glimpse: (
    <p>
      Next, testing by hand: choosing inputs that are likely to reveal bugs before anyone else finds them. Software
      Engineering for ML Research has a whole chapter on debugging, including minimal reproductions and tools that bisect
      automatically.
    </p>
  ),
};
