import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CombViz } from "@/components/viz/CombViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.1.1",
  minutes: 55,
  links: {
    requires: ["m0.6.3"],
    revisits: ["m0.2.3"],
    parallels: ["e1.5.1"],
    foreshadows: ["m6.1.1", "l4.2.1", "l3.1.2"],
  },

  puzzle: (
    <>
      <p>
        You stand at the origin of a flat field. You may take any number of steps of type u, two paces east and one pace
        north, and any number of steps of type v, one pace east and two north. You may also take steps backwards, and
        fractions of steps.
      </p>
      <p>
        Can you reach every point of the field? Which points could you reach if v were instead two paces west and one south?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A vector is an arrow: a length and a direction, or equivalently a list of numbers. There are only two things to do
        with vectors: stretch them by a number, and add them tip to tail. Combine the two and you get a{" "}
        <strong>linear combination</strong> <M>{"a\\mathbf u + b\\mathbf v"}</M>. Move the sliders below: the red arrow is
        built from a copies of u followed by b copies of v. With u and v pointing different ways, every point of the plane
        is reachable. Tick the box to make v a multiple of u and watch the reachable set collapse to a line.
      </p>
      <CombViz />
    </>
  ),

  theory: (
    <>
      <Definition title="vectors in n dimensions">
        <p>
          A vector in <M>{"\\mathbb R^n"}</M> is an ordered list of n real numbers,{" "}
          <M>{"\\mathbf v = (v_1, \\dots, v_n)"}</M>, usually written as a column. Vectors are added component by component,
          and multiplied by a scalar c component by component:
        </p>
        <MD>{"\\mathbf u + \\mathbf v = (u_1 + v_1, \\dots, u_n + v_n), \\qquad c\\mathbf v = (cv_1, \\dots, cv_n)."}</MD>
      </Definition>

      <Definition title="linear combination and span">
        <p>
          A <strong>linear combination</strong> of <M>{"\\mathbf v_1, \\dots, \\mathbf v_k"}</M> is any vector{" "}
          <M>{"c_1\\mathbf v_1 + \\dots + c_k\\mathbf v_k"}</M> with real coefficients <M>{"c_i"}</M>. The set of all of them
          is the <strong>span</strong> of the vectors.
        </p>
      </Definition>

      <Example title="the puzzle">
        <p>
          With <M>{"\\mathbf u = (2, 1)"}</M> and <M>{"\\mathbf v = (1, 2)"}</M>, the point (5, 4) needs{" "}
          <M>{"a(2, 1) + b(1, 2) = (5, 4)"}</M>, which is two equations:
        </p>
        <MD>{"2a + b = 5, \\qquad a + 2b = 4."}</MD>
        <p>
          They give a = 2, b = 1. Any target (x, y) gives two equations with a unique solution, so every point is reachable.
          If v = (−2, −1) = −u, every combination is <M>{"(a - b)\\mathbf u"}</M>, a multiple of u, and only the line through u
          is reachable.
        </p>
      </Example>

      <Theorem title="what the combinations of one, two and three vectors fill">
        <p>In <M>{"\\mathbb R^3"}</M>, the combinations of</p>
        <ul>
          <li>one non-zero vector fill a line through the origin;</li>
          <li>two vectors, neither a multiple of the other, fill a plane through the origin;</li>
          <li>three vectors, none in the plane of the other two, fill all of <M>{"\\mathbb R^3"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          The first two are the definitions of a line and a plane through 0. For the third, any point of space is a point of
          the plane of the first two vectors plus a multiple of the third, since the third vector leaves that plane. Chapter 4
          makes the words &ldquo;not in the plane of the others&rdquo; precise, as linear independence.
        </p>
      </Proof>

      <Remark title="two pictures of the same thing">
        <p>
          The puzzle&rsquo;s two equations are two lines in the (a, b) plane meeting at a point: the row picture. The question
          &ldquo;which combination of the columns (2, 1) and (1, 2) makes (5, 4)?&rdquo; is the column picture. Linear algebra
          moves between the two constantly, and the column picture is usually the one that scales to many dimensions.
        </p>
      </Remark>

      <Remark title="vectors in machine learning">
        <p>
          An image of 28 × 28 pixels is a vector in <M>{"\\mathbb R^{784}"}</M>; a word embedding is a vector in{" "}
          <M>{"\\mathbb R^{4096}"}</M>. Nobody can draw those spaces, but the algebra is exactly the same as in the plane, and
          the pictures in two and three dimensions are a reliable guide.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "combo",
      rung: "check",
      prompt: <p>For <M>{"\\mathbf v = (1, 2)"}</M> and <M>{"\\mathbf w = (2, -1)"}</M>, compute <M>{"3\\mathbf v - 2\\mathbf w"}</M>. Give its second component.</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "one",
      rung: "check",
      prompt: <p>The combinations <M>{"c\\mathbf v"}</M> of a single non-zero vector v in <M>{"\\mathbb R^3"}</M> fill:</p>,
      answer: { kind: "choice", options: ["A line through the origin", "A plane through the origin", "All of ℝ³", "A single point"], correct: [0] },
    },
    {
      key: "solve",
      rung: "apply",
      prompt: <p>Find c and d with <M>{"c(1, 1) + d(1, -1) = (5, 1)"}</M>. Give c.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "line",
      rung: "apply",
      prompt: <p>The combinations of (1, 2, 3) and (2, 4, 6) fill:</p>,
      answer: { kind: "choice", options: ["A line through the origin", "A plane through the origin", "All of ℝ³"], correct: [0] },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these are combinations of <M>{"\\mathbf u = (1, 0, 1)"}</M> and <M>{"\\mathbf w = (0, 1, 1)"}</M>? Select all that apply.</p>,
      answer: { kind: "choice", options: ["(2, 3, 5)", "(1, 1, 1)", "(0, 0, 0)", "(−1, 4, 3)"], correct: [0, 2, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
u = np.array([2, 1])
v = np.array([1, 2])
w = 3 * u - 2 * v
print(w[0] + w[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "closed",
      rung: "prove",
      prompt: (
        <p>
          Prove that if x and y are both linear combinations of u and w, then so is <M>{"a\\mathbf x + b\\mathbf y"}</M> for any
          numbers a and b. Conclude that the span of u and w contains every combination of its own members.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes x = c₁u + c₂w and y = d₁u + d₂w for some numbers.",
          "Expands ax + by and regroups it as (ac₁ + bd₁)u + (ac₂ + bd₂)w, using the rules of vector arithmetic.",
          "Concludes that ax + by is a combination of u and w, so the span is closed under combinations.",
        ],
      },
    },
    {
      key: "dependent",
      rung: "stretch",
      prompt: (
        <p>
          Find numbers a, b and c, not all zero, with <M>{"a(1, 2) + b(3, 1) + c(4, 3) = (0, 0)"}</M> and c = 1. Give a. Why must
          three vectors in the plane always allow this?
        </p>
      ),
      answer: { kind: "numeric", value: -1 },
    },
  ],

  teachBack:
    "Explain to a friend what a linear combination is, what the combinations of one, two or three vectors in space fill, and why the plane is reachable from u = (2, 1) and v = (1, 2) but not from u and −u.",

  glimpse: (
    <p>
      Next, the dot product, which measures lengths and angles and turns geometry into arithmetic. Linear Algebra II treats
      vector spaces in general, and Deep Learning Architectures meets vectors of thousands of components as embeddings, where
      linear combinations of meaning are surprisingly common.
    </p>
  ),
};
