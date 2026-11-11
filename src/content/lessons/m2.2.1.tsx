import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { ApproachViz } from "@/components/viz/ApproachViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.2.1",
  minutes: 60,
  links: {
    revisits: ["m1.7.1", "m2.1.2"],
    foreshadows: ["m2.6.1", "m2.8.1", "m8.5.1"],
  },

  puzzle: (
    <>
      <p>
        A car&rsquo;s speedometer reads 50 km per hour at a certain instant. But speed is distance divided by time, and in a
        single instant the car covers no distance in no time. So the speed at an instant seems to be <M>{"0/0"}</M>, which is
        meaningless. What, then, is the speedometer measuring?
      </p>
      <p>
        Here is a simpler version of the same puzzle. What is the value of <M>{"\\dfrac{x^2 - 1}{x - 1}"}</M> when{" "}
        <M>{"x = 1"}</M>?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At <M>{"x = 1"}</M> the expression is <M>{"0/0"}</M>, so it has no value there. But we can ask a different question:
        what happens to the value as x gets <em>close</em> to 1? At 0.9 it is 1.9; at 0.99 it is 1.99; at 1.01 it is 2.01. The
        values are homing in on 2. We say the <strong>limit</strong> as x tends to 1 is 2. Speed at an instant is a limit of
        the same kind: the average speed over shorter and shorter stretches of time.
      </p>
      <p>
        Choose a function and slide h towards 0. The two red points sit at <M>{"a - h"}</M> and <M>{"a + h"}</M>, one on
        each side of a.
      </p>
      <ApproachViz />
    </>
  ),

  theory: (
    <>
      <Definition title="limit (informal)">
        <p>We write</p>
        <MD>{"\\lim_{x \\to a} f(x) = L"}</MD>
        <p>
          if f(x) can be made as close to L as we like by taking x close enough to a, but not equal to a. In words: the limit
          of f(x) as x tends to a is L. We also write <M>{"f(x) \\to L"}</M> as <M>{"x \\to a"}</M>.
        </p>
      </Definition>

      <Remark title="the value at a does not matter">
        <p>
          The definition ignores what happens at <M>{"x = a"}</M> itself. f need not be defined at a, as with{" "}
          <M>{"(x^2 - 1)/(x - 1)"}</M> at 1. And if it is defined, its value there may differ from the limit: if we set{" "}
          <M>{"g(x) = x + 1"}</M> for <M>{"x \\ne 1"}</M> and <M>{"g(1) = 7"}</M>, the limit at 1 is still 2. Limits describe
          how a function behaves near a point, not at it.
        </p>
      </Remark>

      <Example title="simplifying first">
        <p>
          For <M>{"x \\ne 1"}</M>, <M>{"\\dfrac{x^2 - 1}{x - 1} = \\dfrac{(x - 1)(x + 1)}{x - 1} = x + 1"}</M>. Near 1, x + 1
          is near 2. So
        </p>
        <MD>{"\\lim_{x \\to 1} \\frac{x^2 - 1}{x - 1} = 2."}</MD>
        <p>
          Cancelling <M>{"x - 1"}</M> is allowed precisely because the limit never looks at <M>{"x = 1"}</M>, where it would
          mean dividing by zero.
        </p>
      </Example>

      <Example title="two ways for a limit to fail">
        <p>
          A limit can fail to exist in several ways. For <M>{"x / |x|"}</M> at 0, the values approach different numbers from
          the two sides, so no single L works. For <M>{"\\sin(1/x)"}</M> at 0, the values oscillate between <M>{"-1"}</M> and
          1 forever, approaching nothing at all. A third way, values growing without bound, is the subject of a later lesson.
        </p>
      </Example>

      <Remark title="tables of values can deceive">
        <p>
          Guessing a limit from a few values is risky. Take <M>{"f(x) = \\sin(\\pi / x)"}</M> and try{" "}
          <M>{"x = 0.1, 0.01, 0.001, \\ldots"}</M>. Every value is <M>{"\\sin(10^k \\pi) = 0"}</M>, so the table suggests
          the limit is 0. But at <M>{"x = 2/(4k + 1)"}</M>, which also approaches 0, f(x) is 1. There is no limit. The informal
          definition is a good guide, but it says &ldquo;as close as we like&rdquo; without saying how to check that. The next
          lesson makes it precise, so that limits can be proved rather than guessed.
        </p>
      </Remark>

      <Remark title="where limits lead">
        <p>
          Almost everything in this course is a limit. The derivative is the limit of slopes of chords; the integral is the
          limit of sums of thin rectangles; the sum of an infinite series is the limit of its partial sums. Newton and Leibniz
          used limits successfully for a century and a half before anyone could say exactly what they were.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cancel",
      rung: "check",
      prompt: (
        <p>
          Find <M>{"\\displaystyle\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "value-at-a",
      rung: "check",
      prompt: (
        <p>
          Let <M>{"g(x) = 2x"}</M> for <M>{"x \\ne 1"}</M>, and <M>{"g(1) = 5"}</M>. What is{" "}
          <M>{"\\lim_{x \\to 1} g(x)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "root",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle\\lim_{x \\to 4} \\frac{\\sqrt{x} - 2}{x - 4}"}</M>. (Hint: <M>{"x - 4"}</M> factorises as a
          difference of squares.)
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.001 },
    },
    {
      key: "cube",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle\\lim_{x \\to 2} \\frac{x^3 - 8}{x - 2}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "exists",
      rung: "apply",
      prompt: <p>For which of these does the limit as x tends to 0 exist? Choose all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["(sin x)/x", "x/|x|", "sin(1/x)", "(x² + x)/x"],
        correct: [0, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
for h in [0.1, 0.01, 0.001]:
    print(round(math.sin(h) / h, 6))`}</Code>
          <p>What does the last line printed show, to six decimal places?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.0, tolerance: 1e-06 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>estimate_limit(f, a)</C>, which returns f(a + h) for h = 10⁻⁶ as a numerical guess at the limit of f(x) as x → a. Use it on (x² − 1)/(x − 1) at a = 1.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def estimate_limit(f, a):
    return f(a)
`,
        solution: `def estimate_limit(f, a):
    return f(a + 1e-6)
`,
        tests: [
          { name: "removable", code: `assert abs(estimate_limit(lambda x: (x * x - 1) / (x - 1), 1) - 2) < 1e-5, 'You cannot evaluate at a itself: the formula divides by zero there. Step a little to the side.'` },
          { name: "sine", code: `import math
assert abs(estimate_limit(lambda x: math.sin(x) / x, 0) - 1) < 1e-6, 'sin(x)/x should approach 1 near 0.'` },
        ],
      },
    },
    {
      key: "deceive",
      rung: "prove",
      prompt: (
        <p>
          Explain why the values of <M>{"\\sin(\\pi/x)"}</M> at <M>{"x = 0.1, 0.01, 0.001, \\ldots"}</M> are all 0, and why
          the function nonetheless has no limit as <M>{"x \\to 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes π/x = 10ᵏπ at x = 10⁻ᵏ, and notes that the sine of a whole multiple of π is 0.",
          "Finds other points tending to 0, such as x = 2/(4k + 1), where the value is 1.",
          "Concludes that values near 0 do not all approach a single number, so there is no limit.",
        ],
      },
    },
    {
      key: "speed",
      rung: "stretch",
      prompt: (
        <p>
          A stone falls <M>{"5t^2"}</M> metres in t seconds. Write its average speed between times 2 and{" "}
          <M>{"2 + h"}</M> as an expression in h, simplify it, and find its limit as <M>{"h \\to 0"}</M>. Explain how this
          answers the puzzle about the speedometer.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the average speed as (5(2 + h)² − 20)/h.",
          "Simplifies to 20 + 5h for h ≠ 0.",
          "Finds the limit 20 metres per second.",
          "Explains that instantaneous speed is the limit of average speeds, which avoids dividing 0 by 0.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what lim f(x) = L as x → a means, why the value of f at a does not matter, and give an example where the limit does not exist.",

  glimpse: (
    <p>
      The informal idea of a limit carries the whole course: derivatives, integrals and infinite series are all limits. The next lesson gives the exact definition, and Real Analysis builds the theory of limits on it with full rigour.
    </p>
  ),
};
