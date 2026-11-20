import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LiouvilleViz } from "@/components/viz/LiouvilleViz";
import type { LessonContent } from "@/lib/types";

const ODE = `def euler_flow(z, v, div, t1, steps):
    h, t, total = t1 / steps, 0.0, 0.0
    z = list(z)
    for _ in range(steps):
        total += div(z, t) * h
        z = [a + h * b for a, b in zip(z, v(z, t))]
        t += h
    return z, total

def divergence_fd(v, z, t=0.0, h=1e-5):
    total = 0.0
    for i in range(len(z)):
        up = [a + (h if j == i else 0) for j, a in enumerate(z)]
        dn = [a - (h if j == i else 0) for j, a in enumerate(z)]
        total += (v(up, t)[i] - v(dn, t)[i]) / (2 * h)
    return total

def logp_after(logp0, int_div):
    return logp0 - int_div`;

const TRACE = `def matvec(M, x):
    return [sum(m * a for m, a in zip(row, x)) for row in M]

def hutchinson(M, probes):
    return sum(sum(a * b for a, b in zip(e, matvec(M, e))) for e in probes) / len(probes)

def rademacher(us):
    return [1 if u < 0.5 else -1 for u in us]`;

export const lesson: LessonContent = {
  id: "l7.4.3",
  minutes: 45,
  links: {
    requires: ["l7.4.2", "m11.8.1", "m11.6.4"],
    revisits: ["m11.8.3", "m11.7.1"],
    foreshadows: ["l12.1.3", "l12.2.1"],
  },

  puzzle: (
    <>
      <p>
        Coupling layers buy a cheap determinant by forcing half the coordinates to pass through untouched. What if each layer
        changed its input only a tiny amount, <M>{"z + h\\,v(z)"}</M> for a small step h and any network v? For small enough h
        such a map is invertible, and its determinant is close to <M>{"1 + h \\operatorname{tr} J_v"}</M>. Take infinitely many
        infinitely small steps. What does the log-determinant become, and is it any cheaper?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Infinitely many small residual steps form an ordinary differential equation: points move along a velocity field
        v(z, t). Any velocity field defines an invertible map, the solution at time 1, because running the equation backwards
        undoes it. The network v needs no special structure.
      </p>
      <p>
        As points move, a small blob of them changes volume at a rate given by the divergence of the field, the trace of its
        Jacobian. The density falls as the volume grows, so the log-density changes at minus the divergence. A trace is far
        cheaper than a determinant, and it can be estimated with random probe vectors without forming the Jacobian at all.
      </p>
      <LiouvilleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="continuous normalising flow">
        <p>
          A <em>continuous normalising flow</em> (Chen and others, 2018) defines <M>{"z(t)"}</M> by{" "}
          <M>{"dz/dt = v_\\theta(z(t), t)"}</M> from <M>{"z(0) \\sim p_0"}</M>, the base distribution, and outputs x = z(1). If{" "}
          <M>{"v_\\theta"}</M> is Lipschitz in z, solutions exist, are unique, and do not cross, so the map from z(0) to z(1) is a
          bijection whose inverse integrates the equation from t = 1 back to 0.
        </p>
      </Definition>

      <Theorem title="instantaneous change of variables">
        <p>Along a solution,</p>
        <MD>{"\\frac{d}{dt} \\log p_t(z(t)) = -\\operatorname{tr}\\Big(\\frac{\\partial v_\\theta}{\\partial z}(z(t), t)\\Big) = -\\nabla \\cdot v_\\theta(z(t), t),"}</MD>
        <p>so <M>{"\\log p_1(x) = \\log p_0(z(0)) - \\int_0^1 \\nabla \\cdot v_\\theta(z(t), t)\\, dt"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Over a step of length h the map is <M>{"z \\mapsto z + h v(z, t) + O(h^2)"}</M> with Jacobian{" "}
          <M>{"I + h J_v + O(h^2)"}</M>. Its determinant is <M>{"1 + h \\operatorname{tr} J_v + O(h^2)"}</M>, since every other term in the
          expansion of the determinant involves at least two off-identity factors. So the log-determinant of the step is{" "}
          <M>{"h \\operatorname{tr} J_v + O(h^2)"}</M>, and by the change of variables of l7.4.1,{" "}
          <M>{"\\log p_{t+h}(z(t+h)) = \\log p_t(z(t)) - h \\operatorname{tr} J_v + O(h^2)"}</M>. Dividing by h and letting h → 0 gives the
          equation. In code, the state and the integral of the divergence are advanced together (<C>euler_flow</C>), and the
          result corrects the base log-density (<C>logp_after</C>). For a linear field v = Az the flow is <M>{"e^{tA}"}</M> (m11.7.1), with
          determinant <M>{"e^{t \\operatorname{tr} A}"}</M>, as the theorem predicts.
        </p>
        <Code>{ODE}</Code>
      </Proof>

      <Remark title="computing the divergence">
        <p>
          The exact divergence needs the D diagonal entries of the Jacobian, one backward pass each (<C>divergence_fd</C> does it by
          differences), which is D times the cost of evaluating v. FFJORD (Grathwohl and others, 2019) instead uses Hutchinson&apos;s
          estimator (m11.6.4): <M>{"\\operatorname{tr} J = \\mathbb{E}[\\varepsilon^\\top J \\varepsilon]"}</M> for probes with{" "}
          <M>{"\\mathbb{E}[\\varepsilon \\varepsilon^\\top] = I"}</M>, such as Rademacher vectors of ±1 entries (<C>rademacher</C>,{" "}
          <C>hutchinson</C>). The product <M>{"\\varepsilon^\\top J"}</M> is one vector-Jacobian product, a single backward pass,
          whatever the dimension.
        </p>
        <Code>{TRACE}</Code>
      </Remark>

      <Theorem title="variance of the Rademacher estimator">
        <p>
          For Rademacher probes, the variance of <M>{"\\varepsilon^\\top M \\varepsilon"}</M> is{" "}
          <M>{"2 \\sum_{i \\ne j} S_{ij}^2"}</M>, where <M>{"S = (M + M^\\top)/2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\varepsilon^\\top M \\varepsilon = \\varepsilon^\\top S \\varepsilon = \\sum_i S_{ii} + \\sum_{i \\ne j} S_{ij} \\varepsilon_i \\varepsilon_j"}</M>, since{" "}
          <M>{"\\varepsilon_i^2 = 1"}</M>. The first sum is the trace. In the second, the terms with i &lt; j appear twice, giving{" "}
          <M>{"2\\sum_{i<j} S_{ij} \\varepsilon_i \\varepsilon_j"}</M>; the products <M>{"\\varepsilon_i \\varepsilon_j"}</M> for distinct pairs have
          mean zero, variance one and are uncorrelated, so the variance is <M>{"4\\sum_{i<j} S_{ij}^2 = 2\\sum_{i \\ne j} S_{ij}^2"}</M>.
          Diagonal entries cost nothing, which is why Rademacher probes beat Gaussian ones.
        </p>
      </Proof>

      <Remark title="costs and successors">
        <p>
          Training a continuous flow by maximum likelihood requires solving the ODE for every example, with adaptive solvers
          (m11.8.1) whose step counts grow as the learned field becomes stiff, and gradients by the adjoint method, a second ODE
          solved backwards. This made continuous flows slow to train. Flow matching (l12.2.1) keeps the continuous-time picture
          but trains the velocity field by regression on simple target paths, with no ODE solve during training, and the
          probability-flow ODE of diffusion models (l12.1.3) is a continuous flow of exactly this kind.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "volume",
      rung: "check",
      prompt: <p>A linear field v(z) = Az has trace(A) = −0.4. By what factor does the flow scale volumes between t = 0 and t = 2.5? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3679, tolerance: 0.0001 },
    },
    {
      key: "probe",
      rung: "check",
      prompt: <p>The Rademacher probe ε = (1, −1, 1) is applied to M = [[1, 2, 0], [0, 3, 1], [4, 0, 5]]. What is the estimate εᵀMε?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What does a continuous normalising flow gain over a stack of coupling layers?</p>,
      answer: {
        kind: "choice",
        options: [
          "The velocity network needs no special structure, and the log-density needs only a trace, estimable with one backward pass per probe",
          "Its likelihood needs no integration over time",
          "Sampling requires no numerical solver",
          "It can map data to a code of lower dimension",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def euler_flow(z, v, div, t1, steps):
    h, t, total = t1 / steps, 0.0, 0.0
    z = list(z)
    for _ in range(steps):
        total += div(z, t) * h
        z = [a + h * b for a, b in zip(z, v(z, t))]
        t += h
    return z, total

def divergence_fd(v, z, t=0.0, h=1e-5):
    total = 0.0
    for i in range(len(z)):
        up = [a + (h if j == i else 0) for j, a in enumerate(z)]
        dn = [a - (h if j == i else 0) for j, a in enumerate(z)]
        total += (v(up, t)[i] - v(dn, t)[i]) / (2 * h)
    return total

def logp_after(logp0, int_div):
    return logp0 - int_div

v = lambda z, t: [0.5 * z[0], -z[1]]; div = lambda z, t: -0.5; z, d = euler_flow([1.0, 1.0], v, div, 1.0, 1000); print([round(a, 3) for a in z], round(d, 6))
print(round(divergence_fd(v, [2.0, 3.0]), 6), logp_after(-1.0, -0.5), euler_flow([2.0], lambda z, t: [t], lambda z, t: 0.0, 1.0, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.649, 0.368] -0.5\n-0.5 -0.5 ([2.25], 0.0)",
          "[1.649, 0.368] -0.5\n-0.5 -1.5 ([2.25], 0.0)",
          "[1.649, 0.368] 0.5\n-0.5 -0.5 ([2.25], 0.0)",
          "[1.649, 0.368] -0.5\n-0.5 -0.5 ([2.5], 0.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matvec(M, x):
    return [sum(m * a for m, a in zip(row, x)) for row in M]

def hutchinson(M, probes):
    return sum(sum(a * b for a, b in zip(e, matvec(M, e))) for e in probes) / len(probes)

def rademacher(us):
    return [1 if u < 0.5 else -1 for u in us]

M = [[2, 1], [0, 3]]; print(matvec(M, [1, 2]), hutchinson(M, [[1, 1], [1, -1]]), rademacher([0.2, 0.7, 0.5]))
print(hutchinson(M, [[1, 0], [0, 1]]), hutchinson([[1, 2], [4, 3]], [[1, 1]]), hutchinson([[1, 2], [4, 3]], [[1, -1]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 6] 5.0 [1, -1, -1]\n2.5 10.0 -2.0",
          "[4, 6] 5.0 [1, -1, 1]\n2.5 10.0 -2.0",
          "[2, 7] 5.0 [1, -1, -1]\n2.5 10.0 -2.0",
          "[4, 6] 5.0 [1, -1, -1]\n5.0 10.0 -2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>euler_flow(z, v, div, t1, steps)</C>, advancing the state and the integral of <C>div(z, t)</C> together by forward
          Euler from t = 0 (use the divergence at the start of each step) and returning both; <C>divergence_fd(v, z, t=0.0, h=1e-5)</C>{" "}
          by central differences; and <C>logp_after(logp0, int_div)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def euler_flow(z, v, div, t1, steps):
    return list(z), 0.0

def divergence_fd(v, z, t=0.0, h=1e-5):
    return 0.0

def logp_after(logp0, int_div):
    return logp0 + int_div
`,
        solution: ODE,
        tests: [
          { name: "euler", code: `z, d = euler_flow([1.0], lambda z, t: [z[0]], lambda z, t: 1.0, 1.0, 4); assert abs(z[0] - 1.25 ** 4) < 1e-12 and abs(d - 1.0) < 1e-12
z, d = euler_flow([0.0, 0.0], lambda z, t: [1.0, t], lambda z, t: t, 1.0, 2); assert z == [1.0, 0.25] and abs(d - 0.25) < 1e-12` },
          { name: "divergence and density", code: `assert abs(divergence_fd(lambda z, t: [z[0] ** 2, 3 * z[1] + z[0]], [2.0, 5.0]) - 7) < 1e-6 and abs(divergence_fd(lambda z, t: [t * z[0]], [1.0], 2.0) - 2) < 1e-6
assert logp_after(-1.0, 0.5) == -1.5 and logp_after(0.0, -2.0) == 2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matvec(M, x)</C>, <C>hutchinson(M, probes)</C>, the average of <M>{"\\varepsilon^\\top M \\varepsilon"}</M> over the
          probes, and <C>rademacher(us)</C>, mapping each uniform below 0.5 to 1 and the rest to −1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matvec(M, x):
    return list(x)

def hutchinson(M, probes):
    return 0.0

def rademacher(us):
    return [1 for u in us]
`,
        solution: TRACE,
        tests: [
          { name: "matvec and probes", code: `assert matvec([[1, 2], [3, 4], [5, 6]], [1, -1]) == [-1, -1, -1] and rademacher([0.0, 0.49, 0.5, 0.99]) == [1, 1, -1, -1]` },
          { name: "hutchinson", code: `M = [[1, 2, 0], [0, 3, 1], [4, 0, 5]]
assert hutchinson(M, [[1, -1, 1]]) == 10 and hutchinson(M, [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) == 3
import itertools
assert abs(hutchinson(M, [list(p) for p in itertools.product([1, -1], repeat=3)]) - 9) < 1e-12` },
        ],
      },
    },
    {
      key: "variance",
      rung: "stretch",
      prompt: <p>What is the variance of the Rademacher estimate εᵀMε of the trace of M = [[1, 2], [4, 3]]?</p>,
      answer: { kind: "numeric", value: 36, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every model so far has been fitted by maximum likelihood or a bound on it. The next part drops the likelihood
        altogether: a generator is trained by a second network whose only job is to tell its samples from real data.
      </p>
    </>
  ),
};
