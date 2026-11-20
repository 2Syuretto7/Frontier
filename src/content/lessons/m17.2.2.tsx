import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EdgeChaosViz } from "@/components/viz/EdgeChaosViz";
import type { LessonContent } from "@/lib/types";

const MAPS = `import math
ZS = [-6 + (i + 0.5) * 0.1 for i in range(120)]
WS = [math.exp(-z * z / 2) * 0.1 / math.sqrt(2 * math.pi) for z in ZS]

def q_star(phi, sw2, sb2, iters=200):
    q = 1.0
    for _ in range(iters):
        q = sw2 * sum(w * phi(math.sqrt(q) * z) ** 2 for z, w in zip(ZS, WS)) + sb2
    return q

def chi1(dphi, q, sw2):
    return sw2 * sum(w * dphi(math.sqrt(q) * z) ** 2 for z, w in zip(ZS, WS))

def corr_map(phi, c, q, sw2, sb2):
    s = math.sqrt(max(0.0, 1 - c * c))
    e = sum(w1 * w2 * phi(math.sqrt(q) * z1) * phi(math.sqrt(q) * (c * z1 + s * z2)) for z1, w1 in zip(ZS, WS) for z2, w2 in zip(ZS, WS))
    return (sw2 * e + sb2) / q`;

const SCALES = `import math

def depth_scale(chi):
    return math.inf if chi == 1 else -1 / math.log(chi)

def phase(chi, tol=1e-9):
    return 'critical' if abs(chi - 1) < tol else ('ordered' if chi < 1 else 'chaotic')

def relu_corr(c):
    return (math.sqrt(1 - c * c) + (math.pi - math.acos(c)) * c) / math.pi`;

