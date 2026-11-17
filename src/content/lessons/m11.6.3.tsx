import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SketchResidualViz } from "@/components/viz/SketchResidualViz";
import type { LessonContent } from "@/lib/types";

const SOLVE = `import numpy as np

def countsketch(M, s, rng):
    h = rng.integers(0, s, size=M.shape[0])
    g = rng.choice([-1.0, 1.0], size=M.shape[0])
    out = np.zeros((s, M.shape[1]))
    np.add.at(out, h, g[:, None] * M)
    return out

def sketch_solve(A, b, s, rng, kind):
    M = np.column_stack([A, b])
    if kind == "count":
        SM = countsketch(M, s, rng)
    else:
        SM = rng.normal(size=(s, len(b))) @ M / np.sqrt(s)
    return np.linalg.lstsq(SM[:, :-1], SM[:, -1], rcond=None)[0]

def resid_ratio(A, b, x):
    xo = np.linalg.lstsq(A, b, rcond=None)[0]
    return float(np.linalg.norm(A @ x - b) / np.linalg.norm(A @ xo - b))`;

const PREC = `import numpy as np

def sketch_precondition(A, s, rng):
    S = rng.normal(size=(s, A.shape[0])) / np.sqrt(s)
    return np.linalg.qr(S @ A)[1]

def cgls(B, b, iters):
    y, r = np.zeros(B.shape[1]), b.copy()
    g = B.T @ r
    p, gg = g.copy(), g @ g
    for _ in range(iters):
        q = B @ p
        alpha = gg / (q @ q)
        y, r = y + alpha * p, r - alpha * q
        g = B.T @ r
        gg_new = g @ g
        p, gg = g + (gg_new / gg) * p, gg_new
    return y`;

