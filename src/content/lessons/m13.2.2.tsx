import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RejectionViz } from "@/components/viz/RejectionViz";
import type { LessonContent } from "@/lib/types";

const RJ = `import numpy as np

def rejection(log_ptilde, sample_q, log_q, log_M, n, rng):
    out, tries = [], 0
    while len(out) < n:
        x = sample_q(rng); tries += 1
        if np.log(rng.random()) <= log_ptilde(x) - log_M - log_q(x):
            out.append(x)
    return np.array(out), tries

def bound_M(log_ptilde, log_q, grid):
    return float(np.max([log_ptilde(x) - log_q(x) for x in grid]))`;

const DM = `import numpy as np

def accept_rate(sigma, d):
    return float(sigma ** (-d))

def simulate_rate(sigma, d, n, rng):
    x = rng.normal(0, sigma, size=(n, d))
    logr = -0.5 * (x ** 2).sum(axis=1) * (1 - 1 / sigma ** 2)
    return float(np.mean(np.log(rng.random(n)) <= logr))`;

export const lesson: LessonContent = {
  id: "m13.2.2",
  minutes: 45,
  links: {
    requires: ["m13.2.1"],
    revisits: ["m13.1.3"],
    foreshadows: ["m13.4.1"],
  },

  puzzle: (
    <>
      <p>
        You can evaluate a density only up to an unknown constant, say a posterior proportional to likelihood times prior,
        and you cannot invert its distribution function. Importance sampling gives weighted samples, but you want honest,
        unweighted, exact draws. Throwing darts under a curve that sits above the density and keeping the ones that land
        under it does exactly that. What does it cost, and why does the cost explode in high dimensions?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A point chosen uniformly in the region under a curve has an x-coordinate distributed like that curve. So sample
        uniformly under a simple envelope that covers the target, and keep only the points that also lie under the target:
        the kept points are uniform under the target. The price is the wasted points, and the fraction kept is the ratio of
        the two areas. In d dimensions the envelope&apos;s excess multiplies across coordinates.
      </p>
      <RejectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="rejection sampling">
        <p>
          Let <M>{"\\tilde p = Z p"}</M> be an unnormalised target and q a proposal density with{" "}
          <M>{"\\tilde p(x) \\le M q(x)"}</M> for all x. Repeat: draw <M>{"X \\sim q"}</M> and U uniform on (0, 1); if{" "}
          <M>{"U \\le \\tilde p(X)/(M q(X))"}</M>, return X.
        </p>
      </Definition>

      <Theorem title="exactness and cost">
        <p>
          The returned X has density p. Each trial is accepted with probability Z/M, so the number of trials is geometric
          with mean M/Z.
        </p>
      </Theorem>
      <Proof>
        <p>
          For one trial,{" "}
          <M>{"P(X \\le x,\\ \\text{accept}) = \\int_{-\\infty}^x q(y)\\,\\frac{\\tilde p(y)}{M q(y)}\\,dy = \\frac{Z}{M}\\int_{-\\infty}^x p(y)\\,dy"}</M>.
          Letting <M>{"x \\to \\infty"}</M> gives <M>{"P(\\text{accept}) = Z/M"}</M>, and dividing gives the distribution of an
          accepted X. Trials are independent, so the first acceptance is geometric. The bound needs M, not Z: for the
          half-normal <M>{"\\tilde p = e^{-x^2/2}"}</M> with an Exp(1) proposal,{" "}
          <M>{"\\max_x \\tilde p/q = \\max_x e^{-x^2/2 + x} = e^{1/2}"}</M>, and the acceptance rate is{" "}
          <M>{"\\sqrt{\\pi/2}/e^{1/2} \\approx 0.760"}</M>. Working in logs avoids underflow.
        </p>
        <Code>{RJ}</Code>
      </Proof>

      <Theorem title="the curse of dimension">
        <p>
          For target N(0, I) in d dimensions and proposal <M>{"N(0, \\sigma^2 I)"}</M> with σ &gt; 1, the best acceptance rate is{" "}
          <M>{"\\sigma^{-d}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The ratio <M>{"p(x)/q(x) = \\sigma^d \\exp\\bigl(-\\tfrac12|x|^2(1 - \\sigma^{-2})\\bigr)"}</M> is largest at x = 0, so the
          smallest valid M is <M>{"\\sigma^d"}</M> and the acceptance probability is 1/M. A proposal only 20% too wide accepts
          83% in one dimension, 16% in ten and 0.01% in fifty. A narrower proposal (σ &lt; 1) fails outright, since no finite M
          covers the target&apos;s tails.
        </p>
        <Code>{DM}</Code>
      </Proof>

      <Remark title="making it practical">
        <p>
          A cheap lower bound, a squeeze, lets most points be accepted without evaluating <M>{"\\tilde p"}</M>. For log-concave
          densities, adaptive rejection sampling builds the envelope from tangent lines to <M>{"\\log \\tilde p"}</M> and tightens
          it with every rejection. The ziggurat method, the usual way libraries draw normals, is rejection from a stack of
          rectangles that accepts over 98% of the time. In high dimensions none of this rescues rejection, and Markov chain
          methods take over: they give up exact independent draws in exchange for working where no good envelope exists.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: <p>An unnormalised target with total mass Z = 1.5 is bounded by 3q. What is the acceptance rate?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "trials",
      rung: "check",
      prompt: (
        <p>
          Half-normal from an Exp(1) proposal with the tightest envelope: what is the expected number of proposals per accepted
          sample? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.315, tolerance: 0.001 },
    },
    {
      key: "constant",
      rung: "apply",
      prompt: <p>Why can rejection sampling work with a density known only up to its normalising constant?</p>,
      answer: {
        kind: "choice",
        options: [
          "The constant only scales the acceptance rate Z/M; the accepted points are still distributed exactly as p",
          "The constant cancels between the target and the proposal",
          "Rejection sampling estimates the constant first",
          "Unnormalised densities are always bounded by 1",
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

def rejection(log_ptilde, sample_q, log_q, log_M, n, rng):
    out, tries = [], 0
    while len(out) < n:
        x = sample_q(rng); tries += 1
        if np.log(rng.random()) <= log_ptilde(x) - log_M - log_q(x):
            out.append(x)
    return np.array(out), tries

def bound_M(log_ptilde, log_q, grid):
    return float(np.max([log_ptilde(x) - log_q(x) for x in grid]))

lp, lq = (lambda x: -0.5 * x ** 2), (lambda x: -x); M = bound_M(lp, lq, np.linspace(0, 10, 1001)); print(M)
xs, tries = rejection(lp, lambda r: r.exponential(), lq, M, 10000, np.random.default_rng(0)); print(round(10000 / tries, 2), round(float(xs.mean()), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5\n0.76 0.8", "0.5\n0.8 0.76", "1.0\n0.76 0.8", "0.5\n0.61 0.8"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def accept_rate(sigma, d):
    return float(sigma ** (-d))

def simulate_rate(sigma, d, n, rng):
    x = rng.normal(0, sigma, size=(n, d))
    logr = -0.5 * (x ** 2).sum(axis=1) * (1 - 1 / sigma ** 2)
    return float(np.mean(np.log(rng.random(n)) <= logr))

print([round(accept_rate(1.2, d), 3) for d in (1, 10, 50)], abs(simulate_rate(1.2, 10, 200000, np.random.default_rng(1)) - accept_rate(1.2, 10)) < 0.01)
print(accept_rate(2.0, 3), simulate_rate(1.0, 5, 1000, np.random.default_rng(2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.833, 0.162, 0.0] True\n0.125 1.0",
          "[0.833, 0.694, 0.402] True\n0.125 1.0",
          "[0.833, 0.162, 0.0] True\n0.125 0.0",
          "[0.833, 0.162, 0.0] False\n0.5 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rejection(log_ptilde, sample_q, log_q, log_M, n, rng)</C>, returning n accepted samples and the number of
          trials, comparing in log space, and <C>bound_M(log_ptilde, log_q, grid)</C>, the largest log ratio on a grid.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rejection(log_ptilde, sample_q, log_q, log_M, n, rng):
    return np.array([sample_q(rng) for _ in range(n)]), n

def bound_M(log_ptilde, log_q, grid):
    return 0.0
`,
        solution: RJ,
        tests: [
          { name: "bound", code: `assert abs(bound_M(lambda x: -0.5 * x ** 2, lambda x: -x, np.linspace(0, 10, 1001)) - 0.5) < 1e-12` },
          { name: "sample", code: `xs, t = rejection(lambda x: -0.5 * x ** 2, lambda r: r.exponential(), lambda x: -x, 0.5, 20000, np.random.default_rng(3))
assert abs(xs.mean() - np.sqrt(2 / np.pi)) < 0.02 and abs(20000 / t - 0.7602) < 0.02 and abs((xs ** 2).mean() - 1) < 0.04` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>accept_rate(sigma, d)</C> from the theorem and <C>simulate_rate(sigma, d, n, rng)</C>, the observed acceptance
          fraction for target N(0, I) and proposal <M>{"N(0, \\sigma^2 I)"}</M> with the tightest envelope.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def accept_rate(sigma, d):
    return 1.0

def simulate_rate(sigma, d, n, rng):
    return 1.0
`,
        solution: DM,
        tests: [
          { name: "rate", code: `assert accept_rate(2.0, 3) == 0.125 and abs(accept_rate(1.5, 2) - 1 / 2.25) < 1e-12` },
          { name: "simulate", code: `assert abs(simulate_rate(1.5, 2, 100000, np.random.default_rng(4)) - 1 / 2.25) < 0.01 and simulate_rate(1.0, 5, 500, np.random.default_rng(5)) == 1.0` },
        ],
      },
    },
    {
      key: "lambda",
      rung: "stretch",
      prompt: (
        <p>
          Half-normal target <M>{"e^{-x^2/2}"}</M> with an Exp(2) proposal <M>{"2e^{-2x}"}</M> and the tightest envelope: what is the
          acceptance rate? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3392, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        For discrete choices there is a neater trick still: add independent Gumbel noise to the log probabilities and take the
        largest. It needs no normalising constant and turns sampling into an argmax, which is why it shows up in neural
        networks.
      </p>
    </>
  ),
};
