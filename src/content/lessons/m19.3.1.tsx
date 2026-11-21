import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PicardViz } from "@/components/viz/PicardViz";
import type { LessonContent } from "@/lib/types";

const PICARD = `import numpy as np

def picard_step(X, b, s, x0, dB, dt):
    inc = b(X[:-1]) * dt + s(X[:-1]) * dB              # drift and noise evaluated along the previous iterate
    return np.concatenate([[x0], x0 + np.cumsum(inc)])

def picard(b, s, x0, dB, dt, iters):
    X, gaps = np.full(len(dB) + 1, float(x0)), []
    for _ in range(iters):
        Y = picard_step(X, b, s, x0, dB, dt)
        gaps.append(float(np.max(np.abs(Y - X))))      # sup distance between successive iterates
        X = Y
    return gaps

def gronwall_bound(c, L, t):
    return c * np.exp(L * t)                           # u <= c + L * integral of u implies u <= c e^(L t)`;

const FAIL = `import numpy as np

def explosion_time(x0):
    return 1 / x0                                      # dx/dt = x^2 gives x = x0 / (1 - x0 t)

def two_solutions(t, t0):
    return 0.0, float(max(t - t0, 0) ** 3)             # both solve dx/dt = 3 x^(2/3) from x(0) = 0

def lipschitz_const(f, xs):
    y = f(xs)
    return float(np.max(np.abs(np.diff(y)) / np.diff(xs)))   # largest slope between neighbouring grid points`;

