import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InContextGdViz } from "@/components/viz/InContextGdViz";
import type { LessonContent } from "@/lib/types";

const ONESTEP = `def one_step_pred(xs, ys, xq, eta):
    N = len(xs)
    w = [eta / N * sum(y * x[j] for x, y in zip(xs, ys)) for j in range(len(xq))]
    return sum(a * b for a, b in zip(w, xq))

def optimal_eta(d, N):
    return N / (N + d + 1)

def one_step_error(d, N):
    return d * (d + 1) / (N + d + 1)`;

const ATTN = `def matvec(W, z):
    return [sum(w * v for w, v in zip(row, z)) for row in W]

def lin_attention(Z, zq, WK, WQ, WV):
    q = matvec(WQ, zq)
    out = [0.0] * len(zq)
    for z in Z:
        score = sum(a * b for a, b in zip(matvec(WK, z), q))
        out = [o + score * v / len(Z) for o, v in zip(out, matvec(WV, z))]
    return out

def tokens(xs, ys):
    return [list(x) + [y] for x, y in zip(xs, ys)]`;

export const lesson: LessonContent = {
  id: "m17.6.3",
  minutes: 55,
  links: {
    requires: ["m17.6.2", "l4.4.3"],
    revisits: ["l5.2.2", "m17.4.3"],
    foreshadows: ["m17.6.4"],
  },

  puzzle: (
    <>
      <p>
        Show a large language model a few input-output pairs of a pattern it has never seen, and it continues the pattern
        for a new input. No weight changes: the learning happens inside a single forward pass. A transformer is a fixed
        function of its prompt, so in what sense can it be learning, and what algorithm could a stack of attention layers be
        running on the examples?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Attention lets the query token take a weighted sum over the context tokens, with weights given by similarities to
        the query. If each context token carries an example (x, y), then a sum of y times the similarity of x to the query
        is exactly the prediction of a linear model after one gradient step on those examples. A layer of attention can
        therefore be a step of learning, and a stack of layers a short learning algorithm.
      </p>
      <InContextGdViz />
    </>
  ),

  theory: (
    <>
      <Definition title="in-context regression">
        <p>
          A prompt holds N examples <M>{"z_i = (x_i, y_i)"}</M> with <M>{"y_i = w_*\\cdot x_i"}</M>, where a fresh task <M>{"w_* \\sim N(0, I_d)"}</M> is
          drawn for each prompt and <M>{"x_i \\sim N(0, I_d)"}</M>, followed by a query token <M>{"z_q = (x_q, 0)"}</M>. The model must output{" "}
          <M>{"w_*\\cdot x_q"}</M>. A linear self-attention layer maps the query to
        </p>
        <MD>{"\\mathrm{LSA}(z_q) = \\frac1N \\sum_{i=1}^N (W_V z_i)\\,\\big((W_K z_i)\\cdot(W_Q z_q)\\big)"}</MD>
        <p>
          (<C>matvec</C>, <C>lin_attention</C>, <C>tokens</C>), softmax attention without the softmax.
        </p>
        <Code>{ATTN}</Code>
      </Definition>

      <Theorem title="attention can take a gradient step (von Oswald and colleagues)">
        <p>
          With <M>{"W_K = W_Q = \\begin{pmatrix} I_d & 0 \\\\ 0 & 0\\end{pmatrix}"}</M> and{" "}
          <M>{"W_V = \\begin{pmatrix} 0 & 0 \\\\ 0 & \\eta\\end{pmatrix}"}</M>, the last coordinate of <M>{"\\mathrm{LSA}(z_q)"}</M> equals{" "}
          <M>{"w_1\\cdot x_q"}</M>, where <M>{"w_1"}</M> is one gradient descent step with step size η from <M>{"w = 0"}</M> on{" "}
          <M>{"\\frac{1}{2N}\\sum_i (y_i - w\\cdot x_i)^2"}</M> (<C>one_step_pred</C>).
        </p>
        <Code>{ONESTEP}</Code>
      </Theorem>
      <Proof>
        <p>
          The key and query pick out the x parts, so the score is <M>{"x_i \\cdot x_q"}</M>; the value picks out <M>{"\\eta y_i"}</M>. The last
          coordinate is <M>{"\\frac{\\eta}{N}\\sum_i y_i\\, x_i\\cdot x_q"}</M>. The gradient of the loss at w = 0 is{" "}
          <M>{"-\\frac1N \\sum_i y_i x_i"}</M>, so <M>{"w_1 = \\frac{\\eta}{N}\\sum_i y_i x_i"}</M> and <M>{"w_1 \\cdot x_q"}</M> is the same number. With
          residual connections, a second layer sees the updated predictions and can take a second step, and so on.
        </p>
      </Proof>

      <Theorem title="the best single step">
        <p>
          Over random tasks, <M>{"\\mathbb E\\|w_1 - w_*\\|^2"}</M> is minimised by <M>{"\\eta^* = N/(N + d + 1)"}</M> (<C>optimal_eta</C>), with minimum{" "}
          <M>{"d(d+1)/(N + d + 1)"}</M> (<C>one_step_error</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Here <M>{"w_1 = \\eta\\hat\\Sigma w_*"}</M> with <M>{"\\hat\\Sigma = \\frac1N\\sum_i x_i x_i^\\top"}</M>, so{" "}
          <M>{"\\mathbb E\\|w_1 - w_*\\|^2 = \\mathbb E \\operatorname{tr}\\big((\\eta\\hat\\Sigma - I)^2\\big) = \\eta^2\\, \\mathbb E\\operatorname{tr}\\hat\\Sigma^2 - 2\\eta d + d"}</M>,
          using <M>{"\\mathbb E w_* w_*^\\top = I"}</M> and <M>{"\\mathbb E\\hat\\Sigma = I"}</M>. Expanding <M>{"\\hat\\Sigma^2"}</M> into pairs, the N(N − 1) pairs{" "}
          <M>{"i \\ne j"}</M> each contribute <M>{"\\mathbb E[x_ix_i^\\top]\\mathbb E[x_jx_j^\\top] = I"}</M> and the N diagonal ones{" "}
          <M>{"\\mathbb E[\\|x\\|^2 xx^\\top] = (d + 2)I"}</M>, so <M>{"\\mathbb E\\hat\\Sigma^2 = \\frac{N + d + 1}{N} I"}</M>. Minimising the quadratic{" "}
          <M>{"\\eta^2 \\frac{d(N + d + 1)}{N} - 2\\eta d + d"}</M> gives the stated η* and minimum.
        </p>
      </Proof>

      <Example title="reading the viz">
        <p>
          One step leaves an error that falls only like 1/N, about 1.08 at N = 20 in 5 dimensions, while least squares is
          exact from N = 5 on. Stacking layers, each a further step, closes the gap: eight steps reach about 0.08. Trained
          transformers on this task get close to least squares, so they must be doing more than one plain step per layer, for
          example preconditioned or higher-order updates.
        </p>
      </Example>

      <Remark title="what is known about trained models">
        <p>
          For a single linear attention layer trained on random linear regression tasks, Zhang, Frei and Bartlett and Ahn and
          colleagues proved that gradient flow converges to a solution implementing one step of preconditioned gradient
          descent, the construction above with a learned matrix in place of η. Beyond regression, several pictures coexist.
          The Bayesian view treats the prompt as evidence about a latent task, with the model computing a posterior
          predictive; with little task diversity in pretraining, transformers behave like that Bayesian predictor over the
          training tasks, and with enough diversity they switch to a general algorithm such as ridge regression. In language
          models, induction heads, attention circuits that find an earlier occurrence of the current token and copy what
          followed it, form abruptly during training and account for much in-context copying. Grokking and these abrupt
          formations share the saddle-to-saddle mechanism of m17.6.1.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "err",
      rung: "check",
      prompt: <p>For d = 10 and N = 40 in-context examples, what is the error of the best single gradient step? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.1569, tolerance: 0.0002 },
    },
    {
      key: "eta",
      rung: "check",
      prompt: <p>What is the optimal step size for d = 10 and N = 40? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.7843, tolerance: 0.0002 },
    },
    {
      key: "layers",
      rung: "apply",
      prompt: <p>Why can stacking attention layers with residual connections improve in-context regression?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each layer can take a further gradient step using the predictions written into the residual stream by the layers before",
          "More layers memorise more training tasks",
          "Deeper networks have more parameters, so they fit each prompt exactly",
          "Residual connections remove the need for attention",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def one_step_pred(xs, ys, xq, eta):
    N = len(xs)
    w = [eta / N * sum(y * x[j] for x, y in zip(xs, ys)) for j in range(len(xq))]
    return sum(a * b for a, b in zip(w, xq))

def optimal_eta(d, N):
    return N / (N + d + 1)

def one_step_error(d, N):
    return d * (d + 1) / (N + d + 1)

print(one_step_pred([[1.0], [2.0]], [2.0, 4.0], [3.0], 1.0), optimal_eta(1, 2), one_step_error(1, 2))
print(round(optimal_eta(5, 20), 4), round(one_step_error(5, 20), 4), one_step_pred([[1.0, 0.0], [0.0, 1.0]], [3.0, -1.0], [2.0, 2.0], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "15.0 0.5 0.5\n0.7692 1.1538 1.0",
          "30.0 0.5 0.5\n0.7692 1.1538 1.0",
          "15.0 0.6667 0.5\n0.7692 1.1538 2.0",
          "15.0 0.5 1.0\n0.8 1.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matvec(W, z):
    return [sum(w * v for w, v in zip(row, z)) for row in W]

def lin_attention(Z, zq, WK, WQ, WV):
    q = matvec(WQ, zq)
    out = [0.0] * len(zq)
    for z in Z:
        score = sum(a * b for a, b in zip(matvec(WK, z), q))
        out = [o + score * v / len(Z) for o, v in zip(out, matvec(WV, z))]
    return out

def tokens(xs, ys):
    return [list(x) + [y] for x, y in zip(xs, ys)]

Z = tokens([[1.0], [2.0]], [2.0, 4.0]); print(Z, matvec([[0, 0], [0, 1]], [5, 7]))
P = [[1, 0], [0, 0]]; V = [[0, 0], [0, 1]]; print(lin_attention(Z, [3.0, 0.0], P, P, V), lin_attention(Z, [3.0, 0.0], P, P, [[0, 0], [0, 0.5]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 2.0], [2.0, 4.0]] [0, 7]\n[0.0, 15.0] [0.0, 7.5]",
          "[[1.0, 2.0], [2.0, 4.0]] [0, 7]\n[0.0, 30.0] [0.0, 15.0]",
          "[[1.0, 2.0], [2.0, 4.0]] [5, 7]\n[0.0, 15.0] [0.0, 7.5]",
          "[[1.0, 1.0], [2.0, 2.0]] [0, 7]\n[15.0, 0.0] [7.5, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>one_step_pred(xs, ys, xq, eta)</C>, the prediction at xq after one gradient step from zero on the mean squared
          loss with factor ½; <C>optimal_eta(d, N)</C>; and <C>one_step_error(d, N)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def one_step_pred(xs, ys, xq, eta):
    return 0.0

def optimal_eta(d, N):
    return 1.0

def one_step_error(d, N):
    return d
`,
        solution: ONESTEP,
        tests: [
          { name: "predict", code: `assert abs(one_step_pred([[1.0, 2.0], [0.0, -1.0]], [1.0, 2.0], [1.0, 1.0], 0.5) - 0.25) < 1e-12` },
          { name: "optimum", code: `assert abs(optimal_eta(3, 12) - 0.75) < 1e-12 and abs(one_step_error(3, 12) - 0.75) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matvec(W, z)</C>, <C>lin_attention(Z, zq, WK, WQ, WV)</C> averaging value vectors weighted by key-query dot
          products, and <C>tokens(xs, ys)</C> appending each y to its x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matvec(W, z):
    return z

def lin_attention(Z, zq, WK, WQ, WV):
    return [0.0] * len(zq)

def tokens(xs, ys):
    return xs
`,
        solution: ATTN,
        tests: [
          { name: "tokens", code: `assert tokens([[1, 2], [3, 4]], [5, 6]) == [[1, 2, 5], [3, 4, 6]] and matvec([[1, 2], [0, 1]], [3, 4]) == [11, 4]` },
          { name: "attention", code: `I = [[1, 0], [0, 1]]\nassert lin_attention([[1.0, 0.0], [0.0, 2.0]], [1.0, 1.0], I, I, I) == [0.5, 2.0]` },
        ],
      },
    },
    {
      key: "noise",
      rung: "stretch",
      prompt: (
        <p>
          Add label noise: <M>{"y_i = w_*\\cdot x_i + \\varepsilon_i"}</M> with <M>{"\\varepsilon_i \\sim N(0, \\sigma^2)"}</M>. Redo the optimisation of the
          single step and find the minimum of <M>{"\\mathbb E\\|w_1 - w_*\\|^2"}</M> for d = 5, N = 20 and σ² = 0.5. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.2264, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Which solution gradient descent finds, among the many that fit, has come up repeatedly: low rank in the saddle
        dynamics, low norm in grokking. The last lesson collects what is known about these implicit biases in deep networks.
      </p>
    </>
  ),
};
