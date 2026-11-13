import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StabRegionViz } from "@/components/viz/StabRegionViz";
import type { LessonContent } from "@/lib/types";

const LI = `import numpy as np

def euler_linear(A, x0, h, n):
    x = np.array(x0, dtype=float)
    for _ in range(n):
        x = x + h * (A @ x)
    return x

def backward_euler_linear(A, x0, h, n):
    x = np.array(x0, dtype=float); M = np.eye(len(A)) - h * A
    for _ in range(n):
        x = np.linalg.solve(M, x)
    return x

def trapezoid_linear(A, x0, h, n):
    x = np.array(x0, dtype=float); I = np.eye(len(A))
    for _ in range(n):
        x = np.linalg.solve(I - h / 2 * A, x + h / 2 * (A @ x))
    return x`;

const ST = `import numpy as np

def amplification(z, method):
    if method == "euler":
        return abs(1 + z)
    if method == "backward":
        return abs(1 / (1 - z))
    return abs((1 + z / 2) / (1 - z / 2))

def max_stable_step(eigs):
    lam = np.asarray(eigs, dtype=complex)
    return float(np.min(-2 * lam.real / np.abs(lam) ** 2))

def backward_euler_scalar(f, df, x0, h, n, newton=8):
    x = float(x0)
    for _ in range(n):
        y = x
        for _ in range(newton):
            y -= (y - x - h * f(y)) / (1 - h * df(y))
        x = y
    return x`;

