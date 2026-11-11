import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { AbsViz } from "@/components/viz/AbsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.1.3",
  minutes: 70,
  links: {
    revisits: ["m0.2.4"],
    foreshadows: ["m2.2.2", "m2.2.3"],
  },

  puzzle: (
    <>
      <p>
        You walk 5 km east, then 3 km west. You have walked 8 km, yet you are only 2 km from where you started. Could you ever
        end up further from home than the total distance you walked?
      </p>
      <p>
        Here is the kind of question that fills the rest of this course. If x is within 1 of 2, how far can <M>{"x^2"}</M> be
        from 4? Can you make <M>{"x^2"}</M> as close to 4 as you like, just by making x close enough to 2?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The absolute value <M>{"|x|"}</M> is the distance from x to 0, and <M>{"|x - a|"}</M> is the distance from x to a.
        Analysis is the art of making things close, so it uses this one tool constantly. An inequality such as{" "}
        <M>{"|x - a| < r"}</M> is a compact way of saying &ldquo;x is within r of a&rdquo;.
      </p>
      <p>
        The visualisation has two parts. The first shows <M>{"|x - a| < r"}</M> as an interval. The second shows the most
        useful inequality in analysis, the triangle inequality, as two walks along a line.
      </p>
      <AbsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="absolute value">
        <p>For a real number x,</p>
        <MD>{"|x| = \\begin{cases} x & \\text{if } x \\ge 0, \\\\ -x & \\text{if } x < 0. \\end{cases}"}</MD>
        <p>
          The <strong>distance</strong> between x and y is <M>{"|x - y|"}</M>.
        </p>
      </Definition>

      <Theorem title="basic properties">
        <p>For all real x, y and every <M>{"r > 0"}</M>:</p>
        <ol>
          <li>
            <M>{"|x| \\ge 0"}</M>, with equality only when <M>{"x = 0"}</M>;
          </li>
          <li>
            <M>{"|xy| = |x|\\,|y|"}</M> and <M>{"|-x| = |x|"}</M>;
          </li>
          <li>
            <M>{"-|x| \\le x \\le |x|"}</M>;
          </li>
          <li>
            <M>{"|x| < r"}</M> if and only if <M>{"-r < x < r"}</M>; so <M>{"|x - a| < r"}</M> if and only if{" "}
            <M>{"a - r < x < a + r"}</M>.
          </li>
        </ol>
        <p>Each follows by checking the cases x positive, zero and negative.</p>
      </Theorem>

      <Theorem title="the triangle inequality">
        <p>
          For all real x and y, <M>{"|x + y| \\le |x| + |y|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>By property 3, <M>{"-|x| \\le x \\le |x|"}</M> and <M>{"-|y| \\le y \\le |y|"}</M>. Adding,</p>
        <MD>{"-(|x| + |y|) \\le x + y \\le |x| + |y|,"}</MD>
        <p>
          which by property 4 (in its form with <M>{"\\le"}</M>) says exactly that <M>{"|x + y| \\le |x| + |y|"}</M>.
        </p>
      </Proof>

      <Remark title="why it is called the triangle inequality">
        <p>
          Put <M>{"x = a - b"}</M> and <M>{"y = b - c"}</M>. Then it says <M>{"|a - c| \\le |a - b| + |b - c|"}</M>: going from
          a to c directly is never longer than going by way of b. In the plane, this is the fact that one side of a triangle is
          never longer than the other two together.
        </p>
      </Remark>

      <Example title="solving an inequality">
        <p>
          Solve <M>{"|2x - 1| < 5"}</M>. By property 4, this means <M>{"-5 < 2x - 1 < 5"}</M>, so <M>{"-4 < 2x < 6"}</M>, so{" "}
          <M>{"-2 < x < 3"}</M>. And <M>{"|x + 3| \\ge 2"}</M> means x is at least 2 away from <M>{"-3"}</M>: either{" "}
          <M>{"x \\le -5"}</M> or <M>{"x \\ge -1"}</M>.
        </p>
      </Example>

      <Example title="an estimate, of the kind analysis is made of">
        <p>
          Suppose <M>{"|x - 2| < 1"}</M>. How far is <M>{"x^2"}</M> from 4? Factorise:{" "}
          <M>{"|x^2 - 4| = |x - 2|\\,|x + 2|"}</M>. Since <M>{"1 < x < 3"}</M>, we have <M>{"3 < x + 2 < 5"}</M>, so{" "}
          <M>{"|x + 2| < 5"}</M>, and
        </p>
        <MD>{"|x^2 - 4| < 5\\,|x - 2|."}</MD>
        <p>
          So to make <M>{"x^2"}</M> within 0.01 of 4, it is enough to make x within 0.002 of 2. The method, bounding one
          factor crudely and keeping the other small, is the heart of the next chapter.
        </p>
      </Example>

      <Theorem title="the reverse triangle inequality">
        <p>
          For all real x and y, <M>{"\\big|\\,|x| - |y|\\,\\big| \\le |x - y|"}</M>.
        </p>
      </Theorem>
      <p>You will prove this in the practice. It says that nearby numbers have nearby sizes.</p>
    </>
  ),

  practice: [
    {
      key: "evaluate",
      rung: "check",
      prompt: (
        <p>
          Evaluate <M>{"|-7| + |3 - 5|"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "interval",
      rung: "check",
      prompt: (
        <p>
          Which interval is the set of x with <M>{"|x - 4| < 3"}</M>?
        </p>
      ),
      answer: { kind: "choice", options: ["(−3, 3)", "(1, 7)", "(−1, 7)", "(4, 7)"], correct: [1] },
    },
    {
      key: "integers",
      rung: "apply",
      prompt: (
        <p>
          How many integers x satisfy <M>{"|2x - 1| < 5"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "outside",
      rung: "apply",
      prompt: (
        <p>
          Which describes the solutions of <M>{"|x - 1| \\ge 4"}</M>?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["−3 ≤ x ≤ 5", "x ≤ −3 or x ≥ 5", "x ≥ 5", "x ≤ −4 or x ≥ 4"],
        correct: [1],
      },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: (
        <p>
          Suppose <M>{"|x - 3| < 1"}</M>. Then <M>{"|x^2 - 9| < K\\,|x - 3|"}</M> for which smallest whole number K obtained by
          the method of the lesson (bound <M>{"|x + 3|"}</M>)?
        </p>
      ),
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [3, -7, 2]
print(abs(sum(xs)), sum(abs(x) for x in xs))`}</Code>
          <p>This prints two numbers, illustrating the triangle inequality. What is the first?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [x / 4 for x in range(-20, 21)]
sol = [x for x in xs if abs(x - 1) + abs(x + 2) <= 5]
print(sol[0], sol[-1], len(sol))`}</Code>
          <p>|x − 1| + |x + 2| ≤ 5 on a grid of quarters. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-3.0 2.0 21", "-2.0 1.0 13", "-3.0 2.0 20", "-3.25 2.25 23"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>solve_abs(a, c, r)</C>, which returns the interval (lo, hi) of x with |x − c| &lt; r, scaled: the solutions of |a·x − c| &lt; r for a &gt; 0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def solve_abs(a, c, r):
    return (c - r, c + r)
`,
        solution: `def solve_abs(a, c, r):
    return ((c - r) / a, (c + r) / a)
`,
        tests: [
          { name: "plain", code: `assert solve_abs(1, 3, 2) == (1, 5), '|x − 3| < 2 means 1 < x < 5.'` },
          { name: "scaled", code: `lo, hi = solve_abs(2, 6, 1)
assert abs(lo - 2.5) < 1e-12 and abs(hi - 3.5) < 1e-12, '|2x − 6| < 1 means 2.5 < x < 3.5: divide by a.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sum_abs_solve(points, r)</C>, the solution set of |x − p₁| + |x − p₂| + … + |x − pₖ| ≤ r as a closed interval (lo, hi), or <C>None</C>. The left side is convex and piecewise linear with kinks at the pᵢ, so: find its minimum (at a median of the points), return <C>None</C> if that exceeds r, and otherwise solve for each end on the correct linear piece. Then write <C>minimiser(points)</C>, the smallest x achieving the minimum.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sum_abs_solve(points, r):
    return (min(points) - r, max(points) + r)

def minimiser(points):
    return sum(points) / len(points)
`,
        solution: `def f(points, x):
    return sum(abs(x - p) for p in points)

def minimiser(points):
    s = sorted(points)
    return s[(len(s) - 1) // 2]

def sum_abs_solve(points, r):
    s = sorted(points)
    m = minimiser(s)
    if f(s, m) > r:
        return None
    def end(direction):
        knots = sorted({p for p in s if (p - m) * direction > 0}, key=lambda p: direction * p)
        x = m
        for k in knots + [None]:
            fx = f(s, x)
            nxt = k if k is not None else x + direction
            slope = abs(f(s, nxt) - fx) / abs(nxt - x)
            if k is None or f(s, k) > r:
                return x + direction * (r - fx) / slope
            x = k
    return (end(-1), end(1))
`,
        tests: [
          { name: "two points", code: `assert sum_abs_solve([1, -2], 5) == (-3.0, 2.0) and sum_abs_solve([1, -2], 3) == (-2, 1), '|x − 1| + |x + 2| is 3 between the points.'` },
          { name: "empty", code: `assert sum_abs_solve([0, 10], 9) is None, 'The sum is at least 10.'` },
          { name: "three", code: `lo, hi = sum_abs_solve([0, 1, 5], 9)
assert abs(lo - (-1)) < 1e-12 and abs(hi - 5) < 1e-12, 'Solve on the right linear piece.'` },
          { name: "brute", code: `import random
random.seed(6)
for _ in range(40):
    pts = [random.randint(-10, 10) for _ in range(random.randint(1, 6))]
    r = random.randint(0, 60)
    res = sum_abs_solve(pts, r)
    grid = [k / 8 for k in range(-800, 801) if sum(abs(k / 8 - p) for p in pts) <= r + 1e-12]
    if res is None:
        assert not grid, (pts, r)
    else:
        assert abs(res[0] - grid[0]) <= 0.125 + 1e-9 and abs(res[1] - grid[-1]) <= 0.125 + 1e-9, (pts, r, res)` },
          { name: "median", code: `assert minimiser([5, 1, 3]) == 3 and minimiser([4, 1, 3, 2]) == 2, 'A median minimises a sum of distances.'` },
        ],
      },
    },
    {
      key: "reverse",
      rung: "prove",
      prompt: (
        <p>
          Prove the reverse triangle inequality: <M>{"\\big|\\,|x| - |y|\\,\\big| \\le |x - y|"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes x = (x − y) + y and applies the triangle inequality to get |x| − |y| ≤ |x − y|.",
          "Swaps the roles of x and y to get |y| − |x| ≤ |x − y|.",
          "Combines the two using property 4 (with ≤).",
        ],
      },
    },
    {
      key: "sum-close",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"\\varepsilon > 0"}</M>. Prove that if <M>{"|x - a| < \\varepsilon/2"}</M> and{" "}
          <M>{"|y - b| < \\varepsilon/2"}</M>, then <M>{"|(x + y) - (a + b)| < \\varepsilon"}</M>. What would you need to
          assume about x and y to make <M>{"xy"}</M> within <M>{"\\varepsilon"}</M> of ab?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rearranges (x + y) − (a + b) as (x − a) + (y − b) and applies the triangle inequality.",
          "Adds the two bounds to get less than ε.",
          "For the product, writes xy − ab = x(y − b) + b(x − a), or similar, and notes that a bound on |x| is needed as well.",
          "Proposes a reasonable condition, such as |x − a| < 1 together with suitably small distances.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what |x − a| < r means on the number line, and why the triangle inequality is true.",

  glimpse: (
    <p>
      Next comes the idea of a limit, and then its precise definition, written entirely in the language of this lesson: f(x) is close to L whenever x is close enough to a. In Real Analysis, distance itself becomes the object of study, and the triangle inequality becomes one of the axioms that define it; the norms of Linear Algebra II measure the size of vectors and matrices the same way.
    </p>
  ),
};
