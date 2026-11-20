import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LrTransferViz } from "@/components/viz/LrTransferViz";
import type { LessonContent } from "@/lib/types";

const SWEEPS = `import math

def argmin_lr(lrs, losses):
    best, best_loss = None, math.inf
    for lr, loss in zip(lrs, losses):
        if math.isfinite(loss) and loss < best_loss:
            best, best_loss = lr, loss
    return best

def octave_shift(lr_a, lr_b):
    return math.log2(lr_b / lr_a)

def transfer_gap(lrs, small, big):
    i = lrs.index(argmin_lr(lrs, small))
    j = lrs.index(argmin_lr(lrs, big))
    return big[i] - big[j]`;

const DEPTH = `import math

def branch_mult(L):
    return 1 / math.sqrt(L)

def depth_lr(lr0, L0, L, opt):
    return lr0 if opt == 'sgd' else lr0 * math.sqrt(L0 / L)

def proxy_cost(n, L, n0, L0):
    return (n / n0) ** 2 * (L / L0)`;

export const lesson: LessonContent = {
  id: "m17.4.2",
  minutes: 45,
  links: {
    requires: ["m17.4.1", "m17.2.4"],
    revisits: ["m8.8.1", "m8.5.2"],
    foreshadows: ["m17.4.3", "m17.5.3"],
  },

  puzzle: (
    <>
      <p>
        Training a model with billions of parameters costs millions, so nobody can afford to sweep its learning rate. The
        usual remedy is to sweep a small model and guess how the best values change with size, from rules of thumb that
        often fail. If the infinite-width limit of a parametrisation is well defined, could the small model&apos;s best
        hyperparameters simply be the large model&apos;s too?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In μP, a network of width 256 and one of width 4096 are two approximations of the same infinite-width training
        process, so their losses, as functions of the learning rate, are two approximations of the same curve, and their
        minimisers are close. In the standard parametrisation there is no limiting curve at a fixed learning rate: the wider
        model is a different, less stable object, and its best learning rate keeps sliding down.
      </p>
      <LrTransferViz />
    </>
  ),

  theory: (
    <>
      <Definition title="μTransfer">
        <p>
          Parametrise the model family in μP relative to a base width. Sweep the hyperparameters of a narrow proxy, read off
          the best values from the sweep, and train the wide target once with those values. Two numbers measure how well
          this worked: the shift, in octaves, between the best learning rates of the proxy and of the target, and the{" "}
          <em>transfer gap</em>, the target&apos;s loss at the proxy&apos;s best rate minus its best loss (<C>argmin_lr</C>, <C>octave_shift</C>,{" "}
          <C>transfer_gap</C>). Diverged runs are recorded as NaN and must be skipped, not compared.
        </p>
        <Code>{SWEEPS}</Code>
      </Definition>

      <Theorem title="why the optimum converges">
        <p>
          Let <M>{"L_n(\\eta)"}</M> be the loss after training at width n with learning rate η, and suppose{" "}
          <M>{"L_n \\to L_\\infty"}</M> uniformly on an interval <M>{"[\\eta_-, \\eta_+]"}</M>, with <M>{"L_\\infty"}</M> continuous and having a unique
          minimiser <M>{"\\eta^*"}</M> in the interior. Then any minimisers <M>{"\\eta_n^*"}</M> of <M>{"L_n"}</M> on the interval converge to{" "}
          <M>{"\\eta^*"}</M>. In μP the first hypothesis holds for a fixed number of steps, because training converges to the
          infinite-width μP dynamics; in the standard parametrisation no non-trivial limit exists at fixed η.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fix ε &gt; 0. Outside <M>{"(\\eta^* - \\varepsilon, \\eta^* + \\varepsilon)"}</M> the continuous function <M>{"L_\\infty"}</M> on a compact set attains a
          minimum <M>{"L_\\infty(\\eta^*) + \\delta"}</M> with δ &gt; 0, by uniqueness. Take n so large that{" "}
          <M>{"|L_n - L_\\infty| < \\delta/2"}</M> everywhere. Then every η outside the window has{" "}
          <M>{"L_n(\\eta) > L_\\infty(\\eta^*) + \\delta/2 > L_n(\\eta^*)"}</M>, so no minimiser of <M>{"L_n"}</M> lies outside it. For SP, the output
          change per step grows like <M>{"\\eta n"}</M> (m17.4.1), so a fixed η eventually diverges and <M>{"\\eta_n^* \\to 0"}</M>.
        </p>
      </Proof>

      <Example title="reading the sweep">
        <p>
          In the viz, with one learning rate for all weights the best rate moves from <M>{"2^{-0.5}"}</M> at width 16 to{" "}
          <M>{"2^{-4.5}"}</M> at width 256, a shift of 4 octaves, roughly the factor <M>{"256/16"}</M> that the output layer&apos;s{" "}
          <M>{"\\eta n"}</M> predicts; the proxy&apos;s choice diverges outright at the target width. In μP the best rate is the same
          at all three widths, so the transfer gap is zero.
        </p>
      </Example>

      <Theorem title="transfer across depth">
        <p>
          For residual networks with branch multiplier <M>{"1/\\sqrt L"}</M> (m17.2.4) and μP in each block, the training dynamics also
          have a limit as L grows. In that limit the SGD learning rate needs no change with depth, while Adam&apos;s must scale like{" "}
          <M>{"1/\\sqrt L"}</M> (<C>branch_mult</C>, <C>depth_lr</C>).
        </p>
        <Code>{DEPTH}</Code>
      </Theorem>
      <Proof>
        <p>
          Heuristic count. Each block&apos;s contribution to the stream is <M>{"L^{-1/2} f_l"}</M>. Under SGD the gradient reaching block
          l carries the factor <M>{"L^{-1/2}"}</M>, so its weights move by <M>{"\\eta L^{-1/2}"}</M> and its contribution changes by{" "}
          <M>{"\\eta L^{-1}"}</M>; the L blocks push the output in a common, loss-reducing direction, so these changes add to{" "}
          <M>{"\\Theta(\\eta)"}</M>. Under Adam the update size does not see the gradient&apos;s scale, so each block moves by η, changes the
          stream by <M>{"\\eta L^{-1/2}"}</M>, and the L blocks add to <M>{"\\eta\\sqrt L"}</M>, which stays Θ(1) only if{" "}
          <M>{"\\eta \\propto L^{-1/2}"}</M>.
        </p>
      </Proof>

      <Remark title="what transfers, and what it saves">
        <p>
          Hyperparameters that set the scale of initialisations and updates, such as learning rates, their schedules,
          multipliers and momentum, transfer well across width. Those tied to regularisation or to the amount of data, such as
          weight decay, dropout and the number of steps, generally do not, because proxy and target differ in more than
          width. The saving is large: a proxy of width <M>{"n_0"}</M> and depth <M>{"L_0"}</M> costs about{" "}
          <M>{"(n_0/n)^2 (L_0/L)"}</M> of the target per step (<C>proxy_cost</C>). Yang and colleagues tuned a proxy of about 40 million
          parameters and transferred its hyperparameters to a 6.7 billion parameter GPT-3, matching or beating the published
          model for a tuning cost of a few per cent of one training run.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sp",
      rung: "check",
      prompt: <p>In the standard parametrisation of a one-hidden-layer network, the best learning rate scales like 1/n. If 0.3 is best at width 64, what is best at width 1000?</p>,
      answer: { kind: "numeric", value: 0.0192, tolerance: 0.00001 },
    },
    {
      key: "adam",
      rung: "check",
      prompt: <p>Under depth-μP with Adam, a learning rate of 0.003 is best at 8 blocks. What should it be at 72 blocks?</p>,
      answer: { kind: "numeric", value: 0.001, tolerance: 0.000001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What makes the best learning rate of a μP network nearly independent of width?</p>,
      answer: {
        kind: "choice",
        options: [
          "Training at every width approximates one infinite-width μP process, so the loss curves in η converge to one curve and so do their minimisers",
          "μP uses a learning rate schedule that adapts to the width automatically",
          "μP networks are linear in their parameters, so the optimal step is fixed",
          "The loss of a μP network does not depend on the learning rate",
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

def argmin_lr(lrs, losses):
    best, best_loss = None, math.inf
    for lr, loss in zip(lrs, losses):
        if math.isfinite(loss) and loss < best_loss:
            best, best_loss = lr, loss
    return best

def octave_shift(lr_a, lr_b):
    return math.log2(lr_b / lr_a)

def transfer_gap(lrs, small, big):
    i = lrs.index(argmin_lr(lrs, small))
    j = lrs.index(argmin_lr(lrs, big))
    return big[i] - big[j]

print(argmin_lr([0.01, 0.1, 1.0], [0.5, 0.2, float('nan')]), argmin_lr([0.01, 0.1, 1.0], [float('inf'), 0.3, 0.3]), octave_shift(0.5, 0.125))
print(round(transfer_gap([0.01, 0.1, 1.0], [0.4, 0.25, 0.3], [0.35, 0.33, 0.2]), 4), transfer_gap([1, 2], [0.1, 0.2], [0.3, float('nan')]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1 0.1 -2.0\n0.13 0.0",
          "0.1 1.0 -2.0\n0.13 0.0",
          "1.0 0.1 2.0\n0.13 0.0",
          "0.1 0.1 -2.0\n0.15 nan",
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

def branch_mult(L):
    return 1 / math.sqrt(L)

def depth_lr(lr0, L0, L, opt):
    return lr0 if opt == 'sgd' else lr0 * math.sqrt(L0 / L)

def proxy_cost(n, L, n0, L0):
    return (n / n0) ** 2 * (L / L0)

print(branch_mult(4), branch_mult(100), depth_lr(0.01, 4, 16, 'sgd'), depth_lr(0.01, 4, 16, 'adam'))
print(proxy_cost(1024, 48, 256, 12), proxy_cost(256, 12, 256, 12))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.1 0.01 0.005\n64.0 1.0",
          "0.5 0.1 0.01 0.0025\n64.0 1.0",
          "0.25 0.01 0.01 0.005\n64.0 1.0",
          "0.5 0.1 0.005 0.01\n16.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>argmin_lr(lrs, losses)</C> returning the learning rate with the smallest finite loss (the first on ties),{" "}
          <C>octave_shift(lr_a, lr_b)</C>, and <C>transfer_gap(lrs, small, big)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def argmin_lr(lrs, losses):
    return lrs[losses.index(min(losses))]

def octave_shift(lr_a, lr_b):
    return 0.0

def transfer_gap(lrs, small, big):
    return 0.0
`,
        solution: SWEEPS,
        tests: [
          { name: "argmin", code: `nan = float('nan')\nassert argmin_lr([1, 2, 3, 4], [nan, 0.5, 0.2, 0.2]) == 3 and abs(octave_shift(0.1, 0.8) - 3) < 1e-12` },
          { name: "gap", code: `nan = float('nan')\nassert abs(transfer_gap([1, 2, 4], [0.3, 0.1, 0.2], [0.05, 0.4, nan]) - 0.35) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>branch_mult(L)</C>, <C>depth_lr(lr0, L0, L, opt)</C> for opt &apos;sgd&apos; or &apos;adam&apos;, and{" "}
          <C>proxy_cost(n, L, n0, L0)</C>, the per-step cost of the model (n, L) relative to (n0, L0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def branch_mult(L):
    return 1.0

def depth_lr(lr0, L0, L, opt):
    return lr0

def proxy_cost(n, L, n0, L0):
    return 1.0
`,
        solution: DEPTH,
        tests: [
          { name: "depth", code: `assert abs(branch_mult(25) - 0.2) < 1e-12 and abs(depth_lr(0.02, 4, 64, 'adam') - 0.005) < 1e-12 and depth_lr(0.02, 4, 64, 'sgd') == 0.02` },
          { name: "cost", code: `assert abs(proxy_cost(2048, 32, 512, 8) - 64) < 1e-12` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          A target of width 4096 and depth 96 is to be tuned with 30 runs of a proxy of width 512 and depth 24, each for the
          same number of steps as the target run. What fraction of one target run does the whole sweep cost? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1172, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Behind μP and its depth extension lies a general machine for computing infinite-width limits of any architecture
        written as a sequence of matrix multiplications and coordinatewise functions: Tensor Programs.
      </p>
    </>
  ),
};
