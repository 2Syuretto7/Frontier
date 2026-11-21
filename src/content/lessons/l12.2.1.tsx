import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FlowPathViz } from "@/components/viz/FlowPathViz";
import type { LessonContent } from "@/lib/types";

const PATHS = `import math

def path_coeffs(t, kind):
    if kind == "straight":
        return t, 1 - t, 1.0, -1.0                             # alpha, sigma and their derivatives
    h = math.pi * t / 2
    return math.sin(h), math.cos(h), math.pi / 2 * math.cos(h), -math.pi / 2 * math.sin(h)

def fm_pair(x1, x0, t, kind):
    a, s, da, ds = path_coeffs(t, kind)
    return a * x1 + s * x0, da * x1 + ds * x0                  # network input and velocity target

def from_velocity(x, v, t, kind):
    a, s, da, ds = path_coeffs(t, kind)
    det = a * ds - s * da
    return (x * ds - s * v) / det, (a * v - da * x) / det      # predicted data and predicted noise`;

const MATCH = `import math

def snr(t, kind):
    return t / (1 - t) if kind == "straight" else math.tan(math.pi * t / 2)   # alpha / sigma

def match(x, t, kind, kind2):
    lam = snr(t, kind)
    t2 = lam / (1 + lam) if kind2 == "straight" else 2 / math.pi * math.atan(lam)
    sig = lambda u, k: 1 - u if k == "straight" else math.cos(math.pi * u / 2)
    return x * sig(t2, kind2) / sig(t, kind), t2               # the same point in the other path's coordinates

def logit_normal_t(u, m, sd):
    return 1 / (1 + math.exp(-(m + sd * u)))                   # u is a standard normal draw`;

