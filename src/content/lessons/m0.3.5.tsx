import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { TransformViz } from "@/components/viz/TransformViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.3.5",
  minutes: 65,
  links: {
    revisits: ["m0.3.3"],
    foreshadows: ["m0.4.2", "m0.5.3", "m3.8.1"],
  },

  puzzle: (
    <>
      <p>
        You know the graph of <M>{"y = x^2"}</M>: a parabola with its vertex at the origin. Now look at{" "}
        <M>{"y = (x - 3)^2"}</M>. Most people&rsquo;s first guess is that the minus sign moves the parabola to the left.
      </p>
      <p>
        Check: where is <M>{"(x - 3)^2"}</M> equal to zero? Which way did the parabola actually move, and why is the first
        guess so tempting and so wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <M>{"(x - 3)^2"}</M> is zero at <M>{"x = 3"}</M>, so the vertex moved to the <em>right</em>. Here is why. The new
        function at <M>x</M> does what the old one did at <M>{"x - 3"}</M>. To get the old value at 0, the new function
        needs input 3. Every feature of the old graph appears 3 units later. Changes inside the function act on the input,
        and the graph responds by moving the opposite way.
      </p>
      <p>
        Changes outside act on the output and behave as you expect: <M>{"x^2 + 3"}</M> is 3 units higher. Use the sliders
        on <M>{"y = a f(b(x - h)) + k"}</M> to see all four kinds of change, with the original graph as a ghost.
      </p>
      <TransformViz />
    </>
  ),

  theory: (
    <>
      <p>Throughout, <M>f</M> is a function and <M>{"h, k, a, b"}</M> are constants with <M>a</M> and <M>b</M> non-zero.</p>

      <Theorem title="translations">
        <ul>
          <li>The graph of <M>{"y = f(x) + k"}</M> is the graph of <M>{"y = f(x)"}</M> moved up by <M>k</M>.</li>
          <li>The graph of <M>{"y = f(x - h)"}</M> is the graph of <M>{"y = f(x)"}</M> moved right by <M>h</M>.</li>
        </ul>
        <p>(Negative <M>k</M> moves down, and negative <M>h</M> moves left.)</p>
      </Theorem>
      <Proof>
        <p>
          The first: <M>{"(x, y)"}</M> is on the old graph exactly when <M>{"(x, y + k)"}</M> is on the new one. The second:
          a point <M>{"(u, v)"}</M> is on the new graph exactly when <M>{"v = f(u - h)"}</M>, that is, exactly when{" "}
          <M>{"(u - h, v)"}</M> is on the old graph. So the new graph consists of the old points with <M>h</M> added to
          their first coordinate: the old graph moved right by <M>h</M>.
        </p>
      </Proof>

      <Theorem title="stretches and reflections">
        <ul>
          <li>
            <M>{"y = a f(x)"}</M>: each point <M>{"(x, y)"}</M> moves to <M>{"(x, ay)"}</M>, a vertical stretch by factor{" "}
            <M>a</M>. If <M>{"a = -1"}</M> this is reflection in the <M>x</M>-axis.
          </li>
          <li>
            <M>{"y = f(bx)"}</M>: each point <M>{"(x, y)"}</M> moves to <M>{"(\\tfrac{x}{b}, y)"}</M>, a horizontal stretch by
            factor <M>{"\\tfrac1b"}</M>. If <M>{"b = -1"}</M> this is reflection in the <M>y</M>-axis.
          </li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          The first is immediate from the definition. For the second, <M>{"(u, v)"}</M> is on the new graph exactly when{" "}
          <M>{"v = f(bu)"}</M>, exactly when <M>{"(bu, v)"}</M> is on the old graph. So an old point <M>{"(x, y)"}</M>{" "}
          corresponds to the new point with <M>{"bu = x"}</M>, that is <M>{"(\\tfrac{x}{b}, y)"}</M>. Again the input
          change acts inversely: multiplying the input by 2 <em>halves</em> horizontal distances.
        </p>
      </Proof>

      <Definition title="the general form">
        <p>The four moves combine as</p>
        <MD>{"y = a\\, f\\big(b(x - h)\\big) + k."}</MD>
        <p>
          Read it as a composition. Starting from a point <M>{"(x, y)"}</M> on the graph of <M>f</M>: stretch
          horizontally by <M>{"\\tfrac1b"}</M>, shift right by <M>h</M>, stretch vertically by <M>a</M>, shift up by{" "}
          <M>k</M>. The point ends at <M>{"\\big(\\tfrac{x}{b} + h,\\ ay + k\\big)"}</M>.
        </p>
      </Definition>

      <Example title="a parabola from the standard one">
        <p>
          Sketch <M>{"y = -2(x + 1)^2 + 3"}</M>. Here <M>{"f(x) = x^2"}</M>, <M>{"a = -2"}</M>, <M>{"h = -1"}</M>,{" "}
          <M>{"k = 3"}</M>. Start from <M>{"y = x^2"}</M>, move left 1, stretch vertically by 2 and flip, then lift by 3. The
          vertex <M>{"(0, 0)"}</M> goes to <M>{"(-1, 3)"}</M>, the point <M>{"(1, 1)"}</M> to <M>{"(0, 1)"}</M>, and the
          parabola opens downwards. Vertex form, from the lesson on quadratic functions, was this theorem in disguise: every quadratic is a
          transformed copy of <M>{"x^2"}</M>.
        </p>
      </Example>

      <Example title="order matters inside">
        <p>
          <M>{"f(2x - 6)"}</M> is not <M>f</M> squeezed by 2 and then shifted right 6. Factor first:{" "}
          <M>{"f(2(x - 3))"}</M>, a squeeze by 2 and a shift right by 3. Check with a root: if <M>{"f(0) = 0"}</M>, then{" "}
          <M>{"f(2x - 6) = 0"}</M> when <M>{"2x - 6 = 0"}</M>, at <M>{"x = 3"}</M>.
        </p>
      </Example>

      <Remark title="why bother">
        <p>
          A small library of basic graphs, <M>{"x^2"}</M>, <M>{"x^3"}</M>, <M>{"|x|"}</M>, <M>{"\\sqrt x"}</M>,{" "}
          <M>{"\\tfrac1x"}</M>, and soon exponentials and sine waves, combined with these four moves, lets you sketch a
          large family of functions without plotting a single point. More deeply, it shows a habit that runs through all of
          mathematics: understand one object well, then understand everything obtained from it by simple changes of
          coordinates. In Linear Algebra, stretches and reflections become matrices; in Probability, the same rules tell you
          how a distribution changes when you rescale or shift a random quantity.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "direction",
      rung: "check",
      prompt: <p>How is the graph of <M>{"y = (x + 4)^2"}</M> obtained from <M>{"y = x^2"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["shift right by 4", "shift left by 4", "shift up by 4", "shift down by 4"],
        correct: [1],
      },
    },
    {
      key: "vertex",
      rung: "check",
      prompt: <p>What is the <M>y</M>-coordinate of the vertex of <M>{"y = 3(x - 2)^2 - 5"}</M>?</p>,
      answer: { kind: "numeric", value: -5 },
    },
    {
      key: "reflect",
      rung: "apply",
      prompt: <p>Which equation gives the reflection of <M>{"y = \\sqrt{x}"}</M> in the <M>y</M>-axis?</p>,
      answer: {
        kind: "choice",
        options: ["y = −√x", "y = √(−x)", "y = 1/√x", "y = −√(−x)"],
        correct: [1],
      },
    },
    {
      key: "build",
      rung: "apply",
      prompt: <p>The graph of <M>{"y = x^2"}</M> is moved right by 3 and then up by 2. Write the new equation as <M>{"y = \\ldots"}</M>.</p>,
      answer: { kind: "expression", value: "(x - 3)^2 + 2", variables: ["x"] },
    },
    {
      key: "root",
      rung: "apply",
      prompt: <p>The only root of <M>f</M> is <M>{"x = 6"}</M>. What is the only root of <M>{"y = f(2x)"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def f(x):
    return x * x

def g(x):
    return f(x - 2) + 1

print(min(range(-10, 11), key=g), g(2))`}</Code>
          <p>g is f shifted. Where is the lowest point of g, and its height?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 1", "-2 1", "2 -1", "-2 5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def f(x):
    return x * x

def g(x):
    return 2 * f(x - 3) + 1

def h(x):
    return f(2 * x)

print(g(3), g(4), h(3))`}</Code>
          <p>g shifts f right 3, stretches it by 2 and lifts it 1; h squeezes it horizontally. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 3 36", "1 3 18", "19 3 36", "1 9 36"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>transform_at(f, h, k, a, x)</C>, the value at x of a · f(x − h) + k: the graph of f stretched by a, moved right by h and up by k.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def transform_at(f, h, k, a, x):
    return a * f(x + h) + k
`,
        solution: `def transform_at(f, h, k, a, x):
    return a * f(x - h) + k
`,
        tests: [
          { name: "shift", code: `def f(x):
    return x * x
assert transform_at(f, 3, -1, 1, 3) == -1 and transform_at(f, 3, -1, 1, 4) == 0, 'Moving right by h means feeding x − h into f.'` },
          { name: "stretch", code: `def f(x):
    return x * x
assert transform_at(f, 0, 0, -2, -3) == -18 and transform_at(f, 1, 2, 3, 3) == 14, 'a multiplies the output; a negative a flips the graph.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            A transformed graph y = a·f(b(x − h)) + k moves each point of y = f(x). Write <C>move_point(x, y, a, b, h, k)</C>, which returns where the point (x, y) of the original graph ends up (with b ≠ 0), and <C>fit_shift(f, g, xs)</C>, which finds the integers h and k in −10…10 with g(x) = f(x − h) + k at every x in xs, or returns <C>None</C> if no such pair exists.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def move_point(x, y, a, b, h, k):
    return (x + h, y + k)

def fit_shift(f, g, xs):
    return (0, 0)
`,
        solution: `def move_point(x, y, a, b, h, k):
    return (x / b + h, a * y + k)

def fit_shift(f, g, xs):
    for h in range(-10, 11):
        for k in range(-10, 11):
            if all(abs(g(x) - (f(x - h) + k)) < 1e-9 for x in xs):
                return (h, k)
    return None
`,
        tests: [
          { name: "shift", code: `assert move_point(1, 1, 1, 1, 3, -2) == (4, -1), 'A shift moves right by h and up by k.'` },
          { name: "scale", code: `assert move_point(2, 4, 3, 2, 0, 0) == (1.0, 12), 'b = 2 squeezes x by half, a = 3 stretches y.'` },
          { name: "check", code: `f = lambda x: x ** 3 - x
for (x, y) in [(0.5, f(0.5)), (2, f(2)), (-1.5, f(-1.5))]:
    X, Y = move_point(x, y, -2, 3, 1, 4)
    assert abs(Y - (-2 * f(3 * (X - 1)) + 4)) < 1e-9, 'The moved point must lie on the new graph.'` },
          { name: "fit", code: `f = lambda x: x * x
assert fit_shift(f, lambda x: (x - 3) ** 2 - 5, range(-4, 5)) == (3, -5) and fit_shift(f, lambda x: 2 * x * x, range(-4, 5)) is None, 'Try every h and k.'` },
        ],
      },
    },
    {
      key: "shift-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that if the graph of <M>f</M> is symmetric in the vertical line <M>{"x = h"}</M>, meaning{" "}
          <M>{"f(h + t) = f(h - t)"}</M> for every <M>t</M>, then <M>{"g(x) = f(x + h)"}</M> is an even function. Explain
          the result in terms of moving the graph.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes g(−x) = f(h − x) and g(x) = f(h + x).",
          "Uses the symmetry with t = x to conclude g(−x) = g(x).",
          "Explains that g is the graph of f moved left by h, so the axis of symmetry moves to the y-axis.",
        ],
      },
    },
    {
      key: "track-point",
      rung: "stretch",
      prompt: (
        <p>
          The graph of <M>{"y = f(x)"}</M> passes through <M>{"(4, -2)"}</M>. The graph of <M>{"y = 3f(2x - 2) + 1"}</M>{" "}
          passes through a point with <M>{"x = 3"}</M>. What is its <M>y</M>-coordinate?
        </p>
      ),
      answer: { kind: "numeric", value: -5 },
    },
  ],

  teachBack:
    "Explain to a friend why y = (x − 3)² is shifted right, not left. Use the idea that the new function at x does what the old one did somewhere else.",

  glimpse: (
    <p>
      This completes functions. Next comes the chapter on exponentials and logarithms, where these transformations sketch
      every exponential curve from one, and the trigonometric functions, where they turn one sine wave into every wave. In
      Linear Algebra, stretches and reflections of the whole plane become matrices, and in Probability the same rules describe
      how distributions transform.
    </p>
  ),
};
