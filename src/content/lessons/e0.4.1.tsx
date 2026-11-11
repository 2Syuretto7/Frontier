import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IndexViz } from "@/components/viz/IndexViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.4.1",
  minutes: 50,
  links: {
    revisits: ["e0.2.2"],
    parallels: ["m0.7.1"],
    foreshadows: ["e2.2.1", "e1.5.1", "e1.5.4"],
  },

  puzzle: (
    <>
      <p>
        A teacher has the marks of 40 students and wants the average, the highest mark, and the marks sorted from top to
        bottom.
      </p>
      <p>
        With what you know so far, you would need 40 variables, <C>mark1</C> to <C>mark40</C>, and very long expressions.
        What would you want instead? What should you be able to do with such a thing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        You want a single name for the whole collection, a way to reach any one mark by its position, and a loop that visits
        each in turn. Python&rsquo;s <strong>list</strong> provides all three. A list is written in square brackets, with
        its items separated by commas.
      </p>
      <p>
        Each item has an <strong>index</strong>, its position counted from 0. Choose an index, then switch to slices, which
        pick out a run of items at once.
      </p>
      <IndexViz name="nums" items={["3", "1", "4", "1", "5", "9", "2", "6"]} kind="list" />
    </>
  ),

  theory: (
    <>
      <Definition title="list">
        <p>
          A <strong>list</strong> is an ordered sequence of values, such as <C>[70, 85, 60]</C>. The items can be of any
          type, and of mixed types, though usually they are alike. <C>[]</C> is the empty list, and <C>len(xs)</C> is the
          number of items in <C>xs</C>.
        </p>
      </Definition>

      <Definition title="indexing">
        <p>
          <C>xs[i]</C> is the item at index <C>i</C>. The first item has index 0 and the last has index{" "}
          <C>len(xs) - 1</C>. Negative indices count from the end: <C>xs[-1]</C> is the last item. Using an index outside
          this range stops the program with an <C>IndexError</C>.
        </p>
      </Definition>

      <Definition title="slicing">
        <p>
          <C>xs[start:stop]</C> is a new list of the items from index <C>start</C> up to, but not including,{" "}
          <C>stop</C>, just like <C>range</C>. Either end may be left out: <C>xs[:3]</C> is the first three items and{" "}
          <C>xs[-3:]</C> the last three. An optional third number is the step: <C>xs[::2]</C> takes every second item, and{" "}
          <C>xs[::-1]</C> is the list reversed. Slices never raise an error; out-of-range positions are simply clipped.
        </p>
      </Definition>

      <Definition title="changing a list">
        <p>Lists are <strong>mutable</strong>: they can be changed after they are made.</p>
        <Code>{`
scores = [70, 85, 60]
scores[1] = 90        # [70, 90, 60]
scores.append(75)     # [70, 90, 60, 75]
scores.insert(0, 50)  # [50, 70, 90, 60, 75]
scores.pop()          # removes and returns 75
scores.sort()         # [50, 60, 70, 90]
`}</Code>
        <p>
          Functions such as <C>len</C>, <C>sum</C>, <C>max</C>, <C>min</C> and <C>sorted</C> work on any list of numbers,
          and <C>x in xs</C> tests whether <C>x</C> is an item. A <C>for</C> loop visits the items in order:{" "}
          <C>for s in scores:</C>.
        </p>
      </Definition>

      <Example title="the teacher's problem">
        <Code>{`
marks = [72, 85, 64, 91, 78]
average = sum(marks) / len(marks)     # 78.0
top = max(marks)                      # 91
ranked = sorted(marks, reverse=True)  # [91, 85, 78, 72, 64]
`}</Code>
        <p>The same three lines work for 5 marks or 5 million.</p>
      </Example>

      <Remark title="two names, one list">
        <p>
          After <C>b = a</C>, the names <C>a</C> and <C>b</C> refer to the <em>same</em> list, not to two copies. Appending
          to <C>b</C> changes what <C>a</C> sees too, because there is only one list. This is called{" "}
          <strong>aliasing</strong>. To get an independent copy, write <C>b = a.copy()</C> or <C>b = a[:]</C>. Ints and
          strings cannot be changed in place, so aliasing never surprises you with them; it matters for mutable values such
          as lists.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "zero",
      rung: "check",
      prompt: <p>With <C>nums = [3, 1, 4, 1, 5, 9, 2, 6]</C>, what is <C>nums[0]</C>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "last",
      rung: "check",
      prompt: <p>With the same list, what is <C>nums[-1]</C>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "slicelen",
      rung: "apply",
      prompt: <p>How many items are in <C>nums[2:6]</C>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "alias",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
a = [1, 2, 3]
b = a
b.append(4)
print(len(a))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "total",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
scores = [70, 85, 60]
scores[1] = 90
scores.append(75)
total = 0
for s in scores:
    total = total + s
print(total)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 295 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [3, 1, 4, 1, 5]
ys = xs
ys.append(9)
print(len(xs), xs[-2], xs[1:3])`}</Code>
          <p>Two names for one list. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6 5 [1, 4]", "5 1 [1, 4]", "6 5 [1, 4, 1]", "6 9 [3, 1]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>running_total(xs)</C>, which returns a new list whose i-th entry is the sum of xs[0] to xs[i]. Do not change xs.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def running_total(xs):
    for i in range(1, len(xs)):
        xs[i] += xs[i - 1]
    return xs
`,
        solution: `def running_total(xs):
    out, s = [], 0
    for x in xs:
        s += x
        out.append(s)
    return out
`,
        tests: [
          { name: "values", code: `assert running_total([3, 1, 4]) == [3, 4, 8] and running_total([]) == [], 'Keep a running sum and append it.'` },
          { name: "unchanged", code: `xs = [1, 2, 3]
running_total(xs)
assert xs == [1, 2, 3], 'Build a new list; do not change the one you were given.'` },
        ],
      },
    },
    {
      key: "copy",
      rung: "prove",
      prompt: (
        <p>
          A function is given a list of marks, sorts it with <C>marks.sort()</C> to find the median, and returns the median.
          Afterwards the caller finds that their own list has been reordered. Explain why, and show two ways to fix the
          function so that the caller&rsquo;s list is left alone.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that the parameter refers to the same list object as the caller's variable (aliasing), not a copy.",
          "Explains that sort changes the list in place, so the caller sees the change.",
          "Fixes it by sorting a copy, for example ordered = sorted(marks), or marks.copy() or marks[:] before sorting.",
          "Gives two distinct correct fixes.",
        ],
      },
    },
    {
      key: "step",
      rung: "stretch",
      prompt: <p>With <C>nums = [3, 1, 4, 1, 5, 9, 2, 6]</C>, what is <C>sum(nums[1:7:2])</C>?</p>,
      answer: { kind: "numeric", value: 11 },
    },
  ],

  teachBack:
    "Explain to a friend how list indices and negative indices work, how a slice xs[start:stop:step] picks out items, and why b = a does not copy a list.",

  glimpse: (
    <p>
      Next, dictionaries, which look values up by name rather than by position. In Data Structures and Algorithms you will see
      how a list grows in memory as you append to it, and in Python, NumPy and the Command Line you will index and slice
      arrays of millions of numbers, where the difference between a view and a copy matters a great deal.
    </p>
  ),
};
