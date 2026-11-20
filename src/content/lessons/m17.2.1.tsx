import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LengthMapViz } from "@/components/viz/LengthMapViz";
import type { LessonContent } from "@/lib/types";

const MAP = `import math

def gauss_mean(g, m=401):
    h = 12 / (m - 1)
    zs = [-6 + i * h for i in range(m)]
    return sum(g(z) * math.exp(-z * z / 2) for z in zs) * h / math.sqrt(2 * math.pi)

def length_map(phi, q, sw2, sb2):
    return sw2 * gauss_mean(lambda z: phi(math.sqrt(q) * z) ** 2) + sb2

def iterate(phi, q0, sw2, sb2, layers):
    qs = [q0]
    for _ in range(layers):
        qs.append(length_map(phi, qs[-1], sw2, sb2))
    return qs`;

const NET = `import math, random

def relu_fixed_point(sw2, sb2):
    return sb2 / (1 - sw2 / 2) if sw2 < 2 else math.inf

def layer_variances(width, depth, sw2, sb2, phi, seed=0):
    rng = random.Random(seed)
    x = [rng.gauss(0, 1) for _ in range(width)]
    out = []
    for _ in range(depth):
        h = [phi(v) for v in x]
        x = [sum(rng.gauss(0, math.sqrt(sw2 / width)) * hj for hj in h) + rng.gauss(0, math.sqrt(sb2)) for _ in range(width)]
        out.append(sum(v * v for v in x) / width)
    return out

def close(a, b, rel=0.2):
    return abs(a - b) <= rel * abs(b)`;

