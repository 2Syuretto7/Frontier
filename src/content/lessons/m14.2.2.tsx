import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BurstRateViz } from "@/components/viz/BurstRateViz";
import type { LessonContent } from "@/lib/types";

const EMA = `import numpy as np

def ema_sq(grads, beta):
    v, out = 0.0, []
    for g in grads:
        v = beta * v + (1 - beta) * g * g
        out.append(v)
    return out

def debias(vs, beta):
    return [v / (1 - beta ** (t + 1)) for t, v in enumerate(vs)]

def half_life(beta):
    return float(np.log(0.5) / np.log(beta))`;

const RMS = `import numpy as np

def rate_trace(grads, lr, method, beta=0.9, eps=1e-8):
    acc, out = 0.0, []
    for g in grads:
        acc = acc + g * g if method == 'adagrad' else beta * acc + (1 - beta) * g * g
        out.append(lr / (np.sqrt(acc) + eps))
    return out

def rmsprop(grad, x0, lr, beta, steps, eps=1e-8):
    x = np.asarray(x0, float).copy()
    v = np.zeros_like(x)
    path = [x.copy()]
    for _ in range(steps):
        g = grad(x)
        v = beta * v + (1 - beta) * g * g
        x = x - lr * g / (np.sqrt(v) + eps)
        path.append(x.copy())
    return path

def tail_amplitude(path, tail):
    return float(np.max(np.abs(np.asarray(path[-tail:]))))`;

