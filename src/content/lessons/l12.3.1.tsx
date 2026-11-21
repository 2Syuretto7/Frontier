import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GuidanceViz } from "@/components/viz/GuidanceViz";
import type { LessonContent } from "@/lib/types";

const CLASSIFIER = `import math

def class_post(x, sigma, mus, s):
    v = s * s + sigma * sigma
    l = [-(x - m) ** 2 / (2 * v) for m in mus]
    w = [math.exp(u - max(l)) for u in l]
    return [u / sum(w) for u in w]                             # p_sigma(y | x) for equally likely classes

def classifier_grad(x, sigma, mus, s, y):
    p = class_post(x, sigma, mus, s)
    return (mus[y] - sum(q * m for q, m in zip(p, mus))) / (s * s + sigma * sigma)

def guided_score(x, sigma, mus, s, y, w):
    p = class_post(x, sigma, mus, s)
    uncond = (sum(q * m for q, m in zip(p, mus)) - x) / (s * s + sigma * sigma)
    return uncond + w * classifier_grad(x, sigma, mus, s, y)`;

const TILT = `def eps_guided(eps_hat, grad, std, w):
    return eps_hat - w * std * grad                            # noise prediction of the guided score

def tilt_gaussian(a, b, c, w):
    prec = 1 / a + w / b                                       # prior N(0, a) times a Gaussian likelihood to the power w
    return (w * c / b) / prec, 1 / prec

def sharpen(probs, w):
    q = [p ** w for p in probs]
    return [x / sum(q) for x in q]`;

