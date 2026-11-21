import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DimensionAttackViz } from "@/components/viz/DimensionAttackViz";
import type { LessonContent } from "@/lib/types";

const LINEAR = `def sign(v):
    return (v > 0) - (v < 0)

def fgsm_linear(x, w, y, eps):
    return [xi - eps * y * sign(wi) for xi, wi in zip(x, w)]   # step that most lowers y * (w . x)

def margin(x, w, b, y):
    return y * (sum(wi * xi for wi, xi in zip(w, x)) + b)

def linf_radius(x, w, b, y):
    return margin(x, w, b, y) / sum(abs(wi) for wi in w)       # the dual norm of l-infinity is l1`;

const PGD = `from statistics import NormalDist

def project_linf(x, x0, eps):
    return [min(max(xi, ci - eps), ci + eps) for xi, ci in zip(x, x0)]

def pgd(x0, grad, eps, alpha, steps):
    x = list(x0)
    for _ in range(steps):
        g = grad(x)
        x = [xi + alpha * ((gi > 0) - (gi < 0)) for xi, gi in zip(x, g)]   # ascend the loss
        x = project_linf(x, x0, eps)                                       # stay within the budget
    return x

def smoothing_radius(p_a, sigma):
    return sigma * NormalDist().inv_cdf(p_a) if p_a > 0.5 else 0.0`;

