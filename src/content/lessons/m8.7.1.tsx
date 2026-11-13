import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RefineSumViz } from "@/components/viz/RefineSumViz";
import type { LessonContent } from "@/lib/types";

const DARBOUX = `def darboux_monotone(f, P):
    L = sum(f(u) * (v - u) for u, v in zip(P, P[1:]))
    U = sum(f(v) * (v - u) for u, v in zip(P, P[1:]))
    return L, U

def refine(P, Q):
    return sorted(set(P) | set(Q))`;

const OSC = `def partition(a, b, n):
    return [a + (b - a) * i / n for i in range(n + 1)]

def osc_sum(f, P, m=100):
    total = 0.0
    for u, v in zip(P, P[1:]):
        ys = [f(u + (v - u) * j / m) for j in range(m + 1)]
        total += (max(ys) - min(ys)) * (v - u)
    return total`;

export const lesson: LessonContent = {
  id: "m8.7.1",
  minutes: 60,
  links: {
    requires: ["m8.1.2", "m8.5.2"],
    revisits: ["m2.6.1", "m2.6.2"],
    foreshadows: ["m8.7.2", "m8.7.3"],
  },

  puzzle: (
    <>
      <p>
        The function that is 1 at rational points and 0 at irrational points is bounded on [0, 1]. What is its integral?
        Riemann sums with sample points chosen at rationals give 1, at irrationals 0, whatever the partition. Before deciding
        that some functions have no integral, we need a definition of the integral precise enough to say so, and to prove the
        familiar ones do have one.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Trap the area between two staircase approximations: one built from the lowest value of f on each cell, lying
        below the graph, and one from the highest, lying above. Refining the partition squeezes the two together. The
        function is integrable when the squeeze leaves no room, and the integral is the number trapped in between.
      </p>
      <RefineSumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="partitions and Darboux sums">
        <p>
          A partition of [a, b] is a finite set <M>{"P = \\{a = x_0 < x_1 < \\dots < x_n = b\\}"}</M>. For bounded f let{" "}
          <M>{"m_k = \\inf\\{f(x) : x \\in [x_{k-1}, x_k]\\}"}</M> and <M>{"M_k"}</M> the supremum, which exist by completeness.
          The lower and upper sums are
        </p>
        <MD>{"L(f, P) = \\sum_{k=1}^n m_k (x_k - x_{k-1}), \\qquad U(f, P) = \\sum_{k=1}^n M_k (x_k - x_{k-1})."}</MD>
        <p>A refinement of P is a partition Q ⊇ P.</p>
      </Definition>

      <Theorem title="refinement lemma">
        <p>If Q refines P then <M>{"L(f, P) \\leq L(f, Q) \\leq U(f, Q) \\leq U(f, P)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          It suffices to add one point z to a cell <M>{"[x_{k-1}, x_k]"}</M>. The infimum over each of the two new pieces is at
          least the infimum over the whole cell, so the cell&apos;s contribution{" "}
          <M>{"m_k(x_k - x_{k-1})"}</M> becomes <M>{"m'(z - x_{k-1}) + m''(x_k - z) \\geq m_k(x_k - x_{k-1})"}</M>. Upper sums are
          symmetric, and L ≤ U because <M>{"m_k \\leq M_k"}</M>. Adding the points of Q one at a time gives the claim.
        </p>
      </Proof>

      <Theorem title="every lower sum is below every upper sum">
        <p>For any partitions P₁ and P₂, <M>{"L(f, P_1) \\leq U(f, P_2)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Let Q = P₁ ∪ P₂, a common refinement. Then <M>{"L(f, P_1) \\leq L(f, Q) \\leq U(f, Q) \\leq U(f, P_2)"}</M>.
        </p>
      </Proof>

      <Definition title="the integral">
        <p>
          The lower integral L(f) is the supremum of all lower sums and the upper integral U(f) the infimum of all upper
          sums; by the last theorem L(f) ≤ U(f). f is Riemann integrable when they are equal, and the common value is{" "}
          <M>{"\\int_a^b f"}</M>.
        </p>
      </Definition>

      <Example title="x² on [0, 1]">
        <p>
          For an increasing function the infimum and supremum on a cell are its endpoint values, so the sums are easy to compute.
          With n equal cells, <M>{"L = \\sum_{k=1}^n \\frac{(k-1)^2}{n^3} = \\frac{(n-1)n(2n-1)}{6n^3}"}</M> and U is the same with
          k in place of k − 1, giving <M>{"(n+1)n(2n+1)/(6n^3)"}</M>. Both tend to 1/3, so L(f) ≥ 1/3 ≥ U(f), and the integral is
          1/3.
        </p>
        <Code>{DARBOUX}</Code>
      </Example>

      <Example title="the rational indicator">
        <p>
          Every cell contains rationals and irrationals, so <M>{"m_k = 0"}</M> and <M>{"M_k = 1"}</M> on every partition. Every
          lower sum is 0 and every upper sum is 1; the lower integral is 0, the upper is 1, and the function is not Riemann
          integrable. The Lebesgue integral of measure theory does assign it the value 0.
        </p>
      </Example>

      <Remark title="estimating U − L">
        <p>
          U − L is the sum over cells of the oscillation <M>{"M_k - m_k"}</M> times the width. For a general function the
          infimum and supremum on a cell are not available, but sampling each cell finely gives an estimate (exact for
          continuous monotone pieces when the cell endpoints are sampled). For sin it shrinks like 1/n; for a single jump, the
          cell containing the jump contributes its height times its width, which also shrinks.
        </p>
        <Code>{OSC}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "low",
      rung: "check",
      prompt: <p>What is L(f, P) for f(x) = x² on [0, 1] with P = {"{0, 0.5, 1}"}?</p>,
      answer: { kind: "numeric", value: 0.125, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "check",
      prompt: <p>For f(x) = x² on [0, 1] with 4 equal cells, what is U(f, P) − L(f, P)?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "dirichlet",
      rung: "apply",
      prompt: <p>For the function equal to 1 at rationals and 0 at irrationals on [0, 1], which is true?</p>,
      answer: {
        kind: "choice",
        options: ["The lower integral is 0 and the upper integral is 1", "Both are 0, since the rationals are countable", "Both are 1, since the rationals are dense", "The upper integral is 1/2"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def darboux_monotone(f, P):
    L = sum(f(u) * (v - u) for u, v in zip(P, P[1:]))
    U = sum(f(v) * (v - u) for u, v in zip(P, P[1:]))
    return L, U

def refine(P, Q):
    return sorted(set(P) | set(Q))

f = lambda x: x * x
print(darboux_monotone(f, [0, 0.5, 1]), darboux_monotone(f, refine([0, 0.5, 1], [0.25, 0.75])))
print(refine([0, 0.5, 1], [0.5, 0.2]), darboux_monotone(lambda x: x, [0, 0.25, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.125, 0.625) (0.21875, 0.46875)\n[0, 0.2, 0.5, 1] (0.1875, 0.8125)",
          "(0.125, 0.625) (0.21875, 0.46875)\n[0, 0.2, 0.5, 0.5, 1] (0.1875, 0.8125)",
          "(0.125, 0.625) (0.0625, 0.5625)\n[0, 0.2, 0.5, 1] (0.1875, 0.8125)",
          "(0.625, 0.125) (0.46875, 0.21875)\n[0, 0.2, 0.5, 1] (0.8125, 0.1875)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def partition(a, b, n):
    return [a + (b - a) * i / n for i in range(n + 1)]

def osc_sum(f, P, m=100):
    total = 0.0
    for u, v in zip(P, P[1:]):
        ys = [f(u + (v - u) * j / m) for j in range(m + 1)]
        total += (max(ys) - min(ys)) * (v - u)
    return total

print(round(osc_sum(math.sin, partition(0, math.pi, 4)), 4), round(osc_sum(math.sin, partition(0, math.pi, 40)), 4))
step = lambda x: 1 if x >= 0.5 else 0
print(round(osc_sum(step, partition(0, 1, 10)), 4), round(osc_sum(step, partition(0, 1, 100)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.5708 0.1571\n0.1 0.01", "2.0 0.2\n0.1 0.01", "1.5708 0.1571\n0.0 0.0", "1.5708 0.1571\n0.2 0.02"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>darboux_monotone(f, P)</C>, returning (L, U) for an increasing f on the sorted partition P, using the
          left endpoint value of each cell for L and the right endpoint value for U. Then write <C>refine(P, Q)</C>, the sorted
          union of the two partitions without repeats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def darboux_monotone(f, P):
    return 0, 0

def refine(P, Q):
    return P
`,
        solution: DARBOUX,
        tests: [
          { name: "sums", code: `assert darboux_monotone(lambda x: 2 * x, [0, 1, 2]) == (2, 6)
L1, U1 = darboux_monotone(lambda x: x ** 3, [0, 0.5, 1])
L2, U2 = darboux_monotone(lambda x: x ** 3, [0, 0.25, 0.5, 1])
assert L1 <= L2 <= U2 <= U1` },
          { name: "refine", code: `assert refine([0, 1], [0.5, 0.5, 1]) == [0, 0.5, 1]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>partition(a, b, n)</C>, the n + 1 equally spaced points from a to b, and <C>osc_sum(f, P, m=100)</C>: for
          each cell (u, v), sample f at u + (v − u)j/m for j = 0, …, m, and add (max − min)·(v − u).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def partition(a, b, n):
    return [a, b]

def osc_sum(f, P, m=100):
    return 0.0
`,
        solution: OSC,
        tests: [
          { name: "partition", code: `assert partition(0, 1, 4) == [0, 0.25, 0.5, 0.75, 1]` },
          { name: "osc", code: `assert osc_sum(lambda x: 3, partition(0, 1, 4)) == 0
assert abs(osc_sum(lambda x: x, partition(0, 2, 4)) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if Q refines P, then L(f, P) ≤ L(f, Q).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Reduces to adding a single point z inside one cell [x_(k−1), x_k] (then inducts on the number of added points).",
          "Notes the infimum over each sub-cell is at least the infimum m_k over the whole cell, since the sub-cell is a subset.",
          "Concludes the cell's contribution m_k(x_k − x_(k−1)) is at most the sum of the two new contributions, and the other cells are unchanged.",
        ],
      },
    },
    {
      key: "ln10",
      rung: "stretch",
      prompt: <p>What is the lower sum of x² on [0, 1] with 10 equal cells?</p>,
      answer: { kind: "numeric", value: 0.285, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how upper and lower Darboux sums are defined, why refining a partition squeezes them together, why every lower sum is below every upper sum, how this defines the integral, and why the rational indicator function has none.",

  glimpse: (
    <>
      <p>
        Checking every partition is impractical. The next lesson gives a usable test, U − L &lt; ε for some partition, and uses
        it to show that continuous and monotone functions are integrable, and that a few discontinuities do no harm.
      </p>
    </>
  ),
};
