import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CodingPlaneViz } from "@/components/viz/CodingPlaneViz";
import type { LessonContent } from "@/lib/types";

const RC = `import numpy as np
from math import comb

def repetition_error(eps, r):
    return sum(comb(r, k) * eps ** k * (1 - eps) ** (r - k) for k in range(r // 2 + 1, r + 1))

def random_code_error(n, R, eps, trials, rng):
    M = 2 ** int(round(n * R)); book = rng.integers(0, 2, size=(M, n)); errs = 0
    for _ in range(trials):
        w = rng.integers(M); y = book[w] ^ (rng.random(n) < eps)
        errs += int(np.argmin((book != y).sum(axis=1)) != w)
    return errs / trials

def fano_lower(R, C, n):
    return max(0.0, 1 - C / R - 1 / (n * R))`;

const HM = `import numpy as np

def hamming_encode(d):
    G = np.array([[1, 0, 0, 0, 1, 1, 0], [0, 1, 0, 0, 1, 0, 1], [0, 0, 1, 0, 0, 1, 1], [0, 0, 0, 1, 1, 1, 1]])
    return (np.array(d) @ G) % 2

def hamming_decode(y):
    H = np.array([[1, 1, 0, 1, 1, 0, 0], [1, 0, 1, 1, 0, 1, 0], [0, 1, 1, 1, 0, 0, 1]])
    y = np.array(y).copy(); s = (H @ y) % 2
    if s.any():
        y[int(np.argmax((H.T == s).all(axis=1)))] ^= 1
    return y[:4]

def block_error(eps):
    return 1 - (1 - eps) ** 7 - 7 * eps * (1 - eps) ** 6`;