export const lesson: LessonContent = {
  id: "m19.3.1",
  minutes: 55,
  links: {
    requires: ["m19.2.3", "m19.2.2"],
    revisits: ["m18.3.4", "m18.2.2"],
    foreshadows: ["m19.3.2"],
  },

  puzzle: (
    <>
      <p>
        Diffusion models write the generative process as an SDE <M>{"dX = b(X, t)\\, dt + \\sigma(t)\\, dB"}</M> with b a neural
        network, and then simulate it. But not every equation of this form has a solution, and some have more than one: the ordinary
        equation <M>{"dx = x^2 dt"}</M> blows up in finite time, and <M>{"dx = 3x^{2/3} dt"}</M> started at 0 has infinitely many
        solutions. What property of b and σ rules these out, and why does it hold for the networks used in practice?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two things can go wrong. If the drift grows faster than linearly, the solution can run off to infinity in finite time. If the
        drift is not Lipschitz, two solutions can start together and split, because nothing forces them to stay close. When b and σ
        are Lipschitz, the difference between two candidate solutions can grow at most exponentially, and since it starts at zero it
        stays zero. The same estimate makes Picard iteration, which repeatedly integrates the coefficients along the previous guess,
        converge, which builds the solution.
      </p>
      <PicardViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Grönwall's inequality">
        <p>
          If u is non-negative and bounded on [0, T] and <M>{"u(t) \\le c + L\\int_0^t u(s)\\, ds"}</M> for all t, with{" "}
          <M>{"c, L \\ge 0"}</M>, then <M>{"u(t) \\le c\\, e^{Lt}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Iterate the inequality n times: substituting it into its own integral gives{" "}
          <M>{"u(t) \\le c\\sum_{k<n} \\frac{(Lt)^k}{k!} + L^n \\int_{0 \\le s_n \\le \\dots \\le s_1 \\le t} u(s_n)\\, ds"}</M>. The last term
          is at most <M>{"\\sup u \\cdot (Lt)^n/n!"}</M>, which tends to zero, and the sum tends to <M>{"c\\, e^{Lt}"}</M>.
        </p>
      </Proof>

      <Theorem title="existence and uniqueness">
        <p>
          Suppose there is a constant K with <M>{"|b(x) - b(y)| + |\\sigma(x) - \\sigma(y)| \\le K|x - y|"}</M> and{" "}
          <M>{"|b(x)| + |\\sigma(x)| \\le K(1 + |x|)"}</M>. Then for every <M>{"x_0"}</M> the SDE{" "}
          <M>{"dX = b(X)\\, dt + \\sigma(X)\\, dB"}</M>, <M>{"X_0 = x_0"}</M>, has a continuous adapted solution with{" "}
          <M>{"\\sup_{t \\le T}\\mathbb{E}X_t^2 < \\infty"}</M>, and any two such solutions agree for all t almost surely.
        </p>
      </Theorem>
      <Proof>
        <p>
          Uniqueness. For solutions X and Y, <M>{"X_t - Y_t = \\int_0^t (b(X) - b(Y))\\, ds + \\int_0^t (\\sigma(X) - \\sigma(Y))\\, dB"}</M>
          . Using <M>{"(p + q)^2 \\le 2p^2 + 2q^2"}</M>, Cauchy–Schwarz on the first integral and the Itô isometry (m19.2.2) on the
          second, <M>{"u(t) = \\mathbb{E}|X_t - Y_t|^2"}</M> satisfies <M>{"u(t) \\le 2K^2(T + 1)\\int_0^t u(s)\\, ds"}</M>. Grönwall with c
          = 0 gives u = 0, so <M>{"X_t = Y_t"}</M> almost surely for each t, and by continuity for all t at once.
        </p>
        <p>
          Existence. Define <M>{"X^{(0)} = x_0"}</M> and{" "}
          <M>{"X^{(n+1)}_t = x_0 + \\int_0^t b(X^{(n)})\\, ds + \\int_0^t \\sigma(X^{(n)})\\, dB"}</M>. The same estimate gives{" "}
          <M>{"d_{n+1}(t) \\le C\\int_0^t d_n(s)\\, ds"}</M> for <M>{"d_n(t) = \\mathbb{E}|X^{(n+1)}_t - X^{(n)}_t|^2"}</M>, with{" "}
          <M>{"C = 2K^2(T+1)"}</M>, and the linear growth condition bounds <M>{"d_0"}</M> by a constant M. By induction{" "}
          <M>{"d_n(t) \\le M (Ct)^n/n!"}</M>, and <M>{"\\sum_n \\sqrt{M(CT)^n/n!} < \\infty"}</M>, so <M>{"X^{(n)}_t"}</M> is Cauchy in{" "}
          <M>{"L^2"}</M> uniformly in <M>{"t \\le T"}</M> and converges to some <M>{"X_t"}</M> (m18.3.4). Passing to the limit in the
          recursion, using the Lipschitz bound and the isometry, shows X solves the equation; Doob&apos;s maximal inequality upgrades the
          convergence to uniform convergence of paths along a subsequence, so a continuous version exists.
        </p>
      </Proof>

      <Definition title="Picard iteration on a path">
        <p>
          On a grid, <C>picard_step</C> integrates the drift <C>b</C> and diffusion <C>s</C> along the previous iterate with fixed
          Brownian increments, and <C>picard</C> records the largest gap between successive iterates. <C>gronwall_bound</C> is the
          bound of Grönwall&apos;s inequality.
        </p>
        <Code>{PICARD}</Code>
      </Definition>

      <Definition title="what goes wrong without the conditions">
        <p>
          <C>explosion_time</C> is when the solution of <M>{"dx = x^2 dt"}</M> from <M>{"x_0 > 0"}</M> reaches infinity: the drift grows
          faster than linearly. <C>two_solutions</C> gives two of the solutions of <M>{"dx = 3x^{2/3} dt"}</M>, <M>{"x(0) = 0"}</M>: the
          zero solution and one that leaves 0 at time <M>{"t_0"}</M>; the drift is continuous but not Lipschitz at 0.{" "}
          <C>lipschitz_const</C> estimates a Lipschitz constant from slopes between neighbouring grid points.
        </p>
        <Code>{FAIL}</Code>
      </Definition>

      <Example title="checking the conditions">
        <p>
          The Ornstein–Uhlenbeck equation <M>{"dX = -\\theta X\\, dt + \\sigma\\, dB"}</M> has K = max(θ, σ) and satisfies both
          conditions. Geometric Brownian motion has <M>{"b = \\mu x"}</M> and <M>{"\\sigma(x) = \\sigma x"}</M>, Lipschitz with linear
          growth. A neural network with Lipschitz activations, such as ReLU or SiLU, and bounded weights is Lipschitz, with constant at
          most the product of the layers&apos; operator norms; it grows at most linearly. So the reverse-time SDE of a diffusion model
          with a learned score has a unique solution on any interval that avoids the singular endpoint.
        </p>
      </Example>

      <Remark title="weaker conditions">
        <p>
          Lipschitz bounds on bounded sets suffice for uniqueness up to a possible explosion time, and a Lyapunov function, such as{" "}
          <M>{"x^2"}</M> with a drift pointing inward, rules out explosion. In one dimension, Yamada and Watanabe showed that a diffusion
          coefficient that is only Hölder continuous of order 1/2 still gives uniqueness, which covers the square-root processes used
          in finance. Near t = 0, the score of a diffusion model can blow up, and samplers stop just short of it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "explode",
      rung: "check",
      prompt: (
        <p>
          The ordinary equation <M>{"dx = 2x^3\\, dt"}</M> starts at <M>{"x_0 = 0.5"}</M>. At what time does the solution blow up?
        </p>
      ),
      answer: { kind: "numeric", value: 1, tolerance: 0.0005 },
    },
    {
      key: "picard",
      rung: "check",
      prompt: (
        <p>
          In the existence proof, with M = 1, C = 2 and t = 1, what bound does <M>{"M(Ct)^n/n!"}</M> give on{" "}
          <M>{"d_5(t)"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.267, tolerance: 0.0006 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these SDEs is not covered by the existence and uniqueness theorem as stated?</p>,
      answer: {
        kind: "choice",
        options: [
          "dX = −X³ dt + dB, since the drift is not globally Lipschitz and grows faster than linearly",
          "dX = −2X dt + 0.5 dB",
          "dX = sin(X) dt + dB",
          "dX = 0.1X dt + 0.3X dB",
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

def picard_step(X, b, s, x0, dB, dt):
    inc = b(X[:-1]) * dt + s(X[:-1]) * dB              # drift and noise evaluated along the previous iterate
    return np.concatenate([[x0], x0 + np.cumsum(inc)])

def picard(b, s, x0, dB, dt, iters):
    X, gaps = np.full(len(dB) + 1, float(x0)), []
    for _ in range(iters):
        Y = picard_step(X, b, s, x0, dB, dt)
        gaps.append(float(np.max(np.abs(Y - X))))      # sup distance between successive iterates
        X = Y
    return gaps

def gronwall_bound(c, L, t):
    return c * np.exp(L * t)                           # u <= c + L * integral of u implies u <= c e^(L t)

dB = np.array([0.5, -0.5, 1.0]); X = picard_step(np.ones(4), lambda x: -x, lambda x: 1.0 + 0 * x, 1.0, dB, 0.1)
print(np.round(X, 4).tolist(), [round(d, 4) for d in picard(lambda x: -x, lambda x: 1.0 + 0 * x, 1.0, dB, 0.1, 3)], round(gronwall_bound(2.0, 0.5, 2.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.4, 0.8, 1.7] [0.7, 0.04, 0.004] 5.4366",
          "[1.0, 1.5, 1.0, 2.0] [0.7, 0.04, 0.004] 5.4366",
          "[1.0, 1.4, 0.8, 1.7] [0.7, 0.07, 0.007] 5.4366",
          "[1.0, 1.4, 0.8, 1.7] [0.7, 0.04, 0.004] 2.7183",
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

def explosion_time(x0):
    return 1 / x0                                      # dx/dt = x^2 gives x = x0 / (1 - x0 t)

def two_solutions(t, t0):
    return 0.0, float(max(t - t0, 0) ** 3)             # both solve dx/dt = 3 x^(2/3) from x(0) = 0

def lipschitz_const(f, xs):
    y = f(xs)
    return float(np.max(np.abs(np.diff(y)) / np.diff(xs)))   # largest slope between neighbouring grid points

xs = np.linspace(0, 1, 101)
print(explosion_time(0.5), two_solutions(3.0, 1.0), round(lipschitz_const(np.sqrt, xs), 3), round(lipschitz_const(np.square, xs), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.0 (0.0, 8.0) 10.0 1.99", "2.0 (0.0, 27.0) 10.0 1.99", "0.5 (0.0, 8.0) 10.0 1.99", "2.0 (0.0, 8.0) 0.5 2.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>picard_step(X, b, s, x0, dB, dt)</C>, <C>picard(b, s, x0, dB, dt, iters)</C>, returning the list of sup gaps, and{" "}
          <C>gronwall_bound(c, L, t)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def picard_step(X, b, s, x0, dB, dt):
    return X

def picard(b, s, x0, dB, dt, iters):
    return [0.0] * iters

def gronwall_bound(c, L, t):
    return c * (1 + L * t)
`,
        solution: PICARD,
        tests: [
          { name: "step", code: `Y = picard_step(np.array([2.0, 2.0, 2.0]), lambda x: x, lambda x: 0 * x, 1.0, np.array([0.3, 0.3]), 0.5)\nassert np.allclose(Y, [1.0, 2.0, 3.0]) and abs(gronwall_bound(3.0, 1.0, 2.0) - 3 * np.exp(2)) < 1e-12` },
          { name: "iterate", code: `g = picard(lambda x: 0 * x, lambda x: 1.0 + 0 * x, 0.0, np.array([1.0, -3.0]), 0.1, 3)\nassert np.allclose(g, [2.0, 0.0, 0.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>explosion_time(x0)</C>, <C>two_solutions(t, t0)</C>, returning a pair of floats, and{" "}
          <C>lipschitz_const(f, xs)</C>, returning a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def explosion_time(x0):
    return float("inf")

def two_solutions(t, t0):
    return 0.0, 0.0

def lipschitz_const(f, xs):
    return float(np.max(np.abs(f(xs))))
`,
        solution: FAIL,
        tests: [
          { name: "blowup", code: `assert explosion_time(4.0) == 0.25 and two_solutions(0.5, 1.0) == (0.0, 0.0) and two_solutions(3.0, 0.0) == (0.0, 27.0)` },
          { name: "lip", code: `assert abs(lipschitz_const(lambda x: 3 * x + 1, np.linspace(0, 2, 11)) - 3.0) < 1e-9 and abs(lipschitz_const(np.abs, np.array([-1.0, 0.0, 2.0])) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "late",
      rung: "stretch",
      prompt: (
        <p>
          The solution of <M>{"dx = 3x^{2/3} dt"}</M>, <M>{"x(0) = 0"}</M>, that stays at 0 until time 0.5 and then leaves, follows{" "}
          <M>{"(t - t_0)^3"}</M>. What is its value at t = 2? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.375, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The simplest SDE beyond Brownian motion pulls the state back towards zero while noise pushes it around. The next lesson solves
        the Ornstein–Uhlenbeck equation exactly, finds its stationary law, and shows why it is the forward process of diffusion
        models.
      </p>
    </>
  ),
};
