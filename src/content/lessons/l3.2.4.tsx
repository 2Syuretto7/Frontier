import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CheckCurveViz } from "@/components/viz/CheckCurveViz";
import type { LessonContent } from "@/lib/types";

const CHECK = `import numpy as np

def rel(a, b):
    return abs(a - b) / max(abs(a), abs(b), 1e-12)

def directional_check(loss, grad, theta, rng, h=1e-5):
    v = rng.normal(size=theta.shape)
    v /= np.linalg.norm(v)
    numeric = (loss(theta + h * v) - loss(theta - h * v)) / (2 * h)
    return rel(float(grad(theta) @ v), numeric)

def spot_check(loss, grad, theta, k, rng, h=1e-5):
    g = grad(theta)
    worst = 0.0
    for i in rng.choice(theta.size, size=k, replace=False):
        e = np.zeros_like(theta)
        e[i] = h
        worst = max(worst, rel(g[i], (loss(theta + e) - loss(theta - e)) / (2 * h)))
    return worst
`;

const DIAG = `def diagnose(r):
    if r < 1e-6:
        return "ok"
    return "suspicious" if r < 1e-3 else "wrong"

def scale_ratio(analytic, numeric):
    return float(analytic @ numeric / (analytic @ analytic))
`;

export const lesson: LessonContent = {
  id: "l3.2.4",
  minutes: 45,
  links: {
    requires: ["l3.2.3"],
    revisits: ["e4.1.3", "m5.2.4"],
    parallels: ["e5.4.1"],
    foreshadows: ["l3.8.1", "l3.8.3"],
  },

  puzzle: (
    <>
      <p>
        You derived the gradient of a new layer by hand and the loss goes down, slowly. Is the gradient right, or just
        pointing vaguely downhill? Checking every one of a million parameters with finite differences would take two million
        forward passes. Can one check, costing two forward passes, catch most mistakes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pick a random direction v and compare the analytic slope along it, <M>{"g \\cdot v"}</M>, with the measured slope{" "}
        <M>{"(L(\\theta + hv) - L(\\theta - hv))/2h"}</M>. A wrong gradient is almost never wrong only in directions orthogonal
        to a random v, so this single comparison catches nearly every bug. How the error behaves as h shrinks tells a bug
        apart from rounding.
      </p>
      <CheckCurveViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the directional derivative">
        <p>
          If L is twice continuously differentiable, then for any unit vector v,{" "}
          <M>{"\\frac{L(\\theta + hv) - L(\\theta - hv)}{2h} = \\nabla L(\\theta) \\cdot v + O(h^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\varphi(t) = L(\\theta + tv)"}</M>. By the chain rule <M>{"\\varphi'(0) = \\nabla L(\\theta)\\cdot v"}</M>,
          and the central difference of <M>{"\\varphi"}</M> at 0 equals <M>{"\\varphi'(0) + O(h^2)"}</M> by Taylor&rsquo;s
          theorem, since the even-order terms cancel in <M>{"\\varphi(h) - \\varphi(-h)"}</M>. (With only two derivatives the
          error is <M>{"o(h)"}</M>; a third derivative gives <M>{"O(h^2)"}</M>.)
        </p>
      </Proof>

      <Definition title="two checks">
        <p>
          A directional check costs two loss evaluations, whatever the number of parameters. A spot check compares k randomly
          chosen entries one by one, for 2k evaluations, and says which entries are wrong.
        </p>
        <Code>{CHECK}</Code>
      </Definition>

      <Example title="reading the result">
        <p>
          In float64 with h near 10⁻⁵, a correct gradient gives a relative error of 10⁻⁸ or less. Errors around 10⁻⁴ deserve
          a second look, often a kink such as a ReLU near 0. Errors near 1 mean a bug, and the ratio of the analytic to the
          numeric gradient often names it. With the ratio below, the factor that would fix the analytic gradient, 1/N points to a
          forgotten mean over the batch, −1 to a sign error, and 2 or 1/2 to a mishandled square.
        </p>
        <Code>{DIAG}</Code>
      </Example>

      <Remark title="common bugs">
        <p>
          A missing transpose, which square test matrices hide; a forgotten mean over the batch; a missing activation
          derivative; a bias gradient summed over the wrong axis; and gradients accumulated across steps without being reset.
          Test with non-square shapes, a batch larger than one and random inputs, so that none of them can hide.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: <p>How many loss evaluations does one directional check need for a model with 10⁸ parameters?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "mean",
      rung: "check",
      prompt: <p>A gradient forgot to divide by the batch size N = 4, so it is 4 times too large. What relative error does the check report?</p>,
      answer: { kind: "numeric", value: 0.75 },
    },
    {
      key: "flat",
      rung: "apply",
      prompt: <p>As h goes from 10⁻² to 10⁻¹⁰, the relative error stays at about 0.3. What does that indicate?</p>,
      answer: {
        kind: "choice",
        options: ["A bug in the analytic gradient", "h is too small", "h is too large", "Ordinary rounding error"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def rel(a, b):
    return abs(a - b) / max(abs(a), abs(b), 1e-12)

def directional_check(loss, grad, theta, rng, h=1e-5):
    v = rng.normal(size=theta.shape)
    v /= np.linalg.norm(v)
    numeric = (loss(theta + h * v) - loss(theta - h * v)) / (2 * h)
    return rel(float(grad(theta) @ v), numeric)

def spot_check(loss, grad, theta, k, rng, h=1e-5):
    g = grad(theta)
    worst = 0.0
    for i in rng.choice(theta.size, size=k, replace=False):
        e = np.zeros_like(theta)
        e[i] = h
        worst = max(worst, rel(g[i], (loss(theta + e) - loss(theta - e)) / (2 * h)))
    return worst

def diagnose(r):
    if r < 1e-6:
        return "ok"
    return "suspicious" if r < 1e-3 else "wrong"

def scale_ratio(analytic, numeric):
    return float(analytic @ numeric / (analytic @ analytic))

rng = np.random.default_rng(0)
X, y = rng.normal(size=(4, 3)), rng.normal(size=4)
loss = lambda w: np.mean((X @ w - y) ** 2)
grad = lambda w: 2 * X.T @ (X @ w - y) / len(y)
bad = lambda w: 2 * X.T @ (X @ w - y)
w = rng.normal(size=3)
r_good = directional_check(loss, grad, w, rng)
r_bad = directional_check(loss, bad, w, rng)
print(r_good < 1e-8, round(r_bad, 4))`}</Code>
          <p>A correct gradient and one without the 1/N. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True 0.75", "True 0.25", "False 0.75", "True 3.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def diagnose(r):
    if r < 1e-6:
        return "ok"
    return "suspicious" if r < 1e-3 else "wrong"

def scale_ratio(analytic, numeric):
    return float(analytic @ numeric / (analytic @ analytic))

print(diagnose(3e-9), diagnose(2e-5), diagnose(0.4))
a = np.array([2.0, -4.0, 6.0])
print(scale_ratio(a, a / 4), scale_ratio(a, -a))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["ok suspicious wrong\n0.25 -1.0", "ok ok wrong\n0.25 -1.0", "ok suspicious wrong\n4.0 -1.0", "ok suspicious suspicious\n0.25 1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rel(a, b)</C> for scalars (denominator floored at 1e-12); <C>directional_check(loss, grad, theta, rng, h)</C>,
          which draws a random normal direction, normalises it and returns the relative error between{" "}
          <M>{"g \\cdot v"}</M> and the central difference; and <C>spot_check(loss, grad, theta, k, rng, h)</C>, which checks k
          distinct random entries and returns the worst relative error.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rel(a, b):
    return abs(a - b)

def directional_check(loss, grad, theta, rng, h=1e-5):
    return 0.0

def spot_check(loss, grad, theta, k, rng, h=1e-5):
    return 0.0
`,
        solution: CHECK,
        tests: [
          { name: "correct and wrong gradients", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(6, 6)); A = A @ A.T
loss = lambda t: 0.5 * t @ A @ t + np.sin(t).sum()
grad = lambda t: A @ t + np.cos(t)
t = rng.normal(size=6)
assert directional_check(loss, grad, t, rng) < 1e-7 and spot_check(loss, grad, t, 4, rng) < 1e-7
bad = lambda t: A @ t + np.cos(t) * np.array([1, 1, 1, 1, 1, -1.0])
assert spot_check(loss, bad, t, 6, rng) > 0.01` },
          { name: "relative error", code: `assert rel(1.0, 1.0) == 0.0 and abs(rel(4.0, 1.0) - 0.75) < 1e-12 and rel(0.0, 0.0) == 0.0
rng = np.random.default_rng(1)
loss = lambda t: (t ** 2).sum()
assert abs(directional_check(loss, lambda t: 4 * t, np.ones(5), rng) - 0.5) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>diagnose(r)</C>, returning "ok" below 1e-6, "suspicious" below 1e-3 and "wrong" otherwise, and{" "}
          <C>scale_ratio(analytic, numeric)</C>, returning{" "}
          <M>{"(a \\cdot n)/(a \\cdot a)"}</M>, the factor by which the analytic vector should be scaled to best match the
          numeric one.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def diagnose(r):
    return "ok"

def scale_ratio(analytic, numeric):
    return 1.0
`,
        solution: `import numpy as np

${DIAG}`,
        tests: [
          { name: "thresholds", code: `assert [diagnose(r) for r in (1e-9, 5e-7, 2e-4, 0.5, 3.0)] == ["ok", "ok", "suspicious", "wrong", "wrong"]` },
          { name: "ratios", code: `a = np.array([1.0, -2.0, 3.0])
assert abs(scale_ratio(a, a / 8) - 0.125) < 1e-12 and abs(scale_ratio(a, -a) + 1) < 1e-12
assert abs(scale_ratio(a, 2 * a) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Show that for a smooth L and unit vector v, the central difference <M>{"(L(\\theta + hv) - L(\\theta - hv))/2h"}</M>{" "}
          tends to <M>{"\\nabla L(\\theta) \\cdot v"}</M>, with error <M>{"O(h^2)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Introduces φ(t) = L(θ + tv) and uses the chain rule to get φ′(0) = ∇L(θ)·v.",
          "Expands φ(±h) by Taylor's theorem to third order, so the difference is 2hφ′(0) + O(h³).",
          "Divides by 2h to conclude the error is O(h²).",
        ],
      },
    },
    {
      key: "spot",
      rung: "stretch",
      prompt: <p>A spot check of 20 entries plus one directional check: how many loss evaluations in total?</p>,
      answer: { kind: "numeric", value: 42 },
    },
  ],

  teachBack:
    "Explain to a friend how a directional gradient check works, why it is so cheap, and how the shape of the error-versus-h curve separates bugs from rounding.",

  glimpse: (
    <p>
      The gradients are right; now, what should they be gradients of? Next chapter: loss functions, starting with squared
      error and what it assumes about the noise.
    </p>
  ),
};
