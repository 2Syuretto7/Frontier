import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JacobianAreaViz } from "@/components/viz/JacobianAreaViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.2.3",
  minutes: 60,
  links: {
    requires: ["m5.2.2"],
    revisits: ["m3.6.3"],
    foreshadows: ["m5.7.3", "m5.4.4"],
  },

  puzzle: (
    <>
      <p>
        Polar coordinates send a small rectangle of side dr by dθ to a curved patch in the plane. Near the origin the patch is
        tiny; far out it is large, though dr and dθ are the same.
      </p>
      <p>By exactly what factor does the area change, and where does that factor come from?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The derivative of a map from <M>{"\\mathbb R^n"}</M> to <M>{"\\mathbb R^m"}</M> is a linear map, so in coordinates it
        is an m × n matrix: the Jacobian. Its columns say where each input direction goes. Its determinant, when n = m, says how
        much small areas or volumes are scaled.
      </p>
      <JacobianAreaViz />
      <p>
        Move the point and watch the small square's image. The image is nearly a parallelogram, and the ratio of its area to
        the square's matches the absolute value of det J. For polar coordinates that factor is r, which answers the puzzle.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="Jacobian matrix">
        <p>
          For <M>{"f = (f_1, \\dots, f_m) : \\mathbb R^n \\to \\mathbb R^m"}</M> differentiable at a, the Jacobian is the m × n
          matrix
        </p>
        <MD>{"J_f(a) = \\begin{pmatrix} \\partial_1 f_1 & \\cdots & \\partial_n f_1 \\\\ \\vdots & & \\vdots \\\\ \\partial_1 f_m & \\cdots & \\partial_n f_m \\end{pmatrix}(a)."}</MD>
        <p>
          Row i is the gradient of the output <M>{"f_i"}</M>. Column j is the velocity of f as the input moves along{" "}
          <M>{"x_j"}</M>. When m = n, the number <M>{"\\det J_f(a)"}</M> is the Jacobian determinant.
        </p>
      </Definition>

      <Example title="three Jacobians">
        <ul>
          <li>
            Polar: <M>{"(r, \\theta) \\mapsto (r\\cos\\theta, r\\sin\\theta)"}</M> has{" "}
            <M>{"J = \\begin{pmatrix} \\cos\\theta & -r\\sin\\theta \\\\ \\sin\\theta & r\\cos\\theta \\end{pmatrix}"}</M> and{" "}
            <M>{"\\det J = r"}</M>.
          </li>
          <li>
            Elementwise maps, such as <M>{"\\tanh"}</M> applied to each coordinate, have diagonal Jacobians:{" "}
            <M>{"J = \\mathrm{diag}(1 - \\tanh^2 x_i)"}</M>, because output i depends only on input i.
          </li>
          <li>
            Softmax, <M>{"p_i = e^{z_i} / \\sum_k e^{z_k}"}</M>, has{" "}
            <M>{"\\partial p_i / \\partial z_j = p_i(\\delta_{ij} - p_j)"}</M>, that is{" "}
            <M>{"J = \\mathrm{diag}(p) - p p^\\top"}</M>. Every output depends on every input.
          </li>
        </ul>
      </Example>

      <Theorem title="the determinant measures local change of volume">
        <p>
          If f is continuously differentiable near a with m = n, then a small cube Q of volume <M>{"\\mathrm{vol}(Q)"}</M> around
          a satisfies
        </p>
        <MD>{"\\frac{\\mathrm{vol}\\, f(Q)}{\\mathrm{vol}\\, Q} \\to |\\det J_f(a)| \\quad \\text{as } Q \\text{ shrinks to } a."}</MD>
      </Theorem>
      <Proof>
        <p>
          (Sketch.) Near a, <M>{"f(a + h) = f(a) + J h + o(\\|h\\|)"}</M>. The linear part sends the cube to a parallelepiped of
          volume <M>{"|\\det J| \\, \\mathrm{vol}(Q)"}</M>, as in linear algebra. The remainder moves each point by a distance
          that is small compared with the cube's side, so it changes the volume by a fraction that tends to 0. The full proof is
          in the change-of-variables lesson.
        </p>
      </Proof>

      <Remark title="shape is information">
        <p>
          A Jacobian of a map <M>{"\\mathbb R^{1000} \\to \\mathbb R^{10}"}</M> has ten thousand entries, and a layer of a
          network may have millions. Much of practical differentiation is about never building these matrices in full, only
          multiplying by them. Diagonal Jacobians (elementwise maps) and structured ones like softmax are the common cases.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>What is the shape of the Jacobian of a map from <M>{"\\mathbb R^3"}</M> to <M>{"\\mathbb R^2"}</M>?</p>,
      answer: { kind: "choice", options: ["2 × 3", "3 × 2", "3 × 3", "2 × 2"], correct: [0] },
    },
    {
      key: "polar",
      rung: "check",
      prompt: <p>What is the Jacobian determinant of the polar map at r = 2, θ = π/3?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
    {
      key: "softmax",
      rung: "apply",
      prompt: (
        <p>
          For softmax of <M>{"z = (z_1, z_2)"}</M>, what is <M>{"\\partial p_1 / \\partial z_1"}</M> at z = (0, 0)?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-9 },
    },
    {
      key: "diag",
      rung: "apply",
      prompt: <p>Which statement about the Jacobian of <M>{"x \\mapsto \\tanh(x)"}</M>, applied elementwise to a vector, is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is diagonal, with entries 1 − tanh²(xᵢ)",
          "Every entry equals 1 − tanh²(xᵢ)",
          "It is the identity",
          "It has rank 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
def f(v):
    x, y = v
    return np.array([3 * x + 2 * y, x + y, 3 * y**2])
def jac(f, x, h=1e-6):
    fx = f(x)
    J = np.zeros((len(fx), len(x)))
    for j in range(len(x)):
        e = np.zeros(len(x))
        e[j] = h
        J[:, j] = (f(x + e) - f(x - e)) / (2 * h)
    return J
J = jac(f, np.array([2.0, 1.0]))
print(J.shape, np.round(J, 3).tolist())`}</Code>
          <p>A numerical Jacobian, one column per input. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3, 2) [[3.0, 2.0], [1.0, 1.0], [0.0, 6.0]]",
          "(2, 3) [[3.0, 1.0, 0.0], [2.0, 1.0, 6.0]]",
          "(3, 2) [[3.0, 2.0], [1.0, 1.0], [0.0, 3.0]]",
          "(3, 2) [[3.0, 1.0], [2.0, 1.0], [6.0, 0.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
z = np.zeros(4)
p = np.exp(z) / np.exp(z).sum()
J = np.diag(p) - np.outer(p, p)
print(J[0, 0], J[0, 1], J.sum(axis=1))`}</Code>
          <p>The softmax Jacobian at the origin. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1875 -0.0625 [0. 0. 0. 0.]",
          "0.25 0.0 [0.25 0.25 0.25 0.25]",
          "0.1875 -0.0625 [1. 1. 1. 1.]",
          "0.0625 -0.0625 [0. 0. 0. 0.]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jacobian(f, x, h=1e-6)</C>, which returns the m × n Jacobian of f at x by central differences (f maps 1-D
          arrays of length n to 1-D arrays of length m), and <C>softmax_jacobian(z)</C>, which returns the exact Jacobian of
          softmax at z, <M>{"\\mathrm{diag}(p) - p p^\\top"}</M>. Subtract the maximum of z before exponentiating.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def jacobian(f, x, h=1e-6):
    return np.zeros((1, len(x)))

