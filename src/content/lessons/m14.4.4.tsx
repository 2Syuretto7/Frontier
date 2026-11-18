import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IterateAverageViz } from "@/components/viz/IterateAverageViz";
import type { LessonContent } from "@/lib/types";

const AVG = `import numpy as np

def sgd_path(h, x0, lr, noise):
    x, xs = float(x0), []
    for xi in noise:
        x = x - lr * (h * x + xi)
        xs.append(x)
    return np.array(xs)

def running_average(xs):
    xs = np.asarray(xs, float)
    return np.cumsum(xs) / np.arange(1, len(xs) + 1)

def polyak_identity(h, x0, lr, noise):
    xs = sgd_path(h, x0, lr, noise)
    T = len(noise)
    direct = (x0 + np.sum(xs[:-1])) / T
    formula = -np.sum(noise) / (T * h) - (xs[-1] - x0) / (T * lr * h)
    return float(direct), float(formula)`;

const FREE = `import numpy as np

def schedule_free(h, x0, lr, beta, noise):
    z = x = float(x0)
    xs, zs = [], []
    for t, xi in enumerate(noise, 1):
        y = (1 - beta) * z + beta * x
        z = z - lr * (h * y + xi)
        x = (1 - 1 / (t + 1)) * x + z / (t + 1)
        xs.append(x)
        zs.append(z)
    return np.array(xs), np.array(zs)

def average_variance(h, sigma, T):
    return sigma ** 2 / (T * h * h)`;

