import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TypicalViz } from "@/components/viz/TypicalViz";
import type { LessonContent } from "@/lib/types";

const TY = `import numpy as np
from math import comb, exp, lgamma, log, log2

def sample_rate(p, n, reps, seed):
    k = np.random.default_rng(seed).binomial(n, p, size=reps)
    return -(k * np.log2(p) + (n - k) * np.log2(1 - p)) / n

def typical_set_stats(p, n, eps):
    H = -(p * log2(p) + (1 - p) * log2(1 - p)); size, prob = 0, 0.0
    for k in range(n + 1):
        r = -(k * log2(p) + (n - k) * log2(1 - p)) / n
        if abs(r - H) <= eps:
            logp = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * log(p) + (n - k) * log(1 - p)
            size += comb(n, k); prob += exp(logp)
    return size, prob, H`;

const TC = `from math import ceil, comb, exp, lgamma, log, log2

def typical_code_rate(p, n, eps):
    H = -(p * log2(p) + (1 - p) * log2(1 - p)); size, prob = 0, 0.0
    for k in range(n + 1):
        if abs(-(k * log2(p) + (n - k) * log2(1 - p)) / n - H) <= eps:
            logp = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * log(p) + (n - k) * log(1 - p)
            size += comb(n, k); prob += exp(logp)
    return (1 + prob * ceil(log2(size)) + (1 - prob) * n) / n

def most_likely_is_typical(p, n, eps):
    H = -(p * log2(p) + (1 - p) * log2(1 - p)); k = 0 if p < 0.5 else n
    return abs(-(k * log2(p) + (n - k) * log2(1 - p)) / n - H) <= eps`;

