import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ClipQuarticViz } from "@/components/viz/ClipQuarticViz";
import type { LessonContent } from "@/lib/types";

const QUARTIC = `import numpy as np

def gd_quartic(x, lr, steps):
    path = []
    for _ in range(steps):
        x = x - lr * x ** 3
        path.append(x)
        if abs(x) > 1e6:
            break
    return path

def clipped_quartic(x, lr, c, steps):
    path = []
    for _ in range(steps):
        g = x ** 3
        x = x - lr * g * min(1.0, c / abs(g)) if g != 0 else x
        path.append(x)
    return path

def clipped_entry(x0, lr, c):
    gap = abs(x0) - c ** (1 / 3)
    return 0 if gap <= 0 else int(np.ceil(gap / (lr * c)))`;

const VARIANTS = `import numpy as np

def clip_mean(values, probs, c):
    return float(np.dot(probs, np.clip(values, -c, c)))

def agc(w, g, lam, eps=1e-3):
    w, g = np.asarray(w, float), np.asarray(g, float)
    wn = np.maximum(np.linalg.norm(w, axis=1, keepdims=True), eps)
    gn = np.linalg.norm(g, axis=1, keepdims=True)
    return g * np.where(gn > lam * wn, lam * wn / np.maximum(gn, 1e-12), 1.0)

def value_clip_cos(g, c):
    g = np.asarray(g, float)
    h = np.clip(g, -c, c)
    return float(g @ h / (np.linalg.norm(g) * np.linalg.norm(h)))`;

