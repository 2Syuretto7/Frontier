import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OgdRegretViz } from "@/components/viz/OgdRegretViz";
import type { LessonContent } from "@/lib/types";

const OGD = `import math

def project_ball(x, r):
    n = math.sqrt(sum(v * v for v in x))
    return x[:] if n <= r else [v * r / n for v in x]

def ogd(grad, x0, eta, T, r):
    x, xs = x0[:], []
    for t in range(T):
        xs.append(x)
        g = grad(t, x)
        x = project_ball([a - eta * b for a, b in zip(x, g)], r)
    return xs

def ogd_bound(D, G, eta, T):
    return D * D / (2 * eta) + eta * G * G * T / 2`;

const STEPS = `import math

def best_eta(D, G, T):
    return D / (G * math.sqrt(T))

def anytime_etas(D, G, T):
    return [D / (G * math.sqrt(t)) for t in range(1, T + 1)]

def strongly_convex_bound(G, alpha, T):
    return G * G / (2 * alpha) * (1 + math.log(T))`;

export const lesson: LessonContent = {
  id: "m16.6.2",
  minutes: 40,
  links: {
    requires: ["m16.6.1", "m10.5.1"],
    revisits: ["m16.4.1", "m10.7.4"],
    foreshadows: ["m16.6.3", "m16.7.3"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent was built to minimise one fixed function. In online learning the function changes every round, and
        an adversary picks the next one after seeing where you stand. Taking a gradient step on yesterday&apos;s loss seems
        hopeless against such an opponent. Why does it nonetheless guarantee regret of order √T on any sequence of convex
        losses?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A gradient step on the current loss moves you towards every point that does better on it, the best fixed point
        included. Your squared distance to that point therefore falls by roughly the amount of excess loss you just paid, up
        to a term of order η². Distance cannot fall below zero, so total excess loss is bounded by the starting distance
        over η plus η times the number of rounds. Balancing the two gives √T.
      </p>
      <OgdRegretViz />
    </>
  ),

  theory: (
    <>
      <Definition title="online gradient descent">
        <p>
          Let K be a closed convex set of diameter D and <M>{"\\Pi_K"}</M> the Euclidean projection onto K. Starting from{" "}
          <M>{"x_1 \\in K"}</M>, after seeing the convex loss <M>{"f_t"}</M> pick a subgradient <M>{"g_t \\in \\partial f_t(x_t)"}</M> and set
        </p>
        <MD>{"x_{t+1} = \\Pi_K(x_t - \\eta_t g_t)."}</MD>
        <p>
          For a ball of radius r the projection rescales any point outside it (<C>project_ball</C>); <C>ogd</C> runs the method
          with a fixed step.
        </p>
      </Definition>

      <Theorem title="Zinkevich">
        <p>If every <M>{"\\|g_t\\| \\le G"}</M> and the step is a constant η, then for every u ∈ K</p>
        <MD>{"\\sum_{t=1}^T f_t(x_t) - f_t(u) \\le \\frac{D^2}{2\\eta} + \\frac{\\eta G^2 T}{2}."}</MD>
        <p>With <M>{"\\eta = D/(G\\sqrt T)"}</M> the regret is at most <M>{"DG\\sqrt T"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Projection onto a convex set does not increase distances to points of the set, so
        </p>
        <MD>{"\\|x_{t+1} - u\\|^2 \\le \\|x_t - \\eta g_t - u\\|^2 = \\|x_t - u\\|^2 - 2\\eta\\, g_t^\\top(x_t - u) + \\eta^2 \\|g_t\\|^2."}</MD>
        <p>
          By convexity <M>{"f_t(x_t) - f_t(u) \\le g_t^\\top(x_t - u) \\le \\frac{\\|x_t - u\\|^2 - \\|x_{t+1} - u\\|^2}{2\\eta} + \\frac{\\eta G^2}{2}"}</M>. Summing,
          the distances telescope to at most <M>{"\\|x_1 - u\\|^2 \\le D^2"}</M>, which gives the bound (<C>ogd_bound</C>). Minimising
          over η gives the second claim (<C>best_eta</C>).
        </p>
        <Code>{OGD}</Code>
      </Proof>

      <Theorem title="steps that do not need T">
        <p>For a non-increasing sequence <M>{"\\eta_t"}</M> the same argument gives</p>
        <MD>{"\\mathrm{Regret}_T \\le \\frac{D^2}{2\\eta_T} + \\frac{G^2}{2}\\sum_{t=1}^T \\eta_t,"}</MD>
        <p>and <M>{"\\eta_t = D/(G\\sqrt t)"}</M> yields at most <M>{"\\tfrac32 DG\\sqrt T"}</M> for every T at once.</p>
      </Theorem>
      <Proof>
        <p>
          Divide the distance inequality by <M>{"2\\eta_t"}</M> before summing. The distance terms become{" "}
          <M>{"\\sum_t \\|x_t - u\\|^2 (1/\\eta_t - 1/\\eta_{t-1})/2 \\le D^2/(2\\eta_T)"}</M> since every bracket is non-negative. With the
          given steps (<C>anytime_etas</C>) the first term is <M>{"DG\\sqrt T/2"}</M>, and{" "}
          <M>{"\\sum_{t \\le T} 1/\\sqrt t \\le 2\\sqrt T"}</M> bounds the second by <M>{"DG\\sqrt T"}</M>.
        </p>
      </Proof>

      <Theorem title="strongly convex losses">
        <p>
          If every <M>{"f_t"}</M> is α-strongly convex, the steps <M>{"\\eta_t = 1/(\\alpha t)"}</M> give
        </p>
        <MD>{"\\mathrm{Regret}_T \\le \\frac{G^2}{2\\alpha}(1 + \\log T)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Strong convexity adds <M>{"-\\tfrac\\alpha2\\|x_t - u\\|^2"}</M> to the right side of the convexity inequality. With{" "}
          <M>{"1/\\eta_t - 1/\\eta_{t-1} = \\alpha"}</M> this exactly cancels the distance terms, leaving{" "}
          <M>{"\\tfrac{G^2}{2}\\sum_t \\tfrac1{\\alpha t}"}</M>, and the harmonic sum is at most <M>{"1 + \\log T"}</M>{" "}
          (<C>strongly_convex_bound</C>). Regularised losses like those of m16.4.2 are strongly convex, which is why their
          online and stochastic versions converge so much faster.
        </p>
        <Code>{STEPS}</Code>
      </Proof>

      <Remark title="optimality and consequences">
        <p>
          The √T rate cannot be improved for convex Lipschitz losses: linear losses <M>{"\\pm G x"}</M> on an interval with random
          signs force expected regret of order <M>{"DG\\sqrt T"}</M> on any algorithm. Through online-to-batch conversion (m16.6.1),
          one pass of online gradient descent over m samples is stochastic gradient descent and has excess risk{" "}
          <M>{"O(DG/\\sqrt m)"}</M>. Replacing the Euclidean distance by a Bregman divergence gives online mirror descent
          (m10.7.4), which on the simplex is the subject of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eta",
      rung: "check",
      prompt: <p>The feasible set has diameter 2, gradients have norm at most 4 and T = 400. What fixed step size minimises Zinkevich&apos;s bound?</p>,
      answer: { kind: "numeric", value: 0.025, tolerance: 0.0001 },
    },
    {
      key: "tuned",
      rung: "check",
      prompt: <p>With D = 1, G = 3 and the best fixed step, what is the regret bound after T = 10000 rounds?</p>,
      answer: { kind: "numeric", value: 300, tolerance: 0.001 },
    },
    {
      key: "projection",
      rung: "apply",
      prompt: <p>Why does the projection step not spoil the regret analysis?</p>,
      answer: {
        kind: "choice",
        options: [
          "Projecting onto a convex set never increases the distance to any point of the set, including the comparator",
          "The projection is only applied in the last round",
          "Projection makes the losses strongly convex",
          "The comparator is always the projection of the origin",
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

def project_ball(x, r):
    n = math.sqrt(sum(v * v for v in x))
    return x[:] if n <= r else [v * r / n for v in x]

def ogd(grad, x0, eta, T, r):
    x, xs = x0[:], []
    for t in range(T):
        xs.append(x)
        g = grad(t, x)
        x = project_ball([a - eta * b for a, b in zip(x, g)], r)
    return xs

def ogd_bound(D, G, eta, T):
    return D * D / (2 * eta) + eta * G * G * T / 2

print(project_ball([3.0, 4.0], 1.0), project_ball([0.3, 0.4], 1.0), ogd_bound(2.0, 1.0, 0.5, 8))
print(ogd(lambda t, x: [1.0], [0.0], 0.5, 4, 1.0), ogd(lambda t, x: [x[0] - 2.0], [0.0], 1.0, 3, 1.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.6, 0.8] [0.3, 0.4] 6.0\n[[0.0], [-0.5], [-1.0], [-1.0]] [[0.0], [1.5], [1.5]]",
          "[0.6, 0.8] [0.3, 0.4] 6.0\n[[0.0], [-0.5], [-1.0], [-1.5]] [[0.0], [2.0], [2.0]]",
          "[0.6, 0.8] [0.6, 0.8] 6.0\n[[0.0], [-0.5], [-1.0], [-1.0]] [[0.0], [1.5], [1.5]]",
          "[3.0, 4.0] [0.3, 0.4] 4.5\n[[-0.5], [-1.0], [-1.0], [-1.0]] [[1.5], [1.5], [1.5]]",
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

def best_eta(D, G, T):
    return D / (G * math.sqrt(T))

def anytime_etas(D, G, T):
    return [D / (G * math.sqrt(t)) for t in range(1, T + 1)]

def strongly_convex_bound(G, alpha, T):
    return G * G / (2 * alpha) * (1 + math.log(T))

print(best_eta(2.0, 1.0, 16), [round(e, 3) for e in anytime_etas(1.0, 2.0, 4)])
print(round(strongly_convex_bound(2.0, 1.0, 1), 3), round(strongly_convex_bound(1.0, 0.5, math.e ** 2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 [0.5, 0.354, 0.289, 0.25]\n2.0 3.0",
          "0.125 [0.5, 0.354, 0.289, 0.25]\n2.0 3.0",
          "0.5 [2.0, 1.414, 1.155, 1.0]\n2.0 3.0",
          "0.5 [0.5, 0.354, 0.289, 0.25]\n4.0 1.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>project_ball(x, r)</C> onto the centred ball of radius r, <C>ogd(grad, x0, eta, T, r)</C> returning the T
          iterates <M>{"x_1, \\dots, x_T"}</M> where <C>grad(t, x)</C> gives the gradient in round t (counting from 0), and{" "}
          <C>ogd_bound(D, G, eta, T)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def project_ball(x, r):
    return x[:]

def ogd(grad, x0, eta, T, r):
    return [x0[:] for _ in range(T)]

def ogd_bound(D, G, eta, T):
    return 0.0
`,
        solution: OGD,
        tests: [
          { name: "projection", code: `p = project_ball([0.0, -6.0, 8.0], 5.0)
assert all(abs(u - v) < 1e-12 for u, v in zip(p, [0.0, -3.0, 4.0])) and project_ball([1.0, 1.0], 2.0) == [1.0, 1.0] and abs(ogd_bound(1.0, 2.0, 0.25, 10) - 7.0) < 1e-12` },
          { name: "descent", code: `xs = ogd(lambda t, x: [1.0 if t % 2 else -1.0, 0.0], [0.0, 0.0], 0.75, 4, 1.0)
assert len(xs) == 4 and all(abs(a - b) < 1e-12 for p, q in zip(xs, [[0.0, 0.0], [0.75, 0.0], [0.0, 0.0], [0.75, 0.0]]) for a, b in zip(p, q))
ys = ogd(lambda t, x: [-4.0, -3.0], [0.0, 0.0], 1.0, 2, 2.0)
assert all(abs(a - b) < 1e-12 for a, b in zip(ys[1], [1.6, 1.2]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_eta(D, G, T)</C>, <C>anytime_etas(D, G, T)</C> returning <M>{"\\eta_1, \\dots, \\eta_T"}</M> with{" "}
          <M>{"\\eta_t = D/(G\\sqrt t)"}</M>, and <C>strongly_convex_bound(G, alpha, T)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def best_eta(D, G, T):
    return 1.0

def anytime_etas(D, G, T):
    return [1.0] * T

def strongly_convex_bound(G, alpha, T):
    return 0.0
`,
        solution: STEPS,
        tests: [
          { name: "steps", code: `assert abs(best_eta(3.0, 2.0, 9) - 0.5) < 1e-12 and len(anytime_etas(2.0, 1.0, 5)) == 5 and all(abs(a - b) < 1e-12 for a, b in zip(anytime_etas(2.0, 1.0, 4), [2.0, 2 ** 0.5, 2 / 3 ** 0.5, 1.0]))` },
          { name: "strongly convex", code: `assert abs(strongly_convex_bound(3.0, 1.5, 1) - 3.0) < 1e-12 and abs(strongly_convex_bound(2.0, 4.0, math.e) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "anytime",
      rung: "stretch",
      prompt: (
        <p>
          With D = G = 1 and the steps <M>{"\\eta_t = 1/\\sqrt t"}</M>, evaluate the bound{" "}
          <M>{"D^2/(2\\eta_T) + (G^2/2)\\sum_t \\eta_t"}</M> exactly (not the 3/2 simplification) for T = 100. Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 14.29, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        On the simplex of probability vectors with linear losses, Euclidean steps waste a factor of √N. Multiplicative
        updates, the entropic version of the same idea, cut it to √(log N) and give the classical experts algorithm.
      </p>
    </>
  ),
};
