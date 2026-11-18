import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SamValleyViz } from "@/components/viz/SamValleyViz";
import type { LessonContent } from "@/lib/types";

const SHARP = `import numpy as np

def min_sharpness(c, y):
    return c * c + (y / c) ** 2

def relu_out(x, u, v):
    return v * np.maximum(u * np.asarray(x, float), 0.0)

def loss_hessian(xs, ys, u, v, eps=1e-4):
    def L(p):
        return 0.5 * float(np.mean((relu_out(xs, p[0], p[1]) - ys) ** 2))
    p, H = np.array([u, v], float), np.zeros((2, 2))
    for i in range(2):
        for j in range(2):
            e_i, e_j = np.eye(2)[i] * eps, np.eye(2)[j] * eps
            H[i, j] = (L(p + e_i + e_j) - L(p + e_i - e_j) - L(p - e_i + e_j) + L(p - e_i - e_j)) / (4 * eps * eps)
    return H`;

const SAM = `import numpy as np

def grad_uv(u, v, y):
    r = u * v - y
    return np.array([r * v, r * u])

def sam_uv(u, v, y, lr, rho, steps):
    w, path = np.array([u, v], float), []
    for _ in range(steps):
        g = grad_uv(*w, y)
        n = np.linalg.norm(g)
        e = rho * g / n if n > 0 else np.zeros(2)
        w = w - lr * grad_uv(*(w + e), y)
        path.append(w.copy())
    return path

def ball_max(H, rho):
    return 0.5 * rho * rho * float(np.linalg.eigvalsh(np.asarray(H, float))[-1])`;

