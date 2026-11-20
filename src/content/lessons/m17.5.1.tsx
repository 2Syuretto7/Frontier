import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ZipfTailViz } from "@/components/viz/ZipfTailViz";
import type { LessonContent } from "@/lib/types";

const TAILS = `import math

def tail_loss(a, N, K):
    return sum(k ** -a for k in range(N + 1, K + 1))

def power_fit(xs, ys):
    lx = [math.log(x) for x in xs]
    ly = [math.log(y) for y in ys]
    mx, my = sum(lx) / len(lx), sum(ly) / len(ly)
    return sum((u - mx) * (v - my) for u, v in zip(lx, ly)) / sum((u - mx) ** 2 for u in lx)

def predicted_exponent(a):
    return a - 1`;

const MEMORY = `def zipf_probs(a, K):
    w = [k ** -a for k in range(1, K + 1)]
    Z = sum(w)
    return [x / Z for x in w]

def unseen_mass(p, D):
    return sum(q * (1 - q) ** D for q in p)

def data_exponent(a):
    return (a - 1) / a`;

export const lesson: LessonContent = {
  id: "m17.5.1",
  minutes: 50,
  links: {
    requires: ["m17.3.2"],
    revisits: ["m8.3.1", "m16.5.1"],
    foreshadows: ["m17.5.2", "m17.5.3"],
  },

  puzzle: (
    <>
      <p>
        Across many orders of magnitude, the test loss of language models falls as a power of model size and of dataset
        size: straight lines on log-log plots, with small exponents such as 0.07 or 0.1. Nothing in a transformer&apos;s
        architecture mentions a power law. Where do such clean laws come from, and what sets their exponents?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Natural data has a long tail. A few patterns are very common and an endless supply are rare, with frequencies that
        fall roughly as a power of their rank, as Zipf observed for words. A model of a given size or trained on a given
        amount of data captures patterns down to some rank, and what it misses is the mass of the tail beyond that rank. The
        tail of a power law is itself a power law, so the loss is too, with an exponent inherited from the data.
      </p>
      <ZipfTailViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a model of reducible loss">
        <p>
          Suppose the data is made of features, or skills, or facts, with frequencies <M>{"p_k \\propto k^{-a}"}</M>, a &gt; 1, and that
          getting feature k wrong costs its probability. A model with capacity for N features that learns the most common ones
          has reducible loss <M>{"\\sum_{k > N} p_k"}</M> (<C>tail_loss</C>, unnormalised). Exponents are estimated by least squares on
          logarithms (<C>power_fit</C>).
        </p>
        <Code>{TAILS}</Code>
      </Definition>

      <Theorem title="capacity scaling">
        <p>
          For a &gt; 1, <M>{"\\sum_{k > N} k^{-a} \\sim \\frac{N^{1-a}}{a-1}"}</M>, so the loss scales as <M>{"N^{-(a-1)}"}</M> (<C>predicted_exponent</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Integral comparison, as in the integral test (m8.3.1): <M>{"k^{-a}"}</M> is decreasing, so{" "}
          <M>{"\\int_{N+1}^\\infty x^{-a}dx \\le \\sum_{k>N} k^{-a} \\le \\int_N^\\infty x^{-a}dx"}</M>, and both bounds equal{" "}
          <M>{"\\frac{N^{1-a}}{a-1}(1 + O(1/N))"}</M>.
        </p>
      </Proof>

      <Theorem title="data scaling for a memorising learner (Hutter)">
        <p>
          A learner that knows exactly the features it has seen at least once, after D independent samples from p, has
          expected reducible loss <M>{"\\sum_k p_k (1 - p_k)^D"}</M> (<C>zipf_probs</C>, <C>unseen_mass</C>), and for{" "}
          <M>{"p_k \\propto k^{-a}"}</M> this scales as <M>{"D^{-(a-1)/a}"}</M> (<C>data_exponent</C>).
        </p>
        <Code>{MEMORY}</Code>
      </Theorem>
      <Proof>
        <p>
          Feature k is unseen with probability <M>{"(1 - p_k)^D"}</M>, and linearity of expectation gives the sum. Now{" "}
          <M>{"(1 - p_k)^D \\approx e^{-Dp_k}"}</M>: it is close to 1 when <M>{"p_k \\ll 1/D"}</M> and negligible when <M>{"p_k \\gg 1/D"}</M>. The
          crossover is at the rank <M>{"k^* \\asymp D^{1/a}"}</M> where <M>{"p_{k^*} \\asymp 1/D"}</M>, so the loss is of the order of the tail
          beyond <M>{"k^*"}</M>, which by the previous theorem is <M>{"(k^*)^{1-a} = D^{-(a-1)/a}"}</M>. Making the two approximations precise
          bounds the sum above and below by constant multiples of this.
        </p>
      </Proof>

      <Example title="kernel regression has the same structure">
        <p>
          In kernel regression and in the linearised networks of m17.3.2, the role of the features is played by the
          eigenfunctions of the kernel (m16.5.1). If the eigenvalues decay as <M>{"\\lambda_k \\propto k^{-b}"}</M> and the target&apos;s squared
          coefficients weighted by them decay as a power, then a model resolving the top N eigendirections, or D samples
          resolving the directions whose eigenvalue exceeds the noise level they can detect, leaves a power-law tail. The
          exponents are again functions of the data&apos;s spectrum alone, which is why power laws turn up so reliably.
        </p>
      </Example>

      <Remark title="where the exponents come from in practice">
        <p>
          Measured exponents for language models are small, of order 0.05 to 0.1 in model size, which in these toy models
          corresponds to very heavy tails, a barely above 1. Another explanation ties the exponent to the intrinsic
          dimension d of the data manifold: a smooth function approximated piecewise on a d-dimensional manifold with N
          pieces has squared error of order <M>{"N^{-4/d}"}</M>, and Sharma and Kaplan argued that measured exponents roughly track{" "}
          <M>{"4/d"}</M>. Both pictures agree on the main point: the exponent is a property of the data, while architecture and
          optimisation mostly shift the constant in front.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "double",
      rung: "check",
      prompt: <p>Reducible loss scales as <M>{"N^{-0.076}"}</M>. Doubling N multiplies it by what factor? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.9487, tolerance: 0.0001 },
    },
    {
      key: "hutter",
      rung: "check",
      prompt: <p>For a memorising learner and Zipf exponent a = 1.25, what is the data scaling exponent?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "tail",
      rung: "apply",
      prompt: <p>In these models, what mainly determines the scaling exponent?</p>,
      answer: {
        kind: "choice",
        options: [
          "The decay of the data's feature frequencies or spectrum, since the loss is the mass of the unlearned tail",
          "The number of layers in the model",
          "The choice of optimiser",
          "The learning rate schedule",
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

def tail_loss(a, N, K):
    return sum(k ** -a for k in range(N + 1, K + 1))

def power_fit(xs, ys):
    lx = [math.log(x) for x in xs]
    ly = [math.log(y) for y in ys]
    mx, my = sum(lx) / len(lx), sum(ly) / len(ly)
    return sum((u - mx) * (v - my) for u, v in zip(lx, ly)) / sum((u - mx) ** 2 for u in lx)

def predicted_exponent(a):
    return a - 1

print(round(tail_loss(2, 1, 3), 4), round(tail_loss(1, 0, 4), 4), round(power_fit([1, 10, 100], [1, 0.1, 0.01]), 4), predicted_exponent(2.5))
print(round(power_fit([2, 4, 8], [0.5, 0.25, 0.125]), 4), tail_loss(3, 5, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3611 2.0833 -1.0 1.5\n-1.0 0",
          "0.3611 1.8333 -1.0 1.5\n-1.0 0",
          "1.3611 2.0833 -1.0 1.5\n-1.0 0.008",
          "0.3611 2.0833 1.0 1.5\n-0.5 0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def zipf_probs(a, K):
    w = [k ** -a for k in range(1, K + 1)]
    Z = sum(w)
    return [x / Z for x in w]

def unseen_mass(p, D):
    return sum(q * (1 - q) ** D for q in p)

def data_exponent(a):
    return (a - 1) / a

print([round(q, 4) for q in zipf_probs(1, 3)], unseen_mass([0.5, 0.5], 2), unseen_mass([1.0], 5), data_exponent(2))
print(round(unseen_mass(zipf_probs(1, 2), 1), 4), round(data_exponent(3), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5455, 0.2727, 0.1818] 0.25 0.0 0.5\n0.4444 0.6667",
          "[0.5455, 0.2727, 0.1818] 0.5 0.0 0.5\n0.4444 0.6667",
          "[0.3333, 0.3333, 0.3333] 0.25 0.0 0.5\n0.4444 0.6667",
          "[0.5455, 0.2727, 0.1818] 0.25 1.0 0.5\n0.5556 0.6667",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tail_loss(a, N, K)</C>, the sum of <M>{"k^{-a}"}</M> for N &lt; k ≤ K; <C>power_fit(xs, ys)</C>, the least squares slope of
          log y on log x; and <C>predicted_exponent(a)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def tail_loss(a, N, K):
    return sum(k ** -a for k in range(N, K))

def power_fit(xs, ys):
    return (ys[-1] - ys[0]) / (xs[-1] - xs[0])

def predicted_exponent(a):
    return a
`,
        solution: TAILS,
        tests: [
          { name: "tail", code: `assert abs(tail_loss(2, 2, 4) - (1 / 9 + 1 / 16)) < 1e-12 and predicted_exponent(1.3) == 1.3 - 1` },
          { name: "fit", code: `xs = [1, 2, 4, 8]\nassert abs(power_fit(xs, [3 * x ** -0.7 for x in xs]) + 0.7) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>zipf_probs(a, K)</C>, the normalised probabilities for ranks 1 to K; <C>unseen_mass(p, D)</C>; and{" "}
          <C>data_exponent(a)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def zipf_probs(a, K):
    return [1 / K] * K

def unseen_mass(p, D):
    return 0.0

def data_exponent(a):
    return a - 1
`,
        solution: MEMORY,
        tests: [
          { name: "probs", code: `p = zipf_probs(2, 2)\nassert abs(p[0] - 0.8) < 1e-12 and abs(p[1] - 0.2) < 1e-12 and abs(data_exponent(4) - 0.75) < 1e-12` },
          { name: "unseen", code: `assert abs(unseen_mass([0.8, 0.2], 2) - (0.8 * 0.04 + 0.2 * 0.64)) < 1e-12` },
        ],
      },
    },
    {
      key: "mass",
      rung: "stretch",
      prompt: (
        <p>
          Take a Zipf law with a = 2 over K = 100 000 features. What is the expected unseen mass after D = 1000 samples? Give
          four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0218, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Real models are limited by size and data at once. The next lesson separates the two regimes, one where the finite
        number of parameters or samples adds variance and one where the model resolves the data manifold only up to a
        resolution, and explains why the exponents differ between them.
      </p>
    </>
  ),
};
