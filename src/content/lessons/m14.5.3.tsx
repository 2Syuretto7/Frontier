import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EdgeStabilityViz } from "@/components/viz/EdgeStabilityViz";
import type { LessonContent } from "@/lib/types";

const HESS = `import numpy as np

def fd_hvp(grad, w, v, eps=1e-4):
    w, v = np.asarray(w, float), np.asarray(v, float)
    return (grad(w + eps * v) - grad(w - eps * v)) / (2 * eps)

def top_eig(hvp, d, iters=100, seed=0):
    v = np.random.default_rng(seed).standard_normal(d)
    v /= np.linalg.norm(v)
    for _ in range(iters):
        hv = hvp(v)
        v = hv / np.linalg.norm(hv)
    return float(v @ hvp(v))

def sharpness(grad, w, iters=100):
    return top_eig(lambda v: fd_hvp(grad, w, v), len(w), iters)`;

const TOY = `import numpy as np

def toy_grad(x, s, a, s_star):
    return np.array([s * x, 0.5 * x * x + a * (s - s_star)])

def toy_gd(x, s, a, s_star, lr, steps):
    path = []
    for _ in range(steps):
        gx, gs = toy_grad(x, s, a, s_star)
        x, s = x - lr * gx, s - lr * gs
        path.append((float(x), float(s)))
    return path

def orbit_x2(a, s_star, lr):
    return max(0.0, 2 * a * (s_star - 2 / lr))`;

