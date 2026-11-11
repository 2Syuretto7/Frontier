import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BitsViz } from "@/components/viz/BitsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.1.1",
  minutes: 50,
  links: {
    requires: ["e0.1.2", "m4.4.3"],
    revisits: ["e1.5.6"],
    foreshadows: ["e3.1.2", "e3.1.3", "m11.1.4"],
  },

  puzzle: (
    <>
      <p>
        In Python, <C>2 ** 100</C> is just a big number. In NumPy, <C>np.int8(127) + np.int8(1)</C> is −128. In 2014 the view
        counter for a pop video on YouTube passed 2,147,483,647 and had to be changed, and in 1996 the first Ariane 5 rocket
        destroyed itself because a 64-bit value was squeezed into 16 bits. The machine stores numbers in a fixed number of
        bits, and the same bits can mean different numbers. What do the bits mean, and what happens at the edges?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Eight bits can hold 256 patterns. Read them as an ordinary binary number and you get 0 to 255. To get negative numbers,
        hardware uses <strong>two&rsquo;s complement</strong>: give the top bit the weight −128 instead of +128. Now the
        patterns mean −128 to 127, zero has one pattern, and, the clever part, the adding circuit does not change at all:
        adding the bit patterns and dropping any carry out of the top gives the right answer whenever it fits. Arithmetic is
        modulo 256, like a car&rsquo;s odometer. Flip bits below, and add 1 to 127.
      </p>
      <BitsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="unsigned and two's complement">
        <p>
          A w-bit pattern <M>{"b_{w-1} \\dots b_1 b_0"}</M> means <M>{"\\sum_i b_i 2^i"}</M> unsigned, from 0 to{" "}
          <M>{"2^w - 1"}</M>, and <M>{"-b_{w-1}2^{w-1} + \\sum_{i < w-1} b_i 2^i"}</M> in two&rsquo;s complement, from{" "}
          <M>{"-2^{w-1}"}</M> to <M>{"2^{w-1} - 1"}</M>. A value v is stored as the pattern <M>{"v \\bmod 2^w"}</M>, which in
          Python is <C>v &amp; ((1 &lt;&lt; w) - 1)</C>. Hexadecimal writes four bits per digit: <C>0xFF</C> is 1111 1111.
        </p>
      </Definition>

      <Theorem title="one adder for both">
        <p>
          For w-bit patterns p and q representing a and b (either both unsigned or both two&rsquo;s complement), the pattern
          (p + q) mod <M>{"2^w"}</M> represents a + b whenever a + b is in range. Negation is &ldquo;flip every bit and add
          1&rdquo;.
        </p>
      </Theorem>
      <Proof>
        <p>
          In both readings, a pattern&rsquo;s value is congruent to the pattern modulo <M>{"2^w"}</M>: the signed reading
          subtracts <M>{"2^w"}</M> exactly when the top bit is set. So p + q ≡ a + b (mod <M>{"2^w"}</M>), and since each
          range contains exactly one representative of each residue class, the stored result equals a + b if a + b lies in the
          range. Flipping all bits of p gives <M>{"2^w - 1 - p"}</M>; adding 1 gives <M>{"2^w - p \\equiv -p"}</M>.
        </p>
      </Proof>

      <Example title="overflow, and how the hardware notices">
        <p>
          A carry out of the top bit means unsigned overflow. Signed overflow happens exactly when two operands of the same
          sign give a result of the other sign; it can never happen when the signs differ. CPUs set a carry flag and an
          overflow flag after each addition. C leaves signed overflow undefined, so compilers may assume it never happens;
          Java and NumPy wrap silently; Python&rsquo;s own integers grow as needed and never overflow. Widening a signed
          value copies the sign bit into the new high bits (<strong>sign extension</strong>), so int8 −2 (0xFE) becomes
          int16 0xFFFE.
        </p>
      </Example>

      <Example title="byte order">
        <p>
          Memory is addressed in bytes, so a 4-byte integer is stored as four bytes in some order. <strong>Little-endian</strong>{" "}
          machines (x86, ARM as normally used) store the least significant byte first; network protocols use{" "}
          <strong>big-endian</strong>. In Python, <C>struct.pack(&quot;&lt;i&quot;, v)</C> and <C>&quot;&gt;i&quot;</C> choose the
          order, and <C>int.from_bytes(b, &quot;little&quot;)</C> reads it back. Reading a file or a tensor with the wrong order
          gives garbage that looks like numbers.
        </p>
      </Example>

      <Remark title="integers in machine learning">
        <p>
          Quantised models store weights as int8 or int4 together with a floating-point <strong>scale</strong>: a weight w is
          stored as <M>{"q = \\mathrm{round}(w / s)"}</M> clamped to [−127, 127] and recovered as <M>{"qs"}</M>, with error at
          most s/2. Integer matrix multiplications accumulate into int32 so that sums of many int8 products do not overflow.
          Token ids, array indices and byte counts are integers too: a 32-bit index cannot address a tensor with more than{" "}
          <M>{"2^{31}"}</M> elements, a limit real frameworks have hit.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "range",
      rung: "check",
      prompt: <p>What is the most negative value of a 16-bit two&rsquo;s complement integer?</p>,
      answer: { kind: "numeric", value: -32768 },
    },
    {
      key: "negate",
      rung: "apply",
      prompt: <p>The 8-bit pattern of 6 is 0000 0110. What is the pattern of −6, as an unsigned number from 0 to 255?</p>,
      answer: { kind: "numeric", value: 250 },
    },
    {
      key: "flag",
      rung: "apply",
      prompt: <p>Which 8-bit signed addition overflows?</p>,
      answer: { kind: "choice", options: ["100 + 50", "−100 + 50", "−100 + −20", "127 + −128"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def wrap(x, bits=8):
    x &= (1 << bits) - 1
    return x - (1 << bits) if x >> (bits - 1) else x

print(wrap(127 + 1), wrap(-1) & 0xFF, wrap(200), wrap(-129), hex(wrap(-2, 16) & 0xFFFF))`}</Code>
          <p>Wrapping Python integers to fixed-width two&rsquo;s complement. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-128 255 -56 127 0xfffe", "128 255 -56 127 0xfffe", "-128 -1 -56 127 0xfffe", "-128 255 -56 -129 0xfffe"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import struct

little = struct.pack("<i", 258)
big = struct.pack(">i", 258)
print(list(little), list(big), struct.unpack("<h", bytes([0xFE, 0xFF]))[0], struct.unpack("<H", bytes([0xFE, 0xFF]))[0])`}</Code>
          <p>Byte order with the struct module. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2, 1, 0, 0] [0, 0, 1, 2] -2 65534", "[0, 0, 1, 2] [2, 1, 0, 0] -2 65534", "[2, 1, 0, 0] [0, 0, 1, 2] -257 65534", "[2, 1, 0, 0] [0, 0, 1, 2] -2 65279"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Simulate a w-bit register with Python integers. Write <C>to_signed(pattern, bits)</C> (the two&rsquo;s complement
            value of a pattern from 0 to 2^bits − 1), <C>to_pattern(value, bits)</C> (the pattern of a value, <C>ValueError</C>{" "}
            if it is out of the signed range; also for bad patterns in <C>to_signed</C>), and <C>add(a, b, bits)</C> for signed
            a and b in range, returning <C>(result, carry, overflow)</C>: the wrapped signed result, whether the unsigned
            addition of the patterns carried out of the top bit, and whether the signed result is wrong.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def to_signed(pattern, bits):
    return pattern

