import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DetAreaViz } from "@/components/viz/DetAreaViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.6.3",
  minutes: 55,
  links: {
    requires: ["m3.6.1"],
    revisits: ["m3.3.3"],
    foreshadows: ["m5.7.3", "m7.3.4"],
  },

  puzzle: (
    <>
      <p>
        A map sends every point (x, y) of a photo to (2x + y, 0.5x + 1.5y). A face in the photo covered 3 square centimetres.
      </p>
      <p>
        How much area does the face cover after the map? Does the answer depend on where the face was, or on its shape?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A matrix sends the unit square to the parallelogram spanned by its columns. The area of that parallelogram is the
        absolute value of the determinant, and the sign records whether the matrix flips the plane over. Move the entries
        below: when the columns line up the parallelogram goes flat and the determinant is 0; when they cross over, it turns
        negative.
      </p>
      <DetAreaViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="determinant as area and volume">
        <p>
          The parallelogram spanned by the columns of a 2 × 2 matrix A has area |det A|. The box (parallelepiped) spanned by the
          columns of an n × n matrix has n-dimensional volume |det A|.
        </p>
      </Theorem>
      <Proof>
        <p>
          The volume of the box satisfies the three rules of the determinant up to sign: the unit cube has volume 1; stretching
          one edge by t multiplies volume by |t|; and sliding one edge along another (a shear) keeps the base and the height, so
          keeps the volume. Shears and stretches are exactly the column operations that compute the determinant, so the two
          agree.
        </p>
      </Proof>

      <Theorem title="a linear map scales every volume by |det A|">
        <p>
          For any region R with volume vol(R), the image A(R) has volume |det A| · vol(R). Composing maps multiplies the
          factors, which is det(AB) = det A det B in geometric form.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fill R with tiny cubes. Each is mapped to a tiny box of volume |det A| times its own, and adding up gives the result in
          the limit.
        </p>
      </Proof>

      <Definition title="orientation">
        <p>
          The sign of det A says whether A preserves orientation (positive: anticlockwise stays anticlockwise) or reverses it
          (negative: a mirror image). A reflection has determinant −1; a rotation has determinant 1.
        </p>
      </Definition>

      <Example title="the puzzle">
        <p>
          The matrix is [[2, 1], [0.5, 1.5]] with determinant 3 − 0.5 = 2.5. Every region, wherever it is and whatever its shape,
          has its area multiplied by 2.5. The face now covers 7.5 square centimetres.
        </p>
      </Example>

      <Example title="a triangle">
        <p>
          The triangle with corners 0, u and v is half the parallelogram, so its area is{" "}
          <M>{"\\tfrac12|u_1v_2 - u_2v_1|"}</M>. For corners (0, 0), (4, 1), (1, 3) that is <M>{"\\tfrac12|12 - 1| = 5.5"}</M>.
        </p>
      </Example>

      <Remark title="change of variables">
        <p>
          A curved map looks linear on tiny scales, so it scales tiny areas by the determinant of its derivative matrix. That is
          the Jacobian factor in the change-of-variables formula for integrals, and the reason it appears in the density of a
          transformed random variable and in normalising flows.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "area",
      rung: "check",
      prompt: <p>Find the area of the parallelogram spanned by (3, 0) and (1, 2).</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "neg",
      rung: "check",
      prompt: <p>A 2 × 2 matrix has negative determinant. What does that say about the map?</p>,
      answer: {
        kind: "choice",
        options: ["It reverses orientation, like a mirror", "It shrinks every area", "It has no inverse", "It is a rotation"],
        correct: [0],
      },
    },
    {
      key: "vol",
      rung: "apply",
      prompt: <p>Find the volume of the box spanned by (1, 0, 0), (1, 2, 0) and (1, 1, 3).</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "tri",
      rung: "apply",
      prompt: <p>Find the area of the triangle with corners (1, 1), (5, 2) and (2, 4).</p>,
      answer: { kind: "numeric", value: 5.5 },
    },
    {
      key: "compose",
      rung: "apply",
      prompt: <p>A has determinant 3 and B has determinant −2. A region of area 2 is mapped by B and then by A. What is the area of the result?</p>,
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0], [0.5, 1.5]])
square = np.array([[0, 1, 1, 0], [0, 0, 1, 1]])
image = A @ square
x, y = image
area = 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))
print(area)`}</Code>
          <p>The last two lines compute the area of a polygon (the shoelace formula). What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2.5 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
u, v, w = np.array([1.0, 0, 0]), np.array([1.0, 2, 0]), np.array([0.0, 1, 3])
print(abs(np.linalg.det(np.array([u, v, w]))), np.cross(u, v) @ w)`}</Code>
          <p>The volume of the box spanned by three vectors, two ways. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6.0 6.0", "6.0 -6.0", "3.0 6.0", "6.0 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>area(points)</C>, which returns the area of a polygon from its corners in order, by the shoelace formula:
            half the absolute value of the sum of xᵢyᵢ₊₁ − xᵢ₊₁yᵢ, wrapping round at the end.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def area(points):
    return 0.0
`,
        solution: `import numpy as np

