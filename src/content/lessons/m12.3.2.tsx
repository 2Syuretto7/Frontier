import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KraftViz } from "@/components/viz/KraftViz";
import type { LessonContent } from "@/lib/types";

const KR = `def kraft_sum(lengths):
    return sum(2.0 ** -l for l in lengths)

def is_prefix_free(words):
    return not any(a != b and b.startswith(a) for a in words for b in words)

def canonical_code(lengths):
    order = sorted(range(len(lengths)), key=lambda i: lengths[i])
    words, value, prev = [None] * len(lengths), 0, 0
    for i in order:
        value <<= lengths[i] - prev; prev = lengths[i]
        words[i] = format(value, "b").zfill(prev); value += 1
    return words`;

const SH = `import numpy as np

def shannon_lengths(p):
    return [int(np.ceil(-np.log2(x) - 1e-12)) for x in p]

def expected_length(p, lengths):
    return float(np.dot(p, lengths))

def mismatch_cost(p, q):
    return expected_length(p, shannon_lengths(q))`;

export const lesson: LessonContent = {
  id: "m12.3.2",
  minutes: 50,
  links: {
    requires: ["m12.3.1", "m12.2.1"],
    revisits: ["m12.1.2"],
    foreshadows: ["m12.3.3", "m12.3.4"],
  },

  puzzle: (
    <>
      <p>
        You want a binary code for four symbols in which no codeword is the start of another, so a stream can be cut into
        codewords as it arrives. Lengths 1, 2, 3, 3 work: 0, 10, 110, 111. Lengths 1, 1, 2 cannot, and neither can 2, 2, 2,
        2, 1. Is there a simple test that says which length lists are possible? And since short codewords are what save
        bits, is there a hard floor on how short the average can be?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A codeword of length ℓ uses up a fraction 2^(−ℓ) of all possible bit strings: every string that begins with it.
        Prefix-free codewords use disjoint fractions, so their fractions add to at most 1. That budget, the Kraft inequality,
        is also enough: any lengths within budget can be realised. Spending the budget well means giving each symbol a share
        close to its probability, that is a length close to −log₂ p, and then the average length is the entropy. No
        decodable code can do better.
      </p>
      <KraftViz />
    </>
  ),

  theory: (
    <>
      <Definition title="codes">
        <p>
          A binary code assigns each symbol x a codeword c(x) of length ℓ(x). It is prefix-free if no codeword is a prefix of
          another, and uniquely decodable if every concatenation of codewords can be split back in only one way. Prefix-free
          codes are uniquely decodable and can be decoded on the fly.
        </p>
      </Definition>

      <Theorem title="the Kraft inequality">
        <p>
          A prefix-free binary code with lengths <M>{"\\ell_1, \\dots, \\ell_m"}</M> exists if and only if
        </p>
        <MD>{"\\sum_{i=1}^m 2^{-\\ell_i} \\le 1."}</MD>
      </Theorem>
      <Proof>
        <p>
          Identify a word w of length ℓ with the interval <M>{"I(w) = [0.w,\\ 0.w + 2^{-\\ell})"}</M> of numbers whose
          binary expansion begins with w. If neither of two words is a prefix of the other, they differ at some position
          within both lengths, so their intervals are disjoint. Disjoint subintervals of [0, 1) have total length at most 1,
          which proves necessity. For sufficiency, sort the lengths increasingly and place intervals of widths{" "}
          <M>{"2^{-\\ell_1}, 2^{-\\ell_2}, \\dots"}</M> end to end from 0. Each starts at a sum of earlier widths, all
          multiples of <M>{"2^{-\\ell_i}"}</M> because the earlier lengths are no longer, so its start is a number with
          exactly <M>{"\\ell_i"}</M> binary digits; take those digits as the codeword. The intervals are disjoint and fit in
          [0, 1) by the inequality, so no codeword is a prefix of another. The code builds exactly this canonical code.
        </p>
        <Code>{KR}</Code>
      </Proof>

      <Theorem title="McMillan: decodable codes obey the same budget">
        <p>
          Every uniquely decodable code satisfies <M>{"\\sum 2^{-\\ell_i} \\le 1"}</M>, so restricting to prefix-free codes
          costs nothing.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let S = Σ 2^(−ℓᵢ) and <M>{"\\ell_{\\max} = \\max \\ell_i"}</M>. Expanding the k-th power,{" "}
          <M>{"S^k = \\sum_{m}A_m2^{-m}"}</M>, where <M>{"A_m"}</M> counts sequences of k symbols whose codewords have total
          length m. Unique decodability means these sequences give distinct bit strings of length m, so{" "}
          <M>{"A_m \\le 2^m"}</M>, and m ranges up to <M>{"k\\ell_{\\max}"}</M>. Hence <M>{"S^k \\le k\\ell_{\\max}"}</M> for
          every k. If S &gt; 1 the left side grows exponentially in k and the right linearly, a contradiction.
        </p>
      </Proof>

      <Theorem title="the entropy is the limit of compression">
        <p>
          Every uniquely decodable code has expected length <M>{"L = \\sum p(x)\\ell(x) \\ge H(X)"}</M>, with equality iff{" "}
          <M>{"\\ell(x) = -\\log_2 p(x)"}</M> for all x. The Shannon code <M>{"\\ell(x) = \\lceil -\\log_2 p(x)\\rceil"}</M>{" "}
          exists and has <M>{"H(X) \\le L < H(X) + 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Put <M>{"S = \\sum 2^{-\\ell(x)} \\le 1"}</M> and <M>{"r(x) = 2^{-\\ell(x)}/S"}</M>, a distribution. Then{" "}
          <M>{"L - H = \\sum p(x)\\log_2\\frac{p(x)}{2^{-\\ell(x)}} = D(p\\,\\|\\,r) - \\log_2 S \\ge 0"}</M>, with equality iff r = p
          and S = 1, that is <M>{"2^{-\\ell(x)} = p(x)"}</M>. For the Shannon lengths,{" "}
          <M>{"2^{-\\ell(x)} \\le p(x)"}</M>, so Kraft holds and the code exists; and{" "}
          <M>{"\\ell(x) < -\\log_2 p(x) + 1"}</M>, so averaging gives L &lt; H + 1. Coding blocks of n symbols reduces the
          overhead to less than 1/n bit per symbol.
        </p>
      </Proof>

      <Remark title="the price of the wrong model">
        <p>
          Build the Shannon code from a model q but use it on data from p: the same calculation gives{" "}
          <M>{"H(p) + D(p\\,\\|\\,q) \\le L < H(p) + D(p\\,\\|\\,q) + 1"}</M>. For dyadic distributions the ceilings vanish and
          the cost is exactly the cross-entropy: in the code, data with probabilities ½, ¼, ⅛, ⅛ coded for the reversed
          distribution cost 2.625 bits instead of 1.75, the extra 0.875 being the KL divergence. This is the precise sense
          in which a better predictive model is a better compressor.
        </p>
        <Code>{SH}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sum",
      rung: "check",
      prompt: <p>What is the Kraft sum Σ 2^(−ℓ) for codeword lengths 2, 2, 3, 3, 3?</p>,
      answer: { kind: "numeric", value: 0.875, tolerance: 0.0001 },
    },
    {
      key: "shannon",
      rung: "check",
      prompt: <p>What codeword length does the Shannon code give a symbol of probability 0.3?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0 },
    },
    {
      key: "exists",
      rung: "apply",
      prompt: <p>Which list of codeword lengths can belong to a uniquely decodable binary code for five symbols?</p>,
      answer: {
        kind: "choice",
        options: ["1, 2, 3, 4, 4", "1, 1, 2, 3, 3", "2, 2, 2, 2, 1", "1, 2, 2, 3, 3"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kraft_sum(lengths):
    return sum(2.0 ** -l for l in lengths)

def is_prefix_free(words):
    return not any(a != b and b.startswith(a) for a in words for b in words)

def canonical_code(lengths):
    order = sorted(range(len(lengths)), key=lambda i: lengths[i])
    words, value, prev = [None] * len(lengths), 0, 0
    for i in order:
        value <<= lengths[i] - prev; prev = lengths[i]
        words[i] = format(value, "b").zfill(prev); value += 1
    return words

L = [1, 2, 3, 3]
print(kraft_sum(L), canonical_code(L), is_prefix_free(canonical_code(L)))
print(kraft_sum([1, 1, 2]), is_prefix_free(["0", "01", "11"]), canonical_code([2, 2, 2, 3, 3]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 ['0', '10', '110', '111'] True\n1.25 False ['00', '01', '10', '110', '111']",
          "1.0 ['0', '10', '110', '111'] True\n1.25 True ['00', '01', '10', '110', '111']",
          "1.0 ['0', '01', '011', '111'] True\n1.25 False ['00', '01', '10', '110', '111']",
          "0.875 ['0', '10', '110', '111'] True\n1.25 False ['00', '01', '10', '11', '111']",
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

def shannon_lengths(p):
    return [int(np.ceil(-np.log2(x) - 1e-12)) for x in p]

def expected_length(p, lengths):
    return float(np.dot(p, lengths))

def mismatch_cost(p, q):
    return expected_length(p, shannon_lengths(q))

p = [0.4, 0.3, 0.2, 0.1]; Ls = shannon_lengths(p)
H = -sum(x * np.log2(x) for x in p)
print(Ls, round(expected_length(p, Ls), 2), round(H, 4), sum(2.0 ** -l for l in Ls) <= 1)
print(mismatch_cost([0.5, 0.25, 0.125, 0.125], [0.125, 0.125, 0.25, 0.5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 2, 3, 4] 2.4 1.8464 True\n2.625",
          "[1, 2, 3, 4] 1.9 1.8464 True\n2.625",
          "[2, 2, 3, 4] 2.4 1.8464 True\n1.75",
          "[2, 2, 2, 3] 2.1 1.8464 True\n2.625",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kraft_sum(lengths)</C>; <C>is_prefix_free(words)</C> for a list of bit strings; and{" "}
          <C>canonical_code(lengths)</C>, returning the codewords (in the original order) built by sorting the lengths and
          counting upwards in binary, shifting left whenever the length grows.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kraft_sum(lengths):
    return 0.0

def is_prefix_free(words):
    return True

def canonical_code(lengths):
    return ["" for _ in lengths]
`,
        solution: KR,
        tests: [
          { name: "kraft", code: `assert kraft_sum([1, 2, 2]) == 1.0 and kraft_sum([3, 3]) == 0.25
assert is_prefix_free(["0", "10", "11"]) and not is_prefix_free(["1", "10"]) and is_prefix_free(["01", "10"])` },
          { name: "canonical", code: `assert canonical_code([3, 1, 3, 2]) == ["110", "0", "111", "10"]
w = canonical_code([2, 3, 3, 3, 4, 4]); assert is_prefix_free(w) and [len(x) for x in w] == [2, 3, 3, 3, 4, 4]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shannon_lengths(p)</C>, the lengths ⌈−log₂ p(x)⌉ as ints (careful with exact powers of 2);{" "}
          <C>expected_length(p, lengths)</C>; and <C>mismatch_cost(p, q)</C>, the expected length under p of the Shannon code
          built for q.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def shannon_lengths(p):
    return [1 for _ in p]

def expected_length(p, lengths):
    return 0.0

def mismatch_cost(p, q):
    return 0.0
`,
        solution: SH,
        tests: [
          { name: "lengths", code: `assert shannon_lengths([0.5, 0.25, 0.25]) == [1, 2, 2] and shannon_lengths([0.3, 0.7]) == [2, 1]
assert np.isclose(expected_length([0.5, 0.5], [1, 3]), 2.0)` },
          { name: "mismatch", code: `p = [0.5, 0.25, 0.25]; assert np.isclose(mismatch_cost(p, p), 1.5)
assert np.isclose(mismatch_cost(p, [0.25, 0.25, 0.5]), 0.5 * 2 + 0.25 * 2 + 0.25 * 1)` },
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: (
        <p>
          Data come from p = (½, ¼, ¼) but are coded with the Shannon code for q = (¼, ¼, ½). How many extra bits per symbol
          does this cost compared with the optimal code for p?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The Shannon code can be up to a bit worse than the entropy per symbol, and is not always the best code for a given
        distribution. The next lesson builds the optimal one with a simple greedy rule: Huffman coding.
      </p>
    </>
  ),
};
