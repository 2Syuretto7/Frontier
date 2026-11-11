import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { LinePlaneViz } from "@/components/viz/LinePlaneViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.1.4",
  minutes: 55,
  links: {
    requires: ["m3.1.2"],
    revisits: ["m0.6.2"],
    parallels: ["l1.3.2"],
    foreshadows: ["l2.3.1", "m10.1.3"],
  },

  puzzle: (
    <>
      <p>
        A linear classifier labels an email as spam when <M>{"2x_1 - x_2 + 2x_3 > 6"}</M>, where the x&rsquo;s are three
        features of the email. The emails exactly on the boundary form a flat surface in feature space.
      </p>
      <p>
        How far is that surface from the origin, the email with all features zero? And how would you describe the boundary to
        someone who wants to walk along it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A line can be described in two ways. You can say how to walk along it: start at p and move in direction d, giving the
        points <M>{"\\mathbf p + t\\mathbf d"}</M>. Or you can give a test a point must pass: <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M>,
        where n is perpendicular to the line. Drag t below: the walking point changes, but its dot product with n never does.
      </p>
      <LinePlaneViz />
    </>
  ),

  theory: (
    <>
      <Definition title="parametric and implicit forms">
        <p>
          A <strong>line</strong> through p with direction d ≠ 0 is the set of points <M>{"\\mathbf p + t\\mathbf d"}</M>,{" "}
          <M>{"t \\in \\mathbb R"}</M>. A <strong>plane</strong> in <M>{"\\mathbb R^3"}</M> through p is{" "}
          <M>{"\\mathbf p + s\\mathbf d_1 + t\\mathbf d_2"}</M> with two directions, neither a multiple of the other. A{" "}
          <strong>hyperplane</strong> in <M>{"\\mathbb R^n"}</M> is the set of x with <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M>{" "}
          for a fixed non-zero normal vector n.
        </p>
      </Definition>

      <Theorem title="the normal vector">
        <p>
          The coefficients of <M>{"a_1x_1 + \\dots + a_nx_n = c"}</M> form a vector <M>{"\\mathbf n = (a_1, \\dots, a_n)"}</M>{" "}
          perpendicular to the hyperplane: if x and y both lie on it, then <M>{"\\mathbf n \\cdot (\\mathbf x - \\mathbf y) = c - c = 0"}</M>.
        </p>
      </Theorem>

      <Theorem title="distance to a hyperplane">
        <p>The distance from a point q to the hyperplane <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M> is</p>
        <MD>{"\\frac{|\\mathbf n \\cdot \\mathbf q - c|}{\\|\\mathbf n\\|}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The closest point is reached by moving from q along the normal: <M>{"\\mathbf x = \\mathbf q - s\\,\\mathbf n"}</M>.
          It lies on the hyperplane when <M>{"\\mathbf n\\cdot\\mathbf q - s\\|\\mathbf n\\|^2 = c"}</M>, so{" "}
          <M>{"s = (\\mathbf n\\cdot\\mathbf q - c)/\\|\\mathbf n\\|^2"}</M>, and the distance moved is{" "}
          <M>{"|s|\\,\\|\\mathbf n\\|"}</M>. Any other point of the hyperplane is further, by Pythagoras, since the step along n
          is perpendicular to the hyperplane.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The boundary is <M>{"2x_1 - x_2 + 2x_3 = 6"}</M> with normal n = (2, −1, 2) and <M>{"\\|\\mathbf n\\| = 3"}</M>. The
          origin is at distance |0 − 6|/3 = 2. To walk along the boundary, start at p = (3, 0, 0) and use directions
          perpendicular to n, such as (1, 2, 0) and (0, 2, 1).
        </p>
      </Example>

      <Example title="where a line meets a plane">
        <p>
          The line (1, 0, 2) + t(1, 1, −1) meets the plane x + y + z = 6 when (1 + t) + t + (2 − t) = 6, so t = 3 and the
          point is (4, 3, −1). Substituting the parametric form into the implicit one is the general method.
        </p>
      </Example>

      <Remark title="margins">
        <p>
          The signed distance <M>{"(\\mathbf n \\cdot \\mathbf q - c)/\\|\\mathbf n\\|"}</M> tells a linear classifier not just
          which side a point is on but how confidently. Support vector machines choose the boundary that keeps the closest
          training points as far away as possible.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "normal",
      rung: "check",
      prompt: <p>Which vector is perpendicular to the plane 2x − y + 3z = 6?</p>,
      answer: { kind: "choice", options: ["(2, −1, 3)", "(6, 6, 6)", "(1, 2, 0)", "(2, −1, 3, 6)"], correct: [0] },
    },
    {
      key: "on",
      rung: "check",
      prompt: <p>Does the point (1, 1, 1) lie on the plane x + y + z = 3?</p>,
      answer: { kind: "choice", options: ["Yes", "No"], correct: [0] },
    },
    {
      key: "origin",
      rung: "apply",
      prompt: <p>Find the distance from the origin to the plane 2x − y + 2z = 6.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "meet",
      rung: "apply",
      prompt: <p>The line (2, 1, 0) + t(1, 0, 2) meets the plane x + y + z = 9. Find t.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "dist",
      rung: "apply",
      prompt: <p>Find the distance from the point (3, 1, 4) to the plane x + 2y + 2z = 1.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
n = np.array([2.0, -1.0, 2.0])
c = 6.0
q = np.array([5.0, 1.0, 3.0])
print((n @ q - c) / np.linalg.norm(n))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "formula",
      rung: "prove",
      prompt: (
        <p>
          Prove that the distance from q to the hyperplane <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M> is{" "}
          <M>{"|\\mathbf n \\cdot \\mathbf q - c| / \\|\\mathbf n\\|"}</M>. Show both that this distance is achieved and that no
          point of the hyperplane is closer.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Finds the point x₀ = q − s n on the hyperplane with s = (n·q − c)/‖n‖², and computes ‖q − x₀‖ = |n·q − c|/‖n‖.",
          "For any other point x on the hyperplane, notes that x − x₀ is perpendicular to n.",
          "Uses Pythagoras: ‖q − x‖² = ‖q − x₀‖² + ‖x₀ − x‖² ≥ ‖q − x₀‖².",
        ],
      },
    },
    {
      key: "dihedral",
      rung: "stretch",
      prompt: <p>Find the angle in degrees between the planes x + y = 1 and y + z = 1, measured as the angle between their normals.</p>,
      answer: { kind: "numeric", value: 60 },
    },
  ],

  teachBack:
    "Explain to a friend the two ways to describe a line or plane, why the coefficients of an equation give a perpendicular vector, and how to find the distance from a point to a plane.",

  glimpse: (
    <p>
      Next chapter: many planes at once. Solving a system of linear equations is finding where several hyperplanes meet.
      Statistical Machine Learning returns to hyperplanes and margins with support vector machines, and Convex Optimisation
      uses separating hyperplanes to prove its central theorems.
    </p>
  ),
};
