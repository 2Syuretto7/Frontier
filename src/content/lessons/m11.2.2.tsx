import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PivotBackwardViz } from "@/components/viz/PivotBackwardViz";
import type { LessonContent } from "@/lib/types";

const DOT = `import numpy as np

def dot32(x, y):
    s = np.float32(0.0)
    for a, b in zip(x.astype(np.float32), y.astype(np.float32)):
        s = np.float32(s + a * b)
    return float(s)

def dot_backward_error(x, y):
    p = x.astype(np.float32).astype(np.float64) * y.astype(np.float32).astype(np.float64)
    return abs(dot32(x, y) - float(p.sum())) / float(np.abs(p).sum())

def gamma(n, u=2.0 ** -24):
    return n * u / (1 - n * u)`;

const GE = `import numpy as np

def solve_nopivot(A, b):
    l = A[1, 0] / A[0, 0]
    u22 = A[1, 1] - l * A[0, 1]
    x2 = (b[1] - l * b[0]) / u22
    x1 = (b[0] - A[0, 1] * x2) / A[0, 0]
    return np.array([x1, x2])

def backward_error(A, b, x):
    r = b - A @ x
    return float(np.linalg.norm(r) / (np.linalg.norm(A, 2) * np.linalg.norm(x) + np.linalg.norm(b)))`;