export const lesson: LessonContent = {
  id: "m14.5.2",
  minutes: 45,
  links: {
    requires: ["m14.5.1", "m14.4.1"],
    revisits: ["m5.5.2"],
    foreshadows: ["m14.5.3"],
  },

  puzzle: (
    <>
      <p>
        A popular claim says that flat minima generalise better than sharp ones, and an optimiser built on it, SAM, really
        does improve test accuracy on many image benchmarks. Yet there is a simple proof that sharpness, as usually
        measured, can be made as large as you like without changing the function a ReLU network computes at all. How can
        both be true, and what does SAM actually minimise?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Sharpness is the largest curvature of the loss at a minimum: how fast the loss rises if the weights are nudged
        in the worst direction. But the same function can sit at many points in weight space, and nudges are measured in
        weight units. Scale the first layer of a ReLU network up by α and the second down by α: the outputs do not change,
        while curvatures in different directions change by factors of α². So sharpness depends on the parametrisation, not
        only on the function. SAM asks for weights whose loss stays low within a ball of radius ρ, and on a valley of
        equally good minima that preference is exactly a preference for low sharpness. Whether that helps depends on
        whether the parametrisation makes the ball meaningful.
      </p>
      <SamValleyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sharpness and SAM">
        <p>
          The sharpness of a loss L at w is <M>{"\\lambda_{\\max}(\\nabla^2L(w))"}</M>. Sharpness-aware minimisation
          (SAM) targets <M>{"L^{\\text{SAM}}_\\rho(w) = \\max_{\\|\\epsilon\\|\\le\\rho}L(w+\\epsilon)"}</M> and approximates
          its gradient by <M>{"\\nabla L(w + \\rho g/\\|g\\|)"}</M> with <M>{"g = \\nabla L(w)"}</M>: one ascent step, then a
          descent step taken with the gradient found there.
        </p>
      </Definition>

      <Theorem title="sharpness is not a property of the function">
        <p>
          For <M>{"L(u, v) = \\tfrac12(uv - y)^2"}</M> with y ≠ 0, every point (c, y/c) is a global minimum computing the
          same product, and its sharpness is <M>{"c^2 + y^2/c^2"}</M>, which takes every value in{" "}
          <M>{"[2|y|, \\infty)"}</M>. For a network <M>{"x \\mapsto v\\,\\mathrm{ReLU}(ux)"}</M>, the map{" "}
          <M>{"(u, v) \\mapsto (\\alpha u, v/\\alpha)"}</M> with α &gt; 0 leaves every output unchanged.
        </p>
      </Theorem>
      <Proof>
        <p>
          At uv = y the Hessian of the uv loss is <M>{"(v, u)^\\top(v, u)"}</M>, with nonzero eigenvalue{" "}
          <M>{"u^2 + v^2 = c^2 + y^2/c^2"}</M>; by the AM–GM inequality this is at least 2|y|, with equality at{" "}
          <M>{"c^2 = |y|"}</M>, and it tends to infinity as c → 0 or c → ∞. For the ReLU network,{" "}
          <M>{"\\mathrm{ReLU}(\\alpha ux) = \\alpha\\,\\mathrm{ReLU}(ux)"}</M> for α &gt; 0, so{" "}
          <M>{"(v/\\alpha)\\,\\mathrm{ReLU}(\\alpha ux) = v\\,\\mathrm{ReLU}(ux)"}</M>. The loss is therefore the same
          function of the outputs, but its Hessian with respect to (u, v) changes, as the code shows numerically.
        </p>
        <Code>{SHARP}</Code>
      </Proof>

      <Theorem title="on a valley, SAM sees sharpness">
        <p>
          If w is a minimum with L(w) = 0 and L is three times differentiable, then{" "}
          <M>{"L^{\\text{SAM}}_\\rho(w) = \\tfrac12\\rho^2\\lambda_{\\max}(\\nabla^2L(w)) + O(\\rho^3)"}</M>. Away from the
          valley, to first order in ρ, <M>{"L^{\\text{SAM}}_\\rho(w) \\approx L(w) + \\rho\\|\\nabla L(w)\\|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          At a minimum the gradient vanishes, so Taylor&apos;s theorem gives{" "}
          <M>{"L(w+\\epsilon) = \\tfrac12\\epsilon^\\top H\\epsilon + O(\\|\\epsilon\\|^3)"}</M>, and the maximum of the
          quadratic form over the ball of radius ρ is <M>{"\\tfrac12\\rho^2\\lambda_{\\max}(H)"}</M>, attained along the top
          eigenvector. Away from a minimum the linear term dominates:{" "}
          <M>{"L(w+\\epsilon) \\approx L(w) + g\\cdot\\epsilon"}</M>, maximised at{" "}
          <M>{"\\epsilon = \\rho g/\\|g\\|"}</M>, which is where SAM evaluates its gradient. So on a valley of minima SAM
          descends the sharpness, drifting towards the flattest point, as in the figure.
        </p>
        <Code>{SAM}</Code>
      </Proof>

      <Remark title="what to make of flatness">
        <p>
          Because sharpness changes under reparametrisation, a bare &quot;flat minima generalise&quot; cannot be a theorem.
          What survives is narrower: for a fixed architecture and a fixed parametrisation, often with normalisation layers
          that remove the scaling freedom, flatter solutions found by SAM, larger learning rates or smaller batches tend
          to test better, and scale-invariant versions of sharpness correlate better still. Training dynamics also cap
          sharpness directly: gradient descent cannot stay where the sharpness exceeds 2/η, which is the subject of the
          next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sharp",
      rung: "check",
      prompt: <p>The minimum (u, v) = (3, 1/3) of ½(uv − 1)² has what sharpness? Give two decimals.</p>,
      answer: { kind: "numeric", value: 9.11, tolerance: 0.006 },
    },
    {
      key: "ball",
      rung: "check",
      prompt: <p>At a minimum with zero loss, the Hessian&apos;s largest eigenvalue is 50. To second order, what is the SAM objective with ρ = 0.05?</p>,
      answer: { kind: "numeric", value: 0.0625, tolerance: 0.000001 },
    },
    {
      key: "param",
      rung: "apply",
      prompt: <p>Why can the sharpness of a minimum not by itself determine how well a ReLU network generalises?</p>,
      answer: {
        kind: "choice",
        options: [
          "Rescaling one layer up and the next down leaves the function, and so its test error, unchanged while changing the Hessian and its sharpness",
          "Sharpness cannot be computed for ReLU networks because they are not differentiable",
          "All minima of a ReLU network have the same sharpness",
          "Sharpness only depends on the training data, not on the weights",
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

def min_sharpness(c, y):
    return c * c + (y / c) ** 2

def relu_out(x, u, v):
    return v * np.maximum(u * np.asarray(x, float), 0.0)

def loss_hessian(xs, ys, u, v, eps=1e-4):
    def L(p):
        return 0.5 * float(np.mean((relu_out(xs, p[0], p[1]) - ys) ** 2))
    p, H = np.array([u, v], float), np.zeros((2, 2))
    for i in range(2):
        for j in range(2):
            e_i, e_j = np.eye(2)[i] * eps, np.eye(2)[j] * eps
            H[i, j] = (L(p + e_i + e_j) - L(p + e_i - e_j) - L(p - e_i + e_j) + L(p - e_i - e_j)) / (4 * eps * eps)
    return H

xs = np.array([1.0, 2.0, -1.0]); ys = np.array([2.0, 4.0, 0.0])
print(min_sharpness(1.0, 1.0), min_sharpness(4.0, 2.0), relu_out(xs, 1.0, 2.0).tolist(), relu_out(xs, 4.0, 0.5).tolist())
print(np.round(loss_hessian(xs, ys, 1.0, 2.0), 3).tolist(), np.round(loss_hessian(xs, ys, 4.0, 0.5), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 16.25 [2.0, 4.0, 0.0] [2.0, 4.0, 0.0]\n[[6.667, 3.333], [3.333, 1.667]] [[0.417, 3.333], [3.333, 26.667]]",
          "2.0 16.25 [2.0, 4.0, 0.0] [2.0, 4.0, -2.0]\n[[6.667, 3.333], [3.333, 1.667]] [[0.417, 3.333], [3.333, 26.667]]",
          "2.0 16.25 [2.0, 4.0, 0.0] [2.0, 4.0, 0.0]\n[[6.667, 3.333], [3.333, 1.667]] [[6.667, 3.333], [3.333, 1.667]]",
          "2.0 4.25 [2.0, 4.0, 0.0] [2.0, 4.0, 0.0]\n[[6.667, 3.333], [3.333, 1.667]] [[0.417, 3.333], [3.333, 26.667]]",
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

def grad_uv(u, v, y):
    r = u * v - y
    return np.array([r * v, r * u])

def sam_uv(u, v, y, lr, rho, steps):
    w, path = np.array([u, v], float), []
    for _ in range(steps):
        g = grad_uv(*w, y)
        n = np.linalg.norm(g)
        e = rho * g / n if n > 0 else np.zeros(2)
        w = w - lr * grad_uv(*(w + e), y)
        path.append(w.copy())
    return path

def ball_max(H, rho):
    return 0.5 * rho * rho * float(np.linalg.eigvalsh(np.asarray(H, float))[-1])

print(grad_uv(2.0, 1.0, 1.0).tolist(), round(ball_max([[4.0, 0.0], [0.0, 1.0]], 0.1), 4))
u, v = sam_uv(2.0, 0.55, 1.0, 0.05, 0.1, 4000)[-1]; print(round(u * v, 3), round(u * u + v * v, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1.0, 2.0] 0.02\n1.0 2.0", "[2.0, 1.0] 0.02\n1.0 2.0", "[1.0, 2.0] 0.005\n1.0 2.0", "[1.0, 2.0] 0.02\n1.0 4.25"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>min_sharpness(c, y)</C>, the sharpness of the minimum (c, y/c) of ½(uv − y)²; <C>relu_out(x, u, v)</C>,
          the outputs <C>v·ReLU(u·x)</C> for an array x; and <C>loss_hessian(xs, ys, u, v, eps=1e-4)</C>, the 2 × 2 Hessian
          of the mean of ½(relu_out − y)² with respect to (u, v) by central differences.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def min_sharpness(c, y):
    return 2 * abs(y)

def relu_out(x, u, v):
    return v * u * np.asarray(x, float)

def loss_hessian(xs, ys, u, v, eps=1e-4):
    return np.eye(2)
`,
        solution: SHARP,
        tests: [
          { name: "basics", code: `assert abs(min_sharpness(4.0, 2.0) - 16.25) < 1e-12 and abs(min_sharpness(1.0, -1.0) - 2) < 1e-12
x = np.array([1.0, 2.0, -1.0, 0.5]); assert np.allclose(relu_out(x, 1.0, 2.0), [2, 4, 0, 1]) and np.allclose(relu_out(x, 4.0, 0.5), relu_out(x, 1.0, 2.0))` },
          { name: "hessian", code: `H = loss_hessian(np.array([1.0, 2.0]), np.array([2.0, 4.0]), 1.0, 2.0); assert np.allclose(H, [[10, 5], [5, 2.5]], atol=1e-3)
xs = np.array([1.0, 2.0, -1.0]); ys = np.array([2.0, 4.0, 0.0]); a, b = loss_hessian(xs, ys, 1.0, 2.0), loss_hessian(xs, ys, 4.0, 0.5)
assert abs(np.linalg.eigvalsh(b)[-1] / np.linalg.eigvalsh(a)[-1] - 27.0833 / 8.3333) < 1e-2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grad_uv(u, v, y)</C>, the gradient of ½(uv − y)² as an array; <C>sam_uv(u, v, y, lr, rho, steps)</C>,
          returning the list of (u, v) arrays after each SAM step (no ascent when the gradient is zero); and{" "}
          <C>ball_max(H, rho)</C>, the second-order SAM objective at a minimum with Hessian H.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def grad_uv(u, v, y):
    return np.zeros(2)

def sam_uv(u, v, y, lr, rho, steps):
    return [np.array([u, v])] * steps

def ball_max(H, rho):
    return 0.0
`,
        solution: SAM,
        tests: [
          { name: "steps", code: `assert np.allclose(grad_uv(2.0, 1.0, 1.0), [1, 2]) and np.allclose(sam_uv(1.0, 2.0, 1.0, 0.1, 0.1, 2), [[0.74898862, 1.86625927], [0.63432944, 1.81555314]])
assert np.allclose(sam_uv(1.0, 1.0, 1.0, 0.1, 0.5, 3), [[1, 1]] * 3)` },
          { name: "valley", code: `assert abs(ball_max([[4.0, 0.0], [0.0, 1.0]], 0.1) - 0.02) < 1e-12 and abs(ball_max([[2.0, 1.0], [1.0, 2.0]], 1.0) - 1.5) < 1e-12
u, v = sam_uv(2.0, 0.55, 1.0, 0.05, 0.1, 4000)[-1]; assert abs(u * v - 1) < 0.01 and u * u + v * v < 2.05
u, v = sam_uv(2.0, 0.55, 1.0, 0.05, 0.0, 4000)[-1]; assert u * u + v * v > 4` },
        ],
      },
    },
    {
      key: "solve",
      rung: "stretch",
      prompt: <p>A minimum of ½(uv − 2)² has sharpness 5. What is the larger of the two possible values of u²?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        SAM pushes towards flat regions on purpose. Plain gradient descent turns out to do something similar on its own:
        with a large enough learning rate the sharpness climbs until it reaches 2/η and then hovers there, the edge of
        stability.
      </p>
    </>
  ),
};
