import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OnlineSoftmaxViz } from "@/components/viz/OnlineSoftmaxViz";
import type { LessonContent } from "@/lib/types";

const LSE = `import numpy as np

def lse_naive(z):
    return float(np.log(np.sum(np.exp(z))))

def lse(z):
    m = float(np.max(z))
    return m + float(np.log(np.sum(np.exp(z - m))))

def online_lse(stream):
    m, s = -np.inf, 0.0
    for z in stream:
        if z > m:
            s = s * np.exp(m - z) + 1.0
            m = z
        else:
            s += np.exp(z - m)
    return float(m + np.log(s))`;

const CHAN = `import numpy as np

def stats(xs):
    n, mean, m2 = 0, 0.0, 0.0
    for x in xs:
        n += 1
        d = x - mean
        mean += d / n
        m2 += d * (x - mean)
    return n, mean, m2

def merge(a, b):
    na, ma, qa = a
    nb, mb, qb = b
    n = na + nb
    d = mb - ma
    return n, ma + d * nb / n, qa + qb + d * d * na * nb / n`;

export const lesson: LessonContent = {
  id: "m11.2.3",
  minutes: 50,
  links: {
    requires: ["m11.2.2"],
    revisits: ["e5.2.4", "m7.2.4"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        An attention layer computes a softmax over a row of scores that may be tens of thousands long, and fast kernels never
        hold the whole row in memory at once: they see the scores in blocks. Softmax needs the sum of exponentials of every
        score before it can normalise any of them, and the stable version needs the maximum of the whole row before it can
        exponentiate anything. How can a single pass over blocks, keeping only a couple of numbers, produce the exact
        stable answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Softmax and log-sum-exp do not change if every logit is shifted by the same constant, so we are free to measure
        everything relative to a reference point. Choosing the maximum as the reference makes every exponent at most 0,
        which removes overflow and guarantees the sum is at least 1. The reference does not have to be known in advance: keep
        the largest value seen so far, and whenever a bigger one arrives, rescale the accumulated sum to the new reference.
        The same idea of carrying a few summary numbers and correcting them when merging gives a stable variance for data
        split across machines.
      </p>
      <OnlineSoftmaxViz />
    </>
  ),

  theory: (
    <>
      <Definition title="log-sum-exp and softmax">
        <p>For z ∈ ℝⁿ,</p>
        <MD>{"\\mathrm{LSE}(z) = \\log\\sum_{i=1}^n e^{z_i}, \\qquad \\mathrm{softmax}(z)_i = e^{z_i - \\mathrm{LSE}(z)}."}</MD>
      </Definition>

      <Theorem title="shift invariance and the max trick">
        <p>
          For every constant c, <M>{"\\mathrm{LSE}(z) = c + \\mathrm{LSE}(z - c\\mathbf 1)"}</M> and softmax(z) =
          softmax(z − c1). With <M>{"m = \\max_i z_i"}</M>,{" "}
          <M>{"m \\leq \\mathrm{LSE}(z) \\leq m + \\log n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sum e^{z_i} = e^c\\sum e^{z_i - c}"}</M>; take logarithms. Softmax depends only on differences{" "}
          <M>{"z_i - \\mathrm{LSE}(z)"}</M>, which the shift leaves alone. With c = m every term <M>{"e^{z_i - m}"}</M> lies in
          (0, 1] and one of them equals 1, so the sum lies in [1, n] and its logarithm in [0, log n].
        </p>
      </Proof>

      <Theorem title="log-sum-exp is perfectly conditioned in absolute terms">
        <p>
          <M>{"\\nabla\\,\\mathrm{LSE}(z) = \\mathrm{softmax}(z)"}</M>, and{" "}
          <M>{"|\\mathrm{LSE}(z + \\delta) - \\mathrm{LSE}(z)| \\leq \\|\\delta\\|_\\infty"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiating, <M>{"\\partial_i \\mathrm{LSE} = e^{z_i}/\\sum_j e^{z_j} = p_i"}</M>. By the mean value theorem the
          difference equals <M>{"p \\cdot \\delta"}</M> for the softmax p at some point on the segment, and since p is a
          probability vector, <M>{"|p \\cdot \\delta| \\leq \\sum p_i\\,\\|\\delta\\|_\\infty = \\|\\delta\\|_\\infty"}</M>.
        </p>
        <p>
          So the problem is benign: the naive formula fails not because LSE is ill conditioned but because the intermediate{" "}
          <M>{"e^{z_i}"}</M> overflows to inf (for z = 1000) or underflows to 0 (for z = −1000), where the logarithm gives
          −inf. The shifted formula computes each <M>{"e^{z_i - m}"}</M> with relative error about u, sums numbers in [1, n]
          with relative error at most <M>{"\\gamma_n"}</M>, and the logarithm turns a relative error ε in its argument into an
          absolute error about ε: the result has absolute error O(nu), as good as the conditioning allows. In the code, the
          naive version returns inf and −inf (NumPy also prints overflow and divide-by-zero warnings), while the stable one
          gives 1000.6932 and −999.3068.
        </p>
        <Code>{LSE}</Code>
      </Proof>

      <Theorem title="online log-sum-exp">
        <p>
          Process <M>{"z_1, z_2, \\ldots"}</M> one at a time, starting from <M>{"m = -\\infty"}</M>, s = 0. On seeing z: if
          z &gt; m, set <M>{"s \\leftarrow s\\,e^{m - z} + 1"}</M> and m ← z; otherwise set{" "}
          <M>{"s \\leftarrow s + e^{z - m}"}</M>. After k steps, <M>{"m = \\max_{i \\leq k} z_i"}</M> and{" "}
          <M>{"s = \\sum_{i \\leq k} e^{z_i - m}"}</M>, so <M>{"m + \\log s = \\mathrm{LSE}(z_1, \\ldots, z_k)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Induction on k; the base case k = 1 sets m = z₁ and s = 1. If the new z exceeds the old maximum m, the new maximum is
          z and <M>{"\\sum_{i \\leq k} e^{z_i - z} = e^{m - z}\\sum_{i < k} e^{z_i - m} + e^{0}"}</M>. Otherwise the maximum
          is unchanged and the new term <M>{"e^{z - m}"}</M> is added. Every exponent computed is at most 0. Blocks merge the
          same way: two summaries (m₁, s₁) and (m₂, s₂) combine to{" "}
          <M>{"(M, s_1 e^{m_1 - M} + s_2 e^{m_2 - M})"}</M> with M = max(m₁, m₂), which is what attention kernels do across
          tiles, carrying the weighted sum of value vectors alongside s.
        </p>
      </Proof>

      <Theorem title="merging variance summaries">
        <p>
          Summarise a group by its size, mean and sum of squared deviations{" "}
          <M>{"M_2 = \\sum (x - \\bar x)^2"}</M>. For disjoint groups a and b with <M>{"d = \\bar x_b - \\bar x_a"}</M> and n =
          nₐ + n_b, the union has
        </p>
        <MD>{"\\bar x = \\bar x_a + d\\,\\frac{n_b}{n}, \\qquad M_2 = M_{2,a} + M_{2,b} + d^2\\,\\frac{n_a n_b}{n}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The mean formula is the weighted average <M>{"(n_a\\bar x_a + n_b\\bar x_b)/n"}</M> rewritten. For each group,{" "}
          <M>{"\\sum_a (x - \\bar x)^2 = M_{2,a} + n_a(\\bar x_a - \\bar x)^2"}</M>, because the cross term vanishes when
          deviations are taken from the group mean. Here <M>{"\\bar x_a - \\bar x = -d\\,n_b/n"}</M> and{" "}
          <M>{"\\bar x_b - \\bar x = d\\,n_a/n"}</M>, so the extra terms add to{" "}
          <M>{"d^2(n_a n_b^2 + n_b n_a^2)/n^2 = d^2 n_a n_b/n"}</M>.
        </p>
        <p>
          Welford&apos;s update is the special case n_b = 1. Everything is computed from deviations, never from the raw
          squares, so a large common offset does no harm: for the values 10⁸ + (4, 7, 13, 16) split into two halves, the merge
          gives the exact variance 22.5, while the textbook formula E[X²] − E[X]² in double precision subtracts two numbers
          near 10¹⁶, whose spacing is 2, and returns 22.0.
        </p>
        <Code>{CHAN}</Code>
      </Proof>

      <Remark title="relatives">
        <p>
          The same care applies to the functions around softmax. Compute log-softmax as z − LSE(z), not as the logarithm of a
          softmax that may have underflowed to 0. Compute softplus <M>{"\\log(1 + e^x)"}</M> as{" "}
          <M>{"\\max(x, 0) + \\mathrm{log1p}(e^{-|x|})"}</M>, and fuse softmax with cross-entropy so the loss is LSE(z) −
          z_y.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "zeros",
      rung: "check",
      prompt: <p>What is LSE(0, 0, 0, 0)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.3863, tolerance: 0.0001 },
    },
    {
      key: "chan",
      rung: "check",
      prompt: (
        <p>
          Group a has 2 values with mean 2 and M₂ = 2; group b has 3 values with mean 7 and M₂ = 8. What is M₂ for the union?
        </p>
      ),
      answer: { kind: "numeric", value: 40, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does stable log-sum-exp subtract the maximum logit rather than, say, the mean?</p>,
      answer: {
        kind: "choice",
        options: [
          "It makes every exponent at most 0, so nothing overflows, and makes one term equal 1, so the sum cannot underflow to 0",
          "The maximum is cheaper to compute than the mean",
          "Subtracting the mean would change the value of the softmax",
          "Subtracting the maximum makes the result exact in floating point",
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

def lse_naive(z):
    return float(np.log(np.sum(np.exp(z))))

def lse(z):
    m = float(np.max(z))
    return m + float(np.log(np.sum(np.exp(z - m))))

def online_lse(stream):
    m, s = -np.inf, 0.0
    for z in stream:
        if z > m:
            s = s * np.exp(m - z) + 1.0
            m = z
        else:
            s += np.exp(z - m)
    return float(m + np.log(s))

z = np.array([1000.0, 1000.0, 990.0])
print(lse_naive(z), round(lse(z), 4), round(online_lse(z), 4))
print(lse_naive(z - 2000), round(lse(z - 2000), 4), round(online_lse(z[::-1]), 4))`}</Code>
          <p>What does this print to standard output, ignoring NumPy&apos;s warnings?</p>
        </>
      ),
      answer: { kind: "choice", options: ["inf 1000.6932 1000.6932\n-inf -999.3068 1000.6932", "1000.6932 1000.6932 1000.6932\n-999.3068 -999.3068 1000.6932", "inf 1000.6932 1000.6932\n-inf -999.3068 -999.3068", "inf 1000.0 1000.0\n-inf -1000.0 1000.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def stats(xs):
    n, mean, m2 = 0, 0.0, 0.0
    for x in xs:
        n += 1
        d = x - mean
        mean += d / n
        m2 += d * (x - mean)
    return n, mean, m2

def merge(a, b):
    na, ma, qa = a
    nb, mb, qb = b
    n = na + nb
    d = mb - ma
    return n, ma + d * nb / n, qa + qb + d * d * na * nb / n

xs = 1e8 + np.array([4.0, 7.0, 13.0, 16.0])
n, mean, m2 = merge(stats(xs[:2]), stats(xs[2:]))
print(n, mean - 1e8, m2 / n)
print(float(np.mean(xs ** 2) - np.mean(xs) ** 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 10.0 22.5\n22.0", "4 10.0 22.5\n22.5", "4 10.0 90.0\n22.0", "4 0.0 22.5\n0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lse_naive(z)</C>, <C>lse(z)</C> using the max trick, and <C>online_lse(stream)</C>, the one-pass version
          with a running maximum and rescaled sum. All three return Python floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lse_naive(z):
    return 0.0

def lse(z):
    return 0.0

def online_lse(stream):
    return 0.0
`,
        solution: LSE,
        tests: [
          { name: "stable", code: `z = np.array([1000.0, 1000.0])
assert abs(lse(z) - (1000 + np.log(2))) < 1e-9 and abs(lse(-z) - (-1000 + np.log(2))) < 1e-9
with np.errstate(over='ignore'):
    assert lse_naive(z) == np.inf
assert abs(lse_naive(np.array([0.0, 1.0])) - np.log(1 + np.e)) < 1e-12` },
          { name: "online", code: `z = np.random.default_rng(6).normal(size=300) * 400
assert abs(online_lse(z) - lse(z)) < 1e-9 and abs(online_lse(np.sort(z)) - lse(z)) < 1e-9
assert abs(online_lse([3.0]) - 3.0) < 1e-12 and isinstance(online_lse([1.0, 2.0]), float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stats(xs)</C>, returning (n, mean, M₂) by Welford&apos;s update, and <C>merge(a, b)</C>, combining two such
          triples by the merging formula.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def stats(xs):
    return 0, 0.0, 0.0

def merge(a, b):
    return a
`,
        solution: CHAN,
        tests: [
          { name: "stats", code: `n, m, q = stats([1.0, 3.0])
assert n == 2 and abs(m - 2.0) < 1e-12 and abs(q - 2.0) < 1e-12
n, m, q = merge(stats([1.0, 3.0]), stats([5.0, 7.0, 9.0]))
assert n == 5 and abs(m - 5.0) < 1e-12 and abs(q - 40.0) < 1e-9` },
          { name: "big", code: `xs = 1e9 + np.random.default_rng(7).normal(size=1000)
n, m, q = merge(stats(xs[:300]), stats(xs[300:]))
d = xs - 1e9
assert n == 1000 and abs(q / n - np.var(d)) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the online log-sum-exp update maintains the invariant: after processing z₁, …, z_k, m = max zᵢ and s =
          Σ e^(zᵢ − m), so that m + log s = LSE(z₁, …, z_k).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sets up an induction, checking the first step gives m = z₁ and s = 1 (or starting from m = −∞, s = 0).",
          "Handles the case z > m: the new maximum is z and s e^(m − z) + 1 equals the sum of e^(zᵢ − z) over all k terms.",
          "Handles the case z ≤ m: the maximum is unchanged and adding e^(z − m) gives the new sum; concludes m + log s = LSE.",
        ],
      },
    },
    {
      key: "two",
      rung: "stretch",
      prompt: <p>What is LSE(1000, 999) − 1000? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3133, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why naive log-sum-exp overflows even though the problem is perfectly conditioned, how the max trick and its online version fix it, and how variance summaries from two machines can be merged without cancellation.",

  glimpse: (
    <>
      <p>
        With conditioning and stability in hand, the next chapter turns to the workhorses of numerical linear algebra:
        Gaussian elimination with pivoting, Cholesky and QR factorisations, and why the method you learned first for least
        squares is the one to avoid.
      </p>
    </>
  ),
};
