import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.2.3";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

export const lesson: LessonContent = {
  id: "e0.2.3",
  minutes: 50,
  links: {
    revisits: ["e0.2.1", "e0.2.2"],
    parallels: ["m0.7.3"],
    foreshadows: ["e0.6.1", "e2.1.1"],
  },

  puzzle: (
    <>
      <p>Without running it, predict what this program prints:</p>
      <Playground code={`
n = 4729
s = 0
while n > 0:
    s = s + n % 10
    n = n // 10
print(s)
`} />
      <p>
        How confident are you? What could you write on paper, as you go, to make sure you do not lose track of the values?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Professional programmers predict what code does all the time: to check their own work, to read other people&rsquo;s
        code, and to find bugs. The reliable way is a <strong>trace table</strong>: a column for each variable, and a new row
        each time a value changes. For the puzzle, <C>n</C> goes 4729, 472, 47, 4, 0 while <C>s</C> goes 0, 9, 11, 18, 22. The
        program adds up the digits.
      </p>
      <p>
        Now trace the program below on paper, with columns <C>n</C> and <C>steps</C>, <em>before</em> stepping through.
        Then step through and compare your table at every row.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="state">
        <p>
          The <strong>state</strong> of a running program is everything it currently holds: the value of each variable,
          the line it is about to run, and what it has printed. Every statement changes the state in a definite way.
          Tracing means following these changes exactly, with no guessing.
        </p>
      </Definition>

      <Definition title="trace table">
        <p>A <strong>trace table</strong> is a written record of the state. To make one:</p>
        <ol>
          <li>Write a column for each variable, and one for output.</li>
          <li>Go through the program one statement at a time, as Python would.</li>
          <li>For each assignment, work out the new value from the <em>current</em> row, and write a new row.</li>
          <li>For each condition, work out True or False from the current row, and follow the branch or loop it chooses.</li>
        </ol>
      </Definition>

      <Example title="the digit sum">
        <table className="table">
          <thead>
            <tr><th>pass</th><th>n % 10</th><th>s</th><th>n</th></tr>
          </thead>
          <tbody>
            <tr><td>start</td><td></td><td>0</td><td>4729</td></tr>
            <tr><td>1</td><td>9</td><td>9</td><td>472</td></tr>
            <tr><td>2</td><td>2</td><td>11</td><td>47</td></tr>
            <tr><td>3</td><td>7</td><td>18</td><td>4</td></tr>
            <tr><td>4</td><td>4</td><td>22</td><td>0</td></tr>
          </tbody>
        </table>
        <p>
          After pass 4, <C>n &gt; 0</C> is false, so the loop ends and 22 is printed. The table also reveals the idea:{" "}
          <C>n % 10</C> takes off the last digit and <C>n // 10</C> removes it.
        </p>
      </Example>

      <Example title="checking the boundaries of a loop">
        <p>
          Many bugs are <strong>off-by-one errors</strong>: a loop that runs once too often or once too few times. To check a
          loop, trace three things carefully: the first pass, the last pass, and how many passes there are. A loop meant to
          print 1 to 10 written with <C>range(1, 10)</C> passes the first check but fails the last, because the range stops
          before 10.
        </p>
      </Example>

      <Remark title="why trace when you can run">
        <p>
          A computer will run the program for you, so why trace by hand? Because running tells you <em>what</em> happens,
          while tracing tells you <em>why</em>. When a program misbehaves, the bug is found at the first row where the real
          state differs from the state you expected, and you can only notice that if you know what to expect. Tracing is
          also how you read code you cannot run, such as code in a paper or an interview.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "table",
      rung: "check",
      prompt: <p>In a trace table, when do you write a new row?</p>,
      answer: {
        kind: "choice",
        options: ["Whenever a variable's value changes", "Once per line of the program text", "Only when something is printed"],
        correct: [0],
      },
    },
    {
      key: "first",
      rung: "check",
      prompt: <p>In the traced program, starting from <C>n = 6</C>, what is <C>n</C> after the first pass of the loop?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "fib",
      rung: "apply",
      prompt: (
        <>
          <p>Trace this program. What does it print?</p>
          <Code>{`
a = 1
b = 1
for i in range(5):
    c = a + b
    a = b
    b = c
print(b)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "passes",
      rung: "apply",
      prompt: <p>In the digit-sum program of the puzzle, how many times does the loop body run when <C>n</C> starts at 4729?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "seven",
      rung: "apply",
      prompt: <p>Change the first line of the traced program to <C>n = 7</C>. Trace it on paper. How many steps are printed?</p>,
      answer: { kind: "numeric", value: 16 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a, b = 1, 1
for i in range(4):
    a, b = b, a + b
print(a, b)`}</Code>
          <p>Trace the table of a and b through four passes. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5 8", "3 5", "8 13", "4 5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            This function should return the largest number in a non-empty list, but it has a bug that a hand trace on <C>[-3, -1, -2]</C> reveals. Fix it.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def largest(xs):
    best = 0
    for x in xs:
        if x > best:
            best = x
    return best
`,
        solution: `def largest(xs):
    best = xs[0]
    for x in xs:
        if x > best:
            best = x
    return best
`,
        tests: [
          { name: "positive", code: `assert largest([3, 9, 2]) == 9, 'The largest of 3, 9, 2 is 9.'` },
          { name: "negative", code: `assert largest([-3, -1, -2]) == -1, 'Starting best at 0 is wrong when every number is negative.'` },
        ],
      },
    },
    {
      key: "offbyone",
      rung: "prove",
      prompt: (
        <p>
          A loop is meant to add up the numbers from 1 to 10 but is written with <C>range(1, 10)</C>. Show how tracing the
          first pass, the last pass and the number of passes reveals the bug, and fix it. Then explain why it is worth
          checking these three things for every loop you write.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Traces the first pass correctly (the loop variable is 1).",
          "Traces the last pass and finds the loop variable is 9, not 10, so the loop runs 9 times instead of 10.",
          "Fixes it with range(1, 11).",
          "Explains that errors in loops cluster at the boundaries, so checking the ends and the count catches the commonest mistakes cheaply.",
        ],
      },
    },
    {
      key: "mixed",
      rung: "stretch",
      prompt: (
        <>
          <p>Trace this program. What does it print?</p>
          <Code>{`
x = 0
for i in range(1, 6):
    if i % 2 == 0:
        x = x - i
    else:
        x = x + i * i
print(x)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 29 },
    },
  ],

  teachBack:
    "Explain to a friend how to build a trace table for a program with a loop, and why tracing the first pass, the last pass and the number of passes catches so many bugs.",

  glimpse: (
    <p>
      This completes Control flow. Next, functions, which let you name a block of code and reuse it. Tracing returns in
      Debugging by experiment at the end of this course, and in Data Structures and Algorithms you will reason about loops
      without tracing every pass, using invariants and counts.
    </p>
  ),
};
