import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SingularEdgesViz } from "@/components/viz/SingularEdgesViz";
import type { LessonContent } from "@/lib/types";

const NORM = `import math

def gaussian_matrix(n, d, rng):
    return [[rng.gauss(0, 1) for _ in range(d)] for _ in range(n)]

def spec_norm(A, iters=300):
    d = len(A[0])
    v = [1.0 / (j + 1) for j in range(d)]
    s = 0.0
    for _ in range(iters):
        u = [sum(a * x for a, x in zip(row, v)) for row in A]
        w = [sum(A[i][j] * u[i] for i in range(len(A))) for j in range(d)]
        s = math.sqrt(sum(x * x for x in w))
        if s == 0:
            return 0.0
        v = [x / s for x in w]
    return math.sqrt(s)

def gordon_bound(n, d, delta):
    return math.sqrt(n) + math.sqrt(d) + math.sqrt(2 * math.log(1 / delta))`;

const BERN = `import math

def condition_bound(n, d):
    return (math.sqrt(n) + math.sqrt(d)) / (math.sqrt(n) - math.sqrt(d))

def matrix_bernstein(t, d, sigma2, L):
    return min(1.0, 2 * d * math.exp(-t * t / 2 / (sigma2 + L * t / 3)))

def bernstein_t(delta, d, sigma2, L):
    c = math.log(2 * d / delta)
    return L * c / 3 + math.sqrt((L * c / 3) ** 2 + 2 * sigma2 * c)`;

