import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { NestedSetsViz } from "@/components/viz/NestedSetsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.4.1",
  minutes: 60,
  links: {
    revisits: ["m0.1.1", "m1.2.1"],
    foreshadows: ["m1.8.1"],
  },

  puzzle: (
    <>
      <p>How many things are in each of these collections?</p>
      <ul>
        <li>an empty bag;</li>
        <li>a bag containing one empty bag;</li>
        <li>a bag containing an empty bag and a bag that contains an empty bag.</li>
      </ul>
      <p>
        The answers are 0, 1 and 2, but notice something strange: starting from nothing at all, just by putting bags inside
        bags, you have built collections with one and two members. Mathematicians take this idea astonishingly far. Almost
        every object in modern mathematics, numbers included, can be built in exactly this way.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>set</strong> is a collection of things, considered as a single object. The things in it are its{" "}
        <strong>elements</strong>. A set is completely determined by which things are its elements: there is no order, no
        repetition, nothing else. A set can itself be an element of another set, just as a bag can sit inside another bag.
      </p>
      <p>
        Think of a set as a box. Its elements are whatever sits <em>directly</em> inside, whether numbers or other boxes. Step
        through the examples below and count the elements of each.
      </p>
      <NestedSetsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sets and membership">
        <p>
          We write <M>{"x \\in A"}</M> for &ldquo;x is an element of A&rdquo; and <M>{"x \\notin A"}</M> for &ldquo;x is not an
          element of A&rdquo;. A set can be given by <strong>listing</strong> its elements in braces, as{" "}
          <M>{"\\{2, 3, 5, 7\\}"}</M>, or in <strong>set-builder notation</strong>, as the elements of a domain satisfying a
          predicate:
        </p>
        <MD>{"\\{\\, n \\in \\mathbb{N} : n \\text{ is prime and } n < 10 \\,\\} = \\{2, 3, 5, 7\\}."}</MD>
        <p>The <strong>empty set</strong> <M>{"\\varnothing"}</M> has no elements at all.</p>
      </Definition>

      <Definition title="the standard number sets">
        <ul>
          <li><M>{"\\mathbb{N} = \\{0, 1, 2, 3, \\dots\\}"}</M>, the natural numbers (some books start at 1);</li>
          <li><M>{"\\mathbb{Z} = \\{\\dots, -2, -1, 0, 1, 2, \\dots\\}"}</M>, the integers, from German <em>Zahlen</em>, numbers;</li>
          <li><M>{"\\mathbb{Q}"}</M>, the rationals, fractions <M>{"p/q"}</M> with <M>{"q \\ne 0"}</M>, from <em>quotient</em>;</li>
          <li><M>{"\\mathbb{R}"}</M>, the real numbers, every point on the number line.</li>
        </ul>
      </Definition>

      <Remark title="order and repetition do not count">
        <p>
          <M>{"\\{1, 2, 3\\}"}</M>, <M>{"\\{3, 1, 2\\}"}</M> and <M>{"\\{1, 1, 2, 3\\}"}</M> are the same set, with three
          elements. A set records only <em>which</em> things belong, not how often or in what order. The number of elements
          of a finite set A is written <M>{"|A|"}</M>.
        </p>
      </Remark>

      <Example title="elements of elements">
        <p>
          In <M>{"A = \\{\\{1, 2\\}, 3\\}"}</M>, the elements are <M>{"\\{1, 2\\}"}</M> and 3, so <M>{"|A| = 2"}</M>. The
          number 1 is <em>not</em> an element of A: it is an element of an element. Membership does not pass down through
          boxes.
        </p>
      </Example>

      <Example title="numbers from nothing">
        <p>
          John von Neumann suggested in 1923 that each natural number be the set of all smaller ones:
        </p>
        <MD>{"0 = \\varnothing, \\quad 1 = \\{0\\} = \\{\\varnothing\\}, \\quad 2 = \\{0, 1\\} = \\{\\varnothing, \\{\\varnothing\\}\\}, \\quad 3 = \\{0, 1, 2\\}, \\ \\dots"}</MD>
        <p>Then the number n is a set with exactly n elements, and the puzzle&rsquo;s three bags are 0, 1 and 2.</p>
      </Example>

      <Remark title="a warning from Russell">
        <p>
          Can any predicate define a set? In 1901 Bertrand Russell considered <M>{"R = \\{\\, x : x \\notin x \\,\\}"}</M>, the
          set of all sets that are not elements of themselves. Is <M>{"R \\in R"}</M>? If it is, then by definition it is not;
          if it is not, then by definition it is. This paradox showed that unrestricted set-builder notation is contradictory.
          The cure, adopted in modern set theory, is to build sets only from elements of a set already given, as in{" "}
          <M>{"\\{x \\in D : P(x)\\}"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "member",
      rung: "check",
      prompt: <p>Which of these are true?</p>,
      answer: { kind: "choice", options: ["3 ∈ {1, 2, 3}", "{3} ∈ {1, 2, 3}", "0 ∈ ∅", "∅ ∈ {∅}"], correct: [0, 3] },
    },
    {
      key: "repeat",
      rung: "check",
      prompt: <p>How many elements does <M>{"\\{1, 1, 2, 2, 2, 3\\}"}</M> have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "nested",
      rung: "apply",
      prompt: <p>How many elements does <M>{"\\{\\varnothing, \\{\\varnothing\\}, \\{\\varnothing, \\{\\varnothing\\}\\}\\}"}</M> have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "builder",
      rung: "apply",
      prompt: <p>How many elements does <M>{"\\{\\, n \\in \\mathbb{Z} : n^2 < 10 \\,\\}"}</M> have?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "deep",
      rung: "apply",
      prompt: <p>Let <M>{"A = \\{1, \\{2, 3\\}, \\{\\{4\\}\\}\\}"}</M>. Which are elements of A?</p>,
      answer: { kind: "choice", options: ["1", "2", "{2, 3}", "{4}"], correct: [0, 2] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = {x for x in range(20) if x % 3 == 0}
print(len(A), 9 in A, 10 in A)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7 True False", "6 True False", "7 False True", "6 False False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = {x % 5 for x in range(-7, 8)}
B = {x * x for x in range(-3, 4)}
print(sorted(A), sorted(B), len([x * x for x in range(-3, 4)]))`}</Code>
          <p>Set comprehensions remove duplicates; list comprehensions keep them. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, 1, 2, 3, 4] [0, 1, 4, 9] 7", "[-2, -1, 0, 1, 2] [0, 1, 4, 9] 7", "[0, 1, 2, 3, 4] [0, 1, 4, 9] 4", "[0, 1, 2, 3, 4] [9, 4, 1, 0] 7"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>build(n)</C>, which returns the set {"{k² : k an integer, 0 ≤ k ≤ n}"} using a set comprehension.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def build(n):
    return set()
`,
        solution: `def build(n):
    return {k * k for k in range(n + 1)}
`,
        tests: [
          { name: "small", code: `assert build(4) == {0, 1, 4, 9, 16}, 'The squares of 0 to 4.'` },
          { name: "membership", code: `S = build(100)
assert 49 in S and 50 not in S and len(S) == 101, 'Use a set comprehension over range(n + 1).'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Sets can contain sets if they are frozen. Write <C>von_neumann(n)</C>, the n-th von Neumann natural number as a frozenset: 0 = ∅ and n + 1 = n ∪ {"{n}"}. Then write <C>depth(s)</C>, the nesting depth of a frozenset (0 for the empty set, otherwise 1 + the largest depth of an element), and <C>to_int(s)</C>, which recovers n from <C>von_neumann(n)</C> by counting its elements, raising <C>ValueError</C> if s is not a von Neumann number.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def von_neumann(n):
    return frozenset(range(n))

def depth(s):
    return len(s)

def to_int(s):
    return len(s)
`,
        solution: `def von_neumann(n):
    s = frozenset()
    for _ in range(n):
        s = s | frozenset([s])
    return s

def depth(s):
    return 0 if not s else 1 + max(depth(t) for t in s)

def to_int(s):
    n = len(s)
    if s != von_neumann(n):
        raise ValueError('not a von Neumann number')
    return n
`,
        tests: [
          { name: "small", code: `e = frozenset()
assert von_neumann(0) == e and von_neumann(1) == frozenset([e]) and von_neumann(2) == frozenset([e, frozenset([e])]), '2 = {∅, {∅}}.'` },
          { name: "members", code: `s = von_neumann(5)
assert len(s) == 5 and all(von_neumann(k) in s for k in range(5)) and von_neumann(5) not in s, 'n has the elements 0 … n − 1.'` },
          { name: "depth", code: `assert depth(von_neumann(0)) == 0 and depth(von_neumann(6)) == 6 and depth(frozenset([frozenset([frozenset()])])) == 2, 'Depth counts nesting.'` },
          { name: "back", code: `assert to_int(von_neumann(7)) == 7 and to_int(frozenset()) == 0
try:
    to_int(frozenset([frozenset([frozenset()])]))
    ok = False
except ValueError:
    ok = True
assert ok, '{{∅}} has one element but is not 1.'` },
        ],
      },
    },
    {
      key: "empty-not",
      rung: "prove",
      prompt: <p>Explain carefully why <M>{"\\varnothing \\ne \\{\\varnothing\\}"}</M>, using only what it means for sets to have elements.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes that ∅ has no elements.",
          "Notes that {∅} has exactly one element, namely ∅.",
          "Concludes that since one has an element and the other does not, they are different sets.",
        ],
      },
    },
    {
      key: "von-neumann",
      rung: "stretch",
      prompt: (
        <p>
          In von Neumann&rsquo;s construction, 3 = {"{0, 1, 2}"}. Writing every number in terms of ∅ and braces, how many pairs
          of braces (including the ∅ symbols, each counted as one pair) does it take to write 3?
        </p>
      ),
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between ∅ and {∅}, and why {{1, 2}, 3} has two elements, not three.",

  glimpse: (
    <p>
      Next comes the most important relation between sets, being a subset, and what it means for two sets to be equal. Russell&rsquo;s paradox was resolved by the axioms of set theory, which build every set from sets already given; Measure-Theoretic Probability shows why even probability needs that care.
    </p>
  ),
};