def to_pattern(value, bits):
    return abs(value)

def add(a, b, bits):
    return a + b, False, False
`,
        solution: `def to_signed(pattern, bits):
    if not 0 <= pattern < 1 << bits:
        raise ValueError('pattern does not fit')
    return pattern - (1 << bits) if pattern >> (bits - 1) else pattern

def to_pattern(value, bits):
    if not -(1 << (bits - 1)) <= value < 1 << (bits - 1):
        raise ValueError('value out of range')
    return value & ((1 << bits) - 1)

def add(a, b, bits):
    mask = (1 << bits) - 1
    pa, pb = a & mask, b & mask
    total = (pa + pb) & mask
    result = to_signed(total, bits)
    sa, sb, sr = pa >> (bits - 1), pb >> (bits - 1), total >> (bits - 1)
    carry = (pa + pb) >> bits
    overflow = sa == sb and sr != sa
    return result, bool(carry), overflow
`,
        tests: [
          { name: "encodings", code: `assert to_signed(0xFF, 8) == -1 and to_signed(0x80, 8) == -128 and to_signed(0x7F, 8) == 127 and to_signed(0, 8) == 0
assert to_pattern(-1, 8) == 255 and to_pattern(-128, 8) == 128 and to_pattern(5, 4) == 5 and to_pattern(-8, 4) == 8
for bad in [(128, 8), (-129, 8), (8, 4)]:
    try:
        to_pattern(*bad)
        assert False, f'{bad[0]} does not fit in {bad[1]} signed bits: raise ValueError.'
    except ValueError:
        pass
