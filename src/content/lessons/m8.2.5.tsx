import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LimsupEnvelopeViz } from "@/components/viz/LimsupEnvelopeViz";
import type { LessonContent } from "@/lib/types";

const TAILS = `import math

def tail_sups(xs):
    out, best = [], -math.inf
    for x in reversed(xs):
        best = max(best, x)
        out.append(best)
    return out[::-1]

def tail_infs(xs):
    return [-s for s in tail_sups([-x for x in xs])]`;

const EPS = `def eventually_below(xs, L, eps):
    N = len(xs)
    for i in range(len(xs) - 1, -1, -1):
        if xs[i] >= L + eps:
            break
        N = i
    return N

def count_above(xs, L, eps):
    return sum(1 for x in xs if x > L - eps)`;

export const lesson: LessonContent = {
  id: "m8.2.5",
  minutes: 55,
  links: {
    requires: ["m8.2.3", "m8.2.2"],
    revisits: ["m2.1.2"],
    foreshadows: ["m8.3.1", "m8.8.3"],
  },

  puzzle: (
    <>
      <p>
        The root test for a series and the radius of convergence of a power series are stated with &quot;limsup&quot;, not
        &quot;lim&quot;, because the relevant sequence often has no limit. What is the largest value a sequence keeps coming
        back to, and why does it exist for every bounded sequence even when the limit does not?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Look at the terms from n onwards and record their supremum and infimum. Throwing away early terms can only lower
        the supremum and raise the infimum, so these two numbers are monotone in n and therefore converge. Their limits
        bracket the long-run behaviour of the sequence: limsup is the highest level it keeps reaching, liminf the lowest.
      </p>
      <LimsupEnvelopeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="limsup and liminf">
        <p>For a bounded sequence (aₙ), let</p>
        <MD>{"s_n = \\sup\\{a_k : k \\ge n\\}, \\qquad i_n = \\inf\\{a_k : k \\ge n\\}."}</MD>
        <p>
          (sₙ) is decreasing and (iₙ) is increasing, both bounded, so they converge.{" "}
          <M>{"\\limsup a_n = \\lim s_n = \\inf_n s_n"}</M> and <M>{"\\liminf a_n = \\lim i_n = \\sup_n i_n"}</M>. For unbounded
          sequences the same definitions are used with values ±∞.
        </p>
      </Definition>
      <Code>{TAILS}</Code>

      <Theorem title="the ε characterisation">
        <p>L = limsup aₙ if and only if, for every ε &gt; 0,</p>
        <ol>
          <li>
            <M>{"a_n < L + \\varepsilon"}</M> for all sufficiently large n, and
          </li>
          <li>
            <M>{"a_n > L - \\varepsilon"}</M> for infinitely many n.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          Suppose L = lim sₙ. Since sₙ decreases to L, some <M>{"s_N < L + \\varepsilon"}</M>, and then{" "}
          <M>{"a_n \\le s_N < L + \\varepsilon"}</M> for n ≥ N. For every n, <M>{"s_n \\ge L > L - \\varepsilon"}</M>, so some k ≥ n
          has <M>{"a_k > L - \\varepsilon"}</M>; since n is arbitrary, there are infinitely many such k. Conversely, (1) gives{" "}
          <M>{"s_n \\le L + \\varepsilon"}</M> for large n and (2) gives <M>{"s_n \\ge L - \\varepsilon"}</M> for all n; as ε is
          arbitrary, lim sₙ = L.
        </p>
        <Code>{EPS}</Code>
      </Proof>

      <Theorem title="limsup is the largest subsequential limit">
        <p>
          For a bounded sequence, limsup aₙ and liminf aₙ are subsequential limits, and every subsequential limit lies between
          them.
        </p>
      </Theorem>
      <Proof>
        <p>
          Using (2) with ε = 1/k, choose <M>{"n_1 < n_2 < \\cdots"}</M> with <M>{"a_{n_k} > L - 1/k"}</M>, and by (1) also{" "}
          <M>{"a_{n_k} < L + 1/k"}</M> once <M>{"n_k"}</M> is large enough; this subsequence tends to L. If{" "}
          <M>{"a_{m_j} \\to x"}</M>, then <M>{"a_{m_j} \\le s_{m_j}"}</M> and the order limit theorem gives x ≤ L. The liminf
          statements follow by applying these to (−aₙ).
        </p>
      </Proof>

      <Theorem title="convergence">
        <p>A bounded sequence converges if and only if liminf aₙ = limsup aₙ, and then both equal the limit.</p>
      </Theorem>
      <Proof>
        <p>
          If aₙ → a, every subsequence tends to a, so both extremes equal a. Conversely, <M>{"i_n \\le a_n \\le s_n"}</M>, and if
          lim iₙ = lim sₙ = L, the squeeze theorem gives aₙ → L.
        </p>
      </Proof>

      <Example title="computing them">
        <p>
          <M>{"(-1)^n(1 + 1/n)"}</M>: limsup 1, liminf −1. A sequence cycling through 2, −1, ½ (plus a vanishing term): limsup
          2, liminf −1, and ½ is a third subsequential limit in between. sin n: limsup 1 and liminf −1, though no term equals
          either.
        </p>
      </Example>

      <Remark title="rules">
        <p>
          <M>{"\\limsup(a_n + b_n) \\le \\limsup a_n + \\limsup b_n"}</M>, often strictly: <M>{"a_n = (-1)^n"}</M> and{" "}
          <M>{"b_n = -(-1)^n"}</M> give 0 on the left and 2 on the right. Also <M>{"\\liminf a_n = -\\limsup(-a_n)"}</M>, and
          adding a convergent sequence shifts both by its limit. The root test and the radius of convergence{" "}
          <M>{"1/\\limsup |c_n|^{1/n}"}</M> use limsup because <M>{"|c_n|^{1/n}"}</M> often oscillates.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ls",
      rung: "check",
      prompt: <p>What is limsup of (−1)ⁿ(1 + 1/n)?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "li",
      rung: "check",
      prompt: <p>A sequence repeats 2, −1, 0.5, 2, −1, 0.5, … What is its liminf?</p>,
      answer: { kind: "numeric", value: -1, tolerance: 0.0001 },
    },
    {
      key: "rule",
      rung: "apply",
      prompt: <p>For bounded sequences (aₙ) and (bₙ), which statement always holds?</p>,
      answer: {
        kind: "choice",
        options: [
          "limsup(aₙ + bₙ) ≤ limsup aₙ + limsup bₙ",
          "limsup(aₙ + bₙ) = limsup aₙ + limsup bₙ",
          "limsup aₙ ≥ sup aₙ",
          "liminf aₙ = −liminf(−aₙ)",
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

def tail_sups(xs):
    out, best = [], -math.inf
    for x in reversed(xs):
        best = max(best, x)
        out.append(best)
    return out[::-1]

def tail_infs(xs):
    return [-s for s in tail_sups([-x for x in xs])]

xs = [(-1) ** n * (1 + 1 / n) for n in range(1, 9)]
print([round(s, 3) for s in tail_sups(xs)])
print([round(s, 3) for s in tail_infs(xs)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5, 1.5, 1.25, 1.25, 1.167, 1.167, 1.125, 1.125]\n[-2.0, -1.333, -1.333, -1.2, -1.2, -1.143, -1.143, 1.125]",
          "[1.5, 1.5, 1.25, 1.25, 1.167, 1.167, 1.125, 1.125]\n[-2.0, -1.333, -1.333, -1.2, -1.2, -1.143, -1.143, -1.143]",
          "[1.5, 1.25, 1.25, 1.167, 1.167, 1.125, 1.125, 1.125]\n[-2.0, -1.333, -1.333, -1.2, -1.2, -1.143, -1.143, 1.125]",
          "[1.5, 1.5, 1.25, 1.25, 1.167, 1.167, 1.125, 1.125]\n[-1.5, -1.5, -1.25, -1.25, -1.167, -1.167, -1.125, -1.125]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def eventually_below(xs, L, eps):
    N = len(xs)
    for i in range(len(xs) - 1, -1, -1):
        if xs[i] >= L + eps:
            break
        N = i
    return N

def count_above(xs, L, eps):
    return sum(1 for x in xs if x > L - eps)

ys = [(-1) ** n * (1 + 1 / n) for n in range(1, 1001)]
print(eventually_below(ys, 1, 0.01), count_above(ys, 1, 0.01), count_above(ys, -1, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["100 500 950", "99 500 950", "100 500 500", "100 950 500"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tail_sups(xs)</C>, the list whose n-th entry is max(xs[n:]), in one backward pass, and{" "}
          <C>tail_infs(xs)</C>, the list of min(xs[n:]).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def tail_sups(xs):
    return list(xs)

def tail_infs(xs):
    return list(xs)
`,
        solution: TAILS,
        tests: [
          { name: "sups", code: `assert tail_sups([1, 5, 2, 4, 3]) == [5, 5, 4, 4, 3] and tail_sups([7]) == [7]` },
          { name: "infs", code: `assert tail_infs([1, 5, 2, 4, 3]) == [1, 2, 2, 3, 3]
s, i = tail_sups([3, -1, 2]), tail_infs([3, -1, 2])
assert all(a >= b for a, b in zip(s, i)) and all(x >= y for x, y in zip(s, s[1:])) and all(x <= y for x, y in zip(i, i[1:]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eventually_below(xs, L, eps)</C>, the smallest N such that every xs[i] with i ≥ N is below L + eps
          (len(xs) if the last term fails), and <C>count_above(xs, L, eps)</C>, the number of terms greater than L − eps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def eventually_below(xs, L, eps):
    return 0

def count_above(xs, L, eps):
    return 0
`,
        solution: EPS,
        tests: [
          { name: "below", code: `assert eventually_below([5, 0, 5, 0, 0], 1, 0.5) == 3 and eventually_below([0, 0], 1, 0.5) == 0 and eventually_below([0, 9], 1, 0.5) == 2` },
          { name: "above", code: `assert count_above([1, 2, 3, 0.95], 1, 0.1) == 4 and count_above([0.5, 0.89], 1, 0.1) == 0
ys = [(-1) ** n * (1 + 1 / n) for n in range(1, 1001)]
assert eventually_below(ys, 1, 0.01) == 100 and count_above(ys, 1, 0.01) == 500` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a bounded sequence converges if and only if its liminf equals its limsup.</p>,
      answer: {
        kind: "written",
        rubric: [
          "If aₙ → a, uses that every subsequence (in particular those realising limsup and liminf, or the ε characterisation) tends to a, so both equal a.",
          "Notes iₙ ≤ aₙ ≤ sₙ for every n, with iₙ = inf of the tail and sₙ = sup of the tail.",
          "If lim iₙ = lim sₙ = L, applies the squeeze theorem to conclude aₙ → L.",
        ],
      },
    },
    {
      key: "root",
      rung: "stretch",
      prompt: <p>Let aₙ = (2 + (−1)ⁿ)ⁿ. What is limsup |aₙ|^(1/n)?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how limsup and liminf are built from tail suprema and infima, why they always exist for bounded sequences, the ε description of limsup, and why a sequence converges exactly when they agree.",

  glimpse: (
    <>
      <p>
        With sequences understood, the next chapter turns to series: proofs of the convergence tests, including the root and
        ratio tests stated with limsup, and the surprising effect of rearranging the terms of a series.
      </p>
    </>
  ),
};
