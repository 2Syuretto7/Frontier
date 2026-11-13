import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JointGridViz } from "@/components/viz/JointGridViz";
import type { LessonContent } from "@/lib/types";

const JOINT = `import numpy as np

def marginals(joint):
    return joint.sum(axis=1), joint.sum(axis=0)

def conditional(joint, i):
    row = joint[i]
    return row / row.sum()

def is_independent(joint, tol=1e-12):
    px, py = marginals(joint)
    return bool(np.allclose(joint, np.outer(px, py), atol=tol))`;

const POLAR = `import numpy as np

def box_muller(u1, u2):
    r = np.sqrt(-2 * np.log(1 - u1))
    theta = 2 * np.pi * u2
    return r * np.cos(theta), r * np.sin(theta)

def uniform_disc(u1, u2):
    r = np.sqrt(u1)
    theta = 2 * np.pi * u2
    return r * np.cos(theta), r * np.sin(theta)`;

export const lesson: LessonContent = {
  id: "m7.5.1",
  minutes: 65,
  links: {
    requires: ["m7.3.4", "m5.2.3"],
    revisits: ["m7.1.3"],
    foreshadows: ["m7.5.2", "m7.5.4", "m7.6.1"],
  },

  puzzle: (
    <>
      <p>
        To place a point uniformly at random in a disc, a natural idea is to pick a uniform radius and a uniform angle. The
        points then crowd towards the centre. Why, and what radius distribution gives a uniform disc? The same reasoning
        turns two uniform random numbers into two independent normal ones.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two random variables together are described by a joint distribution, mass spread over the plane. Summing or
        integrating out one coordinate gives the marginal of the other; slicing at a fixed value and renormalising gives a
        conditional. Independence means the joint is the product of the marginals. And when the coordinates are changed,
        to polar for instance, the density changes by the Jacobian factor that measures how areas stretch.
      </p>
      <JointGridViz />
    </>
  ),

  theory: (
    <>
      <Definition title="joint distributions">
        <p>
          Discrete X, Y have joint pmf <M>{"p(x, y) = P(X = x, Y = y)"}</M>. X, Y are jointly continuous with joint density
          f ≥ 0 if <M>{"P((X, Y) \\in A) = \\iint_A f(x, y)\\,dx\\,dy"}</M> for every reasonable region A; in particular f
          integrates to 1 over the plane.
        </p>
      </Definition>

      <Theorem title="marginals">
        <p>
          <M>{"p_X(x) = \\sum_y p(x, y)"}</M> and <M>{"f_X(x) = \\int f(x, y)\\,dy"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Discrete: {"{X = x}"} is the disjoint union over y of {"{X = x, Y = y}"}. Continuous:{" "}
          <M>{"P(X \\le a) = P((X, Y) \\in (-\\infty, a] \\times \\mathbb{R}) = \\int_{-\\infty}^{a}\\Big(\\int f(x, y)\\,dy\\Big)dx"}</M>,
          so the inner integral is a density for X.
        </p>
      </Proof>

      <Definition title="conditional distributions">
        <p>
          <M>{"p_{Y|X}(y \\mid x) = p(x, y)/p_X(x)"}</M> when <M>{"p_X(x) > 0"}</M>, and likewise{" "}
          <M>{"f_{Y|X}(y \\mid x) = f(x, y)/f_X(x)"}</M> when <M>{"f_X(x) > 0"}</M>. For each fixed x this is a pmf or density
          in y. In the continuous case {"{X = x}"} has probability 0, and the formula is the limit of conditioning on{" "}
          <M>{"x \\le X \\le x + h"}</M> as h → 0. Rearranged, <M>{"f(x, y) = f_X(x)f_{Y|X}(y \\mid x)"}</M>, the joint
          version of the chain rule, and Bayes&apos; rule for densities follows as before.
        </p>
        <Code>{JOINT}</Code>
      </Definition>

      <Theorem title="independence factorises">
        <p>
          X and Y are independent exactly when <M>{"p(x, y) = p_X(x)p_Y(y)"}</M> for all x, y (respectively{" "}
          <M>{"f(x, y) = f_X(x)f_Y(y)"}</M>). If a joint density has the form g(x)h(y) on all of the plane, or on a product
          of intervals and 0 outside, then X and Y are independent with densities proportional to g and h.
        </p>
      </Theorem>
      <Proof>
        <p>
          The discrete statement is the definition of independent random variables. For f = g(x)h(y) (on the plane, or on a
          product of intervals with g, h set to 0 outside), integrating gives <M>{"f_X = g\\int h"}</M> and{" "}
          <M>{"f_Y = h\\int g"}</M>, while f integrating to 1 gives <M>{"\\int g\\int h = 1"}</M>. So{" "}
          <M>{"f_Xf_Y = gh\\int g\\int h = f"}</M>, and then{" "}
          <M>{"P(X \\in A, Y \\in B) = \\int_A f_X\\int_B f_Y = P(X \\in A)P(Y \\in B)"}</M>.
        </p>
      </Proof>
      <Example title="the support matters">
        <p>
          Let (X, Y) be uniform on the triangle 0 &lt; y &lt; x &lt; 1, density 2 there. The formula is a constant, yet X and
          Y are dependent: knowing X = 0.1 forces Y &lt; 0.1. Here <M>{"f_X(x) = 2x"}</M>, and given X = x, Y is uniform on
          (0, x). A factorised formula proves independence only when the region is a product.
        </p>
      </Example>

      <Theorem title="change of variables in the plane">
        <p>
          If (U, V) = g(X, Y) for a one-to-one differentiable g with differentiable inverse h, then{" "}
          <M>{"f_{U,V}(u, v) = f_{X,Y}(h(u, v))\\,|\\det Dh(u, v)|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is the change-of-variables formula for double integrals applied to{" "}
          <M>{"P((U, V) \\in A) = \\iint_{h(A)}f_{X,Y}"}</M>: the Jacobian determinant is the local factor by which h scales
          areas, exactly as |h′| scaled lengths in one dimension.
        </p>
      </Proof>

      <Example title="polar coordinates and Box–Muller">
        <p>
          In polar coordinates <M>{"dx\\,dy = r\\,dr\\,d\\theta"}</M>. A uniform point in the unit disc has joint density{" "}
          <M>{"r/\\pi"}</M> in (r, θ), so the radius has density 2r, not 1: hence the crowding in the puzzle, and the cure,
          R = √U, by inversion of <M>{"F(r) = r^2"}</M>. For two independent standard normals,{" "}
          <M>{"f(x, y) = e^{-(x^2+y^2)/2}/(2\\pi)"}</M> becomes <M>{"re^{-r^2/2}\\cdot\\frac{1}{2\\pi}"}</M>: R and Θ are
          independent, Θ is uniform, and <M>{"P(R > r) = e^{-r^2/2}"}</M>, so{" "}
          <M>{"R = \\sqrt{-2\\log(1 - U_1)}"}</M>. Two uniforms give two independent normals.
        </p>
        <Code>{POLAR}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "condtable",
      rung: "check",
      prompt: (
        <p>
          A joint pmf has rows x = 0, 1 and columns y = 0, 1, 2: [[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]]. What is P(Y = 1 | X = 1)?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "triangle",
      rung: "check",
      prompt: <p>(X, Y) is uniform on the triangle 0 &lt; y &lt; x &lt; 1. What is the marginal density of X at x = 0.5?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "fourxy",
      rung: "apply",
      prompt: <p>(X, Y) has joint density 4xy on the unit square [0, 1]² and 0 elsewhere. Which is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "X and Y are independent, each with density 2t on [0, 1].",
          "X and Y are dependent, because the density involves the product xy.",
          "X and Y are independent, each with density 4t on [0, 1].",
          "X and Y are dependent, because the density is not constant.",
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

def marginals(joint):
    return joint.sum(axis=1), joint.sum(axis=0)

def conditional(joint, i):
    row = joint[i]
    return row / row.sum()

def is_independent(joint, tol=1e-12):
    px, py = marginals(joint)
    return bool(np.allclose(joint, np.outer(px, py), atol=tol))

J = np.array([[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]])
px, py = marginals(J)
print(px, py, conditional(J, 0))
print(is_independent(J), is_independent(np.outer([0.4, 0.6], [0.5, 0.25, 0.25])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.4 0.6] [0.3 0.5 0.2] [0.25 0.5  0.25]\nFalse True",
          "[0.4 0.6] [0.3 0.5 0.2] [0.1 0.2 0.1]\nFalse True",
          "[0.3 0.5 0.2] [0.4 0.6] [0.25 0.5  0.25]\nFalse True",
          "[0.4 0.6] [0.3 0.5 0.2] [0.25 0.5  0.25]\nTrue True",
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

def box_muller(u1, u2):
    r = np.sqrt(-2 * np.log(1 - u1))
    theta = 2 * np.pi * u2
    return r * np.cos(theta), r * np.sin(theta)

def uniform_disc(u1, u2):
    r = np.sqrt(u1)
    theta = 2 * np.pi * u2
    return r * np.cos(theta), r * np.sin(theta)

u = np.random.default_rng(0).random((2, 200000))
z1, z2 = box_muller(u[0], u[1])
print(round(z1.mean(), 1) + 0.0, round(z1.std(), 2), round(np.corrcoef(z1, z2)[0, 1], 1) + 0.0)
x, y = uniform_disc(u[0], u[1])
print(bool(np.all(x ** 2 + y ** 2 <= 1)), round(np.mean(x ** 2 + y ** 2 <= 0.25), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0 1.0 0.0\nTrue 0.25", "0.0 1.0 0.0\nTrue 0.5", "0.0 2.0 0.0\nTrue 0.25", "0.0 1.0 1.0\nTrue 0.25"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a joint pmf given as a 2-D array (rows indexed by x, columns by y), write <C>marginals(joint)</C> returning (p_X,
          p_Y), <C>conditional(joint, i)</C> returning the conditional pmf of Y given the i-th value of X, and{" "}
          <C>is_independent(joint, tol=1e-12)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def marginals(joint):
    return None, None

def conditional(joint, i):
    return joint[i]

def is_independent(joint, tol=1e-12):
    return True
`,
        solution: JOINT,
        tests: [
          { name: "marginals and conditionals", code: `J = np.array([[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]])
px, py = marginals(J)
assert np.allclose(px, [0.4, 0.6]) and np.allclose(py, [0.3, 0.5, 0.2])
assert np.allclose(conditional(J, 1), [1 / 3, 0.5, 1 / 6]) and abs(conditional(J, 0).sum() - 1) < 1e-12` },
          { name: "independence", code: `assert not is_independent(np.array([[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]]))
assert is_independent(np.outer([0.2, 0.3, 0.5], [0.6, 0.4]))
assert not is_independent(np.array([[0.5, 0.0], [0.0, 0.5]]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>box_muller(u1, u2)</C>, mapping two arrays of uniforms to two arrays of independent standard normals through
          polar coordinates, and <C>uniform_disc(u1, u2)</C>, mapping them to points (x, y) uniform on the unit disc.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def box_muller(u1, u2):
    return u1, u2

def uniform_disc(u1, u2):
    theta = 2 * np.pi * u2
    return u1 * np.cos(theta), u1 * np.sin(theta)
`,
        solution: POLAR,
        tests: [
          { name: "normals", code: `u = np.random.default_rng(3).random((2, 400000))
z1, z2 = box_muller(u[0], u[1])
assert abs(z1.mean()) < 0.01 and abs(z1.std() - 1) < 0.01 and abs(z2.std() - 1) < 0.01
assert abs(np.corrcoef(z1, z2)[0, 1]) < 0.01 and abs(np.mean(np.abs(z1) < 1.96) - 0.95) < 0.003
assert abs(np.mean((z1 ** 2 + z2 ** 2) > 2) - np.exp(-1)) < 0.003` },
          { name: "disc", code: `u = np.random.default_rng(4).random((2, 400000))
x, y = uniform_disc(u[0], u[1])
r2 = x ** 2 + y ** 2
assert np.all(r2 <= 1 + 1e-12) and abs(np.mean(r2 <= 0.25) - 0.25) < 0.005 and abs(np.mean(x > 0.5) - 0.1955) < 0.005` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose (X, Y) has joint density f(x, y) = g(x)h(y) for all real x, y, with g, h ≥ 0. Prove that X and Y are
          independent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes the marginals: f_X(x) = g(x)∫h and f_Y(y) = h(y)∫g.",
          "Uses ∫∫ f = (∫g)(∫h) = 1 to show f_X(x)f_Y(y) = g(x)h(y)(∫g)(∫h) = f(x, y).",
          "Concludes P(X ∈ A, Y ∈ B) = ∫_A f_X · ∫_B f_Y = P(X ∈ A)P(Y ∈ B) for all intervals (or sets) A, B.",
        ],
      },
    },
    {
      key: "xplusy",
      rung: "stretch",
      prompt: <p>(X, Y) has joint density x + y on [0, 1]². What is P(X + Y ≤ 1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how marginal and conditional distributions come from a joint one, how to tell from the joint density whether two variables are independent (including the trap of a non-product region), and how polar coordinates turn two uniforms into two independent normals.",

  glimpse: (
    <>
      <p>
        A joint distribution carries a lot of information; covariance and correlation compress the linear part of the
        dependence into single numbers, the topic of the next lesson. With many variables at once, covariance matrices and
        the multivariate normal take over.
      </p>
    </>
  ),
};
