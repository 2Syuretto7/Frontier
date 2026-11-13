import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NormalTailViz } from "@/components/viz/NormalTailViz";
import type { LessonContent } from "@/lib/types";

const NORMAL = `import math

def Phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def normal_prob(a, b, mu=0.0, sigma=1.0):
    return Phi((b - mu) / sigma) - Phi((a - mu) / sigma)

def mills_bound(t):
    return math.exp(-t * t / 2) / (t * math.sqrt(2 * math.pi))`;

const EXPO = `import numpy as np

def survival_ratio(samples, s, t):
    alive = samples[samples > s]
    return float(np.mean(alive > s + t)), float(np.mean(samples > t))

def min_rate(rates, n, seed=0):
    rng = np.random.default_rng(seed)
    draws = rng.exponential(1 / np.asarray(rates), size=(n, len(rates)))
    return 1 / draws.min(axis=1).mean()`;

export const lesson: LessonContent = {
  id: "m7.3.2",
  minutes: 60,
  links: {
    requires: ["m7.3.1", "m2.7.4"],
    revisits: ["m7.2.2"],
    foreshadows: ["m7.3.3", "m7.5.4", "m7.7.2"],
  },

  puzzle: (
    <>
      <p>
        A bulb&apos;s lifetime is exponential with mean 1000 hours. It has already burned for 2000 hours. How long should you
        expect it to last from now? And a different question about the bell curve: how rare, exactly, is something six
        standard deviations from the mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Three continuous distributions carry most of applied probability. The uniform spreads mass evenly over an interval.
        The exponential is the waiting time for a memoryless event, the continuous twin of the geometric. The normal is the
        shape that sums of many small independent effects take, and its tails fall off so fast, like{" "}
        <M>{"e^{-t^2/2}"}</M>, that a few standard deviations already make an event extremely rare.
      </p>
      <NormalTailViz />
    </>
  ),

  theory: (
    <>
      <Definition title="uniform">
        <p>
          X ~ Uniform(a, b) has density <M>{"1/(b-a)"}</M> on [a, b]. Then <M>{"E[X] = (a+b)/2"}</M> and{" "}
          <M>{"\\operatorname{Var}(X) = (b-a)^2/12"}</M>.
        </p>
      </Definition>
      <Proof>
        <p>
          <M>{"E[X] = \\int_a^b x\\,dx/(b-a) = (b^2 - a^2)/(2(b-a)) = (a+b)/2"}</M>. For the variance, X − (a + b)/2 is
          uniform on [−h, h] with h = (b − a)/2, so the variance is <M>{"\\int_{-h}^{h}x^2\\,dx/(2h) = h^2/3 = (b-a)^2/12"}</M>.
        </p>
      </Proof>

      <Definition title="normal">
        <p>
          The standard normal Z has density <M>{"\\varphi(z) = e^{-z^2/2}/\\sqrt{2\\pi}"}</M> and CDF Φ. X ~ N(μ, σ²) means
          X = μ + σZ, with density
        </p>
        <MD>{"f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}\\exp\\Big(-\\frac{(x - \\mu)^2}{2\\sigma^2}\\Big)."}</MD>
      </Definition>
      <Theorem title="normal moments and standardising">
        <p>
          E[Z] = 0 and Var(Z) = 1, so N(μ, σ²) has mean μ and variance σ². For X ~ N(μ, σ²),{" "}
          <M>{"P(X \\le x) = \\Phi((x - \\mu)/\\sigma)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          φ integrates to 1 by the Gaussian integral, and it is even, so <M>{"E[Z] = 0"}</M> (the integral of z φ(z)
          converges absolutely). Since <M>{"\\varphi'(z) = -z\\varphi(z)"}</M>, integration by parts gives{" "}
          <M>{"E[Z^2] = \\int z\\cdot z\\varphi(z)\\,dz = [-z\\varphi(z)] + \\int\\varphi(z)\\,dz = 1"}</M>. Then X = μ + σZ has
          mean μ and variance σ², and <M>{"P(X \\le x) = P(Z \\le (x - \\mu)/\\sigma)"}</M> for σ &gt; 0.
        </p>
        <Code>{NORMAL}</Code>
      </Proof>

      <Theorem title="normal tails">
        <p>
          For t &gt; 0, <M>{"P(Z > t) \\le \\varphi(t)/t"}</M>, and the ratio of the two sides tends to 1 as t → ∞.
        </p>
      </Theorem>
      <Proof>
        <p>
          On <M>{"x \\ge t"}</M>, <M>{"1 \\le x/t"}</M>, so{" "}
          <M>{"P(Z > t) = \\int_t^\\infty \\varphi(x)\\,dx \\le \\int_t^\\infty \\frac{x}{t}\\varphi(x)\\,dx = \\frac{\\varphi(t)}{t}"}</M>,
          since <M>{"-\\varphi"}</M> is an antiderivative of <M>{"x\\varphi(x)"}</M>. The matching lower bound{" "}
          <M>{"(1/t - 1/t^3)\\varphi(t)"}</M> comes from one more integration by parts, and gives the limit.
        </p>
      </Proof>
      <p>
        The familiar rule: about 68%, 95% and 99.7% of a normal lies within 1, 2 and 3 standard deviations. At six, the
        two-sided tail is about <M>{"2 \\times 10^{-9}"}</M>. Real data with &ldquo;six-sigma events&rdquo; every few years
        are telling you they are not normal.
      </p>

      <Definition title="exponential">
        <p>
          X ~ Exponential(λ) has density <M>{"\\lambda e^{-\\lambda x}"}</M> for x ≥ 0, survival function{" "}
          <M>{"P(X > x) = e^{-\\lambda x}"}</M>, mean 1/λ and variance <M>{"1/\\lambda^2"}</M>.
        </p>
      </Definition>
      <Theorem title="memorylessness and minima">
        <p>
          (1) <M>{"P(X > s + t \\mid X > s) = P(X > t)"}</M> for all s, t ≥ 0. (2) If{" "}
          <M>{"X_i \\sim \\text{Exponential}(\\lambda_i)"}</M> are independent, then <M>{"\\min_i X_i"}</M> is Exponential
          with rate <M>{"\\sum_i \\lambda_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (1) <M>{"e^{-\\lambda(s+t)}/e^{-\\lambda s} = e^{-\\lambda t}"}</M>. (2) The minimum exceeds x exactly when every{" "}
          <M>{"X_i"}</M> does, so by independence its survival function is{" "}
          <M>{"\\prod_i e^{-\\lambda_i x} = e^{-(\\sum\\lambda_i)x}"}</M>.
        </p>
        <Code>{EXPO}</Code>
      </Proof>
      <Remark title="the only memoryless densities">
        <p>
          If G(t) = P(X &gt; t) satisfies G(s + t) = G(s)G(t) and is monotone, then G(t) = <M>{"G(1)^t"}</M> first for
          rational t and then for all t, which is exponential. So the puzzle&apos;s answer is another 1000 hours: under an
          exponential model, age carries no information. That is a strong claim, true for radioactive decay and false for
          most machines and people.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unifvar",
      rung: "check",
      prompt: <p>What is the variance of a Uniform(2, 8) random variable?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "iq",
      rung: "check",
      prompt: <p>X ~ N(100, 15²). What is P(X &gt; 130)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0228, tolerance: 0.0001 },
    },
    {
      key: "bulb",
      rung: "apply",
      prompt: <p>A bulb&apos;s lifetime is exponential with mean 1000 hours, and it has already lasted 2000 hours. What is its expected remaining lifetime?</p>,
      answer: { kind: "choice", options: ["1000 hours", "0 hours", "3000 hours", "500 hours"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def Phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def normal_prob(a, b, mu=0.0, sigma=1.0):
    return Phi((b - mu) / sigma) - Phi((a - mu) / sigma)

def mills_bound(t):
    return math.exp(-t * t / 2) / (t * math.sqrt(2 * math.pi))

print(round(Phi(0), 4), round(normal_prob(-1, 1), 4), round(normal_prob(-2, 2), 4))
print(round(normal_prob(90, 110, 100, 10), 4), round(1 - Phi(3), 5), round(mills_bound(3), 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.6827 0.9545\n0.6827 0.00135 0.00148",
          "0.5 0.6827 0.9545\n0.6827 0.00148 0.00135",
          "0.0 0.6827 0.9545\n0.6827 0.00135 0.00148",
          "0.5 0.6827 0.9973\n0.6827 0.00135 0.00148",
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

def survival_ratio(samples, s, t):
    alive = samples[samples > s]
    return float(np.mean(alive > s + t)), float(np.mean(samples > t))

def min_rate(rates, n, seed=0):
    rng = np.random.default_rng(seed)
    draws = rng.exponential(1 / np.asarray(rates), size=(n, len(rates)))
    return 1 / draws.min(axis=1).mean()

x = np.random.default_rng(1).exponential(2.0, size=2000000)
print([round(v, 2) for v in survival_ratio(x, 3.0, 1.0)], round(np.exp(-0.5), 2))
print(round(min_rate([1.0, 2.0, 3.0], 400000), 1))`}</Code>
          <p>What does this print? (The samples are many enough that sampling noise does not affect the rounded values.)</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.61, 0.61] 0.61\n6.0", "[0.14, 0.61] 0.61\n6.0", "[0.61, 0.61] 0.61\n2.0", "[0.61, 0.61] 0.61\n0.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>Phi(x)</C> using math.erf, <C>normal_prob(a, b, mu=0.0, sigma=1.0)</C> for P(a &lt; X &lt; b) with X ~ N(mu,
          sigma²), and <C>mills_bound(t)</C> = φ(t)/t.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def Phi(x):
    return 0.5

def normal_prob(a, b, mu=0.0, sigma=1.0):
    return 0.0

def mills_bound(t):
    return 1.0
`,
        solution: NORMAL,
        tests: [
          { name: "Phi", code: `assert Phi(0) == 0.5 and abs(Phi(1.959964) - 0.975) < 1e-6 and abs(Phi(-1) + Phi(1) - 1) < 1e-12
assert abs(normal_prob(-1, 1) - 0.682689) < 1e-6 and abs(normal_prob(90, 110, 100, 10) - 0.682689) < 1e-6
assert abs(normal_prob(130, math.inf, 100, 15) - 0.02275) < 1e-5` },
          { name: "tails", code: `for t in (1.0, 2.0, 3.0, 5.0):
    assert 1 - Phi(t) <= mills_bound(t)
assert abs(mills_bound(5.0) / (1 - Phi(5.0)) - 1) < 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>survival_ratio(samples, s, t)</C>, returning the empirical (P(X &gt; s + t | X &gt; s), P(X &gt; t)) as floats,
          and <C>min_rate(rates, n, seed=0)</C>, which draws n rows of independent exponentials with the given rates and
          returns 1 / (sample mean of the row minima).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def survival_ratio(samples, s, t):
    return 0.0, 0.0

def min_rate(rates, n, seed=0):
    return 0.0
`,
        solution: EXPO,
        tests: [
          { name: "memoryless", code: `x = np.random.default_rng(5).exponential(1.0, size=1000000)
a, b = survival_ratio(x, 2.0, 0.5)
assert isinstance(a, float) and abs(a - b) < 0.01 and abs(b - np.exp(-0.5)) < 0.005
u = np.random.default_rng(6).random(1000000)
a, b = survival_ratio(u, 0.5, 0.25)
assert abs(a - 0.5) < 0.01 and abs(b - 0.75) < 0.01` },
          { name: "minimum", code: `assert abs(min_rate([1.0, 2.0, 3.0], 400000) - 6.0) < 0.1
assert abs(min_rate([0.5], 400000, seed=3) - 0.5) < 0.01` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for the standard normal Z and any t &gt; 0, <M>{"P(Z > t) \\le \\frac{1}{t\\sqrt{2\\pi}}e^{-t^2/2}"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes P(Z > t) = ∫ from t to ∞ of φ(x) dx with φ(x) = e^(−x²/2)/√(2π).",
          "Uses x/t ≥ 1 on the range of integration to bound the integrand by (x/t)φ(x).",
          "Evaluates ∫ from t to ∞ of xφ(x) dx = φ(t) (antiderivative −φ), giving φ(t)/t.",
        ],
      },
    },
    {
      key: "series",
      rung: "stretch",
      prompt: (
        <p>
          Three independent components have exponential lifetimes with means 1, 2 and 4 years. A system fails as soon as any one
          fails. What is the expected lifetime of the system, in years? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5714, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the uniform, normal and exponential distributions, why standardising reduces every normal to Φ, how fast normal tails fall off, and why the exponential is memoryless.",

  glimpse: (
    <>
      <p>
        Computers produce uniform numbers; every other distribution here is made from them. The next lesson shows the
        general recipe, the inverse CDF, and why applying a variable&apos;s own CDF to it gives a uniform. The normal returns
        in many dimensions as the multivariate normal, and as the universal limit in the central limit theorem.
      </p>
    </>
  ),
};
