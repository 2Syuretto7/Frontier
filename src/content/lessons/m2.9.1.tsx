import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { LittleOViz } from "@/components/viz/LittleOViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.9.1",
  minutes: 55,
  links: {
    requires: ["m2.8.5", "m2.2.4"],
    foreshadows: ["m4.5.2", "e2.1.1", "m11.1.3"],
  },

  puzzle: (
    <>
      <p>
        Physicists say that for small angles, <M>{"\\sin x \\approx x"}</M>. At <M>{"x = 0.1"}</M>,{" "}
        <M>{"\\sin x = 0.0998334"}</M>, an error of about 0.00017. At <M>{"x = 0.01"}</M> the error is about 0.00000017.
      </p>
      <p>
        Dividing x by 10 divided the error by a thousand. Can you say, without a calculator, how the error will behave for any
        small x? And how would you write that down precisely, without carrying all the exact numbers?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Near 0, many quantities shrink to zero, but at different speeds. Comparing two of them means looking at their ratio. If
        the ratio stays bounded, they are of the same order; if it tends to 0, the first is negligible beside the second.
        Choose a pair below and shrink x.
      </p>
      <LittleOViz />
      <p>
        Big-O and little-o are shorthand for these ratio statements. They let you write{" "}
        <M>{"\\sin x = x + O(x^3)"}</M> and carry on calculating, keeping exactly as much detail as the problem needs.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="big-O and little-o">
        <p>As x tends to some limit (a point, or <M>{"\\infty"}</M>), write</p>
        <ul>
          <li>
            <M>{"f = O(g)"}</M> if <M>{"|f(x)| \\le C|g(x)|"}</M> for some constant C and all x close enough to the limit;
          </li>
          <li><M>{"f = o(g)"}</M> if <M>{"f(x)/g(x) \\to 0"}</M>;</li>
          <li><M>{"f \\sim g"}</M>, read &ldquo;f is asymptotic to g&rdquo;, if <M>{"f(x)/g(x) \\to 1"}</M>.</li>
        </ul>
        <p>
          Always say where x is going: <M>{"x^2 = o(x)"}</M> as <M>{"x \\to 0"}</M>, but <M>{"x = o(x^2)"}</M> as{" "}
          <M>{"x \\to \\infty"}</M>.
        </p>
      </Definition>

      <Remark title="a one-way equals sign">
        <p>
          <M>{"f = O(g)"}</M> means f belongs to a class of functions; it is not a true equation. <M>{"x^2 = O(x^3)"}</M> as{" "}
          <M>{"x \\to \\infty"}</M> is true, and so is <M>{"x = O(x^3)"}</M>, but it would be absurd to conclude{" "}
          <M>{"x^2 = x"}</M>. Read the sign as &ldquo;is&rdquo;, not &ldquo;equals&rdquo;.
        </p>
      </Remark>

      <Theorem title="rules of the algebra">
        <p>As <M>{"x \\to 0"}</M>, for positive powers a and b:</p>
        <ul>
          <li><M>{"O(x^a) + O(x^b) = O(x^{\\min(a, b)})"}</M>;</li>
          <li><M>{"O(x^a) \\cdot O(x^b) = O(x^{a+b})"}</M>, and <M>{"x^a \\cdot o(x^b) = o(x^{a+b})"}</M>;</li>
          <li><M>{"o(g) + o(g) = o(g)"}</M>, and <M>{"c \\cdot O(g) = O(g)"}</M> for any constant c.</li>
        </ul>
      </Theorem>

      <Example title="Taylor in this language">
        <p>Taylor&rsquo;s theorem says that if f has <M>{"n + 1"}</M> continuous derivatives near a,</p>
        <MD>{"f(a + h) = f(a) + f'(a)h + \\dots + \\frac{f^{(n)}(a)}{n!}h^n + O(h^{n+1}) \\quad (h \\to 0)."}</MD>
        <p>
          So <M>{"\\sin x = x - x^3/6 + O(x^5)"}</M>, <M>{"e^x = 1 + x + x^2/2 + O(x^3)"}</M> and{" "}
          <M>{"\\ln(1 + x) = x - x^2/2 + O(x^3)"}</M>. These expansions can be added and multiplied with the rules above:
        </p>
        <MD>{"e^x \\sin x = (1 + x + O(x^2))(x + O(x^3)) = x + x^2 + O(x^3)."}</MD>
      </Example>

      <Remark title="two directions, two uses">
        <p>
          As <M>{"x \\to 0"}</M>, big-O measures approximation errors: the higher the power, the better the approximation. As{" "}
          <M>{"n \\to \\infty"}</M>, it measures growth: an algorithm that takes <M>{"O(n^2)"}</M> steps is slower, for large
          inputs, than one that takes <M>{"O(n \\log n)"}</M>, whatever their constants. The definition is the same; only the
          direction of the limit changes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sin",
      rung: "check",
      prompt: <p>As <M>{"x \\to 0"}</M>, is <M>{"\\sin x = x + O(x^3)"}</M> true?</p>,
      answer: { kind: "choice", options: ["Yes", "No; the error is O(x²)", "No; the error is O(x)"], correct: [0] },
    },
    {
      key: "infinity",
      rung: "check",
      prompt: <p>As <M>{"x \\to \\infty"}</M>, which of these are true? Select all that apply.</p>,
      answer: { kind: "choice", options: ["x² = O(x³)", "x³ = O(x²)", "x = o(x ln x)", "ln x = O(1)"], correct: [0, 2] },
    },
    {
      key: "cos",
      rung: "apply",
      prompt: <p>Find <M>{"\\lim_{x \\to 0} (1 - \\cos x)/x^2"}</M>.</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "lead",
      rung: "apply",
      prompt: <p>If <M>{"f(x) = 3x^2 + O(x^3)"}</M> as <M>{"x \\to 0"}</M>, what is <M>{"\\lim_{x \\to 0} f(x)/x^2"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "binom",
      rung: "apply",
      prompt: <p>Write <M>{"(1 + x)^{10} = 1 + 10x + cx^2 + O(x^3)"}</M>. What is c?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "rules",
      rung: "prove",
      prompt: (
        <p>
          Prove from the definitions that, as <M>{"x \\to 0"}</M>, if <M>{"f = O(x^a)"}</M> and <M>{"g = O(x^b)"}</M> then{" "}
          <M>{"fg = O(x^{a+b})"}</M>, and that if <M>{"f = o(x)"}</M> and <M>{"g = o(x)"}</M> then <M>{"f + g = o(x)"}</M>.
          Then explain why <M>{"O(x^2) - O(x^2) = 0"}</M> is false.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes |f| ≤ C₁|x|ᵃ and |g| ≤ C₂|x|ᵇ near 0 and multiplies to get |fg| ≤ C₁C₂|x|ᵃ⁺ᵇ.",
          "Writes (f + g)/x = f/x + g/x and uses the sum law for limits to get 0.",
          "Explains that the two O(x²) terms can be different functions, such as x² and 2x².",
          "Concludes their difference is O(x²), not 0.",
        ],
      },
    },
    {
      key: "cubic",
      rung: "stretch",
      prompt: (
        <p>
          As <M>{"x \\to 0"}</M>, <M>{"\\ln(1 + x) - x + x^2/2 \\sim c\\,x^3"}</M>. What is c? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what f = O(g) and f = o(g) mean, why you must say where x is going, and how they let you calculate with Taylor expansions.",

  glimpse: (
    <p>
      Next, Taylor approximations at work: estimating derivatives from function values, and the trade-off between
      approximation error and rounding error that every gradient check must face. Big-O as n grows is the language of
      Discrete Mathematics and Data Structures and Algorithms for the cost of algorithms.
    </p>
  ),
};
