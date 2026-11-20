import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DensityFitViz } from "@/components/viz/DensityFitViz";
import type { LessonContent } from "@/lib/types";

const DENSITY = `import math

def gaussian_fit(xs):
    mu = sum(xs) / len(xs)
    var = sum((x - mu) ** 2 for x in xs) / len(xs)
    return mu, var

def hist_fit(xs, lo, hi, bins, alpha=0.0):
    counts, w = [alpha] * bins, (hi - lo) / bins
    for x in xs:
        counts[min(int((x - lo) / w), bins - 1)] += 1
    total = sum(counts)
    return [c / (total * w) for c in counts]

def hist_nll(xs, dens, lo, hi):
    w, out = (hi - lo) / len(dens), 0.0
    for x in xs:
        d = dens[min(int((x - lo) / w), len(dens) - 1)]
        if d == 0:
            return math.inf
        out -= math.log(d)
    return out / len(xs)`;

const TABLE = `def marginal(joint, axis):
    if axis == 0:
        return [sum(row) for row in joint]
    return [sum(col) for col in zip(*joint)]

def conditional(joint, i):
    s = sum(joint[i])
    return [p / s for p in joint[i]]

def sample_index(probs, u):
    c = 0.0
    for k, p in enumerate(probs):
        c += p
        if u < c:
            return k
    return len(probs) - 1`;

