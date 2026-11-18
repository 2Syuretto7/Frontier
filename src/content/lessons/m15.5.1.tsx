import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LassoRecoveryViz } from "@/components/viz/LassoRecoveryViz";
import type { LessonContent } from "@/lib/types";

const LASSO = `import math

def soft(z, t):
    return math.copysign(max(abs(z) - t, 0.0), z)

def lasso_cd(A, y, lam, sweeps):
    n, d = len(A), len(A[0])
    x = [0.0] * d
    r = list(y)
    for _ in range(sweeps):
        for j in range(d):
            col = [A[i][j] for i in range(n)]
            sq = sum(c * c for c in col) / n
            if sq == 0:
                continue
            rho = sum(c * ri for c, ri in zip(col, r)) / n + sq * x[j]
            new = soft(rho, lam) / sq
            if new != x[j]:
                r = [ri - c * (new - x[j]) for ri, c in zip(r, col)]
                x[j] = new
    return x

def support(x, tol=1e-8):
    return [j for j, v in enumerate(x) if abs(v) > tol]`;

const RATES = `import math

def lambda_choice(sigma, n, d, delta):
    return 2 * sigma * math.sqrt(2 * math.log(2 * d / delta) / n)

def lasso_error_bound(s, lam, kappa):
    return 3 * math.sqrt(s) * lam / kappa

def bp_measurements(s, d):
    return math.ceil(2 * s * math.log(d / s) + 1.25 * s)`;

