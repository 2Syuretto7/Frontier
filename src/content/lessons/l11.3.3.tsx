import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FeatureDimensionViz } from "@/components/viz/FeatureDimensionViz";
import type { LessonContent } from "@/lib/types";

const DIMENSION = `import math

def feature_dimensionality(W, i):
    col = lambda j: [row[j] for row in W]
    wi = col(i)
    n2 = sum(v * v for v in wi)
    return n2 / sum((sum(a * b for a, b in zip(wi, col(j))) ** 2) / n2 for j in range(len(W[0])))

def dimensionalities(W):
    return [feature_dimensionality(W, i) for i in range(len(W[0]))]

def angle_between(u, v):
    c = sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))
    return math.degrees(math.acos(max(-1.0, min(1.0, c))))`;

const CIRCLE = `import math

def circle_embed(k, n):
    return [math.cos(2 * math.pi * k / n), math.sin(2 * math.pi * k / n)]

def circle_decode(v, n):
    return round(math.atan2(v[1], v[0]) / (2 * math.pi) * n) % n

def rotate(v, angle):
    c, s = math.cos(angle), math.sin(angle)
    return [c * v[0] - s * v[1], s * v[0] + c * v[1]]`;

export const lesson: LessonContent = {
  id: "l11.3.3",
  minutes: 50,
  links: {
    requires: ["l11.3.2"],
    revisits: ["l4.2.2", "l11.3.1", "m6.2.3"],
    foreshadows: ["l11.4.1", "l11.6.1"],
  },

  puzzle: (
    <>
      <p>
        Researchers looking for how a language model represents the days of the week expected seven separate directions, one per day.
        Instead they found a two-dimensional plane in which the seven days sit around a circle, in order, and adding days moves around
        it. Why would a model choose a circle, and what does that say about the assumption that every feature is a single direction?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If features are directions, their arrangement is a kind of geometry, and it is not arbitrary. In superposition, features form
        regular shapes, pairs, triangles and pentagons, and a feature&apos;s share of a dimension moves in jumps between a few fractions.
        Related features organise themselves too: concepts in a hierarchy are nearly orthogonal to their parents, and cyclic quantities
        such as days and months lie on circles, where arithmetic becomes rotation.
      </p>
      <FeatureDimensionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="feature dimensionality">
        <p>
          For feature columns <M>{"W_j"}</M>, the dimensionality of feature i is{" "}
          <M>{"D_i = \\|W_i\\|^2 \\big/ \\sum_j (\\hat W_i \\cdot W_j)^2"}</M> (<C>feature_dimensionality</C>), where the sum includes j = i. It
          is 1 for a feature orthogonal to all others, 1/2 for each of an antipodal pair, and 0 for a feature not represented. Angles between
          feature directions (<C>angle_between</C>) show the shapes directly.
        </p>
        <Code>{DIMENSION}</Code>
      </Definition>

      <Theorem title="dimensionalities add up to at most the number of dimensions">
        <p>
          For any m by n matrix W with nonzero columns, <M>{"\\sum_i D_i \\le \\operatorname{rank}(W) \\le m"}</M>, with equality in the
          first when the columns form a tight frame, meaning <M>{"W W^\\top"}</M> is a multiple of the identity on the span of the columns.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"G = W^\\top W = \\sum_k \\lambda_k v_k v_k^\\top"}</M> with orthonormal <M>{"v_k"}</M> and, keeping only nonzero
          terms, <M>{"\\lambda_k > 0"}</M>. Then <M>{"\\|W_i\\|^2 = G_{ii}"}</M> and the denominator of <M>{"D_i"}</M> is{" "}
          <M>{"\\sum_j G_{ij}^2 / G_{ii}"}</M>, so <M>{"D_i = G_{ii}^2 / (G^2)_{ii}"}</M>. Write{" "}
          <M>{"G_{ii} = \\sum_k (\\lambda_k v_{ki})\\,v_{ki}"}</M>; by Cauchy-Schwarz,{" "}
          <M>{"G_{ii}^2 \\le \\sum_k \\lambda_k^2 v_{ki}^2 \\cdot \\sum_k v_{ki}^2 = (G^2)_{ii}\\,P_{ii}"}</M>, where P is the
          projection onto the range of G. So <M>{"D_i \\le P_{ii}"}</M>, and summing gives{" "}
          <M>{"\\sum_i D_i \\le \\operatorname{tr} P = \\operatorname{rank}(G) = \\operatorname{rank}(W)"}</M>. Equality needs every
          Cauchy-Schwarz step to be tight, which holds when all the <M>{"\\lambda_k"}</M> are equal, so that G is a multiple of P; that is
          the tight-frame condition. Antipodal pairs and regular polygons of equal-length vectors are tight frames, which is why the trained
          toy models in the visualisation sit at simple fractions that add up to the number of dimensions they use (<C>dimensionalities</C>).
        </p>
      </Proof>

      <Remark title="the linear representation hypothesis, and its limits">
        <p>
          Word-vector analogies (l4.2.2) and steering suggest many concepts are directions. Hierarchy has a geometric signature: the
          direction for &quot;dog&quot; is close to &quot;animal&quot; plus a component orthogonal to it, so siblings share the parent
          component and differ in orthogonal parts (m6.2.3). Not every feature is one-dimensional. A cyclic quantity is better stored on a
          circle (<C>circle_embed</C>, <C>circle_decode</C>), because then adding a fixed amount is a rotation (<C>rotate</C>), which a
          linear map can perform, and the representation has no artificial seam between Sunday and Monday. Such multi-dimensional,
          irreducible features have been found for days, months and years in language models.
        </p>
        <Code>{CIRCLE}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Seven days on a circle use two dimensions rather than seven, and make &quot;three days after Friday&quot; a rotation by three
          sevenths of a turn. A model that needs day arithmetic gains from that structure. It means a feature should be thought of as a
          low-dimensional subspace with a shape, of which a single direction is the commonest case.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dim",
      rung: "check",
      prompt: (
        <p>
          Three features in two dimensions are written as (1, 0), (0.6, 0.8) and (0, 1). What is the dimensionality of the first? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.735, tolerance: 0.001 },
    },
    {
      key: "angle",
      rung: "check",
      prompt: (
        <p>
          Seven days are placed evenly around a circle, Monday at angle 0 and continuing in order. What is the angle, in degrees, between
          Monday and Thursday? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 154.286, tolerance: 0.002 },
    },
    {
      key: "probe",
      rung: "apply",
      prompt: (
        <p>
          A linear probe for &quot;month of the year&quot; trained as twelve separate one-vs-rest directions works poorly, but a
          two-dimensional projection shows the months in order around a circle. What should you conclude?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Month is represented as a two-dimensional circular feature, so a probe should read the angle in that plane",
          "The model does not represent months",
          "Each month has its own direction, but the probe was undertrained",
          "The circle is an artefact of projecting to two dimensions",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def feature_dimensionality(W, i):
    col = lambda j: [row[j] for row in W]
    wi = col(i)
    n2 = sum(v * v for v in wi)
    return n2 / sum((sum(a * b for a, b in zip(wi, col(j))) ** 2) / n2 for j in range(len(W[0])))

def dimensionalities(W):
    return [feature_dimensionality(W, i) for i in range(len(W[0]))]

def angle_between(u, v):
    c = sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))
    return math.degrees(math.acos(max(-1.0, min(1.0, c))))

