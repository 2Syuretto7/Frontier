import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PrePostNormViz } from "@/components/viz/PrePostNormViz";
import type { LessonContent } from "@/lib/types";

const NORM = `import numpy as np

def rms_norm(x):
    x = np.asarray(x, float)
    return np.sqrt(len(x)) * x / np.linalg.norm(x)

def layer_norm(x):
    x = np.asarray(x, float)
    return rms_norm(x - x.mean())

def rms_jac(x):
    x = np.asarray(x, float)
    n = np.linalg.norm(x)
    u = x / n
    return np.sqrt(len(x)) / n * (np.eye(len(x)) - np.outer(u, u))`;

const STACKS = `import numpy as np

def post_stack(x, fs):
    x = np.asarray(x, float)
    d, weight = len(x), 1.0
    for f in fs:
        y = x + f(x)
        weight *= np.sqrt(d) / np.linalg.norm(y)
        x = np.sqrt(d) * y / np.linalg.norm(y)
    return x, float(weight)

def pre_stack(x, fs):
    x = np.asarray(x, float)
    d, rel = len(x), []
    for f in fs:
        w = f(np.sqrt(d) * x / np.linalg.norm(x))
        rel.append(float(np.linalg.norm(w) / np.linalg.norm(x)))
        x = x + w
    return x, rel

def post_weight_estimate(s, L):
    return (1 + s * s) ** (-L / 2)`;

