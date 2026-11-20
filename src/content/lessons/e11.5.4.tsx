import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EntropyPatchViz } from "@/components/viz/EntropyPatchViz";
import type { LessonContent } from "@/lib/types";

const PATCH = `def fixed_patches(bs, P):
    return [bs[i:i + P] for i in range(0, len(bs), P)]

def entropy_patches(entropies, threshold):
    lengths = []
    for i, h in enumerate(entropies):
        if i == 0 or h > threshold:               # a hard-to-predict byte starts a new patch
            lengths.append(1)
        else:
            lengths[-1] += 1
    return lengths

def two_level_cost(n, P):
    return (n / P) ** 2 + (n / P) * P ** 2      # attention over patches, plus attention inside each patch`;

const ENTROPY = `import math
from collections import Counter

def bigram_counts(data):
    return Counter(zip(data, data[1:]))

def position_entropy(data, counts):
    out = [8.0]                                    # nothing is known before the first byte
    for prev in data[:-1]:
        row = {b: c for (a, b), c in counts.items() if a == prev}
        total = sum(row.values())
        out.append(sum(c / total * math.log2(total / c) for c in row.values()))   # bits for the next byte
    return out

def mean_patch(lengths):
    return sum(lengths) / len(lengths)`;

export const lesson: LessonContent = {
  id: "e11.5.4",
  minutes: 45,
  links: {
    requires: ["e11.5.3", "m12.1.2"],
    revisits: ["l4.4.1", "l4.3.1"],
    foreshadows: ["e11.6.1"],
  },

  puzzle: (
    <>
      <p>
        Tokenisers bring premiums for some languages, glitch tokens, odd splits of numbers and words, and a vocabulary frozen before
        training. A model that reads raw bytes has none of these problems, and any string at all is valid input. But English text is
        about four bytes per token, so a byte-level model sees sequences four times longer, and attention cost grows with the square
        of length. Can a model read bytes without paying that price?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Group bytes into patches and run the large model over patches, with small models turning the bytes of each patch into a vector
        and back. Fixed-size patches already cut the quadratic cost sharply. Better still, make patches follow information: a small byte
        model measures how uncertain the next byte is, and a new patch starts only where it is hard to predict, so predictable runs such
        as the ends of words are absorbed cheaply and compute goes where the text is surprising.
      </p>
      <EntropyPatchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="patches">
        <p>
          <C>fixed_patches</C> cuts a byte string into pieces of P bytes. Given the entropy of each next byte under a small model,{" "}
          <C>entropy_patches</C> starts a new patch at every byte whose entropy exceeds a threshold and returns the patch lengths.{" "}
          <C>two_level_cost</C> counts attention pairs for a sequence of n bytes in patches of P: a global model over n/P patches and a
          local model inside each patch.
        </p>
        <Code>{PATCH}</Code>
      </Definition>

      <Theorem title="the best patch size">
        <p>
          The cost <M>{"f(P) = n^2/P^2 + nP"}</M> is smallest at <M>{"P = (2n)^{1/3}"}</M>, where it is about{" "}
          <M>{"1.89\\, n^{4/3}"}</M>, against <M>{"n^2"}</M> for attention over all bytes.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"f'(P) = -2n^2/P^3 + n"}</M> is zero at <M>{"P^3 = 2n"}</M>, and f is convex for P &gt; 0, so this is the minimum.
          Substituting, <M>{"f = n^{4/3}(2^{-2/3} + 2^{1/3}) \\approx 1.89\\, n^{4/3}"}</M>. For n = 8192 bytes the best P is about 25,
          and the cost falls by a factor of about two hundred.
        </p>
      </Proof>

      <Definition title="next-byte entropy">
        <p>
          <C>bigram_counts</C> counts adjacent byte pairs in a sample, and <C>position_entropy</C> gives, for each position, the entropy
          in bits (m12.1.2) of the next byte given the previous one under those counts, the simplest version of the small model that
          decides where patches begin (an n-gram model, as in l4.3.1). <C>mean_patch</C> is the average patch length, which sets the
          compute saved.
        </p>
        <Code>{ENTROPY}</Code>
      </Definition>

      <Theorem title="patch count and threshold">
        <p>
          The number of entropy patches is one plus the number of positions after the first whose entropy exceeds the threshold, so it
          falls as the threshold rises, and the mean patch length is the sequence length divided by it.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each position either starts a patch, which happens exactly at the first position and at positions above the threshold, or
          extends the current one. Raising the threshold can only remove positions from the set above it. The lengths partition the
          sequence, so their mean is n over their number.
        </p>
      </Proof>

      <Remark title="byte-level models in practice">
        <p>
          ByT5 trained encoder-decoder models directly on bytes, spending more depth in the encoder, and was robust to spelling noise.
          MegaByte used fixed patches with a large global model and a small local one. The Byte Latent Transformer used entropy patches
          from a small byte model and matched the performance of tokenised models at scale while spending less compute per byte on
          predictable text. Byte models remove the vocabulary trade-offs of e11.5.3, but the data pipeline still decides what text the
          model sees, which is where the next chapter turns.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Grouping bytes into patches turns the cost from quadratic in bytes to quadratic in patches plus a small local term. With
          entropy-based patches, common words become one or two patches and rare strings get more, so the model pays for information
          rather than for length, without a fixed vocabulary.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: <p>What is <C>two_level_cost(8192, 8)</C>?</p>,
      answer: { kind: "numeric", value: 1114112, tolerance: 0 },
    },
    {
      key: "fixed",
      rung: "check",
      prompt: <p>How many patches does <C>fixed_patches</C> make from 1000 bytes with P = 6?</p>,
      answer: { kind: "numeric", value: 167, tolerance: 0 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: <p>Where do entropy-based patches tend to begin in English text?</p>,
      answer: {
        kind: "choice",
        options: [
          "At the starts of words and other hard-to-predict bytes, since the rest of a word is usually predictable",
          "Every fourth byte",
          "At vowels",
          "Only at punctuation",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fixed_patches(bs, P):
    return [bs[i:i + P] for i in range(0, len(bs), P)]

def entropy_patches(entropies, threshold):
    lengths = []
    for i, h in enumerate(entropies):
        if i == 0 or h > threshold:               # a hard-to-predict byte starts a new patch
            lengths.append(1)
        else:
            lengths[-1] += 1
    return lengths

def two_level_cost(n, P):
    return (n / P) ** 2 + (n / P) * P ** 2      # attention over patches, plus attention inside each patch

h = [8.0, 1.0, 0.5, 3.2, 0.1, 2.9, 0.2]
print(fixed_patches(b"abcdefg", 3), entropy_patches(h, 2.5), two_level_cost(64, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[b'abc', b'def', b'g'] [3, 2, 2] 512.0",
          "[b'abc', b'def', b'g'] [1, 2, 2, 2] 512.0",
          "[b'abc', b'def'] [3, 2, 2] 512.0",
          "[b'abc', b'def', b'g'] [3, 2, 2] 4096.0",
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
from collections import Counter

def bigram_counts(data):
    return Counter(zip(data, data[1:]))

def position_entropy(data, counts):
    out = [8.0]                                    # nothing is known before the first byte
    for prev in data[:-1]:
        row = {b: c for (a, b), c in counts.items() if a == prev}
        total = sum(row.values())
        out.append(sum(c / total * math.log2(total / c) for c in row.values()))   # bits for the next byte
    return out

def mean_patch(lengths):
    return sum(lengths) / len(lengths)

d = b"abacab"
print(sorted(bigram_counts(d).items()), [round(x, 2) for x in position_entropy(d, bigram_counts(d))], mean_patch([3, 1, 2]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[((97, 98), 2), ((97, 99), 1), ((98, 97), 1), ((99, 97), 1)] [8.0, 0.92, 0.0, 0.92, 0.0, 0.92] 2.0",
          "[((97, 98), 2), ((97, 99), 1), ((98, 97), 1), ((99, 97), 1)] [8.0, 0.92, 1.0, 0.92, 1.0, 0.92] 2.0",
          "[((97, 98), 2), ((97, 99), 1), ((98, 97), 1), ((99, 97), 1)] [8.0, 0.92, 0.0, 0.92, 0.0, 0.92] 3.0",
          "[((97, 98), 2), ((98, 97), 1)] [8.0, 0.92, 0.0, 0.92, 0.0, 0.92] 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fixed_patches(bs, P)</C>; <C>entropy_patches(entropies, threshold)</C>, returning patch lengths; and{" "}
          <C>two_level_cost(n, P)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fixed_patches(bs, P):
    return [bs]

def entropy_patches(entropies, threshold):
    return [len(entropies)]

def two_level_cost(n, P):
    return n * n
`,
        solution: PATCH,
        tests: [
          { name: "fixed", code: `assert fixed_patches(b"abcde", 2) == [b"ab", b"cd", b"e"] and fixed_patches(b"", 3) == []\nassert two_level_cost(100, 10) == 1100.0 and two_level_cost(9, 1) == 90.0` },
          { name: "entropy", code: `assert entropy_patches([0.1, 5, 5, 0.2, 0.3, 4.1], 4) == [1, 1, 3, 1] and entropy_patches([9, 9], 10) == [2] and entropy_patches([], 1) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bigram_counts(data)</C>; <C>position_entropy(data, counts)</C>, giving 8.0 bits for the first position; and{" "}
          <C>mean_patch(lengths)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from collections import Counter

def bigram_counts(data):
    return Counter()

def position_entropy(data, counts):
    return [8.0] * len(data)

def mean_patch(lengths):
    return 1.0
`,
        solution: ENTROPY,
        tests: [
          { name: "counts", code: `assert bigram_counts(b"aab") == Counter({(97, 97): 1, (97, 98): 1}) and mean_patch([1, 2, 6]) == 3.0` },
          { name: "entropy", code: `e = position_entropy(b"xyxzxy", bigram_counts(b"xyxzxy"))\nassert len(e) == 6 and e[0] == 8.0 and abs(e[1] - (2 / 3 * math.log2(3 / 2) + 1 / 3 * math.log2(3))) < 1e-12 and e[2] == 0.0` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: <p>For a sequence of 16,000 bytes, which whole-number patch size P minimises <C>two_level_cost</C>?</p>,
      answer: { kind: "numeric", value: 32, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        With sources, extraction, filters, deduplication and tokenisation in place, the remaining question is how much of each source the
        model should see. The next chapter is about mixtures.
      </p>
    </>
  ),
};