export const lesson: LessonContent = {
  id: "m12.5.2",
  minutes: 55,
  links: {
    requires: ["m12.5.1", "m12.3.1"],
    revisits: ["m12.2.4", "m12.1.3"],
    foreshadows: ["m12.6.3"],
  },

  puzzle: (
    <>
      <p>
        On a channel that flips one bit in nine, repeating every bit eleven times gets the error rate below one in a
        thousand, at a rate of 0.09 bits per use. Shannon claimed that the same reliability, and any better reliability you
        name, is possible at 0.49 bits per use. His proof did not construct a single good code: it showed that a code chosen
        completely at random is good on average. How can randomness beat careful design, and why does it stop working
        exactly at the capacity?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Send blocks of n symbols. Through the channel, each codeword turns into a cloud of about <M>{"2^{nH(Y|X)}"}</M>{" "}
        typical outputs, inside a space of about <M>{"2^{nH(Y)}"}</M> typical outputs in all. Clouds that do not overlap can
        be told apart, and at most <M>{"2^{n(H(Y) - H(Y|X))} = 2^{nI(X;Y)}"}</M> of them fit. So the number of reliably
        distinguishable messages grows like <M>{"2^{nC}"}</M>, and random codewords already pack the space almost that well.
      </p>
      <CodingPlaneViz />
    </>
  ),

  theory: (
    <>
      <Definition title="codes and achievable rates">
        <p>
          An (n, M) code for a channel W has an encoder mapping messages <M>{"w \\in \\{1, \\dots, M\\}"}</M> to codewords{" "}
          <M>{"x^n(w)"}</M> and a decoder mapping outputs <M>{"y^n"}</M> to a guess <M>{"\\hat w"}</M>. Its rate is{" "}
          <M>{"R = \\log_2 M / n"}</M> bits per use, and its average error is{" "}
          <M>{"P_e = P(\\hat W \\ne W)"}</M> for a uniform message W. A rate is achievable if there are codes of that rate
          with <M>{"P_e \\to 0"}</M> as <M>{"n \\to \\infty"}</M>.
        </p>
      </Definition>

      <Theorem title="noisy channel coding theorem">
        <p>
          For a discrete memoryless channel of capacity C, every rate R &lt; C is achievable. Conversely, any sequence of codes
          of rate R &gt; C has <M>{"P_e \\ge 1 - C/R - 1/(nR)"}</M>, which stays bounded away from 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          Achievability, in outline. Fix the input distribution p achieving C. Draw every symbol of every one of the{" "}
          <M>{"M = 2^{nR}"}</M> codewords independently from p. Decode <M>{"y^n"}</M> to the unique w whose codeword is
          jointly typical with it, meaning that the empirical surprises of <M>{"x^n"}</M>, <M>{"y^n"}</M> and the pair are all
          within ε of H(X), H(Y) and H(X, Y). Two things can go wrong. The true codeword may fail to be jointly typical; by the
          law of large numbers that has probability below ε for large n. Or some other codeword may be jointly typical by
          accident. A wrong codeword is independent of <M>{"y^n"}</M>, and an independent pair lands in the jointly typical set
          with probability at most <M>{"2^{-n(I(X;Y) - 3\\varepsilon)}"}</M>, because the set has at most{" "}
          <M>{"2^{n(H(X,Y)+\\varepsilon)}"}</M> elements, each of probability at most{" "}
          <M>{"2^{-n(H(X)-\\varepsilon)}2^{-n(H(Y)-\\varepsilon)}"}</M>. A union bound over the other codewords gives
        </p>
        <MD>{"\\mathbb E[P_e] \\le \\varepsilon + 2^{nR}\\, 2^{-n(C - 3\\varepsilon)},"}</MD>
        <p>
          which tends to ε when R &lt; C − 3ε. The average over random codebooks is small, so some codebook is at least that
          good. Discarding its worse half of codewords bounds the maximum error too, at a cost of one bit in log M.
        </p>
        <p>
          Converse. W is uniform, so <M>{"nR = H(W) = H(W \\mid \\hat W) + I(W; \\hat W)"}</M>. Fano&apos;s inequality bounds the
          first term by <M>{"1 + P_e\\, nR"}</M>. By data processing along{" "}
          <M>{"W \\to X^n \\to Y^n \\to \\hat W"}</M>, the second is at most <M>{"I(X^n; Y^n)"}</M>, and for a memoryless channel{" "}
          <M>{"I(X^n; Y^n) \\le \\sum_i I(X_i; Y_i) \\le nC"}</M>. So <M>{"nR \\le 1 + P_e nR + nC"}</M>; divide by nR.
        </p>
        <Code>{RC}</Code>
      </Proof>

      <Remark title="what the proof does not give">
        <p>
          A random code of rate 0.49 and length 1000 has <M>{"2^{490}"}</M> codewords, so neither storing it nor decoding by
          search is possible. For forty years after 1948 practical codes stayed well short of capacity. Structured codes
          close the gap: the Hamming(7,4) code corrects any single flipped bit with a 3-bit syndrome lookup, and modern
          low-density parity-check codes (in Wi-Fi and 5G data channels), turbo codes and polar codes (in 5G control
          channels) come within a fraction of a decibel of the Shannon limit, with decoders that run in linear time.
        </p>
        <Code>{HM}</Code>
      </Remark>

      <Remark title="separation">
        <p>
          Combining this lesson with the source coding results gives the separation theorem: a source of entropy rate H can
          be sent reliably over a channel of capacity C (one source symbol per channel use) if H &lt; C and not if H &gt; C, and
          nothing is lost by first compressing to bits and then protecting those bits with a channel code. This is why
          networks can treat all data as interchangeable bits. It is an asymptotic statement; with short blocks or strict
          delays, joint designs can do better.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: <p>A code has 64 codewords, each 16 channel symbols long. What is its rate in bits per use?</p>,
      answer: { kind: "numeric", value: 0.375, tolerance: 0.0001 },
    },
    {
      key: "fano",
      rung: "check",
      prompt: (
        <p>
          Codes of rate 0.75 are used on a channel of capacity 0.5. As n grows, what does the converse bound on the error
          probability tend to? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.001 },
    },
    {
      key: "union",
      rung: "apply",
      prompt: <p>In the random coding argument, why can the rate go up to I(X; Y) but no further?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each wrong codeword looks jointly typical with probability about 2^(−nI), so a union over 2^(nR) of them stays small only while R < I",
          "Random codewords are always at Hamming distance at least nI from each other",
          "Joint typicality decoding fails whenever R is positive",
          "The true codeword is jointly typical with the output with probability 2^(−nI)",
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
from math import comb

def repetition_error(eps, r):
    return sum(comb(r, k) * eps ** k * (1 - eps) ** (r - k) for k in range(r // 2 + 1, r + 1))

def random_code_error(n, R, eps, trials, rng):
    M = 2 ** int(round(n * R)); book = rng.integers(0, 2, size=(M, n)); errs = 0
    for _ in range(trials):
        w = rng.integers(M); y = book[w] ^ (rng.random(n) < eps)
        errs += int(np.argmin((book != y).sum(axis=1)) != w)
    return errs / trials

def fano_lower(R, C, n):
    return max(0.0, 1 - C / R - 1 / (n * R))

rng = np.random.default_rng(0); lo = [random_code_error(n, 0.25, 0.11, 2000, rng) for n in (8, 24, 40)]; print(lo[0] > lo[1] > lo[2])
hi = [random_code_error(n, 0.75, 0.11, 500, rng) for n in (8, 16, 24)]; print(hi[0] < hi[1] < hi[2], hi[2] > 0.5)
print([round(repetition_error(0.11, r), 4) for r in (1, 3, 5)], round(fano_lower(0.75, 0.5, 100), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True\nTrue True\n[0.11, 0.0336, 0.0112] 0.32",
          "True\nFalse False\n[0.11, 0.0336, 0.0112] 0.32",
          "False\nTrue True\n[0.11, 0.0336, 0.0112] 0.32",
          "True\nTrue True\n[0.11, 0.0336, 0.0112] 0.333",
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

def hamming_encode(d):
    G = np.array([[1, 0, 0, 0, 1, 1, 0], [0, 1, 0, 0, 1, 0, 1], [0, 0, 1, 0, 0, 1, 1], [0, 0, 0, 1, 1, 1, 1]])
    return (np.array(d) @ G) % 2

def hamming_decode(y):
    H = np.array([[1, 1, 0, 1, 1, 0, 0], [1, 0, 1, 1, 0, 1, 0], [0, 1, 1, 1, 0, 0, 1]])
    y = np.array(y).copy(); s = (H @ y) % 2
    if s.any():
        y[int(np.argmax((H.T == s).all(axis=1)))] ^= 1
    return y[:4]

def block_error(eps):
    return 1 - (1 - eps) ** 7 - 7 * eps * (1 - eps) ** 6

c = hamming_encode([1, 0, 1, 1]); y = c.copy(); y[2] ^= 1; print(c.tolist(), hamming_decode(y).tolist(), round(block_error(0.11), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0, 1, 1, 0, 1, 0] [1, 0, 1, 1] 0.175",
          "[1, 0, 1, 1, 0, 1, 0] [1, 0, 0, 1] 0.175",
          "[1, 0, 1, 1, 0, 1, 0] [1, 0, 1, 1] 0.825",
          "[1, 0, 1, 1, 1, 0, 0] [1, 0, 1, 1] 0.175",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>repetition_error(eps, r)</C>, the exact majority-vote error for odd r; <C>random_code_error(n, R, eps,
          trials, rng)</C>, the simulated error of a random codebook of <M>{"2^{\\mathrm{round}(nR)}"}</M> codewords with
          minimum-distance decoding; and <C>fano_lower(R, C, n)</C>, the converse bound clipped at 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import comb

def repetition_error(eps, r):
    return eps

def random_code_error(n, R, eps, trials, rng):
    return 0.0

def fano_lower(R, C, n):
    return 0.0
`,
        solution: RC,
        tests: [
          { name: "exact", code: `assert abs(repetition_error(0.1, 3) - 0.028) < 1e-12 and abs(repetition_error(0.2, 1) - 0.2) < 1e-12
assert fano_lower(0.5, 0.5, 10) == 0 and abs(fano_lower(1.0, 0.5, 10) - 0.4) < 1e-12` },
          { name: "simulate", code: `rng = np.random.default_rng(1); assert random_code_error(12, 1 / 12, 0.0, 200, rng) == 0.0
assert random_code_error(6, 0.5, 0.5, 400, rng) > 0.7` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hamming_encode(d)</C> for 4 data bits with generator <M>{"[I_4 \\mid P]"}</M>, where the rows of P are 110,
          101, 011, 111; <C>hamming_decode(y)</C>, correcting at most one flipped bit by its syndrome and returning the data
          bits; and <C>block_error(eps)</C>, the probability of two or more flips in a block of 7.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hamming_encode(d):
    return np.array(list(d) + [0, 0, 0])

def hamming_decode(y):
    return np.array(y)[:4]

def block_error(eps):
    return 0.0
`,
        solution: HM,
        tests: [
          { name: "correct", code: `import itertools
for d in itertools.product([0, 1], repeat=4):
    c = hamming_encode(d)
    for j in range(7):
        y = c.copy(); y[j] ^= 1; assert list(hamming_decode(y)) == list(d)` },
          { name: "blockerror", code: `assert block_error(0.0) == 0 and abs(block_error(0.5) - 0.9375) < 1e-12 and hamming_encode([0, 0, 0, 1]).tolist() == [0, 0, 0, 1, 1, 1, 1]` },
        ],
      },
    },
    {
      key: "rep",
      rung: "stretch",
      prompt: (
        <p>
          On the binary symmetric channel with ε = 0.11, what is the smallest odd repetition length r whose majority-vote
          error is below 0.001?
        </p>
      ),
      answer: { kind: "numeric", value: 11, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Capacity is a maximum of mutual information over inputs. Two more optimisation principles of the same flavour remain:
        choosing the least committal distribution consistent with what we know, and compressing as hard as possible subject
        to a tolerated distortion.
      </p>
    </>
  ),
};
