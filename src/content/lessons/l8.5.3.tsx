import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WsdViz } from "@/components/viz/WsdViz";
import type { LessonContent } from "@/lib/types";

const SCHEDULES = `import math

def wsd_lr(step, total, peak, warmup, decay_frac, shape="linear"):
    if step < warmup:
        return peak * (step + 1) / warmup
    start = total - int(decay_frac * total)
    if step < start:
        return peak
    x = (step - start) / (total - start)
    if shape == "linear":
        return peak * (1 - x)
    if shape == "sqrt":
        return peak * (1 - math.sqrt(x))
    return peak * 0.5 * (1 + math.cos(math.pi * x))

def cosine_lr(step, total, peak, warmup, final_frac=0.1):
    if step < warmup:
        return peak * (step + 1) / warmup
    x = (step - warmup) / (total - warmup)
    return peak * (final_frac + (1 - final_frac) * 0.5 * (1 + math.cos(math.pi * x)))

def schedule(fn, total, *args):
    return [fn(s, total, *args) for s in range(total)]`;

const ANNEAL = `def forward_area(lrs):
    return sum(lrs)

def annealing_area(lrs, decay=0.999):
    start = lrs.index(max(lrs))
    m, total = 0.0, 0.0
    for i in range(start + 1, len(lrs)):
        m = decay * m + (lrs[i - 1] - lrs[i])
        total += m
    return total

def anneal_loss(lrs, L0, A, alpha, C, decay=0.999):
    return L0 + A * forward_area(lrs) ** (-alpha) - C * annealing_area(lrs, decay)`;

