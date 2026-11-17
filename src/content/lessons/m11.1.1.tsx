import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MinifloatLineViz } from "@/components/viz/MinifloatLineViz";
import type { LessonContent } from "@/lib/types";

const FD = `import struct

def fields(x):
    b = struct.unpack('>Q', struct.pack('>d', x))[0]
    return b >> 63, (b >> 52) & 0x7FF, b & ((1 << 52) - 1)

def classify(x):
    s, e, f = fields(x)
    if e == 0x7FF:
        return 'nan' if f else 'inf'
    if e == 0:
        return 'subnormal' if f else 'zero'
    return 'normal'

def value(s, e, f):
    if e == 0:
        return (-1) ** s * f / 2 ** 52 * 2.0 ** -1022
    return (-1) ** s * (1 + f / 2 ** 52) * 2.0 ** (e - 1023)`;

const MF = `import bisect

def minifloat_values(ebits, mbits):
    bias = 2 ** (ebits - 1) - 1
    vals = set()
    for e in range(2 ** ebits - 1):
        for m in range(2 ** mbits):
            if e == 0:
                vals.add(m / 2 ** mbits * 2.0 ** (1 - bias))
            else:
                vals.add((1 + m / 2 ** mbits) * 2.0 ** (e - bias))
    return sorted(vals)

def round_nearest(vals, x):
    i = bisect.bisect_left(vals, x)
    if i == len(vals):
        return float('inf')
    if i == 0 or vals[i] == x:
        return vals[i]
    lo, hi = vals[i - 1], vals[i]
    if x - lo < hi - x or (x - lo == hi - x and (i - 1) % 2 == 0):
        return lo
    return hi`;