W = [[1, -1, 0], [0, 0, 1]]
print(dimensionalities(W), round(angle_between([1, 0], [1, 1]), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.5, 1.0] 45.0",
          "[1.0, 1.0, 1.0] 45.0",
          "[0.5, 0.5, 0.5] 45.0",
          "[0.5, 0.5, 1.0] 135.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def circle_embed(k, n):
    return [math.cos(2 * math.pi * k / n), math.sin(2 * math.pi * k / n)]

def circle_decode(v, n):
    return round(math.atan2(v[1], v[0]) / (2 * math.pi) * n) % n

def rotate(v, angle):
    c, s = math.cos(angle), math.sin(angle)
    return [c * v[0] - s * v[1], s * v[0] + c * v[1]]

v = rotate(circle_embed(5, 7), 2 * math.pi * 3 / 7)
print(circle_decode(v, 7), circle_decode(circle_embed(0, 12), 12), [round(x, 3) for x in rotate([1, 0], math.pi / 2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 0 [0.0, 1.0]",
          "8 0 [0.0, 1.0]",
          "1 12 [0.0, 1.0]",
          "1 0 [1.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          W is a list of rows; feature j is column j. Write <C>feature_dimensionality(W, i)</C>; <C>dimensionalities(W)</C>, the list for
          every feature; and <C>angle_between(u, v)</C> in degrees, clamping the cosine to [−1, 1].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def feature_dimensionality(W, i):
    return 1.0

def dimensionalities(W):
    return [1.0] * len(W[0])

def angle_between(u, v):
    return 0.0
`,
        solution: DIMENSION,
        tests: [
          { name: "dims", code: `W = [[2.0, 0.0, 1.0], [0.0, 1.0, 1.0]]\nd = dimensionalities(W)\nassert all(abs(a - b) < 1e-12 for a, b in zip(d, [0.8, 0.5, 4 / 9]))\nassert abs(feature_dimensionality(W, 2) - 4 / 9) < 1e-12` },
          { name: "angle", code: `assert abs(angle_between([1, 2, 2], [2, -2, 1]) - 90) < 1e-9 and abs(angle_between([1, 1], [-2, -2]) - 180) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>circle_embed(k, n)</C>, the point at angle <M>{"2\\pi k/n"}</M> on the unit circle; <C>circle_decode(v, n)</C>, the
          nearest k in 0 to n − 1; and <C>rotate(v, angle)</C> for a vector in the plane.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def circle_embed(k, n):
    return [1.0, 0.0]

def circle_decode(v, n):
    return 0

def rotate(v, angle):
    return v
`,
        solution: CIRCLE,
        tests: [
          { name: "embed", code: `e = circle_embed(3, 12)\nassert abs(e[0]) < 1e-12 and abs(e[1] - 1) < 1e-12\nassert circle_decode([0.0, -2.0], 12) == 9 and circle_decode(circle_embed(11, 12), 12) == 11` },
          { name: "rotate", code: `import math\nassert circle_decode(rotate(circle_embed(10, 12), 2 * math.pi * 5 / 12), 12) == 3\nr = rotate([1.0, 2.0], math.pi)\nassert abs(r[0] + 1) < 1e-12 and abs(r[1] + 2) < 1e-12` },
        ],
      },
    },
    {
      key: "hier",
      rung: "stretch",
      prompt: (
        <p>
          The direction for &quot;dog&quot; is a + u and for &quot;cat&quot; is a + v, where a is a unit vector for &quot;animal&quot;, and
          u and v have length 2 and are orthogonal to each other and to a. What is the cosine between &quot;dog&quot; and &quot;cat&quot;?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Knowing that features are directions packed in superposition suggests a way to find them: learn an overcomplete set of
        directions under which activations are sparse. That is the sparse autoencoder, the next chapter&apos;s subject.
      </p>
    </>
  ),
};
