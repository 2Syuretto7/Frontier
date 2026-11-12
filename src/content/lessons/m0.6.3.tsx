import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { VectorViz } from "@/components/viz/VectorViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.6.3",
  minutes: 70,
  links: {
    revisits: ["m0.6.1"],
    foreshadows: ["m3.1.1"],
  },

  puzzle: (
    <>
      <p>
        A boat can move at 4 km/h through still water. Its pilot points it straight across a river, but the river flows at
        3 km/h. Which way does the boat actually travel, and how fast?
      </p>
      <p>And if the pilot wants to arrive directly opposite the starting point, which way should the boat point?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each motion is an arrow: a direction and an amount. The boat&rsquo;s own motion is 4 across, the river&rsquo;s is
        3 downstream, and the actual motion is what you get by doing one after the other, an arrow from the start of the
        first to the tip of the second. By Pythagoras it has length 5, so the boat moves at 5 km/h, drifting downstream.
      </p>
      <p>
        Arrows like these are <strong>vectors</strong>, and in coordinates they are just pairs of numbers, added pair by
        pair. Better still, a simple product of two vectors, the dot product, measures the angle between them. Change v below
        and watch.
      </p>
      <VectorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="vectors">
        <p>
          A <strong>vector</strong> in the plane is a pair of numbers <M>{"v = (v_1, v_2)"}</M>, pictured as an arrow that
          moves <M>{"v_1"}</M> across and <M>{"v_2"}</M> up. The same vector can be drawn starting anywhere: only its length
          and direction matter. Vectors are added, and multiplied by numbers (<strong>scalars</strong>), one component at a
          time:
        </p>
        <MD>{"u + v = (u_1 + v_1,\\, u_2 + v_2), \\qquad k v = (k v_1,\\, k v_2)."}</MD>
      </Definition>
      <p>
        Geometrically, <M>{"u + v"}</M> is the arrow from the tail of <M>u</M> to the tip of <M>v</M> drawn from the tip of{" "}
        <M>u</M>, the diagonal of the parallelogram on <M>u</M> and <M>v</M>. And <M>{"kv"}</M> stretches <M>v</M> by{" "}
        <M>{"|k|"}</M>, reversing it when <M>k</M> is negative. The usual rules of arithmetic hold, because they hold for each
        component.
      </p>

      <Definition title="length and dot product">
        <p>
          The <strong>length</strong> of <M>v</M> is <M>{"|v| = \\sqrt{v_1^2 + v_2^2}"}</M>. The <strong>dot product</strong> of{" "}
          <M>u</M> and <M>v</M> is the number
        </p>
        <MD>{"u \\cdot v = u_1 v_1 + u_2 v_2."}</MD>
        <p>Note that <M>{"v \\cdot v = |v|^2"}</M>.</p>
      </Definition>

      <Theorem title="the dot product measures angles">
        <p>If <M>{"\\theta"}</M> is the angle between non-zero vectors <M>u</M> and <M>v</M>, then</p>
        <MD>{"u \\cdot v = |u|\\,|v| \\cos\\theta."}</MD>
      </Theorem>
      <Proof>
        <p>
          Draw <M>u</M> and <M>v</M> from the same point. The third side of the triangle they make is{" "}
          <M>{"u - v"}</M>. By the law of cosines, <M>{"|u - v|^2 = |u|^2 + |v|^2 - 2|u||v|\\cos\\theta"}</M>. But expanding
          in components,
        </p>
        <MD>{"|u - v|^2 = (u_1 - v_1)^2 + (u_2 - v_2)^2 = |u|^2 + |v|^2 - 2\\, u \\cdot v."}</MD>
        <p>Compare the two. (If u and v point the same or opposite ways, there is no triangle, but both sides are easy to check directly.)</p>
      </Proof>

      <Proposition title="perpendicular vectors">
        <p>Non-zero vectors are perpendicular exactly when their dot product is 0.</p>
      </Proposition>
      <Proof>
        <p>Lengths are positive, so <M>{"u \\cdot v = 0"}</M> exactly when <M>{"\\cos\\theta = 0"}</M>, that is, <M>{"\\theta = 90^\\circ"}</M>.</p>
      </Proof>

      <Example title="an angle by arithmetic">
        <p>
          For <M>{"u = (3, 1)"}</M> and <M>{"v = (1, 2)"}</M>, the starting position of the picture,{" "}
          <M>{"u \\cdot v = 5"}</M>, <M>{"|u| = \\sqrt{10}"}</M> and <M>{"|v| = \\sqrt5"}</M>. So{" "}
          <M>{"\\cos\\theta = \\tfrac{5}{\\sqrt{50}} = \\tfrac{1}{\\sqrt2}"}</M> and the angle is exactly{" "}
          <M>{"45^\\circ"}</M>, found without drawing anything.
        </p>
      </Example>

      <Remark title="arrows that carry">
        <p>
          The word <em>vector</em> is Latin for a carrier. William Rowan Hamilton brought it into mathematics in the 1840s,
          and the vector notation used in physics today was shaped by Josiah Willard Gibbs and Oliver Heaviside around 1880.
          Long before the name, though, sailors and engineers combined velocities and forces with the parallelogram rule.
          Its power is that velocity, force, displacement and many other quantities all obey the same arithmetic, so one
          piece of mathematics serves them all.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "length",
      rung: "check",
      prompt: <p>What is the length of the vector <M>{"(6, 8)"}</M>?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "dot",
      rung: "check",
      prompt: <p>What is <M>{"(2, 3) \\cdot (4, -1)"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "angle",
      rung: "apply",
      prompt: <p>What is the angle between <M>{"(1, 0)"}</M> and <M>{"(1, 1)"}</M>, in degrees?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "perp-k",
      rung: "apply",
      prompt: <p>For which number <M>k</M> is <M>{"(2, k)"}</M> perpendicular to <M>{"(3, -6)"}</M>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "boat",
      rung: "apply",
      prompt: (
        <p>
          A boat moves at 5 km/h through the water, in a river flowing at 3 km/h. It is pointed upstream at just the angle that
          makes it travel straight across. What is its speed across the river, in km/h?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
u = (3, 4)
v = (-4, 3)
print(math.hypot(u[0], u[1]), u[0] * v[0] + u[1] * v[1], (u[0] + v[0], u[1] + v[1]))`}</Code>
          <p>Length, dot product and sum of two vectors. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.0 0 (-1, 7)", "7.0 0 (-1, 7)", "5.0 24 (-1, 7)", "5.0 0 (7, -1)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
u = (3, 4)
v = (4, -3)
w = (u[0] + 2 * v[0], u[1] + 2 * v[1])
print(u[0] * v[0] + u[1] * v[1], math.hypot(w[0], w[1]), w)`}</Code>
          <p>Dot product, length and a linear combination. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0 11.180339887498949 (11, -2)", "0 125.0 (11, -2)", "24 11.180339887498949 (11, -2)", "0 11.180339887498949 (7, 1)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>angle(u, v)</C>, the angle in degrees between two non-zero vectors in the plane given as tuples, using cos θ = u·v / (|u||v|). Clamp the cosine to [−1, 1] before <C>math.acos</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def angle(u, v):
    return math.degrees(math.atan2(v[1], v[0]))
`,
        solution: `import math

def angle(u, v):
    dot = u[0] * v[0] + u[1] * v[1]
    c = dot / (math.hypot(*u) * math.hypot(*v))
    return math.degrees(math.acos(max(-1.0, min(1.0, c))))
`,
        tests: [
          { name: "right angle", code: `assert abs(angle((3, 4), (-4, 3)) - 90) < 1e-9, 'A zero dot product means a right angle.'` },
          { name: "others", code: `assert abs(angle((1, 0), (1, 1)) - 45) < 1e-9 and abs(angle((1, 0), (-3, 0)) - 180) < 1e-9, 'Opposite directions make 180 degrees.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>project(u, v)</C>, the projection of vector u onto non-zero v, and <C>reflect(u, n)</C>, the reflection of u in the line through the origin perpendicular to the non-zero normal n, both for vectors of any length given as tuples. Then write <C>gram_schmidt(vs)</C>, which turns a list of linearly independent vectors into an orthonormal list spanning the same space, by subtracting projections onto the vectors already found and normalising.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def project(u, v):
    return u

def reflect(u, n):
    return tuple(-x for x in u)

def gram_schmidt(vs):
    return vs
`,
        solution: `import math

def project(u, v):
    k = sum(a * b for a, b in zip(u, v)) / sum(b * b for b in v)
    return tuple(k * x for x in v)

def reflect(u, n):
    p = project(u, n)
    return tuple(a - 2 * b for a, b in zip(u, p))

def gram_schmidt(vs):
    out = []
    for v in vs:
        w = list(v)
        for e in out:
            d = sum(a * b for a, b in zip(w, e))
            w = [a - d * b for a, b in zip(w, e)]
        norm = math.sqrt(sum(a * a for a in w))
        out.append(tuple(a / norm for a in w))
    return out
`,
        tests: [
          { name: "project", code: `assert project((3, 4), (1, 0)) == (3.0, 0.0) and project((1, 1, 1), (0, 2, 0)) == (0.0, 1.0, 0.0), 'Projection keeps the part along v.'` },
          { name: "reflect", code: `assert reflect((1, 2), (0, 1)) == (1.0, -2.0) and all(abs(a - b) < 1e-12 for a, b in zip(reflect((3, 1), (1, -1)), (1, 3))), 'Reflecting in y = x swaps coordinates.'` },
          { name: "orthonormal", code: `vs = gram_schmidt([(1, 1, 0), (1, 0, 1), (0, 1, 1)])
for i in range(3):
    for j in range(3):
        d = sum(a * b for a, b in zip(vs[i], vs[j]))
        assert abs(d - (1 if i == j else 0)) < 1e-12, (i, j)` },
          { name: "span", code: `vs = gram_schmidt([(2, 0), (3, 5)])
assert all(abs(a - b) < 1e-12 for a, b in zip(vs[0], (1, 0))) and all(abs(a - b) < 1e-12 for a, b in zip(vs[1], (0, 1))), 'The first vector keeps its direction.'` },
        ],
      },
    },
    {
      key: "expand",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"|u + v|^2 = |u|^2 + 2\\, u\\cdot v + |v|^2"}</M> for all vectors <M>u</M> and <M>v</M> in the plane.
          What does this say when <M>u</M> and <M>v</M> are perpendicular?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes |u + v|² as (u₁ + v₁)² + (u₂ + v₂)².",
          "Expands each square.",
          "Regroups the terms as (u₁² + u₂²) + 2(u₁v₁ + u₂v₂) + (v₁² + v₂²).",
          "Identifies the groups as |u|², 2u·v and |v|², and notes that for perpendicular vectors this is Pythagoras.",
        ],
      },
    },
    {
      key: "triangle-angle",
      rung: "stretch",
      prompt: (
        <p>
          A triangle has corners <M>{"A = (1, 1)"}</M>, <M>{"B = (4, 2)"}</M> and <M>{"C = (2, 4)"}</M>. What is the angle at
          A, in degrees, to two decimal places?
        </p>
      ),
      answer: { kind: "numeric", value: 53.13, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend how adding vectors works as arrows and as pairs of numbers, and how the dot product tells you whether two arrows are perpendicular.",

  glimpse: (
    <p>
      Next, complex numbers, where points of the plane can be multiplied as well as added. Linear Algebra begins exactly
      here, with vectors of any number of components, linear combinations and the dot product. In machine learning, the
      dot product of two vectors measures how alike they are, as cosine similarity, and attention in a transformer is
      built from exactly these dot products.
    </p>
  ),
};
