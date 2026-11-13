import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CobwebViz } from "@/components/viz/CobwebViz";
import type { LessonContent } from "@/lib/types";

const ITER = `import math

def iterate(f, x0, n):
    xs = [x0]
    for _ in range(n):
        xs.append(f(xs[-1]))
    return xs

def is_monotone(xs):
    pairs = list(zip(xs, xs[1:]))
    if all(a <= b for a, b in pairs):
        return "increasing"
    if all(a >= b for a, b in pairs):
        return "decreasing"
    return "neither"`;

const SUMS = `def e_sequence(n):
    return [(1 + 1 / k) ** k for k in range(1, n + 1)]

def partial_sums(term, n):
    out, s = [], 0.0
    for k in range(1, n + 1):
        s += term(k)
        out.append(s)
    return out`;

export const lesson: LessonContent = {
  id: "m8.2.2",
  minutes: 55,
  links: {
    requires: ["m8.2.1", "m8.1.2"],
    revisits: ["m2.5.4", "m2.8.2"],
    foreshadows: ["m8.2.4", "m8.3.1", "m8.9.3"],
  },

  puzzle: (
    <>
      <p>
        Let a₁ = 0 and aₙ₊₁ = √(2 + aₙ). The terms are 0, 1.414, 1.848, 1.962, … and the limit &quot;must&quot; satisfy L =
        √(2 + L), so L = 2. But the same reasoning applied to aₙ₊₁ = 2aₙ with a₁ = 1 gives L = 2L, so L = 0, which is absurd.
        What has to be proved before solving for the limit, and how do you prove it without knowing the limit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sequence that only goes up and never passes a ceiling has nowhere to go but to settle: completeness guarantees a
        limit even when you cannot name it. So the recipe for a recursion is: prove monotone, prove bounded, conclude it
        converges, and only then solve for the limit.
      </p>
      <CobwebViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="monotone sequences">
        <p>
          A monotone sequence converges if and only if it is bounded. An increasing sequence that is not bounded above
          tends to +∞, and a decreasing one not bounded below tends to −∞.
        </p>
      </Theorem>
      <Proof>
        <p>
          Bounded and monotone implies convergent is the monotone convergence theorem of the first chapter; convergent
          implies bounded is a basic fact. If (aₙ) increases and is unbounded, then for every M some <M>{"a_N > M"}</M>, and{" "}
          <M>{"a_n \\ge a_N > M"}</M> for all n ≥ N, which is the definition of <M>{"a_n \\to \\infty"}</M>.
        </p>
      </Proof>

      <Example title="a recursion, done properly">
        <p>
          a₁ = 0, <M>{"a_{n+1} = \\sqrt{2 + a_n}"}</M>. Bounded: a₁ &lt; 2, and if aₙ &lt; 2 then{" "}
          <M>{"a_{n+1} < \\sqrt 4 = 2"}</M>. Increasing: a₂ &gt; a₁, and if <M>{"a_{n+1} > a_n"}</M> then{" "}
          <M>{"a_{n+2} = \\sqrt{2 + a_{n+1}} > \\sqrt{2 + a_n} = a_{n+1}"}</M>. So aₙ → L for some L ≤ 2. Then{" "}
          <M>{"a_{n+1}^2 = 2 + a_n"}</M>, and both sides converge (the left side is the square of the sequence shifted by one place), so{" "}
          <M>{"L^2 = 2 + L"}</M>, L = 2 or −1, and L ≥ 0 by the order limit theorem. For aₙ₊₁ = 2aₙ the first step fails: the
          sequence is unbounded, so there is no L to solve for.
        </p>
      </Example>

      <Example title="the Babylonian square root">
        <p>
          <M>{"x_{n+1} = \\tfrac12(x_n + 2/x_n)"}</M> with x₁ = 1. By AM–GM, <M>{"x_{n+1} \\ge \\sqrt{x_n \\cdot 2/x_n} = \\sqrt 2"}</M>{" "}
          for n ≥ 1, and then <M>{"x_{n+1} - x_n = (2 - x_n^2)/(2x_n) \\le 0"}</M>. So from the second term on the sequence decreases
          and is bounded below by √2: it converges, and the limit solves L = (L + 2/L)/2, so L = √2.
        </p>
        <Code>{ITER}</Code>
      </Example>

      <Theorem title="the number e">
        <p>
          <M>{"e_n = (1 + 1/n)^n"}</M> is increasing and bounded above by 3, so it converges; its limit is e ≈ 2.71828.
        </p>
      </Theorem>
      <Proof>
        <p>
          Increasing: apply AM–GM to the n + 1 numbers 1 + 1/n (n times) and 1. Their geometric mean is{" "}
          <M>{"e_n^{1/(n+1)}"}</M> and their arithmetic mean is <M>{"(n + 2)/(n + 1) = 1 + 1/(n + 1)"}</M>, so{" "}
          <M>{"e_n \\le e_{n+1}"}</M> (strictly, as the numbers are not all equal). Bounded: by the binomial theorem,
        </p>
        <MD>{"e_n = \\sum_{k=0}^n \\binom nk \\frac1{n^k} \\le \\sum_{k=0}^n \\frac1{k!} \\le 1 + 1 + \\frac12 + \\frac14 + \\cdots < 3,"}</MD>
        <p>
          using <M>{"\\binom nk n^{-k} = \\frac{n(n-1)\\cdots(n-k+1)}{n^k\\,k!} \\le \\frac1{k!}"}</M> and <M>{"k! \\ge 2^{k-1}"}</M>.
        </p>
      </Proof>

      <Theorem title="series with non-negative terms">
        <p>
          If every <M>{"a_k \\ge 0"}</M>, the partial sums <M>{"S_n = a_1 + \\dots + a_n"}</M> increase, so{" "}
          <M>{"\\sum a_k"}</M> converges if and only if the partial sums are bounded.
        </p>
      </Theorem>
      <Example title="1/k² converges and 1/k does not">
        <p>
          For k ≥ 2, <M>{"1/k^2 \\le 1/(k(k-1)) = 1/(k-1) - 1/k"}</M>, which telescopes:{" "}
          <M>{"S_n \\le 1 + 1 - 1/n < 2"}</M>. So <M>{"\\sum 1/k^2"}</M> converges (to π²/6 ≈ 1.6449). For the harmonic series,
          group the terms from <M>{"2^{j-1} + 1"}</M> to <M>{"2^j"}</M>: each group has <M>{"2^{j-1}"}</M> terms, each at least{" "}
          <M>{"2^{-j}"}</M>, so it contributes at least ½, and <M>{"S_{2^m} \\ge 1 + m/2"}</M>: unbounded, so divergent, although
          after 1000 terms the sum is only about 7.5.
        </p>
        <Code>{SUMS}</Code>
      </Example>

      <Remark title="when monotonicity fails">
        <p>
          Iterating cos x converges while alternating around its fixed point, so the monotone theorem does not apply
          directly. The odd and even terms are each monotone here, or one can use the contraction mapping theorem of the
          last chapter, which handles such iterations in general.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "a3",
      rung: "check",
      prompt: <p>With a₁ = 0 and aₙ₊₁ = √(2 + aₙ), what is a₃? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.8478, tolerance: 0.0001 },
    },
    {
      key: "harm",
      rung: "check",
      prompt: <p>The grouping argument gives a lower bound for the harmonic partial sum S₁₀₂₄ = 1 + 1/2 + … + 1/1024. What is it?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: <p>&quot;If aₙ₊₁ = 1 + aₙ and aₙ → L, then L = 1 + L, which is impossible.&quot; What does this argument actually show?</p>,
      answer: {
        kind: "choice",
        options: [
          "The sequence does not converge.",
          "The sequence converges to 0.",
          "The limit theorems are wrong.",
          "The sequence converges but its limit cannot be computed.",
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

def iterate(f, x0, n):
    xs = [x0]
    for _ in range(n):
        xs.append(f(xs[-1]))
    return xs

def is_monotone(xs):
    pairs = list(zip(xs, xs[1:]))
    if all(a <= b for a, b in pairs):
        return "increasing"
    if all(a >= b for a, b in pairs):
        return "decreasing"
    return "neither"

xs = iterate(lambda x: math.sqrt(2 + x), 0, 5)
print([round(x, 4) for x in xs], is_monotone(xs))
ys = iterate(lambda x: (x + 2 / x) / 2, 1, 5)
print(is_monotone(ys), is_monotone(ys[1:]), is_monotone([1, 1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 1.4142, 1.8478, 1.9616, 1.9904, 1.9976] increasing\nneither decreasing increasing",
          "[0, 1.4142, 1.8478, 1.9616, 1.9904, 1.9976] increasing\ndecreasing decreasing increasing",
          "[0, 1.4142, 1.8478, 1.9616, 1.9904, 1.9976] increasing\nneither decreasing neither",
          "[0, 1.4142, 1.8478, 1.9616, 1.9904, 1.9976] neither\nneither decreasing increasing",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def e_sequence(n):
    return [(1 + 1 / k) ** k for k in range(1, n + 1)]

def partial_sums(term, n):
    out, s = [], 0.0
    for k in range(1, n + 1):
        s += term(k)
        out.append(s)
    return out

es = e_sequence(1000)
print(round(es[0], 4), round(es[9], 4), round(es[-1], 4), all(a < b for a, b in zip(es, es[1:])))
ps = partial_sums(lambda k: 1 / k ** 2, 1000)
print(round(ps[-1], 4), max(ps) < 2, round(partial_sums(lambda k: 1 / k, 1000)[-1], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 2.5937 2.7169 True\n1.6439 True 7.4855",
          "2.0 2.5937 2.7183 True\n1.6439 True 7.4855",
          "2.0 2.5937 2.7169 False\n1.6439 True 7.4855",
          "2.0 2.5937 2.7169 True\n1.6449 True 7.4855",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iterate(f, x0, n)</C>, returning [x0, f(x0), …] with n applications of f, and <C>is_monotone(xs)</C>,
          returning &quot;increasing&quot; if every step is ≥ 0, else &quot;decreasing&quot; if every step is ≤ 0, else
          &quot;neither&quot; (a constant list counts as increasing).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def iterate(f, x0, n):
    return [x0]

def is_monotone(xs):
    return "neither"
`,
        solution: ITER,
        tests: [
          { name: "iterate", code: `assert iterate(lambda x: 2 * x, 1, 4) == [1, 2, 4, 8, 16] and iterate(math.sqrt, 16, 0) == [16]` },
          { name: "monotone", code: `assert is_monotone([1, 2, 2, 5]) == "increasing" and is_monotone([3, 1, 1]) == "decreasing"
assert is_monotone([1, 3, 2]) == "neither" and is_monotone([4, 4]) == "increasing" and is_monotone([7]) == "increasing"
ys = iterate(lambda x: (x + 3 / x) / 2, 1, 6)
assert is_monotone(ys) == "neither" and is_monotone(ys[1:]) == "decreasing"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>e_sequence(n)</C>, the list of (1 + 1/k)ᵏ for k = 1, …, n, and <C>partial_sums(term, n)</C>, the list of
          partial sums term(1), term(1) + term(2), …, up to n terms.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def e_sequence(n):
    return []

def partial_sums(term, n):
    return []
`,
        solution: SUMS,
        tests: [
          { name: "e", code: `es = e_sequence(50)
assert len(es) == 50 and es[0] == 2.0 and abs(es[1] - 2.25) < 1e-12
assert all(a < b for a, b in zip(es, es[1:])) and es[-1] < 3` },
          { name: "partial sums", code: `ps = partial_sums(lambda k: 1 / 2 ** k, 10)
assert len(ps) == 10 and abs(ps[0] - 0.5) < 1e-12 and abs(ps[-1] - (1 - 2 ** -10)) < 1e-12
h = partial_sums(lambda k: 1 / k, 1024)
assert h[-1] >= 6 and abs(h[2] - 11 / 6) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Let a₁ = 0 and aₙ₊₁ = √(2 + aₙ). Prove that (aₙ) converges and find its limit.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Proves by induction that aₙ < 2 (bounded above) and aₙ < aₙ₊₁ (increasing).",
          "Concludes by the monotone convergence theorem that aₙ → L for some L.",
          "Passes to the limit in aₙ₊₁² = 2 + aₙ to get L² = 2 + L and uses L ≥ 0 to conclude L = 2.",
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: (
        <p>
          a₁ = 1 and aₙ₊₁ = √(1 + 2aₙ). The sequence is increasing and bounded (you may assume this). What is its limit? Give
          four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 2.4142, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a bounded monotone sequence must converge, the three-step recipe for a recursive sequence and why solving for the limit first can mislead, how monotonicity proves e exists, and why Σ1/k² converges while Σ1/k does not.",

  glimpse: (
    <>
      <p>
        Most sequences are not monotone. The next lesson shows that every bounded sequence still has a monotone, hence
        convergent, subsequence: the Bolzano–Weierstrass theorem.
      </p>
    </>
  ),
};
