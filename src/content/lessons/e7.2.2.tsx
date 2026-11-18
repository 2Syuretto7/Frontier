import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SimdSplitViz } from "@/components/viz/SimdSplitViz";
import type { LessonContent } from "@/lib/types";

const LANES = `def simd_sum(xs, width):
    acc = [0.0] * width
    for i in range(0, len(xs) - len(xs) % width, width):
        for lane in range(width):
            acc[lane] += xs[i + lane]
    total = 0.0
    for lane in range(width):
        total += acc[lane]
    for x in xs[len(xs) - len(xs) % width:]:
        total += x
    return total

def select(mask, a, b):
    return [x if m else y for m, x, y in zip(mask, a, b)]

def relu_branchless(xs):
    return select([x > 0 for x in xs], xs, [0.0] * len(xs))`;

const LAYOUT = `def split_loop(n, width, offset):
    pro = min((-offset) % width, n)
    body = (n - pro) // width
    return pro, body, n - pro - body * width

def lines_touched(start, stride, count, line=64):
    return len({(start + i * stride) // line for i in range(count)})

def aos_to_soa(records):
    return tuple(list(col) for col in zip(*records))`;

export const lesson: LessonContent = {
  id: "e7.2.2",
  minutes: 50,
  links: {
    requires: ["e7.2.1"],
    revisits: ["e1.5.2", "e3.1.2"],
    foreshadows: ["e7.2.3", "e7.3.1"],
  },

  puzzle: (
    <>
      <p>
        You compile a loop that adds two arrays of floats and get a sixteen-fold speed-up from one compiler flag. You
        compile a loop that sums one array of floats with the same flag and get nothing, unless you also allow the compiler
        to &ldquo;break the rules of arithmetic&rdquo;. What rules, and why would the compiler need to break them to go
        faster?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A SIMD instruction (single instruction, multiple data) works on a register that holds several numbers, called
        lanes, and does the same thing to every lane at once: one instruction adds eight pairs of floats. Adding two arrays
        fits this perfectly. Summing one array does not, until you keep eight partial sums, one per lane, and add them
        together at the end. That changes the order of the additions, and with floating point the order changes the answer.
        The edges of a loop also cost something: elements before the first aligned address and after the last full vector
        are handled one at a time.
      </p>
      <SimdSplitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="SIMD registers and lanes">
        <p>
          A <em>vector register</em> of b bits holds <M>{"w = b / e"}</M> elements of e bits each, its <em>lanes</em>. A
          vector instruction applies one operation lane by lane: AVX2 registers have 256 bits, so 8 float32 lanes; AVX-512
          and Arm SVE can have 512 bits, so 16 float32 or 32 bfloat16 lanes. Loads and stores are fastest when the address
          is a multiple of the register size, so a vectorised loop is split into a scalar <em>prologue</em> up to the first
          aligned element, a <em>body</em> of full vectors, and a scalar <em>epilogue</em> for what is left.
        </p>
      </Definition>

      <Theorem title="instruction count of a split loop">
        <p>
          For n elements, w lanes and a start that is <M>{"o"}</M> elements past an aligned address, the prologue has{" "}
          <M>{"p = \\min((-o) \\bmod w,\\ n)"}</M> elements, the body has <M>{"\\lfloor (n - p)/w \\rfloor"}</M> vectors and
          the epilogue the remaining <M>{"(n - p) \\bmod w"}</M> elements. The number of instructions is at least n/w, and
          the speed-up over a scalar loop tends to w as n grows.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first aligned element is the smallest index i ≥ 0 with <M>{"o + i \\equiv 0 \\pmod w"}</M>, which is{" "}
          <M>{"(-o) \\bmod w"}</M>, or all n if the array ends first. The remaining <M>{"n - p"}</M> elements start aligned and
          fill <M>{"\\lfloor (n-p)/w \\rfloor"}</M> vectors with a remainder. Each instruction handles at most w elements, so
          there are at least n/w of them. The prologue and epilogue together have fewer than 2w elements, so the count is
          below <M>{"n/w + 2w"}</M>, and n divided by it tends to w.
        </p>
        <Code>{LAYOUT}</Code>
      </Proof>

      <Theorem title="lane-wise summation changes the order">
        <p>
          Summing with w lane accumulators computes{" "}
          <MD>{"\\sum_{\\ell=0}^{w-1} \\Bigl(\\sum_{j} x_{jw + \\ell}\\Bigr)"}</MD>
          which equals the sequential sum in exact arithmetic but in general not in floating point, because floating-point
          addition is not associative.
        </p>
      </Theorem>
      <Proof>
        <p>
          Real addition is associative and commutative, so any grouping gives the same exact sum. For floating point, a
          single counterexample suffices: with <M>{"x = (10^{16}, 1, -10^{16}, 1)"}</M>, the sequential sum rounds{" "}
          <M>{"10^{16} + 1"}</M> back to <M>{"10^{16}"}</M> (the spacing of doubles there is 2, and the tie goes to the even
          neighbour) and returns 1, while two lanes compute <M>{"(10^{16} - 10^{16}) + (1 + 1) = 2"}</M>, which is exact. This
          is why a compiler may vectorise an elementwise add freely but needs permission, such as{" "}
          <C>-ffast-math</C> or <C>-fassociative-math</C>, to vectorise a floating-point reduction. The lane-wise order is not
          worse: each element passes through about n/w + w additions instead of up to n, so its worst-case error bound is
          smaller.
        </p>
        <Code>{LANES}</Code>
      </Proof>

      <Example title="branches become masks">
        <p>
          Lanes cannot take different branches. Instead, a vector compare produces a mask, both sides are computed, and a
          blend picks lane by lane, as <C>select</C> does. <C>relu_branchless</C> computes <C>x &gt; 0</C> for every lane and
          blends x with zero. When the two sides are cheap this is faster than a branch even on scalar code, because there is
          nothing to mispredict; when one side is expensive and rarely needed, the mask wastes that work in every lane.
        </p>
      </Example>

      <Remark title="layout: arrays of structures and structures of arrays">
        <p>
          A vector load reads w consecutive elements. If particles are stored as records <C>(x, y, z)</C>, an array of
          structures, then the x coordinates are 12 bytes apart: sixteen of them span 3 cache lines instead of 1 (see{" "}
          <C>lines_touched</C>), and the processor needs slow gather instructions to collect them into one register. Storing
          one array per field, a structure of arrays, makes every field contiguous. This is the layout NumPy and every tensor
          library use, and the reason that a column of a table is fast to reduce and a row of objects is not.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lanes",
      rung: "check",
      prompt: <p>How many 16-bit bfloat16 values fit in one 512-bit vector register?</p>,
      answer: { kind: "numeric", value: 32, tolerance: 0 },
    },
    {
      key: "split",
      rung: "check",
      prompt: <p>A loop over 1000 float32 elements uses 16 lanes, and the array starts 5 elements past an aligned address. How many instructions, prologue, vectors and epilogue together, does it execute?</p>,
      answer: { kind: "numeric", value: 85, tolerance: 0 },
    },
    {
      key: "fastmath",
      rung: "apply",
      prompt: <p>Why does a compiler vectorise <C>c[i] = a[i] + b[i]</C> but not <C>s += a[i]</C> for floats, unless told it may reassociate?</p>,
      answer: {
        kind: "choice",
        options: [
          "Vectorising the sum needs several partial sums, which changes the order of floating-point additions and can change the result",
          "Vector registers cannot hold a single number",
          "Sums of floats cannot be computed by vector instructions at all",
          "The sum has fewer memory accesses, so vectorising it gives no benefit",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def simd_sum(xs, width):
    acc = [0.0] * width
    for i in range(0, len(xs) - len(xs) % width, width):
        for lane in range(width):
            acc[lane] += xs[i + lane]
    total = 0.0
    for lane in range(width):
        total += acc[lane]
    for x in xs[len(xs) - len(xs) % width:]:
        total += x
    return total

def select(mask, a, b):
    return [x if m else y for m, x, y in zip(mask, a, b)]

def relu_branchless(xs):
    return select([x > 0 for x in xs], xs, [0.0] * len(xs))

xs = [1e16, 1.0, -1e16, 1.0]; print(simd_sum(xs, 1), simd_sum(xs, 2), simd_sum(xs, 4))
print(simd_sum([1, 2, 3, 4, 5, 6, 7], 4), relu_branchless([-1.5, 2.0, 0.0, 3.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 2.0 1.0\n28.0 [0.0, 2.0, 0.0, 3.0]",
          "2.0 2.0 2.0\n28.0 [0.0, 2.0, 0.0, 3.0]",
          "1.0 1.0 1.0\n28.0 [0.0, 2.0, 0.0, 3.0]",
          "1.0 2.0 1.0\n28.0 [-1.5, 2.0, 0.0, 3.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def split_loop(n, width, offset):
    pro = min((-offset) % width, n)
    body = (n - pro) // width
    return pro, body, n - pro - body * width

def lines_touched(start, stride, count, line=64):
    return len({(start + i * stride) // line for i in range(count)})

def aos_to_soa(records):
    return tuple(list(col) for col in zip(*records))

print(split_loop(100, 8, 3), split_loop(5, 8, 1), split_loop(16, 4, 0))
print(lines_touched(0, 4, 16), lines_touched(0, 12, 16), lines_touched(60, 4, 2), aos_to_soa([(1, 2), (3, 4), (5, 6)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(5, 11, 7) (5, 0, 0) (0, 4, 0)\n1 3 2 ([1, 3, 5], [2, 4, 6])",
          "(3, 12, 1) (5, 0, 0) (0, 4, 0)\n1 3 2 ([1, 3, 5], [2, 4, 6])",
          "(5, 11, 7) (7, 0, 0) (0, 4, 0)\n1 3 2 ([1, 3, 5], [2, 4, 6])",
          "(5, 11, 7) (5, 0, 0) (0, 4, 0)\n1 3 1 ([1, 3, 5], [2, 4, 6])",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>simd_sum(xs, width)</C>, which adds full groups of width elements into width lane accumulators, then
          adds the lanes in order 0 to width − 1 starting from 0.0, then adds the leftover elements one by one;{" "}
          <C>select(mask, a, b)</C>, taking a where the mask is true and b elsewhere; and <C>relu_branchless(xs)</C>, built
          from <C>select</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def simd_sum(xs, width):
    total = 0.0
    for x in xs:
        total += x
    return total

def select(mask, a, b):
    return list(a)

def relu_branchless(xs):
    return list(xs)
`,
        solution: LANES,
        tests: [
          { name: "lanes", code: `xs = [1e16, 1.0, -1e16, 1.0]
assert simd_sum(xs, 1) == 1.0 and simd_sum(xs, 2) == 2.0 and simd_sum(xs, 4) == 1.0, 'Lane accumulators change the order of additions.'
assert simd_sum([1, 2, 3, 4, 5, 6, 7], 4) == 28.0 and simd_sum([], 8) == 0.0 and simd_sum([2.5], 8) == 2.5
ys = [1e16, 1.0, 1.0, 1.0, -1e16, 1.0, 1.0, 1.0]
assert simd_sum(ys, 4) == 6.0 and simd_sum(ys, 1) == 3.0, (simd_sum(ys, 4), simd_sum(ys, 1))` },
          { name: "masks", code: `assert select([True, False, True], [1, 2, 3], [9, 8, 7]) == [1, 8, 3]
assert relu_branchless([-1.5, 2.0, 0.0, 3.0]) == [0.0, 2.0, 0.0, 3.0] and relu_branchless([]) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>split_loop(n, width, offset)</C>, returning the (prologue, vectors, epilogue) counts;{" "}
          <C>lines_touched(start, stride, count, line=64)</C>, the number of distinct cache lines hit by count accesses at
          byte addresses start, start + stride, and so on; and <C>aos_to_soa(records)</C>, turning a list of equal-length
          tuples into a tuple of lists, one per field.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def split_loop(n, width, offset):
    return 0, n // width, n % width

def lines_touched(start, stride, count, line=64):
    return count

def aos_to_soa(records):
    return tuple(records)
`,
        solution: LAYOUT,
        tests: [
          { name: "split", code: `assert split_loop(100, 8, 3) == (5, 11, 7) and split_loop(5, 8, 1) == (5, 0, 0) and split_loop(16, 4, 0) == (0, 4, 0)
assert split_loop(1000, 16, 5) == (11, 61, 13) and split_loop(0, 8, 3) == (0, 0, 0) and split_loop(20, 4, 9) == (3, 4, 1)` },
          { name: "layout", code: `assert lines_touched(0, 4, 16) == 1 and lines_touched(0, 12, 16) == 3 and lines_touched(60, 4, 2) == 2 and lines_touched(0, 64, 5) == 5
assert aos_to_soa([(1, 2), (3, 4), (5, 6)]) == ([1, 3, 5], [2, 4, 6])
assert aos_to_soa([(1, 'a', 2.0)]) == ([1], ['a'], [2.0])` },
        ],
      },
    },
    {
      key: "smallest",
      rung: "stretch",
      prompt: (
        <p>
          With 16 lanes and an array that starts 1 element past an aligned address, what is the smallest n for which the
          split loop needs at most n/12 instructions, that is, gives a speed-up of at least 12 over a scalar loop?
        </p>
      ),
      answer: { kind: "numeric", value: 687, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Vectors make arithmetic cheap, which shifts the bottleneck to feeding them. The next lesson returns to caches with
        that in mind: lines, associativity, and how to arrange loops so that every byte fetched is used.
      </p>
    </>
  ),
};
