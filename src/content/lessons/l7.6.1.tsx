import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EnergyTempViz } from "@/components/viz/EnergyTempViz";
import type { LessonContent } from "@/lib/types";

const EBM = `import math

def log_partition(energies, T=1.0):
    m = max(-e / T for e in energies)
    return m + math.log(sum(math.exp(-e / T - m) for e in energies))

def boltzmann(energies, T=1.0):
    lz = log_partition(energies, T)
    return [math.exp(-e / T - lz) for e in energies]

def ll_grad(theta, feats, data):
    energies = [sum(t * f for t, f in zip(theta, fs)) for fs in feats]
    p = boltzmann(energies)
    pos = [sum(feats[s][j] for s in data) / len(data) for j in range(len(theta))]
    neg = [sum(p[s] * feats[s][j] for s in range(len(feats))) for j in range(len(theta))]
    return [n - q for q, n in zip(pos, neg)]`;

const NCE = `import math

def nce_logit(neg_energy, c, log_noise):
    return neg_energy - c - log_noise

def log_sigmoid(a):
    return -math.log1p(math.exp(-a)) if a >= 0 else a - math.log1p(math.exp(a))

def nce_loss(data_logits, noise_logits):
    pos = -sum(log_sigmoid(a) for a in data_logits) / len(data_logits)
    return pos - sum(log_sigmoid(-a) for a in noise_logits) / len(noise_logits)`;

