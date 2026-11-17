import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HuffmanViz } from "@/components/viz/HuffmanViz";
import type { LessonContent } from "@/lib/types";

const HU = `import heapq

def huffman_lengths(p):
    heap = [(q, i, [i]) for i, q in enumerate(p)]; heapq.heapify(heap)
    lengths, tie = [0] * len(p), len(p)
    while len(heap) > 1:
        q1, _, s1 = heapq.heappop(heap); q2, _, s2 = heapq.heappop(heap)
        for i in s1 + s2:
            lengths[i] += 1
        heapq.heappush(heap, (q1 + q2, tie, s1 + s2)); tie += 1
    return lengths

def canonical_code(lengths):
    order = sorted(range(len(lengths)), key=lambda i: lengths[i])
    words, value, prev = [None] * len(lengths), 0, 0
    for i in order:
        value <<= lengths[i] - prev; prev = lengths[i]
        words[i] = format(value, "b").zfill(prev); value += 1
    return words

def decode(bits, words):
    inv, out, cur = {w: i for i, w in enumerate(words)}, [], ""
    for b in bits:
        cur += b
        if cur in inv:
            out.append(inv[cur]); cur = ""
    return out`;

const BL = `import heapq, itertools
import numpy as np

def huffman_expected_length(p):
    heap = list(p); heapq.heapify(heap); total = 0.0
    while len(heap) > 1:
        a = heapq.heappop(heap); b = heapq.heappop(heap)
        total += a + b; heapq.heappush(heap, a + b)
    return total

def block_rate(p, n):
    probs = [float(np.prod(c)) for c in itertools.product(p, repeat=n)]
    return huffman_expected_length(probs) / n`;

