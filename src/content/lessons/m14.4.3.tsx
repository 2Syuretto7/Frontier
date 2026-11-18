import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WsdBranchViz } from "@/components/viz/WsdBranchViz";
import type { LessonContent } from "@/lib/types";

const WSD = `import numpy as np

def wsd(t, T, lr, warm, decay):
    if t < warm:
        return lr * (t + 1) / warm
    start = T - decay
    if t < start:
        return lr
    return lr * max(0.0, (T - t) / decay)

def expected_losses(h, x0sq, sigma2, lrs):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    out = []
    for lr in lrs:
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        out.append(0.5 * float(np.sum(h * m)))
    return out

def area(lrs):
    return float(np.sum(lrs))`;

const DROP = `import numpy as np

def floor_m(h, sigma2, lr):
    return lr * sigma2 / (h * (2 - lr * h))

def after_drop(h, sigma2, lr_old, lr_new, t):
    old, new = floor_m(h, sigma2, lr_old), floor_m(h, sigma2, lr_new)
    return new + (1 - lr_new * h) ** (2 * t) * (old - new)

def anneal_steps(h, lr_new, frac):
    return int(np.ceil(np.log(frac) / (2 * np.log(abs(1 - lr_new * h)))))`;

export const lesson: LessonContent = {
  id: "m14.4.3",
  minutes: 40,
  links: {
    requires: ["m14.4.2"],
    revisits: ["m14.4.1"],
    foreshadows: ["m14.4.4", "m14.4.5"],
  },

  puzzle: (
    <>
      <p>
        To fit a scaling law, a lab needs finished models trained for 1, 2, 4 and 8 billion tokens. With cosine schedules
        that is four separate runs, 15 billion tokens of compute. With a different schedule the lab trains once for 8
        billion tokens, plus short side branches, about 8.7 billion tokens in all, and gets four models at least as good.
        What is the schedule, and why does it not lose quality for the savings?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The previous lesson split the loss into a part that needs distance travelled and a part that needs a small current
        rate. Warmup-stable-decay schedules the two separately. After warmup the rate is held constant, and the run
        travels while hovering at the noise floor of that rate. Whenever a finished model is wanted, a branch decays the
        rate to zero over a short stretch, which removes the noise floor without needing much distance. The stable phase
        never commits to a length, so one run serves every length, and checkpoints from it can be resumed and extended.
      </p>
      <WsdBranchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="warmup-stable-decay">
        <p>
          For a run of T steps with warmup W and decay length K, the rate rises linearly to η over W steps, stays at η until
          step T − K, and then falls linearly to 0: <M>{"\\eta_t = \\eta\\,(T-t)/K"}</M> for <M>{"T-K \\le t < T"}</M>. A branch
          at length T′ &lt; T reuses the stable run up to <M>{"T' - K'"}</M> and decays from there.
        </p>
      </Definition>

      <Theorem title="relaxation after a drop">
        <p>
          On a coordinate with curvature h and gradient noise <M>{"\\sigma^2"}</M>, a constant rate η leaves{" "}
          <M>{"E[x^2]"}</M> at <M>{"m^*(\\eta) = \\eta\\sigma^2/(h(2-\\eta h))"}</M>. If the rate drops to η′ at a moment when{" "}
          <M>{"E[x^2] = m^*(\\eta)"}</M>, then t steps later
        </p>
        <MD>{"E[x_t^2] = m^*(\\eta') + (1-\\eta'h)^{2t}\\big(m^*(\\eta) - m^*(\\eta')\\big)."}</MD>
        <p>
          The excess falls below a fraction q of its start after{" "}
          <M>{"\\lceil\\ln q/(2\\ln|1-\\eta'h|)\\rceil \\approx \\ln(1/q)/(2\\eta'h)"}</M> steps.
        </p>
      </Theorem>
      <Proof>
        <p>
          The recursion <M>{"m \\leftarrow (1-\\eta'h)^2m + \\eta'^2\\sigma^2"}</M> has fixed point <M>{"m^*(\\eta')"}</M>, and
          subtracting the fixed point from both sides gives{" "}
          <M>{"m - m^*(\\eta') \\leftarrow (1-\\eta'h)^2(m - m^*(\\eta'))"}</M>, a geometric decay. Taking logarithms gives
          the step count, and <M>{"\\ln(1-\\eta'h) \\approx -\\eta'h"}</M> for small <M>{"\\eta'h"}</M>. So stiff
          coordinates anneal in a handful of steps and flat ones slowly; since every coordinate&apos;s share of the loss
          floor is about <M>{"\\eta\\sigma^2/4"}</M> whatever its curvature, the decay must last long enough for the
          flattest noisy directions, which is why decays of 10 to 20 per cent of the run are typical.
        </p>
        <Code>{DROP}</Code>
      </Proof>

      <Theorem title="area and cost">
        <p>
          With no warmup and linear decay over a fraction f of the run, WSD spends area about{" "}
          <M>{"\\eta T(1 - f/2)"}</M>, against <M>{"\\eta T/2"}</M> for a cosine schedule with the same peak. Finished models at
          lengths <M>{"T_1 < \\dots < T_k"}</M> cost <M>{"T_k + f\\sum_{i<k}T_i"}</M> steps with WSD branches and{" "}
          <M>{"\\sum_iT_i"}</M> with separate cosine runs.
        </p>
      </Theorem>
      <Proof>
        <p>
          The stable phase contributes <M>{"\\eta(1-f)T"}</M> and the linear decay a triangle of area{" "}
          <M>{"\\eta fT/2"}</M>; the cosine area was computed in the previous lesson. For the cost, the longest model is the
          main run itself, and each shorter one reuses the main run up to its branch point and pays only its own decay of{" "}
          <M>{"fT_i"}</M> steps. For lengths 1, 2, 4 and 8 with f = 0.1 that is 8 + 0.7 = 8.7 against 15.
        </p>
        <Code>{WSD}</Code>
      </Proof>

      <Remark title="when it wins and when it does not">
        <p>
          WSD travels about twice as far as cosine for the same peak rate, which helps when the remaining loss is mostly
          distance along flat directions, the &quot;river&quot; of a long valley. Cosine anneals for longer, which helps
          when the noise floor dominates. In the figure the balance shifts with the noise level. Measured on language
          models, WSD with a decay of about a fifth of the run matches cosine and sometimes beats it, and its real gift is
          flexibility: one run, any length, and the option to keep training a model that has already been released.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: <p>Finished models are needed at 1000, 2000 and 4000 steps. With WSD branches decaying over 10% of each length, how many steps of training does that take in total?</p>,
      answer: { kind: "numeric", value: 4300, tolerance: 0.5 },
    },
    {
      key: "area",
      rung: "check",
      prompt: <p>A 1000-step WSD schedule with η = 1, no warmup and a linear decay over the last 20% has roughly what total area Σηₜ?</p>,
      answer: { kind: "numeric", value: 900, tolerance: 1 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What is the main practical advantage of WSD over cosine decay?</p>,
      answer: {
        kind: "choice",
        options: [
          "The stable phase does not depend on the final length, so one run can be branched into finished models of many lengths and extended later",
          "It always reaches a lower final loss than cosine for the same length",
          "It needs no warmup",
          "It removes gradient noise during the stable phase",
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

def wsd(t, T, lr, warm, decay):
    if t < warm:
        return lr * (t + 1) / warm
    start = T - decay
    if t < start:
        return lr
    return lr * max(0.0, (T - t) / decay)

def expected_losses(h, x0sq, sigma2, lrs):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    out = []
    for lr in lrs:
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2
        out.append(0.5 * float(np.sum(h * m)))
    return out

def area(lrs):
    return float(np.sum(lrs))

print([round(wsd(t, 10, 1.0, 2, 4), 2) for t in range(10)], area([wsd(t, 10, 1.0, 2, 4) for t in range(10)]))
print([round(v, 4) for v in expected_losses([1.0], [1.0], 0.0, [0.5, 0.5, 0.0])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.75, 0.5, 0.25] 8.0\n[0.125, 0.0312, 0.0312]",
          "[0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 0.75, 0.5, 0.25, 0.0] 7.0\n[0.125, 0.0312, 0.0312]",
          "[0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.75, 0.5, 0.25] 8.0\n[0.125, 0.0312, 0.0]",
          "[0.0, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 0.75, 0.5, 0.25] 7.5\n[0.125, 0.0312, 0.0312]",
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

def floor_m(h, sigma2, lr):
    return lr * sigma2 / (h * (2 - lr * h))

def after_drop(h, sigma2, lr_old, lr_new, t):
    old, new = floor_m(h, sigma2, lr_old), floor_m(h, sigma2, lr_new)
    return new + (1 - lr_new * h) ** (2 * t) * (old - new)

def anneal_steps(h, lr_new, frac):
    return int(np.ceil(np.log(frac) / (2 * np.log(abs(1 - lr_new * h)))))

print(floor_m(1.0, 0.3, 1.0), round(after_drop(1.0, 0.3, 1.0, 0.5, 1), 4), round(after_drop(1.0, 0.3, 1.0, 0.5, 50), 4))
print(anneal_steps(0.01, 0.5, 0.01), anneal_steps(1.0, 0.5, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.3 0.15 0.1\n460 4", "0.3 0.2 0.1\n460 4", "0.3 0.15 0.1\n4 460", "0.15 0.15 0.1\n460 4"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wsd(t, T, lr, warm, decay)</C>: <C>lr·(t+1)/warm</C> for t &lt; warm, then lr until <C>T − decay</C>,
          then <C>lr·(T − t)/decay</C>, never below 0; <C>expected_losses(h, x0sq, sigma2, lrs)</C>, the expected loss of
          noisy SGD after each step; and <C>area(lrs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def wsd(t, T, lr, warm, decay):
    return lr

def expected_losses(h, x0sq, sigma2, lrs):
    return []

def area(lrs):
    return 0.0
`,
        solution: WSD,
        tests: [
          { name: "schedule", code: `assert np.allclose([wsd(t, 8, 2.0, 0, 4) for t in range(8)], [2, 2, 2, 2, 2, 1.5, 1, 0.5]) and wsd(20, 8, 2.0, 0, 4) == 0
assert np.allclose([wsd(t, 10, 1.0, 2, 4) for t in range(10)], [0.5, 1, 1, 1, 1, 1, 1, 0.75, 0.5, 0.25]) and abs(area([wsd(t, 1000, 1.0, 0, 200) for t in range(1000)]) - 900.5) < 1e-9` },
          { name: "loss", code: `assert np.allclose(expected_losses([1.0, 0.1], [1.0, 4.0], 0.5, [0.3, 0.6]), [0.45793, 0.310063948])
assert np.allclose(expected_losses([1.0], [1.0], 0.0, [0.5, 0.5, 0.0]), [0.125, 0.03125, 0.03125])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>floor_m(h, sigma2, lr)</C>, the stationary E[x²] for a constant rate; <C>after_drop(h, sigma2, lr_old,
          lr_new, t)</C>, E[x²] t steps after a drop from the old floor; and <C>anneal_steps(h, lr_new, frac)</C>, the
          rounded-up number of steps for the excess to fall to frac of its start.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def floor_m(h, sigma2, lr):
    return lr * sigma2

def after_drop(h, sigma2, lr_old, lr_new, t):
    return floor_m(h, sigma2, lr_new)

def anneal_steps(h, lr_new, frac):
    return 0
`,
        solution: DROP,
        tests: [
          { name: "drop", code: `assert abs(floor_m(1.0, 0.3, 1.0) - 0.3) < 1e-12 and abs(after_drop(1.0, 0.3, 1.0, 0.5, 1) - 0.15) < 1e-12
m = floor_m(0.2, 0.3, 1.0)
for _ in range(7):
    m = (1 - 0.5 * 0.2) ** 2 * m + 0.25 * 0.3
assert abs(after_drop(0.2, 0.3, 1.0, 0.5, 7) - m) < 1e-12` },
          { name: "steps", code: `assert anneal_steps(0.01, 0.5, 0.01) == 460 and anneal_steps(1.0, 0.5, 0.01) == 4 and anneal_steps(0.001, 0.1, 0.01) == 23025` },
        ],
      },
    },
    {
      key: "flat",
      rung: "stretch",
      prompt: (
        <p>
          After a drop to η′ = 0.1, how many steps does a coordinate with curvature h = 0.001 need for its excess variance to
          fall to 1% of its start? Use ⌈ln 0.01 / (2 ln(1 − η′h))⌉.
        </p>
      ),
      answer: { kind: "numeric", value: 23025, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        WSD still needs someone to decide when to decay. Schedule-free methods go further and remove the schedule
        altogether, replacing the decay with an average of the iterates that is computed as training runs.
      </p>
    </>
  ),
};
