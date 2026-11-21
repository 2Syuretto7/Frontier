import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SinkhornDivergenceViz } from "@/components/viz/SinkhornDivergenceViz";
import type { LessonContent } from "@/lib/types";

const DIV = `import numpy as np

def lse(M, axis):
    m = np.max(M, axis=axis, keepdims=True)
    return np.squeeze(m + np.log(np.sum(np.exp(M - m), axis=axis, keepdims=True)), axis=axis)

def ot_eps(X, Y, eps, iters=2000):
    a, b = np.full(len(X), 1 / len(X)), np.full(len(Y), 1 / len(Y))
    C = np.sum((X[:, None, :] - Y[None, :, :]) ** 2, axis=-1)          # squared cost; rows are points
    f, g = np.zeros(len(X)), np.zeros(len(Y))
    for _ in range(iters):                                           # log-domain Sinkhorn (m20.4.2)
        f = eps * np.log(a) - eps * lse((g[None, :] - C) / eps, 1)
        g = eps * np.log(b) - eps * lse((f[:, None] - C) / eps, 0)
    logP = (f[:, None] + g[None, :] - C) / eps
    P = np.exp(logP)
    return float(np.sum(P * C) + eps * np.sum(P * (logP - np.log(np.outer(a, b)))))   # <C, P> + eps KL(P | a x b)

def sinkhorn_divergence(X, Y, eps):
    return ot_eps(X, Y, eps) - 0.5 * ot_eps(X, X, eps) - 0.5 * ot_eps(Y, Y, eps)`;

const OTDD = `import numpy as np

def gauss_w2(m1, s1, m2, s2):
    return (m1 - m2) ** 2 + (s1 - s2) ** 2                 # W2 squared between N(m1, s1^2) and N(m2, s2^2)

def label_stats(x, y):
    return {c: (float(np.mean(x[y == c])), float(np.std(x[y == c]))) for c in np.unique(y)}

def otdd_cost(x1, y1, x2, y2):
    s1, s2 = label_stats(x1, y1), label_stats(x2, y2)
    L = np.array([[gauss_w2(*s1[a], *s2[b]) for b in y2] for a in y1])
    return (x1[:, None] - x2[None, :]) ** 2 + L            # feature distance plus label distance`;

