import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { AngleSumViz } from "@/components/viz/AngleSumViz";
import { PythagorasViz } from "@/components/viz/PythagorasViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.5.1",
  minutes: 75,
  links: {
    revisits: ["m0.1.4"],
    foreshadows: ["m0.6.1", "m3.1.2"],
  },

  puzzle: (
    <>
      <p>
        Builders in ancient Egypt are said to have laid out right angles with a loop of rope tied into 12 equal sections.
        Pegged out as a triangle with sides of 3, 4 and 5 sections, the rope gave a perfect corner, every time, on any field.
      </p>
      <p>
        Why should those three numbers make a right angle? Would a loop of 30 sections, pegged as 5, 12 and 13, work as
        well? What about 4, 5 and 6?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two facts about triangles carry almost all of school geometry. The first is that the three angles of any triangle
        add up to a straight angle, <M>{"180^\\circ"}</M>. Draw the line through the top corner parallel to the base. The
        two angles at the base reappear at the top, either side of the third angle, and the three together lie flat
        along the parallel line. Reshape the triangle below and watch the three angles always fill the line.
      </p>
      <AngleSumViz />
      <p>
        The second fact is about right triangles. Take a square of side <M>{"a + b"}</M> and lay four copies of a right
        triangle with legs <M>a</M> and <M>b</M> inside it, in two different ways. The four triangles cover the same area
        both times, so the uncovered area is the same both times. One way it is a single square on the long side{" "}
        <M>c</M>; the other way it is two squares on the legs. So <M>{"a^2 + b^2 = c^2"}</M>.
      </p>
      <PythagorasViz />
      <p>
        The rope trick is the theorem run backwards: <M>{"3^2 + 4^2 = 9 + 16 = 25 = 5^2"}</M>, and the sides fit the
        equation only if the angle is right.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="angles">
        <p>
          An <strong>angle</strong> is formed by two rays from a common point, the <strong>vertex</strong>. We measure it in
          degrees, with a full turn being <M>{"360^\\circ"}</M>. A <strong>straight angle</strong>, the two halves of a
          line, is <M>{"180^\\circ"}</M>, and a <strong>right angle</strong> is half of that, <M>{"90^\\circ"}</M>. Angles
          less than a right angle are <strong>acute</strong>; between a right angle and a straight angle,{" "}
          <strong>obtuse</strong>.
        </p>
      </Definition>

      <Proposition title="vertically opposite angles">
        <p>When two lines cross, the opposite angles are equal.</p>
      </Proposition>
      <Proof>
        <p>
          Call the four angles round the crossing <M>{"\\alpha, \\beta, \\gamma, \\delta"}</M> in order. Neighbours lie
          along a line, so <M>{"\\alpha + \\beta = 180^\\circ"}</M> and <M>{"\\beta + \\gamma = 180^\\circ"}</M>.
          Subtracting, <M>{"\\alpha = \\gamma"}</M>. In the same way <M>{"\\beta = \\delta"}</M>.
        </p>
      </Proof>

      <p>
        For parallel lines we take one fact as a starting point, as Euclid did with his famous fifth postulate. When a line
        crosses two parallel lines, the <strong>alternate angles</strong>, on opposite sides of the crossing line and
        between the parallels, are equal. Everything below follows from it.
      </p>

      <Theorem title="the angle sum of a triangle">
        <p>The three angles of every triangle add to <M>{"180^\\circ"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Let the triangle be ABC, and draw the line through C parallel to AB. At C, three angles sit side by side along
          this line: the one between the parallel and CA, the triangle&rsquo;s own angle at C, and the one between CB and
          the parallel. Together they make a straight angle. The first equals the angle at A, and the third equals the
          angle at B, as alternate angles. So <M>{"A + B + C = 180^\\circ"}</M>.
        </p>
      </Proof>

      <Definition title="similar triangles">
        <p>
          Two triangles are <strong>similar</strong> if one is a scaled copy of the other, possibly moved, turned or
          flipped: their angles match, and every side of one is the same multiple <M>k</M> of the matching side of the
          other. When <M>{"k = 1"}</M> they are <strong>congruent</strong>, exact copies.
        </p>
      </Definition>

      <Theorem title="the AA test">
        <p>If two angles of one triangle equal two angles of another, the triangles are similar.</p>
      </Theorem>
      <p>
        By the angle sum, the third angles then match too. That equal angles force proportional sides is a theorem Euclid
        proves in Book VI; we take it here. It is the reason the shadow of a stick can measure the height of a tree, and,
        in the next lessons, the reason the sine of an angle does not depend on the size of the triangle.
      </p>

      <Theorem title="Pythagoras">
        <p>
          In a right triangle with legs <M>a</M>, <M>b</M> and <strong>hypotenuse</strong> <M>c</M>, the side opposite the
          right angle,
        </p>
        <MD>{"a^2 + b^2 = c^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          Place four copies of the triangle inside a square of side <M>{"a + b"}</M>, one in each corner, as in the first
          arrangement above. Each corner triangle has its two acute angles, which add to <M>{"90^\\circ"}</M>, beside the
          straight edge of the big square, so the angle left between neighbouring hypotenuses is{" "}
          <M>{"180^\\circ - 90^\\circ = 90^\\circ"}</M>. The four hypotenuses therefore bound a square of side <M>c</M>.
          Counting area,
        </p>
        <MD>{"(a + b)^2 = c^2 + 4 \\cdot \\tfrac12 ab, \\quad\\text{so}\\quad a^2 + 2ab + b^2 = c^2 + 2ab,"}</MD>
        <p>and subtracting <M>{"2ab"}</M> from both sides gives <M>{"a^2 + b^2 = c^2"}</M>.</p>
      </Proof>

      <Theorem title="the converse">
        <p>
          If a triangle has sides <M>a</M>, <M>b</M>, <M>c</M> with <M>{"a^2 + b^2 = c^2"}</M>, the angle opposite{" "}
          <M>c</M> is a right angle.
        </p>
      </Theorem>
      <Proof>
        <p>
          Build a right triangle with legs <M>a</M> and <M>b</M>. By Pythagoras its hypotenuse is{" "}
          <M>{"\\sqrt{a^2 + b^2} = c"}</M>. So it has the same three sides as the given triangle. Two triangles with the
          same three sides are congruent, since three lengths fix a triangle completely (a fact you can test with three
          sticks), so the given triangle has the same right angle.
        </p>
      </Proof>

      <Example title="the rope, and two other loops">
        <p>
          <M>{"5^2 + 12^2 = 25 + 144 = 169 = 13^2"}</M>, so a 5, 12, 13 loop makes a right angle too. But{" "}
          <M>{"4^2 + 5^2 = 41 \\neq 36 = 6^2"}</M>, so a 4, 5, 6 loop does not. Since <M>{"41 > 36"}</M>, the long side is
          too short to span a right angle, and the angle opposite it is acute.
        </p>
      </Example>

      <Remark title="lengths no fraction can name">
        <p>
          A square of side 1 has diagonal <M>{"\\sqrt{1^2 + 1^2} = \\sqrt 2"}</M>, the irrational number from the chapter on
          numbers. So Pythagoras forces irrational lengths into the simplest of shapes, which is how the Greeks discovered
          them. In the other direction, whole-number solutions such as <M>{"(3, 4, 5)"}</M> and <M>{"(5, 12, 13)"}</M> are
          called <em>Pythagorean triples</em>, and there are infinitely many: scaling any one gives another, and there are
          infinitely many that are not scaled copies of each other.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "third-angle",
      rung: "check",
      prompt: <p>Two angles of a triangle are <M>{"47^\\circ"}</M> and <M>{"68^\\circ"}</M>. What is the third, in degrees?</p>,
      answer: { kind: "numeric", value: 65 },
    },
    {
      key: "hypotenuse",
      rung: "check",
      prompt: <p>A right triangle has legs 8 and 15. How long is the hypotenuse?</p>,
      answer: { kind: "numeric", value: 17 },
    },
    {
      key: "ladder",
      rung: "apply",
      prompt: (
        <p>
          A 6.5 metre ladder leans against a wall with its foot 2.5 metres from the wall. How high up the wall does it reach,
          in metres?
        </p>
      ),
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "right",
      rung: "apply",
      prompt: <p>Select every set of side lengths that makes a right triangle.</p>,
      answer: { kind: "choice", options: ["6, 8, 10", "7, 24, 25", "2, 3, 4", "1, 1, √2"], correct: [0, 1, 3] },
    },
    {
      key: "shadow",
      rung: "apply",
      prompt: (
        <p>
          A 2 metre pole casts a 3 metre shadow. At the same moment a tree casts a 27 metre shadow. How tall is the tree, in
          metres?
        </p>
      ),
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
print(math.hypot(5, 12), [(a, b) for a in range(1, 13) for b in range(a, 13) if math.hypot(a, b) == 13])`}</Code>
          <p>Pythagoras: c² = a² + b². What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["13.0 [(5, 12)]", "13.0 []", "17.0 [(5, 12)]", "13.0 [(5, 12), (12, 5)]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>triangle_kind(a, b, c)</C> for side lengths of a valid triangle, returning <C>"right"</C>, <C>"acute"</C> or <C>"obtuse"</C> by comparing the square of the longest side with the sum of the other two squares. Work with integers so equality is exact.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def triangle_kind(a, b, c):
    return 'right'
`,
        solution: `def triangle_kind(a, b, c):
    a, b, c = sorted([a, b, c])
    if c * c == a * a + b * b:
        return 'right'
    return 'acute' if c * c < a * a + b * b else 'obtuse'
`,
        tests: [
          { name: "right", code: `assert triangle_kind(13, 5, 12) == 'right', 'The longest side need not come last.'` },
          { name: "others", code: `assert triangle_kind(4, 5, 6) == 'acute' and triangle_kind(2, 3, 4) == 'obtuse', '36 < 41 is acute, 16 > 13 is obtuse.'` },
        ],
      },
    },
    {
      key: "exterior",
      rung: "prove",
      prompt: (
        <p>
          Extend one side of a triangle beyond a vertex. Prove that the angle formed outside the triangle, the{" "}
          <em>exterior angle</em>, equals the sum of the two interior angles at the other two vertices.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the exterior angle and the interior angle at the same vertex lie along a line, so add to 180°.",
          "Uses the angle sum: the three interior angles add to 180°.",
          "Subtracts to conclude the exterior angle equals the sum of the other two interior angles.",
        ],
      },
    },
    {
      key: "space-diagonal",
      rung: "stretch",
      prompt: (
        <p>
          A box measures 3 by 4 by 12. How long is the straight line from one corner to the opposite corner, through the
          inside of the box? (Use Pythagoras twice.)
        </p>
      ),
      answer: { kind: "numeric", value: 13 },
    },
  ],

  teachBack:
    "Explain to a friend why the angles of every triangle add to 180 degrees, and show them the four-triangle proof of Pythagoras with a sketch.",

  glimpse: (
    <p>
      Next, circles, where similarity explains why every circle has the same ratio of circumference to diameter, and
      angles get a natural unit of their own. Pythagoras becomes the distance formula in the chapter on coordinates, and in
      Linear Algebra it measures the length of a vector with any number of components. And the one fact about parallel lines that this
      lesson took on trust is exactly the assumption that the curved geometries of a sphere or a saddle give up.
    </p>
  ),
};
