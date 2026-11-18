import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WarmupCatapultViz } from "@/components/viz/WarmupCatapultViz";
import type { LessonContent } from "@/lib/types";

const UV = `import numpy as np

def uv_sharpness(u, v, y):
    H = np.array([[v * v, 2 * u * v - y], [2 * u * v - y, u * u]])
    return float(np.linalg.eigvalsh(H)[-1])

def run_uv(u, v, y, lrs, noise=0.0, seed=0):
    rng = np.random.default_rng(seed)
    out = []
    for lr in lrs:
        r = u * v - (y + noise * rng.standard_normal())
        u, v = u - lr * r * v, v - lr * r * u
        if not abs(u * v) < 1e6:
            out.append((float('inf'), float('inf')))
            break
        out.append((0.5 * (u * v - y) ** 2, uv_sharpness(u, v, y)))
    return out

def warmup(lr_max, steps, warm):
    return [lr_max * min(1.0, (t + 1) / warm) for t in range(steps)]`;

const BAL = `import numpy as np

def gd_step(u, v, y, lr):
    r = u * v - y
    return u - lr * r * v, v - lr * r * u

def sharpness_at_min(D, y):
    return float(np.sqrt(D * D + 4 * y * y))

def stable_lr(D, y):
    return 2 / sharpness_at_min(D, y)`;

