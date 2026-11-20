import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SampleWiseViz } from "@/components/viz/SampleWiseViz";
import type { LessonContent } from "@/lib/types";

const RISK = `import math

def ridgeless_risk(p, n, r2, s2):
    g = p / n
    if g < 1:
        return s2 * g / (1 - g)
    if g > 1:
        return r2 * (1 - 1 / g) + s2 / (g - 1)
    return math.inf

def more_data_hurts(p, n1, n2, r2, s2):
    return ridgeless_risk(p, n2, r2, s2) > ridgeless_risk(p, n1, r2, s2)

def worst_n(p, ns, r2, s2):
    return max(ns, key=lambda n: ridgeless_risk(p, n, r2, s2))`;

const EMC = `import random

def corrupt_labels(labels, frac, num_classes, seed):
    rng = random.Random(seed)
    out = list(labels)
    for i in rng.sample(range(len(out)), int(frac * len(out))):
        out[i] = rng.choice([c for c in range(num_classes) if c != out[i]])
    return out

def emc(train_error, eps):
    ok = [n for n, e in train_error.items() if e <= eps]
    return max(ok) if ok else 0

def regime(n, complexity, band=0.1):
    if n < (1 - band) * complexity:
        return "over"
    if n > (1 + band) * complexity:
        return "under"
    return "critical"`;

