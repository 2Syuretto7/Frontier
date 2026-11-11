import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { UniformViz } from "@/components/viz/UniformViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.3.4",
  minutes: 75,
  links: {
    revisits: ["m2.2.2", "m1.2.4"],
    foreshadows: ["m8.5.3", "m8.5.3", "m2.6.2"],
  },

  puzzle: (
    <>
      <p>
        A machine cuts metal rods, and the customer wants every rod within 1 mm of the length ordered. The cutting arm is
        positioned by a dial, and the length cut depends continuously on the dial setting. So for each order there is some
        precision of dial setting that guarantees the 1 mm tolerance.
      </p>
      <p>
        But is there one precision that works for every order, long rods and short alike? Or might some lengths need the dial
        set more and more finely, without limit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the definition of continuity at a point, <M>{"\\delta"}</M> is allowed to depend on both{" "}
        <M>{"\\varepsilon"}</M> and the point. Where the graph is steep, a narrower strip is needed. If one{" "}
        <M>{"\\delta"}</M> works at every point at once, the function is called <strong>uniformly continuous</strong>.
      </p>
      <p>
        Below, fix <M>{"\\varepsilon"}</M> and move the point <M>{"x_0"}</M>. The lower graph shows the largest{" "}
        <M>{"\\delta"}</M> that works at each point. Uniform continuity asks whether that graph stays above some positive
        level. For <M>{"1/x"}</M>, it sinks to 0.
      </p>
      <UniformViz />
    </>
  ),

  theory: (
    <>
      <Definition title="uniform continuity">
        <p>
          f is <strong>uniformly continuous</strong> on a set D if for every <M>{"\\varepsilon > 0"}</M> there is a{" "}
          <M>{"\\delta > 0"}</M> such that, for all x and y in D,
        </p>
        <MD>{"|x - y| < \\delta \\implies |f(x) - f(y)| < \\varepsilon."}</MD>
      </Definition>

      <Remark title="the order of the quantifiers">
        <p>Compare the two definitions in quantifier form.</p>
        <ul>
          <li>
            Continuous on D: <M>{"\\forall y \\in D\\ \\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x \\in D\\ \\ldots"}</M>
          </li>
          <li>
            Uniformly continuous on D: <M>{"\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall y \\in D\\ \\forall x \\in D\\ \\ldots"}</M>
          </li>
        </ul>
        <p>
          The only difference is where <M>{"\\forall y"}</M> stands. In the first, <M>{"\\delta"}</M> is chosen after y and
          may depend on it; in the second, it is chosen before, and must serve every y. This is exactly the lesson of nested
          quantifiers in Proof and Logic: swapping a &ldquo;for all&rdquo; past a &ldquo;there exists&rdquo; makes a stronger
          statement.
        </p>
      </Remark>

      <Example title="a uniformly continuous function">
        <p>
          <M>{"f(x) = x^2"}</M> on <M>{"[0, 3]"}</M>. For x, y in the interval,{" "}
          <M>{"|x^2 - y^2| = |x + y|\\,|x - y| \\le 6|x - y|"}</M>. So <M>{"\\delta = \\varepsilon / 6"}</M> works for every
          pair at once. The bound 6 on the steepness came from the interval being bounded.
        </p>
      </Example>

      <Example title="a continuous function that is not uniformly continuous">
        <p>
          <M>{"f(x) = 1/x"}</M> on <M>{"(0, 1]"}</M>. Take <M>{"\\varepsilon = 1"}</M>, and suppose some <M>{"\\delta > 0"}</M>{" "}
          worked. Choose a whole number n with <M>{"1/n < \\delta"}</M>, and let <M>{"x = 1/n"}</M>,{" "}
          <M>{"y = 1/(n + 1)"}</M>. Then <M>{"|x - y| < 1/n < \\delta"}</M>, but <M>{"|f(x) - f(y)| = 1"}</M>, which is not
          less than <M>{"\\varepsilon"}</M>. So no <M>{"\\delta"}</M> works.
        </p>
        <p>
          The same happens for <M>{"x^2"}</M> on the whole real line: far out, the graph is so steep that points{" "}
          <M>{"\\delta"}</M> apart have values that differ by more than 1, however small <M>{"\\delta"}</M> is.
        </p>
      </Example>

      <Theorem title="continuity on a closed interval is uniform">
        <p>
          If f is continuous on <M>{"[a, b]"}</M>, then f is uniformly continuous on <M>{"[a, b]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A sketch, to be completed in Real Analysis. Suppose not. Then for some <M>{"\\varepsilon > 0"}</M>, every{" "}
          <M>{"\\delta = 1/n"}</M> fails, at some pair <M>{"x_n, y_n"}</M> with <M>{"|x_n - y_n| < 1/n"}</M> but{" "}
          <M>{"|f(x_n) - f(y_n)| \\ge \\varepsilon"}</M>. The points <M>{"x_n"}</M> all lie in the bounded interval{" "}
          <M>{"[a, b]"}</M>, and a theorem of Bolzano and Weierstrass, proved from completeness, says they cluster around some
          point c of <M>{"[a, b]"}</M>, and so do the <M>{"y_n"}</M>. Then continuity at c forces{" "}
          <M>{"f(x_n)"}</M> and <M>{"f(y_n)"}</M> both close to <M>{"f(c)"}</M> for suitable n, and so close to each other,
          contradicting <M>{"|f(x_n) - f(y_n)| \\ge \\varepsilon"}</M>.
        </p>
      </Proof>

      <Remark title="why it matters">
        <p>
          Uniform continuity answers the rod-cutting puzzle: if the dial ranges over a closed interval, one precision suits
          every order. In this course its main use comes soon: it is the key to proving that every continuous function on a
          closed interval can be integrated.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "difference",
      rung: "check",
      prompt: <p>In uniform continuity, δ may depend on&hellip;</p>,
      answer: { kind: "choice", options: ["ε only", "the point only", "both ε and the point", "neither"], correct: [0] },
    },
    {
      key: "closed",
      rung: "check",
      prompt: <p>Which of these must be uniformly continuous? Choose all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["any continuous function on [0, 1]", "1/x on (0, 1]", "x² on the whole real line", "3x + 2 on the whole real line"],
        correct: [0, 3],
      },
    },
    {
      key: "linear",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"f(x) = 4x - 1"}</M> on the real line, what is the largest <M>{"\\delta"}</M> that works for every pair of
          points when <M>{"\\varepsilon = 0.2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.05, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: (
        <p>
          On <M>{"[0, 5]"}</M>, <M>{"|x^2 - y^2| \\le K|x - y|"}</M>. What is the smallest such K that comes from the method of
          the lesson?
        </p>
      ),
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "witness",
      rung: "apply",
      prompt: (
        <p>
          In the proof that <M>{"1/x"}</M> is not uniformly continuous on <M>{"(0, 1]"}</M>, the points{" "}
          <M>{"x = 1/n"}</M> and <M>{"y = 1/(n + 1)"}</M> are used. What is <M>{"|f(x) - f(y)|"}</M> for every n?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "sqrt",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\sqrt{x}"}</M> is uniformly continuous on <M>{"[0, \\infty)"}</M>. (Hint: first show{" "}
          <M>{"|\\sqrt{x} - \\sqrt{y}| \\le \\sqrt{|x - y|}"}</M>.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves the hint, for example by assuming x ≥ y and squaring √x ≤ √y + √(x − y).",
          "Chooses δ = ε².",
          "Concludes |x − y| < δ gives |√x − √y| < ε for all x, y ≥ 0.",
        ],
      },
    },
    {
      key: "square-line",
      rung: "stretch",
      prompt: (
        <p>
          Prove that <M>{"x^2"}</M> is not uniformly continuous on the real line. Explain in words what goes wrong, and why the
          theorem about closed intervals does not apply.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes ε = 1 and an arbitrary δ > 0.",
          "Chooses points such as x = n and y = n + δ/2 with n large, so that |x² − y²| = nδ + δ²/4 ≥ 1.",
          "Explains that the graph grows ever steeper, and that the real line is not a closed, bounded interval.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the difference between continuity and uniform continuity, using 1/x on (0, 1] as an example.",

  glimpse: (
    <p>
      This completes continuity. Next, derivatives: the slope of a curve at a point. Uniform continuity first earns its keep in the definite integral, later in this course. Real Analysis completes the proof sketched here, and Lipschitz continuity, a stronger cousin, controls how fast gradient descent can safely move in Optimisation for Deep Learning.
    </p>
  ),
};
