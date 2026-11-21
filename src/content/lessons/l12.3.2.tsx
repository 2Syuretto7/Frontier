import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CfgViz } from "@/components/viz/CfgViz";
import type { LessonContent } from "@/lib/types";

const CFG = `def drop_labels(labels, us, p, null):
    return [null if u < p else y for y, u in zip(labels, us)]  # us are uniform draws, one per example

def cfg_eps(eps_c, eps_u, g):
    return eps_u + g * (eps_c - eps_u)                         # g = 1 is conditional, g = 0 unconditional

def implied_class_grad(eps_c, eps_u, std):
    return -(eps_c - eps_u) / std                              # estimate of grad log p_t(y | x)`;

const TWEAKS = `import math

def interval_eps(eps_c, eps_u, g, sigma, lo, hi):
    scale = g if lo <= sigma <= hi else 1.0                    # guide only inside the interval
    return eps_u + scale * (eps_c - eps_u)

def std(v):
    m = sum(v) / len(v)
    return math.sqrt(sum((a - m) ** 2 for a in v) / len(v))

def rescale_cfg(eps_cfg, eps_c, phi):
    r = std(eps_c) / std(eps_cfg)                              # match the spread of the conditional prediction
    return [phi * r * a + (1 - phi) * a for a in eps_cfg]`;

