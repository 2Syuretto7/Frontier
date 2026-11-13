import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PartialSliceViz } from "@/components/viz/PartialSliceViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.2.1",
  minutes: 55,
  links: {
    requires: ["m5.1.2", "m2.4.2"],
    revisits: ["m2.4.1"],
    foreshadows: ["m5.2.2", "m5.5.2"],
  },

  puzzle: (
    <>
      <p>
        A model has a million weights. To decide which way to nudge them, you would like to know, for each weight on its own,
        how much the loss changes if that weight alone moves a little and every other weight stays put.
      </p>
      <p>That is a derivative in one variable at a time. Is it enough to describe how the loss changes?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Freeze all coordinates but one, and a function of many variables becomes an ordinary function of one variable. Its
        derivative is a <em>partial derivative</em>: the slope of the landscape along that coordinate axis. Move the point and
        watch the two slopes change.
      </p>
      <PartialSliceViz />
      <p>
        Partial derivatives look only along the axes. Whether they capture the change in every direction is the question of
        the next lesson; this one shows how to compute them, and one surprising way they can fail.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="partial derivative">
        <p>
          For <M>{"f : \\mathbb R^n \\to \\mathbb R"}</M> and the i-th standard basis vector <M>{"e_i"}</M>,
        </p>
        <MD>{"\\frac{\\partial f}{\\partial x_i}(a) = \\lim_{h \\to 0} \\frac{f(a + h e_i) - f(a)}{h},"}</MD>
        <p>
          when the limit exists. It is the ordinary derivative of <M>{"t \\mapsto f(a_1, \\dots, t, \\dots, a_n)"}</M>, so all the
          one-variable rules apply, treating the other variables as constants. Other notations are <M>{"f_{x_i}"}</M> and{" "}
          <M>{"\\partial_i f"}</M>.
        </p>
      </Definition>

      <Example title="computing">
        <p>
          For <M>{"f(x, y) = x^2 y + 3y^2"}</M>: <M>{"\\partial f/\\partial x = 2xy"}</M> and{" "}
          <M>{"\\partial f/\\partial y = x^2 + 6y"}</M>, so at (1, 2) they are 4 and 13.
        </p>
      </Example>

      <Definition title="higher partial derivatives">
        <p>
          Differentiating again gives second partial derivatives such as <M>{"\\partial^2 f / \\partial x^2"}</M> and the mixed{" "}
          <M>{"\\partial^2 f / \\partial y \\, \\partial x = \\partial_y(\\partial_x f)"}</M>.
        </p>
      </Definition>

      <Theorem title="Clairaut (Schwarz)">
        <p>
          If the second partial derivatives of f exist and are continuous near a, then{" "}
          <M>{"\\partial_x \\partial_y f(a) = \\partial_y \\partial_x f(a)"}</M>.
        </p>
      </Theorem>
      <Remark title="the hypothesis matters">
        <p>
          For <M>{"f(x, y) = xy(x^2 - y^2)/(x^2 + y^2)"}</M>, with f(0, 0) = 0, both mixed partials exist at the origin but equal
          −1 and +1. Its second partials are not continuous there. Functions met in practice, built from polynomials,
          exponentials and the like, satisfy the hypothesis wherever they are defined.
        </p>
      </Remark>

      <Theorem title="partial derivatives do not imply continuity">
        <p>
          Let <M>{"f(x, y) = xy/(x^2 + y^2)"}</M> for (x, y) ≠ 0 and f(0, 0) = 0. Both partial derivatives exist at the origin,
          and f is not continuous there.
        </p>
      </Theorem>
      <Proof>
        <p>
          On the axes f is 0, so <M>{"(f(h, 0) - f(0, 0))/h = 0"}</M> and both partials at the origin are 0. But along y = x,
          f = 1/2, which does not tend to f(0, 0) = 0.
        </p>
      </Proof>
      <p>
        Partial derivatives see only two lines through the point. A good notion of derivative in several variables must see
        every direction at once, which is the subject of the next lesson.
      </p>

      <Example title="numerically">
        <p>
          The central difference <M>{"(f(a + h e_i) - f(a - h e_i))/(2h)"}</M> estimates each partial, at a cost of two
          evaluations of f per coordinate. For a model with a million weights that is two million forward passes per gradient,
          which is why automatic differentiation, later in this course, matters.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "px",
      rung: "check",
      prompt: <p>For <M>{"f(x, y) = x^2 y + 3y^2"}</M>, what is <M>{"\\partial f/\\partial x"}</M> at (1, 2)?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "py",
      rung: "check",
      prompt: <p>For the same f, what is <M>{"\\partial f/\\partial y"}</M> at (1, 2)?</p>,
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "mixed",
      rung: "apply",
      prompt: <p>For <M>{"f(x, y) = x^3 y^2"}</M>, what is <M>{"\\partial^2 f/\\partial y\\,\\partial x"}</M> at (1, 1)?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "exp",
      rung: "apply",
      prompt: <p>For <M>{"f(x, y, z) = e^{xy} + z\\ln x"}</M>, what is <M>{"\\partial f/\\partial x"}</M> at (1, 0, 2)?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "true",
      rung: "apply",
      prompt: <p>Which statements are true for every function f of two variables?</p>,
      answer: {
        kind: "choice",
        options: [
          "If f is differentiable in the sense of later lessons, its partial derivatives exist",
          "If both partial derivatives exist at a point, f is continuous there",
          "If both mixed second partials exist at a point, they are equal",
          "∂f/∂x at a depends only on the values of f on the horizontal line through a",
        ],
        correct: [0, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x, y: x**2 * y + 3 * y**2
h = 1e-6
dx = (f(1 + h, 2) - f(1 - h, 2)) / (2 * h)
dy = (f(1, 2 + h) - f(1, 2 - h)) / (2 * h)
print(round(dx, 4), round(dy, 4))`}</Code>
          <p>Central differences in each coordinate. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.0 13.0", "2.0 6.0", "4.0 4.0", "13.0 4.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
xs = np.linspace(0, 2, 3)
X, Y = np.meshgrid(xs, xs)
F = X**2 + 10 * Y
dFdy, dFdx = np.gradient(F, 1.0)
print(dFdx[1], dFdy[1])`}</Code>
          <p>
            <C>np.gradient</C> returns one array per axis, axis 0 first, using central differences inside the grid and one-sided
            ones at the edges. With <C>meshgrid</C>&rsquo;s default, rows vary in y. What does this print?
          </p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1. 2. 3.] [10. 10. 10.]", "[0. 2. 4.] [10. 10. 10.]", "[10. 10. 10.] [1. 2. 3.]", "[2. 2. 2.] [10. 10. 10.]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>partials(f, x, h=1e-5)</C>, which returns the NumPy array of central-difference partial derivatives of f at
          the point x (a 1-D array), and <C>mixed_partial(f, x, i, j, h=1e-4)</C>, which estimates{" "}
          <M>{"\\partial_i \\partial_j f(x)"}</M> by{" "}
          <M>{"\\big(f(x + he_i + he_j) - f(x + he_i - he_j) - f(x - he_i + he_j) + f(x - he_i - he_j)\\big)/(4h^2)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def partials(f, x, h=1e-5):
    return np.zeros(len(x))

def mixed_partial(f, x, i, j, h=1e-4):
    return 0.0
`,
        solution: `import numpy as np

def partials(f, x, h=1e-5):
    x = np.asarray(x, float)
    out = np.zeros(len(x))
    for i in range(len(x)):
        e = np.zeros(len(x))
        e[i] = h
        out[i] = (f(x + e) - f(x - e)) / (2 * h)
    return out

def mixed_partial(f, x, i, j, h=1e-4):
    x = np.asarray(x, float)
    ei, ej = np.zeros(len(x)), np.zeros(len(x))
    ei[i] += h
    ej[j] += h
    return (f(x + ei + ej) - f(x + ei - ej) - f(x - ei + ej) + f(x - ei - ej)) / (4 * h * h)
`,
        tests: [
          { name: "partials", code: `import numpy as np
f = lambda v: v[0]**2 * v[1] + 3 * v[1]**2
assert np.allclose(partials(f, [1.0, 2.0]), [4, 13], atol=1e-6)
g = lambda v: np.exp(v[0] * v[1]) + v[2] * np.log(v[0])
assert np.allclose(partials(g, np.array([1.0, 0.0, 2.0])), [2.0, 1.0, 0.0], atol=1e-6)
x = np.array([1.0, 2.0]); partials(f, x)
assert np.allclose(x, [1, 2]), 'Do not change x.'` },
          { name: "mixed", code: `import numpy as np
f = lambda v: v[0]**3 * v[1]**2
assert abs(mixed_partial(f, [1.0, 1.0], 0, 1) - 6) < 1e-4
assert abs(mixed_partial(f, [1.0, 1.0], 1, 0) - 6) < 1e-4
assert abs(mixed_partial(f, [1.0, 1.0], 0, 0) - 6) < 1e-4, 'With i = j this gives the second derivative in x_i: 6xy² = 6.'
assert abs(mixed_partial(lambda v: np.sin(v[0]) * np.cos(v[1]), [0.3, 0.7], 0, 1) + np.cos(0.3) * np.sin(0.7)) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Exact partial derivatives of polynomials. A polynomial in x and y is a dict mapping (i, j) to the non-zero coefficient
            of <M>{"x^i y^j"}</M>; <C>{"{(2, 1): 1, (0, 2): 3}"}</C> is <M>{"x^2 y + 3y^2"}</M>. Write <C>d_dx(p)</C> and{" "}
            <C>d_dy(p)</C>, returning new polynomials in the same form, and <C>evaluate(p, x, y)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def d_dx(p):
    return p

def d_dy(p):
    return p

def evaluate(p, x, y):
    return 0
`,
        solution: `def d_dx(p):
    return {(i - 1, j): i * c for (i, j), c in p.items() if i > 0}

def d_dy(p):
    return {(i, j - 1): j * c for (i, j), c in p.items() if j > 0}

def evaluate(p, x, y):
    return sum(c * x**i * y**j for (i, j), c in p.items())
`,
        tests: [
          { name: "example", code: `p = {(2, 1): 1, (0, 2): 3}
assert d_dx(p) == {(1, 1): 2} and d_dy(p) == {(2, 0): 1, (0, 1): 6}
assert evaluate(d_dx(p), 1, 2) == 4 and evaluate(d_dy(p), 1, 2) == 13
assert d_dx({(0, 3): 5}) == {} and evaluate({}, 3, 4) == 0
assert p == {(2, 1): 1, (0, 2): 3}, 'Do not change p.'` },
          { name: "Clairaut", code: `import random
rng = random.Random(3)
for _ in range(50):
    p = {(rng.randint(0, 4), rng.randint(0, 4)): rng.randint(1, 9) for _ in range(5)}
    assert d_dy(d_dx(p)) == d_dx(d_dy(p)), p
    x, y, h = rng.uniform(-1, 1), rng.uniform(-1, 1), 1e-6
    num = (evaluate(p, x + h, y) - evaluate(p, x - h, y)) / (2 * h)
    assert abs(num - evaluate(d_dx(p), x, y)) < 1e-5` },
        ],
      },
    },
    {
      key: "disc",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"f(x, y) = xy/(x^2 + y^2)"}</M> away from the origin and f(0, 0) = 0. Prove that both partial derivatives exist
          at the origin, and that f is not continuous there.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes f(h, 0) = f(0, h) = 0, so both difference quotients are 0 and both partials at the origin are 0.",
          "Shows f = 1/2 along y = x (or another non-zero value along another line), so f(t, t) does not tend to f(0, 0) = 0.",
          "Concludes that f is not continuous at the origin even though both partials exist.",
        ],
      },
    },
    {
      key: "schwarz",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"f(x, y) = xy(x^2 - y^2)/(x^2 + y^2)"}</M> with f(0, 0) = 0, one can show{" "}
          <M>{"\\partial_x f(0, y) = -y"}</M>. What is <M>{"\\partial_y(\\partial_x f)(0, 0)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -1 },
    },
  ],

  teachBack:
    "Explain to a friend what a partial derivative is, how to compute one, and why having both partial derivatives at a point does not guarantee that a function is well behaved there.",

  glimpse: (
    <p>
      Next, the derivative as a linear map: the single object that captures how a function changes in every direction at
      once, and of which partial derivatives are just the entries.
    </p>
  ),
};
