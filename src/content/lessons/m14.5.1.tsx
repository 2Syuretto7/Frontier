import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PlateauModesViz } from "@/components/viz/PlateauModesViz";
import type { LessonContent } from "@/lib/types";

const SADDLE = `import numpy as np

def gd_saddle(a, b, x0, y0, lr, steps):
    x, y, path = x0, y0, [(x0, y0)]
    for _ in range(steps):
        x, y = x - lr * a * x, y + lr * b * y
        path.append((x, y))
    return path

def escape_step(path, radius):
    return next((t for t, (x, y) in enumerate(path) if abs(y) >= radius), None)

def escape_estimate(b, y0, lr, radius):
    return int(np.ceil(np.log(radius / abs(y0)) / np.log(1 + lr * b)))`;

const MODES = `import numpy as np

def gd_mode(a0, s, lr, steps):
    a, out = a0, []
    for _ in range(steps):
        a = a + lr * (s - a * a) * a
        out.append(a * a)
    return out

def flow_solution(a0, s, t):
    return s / (1 + (s / a0 ** 2 - 1) * np.exp(-2 * s * t))

def half_time(a0, s):
    return np.log(s / a0 ** 2 - 1) / (2 * s)`;

export const lesson: LessonContent = {
  id: "m14.5.1",
  minutes: 45,
  links: {
    requires: ["m5.5.3", "m14.1.1"],
    revisits: ["m6.3.4", "m10.5.1"],
    foreshadows: ["m14.5.2"],
  },

  puzzle: (
    <>
      <p>
        Train a deep linear network, which can only ever represent a linear map, from a small random initialisation. The
        loss does not fall smoothly. It sits on a plateau, drops suddenly, sits on another plateau, drops again. Nothing
        in the data changes between the drops, and the problem has no bad local minima at all. What is gradient descent
        waiting for on each plateau, and what decides how long it waits?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A saddle point has zero gradient, like a minimum, but some directions lead downhill. Gradient descent started near
        one moves away along those directions only as fast as its distance from the saddle grows, which is geometrically:
        each step multiplies the escaping component by a fixed factor. So the time to escape grows with the logarithm of how
        close to the saddle you start. A network initialised with small weights starts near the saddle at zero, and each
        pattern in the data, each singular mode of the target, is escaped separately, the strongest first. The plateaus
        are the waits; their lengths are logarithmic in the initial scale and inversely proportional to the strength of
        the mode.
      </p>
      <PlateauModesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="strict saddle">
        <p>
          A critical point x* of a twice-differentiable f is a strict saddle if <M>{"\\nabla^2f(x^*)"}</M> has at least
          one negative eigenvalue. Near it, the model case is <M>{"f(x, y) = \\tfrac12(ax^2 - by^2)"}</M> with a, b &gt; 0.
        </p>
      </Definition>

      <Theorem title="escaping a saddle">
        <p>
          Gradient descent with rate η &lt; 1/a on the model case gives{" "}
          <M>{"x_t = (1-\\eta a)^tx_0"}</M> and <M>{"y_t = (1+\\eta b)^ty_0"}</M>. It converges to the saddle only if{" "}
          <M>{"y_0 = 0"}</M>; otherwise <M>{"|y_t|"}</M> first reaches r at step{" "}
          <M>{"\\lceil\\ln(r/|y_0|)/\\ln(1+\\eta b)\\rceil"}</M>, which grows like <M>{"\\ln(1/|y_0|)/(\\eta b)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient is (ax, −by), so the coordinates evolve independently by the stated factors. If <M>{"y_0 \\ne 0"}</M>,
          then <M>{"|y_t|"}</M> grows without bound, and <M>{"(1+\\eta b)^t|y_0| \\ge r"}</M> is the same as{" "}
          <M>{"t \\ge \\ln(r/|y_0|)/\\ln(1+\\eta b)"}</M>. The set of starting points that converge to the saddle is the line
          y = 0, which has measure zero. The same holds near any strict saddle: the points attracted to it form a lower
          dimensional set, so random initialisation almost surely avoids it, though it may pass close and linger.
        </p>
        <Code>{SADDLE}</Code>
      </Proof>

      <Theorem title="sigmoidal learning of a mode">
        <p>
          Consider a two-layer linear network learning a target map with singular values <M>{"s_k"}</M>, initialised with
          balanced, aligned weights so that each mode has strength <M>{"a_k^2"}</M> and the modes decouple, with{" "}
          <M>{"\\dot a = (s - a^2)a"}</M> under gradient flow. Then
        </p>
        <MD>{"a(t)^2 = \\frac{s}{1 + (s/a_0^2 - 1)e^{-2st}},\\qquad t_{1/2} = \\frac{\\ln(s/a_0^2 - 1)}{2s}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"u = a^2"}</M>. Then <M>{"\\dot u = 2a\\dot a = 2(s - u)u"}</M>, the logistic equation. Write{" "}
          <M>{"u = s/(1 + Ce^{-2st})"}</M>: then <M>{"\\dot u = 2s^2Ce^{-2st}/(1+Ce^{-2st})^2"}</M>, and{" "}
          <M>{"s - u = sCe^{-2st}/(1+Ce^{-2st})"}</M>, so <M>{"2(s-u)u"}</M> is the same expression. The initial condition
          fixes <M>{"C = s/a_0^2 - 1"}</M>, and <M>{"u = s/2"}</M> when <M>{"Ce^{-2st} = 1"}</M>. The plateau is the time
          spent near the saddle u = 0, where <M>{"\\dot u \\approx 2su"}</M> grows only geometrically; its length is set
          by <M>{"\\ln(1/a_0^2)"}</M> and shrinks in proportion to 1/s, so strong modes are learned first.
        </p>
        <Code>{MODES}</Code>
      </Proof>

      <Remark title="saddles in real networks">
        <p>
          Symmetries make saddles unavoidable: swapping two hidden units, or scaling one layer up and the next down, maps
          critical points to critical points, and the set where two units coincide is full of saddles. For random
          high-dimensional functions, critical points with high loss are overwhelmingly saddles rather than minima,
          because a minimum needs every one of many eigenvalues to be positive. Gradient noise helps: it supplies a
          component along the escape direction at every step, so the waiting time depends on the noise level rather than
          on a lucky initial alignment. Plateaus followed by sudden drops are still seen in large models, often as a new
          capability appearing abruptly.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "escape",
      rung: "check",
      prompt: <p>At the saddle ½(x² − 2y²), gradient descent with η = 0.05 starts with y₀ = 10⁻⁶. At what step does |y| first reach 1?</p>,
      answer: { kind: "numeric", value: 145, tolerance: 0.5 },
    },
    {
      key: "half",
      rung: "check",
      prompt: <p>A mode with singular value s = 4 starts at a₀ = 0.001. Under gradient flow, at what time is half of it learned? Give two decimals.</p>,
      answer: { kind: "numeric", value: 1.9, tolerance: 0.006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does a deep linear network started from small weights show plateaus?</p>,
      answer: {
        kind: "choice",
        options: [
          "Zero weights form a saddle, and each mode's strength grows in proportion to itself, so it stays small for a time logarithmic in 1/a₀ before rising quickly",
          "The loss has many bad local minima that trap the iterate",
          "The learning rate is too large near zero",
          "Linear networks cannot represent the target until a later layer is added",
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

def gd_saddle(a, b, x0, y0, lr, steps):
    x, y, path = x0, y0, [(x0, y0)]
    for _ in range(steps):
        x, y = x - lr * a * x, y + lr * b * y
        path.append((x, y))
    return path

def escape_step(path, radius):
    return next((t for t, (x, y) in enumerate(path) if abs(y) >= radius), None)

def escape_estimate(b, y0, lr, radius):
    return int(np.ceil(np.log(radius / abs(y0)) / np.log(1 + lr * b)))

p = gd_saddle(1.0, 0.5, 1.0, 1e-3, 0.1, 200)
print(p[1], escape_step(p, 1.0), escape_estimate(0.5, 1e-3, 0.1, 1.0), round(p[100][0], 6))
print(escape_step(gd_saddle(1.0, 0.5, 1.0, 0.0, 0.1, 50), 1.0), escape_estimate(0.5, 1e-6, 0.1, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.9, 0.00105) 142 142 2.7e-05\nNone 284",
          "(0.9, 0.00095) 142 142 2.7e-05\nNone 284",
          "(0.9, 0.00105) 142 142 2.7e-05\n0 284",
          "(0.9, 0.00105) 71 71 2.7e-05\nNone 142",
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

def gd_mode(a0, s, lr, steps):
    a, out = a0, []
    for _ in range(steps):
        a = a + lr * (s - a * a) * a
        out.append(a * a)
    return out

def flow_solution(a0, s, t):
    return s / (1 + (s / a0 ** 2 - 1) * np.exp(-2 * s * t))

def half_time(a0, s):
    return np.log(s / a0 ** 2 - 1) / (2 * s)

print([round(v, 4) for v in gd_mode(0.1, 1.0, 0.5, 3)], round(float(flow_solution(0.1, 1.0, half_time(0.1, 1.0))), 3), round(float(half_time(0.01, 1.0)), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.0224, 0.0495, 0.1078] 0.5 4.61", "[0.0224, 0.0495, 0.1078] 1.0 4.61", "[0.0149, 0.0224, 0.0335] 0.5 4.61", "[0.0224, 0.0495, 0.1078] 0.5 2.3"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For <C>f = ½(a x² − b y²)</C>, write <C>gd_saddle(a, b, x0, y0, lr, steps)</C>, the list of (x, y) including the
          start; <C>escape_step(path, radius)</C>, the first index with |y| ≥ radius, or None; and{" "}
          <C>escape_estimate(b, y0, lr, radius)</C>, the formula from the theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_saddle(a, b, x0, y0, lr, steps):
    return [(x0, y0)]

def escape_step(path, radius):
    return None

def escape_estimate(b, y0, lr, radius):
    return 0
`,
        solution: SADDLE,
        tests: [
          { name: "path", code: `p = gd_saddle(2.0, 1.0, 0.5, 0.01, 0.2, 3); assert np.allclose(p, [(0.5, 0.01), (0.3, 0.012), (0.18, 0.0144), (0.108, 0.01728)])
assert escape_step(gd_saddle(1.0, 0.5, 1.0, 0.0, 0.1, 50), 1.0) is None and escape_step([(0, 0.1), (0, -2.0)], 1.0) == 1` },
          { name: "estimate", code: `assert escape_step(gd_saddle(1.0, 2.0, 1.0, 1e-6, 0.05, 400), 1.0) == 145 and escape_estimate(2.0, 1e-6, 0.05, 1.0) == 145
assert escape_estimate(0.5, -1e-3, 0.1, 1.0) == 142` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gd_mode(a0, s, lr, steps)</C>, the list of a² after each step of <C>a ← a + lr(s − a²)a</C>;{" "}
          <C>flow_solution(a0, s, t)</C>, the gradient-flow value of a² at time t; and <C>half_time(a0, s)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_mode(a0, s, lr, steps):
    return [a0 * a0] * steps

def flow_solution(a0, s, t):
    return s

def half_time(a0, s):
    return 0.0
`,
        solution: MODES,
        tests: [
          { name: "mode", code: `assert np.allclose(gd_mode(0.5, 2.0, 0.1, 2), [0.34515625, 0.46884431357303635]) and abs(flow_solution(0.3, 2.0, 0.0) - 0.09) < 1e-12
assert abs(flow_solution(0.1, 1.0, half_time(0.1, 1.0)) - 0.5) < 1e-12 and abs(half_time(0.01, 1.0) - np.log(9999) / 2) < 1e-12` },
          { name: "match", code: `out = gd_mode(1e-3, 2.0, 0.01, 5000); t = next(i for i, v in enumerate(out) if v >= 1.0)
assert abs(t * 0.01 - half_time(1e-3, 2.0)) < 0.05 and abs(out[1999] - flow_solution(1e-3, 2.0, 20.0)) < 0.05` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: <p>From a₀ = 0.001, how many times longer does a mode with s = 0.3 take to reach half strength than one with s = 3? Give two decimals.</p>,
      answer: { kind: "numeric", value: 8.46, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Escaping saddles is about directions of negative curvature. Once training settles, the question becomes how large
        the positive curvatures are where it settles: sharp or flat, and whether that matters for how the model
        generalises.
      </p>
    </>
  ),
};
