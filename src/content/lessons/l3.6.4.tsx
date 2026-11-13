import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BatchTradeoffViz } from "@/components/viz/BatchTradeoffViz";
import type { LessonContent } from "@/lib/types";

const NOISE = `import numpy as np

def minibatch_grad_var(per_ex, B):
    return float(per_ex.var(axis=0).sum() / B)

def noise_scale(per_ex):
    G = per_ex.mean(axis=0)
    return float(per_ex.var(axis=0).sum() / (G @ G))`;

const SCALE = `def steps_to_target(B, b_noise, s_min):
    return s_min * (1 + b_noise / B)

def examples_to_target(B, b_noise, e_min):
    return e_min * (1 + B / b_noise)

def scaled_lr(lr0, b0, b, rule):
    r = b / b0
    return lr0 * (r if rule == "linear" else np.sqrt(r))`;

export const lesson: LessonContent = {
  id: "l3.6.4",
  minutes: 45,
  links: {
    requires: ["l3.6.3"],
    revisits: ["e5.3.3", "l3.6.1"],
    foreshadows: ["m14.1.2", "m14.1.3"],
  },

  puzzle: (
    <>
      <p>
        Eight GPUs instead of one let you use a batch eight times larger. Does training finish eight times sooner? Sometimes
        nearly; sometimes it barely speeds up at all; and if the learning rate is left alone it may get slower. What decides
        how much a bigger batch is worth, and how should the learning rate follow it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A minibatch gradient is an average of B per-example gradients, so its noise shrinks like 1/B. While noise is the main
        obstacle, a batch twice as large is worth two steps, and the learning rate can grow with it. Once the noise is small
        compared with the true gradient, a bigger batch gives almost the same step as before, and its extra examples are
        wasted. The crossover is the critical batch size.
      </p>
      <BatchTradeoffViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="minibatch noise">
        <p>
          If per-example gradients <M>{"g_i"}</M> are drawn independently with mean G and covariance Σ, the minibatch mean{" "}
          <M>{"\\bar g = \\tfrac1B\\sum_{i=1}^B g_i"}</M> has mean G and covariance <M>{"\\Sigma/B"}</M>, so{" "}
          <M>{"\\mathbb{E}\\|\\bar g - G\\|^2 = \\operatorname{tr}(\\Sigma)/B"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Linearity gives the mean. For independent vectors, covariances add, and scaling by 1/B scales covariance by{" "}
          <M>{"1/B^2"}</M>, so <M>{"\\operatorname{Cov}(\\bar g) = B\\Sigma/B^2"}</M>. The expected squared error is the trace
          of the covariance.
        </p>
      </Proof>

      <Definition title="the gradient noise scale">
        <MD>{"B_{\\text{noise}} = \\frac{\\operatorname{tr}(\\Sigma)}{\\|G\\|^2}."}</MD>
        <p>
          At <M>{"B = B_{\\text{noise}}"}</M> the noise in <M>{"\\bar g"}</M> has the same size as the gradient itself. Far
          below it, steps are noise-dominated; far above it, nearly exact. An empirical model that fits many tasks well is
        </p>
        <MD>{"S(B) = S_{\\min}\\Big(1 + \\frac{B_{\\text{noise}}}{B}\\Big), \\qquad E(B) = B\\,S(B) = E_{\\min}\\Big(1 + \\frac{B}{B_{\\text{noise}}}\\Big),"}</MD>
        <p>
          for the steps S and examples E needed to reach a given loss, with <M>{"E_{\\min} = S_{\\min}B_{\\text{noise}}"}</M>.
          B<sub>noise</sub> grows as training goes on, because ‖G‖ shrinks, which is why large runs often increase the batch size
          later in training.
        </p>
        <Code>{NOISE}</Code>
      </Definition>

      <Remark title="scaling the learning rate">
        <p>
          For SGD in the noise-dominated regime, k steps of batch B with learning rate η move the parameters about as far as
          one step of batch kB with learning rate kη, and the noise per unit of progress is the same, since by the previous
          lesson the noise floor depends on <M>{"\\eta/B"}</M>. This is the <em>linear scaling rule</em>: multiply η by k when
          multiplying B by k, usually with a warmup. For Adam, whose step is normalised, a square-root rule is a common
          starting point. Both break down near <M>{"B_{\\text{noise}}"}</M>, where the largest stable learning rate, set by
          curvature rather than noise, takes over.
        </p>
        <Code>{SCALE}</Code>
      </Remark>

      <Example title="the two regimes in numbers">
        <p>
          With <M>{"B_{\\text{noise}} = 1000"}</M> and <M>{"S_{\\min} = 100"}</M>: batch 10 needs 10 100 steps, batch 1000
          needs 200, batch 100 000 needs 101. Going from 1000 to 100 000 cuts steps by half but multiplies the data by fifty.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>Per-example gradients of one parameter have standard deviation 2. What is the standard deviation of the mean over a batch of 64?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-9 },
    },
    {
      key: "linear",
      rung: "check",
      prompt: <p>SGD trains well with learning rate 0.1 at batch size 256. Under the linear scaling rule, what learning rate goes with batch size 1024?</p>,
      answer: { kind: "numeric", value: 0.4, tolerance: 1e-9 },
    },
    {
      key: "beyond",
      rung: "apply",
      prompt: <p>Why does increasing the batch size far beyond the critical batch size barely reduce the number of steps?</p>,
      answer: {
        kind: "choice",
        options: [
          "The minibatch gradient is already close to the true gradient, so a bigger batch gives nearly the same step",
          "Larger batches always overfit",
          "The learning rate must be decreased for large batches",
          "Gradient noise grows with the batch size",
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

def minibatch_grad_var(per_ex, B):
    return float(per_ex.var(axis=0).sum() / B)

def noise_scale(per_ex):
    G = per_ex.mean(axis=0)
    return float(per_ex.var(axis=0).sum() / (G @ G))

rng = np.random.default_rng(0)
per_ex = rng.normal(0.5, 2.0, size=(100000, 1))
for B in [1, 16, 256]:
    means = per_ex[: (len(per_ex) // B) * B].reshape(-1, B, 1).mean(axis=1)
    print(B, round(float(means.var()), 3), round(minibatch_grad_var(per_ex, B), 3))
print(round(noise_scale(per_ex)))`}</Code>
          <p>Per-example gradients with mean 0.5 and standard deviation 2. Which output is closest to what this prints?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 4.001 4.001\n16 0.247 0.25\n256 0.015 0.016\n16",
          "1 4.001 4.001\n16 1.0 1.0\n256 0.25 0.25\n16",
          "1 2.0 2.0\n16 0.5 0.5\n256 0.125 0.125\n4",
          "1 4.001 4.001\n16 0.247 0.25\n256 0.015 0.016\n4",
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

def steps_to_target(B, b_noise, s_min):
    return s_min * (1 + b_noise / B)

def examples_to_target(B, b_noise, e_min):
    return e_min * (1 + B / b_noise)

def scaled_lr(lr0, b0, b, rule):
    r = b / b0
    return lr0 * (r if rule == "linear" else np.sqrt(r))

print([steps_to_target(B, 1000, 100) for B in [10, 1000, 100000]])
print([examples_to_target(B, 1000, 1e4) for B in [10, 1000, 100000]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[10100.0, 200.0, 101.0]\n[10100.0, 20000.0, 1010000.0]",
          "[10100.0, 200.0, 101.0]\n[101000.0, 200000.0, 10100000.0]",
          "[101.0, 200.0, 10100.0]\n[10100.0, 20000.0, 1010000.0]",
          "[1010.0, 200.0, 100.1]\n[10100.0, 20000.0, 1010000.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          <C>per_ex</C> is an (N, d) array of per-example gradients. Write <C>minibatch_grad_var(per_ex, B)</C>, the expected
          squared distance tr(Σ)/B of a batch-B mean gradient from the full mean (use the biased variance), and{" "}
          <C>noise_scale(per_ex)</C>, tr(Σ)/‖G‖². Both return floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def minibatch_grad_var(per_ex, B):
    return 0.0

def noise_scale(per_ex):
    return 0.0
`,
        solution: NOISE,
        tests: [
          { name: "small example", code: `per_ex = np.array([[1.0, 0.0], [3.0, 2.0]])
assert abs(minibatch_grad_var(per_ex, 1) - 2.0) < 1e-12
assert abs(minibatch_grad_var(per_ex, 4) - 0.5) < 1e-12
assert abs(noise_scale(per_ex) - 2.0 / 5.0) < 1e-12
assert isinstance(noise_scale(per_ex), float)` },
          { name: "matches sampling", code: `rng = np.random.default_rng(3)
per_ex = rng.normal([1.0, -2.0], [3.0, 1.0], size=(200000, 2))
assert abs(noise_scale(per_ex) - 10 / 5) < 0.05
idx = rng.integers(0, len(per_ex), size=(4000, 32))
means = per_ex[idx].mean(axis=1)
emp = ((means - per_ex.mean(axis=0)) ** 2).sum(axis=1).mean()
assert abs(emp - minibatch_grad_var(per_ex, 32)) < 0.02` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>steps_to_target(B, b_noise, s_min)</C> and <C>examples_to_target(B, b_noise, e_min)</C> from the model
          above, and <C>scaled_lr(lr0, b0, b, rule)</C>, which rescales a learning rate tuned at batch b0 to batch b, by the
          ratio for <C>rule == "linear"</C> and by its square root for <C>rule == "sqrt"</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def steps_to_target(B, b_noise, s_min):
    return s_min

def examples_to_target(B, b_noise, e_min):
    return e_min

def scaled_lr(lr0, b0, b, rule):
    return lr0
`,
        solution: `import numpy as np

${SCALE}`,
        tests: [
          { name: "model", code: `assert abs(steps_to_target(10, 1000, 100) - 10100) < 1e-9
assert abs(steps_to_target(1000, 1000, 100) - 200) < 1e-9
assert abs(examples_to_target(100000, 1000, 1e4) - 1010000) < 1e-6
for B in [3.0, 50.0, 7000.0]:
    assert abs(B * steps_to_target(B, 400, 25) - examples_to_target(B, 400, 25 * 400)) < 1e-6` },
          { name: "lr rules", code: `assert abs(scaled_lr(0.1, 256, 1024, "linear") - 0.4) < 1e-12
assert abs(scaled_lr(3e-4, 256, 1024, "sqrt") - 6e-4) < 1e-15
assert abs(scaled_lr(0.1, 1024, 256, "linear") - 0.025) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the mean of B independent per-example gradients, each with mean G and covariance Σ, satisfies E‖ḡ − G‖² = tr(Σ)/B.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows E[ḡ] = G by linearity.",
          "Shows Cov(ḡ) = Σ/B, using independence (cross-covariances vanish) and the 1/B² factor from the scaling.",
          "Uses E‖X − EX‖² = tr Cov(X) to conclude tr(Σ)/B.",
        ],
      },
    },
    {
      key: "crit",
      rung: "stretch",
      prompt: <p>Under S(B) = S_min(1 + B_noise/B), at what batch size, as a multiple of B_noise, are the steps exactly 1.25 × S_min?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend how batch size controls gradient noise, what the critical batch size is, and how the learning rate should change with the batch.",

  glimpse: (
    <p>
      The optimiser gets the training loss down. Whether the model does well on new data is another matter. Next chapter:
      regularisation, starting with weight decay.
    </p>
  ),
};
