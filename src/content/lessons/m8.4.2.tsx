import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OpenCoverViz } from "@/components/viz/OpenCoverViz";
import type { LessonContent } from "@/lib/types";

const GREEDY = `def greedy_subcover(cover, a, b):
    chosen, p = [], a
    while p <= b:
        cands = [(l, r) for l, r in cover if l < p < r]
        if not cands:
            return None
        best = max(cands, key=lambda iv: iv[1])
        chosen.append(best)
        p = best[1]
    return chosen

def covers(cover, xs):
    return all(any(l < x < r for l, r in cover) for x in xs)`;

const LEB = `def radius_at(cover, x):
    return max([min(x - l, r - x) for l, r in cover if l < x < r], default=0)

def lebesgue_number(cover, xs):
    return min(radius_at(cover, x) for x in xs)`;

export const lesson: LessonContent = {
  id: "m8.4.2",
  minutes: 65,
  links: {
    requires: ["m8.4.1", "m8.2.3"],
    revisits: ["m2.3.3"],
    foreshadows: ["m8.5.2", "m8.5.3", "m8.9.2"],
  },

  puzzle: (
    <>
      <p>
        Many proofs need to pass from local information to global: a function is bounded near each point, so is it bounded
        everywhere? On [0, 1] yes, on (0, 1) not necessarily (think of 1/x). The property that lets local become global is
        compactness, and it has two faces: every sequence has a convergent subsequence, and every open cover has a finite
        subcover.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If each point of a set has a small open interval around it where something good holds, and the set is compact,
        finitely many of these intervals already cover it. Finitely many local guarantees combine into a global one, by
        taking a maximum or minimum. On (0, 1) the intervals can shrink towards the missing endpoint, and no finite
        collection suffices.
      </p>
      <OpenCoverViz />
    </>
  ),

  theory: (
    <>
      <Definition title="compactness">
        <p>
          K ⊆ ℝ is compact if every sequence in K has a subsequence converging to a limit in K. An open cover of K is a family
          of open sets whose union contains K; a finite subcover is a finite subfamily that still covers K.
        </p>
      </Definition>

      <Theorem title="compact means closed and bounded">
        <p>A set K ⊆ ℝ is compact if and only if it is closed and bounded.</p>
      </Theorem>
      <Proof>
        <p>
          If K is closed and bounded, a sequence in K is bounded, so by Bolzano–Weierstrass a subsequence converges; its limit
          lies in K because K is closed. Conversely, if K is unbounded, pick <M>{"x_n \\in K"}</M> with <M>{"|x_n| > n"}</M>; no
          subsequence is bounded, so none converges. If K is not closed, some limit point x ∉ K is the limit of a sequence in
          K; every subsequence also tends to x ∉ K.
        </p>
      </Proof>

      <Theorem title="Heine–Borel">
        <p>For K ⊆ ℝ the following are equivalent:</p>
        <ol>
          <li>K is compact (sequentially);</li>
          <li>K is closed and bounded;</li>
          <li>every open cover of K has a finite subcover.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          (1) ⇔ (2) is the previous theorem. (2) ⇒ (3): suppose an open cover {"{O_λ}"} of K has no finite subcover. K ⊆ [a, b]
          for some a, b. Halve [a, b]; the part of K in at least one closed half cannot be finitely covered; call that half{" "}
          <M>{"I_1"}</M>. Repeating gives nested closed intervals <M>{"I_n"}</M> of length <M>{"(b - a)/2^n"}</M>, each meeting K in
          a set with no finite subcover (in particular a non-empty one). Pick <M>{"x_n \\in K \\cap I_n"}</M>; they converge to the
          common point x of the intervals, and x ∈ K since K is closed. So x lies in some <M>{"O_{\\lambda_0}"}</M>, which
          contains a neighbourhood <M>{"V_\\varepsilon(x)"}</M>, which contains <M>{"I_n"}</M> once its length is below ε. Then the
          single set <M>{"O_{\\lambda_0}"}</M> covers <M>{"K \\cap I_n"}</M>, a contradiction.
        </p>
        <p>
          (3) ⇒ (2): the cover by <M>{"(-n, n)"}</M> has a finite subcover, so K is bounded. If x were a limit point of K not in
          K, the open sets <M>{"\\{y : |y - x| > 1/n\\}"}</M> would cover K (since x ∉ K), and a finite subfamily would miss a
          whole neighbourhood of x, which contains points of K.
        </p>
        <Code>{GREEDY}</Code>
      </Proof>

      <Example title="no finite subcover">
        <p>
          The intervals <M>{"(1/n, 1)"}</M>, n ≥ 2, cover (0, 1), but finitely many of them have a largest index N and miss{" "}
          <M>{"(0, 1/N]"}</M>. The intervals (n − 1, n + 1) cover ℕ but no finite subfamily does. Both sets fail (2).
        </p>
      </Example>

      <Theorem title="Lebesgue number">
        <p>
          If K is compact and {"{O_λ}"} an open cover, there is δ &gt; 0 such that every subset of K of diameter less than δ lies
          in a single <M>{"O_\\lambda"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If not, for each n pick <M>{"x_n, y_n \\in K"}</M> with <M>{"|x_n - y_n| < 1/n"}</M> and no single{" "}
          <M>{"O_\\lambda"}</M> containing both. A subsequence <M>{"x_{n_k} \\to x \\in K"}</M>, and then{" "}
          <M>{"y_{n_k} \\to x"}</M> too. x lies in some <M>{"O_\\lambda"}</M>, which contains a neighbourhood of x, hence both{" "}
          <M>{"x_{n_k}"}</M> and <M>{"y_{n_k}"}</M> for large k: a contradiction.
        </p>
        <Code>{LEB}</Code>
      </Proof>

      <Remark title="beyond the line">
        <p>
          Closed and bounded implies compact also in ℝⁿ, but not in infinite-dimensional spaces: the unit vectors{" "}
          <M>{"e_1, e_2, \\dots"}</M> of sequence space are bounded, form a closed set, and are all at distance √2 apart, so no
          subsequence converges. In general spaces the open-cover definition is the one that survives, which is why it is
          worth knowing even on the line.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: (
        <p>
          The cover (−0.1, 0.3), (0.2, 0.5), (0.25, 0.4), (0.45, 0.8), (0.7, 1.1), (0.5, 0.6) of [0, 1] is swept from the left,
          each time taking the interval containing the current point that reaches furthest right. How many intervals are used?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "check",
      prompt: <p>The intervals (1/n, 1) for n = 2, …, 11 leave the interval (0, a] of (0, 1) uncovered. What is a? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0909, tolerance: 0.0001 },
    },
    {
      key: "compact",
      rung: "apply",
      prompt: <p>Which of these sets is compact?</p>,
      answer: { kind: "choice", options: ["The Cantor set", "(0, 1)", "ℤ", "ℚ ∩ [0, 1]"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def greedy_subcover(cover, a, b):
    chosen, p = [], a
    while p <= b:
        cands = [(l, r) for l, r in cover if l < p < r]
        if not cands:
            return None
        best = max(cands, key=lambda iv: iv[1])
        chosen.append(best)
        p = best[1]
    return chosen

def covers(cover, xs):
    return all(any(l < x < r for l, r in cover) for x in xs)

cover = [(-0.1, 0.3), (0.2, 0.5), (0.25, 0.4), (0.45, 0.8), (0.7, 1.1), (0.5, 0.6)]
print(greedy_subcover(cover, 0, 1), covers(cover, [i / 100 for i in range(101)]))
tail = [(1 / n, 1.5) for n in range(2, 51)]
print(greedy_subcover(tail, 0.01, 1), len(greedy_subcover(tail, 0.05, 1)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(-0.1, 0.3), (0.2, 0.5), (0.45, 0.8), (0.7, 1.1)] True\nNone 1",
          "[(-0.1, 0.3), (0.25, 0.4), (0.45, 0.8), (0.7, 1.1)] True\nNone 1",
          "[(-0.1, 0.3), (0.2, 0.5), (0.45, 0.8), (0.7, 1.1)] False\nNone 1",
          "[(-0.1, 0.3), (0.2, 0.5), (0.45, 0.8), (0.7, 1.1)] True\nNone 20",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def radius_at(cover, x):
    return max([min(x - l, r - x) for l, r in cover if l < x < r], default=0)

def lebesgue_number(cover, xs):
    return min(radius_at(cover, x) for x in xs)

cover = [(-0.1, 0.3), (0.2, 0.5), (0.25, 0.4), (0.45, 0.8), (0.7, 1.1), (0.5, 0.6)]
print(round(radius_at(cover, 0.3), 3), round(lebesgue_number(cover, [i / 100 for i in range(101)]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.1 0.03", "0.2 0.03", "0.1 0.0", "0.1 0.05"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Covers are lists of open intervals (l, r). Write <C>greedy_subcover(cover, a, b)</C>: starting at p = a, repeatedly
          take the interval with l &lt; p &lt; r reaching furthest right and move p to its right end, until p &gt; b; return the
          chosen intervals, or None if some p is uncovered. Also write <C>covers(cover, xs)</C>, testing that every point of xs
          lies in some interval.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def greedy_subcover(cover, a, b):
    return []

def covers(cover, xs):
    return True
`,
        solution: GREEDY,
        tests: [
          { name: "greedy", code: `cov = [(-1, 0.5), (0.4, 0.9), (0.3, 0.6), (0.8, 2)]
assert greedy_subcover(cov, 0, 1) == [(-1, 0.5), (0.4, 0.9), (0.8, 2)]
assert greedy_subcover([(-1, 0.5), (0.5, 2)], 0, 1) is None
assert greedy_subcover([(1 / n, 1.5) for n in range(2, 30)], 0.01, 1) is None` },
          { name: "covers", code: `assert covers([(0, 1), (0.9, 2)], [0.5, 1, 1.5]) and not covers([(0, 1)], [0, 0.5])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>radius_at(cover, x)</C>, the largest distance from x to the complement of a single interval of the cover
          containing x (0 if none contains it), and <C>lebesgue_number(cover, xs)</C>, the smallest radius_at over the points
          xs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def radius_at(cover, x):
    return 0

def lebesgue_number(cover, xs):
    return 0
`,
        solution: LEB,
        tests: [
          { name: "radius", code: `cov = [(-1, 0.6), (0.4, 2)]
assert abs(radius_at(cov, 0.5) - 0.1) < 1e-12 and abs(radius_at(cov, 0) - 0.6) < 1e-12 and radius_at(cov, 3) == 0` },
          { name: "lebesgue", code: `cov = [(-1, 0.6), (0.4, 2)]
xs = [i / 1000 for i in range(1001)]
assert abs(lebesgue_number(cov, xs) - 0.1) < 1e-9 and lebesgue_number([(0, 1)], [0.0, 0.5]) == 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a closed and bounded set K ⊆ ℝ is sequentially compact.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes a sequence in K and notes it is bounded because K is.",
          "Applies Bolzano–Weierstrass to get a convergent subsequence.",
          "Uses that K is closed (contains limits of its convergent sequences) to place the limit in K.",
        ],
      },
    },
    {
      key: "leb",
      rung: "stretch",
      prompt: <p>What is the Lebesgue number of the cover {"{(−1, 0.6), (0.4, 2)}"} of [0, 1], in the sense of the smallest radius_at over [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the two definitions of compactness, why on the line they both mean closed and bounded, the bisection proof that closed bounded sets have finite subcovers, and why (0, 1) fails.",

  glimpse: (
    <>
      <p>
        One more property of intervals remains: they come in one piece. The next lesson defines connected sets and shows the
        connected subsets of ℝ are exactly the intervals, the fact behind the intermediate value theorem.
      </p>
    </>
  ),
};
