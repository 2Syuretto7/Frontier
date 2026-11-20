import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ResidualScaleViz } from "@/components/viz/ResidualScaleViz";
import type { LessonContent } from "@/lib/types";

const GAINS = `import math

def forward_gain(alpha, L):
    return (1 + alpha ** 2) ** L

def rel_var(alpha, L):
    return L * (2 * alpha ** 2 + alpha ** 4) / (1 + alpha ** 2) ** 2

def alpha_for_gain(g, L):
    return math.sqrt(g ** (1 / L) - 1)`;

const FORWARD = `def matvec(A, x):
    return [sum(a * b for a, b in zip(row, x)) for row in A]

def res_forward(h, As, alpha):
    for A in As:
        Ah = matvec(A, h)
        h = [x + alpha * y for x, y in zip(h, Ah)]
    return h

def sq(h):
    return sum(x * x for x in h)`;

export const lesson: LessonContent = {
  id: "m17.2.4",
  minutes: 45,
  links: {
    requires: ["m17.2.3", "l3.5.3"],
    revisits: ["l3.4.2"],
    foreshadows: ["m17.4.2"],
  },

  puzzle: (
    <>
      <p>
        Residual connections are supposed to make depth easy: each block adds a correction to the identity, so the signal
        always has a clean path through. Yet a 1000-block residual network initialised in the standard way produces outputs
        whose size is astronomically larger than its inputs, and GPT-2 deliberately shrinks the last layer of every block by
        a factor that depends on the total number of blocks. Why does a sum of small corrections blow up, and what is the
        right size for each one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each block <M>{"h \\mapsto h + \\alpha f(h)"}</M> adds a random vector roughly orthogonal to h, so by Pythagoras the squared
        length grows by a factor 1 + α² per block. A fixed α compounds into exponential growth. The cure is to let α shrink
        with the depth L: like <M>{"1/\\sqrt L"}</M> the factors multiply to about e, and the network behaves the same at every depth.
      </p>
      <ResidualScaleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="scaled residual networks">
        <p>
          A residual network of depth L with branch scale α has blocks <M>{"h^{l+1} = h^l + \\alpha f_l(h^l)"}</M>. In the simplest
          model each branch is a random linear map, <M>{"f_l(h) = A_l h"}</M> with independent <M>{"N(0, 1/N)"}</M> entries; a ReLU layer with
          He initialisation behaves the same way for everything below. The code works with explicit matrices (<C>matvec</C>,{" "}
          <C>res_forward</C>, <C>sq</C>).
        </p>
        <Code>{FORWARD}</Code>
      </Definition>

      <Theorem title="the forward gain">
        <p>
          <M>{"\\mathbb E\\,\\|h^{L}\\|^2 = (1 + \\alpha^2)^L\\, \\|h^0\\|^2"}</M> (<C>forward_gain</C>). Hence
        </p>
        <MD>{"\\alpha \\text{ fixed: } e^{L\\ln(1+\\alpha^2)} \\to \\infty, \\qquad \\alpha = \\frac{c}{\\sqrt L}: \\ \\to e^{c^2}, \\qquad \\alpha = \\frac{c}{L}: \\ \\to 1."}</MD>
      </Theorem>
      <Proof>
        <p>
          Conditioned on <M>{"h^l"}</M>, the vector <M>{"A_l h^l"}</M> has mean zero and <M>{"\\mathbb E\\|A_l h^l\\|^2 = \\|h^l\\|^2"}</M>, since each of
          its N entries has variance <M>{"\\|h^l\\|^2/N"}</M>. Expanding <M>{"\\|h^l + \\alpha A_l h^l\\|^2"}</M>, the cross term has mean zero, so{" "}
          <M>{"\\mathbb E[\\|h^{l+1}\\|^2 \\mid h^l] = (1 + \\alpha^2)\\|h^l\\|^2"}</M>. Take expectations and iterate. The limits follow from{" "}
          <M>{"L \\ln(1 + c^2/L) \\to c^2"}</M> and <M>{"L\\ln(1 + c^2/L^2) \\to 0"}</M>.
        </p>
      </Proof>

      <Theorem title="the Jacobian spread">
        <p>
          The input-output Jacobian <M>{"J = \\prod_l (I + \\alpha A_l)"}</M> has, in the wide limit, mean squared singular value{" "}
          <M>{"(1+\\alpha^2)^L"}</M>, and relative variance
        </p>
        <MD>{"\\frac{\\operatorname{Var}(\\lambda)}{(\\mathbb E\\lambda)^2} = L\\,\\frac{2\\alpha^2 + \\alpha^4}{(1+\\alpha^2)^2}"}</MD>
        <p>
          (<C>rel_var</C>). With <M>{"\\alpha = c/\\sqrt L"}</M> this tends to <M>{"2c^2"}</M>: the spectrum has a depth-independent shape, a form
          of dynamical isometry that needs neither orthogonal weights nor special activations.
        </p>
        <Code>{GAINS}</Code>
      </Theorem>
      <Proof>
        <p>
          Each factor <M>{"M_l = I + \\alpha A_l"}</M> contributes <M>{"M_l M_l^\\top = I + \\alpha(A_l + A_l^\\top) + \\alpha^2 A_l A_l^\\top"}</M>. Its
          normalised trace is <M>{"1 + \\alpha^2"}</M>. For its second moment, the Gaussian moments <M>{"\\operatorname{tr}((A + A^\\top)^2)/N \\to 2"}</M>,{" "}
          <M>{"\\operatorname{tr}(AA^\\top)/N \\to 1"}</M> and <M>{"\\operatorname{tr}((AA^\\top)^2)/N \\to 2"}</M>, with the odd terms vanishing, give{" "}
          <M>{"1 + 4\\alpha^2 + 2\\alpha^4"}</M>. So one block has relative variance{" "}
          <M>{"(1 + 4\\alpha^2 + 2\\alpha^4)/(1+\\alpha^2)^2 - 1 = (2\\alpha^2 + \\alpha^4)/(1+\\alpha^2)^2"}</M>. As in m17.2.3, the blocks are
          asymptotically free and relative variances of free factors add, giving L times this.
        </p>
      </Proof>

      <Example title="three scalings">
        <p>
          With L = 100: α = 1 gives a forward gain of <M>{"2^{100} \\approx 10^{30}"}</M> and relative spread 75. α = 0.1 gives gain{" "}
          <M>{"1.01^{100} \\approx 2.70"}</M> and spread about 1.97, the <M>{"1/\\sqrt L"}</M> regime with c = 1. α = 0.01 gives gain about 1.01
          and spread 0.02: perfectly conditioned, but each block barely changes its input, and at initialisation the network
          is nearly the identity map.
        </p>
      </Example>

      <Remark title="the scalings used in practice">
        <p>
          GPT-2 multiplies the initial weights of the last layer of each branch by <M>{"1/\\sqrt{2L}"}</M>, the 2 because every layer has an
          attention and an MLP branch: this is the <M>{"1/\\sqrt L"}</M> rule. Fixup, SkipInit and ReZero go to the extreme α = 0 at
          initialisation, with α learned, so the network starts as the identity and grows its branches during training.
          Pre-layer normalisation has a similar effect implicitly: the stream&apos;s norm grows roughly linearly in depth, so each
          normalised branch is a shrinking fraction of it. In the continuum limit, <M>{"\\alpha \\sim 1/L"}</M> gives an ordinary
          differential equation in depth (the neural ODE picture) and <M>{"\\alpha \\sim 1/\\sqrt L"}</M> gives a stochastic one, in which
          the randomness of the blocks still matters. Which of these limits lets hyperparameters transfer across depth is a
          question for m17.4.2.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gain",
      rung: "check",
      prompt: <p>A residual network has 20 blocks with branch scale α = 0.5. By what factor is the expected squared norm multiplied? Give four decimals.</p>,
      answer: { kind: "numeric", value: 86.7362, tolerance: 0.001 },
    },
    {
      key: "spread",
      rung: "check",
      prompt: <p>With L = 50 and α = 1/√50, what is the relative variance of the Jacobian&apos;s squared singular values? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.9416, tolerance: 0.0002 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does a fixed branch scale α make the forward signal grow exponentially in depth?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each block adds a random vector nearly orthogonal to the stream, multiplying its expected squared length by 1 + α²",
          "Each block doubles the stream because the skip and the branch are equal",
          "Random matrices have spectral norm larger than 1, and residual blocks multiply spectral norms",
          "The biases accumulate linearly and then feed back through the nonlinearity",
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

def forward_gain(alpha, L):
    return (1 + alpha ** 2) ** L

def rel_var(alpha, L):
    return L * (2 * alpha ** 2 + alpha ** 4) / (1 + alpha ** 2) ** 2

def alpha_for_gain(g, L):
    return math.sqrt(g ** (1 / L) - 1)

print(forward_gain(1.0, 3), forward_gain(0.5, 2), round(forward_gain(0.1, 100), 4), forward_gain(0.0, 50))
print(round(rel_var(1.0, 4), 4), rel_var(0.0, 9), round(alpha_for_gain(8.0, 3), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8.0 1.5625 2.7048 1.0\n3.0 0.0 1.0",
          "8.0 1.25 2.7048 1.0\n3.0 0.0 1.0",
          "6.0 1.5625 1.1 1.0\n3.0 0.0 1.0",
          "8.0 1.5625 2.7048 1.0\n1.5 0.0 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matvec(A, x):
    return [sum(a * b for a, b in zip(row, x)) for row in A]

def res_forward(h, As, alpha):
    for A in As:
        Ah = matvec(A, h)
        h = [x + alpha * y for x, y in zip(h, Ah)]
    return h

def sq(h):
    return sum(x * x for x in h)

K = [[0, 1], [-1, 0]]; print(res_forward([1, 0], [K], 1.0), sq(res_forward([1, 0], [K] * 4, 1.0)), sq(res_forward([3, 4], [K] * 2, 0.5)))
Z = [[0, 0], [0, 0]]; Nil = [[0, 1], [0, 0]]; print(res_forward([2, 5], [Z] * 3, 1.0), res_forward([0, 1], [Nil] * 3, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, -1.0] 16.0 39.0625\n[2.0, 5.0] [1.5, 1.0]",
          "[1.0, 1.0] 16.0 39.0625\n[2.0, 5.0] [1.5, 1.0]",
          "[1.0, -1.0] 8.0 31.25\n[2.0, 5.0] [1.5, 1.0]",
          "[1.0, -1.0] 16.0 39.0625\n[2.0, 5.0] [0.5, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>forward_gain(alpha, L)</C>, <C>rel_var(alpha, L)</C> for the Jacobian&apos;s relative variance, and{" "}
          <C>alpha_for_gain(g, L)</C>, the branch scale giving forward gain g at depth L.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def forward_gain(alpha, L):
    return 1.0

def rel_var(alpha, L):
    return 0.0

def alpha_for_gain(g, L):
    return 1.0
`,
        solution: GAINS,
        tests: [
          { name: "gain", code: `assert abs(forward_gain(2.0, 2) - 25) < 1e-9 and abs(alpha_for_gain(9.0, 2) - math.sqrt(2)) < 1e-9` },
          { name: "spread", code: `assert abs(rel_var(1.0, 2) - 1.5) < 1e-12 and abs(rel_var(0.5, 4) - 1.44) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matvec(A, x)</C>, <C>res_forward(h, As, alpha)</C> applying <M>{"h \\leftarrow h + \\alpha A h"}</M> for each matrix in turn,
          and <C>sq(h)</C>, the squared length.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matvec(A, x):
    return x

def res_forward(h, As, alpha):
    return h

def sq(h):
    return 0
`,
        solution: FORWARD,
        tests: [
          { name: "forward", code: `assert res_forward([1, 2], [[[1, 0], [0, 2]]] * 2, 0.5) == [2.25, 8.0]` },
          { name: "pieces", code: `assert sq([3, 4]) == 25 and matvec([[1, 2], [3, 4]], [1, 1]) == [3, 7]` },
        ],
      },
    },
    {
      key: "target",
      rung: "stretch",
      prompt: (
        <p>
          A 100-block residual network is to double the expected squared norm of its input, no more. Find the branch scale α
          that does this, then the relative variance of its Jacobian spectrum. Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.377, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the network has been random and frozen. As the width grows with the scales fixed this way, a random network
        becomes a Gaussian process in function space, and that is where the kernel theory of wide networks begins.
      </p>
    </>
  ),
};
