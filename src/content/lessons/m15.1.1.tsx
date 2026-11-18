import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SubGaussTailViz } from "@/components/viz/SubGaussTailViz";
import type { LessonContent } from "@/lib/types";

const SUBG = `import math

def subg_tail(t, sigma2):
    return math.exp(-t * t / (2 * sigma2)) if t > 0 else 1.0

def empirical_tail(samples, t):
    return sum(x >= t for x in samples) / len(samples)

def max_bound(n, sigma):
    return sigma * math.sqrt(2 * math.log(n))`;

const SUBEXP = `import math

def subexp_tail(t, nu2, b):
    if t <= 0:
        return 1.0
    return math.exp(-t * t / (2 * nu2)) if t <= nu2 / b else math.exp(-t / (2 * b))

def chi2_centered_mgf(lam):
    return math.exp(-lam) / math.sqrt(1 - 2 * lam) if lam < 0.5 else math.inf

def sum_params(params):
    return math.sqrt(sum(nu * nu for nu, b in params)), max(b for nu, b in params)`;

export const lesson: LessonContent = {
  id: "m15.1.1",
  minutes: 55,
  links: {
    requires: ["m7.4.1"],
    revisits: ["m7.7.1", "m7.3.2"],
    foreshadows: ["m15.1.2", "m15.2.1"],
  },

  puzzle: (
    <>
      <p>
        Chebyshev&apos;s inequality says that a variable with variance 1 exceeds 6 with probability at most 1/36. For a
        Gaussian the true probability is about one in a billion; for a Student t variable with variance 1 it is about one
        in a thousand. Variance alone cannot tell these apart. What single property of a distribution decides whether its
        tails fall off like a Gaussian&apos;s, and why is that the property that matters for sums of many variables?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The moment generating function <M>{"\\mathbb{E}e^{\\lambda X}"}</M> weighs large values exponentially, so a bound on
        it is a bound on the tails at every level at once (the Chernoff bound of m7.4.1). A variable is sub-Gaussian when
        its MGF is no larger than a Gaussian&apos;s; then its tails are no heavier than a Gaussian&apos;s. Sub-exponential
        variables satisfy such a bound only for small λ, and their tails eventually decay like an exponential rather than
        like a Gaussian.
      </p>
      <SubGaussTailViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sub-Gaussian variables">
        <p>
          A random variable X with mean μ is <em>sub-Gaussian with variance proxy</em> <M>{"\\sigma^2"}</M> if
        </p>
        <MD>{"\\mathbb{E}\\,e^{\\lambda(X - \\mu)} \\le e^{\\lambda^2\\sigma^2/2} \\quad \\text{for all } \\lambda \\in \\mathbb{R}."}</MD>
        <p>A Gaussian with variance <M>{"\\sigma^2"}</M> satisfies this with equality.</p>
      </Definition>

      <Theorem title="sub-Gaussian tails">
        <p>
          If X is sub-Gaussian with variance proxy <M>{"\\sigma^2"}</M>, then for every <M>{"t \\ge 0"}</M>,{" "}
          <M>{"P(X - \\mu \\ge t) \\le e^{-t^2/(2\\sigma^2)}"}</M>, and <M>{"P(|X - \\mu| \\ge t) \\le 2e^{-t^2/(2\\sigma^2)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For <M>{"\\lambda > 0"}</M>, Markov&apos;s inequality applied to <M>{"e^{\\lambda(X-\\mu)}"}</M> gives{" "}
          <M>{"P(X - \\mu \\ge t) \\le e^{-\\lambda t}\\,\\mathbb{E}e^{\\lambda(X-\\mu)} \\le e^{-\\lambda t + \\lambda^2\\sigma^2/2}"}</M>. The
          exponent is smallest at <M>{"\\lambda = t/\\sigma^2"}</M>, where it equals <M>{"-t^2/(2\\sigma^2)"}</M>. The lower tail
          follows by applying the same argument to <M>{"-X"}</M>, which satisfies the same MGF bound, and a union bound
          gives the two-sided version.
        </p>
        <Code>{SUBG}</Code>
      </Proof>

      <Example title="Rademacher and bounded variables">
        <p>
          A Rademacher sign ε, equal to ±1 with probability ½ each, has <M>{"\\mathbb{E}e^{\\lambda\\varepsilon} = \\cosh\\lambda = \\sum_k \\lambda^{2k}/(2k)!"}</M>.
          Since <M>{"(2k)! \\ge 2^k k!"}</M> (each of the k factors <M>{"2j(2j-1)"}</M> is at least 2j), this is at most{" "}
          <M>{"\\sum_k (\\lambda^2/2)^k/k! = e^{\\lambda^2/2}"}</M>: ε is sub-Gaussian with variance proxy 1. More generally a
          variable confined to <M>{"[a, b]"}</M> is sub-Gaussian with variance proxy <M>{"(b-a)^2/4"}</M>, Hoeffding&apos;s lemma,
          proved in the next lesson.
        </p>
      </Example>

      <Theorem title="sums and maxima">
        <p>
          If <M>{"X_1, \\dots, X_n"}</M> are independent and sub-Gaussian with variance proxies <M>{"\\sigma_i^2"}</M>, their sum
          is sub-Gaussian with variance proxy <M>{"\\sum_i \\sigma_i^2"}</M>. If <M>{"X_1, \\dots, X_n"}</M> have mean 0 and are
          each sub-Gaussian with variance proxy <M>{"\\sigma^2"}</M>, independent or not, then
        </p>
        <MD>{"\\mathbb{E}\\max_{i \\le n} X_i \\le \\sigma\\sqrt{2\\log n}."}</MD>
      </Theorem>
      <Proof>
        <p>
          For the sum, independence makes the MGF of the centred sum the product of the individual MGFs, each at most{" "}
          <M>{"e^{\\lambda^2\\sigma_i^2/2}"}</M>. For the maximum, Jensen&apos;s inequality and the bound of a maximum by a sum give,
          for <M>{"\\lambda > 0"}</M>,{" "}
          <M>{"e^{\\lambda\\mathbb{E}\\max X_i} \\le \\mathbb{E}e^{\\lambda \\max X_i} \\le \\sum_i \\mathbb{E}e^{\\lambda X_i} \\le n e^{\\lambda^2\\sigma^2/2}"}</M>.
          Taking logarithms, <M>{"\\mathbb{E}\\max X_i \\le \\log n/\\lambda + \\lambda\\sigma^2/2"}</M>, and the choice{" "}
          <M>{"\\lambda = \\sqrt{2\\log n}/\\sigma"}</M> gives the bound. The maximum of a million standard Gaussians is
          therefore on average at most about 5.3: it grows only like the square root of the logarithm of n.
        </p>
      </Proof>

      <Definition title="sub-exponential variables">
        <p>
          X is <em>sub-exponential with parameters</em> <M>{"(\\nu, b)"}</M> if{" "}
          <M>{"\\mathbb{E}e^{\\lambda(X-\\mu)} \\le e^{\\lambda^2\\nu^2/2}"}</M> for all <M>{"|\\lambda| < 1/b"}</M>. Every
          sub-Gaussian variable is sub-exponential, but not conversely. If Z is standard Gaussian, <M>{"Z^2"}</M> has{" "}
          <M>{"\\mathbb{E}e^{\\lambda(Z^2 - 1)} = e^{-\\lambda}/\\sqrt{1 - 2\\lambda}"}</M> for <M>{"\\lambda < 1/2"}</M> and is
          infinite beyond, so it is not sub-Gaussian; one can check that it is sub-exponential with <M>{"(\\nu, b) = (2, 4)"}</M>.
        </p>
        <Code>{SUBEXP}</Code>
      </Definition>

      <Theorem title="sub-exponential tails">
        <p>If X is sub-exponential with parameters <M>{"(\\nu, b)"}</M>, then</p>
        <MD>{"P(X - \\mu \\ge t) \\le \\begin{cases} e^{-t^2/(2\\nu^2)}, & 0 \\le t \\le \\nu^2/b, \\\\ e^{-t/(2b)}, & t > \\nu^2/b. \\end{cases}"}</MD>
        <p>
          A sum of independent sub-exponential variables with parameters <M>{"(\\nu_i, b_i)"}</M> is sub-exponential with
          parameters <M>{"(\\sqrt{\\sum_i \\nu_i^2},\\ \\max_i b_i)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          As before, <M>{"P(X - \\mu \\ge t) \\le e^{-\\lambda t + \\lambda^2\\nu^2/2}"}</M>, now only for{" "}
          <M>{"0 < \\lambda < 1/b"}</M>. The unconstrained minimiser <M>{"\\lambda = t/\\nu^2"}</M> is allowed when{" "}
          <M>{"t \\le \\nu^2/b"}</M>, giving the Gaussian regime (at the boundary itself, take the limit). Otherwise let λ tend to 1/b:
          the exponent tends to <M>{"-t/b + \\nu^2/(2b^2)"}</M>, and since <M>{"\\nu^2/b < t"}</M> this is at most{" "}
          <M>{"-t/b + t/(2b) = -t/(2b)"}</M>. For the sum, the product of MGFs is bounded on the common range{" "}
          <M>{"|\\lambda| < 1/\\max b_i"}</M> by <M>{"e^{\\lambda^2\\sum\\nu_i^2/2}"}</M>.
        </p>
      </Proof>

      <Remark title="two regimes">
        <p>
          The sum of n independent copies of <M>{"Z^2 - 1"}</M> has <M>{"\\nu^2 = 4n"}</M> and b = 4, so deviations up to n
          have Gaussian tails with variance about 4n, and only deviations of order n or more see the slower exponential tail.
          This is the pattern behind most high-dimensional results: small deviations of sums look Gaussian, and the
          parameters tell you how far that picture extends.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tail",
      rung: "check",
      prompt: <p>X is sub-Gaussian with mean 0 and variance proxy 2. What upper bound does the tail theorem give for P(X ≥ 4)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0183, tolerance: 0.00006 },
    },
    {
      key: "max",
      rung: "check",
      prompt: <p>Bound the expected maximum of a million standard Gaussians, using the sub-Gaussian maximal inequality. Give three decimals.</p>,
      answer: { kind: "numeric", value: 5.257, tolerance: 0.0006 },
    },
    {
      key: "square",
      rung: "apply",
      prompt: <p>Why is the square of a standard Gaussian not sub-Gaussian?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its MGF is infinite for λ ≥ 1/2, so no bound of the form exp(λ²σ²/2) can hold for all λ",
          "Its variance is infinite",
          "It is not symmetric about its mean, and sub-Gaussian variables must be symmetric",
          "It takes only non-negative values",
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

def subg_tail(t, sigma2):
    return math.exp(-t * t / (2 * sigma2)) if t > 0 else 1.0

def empirical_tail(samples, t):
    return sum(x >= t for x in samples) / len(samples)

def max_bound(n, sigma):
    return sigma * math.sqrt(2 * math.log(n))

print(round(subg_tail(3, 1), 4), subg_tail(-1, 1), round(max_bound(1000, 1), 3), round(max_bound(1000, 2) / max_bound(10, 2), 3))
print(empirical_tail([0.5, 1.5, 2.0, -1.0], 1.5), empirical_tail([1, 2, 3], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0111 1.0 3.717 1.732\n0.5 0.0", "0.0111 0.6065 3.717 1.732\n0.5 0.0", "0.0111 1.0 3.717 3.0\n0.5 0.0", "0.0111 1.0 3.717 1.732\n0.25 0.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def subexp_tail(t, nu2, b):
    if t <= 0:
        return 1.0
    return math.exp(-t * t / (2 * nu2)) if t <= nu2 / b else math.exp(-t / (2 * b))

def chi2_centered_mgf(lam):
    return math.exp(-lam) / math.sqrt(1 - 2 * lam) if lam < 0.5 else math.inf

def sum_params(params):
    return math.sqrt(sum(nu * nu for nu, b in params)), max(b for nu, b in params)

print(round(subexp_tail(50, 400, 4), 4), round(subexp_tail(120, 400, 4) * 1e7, 3), subexp_tail(100, 400, 4) == math.exp(-12.5))
print(round(chi2_centered_mgf(0.25), 4), round(math.exp(2 * 0.25 ** 2), 4), chi2_centered_mgf(0.5), sum_params([(2, 4)] * 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0439 3.059 True\n1.1014 1.1331 inf (20.0, 4)",
          "0.0439 3.059 False\n1.1014 1.1331 inf (20.0, 4)",
          "0.0439 3.059 True\n1.1014 1.1331 inf (200, 4)",
          "0.0019 3.059 True\n1.1014 1.1331 inf (20.0, 400)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>subg_tail(t, sigma2)</C>, the bound <M>{"e^{-t^2/(2\\sigma^2)}"}</M> for t &gt; 0 and 1 otherwise;{" "}
          <C>empirical_tail(samples, t)</C>, the fraction of samples at least t; and <C>max_bound(n, sigma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def subg_tail(t, sigma2):
    return 1.0

def empirical_tail(samples, t):
    return 0.0

def max_bound(n, sigma):
    return sigma * n
`,
        solution: SUBG,
        tests: [
          { name: "bounds", code: `import math
assert abs(subg_tail(3, 1) - math.exp(-4.5)) < 1e-15 and subg_tail(-1, 1) == 1.0 and subg_tail(0, 5) == 1.0 and abs(subg_tail(4, 2) - math.exp(-4)) < 1e-15
assert abs(max_bound(1000, 1) - math.sqrt(2 * math.log(1000))) < 1e-12 and max_bound(1, 3) == 0.0 and abs(max_bound(100, 2) - 2 * math.sqrt(2 * math.log(100))) < 1e-12` },
          { name: "simulation", code: `import random
assert empirical_tail([0.5, 1.5, 2.0, -1.0], 1.5) == 0.5 and empirical_tail([1, 2, 3], 4) == 0.0
r = random.Random(0)
xs = [sum(r.choice((-1, 1)) for _ in range(16)) / 4 for _ in range(20000)]
for t in [1.0, 1.5, 2.0, 2.5]:
    assert empirical_tail(xs, t) <= subg_tail(t, 1), t
m = sum(max(r.gauss(0, 1) for _ in range(100)) for _ in range(500)) / 500
assert m <= max_bound(100, 1) and m > 2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>subexp_tail(t, nu2, b)</C>, the two-regime bound (1 for t ≤ 0); <C>chi2_centered_mgf(lam)</C>, the MGF of{" "}
          <M>{"Z^2 - 1"}</M>, returning <C>math.inf</C> for λ ≥ ½; and <C>sum_params(params)</C>, the parameters of a sum of
          independent sub-exponential variables given as (ν, b) pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def subexp_tail(t, nu2, b):
    return 1.0

def chi2_centered_mgf(lam):
    return 1.0

def sum_params(params):
    return 0.0, 0.0
`,
        solution: SUBEXP,
        tests: [
          { name: "tails", code: `import math
assert abs(subexp_tail(50, 400, 4) - math.exp(-2500 / 800)) < 1e-15 and subexp_tail(120, 400, 4) == math.exp(-15) and subexp_tail(100, 400, 4) == math.exp(-12.5)
assert subexp_tail(0, 1, 1) == 1.0 and subexp_tail(-3, 1, 1) == 1.0` },
          { name: "chi-square", code: `import math
assert chi2_centered_mgf(0.5) == math.inf and chi2_centered_mgf(0.7) == math.inf and chi2_centered_mgf(0) == 1.0
for lam in [-0.24, -0.1, 0.05, 0.2, 0.249]:
    assert chi2_centered_mgf(lam) <= math.exp(2 * lam * lam), lam
assert sum_params([(2, 4)] * 100) == (20.0, 4) and sum_params([(3, 1), (4, 2)]) == (5.0, 2)` },
        ],
      },
    },
    {
      key: "chi",
      rung: "stretch",
      prompt: (
        <p>
          Using parameters (2, 4) for each <M>{"Z_i^2 - 1"}</M>, bound <M>{"P\\bigl(\\sum_{i=1}^{50} Z_i^2 - 50 \\ge 30\\bigr)"}</M>{" "}
          with the sub-exponential tail theorem. Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.105, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The next lesson turns these facts into the two workhorse inequalities for averages: Hoeffding&apos;s, for bounded
        variables, and Bernstein&apos;s, which also uses the variance.
      </p>
    </>
  ),
};
