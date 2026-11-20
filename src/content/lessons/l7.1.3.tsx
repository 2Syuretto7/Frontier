import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PrecisionRecallViz } from "@/components/viz/PrecisionRecallViz";
import type { LessonContent } from "@/lib/types";

const LIKELIHOOD = `import math

def bits_per_dim(nll_nats, dims):
    return nll_nats / (dims * math.log(2))

def rescaled_nll(nll_nats, dims, factor):
    return nll_nats + dims * math.log(factor)

def mixture_nll_bound(nll_good, weight):
    return nll_good - math.log(weight)`;

const SAMPLES = `def frechet_1d(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sx = (sum((x - mx) ** 2 for x in xs) / len(xs)) ** 0.5
    sy = (sum((y - my) ** 2 for y in ys) / len(ys)) ** 0.5
    return (mx - my) ** 2 + (sx - sy) ** 2

def knn_radii(points, k):
    return [sorted(abs(p - q) for j, q in enumerate(points) if j != i)[k - 1] for i, p in enumerate(points)]

def precision(real, fake, k):
    radii = knn_radii(real, k)
    hits = sum(any(abs(f - r) <= rad for r, rad in zip(real, radii)) for f in fake)
    return hits / len(fake)`;

export const lesson: LessonContent = {
  id: "l7.1.3",
  minutes: 45,
  links: {
    requires: ["l7.1.2", "m12.4.2"],
    revisits: ["l7.1.1", "m12.2.2"],
    foreshadows: ["l7.2.2", "l7.5.2", "l10.1.1"],
  },

  puzzle: (
    <>
      <p>
        Two image generators are submitted to a competition. The first has the better test likelihood. The second produces
        pictures that people prefer nine times out of ten. A third entrant then takes the first model, mixes it with a
        generator of pure static that is used 99% of the time, and claims a likelihood almost as good as the first. Can that be
        right, and if so, what should the judges measure?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        It can be right. Likelihood rewards covering all of the data: a model pays an enormous price for calling any real
        image impossible, and only a small, fixed price for wasting probability on nonsense. Sample quality rewards the
        opposite: never producing nonsense, even at the cost of ignoring some kinds of data. The two can disagree badly.
      </p>
      <p>
        Sample-based measures therefore separate the two failures. <em>Precision</em> asks whether the model&apos;s samples look
        like data; <em>recall</em> asks whether the data look like something the model produces. Single summary scores, such
        as the Fréchet distance, blend them and can miss a model that quietly drops whole kinds of data.
      </p>
      <PrecisionRecallViz />
    </>
  ),

  theory: (
    <>
      <Definition title="bits per dimension">
        <p>
          A held-out negative log-likelihood of L nats for an example with D dimensions is reported as{" "}
          <M>{"L / (D \\ln 2)"}</M> bits per dimension (<C>bits_per_dim</C>), the code length per pixel or per byte that the
          model would achieve as a compressor (m12.4.2). Its natural counterpart for text is bits per byte or perplexity.
        </p>
      </Definition>

      <Theorem title="densities depend on units">
        <p>
          If data x in <M>{"\\mathbb{R}^D"}</M> are rescaled to <M>{"x' = x / c"}</M>, a model&apos;s density changes to{" "}
          <M>{"p'(x') = c^D p(x)"}</M>, so the negative log-likelihood measured in the original units is{" "}
          <M>{"L' + D \\ln c"}</M>, where <M>{"L'"}</M> is the loss measured on the rescaled data (<C>rescaled_nll</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The map <M>{"x \\mapsto x / c"}</M> shrinks volumes by <M>{"c^D"}</M>. Probabilities of corresponding sets must agree, so
          the density on the rescaled data is <M>{"c^D"}</M> times larger, and taking minus the log gives{" "}
          <M>{"-\\log p(x) = -\\log p'(x') + D \\log c"}</M>. A continuous density on data that are really 8-bit integers can be
          made arbitrarily large by squeezing it onto the integers, so it is compared fairly only after <em>dequantisation</em>:
          adding uniform noise in [0, 1) to each integer value before scaling makes the continuous likelihood a lower bound on the
          probability of the discrete data, and makes reported numbers comparable.
        </p>
      </Proof>

      <Theorem title="likelihood barely notices junk">
        <p>
          (Theis, van den Oord and Bethge, 2016.) If a model q is mixed with any other distribution r as{" "}
          <M>{"w q + (1 - w) r"}</M>, its negative log-likelihood on every example rises by at most <M>{"-\\log w"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The mixture density is at least <M>{"w q(x)"}</M>, so{" "}
          <M>{"-\\log(w q(x) + (1 - w) r(x)) \\le -\\log q(x) - \\log w"}</M> (<C>mixture_nll_bound</C>). With w = 0.01 the penalty
          is at most 4.61 nats per image, which for a 3072-dimensional image is 0.0022 bits per dimension: a model that outputs
          static 99% of the time can have almost the same likelihood as a good one. Conversely, a model with excellent samples
          can have terrible likelihood if it gives some test image tiny probability.
        </p>
        <Code>{LIKELIHOOD}</Code>
      </Proof>

      <Definition title="Fréchet distance">
        <p>
          The <em>Fréchet Inception Distance</em> (FID) embeds real and generated images with a fixed pretrained network, fits a
          Gaussian to each set of embeddings and reports the Fréchet (2-Wasserstein) distance between the Gaussians,
        </p>
        <MD>{"\\|\\mu_1 - \\mu_2\\|^2 + \\operatorname{tr}\\big(\\Sigma_1 + \\Sigma_2 - 2(\\Sigma_1 \\Sigma_2)^{1/2}\\big),"}</MD>
        <p>
          which in one dimension is <M>{"(\\mu_1 - \\mu_2)^2 + (\\sigma_1 - \\sigma_2)^2"}</M> (<C>frechet_1d</C>). It is only as good as
          the features: it sees nothing that changes neither mean nor covariance of the embeddings. It is also biased upward for
          small samples, so FIDs are comparable only at equal sample sizes.
        </p>
      </Definition>

      <Definition title="precision and recall">
        <p>
          (Kynkäänniemi and others, 2019.) For each real point, take the ball reaching its k-th nearest real neighbour
          (<C>knn_radii</C>); the union of balls estimates the support of the data. <em>Precision</em> is the fraction of generated
          points inside that union (<C>precision</C>). <em>Recall</em> swaps the roles: the fraction of real points inside the union
          of balls around generated points. A single outlier with a large ball can inflate the estimate, which is why k is kept
          small and robust variants exist.
        </p>
        <Code>{SAMPLES}</Code>
      </Definition>

      <Remark title="what to report">
        <p>
          Report held-out likelihood when the model provides it, a sample-based score computed with a stated feature network and
          sample size, precision and recall separately, and samples themselves, including uncurated ones. For text generators,
          likelihood is the standard measure of the base model, and downstream evaluations take over afterwards (l10.1.1).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bpd",
      rung: "check",
      prompt: <p>A model has a held-out negative log-likelihood of 7000 nats per 32 by 32 colour image (3072 dimensions). How many bits per dimension is that? Give three decimals.</p>,
      answer: { kind: "numeric", value: 3.287, tolerance: 0.001 },
    },
    {
      key: "junk",
      rung: "check",
      prompt: (
        <p>
          A model of 32 by 32 greyscale images (1024 dimensions) is mixed with static used 99% of the time. By at most how many
          bits per dimension can its held-out score worsen? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0065, tolerance: 0.0001 },
    },
    {
      key: "dropping",
      rung: "apply",
      prompt: <p>A face generator produces flawless faces but never anyone wearing glasses, though 20% of the data wear glasses. Which measure reveals this most directly?</p>,
      answer: {
        kind: "choice",
        options: ["Recall", "Precision", "Bits per dimension of the training set", "The number of parameters"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def bits_per_dim(nll_nats, dims):
    return nll_nats / (dims * math.log(2))

def rescaled_nll(nll_nats, dims, factor):
    return nll_nats + dims * math.log(factor)

def mixture_nll_bound(nll_good, weight):
    return nll_good - math.log(weight)

print(round(bits_per_dim(3072 * 3 * math.log(2), 3072), 6), round(rescaled_nll(0.0, 1, 256), 4))
print(round(mixture_nll_bound(2.0, 0.01), 4), round(bits_per_dim(mixture_nll_bound(3072 * 3 * math.log(2), 0.01), 3072), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 5.5452\n6.6052 3.0022",
          "3.0 -5.5452\n6.6052 3.0022",
          "3.0 5.5452\n-2.6052 3.0022",
          "3.0 5.5452\n6.6052 9.6052",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def frechet_1d(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sx = (sum((x - mx) ** 2 for x in xs) / len(xs)) ** 0.5
    sy = (sum((y - my) ** 2 for y in ys) / len(ys)) ** 0.5
    return (mx - my) ** 2 + (sx - sy) ** 2

def knn_radii(points, k):
    return [sorted(abs(p - q) for j, q in enumerate(points) if j != i)[k - 1] for i, p in enumerate(points)]

def precision(real, fake, k):
    radii = knn_radii(real, k)
    hits = sum(any(abs(f - r) <= rad for r, rad in zip(real, radii)) for f in fake)
    return hits / len(fake)

print(frechet_1d([0, 2], [3, 5]), frechet_1d([0, 2], [1, 1]), knn_radii([0, 1, 3], 1))
print(round(precision([0, 1, 3], [0.5, 2.5, 9], 1), 3), precision([0.5, 2.5, 9], [0, 1, 3], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "9.0 1.0 [1, 1, 2]\n0.667 1.0",
          "9.0 1.0 [1, 1, 2]\n0.667 0.667",
          "3.0 1.0 [1, 1, 2]\n0.667 1.0",
          "9.0 1.0 [0, 0, 0]\n0.333 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bits_per_dim(nll_nats, dims)</C>; <C>rescaled_nll(nll_nats, dims, factor)</C>, the loss in the original units given the
          loss <C>nll_nats</C> measured on the data divided by factor; and <C>mixture_nll_bound(nll_good, weight)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bits_per_dim(nll_nats, dims):
    return nll_nats / dims

def rescaled_nll(nll_nats, dims, factor):
    return nll_nats

def mixture_nll_bound(nll_good, weight):
    return nll_good
`,
        solution: LIKELIHOOD,
        tests: [
          { name: "bits", code: `assert abs(bits_per_dim(math.log(2) * 10, 5) - 2) < 1e-12 and bits_per_dim(0.0, 3) == 0.0` },
          { name: "rescale and mixture", code: `assert abs(rescaled_nll(1.0, 2, math.e) - 3.0) < 1e-12 and rescaled_nll(4.0, 7, 1) == 4.0
assert abs(mixture_nll_bound(1.0, 0.5) - (1 + math.log(2))) < 1e-12 and mixture_nll_bound(2.5, 1.0) == 2.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For one-dimensional samples, write <C>frechet_1d(xs, ys)</C> with population standard deviations;{" "}
          <C>knn_radii(points, k)</C>, each point&apos;s distance to its k-th nearest other point; and{" "}
          <C>precision(real, fake, k)</C>, the fraction of fake points within the radius of some real point (recall is{" "}
          <C>precision(fake, real, k)</C>).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def frechet_1d(xs, ys):
    return 0.0

def knn_radii(points, k):
    return [0.0] * len(points)

def precision(real, fake, k):
    return 1.0
`,
        solution: SAMPLES,
        tests: [
          { name: "frechet", code: `assert abs(frechet_1d([1, 3], [1, 3])) < 1e-12 and abs(frechet_1d([0, 4], [1, 3]) - 1.0) < 1e-12 and abs(frechet_1d([0], [5]) - 25) < 1e-12` },
          { name: "radii and precision", code: `assert knn_radii([0, 2, 3, 10], 1) == [2, 1, 1, 7] and knn_radii([0, 2, 3, 10], 2) == [3, 2, 3, 8]
assert precision([0, 2, 3, 10], [1, 20], 1) == 0.5 and precision([0, 1], [5, 6], 1) == 0.0 and precision([0, 2, 3, 10], [16], 1) == 1.0` },
        ],
      },
    },
    {
      key: "dequant",
      rung: "stretch",
      prompt: (
        <p>
          Images with 1024 pixels of 8-bit values are divided by 256 and dequantised, and a model reports a negative
          log-likelihood of -2000 nats per image on this [0, 1] scale. What is that in bits per dimension on the original 0 to 255
          scale, where each integer bin has width 1? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.182, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The cleanest route to an exact likelihood is to write a distribution over many variables as a product of
        one-variable conditionals. That is the chain rule of probability, and it is how every language model works.
      </p>
    </>
  ),
};
