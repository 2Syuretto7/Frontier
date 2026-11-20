import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MupStepViz } from "@/components/viz/MupStepViz";
import type { LessonContent } from "@/lib/types";

const TABLE = `def mup_sgd(kind, fan_in, fan_out, eta):
    if kind == 'input':
        return 1 / fan_in, eta * fan_out
    if kind == 'hidden':
        return 1 / fan_in, eta
    return 1 / fan_in ** 2, eta / fan_in

def transfer_lr(lr, n_base, n, kind):
    if kind == 'input':
        return lr * n / n_base
    if kind == 'hidden':
        return lr
    return lr * n_base / n

def feature_exponent(lr_exp, grad_exp):
    return lr_exp + grad_exp + 1`;

const OUTER = `import math

def outer_update(W, g, x, lr):
    return [[W[i][j] - lr * g[i] * x[j] for j in range(len(x))] for i in range(len(g))]

def matvec(W, x):
    return [sum(w * v for w, v in zip(row, x)) for row in W]

def rms(v):
    return math.sqrt(sum(a * a for a in v) / len(v))`;

export const lesson: LessonContent = {
  id: "m17.4.1",
  minutes: 55,
  links: {
    requires: ["m17.3.3"],
    revisits: ["l3.4.1", "m7.7.2"],
    foreshadows: ["m17.4.2", "m17.4.3"],
  },

  puzzle: (
    <>
      <p>
        Double the width of a network trained with the usual initialisation and one global learning rate, and the best
        learning rate roughly halves; keep the old one and training diverges. Rescale everything as the NTK theory says,
        and wide networks stop learning features. Is there a way to scale initialisations and learning rates with width so
        that a wide network is neither unstable nor lazy, and is it unique?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A random matrix applied to a vector it knows nothing about sums n terms of random sign, giving a result of size √n
        times an entry. A gradient update is different: it is an outer product built from the very activations it will be
        applied to, so its n terms all have the same sign, and the result is n times an entry. Updates therefore need
        entries a factor √n smaller than the initial weights to have the same effect. Getting this bookkeeping right in every
        layer is the maximal update parametrisation, μP.
      </p>
      <MupStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="width parametrisations and what we ask of them">
        <p>
          For an MLP of hidden width n, choose for each layer an initial variance and a learning rate as powers of n. In the
          infinite-width limit we ask for three things after any fixed number of steps of SGD:
        </p>
        <ul>
          <li><strong>stability</strong>: every pre-activation and the output have coordinates of size O(1);</li>
          <li><strong>non-triviality</strong>: the output changes by Θ(1);</li>
          <li><strong>feature learning</strong>: every hidden layer&apos;s features change by Θ(1) per coordinate.</li>
        </ul>
        <p>
          The NTK parametrisation of m17.3.2 meets the first two but its features change by <M>{"\\Theta(n^{-1/2})"}</M>. The standard
          parametrisation, variance 1/fan-in and one learning rate, fails stability as n grows unless the learning rate
          shrinks, after which it fails feature learning in the early layers.
        </p>
      </Definition>

      <Theorem title="updates add coherently">
        <p>
          Let <M>{"x \\in \\mathbb R^n"}</M> have Θ(1) coordinates. A matrix W with independent entries of size σ gives <M>{"Wx"}</M> coordinates
          of size <M>{"\\sigma\\sqrt n"}</M>. An SGD update <M>{"\\Delta W = -\\eta\\, g x^\\top"}</M> applied to x, or to any x&apos; correlated with x,
          gives
        </p>
        <MD>{"\\Delta W x' = -\\eta\\, g\\, (x \\cdot x') = \\Theta(\\eta\\, n)\\, g,"}</MD>
        <p>
          because the n products <M>{"x_j x'_j"}</M> have a non-zero mean. (<C>outer_update</C>, <C>matvec</C>, <C>rms</C>.)
        </p>
        <Code>{OUTER}</Code>
      </Theorem>
      <Proof>
        <p>
          The first claim is the central limit scaling of a sum of n independent mean-zero terms (m7.7.2), the second the law
          of large numbers for <M>{"\\frac1n x\\cdot x'"}</M>, whose limit is a non-zero constant when the two are correlated. The
          second read exercise shows both: the same update hits a vector of ones with a sum of 8 coherent terms, and an
          alternating vector with a sum that cancels.
        </p>
      </Proof>

      <Theorem title="the maximal update parametrisation (Yang and Hu)">
        <p>
          For SGD, up to equivalent reparametrisations, the unique choice satisfying stability, non-triviality and feature
          learning in every layer is (<C>mup_sgd</C>)
        </p>
        <MD>{"\\begin{array}{lcc} & \\text{initial variance} & \\text{learning rate} \\\\ \\text{input weights} & 1/\\text{fan-in} & \\eta\\, n \\\\ \\text{hidden weights} & 1/n & \\eta \\\\ \\text{output weights} & 1/n^2 & \\eta / n \\end{array}"}</MD>
        <Code>{TABLE}</Code>
      </Theorem>
      <Proof>
        <p>
          Bookkeeping of exponents. Write <M>{"n^{-\\beta}"}</M> for the coordinate size of the gradient <M>{"g = \\partial f/\\partial h"}</M> at a
          hidden pre-activation and <M>{"n^{-c}"}</M> for a hidden layer&apos;s learning rate. By the previous theorem the update changes
          that layer&apos;s pre-activations by <M>{"n^{-c}\\cdot n^{-\\beta}\\cdot n"}</M>, exponent <M>{"1 - c - \\beta"}</M> (<C>feature_exponent</C>). The
          gradient at the last hidden layer is the output weight vector, so <M>{"\\beta"}</M> is fixed by the output scale, and it propagates
          unchanged backwards through stable hidden layers. Feature learning needs exponent 0 and stability needs at most 0.
        </p>
        <p>
          Now the output. Its change from updating the output weights is <M>{"\\eta_{\\text{out}}\\, |z|^2 \\sim \\eta_{\\text{out}}\\, n"}</M>, so
          non-triviality without blow-up forces <M>{"\\eta_{\\text{out}} \\sim 1/n"}</M>, after which the output weights move by{" "}
          <M>{"\\Theta(1/n)"}</M> per coordinate. If their initial size were larger, say <M>{"n^{-1/2}"}</M>, the backward gradient would be dominated by
          the random initial weights with β = ½, and the hidden learning rate would have to be <M>{"n^{-1/2}"}</M>; the initial output,
          a sum of n random terms of size <M>{"n^{-1/2}"}</M>, would stay O(1) and random. Taking variance <M>{"1/n^2"}</M> makes the initial and
          learned parts the same size, β = 1, and then hidden learning rate Θ(1) gives exponent 0. For input weights the fan-in is
          fixed, so there is no factor n from the sum, and the learning rate must supply it: <M>{"\\eta\\, n"}</M>. Every other choice either
          breaks stability somewhere or leaves some layer&apos;s exponent negative.
        </p>
      </Proof>

      <Example title="reading the viz">
        <p>
          The exponents predicted for the change of the last hidden layer are <M>{"1 - 0 - \\tfrac12 = \\tfrac12"}</M> for SP,{" "}
          <M>{"1 - 1 - \\tfrac12 = -\\tfrac12"}</M> for NTK, and <M>{"1 - 0 - 1 = 0"}</M> for μP. The fitted slopes over widths 16 to 512 come out
          near these, with the ReLU nonlinearity and finite width bending SP below its asymptotic rate.
        </p>
      </Example>

      <Remark title="Adam and practice">
        <p>
          With Adam the update&apos;s entries have size about η whatever the gradient&apos;s size, so the table changes: input learning rate
          η, hidden and output learning rates η/n, output variance still <M>{"1/n^2"}</M> or zero. In practice μP is implemented as
          multipliers relative to a base width <M>{"n_0"}</M>, so that at <M>{"n = n_0"}</M> it coincides with the standard parametrisation
          and the scales only change as the model widens (<C>transfer_lr</C>). The output layer is often initialised at zero.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sp",
      rung: "check",
      prompt: <p>In the standard parametrisation the per-coordinate feature change grows like √n. By what factor does it grow from width 256 to width 4096?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "std",
      rung: "check",
      prompt: <p>Under μP for SGD, what is the standard deviation of the output weights of a network of width 1024?</p>,
      answer: { kind: "numeric", value: 0.0009765625, tolerance: 0.000001 },
    },
    {
      key: "coherent",
      rung: "apply",
      prompt: <p>Why must a hidden layer&apos;s update entries be much smaller than its initial weights to change the features by the same amount?</p>,
      answer: {
        kind: "choice",
        options: [
          "The update is an outer product with the layer's own input, so applied to that input its n terms add coherently, giving n rather than √n",
          "Updates are applied many times, so each must be small to avoid accumulation",
          "The initial weights are orthogonal while updates are not",
          "Smaller updates are needed only for numerical precision in floating point",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mup_sgd(kind, fan_in, fan_out, eta):
    if kind == 'input':
        return 1 / fan_in, eta * fan_out
    if kind == 'hidden':
        return 1 / fan_in, eta
    return 1 / fan_in ** 2, eta / fan_in

def transfer_lr(lr, n_base, n, kind):
    if kind == 'input':
        return lr * n / n_base
    if kind == 'hidden':
        return lr
    return lr * n_base / n

def feature_exponent(lr_exp, grad_exp):
    return lr_exp + grad_exp + 1

print(mup_sgd('input', 4, 100, 1.0), mup_sgd('hidden', 100, 100, 1.0), mup_sgd('output', 100, 1, 1.0))
print(transfer_lr(0.02, 256, 1024, 'output'), transfer_lr(0.02, 256, 1024, 'input'), [feature_exponent(*e) for e in [(0, -0.5), (-1, -0.5), (0, -1)]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.25, 100.0) (0.01, 1.0) (0.0001, 0.01)\n0.005 0.08 [0.5, -0.5, 0]",
          "(0.25, 100.0) (0.01, 1.0) (0.01, 0.01)\n0.005 0.08 [0.5, -0.5, 0]",
          "(0.25, 0.01) (0.01, 1.0) (0.0001, 100.0)\n0.08 0.005 [0.5, -0.5, 0]",
          "(0.25, 100.0) (0.01, 1.0) (0.0001, 0.01)\n0.005 0.08 [0.5, 0.5, 1]",
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

def outer_update(W, g, x, lr):
    return [[W[i][j] - lr * g[i] * x[j] for j in range(len(x))] for i in range(len(g))]

def matvec(W, x):
    return [sum(w * v for w, v in zip(row, x)) for row in W]

def rms(v):
    return math.sqrt(sum(a * a for a in v) / len(v))

W = [[0.0, 0.0], [0.0, 0.0]]; W2 = outer_update(W, [1, -1], [1, 1], 0.5); print(W2, matvec(W2, [1, 1]), rms(matvec(W2, [1, 1])))
Z = [[0.0] * 8 for _ in range(2)]; Z2 = outer_update(Z, [1, -1], [1] * 8, 0.5); print(rms(matvec(Z2, [1] * 8)), matvec(Z2, [1, -1] * 4), rms(matvec(Z2, [1, 1, 1, 1, 0, 0, 0, 0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[-0.5, -0.5], [0.5, 0.5]] [-1.0, 1.0] 1.0\n4.0 [0.0, 0.0] 2.0",
          "[[-0.5, 0.5], [-0.5, 0.5]] [0.0, 0.0] 0.0\n4.0 [0.0, 0.0] 2.0",
          "[[-0.5, -0.5], [0.5, 0.5]] [-1.0, 1.0] 1.0\n1.4142 [0.0, 0.0] 1.0",
          "[[-0.5, -0.5], [0.5, 0.5]] [-1.0, 1.0] 1.0\n4.0 [-4.0, 4.0] 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mup_sgd(kind, fan_in, fan_out, eta)</C> returning (initial variance, learning rate) for &apos;input&apos;, &apos;hidden&apos; or
          &apos;output&apos;; <C>transfer_lr(lr, n_base, n, kind)</C> rescaling a learning rate tuned at width n_base; and{" "}
          <C>feature_exponent(lr_exp, grad_exp)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mup_sgd(kind, fan_in, fan_out, eta):
    return 1 / fan_in, eta

def transfer_lr(lr, n_base, n, kind):
    return lr

def feature_exponent(lr_exp, grad_exp):
    return 0
`,
        solution: TABLE,
        tests: [
          { name: "table", code: `assert mup_sgd('input', 3, 512, 0.5) == (1 / 3, 256.0) and mup_sgd('output', 64, 1, 2.0) == (1 / 4096, 2.0 / 64) and mup_sgd('hidden', 64, 64, 2.0) == (1 / 64, 2.0)` },
          { name: "transfer", code: `assert abs(transfer_lr(0.1, 128, 512, 'input') - 0.4) < 1e-12 and abs(transfer_lr(0.1, 128, 512, 'output') - 0.025) < 1e-12 and feature_exponent(-0.25, -0.75) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>outer_update(W, g, x, lr)</C> returning <M>{"W - \\text{lr}\\, g x^\\top"}</M>, <C>matvec(W, x)</C> and <C>rms(v)</C>, the root mean
          square of a vector&apos;s coordinates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def outer_update(W, g, x, lr):
    return W

def matvec(W, x):
    return [0.0 for row in W]

def rms(v):
    return 0.0
`,
        solution: OUTER,
        tests: [
          { name: "update", code: `assert outer_update([[1.0, 2.0]], [2.0], [1.0, -1.0], 0.25) == [[0.5, 2.5]]` },
          { name: "apply", code: `assert matvec([[1, 2], [3, 4]], [1, -1]) == [-1, -1] and abs(rms([3, -4]) - math.sqrt(12.5)) < 1e-12` },
        ],
      },
    },
    {
      key: "sum",
      rung: "stretch",
      prompt: (
        <p>
          A μP model tuned at width 256 uses learning rate 0.05 for its input, hidden and output weights alike. Move it to width
          4096 with SGD μP scaling. What is the sum of its three new learning rates? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8531, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Because μP has a well-defined infinite-width limit that still learns features, the training dynamics, and with them
        the best hyperparameters, should stop depending on width once the network is wide enough. That is the promise of
        hyperparameter transfer.
      </p>
    </>
  ),
};
