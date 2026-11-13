import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NormBallViz } from "@/components/viz/NormBallViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.1.1",
  minutes: 55,
  links: {
    requires: ["m3.1.2", "m2.2.2"],
    revisits: ["m2.1.3"],
    foreshadows: ["m5.1.2", "m6.2.1"],
  },

  puzzle: (
    <>
      <p>
        A gradient has a million coordinates. One training recipe clips it when its largest coordinate exceeds 1; another when
        its length exceeds 1. A third adds the sum of the absolute values of the weights to the loss, and a fourth adds the
        sum of their squares.
      </p>
      <p>All four measure the size of a vector. Why do they behave so differently?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        In one dimension there is one sensible size, the absolute value. In many dimensions there are several, each a
        different way of combining the coordinates: add their sizes, take the square root of the sum of squares, or take the
        largest. Each is called a norm, and each has its own shape of &ldquo;all vectors of size at most 1&rdquo;.
      </p>
      <NormBallViz />
      <p>
        The diamond of the 1-norm has corners on the axes, which is why penalising it pushes weights to exactly zero. The disc
        of the 2-norm treats every direction alike. The square of the ∞-norm cares only about the largest coordinate.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="Euclidean space">
        <p>
          <M>{"\\mathbb R^n"}</M> is the set of n-tuples <M>{"x = (x_1, \\dots, x_n)"}</M> of real numbers, with coordinatewise
          addition and scaling, and the inner product <M>{"\\langle x, y \\rangle = x \\cdot y = \\sum_i x_i y_i"}</M>. The
          Euclidean norm is <M>{"\\|x\\|_2 = \\sqrt{\\langle x, x \\rangle}"}</M>, and the distance between x and y is{" "}
          <M>{"\\|x - y\\|_2"}</M>.
        </p>
      </Definition>

      <Definition title="norm">
        <p>A norm on <M>{"\\mathbb R^n"}</M> is a function <M>{"\\|\\cdot\\|"}</M> such that, for all x, y and scalars c,</p>
        <ul>
          <li><M>{"\\|x\\| \\ge 0"}</M>, with equality only for x = 0;</li>
          <li><M>{"\\|c x\\| = |c| \\, \\|x\\|"}</M>;</li>
          <li><M>{"\\|x + y\\| \\le \\|x\\| + \\|y\\|"}</M> (the triangle inequality).</li>
        </ul>
        <p>For p ≥ 1 the p-norms are</p>
        <MD>{"\\|x\\|_p = \\Big(\\sum_i |x_i|^p\\Big)^{1/p}, \\qquad \\|x\\|_\\infty = \\max_i |x_i|."}</MD>
      </Definition>

      <Theorem title="the triangle inequality for the 2-norm">
        <p><M>{"\\|x + y\\|_2 \\le \\|x\\|_2 + \\|y\\|_2"}</M> for all x, y in <M>{"\\mathbb R^n"}</M>.</p>
      </Theorem>
      <Proof>
        <p>By the Cauchy–Schwarz inequality <M>{"\\langle x, y\\rangle \\le \\|x\\|_2 \\|y\\|_2"}</M>,</p>
        <MD>{"\\|x + y\\|_2^2 = \\|x\\|_2^2 + 2\\langle x, y\\rangle + \\|y\\|_2^2 \\le \\big(\\|x\\|_2 + \\|y\\|_2\\big)^2,"}</MD>
        <p>and both sides are non-negative, so taking square roots keeps the inequality.</p>
      </Proof>

      <Theorem title="comparing norms">
        <p>For every x in <M>{"\\mathbb R^n"}</M>,</p>
        <MD>{"\\|x\\|_\\infty \\le \\|x\\|_2 \\le \\|x\\|_1 \\le \\sqrt n \\, \\|x\\|_2 \\le n \\|x\\|_\\infty."}</MD>
      </Theorem>
      <Proof>
        <p>
          The largest <M>{"x_i^2"}</M> is at most their sum, giving the first. Squaring <M>{"\\|x\\|_1 = \\sum |x_i|"}</M> gives{" "}
          <M>{"\\sum x_i^2"}</M> plus non-negative cross terms, giving the second. Cauchy–Schwarz applied to the vectors{" "}
          <M>{"(|x_1|, \\dots, |x_n|)"}</M> and <M>{"(1, \\dots, 1)"}</M> gives the third. The last holds because each{" "}
          <M>{"x_i^2 \\le \\|x\\|_\\infty^2"}</M>, so <M>{"\\|x\\|_2 \\le \\sqrt n \\|x\\|_\\infty"}</M>.
        </p>
      </Proof>

      <Definition title="balls, open sets and limits">
        <p>
          The open ball of radius r around a is <M>{"B(a, r) = \\{x : \\|x - a\\| < r\\}"}</M>. A set U is open if every point of U
          has some ball around it inside U. A sequence <M>{"x^{(k)}"}</M> converges to x if{" "}
          <M>{"\\|x^{(k)} - x\\| \\to 0"}</M>. By the comparisons above, which p-norm you use does not change which sets are open
          or which sequences converge, and a sequence converges exactly when each coordinate does.
        </p>
      </Definition>

      <Example title="norms in training">
        <p>
          Weight decay adds <M>{"\\lambda \\|w\\|_2^2"}</M> to the loss and shrinks every weight in proportion; an{" "}
          <M>{"\\lambda \\|w\\|_1"}</M> penalty pushes many weights to exactly 0. Gradient clipping rescales g to{" "}
          <M>{"g \\cdot \\min(1, c / \\|g\\|_2)"}</M>, which keeps its direction and caps its length.
        </p>
      </Example>

      <Remark title="high dimensions">
        <p>
          The gap between norms grows with n. A vector of a million coordinates, each 0.001, has <M>{"\\|x\\|_\\infty = 0.001"}</M>
          , <M>{"\\|x\\|_2 = 1"}</M> and <M>{"\\|x\\|_1 = 1000"}</M>. A threshold that suits one norm is meaningless in another.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "two",
      rung: "check",
      prompt: <p>What is <M>{"\\|(3, -4)\\|_2"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "one",
      rung: "check",
      prompt: <p>What is <M>{"\\|(3, -4, 1)\\|_1"}</M>?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "inf",
      rung: "apply",
      prompt: <p>What is the distance between (1, −2, 5) and (2, 5, 4) in the ∞-norm?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "ratio",
      rung: "apply",
      prompt: <p>For non-zero x in <M>{"\\mathbb R^4"}</M>, what is the largest possible value of <M>{"\\|x\\|_1 / \\|x\\|_2"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these are norms on <M>{"\\mathbb R^2"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["|x₁| + |x₂|", "max(|x₁|, 2|x₂|)", "|x₁|", "x₁² + x₂²"],
        correct: [0, 1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.array([3.0, -4.0, 12.0])
print(np.linalg.norm(x), np.linalg.norm(x, 1), np.linalg.norm(x, np.inf))`}</Code>
          <p>Three norms of one vector. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["13.0 19.0 12.0", "13.0 11.0 12.0", "169.0 19.0 12.0", "13.0 19.0 -4.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
g = np.array([6.0, 8.0])
for max_norm in [20.0, 5.0]:
    n = np.linalg.norm(g)
    print(g * min(1.0, max_norm / n))`}</Code>
          <p>Gradient clipping by norm. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[6. 8.]\n[3. 4.]", "[12. 16.]\n[3. 4.]", "[6. 8.]\n[5. 5.]", "[6. 8.]\n[0.6 0.8]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pnorm(x, p)</C> for a 1-D NumPy array and p ≥ 1 or <C>p = np.inf</C>, without <C>np.linalg.norm</C>. It
          must not overflow when the entries are huge: divide by the largest <C>|x_i|</C> first and multiply back at the end
          (the zero vector has norm 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pnorm(x, p):
    return np.sum(np.abs(x) ** p) ** (1 / p)
`,
        solution: `import numpy as np

def pnorm(x, p):
    a = np.abs(np.asarray(x, float))
    m = a.max() if a.size else 0.0
    if m == 0:
        return 0.0
    if p == np.inf:
        return float(m)
    return float(m * np.sum((a / m) ** p) ** (1 / p))
`,
        tests: [
          { name: "matches numpy", code: `import numpy as np
rng = np.random.default_rng(0)
for p in [1, 1.5, 2, 3, np.inf]:
    for _ in range(20):
        x = rng.standard_normal(rng.integers(1, 9))
        assert np.isclose(pnorm(x, p), np.linalg.norm(x, p)), (x, p)
assert pnorm(np.zeros(3), 2) == 0` },
          { name: "no overflow", code: `import numpy as np
x = np.array([3e200, -4e200])
got = pnorm(x, 2)
assert np.isfinite(got) and np.isclose(got, 5e200), f'Scale by the largest entry first; got {got}'
assert np.isclose(pnorm(np.array([1e-200, 1e-200]), 2), np.sqrt(2) * 1e-200), 'Tiny entries must not underflow to 0 either.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>clip_by_global_norm(grads, max_norm)</C> for a list of NumPy arrays of any shapes. The global norm is the
          2-norm of all their entries together. If it exceeds max_norm, scale every array by <C>max_norm / global_norm</C>.
          Return (new list, global norm) and leave the inputs unchanged.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def clip_by_global_norm(grads, max_norm):
    return grads, 0.0
`,
        solution: `import numpy as np

def clip_by_global_norm(grads, max_norm):
    total = float(np.sqrt(sum(np.sum(g ** 2) for g in grads)))
    scale = min(1.0, max_norm / total) if total > 0 else 1.0
    return [g * scale for g in grads], total
`,
        tests: [
          { name: "clips", code: `import numpy as np
g = [np.array([3.0, 0.0]), np.array([[4.0]])]
out, n = clip_by_global_norm(g, 1.0)
assert np.isclose(n, 5.0)
assert np.allclose(out[0], [0.6, 0.0]) and np.allclose(out[1], [[0.8]]) and out[1].shape == (1, 1)
assert np.allclose(g[0], [3.0, 0.0]), 'Do not change the inputs.'
new_norm = np.sqrt(sum(np.sum(a ** 2) for a in out))
assert np.isclose(new_norm, 1.0)` },
          { name: "leaves small alone", code: `import numpy as np
g = [np.array([0.3, 0.4])]
out, n = clip_by_global_norm(g, 1.0)
assert np.isclose(n, 0.5) and np.allclose(out[0], g[0])
out, n = clip_by_global_norm([np.zeros(3)], 1.0)
assert n == 0 and np.allclose(out[0], 0), 'A zero gradient stays zero, with no division by zero.'` },
        ],
      },
    },
    {
      key: "compare",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\|x\\|_2 \\le \\|x\\|_1 \\le \\sqrt n \\, \\|x\\|_2"}</M> for every x in <M>{"\\mathbb R^n"}</M>, and
          give a non-zero vector for which each inequality is an equality.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Squares the 1-norm and notes the cross terms 2|x_i||x_j| are non-negative, giving the first inequality.",
          "Applies Cauchy–Schwarz to (|x_1|, …, |x_n|) and (1, …, 1) to get the second.",
          "Gives equality cases: a vector with one non-zero entry for the first, and a vector with all |x_i| equal for the second.",
        ],
      },
    },
    {
      key: "cube",
      rung: "stretch",
      prompt: (
        <p>
          The unit ball of the ∞-norm in <M>{"\\mathbb R^3"}</M> is a cube of side 2. What fraction of its volume lies inside the
          unit ball of the 2-norm? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.524, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what a norm is, how the 1-, 2- and ∞-norms of a vector differ, and why the choice matters for regularisation and gradient clipping.",

  glimpse: (
    <p>
      With distance in place, functions of several variables come next: scalar fields such as a loss over many weights, and
      their level sets, the contour lines on a map of the landscape.
    </p>
  ),
};