try:
    to_signed(256, 8)
    assert False, '256 is not an 8-bit pattern.'
except ValueError:
    pass
import struct
for bits, fmt in [(8, 'b'), (16, 'h'), (32, 'i')]:
    for v in [-(1 << (bits - 1)), -1, 0, 1, (1 << (bits - 1)) - 1, -12345 % (1 << (bits - 1)) - 7]:
        p = to_pattern(v, bits)
        assert p == int.from_bytes(struct.pack('<' + fmt, v), 'little'), (v, bits)
        assert to_signed(p, bits) == v
for bits in range(1, 10):
    assert sorted(to_signed(p, bits) for p in range(1 << bits)) == list(range(-(1 << (bits - 1)), 1 << (bits - 1)))` },
          { name: "flags", code: `assert add(100, 27, 8) == (127, False, False)
assert add(100, 28, 8) == (-128, False, True), 'Two positives giving a negative: signed overflow.'
assert add(-1, 1, 8) == (0, True, False), 'Carry out of the top bit, but no signed overflow.'
assert add(-128, -1, 8) == (127, True, True)
assert add(-50, -50, 8) == (-100, True, False)
import random
rng = random.Random(1)
for _ in range(2000):
    bits = rng.choice([4, 8, 16, 32])
    lo, hi = -(1 << (bits - 1)), (1 << (bits - 1)) - 1
    a, b = rng.randint(lo, hi), rng.randint(lo, hi)
    r, c, v = add(a, b, bits)
    true = a + b
    assert v == (not lo <= true <= hi), (a, b, bits)
    assert (r - true) % (1 << bits) == 0 and lo <= r <= hi
    assert c == ((a % (1 << bits)) + (b % (1 << bits)) >= 1 << bits)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Bytes and quantisation, with shifts and masks:</p>
          <ul>
            <li>
              <C>to_bytes_le(x, n)</C>: the n bytes of a non-negative x, least significant first, as a list of ints
              (<C>ValueError</C> if it does not fit), and <C>from_bytes_be(bs)</C>: the integer whose big-endian bytes are bs.
              Do not use <C>int.to_bytes</C>, <C>int.from_bytes</C> or struct.
            </li>
            <li>
              <C>quantize_int8(xs)</C>: symmetric int8 quantisation. Return <C>(q, scale)</C> with scale = max |x| / 127 (1.0
              if every x is 0) and q the rounded, clamped integers, so the largest magnitude maps to ±127.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def to_bytes_le(x, n):
    return [x] + [0] * (n - 1)

def from_bytes_be(bs):
    return sum(bs)

def quantize_int8(xs):
    return [int(x) for x in xs], 1.0
`,
        solution: `def to_bytes_le(x, n):
    if not 0 <= x < 1 << (8 * n):
        raise ValueError('does not fit')
    return [(x >> (8 * i)) & 0xFF for i in range(n)]