def softmax_jacobian(z):
    return np.eye(len(z))
`,
        solution: `import numpy as np

def jacobian(f, x, h=1e-6):
    x = np.asarray(x, float)
    cols = []
    for j in range(len(x)):
        e = np.zeros(len(x))
        e[j] = h
        cols.append((np.asarray(f(x + e), float) - np.asarray(f(x - e), float)) / (2 * h))
    return np.array(cols).T

def softmax_jacobian(z):
    z = np.asarray(z, float)
    e = np.exp(z - z.max())
    p = e / e.sum()
    return np.diag(p) - np.outer(p, p)
`,
        tests: [
          { name: "numeric Jacobian", code: `import numpy as np
f = lambda v: np.array([v[0] * v[1], v[0] ** 2, np.sin(v[1])])
J = jacobian(f, [2.0, 0.0])
assert J.shape == (3, 2), 'Rows are outputs, columns are inputs: shape (m, n).'
assert np.allclose(J, [[0, 2], [4, 0], [0, 1]], atol=1e-6), J` },
          { name: "softmax", code: `import numpy as np
z = np.array([1.0, -0.5, 2.0])
S = softmax_jacobian(z)
sm = lambda v: np.exp(v - v.max()) / np.exp(v - v.max()).sum()
assert np.allclose(S, jacobian(sm, z), atol=1e-6)
assert np.allclose(S.sum(axis=0), 0) and np.allclose(S, S.T)
B = softmax_jacobian([1000.0, 1000.0])
assert np.allclose(B, [[0.25, -0.25], [-0.25, 0.25]]), 'Subtract the maximum to avoid overflow.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>area_ratio(f, a, r, n=50)</C> for <M>{"f : \\mathbb R^2 \\to \\mathbb R^2"}</M>. Walk anticlockwise round the
          boundary of the square of half-side r centred at a, with n points per side; map each point by f; return the area of
          the image polygon, by the shoelace formula <M>{"\\tfrac12 |\\sum_k (x_k y_{k+1} - x_{k+1} y_k)|"}</M>, divided by{" "}
          <M>{"(2r)^2"}</M>. For small r this should approach <M>{"|\\det J_f(a)|"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def area_ratio(f, a, r, n=50):
    return 1.0
`,
        solution: `import numpy as np

def area_ratio(f, a, r, n=50):
    ax, ay = a
    s = np.linspace(-r, r, n, endpoint=False)
    pts = []
    for t in s:
        pts.append((ax + t, ay - r))
    for t in s:
        pts.append((ax + r, ay + t))
    for t in s:
        pts.append((ax - t, ay + r))
    for t in s:
        pts.append((ax - r, ay - t))
    img = np.array([f(np.array(p)) for p in pts], float)
    x, y = img[:, 0], img[:, 1]
    area = 0.5 * abs(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y))
    return area / (2 * r) ** 2
