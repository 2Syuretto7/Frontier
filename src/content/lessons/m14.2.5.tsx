import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AmsgradViz } from "@/components/viz/AmsgradViz";
import type { LessonContent } from "@/lib/types";

const GAME = `import numpy as np

def reddi_grad(t, C):
    return C if t % 3 == 1 else -1.0

def run_online(C, steps, b2, lr=0.5, amsgrad=False, x0=0.0):
    x, v, vmax, xs = x0, 0.0, 0.0, []
    for t in range(1, steps + 1):
        g = reddi_grad(t, C)
        v = b2 * v + (1 - b2) * g * g
        vmax = max(vmax, v)
        step = lr / np.sqrt(t) * g / np.sqrt(vmax if amsgrad else v)
        x = min(1.0, max(-1.0, x - step))
        xs.append(x)
    return xs

def regret(xs, C):
    loss = sum(reddi_grad(t, C) * x for t, x in enumerate(xs, 1))
    best = min(sum(reddi_grad(t, C) * s for t in range(1, len(xs) + 1)) for s in (-1.0, 1.0))
    return loss - best`;

const CYCLE = `import numpy as np

def cycle_v(C, b2):
    v3 = (1 - b2) * (b2 ** 2 * C ** 2 + b2 + 1) / (1 - b2 ** 3)
    v1 = b2 * v3 + (1 - b2) * C ** 2
    v2 = b2 * v1 + (1 - b2)
    return v1, v2, v3

def period_drift(C, b2, amsgrad=False):
    v1, v2, v3 = cycle_v(C, b2)
    if amsgrad:
        return (2 - C) / np.sqrt(max(v1, v2, v3))
    return -C / np.sqrt(v1) + 1 / np.sqrt(v2) + 1 / np.sqrt(v3)

def critical_b2(C, tol=1e-10):
    lo, hi = 0.0, 1.0 - 1e-12
    while hi - lo > tol:
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if period_drift(C, mid) > 0 else (lo, mid)
    return (lo + hi) / 2`;

