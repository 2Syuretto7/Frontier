import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EpsNProofViz } from "@/components/viz/EpsNProofViz";
import type { LessonContent } from "@/lib/types";

const FIRST = `def first_N(seq, L, eps, horizon):
    N = horizon + 1
    for n in range(horizon, 0, -1):
        if abs(seq(n) - L) >= eps:
            break
        N = n
    return N

def n_for_sum(Na, Nb, eps):
    return max(Na(eps / 2), Nb(eps / 2))`;

const RULES = `def n_for_product(Na, Nb, M, b, eps):
    return max(Na(eps / (2 * (abs(b) + 1))), Nb(eps / (2 * M)))

def n_for_squeeze(Nlow, Nhigh, eps):
    return max(Nlow(eps), Nhigh(eps))`;

export const lesson: LessonContent = {
  id: "m8.2.1",
  minutes: 60,
  links: {
    requires: ["m8.1.2", "m2.8.1"],
    revisits: ["m2.2.3", "m1.2.4"],
    foreshadows: ["m8.2.2", "m8.5.1"],
  },

  puzzle: (
    <>
      <p>
        Everyone believes that if aₙ → 3 and bₙ → 2 then aₙbₙ → 6. But a proof has to produce, for every tolerance ε, an
        index N beyond which aₙbₙ is within ε of 6, using only what the two hypotheses supply. How do you turn two
        guarantees into a third, and why does the proof for products need a bound on the sequence?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every limit proof is a budget. You are handed a tolerance ε for the conclusion and must split it among the
        hypotheses, each of which can deliver any tolerance you ask for, at the price of going further out. The answer N is
        the largest of the prices. The figure compares the N such a proof produces with the first N that really works.
      </p>
      <EpsNProofViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convergence">
        <p>
          A sequence (aₙ) converges to a if for every ε &gt; 0 there is N such that <M>{"|a_n - a| < \\varepsilon"}</M> for all
          n ≥ N. We write <M>{"a_n \\to a"}</M> or <M>{"\\lim a_n = a"}</M>.
        </p>
      </Definition>
      <Theorem title="basic facts">
        <p>A limit, if it exists, is unique, and every convergent sequence is bounded.</p>
      </Theorem>
      <Proof>
        <p>
          If aₙ → a and aₙ → a′ with a ≠ a′, take ε = |a − a′|/2; for n beyond both N&apos;s,{" "}
          <M>{"|a - a'| \\le |a - a_n| + |a_n - a'| < 2\\varepsilon = |a - a'|"}</M>, a contradiction. For boundedness, take ε = 1:
          for n ≥ N, <M>{"|a_n| < |a| + 1"}</M>, so <M>{"|a_n| \\le \\max(|a_1|, \\dots, |a_{N-1}|, |a| + 1)"}</M> for all n.
        </p>
      </Proof>

      <Theorem title="algebraic limit theorem">
        <p>Let aₙ → a and bₙ → b. Then</p>
        <ol>
          <li>
            <M>{"ca_n \\to ca"}</M> and <M>{"a_n + b_n \\to a + b"}</M>;
          </li>
          <li>
            <M>{"a_nb_n \\to ab"}</M>;
          </li>
          <li>
            <M>{"a_n/b_n \\to a/b"}</M>, provided b ≠ 0 and every bₙ ≠ 0.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          Sums: given ε, choose <M>{"N_1"}</M> with <M>{"|a_n - a| < \\varepsilon/2"}</M> and <M>{"N_2"}</M> with{" "}
          <M>{"|b_n - b| < \\varepsilon/2"}</M>; for n ≥ max(N₁, N₂) the triangle inequality gives{" "}
          <M>{"|(a_n + b_n) - (a + b)| < \\varepsilon"}</M>. Scalar multiples are similar with ε/(|c| + 1).
        </p>
        <p>Products: add and subtract <M>{"a_nb"}</M>:</p>
        <MD>{"|a_nb_n - ab| \\le |a_n|\\,|b_n - b| + |b|\\,|a_n - a|."}</MD>
        <p>
          Convergent sequences are bounded, so <M>{"|a_n| \\le M"}</M> for some M &gt; 0. Choose N₁ with{" "}
          <M>{"|a_n - a| < \\varepsilon/(2(|b| + 1))"}</M> and N₂ with <M>{"|b_n - b| < \\varepsilon/(2M)"}</M>; beyond both, the
          right side is below ε/2 + ε/2.
        </p>
        <p>
          Quotients: by the product rule it suffices to show <M>{"1/b_n \\to 1/b"}</M>. Take N₁ with{" "}
          <M>{"|b_n - b| < |b|/2"}</M>, so <M>{"|b_n| > |b|/2"}</M> for n ≥ N₁. Then{" "}
          <M>{"|1/b_n - 1/b| = |b - b_n|/(|b_n||b|) < 2|b_n - b|/|b|^2"}</M>, which is below ε once{" "}
          <M>{"|b_n - b| < \\varepsilon|b|^2/2"}</M>.
        </p>
        <Code>{FIRST}</Code>
      </Proof>
      <Remark title="why the bound M">
        <p>
          The product proof needs |aₙ| controlled, because a small error in bₙ is multiplied by aₙ. Boundedness of
          convergent sequences supplies this. Without convergence of aₙ it fails: aₙ = n and bₙ = 1/n give aₙbₙ = 1, not
          ∞ · 0 in any useful sense.
        </p>
      </Remark>

      <Theorem title="order limit theorem">
        <p>
          Let aₙ → a and bₙ → b. If <M>{"a_n \\le b_n"}</M> for all n, then a ≤ b. If <M>{"c \\le b_n"}</M> for all n, then c ≤ b.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the algebraic limit theorem <M>{"b_n - a_n \\to b - a"}</M>, so it suffices to show that a limit of non-negative
          terms is non-negative. If cₙ ≥ 0 and cₙ → c &lt; 0, take ε = |c|: for large n, <M>{"c_n < c + |c| = 0"}</M>, a
          contradiction. The second statement is the first with the constant sequence c.
        </p>
      </Proof>
      <Remark title="strict inequalities are not preserved">
        <p>1/n &gt; 0 for every n, but the limit is 0. Limits turn &lt; into ≤.</p>
      </Remark>

      <Theorem title="squeeze theorem">
        <p>If <M>{"x_n \\le y_n \\le z_n"}</M> and <M>{"x_n \\to L"}</M>, <M>{"z_n \\to L"}</M>, then <M>{"y_n \\to L"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Given ε, beyond the larger of the two indices, <M>{"L - \\varepsilon < x_n \\le y_n \\le z_n < L + \\varepsilon"}</M>.
        </p>
        <Code>{RULES}</Code>
      </Proof>

      <Example title="using the theorems">
        <p>
          <M>{"\\frac{3n^2 + n}{2n^2 - 5} = \\frac{3 + 1/n}{2 - 5/n^2} \\to \\frac{3}{2}"}</M>: divide through by n², then 1/n → 0
          and products, sums and a quotient with non-zero limit 2 do the rest. And <M>{"\\sin(n)/n \\to 0"}</M> by squeezing
          between −1/n and 1/n.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "firstN",
      rung: "check",
      prompt: <p>For aₙ = 1/n and ε = 0.01, what is the smallest N such that |aₙ| &lt; ε for every n ≥ N?</p>,
      answer: { kind: "numeric", value: 101, tolerance: 0.0001 },
    },
    {
      key: "lim",
      rung: "check",
      prompt: <p>If aₙ → 3 and bₙ → 2, what is the limit of aₙbₙ + aₙ/bₙ? Give the answer as a decimal.</p>,
      answer: { kind: "numeric", value: 7.5, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which statement is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "If aₙ → a, bₙ → b ≠ 0 and every bₙ ≠ 0, then aₙ/bₙ → a/b.",
          "If aₙbₙ converges, then aₙ and bₙ both converge.",
          "If aₙ < bₙ for all n and both converge, then lim aₙ < lim bₙ.",
          "Every bounded sequence converges.",
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

def first_N(seq, L, eps, horizon):
    N = horizon + 1
    for n in range(horizon, 0, -1):
        if abs(seq(n) - L) >= eps:
            break
        N = n
    return N

def n_for_sum(Na, Nb, eps):
    return max(Na(eps / 2), Nb(eps / 2))

Na = lambda e: math.floor(1 / e) + 1
Nb = lambda e: math.floor(1 / math.sqrt(e)) + 1
print(first_N(lambda n: 1 / n, 0, 0.01, 10000), first_N(lambda n: 1 / n + 2 + 1 / n ** 2, 2, 0.01, 10000), n_for_sum(Na, Nb, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["101 101 201", "100 100 201", "101 101 101", "101 100 200"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def n_for_product(Na, Nb, M, b, eps):
    return max(Na(eps / (2 * (abs(b) + 1))), Nb(eps / (2 * M)))

def n_for_squeeze(Nlow, Nhigh, eps):
    return max(Nlow(eps), Nhigh(eps))

Na = lambda e: math.floor(1 / e) + 1
Nb = lambda e: math.floor(1 / math.sqrt(e)) + 1
print(n_for_product(Na, Nb, 2, 2, 0.06), n_for_squeeze(Na, Nb, 0.04))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["101 26", "9 26", "101 6", "201 26"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>first_N(seq, L, eps, horizon)</C>, returning the smallest N such that <C>abs(seq(n) - L) &lt; eps</C> for every
          n from N to horizon (horizon + 1 if seq(horizon) itself fails), and <C>n_for_sum(Na, Nb, eps)</C>, the N given by the
          sum rule&apos;s proof, where Na(e) and Nb(e) return indices achieving tolerance e for the two sequences.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def first_N(seq, L, eps, horizon):
    return 1

def n_for_sum(Na, Nb, eps):
    return max(Na(eps), Nb(eps))
`,
        solution: FIRST,
        tests: [
          { name: "first N", code: `assert first_N(lambda n: 1 / n, 0, 0.01, 10000) == 101
assert first_N(lambda n: (-1) ** n / n + 5, 5, 0.3, 100) == 4
assert first_N(lambda n: 1.0, 0, 0.5, 50) == 51 and first_N(lambda n: 0.0, 0, 0.5, 50) == 1` },
          { name: "sum rule", code: `Na = lambda e: int(1 / e) + 1
Nb = lambda e: int(10 / e) + 1
assert n_for_sum(Na, Nb, 0.1) == Nb(0.05)
assert n_for_sum(lambda e: 7, lambda e: 3, 0.5) == 7` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>n_for_product(Na, Nb, M, b, eps)</C>, the N from the product rule&apos;s proof with |aₙ| ≤ M and bₙ → b
          (tolerance ε/(2(|b| + 1)) for aₙ and ε/(2M) for bₙ), and <C>n_for_squeeze(Nlow, Nhigh, eps)</C>, the N from the
          squeeze theorem&apos;s proof.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def n_for_product(Na, Nb, M, b, eps):
    return 1

def n_for_squeeze(Nlow, Nhigh, eps):
    return 1
`,
        solution: RULES,
        tests: [
          { name: "product", code: `seen = []
Na = lambda e: (seen.append(('a', e)), 5)[1]
Nb = lambda e: (seen.append(('b', e)), 9)[1]
assert n_for_product(Na, Nb, 4, -3, 0.8) == 9
assert ('a', 0.1) in seen and ('b', 0.1) in seen` },
          { name: "squeeze", code: `assert n_for_squeeze(lambda e: int(1 / e) + 1, lambda e: int(2 / e) + 1, 0.1) == 21
assert n_for_squeeze(lambda e: 4, lambda e: 2, 1.0) == 4` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if aₙ → a and bₙ → b, then aₙbₙ → ab.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes |aₙbₙ − ab| ≤ |aₙ||bₙ − b| + |b||aₙ − a| by adding and subtracting aₙb.",
          "Uses that a convergent sequence is bounded to get |aₙ| ≤ M for all n.",
          "Chooses N₁, N₂ so that each term is below ε/2 (e.g. |bₙ − b| < ε/(2M), |aₙ − a| < ε/(2(|b| + 1))) and takes N = max(N₁, N₂).",
        ],
      },
    },
    {
      key: "proofN",
      rung: "stretch",
      prompt: (
        <p>
          With Na(e) = Nb(e) = ⌊1/e⌋ + 1, M = 2, b = 2 and ε = 0.06, what N does the product rule&apos;s proof give? (Use
          tolerances ε/(2(|b| + 1)) for aₙ and ε/(2M) for bₙ.)
        </p>
      ),
      answer: { kind: "numeric", value: 101, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how an ε–N proof splits its tolerance among hypotheses, why convergent sequences are bounded and why the product rule needs that, and why limits preserve ≤ but not <.",

  glimpse: (
    <>
      <p>
        These theorems compute limits we already know exist. The next lesson proves existence without knowing the limit:
        a monotone bounded sequence must converge, which settles recursions like aₙ₊₁ = √(2 + aₙ).
      </p>
    </>
  ),
};
