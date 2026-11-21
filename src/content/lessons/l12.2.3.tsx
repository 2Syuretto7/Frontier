import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MinibatchOtViz } from "@/components/viz/MinibatchOtViz";
import type { LessonContent } from "@/lib/types";

const BATCH = `import itertools

def cost_matrix(xs, ys):
    return [[sum((a - b) ** 2 for a, b in zip(x, y)) for y in ys] for x in xs]

def best_pairing(C):
    n = len(C)
    return min(itertools.permutations(range(n)), key=lambda p: sum(C[i][p[i]] for i in range(n)))   # exact, for small n

def minibatch_pairs(xs, ys):
    p = best_pairing(cost_matrix(xs, ys))
    return [(xs[i], ys[p[i]]) for i in range(len(xs))]`;

const BRIDGE = `import math

def bridge_point(x0, x1, t, sigma, z):
    return (1 - t) * x0 + t * x1 + sigma * math.sqrt(t * (1 - t)) * z

def bridge_target(x, x0, x1, t):
    mean = (1 - t) * x0 + t * x1
    return x1 - x0 + (1 - 2 * t) / (2 * t * (1 - t)) * (x - mean)   # velocity that keeps x at the same standardised position

def bridge_var(t, sigma):
    return sigma * sigma * t * (1 - t)`;

