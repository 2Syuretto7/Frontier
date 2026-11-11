import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { UnitCircleViz } from "@/components/viz/UnitCircleViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.5.3",
  minutes: 70,
  links: {
    revisits: ["m0.3.5"],
  },

  puzzle: (
    <>
      <p>
        You board a giant wheel at a mela. It has radius 20 metres and turns steadily. Picture your height above the centre
        of the wheel as it turns: up, over the top, down, under the bottom, and round again.
      </p>
      <p>
        If you plot that height against the angle turned, what shape do you get? And is there a single rule that gives your
        height for every angle, including angles past a full turn?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a right-angled triangle, the ratio of the side opposite an angle to the hypotenuse depends only on the angle, not
        on the size of the triangle: any two such triangles with the same angle are similar. That ratio is the sine of the
        angle. Triangles only allow angles below <M>{"90^\\circ"}</M>, though, and the wheel keeps turning.
      </p>
      <p>
        The fix is to put the triangle inside a circle of radius 1. As a point goes round, its horizontal position is the
        cosine of the angle and its height is the sine. Now every angle has a sine and a cosine, and the height traces a wave,
        the answer to the puzzle.
      </p>
      <UnitCircleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sine, cosine and tangent in a right triangle">
        <p>
          In a right-angled triangle with an acute angle <M>{"\\theta"}</M>, let the hypotenuse be <M>h</M>, the side
          opposite <M>{"\\theta"}</M> be <M>o</M>, and the other side, adjacent to <M>{"\\theta"}</M>, be <M>a</M>. Then
        </p>
        <MD>{"\\sin\\theta = \\frac{o}{h}, \\qquad \\cos\\theta = \\frac{a}{h}, \\qquad \\tan\\theta = \\frac{o}{a}."}</MD>
        <p>These depend only on <M>{"\\theta"}</M>, because triangles with the same angles are similar.</p>
      </Definition>

      <Definition title="sine and cosine of any angle">
        <p>
          The <strong>unit circle</strong> is the circle of radius 1 centred at the origin. Start at <M>{"(1, 0)"}</M> and
          turn through <M>{"\\theta"}</M> radians, anticlockwise if <M>{"\\theta"}</M> is positive. The point you reach is
        </p>
        <MD>{"(\\cos\\theta, \\sin\\theta)."}</MD>
        <p>
          Where <M>{"\\cos\\theta \\neq 0"}</M>, define <M>{"\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}"}</M>, the
          slope of the line from the origin to the point.
        </p>
      </Definition>
      <p>
        For an acute angle the two definitions agree: drop a perpendicular from the point to the horizontal axis to get a right
        triangle with hypotenuse 1, adjacent side <M>{"\\cos\\theta"}</M> and opposite side <M>{"\\sin\\theta"}</M>.
      </p>

      <Theorem title="the Pythagorean identity">
        <p>For every angle <M>{"\\theta"}</M>, <M>{"\\cos^2\\theta + \\sin^2\\theta = 1"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The point <M>{"(\\cos\\theta, \\sin\\theta)"}</M> is at distance 1 from the origin. By Pythagoras, the square of
          that distance is <M>{"\\cos^2\\theta + \\sin^2\\theta"}</M>. (Here <M>{"\\cos^2\\theta"}</M> means{" "}
          <M>{"(\\cos\\theta)^2"}</M>.)
        </p>
      </Proof>

      <Proposition title="symmetries">
        <p>For every angle <M>{"\\theta"}</M>:</p>
        <ul>
          <li>
            <M>{"\\sin(\\theta + 2\\pi) = \\sin\\theta"}</M> and <M>{"\\cos(\\theta + 2\\pi) = \\cos\\theta"}</M>: both are{" "}
            <strong>periodic</strong> with period <M>{"2\\pi"}</M>;
          </li>
          <li><M>{"\\cos(-\\theta) = \\cos\\theta"}</M> and <M>{"\\sin(-\\theta) = -\\sin\\theta"}</M>;</li>
          <li><M>{"-1 \\le \\sin\\theta \\le 1"}</M> and <M>{"-1 \\le \\cos\\theta \\le 1"}</M>.</li>
        </ul>
      </Proposition>
      <Proof>
        <p>
          Adding a full turn brings you back to the same point. Turning by <M>{"-\\theta"}</M> instead of{" "}
          <M>{"\\theta"}</M> gives the mirror image in the horizontal axis, which keeps the first coordinate and flips the
          sign of the second. And every point on the unit circle has both coordinates between <M>{"-1"}</M> and 1.
        </p>
      </Proof>

      <Example title="the exact values">
        <p>
          Half of an equilateral triangle of side 2 is a right triangle with angles <M>{"30^\\circ"}</M> and{" "}
          <M>{"60^\\circ"}</M>, hypotenuse 2, shortest side 1, and, by Pythagoras, other side <M>{"\\sqrt3"}</M>. Half of a
          square of side 1, cut along a diagonal, has angles <M>{"45^\\circ"}</M> and hypotenuse <M>{"\\sqrt2"}</M>. Reading
          off the ratios:
        </p>
        <MD>{"\\sin 30^\\circ = \\tfrac12, \\quad \\sin 45^\\circ = \\tfrac{\\sqrt2}{2}, \\quad \\sin 60^\\circ = \\tfrac{\\sqrt3}{2},"}</MD>
        <p>
          and the cosines are the same list in reverse order, since <M>{"\\cos\\theta = \\sin(90^\\circ - \\theta)"}</M>: the
          adjacent side for one acute angle is the opposite side for the other.
        </p>
      </Example>

      <Remark title="where the word comes from">
        <p>
          Indian astronomers were the first to tabulate half-chords, the ancestor of the sine. Aryabhata, writing in 499 CE,
          called the half-chord <em>ardha-jyā</em>, from <em>jyā</em>, a bowstring, and often just <em>jīvā</em>. Arabic
          scholars borrowed it as <em>jība</em>, written without vowels as <em>jb</em>. A later reader took it for the
          Arabic <em>jayb</em>, meaning a fold or pocket, and in the twelfth century this was translated into Latin as{" "}
          <em>sinus</em>, which also means a fold. So the sine is, by a chain of mistranslation, an Indian bowstring.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sin30",
      rung: "check",
      prompt: <p>What is <M>{"\\sin 30^\\circ"}</M>?</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "cospi",
      rung: "check",
      prompt: <p>What is <M>{"\\cos \\pi"}</M>? (Where is the point after half a turn?)</p>,
      answer: { kind: "numeric", value: -1 },
    },
    {
      key: "from-cos",
      rung: "apply",
      prompt: <p>An angle <M>{"\\theta"}</M> between 0 and <M>{"\\tfrac{\\pi}{2}"}</M> has <M>{"\\cos\\theta = 0.6"}</M>. What is <M>{"\\sin\\theta"}</M>?</p>,
      answer: { kind: "numeric", value: 0.8 },
    },
    {
      key: "ladder",
      rung: "apply",
      prompt: <p>A ladder 5 metres long leans against a wall, making an angle of <M>{"60^\\circ"}</M> with the ground. How high up the wall does it reach, in metres, to two decimal places?</p>,
      answer: { kind: "numeric", value: 4.33, tolerance: 0.001 },
    },
    {
      key: "wheel",
      rung: "apply",
      prompt: (
        <p>
          A giant wheel has radius 20 m and its centre is 22 m above the ground. A seat starts level with the centre, on the
          right, and the wheel turns anticlockwise. How high above the ground is the seat after turning{" "}
          <M>{"210^\\circ"}</M>, in metres?
        </p>
      ),
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
t = 5 * math.pi / 6
print(round(math.cos(t), 3), round(math.sin(t), 3))`}</Code>
          <p>The point at angle 5π/6 on the unit circle. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-0.866 0.5", "0.866 0.5", "-0.5 0.866", "0.866 -0.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>polygon(n)</C>, which returns the n vertices of a regular n-gon on the unit circle as (cos θ, sin θ) points, starting at angle 0 and going anticlockwise.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def polygon(n):
    return [(math.cos(k), math.sin(k)) for k in range(n)]
`,
        solution: `import math

def polygon(n):
    return [(math.cos(2 * math.pi * k / n), math.sin(2 * math.pi * k / n)) for k in range(n)]
`,
        tests: [
          { name: "square", code: `pts = polygon(4)
exp = [(1, 0), (0, 1), (-1, 0), (0, -1)]
assert len(pts) == 4 and all(abs(x - a) < 1e-9 and abs(y - b) < 1e-9 for (x, y), (a, b) in zip(pts, exp)), 'Space the angles 2π/n apart.'` },
          { name: "on the circle", code: `assert all(abs(x * x + y * y - 1) < 1e-9 for x, y in polygon(7)), 'Every vertex has cos² + sin² = 1.'` },
        ],
      },
    },
    {
      key: "supplement",
      rung: "prove",
      prompt: (
        <p>
          Using the unit circle, prove that <M>{"\\sin(\\pi - \\theta) = \\sin\\theta"}</M> and{" "}
          <M>{"\\cos(\\pi - \\theta) = -\\cos\\theta"}</M> for every angle <M>{"\\theta"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Locates the point for π − θ as the result of turning half a turn and then back by θ.",
          "Explains that this point is the mirror image of the point for θ in the vertical axis.",
          "Notes that reflection in the vertical axis keeps the height and changes the sign of the horizontal coordinate.",
          "Reads off both equations from the coordinates.",
        ],
      },
    },
    {
      key: "moving-point",
      rung: "stretch",
      prompt: (
        <p>
          A point starts at <M>{"(2, 0)"}</M> and moves anticlockwise round the circle of radius 2 centred at the origin,
          turning through 1 radian every second. What is its <M>x</M>-coordinate after 10 seconds, to three decimal places?
        </p>
      ),
      answer: { kind: "numeric", value: -1.678, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend how the unit circle lets us define sine and cosine for any angle, not just angles in a right triangle, and why cos² + sin² = 1.",

  glimpse: (
    <p>
      Next, identities, rules such as the addition formulas that let one value of sine give many others. The wave traced
      here is the basic shape of every vibration, and Calculus will rebuild sine and cosine from infinite series. In
      Transformers and Language Models, sines and cosines of many different frequencies give each position in a sentence
      its own fingerprint, the positional encoding.
    </p>
  ),
};