export const lesson: LessonContent = {
  id: "m11.8.2",
  minutes: 50,
  links: {
    requires: ["m11.8.1", "m11.3.1"],
    revisits: ["m10.5.1", "m11.7.1"],
    foreshadows: ["m11.8.3"],
  },

  puzzle: (
    <>
      <p>
        The system x′ = Ax with eigenvalues −1 and −1000 has a solution made of two decaying exponentials. After t = 0.01
        the fast one is below e⁻¹⁰ and the solution is, for all practical purposes, just a smooth e⁻ᵗ curve. Yet
        Euler&apos;s method with h = 0.0025, a step that would resolve e⁻ᵗ beautifully, produces numbers above 10¹⁰ by t = 1,
        and with h = 0.001 it is fine. Halve the accuracy requirement and nothing changes: the step is pinned by a
        component that is no longer there. What pins it, and how do implicit methods take steps of 0.1 instead?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each step of an explicit method multiplies every eigencomponent by R(hλ). If |R(hλ)| &gt; 1 for some λ, that
        component grows geometrically, however small it is, and rounding errors keep it from being exactly zero. For
        explicit methods R is a polynomial, which must blow up for large |z|, so h has to shrink like 1/|λ_max|. An implicit
        method solves an equation at each step, and its R is a rational function that can stay below 1 on the whole left
        half-plane. A problem is stiff when stability, not accuracy, would dictate the step of an explicit method.
      </p>
      <StabRegionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="absolute stability">
        <p>
          A one-step method applied to <M>{"x' = \\lambda x"}</M> gives <M>{"x_{n+1} = R(h\\lambda)x_n"}</M>. Its region of
          absolute stability is <M>{"\\{z \\in \\mathbb{C} : |R(z)| \\le 1\\}"}</M>. For <M>{"x' = Ax"}</M> with A
          diagonalisable the method is stable for step h exactly when <M>{"h\\lambda"}</M> lies in the region for every
          eigenvalue λ of A.
        </p>
      </Definition>

      <Theorem title="explicit methods have bounded regions">
        <p>
          For Euler the region is the disk <M>{"|1 + z| \\le 1"}</M>, so for real λ &lt; 0 stability needs{" "}
          <M>{"h \\le 2/|\\lambda|"}</M>, and in general <M>{"h \\le -2\\,\\mathrm{Re}\\,\\lambda/|\\lambda|^2"}</M>. Every explicit
          Runge–Kutta method has a polynomial R, so its region is bounded.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"|1 + h\\lambda|^2 = 1 + 2h\\,\\mathrm{Re}\\,\\lambda + h^2|\\lambda|^2"}</M>, which is at most 1 exactly when{" "}
          <M>{"h|\\lambda|^2 \\le -2\\,\\mathrm{Re}\\,\\lambda"}</M>. For explicit RK, each stage is x times a polynomial in z, as
          in the previous lesson, so R is a polynomial; a nonconstant polynomial tends to ∞ in modulus as |z| → ∞, so{" "}
          <M>{"|R(z)| \\le 1"}</M> only on a bounded set.
        </p>
      </Proof>

      <Definition title="implicit methods">
        <p>Backward Euler and the trapezoidal rule (Crank–Nicolson) are</p>
        <MD>{"x_{n+1} = x_n + hf(t_{n+1}, x_{n+1}), \\qquad x_{n+1} = x_n + \\tfrac h2\\left(f(t_n, x_n) + f(t_{n+1}, x_{n+1})\\right)."}</MD>
        <p>
          For linear f = Ax each step solves a linear system, such as <M>{"(I - hA)x_{n+1} = x_n"}</M>; the matrix is fixed,
          so one LU factorisation serves every step. For nonlinear f each step needs Newton&apos;s method on{" "}
          <M>{"y - x_n - hf(y) = 0"}</M>, whose Jacobian is <M>{"I - hf'(y)"}</M>.
        </p>
        <Code>{LI}</Code>
      </Definition>

      <Theorem title="A-stability">
        <p>
          Backward Euler has <M>{"R(z) = 1/(1 - z)"}</M> and the trapezoidal rule{" "}
          <M>{"R(z) = (1 + z/2)/(1 - z/2)"}</M>. Both satisfy <M>{"|R(z)| \\le 1"}</M> whenever{" "}
          <M>{"\\mathrm{Re}\\,z \\le 0"}</M> (A-stability), so any step size is stable for a problem whose eigenvalues all have
          negative real part.
        </p>
      </Theorem>
      <Proof>
        <p>
          Backward Euler on <M>{"x' = \\lambda x"}</M>: <M>{"x_{n+1} = x_n + zx_{n+1}"}</M>, so{" "}
          <M>{"x_{n+1} = x_n/(1 - z)"}</M>. If Re z ≤ 0 then <M>{"|1 - z| \\ge \\mathrm{Re}(1 - z) \\ge 1"}</M>. Trapezoid:{" "}
          <M>{"(1 - z/2)x_{n+1} = (1 + z/2)x_n"}</M>, and with z = a + ib, a ≤ 0,{" "}
          <M>{"|1 + z/2|^2 - |1 - z/2|^2 = 2a \\le 0"}</M>.
        </p>
      </Proof>

      <Remark title="damping the stiff part">
        <p>
          A-stability is not the whole story. As z → −∞, backward Euler&apos;s R tends to 0 (L-stability) and wipes out
          stiff components in one step, while the trapezoid&apos;s tends to −1, so the fast component survives as a slowly
          decaying oscillation. In the code, with h = 0.1 the backward Euler answer is (0.3855, 0.3855), close to the true
          (0.3679, 0.3679), while the trapezoid&apos;s is (1.0379, −0.3027): its slow part is more accurate, but the fast part
          is multiplied by −49/51 per step and is still 0.67 after ten steps.
        </p>
      </Remark>

      <Remark title="stiffness in optimisation">
        <p>
          Gradient descent on <M>{"F(x) = \\tfrac12 x^\\top Hx"}</M> is Euler on <M>{"x' = -Hx"}</M>. The stability condition{" "}
          <M>{"h \\le 2/\\lambda_{\\max}(H)"}</M> is exactly the step size bound from the descent lemma, and the slow
          direction then needs about <M>{"\\lambda_{\\max}/\\lambda_{\\min} = \\kappa"}</M> steps: ill-conditioning is
          stiffness. Backward Euler on the gradient flow is the proximal point method,{" "}
          <M>{"x_{n+1} = \\arg\\min_y F(y) + \\|y - x_n\\|^2/(2h)"}</M>, which is stable for every h but needs a solve per step.
          The code finds the stability limit for a set of eigenvalues and runs backward Euler with Newton on the stiff
          nonlinear x′ = −100x³, where explicit Euler with h = 0.1 jumps from 1 to −9.
        </p>
        <Code>{ST}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hmax",
      rung: "check",
      prompt: <p>What is the largest stable Euler step for x′ = −250x?</p>,
      answer: { kind: "numeric", value: 0.008, tolerance: 0.00001 },
    },
    {
      key: "beamp",
      rung: "check",
      prompt: <p>What is backward Euler&apos;s amplification factor |R(z)| at z = −9?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "def",
      rung: "apply",
      prompt: <p>Which description best captures a stiff problem?</p>,
      answer: {
        kind: "choice",
        options: [
          "Explicit methods need far smaller steps for stability than the smooth solution needs for accuracy, because of rapidly decaying components",
          "The solution changes rapidly everywhere, so every method needs small steps",
          "The right-hand side is not Lipschitz, so no method converges",
          "The problem has eigenvalues with positive real part, so the solution grows",
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

def euler_linear(A, x0, h, n):
    x = np.array(x0, dtype=float)
    for _ in range(n):
        x = x + h * (A @ x)
    return x

def backward_euler_linear(A, x0, h, n):
    x = np.array(x0, dtype=float); M = np.eye(len(A)) - h * A
    for _ in range(n):
        x = np.linalg.solve(M, x)
    return x

def trapezoid_linear(A, x0, h, n):
    x = np.array(x0, dtype=float); I = np.eye(len(A))
    for _ in range(n):
        x = np.linalg.solve(I - h / 2 * A, x + h / 2 * (A @ x))
    return x

A = np.array([[-500.5, 499.5], [499.5, -500.5]]); x0 = [2.0, 0.0]
print(np.round(euler_linear(A, x0, 0.001, 1000), 4), bool(np.abs(euler_linear(A, x0, 0.0025, 400)).max() > 1e10))
print(np.round(backward_euler_linear(A, x0, 0.1, 10), 4), np.round(trapezoid_linear(A, x0, 0.1, 10), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.3677 0.3677] True\n[0.3855 0.3855] [ 1.0379 -0.3027]",
          "[0.3677 0.3677] False\n[0.3855 0.3855] [ 1.0379 -0.3027]",
          "[0.3677 0.3677] True\n[0.3855 0.3855] [0.3675 0.3675]",
          "[0.3677 0.3677] True\n[ 1.0379 -0.3027] [0.3855 0.3855]",
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

def amplification(z, method):
    if method == "euler":
        return abs(1 + z)
    if method == "backward":
        return abs(1 / (1 - z))
    return abs((1 + z / 2) / (1 - z / 2))

def max_stable_step(eigs):
    lam = np.asarray(eigs, dtype=complex)
    return float(np.min(-2 * lam.real / np.abs(lam) ** 2))

def backward_euler_scalar(f, df, x0, h, n, newton=8):
    x = float(x0)
    for _ in range(n):
        y = x
        for _ in range(newton):
            y -= (y - x - h * f(y)) / (1 - h * df(y))
        x = y
    return x

print(max_stable_step([-1.0, -1000.0]), round(max_stable_step([-1 + 10j]), 4))
print([round(amplification(-100.0, m), 4) for m in ("euler", "backward", "trap")])
y = backward_euler_scalar(lambda u: -100 * u ** 3, lambda u: -300 * u ** 2, 1.0, 0.1, 1)
print(round(y, 4), bool(abs(y + 10 * y ** 3 - 1) < 1e-12))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.002 0.0198\n[99.0, 0.0099, 0.9608]\n0.393 True",
          "0.002 0.2\n[99.0, 0.0099, 0.9608]\n0.393 True",
          "2.0 0.0198\n[99.0, 0.0099, 0.9608]\n0.393 True",
          "0.002 0.0198\n[101.0, 0.0099, 1.0]\n-9.0 False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For x′ = Ax write <C>euler_linear(A, x0, h, n)</C>, <C>backward_euler_linear(A, x0, h, n)</C> and{" "}
          <C>trapezoid_linear(A, x0, h, n)</C>, each taking n steps of size h and returning the final state.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def euler_linear(A, x0, h, n):
    return np.array(x0, dtype=float)

def backward_euler_linear(A, x0, h, n):
    return np.array(x0, dtype=float)

def trapezoid_linear(A, x0, h, n):
    return np.array(x0, dtype=float)
`,
        solution: LI,
        tests: [
          { name: "scalar", code: `A = np.array([[-1.0]])
assert np.allclose(euler_linear(A, [1.0], 0.5, 2), [0.25]) and np.allclose(backward_euler_linear(A, [1.0], 0.5, 2), [4 / 9])
assert np.allclose(trapezoid_linear(A, [1.0], 0.5, 2), [0.36])` },
          { name: "stiff", code: `A = np.array([[-2.0, 1.0], [0.0, -500.0]]); x = backward_euler_linear(A, [1.0, 1.0], 0.5, 4)
assert np.allclose(x, np.linalg.matrix_power(np.linalg.inv(np.eye(2) - 0.5 * A), 4) @ np.array([1.0, 1.0]))
assert np.abs(euler_linear(A, [1.0, 1.0], 0.5, 4)).max() > 1e8 and np.abs(x).max() < 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>amplification(z, method)</C> returning |R(z)| for &quot;euler&quot;, &quot;backward&quot; and otherwise the
          trapezoid; <C>max_stable_step(eigs)</C>, the largest stable Euler step for eigenvalues with negative real parts; and{" "}
          <C>backward_euler_scalar(f, df, x0, h, n, newton=8)</C>, solving each step with that many Newton iterations
          started from the previous value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def amplification(z, method):
    return 1.0

def max_stable_step(eigs):
    return 0.0

def backward_euler_scalar(f, df, x0, h, n, newton=8):
    return x0
`,
        solution: ST,
        tests: [
          { name: "amp", code: `assert np.isclose(amplification(-3.0, "euler"), 2.0) and np.isclose(amplification(-3.0, "backward"), 0.25)
assert np.isclose(amplification(-6.0, "trap"), 0.5) and np.isclose(amplification(2j, "trap"), 1.0)
assert np.isclose(max_stable_step([-4.0, -2.0 + 2.0j]), 0.5)` },
          { name: "newton", code: `y = backward_euler_scalar(lambda u: -u, lambda u: -1.0, 1.0, 0.5, 3)
assert np.isclose(y, (1 / 1.5) ** 3)
z = backward_euler_scalar(lambda u: -100 * u ** 3, lambda u: -300 * u ** 2, 2.0, 0.05, 1)
assert np.isclose(z + 5 * z ** 3, 2.0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Show that backward Euler applied to x′ = λx gives x_(n+1) = x_n/(1 − z) with z = hλ, and prove that |1/(1 − z)| ≤ 1
          whenever Re z ≤ 0. Contrast this with Euler, for which |1 + z| ≤ 1 forces h ≤ 2/|λ| when λ is real and negative.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Solves x_(n+1) = x_n + hλx_(n+1) to get x_(n+1) = x_n/(1 − z).",
          "Shows |1 − z| ≥ Re(1 − z) = 1 − Re z ≥ 1 when Re z ≤ 0, hence |R(z)| ≤ 1.",
          "For Euler with real λ < 0, |1 + hλ| ≤ 1 means −2 ≤ hλ ≤ 0, i.e. h ≤ 2/|λ|.",
        ],
      },
    },
    {
      key: "trapinf",
      rung: "stretch",
      prompt: <p>What is the trapezoid rule&apos;s |R(z)| at z = −1000? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.996, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a differential equation stiff, why every explicit Runge–Kutta method needs steps of order 1/|λ_max| on such a problem, how backward Euler and the trapezoid rule escape by solving an equation each step, why the trapezoid rule still lets stiff components ring, and how this connects to ill-conditioning in gradient descent.",

  glimpse: (
    <>
      <p>
        Diffusion models generate an image by integrating a differential equation from noise to data, and every
        evaluation of its right-hand side is a pass through a large network. The last lesson of the course looks at sampling
        as ODE solving, where the number of function evaluations is the cost and higher-order methods are the remedy.
      </p>
    </>
  ),
};
