import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BitTrickViz } from "@/components/viz/BitTrickViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.1.3",
  minutes: 50,
  links: {
    requires: ["e3.1.1"],
    revisits: ["e0.1.3", "e2.3.3", "e2.3.1"],
    foreshadows: ["e3.3.3", "e3.6.2"],
  },

  puzzle: (
    <>
      <p>
        A chess engine stores a whole board&rsquo;s pawns in one 64-bit number and finds every square they attack in three
        operations. A hash table with a power-of-two size finds a bucket with <C>h &amp; (n - 1)</C> instead of a slow
        division. Image search compares a billion 256-bit fingerprints by counting differing bits. How do you think in bits
        rather than numbers, and which one-line tricks are worth knowing?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An integer is also a row of yes/no switches, and the bitwise operators work on all switches at once: AND keeps the
        bits set in both, OR in either, XOR in exactly one, and shifts slide the row left or right. A <strong>mask</strong>{" "}
        picks out the bits you care about. The best tricks combine arithmetic with bitwise operators: subtracting 1 flips the
        lowest 1 bit and everything below it, so <C>x &amp; (x - 1)</C> deletes exactly that bit. Try each trick on a few
        values of x.
      </p>
      <BitTrickViz />
    </>
  ),

  theory: (
    <>
      <Definition title="masks and fields">
        <p>
          Bit i is tested with <C>x &gt;&gt; i &amp; 1</C>, set with <C>x | (1 &lt;&lt; i)</C>, cleared with{" "}
          <C>x &amp; ~(1 &lt;&lt; i)</C> and toggled with <C>x ^ (1 &lt;&lt; i)</C>. A field of w bits starting at bit s is{" "}
          <C>(x &gt;&gt; s) &amp; ((1 &lt;&lt; w) - 1)</C>. Shifting left by k multiplies by <M>{"2^k"}</M>; shifting right
          divides and rounds down (for negative numbers too, in Python). For n a power of two,{" "}
          <C>x % n == x &amp; (n - 1)</C>.
        </p>
      </Definition>

      <Theorem title="clearing and isolating the lowest set bit">
        <p>
          For x &gt; 0, <C>x &amp; (x - 1)</C> is x with its lowest 1 bit cleared, and <C>x &amp; -x</C> is that bit alone. So x
          is a power of two exactly when x &gt; 0 and <C>x &amp; (x - 1) == 0</C>, and repeating the first operation until 0
          counts the 1 bits in as many steps as there are 1s.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write x as a prefix P, then a 1 at position j, then j zeros. Then x − 1 is P, a 0 at j, and j ones: borrowing turns the
          trailing zeros into ones and the 1 into 0. ANDing keeps P and zeroes positions j and below, clearing exactly bit j. In
          two&rsquo;s complement −x = ~x + 1: ~x is ~P, 0, then j ones, and adding 1 carries through the ones to give ~P, 1, j
          zeros. ANDing with x leaves only bit j, since P &amp; ~P = 0.
        </p>
      </Proof>

      <Example title="sets as bits">
        <p>
          A subset of {"{0, …, n − 1}"} is an n-bit integer: union is |, intersection &amp;, symmetric difference ^, and the
          size is the popcount (<C>int.bit_count()</C> in Python 3.10+, one instruction on modern CPUs). Looping{" "}
          <C>sub = (sub - 1) &amp; mask</C> visits every subset of mask once, in decreasing order, which drives dynamic
          programmes over subsets. Bloom filters, register allocation and chess bitboards all store sets this way, and the
          hardware processes 64 elements per instruction.
        </p>
      </Example>

      <Example title="XOR">
        <p>
          XOR is addition modulo 2 on each bit: it is its own inverse (<C>a ^ b ^ b == a</C>) and order does not matter. XOR of a
          list in which every value appears twice except one leaves that one. Parity bits and RAID storage use XOR to rebuild a
          lost block from the others. The Gray code <C>n ^ (n &gt;&gt; 1)</C> lists all n-bit patterns so that neighbours
          differ in one bit, which rotary encoders use so that a reading between positions is never wildly wrong.
        </p>
      </Example>

      <Remark title="binary codes for search">
        <p>
          Similarity search at scale often replaces float vectors by short binary codes, for example the signs of random
          projections (SimHash), so that the Hamming distance popcount(a ^ b) approximates the angle between the original
          vectors. A 256-bit code is four machine words; comparing two takes a handful of instructions, so billions of
          comparisons a second are possible. Packing booleans into bits also cuts memory by eight times compared with one byte
          each, which is what <C>np.packbits</C> does.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mask",
      rung: "check",
      prompt: <p>Which expression extracts bits 4 to 7 (a 4-bit field starting at bit 4) of x?</p>,
      answer: { kind: "choice", options: ["(x >> 4) & 0xF", "(x & 0xF) >> 4", "x & (4 << 7)", "(x << 4) & 0xF0"], correct: [0] },
    },
    {
      key: "steps",
      rung: "apply",
      prompt: <p>How many times does <C>x &amp;= x - 1</C> run before x becomes 0, starting from x = 0b1011_0110?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "subsets",
      rung: "apply",
      prompt: <p>The loop <C>sub = (sub - 1) &amp; mask</C>, plus the empty set, visits every subset of mask. How many subsets does it visit for mask = 0b1101_0011?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def count_steps(x):
    steps = 0
    while x:
        x &= x - 1
        steps += 1
    return steps

xs = [12, 255, 1024, 0b1011000]
print([count_steps(x) for x in xs], [x & -x for x in xs], 96 & (96 - 1) == 0, 64 & (64 - 1) == 0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2, 8, 1, 3] [4, 1, 1024, 8] False True", "[2, 8, 1, 3] [8, 1, 1024, 64] False True", "[2, 8, 11, 3] [4, 1, 1024, 8] False True", "[2, 8, 1, 3] [4, 1, 1024, 8] True True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`mask = 0b1011
subs = []
sub = mask
while sub:
    subs.append(sub)
    sub = (sub - 1) & mask
subs.append(0)
print(subs, len(subs), [format(s, "04b") for s in subs[:3]])`}</Code>
          <p>Enumerating the subsets of a mask. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[11, 10, 9, 8, 3, 2, 1, 0] 8 ['1011', '1010', '1001']", "[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] 12 ['1011', '1010', '1001']", "[11, 10, 9, 8, 3, 2, 1, 0] 8 ['1101', '0101', '1001']", "[11, 9, 8, 3, 2, 1, 0] 7 ['1011', '1001', '1000']"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Without <C>bin</C>, string formatting, <C>bit_count</C> or <C>bit_length</C>, write <C>popcount(x)</C> for x ≥ 0 in
            as many loop steps as x has 1 bits (<C>ValueError</C> for negative x), <C>lowest_set_bit(x)</C>, the index of the
            lowest 1 bit of a positive x (<C>ValueError</C> otherwise), and <C>next_power_of_two(n)</C>, the smallest power of
            two ≥ n (1 for n ≤ 1).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def popcount(x):
    return x % 2

