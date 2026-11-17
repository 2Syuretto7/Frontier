import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OdeSpiralViz } from "@/components/viz/OdeSpiralViz";
import type { LessonContent } from "@/lib/types";

const RK = `import numpy as np

def euler(f, x0, T, n):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        x = x + h * f(i * h, x)
    return x

def heun(f, x0, T, n):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        k1 = f(i * h, x); k2 = f(i * h + h, x + h * k1)
        x = x + 0.5 * h * (k1 + k2)
    return x

def rk4(f, x0, T, n):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        t = i * h
        k1 = f(t, x); k2 = f(t + h / 2, x + h / 2 * k1)
        k3 = f(t + h / 2, x + h / 2 * k2); k4 = f(t + h, x + h * k3)
        x = x + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    return x`;

const BT = `import numpy as np

def rk_step(f, t, x, h, A, b, c):
    k = []
    for i in range(len(b)):
        xi = x + h * sum(A[i][j] * k[j] for j in range(i))
        k.append(f(t + c[i] * h, xi))
    return x + h * sum(bi * ki for bi, ki in zip(b, k))

def rk_solve(f, x0, T, n, tab):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        x = rk_step(f, i * h, x, h, *tab)
    return x

def observed_order(f, x0, T, exact, n, tab):
    e = [np.linalg.norm(rk_solve(f, x0, T, m, tab) - exact) for m in (n, 2 * n)]
    return np.log2(e[0] / e[1])`;

