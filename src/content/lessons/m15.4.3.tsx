import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SparseWidthViz } from "@/components/viz/SparseWidthViz";
import type { LessonContent } from "@/lib/types";

const WIDTH = `import math

def width_mc(T, trials, rng):
    d, total = len(T[0]), 0.0
    for _ in range(trials):
        g = [rng.gauss(0, 1) for _ in range(d)]
        total += max(sum(a * b for a, b in zip(g, t)) for t in T)
    return total / trials

def sparse_width(s, d, trials, rng):
    total = 0.0
    for _ in range(trials):
        sq = sorted((rng.gauss(0, 1) ** 2 for _ in range(d)), reverse=True)
        total += math.sqrt(sum(sq[:s]))
    return total / trials

def finite_bound(T):
    return max(math.sqrt(sum(x * x for x in t)) for t in T) * math.sqrt(2 * math.log(len(T)))`;

const GORDON = `import math

def chi_mean(m):
    return math.sqrt(2) * math.exp(math.lgamma((m + 1) / 2) - math.lgamma(m / 2))

def gordon_m(w):
    m = 1
    while chi_mean(m) <= w:
        m += 1
    return m

def min_gain(A, T):
    return min(math.sqrt(sum(sum(a * x for a, x in zip(row, t)) ** 2 for row in A)) for t in T)`;

