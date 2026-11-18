import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WdEquilibriumViz } from "@/components/viz/WdEquilibriumViz";
import type { LessonContent } from "@/lib/types";

const COUPLED = `import numpy as np

def decay_coupled(x0, lr, wd, steps, b1=0.9, b2=0.999):
    x, m, v, path = float(x0), 0.0, 0.0, [float(x0)]
    for t in range(1, steps + 1):
        g = wd * x
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        x -= lr * (m / (1 - b1 ** t)) / (np.sqrt(v / (1 - b2 ** t)) + 1e-12)
        path.append(x)
    return path

def decay_decoupled(x0, lr, wd, steps):
    return [x0 * (1 - lr * wd) ** t for t in range(steps + 1)]

def first_below(path, level):
    return next((t for t, x in enumerate(path) if abs(x) <= level), None)`;

const EQUIL = `import numpy as np

def adamw_norms(d, lr, wd, steps, x0=None, seed=0):
    rng = np.random.default_rng(seed)
    x = np.zeros(d) if x0 is None else np.asarray(x0, float).copy()
    out = []
    for _ in range(steps):
        u = rng.choice([-1.0, 1.0], size=d)
        x = (1 - lr * wd) * x - lr * u
        out.append(float(np.linalg.norm(x)))
    return out

def equilibrium_norm(d, lr, wd):
    return float(np.sqrt(d * lr / (wd * (2 - lr * wd))))

def timescale(lr, wd):
    return 1 / (lr * wd)`;

