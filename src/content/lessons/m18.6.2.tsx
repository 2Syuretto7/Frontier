import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CfSumViz } from "@/components/viz/CfSumViz";
import type { LessonContent } from "@/lib/types";

const DISCRETE = `import cmath

def char_fn(pmf, t):
    return sum(p * cmath.exp(1j * t * x) for x, p in pmf.items())

def convolve(p, q):
    out = {}
    for x, a in p.items():
        for y, b in q.items():
            out[x + y] = out.get(x + y, 0) + a * b
    return out

def moment_from_cf(pmf, h=1e-4):
    first = (char_fn(pmf, h) - char_fn(pmf, -h)) / (2j * h)
    second = -(char_fn(pmf, h) - 2 + char_fn(pmf, -h)) / h ** 2
    return first.real, second.real`;

const INVERT = `import cmath, math

def invert_lattice(phi, k, m=512):
    h = 2 * math.pi / m
    total = sum(cmath.exp(-1j * t * k) * phi(t) for t in (-math.pi + (j + 0.5) * h for j in range(m)))
    return (total * h / (2 * math.pi)).real

def standardized_cf(phi, sigma, n, t):
    return phi(t / (sigma * math.sqrt(n))) ** n

def cf_gap(phi, sigma, n, ts):
    return max(abs(standardized_cf(phi, sigma, n, t) - math.exp(-t * t / 2)) for t in ts)`;

