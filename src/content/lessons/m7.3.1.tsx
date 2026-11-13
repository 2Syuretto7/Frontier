import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DensityHistViz } from "@/components/viz/DensityHistViz";
import type { LessonContent } from "@/lib/types";

const INTEG = `import numpy as np

def integrate(f, a, b, n=100000):
    h = (b - a) / n
    x = a + h * (np.arange(n) + 0.5)
    return float(np.sum(f(x)) * h)

def moments(f, a, b):
    mass = integrate(f, a, b)
    mean = integrate(lambda x: x * f(x), a, b)
    var = integrate(lambda x: (x - mean) ** 2 * f(x), a, b)
    return mass, mean, var`;

const HIST = `import numpy as np

def hist_density(samples, lo, hi, bins):
    counts, edges = np.histogram(samples, bins=bins, range=(lo, hi))
    width = (hi - lo) / bins
    return counts / (len(samples) * width)

def ecdf(samples, x):
    s = np.sort(samples)
    return np.searchsorted(s, x, side='right') / len(s)`;

export const lesson: LessonContent = {
  id: "m7.3.1",
  minutes: 60,
  links: {
    requires: ["m7.2.4", "m2.6.2"],
    revisits: ["m1.8.4", "m0.8.2"],
    foreshadows: ["m7.3.2", "m7.3.4", "m7.7.3"],
  },

  puzzle: (
    <>
      <p>
        Pick a number U uniformly from [0, 1] and square it. Every individual value of U², say exactly 0.25, has probability
        zero. Yet U² is clearly more likely to be small than large. How do you describe its distribution, and how can a
        &ldquo;probability density&rdquo; be larger than 1, or even infinite?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For continuous quantities probability is spread like mass along a line rather than sitting on points. The density
        is mass per unit length: probability of a short interval divided by its length. Areas under the density are
        probabilities, so the density can be tall where the mass is concentrated, as long as the total area is 1. A histogram
        of samples, scaled to area 1, is a rough picture of it.
      </p>
      <DensityHistViz />
    </>
  ),

  theory: (
    <>
      <Definition title="density">
        <p>
          A random variable X is continuous with density f if f ≥ 0, <M>{"\\int_{-\\infty}^{\\infty}f(x)\\,dx = 1"}</M>, and
          for all a ≤ b,
        </p>
        <MD>{"P(a \\le X \\le b) = \\int_a^b f(x)\\,dx."}</MD>
      </Definition>

      <Theorem title="density and CDF">
        <p>
          If X has density f, its CDF <M>{"F(x) = \\int_{-\\infty}^{x}f(t)\\,dt"}</M> is continuous, P(X = x) = 0 for every x,
          and F′(x) = f(x) at every point where f is continuous. Conversely, if F is continuous and is the integral of its
          derivative, then F′ is a density for X.
        </p>
      </Theorem>
      <Proof>
        <p>
          For h &gt; 0, <M>{"P(X = x) \\le P(x - h \\le X \\le x) = \\int_{x-h}^{x}f"}</M>, which tends to 0 as h → 0, so
          there are no jumps and F is continuous. At a continuity point of f the fundamental theorem of calculus gives
          F′ = f. The converse is the definition read backwards:{" "}
          <M>{"P(a < X \\le b) = F(b) - F(a) = \\int_a^b F'"}</M>.
        </p>
      </Proof>

      <Remark title="a density is not a probability">
        <p>
          <M>{"f(x)\\,\\Delta x \\approx P(x \\le X \\le x + \\Delta x)"}</M> for small Δx: the density carries units of
          &ldquo;probability per unit of x&rdquo;. Changing f at finitely many points changes no probability, so a density is
          only determined up to such changes. It may exceed 1, and may be unbounded, as long as its integral is 1.
        </p>
      </Remark>

      <Example title="the puzzle">
        <p>
          For 0 ≤ x ≤ 1, <M>{"F(x) = P(U^2 \\le x) = P(U \\le \\sqrt x) = \\sqrt x"}</M>, so{" "}
          <M>{"f(x) = 1/(2\\sqrt x)"}</M>, which blows up at 0 and has area 1.
        </p>
      </Example>

      <Definition title="expectation">
        <p>
          <M>{"E[X] = \\int x f(x)\\,dx"}</M> when <M>{"\\int |x|f(x)\\,dx < \\infty"}</M>, and, by the continuous law of the
          unconscious statistician, <M>{"E[g(X)] = \\int g(x)f(x)\\,dx"}</M>. Linearity, monotonicity and every variance rule
          of the discrete case carry over with sums replaced by integrals.
        </p>
        <Code>{INTEG}</Code>
      </Definition>

      <Example title="two routes to one mean">
        <p>
          With X = U², <M>{"E[X] = \\int_0^1 x\\cdot\\frac{1}{2\\sqrt x}\\,dx = \\int_0^1\\tfrac12\\sqrt x\\,dx = \\tfrac13"}</M>.
          By the law of the unconscious statistician, without finding the density at all,{" "}
          <M>{"E[U^2] = \\int_0^1 u^2\\,du = \\tfrac13"}</M>. The second route is usually the easier one.
        </p>
      </Example>

      <Example title="no mean at all">
        <p>
          The Cauchy density <M>{"f(x) = \\frac{1}{\\pi(1 + x^2)}"}</M> is a perfectly good density, but{" "}
          <M>{"\\int |x|f(x)\\,dx"}</M> diverges like <M>{"\\int dx/x"}</M>, so it has no expectation. Averages of Cauchy
          samples never settle down, which is a warning for heavy-tailed data.
        </p>
      </Example>

      <Remark title="neither discrete nor continuous">
        <p>
          ReLU(Z), for Z with a symmetric density, is 0 with probability 1/2 and spread by a density over (0, ∞) otherwise: a
          mixture of an atom and a density. The CDF handles every case at once, which is why it is the primary description.
          From data, the empirical CDF (the fraction of samples at most x) and the density-scaled histogram estimate F and f.
        </p>
        <Code>{HIST}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "const",
      rung: "check",
      prompt: <p>f(x) = c x² on [0, 2] and 0 elsewhere is a density. What is c?</p>,
      answer: { kind: "numeric", value: 0.375, tolerance: 0.0001 },
    },
    {
      key: "half",
      rung: "check",
      prompt: <p>X has density 2x on [0, 1]. What is P(X ≤ 0.5)?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "relu",
      rung: "apply",
      prompt: <p>Z has the standard normal density. Which describes the distribution of ReLU(Z) = max(Z, 0)?</p>,
      answer: {
        kind: "choice",
        options: [
          "An atom of probability 1/2 at 0, plus a density on (0, ∞) carrying the other 1/2.",
          "It has a density, because Z does.",
          "It is discrete.",
          "P(ReLU(Z) = 0) = 0, because Z is continuous.",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def integrate(f, a, b, n=100000):
    h = (b - a) / n
    x = a + h * (np.arange(n) + 0.5)
    return float(np.sum(f(x)) * h)

def moments(f, a, b):
    mass = integrate(f, a, b)
    mean = integrate(lambda x: x * f(x), a, b)
    var = integrate(lambda x: (x - mean) ** 2 * f(x), a, b)
    return mass, mean, var

tri = lambda x: np.where(x < 1, x, 2 - x)
print([round(v, 4) for v in moments(tri, 0, 2)])
print([round(v, 3) for v in moments(lambda x: 1 / (2 * np.sqrt(x)), 0, 1)])
print(round(integrate(lambda x: 3 * x ** 2, 0, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, 0.1667]\n[0.999, 0.333, 0.089]\n0.125",
          "[1.0, 1.0, 0.3333]\n[0.999, 0.333, 0.089]\n0.125",
          "[1.0, 1.0, 0.1667]\n[0.999, 0.5, 0.083]\n0.125",
          "[1.0, 1.0, 0.1667]\n[0.999, 0.333, 0.089]\n0.375",
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

def hist_density(samples, lo, hi, bins):
    counts, edges = np.histogram(samples, bins=bins, range=(lo, hi))
    width = (hi - lo) / bins
    return counts / (len(samples) * width)

def ecdf(samples, x):
    s = np.sort(samples)
    return np.searchsorted(s, x, side='right') / len(s)

u = np.random.default_rng(0).random(200000)
print(np.round(hist_density(u ** 2, 0, 1, 4), 2))
print(ecdf(np.array([3.0, 1.0, 2.0, 2.0]), np.array([0.5, 1.0, 2.0, 2.5, 3.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.01 0.82 0.64 0.53]\n[0.   0.25 0.75 0.75 1.  ]",
          "[0.5  0.21 0.16 0.13]\n[0.   0.25 0.75 0.75 1.  ]",
          "[1. 1. 1. 1.]\n[0.   0.25 0.75 0.75 1.  ]",
          "[2.01 0.82 0.64 0.53]\n[0.   0.   0.25 0.75 0.75]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>integrate(f, a, b, n=100000)</C>, the midpoint rule for a vectorised f, and <C>moments(f, a, b)</C>,
          returning (total mass, mean, variance) of a density supported on [a, b].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def integrate(f, a, b, n=100000):
    return 0.0

def moments(f, a, b):
    return 0.0, 0.0, 0.0
`,
        solution: INTEG,
        tests: [
          { name: "integrals", code: `assert abs(integrate(lambda x: 3 * x ** 2, 0, 1) - 1) < 1e-8
assert abs(integrate(np.sin, 0, np.pi) - 2) < 1e-8 and isinstance(integrate(np.cos, 0, 1), float)` },
          { name: "moments", code: `m, mu, v = moments(lambda x: np.ones_like(x) / 4, 1, 5)
assert abs(m - 1) < 1e-9 and abs(mu - 3) < 1e-9 and abs(v - 16 / 12) < 1e-7
m, mu, v = moments(lambda x: 6 * x * (1 - x), 0, 1)
assert abs(mu - 0.5) < 1e-9 and abs(v - 0.05) < 1e-8
m, mu, v = moments(lambda x: 2 * np.exp(-2 * x), 0, 40)
assert abs(mu - 0.5) < 1e-6 and abs(v - 0.25) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hist_density(samples, lo, hi, bins)</C>, histogram heights scaled so the bars have total area 1 (relative
          to all samples), and <C>ecdf(samples, x)</C>, the fraction of samples less than or equal to each x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hist_density(samples, lo, hi, bins):
    return np.zeros(bins)

def ecdf(samples, x):
    return np.zeros(len(x))
`,
        solution: HIST,
        tests: [
          { name: "histogram", code: `h = hist_density(np.array([0.1, 0.2, 0.6, 0.9]), 0, 1, 2)
assert np.allclose(h, [1.0, 1.0])
u = np.random.default_rng(3).random(400000)
h = hist_density(u + u[::-1], 0, 2, 4)
assert np.allclose(h, [0.25, 0.75, 0.75, 0.25], atol=0.02) and abs(np.sum(h) * 0.5 - 1) < 1e-9` },
          { name: "ecdf", code: `s = np.array([3.0, 1.0, 2.0, 2.0])
assert np.allclose(ecdf(s, np.array([0.5, 1.0, 2.0, 2.5, 3.0])), [0, 0.25, 0.75, 0.75, 1])
u = np.random.default_rng(4).random(100000)
assert np.allclose(ecdf(u ** 2, np.array([0.25, 0.49])), [0.5, 0.7], atol=0.01)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if X has a density f, then P(X = x) = 0 for every real x, and hence its CDF is continuous.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Bounds P(X = x) ≤ P(x − h ≤ X ≤ x) = ∫ from x − h to x of f, for every h > 0.",
          "Argues the integral tends to 0 as h → 0 (for example, continuity of the integral, or dominated/monotone convergence, or continuity of probability along decreasing events).",
          "Concludes P(X = x) = 0, and since the jump of F at x equals P(X = x), F has no jumps; being right-continuous, it is continuous.",
        ],
      },
    },
    {
      key: "beta",
      rung: "stretch",
      prompt: <p>X has density 6x(1 − x) on [0, 1]. What is P(1/4 &lt; X &lt; 3/4)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6875, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a probability density is, why it can exceed 1, how it relates to the CDF, and why the law of the unconscious statistician often lets you skip finding a density altogether.",

  glimpse: (
    <>
      <p>
        Three densities do most of the work in practice: the uniform, the normal and the exponential, the subject of the next
        lesson. After that come two tools for building new distributions from old ones: feeding a uniform through an inverse
        CDF, and the change-of-variables formula that turned the uniform into 1/(2√x) here.
      </p>
    </>
  ),
};
