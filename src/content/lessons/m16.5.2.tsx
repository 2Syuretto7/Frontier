import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RepresenterViz } from "@/components/viz/RepresenterViz";
import type { LessonContent } from "@/lib/types";

const PERCEPTRON = `def kernel_perceptron(data, k, epochs):
    alpha = [0] * len(data)
    for _ in range(epochs):
        for i, (x, y) in enumerate(data):
            f = sum(a * yj * k(xj, x) for a, (xj, yj) in zip(alpha, data))
            if y * f <= 0:
                alpha[i] += 1
    return alpha

def kp_predict(alpha, data, k, x):
    f = sum(a * yj * k(xj, x) for a, (xj, yj) in zip(alpha, data))
    return 1 if f > 0 else -1

def mistakes(alpha):
    return sum(alpha)`;

const PROJECT = `import math

def solve2(K, v):
    det = K[0][0] * K[1][1] - K[0][1] * K[1][0]
    return [(K[1][1] * v[0] - K[0][1] * v[1]) / det, (K[0][0] * v[1] - K[1][0] * v[0]) / det]

def project2(alpha, centres, xs, k):
    vals = [sum(a * k(c, x) for a, c in zip(alpha, centres)) for x in xs]
    return solve2([[k(a, b) for b in xs] for a in xs], vals)

def norm_sq(alpha, centres, k):
    return sum(a * b * k(c, d) for a, c in zip(alpha, centres) for b, d in zip(alpha, centres))`;

