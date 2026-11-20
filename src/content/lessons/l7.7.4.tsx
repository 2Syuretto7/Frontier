import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TemperatureViz } from "@/components/viz/TemperatureViz";
import type { LessonContent } from "@/lib/types";

const TEMPERATURE = `import math

def log_softmax(z, t):
    m = max(z) / t
    lse = m + math.log(sum(math.exp(v / t - m) for v in z))
    return [v / t - lse for v in z]

def nll_at_t(logit_sets, labels, t):
    return -sum(log_softmax(z, t)[y] for z, y in zip(logit_sets, labels)) / len(labels)

def fit_temperature(logit_sets, labels, iters=100):
    lo, hi = 0.01, 20.0
    for _ in range(iters):
        a, b = lo + (hi - lo) / 3, hi - (hi - lo) / 3
        if nll_at_t(logit_sets, labels, 1 / a) < nll_at_t(logit_sets, labels, 1 / b):
            hi = b
        else:
            lo = a
    return 2 / (lo + hi)`;

const TRAINING = `import math

def smooth_targets(label, k, eps):
    return [1 - eps + eps / k if j == label else eps / k for j in range(k)]

def focal_loss(p_true, gamma):
    return -((1 - p_true) ** gamma) * math.log(p_true)

def mixup(x1, y1, x2, y2, lam):
    x = [lam * a + (1 - lam) * b for a, b in zip(x1, x2)]
    return x, [lam * a + (1 - lam) * b for a, b in zip(y1, y2)]`;