export const lesson: LessonContent = {
  id: "l8.5.3",
  minutes: 50,
  links: {
    requires: ["l8.5.2", "m14.4.3"],
    revisits: ["l8.4.3", "l8.4.1"],
    foreshadows: ["l8.7.1", "l8.6.1"],
  },

  puzzle: (
    <>
      <p>
        A cosine schedule is fixed by its length: the learning rate at step 5,000 of a 10,000-step run differs from step 5,000 of
        a 20,000-step run. So a scaling study that wants models at five budgets must train five runs from scratch, and a
        production run cannot be extended once it has decayed. Is there a schedule that does as well as cosine without
        committing to the length in advance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Warmup-stable-decay (WSD) splits the run in three. A short warmup, a long stable phase at the peak rate, and a short
        final decay. During the stable phase the loss falls slowly and looks worse than cosine; in the decay it drops sharply and
        ends level with or below cosine. One picture for why: the loss surface is like a river valley, steep across and gently
        sloping along. A high rate makes fast progress along the river but bounces between its banks; lowering the rate lets
        the iterate settle onto the river bed, which removes the bouncing all at once.
      </p>
      <WsdViz />
    </>
  ),

  theory: (
    <>
      <Definition title="warmup-stable-decay">
        <p>
          With peak <M>{"\\eta"}</M>, warmup W steps, total T and decay fraction f, the decay starts at <M>{"t_d = T - \\lfloor fT \\rfloor"}</M>. The rate rises
          linearly to <M>{"\\eta"}</M>, stays there until <M>{"t_d"}</M>, then follows <M>{"\\eta\\,g(x)"}</M> with <M>{"x = (t - t_d)/(T - t_d)"}</M> and{" "}
          <M>{"g(x) = 1 - x"}</M>, <M>{"1 - \\sqrt{x}"}</M> or <M>{"\\tfrac12(1 + \\cos \\pi x)"}</M> (<C>wsd_lr</C>). The cosine schedule for comparison
          decays from the end of warmup to a floor of a fraction of the peak, commonly 10% (<C>cosine_lr</C>).
        </p>
        <Code>{SCHEDULES}</Code>
      </Definition>

      <Remark title="where it came from">
        <p>
          MiniCPM introduced the name in 2024 and used it to study data and model scaling from a single run, branching decays off
          stored checkpoints. Hägele and colleagues then compared it carefully with cosine: a cooldown of about 20% of training
          with the <M>{"1 - \\sqrt{x}"}</M> shape matched or beat a cosine schedule tuned for that length, and the stable phase could be
          shared across budgets. DeepSeek-V3 and several other open models use WSD or a close variant.
        </p>
      </Remark>

      <Definition title="an annealing scaling law">
        <p>
          Tissue and colleagues fitted the loss along any schedule with two areas. The forward area <M>{"S_1 = \\sum_t \\eta_t"}</M> measures
          how far the run has travelled (<C>forward_area</C>). The annealing area <M>{"S_2 = \\sum_t m_t"}</M>, with momentum{" "}
          <M>{"m_t = \\lambda m_{t-1} + (\\eta_{t-1} - \\eta_t)"}</M> started at the peak, measures how much the rate has been lowered, with a lag
          (<C>annealing_area</C>). The loss is
        </p>
        <MD>{"L = L_0 + A\\,S_1^{-\\alpha} - C\\,S_2"}</MD>
        <p>
          (<C>anneal_loss</C>), with <M>{"\\lambda"}</M> near 0.999. The two terms pull against each other: decaying early raises <M>{"S_2"}</M> but
          shrinks <M>{"S_1"}</M>. The visualisation above uses this law with <M>{"L_0 = 2"}</M>, <M>{"A = 8"}</M>, <M>{"\\alpha = 0.4"}</M> and{" "}
          <M>{"C = 5 \\times 10^{-5}"}</M>.
        </p>
        <Code>{ANNEAL}</Code>
      </Definition>

      <Theorem title="the forward area of a linear-decay WSD schedule">
        <p>
          Ignoring the one-step offsets, a WSD schedule with peak <M>{"\\eta"}</M>, warmup W and linear decay over the final fT steps has
          forward area <M>{"\\eta\\,(T - W/2 - fT/2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The rate is a trapezoid: a triangle of base W and height <M>{"\\eta"}</M>, a rectangle of width <M>{"T - W - fT"}</M>, and a triangle of
          base fT. The areas are <M>{"\\eta W/2"}</M>, <M>{"\\eta(T - W - fT)"}</M> and <M>{"\\eta fT/2"}</M>, which sum to the claim.
        </p>
      </Proof>

      <Example title="why the stable phase looks worse">
        <p>
          In the law, a constant rate keeps <M>{"S_2 = 0"}</M> and only grows <M>{"S_1"}</M>; cosine lowers the rate throughout and earns{" "}
          <M>{"S_2"}</M> gradually. So midway through, cosine is ahead. In the decay WSD gains a large <M>{"S_2"}</M> quickly while having kept a
          larger <M>{"S_1"}</M>, and at the end it is ahead. A loss curve in the stable phase therefore understates the final model,
          which matters when reading curves (l8.6.1) and when a decay is combined with a switch to high-quality data (l8.7.1).
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "sqrtlr",
      rung: "check",
      prompt: (
        <p>
          A 10,000-step WSD run has peak 3 × 10⁻⁴, warmup 500 and a 1 − √x decay over the final 20%. What is the learning rate at
          step 9,500, in units of 10⁻⁵? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.02, tolerance: 0.01 },
    },
    {
      key: "area",
      rung: "check",
      prompt: (
        <p>
          A 10,000-step WSD run with warmup 500 and linear decay over the final 20% is compared with a run held at its peak rate
          for all 10,000 steps. Ignoring one-step offsets, what fraction of the constant run&apos;s forward area does it have? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.875, tolerance: 0.001 },
    },
    {
      key: "branch",
      rung: "apply",
      prompt: <p>Why can one WSD run provide finished models for several compute budgets while a cosine run cannot?</p>,
      answer: {
        kind: "choice",
        options: [
          "The stable phase does not depend on the total length, so a decay can start from any stored checkpoint; a cosine schedule's rate at every step depends on the final length",
          "WSD uses a smaller peak learning rate, so its checkpoints are already converged",
          "Cosine schedules cannot be checkpointed",
          "WSD skips warmup, so every checkpoint starts from the same state",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def wsd_lr(step, total, peak, warmup, decay_frac, shape="linear"):
    if step < warmup:
        return peak * (step + 1) / warmup
    start = total - int(decay_frac * total)
    if step < start:
        return peak
    x = (step - start) / (total - start)
    if shape == "linear":
        return peak * (1 - x)
    if shape == "sqrt":
        return peak * (1 - math.sqrt(x))
    return peak * 0.5 * (1 + math.cos(math.pi * x))

def cosine_lr(step, total, peak, warmup, final_frac=0.1):
    if step < warmup:
        return peak * (step + 1) / warmup
    x = (step - warmup) / (total - warmup)
    return peak * (final_frac + (1 - final_frac) * 0.5 * (1 + math.cos(math.pi * x)))

def schedule(fn, total, *args):
    return [fn(s, total, *args) for s in range(total)]

print(wsd_lr(0, 100, 1.0, 10, 0.2), wsd_lr(50, 100, 1.0, 10, 0.2), wsd_lr(90, 100, 1.0, 10, 0.2), round(wsd_lr(95, 100, 1.0, 10, 0.2, "sqrt"), 4))
print(round(cosine_lr(10, 110, 1.0, 10), 4), round(cosine_lr(60, 110, 1.0, 10), 4), len(schedule(cosine_lr, 7, 1.0, 1)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1 1.0 0.5 0.134\n1.0 0.55 7",
          "0.1 1.0 0.5 0.293\n1.0 0.55 7",
          "0.0 1.0 0.5 0.134\n1.0 0.5 7",
          "0.1 1.0 0.0 0.134\n0.55 1.0 6",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def forward_area(lrs):
    return sum(lrs)

def annealing_area(lrs, decay=0.999):
    start = lrs.index(max(lrs))
    m, total = 0.0, 0.0
    for i in range(start + 1, len(lrs)):
        m = decay * m + (lrs[i - 1] - lrs[i])
        total += m
    return total

def anneal_loss(lrs, L0, A, alpha, C, decay=0.999):
    return L0 + A * forward_area(lrs) ** (-alpha) - C * annealing_area(lrs, decay)

print(forward_area([1.0, 1.0, 0.5]), annealing_area([1.0, 1.0, 0.5, 0.5], 0.5), annealing_area([0.5, 2.0, 2.0]))
print(anneal_loss([1.0, 1.0, 1.0, 1.0], 2.0, 4.0, 0.5, 1.0), anneal_loss([1.0, 0.0], 1.0, 1.0, 1.0, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.5 0.75 0.0\n4.0 1.5",
          "2.5 1.0 0.0\n4.0 1.5",
          "2.5 0.75 1.5\n4.0 1.5",
          "2.5 0.75 0.0\n2.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wsd_lr(step, total, peak, warmup, decay_frac, shape=&quot;linear&quot;)</C>,{" "}
          <C>cosine_lr(step, total, peak, warmup, final_frac=0.1)</C> and <C>schedule(fn, total, *args)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def wsd_lr(step, total, peak, warmup, decay_frac, shape="linear"):
    return peak

def cosine_lr(step, total, peak, warmup, final_frac=0.1):
    return peak

def schedule(fn, total, *args):
    return []
`,
        solution: SCHEDULES,
        tests: [
          { name: "wsd", code: `assert abs(wsd_lr(4, 200, 2.0, 10, 0.25) - 1.0) < 1e-12 and wsd_lr(100, 200, 2.0, 10, 0.25) == 2.0\nassert abs(wsd_lr(175, 200, 2.0, 10, 0.25) - 1.0) < 1e-12 and abs(wsd_lr(166, 200, 2.0, 10, 0.25, "sqrt") - 2 * (1 - math.sqrt(16 / 50))) < 1e-12\nassert abs(wsd_lr(175, 200, 2.0, 10, 0.25, "cosine") - 1.0) < 1e-12` },
          { name: "cos", code: `lrs = schedule(cosine_lr, 210, 1.0, 10, 0.2)\nassert len(lrs) == 210 and abs(lrs[0] - 0.1) < 1e-12 and abs(lrs[10] - 1.0) < 1e-12 and abs(lrs[110] - 0.6) < 1e-12 and abs(cosine_lr(210, 210, 1.0, 10, 0.2) - 0.2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>forward_area(lrs)</C>, <C>annealing_area(lrs, decay=0.999)</C> and <C>anneal_loss(lrs, L0, A, alpha, C, decay=0.999)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def forward_area(lrs):
    return len(lrs)

def annealing_area(lrs, decay=0.999):
    return 0.0

def anneal_loss(lrs, L0, A, alpha, C, decay=0.999):
    return L0
`,
        solution: ANNEAL,
        tests: [
          { name: "areas", code: `assert abs(forward_area([0.5, 2.0, 1.0]) - 3.5) < 1e-12\nassert abs(annealing_area([0.5, 2.0, 1.5, 1.0, 1.0], 0.5) - (0.5 + 0.75 + 0.375)) < 1e-12 and annealing_area([1.0, 1.0, 1.0]) == 0.0` },
          { name: "loss", code: `assert abs(anneal_loss([2.0, 2.0], 1.0, 8.0, 1.5, 0.1) - 2.0) < 1e-12\nassert abs(anneal_loss([2.0, 1.0, 1.0], 1.0, 4.0, 1.0, 1.0, 0.0) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          Two runs share the same peak rate and length and have no warmup. One is WSD with linear decay over the final 20%; the
          other is cosine decaying all the way to zero. Ignoring one-step offsets, what is the ratio of the WSD run&apos;s forward area
          to the cosine run&apos;s? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 1.8, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the schedule set, the run can begin. The next module is about watching it: what a healthy loss curve looks like,
        what spikes and divergences mean, and how to tell a real jump in capability from an artefact of the metric.
      </p>
    </>
  ),
};