export const lesson: LessonContent = {
  id: "m16.5.2",
  minutes: 40,
  links: {
    requires: ["m16.5.1"],
    revisits: ["m3.5.1", "m10.4.2"],
    foreshadows: ["m16.5.3", "m16.5.4"],
  },

  puzzle: (
    <>
      <p>
        Regularised learning in the RKHS of a Gaussian kernel searches over an infinite-dimensional space of functions. Yet
        every kernel method you can run returns a finite list of numbers, one per training example. Is that a computational
        shortcut that loses something, or is the best function in the infinite space always of this finite form?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The training data see a function only through its values at the training points, and in an RKHS those values are
        inner products with the m functions <M>{"k(x_i, \\cdot)"}</M>. Any part of f orthogonal to all of them is invisible to the
        data but still adds to the norm. A regulariser that charges for norm therefore always removes that part, leaving a
        combination of the <M>{"k(x_i, \\cdot)"}</M>.
      </p>
      <RepresenterViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the representer theorem">
        <p>
          Let H be an RKHS with kernel k, let <M>{"G : \\mathbb R^m \\to \\mathbb R"}</M> be any function and{" "}
          <M>{"R : [0, \\infty) \\to \\mathbb R"}</M> strictly increasing. Every minimiser of
        </p>
        <MD>{"f \\mapsto G\\big(f(x_1), \\dots, f(x_m)\\big) + R(\\|f\\|_H)"}</MD>
        <p>
          has the form <M>{"f = \\sum_{i=1}^m \\alpha_i k(x_i, \\cdot)"}</M>, and if R is merely non-decreasing, some minimiser has
          this form.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let V be the span of <M>{"k(x_1, \\cdot), \\dots, k(x_m, \\cdot)"}</M>, a finite-dimensional and hence closed subspace,
          and write f = v + u with v in V and u orthogonal to V (m3.5.1). By the reproducing property{" "}
          <M>{"f(x_i) = \\langle v + u, k(x_i, \\cdot)\\rangle = v(x_i)"}</M>, so G takes the same value at f and at v
          (<C>project2</C> computes v from the values <M>{"f(x_i)"}</M>). Meanwhile{" "}
          <M>{"\\|f\\|^2 = \\|v\\|^2 + \\|u\\|^2"}</M> (<C>norm_sq</C>), so if u ≠ 0 then{" "}
          <M>{"R(\\|v\\|) < R(\\|f\\|)"}</M> and f was not a minimiser. With R only non-decreasing, v is at least as good.
        </p>
        <Code>{PROJECT}</Code>
      </Proof>

      <Remark title="what it buys">
        <p>
          Substituting <M>{"f = \\sum_i \\alpha_i k(x_i, \\cdot)"}</M> gives <M>{"f(x_j) = (K\\alpha)_j"}</M> and{" "}
          <M>{"\\|f\\|^2 = \\alpha^\\top K \\alpha"}</M>, so the problem becomes an optimisation over <M>{"\\alpha \\in \\mathbb R^m"}</M>{" "}
          involving only the Gram matrix. The price is that the cost scales with m rather than with the feature dimension:
          storing K takes <M>{"m^2"}</M> numbers, solving with it about <M>{"m^3"}</M> operations, and each prediction m kernel
          evaluations. That trade, cheap in features and expensive in examples, is the defining property of kernel methods and
          the reason random features (m16.5.4) were invented.
        </p>
      </Remark>

      <Example title="the kernel perceptron">
        <p>
          The perceptron adds <M>{"y_i x_i"}</M> to w whenever it misclassifies <M>{"x_i"}</M>, so w is always a combination of
          training inputs. Replacing inner products by kernel evaluations, it keeps a count <M>{"\\alpha_i"}</M> of mistakes on each
          example and predicts with the sign of <M>{"\\sum_i \\alpha_i y_i k(x_i, x)"}</M> (<C>kernel_perceptron</C>,{" "}
          <C>kp_predict</C>). With the quadratic kernel it separates XOR, which no linear classifier can. Its total number of
          mistakes on separable data is at most <M>{"(X/\\gamma)^2"}</M> for margin γ in the RKHS (<C>mistakes</C>), the same
          quantity that bounded shattering in m16.3.2.
        </p>
        <Code>{PERCEPTRON}</Code>
      </Example>

      <Remark title="when the theorem fails">
        <p>
          The penalty must depend on f only through its RKHS norm. With an unpenalised bias term the solution is a kernel
          expansion plus a constant; with an L1 penalty on α, or a norm other than the Hilbert norm, the argument breaks, since
          Pythagoras is what makes the orthogonal part costly. The support vector machine&apos;s dual (m10.4.2) is another route
          to the same expansion, with most <M>{"\\alpha_i"}</M> equal to zero.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "proj",
      rung: "check",
      prompt: <p>With k(x, z) = exp(−(x − z)²), project f = k(0.5, ·) onto the span of k(0, ·) alone. What is the squared RKHS norm of the projection? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.6065, tolerance: 0.0001 },
    },
    {
      key: "memory",
      rung: "check",
      prompt: <p>A kernel method on m = 10000 examples stores the full Gram matrix in 8-byte floats. How many gigabytes (10^9 bytes) is that?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "condition",
      rung: "apply",
      prompt: <p>Which feature of the regularised objective does the proof of the representer theorem rely on?</p>,
      answer: {
        kind: "choice",
        options: [
          "The data term depends on f only through its values at the training points, and the penalty is an increasing function of the RKHS norm",
          "The loss must be convex",
          "The kernel must be Gaussian",
          "The training points must be linearly independent in the input space",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kernel_perceptron(data, k, epochs):
    alpha = [0] * len(data)
    for _ in range(epochs):
        for i, (x, y) in enumerate(data):
            f = sum(a * yj * k(xj, x) for a, (xj, yj) in zip(alpha, data))
            if y * f <= 0:
                alpha[i] += 1
    return alpha

def kp_predict(alpha, data, k, x):
    f = sum(a * yj * k(xj, x) for a, (xj, yj) in zip(alpha, data))
    return 1 if f > 0 else -1

def mistakes(alpha):
    return sum(alpha)

X = [((1, 1), 1), ((-1, -1), 1), ((1, -1), -1), ((-1, 1), -1)]; q = lambda u, v: (1 + u[0] * v[0] + u[1] * v[1]) ** 2; a = kernel_perceptron(X, q, 3)
print(a, [kp_predict(a, X, q, x) for x, _ in X], mistakes(a), kp_predict(a, X, lambda u, v: u[0] * v[0] + u[1] * v[1], (2, 2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 1, 1, 1] [1, 1, -1, -1] 4 -1",
          "[1, 0, 1, 1] [1, 1, -1, -1] 3 -1",
          "[1, 1, 1, 1] [1, 1, -1, -1] 4 1",
          "[1, 1, 1, 1] [1, -1, 1, -1] 4 -1",
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

def solve2(K, v):
    det = K[0][0] * K[1][1] - K[0][1] * K[1][0]
    return [(K[1][1] * v[0] - K[0][1] * v[1]) / det, (K[0][0] * v[1] - K[1][0] * v[0]) / det]

def project2(alpha, centres, xs, k):
    vals = [sum(a * k(c, x) for a, c in zip(alpha, centres)) for x in xs]
    return solve2([[k(a, b) for b in xs] for a in xs], vals)

def norm_sq(alpha, centres, k):
    return sum(a * b * k(c, d) for a, c in zip(alpha, centres) for b, d in zip(alpha, centres))

g = lambda x, z: math.exp(-(x - z) ** 2); b = project2([1.0], [0.5], [0.0, 1.0], g); print([round(v, 4) for v in b])
print(round(norm_sq([1.0], [0.5], g), 4), round(norm_sq(b, [0.0, 1.0], g), 4), round(sum(v * g(x, 0.0) for v, x in zip(b, [0.0, 1.0])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5693, 0.5693]\n1.0 0.8868 0.7788",
          "[0.5693, 0.5693]\n1.0 1.0 0.7788",
          "[0.5693, 0.5693]\n1.0 0.8868 0.5693",
          "[0.7788, 0.7788]\n1.0 0.8868 0.7788",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kernel_perceptron(data, k, epochs)</C>, returning the mistake counts α, <C>kp_predict(alpha, data, k, x)</C>{" "}
          returning ±1 (−1 when the score is 0), and <C>mistakes(alpha)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kernel_perceptron(data, k, epochs):
    return [0] * len(data)

def kp_predict(alpha, data, k, x):
    return 1

def mistakes(alpha):
    return 0
`,
        solution: PERCEPTRON,
        tests: [
          { name: "learns XOR", code: `X = [((1, 1), 1), ((-1, -1), 1), ((1, -1), -1), ((-1, 1), -1)]; q = lambda u, v: (1 + u[0] * v[0] + u[1] * v[1]) ** 2
a = kernel_perceptron(X, q, 5); assert [kp_predict(a, X, q, x) for x, _ in X] == [1, 1, -1, -1] and mistakes(a) == sum(a) > 0 and kernel_perceptron(X, q, 0) == [0, 0, 0, 0]` },
          { name: "predict", code: `D = [((1,), 1), ((2,), -1)]; lin = lambda u, v: u[0] * v[0]
assert kp_predict([3, 1], D, lin, (1,)) == 1 and kp_predict([3, 1], D, lin, (-1,)) == -1 and kp_predict([2, 1], D, lin, (1,)) == -1 and mistakes([2, 0, 3]) == 5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve2(K, v)</C> for a 2 × 2 system, <C>project2(alpha, centres, xs, k)</C>, the coefficients on k(x_1, ·) and
          k(x_2, ·) of the projection of Σ α_j k(c_j, ·), and <C>norm_sq(alpha, centres, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def solve2(K, v):
    return [0.0, 0.0]

def project2(alpha, centres, xs, k):
    return [0.0, 0.0]

def norm_sq(alpha, centres, k):
    return 0.0
`,
        solution: PROJECT,
        tests: [
          { name: "solve", code: `assert solve2([[2, 0], [0, 4]], [2, 2]) == [1.0, 0.5] and solve2([[1, 1], [0, 1]], [3, 1]) == [2.0, 1.0]` },
          { name: "projection", code: `d = lambda x, z: 1.0 if x == z else 0.0
assert project2([2.0], [5], [5, 6], d) == [2.0, 0.0] and norm_sq([1, 2], [0, 1], d) == 5.0 and abs(norm_sq([1.0], [0.0], lambda x, z: math.exp(-(x - z) ** 2)) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "residual",
      rung: "stretch",
      prompt: (
        <p>
          With k(x, z) = exp(−(x − z)²), project f = k(1, ·) onto the span of k(0, ·) and k(2, ·). What is the squared norm of
          the part of f orthogonal to that span? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.734, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the squared loss the representer theorem gives a closed form: kernel ridge regression, α = (K + λmI)⁻¹y. The next
        lesson derives it and studies how its error depends on the kernel&apos;s spectrum.
      </p>
    </>
  ),
};
