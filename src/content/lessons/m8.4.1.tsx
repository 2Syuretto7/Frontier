import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OpenClosedViz } from "@/components/viz/OpenClosedViz";
import type { LessonContent } from "@/lib/types";

const POINT = `def contains(S, x):
    for a, b, lc, rc in S:
        if (a < x or (lc and x == a)) and (x < b or (rc and x == b)):
            return True
    return False

def interior_radius(S, x):
    for a, b, lc, rc in S:
        if a < x < b:
            return min(x - a, b - x)
    return 0`;

const SETS = `import math

def is_open(S):
    return all(not lc or a == -math.inf for a, b, lc, rc in S) and \\
        all(not rc or b == math.inf for a, b, lc, rc in S)

def is_closed(S):
    return all((lc or a == -math.inf) and (rc or b == math.inf) for a, b, lc, rc in S)

def closure(S):
    return [(a, b, a != -math.inf, b != math.inf) for a, b, lc, rc in S]`;

export const lesson: LessonContent = {
  id: "m8.4.1",
  minutes: 55,
  links: {
    requires: ["m8.2.3", "m1.4.3"],
    revisits: ["m2.2.2", "m8.1.3"],
    foreshadows: ["m8.4.2", "m8.5.1", "m8.9.1"],
  },

  puzzle: (
    <>
      <p>
        A maximum of a function on (0, 1) may not exist, while on [0, 1] it always does for a continuous function. Limits
        of sequences in (0, 1) can escape to 0, but limits of sequences in [0, 1] stay inside. What exactly is the property
        of [0, 1] that matters, and how do we describe it for sets that are not intervals, like the Cantor set?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Open sets are those where every point has elbow room: you can move a little in either direction and stay inside.
        Closed sets are those you cannot escape by taking limits. The two ideas are mirror images: a set is open exactly when
        its complement is closed. Most sets are neither.
      </p>
      <OpenClosedViz />
    </>
  ),

  theory: (
    <>
      <Definition title="open sets">
        <p>
          The ε-neighbourhood of a is <M>{"V_\\varepsilon(a) = (a - \\varepsilon, a + \\varepsilon)"}</M>. A set O ⊆ ℝ is open if
          for every a ∈ O some <M>{"V_\\varepsilon(a) \\subseteq O"}</M>. Such a is an interior point.
        </p>
      </Definition>
      <Theorem title="unions and intersections of open sets">
        <p>Any union of open sets is open. A finite intersection of open sets is open.</p>
      </Theorem>
      <Proof>
        <p>
          A point of a union lies in some member, which contains a neighbourhood of it. For{" "}
          <M>{"a \\in O_1 \\cap \\dots \\cap O_n"}</M>, take <M>{"\\varepsilon_i"}</M> for each <M>{"O_i"}</M> and{" "}
          <M>{"\\varepsilon = \\min_i\\varepsilon_i > 0"}</M>. With infinitely many sets the minimum can be 0:{" "}
          <M>{"\\bigcap_n (-1/n, 1/n) = \\{0\\}"}</M> is not open.
        </p>
        <Code>{POINT}</Code>
      </Proof>

      <Definition title="limit points and closed sets">
        <p>
          x is a limit point of A if every <M>{"V_\\varepsilon(x)"}</M> contains a point of A other than x. A point of A that is
          not a limit point is isolated. A set is closed if it contains all its limit points.
        </p>
      </Definition>
      <Theorem title="sequential descriptions">
        <p>
          x is a limit point of A if and only if <M>{"x = \\lim a_n"}</M> for some sequence of points <M>{"a_n \\in A"}</M> with{" "}
          <M>{"a_n \\ne x"}</M>. Hence A is closed if and only if every convergent sequence of points of A has its limit in A.
        </p>
      </Theorem>
      <Proof>
        <p>
          If x is a limit point, pick <M>{"a_n \\in V_{1/n}(x) \\cap A"}</M> with <M>{"a_n \\ne x"}</M>; then{" "}
          <M>{"|a_n - x| < 1/n"}</M>. Conversely, if such a sequence converges to x, every neighbourhood of x contains its tail,
          hence points of A other than x. For the second statement: if A is closed and <M>{"a_n \\to x"}</M>, either some{" "}
          <M>{"a_n = x"}</M> (so x ∈ A) or x is a limit point (so x ∈ A). Conversely, a limit point is the limit of a sequence in
          A, which then lies in A.
        </p>
      </Proof>

      <Theorem title="complements">
        <p>A set is open if and only if its complement is closed.</p>
      </Theorem>
      <Proof>
        <p>
          Let O be open and x a limit point of <M>{"O^c"}</M>. Every neighbourhood of x meets <M>{"O^c"}</M>, so none lies inside O;
          since O is open, x ∉ O, that is, <M>{"x \\in O^c"}</M>. So <M>{"O^c"}</M> is closed. Conversely, let <M>{"O^c"}</M> be
          closed and x ∈ O. Then x is not a limit point of <M>{"O^c"}</M> (closed sets contain theirs, and x ∉ O^c), so some{" "}
          <M>{"V_\\varepsilon(x)"}</M> misses <M>{"O^c"}</M>, i.e. lies in O.
        </p>
      </Proof>
      <p>
        By De Morgan&apos;s laws, any intersection of closed sets is closed and finite unions of closed sets are closed. The
        Cantor set, an intersection of finite unions of closed intervals, is closed.
      </p>

      <Definition title="closure">
        <p>
          The closure <M>{"\\bar A"}</M> is A together with its limit points. It is closed, and it is the smallest closed set
          containing A. A is dense in ℝ when <M>{"\\bar A = \\mathbb R"}</M>; for example <M>{"\\bar{\\mathbb Q} = \\mathbb R"}</M>.
        </p>
      </Definition>

      <Example title="finite unions of intervals">
        <p>
          For a finite union of separated intervals, openness and closedness can be read off the endpoints: an included
          finite endpoint spoils openness, an excluded one spoils closedness, and infinite ends do neither. ℝ and ∅ are both
          open and closed, and ℚ is neither.
        </p>
        <Code>{SETS}</Code>
      </Example>
      <Remark title="why this language">
        <p>
          These definitions mention only neighbourhoods and limits, so they transfer unchanged to ℝⁿ and to any metric
          space. The next lesson combines closed with bounded to get compactness, the property that makes maxima exist.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "radius",
      rung: "check",
      prompt: <p>What is the largest ε with (0.25 − ε, 0.25 + ε) inside (0, 1)?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "lp",
      rung: "check",
      prompt: <p>How many limit points does the set {"{1/n : n = 1, 2, 3, …}"} have?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "inter",
      rung: "apply",
      prompt: <p>The intersection of the open intervals (−1/n, 1/n) is {"{0}"}. What does this show?</p>,
      answer: {
        kind: "choice",
        options: [
          "An infinite intersection of open sets need not be open.",
          "{0} is open.",
          "A finite intersection of open sets need not be open.",
          "Open intervals are closed.",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def contains(S, x):
    for a, b, lc, rc in S:
        if (a < x or (lc and x == a)) and (x < b or (rc and x == b)):
            return True
    return False

def interior_radius(S, x):
    for a, b, lc, rc in S:
        if a < x < b:
            return min(x - a, b - x)
    return 0

S = [(0, 1, False, True), (2, 3, True, True)]
print(contains(S, 1), contains(S, 0), interior_radius(S, 0.25), interior_radius(S, 1), interior_radius(S, 2.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True False 0.25 0 0.5", "True True 0.25 0 0.5", "False False 0.25 0 0.5", "True False 0.75 0 0.5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def is_open(S):
    return all(not lc or a == -math.inf for a, b, lc, rc in S) and \\
        all(not rc or b == math.inf for a, b, lc, rc in S)

def is_closed(S):
    return all((lc or a == -math.inf) and (rc or b == math.inf) for a, b, lc, rc in S)

def closure(S):
    return [(a, b, a != -math.inf, b != math.inf) for a, b, lc, rc in S]

S = [(0, 1, False, True), (2, 3, True, True)]
print(is_open(S), is_closed(S), is_closed(closure(S)), closure(S)[0])
H = [(-math.inf, 0, False, True)]
print(is_open(H), is_closed(H), is_open([(-math.inf, math.inf, False, False)]), is_closed([(-math.inf, math.inf, False, False)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "False False True (0, 1, True, True)\nFalse True True True",
          "True False True (0, 1, True, True)\nFalse True True True",
          "False False True (0, 1, False, True)\nFalse True True True",
          "False False True (0, 1, True, True)\nFalse True True False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A set is a list of disjoint, non-touching intervals (a, b, left_closed, right_closed). Write <C>contains(S, x)</C> and{" "}
          <C>interior_radius(S, x)</C>, the largest r with (x − r, x + r) ⊆ S, or 0 if x is not an interior point.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def contains(S, x):
    return False

def interior_radius(S, x):
    return 0
`,
        solution: POINT,
        tests: [
          { name: "contains", code: `S = [(0, 1, False, True), (2, 3, True, False)]
assert contains(S, 1) and not contains(S, 0) and contains(S, 2) and not contains(S, 3) and not contains(S, 1.5)` },
          { name: "radius", code: `S = [(0, 1, False, True), (2, 5, True, False)]
assert interior_radius(S, 0.25) == 0.25 and interior_radius(S, 1) == 0 and interior_radius(S, 4) == 1 and interior_radius(S, 7) == 0
assert interior_radius([(-float('inf'), 0, False, False)], -3) == 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the same representation (infinite ends written ±math.inf, never included), write <C>is_open(S)</C>,{" "}
          <C>is_closed(S)</C> and <C>closure(S)</C>, which includes every finite endpoint.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def is_open(S):
    return True

def is_closed(S):
    return True

def closure(S):
    return S
`,
        solution: SETS,
        tests: [
          { name: "open closed", code: `assert is_open([(0, 1, False, False)]) and not is_closed([(0, 1, False, False)])
assert is_closed([(0, 1, True, True), (2, 2, True, True)]) and not is_open([(0, 1, True, False)]) and not is_closed([(0, 1, True, False)])
R = [(-math.inf, math.inf, False, False)]
assert is_open(R) and is_closed(R)` },
          { name: "closure", code: `c = closure([(0, 1, False, False), (3, math.inf, False, False)])
assert c == [(0, 1, True, True), (3, math.inf, True, False)] and is_closed(c)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a set O ⊆ ℝ is open if and only if its complement is closed.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Assuming O open, takes a limit point x of Oᶜ and argues x cannot be in O (a neighbourhood inside O would miss Oᶜ), so x ∈ Oᶜ.",
          "Assuming Oᶜ closed, takes x ∈ O and argues x is not a limit point of Oᶜ.",
          "Concludes some neighbourhood of x misses Oᶜ, hence lies in O, so O is open.",
        ],
      },
    },
    {
      key: "iso",
      rung: "stretch",
      prompt: <p>How many isolated points does A = {"{1/n : 1 ≤ n ≤ 10}"} ∪ [2, 3] have?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what open and closed sets are, why infinite intersections of open sets can fail to be open, how limit points and sequences characterise closed sets, and why a set is open exactly when its complement is closed.",

  glimpse: (
    <>
      <p>
        Closed sets keep limits in; bounded sets keep sequences from escaping to infinity. Together they give compact sets,
        where every sequence has a convergent subsequence with its limit inside, the key to existence of maxima.
      </p>
    </>
  ),
};
