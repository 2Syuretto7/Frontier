import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HeavyBallViz } from "@/components/viz/HeavyBallViz";
import type { LessonContent } from "@/lib/types";

const HB = `import numpy as np

def heavy_ball(grad, x0, alpha, beta, iters):
    x = np.array(x0, dtype=float)
    prev = x.copy()
    path = [x.copy()]
    for _ in range(iters):
        x, prev = x - alpha * grad(x) + beta * (x - prev), x
        path.append(x.copy())
    return np.array(path)

def hb_params(mu, L):
    alpha = 4 / (np.sqrt(L) + np.sqrt(mu)) ** 2
    r = (np.sqrt(L / mu) - 1) / (np.sqrt(L / mu) + 1)
    return float(alpha), float(r ** 2)`;

const FAC = `import numpy as np

def hb_factor(lam, alpha, beta):
    T = np.array([[1 + beta - alpha * lam, -beta], [1.0, 0.0]])
    return float(np.max(np.abs(np.linalg.eigvals(T))))

def worst_factor(mu, L, alpha, beta, n=201):
    return max(hb_factor(l, alpha, beta) for l in np.linspace(mu, L, n))`;

export const lesson: LessonContent = {
  id: "m10.6.1",
  minutes: 45,
  links: {
    requires: ["m10.5.4"],
    revisits: ["m10.5.3"],
    foreshadows: ["m10.6.2"],
  },

  puzzle: (
    <>
      <p>
        A ball rolling down a long narrow valley does not stop and turn at every wall. It builds up speed along the valley
        floor, and its sideways sloshing partly cancels itself out. Gradient descent has no memory, so it cannot do this.
        Add one term that remembers the last step, and the cost on a valley with condition number 10,000 drops from tens
        of thousands of steps to a few hundred. How can one extra term buy a square root?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a narrow valley successive gradients point back and forth across it, while their small components along the
        floor all agree. Adding a fraction β of the previous step averages the recent gradients: the back-and-forth parts
        cancel and the consistent part accumulates. On a quadratic this turns each coordinate&apos;s one-step recurrence into
        a two-step one, whose roots can be complex, and then they all have the same size √β, however different the
        curvatures are.
      </p>
      <HeavyBallViz />
    </>
  ),

  theory: (
    <>
      <Definition title="heavy-ball method">
        <p>With step α &gt; 0 and momentum β ∈ [0, 1), Polyak&apos;s heavy-ball method is</p>
        <MD>{"x_{k+1} = x_k - \\alpha\\nabla f(x_k) + \\beta(x_k - x_{k-1}), \\qquad x_{-1} = x_0."}</MD>
        <p>
          Equivalently, with velocity <M>{"v_{k+1} = \\beta v_k + \\nabla f(x_k)"}</M> and{" "}
          <M>{"x_{k+1} = x_k - \\alpha v_{k+1}"}</M>: the step is α times an exponentially weighted sum of past gradients.
        </p>
      </Definition>

      <Theorem title="rate on a quadratic">
        <p>
          Let <M>{"f(x) = \\frac12 x^\\top Qx"}</M> with eigenvalues in [μ, L]. With{" "}
          <M>{"\\alpha = \\frac{4}{(\\sqrt L + \\sqrt\\mu)^2}"}</M> and{" "}
          <M>{"\\beta = \\left(\\frac{\\sqrt\\kappa - 1}{\\sqrt\\kappa + 1}\\right)^2"}</M>, the error contracts asymptotically
          by the factor
        </p>
        <MD>{"\\sqrt\\beta = \\frac{\\sqrt\\kappa - 1}{\\sqrt\\kappa + 1} \\approx 1 - \\frac{2}{\\sqrt\\kappa}\\quad\\text{per step,}"}</MD>
        <p>against <M>{"(\\kappa - 1)/(\\kappa + 1) \\approx 1 - 2/\\kappa"}</M> for gradient descent with its best step.</p>
      </Theorem>
      <Proof>
        <p>
          In an eigen-coordinate with eigenvalue λ, the iteration is{" "}
          <M>{"x_{k+1} = (1 + \\beta - \\alpha\\lambda)x_k - \\beta x_{k-1}"}</M>, a linear recurrence with characteristic
          polynomial <M>{"z^2 - (1 + \\beta - \\alpha\\lambda)z + \\beta"}</M>. Its roots are complex conjugates, or a repeated
          real root, exactly when <M>{"(1 + \\beta - \\alpha\\lambda)^2 \\leq 4\\beta"}</M>, that is,{" "}
          <M>{"(1 - \\sqrt\\beta)^2 \\leq \\alpha\\lambda \\leq (1 + \\sqrt\\beta)^2"}</M>. Then the product of the roots is β,
          so both have modulus √β. The chosen α and β make this interval exactly [αμ, αL]: dividing{" "}
          <M>{"\\alpha L = (1 + \\sqrt\\beta)^2"}</M> by <M>{"\\alpha\\mu = (1 - \\sqrt\\beta)^2"}</M> gives{" "}
          <M>{"\\sqrt\\kappa = (1 + \\sqrt\\beta)/(1 - \\sqrt\\beta)"}</M>, and adding their square roots gives{" "}
          <M>{"\\sqrt\\alpha(\\sqrt L + \\sqrt\\mu) = 2"}</M>. So every eigen-coordinate decays like{" "}
          <M>{"\\sqrt\\beta^{\\,k}"}</M>, up to a factor k at the two endpoints where the root repeats.
        </p>
        <Code>{HB}</Code>
      </Proof>

      <Remark title="the limits of the guarantee">
        <p>
          The √κ rate is proved here only for quadratics. For general smooth strongly convex functions, heavy ball with
          these parameters can fail to converge; a guarantee of the same order needs the small change made by
          Nesterov&apos;s method in the next lesson. Momentum is still the workhorse of deep learning, usually in the velocity
          form with β around 0.9: with a constant gradient the velocity tends to <M>{"g/(1 - \\beta)"}</M>, so the effective
          step is <M>{"\\alpha/(1 - \\beta)"}</M>. In the code, κ = 100 gives α ≈ 0.0331 and β ≈ 0.6694. After 100 steps
          heavy ball is at distance 3.5 × 10⁻⁷ from the minimum, gradient descent still at 0.19. The worst contraction
          factor over [1, 100] is 9/11 ≈ 0.8182 against 99/101 ≈ 0.9802, and an eigenvalue of 150, outside the assumed
          range, makes the factor 3.07: the method diverges if L is underestimated.
        </p>
        <Code>{FAC}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: <p>For κ = 100, what is the heavy-ball contraction factor per step with the optimal parameters?</p>,
      answer: { kind: "numeric", value: 0.818182, tolerance: 0.0001 },
    },
    {
      key: "beta",
      rung: "check",
      prompt: <p>What is the optimal heavy-ball momentum β for a quadratic with κ = 16?</p>,
      answer: { kind: "numeric", value: 0.36, tolerance: 0.0001 },
    },
    {
      key: "ratio",
      rung: "apply",
      prompt: <p>For κ = 10⁴ on a quadratic, roughly how do the steps per digit of accuracy compare between heavy ball and gradient descent, each with optimal parameters?</p>,
      answer: {
        kind: "choice",
        options: [
          "Heavy ball needs about 100 times fewer",
          "Heavy ball needs about 10⁴ times fewer",
          "Heavy ball needs about 2 times fewer",
          "They need about the same number",
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

def heavy_ball(grad, x0, alpha, beta, iters):
    x = np.array(x0, dtype=float)
    prev = x.copy()
    path = [x.copy()]
    for _ in range(iters):
        x, prev = x - alpha * grad(x) + beta * (x - prev), x
        path.append(x.copy())
    return np.array(path)

def hb_params(mu, L):
    alpha = 4 / (np.sqrt(L) + np.sqrt(mu)) ** 2
    r = (np.sqrt(L / mu) - 1) / (np.sqrt(L / mu) + 1)
    return float(alpha), float(r ** 2)

Q = np.diag([1.0, 100.0]); grad = lambda x: Q @ x
a, b = hb_params(1.0, 100.0)
print(round(a, 4), round(b, 4))
p = heavy_ball(grad, [1.0, 1.0], a, b, 100); q = heavy_ball(grad, [1.0, 1.0], 2 / 101, 0.0, 100)
print(f"{np.linalg.norm(p[-1]):.1e} {np.linalg.norm(q[-1]):.1e}")`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0331 0.6694\n3.5e-07 1.9e-01", "0.0331 0.8182\n3.5e-07 1.9e-01", "0.0198 0.6694\n3.5e-07 1.9e-01", "0.0331 0.6694\n1.9e-01 3.5e-07"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def hb_factor(lam, alpha, beta):
    T = np.array([[1 + beta - alpha * lam, -beta], [1.0, 0.0]])
    return float(np.max(np.abs(np.linalg.eigvals(T))))

def worst_factor(mu, L, alpha, beta, n=201):
    return max(hb_factor(l, alpha, beta) for l in np.linspace(mu, L, n))

a, b = 4 / 121, 81 / 121
print(round(worst_factor(1.0, 100.0, a, b), 4), round(worst_factor(1.0, 100.0, 2 / 101, 0.0), 4))
print(round(hb_factor(50.0, a, b), 4), round(hb_factor(150.0, a, b), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.8182 0.9802\n0.8182 3.0713", "0.6694 0.9802\n0.8182 3.0713", "0.8182 0.9802\n0.8182 0.8182", "0.8182 0.9608\n0.6694 3.0713"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>heavy_ball(grad, x0, alpha, beta, iters)</C>, returning the array of iterates with x₋₁ = x₀, and{" "}
          <C>hb_params(mu, L)</C>, the optimal (α, β) as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def heavy_ball(grad, x0, alpha, beta, iters):
    return np.array([x0], dtype=float)

def hb_params(mu, L):
    return 0.0, 0.0
`,
        solution: HB,
        tests: [
          { name: "params", code: `a, b = hb_params(1.0, 16.0)
assert abs(a - 0.16) < 1e-12 and abs(b - 0.36) < 1e-12` },
          { name: "path", code: `p = heavy_ball(lambda x: 2 * x, [1.0], 0.25, 0.5, 3)
assert p.shape == (4, 1) and np.allclose(p[:, 0], [1.0, 0.5, 0.0, -0.25])
Q = np.diag([1.0, 49.0]); a, b = hb_params(1.0, 49.0)
assert np.linalg.norm(heavy_ball(lambda x: Q @ x, [1.0, 1.0], a, b, 150)[-1]) < 1e-8` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hb_factor(lam, alpha, beta)</C>, the spectral radius of the 2 × 2 matrix of the heavy-ball recurrence for
          eigenvalue λ, and <C>worst_factor(mu, L, alpha, beta, n=201)</C>, its maximum over n evenly spaced λ in [μ, L].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hb_factor(lam, alpha, beta):
    return 1.0

def worst_factor(mu, L, alpha, beta, n=201):
    return 1.0
`,
        solution: FAC,
        tests: [
          { name: "gd", code: `assert abs(hb_factor(3.0, 0.1, 0.0) - 0.7) < 1e-12 and abs(worst_factor(1.0, 9.0, 0.2, 0.0) - 0.8) < 1e-12` },
          { name: "hb", code: `assert abs(hb_factor(4.0, 0.16, 0.36) - 0.6) < 1e-9 and abs(hb_factor(10.0, 0.25, 0.81) - 0.9) < 1e-9 and hb_factor(30.0, 0.16, 0.36) > 1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For the heavy-ball recurrence x_{"{k+1}"} = (1 + β − αλ)x_k − βx_{"{k−1}"} with 0 ≤ β &lt; 1, prove that if (1 − √β)² ≤
          αλ ≤ (1 + √β)², then both roots of the characteristic polynomial have modulus √β.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the characteristic polynomial z² − (1 + β − αλ)z + β and notes that the product of its roots is β.",
          "Shows the condition is equivalent to |1 + β − αλ| ≤ 2√β, so the discriminant is at most 0.",
          "Concludes the roots are complex conjugates (or a repeated real root), so each has modulus √(product) = √β.",
        ],
      },
    },
    {
      key: "eff",
      rung: "stretch",
      prompt: <p>In the velocity form with α = 0.01 and β = 0.9, the gradient is constantly 1. What does the displacement per step tend to?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the heavy-ball method adds to gradient descent, why it damps the zigzag in a narrow valley, how the characteristic roots of the two-step recurrence give the rate (√κ − 1)/(√κ + 1) on a quadratic, and why that guarantee does not carry over to all strongly convex functions.",

  glimpse: (
    <>
      <p>
        Nesterov found that evaluating the gradient at a look-ahead point, instead of the current one, gives an accelerated
        method with a proof for every smooth convex function, and that its rates cannot be beaten by any first-order method.
      </p>
    </>
  ),
};
