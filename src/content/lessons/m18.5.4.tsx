import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UpcrossViz } from "@/components/viz/UpcrossViz";
import type { LessonContent } from "@/lib/types";

const UPCROSS = `def upcrossings(path, a, b):
    count, below = 0, False
    for x in path:
        if x <= a:
            below = True
        elif x >= b and below:
            count += 1
            below = False
    return count

def upcross_bound(dist, a, b):
    return sum(p * max(a - x, 0) for x, p in dist.items()) / (b - a)

def product_path(signs, c):
    path, m = [1.0], 1.0
    for e in signs:
        m *= 1 + c * e
        path.append(m)
    return path`;

const LIMITS = `def series_partial(signs):
    out, s = [], 0.0
    for k, e in enumerate(signs, start=1):
        s += e / k
        out.append(s)
    return out

def tail_variance(n, N):
    return sum(1 / k ** 2 for k in range(n + 1, N + 1))

def dyadic_prediction(c, omega, k):
    n = 2 ** k
    left = int(omega * n) / n
    right = left + 1 / n
    return max(0.0, min(c, right) - left) * n`;

export const lesson: LessonContent = {
  id: "m18.5.4",
  minutes: 50,
  links: {
    requires: ["m18.5.3", "m18.3.4"],
    revisits: ["m18.4.2", "m8.2.5"],
    foreshadows: ["m18.6.1"],
  },

  puzzle: (
    <>
      <p>
        The fraction of red balls in a Pólya urn appears to freeze. A gambler&apos;s fortune under repeated fair bets of half the
        current wealth has mean 1 forever, yet every simulation shows it collapsing to 0. A random walk never settles at all.
        All three are martingales. Which martingales converge, in what sense, and how could you prove that a sequence
        converges without knowing its limit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sequence of numbers fails to converge exactly when it oscillates: it crosses some band [a, b] infinitely often.
        For a martingale, crossing a band upward is like buying below a and selling above b, a strategy that profits b − a
        per crossing. A fair game cannot pay without limit, so a martingale whose size is under control can cross any band
        only finitely often.
      </p>
      <UpcrossViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="upcrossing inequality">
        <p>
          Let X be a supermartingale and <M>{"U_n[a, b]"}</M> the number of completed upcrossings of [a, b] by{" "}
          <M>{"X_0, \\dots, X_n"}</M> (<C>upcrossings</C>). Then
        </p>
        <MD>{"(b - a)\\, \\mathbb E\\, U_n[a, b] \\le \\mathbb E (X_n - a)^-."}</MD>
      </Theorem>
      <Proof>
        <p>
          Bet one unit from the first time X is at most a until the next time it is at least b, then nothing until it is
          at most a again, and so on. The stake <M>{"H_k \\in \\{0, 1\\}"}</M> is predictable, so the gain{" "}
          <M>{"(H \\cdot X)_n"}</M> is a supermartingale with mean at most 0 (m18.5.2). Each completed upcrossing earns at least b − a, and an
          unfinished one loses at most <M>{"(X_n - a)^-"}</M>. So{" "}
          <M>{"0 \\ge \\mathbb E (H \\cdot X)_n \\ge (b - a)\\mathbb E U_n - \\mathbb E(X_n - a)^-"}</M>. For a non-negative supermartingale the right side is at most a (
          <C>upcross_bound</C>).
        </p>
        <Code>{UPCROSS}</Code>
      </Proof>

      <Theorem title="martingale convergence">
        <p>
          If X is a supermartingale with <M>{"\\sup_n \\mathbb E |X_n| < \\infty"}</M>, then <M>{"X_n"}</M> converges almost surely to an integrable
          limit <M>{"X_\\infty"}</M>. In particular every non-negative supermartingale converges almost surely.
        </p>
      </Theorem>
      <Proof>
        <p>
          By monotone convergence <M>{"\\mathbb E U_\\infty[a, b] \\le \\sup_n \\mathbb E|X_n| + |a|"}</M> divided by b − a, which is finite, so{" "}
          <M>{"U_\\infty[a, b] < \\infty"}</M> almost surely. The event that X does not converge in <M>{"[-\\infty, \\infty]"}</M> is the union over rational
          a &lt; b of <M>{"\\{\\liminf X_n < a < b < \\limsup X_n\\}"}</M> (m8.2.5), and each of these countably many events forces infinitely many
          upcrossings, so has probability 0. Fatou&apos;s lemma gives <M>{"\\mathbb E|X_\\infty| \\le \\liminf \\mathbb E|X_n| < \\infty"}</M>, so the limit
          is finite almost surely.
        </p>
      </Proof>

      <Example title="convergence without convergence in mean">
        <p>
          Let <M>{"M_n = \\prod_{k \\le n} (1 + \\tfrac12 \\varepsilon_k)"}</M> with independent fair signs (<C>product_path</C>). It is a non-negative
          martingale with mean 1, so it converges almost surely. By the strong law (m18.6.1),{" "}
          <M>{"\\tfrac1n \\log M_n \\to \\mathbb E \\log(1 + \\tfrac12\\varepsilon) < 0"}</M>, so the limit is 0. Mean 1 for every n, limit 0: the
          convergence is not in <M>{"L^1"}</M>.
        </p>
      </Example>

      <Theorem title="uniform integrability and closed martingales">
        <p>For a martingale M the following are equivalent:</p>
        <ul>
          <li>M is uniformly integrable;</li>
          <li><M>{"M_n \\to M_\\infty"}</M> almost surely and in <M>{"L^1"}</M>;</li>
          <li><M>{"M_n = \\mathbb E[X \\mid \\mathcal F_n]"}</M> for some integrable X.</li>
        </ul>
        <p>
          Then one can take <M>{"X = M_\\infty"}</M>, and Lévy&apos;s upward theorem holds: <M>{"\\mathbb E[X \\mid \\mathcal F_n] \\to \\mathbb E[X \\mid \\mathcal F_\\infty]"}</M>{" "}
          almost surely and in <M>{"L^1"}</M>, where <M>{"\\mathcal F_\\infty = \\sigma(\\bigcup_n \\mathcal F_n)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Uniform integrability bounds <M>{"\\mathbb E|M_n|"}</M>, so the almost sure limit exists, and almost sure convergence plus uniform
          integrability is <M>{"L^1"}</M> convergence (m18.3.4). Then <M>{"\\mathbb E[M_\\infty \\mathbb 1_A] = \\lim_m \\mathbb E[M_m \\mathbb 1_A] = \\mathbb E[M_n \\mathbb 1_A]"}</M>{" "}
          for <M>{"A \\in \\mathcal F_n"}</M>, which is the third statement. Conversely, conditional expectations of one integrable X are uniformly
          integrable, by conditional Jensen and Markov&apos;s inequality. For Lévy&apos;s theorem, the two sides integrate equally over the
          π-system <M>{"\\bigcup_n \\mathcal F_n"}</M>, and Dynkin&apos;s theorem extends this to <M>{"\\mathcal F_\\infty"}</M>.
        </p>
      </Proof>

      <Remark title="three consequences">
        <p>
          The dyadic ratios of m18.4.2 are the Doob martingale <M>{"\\mathbb E[f \\mid \\mathcal G_k]"}</M>, so they converge to f almost everywhere; for an
          indicator <M>{"f = \\mathbb 1[U < c]"}</M> this is <C>dyadic_prediction</C>. A martingale bounded in <M>{"L^2"}</M> has orthogonal increments, so{" "}
          <M>{"\\mathbb E M_n^2 = \\mathbb E M_0^2 + \\sum_k \\mathbb E(M_k - M_{k-1})^2"}</M> and it converges in <M>{"L^2"}</M> as well: the random harmonic series{" "}
          <M>{"\\sum \\varepsilon_k / k"}</M> converges almost surely, with tail variance <M>{"\\sum_{k > n} 1/k^2"}</M> (<C>series_partial</C>,{" "}
          <C>tail_variance</C>). And the Pólya fraction, bounded between 0 and 1, converges to a random limit.
        </p>
        <Code>{LIMITS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: <p>M is a non-negative martingale. What bound does the upcrossing inequality give on the expected number of upcrossings of [3, 7]?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "series",
      rung: "check",
      prompt: <p>The εₖ are independent fair ±1 signs. Compute the variance of the almost sure limit of Σ εₖ/k. Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.6449, tolerance: 0.0001 },
    },
    {
      key: "ui",
      rung: "apply",
      prompt: <p>A non-negative martingale has mean 1 for every n and converges almost surely to 0. What can you conclude?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is not uniformly integrable, and it is not E[X | Fₙ] for any integrable X",
          "This is impossible for a martingale",
          "It converges to 0 in L¹ as well",
          "The upcrossing inequality fails for it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def upcrossings(path, a, b):
    count, below = 0, False
    for x in path:
        if x <= a:
            below = True
        elif x >= b and below:
            count += 1
            below = False
    return count

def upcross_bound(dist, a, b):
    return sum(p * max(a - x, 0) for x, p in dist.items()) / (b - a)

def product_path(signs, c):
    path, m = [1.0], 1.0
    for e in signs:
        m *= 1 + c * e
        path.append(m)
    return path

print(upcrossings([0, 2, 0, 2, 1, 2], 0, 2), upcrossings([1, 3, 0, 1, 3, 0], 0.5, 2.5), upcrossings([0, 1, 2, 3], 1, 2), upcross_bound({0: 0.5, 2: 0.5}, 1, 3))
print(product_path([1, -1, 1], 0.5), product_path([-1, -1], 1.0), upcross_bound({5: 1.0}, 1, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 1 1 0.25\n[1.0, 1.5, 0.75, 1.125] [1.0, 0.0, 0.0] 0.0",
          "2 2 1 0.25\n[1.0, 1.5, 0.75, 1.125] [1.0, 0.0, 0.0] 0.0",
          "3 1 1 0.5\n[1.0, 1.5, 0.75, 1.125] [1.0, 0.0, 0.0] 0.0",
          "2 1 0 0.25\n[1.5, 0.75, 1.125] [0.0, 0.0] 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def series_partial(signs):
    out, s = [], 0.0
    for k, e in enumerate(signs, start=1):
        s += e / k
        out.append(s)
    return out

def tail_variance(n, N):
    return sum(1 / k ** 2 for k in range(n + 1, N + 1))

def dyadic_prediction(c, omega, k):
    n = 2 ** k
    left = int(omega * n) / n
    right = left + 1 / n
    return max(0.0, min(c, right) - left) * n

print([round(v, 4) for v in series_partial([1, -1, 1, 1])], round(tail_variance(2, 4), 4), tail_variance(3, 3))
print(dyadic_prediction(0.3, 0.1, 1), round(dyadic_prediction(0.3, 0.1, 2), 4), dyadic_prediction(0.3, 0.1, 3), dyadic_prediction(0.3, 0.6, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.5, 0.8333, 1.0833] 0.1736 0\n0.6 1.0 1.0 0.0",
          "[1.0, 0.5, 0.8333, 1.0833] 0.1736 0\n0.3 1.0 1.0 0.0",
          "[1.0, 0.0, 1.0, 2.0] 0.1736 0\n0.6 1.0 1.0 0.0",
          "[1.0, 0.5, 0.8333, 1.0833] 0.3611 0.1111\n0.6 0.3 0.3 0.6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>upcrossings(path, a, b)</C>, counting completed upcrossings (a value at most a followed later by a value at
          least b); <C>upcross_bound(dist, a, b)</C>, the bound <M>{"\\mathbb E(X_n - a)^-/(b - a)"}</M> for the law of <M>{"X_n"}</M> as a dict; and{" "}
          <C>product_path(signs, c)</C>, the path of products of 1 + c·ε starting from 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def upcrossings(path, a, b):
    return 0

def upcross_bound(dist, a, b):
    return 0.0

def product_path(signs, c):
    return [1.0]
`,
        solution: UPCROSS,
        tests: [
          { name: "count", code: `assert upcrossings([0, 3, 0, 3, 0, 3], 1, 2) == 3 and upcrossings([2, 0, 2], 1, 2) == 1 and upcrossings([2, 3, 2], 1, 2) == 0` },
          { name: "bound", code: `assert abs(upcross_bound({0: 0.25, 4: 0.75}, 2, 6) - 0.125) < 1e-12 and product_path([1, 1], 1.0) == [1.0, 2.0, 4.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>series_partial(signs)</C>, the partial sums of εₖ/k for k from 1; <C>tail_variance(n, N)</C>, the sum of 1/k² for
          n &lt; k ≤ N; and <C>dyadic_prediction(c, omega, k)</C>, the value at ω of E[1[U &lt; c] | G_k] for the dyadic σ-algebra of level k.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def series_partial(signs):
    return []

def tail_variance(n, N):
    return 0.0

def dyadic_prediction(c, omega, k):
    return 0.0
`,
        solution: LIMITS,
        tests: [
          { name: "series", code: `s = series_partial([1, 1, -1])
assert len(s) == 3 and abs(s[2] - 7 / 6) < 1e-12 and abs(tail_variance(1, 2) - 0.25) < 1e-12` },
          { name: "prediction", code: `assert abs(dyadic_prediction(0.75, 0.6, 1) - 0.5) < 1e-12 and dyadic_prediction(0.75, 0.9, 2) == 0.0 and abs(dyadic_prediction(0.75, 0.7, 2) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "rate",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"M_n = \\prod_{k \\le n}(1 + \\tfrac12\\varepsilon_k)"}</M> with fair signs, compute the almost sure limit of{" "}
          <M>{"\\tfrac1n \\log M_n"}</M>. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.1438, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Martingales and the Borel-Cantelli lemmas are the tools; Part 6 uses them for the classical limit theorems, starting
        with the strong law of large numbers.
      </p>
    </>
  ),
};
