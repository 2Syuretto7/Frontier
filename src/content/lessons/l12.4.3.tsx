import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BestOfNViz } from "@/components/viz/BestOfNViz";
import type { LessonContent } from "@/lib/types";

const SPLIT = `def total_error(N, K, A, alpha, C):
    return A * N ** -alpha + C * K ** -2                      # model error plus second-order solver error

def best_split(B, A, alpha, C):
    return (alpha * A * B * B / (2 * C)) ** (1 / (2 + alpha))  # model size N; the steps are K = B / N

def grid_search(B, A, alpha, C, Ns):
    return min(Ns, key=lambda N: total_error(N, B / N, A, alpha, C))`;

const SEARCH = `import math

def expected_max_normal(N, lo=-8.0, hi=8.0, m=4000):
    h = (hi - lo) / m
    total = 0.0
    for i in range(m):
        x = lo + (i + 0.5) * h
        phi = math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
        Phi = 0.5 * (1 + math.erf(x / math.sqrt(2)))
        total += x * N * phi * Phi ** (N - 1) * h               # density of the maximum of N standard normals
    return total

def best_of_n_quality(N, r):
    return r * expected_max_normal(N)                          # verifier score correlated r with quality

def max_bound(N):
    return math.sqrt(2 * math.log(N))`;