export const lesson: LessonContent = {
  id: "m12.3.1",
  minutes: 50,
  links: {
    requires: ["m12.1.2", "m7.7.1"],
    revisits: ["m7.2.2"],
    foreshadows: ["m12.3.2", "m12.5.2"],
  },

  puzzle: (
    <>
      <p>
        A biased coin lands heads 10% of the time. Of all 2¹⁰⁰⁰ possible sequences of 1000 flips, the single most likely is
        all tails. Yet you will essentially never see it: what you see has about 100 heads. There are roughly 2⁴⁶⁹ such
        sequences, a tiny fraction of 2¹⁰⁰⁰, and together they carry almost all the probability. Why do roughly nH bits
        suffice to name the sequence that actually occurs, and how can the most likely outcome be one you will never see?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The surprise of a long independent sequence is a sum of the surprises of its symbols, so by the law of large
        numbers its average per symbol is almost certainly close to the entropy H. Sequences with that property are called
        typical. Each has probability about 2^(−nH), and since their total probability is nearly 1 there must be about
        2^(nH) of them. Naming one of 2^(nH) things takes nH bits, which is the heart of compression.
      </p>
      <TypicalViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the asymptotic equipartition property">
        <p>If X₁, X₂, … are independent with distribution p on a finite set and entropy H, then</p>
        <MD>{"-\\frac1n\\log_2 p(X_1, \\dots, X_n) \\to H \\quad \\text{in probability.}"}</MD>
      </Theorem>
      <Proof>
        <p>
          By independence <M>{"-\\frac1n\\log_2 p(X_1, \\dots, X_n) = \\frac1n\\sum_i(-\\log_2 p(X_i))"}</M>, an average of
          independent copies of the random variable <M>{"-\\log_2 p(X)"}</M>, whose mean is H and whose variance is finite on a
          finite set. The weak law of large numbers gives convergence in probability to H.
        </p>
      </Proof>

      <Definition title="the typical set">
        <p>For ε &gt; 0, the typical set is</p>
        <MD>{"A_\\varepsilon^{(n)} = \\left\\{x^n : \\left|-\\tfrac1n\\log_2 p(x^n) - H\\right| \\le \\varepsilon\\right\\},"}</MD>
        <p>
          the sequences with <M>{"2^{-n(H + \\varepsilon)} \\le p(x^n) \\le 2^{-n(H - \\varepsilon)}"}</M>.
        </p>
      </Definition>

      <Theorem title="properties of the typical set">
        <p>
          (1) <M>{"P(A_\\varepsilon^{(n)}) \\to 1"}</M> as n → ∞. (2){" "}
          <M>{"|A_\\varepsilon^{(n)}| \\le 2^{n(H + \\varepsilon)}"}</M>. (3) For all large n,{" "}
          <M>{"|A_\\varepsilon^{(n)}| \\ge (1 - \\varepsilon)2^{n(H - \\varepsilon)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (1) is the AEP. (2) Every typical sequence has probability at least <M>{"2^{-n(H + \\varepsilon)}"}</M>, so{" "}
          <M>{"1 \\ge \\sum_{x^n \\in A}p(x^n) \\ge |A|\\,2^{-n(H + \\varepsilon)}"}</M>. (3) By (1), for large n,{" "}
          <M>{"1 - \\varepsilon < P(A) = \\sum_{x^n \\in A}p(x^n) \\le |A|\\,2^{-n(H - \\varepsilon)}"}</M>. In the code, with
          p = 0.1 and ε = 0.05, the typical set has probability 0.38 at n = 100 and 0.90 at n = 1000, and{" "}
          <M>{"\\log_2|A|/n"}</M> is 0.51, inside [H − ε, H + ε] = [0.42, 0.52].
        </p>
        <Code>{TY}</Code>
      </Proof>

      <Theorem title="compressing to the entropy">
        <p>
          For every δ &gt; 0 and all large n, there is a code for blocks of n symbols, decodable without error, whose expected
          length is at most n(H + δ) bits.
        </p>
      </Theorem>
      <Proof>
        <p>
          Choose ε &lt; δ/2. Encode a typical sequence as the bit 1 followed by its index in a fixed list of the typical set,
          using <M>{"\\lceil n(H + \\varepsilon)\\rceil"}</M> bits by property (2); encode any other sequence as the bit 0
          followed by the sequence itself, using <M>{"n\\lceil\\log_2|\\mathcal X|\\rceil"}</M> bits. The expected length is at
          most <M>{"1 + n(H + \\varepsilon) + 1 + P(A^c)\\,n\\lceil\\log_2|\\mathcal X|\\rceil"}</M>. Divided by n this tends to{" "}
          <M>{"H + \\varepsilon < H + \\delta"}</M>, because <M>{"P(A^c) \\to 0"}</M>. The code&apos;s rate falls from 0.81 bits
          per symbol at n = 100 to 0.52 at n = 5000, approaching H = 0.469. A later lesson shows no code can do better than
          H.
        </p>
        <Code>{TC}</Code>
      </Proof>

      <Remark title="typical is not the same as likely">
        <p>
          The all-tails sequence has per-symbol surprise <M>{"-\\log_2 0.9 \\approx 0.152"}</M> bits, far below H = 0.469, so it
          is not typical even though it is the single most probable sequence. The typical set wins by numbers, not by
          individual probability. For a fair coin every sequence has surprise exactly 1 bit per symbol, every sequence is
          typical, and the code above saves nothing (1.01 bits per symbol, the extra 0.01 being the flag bit). The same
          idea motivates locally typical sampling for language models: text whose per-token surprise is close to the
          model&apos;s entropy reads more naturally than the most probable text, which tends to be repetitive.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: (
        <p>
          A source has entropy 0.469 bits per symbol. For n = 100 and ε = 0.05, what upper bound does the theory give on log₂
          of the size of the typical set? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 51.9, tolerance: 0.05 },
    },
    {
      key: "allzero",
      rung: "check",
      prompt: <p>For flips with P(heads) = 0.1, what is the probability that ten flips are all tails? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3487, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can long sequences from a source with entropy H be described with about nH bits?</p>,
      answer: {
        kind: "choice",
        options: [
          "With probability near 1 the sequence lies in the typical set, which has only about 2^(nH) members, so an index into it needs about nH bits",
          "Every sequence has probability exactly 2^(−nH)",
          "The most likely sequence has probability about 2^(−nH), and only it needs to be encoded",
          "Rare symbols can always be dropped without losing information",
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
from math import comb, exp, lgamma, log, log2

def sample_rate(p, n, reps, seed):
    k = np.random.default_rng(seed).binomial(n, p, size=reps)
    return -(k * np.log2(p) + (n - k) * np.log2(1 - p)) / n

def typical_set_stats(p, n, eps):
    H = -(p * log2(p) + (1 - p) * log2(1 - p)); size, prob = 0, 0.0
    for k in range(n + 1):
        r = -(k * log2(p) + (n - k) * log2(1 - p)) / n
        if abs(r - H) <= eps:
            logp = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * log(p) + (n - k) * log(1 - p)
            size += comb(n, k); prob += exp(logp)
    return size, prob, H

r = sample_rate(0.1, 1000, 5000, 0)
print(round(float(r.mean()), 2), round(float(r.std()), 2))
for n in (100, 1000):
    size, prob, H = typical_set_stats(0.1, n, 0.05)
    print(n, round(log2(size) / n, 3), round(prob, 3), round(H, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.47 0.03\n100 0.472 0.382 0.469\n1000 0.51 0.898 0.469",
          "0.47 0.03\n100 0.472 0.898 0.469\n1000 0.51 0.382 0.469",
          "0.15 0.03\n100 0.472 0.382 0.469\n1000 0.51 0.898 0.469",
          "0.47 0.3\n100 1.0 1.0 0.469\n1000 1.0 1.0 0.469",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import ceil, comb, exp, lgamma, log, log2

def typical_code_rate(p, n, eps):
    H = -(p * log2(p) + (1 - p) * log2(1 - p)); size, prob = 0, 0.0
    for k in range(n + 1):
        if abs(-(k * log2(p) + (n - k) * log2(1 - p)) / n - H) <= eps:
            logp = lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * log(p) + (n - k) * log(1 - p)
            size += comb(n, k); prob += exp(logp)
    return (1 + prob * ceil(log2(size)) + (1 - prob) * n) / n

def most_likely_is_typical(p, n, eps):
    H = -(p * log2(p) + (1 - p) * log2(1 - p)); k = 0 if p < 0.5 else n
    return abs(-(k * log2(p) + (n - k) * log2(1 - p)) / n - H) <= eps

print([round(typical_code_rate(0.1, n, 0.05), 3) for n in (100, 1000, 5000)])
print(most_likely_is_typical(0.1, 1000, 0.05), round(typical_code_rate(0.5, 100, 0.05), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.811, 0.562, 0.516]\nFalse 1.01",
          "[0.516, 0.562, 0.811]\nFalse 1.01",
          "[0.811, 0.562, 0.516]\nTrue 1.01",
          "[0.811, 0.562, 0.516]\nFalse 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For independent Bernoulli(p) flips write <C>sample_rate(p, n, reps, seed)</C>, returning the per-symbol surprise
          −(1/n)log₂ p(xⁿ) of <C>reps</C> simulated sequences (simulate only the number of ones with{" "}
          <C>rng.binomial</C>), and <C>typical_set_stats(p, n, eps)</C>, returning the exact size of the typical set, its
          probability and H.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import comb, exp, lgamma, log, log2

def sample_rate(p, n, reps, seed):
    return np.zeros(reps)

def typical_set_stats(p, n, eps):
    return 0, 0.0, 0.0
`,
        solution: TY,
        tests: [
          { name: "rate", code: `r = sample_rate(0.5, 50, 10, 0); assert r.shape == (10,) and np.allclose(r, 1.0)
r = sample_rate(0.2, 2000, 2000, 1); assert abs(r.mean() - 0.7219) < 0.01` },
          { name: "typical", code: `size, prob, H = typical_set_stats(0.5, 12, 0.01); assert size == 4096 and np.isclose(prob, 1.0) and np.isclose(H, 1.0)
size, prob, H = typical_set_stats(0.25, 8, 0.1)
assert size == comb(8, 2) and np.isclose(prob, comb(8, 2) * 0.25 ** 2 * 0.75 ** 6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>typical_code_rate(p, n, eps)</C>, the expected bits per symbol of the code that sends a flag bit, then
          either the index of a typical sequence in ⌈log₂|A|⌉ bits or the n raw bits, and{" "}
          <C>most_likely_is_typical(p, n, eps)</C>, whether the most probable sequence is in the typical set.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import ceil, comb, exp, lgamma, log, log2

def typical_code_rate(p, n, eps):
    return 1.0

def most_likely_is_typical(p, n, eps):
    return True
`,
        solution: TC,
        tests: [
          { name: "rate", code: `assert abs(typical_code_rate(0.5, 40, 0.1) - 41 / 40) < 1e-12
r = typical_code_rate(0.25, 8, 0.1); P = comb(8, 2) * 0.25 ** 2 * 0.75 ** 6
assert abs(r - (1 + P * ceil(log2(comb(8, 2))) + (1 - P) * 8) / 8) < 1e-12` },
          { name: "likely", code: `assert most_likely_is_typical(0.1, 100, 0.05) is False and most_likely_is_typical(0.5, 10, 0.01) is True
assert most_likely_is_typical(0.9, 100, 0.4) is True` },
        ],
      },
    },
    {
      key: "surp",
      rung: "stretch",
      prompt: (
        <p>
          For flips with P(heads) = 0.1, what is the per-symbol surprise of the all-tails sequence, in bits? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.152, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The typical-set code works only in the limit and uses enormous tables. Practical codes assign each symbol its own
        codeword, and the next lesson finds exactly which codeword lengths are possible: the Kraft inequality, which also
        proves that no code can beat the entropy.
      </p>
    </>
  ),
};
