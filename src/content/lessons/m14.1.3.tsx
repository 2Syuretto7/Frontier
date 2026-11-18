import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CriticalBatchViz } from "@/components/viz/CriticalBatchViz";
import type { LessonContent } from "@/lib/types";

const FIT = `def steps_examples(B, s_min, e_min):
    S = s_min * (1 + (e_min / s_min) / B)
    return S, S * B

def fit_tradeoff(B1, S1, B2, S2):
    e_min = (S1 - S2) / (1 / B1 - 1 / B2)
    return S1 - e_min / B1, e_min

def largest_batch(s_min, e_min, max_examples):
    if max_examples <= e_min:
        return None
    B = (max_examples - e_min) / s_min
    return B, steps_examples(B, s_min, e_min)[0]`;

const SIM = `import numpy as np

def expected_loss(h, x0sq, sigma2, B, lr, steps):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    out = []
    for _ in range(steps):
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2 / B
        out.append(0.5 * float(np.sum(h * m)))
    return out

def steps_to_target(h, x0sq, sigma2, B, lr, target, max_steps=10000):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    for k in range(1, max_steps + 1):
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2 / B
        if 0.5 * float(np.sum(h * m)) <= target:
            return k
    return None

def tuned_steps(h, x0sq, sigma2, B, lrs, target, max_steps=10000):
    found = [s for s in (steps_to_target(h, x0sq, sigma2, B, lr, target, max_steps) for lr in lrs) if s is not None]
    return min(found) if found else None`;