export const lesson: LessonContent = {
  id: "m15.5.1",
  minutes: 60,
  links: {
    requires: ["m15.4.3", "m10.7.3"],
    revisits: ["l1.5.3", "m15.3.1"],
    foreshadows: ["m15.5.2"],
  },

  puzzle: (
    <>
      <p>
        You have 80 noisy linear measurements of a vector with 100 unknown coordinates. Least squares has infinitely many
        exact fits, so the data seem to determine nothing. But you also know that only 5 coordinates are nonzero, without
        knowing which. How many measurements does that knowledge save, how accurately can you then estimate the vector,
        and what should the lasso penalty be?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Sparsity shrinks the set of candidate vectors from all of <M>{"\\mathbb{R}^{100}"}</M> to a union of 5-dimensional
        subspaces, whose squared Gaussian width is about <M>{"2s\\log(d/s)"}</M> rather than d. Random measurements keep that
        set out of their null space once their number exceeds the width squared. The <M>{"\\ell_1"}</M> penalty is the convex
        stand-in for &ldquo;few nonzeros&rdquo;, and its strength is set just above the noise level of the most correlated
        column, so that pure noise never looks like a signal.
      </p>
      <LassoRecoveryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the sparse linear model">
        <p>
          Observe <M>{"y = Ax^* + \\varepsilon"}</M> with A an n × d design, possibly n &lt; d, ε noise with independent{" "}
          <M>{"N(0, \\sigma^2)"}</M> entries, and <M>{"x^*"}</M> supported on an unknown set S of size s. The <em>lasso</em> estimate
          is
        </p>
        <MD>{"\\hat x = \\arg\\min_x \\frac{1}{2n}\\|y - Ax\\|^2 + \\lambda\\|x\\|_1,"}</MD>
        <p>
          computed by coordinate descent with soft thresholding as in m10.7.3 (<C>lasso_cd</C>). With no noise, the limit is{" "}
          <em>basis pursuit</em>: minimise <M>{"\\|x\\|_1"}</M> subject to <M>{"Ax = y"}</M>.
        </p>
        <Code>{LASSO}</Code>
      </Definition>

      <Theorem title="exact recovery and the descent cone">
        <p>
          Let <M>{"\\mathcal{D} = \\{h : \\|x^* + th\\|_1 \\le \\|x^*\\|_1 \\text{ for some } t > 0\\}"}</M>, the descent cone of the{" "}
          <M>{"\\ell_1"}</M> norm at <M>{"x^*"}</M>. Basis pursuit recovers <M>{"x^*"}</M> uniquely if and only if{" "}
          <M>{"\\ker A \\cap \\mathcal{D} = \\{0\\}"}</M>. For a Gaussian A this holds with high probability once{" "}
          <M>{"\\sqrt n"}</M> exceeds the width of <M>{"\\mathcal{D} \\cap S^{d-1}"}</M>, and that squared width is at most about{" "}
          <M>{"2s\\log(d/s) + \\tfrac54s"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Any other feasible point is <M>{"x^* + h"}</M> with <M>{"Ah = 0"}</M> and h ≠ 0; it does at least as well as{" "}
          <M>{"x^*"}</M> exactly when <M>{"h \\in \\mathcal{D}"}</M> (convexity lets t = 1 stand for any t). So recovery fails
          precisely when the null space meets the cone. The null space misses the cone when it misses{" "}
          <M>{"\\mathcal{D} \\cap S^{d-1}"}</M>, which is Gordon&apos;s escape through the mesh (m15.4.3). The width bound is a
          computation by Amelunxen, Lotz, McCoy and Tropp (2014), who also showed that the transition from failure to success
          happens sharply at that number of measurements. <C>bp_measurements</C> evaluates it.
        </p>
      </Proof>

      <Definition title="restricted eigenvalue">
        <p>
          A satisfies the <em>restricted eigenvalue condition</em> with constant κ &gt; 0 on S if{" "}
          <M>{"\\tfrac1n\\|Ah\\|^2 \\ge \\kappa\\|h\\|^2"}</M> for every h in the cone{" "}
          <M>{"\\{h : \\|h_{S^c}\\|_1 \\le 3\\|h_S\\|_1\\}"}</M>. Only vectors concentrated on S need to be kept away from the
          null space, not all vectors, which is impossible when n &lt; d.
        </p>
      </Definition>

      <Theorem title="lasso error bound">
        <p>
          If A satisfies the restricted eigenvalue condition with constant κ and{" "}
          <M>{"\\lambda \\ge 2\\|A^\\top\\varepsilon\\|_\\infty/n"}</M>, then{" "}
          <M>{"\\|\\hat x - x^*\\|_2 \\le 3\\sqrt s\\,\\lambda/\\kappa"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"h = \\hat x - x^*"}</M>. Since <M>{"\\hat x"}</M> does at least as well as <M>{"x^*"}</M> in the objective, expanding{" "}
          <M>{"y - A\\hat x = \\varepsilon - Ah"}</M> gives the basic inequality{" "}
          <M>{"\\tfrac{1}{2n}\\|Ah\\|^2 \\le \\tfrac1n\\langle A^\\top\\varepsilon, h\\rangle + \\lambda(\\|x^*\\|_1 - \\|\\hat x\\|_1)"}</M>. The first
          term is at most <M>{"\\tfrac\\lambda2\\|h\\|_1"}</M> by the choice of λ. Since <M>{"x^*"}</M> vanishes off S,{" "}
          <M>{"\\|\\hat x\\|_1 \\ge \\|x^*\\|_1 - \\|h_S\\|_1 + \\|h_{S^c}\\|_1"}</M>. Together,{" "}
          <M>{"0 \\le \\tfrac{1}{2n}\\|Ah\\|^2 \\le \\tfrac{3\\lambda}2\\|h_S\\|_1 - \\tfrac\\lambda2\\|h_{S^c}\\|_1"}</M>. So h lies in the cone,
          and with the restricted eigenvalue condition and{" "}
          <M>{"\\|h_S\\|_1 \\le \\sqrt s\\|h\\|_2"}</M>,{" "}
          <M>{"\\tfrac\\kappa2\\|h\\|^2 \\le \\tfrac{3\\lambda}2\\sqrt s\\|h\\|"}</M>. Divide by <M>{"\\tfrac\\kappa2\\|h\\|"}</M>.
        </p>
      </Proof>

      <Example title="choosing λ">
        <p>
          If every column has <M>{"\\|a_j\\|^2 = n"}</M>, then <M>{"(A^\\top\\varepsilon)_j/n"}</M> is <M>{"N(0, \\sigma^2/n)"}</M>, and a union
          bound over the 2d signed coordinates gives{" "}
          <M>{"P(\\|A^\\top\\varepsilon\\|_\\infty/n \\ge \\lambda/2) \\le 2de^{-n\\lambda^2/(8\\sigma^2)}"}</M>. Setting this to δ gives{" "}
          <M>{"\\lambda = 2\\sigma\\sqrt{2\\log(2d/\\delta)/n}"}</M> (<C>lambda_choice</C>), and then, with probability at least{" "}
          <M>{"1 - \\delta"}</M>,
        </p>
        <MD>{"\\|\\hat x - x^*\\|_2 \\le \\frac{6\\sigma}{\\kappa}\\sqrt{\\frac{2s\\log(2d/\\delta)}{n}}."}</MD>
        <p>
          Compare with least squares when the support is known: error about <M>{"\\sigma\\sqrt{s/n}"}</M>. Not knowing the support
          costs only the factor <M>{"\\sqrt{\\log d}"}</M>. For Gaussian designs the restricted eigenvalue condition holds with κ
          bounded below once n is a constant times <M>{"s\\log(d/s)"}</M>, again by Gordon&apos;s theorem applied to the cone.{" "}
          <C>lasso_error_bound</C> evaluates the bound.
        </p>
        <Code>{RATES}</Code>
      </Example>

      <Remark title="what the bound does not promise">
        <p>
          A small <M>{"\\ell_2"}</M> error does not mean the right support. Recovering S exactly needs more: the smallest nonzero
          coefficient must exceed the noise level by a margin, and the design must satisfy an <em>irrepresentability</em>{" "}
          condition, that columns off S are not too well explained by columns on S. The lasso also shrinks every kept
          coefficient by about λ; refitting least squares on the selected support, or a debiased lasso, removes that bias and
          allows confidence intervals.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lam",
      rung: "check",
      prompt: <p>What λ does the lesson&apos;s rule give for σ = 1, n = 400, d = 1000 and δ = 0.05? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.4604, tolerance: 0.00006 },
    },
    {
      key: "bp",
      rung: "check",
      prompt: <p>About how many Gaussian measurements does basis pursuit need for a 10-sparse vector in 1000 dimensions, by the formula <M>{"\\lceil 2s\\log(d/s) + \\tfrac54s\\rceil"}</M>?</p>,
      answer: { kind: "numeric", value: 105, tolerance: 0.5 },
    },
    {
      key: "cone",
      rung: "apply",
      prompt: <p>Why does the lasso error analysis need the restricted eigenvalue condition rather than <M>{"\\tfrac1n\\|Ah\\|^2 \\ge \\kappa\\|h\\|^2"}</M> for all h?</p>,
      answer: {
        kind: "choice",
        options: [
          "With n < d the full condition fails for vectors in the null space, but the error is shown to lie in a cone that random designs keep away from it",
          "Because the full condition would make the lasso unnecessary but is otherwise always true",
          "Because the restricted condition is easier to compute",
          "Because the noise lies in the cone",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def soft(z, t):
    return math.copysign(max(abs(z) - t, 0.0), z)

def lasso_cd(A, y, lam, sweeps):
    n, d = len(A), len(A[0])
    x = [0.0] * d
    r = list(y)
    for _ in range(sweeps):
        for j in range(d):
            col = [A[i][j] for i in range(n)]
            sq = sum(c * c for c in col) / n
            if sq == 0:
                continue
            rho = sum(c * ri for c, ri in zip(col, r)) / n + sq * x[j]
            new = soft(rho, lam) / sq
            if new != x[j]:
                r = [ri - c * (new - x[j]) for ri, c in zip(r, col)]
                x[j] = new
    return x

def support(x, tol=1e-8):
    return [j for j, v in enumerate(x) if abs(v) > tol]

print(soft(3, 1), soft(-0.5, 1), soft(-2.5, 1), support([0, 0.3, -1e-12, -2]))
A = [[1, 0], [0, 1]]; print(lasso_cd(A, [3, 0.4], 0.2, 5), lasso_cd([[2, 0], [0, 2]], [4, -1], 0.5, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 -0.0 -1.5 [1, 3]\n[2.6, 0.0] [1.75, -0.25]",
          "2.0 0.0 -1.5 [1, 2, 3]\n[2.6, 0.0] [1.75, -0.25]",
          "2.0 -0.0 -1.5 [1, 3]\n[2.8, 0.2] [1.75, -0.25]",
          "2.0 -0.0 -1.5 [1, 3]\n[2.6, 0.0] [3.5, -0.5]",
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

def lambda_choice(sigma, n, d, delta):
    return 2 * sigma * math.sqrt(2 * math.log(2 * d / delta) / n)

def lasso_error_bound(s, lam, kappa):
    return 3 * math.sqrt(s) * lam / kappa

def bp_measurements(s, d):
    return math.ceil(2 * s * math.log(d / s) + 1.25 * s)

print(round(lambda_choice(1, 100, 50, 1), 4), lambda_choice(0, 10, 10, 0.1), lasso_error_bound(4, 0.5, 0.25))
print(bp_measurements(1, 1), bp_measurements(4, 400), bp_measurements(10, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.607 0.0 12.0\n2 42 59", "0.3035 0.0 12.0\n2 42 59", "0.607 0.0 6.0\n2 42 59", "0.607 0.0 12.0\n1 42 59"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>soft(z, t)</C>; <C>lasso_cd(A, y, lam, sweeps)</C>, cyclic coordinate descent from zero for the objective{" "}
          <M>{"\\tfrac{1}{2n}\\|y - Ax\\|^2 + \\lambda\\|x\\|_1"}</M>, skipping all-zero columns; and <C>support(x, tol=1e-8)</C>, the
          indices with <M>{"|x_j| > "}</M>tol.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def soft(z, t):
    return z

def lasso_cd(A, y, lam, sweeps):
    return [0.0] * len(A[0])

def support(x, tol=1e-8):
    return []
`,
        solution: LASSO,
        tests: [
          { name: "basic", code: `assert soft(3, 1) == 2 and soft(-2.5, 1) == -1.5 and soft(0.5, 1) == 0 and soft(4, 0) == 4
assert support([0, 0.3, -1e-12, -2]) == [1, 3] and support([0.1], 0.2) == []
assert lasso_cd([[1, 0], [0, 1]], [3, 0.4], 0.2, 5) == [2.6, 0.0] and lasso_cd([[2, 0], [0, 2]], [4, -1], 0.5, 3) == [1.75, -0.25]
assert lasso_cd([[0, 1], [0, 2]], [1, 2], 0.1, 4)[0] == 0` },
          { name: "recover", code: `import math, random
r = random.Random(0); n, d = 60, 40
A = [[r.gauss(0, 1) for _ in range(d)] for _ in range(n)]; xs = [0.0] * d; xs[3], xs[17], xs[30] = 2.0, -1.5, 1.0
y = [sum(a * b for a, b in zip(row, xs)) + 0.1 * r.gauss(0, 1) for row in A]
x = lasso_cd(A, y, 0.05, 200); assert support(x, 0.2) == [3, 17, 30] and math.dist(x, xs) < 0.3
g = [sum(A[i][j] * (y[i] - sum(a * b for a, b in zip(A[i], x))) for i in range(n)) / n for j in range(d)]
assert all(abs(g[j]) <= 0.05 + 1e-6 for j in range(d)) and all(abs(g[j] - 0.05 * math.copysign(1, x[j])) < 1e-6 for j in range(d) if x[j] != 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lambda_choice(sigma, n, d, delta)</C>; <C>lasso_error_bound(s, lam, kappa)</C>, the bound{" "}
          <M>{"3\\sqrt s\\lambda/\\kappa"}</M>; and <C>bp_measurements(s, d)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def lambda_choice(sigma, n, d, delta):
    return 0.0

def lasso_error_bound(s, lam, kappa):
    return 0.0

def bp_measurements(s, d):
    return 0
`,
        solution: RATES,
        tests: [
          { name: "lam", code: `import math
assert abs(lambda_choice(1, 400, 1000, 0.05) - 2 * math.sqrt(2 * math.log(40000) / 400)) < 1e-15 and lambda_choice(0, 10, 10, 0.1) == 0
assert abs(lambda_choice(2, 50, 25, 1) - 4 * math.sqrt(2 * math.log(50) / 50)) < 1e-15` },
          { name: "bounds", code: `assert lasso_error_bound(4, 0.5, 0.25) == 12 and lasso_error_bound(9, 1, 3) == 3
assert bp_measurements(1, 1) == 2 and bp_measurements(4, 400) == 42 and bp_measurements(10, 1000) == 105 and bp_measurements(10, 100) == 59` },
        ],
      },
    },
    {
      key: "err",
      rung: "stretch",
      prompt: (
        <p>
          With σ = 1, d = 1000, δ = 0.05 and n = 10,000 measurements, the rule gives λ. What error bound does the theorem give for
          a 10-sparse vector if κ = 0.5? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.7469, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sparsity is one kind of structure; low rank is another. The next lesson recovers a large matrix from a small
        fraction of its entries, with the nuclear norm playing the part of the <M>{"\\ell_1"}</M> norm.
      </p>
    </>
  ),
};
