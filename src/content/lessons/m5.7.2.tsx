import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FubiniSliceViz } from "@/components/viz/FubiniSliceViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.7.2",
  minutes: 55,
  links: {
    requires: ["m5.7.1", "m2.6.3"],
    revisits: ["m2.6.4"],
    foreshadows: ["m5.7.3"],
  },

  puzzle: (
    <>
      <p>
        The integral <M>{"\\int_0^1 \\int_x^1 e^{y^2}\\,dy\\,dx"}</M> looks hopeless: <M>{"e^{y^2}"}</M> has no elementary
        antiderivative. Yet its value is exactly (e − 1)/2.
      </p>
      <p>What trick turns an impossible integral into an easy one, and when is that trick allowed?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A double integral adds up f over a region. You can add it up in slices: first along each vertical line, then add the
        slices; or first along each horizontal line. Both orders count the same total, so a hard inner integral in one order
        may be easy in the other.
      </p>
      <FubiniSliceViz />
      <p>
        Swapping order on a non-rectangular region means rewriting the limits: the region must be described the other way
        round. Sketching it is the reliable way.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="Fubini's theorem">
        <p>If f is continuous on <M>{"R = [a, b] \\times [c, d]"}</M>, then</p>
        <MD>{"\\iint_R f\\,dA = \\int_a^b \\Big( \\int_c^d f(x, y)\\,dy \\Big) dx = \\int_c^d \\Big( \\int_a^b f(x, y)\\,dx \\Big) dy."}</MD>
        <p>
          For a region <M>{"D = \\{a \\le x \\le b,\\ \\phi(x) \\le y \\le \\psi(x)\\}"}</M> with continuous boundaries,{" "}
          <M>{"\\iint_D f\\,dA = \\int_a^b \\int_{\\phi(x)}^{\\psi(x)} f(x, y)\\,dy\\,dx"}</M>. More generally, the conclusion holds
          whenever <M>{"\\iint |f|\\,dA < \\infty"}</M> (Fubini), or whenever f ≥ 0 (Tonelli), with the integrals allowed to be
          infinite.
        </p>
      </Theorem>
      <Proof>
        <p>
          (Sketch for a rectangle.) Take an n × n grid. The Riemann sum can be grouped by columns:{" "}
          <M>{"\\sum_i \\big(\\sum_j f(x_i, y_j)\\Delta y\\big)\\Delta x"}</M>. By uniform continuity, each inner sum is within{" "}
          <M>{"\\varepsilon(d - c)"}</M> of <M>{"F(x_i) = \\int_c^d f(x_i, y)\\,dy"}</M> once the grid is fine, uniformly in i.
          So the whole sum is close to <M>{"\\sum_i F(x_i)\\Delta x"}</M>, a Riemann sum for <M>{"\\int_a^b F"}</M> (F is
          continuous). Both sides tend to their integrals. Grouping by rows gives the other order.
        </p>
      </Proof>

      <Example title="swapping the order">
        <p>
          The region <M>{"\\{0 \\le x \\le 1,\\ x \\le y \\le 1\\}"}</M> is also <M>{"\\{0 \\le y \\le 1,\\ 0 \\le x \\le y\\}"}</M>.
          So
        </p>
        <MD>{"\\int_0^1\\!\\!\\int_x^1 e^{y^2}\\,dy\\,dx = \\int_0^1\\!\\!\\int_0^y e^{y^2}\\,dx\\,dy = \\int_0^1 y\\,e^{y^2}\\,dy = \\tfrac12(e - 1)."}</MD>
      </Example>

      <Example title="when Fubini fails">
        <p>
          For <M>{"f(x, y) = (x^2 - y^2)/(x^2 + y^2)^2"}</M> on <M>{"[0, 1]^2"}</M>,{" "}
          <M>{"\\int_0^1 f(x, y)\\,dy = 1/(1 + x^2)"}</M>, so one iterated integral is π/4; by antisymmetry the other is −π/4.
          The function is not absolutely integrable near the origin, and the two orders disagree.
        </p>
      </Example>

      <Remark title="Fubini in probability">
        <p>
          For independent X and Y with densities p and q, the joint density is p(x)q(y), and Fubini gives{" "}
          <M>{"E[g(X)h(Y)] = E[g(X)]\\,E[h(Y)]"}</M> and{" "}
          <M>{"P(X < Y) = \\int q(y) \\int_{-\\infty}^y p(x)\\,dx\\,dy"}</M>. Exchanging an expectation with an integral or a sum
          is the same theorem, and the absolute-integrability condition is exactly what makes it safe.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rect",
      rung: "check",
      prompt: <p>Compute <M>{"\\int_0^1 \\int_0^2 (x + y)\\,dy\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 3, tolerance: 1e-12 },
    },
    {
      key: "limits",
      rung: "check",
      prompt: <p>The region is 0 ≤ y ≤ x ≤ 1. Which iterated integral has the order reversed correctly?</p>,
      answer: {
        kind: "choice",
        options: ["∫₀¹ ∫ᵧ¹ f dx dy", "∫₀¹ ∫₀ʸ f dx dy", "∫₀¹ ∫₀¹ f dx dy", "∫₀ˣ ∫₀¹ f dx dy"],
        correct: [0],
      },
    },
    {
      key: "swap",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^1 \\int_x^1 e^{y^2}\\,dy\\,dx"}</M> by swapping the order. Give four decimal places.</p>,
      answer: { kind: "numeric", value: (Math.E - 1) / 2, tolerance: 1e-4 },
    },
    {
      key: "tri",
      rung: "apply",
      prompt: <p>Compute <M>{"\\iint_D xy\\,dA"}</M> over the triangle <M>{"D = \\{0 \\le y \\le x \\le 1\\}"}</M>.</p>,
      answer: { kind: "numeric", value: 0.125, tolerance: 1e-9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda x, y: x * y
n = 400
total = 0.0
for x in (np.arange(n) + 0.5) / n:
    ys = (np.arange(n) + 0.5) / n * x
    total += np.sum(f(x, ys)) * (x / n) / n
print(round(total, 5))`}</Code>
          <p>An iterated midpoint rule over the triangle 0 ≤ y ≤ x ≤ 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.125", "0.25", "0.0625", "0.16667"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
n = 100000
s = (np.arange(n) + 0.5) / n
dy_first = np.sum(1 / (1 + s ** 2)) / n
dx_first = np.sum(-1 / (1 + s ** 2)) / n
print(round(dy_first, 4), round(dx_first, 4))`}</Code>
          <p>
            For <M>{"f = (x^2 - y^2)/(x^2 + y^2)^2"}</M>, the inner integrals are exactly <M>{"1/(1 + x^2)"}</M> (in y) and{" "}
            <M>{"-1/(1 + y^2)"}</M> (in x). This code does the outer integrals. What does it print?
          </p>
        </>
      ),
      answer: { kind: "choice", options: ["0.7854 -0.7854", "0.7854 0.7854", "0.0 0.0", "1.5708 -1.5708"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iterated(f, a, b, lo, hi, n)</C> computing <M>{"\\int_a^b \\int_{lo(x)}^{hi(x)} f(x, y)\\,dy\\,dx"}</M> by the
          midpoint rule with n points in each integral (f works elementwise on arrays), and{" "}
          <C>iterated_swapped(f, c, d, lo, hi, n)</C> computing <M>{"\\int_c^d \\int_{lo(y)}^{hi(y)} f(x, y)\\,dx\\,dy"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def iterated(f, a, b, lo, hi, n):
    return 0.0

def iterated_swapped(f, c, d, lo, hi, n):
    return 0.0
`,
        solution: `import numpy as np

def iterated(f, a, b, lo, hi, n):
    u = (np.arange(n) + 0.5) / n
    total = 0.0
    for x in a + u * (b - a):
        L, H = lo(x), hi(x)
        total += np.sum(f(x, L + u * (H - L))) * (H - L) / n
    return float(total * (b - a) / n)

def iterated_swapped(f, c, d, lo, hi, n):
    return iterated(lambda y, x: f(x, y), c, d, lo, hi, n)
`,
        tests: [
          { name: "triangle both ways", code: `import numpy as np
f = lambda x, y: x * y
A = iterated(f, 0, 1, lambda x: 0.0, lambda x: x, 300)
B = iterated_swapped(f, 0, 1, lambda y: y, lambda y: 1.0, 300)
assert abs(A - 0.125) < 1e-5 and abs(B - 0.125) < 1e-5, (A, B)` },
          { name: "the e^(y^2) swap", code: `import numpy as np
g = lambda x, y: np.exp(y ** 2) + 0 * x
v = iterated_swapped(g, 0, 1, lambda y: 0.0, lambda y: y, 400)
assert abs(v - (np.e - 1) / 2) < 1e-5, 'x runs from 0 to y when y is outside.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For independent X and Y on [0, 1] with densities px and py, write <C>prob_less(px, py, n)</C>, returning P(X &lt; Y) ={" "}
          <M>{"\\int_0^1 p_y(y) \\int_0^y p_x(x)\\,dx\\,dy"}</M> by the midpoint rule, and{" "}
          <C>expect_product(px, py, g, h, n)</C>, returning E[g(X)h(Y)] as a product of two single integrals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def prob_less(px, py, n):
    return 0.5

def expect_product(px, py, g, h, n):
    return 0.0
`,
        solution: `import numpy as np

def prob_less(px, py, n):
    u = (np.arange(n) + 0.5) / n
    total = 0.0
    for y in u:
        total += py(y) * np.sum(px(u * y)) * y / n
    return float(total / n)

def expect_product(px, py, g, h, n):
    u = (np.arange(n) + 0.5) / n
    return float(np.sum(g(u) * px(u)) / n * np.sum(h(u) * py(u)) / n)
`,
        tests: [
          { name: "probabilities", code: `import numpy as np
one = lambda t: np.ones_like(t) if isinstance(t, np.ndarray) else 1.0
assert abs(prob_less(one, one, 400) - 0.5) < 1e-6
assert abs(prob_less(lambda t: 2 * t, one, 400) - 1 / 3) < 1e-5, 'X with density 2x tends to be large.'` },
          { name: "expectations", code: `import numpy as np
one = lambda t: np.ones_like(t)
v = expect_product(lambda t: 2 * t, one, lambda t: t, lambda t: t ** 2, 500)
assert abs(v - (2 / 3) * (1 / 3)) < 1e-5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Explain why, for f continuous on a rectangle, the double integral equals the iterated integral{" "}
          <M>{"\\int_a^b (\\int_c^d f\\,dy)\\,dx"}</M>. Grouping a Riemann sum by columns is the main idea.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes a grid Riemann sum and groups it as Σ_i (Σ_j f(x_i, y_j) Δy) Δx.",
          "Uses uniform continuity to show each inner sum is uniformly close to F(x_i) = ∫ f(x_i, y) dy for a fine grid.",
          "Concludes the double sum is close to a Riemann sum of the continuous function F, so the limits agree.",
        ],
      },
    },
    {
      key: "fail",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"f(x, y) = (x^2 - y^2)/(x^2 + y^2)^2"}</M> on <M>{"[0, 1]^2"}</M>, what is{" "}
          <M>{"\\int_0^1 \\int_0^1 f\\,dy\\,dx"}</M>? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: Math.PI / 4, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend how Fubini's theorem turns a double integral into two single integrals, how to rewrite the limits when swapping the order, and why the swap can fail.",

  glimpse: (
    <p>
      Some regions are awkward in x and y but simple in other coordinates, such as discs in polar coordinates. Changing
      variables in a multiple integral brings back the Jacobian determinant. Next.
    </p>
  ),
};
