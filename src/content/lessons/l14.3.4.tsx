import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RobustFeatureViz } from "@/components/viz/RobustFeatureViz";
import type { LessonContent } from "@/lib/types";

const TRAIN = `import math

def robust_margin(x, y, w, b, eps):
    return y * (sum(wi * xi for wi, xi in zip(w, x)) + b) - eps * sum(abs(wi) for wi in w)

def robust_grad(x, y, w, b, eps):
    s = 1 / (1 + math.exp(robust_margin(x, y, w, b, eps)))          # sigma(-m), the slope of log(1 + e^-m)
    sgn = [(wi > 0) - (wi < 0) for wi in w]
    gw = [-s * (y * xi - eps * si) for xi, si in zip(x, sgn)]        # Danskin: differentiate at the maximiser
    return gw, -s * y

def train(data, eps, lr, steps):
    w, b = [0.0] * len(data[0][0]), 0.0
    for _ in range(steps):
        grads = [robust_grad(x, y, w, b, eps) for x, y in data]
        w = [wi - lr * sum(g[0][i] for g in grads) / len(data) for i, wi in enumerate(w)]
        b -= lr * sum(g[1] for g in grads) / len(data)
    return w, b`;

const TRADE = `from statistics import NormalDist

def robust_accuracy(data, w, b, eps):
    ok = 0
    for x, y in data:
        m = y * (sum(wi * xi for wi, xi in zip(w, x)) + b)
        ok += m - eps * sum(abs(wi) for wi in w) > 0       # correct even at the worst perturbation
    return ok / len(data)

def weak_feature_accuracy(eta, d, eps):
    return NormalDist().cdf((eta - eps) * d ** 0.5)       # averaging d weak features under attack

def robust_feature_accuracy(p, eps, flip=1.0):
    return p if eps < flip else 1 - p                      # a feature that needs a large change to flip`;

