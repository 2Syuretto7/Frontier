import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OtPairingViz } from "@/components/viz/OtPairingViz";
import type { LessonContent } from "@/lib/types";

const PAIRS = `import itertools
import numpy as np

def interpolate(x0, x1, t):
    return (1 - t) * x0 + t * x1, x1 - x0                   # point on the line and its velocity

def cfm_loss(v, x0, x1, t):
    xt, u = interpolate(x0, x1, t)
    return float(np.sum((v(xt, t) - u) ** 2) / len(x0))     # mean over the batch of the squared error

def minibatch_ot_pairs(x0, x1):
    cost = lambda p: sum(np.sum((x0[i] - x1[j]) ** 2) for i, j in enumerate(p))
    best = min(itertools.permutations(range(len(x1))), key=cost)   # exact for tiny batches; Hungarian in practice
    return x0, x1[list(best)]`;

const CROSS = `import numpy as np

def cross_time(a0, a1, b0, b1):
    d0, d1 = a0 - b0, a1 - b1                       # gaps at t = 0 and at t = 1
    if d0 * d1 >= 0:
        return None                                 # same order at both ends: no crossing inside (0, 1)
    return d0 / (d0 - d1)

def count_crossings(x0, x1):
    n = len(x0)
    return sum(cross_time(x0[i], x1[i], x0[j], x1[j]) is not None for i in range(n) for j in range(i + 1, n))

def coupling_cost(x0, x1):
    return float(np.sum((x0 - x1) ** 2) / len(x0))`;