export const lesson: LessonContent = {
  id: "m11.8.1",
  minutes: 50,
  links: {
    requires: ["m2.8.5", "m11.7.1"],
    revisits: ["m10.5.1"],
    foreshadows: ["m11.8.2", "m11.8.3"],
  },

  puzzle: (
    <>
      <p>
        A mass on a spring obeys x′ = y, y′ = −x, and its exact orbit is a circle. Step it with Euler&apos;s method, the
        obvious rule &quot;new state = old state + h × velocity&quot;, for one period with 2000 steps: it lands about 0.01 away
        from where it started. The classical Runge–Kutta method with only 20 steps, 80 evaluations of the right-hand side in
        all, lands 20 times closer. Both methods use the same information, the slope at a few points. Why is one so much
        better per evaluation, and how would you measure that?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Euler follows the tangent line for a whole step, so it makes an error of order h² per step and h overall. A
        Runge–Kutta method samples the slope at a few cleverly chosen points inside the step and averages them so that the
        result agrees with the Taylor series of the true solution to a higher order. RK4 agrees up to h⁴, so halving the
        step cuts the error sixteenfold instead of twofold. On the oscillator the difference is visible: each Euler step
        pushes the state outwards along the tangent, and the orbit spirals away.
      </p>
      <OdeSpiralViz />
    </>
  ),

  theory: (
    <>
      <Definition title="initial value problems and Euler's method">
        <p>
          Given <M>{"x' = f(t, x)"}</M>, <M>{"x(0) = x_0"}</M>, with f Lipschitz in x with constant L, choose a step h and set{" "}
          <M>{"t_n = nh"}</M>. Euler&apos;s method is
        </p>
        <MD>{"x_{n+1} = x_n + hf(t_n, x_n)."}</MD>
        <p>Gradient descent with step size h is exactly Euler&apos;s method on the gradient flow <M>{"x' = -\\nabla F(x)"}</M>.</p>
      </Definition>

      <Theorem title="Euler converges with order 1">
        <p>
          If <M>{"|x''(t)| \\le M"}</M> on [0, T], the errors <M>{"e_n = x(t_n) - x_n"}</M> satisfy{" "}
          <M>{"|e_n| \\le \\frac{hM}{2L}\\left(e^{Lt_n} - 1\\right)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Taylor&apos;s theorem <M>{"x(t_{n+1}) = x(t_n) + hf(t_n, x(t_n)) + \\tau_n"}</M> with{" "}
          <M>{"|\\tau_n| = |\\tfrac12 h^2x''(\\xi)| \\le \\tfrac12 h^2M"}</M>. Subtracting the method,{" "}
          <M>{"e_{n+1} = e_n + h\\left(f(t_n, x(t_n)) - f(t_n, x_n)\\right) + \\tau_n"}</M>, so{" "}
          <M>{"|e_{n+1}| \\le (1 + hL)|e_n| + \\tfrac12 h^2M"}</M>. With <M>{"e_0 = 0"}</M>, unrolling gives{" "}
          <M>{"|e_n| \\le \\tfrac12 h^2M\\sum_{j < n}(1 + hL)^j = \\tfrac12 h^2M\\frac{(1 + hL)^n - 1}{hL}"}</M>, and{" "}
          <M>{"(1 + hL)^n \\le e^{nhL}"}</M>. A local error of order h², accumulated over T/h steps, gives a global error of
          order h.
        </p>
      </Proof>

      <Definition title="explicit Runge–Kutta methods">
        <p>An s-stage method with coefficients <M>{"a_{ij}"}</M> (j &lt; i), <M>{"b_i"}</M>, <M>{"c_i"}</M> computes</p>
        <MD>{"k_i = f\\Big(t_n + c_ih,\; x_n + h\\sum_{j<i}a_{ij}k_j\\Big), \\qquad x_{n+1} = x_n + h\\sum_i b_ik_i."}</MD>
        <p>
          Euler is s = 1, b = (1). Heun&apos;s method has <M>{"k_2 = f(t_n + h, x_n + hk_1)"}</M> and b = (½, ½), the
          trapezoidal rule with a predicted endpoint. The classical RK4 has c = (0, ½, ½, 1), each stage feeding the next, and
          b = (1/6, 1/3, 1/3, 1/6), Simpson&apos;s weights. The coefficient table is called a Butcher tableau.
        </p>
        <Code>{RK}</Code>
      </Definition>

      <Theorem title="stability polynomials">
        <p>
          On the test equation <M>{"x' = \\lambda x"}</M> one step of an explicit RK method multiplies x by a polynomial{" "}
          <M>{"R(z)"}</M> in <M>{"z = h\\lambda"}</M>. Euler gives 1 + z, Heun{" "}
          <M>{"1 + z + \\tfrac{z^2}{2}"}</M>, and RK4 <M>{"1 + z + \\tfrac{z^2}{2} + \\tfrac{z^3}{6} + \\tfrac{z^4}{24}"}</M>: the
          Taylor polynomials of <M>{"e^z"}</M>, which is the exact one-step factor.
        </p>
      </Theorem>
      <Proof>
        <p>
          Heun: <M>{"k_1 = \\lambda x"}</M>, <M>{"k_2 = \\lambda(x + h\\lambda x) = \\lambda x(1 + z)"}</M>, so{" "}
          <M>{"x + \\tfrac h2(k_1 + k_2) = x(1 + z + \\tfrac{z^2}{2})"}</M>. RK4: <M>{"k_2 = \\lambda x(1 + \\tfrac z2)"}</M>,{" "}
          <M>{"k_3 = \\lambda x(1 + \\tfrac z2 + \\tfrac{z^2}{4})"}</M>,{" "}
          <M>{"k_4 = \\lambda x(1 + z + \\tfrac{z^2}{2} + \\tfrac{z^3}{4})"}</M>, so{" "}
          <M>{"k_1 + 2k_2 + 2k_3 + k_4 = \\lambda x(6 + 3z + z^2 + \\tfrac{z^3}{4})"}</M> and{" "}
          <M>{"x + \\tfrac h6(\\cdots) = x(1 + z + \\tfrac{z^2}{2} + \\tfrac{z^3}{6} + \\tfrac{z^4}{24})"}</M>.
        </p>
      </Proof>

      <Remark title="order and how to measure it">
        <p>
          A method has order p if its local error is <M>{"O(h^{p+1})"}</M>; the argument for Euler then gives a global error{" "}
          <M>{"O(h^p)"}</M>. Agreeing with <M>{"e^z"}</M> on the test equation is necessary but not sufficient for nonlinear
          f: order 4 needs eight algebraic conditions on the tableau, which RK4 satisfies. In practice, measure the order by
          halving h: if the error is <M>{"Ch^p"}</M> then <M>{"\\log_2(e(h)/e(h/2)) \\approx p"}</M>. In the code this gives
          1.0, 2.0 and 4.0. On the oscillator, z = ih and <M>{"|1 + ih| = \\sqrt{1 + h^2} > 1"}</M>, which is the outward
          spiral. Production solvers such as Dormand–Prince (scipy&apos;s RK45) use an embedded pair, two methods of orders 5
          and 4 sharing their stages, whose difference estimates the local error and sets the next step size.
        </p>
        <Code>{BT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "euler2",
      rung: "check",
      prompt: <p>Apply Euler&apos;s method to x′ = x, x(0) = 1, with h = 0.5 for two steps. What is x₂?</p>,
      answer: { kind: "numeric", value: 2.25, tolerance: 0.0001 },
    },
    {
      key: "heun1",
      rung: "check",
      prompt: <p>Apply one step of Heun&apos;s method to x′ = x, x(0) = 1, with h = 1. What is x₁?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
    {
      key: "spiral",
      rung: "apply",
      prompt: <p>Why does Euler&apos;s method on x′ = y, y′ = −x spiral outwards for every step size h &gt; 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each step multiplies the complex number x + iy by 1 − ih, whose modulus √(1 + h²) exceeds 1",
          "Rounding errors accumulate and always increase the radius",
          "Euler's method has order 2 on linear problems",
          "The exact solution also spirals outwards, and Euler copies it",
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

def euler(f, x0, T, n):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        x = x + h * f(i * h, x)
    return x

def heun(f, x0, T, n):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        k1 = f(i * h, x); k2 = f(i * h + h, x + h * k1)
        x = x + 0.5 * h * (k1 + k2)
    return x

def rk4(f, x0, T, n):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        t = i * h
        k1 = f(t, x); k2 = f(t + h / 2, x + h / 2 * k1)
        k3 = f(t + h / 2, x + h / 2 * k2); k4 = f(t + h, x + h * k3)
        x = x + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    return x

f = lambda t, x: np.array([x[1], -x[0]])
x0 = np.array([1.0, 0.0]); T = 2 * np.pi
for n in [100, 200]:
    print(n, [float(np.round(np.linalg.norm(s(f, x0, T, n)), 4)) for s in (euler, heun, rk4)])
print(bool(np.linalg.norm(rk4(f, x0, T, 20) - x0) < np.linalg.norm(euler(f, x0, T, 2000) - x0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "100 [1.2177, 1.0002, 1.0]\n200 [1.1037, 1.0, 1.0]\nTrue",
          "100 [1.2177, 1.0002, 1.0]\n200 [1.1037, 1.0, 1.0]\nFalse",
          "100 [0.8212, 0.9998, 1.0]\n200 [0.9061, 1.0, 1.0]\nTrue",
          "100 [1.0, 1.0, 1.0]\n200 [1.0, 1.0, 1.0]\nTrue",
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

def rk_step(f, t, x, h, A, b, c):
    k = []
    for i in range(len(b)):
        xi = x + h * sum(A[i][j] * k[j] for j in range(i))
        k.append(f(t + c[i] * h, xi))
    return x + h * sum(bi * ki for bi, ki in zip(b, k))

def rk_solve(f, x0, T, n, tab):
    h, x = T / n, np.array(x0, dtype=float)
    for i in range(n):
        x = rk_step(f, i * h, x, h, *tab)
    return x

def observed_order(f, x0, T, exact, n, tab):
    e = [np.linalg.norm(rk_solve(f, x0, T, m, tab) - exact) for m in (n, 2 * n)]
    return np.log2(e[0] / e[1])

EULER = ([[0.0]], [1.0], [0.0])
HEUN = ([[0, 0], [1, 0]], [0.5, 0.5], [0, 1])
RK4 = ([[0, 0, 0, 0], [0.5, 0, 0, 0], [0, 0.5, 0, 0], [0, 0, 1, 0]], [1 / 6, 1 / 3, 1 / 3, 1 / 6], [0, 0.5, 0.5, 1])
g = lambda t, x: np.cos(t) * x
ex = np.exp(np.sin(3.0))
print([float(np.round(observed_order(g, [1.0], 3.0, ex, 160, tab), 1)) for tab in (EULER, HEUN, RK4)])
print(np.round(rk_step(lambda t, x: x, 0.0, np.array([1.0]), 1.0, *RK4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1.0, 2.0, 4.0]\n[2.7083]", "[1.0, 2.0, 4.0]\n[2.7183]", "[2.0, 4.0, 16.0]\n[2.7083]", "[1.0, 2.0, 3.0]\n[2.6667]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>euler(f, x0, T, n)</C>, <C>heun(f, x0, T, n)</C> and <C>rk4(f, x0, T, n)</C>, each taking n equal steps of
          size T/n for x′ = f(t, x) from t = 0 and returning the final state.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def euler(f, x0, T, n):
    return np.array(x0, dtype=float)

def heun(f, x0, T, n):
    return np.array(x0, dtype=float)

def rk4(f, x0, T, n):
    return np.array(x0, dtype=float)
`,
        solution: RK,
        tests: [
          { name: "linear", code: `g = lambda t, x: x
assert np.allclose(euler(g, [1.0], 1.0, 2), [2.25]) and np.allclose(heun(g, [1.0], 1.0, 2), [1.625 ** 2])
assert np.allclose(rk4(g, [1.0], 1.0, 1), [1 + 1 + 1 / 2 + 1 / 6 + 1 / 24])` },
          { name: "time", code: `assert np.allclose(rk4(lambda t, x: 4 * t ** 3, [0.0], 2.0, 1), [16.0])
assert np.allclose(heun(lambda t, x: 2 * t, [0.0], 3.0, 1), [9.0]) and np.allclose(euler(lambda t, x: 2 * t, [0.0], 3.0, 3), [6.0])
f = lambda t, x: np.array([x[1], -x[0]])
assert np.linalg.norm(rk4(f, [1.0, 0.0], 2 * np.pi, 50) - np.array([1.0, 0.0])) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rk_step(f, t, x, h, A, b, c)</C> for a general explicit Butcher tableau, <C>rk_solve(f, x0, T, n, tab)</C>{" "}
          taking n steps with <C>tab = (A, b, c)</C>, and <C>observed_order(f, x0, T, exact, n, tab)</C>, returning
          log₂ of the ratio of the errors with n and 2n steps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rk_step(f, t, x, h, A, b, c):
    return x

def rk_solve(f, x0, T, n, tab):
    return np.array(x0, dtype=float)

def observed_order(f, x0, T, exact, n, tab):
    return 0.0
`,
        solution: BT,
        tests: [
          { name: "step", code: `HEUN = ([[0, 0], [1, 0]], [0.5, 0.5], [0, 1])
RK4 = ([[0, 0, 0, 0], [0.5, 0, 0, 0], [0, 0.5, 0, 0], [0, 0, 1, 0]], [1 / 6, 1 / 3, 1 / 3, 1 / 6], [0, 0.5, 0.5, 1])
assert np.allclose(rk_step(lambda t, x: x, 0.0, np.array([1.0]), 1.0, *HEUN), [2.5])
assert np.allclose(rk_solve(lambda t, x: 4 * t ** 3, [0.0], 2.0, 1, RK4), [16.0])` },
          { name: "order", code: `HEUN = ([[0, 0], [1, 0]], [0.5, 0.5], [0, 1]); EULER = ([[0.0]], [1.0], [0.0])
g = lambda t, x: -x + np.sin(t); ex = 0.5 * (np.sin(2.0) - np.cos(2.0)) + 1.5 * np.exp(-2.0)
assert abs(observed_order(g, [1.0], 2.0, ex, 200, HEUN) - 2) < 0.1 and abs(observed_order(g, [1.0], 2.0, ex, 200, EULER) - 1) < 0.1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For x′ = λx, show that one step of Heun&apos;s method multiplies x by R(z) = 1 + z + z²/2 with z = hλ, and deduce that
          its local error |e^z − R(z)|·|x| is O(h³), while Euler&apos;s is O(h²).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes k₁ = λx and k₂ = λ(x + hλx), giving x + (h/2)(k₁ + k₂) = x(1 + z + z²/2).",
          "Compares with the exact factor e^z = 1 + z + z²/2 + z³/6 + … to get e^z − R(z) = z³/6 + O(z⁴), which is O(h³).",
          "For Euler, R(z) = 1 + z, so e^z − R(z) = z²/2 + O(z³), which is O(h²).",
        ],
      },
    },
    {
      key: "rad",
      rung: "stretch",
      prompt: (
        <p>
          Euler&apos;s method on x′ = y, y′ = −x from (1, 0) with h = 0.1: what is the distance from the origin after 10 steps?
          Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.051, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why Euler's method has error proportional to the step size, how Runge–Kutta methods sample the slope inside a step to match more terms of the Taylor series, how to measure a method's order by halving the step, and why Euler spirals outwards on a spring.",

  glimpse: (
    <>
      <p>
        Accuracy is not the only constraint on h. For x′ = −1000x the solution decays smoothly, yet Euler with h = 0.01
        explodes, because |1 + z| &gt; 1 when z = −10. The next lesson is about such stiff problems, where stability rather
        than accuracy forces the step size, and about implicit methods that escape the restriction.
      </p>
    </>
  ),
};
