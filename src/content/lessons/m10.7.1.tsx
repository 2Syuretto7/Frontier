import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SubgradPathViz } from "@/components/viz/SubgradPathViz";
import type { LessonContent } from "@/lib/types";

const SG = `import numpy as np

def subgrad_l1(x):
    return np.sign(x)

def subgrad_max(A, b, x):
    v = A @ x + b
    i = int(np.argmax(v))
    return A[i], float(v[i])

def in_subdiff_abs(g, x, tol=1e-12):
    if abs(x) > tol:
        return abs(g - np.sign(x)) <= tol
    return -1 - tol <= g <= 1 + tol`;

const SM = `import numpy as np

def subgradient_method(f, sub, x0, steps):
    x = np.array(x0, dtype=float)
    best = f(x)
    hist = [best]
    for t in steps:
        x = x - t * sub(x)
        best = min(best, f(x))
        hist.append(best)
    return x, np.array(hist)

def bound(R, G, steps):
    steps = np.asarray(steps, dtype=float)
    return (R ** 2 + G ** 2 * np.sum(steps ** 2)) / (2 * np.sum(steps))`;

export const lesson: LessonContent = {
  id: "m10.7.1",
  minutes: 45,
  links: {
    requires: ["m10.2.2", "m10.5.1"],
    revisits: ["m10.1.3"],
    foreshadows: ["m10.7.2", "m10.7.4"],
  },

  puzzle: (
    <>
      <p>
        The function |x| has its minimum exactly at the one point where it has no derivative. Many of the most useful
        objectives in statistics and machine learning, such as absolute errors, the hinge loss and the ℓ₁ penalty, are
        built from such kinks. What replaces the gradient at a kink, how do you recognise a minimum there, and can a method
        that only follows these replacements still converge?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At a smooth point a convex function has exactly one tangent line lying below it. At a kink it has a whole fan of
        supporting lines, every slope between the left and right derivatives. Each of these slopes is a subgradient. The
        minimum is where a flat line is in the fan. Stepping against a subgradient does not always go downhill, but it
        always moves closer to every minimiser, provided the step is small enough, and that is what the analysis uses.
      </p>
      <SubgradPathViz />
    </>
  ),

  theory: (
    <>
      <Definition title="subgradient and subdifferential">
        <p>A vector g is a subgradient of a convex f at x if</p>
        <MD>{"f(y) \\geq f(x) + g^\\top(y - x) \\quad\\text{for all } y."}</MD>
        <p>
          The set of all of them is the subdifferential <M>{"\\partial f(x)"}</M>, a closed convex set; it is nonempty at
          every interior point of the domain, by the supporting hyperplane theorem applied to the epigraph. If f is
          differentiable at x, then <M>{"\\partial f(x) = \\{\\nabla f(x)\\}"}</M>. Examples:{" "}
          <M>{"\\partial|x|(0) = [-1, 1]"}</M>; <M>{"\\partial\\|x\\|_2(0)"}</M> is the unit ball; and for{" "}
          <M>{"f = \\max_i(a_i^\\top x + b_i)"}</M>, <M>{"\\partial f(x)"}</M> is the convex hull of the <M>{"a_i"}</M> for
          the terms that attain the maximum.
        </p>
      </Definition>

      <Theorem title="optimality">
        <p>x* minimises a convex f if and only if <M>{"0 \\in \\partial f(x^*)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          With g = 0 the defining inequality reads <M>{"f(y) \\geq f(x^*)"}</M> for all y, which is exactly the statement
          that x* is a minimiser.
        </p>
        <Code>{SG}</Code>
      </Proof>

      <Theorem title="the subgradient method">
        <p>
          Let f be convex with minimiser x*, <M>{"\\|x_0 - x^*\\| \\leq R"}</M>, and every subgradient used of norm at most G.
          The iteration <M>{"x_{i+1} = x_i - t_ig_i"}</M>, <M>{"g_i \\in \\partial f(x_i)"}</M>, satisfies
        </p>
        <MD>{"\\min_{i < k} f(x_i) - f^* \\leq \\frac{R^2 + G^2\\sum_{i<k}t_i^2}{2\\sum_{i<k}t_i}."}</MD>
        <p>
          With the constant step <M>{"t = R/(G\\sqrt k)"}</M> the bound is <M>{"RG/\\sqrt k"}</M>; with{" "}
          <M>{"t_i \\to 0"}</M> and <M>{"\\sum t_i = \\infty"}</M> it tends to 0.
        </p>
      </Theorem>
      <Proof>
        <p>Expand the distance to x* and use the subgradient inequality at y = x*:</p>
        <MD>{"\\|x_{i+1} - x^*\\|^2 = \\|x_i - x^*\\|^2 - 2t_ig_i^\\top(x_i - x^*) + t_i^2\\|g_i\\|^2 \\leq \\|x_i - x^*\\|^2 - 2t_i(f(x_i) - f^*) + t_i^2G^2."}</MD>
        <p>
          Sum over i &lt; k, drop <M>{"\\|x_k - x^*\\|^2 \\geq 0"}</M>, and bound each <M>{"f(x_i) - f^*"}</M> below by the
          smallest of them: <M>{"2\\big(\\sum t_i\\big)\\min_i(f(x_i) - f^*) \\leq R^2 + G^2\\sum t_i^2"}</M>.
        </p>
      </Proof>

      <Remark title="slow but optimal">
        <p>
          The method is not a descent method, so one tracks the best value so far. The rate 1/√k is much slower than the
          1/k of gradient descent on smooth problems, and it cannot be improved in general: for any method using only
          subgradients there are Lipschitz convex functions on which the error after k steps is at least of order{" "}
          <M>{"RG/\\sqrt k"}</M>. The way forward is to exploit structure, splitting off the nonsmooth part, which the next
          lesson does. In the code, |x| + 2|y| from (1, 1) with constant step 0.1 has best value 0.1 after 100 steps, but
          the current value is 0.4; the bound for this step is 0.35. With the tuned step{" "}
          <M>{"R/(G\\sqrt{100})"}</M> the best value is 0.0358 against the guarantee 0.3162.
        </p>
        <Code>{SM}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "maxsub",
      rung: "check",
      prompt: <p>f(x) = max(2x, −x, 1) on ℝ. At x = 0.5, ∂f(x) is an interval. What is its right endpoint?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "bd",
      rung: "check",
      prompt: <p>With R = 1, G = 1 and k = 100 steps of the constant step R/(G√k), what is the guaranteed bound on the best gap?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "ball",
      rung: "apply",
      prompt: <p>What is the subdifferential of the Euclidean norm ‖x‖₂ at x = 0 in ℝⁿ?</p>,
      answer: {
        kind: "choice",
        options: ["The closed unit ball, all g with ‖g‖₂ ≤ 1", "The unit sphere, all g with ‖g‖₂ = 1", "The single point 0", "The empty set, since the norm is not differentiable at 0"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def subgrad_l1(x):
    return np.sign(x)

def subgrad_max(A, b, x):
    v = A @ x + b
    i = int(np.argmax(v))
    return A[i], float(v[i])

def in_subdiff_abs(g, x, tol=1e-12):
    if abs(x) > tol:
        return abs(g - np.sign(x)) <= tol
    return -1 - tol <= g <= 1 + tol

print(subgrad_l1(np.array([2.0, -0.5, 0.0])).tolist(), in_subdiff_abs(0.3, 0.0), in_subdiff_abs(0.3, 1.0))
A = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, -1.0]]); b = np.array([0.0, 0.0, -1.0])
g, v = subgrad_max(A, b, np.array([2.0, 1.0]))
print(g.tolist(), v, subgrad_max(A, b, np.array([-1.0, -1.0]))[0].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.0, -1.0, 0.0] True False\n[1.0, 0.0] 2.0 [-1.0, -1.0]", "[1.0, -1.0, 1.0] True False\n[1.0, 0.0] 2.0 [-1.0, -1.0]", "[1.0, -1.0, 0.0] False False\n[1.0, 0.0] 2.0 [-1.0, -1.0]", "[1.0, -1.0, 0.0] True False\n[0.0, 1.0] 1.0 [1.0, 0.0]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def subgradient_method(f, sub, x0, steps):
    x = np.array(x0, dtype=float)
    best = f(x)
    hist = [best]
    for t in steps:
        x = x - t * sub(x)
        best = min(best, f(x))
        hist.append(best)
    return x, np.array(hist)

def bound(R, G, steps):
    steps = np.asarray(steps, dtype=float)
    return (R ** 2 + G ** 2 * np.sum(steps ** 2)) / (2 * np.sum(steps))

f = lambda x: float(abs(x[0]) + 2 * abs(x[1])); sub = lambda x: np.array([np.sign(x[0]), 2 * np.sign(x[1])])
x, h = subgradient_method(f, sub, [1.0, 1.0], [0.1] * 100)
print(round(h[-1], 4), round(f(x), 4), round(bound(np.sqrt(2), np.sqrt(5), [0.1] * 100), 4))
t = np.sqrt(2) / (np.sqrt(5) * 10)
x, h = subgradient_method(f, sub, [1.0, 1.0], [t] * 100)
print(round(h[-1], 4), round(bound(np.sqrt(2), np.sqrt(5), [t] * 100), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.1 0.4 0.35\n0.0358 0.3162", "0.4 0.4 0.35\n0.0358 0.3162", "0.1 0.1 0.35\n0.0358 0.3162", "0.1 0.4 0.35\n0.3162 0.0358"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>subgrad_l1(x)</C> (the subgradient sign(x) of ‖x‖₁), <C>subgrad_max(A, b, x)</C> (a subgradient of max
          over rows of Ax + b, from the first row attaining the maximum, and the maximum value), and{" "}
          <C>in_subdiff_abs(g, x, tol=1e-12)</C>, which tests whether g ∈ ∂|·|(x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def subgrad_l1(x):
    return np.zeros_like(x)

def subgrad_max(A, b, x):
    return A[0], 0.0

def in_subdiff_abs(g, x, tol=1e-12):
    return False
`,
        solution: SG,
        tests: [
          { name: "max", code: `A = np.array([[2.0, 1.0], [-1.0, 0.0], [0.0, 3.0]]); b = np.array([0.0, 1.0, -2.0])
g, v = subgrad_max(A, b, np.array([1.0, 1.0]))
assert np.allclose(g, [2.0, 1.0]) and abs(v - 3.0) < 1e-12
assert np.allclose(subgrad_max(A, b, np.array([-2.0, 0.0]))[0], [-1.0, 0.0])` },
          { name: "abs", code: `assert in_subdiff_abs(-1.0, 0.0) and in_subdiff_abs(0.7, 0.0) and not in_subdiff_abs(1.2, 0.0)
assert in_subdiff_abs(-1.0, -3.0) and not in_subdiff_abs(0.0, 2.0) and np.allclose(subgrad_l1(np.array([-2.0, 0.0, 5.0])), [-1, 0, 1])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>subgradient_method(f, sub, x0, steps)</C>, which takes one step per entry of steps and returns the final x
          and the array of best values so far (including the start), and <C>bound(R, G, steps)</C>, the guarantee from the
          theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def subgradient_method(f, sub, x0, steps):
    return np.array(x0, dtype=float), np.array([f(np.array(x0, dtype=float))])

def bound(R, G, steps):
    return 0.0
`,
        solution: SM,
        tests: [
          { name: "hist", code: `x, h = subgradient_method(lambda x: float(abs(x[0])), lambda x: np.sign(x), [1.0], [0.3, 0.3, 0.3, 0.3])
assert np.allclose(x, [-0.2]) and np.allclose(h, [1.0, 0.7, 0.4, 0.1, 0.1])` },
          { name: "bound", code: `assert abs(bound(1.0, 1.0, [0.1] * 100) - 0.1) < 1e-12
f = lambda x: float(np.abs(x - 1).sum()); s = lambda x: np.sign(x - 1)
st = [1 / np.sqrt(i + 1) for i in range(400)]
x, h = subgradient_method(f, s, np.zeros(3), st)
assert h[-1] <= bound(np.sqrt(3), np.sqrt(3), st) and np.all(np.diff(h) <= 0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the subgradient method bound: min over i &lt; k of f(x_i) − f* ≤ (R² + G²Σt_i²)/(2Σt_i), where ‖x₀ − x*‖ ≤ R and
          ‖g_i‖ ≤ G.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Expands ‖x_{i+1} − x*‖² = ‖x_i − x*‖² − 2t_i g_iᵀ(x_i − x*) + t_i²‖g_i‖².",
          "Uses the subgradient inequality f* ≥ f(x_i) + g_iᵀ(x* − x_i) to bound g_iᵀ(x_i − x*) ≥ f(x_i) − f*, and ‖g_i‖ ≤ G.",
          "Sums over i, drops the final nonnegative distance, and bounds each gap below by the minimum to conclude.",
        ],
      },
    },
    {
      key: "mins",
      rung: "stretch",
      prompt: <p>f(x) = |x − 1| + |x + 1|. Using 0 ∈ ∂f(x), find the set of minimisers. What is its length?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a subgradient is, why 0 in the subdifferential characterises a minimum, why the subgradient method can increase f yet still converge, and why its 1/√k rate is the best possible without more structure.",

  glimpse: (
    <>
      <p>
        Most nonsmooth objectives are a smooth loss plus a simple nonsmooth penalty. The proximal operator handles the
        penalty exactly, recovering the fast rates of the smooth case.
      </p>
    </>
  ),
};
