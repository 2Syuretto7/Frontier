import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { Riemann2DViz } from "@/components/viz/Riemann2DViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.7.1",
  minutes: 55,
  links: {
    requires: ["m2.6.2", "m5.1.2"],
    revisits: ["m2.6.1"],
    foreshadows: ["m5.7.2", "m5.7.4"],
  },

  puzzle: (
    <>
      <p>
        A metal plate has a density that varies from point to point. A probability distribution on the plane has a density
        too. To find the plate&rsquo;s mass, or the probability of a region, you must add up density times area over infinitely
        many tiny pieces.
      </p>
      <p>How does the one-dimensional integral extend to regions of the plane and of space?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Chop the region into small rectangles, multiply f at a point in each by its area, and add. As the rectangles shrink,
        the sum settles to a number: the double integral. Volumes, masses, averages and probabilities in several dimensions are
        all such limits.
      </p>
      <Riemann2DViz />
      <p>
        A region that is not a rectangle is handled by integrating over a rectangle containing it, with f set to zero outside.
        That works, but the jump at the boundary costs accuracy, a first sign that integration gets harder as geometry and
        dimension grow.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="double integral over a rectangle">
        <p>
          Let <M>{"R = [a, b] \\times [c, d]"}</M>. Split it into an n × m grid of cells <M>{"R_{ij}"}</M> of area{" "}
          <M>{"\\Delta A_{ij}"}</M> and pick a point <M>{"p_{ij}"}</M> in each. f is integrable on R if the Riemann sums{" "}
          <M>{"\\sum_{i,j} f(p_{ij})\\,\\Delta A_{ij}"}</M> tend to a single limit, whatever the points, as the largest cell
          diameter tends to 0. The limit is <M>{"\\iint_R f\\,dA"}</M>.
        </p>
        <p>
          For a bounded region D inside R, define <M>{"\\iint_D f\\,dA = \\iint_R f\\,\\mathbf 1_D\\,dA"}</M>. Triple integrals
          over boxes in <M>{"\\mathbb R^3"}</M> are defined the same way with volumes.
        </p>
      </Definition>

      <Theorem title="continuous functions are integrable">
        <p>
          If f is continuous on the closed rectangle R, then <M>{"\\iint_R f\\,dA"}</M> exists. The same holds on a region D whose
          boundary is a finite union of smooth curves.
        </p>
      </Theorem>
      <Proof>
        <p>
          (Sketch for R.) A continuous function on a closed bounded set is uniformly continuous: for every ε &gt; 0 there is δ
          with <M>{"|f(p) - f(q)| < \\varepsilon"}</M> whenever <M>{"\\|p - q\\| < \\delta"}</M>. On any grid with cells of
          diameter below δ, the largest and smallest possible Riemann sums differ by at most{" "}
          <M>{"\\varepsilon \\cdot \\mathrm{area}(R)"}</M>, and refining a grid only narrows the gap. So all Riemann sums
          approach one common limit. For D, the boundary can be covered by cells of total area tending to 0, so the jump of{" "}
          <M>{"\\mathbf 1_D"}</M> does not matter in the limit.
        </p>
      </Proof>

      <Example title="interpretations">
        <ul>
          <li>f = 1 gives the area of D; in three dimensions, volume.</li>
          <li>For f ≥ 0, <M>{"\\iint_D f\\,dA"}</M> is the volume under the graph of f over D.</li>
          <li>With a density ρ, the mass is <M>{"\\iint_D \\rho\\, dA"}</M>, and the centre of mass has x-coordinate <M>{"\\iint_D x\\rho\\,dA / \\iint_D \\rho\\,dA"}</M>.</li>
          <li>For a probability density p on the plane, <M>{"P(X \\in D) = \\iint_D p\\,dA"}</M>.</li>
          <li>The average of f over D is <M>{"\\frac{1}{\\mathrm{area}(D)}\\iint_D f\\,dA"}</M>.</li>
        </ul>
      </Example>

      <Remark title="linearity and bounds">
        <p>
          Integrals over regions are linear in f, add over regions that overlap only on their boundaries, and satisfy{" "}
          <M>{"m\\,\\mathrm{area}(D) \\le \\iint_D f \\le M\\,\\mathrm{area}(D)"}</M> when <M>{"m \\le f \\le M"}</M>. Computing
          them exactly needs the next lesson, which reduces a double integral to two single ones.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "box",
      rung: "check",
      prompt: <p>What is <M>{"\\iint_R 3\\,dA"}</M> for <M>{"R = [0, 2] \\times [0, 1]"}</M>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "avg",
      rung: "check",
      prompt: <p>The integral of f over a region of area 4 is 10. What is the average value of f on the region?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 1e-12 },
    },
    {
      key: "xy",
      rung: "apply",
      prompt: <p>Compute <M>{"\\iint_{[0,1]^2} xy\\,dA"}</M>.</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-9 },
    },
    {
      key: "simplex",
      rung: "apply",
      prompt: (
        <p>
          The region <M>{"\\{x, y, z \\ge 0,\\ x + y + z \\le 1\\}"}</M> is a corner of the unit cube cut off by a plane. What is
          its volume? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1 / 6, tolerance: 1e-3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda x, y: x * x + y * y
for n in (2, 4, 8):
    c = (np.arange(n) + 0.5) / n
    X, Y = np.meshgrid(c, c)
    s = f(X, Y).sum() / n ** 2
    print(n, round(s, 5), round(abs(s - 2 / 3), 5))`}</Code>
          <p>Midpoint sums for <M>{"\\iint_{[0,1]^2} (x^2 + y^2)\\,dA = 2/3"}</M>. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 0.625 0.04167\n4 0.65625 0.01042\n8 0.66406 0.0026",
          "2 0.625 0.04167\n4 0.64583 0.02083\n8 0.65625 0.01042",
          "2 0.75 0.08333\n4 0.6875 0.02083\n8 0.67188 0.00521",
          "2 0.625 0.04167\n4 0.65625 0.01042\n8 0.66667 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
for n in (10, 100, 1000):
    c = (np.arange(n) + 0.5) / n
    X, Y = np.meshgrid(c, c)
    area = (X ** 2 + Y ** 2 <= 1).sum() / n ** 2
    print(n, round(4 * area, 4))`}</Code>
          <p>Estimating π from the area of a quarter disc with an indicator. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["10 3.16\n100 3.1428\n1000 3.1417", "10 3.14\n100 3.1416\n1000 3.1416", "10 3.0\n100 3.1\n1000 3.14", "10 3.16\n100 3.16\n1000 3.16"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>midpoint2d(f, a, b, c, d, n)</C>, the midpoint Riemann sum of f over <M>{"[a, b] \\times [c, d]"}</M> with an
          n × n grid, where f takes two NumPy arrays and works elementwise; and <C>region_integral(f, inside, box, n)</C>, which
          integrates f over the region where <C>inside(x, y)</C> is true, within box = (a, b, c, d), by the indicator method.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def midpoint2d(f, a, b, c, d, n):
    return 0.0

def region_integral(f, inside, box, n):
    return 0.0
`,
        solution: `import numpy as np

def midpoint2d(f, a, b, c, d, n):
    hx, hy = (b - a) / n, (d - c) / n
    X, Y = np.meshgrid(a + (np.arange(n) + 0.5) * hx, c + (np.arange(n) + 0.5) * hy)
    return float(np.sum(f(X, Y)) * hx * hy)

def region_integral(f, inside, box, n):
    g = lambda x, y: np.where(inside(x, y), f(x, y), 0.0)
    return midpoint2d(g, *box, n)
`,
        tests: [
          { name: "rectangles", code: `import numpy as np
assert abs(midpoint2d(lambda x, y: x * y, 0, 1, 0, 1, 50) - 0.25) < 1e-12, 'The midpoint rule is exact for xy.'
assert abs(midpoint2d(lambda x, y: np.exp(x) * np.cos(y), 0, 1, 0, np.pi / 2, 200) - (np.e - 1)) < 1e-4
assert abs(midpoint2d(lambda x, y: 3 + 0 * x, 0, 2, 0, 1, 7) - 6) < 1e-12` },
          { name: "regions", code: `import numpy as np
one = lambda x, y: np.ones_like(x)
disc = lambda x, y: x * x + y * y <= 1
assert abs(region_integral(one, disc, (-1, 1, -1, 1), 1000) - np.pi) < 1e-3
tri = lambda x, y: y <= x
assert abs(region_integral(lambda x, y: x, tri, (0, 1, 0, 1), 1000) - 1 / 3) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mass_and_centroid(rho, box, n)</C> for a density <C>rho(x, y, z)</C> on the box{" "}
          <C>(a, b, c, d, e, g)</C> = <M>{"[a, b] \\times [c, d] \\times [e, g]"}</M>. Use the 3-D midpoint rule with n points
          per side (<C>np.meshgrid(xs, ys, zs, indexing=&quot;ij&quot;)</C>) and return the pair (mass, centre of mass as an
          array of three numbers).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mass_and_centroid(rho, box, n):
    return 0.0, np.zeros(3)
`,
        solution: `import numpy as np

def mass_and_centroid(rho, box, n):
    a, b, c, d, e, g = box
    mids = lambda lo, hi: lo + (np.arange(n) + 0.5) * (hi - lo) / n
    X, Y, Z = np.meshgrid(mids(a, b), mids(c, d), mids(e, g), indexing="ij")
    dV = (b - a) * (d - c) * (g - e) / n ** 3
    R = rho(X, Y, Z)
    mass = float(R.sum() * dV)
    centre = np.array([(X * R).sum(), (Y * R).sum(), (Z * R).sum()]) * dV / mass
    return mass, centre
`,
        tests: [
          { name: "uniform cube", code: `import numpy as np
m, c = mass_and_centroid(lambda x, y, z: np.ones_like(x), (0, 2, 0, 1, 0, 3), 10)
assert abs(m - 6) < 1e-12 and np.allclose(c, [1, 0.5, 1.5])` },
          { name: "varying density", code: `import numpy as np
m, c = mass_and_centroid(lambda x, y, z: x + 0 * y + 0 * z, (0, 1, 0, 1, 0, 1), 40)
assert abs(m - 0.5) < 1e-9
assert abs(c[0] - 2 / 3) < 1e-3 and abs(c[1] - 0.5) < 1e-9, 'Heavier where x is larger, so the centre moves to x = 2/3.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Explain why, for f continuous on a closed rectangle R, all Riemann sums approach the same limit as the grid is
          refined. You may use that f is uniformly continuous on R.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States uniform continuity: for each ε > 0 a δ with |f(p) − f(q)| < ε when ‖p − q‖ < δ.",
          "Notes that on a grid with cell diameters below δ, the values of f in a cell vary by less than ε, so any two Riemann sums on that grid differ by at most ε · area(R).",
          "Argues that sums on two different fine grids are both close to sums on their common refinement, so all fine-grid sums are within about 2ε · area(R) of each other, giving a single limit.",
        ],
      },
    },
    {
      key: "sq",
      rung: "stretch",
      prompt: <p>Compute <M>{"\\iint_{[0,1]^2} (x + y)^2\\,dA"}</M>. Give three decimal places.</p>,
      answer: { kind: "numeric", value: 7 / 6, tolerance: 1e-3 },
    },
  ],

  teachBack:
    "Explain to a friend how a double integral is defined from Riemann sums, how it handles regions that are not rectangles, and what it computes when f is a density.",

  glimpse: (
    <p>
      Riemann sums define the integral but are slow to compute by hand. Next, Fubini&rsquo;s theorem: a double integral is two
      single integrals, one inside the other.
    </p>
  ),
};
