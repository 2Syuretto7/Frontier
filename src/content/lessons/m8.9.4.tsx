import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GdRateViz } from "@/components/viz/GdRateViz";
import type { LessonContent } from "@/lib/types";

const GD = `def rate(mu, L, eta):
    return max(abs(1 - eta * mu), abs(1 - eta * L))

def gd(lams, w0, eta, n):
    w = list(w0)
    for _ in range(n):
        w = [wi - eta * lam * wi for wi, lam in zip(w, lams)]
    return w`;

const SOLVERS = `def jacobi(A, b, x, n):
    for _ in range(n):
        x = [(b[i] - sum(A[i][j] * x[j] for j in range(len(x)) if j != i)) / A[i][i]
             for i in range(len(x))]
    return x

def newton_errors(g, dg, x0, root, n):
    errs, x = [], x0
    for _ in range(n):
        x = x - g(x) / dg(x)
        errs.append(abs(x - root))
    return errs`;

export const lesson: LessonContent = {
  id: "m8.9.4",
  minutes: 60,
  links: {
    requires: ["m8.9.3"],
    revisits: ["m8.5.4", "m8.6.3"],
    foreshadows: ["m10.5.1", "m10.5.2"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent, Newton&apos;s method, the Jacobi solver for linear systems and value iteration all have the same
        shape: x ← T(x), repeated. Gradient descent with a good step size gains a constant number of digits per step; Newton
        doubles the number of correct digits per step; a step size slightly too large makes gradient descent explode. The
        contraction mapping theorem, applied near the solution, explains all three behaviours.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Near a fixed point a smooth map looks like its derivative there. If that derivative shrinks distances by a factor q,
        the iteration is a contraction locally and errors fall like qⁿ. The art in designing an algorithm is making q small:
        a good step size for gradient descent, or, in Newton&apos;s method, making the derivative at the solution exactly zero.
      </p>
      <GdRateViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="local contraction">
        <p>
          Let T be continuously differentiable near a fixed point x* = T(x*) with |T′(x*)| &lt; 1. Then for some δ &gt; 0, T maps{" "}
          <M>{"I = [x^* - \\delta, x^* + \\delta]"}</M> into itself and is a contraction there, so iteration from any start in I
          converges to x*, with error eventually shrinking by about |T′(x*)| per step.
        </p>
      </Theorem>
      <Proof>
        <p>
          Pick q with |T′(x*)| &lt; q &lt; 1. By continuity of T′ there is δ with |T′| ≤ q on I. By the mean value theorem
          |Tx − Ty| ≤ q|x − y| on I, and |Tx − x*| = |Tx − Tx*| ≤ q|x − x*| ≤ δ, so T(I) ⊆ I. I is closed in ℝ, hence complete;
          apply the contraction mapping theorem. In ℝⁿ the same holds with a matrix norm of the Jacobian in place of |T′|.
        </p>
      </Proof>

      <Example title="gradient descent">
        <p>
          The gradient step is <M>{"T(w) = w - \\eta \\nabla f(w)"}</M>, whose fixed points are the critical points of f. On the
          quadratic <M>{"f(w) = \\tfrac12 w^\\top A w"}</M> with eigenvalues of A between μ &gt; 0 and L, T is linear with
          eigenvalues 1 − ηλ, so
        </p>
        <MD>{"q(\\eta) = \\max(|1 - \\eta\\mu|, |1 - \\eta L|),"}</MD>
        <p>
          which is below 1 exactly when 0 &lt; η &lt; 2/L, and smallest at η = 2/(L + μ), where q = (κ − 1)/(κ + 1) with κ = L/μ.
          For a general twice-differentiable f with μI ⪯ ∇²f ⪯ LI the mean value theorem gives the same bound. An
          ill-conditioned problem (large κ) has q close to 1, and convergence is slow.
        </p>
        <Code>{GD}</Code>
      </Example>

      <Theorem title="Newton's method converges quadratically">
        <p>
          If g(x*) = 0, g′(x*) ≠ 0 and g is twice continuously differentiable, then <M>{"T(x) = x - g(x)/g'(x)"}</M> satisfies
          T′(x*) = 0, and near x* the errors obey <M>{"|e_{n+1}| \\leq C e_n^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"T' = 1 - (g'^2 - g g'')/g'^2 = g g''/g'^2"}</M>, which is 0 at x*. So T is a local contraction with any q &gt; 0.
          For the rate, Taylor&apos;s theorem at <M>{"x_n"}</M> gives{" "}
          <M>{"0 = g(x^*) = g(x_n) + g'(x_n)(x^* - x_n) + \\tfrac12 g''(\\xi)(x^* - x_n)^2"}</M>; dividing by{" "}
          <M>{"g'(x_n)"}</M> and rearranging, <M>{"x_{n+1} - x^* = \\frac{g''(\\xi)}{2g'(x_n)}(x_n - x^*)^2"}</M>, and the factor is
          bounded near x*.
        </p>
      </Proof>

      <Example title="Jacobi iteration">
        <p>
          To solve Ax = b, split A = D + R with D diagonal and iterate <M>{"x \\leftarrow D^{-1}(b - Rx)"}</M>. In the ∞-norm this
          map has contraction factor <M>{"\\max_i \\sum_{j \\neq i} |a_{ij}|/|a_{ii}|"}</M>, so it converges whenever A is strictly
          diagonally dominant; for the 2 × 2 system below the factor is 2/5. Newton&apos;s errors, by contrast, are roughly
          squared at each step.
        </p>
        <Code>{SOLVERS}</Code>
      </Example>

      <Remark title="where this leads">
        <p>
          Value iteration is a γ-contraction in the sup norm; deep equilibrium models define a layer&apos;s output as a fixed
          point z = f(z, x) and find it by iteration; the EM algorithm and many alternating schemes are fixed-point iterations
          too. The convex optimisation course takes up gradient methods properly, with the descent lemma, strong convexity and
          acceleration, building on exactly the analysis of this course: completeness, compactness, the mean value theorem,
          Taylor&apos;s theorem and the contraction principle.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "q",
      rung: "check",
      prompt: <p>For gradient descent on a quadratic with μ = 1, L = 10 and η = 0.1, what is the contraction factor q?</p>,
      answer: { kind: "numeric", value: 0.9, tolerance: 0.0001 },
    },
    {
      key: "best",
      rung: "check",
      prompt: <p>With κ = 10, what is the best contraction factor (κ − 1)/(κ + 1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.8182, tolerance: 0.0001 },
    },
    {
      key: "newton",
      rung: "apply",
      prompt: <p>Why does Newton&apos;s method converge so fast near a simple root?</p>,
      answer: {
        kind: "choice",
        options: [
          "The iteration map has derivative 0 at the root, so the error is roughly squared each step",
          "Newton's map is a contraction on the whole line",
          "The function must be convex",
          "Its step size is 1, which is always optimal",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rate(mu, L, eta):
    return max(abs(1 - eta * mu), abs(1 - eta * L))

def gd(lams, w0, eta, n):
    w = list(w0)
    for _ in range(n):
        w = [wi - eta * lam * wi for wi, lam in zip(w, lams)]
    return w

print(rate(1, 10, 0.1), round(rate(1, 10, 2 / 11), 4), rate(1, 10, 0.25))
print([f"{abs(x):.2e}" for x in gd([1, 10], [1.0, 1.0], 2 / 11, 20)], f"{(9 / 11) ** 20:.2e}")`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.9 0.8182 1.5\n['1.81e-02', '1.81e-02'] 1.81e-02",
          "0.9 0.8182 0.75\n['1.81e-02', '1.81e-02'] 1.81e-02",
          "0.0 0.8182 1.5\n['1.81e-02', '1.81e-02'] 1.81e-02",
          "0.9 0.8182 1.5\n['1.81e-02', '0.00e+00'] 1.81e-02",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def jacobi(A, b, x, n):
    for _ in range(n):
        x = [(b[i] - sum(A[i][j] * x[j] for j in range(len(x)) if j != i)) / A[i][i]
             for i in range(len(x))]
    return x

def newton_errors(g, dg, x0, root, n):
    errs, x = [], x0
    for _ in range(n):
        x = x - g(x) / dg(x)
        errs.append(abs(x - root))
    return errs

print([round(v, 6) for v in jacobi([[4, 1], [2, 5]], [1, 2], [0.0, 0.0], 25)])
print([f"{e:.1e}" for e in newton_errors(lambda x: x * x - 2, lambda x: 2 * x, 1.0, math.sqrt(2), 4)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.166667, 0.333333]\n['8.6e-02', '2.5e-03', '2.1e-06', '1.6e-12']",
          "[0.25, 0.4]\n['8.6e-02', '2.5e-03', '2.1e-06', '1.6e-12']",
          "[0.166667, 0.333333]\n['8.6e-02', '4.3e-02', '2.1e-02', '1.1e-02']",
          "[0.333333, 0.166667]\n['8.6e-02', '2.5e-03', '2.1e-06', '1.6e-12']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rate(mu, L, eta)</C>, returning max(|1 − ημ|, |1 − ηL|), and <C>gd(lams, w0, eta, n)</C>, running n gradient
          steps on f(w) = ½ Σ λᵢwᵢ², whose gradient has components λᵢwᵢ, and returning the final list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rate(mu, L, eta):
    return 0

def gd(lams, w0, eta, n):
    return list(w0)
`,
        solution: GD,
        tests: [
          { name: "rate", code: `assert rate(2, 4, 0.25) == 0.5 and rate(1, 1, 1) == 0` },
          { name: "gd", code: `assert gd([2], [1.0], 0.25, 3) == [0.125]
w = gd([1, 10], [1.0, 1.0], 0.25, 5)
assert abs(w[1]) > 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jacobi(A, b, x, n)</C>, applying n Jacobi sweeps that compute every new component from the old vector, and{" "}
          <C>newton_errors(g, dg, x0, root, n)</C>, returning the list of |xₖ − root| after each of n Newton steps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def jacobi(A, b, x, n):
    return x

def newton_errors(g, dg, x0, root, n):
    return []
`,
        solution: SOLVERS,
        tests: [
          { name: "jacobi", code: `assert jacobi([[2, 0], [0, 4]], [2, 8], [0, 0], 1) == [1.0, 2.0]
x = jacobi([[5, 1, 1], [1, 4, 2], [0, 1, 3]], [7, 7, 4], [0, 0, 0], 60)
assert all(abs(v - 1) < 1e-9 for v in x)` },
          { name: "newton", code: `assert newton_errors(lambda x: x - 3, lambda x: 1.0, 0.0, 3.0, 2) == [0.0, 0.0]
e = newton_errors(lambda x: x * x - 4, lambda x: 2 * x, 3.0, 2.0, 3)
assert e[1] < e[0] ** 2 and e[2] < e[1] ** 2` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let T be continuously differentiable near x* with T(x*) = x* and |T′(x*)| &lt; 1. Prove that some closed interval
          around x* is mapped into itself by T, and that T is a contraction on it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses continuity of T′ to choose δ and q < 1 with |T′| ≤ q on I = [x* − δ, x* + δ].",
          "Applies the mean value theorem to get |Tx − Ty| ≤ q|x − y| for x, y ∈ I.",
          "Shows |Tx − x*| = |Tx − Tx*| ≤ q|x − x*| ≤ δ, so T(I) ⊆ I (and may note I is complete, so the contraction theorem applies).",
        ],
      },
    },
    {
      key: "eta",
      rung: "stretch",
      prompt: <p>For L = 10, gradient descent on the quadratic is a contraction exactly for 0 &lt; η &lt; c. What is c?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a fixed-point iteration with |T′(x*)| < 1 converges locally, how the step size sets the contraction factor of gradient descent and why ill-conditioning slows it, why Newton's method converges quadratically, and when the Jacobi solver is a contraction.",

  glimpse: (
    <>
      <p>
        This completes real analysis. The convex optimisation course builds on it directly: smoothness and strong convexity
        are the hypotheses that make gradient methods contractions, and the rates found here become theorems there.
      </p>
    </>
  ),
};