export const lesson: LessonContent = {
  id: "l12.4.3",
  minutes: 50,
  links: {
    requires: ["l12.4.1", "l8.4.3"],
    revisits: ["l12.1.4", "l12.4.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        For language models, loss falls as a smooth power law in compute, and that predictability decides how big the next
        model should be. A diffusion model&apos;s loss is a strange quantity: an average of denoising errors over noise
        levels, most of it irreducible, with the useful signal hidden underneath. Does it scale predictably too? And unlike
        a language model, a diffusion model can spend more compute at sampling time in two different ways, more steps or
        more samples to choose from. Which pays more, and how far?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Training scaling works as for language models once the loss is measured carefully, at fixed noise levels, so that
        the noise in the estimate does not swamp the trend. At sampling time, more steps only reduce the solver&apos;s error,
        which soon falls below the model&apos;s own; beyond that point extra steps are wasted, and a fixed budget is best split
        between model size and steps by balancing the two errors. Drawing many samples and keeping the one a verifier likes
        best keeps paying, but slowly, like the square root of a logarithm, and only in proportion to how well the verifier
        tracks real quality.
      </p>
      <BestOfNViz />
    </>
  ),

  theory: (
    <>
      <Definition title="validation loss at fixed noise levels">
        <p>
          The training loss averages the denoising error over a random noise level t, and the error varies enormously with
          t. Esser and colleagues, scaling Stable Diffusion 3, evaluated held-out loss on a fixed grid of noise levels with
          fixed noise draws, and found that it fell smoothly with model size and training compute and tracked automated and
          human evaluations of the images.
        </p>
      </Definition>

      <Theorem title="stratifying the noise level reduces variance">
        <p>
          Let <M>{"\\ell(t, \\omega)"}</M> be the loss of one example at noise level t with random data and noise ω, and let t
          be uniform on [0, 1]. Using k equal strata with one draw of t in each, instead of k independent uniform draws, never
          increases the variance of the average.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the law of total variance, one draw has variance{" "}
          <M>{"\\mathbb{E}\\,\\mathrm{Var}(\\ell \\mid \\text{stratum}) + \\mathrm{Var}\\,\\mathbb{E}(\\ell \\mid \\text{stratum})"}</M>.
          Independent draws pay both terms, divided by k. One draw per stratum makes the stratum of each draw fixed, so the
          second term disappears from the average, leaving{" "}
          <M>{"\\tfrac{1}{k}\\, \\mathbb{E}\\,\\mathrm{Var}(\\ell \\mid \\text{stratum})"}</M>. A fixed grid of t is the limit in
          which the within-stratum variation of t vanishes too.
        </p>
      </Proof>

      <Remark title="training compute">
        <p>
          With loss measured this way, the scaling methods of l8.4.3 carry over: fit a power law in model size and data, find
          the compute-optimal split, and predict the next model. DiT showed image quality improving steadily with forward-pass
          compute, and the same smooth trends appear in loss for text-to-image models.
        </p>
      </Remark>

      <Theorem title="splitting a sampling budget">
        <p>
          Suppose the error of a sample is <M>{"A N^{-\\alpha} + C K^{-2}"}</M>, model error falling as a power of model size N
          and the error of a second-order solver such as Heun&apos;s (l12.1.4) as the square of the steps K
          (<C>total_error</C>). For a fixed budget NK = B, the error is minimised at{" "}
          <M>{"N^* = (\\alpha A B^2/(2C))^{1/(2 + \\alpha)}"}</M> (<C>best_split</C>), where the model error is{" "}
          <M>{"2/\\alpha"}</M> times the solver error.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substituting K = B/N gives <M>{"E(N) = A N^{-\\alpha} + C N^2/B^2"}</M>, a sum of a decreasing and an increasing
          convex function of N &gt; 0. Its derivative <M>{"-\\alpha A N^{-\\alpha - 1} + 2CN/B^2"}</M> vanishes exactly once, at{" "}
          <M>{"N^{2 + \\alpha} = \\alpha A B^2/(2C)"}</M>, which is the minimum. Multiplying the condition by N gives{" "}
          <M>{"\\alpha A N^{-\\alpha} = 2 C K^{-2}"}</M>. A search over a few sizes (<C>grid_search</C>) confirms it numerically.
        </p>
        <Code>{SPLIT}</Code>
      </Proof>

      <Theorem title="best of N grows like a square root of a logarithm">
        <p>
          If <M>{"S_1, \\dots, S_N"}</M> are standard normal, not necessarily independent,{" "}
          <M>{"\\mathbb{E} \\max_i S_i \\le \\sqrt{2 \\ln N}"}</M> (<C>max_bound</C>). For independent draws the expectation is{" "}
          <M>{"\\int x\\, N \\varphi(x) \\Phi(x)^{N - 1} dx"}</M> (<C>expected_max_normal</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          For λ &gt; 0, Jensen&apos;s inequality and a union of the exponentials give{" "}
          <M>{"e^{\\lambda \\mathbb{E} \\max S_i} \\le \\mathbb{E}\\, e^{\\lambda \\max S_i} \\le \\sum_i \\mathbb{E}\\, e^{\\lambda S_i} = N e^{\\lambda^2/2}"}</M>.
          So <M>{"\\mathbb{E} \\max S_i \\le \\ln N/\\lambda + \\lambda/2"}</M>; take <M>{"\\lambda = \\sqrt{2 \\ln N}"}</M>. For
          independent draws, <M>{"P(\\max \\le x) = \\Phi(x)^N"}</M>, whose derivative is the density in the integral.
        </p>
      </Proof>

      <Theorem title="an imperfect verifier scales the gain">
        <p>
          Let each sample have quality Q and verifier score S, jointly standard normal with correlation r, independently across
          samples. Keeping the sample with the highest score gives expected quality <M>{"r\\, \\mathbb{E} \\max_i S_i"}</M>{" "}
          (<C>best_of_n_quality</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          For jointly standard normal variables, <M>{"\\mathbb{E}[Q \\mid S] = rS"}</M>. The chosen index depends only on the
          scores, and given all scores the quality of sample i has mean <M>{"r S_i"}</M>, because the other samples are
          independent of it. So the chosen sample&apos;s expected quality is <M>{"r\\, \\mathbb{E}\\, S_{\\text{chosen}} = r\\, \\mathbb{E} \\max_i S_i"}</M>.
        </p>
        <Code>{SEARCH}</Code>
      </Proof>

      <Example title="search beyond steps">
        <p>
          Ma and colleagues found that adding denoising steps stops helping a diffusion model after a few dozen evaluations,
          while searching over initial noises with a verifier, such as an image-text alignment model or an aesthetic scorer,
          kept improving the chosen samples with more compute. The figure shows the shape of such gains and their limit: going
          from 32 to 1024 samples, thirty-two times the compute, raises the expected quality by about 1.2 standard deviations
          with a perfect verifier and by about half a deviation with correlation 0.4. A verifier that rewards the wrong things
          is optimised just as eagerly.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "split",
      rung: "check",
      prompt: (
        <p>
          With A = 1, α = 0.5, C = 1 and a budget NK = <M>{"10^4"}</M>, what model size minimises the error?
        </p>
      ),
      answer: { kind: "numeric", value: 910.28, tolerance: 0.01 },
    },
    {
      key: "bon",
      rung: "check",
      prompt: (
        <p>
          The expected maximum of 4 independent standard normals is 1.0294. With verifier correlation 0.6, what is the
          expected quality of the best of 4?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6176, tolerance: 0.0005 },
    },
    {
      key: "steps",
      rung: "apply",
      prompt: <p>Why do extra sampling steps stop improving a trained diffusion model?</p>,
      answer: {
        kind: "choice",
        options: [
          "Steps reduce only the solver's error, which soon falls below the model's own error",
          "More steps add more noise to the sample",
          "The probability flow ODE has no solution beyond a fixed number of steps",
          "Each step uses a smaller model",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def total_error(N, K, A, alpha, C):
    return A * N ** -alpha + C * K ** -2                      # model error plus second-order solver error

def best_split(B, A, alpha, C):
    return (alpha * A * B * B / (2 * C)) ** (1 / (2 + alpha))  # model size N; the steps are K = B / N

def grid_search(B, A, alpha, C, Ns):
    return min(Ns, key=lambda N: total_error(N, B / N, A, alpha, C))

e = total_error(4.0, 2.0, 1.0, 1.0, 8.0); n = best_split(16.0, 1.0, 2.0, 1.0)
print(e, round(n, 4), grid_search(16.0, 1.0, 2.0, 1.0, [1.0, 2.0, 4.0, 8.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.25 4.0 4.0",
          "2.25 4.0 8.0",
          "4.25 4.0 4.0",
          "2.25 2.0 4.0",
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

def expected_max_normal(N, lo=-8.0, hi=8.0, m=4000):
    h = (hi - lo) / m
    total = 0.0
    for i in range(m):
        x = lo + (i + 0.5) * h
        phi = math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
        Phi = 0.5 * (1 + math.erf(x / math.sqrt(2)))
        total += x * N * phi * Phi ** (N - 1) * h               # density of the maximum of N standard normals
    return total

def best_of_n_quality(N, r):
    return r * expected_max_normal(N)                          # verifier score correlated r with quality

def max_bound(N):
    return math.sqrt(2 * math.log(N))

q = [round(expected_max_normal(k), 4) for k in (2, 3)]
print(q, round(best_of_n_quality(2, 0.5), 4), round(max_bound(2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5642, 0.8463] 0.2821 1.1774",
          "[0.5642, 0.8463] 0.5642 1.1774",
          "[0.5642, 1.0294] 0.2821 1.1774",
          "[0.5642, 0.8463] 0.2821 0.8326",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>total_error(N, K, A, alpha, C)</C>, <C>best_split(B, A, alpha, C)</C> returning the optimal model size, and{" "}
          <C>grid_search(B, A, alpha, C, Ns)</C> returning the size in <C>Ns</C> with the least error when K = B/N.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def total_error(N, K, A, alpha, C):
    return A / N + C / K

def best_split(B, A, alpha, C):
    return B ** 0.5

def grid_search(B, A, alpha, C, Ns):
    return Ns[0]
`,
        solution: SPLIT,
        tests: [
          { name: "err", code: `assert abs(total_error(4.0, 4.0, 2.0, 0.5, 16.0) - 2.0) < 1e-12\nassert abs(best_split(8.0, 2.0, 1.0, 1.0) - 64 ** (1 / 3)) < 1e-12` },
          { name: "grid", code: `assert grid_search(100.0, 1.0, 1.0, 1.0, [1.0, 3.0, 4.0, 10.0]) == 10.0 and grid_search(100.0, 50.0, 1.0, 1.0, [1.0, 3.0, 10.0, 30.0]) == 30.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expected_max_normal(N, lo=-8.0, hi=8.0, m=4000)</C> by the midpoint rule on m intervals,{" "}
          <C>best_of_n_quality(N, r)</C> and <C>max_bound(N)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def expected_max_normal(N, lo=-8.0, hi=8.0, m=4000):
    return math.sqrt(2 * math.log(N))

def best_of_n_quality(N, r):
    return expected_max_normal(N)

def max_bound(N):
    return math.log(N)
`,
        solution: SEARCH,
        tests: [
          { name: "emax", code: `import math\nassert abs(expected_max_normal(2) - 1 / math.sqrt(math.pi)) < 1e-6 and abs(expected_max_normal(3) - 1.5 / math.sqrt(math.pi)) < 1e-6` },
          { name: "bon", code: `import math\nassert abs(best_of_n_quality(2, 0.3) - 0.3 / math.sqrt(math.pi)) < 1e-6 and abs(max_bound(10) - math.sqrt(2 * math.log(10))) < 1e-12` },
        ],
      },
    },
    {
      key: "howmany",
      rung: "stretch",
      prompt: (
        <p>
          With verifier correlation 0.5, what is the smallest N for which best-of-N beats best-of-2 with a perfect verifier?
          (Expected maxima of 3, 4, 5 and 6 standard normals are 0.8463, 1.0294, 1.1630 and 1.2672.)
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Generators of images and video are only half of multimodal AI. The next chapter turns to understanding: models that
        connect images to language, read images as a language model reads text, and finally generate both from one network.
      </p>
    </>
  ),
};
