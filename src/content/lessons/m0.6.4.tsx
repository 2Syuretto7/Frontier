import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { ComplexMultViz } from "@/components/viz/ComplexMultViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.6.4",
  minutes: 75,
  links: {
    revisits: ["m0.1.2", "m0.2.6"],
  },

  puzzle: (
    <>
      <p>
        In 1545 Girolamo Cardano published a formula for solving cubic equations. Applied to <M>{"x^3 = 15x + 4"}</M>, it
        gives
      </p>
      <MD>{"x = \\sqrt[3]{2 + \\sqrt{-121}} + \\sqrt[3]{2 - \\sqrt{-121}}."}</MD>
      <p>
        But <M>{"-121"}</M> has no square root among the real numbers. Was the formula useless here? Yet{" "}
        <M>{"x = 4"}</M> plainly works, since <M>{"64 = 60 + 4"}</M>. How could a formula full of impossible numbers point to
        a perfectly real answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In 1572 Rafael Bombelli decided to calculate boldly with a square root of <M>{"-1"}</M>, as if it were an ordinary
        number, and found that the impossible parts cancelled to leave 4. Such numbers were called
        &ldquo;imaginary&rdquo;, and for two centuries no one quite knew what they were.
      </p>
      <p>
        The answer came from a picture. Multiplying by <M>{"-1"}</M> turns the number line half a turn about 0. A number{" "}
        <M>i</M> with <M>{"i \\times i = -1"}</M> should then be half of a half turn: a quarter turn, which takes the number
        line off itself into the plane. So the new numbers live in a plane, and multiplying by them turns and stretches it.
      </p>
      <ComplexMultViz />
    </>
  ),

  theory: (
    <>
      <Definition title="complex numbers">
        <p>
          A <strong>complex number</strong> is an expression <M>{"z = a + bi"}</M> with <M>a</M> and <M>b</M> real. Here{" "}
          <M>a</M> is the <strong>real part</strong> and <M>b</M> the <strong>imaginary part</strong>. They are added and
          multiplied by the usual rules of algebra, together with <M>{"i^2 = -1"}</M>:
        </p>
        <MD>{"(a + bi)(c + di) = (ac - bd) + (ad + bc)i."}</MD>
      </Definition>

      <Definition title="the complex plane">
        <p>
          The complex number <M>{"a + bi"}</M> is pictured as the point <M>{"(a, b)"}</M>. Real numbers lie on the
          horizontal axis and the multiples of <M>i</M> on the vertical axis. Adding complex numbers is adding vectors.
        </p>
      </Definition>

      <Definition title="conjugate and modulus">
        <p>
          The <strong>conjugate</strong> of <M>{"z = a + bi"}</M> is <M>{"\\bar z = a - bi"}</M>, its mirror image in the real
          axis. Its <strong>modulus</strong> is <M>{"|z| = \\sqrt{a^2 + b^2}"}</M>, its distance from 0. Then
        </p>
        <MD>{"z \\bar z = a^2 + b^2 = |z|^2,"}</MD>
        <p>
          a real number, which makes division possible: multiply top and bottom by the conjugate of the bottom.
        </p>
      </Definition>

      <Example title="dividing">
        <MD>{"\\frac{5 + 5i}{1 + 2i} = \\frac{(5 + 5i)(1 - 2i)}{(1 + 2i)(1 - 2i)} = \\frac{15 - 5i}{5} = 3 - i."}</MD>
      </Example>

      <Theorem title="multiplying by i is a quarter turn">
        <p>Multiplying by <M>i</M> turns every point of the complex plane a quarter turn anticlockwise about 0.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"i(a + bi) = -b + ai"}</M>, so the point <M>{"(a, b)"}</M> goes to <M>{"(-b, a)"}</M>. The new point has the
          same distance from 0, and the dot product <M>{"(a, b) \\cdot (-b, a) = 0"}</M>, so the two arrows are perpendicular.
          Checking one point, 1 goes to <M>i</M>, shows the turn is anticlockwise.
        </p>
      </Proof>

      <Proposition title="Bombelli’s calculation">
        <p>
          <M>{"(2 + i)^3 = 2 + 11i"}</M> and <M>{"(2 - i)^3 = 2 - 11i"}</M>, and <M>{"\\sqrt{-121} = 11i"}</M>. So the cube
          roots in Cardano&rsquo;s formula can be taken to be <M>{"2 + i"}</M> and <M>{"2 - i"}</M>, and their sum is 4.
        </p>
      </Proposition>
      <Proof>
        <p>
          <M>{"(2 + i)^2 = 4 + 4i + i^2 = 3 + 4i"}</M>, and <M>{"(3 + 4i)(2 + i) = 6 + 3i + 8i + 4i^2 = 2 + 11i"}</M>. The
          other is the conjugate of this calculation.
        </p>
      </Proof>

      <Remark title="the fundamental theorem of algebra">
        <p>
          Adding <M>i</M> to the real numbers turns out to be enough, once and for all: every polynomial equation of degree at
          least one, even with complex coefficients, has a complex solution. Gauss gave the first widely accepted proof in
          1799. The picture of complex numbers as points was found independently by the surveyor Caspar Wessel in 1797 and by
          Jean-Robert Argand in 1806, and it is what finally made these numbers respectable: nothing imaginary about a point
          in a plane.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "modulus",
      rung: "check",
      prompt: <p>What is the modulus of <M>{"3 + 4i"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "conjugate-product",
      rung: "check",
      prompt: <p>What is <M>{"(2 + 3i)(2 - 3i)"}</M>?</p>,
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "power",
      rung: "apply",
      prompt: <p>What is <M>{"(1 + i)^4"}</M>? (Square twice.)</p>,
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "i-power",
      rung: "apply",
      prompt: <p>What is <M>{"i^{2027}"}</M>?</p>,
      answer: { kind: "choice", options: ["1", "i", "−1", "−i"], correct: [3] },
    },
    {
      key: "divide",
      rung: "apply",
      prompt: <p>What is the real part of <M>{"\\dfrac{10 - 5i}{2 + i}"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`z = 3 + 4j
print(abs(z), z * 1j, z.conjugate())`}</Code>
          <p>Multiplying by i turns a point a quarter turn. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.0 (-4+3j) (3-4j)", "5.0 (4+3j) (3-4j)", "7.0 (-4+3j) (-3+4j)", "5.0 (3+4j) (3-4j)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>rotate(z, degrees)</C>, which rotates the complex number z about 0 by multiplying by cos θ + i sin θ, and <C>to_polar(z)</C>, which returns (r, θ) with θ in radians from <C>math.atan2</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rotate(z, degrees):
    return z + degrees

def to_polar(z):
    return (z.real, z.imag)
`,
        solution: `import math

def rotate(z, degrees):
    t = math.radians(degrees)
    return z * complex(math.cos(t), math.sin(t))

def to_polar(z):
    return (abs(z), math.atan2(z.imag, z.real))
`,
        tests: [
          { name: "quarter turn", code: `w = rotate(3 + 4j, 90)
assert abs(w - (-4 + 3j)) < 1e-9, 'A 90 degree turn is multiplication by i.'` },
          { name: "polar", code: `import math
r, t = to_polar(-1 + 1j)
assert abs(r - math.sqrt(2)) < 1e-9 and abs(t - 3 * math.pi / 4) < 1e-9, '−1 + i is at distance √2 and angle 3π/4.'` },
        ],
      },
    },
    {
      key: "conjugate-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that the conjugate of a product is the product of the conjugates: <M>{"\\overline{zw} = \\bar z\\, \\bar w"}</M>{" "}
          for all complex numbers <M>z</M> and <M>w</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes z = a + bi and w = c + di.",
          "Computes zw = (ac − bd) + (ad + bc)i, so its conjugate is (ac − bd) − (ad + bc)i.",
          "Computes (a − bi)(c − di) = (ac − bd) − (ad + bc)i.",
          "Observes that the two agree.",
        ],
      },
    },
    {
      key: "square-root",
      rung: "stretch",
      prompt: (
        <p>
          Find the complex number <M>{"z = a + bi"}</M> with <M>{"a > 0"}</M> and <M>{"z^2 = -3 + 4i"}</M>. What is <M>b</M>?
          (Compare real and imaginary parts of <M>{"(a + bi)^2"}</M>.)
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend why it makes sense to picture i as a quarter turn, using the fact that multiplying by −1 is a half turn.",

  glimpse: (
    <p>
      This completes coordinates and vectors. Next, sequences, sums and counting. Multiplying by a complex number of
      length 1 is a pure rotation, and rotary position embeddings in Transformers and Language Models turn each pair of
      coordinates by such a number. In Linear Algebra, the same turn is written as a rotation matrix, and complex numbers
      return as its eigenvalues.
    </p>
  ),
};
