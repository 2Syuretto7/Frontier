import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MatrixCompletionViz } from "@/components/viz/MatrixCompletionViz";
import type { LessonContent } from "@/lib/types";

const ALS = `import math

def dof(d1, d2, r):
    return r * (d1 + d2 - r)

def observe(M, p, rng):
    return {(i, j): v for i, row in enumerate(M) for j, v in enumerate(row) if rng.random() < p}

def rank1_als(d1, d2, obs, iters):
    u, v = [1.0] * d1, [1.0] * d2
    for _ in range(iters):
        for i in range(d1):
            js = [j for j in range(d2) if (i, j) in obs]
            den = sum(v[j] ** 2 for j in js)
            u[i] = sum(obs[i, j] * v[j] for j in js) / den if den else 0.0
        for j in range(d2):
            ins = [i for i in range(d1) if (i, j) in obs]
            den = sum(u[i] ** 2 for i in ins)
            v[j] = sum(obs[i, j] * u[i] for i in ins) / den if den else 0.0
    return [[a * b for b in v] for a in u]`;

const COH = `import math

def rmse(M, N):
    errs = [(a - b) ** 2 for r, s in zip(M, N) for a, b in zip(r, s)]
    return math.sqrt(sum(errs) / len(errs))

def coherence(u):
    return len(u) * max(x * x for x in u) / sum(x * x for x in u)

def sensing_bound(d1, d2, r):
    return 3 * r * (d1 + d2 - r)`;

