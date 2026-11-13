import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EpigraphViz } from "@/components/viz/EpigraphViz";
import type { LessonContent } from "@/lib/types";

const CHORD = `import numpy as np

def chord_gap(f, x, y, theta):
    return float(theta * f(x) + (1 - theta) * f(y) - f(theta * x + (1 - theta) * y))

def worst_gap(f, dim, scale=2.0, trials=2000, seed=0):
    rng = np.random.default_rng(seed)
    worst = np.inf
    for _ in range(trials):
        x, y = scale * rng.normal(size=dim), scale * rng.normal(size=dim)
        worst = min(worst, chord_gap(f, x, y, rng.random()))
    return float(worst)

def restrict(f, x, v):
    return lambda t: f(x + t * v)`;

const JENSEN = `import numpy as np

def jensen_gap(f, xs, ws):
    xs, ws = np.asarray(xs, dtype=float), np.asarray(ws, dtype=float)
    assert np.all(ws >= 0) and abs(ws.sum() - 1) < 1e-12
    return float(ws @ np.array([f(x) for x in xs]) - f(ws @ xs))

def in_epigraph(f, x, t):
    return bool(f(x) <= t)

def strong_gap(f, m, x, y, theta):
    mid = theta * x + (1 - theta) * y
    bound = theta * f(x) + (1 - theta) * f(y) - m / 2 * theta * (1 - theta) * np.sum((x - y) ** 2)
    return float(bound - f(mid))`;

