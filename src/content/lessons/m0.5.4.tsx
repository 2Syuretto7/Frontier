import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { AngleAdditionViz } from "@/components/viz/AngleAdditionViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.5.4",
  minutes: 75,
  links: {
    revisits: ["m0.4.4"],
  },

  puzzle: (
    <>
      <p>
        You know the exact sines and cosines of <M>{"30^\\circ"}</M>, <M>{"45^\\circ"}</M> and <M>{"60^\\circ"}</M> from
        two simple triangles. Around 150 CE, Ptolemy built a table of chords for every half degree, which astronomers used
        for over a thousand years, with no calculator and no triangle for most of those angles.
      </p>
      <p>
        How could you find <M>{"\\sin 15^\\circ"}</M> or <M>{"\\sin 75^\\circ"}</M> from the values you already know?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Since <M>{"75 = 45 + 30"}</M>, it would be enough to know how the sine of a sum depends on the sines and cosines of
        the parts. It is <em>not</em> simply <M>{"\\sin 45^\\circ + \\sin 30^\\circ"}</M>, which is more than 1.
      </p>
      <p>
        Below, a right triangle with angle <M>{"\\beta"}</M> and hypotenuse 1 stands on another with angle{" "}
        <M>{"\\alpha"}</M>. Together they fit inside a rectangle, and the height of the top corner can be measured two ways:
        on the left it is <M>{"\\sin(\\alpha+\\beta)"}</M>, on the right it is a sum of two pieces. Move the sliders and
        check that the two always agree.
      </p>
      <AngleAdditionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="identity">
        <p>
          An <strong>identity</strong> is an equation that holds for every value of its variables, such as{" "}
          <M>{"\\cos^2\\theta + \\sin^2\\theta = 1"}</M>. An equation such as <M>{"\\sin\\theta = \\tfrac12"}</M>, true only
          for some values, is not.
        </p>
      </Definition>

      <Theorem title="the addition formulas">
        <p>For all angles <M>{"\\alpha"}</M> and <M>{"\\beta"}</M>,</p>
        <MD>{"\\begin{aligned} \\sin(\\alpha + \\beta) &= \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta, \\\\ \\cos(\\alpha + \\beta) &= \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta. \\end{aligned}"}</MD>
      </Theorem>
      <Proof>
        <p>
          We prove the case where <M>{"\\alpha"}</M>, <M>{"\\beta"}</M> and <M>{"\\alpha+\\beta"}</M> are all acute, as in the
          picture. Let OQP be right-angled at Q, with <M>{"OP = 1"}</M> and angle <M>{"\\beta"}</M> at O, so{" "}
          <M>{"OQ = \\cos\\beta"}</M> and <M>{"QP = \\sin\\beta"}</M>. Let OQ make angle <M>{"\\alpha"}</M> with the
          horizontal, so OP makes angle <M>{"\\alpha + \\beta"}</M>, and the height of P is <M>{"\\sin(\\alpha+\\beta)"}</M>.
        </p>
        <p>
          Drop a vertical from Q. The right triangle under OQ has hypotenuse <M>{"\\cos\\beta"}</M> and angle{" "}
          <M>{"\\alpha"}</M>, so Q is at height <M>{"\\sin\\alpha\\cos\\beta"}</M> and at horizontal distance{" "}
          <M>{"\\cos\\alpha\\cos\\beta"}</M>. Now QP is perpendicular to OQ, and the vertical is perpendicular to the
          horizontal, so the angle between QP and the vertical equals the angle between OQ and the horizontal, which is{" "}
          <M>{"\\alpha"}</M>. In the small right triangle with hypotenuse QP, P is therefore a further{" "}
          <M>{"\\cos\\alpha\\sin\\beta"}</M> higher than Q, and <M>{"\\sin\\alpha\\sin\\beta"}</M> further left. Adding the
          heights gives the sine formula; subtracting the horizontal distances gives the cosine formula.
        </p>
        <p>
          The general case follows from the symmetries of the last lesson, or, more neatly, from rotations in the plane,
          which come later in this course.
        </p>
      </Proof>

      <Proposition title="consequences">
        <p>Replacing <M>{"\\beta"}</M> by <M>{"-\\beta"}</M>, and then setting <M>{"\\beta = \\alpha"}</M>, gives:</p>
        <MD>{"\\begin{aligned} \\sin(\\alpha - \\beta) &= \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta, \\\\ \\cos(\\alpha - \\beta) &= \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta, \\\\ \\sin 2\\theta &= 2\\sin\\theta\\cos\\theta, \\\\ \\cos 2\\theta &= \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1 = 1 - 2\\sin^2\\theta. \\end{aligned}"}</MD>
        <p>
          Dividing the sine formula by the cosine formula, then top and bottom by <M>{"\\cos\\alpha\\cos\\beta"}</M>:
        </p>
        <MD>{"\\tan(\\alpha + \\beta) = \\frac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha\\tan\\beta}."}</MD>
      </Proposition>
      <Proof>
        <p>
          Use <M>{"\\cos(-\\beta) = \\cos\\beta"}</M> and <M>{"\\sin(-\\beta) = -\\sin\\beta"}</M> for the first two. The
          last line uses <M>{"\\cos^2\\theta + \\sin^2\\theta = 1"}</M> to replace one square by the other.
        </p>
      </Proof>

      <Example title="sin 15° exactly">
        <MD>{"\\sin 15^\\circ = \\sin(45^\\circ - 30^\\circ) = \\frac{\\sqrt2}{2}\\cdot\\frac{\\sqrt3}{2} - \\frac{\\sqrt2}{2}\\cdot\\frac12 = \\frac{\\sqrt6 - \\sqrt2}{4} \\approx 0.2588."}</MD>
        <p>
          With the half-angle form, <M>{"\\sin^2\\theta = \\tfrac12(1 - \\cos 2\\theta)"}</M>, you can halve again and again.
          That, with the addition formulas, is essentially how Ptolemy filled his table.
        </p>
      </Example>

      <Remark title="multiplying by adding">
        <p>
          Adding the formulas for <M>{"\\cos(a-b)"}</M> and <M>{"\\cos(a+b)"}</M> gives{" "}
          <M>{"\\cos a \\cos b = \\tfrac12\\left[\\cos(a-b) + \\cos(a+b)\\right]"}</M>. In the late sixteenth century,
          astronomers such as Tycho Brahe used this to multiply large numbers: write each as a cosine from the tables, add and
          subtract the angles, and look up the answer. The method, called prosthaphaeresis, turned multiplication into
          addition, the same trick logarithms would soon do better.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "double-sin",
      rung: "check",
      prompt: <p>If <M>{"\\sin\\theta = 0.6"}</M> and <M>{"\\cos\\theta = 0.8"}</M>, what is <M>{"\\sin 2\\theta"}</M>?</p>,
      answer: { kind: "numeric", value: 0.96 },
    },
    {
      key: "double-cos",
      rung: "check",
      prompt: <p>If <M>{"\\cos\\theta = 0.8"}</M>, what is <M>{"\\cos 2\\theta"}</M>?</p>,
      answer: { kind: "numeric", value: 0.28 },
    },
    {
      key: "cos75",
      rung: "apply",
      prompt: <p>Use <M>{"75^\\circ = 45^\\circ + 30^\\circ"}</M> to find <M>{"\\cos 75^\\circ"}</M>, to four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2588, tolerance: 0.0005 },
    },
    {
      key: "simplify",
      rung: "apply",
      prompt: <p>Simplify <M>{"(\\sin x + \\cos x)^2 - \\sin 2x"}</M>.</p>,
      answer: { kind: "expression", value: "1", variables: ["x"] },
    },
    {
      key: "tan-sum",
      rung: "apply",
      prompt: <p>If <M>{"\\tan\\alpha = \\tfrac12"}</M> and <M>{"\\tan\\beta = \\tfrac13"}</M>, what is <M>{"\\tan(\\alpha + \\beta)"}</M>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "cos-double-proof",
      rung: "prove",
      prompt: <p>Starting from the addition formula for cosine, prove that <M>{"\\cos 2\\theta = 1 - 2\\sin^2\\theta"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Sets α = β = θ in the formula for cos(α + β).",
          "Obtains cos 2θ = cos²θ − sin²θ.",
          "Uses cos²θ + sin²θ = 1 to replace cos²θ by 1 − sin²θ.",
          "Simplifies to 1 − 2 sin²θ.",
        ],
      },
    },
    {
      key: "sin18",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"\\theta = 18^\\circ"}</M>, so that <M>{"2\\theta = 90^\\circ - 3\\theta"}</M> and therefore{" "}
          <M>{"\\sin 2\\theta = \\cos 3\\theta"}</M>. Using <M>{"\\cos 3\\theta = 4\\cos^3\\theta - 3\\cos\\theta"}</M>, find{" "}
          <M>{"\\sin 18^\\circ"}</M> to four decimal places. (Divide by <M>{"\\cos\\theta"}</M> and solve a quadratic.)
        </p>
      ),
      answer: { kind: "numeric", value: 0.309, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend why sin(α + β) is not sin α + sin β, and how the rectangle picture gives the correct formula.",

  glimpse: (
    <p>
      This completes geometry and trigonometry. Next, the Cartesian plane, where points become pairs of numbers. In that
      chapter, multiplying complex numbers will rotate them, and the addition formulas will fall out in one line. In
      Calculus, the double angle formulas are the standard tool for integrating powers of sine and cosine, and in
      Transformers and Language Models the addition formulas are the reason rotary position embeddings let attention
      see how far apart two words are.
    </p>
  ),
};