export const lesson: LessonContent = {
  id: "m15.5.2",
  minutes: 60,
  links: {
    requires: ["m15.5.1", "m6.5.2"],
    revisits: ["m3.8.4", "m15.4.3"],
    foreshadows: ["m15.5.3"],
  },

  puzzle: (
    <>
      <p>
        A film service knows each user&apos;s rating of a few films and wants to predict the rest. A ratings matrix with a
        million users and ten thousand films has ten billion entries, of which perhaps one in a hundred is known. If taste
        is driven by a few dozen hidden factors, the matrix has low rank. Is one percent of the entries enough to fill in
        the other ninety-nine, and what could make it impossible however many you had?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A rank-r matrix is determined by about <M>{"r(d_1 + d_2)"}</M> numbers, far fewer than its <M>{"d_1d_2"}</M> entries, so
        counting suggests a small fraction should suffice. Two things can go wrong. A row with too few observed entries
        cannot be pinned down, so the observations must be spread out. And a matrix whose information is concentrated in a
        few entries, such as one with a single nonzero entry, cannot be completed from a random sample at all. The nuclear
        norm plays the part that the <M>{"\\ell_1"}</M> norm played for sparse vectors.
      </p>
      <MatrixCompletionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="low-rank recovery problems">
        <p>
          In <em>matrix completion</em> we observe the entries <M>{"M_{ij}"}</M> of an unknown <M>{"d_1 \\times d_2"}</M> matrix of
          rank r for (i, j) in a random set Ω, each entry included independently with probability p (<C>observe</C>). In{" "}
          <em>matrix sensing</em> we observe <M>{"y_k = \\langle A_k, M\\rangle"}</M> for m random matrices <M>{"A_k"}</M> with
          independent Gaussian entries. The convex estimator minimises the nuclear norm{" "}
          <M>{"\\|X\\|_* = \\sum_i\\sigma_i(X)"}</M> (m6.5.2) subject to agreeing with the observations.
        </p>
      </Definition>

      <Theorem title="degrees of freedom">
        <p>The rank-r matrices of size <M>{"d_1 \\times d_2"}</M> form a smooth family of dimension <M>{"r(d_1 + d_2 - r)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Near a matrix whose top-left r × r block B is invertible, write <M>{"M = \\begin{pmatrix} B & C \\\\ D & DB^{-1}C\\end{pmatrix}"}</M>:
          the rows below the first r are combinations of them, and the combination coefficients are fixed by the first r
          columns. So B, C and D, with <M>{"r^2 + r(d_2 - r) + r(d_1 - r) = r(d_1 + d_2 - r)"}</M> entries, determine M freely.
          Fewer observations than this, <C>dof</C>, can never determine M.
        </p>
      </Proof>

      <Theorem title="coverage is necessary">
        <p>
          If entries are observed independently with probability p, some row of a <M>{"d \\times d"}</M> matrix is entirely unseen
          with probability at least <M>{"1 - (1 - (1 - p)^d)^d"}</M>, so reliable completion needs{" "}
          <M>{"pd \\gtrsim \\log d"}</M>, that is, about <M>{"d\\log d"}</M> observed entries even for rank 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each row is unseen with probability <M>{"(1 - p)^d"}</M>, independently across rows, and an unseen row of a rank-1 matrix{" "}
          <M>{"uv^\\top"}</M> leaves its <M>{"u_i"}</M> undetermined. The chance that every row is seen is{" "}
          <M>{"(1 - (1 - p)^d)^d \\approx \\exp(-de^{-pd})"}</M>, which is small unless <M>{"pd"}</M> exceeds about log d.
        </p>
      </Proof>

      <Definition title="incoherence">
        <p>
          The <em>coherence</em> of a nonzero vector u in <M>{"\\mathbb{R}^d"}</M> is <M>{"\\mu(u) = d\\max_iu_i^2/\\|u\\|^2"}</M>, between 1
          (perfectly spread) and d (a single coordinate), and <C>coherence</C> computes it; for an r-dimensional subspace U
          the analogue is <M>{"\\tfrac dr\\max_i\\|P_Ue_i\\|^2"}</M>. The matrix <M>{"e_1e_1^\\top"}</M> has maximal coherence: a sample
          of a fraction p of its entries misses the only nonzero one with probability 1 − p, and then nothing distinguishes
          it from the zero matrix.
        </p>
        <Code>{COH}</Code>
      </Definition>

      <Theorem title="completion by nuclear norm">
        <p>
          (Candès and Recht; Candès and Tao; Gross; Recht.) If M has rank r and its row and column spaces have coherence at most
          μ, then with high probability M is the unique matrix of smallest nuclear norm agreeing with M on Ω, provided{" "}
          <M>{"|\\Omega| \\ge C\\mu r(d_1 + d_2)\\log^2(d_1 + d_2)"}</M> for an absolute constant C.
        </p>
      </Theorem>
      <Remark title="the three factors">
        <p>
          The bound is the degrees of freedom <M>{"r(d_1 + d_2)"}</M>, times the coherence, the price of information that is not
          spread out, times logarithms, which the coverage theorem shows cannot all be removed. The proof constructs a dual
          certificate using the matrix Bernstein inequality of m15.3.4, applied to sums of the random rank-one matrices{" "}
          <M>{"e_ie_j^\\top"}</M> for observed (i, j).
        </p>
      </Remark>

      <Theorem title="Gaussian matrix sensing">
        <p>
          For Gaussian measurements, nuclear norm minimisation recovers every fixed rank-r matrix with high probability once{" "}
          <M>{"m \\ge 3r(d_1 + d_2 - r)"}</M> plus a lower-order term.
        </p>
      </Theorem>
      <Proof>
        <p>
          As for the lasso (m15.5.1), recovery holds when the null space of the measurement map misses the descent cone of
          the nuclear norm at M. The measurement map is a Gaussian matrix acting on <M>{"\\mathbb{R}^{d_1d_2}"}</M>, so by
          Gordon&apos;s theorem (m15.4.3) it suffices that √m exceed the cone&apos;s Gaussian width. Chandrasekaran, Recht, Parrilo and
          Willsky computed that the squared width is at most <M>{"3r(d_1 + d_2 - r)"}</M> (<C>sensing_bound</C>): three times the
          degrees of freedom, and no logarithm, because Gaussian measurements see every matrix equally and coherence plays no
          part.
        </p>
      </Proof>

      <Example title="alternating least squares">
        <p>
          In practice large problems are solved by writing <M>{"X = UV^\\top"}</M> with U and V having r columns and minimising the
          squared error on the observed entries. With V fixed, each row of U is an ordinary least-squares problem in r
          unknowns over that row&apos;s observed entries, and vice versa. <C>rank1_als</C> does this for r = 1, where each
          update is a ratio of sums. The problem is not convex, but for incoherent matrices with enough random observations
          it has no bad local minima, and alternating minimisation from a spectral starting point provably converges.
        </p>
        <Code>{ALS}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dof",
      rung: "check",
      prompt: <p>How many degrees of freedom does a 1000 × 500 matrix of rank 10 have?</p>,
      answer: { kind: "numeric", value: 14900, tolerance: 0.5 },
    },
    {
      key: "sense",
      rung: "check",
      prompt: <p>How many Gaussian measurements does the bound <M>{"3r(d_1 + d_2 - r)"}</M> require for a 100 × 100 matrix of rank 5?</p>,
      answer: { kind: "numeric", value: 2925, tolerance: 0.5 },
    },
    {
      key: "coh",
      rung: "apply",
      prompt: <p>Why can a matrix with a single nonzero entry not be completed from a random fraction of its entries?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is maximally coherent: unless the one nonzero entry happens to be sampled, the observations are identical to those of the zero matrix",
          "Its rank is too high",
          "Its nuclear norm is not defined",
          "It has more degrees of freedom than entries",
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

def dof(d1, d2, r):
    return r * (d1 + d2 - r)

def observe(M, p, rng):
    return {(i, j): v for i, row in enumerate(M) for j, v in enumerate(row) if rng.random() < p}

def rank1_als(d1, d2, obs, iters):
    u, v = [1.0] * d1, [1.0] * d2
    for _ in range(iters):
        for i in range(d1):
            js = [j for j in range(d2) if (i, j) in obs]
            den = sum(v[j] ** 2 for j in js)
            u[i] = sum(obs[i, j] * v[j] for j in js) / den if den else 0.0
        for j in range(d2):
            ins = [i for i in range(d1) if (i, j) in obs]
            den = sum(u[i] ** 2 for i in ins)
            v[j] = sum(obs[i, j] * u[i] for i in ins) / den if den else 0.0
    return [[a * b for b in v] for a in u]

import random; M = [[1, 2], [3, 6]]; print(dof(2, 2, 1), dof(100, 50, 3), sorted(observe(M, 1, random.Random(0))), observe(M, 0, random.Random(0)))
obs = {(0, 0): 1, (0, 1): 2, (1, 0): 3}; print([[round(x, 4) for x in row] for row in rank1_als(2, 2, obs, 100)], rank1_als(2, 2, obs, 1)[1][1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 441 [(0, 0), (0, 1), (1, 0), (1, 1)] {}\n[[1.0, 2.0], [3.0, 6.0]] 4.0",
          "4 441 [(0, 0), (0, 1), (1, 0), (1, 1)] {}\n[[1.0, 2.0], [3.0, 6.0]] 4.0",
          "3 450 [(0, 0), (0, 1), (1, 0), (1, 1)] {}\n[[1.0, 2.0], [3.0, 6.0]] 4.0",
          "3 441 [(0, 0), (0, 1), (1, 0), (1, 1)] {}\n[[1.0, 2.0], [3.0, 6.0]] 6.0",
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

def rmse(M, N):
    errs = [(a - b) ** 2 for r, s in zip(M, N) for a, b in zip(r, s)]
    return math.sqrt(sum(errs) / len(errs))

def coherence(u):
    return len(u) * max(x * x for x in u) / sum(x * x for x in u)

def sensing_bound(d1, d2, r):
    return 3 * r * (d1 + d2 - r)

print(rmse([[1, 2], [3, 4]], [[1, 2], [3, 6]]), coherence([1, 1, 1, 1]), coherence([1, 0, 0, 0]), round(coherence([3, 4, 0]), 4))
print(sensing_bound(10, 10, 1), sensing_bound(100, 50, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 1.0 4.0 1.92\n57 2175", "2.0 1.0 4.0 1.92\n57 2175", "1.0 1.0 1.0 1.92\n57 2175", "1.0 1.0 4.0 1.92\n60 2250"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dof(d1, d2, r)</C>; <C>observe(M, p, rng)</C>, a dictionary from (i, j) to <C>M[i][j]</C> for the entries kept,
          visiting entries row by row and keeping one when <C>rng.random() &lt; p</C>; and <C>rank1_als(d1, d2, obs, iters)</C>,
          starting from u and v of all ones, each iteration updating every <M>{"u_i"}</M> and then every <M>{"v_j"}</M> by least
          squares over the observed entries (0.0 for a row or column with none), and returning the matrix <M>{"uv^\\top"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def dof(d1, d2, r):
    return 0

def observe(M, p, rng):
    return {}

def rank1_als(d1, d2, obs, iters):
    return [[0.0] * d2 for _ in range(d1)]
`,
        solution: ALS,
        tests: [
          { name: "observe", code: `import random
assert dof(2, 2, 1) == 3 and dof(100, 50, 3) == 441 and dof(5, 5, 5) == 25
M = [[1, 2, 3], [4, 5, 6]]; r = random.Random(7); keep = [(i, j) for i in range(2) for j in range(3) if r.random() < 0.5]
assert observe(M, 0.5, random.Random(7)) == {(i, j): M[i][j] for i, j in keep} and observe(M, 0, r) == {} and len(observe(M, 1, r)) == 6` },
          { name: "als", code: `import math, random
obs = {(0, 0): 1, (0, 1): 2, (1, 0): 3}
X = rank1_als(2, 2, obs, 1); assert abs(X[0][0] - 1.4) < 1e-12 and abs(X[1][1] - 4.0) < 1e-12
X = rank1_als(2, 2, obs, 200); assert abs(X[1][1] - 6) < 1e-9
r = random.Random(1); u = [r.uniform(0.5, 2) for _ in range(12)]; v = [r.uniform(0.5, 2) for _ in range(10)]
T = [[a * b for b in v] for a in u]; O = observe(T, 0.5, r)
X = rank1_als(12, 10, O, 300); assert max(abs(X[i][j] - T[i][j]) for i in range(12) for j in range(10)) < 1e-6
assert rank1_als(2, 2, {(0, 0): 5}, 3)[1] == [0.0, 0.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rmse(M, N)</C>, the root-mean-square difference over all entries of two equal-shaped matrices;{" "}
          <C>coherence(u)</C>; and <C>sensing_bound(d1, d2, r)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rmse(M, N):
    return 0.0

def coherence(u):
    return 0.0

def sensing_bound(d1, d2, r):
    return 0
`,
        solution: COH,
        tests: [
          { name: "rmse", code: `assert rmse([[1, 2], [3, 4]], [[1, 2], [3, 6]]) == 1.0 and rmse([[0, 0, 0]], [[1, 1, 1]]) == 1.0 and rmse([[2]], [[2]]) == 0` },
          { name: "coh", code: `assert coherence([1, 1, 1, 1]) == 1 and coherence([1, 0, 0, 0]) == 4 and abs(coherence([3, 4, 0]) - 1.92) < 1e-12 and coherence([-2, 1]) == 1.6
assert sensing_bound(10, 10, 1) == 57 and sensing_bound(100, 50, 5) == 2175 and sensing_bound(100, 100, 5) == 2925` },
        ],
      },
    },
    {
      key: "cover",
      rung: "stretch",
      prompt: (
        <p>
          For a 1000 × 1000 matrix, what sampling probability p makes the expected number of entirely unseen rows,{" "}
          <M>{"d(1 - p)^d"}</M>, equal to 1? Give five decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.00688, tolerance: 0.000006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every estimator so far used structure, sparsity or low rank, to beat the curse of having more parameters than data.
        The final lesson looks at the opposite regime that modern machine learning lives in: models that fit their training
        data exactly, noise and all, and still predict well.
      </p>
    </>
  ),
};
