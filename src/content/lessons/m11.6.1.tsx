import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JlDistortionViz } from "@/components/viz/JlDistortionViz";
import type { LessonContent } from "@/lib/types";

const JL = `import numpy as np

def gaussian_projection(k, d, rng):
    return rng.normal(size=(k, d)) / np.sqrt(k)

def pair_ratios(X, Y):
    i, j = np.triu_indices(len(X), 1)
    return np.sum((Y[i] - Y[j]) ** 2, axis=1) / np.sum((X[i] - X[j]) ** 2, axis=1)

def jl_dim(n, eps):
    return int(np.ceil(4 * np.log(n) / (eps ** 2 / 2 - eps ** 3 / 3)))`;

const SIGN = `import numpy as np

def sign_projection(k, d, rng):
    return rng.choice([-1.0, 1.0], size=(k, d)) / np.sqrt(k)

def ratio_stats(make, x, k, trials, rng):
    r = np.array([np.sum((make(k, len(x), rng) @ x) ** 2) for _ in range(trials)]) / (x @ x)
    return round(float(r.mean()), 2), round(float(r.var() * k), 1)`;

export const lesson: LessonContent = {
  id: "m11.6.1",
  minutes: 50,
  links: {
    requires: ["m11.5.1", "m7.5.3"],
    revisits: ["m3.1.2"],
    foreshadows: ["m11.6.2", "m11.6.3"],
  },

  puzzle: (
    <>
      <p>
        You have a hundred embedding vectors, each with 5000 coordinates, and you want to store them in far fewer numbers
        while keeping every pairwise distance within 50%. Multiply them all by one matrix of independent Gaussian entries,
        222 rows by 5000 columns, chosen without looking at the data. All 4950 distances survive within the tolerance.
        Ask for a million vectors instead of a hundred and you need only 11842 rows for 10% accuracy, whether the vectors
        have five thousand coordinates or five billion. Why does the original dimension not matter at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A random projection measures a vector along k random directions. Each measurement captures, on average, 1/k of the
        squared length, with independent random error, so their total estimates the squared length the way an average of
        k samples estimates a mean: correctly in expectation, with relative error shrinking like 1/√k. Nothing in this
        depends on how many coordinates the vector had. Distances between n points need only n² such estimates to succeed
        at once, and because the failure probability falls exponentially in k, k needs to grow only like log n.
      </p>
      <JlDistortionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Gaussian random projection">
        <p>
          <M>{"S \\in \\mathbb R^{k \\times d}"}</M> with independent entries <M>{"S_{ij} \\sim \\mathcal N(0, 1/k)"}</M>. A point
          x is mapped to Sx.
        </p>
      </Definition>

      <Theorem title="norms are preserved on average">
        <p>
          For any fixed x, <M>{"\\|Sx\\|^2 = \\frac{\\|x\\|^2}{k}\\chi^2_k"}</M>, so{" "}
          <M>{"\\mathbb E\\|Sx\\|^2 = \\|x\\|^2"}</M> and <M>{"\\mathrm{Var}\\|Sx\\|^2 = 2\\|x\\|^4/k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each <M>{"(Sx)_i = \\sum_jS_{ij}x_j"}</M> is a sum of independent normals, so it is normal with mean 0 and variance{" "}
          <M>{"\\sum_jx_j^2/k = \\|x\\|^2/k"}</M>, and different rows are independent. So{" "}
          <M>{"(Sx)_i = (\\|x\\|/\\sqrt k)Z_i"}</M> with <M>{"Z_i"}</M> independent standard normals, and{" "}
          <M>{"\\|Sx\\|^2 = (\\|x\\|^2/k)\\sum Z_i^2"}</M>. A <M>{"\\chi^2_k"}</M> variable has mean k and variance 2k.
        </p>
      </Proof>

      <Theorem title="concentration">
        <p>For 0 &lt; ε &lt; 1,</p>
        <MD>{"\\Pr\\left[\\left|\\frac{\\|Sx\\|^2}{\\|x\\|^2} - 1\\right| \\geq \\epsilon\\right] \\leq 2\\exp\\left(-\\frac k2\\left(\\frac{\\epsilon^2}{2} - \\frac{\\epsilon^3}{3}\\right)\\right)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Upper tail: for 0 &lt; t &lt; 1/2, Markov&apos;s inequality applied to <M>{"e^{t\\chi^2_k}"}</M> and{" "}
          <M>{"\\mathbb Ee^{tZ^2} = (1 - 2t)^{-1/2}"}</M> give{" "}
          <M>{"\\Pr[\\chi^2_k \\geq (1 + \\epsilon)k] \\leq (1 - 2t)^{-k/2}e^{-t(1+\\epsilon)k}"}</M>. Choosing{" "}
          <M>{"t = \\epsilon/(2(1 + \\epsilon))"}</M> yields{" "}
          <M>{"\\left((1 + \\epsilon)e^{-\\epsilon}\\right)^{k/2}"}</M>, and{" "}
          <M>{"\\log(1 + \\epsilon) - \\epsilon \\leq -\\epsilon^2/2 + \\epsilon^3/3"}</M> from the Taylor series. The lower tail
          is similar with t &lt; 0 and is even smaller.
        </p>
      </Proof>

      <Theorem title="Johnson–Lindenstrauss lemma">
        <p>
          Any n points in <M>{"\\mathbb R^d"}</M> can be mapped to <M>{"\\mathbb R^k"}</M> with{" "}
          <M>{"k \\geq 4\\ln n/(\\epsilon^2/2 - \\epsilon^3/3)"}</M> so that every squared pairwise distance changes by a
          factor in <M>{"[1 - \\epsilon, 1 + \\epsilon]"}</M>; a Gaussian S does this with probability at least 1/n.
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply the concentration bound to each of the <M>{"\\binom n2 < n^2/2"}</M> difference vectors{" "}
          <M>{"x_a - x_b"}</M>, using linearity <M>{"S(x_a - x_b) = Sx_a - Sx_b"}</M>. With the stated k, each fails with
          probability at most <M>{"2e^{-2\\ln n} = 2/n^2"}</M>. By the union bound, some pair fails with probability at
          most <M>{"\\tfrac{n(n-1)}{2}\\cdot\\tfrac{2}{n^2} = 1 - \\tfrac1n"}</M>, so all pairs succeed with probability at
          least 1/n, and a suitable map exists; repeating with fresh S about n times, or taking k slightly larger, makes
          success overwhelmingly likely. The bound on k never mentions d. In the code, n = 100 and ε = 0.5 give k = 222, and all
          4950 ratios lie within 0.38 of 1; ε = 0.1 needs 3948 rows for a hundred points and only 11842 for a million.
        </p>
        <Code>{JL}</Code>
      </Proof>

      <Remark title="cheaper projections">
        <p>
          Gaussian entries are not essential. With random signs ±1/√k (Achlioptas), the squared norm is still unbiased, and
          for a spread-out vector its variance is close to 2/k. The variance depends on x, though: for a coordinate vector
          e₁ every sign projection preserves the norm exactly, whereas the Gaussian one still has variance 2/k, and for
          sparse projections spiky vectors are the hard case. Fast JL transforms first spread x out with a random sign flip
          and a fast Fourier or Hadamard transform, then sample coordinates, giving the same guarantees in{" "}
          <M>{"O(d\\log d)"}</M> time instead of O(kd). The log n dependence is optimal: no linear map, random or not, can do
          better in general.
        </p>
        <Code>{SIGN}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: <p>For a Gaussian projection to k = 200 dimensions, what is the variance of ‖Sx‖²/‖x‖²?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 0.00001 },
    },
    {
      key: "dim",
      rung: "check",
      prompt: <p>What is 4 ln n/(ε²/2 − ε³/3) for n = 1000 and ε = 0.2? Give one decimal.</p>,
      answer: { kind: "numeric", value: 1594.1, tolerance: 0.2 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the Johnson–Lindenstrauss dimension k not depend on the original dimension d?</p>,
      answer: {
        kind: "choice",
        options: [
          "For each fixed vector, ‖Sx‖²/‖x‖² has the same χ²ₖ/k distribution whatever d is, and only the n² difference vectors matter",
          "Because the points always lie in a subspace of dimension at most k",
          "Because Gaussian matrices have orthonormal rows",
          "It does depend on d, through a logarithmic factor",
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

def gaussian_projection(k, d, rng):
    return rng.normal(size=(k, d)) / np.sqrt(k)

def pair_ratios(X, Y):
    i, j = np.triu_indices(len(X), 1)
    return np.sum((Y[i] - Y[j]) ** 2, axis=1) / np.sum((X[i] - X[j]) ** 2, axis=1)

def jl_dim(n, eps):
    return int(np.ceil(4 * np.log(n) / (eps ** 2 / 2 - eps ** 3 / 3)))

print(jl_dim(100, 0.5), jl_dim(100, 0.1), jl_dim(10 ** 6, 0.1))
rng = np.random.default_rng(0); X = rng.normal(size=(100, 5000))
r = pair_ratios(X, X @ gaussian_projection(jl_dim(100, 0.5), 5000, rng).T)
print(len(r), bool(np.all(np.abs(r - 1) < 0.5)), round(float(np.abs(r - 1).max()), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["222 3948 11842\n4950 True 0.4", "222 3948 3948\n4950 True 0.4", "222 3948 11842\n100 True 0.4", "222 3948 11842\n4950 False 0.4"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sign_projection(k, d, rng):
    return rng.choice([-1.0, 1.0], size=(k, d)) / np.sqrt(k)

def ratio_stats(make, x, k, trials, rng):
    r = np.array([np.sum((make(k, len(x), rng) @ x) ** 2) for _ in range(trials)]) / (x @ x)
    return round(float(r.mean()), 2), round(float(r.var() * k), 1)

rng = np.random.default_rng(1); e = np.zeros(400); e[0] = 1.0; g = rng.normal(size=400)
for make in [lambda k, d, rng: rng.normal(size=(k, d)) / np.sqrt(k), sign_projection]:
    print(ratio_stats(make, e, 50, 2000, rng), ratio_stats(make, g, 50, 2000, rng))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.99, 2.0) (1.0, 2.0)\n(1.0, 0.0) (0.99, 1.9)",
          "(0.99, 2.0) (1.0, 2.0)\n(1.0, 2.0) (0.99, 1.9)",
          "(0.99, 0.04) (1.0, 0.04)\n(1.0, 0.0) (0.99, 0.04)",
          "(1.0, 0.0) (1.0, 2.0)\n(1.0, 0.0) (0.99, 1.9)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_projection(k, d, rng)</C>; <C>pair_ratios(X, Y)</C>, the ratios of squared distances between
          rows i &lt; j of Y and of X, in the order of <C>np.triu_indices</C>; and <C>jl_dim(n, eps)</C>, the ceiling of 4 ln
          n/(ε²/2 − ε³/3).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gaussian_projection(k, d, rng):
    return np.zeros((k, d))

def pair_ratios(X, Y):
    return np.ones(1)

def jl_dim(n, eps):
    return 1
`,
        solution: JL,
        tests: [
          { name: "dims", code: `assert jl_dim(100, 0.5) == 222 and jl_dim(10, 0.5) == 111
S = gaussian_projection(400, 300, np.random.default_rng(29))
assert S.shape == (400, 300) and abs(S.var() * 400 - 1) < 0.02` },
          { name: "ratios", code: `X = np.array([[0.0, 0.0], [3.0, 4.0], [0.0, 1.0]]); Y = 2 * X
assert np.allclose(pair_ratios(X, Y), 4.0) and len(pair_ratios(X, Y)) == 3
Y = X.copy(); Y[2] = [0.0, 2.0]
assert np.allclose(pair_ratios(X, Y), [1.0, 4.0, 13.0 / 18.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sign_projection(k, d, rng)</C>, entries ±1/√k with equal probability, and{" "}
          <C>ratio_stats(make, x, k, trials, rng)</C>, which draws trials projections from make(k, len(x), rng) and returns
          (mean of ‖Sx‖²/‖x‖² rounded to 2 decimals, k times its variance rounded to 1 decimal).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sign_projection(k, d, rng):
    return np.zeros((k, d))

def ratio_stats(make, x, k, trials, rng):
    return 1.0, 0.0
`,
        solution: SIGN,
        tests: [
          { name: "sign", code: `S = sign_projection(16, 5, np.random.default_rng(30))
assert S.shape == (16, 5) and np.allclose(np.abs(S), 0.25)` },
          { name: "stats", code: `rng = np.random.default_rng(31); e = np.zeros(50); e[3] = 2.0
assert ratio_stats(sign_projection, e, 20, 100, rng) == (1.0, 0.0)
m, v = ratio_stats(lambda k, d, r: r.normal(size=(k, d)) / np.sqrt(k), e, 20, 4000, rng)
assert abs(m - 1) < 0.05 and abs(v - 2) < 0.3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let S be k × d with independent N(0, 1/k) entries and x fixed. Prove that E‖Sx‖² = ‖x‖² and Var‖Sx‖² = 2‖x‖⁴/k.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows each (Sx)ᵢ is normal with mean 0 and variance ‖x‖²/k, and that different coordinates are independent.",
          "Writes ‖Sx‖² = (‖x‖²/k) Σ Zᵢ² with Zᵢ independent standard normal, and gets the mean ‖x‖².",
          "Uses Var(Z²) = 2 (from E Z⁴ = 3) and independence to get variance (‖x‖⁴/k²)·2k = 2‖x‖⁴/k.",
        ],
      },
    },
    {
      key: "grow",
      rung: "stretch",
      prompt: <p>By what factor does the JL dimension 4 ln n/(ε²/2 − ε³/3) grow when n goes from 10³ to 10⁶ at fixed ε?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a random Gaussian projection preserves a squared length on average, why its relative error shrinks like 1/√k, how the union bound turns this into the Johnson–Lindenstrauss lemma, and why the original dimension does not appear.",

  glimpse: (
    <>
      <p>
        A random projection preserves the geometry of a set of points. Applied to the columns of a matrix, it preserves the
        matrix&apos;s dominant subspace, which is the idea behind the randomised SVD of the next lesson.
      </p>
    </>
  ),
};
