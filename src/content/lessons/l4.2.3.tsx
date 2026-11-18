import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DenoiseFieldViz } from "@/components/viz/DenoiseFieldViz";
import type { LessonContent } from "@/lib/types";

const LAE = `import numpy as np

def train_linear_ae(X, k, steps, lr=0.01, seed=0):
    rng = np.random.default_rng(seed); n, d = X.shape
    E, D = 0.1 * rng.normal(size=(d, k)), 0.1 * rng.normal(size=(k, d))
    for _ in range(steps):
        Z = X @ E; err = Z @ D - X
        gD = Z.T @ err / n; gE = X.T @ (err @ D.T) / n
        E, D = E - lr * gE, D - lr * gD
    return E, D

def recon_error(X, E, D):
    return float(np.mean(np.sum((X @ E @ D - X) ** 2, axis=1)))

def pca_error(X, k):
    ev = np.sort(np.linalg.eigvalsh(X.T @ X / len(X)))[::-1]
    return float(ev[k:].sum())`;

const DAE = `import numpy as np

def fit_denoiser(rng, s, sigma, n):
    x = rng.normal(0, s, size=n); y = x + rng.normal(0, sigma, size=n)
    return float((x @ y) / (y @ y))

def tweedie_gain(s, sigma):
    return s ** 2 / (s ** 2 + sigma ** 2)`;

