import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShiftInvertViz } from "@/components/viz/ShiftInvertViz";
import type { LessonContent } from "@/lib/types";

const IT = `import numpy as np

def power_iteration(A, x, iters):
    for _ in range(iters):
        x = A @ x
        x = x / np.linalg.norm(x)
    return float(x @ A @ x), x

def inverse_iteration(A, sigma, x, iters):
    M = A - sigma * np.eye(A.shape[0])
    for _ in range(iters):
        x = np.linalg.solve(M, x)
        x = x / np.linalg.norm(x)
    return float(x @ A @ x), x

def rqi(A, x, iters):
    x = x / np.linalg.norm(x)
    hist = []
    for _ in range(iters):
        mu = float(x @ A @ x)
        hist.append(mu)
        x = np.linalg.solve(A - mu * np.eye(len(x)), x)
        x = x / np.linalg.norm(x)
    return hist`;

const RATE = `import numpy as np

def sym_with_eigs(lams, rng):
    Q, _ = np.linalg.qr(rng.normal(size=(len(lams), len(lams))))
    return Q @ np.diag(lams) @ Q.T

def power_errors(A, lam1, x, iters):
    errs = []
    for _ in range(iters):
        x = A @ x
        x = x / np.linalg.norm(x)
        errs.append(abs(float(x @ A @ x) - lam1))
    return errs`;

