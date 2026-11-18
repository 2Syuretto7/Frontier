import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InnerProductJlViz } from "@/components/viz/InnerProductJlViz";
import type { LessonContent } from "@/lib/types";

const JL = `import math

def embed(S, x):
    return [sum(s * v for s, v in zip(row, x)) for row in S]

def distortion(X, Y):
    worst = 0.0
    for i in range(len(X)):
        for j in range(i + 1, len(X)):
            before = sum((a - b) ** 2 for a, b in zip(X[i], X[j]))
            after = sum((a - b) ** 2 for a, b in zip(Y[i], Y[j]))
            worst = max(worst, abs(after / before - 1))
    return worst

def jl_k(n, eps, delta):
    return math.ceil(8 * math.log(n * (n - 1) / delta) / (eps * eps))`;

const INNER = `import math

def sign_matrix(k, d, rng):
    return [[rng.choice((-1, 1)) / math.sqrt(k) for _ in range(d)] for _ in range(k)]

def inner_error(S, x, y):
    sx = [sum(s * v for s, v in zip(row, x)) for row in S]
    sy = [sum(s * v for s, v in zip(row, y)) for row in S]
    return abs(sum(a * b for a, b in zip(sx, sy)) - sum(a * b for a, b in zip(x, y)))

def polar_bound(x, y, eps):
    return eps * (sum(a * a for a in x) + sum(b * b for b in y)) / 2`;