export const lesson: LessonContent = {
  id: "m14.2.4",
  minutes: 45,
  links: {
    requires: ["m14.2.3"],
    revisits: ["l3.6.2"],
    foreshadows: ["m14.6.4", "m14.4.3"],
  },

  puzzle: (
    <>
      <p>
        Someone sweeps the L2 coefficient of an Adam run over three orders of magnitude, from 0.001 to 1, and finds that
        weights receiving no loss gradient shrink at the same speed in every run. Switching to AdamW, the coefficient
        suddenly matters a great deal, and the best value seems to depend on the learning rate and on how long the run is.
        Why would the coefficient do nothing in one optimiser and everything in the other?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adam divides whatever gradient it is given by that gradient&apos;s own size. Hand it the L2 gradient λx and the λ
        cancels: the weight shrinks by about η per step, whatever λ is. Combined with a loss gradient, the decay is divided
        by the loss gradient&apos;s size too, so weights with large gradients are barely decayed at all. AdamW applies the
        decay outside the normalisation, shrinking every weight by the factor 1 − ηλ per step. Then the weights become an
        exponential moving average of the updates, with memory 1/(ηλ) steps, and their norm settles where the shrinking
        balances the growth caused by the updates.
      </p>
      <WdEquilibriumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="coupled and decoupled decay">
        <p>
          Adam with L2 feeds <M>{"g_t + \\lambda x_t"}</M> to Adam. AdamW takes the Adam direction{" "}
          <M>{"u_t = \\hat m_t/(\\sqrt{\\hat v_t}+\\epsilon)"}</M> of the loss gradient alone and sets{" "}
          <M>{"x_{t+1} = (1-\\eta\\lambda)x_t - \\eta u_t"}</M>.
        </p>
      </Definition>

      <Theorem title="coupled decay ignores λ">
        <p>
          For a weight whose loss gradient is zero, Adam with L2 and ε = 0 produces the same trajectory for every λ &gt; 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient Adam sees is <M>{"\\lambda x_t"}</M>. Suppose two runs with <M>{"\\lambda"}</M> and{" "}
          <M>{"\\lambda'"}</M> have the same iterates up to step t. Then every gradient of the second is{" "}
          <M>{"\\lambda'/\\lambda"}</M> times that of the first, so its m is scaled by the same factor and its v by the
          square. The ratio <M>{"\\hat m/\\sqrt{\\hat v}"}</M> is unchanged, so step t+1 is the same, and induction finishes
          the proof. Each step has size at most about η, so a weight of size <M>{"x_0"}</M> needs at least{" "}
          <M>{"|x_0|/\\eta"}</M> steps to decay, however large λ is.
        </p>
        <Code>{COUPLED}</Code>
      </Proof>

      <Theorem title="AdamW weights are a moving average">
        <p>
          With <M>{"a = 1 - \\eta\\lambda"}</M>,{" "}
          <M>{"x_t = a^t x_0 + (1-a^t)\\,\\bar u_t"}</M>, where <M>{"\\bar u_t"}</M> is the exponentially weighted average
          of <M>{"-u_{t-1}/\\lambda, -u_{t-2}/\\lambda, \\dots"}</M> with weights proportional to{" "}
          <M>{"1, a, a^2, \\dots"}</M>. Its timescale is <M>{"\\tau = 1/(\\eta\\lambda)"}</M> steps. If the{" "}
          <M>{"u_t"}</M> are independent with mean zero and <M>{"E\\|u_t\\|^2 = U^2"}</M>, then
        </p>
        <MD>{"E\\|x_t\\|^2 \\to \\frac{\\eta\\,U^2}{\\lambda(2-\\eta\\lambda)} \\approx \\frac{\\eta}{2\\lambda}U^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          Unrolling, <M>{"x_t = a^t x_0 - \\eta\\sum_{s<t}a^{t-1-s}u_s"}</M>. Since{" "}
          <M>{"\\eta\\sum_{s<t}a^{t-1-s} = \\eta(1-a^t)/(1-a) = (1-a^t)/\\lambda"}</M>, the sum is{" "}
          <M>{"(1-a^t)"}</M> times a weighted average of the <M>{"-u_s/\\lambda"}</M>. For the norm, independence and zero
          mean kill the cross terms in{" "}
          <M>{"E\\|x_{t+1}\\|^2 = a^2E\\|x_t\\|^2 + \\eta^2U^2"}</M>, whose fixed point is{" "}
          <M>{"\\eta^2U^2/(1-a^2) = \\eta U^2/(\\lambda(2-\\eta\\lambda))"}</M>, approached geometrically at rate{" "}
          <M>{"a^2"}</M>.
        </p>
        <Code>{EQUIL}</Code>
      </Proof>

      <Remark title="why η and λ come as a pair">
        <p>
          For Adam-like updates <M>{"U \\approx \\sqrt d"}</M>, so the equilibrium norm is about{" "}
          <M>{"\\sqrt{d\\eta/(2\\lambda)}"}</M>. If the weight feeds a normalisation layer, only its direction matters, and
          the update rotates it by about <M>{"\\eta\\sqrt d/\\|x\\| = \\sqrt{2\\eta\\lambda}"}</M> per step: the product ηλ,
          not either factor, sets the effective learning rate. The timescale <M>{"1/(\\eta\\lambda)"}</M> also says how much
          of the run the weights remember, which is why the best λ shrinks as runs get longer. With L2 inside Adam none of
          this holds, because the decay is renormalised away.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tau",
      rung: "check",
      prompt: <p>AdamW runs with η = 0.0003 and λ = 0.1. What is the timescale 1/(ηλ) in steps? Round to a whole number.</p>,
      answer: { kind: "numeric", value: 33333, tolerance: 0.6 },
    },
    {
      key: "rms",
      rung: "check",
      prompt: <p>With sign-like updates of size η per coordinate, η = 0.001 and λ = 0.1, what is the equilibrium root-mean-square size of a coordinate, √(η/(2λ)) to good approximation? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.071, tolerance: 0.0006 },
    },
    {
      key: "coupled",
      rung: "apply",
      prompt: <p>In Adam with L2 added to the gradient, a weight&apos;s loss gradient is zero. What does raising λ from 0.01 to 1 do to how fast it decays?</p>,
      answer: {
        kind: "choice",
        options: [
          "Nothing: Adam normalises the gradient λx, so λ cancels and the weight shrinks by about η per step either way",
          "It decays a hundred times faster",
          "It decays ten times faster, the square root of the change",
          "It stops decaying, because the second moment grows",
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

def decay_coupled(x0, lr, wd, steps, b1=0.9, b2=0.999):
    x, m, v, path = float(x0), 0.0, 0.0, [float(x0)]
    for t in range(1, steps + 1):
        g = wd * x
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        x -= lr * (m / (1 - b1 ** t)) / (np.sqrt(v / (1 - b2 ** t)) + 1e-12)
        path.append(x)
    return path

def decay_decoupled(x0, lr, wd, steps):
    return [x0 * (1 - lr * wd) ** t for t in range(steps + 1)]

def first_below(path, level):
    return next((t for t, x in enumerate(path) if abs(x) <= level), None)

c, w = decay_coupled(1.0, 0.01, 0.1, 300), decay_decoupled(1.0, 0.01, 0.1, 300)
print(first_below(c, 0.5), first_below(w, 0.5), round(c[50], 2), round(w[50], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["55 None 0.54 0.951", "None 55 0.951 0.54", "55 None 0.5 0.951", "55 69 0.54 0.951"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def adamw_norms(d, lr, wd, steps, x0=None, seed=0):
    rng = np.random.default_rng(seed)
    x = np.zeros(d) if x0 is None else np.asarray(x0, float).copy()
    out = []
    for _ in range(steps):
        u = rng.choice([-1.0, 1.0], size=d)
        x = (1 - lr * wd) * x - lr * u
        out.append(float(np.linalg.norm(x)))
    return out

def equilibrium_norm(d, lr, wd):
    return float(np.sqrt(d * lr / (wd * (2 - lr * wd))))

def timescale(lr, wd):
    return 1 / (lr * wd)

n = adamw_norms(100, 0.01, 0.1, 6000)
print(round(equilibrium_norm(100, 0.01, 0.1), 2), round(sum(n[-2000:]) / 2000, 1), timescale(0.01, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.24 2.3 1000.0", "3.16 2.3 1000.0", "2.24 2.3 0.001", "0.22 0.2 1000.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>decay_coupled(x0, lr, wd, steps, b1=0.9, b2=0.999)</C>, the path of a scalar weight under Adam with bias
          correction whose only gradient is <C>wd * x</C> (use ε = 1e-12, include x0); <C>decay_decoupled(x0, lr, wd, steps)</C>,
          the path under pure decoupled decay; and <C>first_below(path, level)</C>, the first index with |x| ≤ level, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def decay_coupled(x0, lr, wd, steps, b1=0.9, b2=0.999):
    return [x0 * (1 - lr * wd) ** t for t in range(steps + 1)]

def decay_decoupled(x0, lr, wd, steps):
    return [x0] * (steps + 1)

def first_below(path, level):
    return None
`,
        solution: COUPLED,
        tests: [
          { name: "coupled", code: `a, b = decay_coupled(1.0, 0.01, 0.1, 200), decay_coupled(1.0, 0.01, 100.0, 200)
assert len(a) == 201 and np.allclose(a, b, atol=1e-9) and abs(a[1] - 0.99) < 1e-9 and 0.5 < a[50] < 0.6` },
          { name: "decoupled", code: `w = decay_decoupled(2.0, 0.1, 0.5, 3); assert np.allclose(w, [2.0, 1.9, 1.805, 1.71475])
assert first_below(decay_decoupled(1.0, 0.01, 0.1, 1000), 0.5) == 693 and first_below([3, -2, 1], 1) == 2 and first_below([3, 2], 1) is None` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>adamw_norms(d, lr, wd, steps, x0=None, seed=0)</C>: starting from zeros (or x0), each step draws{" "}
          <C>u = rng.choice([-1.0, 1.0], size=d)</C> from <C>rng = np.random.default_rng(seed)</C>, sets{" "}
          <C>x = (1 − lr·wd)x − lr·u</C>, and records the norm. Also write <C>equilibrium_norm(d, lr, wd)</C> and{" "}
          <C>timescale(lr, wd)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adamw_norms(d, lr, wd, steps, x0=None, seed=0):
    return [0.0] * steps

def equilibrium_norm(d, lr, wd):
    return 0.0

def timescale(lr, wd):
    return 0.0
`,
        solution: EQUIL,
        tests: [
          { name: "norms", code: `rng = np.random.default_rng(0); x = np.ones(4); ref = []
for _ in range(3):
    x = 0.9 * x - 0.1 * rng.choice([-1.0, 1.0], size=4); ref.append(np.linalg.norm(x))
assert np.allclose(adamw_norms(4, 0.1, 1.0, 3, x0=[1, 1, 1, 1]), ref) and len(adamw_norms(3, 0.1, 1.0, 7)) == 7` },
          { name: "equilibrium", code: `assert abs(equilibrium_norm(50, 0.02, 0.5) - np.sqrt(50 * 0.02 / (0.5 * 1.99))) < 1e-12 and abs(timescale(0.01, 0.1) - 1000) < 1e-9
n = adamw_norms(50, 0.02, 0.5, 4000, seed=3); assert abs(np.sqrt(np.mean(np.square(n[-2000:]))) / equilibrium_norm(50, 0.02, 0.5) - 1) < 0.08` },
        ],
      },
    },
    {
      key: "lambda",
      rung: "stretch",
      prompt: (
        <p>
          A run of 100,000 steps uses AdamW with η = 0.001, and the team wants the weights to remember the last fifth of
          the run, a timescale of 20,000 steps. What λ should they use?
        </p>
      ),
      answer: { kind: "numeric", value: 0.05, tolerance: 0.000001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Adam is now complete: momentum, a per-coordinate scale, bias corrections and decoupled decay. It is the default for
        good reasons, but it is not always right. The next lesson collects the cases where it provably fails or quietly
        does worse than SGD.
      </p>
    </>
  ),
};
