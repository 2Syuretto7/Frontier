import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DoubleSeriesViz } from "@/components/viz/DoubleSeriesViz";
import type { LessonContent } from "@/lib/types";

const REARR = `import itertools

def pos_neg_parts(xs):
    return sum(x for x in xs if x > 0), sum(x for x in xs if x < 0)

def riemann_rearrange(target, n):
    pos = (1 / k for k in itertools.count(1, 2))
    neg = (-1 / k for k in itertools.count(2, 2))
    out, s = [], 0.0
    while len(out) < n:
        x = next(pos) if s <= target else next(neg)
        out.append(x)
        s += x
    return out`;

const DOUBLE = `def iterated_sums(a, N):
    rows = sum(sum(a(i, j) for j in range(N + 1)) for i in range(N))
    cols = sum(sum(a(i, j) for i in range(N + 1)) for j in range(N))
    return rows, cols

def cauchy_product(a, b):
    n = len(a)
    return [sum(a[i] * b[k - i] for i in range(k + 1)) for k in range(n)]`;

export const lesson: LessonContent = {
  id: "m8.3.2",
  minutes: 60,
  links: {
    requires: ["m8.3.1"],
    revisits: ["m2.8.3"],
    foreshadows: ["m8.8.2", "m8.8.3"],
  },

  puzzle: (
    <>
      <p>
        Finite sums can be added in any order. Infinite sums cannot always: the terms of 1 − 1/2 + 1/3 − 1/4 + … can be
        reordered to sum to 1.5, or to 100, or to diverge. A grid of numbers can give different totals when summed by rows
        and by columns. When is it safe to reorder, swap sums, or multiply two series term by term?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the absolute values add up to something finite, the far-out terms are collectively negligible however you shuffle
        them, so every order gives the same answer. If not, the positive terms alone add up to infinity and so do the
        negative ones: two infinite reservoirs that cancel only because of the order in which they are interleaved. Change the
        interleaving and you change the sum.
      </p>
      <DoubleSeriesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="rearrangement">
        <p>
          If σ : ℕ → ℕ is a bijection, the series <M>{"\\sum_k a_{\\sigma(k)}"}</M> is a rearrangement of <M>{"\\sum_k a_k"}</M>.
          A series is conditionally convergent if it converges but <M>{"\\sum |a_k|"}</M> does not.
        </p>
      </Definition>

      <Theorem title="absolutely convergent series can be rearranged">
        <p>If <M>{"\\sum |a_k| < \\infty"}</M> and <M>{"\\sum a_k = S"}</M>, every rearrangement converges to S.</p>
      </Theorem>
      <Proof>
        <p>
          Let ε &gt; 0 and choose N with <M>{"\\sum_{k > N}|a_k| < \\varepsilon/2"}</M>, so also{" "}
          <M>{"|S_N - S| < \\varepsilon/2"}</M>. Choose M so large that <M>{"\\{\\sigma(1), \\dots, \\sigma(M)\\} \\supseteq \\{1, \\dots, N\\}"}</M>.
          For m ≥ M, the rearranged partial sum <M>{"T_m"}</M> contains all of <M>{"a_1, \\dots, a_N"}</M>, plus some terms with
          index above N, so <M>{"|T_m - S_N| \\le \\sum_{k > N}|a_k| < \\varepsilon/2"}</M>, and <M>{"|T_m - S| < \\varepsilon"}</M>.
        </p>
      </Proof>

      <Theorem title="Riemann rearrangement theorem">
        <p>
          If <M>{"\\sum a_k"}</M> converges conditionally, then for every real L some rearrangement converges to L (and others
          diverge to +∞ or −∞).
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"a_k^+ = \\max(a_k, 0)"}</M> and <M>{"a_k^- = \\max(-a_k, 0)"}</M>, so <M>{"a_k = a_k^+ - a_k^-"}</M> and{" "}
          <M>{"|a_k| = a_k^+ + a_k^-"}</M>. If both <M>{"\\sum a_k^\\pm"}</M> converged, <M>{"\\sum|a_k|"}</M> would; if just one did,
          then <M>{"\\sum a_k"}</M> would diverge. So both diverge to ∞. Now take positive terms in their original order until the
          partial sum first exceeds L, then negative terms until it first drops below L, and repeat; the reservoirs never run
          out. After the first switch, every partial sum differs from L by at most the size of the most recent term at which the direction switched, and those terms tend to 0
          because <M>{"a_k \\to 0"}</M>. Every term is eventually used, so this is a rearrangement, and it converges to L.
        </p>
        <Code>{REARR}</Code>
      </Proof>
      <p>
        For the alternating harmonic series, the first 1000 terms already have positive part about 4.09 and negative part
        about −3.40, both growing like ½ log n, while their difference stays near log 2.
      </p>

      <Theorem title="double series">
        <p>
          If <M>{"\\sum_i\\sum_j |a_{ij}| < \\infty"}</M>, then <M>{"\\sum_i\\sum_j a_{ij} = \\sum_j\\sum_i a_{ij}"}</M>, and any
          enumeration of the array as a single series has the same sum.
        </p>
      </Theorem>
      <Proof>
        <p>
          Enumerate the array as one series; it converges absolutely since its finite partial sums of absolute values are at
          most the iterated absolute sum. By the rearrangement theorem every enumeration has the same sum S. The row-first sum
          is a grouping of one enumeration: summing the first n rows completely differs from S by at most the absolute mass
          outside those rows, which tends to 0. The same holds for columns.
        </p>
      </Proof>
      <Example title="the array where the orders disagree">
        <p>
          Put 1 on the diagonal and −1 just to its right, 0 elsewhere. Every row sums to 1 − 1 = 0, so the row-first total is 0.
          The first column holds only the 1 at the top, and every other column holds a 1 and a −1, so the column-first total
          is 1. The absolute values sum to ∞, so the theorem does not apply.
        </p>
      </Example>

      <Theorem title="Cauchy product">
        <p>
          If <M>{"\\sum a_k = A"}</M> and <M>{"\\sum b_k = B"}</M> both converge absolutely, then{" "}
          <M>{"c_n = \\sum_{i=0}^n a_ib_{n-i}"}</M> gives <M>{"\\sum c_n = AB"}</M>, absolutely convergent.
        </p>
      </Theorem>
      <Proof>
        <p>
          The array <M>{"a_ib_j"}</M> has <M>{"\\sum_{i,j}|a_ib_j| = (\\sum|a_i|)(\\sum|b_j|) < \\infty"}</M>. Summing it by rows gives
          AB, and summing along the diagonals i + j = n gives <M>{"\\sum c_n"}</M>; both are groupings of absolutely convergent
          enumerations, so they agree.
        </p>
        <Code>{DOUBLE}</Code>
      </Proof>
      <Remark title="why it matters">
        <p>
          The Cauchy product of the exponential series gives <M>{"e^xe^y = e^{x+y}"}</M>, and swapping sums is how expectations of
          sums, generating functions and Fourier coefficients are manipulated. The measure-theoretic versions are Fubini&apos;s
          and Tonelli&apos;s theorems, with absolute summability replaced by integrability.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "good",
      rung: "check",
      prompt: <p>What is the sum of the array (−1)^(i+j) 2^−(i+j) over all i, j ≥ 0? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.4444, tolerance: 0.0001 },
    },
    {
      key: "cauchy",
      rung: "check",
      prompt: <p>For a = (1, 2, 3, …) and b = (4, 5, 6, …), what is the Cauchy product coefficient c₂ = a₀b₂ + a₁b₁ + a₂b₀?</p>,
      answer: { kind: "numeric", value: 28, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which series has a rearrangement that sums to 100?</p>,
      answer: { kind: "choice", options: ["Σ (−1)^(k+1)/√k", "Σ (−1)^k/k²", "Σ 2⁻ᵏ", "Σ (−1)^k/2^k"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools

def pos_neg_parts(xs):
    return sum(x for x in xs if x > 0), sum(x for x in xs if x < 0)

def riemann_rearrange(target, n):
    pos = (1 / k for k in itertools.count(1, 2))
    neg = (-1 / k for k in itertools.count(2, 2))
    out, s = [], 0.0
    while len(out) < n:
        x = next(pos) if s <= target else next(neg)
        out.append(x)
        s += x
    return out

p, q = pos_neg_parts([(-1) ** (k + 1) / k for k in range(1, 1001)])
r = riemann_rearrange(1.5, 10000)
print(round(p, 3), round(q, 3), round(sum(r), 3), sum(1 for x in r if x > 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4.089 -3.396 1.5 8339", "4.089 -3.396 0.693 5000", "3.396 -4.089 1.5 8339", "4.089 -3.396 1.5 5000"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def iterated_sums(a, N):
    rows = sum(sum(a(i, j) for j in range(N + 1)) for i in range(N))
    cols = sum(sum(a(i, j) for i in range(N + 1)) for j in range(N))
    return rows, cols

def cauchy_product(a, b):
    n = len(a)
    return [sum(a[i] * b[k - i] for i in range(k + 1)) for k in range(n)]

print(iterated_sums(lambda i, j: 1 if i == j else (-1 if j == i + 1 else 0), 50))
print(cauchy_product([1, 1, 1, 1], [1, -1, 1, -1]), cauchy_product([1, 2, 3], [4, 5, 6]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0, 1)\n[1, 0, 1, 0] [4, 13, 28]",
          "(1, 0)\n[1, 0, 1, 0] [4, 13, 28]",
          "(0, 0)\n[1, 0, 1, 0] [4, 13, 28]",
          "(0, 1)\n[1, 0, 1, 0] [4, 10, 18]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pos_neg_parts(xs)</C>, returning (sum of the positive terms, sum of the negative terms), and{" "}
          <C>riemann_rearrange(target, n)</C>, returning the first n terms of the greedy rearrangement of 1 − 1/2 + 1/3 − …:
          take the next unused positive term 1, 1/3, 1/5, … while the running sum is ≤ target, otherwise the next unused
          negative term −1/2, −1/4, ….
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools

def pos_neg_parts(xs):
    return 0.0, 0.0

def riemann_rearrange(target, n):
    return []
`,
        solution: REARR,
        tests: [
          { name: "parts", code: `assert pos_neg_parts([1, -2, 3, 0, -0.5]) == (4, -2.5) and pos_neg_parts([]) == (0, 0)` },
          { name: "rearrange", code: `r = riemann_rearrange(0.0, 4)
assert r == [1.0, -0.5, -0.25, -1 / 6]
r = riemann_rearrange(-1.0, 20000)
assert abs(sum(r) + 1) < 0.01 and len(r) == 20000 and r[0] == -0.5
assert len(set(r)) == len(r)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iterated_sums(a, N)</C>, returning (sum over rows i &lt; N of the sum over j ≤ N of a(i, j), sum over columns
          j &lt; N of the sum over i ≤ N of a(i, j)), and <C>cauchy_product(a, b)</C>, the first len(a) Cauchy product
          coefficients of two equal-length lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def iterated_sums(a, N):
    return 0, 0

def cauchy_product(a, b):
    return [x * y for x, y in zip(a, b)]
`,
        solution: DOUBLE,
        tests: [
          { name: "iterated", code: `assert iterated_sums(lambda i, j: 1 if i == j else (-1 if j == i + 1 else 0), 10) == (0, 1)
r, c = iterated_sums(lambda i, j: 0.5 ** (i + j), 40)
assert abs(r - c) < 1e-9 and abs(r - 4) < 1e-6` },
          { name: "product", code: `import math
x, y = 0.3, 0.5
ex = [x ** k / math.factorial(k) for k in range(20)]
ey = [y ** k / math.factorial(k) for k in range(20)]
assert abs(sum(cauchy_product(ex, ey)) - math.exp(x + y)) < 1e-12
assert cauchy_product([1, 2, 3], [4, 5, 6]) == [4, 13, 28]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if Σ aₖ converges absolutely to S, then every rearrangement also converges to S.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Chooses N with the absolute tail beyond N below ε/2 (so also |S_N − S| < ε/2).",
          "Chooses M so the first M rearranged indices include 1, …, N, and notes T_m − S_N for m ≥ M consists only of terms with index above N.",
          "Bounds |T_m − S_N| by the absolute tail and concludes |T_m − S| < ε for m ≥ M.",
        ],
      },
    },
    {
      key: "twoone",
      rung: "stretch",
      prompt: (
        <p>
          The rearrangement 1 + 1/3 − 1/2 + 1/5 + 1/7 − 1/4 + … (two positive terms, then one negative) of the alternating
          harmonic series sums to (3/2) ln 2. Give this to four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1.0397, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why absolutely convergent series can be reordered freely, how the positive and negative parts of a conditionally convergent series let you reach any target, why row and column sums of an array can disagree, and when multiplying series term by term is valid.",

  glimpse: (
    <>
      <p>
        Series live on the real line; the next chapter studies the line itself. Open, closed, compact and connected sets are
        the language for saying where continuous functions behave well.
      </p>
    </>
  ),
};
