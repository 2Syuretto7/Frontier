import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SupremumViz } from "@/components/viz/SupremumViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.1.2",
  minutes: 80,
  links: {
    revisits: ["m1.3.3"],
    foreshadows: ["m8.1.2", "m2.3.2", "m2.8.1"],
  },

  puzzle: (
    <>
      <p>
        What is the largest number less than 1? Not 0.9, since 0.99 is larger; not 0.99, since 0.999 is larger. There is no
        largest one. Yet the numbers less than 1 plainly have a natural ceiling, namely 1 itself.
      </p>
      <p>
        Now stay inside the rationals, and look at the rationals whose square is less than 2. They too are bounded above: 2 is
        bigger than all of them, and so are 1.5 and 1.42. Is there a smallest rational that is bigger than all of them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The rationals satisfy every axiom so far: they form an ordered field. Yet they have gaps. The rationals with square
        below 2 creep up towards a point where there is no rational to meet them. Calculus cannot live with gaps like this. A
        curve that starts below the axis and ends above it should cross the axis somewhere, and a sequence of better and better
        approximations should approach something.
      </p>
      <p>
        The third and last axiom fills the gaps. It says that whenever a set has a ceiling, it has a lowest possible ceiling.
        Below, choose a set and slide the candidate bound b. It turns from &ldquo;not an upper bound&rdquo; to &ldquo;upper
        bound&rdquo; at exactly one point.
      </p>
      <SupremumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="upper bounds and suprema">
        <p>
          Let S be a set of real numbers. A number b is an <strong>upper bound</strong> of S if <M>{"x \\le b"}</M> for every x
          in S, and S is <strong>bounded above</strong> if it has one. A number s is the <strong>supremum</strong>, or{" "}
          <strong>least upper bound</strong>, of S, written <M>{"\\sup S"}</M>, if:
        </p>
        <ol>
          <li>s is an upper bound of S, and</li>
          <li>
            <M>{"s \\le b"}</M> for every upper bound b of S.
          </li>
        </ol>
        <p>
          If the supremum belongs to S, it is the <strong>maximum</strong> of S. Lower bounds and the <strong>infimum</strong>,
          or greatest lower bound, <M>{"\\inf S"}</M>, are defined the same way with the inequalities reversed.
        </p>
      </Definition>

      <Example title="suprema with and without maxima">
        <p>
          <M>{"\\sup\\,(0, 1] = 1"}</M>, and 1 is the maximum. <M>{"\\sup\\,(0, 1) = 1"}</M> too, but this set has no
          maximum. For <M>{"S = \\{1 - 1/n : n \\ge 1\\}"}</M>, every term is below 1, and any b below 1 is beaten by a term
          once <M>{"1/n < 1 - b"}</M>; so <M>{"\\sup S = 1"}</M>, and again it is not attained.
        </p>
      </Example>

      <Definition title="the completeness axiom">
        <p>
          Every non-empty set of real numbers that is bounded above has a supremum in <M>{"\\mathbb{R}"}</M>.
        </p>
        <p>
          This is our third and final axiom: <M>{"\\mathbb{R}"}</M> is a <strong>complete ordered field</strong>. One can
          prove that any two complete ordered fields are the same up to relabelling, so these axioms describe the real numbers
          exactly.
        </p>
      </Definition>

      <Remark title="the rationals are not complete">
        <p>
          Let <M>{"S = \\{x \\in \\mathbb{Q} : x^2 < 2\\}"}</M>. It is non-empty and bounded above by 2. In{" "}
          <M>{"\\mathbb{R}"}</M> its supremum is <M>{"\\sqrt{2}"}</M>. But <M>{"\\sqrt{2}"}</M> is irrational, as you proved
          by contradiction in Proof and Logic, and between any rational upper bound and <M>{"\\sqrt{2}"}</M> there is a smaller
          rational upper bound. So within <M>{"\\mathbb{Q}"}</M>, S has upper bounds but no least one.
        </p>
      </Remark>

      <Theorem title="the approximation property">
        <p>
          Let s be an upper bound of S. Then <M>{"s = \\sup S"}</M> if and only if, for every <M>{"\\varepsilon > 0"}</M>,
          there is an x in S with <M>{"x > s - \\varepsilon"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>{"s = \\sup S"}</M> and <M>{"\\varepsilon > 0"}</M>. Then <M>{"s - \\varepsilon < s"}</M>, so{" "}
          <M>{"s - \\varepsilon"}</M> is not an upper bound, since s is the least one. So some x in S has{" "}
          <M>{"x > s - \\varepsilon"}</M>.
        </p>
        <p>
          Conversely, suppose the condition holds, and let b be any upper bound. If <M>{"b < s"}</M>, take{" "}
          <M>{"\\varepsilon = s - b > 0"}</M>: some x in S has <M>{"x > s - \\varepsilon = b"}</M>, contradicting that b is an
          upper bound. So <M>{"s \\le b"}</M>, and s is the least upper bound.
        </p>
      </Proof>

      <Theorem title="the Archimedean property">
        <p>
          The natural numbers are not bounded above in <M>{"\\mathbb{R}"}</M>. Equivalently, for every{" "}
          <M>{"\\varepsilon > 0"}</M> there is a natural number n with <M>{"1/n < \\varepsilon"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>{"\\mathbb{N}"}</M> were bounded above. By completeness it has a supremum s. By the approximation property
          with <M>{"\\varepsilon = 1"}</M>, there is a natural number n with <M>{"n > s - 1"}</M>. Then{" "}
          <M>{"n + 1 > s"}</M>, and <M>{"n + 1"}</M> is a natural number, so s is not an upper bound after all. For the second
          form, choose a natural number <M>{"n > 1/\\varepsilon"}</M>.
        </p>
      </Proof>

      <Remark title="why this is the axiom calculus needs">
        <p>
          The first two groups of axioms are algebra. Completeness is where analysis begins. Every major theorem of this course,
          that a continuous function crossing the axis has a root, that a bounded increasing sequence converges, that a
          continuous function on a closed interval has a maximum, rests on it, and each fails in <M>{"\\mathbb{Q}"}</M>. For
          example, <M>{"x^2 - 2"}</M> is negative at 1 and positive at 2, yet it has no rational root.
        </p>
        <MD>{"\\text{ordered field} + \\text{completeness} = \\mathbb{R}."}</MD>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "half-open",
      rung: "check",
      prompt: (
        <p>
          What is <M>{"\\sup\\,(0, 1]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "has-max",
      rung: "check",
      prompt: <p>Which of these sets has a maximum? Choose all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["(0, 1]", "(0, 1)", "{1 − 1/n : n ≥ 1}", "{1, 2, 3}"],
        correct: [0, 3],
      },
    },
    {
      key: "alt-sup",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"S = \\{(-1)^n / n : n \\ge 1\\}"}</M>. What is <M>{"\\sup S"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "alt-inf",
      rung: "apply",
      prompt: (
        <p>
          For the same set <M>{"S = \\{(-1)^n / n : n \\ge 1\\}"}</M>, what is <M>{"\\inf S"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -1 },
    },
    {
      key: "archimedes",
      rung: "apply",
      prompt: (
        <p>
          What is the smallest natural number n with <M>{"1/n < 0.003"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 334 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [1 - 1 / n for n in range(1, 1001)]
print(max(xs) < 1, round(max(xs), 3))`}</Code>
          <p>Every element is below 1, and the supremum of the full infinite set is 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True 0.999", "True 1.0", "False 1.0", "True 0.99"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sqrt2_bounds(steps)</C>, which narrows an interval [lo, hi] around the supremum of {"{x : x² < 2}"} by bisection, starting from [1, 2], and returns (lo, hi) after the given number of halvings. Keep lo² &lt; 2 ≤ hi².
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sqrt2_bounds(steps):
    lo, hi = 1.0, 2.0
    return lo, hi
`,
        solution: `def sqrt2_bounds(steps):
    lo, hi = 1.0, 2.0
    for _ in range(steps):
        mid = (lo + hi) / 2
        if mid * mid < 2:
            lo = mid
        else:
            hi = mid
    return lo, hi
`,
        tests: [
          { name: "one step", code: `assert sqrt2_bounds(1) == (1.0, 1.5), 'After one halving the interval is [1, 1.5].'` },
          { name: "narrow", code: `lo, hi = sqrt2_bounds(40)
assert lo * lo < 2 <= hi * hi and hi - lo < 1e-11, 'After 40 halvings the interval should be tiny and still contain √2.'` },
        ],
      },
    },
    {
      key: "unique",
      rung: "prove",
      prompt: <p>Prove that a set can have at most one supremum.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes s and t are both suprema of S.",
          "Uses that t is an upper bound and s is least to get s ≤ t, and symmetrically t ≤ s.",
          "Concludes s = t (by trichotomy or antisymmetry).",
        ],
      },
    },
    {
      key: "sum-sup",
      rung: "stretch",
      prompt: (
        <p>
          Let A and B be non-empty sets bounded above, and let <M>{"A + B = \\{a + b : a \\in A, b \\in B\\}"}</M>. Prove that{" "}
          <M>{"\\sup(A + B) = \\sup A + \\sup B"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows sup A + sup B is an upper bound of A + B.",
          "Given ε > 0, finds a in A and b in B within ε/2 of sup A and sup B (the approximation property).",
          "Concludes that a + b > sup A + sup B − ε, so the approximation property holds for A + B.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what the supremum of a set is, why the rationals with square below 2 have no rational supremum, and why calculus needs the completeness axiom.",

  glimpse: (
    <p>
      Completeness comes in many equivalent forms: every bounded monotone sequence converges, nested closed intervals have a common point, every Cauchy sequence converges. Real Analysis proves they are all the same, and later in this course completeness is what makes limits of sequences and sums of series exist at all. Next, the absolute value: the tool for measuring how close two numbers are.
    </p>
  ),
};
