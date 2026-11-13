import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeqUpdateViz } from "@/components/viz/SeqUpdateViz";
import type { LessonContent } from "@/lib/types";

const GRID = `import math

def grid_post(prior, loglik, grid):
    w = [prior(t) * math.exp(loglik(t)) for t in grid]
    z = sum(w)
    return [v / z for v in w]

def summarise(grid, post, level=0.9):
    mean = sum(t * p for t, p in zip(grid, post))
    cum, lo, hi = 0.0, None, None
    for t, p in zip(grid, post):
        cum += p
        if lo is None and cum >= (1 - level) / 2:
            lo = t
        if hi is None and cum >= (1 + level) / 2:
            hi = t
    return round(mean, 3), lo, hi`;

const SEQ = `import numpy as np

def update(post, grid, x, sigma=1.0):
    w = post * np.exp(-0.5 * ((x - grid) / sigma) ** 2)
    return w / w.sum()

def posterior_stats(xs, grid, prior):
    post = prior / prior.sum()
    for x in xs:
        post = update(post, grid, x)
    m = float((grid * post).sum())
    return round(m, 2), round(float(np.sqrt(((grid - m) ** 2 * post).sum())), 3)`;

export const lesson: LessonContent = {
  id: "m9.7.1",
  minutes: 55,
  links: {
    requires: ["m9.2.3", "m7.5.1"],
    revisits: ["m7.1.4", "m9.5.1"],
    foreshadows: ["m9.7.2", "m9.7.3", "m9.7.5"],
  },

  puzzle: (
    <>
      <p>
        An estimator gives one number; a confidence interval gives a range with a guarantee about the procedure. But often
        the question is direct: given these results, how probable is it that the new method is better than the old one by
        at least one point? Only a probability distribution over the unknown itself can answer that, and building one
        requires saying what you believed before the data.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The posterior is the prior reweighted by how well each parameter value predicted the data. It is a complete
        description of what is known, from which any summary can be read. With little data the prior matters; with much
        data the likelihood dominates and reasonable priors agree.
      </p>
      <SeqUpdateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="posterior, evidence and credible sets">
        <p>
          With prior π and likelihood <M>{"p(x \\mid \\theta)"}</M>, the posterior and the evidence (marginal likelihood) are
        </p>
        <MD>{"\\pi(\\theta \\mid x) = \\frac{p(x \\mid \\theta)\\,\\pi(\\theta)}{p(x)}, \\qquad p(x) = \\int p(x \\mid \\theta)\\,\\pi(\\theta)\\,d\\theta."}</MD>
        <p>
          A set C with <M>{"P(\\theta \\in C \\mid x) = 1 - \\alpha"}</M> is a 1 − α credible set. The equal-tailed interval
          cuts α/2 of posterior mass from each side.
        </p>
      </Definition>

      <Example title="computing on a grid">
        <p>
          For one or two parameters, evaluate prior times likelihood on a grid and normalise. For a coin with 7 heads and 3
          tails, a flat prior gives posterior mean 0.667 and 90% credible interval about [0.44, 0.86]; a prior favouring
          fairness, proportional to θ²(1 − θ)², pulls the mean to 0.625 and narrows the interval.
        </p>
        <Code>{GRID}</Code>
      </Example>

      <Theorem title="sequential updating">
        <p>
          If x₁ and x₂ are conditionally independent given θ, then updating the prior with x₁ and then using that posterior
          as the prior for x₂ gives the same result as updating once with both.
        </p>
      </Theorem>
      <Proof>
        <p>
          By conditional independence <M>{"p(x_1, x_2 \\mid \\theta) = p(x_1 \\mid \\theta)p(x_2 \\mid \\theta)"}</M>, so{" "}
          <M>{"\\pi(\\theta \\mid x_1, x_2) \\propto p(x_2 \\mid \\theta)\\,\\big[p(x_1 \\mid \\theta)\\pi(\\theta)\\big] \\propto p(x_2 \\mid \\theta)\\,\\pi(\\theta \\mid x_1)"}</M>.
          Both sides are densities in θ, so the proportionality constants agree after normalising.
        </p>
      </Proof>

      <Example title="priors wash out">
        <p>
          The code updates one observation at a time for a normal mean, comparing a sharply peaked Laplace prior at 0 with a
          flat one. After 5 observations they disagree badly; after 500 they coincide, with posterior standard deviation
          close to <M>{"1/\\sqrt n"}</M>.
        </p>
        <Code>{SEQ}</Code>
      </Example>

      <Theorem title="Bernstein-von Mises (informal)">
        <p>
          For a regular parametric model and a prior with positive continuous density at the true θ₀, the posterior is
          approximately <M>{"N(\\hat\\theta, 1/(nI(\\theta_0)))"}</M> for large n, in total variation. Consequently 95% credible
          intervals are approximately 95% confidence intervals.
        </p>
      </Theorem>

      <Remark title="choosing priors">
        <p>
          A prior that puts zero mass on a region keeps the posterior at zero there whatever the data say, so never rule out
          what you cannot rule out. Weakly informative priors encode scale, such as &quot;an accuracy gain above 20 points is
          implausible&quot;, without strong claims. Flat priors can be improper (not integrable) and still give a proper
          posterior, but they are not invariant to reparametrisation; Jeffreys&apos; prior, proportional to √I(θ), is. In
          high dimensions, as in neural networks, the prior matters even with lots of data.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "two",
      rung: "check",
      prompt: <p>θ is 1 or 2 with prior probability 1/2 each. The observed data have likelihood 0.2 under θ = 1 and 0.6 under θ = 2. What is the posterior probability that θ = 2?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "mean",
      rung: "check",
      prompt: <p>With a flat prior on a coin&apos;s bias and 7 heads in 10 flips, what is the posterior mean? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>A prior gives probability 0 to all θ &gt; 0.9. After observing 1000 successes in 1000 trials, what is the posterior probability that θ &gt; 0.9?</p>,
      answer: { kind: "choice", options: ["0", "About 1", "About 0.5", "It cannot be computed"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def grid_post(prior, loglik, grid):
    w = [prior(t) * math.exp(loglik(t)) for t in grid]
    z = sum(w)
    return [v / z for v in w]

def summarise(grid, post, level=0.9):
    mean = sum(t * p for t, p in zip(grid, post))
    cum, lo, hi = 0.0, None, None
    for t, p in zip(grid, post):
        cum += p
        if lo is None and cum >= (1 - level) / 2:
            lo = t
        if hi is None and cum >= (1 + level) / 2:
            hi = t
    return round(mean, 3), lo, hi

grid = [(i + 0.5) / 100 for i in range(100)]
post = grid_post(lambda t: 1.0, lambda t: 7 * math.log(t) + 3 * math.log(1 - t), grid)
print(summarise(grid, post))
post = grid_post(lambda t: t * t * (1 - t) ** 2 * 30, lambda t: 7 * math.log(t) + 3 * math.log(1 - t), grid)
print(summarise(grid, post))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(0.667, 0.435, 0.865)\n(0.625, 0.425, 0.805)", "(0.7, 0.435, 0.865)\n(0.625, 0.425, 0.805)", "(0.667, 0.435, 0.865)\n(0.667, 0.425, 0.805)", "(0.625, 0.425, 0.805)\n(0.667, 0.435, 0.865)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def update(post, grid, x, sigma=1.0):
    w = post * np.exp(-0.5 * ((x - grid) / sigma) ** 2)
    return w / w.sum()

def posterior_stats(xs, grid, prior):
    post = prior / prior.sum()
    for x in xs:
        post = update(post, grid, x)
    m = float((grid * post).sum())
    return round(m, 2), round(float(np.sqrt(((grid - m) ** 2 * post).sum())), 3)

g = np.linspace(-6, 6, 2401)
xs = np.random.default_rng(0).normal(2.0, 1.0, size=500)
for n in (5, 50, 500):
    print(n, posterior_stats(xs[:n], g, np.exp(-4 * np.abs(g))), posterior_stats(xs[:n], g, np.ones_like(g)))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["5 (1.24, 0.444) (2.04, 0.447)\n50 (2.05, 0.141) (2.13, 0.141)\n500 (1.97, 0.045) (1.97, 0.045)", "5 (2.04, 0.447) (2.04, 0.447)\n50 (2.13, 0.141) (2.13, 0.141)\n500 (1.97, 0.045) (1.97, 0.045)", "5 (1.24, 0.444) (2.04, 0.447)\n50 (2.05, 0.141) (2.13, 0.141)\n500 (1.24, 0.045) (1.97, 0.045)", "5 (1.24, 1.0) (2.04, 1.0)\n50 (2.05, 1.0) (2.13, 1.0)\n500 (1.97, 1.0) (1.97, 1.0)"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grid_post(prior, loglik, grid)</C>, returning normalised posterior weights on the grid, and{" "}
          <C>summarise(grid, post, level=0.9)</C>, returning the posterior mean rounded to 3 places and the first grid points
          at which the cumulative mass reaches (1 − level)/2 and (1 + level)/2.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def grid_post(prior, loglik, grid):
    return [1 / len(grid)] * len(grid)

def summarise(grid, post, level=0.9):
    return 0.0, None, None
`,
        solution: GRID,
        tests: [
          { name: "post", code: `p = grid_post(lambda t: 1.0, lambda t: 0.0, [1, 2, 3, 4])
assert all(abs(v - 0.25) < 1e-12 for v in p)
p = grid_post(lambda t: 1.0 if t > 1 else 3.0, lambda t: 0.0, [1, 2])
assert abs(p[0] - 0.75) < 1e-12` },
          { name: "summary", code: `g = [0, 1, 2, 3, 4]
assert summarise(g, [0.2] * 5, 0.6) == (2.0, 0, 3)
assert summarise(g, [0, 0, 1, 0, 0]) == (2, 2, 2)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>update(post, grid, x, sigma=1.0)</C>, multiplying grid weights by the N(θ, σ²) likelihood of one
          observation x and renormalising, and <C>posterior_stats(xs, grid, prior)</C>, which applies update for each x and
          returns the posterior mean (2 places) and standard deviation (3 places).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def update(post, grid, x, sigma=1.0):
    return post

def posterior_stats(xs, grid, prior):
    return 0.0, 0.0
`,
        solution: SEQ,
        tests: [
          { name: "update", code: `import numpy as np
g = np.linspace(-5, 5, 2001)
p = update(np.ones_like(g) / len(g), g, 1.0)
assert abs((g * p).sum() - 1) < 1e-3 and abs(p.sum() - 1) < 1e-12` },
          { name: "stats", code: `import numpy as np
g = np.linspace(-8, 8, 3201)
m, s = posterior_stats([1.0, 2.0, 3.0, 2.0], g, np.ones_like(g))
assert m == 2.0 and abs(s - 0.5) < 2e-3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Assuming x₁ and x₂ are conditionally independent given θ, prove that updating sequentially (first with x₁, then with x₂) gives the same posterior as updating once with (x₁, x₂).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the batch posterior as proportional to p(x₁, x₂ | θ)π(θ) and factorises the likelihood by conditional independence.",
          "Recognises p(x₁ | θ)π(θ) as proportional to π(θ | x₁), so the batch posterior is proportional to p(x₂ | θ)π(θ | x₁), the sequential posterior.",
          "Argues the normalising constants must agree because both are probability densities in θ.",
        ],
      },
    },
    {
      key: "gt",
      rung: "stretch",
      prompt: <p>With a uniform prior on a coin&apos;s bias θ and one head in one flip, what is the posterior probability that θ &gt; 0.5?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a posterior is formed from a prior and a likelihood, what a credible interval means, why sequential and batch updating agree, and why different reasonable priors lead to nearly the same posterior once there is enough data.",

  glimpse: (
    <>
      <p>
        Grids work for a parameter or two. For some prior and likelihood pairs, the posterior stays in the prior&apos;s
        family and updating is just arithmetic on its parameters. These conjugate pairs are the subject of the next
        lesson.
      </p>
    </>
  ),
};
