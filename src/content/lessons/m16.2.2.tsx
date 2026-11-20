import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShatterViz } from "@/components/viz/ShatterViz";
import type { LessonContent } from "@/lib/types";

const SHATTER = `from itertools import product

def realisable_interval(points, labels):
    pos = [x for x, y in zip(points, labels) if y]
    if not pos:
        return True
    lo, hi = min(pos), max(pos)
    return all(y or not (lo <= x <= hi) for x, y in zip(points, labels))

def shatters(points, realisable):
    return all(realisable(points, lab) for lab in product([0, 1], repeat=len(points)))

def growth(points, realisable):
    return sum(realisable(points, lab) for lab in product([0, 1], repeat=len(points)))`;

const SAUER = `from math import comb, e

def sauer_bound(m, d):
    return sum(comb(m, i) for i in range(d + 1))

def sauer_exp_bound(m, d):
    return (e * m / d) ** d

def vc_halfspaces(dim, bias=True):
    return dim + 1 if bias else dim`;

export const lesson: LessonContent = {
  id: "m16.2.2",
  minutes: 50,
  links: {
    requires: ["m16.2.1", "m16.1.3"],
    revisits: ["m3.4.1"],
    foreshadows: ["m16.2.3", "m16.3.1", "m16.3.3"],
  },

  puzzle: (
    <>
      <p>
        There are infinitely many thresholds on the real line, yet they learn as if they were a handful. There are also
        infinitely many classifiers of the form <M>{"\\operatorname{sign}(\\sin(\\theta x))"}</M>, one parameter just like a
        threshold, yet they can fit any labelling of suitably chosen points and do not learn at all. Counting hypotheses and
        counting parameters both fail. What is the right way to measure the size of a class?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        On a fixed sample, what matters is not how many hypotheses there are but how many different ways they can label the
        sample. Thresholds can label m points on a line in only m + 1 ways, not <M>{"2^m"}</M>. The VC dimension is the
        largest number of points the class can label in every possible way. Beyond it, a surprising thing happens: the number
        of achievable labellings stops growing exponentially and grows only polynomially.
      </p>
      <ShatterViz />
    </>
  ),

  theory: (
    <>
      <Definition title="shattering and VC dimension">
        <p>
          The restriction of H to a finite set C is the set of labellings of C that hypotheses in H produce. H shatters C if
          every one of the <M>{"2^{|C|}"}</M> labellings is produced (<C>shatters</C>). The VC dimension VCdim(H) is the size of
          the largest set H shatters, or infinity if it shatters arbitrarily large sets. To show VCdim(H) = d, exhibit one set of
          size d that is shattered, and show that no set of size d + 1 is.
        </p>
        <Code>{SHATTER}</Code>
      </Definition>

      <Example title="classes on the line and in the plane">
        <p>
          Thresholds have VC dimension 1: any single point is shattered, but for two points a &lt; b the labelling (1, 0) is
          impossible. Intervals have VC dimension 2: two points are shattered, but for a &lt; b &lt; c the labelling (1, 0, 1) is
          impossible (<C>realisable_interval</C>). Axis-aligned rectangles have VC dimension 4: four points in a diamond are
          shattered, and among any five points the one that is not extreme in any of the four directions cannot be labelled 0
          while the others are 1.
        </p>
      </Example>

      <Theorem title="half-spaces">
        <p>
          The class <M>{"\\{x \\mapsto \\operatorname{sign}(w^\\top x + b)\\}"}</M> on <M>{"\\mathbb R^d"}</M> has VC dimension d + 1,
          and d without the bias b (<C>vc_halfspaces</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Lower bound: the origin and the d unit vectors are shattered, since any labels y can be met by{" "}
          <M>{"b = y_0"}</M>, <M>{"w_i = y_i - y_0"}</M> with labels in {"{−1, +1}"}. Upper bound: any d + 2 points{" "}
          <M>{"x_i"}</M>, lifted to <M>{"(x_i, 1) \\in \\mathbb R^{d+1}"}</M>, are linearly dependent (m3.4.1), so{" "}
          <M>{"\\sum_i a_i (x_i, 1) = 0"}</M> with some <M>{"a_i \\ne 0"}</M>. Label <M>{"x_i"}</M> positive exactly when{" "}
          <M>{"a_i > 0"}</M>. If a half-space produced this labelling, <M>{"\\sum_i a_i (w^\\top x_i + b)"}</M> would be a sum of
          non-negative terms with at least one positive (the coefficients sum to zero, so both signs occur), but it equals 0.
          This is Radon&apos;s theorem in disguise.
        </p>
      </Proof>

      <Theorem title="Sauer-Shelah lemma">
        <p>
          Let the growth function <M>{"\\tau_H(m)"}</M> be the largest number of labellings H produces on m points
          (<C>growth</C> counts them on given points). If VCdim(H) = d, then for all m
        </p>
        <MD>{"\\tau_H(m) \\le \\sum_{i=0}^{d} \\binom{m}{i} \\le \\left(\\frac{em}{d}\\right)^d \\quad (m \\ge d)."}</MD>
      </Theorem>
      <Proof>
        <p>
          A stronger statement is easier to prove by induction: for every finite C,{" "}
          <M>{"|H_C| \\le |\\{B \\subseteq C : H \\text{ shatters } B\\}|"}</M>. Since only sets of size at most d are shattered,
          the right side is at most <M>{"\\sum_{i \\le d} \\binom{m}{i}"}</M> (<C>sauer_bound</C>). For the induction, remove a
          point x from C and split the labellings of C into those whose restriction to C \ x has one extension and those
          with both labels at x. The first family is counted by the shattered subsets of C \ x; the second, viewed on C \ x,
          shatters a set B only if H shatters B ∪ {"{x}"}, which gives the remaining subsets. The exponential form follows from{" "}
          <M>{"\\sum_{i \\le d} \\binom{m}{i} \\le (m/d)^d \\sum_i \\binom{m}{i} (d/m)^i \\le (m/d)^d e^d"}</M>{" "}
          (<C>sauer_exp_bound</C>).
        </p>
        <Code>{SAUER}</Code>
      </Proof>

      <Remark title="parameters are not dimension">
        <p>
          For half-spaces the VC dimension equals the number of parameters, which makes it tempting to equate the two. The
          class <M>{"\\operatorname{sign}(\\sin(\\theta x))"}</M> has one parameter and infinite VC dimension: the points{" "}
          <M>{"x_i = 10^{-i}"}</M> are shattered by a suitable θ for every labelling. Conversely, many-parameter classes can have
          small VC dimension. No free lunch (m16.1.3) shows a class of infinite VC dimension is not PAC learnable; the next lesson
          shows that a finite one always is.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sauer",
      rung: "check",
      prompt: <p>A class has VC dimension 4. What upper bound does the Sauer-Shelah sum give on the number of labellings it can produce on 8 points?</p>,
      answer: { kind: "numeric", value: 163, tolerance: 0.5 },
    },
    {
      key: "hexagon",
      rung: "check",
      prompt: <p>Six points lie on a circle. How many of their 64 labellings can half-planes produce? (Positives must form a contiguous arc, and the all-positive and all-negative labellings count.)</p>,
      answer: { kind: "numeric", value: 32, tolerance: 0.5 },
    },
    {
      key: "proof",
      rung: "apply",
      prompt: <p>To prove that a class has VC dimension exactly d, what must you show?</p>,
      answer: {
        kind: "choice",
        options: [
          "Some set of d points is shattered, and no set of d + 1 points is shattered",
          "Every set of d points is shattered, and some set of d + 1 points is not",
          "The class has exactly d parameters",
          "Some set of d + 1 points is not shattered",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def realisable_interval(points, labels):
    pos = [x for x, y in zip(points, labels) if y]
    if not pos:
        return True
    lo, hi = min(pos), max(pos)
    return all(y or not (lo <= x <= hi) for x, y in zip(points, labels))

def shatters(points, realisable):
    return all(realisable(points, lab) for lab in product([0, 1], repeat=len(points)))

def growth(points, realisable):
    return sum(realisable(points, lab) for lab in product([0, 1], repeat=len(points)))

print(shatters([1, 2], realisable_interval), shatters([1, 2, 3], realisable_interval), growth([1, 2, 3, 4], realisable_interval))
print(realisable_interval([1, 2, 3], (1, 0, 1)), realisable_interval([5, 1, 3], (1, 0, 1)), growth([0], realisable_interval))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False 11\nFalse True 2",
          "True True 11\nFalse True 2",
          "True False 10\nFalse True 2",
          "True False 11\nFalse False 2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb, e

def sauer_bound(m, d):
    return sum(comb(m, i) for i in range(d + 1))

def sauer_exp_bound(m, d):
    return (e * m / d) ** d

def vc_halfspaces(dim, bias=True):
    return dim + 1 if bias else dim

print(sauer_bound(4, 2), sauer_bound(10, 3), sauer_bound(3, 5))
print(round(sauer_exp_bound(10, 3), 1), vc_halfspaces(2), vc_halfspaces(5, bias=False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "11 176 8\n743.9 3 5",
          "11 175 8\n743.9 3 5",
          "11 176 8\n743.9 2 5",
          "6 176 8\n743.9 3 5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>realisable_interval(points, labels)</C>, deciding whether some closed interval labels exactly the positive
          points 1, and <C>shatters(points, realisable)</C> and <C>growth(points, realisable)</C> for any realisability test.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def realisable_interval(points, labels):
    return True

def shatters(points, realisable):
    return True

def growth(points, realisable):
    return 0
`,
        solution: SHATTER,
        tests: [
          { name: "intervals", code: `assert realisable_interval([0, 1, 2], (0, 1, 0)) and not realisable_interval([0, 1, 2], (1, 0, 1)) and realisable_interval([2, 0, 1], (1, 0, 1)) and realisable_interval([], ())` },
          { name: "shattering", code: `assert shatters([3, 7], realisable_interval) and not shatters([1, 2, 3], realisable_interval) and growth([1, 2, 3], realisable_interval) == 7 and growth([1, 2], lambda p, l: sum(l) <= 1) == 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sauer_bound(m, d)</C>, <C>sauer_exp_bound(m, d)</C> and <C>vc_halfspaces(dim, bias=True)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb, e

def sauer_bound(m, d):
    return 2 ** m

def sauer_exp_bound(m, d):
    return 2.0 ** m

def vc_halfspaces(dim, bias=True):
    return dim
`,
        solution: SAUER,
        tests: [
          { name: "sauer", code: `assert sauer_bound(5, 1) == 6 and sauer_bound(5, 5) == 32 and sauer_bound(6, 2) == 22 and abs(sauer_exp_bound(2, 1) - 2 * e) < 1e-12` },
          { name: "half-spaces", code: `assert vc_halfspaces(3) == 4 and vc_halfspaces(3, bias=False) == 3 and vc_halfspaces(1) == 2` },
        ],
      },
    },
    {
      key: "factor",
      rung: "stretch",
      prompt: (
        <p>
          Half-planes in the plane, with bias, label 20 points. By what factor does 2^20 exceed the Sauer-Shelah sum? Give the
          nearest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 776, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Polynomial growth is what the union bound needed: replacing |H| by the number of labellings on a double sample turns
        the finite-class argument into one for any class of finite VC dimension. The next lesson assembles the result, the
        fundamental theorem of statistical learning.
      </p>
    </>
  ),
};
