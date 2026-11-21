import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SinkhornRateViz } from "@/components/viz/SinkhornRateViz";
import type { LessonContent } from "@/lib/types";

const SINK = `import numpy as np

def sinkhorn(a, b, C, eps, iters):
    K = np.exp(-C / eps)
    v = np.ones(len(b))
    for _ in range(iters):
        u = a / (K @ v)                               # fix the row sums
        v = b / (K.T @ u)                             # fix the column sums
    return u[:, None] * K * v[None, :]

def marginal_error(P, a, b):
    return float(np.sum(np.abs(P.sum(1) - a)) + np.sum(np.abs(P.sum(0) - b)))

def sinkhorn_cost(P, C):
    return float(np.sum(P * C))`;

const LOG = `import numpy as np

def lse(M, axis):
    m = np.max(M, axis=axis, keepdims=True)
    return np.squeeze(m + np.log(np.sum(np.exp(M - m), axis=axis, keepdims=True)), axis=axis)

def log_sinkhorn(a, b, C, eps, iters):
    f, g = np.zeros(len(a)), np.zeros(len(b))          # f = eps log u, g = eps log v
    for _ in range(iters):
        f = eps * np.log(a) - eps * lse((g[None, :] - C) / eps, 1)
        g = eps * np.log(b) - eps * lse((f[:, None] - C) / eps, 0)
    return np.exp((f[:, None] + g[None, :] - C) / eps)

def hilbert_metric(x, y):
    r = np.log(x / y)
    return float(np.max(r) - np.min(r))`;