export const lesson: LessonContent = {
  id: "m14.4.1",
  minutes: 45,
  links: {
    requires: ["l3.6.3", "m14.1.1"],
    revisits: ["m10.5.2"],
    foreshadows: ["m14.5.3", "m14.6.2"],
  },

  puzzle: (
    <>
      <p>
        A run with peak learning rate 0.8 diverges in three steps. The same run with the rate raised linearly over the
        first 200 steps trains smoothly and ends at a loss as good as any. The final rate is the same, and so, it turns
        out, is the loss surface. What changed is where on that surface the run ended up, and warmup is what put it
        there.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradient descent is only stable near a minimum whose sharpness, the top Hessian eigenvalue, is below 2/η. Networks
        often start in sharp regions. If η is already large, the first steps overshoot violently and the run blows up. If η
        rises slowly, each time it crosses 2/sharpness the run becomes slightly unstable, the loss bounces, and that
        bouncing pushes the parameters towards a flatter region where the larger η is safe again. Warmup turns one
        catastrophic instability into many small, self-correcting ones. A two-parameter model, f = uv fitted to a target,
        shows the whole mechanism exactly.
      </p>
      <WarmupCatapultViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the uv model">
        <p>
          Minimise <M>{"L(u, v) = \\tfrac12(uv - y)^2"}</M> with y ≠ 0, the simplest model with two layers. Write{" "}
          <M>{"r = uv - y"}</M> for the residual and <M>{"D = u^2 - v^2"}</M> for the imbalance. Gradient descent is{" "}
          <M>{"u \\leftarrow u - \\eta rv"}</M>, <M>{"v \\leftarrow v - \\eta ru"}</M>.
        </p>
      </Definition>

      <Theorem title="sharpness of the minima">
        <p>
          The minima are the hyperbola uv = y. At a minimum the Hessian has eigenvalues 0 and{" "}
          <M>{"u^2 + v^2 = \\sqrt{D^2 + 4y^2}"}</M>, so gradient descent is stable there exactly when{" "}
          <M>{"\\eta \\le 2/\\sqrt{D^2 + 4y^2}"}</M>. The flattest minima are the balanced ones, D = 0, with sharpness 2|y|.
        </p>
      </Theorem>
      <Proof>
        <p>
          The Hessian is <M>{"\\begin{pmatrix} v^2 & 2uv - y \\\\ 2uv - y & u^2\\end{pmatrix}"}</M>, which at uv = y becomes{" "}
          <M>{"\\begin{pmatrix} v^2 & uv \\\\ uv & u^2\\end{pmatrix} = (v, u)^\\top(v, u)"}</M>, of rank one with nonzero
          eigenvalue <M>{"u^2 + v^2"}</M>. Then <M>{"(u^2+v^2)^2 = (u^2-v^2)^2 + 4u^2v^2 = D^2 + 4y^2"}</M>. Gradient descent
          on a quadratic is stable when η times the top eigenvalue is at most 2, and the zero direction (along the
          hyperbola) is neutral.
        </p>
        <Code>{UV}</Code>
      </Proof>

      <Theorem title="instability rebalances">
        <p>
          One step of gradient descent multiplies the imbalance by <M>{"1 - \\eta^2r^2"}</M>:{" "}
          <M>{"D' = (1 - \\eta^2r^2)D"}</M>. So the imbalance shrinks when <M>{"0 < \\eta|r| < \\sqrt2"}</M> and grows when{" "}
          <M>{"\\eta|r| > \\sqrt2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"u'^2 - v'^2 = (u - \\eta rv)^2 - (v - \\eta ru)^2 = u^2 - 2\\eta ruv + \\eta^2r^2v^2 - v^2 + 2\\eta ruv - \\eta^2r^2u^2"}</M>,
          and the cross terms cancel, leaving <M>{"(u^2 - v^2)(1 - \\eta^2r^2)"}</M>. Near a stable minimum r is tiny and D
          barely moves; that is why gradient flow conserves D exactly. When η exceeds the stability limit, r grows, and while{" "}
          <M>{"\\eta|r|"}</M> stays below √2 each step shrinks |D| and hence the sharpness{" "}
          <M>{"\\sqrt{D^2 + 4y^2}"}</M>, until the minimum is flat enough to be stable: the loss spikes and then settles,
          a catapult. If η is so large that <M>{"\\eta|r|"}</M> passes √2, |D| grows instead, the sharpness rises, and the run
          diverges.
        </p>
        <Code>{BAL}</Code>
      </Proof>

      <Remark title="what warmup does, and the other reasons for it">
        <p>
          With a slowly rising η, each crossing of the stability limit happens with η only slightly too large, so r stays
          small, <M>{"\\eta|r|"}</M> stays well below √2, and the rebalancing is gentle. Starting at the peak rate makes the
          first residuals huge, and the same mechanism runs in reverse. Real networks show the same pattern: sharpness
          falls during warmup to track 2/η, which is one face of the edge of stability met later in this course. Adam adds
          a second reason, since its early second-moment estimates average only a few squared gradients and are noisy,
          and a third comes from normalisation layers, whose effective learning rate depends on weight norms that are still
          changing. All three argue for small steps at first.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "maxlr",
      rung: "check",
      prompt: <p>In the uv model with target y = 2, what is the largest learning rate at which some minimum is stable?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "imb",
      rung: "check",
      prompt: <p>The imbalance is D = 8 and a step with η = 0.2 sees residual r = 3. What is the imbalance after the step?</p>,
      answer: { kind: "numeric", value: 5.12, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>In this model, how does warmup let a run reach a learning rate that would diverge if used from the start?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each small overshoot produces a moderate residual that shrinks the imbalance and so the sharpness, until the larger rate is stable; a sudden large rate makes residuals so big that the imbalance grows instead",
          "Warmup changes the loss function so that its minima become flatter",
          "Warmup lets the run reach the minimum before the rate rises, and gradient descent never leaves a minimum",
          "Warmup only matters for Adam; plain gradient descent behaves the same either way",
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

def uv_sharpness(u, v, y):
    H = np.array([[v * v, 2 * u * v - y], [2 * u * v - y, u * u]])
    return float(np.linalg.eigvalsh(H)[-1])

def run_uv(u, v, y, lrs, noise=0.0, seed=0):
    rng = np.random.default_rng(seed)
    out = []
    for lr in lrs:
        r = u * v - (y + noise * rng.standard_normal())
        u, v = u - lr * r * v, v - lr * r * u
        if not abs(u * v) < 1e6:
            out.append((float('inf'), float('inf')))
            break
        out.append((0.5 * (u * v - y) ** 2, uv_sharpness(u, v, y)))
    return out

def warmup(lr_max, steps, warm):
    return [lr_max * min(1.0, (t + 1) / warm) for t in range(steps)]

print(warmup(1.0, 5, 4), round(uv_sharpness(2.0, 0.5, 1.0), 3), round(uv_sharpness(1.0, 1.0, 1.0), 3))
tr = run_uv(4.0, 0.1, 1.0, warmup(0.8, 1000, 1)); print(len(tr), tr[-1][0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.25, 0.5, 0.75, 1.0, 1.0] 4.25 2.0\n3 inf",
          "[0.2, 0.4, 0.6, 0.8, 1.0] 4.25 2.0\n3 inf",
          "[0.25, 0.5, 0.75, 1.0, 1.0] 4.25 2.0\n1000 0.0017",
          "[0.25, 0.5, 0.75, 1.0, 1.0] 4.0 1.0\n3 inf",
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

def gd_step(u, v, y, lr):
    r = u * v - y
    return u - lr * r * v, v - lr * r * u

def sharpness_at_min(D, y):
    return float(np.sqrt(D * D + 4 * y * y))

def stable_lr(D, y):
    return 2 / sharpness_at_min(D, y)

u, v = gd_step(2.0, 1.0, 1.0, 0.5)
print(u, v, u * u - v * v, (2.0 ** 2 - 1.0 ** 2) * (1 - 0.5 ** 2))
print(sharpness_at_min(0.0, 1.0), round(sharpness_at_min(15.99, 0.4), 3), round(stable_lr(3.0, 2.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.5 0.0 2.25 2.25\n2.0 16.01 0.4",
          "1.5 0.0 2.25 3.0\n2.0 16.01 0.4",
          "1.5 0.5 2.0 2.25\n2.0 16.01 0.4",
          "1.5 0.0 2.25 2.25\n0.0 16.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>uv_sharpness(u, v, y)</C>, the top eigenvalue of the Hessian of ½(uv − y)²;{" "}
          <C>run_uv(u, v, y, lrs, noise=0.0, seed=0)</C>, running one gradient step per learning rate with residual{" "}
          <C>uv − (y + noise·ξ)</C>, ξ from <C>np.random.default_rng(seed).standard_normal()</C>, recording (loss against
          the clean y, sharpness) after each step and stopping with <C>(inf, inf)</C> once |uv| is not below 1e6; and{" "}
          <C>warmup(lr_max, steps, warm)</C>, the list <C>lr_max·min(1, (t+1)/warm)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def uv_sharpness(u, v, y):
    return u * u + v * v

def run_uv(u, v, y, lrs, noise=0.0, seed=0):
    return []

def warmup(lr_max, steps, warm):
    return [lr_max] * steps
`,
        solution: UV,
        tests: [
          { name: "basics", code: `assert abs(uv_sharpness(2.0, 0.5, 1.0) - 4.25) < 1e-12 and abs(uv_sharpness(1.0, 1.0, 1.0) - 2) < 1e-12
H = np.array([[0.09, 2 * 0.9 - 2.0], [2 * 0.9 - 2.0, 9.0]]); assert abs(uv_sharpness(3.0, 0.3, 2.0) - np.linalg.eigvalsh(H)[-1]) < 1e-12
assert np.allclose(warmup(2.0, 4, 2), [1.0, 2.0, 2.0, 2.0])` },
          { name: "runs", code: `assert np.allclose(run_uv(1.0, 2.0, 1.0, [0.1, 0.1]), [(0.1352, 4.648256824027234), (0.04593786029880319, 4.157444814742768)])
assert np.allclose(run_uv(1.0, 2.0, 1.0, [0.1, 0.1], noise=0.5, seed=3), [(0.510290562099198, 5.8806204586571535), (0.0005218278975489798, 3.42121281283719)])
tr = run_uv(4.0, 0.1, 1.0, warmup(0.8, 1000, 1)); assert len(tr) == 3 and tr[-1][0] == float('inf')` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gd_step(u, v, y, lr)</C>; <C>sharpness_at_min(D, y)</C>, the sharpness of the minimum with imbalance
          D = u² − v²; and <C>stable_lr(D, y)</C>, the largest learning rate stable there.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_step(u, v, y, lr):
    return u, v

def sharpness_at_min(D, y):
    return 2 * abs(y)

def stable_lr(D, y):
    return 1 / abs(y)
`,
        solution: BAL,
        tests: [
          { name: "step", code: `u, v = gd_step(2.0, 1.0, 1.0, 0.5); assert abs(u - 1.5) < 1e-12 and abs(v) < 1e-12
rng = np.random.default_rng(0)
for _ in range(20):
    u, v, y, lr = *rng.normal(size=3), rng.random(); r = u * v - y; a, b = gd_step(u, v, y, lr)
    assert abs((a * a - b * b) - (1 - lr ** 2 * r ** 2) * (u * u - v * v)) < 1e-9` },
          { name: "minimum", code: `assert abs(sharpness_at_min(3.75, 1.0) - 4.25) < 1e-12 and abs(stable_lr(3.0, 2.0) - 0.4) < 1e-12
assert abs(sharpness_at_min(0.0, -3.0) - 6) < 1e-12 and abs(stable_lr(0.0, 1.0) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "frozen",
      rung: "stretch",
      prompt: (
        <p>
          A run starts at (u, v) = (4, 0.1) with y = 1. If its imbalance never changed, it would settle in the minimum with
          D = 15.99. What is the largest learning rate stable there? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.124, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Warmup governs the start of a run; the shape of the rest is the next question. Cosine decay, the default for
        years, lowers the rate smoothly to near zero, and the next lesson asks what that buys and what it assumes about
        the length of the run.
      </p>
    </>
  ),
};
