import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OutlierFitViz } from "@/components/viz/OutlierFitViz";
import type { LessonContent } from "@/lib/types";

const LOSSES = `import numpy as np

def huber(r, delta):
    a = np.abs(r)
    return np.where(a <= delta, 0.5 * r ** 2, delta * (a - 0.5 * delta))

def huber_grad(r, delta):
    return np.clip(r, -delta, delta)

def fit_constant(y, grad, lr, steps):
    c = 0.0
    for _ in range(steps):
        c -= lr * float(np.mean(grad(c - y)))
    return c
`;

const GAUSS = `def gaussian_nll(y, mu, sigma):
    return float(np.mean(0.5 * np.log(2 * np.pi * sigma ** 2) + (y - mu) ** 2 / (2 * sigma ** 2)))

def fit_linear_mse(X, y):
    Xb = np.hstack([X, np.ones((len(X), 1))])
    return np.linalg.lstsq(Xb, y, rcond=None)[0]
`;

export const lesson: LessonContent = {
  id: "l3.3.1",
  minutes: 45,
  links: {
    requires: ["l3.2.4", "l1.3.1"],
    revisits: ["l0.1.2", "m3.5.3"],
    foreshadows: ["l3.3.2", "l2.1.4"],
  },

  puzzle: (
    <>
      <p>
        A network predicts house prices. Squared error charges 100 for a miss of 10, and 10 000 for a miss of 100. Absolute
        error charges 10 and 100. Which is right? The answer depends on what you want the prediction to be: an average, a
        middle value, or something robust to the odd wildly wrong label.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fit the simplest model, a constant, and the losses reveal what they ask for. Squared error is minimised by the mean,
        absolute error by the median. Because squared error grows quadratically, a single far-off point drags the fit towards
        it; Huber loss is quadratic for small residuals and linear for large ones, a compromise.
      </p>
      <OutlierFitViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="what squared error estimates">
        <p>
          The constant c minimising <M>{"\\sum_i (y_i - c)^2"}</M> is the mean <M>{"\\bar y"}</M>. More generally, the
          function f minimising the expected squared error <M>{"\\mathbb{E}[(Y - f(X))^2]"}</M> is the conditional mean{" "}
          <M>{"f(x) = \\mathbb{E}[Y \\mid X = x]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\sum_i (y_i - c)^2 = \\sum_i (y_i - \\bar y)^2 + n(\\bar y - c)^2"}</M>, since the cross term{" "}
          <M>{"2(\\bar y - c)\\sum_i (y_i - \\bar y)"}</M> vanishes. The first sum does not depend on c and the second is 0
          exactly when <M>{"c = \\bar y"}</M>. The same decomposition, applied for each x with the conditional distribution of
          Y, gives the conditional mean.
        </p>
      </Proof>

      <Definition title="squared error is Gaussian likelihood">
        <p>
          If <M>{"y = f(x) + \\varepsilon"}</M> with <M>{"\\varepsilon \\sim \\mathcal{N}(0, \\sigma^2)"}</M>, the negative
          log-likelihood of the data is{" "}
          <M>{"\\tfrac{n}{2}\\log(2\\pi\\sigma^2) + \\tfrac{1}{2\\sigma^2}\\sum_i (y_i - f(x_i))^2"}</M>. For fixed σ, minimising
          it over f is minimising squared error. Absolute error corresponds in the same way to Laplace noise.
        </p>
        <Code>{GAUSS}</Code>
      </Definition>

      <Definition title="Huber loss">
        <MD>{"\\ell_\\delta(r) = \\begin{cases} \\tfrac12 r^2 & |r| \\le \\delta \\\\ \\delta\\,(|r| - \\tfrac12\\delta) & |r| > \\delta \\end{cases}, \\qquad \\ell_\\delta'(r) = \\operatorname{clip}(r, -\\delta, \\delta)."}</MD>
        <p>Its gradient is the residual, capped at ±δ, so no single example can dominate a step.</p>
        <Code>{LOSSES}</Code>
      </Definition>

      <Remark title="gradients and outliers">
        <p>
          The gradient of <M>{"\\tfrac12 r^2"}</M> is r, so an example with residual 100 pushes a hundred times harder than one
          with residual 1. When labels contain errors, that one example can dominate training. Huber loss, or clipping, limits
          the push.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mean",
      rung: "check",
      prompt: <p>Which constant minimises the squared error to the data 1, 2, 3, 10?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "median",
      rung: "check",
      prompt: <p>Which constant minimises the absolute error to the data 1, 2, 10?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "noise",
      rung: "apply",
      prompt: <p>Training with squared error is maximum likelihood under which noise model?</p>,
      answer: { kind: "choice", options: ["Gaussian noise with fixed variance", "Laplace noise", "Uniform noise", "No noise model at all"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def huber(r, delta):
    a = np.abs(r)
    return np.where(a <= delta, 0.5 * r ** 2, delta * (a - 0.5 * delta))

def huber_grad(r, delta):
    return np.clip(r, -delta, delta)

def fit_constant(y, grad, lr, steps):
    c = 0.0
    for _ in range(steps):
        c -= lr * float(np.mean(grad(c - y)))
    return c

y = np.array([1.0, 2.0, 3.0, 4.0, 20.0])
c_mse = fit_constant(y, lambda r: r, 0.1, 500)
c_mae = fit_constant(y, np.sign, 0.01, 2000)
c_hub = fit_constant(y, lambda r: huber_grad(r, 1.0), 0.1, 2000)
print(round(c_mse, 3), round(c_mae, 2), round(c_hub, 3))`}</Code>
          <p>Fitting a constant by gradient descent with three losses. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6.0 3.0 3.0", "6.0 3.0 6.0", "3.0 3.0 3.0", "6.0 6.0 3.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def huber(r, delta):
    a = np.abs(r)
    return np.where(a <= delta, 0.5 * r ** 2, delta * (a - 0.5 * delta))

def huber_grad(r, delta):
    return np.clip(r, -delta, delta)

def fit_constant(y, grad, lr, steps):
    c = 0.0
    for _ in range(steps):
        c -= lr * float(np.mean(grad(c - y)))
    return c

r = np.array([0.5, 3.0, 30.0])
print(r.tolist(), huber(r, 1.0).tolist(), huber_grad(r, 1.0).tolist())`}</Code>
          <p>Huber values and gradients. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 3.0, 30.0] [0.125, 2.5, 29.5] [0.5, 1.0, 1.0]",
          "[0.5, 3.0, 30.0] [0.125, 4.5, 450.0] [0.5, 3.0, 30.0]",
          "[0.5, 3.0, 30.0] [0.25, 2.5, 29.5] [0.5, 1.0, 1.0]",
          "[0.5, 3.0, 30.0] [0.125, 3.0, 30.0] [1.0, 1.0, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>huber(r, delta)</C> and <C>huber_grad(r, delta)</C> for NumPy arrays, and{" "}
          <C>fit_constant(y, grad, lr, steps)</C>, which starts from c = 0 and repeats c ← c − lr · mean(grad(c − y)),
          returning c as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def huber(r, delta):
    return 0.5 * r ** 2

def huber_grad(r, delta):
    return r

def fit_constant(y, grad, lr, steps):
    return 0.0
`,
        solution: LOSSES,
        tests: [
          { name: "Huber", code: `r = np.array([-4.0, -1.0, 0.3, 2.0])
assert np.allclose(huber(r, 1.0), [3.5, 0.5, 0.045, 1.5]) and np.allclose(huber_grad(r, 1.0), [-1, -1, 0.3, 1])
assert np.allclose(huber(r, 10.0), 0.5 * r ** 2)` },
          { name: "fits", code: `y = np.array([1.0, 2.0, 3.0, 4.0, 20.0])
assert abs(fit_constant(y, lambda r: r, 0.1, 500) - 6.0) < 1e-9
assert abs(fit_constant(y, lambda r: huber_grad(r, 1.0), 0.1, 2000) - 3.0) < 1e-6
assert isinstance(fit_constant(y, lambda r: r, 0.1, 5), float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_nll(y, mu, sigma)</C>, the mean over examples of the Gaussian negative log-likelihood, as a float,
          and <C>fit_linear_mse(X, y)</C>, the least-squares weights of a linear model with a bias, as a vector with the bias
          last (use <C>np.linalg.lstsq</C>).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gaussian_nll(y, mu, sigma):
    return 0.0

def fit_linear_mse(X, y):
    return np.zeros(X.shape[1] + 1)
`,
        solution: `import numpy as np

${GAUSS}`,
        tests: [
          { name: "likelihood", code: `y = np.array([1.0, 2.0, 4.0])
assert abs(gaussian_nll(y, 0.0, 1.0) - (0.5 * np.log(2 * np.pi) + 21 / 6)) < 1e-12
cs = np.linspace(0, 4, 13)
best = cs[np.argmin([gaussian_nll(y, c, 0.7) for c in cs])]
assert abs(best - y.mean()) < 1e-9` },
          { name: "least squares", code: `rng = np.random.default_rng(0)
X = rng.normal(size=(50, 2))
y = X @ np.array([2.0, -1.0]) + 0.5
assert np.allclose(fit_linear_mse(X, y), [2.0, -1.0, 0.5])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the constant c minimising Σᵢ (yᵢ − c)² is the mean of the yᵢ.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Either sets the derivative −2Σ(yᵢ − c) to zero and notes the function is a convex quadratic, or uses the decomposition Σ(yᵢ − ȳ)² + n(ȳ − c)².",
          "Shows the cross term vanishes (Σ(yᵢ − ȳ) = 0) or solves Σ(yᵢ − c) = 0 to get c = ȳ.",
          "Concludes ȳ is the unique minimiser (second derivative 2n > 0, or the n(ȳ − c)² term).",
        ],
      },
    },
    {
      key: "hval",
      rung: "stretch",
      prompt: <p>What is the Huber loss with δ = 1 at residual r = 3?</p>,
      answer: { kind: "numeric", value: 2.5 },
    },
  ],

  teachBack:
    "Explain to a friend what squared, absolute and Huber loss each estimate, how squared error follows from Gaussian noise, and why outliers matter.",

  glimpse: (
    <p>
      For classification the outputs are probabilities, and the natural loss is the negative log-likelihood of the right
      class. Next: softmax and cross-entropy.
    </p>
  ),
};