export const lesson: LessonContent = {
  id: "m14.1.3",
  minutes: 45,
  links: {
    requires: ["m14.1.2"],
    revisits: ["l3.6.4"],
    foreshadows: ["m14.1.4"],
  },

  puzzle: (
    <>
      <p>
        A team has a fixed model and dataset and must choose a batch size. With 256 they reach the target loss in 40,000
        steps; with 4096 in 4,000 steps, ten times faster on enough hardware but using 1.6 times as many examples. Would 16,384
        be faster still, and at what price? Two measurements turn out to be enough to predict the whole answer.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        From the last lesson, a step with batch B makes a fraction <M>{"1/(1 + B_{\\text{noise}}/B)"}</M> of the progress of
        a noiseless step. If that holds throughout training, the number of steps needed is the noiseless minimum inflated by
        that factor, and the number of examples is the steps times B. Both depend on B through one simple law, so every
        batch size lands on the same curve, a hyperbola in steps and examples. Its knee is the critical batch size: below it
        you trade steps for nothing; above it every halving of time costs a doubling of compute.
      </p>
      <CriticalBatchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the steps–examples trade-off">
        <p>
          For a fixed target loss, let S(B) be the number of steps and <M>{"E(B) = B\\,S(B)"}</M> the number of examples
          needed with batch B and a well-tuned learning rate. Let <M>{"S_{\\min}"}</M> and <M>{"E_{\\min}"}</M> be their
          limits as B → ∞ and B → 0, and define the critical batch size{" "}
          <M>{"B_{\\text{crit}} = E_{\\min}/S_{\\min}"}</M>.
        </p>
      </Definition>

      <Theorem title="the hyperbola">
        <p>
          If every step achieves the decrease <M>{"\\Delta L_{\\max}/(1 + B_{\\text{noise}}/B)"}</M> with a constant noise
          scale, then
        </p>
        <MD>{"S = S_{\\min}\\Big(1 + \\frac{B_{\\text{noise}}}{B}\\Big),\\quad E = E_{\\min}\\Big(1 + \\frac{B}{B_{\\text{noise}}}\\Big),\\quad \\Big(\\frac{S}{S_{\\min}} - 1\\Big)\\Big(\\frac{E}{E_{\\min}} - 1\\Big) = 1,"}</MD>
        <p>
          and <M>{"B_{\\text{crit}} = B_{\\text{noise}}"}</M>. At <M>{"B = B_{\\text{crit}}"}</M> both S and E are twice their
          minima.
        </p>
      </Theorem>
      <Proof>
        <p>
          A total decrease D takes <M>{"S = D(1 + B_{\\text{noise}}/B)/\\Delta L_{\\max}"}</M> steps; as B → ∞ this tends to{" "}
          <M>{"S_{\\min} = D/\\Delta L_{\\max}"}</M>. Then <M>{"E = BS = S_{\\min}(B + B_{\\text{noise}})"}</M>, which tends to{" "}
          <M>{"E_{\\min} = S_{\\min}B_{\\text{noise}}"}</M> as B → 0, so <M>{"E = E_{\\min}(1 + B/B_{\\text{noise}})"}</M> and{" "}
          <M>{"E_{\\min}/S_{\\min} = B_{\\text{noise}}"}</M>. Multiplying{" "}
          <M>{"S/S_{\\min} - 1 = B_{\\text{noise}}/B"}</M> by <M>{"E/E_{\\min} - 1 = B/B_{\\text{noise}}"}</M> gives 1. Since{" "}
          <M>{"S = S_{\\min} + E_{\\min}/B"}</M> is linear in 1/B, two runs at different batch sizes determine both constants,
          and with them every other point.
        </p>
        <Code>{FIT}</Code>
      </Proof>

      <Remark title="measuring it in practice">
        <p>
          The assumption of a constant noise scale is false over a whole run, since <M>{"B_{\\text{noise}}"}</M> grows as the
          loss falls, but the hyperbola still fits measured runs well, with a critical batch size that grows as the target
          loss gets lower. The simulation below finds steps-to-target on a noisy quadratic, tuning the learning rate for each
          batch; only <M>{"\\sigma^2/B"}</M> enters its dynamics, so multiplying the noise by four multiplies{" "}
          <M>{"B_{\\text{crit}}"}</M> by four. Large-scale training runs sit near or a little above the critical batch, where
          time is cheap and compute only modestly wasted.
        </p>
        <Code>{SIM}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fit",
      rung: "check",
      prompt: <p>Runs need 40,000 steps at B = 256 and 4,000 steps at B = 4096. Fitting S = S_min + E_min/B, what is B_crit? Round to a whole number.</p>,
      answer: { kind: "numeric", value: 6144, tolerance: 0.6 },
    },
    {
      key: "twice",
      rung: "check",
      prompt: <p>At B = 4 B_crit, how many times S_min steps does the run take?</p>,
      answer: { kind: "numeric", value: 1.25, tolerance: 0.0001 },
    },
    {
      key: "beyond",
      rung: "apply",
      prompt: <p>A run already uses 8 times its critical batch size. What does doubling the batch again buy?</p>,
      answer: {
        kind: "choice",
        options: [
          "Steps fall only from 1.125 to 1.0625 times the minimum, about 6% less time, while examples nearly double",
          "Steps halve, as they would below the critical batch",
          "Nothing at all: steps stay exactly the same",
          "The run needs fewer examples",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def steps_examples(B, s_min, e_min):
    S = s_min * (1 + (e_min / s_min) / B)
    return S, S * B

def fit_tradeoff(B1, S1, B2, S2):
    e_min = (S1 - S2) / (1 / B1 - 1 / B2)
    return S1 - e_min / B1, e_min

def largest_batch(s_min, e_min, max_examples):
    if max_examples <= e_min:
        return None
    B = (max_examples - e_min) / s_min
    return B, steps_examples(B, s_min, e_min)[0]

print(steps_examples(100, 1000, 100000), steps_examples(10000, 1000, 100000), [round(v) for v in fit_tradeoff(100, 2000, 10000, 1010)])
print(largest_batch(1000, 100000, 300000), largest_batch(1000, 100000, 50000))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2000.0, 200000.0) (1010.0, 10100000.0) [1000, 100000]\n(200.0, 1500.0) None",
          "(2000.0, 200000.0) (1010.0, 10100000.0) [1000, 100000]\n(300.0, 1333.3) None",
          "(1010.0, 101000.0) (2000.0, 20000000.0) [1000, 100000]\n(200.0, 1500.0) None",
          "(2000.0, 200000.0) (1010.0, 10100000.0) [100000, 1000]\n(200.0, 1500.0) (0.0, inf)",
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

def expected_loss(h, x0sq, sigma2, B, lr, steps):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    out = []
    for _ in range(steps):
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2 / B
        out.append(0.5 * float(np.sum(h * m)))
    return out

def steps_to_target(h, x0sq, sigma2, B, lr, target, max_steps=10000):
    h, m = np.asarray(h, float), np.asarray(x0sq, float)
    for k in range(1, max_steps + 1):
        m = (1 - lr * h) ** 2 * m + lr ** 2 * sigma2 / B
        if 0.5 * float(np.sum(h * m)) <= target:
            return k
    return None

def tuned_steps(h, x0sq, sigma2, B, lrs, target, max_steps=10000):
    found = [s for s in (steps_to_target(h, x0sq, sigma2, B, lr, target, max_steps) for lr in lrs) if s is not None]
    return min(found) if found else None

print([round(v, 4) for v in expected_loss([1.0], [1.0], 1.0, 4, 0.5, 3)], steps_to_target([1.0], [1.0], 0.0, 1, 0.5, 0.01))
lrs = [0.05 * i for i in range(1, 40)]; print([tuned_steps([1.0, 0.05], [1.0, 1.0], 1.0, B, lrs, 0.01) for B in [4, 16, 64, 256, 1024]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.1562, 0.0703, 0.0488] 3\n[357, 93, 28, 12, 8]",
          "[0.125, 0.0312, 0.0078] 3\n[357, 93, 28, 12, 8]",
          "[0.1562, 0.0703, 0.0488] 4\n[357, 93, 28, 12, 8]",
          "[0.1562, 0.0703, 0.0488] 3\n[357, 181, 93, 50, 28]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>steps_examples(B, s_min, e_min)</C>, returning (S, E) from the hyperbola, <C>fit_tradeoff(B1, S1, B2, S2)</C>,
          returning (s_min, e_min) from two runs, and <C>largest_batch(s_min, e_min, max_examples)</C>, returning the largest
          batch whose run uses at most max_examples and its step count, or None if even the smallest batches need more.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def steps_examples(B, s_min, e_min):
    return s_min, s_min * B

def fit_tradeoff(B1, S1, B2, S2):
    return min(S1, S2), 0.0

def largest_batch(s_min, e_min, max_examples):
    return None
`,
        solution: FIT,
        tests: [
          { name: "curve", code: `S, E = steps_examples(50, 200, 10000); assert abs(S - 400) < 1e-9 and abs(E - 20000) < 1e-9
for B in [3, 40, 900]:
    S, E = steps_examples(B, 120, 6000); assert abs((S / 120 - 1) * (E / 6000 - 1) - 1) < 1e-9
s, e = fit_tradeoff(*[v for B in (32, 512) for v in (B, steps_examples(B, 75, 9000)[0])]); assert abs(s - 75) < 1e-9 and abs(e - 9000) < 1e-6` },
          { name: "budget", code: `B, S = largest_batch(100, 5000, 25000); assert abs(B - 200) < 1e-9 and abs(S - 125) < 1e-9 and abs(steps_examples(B, 100, 5000)[1] - 25000) < 1e-6
assert largest_batch(100, 5000, 5000) is None and largest_batch(1, 10, 9) is None` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For SGD on ½Σhᵢxᵢ² with gradient noise of variance σ²/B per coordinate, the expected squares follow{" "}
          <C>m ← (1 − ηh)²m + η²σ²/B</C>. Write <C>expected_loss(h, x0sq, sigma2, B, lr, steps)</C>, the list of ½Σhᵢmᵢ after
          each step, <C>steps_to_target(h, x0sq, sigma2, B, lr, target, max_steps=10000)</C>, the first step at or below
          target (or None), and <C>tuned_steps(...)</C>, the best over a list of learning rates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def expected_loss(h, x0sq, sigma2, B, lr, steps):
    return []

def steps_to_target(h, x0sq, sigma2, B, lr, target, max_steps=10000):
    return None

def tuned_steps(h, x0sq, sigma2, B, lrs, target, max_steps=10000):
    return None
`,
        solution: SIM,
        tests: [
          { name: "loss", code: `out = expected_loss([2.0, 0.5], [1.0, 4.0], 0.8, 2, 0.25, 2); m = np.array([1.0, 4.0]); h = np.array([2.0, 0.5]); ref = []
for _ in range(2):
    m = (1 - 0.25 * h) ** 2 * m + 0.0625 * 0.4; ref.append(0.5 * float(h @ m))
assert np.allclose(out, ref) and len(out) == 2` },
          { name: "steps", code: `assert steps_to_target([1.0], [1.0], 0.0, 1, 0.5, 0.01) == 3 and steps_to_target([1.0], [1.0], 1.0, 1, 0.5, 1e-3, 500) is None
assert tuned_steps([1.0], [1.0], 0.0, 1, [0.1, 0.5, 1.0], 0.01) == 1 and tuned_steps([1.0], [1.0], 1.0, 1, [0.5], 1e-3, 50) is None
assert tuned_steps([1.0, 0.05], [1.0, 1.0], 1.0, 16, [0.05 * i for i in range(1, 40)], 0.01) == 93` },
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          With B_crit = 2000, by what factor does going from B = 2000 to B = 8000 cut the number of steps? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.6, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Choosing a batch size also means choosing a learning rate to go with it. The next lesson asks how the best learning
        rate should change as the batch grows: linearly, as a square root, or not at all.
      </p>
    </>
  ),
};