export const lesson: LessonContent = {
  id: "m15.2.4",
  minutes: 55,
  links: {
    requires: ["m15.2.2", "m11.6.1"],
    revisits: ["m15.1.1"],
    foreshadows: ["m15.4.3"],
  },

  puzzle: (
    <>
      <p>
        Lesson m11.6.1 showed that a random Gaussian matrix maps n points to about <M>{"\\log n/\\varepsilon^2"}</M>{" "}
        dimensions while keeping every distance within a factor 1 ± ε. The proof there computed the chi-square moment
        generating function by hand. Which parts of that argument were essential? Does it work for random signs, which are
        cheaper to store? Does it keep angles as well as lengths? And could a cleverer, non-random map do better?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each coordinate of Sx is an independent sub-Gaussian measurement of x along a random direction, with variance{" "}
        <M>{"\\|x\\|^2/k"}</M>. The squared length of Sx is an average of k independent sub-exponential terms, so it
        concentrates around <M>{"\\|x\\|^2"}</M> with exponentially small tails, and a union bound over the{" "}
        <M>{"\\binom n2"}</M> difference vectors costs only a factor log n in k. Inner products are differences of squared
        lengths, so they come along for free.
      </p>
      <InnerProductJlViz />
    </>
  ),

  theory: (
    <>
      <Definition title="random projection">
        <p>
          A Gaussian projection is a matrix <M>{"S \\in \\mathbb{R}^{k \\times d}"}</M> with independent{" "}
          <M>{"N(0, 1/k)"}</M> entries; a sign projection has independent entries <M>{"\\pm 1/\\sqrt k"}</M>. Either way{" "}
          <M>{"\\mathbb{E}\\|Sx\\|^2 = \\|x\\|^2"}</M>. The <em>distortion</em> of a map on a point set is the largest{" "}
          <M>{"|\\|y_i - y_j\\|^2/\\|x_i - x_j\\|^2 - 1|"}</M> over pairs.
        </p>
        <Code>{JL}</Code>
      </Definition>

      <Theorem title="distributional Johnson–Lindenstrauss">
        <p>For a Gaussian projection S, any fixed nonzero x and <M>{"0 < \\varepsilon \\le 1"}</M>,</p>
        <MD>{"P\\Bigl(\\Bigl|\\frac{\\|Sx\\|^2}{\\|x\\|^2} - 1\\Bigr| \\ge \\varepsilon\\Bigr) \\le 2e^{-k\\varepsilon^2/8}."}</MD>
      </Theorem>
      <Proof>
        <p>
          As in m11.6.1, <M>{"k\\|Sx\\|^2/\\|x\\|^2 = \\sum_{i=1}^k Z_i^2"}</M> with <M>{"Z_i"}</M> independent standard Gaussian.
          By m15.1.1, <M>{"\\sum_i(Z_i^2 - 1)"}</M> is sub-exponential with <M>{"\\nu^2 = 4k"}</M> and b = 4. The event is a
          deviation of size s = kε, and <M>{"s \\le \\nu^2/b = k"}</M> because <M>{"\\varepsilon \\le 1"}</M>, so the Gaussian
          regime of the sub-exponential tail applies on each side:{" "}
          <M>{"2e^{-s^2/(2\\nu^2)} = 2e^{-k^2\\varepsilon^2/(8k)}"}</M>.
        </p>
      </Proof>

      <Theorem title="Johnson–Lindenstrauss lemma">
        <p>
          Let <M>{"x_1, \\dots, x_n \\in \\mathbb{R}^d"}</M>, <M>{"0 < \\varepsilon \\le 1"}</M> and <M>{"0 < \\delta < 1"}</M>. If{" "}
          <M>{"k \\ge 8\\log(n(n-1)/\\delta)/\\varepsilon^2"}</M>, a Gaussian projection has distortion less than ε on these
          points with probability at least <M>{"1 - \\delta"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By linearity, <M>{"Sx_i - Sx_j = S(x_i - x_j)"}</M>, so each pair is one fixed vector. Each of the{" "}
          <M>{"n(n-1)/2"}</M> pairs fails with probability at most <M>{"2e^{-k\\varepsilon^2/8} \\le 2\\delta/(n(n-1))"}</M>, and the
          union bound adds these to at most δ. <C>jl_k</C> computes the k; the price of asking for failure probability δ
          rather than the 1 − 1/n of m11.6.1 is only an additive log(1/δ).
        </p>
      </Proof>

      <Remark title="what the proof used">
        <p>
          Only that the coordinates of Sx are independent, mean zero, with variance <M>{"\\|x\\|^2/k"}</M> and sub-Gaussian
          tails, so that their squares are sub-exponential. For a sign projection, Hoeffding&apos;s lemma makes{" "}
          <M>{"\\sqrt k(Sx)_i = \\sum_j \\pm x_j"}</M> sub-Gaussian with variance proxy <M>{"\\|x\\|^2"}</M>, and the same
          argument goes through with a larger constant in place of 8. Any matrix with independent sub-Gaussian entries works.
        </p>
      </Remark>

      <Theorem title="inner products are preserved">
        <p>
          If S has distortion at most ε on the vectors x + y and x − y, then{" "}
          <M>{"|\\langle Sx, Sy\\rangle - \\langle x, y\\rangle| \\le \\tfrac\\varepsilon2(\\|x\\|^2 + \\|y\\|^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the polarisation identity,{" "}
          <M>{"\\langle Sx, Sy\\rangle = \\tfrac14(\\|S(x + y)\\|^2 - \\|S(x - y)\\|^2)"}</M>, and the same identity holds
          without S. Each squared norm is off by at most ε times its true value, so the error is at most{" "}
          <M>{"\\tfrac\\varepsilon4(\\|x + y\\|^2 + \\|x - y\\|^2) = \\tfrac\\varepsilon2(\\|x\\|^2 + \\|y\\|^2)"}</M> by the
          parallelogram law. Applying JL to the points together with all their sums and differences preserves every inner
          product among n unit vectors to within ε, at the cost of a constant factor in log n.
        </p>
        <Code>{INNER}</Code>
      </Proof>

      <Example title="how many dimensions">
        <p>
          With ε = 0.2 and δ = 0.05, a hundred points need 2440 dimensions and a million need 6126; the original dimension never
          appears. The constant 8 is not tight (m11.6.1 found about half as many suffice), but the shape{" "}
          <M>{"\\log n/\\varepsilon^2"}</M> is: Larsen and Nelson proved in 2017 that some sets of n points need{" "}
          <M>{"\\Omega(\\log n/\\varepsilon^2)"}</M> dimensions for distortion ε under any map at all, linear or not. Their
          hard example is close to the one in m15.2.2: many nearly orthogonal vectors cannot all fit in too few dimensions.
        </p>
      </Example>

      <Remark title="infinite sets">
        <p>
          The union bound needs a finite set. For an infinite set T, such as all sparse vectors or a low-dimensional subspace,
          the right measure of size is not log |T| but the Gaussian width of T (m15.4.3): Gordon&apos;s theorem replaces{" "}
          <M>{"\\log n"}</M> by the squared width. For a subspace of dimension r the width is about √r, so k of order{" "}
          <M>{"r/\\varepsilon^2"}</M> suffices, which is what makes sketching least squares work.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tail",
      rung: "check",
      prompt: <p>Bound the probability that a Gaussian projection to 200 dimensions changes the squared length of a fixed vector by a factor outside [0.5, 1.5]. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0039, tolerance: 0.00006 },
    },
    {
      key: "k",
      rung: "check",
      prompt: <p>What target dimension does the lemma require for 100 points with ε = 0.2 and δ = 0.05?</p>,
      answer: { kind: "numeric", value: 2440, tolerance: 0.5 },
    },
    {
      key: "nod",
      rung: "apply",
      prompt: <p>Why does the original dimension d not appear in the required k?</p>,
      answer: {
        kind: "choice",
        options: [
          "For a fixed vector, the law of k‖Sx‖²/‖x‖² is chi-square with k degrees of freedom whatever d is, and only the n(n−1)/2 difference vectors matter",
          "Because the points always lie in a subspace of dimension k",
          "Because d is assumed to be smaller than k",
          "Because the projection discards all but k of the original coordinates",
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

def embed(S, x):
    return [sum(s * v for s, v in zip(row, x)) for row in S]

def distortion(X, Y):
    worst = 0.0
    for i in range(len(X)):
        for j in range(i + 1, len(X)):
            before = sum((a - b) ** 2 for a, b in zip(X[i], X[j]))
            after = sum((a - b) ** 2 for a, b in zip(Y[i], Y[j]))
            worst = max(worst, abs(after / before - 1))
    return worst

def jl_k(n, eps, delta):
    return math.ceil(8 * math.log(n * (n - 1) / delta) / (eps * eps))

S = [[1, 0, 1], [0, 2, 0]]; print(embed(S, [1, 2, 3]), embed(S, [0, 0, 1]), jl_k(2, 1, 0.5), jl_k(1000, 0.1, 0.01))
print(distortion([[0, 0], [1, 0], [0, 2]], [[0], [1], [1]]), distortion([[0, 0], [3, 4]], [[0], [5]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 4] [1, 0] 12 14736\n1.0 0.0",
          "[4, 4] [1, 0] 12 14736\n0.75 0.0",
          "[4, 4] [0, 1] 12 14736\n1.0 0.0",
          "[4, 4] [1, 0] 6 14736\n1.0 0.0",
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

def sign_matrix(k, d, rng):
    return [[rng.choice((-1, 1)) / math.sqrt(k) for _ in range(d)] for _ in range(k)]

def inner_error(S, x, y):
    sx = [sum(s * v for s, v in zip(row, x)) for row in S]
    sy = [sum(s * v for s, v in zip(row, y)) for row in S]
    return abs(sum(a * b for a, b in zip(sx, sy)) - sum(a * b for a, b in zip(x, y)))

def polar_bound(x, y, eps):
    return eps * (sum(a * a for a in x) + sum(b * b for b in y)) / 2

H = [[1, 1], [1, -1]]; print(inner_error([[r / 2 ** 0.5 for r in row] for row in H], [1, 2], [3, -1]), polar_bound([1, 2], [3, -1], 0.1))
import random; T = sign_matrix(4, 3, random.Random(0)); print(len(T), len(T[0]), {abs(v) for row in T for v in row}, inner_error([[1, 0, 0]], [0, 1, 0], [0, 0, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.75\n4 3 {0.5} 0",
          "0.0 0.75\n3 4 {0.5} 0",
          "1.0 0.75\n4 3 {0.5} 0",
          "0.0 0.75\n4 3 {0.5, 1} 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>embed(S, x)</C>, the product of a matrix given as a list of rows with a vector; <C>distortion(X, Y)</C>, the
          largest <M>{"|\\|y_i - y_j\\|^2/\\|x_i - x_j\\|^2 - 1|"}</M> over pairs i &lt; j of distinct original points; and{" "}
          <C>jl_k(n, eps, delta)</C>, the smallest whole <M>{"k \\ge 8\\log(n(n-1)/\\delta)/\\varepsilon^2"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def embed(S, x):
    return []

def distortion(X, Y):
    return 1.0

def jl_k(n, eps, delta):
    return 0
`,
        solution: JL,
        tests: [
          { name: "embed", code: `assert embed([[1, 0, 1], [0, 2, 0]], [1, 2, 3]) == [4, 4] and embed([], [1, 2]) == [] and embed([[2, -1]], [3, 5]) == [1]
assert distortion([[0, 0], [1, 0], [0, 2]], [[0], [1], [1]]) == 1.0 and distortion([[0, 0], [3, 4]], [[0], [5]]) == 0.0
assert abs(distortion([[0], [1], [3]], [[0], [2], [3]]) - 3) < 1e-12 and distortion([[1, 1]], [[0]]) == 0.0` },
          { name: "jl", code: `import math, random
assert jl_k(100, 0.2, 0.05) == 2440 and jl_k(2, 1, 0.5) == 12 and jl_k(1000, 0.1, 0.01) == 14736
r = random.Random(0); X = [[r.gauss(0, 1) for _ in range(300)] for _ in range(12)]
k = jl_k(12, 0.5, 0.01); S = [[r.gauss(0, 1) / math.sqrt(k) for _ in range(300)] for _ in range(k)]
assert distortion(X, [embed(S, x) for x in X]) < 0.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sign_matrix(k, d, rng)</C>, k rows of d entries each <C>rng.choice((-1, 1)) / math.sqrt(k)</C> drawn in
          order; <C>inner_error(S, x, y)</C>, the absolute change <M>{"|\\langle Sx, Sy\\rangle - \\langle x, y\\rangle|"}</M>; and{" "}
          <C>polar_bound(x, y, eps)</C>, the bound <M>{"\\tfrac\\varepsilon2(\\|x\\|^2 + \\|y\\|^2)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sign_matrix(k, d, rng):
    return []

def inner_error(S, x, y):
    return 0.0

def polar_bound(x, y, eps):
    return 0.0
`,
        solution: INNER,
        tests: [
          { name: "signs", code: `import math, random
r = random.Random(2); T = sign_matrix(3, 5, r)
r2 = random.Random(2); assert T == [[r2.choice((-1, 1)) / math.sqrt(3) for _ in range(5)] for _ in range(3)]
assert sign_matrix(0, 4, r) == [] and len(sign_matrix(2, 7, r)[1]) == 7` },
          { name: "inner", code: `import math, random
assert inner_error([[1, 0, 0]], [0, 1, 0], [0, 0, 1]) == 0 and inner_error([[1, 1]], [1, 0], [0, 1]) == 1 and inner_error([[2, 0], [0, 1]], [1, 1], [1, 0]) == 3
assert abs(polar_bound([1, 2], [3, -1], 0.1) - 0.75) < 1e-15 and polar_bound([0], [0], 0.5) == 0
r = random.Random(9); x = [r.gauss(0, 1) for _ in range(200)]; y = [r.gauss(0, 1) for _ in range(200)]
S = sign_matrix(2000, 200, r); assert inner_error(S, x, y) < polar_bound(x, y, 0.25)` },
        ],
      },
    },
    {
      key: "million",
      rung: "stretch",
      prompt: (
        <p>
          What target dimension does the lemma require for a million points with ε = 0.1 and δ = 0.01?
        </p>
      ),
      answer: { kind: "numeric", value: 25789, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the random objects have been vectors. The next part of the course studies random matrices as a whole,
        starting with the most basic question in statistics: how many samples does it take to estimate a covariance matrix
        in high dimension?
      </p>
    </>
  ),
};
