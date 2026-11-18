import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MaxEntDieViz } from "@/components/viz/MaxEntDieViz";
import type { LessonContent } from "@/lib/types";

const ME = `import numpy as np

def gibbs(xs, lam):
    w = np.exp(lam * (xs - xs.mean()))
    return w / w.sum()

def maxent_mean(xs, mu, lo=-50.0, hi=50.0):
    xs = np.asarray(xs, float)
    for _ in range(200):
        mid = (lo + hi) / 2
        if gibbs(xs, mid) @ xs < mu:
            lo = mid
        else:
            hi = mid
    return gibbs(xs, (lo + hi) / 2)

def entropy(p):
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())`;

const DU = `import numpy as np

def maxent_fit(F, mu, steps=20000, lr=0.02):
    lam = np.zeros(F.shape[1])
    for _ in range(steps):
        z = F @ lam; p = np.exp(z - z.max()); p /= p.sum()
        lam -= lr * (p @ F - mu)
    return p, lam`;

export const lesson: LessonContent = {
  id: "m12.6.1",
  minutes: 50,
  links: {
    requires: ["m12.2.1"],
    revisits: ["m12.1.2"],
    foreshadows: ["m12.6.2", "m12.6.4"],
  },

  puzzle: (
    <>
      <p>
        A die is rolled many times and you are told only that the average was 4.5, not 3.5. What probabilities should you
        assign to the six faces? Infinitely many distributions have mean 4.5: one puts all its mass on 3 and 6, another on
        4 and 5, another spreads it out. Choosing one that assumes more than you were told seems wrong. Is there a
        principled way to assume nothing else, and does it give a definite answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Entropy measures how uncommitted a distribution is. So among all distributions that satisfy what we know, pick the
        one with the largest entropy: it encodes the constraints and nothing more. The answer always has the same shape.
        Each constraint on an average of f(x) contributes a factor <M>{"e^{\\lambda f(x)}"}</M>, so a constraint on the mean
        tilts the uniform distribution geometrically, and adding a constraint on the second moment gives a discrete bell.
      </p>
      <MaxEntDieViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the maximum entropy problem">
        <p>
          On a finite set, given features <M>{"f_1, \\dots, f_k"}</M> and target values <M>{"\\mu_1, \\dots, \\mu_k"}</M>, maximise
          H(p) over distributions p with <M>{"\\mathbb E_p[f_j] = \\mu_j"}</M> for all j. The candidate solutions are the Gibbs
          distributions
        </p>
        <MD>{"p_\\lambda(x) = \\frac{e^{\\lambda \\cdot f(x)}}{Z(\\lambda)}, \\qquad Z(\\lambda) = \\sum_x e^{\\lambda \\cdot f(x)}."}</MD>
      </Definition>

      <Theorem title="the Gibbs distribution is the maximiser">
        <p>
          If some <M>{"p_\\lambda"}</M> satisfies the constraints, then every q satisfying them has{" "}
          <M>{"H(q) = H(p_\\lambda) - D(q \\,\\|\\, p_\\lambda)"}</M> (in nats), so <M>{"p_\\lambda"}</M> is the unique maximiser.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"-\\sum_x q(x) \\ln p_\\lambda(x) = \\ln Z(\\lambda) - \\lambda \\cdot \\mathbb E_q[f] = \\ln Z(\\lambda) - \\lambda \\cdot \\mu"}</M>,
          which is the same for every q meeting the constraints, including <M>{"p_\\lambda"}</M> itself, where it equals{" "}
          <M>{"H(p_\\lambda)"}</M>. Hence{" "}
          <M>{"H(q) = -\\sum q \\ln p_\\lambda - D(q \\,\\|\\, p_\\lambda) = H(p_\\lambda) - D(q \\,\\|\\, p_\\lambda)"}</M>. The
          divergence is non-negative and zero only when <M>{"q = p_\\lambda"}</M>. For the die with mean 4.5 this gives
          probabilities from 0.054 up to 0.347, each 1.449 times the one before, with entropy 2.328 bits against 2.585 for a
          fair die.
        </p>
        <Code>{ME}</Code>
      </Proof>

      <Theorem title="the multipliers solve a convex problem">
        <p>
          The function <M>{"g(\\lambda) = \\ln Z(\\lambda) - \\lambda \\cdot \\mu"}</M> is convex, with gradient{" "}
          <M>{"\\mathbb E_{p_\\lambda}[f] - \\mu"}</M> and Hessian <M>{"\\mathrm{Cov}_{p_\\lambda}(f)"}</M>. Its minimisers are
          exactly the λ whose Gibbs distribution meets the constraints, and its minimum value is the maximum entropy.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiating, <M>{"\\partial_j \\ln Z = \\sum_x f_j(x) e^{\\lambda\\cdot f(x)} / Z = \\mathbb E_{p_\\lambda}[f_j]"}</M>, and
          differentiating once more gives <M>{"\\mathbb E[f_j f_l] - \\mathbb E[f_j]\\mathbb E[f_l]"}</M>, a covariance matrix and
          so positive semidefinite. A convex function is minimised exactly where its gradient vanishes, which is where the
          moments match. There <M>{"g(\\lambda) = \\ln Z - \\lambda\\cdot\\mu = H(p_\\lambda)"}</M> by the proof above. So gradient
          descent on g, nudging λ against the moment mismatch, finds the solution.
        </p>
        <Code>{DU}</Code>
      </Proof>

      <Remark title="familiar distributions as maximum entropy">
        <p>
          The same argument works with densities and differential entropy. On <M>{"[0, \\infty)"}</M> with a fixed mean m the
          maximiser is the exponential distribution, with entropy <M>{"\\log_2(e\\,m)"}</M> bits; on the integers 0, 1, 2, … it is
          the geometric. On the real line with a fixed mean and variance <M>{"\\sigma^2"}</M> it is the Gaussian, with entropy{" "}
          <M>{"\\tfrac12\\log_2(2\\pi e \\sigma^2)"}</M>, which is one reason Gaussian noise is the worst case for a channel of
          given power.
        </p>
      </Remark>

      <Remark title="read critically">
        <p>
          Maximum entropy is only as good as its inputs. The answer depends on which averages are constrained, and with
          continuous variables on the reference measure: maximising entropy in x and in log x give different answers. Jaynes
          argued it is the honest way to reason from partial information; it is not a law of nature, and real dice with mean
          4.5 need not follow the geometric tilt. When the constraints are empirical averages of data, maximum entropy and
          maximum likelihood in an exponential family turn out to be the same calculation, which is the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "uniform",
      rung: "check",
      prompt: <p>With no constraints beyond normalisation, what is the maximum entropy of a distribution on six faces, in bits? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.585, tolerance: 0.001 },
    },
    {
      key: "geometric",
      rung: "check",
      prompt: (
        <p>
          Among distributions on 0, 1, 2, … with mean 3, the maximum entropy one is geometric. What probability does it give
          to 0?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "dual",
      rung: "apply",
      prompt: <p>Why can the multipliers λ be found reliably by gradient descent?</p>,
      answer: {
        kind: "choice",
        options: [
          "ln Z(λ) − λ·μ is convex with gradient equal to the moment mismatch, so its stationary points are global minima",
          "The entropy is linear in λ",
          "Z(λ) is always equal to 1",
          "Every λ satisfies the constraints",
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

def gibbs(xs, lam):
    w = np.exp(lam * (xs - xs.mean()))
    return w / w.sum()

def maxent_mean(xs, mu, lo=-50.0, hi=50.0):
    xs = np.asarray(xs, float)
    for _ in range(200):
        mid = (lo + hi) / 2
        if gibbs(xs, mid) @ xs < mu:
            lo = mid
        else:
            hi = mid
    return gibbs(xs, (lo + hi) / 2)

def entropy(p):
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())

xs = np.arange(1, 7); p = maxent_mean(xs, 4.5); print([round(float(v), 3) for v in p], round(entropy(p), 3))
q = np.array([0, 0, 0.25, 0.25, 0.25, 0.25]); print(q @ xs, entropy(q), round(entropy(maxent_mean(xs, 3.5)), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.054, 0.079, 0.114, 0.165, 0.24, 0.347] 2.328\n4.5 2.0 2.585",
          "[0.347, 0.24, 0.165, 0.114, 0.079, 0.054] 2.328\n4.5 2.0 2.585",
          "[0.0, 0.0, 0.25, 0.25, 0.25, 0.25] 2.0\n4.5 2.0 2.585",
          "[0.054, 0.079, 0.114, 0.165, 0.24, 0.347] 2.328\n4.5 2.328 2.585",
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

def maxent_fit(F, mu, steps=20000, lr=0.02):
    lam = np.zeros(F.shape[1])
    for _ in range(steps):
        z = F @ lam; p = np.exp(z - z.max()); p /= p.sum()
        lam -= lr * (p @ F - mu)
    return p, lam

F = np.array([[x, x * x] for x in range(1, 7)], float); p, lam = maxent_fit(F, np.array([3.5, 13.0])); print([round(float(v), 3) for v in p])
p, lam = maxent_fit(np.arange(1.0, 7.0)[:, None], np.array([4.5])); print(round(float(lam[0]), 3), round(float(p[5] / p[4]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.007, 0.103, 0.389, 0.389, 0.103, 0.007]\n0.371 1.449",
          "[0.167, 0.167, 0.167, 0.167, 0.167, 0.167]\n0.371 1.449",
          "[0.007, 0.103, 0.389, 0.389, 0.103, 0.007]\n1.449 0.371",
          "[0.0, 0.25, 0.25, 0.25, 0.25, 0.0]\n0.371 1.449",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gibbs(xs, lam)</C>, proportional to <M>{"e^{\\lambda x}"}</M> (shift x by its mean for stability);{" "}
          <C>maxent_mean(xs, mu)</C>, finding λ by bisection on the mean; and <C>entropy(p)</C> in bits, ignoring zeros.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gibbs(xs, lam):
    return np.full(len(xs), 1 / len(xs))

def maxent_mean(xs, mu, lo=-50.0, hi=50.0):
    return gibbs(np.asarray(xs, float), 0.0)

def entropy(p):
    return 0.0
`,
        solution: ME,
        tests: [
          { name: "mean", code: `xs = np.arange(1, 7); p = maxent_mean(xs, 2.0); assert abs(p @ xs - 2.0) < 1e-9 and np.allclose(p[1:] / p[:-1], p[1] / p[0])
assert np.allclose(maxent_mean(xs, 3.5), 1 / 6)` },
          { name: "entropy", code: `assert abs(entropy(np.array([0.5, 0.5, 0.0])) - 1.0) < 1e-12 and abs(entropy(np.full(8, 1 / 8)) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>maxent_fit(F, mu, steps, lr)</C>, where row x of F holds the features f(x): run gradient descent on{" "}
          <M>{"\\ln Z(\\lambda) - \\lambda\\cdot\\mu"}</M> from λ = 0 and return the final distribution and λ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def maxent_fit(F, mu, steps=20000, lr=0.02):
    return np.full(F.shape[0], 1 / F.shape[0]), np.zeros(F.shape[1])
`,
        solution: DU,
        tests: [
          { name: "mean", code: `p, lam = maxent_fit(np.arange(1.0, 7.0)[:, None], np.array([2.0])); assert abs(p @ np.arange(1, 7) - 2.0) < 1e-4 and lam[0] < 0` },
          { name: "twomoments", code: `F = np.array([[x, x * x] for x in range(1, 7)], float); p, lam = maxent_fit(F, np.array([3.5, 13.0]))
assert np.allclose(p @ F, [3.5, 13.0], atol=1e-3) and np.allclose(p, p[::-1], atol=1e-4)` },
        ],
      },
    },
    {
      key: "expo",
      rung: "stretch",
      prompt: (
        <p>
          What is the largest possible differential entropy, in bits, of a density on <M>{"[0, \\infty)"}</M> with mean 2? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.443, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The Gibbs form <M>{"e^{\\lambda\\cdot f(x)}/Z(\\lambda)"}</M> is an exponential family. The next lesson revisits those
        families through information theory: maximum likelihood matches moments, the log-partition function generates them,
        and its Hessian is the Fisher information.
      </p>
    </>
  ),
};
