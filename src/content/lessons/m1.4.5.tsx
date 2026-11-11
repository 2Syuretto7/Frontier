import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PowerSetViz } from "@/components/viz/PowerSetViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.4.5",
  minutes: 65,
  links: {
    revisits: ["m0.7.4", "m1.4.2"],
    foreshadows: ["m1.6.1", "m1.8.3", "m3.1.1"],
  },

  puzzle: (
    <>
      <p>
        A restaurant offers pizza with any combination of five toppings: none, all five, or anything in between. How many
        different pizzas can you order?
      </p>
      <p>
        And a second question: a shirt comes in 4 colours and 3 sizes. How many different shirts are there? Both questions
        ask you to count a new set built from old ones. Before reading on, try to see why one answer is a power of 2 and the
        other a product.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For each topping there are two choices, in or out. Five independent two-way choices give{" "}
        <M>{"2 \\times 2 \\times 2 \\times 2 \\times 2 = 32"}</M> pizzas. Each pizza is a <em>subset</em> of the set of
        toppings, and the collection of all of them is the <strong>power set</strong>.
      </p>
      <p>
        For the shirt, each one is a <em>pair</em>: a colour and a size. There are <M>{"4 \\times 3 = 12"}</M> pairs, and the
        set of all of them is the <strong>Cartesian product</strong>. Build the power set of a small set below, and see each
        subset as a row of in-or-out switches.
      </p>
      <PowerSetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="power set">
        <p>
          The <strong>power set</strong> of A is the set of all subsets of A:
        </p>
        <MD>{"\\mathcal{P}(A) = \\{\\, X : X \\subseteq A \\,\\}."}</MD>
        <p>
          For example, <M>{"\\mathcal{P}(\\{a, b\\}) = \\{\\varnothing, \\{a\\}, \\{b\\}, \\{a, b\\}\\}"}</M>. Note that{" "}
          <M>{"\\varnothing"}</M> and A itself are always elements of <M>{"\\mathcal{P}(A)"}</M>.
        </p>
      </Definition>

      <Theorem title="size of the power set">
        <p>If A has n elements, then <M>{"\\mathcal{P}(A)"}</M> has <M>{"2^n"}</M> elements.</p>
      </Theorem>
      <Proof>
        <p>
          List the elements of A as <M>{"a_1, \\dots, a_n"}</M>. A subset X is determined by answering, for each{" "}
          <M>{"a_i"}</M>, whether <M>{"a_i \\in X"}</M>. That is a string of n answers, each yes or no, and different strings
          give different subsets. There are <M>{"2^n"}</M> such strings.
        </p>
      </Proof>

      <Remark title="a familiar identity, seen again">
        <p>
          Counting the same subsets by size gives <M>{"\\binom{n}{0} + \\binom{n}{1} + \\cdots + \\binom{n}{n}"}</M>, since
          there are <M>{"\\binom{n}{k}"}</M> subsets of size k. So this sum equals <M>{"2^n"}</M>: the row sums of
          Pascal&rsquo;s triangle are powers of 2. Counting one set in two ways is a proof technique in its own right.
        </p>
      </Remark>

      <Definition title="ordered pairs and Cartesian products">
        <p>
          An <strong>ordered pair</strong> <M>{"(a, b)"}</M> has a first and a second entry, and{" "}
          <M>{"(a, b) = (c, d)"}</M> exactly when <M>{"a = c"}</M> and <M>{"b = d"}</M>. Unlike a set,{" "}
          <M>{"(1, 2) \\ne (2, 1)"}</M> and <M>{"(1, 1)"}</M> is allowed. The <strong>Cartesian product</strong> of A and B is
        </p>
        <MD>{"A \\times B = \\{\\, (a, b) : a \\in A,\\ b \\in B \\,\\},"}</MD>
        <p>and if A and B are finite, <M>{"|A \\times B| = |A| \\cdot |B|"}</M>.</p>
      </Definition>

      <Example title="the plane">
        <p>
          <M>{"\\mathbb{R} \\times \\mathbb{R} = \\mathbb{R}^2"}</M> is the set of all pairs of real numbers: the coordinate
          plane. The name honours René Descartes, whose <cite>La Géométrie</cite> (1637) joined algebra to geometry through
          coordinates. Similarly <M>{"\\mathbb{R}^3"}</M> is space, and <M>{"\\mathbb{R}^n"}</M> is the setting for linear
          algebra.
        </p>
      </Example>

      <Remark title="pairs from sets">
        <p>
          Can ordered pairs be built from sets, which have no order? Kazimierz Kuratowski showed in 1921 that the definition{" "}
          <M>{"(a, b) = \\{\\{a\\}, \\{a, b\\}\\}"}</M> works: it satisfies the rule above. So pairs, products, and everything
          built from them can be made of sets alone, which is why set theory can serve as a foundation for mathematics.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pizza",
      rung: "check",
      prompt: <p>How many pizzas can be made from five toppings, including the plain one with no toppings?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "power-elements",
      rung: "check",
      prompt: <p>Which of these are elements of <M>{"\\mathcal{P}(\\{1, 2\\})"}</M>?</p>,
      answer: { kind: "choice", options: ["∅", "1", "{1}", "{1, 2}"], correct: [0, 2, 3] },
    },
    {
      key: "product",
      rung: "apply",
      prompt: <p>How many elements does <M>{"\\{a, b, c\\} \\times \\{1, 2, 3, 4\\}"}</M> have?</p>,
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "power-of-power",
      rung: "apply",
      prompt: <p>How many elements does <M>{"\\mathcal{P}(\\mathcal{P}(\\{1, 2\\}))"}</M> have?</p>,
      answer: { kind: "numeric", value: 16 },
    },
    {
      key: "size-two",
      rung: "apply",
      prompt: <p>How many subsets of a 6-element set have exactly 2 elements?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product, combinations
A = {'a', 'b', 'c'}
power = [set(c) for r in range(len(A) + 1) for c in combinations(sorted(A), r)]
print(len(power), len(list(product(A, A))))`}</Code>
          <p>This prints the sizes of P(A) and A × A. What is their sum?</p>
        </>
      ),
      answer: { kind: "numeric", value: 17 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product, combinations
S = 'abc'
P = [set(c) for r in range(4) for c in combinations(S, r)]
print(len(P), len(list(product(S, repeat=2))), len(list(product(S, 'xy'))))`}</Code>
          <p>The power set of {a, b, c} and some Cartesian products. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8 9 6", "7 9 6", "8 6 6", "8 9 5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>power_set(S)</C>, which returns a list of all subsets of S as frozensets, built by bitmasks: for each integer m from 0 to 2ⁿ − 1, include element i when bit i of m is set.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def power_set(S):
    return [frozenset(S)]
