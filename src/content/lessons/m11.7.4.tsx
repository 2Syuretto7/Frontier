import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OddPolyViz } from "@/components/viz/OddPolyViz";
import type { LessonContent } from "@/lib/types";

const PO = `import numpy as np

def polar_svd(G):
    U, s, Vt = np.linalg.svd(G, full_matrices=False)
    return U @ Vt

def odd_poly_step(X, a, b, c):
    A = X @ X.T
    return a * X + (b * A + c * A @ A) @ X

def newton_schulz(G, steps, coeffs=(1.5, -0.5, 0.0)):
    X = G / np.linalg.norm(G)
    for _ in range(steps):
        X = odd_poly_step(X, *coeffs)
    return X`;

const MU = `import numpy as np

MUON = (3.4445, -4.7750, 2.0315)

def orthogonalise(G, steps=5, coeffs=MUON):
    tall = G.shape[0] > G.shape[1]
    X = (G.T if tall else G) / (np.linalg.norm(G) + 1e-7)
    a, b, c = coeffs
    for _ in range(steps):
        A = X @ X.T
        X = a * X + (b * A + c * A @ A) @ X
    return X.T if tall else X

def scalar_orbit(s, steps, coeffs):
    a, b, c = coeffs; out = [s]
    for _ in range(steps):
        s = a * s + b * s ** 3 + c * s ** 5
        out.append(s)
    return out`;