export const lesson: LessonContent = {
  id: "m20.5.2",
  minutes: 55,
  links: {
    requires: ["m19.5.3", "m20.3.2"],
    revisits: ["m20.1.1", "m19.6.3"],
    foreshadows: ["m20.5.3"],
  },

  puzzle: (
    <>
      <p>
        Flow matching (m19.5.3) pairs each noise sample with a data sample chosen independently, draws the straight line between
        them, and trains a network to predict the direction of travel. Yet the trajectories of the trained model are curved, and a
        sampler needs many steps to follow them. Changing one line of the training loop, so that inside each minibatch noise is
        paired with data by solving a small assignment problem, makes the trajectories visibly straighter and cuts the number of
        steps needed. Why is a different pairing still a correct training target, and why does an optimal one straighten the flow?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The network sees only the current point <M>{"x_t"}</M>, not which pair produced it. Where two conditional lines cross, it
        is asked to predict two different directions at the same place, so it learns their average, and following averaged
        directions bends the path. An optimal transport pairing is exactly a pairing whose lines never cross: if two crossed,
        swapping their partners would be cheaper. With no crossings, every point on a line has one direction to predict, and the
        learned flow follows the straight lines themselves.
      </p>
      <OtPairingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="flow matching with a coupling">
        <p>
          Let π be any coupling of the noise law <M>{"p_0"}</M> and the data law <M>{"p_1"}</M> (m20.1.2) and draw{" "}
          <M>{"(X_0, X_1) \\sim \\pi"}</M>. As before, <M>{"X_t = (1 - t)X_0 + tX_1"}</M>, the conditional velocity is{" "}
          <M>{"U = X_1 - X_0"}</M> (<C>interpolate</C>), the marginal velocity is{" "}
          <M>{"v_t(x) = \\mathbb{E}[U \\mid X_t = x]"}</M>, and the training loss at time t is{" "}
          <M>{"\\mathbb{E}|v^\\theta_t(X_t) - U|^2"}</M> (<C>cfm_loss</C>). The independent coupling{" "}
          <M>{"\\pi = p_0 \\otimes p_1"}</M> is the recipe of m19.5.3.
        </p>
        <Code>{PAIRS}</Code>
      </Definition>

      <Theorem title="every coupling gives a correct flow">
        <p>
          For any coupling π, under the smoothness conditions of m19.5.3, the ODE <M>{"\\dot x = v_t(x)"}</M> started from{" "}
          <M>{"p_0"}</M> has law <M>{"p_t"}</M>, the law of <M>{"X_t"}</M>, at every time, and reaches <M>{"p_1"}</M> at t = 1.
          The conditional loss differs from the marginal regression loss by a constant, so minimising it still recovers{" "}
          <M>{"v_t"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The proofs in m19.5.3 used only that <M>{"X_t = (1 - t)X_0 + tX_1"}</M> with <M>{"X_0 \\sim p_0"}</M> and{" "}
          <M>{"X_1 \\sim p_1"}</M>. The tower property gave the continuity equation and the cross term in the loss vanished by
          conditioning on <M>{"X_t"}</M>. Independence of <M>{"X_0"}</M> and <M>{"X_1"}</M> was never invoked.
        </p>
      </Proof>

      <Theorem title="the irreducible loss measures crossing">
        <p>
          The smallest achievable loss at time t is <M>{"\\mathbb{E}|U - v_t(X_t)|^2 = \\mathbb{E}\\operatorname{tr}\\operatorname{Var}(U \\mid X_t)"}</M>.
          It is zero exactly when the velocity of the line through each point is determined by the point, that is, when lines
          through the same point at time t have the same direction.
        </p>
      </Theorem>
      <Proof>
        <p>
          The decomposition of m19.5.3 has minimum value equal to its last term, attained at <M>{"v^\\theta = v"}</M>, and{" "}
          <M>{"\\mathbb{E}[|U - \\mathbb{E}[U \\mid X_t]|^2 \\mid X_t]"}</M> is the trace of the conditional variance. A
          nonnegative variable has zero mean only if it is zero almost surely, so the conditional variance vanishes exactly when U
          is a function of <M>{"X_t"}</M>.
        </p>
      </Proof>

      <Theorem title="optimal pairings do not cross">
        <p>
          Let <M>{"x_1, \\dots, x_n"}</M> be paired with <M>{"y_{\\sigma(1)}, \\dots, y_{\\sigma(n)}"}</M> by a permutation σ that
          minimises <M>{"\\sum_i |x_i - y_{\\sigma(i)}|^2"}</M>. Then for 0 &lt; t &lt; 1 no two distinct lines{" "}
          <M>{"(1 - t)x_i + t y_{\\sigma(i)}"}</M> meet.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take two pairs (a, b) and (c, d). Swapping partners changes the cost by
        </p>
        <MD>{"|a - d|^2 + |c - b|^2 - |a - b|^2 - |c - d|^2 = 2\\langle a - c,\\, b - d \\rangle ."}</MD>
        <p>
          If the lines meet at time t then <M>{"(1 - t)(a - c) + t(b - d) = 0"}</M>, so{" "}
          <M>{"b - d = -\\tfrac{1 - t}{t}(a - c)"}</M> and the change is <M>{"-\\tfrac{2(1 - t)}{t}|a - c|^2"}</M>. This is
          negative unless a = c, in which case b = d and the two lines are the same. A negative change contradicts the optimality
          of σ. In one dimension the optimal pairing is the sorted one (m20.1.1), and two lines cross exactly when the order of
          their endpoints flips between t = 0 and t = 1 (<C>cross_time</C>, <C>count_crossings</C>).
        </p>
        <Code>{CROSS}</Code>
      </Proof>

      <Theorem title="minibatch couplings keep the marginals">
        <p>
          Draw a batch of n noise samples and n data samples independently, choose any permutation σ that may depend on all 2n
          values, and output the pair <M>{"(x_I, y_{\\sigma(I)})"}</M> for an index I uniform on 1 to n. Then the first coordinate
          has law <M>{"p_0"}</M> and the second has law <M>{"p_1"}</M>, so this is a coupling and the previous theorems apply.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first coordinate is a uniformly chosen element of an independent sample from <M>{"p_0"}</M>. For the second, for any
          set A,{" "}
          <M>{"P(y_{\\sigma(I)} \\in A) = \\mathbb{E}\\big[\\tfrac{1}{n}\\sum_i 1\\{y_{\\sigma(i)} \\in A\\}\\big] = \\mathbb{E}\\big[\\tfrac{1}{n}\\sum_j 1\\{y_j \\in A\\}\\big] = p_1(A)"}</M>
          , because σ is a bijection and the sum over i is the same as the sum over j.
        </p>
      </Proof>

      <Example title="one Euler step">
        <p>
          A single Euler step over [0, 1] sends <M>{"x_0"}</M> to <M>{"x_0 + v_0(x_0) = \\mathbb{E}[X_1 \\mid X_0 = x_0]"}</M>.
          Under the independent coupling this is <M>{"\\mathbb{E}X_1"}</M> for every starting point: all samples collapse to the
          data mean. Under a coupling given by a map, <M>{"X_1 = T(X_0)"}</M>, it is <M>{"T(x_0)"}</M>, the right answer. If T is
          the optimal map of Brenier&apos;s theorem (m20.3.1), the lines do not cross, every trajectory of the marginal flow is a
          straight line traversed at constant speed, and the flow is the displacement interpolation of m20.3.2. Straight
          trajectories are integrated exactly by Euler&apos;s method, which is why sampling error (m19.6.3) falls when the coupling
          approaches the optimal one.
        </p>
      </Example>

      <Remark title="how close the minibatch gets">
        <p>
          A batch-optimal pairing is not the population-optimal plan: with batch size n the coupling interpolates between the
          independent one (n = 1) and the optimal plan as n grows, and in high dimension a batch of a few hundred points samples
          the data sparsely, so crossings remain. In practice the assignment is found by the Hungarian algorithm or by Sinkhorn
          (m20.4.2), at a cost small beside a network evaluation. Tong and colleagues and Pooladian and colleagues reported lower
          training variance and fewer function evaluations at sampling time on low-dimensional and image benchmarks, with smaller
          gains as dimension grows. A different route to straight paths is rectified flow, which retrains on the pairs produced by
          a trained flow and repeats.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cross",
      rung: "check",
      prompt: (
        <p>
          Two noise samples at 0 and 1 are paired with data samples at 4 and 2 respectively. At what time t do the two conditional
          lines cross? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.0006 },
    },
    {
      key: "batch",
      rung: "check",
      prompt: (
        <p>
          A minibatch has noise samples {"{0, 1, 2}"} and data samples {"{2, 5, 3}"} in one dimension. What is the mean squared
          length of the lines under the optimal pairing? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.667, tolerance: 0.0006 },
    },
    {
      key: "valid",
      rung: "apply",
      prompt: <p>Why does the minibatch OT coupling still train a flow that carries noise to the data distribution?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its two marginals are exactly the noise and data laws, and the flow-matching argument works for any coupling with those marginals",
          "Because the batch-optimal pairing equals the population-optimal plan",
          "Because the network is retrained on the independent coupling afterwards",
          "Because crossing lines are discarded from the loss",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import numpy as np

def interpolate(x0, x1, t):
    return (1 - t) * x0 + t * x1, x1 - x0                   # point on the line and its velocity

def cfm_loss(v, x0, x1, t):
    xt, u = interpolate(x0, x1, t)
    return float(np.sum((v(xt, t) - u) ** 2) / len(x0))     # mean over the batch of the squared error

def minibatch_ot_pairs(x0, x1):
    cost = lambda p: sum(np.sum((x0[i] - x1[j]) ** 2) for i, j in enumerate(p))
    best = min(itertools.permutations(range(len(x1))), key=cost)   # exact for tiny batches; Hungarian in practice
    return x0, x1[list(best)]

xt, u = interpolate(np.array([1.0, 3.0]), np.array([5.0, -1.0]), 0.75); print(xt.tolist(), u.tolist())
print(cfm_loss(lambda x, t: x, np.array([1.0, 3.0]), np.array([5.0, -1.0]), 0.75), minibatch_ot_pairs(np.array([0.0, 1.0, 2.0]), np.array([2.5, -1.0, 0.5]))[1].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 0.0] [4.0, -4.0]\n8.0 [-1.0, 0.5, 2.5]",
          "[4.0, 0.0] [-4.0, 4.0]\n8.0 [-1.0, 0.5, 2.5]",
          "[2.0, 2.0] [4.0, -4.0]\n8.0 [-1.0, 0.5, 2.5]",
          "[4.0, 0.0] [4.0, -4.0]\n8.0 [2.5, -1.0, 0.5]",
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

def cross_time(a0, a1, b0, b1):
    d0, d1 = a0 - b0, a1 - b1                       # gaps at t = 0 and at t = 1
    if d0 * d1 >= 0:
        return None                                 # same order at both ends: no crossing inside (0, 1)
    return d0 / (d0 - d1)

def count_crossings(x0, x1):
    n = len(x0)
    return sum(cross_time(x0[i], x1[i], x0[j], x1[j]) is not None for i in range(n) for j in range(i + 1, n))

def coupling_cost(x0, x1):
    return float(np.sum((x0 - x1) ** 2) / len(x0))

x0 = np.array([0.0, 1.0, 4.0]); x1 = np.array([3.0, 2.0, 1.0])
print(cross_time(0.0, 3.0, 1.0, 2.0), count_crossings(x0, x1), round(coupling_cost(x0, x1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 3 6.333", "0.5 2 6.333", "0.5 3 2.333", "None 3 6.333"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>interpolate(x0, x1, t)</C> returning the point and the conditional velocity, <C>cfm_loss(v, x0, x1, t)</C>, the
          batch mean of the squared error summed over coordinates, and <C>minibatch_ot_pairs(x0, x1)</C>, which reorders x1 to
          minimise the total squared distance.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools
import numpy as np

def interpolate(x0, x1, t):
    return t * x0 + (1 - t) * x1, x0 - x1

def cfm_loss(v, x0, x1, t):
    xt, u = interpolate(x0, x1, t)
    return float(np.mean(np.abs(v(xt, t) - u)))

def minibatch_ot_pairs(x0, x1):
    return x0, x1
`,
        solution: PAIRS,
        tests: [
          { name: "interp", code: `xt, u = interpolate(np.array([0.0, 2.0]), np.array([4.0, 2.0]), 0.25)\nassert np.allclose(xt, [1.0, 2.0]) and np.allclose(u, [4.0, 0.0])\nassert abs(cfm_loss(lambda x, t: 0 * x, np.array([0.0, 1.0]), np.array([2.0, 1.0]), 0.5) - 2.0) < 1e-12` },
          { name: "ot", code: `a, b = minibatch_ot_pairs(np.array([[0.0, 0.0], [3.0, 0.0]]), np.array([[3.0, 1.0], [0.0, 1.0]]))\nassert np.allclose(b, [[0.0, 1.0], [3.0, 1.0]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          In one dimension, write <C>cross_time(a0, a1, b0, b1)</C>, the time in (0, 1) at which the lines from a0 to a1 and from
          b0 to b1 meet, or None, <C>count_crossings(x0, x1)</C>, the number of crossing pairs, and <C>coupling_cost(x0, x1)</C>,
          the mean squared length.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cross_time(a0, a1, b0, b1):
    return 0.5

def count_crossings(x0, x1):
    return 0

def coupling_cost(x0, x1):
    return float(np.mean(np.abs(x0 - x1)))
`,
        solution: CROSS,
        tests: [
          { name: "time", code: `assert abs(cross_time(0.0, 3.0, 2.0, 0.0) - 0.4) < 1e-12 and cross_time(0.0, 1.0, 2.0, 3.0) is None` },
          { name: "count", code: `assert count_crossings(np.array([0.0, 1.0, 2.0]), np.array([2.0, 1.0, 0.0])) == 3\nassert abs(coupling_cost(np.array([0.0, 1.0]), np.array([2.0, 1.0])) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "gauss",
      rung: "stretch",
      prompt: (
        <p>
          Take <M>{"p_0 = N(0, 1)"}</M> and <M>{"p_1 = N(5, 1)"}</M> in one dimension with the independent coupling, and t uniform
          on [0, 1]. Using the Gaussian example of m19.5.3, what is the smallest possible flow-matching loss averaged over t? (Under
          the optimal coupling it is 0.) Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.571, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Transport has now served as a loss and as a pairing. The last lesson uses it as a measuring stick: a distance between whole
        datasets, computed with Sinkhorn, that can compare training sets, detect distribution shift and guide data selection.
      </p>
    </>
  ),
};
