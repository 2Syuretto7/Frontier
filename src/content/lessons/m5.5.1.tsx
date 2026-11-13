import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TaylorSliceViz } from "@/components/viz/TaylorSliceViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.5.1",
  minutes: 55,
  links: {
    requires: ["m5.2.4", "m5.2.5"],
    revisits: ["m2.8.5", "m2.9.2"],
    foreshadows: ["m5.5.2", "m5.5.3"],
  },

  puzzle: (
    <>
      <p>
        In one variable, <M>{"f(a + h) \\approx f(a) + f'(a)h + \\tfrac12 f''(a)h^2"}</M>. A function of many variables can be
        approached from infinitely many directions, each with its own curvature.
      </p>
      <p>Does that need infinitely many second derivatives, or does a finite table of numbers capture them all?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Restrict f to a line through a and you get a function of one variable, g(t) = f(a + tu), which has an ordinary
        Taylor expansion. The chain rule says its slope is <M>{"\\nabla f \\cdot u"}</M> and its curvature is{" "}
        <M>{"u^\\top H u"}</M>, where H is the matrix of second partial derivatives. One matrix serves every direction.
      </p>
      <TaylorSliceViz />
      <p>
        The first-order approximation is the tangent plane; the second-order one is the best-fitting quadratic bowl or
        saddle. Its error shrinks like the cube of the step.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="Hessian">
        <p>
          For f : <M>{"\\mathbb R^n \\to \\mathbb R"}</M> with continuous second partial derivatives (f is <M>{"C^2"}</M>), the
          Hessian at a is the n × n matrix <M>{"H_f(a)_{ij} = \\partial_i \\partial_j f(a)"}</M>. It is the Jacobian of the
          gradient, and by Clairaut&rsquo;s theorem it is symmetric.
        </p>
      </Definition>

      <Theorem title="Taylor's theorem to second order">
        <p>If f is <M>{"C^2"}</M> near a, then</p>
        <MD>{"f(a + h) = f(a) + \\nabla f(a)^\\top h + \\tfrac12 h^\\top H_f(a) h + o(\\|h\\|^2)."}</MD>
        <p>
          More precisely, for each h there is s ∈ (0, 1) with{" "}
          <M>{"f(a + h) = f(a) + \\nabla f(a)^\\top h + \\tfrac12 h^\\top H_f(a + sh) h"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let g(t) = f(a + th). By the chain rule, <M>{"g'(t) = \\nabla f(a + th)^\\top h = \\sum_i \\partial_i f(a + th) h_i"}</M>
          . Differentiate again, applying the chain rule to each <M>{"\\partial_i f"}</M>:{" "}
          <M>{"g''(t) = \\sum_{i,j} \\partial_j\\partial_i f(a + th) h_i h_j = h^\\top H_f(a + th) h"}</M>. One-variable Taylor
          with the Lagrange remainder gives <M>{"g(1) = g(0) + g'(0) + \\tfrac12 g''(s)"}</M> for some s ∈ (0, 1), which is
          the second statement. For the first, <M>{"|h^\\top (H(a + sh) - H(a)) h| \\le \\|H(a + sh) - H(a)\\| \\|h\\|^2"}</M>,
          and the norm tends to 0 by continuity of the second partials.
        </p>
      </Proof>

      <Example title="a worked expansion">
        <p>
          For <M>{"f(x, y) = e^x \\cos y"}</M> at 0: f = 1, <M>{"\\nabla f = (1, 0)"}</M>,{" "}
          <M>{"H = \\mathrm{diag}(1, -1)"}</M>. So <M>{"f(x, y) \\approx 1 + x + \\tfrac12(x^2 - y^2)"}</M>: curving up along x,
          down along y.
        </p>
      </Example>

      <Remark title="why second order is the workhorse">
        <p>
          A quadratic model is the simplest one that can have a minimum. Newton&rsquo;s method minimises it at each step,
          trust-region methods trust it within a ball, and analyses of learning rates and sharpness are statements about H. Third
          derivatives are tensors with <M>{"n^3"}</M> entries and are almost never used directly.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "err",
      rung: "check",
      prompt: <p>For a <M>{"C^2"}</M> function, how fast does the error of the first-order (tangent-plane) approximation shrink?</p>,
      answer: { kind: "choice", options: ["Like ‖h‖²", "Like ‖h‖", "Like ‖h‖³", "It need not shrink"], correct: [0] },
    },
    {
      key: "count",
      rung: "check",
      prompt: <p>How many distinct second partial derivatives does a <M>{"C^2"}</M> function of 3 variables have, using symmetry?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "approx",
      rung: "apply",
      prompt: (
        <p>
          Use the second-order expansion <M>{"1 + x + \\tfrac12(x^2 - y^2)"}</M> of <M>{"e^x \\cos y"}</M> to estimate f(0.1,
          0.2).
        </p>
      ),
      answer: { kind: "numeric", value: 1.085, tolerance: 1e-9 },
    },
    {
      key: "exact",
      rung: "apply",
      prompt: <p>For which functions is the second-order Taylor expansion exact everywhere?</p>,
      answer: {
        kind: "choice",
        options: ["Polynomials of degree at most 2", "Every C² function", "Linear functions only", "Functions with zero gradient"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda v: np.sin(v[0]) * np.exp(v[1])
a = np.array([0.5, 0.2])
g = np.array([np.cos(0.5), np.sin(0.5)]) * np.exp(0.2)
H = np.array([[-np.sin(0.5), np.cos(0.5)], [np.cos(0.5), np.sin(0.5)]]) * np.exp(0.2)
u = np.array([0.6, 0.8])
def errs(t):
    h = t * u
    e1 = abs(f(a + h) - f(a) - g @ h)
    return e1, abs(f(a + h) - f(a) - g @ h - 0.5 * h @ H @ h)
(a1, a2), (b1, b2) = errs(0.02), errs(0.01)
print(round(a1 / b1), round(a2 / b2))`}</Code>
          <p>How the two Taylor errors shrink when the step is halved. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 8", "2 4", "8 16", "4 4"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda v: v[0] ** 2 + 3 * v[0] * v[1] - v[1] ** 2
x, h = np.array([1.0, 2.0]), 1e-3
E = np.eye(2) * h
H = np.array([[(f(x + E[i] + E[j]) - f(x + E[i] - E[j]) - f(x - E[i] + E[j]) + f(x - E[i] - E[j])) / (4 * h * h)
               for j in range(2)] for i in range(2)])
print(np.round(H, 6))`}</Code>
          <p>A finite-difference Hessian of a quadratic. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[[ 2.  3.]\n [ 3. -2.]]", "[[ 2.  6.]\n [ 6. -2.]]", "[[1.  1.5]\n [1.5 -1. ]]", "[[ 2.  3.]\n [ 0. -2.]]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>num_hessian(f, x, h=1e-4)</C>, the Hessian by the central formula{" "}
          <M>{"[f(x + he_i + he_j) - f(x + he_i - he_j) - f(x - he_i + he_j) + f(x - he_i - he_j)]/(4h^2)"}</M>, and{" "}
          <C>taylor2(f, grad, x, dx)</C>, the second-order approximation of f(x + dx), where grad is a function returning the
          gradient and the Hessian comes from <C>num_hessian</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def num_hessian(f, x, h=1e-4):
    return np.zeros((len(x), len(x)))

def taylor2(f, grad, x, dx):
    return f(x)
`,
        solution: `import numpy as np

def num_hessian(f, x, h=1e-4):
    x = np.asarray(x, float)
    n = len(x)
    E = np.eye(n) * h
    H = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            H[i, j] = (f(x + E[i] + E[j]) - f(x + E[i] - E[j]) - f(x - E[i] + E[j]) + f(x - E[i] - E[j])) / (4 * h * h)
    return H

def taylor2(f, grad, x, dx):
    x, dx = np.asarray(x, float), np.asarray(dx, float)
    return f(x) + np.asarray(grad(x)) @ dx + 0.5 * dx @ num_hessian(f, x) @ dx
`,
        tests: [
          { name: "Hessian", code: `import numpy as np
f = lambda v: np.exp(v[0]) * np.cos(v[1])
H = num_hessian(f, [0.0, 0.0])
assert H.shape == (2, 2) and np.allclose(H, [[1, 0], [0, -1]], atol=1e-5)
g = lambda v: v[0] * v[1] * v[2]
assert np.allclose(num_hessian(g, [1.0, 2.0, 3.0]), [[0, 3, 2], [3, 0, 1], [2, 1, 0]], atol=1e-5)` },
          { name: "Taylor", code: `import numpy as np
f = lambda v: np.exp(v[0]) * np.cos(v[1])
gr = lambda v: np.array([np.exp(v[0]) * np.cos(v[1]), -np.exp(v[0]) * np.sin(v[1])])
assert abs(taylor2(f, gr, [0.0, 0.0], [0.1, 0.2]) - 1.085) < 1e-6
q = lambda v: v[0] ** 2 - v[0] * v[1]
qg = lambda v: np.array([2 * v[0] - v[1], -v[0]])
assert abs(taylor2(q, qg, [1.0, 1.0], [2.0, -3.0]) - q(np.array([3.0, -2.0]))) < 1e-5, 'Exact for quadratics.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>error_exponent(f, g, H, a, d, order, t=0.1)</C>. With e(s) the error of the Taylor polynomial of the given
          order (1 or 2) at a + s·d, using gradient g and Hessian H at a, return <M>{"\\log_2(e(t)/e(t/2))"}</M>, an estimate
          of p in <M>{"e(s) \\approx C s^p"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def error_exponent(f, g, H, a, d, order, t=0.1):
    return 0.0
`,
        solution: `import numpy as np

def error_exponent(f, g, H, a, d, order, t=0.1):
    a, d = np.asarray(a, float), np.asarray(d, float)
    g, H = np.asarray(g, float), np.asarray(H, float)
    def err(s):
        h = s * d
        p = f(a) + g @ h
        if order == 2:
            p = p + 0.5 * h @ H @ h
        return abs(f(a + h) - p)
    return float(np.log2(err(t) / err(t / 2)))
`,
        tests: [
          { name: "orders 1 and 2", code: `import numpy as np
f = lambda v: np.sin(v[0]) * np.exp(v[1])
a = np.array([0.5, 0.2])
g = np.array([np.cos(0.5), np.sin(0.5)]) * np.exp(0.2)
H = np.array([[-np.sin(0.5), np.cos(0.5)], [np.cos(0.5), np.sin(0.5)]]) * np.exp(0.2)
d = np.array([0.6, 0.8])
assert abs(error_exponent(f, g, H, a, d, 1, 0.01) - 2) < 0.05
assert abs(error_exponent(f, g, H, a, d, 2, 0.01) - 3) < 0.05` },
          { name: "a quadratic", code: `import numpy as np
q = lambda v: v[0] ** 2 + v[0] * v[1]
p = error_exponent(q, [2.0, 1.0], [[2.0, 1.0], [1.0, 0.0]], [1.0, 0.0], [1.0, 1.0], 1)
assert abs(p - 2) < 1e-9, 'For a quadratic the first-order error is exactly C s^2.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For <M>{"C^2"}</M> f and g(t) = f(a + th), prove that <M>{"g''(t) = h^\\top H_f(a + th) h"}</M>, and deduce that{" "}
          <M>{"f(a + h) = f(a) + \\nabla f(a)^\\top h + \\tfrac12 h^\\top H_f(a + sh)h"}</M> for some s in (0, 1).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes g′(t) = Σ_i ∂_i f(a + th) h_i by the chain rule.",
          "Differentiates again, applying the chain rule to each ∂_i f(a + th), to get Σ_{i,j} ∂_j ∂_i f(a + th) h_i h_j = hᵀ H h.",
          "Applies one-variable Taylor with Lagrange remainder: g(1) = g(0) + g′(0) + ½ g″(s).",
          "Substitutes g(0), g′(0), g″(s) to obtain the stated formula.",
        ],
      },
    },
    {
      key: "x2y",
      rung: "stretch",
      prompt: (
        <p>
          Use the second-order Taylor expansion of <M>{"f(x, y) = x^2 y"}</M> at (1, 1) to estimate f(1.1, 1.1).
        </p>
      ),
      answer: { kind: "numeric", value: 1.33, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend how restricting a function to a line turns multivariable Taylor expansion into the one-variable version, and why one Hessian matrix gives the curvature in every direction.",

  glimpse: (
    <p>
      Next, the Hessian itself: what its eigenvalues and eigenvectors say about the shape of a function, and how to compute it.
    </p>
  ),
};