export const lesson: LessonContent = {
  id: "m11.7.4",
  minutes: 50,
  links: {
    requires: ["m11.7.3", "m6.4.2"],
    revisits: ["m3.8.3"],
    foreshadows: ["m14.3.4"],
  },

  puzzle: (
    <>
      <p>
        The Muon optimiser replaces each weight matrix&apos;s momentum G = UΣVᵀ by UVᵀ, throwing away the singular values. It
        does not compute an SVD. It runs five steps of X ← aX + b(XXᵀ)X + c(XXᵀ)²X with a = 3.4445, b = −4.7750,
        c = 2.0315. Put x = 1 into ax + bx³ + cx⁵ and you get 0.701, so 1 is not even a fixed point: the iteration never
        produces an exactly orthogonal matrix. Why would anyone choose a polynomial that cannot converge, over the cubic
        that provably does?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An odd matrix polynomial in X leaves U and V alone and applies the scalar polynomial to each singular value. So
        computing the polar factor UVᵀ is a one-dimensional problem: find a polynomial whose iterates push every number in
        (0, 1] to 1. The cubic does it exactly but slowly from small values, because its slope at 0 is only 1.5. The Muon
        quintic has slope 3.4445 at 0, so small singular values rise more than twice as fast per step, and it settles for
        landing every singular value somewhere between about 0.7 and 1.2. For an optimiser step that is close enough, and
        five steps in bfloat16 are cheap.
      </p>
      <OddPolyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the polar factor">
        <p>
          For G ∈ ℝ^(m×n) with m ≥ n, full column rank and thin SVD G = UΣVᵀ, the polar decomposition is G = QH with{" "}
          <M>{"Q = UV^\\top"}</M>, which has orthonormal columns, and <M>{"H = V\\Sigma V^\\top = (G^\\top G)^{1/2}"}</M>,
          symmetric positive definite. For m &lt; n apply this to Gᵀ.
        </p>
      </Definition>

      <Theorem title="the nearest matrix with orthonormal columns">
        <p>
          Among all m × n matrices Q with <M>{"Q^\\top Q = I"}</M>, <M>{"UV^\\top"}</M> minimises{" "}
          <M>{"\\|G - Q\\|_F"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\|G - Q\\|_F^2 = \\|G\\|_F^2 + n - 2\\,\\mathrm{tr}(Q^\\top G)"}</M>, so it suffices to maximise{" "}
          <M>{"\\mathrm{tr}(Q^\\top G) = \\mathrm{tr}(Q^\\top U\\Sigma V^\\top) = \\mathrm{tr}(V^\\top Q^\\top U\\Sigma) = \\sum_i \\sigma_i W_{ii}"}</M>{" "}
          with <M>{"W = V^\\top Q^\\top U"}</M>. Each <M>{"W_{ii} = (Qv_i)^\\top u_i"}</M> is an inner product of unit vectors,
          so it is at most 1, and the sum is at most <M>{"\\sum_i \\sigma_i"}</M>. Q = UVᵀ gives <M>{"Qv_i = u_i"}</M> and
          attains it.
        </p>
      </Proof>

      <Theorem title="steepest descent in the spectral norm">
        <p>
          <M>{"\\max_{\\|D\\|_2 \\le 1} \\mathrm{tr}(G^\\top D) = \\sum_i \\sigma_i"}</M>, attained at <M>{"D = UV^\\top"}</M>.
          So UVᵀ is the steepest descent direction when the size of a step is measured by its spectral norm, which is the
          rationale for Muon.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{tr}(G^\\top D) = \\sum_i \\sigma_i\\, u_i^\\top D v_i"}</M> and{" "}
          <M>{"|u_i^\\top Dv_i| \\le \\|u_i\\|\\,\\|Dv_i\\| \\le \\|D\\|_2 \\le 1"}</M>. Equality holds for D = UVᵀ, whose spectral
          norm is 1.
        </p>
      </Proof>

      <Theorem title="odd polynomials act on singular values">
        <p>
          For <M>{"p(x) = ax + bx^3 + cx^5"}</M> define <M>{"p(X) = aX + b(XX^\\top)X + c(XX^\\top)^2X"}</M>. If X = UΣVᵀ then{" "}
          <M>{"p(X) = U\\,p(\\Sigma)\\,V^\\top"}</M>. Consequently, if the scalar iteration <M>{"x \\leftarrow p(x)"}</M> sends
          every singular value of <M>{"X_0"}</M> to 1, the matrix iteration converges to <M>{"UV^\\top"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"XX^\\top = U\\Sigma V^\\top V\\Sigma U^\\top = U\\Sigma^2U^\\top"}</M>, so <M>{"(XX^\\top)X = U\\Sigma^3V^\\top"}</M>{" "}
          and <M>{"(XX^\\top)^2X = U\\Sigma^5V^\\top"}</M>. Summing gives <M>{"Up(\\Sigma)V^\\top"}</M>. By induction{" "}
          <M>{"X_k = Up^{(k)}(\\Sigma)V^\\top"}</M>, where <M>{"p^{(k)}"}</M> is p applied k times, and{" "}
          <M>{"p^{(k)}(\\sigma_i) \\to 1"}</M> for each i gives <M>{"X_k \\to UV^\\top"}</M>. Only odd powers keep the form{" "}
          <M>{"U(\\cdot)V^\\top"}</M>: an even power such as XXᵀ is m × m and has no V in it.
        </p>
      </Proof>

      <Remark title="the cubic: exact but slow">
        <p>
          With p(x) = (3x − x³)/2, scale <M>{"X_0 = G/\\|G\\|_F"}</M> so that every σ ≤ 1. Then p maps (0, 1] into itself,
          increases every σ &lt; 1, and has p(1) = 1, p′(1) = 0, so all singular values converge to 1 and the end is
          quadratic. But near 0, p(x) ≈ 1.5x: a singular value of 10⁻³ needs 16 steps just to pass 1/2. In the code,
          a 6 × 4 matrix with relative singular values down to 0.004 is still far from orthogonal after 10 steps (its smallest
          singular value is 0.24) and matches the SVD only by step 20.
        </p>
        <Code>{PO}</Code>
      </Remark>

      <Remark title="the Muon quintic: fast and approximate">
        <p>
          Keller Jordan&apos;s coefficients (3.4445, −4.7750, 2.0315) were tuned to make p′(0) as large as possible while
          keeping the iterates of every x ∈ (0, 1] inside a band around 1. After five steps from 10⁻³ a singular value reaches
          0.47, against 0.0076 for the cubic, and once settled the values stay between about 0.68 and 1.2. Optimisation does
          not need exact orthogonality, only that no direction in the update dominates the others. Two implementation
          details matter. Transpose a tall matrix first so that XXᵀ is the smaller Gram matrix; a step then costs about{" "}
          <M>{"4m^2n + 2m^3"}</M> flops with m ≤ n. And all operations are products and sums, so they run in bfloat16 on
          tensor cores, where an SVD would be slow and unstable.
        </p>
        <Code>{MU}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cubic",
      rung: "check",
      prompt: <p>For the cubic p(x) = (3x − x³)/2, what is p(0.5)?</p>,
      answer: { kind: "numeric", value: 0.6875, tolerance: 0.0001 },
    },
    {
      key: "quint1",
      rung: "check",
      prompt: <p>For the Muon quintic p(x) = 3.4445x − 4.7750x³ + 2.0315x⁵, what is p(1)?</p>,
      answer: { kind: "numeric", value: 0.701, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does Muon use the quintic instead of the cubic?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its slope at 0 is much larger, so small singular values reach the neighbourhood of 1 in a few steps, and approximate orthogonality is enough for an update",
          "The quintic converges to exactly UVᵀ, while the cubic does not",
          "The quintic avoids computing XXᵀ",
          "The cubic only works for square matrices",
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

def polar_svd(G):
    U, s, Vt = np.linalg.svd(G, full_matrices=False)
    return U @ Vt

def odd_poly_step(X, a, b, c):
    A = X @ X.T
    return a * X + (b * A + c * A @ A) @ X

def newton_schulz(G, steps, coeffs=(1.5, -0.5, 0.0)):
    X = G / np.linalg.norm(G)
    for _ in range(steps):
        X = odd_poly_step(X, *coeffs)
    return X

G = np.random.default_rng(0).normal(size=(6, 4)) @ np.diag([1.0, 0.3, 0.1, 0.01])
P = polar_svd(G)
print(np.allclose(P.T @ P, np.eye(4)), [st for st in [5, 10, 15, 20] if np.allclose(newton_schulz(G, st), P)])
print(np.round(np.linalg.svd(newton_schulz(G, 10), compute_uv=False), 2) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True [20]\n[1.   1.   1.   0.24]",
          "True [5, 10, 15, 20]\n[1. 1. 1. 1.]",
          "True [10, 15, 20]\n[1. 1. 1. 1.]",
          "False [20]\n[1.   1.   1.   0.24]",
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

MUON = (3.4445, -4.7750, 2.0315)

def orthogonalise(G, steps=5, coeffs=MUON):
    tall = G.shape[0] > G.shape[1]
    X = (G.T if tall else G) / (np.linalg.norm(G) + 1e-7)
    a, b, c = coeffs
    for _ in range(steps):
        A = X @ X.T
        X = a * X + (b * A + c * A @ A) @ X
    return X.T if tall else X

def scalar_orbit(s, steps, coeffs):
    a, b, c = coeffs; out = [s]
    for _ in range(steps):
        s = a * s + b * s ** 3 + c * s ** 5
        out.append(s)
    return out

G = np.random.default_rng(0).normal(size=(6, 4)) @ np.diag([1.0, 0.3, 0.1, 0.01])
O = orthogonalise(G); s = np.linalg.svd(O, compute_uv=False)
print(O.shape, bool(0.6 < s.min() and s.max() < 1.25))
print(np.round(scalar_orbit(1e-3, 5, MUON), 3), np.round(scalar_orbit(1e-3, 5, (1.5, -0.5, 0.0))[-1], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(6, 4) True\n[0.001 0.003 0.012 0.041 0.14  0.471] 0.0076",
          "(4, 6) True\n[0.001 0.003 0.012 0.041 0.14  0.471] 0.0076",
          "(6, 4) False\n[0.001 0.003 0.012 0.041 0.14  0.471] 0.0076",
          "(6, 4) True\n[0.001 0.002 0.003 0.005 0.008 0.011] 0.0076",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>polar_svd(G)</C>, returning UVᵀ from the thin SVD; <C>odd_poly_step(X, a, b, c)</C>, returning
          aX + b(XXᵀ)X + c(XXᵀ)²X; and <C>newton_schulz(G, steps, coeffs)</C>, applying the step <C>steps</C> times from
          G/‖G‖_F, with default coefficients (1.5, −0.5, 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def polar_svd(G):
    return G

def odd_poly_step(X, a, b, c):
    return X

def newton_schulz(G, steps, coeffs=(1.5, -0.5, 0.0)):
    return G
`,
        solution: PO,
        tests: [
          { name: "polar", code: `G = np.random.default_rng(51).normal(size=(5, 3)); P = polar_svd(G); H = P.T @ G
assert P.shape == (5, 3) and np.allclose(P.T @ P, np.eye(3))
assert np.allclose(H, H.T) and np.all(np.linalg.eigvalsh(H) > 0) and np.allclose(P @ H, G)` },
          { name: "ns", code: `assert np.allclose(odd_poly_step(np.diag([0.5, 1.0]), 1.5, -0.5, 0.0), np.diag([0.6875, 1.0]))
assert np.allclose(odd_poly_step(np.diag([1.0, 2.0]), 0.0, 0.0, 1.0), np.diag([1.0, 32.0]))
G = np.random.default_rng(52).normal(size=(4, 6)); U, s, Vt = np.linalg.svd(G, full_matrices=False)
assert np.allclose(newton_schulz(G, 40), U @ Vt)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>orthogonalise(G, steps, coeffs)</C>, which transposes a tall G, scales by ‖G‖_F + 10⁻⁷, applies the odd
          quintic step <C>steps</C> times and transposes back, and <C>scalar_orbit(s, steps, coeffs)</C>, returning the list
          [s, p(s), p(p(s)), …] of length steps + 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

MUON = (3.4445, -4.7750, 2.0315)

def orthogonalise(G, steps=5, coeffs=MUON):
    return G

def scalar_orbit(s, steps, coeffs):
    return [s]
`,
        solution: MU,
        tests: [
          { name: "orbit", code: `assert np.allclose(scalar_orbit(1.0, 2, (1.5, -0.5, 0.0)), [1.0, 1.0, 1.0])
assert np.allclose(scalar_orbit(0.5, 1, MUON), [0.5, 3.4445 * 0.5 - 4.775 * 0.125 + 2.0315 * 0.03125])` },
          { name: "orth", code: `G = np.random.default_rng(53).normal(size=(7, 3)); O = orthogonalise(G); s = np.linalg.svd(O, compute_uv=False)
assert O.shape == (7, 3) and s.min() > 0.6 and s.max() < 1.25 and np.allclose(orthogonalise(G.T), O.T)
U, _, Vt = np.linalg.svd(G, full_matrices=False)
assert np.allclose(orthogonalise(G, 40, (1.5, -0.5, 0.0)), U @ Vt, atol=1e-6)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let X = UΣVᵀ be a thin SVD and p(x) = ax + bx³ + cx⁵. Prove that aX + b(XXᵀ)X + c(XXᵀ)²X = U p(Σ) Vᵀ, and deduce that
          if p applied repeatedly sends every singular value of X₀ to 1, then the matrix iteration converges to UVᵀ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes XXᵀ = UΣ²Uᵀ using VᵀV = I, and hence (XXᵀ)X = UΣ³Vᵀ and (XXᵀ)²X = UΣ⁵Vᵀ (using UᵀU = I).",
          "Sums the terms to get U p(Σ) Vᵀ, and argues by induction that X_k = U p^(k)(Σ) Vᵀ with the same U and V.",
          "Concludes that p^(k)(σ_i) → 1 for every i gives X_k → UVᵀ.",
        ],
      },
    },
    {
      key: "nuc",
      rung: "stretch",
      prompt: <p>What is the largest value of tr(GᵀD) over all D with ‖D‖₂ ≤ 1, for G = [[1, 2], [2, 1]]?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the polar factor of a matrix is and why it is the steepest descent direction in the spectral norm, why an odd matrix polynomial acts on each singular value separately, and why Muon prefers a quintic that never converges exactly to the cubic that does.",

  glimpse: (
    <>
      <p>
        This finishes matrix functions. The last chapter of the course turns from matrices to differential equations: how
        to step x′ = f(x) forward in time with Euler and Runge–Kutta methods, and why those steps are the same thing as
        sampling from a diffusion model.
      </p>
    </>
  ),
};