export const lesson: LessonContent = {
  id: "l12.3.2",
  minutes: 55,
  links: {
    requires: ["l12.3.1"],
    revisits: ["l12.1.1", "m19.4.3"],
    foreshadows: ["l12.3.3"],
  },

  puzzle: (
    <>
      <p>
        Every text-to-image system exposes a dial called the guidance scale, usually set between 3 and 8. At 1 the images
        follow the prompt loosely; turned up, they follow it faithfully but grow saturated and samey. There is no classifier
        anywhere in these systems, yet the dial behaves exactly like classifier guidance. Where is the classifier hiding, and
        why does turning the dial up make the outputs less varied in ways that go beyond what the prompt asks?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Train one network to denoise both with the prompt and, some fraction of the time, with the prompt blanked out. The
        difference between its two answers is the direction that makes the image more like the prompt than like images in
        general, and by Bayes&apos; rule that is precisely a classifier&apos;s gradient, computed by the generator itself. Extrapolating
        along this difference sharpens prompt-adherence, but it also pushes samples away from wherever unprompted images are
        common, including parts of the prompt&apos;s own distribution that resemble other things.
      </p>
      <CfgViz />
    </>
  ),

  theory: (
    <>
      <Definition title="training with label dropout">
        <p>
          A conditional noise predictor <M>{"\\hat\\varepsilon_\\theta(x_t, t, c)"}</M> is trained as in l12.1.1, except that with
          probability <M>{"p_{\\mathrm{uncond}}"}</M>, typically 0.1 to 0.2, the condition c is replaced by a null token ∅,
          independently of everything else (<C>drop_labels</C>).
        </p>
      </Definition>

      <Theorem title="one network, two models">
        <p>
          The minimiser of the dropout loss satisfies{" "}
          <M>{"\\hat\\varepsilon(x, t, c) = \\mathbb{E}[\\varepsilon \\mid x_t = x, c]"}</M> and{" "}
          <M>{"\\hat\\varepsilon(x, t, \\varnothing) = \\mathbb{E}[\\varepsilon \\mid x_t = x]"}</M>, the conditional and
          unconditional optimal predictors.
        </p>
      </Theorem>
      <Proof>
        <p>
          The loss is an expectation of <M>{"\\|\\varepsilon - \\hat\\varepsilon(x_t, t, \\tilde c)\\|^2"}</M> where{" "}
          <M>{"\\tilde c"}</M> is c or ∅. A flexible network chooses its output separately for each input{" "}
          <M>{"(x, t, \\tilde c)"}</M>, and the squared loss is minimised by the conditional mean of ε given that input. Given{" "}
          <M>{"\\tilde c = c"}</M>, the input carries c. Given <M>{"\\tilde c = \\varnothing"}</M>, since the dropout is independent
          of <M>{"(x_0, c, \\varepsilon)"}</M>, the examples are distributed as the unconditional data, so the conditional mean
          is <M>{"\\mathbb{E}[\\varepsilon \\mid x_t]"}</M>.
        </p>
      </Proof>

      <Definition title="classifier-free guidance">
        <p>
          With guidance scale γ, sample with{" "}
          <M>{"\\tilde\\varepsilon = \\hat\\varepsilon(x, t, \\varnothing) + \\gamma\\big(\\hat\\varepsilon(x, t, c) - \\hat\\varepsilon(x, t, \\varnothing)\\big)"}</M>{" "}
          (<C>cfg_eps</C>), at the cost of two network evaluations per step. γ = 1 is the conditional model and γ = 0 the
          unconditional one; Stable Diffusion&apos;s default is 7.5.
        </p>
        <Code>{CFG}</Code>
      </Definition>

      <Theorem title="the hidden classifier">
        <p>
          For the optimal predictors,{" "}
          <M>{"\\hat\\varepsilon(x, t, c) - \\hat\\varepsilon(x, t, \\varnothing) = -\\sigma_t \\nabla_x \\log p_t(c \\mid x)"}</M>{" "}
          (<C>implied_class_grad</C>), so the guided score is{" "}
          <M>{"\\nabla \\log p_t(x) + \\gamma \\nabla \\log p_t(c \\mid x)"}</M>: classifier guidance of l12.3.1 with weight γ,
          and target <M>{"p_t(x \\mid c)^\\gamma\\, p_t(x)^{1 - \\gamma}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Tweedie (m19.4.3) the optimal predictors are{" "}
          <M>{"-\\sigma_t \\nabla \\log p_t(x \\mid c)"}</M> and <M>{"-\\sigma_t \\nabla \\log p_t(x)"}</M>. Their difference is{" "}
          <M>{"-\\sigma_t"}</M> times the gradient of <M>{"\\log p_t(c \\mid x)"}</M> by Bayes&apos; rule for scores. Substituting
          into <C>cfg_eps</C> and dividing by <M>{"-\\sigma_t"}</M> gives the score; the target density follows as in l12.3.1.
        </p>
      </Proof>

      <Remark title="why guidance drops modes">
        <p>
          For γ &gt; 1 the factor <M>{"p_t(x)^{1 - \\gamma}"}</M> penalises every region where unconditional samples are
          common. Part of the conditional distribution that lies near other conditions is penalised too, even though it
          belongs to the prompt. In the figure, class A&apos;s bump next to class B empties as γ grows. The effect is strongest at
          high noise, when the sampler is deciding which mode to head for.
        </p>
      </Remark>

      <Definition title="guidance intervals and rescaling">
        <p>
          Kynkäänniemi and colleagues apply guidance only within an interval of noise levels (<C>interval_eps</C>), leaving
          the highest levels unguided so that the choice of mode follows the conditional model; this improved FID on ImageNet
          markedly. Lin and colleagues observed that large γ inflates the size of the prediction and rescale it to the
          standard deviation of the conditional prediction, blending with factor φ (<C>rescale_cfg</C>, with <C>std</C> the
          population standard deviation over all entries).
        </p>
        <Code>{TWEAKS}</Code>
      </Definition>

      <Example title="negative prompts">
        <p>
          Nothing requires the second prediction to be unconditional. Replacing ∅ by a negative prompt{" "}
          <M>{"c^-"}</M> gives{" "}
          <M>{"\\hat\\varepsilon(c^-) + \\gamma(\\hat\\varepsilon(c) - \\hat\\varepsilon(c^-))"}</M>, whose score adds{" "}
          <M>{"\\gamma \\nabla \\log (p_t(x \\mid c)/p_t(x \\mid c^-))"}</M> to that of <M>{"c^-"}</M>: it moves samples towards c
          and away from <M>{"c^-"}</M>, for instance away from &quot;blurry, low quality&quot;.
        </p>
      </Example>

      <Remark title="in practice">
        <p>
          The doubled cost is often removed by distillation: a student network is trained to output the guided prediction
          directly, with γ as an input. Guidance is applied in the same way to flow models, by combining velocities instead of
          noise predictions, since by l12.2.1 the two are linearly related at each time.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eps",
      rung: "check",
      prompt: (
        <p>
          At one step the unconditional prediction is 0.3 and the conditional one 0.5. What is the guided prediction at scale
          7.5?
        </p>
      ),
      answer: { kind: "numeric", value: 1.8, tolerance: 0.0005 },
    },
    {
      key: "tvar",
      rung: "check",
      prompt: (
        <p>
          The unconditional density is <M>{"\\mathcal{N}(0, 1)"}</M> and the conditional one <M>{"\\mathcal{N}(1, 0.5)"}</M>. At
          scale γ = 3, what is the variance of the target density <M>{"p(x \\mid c)^\\gamma p(x)^{1 - \\gamma}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0005 },
    },
    {
      key: "drop",
      rung: "apply",
      prompt: <p>Why does label dropout make the network a good unconditional model as well?</p>,
      answer: {
        kind: "choice",
        options: [
          "With the label blanked, the examples it sees are distributed as the unconditional data, so it learns the unconditional mean",
          "The null token is trained on a separate unconditional dataset",
          "Dropout regularises the conditional model, which makes it unconditional",
          "It does not: the unconditional model is trained separately",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def drop_labels(labels, us, p, null):
    return [null if u < p else y for y, u in zip(labels, us)]  # us are uniform draws, one per example

def cfg_eps(eps_c, eps_u, g):
    return eps_u + g * (eps_c - eps_u)                         # g = 1 is conditional, g = 0 unconditional

def implied_class_grad(eps_c, eps_u, std):
    return -(eps_c - eps_u) / std                              # estimate of grad log p_t(y | x)

d = drop_labels([4, 7, 2, 9], [0.05, 0.6, 0.1, 0.9], 0.15, -1); e = cfg_eps(0.5, 0.2, 3.0)
print(d, round(e, 4), round(cfg_eps(0.5, 0.2, 0.0), 4), round(implied_class_grad(0.5, 0.2, 0.6), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-1, 7, -1, 9] 1.1 0.2 -0.5",
          "[4, -1, 2, -1] 1.1 0.2 -0.5",
          "[-1, 7, -1, 9] 1.5 0.2 -0.5",
          "[-1, 7, -1, 9] 1.1 0.5 0.5",
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

def interval_eps(eps_c, eps_u, g, sigma, lo, hi):
    scale = g if lo <= sigma <= hi else 1.0                    # guide only inside the interval
    return eps_u + scale * (eps_c - eps_u)

def std(v):
    m = sum(v) / len(v)
    return math.sqrt(sum((a - m) ** 2 for a in v) / len(v))

def rescale_cfg(eps_cfg, eps_c, phi):
    r = std(eps_c) / std(eps_cfg)                              # match the spread of the conditional prediction
    return [phi * r * a + (1 - phi) * a for a in eps_cfg]

g = [interval_eps(0.5, 0.2, 3.0, s, 0.3, 2.0) for s in (0.1, 1.0, 5.0)]
print([round(v, 4) for v in g], std([1.0, 3.0]), [round(v, 4) for v in rescale_cfg([2.0, 6.0], [1.0, 3.0], 1.0)], [round(v, 4) for v in rescale_cfg([2.0, 6.0], [1.0, 3.0], 0.5)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.1, 0.5] 1.0 [1.0, 3.0] [1.5, 4.5]",
          "[1.1, 1.1, 1.1] 1.0 [1.0, 3.0] [1.5, 4.5]",
          "[0.5, 1.1, 0.5] 1.0 [2.0, 6.0] [1.5, 4.5]",
          "[0.5, 1.1, 0.5] 1.4142 [1.0, 3.0] [1.5, 4.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>drop_labels(labels, us, p, null)</C>, replacing a label by <C>null</C> when its uniform draw is below p;{" "}
          <C>cfg_eps(eps_c, eps_u, g)</C>; and <C>implied_class_grad(eps_c, eps_u, std)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def drop_labels(labels, us, p, null):
    return labels

def cfg_eps(eps_c, eps_u, g):
    return g * eps_c

def implied_class_grad(eps_c, eps_u, std):
    return eps_c - eps_u
`,
        solution: CFG,
        tests: [
          { name: "drop", code: `assert drop_labels(["a", "b", "c"], [0.3, 0.1, 0.25], 0.25, None) == ["a", None, "c"]\nassert abs(cfg_eps(1.0, -1.0, 2.5) - 4.0) < 1e-12` },
          { name: "grad", code: `assert abs(implied_class_grad(0.1, 0.4, 0.5) - 0.6) < 1e-12 and abs(cfg_eps(0.1, 0.4, 0.0) - 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>interval_eps(eps_c, eps_u, g, sigma, lo, hi)</C>, using scale g inside the closed interval and 1 outside;{" "}
          <C>std(v)</C>, the population standard deviation; and <C>rescale_cfg(eps_cfg, eps_c, phi)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def interval_eps(eps_c, eps_u, g, sigma, lo, hi):
    return eps_u + g * (eps_c - eps_u)

def std(v):
    return max(v) - min(v)

def rescale_cfg(eps_cfg, eps_c, phi):
    return eps_cfg
`,
        solution: TWEAKS,
        tests: [
          { name: "interval", code: `assert abs(interval_eps(1.0, 0.0, 4.0, 3.0, 0.5, 3.0) - 4.0) < 1e-12 and abs(interval_eps(1.0, 0.0, 4.0, 3.5, 0.5, 3.0) - 1.0) < 1e-12\nassert abs(std([0.0, 0.0, 3.0, 3.0]) - 1.5) < 1e-12` },
          { name: "rescale", code: `r = rescale_cfg([0.0, 4.0], [1.0, 2.0], 0.75)\nassert abs(r[0]) < 1e-12 and abs(r[1] - (0.75 * 1.0 + 0.25 * 4.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "tmean",
      rung: "stretch",
      prompt: <p>In the setting of the second check, what is the mean of the target density at γ = 3?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every step of guided sampling runs a large network twice on a full-resolution image. Latent diffusion, next, moves the
        whole process into the compressed latent space of an autoencoder, which is what made text-to-image generation cheap
        enough for everyone.
      </p>
    </>
  ),
};
