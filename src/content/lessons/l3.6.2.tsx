import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AdamScaleViz } from "@/components/viz/AdamScaleViz";
import type { LessonContent } from "@/lib/types";

const ADAM = `import numpy as np

def adam_step(x, g, m, v, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g ** 2
    mh, vh = m / (1 - b1 ** t), v / (1 - b2 ** t)
    return x - lr * mh / (np.sqrt(vh) + eps), m, v

def adam_quadratic(lams, x0, lr, steps):
    x = np.array(x0, dtype=float)
    m, v = np.zeros_like(x), np.zeros_like(x)
    for t in range(1, steps + 1):
        x, m, v = adam_step(x, lams * x, m, v, t, lr)
    return x`;

const STEP = `import numpy as np

def adam_step(x, g, m, v, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g ** 2
    mh, vh = m / (1 - b1 ** t), v / (1 - b2 ** t)
    return x - lr * mh / (np.sqrt(vh) + eps), m, v`;

const DECAY = `def adam_l2_step(x, g, m, v, t, lr, wd):
    return adam_step(x, g + wd * x, m, v, t, lr)

def adamw_step(x, g, m, v, t, lr, wd):
    x_new, m, v = adam_step(x, g, m, v, t, lr)
    return x_new - lr * wd * x, m, v`;