export const lesson: LessonContent = {
  id: "l10.6.3",
  minutes: 50,
  links: {
    requires: ["l10.6.2", "l1.5.1"],
    revisits: ["m16.7.1", "m16.7.2", "l3.7.1"],
    foreshadows: ["l10.6.4", "l10.7.2", "l8.4.1"],
  },

  puzzle: (
    <>
      <p>
        The classical bias–variance picture says test error is U-shaped in model size: too small underfits, too large overfits. Nakkiran
        et al. (2019) trained ResNets and transformers of increasing width and found test error that rises towards the size at which the
        model can just fit its training set, then falls again, often below the earlier minimum. Stranger still, for a fixed model,
        adding training data could make test error worse, and training for longer could make it worse and then better. One idea
        explains all three.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Trouble comes at the interpolation threshold, where the model has just enough capacity to fit every training label, noise
        included. There it has exactly one way to do so, and that way is wild. With much less capacity it cannot chase the noise; with
        much more, it has many ways to fit, and training picks a smooth one. Anything that moves a setting towards the threshold, more
        parameters, more data or more training, can raise test error.
      </p>
      <SampleWiseViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="ridgeless risk with isotropic features">
        <p>
          Let features be independent standard normal in p dimensions, the target linear with coefficient norm <M>{"r^2"}</M>, and noise
          variance <M>{"\\sigma^2"}</M>, with n training examples and <M>{"\\gamma = p/n"}</M>. As n and p grow with fixed γ, minimum-norm
          least squares has excess test risk
        </p>
        <MD>{"R(\\gamma) = \\begin{cases} \\sigma^2\\,\\dfrac{\\gamma}{1-\\gamma}, & \\gamma < 1,\\\\[2mm] r^2\\Bigl(1 - \\dfrac1\\gamma\\Bigr) + \\dfrac{\\sigma^2}{\\gamma - 1}, & \\gamma > 1,\\end{cases}"}</MD>
        <p>which diverges at γ = 1 (Hastie et al., 2022; <C>ridgeless_risk</C>).</p>
      </Theorem>
      <Proof>
        <p>
          A sketch; m16.7.1 develops the analysis. Below the threshold the estimator is unbiased, and its variance is{" "}
          <M>{"\\sigma^2\\operatorname{tr}((X^\\top X)^{-1})"}</M>; for Gaussian X the expected trace is <M>{"p/(n - p - 1)"}</M>, which tends to{" "}
          <M>{"\\gamma/(1-\\gamma)"}</M>. Above it, the minimum-norm fit lies in the n-dimensional row space of X, so it misses the part of
          the coefficient vector outside that space, a bias of <M>{"r^2(1 - n/p)"}</M>; the noise is fitted through the inverse of{" "}
          <M>{"XX^\\top"}</M>, whose expected trace gives <M>{"\\sigma^2 n/(p - n - 1)"}</M>, tending to <M>{"\\sigma^2/(\\gamma-1)"}</M>. Near
          γ = 1 the smallest singular values of X approach zero and both variance terms blow up.
        </p>
      </Proof>

      <Remark title="sample-wise non-monotonicity">
        <p>
          For fixed p, moving n towards p moves γ towards 1 from above, and the risk rises: more data hurts (<C>more_data_hurts</C>), with
          the worst sample size at the threshold (<C>worst_n</C>). Once n is well past p the classical regime returns and more data helps
          again. Nakkiran et al. observed the same in deep networks, where adding data shifted the peak to larger models and, for a model
          near the old peak, raised test error.
        </p>
        <Code>{RISK}</Code>
      </Remark>

      <Definition title="effective model complexity">
        <p>
          Nakkiran et al. defined the effective model complexity (EMC) of a training procedure as the largest number of examples on which
          it reaches near-zero training error (<C>emc</C>). It depends on architecture, training time and optimiser together. When n is
          well below the EMC the procedure is over-parameterised, when well above it under-parameterised, and near it critical
          (<C>regime</C>), where test error can peak. Longer training raises the EMC, which is how epoch-wise double descent arises: a
          model passes through the critical regime as it trains. Label noise (<C>corrupt_labels</C>) makes the peak far more pronounced,
          because there is more noise to fit at the threshold.
        </p>
        <Code>{EMC}</Code>
      </Definition>

      <Remark title="regularisation removes the peak">
        <p>
          The figure shows ridge with the Bayes-optimal penalty, <M>{"\\lambda = p\\sigma^2/r^2"}</M> for this model, giving test error
          that falls steadily with n. Nakkiran et al. (2020) showed that optimally tuned ridge removes double descent in such linear models;
          in deep networks, weight decay, early stopping and data augmentation often reduce or remove the peak. Double descent is
          therefore mainly a warning about unregularised fits near the threshold, and a demonstration that parameter count alone does not
          measure capacity (m16.7.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "over",
      rung: "check",
      prompt: (
        <p>
          With p = 50 isotropic features, <M>{"r^2 = 1"}</M> and <M>{"\\sigma^2 = 0.25"}</M>, what is the ridgeless excess risk with n = 40
          training examples? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.2, tolerance: 0.005 },
    },
    {
      key: "more",
      rung: "check",
      prompt: <p>In the same setting, what is the risk with n = 45? Give two decimals.</p>,
      answer: { kind: "numeric", value: 2.35, tolerance: 0.005 },
    },
    {
      key: "epoch",
      rung: "apply",
      prompt: (
        <p>
          A network&apos;s test error falls, rises, then falls again over the course of training, with no change to data or size. What
          explains this best?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Training longer increases the effective model complexity, which passes through the number of training examples, the critical regime",
          "The learning rate schedule restarted midway",
          "The test set changed during training",
          "Training error rose in the middle of training",
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

def ridgeless_risk(p, n, r2, s2):
    g = p / n
    if g < 1:
        return s2 * g / (1 - g)
    if g > 1:
        return r2 * (1 - 1 / g) + s2 / (g - 1)
    return math.inf

def more_data_hurts(p, n1, n2, r2, s2):
    return ridgeless_risk(p, n2, r2, s2) > ridgeless_risk(p, n1, r2, s2)

def worst_n(p, ns, r2, s2):
    return max(ns, key=lambda n: ridgeless_risk(p, n, r2, s2))

print(ridgeless_risk(10, 20, 1.0, 1.0), ridgeless_risk(20, 10, 1.0, 1.0), ridgeless_risk(10, 10, 1.0, 0.0))
print(more_data_hurts(10, 5, 9, 1.0, 1.0), worst_n(10, [5, 8, 30], 1.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.5 inf\nTrue 8",
          "1.0 1.0 inf\nTrue 8",
          "1.0 1.5 0.0\nTrue 8",
          "1.0 1.5 inf\nFalse 5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random

def corrupt_labels(labels, frac, num_classes, seed):
    rng = random.Random(seed)
    out = list(labels)
    for i in rng.sample(range(len(out)), int(frac * len(out))):
        out[i] = rng.choice([c for c in range(num_classes) if c != out[i]])
    return out

def emc(train_error, eps):
    ok = [n for n, e in train_error.items() if e <= eps]
    return max(ok) if ok else 0

def regime(n, complexity, band=0.1):
    if n < (1 - band) * complexity:
        return "over"
    if n > (1 + band) * complexity:
        return "under"
    return "critical"

print(emc({100: 0.0, 200: 0.0, 400: 0.12}, 0.01), emc({100: 0.3}, 0.01))
print(regime(50, 100), regime(105, 100), regime(150, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "200 0\nover critical under",
          "400 0\nover critical under",
          "200 100\nover critical under",
          "200 0\nunder critical over",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ridgeless_risk(p, n, r2, s2)</C>, returning <C>math.inf</C> at p = n, <C>more_data_hurts(p, n1, n2, r2, s2)</C>, true
          when n2 examples give higher risk than n1, and <C>worst_n(p, ns, r2, s2)</C>, the first n in the list with the highest risk.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ridgeless_risk(p, n, r2, s2):
    return s2 * p / n

def more_data_hurts(p, n1, n2, r2, s2):
    return False

def worst_n(p, ns, r2, s2):
    return ns[0]
`,
        solution: RISK,
        tests: [
          { name: "risk", code: `assert abs(ridgeless_risk(30, 60, 2.0, 0.5) - 0.5) < 1e-12 and abs(ridgeless_risk(60, 30, 2.0, 0.5) - 1.5) < 1e-12 and ridgeless_risk(7, 7, 1.0, 1.0) == math.inf` },
          { name: "hurts", code: `assert more_data_hurts(20, 10, 15, 1.0, 0.5) and not more_data_hurts(20, 25, 40, 1.0, 0.5) and worst_n(20, [10, 15, 19, 25, 40], 1.0, 0.5) == 19` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>corrupt_labels(labels, frac, num_classes, seed)</C>, which changes exactly <C>int(frac * n)</C> distinct labels to
          different classes using <C>random.Random(seed)</C>, <C>emc(train_error, eps)</C> for a dictionary from n to training error,
          returning 0 if none qualifies, and <C>regime(n, complexity, band=0.1)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import random

def corrupt_labels(labels, frac, num_classes, seed):
    return list(labels)

def emc(train_error, eps):
    return 0

def regime(n, complexity, band=0.1):
    return "critical"
`,
        solution: EMC,
        tests: [
          { name: "noise", code: `y = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0]\nz = corrupt_labels(y, 0.3, 3, 1)\nassert sum(a != b for a, b in zip(y, z)) == 3 and all(0 <= c < 3 for c in z) and z == corrupt_labels(y, 0.3, 3, 1)` },
          { name: "emc", code: `assert emc({50: 0.0, 80: 0.005, 120: 0.2}, 0.01) == 80 and regime(70, 100) == "over" and regime(95, 100) == "critical" and regime(200, 100) == "under"` },
        ],
      },
    },
    {
      key: "recover",
      rung: "stretch",
      prompt: (
        <p>
          With p = 50, <M>{"r^2 = 1"}</M> and <M>{"\\sigma^2 = 0.25"}</M>, the risk at n = 40 is the value you found above. What is the
          smallest n greater than 50 whose risk is no higher?
        </p>
      ),
      answer: { kind: "numeric", value: 61, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Over-parameterised networks have many solutions that fit the data. The last lesson of this module asks how those solutions are
        arranged: whether small subnetworks would do, and whether different solutions are connected.
      </p>
    </>
  ),
};