export const lesson: LessonContent = {
  id: "m11.4.1",
  minutes: 50,
  links: {
    requires: ["m11.3.1", "m3.7.4"],
    revisits: ["m5.5.4", "m3.7.3"],
    foreshadows: ["m11.4.2", "m11.4.3"],
  },

  puzzle: (
    <>
      <p>
        Power iteration, multiplying a vector by A over and over, finds the largest eigenvalue and nothing else, and it
        crawls when the top two eigenvalues are close. Yet a small change, solving a linear system with A − σI instead of
        multiplying by A, finds whichever eigenvalue you aim at, and with σ updated each step it gains digits so fast that
        the number of correct digits roughly triples per iteration. Stranger still, the system it solves becomes more and
        more singular as it succeeds. Why is that not a disaster?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every vector is a mix of eigenvectors, and multiplying by A scales each component by its eigenvalue, so the
        component with the largest eigenvalue grows fastest and eventually dominates. Any function of A with the same
        eigenvectors can play the role of A. The inverse of A − σI scales component i by 1/(λᵢ − σ), which is huge for the
        eigenvalue nearest σ: pick σ and you pick the winner. A nearly singular solve produces a huge vector, but almost all
        of its size points along the wanted eigenvector, and normalising throws the size away.
      </p>
      <ShiftInvertViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="power iteration">
        <p>
          Let A be diagonalisable with eigenpairs <M>{"(\\lambda_i, v_i)"}</M>, <M>{"|\\lambda_1| > |\\lambda_2| \\geq \\cdots"}</M>,
          and let <M>{"x_0 = \\sum c_iv_i"}</M> with <M>{"c_1 \\neq 0"}</M>. The iterates{" "}
          <M>{"x_k = A^kx_0/\\|A^kx_0\\|"}</M> converge in direction to <M>{"v_1"}</M>, with error{" "}
          <M>{"O(|\\lambda_2/\\lambda_1|^k)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"A^kx_0 = \\lambda_1^k\\left(c_1v_1 + \\sum_{i \\geq 2} c_i(\\lambda_i/\\lambda_1)^kv_i\\right)"}</M>, and every ratio
          in the sum has absolute value at most <M>{"|\\lambda_2/\\lambda_1|"}</M>. Normalising removes the factor{" "}
          <M>{"\\lambda_1^k"}</M>. A random start has <M>{"c_1 \\neq 0"}</M> with probability 1.
        </p>
      </Proof>

      <Theorem title="the Rayleigh quotient is quadratically accurate">
        <p>
          For symmetric A, unit eigenvector v with eigenvalue λ, and unit x = cos θ · v + sin θ · w with w a unit vector
          orthogonal to v, the Rayleigh quotient <M>{"r(x) = x^\\top Ax"}</M> satisfies{" "}
          <M>{"r(x) - \\lambda = \\sin^2\\theta\\,(w^\\top Aw - \\lambda)"}</M>, so{" "}
          <M>{"|r(x) - \\lambda| \\leq (\\lambda_{\\max} - \\lambda_{\\min})\\sin^2\\theta"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand: <M>{"x^\\top Ax = \\cos^2\\theta\\,\\lambda + 2\\sin\\theta\\cos\\theta\\,w^\\top Av + \\sin^2\\theta\\,w^\\top Aw"}</M>.
          The middle term vanishes because <M>{"w^\\top Av = \\lambda w^\\top v = 0"}</M>. Subtract{" "}
          <M>{"\\lambda = (\\cos^2\\theta + \\sin^2\\theta)\\lambda"}</M>. Finally <M>{"w^\\top Aw"}</M> and λ both lie in{" "}
          <M>{"[\\lambda_{\\min}, \\lambda_{\\max}]"}</M>.
        </p>
        <p>
          So for symmetric matrices the eigenvalue estimate from power iteration converges at rate{" "}
          <M>{"|\\lambda_2/\\lambda_1|^2"}</M> per step: in the code, eigenvalue ratios 0.9 and 0.5 give error ratios 0.81 and
          0.25.
        </p>
        <Code>{RATE}</Code>
      </Proof>

      <Theorem title="inverse iteration with a shift">
        <p>
          <M>{"(A - \\sigma I)^{-1}"}</M> has the same eigenvectors as A, with eigenvalues <M>{"1/(\\lambda_i - \\sigma)"}</M>.
          Power iteration with it converges to the eigenvector whose eigenvalue <M>{"\\lambda_J"}</M> is nearest σ, at rate{" "}
          <M>{"|\\lambda_J - \\sigma|/|\\lambda_K - \\sigma|"}</M> with <M>{"\\lambda_K"}</M> the second nearest.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(A - \\sigma I)v_i = (\\lambda_i - \\sigma)v_i"}</M>, so <M>{"(A - \\sigma I)^{-1}v_i = v_i/(\\lambda_i - \\sigma)"}</M>.
          Apply the power iteration theorem to this matrix, whose largest eigenvalue in absolute value is{" "}
          <M>{"1/|\\lambda_J - \\sigma|"}</M>. In practice, factor A − σI once with LU and reuse it for every step.
        </p>
      </Proof>

      <Remark title="the nearly singular solve and Rayleigh quotient iteration">
        <p>
          A backward stable solver returns the exact solution of <M>{"(A - \\sigma I + E)y = x"}</M> with ‖E‖ = O(u‖A‖). When
          σ is very close to <M>{"\\lambda_J"}</M>, y is huge and wrong in its tiny components, but its dominant part is still
          along <M>{"v_J"}</M>, which is all we keep after normalising: the error is in the direction we want. Rayleigh
          quotient iteration sets <M>{"\\sigma_k = r(x_k)"}</M> each step. For symmetric A the quadratic accuracy of r makes
          the shift error the square of the eigenvector error, and inverse iteration then multiplies the eigenvector error
          by about that shift error, so errors go from ε to about ε³: cubic convergence. In the code, starting from e₁ it
          reaches errors 0.7, 0.4, 0.04 and 3 × 10⁻⁵ in the eigenvalue; the next step is at roundoff. The price is a new
          factorisation every step, and it converges to some eigenvalue near the start, not one you choose in advance.
        </p>
        <Code>{IT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "iters",
      rung: "check",
      prompt: (
        <p>
          With |λ₂/λ₁| = 0.9, about how many power iterations reduce the eigenvector error by a factor of 10⁻⁶? Use
          6/(−log₁₀ 0.9).
        </p>
      ),
      answer: { kind: "numeric", value: 131.1, tolerance: 1 },
    },
    {
      key: "shift",
      rung: "check",
      prompt: <p>A has eigenvalues 1, 3 and 5. What is the convergence rate per step of inverse iteration with σ = 3.1?</p>,
      answer: { kind: "numeric", value: 0.05263, tolerance: 0.0005 },
    },
    {
      key: "sing",
      rung: "apply",
      prompt: <p>Why does inverse iteration work even though A − σI is nearly singular when σ is close to an eigenvalue?</p>,
      answer: {
        kind: "choice",
        options: [
          "The large error in the computed solution lies mostly along the wanted eigenvector, and normalising discards the size",
          "The solver detects near-singularity and perturbs σ",
          "Nearly singular systems are solved exactly in floating point",
          "It does not work; σ must be kept far from every eigenvalue",
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

def power_iteration(A, x, iters):
    for _ in range(iters):
        x = A @ x
        x = x / np.linalg.norm(x)
    return float(x @ A @ x), x

def inverse_iteration(A, sigma, x, iters):
    M = A - sigma * np.eye(A.shape[0])
    for _ in range(iters):
        x = np.linalg.solve(M, x)
        x = x / np.linalg.norm(x)
    return float(x @ A @ x), x

def rqi(A, x, iters):
    x = x / np.linalg.norm(x)
    hist = []
    for _ in range(iters):
        mu = float(x @ A @ x)
        hist.append(mu)
        x = np.linalg.solve(A - mu * np.eye(len(x)), x)
        x = x / np.linalg.norm(x)
    return hist

A = np.array([[2.0, 1.0, 0.0], [1.0, 3.0, 1.0], [0.0, 1.0, 4.0]]); x0 = np.ones(3)
print(round(power_iteration(A, x0, 100)[0], 4), round(inverse_iteration(A, 1.0, x0, 30)[0], 4), round(inverse_iteration(A, 2.9, x0, 10)[0], 4))
print([f"{abs(m - (3 - np.sqrt(3))):.0e}" for m in rqi(A, np.array([1.0, 0.0, 0.0]), 4)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.7321 1.2679 3.0\n['7e-01', '4e-01', '4e-02', '3e-05']",
          "4.7321 1.2679 3.0\n['7e-01', '4e-01', '2e-01', '1e-01']",
          "4.7321 3.0 3.0\n['7e-01', '4e-01', '4e-02', '3e-05']",
          "1.2679 4.7321 3.0\n['7e-01', '4e-01', '4e-02', '3e-05']",
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

def sym_with_eigs(lams, rng):
    Q, _ = np.linalg.qr(rng.normal(size=(len(lams), len(lams))))
    return Q @ np.diag(lams) @ Q.T

def power_errors(A, lam1, x, iters):
    errs = []
    for _ in range(iters):
        x = A @ x
        x = x / np.linalg.norm(x)
        errs.append(abs(float(x @ A @ x) - lam1))
    return errs

rng = np.random.default_rng(0)
for lams in [[10.0, 9.0, 1.0, 0.5], [10.0, 5.0, 1.0, 0.5]]:
    e = power_errors(sym_with_eigs(lams, rng), 10.0, np.ones(4), 30)
    print(round(e[20] / e[19], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.81\n0.25", "0.9\n0.5", "0.81\n0.5", "0.9\n0.25"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>power_iteration(A, x, iters)</C> and <C>inverse_iteration(A, sigma, x, iters)</C>, each returning (Rayleigh
          quotient, unit vector), and <C>rqi(A, x, iters)</C>, returning the list of Rayleigh quotients used as shifts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def power_iteration(A, x, iters):
    return 0.0, x

def inverse_iteration(A, sigma, x, iters):
    return 0.0, x

def rqi(A, x, iters):
    return []
`,
        solution: IT,
        tests: [
          { name: "power", code: `A = np.diag([5.0, 2.0, -1.0]); lam, v = power_iteration(A, np.ones(3), 60)
assert abs(lam - 5.0) < 1e-9 and abs(abs(v[0]) - 1.0) < 1e-9
lam, v = inverse_iteration(A, 1.8, np.ones(3), 20)
assert abs(lam - 2.0) < 1e-9 and abs(abs(v[1]) - 1.0) < 1e-9` },
          { name: "rqi", code: `A = np.array([[2.0, 1.0], [1.0, 2.0]])
h = rqi(A, np.array([1.0, 0.2]), 4)
assert len(h) == 4 and abs(h[0] - (2 + 0.4) / 1.04) < 1e-12 and abs(h[3] - 3.0) < 1e-6 and abs(h[2] - 3.0) < 0.01` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sym_with_eigs(lams, rng)</C>, a random symmetric matrix QΛQᵀ with Q from the QR of a Gaussian matrix, and{" "}
          <C>power_errors(A, lam1, x, iters)</C>, the list of |r(xₖ) − λ₁| after each power step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sym_with_eigs(lams, rng):
    return np.diag(lams)

def power_errors(A, lam1, x, iters):
    return []
`,
        solution: RATE,
        tests: [
          { name: "eigs", code: `A = sym_with_eigs([4.0, 2.0, 1.0], np.random.default_rng(16))
assert np.allclose(A, A.T) and np.allclose(np.linalg.eigvalsh(A), [1.0, 2.0, 4.0]) and not np.allclose(A, np.diag(np.diag(A)))` },
          { name: "errs", code: `A = sym_with_eigs([4.0, 2.0, 1.0], np.random.default_rng(17))
e = power_errors(A, 4.0, np.ones(3), 15)
assert len(e) == 15 and e[-1] < e[0] and abs(e[12] / e[11] - 0.25) < 0.01` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A be symmetric, Av = λv with ‖v‖ = 1, and x = cos θ · v + sin θ · w with w a unit vector orthogonal to v. Prove
          that xᵀAx − λ = sin²θ (wᵀAw − λ).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Expands xᵀAx into the three terms cos²θ vᵀAv, 2 sin θ cos θ wᵀAv (using symmetry), and sin²θ wᵀAw.",
          "Shows the cross term vanishes since wᵀAv = λwᵀv = 0, and vᵀAv = λ.",
          "Subtracts λ = (cos²θ + sin²θ)λ to obtain sin²θ (wᵀAw − λ).",
        ],
      },
    },
    {
      key: "rq",
      rung: "stretch",
      prompt: (
        <p>
          For symmetric A with λ₁ = 10 and λ₂ = 9, about how many power iterations reduce the Rayleigh quotient error by a
          factor of 10⁻⁶?
        </p>
      ),
      answer: { kind: "numeric", value: 65.6, tolerance: 1 },
    },
  ],

  teachBack:
    "Explain to a friend why power iteration converges to the top eigenvector and how fast, why the Rayleigh quotient doubles the rate for symmetric matrices, how a shift and an inverse let you target any eigenvalue, and why the nearly singular solve does no harm.",

  glimpse: (
    <>
      <p>
        Power iteration finds one eigenvector. Run it on a whole block of vectors at once, re-orthogonalising each time, and
        you get all of them: the next lesson shows that this subspace iteration, in disguise, is the QR algorithm that
        computes every eigenvalue in practice.
      </p>
    </>
  ),
};
