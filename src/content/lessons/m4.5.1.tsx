import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { InsertionSortViz } from "@/components/viz/InsertionSortViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.5.1",
  minutes: 55,
  links: {
    requires: ["m4.4.2", "m1.5.1", "e0.2.3"],
    foreshadows: ["m4.5.2", "e2.1.1", "e2.5.1"],
  },

  puzzle: (
    <>
      <p>
        You have written a sorting function and tested it on a hundred lists. It passed every time. Do you know it is correct?
        What would it take to know that it sorts every list, including ones you will never try?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An algorithm is a precise, finite recipe. To trust one you need two arguments: that it stops, and that when it stops
        the answer is right. For loops, the second argument is a <em>loop invariant</em>: a statement true before every pass.
        In insertion sort below, the invariant is that the shaded prefix is sorted. Step through and watch it hold.
      </p>
      <InsertionSortViz />
    </>
  ),

  theory: (
    <>
      <Definition title="algorithm">
        <p>
          An <strong>algorithm</strong> is a finite sequence of precise instructions that takes an input and, after finitely
          many steps, produces an output. It solves a <strong>problem</strong> if for every valid input the output satisfies
          the problem&rsquo;s specification.
        </p>
      </Definition>

      <Definition title="loop invariant">
        <p>
          A <strong>loop invariant</strong> is a statement about the program&rsquo;s variables that holds before the loop
          starts (<em>initialisation</em>) and, if it holds before one pass, holds after it (<em>maintenance</em>). It is
          induction on the number of passes. Combined with the condition that ends the loop, it should imply the result
          (<em>termination</em>).
        </p>
      </Definition>

      <Theorem title="insertion sort is correct">
        <p>
          For i = 1, …, n − 1, insertion sort moves a[i] left past every larger element before it. When it finishes, the list
          is sorted.
        </p>
      </Theorem>
      <Proof>
        <p>
          Invariant: before pass i, the prefix a[0..i − 1] holds the original first i elements in sorted order. Initially the
          prefix a[0..0] has one element, so it is sorted. Pass i shifts a[i] left past exactly the elements of the prefix that
          are larger than it, so the prefix a[0..i] is sorted and holds the first i + 1 original elements. After the last pass,
          i = n, and the invariant says the whole list is sorted. The algorithm stops because each pass is a finite loop.
        </p>
      </Proof>

      <Definition title="termination by a decreasing quantity">
        <p>
          To show a loop stops, find a <strong>variant</strong>: a non-negative integer that strictly decreases each pass. By
          well-ordering it cannot decrease forever.
        </p>
      </Definition>
      <Example title="Euclid's algorithm">
        <p>
          Invariant: gcd(a, b) equals the gcd of the original inputs. Variant: b, which drops to a mod b &lt; b each pass. When
          b = 0, the invariant gives gcd(a, 0) = a as the answer.
        </p>
      </Example>

      <Example title="binary search">
        <p>
          To find x in a sorted list, keep an interval [lo, hi) that must contain x if x is present (invariant). Compare x with
          the middle element and discard the half that cannot contain it. The variant hi − lo at least halves, so about{" "}
          <M>{"\\log_2 n"}</M> passes suffice.
        </p>
      </Example>

      <Definition title="cost">
        <p>
          The <strong>running time</strong> of an algorithm on an input is the number of basic steps it takes, such as
          comparisons. Insertion sort on n items makes at most <M>{"\\binom{n}{2} = n(n-1)/2"}</M> comparisons, attained by a
          reversed list, and at least n − 1, attained by a sorted one. The next lesson gives the language for comparing such
          counts.
        </p>
      </Definition>

      <Remark title="testing and proving">
        <p>
          Tests check finitely many inputs, so they can show a bug but never its absence. An invariant argument covers every
          input. In practice you want both: the proof tells you the idea is right, and tests catch slips in turning the idea
          into code.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "comps",
      rung: "check",
      prompt: <p>How many comparisons does insertion sort make on a reversed list of 10 items?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "sorted",
      rung: "check",
      prompt: <p>How many comparisons does insertion sort make on an already sorted list of 10 items?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "binary",
      rung: "apply",
      prompt: <p>What is the largest number of comparisons binary search needs on a sorted list of 1000 items, comparing x with one middle element per pass and stopping when the interval has one element?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "inversions",
      rung: "apply",
      prompt: <p>Each swap in insertion sort fixes one inversion (a pair out of order). How many swaps does it make on the list 3, 1, 4, 1, 5, 9, 2, 6?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def largest(xs):
    best = xs[0]
    for x in xs[1:]:
        if x > best:
            best = x
    return best
print(largest([-5, -2, -9]), largest([4]))`}</Code>
          <p>A loop with the invariant 'best is the largest seen so far'. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-2 4", "0 4", "-9 4", "-2 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>insertion_sort(xs)</C>, which sorts a copy of the list by insertion and returns (sorted list, number of comparisons), counting each comparison of two elements. Check your count against the lesson: n(n − 1)/2 on reversed input and n − 1 on sorted input.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def insertion_sort(xs):
    return sorted(xs), 0
`,
        solution: `def insertion_sort(xs):
    a = list(xs)
    comps = 0
    for i in range(1, len(a)):
        j = i
        while j > 0:
            comps += 1
            if a[j - 1] > a[j]:
                a[j - 1], a[j] = a[j], a[j - 1]
                j -= 1
            else:
                break
    return a, comps
`,
        tests: [
          { name: "sorts", code: `import random
random.seed(1)
xs = [random.randint(0, 99) for _ in range(50)]
ys, _ = insertion_sort(xs)
assert ys == sorted(xs), 'The result must be sorted.'` },
          { name: "counts", code: `assert insertion_sort(list(range(10, 0, -1)))[1] == 45 and insertion_sort(list(range(10)))[1] == 9, 'Reversed: n(n − 1)/2 comparisons; sorted: n − 1.'` },
          { name: "copy", code: `xs = [3, 1, 2]
insertion_sort(xs)
assert xs == [3, 1, 2], 'Sort a copy, not the caller’s list.'` },
        ],
      },
    },
    {
      key: "maxinv",
      rung: "prove",
      prompt: (
        <p>
          Write an algorithm that finds the largest element of a non-empty list in one pass, state a loop invariant, and use it
          to prove the algorithm correct.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Keeps best = a[0] and updates best when a later element is larger.",
          "States the invariant: before examining a[i], best is the largest of a[0..i − 1].",
          "Checks initialisation, maintenance, and that at the end the invariant gives the maximum of the whole list.",
        ],
      },
    },
    {
      key: "russian",
      rung: "stretch",
      prompt: (
        <p>
          The loop &ldquo;while b &gt; 0: if b is odd, r = r + a; a = 2a; b = b // 2&rdquo; starts with r = 0. Its invariant is
          r + a·b = constant. If it starts with a = 13, b = 11, what is r at the end?
        </p>
      ),
      answer: { kind: "numeric", value: 143 },
    },
  ],

  teachBack:
    "Explain to a friend what a loop invariant is and how it proves that insertion sort sorts every list, not just the ones you tested.",

  glimpse: (
    <p>
      Next, big-O notation, the language for comparing running times as inputs grow. Data Structures and Algorithms proves
      every algorithm it meets correct with invariants, and measures its cost both on paper and on real machines.
    </p>
  ),
};
