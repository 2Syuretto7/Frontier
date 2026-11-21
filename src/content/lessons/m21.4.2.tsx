import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HalfPlaneViz } from "@/components/viz/HalfPlaneViz";
import type { LessonContent } from "@/lib/types";

const METRIC = `import numpy as np

def curve_length(path, G):
    d = np.diff(path, axis=0)
    mid = (path[1:] + path[:-1]) / 2
    return float(sum(np.sqrt(v @ G(m) @ v) for v, m in zip(d, mid)))   # sum of |step| in the metric at its midpoint

def riem_grad(G, x, euclid_grad):
    return np.linalg.solve(G(x), euclid_grad)                         # G(x)^{-1} times the ordinary gradient

def pullback(Gx, J):
    return J.T @ Gx @ J                                                # the metric in new coordinates y, with x = phi(y)`;

const HYP = `import numpy as np

def hyperbolic_metric(p):
    return np.eye(2) / p[1] ** 2                                       # (dx^2 + dy^2) / y^2 on the upper half-plane

def hyperbolic_dist(p, q):
    (x1, y1), (x2, y2) = p, q
    return float(np.arccosh(1 + ((x1 - x2) ** 2 + (y1 - y2) ** 2) / (2 * y1 * y2)))

def polar_metric(r):
    return np.diag([1.0, r ** 2])                                      # dr^2 + r^2 dtheta^2`;