export const lesson: LessonContent = {
  id: "m10.2.1",
  minutes: 50,
  links: {
    requires: ["m10.1.1", "m7.4.2"],
    revisits: ["m10.1.2"],
    foreshadows: ["m10.2.2", "m10.5.2"],
  },

  puzzle: (
    <>
      <p>
        A function on ℝ¹⁰⁰ has a point where every small step in every direction increases it. Is that point the global
        minimum? For a general function, certainly not: there could be a deeper valley far away. What single property of
        the function rules this out, and how do you check it in a hundred dimensions, where you cannot draw the graph?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A convex function is one whose chords never dip below its graph: the straight line between two points of the graph
        stays on or above the curve. Equivalently, the region above the graph is a convex set, so everything from the
        previous chapter applies. A function like that cannot have two separate valleys, because the chord between their
        bottoms would have to pass below the hill between them.
      </p>
      <EpigraphViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convex function">
        <p>
          A function f with convex domain is convex if for all x, y in the domain and <M>{"\\theta \\in [0, 1]"}</M>,
        </p>
        <MD>{"f(\\theta x + (1 - \\theta)y) \\leq \\theta f(x) + (1 - \\theta)f(y),"}</MD>
        <p>
          strictly convex if the inequality is strict whenever x ≠ y and 0 &lt; θ &lt; 1, and m-strongly convex (m &gt; 0)
          if <M>{"f - \\frac m2\\lVert\\cdot\\rVert_2^2"}</M> is convex, which is the same as subtracting{" "}
          <M>{"\\frac m2\\theta(1 - \\theta)\\lVert x - y\\rVert^2"}</M> from the right-hand side. f is concave if −f is
          convex.
        </p>
        <Code>{CHORD}</Code>
      </Definition>

      <Theorem title="the epigraph">
        <p>
          f is convex exactly when its epigraph <M>{"\\mathrm{epi}\\,f = \\{(x, t) : f(x) \\leq t\\}"}</M> is a convex set.
        </p>
      </Theorem>
      <Proof>
        <p>
          If f is convex and <M>{"f(x) \\leq t"}</M>, <M>{"f(y) \\leq s"}</M>, then{" "}
          <M>{"f(\\theta x + (1 - \\theta)y) \\leq \\theta t + (1 - \\theta)s"}</M>, so the combination of (x, t) and (y, s)
          is in the epigraph. Conversely, if the epigraph is convex, apply this to the points (x, f(x)) and (y, f(y)),
          which belong to it: their combination is in the epigraph, which is the defining inequality.
        </p>
      </Proof>

      <Theorem title="Jensen's inequality">
        <p>
          If f is convex, <M>{"\\theta_i \\geq 0"}</M> and <M>{"\\sum\\theta_i = 1"}</M>, then{" "}
          <M>{"f(\\sum_i\\theta_ix_i) \\leq \\sum_i\\theta_if(x_i)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The points <M>{"(x_i, f(x_i))"}</M> lie in the convex epigraph, so their convex combination{" "}
          <M>{"(\\sum\\theta_ix_i, \\sum\\theta_if(x_i))"}</M> does too, by the theorem on convex combinations. That is the
          claim.
        </p>
        <Code>{JENSEN}</Code>
      </Proof>

      <Theorem title="lines, sublevel sets and minima">
        <p>
          (a) f is convex exactly when, for every x and direction v, <M>{"g(t) = f(x + tv)"}</M> is convex in t. (b) Every
          sublevel set <M>{"\\{x : f(x) \\leq \\alpha\\}"}</M> of a convex function is convex. (c) Every local minimum of a
          convex function is a global minimum.
        </p>
      </Theorem>
      <Proof>
        <p>
          (a) The definition only ever involves points on one line, so it holds for f exactly when it holds on every line.
          (b) If <M>{"f(x), f(y) \\leq \\alpha"}</M>, the combination has value at most{" "}
          <M>{"\\theta\\alpha + (1 - \\theta)\\alpha = \\alpha"}</M>. (c) Suppose x is a local minimum but f(y) &lt; f(x) for
          some y. For small θ &gt; 0 the point <M>{"z = (1 - \\theta)x + \\theta y"}</M> is as close to x as we like, yet{" "}
          <M>{"f(z) \\leq (1 - \\theta)f(x) + \\theta f(y) < f(x)"}</M>, contradicting local minimality.
        </p>
      </Proof>

      <Remark title="examples and non-examples">
        <p>
          Every norm is convex, by the triangle inequality; so are affine functions (both convex and concave),{" "}
          <M>{"e^{ax}"}</M>, <M>{"-\\log x"}</M>, <M>{"x\\log x"}</M>, and the log-sum-exp function, for which the code&apos;s
          random chord search finds no violation. The converse of (b) fails: √|x| has interval sublevel sets but is not
          convex; such functions are called quasiconvex. In the code, the chord of x³ between −2 and 0 lies 3 below the
          graph at its midpoint, and the restriction of <M>{"\\lVert x\\rVert^2"}</M> to a line is the parabola{" "}
          <M>{"2t^2 + 2t + 1"}</M>. The function <M>{"\\lVert x\\rVert^2"}</M> is exactly 2-strongly convex: the strong
          convexity bound holds with equality for m = 2 and fails for m = 3.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gap",
      rung: "check",
      prompt: <p>For f(x) = x², x = 1, y = 3 and θ = 0.25, what is θf(x) + (1 − θ)f(y) − f(θx + (1 − θ)y)?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "jensen",
      rung: "check",
      prompt: <p>X equals 0 with probability 0.25 and 4 with probability 0.75. What is E[X²] − (E X)², the Jensen gap for f(x) = x²?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "quasi",
      rung: "apply",
      prompt: <p>Which statement is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "A convex function has convex sublevel sets, but a function with convex sublevel sets need not be convex",
          "A function is convex exactly when all its sublevel sets are convex",
          "A convex function always has a minimiser",
          "A strictly convex function can have two different global minimisers",
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

def chord_gap(f, x, y, theta):
    return float(theta * f(x) + (1 - theta) * f(y) - f(theta * x + (1 - theta) * y))

def worst_gap(f, dim, scale=2.0, trials=2000, seed=0):
    rng = np.random.default_rng(seed)
    worst = np.inf
    for _ in range(trials):
        x, y = scale * rng.normal(size=dim), scale * rng.normal(size=dim)
        worst = min(worst, chord_gap(f, x, y, rng.random()))
    return float(worst)

def restrict(f, x, v):
    return lambda t: f(x + t * v)

lse = lambda x: float(np.log(np.exp(x).sum()))
print(round(chord_gap(lambda x: x * x, 1.0, 3.0, 0.5), 4), round(chord_gap(abs, -1.0, 1.0, 0.25), 4), round(chord_gap(lambda x: x ** 3, -2.0, 0.0, 0.5), 4))
print(worst_gap(lse, 3) >= -1e-12, worst_gap(lambda x: float(np.sin(x).sum()), 2) < 0)
g = restrict(lambda x: float(x @ x), np.array([1.0, 0.0]), np.array([1.0, 1.0]))
print([g(t) for t in (-1.0, 0.0, 1.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0 0.5 -3.0\nTrue True\n[1.0, 1.0, 5.0]", "1.0 0.5 3.0\nTrue True\n[1.0, 1.0, 5.0]", "1.0 0.0 -3.0\nTrue True\n[1.0, 1.0, 5.0]", "1.0 0.5 -3.0\nTrue False\n[1.0, 1.0, 5.0]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def jensen_gap(f, xs, ws):
    xs, ws = np.asarray(xs, dtype=float), np.asarray(ws, dtype=float)
    assert np.all(ws >= 0) and abs(ws.sum() - 1) < 1e-12
    return float(ws @ np.array([f(x) for x in xs]) - f(ws @ xs))

def in_epigraph(f, x, t):
    return bool(f(x) <= t)

def strong_gap(f, m, x, y, theta):
    mid = theta * x + (1 - theta) * y
    bound = theta * f(x) + (1 - theta) * f(y) - m / 2 * theta * (1 - theta) * np.sum((x - y) ** 2)
    return float(bound - f(mid))

print(round(jensen_gap(np.exp, [0.0, 1.0, 2.0], [0.25, 0.5, 0.25]), 4), round(jensen_gap(lambda x: x, [3.0, 7.0], [0.5, 0.5]), 4))
q = lambda x: float(x @ x)
print(round(strong_gap(q, 2.0, np.array([0.0, 0.0]), np.array([2.0, 0.0]), 0.5), 6), round(strong_gap(q, 3.0, np.array([0.0, 0.0]), np.array([2.0, 0.0]), 0.5), 4))
print(in_epigraph(abs, -2.0, 2.0), in_epigraph(abs, -2.0, 1.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.7381 0.0\n0.0 -0.5\nTrue False", "0.7381 0.0\n0.0 0.5\nTrue False", "-0.7381 0.0\n0.0 -0.5\nTrue False", "0.7381 0.0\n1.0 -0.5\nTrue True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chord_gap(f, x, y, theta)</C>, <C>worst_gap(f, dim, scale=2.0, trials=2000, seed=0)</C>, the smallest
          chord gap over random pairs of scale-times-normal points and uniform θ, and <C>restrict(f, x, v)</C>, returning
          the function t ↦ f(x + tv).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def chord_gap(f, x, y, theta):
    return 0.0

def worst_gap(f, dim, scale=2.0, trials=2000, seed=0):
    return 0.0

def restrict(f, x, v):
    return f
`,
        solution: CHORD,
        tests: [
          { name: "gap", code: `assert abs(chord_gap(np.exp, 0.0, 2.0, 0.5) - ((1 + np.e ** 2) / 2 - np.e)) < 1e-12
assert worst_gap(lambda x: float(np.abs(x).sum()), 3) >= -1e-12 and worst_gap(lambda x: -float(x @ x), 2) < -1` },
          { name: "restrict", code: `g = restrict(lambda x: float(x[0] * x[1]), np.array([1.0, 2.0]), np.array([1.0, -1.0]))
assert abs(g(0.5) - 1.5 * 1.5) < 1e-12 and abs(g(-1.0) - 0.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jensen_gap(f, xs, ws)</C>, returning Σwᵢf(xᵢ) − f(Σwᵢxᵢ) for nonnegative weights summing to 1,{" "}
          <C>in_epigraph(f, x, t)</C>, and <C>strong_gap(f, m, x, y, theta)</C>, returning the m-strong convexity bound
          θf(x) + (1 − θ)f(y) − (m/2)θ(1 − θ)‖x − y‖² minus f at the combination.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def jensen_gap(f, xs, ws):
    return 0.0

def in_epigraph(f, x, t):
    return True

def strong_gap(f, m, x, y, theta):
    return 0.0
`,
        solution: JENSEN,
        tests: [
          { name: "jensen", code: `assert abs(jensen_gap(lambda x: x * x, [0.0, 4.0], [0.25, 0.75]) - 3.0) < 1e-12 and abs(jensen_gap(np.log, [1.0, 4.0], [0.5, 0.5]) - (np.log(2) - np.log(2.5))) < 1e-12` },
          { name: "strong", code: `f = lambda x: float(2 * x @ x)
x, y = np.array([1.0, -1.0]), np.array([0.0, 3.0])
assert abs(strong_gap(f, 4.0, x, y, 0.3)) < 1e-12 and strong_gap(f, 5.0, x, y, 0.3) < 0 and in_epigraph(f, x, 4.0) and not in_epigraph(f, x, 3.9)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let f be convex on a convex set. Prove that every local minimum of f is a global minimum, and that if f is
          strictly convex it has at most one global minimiser.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Assumes a local minimum x and a point y with f(y) < f(x), and considers z = (1 − θ)x + θy for small θ > 0, which lies in the domain and near x.",
          "Uses convexity to get f(z) ≤ (1 − θ)f(x) + θf(y) < f(x), contradicting local minimality.",
          "For uniqueness, takes two minimisers x ≠ y with value p and shows strict convexity gives f((x + y)/2) < p, a contradiction.",
        ],
      },
    },
    {
      key: "m",
      rung: "stretch",
      prompt: <p>What is the largest m for which f(x) = 3x² is m-strongly convex on ℝ?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the chord definition of a convex function, why convexity of the function is the same as convexity of its epigraph, how Jensen's inequality follows, why sublevel sets are convex, and why local minima of convex functions are global.",

  glimpse: (
    <>
      <p>
        Checking chords is a poor test in practice. For differentiable functions convexity says that every tangent plane
        lies below the graph, and for twice differentiable ones that the Hessian is positive semidefinite, which you can
        compute.
      </p>
    </>
  ),
};