export const lesson: LessonContent = {
  id: "l12.2.1",
  minutes: 55,
  links: {
    requires: ["l12.1.4", "m19.5.3"],
    revisits: ["l7.4.3", "l12.1.3"],
    foreshadows: ["l12.2.2"],
  },

  puzzle: (
    <>
      <p>
        Diffusion models arrived with stochastic processes, reverse-time SDEs and score functions. Flow matching arrived with
        a single regression: pick a noise sample and a data point, draw the line between them, and teach a network the
        line&apos;s velocity. Stable Diffusion 3 and many video models now train this way. Is flow matching a different model
        from diffusion, or the same model written more simply? And if the line can be any curve, which one should be chosen?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        m19.5.3 proved the core fact: regressing on the velocity of the conditional path, which needs only a sample of noise
        and data, recovers the marginal velocity, whose flow carries noise to data. Every diffusion model of chapter 1 is an
        instance with a particular curved path between the pair. Any two such paths pass through the same family of noisy
        distributions, only labelled with different times and scaled differently, so a network trained for one can be turned
        into a network for the other. What the choice changes is how the loss weighs each noise level and how hard the flow
        is to integrate with few steps.
      </p>
      <FlowPathViz />
    </>
  ),

  theory: (
    <>
      <Definition title="affine paths">
        <p>
          Let <M>{"X_0 \\sim \\mathcal{N}(0, I)"}</M> and data <M>{"X_1"}</M> be independent, and{" "}
          <M>{"X_t = \\alpha_t X_1 + \\sigma_t X_0"}</M> with <M>{"\\alpha_0 = 0"}</M>, <M>{"\\sigma_0 = 1"}</M>,{" "}
          <M>{"\\alpha_1 = 1"}</M>, <M>{"\\sigma_1 = 0"}</M> (<C>path_coeffs</C>). The conditional velocity is{" "}
          <M>{"U = \\dot\\alpha_t X_1 + \\dot\\sigma_t X_0"}</M> and the network is trained on{" "}
          <M>{"\\mathbb{E}\\|v_\\theta(X_t, t) - U\\|^2"}</M> (<C>fm_pair</C>), whose minimiser is the marginal velocity{" "}
          <M>{"v_t(x) = \\mathbb{E}[U \\mid X_t = x]"}</M>. The straight path <M>{"\\alpha_t = t"}</M>,{" "}
          <M>{"\\sigma_t = 1 - t"}</M> is the one of m19.5.3; the cosine path <M>{"\\alpha_t = \\sin(\\pi t/2)"}</M>,{" "}
          <M>{"\\sigma_t = \\cos(\\pi t/2)"}</M> is a variance-preserving diffusion path with time running from noise to data.
        </p>
      </Definition>

      <Theorem title="velocity, data and noise predictions are interchangeable">
        <p>
          Let <M>{"\\hat x_1(x) = \\mathbb{E}[X_1 \\mid X_t = x]"}</M> and <M>{"\\hat\\varepsilon(x) = \\mathbb{E}[X_0 \\mid X_t = x]"}</M>.
          Then <M>{"x = \\alpha_t \\hat x_1 + \\sigma_t \\hat\\varepsilon"}</M> and{" "}
          <M>{"v_t = \\dot\\alpha_t \\hat x_1 + \\dot\\sigma_t \\hat\\varepsilon"}</M>, and when{" "}
          <M>{"\\alpha_t \\dot\\sigma_t - \\sigma_t \\dot\\alpha_t \\ne 0"}</M> each of the three determines the other two
          (<C>from_velocity</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Take conditional expectations given <M>{"X_t = x"}</M> of <M>{"X_t = \\alpha_t X_1 + \\sigma_t X_0"}</M> and of the
          definition of U, using linearity. The two equations form a linear system in{" "}
          <M>{"(\\hat x_1, \\hat\\varepsilon)"}</M> with determinant <M>{"\\alpha_t \\dot\\sigma_t - \\sigma_t \\dot\\alpha_t"}</M>; by
          Cramer&apos;s rule, <M>{"\\hat x_1 = (x \\dot\\sigma_t - \\sigma_t v)/\\det"}</M> and{" "}
          <M>{"\\hat\\varepsilon = (\\alpha_t v - \\dot\\alpha_t x)/\\det"}</M>. For both paths above the determinant is −1 or{" "}
          <M>{"-\\pi/2"}</M>, never zero.
        </p>
        <Code>{PATHS}</Code>
      </Proof>

      <Theorem title="the target sets the weighting">
        <p>
          On the straight path, for any prediction <M>{"\\hat v"}</M> with implied <M>{"\\hat\\varepsilon"}</M> and{" "}
          <M>{"\\hat x_1"}</M>,{" "}
          <M>{"\\|\\hat v - U\\|^2 = \\|\\hat\\varepsilon - X_0\\|^2 / t^2 = \\|\\hat x_1 - X_1\\|^2/(1 - t)^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"\\alpha = t"}</M> and <M>{"\\sigma = 1 - t"}</M>, the formulas above give{" "}
          <M>{"\\hat\\varepsilon = x - t \\hat v"}</M> and <M>{"\\hat x_1 = x + (1 - t)\\hat v"}</M>, and the true values satisfy the
          same relations with U. Subtracting, <M>{"\\hat\\varepsilon - X_0 = -t(\\hat v - U)"}</M> and{" "}
          <M>{"\\hat x_1 - X_1 = (1 - t)(\\hat v - U)"}</M>.
        </p>
      </Proof>

      <Remark title="consequence">
        <p>
          Velocity regression is noise regression weighted by <M>{"1/t^2"}</M>, or data regression weighted by{" "}
          <M>{"1/(1 - t)^2"}</M>. All have the same minimiser; they differ only in which noise levels the finite network is
          pushed to get right, exactly the weighting question of l12.1.4. The density from which t is drawn is a second weight:
          Esser and colleagues, training Stable Diffusion 3, found the logit-normal density, with{" "}
          <M>{"t = 1/(1 + e^{-(m + s u)})"}</M> for standard normal u (<C>logit_normal_t</C>), better than uniform t, because
          it puts more effort into the middle noise levels.
        </p>
      </Remark>

      <Theorem title="all affine paths carry the same distributions">
        <p>
          Let <M>{"\\lambda_t = \\alpha_t / \\sigma_t"}</M> (<C>snr</C>). If two paths satisfy{" "}
          <M>{"\\lambda_t = \\tilde\\lambda_s"}</M>, then <M>{"\\tilde X_s = (\\tilde\\sigma_s / \\sigma_t) X_t"}</M> for the same{" "}
          <M>{"(X_0, X_1)"}</M> (<C>match</C>). Consequently the marginal flow of one path, rescaled and run on the other
          clock, is the marginal flow of the other.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(\\tilde\\sigma_s/\\sigma_t)(\\alpha_t X_1 + \\sigma_t X_0) = \\tilde\\sigma_s \\lambda_t X_1 + \\tilde\\sigma_s X_0 = \\tilde\\alpha_s X_1 + \\tilde\\sigma_s X_0"}</M>.
          For the flows: by the previous theorems the marginal velocity of either path is determined by{" "}
          <M>{"\\hat x_1"}</M> and <M>{"\\hat\\varepsilon"}</M>, and these conditional expectations agree at corresponding
          points because conditioning on <M>{"X_t"}</M> and on a fixed multiple of it carries the same information.
        </p>
        <Code>{MATCH}</Code>
      </Proof>

      <Example title="straight is not the same as easy">
        <p>
          In the figure, each conditional path of the straight interpolation is a line, but the grey marginal paths bend:
          early on, a point near zero does not yet know which bump it is heading for, and the velocity averages over both.
          With one Euler step from t = 0, where <M>{"\\hat x_1"}</M> is the data mean for every point, all samples land on that
          mean. The cosine path describes the same distributions; under uniform steps its clock spends more of them at the middle
          noise levels, where the paths bend, and here it needs fewer. Neither path is best in general; both are coordinates, and the next two lessons
          change the paths themselves.
        </p>
      </Example>

      <Remark title="why the field moved">
        <p>
          The flow matching view needs no SDE, no score and no noise schedule as such, accepts any source distribution, and
          makes every choice explicit: a path, a target, a time density and an ODE solver. It is the training formulation of
          Stable Diffusion 3, Flux and Meta&apos;s Movie Gen. The underlying object is the probability flow of chapter 1; what
          changed is how simply it is written down.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "x1",
      rung: "check",
      prompt: (
        <p>
          On the straight path a network predicts velocity 2.5 at x = 0.5 and t = 0.75. What data point does this imply?
        </p>
      ),
      answer: { kind: "numeric", value: 1.125, tolerance: 0.0005 },
    },
    {
      key: "tmatch",
      rung: "check",
      prompt: <p>At what time does the cosine path have the same signal-to-noise ratio as the straight path at t = 0.8?</p>,
      answer: { kind: "numeric", value: 0.844, tolerance: 0.0005 },
    },
    {
      key: "weight",
      rung: "apply",
      prompt: <p>On the straight path, velocity regression equals noise regression with which weight on noise level t?</p>,
      answer: {
        kind: "choice",
        options: ["1/t², largest near the pure-noise end t = 0", "1/(1 − t)², largest near the data end", "t², largest near the data end", "A constant weight"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def path_coeffs(t, kind):
    if kind == "straight":
        return t, 1 - t, 1.0, -1.0                             # alpha, sigma and their derivatives
    h = math.pi * t / 2
    return math.sin(h), math.cos(h), math.pi / 2 * math.cos(h), -math.pi / 2 * math.sin(h)

def fm_pair(x1, x0, t, kind):
    a, s, da, ds = path_coeffs(t, kind)
    return a * x1 + s * x0, da * x1 + ds * x0                  # network input and velocity target

def from_velocity(x, v, t, kind):
    a, s, da, ds = path_coeffs(t, kind)
    det = a * ds - s * da
    return (x * ds - s * v) / det, (a * v - da * x) / det      # predicted data and predicted noise

x, v = fm_pair(2.0, -1.0, 0.25, "straight"); y, w = fm_pair(2.0, -1.0, 0.5, "cosine")
print(x, v, round(y, 4), round(w, 4), [round(z, 4) for z in from_velocity(x, v, 0.25, "straight")])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.25 3.0 0.7071 3.3322 [2.0, -1.0]",
          "-0.25 3.0 0.7071 1.1107 [2.0, -1.0]",
          "0.25 3.0 0.7071 3.3322 [2.0, -1.0]",
          "-0.25 3.0 0.7071 3.3322 [-0.25, 3.0]",
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

def snr(t, kind):
    return t / (1 - t) if kind == "straight" else math.tan(math.pi * t / 2)   # alpha / sigma

def match(x, t, kind, kind2):
    lam = snr(t, kind)
    t2 = lam / (1 + lam) if kind2 == "straight" else 2 / math.pi * math.atan(lam)
    sig = lambda u, k: 1 - u if k == "straight" else math.cos(math.pi * u / 2)
    return x * sig(t2, kind2) / sig(t, kind), t2               # the same point in the other path's coordinates

def logit_normal_t(u, m, sd):
    return 1 / (1 + math.exp(-(m + sd * u)))                   # u is a standard normal draw

x2, t2 = match(-0.25, 0.25, "straight", "cosine")
print(round(snr(0.25, "straight"), 4), round(t2, 4), round(x2, 4), round(logit_normal_t(0.0, 0.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3333 0.2048 -0.3162 0.5",
          "0.3333 0.25 -0.25 0.5",
          "0.3333 0.2048 -0.2372 0.5",
          "3.0 0.7952 -0.3162 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With <C>kind</C> either <C>&quot;straight&quot;</C> or <C>&quot;cosine&quot;</C>, write <C>path_coeffs(t, kind)</C>{" "}
          returning <M>{"(\\alpha_t, \\sigma_t, \\dot\\alpha_t, \\dot\\sigma_t)"}</M>, <C>fm_pair(x1, x0, t, kind)</C> returning the
          network input and velocity target, and <C>from_velocity(x, v, t, kind)</C> returning the implied data and noise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def path_coeffs(t, kind):
    return t, 1 - t, 1.0, -1.0

def fm_pair(x1, x0, t, kind):
    return t * x1 + (1 - t) * x0, x1 - x0

def from_velocity(x, v, t, kind):
    return x + v, x - v
`,
        solution: PATHS,
        tests: [
          { name: "pair", code: `import math\nx, v = fm_pair(1.0, 3.0, 1 / 3, "cosine")\nassert abs(x - (0.5 + 3 * math.sqrt(3) / 2)) < 1e-12 and abs(v - math.pi / 2 * (math.sqrt(3) / 2 - 1.5)) < 1e-12\na, s, da, ds = path_coeffs(0.3, "straight")\nassert (a, ds) == (0.3, -1.0) and abs(s - 0.7) < 1e-12` },
          { name: "invert", code: `x, v = fm_pair(1.5, -0.5, 0.6, "straight")\nx1, e = from_velocity(x, v, 0.6, "straight")\nassert abs(x1 - 1.5) < 1e-12 and abs(e + 0.5) < 1e-12\nx, v = fm_pair(1.5, -0.5, 0.3, "cosine")\nx1, e = from_velocity(x, v, 0.3, "cosine")\nassert abs(x1 - 1.5) < 1e-12 and abs(e + 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>snr(t, kind)</C> returning <M>{"\\alpha_t/\\sigma_t"}</M>, <C>match(x, t, kind, kind2)</C> returning the point
          and time on path <C>kind2</C> that correspond to x at time t on path <C>kind</C>, and{" "}
          <C>logit_normal_t(u, m, sd)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def snr(t, kind):
    return t

def match(x, t, kind, kind2):
    return x, t

def logit_normal_t(u, m, sd):
    return m + sd * u
`,
        solution: MATCH,
        tests: [
          { name: "snr", code: `import math\nassert abs(snr(0.75, "straight") - 3.0) < 1e-12 and abs(snr(0.5, "cosine") - 1.0) < 1e-12\nassert abs(logit_normal_t(1.0, 0.5, 0.5) - 1 / (1 + math.exp(-1.0))) < 1e-12` },
          { name: "match", code: `import math\nx2, t2 = match(1.0, 0.5, "cosine", "straight")\nassert abs(t2 - 0.5) < 1e-12 and abs(x2 - 0.5 / math.cos(math.pi / 4)) < 1e-12\nx3, t3 = match(x2, t2, "straight", "cosine")\nassert abs(x3 - 1.0) < 1e-12 and abs(t3 - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "lnorm",
      rung: "stretch",
      prompt: (
        <p>
          With the logit-normal time density, m = 0 and s = 1, what fraction of training examples have t &gt; 0.75?
        </p>
      ),
      answer: { kind: "numeric", value: 0.136, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The marginal paths bend because independent noise and data pairs cross each other. Rectified flow, next, takes the
        flow&apos;s own pairing of noise and data and trains again on those pairs, straightening the paths so that a single
        step comes close.
      </p>
    </>
  ),
};
