import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DotAngleViz } from "@/components/viz/DotAngleViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.1.2",
  minutes: 60,
  links: {
    requires: ["m3.1.1", "m0.5.3"],
    revisits: ["m0.5.1", "m0.6.2"],
    parallels: ["e1.5.2"],
    foreshadows: ["m6.2.1", "m3.5.2", "l5.2.1"],
  },

  puzzle: (
    <>
      <p>
        A cube has a corner at the origin and edges along the three axes. Draw the long diagonal from the origin to the
        opposite corner. What angle does it make with one of the edges?
      </p>
      <p>
        You could try to find the right triangle by drawing. Or you could multiply some numbers together and add them up.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The dot product <M>{"\\mathbf u \\cdot \\mathbf v = u_1v_1 + u_2v_2 + \\dots"}</M> looks like bookkeeping, but it has a
        geometric meaning: the length of u times the signed length of v&rsquo;s shadow on u. Turn v below. The arithmetic
        and the geometry always agree. At a right angle the shadow vanishes and so does the dot product; past a right angle the
        shadow points backwards and the dot product is negative.
      </p>
      <DotAngleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="dot product and length">
        <p>The dot product of u and v in <M>{"\\mathbb R^n"}</M> is</p>
        <MD>{"\\mathbf u \\cdot \\mathbf v = u_1v_1 + u_2v_2 + \\dots + u_nv_n,"}</MD>
        <p>
          and the length (or norm) of v is <M>{"\\|\\mathbf v\\| = \\sqrt{\\mathbf v \\cdot \\mathbf v}"}</M>, which is
          Pythagoras in n dimensions. A <strong>unit vector</strong> has length 1; <M>{"\\mathbf v / \\|\\mathbf v\\|"}</M> is
          the unit vector in the direction of v.
        </p>
      </Definition>

      <Theorem title="the angle formula">
        <p>If θ is the angle between non-zero vectors u and v, then</p>
        <MD>{"\\mathbf u \\cdot \\mathbf v = \\|\\mathbf u\\|\\,\\|\\mathbf v\\| \\cos\\theta."}</MD>
        <p>In particular, u and v are perpendicular exactly when <M>{"\\mathbf u \\cdot \\mathbf v = 0"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The triangle with sides u, v and v − u has, by the law of cosines,{" "}
          <M>{"\\|\\mathbf v - \\mathbf u\\|^2 = \\|\\mathbf u\\|^2 + \\|\\mathbf v\\|^2 - 2\\|\\mathbf u\\|\\|\\mathbf v\\|\\cos\\theta"}</M>.
          Expanding the left side with the dot product gives{" "}
          <M>{"\\|\\mathbf v\\|^2 - 2\\,\\mathbf u \\cdot \\mathbf v + \\|\\mathbf u\\|^2"}</M>. Compare the two.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The diagonal is d = (1, 1, 1) and an edge is e = (1, 0, 0). Then <M>{"\\mathbf d \\cdot \\mathbf e = 1"}</M>,{" "}
          <M>{"\\|\\mathbf d\\| = \\sqrt 3"}</M> and <M>{"\\|\\mathbf e\\| = 1"}</M>, so{" "}
          <M>{"\\cos\\theta = 1/\\sqrt 3"}</M> and θ ≈ 54.7°. No drawing was needed, and the same calculation works for a
          cube in 100 dimensions, where <M>{"\\cos\\theta = 1/10"}</M> and the diagonal is almost perpendicular to every edge.
        </p>
      </Example>

      <Theorem title="Cauchy-Schwarz and the triangle inequality">
        <p>For all vectors u and v,</p>
        <MD>{"|\\mathbf u \\cdot \\mathbf v| \\le \\|\\mathbf u\\|\\,\\|\\mathbf v\\|, \\qquad \\|\\mathbf u + \\mathbf v\\| \\le \\|\\mathbf u\\| + \\|\\mathbf v\\|."}</MD>
      </Theorem>
      <Proof>
        <p>
          For v ≠ 0 and every real t, <M>{"0 \\le \\|\\mathbf u - t\\mathbf v\\|^2 = \\|\\mathbf u\\|^2 - 2t\\,\\mathbf u\\cdot\\mathbf v + t^2\\|\\mathbf v\\|^2"}</M>.
          A quadratic in t that is never negative has discriminant at most 0:{" "}
          <M>{"4(\\mathbf u \\cdot \\mathbf v)^2 - 4\\|\\mathbf u\\|^2\\|\\mathbf v\\|^2 \\le 0"}</M>. For the triangle
          inequality, expand <M>{"\\|\\mathbf u + \\mathbf v\\|^2"}</M> and bound the cross term by Cauchy-Schwarz.
        </p>
      </Proof>

      <Remark title="why this proof matters">
        <p>
          The proof of Cauchy-Schwarz never mentions angles or dimensions. That is what lets us define the angle between two
          vectors in <M>{"\\mathbb R^{1000}"}</M> by the formula above: Cauchy-Schwarz guarantees the cosine lies between −1
          and 1.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dot",
      rung: "check",
      prompt: <p>Compute <M>{"(1, -2, 3) \\cdot (4, 1, -1)"}</M>.</p>,
      answer: { kind: "numeric", value: -1 },
    },
    {
      key: "zero",
      rung: "check",
      prompt: <p>Two non-zero vectors have dot product 0. What is the angle between them?</p>,
      answer: { kind: "choice", options: ["90°", "0°", "180°", "It depends on their lengths"], correct: [0] },
    },
    {
      key: "length",
      rung: "apply",
      prompt: <p>Find the length of (2, −1, 2).</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "angle",
      rung: "apply",
      prompt: <p>Find the angle in degrees between (1, 2, 2) and (2, 0, 1). Give one decimal place.</p>,
      answer: { kind: "numeric", value: 53.4, tolerance: 0.002 },
    },
    {
      key: "cs",
      rung: "apply",
      prompt: <p>Vectors u and v have lengths 2 and 5. What is the largest possible value of <M>{"\\mathbf u \\cdot \\mathbf v"}</M>?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
u = np.array([1.0, 2.0, 2.0])
v = np.array([3.0, 0.0, 4.0])
print(u @ v / (np.linalg.norm(u) * np.linalg.norm(v)))`}</Code>
          <p>What does this print? Give four decimal places.</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.7333, tolerance: 0.0002 },
    },
    {
      key: "triangle",
      rung: "prove",
      prompt: (
        <p>
          Prove the triangle inequality <M>{"\\|\\mathbf u + \\mathbf v\\| \\le \\|\\mathbf u\\| + \\|\\mathbf v\\|"}</M> from
          Cauchy-Schwarz, and say when equality holds.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Expands ‖u + v‖² = ‖u‖² + 2 u·v + ‖v‖².",
          "Bounds u·v ≤ |u·v| ≤ ‖u‖‖v‖ by Cauchy-Schwarz, giving ‖u + v‖² ≤ (‖u‖ + ‖v‖)².",
          "Takes square roots, both sides being non-negative.",
          "States that equality needs u·v = ‖u‖‖v‖, so one vector is a non-negative multiple of the other.",
        ],
      },
    },
    {
      key: "cube",
      rung: "stretch",
      prompt: (
        <p>
          In a cube, find the angle in degrees between the long diagonal (1, 1, 1) and a face diagonal (1, 1, 0) that starts at
          the same corner. Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 35.26, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend how the dot product is computed, why it equals length times length times cosine, and how Cauchy-Schwarz lets us talk about angles in a thousand dimensions.",

  glimpse: (
    <p>
      Next, cosine similarity, the dot product with the lengths divided out, which is how search engines and language models
      compare meanings. Linear Algebra II generalises the dot product to inner products, and Transformers and Language Models
      builds attention out of dot products between queries and keys.
    </p>
  ),
};