export const lesson: LessonContent = {
  id: "l7.6.1",
  minutes: 45,
  links: {
    requires: ["l7.1.2", "m13.4.1", "m12.6.2"],
    revisits: ["m11.2.3", "l2.2.3"],
    foreshadows: ["l7.6.2", "l7.6.3", "l9.3.2"],
  },

  puzzle: (
    <>
      <p>
        A neural network that outputs one number for each image, low for plausible images and high for implausible ones, is
        about the most flexible model imaginable: no invertibility, no ordering of pixels, no latent code. Turning those numbers
        into probabilities needs only exponentiating and normalising. The normaliser, however, is a sum over every possible
        image. Can such a model be trained by maximum likelihood without ever computing it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An <em>energy-based model</em> assigns each x an energy E(x) and the density <M>{"e^{-E(x)}/Z"}</M>. Low energy means
        high probability; only differences in energy matter, since adding a constant to E changes Z by the same factor.
        Physics calls this the Boltzmann distribution, and a temperature T rescales the energy: low temperatures concentrate
        mass in the deepest wells, high temperatures spread it out.
      </p>
      <p>
        The gradient of the log-likelihood turns out to be a difference of two averages: push energy down on data, and push it
        up on samples from the model. The first is easy. The second needs samples from the model itself, and that is where all
        the difficulty lives.
      </p>
      <EnergyTempViz />
    </>
  ),

  theory: (
    <>
      <Definition title="energy-based model">
        <p>
          An EBM with energy <M>{"E_\\theta : \\mathcal{X} \\to \\mathbb{R}"}</M> and temperature T defines{" "}
          <M>{"p_\\theta(x) = \\exp(-E_\\theta(x)/T) / Z_\\theta"}</M> with <M>{"Z_\\theta = \\int \\exp(-E_\\theta(x)/T)\\, dx"}</M>, which must be
          finite. On a finite set, <M>{"\\log Z"}</M> is a log-sum-exp (m11.2.3, <C>log_partition</C>) and p is a softmax of{" "}
          <M>{"-E/T"}</M> (<C>boltzmann</C>); a classifier&apos;s logits are negative energies of a conditional EBM over labels (l2.2.3).
        </p>
      </Definition>

      <Theorem title="the likelihood gradient">
        <MD>{"\\nabla_\\theta \\log p_\\theta(x) = -\\nabla_\\theta E_\\theta(x) + \\mathbb{E}_{x' \\sim p_\\theta}\\big[\\nabla_\\theta E_\\theta(x')\\big] \\qquad (T = 1)."}</MD>
        <p>
          Averaged over data, the gradient of the log-likelihood is the model&apos;s expected energy gradient minus the data&apos;s:
          a <em>positive phase</em> that lowers energy on data and a <em>negative phase</em> that raises it on model samples.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\log p_\\theta(x) = -E_\\theta(x) - \\log Z_\\theta"}</M>, and{" "}
          <M>{"\\nabla_\\theta \\log Z_\\theta = \\frac{1}{Z_\\theta}\\int -\\nabla_\\theta E_\\theta(x') e^{-E_\\theta(x')} dx' = -\\mathbb{E}_{p_\\theta}[\\nabla_\\theta E_\\theta]"}</M>.
          For a linear energy <M>{"E_\\theta(x) = \\theta^\\top \\phi(x)"}</M>, an exponential family (m12.6.2), the gradient is{" "}
          <M>{"\\mathbb{E}_{p_\\theta}[\\phi] - \\bar\\phi_{\\text{data}}"}</M>, and it is zero exactly when the model&apos;s expected features
          match the data&apos;s (<C>ll_grad</C>).
        </p>
        <Code>{EBM}</Code>
      </Proof>

      <Remark title="sampling the negative phase">
        <p>
          The expectation under <M>{"p_\\theta"}</M> is estimated with Markov chain Monte Carlo (m13.4.1), which needs only energy
          differences, so Z cancels. Running chains to equilibrium at every step is far too slow, so practice cuts corners.{" "}
          <em>Contrastive divergence</em> (Hinton, 2002) starts short chains at the data and runs a few steps; persistent
          chains carry their state from one step to the next; modern image EBMs use a few dozen steps of Langevin dynamics
          (l7.6.3) from a replay buffer. Each shortcut biases the gradient, and the model learns whatever its sampler can reach.
        </p>
      </Remark>

      <Definition title="noise-contrastive estimation">
        <p>
          NCE (Gutmann and Hyvärinen, 2010) avoids sampling the model. Treat <M>{"\\log Z"}</M> as a learned scalar c and train a
          logistic classifier to tell data from samples of a known noise distribution q, with logit{" "}
          <M>{"-E_\\theta(x) - c - \\log q(x)"}</M> (<C>nce_logit</C>), by minimising the binary cross-entropy (<C>log_sigmoid</C>,{" "}
          <C>nce_loss</C>). If the model family contains the data distribution, the optimum is{" "}
          <M>{"e^{-E_\\theta - c} = p_{\\text{data}}"}</M>, normalised automatically. It works when q is close enough to the data that the
          classification is not trivial, the same lesson as in GANs (l7.5.1), but with q fixed.
        </p>
        <Code>{NCE}</Code>
      </Definition>

      <Remark title="where energies appear">
        <p>
          Restricted Boltzmann machines, Hopfield networks and the Bradley-Terry model of preferences (l9.3.2) are all
          energy-based. A diffusion model can be read as learning the gradient of an energy at many noise levels, which avoids Z
          entirely; that idea, score matching, is the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "boltz",
      rung: "check",
      prompt: <p>Three states have energies 0, 1 and 2 at temperature 1. What is the probability of the first? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.6652, tolerance: 0.0001 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>At temperature 2, what is the probability ratio between a state of energy 0 and one of energy 2? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.7183, tolerance: 0.0001 },
    },
    {
      key: "negative",
      rung: "apply",
      prompt: <p>Why does maximum-likelihood training of an energy-based model need samples from the model itself?</p>,
      answer: {
        kind: "choice",
        options: [
          "The gradient of log Z is the expected energy gradient under the model, which can only be estimated by sampling from it",
          "The energy of the data cannot be computed",
          "The positive phase needs model samples",
          "Samples are needed to compute the temperature",
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

def log_partition(energies, T=1.0):
    m = max(-e / T for e in energies)
    return m + math.log(sum(math.exp(-e / T - m) for e in energies))

def boltzmann(energies, T=1.0):
    lz = log_partition(energies, T)
    return [math.exp(-e / T - lz) for e in energies]

def ll_grad(theta, feats, data):
    energies = [sum(t * f for t, f in zip(theta, fs)) for fs in feats]
    p = boltzmann(energies)
    pos = [sum(feats[s][j] for s in data) / len(data) for j in range(len(theta))]
    neg = [sum(p[s] * feats[s][j] for s in range(len(feats))) for j in range(len(theta))]
    return [n - q for q, n in zip(pos, neg)]

print([round(p, 4) for p in boltzmann([0, math.log(3)])], [round(p, 4) for p in boltzmann([0, math.log(3)], 1e9)], round(log_partition([0, 0]), 4))
print(ll_grad([0.0], [[1.0], [0.0]], [0, 0]), [round(g, 4) for g in ll_grad([1.0], [[1.0], [0.0]], [1])], round(log_partition([1000, 1000]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.75, 0.25] [0.5, 0.5] 0.6931\n[-0.5] [0.2689] -999.3069",
          "[0.25, 0.75] [0.5, 0.5] 0.6931\n[-0.5] [0.2689] -999.3069",
          "[0.75, 0.25] [0.5, 0.5] 0.6931\n[0.5] [-0.2689] -999.3069",
          "[0.75, 0.25] [0.5, 0.5] 0.6931\n[-0.5] [0.2689] 1000.6931",
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

def nce_logit(neg_energy, c, log_noise):
    return neg_energy - c - log_noise

def log_sigmoid(a):
    return -math.log1p(math.exp(-a)) if a >= 0 else a - math.log1p(math.exp(a))

def nce_loss(data_logits, noise_logits):
    pos = -sum(log_sigmoid(a) for a in data_logits) / len(data_logits)
    return pos - sum(log_sigmoid(-a) for a in noise_logits) / len(noise_logits)

print(nce_logit(-1.0, 0.5, -2.0), round(log_sigmoid(0), 4), log_sigmoid(-1000), round(log_sigmoid(2), 4))
print(round(nce_loss([0.0], [0.0]), 4), round(nce_loss([5.0], [-5.0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 -0.6931 -1000.0 -0.1269\n1.3863 0.0134",
          "-3.5 -0.6931 -1000.0 -0.1269\n1.3863 0.0134",
          "0.5 -0.6931 0.0 -0.1269\n1.3863 0.0134",
          "0.5 -0.6931 -1000.0 -0.1269\n0.6931 0.0134",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write a stable <C>log_partition(energies, T=1.0)</C>, <C>boltzmann(energies, T=1.0)</C>, and{" "}
          <C>ll_grad(theta, feats, data)</C>: for states with feature lists <C>feats[s]</C>, energy <M>{"\\theta^\\top\\phi(s)"}</M> at
          T = 1, and data given as a list of state indices, the gradient of the average log-likelihood with respect to θ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_partition(energies, T=1.0):
    return math.log(sum(math.exp(-e / T) for e in energies))

def boltzmann(energies, T=1.0):
    return [1 / len(energies)] * len(energies)

def ll_grad(theta, feats, data):
    return [0.0] * len(theta)
`,
        solution: EBM,
        tests: [
          { name: "partition", code: `assert abs(log_partition([1000.0, 1000.0]) + 1000 - math.log(2)) < 1e-9 and abs(log_partition([0.0], 5.0)) < 1e-12
p = boltzmann([0.0, 2.0], 2.0); assert abs(p[0] - 1 / (1 + math.exp(-1))) < 1e-12 and abs(sum(boltzmann([3.0, -1.0, 7.0])) - 1) < 1e-12` },
          { name: "gradient", code: `g = ll_grad([0.0, 0.0], [[1.0, 0.0], [0.0, 1.0], [0.0, 0.0]], [0, 0, 1])
assert abs(g[0] - (1 / 3 - 2 / 3)) < 1e-12 and abs(g[1] - (1 / 3 - 1 / 3)) < 1e-12
g = ll_grad([math.log(2)], [[1.0], [0.0]], [1]); assert abs(g[0] - 1 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nce_logit(neg_energy, c, log_noise)</C>, a numerically stable <C>log_sigmoid(a)</C>, and{" "}
          <C>nce_loss(data_logits, noise_logits)</C>, the mean binary cross-entropy on data plus that on noise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def nce_logit(neg_energy, c, log_noise):
    return neg_energy

def log_sigmoid(a):
    return math.log(1 / (1 + math.exp(-a)))

def nce_loss(data_logits, noise_logits):
    return 0.0
`,
        solution: NCE,
        tests: [
          { name: "logit and log-sigmoid", code: `assert nce_logit(2.0, 0.5, 1.0) == 0.5 and abs(log_sigmoid(-800.0) + 800) < 1e-9 and abs(log_sigmoid(800.0)) < 1e-12 and abs(log_sigmoid(0.0) + math.log(2)) < 1e-12` },
          { name: "loss", code: `assert abs(nce_loss([0.0, 0.0], [0.0]) - 2 * math.log(2)) < 1e-12 and abs(nce_loss([2.0], [1.0]) - (math.log1p(math.exp(-2)) + math.log1p(math.exp(1)))) < 1e-12` },
        ],
      },
    },
    {
      key: "match",
      rung: "stretch",
      prompt: (
        <p>
          A model on the states 0, 1 and 2 has energy θ·s, and the data have mean state 1.5. At what θ is the likelihood
          gradient zero? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.834, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The gradient of the log-density with respect to x, the score, does not involve Z at all. The next lesson shows that a
        network can learn the score directly from data, with no sampling during training.
      </p>
    </>
  ),
};
