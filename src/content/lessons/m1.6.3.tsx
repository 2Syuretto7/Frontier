import { M } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { HasseViz } from "@/components/viz/HasseViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.6.3",
  minutes: 60,
  links: {
    revisits: ["m1.4.2", "m1.5.3"],
  },

  puzzle: (
    <>
      <p>
        To get dressed you must put on socks before shoes, and a shirt before a tie. But there is no rule about socks and the
        shirt: either can come first. Some tasks must be done in order; others are simply not comparable.
      </p>
      <p>
        By contrast, any two whole numbers can be compared: one is smaller, or they are equal. What separates an ordering in
        which everything is comparable from one in which some pairs are not, and why is the second kind so common?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        &ldquo;Before&rdquo; on the dressing tasks, &ldquo;is a subset of&rdquo; on sets, and &ldquo;divides&rdquo; on the
        positive integers all share three properties: everything comes before or equals itself, two different things cannot
        each come before the other, and before passes along chains. But in each, some pairs are incomparable.
      </p>
      <p>
        Below are the divisors of a number, ordered by divisibility. Each line goes up from a number to a multiple of it, with
        nothing in between. Click a number to see which others it can be compared with. Which choice of n gives a single
        chain?
      </p>
      <HasseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="partial order">
        <p>
          A <strong>partial order</strong> on a set P is a relation <M>{"\\preceq"}</M> that is reflexive, antisymmetric and
          transitive. The pair <M>{"(P, \\preceq)"}</M> is a <strong>partially ordered set</strong>, or{" "}
          <strong>poset</strong>. Elements a and b are <strong>comparable</strong> if <M>{"a \\preceq b"}</M> or{" "}
          <M>{"b \\preceq a"}</M>, and <strong>incomparable</strong> otherwise.
        </p>
      </Definition>

      <Definition title="total order">
        <p>
          A partial order is a <strong>total order</strong> (or linear order) if every two elements are comparable. A{" "}
          <strong>chain</strong> in a poset is a subset on which the order is total.
        </p>
      </Definition>

      <Example title="three posets">
        <ul>
          <li><M>{"(\\mathbb{R}, \\le)"}</M> is a total order.</li>
          <li>
            The subsets of a set S under <M>{"\\subseteq"}</M> form a poset; <M>{"\\{1\\}"}</M> and <M>{"\\{2\\}"}</M> are
            incomparable whenever <M>{"S"}</M> contains 1 and 2.
          </li>
          <li>
            The positive integers under divisibility form a poset: antisymmetry holds because if <M>{"a \\mid b"}</M> and{" "}
            <M>{"b \\mid a"}</M> with both positive, then <M>{"a \\le b \\le a"}</M>. On all the integers it fails, since{" "}
            <M>{"2 \\mid -2"}</M> and <M>{"-2 \\mid 2"}</M>.
          </li>
        </ul>
      </Example>

      <Definition title="least, greatest, minimal, maximal">
        <p>
          In a poset, a <strong>least</strong> element lies below every element, while a <strong>minimal</strong> element has
          nothing strictly below it. In a total order the two notions agree, but not in general: in{" "}
          <M>{"\\{2, 3, 4, 6\\}"}</M> under divisibility, 2 and 3 are both minimal, and there is no least element.
        </p>
      </Definition>

      <Remark title="Hasse diagrams">
        <p>
          A finite poset can be drawn by putting a above b and joining them with a line when <M>{"b \\prec a"}</M> with nothing
          strictly in between. The rest of the order is recovered by transitivity: going upwards along lines. Such pictures are
          named after the number theorist Helmut Hasse.
        </p>
      </Remark>

      <Example title="well-orders">
        <p>
          A total order is a <strong>well-order</strong> if every non-empty subset has a least element. By the well-ordering
          principle, <M>{"(\\mathbb{N}, \\le)"}</M> is one; <M>{"(\\mathbb{Z}, \\le)"}</M> and <M>{"([0, 1], \\le)"}</M> are
          not. Well-orders are exactly the orders that support proof by induction, and their study leads to the ordinals of set
          theory.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "is-partial",
      rung: "check",
      prompt: <p>Which of these are partial orders?</p>,
      answer: {
        kind: "choice",
        options: ["≤ on the real numbers", "< on the real numbers", "⊆ on the subsets of {1, 2}", "divides on the positive integers"],
        correct: [0, 2, 3],
      },
    },
    {
      key: "total",
      rung: "check",
      prompt: <p>Which of these are total orders?</p>,
      answer: {
        kind: "choice",
        options: ["≤ on the integers", "⊆ on the subsets of {1, 2}", "divides on {1, 2, 4, 8}", "divides on {1, 2, 3, 6}"],
        correct: [0, 2],
      },
    },
    {
      key: "incomparable",
      rung: "apply",
      prompt: <p>Under divisibility on the divisors of 36, how many divisors are incomparable with 4?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "lines",
      rung: "apply",
      prompt: <p>How many lines does the Hasse diagram of the divisors of 30 have?</p>,
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "minimal",
      rung: "apply",
      prompt: <p>In <M>{"\\{2, 3, 4, 5, 6, 8, 9, 10\\}"}</M> under divisibility, how many minimal elements are there?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`words = ['b', 'ab', 'a', 'abc']
print(sorted(words), sorted(words, key=len))`}</Code>
          <p>Lexicographic order is a total order; ordering by length is not antisymmetric on words. What is the first word in sorted(words)?</p>
        </>
      ),
      answer: { kind: "choice", options: ["'a'", "'ab'", "'b'", "'abc'"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`A = [1, 2, 3, 4, 6, 12]
leq = lambda a, b: b % a == 0
maximal = [a for a in A if not any(leq(a, b) and a != b for b in A)]
incomparable = [(a, b) for a in A for b in A if a < b and not leq(a, b)]
print(maximal, incomparable)`}</Code>
          <p>Divisibility on the divisors of 12 is a partial order. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[12] [(2, 3), (3, 4), (4, 6)]", "[12] [(2, 3), (4, 6)]", "[6, 12] [(2, 3), (3, 4), (4, 6)]", "[12] [(3, 4), (4, 6)]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>maximal(A, leq)</C>, which returns the set of maximal elements of a finite partially ordered set: those x with no y ≠ x such that leq(x, y).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def maximal(A, leq):
    return {max(A)}
`,
        solution: `def maximal(A, leq):
    return {x for x in A if not any(y != x and leq(x, y) for y in A)}
`,
        tests: [
          { name: "divisibility", code: `assert maximal(range(1, 11), lambda a, b: b % a == 0) == {6, 7, 8, 9, 10}, 'Under divisibility, 6, 7, 8, 9 and 10 divide nothing else in 1 to 10.'` },
          { name: "subsets", code: `A = [frozenset(), frozenset({1}), frozenset({2}), frozenset({1, 2})]
assert maximal(A, lambda a, b: a <= b) == {frozenset({1, 2})}, 'Under inclusion, {1, 2} is the only maximal set.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>linear_extension(A, leq)</C>, a list of the elements of a finite partial order arranged so that whenever leq(a, b) with a ≠ b, a comes before b (repeatedly remove a minimal element; among several, take the smallest by Python&rsquo;s ordering). Write <C>hasse(A, leq)</C>, the set of covering pairs (a, b): a &lt; b with nothing strictly between. And write <C>is_lattice(A, leq)</C>, true when every pair has a least upper bound and a greatest lower bound in A.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def linear_extension(A, leq):
    return list(A)

def hasse(A, leq):
    return set()

def is_lattice(A, leq):
    return True
`,
        solution: `def linear_extension(A, leq):
    rest = list(A)
    out = []
    while rest:
        mins = [a for a in rest if not any(leq(b, a) and b != a for b in rest)]
        m = min(mins)
        out.append(m)
        rest.remove(m)
    return out

def hasse(A, leq):
    lt = lambda a, b: a != b and leq(a, b)
    return {(a, b) for a in A for b in A if lt(a, b) and not any(lt(a, c) and lt(c, b) for c in A)}

def is_lattice(A, leq):
    def best(cands, better):
        tops = [c for c in cands if all(better(c, d) for d in cands)]
        return len(tops) == 1
    for a in A:
        for b in A:
            ub = [c for c in A if leq(a, c) and leq(b, c)]
            lb = [c for c in A if leq(c, a) and leq(c, b)]
            if not best(ub, lambda c, d: leq(c, d)) or not best(lb, lambda c, d: leq(d, c)):
                return False
    return True
`,
        tests: [
          { name: "extension", code: `A = [12, 1, 6, 2, 3, 4]
leq = lambda a, b: b % a == 0
L = linear_extension(A, leq)
assert L == [1, 2, 3, 4, 6, 12] and all(L.index(a) < L.index(b) for a in A for b in A if a != b and leq(a, b)), 'Minimal elements first.'` },
          { name: "subsets", code: `from itertools import combinations
A = [frozenset(c) for r in range(3) for c in combinations('ab', r)]
L = linear_extension(A, lambda x, y: x <= y)
assert L[0] == frozenset() and L[-1] == frozenset('ab'), 'Order subsets by inclusion.'` },
          { name: "hasse", code: `A = [1, 2, 3, 4, 6, 12]
assert hasse(A, lambda a, b: b % a == 0) == {(1, 2), (1, 3), (2, 4), (2, 6), (3, 6), (4, 12), (6, 12)}, 'Only the covering pairs.'` },
          { name: "lattice", code: `assert is_lattice([1, 2, 3, 4, 6, 12], lambda a, b: b % a == 0) and not is_lattice([1, 2, 3], lambda a, b: b % a == 0) and is_lattice(range(5), lambda a, b: a <= b), '2 and 3 have no upper bound in {1, 2, 3}.'` },
        ],
      },
    },
    {
      key: "unique-least",
      rung: "prove",
      prompt: <p>Prove that a poset has at most one least element.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes a and b are both least elements.",
          "Uses that a is least to get a ⪯ b, and that b is least to get b ⪯ a.",
          "Applies antisymmetry to conclude a = b.",
        ],
      },
    },
    {
      key: "finite-minimal",
      rung: "stretch",
      prompt: (
        <p>
          Prove that every non-empty finite poset has a minimal element. Then show by example that it need not have a least
          element, and that an infinite poset need not have a minimal element.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Starts from any element and repeatedly steps to a strictly smaller one if possible.",
          "Argues the process cannot repeat an element (by antisymmetry and transitivity) and so stops, since the poset is finite.",
          "Gives an example with two minimal elements and no least one, such as {2, 3} under divisibility.",
          "Gives an infinite example with no minimal element, such as the integers under ≤.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the difference between a partial order and a total order, using getting dressed and the divisors of 12 as examples.",

  glimpse: (
    <p>
      This completes the chapter on relations. The next chapter shows that a function is a special kind of relation. The order axioms of the real numbers open Real Analysis, and partial orders reappear in Data Structures and Algorithms as the dependencies that a topological sort must respect.
    </p>
  ),
};