def from_bytes_be(bs):
    x = 0
    for b in bs:
        x = (x << 8) | b
    return x

def quantize_int8(xs):
    m = max((abs(x) for x in xs), default=0.0)
    scale = m / 127 if m else 1.0
    q = [max(-127, min(127, round(x / scale))) for x in xs]
    return q, scale
`,
        tests: [
          { name: "bytes", code: `assert to_bytes_le(258, 4) == [2, 1, 0, 0] and to_bytes_le(0, 2) == [0, 0] and to_bytes_le(0xDEADBEEF, 4) == [0xEF, 0xBE, 0xAD, 0xDE]
assert from_bytes_be([1, 2]) == 258 and from_bytes_be([]) == 0 and from_bytes_be([0xDE, 0xAD, 0xBE, 0xEF]) == 0xDEADBEEF
try:
    to_bytes_le(256, 1)
    assert False, '256 needs two bytes: raise ValueError.'
except ValueError:
    pass
import random
rng = random.Random(2)
for _ in range(500):
    n = rng.randint(1, 9)
    x = rng.randrange(1 << (8 * n))
    assert to_bytes_le(x, n) == list(x.to_bytes(n, 'little'))
    assert from_bytes_be(list(x.to_bytes(n, 'big'))) == x` },
          { name: "quantisation", code: `import random, math
q, s = quantize_int8([0.5, -1.27, 0.0, 1.0])
assert q == [50, -127, 0, 100] and math.isclose(s, 0.01), (q, s)
q, s = quantize_int8([0.0, 0.0])
assert q == [0, 0], 'All zeros quantise to zeros.'
assert quantize_int8([])[0] == []
rng = random.Random(3)
for _ in range(200):
    xs = [rng.gauss(0, rng.uniform(0.01, 10)) for _ in range(rng.randint(1, 50))]
    q, s = quantize_int8(xs)
    assert all(isinstance(v, int) and -127 <= v <= 127 for v in q)
    assert max(abs(v) for v in q) == 127, 'The largest magnitude maps to 127.'
    assert all(abs(v * s - x) <= s / 2 + 1e-12 for v, x in zip(q, xs)), 'Each value is within half a step.'` },
        ],
      },
    },
    {
      key: "overflow",
      rung: "prove",
      prompt: <p>Prove that a w-bit signed addition overflows exactly when both operands have the same sign and the result&rsquo;s sign differs from theirs.</p>,
      answer: {
        kind: "written",
        rubric: [
          "If the signs differ, the true sum lies between the operands, so it is in range and no overflow occurs.",
          "If both are non-negative and the sum exceeds 2^(w−1) − 1, the stored result is sum − 2^w, which is negative.",
          "If both are negative and the sum is below −2^(w−1), the stored result is sum + 2^w, which is non-negative.",
          "Conversely, if the sum is in range the stored result equals it, so its sign matches the operands'.",
        ],
      },
    },
    {
      key: "signext",
      rung: "stretch",
      prompt: <p>Prove that sign extension preserves the value: if a w-bit pattern represents v in two&rsquo;s complement, copying its top bit into k new high bits gives a (w + k)-bit pattern that also represents v.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Handles a top bit of 0: the new bits are 0 and the value is unchanged.",
          "With top bit 1, writes the new value with weight −2^(w+k−1) on the new top bit and +2^i on the other copied bits.",
          "Sums −2^(w+k−1) + 2^(w+k−2) + … + 2^(w−1) = −2^(w−1), the old top bit's weight.",
          "Concludes the remaining bits contribute the same as before, so the value is v; or argues by induction on k with k = 1.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why adding 1 to 127 in an 8-bit signed integer gives −128, and why the same adding circuit works for signed and unsigned numbers.",

  glimpse: (
    <p>
      Integers are exact but limited in range. Floating point trades exactness for range: next, how 32 bits hold numbers from
      10⁻³⁸ to 10³⁸, and what the hardware does when they are not enough.
    </p>
  ),
};