def area(points):
    P = np.asarray(points, float)
    x, y = P[:, 0], P[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))
`,
        tests: [
          { name: "square", code: `assert abs(area([(0, 0), (1, 0), (1, 1), (0, 1)]) - 1) < 1e-12, 'The unit square has area 1.'` },
          { name: "triangle", code: `assert abs(area([(0, 0), (4, 1), (1, 3)]) - 5.5) < 1e-12, 'The lesson’s triangle has area 5.5.'` },
          { name: "scaled by det", code: `import numpy as np
A = np.array([[2, 1], [0.5, 1.5]])
sq = np.array([(0, 0), (1, 0), (1, 1), (0, 1)])
assert abs(area(sq @ A.T) - 2.5) < 1e-12, 'The image of the unit square has area |det A| = 2.5.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>simplex_volume(points)</C>, the volume of the simplex with n + 1 vertices in ℝⁿ (a triangle in ℝ², a tetrahedron in ℝ³, …) as |det[p₁ − p₀, …, pₙ − p₀]|/n!, and <C>gram_volume(vectors)</C>, the k-dimensional volume of the parallelotope spanned by k vectors in ℝⁿ (k ≤ n) as √det(VᵀV), which works for a parallelogram in ℝ³. Then write <C>monte_carlo_volume(points, samples, seed)</C>, which estimates the simplex volume in ℝ³ by sampling the bounding box with a seeded <C>np.random.default_rng</C> and testing membership through barycentric coordinates.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def simplex_volume(points):
    return 0.0

def gram_volume(vectors):
    return 0.0

def monte_carlo_volume(points, samples, seed):
    return 0.0
`,
        solution: `import numpy as np

import math

def simplex_volume(points):
    P = np.asarray(points, float)
    n = P.shape[1]
    return float(abs(np.linalg.det(P[1:] - P[0])) / math.factorial(n))

def gram_volume(vectors):
    V = np.asarray(vectors, float).T
    return float(np.sqrt(max(np.linalg.det(V.T @ V), 0.0)))

def monte_carlo_volume(points, samples, seed):
    P = np.asarray(points, float)
    lo, hi = P.min(0), P.max(0)
    rng = np.random.default_rng(seed)
    X = lo + (hi - lo) * rng.random((samples, P.shape[1]))
    T = (P[1:] - P[0]).T
    lam = np.linalg.solve(T, (X - P[0]).T).T
    inside = (lam >= 0).all(1) & (lam.sum(1) <= 1)
    return float(np.prod(hi - lo) * inside.mean())
`,
        tests: [
          { name: "triangle", code: `assert abs(simplex_volume([[0, 0], [4, 0], [0, 3]]) - 6) < 1e-12 and abs(simplex_volume([[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]]) - 1 / 6) < 1e-12, 'Triangle area 6, unit tetrahedron 1/6.'` },
          { name: "degenerate", code: `assert simplex_volume([[0, 0, 0], [1, 1, 1], [2, 2, 2], [0, 1, 0]]) < 1e-12, 'Coplanar points enclose nothing.'` },
          { name: "gram", code: `assert abs(gram_volume([[1, 0, 0], [0, 2, 0]]) - 2) < 1e-12 and abs(gram_volume([[1, 1, 0], [1, -1, 0]]) - 2) < 1e-12 and abs(gram_volume([[3, 4, 0]]) - 5) < 1e-12, 'A parallelogram in ℝ³ has area √det(VᵀV).'` },
          { name: "monte carlo", code: `pts = [[0, 0, 0], [2, 0, 0], [0, 3, 0], [0, 0, 1]]
v = monte_carlo_volume(pts, 200000, 0)
assert abs(v - simplex_volume(pts)) < 0.02 and v == monte_carlo_volume(pts, 200000, 0), 'Estimate 1 by sampling the box.'` },
        ],
      },
    },
    {
      key: "orth",
      rung: "prove",
      prompt: (
        <p>
          Prove that an orthogonal matrix Q has det Q = ±1, so it preserves volume. Then explain why a matrix whose determinant
          is ±1 need not be orthogonal.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes determinants of QᵀQ = I to get det(Qᵀ) det Q = (det Q)² = 1.",
          "Concludes det Q = ±1 and volumes are preserved.",
          "Gives a counterexample such as the shear [[1, 1], [0, 1]], which has determinant 1 but changes lengths and angles.",
        ],
      },
    },
    {
      key: "polar",
      rung: "stretch",
      prompt: (
        <p>
          The map (r, θ) ↦ (r cos θ, r sin θ) has derivative matrix with rows (cos θ, −r sin θ) and (sin θ, r cos θ). Find its
          determinant at r = 2, θ = 1.
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend why the determinant is the area or volume of the box spanned by the columns, why a linear map scales every region by the same factor, and what a negative determinant means.",

  glimpse: (
    <p>
      Next chapter: eigenvalues, the special directions a matrix only stretches, which are found by solving det(A − λI) = 0.
      Multivariable and Matrix Calculus uses the Jacobian determinant to change variables in integrals, and Probability uses it
      to transform densities.
    </p>
  ),
};