export const lesson: LessonContent = {
  id: "m21.4.2",
  minutes: 55,
  links: {
    requires: ["m21.4.1", "m6.7.1"],
    revisits: ["m5.5.5", "m5.2.5"],
    foreshadows: ["m21.4.3"],
  },

  puzzle: (
    <>
      <p>
        Rescale one parameter of a model, say by writing a weight w as 10u and training u instead. The function the model computes
        is unchanged, yet plain gradient descent on u behaves differently from gradient descent on w: the step in w is a hundred
        times larger. Steepest descent depends on how distances are measured in parameter space, and the Euclidean measure is an
        arbitrary choice. What does a principled choice look like, and how does it make the method independent of the
        parametrisation?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Riemannian metric assigns to every point its own inner product on tangent vectors, a positive definite matrix G(x). It
        decides how long a small step is, and so the length of curves, the distance between points, and which direction is
        steepest for a fixed step length. If the metric is defined from something intrinsic, not from the coordinates, then
        changing coordinates changes the matrix G in exactly the way that leaves all of these quantities alone.
      </p>
      <HalfPlaneViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Riemannian metric, length and distance">
        <p>
          A Riemannian metric on an open set of <M>{"\\mathbb{R}^d"}</M>, or on a manifold in coordinates, is a smooth choice of
          symmetric positive definite matrix G(x), giving the inner product <M>{"\\langle u, v\\rangle_x = u^\\top G(x) v"}</M>{" "}
          (m6.7.1). The length of a curve γ on [0, 1] is{" "}
          <M>{"L(\\gamma) = \\int_0^1 \\sqrt{\\gamma'(t)^\\top G(\\gamma(t))\\gamma'(t)}\\, dt"}</M> (<C>curve_length</C>), and the
          distance between two points is the infimum of the lengths of curves joining them. Curves that locally minimise length
          are geodesics.
        </p>
      </Definition>

      <Theorem title="steepest descent in a metric">
        <p>
          Among tangent vectors v with <M>{"v^\\top G(x)v = \\varepsilon^2"}</M>, the first-order decrease{" "}
          <M>{"-\\nabla f(x)^\\top v"}</M> is largest for{" "}
          <M>{"v \\propto -G(x)^{-1}\\nabla f(x)"}</M>, the negative Riemannian gradient (<C>riem_grad</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"w = G^{1/2}v"}</M> the constraint is <M>{"|w| = \\varepsilon"}</M> and the objective is{" "}
          <M>{"-(G^{-1/2}\\nabla f)^\\top w"}</M>, maximised by w parallel to <M>{"-G^{-1/2}\\nabla f"}</M> by Cauchy-Schwarz, which
          gives <M>{"v = G^{-1/2}w \\propto -G^{-1}\\nabla f"}</M>. A Lagrange multiplier argument (m5.5.5) gives the same answer.
          For G = I this is the ordinary gradient; on an embedded manifold with the inherited metric it is the projected gradient
          of m21.4.1.
        </p>
        <Code>{METRIC}</Code>
      </Proof>

      <Theorem title="invariance under change of coordinates">
        <p>
          Let x = φ(y) with invertible Jacobian J = Dφ(y), and define the metric in y coordinates by the pullback{" "}
          <M>{"G_y = J^\\top G_x J"}</M> (<C>pullback</C>). Then lengths of curves are the same in both coordinates, and the
          Riemannian gradient in y, mapped by J, equals the Riemannian gradient in x.
        </p>
      </Theorem>
      <Proof>
        <p>
          A curve y(t) has x(t) = φ(y(t)) with x&apos; = Jy&apos;, so{" "}
          <M>{"y'^\\top G_y y' = y'^\\top J^\\top G_x J y' = x'^\\top G_x x'"}</M> and the integrands agree. By the chain rule
          (m5.2.5), <M>{"\\nabla_y f = J^\\top\\nabla_x f"}</M>, so{" "}
          <M>{"J G_y^{-1}\\nabla_y f = J J^{-1}G_x^{-1}J^{-\\top}J^\\top\\nabla_x f = G_x^{-1}\\nabla_x f"}</M>. With the Euclidean
          metric in both coordinates, by contrast, <M>{"J\\nabla_y f = JJ^\\top\\nabla_x f"}</M>, which differs from{" "}
          <M>{"\\nabla_x f"}</M> unless J is orthogonal: for w = 10u, J = 10 and the step in w is a hundred times larger.
        </p>
      </Proof>

      <Example title="polar coordinates and the hyperbolic plane">
        <p>
          The Euclidean metric in polar coordinates (r, θ) is <M>{"\\operatorname{diag}(1, r^2)"}</M> (<C>polar_metric</C>), the
          pullback of the identity; the quarter circle r = 3 has length 3π/2. The upper half-plane with{" "}
          <M>{"G(x, y) = I/y^2"}</M> (<C>hyperbolic_metric</C>) is the hyperbolic plane. A vertical segment from height a to b has
          length <M>{"\\int_a^b dy/y = \\log(b/a)"}</M>, the boundary y = 0 is infinitely far away, geodesics are vertical lines
          and arcs of circles centred on the boundary, and the distance is{" "}
          <M>{"\\operatorname{arccosh}\\big(1 + \\frac{|p - q|^2}{2y_py_q}\\big)"}</M> (<C>hyperbolic_dist</C>).
        </p>
        <Code>{HYP}</Code>
      </Example>

      <Remark title="why hyperbolic space for hierarchies">
        <p>
          In the hyperbolic plane the circumference of a circle of radius r grows like <M>{"e^r"}</M>, as the number of nodes at
          depth r of a tree does, while in Euclidean space it grows like r. Nickel and Kiela embedded large taxonomies in
          low-dimensional hyperbolic space with far less distortion than Euclidean embeddings of the same dimension. Optimising
          such embeddings needs exactly the Riemannian gradient of this lesson: the Euclidean gradient rescaled by{" "}
          <M>{"y^2"}</M> in the half-plane, followed by a step that stays in the space.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "vert",
      rung: "check",
      prompt: <p>What is the hyperbolic distance between (0, 1) and (0, 5) in the upper half-plane? Give three decimals.</p>,
      answer: { kind: "numeric", value: 1.609, tolerance: 0.0006 },
    },
    {
      key: "polar",
      rung: "check",
      prompt: (
        <p>
          In polar coordinates with metric <M>{"\\operatorname{diag}(1, r^2)"}</M>, what is the length of the curve r = 2, θ from 0
          to π? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.283, tolerance: 0.0006 },
    },
    {
      key: "invar",
      rung: "apply",
      prompt: <p>Why does writing w = 10u change the behaviour of plain gradient descent but not of Riemannian gradient descent with a pulled-back metric?</p>,
      answer: {
        kind: "choice",
        options: [
          "The gradient in u is 10 times the gradient in w and a step in u moves w 10 times as far, while the pulled-back metric divides by 100 and cancels both factors",
          "Because Riemannian gradient descent uses a smaller learning rate",
          "Because the loss function is different in u",
          "Because plain gradient descent cannot handle scalar parameters",
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

def curve_length(path, G):
    d = np.diff(path, axis=0)
    mid = (path[1:] + path[:-1]) / 2
    return float(sum(np.sqrt(v @ G(m) @ v) for v, m in zip(d, mid)))   # sum of |step| in the metric at its midpoint

def riem_grad(G, x, euclid_grad):
    return np.linalg.solve(G(x), euclid_grad)                         # G(x)^{-1} times the ordinary gradient

def pullback(Gx, J):
    return J.T @ Gx @ J                                                # the metric in new coordinates y, with x = phi(y)

E = lambda p: np.eye(2); G = lambda p: np.diag([1.0, 4.0]); path = np.array([[0.0, 0.0], [3.0, 0.0], [3.0, 4.0]])
print(curve_length(path, E), curve_length(path, G), riem_grad(G, np.zeros(2), np.array([2.0, 2.0])).tolist(), pullback(np.eye(2), np.array([[2.0, 0.0], [0.0, 1.0]])).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7.0 11.0 [2.0, 0.5] [[4.0, 0.0], [0.0, 1.0]]",
          "7.0 19.0 [2.0, 0.5] [[4.0, 0.0], [0.0, 1.0]]",
          "7.0 11.0 [2.0, 8.0] [[4.0, 0.0], [0.0, 1.0]]",
          "7.0 11.0 [2.0, 0.5] [[2.0, 0.0], [0.0, 1.0]]",
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

def hyperbolic_metric(p):
    return np.eye(2) / p[1] ** 2                                       # (dx^2 + dy^2) / y^2 on the upper half-plane

def hyperbolic_dist(p, q):
    (x1, y1), (x2, y2) = p, q
    return float(np.arccosh(1 + ((x1 - x2) ** 2 + (y1 - y2) ** 2) / (2 * y1 * y2)))

def polar_metric(r):
    return np.diag([1.0, r ** 2])                                      # dr^2 + r^2 dtheta^2

print(hyperbolic_metric(np.array([0.0, 2.0])).tolist(), round(hyperbolic_dist((0.0, 1.0), (0.0, np.e ** 2)), 3), round(hyperbolic_dist((0.0, 1.0), (2.0, 1.0)), 3), polar_metric(3.0).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25, 0.0], [0.0, 0.25]] 2.0 1.763 [[1.0, 0.0], [0.0, 9.0]]",
          "[[0.25, 0.0], [0.0, 0.25]] 2.0 2.0 [[1.0, 0.0], [0.0, 9.0]]",
          "[[4.0, 0.0], [0.0, 4.0]] 2.0 1.763 [[1.0, 0.0], [0.0, 9.0]]",
          "[[0.25, 0.0], [0.0, 0.25]] 2.0 1.763 [[1.0, 0.0], [0.0, 3.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>curve_length(path, G)</C> for a polygonal path, evaluating the metric at the midpoint of each segment,{" "}
          <C>riem_grad(G, x, euclid_grad)</C>, and <C>pullback(Gx, J)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def curve_length(path, G):
    return float(np.sum(np.linalg.norm(np.diff(path, axis=0), axis=1)))

def riem_grad(G, x, euclid_grad):
    return euclid_grad

def pullback(Gx, J):
    return Gx
`,
        solution: METRIC,
        tests: [
          { name: "len", code: `assert abs(curve_length(np.array([[0.0, 0.0], [0.0, 2.0]]), lambda p: np.diag([1.0, 9.0])) - 6.0) < 1e-12\nassert abs(curve_length(np.array([[0.0, 0.0], [3.0, 4.0]]), lambda p: np.eye(2)) - 5.0) < 1e-12` },
          { name: "grad", code: `assert np.allclose(riem_grad(lambda x: np.diag([2.0, 4.0]), np.zeros(2), np.array([2.0, 2.0])), [1.0, 0.5])\nassert np.allclose(pullback(np.diag([1.0, 4.0]), np.array([[1.0, 1.0], [0.0, 1.0]])), [[1.0, 1.0], [1.0, 5.0]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hyperbolic_metric(p)</C> for the upper half-plane, <C>hyperbolic_dist(p, q)</C>, and <C>polar_metric(r)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hyperbolic_metric(p):
    return np.eye(2)

def hyperbolic_dist(p, q):
    return float(np.hypot(p[0] - q[0], p[1] - q[1]))

def polar_metric(r):
    return np.eye(2)
`,
        solution: HYP,
        tests: [
          { name: "metric", code: `assert np.allclose(hyperbolic_metric(np.array([5.0, 0.5])), 4 * np.eye(2)) and np.allclose(polar_metric(2.0), np.diag([1.0, 4.0]))` },
          { name: "dist", code: `assert abs(hyperbolic_dist((0.0, 1.0), (0.0, 3.0)) - np.log(3.0)) < 1e-12 and abs(hyperbolic_dist((1.0, 2.0), (1.0, 2.0))) < 1e-12\nassert abs(hyperbolic_dist((0.0, 1.0), (2.0, 1.0)) - np.arccosh(3.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "saving",
      rung: "stretch",
      prompt: (
        <p>
          In the hyperbolic upper half-plane, the straight horizontal segment from (−1, 1) to (1, 1) is not a geodesic. By how much
          does its length exceed the distance between its endpoints? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.237, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Which metric should a parameter space of probability models carry? The next lesson shows that there is an essentially
        canonical one, the Fisher information metric, defined by how distinguishable nearby distributions are, and that steepest
        descent in it is the natural gradient.
      </p>
    </>
  ),
};