export const lesson: LessonContent = {
  id: "l3.6.2",
  minutes: 50,
  links: {
    requires: ["l3.6.1"],
    revisits: ["e5.3.2", "l3.5.2"],
    foreshadows: ["l3.7.1", "m14.2.3", "m14.2.4"],
  },

  puzzle: (
    <>
      <p>
        An embedding table's rows receive gradients only when their word appears, so a rare word's gradient is a thousand
        times smaller on average than a common word's. With one learning rate, either the common words' rows blow up or the
        rare words' rows never move. And a second puzzle: adding L2 regularisation to Adam's loss turns out to do something
        different from weight decay, although for SGD the two are the same thing. Why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adam keeps, for each parameter separately, a running mean of its gradient and a running mean of its squared gradient,
        and steps by the ratio. Dividing by the gradient's own size makes the step size roughly the learning rate, whatever
        the scale of that parameter's gradient. That cures the scale problem, and it also explains the second puzzle: an L2
        term added to the gradient gets divided by the same normaliser.
      </p>
      <AdamScaleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Adam">
        <MD>{"m \\leftarrow \\beta_1 m + (1 - \\beta_1) g, \\quad v \\leftarrow \\beta_2 v + (1 - \\beta_2) g^2, \\quad x \\leftarrow x - \\eta\\, \\frac{m/(1 - \\beta_1^t)}{\\sqrt{v/(1 - \\beta_2^t)} + \\epsilon},"}</MD>
        <p>
          all elementwise, with defaults <M>{"\\beta_1 = 0.9, \\beta_2 = 0.999, \\epsilon = 10^{-8}"}</M>. The divisions by{" "}
          <M>{"1 - \\beta^t"}</M> correct for m and v starting at 0.
        </p>
        <Code>{ADAM}</Code>
      </Definition>

      <Theorem title="scale invariance of the step">
        <p>
          Ignoring ε, multiplying every gradient of a parameter by a constant c &gt; 0 leaves Adam's updates to that parameter
          unchanged. In particular the first step is exactly <M>{"-\\eta\\operatorname{sign}(g_1)"}</M>, and if the gradient
          is constant, every step has size exactly η.
        </p>
      </Theorem>
      <Proof>
        <p>
          Scaling g by c scales every m by c and every v by <M>{"c^2"}</M>, so <M>{"\\sqrt{v}"}</M> scales by c and the ratio{" "}
          <M>{"m/\\sqrt{v}"}</M> is unchanged. At t = 1, <M>{"\\hat m = g_1"}</M> and <M>{"\\hat v = g_1^2"}</M>, so the step
          is <M>{"-\\eta g_1/|g_1|"}</M>. If every gradient equals g, the bias-corrected averages are exactly{" "}
          <M>{"\\hat m = g"}</M> and <M>{"\\hat v = g^2"}</M>, so every step is <M>{"-\\eta\\operatorname{sign}(g)"}</M>.
          With varying gradients the step can be smaller (when signs disagree) or, after a sudden large gradient, somewhat
          larger, up to about <M>{"\\eta(1 - \\beta_1)/\\sqrt{1 - \\beta_2} \\approx 3\\eta"}</M> for the defaults.
        </p>
      </Proof>

      <Remark title="what Adam is adapting to">
        <p>
          Adam does not use curvature, only gradient size. Dividing by <M>{"\\sqrt v"}</M> makes it close to sign descent, with
          step size about η, so η is roughly how far each parameter may move per step. That is why Adam's learning rates (1e-4
          to 1e-3) look small next to SGD's, and why they transfer between models better.
        </p>
      </Remark>

      <Definition title="L2 inside Adam against AdamW">
        <p>
          With SGD, adding <M>{"\\tfrac{\\lambda}{2}\\|x\\|^2"}</M> to the loss and shrinking{" "}
          <M>{"x \\leftarrow x - \\eta\\lambda x"}</M> after each step are the same update. With Adam they differ. Added to the
          gradient, <M>{"\\lambda x"}</M> is divided by <M>{"\\sqrt v"}</M>, so parameters with large gradients are barely
          decayed and the decay of every parameter is capped at about η per step. AdamW decouples the two: it takes the Adam
          step on the loss gradient alone and then applies <M>{"x \\leftarrow x - \\eta\\lambda x"}</M>.
        </p>
        <Code>{DECAY}</Code>
      </Definition>

      <Example title="the numbers">
        <p>
          Two weights, 1 and 100, with zero loss gradient, η = 0.01, λ = 0.1. L2 inside Adam moves each by exactly η = 0.01
          on the first step: 0.99 and 99.99. AdamW shrinks each by the same fraction ηλ = 0.1%: 0.999 and 99.9. Only AdamW
          decays large weights faster than small ones, which is what weight decay is for.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: <p>Adam with η = 0.003 sees a first gradient of −250 for some parameter. By how much does that parameter change on step 1 (with sign)?</p>,
      answer: { kind: "numeric", value: 0.003, tolerance: 1e-6 },
    },
    {
      key: "bias",
      rung: "check",
      prompt: <p>With β₂ = 0.999, what is the bias-correction divisor 1 − β₂ᵗ at t = 10? Give 5 decimal places.</p>,
      answer: { kind: "numeric", value: 0.00995512, tolerance: 1e-5 },
    },
    {
      key: "adamw",
      rung: "apply",
      prompt: <p>Why does AdamW apply weight decay outside the Adam update?</p>,
      answer: {
        kind: "choice",
        options: [
          "Inside, the decay term is divided by √v, so it no longer shrinks each weight in proportion to its size",
          "To save memory, since v no longer needs storing",
          "Because Adam cannot compute the gradient of an L2 term",
          "To make the update invariant to the learning rate",
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

def adam_step(x, g, m, v, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g ** 2
    mh, vh = m / (1 - b1 ** t), v / (1 - b2 ** t)
    return x - lr * mh / (np.sqrt(vh) + eps), m, v

def adam_quadratic(lams, x0, lr, steps):
    x = np.array(x0, dtype=float)
    m, v = np.zeros_like(x), np.zeros_like(x)
    for t in range(1, steps + 1):
        x, m, v = adam_step(x, lams * x, m, v, t, lr)
    return x

for g in [1e-3, 1.0, 1e3]:
    x, m, v = adam_step(0.0, g, 0.0, 0.0, 1, 0.01)
    print(round(x, 6))
print(adam_quadratic(np.array([100.0, 0.01]), [1.0, 1.0], 0.02, 100).round(3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.01\n-0.01\n-0.01\n[-0.008 -0.008]",
          "-1e-05\n-0.01\n-10.0\n[-0.008 -0.008]",
          "-0.01\n-0.01\n-0.01\n[0.    0.981]",
          "-1e-05\n-0.01\n-10.0\n[0.    0.981]",
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

def adam_step(x, g, m, v, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g ** 2
    mh, vh = m / (1 - b1 ** t), v / (1 - b2 ** t)
    return x - lr * mh / (np.sqrt(vh) + eps), m, v

def adam_l2_step(x, g, m, v, t, lr, wd):
    return adam_step(x, g + wd * x, m, v, t, lr)

def adamw_step(x, g, m, v, t, lr, wd):
    x_new, m, v = adam_step(x, g, m, v, t, lr)
    return x_new - lr * wd * x, m, v

z = np.zeros(2)
w = np.array([1.0, 100.0])
print(adam_l2_step(w, z, z, z, 1, 0.01, 0.1)[0].round(4))
print(adamw_step(w, z, z, z, 1, 0.01, 0.1)[0].round(4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[ 0.99 99.99]\n[ 0.999 99.9  ]", "[ 0.999 99.9  ]\n[ 0.99 99.99]", "[ 0.999 99.9  ]\n[ 0.999 99.9  ]", "[ 0.99 99.  ]\n[ 0.999 99.9  ]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>adam_step(x, g, m, v, t, lr, b1=0.9, b2=0.999, eps=1e-8)</C>, returning <C>(x_new, m_new, v_new)</C> with
          bias correction (t counts from 1), and <C>adam_quadratic(lams, x0, lr, steps)</C>, which runs Adam from x0 on the
          loss <M>{"\\tfrac12\\sum_i\\lambda_i x_i^2"}</M> with m and v starting at 0 and returns the final x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adam_step(x, g, m, v, t, lr, b1=0.9, b2=0.999, eps=1e-8):
    return x - lr * g, m, v

def adam_quadratic(lams, x0, lr, steps):
    return np.array(x0, dtype=float)
`,
        solution: ADAM,
        tests: [
          { name: "one step", code: `for g in [1e-3, 1.0, -1e3]:
    x, m, v = adam_step(0.0, g, 0.0, 0.0, 1, 0.01)
    assert abs(x + 0.01 * np.sign(g)) < 1e-7
x, m, v = adam_step(np.array([1.0]), np.array([2.0]), np.array([1.0]), np.array([4.0]), 2, 0.1)
mh, vh = (0.9 + 0.2) / (1 - 0.81), (0.999 * 4 + 0.004) / (1 - 0.999 ** 2)
assert np.allclose(m, [1.1]) and np.allclose(v, [4.0]) and np.allclose(x, [1 - 0.1 * mh / (np.sqrt(vh) + 1e-8)])` },
          { name: "scale free", code: `a = adam_quadratic(np.array([100.0, 0.01]), [1.0, 1.0], 0.02, 100)
assert abs(a[0] - a[1]) < 1e-6 and abs(a[0]) < 0.01
b = adam_quadratic(np.array([3.0]), [1.0], 0.02, 50)
c = adam_quadratic(np.array([3000.0]), [1.0], 0.02, 50)
assert np.allclose(b, c, atol=1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          <C>adam_step</C> is already defined. Write <C>adam_l2_step(x, g, m, v, t, lr, wd)</C>, which adds{" "}
          <C>wd · x</C> to the gradient before the Adam step, and <C>adamw_step(x, g, m, v, t, lr, wd)</C>, which takes the
          Adam step on g alone and then subtracts <C>lr · wd · x</C> (using the x from before the step). Both return{" "}
          <C>(x_new, m_new, v_new)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        setup: STEP,
        starter: `import numpy as np

def adam_l2_step(x, g, m, v, t, lr, wd):
    return adam_step(x, g, m, v, t, lr)

def adamw_step(x, g, m, v, t, lr, wd):
    return adam_step(x, g, m, v, t, lr)
`,
        solution: `import numpy as np

${DECAY}`,
        tests: [
          { name: "decay with no gradient", code: `z = np.zeros(2); w = np.array([1.0, 100.0])
assert np.allclose(adam_l2_step(w, z, z, z, 1, 0.01, 0.1)[0], [0.99, 99.99])
assert np.allclose(adamw_step(w, z, z, z, 1, 0.01, 0.1)[0], [0.999, 99.9])` },
          { name: "with a gradient", code: `x = np.array([2.0]); g = np.array([0.5]); m = np.array([0.1]); v = np.array([0.2])
xn, mn, vn = adamw_step(x, g, m, v, 3, 0.01, 0.05)
xa, ma, va = adam_step(x, g, m, v, 3, 0.01)
assert np.allclose(xn, xa - 0.01 * 0.05 * 2.0) and np.allclose(mn, ma) and np.allclose(vn, va)
xl, ml, vl = adam_l2_step(x, g, m, v, 3, 0.01, 0.05)
assert np.allclose(ml, 0.9 * 0.1 + 0.1 * 0.6) and np.allclose(xl, adam_step(x, g + 0.1, m, v, 3, 0.01)[0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that, ignoring ε, multiplying all of a parameter's gradients by c &gt; 0 does not change Adam's updates to that parameter.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows by induction (or by writing m and v as weighted sums) that the scaled run has m scaled by c and v scaled by c².",
          "Notes the bias corrections do not depend on the gradients, so m̂ scales by c and √v̂ by c (using c > 0).",
          "Concludes m̂/√v̂ and hence every update, and the whole trajectory, are unchanged.",
        ],
      },
    },
    {
      key: "decay",
      rung: "stretch",
      prompt: <p>AdamW with η = 0.001 and λ = 0.1, and no loss gradient: what fraction of a weight remains after 10 000 steps? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 0.36786104, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend how Adam makes each parameter's step independent of its gradient scale, and why weight decay has to be applied outside the Adam update.",

  glimpse: (
    <p>
      Every optimiser so far used one fixed learning rate. Next: schedules that change it during training, and why almost
      every large model starts with a warmup.
    </p>
  ),
};
