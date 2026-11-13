import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RationalCoverViz } from "@/components/viz/RationalCoverViz";
import type { LessonContent } from "@/lib/types";

const LIST = `import math
from fractions import Fraction

def rationals_upto(qmax):
    return [Fraction(p, q) for q in range(1, qmax + 1)
            for p in range(1, q + 1) if math.gcd(p, q) == 1]

def phi(n):
    return sum(1 for k in range(1, n + 1) if math.gcd(k, n) == 1)`;

const AVOID = `def avoid(xs, a, b):
    for x in xs:
        t = (b - a) / 3
        if a <= x <= a + t:
            a = b - t
        else:
            b = a + t
    return a, b

def cover_length(eps, n):
    return sum(eps / 2 ** k for k in range(1, n + 1))`;

export const lesson: LessonContent = {
  id: "m8.1.3",
  minutes: 55,
  links: {
    requires: ["m8.1.2", "m1.8.2"],
    revisits: ["m1.8.3", "m1.8.4"],
    foreshadows: ["m8.7.2", "m18.1.2"],
  },

  puzzle: (
    <>
      <p>
        Between any two reals there is a rational, so the rationals are everywhere. Yet you can cover all of them with
        intervals of total length 0.001. And between any two rationals there is an irrational, but the irrationals cannot
        be covered that way. How can a set be everywhere and also take up no room?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Size can mean several things. Density is about position: every interval meets the set. Countability is about
        listing: can the elements be numbered 1, 2, 3, …? Length is about room. A listed set can be covered by giving its
        k-th element an interval of length ε/2ᵏ, so the total is at most ε. The reals in an interval cannot be listed, and
        that is why they have positive length.
      </p>
      <RationalCoverViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="ℚ is dense in ℝ">
        <p>For all reals a &lt; b there is a rational q with a &lt; q &lt; b.</p>
      </Theorem>
      <Proof>
        <p>
          By Archimedes pick n with 1/n &lt; b − a, and let m be the least integer with m &gt; na (it exists by the
          Archimedean and well-ordering properties). Then m − 1 ≤ na, so <M>{"a < m/n \\le a + 1/n < b"}</M>.
        </p>
      </Proof>

      <Theorem title="ℚ is countable">
        <p>The rationals can be listed as a sequence <M>{"q_1, q_2, q_3, \\dots"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          For each n ≥ 1, the rationals p/q in lowest terms with |p| + q = n form a finite set. Listing the sets for n = 1, 2,
          3, … one after the other lists every rational exactly once. For (0, 1] alone, listing by denominator works:
        </p>
        <Code>{LIST}</Code>
      </Proof>

      <Theorem title="ℝ is uncountable">
        <p>No sequence <M>{"x_1, x_2, \\dots"}</M> contains every real number in [0, 1].</p>
      </Theorem>
      <Proof>
        <p>
          Build nested closed intervals avoiding the list. Split [0, 1] into closed thirds; at least one of the first and last
          thirds does not contain <M>{"x_1"}</M>, since they are disjoint; call it <M>{"I_1"}</M>. Split <M>{"I_1"}</M> the same
          way and choose a third <M>{"I_2"}</M> avoiding <M>{"x_2"}</M>, and so on. By the nested interval property some x lies in
          every <M>{"I_n"}</M>. Since <M>{"x_n \\notin I_n"}</M> and <M>{"x \\in I_n"}</M>, x ≠ <M>{"x_n"}</M> for every n: x is missing
          from the list.
        </p>
        <Code>{AVOID}</Code>
      </Proof>
      <Remark title="two proofs">
        <p>
          This is Cantor&apos;s first proof (1874); the diagonal argument came later. This one uses completeness directly,
          which makes the point clear: ℚ fails to be uncountable precisely because it is not complete, and the same
          construction applied to a listing of ℚ produces nested rational intervals with no rational in common.
        </p>
      </Remark>

      <Example title="transcendental numbers exist">
        <p>
          A real is algebraic if it is a root of a non-zero polynomial with integer coefficients. There are countably many such
          polynomials (finitely many with degree plus coefficient sizes equal to n, for each n), each with finitely many
          roots, so the algebraic numbers are countable. Since ℝ is not, transcendental numbers exist, and in fact almost
          every real is one, although proving a particular number like π transcendental is hard.
        </p>
      </Example>

      <Definition title="measure zero">
        <p>
          A set E ⊂ ℝ has measure zero if for every ε &gt; 0 it can be covered by countably many intervals of total length
          at most ε.
        </p>
      </Definition>
      <Theorem title="countable sets have measure zero">
        <p>Every countable set, in particular ℚ, has measure zero.</p>
      </Theorem>
      <Proof>
        <p>
          List the set as <M>{"x_1, x_2, \\dots"}</M> and cover <M>{"x_k"}</M> by an interval of length <M>{"\\varepsilon/2^k"}</M>.
          The total length is <M>{"\\sum_k \\varepsilon/2^k = \\varepsilon"}</M>.
        </p>
      </Proof>
      <Example title="the Cantor set">
        <p>
          Remove the open middle third of [0, 1], then the middle thirds of the two remaining pieces, and so on. After n
          stages <M>{"2^n"}</M> intervals of length <M>{"3^{-n}"}</M> remain, total <M>{"(2/3)^n \\to 0"}</M>, so the Cantor set C
          has measure zero. Yet C is exactly the set of numbers with a base-3 expansion using only the digits 0 and 2, which
          matches the infinite binary sequences, so C is uncountable. Measure zero does not imply countable.
        </p>
      </Example>
      <Remark title="why this matters">
        <p>
          Measure zero sets are the ones integration can ignore: a bounded function is Riemann integrable exactly when its
          discontinuities have measure zero, and in probability, events of measure zero are the &quot;almost never&quot;
          events.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many rationals in (0, 1] have denominator at most 5 when written in lowest terms?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
    {
      key: "cover",
      rung: "check",
      prompt: <p>The first three listed rationals get intervals of lengths ε/2, ε/4, ε/8 with ε = 0.5. What is the total length?</p>,
      answer: { kind: "numeric", value: 0.4375, tolerance: 0.0001 },
    },
    {
      key: "uncount",
      rung: "apply",
      prompt: <p>Which of these sets is uncountable?</p>,
      answer: {
        kind: "choice",
        options: ["The Cantor set", "The algebraic numbers", "ℚ ∩ [0, 1]", "The finite decimals in [0, 1]"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
from fractions import Fraction

def rationals_upto(qmax):
    return [Fraction(p, q) for q in range(1, qmax + 1)
            for p in range(1, q + 1) if math.gcd(p, q) == 1]

def phi(n):
    return sum(1 for k in range(1, n + 1) if math.gcd(k, n) == 1)

rs = rationals_upto(5)
print(len(rs), [str(r) for r in rs[:6]], sum(phi(q) for q in range(1, 6)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "10 ['1', '1/2', '1/3', '2/3', '1/4', '3/4'] 10",
          "10 ['1', '1/2', '1/3', '2/3', '1/4', '2/4'] 10",
          "15 ['1', '1/2', '1/3', '2/3', '1/4', '3/4'] 15",
          "10 ['1', '1/2', '2/2', '1/3', '2/3', '3/3'] 10",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def avoid(xs, a, b):
    for x in xs:
        t = (b - a) / 3
        if a <= x <= a + t:
            a = b - t
        else:
            b = a + t
    return a, b

def cover_length(eps, n):
    return sum(eps / 2 ** k for k in range(1, n + 1))

a, b = avoid([0.5, 0.1, 0.9], 0, 1)
print(round(a, 4), round(b, 4), round(cover_length(1, 10), 4), cover_length(0.5, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2222 0.2593 0.999 0.4375",
          "0.3333 0.4444 0.999 0.4375",
          "0.2222 0.2593 1.0 0.4375",
          "0.2222 0.2593 0.999 0.875",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rationals_upto(qmax)</C>, listing the Fractions p/q in (0, 1] in lowest terms with q ≤ qmax, ordered by
          denominator and then numerator, and <C>phi(n)</C>, the number of k in 1, …, n with gcd(k, n) = 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from fractions import Fraction

def rationals_upto(qmax):
    return []

def phi(n):
    return n
`,
        solution: LIST,
        tests: [
          { name: "list", code: `rs = rationals_upto(4)
assert rs == [Fraction(1), Fraction(1, 2), Fraction(1, 3), Fraction(2, 3), Fraction(1, 4), Fraction(3, 4)]
assert len(set(rationals_upto(12))) == len(rationals_upto(12))` },
          { name: "phi", code: `assert [phi(n) for n in range(1, 11)] == [1, 1, 2, 2, 4, 2, 6, 4, 6, 4]
assert len(rationals_upto(30)) == sum(phi(q) for q in range(1, 31))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>avoid(xs, a, b)</C>, which runs Cantor&apos;s construction: for each x in turn, split [a, b] into closed
          thirds, keep the last third if x lies in the first third and the first third otherwise; return the final (a, b). Also
          write <C>cover_length(eps, n)</C>, the total length of intervals ε/2, ε/4, …, ε/2ⁿ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def avoid(xs, a, b):
    return a, b

def cover_length(eps, n):
    return eps
`,
        solution: AVOID,
        tests: [
          { name: "avoid", code: `xs = [0.5, 0.1, 0.9, 0.25, 0.24]
a, b = avoid(xs, 0, 1)
assert abs((b - a) - 3 ** -5) < 1e-12
for k in range(1, len(xs) + 1):
    a, b = avoid(xs[:k], 0, 1)
    assert not (a <= xs[k - 1] <= b)
a, b = avoid([0.0], 0, 1)
assert abs(a - 2 / 3) < 1e-12 and abs(b - 1) < 1e-12` },
          { name: "cover", code: `assert abs(cover_length(0.5, 3) - 0.4375) < 1e-12 and abs(cover_length(1, 1) - 0.5) < 1e-12 and cover_length(2, 50) < 2` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Using the nested interval property, prove that no sequence <M>{"(x_n)"}</M> contains every real number in [0, 1].
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Constructs nested closed intervals I₁ ⊇ I₂ ⊇ … with x_n ∉ I_n, for example by choosing a closed third that misses x_n (justifying that one exists).",
          "Applies the nested interval property to obtain x in every I_n.",
          "Concludes x ≠ x_n for each n because x ∈ I_n and x_n ∉ I_n, so the list misses x.",
        ],
      },
    },
    {
      key: "cantor",
      rung: "stretch",
      prompt: <p>What total length is removed from [0, 1] in the first three stages of building the Cantor set? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.7037, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the rationals can be dense yet countable, Cantor's nested-interval proof that the reals are not, why every countable set has measure zero, and why the Cantor set shows the converse fails.",

  glimpse: (
    <>
      <p>
        With the real line built and measured, the next chapter studies sequences in it rigorously: the limit theorems,
        monotone and Cauchy sequences, and the Bolzano–Weierstrass theorem, all resting on completeness.
      </p>
    </>
  ),
};
