import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FrankWolfeViz } from "@/components/viz/FrankWolfeViz";
import type { LessonContent } from "@/lib/types";

const FW = `import numpy as np

def lmo_l1(g, tau):
    i = int(np.argmax(np.abs(g)))
    s = np.zeros_like(g)
    s[i] = -tau * np.sign(g[i])
    return s

def frank_wolfe(grad, lmo, x0, iters):
    x = np.array(x0, dtype=float)
    gaps = []
    for k in range(iters):
        g = grad(x)
        s = lmo(g)
        gaps.append(float(g @ (x - s)))
        x = x + 2 / (k + 2) * (s - x)
    return x, gaps`;

const LMO = `import numpy as np

def lmo_simplex(g):
    s = np.zeros_like(g)
    s[int(np.argmin(g))] = 1.0
    return s

def lmo_nuclear(G, tau):
    U, S, Vt = np.linalg.svd(G)
    return -tau * np.outer(U[:, 0], Vt[0])`;

export const lesson: LessonContent = {
  id: "m10.8.2",
  minutes: 45,
  links: {
    requires: ["m10.8.1", "m10.5.1"],
    revisits: ["m10.3.1"],
    foreshadows: ["m10.8.3"],
  },

  puzzle: (
    <>
      <p>
        Completing a matrix of film ratings under a bound on the nuclear norm needs, for projected gradient, a full singular
        value decomposition at every step: hopeless for a million-by-million matrix. Yet minimising a linear function over
        the same set needs only the top singular vector pair, which is cheap. Can an algorithm get by with linear
        minimisation alone, never projecting, and still converge?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At the current point, replace f by its linear approximation and minimise that over the feasible set. A linear
        function over a convex set is minimised at an extreme point, a vertex. Do not jump all the way there, since the
        linear model is only accurate nearby; move a fraction of the way. The new point is an average of feasible points,
        so it is feasible. And the amount by which the linear model promises to improve is itself an upper bound on how far
        from optimal you are.
      </p>
      <FrankWolfeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Frank-Wolfe (conditional gradient)">
        <p>For convex differentiable f and a compact convex set C, repeat</p>
        <MD>{"s_k = \\arg\\min_{s \\in C}\\nabla f(x_k)^\\top s, \\qquad x_{k+1} = x_k + \\gamma_k(s_k - x_k), \\quad \\gamma_k = \\frac{2}{k + 2}."}</MD>
        <p>
          The first step is a call to a linear minimisation oracle (LMO). The Frank-Wolfe gap is{" "}
          <M>{"g_k = \\nabla f(x_k)^\\top(x_k - s_k)"}</M>.
        </p>
      </Definition>

      <Theorem title="the gap bounds the error">
        <p>
          <M>{"f(x_k) - f^* \\leq g_k"}</M>, and <M>{"g_k = 0"}</M> exactly when <M>{"x_k"}</M> is optimal.
        </p>
      </Theorem>
      <Proof>
        <p>
          By convexity, <M>{"f^* \\geq f(x_k) + \\nabla f(x_k)^\\top(x^* - x_k) \\geq f(x_k) + \\min_{s \\in C}\\nabla f(x_k)^\\top(s - x_k) = f(x_k) - g_k"}</M>.
          The gap is 0 exactly when <M>{"\\nabla f(x_k)^\\top(s - x_k) \\geq 0"}</M> for all s ∈ C, the optimality condition of
          the previous lesson.
        </p>
        <Code>{FW}</Code>
      </Proof>

      <Theorem title="convergence">
        <p>
          If f is L-smooth on C and C has diameter D, then <M>{"f(x_k) - f^* \\leq 2LD^2/(k + 2)"}</M> for k ≥ 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"h_k = f(x_k) - f^*"}</M> and <M>{"C_f = LD^2"}</M>. The descent lemma with{" "}
          <M>{"x_{k+1} - x_k = \\gamma_k(s_k - x_k)"}</M> and the previous theorem give
        </p>
        <MD>{"h_{k+1} \\leq h_k - \\gamma_kg_k + \\frac{L}{2}\\gamma_k^2D^2 \\leq (1 - \\gamma_k)h_k + \\frac{\\gamma_k^2}{2}C_f."}</MD>
        <p>
          With <M>{"\\gamma_0 = 1"}</M>, <M>{"h_1 \\leq C_f/2 \\leq 2C_f/3"}</M>. If <M>{"h_k \\leq 2C_f/(k + 2)"}</M>, then{" "}
          <M>{"h_{k+1} \\leq \\frac{k}{k + 2}\\cdot\\frac{2C_f}{k + 2} + \\frac{2C_f}{(k + 2)^2} = \\frac{2C_f(k + 1)}{(k + 2)^2} \\leq \\frac{2C_f}{k + 3}"}</M>,{" "}
          because <M>{"(k + 1)(k + 3) \\leq (k + 2)^2"}</M>.
        </p>
      </Proof>

      <Remark title="cheap oracles and sparse iterates">
        <p>
          The LMO is often far cheaper than projection. Over the ℓ₁ ball of radius τ it returns{" "}
          <M>{"-\\tau\\,\\mathrm{sign}(g_i)e_i"}</M> for the largest <M>{"|g_i|"}</M>; over the simplex, the vertex with the
          smallest gradient entry; over the nuclear-norm ball, <M>{"-\\tau u_1v_1^\\top"}</M> from the top singular pair of the
          gradient matrix. Since <M>{"x_k"}</M> is a convex combination of at most k + 1 vertices, the iterates are sparse or
          low rank, which is often the point. The price is the 1/k rate, which is not improved by acceleration in general,
          and zigzagging when the solution lies on a face. In the code, minimising ½‖x − (0.9, 0.6)‖² over the unit ℓ₁ ball
          reaches the edge point (0.65, 0.35); the gap is 0.0869 after 10 steps and 0.0029 after 200.
        </p>
        <Code>{LMO}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bd",
      rung: "check",
      prompt: <p>With L = 1 and diameter D = 2, what is the Frank-Wolfe bound 2LD²/(k + 2) after k = 78 steps?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "lmo",
      rung: "check",
      prompt: <p>The gradient is (1, −4, 2) and C is the ℓ₁ ball of radius 3. The LMO returns a vertex s. What is its second coordinate?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: <p>Why is the Frank-Wolfe gap ∇f(x)ᵀ(x − s) an upper bound on f(x) − f*?</p>,
      answer: {
        kind: "choice",
        options: [
          "By convexity f* ≥ f(x) + ∇f(x)ᵀ(x* − x), and s minimises ∇f(x)ᵀs over C, which contains x*",
          "By the descent lemma applied with step γ = 1",
          "Because s is the projection of x − ∇f(x) onto C",
          "Because f is strongly convex on C",
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

def lmo_l1(g, tau):
    i = int(np.argmax(np.abs(g)))
    s = np.zeros_like(g)
    s[i] = -tau * np.sign(g[i])
    return s

def frank_wolfe(grad, lmo, x0, iters):
    x = np.array(x0, dtype=float)
    gaps = []
    for k in range(iters):
        g = grad(x)
        s = lmo(g)
        gaps.append(float(g @ (x - s)))
        x = x + 2 / (k + 2) * (s - x)
    return x, gaps

b = np.array([0.9, 0.6]); grad = lambda x: x - b
x, gaps = frank_wolfe(grad, lambda g: lmo_l1(g, 1.0), np.zeros(2), 200)
print(lmo_l1(np.array([0.5, -3.0, 2.0]), 2.0).tolist(), np.round(x, 2).tolist(), round(gaps[9], 4), round(gaps[199], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.0, 2.0, 0.0] [0.65, 0.35] 0.0869 0.0029", "[0.0, -2.0, 0.0] [0.65, 0.35] 0.0869 0.0029", "[0.0, 2.0, 0.0] [0.9, 0.6] 0.0869 0.0029", "[0.0, 2.0, 0.0] [0.65, 0.35] 0.0029 0.0869"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def lmo_simplex(g):
    s = np.zeros_like(g)
    s[int(np.argmin(g))] = 1.0
    return s

def lmo_nuclear(G, tau):
    U, S, Vt = np.linalg.svd(G)
    return -tau * np.outer(U[:, 0], Vt[0])

print(lmo_simplex(np.array([0.3, -0.2, 0.1])).tolist())
G = np.array([[3.0, 0.0], [0.0, 1.0]]); S = lmo_nuclear(G, 2.0)
print((np.round(S, 4) + 0.0).tolist(), round(float(np.sum(G * S)), 4), round(float(np.linalg.svd(S)[1].sum()), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.0, 1.0, 0.0]\n[[-2.0, 0.0], [0.0, 0.0]] -6.0 2.0", "[1.0, 0.0, 0.0]\n[[-2.0, 0.0], [0.0, 0.0]] -6.0 2.0", "[0.0, 1.0, 0.0]\n[[-2.0, 0.0], [0.0, -2.0]] -8.0 4.0", "[0.0, 1.0, 0.0]\n[[2.0, 0.0], [0.0, 0.0]] 6.0 2.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lmo_l1(g, tau)</C> and <C>frank_wolfe(grad, lmo, x0, iters)</C>, which uses γ_k = 2/(k + 2) for k = 0, 1,
          … and returns the final x and the list of gaps computed at each step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lmo_l1(g, tau):
    return np.zeros_like(g)

def frank_wolfe(grad, lmo, x0, iters):
    return np.array(x0, dtype=float), []
`,
        solution: FW,
        tests: [
          { name: "lmo", code: `assert np.allclose(lmo_l1(np.array([1.0, -4.0, 2.0]), 3.0), [0.0, 3.0, 0.0])
x, gaps = frank_wolfe(lambda x: x - 0.3, lambda g: np.where(g < 0, 1.0, 0.0), np.array([0.0]), 3)
assert np.allclose(x, [1 / 6]) and np.allclose(gaps, [0.3, 0.7, 1 / 90])` },
          { name: "rate", code: `rng = np.random.default_rng(7); b = rng.normal(size=6); f = lambda x: 0.5 * float((x - b) @ (x - b))
x, gaps = frank_wolfe(lambda x: x - b, lambda g: lmo_l1(g, 1.0), np.zeros(6), 300)
assert all(g >= -1e-12 for g in gaps) and np.abs(x).sum() <= 1 + 1e-12 and min(gaps) < 2 * 4 / 302` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lmo_simplex(g)</C>, the minimiser of gᵀs over the probability simplex, and <C>lmo_nuclear(G, tau)</C>, the
          minimiser of ⟨G, S⟩ over matrices with nuclear norm at most τ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lmo_simplex(g):
    return np.zeros_like(g)

def lmo_nuclear(G, tau):
    return np.zeros_like(G)
`,
        solution: LMO,
        tests: [
          { name: "simp", code: `s = lmo_simplex(np.array([0.3, -0.2, 0.1, -0.5]))
assert np.allclose(s, [0, 0, 0, 1])` },
          { name: "nuc", code: `rng = np.random.default_rng(8); G = rng.normal(size=(4, 3)); S = lmo_nuclear(G, 2.0)
sv = np.linalg.svd(G, compute_uv=False)
assert abs(np.sum(G * S) + 2.0 * sv[0]) < 1e-10 and abs(np.linalg.svd(S, compute_uv=False).sum() - 2.0) < 1e-10` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Given h_(k+1) ≤ (1 − γ_k)h_k + γ_k²C/2 for all k ≥ 0, with γ_k = 2/(k + 2) and h_k ≥ 0, prove that h_k ≤ 2C/(k + 2) for
          every k ≥ 1.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Handles the base case: γ₀ = 1 gives h₁ ≤ C/2 ≤ 2C/3.",
          "In the inductive step substitutes h_k ≤ 2C/(k + 2) and γ_k = 2/(k + 2) to get h_(k+1) ≤ 2C(k + 1)/(k + 2)².",
          "Uses (k + 1)(k + 3) ≤ (k + 2)² to conclude h_(k+1) ≤ 2C/(k + 3).",
        ],
      },
    },
    {
      key: "x3",
      rung: "stretch",
      prompt: <p>Frank-Wolfe on f(x) = ½(x − 0.3)² over C = [0, 1], from x₀ = 0, with γ_k = 2/(k + 2). What is x₃?</p>,
      answer: { kind: "numeric", value: 0.166667, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how Frank-Wolfe uses a linear minimisation instead of a projection, why its iterates stay feasible and sparse, why its gap certifies how far from optimal it is, and how the induction gives the 2LD²/(k + 2) rate.",

  glimpse: (
    <>
      <p>
        Projection and linear minimisation both need the whole constraint set to be simple. The final lesson splits a
        problem whose pieces are each simple, but whose combination is not, and coordinates them through dual variables:
        ADMM.
      </p>
    </>
  ),
};