export const lesson: LessonContent = {
  id: "m15.4.3",
  minutes: 55,
  links: {
    requires: ["m15.4.2"],
    revisits: ["m15.3.4", "m15.2.4"],
    foreshadows: ["m15.5.1"],
  },

  puzzle: (
    <>
      <p>
        A random 100 × 1000 Gaussian matrix A has a null space of dimension at least 900, so most unit vectors are
        crushed by it to almost nothing or to exactly zero. Yet with high probability no unit vector with at most 5 nonzero
        coordinates is in that null space, or even close to it. There are infinitely many such vectors, in{" "}
        <M>{"\\binom{1000}{5} \\approx 8 \\times 10^{12}"}</M> different coordinate subspaces. What single number tells you how many
        rows A needs to keep a given set of vectors out of its null space?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pick a random direction g and see how far the set T reaches along it. Averaged over g, that reach is the Gaussian
        width: a measure of size that, unlike dimension, distinguishes a sphere from a sparse set or a finite cloud of
        points. A random m-row matrix sees about √m of every unit vector, and loses at most the width of T to the worst one.
        So m a little above <M>{"w(T)^2"}</M> rows suffice, whatever the ambient dimension.
      </p>
      <SparseWidthViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Gaussian width">
        <p>
          For a bounded set <M>{"T \\subset \\mathbb{R}^d"}</M> and g standard Gaussian in <M>{"\\mathbb{R}^d"}</M>, the{" "}
          <em>Gaussian width</em> is <M>{"w(T) = \\mathbb{E}\\sup_{t \\in T}\\langle g, t\\rangle"}</M>, the expected supremum of the
          Gaussian process <M>{"X_t = \\langle g, t\\rangle"}</M>, whose increments have{" "}
          <M>{"d(s, t) = \\|s - t\\|"}</M>. It is unchanged by rotations and by taking the convex hull, and{" "}
          <M>{"w(T)^2"}</M> behaves like an effective dimension. <C>width_mc</C> estimates it for a finite set by simulation.
        </p>
        <Code>{WIDTH}</Code>
      </Definition>

      <Theorem title="widths of standard sets">
        <p>In <M>{"\\mathbb{R}^d"}</M>:</p>
        <ul>
          <li>
            the unit sphere and the unit ball have width <M>{"\\mathbb{E}\\|g\\| \\approx \\sqrt{d - 1/2}"}</M>, and the unit
            sphere of an r-dimensional subspace has width about √r;
          </li>
          <li>N points of norm at most r have width at most <M>{"r\\sqrt{2\\log N}"}</M>;</li>
          <li>the <M>{"\\ell_1"}</M> unit ball has width <M>{"\\mathbb{E}\\max_i|g_i| \\le \\sqrt{2\\log(2d)}"}</M>;</li>
          <li>
            the set <M>{"S_s"}</M> of s-sparse unit vectors has width{" "}
            <M>{"\\mathbb{E}\\bigl(\\sum_{i \\le s}g_{(i)}^2\\bigr)^{1/2} \\le \\sqrt s + \\sqrt{2s\\log(ed/s)}"}</M>, where{" "}
            <M>{"g_{(1)}^2 \\ge g_{(2)}^2 \\ge \\dots"}</M> are the sorted squares.
          </li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          The supremum over the sphere is <M>{"\\|g\\|"}</M> (m15.2.1); over a subspace it is the norm of the projection of g, a
          Gaussian vector in r dimensions. For N points, each <M>{"\\langle g, t\\rangle"}</M> is Gaussian with variance at most{" "}
          <M>{"r^2"}</M>, and the maximum bound of m15.4.2 applies (<C>finite_bound</C>). A linear function on the{" "}
          <M>{"\\ell_1"}</M> ball is largest at one of the 2d vertices <M>{"\\pm e_i"}</M>, giving <M>{"\\max_i|g_i|"}</M> and the
          finite bound with N = 2d. For <M>{"S_s"}</M>, the supremum over unit vectors supported on a set I of s coordinates is{" "}
          <M>{"\\|g_I\\|"}</M>, largest for the s largest <M>{"|g_i|"}</M> (<C>sparse_width</C>). Each{" "}
          <M>{"\\|g_I\\|"}</M> has mean at most √s and, being 1-Lipschitz in g, is sub-Gaussian about its mean with variance
          proxy 1 (the Gaussian concentration of m15.3.4). There are <M>{"\\binom ds \\le (ed/s)^s"}</M> sets I, and the
          maximum bound gives the rest.
        </p>
      </Proof>

      <Theorem title="Gordon’s escape through the mesh">
        <p>
          Let <M>{"T \\subset S^{d-1}"}</M>, let A be an m × d standard Gaussian matrix, and let{" "}
          <M>{"a_m = \\mathbb{E}\\|h\\| \\approx \\sqrt m"}</M> for h standard Gaussian in <M>{"\\mathbb{R}^m"}</M>. Then for{" "}
          <M>{"u \\ge 0"}</M>, with probability at least <M>{"1 - e^{-u^2/2}"}</M>,
        </p>
        <MD>{"\\min_{t \\in T}\\|At\\| \\ge a_m - w(T) - u."}</MD>
        <p>In particular, if <M>{"a_m > w(T)"}</M>, the null space of A misses T with probability at least <M>{"1 - e^{-(a_m - w(T))^2/2}"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          (Sketch.) Write <M>{"\\min_t\\|At\\| = \\min_{t \\in T}\\max_{\\|v\\| = 1}\\langle At, v\\rangle"}</M> and compare, as in
          m15.3.4, with <M>{"Y_{t,v} = \\langle h, v\\rangle + \\langle g, t\\rangle"}</M>; Gordon&apos;s min-max version of the
          comparison inequality gives{" "}
          <M>{"\\mathbb{E}\\min_t\\max_v X \\ge \\mathbb{E}\\min_t\\max_v Y = \\mathbb{E}\\|h\\| - \\mathbb{E}\\max_t\\langle -g, t\\rangle = a_m - w(T)"}</M>.
          The minimum is a 1-Lipschitz function of A, so Gaussian concentration adds the tail.
        </p>
      </Proof>

      <Example title="answering the puzzle">
        <p>
          For 5-sparse unit vectors in 1000 dimensions, simulation gives <M>{"w(S_5)^2 \\approx 48"}</M>, and{" "}
          <M>{"a_{100} \\approx 9.97"}</M>. Since <M>{"\\sqrt{48} \\approx 6.9"}</M>, every 5-sparse unit vector keeps{" "}
          <M>{"\\|At\\| \\ge 3.0 - u"}</M>, so a gap of about 3 is guaranteed with probability <M>{"1 - e^{-u^2/2}"}</M> for small u. The
          number of rows that matters is the squared width of the set, not the dimension of the space. <C>gordon_m</C> finds
          the smallest m with <M>{"a_m > w"}</M>, and <C>min_gain</C> checks a finite set directly.
        </p>
        <Code>{GORDON}</Code>
      </Example>

      <Remark title="random projections of infinite sets">
        <p>
          The same comparison bounds <M>{"\\max_{t \\in T}\\|At\\|"}</M> by <M>{"a_m + w(T)"}</M>, so for{" "}
          <M>{"T \\subset S^{d-1}"}</M>, <M>{"\\|At\\|/a_m"}</M> lies within <M>{"(w(T) + u)/a_m"}</M> of 1 for every t at once. This is
          the Johnson-Lindenstrauss lemma (m15.2.4) for infinite sets: <M>{"\\log n"}</M> for n points is replaced by{" "}
          <M>{"w(T)^2"}</M>, and m of order <M>{"w(T)^2/\\varepsilon^2"}</M> rows give distortion ε. For n points,{" "}
          <M>{"w(T)^2 \\le 2\\log n"}</M>, recovering the original lemma.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "finite",
      rung: "check",
      prompt: <p>Bound the Gaussian width of a set of a million unit vectors. Give four decimals.</p>,
      answer: { kind: "numeric", value: 5.2565, tolerance: 0.00006 },
    },
    {
      key: "m",
      rung: "check",
      prompt: <p>What is the smallest m with <M>{"a_m = \\mathbb{E}\\|h\\| > 20"}</M> for h standard Gaussian in <M>{"\\mathbb{R}^m"}</M>?</p>,
      answer: { kind: "numeric", value: 401, tolerance: 0.5 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can 100 random measurements keep every 5-sparse vector in 1000 dimensions out of the null space, when the null space has dimension 900?</p>,
      answer: {
        kind: "choice",
        options: [
          "The squared Gaussian width of the 5-sparse unit vectors, about 48, is below the 100 rows, though their span is the whole space",
          "The null space of a Gaussian matrix contains no vectors with zero entries",
          "Sparse vectors are orthogonal to the null space",
          "There are only finitely many sparse vectors",
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

def width_mc(T, trials, rng):
    d, total = len(T[0]), 0.0
    for _ in range(trials):
        g = [rng.gauss(0, 1) for _ in range(d)]
        total += max(sum(a * b for a, b in zip(g, t)) for t in T)
    return total / trials

def sparse_width(s, d, trials, rng):
    total = 0.0
    for _ in range(trials):
        sq = sorted((rng.gauss(0, 1) ** 2 for _ in range(d)), reverse=True)
        total += math.sqrt(sum(sq[:s]))
    return total / trials

def finite_bound(T):
    return max(math.sqrt(sum(x * x for x in t)) for t in T) * math.sqrt(2 * math.log(len(T)))

import random; E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; print(round(finite_bound(E), 4), finite_bound([[3, 4]]), round(width_mc([[1, 0], [-1, 0]], 2000, random.Random(0)), 1))
print(round(sparse_width(4, 4, 3000, random.Random(1)), 1), round(sparse_width(1, 1, 3000, random.Random(1)), 1), sparse_width(1, 50, 500, random.Random(5)) > sparse_width(1, 5, 500, random.Random(5)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.4823 0.0 0.8\n1.9 0.8 True",
          "1.4823 5.0 0.8\n1.9 0.8 True",
          "1.4823 0.0 0.0\n1.9 0.8 True",
          "1.4823 0.0 0.8\n2.0 0.8 False",
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

def chi_mean(m):
    return math.sqrt(2) * math.exp(math.lgamma((m + 1) / 2) - math.lgamma(m / 2))

def gordon_m(w):
    m = 1
    while chi_mean(m) <= w:
        m += 1
    return m

def min_gain(A, T):
    return min(math.sqrt(sum(sum(a * x for a, x in zip(row, t)) ** 2 for row in A)) for t in T)

print(round(chi_mean(1), 4), round(chi_mean(2), 4), gordon_m(3), gordon_m(10))
print(min_gain([[1, 0], [0, 2]], [[1, 0], [0, 1], [0.6, 0.8]]), min_gain([[1, 1]], [[1, -1], [1, 1]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.7979 1.2533 10 101\n1.0 0.0", "0.7979 1.2533 9 100\n1.0 0.0", "1.0 1.4142 10 101\n1.0 0.0", "0.7979 1.2533 10 101\n1.0 1.4142"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>width_mc(T, trials, rng)</C>, averaging <M>{"\\max_{t \\in T}\\langle g, t\\rangle"}</M> over trials, each g drawn
          coordinate by coordinate with <C>rng.gauss(0, 1)</C>; <C>sparse_width(s, d, trials, rng)</C>, averaging the square
          root of the sum of the s largest of d squared draws; and <C>finite_bound(T)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def width_mc(T, trials, rng):
    return 0.0

def sparse_width(s, d, trials, rng):
    return 0.0

def finite_bound(T):
    return 0.0
`,
        solution: WIDTH,
        tests: [
          { name: "mc", code: `import math, random
r = random.Random(3); gs = [[r.gauss(0, 1) for _ in range(2)] for _ in range(5)]
T = [[1, 0], [0, 2], [-1, -1]]; want = sum(max(g[0] * t[0] + g[1] * t[1] for t in T) for g in gs) / 5
assert abs(width_mc(T, 5, random.Random(3)) - want) < 1e-12
r = random.Random(4); sq = sorted((r.gauss(0, 1) ** 2 for _ in range(6)), reverse=True)
assert abs(sparse_width(2, 6, 1, random.Random(4)) - math.sqrt(sq[0] + sq[1])) < 1e-12` },
          { name: "bound", code: `import math, random
assert abs(finite_bound([[1, 0, 0], [0, 1, 0], [0, 0, 1]]) - math.sqrt(2 * math.log(3))) < 1e-12 and finite_bound([[3, 4]]) == 0
assert abs(finite_bound([[3, 4], [1, 0]]) - 5 * math.sqrt(2 * math.log(2))) < 1e-12
E = [[float(i == j) for j in range(8)] for i in range(8)]; assert width_mc(E, 3000, random.Random(1)) < finite_bound(E)
assert abs(sparse_width(1, 1, 4000, random.Random(2)) - math.sqrt(2 / math.pi)) < 0.03` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chi_mean(m)</C>, the mean <M>{"a_m"}</M> of the norm of a standard Gaussian vector in m dimensions, using{" "}
          <C>math.lgamma</C>; <C>gordon_m(w)</C>, the smallest m ≥ 1 with <M>{"a_m > w"}</M>; and <C>min_gain(A, T)</C>, the least{" "}
          <M>{"\\|At\\|"}</M> over a finite set T.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def chi_mean(m):
    return 0.0

def gordon_m(w):
    return 0

def min_gain(A, T):
    return 0.0
`,
        solution: GORDON,
        tests: [
          { name: "chi", code: `import math
assert abs(chi_mean(1) - math.sqrt(2 / math.pi)) < 1e-12 and abs(chi_mean(2) - math.sqrt(math.pi / 2)) < 1e-12 and abs(chi_mean(10000) - math.sqrt(9999.5)) < 1e-4
assert gordon_m(3) == 10 and gordon_m(10) == 101 and gordon_m(20) == 401 and gordon_m(0.5) == 1` },
          { name: "gain", code: `assert min_gain([[1, 0], [0, 2]], [[1, 0], [0, 1], [0.6, 0.8]]) == 1.0 and min_gain([[1, 1]], [[1, -1], [1, 1]]) == 0.0
assert abs(min_gain([[3, 0], [0, 4]], [[0.6, 0.8], [0, 1]]) - (1.8 ** 2 + 3.2 ** 2) ** 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "meas",
      rung: "stretch",
      prompt: (
        <p>
          Using <M>{"w^2 \\approx 2s\\log(ed/s)"}</M> for the s-sparse unit vectors, find the smallest number of Gaussian
          measurements m with <M>{"a_m > w"}</M> for s = 10 and d = 1000.
        </p>
      ),
      answer: { kind: "numeric", value: 113, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Keeping sparse vectors out of the null space is exactly what is needed to recover a sparse signal from few linear
        measurements. The final part of the course turns this geometry into estimators, starting with the lasso.
      </p>
    </>
  ),
};
