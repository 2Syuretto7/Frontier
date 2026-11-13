import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CondEllipseViz } from "@/components/viz/CondEllipseViz";
import type { LessonContent } from "@/lib/types";

const KAPPA = `import numpy as np

def rel_cond_scalar(f, df, x):
    return abs(x * df(x) / f(x))

def cond2(A):
    s = np.linalg.svd(A, compute_uv=False)
    return float(s[0] / s[-1])

def worst_amplification(A, b, trials, rng):
    x = np.linalg.solve(A, b)
    best = 0.0
    for _ in range(trials):
        db = rng.normal(size=b.shape) * 1e-8
        dx = np.linalg.solve(A, b + db) - x
        amp = (np.linalg.norm(dx) / np.linalg.norm(x)) / (np.linalg.norm(db) / np.linalg.norm(b))
        best = max(best, amp)
    return best`;

const HIL = `import numpy as np

def hilbert(n):
    i = np.arange(n)
    return 1.0 / (i[:, None] + i[None, :] + 1)

def digits_lost(n):
    H = hilbert(n)
    x = np.ones(n)
    xh = np.linalg.solve(H, H @ x)
    err = np.linalg.norm(xh - x) / np.linalg.norm(x)
    return float(np.log10(np.linalg.cond(H))), float(-np.log10(err))`;