export const lesson: LessonContent = {
  id: "l14.3.1",
  minutes: 50,
  links: {
    requires: ["m6.5.1", "l11.1.4"],
    revisits: ["l14.1.1", "l14.2.3"],
    foreshadows: ["l14.3.2", "l14.3.4"],
  },

  puzzle: (
    <>
      <p>
        An image classifier that labels a photograph of a panda correctly with high confidence labels it a gibbon, with
        even higher confidence, after every pixel is changed by less than one level in a hundred, a change no person can
        see. The perturbed image works on other classifiers too. These networks match human accuracy on ordinary images.
        Why are they so fragile in directions people do not notice, and what would it take to be sure a model is not?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A model&apos;s output depends on a weighted sum over a huge number of input coordinates. A change too small to
        see in any one coordinate can be lined up with the weights in every coordinate at once, and the small effects
        add. In high dimensions there are vastly more such directions than a person could ever notice, and training on
        natural data says nothing about how the model should behave along them. Adversarial examples are the result: not
        rare bugs, but the default for a model that was never asked to be robust.
      </p>
      <DimensionAttackViz />
    </>
  ),

  theory: (
    <>
      <Definition title="adversarial examples">
        <p>
          For a classifier f, an input x with label y, and a set of allowed perturbations, usually a ball{" "}
          <M>{"\\|\\delta\\|_p \\le \\varepsilon"}</M>, an adversarial example is <M>{"x + \\delta"}</M> in that set that f
          misclassifies. Szegedy et al. (2013) found them for image networks, and found that they transfer: examples built
          against one model often fool another. Goodfellow et al. (2014) proposed the fast gradient sign method, a single
          step <M>{"x + \\varepsilon\\,\\mathrm{sign}(\\nabla_x L)"}</M>, which for a linear model is exactly the worst case
          (<C>fgsm_linear</C>).
        </p>
      </Definition>

      <Theorem title="the worst perturbation of a linear score">
        <p>
          For a linear score <M>{"s(x) = w \\cdot x + b"}</M> and <M>{"1 \\le p \\le \\infty"}</M>, with q the dual
          exponent, <M>{"1/p + 1/q = 1"}</M>,
        </p>
        <MD>{"\\max_{\\|\\delta\\|_p \\le \\varepsilon} |w \\cdot \\delta| = \\varepsilon\\,\\|w\\|_q"}</MD>
        <p>
          attained for p = ∞ at <M>{"\\delta = \\varepsilon\\,\\mathrm{sign}(w)"}</M>. Hence a point with signed margin{" "}
          <M>{"m = y\\,s(x) > 0"}</M> keeps its label under every perturbation of p-norm less than{" "}
          <M>{"m/\\|w\\|_q"}</M>, and no larger radius is certain (<C>margin</C>, <C>linf_radius</C>).
        </p>
        <Code>{LINEAR}</Code>
      </Theorem>
      <Proof>
        <p>
          Hölder&apos;s inequality gives <M>{"|w \\cdot \\delta| \\le \\|w\\|_q \\|\\delta\\|_p \\le \\varepsilon\\|w\\|_q"}</M>,
          and the dual norm is attained, as the course on matrix analysis showed; for p = ∞ the sign vector gives{" "}
          <M>{"w \\cdot \\varepsilon\\,\\mathrm{sign}(w) = \\varepsilon \\sum_i |w_i| = \\varepsilon\\|w\\|_1"}</M>. A perturbation
          changes the label only if it lowers <M>{"y\\,s"}</M> by at least m, which needs{" "}
          <M>{"\\varepsilon\\|w\\|_q \\ge m"}</M>; the maximising perturbation scaled to <M>{"\\varepsilon = m/\\|w\\|_q"}</M>{" "}
          reaches the boundary. If every <M>{"|w_i|"}</M> is about μ in n dimensions,{" "}
          <M>{"\\|w\\|_1 \\approx n\\mu"}</M> while <M>{"\\|w\\|_2 \\approx \\sqrt n\\,\\mu"}</M>, so an ℓ∞ budget that is tiny per
          coordinate moves the score by an amount growing linearly in n. This is Goodfellow et al.&apos;s linear explanation:
          networks are vulnerable because they are close to linear in many directions, not because they are wildly
          non-linear.
        </p>
      </Proof>

      <Definition title="projected gradient descent">
        <p>
          For non-linear models the worst case is found approximately by iterating signed gradient steps of size α and
          projecting back into the ball after each (<C>pgd</C>, <C>project_linf</C>). Madry et al. (2017) framed robustness as
          the saddle-point problem <M>{"\\min_\\theta \\mathbb{E}\\,\\max_{\\|\\delta\\| \\le \\varepsilon} L(\\theta, x + \\delta, y)"}</M>,
          with PGD as the inner maximiser, which became the standard attack for evaluating defences and the basis of
          adversarial training, the subject of the last lesson of this chapter.
        </p>
        <Code>{PGD}</Code>
      </Definition>

      <Remark title="certificates instead of attacks">
        <p>
          An attack that fails proves nothing: Athalye, Carlini and Wagner (2018) broke most of a year&apos;s published
          defences by noticing that they hid gradients rather than removing vulnerability. Certified methods prove a
          radius instead. Randomised smoothing (Cohen, Rosenfeld and Kolter, 2019) classifies x by the most likely label of
          f under Gaussian noise of scale σ; if that label has probability at least <M>{"p_A > 1/2"}</M>, the smoothed
          classifier is constant within ℓ2 radius <M>{"\\sigma\\,\\Phi^{-1}(p_A)"}</M> (<C>smoothing_radius</C>), a
          consequence of the Neyman–Pearson lemma. The certified radii are real but small, and they cover only the
          perturbation set that was chosen.
        </p>
      </Remark>

      <Example title="why it matters beyond images">
        <p>
          Ilyas et al. (2019) argued that adversarial directions are features: patterns that genuinely predict the label in
          the data but that people do not perceive, which models use because nothing tells them not to. The safety lesson
          generalises. Good average-case behaviour says little about worst-case behaviour, and an adversary chooses the
          worst case. For language models the inputs are discrete tokens rather than pixels, but the same search for an
          input that moves the output where the attacker wants is the basis of the jailbreaks in the next lesson.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "image",
      rung: "check",
      prompt: (
        <p>
          A linear model on 3 × 224 × 224 inputs has weights of average absolute value 0.001. By how much can a
          perturbation of 8/255 per coordinate change its score?
        </p>
      ),
      answer: { kind: "numeric", value: 4.7224, tolerance: 0.001 },
    },
    {
      key: "radius",
      rung: "check",
      prompt: (
        <p>
          A linear classifier has w = (3, −1, 2) and b = −1, and x = (1, 1, 1) has label +1. What is the largest ℓ2 radius
          within which its label is certain?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8018, tolerance: 0.001 },
    },
    {
      key: "obfuscated",
      rung: "apply",
      prompt: <p>Why is the failure of an attack weak evidence that a model is robust?</p>,
      answer: {
        kind: "choice",
        options: [
          "The attack may fail because the defence hides or distorts gradients, while other attacks still succeed",
          "Attacks always succeed eventually",
          "Robust models have larger gradients",
          "Attacks only work on linear models",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sign(v):
    return (v > 0) - (v < 0)

def fgsm_linear(x, w, y, eps):
    return [xi - eps * y * sign(wi) for xi, wi in zip(x, w)]   # step that most lowers y * (w . x)

def margin(x, w, b, y):
    return y * (sum(wi * xi for wi, xi in zip(w, x)) + b)

def linf_radius(x, w, b, y):
    return margin(x, w, b, y) / sum(abs(wi) for wi in w)       # the dual norm of l-infinity is l1

x, w = [1.0, 1.0, 1.0], [3.0, -1.0, 0.0]; print(fgsm_linear(x, w, 1, 0.5), margin(x, w, -1.0, 1), margin(fgsm_linear(x, w, 1, 0.5), w, -1.0, 1))
print(linf_radius(x, w, -1.0, 1), linf_radius(x, w, -1.0, -1), sign(0.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.5, 1.0] 1.0 -1.0\n0.25 -0.25 0",
          "[0.5, 1.5, 0.5] 1.0 -1.0\n0.25 -0.25 0",
          "[1.5, 0.5, 1.0] 1.0 3.0\n0.25 -0.25 0",
          "[0.5, 1.5, 1.0] 1.0 -1.0\n0.3162 -0.3162 0",
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

def project_linf(x, x0, eps):
    return [min(max(xi, ci - eps), ci + eps) for xi, ci in zip(x, x0)]

def pgd(x0, grad, eps, alpha, steps):
    x = list(x0)
    for _ in range(steps):
        g = grad(x)
        x = [xi + alpha * ((gi > 0) - (gi < 0)) for xi, gi in zip(x, g)]   # ascend the loss
        x = project_linf(x, x0, eps)                                       # stay within the budget
    return x

def smoothing_radius(p_a, sigma):
    return sigma * NormalDist().inv_cdf(p_a) if p_a > 0.5 else 0.0

print(project_linf([0.5, -3.0, 1.2], [0.0, 0.0, 1.0], 1.0), pgd([0.0, 0.0], lambda v: [1.0, -2.0], 0.3, 0.2, 3))
print(smoothing_radius(0.5, 1.0), round(smoothing_radius(0.8413, 2.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, -1.0, 1.2] [0.3, -0.3]\n0.0 2.0",
          "[0.5, -1.0, 1.2] [0.6, -0.6]\n0.0 2.0",
          "[0.5, -3.0, 1.2] [0.3, -0.3]\n0.0 2.0",
          "[0.5, -1.0, 1.2] [0.3, -0.3]\n0.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Labels are ±1. Write <C>fgsm_linear(x, w, y, eps)</C>, the ℓ∞ step that most lowers{" "}
          <M>{"y\\,(w \\cdot x)"}</M>, leaving coordinates with zero weight unchanged; <C>margin(x, w, b, y)</C>; and{" "}
          <C>linf_radius(x, w, b, y)</C>. A helper <C>sign</C> is allowed.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def sign(v):
    return (v > 0) - (v < 0)

def fgsm_linear(x, w, y, eps):
    return list(x)

def margin(x, w, b, y):
    return sum(wi * xi for wi, xi in zip(w, x)) + b

def linf_radius(x, w, b, y):
    return 0.0
`,
        solution: LINEAR,
        tests: [
          { name: "attack", code: `assert fgsm_linear([0.0, 0.0], [2.0, -1.0], -1, 0.1) == [0.1, -0.1] and margin([1.0, 2.0], [1.0, 1.0], 0.0, -1) == -3.0` },
          { name: "radius", code: `assert abs(linf_radius([1.0, 0.0], [2.0, -2.0], 0.0, 1) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>project_linf(x, x0, eps)</C>; <C>pgd(x0, grad, eps, alpha, steps)</C>, taking signed steps up the
          gradient and projecting after each; and <C>smoothing_radius(p_a, sigma)</C>, 0 when p_a ≤ 1/2.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from statistics import NormalDist

def project_linf(x, x0, eps):
    return list(x)

def pgd(x0, grad, eps, alpha, steps):
    return list(x0)

def smoothing_radius(p_a, sigma):
    return sigma
`,
        solution: PGD,
        tests: [
          { name: "pgd", code: `assert project_linf([2.0, -2.0], [0.0, 0.0], 1.0) == [1.0, -1.0] and pgd([0.0], lambda v: [-1.0], 0.5, 0.25, 4) == [-0.5]` },
          { name: "smooth", code: `assert smoothing_radius(0.4, 1.0) == 0.0 and abs(smoothing_radius(0.975, 1.0) - 1.959963984540054) < 1e-9` },
        ],
      },
    },
    {
      key: "smooth",
      rung: "stretch",
      prompt: (
        <p>
          Under Gaussian noise of scale 0.5, a classifier returns the top class with probability 0.99. What ℓ2 radius does
          randomised smoothing certify?
        </p>
      ),
      answer: { kind: "numeric", value: 1.1632, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Language models are trained to refuse harmful requests. A jailbreak is an input, sometimes a role-play and
        sometimes a string of gibberish found by search, that makes them comply anyway: an adversarial example against
        their safety training.
      </p>
    </>
  ),
};
