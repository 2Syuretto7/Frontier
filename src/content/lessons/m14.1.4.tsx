import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LrScalingViz } from "@/components/viz/LrScalingViz";
import type { LessonContent } from "@/lib/types";

const SGD = `def moments(h, sigma2, B, lr, mean, var, steps):
    for _ in range(steps):
        mean = (1 - lr * h) * mean
        var = (1 - lr * h) ** 2 * var + lr ** 2 * sigma2 / B
    return mean, var

def compare_linear(h, sigma2, B, lr, k, mean, var):
    small = moments(h, sigma2, B, lr, mean, var, k)
    big = moments(h, sigma2, k * B, k * lr, mean, var, 1)
    return small, big

def max_linear_k(h, lr, tol):
    k = 1
    while abs((1 - lr * h) ** (k + 1) - (1 - (k + 1) * lr * h)) <= tol:
        k += 1
    return k`;

const NORM = `def normalised_step(g, sigma2, B, lr):
    scale = (g ** 2 + sigma2 / B) ** 0.5
    return lr * g / scale, lr ** 2 * (sigma2 / B) / scale ** 2

def rule_match(g, sigma2, B, lr, k, power):
    d1, v1 = normalised_step(g, sigma2, B, lr)
    d2, v2 = normalised_step(g, sigma2, k * B, lr * k ** power)
    return d2 / (k * d1), v2 / (k * v1)

def optimal_lr(lr_max, b_noise, B):
    return lr_max / (1 + b_noise / B)`;