`,
        solution: `def power_set(S):
    items = list(S)
    n = len(items)
    return [frozenset(items[i] for i in range(n) if m >> i & 1) for m in range(2 ** n)]
`,
        tests: [
          { name: "size", code: `assert len(power_set({1, 2, 3, 4})) == 16, 'A 4-element set has 2⁴ = 16 subsets.'` },
          { name: "all distinct", code: `P = power_set({1, 2, 3})
assert len(set(P)) == 8 and frozenset() in P and frozenset({1, 2, 3}) in P, 'Include the empty set and the whole set, each once.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>gray_code(n)</C>, the list of all 2ⁿ subsets of {"{0, …, n − 1}"} as sets, ordered so that consecutive subsets (and the last and the first) differ by exactly one element, using the reflected construction: the list for n is the list for n − 1, followed by the same list reversed with n − 1 added to each. Then write <C>subsets_of_size(S, k)</C>, the list of k-element subsets of a sorted list S as tuples in lexicographic order, built recursively (no itertools).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def gray_code(n):
    return [set()]

def subsets_of_size(S, k):
    return []
`,
        solution: `def gray_code(n):
    if n == 0:
        return [set()]
    prev = gray_code(n - 1)
    return [set(s) for s in prev] + [s | {n - 1} for s in reversed(prev)]

def subsets_of_size(S, k):
    if k == 0:
        return [()]
    if len(S) < k:
        return []
    first, rest = S[0], S[1:]
    return [(first,) + t for t in subsets_of_size(rest, k - 1)] + subsets_of_size(rest, k)
`,
        tests: [
          { name: "small", code: `assert gray_code(0) == [set()] and gray_code(2) == [set(), {0}, {0, 1}, {1}], 'Reflect and add the new element.'` },
          { name: "all once", code: `g = gray_code(6)
assert len(g) == 64 and len({frozenset(s) for s in g}) == 64, 'Each subset exactly once.'` },
          { name: "one step", code: `g = gray_code(7)
assert all(len(a ^ b) == 1 for a, b in zip(g, g[1:] + g[:1])), 'Neighbours differ by one element, cyclically.'` },
          { name: "k subsets", code: `from itertools import combinations
assert subsets_of_size([1, 2, 3, 4], 2) == list(combinations([1, 2, 3, 4], 2)) and subsets_of_size(list(range(10)), 4) == list(combinations(range(10), 4)) and subsets_of_size([1, 2], 3) == [], 'Choose the first element or skip it.'` },
          { name: "no itertools", code: `import inspect
assert 'itertools' not in inspect.getsource(subsets_of_size) and 'combinations' not in inspect.getsource(subsets_of_size), 'Build them recursively.'` },
        ],
      },
    },
    {
      key: "kuratowski",
      rung: "prove",
      prompt: (
        <p>
          Using Kuratowski&rsquo;s definition <M>{"(a, b) = \\{\\{a\\}, \\{a, b\\}\\}"}</M>, show that{" "}
          <M>{"(1, 2) \\ne (2, 1)"}</M>, and compute how many elements <M>{"(1, 1)"}</M> has as a set.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes (1, 2) = {{1}, {1, 2}} and (2, 1) = {{2}, {1, 2}}.",
          "Notes {1} is an element of the first but not the second, so they differ.",
          "Computes (1, 1) = {{1}, {1}} = {{1}}, which has one element.",
        ],
      },
    },
    {
      key: "product-empty",
      rung: "stretch",
      prompt: (
        <p>
          Prove that <M>{"A \\times B = \\varnothing"}</M> if and only if <M>{"A = \\varnothing"}</M> or{" "}
          <M>{"B = \\varnothing"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows that if A or B is empty, there can be no pair (a, b), so the product is empty.",
          "For the converse, argues by contrapositive: if A and B are both non-empty, choose a ∈ A and b ∈ B.",
          "Notes that (a, b) ∈ A × B, so the product is non-empty.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why a set with n elements has 2ⁿ subsets, using toppings on a pizza.",

  glimpse: (
    <p>
      This completes the chapter on sets. A relation, later in this course, is simply a subset of a Cartesian product, and a
      function is a special kind of relation. Power sets return at the end of the course in Cantor&rsquo;s theorem: for every
      set, even an infinite one, the power set is strictly bigger.
    </p>
  ),
};
