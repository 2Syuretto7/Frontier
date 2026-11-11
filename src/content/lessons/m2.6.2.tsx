import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { UpperLowerViz } from "@/components/viz/UpperLowerViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.6.2",
  minutes: 85,
  links: {
    revisits: ["m2.1.2", "m2.3.4"],
    foreshadows: ["m8.7.1"],
  },

  puzzle: (
    <>
      <p>
        Riemann sums depend on choices: where to cut, and where in each piece to read the height. For <M>{"x^2"}</M> every
        choice led to the same limit. Must that always happen?
      </p>
      <p>
        Consider the function that is 1 at every rational number and 0 at every irrational number, on{" "}
        <M>{"[0, 1]"}</M>. Every piece of every partition contains both kinds of number. Choose rational sample points and
        every Riemann sum is 1; choose irrational ones and every sum is 0. What is the area under this graph?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        To make the area well defined, squeeze it. On each strip, the tallest rectangle that reaches the top of the graph
        overestimates; the shortest that stays under the graph underestimates. If refining the strips can bring the two
        totals as close together as we like, exactly one number lies between them all, and that number is the area.
      </p>
      <UpperLowerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="upper and lower sums">
        <p>
          Let f be bounded on <M>{"[a, b]"}</M> and P a partition. On the i-th piece let <M>{"M_i"}</M> be the supremum of
          f and <M>{"m_i"}</M> the infimum. The <strong>upper</strong> and <strong>lower sums</strong> are
        </p>
        <MD>{"U(f, P) = \\sum M_i\\, \\Delta x_i, \\qquad L(f, P) = \\sum m_i\\, \\Delta x_i."}</MD>
        <p>Every Riemann sum for P lies between them.</p>
      </Definition>

      <Theorem title="refining">
        <p>
          Adding points to a partition can only raise the lower sum and lower the upper sum. Hence every lower sum is at
          most every upper sum, even for two different partitions: <M>{"L(f, P) \\le U(f, Q)"}</M>.
        </p>
      </Theorem>
      <p>
        Splitting one piece in two replaces <M>{"m_i \\Delta x_i"}</M> by two terms whose infima are at least{" "}
        <M>{"m_i"}</M>, so the lower sum cannot drop; similarly for the upper sum. For the second claim, compare both P and
        Q with the partition that uses all the points of both: <M>{"L(f, P) \\le L(f, P \\cup Q) \\le U(f, P \\cup Q) \\le U(f, Q)"}</M>.
      </p>

      <Definition title="the integral">
        <p>
          f is <strong>integrable</strong> on <M>{"[a, b]"}</M> if the supremum of all lower sums equals the infimum of all
          upper sums. This common value is the <strong>definite integral</strong>,{" "}
          <M>{"\\displaystyle \\int_a^b f(x)\\, dx"}</M>. Equivalently: for every <M>{"\\varepsilon > 0"}</M> there is a
          partition P with <M>{"U(f, P) - L(f, P) < \\varepsilon"}</M>.
        </p>
      </Definition>

      <Example title="a function with no integral">
        <p>
          For the puzzle&rsquo;s function, every piece contains rationals and irrationals, so <M>{"M_i = 1"}</M> and{" "}
          <M>{"m_i = 0"}</M> always. Every upper sum is 1 and every lower sum is 0. The gap never closes, and the function
          is not integrable.
        </p>
      </Example>

      <Theorem title="continuous functions are integrable">
        <p>If f is continuous on <M>{"[a, b]"}</M>, it is integrable there.</p>
      </Theorem>
      <Proof>
        <p>
          A continuous function on a closed interval is uniformly continuous. So given <M>{"\\varepsilon > 0"}</M>, there is
          a <M>{"\\delta > 0"}</M> such that <M>{"|f(x) - f(y)| < \\varepsilon / (b - a)"}</M> whenever{" "}
          <M>{"|x - y| < \\delta"}</M>. Take any partition whose pieces are all shorter than <M>{"\\delta"}</M>. On each
          piece f attains its maximum and minimum, at points closer than <M>{"\\delta"}</M>, so{" "}
          <M>{"M_i - m_i < \\varepsilon/(b - a)"}</M>. Then
        </p>
        <MD>{"U - L = \\sum (M_i - m_i) \\Delta x_i < \\frac{\\varepsilon}{b - a} \\sum \\Delta x_i = \\varepsilon."}</MD>
        <p>
          Notice the role of uniform continuity: one <M>{"\\delta"}</M> has to serve every piece at once. This is where
          that idea, met in the chapter on continuity, first earns its keep.
        </p>
      </Proof>

      <Theorem title="properties">
        <p>For integrable f and g on <M>{"[a, b]"}</M>, a constant c, and a &lt; c&prime; &lt; b:</p>
        <ul>
          <li><M>{"\\int_a^b (f + g) = \\int_a^b f + \\int_a^b g"}</M> and <M>{"\\int_a^b cf = c\\int_a^b f"}</M>.</li>
          <li><M>{"\\int_a^b f = \\int_a^{c'} f + \\int_{c'}^b f"}</M>.</li>
          <li>If <M>{"f \\le g"}</M>, then <M>{"\\int_a^b f \\le \\int_a^b g"}</M>. In particular, if{" "}
            <M>{"m \\le f \\le M"}</M>, then <M>{"m(b - a) \\le \\int_a^b f \\le M(b - a)"}</M>.</li>
          <li><M>{"\\left|\\int_a^b f\\right| \\le \\int_a^b |f|"}</M>.</li>
        </ul>
        <p>
          We also define <M>{"\\int_a^a f = 0"}</M> and <M>{"\\int_b^a f = -\\int_a^b f"}</M>, so that the second rule holds
          for points in any order.
        </p>
      </Theorem>

      <Remark title="what else is integrable">
        <p>
          Continuity is more than is needed. Monotonic functions are integrable, and so are bounded functions with finitely
          many jumps, as the step in the visualisation suggests. The exact condition, found by Lebesgue, is that the points
          of discontinuity should be negligible in a precise sense. Riemann gave this definition of the integral in 1854;
          the version with upper and lower sums is due to Darboux.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "additivity",
      rung: "check",
      prompt: (
        <p>
          If <M>{"\\int_0^3 f = 5"}</M> and <M>{"\\int_3^5 f = 2"}</M>, what is <M>{"\\int_0^5 f"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "reverse",
      rung: "check",
      prompt: (
        <p>
          If <M>{"\\int_0^2 f = 4"}</M>, what is <M>{"\\int_2^0 f"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "upper",
      rung: "apply",
      prompt: (
        <p>
          Find the upper sum of <M>{"x^2"}</M> on <M>{"[0, 1]"}</M> with 4 equal pieces. (Give a decimal.)
        </p>
      ),
      answer: { kind: "numeric", value: 0.46875 },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: (
        <p>
          Using the smallest value of <M>{"1/x"}</M> on <M>{"[1, 3]"}</M>, what lower bound do you get for{" "}
          <M>{"\\int_1^3 \\frac{1}{x}\\, dx"}</M>? (Give a decimal.)
        </p>
      ),
      answer: { kind: "numeric", value: 2 / 3, tolerance: 0.001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: (
        <p>
          Which of these functions are integrable on <M>{"[0, 1]"}</M>? Choose all that apply.
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "x²",
          "the function that is 0 for x < 1/2 and 1 for x ≥ 1/2",
          "1 at rationals, 0 at irrationals",
          "1/x for x > 0, with value 0 at 0",
        ],
        correct: [0, 1],
      },
    },
    {
      key: "monotone",
      rung: "prove",
      prompt: (
        <p>
          Prove that an increasing function f on <M>{"[a, b]"}</M> is integrable. (Use n equal pieces and show that{" "}
          <M>{"U - L = (f(b) - f(a))(b - a)/n"}</M>.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that on each piece the supremum is at the right end and the infimum at the left end.",
          "Shows that U − L telescopes to (f(b) − f(a))(b − a)/n.",
          "Concludes that U − L can be made smaller than any ε, so f is integrable.",
        ],
      },
    },
    {
      key: "thomae",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"f(x) = 1/q"}</M> when <M>{"x = p/q"}</M> in lowest terms, and <M>{"f(x) = 0"}</M> when x is irrational,
          on <M>{"[0, 1]"}</M>. Show that every lower sum is 0, and explain why the upper sums can be made small, so that f
          is integrable with integral 0, even though it is discontinuous at every rational.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that every piece contains irrationals, so every lower sum is 0.",
          "Observes that for a given ε only finitely many points have f(x) ≥ ε.",
          "Covers those finitely many points with pieces of small total width, so the upper sum is less than about 2ε; any clear sketch of this idea is fine.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what upper and lower sums are, why a function is integrable when they can be squeezed together, and why the function that is 1 on rationals and 0 elsewhere fails.",

  glimpse: (
    <p>
      Next, the fundamental theorem of calculus, which turns integration from a limit of sums into the reverse of differentiation. Real Analysis develops this theory in full, with Darboux sums and Lebesgue&rsquo;s exact criterion for which functions are integrable. Measure-Theoretic Probability builds a more powerful integral, which handles even the puzzle&rsquo;s function, and makes expectation an integral.
    </p>
  ),
};