export const lesson: LessonContent = {
  id: "l7.7.4",
  minutes: 40,
  links: {
    requires: ["l2.8.2", "l7.7.1"],
    revisits: ["l3.3.3", "l7.7.2", "l2.8.1"],
    foreshadows: ["l9.4.1"],
  },

  puzzle: (
    <>
      <p>
        A small network from the 1990s that says &ldquo;80% sure&rdquo; is right about 80% of the time. A modern residual
        network, far more accurate, says &ldquo;99% sure&rdquo; and is right perhaps 90% of the time. Better models have
        become worse at knowing how good they are. What changed, and can the damage be repaired after training without
        losing any accuracy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cross-entropy keeps rewarding a network for making its logits larger on examples it already classifies correctly.
        Late in training, with ample capacity and little regularisation, the network does exactly that: training accuracy
        stops changing while confidence keeps climbing, and the excess confidence carries over to test data. Because the
        damage is mostly a uniform inflation of the logits, one number fitted afterwards, a temperature, undoes most of it.
      </p>
      <TemperatureViz />
    </>
  ),

  theory: (
    <>
      <Remark title="the observation">
        <p>
          Guo, Pleiss, Sun and Weinberger (2017) measured the expected calibration error (l2.8.2) of image classifiers and
          found that deeper and wider networks, batch normalisation and weaker weight decay all made it worse, even as
          accuracy improved. During training the test negative log-likelihood began rising long after the test error had
          stopped falling: the network overfits the likelihood, not the labels.
        </p>
      </Remark>

      <Definition title="temperature scaling">
        <p>
          Divide every logit by a temperature T &gt; 0 before the softmax, and choose T to minimise the negative
          log-likelihood on held-out validation data (<C>log_softmax</C>, <C>nll_at_t</C>). T &gt; 1 softens overconfident
          predictions. The predicted class never changes, since dividing by a positive number preserves the order of the
          logits, so accuracy is untouched.
        </p>
      </Definition>

      <Theorem title="the fit is convex">
        <p>
          With β = 1/T, the validation NLL{" "}
          <M>{"\\ell(\\beta) = \\tfrac1n \\sum_i \\big[\\log \\sum_k e^{\\beta z_{ik}} - \\beta z_{i y_i}\\big]"}</M> is convex
          in β, and at its minimum
        </p>
        <MD>{"\\frac1n \\sum_i \\mathbb E_{k \\sim \\operatorname{softmax}(\\beta z_i)}[z_{ik}] = \\frac1n \\sum_i z_{i y_i}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Log-sum-exp of linear functions of β is convex and the second term is linear, so ℓ is convex and a ternary search
          over β finds the minimum (<C>fit_temperature</C>). Its derivative is{" "}
          <M>{"\\tfrac1n \\sum_i \\big[\\sum_k \\operatorname{softmax}(\\beta z_i)_k z_{ik} - z_{i y_i}\\big]"}</M>; setting it to
          zero gives the condition. In words, the average logit of the true class must equal the average logit the model
          expects for its own sample. If every validation example is classified correctly no finite β satisfies it, the NLL
          keeps falling as β grows, and the fitted temperature runs to the edge of the search range: temperature scaling
          needs validation errors to learn from.
        </p>
        <Code>{TEMPERATURE}</Code>
      </Proof>

      <Remark title="measuring it honestly">
        <p>
          The binned ECE is biased upwards when bins hold few examples, because sampling noise alone makes accuracy and
          confidence differ, and it can be lowered by choosing the bins. Equal-mass bins, debiased estimators and reporting
          a proper scoring rule such as the NLL or Brier score alongside it (l2.8.1) all help. &ldquo;Top-label&rdquo; ECE
          checks only the predicted class; classwise calibration, which checks every class probability, is a stronger demand
          that temperature scaling often fails.
        </p>
      </Remark>

      <Definition title="calibration during training">
        <p>
          Label smoothing (l3.3.3) trains against <M>{"(1 - \\epsilon) e_y + \\epsilon / K"}</M> (<C>smooth_targets</C>), so
          the optimal logits are finite. Focal loss multiplies the cross-entropy by <M>{"(1 - p_y)^\\gamma"}</M>{" "}
          (<C>focal_loss</C>), down-weighting examples that are already confident, which acts like an entropy bonus. Mixup
          trains on convex combinations of pairs of inputs and of their labels (<C>mixup</C>), teaching intermediate
          confidence between classes. All three improve calibration; label smoothing also erases information that
          distillation relies on, a reason it is sometimes avoided for teacher models.
        </p>
        <Code>{TRAINING}</Code>
      </Definition>

      <Remark title="under distribution shift">
        <p>
          Ovadia et al. (2019) found that calibration on held-out data from the training distribution predicts little about
          calibration under shift: as corruptions grow, every method becomes overconfident, temperature scaling included,
          while deep ensembles (l7.7.2) degrade the most gracefully. A single temperature cannot know that a particular input
          is unusual; epistemic uncertainty can.
        </p>
      </Remark>

      <Remark title="language models">
        <p>
          Large pretrained language models are often well calibrated on multiple-choice questions: the probability they assign
          to an answer tracks how often it is right. Post-training with human feedback (l9.4.1) tends to destroy this,
          pushing probabilities towards 0 and 1, because the objective rewards confident, preferred answers rather than
          honest probabilities. Asking the model for a verbal confidence, or recalibrating on a held-out set, recovers some of
          it, and conformal prediction offers a different promise: sets of answers that contain the truth with a guaranteed
          frequency, whatever the model.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "soft",
      rung: "check",
      prompt: <p>A classifier outputs logits (3, 1, 0). After temperature scaling with T = 2, what probability does it give its top class? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.6285, tolerance: 0.0001 },
    },
    {
      key: "floor",
      rung: "check",
      prompt: <p>With label smoothing ε = 0.1 over 10 classes, what is the lowest cross-entropy any prediction can reach against a smoothed target, in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5003, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can a modern network become more overconfident late in training even though its accuracy is still improving or flat?</p>,
      answer: {
        kind: "choice",
        options: [
          "Cross-entropy keeps falling as correct logits grow, so the network inflates its logits and overfits the likelihood rather than the labels",
          "Batch normalisation makes the softmax outputs sum to more than one",
          "Accuracy and confidence are always equal on training data, so test confidence must exceed test accuracy",
          "Larger networks use a smaller default temperature in their softmax",
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

def log_softmax(z, t):
    m = max(z) / t
    lse = m + math.log(sum(math.exp(v / t - m) for v in z))
    return [v / t - lse for v in z]

def nll_at_t(logit_sets, labels, t):
    return -sum(log_softmax(z, t)[y] for z, y in zip(logit_sets, labels)) / len(labels)

def fit_temperature(logit_sets, labels, iters=100):
    lo, hi = 0.01, 20.0
    for _ in range(iters):
        a, b = lo + (hi - lo) / 3, hi - (hi - lo) / 3
        if nll_at_t(logit_sets, labels, 1 / a) < nll_at_t(logit_sets, labels, 1 / b):
            hi = b
        else:
            lo = a
    return 2 / (lo + hi)

print([round(v, 4) for v in log_softmax([2, 0], 2)], round(nll_at_t([[0, 0]], [1], 5), 4))
print(round(fit_temperature([[4, 0]] * 4, [0, 0, 0, 1]), 3), round(fit_temperature([[1, 0], [0, 1]], [0, 1]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.3133, -1.3133] 0.6931\n3.641 0.05",
          "[-0.1269, -2.1269] 0.6931\n3.641 0.05",
          "[-0.3133, -1.3133] 0.6931\n3.641 20.0",
          "[-0.3133, -1.3133] 0.1386\n3.641 0.05",
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

def smooth_targets(label, k, eps):
    return [1 - eps + eps / k if j == label else eps / k for j in range(k)]

def focal_loss(p_true, gamma):
    return -((1 - p_true) ** gamma) * math.log(p_true)

def mixup(x1, y1, x2, y2, lam):
    x = [lam * a + (1 - lam) * b for a, b in zip(x1, x2)]
    return x, [lam * a + (1 - lam) * b for a, b in zip(y1, y2)]

print([round(v, 3) for v in smooth_targets(2, 4, 0.2)], round(focal_loss(0.5, 0), 4), round(focal_loss(0.5, 2), 4))
print(mixup([0, 2], [1, 0], [4, 6], [0, 1], 0.25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.05, 0.05, 0.85, 0.05] 0.6931 0.1733\n([3.0, 5.0], [0.25, 0.75])",
          "[0.05, 0.05, 0.8, 0.05] 0.6931 0.1733\n([3.0, 5.0], [0.25, 0.75])",
          "[0.05, 0.05, 0.85, 0.05] 0.6931 0.3466\n([3.0, 5.0], [0.25, 0.75])",
          "[0.05, 0.05, 0.85, 0.05] 0.6931 0.1733\n([1.0, 3.0], [0.75, 0.25])",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_softmax(z, t)</C>, stable for large logits, <C>nll_at_t(logit_sets, labels, t)</C>, the mean negative
          log-likelihood at temperature t, and <C>fit_temperature(logit_sets, labels, iters=100)</C>, which returns the
          temperature found by ternary search over the inverse temperature in [0.01, 20].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_softmax(z, t):
    return z

def nll_at_t(logit_sets, labels, t):
    return 0.0

def fit_temperature(logit_sets, labels, iters=100):
    return 1.0
`,
        solution: TEMPERATURE,
        tests: [
          { name: "log-softmax and NLL", code: `assert abs(sum(math.exp(v) for v in log_softmax([1, 2, 3], 0.5)) - 1) < 1e-12 and abs(log_softmax([1000, 0], 1)[1] + 1000) < 1e-9
assert abs(nll_at_t([[2, 0], [0, 2]], [0, 0], 1) - 0.5 * (math.log(1 + math.exp(-2)) + math.log(1 + math.exp(2)))) < 1e-12` },
          { name: "temperature", code: `assert abs(fit_temperature([[3, 0]] * 3, [0, 0, 1]) - 3 / math.log(2)) < 1e-3 and fit_temperature([[0, 1, 0]] * 2, [1, 1]) < 0.06` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>smooth_targets(label, k, eps)</C>, <C>focal_loss(p_true, gamma)</C> and{" "}
          <C>mixup(x1, y1, x2, y2, lam)</C>, which returns the mixed input and the mixed label vector with weight lam on the
          first example.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def smooth_targets(label, k, eps):
    return [0.0] * k

def focal_loss(p_true, gamma):
    return -math.log(p_true)

def mixup(x1, y1, x2, y2, lam):
    return x1, y1
`,
        solution: TRAINING,
        tests: [
          { name: "smoothing and focal", code: `assert smooth_targets(0, 2, 0.0) == [1.0, 0.0] and abs(sum(smooth_targets(3, 5, 0.3)) - 1) < 1e-12 and abs(smooth_targets(1, 5, 0.5)[1] - 0.6) < 1e-12
assert abs(focal_loss(0.25, 1) - 0.75 * math.log(4)) < 1e-12 and focal_loss(1.0, 2) == 0` },
          { name: "mixup", code: `x, y = mixup([1, 1], [1, 0, 0], [3, 5], [0, 0, 1], 0.5); assert x == [2.0, 3.0] and y == [0.5, 0.0, 0.5]
x, y = mixup([1, 2], [1, 0], [7, 9], [0, 1], 0.75); assert x == [2.5, 3.75] and y == [0.75, 0.25]` },
        ],
      },
    },
    {
      key: "margin",
      rung: "stretch",
      prompt: (
        <p>
          A binary classifier gives every validation example a logit gap of 4 between its predicted class and the other one,
          and 80% of its predictions are correct. What temperature does fitting by validation NLL choose? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.885, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This closes the course on generative modelling and uncertainty. The diffusion and multimodal models of later courses
        build on its score functions, latent variables and tokenisers, and the evaluation course returns to the question
        this lesson asked of classifiers: how far to trust what a model says about itself.
      </p>
    </>
  ),
};