def lowest_set_bit(x):
    return 0

def next_power_of_two(n):
    return 2 * n
`,
        solution: `def popcount(x):
    if x < 0:
        raise ValueError('non-negative only')
    n = 0
    while x:
        x &= x - 1
        n += 1
    return n

def lowest_set_bit(x):
    if x <= 0:
        raise ValueError('need a positive integer')
    low = x & -x
    i = 0
    while low > 1:
        low >>= 1
        i += 1
    return i

def next_power_of_two(n):
    if n <= 1:
        return 1
    p = 1
    while p < n:
        p <<= 1
    return p
`,
        tests: [
          { name: "popcount", code: `import random
assert popcount(0) == 0 and popcount(12) == 2 and popcount(255) == 8 and popcount(1 << 100) == 1
rng = random.Random(8)
for _ in range(2000):
    x = rng.getrandbits(rng.randint(1, 200))
    assert popcount(x) == bin(x).count('1'), x
try:
    popcount(-1)
    assert False, 'Negative numbers have infinitely many 1 bits in two’s complement: raise ValueError.'
except ValueError:
    pass
assert popcount((1 << 5000) | 1) == 2` },
          { name: "lowest bit and powers", code: `import random
assert lowest_set_bit(1) == 0 and lowest_set_bit(12) == 2 and lowest_set_bit(1 << 77) == 77 and lowest_set_bit(0b1011000) == 3
assert next_power_of_two(1) == 1 and next_power_of_two(5) == 8 and next_power_of_two(8) == 8 and next_power_of_two(0) == 1
assert next_power_of_two(1025) == 2048
rng = random.Random(9)
for _ in range(2000):
    x = rng.getrandbits(rng.randint(1, 120)) or 1
    assert lowest_set_bit(x) == (x & -x).bit_length() - 1
    p = next_power_of_two(x)
    assert p >= x and p & (p - 1) == 0 and (p == 1 or p // 2 < x), (x, p)
for bad in [0, -4]:
    try:
        lowest_set_bit(bad)
        assert False, f'{bad} has no lowest set bit: raise ValueError.'
    except ValueError:
        pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>hamming_knn(codes, query, k)</C>, the indices of the k codes (non-negative ints) nearest the query in
            Hamming distance, nearest first, ties by smaller index; and <C>gray(n)</C> with its inverse{" "}
            <C>gray_inverse(g)</C>, which must work for integers of any size.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def hamming_knn(codes, query, k):
    return sorted(range(len(codes)), key=lambda i: abs(codes[i] - query))[:k]

def gray(n):
    return n

def gray_inverse(g):
    return g
`,
        solution: `def hamming_knn(codes, query, k):
    dist = [((c ^ query).bit_count(), i) for i, c in enumerate(codes)]
    dist.sort()
    return [i for _, i in dist[:k]]

def gray(n):
    return n ^ (n >> 1)

def gray_inverse(g):
    n = 0
    while g:
        n ^= g
        g >>= 1
    return n
`,
        tests: [
          { name: "Hamming search", code: `import random
codes = [0b1111, 0b0000, 0b1110, 0b0111, 0b1000]
assert hamming_knn(codes, 0b1111, 3) == [0, 2, 3]
assert hamming_knn(codes, 0b0001, 2) == [1, 3], 'Ties go to the smaller index.'
assert hamming_knn([], 5, 3) == [] and hamming_knn([7], 0, 5) == [0]
rng = random.Random(10)
for _ in range(200):
    codes = [rng.getrandbits(64) for _ in range(rng.randint(1, 40))]
    q = rng.getrandbits(64)
    k = rng.randint(1, 10)
    want = sorted(range(len(codes)), key=lambda i: (bin(codes[i] ^ q).count('1'), i))[:k]
    assert hamming_knn(codes, q, k) == want` },
          { name: "Gray code", code: `assert [gray(n) for n in range(8)] == [0, 1, 3, 2, 6, 7, 5, 4]
for n in range(5000):
    assert bin(gray(n) ^ gray(n + 1)).count('1') == 1, 'Neighbours differ in one bit.'
    assert gray_inverse(gray(n)) == n
assert sorted(gray(n) for n in range(256)) == list(range(256))
big = (1 << 300) + 12345
assert gray_inverse(gray(big)) == big` },
        ],
      },
    },
    {
      key: "grayproof",
      rung: "prove",
      prompt: <p>Prove that gray(n) = n XOR (n &gt;&gt; 1) and gray(n + 1) differ in exactly one bit.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes n as a prefix P, a 0 at position j, then j ones, so n + 1 is P, a 1 at j, then j zeros.",
          "Computes that n and n + 1 differ exactly in bits 0 to j.",
          "Observes bit i of gray(n) is bit i of n XOR bit i + 1 of n, so gray changes at bit i only if exactly one of bits i and i + 1 of n changes.",
          "Bits 0 to j all change, so only bit j (where bit j + 1 is unchanged) changes in the Gray code: exactly one bit.",
        ],
      },
    },
    {
      key: "subsetproof",
      rung: "stretch",
      prompt: <p>Prove that starting from sub = mask and repeating sub = (sub − 1) &amp; mask visits every subset of mask exactly once, in decreasing order, before reaching 0.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes every value produced is a subset of mask because of the AND.",
          "Shows (sub − 1) & mask is the largest subset of mask smaller than sub: sub − 1 is the largest integer below sub, and clearing non-mask bits from it, which are only in its low trailing part, gives the largest subset below it.",
          "Concludes the sequence is strictly decreasing and skips no subset.",
          "Counts 2^popcount(mask) subsets including the final 0.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why x & (x − 1) removes the lowest 1 bit of x, and how that counts the 1 bits.",

  glimpse: (
    <p>
      Chapter 1 is done: you know what the bits mean. Next, the programs that move them around, starting with C, the
      language closest to the machine that most of Python is written in.
    </p>
  ),
};
