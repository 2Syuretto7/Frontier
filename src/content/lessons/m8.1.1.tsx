import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DedekindCutViz } from "@/components/viz/DedekindCutViz";
import type { LessonContent } from "@/lib/types";

const CUT = `from fractions import Fraction

def in_sqrt2_cut(q):
    return q < 0 or q * q < 2

def bisect_cut(cut, lo, hi, steps):
    lo, hi = Fraction(lo), Fraction(hi)
    for _ in range(steps):
        mid = (lo + hi) / 2
        if cut(mid):
            lo = mid
        else:
            hi = mid
    return lo, hi`;

const APPROX = `from fractions import Fraction

def newton_sqrt2(n):
    x = Fraction(1)
    out = [x]
    for _ in range(n):
        x = (x + 2 / x) / 2
        out.append(x)
    return out

def decimal_digits(cut, k):
    x = 0
    while cut(Fraction(x + 1)):
        x += 1
    s, x = str(x) + ".", Fraction(x)
    for i in range(1, k + 1):
        d = 9
        while not cut(x + Fraction(d, 10 ** i)):
            d -= 1
        x += Fraction(d, 10 ** i)
        s += str(d)
    return s`;

export const lesson: LessonContent = {
  id: "m8.1.1",
  minutes: 60,
  links: {
    requires: ["m2.1.2", "m1.3.3"],
    revisits: ["m2.1.1", "m1.4.2"],
    foreshadows: ["m8.1.2", "m8.2.4", "m8.9.2"],
  },

  puzzle: (
    <>
      <p>
        Calculus took the real numbers for granted: a number line with no holes, where every bounded set has a least upper
        bound. But what is a real number? The rationals are perfectly concrete, yet they have a hole exactly where √2 should
        be. Can we build the missing numbers out of rationals alone, and prove that the result has no holes left?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A hole in the rationals is still visible from the rationals: it splits them into those to its left and those to its
        right. Dedekind&apos;s idea is to define the missing number to be that split. A real number is a way of cutting the
        rationals into a lower part and an upper part, and ordering reals is just comparing their lower parts.
      </p>
      <DedekindCutViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the rationals have a gap">
        <p>
          The set <M>{"A = \\{q \\in \\mathbb Q : q < 0 \\text{ or } q^2 < 2\\}"}</M> is non-empty and bounded above in{" "}
          <M>{"\\mathbb Q"}</M> (by 2), but has no least upper bound in <M>{"\\mathbb Q"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose s ∈ ℚ is the least upper bound. Since 1 ∈ A, s ≥ 1 &gt; 0. No rational squares to 2, so either s² &lt; 2 or
          s² &gt; 2. If <M>{"s^2 < 2"}</M>, let <M>{"h = (2 - s^2)/(2s + 1)"}</M>, a rational in (0, 1). Then{" "}
          <M>{"(s + h)^2 = s^2 + h(2s + h) < s^2 + h(2s + 1) = 2"}</M>, so s + h ∈ A and s is not an upper bound. If{" "}
          <M>{"s^2 > 2"}</M>, let <M>{"h = (s^2 - 2)/(2s)"}</M> &gt; 0. Then <M>{"(s - h)^2 = s^2 - 2sh + h^2 > s^2 - 2sh = 2"}</M>{" "}
          and s − h &gt; 0, so every element of A is below s − h: a smaller upper bound. Either way, a contradiction.
        </p>
      </Proof>

      <Definition title="Dedekind cut">
        <p>A cut is a subset A ⊂ ℚ such that</p>
        <ol>
          <li>A is not empty and A ≠ ℚ;</li>
          <li>A is closed downwards: if a ∈ A and q &lt; a, then q ∈ A;</li>
          <li>A has no largest element.</li>
        </ol>
        <p>
          The real numbers ℝ are the set of all cuts, ordered by inclusion: A ≤ B means A ⊆ B. Each rational r is identified
          with the cut <M>{"\\{q \\in \\mathbb Q : q < r\\}"}</M>, and √2 is the cut A above, which is not of this form.
        </p>
      </Definition>
      <p>
        Inclusion is a total order on cuts: if A ⊄ B, pick a ∈ A \ B; every b ∈ B is below a (otherwise downward closure
        would put a in B), so B ⊆ A. Addition is <M>{"A + B = \\{a + b : a \\in A, b \\in B\\}"}</M>; multiplication is
        defined first for positive cuts, then by signs. Checking the field and order axioms is long but routine.
      </p>

      <Theorem title="least upper bound property">
        <p>Every non-empty set of cuts that is bounded above has a least upper bound, namely the union of its members.</p>
      </Theorem>
      <Proof>
        <p>
          Let 𝒮 be a non-empty set of cuts with an upper bound B, and let <M>{"U = \\bigcup_{A \\in \\mathcal S} A"}</M>. U is
          a cut: it contains some non-empty A, and U ⊆ B ≠ ℚ; if u ∈ U then u ∈ A for some A ∈ 𝒮, so every q &lt; u is in A ⊆ U;
          and A has an element larger than u, which lies in U. U is an upper bound because A ⊆ U for each A ∈ 𝒮. It is the
          least: if C is any upper bound, then A ⊆ C for every A ∈ 𝒮, so U ⊆ C.
        </p>
      </Proof>
      <Remark title="only one real line">
        <p>
          Any two complete ordered fields are isomorphic by a unique order-preserving field isomorphism. So the construction
          does not matter, only the axioms: from now on we use the field, order and completeness axioms of the earlier
          lesson, knowing a model exists.
        </p>
      </Remark>

      <Example title="approaching a cut with rationals">
        <p>
          A cut can be explored with nothing but rational arithmetic. Bisection keeps one endpoint inside and one outside,
          halving the gap each step. Exact fractions show that the endpoints never meet:
        </p>
        <Code>{CUT}</Code>
      </Example>

      <Example title="the other construction">
        <p>
          Newton&apos;s iteration <M>{"x \\mapsto (x + 2/x)/2"}</M> gives rationals 1, 3/2, 17/12, 577/408, … whose squares
          approach 2 extremely fast, yet the sequence has no rational limit. Cantor built ℝ from such sequences: a real
          number is a Cauchy sequence of rationals, with two sequences identified when their difference tends to 0. Reading
          off a cut digit by digit gives its decimal expansion, a third description.
        </p>
        <Code>{APPROX}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "width",
      rung: "check",
      prompt: <p>Bisection for the √2 cut starts with [1, 2]. How wide is the interval after 10 steps? Give six decimal places.</p>,
      answer: { kind: "numeric", value: 0.000977, tolerance: 0.000001 },
    },
    {
      key: "newton",
      rung: "check",
      prompt: <p>The Newton iterates for √2 are 1, 3/2, 17/12, … What is the next one, as a decimal to six places?</p>,
      answer: { kind: "numeric", value: 1.414216, tolerance: 0.000001 },
    },
    {
      key: "cut",
      rung: "apply",
      prompt: <p>Which of these subsets of ℚ is a Dedekind cut?</p>,
      answer: {
        kind: "choice",
        options: ["{q : q < 0 or q² < 3}", "{q : q ≤ 1}", "{q : q² < 2}", "ℚ"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def in_sqrt2_cut(q):
    return q < 0 or q * q < 2

def bisect_cut(cut, lo, hi, steps):
    lo, hi = Fraction(lo), Fraction(hi)
    for _ in range(steps):
        mid = (lo + hi) / 2
        if cut(mid):
            lo = mid
        else:
            hi = mid
    return lo, hi

lo, hi = bisect_cut(in_sqrt2_cut, 1, 2, 3)
print(lo, hi, hi - lo, in_sqrt2_cut(Fraction(-5)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["11/8 3/2 1/8 True", "5/4 3/2 1/4 True", "11/8 3/2 1/8 False", "3/2 2 1/2 True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def newton_sqrt2(n):
    x = Fraction(1)
    out = [x]
    for _ in range(n):
        x = (x + 2 / x) / 2
        out.append(x)
    return out

def decimal_digits(cut, k):
    x = 0
    while cut(Fraction(x + 1)):
        x += 1
    s, x = str(x) + ".", Fraction(x)
    for i in range(1, k + 1):
        d = 9
        while not cut(x + Fraction(d, 10 ** i)):
            d -= 1
        x += Fraction(d, 10 ** i)
        s += str(d)
    return s

xs = newton_sqrt2(3)
print(xs[-1], xs[-1] ** 2 - 2)
print(decimal_digits(lambda q: q < 0 or q * q < 2, 6), decimal_digits(lambda q: q < 0 or q ** 3 < 10, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "577/408 1/166464\n1.414213 2.154",
          "577/408 -1/166464\n1.414213 2.154",
          "577/408 1/166464\n1.414214 2.154",
          "17/12 1/144\n1.414213 2.154",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>in_sqrt2_cut(q)</C>, testing membership of a Fraction in the cut of √2, and{" "}
          <C>bisect_cut(cut, lo, hi, steps)</C>, which, given a membership test with lo inside and hi outside, halves the
          interval steps times keeping that property and returns the final (lo, hi) as Fractions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def in_sqrt2_cut(q):
    return q < 2

def bisect_cut(cut, lo, hi, steps):
    return Fraction(lo), Fraction(hi)
`,
        solution: CUT,
        tests: [
          { name: "membership", code: `assert in_sqrt2_cut(Fraction(-3)) and in_sqrt2_cut(Fraction(7, 5)) and not in_sqrt2_cut(Fraction(3, 2))
assert not in_sqrt2_cut(Fraction(17, 12)) and in_sqrt2_cut(Fraction(0))` },
          { name: "bisection", code: `lo, hi = bisect_cut(in_sqrt2_cut, 1, 2, 3)
assert (lo, hi) == (Fraction(11, 8), Fraction(3, 2))
lo, hi = bisect_cut(lambda q: q < 0 or q ** 3 < 5, 1, 2, 20)
assert isinstance(lo, Fraction) and hi - lo == Fraction(1, 2 ** 20) and lo ** 3 < 5 <= hi ** 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>newton_sqrt2(n)</C>, returning the list of the first n + 1 Newton iterates for √2 starting from Fraction(1),
          and <C>decimal_digits(cut, k)</C>, returning the decimal expansion of the cut&apos;s least upper bound truncated to k
          places, as a string like &quot;1.414&quot;: find the integer part, then each digit as the largest one keeping the
          prefix inside the cut. Assume 0 is in the cut.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def newton_sqrt2(n):
    return [Fraction(1)]

def decimal_digits(cut, k):
    return "0."
`,
        solution: APPROX,
        tests: [
          { name: "newton", code: `xs = newton_sqrt2(4)
assert xs[:4] == [Fraction(1), Fraction(3, 2), Fraction(17, 12), Fraction(577, 408)] and len(xs) == 5
assert 0 < xs[4] ** 2 - 2 < Fraction(1, 10 ** 10)` },
          { name: "digits", code: `assert decimal_digits(lambda q: q < 0 or q * q < 2, 6) == "1.414213"
assert decimal_digits(lambda q: q < Fraction(22, 7), 4) == "3.1428"
assert decimal_digits(lambda q: q < 0 or q * q < 49, 2) == "6.99"` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let 𝒮 be a non-empty set of Dedekind cuts, all contained in a cut B. Prove that the union U of the members of 𝒮 is a
          cut and that it is the least upper bound of 𝒮 for the order ⊆.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Checks U is non-empty (contains a member of 𝒮) and U ≠ ℚ (U ⊆ B ≠ ℚ).",
          "Checks downward closure and no largest element, each by passing to a single member A ∈ 𝒮 containing the given element.",
          "Shows U is an upper bound (A ⊆ U) and the least one (any upper bound C contains every A, hence U ⊆ C).",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: <p>Starting bisection from [1, 2], how many steps are needed before the interval is narrower than 10⁻⁶?</p>,
      answer: { kind: "numeric", value: 20, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the rationals have a gap at √2, how a Dedekind cut defines a real number from rationals alone, why the union of a bounded family of cuts is its least upper bound, and how Cauchy sequences give another construction.",

  glimpse: (
    <>
      <p>
        The least upper bound property is one way to say ℝ has no holes. The next lesson shows it is equivalent to several
        others, nested intervals, monotone convergence and Cauchy completeness, which are often more convenient.
      </p>
    </>
  ),
};
