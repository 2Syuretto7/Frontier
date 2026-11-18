import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GumbelMaxViz } from "@/components/viz/GumbelMaxViz";
import type { LessonContent } from "@/lib/types";

const GM = `import numpy as np

def gumbel(rng, size):
    return -np.log(-np.log(rng.random(size)))

def gumbel_max(logits, rng, n):
    return np.argmax(logits + gumbel(rng, (n, len(logits))), axis=1)

def gumbel_topk(logits, rng, k):
    return np.argsort(-(logits + gumbel(rng, len(logits))))[:k]`;

const GS = `import numpy as np

def gumbel_softmax(logits, g, tau):
    z = (logits + g) / tau; z = z - z.max(axis=-1, keepdims=True); e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

def max_location(logits, rng, n):
    g = -np.log(-np.log(rng.random((n, len(logits)))))
    return float(np.mean(np.max(logits + g, axis=1)) - np.euler_gamma)`;

export const lesson: LessonContent = {
  id: "m13.2.3",
  minutes: 45,
  links: {
    requires: ["m13.2.1"],
    revisits: ["m7.3.4"],
    foreshadows: ["m13.2.4", "m13.6.2"],
  },

  puzzle: (
    <>
      <p>
        A language model outputs a vector of logits, and you need to sample a token from their softmax. The usual way
        normalises, forms cumulative sums and searches them with a uniform number. Here is a stranger way: add an
        independent random number of a particular kind to every logit and take the largest. No normalisation, no
        cumulative sums, just an argmax. Why on earth would that give exactly the right probabilities?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of each category as a runner whose head start is its logit, plus a random burst of speed. With the right
        noise distribution, the chance that a runner wins is proportional to the exponential of its head start, which is
        precisely the softmax. That noise is the Gumbel distribution, the law of maxima. Adding the same constant to every
        logit shifts all runners equally and changes nothing, which is why normalisation is never needed.
      </p>
      <GumbelMaxViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Gumbel distribution">
        <p>
          The standard Gumbel has distribution function <M>{"F(g) = \\exp(-e^{-g})"}</M> and density{" "}
          <M>{"f(g) = e^{-g}\\exp(-e^{-g})"}</M>. By inversion, <M>{"G = -\\log(-\\log U)"}</M> for U uniform. Its mean is the
          Euler–Mascheroni constant γ ≈ 0.5772.
        </p>
      </Definition>

      <Theorem title="Gumbel-max">
        <p>
          Let <M>{"a_1, \\dots, a_K"}</M> be real, <M>{"G_k"}</M> independent standard Gumbels, and{" "}
          <M>{"S = \\sum_j e^{a_j}"}</M>. Then <M>{"P(\\arg\\max_k (a_k + G_k) = k) = e^{a_k}/S"}</M>. Moreover the maximum is
          Gumbel with location <M>{"\\log S"}</M> and is independent of which k attains it.
        </p>
      </Theorem>
      <Proof>
        <p>
          Category k wins with maximum at most m when its value g is at most m and every other <M>{"a_j + G_j < g"}</M>:
        </p>
        <MD>{"\\int_{-\\infty}^m e^{a_k - g} e^{-e^{a_k - g}} \\prod_{j \\ne k} e^{-e^{a_j - g}}\\,dg = \\int_{-\\infty}^m e^{a_k - g} e^{-S e^{-g}}\\,dg = \\frac{e^{a_k}}{S}\\exp(-S e^{-m})."}</MD>
        <p>
          The last step substitutes <M>{"t = Se^{-g}"}</M>. The answer factors into <M>{"e^{a_k}/S"}</M> times{" "}
          <M>{"\\exp(-e^{-(m - \\log S)})"}</M>, the distribution function of a Gumbel shifted by <M>{"\\log S"}</M>; a product form
          means independence. Letting <M>{"m \\to \\infty"}</M> gives the winning probability.
        </p>
        <Code>{GM}</Code>
      </Proof>

      <Theorem title="sampling without replacement">
        <p>
          The indices of the k largest perturbed values, in order, are distributed as k draws without replacement, each from
          the softmax of the categories not yet drawn.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first index has the right law by the previous theorem. Given the winner and the value of the maximum, the
          remaining perturbed values are independent Gumbels conditioned to lie below that maximum, and the same integral, now
          restricted to the remaining categories, shows the second largest is chosen with probability proportional to{" "}
          <M>{"e^{a_j}"}</M> among them; repeat. For probabilities 0.2, 0.3, 0.5, the order (0.5, 0.3) has probability{" "}
          <M>{"0.5 \\times 0.3/0.5 = 0.3"}</M>. Stochastic beam search uses the same idea to draw several distinct sequences from a language model.
        </p>
      </Proof>

      <Remark title="relaxing the argmax">
        <p>
          The argmax has no useful gradient, so the Gumbel-softmax, or Concrete, distribution replaces it with{" "}
          <M>{"\\mathrm{softmax}((a + G)/\\tau)"}</M>. As the temperature τ falls the output approaches the one-hot sample; at
          larger τ it is smooth in a, so gradients flow through it. The price is bias: the relaxed sample is not a category,
          and estimators built on it are biased, while very small τ gives high-variance gradients. The straight-through
          variant uses the hard sample forward and the relaxed gradient backward. Temperature sampling from a language model is
          Gumbel-max applied to the logits divided by T.
        </p>
        <Code>{GS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mean",
      rung: "check",
      prompt: <p>What is the mean of the standard Gumbel distribution? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5772, tolerance: 0.0001 },
    },
    {
      key: "two",
      rung: "check",
      prompt: <p>Logits 0 and ln 3 are perturbed by independent standard Gumbels. What is the probability that the second is larger?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "shift",
      rung: "apply",
      prompt: <p>Why does Gumbel-max never need the normalising constant of the softmax?</p>,
      answer: {
        kind: "choice",
        options: [
          "Adding the same constant to every logit shifts every perturbed value equally, so the argmax is unchanged",
          "The Gumbel noise normalises the logits automatically",
          "The maximum of the perturbed values is always zero",
          "The softmax constant is always one",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gumbel(rng, size):
    return -np.log(-np.log(rng.random(size)))

def gumbel_max(logits, rng, n):
    return np.argmax(logits + gumbel(rng, (n, len(logits))), axis=1)

def gumbel_topk(logits, rng, k):
    return np.argsort(-(logits + gumbel(rng, len(logits))))[:k]

rng = np.random.default_rng(0); logits = np.log(np.array([0.2, 0.3, 0.5])); c = np.bincount(gumbel_max(logits, rng, 100000), minlength=3) / 100000
print(np.round(c, 2).tolist(), np.round(np.bincount(gumbel_max(logits + 7, rng, 100000), minlength=3) / 100000, 2).tolist())
print(3 in gumbel_topk(np.array([0.0, 0.0, 0.0, 10.0]), rng, 2), len(set(gumbel_topk(np.zeros(5), rng, 5).tolist())))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.2, 0.3, 0.5] [0.2, 0.3, 0.5]\nTrue 5",
          "[0.2, 0.3, 0.5] [0.0, 0.0, 1.0]\nTrue 5",
          "[0.33, 0.33, 0.33] [0.2, 0.3, 0.5]\nTrue 5",
          "[0.2, 0.3, 0.5] [0.2, 0.3, 0.5]\nTrue 2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gumbel_softmax(logits, g, tau):
    z = (logits + g) / tau; z = z - z.max(axis=-1, keepdims=True); e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

def max_location(logits, rng, n):
    g = -np.log(-np.log(rng.random((n, len(logits)))))
    return float(np.mean(np.max(logits + g, axis=1)) - np.euler_gamma)

g = np.array([0.5, -0.2, 0.1]); print(np.round(gumbel_softmax(np.zeros(3), g, 1.0), 2).tolist(), np.round(gumbel_softmax(np.zeros(3), g, 0.01), 2).tolist())
print(abs(max_location(np.log(np.array([1.0, 1.0, 2.0])), np.random.default_rng(1), 200000) - np.log(4)) < 0.02)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.46, 0.23, 0.31] [1.0, 0.0, 0.0]\nTrue",
          "[0.33, 0.33, 0.33] [1.0, 0.0, 0.0]\nTrue",
          "[0.46, 0.23, 0.31] [0.46, 0.23, 0.31]\nTrue",
          "[1.0, 0.0, 0.0] [0.46, 0.23, 0.31]\nTrue",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gumbel(rng, size)</C> by inversion; <C>gumbel_max(logits, rng, n)</C> returning n samples; and{" "}
          <C>gumbel_topk(logits, rng, k)</C> returning k distinct indices in order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gumbel(rng, size):
    return rng.random(size)

def gumbel_max(logits, rng, n):
    return np.full(n, int(np.argmax(logits)))

def gumbel_topk(logits, rng, k):
    return np.arange(k)
`,
        solution: GM,
        tests: [
          { name: "gumbel", code: `g = gumbel(np.random.default_rng(0), 200000); assert abs(g.mean() - np.euler_gamma) < 0.01 and abs(g.var() - np.pi ** 2 / 6) < 0.03` },
          { name: "categorical", code: `rng = np.random.default_rng(1); c = np.bincount(gumbel_max(np.log(np.array([0.1, 0.6, 0.3])) + 100, rng, 50000), minlength=3) / 50000
assert np.allclose(c, [0.1, 0.6, 0.3], atol=0.01) and gumbel_topk(np.array([0.0, 50.0, 0.0, 40.0]), rng, 2).tolist() == [1, 3]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gumbel_softmax(logits, g, tau)</C>, stable for large logits and working along the last axis, and{" "}
          <C>max_location(logits, rng, n)</C>, the simulated mean of the perturbed maximum minus γ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gumbel_softmax(logits, g, tau):
    return np.full(len(logits), 1 / len(logits))

def max_location(logits, rng, n):
    return 0.0
`,
        solution: GS,
        tests: [
          { name: "relax", code: `y = gumbel_softmax(np.array([1000.0, 0.0, 999.0]), np.zeros(3), 1.0); assert np.isclose(y.sum(), 1) and np.allclose(y, [1 / (1 + np.exp(-1)), 0, np.exp(-1) / (1 + np.exp(-1))])
assert np.allclose(gumbel_softmax(np.zeros(3), np.array([0.3, 0.1, -0.2]), 0.001), [1, 0, 0])` },
          { name: "location", code: `assert abs(max_location(np.array([0.0, 1.0, 2.0]), np.random.default_rng(2), 200000) - np.log(1 + np.e + np.e ** 2)) < 0.02` },
        ],
      },
    },
    {
      key: "order",
      rung: "stretch",
      prompt: (
        <p>
          With probabilities 0.2, 0.3 and 0.5, what is the probability that Gumbel top-2 returns the 0.5 category first and the
          0.3 category second?
        </p>
      ),
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Gumbel-max writes a discrete sample as a deterministic function of the parameters and some fixed noise. For
        continuous distributions the same move, the reparameterisation trick, makes the sample differentiable in the
        parameters, which is the engine of variational autoencoders.
      </p>
    </>
  ),
};