export const lesson: LessonContent = {
  id: "l7.1.1",
  minutes: 40,
  links: {
    requires: ["m12.2.1", "m12.2.2", "l4.2.3"],
    revisits: ["m13.2.1", "m12.1.2"],
    foreshadows: ["l7.1.2", "l7.2.1", "l12.1.1"],
  },

  puzzle: (
    <>
      <p>
        You are given ten thousand photographs of faces. A classifier would learn to tell faces from cars. You want something
        different: a program that has learned what faces are like, so that it can produce a new face nobody has photographed,
        say how plausible a given picture is as a face, and fill in a face whose lower half is covered. What single object
        would let a program do all three, and how could you tell whether it has learned faces rather than memorised your ten
        thousand photographs?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The object is a probability distribution over images. If the program holds a distribution <M>{"p_\\theta(x)"}</M> close to
        the distribution the photographs were drawn from, then producing a new face is drawing a sample, judging plausibility
        is evaluating <M>{"p_\\theta(x)"}</M>, and filling in the covered half is sampling from the conditional distribution of
        the hidden pixels given the visible ones. A <em>generative model</em> is a parametrised family of such distributions,
        fitted to data.
      </p>
      <p>
        Fitting is usually by maximum likelihood: choose θ to make the training data as probable as possible. Too simple a
        family cannot match the data; too flexible a family can match the training data perfectly by putting all its
        probability on the points it has seen, and then calls every new point impossible. The test is the probability given
        to data held out from training.
      </p>
      <DensityFitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="generative model">
        <p>
          Data <M>{"x_1, \\dots, x_n"}</M> are drawn independently from an unknown distribution <M>{"p_{\\text{data}}"}</M>. A{" "}
          <em>generative model</em> is a family <M>{"\\{p_\\theta\\}"}</M> of distributions over the same space, and fitting chooses
          θ so that <M>{"p_\\theta"}</M> is close to <M>{"p_{\\text{data}}"}</M>. A fitted model may support three operations:{" "}
          <em>density evaluation</em> (compute <M>{"p_\\theta(x)"}</M>), <em>sampling</em> (draw <M>{"x \\sim p_\\theta"}</M>) and{" "}
          <em>conditioning</em> (compute or sample <M>{"p_\\theta(x_B \\mid x_A)"}</M> for parts A and B of x). Different model
          families make different operations cheap, which is much of what distinguishes them in this course.
        </p>
      </Definition>

      <Definition title="maximum likelihood">
        <p>
          The <em>maximum-likelihood estimate</em> maximises <M>{"\\sum_i \\log p_\\theta(x_i)"}</M>, equivalently minimises the
          average negative log-likelihood <M>{"-\\frac{1}{n} \\sum_i \\log p_\\theta(x_i)"}</M>, measured in nats (or bits with base-2
          logarithms). For a Gaussian the estimate is the sample mean and the sample variance with divisor n
          (<C>gaussian_fit</C>), and its loss on a point is <M>{"\\tfrac{1}{2} \\log(2\\pi\\sigma^2) + (x - \\mu)^2 / (2\\sigma^2)"}</M>.
          A histogram with bin width w and counts <M>{"c_j"}</M> has density <M>{"c_j / (nw)"}</M> in bin j, the maximum-likelihood
          piecewise-constant density; adding a pseudo-count α to every bin before normalising keeps every density positive
          (<C>hist_fit</C>).
        </p>
        <Code>{DENSITY}</Code>
      </Definition>

      <Theorem title="likelihood and KL divergence">
        <p>
          For any model <M>{"p_\\theta"}</M>, the expected negative log-likelihood under the data distribution splits as
        </p>
        <MD>{"\\mathbb{E}_{x \\sim p_{\\text{data}}}[-\\log p_\\theta(x)] = H(p_{\\text{data}}) + \\mathrm{KL}(p_{\\text{data}} \\,\\|\\, p_\\theta)."}</MD>
        <p>
          The entropy does not depend on θ, so maximising the expected likelihood is minimising{" "}
          <M>{"\\mathrm{KL}(p_{\\text{data}} \\| p_\\theta)"}</M>, and no model can achieve an expected loss below{" "}
          <M>{"H(p_{\\text{data}})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The left side is the cross-entropy <M>{"H(p_{\\text{data}}, p_\\theta)"}</M> (m12.2.2). Adding and subtracting{" "}
          <M>{"\\log p_{\\text{data}}(x)"}</M> inside the expectation gives{" "}
          <M>{"\\mathbb{E}[-\\log p_{\\text{data}}(x)] + \\mathbb{E}[\\log (p_{\\text{data}}(x) / p_\\theta(x))]"}</M>, which is the
          entropy plus the KL divergence. The KL divergence is non-negative and zero exactly when the two distributions agree
          (m12.2.1), so the minimum <M>{"H(p_{\\text{data}})"}</M> is reached only by <M>{"p_\\theta = p_{\\text{data}}"}</M>. The average
          over training points is a Monte Carlo estimate of the expectation, so maximum likelihood minimises an estimate of this
          KL divergence.
        </p>
      </Proof>

      <Remark title="memorisation and held-out likelihood">
        <p>
          The estimate can be gamed. For discrete data, the empirical distribution, which puts mass 1/n on each training point,
          maximises the training likelihood over all distributions, yet gives probability zero to every unseen point. A training
          loss below the entropy of the data is therefore a warning sign, not a success. Generative models are compared on the
          average negative log-likelihood of a held-out test set (<C>hist_nll</C>), which is an unbiased estimate of the
          cross-entropy and is infinite if any test point is called impossible.
        </p>
      </Remark>

      <Definition title="the three operations on a table">
        <p>
          When x has two discrete parts, a model can be stored as a joint table <M>{"P[i][j] = p(x_1 = i, x_2 = j)"}</M>. Evaluation
          is a lookup; the marginal of <M>{"x_1"}</M> sums each row and that of <M>{"x_2"}</M> each column (<C>marginal</C>); the
          conditional of <M>{"x_2"}</M> given <M>{"x_1 = i"}</M> normalises row i (<C>conditional</C>). Sampling a discrete
          distribution from a uniform u returns the first index whose cumulative probability exceeds u, inverse-CDF sampling
          (m13.2.1, <C>sample_index</C>); sampling the pair first draws <M>{"x_1"}</M> from its marginal and then{" "}
          <M>{"x_2"}</M> from its conditional given that value, <em>ancestral sampling</em>.
        </p>
        <Code>{TABLE}</Code>
      </Definition>

      <Remark title="why tables do not scale">
        <p>
          A table over d variables with k values each has <M>{"k^d"}</M> entries. A 64 by 64 colour image has 12 288 values of 256
          levels each, so a table would have <M>{"256^{12288}"}</M> entries, and any data set covers a vanishing fraction of them.
          Every model in this course is a way of describing such a distribution with far fewer numbers: by the chain rule
          (autoregressive models), through latent variables (VAEs), by transforming simple noise (flows and GANs), or through an
          energy or its gradient (energy-based and score models).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "nll",
      rung: "check",
      prompt: <p>A model gives density 0.05 to a held-out point. What is the negative log-likelihood of that point in nats? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.996, tolerance: 0.001 },
    },
    {
      key: "hist",
      rung: "check",
      prompt: <p>A histogram on [0, 2] has 4 equal bins with counts 1, 3, 4 and 2. What density does the maximum-likelihood histogram give in the third bin?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "memorise",
      rung: "apply",
      prompt: <p>A model reaches a training loss well below the entropy of the data distribution. What is the most likely explanation?</p>,
      answer: {
        kind: "choice",
        options: [
          "It has memorised the training points and will give low probability to new data",
          "It has found a distribution better than the true one",
          "Its held-out loss will be even lower",
          "The entropy of the data was computed in the wrong units",
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

def gaussian_fit(xs):
    mu = sum(xs) / len(xs)
    var = sum((x - mu) ** 2 for x in xs) / len(xs)
    return mu, var

def hist_fit(xs, lo, hi, bins, alpha=0.0):
    counts, w = [alpha] * bins, (hi - lo) / bins
    for x in xs:
        counts[min(int((x - lo) / w), bins - 1)] += 1
    total = sum(counts)
    return [c / (total * w) for c in counts]

def hist_nll(xs, dens, lo, hi):
    w, out = (hi - lo) / len(dens), 0.0
    for x in xs:
        d = dens[min(int((x - lo) / w), len(dens) - 1)]
        if d == 0:
            return math.inf
        out -= math.log(d)
    return out / len(xs)

d = hist_fit([0.1, 0.2, 0.7], 0, 1, 2); print(gaussian_fit([1, 2, 3, 6]), [round(x, 3) for x in d])
print(hist_nll([0.9], hist_fit([0.1, 0.2], 0, 1, 2), 0, 1), round(hist_nll([0.9], hist_fit([0.1, 0.2], 0, 1, 2, 1.0), 0, 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3.0, 3.5) [1.333, 0.667]\ninf 0.6931",
          "(3.0, 4.6667) [1.333, 0.667]\ninf 0.6931",
          "(3.0, 3.5) [0.667, 0.333]\ninf 0.6931",
          "(3.0, 3.5) [1.333, 0.667]\n0.0 0.6931",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def marginal(joint, axis):
    if axis == 0:
        return [sum(row) for row in joint]
    return [sum(col) for col in zip(*joint)]

def conditional(joint, i):
    s = sum(joint[i])
    return [p / s for p in joint[i]]

def sample_index(probs, u):
    c = 0.0
    for k, p in enumerate(probs):
        c += p
        if u < c:
            return k
    return len(probs) - 1

J = [[0.1, 0.3], [0.2, 0.4]]; print([round(p, 2) for p in marginal(J, 0)], [round(p, 2) for p in marginal(J, 1)], [round(p, 2) for p in conditional(J, 0)])
i = sample_index(marginal(J, 0), 0.5); print(i, sample_index(conditional(J, i), 0.2), sample_index([0.5, 0.5], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.4, 0.6] [0.3, 0.7] [0.25, 0.75]\n1 0 1",
          "[0.3, 0.7] [0.4, 0.6] [0.25, 0.75]\n1 0 1",
          "[0.4, 0.6] [0.3, 0.7] [0.25, 0.75]\n1 1 1",
          "[0.4, 0.6] [0.3, 0.7] [0.25, 0.75]\n1 0 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_fit(xs)</C>, returning the maximum-likelihood mean and variance; <C>hist_fit(xs, lo, hi, bins, alpha=0.0)</C>, returning bin densities with pseudo-count α (a point at hi belongs to the
          last bin); and <C>hist_nll(xs, dens, lo, hi)</C>, the average negative log-likelihood, returning <C>math.inf</C> if a point lands in an empty bin.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_fit(xs):
    return 0.0, 1.0

def hist_fit(xs, lo, hi, bins, alpha=0.0):
    return [1.0 / (hi - lo)] * bins

def hist_nll(xs, dens, lo, hi):
    return 0.0
`,
        solution: DENSITY,
        tests: [
          { name: "gaussian", code: `assert gaussian_fit([2, 4]) == (3.0, 1.0) and gaussian_fit([5]) == (5.0, 0.0)
assert gaussian_fit([1, 1, 4]) == (2.0, 2.0)` },
          { name: "histogram", code: `d = hist_fit([0.5, 1.5, 1.6], 0, 2, 2); assert abs(d[0] - 1 / 3) < 1e-9 and abs(d[1] - 2 / 3) < 1e-9
d = hist_fit([0.5, 1.5, 1.6], 0, 2, 2, 1.0); assert abs(d[0] - 0.4) < 1e-9 and hist_fit([2.0], 0, 2, 2) == [0.0, 1.0]
assert hist_nll([0.5], [0.0, 1.0], 0, 2) == math.inf and abs(hist_nll([0.5, 1.5], [0.5, 0.5], 0, 2) - math.log(2)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a joint table <C>joint[i][j]</C>, write <C>marginal(joint, axis)</C> (axis 0 sums each row, axis 1 each column),{" "}
          <C>conditional(joint, i)</C>, the distribution of the second variable given that the first is i, and{" "}
          <C>sample_index(probs, u)</C> by inverse CDF.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def marginal(joint, axis):
    return joint[0]

def conditional(joint, i):
    return joint[i]

def sample_index(probs, u):
    return 0
`,
        solution: TABLE,
        tests: [
          { name: "marginal and conditional", code: `J = [[0.25, 0.25], [0.0, 0.5]]
assert marginal(J, 0) == [0.5, 0.5] and marginal(J, 1) == [0.25, 0.75] and conditional(J, 0) == [0.5, 0.5] and conditional(J, 1) == [0.0, 1.0]
assert marginal([[0.5, 0.25, 0.25]], 1) == [0.5, 0.25, 0.25]` },
          { name: "sampling", code: `assert sample_index([0.25, 0.5, 0.25], 0.1) == 0 and sample_index([0.25, 0.5, 0.25], 0.25) == 1 and sample_index([0.25, 0.5, 0.25], 0.99) == 2
J = [[0.25, 0.25], [0.0, 0.5]]
i = sample_index(marginal(J, 0), 0.75); assert i == 1 and sample_index(conditional(J, i), 0.0) == 1 and sample_index([1.0], 0.999) == 0` },
        ],
      },
    },
    {
      key: "kl",
      rung: "stretch",
      prompt: (
        <p>
          The data distribution is N(0, 4) (variance 4) and the model is N(0, 1). By how many nats per point does the model&apos;s
          expected negative log-likelihood exceed the best achievable? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.807, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Maximum likelihood needs <M>{"p_\\theta(x)"}</M> to be computable. Some of the most successful generators can sample
        without ever saying how probable a sample is. The next lesson sorts models by what they let you compute, and what that
        costs.
      </p>
    </>
  ),
};