export const lesson: LessonContent = {
  id: "m20.5.3",
  minutes: 55,
  links: {
    requires: ["m20.4.2", "m20.3.1"],
    revisits: ["m20.4.1", "l7.1.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A team has a model trained on one labelled dataset and several candidate datasets to fine-tune it on. Which candidate is
        closest to the original? Did last month&apos;s production data drift away from the training data? These are questions about
        a distance between two clouds of points, possibly with labels attached, where the points do not correspond one to one. What
        transport-based distance can be computed for thousands of points, is zero exactly when the datasets agree, and can compare
        labelled datasets whose label sets are different?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The entropic transport cost of m20.4.1 is cheap to compute with Sinkhorn, but it is not a distance: comparing a dataset with
        itself gives a positive number, because the blurred plan spreads mass between different points. Subtracting the average of
        the two self-comparisons removes this bias. For labelled data, a label is described by the cloud of features carrying it,
        so two labels can be compared by a transport distance between their clouds, and that distance becomes part of the ground
        cost between labelled points.
      </p>
      <SinkhornDivergenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Sinkhorn divergence">
        <p>
          For empirical measures μ and ν with the squared cost and ε &gt; 0, let{" "}
          <M>{"\\mathrm{OT}_\\varepsilon(\\mu, \\nu)"}</M> be the entropic value of m20.4.1, computed by log-domain Sinkhorn
          (<C>ot_eps</C>). The Sinkhorn divergence (<C>sinkhorn_divergence</C>) is
        </p>
        <MD>{"S_\\varepsilon(\\mu, \\nu) = \\mathrm{OT}_\\varepsilon(\\mu, \\nu) - \\tfrac12 \\mathrm{OT}_\\varepsilon(\\mu, \\mu) - \\tfrac12 \\mathrm{OT}_\\varepsilon(\\nu, \\nu) ."}</MD>
        <Code>{DIV}</Code>
      </Definition>

      <Theorem title="the entropic bias">
        <p>
          If μ has n ≥ 2 distinct atoms with weights a, then{" "}
          <M>{"\\mathrm{OT}_\\varepsilon(\\mu, \\mu) > 0"}</M>. So <M>{"\\mathrm{OT}_\\varepsilon"}</M> is not zero on equal
          arguments, and as the viz shows, <M>{"\\nu \\mapsto \\mathrm{OT}_\\varepsilon(\\mu, \\nu)"}</M> need not be smallest at ν = μ.
        </p>
      </Theorem>
      <Proof>
        <p>
          Both terms <M>{"\\langle C, P \\rangle"}</M> and <M>{"\\varepsilon\\, \\mathrm{KL}(P \\,\\|\\, a \\otimes a)"}</M> are
          nonnegative. The first is zero only if P is supported on the diagonal, which for a coupling of a with itself forces{" "}
          <M>{"P = \\operatorname{diag}(a)"}</M>. Then the second is{" "}
          <M>{"\\varepsilon \\sum_i a_i \\log(a_i / a_i^2) = \\varepsilon H(a) > 0"}</M>. The minimum is attained (m20.4.1), so it is
          positive.
        </p>
      </Proof>

      <Theorem title="between Wasserstein and the mean">
        <p>
          With the squared cost, <M>{"S_\\varepsilon(\\mu, \\nu) \\to W_2^2(\\mu, \\nu)"}</M> as ε → 0, and{" "}
          <M>{"S_\\varepsilon(\\mu, \\nu) \\to |m_\\mu - m_\\nu|^2"}</M> as ε → ∞, where m denotes the mean.
        </p>
      </Theorem>
      <Proof>
        <p>
          As ε → 0, the bound <M>{"\\mathrm{OT}_0 \\le \\mathrm{OT}_\\varepsilon \\le \\mathrm{OT}_0 + \\varepsilon \\min(H(a), H(b))"}</M>{" "}
          of m20.4.1 gives <M>{"\\mathrm{OT}_\\varepsilon(\\mu, \\nu) \\to W_2^2(\\mu, \\nu)"}</M> and the self terms tend to 0. As ε →
          ∞, the independent coupling is feasible with zero KL term, so{" "}
          <M>{"\\langle C, P_\\varepsilon \\rangle \\le \\mathrm{OT}_\\varepsilon \\le \\langle C, a \\otimes b \\rangle"}</M>, and{" "}
          <M>{"P_\\varepsilon \\to a \\otimes b"}</M> (m20.4.1) squeezes the value to{" "}
          <M>{"\\mathbb{E}|X - Y|^2"}</M> with X and Y independent. Writing V for the expected squared distance to the mean,{" "}
          <M>{"\\mathbb{E}|X - Y|^2 = |m_\\mu - m_\\nu|^2 + V_\\mu + V_\\nu"}</M> and <M>{"\\mathbb{E}|X - X'|^2 = 2V_\\mu"}</M>, so the
          variances cancel. The limit is the formula for the squared maximum mean discrepancy in l7.1.2 with k = −c, halved.
        </p>
      </Proof>

      <Remark title="why the divergence is the right tool">
        <p>
          Feydy and colleagues proved that for the squared cost, and for other costs whose Gibbs kernel{" "}
          <M>{"e^{-c/\\varepsilon}"}</M> is positive definite, <M>{"S_\\varepsilon(\\mu, \\nu) \\ge 0"}</M> with equality only when μ
          = ν, and that <M>{"S_\\varepsilon"}</M> is convex in each argument and metrises weak convergence. Genevay and colleagues
          showed that its estimate from n samples converges at rate <M>{"n^{-1/2}"}</M>, with a constant that grows as ε shrinks,
          whereas the empirical <M>{"W_2"}</M> converges at the rate <M>{"n^{-1/d}"}</M> in dimension d. The parameter ε trades the
          geometry of transport against the statistics of a kernel discrepancy.
        </p>
      </Remark>

      <Definition title="distances between labelled datasets">
        <p>
          Alvarez-Melis and Fusi compare datasets of pairs (x, y) by optimal transport with the ground cost
        </p>
        <MD>{"d\\big((x, y), (x', y')\\big)^2 = |x - x'|^2 + W_2^2(\\alpha_y, \\alpha_{y'}) ,"}</MD>
        <p>
          where <M>{"\\alpha_y"}</M> is the distribution of features with label y in its own dataset. Labels in different datasets
          need not match by name: a label is compared through the features that carry it. To make this cheap,{" "}
          <M>{"\\alpha_y"}</M> is replaced by a Gaussian with the same mean and covariance, and the Gaussian formula of m20.3.1 gives
          the label distance, in one dimension <M>{"(m - m')^2 + (s - s')^2"}</M> (<C>gauss_w2</C>, <C>label_stats</C>,{" "}
          <C>otdd_cost</C>). The dataset distance is then an entropic transport problem with this cost.
        </p>
        <Code>{OTDD}</Code>
      </Definition>

      <Example title="what the numbers are used for">
        <p>
          Alvarez-Melis and Fusi found that the dataset distance between a source and a target dataset predicted how much
          pretraining on the source helped on the target, across image and text classification benchmarks. The same machinery
          appears as a drift monitor, comparing a window of production inputs with a reference sample, and in data selection, where
          training examples are weighted by how much they reduce the distance to a target set. In each use only differences between
          distances are interpreted, since the absolute value depends on ε, the feature map and the sample size.
        </p>
      </Example>

      <Remark title="where the course ends">
        <p>
          Monge&apos;s problem became a linear program, the linear program gave dual prices, and the prices gave a geometry on
          distributions in which interpolation, gradient flows and generative models have natural meanings. Entropic regularisation
          made all of it computable at scale. The distance between two datasets closes the loop: it is Monge&apos;s question of how
          to move one heap of sand onto another, asked of the data a model learns from.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "small",
      rung: "check",
      prompt: (
        <p>
          One dataset is {"{0, 2, 4}"} and another is {"{1, 5, 10}"}, each point with weight 1/3, compared with the squared cost.
          What is the limit of the Sinkhorn divergence as ε → 0? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 15.333, tolerance: 0.0006 },
    },
    {
      key: "large",
      rung: "check",
      prompt: <p>For the same two datasets, what is the limit as ε → ∞? Give three decimals.</p>,
      answer: { kind: "numeric", value: 11.111, tolerance: 0.0006 },
    },
    {
      key: "debias",
      rung: "apply",
      prompt: <p>Why is the entropic cost corrected by subtracting the two self-comparison terms?</p>,
      answer: {
        kind: "choice",
        options: [
          "The entropic cost of a dataset with itself is positive, so the uncorrected cost is not zero for equal datasets and can be smaller for a shrunken copy",
          "The self terms make the computation faster",
          "Without them the Sinkhorn iterations do not converge",
          "The self terms convert the squared cost into the absolute cost",
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

def lse(M, axis):
    m = np.max(M, axis=axis, keepdims=True)
    return np.squeeze(m + np.log(np.sum(np.exp(M - m), axis=axis, keepdims=True)), axis=axis)

def ot_eps(X, Y, eps, iters=2000):
    a, b = np.full(len(X), 1 / len(X)), np.full(len(Y), 1 / len(Y))
    C = np.sum((X[:, None, :] - Y[None, :, :]) ** 2, axis=-1)          # squared cost; rows are points
    f, g = np.zeros(len(X)), np.zeros(len(Y))
    for _ in range(iters):                                           # log-domain Sinkhorn (m20.4.2)
        f = eps * np.log(a) - eps * lse((g[None, :] - C) / eps, 1)
        g = eps * np.log(b) - eps * lse((f[:, None] - C) / eps, 0)
    logP = (f[:, None] + g[None, :] - C) / eps
    P = np.exp(logP)
    return float(np.sum(P * C) + eps * np.sum(P * (logP - np.log(np.outer(a, b)))))   # <C, P> + eps KL(P | a x b)

def sinkhorn_divergence(X, Y, eps):
    return ot_eps(X, Y, eps) - 0.5 * ot_eps(X, X, eps) - 0.5 * ot_eps(Y, Y, eps)

X = np.array([[0.0], [2.0]]); Y = np.array([[1.0], [5.0]]); print(lse(np.array([[0.0, 0.0], [1.0, 1.0]]), 1).round(3).tolist())
print(round(ot_eps(X, Y, 1e-3), 2), round(sinkhorn_divergence(X, Y, 1e4), 2), round(ot_eps(X, X, 1e4), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.693, 1.693]\n5.0 4.0 2.0",
          "[0.693, 1.693]\n5.0 4.0 0.0",
          "[0.693, 1.693]\n13.0 4.0 2.0",
          "[0.0, 1.0]\n5.0 4.0 2.0",
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

def gauss_w2(m1, s1, m2, s2):
    return (m1 - m2) ** 2 + (s1 - s2) ** 2                 # W2 squared between N(m1, s1^2) and N(m2, s2^2)

def label_stats(x, y):
    return {c: (float(np.mean(x[y == c])), float(np.std(x[y == c]))) for c in np.unique(y)}

def otdd_cost(x1, y1, x2, y2):
    s1, s2 = label_stats(x1, y1), label_stats(x2, y2)
    L = np.array([[gauss_w2(*s1[a], *s2[b]) for b in y2] for a in y1])
    return (x1[:, None] - x2[None, :]) ** 2 + L            # feature distance plus label distance

x = np.array([0.0, 2.0, 5.0]); y = np.array([0, 0, 1])
print(label_stats(x, y)[1], otdd_cost(x, y, x, y)[0].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(5.0, 0.0) [0.0, 4.0, 42.0]",
          "(5.0, 0.0) [0.0, 4.0, 41.0]",
          "(5.0, 0.0) [0.0, 4.0, 25.0]",
          "(1.0, 1.0) [0.0, 4.0, 42.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lse(M, axis)</C>, a stable log-sum-exp, <C>ot_eps(X, Y, eps, iters)</C> for arrays whose rows are points, with
          uniform weights and the squared cost, by log-domain Sinkhorn, returning <M>{"\\langle C, P \\rangle + \\varepsilon\\, \\mathrm{KL}(P \\,\\|\\, a \\otimes b)"}</M>,
          and <C>sinkhorn_divergence(X, Y, eps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lse(M, axis):
    return np.max(M, axis=axis)

def ot_eps(X, Y, eps, iters=2000):
    return float(np.mean(np.abs(X[:, None, :] - Y[None, :, :])))

def sinkhorn_divergence(X, Y, eps):
    return ot_eps(X, Y, eps)
`,
        solution: DIV,
        tests: [
          { name: "lse", code: `assert np.allclose(lse(np.zeros((2, 3)), 0), np.log(2.0))\nassert abs(lse(np.array([[0.0, np.log(3.0)]]), 1)[0] - np.log(4.0)) < 1e-12` },
          { name: "div", code: `X = np.array([[0.0], [1.0]]); Y = np.array([[3.0], [5.0]])\nassert abs(ot_eps(X, Y, 1e-3) - 12.5) < 1e-2 and abs(sinkhorn_divergence(X, Y, 1e5) - 12.25) < 1e-2\nassert abs(sinkhorn_divergence(X, X, 0.5)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          In one dimension, write <C>gauss_w2(m1, s1, m2, s2)</C>, <C>label_stats(x, y)</C> mapping each label to the mean and
          population standard deviation of its features, and <C>otdd_cost(x1, y1, x2, y2)</C>, the matrix of feature plus label
          costs between the points of two labelled datasets.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gauss_w2(m1, s1, m2, s2):
    return (m1 - m2) ** 2

def label_stats(x, y):
    return {c: (float(np.mean(x)), float(np.std(x))) for c in np.unique(y)}

def otdd_cost(x1, y1, x2, y2):
    return (x1[:, None] - x2[None, :]) ** 2
`,
        solution: OTDD,
        tests: [
          { name: "w2", code: `assert gauss_w2(0.0, 1.0, 3.0, 2.0) == 10.0 and label_stats(np.array([1.0, 3.0, 7.0]), np.array([0, 0, 1]))[0] == (2.0, 1.0)` },
          { name: "otdd", code: `C = otdd_cost(np.array([0.0, 4.0]), np.array([0, 1]), np.array([1.0]), np.array([1]))\nassert np.allclose(C, [[2.0], [18.0]])` },
        ],
      },
    },
    {
      key: "label",
      rung: "stretch",
      prompt: (
        <p>
          In dataset A the label &quot;cat&quot; has features {"{0, 2, 4}"}; in dataset B the label &quot;dog&quot; has features{" "}
          {"{5, 6}"}. Using population standard deviations and the one-dimensional Gaussian approximation, what is the ground cost
          between the point (1, cat) of A and the point (6, dog) of B? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 38.534, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course. Optimal transport returns wherever distributions must be compared or moved: in the geometry of
        deep learning, where symmetries act on data distributions, and in the generative models of the later courses.
      </p>
    </>
  ),
};
