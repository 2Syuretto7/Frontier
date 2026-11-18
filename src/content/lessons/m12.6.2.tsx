import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IProjectionViz } from "@/components/viz/IProjectionViz";
import type { LessonContent } from "@/lib/types";

const EF = `import numpy as np

def log_partition(F, lam):
    z = F @ lam; m = z.max()
    return float(m + np.log(np.exp(z - m).sum()))

def member(F, lam):
    return np.exp(F @ lam - log_partition(F, lam))

def kl_bregman(F, l1, l2):
    mu1 = member(F, l1) @ F
    return float(log_partition(F, l2) - log_partition(F, l1) - mu1 @ (l2 - l1))`;

const IP = `import numpy as np

def tilt(p0, F, mu, steps=20000, lr=0.02):
    lam = np.zeros(F.shape[1])
    for _ in range(steps):
        z = np.log(p0) + F @ lam; p = np.exp(z - z.max()); p /= p.sum()
        lam -= lr * (p @ F - mu)
    return p

def kl(p, q):
    m = p > 0
    return float((p[m] * np.log(p[m] / q[m])).sum())`;

export const lesson: LessonContent = {
  id: "m12.6.2",
  minutes: 50,
  links: {
    requires: ["m12.6.1", "m9.3.2"],
    revisits: ["m9.3.3", "m12.2.1"],
    foreshadows: ["m12.6.3"],
  },

  puzzle: (
    <>
      <p>
        Fitting an exponential family by maximum likelihood matches its moments to the data. Maximising entropy subject to
        those same moments produces a member of the same family. Are these two procedures, one about fitting data and one
        about honest ignorance, really the same, and if so, why? And why does the KL divergence between two members of a
        family have such a simple formula, with the Fisher information hiding in its second derivative?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Draw all distributions as a space. The distributions with a given mean form a flat slice; an exponential family
        through a reference distribution is a curve crossing every such slice exactly once. Divergence behaves like squared
        distance here: the crossing point is the closest point of the slice to the reference, and for any other point of
        the slice the divergences add up like the sides of a right-angled triangle. Maximum likelihood and maximum entropy
        both land on that crossing point, approached from two directions.
      </p>
      <IProjectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="exponential family through a reference">
        <p>
          With a reference distribution <M>{"p_0"}</M> on a finite set and features f, the family is{" "}
          <M>{"p_\\lambda(x) = p_0(x)\\, e^{\\lambda \\cdot f(x) - A(\\lambda)}"}</M> with log-partition{" "}
          <M>{"A(\\lambda) = \\ln \\sum_x p_0(x) e^{\\lambda\\cdot f(x)}"}</M>. Its mean parameter is{" "}
          <M>{"\\mu(\\lambda) = \\mathbb E_{p_\\lambda}[f] = \\nabla A(\\lambda)"}</M>. With uniform <M>{"p_0"}</M> these are the
          Gibbs distributions of the last lesson.
        </p>
      </Definition>

      <Theorem title="Pythagoras for divergence">
        <p>
          Let <M>{"p^* = p_{\\lambda^*}"}</M> have mean μ. For every distribution q with <M>{"\\mathbb E_q[f] = \\mu"}</M>,
        </p>
        <MD>{"D(q \\,\\|\\, p_0) = D(q \\,\\|\\, p^*) + D(p^* \\,\\|\\, p_0)."}</MD>
        <p>
          So <M>{"p^*"}</M> is the unique minimiser of <M>{"D(\\cdot \\,\\|\\, p_0)"}</M> over the slice, called the information
          projection of <M>{"p_0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\ln(p^*/p_0) = \\lambda^*\\cdot f - A(\\lambda^*)"}</M> is a linear function of f, so its expectation is the
          same, <M>{"\\lambda^*\\cdot\\mu - A(\\lambda^*)"}</M>, under q and under <M>{"p^*"}</M>; under <M>{"p^*"}</M> it is{" "}
          <M>{"D(p^* \\,\\|\\, p_0)"}</M>. Now split{" "}
          <M>{"D(q \\,\\|\\, p_0) = \\mathbb E_q[\\ln(q/p^*)] + \\mathbb E_q[\\ln(p^*/p_0)]"}</M>. With uniform{" "}
          <M>{"p_0"}</M>, <M>{"D(q \\,\\|\\, p_0) = \\ln N - H(q)"}</M>, and this is exactly the maximum entropy theorem.
        </p>
        <Code>{IP}</Code>
      </Proof>

      <Theorem title="maximum likelihood is maximum entropy">
        <p>
          For data with empirical distribution <M>{"\\hat p"}</M> and empirical moments <M>{"\\hat\\mu"}</M>, the average
          log-likelihood of <M>{"p_\\lambda"}</M> is <M>{"-D(\\hat p \\,\\|\\, p_\\lambda) - H(\\hat p)"}</M>. The maximum likelihood
          member is the one with mean <M>{"\\hat\\mu"}</M>, which is also the information projection of <M>{"p_0"}</M> onto{" "}
          <M>{"\\{q : \\mathbb E_q[f] = \\hat\\mu\\}"}</M>, and
        </p>
        <MD>{"\\max_\\lambda \\bigl[\\lambda\\cdot\\hat\\mu - A(\\lambda)\\bigr] = \\min_{q : \\mathbb E_q[f] = \\hat\\mu} D(q \\,\\|\\, p_0)."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\frac1n\\sum_i \\ln p_\\lambda(x_i) = \\mathbb E_{\\hat p}[\\ln p_\\lambda]"}</M>, which is{" "}
          <M>{"-H(\\hat p) - D(\\hat p \\,\\|\\, p_\\lambda)"}</M>. Since <M>{"\\hat p"}</M> lies in the slice with mean{" "}
          <M>{"\\hat\\mu"}</M>, Pythagoras with <M>{"p_\\lambda"}</M> playing <M>{"p_0"}</M> and <M>{"p^*"}</M> the member with mean{" "}
          <M>{"\\hat\\mu"}</M> gives <M>{"D(\\hat p \\,\\|\\, p_\\lambda) = D(\\hat p \\,\\|\\, p^*) + D(p^* \\,\\|\\, p_\\lambda)"}</M>,
          minimised at <M>{"p_\\lambda = p^*"}</M>. For the duality, the left side is{" "}
          <M>{"\\mathbb E_{\\hat p}[\\ln (p_\\lambda / p_0)]"}</M>, which at <M>{"\\lambda^*"}</M> equals{" "}
          <M>{"\\mathbb E_{p^*}[\\ln(p^*/p_0)] = D(p^* \\,\\|\\, p_0)"}</M> by linearity in f, the right side&apos;s minimum.
        </p>
      </Proof>

      <Theorem title="divergence is the Bregman divergence of A">
        <p>
          <M>{"D(p_{\\lambda_1} \\,\\|\\, p_{\\lambda_2}) = A(\\lambda_2) - A(\\lambda_1) - \\nabla A(\\lambda_1)\\cdot(\\lambda_2 - \\lambda_1)"}</M>.
          Consequently <M>{"D(p_\\lambda \\,\\|\\, p_{\\lambda+\\delta}) = \\tfrac12\\,\\delta^\\top \\nabla^2 A(\\lambda)\\,\\delta + O(|\\delta|^3)"}</M>,
          and <M>{"\\nabla^2 A(\\lambda) = \\mathrm{Cov}_{p_\\lambda}(f)"}</M> is the Fisher information.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\ln(p_{\\lambda_1}/p_{\\lambda_2}) = (\\lambda_1 - \\lambda_2)\\cdot f - A(\\lambda_1) + A(\\lambda_2)"}</M>; take the
          expectation under <M>{"p_{\\lambda_1}"}</M> and use <M>{"\\mathbb E_{p_{\\lambda_1}}[f] = \\nabla A(\\lambda_1)"}</M>. The
          Bregman divergence of a smooth convex function is its second-order Taylor remainder, which gives the quadratic
          form. For a Bernoulli in natural parameters, <M>{"A = \\ln(1 + e^\\lambda)"}</M> and at λ = 0 the Fisher information is
          ¼, so <M>{"D(p_0 \\,\\|\\, p_\\delta) \\approx \\delta^2/8"}</M>.
        </p>
        <Code>{EF}</Code>
      </Proof>

      <Remark title="two projections, two uses">
        <p>
          Projecting the other way, <M>{"\\arg\\min_\\lambda D(p \\,\\|\\, p_\\lambda)"}</M> for a given p, also has a clean answer:
          the member whose moments match those of p, which is maximum likelihood with p as the data. This moment-matching
          projection drives expectation propagation, while variational inference minimises <M>{"D(p_\\lambda \\,\\|\\, p)"}</M>{" "}
          and tends to fit one mode tightly. The pair of coordinates λ and μ, linked by <M>{"\\nabla A"}</M> and its inverse, is
          the starting point of information geometry, and alternating the two kinds of projection is one way to read the EM
          algorithm.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bern",
      rung: "check",
      prompt: (
        <p>
          A Bernoulli family has natural parameter λ, with P(1) = e^λ/(1 + e^λ). What is{" "}
          <M>{"D(p_0 \\,\\|\\, p_{\\ln 3})"}</M> in nats? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1438, tolerance: 0.0001 },
    },
    {
      key: "local",
      rung: "check",
      prompt: (
        <p>
          For the same family, <M>{"D(p_0 \\,\\|\\, p_\\delta) \\approx c\\,\\delta^2"}</M> for small δ. What is c?
        </p>
      ),
      answer: { kind: "numeric", value: 0.125, tolerance: 0.0001 },
    },
    {
      key: "mproj",
      rung: "apply",
      prompt: <p>Which member of an exponential family minimises D(p ‖ p_λ) for a fixed distribution p?</p>,
      answer: {
        kind: "choice",
        options: [
          "The member whose expected features equal those of p",
          "The member with the largest entropy, whatever p is",
          "The member at λ = 0",
          "The member that puts the most mass on the mode of p",
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

def log_partition(F, lam):
    z = F @ lam; m = z.max()
    return float(m + np.log(np.exp(z - m).sum()))

def member(F, lam):
    return np.exp(F @ lam - log_partition(F, lam))

def kl_bregman(F, l1, l2):
    mu1 = member(F, l1) @ F
    return float(log_partition(F, l2) - log_partition(F, l1) - mu1 @ (l2 - l1))

F = np.array([[0.0], [1.0]]); p, q = member(F, np.array([0.0])), member(F, np.array([1.0]))
print([round(float(v), 3) for v in q], round(kl_bregman(F, np.array([0.0]), np.array([1.0])), 4), round(float(np.sum(p * np.log(p / q))), 4))
print(round(kl_bregman(F, np.array([0.0]), np.array([0.1])) / (0.5 * 0.1 ** 2 * 0.25), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.269, 0.731] 0.1201 0.1201\n1.0",
          "[0.731, 0.269] 0.1201 0.1201\n1.0",
          "[0.269, 0.731] 0.1201 0.1201\n0.25",
          "[0.269, 0.731] 0.0 0.1201\n1.0",
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

def tilt(p0, F, mu, steps=20000, lr=0.02):
    lam = np.zeros(F.shape[1])
    for _ in range(steps):
        z = np.log(p0) + F @ lam; p = np.exp(z - z.max()); p /= p.sum()
        lam -= lr * (p @ F - mu)
    return p

def kl(p, q):
    m = p > 0
    return float((p[m] * np.log(p[m] / q[m])).sum())

p0 = np.array([0.4, 0.3, 0.2, 0.1]); F = np.arange(4.0)[:, None]; p = tilt(p0, F, np.array([2.0])); q = np.array([0.25, 0.0, 0.25, 0.5])
print(round(kl(p, p0), 3), round(kl(q, p0), 3), abs(kl(q, p0) - kl(q, p) - kl(p, p0)) < 1e-6)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.456 0.743 True", "0.456 0.456 True", "0.456 0.743 False", "0.0 0.743 True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a family with uniform reference and feature matrix F, write <C>log_partition(F, lam)</C> stably,{" "}
          <C>member(F, lam)</C>, and <C>kl_bregman(F, l1, l2)</C> using the Bregman formula.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_partition(F, lam):
    return 0.0

def member(F, lam):
    return np.full(F.shape[0], 1 / F.shape[0])

def kl_bregman(F, l1, l2):
    return 0.0
`,
        solution: EF,
        tests: [
          { name: "family", code: `assert np.isclose(log_partition(np.array([[0.0], [1.0]]), np.array([0.0])), np.log(2)) and np.isfinite(log_partition(np.array([[0.0], [1.0]]), np.array([1000.0])))
z = np.array([0.3, -1.0, 2.0]); assert np.allclose(member(np.eye(3), z), np.exp(z) / np.exp(z).sum())` },
          { name: "bregman", code: `F = np.array([[0.0, 1.0], [1.0, 0.0], [2.0, -1.0], [1.0, 3.0]]); a, b = np.array([0.2, -0.4]), np.array([-0.5, 0.3])
p, q = member(F, a), member(F, b); assert np.isclose(kl_bregman(F, a, b), np.sum(p * np.log(p / q)))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tilt(p0, F, mu, steps, lr)</C>, the information projection of p0 onto the distributions with{" "}
          <M>{"\\mathbb E[f] = \\mu"}</M>, by gradient descent on the dual from λ = 0, and <C>kl(p, q)</C> in nats with 0 log 0 = 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def tilt(p0, F, mu, steps=20000, lr=0.02):
    return p0

def kl(p, q):
    return 0.0
`,
        solution: IP,
        tests: [
          { name: "projection", code: `p = tilt(np.full(6, 1 / 6), np.arange(1.0, 7.0)[:, None], np.array([4.5])); assert abs(p[5] - 0.3475) < 1e-3 and abs(p @ np.arange(1, 7) - 4.5) < 1e-4` },
          { name: "pythagoras", code: `p0 = np.array([0.1, 0.2, 0.3, 0.4]); F = np.arange(4.0)[:, None]; p = tilt(p0, F, np.array([1.0])); q = np.array([0.5, 0.0, 0.5, 0.0])
assert abs(kl(q, p0) - kl(q, p) - kl(p, p0)) < 1e-5 and kl(q, p0) > 0.1` },
        ],
      },
    },
    {
      key: "poisson",
      rung: "stretch",
      prompt: (
        <p>
          The Poisson family has log-partition <M>{"A(\\lambda) = e^\\lambda"}</M> with mean <M>{"e^\\lambda"}</M>. Using the Bregman
          formula, what is the divergence from Poisson(2) to Poisson(3) in nats? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1891, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far we have compressed losslessly. Rate-distortion theory asks how far a source can be compressed if some error is
        allowed, and its optimal encoders turn out to be Gibbs distributions too, found by the same kind of alternating
        projections.
      </p>
    </>
  ),
};