export const lesson: LessonContent = {
  id: "m14.4.4",
  minutes: 45,
  links: {
    requires: ["m14.4.3", "m14.2.1"],
    revisits: ["m7.7.1", "m7.4.2"],
    foreshadows: ["m14.4.5"],
  },

  puzzle: (
    <>
      <p>
        Every schedule so far ends by shrinking the learning rate, because a constant rate leaves the iterate jittering
        at a noise floor. Yet a 1990s result says that plain SGD with a constant rate, if you simply report the average of
        its iterates instead of the last one, converges at the best rate any method can achieve on noisy quadratics.
        Schedule-free optimisers build on that. How can averaging do the work of decay, and what does it cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        With a constant rate, the iterate keeps moving: it is pulled towards the minimum and kicked by noise, so it
        wanders around the minimum at a distance set by the rate. Averaging many such positions cancels the kicks, much as
        averaging many noisy measurements does, so the average closes in on the minimum like one over the square root of
        the number of steps. Decaying the rate and averaging the iterates are two ways of throwing away the same noise.
        Averaging does it without a length fixed in advance, which is what schedule-free methods exploit; their twist is
        to evaluate gradients at a point between the fast-moving iterate and the slow average.
      </p>
      <IterateAverageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="schedule-free SGD">
        <p>
          With a constant rate γ, an interpolation weight β ∈ [0, 1] and <M>{"z_0 = x_0"}</M>, repeat for t = 1, 2, …
        </p>
        <MD>{"y_t = (1-\\beta)z_{t-1} + \\beta x_{t-1},\\qquad z_t = z_{t-1} - \\gamma g(y_t),\\qquad x_t = \\Big(1 - \\frac{1}{t+1}\\Big)x_{t-1} + \\frac{1}{t+1}z_t,"}</MD>
        <p>
          where g(y) is a stochastic gradient at y. By induction <M>{"x_t = \\frac{1}{t+1}\\sum_{s=0}^tz_s"}</M>, the uniform
          average of the fast sequence. β = 0 is SGD with Polyak averaging; β = 1 evaluates gradients at the average itself.
        </p>
      </Definition>

      <Theorem title="averaging on a noisy quadratic">
        <p>
          Let <M>{"x_{t+1} = x_t - \\eta(hx_t + \\xi_t)"}</M> with independent noise of mean 0 and variance{" "}
          <M>{"\\sigma^2"}</M>. Then, exactly,
        </p>
        <MD>{"\\bar x_T = \\frac1T\\sum_{t=0}^{T-1}x_t = -\\frac{1}{Th}\\sum_{t=0}^{T-1}\\xi_t - \\frac{x_T - x_0}{T\\eta h},"}</MD>
        <p>
          so <M>{"\\operatorname{Var}(\\bar x_T) = \\sigma^2/(Th^2) + O(1/T^2)"}</M>, independent of η to leading order. The
          last iterate instead settles at variance <M>{"\\eta\\sigma^2/(h(2-\\eta h))"}</M>, which does not shrink with T.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sum the update over t from 0 to T − 1: the left side telescopes to <M>{"x_T - x_0"}</M>, and the right side is{" "}
          <M>{"-\\eta h\\sum x_t - \\eta\\sum\\xi_t"}</M>. Solving for <M>{"\\sum x_t"}</M> and dividing by T gives the
          identity. The first term has variance <M>{"T\\sigma^2/(T^2h^2)"}</M>. The second is{" "}
          <M>{"O(1/(T\\eta h))"}</M> because <M>{"x_T"}</M> stays bounded in mean square, so its square is{" "}
          <M>{"O(1/T^2)"}</M>. The rate <M>{"\\sigma^2/(Th^2)"}</M> is the variance of the best unbiased estimate of the
          minimiser from T noisy gradients, so no method can do better in order. The code checks the identity on a random
          noise sequence.
        </p>
        <Code>{AVG}</Code>
      </Proof>

      <Theorem title="from regret to the average">
        <p>
          For convex f and any points <M>{"z_0, \\dots, z_{T-1}"}</M>, the average <M>{"\\bar z"}</M> satisfies{" "}
          <M>{"f(\\bar z) - f^* \\le \\frac1T\\sum_t(f(z_t) - f^*)"}</M>. If f is G-Lipschitz and{" "}
          <M>{"\\|z_0 - x^*\\| \\le D"}</M>, SGD with constant rate γ has{" "}
          <M>{"\\frac1T\\sum_tE[f(z_t) - f^*] \\le \\frac{D^2}{2\\gamma T} + \\frac{\\gamma G^2}{2}"}</M>, which is{" "}
          <M>{"DG/\\sqrt T"}</M> for <M>{"\\gamma = D/(G\\sqrt T)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first inequality is Jensen&apos;s. For the second, expand{" "}
          <M>{"\\|z_{t+1} - x^*\\|^2 = \\|z_t - x^*\\|^2 - 2\\gamma g_t\\cdot(z_t - x^*) + \\gamma^2\\|g_t\\|^2"}</M>, take
          expectations, use convexity <M>{"f(z_t) - f^* \\le E[g_t]\\cdot(z_t - x^*)"}</M> and{" "}
          <M>{"E\\|g_t\\|^2 \\le G^2"}</M>, and sum: the distances telescope to at most <M>{"D^2"}</M>, giving{" "}
          <M>{"2\\gamma\\sum(f(z_t) - f^*) \\le D^2 + \\gamma^2G^2T"}</M>. The choice of γ balances the two terms. This is
          the same online-to-batch argument as for AdaGrad&apos;s regret.
        </p>
        <Code>{FREE}</Code>
      </Proof>

      <Remark title="what schedule-free buys and costs">
        <p>
          Averaging replaces the decay, so there is no T to choose and any checkpoint&apos;s average is a finished model.
          Evaluating gradients at the interpolation y rather than at z behaves like momentum and makes large constant rates
          usable in practice; with Adam-style scaling inside, schedule-free methods have matched tuned cosine and WSD runs
          on several benchmarks. The costs are an extra copy of the parameters, a warmup that is still needed, and the
          fact that the reported model x is not the point where gradients are taken, which complicates layers such as
          batch normalisation whose statistics depend on the weights they were computed with.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: <p>Constant-rate SGD on ½hx² with h = 0.5 and gradient noise of standard deviation σ = 2 runs for T = 10,000 steps. What is the leading-order variance of the iterate average?</p>,
      answer: { kind: "numeric", value: 0.0016, tolerance: 0.000001 },
    },
    {
      key: "floor",
      rung: "check",
      prompt: <p>With η = 0.2, h = 1 and σ = 1, what variance does the last iterate settle at? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.111, tolerance: 0.0006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can averaging the iterates of constant-rate SGD stand in for decaying the rate?</p>,
      answer: {
        kind: "choice",
        options: [
          "The noise kicks in different steps are independent and cancel in the average, so its error shrinks like 1/√T even though each iterate keeps jittering",
          "Averaging makes the gradient exact",
          "Averaging lowers the learning rate automatically",
          "The average always equals the minimiser after T ≥ 1/η steps",
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

def sgd_path(h, x0, lr, noise):
    x, xs = float(x0), []
    for xi in noise:
        x = x - lr * (h * x + xi)
        xs.append(x)
    return np.array(xs)

def running_average(xs):
    xs = np.asarray(xs, float)
    return np.cumsum(xs) / np.arange(1, len(xs) + 1)

def polyak_identity(h, x0, lr, noise):
    xs = sgd_path(h, x0, lr, noise)
    T = len(noise)
    direct = (x0 + np.sum(xs[:-1])) / T
    formula = -np.sum(noise) / (T * h) - (xs[-1] - x0) / (T * lr * h)
    return float(direct), float(formula)

print(sgd_path(1.0, 2.0, 0.5, [0.0, 1.0, -1.0]).tolist(), running_average([1.0, 3.0, 2.0]).tolist())
print([round(v, 6) for v in polyak_identity(2.0, 1.0, 0.1, [0.5, -1.0, 0.25, 0.0])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.0, 0.5] [1.0, 2.0, 2.0]\n[0.74625, 0.74625]",
          "[1.0, 0.5, 0.75] [1.0, 2.0, 2.0]\n[0.74625, 0.74625]",
          "[1.0, 0.0, 0.5] [1.0, 4.0, 6.0]\n[0.74625, 0.74625]",
          "[1.0, 0.0, 0.5] [1.0, 2.0, 2.0]\n[0.74625, 0.5]",
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

def schedule_free(h, x0, lr, beta, noise):
    z = x = float(x0)
    xs, zs = [], []
    for t, xi in enumerate(noise, 1):
        y = (1 - beta) * z + beta * x
        z = z - lr * (h * y + xi)
        x = (1 - 1 / (t + 1)) * x + z / (t + 1)
        xs.append(x)
        zs.append(z)
    return np.array(xs), np.array(zs)

def average_variance(h, sigma, T):
    return sigma ** 2 / (T * h * h)

xs, zs = schedule_free(1.0, 2.0, 0.5, 0.0, [0.0, 0.0, 0.0])
print(zs.tolist(), xs.round(4).tolist(), average_variance(2.0, 1.0, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.5, 0.25] [1.5, 1.1667, 0.9375] 0.0025",
          "[1.0, 0.5, 0.25] [1.0, 0.75, 0.5833] 0.0025",
          "[1.0, 0.5, 0.25] [1.5, 1.1667, 0.9375] 0.005",
          "[1.5, 1.1667, 0.9375] [1.0, 0.5, 0.25] 0.0025",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sgd_path(h, x0, lr, noise)</C>, the iterates <C>x ← x − lr(hx + ξ)</C> for each ξ in noise (not including
          x0); <C>running_average(xs)</C>; and <C>polyak_identity(h, x0, lr, noise)</C>, returning the average of{" "}
          <C>x0, …, x_(T−1)</C> computed directly and from the identity in the theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sgd_path(h, x0, lr, noise):
    return np.array([x0] * len(noise))

def running_average(xs):
    return np.asarray(xs, float)

def polyak_identity(h, x0, lr, noise):
    return 0.0, 0.0
`,
        solution: AVG,
        tests: [
          { name: "path", code: `assert np.allclose(sgd_path(1.0, 2.0, 0.5, [0.0, 1.0, -1.0]), [1, 0, 0.5]) and np.allclose(running_average([1.0, 3.0, 2.0, 6.0]), [1, 2, 2, 3])` },
          { name: "identity", code: `n = np.random.default_rng(5).standard_normal(50); a, b = polyak_identity(0.7, 3.0, 0.3, n)
assert abs(a - 0.6820474047649118) < 1e-9 and abs(a - b) < 1e-9
a, b = polyak_identity(2.0, 1.0, 0.1, [0.5, -1.0, 0.25, 0.0]); assert abs(a - 0.74625) < 1e-12 and abs(b - 0.74625) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>schedule_free(h, x0, lr, beta, noise)</C> for the quadratic ½hx² with gradient <C>h·y + ξ</C>, returning
          the arrays of x and z after each step, and <C>average_variance(h, sigma, T)</C>, the leading-order variance of the
          iterate average.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def schedule_free(h, x0, lr, beta, noise):
    return np.zeros(len(noise)), np.zeros(len(noise))

def average_variance(h, sigma, T):
    return 0.0
`,
        solution: FREE,
        tests: [
          { name: "steps", code: `xs, zs = schedule_free(0.5, 1.0, 0.2, 0.3, [0.1, -0.2, 0.3]); assert np.allclose(xs, [0.94, 0.9034, 0.848796]) and np.allclose(zs, [0.88, 0.8302, 0.684984])
n = np.random.default_rng(5).standard_normal(50); xs, zs = schedule_free(0.5, 1.0, 0.2, 0.3, list(n)); assert np.allclose(xs, (1.0 + np.cumsum(zs)) / np.arange(2, 52))` },
          { name: "variance", code: `assert abs(average_variance(0.5, 2.0, 10000) - 0.0016) < 1e-15 and abs(average_variance(2.0, 1.0, 100) - 0.0025) < 1e-15` },
        ],
      },
    },
    {
      key: "ident",
      rung: "stretch",
      prompt: (
        <p>
          A run with h = 2, η = 0.1 and T = 100 steps has noise summing to Σξ = 3 and ends at x_T = x_0 − 1. Use the identity
          to find the average of x_0, …, x_99.
        </p>
      ),
      answer: { kind: "numeric", value: 0.035, tolerance: 0.000001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Decay and averaging both remove noise, and on a quadratic that is the whole story. Real losses are not
        quadratic, and the last lesson of this chapter asks whether noise removal is really why decaying the rate helps,
        or whether something about the shape of the landscape is involved too.
      </p>
    </>
  ),
};