export const lesson: LessonContent = {
  id: "m20.4.2",
  minutes: 55,
  links: {
    requires: ["m20.4.1", "m10.5.3"],
    revisits: ["m11.1.2", "m20.2.2"],
    foreshadows: ["m20.5.1"],
  },

  puzzle: (
    <>
      <p>
        The entropic plan is the matrix <M>{"e^{-C/\\varepsilon}"}</M> with its rows and columns rescaled. Rescale the rows so that
        they sum to the source weights, and the column sums are now wrong; rescale the columns, and the rows go wrong again. In
        1964 Richard Sinkhorn proved that repeating these two steps converges for any positive matrix. Why does such a naive
        alternation work, how fast, and what goes wrong when ε is small?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each rescaling solves one half of the problem exactly: given the column factors, the row factors that fix the row sums are
        forced, and vice versa. In the dual this is exact maximisation over one block of variables with the other held fixed, so the
        dual objective climbs at every step. Positive matrices also shrink a particular distance between directions, the Hilbert
        metric, by a fixed factor, so the scalings approach their limit geometrically. The factor tends to 1 as ε shrinks, and the
        entries of <M>{"e^{-C/\\varepsilon}"}</M> underflow, which is why practical code works with logarithms.
      </p>
      <SinkhornRateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Sinkhorn's algorithm">
        <p>
          With <M>{"K = e^{-C/\\varepsilon}"}</M> and <M>{"v^{(0)} = \\mathbf 1"}</M>, repeat
        </p>
        <MD>{"u^{(k+1)} = a \\oslash K v^{(k)}, \\qquad v^{(k+1)} = b \\oslash K^\\top u^{(k+1)} ,"}</MD>
        <p>
          with ⊘ entrywise division, and output <M>{"P = \\operatorname{diag}(u) K \\operatorname{diag}(v)"}</M>. After a v-update
          the column sums are exact, so the row-sum error measures progress. Each iteration costs two matrix-vector products, which
          parallelise well on a GPU and batch over many problems. <C>sinkhorn</C>, <C>marginal_error</C> and{" "}
          <C>sinkhorn_cost</C> implement it.
        </p>
        <Code>{SINK}</Code>
      </Definition>

      <Theorem title="Sinkhorn is block coordinate ascent">
        <p>
          With <M>{"u = e^{\\varphi/\\varepsilon}"}</M> and <M>{"v = e^{\\psi/\\varepsilon}"}</M>, the u-update sets φ to the exact
          maximiser of the smooth dual of m20.4.1 for fixed ψ, and the v-update does the same for ψ. Hence the dual objective never
          decreases, and at a fixed point both marginals hold, so the fixed point is the entropic plan.
        </p>
      </Theorem>
      <Proof>
        <p>
          Writing the dual in the form for <M>{"\\langle C, P \\rangle - \\varepsilon H(P)"}</M>, it is{" "}
          <M>{"\\langle \\varphi, a \\rangle + \\langle \\psi, b \\rangle - \\varepsilon \\sum_{ij} e^{(\\varphi_i + \\psi_j - C_{ij})/\\varepsilon}"}</M>{" "}
          up to constants, concave in each block. Setting its derivative in <M>{"\\varphi_i"}</M> to zero gives{" "}
          <M>{"a_i = u_i \\sum_j K_{ij} v_j"}</M>, exactly the u-update; the v-update is symmetric. Maximising exactly over a block
          cannot decrease the objective. At a fixed point both stationarity conditions hold, which are the marginal constraints for{" "}
          <M>{"\\operatorname{diag}(u) K \\operatorname{diag}(v)"}</M>, and by the scaling theorem of m20.4.1 that is the unique
          minimiser.
        </p>
      </Proof>

      <Theorem title="linear convergence in the Hilbert metric">
        <p>
          For positive vectors let <M>{"d_H(x, y) = \\log \\max_i (x_i/y_i) - \\log \\min_i (x_i/y_i)"}</M>. Birkhoff&apos;s theorem
          says that a matrix K with positive entries satisfies <M>{"d_H(Kx, Ky) \\le \\lambda(K)\\, d_H(x, y)"}</M> with{" "}
          <M>{"\\lambda(K) = \\tanh(\\Delta(K)/4) < 1"}</M>, where{" "}
          <M>{"\\Delta(K) = \\log \\max_{i,j,k,l} \\frac{K_{ij}K_{kl}}{K_{il}K_{kj}}"}</M>. Consequently{" "}
          <M>{"d_H(v^{(k)}, v^*) \\le \\lambda(K)^{2k} d_H(v^{(0)}, v^*)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Birkhoff&apos;s contraction theorem is quoted. The rest is a short check. <M>{"d_H"}</M> ignores positive rescaling,{" "}
          <M>{"d_H(cx, y) = d_H(x, y)"}</M>, and is unchanged by entrywise inversion and by entrywise multiplication by a fixed
          positive vector such as a, since each changes all the ratios <M>{"x_i/y_i"}</M> in a way that preserves or reverses their
          spread. The limit satisfies <M>{"v^* = b \\oslash K^\\top(a \\oslash Kv^*)"}</M>. So one iteration maps{" "}
          <M>{"d_H(v, v^*)"}</M> through K, an isometry, <M>{"K^\\top"}</M> and another isometry, contracting by{" "}
          <M>{"\\lambda(K)\\lambda(K^\\top) = \\lambda(K)^2"}</M>. <C>hilbert_metric</C> computes <M>{"d_H"}</M>.
        </p>
      </Proof>

      <Example title="one iteration by hand">
        <p>
          With a = (1/2, 1/2), b = (1/4, 3/4) and <M>{"K = \\begin{pmatrix} 1 & 1/2 \\\\ 1/2 & 1 \\end{pmatrix}"}</M>, start from{" "}
          <M>{"v = (1, 1)"}</M>: Kv = (3/2, 3/2), so u = (1/3, 1/3); then <M>{"K^\\top u = (1/2, 1/2)"}</M>, so v = (1/2, 3/2). The
          column sums of <M>{"\\operatorname{diag}(u) K \\operatorname{diag}(v)"}</M> are now exactly b, and the row sums are (5/12,
          7/12), off by 1/12 each.
        </p>
      </Example>

      <Remark title="small ε and the log domain">
        <p>
          Since <M>{"\\Delta(K) = \\max (C_{il} + C_{kj} - C_{ij} - C_{kl})/\\varepsilon"}</M>, the contraction factor tends to 1 as ε →
          0, and the iteration count grows; the visualisation shows roughly 1/ε in practice, and annealing ε from large to small
          speeds this up. For small ε, <M>{"e^{-C_{ij}/\\varepsilon}"}</M> underflows to zero in floating point and the divisions
          produce zeros or NaNs. The log-domain version keeps <M>{"f = \\varepsilon \\log u"}</M> and <M>{"g = \\varepsilon \\log v"}</M>{" "}
          and replaces each matrix-vector product by a log-sum-exp, the soft c-transform of m20.4.1 (<C>lse</C>,{" "}
          <C>log_sinkhorn</C>). Its iterates are differentiable, so gradients can flow through a fixed number of Sinkhorn steps.
        </p>
        <Code>{LOG}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hand",
      rung: "check",
      prompt: (
        <p>
          In the hand example, what is the entry <M>{"P_{11} = u_1 K_{11} v_1"}</M> after one iteration? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.167, tolerance: 0.0006 },
    },
    {
      key: "lam",
      rung: "check",
      prompt: (
        <p>
          A positive matrix has <M>{"\\Delta(K) = 4"}</M>. What is Birkhoff&apos;s contraction factor <M>{"\\tanh(\\Delta/4)"}</M>?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.762, tolerance: 0.0006 },
    },
    {
      key: "ascent",
      rung: "apply",
      prompt: <p>Why does each Sinkhorn half-step not decrease the dual objective?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each half-step sets one block of dual variables to its exact maximiser with the other block fixed, and the dual is concave in each block",
          "Because each half-step is a gradient step with a small enough learning rate",
          "Because the primal cost decreases at every step",
          "Because the entropy of the plan increases at every step",
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

def sinkhorn(a, b, C, eps, iters):
    K = np.exp(-C / eps)
    v = np.ones(len(b))
    for _ in range(iters):
        u = a / (K @ v)                               # fix the row sums
        v = b / (K.T @ u)                             # fix the column sums
    return u[:, None] * K * v[None, :]

def marginal_error(P, a, b):
    return float(np.sum(np.abs(P.sum(1) - a)) + np.sum(np.abs(P.sum(0) - b)))

def sinkhorn_cost(P, C):
    return float(np.sum(P * C))

a, C = np.array([0.5, 0.5]), np.array([[0.0, 1.0], [1.0, 0.0]]); P = sinkhorn(a, a, C, 1.0, 50)
print(P.round(4).tolist(), round(marginal_error(P, a, a), 6), round(sinkhorn_cost(P, C), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.3655, 0.1345], [0.1345, 0.3655]] 0.0 0.2689",
          "[[0.5, 0.0], [0.0, 0.5]] 0.0 0.0",
          "[[0.25, 0.25], [0.25, 0.25]] 0.0 0.5",
          "[[0.3655, 0.1345], [0.1345, 0.3655]] 0.0 0.7311",
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

def lse(M, axis):
    m = np.max(M, axis=axis, keepdims=True)
    return np.squeeze(m + np.log(np.sum(np.exp(M - m), axis=axis, keepdims=True)), axis=axis)

def log_sinkhorn(a, b, C, eps, iters):
    f, g = np.zeros(len(a)), np.zeros(len(b))          # f = eps log u, g = eps log v
    for _ in range(iters):
        f = eps * np.log(a) - eps * lse((g[None, :] - C) / eps, 1)
        g = eps * np.log(b) - eps * lse((f[:, None] - C) / eps, 0)
    return np.exp((f[:, None] + g[None, :] - C) / eps)

def hilbert_metric(x, y):
    r = np.log(x / y)
    return float(np.max(r) - np.min(r))

Q = log_sinkhorn(np.array([0.5, 0.5]), np.array([0.5, 0.5]), np.array([[0.0, 1.0], [1.0, 0.0]]), 0.5, 50)
print(Q.round(4).tolist(), round(hilbert_metric(np.array([1.0, 2.0]), np.array([2.0, 1.0])), 4), lse(np.array([[0.0, 0.0]]), 1).round(4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.4404, 0.0596], [0.0596, 0.4404]] 1.3863 [0.6931]",
          "[[0.3655, 0.1345], [0.1345, 0.3655]] 1.3863 [0.6931]",
          "[[0.4404, 0.0596], [0.0596, 0.4404]] 0.6931 [0.6931]",
          "[[0.4404, 0.0596], [0.0596, 0.4404]] 1.3863 [0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sinkhorn(a, b, C, eps, iters)</C> returning the plan, <C>marginal_error(P, a, b)</C>, the L1 error of rows plus
          columns, and <C>sinkhorn_cost(P, C)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sinkhorn(a, b, C, eps, iters):
    K = np.exp(-C / eps)
    return K / K.sum()

def marginal_error(P, a, b):
    return float(np.sum(np.abs(P.sum(1) - a)))

def sinkhorn_cost(P, C):
    return float(np.max(P * C))
`,
        solution: SINK,
        tests: [
          { name: "plan", code: `a, b = np.array([0.2, 0.8]), np.array([0.6, 0.4]); C = np.array([[0.0, 1.0], [2.0, 0.5]])\nP = sinkhorn(a, b, C, 0.5, 200)\nassert P.shape == (2, 2)\nassert np.allclose(P.sum(1), a) and np.allclose(P.sum(0), b) and marginal_error(P, a, b) < 1e-9` },
          { name: "cost", code: `assert abs(marginal_error(np.array([[0.5, 0.0], [0.0, 0.5]]), np.array([1.0, 0.0]), np.array([0.5, 0.5])) - 1.0) < 1e-12 and abs(sinkhorn_cost(np.array([[0.5, 0.5]]), np.array([[2.0, 4.0]])) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lse(M, axis)</C>, a stable log-sum-exp, <C>log_sinkhorn(a, b, C, eps, iters)</C> working with{" "}
          <M>{"f = \\varepsilon \\log u"}</M> and <M>{"g = \\varepsilon \\log v"}</M>, and <C>hilbert_metric(x, y)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lse(M, axis):
    return np.log(np.sum(np.exp(M), axis=axis))

def log_sinkhorn(a, b, C, eps, iters):
    return np.outer(a, b)

def hilbert_metric(x, y):
    return float(np.max(np.abs(np.log(x / y))))
`,
        solution: LOG,
        tests: [
          { name: "lse", code: `r = lse(np.array([[1000.0, 1000.0], [0.0, -np.inf]]), 1)\nassert r.shape == (2,)\nassert np.allclose(r, [1000.0 + np.log(2), 0.0])` },
          { name: "log", code: `a, b = np.array([0.5, 0.5]), np.array([0.5, 0.5]); C = np.array([[0.0, 1.0], [1.0, 0.0]])\nP = log_sinkhorn(a, b, C, 0.01, 50)\nassert np.allclose(P, [[0.5, 0.0], [0.0, 0.5]], atol=1e-9)\nassert abs(hilbert_metric(np.array([1.0, 4.0]), np.array([2.0, 2.0])) - np.log(4)) < 1e-12` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          With <M>{"\\lambda(K) = 0.762"}</M>, how many full Sinkhorn iterations does the Hilbert-metric bound need to shrink the
          error by a factor of <M>{"10^{6}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 26, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Fast, differentiable transport costs make optimal transport usable inside machine learning. The final chapter starts with
        the most famous use: training a generator by minimising a Wasserstein distance estimated by a neural critic.
      </p>
    </>
  ),
};
