import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { RadianViz } from "@/components/viz/RadianViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.5.2",
  minutes: 70,
  links: {
    foreshadows: ["m2.4.2", "m2.6.1"],
  },

  puzzle: (
    <>
      <p>
        Around 240 BCE, Eratosthenes of Cyrene heard that at noon on midsummer&rsquo;s day the sun shone straight down a
        well at Syene, in the south of Egypt. On the same day at Alexandria, about 800 kilometres to the north, a vertical
        stick cast a shadow: the sun was 7.2 degrees away from overhead.
      </p>
      <p>From these two numbers alone he worked out the size of the whole Earth. How?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The sun is so far away that its rays arrive parallel. So the 7.2 degree tilt at Alexandria is also the angle at the
        centre of the Earth between the two cities. And 7.2 degrees is one fiftieth of a full turn, so the 800 kilometre
        arc is one fiftieth of the way round: the Earth&rsquo;s circumference is about <M>{"50 \\times 800 = 40\\,000"}</M>{" "}
        kilometres, which is remarkably close.
      </p>
      <p>
        The key idea is that an angle at the centre and the arc it cuts off are in proportion. That suggests a natural way to
        measure angles: not in degrees, a Babylonian choice, but by the length of the arc, counted in radii. Open the angle
        below and watch the arc grow.
      </p>
      <RadianViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the number π">
        <p>
          A <strong>circle</strong> is the set of points at a fixed distance <M>r</M>, the <strong>radius</strong>, from a
          centre. Any two circles are similar, one a scaled copy of the other, so the ratio of the distance round a circle,
          its <strong>circumference</strong> <M>C</M>, to its diameter <M>{"2r"}</M> is the same for every circle. That
          ratio is called <M>{"\\pi"}</M>:
        </p>
        <MD>{"C = 2\\pi r, \\qquad \\pi = 3.14159\\ldots"}</MD>
      </Definition>

      <Theorem title="area of a disc">
        <p>The region inside a circle of radius <M>r</M> has area <M>{"\\pi r^2"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Cut the disc into many thin equal slices, like a cake, and lay them side by side, pointing alternately up and
          down. Each slice is nearly a thin triangle of height <M>r</M>, so the row is nearly a parallelogram: its height
          is <M>r</M>, and its length is half the circumference, <M>{"\\pi r"}</M>, since half the curved edges lie along
          the top and half along the bottom. Its area is nearly <M>{"\\pi r \\times r"}</M>. The more slices, the closer
          the row is to an exact parallelogram, while the area never changes, so it must be exactly <M>{"\\pi r^2"}</M>.
          Making &ldquo;the closer, the more slices&rdquo; precise is the job of limits in Calculus; Archimedes did it
          about 2,250 years ago by trapping the circle between polygons.
        </p>
      </Proof>

      <Definition title="angles as turning">
        <p>
          An angle measures an amount of turning about a point. We turn from a starting ray, and count anticlockwise turning as
          positive and clockwise turning as negative. Turning more than once round is allowed, so an angle can be any real
          number of units. One <strong>degree</strong> is <M>{"\\tfrac{1}{360}"}</M> of a full turn.
        </p>
      </Definition>

      <Definition title="radian">
        <p>
          Draw a circle of radius <M>r</M> centred at the angle&rsquo;s vertex. If the angle cuts off an arc of length{" "}
          <M>s</M>, the angle measures
        </p>
        <MD>{"\\theta = \\frac{s}{r} \\text{ radians.}"}</MD>
        <p>
          So one <strong>radian</strong> is the angle whose arc is exactly one radius long. The ratio does not depend on the
          circle chosen, because all circles are similar: doubling the radius doubles the arc.
        </p>
      </Definition>

      <Proposition title="converting">
        <p>
          A full turn is <M>{"2\\pi"}</M> radians, so <M>{"\\pi \\text{ radians} = 180^\\circ"}</M>, and one radian is{" "}
          <M>{"\\tfrac{180}{\\pi} \\approx 57.3"}</M> degrees.
        </p>
      </Proposition>
      <Proof>
        <p>
          A full turn cuts off the whole circumference, <M>{"2\\pi r"}</M>, so it measures{" "}
          <M>{"\\tfrac{2\\pi r}{r} = 2\\pi"}</M> radians. It is also <M>{"360^\\circ"}</M>; halve both.
        </p>
      </Proof>

      <Proposition title="arcs and sectors">
        <p>
          In a circle of radius <M>r</M>, an angle of <M>{"\\theta"}</M> radians at the centre cuts off an arc of length{" "}
          <M>{"r\\theta"}</M> and a sector of area <M>{"\\tfrac12 r^2 \\theta"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>
          The arc length is the definition rearranged. For the area: the sector is the fraction{" "}
          <M>{"\\tfrac{\\theta}{2\\pi}"}</M> of the whole disc, since sectors with equal angles are congruent and so have
          equal area. Its area is <M>{"\\tfrac{\\theta}{2\\pi} \\times \\pi r^2 = \\tfrac12 r^2 \\theta"}</M>.
        </p>
      </Proof>

      <Example title="some conversions">
        <p>
          A right angle is a quarter turn, <M>{"\\tfrac{\\pi}{2}"}</M>. Then <M>{"45^\\circ = \\tfrac{\\pi}{4}"}</M>,{" "}
          <M>{"60^\\circ = \\tfrac{\\pi}{3}"}</M> and <M>{"120^\\circ = \\tfrac{2\\pi}{3}"}</M>. Going the other way,{" "}
          <M>{"\\tfrac{5\\pi}{6} = \\tfrac56 \\times 180^\\circ = 150^\\circ"}</M>. To convert, multiply by{" "}
          <M>{"\\tfrac{\\pi}{180}"}</M> or by <M>{"\\tfrac{180}{\\pi}"}</M>.
        </p>
      </Example>

      <Remark title="why radians are natural">
        <p>
          The number 360 is a human convention, probably chosen by the Babylonians because it divides so many ways and is
          close to the number of days in a year. Radians are not a convention: they come from the circle itself. The payoff
          arrives in Calculus. For a small angle the arc and the straight chord are almost equal, so in radians{" "}
          <M>{"\\sin x \\approx x"}</M> when <M>x</M> is small, and the rate of change of <M>{"\\sin x"}</M> is exactly{" "}
          <M>{"\\cos x"}</M>. In degrees both facts carry an awkward factor of <M>{"\\tfrac{\\pi}{180}"}</M>. That is why
          mathematicians use radians unless they say otherwise.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "right-angle",
      rung: "check",
      prompt: <p>How many radians is <M>{"90^\\circ"}</M>? Answer in terms of π, such as pi/6.</p>,
      answer: { kind: "expression", value: "pi/2", variables: [] },
    },
    {
      key: "one-radian",
      rung: "check",
      prompt: <p>How many degrees is one radian, to one decimal place?</p>,
      answer: { kind: "numeric", value: 57.3, tolerance: 0.001 },
    },
    {
      key: "to-degrees",
      rung: "apply",
      prompt: <p>Convert <M>{"\\tfrac{3\\pi}{4}"}</M> radians to degrees.</p>,
      answer: { kind: "numeric", value: 135 },
    },
    {
      key: "arc",
      rung: "apply",
      prompt: <p>A circle has radius 10 cm. How long is the arc cut off by an angle of 2.5 radians at the centre, in cm?</p>,
      answer: { kind: "numeric", value: 25 },
    },
    {
      key: "sector",
      rung: "apply",
      prompt: <p>What is the area of a sector of a circle of radius 4 with angle <M>{"\\tfrac{\\pi}{4}"}</M>, to two decimal places?</p>,
      answer: { kind: "numeric", value: 6.28, tolerance: 0.001 },
    },
    {
      key: "pizza",
      rung: "apply",
      prompt: (
        <p>
          A pizza 30 cm across costs &#8377;400 and one 20 cm across costs &#8377;200. How many times as much pizza does the
          larger one give? Give a decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 2.25 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
r, theta = 2, math.pi / 3
print(round(r * theta, 3), round(math.degrees(theta)))`}</Code>
          <p>Arc length is rθ when θ is in radians. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.094 60", "120 60", "2.094 1", "1.047 60"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
print(round(math.radians(270) / math.pi, 3), round(math.degrees(1), 2), round(2 * math.pi * 3 * (60 / 360), 4))`}</Code>
          <p>Converting angles, and the length of a 60° arc of radius 3. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.5 57.3 3.1416", "1.5 57.3 1.0472", "0.75 57.3 3.1416", "1.5 0.02 3.1416"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sector(r, degrees)</C>, which returns (arc length, area) of a sector of a circle of radius r, converting the angle to radians first. The area is ½r²θ.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sector(r, degrees):
    return (r * degrees, r * r * degrees / 2)
`,
        solution: `import math

def sector(r, degrees):
    t = math.radians(degrees)
    return (r * t, r * r * t / 2)
`,
        tests: [
          { name: "quarter", code: `import math
s, A = sector(2, 90)
assert abs(s - math.pi) < 1e-9 and abs(A - math.pi) < 1e-9, 'A quarter circle of radius 2 has arc π and area π.'` },
          { name: "full", code: `import math
s, A = sector(1, 360)
assert abs(s - 2 * math.pi) < 1e-9 and abs(A - math.pi) < 1e-9, 'The full circle has circumference 2πr and area πr².'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>chord(r, theta)</C>, the length of the chord cut off by an angle θ (radians) at the centre of a circle of radius r, and <C>segment_area(r, theta)</C>, the area between that chord and the arc (sector minus triangle). Then write <C>pi_polygon(k)</C>, the half-perimeter of a regular polygon with 6·2ᵏ sides inscribed in a unit circle, found by doubling the number of sides k times from a hexagon (side 1) using the half-angle formula s′ = √(2 − √(4 − s²)). It approaches π.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def chord(r, theta):
    return r * theta

def segment_area(r, theta):
    return r * r * theta / 2

def pi_polygon(k):
    return 3.0
`,
        solution: `import math

def chord(r, theta):
    return 2 * r * math.sin(theta / 2)

def segment_area(r, theta):
    return r * r * (theta - math.sin(theta)) / 2

def pi_polygon(k):
    s, n = 1.0, 6
    for _ in range(k):
        s = math.sqrt(2 - math.sqrt(4 - s * s))
        n *= 2
    return n * s / 2
`,
        tests: [
          { name: "chord", code: `import math
assert abs(chord(1, math.pi) - 2) < 1e-12 and abs(chord(2, math.pi / 3) - 2) < 1e-12, 'A diameter is the chord of π.'` },
          { name: "segment", code: `import math
assert abs(segment_area(1, math.pi) - math.pi / 2) < 1e-12 and abs(segment_area(3, math.pi / 2) - (9 * math.pi / 4 - 4.5)) < 1e-12, 'Sector r²θ/2 minus triangle r² sin θ / 2.'` },
          { name: "archimedes", code: `assert pi_polygon(0) == 3 and abs(pi_polygon(4) - 3.14103) < 1e-5 and 3.1415 < pi_polygon(8) < 3.14160, '96 sides gives about 3.1410; keep doubling.'` },
          { name: "increasing", code: `vals = [pi_polygon(k) for k in range(10)]
assert all(a < b for a, b in zip(vals, vals[1:])), 'Inscribed polygons approach π from below.'` },
        ],
      },
    },
    {
      key: "sector-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that a sector of angle <M>{"\\theta"}</M> radians in a circle of radius <M>r</M> has area{" "}
          <M>{"\\tfrac12 r^2\\theta"}</M>, using the area of the whole circle.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the area of a sector is proportional to its angle, for instance because equal angles give congruent sectors.",
          "Identifies the whole circle as a sector of angle 2π with area πr².",
          "Writes the sector as the fraction θ/(2π) of the circle.",
          "Simplifies (θ/2π)·πr² to ½r²θ.",
        ],
      },
    },
    {
      key: "eratosthenes",
      rung: "stretch",
      prompt: (
        <p>
          In Eratosthenes&rsquo;s measurement, an angle of 7.2 degrees at the Earth&rsquo;s centre cuts off an arc of 800 km.
          Convert the angle to radians and find the Earth&rsquo;s radius, to the nearest 10 km.
        </p>
      ),
      answer: { kind: "numeric", value: 6370, tolerance: 0.002 },
    },
  ],

  teachBack:
    "Explain to a friend why every circle has the same ratio of circumference to diameter, what one radian is, and why a full turn is 2π radians.",

  glimpse: (
    <p>
      Next, sine and cosine, defined by walking round a circle of radius 1, where an angle in radians is simply the distance
      walked. Radians make the calculus of these functions clean, and the formula <M>{"s = r\\theta"}</M> grows up into the
      arc length integral for any curve.
    </p>
  ),
};