export const lesson: LessonContent = {
  id: "l14.3.4",
  minutes: 50,
  links: {
    requires: ["l14.3.1", "l14.3.3"],
    revisits: ["l14.3.2", "l14.1.3"],
    foreshadows: ["l14.4.2"],
  },

  puzzle: (
    <>
      <p>
        A team finds thousands of inputs that break their model, labels the right behaviour for each, and trains on them.
        The attacks they found stop working. A month later, a new attack works as well as the old ones did. Training on
        attacks clearly helps; does it converge to a model that cannot be attacked, what does it cost, and why might it
        sometimes make things worse?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adversarial training replaces the question &quot;is the model right on the data?&quot; with &quot;is it right on
        the worst input near the data?&quot;, and trains on that worst input. For a model that relied on many fragile
        features, the fragile ones stop paying, and it shifts toward features an attacker cannot move cheaply, often at
        some cost in ordinary accuracy. The guarantee is only as good as the search for the worst case: the model becomes
        robust to the attacks used in training, and an attack from outside that set can still succeed.
      </p>
      <RobustFeatureViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the robust objective">
        <p>
          Adversarial training minimises the worst-case loss over a perturbation set S (Madry et al., 2017):
        </p>
        <MD>{"\\min_\\theta \; \\mathbb{E}_{(x, y)} \\Big[\\max_{\\delta \\in S} L(\\theta, x + \\delta, y)\\Big]"}</MD>
        <p>
          The inner maximisation is approximated by an attack such as projected gradient descent, and the outer
          minimisation takes a gradient step at the perturbed input. For language models the inner step is a search for
          jailbreaks or harmful completions, by people or by attack algorithms, and the outer step trains the model to
          respond correctly to what was found.
        </p>
      </Definition>

      <Theorem title="the robust loss of a linear model">
        <p>
          For a linear score with labels ±1, logistic loss <M>{"\\ell(m) = \\log(1 + e^{-m})"}</M> and{" "}
          <M>{"S = \\{\\|\\delta\\|_\\infty \\le \\varepsilon\\}"}</M>,
        </p>
        <MD>{"\\max_{\\delta \\in S} \\ell\\big(y(w \\cdot (x + \\delta) + b)\\big) = \\ell\\big(y(w \\cdot x + b) - \\varepsilon\\|w\\|_1\\big)"}</MD>
        <p>
          (<C>robust_margin</C>). Its gradient in w, where no weight is zero, is{" "}
          <M>{"-\\sigma(-m)\\,(y\\,x - \\varepsilon\\,\\mathrm{sign}(w))"}</M> with m the robust margin (<C>robust_grad</C>),
          so adversarial training behaves like an ℓ1 penalty whose strength is weighted toward the examples with small
          margins (<C>train</C>).
        </p>
        <Code>{TRAIN}</Code>
      </Theorem>
      <Proof>
        <p>
          The loss is decreasing in the margin, so the worst δ minimises <M>{"y\\,w \\cdot \\delta"}</M>, whose minimum over
          the ℓ∞ ball is <M>{"-\\varepsilon\\|w\\|_1"}</M> by the previous lesson&apos;s dual-norm argument, attained at{" "}
          <M>{"\\delta = -\\varepsilon y\\,\\mathrm{sign}(w)"}</M>. Differentiating <M>{"\\ell(m)"}</M> with{" "}
          <M>{"\\ell'(m) = -\\sigma(-m)"}</M> and <M>{"\\partial m/\\partial w = y\\,x - \\varepsilon\\,\\mathrm{sign}(w)"}</M>{" "}
          gives the gradient. That this is also the gradient one gets by first finding the worst δ and then differentiating
          the loss at it, holding δ fixed, is an instance of Danskin&apos;s theorem: if the maximiser is unique, the gradient
          of a maximum is the gradient of the function at the maximiser. This justifies the usual practice of attacking,
          then taking an ordinary gradient step on the attacked input.
        </p>
      </Proof>

      <Example title="robustness can cost accuracy">
        <p>
          Following Tsipras et al. (2019), let the label be ±1 with equal probability, let one feature equal the label
          with probability p, and let d further features each be normal with mean η times the label and variance 1.
          Averaging the d weak features classifies correctly with probability <M>{"\\Phi(\\eta\\sqrt d)"}</M>, nearly 1 when{" "}
          <M>{"\\eta\\sqrt d"}</M> is large, but an attacker who shifts each by ε &gt; η reverses it, giving{" "}
          <M>{"\\Phi((\\eta - \\varepsilon)\\sqrt d)"}</M> (<C>weak_feature_accuracy</C>). The robust feature gives accuracy p
          under any attack too small to flip it (<C>robust_feature_accuracy</C>). The robust classifier is less accurate on
          clean data, and adversarial training, by measuring accuracy at the worst case (<C>robust_accuracy</C>), chooses it.
        </p>
        <Code>{TRADE}</Code>
      </Example>

      <Remark title="limits, and adversarial training for language models">
        <p>
          Robust accuracy on training attacks can rise while robust accuracy on new inputs falls, a gap called robust
          overfitting (Rice, Wong and Kolter, 2020), and robustness to one perturbation set says little about another.
          Ziegler et al. (2022) adversarially trained a classifier to catch injurious story completions; it roughly doubled
          the time human attackers needed to find a failure without hurting ordinary performance, but failures remained.
          Because the space of text attacks is hard to search, latent adversarial training perturbs a model&apos;s hidden
          activations instead of its inputs, and circuit breakers train representations of harmful outputs to be
          redirected. The sleeper-agent results of the first chapter are the warning: training against the attacks you
          found can teach a model to recognise your attacks rather than to stop misbehaving.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "loss",
      rung: "check",
      prompt: (
        <p>
          A linear classifier has w = (2, −1) and b = 0, and x = (1, 1) has label +1. With ε = 0.1 in the ℓ∞ norm, what is
          the robust logistic loss?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4032, tolerance: 0.001 },
    },
    {
      key: "grad",
      rung: "check",
      prompt: <p>For the same example, what is the first component of the gradient of the robust loss in w?</p>,
      answer: { kind: "numeric", value: -0.2986, tolerance: 0.001 },
    },
    {
      key: "overfit",
      rung: "apply",
      prompt: (
        <p>
          After adversarial training, a model resists every attack in the training set but a new attack method breaks it
          easily. What best describes this?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Robustness is only to the perturbations searched during training; the worst case over the new attack was never optimised",
          "Adversarial training always reduces robustness",
          "The model has become less accurate on clean data",
          "Danskin's theorem failed because the maximiser was unique",
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

def robust_margin(x, y, w, b, eps):
    return y * (sum(wi * xi for wi, xi in zip(w, x)) + b) - eps * sum(abs(wi) for wi in w)

def robust_grad(x, y, w, b, eps):
    s = 1 / (1 + math.exp(robust_margin(x, y, w, b, eps)))          # sigma(-m), the slope of log(1 + e^-m)
    sgn = [(wi > 0) - (wi < 0) for wi in w]
    gw = [-s * (y * xi - eps * si) for xi, si in zip(x, sgn)]        # Danskin: differentiate at the maximiser
    return gw, -s * y

def train(data, eps, lr, steps):
    w, b = [0.0] * len(data[0][0]), 0.0
    for _ in range(steps):
        grads = [robust_grad(x, y, w, b, eps) for x, y in data]
        w = [wi - lr * sum(g[0][i] for g in grads) / len(data) for i, wi in enumerate(w)]
        b -= lr * sum(g[1] for g in grads) / len(data)
    return w, b

data = [((2.0, 0.3), 1), ((-2.0, -0.3), -1), ((0.5, 0.3), 1), ((-0.5, -0.3), -1)]; print(round(robust_margin((1.0, 1.0), -1, (1.0, -2.0), 0.0, 0.2), 4), robust_grad((1.0, 2.0), 1, (0.0, 0.0), 0.0, 0.5))
w0, _ = train(data, 0.0, 0.5, 50); w1, _ = train(data, 0.4, 0.5, 50); print(w0[1] > w1[1], round(w1[1], 2), train(data, 0.0, 0.5, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.4 ([-0.5, -1.0], -0.5)\nTrue 0.05 ([0.0, 0.0], 0.0)",
          "0.4 ([-0.5, -1.0], -0.5)\nFalse 0.05 ([0.0, 0.0], 0.0)",
          "1.6 ([-0.5, -1.0], -0.5)\nTrue 0.05 ([0.0, 0.0], 0.0)",
          "0.4 ([0.5, 1.0], 0.5)\nTrue 0.05 ([0.0, 0.0], 0.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from statistics import NormalDist

def robust_accuracy(data, w, b, eps):
    ok = 0
    for x, y in data:
        m = y * (sum(wi * xi for wi, xi in zip(w, x)) + b)
        ok += m - eps * sum(abs(wi) for wi in w) > 0       # correct even at the worst perturbation
    return ok / len(data)

def weak_feature_accuracy(eta, d, eps):
    return NormalDist().cdf((eta - eps) * d ** 0.5)       # averaging d weak features under attack

def robust_feature_accuracy(p, eps, flip=1.0):
    return p if eps < flip else 1 - p                      # a feature that needs a large change to flip

print(robust_accuracy(data, [1.0, 1.0], 0.0, 0.0), robust_accuracy(data, [1.0, 1.0], 0.0, 0.45), robust_accuracy(data, [1.0, 0.0], 0.0, 0.45))
print(round(weak_feature_accuracy(0.1, 900, 0.1), 4), robust_feature_accuracy(0.9, 0.5), round(robust_feature_accuracy(0.9, 2.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.5 1.0\n0.5 0.9 0.1",
          "1.0 1.0 1.0\n0.5 0.9 0.1",
          "1.0 0.5 0.5\n0.5 0.9 0.1",
          "1.0 0.5 1.0\n0.8413 0.9 0.1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>robust_margin(x, y, w, b, eps)</C> for the ℓ∞ ball; <C>robust_grad(x, y, w, b, eps)</C>, returning the
          gradient of the robust logistic loss in w and in b, using sign(0) = 0; and{" "}
          <C>train(data, eps, lr, steps)</C>, full-batch gradient descent on the mean robust loss from zero weights.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def robust_margin(x, y, w, b, eps):
    return y * (sum(wi * xi for wi, xi in zip(w, x)) + b)

def robust_grad(x, y, w, b, eps):
    return [0.0] * len(w), 0.0

def train(data, eps, lr, steps):
    return [0.0] * len(data[0][0]), 0.0
`,
        solution: TRAIN,
        tests: [
          { name: "grad", code: `assert abs(robust_margin((1.0, 1.0), 1, (2.0, -1.0), 0.0, 0.1) - 0.7) < 1e-12\ng, g0 = robust_grad((2.0,), -1, (0.0,), 0.0, 0.0)\nassert g == [1.0] and g0 == 0.5` },
          { name: "train", code: `w, b = train([((1.0,), 1), ((-1.0,), -1)], 0.0, 1.0, 1)\nassert w == [0.5] and b == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>robust_accuracy(data, w, b, eps)</C>, the share of examples whose robust margin is positive;{" "}
          <C>weak_feature_accuracy(eta, d, eps)</C>; and <C>robust_feature_accuracy(p, eps, flip=1.0)</C>, which is p
          while eps is below flip and 1 − p otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from statistics import NormalDist

def robust_accuracy(data, w, b, eps):
    return 1.0

def weak_feature_accuracy(eta, d, eps):
    return 1.0

def robust_feature_accuracy(p, eps, flip=1.0):
    return p
`,
        solution: TRADE,
        tests: [
          { name: "acc", code: `assert robust_accuracy([((1.0,), 1), ((0.2,), 1)], [1.0], 0.0, 0.5) == 0.5 and abs(weak_feature_accuracy(0.2, 100, 0.0) - NormalDist().cdf(2.0)) < 1e-12` },
          { name: "flip", code: `assert abs(robust_feature_accuracy(0.8, 1.5) - 0.2) < 1e-12 and robust_feature_accuracy(0.8, 0.5) == 0.8` },
        ],
      },
    },
    {
      key: "clean",
      rung: "stretch",
      prompt: (
        <p>
          In the example, η = 0.1 and d = 900. What is the clean accuracy of averaging the weak features?
        </p>
      ),
      answer: { kind: "numeric", value: 0.99865, tolerance: 0.00005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Robustness research attacks models from outside. A complementary programme builds models with known problems on
        purpose, model organisms of misalignment, to study what a misaligned model would do and whether our tools would
        catch it.
      </p>
    </>
  ),
};