export const lesson: LessonContent = {
  id: "m11.1.1",
  minutes: 45,
  links: {
    requires: ["e3.1.2"],
    revisits: ["e3.1.1"],
    foreshadows: ["m11.1.2", "m11.1.4"],
  },

  puzzle: (
    <>
      <p>
        Python says <C>0.0 == -0.0</C>, yet <C>1 / 0.0</C> and <C>1 / -0.0</C> in NumPy give opposite infinities. The
        smallest positive double is about 4.9 × 10⁻³²⁴, far below the smallest number with a full 53 bits of precision. And a
        NaN is not equal even to itself. These are not accidents of Python; they are written into the IEEE 754 standard. What
        exactly does the standard promise, and why did its designers want zeros with signs and numbers with missing bits?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        IEEE 754 is a contract with two halves. The first fixes the encoding: which bit patterns mean which numbers, and
        which are reserved for infinities and NaN. The second fixes the arithmetic: every basic operation must return the
        exact result, rounded to a representable value as if computed with infinite precision. The special values make
        every operation total, so a computation never traps halfway; the subnormals make underflow gradual, so that two
        different numbers never have a difference of exactly zero.
      </p>
      <MinifloatLineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="binary floating-point formats">
        <p>
          A binary format with w exponent bits and p fraction bits stores a sign s, a biased exponent e (an unsigned integer
          of w bits) and a fraction f (an integer of p bits). With bias <M>{"b = 2^{w-1} - 1"}</M>:
        </p>
        <MD>{"\\text{value} = \\begin{cases} (-1)^s(1 + f/2^p)\\,2^{e-b} & 1 \\leq e \\leq 2^w - 2 \\text{ (normal)} \\\\ (-1)^s(f/2^p)\\,2^{1-b} & e = 0 \\text{ (subnormal, or } \\pm 0 \\text{ if } f = 0) \\\\ \\pm\\infty \\text{ if } f = 0,\\ \\text{NaN otherwise} & e = 2^w - 1. \\end{cases}"}</MD>
        <p>
          Double precision (binary64) has w = 11, p = 52, b = 1023; single precision (binary32) has w = 8, p = 23, b = 127;
          half precision (binary16) has w = 5, p = 10, b = 15. The precision is p + 1 significant bits, counting the hidden
          leading 1.
        </p>
      </Definition>

      <Theorem title="correct rounding">
        <p>
          For +, −, ×, ÷ and √ on floating-point inputs, IEEE 754 requires the result to be fl(exact result): the exact real
          answer rounded by the active rounding mode, by default to the nearest representable value with ties going to the
          one whose last fraction bit is 0. Overflow gives ±∞; invalid operations such as 0/0, ∞ − ∞ and √(−1) give NaN, and
          every comparison involving NaN is false except ≠.
        </p>
      </Theorem>

      <Theorem title="gradual underflow">
        <p>
          With subnormals, for finite floats x ≠ y, the computed difference fl(x − y) is never 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every finite float is an integer multiple of the smallest positive subnormal{" "}
          <M>{"\\sigma = 2^{1 - b - p}"}</M>: normals because <M>{"e - b \\geq 1 - b"}</M>, subnormals by definition. So x − y
          is a nonzero integer multiple of σ, and <M>{"|x - y| \\geq \\sigma"}</M>. Rounding is monotone and σ is
          representable, so <M>{"|\\mathrm{fl}(x - y)| \\geq \\sigma > 0"}</M>. If subnormals were flushed to zero, a difference
          smaller than the smallest normal would become 0, and code such as{" "}
          <C>if x != y: z = 1 / (x - y)</C> could divide by zero.
        </p>
        <Code>{FD}</Code>
      </Proof>

      <Remark title="signed zero and the toy format">
        <p>
          Signed zeros record the direction from which a result underflowed or the sign of an infinite reciprocal:{" "}
          <M>{"1/(+0) = +\\infty"}</M>, <M>{"1/(-0) = -\\infty"}</M>, yet +0 = −0 compares equal, which is why the code
          inspects the sign bit directly. In the toy format with 3 exponent bits and 2 fraction bits (bias 3), there are 28
          nonnegative finite values from 0 to 14, spaced 1/16 near zero and 2 near the top. Rounding to nearest sends 2.6 to
          2.5; the ties 2.75 and 3.25 both go to 3, whose last fraction bit is 0; and 100 overflows. (Strictly, IEEE rounds
          values just above the largest finite number back down to it until halfway to the next power; the code simplifies
          this.) Subnormals cost hardware: many accelerators flush them to zero for speed.
        </p>
        <Code>{MF}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "exp",
      rung: "check",
      prompt: <p>What is the biased exponent field e of the double-precision number 8.0?</p>,
      answer: { kind: "numeric", value: 1026, tolerance: 0.5 },
    },
    {
      key: "normals",
      rung: "check",
      prompt: <p>In the toy format with 3 exponent bits and 2 fraction bits, how many positive normal values are there?</p>,
      answer: { kind: "numeric", value: 24, tolerance: 0.5 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What do subnormal numbers guarantee that flush-to-zero arithmetic does not?</p>,
      answer: {
        kind: "choice",
        options: [
          "For finite floats, x − y computes to 0 only when x = y",
          "Every real number between 0 and the smallest normal is represented exactly",
          "Relative precision is the same for tiny numbers as for normal ones",
          "Overflow can never occur",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import struct

def fields(x):
    b = struct.unpack('>Q', struct.pack('>d', x))[0]
    return b >> 63, (b >> 52) & 0x7FF, b & ((1 << 52) - 1)

def classify(x):
    s, e, f = fields(x)
    if e == 0x7FF:
        return 'nan' if f else 'inf'
    if e == 0:
        return 'subnormal' if f else 'zero'
    return 'normal'

def value(s, e, f):
    if e == 0:
        return (-1) ** s * f / 2 ** 52 * 2.0 ** -1022
    return (-1) ** s * (1 + f / 2 ** 52) * 2.0 ** (e - 1023)

print(fields(1.0), fields(-2.5), classify(5e-324), classify(float('inf')), classify(-0.0))
print(value(*fields(0.1)) == 0.1, fields(5e-324), value(0, 0, 1) == 5e-324, 0.0 == -0.0, fields(-0.0)[0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(0, 1023, 0) (1, 1024, 1125899906842624) subnormal inf zero\nTrue (0, 0, 1) True True 1", "(0, 1023, 0) (1, 1024, 1125899906842624) subnormal inf zero\nTrue (0, 0, 1) True False 1", "(0, 1023, 0) (1, 1025, 1125899906842624) normal inf zero\nTrue (0, 0, 1) True True 1", "(0, 1024, 0) (1, 1024, 1125899906842624) subnormal inf zero\nTrue (0, 0, 1) True True 0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import bisect

def minifloat_values(ebits, mbits):
    bias = 2 ** (ebits - 1) - 1
    vals = set()
    for e in range(2 ** ebits - 1):
        for m in range(2 ** mbits):
            if e == 0:
                vals.add(m / 2 ** mbits * 2.0 ** (1 - bias))
            else:
                vals.add((1 + m / 2 ** mbits) * 2.0 ** (e - bias))
    return sorted(vals)

def round_nearest(vals, x):
    i = bisect.bisect_left(vals, x)
    if i == len(vals):
        return float('inf')
    if i == 0 or vals[i] == x:
        return vals[i]
    lo, hi = vals[i - 1], vals[i]
    if x - lo < hi - x or (x - lo == hi - x and (i - 1) % 2 == 0):
        return lo
    return hi

v = minifloat_values(3, 2)
print(len(v), v[:6], v[-1])
print(round_nearest(v, 2.6), round_nearest(v, 2.75), round_nearest(v, 3.25), round_nearest(v, 100.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["28 [0.0, 0.0625, 0.125, 0.1875, 0.25, 0.3125] 14.0\n2.5 3.0 3.0 inf", "28 [0.0, 0.0625, 0.125, 0.1875, 0.25, 0.3125] 14.0\n2.5 2.5 3.5 inf", "32 [0.0, 0.0625, 0.125, 0.1875, 0.25, 0.3125] 16.0\n2.5 3.0 3.0 inf", "25 [0.0, 0.25, 0.3125, 0.375, 0.4375, 0.5] 14.0\n2.5 3.0 3.0 inf"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fields(x)</C>, returning (sign, biased exponent, fraction) of a double, <C>classify(x)</C>, returning one
          of &apos;zero&apos;, &apos;subnormal&apos;, &apos;normal&apos;, &apos;inf&apos;, &apos;nan&apos;, and{" "}
          <C>value(s, e, f)</C>, which rebuilds a finite double from its fields.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import struct

def fields(x):
    return 0, 0, 0

def classify(x):
    return 'normal'

def value(s, e, f):
    return 0.0
`,
        solution: FD,
        tests: [
          { name: "fields", code: `assert fields(8.0) == (0, 1026, 0) and fields(-0.0) == (1, 0, 0) and fields(0.75) == (0, 1022, 1 << 51)
assert [classify(v) for v in [0.0, 1e-310, 3.0, float('-inf'), float('nan')]] == ['zero', 'subnormal', 'normal', 'inf', 'nan']` },
          { name: "value", code: `import random
random.seed(0)
for _ in range(200):
    x = random.uniform(-1e6, 1e6) * 10.0 ** random.randint(-300, 300)
    assert value(*fields(x)) == x
assert value(*fields(2.5e-320)) == 2.5e-320` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>minifloat_values(ebits, mbits)</C>, the sorted nonnegative finite values of a toy IEEE format with
          subnormals, and <C>round_nearest(vals, x)</C> for x ≥ 0, rounding to nearest with ties to even (in this list,
          values with an even fraction field sit at even indices) and returning inf beyond the largest value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import bisect

def minifloat_values(ebits, mbits):
    return [0.0]

def round_nearest(vals, x):
    return 0.0
`,
        solution: MF,
        tests: [
          { name: "vals", code: `v = minifloat_values(4, 3)
assert len(v) == 120 and v[1] == 2.0 ** -9 and v[-1] == 240.0 and v[8] == 2.0 ** -6` },
          { name: "round", code: `v = minifloat_values(3, 2)
assert [round_nearest(v, x) for x in [0.03125, 0.09375, 1.125, 1.375, 6.0, 13.0, 15.0]] == [0.0, 0.125, 1.0, 1.5, 6.0, 12.0, float('inf')]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          In a binary IEEE format with subnormals and round-to-nearest, prove that if x and y are finite floats with x ≠ y,
          then the computed difference fl(x − y) is not zero.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Observes that every finite float, normal or subnormal, is an integer multiple of the smallest positive subnormal σ.",
          "Concludes that x − y is a nonzero multiple of σ, so |x − y| ≥ σ.",
          "Uses monotonicity of rounding and the representability of σ to get |fl(x − y)| ≥ σ > 0.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: <p>In the toy format with 3 exponent bits and 2 fraction bits, how many distinct finite real values are there, counting +0 and −0 as one value?</p>,
      answer: { kind: "numeric", value: 55, tolerance: 0.5 },
    },
  ],

  teachBack:
    "Explain to a friend how IEEE 754 encodes normal numbers, subnormals, zeros, infinities and NaN, what correct rounding promises about every basic operation, and why gradual underflow and signed zeros are worth their cost.",

  glimpse: (
    <>
      <p>
        Correct rounding makes every basic operation exact up to one rounding. The next lesson quantifies that rounding:
        machine epsilon, the unit roundoff, and the model fl(x op y) = (x op y)(1 + δ) that all error analysis rests on.
      </p>
    </>
  ),
};