export const lesson: LessonContent = {
  id: "m14.2.5",
  minutes: 45,
  links: {
    requires: ["m14.2.3", "m14.2.1"],
    revisits: ["m14.2.2"],
    foreshadows: ["m14.3.1", "m14.6.2"],
  },

  puzzle: (
    <>
      <p>
        On the interval [−1, 1], the losses arrive in a repeating pattern: 3x, then −x, then −x. Over each period they add
        up to x, so the best fixed choice is x = −1. A simple online gradient method finds it. Adam, with a short memory for
        its second moment, walks steadily to x = +1, the worst point, and stays there however small its learning rate
        becomes. What is it doing wrong, and why do practitioners almost never see this?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adam measures each gradient in units of its recent typical size. The informative gradient here is rare and large;
        the misleading ones are frequent and small. With a short memory, the large gradient inflates v just before it is
        used, so its step is shrunk to about η, and v has decayed again by the time the small gradients arrive, so their
        steps are also about η. Two wrong-way steps beat one right-way step. The fault is that Adam&apos;s rate can rise
        between steps; the proof that worked for AdaGrad needed it never to rise. AMSGrad divides by the largest v so far,
        which restores that, and a long memory (β₂ near 1) has the same effect in practice.
      </p>
      <AmsgradViz />
    </>
  ),

  theory: (
    <>
      <Definition title="AMSGrad">
        <p>
          Run Adam&apos;s recursions for m and v, keep <M>{"\\hat v_t = \\max(\\hat v_{t-1}, v_t)"}</M>, and step{" "}
          <M>{"x_{t+1} = \\Pi(x_t - \\alpha_t m_t/\\sqrt{\\hat v_t})"}</M>. With <M>{"\\alpha_t"}</M> non-increasing, every
          coordinate&apos;s rate <M>{"\\alpha_t/\\sqrt{\\hat v_{t,i}}"}</M> is non-increasing.
        </p>
      </Definition>

      <Theorem title="sign descent fails on the example">
        <p>
          Take β₁ = 0 and β₂ = 0, so each step is <M>{"-\\alpha_t\\operatorname{sign}(g_t)"}</M>, on the losses{" "}
          <M>{"Cx, -x, -x, \\dots"}</M> with C &gt; 2, and rates <M>{"\\alpha_t = \\alpha/\\sqrt t"}</M>. Then{" "}
          <M>{"x_t \\to +1"}</M> and the regret grows linearly in T, at about{" "}
          <M>{"\\tfrac{2}{3}"}</M> per step.
        </p>
      </Theorem>
      <Proof>
        <p>
          Over the period starting at t = 3k+1 the moves are{" "}
          <M>{"-\\alpha_{3k+1} + \\alpha_{3k+2} + \\alpha_{3k+3}"}</M>. Since <M>{"\\alpha_t"}</M> varies by{" "}
          <M>{"O(\\alpha t^{-3/2})"}</M> within a period, this is <M>{"\\alpha_{3k+3} + O(\\alpha k^{-3/2})"}</M>, positive
          for large k, and the positive parts sum to infinity because <M>{"\\sum 1/\\sqrt t"}</M> diverges. So x reaches the
          boundary +1, and once there the clipped moves keep it within <M>{"O(\\alpha/\\sqrt t)"}</M> of it. Each period at
          +1 costs <M>{"C - 2"}</M>, while −1 earns <M>{"-(C-2)"}</M>, so the regret grows by about{" "}
          <M>{"2(C-2)/3"}</M> per step, which is 2/3 for C = 3. AMSGrad fixes it: <M>{"\\hat v = C^2"}</M> from the first
          step on, and every period moves by <M>{"(2-C)\\alpha/C < 0"}</M>.
        </p>
        <Code>{GAME}</Code>
      </Proof>

      <Theorem title="when Adam fails, for general β₂">
        <p>
          With β₁ = 0 and slowly varying rates, v settles into a three-step cycle{" "}
          <M>{"(v_1, v_2, v_3)"}</M> with <M>{"v_3 = (1-\\beta_2)(\\beta_2^2C^2 + \\beta_2 + 1)/(1-\\beta_2^3)"}</M>, and the
          movement per period is proportional to
        </p>
        <MD>{"\\delta(\\beta_2) = -\\frac{C}{\\sqrt{v_1}} + \\frac{1}{\\sqrt{v_2}} + \\frac{1}{\\sqrt{v_3}}."}</MD>
        <p>
          Adam goes to the wrong end when δ &gt; 0. For C = 3 that happens exactly when β₂ is below about 0.472; the
          threshold falls as C grows.
        </p>
      </Theorem>
      <Proof>
        <p>
          In the cycle, <M>{"v_1 = \\beta_2v_3 + (1-\\beta_2)C^2"}</M>, <M>{"v_2 = \\beta_2v_1 + (1-\\beta_2)"}</M> and{" "}
          <M>{"v_3 = \\beta_2v_2 + (1-\\beta_2)"}</M>. Substituting the first two into the third gives{" "}
          <M>{"v_3(1-\\beta_2^3) = (1-\\beta_2)(\\beta_2^2C^2 + \\beta_2 + 1)"}</M>. The three steps of a period are{" "}
          <M>{"-\\alpha g/\\sqrt v"}</M> with g = C, −1, −1, whose sum is <M>{"\\alpha\\delta"}</M>. At β₂ = 0, δ = 1; as β₂ →
          1 every v tends to the average <M>{"(C^2+2)/3"}</M> and δ tends to{" "}
          <M>{"(2-C)/\\sqrt{(C^2+2)/3} < 0"}</M>. Bisection on δ finds the crossing.
        </p>
        <Code>{CYCLE}</Code>
      </Proof>

      <Remark title="what this does and does not mean">
        <p>
          The counterexample needs β₂ small relative to the gaps between informative gradients. With the usual 0.999 the
          memory spans hundreds of steps, and later analyses show Adam converges when β₂ is close enough to 1 for the
          problem at hand. The practical lessons are narrower: very short second-moment memory is risky, a rate that jumps
          up after a quiet stretch is the same mechanism that turns rare large gradients into instability, and Adam&apos;s
          normalisation discards gradient magnitude, which is exactly the information this example needed. Other known
          weak spots are a generalisation gap against well-tuned SGD on some vision tasks, and sensitivity to ε when
          gradients are tiny.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ams",
      rung: "check",
      prompt: <p>On the losses 5x, −x, −x repeating, with β₂ = 0, AMSGrad has v̂ = 25 after the first step. What is its movement per period in units of the rate α?</p>,
      answer: { kind: "numeric", value: -0.6, tolerance: 0.0001 },
    },
    {
      key: "regret",
      rung: "check",
      prompt: <p>On 3x, −x, −x repeating, an algorithm sits at x = +1 for ever. What is its regret per step against x = −1? Give two decimals.</p>,
      answer: { kind: "numeric", value: 0.67, tolerance: 0.006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What is the root cause of Adam&apos;s failure on this example?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its per-coordinate rate rises between steps as v forgets the large gradient, so the rare informative gradient and the frequent misleading ones all become steps of similar size",
          "Its momentum overshoots the minimum",
          "The bias correction divides by a number close to zero",
          "The losses are not convex",
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

def reddi_grad(t, C):
    return C if t % 3 == 1 else -1.0

def run_online(C, steps, b2, lr=0.5, amsgrad=False, x0=0.0):
    x, v, vmax, xs = x0, 0.0, 0.0, []
    for t in range(1, steps + 1):
        g = reddi_grad(t, C)
        v = b2 * v + (1 - b2) * g * g
        vmax = max(vmax, v)
        step = lr / np.sqrt(t) * g / np.sqrt(vmax if amsgrad else v)
        x = min(1.0, max(-1.0, x - step))
        xs.append(x)
    return xs

def regret(xs, C):
    loss = sum(reddi_grad(t, C) * x for t, x in enumerate(xs, 1))
    best = min(sum(reddi_grad(t, C) * s for t in range(1, len(xs) + 1)) for s in (-1.0, 1.0))
    return loss - best

print([reddi_grad(t, 3) for t in range(1, 5)], round(regret([1.0, 1.0, 1.0], 3), 1), round(regret([-1.0, -1.0, -1.0], 3), 1))
xs, ys = run_online(3, 3000, 0.1), run_online(3, 3000, 0.1, amsgrad=True)
print(round(xs[-1]), round(ys[-1]), round(regret(xs, 3) / 3000, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, -1.0, -1.0, 3] 2.0 0.0\n1 -1 0.65",
          "[3, -1.0, -1.0, 3] 2.0 0.0\n-1 -1 0.0",
          "[-1.0, 3, -1.0, -1.0] 2.0 0.0\n1 -1 0.65",
          "[3, -1.0, -1.0, 3] 0.0 2.0\n1 -1 0.65",
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

def cycle_v(C, b2):
    v3 = (1 - b2) * (b2 ** 2 * C ** 2 + b2 + 1) / (1 - b2 ** 3)
    v1 = b2 * v3 + (1 - b2) * C ** 2
    v2 = b2 * v1 + (1 - b2)
    return v1, v2, v3

def period_drift(C, b2, amsgrad=False):
    v1, v2, v3 = cycle_v(C, b2)
    if amsgrad:
        return (2 - C) / np.sqrt(max(v1, v2, v3))
    return -C / np.sqrt(v1) + 1 / np.sqrt(v2) + 1 / np.sqrt(v3)

def critical_b2(C, tol=1e-10):
    lo, hi = 0.0, 1.0 - 1e-12
    while hi - lo > tol:
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if period_drift(C, mid) > 0 else (lo, mid)
    return (lo + hi) / 2

print(cycle_v(3, 0.0), round(period_drift(3, 0.0), 3), round(period_drift(3, 0.0, amsgrad=True), 3))
print(round(critical_b2(3), 3), period_drift(3, 0.9) < 0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(9.0, 1.0, 1.0) 1.0 -0.333\n0.472 True",
          "(9.0, 1.0, 1.0) -1.0 -0.333\n0.472 True",
          "(9.0, 1.0, 1.0) 1.0 0.333\n0.472 False",
          "(1.0, 1.0, 9.0) 1.0 -0.333\n0.472 True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reddi_grad(t, C)</C>, which is C when t mod 3 is 1 and −1.0 otherwise; <C>run_online(C, steps, b2, lr=0.5,
          amsgrad=False, x0=0.0)</C>, running Adam with β₁ = 0 (or AMSGrad) for t = 1, 2, … with rate <C>lr/√t</C> and
          clipping to [−1, 1], returning the iterates after each step; and <C>regret(xs, C)</C>, the total loss of the iterates
          (the t-th iterate pays the t-th loss) minus that of the better fixed endpoint.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def reddi_grad(t, C):
    return -1.0

def run_online(C, steps, b2, lr=0.5, amsgrad=False, x0=0.0):
    return [x0] * steps

def regret(xs, C):
    return 0.0
`,
        solution: GAME,
        tests: [
          { name: "game", code: `assert [reddi_grad(t, 4) for t in range(1, 7)] == [4, -1.0, -1.0, 4, -1.0, -1.0]
assert abs(regret([1.0, 1.0, 1.0], 3) - 2) < 1e-12 and abs(regret([-1.0] * 6, 3)) < 1e-12 and abs(regret([0.0, 0.5, -0.5], 5) - 3) < 1e-12` },
          { name: "runs", code: `xs = run_online(3, 4, 0.1); assert np.allclose(xs, [-0.5270462766947299, -0.2566772414767924, 0.02226522810844861, -0.23953281793038045])
assert run_online(5, 3000, 0.05)[-1] > 0.99 and run_online(5, 3000, 0.05, amsgrad=True)[-1] < -0.99 and run_online(3, 3000, 0.9)[-1] < -0.98` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cycle_v(C, b2)</C>, returning the settled <C>(v1, v2, v3)</C>; <C>period_drift(C, b2, amsgrad=False)</C>,
          returning δ, or <C>(2 − C)/√max(v1, v2, v3)</C> for AMSGrad; and <C>critical_b2(C, tol=1e-10)</C>, the β₂ in
          (0, 1) where δ changes sign, by bisection.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cycle_v(C, b2):
    return C * C, 1.0, 1.0

def period_drift(C, b2, amsgrad=False):
    return 0.0

def critical_b2(C, tol=1e-10):
    return 0.5
`,
        solution: CYCLE,
        tests: [
          { name: "cycle", code: `v1, v2, v3 = cycle_v(2, 0.5); assert np.allclose([v1, v2, v3], [19 / 7, 13 / 7, 10 / 7])
assert abs(period_drift(3, 0.0) - 1) < 1e-12 and abs(period_drift(5, 0.0, amsgrad=True) + 0.6) < 1e-12 and period_drift(3, 0.999) < 0` },
          { name: "critical", code: `b = critical_b2(3); assert abs(b - 0.4723131) < 1e-5 and period_drift(3, b - 0.01) > 0 > period_drift(3, b + 0.01)
assert abs(critical_b2(5) - 0.2368152) < 1e-5 and critical_b2(10) < critical_b2(5)` },
        ],
      },
    },
    {
      key: "crit",
      rung: "stretch",
      prompt: <p>For the losses 5x, −x, −x repeating, below what β₂ does Adam with β₁ = 0 drift to the wrong end? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.237, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every method in this chapter rescales coordinates independently, as if the axes of parameter space were special.
        The next chapter drops that assumption: it asks what steepest descent means under other norms, and finds that
        sign descent, Adam&apos;s close relative, is steepest descent under the max norm.
      </p>
    </>
  ),
};
