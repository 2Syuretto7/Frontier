import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ThomaeViz } from "@/components/viz/ThomaeViz";
import type { LessonContent } from "@/lib/types";

const MONO = `def gap_monotone(f, a, b, n):
    return abs(f(b) - f(a)) * (b - a) / n

def n_needed(f, a, b, eps):
    n = 1
    while gap_monotone(f, a, b, n) >= eps:
        n += 1
    return n`;

const THOMAE = `from fractions import Fraction
from math import gcd

def big_points(eps):
    pts, q = [], 1
    while 1 / q >= eps:
        pts += [Fraction(p, q) for p in range(q + 1) if gcd(p, q) == 1]
        q += 1
    return sorted(pts)

def thomae(x):
    return Fraction(1, Fraction(x).denominator)`;

export const lesson: LessonContent = {
  id: "m8.7.2",
  minutes: 65,
  links: {
    requires: ["m8.7.1", "m8.5.3"],
    revisits: ["m2.6.2"],
    foreshadows: ["m8.7.3", "m8.8.2"],
  },

  puzzle: (
    <>
      <p>
        Thomae&apos;s function is 1/q at a rational p/q in lowest terms and 0 at irrationals. It is discontinuous at every
        rational, a dense set of points, yet continuous at every irrational. The rational indicator, discontinuous everywhere,
        has no integral. Does Thomae&apos;s function have one? It does, and its integral is 0. The tool that decides such
        questions is a criterion that needs only one good partition.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        U − L is a sum of oscillation times width over the cells. To make it small you need, for each tolerance, cells where
        the function hardly varies, plus a few bad cells of tiny total width. Continuous functions have no bad cells once the
        mesh is fine; monotone functions have bounded total oscillation; Thomae&apos;s function has only finitely many points
        above any level.
      </p>
      <ThomaeViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="integrability criterion">
        <p>
          A bounded f on [a, b] is integrable if and only if for every ε &gt; 0 there is a partition P with{" "}
          <M>{"U(f, P) - L(f, P) < \\varepsilon"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (⇐) For such P, <M>{"U(f) - L(f) \\leq U(f, P) - L(f, P) < \\varepsilon"}</M>; ε is arbitrary and U(f) ≥ L(f), so they
          are equal. (⇒) If U(f) = L(f), choose <M>{"P_1"}</M> with <M>{"U(f, P_1) < U(f) + \\varepsilon/2"}</M> and{" "}
          <M>{"P_2"}</M> with <M>{"L(f, P_2) > L(f) - \\varepsilon/2"}</M>. Their common refinement P satisfies both, by the
          refinement lemma, so U(f, P) − L(f, P) &lt; ε.
        </p>
      </Proof>

      <Theorem title="continuous functions are integrable">
        <p>Every continuous f on [a, b] is integrable.</p>
      </Theorem>
      <Proof>
        <p>
          f is uniformly continuous on the compact [a, b]: there is δ with |f(x) − f(y)| &lt; ε/(b − a) when |x − y| &lt; δ. On
          any partition with all cells shorter than δ, the extreme value theorem gives points in each cell where f attains{" "}
          <M>{"M_k"}</M> and <M>{"m_k"}</M>, so <M>{"M_k - m_k < \\varepsilon/(b-a)"}</M> and{" "}
          <M>{"U - L < \\sum_k \\frac{\\varepsilon}{b-a}(x_k - x_{k-1}) = \\varepsilon"}</M>.
        </p>
      </Proof>

      <Theorem title="monotone functions are integrable">
        <p>Every monotone f on [a, b] is integrable.</p>
      </Theorem>
      <Proof>
        <p>
          Say f is increasing, and use n equal cells of width h = (b − a)/n. Then <M>{"M_k = f(x_k)"}</M> and{" "}
          <M>{"m_k = f(x_{k-1})"}</M>, and the sum telescopes:
        </p>
        <MD>{"U - L = h \\sum_{k=1}^n \\big(f(x_k) - f(x_{k-1})\\big) = \\frac{(f(b) - f(a))(b - a)}{n},"}</MD>
        <p>
          which is below ε for large n. A monotone function can have countably many jumps, so this covers many discontinuous
          functions. The code finds the smallest such n.
        </p>
        <Code>{MONO}</Code>
      </Proof>

      <Theorem title="finitely many discontinuities">
        <p>A bounded function on [a, b] that is continuous except at finitely many points is integrable.</p>
      </Theorem>
      <Proof>
        <p>
          Let |f| ≤ B and let the bad points be <M>{"c_1, \\dots, c_N"}</M>. Put a cell of width ε/(4NB) around each; together
          they contribute at most 2B·N·ε/(4NB) = ε/2 to U − L. The rest of [a, b] is a finite union of closed intervals on which
          f is continuous, and there a fine enough partition contributes less than ε/2, by the previous theorem.
        </p>
      </Proof>

      <Example title="Thomae's function">
        <p>
          Fix ε. Only finitely many rationals, say N of them, have 1/q ≥ ε. Cover each by a cell of total width at most ε; these
          contribute at most ε to U(f, P) since f ≤ 1. On every other cell f &lt; ε, contributing less than ε(b − a). Every
          infimum is 0 because irrationals are dense, so L(f, P) = 0 and U(f, P) &lt; 2ε. Hence the integral exists and is 0.
        </p>
        <Code>{THOMAE}</Code>
      </Example>

      <Remark title="properties and Lebesgue's criterion">
        <p>
          The integral is linear, monotone (f ≤ g implies <M>{"\\int f \\leq \\int g"}</M>), and additive over adjacent
          intervals; each follows from the corresponding inequalities between upper and lower sums. The final word is
          Lebesgue&apos;s criterion: a bounded function is Riemann integrable exactly when its set of discontinuities can be covered
          by intervals of arbitrarily small total length. The rationals pass that test, which is why Thomae&apos;s function is
          integrable; the rational indicator is discontinuous everywhere and fails it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "n",
      rung: "check",
      prompt: <p>For f(x) = x² on [0, 1] with equal cells, what is the smallest n with U − L &lt; 0.01?</p>,
      answer: { kind: "numeric", value: 101, tolerance: 0.0001 },
    },
    {
      key: "count",
      rung: "check",
      prompt: <p>How many points of [0, 1] have Thomae&apos;s function value at least 1/5?</p>,
      answer: { kind: "numeric", value: 11, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these functions is Riemann integrable on [0, 1]?</p>,
      answer: {
        kind: "choice",
        options: [
          "Thomae's function",
          "the indicator of the rationals",
          "the indicator of the rationals whose denominator is a power of 2",
          "1/x for x > 0, with value 0 at 0",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gap_monotone(f, a, b, n):
    return abs(f(b) - f(a)) * (b - a) / n

def n_needed(f, a, b, eps):
    n = 1
    while gap_monotone(f, a, b, n) >= eps:
        n += 1
    return n

print(gap_monotone(lambda x: x * x, 0, 1, 10), n_needed(lambda x: x * x, 0, 1, 0.01))
print(n_needed(lambda x: x * x * x, 0, 2, 0.1), n_needed(lambda x: -x, 0, 1, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.1 101\n161 3", "0.1 100\n160 2", "0.1 101\n161 1", "0.01 101\n161 3"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
from math import gcd

def big_points(eps):
    pts, q = [], 1
    while 1 / q >= eps:
        pts += [Fraction(p, q) for p in range(q + 1) if gcd(p, q) == 1]
        q += 1
    return sorted(pts)

def thomae(x):
    return Fraction(1, Fraction(x).denominator)

print([str(p) for p in big_points(0.25)])
print(len(big_points(0.1)), thomae(Fraction(6, 8)), thomae(0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['0', '1/4', '1/3', '1/2', '2/3', '3/4', '1']\n33 1/4 1/2",
          "['0', '1/4', '1/3', '1/2', '2/4', '2/3', '3/4', '1']\n33 1/4 1/2",
          "['0', '1/4', '1/3', '1/2', '2/3', '3/4', '1']\n33 1/8 1/2",
          "['1/4', '1/3', '1/2', '2/3', '3/4']\n31 1/4 1/2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For monotone f on [a, b] with n equal cells, write <C>gap_monotone(f, a, b, n)</C>, returning |f(b) − f(a)|·(b − a)/n,
          which equals U − L, and <C>n_needed(f, a, b, eps)</C>, the smallest n ≥ 1 with gap below eps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def gap_monotone(f, a, b, n):
    return 0

def n_needed(f, a, b, eps):
    return 1
`,
        solution: MONO,
        tests: [
          { name: "gap", code: `assert gap_monotone(lambda x: 3 * x, 0, 2, 4) == 3.0` },
          { name: "needed", code: `assert n_needed(lambda x: x, 0, 1, 0.3) == 4 and n_needed(lambda x: -2 * x, 0, 1, 0.5) == 5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using fractions.Fraction, write <C>big_points(eps)</C>, the sorted list of all p/q in [0, 1] in lowest terms with
          1/q ≥ eps (going through q = 1, 2, … while 1/q ≥ eps), and <C>thomae(x)</C>, returning Fraction(1, q) where q is the
          denominator of the rational x in lowest terms.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction
from math import gcd

def big_points(eps):
    return []

def thomae(x):
    return Fraction(0)
`,
        solution: THOMAE,
        tests: [
          { name: "points", code: `assert [str(p) for p in big_points(0.5)] == ['0', '1/2', '1'] and len(big_points(1 / 3)) == 5` },
          { name: "thomae", code: `from fractions import Fraction
assert thomae(Fraction(3, 9)) == Fraction(1, 3) and thomae(1) == 1 and thomae(0.25) == Fraction(1, 4)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that an increasing function on [a, b] is Riemann integrable.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses a partition into n equal cells and notes that on each cell the supremum is f(x_k) and the infimum f(x_(k−1)).",
          "Telescopes U − L to (f(b) − f(a))(b − a)/n.",
          "Chooses n large enough that this is below ε and applies the integrability criterion.",
        ],
      },
    },
    {
      key: "exp",
      rung: "stretch",
      prompt: <p>For eˣ on [0, 1] with equal cells, what is the smallest n with U − L &lt; 0.01?</p>,
      answer: { kind: "numeric", value: 172, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the ε-criterion for integrability and why one good partition suffices, why continuous and monotone functions pass it, how finitely many discontinuities are handled, and why Thomae's function is integrable with integral 0.",

  glimpse: (
    <>
      <p>
        With integrability settled, the next lesson proves the theorem that makes integrals computable: integrating a
        derivative recovers the change in the function, and differentiating an integral recovers the integrand.
      </p>
    </>
  ),
};