export const lesson: LessonContent = {
  id: "l5.2.5",
  minutes: 45,
  links: {
    requires: ["l5.2.4"],
    revisits: ["l3.5.2"],
    foreshadows: ["l5.3.1", "l5.3.2"],
  },

  puzzle: (
    <>
      <p>
        The original transformer put its layer normalisation after each residual addition, and it needed a careful learning
        rate warmup to train at all; push it past a dozen or so layers and it often diverged. Moving the very same
        normalisation to the start of each branch, a change of one line, lets models with a hundred layers train with almost
        no warmup. What does the position of a normalisation change?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a post-norm block, <M>{"x \\mapsto \\operatorname{Norm}(x + f(x))"}</M>, every normalisation sits on the skip path
        itself. Each one rescales the sum back to a fixed size, which shrinks the part that came straight from the input, so
        after many layers almost nothing of the identity path is left and gradients to early layers must pass through every
        branch. In a pre-norm block, <M>{"x \\mapsto x + f(\\operatorname{Norm}(x))"}</M>, the skip path is never touched: the
        gradient reaches the embedding unchanged. The price is that the stream is never rescaled, so it grows, and each new
        block&apos;s write becomes a smaller fraction of it.
      </p>
      <PrePostNormViz />
    </>
  ),

  theory: (
    <>
      <Definition title="RMS norm and layer norm">
        <p>
          For <M>{"x \\in \\mathbb R^d"}</M>, <M>{"\\operatorname{RMSNorm}(x) = \\sqrt d\\,x/\\|x\\|"}</M>, which has root mean
          square 1, and <M>{"\\operatorname{LayerNorm}(x) = \\operatorname{RMSNorm}(x - \\bar x\\mathbf 1)"}</M>, which also
          removes the mean. In practice a small ε is added under the square root and the output is multiplied by a learned
          gain vector (and, for layer norm, shifted by a learned bias); we leave these out.
        </p>
        <Code>{NORM}</Code>
      </Definition>

      <Theorem title="the Jacobian of RMS norm">
        <p>
          With <M>{"\\hat x = x/\\|x\\|"}</M>, the Jacobian of RMSNorm at x is{" "}
          <M>{"J = \\frac{\\sqrt d}{\\|x\\|}(I - \\hat x\\hat x^\\top)"}</M>. It sends x to 0, and its spectral norm is{" "}
          <M>{"\\sqrt d/\\|x\\|"}</M> when d ≥ 2.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiate <M>{"\\sqrt d\\,x\\|x\\|^{-1}"}</M> by the product rule:{" "}
          <M>{"\\sqrt d\\,(I\\|x\\|^{-1} - x\\,x^\\top\\|x\\|^{-3})"}</M>, which is the stated form. The matrix{" "}
          <M>{"I - \\hat x\\hat x^\\top"}</M> projects onto the hyperplane orthogonal to x, so it kills x and has eigenvalue 1 on
          the other d − 1 directions. This is the scale invariance from the lesson on normalisation, seen through the
          gradient: a normalisation cannot pass on changes along x, and it divides everything else by the size of its input.
        </p>
      </Proof>

      <Definition title="post-norm and pre-norm blocks">
        <p>
          A <em>post-norm</em> block computes <M>{"x_\\ell = \\operatorname{Norm}(x_{\\ell-1} + f_\\ell(x_{\\ell-1}))"}</M>; a{" "}
          <em>pre-norm</em> block computes <M>{"x_\\ell = x_{\\ell-1} + f_\\ell(\\operatorname{Norm}(x_{\\ell-1}))"}</M>, and a
          pre-norm network applies one final Norm before the unembedding. Below, <C>post_stack</C> tracks the product of the
          post-norm rescalings and <C>pre_stack</C> the size of each write relative to the stream.
        </p>
        <Code>{STACKS}</Code>
      </Definition>

      <Theorem title="where the identity path goes">
        <p>
          Write <M>{"y_\\ell = x_{\\ell-1} + f_\\ell(x_{\\ell-1})"}</M> for the post-norm sum. Along the path that skips every
          branch, the post-norm Jacobian from <M>{"x_0"}</M> to <M>{"x_L"}</M> is a product of the norm Jacobians, of size at
          most <M>{"\\prod_\\ell\\sqrt d/\\|y_\\ell\\|"}</M>. If <M>{"\\|x_{\\ell-1}\\| = \\sqrt d"}</M> and each write is
          orthogonal to the stream with <M>{"\\|f_\\ell\\|^2 = s^2d"}</M>, this is exactly <M>{"(1 + s^2)^{-L/2}"}</M>. For
          pre-norm the same path contributes exactly <M>{"I"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The post-norm block&apos;s Jacobian is <M>{"J_{\\text{Norm}}(y_\\ell)(I + J_{f_\\ell})"}</M>. Expanding the product over
          blocks as in the lesson on residual connections, the term that takes I from every bracket is{" "}
          <M>{"\\prod_\\ell J_{\\text{Norm}}(y_\\ell)"}</M>, and by the previous theorem each factor has norm{" "}
          <M>{"\\sqrt d/\\|y_\\ell\\|"}</M>. Under orthogonality,{" "}
          <M>{"\\|y_\\ell\\|^2 = d + s^2d"}</M>, which gives <M>{"(1+s^2)^{-1/2}"}</M> per block. In pre-norm the block Jacobian
          is <M>{"I + J_{f_\\ell}J_{\\text{Norm}}"}</M>, with no factor on the I.
        </p>
      </Proof>

      <Theorem title="the pre-norm stream grows">
        <p>
          In a pre-norm stack whose writes are orthogonal to the stream,{" "}
          <M>{"\\|x_L\\|^2 = \\|x_0\\|^2 + \\sum_\\ell\\|w_\\ell\\|^2"}</M>. If <M>{"\\|x_0\\|^2 = d"}</M> and every write has{" "}
          <M>{"\\|w_\\ell\\|^2 = s^2d"}</M>, block ℓ&apos;s write is a fraction{" "}
          <M>{"s/\\sqrt{1 + (\\ell-1)s^2}"}</M> of the stream it joins.
        </p>
      </Theorem>
      <Proof>
        <p>
          Pythagoras gives <M>{"\\|x_{\\ell-1} + w_\\ell\\|^2 = \\|x_{\\ell-1}\\|^2 + \\|w_\\ell\\|^2"}</M>; sum over ℓ. Before block
          ℓ the stream has squared norm <M>{"d(1 + (\\ell-1)s^2)"}</M>, so the ratio is as stated. Each block sees a normalised
          input, so its write does not grow with the stream, and later blocks move it by smaller angles, roughly{" "}
          <M>{"1/\\sqrt\\ell"}</M>. The final Norm is needed to bring the grown stream back to a fixed scale for the
          unembedding.
        </p>
      </Proof>

      <Remark title="consequences for training">
        <p>
          In post-norm, the vanishing identity path means gradients to the lower layers depend on every branch being well
          conditioned, and the size of updates to the last layers is large compared with the first; early in training with
          a large learning rate this tends to diverge, and warmup keeps the first steps small while the branches settle.
          Pre-norm trains stably without much warmup but leaves deep layers with little relative influence, which is why
          variants rescale the residual branches (for example by <M>{"1/\\sqrt{2L}"}</M> at initialisation) or add extra
          normalisations. Almost every large decoder today uses pre-norm with RMSNorm.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "jacnorm",
      rung: "check",
      prompt: <p>A vector of dimension d = 256 has Euclidean norm 32. What is the spectral norm of the RMS norm&apos;s Jacobian at it?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 1e-9 },
    },
    {
      key: "fade",
      rung: "check",
      prompt: <p>Under the orthogonal-write model with s = 0.5, how large is the post-norm identity-path factor after 24 blocks? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0687, tolerance: 0.00006 },
    },
    {
      key: "finalnorm",
      rung: "apply",
      prompt: <p>Why does a pre-norm transformer apply one more normalisation just before the unembedding?</p>,
      answer: {
        kind: "choice",
        options: [
          "The stream is never rescaled inside the blocks, so its size grows with depth and must be brought back to a fixed scale before producing logits",
          "Without it the gradient would not reach the embedding",
          "The last block's MLP has no activation function",
          "It makes the attention weights sum to one",
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

def rms_norm(x):
    x = np.asarray(x, float)
    return np.sqrt(len(x)) * x / np.linalg.norm(x)

def layer_norm(x):
    x = np.asarray(x, float)
    return rms_norm(x - x.mean())

def rms_jac(x):
    x = np.asarray(x, float)
    n = np.linalg.norm(x)
    u = x / n
    return np.sqrt(len(x)) / n * (np.eye(len(x)) - np.outer(u, u))

print(rms_norm([3.0, 4.0]).round(4).tolist(), layer_norm([1.0, 3.0]).tolist(), bool(np.allclose(rms_jac([3.0, 4.0]) @ [3.0, 4.0], 0)))
print(round(float(np.linalg.norm(rms_jac([3.0, 4.0]), 2)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.8485, 1.1314] [-1.0, 1.0] True\n0.2828",
          "[0.6, 0.8] [-1.0, 1.0] True\n0.2",
          "[0.8485, 1.1314] [1.0, 3.0] True\n0.2828",
          "[0.8485, 1.1314] [-1.0, 1.0] False\n1.4142",
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

def post_stack(x, fs):
    x = np.asarray(x, float)
    d, weight = len(x), 1.0
    for f in fs:
        y = x + f(x)
        weight *= np.sqrt(d) / np.linalg.norm(y)
        x = np.sqrt(d) * y / np.linalg.norm(y)
    return x, float(weight)

def pre_stack(x, fs):
    x = np.asarray(x, float)
    d, rel = len(x), []
    for f in fs:
        w = f(np.sqrt(d) * x / np.linalg.norm(x))
        rel.append(float(np.linalg.norm(w) / np.linalg.norm(x)))
        x = x + w
    return x, rel

def post_weight_estimate(s, L):
    return (1 + s * s) ** (-L / 2)

R = np.array([[0.0, -1.0], [1.0, 0.0]]); fs = [lambda v: 0.5 * R @ v] * 2
print(np.round(post_stack([1.0, 1.0], fs)[1], 4), [round(r, 4) for r in pre_stack([1.0, 1.0], fs)[1]], round(post_weight_estimate(0.5, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.8 [0.5, 0.4472] 0.8",
          "0.8 [0.5, 0.5] 0.8",
          "1.0 [0.5, 0.4472] 0.8",
          "0.64 [0.5, 0.4] 0.64",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a 1-D array x, write <C>rms_norm(x)</C>, returning <C>sqrt(d) * x / ‖x‖</C>; <C>layer_norm(x)</C>, which first
          subtracts the mean; and <C>rms_jac(x)</C>, the d × d Jacobian of rms_norm at x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rms_norm(x):
    return np.asarray(x, float)

def layer_norm(x):
    return np.asarray(x, float)

def rms_jac(x):
    return np.eye(len(x))
`,
        solution: NORM,
        tests: [
          { name: "norms", code: `assert np.allclose(rms_norm([1.0, 2.0, 2.0]), [3 ** -0.5, 2 * 3 ** -0.5, 2 * 3 ** -0.5])
y = layer_norm([2.0, 5.0, 11.0]); assert abs(y.mean()) < 1e-12 and abs(np.sqrt((y ** 2).mean()) - 1) < 1e-12
rng = np.random.default_rng(3); x = rng.standard_normal(7); assert np.allclose(rms_norm(5 * x), rms_norm(x)) and np.allclose(layer_norm(x + 4), layer_norm(x))` },
          { name: "jacobian", code: `rng = np.random.default_rng(4); x = rng.standard_normal(5); J = rms_jac(x); num = np.zeros((5, 5))
for j in range(5):
    e = np.zeros(5); e[j] = 1e-6; num[:, j] = (rms_norm(x + e) - rms_norm(x - e)) / 2e-6
assert np.allclose(J, num, atol=1e-6) and np.allclose(J @ x, 0) and abs(np.linalg.norm(J, 2) - np.sqrt(5) / np.linalg.norm(x)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using RMS norm without gain, write <C>post_stack(x, fs)</C>, returning the final stream and the product of the
          factors <C>sqrt(d) / ‖y‖</C> as a float; <C>pre_stack(x, fs)</C>, returning the final stream and the list of{" "}
          <C>‖w‖ / ‖x‖</C> for each block&apos;s write w and the stream x it is added to; and{" "}
          <C>post_weight_estimate(s, L)</C>, the value <M>{"(1 + s^2)^{-L/2}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def post_stack(x, fs):
    for f in fs:
        x = x + f(x)
    return x, 1.0

def pre_stack(x, fs):
    for f in fs:
        x = x + f(x)
    return x, []

def post_weight_estimate(s, L):
    return 1.0
`,
        solution: STACKS,
        tests: [
          { name: "rotation", code: `R = np.array([[0.0, -1.0], [1.0, 0.0]]); fs = [lambda v: 0.5 * R @ v] * 2
x, w = post_stack([1.0, 1.0], fs); assert np.allclose(x, [-0.2, 1.4]) and abs(w - 0.8) < 1e-12 and isinstance(w, float)
x, rel = pre_stack([1.0, 1.0], fs); assert np.allclose(x, [-0.17082039, 1.7236068]) and np.allclose(rel, [0.5, 0.5 / np.sqrt(1.25)])
assert abs(post_weight_estimate(0.5, 2) - 0.8) < 1e-12 and abs(post_weight_estimate(1.0, 4) - 0.25) < 1e-12` },
          { name: "random", code: `rng = np.random.default_rng(5); Ws = [rng.standard_normal((6, 6)) * 0.3 for _ in range(5)]; fs = [lambda v, W=W: np.tanh(W @ v) for W in Ws]
x0 = rng.standard_normal(6); x, w = post_stack(x0, fs); assert abs(np.linalg.norm(x) - np.sqrt(6)) < 1e-9
v, p = x0.copy(), 1.0
for f in fs:
    y = v + f(v); p *= np.sqrt(6) / np.linalg.norm(y); v = np.sqrt(6) * y / np.linalg.norm(y)
assert np.allclose(x, v) and abs(w - p) < 1e-12
x, rel = pre_stack(x0, fs); v = x0.copy(); r = []
for f in fs:
    d = f(np.sqrt(6) * v / np.linalg.norm(v)); r.append(np.linalg.norm(d) / np.linalg.norm(v)); v = v + d
assert np.allclose(x, v) and np.allclose(rel, r) and len(rel) == 5` },
        ],
      },
    },
    {
      key: "late",
      rung: "stretch",
      prompt: <p>In the pre-norm growth theorem with s = 0.5, what fraction of the stream is the write of block 49? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.139, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        We now have every part of a transformer block. Next we put them together, embedding, a stack of pre-norm blocks, a
        final norm and the unembedding, into a complete GPT.
      </p>
    </>
  ),
};
