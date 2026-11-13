import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ExpHumpViz } from "@/components/viz/ExpHumpViz";
import type { LessonContent } from "@/lib/types";

const EXPM = `import numpy as np

def taylor_exp(A, terms):
    E = T = np.eye(len(A))
    for k in range(1, terms):
        T = T @ A / k
        E = E + T
    return E

def expm_ss(A, terms=16):
    s = max(0, int(np.ceil(np.log2(np.linalg.norm(A, 1) / 0.5)))) if A.any() else 0
    E = taylor_exp(A / 2 ** s, terms)
    for _ in range(s):
        E = E @ E
    return E

def expm_eig(A):
    lam, V = np.linalg.eig(A)
    return ((V * np.exp(lam)) @ np.linalg.inv(V)).real`;

const HUMP = `import numpy as np

def exp_upper2(a, b, m, t):
    c = m * t * np.exp(a * t) if a == b else m * (np.exp(a * t) - np.exp(b * t)) / (a - b)
    return np.array([[np.exp(a * t), c], [0.0, np.exp(b * t)]])

def hump(a, b, m, ts):
    norms = [np.linalg.norm(exp_upper2(a, b, m, t), 2) for t in ts]
    i = int(np.argmax(norms))
    return float(ts[i]), float(norms[i])`;

