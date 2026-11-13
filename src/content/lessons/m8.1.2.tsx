import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BisectSupViz } from "@/components/viz/BisectSupViz";
import type { LessonContent } from "@/lib/types";

const SUP = `def is_upper(S, x):
    return all(s <= x for s in S)

def bisect_sup(S, a, b, steps):
    for _ in range(steps):
        m = (a + b) / 2
        if is_upper(S, m):
            b = m
        else:
            a = m
    return a, b`;

const NEST = `import math

def nested_intersection(intervals):
    lo = max(a for a, b in intervals)
    hi = min(b for a, b in intervals)
    return lo, hi, lo <= hi

def decimal_intervals(x, k):
    out = []
    for j in range(1, k + 1):
        d = math.floor(x * 10 ** j)
        out.append((d / 10 ** j, (d + 1) / 10 ** j))
    return out`;

export const lesson: LessonContent = {
  id: "m8.1.2",
  minutes: 60,
  links: {
    requires: ["m8.1.1", "m2.8.1"],
    revisits: ["m2.1.2", "m2.3.2"],
    foreshadows: ["m8.2.2", "m8.2.3", "m8.2.4"],
  },

  puzzle: (
    <>
      <p>
        &quot;The reals have no holes&quot; can be said in many ways. Every bounded set has a supremum. Shrinking closed
        intervals always share a point. Increasing bounded sequences converge. Every Cauchy sequence converges. Each fails in
        the rationals. Are these really the same statement, and which one should you reach for in a proof?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each form traps a target from two sides and promises something is there. The supremum form names the target
        directly; the interval form squeezes it; the sequence forms approach it. Going from one to another is mostly
        bisection: keep halving an interval with one end that is too small and one end that is big enough.
      </p>
      <BisectSupViz />
    </>
  ),

  theory: (
    <>
      <p>
        Throughout, the axiom is the least upper bound property (LUB): every non-empty set of reals that is bounded above
        has a least upper bound.
      </p>
      <Theorem title="Archimedean property">
        <p>For every real x there is a natural number n &gt; x. Equivalently, for every ε &gt; 0 there is n with 1/n &lt; ε.</p>
      </Theorem>
      <Proof>
        <p>
          If not, ℕ is bounded above by x, so it has a supremum s. Then s − 1 is not an upper bound, so some n &gt; s − 1,
          and n + 1 &gt; s is a natural number above the supremum, a contradiction.
        </p>
      </Proof>

      <Theorem title="nested interval property (NIP)">
        <p>
          If <M>{"I_n = [a_n, b_n]"}</M> are closed bounded intervals with <M>{"I_1 \\supseteq I_2 \\supseteq \\cdots"}</M>, then{" "}
          <M>{"\\bigcap_n I_n \\neq \\emptyset"}</M>. If also <M>{"b_n - a_n \\to 0"}</M>, the intersection is a single point.
        </p>
      </Theorem>
      <Proof>
        <p>
          Nesting gives <M>{"a_1 \\le a_2 \\le \\cdots"}</M> and <M>{"b_1 \\ge b_2 \\ge \\cdots"}</M>, and{" "}
          <M>{"a_n \\le b_m"}</M> for all n, m (both lie in <M>{"I_{\\max(n, m)}"}</M>). So each <M>{"b_m"}</M> is an upper bound of{" "}
          <M>{"\\{a_n\\}"}</M>, and <M>{"x = \\sup_n a_n"}</M> satisfies <M>{"a_n \\le x \\le b_m"}</M> for all n, m: x lies in every{" "}
          <M>{"I_n"}</M>. If two points x &lt; y were in every interval, then <M>{"b_n - a_n \\ge y - x > 0"}</M> for all n.
        </p>
      </Proof>
      <Remark title="closed and bounded both matter">
        <p>
          The open intervals (0, 1/n) are nested with empty intersection, and so are the unbounded closed intervals [n, ∞).
          In the rationals, the closed intervals of rationals around √2 from decimal truncations are nested with empty
          intersection.
        </p>
      </Remark>

      <Theorem title="monotone convergence theorem (MCT)">
        <p>
          An increasing sequence that is bounded above converges, to its supremum. Likewise a decreasing sequence bounded
          below converges to its infimum.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"s = \\sup_n x_n"}</M> and ε &gt; 0. Since s − ε is not an upper bound, some <M>{"x_N > s - \\varepsilon"}</M>.
          For n ≥ N, monotonicity gives <M>{"s - \\varepsilon < x_N \\le x_n \\le s"}</M>, so <M>{"|x_n - s| < \\varepsilon"}</M>.
        </p>
      </Proof>

      <Theorem title="NIP and Archimedes give LUB">
        <p>
          In an ordered field with the Archimedean property, the nested interval property implies the least upper bound
          property.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let S be non-empty and bounded above. Pick <M>{"a_0"}</M> not an upper bound (any element minus 1) and{" "}
          <M>{"b_0"}</M> an upper bound. Given <M>{"[a_n, b_n]"}</M> with <M>{"a_n"}</M> not an upper bound and <M>{"b_n"}</M> an
          upper bound, let m be the midpoint and keep <M>{"[a_n, m]"}</M> if m is an upper bound, else <M>{"[m, b_n]"}</M>. The
          widths are <M>{"(b_0 - a_0)/2^n \\to 0"}</M> (here Archimedes is used, since <M>{"2^n \\ge n"}</M>), so NIP gives a single
          point x in every interval. x is an upper bound: if some s ∈ S had s &gt; x, then <M>{"b_n < s"}</M> once the width is
          below s − x, contradicting that <M>{"b_n"}</M> is an upper bound. Any smaller y &lt; x is not one: once the width is
          below x − y, <M>{"y < a_n"}</M>, and <M>{"a_n"}</M> is already not an upper bound. So x = sup S.
        </p>
        <Code>{SUP}</Code>
      </Proof>

      <Remark title="the circle of equivalences">
        <p>
          For an Archimedean ordered field, these are equivalent: LUB; NIP; MCT; every bounded sequence has a convergent
          subsequence (Bolzano–Weierstrass); every Cauchy sequence converges. We proved LUB ⇒ NIP, LUB ⇒ MCT and NIP ⇒ LUB;
          MCT ⇒ NIP follows by applying MCT to the endpoints, and the last two appear later in this course. Use whichever
          form makes a proof shortest: MCT when you have monotonicity, NIP when you can bisect.
        </p>
      </Remark>

      <Example title="decimals as nested intervals">
        <p>
          The truncations of a real x to k decimal places give nested intervals of width <M>{"10^{-k}"}</M> containing x. NIP
          says conversely that every infinite decimal names exactly one real, which is how decimals become a valid
          description of ℝ.
        </p>
        <Code>{NEST}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "sup",
      rung: "check",
      prompt: <p>What is the supremum of {"{1 − 1/n : n = 1, 2, 3, …}"}?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "point",
      rung: "check",
      prompt: <p>The closed intervals [0, 1/n] are nested and their widths tend to 0. Which single number lies in all of them?</p>,
      answer: { kind: "numeric", value: 0, tolerance: 0.0001 },
    },
    {
      key: "open",
      rung: "apply",
      prompt: <p>The intervals (0, 1/n) are nested. What is their intersection, and why does this not contradict the nested interval property?</p>,
      answer: {
        kind: "choice",
        options: [
          "Empty; the property is only for closed intervals.",
          "{0}; 0 lies in every interval.",
          "Empty; the widths do not tend to 0.",
          "Empty; the property fails in ℝ in general.",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def is_upper(S, x):
    return all(s <= x for s in S)

def bisect_sup(S, a, b, steps):
    for _ in range(steps):
        m = (a + b) / 2
        if is_upper(S, m):
            b = m
        else:
            a = m
    return a, b

S = [1 - 1 / n for n in range(1, 1001)]
a, b = bisect_sup(S, 0, 2, 20)
print(is_upper(S, 1), is_upper(S, 0.998), round(a, 4), round(b, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True False 0.999 0.999", "True True 0.999 0.999", "True False 1.0 1.0", "False False 0.999 0.999"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def nested_intersection(intervals):
    lo = max(a for a, b in intervals)
    hi = min(b for a, b in intervals)
    return lo, hi, lo <= hi

def decimal_intervals(x, k):
    out = []
    for j in range(1, k + 1):
        d = math.floor(x * 10 ** j)
        out.append((d / 10 ** j, (d + 1) / 10 ** j))
    return out

print(nested_intersection([(0, 1), (0.25, 0.75), (0.4, 0.6)]), nested_intersection([(0, 1), (2, 3)]))
print(decimal_intervals(math.pi, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.4, 0.6, True) (2, 1, False)\n[(3.1, 3.2), (3.14, 3.15), (3.141, 3.142)]",
          "(0, 1, True) (0, 3, True)\n[(3.1, 3.2), (3.14, 3.15), (3.141, 3.142)]",
          "(0.4, 0.6, True) (2, 1, False)\n[(3.1, 3.2), (3.14, 3.15), (3.142, 3.143)]",
          "(0.4, 0.6, True) (1, 2, True)\n[(3.1, 3.2), (3.14, 3.15), (3.141, 3.142)]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_upper(S, x)</C>, testing whether x is an upper bound of the finite collection S, and{" "}
          <C>bisect_sup(S, a, b, steps)</C>, which, given a not an upper bound and b an upper bound, bisects steps times
          keeping that property and returns (a, b).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def is_upper(S, x):
    return True

def bisect_sup(S, a, b, steps):
    return a, b
`,
        solution: SUP,
        tests: [
          { name: "upper", code: `assert is_upper([1, 5, 3], 5) and not is_upper([1, 5, 3], 4.99) and is_upper([], 0)` },
          { name: "bisect", code: `a, b = bisect_sup([0.3, 1.7, 1.2], 0, 4, 30)
assert a < 1.7 <= b and b - a < 1e-8
a, b = bisect_sup([-5, -2], -10, 10, 3)
assert (a, b) == (-2.5, 0.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nested_intersection(intervals)</C>, returning (largest left end, smallest right end, whether they enclose a
          non-empty interval) for a list of closed intervals, and <C>decimal_intervals(x, k)</C>, the list of intervals
          [d/10ʲ, (d + 1)/10ʲ] with d = ⌊x·10ʲ⌋ for j = 1, …, k.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def nested_intersection(intervals):
    return 0, 0, True

def decimal_intervals(x, k):
    return []
`,
        solution: NEST,
        tests: [
          { name: "intersection", code: `assert nested_intersection([(0, 1), (0.25, 0.75), (0.4, 0.6)]) == (0.4, 0.6, True)
assert nested_intersection([(0, 1), (2, 3)]) == (2, 1, False)
assert nested_intersection([(0, 2), (2, 5)]) == (2, 2, True)` },
          { name: "decimals", code: `iv = decimal_intervals(2.71828, 4)
assert len(iv) == 4 and all(a <= 2.71828 < b for a, b in iv)
assert iv[0] == (2.7, 2.8) and abs(iv[3][0] - 2.7182) < 1e-12
assert all(a2 >= a1 - 1e-12 and b2 <= b1 + 1e-12 for (a1, b1), (a2, b2) in zip(iv, iv[1:]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Using the least upper bound property, prove the monotone convergence theorem: an increasing sequence that is bounded
          above converges to its supremum.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines s = sup of the terms, which exists by LUB because the set of terms is non-empty and bounded above.",
          "Given ε > 0, uses that s − ε is not an upper bound to find N with x_N > s − ε.",
          "For n ≥ N uses monotonicity and x_n ≤ s to get s − ε < x_n ≤ s, hence |x_n − s| < ε.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: <p>Bisection for a supremum starts with [0, 2]. How many steps are needed before the width is below 0.001?</p>,
      answer: { kind: "numeric", value: 11, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the different ways of saying the reals are complete, why nested closed intervals share a point, why an increasing bounded sequence converges to its supremum, and how bisection turns the nested interval property back into the supremum property.",

  glimpse: (
    <>
      <p>
        Completeness tells us which sets have suprema. The next lesson asks a cruder question about size: the rationals are
        dense yet can be listed, while the reals cannot. That difference is why the gaps in ℚ are so numerous.
      </p>
    </>
  ),
};
