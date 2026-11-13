import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TsnePerplexityViz } from "@/components/viz/TsnePerplexityViz";
import type { LessonContent } from "@/lib/types";

const AFF = `import numpy as np

def cond_probs(d2, sigma):
    w = np.exp(-(d2 - d2.min()) / (2 * sigma ** 2))
    p = w / w.sum()
    nz = p[p > 0]
    return p, float(2 ** -(nz * np.log2(nz)).sum())

def find_sigma(d2, target, lo=1e-3, hi=1e3, iters=60):
    for _ in range(iters):
        mid = np.sqrt(lo * hi)
        if cond_probs(d2, mid)[1] > target:
            hi = mid
        else:
            lo = mid
    return float(np.sqrt(lo * hi))`;

const GRAD = `import numpy as np

def q_matrix(Y):
    d2 = ((Y[:, None] - Y[None]) ** 2).sum(-1)
    num = 1 / (1 + d2)
    np.fill_diagonal(num, 0)
    return num / num.sum(), num

def tsne_grad(P, Y):
    Q, num = q_matrix(Y)
    return 4 * (((P - Q) * num)[:, :, None] * (Y[:, None] - Y[None])).sum(axis=1)`;

export const lesson: LessonContent = {
  id: "l2.6.4",
  minutes: 50,
  links: {
    requires: ["l2.6.1", "m7.5.4"],
    revisits: ["l2.5.3", "l2.6.3"],
    foreshadows: ["l2.8.3"],
  },

  puzzle: (
    <>
      <p>
        A paper shows a t-SNE plot of single-cell data with two well-separated blobs, one twice the size of the other and
        far from a third. The authors conclude that the first cell type is more varied than the second and closer to it
        than to the third. Which of these conclusions does the plot actually support?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        t-SNE does not try to preserve distances. It turns distances into neighbour probabilities, separately for each
        point with its own bandwidth, and then looks for a picture whose neighbour probabilities match. Because every point
        is given about the same number of effective neighbours, a sparse cluster and a dense one end up looking alike, and
        because the cost barely cares about pairs that are far apart, gaps between clusters are mostly arbitrary. What
        survives is who sits next to whom.
      </p>
      <TsnePerplexityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="neighbour probabilities and perplexity">
        <p>
          For point i with squared distances <M>{"d_{ij}^2"}</M> to the others, set{" "}
          <M>{"p_{j \\mid i} \\propto \\exp(-d_{ij}^2 / 2\\sigma_i^2)"}</M>, normalised over j ≠ i. The perplexity of this
          distribution is <M>{"2^{H_i}"}</M> with <M>{"H_i = -\\sum_j p_{j \\mid i}\\log_2 p_{j \\mid i}"}</M>, an effective
          number of neighbours: a uniform distribution over m points has perplexity m. Each <M>{"\\sigma_i"}</M> is chosen by
          bisection so that every point has the same, user-chosen perplexity; this works because perplexity rises with{" "}
          <M>{"\\sigma_i"}</M>, from 1 (the nearest point) towards n − 1 (all points equally). Then{" "}
          <M>{"p_{ij} = (p_{j \\mid i} + p_{i \\mid j})/2n"}</M>, a symmetric distribution over pairs.
        </p>
        <Code>{AFF}</Code>
      </Definition>

      <Theorem title="the t-SNE objective and its gradient">
        <p>
          Embedded points <M>{"y_i \\in \\mathbb R^2"}</M> get{" "}
          <M>{"q_{ij} = w_{ij}/Z"}</M> with <M>{"w_{ij} = (1 + \\lVert y_i - y_j\\rVert^2)^{-1}"}</M> and{" "}
          <M>{"Z = \\sum_{k \\neq l} w_{kl}"}</M>. t-SNE minimises <M>{"\\mathrm{KL}(P \\,\\Vert\\, Q) = \\sum p_{ij}\\log(p_{ij}/q_{ij})"}</M>, whose gradient is
        </p>
        <MD>{"\\frac{\\partial\\,\\mathrm{KL}}{\\partial y_i} = 4\\sum_j (p_{ij} - q_{ij})\\,w_{ij}\\,(y_i - y_j)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"\\log q_{kl} = \\log w_{kl} - \\log Z"}</M> and <M>{"\\sum p_{kl} = 1"}</M>, the objective is a
          constant plus <M>{"\\sum_{k \\neq l} p_{kl}\\log(1 + \\lVert y_k - y_l\\rVert^2) + \\log Z"}</M>. Point i appears in
          the pairs (i, j) and (j, i), so the first sum has derivative{" "}
          <M>{"2\\sum_j p_{ij}\\cdot 2(y_i - y_j)w_{ij}"}</M>. For the second,{" "}
          <M>{"\\partial w_{ij}/\\partial y_i = -2w_{ij}^2(y_i - y_j)"}</M>, so{" "}
          <M>{"\\partial\\log Z/\\partial y_i = \\frac{2}{Z}\\sum_j(-2w_{ij}^2)(y_i - y_j) = -4\\sum_j q_{ij}w_{ij}(y_i - y_j)"}</M>.
          Adding the two gives the formula. Each term is an attraction when <M>{"p_{ij} > q_{ij}"}</M> and a repulsion
          when <M>{"p_{ij} < q_{ij}"}</M>.
        </p>
        <Code>{GRAD}</Code>
      </Proof>

      <Remark title="why heavy tails, and what they cost">
        <p>
          In ten dimensions a point can have many neighbours all at about the same moderate distance; in two dimensions
          there is not enough room for them, so they get crowded. The Student-t kernel decays like a power, not
          exponentially, so moderately dissimilar points can be placed far apart at little cost, which opens gaps between
          clusters. The KL cost is lopsided: a pair with large <M>{"p_{ij}"}</M> and tiny <M>{"q_{ij}"}</M> is expensive,
          but a pair with tiny <M>{"p_{ij}"}</M> contributes almost nothing wherever it is placed. So neighbourhoods are
          kept, and large distances are not.
        </p>
      </Remark>

      <Remark title="reading a t-SNE or UMAP plot">
        <p>
          In the viz, cluster B is ten times wider than A in the data, and the gap from B to C is four times the gap from A
          to B. At perplexity 3 the plot shows width ratio about 1.1 and gap ratio about 1.1; at perplexity 30, about 4
          and 3. So cluster sizes and distances between clusters should not be read off the plot; the perplexity changes
          the picture, so try several; the random start changes it too, so try several seeds; and pure noise at low
          perplexity can show clumps that are not there. Membership of local neighbourhoods is what the method is built to
          preserve. UMAP replaces P with a fuzzy nearest-neighbour graph and KL with a cross-entropy that also pushes apart
          non-neighbours; it is faster and keeps somewhat more global layout, but the same cautions apply. Use these plots
          to form hypotheses, then test them on the original data.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "perp",
      rung: "check",
      prompt: <p>A point&apos;s conditional distribution puts probability 0.5 on one neighbour and 0.25 on each of two others. What is its perplexity? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.8284, tolerance: 0.0001 },
    },
    {
      key: "tail",
      rung: "check",
      prompt: <p>With the Student-t kernel (1 + d²)⁻¹, how many times larger is the similarity of two embedded points at distance 1 than at distance 3?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "safe",
      rung: "apply",
      prompt: <p>Which conclusion from a t-SNE plot is best supported by how the method works?</p>,
      answer: {
        kind: "choice",
        options: [
          "Points drawn next to each other in a compact group are likely to be near neighbours in the original space",
          "A cluster drawn twice as large is about twice as spread out in the original space",
          "Two clusters drawn far apart are further apart in the original space than two clusters drawn close together",
          "The horizontal axis is the direction of greatest variance",
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

def cond_probs(d2, sigma):
    w = np.exp(-(d2 - d2.min()) / (2 * sigma ** 2))
    p = w / w.sum()
    nz = p[p > 0]
    return p, float(2 ** -(nz * np.log2(nz)).sum())

def find_sigma(d2, target, lo=1e-3, hi=1e3, iters=60):
    for _ in range(iters):
        mid = np.sqrt(lo * hi)
        if cond_probs(d2, mid)[1] > target:
            hi = mid
        else:
            lo = mid
    return float(np.sqrt(lo * hi))

print(round(cond_probs(np.array([1.0, 1.0, 1.0, 1.0]), 0.5)[1], 3), round(cond_probs(np.array([0.0, 0.0, 100.0]), 1.0)[1], 3))
d2 = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
s = find_sigma(d2, 3.0)
print(round(cond_probs(d2, s)[1], 3), cond_probs(d2, 0.01)[0].round(2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.0 2.0\n3.0 [1. 0. 0. 0. 0.]", "4.0 3.0\n3.0 [1. 0. 0. 0. 0.]", "1.0 2.0\n3.0 [1. 0. 0. 0. 0.]", "4.0 2.0\n3.0 [0.2 0.2 0.2 0.2 0.2]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def q_matrix(Y):
    d2 = ((Y[:, None] - Y[None]) ** 2).sum(-1)
    num = 1 / (1 + d2)
    np.fill_diagonal(num, 0)
    return num / num.sum(), num

def tsne_grad(P, Y):
    Q, num = q_matrix(Y)
    return 4 * (((P - Q) * num)[:, :, None] * (Y[:, None] - Y[None])).sum(axis=1)

Y = np.array([[0.0], [1.0], [3.0]])
Q, num = q_matrix(Y)
print(Q.round(3)[0], round(float(Q.sum()), 6))
P = np.array([[0.0, 0.25, 0.0], [0.25, 0.0, 0.25], [0.0, 0.25, 0.0]])
print(tsne_grad(P, Y).round(3)[:, 0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.    0.312 0.062] 1.0\n[ 0.2   -0.325  0.125]", "[0.    0.312 0.062] 1.0\n[-0.2    0.325 -0.125]", "[0.    0.5   0.1  ] 1.6\n[ 0.2   -0.325  0.125]", "[0.    0.312 0.062] 0.5\n[ 0.2   -0.325  0.125]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cond_probs(d2, sigma)</C>, returning the Gaussian neighbour probabilities for a vector of squared
          distances (subtract the minimum before exponentiating, for stability) and their perplexity, and{" "}
          <C>find_sigma(d2, target, lo=1e-3, hi=1e3, iters=60)</C>, which finds σ with the target perplexity by bisection
          on a log scale.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cond_probs(d2, sigma):
    return np.ones(len(d2)) / len(d2), float(len(d2))

def find_sigma(d2, target, lo=1e-3, hi=1e3, iters=60):
    return 1.0
`,
        solution: AFF,
        tests: [
          { name: "probs", code: `p, perp = cond_probs(np.array([0.0, 2.0 * np.log(2.0)]), 1.0)
assert np.allclose(p, [2 / 3, 1 / 3]) and abs(perp - 2 ** -(2 / 3 * np.log2(2 / 3) + 1 / 3 * np.log2(1 / 3))) < 1e-12` },
          { name: "sigma", code: `d2 = np.random.default_rng(0).random(30) * 10
for t in (2.0, 5.0, 15.0):
    assert abs(cond_probs(d2, find_sigma(d2, t))[1] - t) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>q_matrix(Y)</C>, returning the matrix Q of embedded similarities and the unnormalised kernel values
          (both with zero diagonal), and <C>tsne_grad(P, Y)</C>, returning the gradient of KL(P ‖ Q) with respect to every
          row of Y.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def q_matrix(Y):
    n = len(Y)
    return np.zeros((n, n)), np.zeros((n, n))

def tsne_grad(P, Y):
    return np.zeros_like(Y)
`,
        solution: GRAD,
        tests: [
          { name: "q", code: `Q, num = q_matrix(np.array([[0.0, 0.0], [3.0, 4.0]]))
assert np.allclose(num, [[0, 1 / 26], [1 / 26, 0]]) and np.allclose(Q, [[0, 0.5], [0.5, 0]])` },
          { name: "grad", code: `rng = np.random.default_rng(0); Y = rng.normal(size=(5, 2)); A = rng.random((5, 5))
P = A + A.T; np.fill_diagonal(P, 0); P /= P.sum(); m = P > 0
kl = lambda Z: float((P[m] * np.log(P[m] / q_matrix(Z)[0][m])).sum())
Y2 = Y.copy(); Y2[2, 1] += 1e-6
assert abs((kl(Y2) - kl(Y)) / 1e-6 - tsne_grad(P, Y)[2, 1]) < 1e-4` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Using the gradient formula ∂KL/∂yᵢ = 4 Σⱼ (pᵢⱼ − qᵢⱼ) wᵢⱼ (yᵢ − yⱼ), prove that the gradients of all the points sum
          to zero, and deduce that a plain gradient-descent step leaves the centroid of the embedding unchanged.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the coefficient mᵢⱼ = (pᵢⱼ − qᵢⱼ)wᵢⱼ is symmetric in i and j, because P, Q and the kernel are all symmetric.",
          "Pairs the (i, j) and (j, i) terms, mᵢⱼ(yᵢ − yⱼ) + mⱼᵢ(yⱼ − yᵢ) = 0, so the double sum is zero (or argues equivalently, for example by translation invariance of the cost).",
          "Deduces that each step moves the points by vectors summing to zero, so their mean is unchanged.",
        ],
      },
    },
    {
      key: "twopt",
      rung: "stretch",
      prompt: <p>A point has squared distances 1 and 2 to its two neighbours, and σ = 1/√2. What is its perplexity? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.79, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how t-SNE turns distances into neighbour probabilities with a perplexity, why it uses a heavy-tailed kernel in the embedding, what its gradient does, and which features of a t-SNE or UMAP plot can and cannot be trusted.",

  glimpse: (
    <>
      <p>
        All the models so far treat variables either as fully independent or as tied together by a few hidden factors.
        Graphical models describe exactly which variables depend directly on which, and turn that structure into
        efficient computation.
      </p>
    </>
  ),
};