export const lesson: LessonContent = {
  id: "m11.6.3",
  minutes: 50,
  links: {
    requires: ["m11.6.2", "m11.3.4"],
    revisits: ["m11.5.3"],
    foreshadows: ["m11.6.4"],
  },

  puzzle: (
    <>
      <p>
        A regression has twenty million rows and twenty unknowns. Instead of touching all the rows in a solver, add each
        row, with a random sign, into one of a thousand buckets, and solve the resulting thousand-row problem. The residual
        is within one per cent of the best possible. Combine the sketch with a few iterations of a classical method and the
        answer is exact to machine precision, even when the matrix has condition number a million. Why can a crude random
        compression lose so little, and how does it become exact?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A least-squares problem with d unknowns only ever looks at vectors in a (d + 1)-dimensional subspace: the columns
        of A together with b. A random projection that preserves the length of every vector in that one small subspace,
        up to a factor 1 ± ε, preserves the whole problem, and by the reasoning behind Johnson–Lindenstrauss it needs a
        number of rows that depends on d and ε, not on the number of original rows. Even a rough sketch is good for
        something else: the triangular factor of the sketched matrix undoes almost all of A&apos;s ill conditioning, so
        iterating on the full problem converges in a few steps.
      </p>
      <SketchResidualViz />
    </>
  ),

  theory: (
    <>
      <Definition title="subspace embedding">
        <p>
          A random s × m matrix S is an ε-subspace embedding for a subspace V if{" "}
          <M>{"(1 - \\epsilon)\\|y\\| \\leq \\|Sy\\| \\leq (1 + \\epsilon)\\|y\\|"}</M> for every y ∈ V simultaneously. For a
          d-dimensional V, a Gaussian S with <M>{"s = O((d + \\log(1/\\delta))/\\epsilon^2)"}</M> rows is one with probability
          1 − δ (a net argument over the unit sphere of V plus the concentration bound of random projections). A CountSketch,
          which sends each row to one random bucket with a random sign, needs <M>{"s = O(d^2/(\\epsilon^2\\delta))"}</M> rows
          but is applied in time proportional to the number of nonzeros of A.
        </p>
      </Definition>

      <Theorem title="sketch and solve">
        <p>
          If S is an ε-subspace embedding for the span of the columns of A and b, and{" "}
          <M>{"\\tilde x = \\arg\\min\\|S(Ax - b)\\|"}</M>, then{" "}
          <M>{"\\|A\\tilde x - b\\| \\leq \\frac{1 + \\epsilon}{1 - \\epsilon}\\min_x\\|Ax - b\\|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Both <M>{"A\\tilde x - b"}</M> and <M>{"Ax_* - b"}</M> lie in the subspace. So{" "}
          <M>{"(1 - \\epsilon)\\|A\\tilde x - b\\| \\leq \\|S(A\\tilde x - b)\\| \\leq \\|S(Ax_* - b)\\| \\leq (1 + \\epsilon)\\|Ax_* - b\\|"}</M>,
          the middle step because <M>{"\\tilde x"}</M> minimises the sketched residual. Divide by 1 − ε.
        </p>
        <p>
          For a Gaussian sketch the average is known exactly:{" "}
          <M>{"\\mathbb E\\|A\\tilde x - b\\|^2 = (1 + d/(s - d - 1))\\|Ax_* - b\\|^2"}</M>. In the code, with 20000 rows and 20
          unknowns, sketches of 100 and 1000 rows give residual ratios 1.131 and 1.009 (Gaussian) and 1.065 and 1.006
          (CountSketch).
        </p>
        <Code>{SOLVE}</Code>
      </Proof>

      <Theorem title="sketch and precondition">
        <p>
          If S is an ε-subspace embedding for range(A) and SA = QR is a thin QR factorisation, then every singular value of{" "}
          <M>{"AR^{-1}"}</M> lies in <M>{"[1/(1 + \\epsilon), 1/(1 - \\epsilon)]"}</M>, so{" "}
          <M>{"\\kappa(AR^{-1}) \\leq (1 + \\epsilon)/(1 - \\epsilon)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For any y, <M>{"AR^{-1}y \\in \\mathrm{range}(A)"}</M> and{" "}
          <M>{"\\|SAR^{-1}y\\| = \\|Qy\\| = \\|y\\|"}</M>. The embedding property gives{" "}
          <M>{"\\|y\\|/(1 + \\epsilon) \\leq \\|AR^{-1}y\\| \\leq \\|y\\|/(1 - \\epsilon)"}</M>, which bounds the largest and
          smallest singular values.
        </p>
        <p>
          So the change of variables x = R⁻¹y turns any least-squares problem into one with condition number a small
          constant, whatever κ(A) was, and conjugate gradients on its normal equations (CGLS or LSQR) gain a fixed number
          of digits per iteration on the full, unsketched problem. In the code, κ(A) = 10⁶; a Gaussian sketch with 120 rows
          for 30 unknowns gives κ(AR⁻¹) = 3.0, and 30 CGLS iterations then reach the optimal residual to roundoff, while
          30 iterations on A itself leave an excess of 0.12%. This is the design of the Blendenpik and LSRN solvers, which
          beat dense QR on very tall problems.
        </p>
        <Code>{PREC}</Code>
      </Proof>

      <Remark title="sketches in machine learning">
        <p>
          The same tools appear across ML systems: CountSketch compresses gradients for communication-efficient distributed
          training, sketched Newton methods solve the Newton system on a random subspace, and sketching the rows of a data
          matrix gives quick approximate regressions and leverage scores for importance sampling.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eps",
      rung: "check",
      prompt: <p>With an ε-subspace embedding for ε = 0.2, by what factor at most can the sketched residual exceed the optimum?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "gauss",
      rung: "check",
      prompt: <p>For a Gaussian sketch with d = 20 unknowns and s = 221 rows, what is the expected squared-residual ratio 1 + d/(s − d − 1)?</p>,
      answer: { kind: "numeric", value: 1.1, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>When the full-precision least-squares solution is needed, why sketch and precondition instead of sketch and solve?</p>,
      answer: {
        kind: "choice",
        options: [
          "Sketch and solve only guarantees a residual within a factor of the optimum, while preconditioning lets an iterative method converge on the original problem to full accuracy",
          "Sketch and solve does not work for ill-conditioned matrices",
          "Preconditioning needs a smaller sketch than solving",
          "Sketch and solve gives a biased residual",
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

def countsketch(M, s, rng):
    h = rng.integers(0, s, size=M.shape[0])
    g = rng.choice([-1.0, 1.0], size=M.shape[0])
    out = np.zeros((s, M.shape[1]))
    np.add.at(out, h, g[:, None] * M)
    return out

def sketch_solve(A, b, s, rng, kind):
    M = np.column_stack([A, b])
    if kind == "count":
        SM = countsketch(M, s, rng)
    else:
        SM = rng.normal(size=(s, len(b))) @ M / np.sqrt(s)
    return np.linalg.lstsq(SM[:, :-1], SM[:, -1], rcond=None)[0]

def resid_ratio(A, b, x):
    xo = np.linalg.lstsq(A, b, rcond=None)[0]
    return float(np.linalg.norm(A @ x - b) / np.linalg.norm(A @ xo - b))

rng = np.random.default_rng(0); A = rng.normal(size=(20000, 20)); b = A @ rng.normal(size=20) + rng.normal(size=20000)
print([round(resid_ratio(A, b, sketch_solve(A, b, s, rng, k)), 3) for k in ["gauss", "count"] for s in [100, 1000]])
print(countsketch(np.eye(4), 2, np.random.default_rng(1)).shape, np.abs(countsketch(np.eye(6), 3, rng)).sum())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.131, 1.009, 1.065, 1.006]\n(2, 4) 6.0", "[1.009, 1.131, 1.006, 1.065]\n(2, 4) 6.0", "[1.131, 1.009, 1.065, 1.006]\n(4, 2) 6.0", "[1.131, 1.009, 1.065, 1.006]\n(2, 4) 3.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sketch_precondition(A, s, rng):
    S = rng.normal(size=(s, A.shape[0])) / np.sqrt(s)
    return np.linalg.qr(S @ A)[1]

def cgls(B, b, iters):
    y, r = np.zeros(B.shape[1]), b.copy()
    g = B.T @ r
    p, gg = g.copy(), g @ g
    for _ in range(iters):
        q = B @ p
        alpha = gg / (q @ q)
        y, r = y + alpha * p, r - alpha * q
        g = B.T @ r
        gg_new = g @ g
        p, gg = g + (gg_new / gg) * p, gg_new
    return y

rng = np.random.default_rng(2); U, _ = np.linalg.qr(rng.normal(size=(3000, 30)))
A = U @ np.diag(np.logspace(0, -6, 30)) @ np.linalg.qr(rng.normal(size=(30, 30)))[0]; b = rng.normal(size=3000)
R = sketch_precondition(A, 120, rng); B = A @ np.linalg.inv(R)
xo = np.linalg.lstsq(A, b, rcond=None)[0]; ro = np.linalg.norm(A @ xo - b)
print(round(float(np.log10(np.linalg.cond(A)))), round(np.linalg.cond(B), 1))
print([round(float(np.linalg.norm(A @ x - b) / ro - 1), 4) + 0.0 for x in [cgls(A, b, 30), np.linalg.solve(R, cgls(B, b, 30))]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6 3.0\n[0.0012, 0.0]", "6 1.0\n[0.0012, 0.0]", "3 3.0\n[0.0012, 0.0]", "6 3.0\n[0.0, 0.0012]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>countsketch(M, s, rng)</C>, which hashes each row of M to a bucket in range(s) with <C>rng.integers</C>,
          multiplies it by a random sign from <C>rng.choice</C>, and sums rows sharing a bucket; <C>sketch_solve(A, b, s, rng,
          kind)</C> for kind &quot;count&quot; or Gaussian otherwise, sketching [A b] together; and <C>resid_ratio(A, b,
          x)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def countsketch(M, s, rng):
    return M[:s]

def sketch_solve(A, b, s, rng, kind):
    return np.zeros(A.shape[1])

def resid_ratio(A, b, x):
    return 1.0
`,
        solution: SOLVE,
        tests: [
          { name: "count", code: `SM = countsketch(np.eye(6), 3, np.random.default_rng(36))
assert SM.shape == (3, 6) and np.allclose(np.abs(SM).sum(axis=0), 1) and set(np.unique(np.abs(SM))) <= {0.0, 1.0}
M1, M2 = np.random.default_rng(37).normal(size=(2, 8, 3))
assert np.allclose(countsketch(M1 + M2, 4, np.random.default_rng(5)), countsketch(M1, 4, np.random.default_rng(5)) + countsketch(M2, 4, np.random.default_rng(5)))` },
          { name: "solve", code: `rng = np.random.default_rng(38); A = rng.normal(size=(5000, 10)); b = A @ np.ones(10) + rng.normal(size=5000)
for kind in ["count", "gauss"]:
    r = resid_ratio(A, b, sketch_solve(A, b, 800, rng, kind)); assert 1.0 <= r < 1.05
assert abs(resid_ratio(A, b, np.linalg.lstsq(A, b, rcond=None)[0]) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sketch_precondition(A, s, rng)</C>, returning the R factor of the QR of a Gaussian sketch SA, and{" "}
          <C>cgls(B, b, iters)</C>, conjugate gradients on BᵀBy = Bᵀb carried out with products by B and Bᵀ only.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sketch_precondition(A, s, rng):
    return np.eye(A.shape[1])

def cgls(B, b, iters):
    return np.zeros(B.shape[1])
`,
        solution: PREC,
        tests: [
          { name: "cgls", code: `rng = np.random.default_rng(39); B = rng.normal(size=(100, 6)); b = rng.normal(size=100)
assert np.allclose(cgls(B, b, 6), np.linalg.lstsq(B, b, rcond=None)[0])` },
          { name: "precond", code: `rng = np.random.default_rng(40); U, _ = np.linalg.qr(rng.normal(size=(2000, 10)))
A = U @ np.diag(np.logspace(0, -5, 10)); R = sketch_precondition(A, 80, rng)
assert R.shape == (10, 10) and np.allclose(R, np.triu(R)) and np.linalg.cond(A @ np.linalg.inv(R)) < 4` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let S be an ε-subspace embedding for the span of the columns of A and b, x* minimise ‖Ax − b‖ and x̃ minimise
          ‖S(Ax − b)‖. Prove that ‖Ax̃ − b‖ ≤ ((1 + ε)/(1 − ε))‖Ax* − b‖.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that Ax̃ − b and Ax* − b both lie in the embedded subspace, so the embedding inequalities apply to each.",
          "Uses the lower embedding bound for Ax̃ − b and the optimality of x̃ for the sketched problem: (1 − ε)‖Ax̃ − b‖ ≤ ‖S(Ax̃ − b)‖ ≤ ‖S(Ax* − b)‖.",
          "Uses the upper embedding bound for Ax* − b and divides by 1 − ε to conclude.",
        ],
      },
    },
    {
      key: "kap",
      rung: "stretch",
      prompt: <p>If S is a (1/3)-subspace embedding for range(A), what upper bound does the theorem give for κ(AR⁻¹)?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a subspace embedding is, why it makes sketch-and-solve least squares nearly optimal, how the R factor of a sketch preconditions the full problem, and why CountSketch is attractive for sparse data.",

  glimpse: (
    <>
      <p>
        Random vectors can also measure a matrix without ever writing it down. The next lesson estimates the trace of a
        matrix, such as a Hessian, from a few matrix-vector products with random signs, and asks how many are needed.
      </p>
    </>
  ),
};