export const lesson: LessonContent = {
  id: "m14.1.4",
  minutes: 45,
  links: {
    requires: ["m14.1.3"],
    revisits: ["l3.6.4", "m14.1.2"],
    foreshadows: ["m14.2.3", "m14.4.1"],
  },

  puzzle: (
    <>
      <p>
        A recipe trains well with SGD at batch 256 and learning rate 0.1. Moving to batch 8192, one team multiplies the
        learning rate by 32 and matches the old result; another does the same with Adam and the run diverges, but multiplying
        by about 5.7 works. Why should the right rule depend on the optimiser, and why does every rule eventually stop
        working?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Ask what a large batch must imitate. One step on a batch of kB should do what k steps on batches of B would have done:
        move the parameters by the same expected amount and inject the same amount of noise. For SGD, k small steps add their
        drifts and their noise variances, while one big step averages away a factor k of the noise; a learning rate k times
        larger restores both at once. For an optimiser that divides by the size of the gradient, the bigger batch also
        shrinks the divisor, so a smaller boost, the square root of k, is enough. Both arguments assume a single big step is
        still a small step. Once kη approaches the curvature limit, no rescaling can stand in for k separate steps.
      </p>
      <LrScalingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="matching steps">
        <p>
          A rule <M>{"\\eta \\mapsto \\eta(k)"}</M> for scaling the batch from B to kB matches if one step at batch kB with
          rate <M>{"\\eta(k)"}</M> gives, to leading order in the step size, the same mean displacement and the same added
          variance as k steps at batch B with rate η.
        </p>
      </Definition>

      <Theorem title="the linear rule for SGD">
        <p>
          On <M>{"\\tfrac12 h x^2"}</M> with gradient noise of variance <M>{"\\sigma^2/B"}</M>, the rule{" "}
          <M>{"\\eta(k) = k\\eta"}</M> matches. The mismatch in the mean is{" "}
          <M>{"(1-\\eta h)^k - (1 - k\\eta h) = \\binom{k}{2}\\eta^2h^2 + O(\\eta^3)"}</M>, so the rule holds while{" "}
          <M>{"k\\eta h \\ll 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The moments evolve as <M>{"\\mu \\leftarrow (1-\\eta h)\\mu"}</M> and{" "}
          <M>{"v \\leftarrow (1-\\eta h)^2 v + \\eta^2\\sigma^2/B"}</M>. After k small steps the mean is{" "}
          <M>{"(1-\\eta h)^k\\mu = (1 - k\\eta h)\\mu + O(\\eta^2)"}</M>, and the noise added is{" "}
          <M>{"k\\,\\eta^2\\sigma^2/B"}</M> up to the same order. One step at batch kB with rate kη gives mean{" "}
          <M>{"(1-k\\eta h)\\mu"}</M> and adds <M>{"k^2\\eta^2\\sigma^2/(kB) = k\\,\\eta^2\\sigma^2/B"}</M>. Both agree. The
          binomial expansion gives the leading error in the mean. Only the ratio η/B, the temperature of the noise, survives in
          the variance, which is the deeper statement: SGD with small steps behaves like a stochastic differential equation
          whose noise depends on η/B alone.
        </p>
        <Code>{SGD}</Code>
      </Proof>

      <Theorem title="the square-root rule for normalised updates">
        <p>
          Let the update be <M>{"\\eta\\,\\hat g/\\sqrt{g^2 + \\sigma^2/B}"}</M>, a sign-like step of the kind Adam takes, with{" "}
          <M>{"\\hat g"}</M> the noisy gradient. In the noise-dominated regime <M>{"g^2 \\ll \\sigma^2/B"}</M>, the rule{" "}
          <M>{"\\eta(k) = \\sqrt{k}\\,\\eta"}</M> matches, and the linear rule overshoots the drift by <M>{"\\sqrt{k}"}</M>{" "}
          and the variance by k.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"s = \\sqrt{g^2 + \\sigma^2/B} \\approx \\sigma/\\sqrt{B}"}</M>, one step has drift{" "}
          <M>{"\\eta g/s \\approx \\eta g\\sqrt{B}/\\sigma"}</M> and variance{" "}
          <M>{"\\eta^2(\\sigma^2/B)/s^2 \\approx \\eta^2"}</M>, so k steps give drift <M>{"k\\eta g\\sqrt{B}/\\sigma"}</M> and
          variance <M>{"k\\eta^2"}</M>. One step at batch kB with rate η′ gives drift{" "}
          <M>{"\\eta' g\\sqrt{kB}/\\sigma"}</M> and variance <M>{"\\eta'^2"}</M>. Both match exactly when{" "}
          <M>{"\\eta' = \\sqrt{k}\\,\\eta"}</M>; with <M>{"\\eta' = k\\eta"}</M> the drift is <M>{"\\sqrt{k}"}</M> times too
          large and the variance k times. For Adam the same analysis also asks that the averaging windows shrink, with{" "}
          <M>{"1-\\beta"}</M> multiplied by k, so that the moment estimates cover the same number of examples.
        </p>
        <Code>{NORM}</Code>
      </Proof>

      <Remark title="where every rule stops">
        <p>
          Both theorems need the big step to be small. In the model of the last two lessons the best learning rate is{" "}
          <M>{"\\eta_{\\text{opt}}(B) = \\eta_{\\max}/(1 + B_{\\text{noise}}/B)"}</M>: linear in B well below the noise
          scale, flat well above it. The critical batch size is therefore also where the linear rule stops: past it, more
          batch buys neither a bigger step nor fewer steps. In the figure the tuned rate tracks the linear rule for small
          batches and saturates below the stability limit. Practice adds a warmup, since a rate scaled for the late, gentle
          part of training is often too large for the first steps.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "linear",
      rung: "check",
      prompt: <p>SGD uses learning rate 0.1 at batch 256. Under the linear rule, what learning rate goes with batch 8192?</p>,
      answer: { kind: "numeric", value: 3.2, tolerance: 0.0001 },
    },
    {
      key: "sqrt",
      rung: "check",
      prompt: <p>Adam uses learning rate 0.0003 at batch 256. Under the square-root rule, what learning rate goes with batch 4096?</p>,
      answer: { kind: "numeric", value: 0.0012, tolerance: 0.000001 },
    },
    {
      key: "breaks",
      rung: "apply",
      prompt: <p>A team keeps applying the linear rule as it grows SGD batches far beyond the critical batch size. What happens?</p>,
      answer: {
        kind: "choice",
        options: [
          "The scaled rate eventually exceeds what the curvature allows, so training degrades or diverges, because one large step no longer imitates many small ones",
          "Nothing goes wrong: the linear rule is exact for SGD at every batch size",
          "Training becomes slower but always stays stable",
          "The gradient noise grows, so the rate must be scaled down instead",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def moments(h, sigma2, B, lr, mean, var, steps):
    for _ in range(steps):
        mean = (1 - lr * h) * mean
        var = (1 - lr * h) ** 2 * var + lr ** 2 * sigma2 / B
    return mean, var

def compare_linear(h, sigma2, B, lr, k, mean, var):
    small = moments(h, sigma2, B, lr, mean, var, k)
    big = moments(h, sigma2, k * B, k * lr, mean, var, 1)
    return small, big

def max_linear_k(h, lr, tol):
    k = 1
    while abs((1 - lr * h) ** (k + 1) - (1 - (k + 1) * lr * h)) <= tol:
        k += 1
    return k

(m1, v1), (m2, v2) = compare_linear(1.0, 2.0, 4, 0.1, 2, 1.0, 0.0)
print(round(m1, 4), round(m2, 4), round(v1, 5), round(v2, 5))
print(max_linear_k(1.0, 0.01, 0.001), max_linear_k(1.0, 0.1, 0.001))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.81 0.8 0.00905 0.01\n5 1",
          "0.81 0.8 0.01 0.01\n5 1",
          "0.8 0.8 0.00905 0.01\n5 1",
          "0.81 0.8 0.00905 0.005\n6 2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def normalised_step(g, sigma2, B, lr):
    scale = (g ** 2 + sigma2 / B) ** 0.5
    return lr * g / scale, lr ** 2 * (sigma2 / B) / scale ** 2

def rule_match(g, sigma2, B, lr, k, power):
    d1, v1 = normalised_step(g, sigma2, B, lr)
    d2, v2 = normalised_step(g, sigma2, k * B, lr * k ** power)
    return d2 / (k * d1), v2 / (k * v1)

def optimal_lr(lr_max, b_noise, B):
    return lr_max / (1 + b_noise / B)

print([round(v, 3) for v in rule_match(0.01, 1.0, 16, 0.001, 4, 0.5)], [round(v, 3) for v in rule_match(0.01, 1.0, 16, 0.001, 4, 1)])
print([round(optimal_lr(1.0, 1000, B), 3) for B in [10, 100, 1000, 10000]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.998, 0.995] [1.995, 3.981]\n[0.01, 0.091, 0.5, 0.909]",
          "[1.995, 3.981] [0.998, 0.995]\n[0.01, 0.091, 0.5, 0.909]",
          "[0.998, 0.995] [1.995, 3.981]\n[0.01, 0.1, 1.0, 10.0]",
          "[0.998, 1.995] [0.995, 3.981]\n[0.01, 0.091, 0.5, 0.909]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>moments(h, sigma2, B, lr, mean, var, steps)</C>, applying the mean and variance recurrences for SGD on ½hx²
          steps times; <C>compare_linear(h, sigma2, B, lr, k, mean, var)</C>, returning the moments after k steps at (B, lr)
          and after one step at (kB, k·lr); and <C>max_linear_k(h, lr, tol)</C>, the largest k with{" "}
          <C>|(1 − lr·h)^j − (1 − j·lr·h)| ≤ tol</C> for every j up to k.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def moments(h, sigma2, B, lr, mean, var, steps):
    return mean, var

def compare_linear(h, sigma2, B, lr, k, mean, var):
    return (mean, var), (mean, var)

def max_linear_k(h, lr, tol):
    return 1
`,
        solution: SGD,
        tests: [
          { name: "moments", code: `m, v = moments(2.0, 1.0, 2, 0.1, 1.0, 0.5, 3); rm, rv = 1.0, 0.5
for _ in range(3):
    rm = 0.8 * rm; rv = 0.64 * rv + 0.005
assert abs(m - rm) < 1e-12 and abs(v - rv) < 1e-12
(a, b), (c, d) = compare_linear(2.0, 1.0, 2, 0.1, 3, 1.0, 0.5); assert abs(a - 0.512) < 1e-12 and abs(b - 0.14132) < 1e-12 and abs(c - 0.4) < 1e-12 and abs(d - 0.095) < 1e-12` },
          { name: "limit", code: `assert max_linear_k(1.0, 0.001, 0.001) == 45 and max_linear_k(2.0, 0.05, 1e-9) == 1 and max_linear_k(0.5, 0.02, 0.002) == 6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normalised_step(g, sigma2, B, lr)</C>, returning the drift <C>lr·g/s</C> and variance{" "}
          <C>lr²(σ²/B)/s²</C> of a normalised step with <C>s = √(g² + σ²/B)</C>; <C>rule_match(g, sigma2, B, lr, k, power)</C>,
          returning the drift and variance of one step at batch kB with rate <C>lr·k^power</C>, each divided by k times that
          of one step at (B, lr); and <C>optimal_lr(lr_max, b_noise, B)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def normalised_step(g, sigma2, B, lr):
    return lr * g, lr ** 2 * sigma2 / B

def rule_match(g, sigma2, B, lr, k, power):
    return 1.0, 1.0

def optimal_lr(lr_max, b_noise, B):
    return lr_max
`,
        solution: NORM,
        tests: [
          { name: "step", code: `d, v = normalised_step(3, 16, 1, 0.5); assert abs(d - 0.3) < 1e-12 and abs(v - 0.16) < 1e-12
a, b = rule_match(1e-4, 1.0, 4, 0.01, 9, 0.5); assert abs(a - 1) < 1e-5 and abs(b - 1) < 1e-5
a, b = rule_match(1e-4, 1.0, 4, 0.01, 9, 1); assert abs(a - 3) < 1e-5 and abs(b - 9) < 1e-4` },
          { name: "optimal", code: `assert abs(optimal_lr(2.0, 300, 100) - 0.5) < 1e-12 and abs(optimal_lr(1.0, 1000, 1000) - 0.5) < 1e-12
assert abs(optimal_lr(1.0, 10, 1e9) - 1.0) < 1e-6` },
        ],
      },
    },
    {
      key: "overshoot",
      rung: "stretch",
      prompt: (
        <p>
          The best rate follows η_max/(1 + B_noise/B) with B_noise = 1000. A team tunes it exactly at B = 100 and then applies
          the linear rule to reach B = 1000. By what factor does their rate exceed the best one? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.82, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The square-root rule came from dividing by a running estimate of the gradient&apos;s size. The next chapter builds
        those estimates one at a time, beginning with AdaGrad, which divides by the accumulated squares of every past
        gradient.
      </p>
    </>
  ),
};
