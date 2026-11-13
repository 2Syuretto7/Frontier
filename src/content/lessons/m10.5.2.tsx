import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SandwichViz } from "@/components/viz/SandwichViz";
import type { LessonContent } from "@/lib/types";

const SW = `import numpy as np

def mu_L(Q):
    w = np.linalg.eigvalsh(Q)
    return float(w[0]), float(w[-1])

def sandwich_ok(f, grad, mu, L, pts):
    for x in pts:
        for y in pts:
            lin = f(x) + grad(x) @ (y - x)
            gap = float((y - x) @ (y - x))
            if f(y) < lin + mu / 2 * gap - 1e-12:
                return False
            if f(y) > lin + L / 2 * gap + 1e-12:
                return False
    return True`;

const PL = `import numpy as np

def pl_ratio(f, grad, fstar, pts):
    vals = []
    for x in pts:
        if f(x) > fstar:
            g = grad(x)
            vals.append(float(g @ g) / (2 * (f(x) - fstar)))
    return min(vals)

def gap_bounds(g_norm, mu, L):
    return g_norm ** 2 / (2 * L), g_norm ** 2 / (2 * mu)`;

export const lesson: LessonContent = {
  id: "m10.5.2",
  minutes: 45,
  links: {
    requires: ["m10.5.1", "m10.2.2"],
    revisits: ["m10.2.1"],
    foreshadows: ["m10.5.3", "m10.5.4"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent stops when the gradient is small. But a small gradient alone does not mean you are near the
        minimum: the function eˣ has tiny gradients far to the left, and its infimum is never reached. What extra property
        turns &quot;the gradient is small&quot; into &quot;the value is nearly optimal and the point is nearly the
        minimiser&quot;?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Smoothness caps how sharply a function can curve upward; strong convexity demands that it curve upward at least a
        little, everywhere. Together they trap the function, at every point, between two parabolas with curvatures μ and L.
        The lower parabola is what forbids long flat stretches: if the function must keep bending upward, a small slope can
        only happen close to the bottom.
      </p>
      <SandwichViz />
    </>
  ),

  theory: (
    <>
      <Definition title="strong convexity and condition number">
        <p>A differentiable f is μ-strongly convex, for some μ &gt; 0, if for all x and y</p>
        <MD>{"f(y) \\geq f(x) + \\nabla f(x)^\\top(y - x) + \\frac{\\mu}{2}\\|y - x\\|^2."}</MD>
        <p>
          Equivalently, <M>{"f - \\frac{\\mu}{2}\\|x\\|^2"}</M> is convex; for twice differentiable f, the Hessian satisfies{" "}
          <M>{"\\nabla^2 f(x) \\succeq \\mu I"}</M>. If f is also L-smooth, then{" "}
          <M>{"\\mu I \\preceq \\nabla^2 f(x) \\preceq LI"}</M>, and <M>{"\\kappa = L/\\mu \\geq 1"}</M> is the condition number.
          For <M>{"f(x) = \\frac12 x^\\top Qx"}</M> with Q positive definite, μ and L are the smallest and largest
          eigenvalues of Q.
        </p>
      </Definition>

      <Theorem title="what a small gradient means">
        <p>Let f be μ-strongly convex with minimiser x*. Then for every x,</p>
        <MD>{"f(x) - f^* \\leq \\frac{\\|\\nabla f(x)\\|^2}{2\\mu}, \\qquad \\|x - x^*\\| \\leq \\frac{\\|\\nabla f(x)\\|}{\\mu}."}</MD>
        <p>The first is the Polyak–Łojasiewicz (PL) inequality. The minimiser exists and is unique.</p>
      </Theorem>
      <Proof>
        <p>
          The right side of the defining inequality is a convex quadratic in y, minimised at{" "}
          <M>{"y = x - \\nabla f(x)/\\mu"}</M> with value <M>{"f(x) - \\|\\nabla f(x)\\|^2/(2\\mu)"}</M>. Since f(y) is at
          least that for every y, so is f*, which is the first claim. For the second, write the inequality twice, at (x, x*)
          and at (x*, x), and add: <M>{"(\\nabla f(x) - \\nabla f(x^*))^\\top(x - x^*) \\geq \\mu\\|x - x^*\\|^2"}</M>. With{" "}
          <M>{"\\nabla f(x^*) = 0"}</M> and Cauchy–Schwarz, <M>{"\\|\\nabla f(x)\\|\\,\\|x - x^*\\| \\geq \\mu\\|x - x^*\\|^2"}</M>.
          Existence holds because the lower parabola grows without bound, so sublevel sets are bounded; uniqueness because
          two minimisers x*, y* would give <M>{"0 \\geq \\mu\\|x^* - y^*\\|^2"}</M>.
        </p>
        <Code>{SW}</Code>
      </Proof>

      <Theorem title="the matching bound from smoothness">
        <p>
          If f is convex and L-smooth with minimum value f*, then{" "}
          <M>{"f(x) - f^* \\geq \\|\\nabla f(x)\\|^2/(2L)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the guaranteed decrease from the descent lemma,{" "}
          <M>{"f^* \\leq f(x - \\nabla f(x)/L) \\leq f(x) - \\|\\nabla f(x)\\|^2/(2L)"}</M>.
        </p>
      </Proof>

      <Remark title="the gap is pinned between two multiples of the squared gradient">
        <p>
          Together, <M>{"\\|\\nabla f\\|^2/(2L) \\leq f - f^* \\leq \\|\\nabla f\\|^2/(2\\mu)"}</M>, so the squared gradient
          norm is a reliable stopping signal, accurate up to the factor κ. In the code, Q with rows (3, 1) and (1, 3) has
          eigenvalues 2 and 4, so the pair (μ, L) = (2, 4) passes the sandwich test on sample points while (2.5, 4) and
          (2, 3.5) fail. For Q = diag(2, 4) the PL ratio ‖∇f‖²/(2(f − f*)) is never below μ = 2 and equals it along the
          first axis; at (1, 1) the gap 3 lies between 2.5 and 5.
        </p>
        <Code>{PL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kappa",
      rung: "check",
      prompt: <p>f(x) = ½xᵀQx with Q having rows (5, 2) and (2, 2). What is the condition number κ = L/μ?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "check",
      prompt: <p>f is 2-strongly convex and ‖∇f(x)‖ = 4. What is the PL upper bound on f(x) − f*?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these functions on ℝ is strongly convex?</p>,
      answer: {
        kind: "choice",
        options: ["log(1 + eˣ) + 0.1x²", "log(1 + eˣ)", "x⁴", "eˣ"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mu_L(Q):
    w = np.linalg.eigvalsh(Q)
    return float(w[0]), float(w[-1])

def sandwich_ok(f, grad, mu, L, pts):
    for x in pts:
        for y in pts:
            lin = f(x) + grad(x) @ (y - x)
            gap = float((y - x) @ (y - x))
            if f(y) < lin + mu / 2 * gap - 1e-12:
                return False
            if f(y) > lin + L / 2 * gap + 1e-12:
                return False
    return True

Q = np.array([[3.0, 1.0], [1.0, 3.0]]); f = lambda x: 0.5 * x @ Q @ x; grad = lambda x: Q @ x
print(mu_L(Q))
pts = [np.array(p) for p in [(1.0, 0.0), (0.0, 1.0), (2.0, 1.0), (-1.0, -1.0)]]
print(sandwich_ok(f, grad, 2.0, 4.0, pts), sandwich_ok(f, grad, 2.5, 4.0, pts), sandwich_ok(f, grad, 2.0, 3.5, pts))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(2.0, 4.0)\nTrue False False", "(2.0, 4.0)\nTrue True False", "(3.0, 3.0)\nTrue False False", "(2.0, 4.0)\nTrue False True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def pl_ratio(f, grad, fstar, pts):
    vals = []
    for x in pts:
        if f(x) > fstar:
            g = grad(x)
            vals.append(float(g @ g) / (2 * (f(x) - fstar)))
    return min(vals)

def gap_bounds(g_norm, mu, L):
    return g_norm ** 2 / (2 * L), g_norm ** 2 / (2 * mu)

Q = np.diag([2.0, 4.0]); f = lambda x: 0.5 * x @ Q @ x; grad = lambda x: Q @ x
pts = [np.array([np.cos(a), np.sin(a)]) for a in np.linspace(0, np.pi / 2, 4)]
print(round(pl_ratio(f, grad, 0.0, pts), 4), round(pl_ratio(f, grad, 0.0, pts[1:3]), 4))
x = np.array([1.0, 1.0]); g = float(np.linalg.norm(grad(x)))
lo, hi = gap_bounds(g, 2.0, 4.0)
print(round(lo, 4), f(x), round(hi, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.0 2.8\n2.5 3.0 5.0", "2.0 2.0\n2.5 3.0 5.0", "4.0 2.8\n2.5 3.0 5.0", "2.0 2.8\n5.0 3.0 2.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mu_L(Q)</C>, returning the strong convexity and smoothness constants of ½xᵀQx as floats, and{" "}
          <C>sandwich_ok(f, grad, mu, L, pts)</C>, which checks both parabola bounds for every ordered pair of points
          (with tolerance 1e-12).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mu_L(Q):
    return 0.0, 0.0

def sandwich_ok(f, grad, mu, L, pts):
    return True
`,
        solution: SW,
        tests: [
          { name: "eig", code: `m, L = mu_L(np.array([[5.0, 2.0], [2.0, 2.0]]))
assert abs(m - 1.0) < 1e-12 and abs(L - 6.0) < 1e-12 and isinstance(m, float)` },
          { name: "sand", code: `f = lambda x: float(np.log(np.cosh(x[0])) + 0.25 * x[0] ** 2); g = lambda x: np.array([np.tanh(x[0]) + 0.5 * x[0]])
pts = [np.array([v]) for v in np.linspace(-3, 3, 13)]
assert sandwich_ok(f, g, 0.5, 1.5, pts) and not sandwich_ok(f, g, 0.5, 1.0, pts) and not sandwich_ok(f, g, 1.2, 1.5, pts)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pl_ratio(f, grad, fstar, pts)</C>, the smallest value of ‖∇f(x)‖²/(2(f(x) − f*)) over points with f(x)
          &gt; f*, and <C>gap_bounds(g_norm, mu, L)</C>, the pair (lower, upper) of bounds on f(x) − f* from a gradient norm.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pl_ratio(f, grad, fstar, pts):
    return 0.0

def gap_bounds(g_norm, mu, L):
    return 0.0, 0.0
`,
        solution: PL,
        tests: [
          { name: "ratio", code: `Q = np.diag([0.5, 3.0]); f = lambda x: 0.5 * float(x @ Q @ x); g = lambda x: Q @ x
pts = [np.zeros(2)] + [np.array([np.cos(a), np.sin(a)]) for a in np.linspace(0, 2 * np.pi, 50)]
r = pl_ratio(f, g, 0.0, pts)
assert 0.5 - 1e-9 <= r < 0.51` },
          { name: "gap", code: `lo, hi = gap_bounds(3.0, 0.5, 2.0)
assert abs(lo - 2.25) < 1e-12 and abs(hi - 9.0) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let f be μ-strongly convex and differentiable, with minimum value f*. Prove the PL inequality f(x) − f* ≤
          ‖∇f(x)‖²/(2μ).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses the strong convexity lower bound f(y) ≥ f(x) + ∇f(x)ᵀ(y − x) + (μ/2)‖y − x‖² for all y.",
          "Minimises the right side over y (at y = x − ∇f(x)/μ) to get the value f(x) − ‖∇f(x)‖²/(2μ).",
          "Concludes that f(y) ≥ f(x) − ‖∇f(x)‖²/(2μ) for every y, hence for f*, and rearranges.",
        ],
      },
    },
    {
      key: "kap2",
      rung: "stretch",
      prompt: <p>f(x) = x² + log(1 + eˣ) on ℝ. Using the best constants, what is κ = L/μ?</p>,
      answer: { kind: "numeric", value: 1.125, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what strong convexity adds to convexity, why a strongly convex smooth function is sandwiched between two parabolas, how the lower parabola turns a small gradient into a guarantee about the value and the distance to the minimiser, and what the condition number measures.",

  glimpse: (
    <>
      <p>
        The sandwich is all gradient descent needs. The next lesson combines the two bounds into convergence rates: 1/k for
        smooth convex functions, and a geometric rate governed by κ once strong convexity is added.
      </p>
    </>
  ),
};
