import { M, MD } from "@/components/Math";
import { Axiom, Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { NestedIntervalsViz } from "@/components/viz/NestedIntervalsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.1.5",
  minutes: 70,
  links: {
    foreshadows: ["m2.1.2", "m2.1.3", "m2.2.2", "m8.1.1"],
  },

  puzzle: (
    <>
      <p>
        Draw the number line and mark every rational number on it: every fraction, positive and negative. Between any
        two of them there is another, so the marks are packed together with no two neighbours.
      </p>
      <p>
        Have you covered the whole line? If you drew a circle of radius <M>{"\\sqrt{2}"}</M> centred at 0, would it cross
        the line at a mark?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        It would not. The circle crosses the line at <M>{"\\sqrt{2}"}</M>, and the last lesson proved that is not a
        fraction. So the rationals, packed as they are, leave holes, and the holes are everywhere: at{" "}
        <M>{"\\sqrt{2}"}</M>, at <M>{"\\sqrt{2} + 1"}</M>, at <M>{"\\tfrac{\\sqrt 2}{2}"}</M>, and at infinitely many other
        points in every stretch of the line.
      </p>
      <p>
        You can trap <M>{"\\sqrt{2}"}</M> with fractions as tightly as you like. It lies between 1 and 2, then between 1.4
        and 1.5, then between 1.41 and 1.42, and so on. Each interval sits inside the last and is ten times shorter. Try
        it below.
      </p>
      <NestedIntervalsViz />
      <p>
        The intervals close in on a single point, yet no fraction is at that point. The <strong>real numbers</strong> are
        what you get when you fill every such hole: one number for every point of the line.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the real numbers">
        <p>
          The <strong>real numbers</strong> <M>{"\\mathbb{R}"}</M> are the numbers that measure positions on a line,
          equivalently the numbers with a decimal expansion, finite or infinite. They include the integers, the
          rationals and the irrationals:
        </p>
        <MD>{"\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}."}</MD>
        <p>
          The laws of arithmetic and the facts about order from the earlier lessons all hold in <M>{"\\mathbb{R}"}</M>.
          What is new is one further property.
        </p>
      </Definition>

      <Axiom title="completeness, nested interval form">
        <p>
          Suppose <M>{"[a_1, b_1] \\supseteq [a_2, b_2] \\supseteq [a_3, b_3] \\supseteq \\cdots"}</M> are closed
          intervals, each inside the one before, and their lengths <M>{"b_n - a_n"}</M> become smaller than any positive
          number you choose. Then there is exactly one real number that lies in every one of them.
        </p>
      </Axiom>

      <p>
        The rationals fail this test: the decimal intervals around <M>{"\\sqrt{2}"}</M> have rational endpoints, but no
        rational number lies in all of them. Completeness is precisely the statement &ldquo;the line has no holes&rdquo;.
        Calculus depends on it at every turn, and in Real Analysis you will build <M>{"\\mathbb{R}"}</M> from{" "}
        <M>{"\\mathbb{Q}"}</M> and prove it, rather than assume it.
      </p>

      <Definition title="intervals">
        <p>For real numbers <M>{"a < b"}</M>:</p>
        <ul>
          <li><M>{"[a, b]"}</M> is all <M>x</M> with <M>{"a \\le x \\le b"}</M> (closed: both ends included);</li>
          <li><M>{"(a, b)"}</M> is all <M>x</M> with <M>{"a < x < b"}</M> (open: both ends excluded);</li>
          <li><M>{"[a, b)"}</M> and <M>{"(a, b]"}</M> include one end only;</li>
          <li><M>{"[a, \\infty)"}</M> is all <M>{"x \\ge a"}</M>, and <M>{"(-\\infty, b)"}</M> is all <M>{"x < b"}</M>. The symbol <M>{"\\infty"}</M> is not a number; it only says the interval goes on for ever.</li>
        </ul>
      </Definition>

      <Definition title="absolute value">
        <MD>{"|x| = \\begin{cases} x & \\text{if } x \\ge 0, \\\\ -x & \\text{if } x < 0. \\end{cases}"}</MD>
        <p>
          So <M>{"|x|"}</M> is the distance from <M>x</M> to 0, and <M>{"|x - y|"}</M> is the distance between <M>x</M>{" "}
          and <M>y</M>. Note that <M>{"|x| \\ge 0"}</M> and <M>{"-|x| \\le x \\le |x|"}</M> for every <M>x</M>.
        </p>
      </Definition>

      <Proposition title="distance and intervals">
        <p>For <M>{"r > 0"}</M>: <M>{"|x - a| < r"}</M> exactly when <M>{"a - r < x < a + r"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          If <M>{"x \\ge a"}</M>, then <M>{"|x - a| = x - a"}</M>, and <M>{"x - a < r"}</M> means <M>{"x < a + r"}</M>; the
          other inequality <M>{"a - r < x"}</M> holds automatically since <M>{"a - r < a \\le x"}</M>. If{" "}
          <M>{"x < a"}</M>, then <M>{"|x - a| = a - x"}</M>, and <M>{"a - x < r"}</M> means <M>{"x > a - r"}</M>, while{" "}
          <M>{"x < a < a + r"}</M> holds automatically. In both cases the two statements say the same thing.
        </p>
      </Proof>
      <p>In words: the points within distance <M>r</M> of <M>a</M> form the open interval centred at <M>a</M> of radius <M>r</M>.</p>

      <Example>
        <p>
          Solve <M>{"|2x - 3| \\le 5"}</M>. The same argument with <M>{"\\le"}</M> gives <M>{"-5 \\le 2x - 3 \\le 5"}</M>.
          Add 3: <M>{"-2 \\le 2x \\le 8"}</M>. Divide by 2: <M>{"-1 \\le x \\le 4"}</M>. The solution set is{" "}
          <M>{"[-1, 4]"}</M>.
        </p>
      </Example>

      <Theorem title="the triangle inequality">
        <p>For all real <M>x</M> and <M>y</M>, <M>{"|x + y| \\le |x| + |y|"}</M>.</p>
      </Theorem>
      <Proof>
        <p>Add the inequalities <M>{"-|x| \\le x \\le |x|"}</M> and <M>{"-|y| \\le y \\le |y|"}</M>:</p>
        <MD>{"-(|x| + |y|) \\le x + y \\le |x| + |y|."}</MD>
        <p>
          By the proposition (in its <M>{"\\le"}</M> form, with <M>{"a = 0"}</M> and <M>{"r = |x| + |y|"}</M>), this says{" "}
          <M>{"|x + y| \\le |x| + |y|"}</M>.
        </p>
      </Proof>

      <Remark title="why the name">
        <p>
          Put <M>{"x = p - q"}</M> and <M>{"y = q - s"}</M>. The theorem becomes{" "}
          <M>{"|p - s| \\le |p - q| + |q - s|"}</M>: going from <M>p</M> to <M>s</M> directly is never longer than going
          by way of <M>q</M>. In the plane, that is the statement that one side of a triangle is no longer than the other
          two together. This inequality will be your most-used tool in Calculus and Real Analysis.
        </p>
      </Remark>

      <Theorem title="rationals are everywhere">
        <p>Between any two different real numbers there is a rational number.</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"x < y"}</M>, and choose <M>k</M> so large that <M>{"10^{-k} < y - x"}</M>. Walk along the line in steps of <M>{"10^{-k}"}</M>, that is, through the
          numbers <M>{"\\tfrac{m}{10^k}"}</M> for integers <M>m</M>, and let <M>q</M> be the first of them that is greater than{" "}
          <M>x</M>. Then <M>q</M> is rational, and since the step before it was at most <M>x</M>, we have{" "}
          <M>{"x < q \\le x + 10^{-k} < y"}</M>.
        </p>
      </Proof>
      <p>
        So both kinds of number are spread through the whole line: rationals between any two reals, and, as an exercise
        in Calculus will show, irrationals too. Yet in a precise sense you will meet in Proof and Logic, there are far
        more irrationals than rationals.
      </p>
    </>
  ),

  practice: [
    {
      key: "notation",
      rung: "check",
      prompt: <p>Which interval is the set of all <M>x</M> with <M>{"-2 < x \\le 3"}</M>?</p>,
      answer: { kind: "choice", options: ["[-2, 3]", "(-2, 3)", "(-2, 3]", "[-2, 3)"], correct: [2] },
    },
    {
      key: "abs",
      rung: "check",
      prompt: <p>Compute <M>{"|3 - 8| + |-4|"}</M>.</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "solve",
      rung: "apply",
      prompt: <p>Which interval is the solution set of <M>{"|x - 1| < 3"}</M>?</p>,
      answer: { kind: "choice", options: ["(-2, 4)", "(-3, 3)", "[-2, 4]", "(-4, 2)"], correct: [0] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>How many integers <M>x</M> satisfy <M>{"|2x - 3| \\le 5"}</M>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "trap",
      rung: "apply",
      prompt: (
        <p>
          In the decimal zoom for <M>{"\\sqrt{3}"}</M>, the interval of width <M>{"0.01"}</M> is <M>{"[c, c + 0.01]"}</M>.
          What is <M>c</M>? Work it out by squaring, not with a calculator&rsquo;s square-root key.
        </p>
      ),
      answer: { kind: "numeric", value: 1.73 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [-2, 3.5, -0.5, 1, 0]
print(sorted(xs)[1], max(xs) - min(xs))`}</Code>
          <p>Sorting puts numbers in their order on the line. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-0.5 5.5", "-2 5.5", "0 3.5", "-0.5 1.5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x = -3.7
print(math.floor(x), math.ceil(x), int(x))`}</Code>
          <p>floor moves left on the number line, ceil moves right, and int drops the decimal part. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-4 -3 -3", "-3 -4 -4", "-4 -3 -4", "-3 -3 -3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>in_closed(x, a, b)</C>, which says whether x lies in the closed interval [a, b], and <C>in_open(x, a, b)</C>, which says whether it lies in the open interval (a, b).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def in_closed(x, a, b):
    return a < x < b

def in_open(x, a, b):
    return a < x
`,
        solution: `def in_closed(x, a, b):
    return a <= x <= b

def in_open(x, a, b):
    return a < x < b
`,
        tests: [
          { name: "open", code: `assert in_open(1, 0, 2) and not in_open(0, 0, 2) and not in_open(2, 0, 2), 'An open interval leaves out its ends.'` },
          { name: "closed", code: `assert in_closed(0, 0, 2) and in_closed(2, 0, 2) and not in_closed(2.1, 0, 2) and not in_closed(-0.1, 0, 2), 'A closed interval includes its ends.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>overlap(a, b, c, d)</C>, the length of the part of the line shared by the intervals [a, b] and [c, d], and <C>gap(a, b, c, d)</C>, the distance between them, which is 0 when they meet. The shared part runs from the larger left end to the smaller right end. For example, [1, 5] and [3, 9] share [3, 5], so <C>overlap(1, 5, 3, 9)</C> is 2, and [1, 2] and [6, 7] have <C>gap</C> 4.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def overlap(a, b, c, d):
    return b - c

def gap(a, b, c, d):
    return c - b
`,
        solution: `def overlap(a, b, c, d):
    return max(0, min(b, d) - max(a, c))

def gap(a, b, c, d):
    return max(0, max(a, c) - min(b, d))
`,
        tests: [
          { name: "overlap", code: `assert overlap(1, 5, 3, 9) == 2 and overlap(3, 9, 1, 5) == 2 and overlap(0, 10, 2, 3) == 1 and overlap(1, 2, 6, 7) == 0, 'From max of the left ends to min of the right ends, but never negative.'` },
          { name: "gap", code: `assert gap(1, 2, 6, 7) == 4 and gap(6, 7, 1, 2) == 4 and gap(1, 5, 3, 9) == 0 and gap(-3, -1, 1, 4) == 2, 'The gap is the same distance taken the other way round.'` },
        ],
      },
    },
    {
      key: "reverse",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"|a| - |b| \\le |a - b|"}</M> for all real <M>a</M>, <M>b</M>, using the triangle inequality.
          (Hint: <M>{"a = (a - b) + b"}</M>.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes a as (a - b) + b.",
          "Applies the triangle inequality to get |a| ≤ |a - b| + |b|.",
          "Rearranges to |a| - |b| ≤ |a - b|.",
        ],
      },
    },
    {
      key: "two-distances",
      rung: "stretch",
      prompt: <p>How many integers <M>n</M> satisfy <M>{"|n - 5| + |n + 3| = 8"}</M>?</p>,
      answer: { kind: "numeric", value: 9 },
    },
  ],

  teachBack:
    "Explain what it means to say the rational numbers have holes but the real numbers do not. Use √2 and the zooming intervals, and say why being packed tightly is not the same as having no holes.",

  glimpse: (
    <p>
      This completes the number systems of school mathematics, from counting to the continuum. Completeness returns as
      the least upper bound property in Calculus, and in Real Analysis you will build the reals from the rationals. The
      statement <M>{"|x - a| < r"}</M> is the seed of the epsilon-delta definition of a limit. Next, letters stand in for
      numbers, and algebra begins.
    </p>
  ),
};