export const lesson: LessonContent = {
  id: "m11.7.1",
  minutes: 50,
  links: {
    requires: ["m11.2.2", "m3.7.2"],
    revisits: ["m6.3.3"],
    foreshadows: ["m11.7.2", "m11.8.2"],
  },

  puzzle: (
    <>
      <p>
        The exponential of a matrix is defined by the same series as eˣ, and summing that series is the first method
        anyone tries. For the 1 × 1 matrix −30 it returns −0.00003, a negative number, for a quantity that is about 10⁻¹³.
        Diagonalising first fails on a different matrix, nearly defective, by seven orders of magnitude more than
        roundoff. The method that every library uses instead halves the matrix several times, sums a short series, and
        squares the result back up. Why do the two natural methods fail, and why does squaring work?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The series for e^A adds terms that grow before they shrink. When the answer is small, as for e^(−30), it is the
        difference of enormous terms of alternating sign, and cancellation destroys it. Diagonalising computes e^A as
        Ve^ΛV⁻¹, which is exact in theory but multiplies rounding errors by the condition number of V, huge when the
        eigenvectors are nearly parallel. Scaling makes the matrix small, where a dozen Taylor terms are accurate to
        roundoff with no cancellation; squaring then uses e^A = (e^(A/2^s))^(2^s), which is exact for commuting pieces.
        Nearly parallel eigenvectors also matter for the dynamics: solutions of x′ = Ax can grow for a while even when every
        eigenvalue is negative.
      </p>
      <ExpHumpViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the matrix exponential">
        <MD>{"e^A = \\sum_{k=0}^\\infty\\frac{A^k}{k!},"}</MD>
        <p>
          which converges absolutely for every square A, with <M>{"\\|e^A\\| \\leq e^{\\|A\\|}"}</M>. Differentiating term by
          term gives <M>{"\\tfrac{d}{dt}e^{tA} = Ae^{tA}"}</M>, so <M>{"x(t) = e^{tA}x_0"}</M> solves x′ = Ax with x(0) = x₀.
        </p>
      </Definition>

      <Theorem title="products of exponentials">
        <p>
          If AB = BA then <M>{"e^{A+B} = e^Ae^B"}</M>. In particular <M>{"e^{-A} = (e^A)^{-1}"}</M>, and{" "}
          <M>{"e^A = (e^{A/2^s})^{2^s}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Since A and B commute, the binomial theorem holds:{" "}
          <M>{"(A + B)^n = \\sum_k\\binom nkA^kB^{n-k}"}</M>. Multiplying the absolutely convergent series for{" "}
          <M>{"e^A"}</M> and <M>{"e^B"}</M> and collecting terms of total degree n gives{" "}
          <M>{"\\sum_{k}\\frac{A^kB^{n-k}}{k!(n-k)!} = \\frac{(A + B)^n}{n!}"}</M>. Then A and −A commute, and so do the 2ˢ
          copies of <M>{"A/2^s"}</M>. Without commutation the identity fails, which is why splitting methods for{" "}
          <M>{"e^{A+B}"}</M> carry error terms involving AB − BA.
        </p>
      </Proof>

      <Remark title="two methods that fail">
        <p>
          Truncated Taylor: for −30 the terms reach about 8 × 10¹¹ before decreasing, so rounding errors of order 10⁻⁴ swamp
          the answer 9.4 × 10⁻¹⁴; the code gets a relative error above 1. Even on the classic test matrix with rows (−49, 24)
          and (−64, 31), whose eigenvalues are −1 and −17, sixty terms lose about eight digits. Eigendecomposition: if{" "}
          <M>{"A = V\\Lambda V^{-1}"}</M> then <M>{"e^A = Ve^\\Lambda V^{-1}"}</M>, accurate when V is well conditioned, as for
          the test matrix, but for the nearly defective matrix with rows (1, 1) and (0, 1 + 10⁻¹⁰), κ(V) is about 10¹⁰ and
          the error exceeds 10⁻⁹.
        </p>
      </Remark>

      <Theorem title="scaling and squaring">
        <p>
          Choose s with <M>{"\\|A\\|/2^s \\leq \\tfrac12"}</M> and let T be the Taylor polynomial of degree 15. Then{" "}
          <M>{"\\|T(A/2^s) - e^{A/2^s}\\| \\leq 2\\cdot\\frac{(1/2)^{16}}{16!} \\approx 1.5 \\times 10^{-18}"}</M>, far below the
          unit roundoff, and <M>{"e^A \\approx T(A/2^s)^{2^s}"}</M> after s squarings.
        </p>
      </Theorem>
      <Proof>
        <p>
          With B = A/2ˢ and ‖B‖ ≤ 1/2, the tail of the series is at most{" "}
          <M>{"\\sum_{k \\geq 16}\\frac{\\|B\\|^k}{k!} \\leq \\frac{\\|B\\|^{16}}{16!}\\sum_{j \\geq 0}\\|B\\|^j \\leq 2\\cdot\\frac{(1/2)^{16}}{16!}"}</M>,
          and since <M>{"\\|e^B\\| \\geq e^{-1/2}"}</M> this is negligible in relative terms too. The terms of the series all
          shrink, so there is no cancellation. Squaring is exact by the previous theorem; rounding errors in the squarings
          can grow, but for most matrices the method is backward stable in practice, and production versions (Higham&apos;s
          expm, used by SciPy) use Padé approximants with a carefully chosen degree and s. The code recovers the test
          matrix&apos;s exponential to four decimals, with rows (−0.7358, 0.5518) and (−1.4715, 1.1036).
        </p>
        <Code>{EXPM}</Code>
      </Proof>

      <Remark title="non-normal transients">
        <p>
          For A with rows (−1, m) and (0, −2), <M>{"e^{tA}"}</M> has off-diagonal entry <M>{"m(e^{-t} - e^{-2t})"}</M>, which
          peaks at m/4 when t = ln 2. With m = 50 the norm rises to 12.51 near t = 0.69 before decaying, although both
          eigenvalues are negative; at t = 10 it is down to 0.0023. Eigenvalues govern the long run, not the transient, when
          eigenvectors are far from orthogonal. Such exponentials appear throughout machine learning: state-space sequence
          models discretise x′ = Ax + Bu with <M>{"e^{\\Delta A}"}</M>, and the exponential of a skew-symmetric matrix
          parametrises orthogonal weight matrices.
        </p>
        <Code>{HUMP}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "det",
      rung: "check",
      prompt: <p>If tr A = 0.5, what is det(e^A) = e^(tr A)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.6487, tolerance: 0.0001 },
    },
    {
      key: "s",
      rung: "check",
      prompt: <p>With ‖A‖₁ = 100 and the rule ‖A‖/2ˢ ≤ 1/2, what is the smallest number of squarings s?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does summing the Taylor series of e^A directly fail for A = −30?</p>,
      answer: {
        kind: "choice",
        options: [
          "The terms grow to about 10¹² with alternating signs, so rounding errors far exceed the tiny answer",
          "The series does not converge for negative arguments",
          "Too few terms are summed for the series to converge",
          "Factorials overflow in double precision",
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

def taylor_exp(A, terms):
    E = T = np.eye(len(A))
    for k in range(1, terms):
        T = T @ A / k
        E = E + T
    return E

def expm_ss(A, terms=16):
    s = max(0, int(np.ceil(np.log2(np.linalg.norm(A, 1) / 0.5)))) if A.any() else 0
    E = taylor_exp(A / 2 ** s, terms)
    for _ in range(s):
        E = E @ E
    return E

def expm_eig(A):
    lam, V = np.linalg.eig(A)
    return ((V * np.exp(lam)) @ np.linalg.inv(V)).real

A = np.array([[-49.0, 24.0], [-64.0, 31.0]]); E = expm_ss(A)
print(np.round(E, 4) + 0.0)
print(np.abs(taylor_exp(A, 60) - E).max() > 1e-10, np.allclose(expm_eig(A), E), abs(taylor_exp(np.array([[-30.0]]), 150)[0, 0] / np.exp(-30) - 1) > 1)
J = np.array([[1.0, 1.0], [0.0, 1.0 + 1e-10]])
print(np.abs(expm_eig(J) - expm_ss(J)).max() > 1e-9, round(float(expm_ss(J)[0, 1] / np.e), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[-0.7358  0.5518]\n [-1.4715  1.1036]]\nTrue True True\nTrue 1.0",
          "[[-0.7358  0.5518]\n [-1.4715  1.1036]]\nFalse True True\nTrue 1.0",
          "[[-0.7358  0.5518]\n [-1.4715  1.1036]]\nTrue True True\nFalse 1.0",
          "[[ 0.7358 -0.5518]\n [ 1.4715 -1.1036]]\nTrue True True\nTrue 1.0",
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

def exp_upper2(a, b, m, t):
    c = m * t * np.exp(a * t) if a == b else m * (np.exp(a * t) - np.exp(b * t)) / (a - b)
    return np.array([[np.exp(a * t), c], [0.0, np.exp(b * t)]])

def hump(a, b, m, ts):
    norms = [np.linalg.norm(exp_upper2(a, b, m, t), 2) for t in ts]
    i = int(np.argmax(norms))
    return float(ts[i]), float(norms[i])

t, peak = hump(-1.0, -2.0, 50.0, np.linspace(0, 5, 5001))
print(round(t, 2), round(peak, 2), round(float(exp_upper2(-1.0, -2.0, 50.0, 10.0)[0, 1]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.69 12.51 0.0023", "0.0 1.0 0.0023", "0.69 50.0 0.0023", "5.0 12.51 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>taylor_exp(A, terms)</C>, the sum of the first terms terms of the series; <C>expm_ss(A, terms=16)</C>,
          scaling and squaring with the smallest s ≥ 0 such that ‖A‖₁/2ˢ ≤ 1/2; and <C>expm_eig(A)</C>, Ve^ΛV⁻¹ with the real
          part returned.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def taylor_exp(A, terms):
    return np.eye(len(A))

def expm_ss(A, terms=16):
    return np.eye(len(A))

def expm_eig(A):
    return np.eye(len(A))
`,
        solution: EXPM,
        tests: [
          { name: "basic", code: `assert np.allclose(expm_ss(np.array([[0.0, 1.0], [0.0, 0.0]])), [[1.0, 1.0], [0.0, 1.0]])
assert np.allclose(taylor_exp(np.array([[0.0, 1.0], [0.0, 0.0]]), 3), [[1.0, 1.0], [0.0, 1.0]])
th = 2.0; R = expm_ss(np.array([[0.0, -th], [th, 0.0]]))
assert np.allclose(R, [[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]], atol=1e-13)` },
          { name: "big", code: `D = np.diag([-20.0, 3.0]); assert np.allclose(expm_ss(D), np.diag(np.exp([-20.0, 3.0])), rtol=1e-12, atol=0)
S = np.array([[1.0, 2.0], [2.0, -1.0]]); assert np.allclose(expm_eig(S), expm_ss(S), rtol=1e-12)
assert np.allclose(expm_ss(np.zeros((3, 3))), np.eye(3))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>exp_upper2(a, b, m, t)</C>, the closed form of e^(tA) for A with rows (a, m) and (0, b), handling a = b,
          and <C>hump(a, b, m, ts)</C>, returning (t, ‖e^(tA)‖₂) at the grid point where the norm is largest.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def exp_upper2(a, b, m, t):
    return np.eye(2)

def hump(a, b, m, ts):
    return 0.0, 1.0
`,
        solution: HUMP,
        tests: [
          { name: "closed", code: `E = exp_upper2(-1.0, -3.0, 4.0, 0.7)
assert np.allclose(E, [[np.exp(-0.7), 2 * (np.exp(-0.7) - np.exp(-2.1))], [0.0, np.exp(-2.1)]])
assert np.allclose(exp_upper2(-1.0, -1.0, 2.0, 1.5), [[np.exp(-1.5), 3 * np.exp(-1.5)], [0.0, np.exp(-1.5)]])` },
          { name: "hump", code: `t, p = hump(-1.0, -2.0, 0.0, np.linspace(0, 3, 301))
assert t == 0.0 and abs(p - 1.0) < 1e-12
t, p = hump(-1.0, -2.0, 100.0, np.linspace(0, 3, 3001))
assert 0.6 < t < 0.8 and 25.0 < p < 25.5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let S be real skew-symmetric (Sᵀ = −S). Using that e^(A+B) = e^A e^B when AB = BA, prove that e^S is orthogonal.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows (e^S)ᵀ = e^(Sᵀ), for example by transposing the series term by term.",
          "Uses Sᵀ = −S to get (e^S)ᵀ = e^(−S).",
          "Notes S and −S commute, so (e^S)ᵀe^S = e^(−S)e^S = e^0 = I, hence e^S is orthogonal.",
        ],
      },
    },
    {
      key: "peak",
      rung: "stretch",
      prompt: <p>For A with rows (−1, 100) and (0, −2), what is the largest value over t ≥ 0 of the off-diagonal entry of e^(tA)?</p>,
      answer: { kind: "numeric", value: 25, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why summing the series or diagonalising can fail to compute e^A, how scaling and squaring avoids both problems, and why a matrix with negative eigenvalues can still make e^(tA) grow for a while.",

  glimpse: (
    <>
      <p>
        The exponential is one matrix function; square roots and inverse roots are others, and adaptive optimisers such as
        Shampoo need them for matrices with huge condition numbers. The next lesson computes them by Newton&apos;s method and
        shows how a naive version of that method blows up.
      </p>
    </>
  ),
};
