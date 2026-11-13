import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ParamCurveViz } from "@/components/viz/ParamCurveViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.1.3",
  minutes: 55,
  links: {
    requires: ["m5.1.1", "m2.6.3"],
    revisits: ["m2.4.1", "m2.6.4", "m3.1.4"],
    foreshadows: ["m5.2.5", "m5.7.3"],
  },

  puzzle: (
    <>
      <p>
        During training the weights move through <M>{"\\mathbb R^n"}</M>: each step is a small hop, and together they trace a
        path from the initial weights to the final ones. Two runs end in the same place, one after 1,000 steps and one after
        10,000.
      </p>
      <p>Did the second one travel further, or just more slowly?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A curve is a moving point: for each time t, a position γ(t). Its velocity is the derivative of each coordinate, a
        vector tangent to the path; its speed is the length of that vector. The same path can be traced fast or slow, which
        changes the velocity but not the length of the path.
      </p>
      <ParamCurveViz />
      <p>
        The length is the integral of the speed: distance travelled is speed times time, added up. That is why the two
        parametrisations of the circle have the same length, 2π, though one takes half as long.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="curves and velocity">
        <p>
          A parametrised curve is a function <M>{"\\gamma : [a, b] \\to \\mathbb R^n"}</M>,{" "}
          <M>{"\\gamma(t) = (\\gamma_1(t), \\dots, \\gamma_n(t))"}</M>. It is differentiable if each coordinate is, and then its
          velocity is
        </p>
        <MD>{"\\gamma'(t) = (\\gamma_1'(t), \\dots, \\gamma_n'(t)) = \\lim_{h \\to 0} \\frac{\\gamma(t + h) - \\gamma(t)}{h}."}</MD>
        <p>
          Its speed is <M>{"\\|\\gamma'(t)\\|"}</M>. If <M>{"\\gamma'(t_0) \\ne 0"}</M>, the tangent line at <M>{"t_0"}</M> is{" "}
          <M>{"s \\mapsto \\gamma(t_0) + s\\,\\gamma'(t_0)"}</M>, the best straight-line approximation to the curve there.
        </p>
      </Definition>

      <Definition title="arc length">
        <p>For a curve with continuous velocity, the length is</p>
        <MD>{"L(\\gamma) = \\int_a^b \\|\\gamma'(t)\\| \\, dt,"}</MD>
        <p>
          the limit of the lengths of inscribed polygons <M>{"\\sum_k \\|\\gamma(t_k) - \\gamma(t_{k-1})\\|"}</M> as the
          partition gets finer.
        </p>
      </Definition>

      <Example title="a helix">
        <p>
          For <M>{"\\gamma(t) = (\\cos t, \\sin t, t)"}</M>, <M>{"\\gamma'(t) = (-\\sin t, \\cos t, 1)"}</M> has constant speed{" "}
          <M>{"\\sqrt 2"}</M>, so one turn, t from 0 to 2π, has length <M>{"2\\pi\\sqrt 2 \\approx 8.886"}</M>.
        </p>
      </Example>

      <Theorem title="length does not depend on the parametrisation">
        <p>
          If <M>{"\\varphi : [c, d] \\to [a, b]"}</M> is continuously differentiable, increasing and onto, then{" "}
          <M>{"\\gamma \\circ \\varphi"}</M> has the same length as γ.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the one-variable chain rule in each coordinate, <M>{"(\\gamma\\circ\\varphi)'(u) = \\gamma'(\\varphi(u))\\,\\varphi'(u)"}</M>
          , and <M>{"\\varphi' \\ge 0"}</M>, so</p>
        <MD>{"\\int_c^d \\|\\gamma'(\\varphi(u))\\|\\,\\varphi'(u)\\,du = \\int_a^b \\|\\gamma'(t)\\|\\,dt"}</MD>
        <p>by the substitution <M>{"t = \\varphi(u)"}</M>.</p>
      </Proof>

      <Example title="curves in training">
        <p>
          Gradient descent with step h follows <M>{"x_{k+1} = x_k - h\\,\\nabla f(x_k)"}</M>, which is Euler&rsquo;s method for
          the <em>gradient flow</em> curve <M>{"x'(t) = -\\nabla f(x(t))"}</M>. The straight path{" "}
          <M>{"\\gamma(t) = (1 - t)\\,\\theta_0 + t\\,\\theta_1"}</M> between two trained networks is used to ask whether they
          sit in one connected valley of the loss: evaluate the loss along γ and look for a bump.
        </p>
      </Example>

      <Remark title="Euler's method drifts">
        <p>
          Following a velocity field in steps of size h makes an error of order h in each unit of time. On the circular field{" "}
          <M>{"v(x, y) = (-y, x)"}</M>, each Euler step multiplies the radius by <M>{"\\sqrt{1 + h^2}"}</M>, so the computed path
          spirals outwards although the true one is a circle.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "speed",
      rung: "check",
      prompt: <p>What is the speed of <M>{"\\gamma(t) = (\\cos t, \\sin t)"}</M>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "vel",
      rung: "check",
      prompt: <p>For <M>{"\\gamma(t) = (t, t^2)"}</M>, what is the speed at t = 1? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 2.236, tolerance: 0.001 },
    },
    {
      key: "line",
      rung: "apply",
      prompt: <p>What is the length of <M>{"\\gamma(t) = (3t, 4t)"}</M> for t from 0 to 2?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "tangent",
      rung: "apply",
      prompt: <p>Which line is tangent to <M>{"\\gamma(t) = (t, t^2)"}</M> at t = 1?</p>,
      answer: {
        kind: "choice",
        options: ["(1, 1) + s(1, 2)", "(1, 1) + s(2, 1)", "(1, 2) + s(1, 1)", "(0, 0) + s(1, 2)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
t = np.linspace(0, 2 * np.pi, 5)
P = np.stack([np.cos(t), np.sin(t)], axis=1)
seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
print(P.shape, round(seg.sum(), 3))`}</Code>
          <p>A polygon inscribed in the unit circle. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(5, 2) 5.657", "(5, 2) 6.283", "(2, 5) 5.657", "(5, 2) 4.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a, b = np.array([0.0, 2.0]), np.array([4.0, -1.0])
loss = lambda w: float(w @ w)
for t in [0.0, 0.5, 1.0]:
    w = (1 - t) * a + t * b
    print(t, w, loss(w))`}</Code>
          <p>The loss along the straight path between two weight vectors. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 [0. 2.] 4.0\n0.5 [2.  0.5] 4.25\n1.0 [ 4. -1.] 17.0",
          "0.0 [0. 2.] 4.0\n0.5 [2.  0.5] 10.5\n1.0 [ 4. -1.] 17.0",
          "0.0 [0. 2.] 2.0\n0.5 [2.  0.5] 2.06\n1.0 [ 4. -1.] 4.12",
          "0.0 [4. -1.] 17.0\n0.5 [2.  0.5] 4.25\n1.0 [0. 2.] 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>arc_length(gamma, a, b, n)</C>, the length of the inscribed polygon through{" "}
          <C>gamma(t)</C> at n + 1 equally spaced t from a to b (gamma returns a tuple or array). Then write{" "}
          <C>point_at_length(gamma, a, b, s, n)</C>: walk along the same polygon and return the point (as a NumPy array) at
          distance s from the start, interpolating linearly within a segment; raise <C>ValueError</C> if s is negative or longer
          than the polygon.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def arc_length(gamma, a, b, n):
    return 0.0

def point_at_length(gamma, a, b, s, n):
    return np.asarray(gamma(a), float)
`,
        solution: `import numpy as np

def polygon(gamma, a, b, n):
    P = np.array([np.asarray(gamma(t), float) for t in np.linspace(a, b, n + 1)])
    cum = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
    return P, cum

def arc_length(gamma, a, b, n):
    return float(polygon(gamma, a, b, n)[1][-1])

def point_at_length(gamma, a, b, s, n):
    P, cum = polygon(gamma, a, b, n)
    if not 0 <= s <= cum[-1]:
        raise ValueError(f'{s} is outside [0, {cum[-1]}]')
    k = min(int(np.searchsorted(cum, s, side='right')) - 1, n - 1)
    w = (s - cum[k]) / (cum[k + 1] - cum[k])
    return P[k] + w * (P[k + 1] - P[k])
`,
        tests: [
          { name: "lengths", code: `import numpy as np
assert abs(arc_length(lambda t: (np.cos(t), np.sin(t)), 0, 2 * np.pi, 2000) - 2 * np.pi) < 1e-5
assert abs(arc_length(lambda t: (np.cos(t), np.sin(t), t), 0, 2 * np.pi, 2000) - 2 * np.pi * np.sqrt(2)) < 1e-5
assert abs(arc_length(lambda t: (3 * t, 4 * t), 0, 2, 1) - 10) < 1e-12
assert abs(arc_length(lambda t: (np.cos(2 * t), np.sin(2 * t)), 0, np.pi, 2000) - 2 * np.pi) < 1e-5, 'Speed changes, length does not.'` },
          { name: "walking", code: `import numpy as np
circle = lambda t: (np.cos(t), np.sin(t))
p = point_at_length(circle, 0, 2 * np.pi, np.pi / 2, 4000)
assert np.allclose(p, [0, 1], atol=1e-5), p
assert np.allclose(point_at_length(lambda t: (t, 0.0), 0, 1, 0.25, 4), [0.25, 0])
assert np.allclose(point_at_length(lambda t: (t, 0.0), 0, 1, 1.0, 4), [1, 0])
assert np.allclose(point_at_length(lambda t: (t, t * t), 0, 1, 0.0, 10), [0, 0])
for s in [-0.1, 1.5]:
    try:
        point_at_length(lambda t: (t, 0.0), 0, 1, s, 4)
    except ValueError:
        pass
    else:
        assert False, f's = {s} lies off the curve and should raise ValueError'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>euler_path(v, x0, h, steps)</C>, which follows the velocity field v from x0 with Euler steps{" "}
          <C>x = x + h * v(x)</C> and returns a NumPy array of shape (steps + 1, n) holding every point, starting with x0. With{" "}
          <C>v(x) = -grad f(x)</C> this is gradient descent.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def euler_path(v, x0, h, steps):
    return np.array([x0])
`,
        solution: `import numpy as np

def euler_path(v, x0, h, steps):
    x = np.asarray(x0, float)
    path = [x]
    for _ in range(steps):
        x = x + h * np.asarray(v(x), float)
        path.append(x)
    return np.array(path)
`,
        tests: [
          { name: "gradient descent", code: `import numpy as np
P = euler_path(lambda x: -np.array([2 * x[0], 8 * x[1]]), [1.0, 1.0], 0.1, 3)
assert P.shape == (4, 2)
assert np.allclose(P, [[1, 1], [0.8, 0.2], [0.64, 0.04], [0.512, 0.008]]), P
x0 = np.array([1.0, 2.0]); euler_path(lambda x: -x, x0, 0.5, 2)
assert np.allclose(x0, [1, 2]), 'Do not change x0.'` },
          { name: "spirals out", code: `import numpy as np
P = euler_path(lambda x: np.array([-x[1], x[0]]), [1.0, 0.0], 0.1, 100)
r = np.linalg.norm(P, axis=1)
assert np.allclose(r, (1 + 0.01) ** (np.arange(101) / 2)), 'Each step multiplies the radius by sqrt(1 + h²).'` },
        ],
      },
    },
    {
      key: "reparam",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"\\varphi : [c, d] \\to [a, b]"}</M> is continuously differentiable, increasing and onto, then{" "}
          <M>{"\\gamma \\circ \\varphi"}</M> has the same arc length as γ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes the velocity of γ∘φ by the chain rule in each coordinate: γ′(φ(u)) φ′(u).",
          "Uses φ′(u) ≥ 0 to write its norm as ‖γ′(φ(u))‖ φ′(u).",
          "Applies the substitution t = φ(u), with φ(c) = a and φ(d) = b, to turn the integral into the length of γ.",
        ],
      },
    },
    {
      key: "drift",
      rung: "stretch",
      prompt: (
        <p>
          Euler&rsquo;s method on <M>{"v(x, y) = (-y, x)"}</M> starts at (1, 0) with h = 0.1. What is the radius after 100 steps?
          Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1.645, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what the velocity of a curve is, why the length of a path does not depend on how fast it is traced, and how gradient descent traces a curve in weight space.",

  glimpse: (
    <p>
      Curves vary along one direction at a time. Next, differentiation of functions of several variables begins with partial
      derivatives: how a function changes when you move along one coordinate axis and hold the others still.
    </p>
  ),
};
