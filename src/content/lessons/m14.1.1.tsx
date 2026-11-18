import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ConvergenceBoundsViz } from "@/components/viz/ConvergenceBoundsViz";
import type { LessonContent } from "@/lib/types";

const GD = `import numpy as np

def gd(grad, x0, lr, steps):
    xs = [np.asarray(x0, dtype=float)]
    for _ in range(steps):
        xs.append(xs[-1] - lr * grad(xs[-1]))
    return xs

def min_grad_sq(grad, xs):
    return min(float(np.sum(grad(x) ** 2)) for x in xs)

def bounds(L, mu, gap0, dist0, k):
    return {
        'nonconvex': 2 * L * gap0 / k,
        'convex': L * dist0 ** 2 / (2 * k),
        'strong': (1 - mu / L) ** k * gap0,
    }`;

const SGD = `import numpy as np

def sgd_quadratic(a, x0, lr, sigma, steps, seed=0):
    rng = np.random.default_rng(seed)
    x, fs = x0, []
    for _ in range(steps):
        x = x - lr * (a * x + sigma * rng.normal())
        fs.append(0.5 * a * x * x)
    return np.array(fs)

def noise_floor(a, lr, sigma):
    return lr * sigma ** 2 / (2 * (2 - lr * a))

def tail_mean(fs, frac=0.5):
    return float(np.mean(fs[int(len(fs) * (1 - frac)):]))`;

