import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { TwoLinesViz } from "@/components/viz/TwoLinesViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.2.3",
  minutes: 65,
  links: {
    foreshadows: ["m3.2.1", "m3.2.3", "m3.6.1", "m11.2.1"],
  },

  puzzle: (
    <>
      <p>
        A Chinese book of about 400 CE, the <em>Sunzi Suanjing</em>, asks: a cage holds pheasants and rabbits. There are
        35 heads and 94 feet. How many of each are there?
      </p>
      <p>
        Try it without algebra first, by any method you like. Then ask: could two different answers both fit? Could a
        different count of heads and feet have no answer at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        One old way: tell every animal to lift two feet. Now pheasants stand on none and rabbits on two, and{" "}
        <M>{"94 - 70 = 24"}</M> feet are still on the ground. Those belong to rabbits, two each, so there are 12 rabbits
        and 23 pheasants. The trick was to remove one unknown, the pheasants, so that only the rabbits were left.
      </p>
      <p>
        In algebra, with <M>p</M> pheasants and <M>r</M> rabbits, the facts are <M>{"p + r = 35"}</M> and{" "}
        <M>{"2p + 4r = 94"}</M>. Taking twice the first from the second removes <M>p</M>: <M>{"2r = 24"}</M>. That is the
        same trick, written down. It is called <strong>elimination</strong>.
      </p>
      <p>
        There is also a picture. The pairs that satisfy one such equation lie on a straight line, so two equations are two
        lines, and a solution of both is a point on both. Two lines can cross once, never meet, or be the same line. Move
        the sliders and find all three.
      </p>
      <TwoLinesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a system of two linear equations">
        <p>A <strong>system of two linear equations</strong> in two unknowns has the form</p>
        <MD>{"\\begin{aligned} ax + by &= e, \\\\ cx + dy &= f, \\end{aligned}"}</MD>
        <p>
          where <M>a, b, c, d, e, f</M> are known numbers. A <strong>solution</strong> is a pair <M>{"(x, y)"}</M> that
          makes both equations true at once. The <strong>solution set</strong> is the collection of all solutions.
        </p>
      </Definition>

      <p>
        Elimination replaces one equation by itself plus a multiple of the other. Why is that allowed? A balance rule from
        the last lesson changes one equation but keeps its solutions. Here we are mixing two equations, which needs its own
        argument.
      </p>

      <Theorem title="elimination keeps the solutions">
        <p>
          For any number <M>k</M>, the system <M>{"P = e, \\ Q = f"}</M> has exactly the same solutions as the system{" "}
          <M>{"P = e, \\ Q + kP = f + ke"}</M>. Here <M>P</M> and <M>Q</M> stand for the left-hand sides.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>{"(x, y)"}</M> solves the first system. Then <M>{"P = e"}</M> and <M>{"Q = f"}</M> at that point, so{" "}
          <M>{"Q + kP = f + ke"}</M>, and it solves the second.
        </p>
        <p>
          Conversely, suppose it solves the second. Then <M>{"P = e"}</M>, so <M>{"kP = ke"}</M>; subtracting this from{" "}
          <M>{"Q + kP = f + ke"}</M> gives <M>{"Q = f"}</M>, and it solves the first. The step can be undone, which is
          exactly why it neither gains nor loses solutions.
        </p>
      </Proof>

      <Theorem title="how many solutions">
        <p>
          If <M>{"ad - bc \\neq 0"}</M>, the system has exactly one solution:
        </p>
        <MD>{"x = \\frac{ed - bf}{ad - bc}, \\qquad y = \\frac{af - ce}{ad - bc}."}</MD>
        <p>
          If <M>{"ad - bc = 0"}</M>, it has either no solution or infinitely many.
        </p>
      </Theorem>
      <Proof>
        <p>
          Multiply the first equation by <M>d</M> and the second by <M>b</M>, and subtract. The <M>y</M> terms cancel:
        </p>
        <MD>{"(ad - bc)\\,x = ed - bf."}</MD>
        <p>
          In the same way, multiplying by <M>c</M> and <M>a</M> and subtracting cancels <M>x</M>:{" "}
          <M>{"(ad - bc)\\,y = af - ce"}</M>. Every solution satisfies these two equations. If <M>{"ad - bc \\neq 0"}</M>{" "}
          we may divide, so a solution can only be the pair above; substituting it back shows that it does work.
        </p>
        <p>
          If <M>{"ad - bc = 0"}</M>, the two left-hand sides are proportional (when the equations are not trivial), so the
          lines have the same slope. Parallel lines either never meet, giving no solution, or coincide, giving every point
          of the line.
        </p>
      </Proof>

      <p>
        The number <M>{"ad - bc"}</M> decides everything, and it uses only the coefficients, not the right-hand sides. It
        is called the <strong>determinant</strong> of the system. In the picture, it is zero exactly when the two lines
        are parallel.
      </p>

      <Example title="the puzzle, by the formula">
        <p>
          For <M>{"p + r = 35"}</M>, <M>{"2p + 4r = 94"}</M>: <M>{"a = 1, b = 1, c = 2, d = 4"}</M>, so{" "}
          <M>{"ad - bc = 2"}</M>. Then <M>{"p = \\tfrac{35 \\cdot 4 - 1 \\cdot 94}{2} = 23"}</M> and{" "}
          <M>{"r = \\tfrac{1 \\cdot 94 - 2 \\cdot 35}{2} = 12"}</M>. Check: 35 heads, <M>{"46 + 48 = 94"}</M> feet. And
          if a cage had 35 heads and 69 feet? The formula still gives an answer, <M>{"r = -0.5"}</M>, but no cage holds
          half a negative rabbit: the algebra is right and the story has no solution.
        </p>
      </Example>

      <Remark title="nearly parallel lines">
        <p>
          When <M>{"ad - bc"}</M> is not zero but very small, the lines are nearly parallel, and they cross far away at a
          shallow angle. Then a tiny change in <M>e</M> or <M>f</M>, from a rounding error or a noisy measurement, slides
          the crossing point a long way. Compare <M>{"x + y = 2, \\ x + 1.001y = 2"}</M>, solved by <M>{"(2, 0)"}</M>, with{" "}
          <M>{"x + y = 2, \\ x + 1.001y = 2.001"}</M>, solved by <M>{"(1, 1)"}</M>. Such a system is called{" "}
          <em>ill-conditioned</em>. Computers solve systems with millions of unknowns by elimination, and how badly
          rounding can hurt them is measured by a condition number, a later cousin of this remark.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "solve",
      rung: "check",
      prompt: <p>Solve <M>{"3x + y = 11"}</M> and <M>{"x - y = 1"}</M> together. What is <M>x</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "how-many",
      rung: "check",
      prompt: <p>How many solutions does the system <M>{"2x + 4y = 6"}</M>, <M>{"x + 2y = 5"}</M> have?</p>,
      answer: { kind: "choice", options: ["None", "Exactly one", "Infinitely many"], correct: [0] },
    },
    {
      key: "tickets",
      rung: "apply",
      prompt: (
        <p>
          A cinema sells adult tickets at &#8377;300 and child tickets at &#8377;180. One evening it sells 120 tickets for
          &#8377;31,200. How many child tickets were sold?
        </p>
      ),
      answer: { kind: "numeric", value: 40 },
    },
    {
      key: "parameter",
      rung: "apply",
      prompt: (
        <p>
          For which value of <M>k</M> does the system <M>{"kx + 3y = 1"}</M>, <M>{"4x + 6y = 5"}</M> fail to have exactly
          one solution?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "infinite",
      rung: "apply",
      prompt: <p>Select every system with infinitely many solutions.</p>,
      answer: {
        kind: "choice",
        options: ["x + y = 1 and 2x + 2y = 2", "x + y = 1 and x + y = 2", "x − y = 0 and 3x − 3y = 0", "x + y = 1 and x − y = 1"],
        correct: [0, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a, b, e = 1, 1, 10
c, d, f = 1, -1, 2
det = a * d - b * c
print(det, (e * d - b * f) / det, (a * f - e * c) / det)`}</Code>
          <p>Cramer's rule for x + y = 10, x − y = 2. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-2 6.0 4.0", "2 6.0 4.0", "-2 4.0 6.0", "0 6.0 4.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>solve2(a, b, e, c, d, f)</C> for the system ax + by = e, cx + dy = f, returning (x, y) by elimination, or <C>None</C> when ad − bc = 0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def solve2(a, b, e, c, d, f):
    return (e / a, f / d)
`,
        solution: `def solve2(a, b, e, c, d, f):
    det = a * d - b * c
    if det == 0:
        return None
    return ((e * d - b * f) / det, (a * f - e * c) / det)
`,
        tests: [
          { name: "sum and difference", code: `x, y = solve2(1, 1, 10, 1, -1, 2)
assert abs(x - 6) < 1e-9 and abs(y - 4) < 1e-9, 'x + y = 10 and x − y = 2 give x = 6, y = 4.'` },
          { name: "mixed", code: `x, y = solve2(2, 3, 13, 5, -1, 7)
assert abs(x - 2) < 1e-9 and abs(y - 3) < 1e-9, 'Check by substituting back.'` },
          { name: "parallel", code: `assert solve2(1, 2, 3, 2, 4, 5) is None, 'Parallel lines never meet.'` },
        ],
      },
    },
    {
      key: "unique-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"ad - bc \\neq 0"}</M>, the system <M>{"ax + by = 0"}</M>, <M>{"cx + dy = 0"}</M> has only the
          solution <M>{"(0, 0)"}</M>. Then show by an example that the conclusion can fail when <M>{"ad - bc = 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that (0, 0) is a solution.",
          "Eliminates y (multiply by d and b and subtract) to get (ad − bc)x = 0, and similarly (ad − bc)y = 0.",
          "Divides by ad − bc, using that it is nonzero, to conclude x = 0 and y = 0.",
          "Gives a system with ad − bc = 0 and a nonzero solution, such as x + y = 0, 2x + 2y = 0 with (1, −1).",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          Elimination works with more unknowns too. Solve <M>{"x + y + z = 6"}</M>, <M>{"x - y + z = 2"}</M>,{" "}
          <M>{"2x + y - z = 1"}</M>. What is <M>z</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend why two linear equations in two unknowns can have one solution, none or infinitely many, using the picture of two lines, and say what the number ad − bc tells you.",

  glimpse: (
    <p>
      Next, inequalities, where the balance tips. In Linear Algebra, systems with any number of equations and unknowns are
      solved by Gaussian elimination, the method you just used made systematic, and the number <M>{"ad - bc"}</M> grows up
      into the determinant of a matrix, which measures how a transformation scales area. In Numerical Linear Algebra and
      Scientific Computing, the nearly parallel lines of the last remark become the study of conditioning.
    </p>
  ),
};