export const lesson: LessonContent = {
  id: "m14.5.3",
  minutes: 45,
  links: {
    requires: ["m14.5.2", "m14.4.1"],
    revisits: ["m14.1.1"],
    foreshadows: ["m14.6.2"],
  },

  puzzle: (
    <>
      <p>
        The textbook rule for gradient descent says the learning rate must stay below 2/β, where β bounds the curvature,
        or the iterates blow up. In 2021 Cohen and co-authors measured the curvature of real networks during full-batch
        training and found something the rule forbids: the sharpness rises until it passes 2/η and then stays there,
        hovering at the boundary, while the loss keeps going down, unevenly, over thousands of steps. Why does training not
        diverge, and what holds the sharpness at exactly 2/η?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Along a direction of curvature λ, a gradient step multiplies the error by 1 − ηλ. Below 2/η that shrinks it; above
        2/η it flips sign and grows. So once the sharpness passes 2/η, the iterates start to oscillate along the sharpest
        direction. In a quadratic that is the end of the story. In a network the curvature itself depends on the weights,
        and the oscillation has a side effect: averaged over a bounce, the growing oscillation pushes the weights towards
        regions where that curvature is lower. The instability creates the force that removes it. Training settles into a
        loop: sharpen, overshoot 2/η, oscillate, flatten, calm down, sharpen again.
      </p>
      <EdgeStabilityViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the quadratic stability threshold">
        <p>
          Gradient descent with step η on <M>{"L(w) = \\tfrac12 w^\\top Hw"}</M>, H symmetric with eigenvalues{" "}
          <M>{"\\lambda_i"}</M>, multiplies the component of w along the i-th eigenvector by{" "}
          <M>{"1 - \\eta\\lambda_i"}</M> every step. It converges from every starting point if and only if{" "}
          <M>{"0 < \\eta\\lambda_i < 2"}</M> for all i with <M>{"\\lambda_i \\neq 0"}</M>; along a direction with{" "}
          <M>{"\\lambda_i > 2/\\eta"}</M> the component flips sign every step and grows geometrically.
        </p>
      </Theorem>
      <Proof>
        <p>
          The update is <M>{"w_{t+1} = w_t - \\eta Hw_t = (I - \\eta H)w_t"}</M>. Writing{" "}
          <M>{"w_t = \\sum_i c_{i,t}q_i"}</M> in the orthonormal eigenbasis gives{" "}
          <M>{"c_{i,t+1} = (1-\\eta\\lambda_i)c_{i,t}"}</M>, so <M>{"c_{i,t} = (1-\\eta\\lambda_i)^tc_{i,0}"}</M>. This
          tends to zero for every starting value exactly when <M>{"|1-\\eta\\lambda_i| < 1"}</M>, that is{" "}
          <M>{"0 < \\eta\\lambda_i < 2"}</M>. If <M>{"\\eta\\lambda_i > 2"}</M> then <M>{"1-\\eta\\lambda_i < -1"}</M>,
          which alternates in sign and has modulus above one.
        </p>
      </Proof>

      <Definition title="progressive sharpening and the edge of stability">
        <p>
          Track the sharpness <M>{"S_t = \\lambda_{\\max}(\\nabla^2L(w_t))"}</M> along a training run.{" "}
          <em>Progressive sharpening</em> is the tendency of <M>{"S_t"}</M> to rise during training. The{" "}
          <em>edge of stability</em> is the regime in which <M>{"S_t"}</M> has reached about 2/η and stays near it while
          the loss continues to decrease over long horizons, though not monotonically. Sharpness is measured without forming
          the Hessian: a Hessian–vector product is a directional derivative of the gradient,{" "}
          <M>{"Hv \\approx (\\nabla L(w+\\epsilon v) - \\nabla L(w-\\epsilon v))/2\\epsilon"}</M>, and power iteration on{" "}
          <M>{"v \\mapsto Hv"}</M> finds the eigenvalue of largest modulus.
        </p>
        <Code>{HESS}</Code>
      </Definition>

      <Remark title="what power iteration returns">
        <p>
          Power iteration converges to the eigenvalue of largest absolute value. Near a minimum the Hessian is close to
          positive semidefinite and that is the sharpness. Far from a minimum a large negative eigenvalue can win instead,
          and the Rayleigh quotient then comes out negative; the code-reading exercise below shows this.
        </p>
      </Remark>

      <Theorem title="self-stabilisation in a two-parameter model">
        <p>
          Let <M>{"L(x, s) = \\tfrac12 sx^2 + \\tfrac12 a(s - s^*)^2"}</M> with a &gt; 0, so that s is the curvature along
          x and the second term pulls s up towards s*. Suppose <M>{"s^* > 2/\\eta"}</M>. Then:
        </p>
        <ol>
          <li>The only minimum, (0, s*), is unstable for gradient descent with step η.</li>
          <li>
            The two points <M>{"(\\pm\\bar x, 2/\\eta)"}</M> with <M>{"\\bar x^2 = 2a(s^* - 2/\\eta)"}</M> form a cycle of
            period two: gradient descent maps each to the other.
          </li>
          <li>
            Whenever <M>{"x^2 > 2a(s^* - s)"}</M>, a gradient step decreases s.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          The gradient is <M>{"(sx,\\ \\tfrac12x^2 + a(s-s^*))"}</M>, zero only at x = 0, s = s*. The Hessian there is{" "}
          <M>{"\\mathrm{diag}(s^*, a)"}</M>, and since <M>{"s^* > 2/\\eta"}</M> the first theorem, applied to the
          linearisation, shows that small perturbations along x grow. On the cycle, s = 2/η gives{" "}
          <M>{"x - \\eta sx = -x"}</M>, and <M>{"\\tfrac12\\bar x^2 + a(2/\\eta - s^*) = 0"}</M> means s does not move;
          so <M>{"(\\bar x, 2/\\eta) \\mapsto (-\\bar x, 2/\\eta) \\mapsto (\\bar x, 2/\\eta)"}</M>. Finally, the update
          for s is <M>{"s - \\eta(\\tfrac12x^2 + a(s - s^*))"}</M>, which is below s exactly when{" "}
          <M>{"x^2 > 2a(s^* - s)"}</M>.
        </p>
        <Code>{TOY}</Code>
      </Proof>

      <Remark title="the mechanism, and its limits">
        <p>
          Part 3 is the whole story in miniature. The term <M>{"\\tfrac12x^2"}</M> in the gradient for s comes from the
          third derivative <M>{"\\partial^3L/\\partial x^2\\partial s = 1"}</M>: the curvature along x depends on s, so
          oscillation along x produces a gradient that lowers s. Damian, Nichani and Lee called this self-stabilisation
          and showed it holds generally when the gradient of the sharpness is not orthogonal to the loss gradient. The
          period-two cycle is not attracting in this model: in the figure the run circles around it, with sharpness
          averaging close to 2/η and a loss spike each time x grows. Removing the feedback term leaves a quadratic in x
          whose curvature has passed 2/η, and the run diverges. The next lessons look at loss spikes and at how to keep
          them in check.
        </p>
      </Remark>

      <Remark title="adaptive optimisers have an edge too">
        <p>
          For Adam the analogous quantity is the sharpness of the preconditioned Hessian{" "}
          <M>{"P^{-1/2}HP^{-1/2}"}</M>, where P is the diagonal of <M>{"\\sqrt{\\hat v}+\\epsilon"}</M>. Momentum
          changes the stability threshold of the heavy-ball update to <M>{"(2+2\\beta_1)/((1-\\beta_1)\\eta)"}</M>, which
          is 38/η for <M>{"\\beta_1 = 0.9"}</M>, and the preconditioned sharpness is observed to hover there. In both
          cases the learning rate does not merely set the speed of training: it caps the curvature of the regions the
          optimiser can stay in. That is one concrete link between large learning rates and the flatter solutions of the
          previous lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "thresh",
      rung: "check",
      prompt: <p>The sharpness of a quadratic loss is 250. What is the supremum of learning rates for which gradient descent converges?</p>,
      answer: { kind: "numeric", value: 0.008, tolerance: 0.000001 },
    },
    {
      key: "orbit",
      rung: "check",
      prompt: <p>In the two-parameter model with a = 0.002, s* = 30 and η = 0.1, what is <M>{"\\bar x^2"}</M> on the period-two cycle?</p>,
      answer: { kind: "numeric", value: 0.04, tolerance: 0.000001 },
    },
    {
      key: "halve",
      rung: "apply",
      prompt: (
        <p>
          A full-batch run with learning rate η has reached the edge of stability. Halfway through, η is halved and the
          run continues. What does the edge-of-stability picture predict for the sharpness?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The oscillation dies out, and progressive sharpening can resume until the sharpness approaches the new threshold, twice the old one",
          "The sharpness halves, to match the new threshold 2/η",
          "The sharpness stays fixed at the old value of 2/η for the rest of training",
          "The run diverges, because halving η doubles the threshold 2/η",
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

def fd_hvp(grad, w, v, eps=1e-4):
    w, v = np.asarray(w, float), np.asarray(v, float)
    return (grad(w + eps * v) - grad(w - eps * v)) / (2 * eps)

def top_eig(hvp, d, iters=100, seed=0):
    v = np.random.default_rng(seed).standard_normal(d)
    v /= np.linalg.norm(v)
    for _ in range(iters):
        hv = hvp(v)
        v = hv / np.linalg.norm(hv)
    return float(v @ hvp(v))

def sharpness(grad, w, iters=100):
    return top_eig(lambda v: fd_hvp(grad, w, v), len(w), iters)

H = np.array([[4.0, 1.0], [1.0, 2.0]])
print(round(sharpness(lambda w: H @ w, np.zeros(2), 60), 3), round(top_eig(lambda v: np.diag([3.0, -5.0]) @ v, 2, 60), 3))
print(np.round(fd_hvp(lambda w: w ** 3, [1.0, 2.0], [1.0, 1.0]), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.414 -5.0\n[3.0, 12.0]",
          "4.414 3.0\n[3.0, 12.0]",
          "4.0 -5.0\n[3.0, 12.0]",
          "4.414 -5.0\n[1.0, 8.0]",
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

def toy_grad(x, s, a, s_star):
    return np.array([s * x, 0.5 * x * x + a * (s - s_star)])

def toy_gd(x, s, a, s_star, lr, steps):
    path = []
    for _ in range(steps):
        gx, gs = toy_grad(x, s, a, s_star)
        x, s = x - lr * gx, s - lr * gs
        path.append((float(x), float(s)))
    return path

def orbit_x2(a, s_star, lr):
    return max(0.0, 2 * a * (s_star - 2 / lr))

path = toy_gd(0.2, 20.0, 0.002, 30.0, 0.1, 3)
print([(round(x, 3), round(s, 3)) for x, s in path], round(orbit_x2(0.002, 30.0, 0.1), 4), orbit_x2(0.002, 30.0, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(-0.2, 20.0), (0.2, 20.0), (-0.2, 20.0)] 0.04 0.0",
          "[(-0.2, 20.002), (0.2, 20.004), (-0.2, 20.006)] 0.04 0.0",
          "[(-0.2, 20.0), (0.2, 20.0), (-0.2, 20.0)] 0.04 -0.04",
          "[(0.0, 20.0), (0.0, 20.0), (0.0, 20.0)] 0.04 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fd_hvp(grad, w, v, eps=1e-4)</C>, the central-difference Hessian–vector product from a gradient
          function; <C>top_eig(hvp, d, iters=100, seed=0)</C>, power iteration from a unit vector drawn with{" "}
          <C>np.random.default_rng(seed).standard_normal(d)</C>, returning the Rayleigh quotient of the final unit vector;
          and <C>sharpness(grad, w, iters=100)</C>, combining the two.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fd_hvp(grad, w, v, eps=1e-4):
    return np.asarray(v, float)

def top_eig(hvp, d, iters=100, seed=0):
    return 0.0

def sharpness(grad, w, iters=100):
    return 0.0
`,
        solution: HESS,
        tests: [
          { name: "hvp", code: `f = lambda w: np.array([w[0] ** 2 * w[1], w[0] + w[1] ** 3])
assert np.allclose(fd_hvp(f, [1.0, 2.0], [1.0, 0.0]), [4, 1], atol=1e-6) and np.allclose(fd_hvp(f, [1.0, 2.0], [0.0, 1.0]), [1, 12], atol=1e-6)` },
          { name: "eig", code: `assert abs(top_eig(lambda v: np.diag([1.0, 5.0, 2.0]) @ v, 3) - 5) < 1e-6 and abs(top_eig(lambda v: np.diag([3.0, -5.0]) @ v, 2) + 5) < 1e-6
g = lambda w: np.array([4 * w[0] ** 3, 2 * w[1]]); assert abs(sharpness(g, [1.0, 1.0]) - 12) < 1e-4 and abs(sharpness(g, [0.1, 1.0]) - 2) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"L(x, s) = \\tfrac12 sx^2 + \\tfrac12 a(s - s^*)^2"}</M>, write <C>toy_grad(x, s, a, s_star)</C> returning
          the gradient as an array; <C>toy_gd(x, s, a, s_star, lr, steps)</C> returning the list of (x, s) float pairs after
          each gradient step; and <C>orbit_x2(a, s_star, lr)</C>, the value of <M>{"\\bar x^2"}</M> on the period-two cycle,
          or 0.0 when <M>{"s^* \\le 2/\\eta"}</M> and there is no cycle.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def toy_grad(x, s, a, s_star):
    return np.array([s * x, a * (s - s_star)])

def toy_gd(x, s, a, s_star, lr, steps):
    return [(x, s)] * steps

def orbit_x2(a, s_star, lr):
    return 2 * a * s_star
`,
        solution: TOY,
        tests: [
          { name: "steps", code: `assert np.allclose(toy_grad(0.2, 20.0, 0.002, 30.0), [4.0, 0.0]) and np.allclose(toy_grad(1.0, 10.0, 0.01, 30.0), [10.0, 0.3])
assert np.allclose(toy_gd(0.0, 10.0, 0.01, 30.0, 0.1, 2), [(0.0, 10.02), (0.0, 10.03998)]) and np.allclose(toy_gd(0.2, 20.0, 0.002, 30.0, 0.1, 2), [(-0.2, 20.0), (0.2, 20.0)])` },
          { name: "edge", code: `assert abs(orbit_x2(0.002, 30.0, 0.1) - 0.04) < 1e-12 and orbit_x2(0.002, 30.0, 0.05) == 0.0
s = np.array([p[1] for p in toy_gd(0.05, 15.0, 0.005, 30.0, 0.12, 2000)]); assert abs(s[500:].mean() - 2 / 0.12) < 1 and s.max() < 21` },
        ],
      },
    },
    {
      key: "cycleloss",
      rung: "stretch",
      prompt: <p>With a = 0.002, s* = 30 and η = 0.1, what is the loss at each point of the period-two cycle? The minimum of the loss is 0.</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        At the edge of stability the loss rises sharply each time the oscillation grows, then falls back. In large training
        runs similar spikes appear for other reasons too, sometimes without recovery. The next part looks at the tools
        that keep them in check, starting with gradient clipping.
      </p>
    </>
  ),
};