export const lesson: LessonContent = {
  id: "m14.2.2",
  minutes: 40,
  links: {
    requires: ["m14.2.1"],
    revisits: ["m10.6.1"],
    foreshadows: ["m14.2.3", "m14.4.5"],
  },

  puzzle: (
    <>
      <p>
        A network&apos;s first hundred steps produce gradients a hundred times larger than any it sees later. Under AdaGrad
        those early squares sit in the denominator for ever, and the rest of training crawls. Forgetting the past fixes
        that, but it raises a new question: if the rate no longer decays, does the method still converge, or does it end up
        bouncing around the minimum? On a simple quadratic the answer is exact and surprising.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Replace the sum of squared gradients with an exponential moving average. The denominator now estimates the recent
        root mean square of each coordinate&apos;s gradient, over a window of roughly 1/(1 − β) steps, and the step is the
        gradient measured in units of its own typical size. That makes the method forgetful, so it adapts when the scale of
        the gradients changes, and scale-free, so multiplying a coordinate&apos;s gradients by a constant changes nothing.
        The price is that near a minimum the step no longer shrinks with the gradient: dividing a small gradient by its own
        small size gives a step of size about η, so a fixed rate leaves the iterate hovering at distance about η.
      </p>
      <BurstRateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="RMSProp">
        <p>With <M>{"v_0 = 0"}</M> and <M>{"0 < \\beta < 1"}</M>, per coordinate,</p>
        <MD>{"v_t = \\beta v_{t-1} + (1-\\beta)g_t^2,\\qquad x_{t+1} = x_t - \\frac{\\eta\\,g_t}{\\sqrt{v_t} + \\epsilon}."}</MD>
      </Definition>

      <Theorem title="memory and bias">
        <p>
          The weight of <M>{"g_{t-s}^2"}</M> in <M>{"v_t"}</M> is <M>{"(1-\\beta)\\beta^s"}</M>; it halves every{" "}
          <M>{"\\ln\\tfrac12/\\ln\\beta \\approx 0.69/(1-\\beta)"}</M> steps. The weights sum to <M>{"1 - \\beta^t"}</M>, so
          if <M>{"E[g_s^2] = s^2_0"}</M> for every s, then <M>{"E[v_t] = (1-\\beta^t)s_0^2"}</M>, and{" "}
          <M>{"\\hat v_t = v_t/(1-\\beta^t)"}</M> is unbiased.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling the recursion from <M>{"v_0 = 0"}</M> gives{" "}
          <M>{"v_t = (1-\\beta)\\sum_{s=0}^{t-1}\\beta^s g_{t-s}^2"}</M>, a geometric weighting. The weights sum to{" "}
          <M>{"(1-\\beta)(1-\\beta^t)/(1-\\beta) = 1-\\beta^t"}</M>, and taking expectations term by term gives the bias.
          The half-life solves <M>{"\\beta^s = \\tfrac12"}</M>, and <M>{"\\ln\\beta \\approx -(1-\\beta)"}</M> for β near 1.
          Without the correction, the first step divides by <M>{"\\sqrt{(1-\\beta)}|g_1|"}</M> and is{" "}
          <M>{"1/\\sqrt{1-\\beta}"}</M> times larger than intended.
        </p>
        <Code>{EMA}</Code>
      </Proof>

      <Theorem title="the oscillation on a quadratic">
        <p>
          On <M>{"f(x) = \\tfrac12 hx^2"}</M> with h &gt; 0 and exact gradients, a two-cycle of RMSProp with ε = 0 that
          alternates between <M>{"\\pm a"}</M> must have <M>{"a = \\eta/2"}</M>, whatever h is. So a constant rate cannot
          bring the iterate closer to the minimum than about η/2.
        </p>
      </Theorem>
      <Proof>
        <p>
          On the cycle <M>{"g = \\pm ha"}</M>, so <M>{"g^2 = h^2a^2"}</M> on every step and{" "}
          <M>{"v_t \\to h^2a^2"}</M>. The step is then <M>{"\\eta g/\\sqrt{v} = \\eta\\,\\mathrm{sign}(x)"}</M>: from a it
          goes to <M>{"a - \\eta"}</M>, and this equals −a exactly when <M>{"a = \\eta/2"}</M>. The curvature cancels
          because the update is homogeneous of degree zero in the gradient. This is also why RMSProp, unlike SGD, is
          insensitive to the scale of the loss.
        </p>
        <Code>{RMS}</Code>
      </Proof>

      <Remark title="what the denominator measures">
        <p>
          With noisy gradients, <M>{"v \\approx (\\nabla_i f)^2 + \\operatorname{Var}(g_i)"}</M>. Far from a minimum the
          first term dominates and the step is about η in every coordinate, a sign-like move. Near a minimum the variance
          dominates and RMSProp is SGD with per-coordinate rate <M>{"\\eta/\\operatorname{sd}(g_i)"}</M>. Neither is the
          curvature, so this is not Newton&apos;s method, but for models whose gradient noise grows with curvature it acts
          as a rough diagonal preconditioner. Because the rate does not decay, any guarantee of convergence needs a decaying
          η, which is one reason schedules matter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "half",
      rung: "check",
      prompt: <p>With β = 0.99, after how many steps has a squared gradient&apos;s weight in v halved? Round to a whole number.</p>,
      answer: { kind: "numeric", value: 69, tolerance: 0.6 },
    },
    {
      key: "cycle",
      rung: "check",
      prompt: <p>RMSProp with η = 0.01 runs on ½·50·x² with exact gradients. What is the amplitude a of the two-cycle it settles into?</p>,
      answer: { kind: "numeric", value: 0.005, tolerance: 0.000001 },
    },
    {
      key: "scale",
      rung: "apply",
      prompt: <p>From some step on, every gradient of one coordinate is multiplied by 1000. With β = 0.9, what happens to RMSProp&apos;s steps on that coordinate a few dozen steps later?</p>,
      answer: {
        kind: "choice",
        options: [
          "They return to about their previous size, since v has grown by about a million and the ratio g/√v is unchanged",
          "They stay 1000 times larger for the rest of training",
          "They become 1000 times smaller, as with AdaGrad",
          "They become about 31.6 times larger, the square root of 1000",
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

def ema_sq(grads, beta):
    v, out = 0.0, []
    for g in grads:
        v = beta * v + (1 - beta) * g * g
        out.append(v)
    return out

def debias(vs, beta):
    return [v / (1 - beta ** (t + 1)) for t, v in enumerate(vs)]

def half_life(beta):
    return float(np.log(0.5) / np.log(beta))

vs = ema_sq([2.0, 2.0, 2.0], 0.5)
print([round(v, 3) for v in vs], [round(v, 3) for v in debias(vs, 0.5)], round(half_life(0.9), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 3.0, 3.5] [4.0, 4.0, 4.0] 6.58",
          "[1.0, 1.5, 1.75] [2.0, 2.0, 2.0] 6.58",
          "[2.0, 3.0, 3.5] [4.0, 4.0, 4.0] 10.0",
          "[4.0, 4.0, 4.0] [2.0, 3.0, 3.5] 6.58",
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

def rate_trace(grads, lr, method, beta=0.9, eps=1e-8):
    acc, out = 0.0, []
    for g in grads:
        acc = acc + g * g if method == 'adagrad' else beta * acc + (1 - beta) * g * g
        out.append(lr / (np.sqrt(acc) + eps))
    return out

def rmsprop(grad, x0, lr, beta, steps, eps=1e-8):
    x = np.asarray(x0, float).copy()
    v = np.zeros_like(x)
    path = [x.copy()]
    for _ in range(steps):
        g = grad(x)
        v = beta * v + (1 - beta) * g * g
        x = x - lr * g / (np.sqrt(v) + eps)
        path.append(x.copy())
    return path

def tail_amplitude(path, tail):
    return float(np.max(np.abs(np.asarray(path[-tail:]))))

gs = [10.0] * 5 + [1.0] * 45
ada, rms = rate_trace(gs, 1.0, 'adagrad'), rate_trace(gs, 1.0, 'rmsprop', beta=0.8)
print(round(ada[-1], 3), round(rms[-1], 3))
path = rmsprop(lambda x: 4.0 * x, [1.0], 0.2, 0.9, 2000)
print(round(tail_amplitude(path, 100), 3), len(path))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.043 0.999\n0.1 2001", "0.043 0.999\n0.0 2001", "0.999 0.043\n0.1 2001", "0.043 0.999\n0.2 2000"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ema_sq(grads, beta)</C>, the list of v after each gradient starting from v = 0;{" "}
          <C>debias(vs, beta)</C>, dividing the t-th entry (from t = 1) by <C>1 − β^t</C>; and <C>half_life(beta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ema_sq(grads, beta):
    return [g * g for g in grads]

def debias(vs, beta):
    return list(vs)

def half_life(beta):
    return 1 / (1 - beta)
`,
        solution: EMA,
        tests: [
          { name: "ema", code: `v = ema_sq([1, 3], 0.5); assert np.allclose(v, [0.5, 4.75]) and np.allclose(debias(v, 0.5), [1.0, 4.75 / 0.75])
assert np.allclose(debias(ema_sq([3.0] * 7, 0.9), 0.9), [9.0] * 7)` },
          { name: "half", code: `assert abs(half_life(0.5) - 1) < 1e-12 and abs(half_life(0.99) - 68.96756) < 1e-4 and abs(0.9 ** half_life(0.9) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rate_trace(grads, lr, method, beta=0.9, eps=1e-8)</C>, the list of rates <C>lr/(√acc + eps)</C> after each
          gradient, where acc is the running sum of squares for <C>&apos;adagrad&apos;</C> and the moving average for{" "}
          <C>&apos;rmsprop&apos;</C>; <C>rmsprop(grad, x0, lr, beta, steps, eps=1e-8)</C>, the list of iterates; and{" "}
          <C>tail_amplitude(path, tail)</C>, the largest absolute entry among the last tail iterates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rate_trace(grads, lr, method, beta=0.9, eps=1e-8):
    return [lr for g in grads]

def rmsprop(grad, x0, lr, beta, steps, eps=1e-8):
    return [np.asarray(x0, float)]

def tail_amplitude(path, tail):
    return 0.0
`,
        solution: RMS,
        tests: [
          { name: "rates", code: `assert np.allclose(rate_trace([3.0, 4.0], 1.0, 'adagrad'), [1 / 3, 0.2])
assert np.allclose(rate_trace([3.0, 4.0], 1.0, 'rmsprop', beta=0.5), [1 / np.sqrt(4.5), 1 / np.sqrt(10.25)])` },
          { name: "cycle", code: `for h, lr in [(4.0, 0.2), (0.5, 0.04), (30.0, 0.01)]:
    p = rmsprop(lambda x: h * x, [1.0, -2.0], lr, 0.9, 2000); assert len(p) == 2001 and abs(tail_amplitude(p, 100) - lr / 2) < 1e-4 * lr` },
        ],
      },
    },
    {
      key: "first",
      rung: "stretch",
      prompt: (
        <p>
          RMSProp without bias correction starts from v = 0 with β = 0.999 and ε = 0. By what factor is its first step larger
          than η? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 31.62, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        RMSProp divides by a moving average of squared gradients; momentum, from an earlier course, replaces the gradient by
        a moving average of gradients. Adam does both, and corrects both averages for their start at zero.
      </p>
    </>
  ),
};
