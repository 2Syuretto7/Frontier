import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GanDiscViz } from "@/components/viz/GanDiscViz";
import type { LessonContent } from "@/lib/types";

const VALUE = `import math

def optimal_d(pd, pg):
    return [a / (a + b) if a + b > 0 else 0.5 for a, b in zip(pd, pg)]

def gan_value(pd, pg, D):
    v = sum(a * math.log(d) for a, d in zip(pd, D) if a > 0)
    return v + sum(b * math.log(1 - d) for b, d in zip(pg, D) if b > 0)

def jsd(pd, pg):
    m = [(a + b) / 2 for a, b in zip(pd, pg)]
    kl = lambda p: sum(a * math.log(a / c) for a, c in zip(p, m) if a > 0)
    return 0.5 * kl(pd) + 0.5 * kl(pg)`;

const LOSSES = `import math

def g_losses(d_fake):
    n = len(d_fake)
    return sum(math.log(1 - d) for d in d_fake) / n, -sum(math.log(d) for d in d_fake) / n

def logit_grads(d):
    return -d, -(1 - d)

def gda_bilinear(x, y, lr, steps):
    for _ in range(steps):
        x, y = x - lr * y, y + lr * x
    return x, y`;

export const lesson: LessonContent = {
  id: "l7.5.1",
  minutes: 45,
  links: {
    requires: ["l7.1.2", "m12.2.5"],
    revisits: ["m12.2.1", "l2.2.1"],
    foreshadows: ["l7.5.2", "l7.5.3", "l7.3.4"],
  },

  puzzle: (
    <>
      <p>
        A forger paints fake banknotes and a detective inspects notes, real and fake, and says which is which. Every time the
        detective catches a fake, the forger learns from the mistake; every time a fake slips through, the detective learns
        too. If both keep improving, where does this end? And can this contest, played by two neural networks, teach one of
        them to generate realistic images without ever writing down a likelihood?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A generative adversarial network (Goodfellow and others, 2014) pairs a generator, which turns noise into samples, with a
        discriminator, a classifier trained to output the probability that its input is real. The generator is trained to make
        the discriminator wrong. Only samples are needed from the generator, so it can be an implicit model (l7.1.2) with no
        density at all.
      </p>
      <p>
        For a fixed generator, the best discriminator can be written down exactly, and plugging it back in shows that the
        generator is minimising a divergence between its distribution and the data&apos;s: the Jensen-Shannon divergence. The
        trouble starts when the two distributions barely overlap.
      </p>
      <GanDiscViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the GAN game">
        <p>
          With data distribution <M>{"p_d"}</M>, generator <M>{"G"}</M> mapping noise <M>{"z \\sim p_z"}</M> to samples with distribution{" "}
          <M>{"p_g"}</M>, and discriminator <M>{"D : x \\mapsto (0, 1)"}</M>, the value function is
        </p>
        <MD>{"V(D, G) = \\mathbb{E}_{x \\sim p_d}[\\log D(x)] + \\mathbb{E}_{z \\sim p_z}[\\log(1 - D(G(z)))],"}</MD>
        <p>
          the log-likelihood of a logistic classifier (l2.2.1) labelling data as 1 and samples as 0. The GAN solves{" "}
          <M>{"\\min_G \\max_D V(D, G)"}</M> (<C>gan_value</C>).
        </p>
      </Definition>

      <Theorem title="the optimal discriminator">
        <p>For fixed G, V is maximised by</p>
        <MD>{"D^*(x) = \\frac{p_d(x)}{p_d(x) + p_g(x)},"}</MD>
        <p>
          and then <M>{"V(D^*, G) = -\\log 4 + 2\\,\\mathrm{JSD}(p_d \\| p_g)"}</M>, where{" "}
          <M>{"\\mathrm{JSD}(p \\| q) = \\tfrac12 \\mathrm{KL}(p \\| m) + \\tfrac12 \\mathrm{KL}(q \\| m)"}</M> with <M>{"m = (p + q)/2"}</M>. So the
          global minimum over G is <M>{"-\\log 4"}</M>, reached exactly when <M>{"p_g = p_d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write V as <M>{"\\int [p_d(x) \\log D(x) + p_g(x) \\log(1 - D(x))]\\, dx"}</M> and maximise pointwise. For a, b ≥ 0 not both
          zero, <M>{"a \\log y + b \\log(1 - y)"}</M> on (0, 1) has derivative <M>{"a/y - b/(1 - y)"}</M>, zero at y = a/(a + b), and is
          concave, giving <M>{"D^*"}</M> (<C>optimal_d</C>). Substituting,{" "}
          <M>{"V = \\mathbb{E}_{p_d} \\log \\frac{p_d}{p_d + p_g} + \\mathbb{E}_{p_g} \\log \\frac{p_g}{p_d + p_g}"}</M>. Writing{" "}
          <M>{"p_d + p_g = 2m"}</M>, each term is a KL divergence to m minus log 2, so{" "}
          <M>{"V = \\mathrm{KL}(p_d \\| m) + \\mathrm{KL}(p_g \\| m) - 2\\log 2 = 2\\,\\mathrm{JSD} - \\log 4"}</M> (<C>jsd</C>). The JSD is
          non-negative and zero only for equal distributions.
        </p>
        <Code>{VALUE}</Code>
      </Proof>

      <Remark title="a bounded divergence">
        <p>
          The JSD lies between 0 and log 2, reaching log 2 when the supports are disjoint (m12.2.5 places it among the
          f-divergences). Unlike the KL divergence, it stays finite when the generator puts mass where the data have none, which
          is why GANs tolerate the low-dimensional generators that maximum likelihood cannot. But it saturates: once the
          distributions are disjoint, moving the generator closer changes nothing, a problem taken up in l7.5.3.
        </p>
      </Remark>

      <Definition title="the non-saturating loss">
        <p>
          With <M>{"D = \\sigma(a)"}</M> for a logit a, the minimax generator loss <M>{"\\log(1 - D)"}</M> has derivative{" "}
          <M>{"-\\sigma(a) = -D"}</M> with respect to a, which vanishes when the discriminator confidently rejects a sample. Goodfellow
          and others therefore trained the generator to minimise <M>{"-\\log D(G(z))"}</M> instead, whose derivative{" "}
          <M>{"-(1 - D)"}</M> is near −1 exactly then (<C>g_losses</C>, <C>logit_grads</C>). It has the same fixed point but different
          dynamics, and it is the version used in practice.
        </p>
      </Definition>

      <Remark title="training is not minimisation">
        <p>
          In practice D and G are updated by alternating or simultaneous gradient steps, which need not converge to the
          equilibrium of a minimax problem. On the simplest game, <M>{"\\min_x \\max_y xy"}</M>, simultaneous gradient descent-ascent
          multiplies the distance from the equilibrium by <M>{"\\sqrt{1 + \\eta^2}"}</M> at every step and spirals outwards
          (<C>gda_bilinear</C>). The next lesson collects the pathologies this causes.
        </p>
        <Code>{LOSSES}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dstar",
      rung: "check",
      prompt: <p>At some x the data density is 0.3 and the generator density is 0.1. What does the optimal discriminator output there?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "value",
      rung: "check",
      prompt: <p>What is V(D*, G) when the generator matches the data exactly? Give four decimals.</p>,
      answer: { kind: "numeric", value: -1.3863, tolerance: 0.0001 },
    },
    {
      key: "nonsat",
      rung: "apply",
      prompt: <p>Early in training the discriminator rejects nearly all generated samples. Why does the non-saturating loss help?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its gradient with respect to the discriminator logit is −(1 − D), close to −1 when D is near 0, while the minimax loss gives −D, close to 0",
          "It changes the optimal discriminator",
          "It makes the generator's density computable",
          "It removes the need to train the discriminator",
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

def optimal_d(pd, pg):
    return [a / (a + b) if a + b > 0 else 0.5 for a, b in zip(pd, pg)]

def gan_value(pd, pg, D):
    v = sum(a * math.log(d) for a, d in zip(pd, D) if a > 0)
    return v + sum(b * math.log(1 - d) for b, d in zip(pg, D) if b > 0)

def jsd(pd, pg):
    m = [(a + b) / 2 for a, b in zip(pd, pg)]
    kl = lambda p: sum(a * math.log(a / c) for a, c in zip(p, m) if a > 0)
    return 0.5 * kl(pd) + 0.5 * kl(pg)

pd, pg = [0.5, 0.5, 0.0], [0.0, 0.5, 0.5]; D = optimal_d(pd, pg); print(D, round(gan_value(pd, pg, D), 4))
print(round(jsd(pd, pg), 4), round(-math.log(4) + 2 * jsd(pd, pg), 4), jsd([0.2, 0.8], [0.2, 0.8]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.5, 0.0] -0.6931\n0.3466 -0.6931 0.0",
          "[1.0, 0.5, 0.0] -1.3863\n0.3466 -0.6931 0.0",
          "[0.0, 0.5, 1.0] -0.6931\n0.3466 -0.6931 0.0",
          "[1.0, 0.5, 0.0] -0.6931\n0.6931 0.0 0.0",
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

def g_losses(d_fake):
    n = len(d_fake)
    return sum(math.log(1 - d) for d in d_fake) / n, -sum(math.log(d) for d in d_fake) / n

def logit_grads(d):
    return -d, -(1 - d)

def gda_bilinear(x, y, lr, steps):
    for _ in range(steps):
        x, y = x - lr * y, y + lr * x
    return x, y

print([round(v, 4) for v in g_losses([0.1, 0.1])], logit_grads(0.25), logit_grads(0.75))
x, y = gda_bilinear(1.0, 0.0, 0.1, 1); print(x, y, round(math.hypot(*gda_bilinear(1.0, 0.0, 0.1, 100)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.1054, 2.3026] (-0.25, -0.75) (-0.75, -0.25)\n1.0 0.1 1.6446",
          "[-0.1054, 2.3026] (-0.75, -0.25) (-0.25, -0.75)\n1.0 0.1 1.6446",
          "[-0.1054, 2.3026] (-0.25, -0.75) (-0.75, -0.25)\n1.0 -0.1 1.6446",
          "[-0.1054, 2.3026] (-0.25, -0.75) (-0.75, -0.25)\n1.0 0.1 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For discrete distributions given as lists, write <C>optimal_d(pd, pg)</C>, using 0.5 where both are zero;{" "}
          <C>gan_value(pd, pg, D)</C>, skipping terms with zero probability; and <C>jsd(pd, pg)</C> in nats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def optimal_d(pd, pg):
    return [0.5] * len(pd)

def gan_value(pd, pg, D):
    return 0.0

def jsd(pd, pg):
    return 0.0
`,
        solution: VALUE,
        tests: [
          { name: "discriminator", code: `d = optimal_d([0.3, 0.0, 0.0], [0.1, 0.0, 1.0]); assert abs(d[0] - 0.75) < 1e-12 and d[1:] == [0.5, 0.0]
assert abs(gan_value([0.5, 0.5], [0.5, 0.5], [0.5, 0.5]) + math.log(4)) < 1e-12 and abs(gan_value([1.0, 0.0], [0.0, 1.0], [1.0, 0.0])) < 1e-12` },
          { name: "divergence", code: `assert abs(jsd([1.0, 0.0], [0.0, 1.0]) - math.log(2)) < 1e-12 and jsd([0.3, 0.7], [0.3, 0.7]) == 0.0
pd, pg = [0.6, 0.4, 0.0], [0.1, 0.4, 0.5]; assert abs(gan_value(pd, pg, optimal_d(pd, pg)) - (2 * jsd(pd, pg) - math.log(4))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>g_losses(d_fake)</C>, returning the mean minimax loss log(1 − D) and the mean non-saturating loss −log D over the
          discriminator outputs on fakes; <C>logit_grads(d)</C>, their derivatives with respect to the logit; and{" "}
          <C>gda_bilinear(x, y, lr, steps)</C>, simultaneous descent in x and ascent in y on f = xy.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def g_losses(d_fake):
    return 0.0, 0.0

def logit_grads(d):
    return 0.0, 0.0

def gda_bilinear(x, y, lr, steps):
    return x, y
`,
        solution: LOSSES,
        tests: [
          { name: "losses", code: `a, b = g_losses([0.5, 0.25]); assert abs(a - (math.log(0.5) + math.log(0.75)) / 2) < 1e-12 and abs(b - (math.log(2) + math.log(4)) / 2) < 1e-12
assert logit_grads(0.5) == (-0.5, -0.5) and logit_grads(0.0) == (0.0, -1.0)` },
          { name: "descent-ascent", code: `x, y = gda_bilinear(0.0, 1.0, 0.5, 1); assert (x, y) == (-0.5, 1.0)
x, y = gda_bilinear(1.0, 1.0, 0.5, 2); assert abs(x + 0.25) < 1e-12 and abs(y - 1.75) < 1e-12 and gda_bilinear(3.0, 4.0, 0.1, 0) == (3.0, 4.0)` },
        ],
      },
    },
    {
      key: "jsd",
      rung: "stretch",
      prompt: <p>The data put probability 0.5 on each of two points; the generator puts all its mass on the first. What is the Jensen-Shannon divergence in nats? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.216, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The theorem promises a unique equilibrium at the data distribution. Real GAN training oscillates, collapses onto a few
        modes, and diverges. The next lesson shows why each of these happens.
      </p>
    </>
  ),
};
