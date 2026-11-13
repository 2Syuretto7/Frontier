import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LocalInverseViz } from "@/components/viz/LocalInverseViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.6.1",
  minutes: 60,
  links: {
    requires: ["m5.2.3", "m5.2.5"],
    revisits: ["m3.3.3", "m2.4.5", "m2.5.4"],
    foreshadows: ["m5.6.2", "m5.7.3"],
  },

  puzzle: (
    <>
      <p>
        A map from the plane to itself has an invertible derivative at a point: near that point it behaves like an invertible
        linear map. Does that make the map itself invertible near the point?
      </p>
      <p>And if so, how would you compute the inverse, when there is no formula for it?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Near a, f is its linear approximation plus a small error. An invertible linear map can be undone, and a small error
        cannot destroy that, provided the derivative stays close to <M>{"Df(a)"}</M> nearby. So f is one-to-one near a and has a
        smooth inverse there, whose derivative is the inverse matrix.
      </p>
      <LocalInverseViz />
      <p>
        The inverse is only local: <M>{"z \\mapsto z^2"}</M> sends a and −a to the same point, so it has no global inverse,
        yet near any a ≠ 0 it can be undone. Where det J = 0, it folds.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="inverse function theorem">
        <p>
          Let <M>{"f : \\mathbb R^n \\to \\mathbb R^n"}</M> be <M>{"C^1"}</M> near a with <M>{"\\det J_f(a) \\ne 0"}</M>. Then
          there are open sets U ∋ a and V ∋ f(a) such that f maps U one-to-one onto V, the inverse{" "}
          <M>{"f^{-1} : V \\to U"}</M> is <M>{"C^1"}</M>, and
        </p>
        <MD>{"J_{f^{-1}}(f(x)) = J_f(x)^{-1} \\quad \\text{for } x \\in U."}</MD>
      </Theorem>
      <Proof>
        <p>
          (Sketch.) Let <M>{"L = J_f(a)"}</M>. To solve f(x) = y for y near f(a), iterate{" "}
          <M>{"T_y(x) = x + L^{-1}(y - f(x))"}</M>. Its fixed points are exactly the solutions. Its derivative,{" "}
          <M>{"I - L^{-1} J_f(x)"}</M>, is 0 at a and, by continuity of <M>{"J_f"}</M>, has norm at most ½ on a small ball
          around a. So <M>{"T_y"}</M> is a contraction there, and by the contraction mapping theorem it has exactly one fixed
          point in the ball (for y close enough to f(a) that T_y maps the ball into itself). That gives a unique local inverse.
          Differentiability of the inverse follows from the estimate{" "}
          <M>{"\\|x - x'\\| \\le 2\\|L^{-1}\\|\\, \\|f(x) - f(x')\\|"}</M>, and the derivative formula from the chain rule
          applied to <M>{"f^{-1}(f(x)) = x"}</M>.
        </p>
      </Proof>

      <Example title="polar coordinates">
        <p>
          The polar map <M>{"(r, \\theta) \\mapsto (r\\cos\\theta, r\\sin\\theta)"}</M> has det J = r. So it is locally
          invertible wherever r ≠ 0, and the Jacobian of the inverse at (x, y) is the inverse matrix, with determinant 1/r. It is
          not globally one-to-one, because θ and θ + 2π give the same point.
        </p>
      </Example>

      <Remark title="computing inverses: Newton's method">
        <p>
          The proof iterates with the fixed matrix L. Updating it each step,{" "}
          <M>{"x \\leftarrow x + J_f(x)^{-1}(y - f(x))"}</M>, is Newton&rsquo;s method, which converges much faster near the
          solution. Invertible networks used in normalising flows rely on exactly this: they are built so that det J never
          vanishes, and inverted numerically when no formula exists.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hyp",
      rung: "check",
      prompt: <p>Which hypothesis does the inverse function theorem need at the point a?</p>,
      answer: {
        kind: "choice",
        options: ["det J_f(a) ≠ 0, with f continuously differentiable", "f is one-to-one everywhere", "J_f(a) = I", "f is linear"],
        correct: [0],
      },
    },
    {
      key: "one",
      rung: "check",
      prompt: <p>For <M>{"f(x) = x^3 + x"}</M>, f(1) = 2. What is <M>{"(f^{-1})'(2)"}</M>?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-12 },
    },
    {
      key: "det",
      rung: "apply",
      prompt: <p>For <M>{"f(x, y) = (x^2 - y^2, 2xy)"}</M>, what is det J at (1, 1)?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "polar",
      rung: "apply",
      prompt: <p>What is the determinant of the Jacobian of the inverse of the polar map, at a point with r = 2?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 1e-12 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda v: np.array([v[0] ** 2 - v[1] ** 2, 2 * v[0] * v[1]])
J = lambda v: np.array([[2 * v[0], -2 * v[1]], [2 * v[1], 2 * v[0]]])
y = np.array([3.0, 4.0])
x = np.array([1.0, 1.0])
for _ in range(8):
    x = x + np.linalg.solve(J(x), y - f(x))
print(np.round(x, 6), np.round(f(x), 6))`}</Code>
          <p>Newton&rsquo;s method inverting <M>{"z \\mapsto z^2"}</M> at (3, 4). What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2. 1.] [3. 4.]", "[1. 2.] [3. 4.]", "[-2. -1.] [3. 4.]", "[1.5 2. ] [3. 4.]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda v: np.array([v[0] ** 2 - v[1] ** 2, 2 * v[0] * v[1]])
detJ = lambda v: 4 * (v[0] ** 2 + v[1] ** 2)
a = np.array([1.0, 0.5])
print(f(a), f(-a), detJ(a), detJ(np.zeros(2)))`}</Code>
          <p>Local but not global invertibility. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.75 1.  ] [0.75 1.  ] 5.0 0.0", "[0.75 1.  ] [-0.75 -1.  ] 5.0 0.0", "[0.75 1.  ] [0.75 1.  ] 5.0 4.0", "[1.25 1.  ] [1.25 1.  ] 5.0 0.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>newton_inverse(f, J, y, x0, steps=30)</C>, which solves f(x) = y by Newton&rsquo;s method from x0 using linear
          solves, and <C>inverse_jacobian(J, x)</C>, the Jacobian of <M>{"f^{-1}"}</M> at the point f(x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def newton_inverse(f, J, y, x0, steps=30):
    return np.asarray(x0, float)

def inverse_jacobian(J, x):
    return J(x)
`,
        solution: `import numpy as np

def newton_inverse(f, J, y, x0, steps=30):
    x, y = np.asarray(x0, float), np.asarray(y, float)
    for _ in range(steps):
        x = x + np.linalg.solve(J(x), y - f(x))
    return x

def inverse_jacobian(J, x):
    return np.linalg.inv(J(np.asarray(x, float)))
`,
        tests: [
          { name: "inverting", code: `import numpy as np
f = lambda v: np.array([v[0] + v[1] ** 3, v[1] + np.sin(v[0])])
J = lambda v: np.array([[1.0, 3 * v[1] ** 2], [np.cos(v[0]), 1.0]])
x = newton_inverse(f, J, [1.0, 0.5], [0.0, 0.0])
assert np.allclose(f(x), [1.0, 0.5], atol=1e-12)` },
          { name: "derivative of the inverse", code: `import numpy as np
f = lambda v: np.array([v[0] + v[1] ** 3, v[1] + np.sin(v[0])])
J = lambda v: np.array([[1.0, 3 * v[1] ** 2], [np.cos(v[0]), 1.0]])
x = np.array([0.3, 0.4])
y = f(x)
num = np.array([(newton_inverse(f, J, y + 1e-6 * e, x) - newton_inverse(f, J, y - 1e-6 * e, x)) / 2e-6 for e in np.eye(2)]).T
assert np.allclose(inverse_jacobian(J, x), num, atol=1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          The proof&rsquo;s iteration. Write <C>contraction_inverse(f, L, y, x0, iters)</C>, which runs{" "}
          <M>{"x \\leftarrow x + L^{-1}(y - f(x))"}</M> with the fixed matrix L (use a linear solve) and returns the pair (final x,
          list of step lengths <M>{"\\|x_{k+1} - x_k\\|"}</M>).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def contraction_inverse(f, L, y, x0, iters):
    return np.asarray(x0, float), []
`,
        solution: `import numpy as np

def contraction_inverse(f, L, y, x0, iters):
    x, y, L = np.asarray(x0, float), np.asarray(y, float), np.asarray(L, float)
    steps = []
    for _ in range(iters):
        new = x + np.linalg.solve(L, y - f(x))
        steps.append(float(np.linalg.norm(new - x)))
        x = new
    return x, steps
`,
        tests: [
          { name: "converges geometrically", code: `import numpy as np
f = lambda v: np.array([v[0] + 0.1 * v[1] ** 2, v[1] + 0.1 * np.sin(v[0])])
a = np.zeros(2)
L = np.eye(2)
x, s = contraction_inverse(f, L, [0.2, -0.1], a, 25)
assert np.allclose(f(x), [0.2, -0.1], atol=1e-10)
assert len(s) == 25 and all(s[k + 1] <= 0.5 * s[k] + 1e-15 for k in range(10)), 'Each step at most half the previous.'` },
          { name: "z squared near (2, 1)", code: `import numpy as np
f = lambda v: np.array([v[0] ** 2 - v[1] ** 2, 2 * v[0] * v[1]])
L = np.array([[4.0, -2.0], [2.0, 4.0]])
x, s = contraction_inverse(f, L, [3.1, 4.2], [2.0, 1.0], 40)
assert np.allclose(f(x), [3.1, 4.2], atol=1e-10) and s[-1] < s[0]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Assuming f has a differentiable local inverse g near f(a), prove that{" "}
          <M>{"J_g(f(a)) = J_f(a)^{-1}"}</M>, and explain why this forces <M>{"\\det J_f(a) \\ne 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates g(f(x)) = x at x = a by the chain rule: J_g(f(a)) J_f(a) = I.",
          "Concludes J_f(a) is invertible with inverse J_g(f(a)) (also using f(g(y)) = y, or that a one-sided inverse of a square matrix is two-sided).",
          "Notes an invertible matrix has non-zero determinant, so a differentiable inverse is impossible where det J_f = 0.",
        ],
      },
    },
    {
      key: "pre",
      rung: "stretch",
      prompt: <p>How many points (x, y) satisfy <M>{"(x^2 - y^2, 2xy) = (1, 0)"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend what the inverse function theorem says, why an invertible derivative makes a map locally invertible, and why the inverse can still fail to exist globally.",

  glimpse: (
    <p>
      The same idea, applied to an equation F(x, y) = 0, shows when it defines y as a function of x, and gives that
      function&rsquo;s derivative without solving for it. Next, the implicit function theorem.
    </p>
  ),
};