export const lesson: LessonContent = {
  id: "l12.2.3",
  minutes: 55,
  links: {
    requires: ["l12.2.2", "m20.5.2"],
    revisits: ["m20.4.2", "m20.1.1"],
    foreshadows: ["l12.3.3"],
  },

  puzzle: (
    <>
      <p>
        m20.5.2 showed that pairing noise with data by optimal transport inside each minibatch is a valid coupling, and that
        its straight lines never cross. That suggests a free lunch: straighter flows from the first round of training, with no
        reflow. Yet large image models mostly train with independent pairs. What does minibatch pairing actually buy, why does
        the benefit fade where it would matter most, and what is the right object when the source is not noise at all but
        another dataset?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A minibatch of a few hundred points is a sparse sample of a high-dimensional distribution. Within it, every noise
        point is roughly equally far from every data point, so the best pairing of the batch is barely better than a random
        one; the optimal plan of the whole distributions is reached only as the batch grows, and ever more slowly as the
        dimension rises. Blurring the pairing on purpose, with entropy, and replacing straight lines by Brownian bridges gives
        a principled stochastic version: the Schrödinger bridge, the most likely way for a cloud of diffusing particles to
        move from one distribution to another.
      </p>
      <MinibatchOtViz />
    </>
  ),

  theory: (
    <>
      <Definition title="minibatch optimal-transport flow matching">
        <p>
          Draw n noise points and n data points, compute the squared-distance cost matrix (<C>cost_matrix</C>), solve the
          assignment problem for the permutation of least total cost (<C>best_pairing</C>, by brute force here; the Hungarian
          algorithm in <M>{"O(n^3)"}</M> or Sinkhorn of m20.4.2 in practice), and train the flow matching loss on the resulting
          pairs (<C>minibatch_pairs</C>). By m20.5.2 this is a coupling of the right marginals and its lines never cross within
          a batch.
        </p>
        <Code>{BATCH}</Code>
      </Definition>

      <Theorem title="larger batches never pair worse">
        <p>
          Let <M>{"c_n"}</M> be the expected mean squared distance of minibatch optimal pairs with batch size n. Then{" "}
          <M>{"c_{kn} \\le c_n"}</M> for every integer k ≥ 1, and <M>{"c_1"}</M> is the cost of independent pairs.
        </p>
      </Theorem>
      <Proof>
        <p>
          Split a batch of kn noise and kn data points, all independent, into k groups of n noise and n data points each.
          Pairing optimally within each group gives a permutation of the whole batch, so the optimal pairing of the batch costs
          at most the sum of the k group optima. Divide by kn and take expectations: each group is an independent batch of size
          n, so the right side has expectation <M>{"c_n"}</M>. With n = 1 there is only one pairing, the independent one.
        </p>
      </Proof>

      <Remark title="the rate depends on dimension">
        <p>
          As n grows, the empirical optimal plan converges to the optimal plan of the two distributions, but for smooth
          distributions in dimension d the transport cost between n samples and their distribution decays only like{" "}
          <M>{"n^{-2/d}"}</M> for d ≥ 5, the curse of dimensionality of empirical optimal transport. The figure shows the
          consequence. Images are high-dimensional, which is why minibatch pairing helps far less there than in toy problems;
          it helps more for latent-space models of lower dimension and when pairs are restricted to the same class or prompt.
        </p>
      </Remark>

      <Definition title="Brownian bridge paths">
        <p>
          Replace the straight line by a Brownian bridge: given the pair,{" "}
          <M>{"X_t = (1 - t) x_0 + t x_1 + \\sigma \\sqrt{t(1 - t)}\\, Z"}</M> with <M>{"Z \\sim \\mathcal{N}(0, I)"}</M>{" "}
          (<C>bridge_point</C>), a Gaussian with mean <M>{"\\mu_t = (1 - t)x_0 + t x_1"}</M> and variance{" "}
          <M>{"s_t^2 = \\sigma^2 t(1 - t)"}</M> per coordinate (<C>bridge_var</C>), pinned at both ends.
        </p>
      </Definition>

      <Theorem title="the velocity of a Gaussian path">
        <p>
          For a path of Gaussians <M>{"\\mathcal{N}(\\mu_t, s_t^2 I)"}</M> with differentiable <M>{"\\mu_t"}</M> and{" "}
          <M>{"s_t > 0"}</M>, the field <M>{"u_t(x) = \\dot\\mu_t + (\\dot s_t / s_t)(x - \\mu_t)"}</M> generates the path. For
          the Brownian bridge,{" "}
          <M>{"u_t(x) = x_1 - x_0 + \\frac{1 - 2t}{2t(1 - t)}(x - \\mu_t)"}</M> (<C>bridge_target</C>), the regression target of
          bridge flow matching.
        </p>
      </Theorem>
      <Proof>
        <p>
          The map <M>{"\\psi_t(z) = \\mu_t + s_t z"}</M> pushes <M>{"\\mathcal{N}(0, I)"}</M> to the path, and a point that keeps its
          standardised position z moves with velocity <M>{"\\dot\\mu_t + \\dot s_t z"}</M>; substituting{" "}
          <M>{"z = (x - \\mu_t)/s_t"}</M> gives the field, whose flow is <M>{"\\psi_t"}</M> and so carries the law along the path.
          For the bridge, <M>{"\\dot\\mu_t = x_1 - x_0"}</M> and{" "}
          <M>{"\\dot s_t / s_t = \\tfrac{1}{2}\\, \\tfrac{d}{dt}\\log(t(1 - t)) = (1 - 2t)/(2t(1 - t))"}</M>.
        </p>
        <Code>{BRIDGE}</Code>
      </Proof>

      <Theorem title="Schrödinger bridges are entropic transport plus Brownian bridges">
        <p>
          Let R be the law of Brownian motion with variance <M>{"\\sigma^2"}</M> per unit time started from <M>{"p_0"}</M>. Among
          path laws P with marginals <M>{"p_0"}</M> at time 0 and <M>{"p_1"}</M> at time 1, the one minimising{" "}
          <M>{"\\mathrm{KL}(P \\,\\|\\, R)"}</M> pairs its endpoints by the entropic optimal transport plan with regularisation{" "}
          <M>{"\\varepsilon = 2\\sigma^2"}</M> and joins each pair by a Brownian bridge.
        </p>
      </Theorem>
      <Proof>
        <p>
          The chain rule for KL divergence splits{" "}
          <M>{"\\mathrm{KL}(P \\| R) = \\mathrm{KL}(P_{01} \\| R_{01}) + \\mathbb{E}_{P_{01}} \\mathrm{KL}(P^{x_0 x_1} \\| R^{x_0 x_1})"}</M>,
          where <M>{"P_{01}"}</M> is the law of the endpoints and <M>{"P^{x_0 x_1}"}</M> the law of the path given them. The
          second term is zero exactly when every conditional path law is the reference bridge, and the constraint involves only{" "}
          <M>{"P_{01}"}</M>. For the first,{" "}
          <M>{"R_{01}(dx_0, dx_1) \\propto p_0(x_0)\\, e^{-|x_1 - x_0|^2 / (2\\sigma^2)}"}</M>, so for a coupling π with density,{" "}
          <M>{"\\mathrm{KL}(\\pi \\| R_{01}) = \\mathbb{E}_\\pi |x_1 - x_0|^2/(2\\sigma^2) - H(\\pi) + \\text{const}"}</M>, the
          entropic transport objective of m20.4.1 divided by <M>{"2\\sigma^2"}</M>.
        </p>
      </Proof>

      <Example title="two limits">
        <p>
          As σ → 0 the entropic plan tends to the optimal plan and the bridges to straight lines: minibatch OT flow matching.
          As σ → ∞ the entropic penalty dominates, the plan tends to independent pairing, and the bridges become wide. Tong and
          colleagues train a velocity on bridges from minibatch Sinkhorn pairs and, separately, a score for the bridge noise,
          which together give an SDE whose marginals approximate the Schrödinger bridge, without simulating it in training.
        </p>
      </Example>

      <Remark title="when the source is data">
        <p>
          The real strength of couplings shows when <M>{"p_0"}</M> is not noise: translating one image domain into another,
          interpolating between cell populations measured at two times, or refining a degraded image into a clean one. There
          the independent pairing is wasteful, the OT or Schrödinger pairing is meaningful in itself, and the dimension can be
          kept low by working in a learned latent space, the subject of l12.3.3.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mbcost",
      rung: "check",
      prompt: (
        <p>
          A one-dimensional batch has noise points 0, 1, 3 and data points 2, 0.5, 4. What is the mean squared distance of the
          minibatch optimal pairs?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0005 },
    },
    {
      key: "bvar",
      rung: "check",
      prompt: <p>What is the per-coordinate variance of a Brownian bridge with σ = 1 at t = 0.3?</p>,
      answer: { kind: "numeric", value: 0.21, tolerance: 0.0005 },
    },
    {
      key: "dim",
      rung: "apply",
      prompt: <p>Why does minibatch optimal transport help less for flow models on high-dimensional images?</p>,
      answer: {
        kind: "choice",
        options: [
          "A batch is a sparse sample: all cross-distances are nearly equal, so the batch optimum is close to a random pairing",
          "Optimal transport is undefined above three dimensions",
          "The Hungarian algorithm cannot handle images",
          "Minibatch pairing changes the data distribution in high dimensions",
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

def cost_matrix(xs, ys):
    return [[sum((a - b) ** 2 for a, b in zip(x, y)) for y in ys] for x in xs]

def best_pairing(C):
    n = len(C)
    return min(itertools.permutations(range(n)), key=lambda p: sum(C[i][p[i]] for i in range(n)))   # exact, for small n

def minibatch_pairs(xs, ys):
    p = best_pairing(cost_matrix(xs, ys))
    return [(xs[i], ys[p[i]]) for i in range(len(xs))]

P = minibatch_pairs([[0.0, 0.0], [2.0, 0.0]], [[2.0, 1.0], [0.0, 1.0]]); C = cost_matrix([[0.0], [1.0], [2.0]], [[1.5], [0.0], [2.5]])
print(P, best_pairing(C), sum(C[i][j] for i, j in enumerate(best_pairing(C))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[([0.0, 0.0], [0.0, 1.0]), ([2.0, 0.0], [2.0, 1.0])] (1, 0, 2) 0.5",
          "[([0.0, 0.0], [2.0, 1.0]), ([2.0, 0.0], [0.0, 1.0])] (1, 0, 2) 0.5",
          "[([0.0, 0.0], [0.0, 1.0]), ([2.0, 0.0], [2.0, 1.0])] (0, 1, 2) 3.5",
          "[([0.0, 0.0], [0.0, 1.0]), ([2.0, 0.0], [2.0, 1.0])] (1, 0, 2) 0.25",
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

def bridge_point(x0, x1, t, sigma, z):
    return (1 - t) * x0 + t * x1 + sigma * math.sqrt(t * (1 - t)) * z

def bridge_target(x, x0, x1, t):
    mean = (1 - t) * x0 + t * x1
    return x1 - x0 + (1 - 2 * t) / (2 * t * (1 - t)) * (x - mean)   # velocity that keeps x at the same standardised position

def bridge_var(t, sigma):
    return sigma * sigma * t * (1 - t)

x = bridge_point(0.0, 4.0, 0.25, 2.0, 1.0)
print(round(x, 4), round(bridge_target(x, 0.0, 4.0, 0.25), 4), bridge_var(0.5, 2.0), round(bridge_target(2.0, 0.0, 4.0, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.866 5.1547 1.0 4.0",
          "1.866 4.0 1.0 4.0",
          "1.866 5.1547 4.0 4.0",
          "1.75 5.1547 1.0 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Points are lists of coordinates. Write <C>cost_matrix(xs, ys)</C> of squared distances, <C>best_pairing(C)</C>{" "}
          returning a permutation tuple p of least total cost <C>sum(C[i][p[i]])</C>, and <C>minibatch_pairs(xs, ys)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools

def cost_matrix(xs, ys):
    return [[0.0 for y in ys] for x in xs]

def best_pairing(C):
    return tuple(range(len(C)))

def minibatch_pairs(xs, ys):
    return list(zip(xs, ys))
`,
        solution: BATCH,
        tests: [
          { name: "cost", code: `C = cost_matrix([[0.0, 1.0], [3.0, 0.0]], [[1.0, 1.0], [0.0, 0.0], [3.0, 4.0]])\nassert C == [[1.0, 1.0, 18.0], [5.0, 9.0, 16.0]]\nassert tuple(best_pairing([[5.0, 1.0, 2.0], [1.0, 6.0, 3.0], [4.0, 2.0, 0.0]])) == (1, 0, 2)` },
          { name: "pairs", code: `P = minibatch_pairs([[0.0], [5.0], [2.0]], [[4.0], [1.0], [6.0]])\nassert P == [([0.0], [1.0]), ([5.0], [6.0]), ([2.0], [4.0])]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For scalars, write <C>bridge_point(x0, x1, t, sigma, z)</C>, <C>bridge_target(x, x0, x1, t)</C> giving the velocity of
          the Brownian-bridge path at x, and <C>bridge_var(t, sigma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bridge_point(x0, x1, t, sigma, z):
    return (1 - t) * x0 + t * x1

def bridge_target(x, x0, x1, t):
    return x1 - x0

def bridge_var(t, sigma):
    return sigma * t
`,
        solution: BRIDGE,
        tests: [
          { name: "point", code: `import math\nassert abs(bridge_point(1.0, 3.0, 0.5, 4.0, -1.0) - 0.0) < 1e-12 and abs(bridge_var(0.2, 3.0) - 1.44) < 1e-12` },
          { name: "target", code: `assert abs(bridge_target(2.0, 0.0, 1.0, 0.25) - (1 + (0.5 / 0.375) * 1.75)) < 1e-12 and abs(bridge_target(5.0, 1.0, 3.0, 0.75) - (2 - (0.5 / 0.375) * 2.5)) < 1e-12` },
        ],
      },
    },
    {
      key: "excess",
      rung: "stretch",
      prompt: (
        <p>
          Noise is <M>{"\\mathcal{N}(0, I_8)"}</M> and data <M>{"\\mathcal{N}(2e_1, I_8)"}</M>. A minibatch coupling removes 40% of the
          excess cost of independent pairs over optimal transport. What is its expected squared displacement?
        </p>
      ),
      answer: { kind: "numeric", value: 13.6, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the models generate from a distribution but cannot be told what to generate. The next chapter adds
        conditioning: first by steering a sampler with a classifier&apos;s gradient, then without any classifier at all.
      </p>
    </>
  ),
};
