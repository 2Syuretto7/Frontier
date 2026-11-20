import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SpikySmoothViz } from "@/components/viz/SpikySmoothViz";
import type { LessonContent } from "@/lib/types";

const RULES = `def nearest_neighbour(xs, ys, x):
    i = min(range(len(xs)), key=lambda j: abs(xs[j] - x))
    return ys[i]

def singular_nw(xs, ys, x, h, a):
    num = den = 0.0
    for xi, yi in zip(xs, ys):
        d = abs(x - xi) / h
        if d == 0:
            return yi
        if d <= 1:
            w = d ** -a
            num += w * yi
            den += w
    return num / den if den > 0 else 0.0

def interpolates(rule, xs, ys):
    return all(rule(x) == y for x, y in zip(xs, ys))`;

const COVER = `def bayes_risk(etas, probs):
    return sum(p * min(e, 1 - e) for e, p in zip(etas, probs))

def nn_asymptotic_risk(etas, probs):
    return sum(p * 2 * e * (1 - e) for e, p in zip(etas, probs))

def cover_hart_bound(r):
    return 2 * r * (1 - r)`;

export const lesson: LessonContent = {
  id: "m16.7.2",
  minutes: 45,
  links: {
    requires: ["m16.7.1", "m16.1.2"],
    revisits: ["m15.5.3", "l1.4.1"],
    foreshadows: ["m16.7.3"],
  },

  puzzle: (
    <>
      <p>
        A rule that reproduces every training label, noise included, seems to have learnt the noise. Classical advice says
        such a rule cannot be statistically optimal: some smoothing is needed to average the noise away. Is that true? Can a
        method fit noisy data exactly and still have test error that tends to the best possible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        What matters is not whether the fit passes through the data but how much of the input space the noise is allowed to
        affect. Nearest neighbour lets each noisy label rule a whole cell, so the noise never averages out. A rule that is
        a smooth average almost everywhere, with a thin spike up to each data point, also interpolates; but as the sample
        grows the spikes occupy a vanishing part of the space and the error goes to zero.
      </p>
      <SpikySmoothViz />
    </>
  ),

  theory: (
    <>
      <Definition title="interpolation">
        <p>
          A learning rule interpolates if its output satisfies <M>{"\\hat f(x_i) = y_i"}</M> for every training example
          (<C>interpolates</C>). For classification with noisy labels this means zero training error; for regression it
          means the training residuals are exactly zero. A rule is consistent if its risk tends to the Bayes risk as{" "}
          <M>{"m \\to \\infty"}</M>.
        </p>
      </Definition>

      <Theorem title="Cover and Hart">
        <p>
          For binary classification with regression function <M>{"\\eta(x) = P(y = 1 \\mid x)"}</M>, the risk of the nearest
          neighbour rule tends to
        </p>
        <MD>{"R_{\\mathrm{NN}} = \\mathbb E\\, 2\\eta(x)(1 - \\eta(x)), \\qquad R^* \\le R_{\\mathrm{NN}} \\le 2R^*(1 - R^*),"}</MD>
        <p>where <M>{"R^* = \\mathbb E \\min(\\eta, 1 - \\eta)"}</M> is the Bayes risk.</p>
      </Theorem>
      <Proof>
        <p>
          As m grows the nearest neighbour <M>{"x_{(1)}"}</M> of x converges to x, so its label is an independent draw with
          probability close to <M>{"\\eta(x)"}</M> of being 1. Two independent labels with this probability disagree with probability{" "}
          <M>{"2\\eta(1 - \\eta)"}</M>. Writing <M>{"r = \\min(\\eta, 1 - \\eta)"}</M>, this is <M>{"2r(1 - r) \\ge r"}</M>, and{" "}
          <M>{"\\mathbb E\\, 2r(1 - r) = 2R^* - 2\\mathbb E r^2 \\le 2R^* - 2(R^*)^2"}</M> by Jensen. Unless the labels are deterministic,{" "}
          <M>{"R_{\\mathrm{NN}} > R^*"}</M>: nearest neighbour interpolates and is not consistent. In regression the same argument
          shows its excess risk tends to the noise variance (<C>nearest_neighbour</C>, <C>nn_asymptotic_risk</C>).
        </p>
        <Code>{COVER}</Code>
      </Proof>

      <Theorem title="interpolation can be consistent">
        <p>
          In ℝ<sup>d</sup> let <M>{"K(u) = \\|u\\|^{-a}\\,\\mathbb 1[\\|u\\| \\le 1]"}</M> with <M>{"0 < a < d/2"}</M>, and
        </p>
        <MD>{"\\hat f(x) = \\frac{\\sum_i K\\big((x - x_i)/h\\big)\\, y_i}{\\sum_i K\\big((x - x_i)/h\\big)}."}</MD>
        <p>
          Then <M>{"\\hat f"}</M> interpolates, and if <M>{"h \\to 0"}</M> with <M>{"mh^d \\to \\infty"}</M>, its risk tends to the Bayes
          risk for any bounded noise and Lipschitz regression function (Devroye, Györfi and Krzyżak; with rates, Belkin,
          Rakhlin and Tsybakov).
        </p>
      </Theorem>
      <Proof>
        <p>
          As <M>{"x \\to x_i"}</M> the weight of example i tends to infinity while the others stay bounded, so{" "}
          <M>{"\\hat f(x_i) = y_i"}</M> (<C>singular_nw</C>). Away from the data <M>{"\\hat f"}</M> is a weighted average of labels within
          distance h. Its bias is at most L h, which tends to 0. Its variance is{" "}
          <M>{"\\sigma^2 \\sum_i w_i^2 / (\\sum_i w_i)^2"}</M>, which behaves like{" "}
          <M>{"\\sigma^2 \\int K^2 / (m h^d (\\int K)^2)"}</M>. The integral <M>{"\\int_{\\|u\\| \\le 1} \\|u\\|^{-2a}\\, du"}</M> is finite exactly when{" "}
          <M>{"2a < d"}</M>, so the variance tends to 0 as <M>{"mh^d \\to \\infty"}</M>. The singularity is strong enough to force
          interpolation but too weak to matter on average.
        </p>
        <Code>{RULES}</Code>
      </Proof>

      <Remark title="spiky but smooth">
        <p>
          The picture generalises. Many interpolating estimators decompose as a good, non-interpolating estimator plus spikes
          that fit the residual noise at each sample and have small <M>{"L^2"}</M> norm. Minimum-norm linear regression in high
          dimension is of this kind when the covariance has many small eigenvalues that can absorb the noise without
          distorting predictions, which is the benign overfitting of m15.5.3. The same happens for ridgeless kernel
          regression in high dimension, where the curvature of the kernel acts as an implicit ridge penalty.
        </p>
      </Remark>

      <Remark title="what the classical bounds miss">
        <p>
          Uniform convergence bounds the gap between training and test error for every hypothesis in a class at once. For an
          interpolating rule the training error is zero and the test error is near the noise level, so any valid uniform
          bound must be at least that large: even the tightest such bound cannot certify consistency (Nagarajan and Kolter).
          Analyses of interpolation must instead follow the specific algorithm, through its geometry or its stability, which
          is what the last two lessons do.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "constant",
      rung: "check",
      prompt: <p>The label noise is the same everywhere: η(x) = 0.1 for all x. What is the asymptotic risk of nearest neighbour?</p>,
      answer: { kind: "numeric", value: 0.18, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>The Bayes risk is 0.05. What is the Cover–Hart upper bound on the asymptotic nearest neighbour risk?</p>,
      answer: { kind: "numeric", value: 0.095, tolerance: 0.0001 },
    },
    {
      key: "exponent",
      rung: "apply",
      prompt: <p>Why must the singular kernel |u|^(−a) have a &lt; d/2 for the interpolating estimator to be consistent?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that the integral of K² is finite, which keeps the variance of the weighted average bounded by a multiple of 1/(mh^d)",
          "So that the estimator interpolates the data",
          "So that the bias is at most Lh",
          "So that the weights sum to one",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def nearest_neighbour(xs, ys, x):
    i = min(range(len(xs)), key=lambda j: abs(xs[j] - x))
    return ys[i]

def singular_nw(xs, ys, x, h, a):
    num = den = 0.0
    for xi, yi in zip(xs, ys):
        d = abs(x - xi) / h
        if d == 0:
            return yi
        if d <= 1:
            w = d ** -a
            num += w * yi
            den += w
    return num / den if den > 0 else 0.0

def interpolates(rule, xs, ys):
    return all(rule(x) == y for x, y in zip(xs, ys))

xs, ys = [0.0, 1.0, 3.0], [2.0, 4.0, 0.0]; print(nearest_neighbour(xs, ys, 1.9), nearest_neighbour(xs, ys, 2.5), singular_nw(xs, ys, 1.0, 1.0, 0.5), round(singular_nw(xs, ys, 0.25, 1.0, 0.5), 4))
print(singular_nw(xs, ys, 10.0, 1.0, 0.5), interpolates(lambda x: singular_nw(xs, ys, x, 0.5, 0.5), xs, ys), interpolates(lambda x: sum(ys) / 3, xs, ys))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 0.0 4.0 2.7321\n0.0 True False",
          "4.0 4.0 4.0 2.7321\n0.0 True False",
          "4.0 0.0 3.0 2.7321\n0.0 True False",
          "4.0 0.0 4.0 3.0\n2.0 True True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bayes_risk(etas, probs):
    return sum(p * min(e, 1 - e) for e, p in zip(etas, probs))

def nn_asymptotic_risk(etas, probs):
    return sum(p * 2 * e * (1 - e) for e, p in zip(etas, probs))

def cover_hart_bound(r):
    return 2 * r * (1 - r)

print(bayes_risk([0.5, 0.0], [0.5, 0.5]), nn_asymptotic_risk([0.5, 0.0], [0.5, 0.5]), round(nn_asymptotic_risk([0.25], [1.0]), 4))
print(cover_hart_bound(0.25), cover_hart_bound(0.5), cover_hart_bound(0.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 0.25 0.375\n0.375 0.5 0.0",
          "0.25 0.5 0.375\n0.375 0.5 0.0",
          "0.25 0.25 0.1875\n0.375 0.5 0.0",
          "0.5 0.25 0.375\n0.5 1.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nearest_neighbour(xs, ys, x)</C> for scalar inputs (ties go to the earlier example),{" "}
          <C>singular_nw(xs, ys, x, h, a)</C> returning <C>yi</C> when x equals a sample and 0.0 when no sample is within h,
          and <C>interpolates(rule, xs, ys)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def nearest_neighbour(xs, ys, x):
    return ys[0]

def singular_nw(xs, ys, x, h, a):
    return sum(ys) / len(ys)

def interpolates(rule, xs, ys):
    return True
`,
        solution: RULES,
        tests: [
          { name: "rules", code: `xs, ys = [0.0, 2.0, 5.0], [1.0, -1.0, 3.0]
assert nearest_neighbour(xs, ys, 1.0) == 1.0 and nearest_neighbour(xs, ys, 4.0) == 3.0 and singular_nw(xs, ys, 2.0, 1.0, 0.3) == -1.0 and singular_nw(xs, ys, 3.5, 1.0, 0.3) == 0.0
assert abs(singular_nw(xs, ys, 1.0, 4.0, 1.0) - 1 / 3) < 1e-12 and abs(singular_nw(xs, ys, 0.5, 2.0, 1.0) - (4 * 1 - (4 / 3)) / (4 + 4 / 3)) < 1e-12` },
          { name: "interpolation", code: `xs, ys = [0.0, 1.0], [5.0, 7.0]
assert interpolates(lambda x: nearest_neighbour(xs, ys, x), xs, ys) and not interpolates(lambda x: 6.0, xs, ys) and interpolates(lambda x: 5.0 + 2 * x, xs, ys)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a distribution with finitely many inputs, <C>etas[k]</C> is η at input k and <C>probs[k]</C> its probability. Write{" "}
          <C>bayes_risk(etas, probs)</C>, <C>nn_asymptotic_risk(etas, probs)</C> and <C>cover_hart_bound(r)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bayes_risk(etas, probs):
    return 0.0

def nn_asymptotic_risk(etas, probs):
    return 0.0

def cover_hart_bound(r):
    return r
`,
        solution: COVER,
        tests: [
          { name: "risks", code: `assert abs(bayes_risk([0.2, 0.9], [0.5, 0.5]) - 0.15) < 1e-12 and abs(nn_asymptotic_risk([0.2, 0.9], [0.5, 0.5]) - 0.25) < 1e-12 and bayes_risk([1.0, 0.0], [0.3, 0.7]) == 0` },
          { name: "bound", code: `assert abs(cover_hart_bound(0.1) - 0.18) < 1e-12 and abs(cover_hart_bound(0.3) - 0.42) < 1e-12 and nn_asymptotic_risk([0.3], [1.0]) <= cover_hart_bound(bayes_risk([0.3], [1.0])) + 1e-12` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          Let x be uniform on [0, 1] and η(x) = x². What is the ratio of the asymptotic nearest neighbour risk to the Bayes
          risk? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.366, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        When a model can interpolate in many ways, which interpolant do we get? With no explicit regulariser the answer is
        decided by the optimiser. The next lesson shows that gradient descent has a preference of its own.
      </p>
    </>
  ),
};