export const lesson: LessonContent = {
  id: "m11.2.1",
  minutes: 45,
  links: {
    requires: ["m11.1.3", "m3.8.3"],
    revisits: ["m3.3.3"],
    foreshadows: ["m11.2.2"],
  },

  puzzle: (
    <>
      <p>
        Solve the 12 × 12 linear system Hx = b, where H has entries 1/(i + j + 1) and b was built so that the exact answer is
        all ones. A careful, standard solver in double precision returns an answer with only about one correct digit, even
        though every arithmetic step was accurate to sixteen. Was the solver badly written, or is the problem itself
        asking for something no algorithm can deliver?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Any computation starts from data that is already slightly wrong: rounded inputs, measured values, the output of
        an earlier step. The condition number of a problem measures how much the answer can move, relative to its size,
        when the input moves by a small relative amount. It belongs to the problem, not to the algorithm. A well-conditioned
        problem has a condition number near 1; an ill-conditioned one magnifies tiny input errors into large output errors,
        and no method can undo that, because the method never sees the exact input.
      </p>
      <p>
        For a linear system, perturbing b over a small circle moves x over an ellipse. When the columns of A are nearly
        parallel the ellipse becomes a long needle, and a small change in b can push x far along it.
      </p>
      <CondEllipseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="relative condition number">
        <p>For a differentiable map f with Jacobian J at x, the relative condition number of evaluating f at x is</p>
        <MD>{"\\kappa_f(x) = \\lim_{\\epsilon \\to 0}\\ \\sup_{\\|\\delta x\\| \\leq \\epsilon\\|x\\|} \\frac{\\|f(x + \\delta x) - f(x)\\|/\\|f(x)\\|}{\\|\\delta x\\|/\\|x\\|} = \\frac{\\|J(x)\\|\\,\\|x\\|}{\\|f(x)\\|}."}</MD>
        <p>
          For a scalar function this is <M>{"\\kappa_f(x) = |x f'(x)/f(x)|"}</M>. A relative input error of size u then
          produces a relative output error of about <M>{"\\kappa_f(x)\\,u"}</M>.
        </p>
      </Definition>

      <Remark title="examples">
        <p>
          For <M>{"f(x) = x^p"}</M> the condition number is |p| everywhere, so powers and roots are well conditioned: √x has
          condition 1/2. For <M>{"e^x"}</M> it is |x|, large only for large arguments. For log x it is 1/|log x|, which blows
          up near x = 1, where log x is near 0: at x = 1.001 it is about 1000.5. Subtraction f(x, y) = x − y has condition{" "}
          <M>{"(|x| + |y|)/|x - y|"}</M>, which is exactly the cancellation of the previous chapter seen as a property of the
          problem: when x ≈ y the difference is ill conditioned, however it is computed.
        </p>
      </Remark>

      <Definition title="condition number of a matrix">
        <p>For an invertible matrix A,</p>
        <MD>{"\\kappa(A) = \\|A\\|\\,\\|A^{-1}\\|, \\qquad \\kappa_2(A) = \\frac{\\sigma_1(A)}{\\sigma_n(A)}"}</MD>
        <p>
          in the 2-norm, by the singular value decomposition. Always <M>{"\\kappa(A) \\geq \\|AA^{-1}\\| = 1"}</M>, with
          equality in the 2-norm exactly for nonzero multiples of orthogonal matrices.
        </p>
      </Definition>

      <Theorem title="perturbation of a linear system">
        <p>
          If Ax = b with b ≠ 0 and <M>{"A(x + \\delta x) = b + \\delta b"}</M>, then
        </p>
        <MD>{"\\frac{\\|\\delta x\\|}{\\|x\\|} \\leq \\kappa(A)\\,\\frac{\\|\\delta b\\|}{\\|b\\|},"}</MD>
        <p>and for each A there are b and δb for which equality holds.</p>
      </Theorem>
      <Proof>
        <p>
          Subtracting, <M>{"A\\,\\delta x = \\delta b"}</M>, so <M>{"\\|\\delta x\\| = \\|A^{-1}\\delta b\\| \\leq \\|A^{-1}\\|\\,\\|\\delta b\\|"}</M>.
          Also <M>{"\\|b\\| = \\|Ax\\| \\leq \\|A\\|\\,\\|x\\|"}</M>, so <M>{"1/\\|x\\| \\leq \\|A\\|/\\|b\\|"}</M>. Multiplying the two
          inequalities gives the bound. In the 2-norm, equality holds when x is the top right singular vector (so b = σ₁u₁)
          and δb is a multiple of the last left singular vector (so δx is a multiple of <M>{"v_n/\\sigma_n"}</M>).
        </p>
        <p>
          The code measures this. For the nearly singular 2 × 2 matrix with rows (1, 1) and (1, 1.0001), κ₂ ≈ 40002, and the
          worst amplification over random perturbations of b matches κ₂ to two decimal places.
        </p>
        <Code>{KAPPA}</Code>
      </Proof>

      <Remark title="the rule of thumb">
        <p>
          Even a perfect algorithm must first round b, a relative change of about u = 2⁻⁵³ ≈ 1.1 × 10⁻¹⁶, so the computed x
          can be off by a relative amount of up to κ(A)·u. Roughly, you lose <M>{"\\log_{10}\\kappa(A)"}</M> of your sixteen
          decimal digits. The Hilbert matrix with entries 1/(i + j + 1) is the classic example: its condition number grows
          like <M>{"e^{3.5n}"}</M>. In the code, n = 4, 8, 12 give κ ≈ 10^4.2, 10^10.2 and 10^16.2, and solving recovers about
          13, 7 and 1 correct digits, just as the rule predicts. Perturbations of A itself behave the same way: to first
          order, <M>{"\\|\\delta x\\|/\\|x\\| \\lesssim \\kappa(A)\\,\\|\\delta A\\|/\\|A\\|"}</M>.
        </p>
        <Code>{HIL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "exp",
      rung: "check",
      prompt: <p>What is the relative condition number of evaluating eˣ at x = 5?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "diag",
      rung: "check",
      prompt: <p>What is κ₂ of the diagonal matrix with diagonal entries 3 and 0.02?</p>,
      answer: { kind: "numeric", value: 150, tolerance: 0.001 },
    },
    {
      key: "digits",
      rung: "apply",
      prompt: (
        <p>
          A linear system with κ(A) ≈ 10¹⁰ is solved in double precision by a good solver. About how many correct significant
          digits should you expect in x?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["About 6", "About 16, because the solver is accurate", "About 10", "None at all"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def rel_cond_scalar(f, df, x):
    return abs(x * df(x) / f(x))

def cond2(A):
    s = np.linalg.svd(A, compute_uv=False)
    return float(s[0] / s[-1])

def worst_amplification(A, b, trials, rng):
    x = np.linalg.solve(A, b)
    best = 0.0
    for _ in range(trials):
        db = rng.normal(size=b.shape) * 1e-8
        dx = np.linalg.solve(A, b + db) - x
        amp = (np.linalg.norm(dx) / np.linalg.norm(x)) / (np.linalg.norm(db) / np.linalg.norm(b))
        best = max(best, amp)
    return best

print(round(rel_cond_scalar(np.log, lambda x: 1 / x, 1.001), 1), round(rel_cond_scalar(np.sqrt, lambda x: 0.5 / np.sqrt(x), 7.0), 4))
A = np.array([[1.0, 1.0], [1.0, 1.0001]]); b = np.array([2.0, 2.0001])
print(round(cond2(A)), round(worst_amplification(A, b, 2000, np.random.default_rng(0)) / cond2(A), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1000.5 0.5\n40002 1.0", "0.001 0.5\n40002 1.0", "1000.5 2.0\n40002 1.0", "1000.5 0.5\n200 1.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def hilbert(n):
    i = np.arange(n)
    return 1.0 / (i[:, None] + i[None, :] + 1)

def digits_lost(n):
    H = hilbert(n)
    x = np.ones(n)
    xh = np.linalg.solve(H, H @ x)
    err = np.linalg.norm(xh - x) / np.linalg.norm(x)
    return float(np.log10(np.linalg.cond(H))), float(-np.log10(err))

for n in [4, 8, 12]:
    k, d = digits_lost(n)
    print(n, round(k, 1), round(d))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 4.2 13\n8 10.2 7\n12 16.2 1", "4 4.2 4\n8 10.2 10\n12 16.2 16", "4 4.2 16\n8 10.2 16\n12 16.2 16", "4 2.1 13\n8 5.1 7\n12 8.1 1"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rel_cond_scalar(f, df, x)</C> returning |x f′(x)/f(x)|, <C>cond2(A)</C> returning σ₁/σₙ as a float, and{" "}
          <C>worst_amplification(A, b, trials, rng)</C>, which solves Ax = b, then for each trial draws a normal perturbation
          db scaled by 10⁻⁸, solves again, and returns the largest ratio of the relative change in x to the relative change in
          b.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rel_cond_scalar(f, df, x):
    return 0.0

def cond2(A):
    return 1.0

def worst_amplification(A, b, trials, rng):
    return 0.0
`,
        solution: KAPPA,
        tests: [
          { name: "scalar", code: `assert abs(rel_cond_scalar(np.exp, np.exp, 3.0) - 3.0) < 1e-12 and abs(cond2(np.diag([2.0, 0.5])) - 4.0) < 1e-12 and isinstance(cond2(np.eye(2)), float)` },
          { name: "amp", code: `A = np.diag([1.0, 0.01]); b = np.array([1.0, 0.0])
a = worst_amplification(A, b, 500, np.random.default_rng(1))
assert 90 < a <= 100.0001` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hilbert(n)</C>, the n × n matrix with entries 1/(i + j + 1) for 0-based i and j, and{" "}
          <C>digits_lost(n)</C>, which solves Hx = Hx₀ for x₀ the vector of ones and returns the pair (log₁₀ κ₂(H), −log₁₀ of
          the relative 2-norm error) as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hilbert(n):
    return np.eye(n)

def digits_lost(n):
    return 0.0, 16.0
`,
        solution: HIL,
        tests: [
          { name: "hilbert", code: `H = hilbert(3)
assert H.shape == (3, 3) and abs(H[2, 2] - 0.2) < 1e-15 and abs(H[0, 1] - 0.5) < 1e-15 and np.allclose(H, H.T)` },
          { name: "digits", code: `k, d = digits_lost(4)
assert 4.0 < k < 4.5 and d > 10
k, d = digits_lost(10)
assert 13.0 < k < 13.5 and d < 6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A be invertible, Ax = b with b ≠ 0, and A(x + δx) = b + δb. Prove that ‖δx‖/‖x‖ ≤ ‖A‖‖A⁻¹‖·‖δb‖/‖b‖ for any
          vector norm and its induced matrix norm.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Derives A δx = δb and hence ‖δx‖ ≤ ‖A⁻¹‖‖δb‖.",
          "Uses ‖b‖ = ‖Ax‖ ≤ ‖A‖‖x‖ to get 1/‖x‖ ≤ ‖A‖/‖b‖ (noting x ≠ 0 since b ≠ 0).",
          "Multiplies the two inequalities to obtain the stated bound.",
        ],
      },
    },
    {
      key: "sub",
      rung: "stretch",
      prompt: <p>What is the relative condition number of computing x − y at x = 1.0, y = 0.99?</p>,
      answer: { kind: "numeric", value: 199, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend what a condition number measures, why it is a property of the problem rather than the algorithm, why κ(A) = σ₁/σₙ bounds how much a linear system amplifies relative errors, and how many digits you should expect to lose.",

  glimpse: (
    <>
      <p>
        If even a perfect algorithm loses log₁₀ κ digits, what should we ask of a real one? The next lesson gives the
        answer: an algorithm is backward stable if its output is the exact answer to a slightly perturbed problem, and then
        the condition number alone decides the accuracy.
      </p>
    </>
  ),
};