export const lesson: LessonContent = {
  id: "m11.2.2",
  minutes: 50,
  links: {
    requires: ["m11.2.1"],
    revisits: ["m11.1.2", "m3.3.4"],
    foreshadows: ["m11.3.1"],
  },

  puzzle: (
    <>
      <p>
        In single precision, add 10⁸, then 1, then −10⁸. The true answer is 1; the computed answer is 0, a relative error
        of 100%. Yet numerical analysts call this summation algorithm stable. Meanwhile, solving a perfectly harmless 2 × 2
        system by textbook elimination can return x = (0, 1) when the answer is (1, 1). What exactly should we demand of an
        algorithm, if not a small error in its answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The forward error asks how far the computed answer is from the true one. The backward error asks a different
        question: for which nearby input is the computed answer exactly right? Summing 10⁸ + 1 − 10⁸ and getting 0 is the
        exact sum of 10⁸, 0 and −10⁸, a change of one part in 2 × 10⁸ to the data, smaller than the rounding error already
        in storing the data. An algorithm that always returns the exact answer to a problem that differs from yours by
        about a rounding error has done all anyone could ask; any remaining inaccuracy is the problem&apos;s ill
        conditioning, not the algorithm&apos;s fault.
      </p>
      <p>
        Elimination with a tiny pivot fails this test. Its answer is not exact for any nearby system: the error comes from
        the algorithm. Swapping rows fixes it.
      </p>
      <PivotBackwardViz />
    </>
  ),

  theory: (
    <>
      <Definition title="forward and backward error">
        <p>
          An algorithm computes <M>{"\\hat y"}</M> as an approximation to y = f(x). The forward error is{" "}
          <M>{"\\|\\hat y - y\\|/\\|y\\|"}</M>. The backward error is the smallest relative perturbation of the input that
          explains the output:
        </p>
        <MD>{"\\eta(\\hat y) = \\min\\left\\{\\frac{\\|\\delta x\\|}{\\|x\\|} : \\hat y = f(x + \\delta x)\\right\\}."}</MD>
        <p>
          The algorithm is backward stable if <M>{"\\eta(\\hat y) = O(u)"}</M> for every input, with u the unit roundoff and a
          constant that may grow modestly with the problem size.
        </p>
      </Definition>

      <Theorem title="forward error ≤ condition × backward error">
        <p>To first order in the backward error,</p>
        <MD>{"\\frac{\\|\\hat y - y\\|}{\\|y\\|} \\lesssim \\kappa_f(x)\\,\\eta(\\hat y)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Take δx attaining the backward error, so <M>{"\\hat y = f(x + \\delta x)"}</M> with{" "}
          <M>{"\\|\\delta x\\|/\\|x\\| = \\eta"}</M>. By the definition of the condition number,{" "}
          <M>{"\\|f(x + \\delta x) - f(x)\\|/\\|f(x)\\| \\leq \\kappa_f(x)\\,\\eta + o(\\eta)"}</M>. So a backward stable
          algorithm has forward error O(κu): it is as accurate as the conditioning allows.
        </p>
      </Proof>

      <Theorem title="products of rounding factors">
        <p>
          If <M>{"|\\delta_i| \\leq u"}</M> for i = 1, …, n and nu &lt; 1, then{" "}
          <M>{"\\prod_{i=1}^n (1 + \\delta_i) = 1 + \\theta_n"}</M> with{" "}
          <M>{"|\\theta_n| \\leq \\gamma_n = \\frac{nu}{1 - nu}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expanding the product, every term except 1 is a product of some of the <M>{"\\delta_i"}</M>, so{" "}
          <M>{"|\\theta_n| \\leq \\prod(1 + |\\delta_i|) - 1 \\leq (1 + u)^n - 1"}</M>. Since{" "}
          <M>{"1 + u \\leq e^u"}</M> and <M>{"e^{-t} \\geq 1 - t"}</M>, we get{" "}
          <M>{"(1 + u)^n \\leq e^{nu} \\leq 1/(1 - nu)"}</M>, and <M>{"1/(1 - nu) - 1 = nu/(1 - nu)"}</M>.
        </p>
      </Proof>

      <Theorem title="recursive dot product is backward stable">
        <p>
          Computing <M>{"s = \\sum_{i=1}^n x_i y_i"}</M> by accumulating left to right gives{" "}
          <M>{"\\hat s = \\sum_i x_i y_i (1 + \\theta^{(i)})"}</M> with every <M>{"|\\theta^{(i)}| \\leq \\gamma_n"}</M>, so{" "}
          <M>{"|\\hat s - s| \\leq \\gamma_n \\sum_i |x_i y_i|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each product is <M>{"x_i y_i(1 + \\epsilon_i)"}</M> and each addition multiplies the running sum by a factor{" "}
          <M>{"(1 + \\delta_k)"}</M>. The term <M>{"x_i y_i"}</M> picks up its own product factor and the addition factors of
          every later step, at most n factors in all, so the previous theorem applies. Each <M>{"\\theta^{(i)}"}</M> can be
          absorbed into <M>{"y_i"}</M>: the computed sum is the exact dot product of x with a vector within relative distance{" "}
          <M>{"\\gamma_n"}</M> of y, componentwise. The backward error is therefore at most{" "}
          <M>{"|\\hat s - s| / \\sum|x_i y_i|"}</M>, which is what the code measures. The forward relative error can still be
          huge when <M>{"\\sum|x_i y_i| \\gg |s|"}</M>: that ratio is the condition number of the sum.
        </p>
        <Code>{DOT}</Code>
      </Proof>

      <Remark title="the bound is pessimistic">
        <p>
          In the code, 10⁸ + 1 − 10⁸ in float32 gives 0 with a backward error of only 0.084u. For 1000 random terms the
          backward error is 0.25u, while the bound <M>{"\\gamma_{1000}"}</M> is about 1000u. Rounding errors rarely all push
          the same way, so in practice errors grow more like <M>{"\\sqrt n\\,u"}</M>; the worst-case bound is still what
          makes the guarantee unconditional.
        </p>
      </Remark>

      <Remark title="an unstable algorithm for a well-conditioned problem">
        <p>
          For a computed solution <M>{"\\hat x"}</M> of Ax = b, the normwise backward error, allowing perturbations of both A
          and b, has the closed form{" "}
          <M>{"\\eta = \\|b - A\\hat x\\| / (\\|A\\|\\,\\|\\hat x\\| + \\|b\\|)"}</M> (Rigal and Gaches). The system with rows
          (10⁻²⁰, 1) and (1, 1) has condition number 2.62, yet elimination with 10⁻²⁰ as pivot computes the multiplier 10²⁰,
          the 1 in the second row is lost in 1 − 10²⁰, and the answer (0, 1) has backward error 0.26: it solves no nearby
          system. With the rows swapped, the backward error is 0. Gaussian elimination with partial pivoting is the subject
          of the next chapter.
        </p>
        <Code>{GE}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gamma",
      rung: "check",
      prompt: <p>With u = 2⁻²⁴ and n = 1000, what is nu/(1 − nu)? Give the answer divided by 10⁻⁵, to three decimals.</p>,
      answer: { kind: "numeric", value: 5.961, tolerance: 0.002 },
    },
    {
      key: "fwd",
      rung: "check",
      prompt: (
        <p>
          A backward stable algorithm with backward error about 10⁻¹⁶ is applied to a problem with condition number 10⁶. About
          how large can the forward relative error be? Give log₁₀ of it.
        </p>
      ),
      answer: { kind: "numeric", value: -10, tolerance: 0.01 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>An algorithm gives a large forward error on some input. Which conclusion is justified?</p>,
      answer: {
        kind: "choice",
        options: [
          "Either the algorithm is unstable or the problem is ill conditioned at that input; the backward error tells which",
          "The algorithm is unstable",
          "The problem is ill conditioned",
          "The computer's floating-point arithmetic is faulty",
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

def dot32(x, y):
    s = np.float32(0.0)
    for a, b in zip(x.astype(np.float32), y.astype(np.float32)):
        s = np.float32(s + a * b)
    return float(s)

def dot_backward_error(x, y):
    p = x.astype(np.float32).astype(np.float64) * y.astype(np.float32).astype(np.float64)
    return abs(dot32(x, y) - float(p.sum())) / float(np.abs(p).sum())

def gamma(n, u=2.0 ** -24):
    return n * u / (1 - n * u)

x = np.array([1e8, 1.0, -1e8]); y = np.ones(3)
print(dot32(x, y), round(dot_backward_error(x, y) / 2.0 ** -24, 3))
x, y = np.random.default_rng(0).normal(size=(2, 1000))
print(round(dot_backward_error(x, y) / 2.0 ** -24, 2), round(gamma(1000) / 2.0 ** -24))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 0.084\n0.25 1000", "1.0 0.0\n0.25 1000", "0.0 1.0\n0.25 1000", "0.0 0.084\n1000.0 1000"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def solve_nopivot(A, b):
    l = A[1, 0] / A[0, 0]
    u22 = A[1, 1] - l * A[0, 1]
    x2 = (b[1] - l * b[0]) / u22
    x1 = (b[0] - A[0, 1] * x2) / A[0, 0]
    return np.array([x1, x2])

def backward_error(A, b, x):
    r = b - A @ x
    return float(np.linalg.norm(r) / (np.linalg.norm(A, 2) * np.linalg.norm(x) + np.linalg.norm(b)))

A = np.array([[1e-20, 1.0], [1.0, 1.0]]); b = np.array([1.0, 2.0])
xn, xp = solve_nopivot(A, b), np.linalg.solve(A, b)
print(xn + 0.0, xp + 0.0)
print(round(backward_error(A, b, xn), 2), backward_error(A, b, xp), round(np.linalg.cond(A), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0. 1.] [1. 1.]\n0.26 0.0 2.62", "[1. 1.] [1. 1.]\n0.0 0.0 2.62", "[0. 1.] [1. 1.]\n0.26 0.0 1e+20", "[1. 0.] [1. 1.]\n0.26 0.0 2.62"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dot32(x, y)</C>, which accumulates the products left to right entirely in float32 and returns a Python
          float; <C>dot_backward_error(x, y)</C>, which is |ŝ − s|/Σ|xᵢyᵢ| with s computed in float64 from the float32
          values; and <C>gamma(n, u=2.0 ** -24)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dot32(x, y):
    return 0.0

def dot_backward_error(x, y):
    return 0.0

def gamma(n, u=2.0 ** -24):
    return 0.0
`,
        solution: DOT,
        tests: [
          { name: "dot", code: `assert dot32(np.array([1e8, 1.0, -1e8]), np.ones(3)) == 0.0 and dot32(np.array([1.0, 2.0, 3.0]), np.array([4.0, 5.0, 6.0])) == 32.0
assert abs(gamma(10, 0.01) - 0.1 / 0.9) < 1e-15` },
          { name: "bwd", code: `x, y = np.random.default_rng(4).normal(size=(2, 500))
e = dot_backward_error(x, y)
assert 0 < e < gamma(500) and abs(dot_backward_error(np.array([1e8, 1.0, -1e8]), np.ones(3)) - 1 / (2e8 + 1)) < 1e-15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve_nopivot(A, b)</C>, which solves a 2 × 2 system by eliminating below A[0, 0] without swapping rows
          and then back-substituting, and <C>backward_error(A, b, x)</C>, the normwise backward error ‖b − Ax‖₂/(‖A‖₂‖x‖₂ +
          ‖b‖₂).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def solve_nopivot(A, b):
    return np.zeros(2)

def backward_error(A, b, x):
    return 0.0
`,
        solution: GE,
        tests: [
          { name: "solve", code: `A = np.array([[2.0, 1.0], [1.0, 3.0]]); b = np.array([3.0, 4.0])
assert np.allclose(solve_nopivot(A, b), [1.0, 1.0]) and backward_error(A, b, np.array([1.0, 1.0])) == 0.0` },
          { name: "tiny", code: `A = np.array([[1e-18, 1.0], [1.0, 1.0]]); b = np.array([1.0, 2.0])
assert backward_error(A, b, solve_nopivot(A, b)) > 0.1 and backward_error(A, b, np.linalg.solve(A, b)) < 1e-15
assert abs(backward_error(np.eye(2), np.array([3.0, 4.0]), np.array([0.0, 4.0])) - 3.0 / 9.0) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let |δᵢ| ≤ u for i = 1, …, n with nu &lt; 1. Prove that |∏(1 + δᵢ) − 1| ≤ nu/(1 − nu).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Bounds |∏(1 + δᵢ) − 1| by ∏(1 + |δᵢ|) − 1 ≤ (1 + u)ⁿ − 1, for example by expanding the product.",
          "Shows (1 + u)ⁿ ≤ 1/(1 − nu), for example via (1 + u)ⁿ ≤ e^(nu) and e^(−t) ≥ 1 − t, or by Bernoulli's inequality applied to (1 − u)ⁿ.",
          "Concludes with 1/(1 − nu) − 1 = nu/(1 − nu).",
        ],
      },
    },
    {
      key: "eta",
      rung: "stretch",
      prompt: (
        <p>
          With A the 2 × 2 identity, b = (3, 4) and computed x̂ = (3, 0), what is the normwise backward error ‖b − Ax̂‖₂/(‖A‖₂‖x̂‖₂ +
          ‖b‖₂)?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between forward and backward error, why a backward stable algorithm is as accurate as the problem's condition number allows, why summing 10⁸ + 1 − 10⁸ to 0 counts as stable, and why elimination with a tiny pivot does not.",

  glimpse: (
    <>
      <p>
        Two of the most common computations in machine learning, softmax and the log of a sum of exponentials, overflow or
        lose all accuracy when written the obvious way. The next lesson rewrites them, and the running variance, so that
        they are backward stable.
      </p>
    </>
  ),
};