`,
        tests: [
          { name: "linear map", code: `import numpy as np
A = np.array([[2.0, 1.0], [0.5, 3.0]])
assert abs(area_ratio(lambda v: A @ v, (0.3, -1.0), 0.5) - abs(np.linalg.det(A))) < 1e-9
assert abs(area_ratio(lambda v: v[::-1], (0.0, 0.0), 1.0) - 1.0) < 1e-9, 'A reflection keeps area: use the absolute value.'` },
          { name: "polar map", code: `import numpy as np
pol = lambda v: np.array([v[0] * np.cos(v[1]), v[0] * np.sin(v[1])])
for r0 in [0.5, 2.0, 3.0]:
    assert abs(area_ratio(pol, (r0, 0.7), 1e-3) - r0) < 1e-3, r0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the Jacobian of softmax is <M>{"\\mathrm{diag}(p) - p p^\\top"}</M>, and that each of its rows and columns
          sums to 0. Explain in one sentence why the row sums must be 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates p_i = e^{z_i}/S with S = Σ e^{z_k} by the quotient rule: ∂p_i/∂z_j = (δ_ij e^{z_i} S − e^{z_i} e^{z_j})/S² = p_i(δ_ij − p_j).",
          "Writes this as diag(p) − ppᵀ and notes the matrix is symmetric.",
          "Shows row i sums to p_i − p_i Σ_j p_j = 0 (columns by symmetry).",
          "Explains the meaning: adding the same constant to every z_j leaves p unchanged, so the derivative along (1, …, 1) is 0 (equivalently Σ p_i = 1 is constant, so columns sum to 0).",
        ],
      },
    },
    {
      key: "sphere",
      rung: "stretch",
      prompt: (
        <p>
          Spherical coordinates <M>{"(\\rho, \\varphi, \\theta) \\mapsto (\\rho \\sin\\varphi\\cos\\theta, \\rho\\sin\\varphi\\sin\\theta, \\rho\\cos\\varphi)"}</M>{" "}
          have Jacobian determinant <M>{"\\rho^2 \\sin\\varphi"}</M>. What is it at ρ = 2, φ = π/2?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend what the rows, the columns and the determinant of a Jacobian each tell you, using polar coordinates as the example.",

  glimpse: (
    <p>
      When the output is a single number, the Jacobian is one row, and turned on its side it is the gradient. Next, gradients,
      directional derivatives, and why the gradient points uphill.
    </p>
  ),
};
