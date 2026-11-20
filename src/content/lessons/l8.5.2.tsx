import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StepTokenViz } from "@/components/viz/StepTokenViz";
import type { LessonContent } from "@/lib/types";

const TRADEOFF = `import math

def critical_batch(S_min, E_min):
    return E_min / S_min

def steps_needed(B, S_min, E_min):
    return S_min * (1 + critical_batch(S_min, E_min) / B)

def tokens_needed(B, S_min, E_min):
    return E_min * (1 + B / critical_batch(S_min, E_min))`;

const FITS = `import math

def deepseek_batch(C):
    return 0.292 * C ** 0.3271

def deepseek_lr(C):
    return 0.3118 * C ** (-0.125)

def sqrt_lr_scale(lr0, B0, B):
    return lr0 * math.sqrt(B / B0)`;

export const lesson: LessonContent = {
  id: "l8.5.2",
  minutes: 50,
  links: {
    requires: ["l8.5.1", "m14.1.3", "m14.1.4"],
    revisits: ["m14.1.2", "l8.4.1"],
    foreshadows: ["l8.5.3", "e10.2.1"],
  },

  puzzle: (
    <>
      <p>
        A cluster of ten thousand accelerators wants a huge batch, so that every device has work and each step finishes fast.
        The optimiser wants a batch no larger than the noise in its gradients justifies, or extra examples are wasted. Large runs
        settle on batches of several million tokens and change them during training, with a learning rate chosen to match.
        How are these two numbers chosen for a run that cannot be repeated?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A batch averages gradients to reduce noise. While the noise is large compared with the true gradient, doubling the
        batch nearly halves the number of steps needed; once the noise is small, a bigger batch only repeats what the step
        already knew. The crossover is the critical batch size. It is not fixed: as the loss falls, the useful signal in each
        gradient shrinks relative to the noise, and the critical batch size rises. So batches start smaller and grow, and the
        learning rate is set together with them.
      </p>
      <StepTokenViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the step–token trade-off">
        <p>
          McCandlish and colleagues found that the steps S and tokens E needed to reach a given loss satisfy
        </p>
        <MD>{"\\left(\\frac{S}{S_{\\min}} - 1\\right)\\left(\\frac{E}{E_{\\min}} - 1\\right) = 1"}</MD>
        <p>
          with critical batch size <M>{"B_{\\mathrm{crit}} = E_{\\min}/S_{\\min}"}</M> (<C>critical_batch</C>). At batch B,{" "}
          <M>{"S = S_{\\min}(1 + B_{\\mathrm{crit}}/B)"}</M> and <M>{"E = E_{\\min}(1 + B/B_{\\mathrm{crit}})"}</M> (<C>steps_needed</C>, <C>tokens_needed</C>).
          Their noise analysis predicts <M>{"B_{\\mathrm{crit}} \\approx \\mathrm{tr}(\\Sigma)/\\|G\\|^2"}</M>, the ratio of gradient noise to squared
          signal, as in m14.1.3.
        </p>
        <Code>{TRADEOFF}</Code>
      </Definition>

      <Theorem title="the trade-off curve">
        <p>
          The two formulas satisfy the hyperbola for every B, and at <M>{"B = B_{\\mathrm{crit}}"}</M> both steps and tokens are exactly twice
          their minima.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"S/S_{\\min} - 1 = B_{\\mathrm{crit}}/B"}</M> and <M>{"E/E_{\\min} - 1 = B/B_{\\mathrm{crit}}"}</M>, whose product is 1. At <M>{"B = B_{\\mathrm{crit}}"}</M> each
          ratio is 1 + 1 = 2.
        </p>
      </Proof>

      <Definition title="fitting batch size and learning rate to compute">
        <p>
          Rather than derive them, recent reports fit both to small runs as power laws in compute, exactly as for the loss in
          l8.4.1. DeepSeek LLM swept batch size and learning rate on small models over a range of budgets and found near-optimal
          settings along <M>{"B_{\\mathrm{opt}} = 0.292\\,C^{0.3271}"}</M> tokens and <M>{"\\eta_{\\mathrm{opt}} = 0.3118\\,C^{-0.125}"}</M> (<C>deepseek_batch</C>,{" "}
          <C>deepseek_lr</C>): batch grows and learning rate shrinks with compute. Within a range of batch sizes, Adam&apos;s best
          learning rate grows roughly with the square root of the batch (<C>sqrt_lr_scale</C>), the rule derived from its stochastic
          differential equation approximation; beyond the critical batch size it stops growing.
        </p>
        <Code>{FITS}</Code>
      </Definition>

      <Remark title="why the near-optimal region is wide">
        <p>
          The DeepSeek sweeps found a broad basin: many combinations of batch size and learning rate gave loss within a fraction
          of a percent of the best. This is good news for transfer, since a fit that is slightly off still lands in the basin, and
          it is consistent with the trade-off curve being flat near its knee. It also means small differences in loss between
          configurations need the seed-aware comparisons of l8.2.4 before they are believed.
        </p>
      </Remark>

      <Example title="batch ramps in practice">
        <p>
          GPT-3 ramped its batch from 32 thousand to 3.2 million tokens over the first few billion tokens of training. DeepSeek-V3
          ramped from 3,072 to 15,360 sequences over the first 469 billion tokens. Kaplan and colleagues fitted the critical batch
          size as a power of the loss, <M>{"B_{\\mathrm{crit}} \\approx B_*/L^{1/\\alpha_B}"}</M> with <M>{"\\alpha_B \\approx 0.21"}</M>, so that each halving
          of the loss raises it about 27-fold; later work found it tracks the amount of data seen more than the model size.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "steps",
      rung: "check",
      prompt: <p>A run uses a batch three times the critical batch size. How many times the minimum number of steps does it need? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.3333, tolerance: 0.0002 },
    },
    {
      key: "dsbatch",
      rung: "check",
      prompt: <p>By DeepSeek&apos;s fit, what is the near-optimal batch size for a 10²¹-FLOP run, in millions of tokens? Give two decimals.</p>,
      answer: { kind: "numeric", value: 2.16, tolerance: 0.01 },
    },
    {
      key: "ramp",
      rung: "apply",
      prompt: <p>Why do large runs increase the batch size during training rather than use the final batch size from the start?</p>,
      answer: {
        kind: "choice",
        options: [
          "Early in training the critical batch size is small, so a large batch would waste tokens; it grows as the loss falls, so the batch can grow with it",
          "A large batch at the start causes the loss to increase permanently",
          "Memory is only available after the first few billion tokens",
          "The learning rate cannot be warmed up with a large batch",
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

def critical_batch(S_min, E_min):
    return E_min / S_min

def steps_needed(B, S_min, E_min):
    return S_min * (1 + critical_batch(S_min, E_min) / B)

def tokens_needed(B, S_min, E_min):
    return E_min * (1 + B / critical_batch(S_min, E_min))

print(critical_batch(100, 5000), steps_needed(50, 100, 5000), tokens_needed(50, 100, 5000))
print(steps_needed(1e9, 100, 5000) > 100, round(tokens_needed(1.0, 100, 5000) / 5000, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "50.0 200.0 10000.0\nTrue 1.02",
          "50.0 150.0 10000.0\nTrue 1.02",
          "0.02 200.0 10000.0\nTrue 1.02",
          "50.0 200.0 5050.0\nFalse 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def deepseek_batch(C):
    return 0.292 * C ** 0.3271

def deepseek_lr(C):
    return 0.3118 * C ** (-0.125)

def sqrt_lr_scale(lr0, B0, B):
    return lr0 * math.sqrt(B / B0)

print(round(deepseek_batch(1.0), 3), round(deepseek_lr(1e8), 6), sqrt_lr_scale(0.001, 256, 1024))
print(round(deepseek_batch(1e20) / deepseek_batch(1e19), 4), round(deepseek_lr(1e20) / deepseek_lr(1e19), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.292 0.03118 0.002\n2.1237 0.7499",
          "0.292 0.03118 0.004\n2.1237 0.7499",
          "0.292 0.3118 0.002\n2.1237 0.7499",
          "0.292 0.03118 0.002\n0.3271 -0.125",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>critical_batch(S_min, E_min)</C>, <C>steps_needed(B, S_min, E_min)</C> and <C>tokens_needed(B, S_min, E_min)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def critical_batch(S_min, E_min):
    return S_min / E_min

def steps_needed(B, S_min, E_min):
    return S_min

def tokens_needed(B, S_min, E_min):
    return E_min
`,
        solution: TRADEOFF,
        tests: [
          { name: "crit", code: `assert critical_batch(1000, 4e9) == 4e6 and abs(steps_needed(2e6, 1000, 4e9) - 3000) < 1e-9 and abs(tokens_needed(8e6, 1000, 4e9) - 1.2e10) < 1e-3` },
          { name: "curve", code: `for B in [1e5, 1e6, 3e7]:\n    s, e = steps_needed(B, 500, 1e9) / 500, tokens_needed(B, 500, 1e9) / 1e9\n    assert abs((s - 1) * (e - 1) - 1) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>deepseek_batch(C)</C>, <C>deepseek_lr(C)</C> and <C>sqrt_lr_scale(lr0, B0, B)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def deepseek_batch(C):
    return 0.292 * C

def deepseek_lr(C):
    return 0.3118

def sqrt_lr_scale(lr0, B0, B):
    return lr0 * B / B0
`,
        solution: FITS,
        tests: [
          { name: "fits", code: `assert abs(deepseek_batch(1e18) - 0.292 * 1e18 ** 0.3271) < 1e-6 and abs(deepseek_lr(1e16) - 0.3118 * 1e-2) < 1e-15` },
          { name: "sqrt", code: `assert abs(sqrt_lr_scale(3e-4, 512, 4608) - 9e-4) < 1e-15` },
        ],
      },
    },
    {
      key: "wall",
      rung: "stretch",
      prompt: (
        <p>
          A run has <M>{"S_{\\min} = 10^4"}</M> steps and <M>{"E_{\\min} = 4 \\times 10^{10}"}</M> tokens. Each step takes 0.5 s of fixed overhead plus
          10⁻⁶ s per token in the batch. Which batch size, in millions of tokens, minimises the total time{" "}
          <M>{"S(B)(0.5 + 10^{-6}B)"}</M>? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.41, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Batch and peak learning rate are set. The next lesson asks how the learning rate should move over the run, and why the
        warmup-stable-decay schedule has replaced cosine decay in many recent models.
      </p>
    </>
  ),
};
