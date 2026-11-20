import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WassersteinViz } from "@/components/viz/WassersteinViz";
import type { LessonContent } from "@/lib/types";

const DISTANCE = `def w1_samples(xs, ys):
    return sum(abs(a - b) for a, b in zip(sorted(xs), sorted(ys))) / len(xs)

def w1_discrete(p, q, positions):
    total, gap = 0.0, 0.0
    for i in range(len(positions) - 1):
        gap += p[i] - q[i]
        total += abs(gap) * (positions[i + 1] - positions[i])
    return total

def critic_value(f, xs, ys):
    return sum(f(x) for x in xs) / len(xs) - sum(f(y) for y in ys) / len(ys)`;

const CRITIC = `def interpolate(x, y, u):
    return u * x + (1 - u) * y

def gradient_penalty(grad_norms, lam):
    return lam * sum((g - 1) ** 2 for g in grad_norms) / len(grad_norms)

def clip_weights(ws, c):
    return [max(-c, min(c, w)) for w in ws]`;

export const lesson: LessonContent = {
  id: "l7.5.3",
  minutes: 45,
  links: {
    requires: ["l7.5.2", "m10.4.2"],
    revisits: ["l7.5.1", "m12.2.5"],
    foreshadows: ["l12.2.3"],
  },

  puzzle: (
    <>
      <p>
        Two piles of sand sit on a line, one at position 0 and one at position θ. If θ is 10 or 0.001, the Jensen-Shannon
        divergence between them is the same, log 2, because they do not overlap. A generator learning to move its pile onto
        the data therefore gets no signal from it until the piles already touch. Common sense says the piles are closer at
        0.001 than at 10. Which measure of distance between distributions agrees with common sense, and can a neural network
        estimate it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Measure how much work it takes to move one pile into the other: mass times distance moved, minimised over all ways of
        moving it. This is the <em>earth mover&apos;s</em> or Wasserstein-1 distance. Two point masses θ apart are at distance
        |θ|, which shrinks smoothly as they approach.
      </p>
      <p>
        The minimisation over transport plans has a dual form: the largest gap between the average of a function on the data
        and on the samples, over all functions whose slope never exceeds 1. A neural network constrained to be 1-Lipschitz, the{" "}
        <em>critic</em>, can approximate that function, and the gap it achieves estimates the distance.
      </p>
      <WassersteinViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Wasserstein-1 distance">
        <p>For distributions p and q,</p>
        <MD>{"W_1(p, q) = \\inf_{\\gamma \\in \\Pi(p, q)} \\mathbb{E}_{(x, y) \\sim \\gamma} \\|x - y\\|,"}</MD>
        <p>
          where <M>{"\\Pi(p, q)"}</M> is the set of joint distributions, or transport plans, with marginals p and q. In one
          dimension the optimal plan matches quantiles, so <M>{"W_1 = \\int |F_p(t) - F_q(t)|\\, dt"}</M>, the area between the
          cumulative distribution functions (<C>w1_discrete</C>); for two samples of equal size it is the mean absolute difference
          of the sorted samples (<C>w1_samples</C>).
        </p>
      </Definition>

      <Theorem title="continuity where the JSD fails">
        <p>
          Let p be uniform on [0, w] and <M>{"q_\\theta"}</M> uniform on [θ, θ + w]. Then <M>{"W_1(p, q_\\theta) = |\\theta|"}</M>, while{" "}
          <M>{"\\mathrm{JSD}(p \\| q_\\theta) = \\min(|\\theta|/w, 1) \\log 2"}</M>, constant for |θ| ≥ w.
        </p>
      </Theorem>
      <Proof>
        <p>
          The cumulative distribution functions differ by a horizontal shift of θ, so the area between them is |θ| times the
          height 1. For the JSD with 0 ≤ θ &lt; w, on the overlap the two densities are equal and contribute nothing, and on the
          two non-overlapping pieces, each of probability θ/w under one distribution, the mixture is half the density, giving{" "}
          <M>{"\\tfrac12 \\cdot \\tfrac{\\theta}{w}\\log 2 + \\tfrac12 \\cdot \\tfrac{\\theta}{w}\\log 2"}</M>. For θ ≥ w the supports are
          disjoint and the JSD is log 2.
        </p>
        <Code>{DISTANCE}</Code>
      </Proof>

      <Theorem title="Kantorovich-Rubinstein duality">
        <MD>{"W_1(p, q) = \\sup_{\\|f\\|_L \\le 1} \; \\mathbb{E}_{x \\sim p}[f(x)] - \\mathbb{E}_{y \\sim q}[f(y)],"}</MD>
        <p>the supremum over functions with Lipschitz constant at most 1.</p>
      </Theorem>
      <Proof>
        <p>
          One direction is short. For any 1-Lipschitz f and any plan γ,{" "}
          <M>{"\\mathbb{E}_p f - \\mathbb{E}_q f = \\mathbb{E}_\\gamma[f(x) - f(y)] \\le \\mathbb{E}_\\gamma \\|x - y\\|"}</M>, because both
          marginals are respected; taking the infimum over γ gives ≤. Equality is linear-programming duality (m10.4.2) applied to
          the transport problem, whose dual variables become f; we do not prove it here. Each value of the gap for a particular
          f is a lower bound on the distance (<C>critic_value</C>).
        </p>
      </Proof>

      <Definition title="WGAN and WGAN-GP">
        <p>
          The Wasserstein GAN (Arjovsky, Chintala and Bottou, 2017) trains a critic <M>{"f_w"}</M> to maximise{" "}
          <M>{"\\mathbb{E}_{p_d} f_w - \\mathbb{E}_{p_g} f_w"}</M> and the generator to minimise it. The original enforced the
          Lipschitz bound crudely by clipping every weight to [−c, c] (<C>clip_weights</C>), which wastes capacity and can make
          training slow or unstable. WGAN-GP (Gulrajani and others, 2017) instead penalises{" "}
          <M>{"\\lambda\\, \\mathbb{E}(\\|\\nabla_{\\hat x} f(\\hat x)\\| - 1)^2"}</M> at random points{" "}
          <M>{"\\hat x = u x + (1 - u)\\tilde x"}</M> on segments between real and generated samples (<C>interpolate</C>,{" "}
          <C>gradient_penalty</C>), with λ = 10: an optimal critic has gradient norm 1 along the lines of the optimal transport
          plan.
        </p>
        <Code>{CRITIC}</Code>
      </Definition>

      <Remark title="what it bought">
        <p>
          The critic can be trained to near-optimality without starving the generator of gradients, its loss tracks sample
          quality during training, and mode collapse became rarer. In later practice the non-saturating loss with an R1 penalty
          and spectral normalisation (l7.5.2) matched or beat it, and diffusion models eventually replaced GANs for most image
          generation, but optimal transport returned in flow matching (l12.2.3), and adversarial losses remain in tokenisers
          (l7.3.4) and in distilling diffusion models into one-step generators.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "samples",
      rung: "check",
      prompt: <p>What is the Wasserstein-1 distance between the samples [0, 2, 4] and [1, 1, 7]? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.6667, tolerance: 0.0001 },
    },
    {
      key: "jsd",
      rung: "check",
      prompt: <p>What is the Jensen-Shannon divergence between the uniform distributions on [0, 1] and [0.25, 1.25], in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1733, tolerance: 0.0001 },
    },
    {
      key: "lipschitz",
      rung: "apply",
      prompt: <p>Why must the WGAN critic be kept Lipschitz?</p>,
      answer: {
        kind: "choice",
        options: [
          "Without the constraint the gap between its averages on real and fake data can be made arbitrarily large, so it estimates no distance",
          "Lipschitz networks train faster on GPUs",
          "The generator's loss would otherwise be negative",
          "The constraint makes the critic a probability",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def w1_samples(xs, ys):
    return sum(abs(a - b) for a, b in zip(sorted(xs), sorted(ys))) / len(xs)

def w1_discrete(p, q, positions):
    total, gap = 0.0, 0.0
    for i in range(len(positions) - 1):
        gap += p[i] - q[i]
        total += abs(gap) * (positions[i + 1] - positions[i])
    return total

def critic_value(f, xs, ys):
    return sum(f(x) for x in xs) / len(xs) - sum(f(y) for y in ys) / len(ys)

print(round(w1_samples([0, 1, 3], [1, 2, 5]), 4), w1_discrete([0.5, 0.5, 0.0], [0.0, 0.5, 0.5], [0, 1, 2]), w1_discrete([1.0, 0.0], [0.0, 1.0], [0, 10]))
print(round(critic_value(lambda x: x, [0, 1, 3], [1, 2, 5]), 4), round(critic_value(lambda x: -x, [0, 1, 3], [1, 2, 5]), 4), critic_value(abs, [-1, 1], [0, 0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.3333 1.0 10.0\n-1.3333 1.3333 1.0",
          "1.3333 0.5 10.0\n-1.3333 1.3333 1.0",
          "1.3333 1.0 1.0\n-1.3333 1.3333 1.0",
          "1.3333 1.0 10.0\n1.3333 -1.3333 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def interpolate(x, y, u):
    return u * x + (1 - u) * y

def gradient_penalty(grad_norms, lam):
    return lam * sum((g - 1) ** 2 for g in grad_norms) / len(grad_norms)

def clip_weights(ws, c):
    return [max(-c, min(c, w)) for w in ws]

print(interpolate(0.0, 4.0, 0.25), interpolate(2.0, 4.0, 1.0), round(gradient_penalty([1.0, 3.0, 0.0], 10), 4))
print(clip_weights([-0.5, 0.005, 0.02], 0.01), gradient_penalty([1.0, 1.0], 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 2.0 16.6667\n[-0.01, 0.005, 0.01] 0.0",
          "1.0 2.0 16.6667\n[-0.01, 0.005, 0.01] 0.0",
          "3.0 4.0 16.6667\n[-0.01, 0.005, 0.01] 0.0",
          "3.0 2.0 33.3333\n[-0.01, 0.005, 0.01] 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>w1_samples(xs, ys)</C> for samples of equal size; <C>w1_discrete(p, q, positions)</C>, the area between the
          cumulative distribution functions of two distributions on the same sorted positions; and{" "}
          <C>critic_value(f, xs, ys)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def w1_samples(xs, ys):
    return abs(sum(xs) - sum(ys)) / len(xs)

def w1_discrete(p, q, positions):
    return 0.0

def critic_value(f, xs, ys):
    return 0.0
`,
        solution: DISTANCE,
        tests: [
          { name: "samples", code: `assert w1_samples([0, 4], [4, 0]) == 0 and w1_samples([0, 4], [2, 2]) == 2 and w1_samples([5], [1]) == 4` },
          { name: "discrete and critic", code: `assert abs(w1_discrete([0.5, 0.0, 0.5], [0.0, 1.0, 0.0], [0, 1, 3]) - 1.5) < 1e-12 and w1_discrete([1.0], [1.0], [7]) == 0.0
assert critic_value(lambda x: 2 * x, [1, 3], [0]) == 4 and critic_value(lambda x: x * x, [2], [1, 3]) == -1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>interpolate(x, y, u)</C>, the point u·x + (1 − u)·y; <C>gradient_penalty(grad_norms, lam)</C>, λ times the mean of{" "}
          <M>{"(\\|g\\| - 1)^2"}</M>; and <C>clip_weights(ws, c)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def interpolate(x, y, u):
    return x

def gradient_penalty(grad_norms, lam):
    return 0.0

def clip_weights(ws, c):
    return list(ws)
`,
        solution: CRITIC,
        tests: [
          { name: "interpolate and clip", code: `assert interpolate(10.0, 0.0, 0.3) == 3.0 and interpolate(1.0, 5.0, 0.0) == 5.0 and clip_weights([3, -3, 0.5], 1) == [1, -1, 0.5]` },
          { name: "penalty", code: `assert gradient_penalty([0.0, 2.0], 5) == 5.0 and gradient_penalty([1.0], 10) == 0.0 and abs(gradient_penalty([1.5], 4) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "uniform",
      rung: "stretch",
      prompt: <p>What is the Wasserstein-1 distance between the uniform distributions on [0, 2] and on [3, 4]?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        GANs abandon densities entirely. The next part goes halfway: an energy-based model defines a density up to an unknown
        constant, which is enough to compare points and, with the right tools, to train and to sample.
      </p>
    </>
  ),
};