export const lesson: LessonContent = {
  id: "m14.6.1",
  minutes: 40,
  links: {
    requires: ["m14.5.3"],
    revisits: ["l3.5.1"],
    foreshadows: ["m14.6.2"],
  },

  puzzle: (
    <>
      <p>
        Gradient clipping was introduced as a patch for exploding gradients in recurrent networks: if the gradient is
        enormous, shrink it. Yet modern transformer training clips the global gradient norm at 1.0 throughout, even when
        nothing is exploding, and removing it often hurts. Classical convergence theory, which assumes a fixed bound on
        curvature, says clipping can only slow gradient descent down. What property of real losses makes it help?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The classical analysis assumes one curvature bound for the whole landscape, and picks the step size from it. In
        neural networks the curvature is not uniform: where the gradient is large, the curvature tends to be large too.
        A step size safe in the gentle regions then overshoots in the steep ones, and a step size safe in the steep
        regions crawls in the gentle ones. Clipping resolves this by changing what the learning rate controls. For small
        gradients the step is η times the gradient, as usual. For large gradients the step has fixed length ηc, however
        large the gradient, which is the right behaviour when large gradients come with large curvature.
      </p>
      <ClipQuarticViz />
    </>
  ),

  theory: (
    <>
      <Definition title="kinds of clipping">
        <p>
          <em>Norm clipping</em> with threshold c replaces g by <M>{"g\\min(1, c/\\|g\\|)"}</M>, keeping its direction.{" "}
          <em>Value clipping</em> clips every coordinate to [−c, c], which can change the direction. <em>Adaptive
          gradient clipping</em> works unit by unit: for row i of a weight matrix W it rescales the gradient row{" "}
          <M>{"g_i"}</M> so that <M>{"\\|g_i\\| \\le \\lambda\\max(\\|w_i\\|, \\epsilon)"}</M>, bounding each update relative to
          the size of the weights it changes.
        </p>
      </Definition>

      <Theorem title="a fixed step size diverges far from the minimum">
        <p>
          For <M>{"f(x) = x^4/4"}</M>, gradient descent <M>{"x \\leftarrow x - \\eta x^3"}</M> with{" "}
          <M>{"\\eta x_0^2 > 2"}</M> satisfies <M>{"|x_t| \\to \\infty"}</M>. So no single η converges from every
          starting point.
        </p>
      </Theorem>
      <Proof>
        <p>
          The update is <M>{"x_{t+1} = x_t(1 - \\eta x_t^2)"}</M>. If <M>{"\\eta x_t^2 > 2"}</M> then{" "}
          <M>{"|1 - \\eta x_t^2| = \\eta x_t^2 - 1 > 1"}</M>, so <M>{"|x_{t+1}| > |x_t|"}</M> and{" "}
          <M>{"\\eta x_{t+1}^2 > 2"}</M> again. By induction the ratios <M>{"|x_{t+1}|/|x_t| = \\eta x_t^2 - 1"}</M> are all
          at least <M>{"\\eta x_0^2 - 1 > 1"}</M>, so <M>{"|x_t|"}</M> grows at least geometrically. For any fixed η the
          start <M>{"x_0 = 2/\\sqrt\\eta"}</M> satisfies the condition.
        </p>
      </Proof>

      <Theorem title="clipped descent converges from everywhere">
        <p>
          Run norm-clipped gradient descent on <M>{"x^4/4"}</M> with <M>{"\\eta c^{2/3} \\le 1"}</M> from{" "}
          <M>{"|x_0| > c^{1/3}"}</M>. Then <M>{"|x_t|^3 \\le c"}</M> for the first time after exactly{" "}
          <M>{"\\lceil(|x_0| - c^{1/3})/(\\eta c)\\rceil"}</M> steps, and <M>{"x_t \\to 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          While <M>{"|x|^3 > c"}</M> the clipped step has length exactly ηc and points towards zero. It cannot jump past
          zero, since <M>{"\\eta c = \\eta c^{2/3}c^{1/3} \\le c^{1/3} < |x|"}</M>. So <M>{"|x_k| = |x_0| - k\\eta c"}</M>{" "}
          until this first drops to <M>{"c^{1/3}"}</M> or below, which happens at the stated k. From then on{" "}
          <M>{"|x|^3 \\le c"}</M>, no clipping occurs, and <M>{"0 \\le 1 - \\eta x^2 < 1"}</M> because{" "}
          <M>{"\\eta x^2 \\le \\eta c^{2/3} \\le 1"}</M>. So <M>{"|x_t|"}</M> decreases monotonically and stays in this
          region; its limit L satisfies <M>{"L = L(1 - \\eta L^2)"}</M>, which forces L = 0.
        </p>
        <Code>{QUARTIC}</Code>
      </Proof>

      <Theorem title="the right step length grows with the gradient, then stops">
        <p>
          Let <M>{"g = \\nabla f(x) \\neq 0"}</M> and suppose <M>{"\\|\\nabla^2f(y)\\| \\le K"}</M> on the segment from x to{" "}
          <M>{"x - s\\,g/\\|g\\|"}</M>. Then <M>{"f(x - s\\,g/\\|g\\|) \\le f(x) - s\\|g\\| + \\tfrac12Ks^2"}</M>, so any
          step length <M>{"s \\le \\|g\\|/K"}</M> decreases f by at least <M>{"\\tfrac12s\\|g\\|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Taylor&apos;s theorem with the Lagrange remainder along the segment gives{" "}
          <M>{"f(x - su) = f(x) - s\\,g\\cdot u + \\tfrac12s^2u^\\top\\nabla^2f(\\xi)u"}</M> for{" "}
          <M>{"u = g/\\|g\\|"}</M> and some ξ on the segment; the middle term is <M>{"-s\\|g\\|"}</M> and the last is at most{" "}
          <M>{"\\tfrac12Ks^2"}</M>. If <M>{"s \\le \\|g\\|/K"}</M> then <M>{"\\tfrac12Ks^2 \\le \\tfrac12s\\|g\\|"}</M>.
        </p>
      </Proof>

      <Remark title="why this favours clipping">
        <p>
          Zhang, He, Sra and Jadbabaie measured the curvature of LSTM and transformer losses along training and found it
          roughly affine in the gradient norm: <M>{"K \\approx L_0 + L_1\\|g\\|"}</M>. With that K, the safe step length{" "}
          <M>{"\\|g\\|/(L_0 + L_1\\|g\\|)"}</M> grows like <M>{"\\|g\\|/L_0"}</M> for small gradients and levels off at{" "}
          <M>{"1/L_1"}</M> for large ones. Plain gradient descent takes length <M>{"\\eta\\|g\\|"}</M>, which matches only
          the first regime; clipped descent takes <M>{"\\min(\\eta\\|g\\|, \\eta c)"}</M>, which matches both. The quartic
          above is the simplest example: its curvature <M>{"3x^2"}</M> is at most <M>{"3 + 3|x|^3"}</M>, so{" "}
          <M>{"L_0 = L_1 = 3"}</M>, but no constant bounds it.
        </p>
      </Remark>

      <Remark title="clipping stochastic gradients is biased">
        <p>
          With noisy gradients, the expected clipped gradient is not the clipped expected gradient. If the gradient is 3
          or −1 with equal probability, its mean is 1, but clipping at 2 gives values 2 and −1, with mean 0.5. Large
          positive and negative outliers are cut alike, so with symmetric noise the bias mostly shrinks the step; with
          skewed or heavy-tailed noise it can shift the direction. In exchange the clipped gradient has bounded variance,
          which is what makes stochastic methods converge at all when gradient noise is heavy-tailed. Value clipping
          has a further cost: it changes the direction even without noise.
        </p>
        <Code>{VARIANTS}</Code>
      </Remark>

      <Remark title="in practice">
        <p>
          Large language model recipes clip the global norm at 1.0 and log the norm before clipping; a clipped step that
          is rare is a safety net, while clipping at every step means the threshold has become the effective learning
          rate. Adam already divides by a running gradient scale, so its updates are bounded in size coordinate by
          coordinate; clipping then mostly matters for sudden gradient jumps that the slow second-moment estimate has not
          caught up with, which is the setting of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "threshold",
      rung: "check",
      prompt: <p>Gradient descent with η = 0.02 runs on x⁴/4. What is the largest |x₀| for which the first step does not increase |x|?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
    {
      key: "entry",
      rung: "check",
      prompt: <p>Norm-clipped descent on x⁴/4 with η = 0.1 and c = 2 starts at x₀ = 11. After how many steps is |x|³ ≤ 2 for the first time?</p>,
      answer: { kind: "numeric", value: 49, tolerance: 0 },
    },
    {
      key: "kind",
      rung: "apply",
      prompt: <p>A gradient has one huge coordinate and many small ones. How do norm clipping and value clipping treat it differently?</p>,
      answer: {
        kind: "choice",
        options: [
          "Norm clipping scales the whole vector down and keeps its direction; value clipping cuts only the huge coordinate, so the step points in a different direction",
          "Both keep the direction; value clipping just shrinks it more",
          "Norm clipping changes the direction; value clipping keeps it",
          "They are identical whenever c is the same",
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

def gd_quartic(x, lr, steps):
    path = []
    for _ in range(steps):
        x = x - lr * x ** 3
        path.append(x)
        if abs(x) > 1e6:
            break
    return path

def clipped_quartic(x, lr, c, steps):
    path = []
    for _ in range(steps):
        g = x ** 3
        x = x - lr * g * min(1.0, c / abs(g)) if g != 0 else x
        path.append(x)
    return path

def clipped_entry(x0, lr, c):
    gap = abs(x0) - c ** (1 / 3)
    return 0 if gap <= 0 else int(np.ceil(gap / (lr * c)))

print([round(x, 4) for x in gd_quartic(2.0, 0.1, 3)], len(gd_quartic(5.0, 0.1, 50)))
print([round(x, 3) for x in clipped_quartic(5.0, 0.1, 1.0, 3)], clipped_entry(5.0, 0.1, 2.0), clipped_entry(0.5, 0.1, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.2, 1.0272, 0.9188] 4\n[4.9, 4.8, 4.7] 19 0",
          "[1.2, 1.0272, 0.9188] 50\n[4.9, 4.8, 4.7] 19 0",
          "[1.2, 1.0272, 0.9188] 4\n[4.8, 4.6, 4.4] 19 0",
          "[1.2, 1.0272, 0.9188] 4\n[4.9, 4.8, 4.7] 38 0",
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

def clip_mean(values, probs, c):
    return float(np.dot(probs, np.clip(values, -c, c)))

def agc(w, g, lam, eps=1e-3):
    w, g = np.asarray(w, float), np.asarray(g, float)
    wn = np.maximum(np.linalg.norm(w, axis=1, keepdims=True), eps)
    gn = np.linalg.norm(g, axis=1, keepdims=True)
    return g * np.where(gn > lam * wn, lam * wn / np.maximum(gn, 1e-12), 1.0)

def value_clip_cos(g, c):
    g = np.asarray(g, float)
    h = np.clip(g, -c, c)
    return float(g @ h / (np.linalg.norm(g) * np.linalg.norm(h)))

print(clip_mean([3.0, -1.0], [0.5, 0.5], 2.0), clip_mean([3.0, -1.0], [0.5, 0.5], 5.0))
print(agc([[3.0, 4.0], [0.0, 0.0]], [[0.6, 0.8], [1.0, 0.0]], 0.1).round(4).tolist(), round(value_clip_cos([3.0, 0.5], 1.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 1.0\n[[0.3, 0.4], [0.0001, 0.0]] 0.956",
          "1.0 1.0\n[[0.3, 0.4], [0.0001, 0.0]] 0.956",
          "0.5 1.0\n[[0.3, 0.4], [1.0, 0.0]] 0.956",
          "0.5 1.0\n[[0.6, 0.8], [0.0001, 0.0]] 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For f(x) = x⁴/4 write <C>gd_quartic(x, lr, steps)</C>, the list of iterates after each step, stopping early
          (after appending) once |x| exceeds 10⁶; <C>clipped_quartic(x, lr, c, steps)</C>, the same with the gradient
          norm-clipped at c and no stopping rule; and <C>clipped_entry(x0, lr, c)</C>, the step count from the theorem, or
          0 when <M>{"|x_0| \\le c^{1/3}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_quartic(x, lr, steps):
    return [x] * steps

def clipped_quartic(x, lr, c, steps):
    return gd_quartic(x, lr, steps)

def clipped_entry(x0, lr, c):
    return 0
`,
        solution: QUARTIC,
        tests: [
          { name: "paths", code: `assert np.allclose(gd_quartic(2.0, 0.1, 3), [1.2, 1.0272, 0.918817]) and len(gd_quartic(5.0, 0.1, 50)) == 4 and abs(gd_quartic(5.0, 0.1, 50)[-1]) > 1e6
assert np.allclose(clipped_quartic(-2.0, 0.1, 1.0, 2), [-1.9, -1.8]) and clipped_quartic(0.0, 0.1, 1.0, 2) == [0.0, 0.0] and abs(clipped_quartic(8.0, 0.1, 1.0, 400)[-1]) < 0.13` },
          { name: "entry", code: `for x0, c in [(5.0, 2.0), (-7.0, 3.0), (11.0, 2.0)]:
    p = clipped_quartic(x0, 0.1, c, 400); assert clipped_entry(x0, 0.1, c) == next(i for i, x in enumerate(p) if abs(x) ** 3 <= c) + 1
assert clipped_entry(11.0, 0.1, 2.0) == 49 and clipped_entry(0.5, 0.1, 1.0) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>clip_mean(values, probs, c)</C>, the expected value-clipped gradient of a discrete scalar
          distribution; <C>agc(w, g, lam, eps=1e-3)</C>, adaptive gradient clipping applied row by row; and{" "}
          <C>value_clip_cos(g, c)</C>, the cosine between g and its value-clipped version.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def clip_mean(values, probs, c):
    return float(np.dot(probs, values))

def agc(w, g, lam, eps=1e-3):
    return np.asarray(g, float)

def value_clip_cos(g, c):
    return 1.0
`,
        solution: VARIANTS,
        tests: [
          { name: "bias", code: `assert abs(clip_mean([3.0, -1.0], [0.5, 0.5], 2.0) - 0.5) < 1e-12 and abs(clip_mean([10.0, -10.0, 1.0], [0.25, 0.25, 0.5], 3.0) - 0.5) < 1e-12
assert abs(value_clip_cos([3.0, 0.5], 1.0) - 3.25 / np.sqrt(9.25 * 1.25)) < 1e-12 and abs(value_clip_cos([0.5, -0.2], 1.0) - 1) < 1e-12` },
          { name: "agc", code: `out = agc([[3.0, 4.0], [0.0, 0.0], [1.0, 0.0]], [[0.6, 0.8], [1.0, 0.0], [0.05, 0.0]], 0.1)
assert np.allclose(out, [[0.3, 0.4], [1e-4, 0.0], [0.05, 0.0]])
w = np.random.default_rng(0).standard_normal((4, 3)); g = 10 * np.random.default_rng(1).standard_normal((4, 3)); out = agc(w, g, 0.02)
assert np.allclose(np.linalg.norm(out, axis=1), 0.02 * np.linalg.norm(w, axis=1)) and np.allclose(out / np.linalg.norm(out, axis=1, keepdims=True), g / np.linalg.norm(g, axis=1, keepdims=True))` },
        ],
      },
    },
    {
      key: "bias",
      rung: "stretch",
      prompt: (
        <p>
          A stochastic gradient equals 6 with probability 0.2 and 0 with probability 0.8, so its mean is 1.2. With
          clipping at c = 2, by how much does the expected clipped gradient fall short of the true mean?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Clipping limits the damage of one large gradient. The next lesson asks where such gradients come from in large
        training runs, and why the loss can jump by orders of magnitude in a single step.
      </p>
    </>
  ),
};
