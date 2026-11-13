import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RootRatioViz } from "@/components/viz/RootRatioViz";
import type { LessonContent } from "@/lib/types";

const TESTS = `def root_seq(a, n):
    return [abs(a(k)) ** (1 / k) for k in range(1, n + 1)]

def ratio_seq(a, n):
    return [abs(a(k + 1) / a(k)) for k in range(1, n + 1)]`;

const ALT = `import math

def alt_partial(b, n):
    return sum((-1) ** (k + 1) * b(k) for k in range(1, n + 1))

def alt_error_bound(b, n):
    return b(n + 1)`;

export const lesson: LessonContent = {
  id: "m8.3.1",
  minutes: 65,
  links: {
    requires: ["m8.2.4", "m8.2.5"],
    revisits: ["m2.8.2", "m2.8.3"],
    foreshadows: ["m8.3.2", "m8.8.3"],
  },

  puzzle: (
    <>
      <p>
        You have used the comparison, ratio and alternating series tests as rules. Each is really a short argument that
        reduces a series to one we understand, usually a geometric series, using the Cauchy criterion or monotone
        convergence. Seeing the arguments explains the fine print: why the ratio test can fail where the root test works,
        and why the alternating test needs the terms to decrease.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A series converges exactly when its tails can be made small. Comparison makes the tails of one series smaller than
        another&apos;s. The root and ratio tests say that eventually the terms shrink at least as fast as a geometric
        sequence. The alternating test uses cancellation: partial sums overshoot back and forth by less each time.
      </p>
      <RootRatioViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Cauchy criterion for series">
        <p>
          <M>{"\\sum a_k"}</M> converges if and only if for every ε &gt; 0 there is N with{" "}
          <M>{"|a_{n+1} + \\dots + a_m| < \\varepsilon"}</M> for all m &gt; n ≥ N. In particular, if <M>{"\\sum a_k"}</M> converges
          then <M>{"a_k \\to 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum <M>{"a_{n+1} + \\dots + a_m"}</M> is <M>{"S_m - S_n"}</M>, so this is the Cauchy criterion for the partial
          sums. Taking m = n + 1 gives the term test.
        </p>
      </Proof>

      <Theorem title="comparison and absolute convergence">
        <p>
          If <M>{"0 \\le a_k \\le b_k"}</M> and <M>{"\\sum b_k"}</M> converges, so does <M>{"\\sum a_k"}</M>. If{" "}
          <M>{"\\sum |a_k|"}</M> converges, so does <M>{"\\sum a_k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For m &gt; n, <M>{"|a_{n+1} + \\dots + a_m| \\le |a_{n+1}| + \\dots + |a_m|"}</M>, and in the first case this is at most{" "}
          <M>{"b_{n+1} + \\dots + b_m"}</M>. The right-hand sides satisfy the Cauchy criterion, so the left-hand sides do.
        </p>
      </Proof>

      <Theorem title="root test">
        <p>
          Let <M>{"\\alpha = \\limsup |a_k|^{1/k}"}</M>. If α &lt; 1, <M>{"\\sum a_k"}</M> converges absolutely; if α &gt; 1, it
          diverges; if α = 1, the test is inconclusive.
        </p>
      </Theorem>
      <Proof>
        <p>
          If α &lt; 1, pick r with α &lt; r &lt; 1. By the ε characterisation of limsup, <M>{"|a_k|^{1/k} < r"}</M> for all large
          k, so <M>{"|a_k| < r^k"}</M>, and comparison with the geometric series gives absolute convergence. If α &gt; 1, then{" "}
          <M>{"|a_k|^{1/k} > 1"}</M> for infinitely many k, so <M>{"|a_k| > 1"}</M> infinitely often and the terms do not tend to
          0. Both <M>{"\\sum 1/k"}</M> and <M>{"\\sum 1/k^2"}</M> have α = 1, one diverging and one converging.
        </p>
      </Proof>

      <Theorem title="ratio test">
        <p>
          If <M>{"\\limsup |a_{k+1}/a_k| < 1"}</M>, <M>{"\\sum a_k"}</M> converges absolutely; if{" "}
          <M>{"|a_{k+1}/a_k| \\ge 1"}</M> for all large k, it diverges.
        </p>
      </Theorem>
      <Proof>
        <p>
          If the limsup is below r &lt; 1, then <M>{"|a_{k+1}| \\le r|a_k|"}</M> for k ≥ N, so{" "}
          <M>{"|a_k| \\le |a_N|r^{k-N}"}</M>, a geometric bound. If the ratios are eventually at least 1, the |aₖ| are eventually
          non-decreasing and positive, so they do not tend to 0.
        </p>
        <Code>{TESTS}</Code>
      </Proof>
      <Remark title="root beats ratio">
        <p>
          In general <M>{"\\liminf |a_{k+1}/a_k| \\le \\liminf |a_k|^{1/k} \\le \\limsup |a_k|^{1/k} \\le \\limsup |a_{k+1}/a_k|"}</M>, so
          whenever the ratio test concludes, the root test does too. The series whose terms are <M>{"2^{-k}"}</M> for even k and{" "}
          <M>{"3^{-k}"}</M> for odd k has root limsup 1/2 but ratios that swing between near 0 and huge values.
        </p>
      </Remark>

      <Theorem title="alternating series test">
        <p>
          If <M>{"b_1 \\ge b_2 \\ge \\cdots \\ge 0"}</M> and <M>{"b_k \\to 0"}</M>, then{" "}
          <M>{"\\sum (-1)^{k+1}b_k"}</M> converges to some S, and <M>{"|S - S_n| \\le b_{n+1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"S_{2n+2} = S_{2n} + (b_{2n+1} - b_{2n+2}) \\ge S_{2n}"}</M> and{" "}
          <M>{"S_{2n+1} = S_{2n-1} - (b_{2n} - b_{2n+1}) \\le S_{2n-1}"}</M>, while{" "}
          <M>{"S_{2n} \\le S_{2n} + b_{2n+1} = S_{2n+1}"}</M>. So the intervals <M>{"[S_{2n}, S_{2n+1}]"}</M> are nested, with
          widths <M>{"b_{2n+1} \\to 0"}</M>, and the nested interval property gives a single point S in all of them. Every
          partial sum is an endpoint of an interval containing S whose other endpoint is the next partial sum, so{" "}
          <M>{"|S - S_n| \\le |S_{n+1} - S_n| = b_{n+1}"}</M>.
        </p>
        <Code>{ALT}</Code>
      </Proof>

      <Theorem title="Cauchy condensation">
        <p>
          If <M>{"a_k \\ge 0"}</M> is decreasing, <M>{"\\sum a_k"}</M> converges if and only if{" "}
          <M>{"\\sum 2^ja_{2^j}"}</M> converges. Hence <M>{"\\sum 1/k^p"}</M> converges exactly when p &gt; 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Group the terms with <M>{"2^j \\le k < 2^{j+1}"}</M>: there are <M>{"2^j"}</M> of them, each between{" "}
          <M>{"a_{2^{j+1}}"}</M> and <M>{"a_{2^j}"}</M>. So the group sum lies between <M>{"\\tfrac12 \\cdot 2^{j+1}a_{2^{j+1}}"}</M> and{" "}
          <M>{"2^ja_{2^j}"}</M>, and the partial sums of the two series bound each other. For{" "}
          <M>{"a_k = k^{-p}"}</M> the condensed series is <M>{"\\sum (2^{1-p})^j"}</M>, geometric with ratio <M>{"2^{1-p}"}</M>.
        </p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "root",
      rung: "check",
      prompt: <p>For aₖ = (k/(2k + 1))ᵏ, what is lim |aₖ|^(1/k)?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "alt",
      rung: "check",
      prompt: <p>The partial sum of 1 − 1/2 + 1/3 − … with 99 terms is within what bound of the full sum?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 0.000001 },
    },
    {
      key: "incon",
      rung: "apply",
      prompt: <p>For which series does the ratio test give no conclusion?</p>,
      answer: { kind: "choice", options: ["Σ 1/k²", "Σ 2⁻ᵏ", "Σ k!/kᵏ", "Σ 3ᵏ/k!"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def root_seq(a, n):
    return [abs(a(k)) ** (1 / k) for k in range(1, n + 1)]

def ratio_seq(a, n):
    return [abs(a(k + 1) / a(k)) for k in range(1, n + 1)]

a = lambda k: 2.0 ** -k if k % 2 == 0 else 3.0 ** -k
r, q = root_seq(a, 40), ratio_seq(a, 40)
print(round(max(r[-10:]), 3), round(min(r[-10:]), 3), max(q[-10:]) > 1, min(q[-10:]) < 1)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 0.333 True True", "0.5 0.333 False True", "0.707 0.577 True True", "0.333 0.5 True True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def alt_partial(b, n):
    return sum((-1) ** (k + 1) * b(k) for k in range(1, n + 1))

def alt_error_bound(b, n):
    return b(n + 1)

s = alt_partial(lambda k: 1 / k, 1000)
print(round(s, 6), round(abs(s - math.log(2)), 6), round(alt_error_bound(lambda k: 1 / k, 1000), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.692647 0.0005 0.000999", "0.693147 0.0 0.000999", "0.692647 0.0005 0.001", "0.692647 0.000999 0.0005"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>root_seq(a, n)</C>, the list of |a(k)|^(1/k) for k = 1, …, n, and <C>ratio_seq(a, n)</C>, the list of
          |a(k + 1)/a(k)| for k = 1, …, n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def root_seq(a, n):
    return []

def ratio_seq(a, n):
    return []
`,
        solution: TESTS,
        tests: [
          { name: "root", code: `r = root_seq(lambda k: 0.5 ** k, 5)
assert len(r) == 5 and all(abs(x - 0.5) < 1e-12 for x in r)
assert abs(root_seq(lambda k: -8.0, 3)[2] - 2) < 1e-12` },
          { name: "ratio", code: `q = ratio_seq(lambda k: 3.0 ** k, 4)
assert len(q) == 4 and all(abs(x - 3) < 1e-12 for x in q)
assert ratio_seq(lambda k: (-1) ** k / k, 1) == [0.5]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>alt_partial(b, n)</C>, the partial sum b(1) − b(2) + b(3) − … with n terms, and{" "}
          <C>alt_error_bound(b, n)</C>, the alternating series bound on the error of that partial sum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def alt_partial(b, n):
    return 0.0

def alt_error_bound(b, n):
    return 0.0
`,
        solution: ALT,
        tests: [
          { name: "partial", code: `assert abs(alt_partial(lambda k: 1 / k, 3) - (1 - 0.5 + 1 / 3)) < 1e-12 and alt_partial(lambda k: 1, 4) == 0` },
          { name: "bound", code: `b = lambda k: 1 / (2 * k - 1)
for n in (1, 5, 50):
    assert abs(4 * alt_partial(b, n) - math.pi) <= 4 * alt_error_bound(b, n)
assert abs(alt_error_bound(lambda k: 1 / k, 9) - 0.1) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the alternating series test: if bₖ decreases to 0, then Σ(−1)^(k+1) bₖ converges, and its sum S satisfies
          |S − Sₙ| ≤ bₙ₊₁.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows the even partial sums increase and the odd partial sums decrease, using bₖ ≥ bₖ₊₁.",
          "Shows S₂ₙ ≤ S₂ₙ₊₁ with difference b₂ₙ₊₁ → 0 and concludes (by nested intervals or monotone convergence) that both converge to a common S.",
          "Argues S lies between consecutive partial sums Sₙ and Sₙ₊₁, so |S − Sₙ| ≤ |Sₙ₊₁ − Sₙ| = bₙ₊₁.",
        ],
      },
    },
    {
      key: "cond",
      rung: "stretch",
      prompt: <p>Cauchy condensation turns Σ 1/k³ into a geometric series. What is its ratio?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the Cauchy criterion underlies the comparison and absolute convergence tests, how the root and ratio tests reduce to geometric series and why the root test is stronger, and why the alternating series test gives an error bound.",

  glimpse: (
    <>
      <p>
        Absolute convergence is more than a test: it makes a series behave like a finite sum, unaffected by reordering.
        The next lesson proves this and Riemann&apos;s shocking converse for conditionally convergent series.
      </p>
    </>
  ),
};