export const lesson: LessonContent = {
  id: "m18.6.2",
  minutes: 50,
  links: {
    requires: ["m18.3.4", "m18.2.4"],
    revisits: ["m7.2.3", "m18.3.2"],
    foreshadows: ["m18.6.3"],
  },

  puzzle: (
    <>
      <p>
        The law of a sum of independent variables is a convolution, and convolving a law with itself a hundred times is
        hopeless by hand. Yet the central limit theorem claims that the hundredfold convolution of almost anything looks
        Gaussian. Is there a transform that turns convolution into multiplication, exists for every law, even one without
        a mean, and recognises convergence in distribution?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Probe a random variable with waves: the average of <M>{"e^{itX}"}</M> over its law, for every frequency t. Waves multiply
        under addition of independent variables, they are bounded, so the average always exists, and a law is determined by
        how it responds to all frequencies. Small t sees the coarse features, the mean and the variance, which is exactly
        what survives in the limit.
      </p>
      <CfSumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="characteristic function">
        <p>The characteristic function of a random variable X is</p>
        <MD>{"\\varphi_X(t) = \\mathbb E\\, e^{itX} = \\int e^{itx}\\, P_X(dx), \\qquad t \\in \\mathbb R."}</MD>
        <p>
          It exists for every law, since <M>{"|e^{itx}| = 1"}</M>. It has φ(0) = 1 and |φ| ≤ 1, it is uniformly continuous by dominated
          convergence, <M>{"\\varphi_{aX + b}(t) = e^{itb}\\varphi_X(at)"}</M>, and <M>{"\\varphi_{-X} = \\overline{\\varphi_X}"}</M>, so symmetric laws have real
          characteristic functions. For a finite law it is a finite sum (<C>char_fn</C>).
        </p>
      </Definition>

      <Theorem title="sums become products">
        <p>
          If X and Y are independent, <M>{"\\varphi_{X+Y} = \\varphi_X \\varphi_Y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"e^{it(X+Y)} = e^{itX} e^{itY}"}</M>, and the expectation of a product of bounded independent factors is the product of expectations
          (m18.3.2), applied to real and imaginary parts. The law of X + Y is the convolution (<C>convolve</C>), so convolution
          becomes multiplication.
        </p>
        <Code>{DISCRETE}</Code>
      </Proof>

      <Example title="a table">
        <ul>
          <li>Fair ±1: cos t. Poisson(λ): <M>{"\\exp(\\lambda(e^{it} - 1))"}</M>.</li>
          <li>Uniform on [−1, 1]: sin t / t. Exponential(1): <M>{"1/(1 - it)"}</M>.</li>
          <li>
            Standard normal: <M>{"e^{-t^2/2}"}</M>. Differentiating under the integral and integrating by parts gives{" "}
            <M>{"\\varphi'(t) = -t\\varphi(t)"}</M> with φ(0) = 1.
          </li>
          <li>Standard Cauchy: <M>{"e^{-|t|}"}</M>, not differentiable at 0, matching the missing mean.</li>
        </ul>
      </Example>

      <Theorem title="moments and Taylor expansion">
        <p>
          If <M>{"\\mathbb E|X|^k < \\infty"}</M>, then φ is k times continuously differentiable with <M>{"\\varphi^{(k)}(0) = i^k\\, \\mathbb E X^k"}</M>. In
          particular, for mean 0 and variance σ²,
        </p>
        <MD>{"\\varphi(t) = 1 - \\tfrac12 \\sigma^2 t^2 + o(t^2) \\quad (t \\to 0)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Differentiate under the integral sign: the k-th derivative of <M>{"e^{itx}"}</M> is <M>{"(ix)^k e^{itx}"}</M>, dominated by the integrable{" "}
          <M>{"|x|^k"}</M>, so dominated convergence (m18.2.2) justifies it. Finite differences recover the moments numerically (
          <C>moment_from_cf</C>).
        </p>
      </Proof>

      <Theorem title="inversion and uniqueness">
        <p>For a &lt; b continuity points of F,</p>
        <MD>{"F(b) - F(a) = \\lim_{T \\to \\infty} \\frac{1}{2\\pi} \\int_{-T}^{T} \\frac{e^{-ita} - e^{-itb}}{it}\\, \\varphi(t)\\, dt."}</MD>
        <p>
          So φ determines the law. If φ is integrable, X has the continuous density{" "}
          <M>{"f(x) = \\frac{1}{2\\pi} \\int e^{-itx}\\varphi(t)\\, dt"}</M>; for a law on the integers,{" "}
          <M>{"P(X = k) = \\frac{1}{2\\pi} \\int_{-\\pi}^{\\pi} e^{-itk}\\varphi(t)\\, dt"}</M> (<C>invert_lattice</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Insert the definition of φ and swap the integrals by Fubini (m18.2.4), legitimate on [−T, T] because the integrand is
          bounded by b − a. The inner integral is{" "}
          <M>{"\\int_{-T}^{T} \\frac{\\sin t(x - a) - \\sin t(x - b)}{t}\\, dt"}</M>, bounded uniformly in T and x, and tending to 2π, π or 0 according as x
          lies in (a, b), at an endpoint, or outside. Bounded convergence finishes it. The lattice formula is orthogonality of{" "}
          <M>{"e^{itk}"}</M> on [−π, π].
        </p>
        <Code>{INVERT}</Code>
      </Proof>

      <Theorem title="Lévy's continuity theorem">
        <p>
          <M>{"X_n \\Rightarrow X"}</M> if and only if <M>{"\\varphi_{X_n}(t) \\to \\varphi_X(t)"}</M> for every t. More strongly, if <M>{"\\varphi_{X_n}"}</M>{" "}
          converges pointwise to a function continuous at 0, that function is the characteristic function of some X and{" "}
          <M>{"X_n \\Rightarrow X"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          One direction: <M>{"\\cos tx"}</M> and <M>{"\\sin tx"}</M> are bounded and continuous, and convergence in distribution implies convergence of
          expectations of such functions (via the quantile coupling of m18.3.4). Conversely, the inequality{" "}
          <M>{"P(|X| > 2/u) \\le \\frac1u \\int_{-u}^{u} (1 - \\varphi(t))\\, dt"}</M>, a Fubini computation, and continuity at 0 show the laws are tight:
          no mass escapes to infinity. Every subsequence then has a further subsequence converging in distribution (Helly&apos;s
          selection theorem), its limit has characteristic function lim φₙ, and uniqueness makes all these limits the same.
        </p>
      </Proof>

      <Remark title="the road to the central limit theorem">
        <p>
          For i.i.d. steps with mean 0 and variance 1, <M>{"\\varphi_{S_n/\\sqrt n}(t) = \\varphi(t/\\sqrt n)^n = \\big(1 - \\tfrac{t^2}{2n} + o(1/n)\\big)^n \\to e^{-t^2/2}"}</M>{" "}
          (<C>standardized_cf</C>, <C>cf_gap</C>). Lévy&apos;s theorem turns this into convergence in distribution, which is the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "poisson",
      rung: "check",
      prompt: <p>X is Poisson(2). Compute φ_X(π). Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0183, tolerance: 0.0001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>X has characteristic function cos³ t. What is the variance of X?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "cauchy",
      rung: "apply",
      prompt: <p>The mean of n independent standard Cauchy variables has characteristic function e^(−n|t/n|). What follows?</p>,
      answer: {
        kind: "choice",
        options: [
          "The mean is standard Cauchy again, for every n",
          "The mean converges to 0 in probability",
          "The mean is approximately normal for large n",
          "The characteristic function shows the variance is 1/n",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import cmath

def char_fn(pmf, t):
    return sum(p * cmath.exp(1j * t * x) for x, p in pmf.items())

def convolve(p, q):
    out = {}
    for x, a in p.items():
        for y, b in q.items():
            out[x + y] = out.get(x + y, 0) + a * b
    return out

def moment_from_cf(pmf, h=1e-4):
    first = (char_fn(pmf, h) - char_fn(pmf, -h)) / (2j * h)
    second = -(char_fn(pmf, h) - 2 + char_fn(pmf, -h)) / h ** 2
    return first.real, second.real

coin = {-1: 0.5, 1: 0.5}; print(round(char_fn(coin, math.pi).real, 4), round(abs(char_fn({0: 0.5, 1: 0.5}, math.pi)), 4), convolve(coin, coin))
two = convolve(coin, {0: 0.5, 2: 0.5}); print(round(abs(char_fn(two, 1) - char_fn(coin, 1) * char_fn({0: 0.5, 2: 0.5}, 1)), 6), [round(v, 3) for v in moment_from_cf({0: 0.5, 2: 0.5})])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-1.0 0.0 {-2: 0.25, 0: 0.5, 2: 0.25}\n0.0 [1.0, 2.0]",
          "1.0 0.0 {-2: 0.25, 0: 0.5, 2: 0.25}\n0.0 [1.0, 2.0]",
          "-1.0 1.0 {-2: 0.25, 0: 0.5, 2: 0.25}\n0.0 [1.0, 1.0]",
          "-1.0 0.0 {-2: 0.25, 2: 0.25}\n0.5 [1.0, 2.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import cmath, math

def invert_lattice(phi, k, m=512):
    h = 2 * math.pi / m
    total = sum(cmath.exp(-1j * t * k) * phi(t) for t in (-math.pi + (j + 0.5) * h for j in range(m)))
    return (total * h / (2 * math.pi)).real

def standardized_cf(phi, sigma, n, t):
    return phi(t / (sigma * math.sqrt(n))) ** n

def cf_gap(phi, sigma, n, ts):
    return max(abs(standardized_cf(phi, sigma, n, t) - math.exp(-t * t / 2)) for t in ts)

print(round(invert_lattice(lambda t: math.cos(t) ** 2, 0), 4), round(invert_lattice(lambda t: math.cos(t) ** 2, 2), 4), round(invert_lattice(lambda t: math.cos(t) ** 2, 1), 4))
print(round(standardized_cf(math.cos, 1, 1, 1.0), 4), round(abs(standardized_cf(math.cos, 1, 100, 1.0) - math.exp(-0.5)), 4), round(cf_gap(lambda t: 1.0, 1, 5, [0.0, 1.0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.25 0.0\n0.5403 0.0005 0.3935",
          "0.5 0.25 0.25\n0.5403 0.0005 0.3935",
          "0.25 0.5 0.0\n0.5403 0.0005 0.3935",
          "0.5 0.25 0.0\n0.8776 0.6065 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For laws given as dicts of weights, write <C>char_fn(pmf, t)</C> as a complex number, <C>convolve(p, q)</C>, the law of the
          sum of independent variables, and <C>moment_from_cf(pmf, h)</C>, returning E X and E X² from central differences of φ at
          ±h.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import cmath

def char_fn(pmf, t):
    return 0j

def convolve(p, q):
    return {}

def moment_from_cf(pmf, h=1e-4):
    return 0.0, 0.0
`,
        solution: DISCRETE,
        tests: [
          { name: "cf", code: `import math
assert abs(char_fn({0: 1.0}, 2.0) - 1) < 1e-12 and abs(char_fn({1: 0.5, -1: 0.5}, 0.3) - math.cos(0.3)) < 1e-12
assert convolve({0: 0.5, 1: 0.5}, {0: 0.5, 1: 0.5}) == {0: 0.25, 1: 0.5, 2: 0.25}` },
          { name: "moments", code: `m1, m2 = moment_from_cf({1: 0.25, 3: 0.75})
assert abs(m1 - 2.5) < 1e-4 and abs(m2 - 7.0) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>invert_lattice(phi, k, m)</C>, recovering P(X = k) for an integer-valued X from its characteristic function with
          an m-point midpoint rule on [−π, π]; <C>standardized_cf(phi, sigma, n, t)</C>, the characteristic function of a sum of n
          i.i.d. copies divided by σ√n; and <C>cf_gap(phi, sigma, n, ts)</C>, its largest distance from e^(−t²/2) over ts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import cmath, math

def invert_lattice(phi, k, m=512):
    return 0.0

def standardized_cf(phi, sigma, n, t):
    return 0.0

def cf_gap(phi, sigma, n, ts):
    return 0.0
`,
        solution: INVERT,
        tests: [
          { name: "invert", code: `assert abs(invert_lattice(lambda t: (0.5 + 0.5 * cmath.exp(1j * t)) ** 2, 1) - 0.5) < 1e-9 and abs(invert_lattice(lambda t: cmath.exp(3j * t), 3) - 1) < 1e-9` },
          { name: "standardize", code: `assert abs(standardized_cf(math.cos, 2, 1, 2.0) - math.cos(1)) < 1e-12 and abs(cf_gap(math.cos, 1, 1, [math.pi]) - 1.0071918834) < 1e-9` },
        ],
      },
    },
    {
      key: "fejer",
      rung: "stretch",
      prompt: (
        <p>
          The sum of two independent uniforms on [−1, 1] has the triangular density (2 − |x|)/4 on [−2, 2] and characteristic
          function (sin t / t)². Use the inversion formula at x = 0 to evaluate{" "}
          <M>{"\\int_{-\\infty}^{\\infty} (\\sin t / t)^2\\, dt"}</M>. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.1416, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        For identically distributed steps the Taylor expansion of φ gives the central limit theorem in two lines. Without
        identical distribution, what condition stops one term from dominating? That is the Lindeberg condition.
      </p>
    </>
  ),
};
