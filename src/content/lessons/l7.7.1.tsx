import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UncertaintyViz } from "@/components/viz/UncertaintyViz";
import type { LessonContent } from "@/lib/types";

const CLASSIFY = `import math

def entropy(p):
    return sum(-q * math.log(q) for q in p if q > 0)

def mean_probs(member_probs):
    n = len(member_probs)
    return [sum(m[k] for m in member_probs) / n for k in range(len(member_probs[0]))]

def decompose(member_probs):
    total = entropy(mean_probs(member_probs))
    aleatoric = sum(entropy(m) for m in member_probs) / len(member_probs)
    return total, aleatoric, total - aleatoric`;

const REGRESS = `import math

def gaussian_nll(y, mu, var):
    return 0.5 * math.log(2 * math.pi * var) + (y - mu) ** 2 / (2 * var)

def total_variance(mus, variances):
    n = len(mus)
    m = sum(mus) / n
    return sum(variances) / n, sum((u - m) ** 2 for u in mus) / n

def best_constant_var(residuals):
    return sum(r * r for r in residuals) / len(residuals)`;

export const lesson: LessonContent = {
  id: "l7.7.1",
  minutes: 40,
  links: {
    requires: ["m12.2.3", "l2.5.3"],
    revisits: ["m12.1.2", "l7.1.1"],
    foreshadows: ["l7.7.2", "l7.7.3", "l7.7.4"],
  },

  puzzle: (
    <>
      <p>
        A model that reads chest X-rays says &ldquo;60% pneumonia&rdquo; for two different images. For the first, it has seen
        thousands of similar images, and among them pneumonia really is present about 60% of the time: the image is
        genuinely ambiguous. The second comes from a scanner it has never seen, and its 60% is close to a guess. The same
        number hides two very different situations. How can a model tell them apart, and why does it matter which one a
        doctor is facing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <em>Aleatoric</em> uncertainty is randomness in the data itself: noise in measurements, labels that genuinely vary,
        outcomes that cannot be predicted from the inputs. More data does not reduce it; it only pins it down. <em>Epistemic</em>{" "}
        uncertainty is the model&apos;s ignorance: too little data, or data unlike anything seen in training. More data of the
        right kind reduces it.
      </p>
      <p>
        To separate them, keep not one model but a distribution over plausible models. Where the plausible models agree on a
        noisy prediction, the uncertainty is aleatoric; where they disagree, it is epistemic. An ensemble or a Bayesian
        posterior provides such a set.
      </p>
      <UncertaintyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="predictive distribution">
        <p>
          Given a posterior or other distribution q(θ) over parameters, the predictive distribution is{" "}
          <M>{"p(y \\mid x) = \\mathbb{E}_{q(\\theta)}[p(y \\mid x, \\theta)]"}</M>, approximated with members{" "}
          <M>{"\\theta_1, \\dots, \\theta_M"}</M> by averaging their predictions (<C>mean_probs</C>).
        </p>
      </Definition>

      <Theorem title="decomposing entropy">
        <MD>{"\\underbrace{H\\big[\\mathbb{E}_q\\, p(y \\mid x, \\theta)\\big]}_{\\text{total}} = \\underbrace{\\mathbb{E}_q H\\big[p(y \\mid x, \\theta)\\big]}_{\\text{aleatoric}} + \\underbrace{I(y; \\theta \\mid x)}_{\\text{epistemic}},"}</MD>
        <p>and the epistemic term is non-negative, zero exactly when all members agree.</p>
      </Theorem>
      <Proof>
        <p>
          Treat θ as random with distribution q and y as drawn from <M>{"p(y \\mid x, \\theta)"}</M>. The mutual information is{" "}
          <M>{"I(y; \\theta) = H(y) - H(y \\mid \\theta)"}</M> (m12.2.3). Here H(y) is the entropy of the marginal of y, the
          predictive distribution, and <M>{"H(y \\mid \\theta)"}</M> is the average entropy of the members&apos; predictions.
          Mutual information is non-negative and zero exactly when y is independent of θ, that is, when every member predicts
          the same distribution (<C>entropy</C>, <C>decompose</C>). Choosing inputs with large epistemic term for labelling is
          the BALD rule of active learning.
        </p>
        <Code>{CLASSIFY}</Code>
      </Proof>

      <Theorem title="decomposing variance">
        <p>
          If member m predicts a Gaussian with mean <M>{"\\mu_m(x)"}</M> and variance <M>{"\\sigma_m^2(x)"}</M>, the predictive variance is
        </p>
        <MD>{"\\operatorname{Var}(y) = \\underbrace{\\overline{\\sigma^2_m}}_{\\text{aleatoric}} + \\underbrace{\\overline{(\\mu_m - \\bar\\mu)^2}}_{\\text{epistemic}},"}</MD>
        <p>bars denoting averages over members.</p>
      </Theorem>
      <Proof>
        <p>
          This is the law of total variance,{" "}
          <M>{"\\operatorname{Var}(y) = \\mathbb{E}[\\operatorname{Var}(y \\mid \\theta)] + \\operatorname{Var}(\\mathbb{E}[y \\mid \\theta])"}</M>, with θ uniform over
          members (<C>total_variance</C>).
        </p>
      </Proof>

      <Definition title="learning aleatoric noise">
        <p>
          A regression network that outputs both a mean and a variance, trained on the Gaussian negative log-likelihood{" "}
          <M>{"\\tfrac12 \\log(2\\pi\\sigma^2) + (y - \\mu)^2 / 2\\sigma^2"}</M> (<C>gaussian_nll</C>), learns input-dependent,
          heteroscedastic noise. For fixed residuals the best constant variance is their mean square (<C>best_constant_var</C>),
          so the network learns to predict the size of its own errors. Without a distribution over parameters, it captures only
          aleatoric uncertainty, and it can be confidently wrong far from the data.
        </p>
        <Code>{REGRESS}</Code>
      </Definition>

      <Remark title="caveats">
        <p>
          The split depends on the model class: noise that a richer model could explain counts as aleatoric for a poor one. The
          epistemic term is only as good as the distribution over parameters; a set of members that all make the same mistake
          reports no epistemic uncertainty at all. The next lessons build such sets, by ensembling (l7.7.2) and by approximate
          Bayesian inference (l7.7.3), and ask whether the resulting probabilities are calibrated (l7.7.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mi",
      rung: "check",
      prompt: <p>Two ensemble members predict class probabilities (0.9, 0.1) and (0.5, 0.5). What is the epistemic part of the predictive entropy, in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1017, tolerance: 0.0001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>Three regression members predict means 1, 2 and 3, each with variance 0.5. What is the total predictive variance? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.1667, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>A team collects ten times more training data of the same kind. Which uncertainty should fall, and where?</p>,
      answer: {
        kind: "choice",
        options: [
          "Epistemic uncertainty, mainly in regions where data were sparse; aleatoric uncertainty stays roughly the same",
          "Aleatoric uncertainty everywhere; epistemic stays the same",
          "Both fall to zero",
          "Neither changes, since the model class is fixed",
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

def entropy(p):
    return sum(-q * math.log(q) for q in p if q > 0)

def mean_probs(member_probs):
    n = len(member_probs)
    return [sum(m[k] for m in member_probs) / n for k in range(len(member_probs[0]))]

def decompose(member_probs):
    total = entropy(mean_probs(member_probs))
    aleatoric = sum(entropy(m) for m in member_probs) / len(member_probs)
    return total, aleatoric, total - aleatoric

print([round(v, 4) for v in decompose([[0.5, 0.5], [0.5, 0.5]])], [round(v, 4) for v in decompose([[1.0, 0.0], [0.0, 1.0]])])
print(mean_probs([[0.9, 0.1], [0.5, 0.5]]), round(entropy([1.0, 0.0]), 4), round(entropy([0.25] * 4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.6931, 0.6931, 0.0] [0.6931, 0.0, 0.6931]\n[0.7, 0.3] 0.0 1.3863",
          "[0.6931, 0.0, 0.6931] [0.6931, 0.6931, 0.0]\n[0.7, 0.3] 0.0 1.3863",
          "[0.6931, 0.6931, 0.0] [0.0, 0.0, 0.0]\n[0.7, 0.3] 0.0 1.3863",
          "[0.6931, 0.6931, 0.0] [0.6931, 0.0, 0.6931]\n[0.7, 0.3] 0.0 0.6931",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def gaussian_nll(y, mu, var):
    return 0.5 * math.log(2 * math.pi * var) + (y - mu) ** 2 / (2 * var)

def total_variance(mus, variances):
    n = len(mus)
    m = sum(mus) / n
    return sum(variances) / n, sum((u - m) ** 2 for u in mus) / n

def best_constant_var(residuals):
    return sum(r * r for r in residuals) / len(residuals)

print(round(gaussian_nll(1, 0, 1), 4), total_variance([0, 2], [1, 1]), total_variance([1, 1], [0.5, 1.5]))
print(round(best_constant_var([1, -1, 3]), 4), round(gaussian_nll(3, 0, best_constant_var([3])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.4189 (1.0, 1.0) (1.0, 0.0)\n3.6667 2.5176",
          "1.4189 (1.0, 2.0) (1.0, 0.0)\n3.6667 2.5176",
          "0.9189 (1.0, 1.0) (1.0, 0.0)\n3.6667 2.5176",
          "1.4189 (1.0, 1.0) (1.0, 0.0)\n1.0 2.5176",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>entropy(p)</C> in nats, <C>mean_probs(member_probs)</C> and <C>decompose(member_probs)</C>, returning the total,
          aleatoric and epistemic parts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def entropy(p):
    return 0.0

def mean_probs(member_probs):
    return member_probs[0]

def decompose(member_probs):
    return 0.0, 0.0, 0.0
`,
        solution: CLASSIFY,
        tests: [
          { name: "entropy and mean", code: `assert entropy([1.0, 0.0]) == 0 and abs(entropy([0.5, 0.25, 0.25]) - 1.5 * math.log(2)) < 1e-12 and mean_probs([[1, 0], [0, 1], [0.5, 0.5]]) == [0.5, 0.5]` },
          { name: "decomposition", code: `t, a, e = decompose([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]]); assert abs(t - math.log(2)) < 1e-12 and a == 0 and abs(e - math.log(2)) < 1e-12
t, a, e = decompose([[0.2, 0.8]] * 3); assert abs(t - a) < 1e-12 and abs(e) < 1e-12 and abs(a - entropy([0.2, 0.8])) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_nll(y, mu, var)</C>, <C>total_variance(mus, variances)</C>, returning the aleatoric and epistemic parts,
          and <C>best_constant_var(residuals)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_nll(y, mu, var):
    return (y - mu) ** 2

def total_variance(mus, variances):
    return 0.0, 0.0

def best_constant_var(residuals):
    return 1.0
`,
        solution: REGRESS,
        tests: [
          { name: "nll", code: `assert abs(gaussian_nll(2.0, 2.0, 1.0) - 0.5 * math.log(2 * math.pi)) < 1e-12 and abs(gaussian_nll(0.0, 2.0, 4.0) - 0.5 * math.log(8 * math.pi) - 0.5) < 1e-12` },
          { name: "variances", code: `assert total_variance([0, 4], [1, 3]) == (2.0, 4.0) and total_variance([5], [0.25]) == (0.25, 0.0)
assert best_constant_var([2, -2]) == 4.0 and best_constant_var([0, 3]) == 4.5` },
        ],
      },
    },
    {
      key: "hetero",
      rung: "stretch",
      prompt: (
        <p>
          A network predicting a mean and a variance sees one example whose residual from its mean is 2. If it chooses the
          variance that minimises the Gaussian negative log-likelihood, what is that loss? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.112, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The simplest way to get a set of plausible models is to train several networks from different random starts. The
        next lesson asks why such deep ensembles work so well, and what they cost.
      </p>
    </>
  ),
};
