import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.2.2";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.2.2",
  minutes: 50,
  links: {
    revisits: ["e0.2.1"],
    parallels: ["m0.7.2", "m0.7.1"],
    foreshadows: ["e2.1.1", "e1.5.2"],
  },

  puzzle: (
    <>
      <p>
        You need a program that adds up the whole numbers from 1 to 1,000. Writing <C>1 + 2 + 3 + &hellip;</C> out in full
        would take a thousand terms.
      </p>
      <p>
        Describe in words a short procedure, a few instructions long, that a helper could repeat to get the answer for any
        upper limit, not just 1,000. What does the helper need to remember from one repetition to the next?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The helper needs two things: a running total, and the number they have reached. Each repetition adds the current
        number to the total and moves on to the next. A <strong>loop</strong> tells Python to repeat a block, and the same
        few lines then work for 4 numbers or 4 billion.
      </p>
      <p>
        The program below has two loops. The first, a <C>for</C> loop, runs once for each number in a range. The second, a{" "}
        <C>while</C> loop, keeps halving a number for as long as it is bigger than 1. Watch the highlighted line jump back
        up.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="for loops and range">
        <p>
          <C>for name in sequence:</C> runs its block once for each item of the sequence, with <C>name</C> bound to that
          item. The commonest sequence is a <C>range</C>:
        </p>
        <ul>
          <li><C>range(5)</C> gives 0, 1, 2, 3, 4: five numbers, starting at 0.</li>
          <li><C>range(1, 5)</C> gives 1, 2, 3, 4: it starts at the first number and stops <em>before</em> the second.</li>
          <li><C>range(2, 10, 3)</C> gives 2, 5, 8: the third number is the step. <C>range(5, 0, -2)</C> counts down: 5, 3, 1.</li>
        </ul>
      </Definition>

      <Definition title="while loops">
        <p>
          <C>while condition:</C> checks the condition, runs the block if it is true, and repeats. It stops the first time
          the condition is false when checked. Use <C>for</C> when you know in advance what to loop over, and{" "}
          <C>while</C> when you loop until something happens.
        </p>
      </Definition>

      <Definition title="break and continue">
        <p>
          Inside a loop, <C>break</C> leaves the loop at once, and <C>continue</C> skips the rest of the block and goes on to
          the next repetition. Both are useful, but a loop with many of them is hard to follow.
        </p>
      </Definition>

      <Example title="the accumulator pattern">
        <Code>{`
total = 0
for n in range(1, 1001):
    total = total + n
print(total)    # 500500
`}</Code>
        <p>
          A variable that starts at a neutral value and is updated on every pass is called an <strong>accumulator</strong>.
          Starting at 0 suits sums; for a product, start at 1. This is the summation sign of mathematics turned into
          instructions: <C>total</C> after the loop is the sum of <em>n</em> for <em>n</em> from 1 to 1,000.
        </p>
      </Example>

      <Remark title="loops that never end">
        <p>
          If a <C>while</C> condition never becomes false, the loop runs forever: for example, forgetting the line that
          halves <C>x</C> in the program above. The program seems to freeze; press Ctrl and C together to stop it. Before
          writing a <C>while</C> loop, ask what changes on each pass and why that change must eventually make the condition
          false.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "range",
      rung: "check",
      prompt: <p>Which numbers does <C>range(1, 5)</C> give?</p>,
      answer: { kind: "choice", options: ["1, 2, 3, 4", "1, 2, 3, 4, 5", "0, 1, 2, 3, 4"], correct: [0] },
    },
    {
      key: "step",
      rung: "check",
      prompt: <p>How many numbers does <C>range(2, 10, 3)</C> give?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "hundred",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
total = 0
for n in range(1, 101):
    total = total + n
print(total)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 5050 },
    },
    {
      key: "nested",
      rung: "apply",
      prompt: (
        <>
          <p>A loop inside a loop. What does this program print?</p>
          <Code>{`
t = 0
for i in range(3):
    for j in range(4):
        t = t + 1
print(t)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "triple",
      rung: "apply",
      prompt: (
        <>
          <p>What value of <C>count</C> does this program print?</p>
          <Code>{`
n = 1
count = 0
while n < 100:
    n = n * 3
    count = count + 1
print(count)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "forever",
      rung: "prove",
      prompt: (
        <p>
          Give an example of a <C>while</C> loop that never ends, explain why it never ends, and fix it. Then explain in
          general how you can convince yourself that a <C>while</C> loop will stop.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a loop whose condition stays true forever, for example because the variable in the condition is never changed.",
          "Explains why the condition is checked and found true on every pass.",
          "Fixes it so that each pass changes the variable towards making the condition false.",
          "States the general argument: identify a quantity that changes on every pass and must eventually make the condition false (for example a whole number that decreases and cannot go below a bound).",
        ],
      },
    },
    {
      key: "breakcont",
      rung: "stretch",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
k = 0
for n in range(10):
    if n == 6:
        break
    if n % 2 == 1:
        continue
    k = k + n
print(k)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between a for loop and a while loop, what range(a, b, step) produces, and how an accumulator adds up a sequence.",

  glimpse: (
    <p>
      Next, a skill every programmer relies on: tracing a program by hand to predict exactly what it does. In Data Structures
      and Algorithms you will count how many times a loop runs as the input grows, and in Python, NumPy and the Command Line
      you will learn to replace slow Python loops with fast operations on whole arrays.
    </p>
  ),
};
