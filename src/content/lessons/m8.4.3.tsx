import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeparationViz } from "@/components/viz/SeparationViz";
import type { LessonContent } from "@/lib/types";

const COMP = `def components(intervals):
    out = []
    for l, r in sorted(intervals):
        if out and l <= out[-1][1]:
            out[-1] = (out[-1][0], max(out[-1][1], r))
        else:
            out.append((l, r))
    return out

def is_connected(intervals):
    return len(components(intervals)) <= 1`;

const IVT = `def image_gap(f, a, b, n):
    ys = sorted(f(a + (b - a) * i / n) for i in range(n + 1))
    return max(y2 - y1 for y1, y2 in zip(ys, ys[1:]))

def bisect_value(f, a, b, y, tol=1e-9):
    while b - a > tol:
        m = (a + b) / 2
        if f(m) < y:
            a = m
        else:
            b = m
    return (a + b) / 2`;

export const lesson: LessonContent = {
  id: "m8.4.3",
  minutes: 55,
  links: {
    requires: ["m8.4.1"],
    revisits: ["m2.3.2", "m8.1.2"],
    foreshadows: ["m8.5.2"],
  },

  puzzle: (
    <>
      <p>
        A function on [0, 2] is 0 at one end and 1 at the other. If it is continuous, must it take the value 1/2 somewhere? On
        [0, 1] ∪ [2, 3] the function that is 0 on the first piece and 1 on the second is continuous and never equals 1/2. The
        difference between the two domains is that one comes in one piece and the other does not. What exactly does "one
        piece" mean, and which subsets of ℝ have it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A set is disconnected when it can be split by two open sets, each holding part of it, that do not overlap on it. On the
        line a single missing point is enough to do the splitting: everything to the left of it and everything to the right.
        So a connected set can have no holes, which is to say it is an interval.
      </p>
      <SeparationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="connected set">
        <p>
          A ⊆ ℝ is disconnected if there are open sets U, V with A ⊆ U ∪ V, both A ∩ U and A ∩ V non-empty, and A ∩ U ∩ V = ∅.
          Otherwise A is connected. A set I is an interval if a, b ∈ I and a &lt; c &lt; b imply c ∈ I.
        </p>
      </Definition>

      <Theorem title="the connected subsets of the line are the intervals">
        <p>A ⊆ ℝ is connected if and only if it is an interval.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose A is not an interval: a, b ∈ A, a &lt; c &lt; b, c ∉ A. Then U = (−∞, c) and V = (c, ∞) are open, cover A
          (c is not in A), are disjoint, and contain a and b respectively. So A is disconnected.
        </p>
        <p>
          Now let I be an interval and suppose U, V disconnect it. Pick a ∈ I ∩ U and b ∈ I ∩ V; swapping the names if needed,
          a &lt; b. Then [a, b] ⊆ I. Let s = sup(U ∩ [a, b]), which exists by completeness and lies in [a, b] ⊆ I, so s is in U
          or in V.
        </p>
        <ul>
          <li>
            If s ∈ U: s ≠ b, since b ∈ I ∩ V and I ∩ U ∩ V = ∅. U is open, so <M>{"[s, s + \\varepsilon) \\subseteq U \\cap [a, b]"}</M>{" "}
            for some ε &gt; 0, giving points of U ∩ [a, b] above s. Contradiction.
          </li>
          <li>
            If s ∈ V: similarly s ≠ a, and V open gives <M>{"(s - \\varepsilon, s] \\subseteq V \\cap [a, b]"}</M>. By the
            definition of supremum some x ∈ U ∩ [a, b] lies in (s − ε, s]; then x ∈ I ∩ U ∩ V. Contradiction.
          </li>
        </ul>
        <Code>{COMP}</Code>
      </Proof>

      <Example title="disconnected sets">
        <p>
          [0, 1) ∪ (1, 2] is disconnected by (−∞, 1) and (1, ∞), even though its pieces have no gap of positive length. ℚ is
          disconnected by (−∞, √2) and (√2, ∞), and in fact its only connected subsets are single points; the same is true of
          the Cantor set. These sets are called totally disconnected.
        </p>
      </Example>

      <Theorem title="intermediate values, a preview">
        <p>
          If f: [a, b] → ℝ is continuous and y lies between f(a) and f(b), then f(c) = y for some c ∈ [a, b].
        </p>
      </Theorem>
      <Proof>
        <p>
          Take f(a) &lt; y &lt; f(b). The sets <M>{"U = f^{-1}((-\\infty, y))"}</M> and <M>{"V = f^{-1}((y, \\infty))"}</M> are
          open relative to [a, b] for continuous f (this is made precise in the continuity chapter), disjoint, and contain a
          and b. If no c had f(c) = y they would cover [a, b] and disconnect it, contradicting the theorem. The bisection
          below finds such a c by keeping f(left) &lt; y ≤ f(right) and halving.
        </p>
        <Code>{IVT}</Code>
      </Proof>

      <Remark title="why this matters">
        <p>
          Connectedness is what makes existence arguments by sign changes work: root finding by bisection, the existence of
          equilibria, and the fact that a continuous loss along a path from a bad point to a good point passes through every
          value in between. On a disconnected domain all of these can fail, as the puzzle shows.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many connected components does [0, 1] ∪ [0.5, 2] ∪ [3, 4] ∪ [2, 2.5] ∪ [4, 5] ∪ [6, 7] have?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "cut",
      rung: "check",
      prompt: (
        <p>
          A = [0, 2] ∪ [3, 7] is disconnected by (−∞, c) and (c, ∞) for any c in the gap. What is the midpoint of the gap?
        </p>
      ),
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these sets is connected?</p>,
      answer: { kind: "choice", options: ["[0, 1] ∪ [1, 2]", "[0, 1) ∪ (1, 2]", "ℚ ∩ [0, 1]", "{0, 1}"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def components(intervals):
    out = []
    for l, r in sorted(intervals):
        if out and l <= out[-1][1]:
            out[-1] = (out[-1][0], max(out[-1][1], r))
        else:
            out.append((l, r))
    return out

def is_connected(intervals):
    return len(components(intervals)) <= 1

ivs = [(0, 1), (0.5, 2), (3, 4), (2, 2.5)]
print(components(ivs), is_connected(ivs))
print(is_connected([(0, 1), (1, 2)]), components([(5, 6), (0, 1)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 2.5), (3, 4)] False\nTrue [(0, 1), (5, 6)]",
          "[(0, 2), (2, 2.5), (3, 4)] False\nTrue [(0, 1), (5, 6)]",
          "[(0, 2.5), (3, 4)] False\nFalse [(0, 1), (5, 6)]",
          "[(0, 2.5), (3, 4)] True\nTrue [(5, 6), (0, 1)]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def image_gap(f, a, b, n):
    ys = sorted(f(a + (b - a) * i / n) for i in range(n + 1))
    return max(y2 - y1 for y1, y2 in zip(ys, ys[1:]))

def bisect_value(f, a, b, y, tol=1e-9):
    while b - a > tol:
        m = (a + b) / 2
        if f(m) < y:
            a = m
        else:
            b = m
    return (a + b) / 2

step = lambda x: 0 if x < 0.5 else 1
print(round(image_gap(lambda x: x * x, 0, 1, 10), 2), image_gap(step, 0, 1, 10))
print(round(bisect_value(lambda x: x * x, 0, 2, 2), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.19 1\n1.414214", "0.1 1\n1.414214", "0.19 0\n1.414214", "0.19 1\n1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Closed intervals are pairs (l, r). Write <C>components(intervals)</C>, returning the connected components of their
          union as a list of (l, r) sorted by l, merging two intervals when they overlap or touch. Then write{" "}
          <C>is_connected(intervals)</C>, true when there is at most one component.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def components(intervals):
    return []

def is_connected(intervals):
    return True
`,
        solution: COMP,
        tests: [
          { name: "components", code: `assert components([(0, 1), (2, 3), (0.5, 1.5)]) == [(0, 1.5), (2, 3)]
assert components([(0, 5), (1, 2)]) == [(0, 5)] and components([]) == []` },
          { name: "connected", code: `assert is_connected([(0, 1), (1, 2)]) and is_connected([])
assert not is_connected([(0, 1), (1.01, 2)])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>image_gap(f, a, b, n)</C>: sample f at the n + 1 equally spaced points of [a, b], sort the values, and return
          the largest difference between neighbours. Then write <C>bisect_value(f, a, b, y, tol=1e-9)</C>, assuming f is
          continuous with f(a) &lt; y &lt; f(b): halve [a, b] keeping f(left) &lt; y ≤ f(right) until its length is at most
          tol, and return the midpoint.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def image_gap(f, a, b, n):
    return 0

def bisect_value(f, a, b, y, tol=1e-9):
    return a
`,
        solution: IVT,
        tests: [
          { name: "gap", code: `assert image_gap(lambda x: x, 0, 1, 4) == 0.25
assert image_gap(lambda x: 0 if x < 0.5 else 1, 0, 1, 10) == 1` },
          { name: "bisect", code: `assert abs(bisect_value(lambda x: x ** 3, 0, 2, 2) - 2 ** (1 / 3)) < 1e-8
assert abs(bisect_value(lambda x: x, -1, 1, 0.3) - 0.3) < 1e-8` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a connected set A ⊆ ℝ is an interval.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Argues by contraposition: assumes a, b ∈ A and a < c < b with c ∉ A.",
          "Uses the open sets (−∞, c) and (c, ∞), noting they cover A because c ∉ A and are disjoint.",
          "Notes a lies in the first and b in the second, so A is disconnected, a contradiction.",
        ],
      },
    },
    {
      key: "halvings",
      rung: "stretch",
      prompt: (
        <p>
          bisect_value starts on [0, 2] with tol = 1e-9 and stops once the length is at most tol. How many halvings does it
          perform?
        </p>
      ),
      answer: { kind: "numeric", value: 31, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for a set of reals to be connected, why a missing point disconnects a set, the supremum argument showing intervals are connected, and how this gives the intermediate value theorem.",

  glimpse: (
    <>
      <p>
        With open, closed, compact and connected sets in hand, the next chapter turns to functions. It starts by making limits
        of functions precise, with the same ε–δ care used for sequences.
      </p>
    </>
  ),
};
