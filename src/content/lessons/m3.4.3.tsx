import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { IndependenceViz } from "@/components/viz/IndependenceViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.4.3",
  minutes: 55,
  links: {
    requires: ["m3.4.2"],
    foreshadows: ["m3.4.4", "l11.3.1"],
  },

  puzzle: (
    <>
      <p>A dataset has three features for each house: floor area in square metres, floor area in square feet, and number of rooms.</p>
      <p>
        A regression model fits one weight per feature. Why might the fitted weights for the first two come out as wild,
        enormous numbers of opposite sign, and what is wrong with the features?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Vectors are <strong>independent</strong> when none of them is a combination of the others: each one adds a new
        direction. Two vectors in the plane are independent unless they lie on one line. Turn v below until it lines up with
        u. Then add a third vector: in the plane it is always a combination of two independent ones, so three vectors in the
        plane are never independent.
      </p>
      <IndependenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear independence">
        <p>
          Vectors <M>{"\\mathbf v_1, \\dots, \\mathbf v_k"}</M> are <strong>linearly independent</strong> if the only
          combination giving zero is the trivial one:
        </p>
        <MD>{"c_1\\mathbf v_1 + \\dots + c_k\\mathbf v_k = \\mathbf 0 \\implies c_1 = \\dots = c_k = 0."}</MD>
        <p>Otherwise they are <strong>dependent</strong>, and at least one of them is a combination of the others.</p>
      </Definition>

      <Theorem title="independence and the null space">
        <p>
          The columns of A are independent exactly when N(A) = {"{0}"}, which happens exactly when the rank of A equals the
          number of columns.
        </p>
      </Theorem>
      <Proof>
        <p>
          A combination of the columns with coefficients c is Ac. The columns are independent exactly when Ac = 0 forces c = 0,
          which is N(A) = {"{0}"}. That means no free variables, so every column has a pivot.
        </p>
      </Proof>

      <Theorem title="too many vectors">
        <p>Any n + 1 vectors in <M>{"\\mathbb R^n"}</M> are dependent.</p>
      </Theorem>
      <Proof>
        <p>
          Put them as the columns of an n × (n + 1) matrix. Its rank is at most n, so there is at least one free variable and a
          non-zero vector in the null space.
        </p>
      </Proof>

      <Example title="finding a dependency">
        <p>
          Are (1, 2, 3), (4, 5, 6) and (7, 8, 9) independent? Elimination on the matrix with these columns leaves only two
          pivots. Solving Ac = 0 gives c = (1, −2, 1): indeed (1, 2, 3) − 2(4, 5, 6) + (7, 8, 9) = 0.
        </p>
      </Example>

      <Example title="the puzzle">
        <p>
          The square-feet column is 10.764 times the square-metres column, so the feature columns are dependent. The null space
          contains (10.764, −1, 0): adding any multiple of it to the weights leaves every prediction unchanged. The fit has no
          unique answer, and tiny noise can push it to huge weights that nearly cancel.
        </p>
      </Example>

      <Remark title="nearly dependent">
        <p>
          In real data, features are rarely exactly dependent but often nearly so, and the same instability appears in a
          milder form. Ridge regularisation and the singular value decomposition both deal with it.
        </p>
      </Remark>

      <Remark title="more features than dimensions">
        <p>
          A network layer with 512 dimensions cannot hold more than 512 independent directions, yet language models appear to
          represent far more features than that. Interpretability calls this superposition: features stored in nearly, but not
          exactly, perpendicular directions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "four",
      rung: "check",
      prompt: <p>Can four vectors in <M>{"\\mathbb R^3"}</M> be linearly independent?</p>,
      answer: { kind: "choice", options: ["No", "Yes", "Only if none is zero"], correct: [0] },
    },
    {
      key: "pair",
      rung: "check",
      prompt: <p>Are (1, 2) and (2, 4) independent?</p>,
      answer: { kind: "choice", options: ["No", "Yes"], correct: [0] },
    },
    {
      key: "c",
      rung: "apply",
      prompt: <p>For which c are (1, 2, 3), (4, 5, 6) and (7, 8, c) dependent?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "dep",
      rung: "apply",
      prompt: (
        <p>
          The vectors (1, 0, 1), (0, 1, 1) and (1, 1, 2) are dependent. Write <M>{"a\\mathbf v_1 + b\\mathbf v_2 - \\mathbf v_3 = \\mathbf 0"}</M>{" "}
          and give a.
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "sets",
      rung: "apply",
      prompt: <p>Which sets are linearly independent? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["(1, 0, 0), (1, 1, 0), (1, 1, 1)", "(1, 2), (3, 4), (5, 6)", "(0, 0, 1)", "(1, 1, 0), (0, 0, 0)"],
        correct: [0, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
V = np.array([[1, 0, 1], [0, 1, 1], [1, 1, 2], [2, -1, 1]]).T
print(np.linalg.matrix_rank(V))`}</Code>
          <p>The columns of V are four vectors in ℝ³. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "null",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"\\mathbf v_1, \\dots, \\mathbf v_k"}</M> are dependent, then one of them is a combination of the
          others. Then prove that any set containing the zero vector is dependent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes a non-trivial combination c₁v₁ + … + c_kv_k = 0 and picks an index j with c_j ≠ 0.",
          "Solves for v_j = −(1/c_j) Σ_{i≠j} c_i v_i.",
          "For the zero vector, notes that 1·0 plus zero times the others is a non-trivial combination equal to 0.",
        ],
      },
    },
    {
      key: "subsets",
      rung: "stretch",
      prompt: <p>How many of the seven non-empty subsets of {"{(1, 0), (0, 1), (1, 1)}"} are linearly independent?</p>,
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for vectors to be independent, how to test independence with the null space, and why duplicated features make a regression's weights unstable.",

  glimpse: (
    <p>
      Next, a basis: a set that is independent and spans, and the dimension, which counts it. Interpretability returns to
      independence in high dimensions with toy models of superposition.
    </p>
  ),
};
