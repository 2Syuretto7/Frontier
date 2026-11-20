import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DigitEventsViz } from "@/components/viz/DigitEventsViz";
import type { LessonContent } from "@/lib/types";

const EVENTS = `from itertools import combinations

def prob(w, A):
    return sum(p for omega, p in w.items() if A(omega))

def independent(w, A, B, tol=1e-12):
    both = prob(w, lambda o: A(o) and B(o))
    return abs(both - prob(w, A) * prob(w, B)) < tol

def mutually_independent(w, events, tol=1e-12):
    for r in range(2, len(events) + 1):
        for group in combinations(events, r):
            joint = prob(w, lambda o: all(E(o) for E in group))
            product = 1.0
            for E in group:
                product *= prob(w, E)
            if abs(joint - product) >= tol:
                return False
    return True`;

const DIGITS = `def digits(u, n):
    out = []
    for _ in range(n):
        u *= 2
        d = int(u)
        out.append(d)
        u -= d
    return out

def from_digits(ds):
    return sum(d / 2 ** (k + 1) for k, d in enumerate(ds))

def split_uniform(u, n):
    ds = digits(u, 2 * n)
    return from_digits(ds[0::2]), from_digits(ds[1::2])`;

export const lesson: LessonContent = {
  id: "m18.3.2",
  minutes: 45,
  links: {
    requires: ["m18.3.1", "m18.2.4"],
    revisits: ["m7.1.5", "m18.1.1"],
    foreshadows: ["m18.3.3", "m18.6.1"],
  },

  puzzle: (
    <>
      <p>
        The strong law and the central limit theorem are statements about an infinite sequence of independent random
        variables. But does such a sequence exist at all? An infinite product of probability spaces is not obvious, and
        checking P(A ∩ B) = P(A)P(B) for every pair of events among uncountably many is not obviously enough, or even
        the right condition. What exactly must be checked, and where do infinitely many independent coins live?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pick one point U uniformly from [0, 1) and read its binary digits. Each digit is 0 or 1 with probability 1/2, and
        fixing the first k digits confines U to an interval of length <M>{"2^{-k}"}</M>, whatever the digits are. That is exactly
        the statement that the digits are independent fair coins. One uniform variable already contains infinitely many
        independent ones.
      </p>
      <DigitEventsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="independence">
        <p>
          Sub-σ-algebras <M>{"\\mathcal G_1, \\mathcal G_2, \\dots"}</M> of <M>{"\\mathcal F"}</M> are independent if for every finite set of distinct
          indices <M>{"i_1, \\dots, i_k"}</M> and every choice <M>{"G_j \\in \\mathcal G_{i_j}"}</M>,
        </p>
        <MD>{"P(G_1 \\cap \\cdots \\cap G_k) = P(G_1) \\cdots P(G_k)."}</MD>
        <p>
          Random variables are independent when their σ-algebras σ(X_i) are (m18.3.1), and events when the σ-algebras{" "}
          <M>{"\\{\\emptyset, A, A^c, \\Omega\\}"}</M> are. All finite subfamilies count, not just pairs (<C>mutually_independent</C>).
        </p>
        <Code>{EVENTS}</Code>
      </Definition>

      <Example title="pairwise is not enough">
        <p>
          Toss three fair coins and let A, B, C be the events that coins 1 and 2, 2 and 3, 1 and 3 agree. Each has
          probability 1/2 and each pair meets with probability 1/4, so they are pairwise independent. But any two of them
          force the third, so <M>{"P(A \\cap B \\cap C) = 1/4 \\ne 1/8"}</M>.
        </p>
      </Example>

      <Theorem title="π-systems suffice">
        <p>
          If <M>{"\\mathcal P_1, \\dots, \\mathcal P_n"}</M> are π-systems, each containing Ω, and the product rule holds for every choice{" "}
          <M>{"P_i \\in \\mathcal P_i"}</M>, then the generated σ-algebras <M>{"\\sigma(\\mathcal P_i)"}</M> are independent.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fix <M>{"P_2, \\dots, P_n"}</M>. The sets <M>{"G_1"}</M> satisfying the product rule with them form a λ-system: it contains Ω,
          and complements and increasing unions pass through by subtraction and continuity of measure. It contains{" "}
          <M>{"\\mathcal P_1"}</M>, so by Dynkin&apos;s theorem (m18.1.1) it contains <M>{"\\sigma(\\mathcal P_1)"}</M>. Now repeat with the second
          coordinate, holding <M>{"G_1 \\in \\sigma(\\mathcal P_1)"}</M> fixed, and so on. Since Ω is in each family, choosing{" "}
          <M>{"P_i = \\Omega"}</M> covers every subfamily.
        </p>
      </Proof>

      <Theorem title="independence is product law">
        <p>
          X and Y are independent exactly when <M>{"P_{(X,Y)} = P_X \\otimes P_Y"}</M>, which by the previous theorem is equivalent to{" "}
          <M>{"P(X \\le x, Y \\le y) = P(X \\le x) P(Y \\le y)"}</M> for all x, y. Then for integrable X and Y, XY is integrable and
        </p>
        <MD>{"\\mathbb E[XY] = \\mathbb E X\\, \\mathbb E Y."}</MD>
      </Theorem>
      <Proof>
        <p>
          The two measures agree on rectangles <M>{"(-\\infty, x] \\times (-\\infty, y]"}</M>, a π-system generating the Borel sets of ℝ², so
          they are equal. Then Tonelli (m18.2.4) gives <M>{"\\mathbb E|XY| = \\int\\!\\!\\int |x||y|\\, P_X(dx) P_Y(dy) = \\mathbb E|X|\\, \\mathbb E|Y| < \\infty"}</M>,
          and Fubini gives the identity without absolute values.
        </p>
      </Proof>

      <Theorem title="infinitely many independent variables">
        <p>
          Given any distribution functions <M>{"F_1, F_2, \\dots"}</M>, there are independent random variables{" "}
          <M>{"X_1, X_2, \\dots"}</M> on ([0, 1), Lebesgue) with <M>{"X_n \\sim F_n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The binary digits <M>{"d_k(U)"}</M> are independent fair bits: the cylinder <M>{"\\{d_1 = b_1, \\dots, d_k = b_k\\}"}</M> is a dyadic interval
          of length <M>{"2^{-k}"}</M> (<C>digits</C>). Split the digit positions into infinitely many disjoint infinite sets, for instance
          by the power of 2 dividing the index. The digits in each set rebuild a uniform <M>{"U_n"}</M> (<C>from_digits</C>, and{" "}
          <C>split_uniform</C> for two pieces), and the <M>{"U_n"}</M> are independent because they use disjoint blocks of independent
          bits. Finally <M>{"X_n = F_n^{-1}(U_n)"}</M> by the quantile transform of m18.3.1.
        </p>
        <Code>{DIGITS}</Code>
      </Proof>

      <Theorem title="Kolmogorov's zero-one law">
        <p>
          For independent <M>{"X_1, X_2, \\dots"}</M> let the tail σ-algebra be <M>{"\\mathcal T = \\bigcap_n \\sigma(X_n, X_{n+1}, \\dots)"}</M>. Every
          event in <M>{"\\mathcal T"}</M> has probability 0 or 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sigma(X_1, \\dots, X_n)"}</M> is independent of <M>{"\\sigma(X_{n+1}, \\dots)"}</M>, which contains <M>{"\\mathcal T"}</M>. So <M>{"\\mathcal T"}</M> is
          independent of the union over n of <M>{"\\sigma(X_1, \\dots, X_n)"}</M>, a π-system generating <M>{"\\sigma(X_1, X_2, \\dots) \\supseteq \\mathcal T"}</M>.
          Hence <M>{"\\mathcal T"}</M> is independent of itself, and <M>{"P(A) = P(A \\cap A) = P(A)^2"}</M> forces P(A) ∈ {"{0, 1}"}.
        </p>
      </Proof>

      <Remark title="what the law decides">
        <p>
          Whether <M>{"\\sum X_n"}</M> converges, or whether <M>{"(X_1 + \\cdots + X_n)/n"}</M> has a limit, does not depend on any finite set of
          terms, so these events are certain or impossible. The zero-one law does not say which; the Borel-Cantelli lemmas
          (m18.3.3) and the strong law (m18.6.1) do.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "product",
      rung: "check",
      prompt: <p>X is Bernoulli(0.3) and Y is uniform on [0, 4], independent of X. Compute E[XY].</p>,
      answer: { kind: "numeric", value: 0.6, tolerance: 0.0001 },
    },
    {
      key: "max",
      rung: "check",
      prompt: <p>U₁, U₂, U₃ are independent and uniform on [0, 1]. Compute P(max(U₁, U₂, U₃) ≤ 0.9).</p>,
      answer: { kind: "numeric", value: 0.729, tolerance: 0.0001 },
    },
    {
      key: "pairwise",
      rung: "apply",
      prompt: <p>Events A, B, C satisfy the product rule for each of the three pairs. What else must be checked for them to be independent?</p>,
      answer: {
        kind: "choice",
        options: [
          "P(A ∩ B ∩ C) = P(A)P(B)P(C)",
          "Nothing: pairwise independence implies independence",
          "That A, B, C are disjoint",
          "That P(A ∪ B ∪ C) = P(A) + P(B) + P(C)",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations

def prob(w, A):
    return sum(p for omega, p in w.items() if A(omega))

def independent(w, A, B, tol=1e-12):
    both = prob(w, lambda o: A(o) and B(o))
    return abs(both - prob(w, A) * prob(w, B)) < tol

def mutually_independent(w, events, tol=1e-12):
    for r in range(2, len(events) + 1):
        for group in combinations(events, r):
            joint = prob(w, lambda o: all(E(o) for E in group))
            product = 1.0
            for E in group:
                product *= prob(w, E)
            if abs(joint - product) >= tol:
                return False
    return True

w = {(a, b, c): 1 / 8 for a in (0, 1) for b in (0, 1) for c in (0, 1)}; A, B, C = (lambda o: o[0] == o[1]), (lambda o: o[1] == o[2]), (lambda o: o[0] == o[2])
print(prob(w, A), independent(w, A, B), independent(w, A, lambda o: o[0] == 1), mutually_independent(w, [A, B, C]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 True True False\nTrue True",
          "0.5 True True True\nTrue True",
          "0.5 False True False\nTrue False",
          "0.25 True False False\nFalse True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def digits(u, n):
    out = []
    for _ in range(n):
        u *= 2
        d = int(u)
        out.append(d)
        u -= d
    return out

def from_digits(ds):
    return sum(d / 2 ** (k + 1) for k, d in enumerate(ds))

def split_uniform(u, n):
    ds = digits(u, 2 * n)
    return from_digits(ds[0::2]), from_digits(ds[1::2])

print(mutually_independent(w, [lambda o: o[0] == 1, lambda o: o[1] == 1, lambda o: o[2] == 0]), independent(w, A, lambda o: sum(o) >= 2))
print(digits(0.8125, 5), from_digits([0, 1, 1]), split_uniform(0.8125, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 1, 0, 1, 0] 0.375 (0.5, 0.75)\n(0.625, 0.25) [0, 1, 0, 1, 0, 1]",
          "[1, 1, 0, 1, 0] 0.375 (0.75, 0.5)\n(0.25, 0.625) [0, 1, 0, 1, 0, 1]",
          "[1, 1, 0, 1, 0] 0.75 (0.5, 0.75)\n(0.625, 0.25) [0, 1, 0, 1, 0, 1]",
          "[1, 0, 1, 1, 0] 0.375 (0.5, 0.75)\n(0.625, 0.25) [1, 0, 1, 0, 1, 0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          On a finite space given as a dict of weights, with events as predicates on outcomes, write <C>prob(w, A)</C>,{" "}
          <C>independent(w, A, B)</C> and <C>mutually_independent(w, events)</C>, which checks the product rule on every
          subfamily of two or more events.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import combinations

def prob(w, A):
    return 0

def independent(w, A, B, tol=1e-12):
    return False

def mutually_independent(w, events, tol=1e-12):
    return False
`,
        solution: EVENTS,
        tests: [
          { name: "dice", code: `w = {(i, j): 1 / 36 for i in range(1, 7) for j in range(1, 7)}
A = lambda o: o[0] % 2 == 0
assert abs(prob(w, A) - 0.5) < 1e-12 and independent(w, A, lambda o: sum(o) == 7) and not independent(w, A, lambda o: sum(o) == 6)` },
          { name: "mutual", code: `c = {(a, b, d): 1 / 8 for a in (0, 1) for b in (0, 1) for d in (0, 1)}
assert mutually_independent(c, [lambda o: o[0] == 1, lambda o: o[1] == 1, lambda o: o[2] == 1])
assert not mutually_independent(c, [lambda o: o[0] == o[1], lambda o: o[1] == o[2], lambda o: o[0] == o[2]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>digits(u, n)</C> returning the first n binary digits of u in [0, 1), <C>from_digits(ds)</C>, and{" "}
          <C>split_uniform(u, n)</C>, which reads 2n digits and returns the numbers built from the odd-position and
          even-position digits.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def digits(u, n):
    return []

def from_digits(ds):
    return 0.0

def split_uniform(u, n):
    return 0.0, 0.0
`,
        solution: DIGITS,
        tests: [
          { name: "digits", code: `assert digits(0.75, 3) == [1, 1, 0] and digits(0.3, 4) == [0, 1, 0, 0] and abs(from_digits([1, 0, 1]) - 0.625) < 1e-12` },
          { name: "split", code: `v, w = split_uniform(0.6, 2)
assert abs(v - 0.5) < 1e-12 and abs(w - 0.25) < 1e-12 and split_uniform(0.3, 2) == (0.0, 0.5)` },
        ],
      },
    },
    {
      key: "digitcov",
      rung: "stretch",
      prompt: (
        <p>
          U is uniform on [0, 1) and <M>{"d_2"}</M> is its second binary digit. Write <M>{"U = \\sum_k d_k 2^{-k}"}</M> and use independence of
          the digits to compute Cov(U, <M>{"d_2"}</M>). Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0625, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The zero-one law says that an event like &quot;infinitely many of the A_n happen&quot; is certain or impossible when the
        A_n are independent. The Borel-Cantelli lemmas tell you which, from nothing more than the sum of P(A_n).
      </p>
    </>
  ),
};
