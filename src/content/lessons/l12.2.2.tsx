import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReflowViz } from "@/components/viz/ReflowViz";
import type { LessonContent } from "@/lib/types";

const REFLOW = `import math

def pair_velocity(x, t, pairs, h):
    ws = [math.exp(-((1 - t) * a + t * b - x) ** 2 / (2 * h * h)) for a, b in pairs]
    return sum(w * (b - a) for w, (a, b) in zip(ws, pairs)) / sum(ws)   # kernel estimate of E[X1 - X0 | X_t = x]

def flow(x, vf, n):
    for i in range(n):
        x += vf(x, i / n) / n
    return x

def reflow(pairs, h, n):
    vf = lambda x, t: pair_velocity(x, t, pairs, h)
    return [(a, flow(a, vf, n)) for a, _ in pairs]            # keep each start, replace its partner`;

const COUPLINGS = `def transport_cost(pairs, p):
    return sum(abs(b - a) ** p for a, b in pairs) / len(pairs)

def crossings(pairs):
    n = len(pairs)
    return sum((pairs[i][0] - pairs[j][0]) * (pairs[i][1] - pairs[j][1]) < 0 for i in range(n) for j in range(i + 1, n))

def monotone_coupling(pairs):
    return list(zip(sorted(a for a, _ in pairs), sorted(b for _, b in pairs)))`;