export const lesson: LessonContent = {
  id: "m15.3.4",
  minutes: 55,
  links: {
    requires: ["m15.3.3"],
    revisits: ["m15.1.2", "m15.3.2"],
    foreshadows: ["m15.4.1", "m15.5.2"],
  },

  puzzle: (
    <>
      <p>
        A 1000 × 1000 matrix of independent standard Gaussians has Frobenius norm about 1000, the square root of the sum of
        a million squared entries. Its largest singular value can be anything from 1000/√1000 ≈ 32 (if the mass is spread
        evenly over all directions) to 1000 (if it is all in one). Where does it actually fall, and how sure can you be,
        for this size and not just in a limit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Gaussian matrix A maps a unit vector to a vector of length about √n; the question is how much longer the worst
        direction can make it. The answer, √n + √d, is what you get by pretending the bilinear form{" "}
        <M>{"\\langle Au, v\\rangle"}</M> splits into a part depending only on u and a part depending only on v. A comparison
        inequality for Gaussian processes makes that pretence rigorous, and Gaussian concentration shows the norm hardly
        fluctuates.
      </p>
      <SingularEdgesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="extreme singular values">
        <p>
          For an n × d matrix A with <M>{"n \\ge d"}</M>, the largest singular value is the operator norm{" "}
          <M>{"s_{\\max}(A) = \\|A\\| = \\max_{\\|u\\| = \\|v\\| = 1}\\langle Au, v\\rangle"}</M> and the smallest is{" "}
          <M>{"s_{\\min}(A) = \\min_{\\|u\\| = 1}\\|Au\\|"}</M>; their ratio is the condition number. <C>spec_norm</C> finds{" "}
          <M>{"\\|A\\|"}</M> by power iteration on <M>{"A^\\top A"}</M>, whose top eigenvalue is <M>{"\\|A\\|^2"}</M>.
        </p>
        <Code>{NORM}</Code>
      </Definition>

      <Theorem title="Gordon’s bound">
        <p>
          If A is n × d with independent standard Gaussian entries, then{" "}
          <M>{"\\sqrt n - \\sqrt d \\le \\mathbb{E}s_{\\min}(A) \\le \\mathbb{E}s_{\\max}(A) \\le \\sqrt n + \\sqrt d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (The upper bound.) Index two Gaussian processes by pairs of unit vectors:{" "}
          <M>{"X_{u,v} = \\langle Au, v\\rangle"}</M> and <M>{"Y_{u,v} = \\langle g, u\\rangle + \\langle h, v\\rangle"}</M> with g, h
          independent standard Gaussian vectors in <M>{"\\mathbb{R}^d"}</M> and <M>{"\\mathbb{R}^n"}</M>. Writing{" "}
          <M>{"a = \\langle u, u'\\rangle"}</M> and <M>{"b = \\langle v, v'\\rangle"}</M>, the increments are{" "}
          <M>{"\\mathbb{E}(X_{u,v} - X_{u',v'})^2 = \\|uv^\\top - u'v'^\\top\\|_F^2 = 2 - 2ab"}</M> and{" "}
          <M>{"\\mathbb{E}(Y_{u,v} - Y_{u',v'})^2 = (2 - 2a) + (2 - 2b)"}</M>. The second minus the first is{" "}
          <M>{"2(1 - a)(1 - b) \\ge 0"}</M>. The Sudakov-Fernique inequality says that a centred Gaussian process with smaller
          increments has a smaller expected supremum, so{" "}
          <M>{"\\mathbb{E}\\|A\\| = \\mathbb{E}\\sup X \\le \\mathbb{E}\\sup Y = \\mathbb{E}\\|g\\| + \\mathbb{E}\\|h\\| \\le \\sqrt d + \\sqrt n"}</M>,
          the last step by m15.2.1. The lower bound on <M>{"s_{\\min}"}</M> uses Gordon&apos;s min-max refinement of the same idea.
        </p>
      </Proof>

      <Theorem title="the norm concentrates">
        <p>
          For the same A and <M>{"t \\ge 0"}</M>, <M>{"P(\\|A\\| \\ge \\sqrt n + \\sqrt d + t) \\le e^{-t^2/2}"}</M>, and likewise{" "}
          <M>{"P(s_{\\min}(A) \\le \\sqrt n - \\sqrt d - t) \\le e^{-t^2/2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the triangle inequality, <M>{"|\\|A\\| - \\|B\\|| \\le \\|A - B\\| \\le \\|A - B\\|_F"}</M>, so the norm is a 1-Lipschitz
          function of the nd entries in the Euclidean metric, and so is <M>{"s_{\\min}"}</M>. The Gaussian concentration
          inequality (Tsirelson, Ibragimov and Sudakov) says that a 1-Lipschitz function f of a standard Gaussian vector
          satisfies <M>{"P(f - \\mathbb{E}f \\ge t) \\le e^{-t^2/2}"}</M> in any dimension. Combine with Gordon&apos;s bound.{" "}
          <C>gordon_bound</C> returns the level exceeded with probability at most δ.
        </p>
      </Proof>

      <Remark title="the answer to the puzzle">
        <p>
          For the 1000 × 1000 matrix, <M>{"\\|A\\| \\le 2\\sqrt{1000} + t \\approx 63.2 + t"}</M> with probability at least{" "}
          <M>{"1 - e^{-t^2/2}"}</M>: far nearer the evenly spread extreme than the concentrated one, and accurate to within a
          few units, not in a limit but at this size. For a tall matrix the smallest singular value is near{" "}
          <M>{"\\sqrt n - \\sqrt d"}</M> too, so the condition number is about{" "}
          <M>{"(1 + \\sqrt{d/n})/(1 - \\sqrt{d/n})"}</M>, which <C>condition_bound</C> computes: random tall matrices are well
          conditioned, which is why random sketches and random features work.
        </p>
      </Remark>

      <Theorem title="matrix Bernstein inequality">
        <p>
          Let <M>{"X_1, \\dots, X_m"}</M> be independent symmetric d × d random matrices with <M>{"\\mathbb{E}X_k = 0"}</M> and{" "}
          <M>{"\\|X_k\\| \\le L"}</M>, and let <M>{"\\sigma^2 = \\|\\sum_k\\mathbb{E}X_k^2\\|"}</M>. Then
        </p>
        <MD>{"P\\Bigl(\\Bigl\\|\\sum_k X_k\\Bigr\\| \\ge t\\Bigr) \\le 2d\\exp\\Bigl(-\\frac{t^2/2}{\\sigma^2 + Lt/3}\\Bigr)."}</MD>
      </Theorem>
      <Remark title="using it">
        <p>
          This is Bernstein&apos;s inequality of m15.1.2 with two changes: the variance is a matrix, measured in operator norm,
          and there is a factor d in front, the price of controlling all directions at once (the proof, due to Tropp, uses the
          matrix exponential and Lieb&apos;s concavity theorem). It needs no Gaussianity or independence of entries, only
          independence of the summands, so it handles sums of random rank-one matrices, random sparsifications of a matrix,
          and Laplacians of random graphs. <C>bernstein_t</C> solves the quadratic in t for the deviation exceeded with
          probability δ.
        </p>
        <Code>{BERN}</Code>
      </Remark>

      <Example title="covariance estimation revisited">
        <p>
          Take <M>{"X_k = (x_kx_k^\\top - I)/n"}</M> for samples with <M>{"\\|x_k\\|^2 \\le K d"}</M>. Then <M>{"L \\approx Kd/n"}</M>{" "}
          and <M>{"\\sigma^2 \\approx Kd/n"}</M>, and matrix Bernstein gives{" "}
          <M>{"\\|\\hat\\Sigma - I\\| \\lesssim \\sqrt{Kd\\log d/n} + Kd\\log d/n"}</M>: the d/n of m15.3.1, up to a factor log d, now
          for any bounded distribution, not only sub-Gaussian ones.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cond",
      rung: "check",
      prompt: <p>What condition number does √n ± √d predict for a 500 × 200 Gaussian matrix? Give four decimals.</p>,
      answer: { kind: "numeric", value: 4.4415, tolerance: 0.00006 },
    },
    {
      key: "tail",
      rung: "check",
      prompt: <p>Bound the probability that a Gaussian matrix&apos;s norm exceeds √n + √d + 3. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0111, tolerance: 0.00006 },
    },
    {
      key: "lip",
      rung: "apply",
      prompt: <p>Why does the operator norm of a Gaussian matrix fluctuate by only O(1), whatever its size?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is a 1-Lipschitz function of the entries, and Lipschitz functions of Gaussian vectors concentrate with dimension-free tails",
          "It is a sum of many independent terms, each of size 1/n",
          "Its expectation is exactly √n + √d",
          "The largest singular value is always within 1 of the Frobenius norm",
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

def gaussian_matrix(n, d, rng):
    return [[rng.gauss(0, 1) for _ in range(d)] for _ in range(n)]

def spec_norm(A, iters=300):
    d = len(A[0])
    v = [1.0 / (j + 1) for j in range(d)]
    s = 0.0
    for _ in range(iters):
        u = [sum(a * x for a, x in zip(row, v)) for row in A]
        w = [sum(A[i][j] * u[i] for i in range(len(A))) for j in range(d)]
        s = math.sqrt(sum(x * x for x in w))
        if s == 0:
            return 0.0
        v = [x / s for x in w]
    return math.sqrt(s)

def gordon_bound(n, d, delta):
    return math.sqrt(n) + math.sqrt(d) + math.sqrt(2 * math.log(1 / delta))

print(round(spec_norm([[3, 0], [0, -4], [0, 0]]), 4), round(spec_norm([[1, 1], [1, 1]]), 4), spec_norm([[0, 0]]))
print(round(gordon_bound(100, 25, math.exp(-2)), 4), round(gordon_bound(400, 100, 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4.0 2.0 0.0\n17.0 30.0", "5.0 2.0 0.0\n17.0 30.0", "4.0 1.4142 0.0\n17.0 30.0", "4.0 2.0 0.0\n15.0 30.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def condition_bound(n, d):
    return (math.sqrt(n) + math.sqrt(d)) / (math.sqrt(n) - math.sqrt(d))

def matrix_bernstein(t, d, sigma2, L):
    return min(1.0, 2 * d * math.exp(-t * t / 2 / (sigma2 + L * t / 3)))

def bernstein_t(delta, d, sigma2, L):
    c = math.log(2 * d / delta)
    return L * c / 3 + math.sqrt((L * c / 3) ** 2 + 2 * sigma2 * c)

print(condition_bound(9, 1), condition_bound(400, 100), round(matrix_bernstein(10, 5, 8, 1), 4), matrix_bernstein(1, 5, 8, 1))
print(round(bernstein_t(0.1, 5, 8, 0), 4), round(matrix_bernstein(bernstein_t(0.05, 20, 3, 2), 20, 3, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 3.0 0.1213 1.0\n8.5839 0.05",
          "2.0 3.0 0.1213 1.0\n8.5839 0.1",
          "4.0 3.0 0.1213 1.0\n8.5839 0.05",
          "2.0 3.0 0.0121 1.0\n8.5839 0.05",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_matrix(n, d, rng)</C>, drawing entries row by row with <C>rng.gauss(0, 1)</C>;{" "}
          <C>spec_norm(A, iters=300)</C>, power iteration on <M>{"A^\\top A"}</M> from the vector with entries 1/(j + 1),
          returning the square root of the length of the last <M>{"A^\\top Av"}</M> (0.0 if it vanishes); and{" "}
          <C>gordon_bound(n, d, delta)</C>, the level <M>{"\\sqrt n + \\sqrt d + t"}</M> with <M>{"e^{-t^2/2} = \\delta"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_matrix(n, d, rng):
    return []

def spec_norm(A, iters=300):
    return 0.0

def gordon_bound(n, d, delta):
    return 0.0
`,
        solution: NORM,
        tests: [
          { name: "norm", code: `import math
assert abs(spec_norm([[3, 0], [0, -4], [0, 0]]) - 4) < 1e-9 and abs(spec_norm([[1, 1], [1, 1]]) - 2) < 1e-9 and spec_norm([[0, 0]]) == 0.0
u, v = [1, 2, 2], [3, 4]; assert abs(spec_norm([[a * b for b in v] for a in u]) - 15) < 1e-9 and abs(spec_norm([[2, 1], [1, 2]]) - 3) < 1e-9` },
          { name: "gauss", code: `import math, random
r = random.Random(5); A = gaussian_matrix(3, 2, r); r2 = random.Random(5); assert A == [[r2.gauss(0, 1) for _ in range(2)] for _ in range(3)]
assert abs(gordon_bound(100, 25, math.exp(-2)) - 17) < 1e-12 and gordon_bound(400, 100, 1) == 30
B = gaussian_matrix(60, 20, random.Random(1)); s = spec_norm(B); assert math.sqrt(60) < s < gordon_bound(60, 20, 0.001)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>condition_bound(n, d)</C>, <M>{"(\\sqrt n + \\sqrt d)/(\\sqrt n - \\sqrt d)"}</M>;{" "}
          <C>matrix_bernstein(t, d, sigma2, L)</C>, the bound capped at 1; and <C>bernstein_t(delta, d, sigma2, L)</C>, the
          positive t at which the uncapped bound equals delta.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def condition_bound(n, d):
    return 1.0

def matrix_bernstein(t, d, sigma2, L):
    return 1.0

def bernstein_t(delta, d, sigma2, L):
    return 0.0
`,
        solution: BERN,
        tests: [
          { name: "bounds", code: `import math
assert condition_bound(9, 1) == 2.0 and condition_bound(400, 100) == 3.0 and abs(condition_bound(500, 200) - 4.441518440112253) < 1e-12
assert abs(matrix_bernstein(10, 5, 8, 1) - 10 * math.exp(-50 / (8 + 10 / 3))) < 1e-15 and matrix_bernstein(1, 5, 8, 1) == 1.0 and abs(matrix_bernstein(6, 1, 2, 0) - 2 * math.exp(-9)) < 1e-15` },
          { name: "solve", code: `import math
assert abs(bernstein_t(0.1, 5, 8, 0) - math.sqrt(16 * math.log(100))) < 1e-12
for args in [(0.05, 20, 3, 2), (0.01, 100, 50, 1), (1e-6, 3, 0.5, 4)]:
    t = bernstein_t(*args); delta, d, s2, L = args
    assert abs(2 * d * math.exp(-t * t / 2 / (s2 + L * t / 3)) - delta) < 1e-9 * max(delta, 1e-3)` },
        ],
      },
    },
    {
      key: "dev",
      rung: "stretch",
      prompt: (
        <p>
          A sum of independent mean-zero symmetric 100 × 100 matrices has <M>{"\\sigma^2 = 50"}</M> and summands of norm at most
          1. Above what t does matrix Bernstein bound the probability of <M>{"\\|\\sum_k X_k\\| \\ge t"}</M> by 0.01? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 34.9436, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Behind every bound in this chapter is a supremum over infinitely many directions. The next part makes the tools for
        such suprema explicit, starting with the simplest: replace the infinite set by a finite net and take a union bound.
      </p>
    </>
  ),
};
