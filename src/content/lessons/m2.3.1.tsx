import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ContinuityViz } from "@/components/viz/ContinuityViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.3.1",
  minutes: 70,
  links: {
    revisits: ["m2.2.3", "m0.3.4"],
  },

  puzzle: (
    <>
      <p>
        A popular description says a function is continuous if you can draw its graph without lifting your pen. Try it on{" "}
        <M>{"f(x) = 1/x"}</M>. You must lift your pen at <M>{"x = 0"}</M>. Yet 0 is not in the domain of f, and at every
        point where f is defined, nothing seems to go wrong.
      </p>
      <p>Is <M>{"1/x"}</M> continuous or not? And what should &ldquo;continuous&rdquo; mean, if the pen test gives the wrong answer?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Continuity is a property of a function <em>at a point</em>. A function is continuous at a if its value there is what
        the nearby values lead you to expect: the limit at a exists and equals f(a). Small changes in x then produce small
        changes in f(x). There are several ways this can fail, shown below. Only one of them can be repaired by changing a
        single value.
      </p>
      <ContinuityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="continuity">
        <p>
          Let f be defined on an open interval containing a. Then f is <strong>continuous at a</strong> if
        </p>
        <MD>{"\\lim_{x \\to a} f(x) = f(a)."}</MD>
        <p>
          In epsilon-delta form: for every <M>{"\\varepsilon > 0"}</M> there is a <M>{"\\delta > 0"}</M> such that{" "}
          <M>{"|x - a| < \\delta"}</M> implies <M>{"|f(x) - f(a)| < \\varepsilon"}</M>. (The condition <M>{"0 < |x - a|"}</M>{" "}
          is no longer needed, since at <M>{"x = a"}</M> the difference is 0.) f is <strong>continuous</strong> if it is
          continuous at every point of its domain. At an endpoint of a closed interval, we use the one-sided limit.
        </p>
      </Definition>

      <Remark title="three conditions">
        <p>
          The definition packs in three demands: f(a) must be defined, the limit at a must exist, and the two must be equal.
          The visualisation shows each failing: an infinite or oscillating discontinuity, or a jump, has no limit; a removable
          discontinuity has a limit that disagrees with the value.
        </p>
      </Remark>

      <Example title="the puzzle answered">
        <p>
          <M>{"1/x"}</M> is continuous at every a &ne; 0, by the quotient law. Since 0 is not in its domain, the question of
          continuity at 0 does not arise, and <M>{"1/x"}</M> is a continuous function. The pen test fails because the domain
          has two separate pieces. On a single interval, the pen test is a fair picture of continuity.
        </p>
      </Example>

      <Theorem title="building continuous functions">
        <p>If f and g are continuous at a, then so are <M>{"f + g"}</M>, <M>{"f - g"}</M>, <M>{"fg"}</M>, and <M>{"f/g"}</M> provided <M>{"g(a) \\ne 0"}</M>.</p>
        <p>
          If g is continuous at a and f is continuous at <M>{"g(a)"}</M>, then <M>{"f \\circ g"}</M> is continuous at a.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first part is the limit laws, with <M>{"L = f(a)"}</M> and <M>{"M = g(a)"}</M>. For composition, let{" "}
          <M>{"\\varepsilon > 0"}</M>. Since f is continuous at <M>{"g(a)"}</M>, there is an <M>{"\\eta > 0"}</M> with{" "}
          <M>{"|f(y) - f(g(a))| < \\varepsilon"}</M> whenever <M>{"|y - g(a)| < \\eta"}</M>. Since g is continuous at a, there
          is a <M>{"\\delta > 0"}</M> with <M>{"|g(x) - g(a)| < \\eta"}</M> whenever <M>{"|x - a| < \\delta"}</M>. Putting{" "}
          <M>{"y = g(x)"}</M>, <M>{"|x - a| < \\delta"}</M> gives <M>{"|f(g(x)) - f(g(a))| < \\varepsilon"}</M>.
        </p>
      </Proof>

      <Example title="a large stock of continuous functions">
        <p>
          Constants and x are continuous, so by the theorem every polynomial is continuous everywhere, and every rational
          function is continuous wherever its denominator is not 0. So are <M>{"\\sqrt{x}"}</M> on <M>{"[0, \\infty)"}</M>,
          sine and cosine, the exponential and the logarithm, though their proofs must wait until they are defined properly.
          Compositions such as <M>{"\\sqrt{1 + \\sin^2 x}"}</M> are then continuous too.
        </p>
      </Example>

      <Example title="a function continuous at exactly one point">
        <p>
          Let <M>{"f(x) = x"}</M> if x is rational and <M>{"f(x) = 0"}</M> if x is irrational. At 0, <M>{"|f(x) - f(0)| \\le |x|"}</M>,
          so <M>{"\\delta = \\varepsilon"}</M> works and f is continuous. At any <M>{"a \\ne 0"}</M>, there are rationals and
          irrationals arbitrarily close to a, with values near a and equal to 0, so the limit does not exist. No pen could
          draw this graph, yet the definition handles it without trouble.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "three",
      rung: "check",
      prompt: <p>Which of these is not part of the definition of f being continuous at a?</p>,
      answer: {
        kind: "choice",
        options: ["f(a) is defined", "the limit of f(x) as x → a exists", "the limit equals f(a)", "f is differentiable at a"],
        correct: [3],
      },
    },
    {
      key: "removable",
      rung: "check",
      prompt: <p>Which kind of discontinuity can be removed by redefining the function at a single point?</p>,
      answer: { kind: "choice", options: ["a jump", "an infinite discontinuity", "a removable discontinuity", "an oscillating discontinuity"], correct: [2] },
    },
    {
      key: "repair",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"f(x) = \\dfrac{x^2 - 4}{x - 2}"}</M> for <M>{"x \\ne 2"}</M>. What value should <M>{"f(2)"}</M> have to
          make f continuous at 2?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "k",
      rung: "apply",
      prompt: (
        <p>
          Let <M>{"f(x) = kx + 1"}</M> for <M>{"x < 2"}</M> and <M>{"f(x) = x^2"}</M> for <M>{"x \\ge 2"}</M>. For which k is f
          continuous at 2?
        </p>
      ),
      answer: { kind: "numeric", value: 1.5 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: (
        <p>
          At how many real numbers is <M>{"\\dfrac{x + 1}{x^2 - 5x + 6}"}</M> undefined, and so not continuous?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
f = lambda x: x * math.sin(1 / x) if x != 0 else 0.0
print(max(abs(f(10 ** -k)) for k in range(3, 8)) < 1e-3)`}</Code>
          <p>Is x·sin(1/x), set to 0 at 0, close to f(0) for small x? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>jump(f, a)</C>, which returns |f(a + h) − f(a − h)| for h = 10⁻⁹: near 0 for a function continuous at a, and clearly positive at a jump.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def jump(f, a):
    return 0.0
`,
        solution: `def jump(f, a):
    h = 1e-9
    return abs(f(a + h) - f(a - h))
`,
        tests: [
          { name: "continuous", code: `assert jump(lambda x: x * x, 3) < 1e-6, 'x² is continuous at 3.'` },
          { name: "floor", code: `import math
assert abs(jump(math.floor, 2) - 1) < 1e-12, 'The floor function jumps by 1 at every integer.'` },
        ],
      },
    },
    {
      key: "prove-abs",
      rung: "prove",
      prompt: (
        <p>
          Prove from the epsilon-delta definition that <M>{"f(x) = |x|"}</M> is continuous at every real number a.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Lets ε > 0 be given and chooses δ = ε.",
          "Uses the reverse triangle inequality: ||x| − |a|| ≤ |x − a|.",
          "Concludes |x − a| < δ implies ||x| − |a|| < ε.",
        ],
      },
    },
    {
      key: "one-point",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"f(x) = x"}</M> for rational x and <M>{"f(x) = 0"}</M> for irrational x. Prove carefully that f is not
          continuous at <M>{"a = 1"}</M>. (You may use that every interval contains both rationals and irrationals.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes f(1) = 1 and chooses a specific ε, such as 1/2.",
          "For any δ > 0, picks an irrational x with |x − 1| < δ.",
          "Shows |f(x) − f(1)| = 1 ≥ ε, so no δ works.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what it means for a function to be continuous at a point, and describe the different ways continuity can fail.",

  glimpse: (
    <p>
      The next two lessons prove the two great theorems about continuous functions on intervals. Real Analysis takes continuity further, defining it using any notion of distance, and Neural Networks from Scratch relies on it throughout: a network built from continuous pieces is continuous, which is why small changes to an input give small changes to the output.
    </p>
  ),
};