export const lesson: LessonContent = {
  id: "m17.2.2",
  minutes: 50,
  links: {
    requires: ["m17.2.1"],
    revisits: ["l3.5.1", "m7.8.3"],
    foreshadows: ["m17.2.3", "m17.3.1"],
  },

  puzzle: (
    <>
      <p>
        Feed two slightly different images into a deep randomly initialised network. After fifty layers their
        representations might be identical, in which case the network cannot tell them apart and gradients carry no
        information about the difference, or they might be unrelated, in which case the network is hypersensitive to
        noise. Which happens depends on the initialisation variances. Is there a setting where neither does, and how deep
        can a network be before one of them takes over?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Follow the correlation c between the representations of two inputs from layer to layer. The value c = 1, identical
        inputs, is always a fixed point. If nearby correlations are pulled towards it, everything collapses together: the
        ordered phase. If they are pushed away, distinct inputs separate to a fixed correlation below 1: the chaotic phase.
        The slope of the map at c = 1, called χ₁, decides which, and χ₁ = 1 is the critical line, the edge of chaos.
      </p>
      <EdgeChaosViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the correlation map">
        <p>
          At the length fixed point <M>{"q^*"}</M> of m17.2.1, two inputs with pre-activation correlation c at layer l have, in the wide limit,
          correlation at layer l + 1
        </p>
        <MD>{"\\mathcal C(c) = \\frac{1}{q^*}\\Big( \\sigma_w^2\\, \\mathbb E\\big[\\phi(u_1)\\phi(u_2)\\big] + \\sigma_b^2 \\Big), \\qquad (u_1, u_2) \\sim N\\Big(0,\\ q^* \\begin{pmatrix} 1 & c \\\\ c & 1 \\end{pmatrix}\\Big)."}</MD>
        <p>
          Always <M>{"\\mathcal C(1) = 1"}</M>. Its slope there is
        </p>
        <MD>{"\\chi_1 = \\mathcal C'(1) = \\sigma_w^2\\, \\mathbb E\\big[\\phi'(\\sqrt{q^*} z)^2\\big]."}</MD>
        <p>
          Both are Gaussian integrals, one-dimensional for <M>{"\\chi_1"}</M> and two-dimensional for <M>{"\\mathcal C"}</M> (<C>q_star</C>, <C>chi1</C>,{" "}
          <C>corr_map</C>).
        </p>
        <Code>{MAPS}</Code>
      </Definition>

      <Theorem title="ordered and chaotic phases">
        <p>
          For tanh-like φ, <M>{"\\mathcal C"}</M> is increasing and convex on [0, 1]. If <M>{"\\chi_1 < 1"}</M>, c = 1 is the attracting fixed point and
          correlations converge to 1. If <M>{"\\chi_1 > 1"}</M>, c = 1 is repelling and there is a stable fixed point <M>{"c^* < 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Writing <M>{"u_2 = c u_1 + \\sqrt{1 - c^2}\\, w"}</M> and differentiating under the integral (with Gaussian integration by parts) gives{" "}
          <M>{"\\mathcal C'(c) = \\sigma_w^2\\, \\mathbb E[\\phi'(u_1)\\phi'(u_2)] \\ge 0"}</M> and{" "}
          <M>{"\\mathcal C''(c) = \\sigma_w^2 q^*\\, \\mathbb E[\\phi''(u_1)\\phi''(u_2)] \\ge 0"}</M>, the expectations of products of correlated copies of the
          same function being non-negative for c ≥ 0. A convex increasing map with <M>{"\\mathcal C(1) = 1"}</M> lies above its tangent at 1, so if the
          slope there is below 1 it lies above the diagonal on [0, 1) and iterates rise to 1. If the slope exceeds 1, the map
          is below the diagonal just left of 1, while <M>{"\\mathcal C(0) \\ge 0"}</M>, so it crosses the diagonal at some <M>{"c^* < 1"}</M>,
          attracting by convexity.
        </p>
      </Proof>

      <Example title="ReLU">
        <p>
          For ReLU, <M>{"\\chi_1 = \\sigma_w^2/2"}</M>, so He initialisation is exactly critical. With <M>{"\\sigma_w^2 = 2"}</M> and no bias the
          correlation map has the closed form <M>{"\\mathcal C(c) = \\big(\\sqrt{1 - c^2} + (\\pi - \\arccos c)\\, c\\big)/\\pi"}</M> (<C>relu_corr</C>),
          the arc-cosine kernel. It has slope 1 at c = 1 but lies above the diagonal, so correlations still drift to 1, only
          polynomially slowly rather than exponentially.
        </p>
      </Example>

      <Theorem title="depth scales">
        <p>
          Near a stable fixed point with slope χ &lt; 1, deviations shrink like <M>{"\\chi^l = e^{-l/\\xi}"}</M> with depth scale{" "}
          <M>{"\\xi = -1/\\ln \\chi"}</M> (<C>depth_scale</C>). Signals about the difference between inputs survive about ξ layers, and
          networks much deeper than ξ do not train from random initialisation. At the edge of chaos ξ diverges.
        </p>
      </Theorem>
      <Proof>
        <p>
          Linearise: <M>{"c^{l+1} - c^* \\approx \\mathcal C'(c^*)\\,(c^l - c^*)"}</M>, a geometric sequence with ratio χ = <M>{"\\mathcal C'(c^*)"}</M>. The
          link to training is through gradients. The same slope <M>{"\\chi_1"}</M> is the mean squared singular value of a layer&apos;s
          Jacobian, so backpropagated gradient norms change by <M>{"\\chi_1"}</M> per layer: they vanish in the ordered phase and explode
          in the chaotic one (l3.5.1). Only <M>{"\\chi_1 \\approx 1"}</M> keeps both forward correlations and backward gradients alive.
        </p>
        <Code>{SCALES}</Code>
      </Proof>

      <Remark title="what criticality does not give">
        <p>
          <M>{"\\chi_1 = 1"}</M> controls the average squared singular value of the input-output Jacobian, not its spread. A product of many
          random matrices can have the right average and still be badly conditioned. Making all singular values close to 1 is
          the stronger goal of dynamical isometry, next.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "chi",
      rung: "check",
      prompt: <p>A ReLU network is initialised with σ_w² = 1.8. What is χ₁?</p>,
      answer: { kind: "numeric", value: 0.9, tolerance: 0.0001 },
    },
    {
      key: "xi",
      rung: "check",
      prompt: <p>Compute the depth scale ξ = −1/ln χ for χ = 0.9. Give four decimals.</p>,
      answer: { kind: "numeric", value: 9.4912, tolerance: 0.0001 },
    },
    {
      key: "collapse",
      rung: "apply",
      prompt: <p>A deep tanh network is in the ordered phase. What happens to two different inputs as they pass through it?</p>,
      answer: {
        kind: "choice",
        options: [
          "Their representations become perfectly correlated, so the output barely depends on which one was given",
          "Their representations become uncorrelated",
          "Their lengths grow without bound",
          "Nothing systematic: correlations wander randomly",
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
ZS = [-6 + (i + 0.5) * 0.1 for i in range(120)]
WS = [math.exp(-z * z / 2) * 0.1 / math.sqrt(2 * math.pi) for z in ZS]

def q_star(phi, sw2, sb2, iters=200):
    q = 1.0
    for _ in range(iters):
        q = sw2 * sum(w * phi(math.sqrt(q) * z) ** 2 for z, w in zip(ZS, WS)) + sb2
    return q

def chi1(dphi, q, sw2):
    return sw2 * sum(w * dphi(math.sqrt(q) * z) ** 2 for z, w in zip(ZS, WS))

def corr_map(phi, c, q, sw2, sb2):
    s = math.sqrt(max(0.0, 1 - c * c))
    e = sum(w1 * w2 * phi(math.sqrt(q) * z1) * phi(math.sqrt(q) * (c * z1 + s * z2)) for z1, w1 in zip(ZS, WS) for z2, w2 in zip(ZS, WS))
    return (sw2 * e + sb2) / q

relu = lambda z: max(0.0, z); step = lambda z: 1.0 if z > 0 else 0.0; print(round(q_star(relu, 1.0, 0.5), 4), round(chi1(step, 1.0, 2.0), 4), round(chi1(step, 5.0, 1.0), 4), round(corr_map(relu, 1.0, 1.0, 2.0, 0.0), 4))
print(round(corr_map(relu, 0.0, 1.0, 2.0, 0.0), 4), round(chi1(lambda z: 1.0, 3.0, 0.8), 4), round(q_star(math.tanh, 0.5, 0.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.0 0.5 1.0\n0.3186 0.8 0.0",
          "1.0 2.0 1.0 1.0\n0.3186 0.8 0.0",
          "1.0 1.0 0.5 1.0\n0.5 2.4 0.0",
          "0.5 1.0 0.5 0.5\n0.3186 0.8 0.25",
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

def depth_scale(chi):
    return math.inf if chi == 1 else -1 / math.log(chi)

def phase(chi, tol=1e-9):
    return 'critical' if abs(chi - 1) < tol else ('ordered' if chi < 1 else 'chaotic')

def relu_corr(c):
    return (math.sqrt(1 - c * c) + (math.pi - math.acos(c)) * c) / math.pi

print(round(depth_scale(0.5), 4), depth_scale(1), phase(0.7), phase(1.3), phase(1.0))
print(relu_corr(1.0), round(relu_corr(0.0), 4), round(relu_corr(relu_corr(0.0)), 4), round(relu_corr(-1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.4427 inf ordered chaotic critical\n1.0 0.3183 0.4937 0.0",
          "0.6931 inf ordered chaotic critical\n1.0 0.3183 0.4937 0.0",
          "1.4427 0 chaotic ordered critical\n1.0 0.3183 0.4937 0.0",
          "1.4427 inf ordered chaotic critical\n1.0 0.0 0.3183 -1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the midpoint grid ZS with Gaussian weights WS, write <C>q_star(phi, sw2, sb2, iters)</C> iterating the length map from
          1, <C>chi1(dphi, q, sw2)</C>, and <C>corr_map(phi, c, q, sw2, sb2)</C> by a double sum over the grid with{" "}
          <M>{"u_2 = \\sqrt q\\,(c z_1 + \\sqrt{1 - c^2}\\, z_2)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
ZS = [-6 + (i + 0.5) * 0.1 for i in range(120)]
WS = [math.exp(-z * z / 2) * 0.1 / math.sqrt(2 * math.pi) for z in ZS]

def q_star(phi, sw2, sb2, iters=200):
    return 1.0

def chi1(dphi, q, sw2):
    return 0.0

def corr_map(phi, c, q, sw2, sb2):
    return c
`,
        solution: MAPS,
        tests: [
          { name: "length", code: `assert abs(q_star(lambda z: max(0.0, z), 1.5, 0.25) - 1.0) < 1e-4 and abs(chi1(lambda z: 2.0, 1.0, 0.5) - 2.0) < 1e-6` },
          { name: "correlation", code: `assert abs(corr_map(lambda z: z, 0.3, 2.0, 1.0, 0.2) - 0.4) < 1e-5 and abs(corr_map(lambda z: z, 0.3, 2.0, 2.0, 0.0) - 0.6) < 1e-5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>depth_scale(chi)</C>, with <C>math.inf</C> at χ = 1; <C>phase(chi, tol)</C>, returning &apos;ordered&apos;, &apos;critical&apos; or
          &apos;chaotic&apos;; and <C>relu_corr(c)</C>, the critical ReLU correlation map.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def depth_scale(chi):
    return 0.0

def phase(chi, tol=1e-9):
    return 'critical'

def relu_corr(c):
    return c
`,
        solution: SCALES,
        tests: [
          { name: "scale", code: `assert abs(depth_scale(math.exp(-0.25)) - 4.0) < 1e-9 and depth_scale(1) == math.inf and phase(0.999999) == 'ordered' and phase(2) == 'chaotic'` },
          { name: "relu", code: `assert abs(relu_corr(0.5) - 0.6089977810) < 1e-9 and abs(relu_corr(1.0) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "tanh13",
      rung: "stretch",
      prompt: (
        <p>
          For tanh with σ_w² = 1.3 and σ_b² = 0, find q* by iterating the length map, then χ₁. Is the network ordered or chaotic?
          Give χ₁ to three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.018, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        At the edge of chaos the average gradient neither grows nor shrinks, but individual directions still can. Orthogonal
        weights and the right activation make every singular value of the Jacobian close to 1: dynamical isometry.
      </p>
    </>
  ),
};