export const lesson: LessonContent = {
  id: "m14.1.1",
  minutes: 50,
  links: {
    requires: ["m10.5.2"],
    revisits: ["m10.5.1"],
    foreshadows: ["m14.1.2", "m14.4.5"],
  },

  puzzle: (
    <>
      <p>
        Convex optimisation comes with guarantees: the gap to the optimum shrinks like 1/k, or geometrically when the
        function is strongly convex. A neural network&apos;s loss is not convex, has no unique minimum, and is optimised with
        noisy gradients, yet it trains. What, if anything, can be proved about gradient descent there, and what does the
        noise change?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        One inequality does most of the work. If the gradient changes slowly, with Lipschitz constant L, a small enough step
        along the negative gradient lowers the loss by an amount proportional to the squared gradient norm. Summing over
        steps, the total decrease cannot exceed the starting gap, so the gradient cannot stay large for long. That gives a
        guarantee with no convexity at all, but only about gradients becoming small, not about reaching the minimum.
        Convexity turns small gradients into small gaps; strong convexity makes the gap shrink by a fixed factor each step.
        With noisy gradients a constant step stops improving at a floor set by the step size and the noise.
      </p>
      <ConvergenceBoundsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the three settings">
        <p>
          f is L-smooth if <M>{"\\|\\nabla f(x) - \\nabla f(y)\\| \\le L\\|x - y\\|"}</M>, which implies{" "}
          <M>{"f(y) \\le f(x) + \\nabla f(x)^\\top(y - x) + \\tfrac L2\\|y - x\\|^2"}</M>. It is convex if it lies above its
          tangents, and μ-strongly convex if <M>{"f(y) \\ge f(x) + \\nabla f(x)^\\top (y - x) + \\tfrac\\mu2 \\|y - x\\|^2"}</M>.
          Gradient descent is <M>{"x_{k+1} = x_k - \\eta\\nabla f(x_k)"}</M>.
        </p>
      </Definition>

      <Theorem title="rates for gradient descent with η = 1/L">
        <p>Let f be L-smooth and bounded below by f*, with minimiser x* when one exists.</p>
        <MD>{"\\text{non-convex: } \\min_{j<k}\\|\\nabla f(x_j)\\|^2 \\le \\frac{2L(f(x_0) - f^*)}{k},\\qquad \\text{convex: } f(x_k) - f^* \\le \\frac{L\\|x_0 - x^*\\|^2}{2k},"}</MD>
        <MD>{"\\mu\\text{-strongly convex: } f(x_k) - f^* \\le \\Big(1 - \\frac\\mu L\\Big)^k (f(x_0) - f^*)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Smoothness with <M>{"y = x - \\nabla f(x)/L"}</M> gives the descent lemma{" "}
          <M>{"f(x_{j+1}) \\le f(x_j) - \\tfrac{1}{2L}\\|\\nabla f(x_j)\\|^2"}</M>. Summing over j &lt; k,{" "}
          <M>{"\\tfrac1{2L}\\sum_j \\|\\nabla f(x_j)\\|^2 \\le f(x_0) - f^*"}</M>, and the minimum is at most the average: the
          non-convex bound. Strong convexity minimised over y gives{" "}
          <M>{"f(x) - f^* \\le \\tfrac1{2\\mu}\\|\\nabla f(x)\\|^2"}</M> (the Polyak–Łojasiewicz inequality), so the descent
          lemma becomes <M>{"f(x_{j+1}) - f^* \\le (1 - \\mu/L)(f(x_j) - f^*)"}</M>. For the convex case, combine the descent
          lemma with convexity to get{" "}
          <M>{"f(x_{j+1}) - f^* \\le \\tfrac L2(\\|x_j - x^*\\|^2 - \\|x_{j+1} - x^*\\|^2)"}</M>; the sum telescopes, and since
          the gaps decrease, k times the last is at most the sum.
        </p>
        <Code>{GD}</Code>
      </Proof>

      <Theorem title="a noise floor for stochastic gradients">
        <p>
          On <M>{"f(x) = \\tfrac a2 x^2"}</M> with gradient estimates <M>{"ax + \\sigma\\xi"}</M>, ξ standard normal and
          independent across steps, SGD with constant step <M>{"\\eta < 2/a"}</M> has{" "}
          <M>{"\\mathbb E f(x_k) \\to \\frac{\\eta\\sigma^2}{2(2 - \\eta a)}"}</M>, about ησ²/4 for small η.
        </p>
      </Theorem>
      <Proof>
        <p>
          The iteration <M>{"x_{k+1} = (1 - \\eta a) x_k - \\eta\\sigma\\xi_k"}</M> has mean tending to zero and variance
          satisfying <M>{"v_{k+1} = (1 - \\eta a)^2 v_k + \\eta^2\\sigma^2"}</M>, whose fixed point is{" "}
          <M>{"v = \\eta^2\\sigma^2/(1 - (1 - \\eta a)^2) = \\eta\\sigma^2/(a(2 - \\eta a))"}</M>. Then{" "}
          <M>{"\\mathbb E f = \\tfrac a2 (\\text{mean}^2 + v)"}</M> tends to the stated value. Halving the step halves the floor
          but also the speed of the deterministic part, which is the trade-off every learning-rate schedule negotiates.
        </p>
        <Code>{SGD}</Code>
      </Proof>

      <Remark title="what the theory does and does not say">
        <p>
          In the non-convex case the guarantee is a stationary point, which could be a saddle; the 1/k rate is for the best
          iterate, not the last. For SGD on non-convex L-smooth functions with variance σ² the analogous result is{" "}
          <M>{"\\min_j \\mathbb E\\|\\nabla f(x_j)\\|^2 \\le \\tfrac{2(f(x_0) - f^*)}{\\eta k} + \\eta L\\sigma^2"}</M>, so the
          step must shrink like <M>{"1/\\sqrt k"}</M> to drive both terms down. Deep-learning losses are not globally smooth
          either; the edge-of-stability lesson later in this course shows training running happily at η &gt; 2/L.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "steps",
      rung: "check",
      prompt: <p>An L-smooth function with L = 10 starts with f(x₀) − f* = 5. How many steps of gradient descent with η = 1/L guarantee that some iterate has ‖∇f‖² ≤ 0.01?</p>,
      answer: { kind: "numeric", value: 10000, tolerance: 0.5 },
    },
    {
      key: "linear",
      rung: "check",
      prompt: <p>With μ = 1 and L = 100, by what factor does the strongly convex bound shrink the gap over 100 steps? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.366, tolerance: 0.0006 },
    },
    {
      key: "floor",
      rung: "apply",
      prompt: <p>SGD with a constant learning rate has plateaued. Halving the learning rate makes the loss drop again, then plateau lower. Why?</p>,
      answer: {
        kind: "choice",
        options: [
          "With a constant step the iterates fluctuate around the minimum at a level proportional to the step times the gradient noise; halving the step roughly halves that floor",
          "The smaller step escapes a saddle point",
          "The gradient noise itself is halved",
          "Smaller steps make the function more convex",
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

def gd(grad, x0, lr, steps):
    xs = [np.asarray(x0, dtype=float)]
    for _ in range(steps):
        xs.append(xs[-1] - lr * grad(xs[-1]))
    return xs

def min_grad_sq(grad, xs):
    return min(float(np.sum(grad(x) ** 2)) for x in xs)

def bounds(L, mu, gap0, dist0, k):
    return {
        'nonconvex': 2 * L * gap0 / k,
        'convex': L * dist0 ** 2 / (2 * k),
        'strong': (1 - mu / L) ** k * gap0,
    }

H = np.diag([1.0, 4.0]); g = lambda x: H @ x; xs = gd(g, [1.0, 1.0], 0.25, 3)
print([x.tolist() for x in xs], min_grad_sq(g, xs))
print({k: round(v, 4) for k, v in bounds(4.0, 1.0, 2.5, 1.5, 10).items()})`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 1.0], [0.75, 0.0], [0.5625, 0.0], [0.421875, 0.0]] 0.177978515625\n{'nonconvex': 2.0, 'convex': 0.45, 'strong': 0.1408}",
          "[[1.0, 1.0], [0.75, 0.0], [0.5625, 0.0], [0.421875, 0.0]] 0.177978515625\n{'nonconvex': 2.0, 'convex': 0.45, 'strong': 0.0563}",
          "[[1.0, 1.0], [0.75, 0.75], [0.5625, 0.5625], [0.421875, 0.421875]] 2.8476\n{'nonconvex': 2.0, 'convex': 0.45, 'strong': 0.1408}",
          "[[1.0, 1.0], [0.75, 0.0], [0.5625, 0.0], [0.421875, 0.0]] 0.177978515625\n{'nonconvex': 0.5, 'convex': 0.45, 'strong': 0.1408}",
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

def sgd_quadratic(a, x0, lr, sigma, steps, seed=0):
    rng = np.random.default_rng(seed)
    x, fs = x0, []
    for _ in range(steps):
        x = x - lr * (a * x + sigma * rng.normal())
        fs.append(0.5 * a * x * x)
    return np.array(fs)

def noise_floor(a, lr, sigma):
    return lr * sigma ** 2 / (2 * (2 - lr * a))

def tail_mean(fs, frac=0.5):
    return float(np.mean(fs[int(len(fs) * (1 - frac)):]))

print(round(noise_floor(1.0, 0.1, 1.0), 4), round(noise_floor(1.0, 0.01, 1.0), 5), noise_floor(2.0, 0.5, 0.0))
fs = sgd_quadratic(1.0, 5.0, 0.1, 1.0, 20000); print(fs.shape, abs(tail_mean(fs) - noise_floor(1.0, 0.1, 1.0)) < 0.005, sgd_quadratic(1.0, 5.0, 0.1, 0.0, 3).round(4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0263 0.00251 0.0\n(20000,) True [10.125, 8.2012, 6.643]",
          "0.025 0.0025 0.0\n(20000,) True [10.125, 8.2012, 6.643]",
          "0.0263 0.00251 0.0\n(20000,) False [10.125, 8.2012, 6.643]",
          "0.0263 0.00251 0.0\n(20000,) True [12.5, 10.125, 8.2012]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gd(grad, x0, lr, steps)</C>, returning the list of iterates including x₀ as float arrays,{" "}
          <C>min_grad_sq(grad, xs)</C>, the smallest squared gradient norm over the iterates, and{" "}
          <C>bounds(L, mu, gap0, dist0, k)</C>, a dict with the non-convex, convex and strongly convex bounds of the theorem
          under the keys &apos;nonconvex&apos;, &apos;convex&apos; and &apos;strong&apos;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd(grad, x0, lr, steps):
    return [np.asarray(x0, dtype=float)]

def min_grad_sq(grad, xs):
    return 0.0

def bounds(L, mu, gap0, dist0, k):
    return {}
`,
        solution: GD,
        tests: [
          { name: "gd", code: `H = np.array([[2.0, 0.5], [0.5, 1.0]]); g = lambda x: H @ x - np.array([1.0, 0.0])
xs = gd(g, [0.0, 0.0], 0.3, 200); assert len(xs) == 201 and np.allclose(xs[-1], np.linalg.solve(H, [1.0, 0.0])) and xs[0].dtype == float
assert np.allclose(xs[1], [0.3, 0.0]) and abs(min_grad_sq(g, xs[:2]) - min(1.0, float(np.sum(g(xs[1]) ** 2)))) < 1e-12` },
          { name: "bounds", code: `b = bounds(10.0, 2.0, 3.0, 2.0, 5); assert abs(b['nonconvex'] - 12.0) < 1e-12 and abs(b['convex'] - 4.0) < 1e-12 and abs(b['strong'] - 0.8 ** 5 * 3.0) < 1e-12
f = lambda x: 0.5 * float(x @ np.diag([1.0, 8.0]) @ x); g = lambda x: np.diag([1.0, 8.0]) @ x
xs = gd(g, [1.0, 1.0], 1 / 8, 30); assert all(f(xs[k]) <= bounds(8.0, 1.0, f(xs[0]), 2 ** 0.5, k)['strong'] + 1e-12 for k in range(1, 31))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sgd_quadratic(a, x0, lr, sigma, steps, seed=0)</C>, running SGD on ½ax² with gradient ax + σξ (ξ from{" "}
          <C>np.random.default_rng(seed).normal()</C>, one draw per step) and returning the array of f values after each
          step, <C>noise_floor(a, lr, sigma)</C>, the limit from the theorem, and <C>tail_mean(fs, frac=0.5)</C>, the mean of
          the last fraction of the values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sgd_quadratic(a, x0, lr, sigma, steps, seed=0):
    return np.zeros(steps)

def noise_floor(a, lr, sigma):
    return 0.0

def tail_mean(fs, frac=0.5):
    return float(np.mean(fs))
`,
        solution: SGD,
        tests: [
          { name: "sgd", code: `fs = sgd_quadratic(2.0, 1.0, 0.1, 0.0, 3); assert np.allclose(fs, [0.64, 0.4096, 0.262144])
r = np.random.default_rng(4); x = 1.0
for _ in range(2):
    x = x - 0.2 * (3.0 * x + 0.5 * r.normal())
assert abs(sgd_quadratic(3.0, 1.0, 0.2, 0.5, 2, seed=4)[-1] - 1.5 * x * x) < 1e-12` },
          { name: "floor", code: `assert abs(noise_floor(2.0, 0.1, 1.0) - 0.1 / (2 * 1.8)) < 1e-12 and tail_mean(np.arange(10.0), 0.3) == 8.0 and tail_mean(np.arange(4.0)) == 2.5
fs = sgd_quadratic(2.0, 0.0, 0.05, 2.0, 40000, seed=1); assert abs(tail_mean(fs) / noise_floor(2.0, 0.05, 2.0) - 1) < 0.1` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          For SGD on ½x² (a = 1) with σ = 1, what step size gives a noise floor of exactly 0.01? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0396, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The noise term σ² is not a fixed property of the problem: averaging over a larger batch shrinks it. The next lesson
        makes that precise and asks how much a bigger batch is really worth.
      </p>
    </>
  ),
};
