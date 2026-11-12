import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FloatBitsViz } from "@/components/viz/FloatBitsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.1.2",
  minutes: 55,
  links: {
    requires: ["e3.1.1"],
    revisits: ["e0.1.2", "e1.5.6"],
    foreshadows: ["m11.1.1", "m11.1.2", "m11.1.4"],
  },

  puzzle: (
    <>
      <p>
        <C>0.1 + 0.2 == 0.3</C> is False in Python. <C>2.0 ** 53 + 1 == 2.0 ** 53</C> is True. Large language models are
        trained in a 16-bit format that cannot tell 256 from 257, and still learn. Every one of these facts follows from how
        64, 32 or 16 bits are split into a sign, an exponent and a fraction. What exactly is stored, and which numbers can it
        hold?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Floating point is scientific notation in base 2: a sign, a fraction with a fixed number of binary digits, and an
        exponent saying where the binary point goes. Because every normal number starts with 1 in binary, that 1 is not
        stored. The exponent gives range; the fraction gives precision. Between consecutive powers of two there are always
        the same number of representable values, so the gaps double each time you cross a power of two: tiny near zero, huge
        near the largest values. Click the bits below and compare formats with different splits.
      </p>
      <FloatBitsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="IEEE 754 binary formats">
        <p>
          A format with e exponent bits and m fraction bits has bias <M>{"B = 2^{e-1} - 1"}</M>. A stored exponent E and fraction
          F mean:
        </p>
        <ul>
          <li>1 ≤ E ≤ <M>{"2^e - 2"}</M> (normal): <M>{"(-1)^s \\, (1 + F/2^m) \\, 2^{E - B}"}</M>;</li>
          <li>E = 0 (subnormal or zero): <M>{"(-1)^s \\, (F/2^m) \\, 2^{1 - B}"}</M>;</li>
          <li>E all ones: ±∞ if F = 0, otherwise NaN.</li>
        </ul>
        <p>
          float64 has (e, m) = (11, 52), float32 (8, 23), float16 (5, 10), bfloat16 (8, 7). Python&rsquo;s float is float64;
          <C>struct.pack(&quot;&lt;f&quot;, x)</C> rounds to float32.
        </p>
      </Definition>

      <Theorem title="spacing and relative error">
        <p>
          Between <M>{"2^k"}</M> and <M>{"2^{k+1}"}</M> the representable numbers are equally spaced, <M>{"2^{k-m}"}</M> apart
          (one <strong>ulp</strong>). Rounding to nearest therefore has relative error at most <M>{"2^{-(m+1)}"}</M>, the unit
          roundoff: about <M>{"1.1 \\times 10^{-16}"}</M> for float64 and <M>{"3.9 \\times 10^{-3}"}</M> for bfloat16.
        </p>
      </Theorem>
      <Proof>
        <p>
          In that range E − B = k is fixed and the value is <M>{"(1 + F/2^m)2^k"}</M> with F an integer from 0 to{" "}
          <M>{"2^m - 1"}</M>, so consecutive values differ by <M>{"2^{k-m}"}</M>. A real x in the range is within half a gap of
          the nearest one, so the error is at most <M>{"2^{k-m-1}"}</M>, and dividing by x ≥ <M>{"2^k"}</M> gives a relative error
          at most <M>{"2^{-m-1}"}</M>. So at <M>{"2^{53}"}</M> in float64 the gap is 2, and adding 1 rounds back (to even).
        </p>
      </Proof>

      <Example title="rounding and special values">
        <p>
          Every operation, +, −, ×, ÷ and square root, must return the exactly rounded true result, by default to the nearest
          representable value with ties to the one whose last bit is 0 (round half to even, which avoids drift). Results too
          large become ±∞; 0/0 and ∞ − ∞ give NaN, which compares unequal to everything, itself included. Subnormals fill
          the gap between the smallest normal number and 0 evenly, so x − y = 0 only when x = y; the smallest float64 is{" "}
          <C>5e-324</C>, and halving it gives 0. A fused multiply-add computes a × b + c with one rounding instead of two,
          which is the core operation of matrix-multiply hardware.
        </p>
      </Example>

      <Example title="bits as integers">
        <p>
          For non-negative floats, the bit patterns read as integers are in the same order as the values, and consecutive
          floats have consecutive patterns: adding 1 to the pattern gives the next float up. That is how{" "}
          <C>math.nextafter</C> works, and why counting ulps between two numbers is a subtraction of integers once negative
          numbers are mapped below zero.
        </p>
      </Example>

      <Remark title="formats for machine learning">
        <p>
          bfloat16 keeps float32&rsquo;s 8 exponent bits and cuts the fraction to 7, so it has the same range (no overflow
          surprises when converting) but only two to three significant digits; converting is just rounding off the low 16
          bits. float16 has more precision but a maximum of 65,504, so training in it needs loss scaling. FP8 formats (E4M3
          for weights and activations, E5M2 for gradients) go further, with a scale factor per tensor or per block. Gradients
          are accumulated and optimiser states kept in float32, because adding many small updates to a large weight in 16 bits
          loses them below half an ulp.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bias",
      rung: "check",
      prompt: <p>What is the exponent bias of float32, with 8 exponent bits?</p>,
      answer: { kind: "numeric", value: 127 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: <p>In bfloat16 (7 fraction bits), what is the gap between consecutive representable numbers between 256 and 512?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "fp16max",
      rung: "apply",
      prompt: <p>Which format can hold 100,000 as a finite number?</p>,
      answer: { kind: "choice", options: ["bfloat16", "float16", "FP8 E4M3", "FP8 E5M2 with no scaling"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import struct

def bits32(x):
    return struct.unpack("<I", struct.pack("<f", x))[0]

def fields(x):
    b = bits32(x)
    return b >> 31, (b >> 23) & 0xFF, b & 0x7FFFFF

print(hex(bits32(1.0)), fields(-2.0), fields(0.75), struct.unpack("<f", struct.pack("<f", 0.1))[0])`}</Code>
          <p>Taking float32 apart. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0x3f800000 (1, 128, 0) (0, 126, 4194304) 0.10000000149011612", "0x3f800000 (1, 129, 0) (0, 126, 4194304) 0.1", "0x3f800000 (1, 128, 0) (0, 127, 4194304) 0.10000000149011612", "0x40000000 (1, 128, 0) (0, 126, 4194304) 0.10000000149011612"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

big = 2.0 ** 53
print(big + 1 == big, big + 2 == big, math.ulp(1.0) == 2.0 ** -52, 0.1 + 0.2 == 0.3,
      math.inf - math.inf == math.inf - math.inf, 5e-324 / 2)`}</Code>
          <p>Edges of float64. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False True False False 0.0", "False False True False False 0.0", "True True True False False 0.0", "True False True False True 5e-324"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>decode_f32(bits)</C>, the float a 32-bit pattern encodes, from the fields alone (no struct): normal
            numbers, subnormals, signed zeros, infinities and NaN. Then write <C>encode_bf16(x)</C>, the 16-bit bfloat16
            pattern of a float32 value: get its float32 bits with struct, then round off the low 16 bits to nearest with ties
            to even, keeping a NaN a NaN.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def decode_f32(bits):
    exp = (bits >> 23) & 0xFF
    frac = bits & 0x7FFFFF
    return (1 + frac / 2 ** 23) * 2.0 ** (exp - 127)

def encode_bf16(x):
    import struct
    return struct.unpack('<I', struct.pack('<f', x))[0] >> 16
`,
        solution: `import math, struct

def decode_f32(bits):
    sign = -1.0 if bits >> 31 else 1.0
    exp = (bits >> 23) & 0xFF
    frac = bits & 0x7FFFFF
    if exp == 0xFF:
        return sign * math.inf if frac == 0 else math.nan
    if exp == 0:
        return sign * frac * 2.0 ** -149            # subnormal: 0.frac × 2^-126
    return sign * (1 + frac / 2 ** 23) * 2.0 ** (exp - 127)

def encode_bf16(x):
    b = struct.unpack('<I', struct.pack('<f', x))[0]
    if (b >> 23) & 0xFF == 0xFF and b & 0x7FFFFF:
        return (b >> 16) | 0x40                     # keep NaN a NaN
    upper, lower = b >> 16, b & 0xFFFF
    if lower > 0x8000 or (lower == 0x8000 and upper & 1):
        upper += 1                                  # round to nearest, ties to even
    return upper & 0xFFFF
`,
        tests: [
          { name: "decode float32", code: `import math, struct, random
assert decode_f32(0x3F800000) == 1.0 and decode_f32(0xC0000000) == -2.0 and decode_f32(0x3F400000) == 0.75
assert decode_f32(0) == 0.0 and math.copysign(1, decode_f32(0x80000000)) == -1, 'Bit 31 makes -0.0.'
assert decode_f32(0x7F800000) == math.inf and decode_f32(0xFF800000) == -math.inf and math.isnan(decode_f32(0x7FC00000))
assert decode_f32(1) == 2.0 ** -149, 'The smallest subnormal is 2**-149.'
assert decode_f32(0x007FFFFF) == (1 - 2 ** -23) * 2.0 ** -126
rng = random.Random(4)
for _ in range(3000):
    b = rng.getrandbits(32)
    want = struct.unpack('<f', struct.pack('<I', b))[0]
    got = decode_f32(b)
    assert (math.isnan(want) and math.isnan(got)) or (got == want and math.copysign(1, got) == math.copysign(1, want)), hex(b)` },
          { name: "round to bfloat16", code: `import struct, random, math
def f32(x):
    return struct.unpack('<I', struct.pack('<f', x))[0]
assert encode_bf16(1.0) == 0x3F80 and encode_bf16(-2.0) == 0xC000 and encode_bf16(0.0) == 0
assert encode_bf16(struct.unpack('<f', struct.pack('<I', 0x3F808000))[0]) == 0x3F80, 'A tie rounds to the even neighbour.'
assert encode_bf16(struct.unpack('<f', struct.pack('<I', 0x3F818000))[0]) == 0x3F82, 'A tie rounds to the even neighbour.'
assert encode_bf16(struct.unpack('<f', struct.pack('<I', 0x3F808001))[0]) == 0x3F81, 'Above half rounds up.'
assert encode_bf16(math.inf) == 0x7F80
assert (encode_bf16(math.nan) >> 7) & 0xFF == 0xFF and encode_bf16(math.nan) & 0x7F, 'NaN must stay NaN.'
rng = random.Random(5)
for _ in range(3000):
    b = rng.getrandbits(32)
    if (b >> 23) & 0xFF == 0xFF:
        continue
    x = struct.unpack('<f', struct.pack('<I', b))[0]
    u = b >> 16
    val = lambda bits: struct.unpack('<f', struct.pack('<I', bits << 16))[0]
    dl, dh = abs(x - val(u)), abs(val(u + 1) - x)
    want = u if dl < dh else u + 1 if dh < dl else (u if u % 2 == 0 else u + 1)
    assert encode_bf16(x) == want, (hex(b), hex(encode_bf16(x)), hex(want))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Work with float64 bit patterns: the starter&rsquo;s <C>_bits(x)</C> and <C>_float(b)</C> convert between a float and
            its 64-bit pattern read as a signed integer, through <C>struct</C>. Write <C>next_up(x)</C>, the smallest float greater than x
            (∞ stays ∞, NaN stays NaN, and both zeros go to 5e-324), without <C>math.nextafter</C>; and{" "}
            <C>ulp_distance(a, b)</C>, how many representable floats you step through from a to b, with +0 and −0 the same
            point and <C>ValueError</C> for NaN.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math, struct

def _bits(x):
    return struct.unpack('<q', struct.pack('<d', x))[0]

def _float(b):
    return struct.unpack('<d', struct.pack('<q', b))[0]

def next_up(x):
    return x + 1e-16

def ulp_distance(a, b):
    return 0
`,
        solution: `import math, struct

def _bits(x):
    return struct.unpack('<q', struct.pack('<d', x))[0]

def _float(b):
    return struct.unpack('<d', struct.pack('<q', b))[0]

def _ordered(x):
    b = _bits(x)                 # map doubles to integers in the same order
    return b if b >= 0 else -(b & 0x7FFFFFFFFFFFFFFF)

def next_up(x):
    if math.isnan(x) or x == math.inf:
        return x
    if x == 0:
        return 5e-324
    b = _bits(x)
    return _float(b + 1) if x > 0 else _float(b - 1)

def ulp_distance(a, b):
    if math.isnan(a) or math.isnan(b):
        raise ValueError('NaN has no position')
    return abs(_ordered(a) - _ordered(b))
`,
        tests: [
          { name: "next up", code: `import math, random, struct
assert next_up(1.0) == 1.0 + 2 ** -52 and next_up(0.0) == 5e-324 and next_up(-0.0) == 5e-324
assert next_up(-5e-324) == 0.0 and next_up(-1.0) == -1.0 + 2 ** -53
assert next_up(math.inf) == math.inf and next_up(-math.inf) == -1.7976931348623157e308 and math.isnan(next_up(math.nan))
assert next_up(1.7976931348623157e308) == math.inf
assert next_up(2.0 ** 53) == 2.0 ** 53 + 2
rng = random.Random(6)
for _ in range(3000):
    x = struct.unpack('<d', struct.pack('<Q', rng.getrandbits(64)))[0]
    if math.isnan(x):
        continue
    assert next_up(x) == math.nextafter(x, math.inf), x` },
          { name: "ulp distance", code: `import math, random
assert ulp_distance(1.0, 1.0) == 0 and ulp_distance(1.0, 1.0 + 2 ** -52) == 1
assert ulp_distance(0.0, -0.0) == 0, '+0 and -0 are the same point.'
assert ulp_distance(-5e-324, 5e-324) == 2 and ulp_distance(5e-324, -5e-324) == 2
assert ulp_distance(1.0, 2.0) == 2 ** 52 and ulp_distance(0.1 + 0.2, 0.3) == 1
assert ulp_distance(-1.0, 1.0) == 2 * ulp_distance(0.0, 1.0)
try:
    ulp_distance(math.nan, 1.0)
    assert False, 'NaN raises ValueError.'
except ValueError:
    pass
rng = random.Random(7)
for _ in range(1000):
    x = rng.uniform(-1e3, 1e3)
    k = rng.randint(0, 20)
    y = x
    for _ in range(k):
        y = math.nextafter(y, math.inf)
    assert ulp_distance(x, y) == k and ulp_distance(y, x) == k, (x, k)` },
        ],
      },
    },
    {
      key: "count",
      rung: "prove",
      prompt: <p>Prove that a format with e exponent bits and m fraction bits has exactly <M>{"2^m"}</M> representable numbers in [2^k, 2^(k+1)) for each normal exponent k, and use it to count the positive normal float16 values.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Fixing the stored exponent fixes k, and the 2^m fraction values give 2^m distinct numbers (1 + F/2^m)2^k in [2^k, 2^(k+1)).",
          "Different stored exponents give disjoint ranges, so nothing else lands there.",
          "float16 has stored exponents 1 to 30, so 30 normal binades.",
          "Positive normal float16 values: 30 × 2^10 = 30,720.",
        ],
      },
    },
    {
      key: "swamp",
      rung: "stretch",
      prompt: <p>A weight of 1.0 stored in bfloat16 receives 1,000 updates of +0.001 each. Show that adding them one by one in bfloat16 leaves the weight at 1.0, while accumulating in float32 does not, and explain why mixed-precision training keeps a float32 copy of the weights.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Finds the bfloat16 gap just above 1.0 is 2^−7 = 0.0078125.",
          "Notes 0.001 is less than half that gap, so 1.0 + 0.001 rounds back to 1.0 every time.",
          "In float32 the gap is 2^−23, so the updates accumulate to about 1.001 (within rounding).",
          "Concludes that a float32 master copy (or float32 accumulator) is needed so small updates are not lost, then cast to 16 bits for compute.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why 0.1 + 0.2 is not exactly 0.3 in a computer, and why a model can still be trained in a 16-bit format.",

  glimpse: (
    <p>
      Both integers and floats are bit patterns. Next, operating on the bits directly: masks, shifts and tricks that pack
      flags into one word, count bits in a few instructions and power hash tables and Bloom filters.
    </p>
  ),
};