export const lesson: LessonContent = {
  id: "m12.3.3",
  minutes: 50,
  links: {
    requires: ["m12.3.2"],
    revisits: ["m12.3.1"],
    foreshadows: ["m12.3.4", "m12.4.1"],
  },

  puzzle: (
    <>
      <p>
        Among all prefix codes for a given distribution, which has the smallest average length? There are astronomically
        many codes to choose from, yet a student, David Huffman, found in 1951 a greedy rule that always produces an optimal
        one: keep merging the two least likely things. Why should a myopic rule give a global optimum? And why, even so,
        does an optimal symbol-by-symbol code spend a whole bit on each flip of a coin that lands heads 99% of the time,
        when its entropy is only 0.08 bits?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In any optimal code the two least likely symbols can be taken to be the longest codewords, differing only in their
        last bit. Merge them into one pseudo-symbol and the problem shrinks by one, with the same structure. Repeating builds
        the code tree from the bottom up, and the depth of each leaf is its codeword length. The limitation is that lengths
        are whole numbers: a symbol of probability 0.99 deserves 0.015 bits but must get at least 1. Coding blocks of
        symbols spreads that rounding loss over many symbols.
      </p>
      <HuffmanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Huffman's algorithm">
        <p>
          Start with a forest of single-node trees, one per symbol, weighted by probability. While more than one tree
          remains, remove the two of smallest weight and join them under a new root whose weight is their sum, labelling the
          two edges 0 and 1. Each symbol&apos;s codeword is the sequence of labels from the final root to its leaf.
        </p>
      </Definition>

      <Theorem title="the expected length is the sum of the merged weights">
        <p>If the merges produce internal nodes of weights <M>{"w_1, \\dots, w_{m-1}"}</M>, then <M>{"L = \\sum_j w_j"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          A leaf at depth ℓ lies below exactly ℓ internal nodes, and an internal node&apos;s weight is the total probability of
          the leaves below it. So <M>{"\\sum_j w_j = \\sum_j\\sum_{x \\text{ below } j}p(x) = \\sum_x p(x)\\,\\ell(x) = L"}</M>.
          For 0.4, 0.3, 0.2, 0.1 the merges have weights 0.3, 0.6 and 1, giving 1.9 bits.
        </p>
        <Code>{HU}</Code>
      </Proof>

      <Theorem title="Huffman codes are optimal">
        <p>No prefix code, and by McMillan no uniquely decodable code, has smaller expected length than a Huffman code.</p>
      </Theorem>
      <Proof>
        <p>
          Lemma: for <M>{"p_1 \\ge \\dots \\ge p_m"}</M> there is an optimal code in which <M>{"x_{m-1}"}</M> and{" "}
          <M>{"x_m"}</M> are siblings at maximum depth. In an optimal code, more probable symbols have codewords no longer than
          less probable ones, or swapping them would reduce L. Every node at maximum depth has a sibling, or it could move up
          a level and shorten a codeword. So some sibling pair at maximum depth exists, and swapping the two least probable
          symbols into it does not increase L.
        </p>
        <p>
          Induction on m: for m = 2 both codewords have length 1. For m &gt; 2, merge <M>{"x_{m-1}, x_m"}</M> into one symbol of
          probability <M>{"p_{m-1} + p_m"}</M>. Any code C for the original problem of the lemma&apos;s form gives a code C′ for
          the merged problem with <M>{"L(C) = L(C') + p_{m-1} + p_m"}</M>, and conversely by splitting a leaf. Huffman on the
          original merges those two first and then runs Huffman on the merged problem, which is optimal by induction; adding
          the same <M>{"p_{m-1} + p_m"}</M> to both sides shows the result is optimal too.
        </p>
      </Proof>

      <Remark title="how close to the entropy">
        <p>
          Since Huffman is optimal and the Shannon code achieves L &lt; H + 1, Huffman satisfies <M>{"H \\le L < H + 1"}</M>,
          with L = H exactly for dyadic distributions. The gap is worst for skewed sources: for (0.99, 0.01), L = 1 bit
          while H ≈ 0.08. Coding blocks of n symbols as a single alphabet gives fewer than 1/n wasted bits per symbol: for
          (0.9, 0.1), with H = 0.469, the rate falls from 1 bit for single symbols to 0.645 for pairs, 0.533 for triples
          and 0.47 for blocks of six (not monotonically in between). But the alphabet grows like 2ⁿ, and the code must be
          rebuilt whenever the probabilities change. Huffman coding sits inside DEFLATE (zip, gzip, PNG) and JPEG.
        </p>
        <Code>{BL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "uni3",
      rung: "check",
      prompt: <p>What is the expected length of a Huffman code for three equally likely symbols? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.6667, tolerance: 0.0001 },
    },
    {
      key: "five",
      rung: "check",
      prompt: <p>What is the expected length of a Huffman code for probabilities 0.35, 0.25, 0.2, 0.1, 0.1?</p>,
      answer: { kind: "numeric", value: 2.2, tolerance: 0.0001 },
    },
    {
      key: "lemma",
      rung: "apply",
      prompt: <p>Which fact makes the greedy merge of the two least likely symbols safe?</p>,
      answer: {
        kind: "choice",
        options: [
          "Some optimal code gives the two least likely symbols sibling codewords of maximum length, so merging them reduces the problem without losing optimality",
          "The two least likely symbols always have codewords of length 1",
          "Merging any two symbols never changes the expected length",
          "Huffman codes satisfy the Kraft inequality with strict inequality",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq

def huffman_lengths(p):
    heap = [(q, i, [i]) for i, q in enumerate(p)]; heapq.heapify(heap)
    lengths, tie = [0] * len(p), len(p)
    while len(heap) > 1:
        q1, _, s1 = heapq.heappop(heap); q2, _, s2 = heapq.heappop(heap)
        for i in s1 + s2:
            lengths[i] += 1
        heapq.heappush(heap, (q1 + q2, tie, s1 + s2)); tie += 1
    return lengths

def canonical_code(lengths):
    order = sorted(range(len(lengths)), key=lambda i: lengths[i])
    words, value, prev = [None] * len(lengths), 0, 0
    for i in order:
        value <<= lengths[i] - prev; prev = lengths[i]
        words[i] = format(value, "b").zfill(prev); value += 1
    return words

def decode(bits, words):
    inv, out, cur = {w: i for i, w in enumerate(words)}, [], ""
    for b in bits:
        cur += b
        if cur in inv:
            out.append(inv[cur]); cur = ""
    return out

p = [0.4, 0.3, 0.2, 0.1]; L = huffman_lengths(p); w = canonical_code(L)
print(L, w, round(sum(a * b for a, b in zip(p, L)), 2))
bits = "".join(w[s] for s in [0, 3, 1, 0, 2])
print(bits, decode(bits, w), huffman_lengths([0.25] * 4), huffman_lengths([0.99, 0.01]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 2, 3, 3] ['0', '10', '110', '111'] 1.9\n0111100110 [0, 3, 1, 0, 2] [2, 2, 2, 2] [1, 1]",
          "[1, 2, 3, 3] ['0', '10', '110', '111'] 1.9\n0111100110 [0, 3, 1, 0, 2] [1, 2, 3, 3] [1, 1]",
          "[2, 2, 2, 2] ['00', '01', '10', '11'] 2.0\n0011010010 [0, 3, 1, 0, 2] [2, 2, 2, 2] [1, 1]",
          "[1, 2, 3, 3] ['0', '10', '110', '111'] 1.9\n0111100110 [0, 3, 1, 0, 2] [2, 2, 2, 2] [0, 7]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq, itertools
import numpy as np

def huffman_expected_length(p):
    heap = list(p); heapq.heapify(heap); total = 0.0
    while len(heap) > 1:
        a = heapq.heappop(heap); b = heapq.heappop(heap)
        total += a + b; heapq.heappush(heap, a + b)
    return total

def block_rate(p, n):
    probs = [float(np.prod(c)) for c in itertools.product(p, repeat=n)]
    return huffman_expected_length(probs) / n

p = [0.4, 0.3, 0.2, 0.1]; print(round(huffman_expected_length(p), 2), [round(block_rate([0.9, 0.1], n), 3) for n in (1, 2, 3, 6)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.9 [1.0, 0.645, 0.533, 0.47]",
          "1.9 [1.0, 0.5, 0.333, 0.167]",
          "1.846 [1.0, 0.645, 0.533, 0.47]",
          "1.9 [0.469, 0.469, 0.469, 0.469]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>huffman_lengths(p)</C> with <C>heapq</C>, breaking ties by insertion order; <C>canonical_code(lengths)</C>{" "}
          as in the previous lesson; and <C>decode(bits, words)</C>, turning a bit string back into symbol indices.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import heapq

def huffman_lengths(p):
    return [1 for _ in p]

def canonical_code(lengths):
    return ["" for _ in lengths]

def decode(bits, words):
    return []
`,
        solution: HU,
        tests: [
          { name: "lengths", code: `assert huffman_lengths([0.5, 0.25, 0.125, 0.125]) == [1, 2, 3, 3] and huffman_lengths([0.6, 0.4]) == [1, 1]
L = huffman_lengths([0.35, 0.25, 0.2, 0.1, 0.1]); assert abs(sum(a * b for a, b in zip([0.35, 0.25, 0.2, 0.1, 0.1], L)) - 2.2) < 1e-9` },
          { name: "roundtrip", code: `w = canonical_code([2, 1, 3, 3]); assert w == ["10", "0", "110", "111"]
msg = [1, 2, 0, 3, 1, 1]; assert decode("".join(w[s] for s in msg), w) == msg` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>huffman_expected_length(p)</C> as the sum of the merged weights, without building codewords, and{" "}
          <C>block_rate(p, n)</C>, the bits per symbol of a Huffman code for blocks of n independent symbols.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import heapq, itertools
import numpy as np

def huffman_expected_length(p):
    return 0.0

def block_rate(p, n):
    return 0.0
`,
        solution: BL,
        tests: [
          { name: "length", code: `assert np.isclose(huffman_expected_length([0.5, 0.25, 0.125, 0.125]), 1.75) and np.isclose(huffman_expected_length([1 / 3] * 3), 5 / 3)
assert np.isclose(huffman_expected_length([1.0]), 0.0)` },
          { name: "blocks", code: `assert np.isclose(block_rate([0.5, 0.5], 3), 1.0) and np.isclose(block_rate([0.99, 0.01], 2), 1.0299 / 2)
assert block_rate([0.8, 0.2], 2) < block_rate([0.8, 0.2], 1)` },
        ],
      },
    },
    {
      key: "pairs",
      rung: "stretch",
      prompt: (
        <p>
          A coin lands heads with probability 0.99. What is the expected number of bits per flip of a Huffman code for pairs
          of flips? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.515, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Blocks fix the rounding loss only at the cost of huge tables. Arithmetic coding avoids codewords altogether: it
        narrows an interval symbol by symbol and comes within a couple of bits of the total surprise of the whole message,
        with probabilities that may change at every step.
      </p>
    </>
  ),
};