export const lesson: LessonContent = {
  id: "l12.2.2",
  minutes: 55,
  links: {
    requires: ["l12.2.1"],
    revisits: ["m20.5.2", "m19.5.3"],
    foreshadows: ["l12.2.3"],
  },

  puzzle: (
    <>
      <p>
        A trained flow model carries each noise sample to an image along a curved path, so sampling needs many small steps.
        If the paths were straight lines, one step would land exactly. The paths bend because the training pairs of noise
        and image were chosen independently, and their straight lines cross. But a trained flow defines a new pairing: each
        noise sample with the image the flow carries it to. What happens if we train again on those pairs?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Flow paths cannot cross, because an ODE has one velocity at each point. So the pairs produced by a flow are more
        orderly than independent ones: nearby noise goes to nearby images. Drawing straight lines between these new pairs
        gives far fewer crossings, so the velocity field fitted to them is closer to the lines themselves, and its paths are
        straighter. Each round can only lower any convex transport cost, and the total amount of bending summed over all
        rounds is bounded, so the rounds must soon produce nearly straight flows.
      </p>
      <ReflowViz />
    </>
  ),

  theory: (
    <>
      <Definition title="rectified flow">
        <p>
          Given a coupling <M>{"(X_0, X_1)"}</M> of noise and data, let <M>{"X_t = (1 - t) X_0 + t X_1"}</M> and{" "}
          <M>{"v(x, t) = \\mathbb{E}[X_1 - X_0 \\mid X_t = x]"}</M>, learned by flow matching (<C>pair_velocity</C> estimates it
          by kernel regression). The rectified flow is the solution of <M>{"\\dot Z_t = v(Z_t, t)"}</M> with{" "}
          <M>{"Z_0 = X_0"}</M> (<C>flow</C>), and <M>{"(Z_0, Z_1)"}</M> is the rectified coupling. Reflow repeats the
          construction on the rectified coupling (<C>reflow</C>). The first round, from independent pairs, is the flow
          matching of l12.2.1.
        </p>
        <Code>{REFLOW}</Code>
      </Definition>

      <Theorem title="rectification keeps the marginals">
        <p>
          For every t, <M>{"Z_t"}</M> has the law of <M>{"X_t"}</M>. In particular <M>{"(Z_0, Z_1)"}</M> is again a coupling of the
          noise and the data.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is the marginal velocity theorem of m19.5.3, whose proof used only the tower property and never the
          independence of <M>{"X_0"}</M> and <M>{"X_1"}</M>: the law of <M>{"X_t"}</M> solves the continuity equation with
          field v, and so does the law of Z, from the same initial law.
        </p>
      </Proof>

      <Theorem title="convex transport costs do not increase">
        <p>
          For every convex c, <M>{"\\mathbb{E}\\, c(Z_1 - Z_0) \\le \\mathbb{E}\\, c(X_1 - X_0)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"Z_1 - Z_0 = \\int_0^1 v(Z_t, t)\\, dt"}</M>, so by Jensen&apos;s inequality for the uniform measure on [0, 1],{" "}
          <M>{"c(Z_1 - Z_0) \\le \\int_0^1 c(v(Z_t, t))\\, dt"}</M>. Taking expectations and using the previous theorem,{" "}
          <M>{"\\mathbb{E}\\, c(v(Z_t, t)) = \\mathbb{E}\\, c(v(X_t, t))"}</M>. By Jensen&apos;s inequality for conditional
          expectations,{" "}
          <M>{"c(v(X_t, t)) = c(\\mathbb{E}[X_1 - X_0 \\mid X_t]) \\le \\mathbb{E}[c(X_1 - X_0) \\mid X_t]"}</M>. Integrate over t.
        </p>
      </Proof>

      <Theorem title="reflow straightens">
        <p>
          Let <M>{"S(Z) = \\int_0^1 \\mathbb{E}\\|Z_1 - Z_0 - \\dot Z_t\\|^2 dt"}</M> measure how far a flow is from straight, and let{" "}
          <M>{"Z^k"}</M> be the k-th rectified flow started from a coupling <M>{"X"}</M>. Then{" "}
          <M>{"\\sum_{k=1}^{K} S(Z^k) \\le \\mathbb{E}\\|X_1 - X_0\\|^2"}</M>, so some{" "}
          <M>{"k \\le K"}</M> has <M>{"S(Z^k) \\le \\mathbb{E}\\|X_1 - X_0\\|^2 / K"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let Z rectify X with field v, and write{" "}
          <M>{"L(X) = \\int_0^1 \\mathbb{E}\\|X_1 - X_0 - v(X_t, t)\\|^2 dt \\ge 0"}</M>, the irreducible flow matching loss of
          m20.5.2. Since v is a conditional expectation, Pythagoras gives{" "}
          <M>{"\\mathbb{E}\\|X_1 - X_0\\|^2 = L(X) + \\int \\mathbb{E}\\|v(X_t, t)\\|^2 dt"}</M>. Expanding the square in S and
          using <M>{"Z_1 - Z_0 = \\int v(Z_t, t)\\, dt"}</M> gives{" "}
          <M>{"S(Z) = \\int \\mathbb{E}\\|v(Z_t, t)\\|^2 dt - \\mathbb{E}\\|Z_1 - Z_0\\|^2"}</M>, and the integrals agree by the
          marginal theorem. Subtracting,{" "}
          <M>{"\\mathbb{E}\\|X_1 - X_0\\|^2 - \\mathbb{E}\\|Z_1 - Z_0\\|^2 = L(X) + S(Z) \\ge S(Z)"}</M>. Summing this over K
          rounds telescopes, and the last cost is non-negative.
        </p>
      </Proof>

      <Theorem title="straight couplings are fixed points">
        <p>
          If the straight lines of a coupling never cross, in the sense that{" "}
          <M>{"v(X_t, t) = X_1 - X_0"}</M> almost surely for all t, then <M>{"Z_t = X_t"}</M>: the flow follows the lines and one
          Euler step from <M>{"Z_0"}</M> lands exactly on <M>{"Z_1"}</M>. In one dimension the first rectification already gives
          such a coupling, the monotone one, which minimises every convex cost.
        </p>
      </Theorem>
      <Proof>
        <p>
          The line <M>{"x(t) = (1 - t)X_0 + t X_1"}</M> has derivative <M>{"X_1 - X_0 = v(x(t), t)"}</M>, so it solves the ODE,
          and by uniqueness it is Z. In one dimension, solutions of an ODE with a Lipschitz field cannot pass each other, so{" "}
          <M>{"Z_1"}</M> is an increasing function of <M>{"Z_0"}</M>. Lines of a monotone coupling never cross: if{" "}
          <M>{"a < a'"}</M> and <M>{"b \\le b'"}</M>, then <M>{"(1 - t)a + tb < (1 - t)a' + tb'"}</M> for t &lt; 1 (<C>crossings</C>{" "}
          counts violations). That the monotone coupling (<C>monotone_coupling</C>) is optimal for convex costs is the
          one-dimensional optimal transport theorem.
        </p>
        <Code>{COUPLINGS}</Code>
      </Proof>

      <Example title="the figure">
        <p>
          With independent pairs the mean squared displacement is about 10. The first rectified flow lowers it to about 3.5
          and its paths never cross, yet they bend so much that one Euler step misses the endpoint by almost 3. After one
          reflow, the cost barely changes, but the single-step error falls to about 0.13: the coupling was already good, and
          what reflow fixed was the shape of the paths.
        </p>
      </Example>

      <Remark title="in practice">
        <p>
          Reflow costs a full sampling run per training pair, and each round compounds the learned model&apos;s errors, so
          practitioners stop after one or two rounds and then distil: train a network to jump from <M>{"Z_0"}</M> to{" "}
          <M>{"Z_1"}</M> directly, which is easy once the paths are straight. Liu and colleagues&apos; InstaFlow turned Stable
          Diffusion into a one-step generator this way. Reflow guarantees non-crossing paths, not the optimal transport
          coupling in several dimensions; m20.5.2 approached the problem from the other side, by pairing with minibatch optimal
          transport before training, which the next lesson takes up.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost1d",
      rung: "check",
      prompt: (
        <p>
          Noise is <M>{"\\mathcal{N}(0, 1)"}</M> and data are <M>{"\\mathcal{N}(3, 0.5^2)"}</M> in one dimension. What is{" "}
          <M>{"\\mathbb{E}(Z_1 - Z_0)^2"}</M> for the rectified coupling of independent pairs?
        </p>
      ),
      answer: { kind: "numeric", value: 9.25, tolerance: 0.0005 },
    },
    {
      key: "cross",
      rung: "check",
      prompt: <p>How many pairs of lines cross in the coupling (0, 3), (1, 1), (2, 0), (3, 2)?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
    {
      key: "marg",
      rung: "apply",
      prompt: <p>Why does training on the pairs produced by a flow still yield a model of the same data distribution?</p>,
      answer: {
        kind: "choice",
        options: [
          "The flow carries the noise distribution exactly to the data distribution, so its pairs are a coupling with the same marginals",
          "Reflow adds the original data back into every batch",
          "The new pairs are independent, like the original ones",
          "The data distribution changes, but only slightly",
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

def pair_velocity(x, t, pairs, h):
    ws = [math.exp(-((1 - t) * a + t * b - x) ** 2 / (2 * h * h)) for a, b in pairs]
    return sum(w * (b - a) for w, (a, b) in zip(ws, pairs)) / sum(ws)   # kernel estimate of E[X1 - X0 | X_t = x]

def flow(x, vf, n):
    for i in range(n):
        x += vf(x, i / n) / n
    return x

def reflow(pairs, h, n):
    vf = lambda x, t: pair_velocity(x, t, pairs, h)
    return [(a, flow(a, vf, n)) for a, _ in pairs]            # keep each start, replace its partner

P = [(-1.0, 1.0), (1.0, -1.0)]; vf = lambda x, t: pair_velocity(x, t, P, 0.5)
print(round(pair_velocity(0.0, 0.5, P, 0.5), 4), round(pair_velocity(-1.0, 0.0, P, 0.5), 4), round(flow(-1.0, vf, 50), 4), [round(b, 2) for _, b in reflow(P, 0.5, 50)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 1.9987 -0.9468 [-0.95, 0.95]",
          "0.0 1.9987 1.0 [1.0, -1.0]",
          "2.0 1.9987 -0.9468 [-0.95, 0.95]",
          "0.0 2.0 0.0 [0.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def transport_cost(pairs, p):
    return sum(abs(b - a) ** p for a, b in pairs) / len(pairs)

def crossings(pairs):
    n = len(pairs)
    return sum((pairs[i][0] - pairs[j][0]) * (pairs[i][1] - pairs[j][1]) < 0 for i in range(n) for j in range(i + 1, n))

def monotone_coupling(pairs):
    return list(zip(sorted(a for a, _ in pairs), sorted(b for _, b in pairs)))

Q = [(0.0, 2.0), (1.0, 0.0), (2.0, 1.0)]
print(transport_cost(Q, 2), crossings(Q), monotone_coupling(Q), transport_cost(monotone_coupling(Q), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 2 [(0.0, 0.0), (1.0, 1.0), (2.0, 2.0)] 0.0",
          "2.0 1 [(0.0, 0.0), (1.0, 1.0), (2.0, 2.0)] 0.0",
          "2.0 2 [(0.0, 2.0), (1.0, 1.0), (2.0, 0.0)] 2.6667",
          "1.0 2 [(0.0, 0.0), (1.0, 1.0), (2.0, 2.0)] 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For one-dimensional pairs <C>(x0, x1)</C>, write <C>pair_velocity(x, t, pairs, h)</C>, the Gaussian-kernel average of{" "}
          <C>x1 - x0</C> weighted by distance from x to each pair&apos;s point at time t; <C>flow(x, vf, n)</C>, n Euler steps
          from t = 0 to 1; and <C>reflow(pairs, h, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pair_velocity(x, t, pairs, h):
    return sum(b - a for a, b in pairs) / len(pairs)

def flow(x, vf, n):
    return x + vf(x, 0)

def reflow(pairs, h, n):
    return pairs
`,
        solution: REFLOW,
        tests: [
          { name: "vel", code: `import math\nP = [(0.0, 2.0), (2.0, 2.0)]\nw = math.exp(-0.5)\nassert abs(pair_velocity(1.0, 0.5, P, 1.0) - 2 / (1 + w)) < 1e-12\nassert abs(flow(1.0, lambda x, t: 2 * t, 4) - 1.75) < 1e-12` },
          { name: "reflow", code: `P = [(-1.0, 1.0), (1.0, -1.0)]\nR = reflow(P, 0.5, 50)\nassert [a for a, _ in R] == [-1.0, 1.0] and R[0][1] < 0 < R[1][1] and abs(R[0][1] + R[1][1]) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>transport_cost(pairs, p)</C>, the mean of <M>{"|x_1 - x_0|^p"}</M>; <C>crossings(pairs)</C>, the number of
          pairs of pairs whose straight lines cross; and <C>monotone_coupling(pairs)</C>, which pairs the sorted starts with
          the sorted ends.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def transport_cost(pairs, p):
    return sum(b - a for a, b in pairs)

def crossings(pairs):
    return 0

def monotone_coupling(pairs):
    return pairs
`,
        solution: COUPLINGS,
        tests: [
          { name: "cost", code: `assert abs(transport_cost([(0.0, 3.0), (2.0, 1.0)], 2) - 5.0) < 1e-12 and abs(transport_cost([(0.0, -3.0), (2.0, 1.0)], 1) - 2.0) < 1e-12\nassert crossings([(0.0, 3.0), (1.0, 2.0), (2.0, 1.0)]) == 3 and crossings([(0.0, 0.0), (1.0, 1.0)]) == 0` },
          { name: "mono", code: `M = monotone_coupling([(2.0, 0.0), (0.0, 5.0), (1.0, 3.0)])\nassert M == [(0.0, 0.0), (1.0, 3.0), (2.0, 5.0)]` },
        ],
      },
    },
    {
      key: "onestep",
      rung: "stretch",
      prompt: (
        <p>
          Noise <M>{"\\mathcal{N}(0, 1)"}</M>, data <M>{"\\mathcal{N}(3, 0.5^2)"}</M>. After one reflow, one Euler step of the new
          velocity from <M>{"z_0 = 1"}</M> lands where? (Before reflow, one step from any start lands on 3.)
        </p>
      ),
      answer: { kind: "numeric", value: 3.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Reflow fixes the pairing after training. The alternative is to fix it before: pair each noise sample with a nearby
        data point from the start, using optimal transport within each minibatch, so that the very first flow is nearly
        straight.
      </p>
    </>
  ),
};
