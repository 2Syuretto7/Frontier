import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.2.2";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

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
        <Playground code={`
total = 0
for n in range(1, 1001):
    total = total + n
print(total)    # 500500
`} />
        <p>
          A variable that starts at a neutral value and is updated on every pass is called an <strong>accumulator</strong>.
          Starting at 0 suits sums; for a product, start at 1. This is the summation sign of mathematics turned into
          instructions: <C>total</C> after the loop is the sum of <em>n</em> for <em>n</em> from 1 to 1,000.
        </p>
      </Example>

      <Example title="looping over a list">
        <p>
          A <C>for</C> loop can walk through a list directly. Two helpers are common: <C>enumerate</C> gives each
          item with its position, and <C>zip</C> walks two lists side by side.
        </p>
        <Code>{`
marks = [70, 85, 60]
names = ["Asha", "Ravi", "Meera"]
for i, m in enumerate(marks):
    print(i, m)          # 0 70, then 1 85, then 2 60
for name, m in zip(names, marks):
    print(name, m)       # Asha 70, then Ravi 85, then Meera 60
`}</Code>
      </Example>

      <Definition title="a loop in one line">
        <p>
          Building a new list from an old one is so common that Python has a short form for it, the{" "}
          <strong>list comprehension</strong>. The two programs below build the same list:
        </p>
        <Code>{`
squares = []
for x in range(5):
    squares.append(x * x)

squares = [x * x for x in range(5)]       # [0, 1, 4, 9, 16]
`}</Code>
        <p>
          An <C>if</C> at the end keeps only some items: <C>[x for x in marks if x &gt;= 65]</C> is <C>[70, 85]</C>.
          The same form inside <C>sum</C>, <C>min</C> or <C>max</C> needs no brackets: <C>sum(x * x for x in range(5))</C>{" "}
          is <C>30</C>.
        </p>
      </Definition>

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
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`n, steps = 6, 0
while n != 1:
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
print(steps)`}</Code>
          <p>Trace the loop from n = 6. How many steps until n is 1?</p>
        </>
      ),
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`total = 0
for i in range(1, 10, 3):
    total += i
n, steps = 10, 0
while n != 1:
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
print(total, steps)`}</Code>
          <p>A for loop with a step, and a while loop that runs until a condition fails. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["12 6", "15 6", "12 7", "22 6"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>count_vowels(text)</C>, which loops over the characters of a string and counts the vowels a, e, i, o and u, in either case.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_vowels(text):
    count = 0
    for ch in text:
        if ch in 'aeiou':
            count += 1
    return count
`,
        solution: `def count_vowels(text):
    count = 0
    for ch in text:
        if ch.lower() in 'aeiou':
            count += 1
    return count
`,
        tests: [
          { name: "simple", code: `assert count_vowels('banana') == 3 and count_vowels('') == 0, 'Loop over each character.'` },
          { name: "capitals", code: `assert count_vowels('Indian Ocean') == 6, 'Capital vowels count too.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>primes_upto(n)</C>, the list of primes ≤ n, by the sieve of Eratosthenes: make a list of n + 1 flags, and for each p from 2 while p · p ≤ n that is still marked prime, cross out p², p² + p, …. Then write <C>collatz_steps(n)</C>, the number of steps for n to reach 1 (halve when even, 3n + 1 when odd), and <C>longest_collatz(limit)</C>, the start below limit with the most steps (the smallest on ties) as a tuple (start, steps).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def primes_upto(n):
    return []

def collatz_steps(n):
    return 0

def longest_collatz(limit):
    return (1, 0)
`,
        solution: `def primes_upto(n):
    if n < 2:
        return []
    flags = [True] * (n + 1)
    flags[0] = flags[1] = False
    p = 2
    while p * p <= n:
        if flags[p]:
            for m in range(p * p, n + 1, p):
                flags[m] = False
        p += 1
    return [i for i in range(n + 1) if flags[i]]

def collatz_steps(n):
    steps = 0
    while n != 1:
        n = n // 2 if n % 2 == 0 else 3 * n + 1
        steps += 1
    return steps

def longest_collatz(limit):
    best = (1, 0)
    for s in range(1, limit):
        k = collatz_steps(s)
        if k > best[1]:
            best = (s, k)
    return best
`,
        tests: [
          { name: "small", code: `assert primes_upto(30) == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29] and primes_upto(1) == [] and primes_upto(2) == [2]` },
          { name: "many", code: `ps = primes_upto(100000)
assert len(ps) == 9592 and ps[-1] == 99991, 'There are 9592 primes below 100000; the sieve makes this fast.'` },
          { name: "collatz", code: `assert collatz_steps(1) == 0 and collatz_steps(10) == 6 and collatz_steps(27) == 111` },
          { name: "longest", code: `assert longest_collatz(10) == (9, 19) and longest_collatz(1000) == (871, 178) and longest_collatz(2) == (1, 0)` },
        ],
      },
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
