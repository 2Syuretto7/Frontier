import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChangeOfVarViz } from "@/components/viz/ChangeOfVarViz";
import type { LessonContent } from "@/lib/types";

const TRANSFORM = `import math

def density_of_transform(f_x, g_inv, dg_inv):
    return lambda y: f_x(g_inv(y)) * abs(dg_inv(y))

def square_density(f_x, y):
    if y <= 0:
        return 0.0
    r = math.sqrt(y)
    return (f_x(r) + f_x(-r)) / (2 * r)`;

const CONV = `import numpy as np

def discrete_convolve(p, q):
    out = [0.0] * (len(p) + len(q) - 1)
    for i, a in enumerate(p):
        for j, b in enumerate(q):
            out[i + j] += a * b
    return out

def convolve_density(f, g, s, lo, hi, n=20000):
    h = (hi - lo) / n
    x = lo + h * (np.arange(n) + 0.5)
    return float(np.sum(f(x) * g(s - x)) * h)`;

export const lesson: LessonContent = {
  id: "m7.3.4",
  minutes: 60,
  links: {
    requires: ["m7.3.3", "m2.4.4"],
    revisits: ["m5.2.3"],
    foreshadows: ["m7.4.1", "m7.5.1", "m7.5.4"],
  },

  puzzle: (
    <>
      <p>
        Stock prices are often modelled as the exponential of a normal variable, and a normalising flow models images as an
        invertible function of Gaussian noise. In both, you know the density of the input and the function applied to it.
        What is the density of the output? Naively plugging in, f_X(g⁻¹(y)), gives something that does not even integrate
        to 1.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Probability is conserved: a thin interval of x and its image under g hold the same probability. If g stretches the
        interval by a factor |g′|, the same probability is spread over a longer stretch, so the density drops by that
        factor. Where several x map to the same y, their contributions add.
      </p>
      <ChangeOfVarViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="change of variables">
        <p>
          Let X have density <M>{"f_X"}</M>, and let g be strictly monotone and differentiable on an interval containing the
          values of X, with inverse h. Then Y = g(X) has density
        </p>
        <MD>{"f_Y(y) = f_X(h(y))\\,|h'(y)| = \\frac{f_X(x)}{|g'(x)|}\\Big|_{x = h(y)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          If g is increasing, <M>{"F_Y(y) = P(g(X) \\le y) = P(X \\le h(y)) = F_X(h(y))"}</M>, and the chain rule gives{" "}
          <M>{"f_Y(y) = f_X(h(y))h'(y)"}</M> with h′ ≥ 0. If g is decreasing,{" "}
          <M>{"F_Y(y) = P(X \\ge h(y)) = 1 - F_X(h(y))"}</M>, whose derivative is <M>{"-f_X(h(y))h'(y)"}</M> with h′ ≤ 0.
          Both cases are the formula with |h′|. Finally h′(y) = 1/g′(h(y)) by the inverse function rule.
        </p>
        <Code>{TRANSFORM}</Code>
      </Proof>

      <Example title="log-normal">
        <p>
          If X ~ N(μ, σ²) and Y = <M>{"e^X"}</M>, then h(y) = log y and h′(y) = 1/y, so
        </p>
        <MD>{"f_Y(y) = \\frac{1}{y\\sigma\\sqrt{2\\pi}}\\exp\\Big(-\\frac{(\\log y - \\mu)^2}{2\\sigma^2}\\Big), \\quad y > 0."}</MD>
        <p>
          Its mean is easier by the law of the unconscious statistician: completing the square in{" "}
          <M>{"\\int e^{x}\\varphi((x - \\mu)/\\sigma)\\,dx/\\sigma"}</M> gives <M>{"E[Y] = e^{\\mu + \\sigma^2/2}"}</M>, larger
          than <M>{"e^{\\mu}"}</M>, the exponential of the mean.
        </p>
      </Example>

      <Theorem title="several preimages">
        <p>
          If g is differentiable with g′ ≠ 0 at each of finitely many solutions of g(x) = y, then{" "}
          <M>{"f_Y(y) = \\sum_{x:\\, g(x) = y} f_X(x)/|g'(x)|"}</M>. In particular, for Y = X²,
        </p>
        <MD>{"f_Y(y) = \\frac{f_X(\\sqrt y) + f_X(-\\sqrt y)}{2\\sqrt y}, \\quad y > 0."}</MD>
      </Theorem>
      <Proof>
        <p>
          For Y = X² and y &gt; 0, <M>{"F_Y(y) = P(-\\sqrt y \\le X \\le \\sqrt y) = F_X(\\sqrt y) - F_X(-\\sqrt y)"}</M>;
          differentiating gives the formula, each branch contributing <M>{"f_X(\\pm\\sqrt y)\\cdot\\frac{1}{2\\sqrt y}"}</M>.
          The general case splits the range of x into pieces on which g is monotone and adds the monotone formula over the
          pieces. For X standard normal this gives the chi-square density with one degree of freedom,{" "}
          <M>{"e^{-y/2}/\\sqrt{2\\pi y}"}</M>.
        </p>
      </Proof>

      <Theorem title="sums of independent variables">
        <p>
          If X and Y are independent and integer-valued, <M>{"P(X + Y = s) = \\sum_k P(X = k)P(Y = s - k)"}</M>. If they are
          independent with densities f and g, then X + Y has density{" "}
          <M>{"(f * g)(s) = \\int f(x)g(s - x)\\,dx"}</M>, the convolution.
        </p>
      </Theorem>
      <Proof>
        <p>
          The discrete case is total probability over the value of X, with independence splitting each term. In the
          continuous case, independence makes f(x)g(y) the joint density of (X, Y) (made precise in the chapter on joint
          distributions), so{" "}
          <M>{"P(X + Y \\le s) = \\int f(x)\\Big(\\int_{-\\infty}^{s-x}g(y)\\,dy\\Big)dx = \\int f(x)G(s - x)\\,dx"}</M>;
          differentiating under the integral gives the convolution.
        </p>
        <Code>{CONV}</Code>
      </Proof>
      <Example title="convolutions">
        <p>
          Two independent Uniform(0, 1) variables sum to the triangular density, s on [0, 1] and 2 − s on [1, 2]. Two
          independent Exponential(1) variables sum to density <M>{"\\int_0^s e^{-x}e^{-(s-x)}dx = se^{-s}"}</M>, a Gamma
          density. Two dice give the familiar triangle peaking at 7.
        </p>
      </Example>

      <Remark title="normalising flows">
        <p>
          In several dimensions the factor |g′| becomes the absolute determinant of the Jacobian, and a flow evaluates{" "}
          <M>{"\\log f_Y(y) = \\log f_X(x) - \\log|\\det Dg(x)|"}</M>. Flow architectures are designed so that this
          determinant is cheap, for instance triangular Jacobians whose determinant is the product of the diagonal.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "affine",
      rung: "check",
      prompt: <p>X ~ Uniform(0, 1) and Y = 3X + 2. What is the density of Y at y = 4? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: <p>X ~ Exponential(1) and Y = 2X. What is the density of Y at y = 2? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1839, tolerance: 0.0001 },
    },
    {
      key: "flow",
      rung: "apply",
      prompt: <p>For an invertible increasing g on the real line and Y = g(X), which is log f_Y(g(x))?</p>,
      answer: {
        kind: "choice",
        options: ["log f_X(x) − log g′(x)", "log f_X(x) + log g′(x)", "log f_X(x)", "log f_X(g(x)) − log g′(x)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def density_of_transform(f_x, g_inv, dg_inv):
    return lambda y: f_x(g_inv(y)) * abs(dg_inv(y))

def square_density(f_x, y):
    if y <= 0:
        return 0.0
    r = math.sqrt(y)
    return (f_x(r) + f_x(-r)) / (2 * r)

phi = lambda x: math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
lognormal = density_of_transform(phi, math.log, lambda y: 1 / y)
expo = density_of_transform(lambda u: 1.0 if 0 < u < 1 else 0.0, lambda y: math.exp(-y), lambda y: -math.exp(-y))
print(round(lognormal(1.0), 4), round(lognormal(2.0), 4), round(expo(1.0), 4))
print(round(square_density(phi, 1.0), 4), square_density(phi, -1.0), round(square_density(lambda x: 0.5 if -1 < x < 1 else 0.0, 0.25), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3989 0.1569 0.3679\n0.242 0.0 1.0",
          "0.3989 0.3138 0.3679\n0.242 0.0 1.0",
          "0.3989 0.1569 0.3679\n0.121 0.0 1.0",
          "0.3989 0.1569 0.6321\n0.242 0.0 1.0",
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

def discrete_convolve(p, q):
    out = [0.0] * (len(p) + len(q) - 1)
    for i, a in enumerate(p):
        for j, b in enumerate(q):
            out[i + j] += a * b
    return out

def convolve_density(f, g, s, lo, hi, n=20000):
    h = (hi - lo) / n
    x = lo + h * (np.arange(n) + 0.5)
    return float(np.sum(f(x) * g(s - x)) * h)

two = discrete_convolve([1 / 6] * 6, [1 / 6] * 6)
print(len(two), round(max(two), 4), two.index(max(two)) + 2)
u = lambda x: ((x > 0) & (x < 1)).astype(float)
e = lambda x: np.where(x > 0, np.exp(-np.abs(x)), 0.0)
print(round(convolve_density(u, u, 1.0, 0, 1), 3), round(convolve_density(u, u, 0.5, 0, 1), 3), round(convolve_density(e, e, 2.0, 0, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["11 0.1667 7\n1.0 0.5 0.2707", "12 0.1667 7\n1.0 0.5 0.2707", "11 0.1667 6\n1.0 0.5 0.2707", "11 0.1667 7\n1.0 0.5 0.1353"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>density_of_transform(f_x, g_inv, dg_inv)</C>, returning the density function of Y = g(X) for monotone g,
          given the inverse and its derivative; and <C>square_density(f_x, y)</C>, the density of X² at y (0 for y ≤ 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def density_of_transform(f_x, g_inv, dg_inv):
    return lambda y: f_x(g_inv(y))

def square_density(f_x, y):
    return 0.0
`,
        solution: TRANSFORM,
        tests: [
          { name: "monotone", code: `phi = lambda x: math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
ln = density_of_transform(phi, math.log, lambda y: 1 / y)
assert abs(ln(2.0) - phi(math.log(2)) / 2) < 1e-12
d = density_of_transform(lambda x: math.exp(-x) if x > 0 else 0.0, lambda y: -y, lambda y: -1.0)
assert abs(d(-1.0) - math.exp(-1)) < 1e-12 and d(1.0) == 0.0` },
          { name: "square", code: `phi = lambda x: math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
for y in (0.3, 1.0, 4.0):
    assert abs(square_density(phi, y) - math.exp(-y / 2) / math.sqrt(2 * math.pi * y)) < 1e-12
assert square_density(phi, -2.0) == 0.0 and square_density(phi, 0.0) == 0.0
assert abs(square_density(lambda x: 1.0 if 0 < x < 1 else 0.0, 0.25) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>discrete_convolve(p, q)</C>, the pmf list of X + Y for independent X, Y with pmf lists p, q on 0, 1, 2, …,
          and <C>convolve_density(f, g, s, lo, hi, n=20000)</C>, the midpoint-rule value of ∫ f(x)g(s − x) dx over [lo, hi]
          for vectorised f, g, as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def discrete_convolve(p, q):
    return []

def convolve_density(f, g, s, lo, hi, n=20000):
    return 0.0
`,
        solution: CONV,
        tests: [
          { name: "discrete", code: `two = discrete_convolve([1 / 6] * 6, [1 / 6] * 6)
assert len(two) == 11 and abs(two[5] - 6 / 36) < 1e-12 and abs(sum(two) - 1) < 1e-12
assert np.allclose(discrete_convolve([0.5, 0.5], [0.5, 0.5]), [0.25, 0.5, 0.25])
assert np.allclose(discrete_convolve([1.0], [0.2, 0.8]), [0.2, 0.8])` },
          { name: "continuous", code: `u = lambda x: ((x > 0) & (x < 1)).astype(float)
assert abs(convolve_density(u, u, 0.5, 0, 1) - 0.5) < 1e-3 and abs(convolve_density(u, u, 1.5, 0, 1) - 0.5) < 1e-3
e = lambda x: np.where(x > 0, np.exp(-np.abs(x)), 0.0)
assert abs(convolve_density(e, e, 3.0, 0, 3) - 3 * np.exp(-3)) < 1e-6
assert isinstance(convolve_density(e, e, 1.0, 0, 1), float)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let X have a continuous density <M>{"f_X"}</M>, and let g be strictly increasing and differentiable with
          differentiable inverse h. Prove that Y = g(X) has density <M>{"f_X(h(y))h'(y)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes the CDF: F_Y(y) = P(g(X) ≤ y) = P(X ≤ h(y)) = F_X(h(y)), using that g is increasing.",
          "Differentiates with the chain rule: F_Y′(y) = F_X′(h(y))·h′(y) = f_X(h(y))h′(y).",
          "Notes this derivative is non-negative and that a CDF whose derivative exists (and integrates back to it) has that derivative as a density.",
        ],
      },
    },
    {
      key: "lnmean",
      rung: "stretch",
      prompt: <p>X ~ N(0, 1). What is E[e^X]? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.6487, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the density of g(X) is f_X divided by |g′|, how to handle a transformation like X² that is not one-to-one, and why the density of a sum of independent variables is a convolution.",

  glimpse: (
    <>
      <p>
        Convolutions are awkward to compute directly. The next lesson introduces moment generating functions, which turn
        convolution into multiplication and show, for instance, that sums of independent normals are normal. The
        many-dimensional change of variables, with a Jacobian determinant, comes with joint distributions.
      </p>
    </>
  ),
};
