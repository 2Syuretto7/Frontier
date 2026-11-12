import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { LinearMapViz } from "@/components/viz/LinearMapViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.8.1",
  minutes: 55,
  links: {
    requires: ["m3.3.2", "m3.4.4"],
    revisits: ["m0.3.4", "m0.5.3"],
    foreshadows: ["m6.1.2", "m5.2.2"],
  },

  puzzle: (
    <>
      <p>
        A graphics program rotates an image by 30°, then shears it, then reflects it in the diagonal. Each step moves every one
        of a million pixels.
      </p>
      <p>
        Is there a single table of four numbers that does all three steps at once? How would you find it without trying it on
        any pixel?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A map is linear when it keeps grid lines straight, parallel and evenly spaced, with the origin fixed. Such a map is
        completely decided by where it sends the two basis vectors: everything else follows by combination. Those two images
        are the columns of its matrix. Try the maps below and read each matrix off the arrows.
      </p>
      <LinearMapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear transformation">
        <p>
          A function T from <M>{"\\mathbb R^n"}</M> to <M>{"\\mathbb R^m"}</M> is <strong>linear</strong> if
        </p>
        <MD>{"T(c\\mathbf u + d\\mathbf v) = cT(\\mathbf u) + dT(\\mathbf v)"}</MD>
        <p>for all vectors u, v and numbers c, d. In particular T(0) = 0.</p>
      </Definition>

      <Theorem title="every linear map is a matrix">
        <p>
          If T is linear, then T(x) = Ax, where column j of A is <M>{"T(\\mathbf e_j)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbf x = x_1\\mathbf e_1 + \\dots + x_n\\mathbf e_n"}</M>, so by linearity{" "}
          <M>{"T(\\mathbf x) = x_1T(\\mathbf e_1) + \\dots + x_nT(\\mathbf e_n)"}</M>, which is the column picture of Ax.
        </p>
      </Proof>

      <Example title="rotation">
        <p>
          Rotation by θ sends <M>{"\\mathbf e_1"}</M> to <M>{"(\\cos\\theta, \\sin\\theta)"}</M> and{" "}
          <M>{"\\mathbf e_2"}</M> to <M>{"(-\\sin\\theta, \\cos\\theta)"}</M>, so
        </p>
        <MD>{"R_\\theta = \\begin{bmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{bmatrix}."}</MD>
      </Example>

      <Theorem title="composition is multiplication">
        <p>
          Doing S and then T is the linear map T∘S, whose matrix is the product of the matrices, with the first map on the
          right: <M>{"[T \\circ S] = [T][S]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p><M>{"T(S(\\mathbf x)) = B(A\\mathbf x) = (BA)\\mathbf x"}</M>, by associativity.</p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The combined map is <M>{"F\\,H\\,R_{30°}"}</M>, with R the rotation, H = [[1, 1], [0, 1]] the shear and F = [[0, 1], [1,
          0]] the reflection, multiplied right to left in the order they happen. Multiply the three 2 × 2 matrices once and apply
          the result to every pixel.
        </p>
      </Example>

      <Example title="maps that are not linear">
        <p>
          Shifting every point by (1, 0) is not linear, since it moves 0. Squaring each coordinate is not linear, since it does
          not respect sums. Neural networks are built by alternating linear maps with simple non-linear ones, because a stack of
          linear maps alone is just one linear map.
        </p>
      </Example>

      <Remark title="beyond arrows">
        <p>
          Differentiation is linear on polynomials: (p + q)′ = p′ + q′. On polynomials of degree at most 3 with basis 1, x, x²,
          x³, it is a 4 × 4 matrix. Linear algebra applies wherever this rule holds.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "zero",
      rung: "check",
      prompt: <p>Which of these maps from <M>{"\\mathbb R^2"}</M> to <M>{"\\mathbb R^2"}</M> are linear? Select all that apply.</p>,
      answer: { kind: "choice", options: ["(x, y) ↦ (2x, x + y)", "(x, y) ↦ (x + 1, y)", "(x, y) ↦ (y, x)", "(x, y) ↦ (x², y)"], correct: [0, 2] },
    },
    {
      key: "cols",
      rung: "check",
      prompt: <p>Column j of the matrix of a linear map T is:</p>,
      answer: { kind: "choice", options: ["T(eⱼ)", "The j-th output of T(1, …, 1)", "eⱼ", "T applied to row j"], correct: [0] },
    },
    {
      key: "rot",
      rung: "apply",
      prompt: <p>Rotation by 90° anticlockwise sends (3, 1) to which point? Give the first coordinate.</p>,
      answer: { kind: "numeric", value: -1 },
    },
    {
      key: "build",
      rung: "apply",
      prompt: <p>T is linear with T(1, 0) = (2, 1) and T(0, 1) = (−1, 3). Find T(2, 1). Give the second coordinate.</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "compose",
      rung: "apply",
      prompt: (
        <p>
          First apply the shear [[1, 1], [0, 1]], then the reflection [[0, 1], [1, 0]]. Find the matrix of the combined map.
          Give its entry in row 2, column 2.
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
th = np.pi / 2
R = np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]])
H = np.array([[1.0, 1.0], [0.0, 1.0]])
print(np.round(H @ R @ np.array([1.0, 0.0]), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 1.]", "[0. 1.]", "[1. 0.]", "[-1. 1.]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
T = lambda v: np.array([v[0] + v[1], 2 * v[1]])
M = np.column_stack([T(np.array([1, 0])), T(np.array([0, 1]))])
print(M, M @ np.array([3, -1]), T(np.array([3, -1])))`}</Code>
          <p>Building the matrix of a linear map from the images of e₁ and e₂. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[1 1]\n [0 2]] [ 2 -2] [ 2 -2]", "[[1 0]\n [1 2]] [ 3 -2] [ 2 -2]", "[[1 1]\n [0 2]] [ 2 -2] [ 3 -2]", "[[1 2]\n [0 1]] [ 1 -1] [ 2 -2]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>rotation(theta)</C>, the 2 × 2 matrix that rotates by theta radians anticlockwise, built from where it sends
            e₁ and e₂.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rotation(theta):
    return np.eye(2)
`,
        solution: `import numpy as np

def rotation(theta):
    c, s = np.cos(theta), np.sin(theta)
    return np.array([[c, -s], [s, c]])
`,
        tests: [
          { name: "quarter turn", code: `import numpy as np
assert np.allclose(rotation(np.pi / 2) @ [3, 1], [-1, 3]), 'A quarter turn sends (3, 1) to (−1, 3).'` },
          { name: "composition", code: `import numpy as np
assert np.allclose(rotation(0.3) @ rotation(0.5), rotation(0.8)), 'Rotating by 0.3 then 0.5 should equal rotating by 0.8.'` },
          { name: "orthogonal", code: `import numpy as np
R = rotation(1.1)
assert np.allclose(R.T @ R, np.eye(2)) and abs(np.linalg.det(R) - 1) < 1e-12, 'A rotation preserves lengths and has determinant 1.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>matrix_of(T, n)</C>, the m × n matrix of a linear map T on ℝⁿ found by applying it to the standard basis vectors. Then write <C>homogeneous(M, t)</C>, the 3 × 3 matrix in homogeneous coordinates of the affine map x ↦ Mx + t on ℝ², and <C>apply_affine(H, points)</C>, which applies it to an array of points of shape (k, 2).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def matrix_of(T, n):
    return np.eye(n)

def homogeneous(M, t):
    return np.eye(3)

def apply_affine(H, points):
    return np.asarray(points, float)
`,
        solution: `import numpy as np

def matrix_of(T, n):
    return np.column_stack([np.asarray(T(np.eye(n)[i]), float) for i in range(n)])

def homogeneous(M, t):
    H = np.eye(3)
    H[:2, :2] = M
    H[:2, 2] = t
    return H

def apply_affine(H, points):
    P = np.asarray(points, float)
    Ph = np.hstack([P, np.ones((len(P), 1))])
    return (Ph @ H.T)[:, :2]
`,
        tests: [
          { name: "matrix", code: `import numpy as np
T = lambda v: np.array([v[0] + v[1], 2 * v[1], -v[0]])
assert np.allclose(matrix_of(T, 2), [[1, 1], [0, 2], [-1, 0]]), 'The columns are T(e₁) and T(e₂).'` },
          { name: "affine", code: `import numpy as np
H = homogeneous(np.array([[0.0, -1.0], [1.0, 0.0]]), [2.0, 0.0])
assert np.allclose(apply_affine(H, [[1, 0], [0, 1]]), [[2, 1], [1, 0]]), 'Rotate by 90°, then shift by (2, 0).'` },
          { name: "compose", code: `import numpy as np
A = homogeneous(np.diag([2.0, 3.0]), [1.0, -1.0])
B = homogeneous(np.array([[0.0, 1.0], [1.0, 0.0]]), [0.0, 5.0])
P = np.array([[1.0, 2.0], [-3.0, 0.5]])
assert np.allclose(apply_affine(B @ A, P), apply_affine(B, apply_affine(A, P))), 'Composition is matrix multiplication.'` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that rotating by α and then by β is rotating by α + β, by multiplying the rotation matrices. Deduce the addition
          formulas for sine and cosine.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes rotation by α + β is linear and is the composite, so its matrix is R_β R_α.",
          "Multiplies out the first column: (cos β cos α − sin β sin α, sin β cos α + cos β sin α).",
          "Compares with the first column of R_(α+β), (cos(α + β), sin(α + β)), to read off both formulas.",
        ],
      },
    },
    {
      key: "deriv",
      rung: "stretch",
      prompt: (
        <p>
          Write differentiation on polynomials of degree at most 3 as a 4 × 4 matrix in the basis 1, x, x², x³. What is its
          rank?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a map linear, why it is determined by where it sends the basis vectors, and why doing one map after another corresponds to multiplying their matrices.",

  glimpse: (
    <p>
      Next, change of basis: the same linear map written in different coordinates. Linear Algebra II treats linear maps
      between abstract spaces, and Multivariable and Matrix Calculus describes every derivative as the best linear map near a
      point.
    </p>
  ),
};
