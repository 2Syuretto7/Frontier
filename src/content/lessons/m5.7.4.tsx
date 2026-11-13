import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HighDimViz } from "@/components/viz/HighDimViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.7.4",
  minutes: 60,
  links: {
    requires: ["m5.7.1", "m5.7.3"],
    revisits: ["m5.1.1"],
    foreshadows: ["m13.2.1"],
  },

  puzzle: (
    <>
      <p>
        An expected loss over images is an integral over a space with a million dimensions. A grid with just two points per
        axis would need <M>{"2^{1000000}"}</M> evaluations.
      </p>
      <p>Yet averaging the loss over a few thousand random images estimates it well. How can so few samples be enough?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write the integral as an expectation, <M>{"\\int f\\,p = E[f(X)]"}</M>, and estimate it by the average of f at random
        samples. By the central limit theorem the error is about <M>{"\\sigma/\\sqrt N"}</M>: it depends on the spread of f,
        not on the dimension. Grids, by contrast, must fill space, and space grows exponentially.
      </p>
      <HighDimViz />
      <p>
        High dimensions are also strange: almost all of a ball&rsquo;s volume lies near its surface, and the ball fills almost
        none of its bounding cube. Intuitions from two and three dimensions mislead, and integration methods must not rely on
        them.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="Monte Carlo integration">
        <p>
          To estimate <M>{"I = E[f(X)] = \\int f(x) p(x)\\,dx"}</M>, draw independent <M>{"X_1, \\dots, X_N \\sim p"}</M> and
          form <M>{"\\hat I_N = \\frac1N \\sum_{k=1}^N f(X_k)"}</M>. For an integral over a box B of volume |B|, take p uniform
          on B and multiply by |B|.
        </p>
      </Definition>

      <Theorem title="unbiased, with error 1/√N">
        <p>
          If <M>{"\\sigma^2 = \\mathrm{Var}\\, f(X) < \\infty"}</M>, then <M>{"E[\\hat I_N] = I"}</M> and{" "}
          <M>{"\\mathrm{Var}\\,\\hat I_N = \\sigma^2 / N"}</M>. So the typical error is <M>{"\\sigma/\\sqrt N"}</M>, and by
          Chebyshev <M>{"P(|\\hat I_N - I| \\ge t) \\le \\sigma^2/(N t^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Linearity of expectation gives <M>{"E[\\hat I_N] = \\frac1N \\sum E f(X_k) = I"}</M>. The terms are independent, so
          variances add: <M>{"\\mathrm{Var}\\,\\hat I_N = \\frac{1}{N^2} \\cdot N\\sigma^2"}</M>. Chebyshev&rsquo;s inequality
          gives the tail bound. Nothing here mentions the dimension of x.
        </p>
      </Proof>

      <Theorem title="the curse of dimensionality for grids">
        <p>
          A product midpoint rule with m points per axis in d dimensions uses <M>{"N = m^d"}</M> points and, for smooth f, has
          error of order <M>{"m^{-2} = N^{-2/d}"}</M>. To reach error ε it needs about <M>{"\\varepsilon^{-d/2}"}</M> points.
        </p>
      </Theorem>
      <Proof>
        <p>
          (Sketch.) Applying the one-dimensional midpoint rule along each axis in turn, by Fubini, adds one error of order{" "}
          <M>{"m^{-2}"}</M> per axis, d of them in all. Solve <M>{"N^{-2/d} = \\varepsilon"}</M> for N.
        </p>
      </Proof>

      <Example title="volumes in high dimensions">
        <p>The unit ball in <M>{"\\mathbb R^d"}</M> has volume</p>
        <MD>{"V_d = \\frac{\\pi^{d/2}}{\\Gamma(d/2 + 1)},"}</MD>
        <p>
          which is 2, π, 4π/3, … , peaks at d = 5 and then tends to 0. Its share of the cube <M>{"[-1, 1]^d"}</M> is{" "}
          <M>{"V_d / 2^d"}</M>, below one in a million by d = 20. By scaling, the ball of radius 0.9 has volume{" "}
          <M>{"0.9^d V_d"}</M>, so the fraction in the outer shell is <M>{"1 - 0.9^d"}</M>, over 99% by d = 50.
        </p>
      </Example>

      <Remark title="variance is the enemy">
        <p>
          Monte Carlo escapes dimension but not variance. Estimating a tiny probability, such as the ball&rsquo;s share in d =
          20, needs samples that land in the rare region. Importance sampling draws from a different q and reweights by p/q;
          control variates subtract something with known mean. Minibatch gradients in deep learning are Monte Carlo estimates
          of the full gradient, which is why they work and why their noise shrinks only like <M>{"1/\\sqrt B"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: <p>How does the typical error of a Monte Carlo estimate with N samples scale?</p>,
      answer: { kind: "choice", options: ["Like 1/√N, independent of dimension", "Like 1/N", "Like N^(−2/d)", "Like 1/N²"], correct: [0] },
    },
    {
      key: "grid",
      rung: "check",
      prompt: <p>How many points does a grid with 10 points per axis need in 6 dimensions?</p>,
      answer: { kind: "numeric", value: 1000000 },
    },
    {
      key: "halve",
      rung: "apply",
      prompt: <p>By what factor must N grow to halve the error of a Monte Carlo estimate?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "shell",
      rung: "apply",
      prompt: (
        <p>
          What fraction of the volume of the unit ball in <M>{"\\mathbb R^{10}"}</M> lies inside radius 0.9? Give four decimal
          places.
        </p>
      ),
      answer: { kind: "numeric", value: Math.pow(0.9, 10), tolerance: 1e-4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
rng = np.random.default_rng(0)
for d in (1, 10, 100):
    X = rng.random((100000, d))
    vals = (X ** 2).sum(axis=1) / d
    print(d, round(vals.mean(), 2), round(vals.std() / np.sqrt(len(vals)), 4))`}</Code>
          <p>
            Monte Carlo for the average of <M>{"\\frac1d\\sum_i x_i^2"}</M> over <M>{"[0, 1]^d"}</M>, whose exact value is 1/3.
            Which output matches, to the digits shown?
          </p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1 0.33 0.0009\n10 0.33 0.0003\n100 0.33 0.0001", "1 0.33 0.0009\n10 0.33 0.0009\n100 0.33 0.0009", "1 0.33 0.0009\n10 0.1 0.0003\n100 0.01 0.0001", "1 0.5 0.0009\n10 0.5 0.0003\n100 0.5 0.0001"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
V = lambda d: math.pi ** (d / 2) / math.gamma(d / 2 + 1)
print([round(V(d), 2) for d in (1, 2, 3, 5, 10, 20)])`}</Code>
          <p>Volumes of unit balls. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 3.14, 4.19, 5.26, 2.55, 0.03]",
          "[2.0, 3.14, 4.19, 5.26, 8.12, 20.0]",
          "[1.0, 3.14, 4.19, 5.26, 2.55, 0.03]",
          "[2.0, 3.14, 4.19, 4.93, 2.55, 0.03]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mc_integrate(f, d, N, seed=0)</C>, which estimates <M>{"\\int_{[0,1]^d} f"}</M> from N uniform samples drawn as{" "}
          <C>np.random.default_rng(seed).random((N, d))</C>, where f maps an (N, d) array to N values. Return the pair (estimate,
          standard error <M>{"s/\\sqrt N"}</M>, with s the sample standard deviation).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mc_integrate(f, d, N, seed=0):
    return 0.0, 0.0
`,
        solution: `import numpy as np

def mc_integrate(f, d, N, seed=0):
    X = np.random.default_rng(seed).random((N, d))
    v = np.asarray(f(X), float)
    return float(v.mean()), float(v.std() / np.sqrt(N))
`,
        tests: [
          { name: "accuracy", code: `import numpy as np
f = lambda X: np.exp(-np.sum(X ** 2, axis=1))
exact = (0.5 * np.sqrt(np.pi) * 0.8427007929497149) ** 8
est, se = mc_integrate(f, 8, 200000)
assert abs(est - exact) < 4 * se and se < 1e-3, (est, exact, se)` },
          { name: "error shrinks like 1/sqrt(N)", code: `import numpy as np
f = lambda X: X.sum(axis=1)
_, s1 = mc_integrate(f, 50, 10000, seed=1)
_, s2 = mc_integrate(f, 50, 40000, seed=2)
assert 1.8 < s1 / s2 < 2.2, s1 / s2
e, _ = mc_integrate(f, 50, 40000, seed=3)
assert abs(e - 25) < 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ball_volume(d)</C>, the exact volume of the unit ball in <M>{"\\mathbb R^d"}</M> using <C>math.gamma</C>, and{" "}
          <C>mc_ball_volume(d, N, seed=0)</C>, a Monte Carlo estimate: the fraction of N uniform points in{" "}
          <M>{"[-1, 1]^d"}</M> that land in the ball, times <M>{"2^d"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import numpy as np

def ball_volume(d):
    return 0.0

def mc_ball_volume(d, N, seed=0):
    return 0.0
`,
        solution: `import math
import numpy as np

def ball_volume(d):
    return math.pi ** (d / 2) / math.gamma(d / 2 + 1)

def mc_ball_volume(d, N, seed=0):
    X = 2 * np.random.default_rng(seed).random((N, d)) - 1
    inside = (X ** 2).sum(axis=1) <= 1
    return float(inside.mean() * 2 ** d)
`,
        tests: [
          { name: "exact volumes", code: `import math
assert abs(ball_volume(2) - math.pi) < 1e-12 and abs(ball_volume(3) - 4 * math.pi / 3) < 1e-12
assert max(range(1, 30), key=ball_volume) == 5, 'The volume peaks at d = 5.'` },
          { name: "Monte Carlo", code: `import math
assert abs(mc_ball_volume(3, 200000) - 4 * math.pi / 3) < 0.03
assert abs(mc_ball_volume(6, 400000) - ball_volume(6)) < 0.1
assert mc_ball_volume(25, 100000) < 0.01, 'In 25 dimensions almost no point lands in the ball.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the Monte Carlo estimator <M>{"\\hat I_N"}</M> is unbiased with variance <M>{"\\sigma^2/N"}</M>, and use
          Chebyshev&rsquo;s inequality to bound <M>{"P(|\\hat I_N - I| \\ge t)"}</M>. Point out where the dimension would enter,
          and why it does not.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses linearity of expectation: E[Î_N] = (1/N) Σ E f(X_k) = I.",
          "Uses independence so variances add: Var(Î_N) = (1/N²) · N σ² = σ²/N.",
          "Applies Chebyshev: P(|Î_N − I| ≥ t) ≤ σ²/(N t²).",
          "Notes the dimension enters only through σ², the variance of f(X), not through N or the rate.",
        ],
      },
    },
    {
      key: "v5",
      rung: "stretch",
      prompt: <p>What is the volume of the unit ball in <M>{"\\mathbb R^5"}</M>? Give three decimal places.</p>,
      answer: { kind: "numeric", value: (8 * Math.PI * Math.PI) / 15, tolerance: 1e-3 },
    },
  ],

  teachBack:
    "Explain to a friend why grids fail for integrals in many dimensions while random sampling does not, and what the strange geometry of high-dimensional balls says about intuition.",

  glimpse: (
    <p>
      That completes multivariable and matrix calculus. Its tools, gradients, Jacobians, Hessians and change of variables,
      return in every later course on optimisation, probability and learning.
    </p>
  ),
};