export const lesson: LessonContent = {
  id: "m17.2.1",
  minutes: 45,
  links: {
    requires: ["l3.4.2", "m7.7.2"],
    revisits: ["l3.4.1", "l3.5.1"],
    foreshadows: ["m17.2.2", "m17.3.1"],
  },

  puzzle: (
    <>
      <p>
        He initialisation sets the weight variance of a ReLU layer to 2/fan-in, and the rule is usually justified by a
        one-line variance calculation. That calculation tracks one number per layer, yet a network has millions of
        pre-activations with complicated dependencies. Why should one number per layer describe a wide random network, and
        what does the same calculation say for tanh, for biases, or for a hundred layers?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a wide layer each pre-activation is a sum of many independent terms, weights times the previous layer&apos;s
        outputs, so it is approximately Gaussian, and all units in the layer have the same variance. That variance
        determines the distribution of the next layer&apos;s inputs, and hence its variance: a one-dimensional dynamical system
        running from layer to layer. Its fixed points and their stability decide whether signals die, explode or settle.
      </p>
      <LengthMapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="random networks and the length map">
        <p>
          Take <M>{"z^{l+1}_i = \\sum_{j=1}^{N} W^{l}_{ij}\\, \\phi(z^l_j) + b^l_i"}</M> with independent{" "}
          <M>{"W^l_{ij} \\sim N(0, \\sigma_w^2/N)"}</M> and <M>{"b^l_i \\sim N(0, \\sigma_b^2)"}</M>. Write{" "}
          <M>{"q^l = \\frac1N \\sum_i (z^l_i)^2"}</M> for the mean squared pre-activation of one input. The length map is
        </p>
        <MD>{"\\mathcal V(q) = \\sigma_w^2\\, \\mathbb E_{z \\sim N(0,1)}\\big[\\phi(\\sqrt q\\, z)^2\\big] + \\sigma_b^2."}</MD>
        <p>
          The expectation is a one-dimensional Gaussian integral, computed here on a grid (<C>gauss_mean</C>, <C>length_map</C>,{" "}
          <C>iterate</C>).
        </p>
        <Code>{MAP}</Code>
      </Definition>

      <Theorem title="mean-field limit">
        <p>
          As the width N → ∞, layer by layer, the pre-activations <M>{"z^{l}_i"}</M> become independent across i and Gaussian with
          variance <M>{"q^l"}</M>, and <M>{"q^{l+1} = \\mathcal V(q^l)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Induct on l. Given layer l, the <M>{"z^{l+1}_i"}</M> are, conditionally on the previous layers, exactly Gaussian with common
          variance <M>{"\\sigma_w^2 \\frac1N \\sum_j \\phi(z^l_j)^2 + \\sigma_b^2"}</M>, and independent across i because the rows of{" "}
          <M>{"W^l"}</M> are. By the inductive hypothesis the <M>{"z^l_j"}</M> are nearly independent with variance <M>{"q^l"}</M>, so the strong law
          (m18.6.1) sends the average to <M>{"\\mathbb E \\phi(\\sqrt{q^l} z)^2"}</M>. A random variance that converges to a constant gives
          Gaussian limits. At finite N the average fluctuates by about <M>{"1/\\sqrt N"}</M> per layer, and these errors multiply
          across layers, which is what the dots in the figure show at large depth.
        </p>
      </Proof>

      <Example title="ReLU and He initialisation">
        <p>
          For <M>{"\\phi = \\mathrm{relu}"}</M>, <M>{"\\mathbb E[\\mathrm{relu}(\\sqrt q z)^2] = q/2"}</M>, so{" "}
          <M>{"\\mathcal V(q) = \\tfrac12 \\sigma_w^2 q + \\sigma_b^2"}</M>. With <M>{"\\sigma_w^2 < 2"}</M> the variance converges to the fixed point{" "}
          <M>{"q^* = \\sigma_b^2/(1 - \\sigma_w^2/2)"}</M> (<C>relu_fixed_point</C>), forgetting the input&apos;s scale; with <M>{"\\sigma_w^2 > 2"}</M> it grows
          geometrically. The critical value <M>{"\\sigma_w^2 = 2"}</M>, <M>{"\\sigma_b = 0"}</M> preserves the length exactly: He initialisation
          (l3.4.2).
        </p>
      </Example>

      <Theorem title="fixed points">
        <p>
          If φ is bounded, <M>{"\\mathcal V"}</M> is bounded, so the iteration stays bounded and, <M>{"\\mathcal V"}</M> being continuous and
          increasing in q for odd monotone φ such as tanh, converges monotonically to a fixed point <M>{"q^*"}</M>. It is stable when{" "}
          <M>{"\\mathcal V'(q^*) < 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          An increasing map of an interval to itself sends a monotone sequence to a monotone sequence: if{" "}
          <M>{"q^1 \\ge q^0"}</M> then <M>{"q^2 = \\mathcal V(q^1) \\ge \\mathcal V(q^0) = q^1"}</M>, and so on. A bounded monotone sequence converges, and
          continuity makes the limit a fixed point. Linearising at <M>{"q^*"}</M>, deviations shrink by the factor{" "}
          <M>{"\\mathcal V'(q^*)"}</M> per layer.
        </p>
      </Proof>

      <Remark title="checking a finite network">
        <p>
          A simulation of the actual network, <C>layer_variances</C>, should agree with the length map up to fluctuations of order{" "}
          <M>{"1/\\sqrt N"}</M> per layer, and <C>close</C> tests agreement to a relative tolerance. The length map says nothing yet
          about how two different inputs relate as they pass through the layers. That second quantity, the correlation, is
          what separates ordered from chaotic networks in the next lesson.
        </p>
        <Code>{NET}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fixed",
      rung: "check",
      prompt: <p>A ReLU network has σ_w² = 1.2 and σ_b² = 0.12. What is the fixed point q* of the length map?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "decay",
      rung: "check",
      prompt: <p>A ReLU network has σ_w² = 1.5, σ_b² = 0 and q⁰ = 1. Compute q¹⁰. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0563, tolerance: 0.0001 },
    },
    {
      key: "he",
      rung: "apply",
      prompt: <p>Why is σ_w² = 2 special for ReLU networks without biases?</p>,
      answer: {
        kind: "choice",
        options: [
          "ReLU zeroes half of a symmetric input on average, so E[relu(z)²] = q/2 and doubling restores the variance",
          "It makes the weights orthogonal",
          "It is the largest variance for which tanh stays unsaturated",
          "It makes every pre-activation exactly unit variance at finite width",
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

def gauss_mean(g, m=401):
    h = 12 / (m - 1)
    zs = [-6 + i * h for i in range(m)]
    return sum(g(z) * math.exp(-z * z / 2) for z in zs) * h / math.sqrt(2 * math.pi)

def length_map(phi, q, sw2, sb2):
    return sw2 * gauss_mean(lambda z: phi(math.sqrt(q) * z) ** 2) + sb2

def iterate(phi, q0, sw2, sb2, layers):
    qs = [q0]
    for _ in range(layers):
        qs.append(length_map(phi, qs[-1], sw2, sb2))
    return qs

relu = lambda z: max(0.0, z); print(round(gauss_mean(lambda z: z * z), 4), round(length_map(relu, 2.0, 2.0, 0.0), 4), round(length_map(relu, 1.0, 1.0, 0.5), 4))
print([round(q, 4) for q in iterate(relu, 1.0, 1.0, 0.0, 3)], round(length_map(math.tanh, 1.0, 1.0, 0.0), 4), round(iterate(relu, 4.0, 1.0, 0.1, 60)[-1], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 2.0 1.0\n[1.0, 0.5, 0.25, 0.125] 0.3943 0.2",
          "1.0 4.0 1.0\n[1.0, 0.5, 0.25, 0.125] 0.3943 0.2",
          "1.0 2.0 1.5\n[1.0, 1.0, 1.0, 1.0] 0.3943 0.1",
          "1.0 2.0 1.0\n[1.0, 0.5, 0.25, 0.125] 0.7616 0.2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math, random

def relu_fixed_point(sw2, sb2):
    return sb2 / (1 - sw2 / 2) if sw2 < 2 else math.inf

def layer_variances(width, depth, sw2, sb2, phi, seed=0):
    rng = random.Random(seed)
    x = [rng.gauss(0, 1) for _ in range(width)]
    out = []
    for _ in range(depth):
        h = [phi(v) for v in x]
        x = [sum(rng.gauss(0, math.sqrt(sw2 / width)) * hj for hj in h) + rng.gauss(0, math.sqrt(sb2)) for _ in range(width)]
        out.append(sum(v * v for v in x) / width)
    return out

def close(a, b, rel=0.2):
    return abs(a - b) <= rel * abs(b)

print(relu_fixed_point(1.0, 0.1), relu_fixed_point(2.0, 0.1), round(relu_fixed_point(0.5, 0.3), 4))
v = layer_variances(300, 4, 2.0, 0.0, lambda z: max(0.0, z), seed=1); print(len(v), close(v[-1], 1.0, 0.3), close(4.0, 1.0), close(1.1, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2 inf 0.4\n4 True False True",
          "0.2 0.1 0.4\n4 True False True",
          "0.1 inf 0.3\n4 True False True",
          "0.2 inf 0.4\n3 False False True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gauss_mean(g, m)</C>, approximating E g(z) for standard normal z by a sum over m equally spaced points of
          [−6, 6] weighted by the density; <C>length_map(phi, q, sw2, sb2)</C>; and <C>iterate(phi, q0, sw2, sb2, layers)</C>, returning
          the list of q from layer 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gauss_mean(g, m=401):
    return 0.0

def length_map(phi, q, sw2, sb2):
    return q

def iterate(phi, q0, sw2, sb2, layers):
    return [q0]
`,
        solution: MAP,
        tests: [
          { name: "moments", code: `assert abs(gauss_mean(lambda z: 1.0) - 1) < 1e-4 and abs(gauss_mean(lambda z: z ** 4) - 3) < 1e-4` },
          { name: "relu", code: `r = lambda z: max(0.0, z)
qs = iterate(r, 1.0, 2.0, 0.5, 2)
assert len(qs) == 3 and abs(qs[2] - 2.0) < 1e-4 and abs(length_map(r, 3.0, 2.0, 0.0) - 3.0) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relu_fixed_point(sw2, sb2)</C>, returning <C>math.inf</C> when there is none; <C>layer_variances(width, depth, sw2, sb2,
          phi, seed)</C>, simulating one random network on a Gaussian input and returning the mean squared pre-activation of each
          layer; and <C>close(a, b, rel)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math, random

def relu_fixed_point(sw2, sb2):
    return 0.0

def layer_variances(width, depth, sw2, sb2, phi, seed=0):
    return []

def close(a, b, rel=0.2):
    return False
`,
        solution: NET,
        tests: [
          { name: "fixed", code: `assert abs(relu_fixed_point(1.5, 0.25) - 1.0) < 1e-12 and relu_fixed_point(2.5, 1) == math.inf` },
          { name: "simulate", code: `v = layer_variances(20, 3, 2.0, 0.0, lambda z: max(0.0, z))
assert len(v) == 3 and all(x > 0 for x in v) and close(1.05, 1.0, 0.1) and not close(2, 1)` },
        ],
      },
    },
    {
      key: "tanh",
      rung: "stretch",
      prompt: (
        <p>
          For tanh with σ_w² = 2 and σ_b² = 0, iterate the length map from q⁰ = 1 to find the stable fixed point q*. Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.618, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Two inputs entering the same random network become either more alike or less alike at each layer. Which way they go
        depends on the slope of the correlation map at its fixed point, and the boundary between the two behaviours is the
        edge of chaos.
      </p>
    </>
  ),
};
