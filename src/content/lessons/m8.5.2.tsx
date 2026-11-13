import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AttainMaxViz } from "@/components/viz/AttainMaxViz";
import type { LessonContent } from "@/lib/types";

const GRID = `def grid_max(f, a, b, n):
    xs = [a + (b - a) * i / n for i in range(n + 1)]
    x = max(xs, key=f)
    return x, f(x)

def refine_max(f, a, b, rounds, n=10):
    lo, hi = a, b
    for _ in range(rounds):
        x, _ = grid_max(f, lo, hi, n)
        h = (hi - lo) / n
        lo, hi = max(a, x - h), min(b, x + h)
    return grid_max(f, lo, hi, n)`;

const BRACKET = `def brackets(f, a, b, n):
    xs = [a + (b - a) * i / n for i in range(n + 1)]
    return [(u, v) for u, v in zip(xs, xs[1:]) if f(u) * f(v) <= 0]

def image_range(f, a, b, n):
    ys = [f(a + (b - a) * i / n) for i in range(n + 1)]
    return min(ys), max(ys)`;

export const lesson: LessonContent = {
  id: "m8.5.2",
  minutes: 65,
  links: {
    requires: ["m8.5.1", "m8.4.2", "m8.4.3"],
    revisits: ["m2.3.2"],
    foreshadows: ["m8.5.3", "m8.6.2", "m8.7.2"],
  },

  puzzle: (
    <>
      <p>
        Training minimises a loss over a set of parameters. When can you be sure a minimiser exists at all, rather than a
        sequence of ever better parameters that runs off to infinity or towards a point that is not allowed? For a function
        of one variable the answer is a theorem from calculus, the extreme value theorem, and its proof is a short combination
        of the last two lessons.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Continuity sends convergent sequences to convergent sequences. Compactness supplies convergent subsequences. Put
        together, a sequence of points whose values approach the supremum has a subsequence converging to some point, and
        continuity forces the value there to be the supremum. Remove either hypothesis and the argument, and the conclusion,
        fail.
      </p>
      <AttainMaxViz />
    </>
  ),

  theory: (
    <>
      <Definition title="continuity">
        <p>
          f: A → ℝ is continuous at c ∈ A if for every ε &gt; 0 there is δ &gt; 0 with
        </p>
        <MD>{"x \\in A,\\ |x - c| < \\delta \\implies |f(x) - f(c)| < \\varepsilon."}</MD>
        <p>
          Equivalently, <M>{"f(x_n) \\to f(c)"}</M> whenever <M>{"x_n \\to c"}</M> in A. If c is a limit point of A this says{" "}
          <M>{"\\lim_{x \\to c} f(x) = f(c)"}</M>; at an isolated point every f is continuous. f is continuous on A if it is
          continuous at every point.
        </p>
      </Definition>

      <Theorem title="open-set characterisation">
        <p>f: ℝ → ℝ is continuous if and only if <M>{"f^{-1}(O)"}</M> is open for every open set O.</p>
      </Theorem>
      <Proof>
        <p>
          (⇒) If <M>{"f(c) \\in O"}</M>, some <M>{"V_\\varepsilon(f(c)) \\subseteq O"}</M>; continuity gives δ with{" "}
          <M>{"f(V_\\delta(c)) \\subseteq V_\\varepsilon(f(c))"}</M>, so <M>{"V_\\delta(c) \\subseteq f^{-1}(O)"}</M>. (⇐) Take{" "}
          <M>{"O = V_\\varepsilon(f(c))"}</M>; its preimage is open and contains c, so it contains some{" "}
          <M>{"V_\\delta(c)"}</M>, which is the ε–δ condition.
        </p>
      </Proof>

      <Theorem title="continuous images of compact sets">
        <p>If f: K → ℝ is continuous and K is compact, then f(K) is compact.</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"y_n = f(x_n)"}</M> be a sequence in f(K). By compactness some subsequence <M>{"x_{n_k} \\to x \\in K"}</M>, and
          by continuity <M>{"y_{n_k} = f(x_{n_k}) \\to f(x) \\in f(K)"}</M>.
        </p>
      </Proof>

      <Theorem title="extreme value theorem">
        <p>A continuous function on a non-empty compact set K attains a maximum and a minimum.</p>
      </Theorem>
      <Proof>
        <p>
          f(K) is compact, so closed and bounded, so s = sup f(K) is finite and, being a limit of points of f(K), lies in f(K).
          Thus s = f(x) for some x ∈ K; the minimum is the same argument for −f. A grid search finds an approximate maximiser,
          and zooming in around the best grid point refines it, though for a function with several near-equal peaks the zoom
          can pick the wrong one.
        </p>
        <Code>{GRID}</Code>
      </Proof>

      <Theorem title="continuous images of connected sets; intermediate values">
        <p>
          If f is continuous on a connected set E, then f(E) is connected. In particular a continuous f on [a, b] takes every
          value between f(a) and f(b).
        </p>
      </Theorem>
      <Proof>
        <p>
          If open U, V disconnected f(E), then <M>{"f^{-1}(U)"}</M> and <M>{"f^{-1}(V)"}</M> would disconnect E: they are open
          relative to E by the characterisation above applied on E, they cover E, meet it, and do not overlap on it. So f(E)
          is connected, hence an interval, which contains every value between two of its points. A sign change of f on a grid
          cell therefore guarantees a root in that cell.
        </p>
        <Code>{BRACKET}</Code>
      </Proof>

      <Example title="each hypothesis matters">
        <p>
          x on (0, 1) is continuous on a bounded set that is not closed: no maximum. 1/x on (0, 1] is unbounded. x on [0, 1)
          with value 0 at 1 has a compact domain but a jump: the supremum 1 is not attained. The sign function on [−1, 1]
          jumps from −1 to 1 and skips every value in between, so intermediate values need continuity too.
        </p>
      </Example>

      <Remark title="existence of minimisers">
        <p>
          In ℝⁿ the same proof works on closed bounded sets. For a loss on all of ℝⁿ one shows the loss is large outside some
          ball (it is coercive), restricts to the ball, and applies the theorem; regularisation such as λ‖w‖² is a common way
          to make that true.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "max",
      rung: "check",
      prompt: <p>What is the maximum of x(1 − x) + x/4 on [0, 1]?</p>,
      answer: { kind: "numeric", value: 0.390625, tolerance: 0.0001 },
    },
    {
      key: "roots",
      rung: "check",
      prompt: <p>How many roots does cos x have in [0, 10]?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "hyp",
      rung: "apply",
      prompt: <p>Which hypothesis guarantees that f attains a maximum?</p>,
      answer: {
        kind: "choice",
        options: ["f is continuous on [0, 1]", "f is continuous on (0, 1)", "f is bounded on [0, 1]", "f is continuous and bounded on (0, 1)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def grid_max(f, a, b, n):
    xs = [a + (b - a) * i / n for i in range(n + 1)]
    x = max(xs, key=f)
    return x, f(x)

def refine_max(f, a, b, rounds, n=10):
    lo, hi = a, b
    for _ in range(rounds):
        x, _ = grid_max(f, lo, hi, n)
        h = (hi - lo) / n
        lo, hi = max(a, x - h), min(b, x + h)
    return grid_max(f, lo, hi, n)

print(grid_max(lambda x: x * (1 - x), 0, 1, 4), grid_max(lambda x: 1 - x * x, -1, 2, 3))
x, y = refine_max(math.sin, 0, 3, 6)
print(round(x, 4), round(y, 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(0.5, 0.25) (0.0, 1.0)\n1.5708 1.0", "(0.5, 0.25) (2.0, 1.0)\n1.5708 1.0", "(0.25, 0.5) (0.0, 1.0)\n1.5708 1.0", "(0.5, 0.25) (0.0, 1.0)\n1.5 0.997495"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def brackets(f, a, b, n):
    xs = [a + (b - a) * i / n for i in range(n + 1)]
    return [(u, v) for u, v in zip(xs, xs[1:]) if f(u) * f(v) <= 0]

def image_range(f, a, b, n):
    ys = [f(a + (b - a) * i / n) for i in range(n + 1)]
    return min(ys), max(ys)

print([(round(u, 2), round(v, 2)) for u, v in brackets(math.cos, 0, 10, 10)])
print(image_range(lambda x: x * x, -1, 2, 3), image_range(math.cos, 0, 10, 10)[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(1.0, 2.0), (4.0, 5.0), (7.0, 8.0)]\n(0.0, 4.0) 1.0",
          "[(1.0, 2.0), (4.0, 5.0)]\n(0.0, 4.0) 1.0",
          "[(1.0, 2.0), (4.0, 5.0), (7.0, 8.0)]\n(1.0, 4.0) 1.0",
          "[(1.0, 2.0), (4.0, 5.0), (7.0, 8.0)]\n(0.0, 4.0) 0.5403",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grid_max(f, a, b, n)</C>, returning (x, f(x)) for the grid point x = a + (b − a)i/n, i = 0, …, n, with the
          largest f(x). Then write <C>refine_max(f, a, b, rounds, n=10)</C>: each round, find the best grid point x on the
          current [lo, hi], set h = (hi − lo)/n and shrink to [max(a, x − h), min(b, x + h)]; finally return grid_max on the
          last interval.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def grid_max(f, a, b, n):
    return a, f(a)

def refine_max(f, a, b, rounds, n=10):
    return grid_max(f, a, b, n)
`,
        solution: GRID,
        tests: [
          { name: "grid", code: `x, y = grid_max(lambda x: -(x - 0.3) * (x - 0.3), 0, 1, 10)
assert abs(x - 0.3) < 1e-12 and abs(y) < 1e-12
assert grid_max(lambda x: x, -1, 1, 4) == (1.0, 1.0)` },
          { name: "refine", code: `x, y = refine_max(lambda x: -(x - 0.123) * (x - 0.123), 0, 1, 8)
assert abs(x - 0.123) < 1e-5
x, y = refine_max(lambda x: x, 0, 1, 3)
assert abs(x - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>brackets(f, a, b, n)</C>: on the grid of n equal cells of [a, b], return the list of cells (u, v) with
          f(u)·f(v) ≤ 0. Then write <C>image_range(f, a, b, n)</C>, the (min, max) of f over the n + 1 grid points.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def brackets(f, a, b, n):
    return []

def image_range(f, a, b, n):
    return 0, 0
`,
        solution: BRACKET,
        tests: [
          { name: "brackets", code: `assert brackets(lambda x: x * x - 2, 0, 3, 3) == [(1.0, 2.0)]
assert brackets(lambda x: x * x + 1, -1, 1, 4) == []` },
          { name: "range", code: `assert image_range(lambda x: x, 0, 1, 4) == (0.0, 1.0)
assert image_range(lambda x: (x - 1) * (x - 1), 0, 3, 3) == (0.0, 4.0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a continuous function on a compact set K ⊆ ℝ is bounded.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes f is unbounded and picks x_n ∈ K with |f(x_n)| > n.",
          "Uses compactness of K to extract a subsequence x_{n_k} converging to some x ∈ K.",
          "Uses continuity to get f(x_{n_k}) → f(x), contradicting |f(x_{n_k})| > n_k → ∞ (or argues equivalently via f(K) compact).",
        ],
      },
    },
    {
      key: "min",
      rung: "stretch",
      prompt: <p>What is the minimum of x³ − 3x on [−3, 2]?</p>,
      answer: { kind: "numeric", value: -18, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the definition of continuity, why continuous images of compact sets are compact, how that gives the extreme value theorem, and which of its hypotheses each counterexample drops.",

  glimpse: (
    <>
      <p>
        Continuity lets δ depend on the point. On compact sets one δ can serve every point at once, which is uniform
        continuity, the subject of the next lesson and the key to integrability.
      </p>
    </>
  ),
};