export const lesson: LessonContent = {
  id: "l12.3.1",
  minutes: 50,
  links: {
    requires: ["l12.1.2"],
    revisits: ["l7.6.2", "m19.4.2"],
    foreshadows: ["l12.3.2"],
  },

  puzzle: (
    <>
      <p>
        An unconditional diffusion model trained on ImageNet draws a random image from a thousand classes. Suppose we want
        only golden retrievers, and we have a separate classifier that recognises them. Can the classifier steer the sampler
        without retraining the generator? And if steering towards the class gives recognisable but bland dogs, can we steer
        harder, and what exactly are we then sampling from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sampler only needs the score, the direction of increasing log density. By Bayes&apos; rule, the log density of images
        of a class is the log density of all images plus the log-probability the classifier gives to that class, up to a
        constant. So the conditional score is the unconditional score plus the classifier&apos;s gradient: the generator says
        what looks like an image, the classifier says what looks like a dog. Multiplying the classifier&apos;s term by a weight
        above one exaggerates the dog-ness, trading variety for samples the classifier is sure about.
      </p>
      <GuidanceViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Bayes' rule for scores">
        <p>
          Let <M>{"p_t(x \\mid y)"}</M> be the noisy conditional density and <M>{"p_t(y \\mid x)"}</M> the posterior of the label
          given the noisy input. Then{" "}
          <M>{"\\nabla_x \\log p_t(x \\mid y) = \\nabla_x \\log p_t(x) + \\nabla_x \\log p_t(y \\mid x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\log p_t(x \\mid y) = \\log p_t(x) + \\log p_t(y \\mid x) - \\log p(y)"}</M>, and the last term does not depend on x.
          Note that <M>{"p_t(y \\mid x)"}</M> is the posterior at noise level t, so the classifier must be trained on noisy
          inputs at every level, not only on clean images.
        </p>
      </Proof>

      <Definition title="classifier guidance">
        <p>
          With guidance weight w, sample with the score{" "}
          <M>{"\\nabla \\log p_t(x) + w \\nabla \\log p_\\phi(y \\mid x_t, t)"}</M> (<C>guided_score</C>). For a noise predictor,
          since <M>{"\\hat\\varepsilon = -\\sigma_t \\nabla \\log p_t"}</M> with <M>{"\\sigma_t = \\sqrt{1 - \\bar\\alpha_t}"}</M>,
          this is <M>{"\\tilde\\varepsilon = \\hat\\varepsilon - w \\sigma_t \\nabla \\log p_\\phi(y \\mid x_t)"}</M>{" "}
          (<C>eps_guided</C>). w = 1 is exact conditional sampling, and w = 0 ignores the label.
        </p>
      </Definition>

      <Example title="two Gaussian classes">
        <p>
          If class k has density <M>{"\\mathcal{N}(\\mu_k, s^2)"}</M> and the classes are equally likely, then under VE noise σ the
          noisy class densities are <M>{"\\mathcal{N}(\\mu_k, v)"}</M> with <M>{"v = s^2 + \\sigma^2"}</M>, the posterior is a
          softmax of <M>{"-(x - \\mu_k)^2/(2v)"}</M> (<C>class_post</C>), and differentiating,{" "}
          <M>{"\\nabla \\log p_\\sigma(y \\mid x) = (\\mu_y - \\bar\\mu(x))/v"}</M> where{" "}
          <M>{"\\bar\\mu(x) = \\sum_k p_\\sigma(k \\mid x)\\, \\mu_k"}</M> (<C>classifier_grad</C>). The unconditional score is{" "}
          <M>{"(\\bar\\mu(x) - x)/v"}</M>. The figure runs this with the exact scores.
        </p>
        <Code>{CLASSIFIER}</Code>
      </Example>

      <Theorem title="what a weight above one targets">
        <p>
          At each noise level, the guided score is the score of the tilted density{" "}
          <M>{"\\tilde p_t(x) \\propto p_t(x)\\, p_t(y \\mid x)^w \\propto p_t(x \\mid y)^w\\, p_t(x)^{1 - w}"}</M>, whenever it is
          normalisable.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take <M>{"\\nabla_x \\log"}</M> of the tilted density; the normaliser does not depend on x. For the second form,
          substitute <M>{"p_t(y \\mid x) = p_t(x \\mid y) p(y)/p_t(x)"}</M>.
        </p>
      </Proof>

      <Remark title="a sharper classifier, roughly">
        <p>
          Raising the classifier&apos;s probabilities to the power w and renormalising over classes (<C>sharpen</C>) makes it
          more confident, and its log-gradient for class y is{" "}
          <M>{"w \\nabla \\log p(y \\mid x) - \\nabla \\log \\sum_k p(k \\mid x)^w"}</M>. Guidance keeps only the first term, so
          it behaves like conditioning on an overconfident classifier only where the second term is small, for example where
          one class already dominates.
        </p>
      </Remark>

      <Theorem title="guidance shrinks a Gaussian">
        <p>
          If <M>{"p(x) = \\mathcal{N}(0, a)"}</M> and{" "}
          <M>{"p(y \\mid x) \\propto \\exp(-(x - c)^2/(2b))"}</M>, the tilted density is Gaussian with variance{" "}
          <M>{"1/(1/a + w/b)"}</M> and mean <M>{"(wc/b)/(1/a + w/b)"}</M> (<C>tilt_gaussian</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The log of the tilted density is <M>{"-x^2/(2a) - w(x - c)^2/(2b)"}</M> plus a constant, a quadratic with coefficient{" "}
          <M>{"-\\tfrac{1}{2}(1/a + w/b)"}</M> on <M>{"x^2"}</M> and <M>{"wc/b"}</M> on x; complete the square. As w grows the
          variance falls like <M>{"b/w"}</M> and the mean moves to c: all the mass collapses onto the point the classifier likes
          best.
        </p>
        <Code>{TILT}</Code>
      </Proof>

      <Remark title="not quite a distribution">
        <p>
          The tilted densities at different noise levels are not, in general, the noised versions of one distribution, because
          adding noise does not commute with raising to a power. So a guided sampler with w ≠ 1 does not sample exactly from{" "}
          <M>{"p_0(x)\\, p(y \\mid x)^w"}</M>; guidance is a heuristic whose effect is measured, not derived. In the figure the
          effect is the expected one: the spread of the samples falls and the classifier&apos;s confidence rises as w grows.
        </p>
      </Remark>

      <Example title="beating GANs">
        <p>
          Dhariwal and Nichol trained a noise-aware classifier on ImageNet alongside an improved diffusion model and found that
          guidance with weights well above one gave the best sample quality, with an FID of 4.59 at 256 by 256 pixels, ahead of
          the best GANs at the time. Precision rose and recall fell with w, the same trade between fidelity and variety as in
          the figure.
        </p>
      </Example>

      <Remark title="the cost of a classifier">
        <p>
          The classifier must be trained separately on noisy images, its gradients can exploit features no human would read as
          the class (an adversarial direction), and it limits conditioning to labels a classifier can predict. Text prompts fit
          poorly. The next lesson removes the classifier altogether.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "post",
      rung: "check",
      prompt: (
        <p>
          Two equally likely classes are <M>{"\\mathcal{N}(\\pm 1, 0.6^2)"}</M>. Under VE noise σ = 0.8, what is the posterior
          probability of the class at +1 for x = 0.5?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7311, tolerance: 0.0005 },
    },
    {
      key: "grad",
      rung: "check",
      prompt: <p>At the same point, what is the gradient of the log-posterior of the class at +1?</p>,
      answer: { kind: "numeric", value: 0.5379, tolerance: 0.0005 },
    },
    {
      key: "weight",
      rung: "apply",
      prompt: <p>What does a guidance weight above one do to the samples, compared with exact conditional sampling?</p>,
      answer: {
        kind: "choice",
        options: [
          "Concentrates them where the classifier is most confident, reducing variety",
          "Leaves them unchanged, since the conditional is already exact at w = 1",
          "Spreads them out to cover more of the class",
          "Turns the sampler into an unconditional one",
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

def class_post(x, sigma, mus, s):
    v = s * s + sigma * sigma
    l = [-(x - m) ** 2 / (2 * v) for m in mus]
    w = [math.exp(u - max(l)) for u in l]
    return [u / sum(w) for u in w]                             # p_sigma(y | x) for equally likely classes

def classifier_grad(x, sigma, mus, s, y):
    p = class_post(x, sigma, mus, s)
    return (mus[y] - sum(q * m for q, m in zip(p, mus))) / (s * s + sigma * sigma)

def guided_score(x, sigma, mus, s, y, w):
    p = class_post(x, sigma, mus, s)
    uncond = (sum(q * m for q, m in zip(p, mus)) - x) / (s * s + sigma * sigma)
    return uncond + w * classifier_grad(x, sigma, mus, s, y)

mus = [-1.0, 1.0]; p = class_post(1.0, 0.0, mus, 1.0)
print([round(q, 4) for q in p], round(classifier_grad(1.0, 0.0, mus, 1.0, 1), 4), round(guided_score(1.0, 0.0, mus, 1.0, 1, 0.0), 4), round(guided_score(1.0, 0.0, mus, 1.0, 1, 2.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.1192, 0.8808] 0.2384 -0.2384 0.2384",
          "[0.1192, 0.8808] 0.2384 -0.2384 -0.7152",
          "[0.1192, 0.8808] 0.7616 -0.2384 0.2384",
          "[0.1192, 0.8808] 0.1192 -0.2384 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def eps_guided(eps_hat, grad, std, w):
    return eps_hat - w * std * grad                            # noise prediction of the guided score

def tilt_gaussian(a, b, c, w):
    prec = 1 / a + w / b                                       # prior N(0, a) times a Gaussian likelihood to the power w
    return (w * c / b) / prec, 1 / prec

def sharpen(probs, w):
    q = [p ** w for p in probs]
    return [x / sum(q) for x in q]

m, v = tilt_gaussian(1.0, 1.0, 2.0, 3.0)
print(eps_guided(0.4, 2.0, 0.5, 3.0), m, v, [round(q, 4) for q in sharpen([0.2, 0.8], 2.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-2.6 1.5 0.25 [0.0588, 0.9412]",
          "3.4 1.5 0.25 [0.0588, 0.9412]",
          "-2.6 1.5 0.25 [0.04, 0.64]",
          "-2.6 2.0 0.25 [0.0588, 0.9412]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For equally likely classes <M>{"\\mathcal{N}(\\mu_k, s^2)"}</M> in one dimension under VE noise σ, write{" "}
          <C>class_post(x, sigma, mus, s)</C>, <C>classifier_grad(x, sigma, mus, s, y)</C> and{" "}
          <C>guided_score(x, sigma, mus, s, y, w)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def class_post(x, sigma, mus, s):
    return [1 / len(mus)] * len(mus)

def classifier_grad(x, sigma, mus, s, y):
    return mus[y] - x

def guided_score(x, sigma, mus, s, y, w):
    return w * classifier_grad(x, sigma, mus, s, y)
`,
        solution: CLASSIFIER,
        tests: [
          { name: "post", code: `import math\np = class_post(0.0, 1.0, [0.0, 2.0, 4.0], 1.0)\nz = 1 + math.exp(-1) + math.exp(-4)\nassert abs(p[0] - 1 / z) < 1e-12 and abs(p[2] - math.exp(-4) / z) < 1e-12\nassert abs(classifier_grad(0.0, 1.0, [0.0, 2.0, 4.0], 1.0, 1) - (2 - (2 * math.exp(-1) + 4 * math.exp(-4)) / z) / 2) < 1e-12` },
          { name: "score", code: `import math\nm = (2 * math.exp(-1) + 4 * math.exp(-4)) / (1 + math.exp(-1) + math.exp(-4))\nassert abs(guided_score(0.0, 1.0, [0.0, 2.0, 4.0], 1.0, 1, 3.0) - (m / 2 + 3 * (2 - m) / 2)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eps_guided(eps_hat, grad, std, w)</C>, <C>tilt_gaussian(a, b, c, w)</C> returning the mean and variance of the
          tilted Gaussian, and <C>sharpen(probs, w)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def eps_guided(eps_hat, grad, std, w):
    return eps_hat + w * grad

def tilt_gaussian(a, b, c, w):
    return c, a

def sharpen(probs, w):
    return probs
`,
        solution: TILT,
        tests: [
          { name: "eps", code: `assert abs(eps_guided(1.0, 0.5, 0.4, 2.0) - 0.6) < 1e-12\nm, v = tilt_gaussian(2.0, 0.5, 1.0, 1.5)\nassert abs(v - 0.2857142857142857) < 1e-12 and abs(m - 0.8571428571428571) < 1e-12` },
          { name: "sharp", code: `q = sharpen([0.5, 0.25, 0.25], 3.0)\nassert abs(q[0] - 0.8) < 1e-12 and abs(q[1] - 0.1) < 1e-12 and abs(sum(sharpen([0.3, 0.7], 0.5)) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "tiltmean",
      rung: "stretch",
      prompt: (
        <p>
          A prior <M>{"\\mathcal{N}(0, 1)"}</M> is guided by a Gaussian likelihood centred at 2 with variance 1, at weight 4. What
          is the mean of the tilted density?
        </p>
      ),
      answer: { kind: "numeric", value: 1.6, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        If one network is trained both with and without the label, the difference of its two predictions plays the role of
        the classifier&apos;s gradient. That is classifier-free guidance, the default way every modern text-to-image model is
        steered.
      </p>
    </>
  ),
};