export const lesson: LessonContent = {
  id: "l4.2.3",
  minutes: 55,
  links: {
    requires: ["l4.2.1", "l2.6.1"],
    revisits: ["m3.8.3", "l2.5.3"],
    foreshadows: ["l11.4.1", "l4.2.4"],
  },

  puzzle: (
    <>
      <p>
        Ask a network to output exactly its input. Trivial, unless the signal must pass through a narrow middle layer, in
        which case the network must decide what to keep. Train a linear one and it rediscovers principal components analysis.
        Corrupt the input with noise and ask for the clean version, and something stranger happens: the network learns which
        direction is uphill in the data&apos;s probability density, without ever being shown a density. Why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An autoencoder is an encoder that compresses x to a code z and a decoder that reconstructs x from z. The bottleneck
        forces the code to keep what matters most for reconstruction. With linear maps and squared error, &quot;what matters
        most&quot; is the directions of greatest variance. Denoising changes the question: given a noisy point, where did it
        most likely come from? Answering that well everywhere is the same as knowing which way the data density increases,
        which is why denoisers became the engine of diffusion models.
      </p>
      <DenoiseFieldViz />
    </>
  ),

  theory: (
    <>
      <Definition title="autoencoder">
        <p>
          An encoder <M>{"f: \\mathbb R^d \\to \\mathbb R^k"}</M> and decoder <M>{"g: \\mathbb R^k \\to \\mathbb R^d"}</M>, usually
          with k &lt; d, are trained to minimise <M>{"\\mathbb E\\lVert g(f(x)) - x\\rVert^2"}</M>. A denoising autoencoder instead
          minimises <M>{"\\mathbb E\\lVert g(f(\\tilde x)) - x\\rVert^2"}</M>, where <M>{"\\tilde x"}</M> is a corrupted copy of x.
        </p>
      </Definition>

      <Theorem title="linear autoencoders find the principal subspace">
        <p>
          For centred data with covariance eigenvalues <M>{"\\lambda_1 \\ge \\dots \\ge \\lambda_d"}</M> and linear maps{" "}
          <M>{"f(x) = E^\\top x"}</M>, <M>{"g(z) = D^\\top z"}</M>, the smallest mean reconstruction error is{" "}
          <M>{"\\sum_{i>k}\\lambda_i"}</M>, attained exactly when the composite map is the orthogonal projection onto the span
          of the top k principal directions.
        </p>
      </Theorem>
      <Proof>
        <p>
          The reconstructions of the whole data matrix are XED, a matrix of rank at most k. By the Eckart-Young theorem from
          the SVD lesson, the closest rank-k matrix to X in Frobenius norm is its truncated SVD, the projection of every row
          onto the top k right singular vectors, with squared error the sum of the discarded squared singular values, which
          divided by n are the discarded eigenvalues. Choosing E with those vectors as columns and D its transpose attains it.
          The encoder is not unique, since EA and <M>{"A^{-1}D"}</M> give the same composite for any invertible A, so a linear
          autoencoder learns the principal subspace but not the principal axes. Gradient descent from a small random start
          finds it, as the code shows.
        </p>
        <Code>{LAE}</Code>
      </Proof>

      <Theorem title="denoisers estimate the score (Tweedie's formula)">
        <p>
          If <M>{"\\tilde x = x + \\sigma\\varepsilon"}</M> with standard normal ε and <M>{"p_\\sigma"}</M> is the density of{" "}
          <M>{"\\tilde x"}</M>, the least-squares denoiser is
        </p>
        <MD>{"r^*(y) = \\mathbb E[x \\mid \\tilde x = y] = y + \\sigma^2\\nabla\\log p_\\sigma(y)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The minimiser of squared error is the conditional mean. Write{" "}
          <M>{"p_\\sigma(y) = \\int p(x)\\varphi_\\sigma(y - x)\\,dx"}</M> with <M>{"\\varphi_\\sigma"}</M> the Gaussian density, whose
          gradient is <M>{"\\nabla\\varphi_\\sigma(u) = -u\\varphi_\\sigma(u)/\\sigma^2"}</M>. Then{" "}
          <M>{"\\sigma^2\\nabla p_\\sigma(y) = \\int p(x)\\varphi_\\sigma(y - x)(x - y)\\,dx"}</M>, and dividing by{" "}
          <M>{"p_\\sigma(y)"}</M> gives <M>{"\\mathbb E[x \\mid y] - y"}</M>. For Gaussian data <M>{"x \\sim N(0, s^2)"}</M>, the
          noisy density is <M>{"N(0, s^2 + \\sigma^2)"}</M> and the denoiser shrinks by the factor{" "}
          <M>{"s^2/(s^2 + \\sigma^2)"}</M>, which least squares on simulated pairs recovers.
        </p>
        <Code>{DAE}</Code>
      </Proof>

      <Example title="what the bottleneck must not allow">
        <p>
          A nonlinear autoencoder with enough capacity can map each training example to a distinct code and back, even
          through a one-dimensional bottleneck, without learning anything that generalises. Useful autoencoders therefore
          constrain the code: a narrow layer, a sparsity penalty on z, noise on the input, or, in the variational autoencoder,
          a KL penalty pulling the code distribution towards a prior, which is the evidence lower bound from the latent-variable
          lessons.
        </p>
      </Example>

      <Remark title="uses">
        <p>
          Reconstruction error flags anomalies, since unusual inputs reconstruct badly. Sparse autoencoders trained on a
          language model&apos;s activations decompose them into interpretable features, a central tool of the interpretability
          course. And a family of denoisers at many noise levels, by Tweedie&apos;s formula, supplies the score function that
          reverse diffusion follows to generate images from noise.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "err",
      rung: "check",
      prompt: <p>Data have covariance eigenvalues 5, 2, 1 and 0.5. What is the smallest mean squared reconstruction error of a linear autoencoder with a 2-dimensional code?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "gain",
      rung: "check",
      prompt: <p>Clean data are N(0, 1) and the noise has σ = 0.5. By what factor does the optimal denoiser shrink a noisy observation?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "axes",
      rung: "apply",
      prompt: <p>A linear autoencoder with a k-dimensional code reaches the minimum reconstruction error. What can you conclude about its encoder?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its columns span the top-k principal subspace, but they need not be the principal axes or orthonormal",
          "Its columns are exactly the top k principal axes, in order",
          "It is the identity matrix",
          "Nothing, since gradient descent finds arbitrary local minima",
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

def train_linear_ae(X, k, steps, lr=0.01, seed=0):
    rng = np.random.default_rng(seed); n, d = X.shape
    E, D = 0.1 * rng.normal(size=(d, k)), 0.1 * rng.normal(size=(k, d))
    for _ in range(steps):
        Z = X @ E; err = Z @ D - X
        gD = Z.T @ err / n; gE = X.T @ (err @ D.T) / n
        E, D = E - lr * gE, D - lr * gD
    return E, D

def recon_error(X, E, D):
    return float(np.mean(np.sum((X @ E @ D - X) ** 2, axis=1)))

def pca_error(X, k):
    ev = np.sort(np.linalg.eigvalsh(X.T @ X / len(X)))[::-1]
    return float(ev[k:].sum())

rng = np.random.default_rng(0); X = rng.normal(size=(2000, 3)) * np.array([3.0, 1.0, 0.2]); X -= X.mean(0); E, D = train_linear_ae(X, 1, 3000, 0.02)
print(abs(recon_error(X, E, D) - pca_error(X, 1)) < 1e-3, round(pca_error(X, 1), 1), np.round(np.sort(np.linalg.eigvals(E @ D).real), 2).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True 1.0 [0.0, 0.0, 1.0]",
          "True 9.0 [0.0, 0.0, 1.0]",
          "True 1.0 [0.0, 1.0, 1.0]",
          "False 1.0 [0.0, 0.0, 1.0]",
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

def fit_denoiser(rng, s, sigma, n):
    x = rng.normal(0, s, size=n); y = x + rng.normal(0, sigma, size=n)
    return float((x @ y) / (y @ y))

def tweedie_gain(s, sigma):
    return s ** 2 / (s ** 2 + sigma ** 2)

print(tweedie_gain(2.0, 1.0), tweedie_gain(1.0, 1.0), abs(fit_denoiser(np.random.default_rng(1), 2.0, 1.0, 100000) - 0.8) < 0.01)
s, sigma, y = 2.0, 1.0, 3.0; score = -y / (s ** 2 + sigma ** 2); print(round(tweedie_gain(s, sigma) * y - y, 6), round(sigma ** 2 * score, 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.8 0.5 True\n-0.6 -0.6", "0.8 0.5 True\n-0.6 -0.2", "0.667 0.5 True\n-0.6 -0.6", "0.8 0.5 False\n2.4 -0.6"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_linear_ae(X, k, steps, lr, seed)</C>, training encoder E (d × k) and decoder D (k × d) by full-batch
          gradient descent on half the mean squared reconstruction error; <C>recon_error(X, E, D)</C>; and{" "}
          <C>pca_error(X, k)</C>, the sum of the discarded covariance eigenvalues.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def train_linear_ae(X, k, steps, lr=0.01, seed=0):
    d = X.shape[1]
    return np.zeros((d, k)), np.zeros((k, d))

def recon_error(X, E, D):
    return 0.0

def pca_error(X, k):
    return 0.0
`,
        solution: LAE,
        tests: [
          { name: "pca", code: `X = np.array([[2.0, 0.0], [-2.0, 0.0], [0.0, 1.0], [0.0, -1.0]]); assert abs(pca_error(X, 1) - 0.5) < 1e-12 and abs(pca_error(X, 0) - 2.5) < 1e-12 and abs(recon_error(X, np.zeros((2, 1)), np.zeros((1, 2))) - 2.5) < 1e-12` },
          { name: "train", code: `rng = np.random.default_rng(3); X = rng.normal(size=(1500, 4)) * np.array([2.5, 1.5, 0.4, 0.3]); X -= X.mean(0); E, D = train_linear_ae(X, 2, 3000, 0.02)
assert E.shape == (4, 2) and D.shape == (2, 4) and abs(recon_error(X, E, D) - pca_error(X, 2)) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_denoiser(rng, s, sigma, n)</C>, which simulates n clean values from N(0, s²) and their noisy copies and
          returns the least-squares coefficient for predicting the clean value from the noisy one, and{" "}
          <C>tweedie_gain(s, sigma)</C>, its theoretical value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_denoiser(rng, s, sigma, n):
    return 1.0

def tweedie_gain(s, sigma):
    return 1.0
`,
        solution: DAE,
        tests: [
          { name: "gain", code: `assert abs(tweedie_gain(3.0, 4.0) - 0.36) < 1e-12 and abs(tweedie_gain(1.0, 0.0) - 1.0) < 1e-12` },
          { name: "fit", code: `assert abs(fit_denoiser(np.random.default_rng(2), 1.0, 2.0, 200000) - 0.2) < 0.01 and abs(fit_denoiser(np.random.default_rng(3), 3.0, 1.0, 200000) - 0.9) < 0.01` },
        ],
      },
    },
    {
      key: "tw",
      rung: "stretch",
      prompt: <p>Clean data are N(0, 4) and the noise has σ = 1. You observe 3. What is the posterior mean of the clean value?</p>,
      answer: { kind: "numeric", value: 2.4, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Autoencoders learn by reconstructing. The last lesson of this section learns representations by comparing instead:
        pull together two views of the same thing, push apart views of different things.
      </p>
    </>
  ),
};
