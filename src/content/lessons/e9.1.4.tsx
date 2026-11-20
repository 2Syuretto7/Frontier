import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShuffleReduceViz } from "@/components/viz/ShuffleReduceViz";
import type { LessonContent } from "@/lib/types";

const WARP = `def shfl_down(vals, offset):
    return [vals[i + offset] if i + offset < len(vals) else vals[i] for i in range(len(vals))]

def warp_reduce(vals):
    off = len(vals) // 2
    while off:
        vals = [a + b for a, b in zip(vals, shfl_down(vals, off))]
        off //= 2
    return vals[0]

def shfl_xor(vals, mask):
    return [vals[i ^ mask] for i in range(len(vals))]`;

const ORDER = `import struct

def f32(x):
    return struct.unpack("f", struct.pack("f", x))[0]

def seq_sum32(xs):
    s = 0.0
    for x in xs:
        s = f32(s + x)
    return s

def tree_sum32(xs):
    xs = [f32(x) for x in xs]
    while len(xs) > 1:
        if len(xs) % 2:
            xs.append(0.0)
        h = len(xs) // 2
        xs = [f32(xs[i] + xs[i + h]) for i in range(h)]
    return xs[0] if xs else 0.0`;

const TREE = `// shared-memory tree with sequential addressing: active threads stay contiguous
__global__ void block_sum_smem(const float* x, float* partial, int n) {
    __shared__ float s[256];                       // blockDim.x == 256
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    s[threadIdx.x] = i < n ? x[i] : 0.0f;
    __syncthreads();
    for (int h = blockDim.x / 2; h > 0; h /= 2) {
        if (threadIdx.x < h) s[threadIdx.x] += s[threadIdx.x + h];
        __syncthreads();
    }
    if (threadIdx.x == 0) partial[blockIdx.x] = s[0];
}`;

const SHFL = `__device__ float warp_sum(float v) {
    for (int off = 16; off > 0; off /= 2)
        v += __shfl_down_sync(0xffffffff, v, off);   // read v from lane + off
    return v;                                         // the total is in lane 0
}

__global__ void sum(const float* x, float* out, int n) {
    __shared__ float warp_totals[32];
    float v = 0.0f;
    for (int i = blockIdx.x * blockDim.x + threadIdx.x; i < n; i += gridDim.x * blockDim.x)
        v += x[i];                                    // grid-stride: many elements per thread
    v = warp_sum(v);
    int lane = threadIdx.x % 32, w = threadIdx.x / 32;
    if (lane == 0) warp_totals[w] = v;
    __syncthreads();
    if (w == 0) {
        v = lane < blockDim.x / 32 ? warp_totals[lane] : 0.0f;
        v = warp_sum(v);
        if (lane == 0) atomicAdd(out, v);             // one atomic per block
    }
}`;

export const lesson: LessonContent = {
  id: "e9.1.4",
  minutes: 55,
  links: {
    requires: ["e9.1.3"],
    revisits: ["e5.4.2", "e7.3.1"],
    foreshadows: ["e9.3.2", "e9.4.1"],
  },

  puzzle: (
    <>
      <p>
        You need the sum of a billion floats on a GPU. One thread looping over all of them wastes the machine. One thread per element,
        each adding into a single global total with an atomic operation, is also slow, and it returns a slightly different answer on
        every run. Why do both fail, and what structure gives a fast sum that you can also make reproducible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A reduction combines many values into one, so threads must eventually cooperate. The trick is to cooperate in a tree: pairs
        combine, then pairs of pairs, so n values need only <M>{"\\log_2 n"}</M> rounds. Within a warp the 32 lanes can pass values
        directly between registers with shuffle instructions; within a block, warps meet through shared memory; and across blocks, each
        block contributes one partial sum. Each level of the hierarchy uses the cheapest means of communication it has.
      </p>
      <ShuffleReduceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a tree in shared memory">
        <p>
          The classic block reduction loads one value per thread into shared memory and halves the number of active threads each round.
          With sequential addressing, thread t adds s[t + h] into s[t] for t &lt; h, so the active threads are always a prefix and whole
          warps retire together. The older interleaved version, in which thread t is active when t is divisible by 2h, leaves a few active
          threads in every warp: the work shrinks but the number of warps executing does not. Each round needs a barrier.
        </p>
        <Code>{TREE}</Code>
      </Definition>

      <Definition title="warp shuffles">
        <p>
          <C>__shfl_down_sync(mask, v, off)</C> returns the value of v held by the lane off positions higher, or the caller&apos;s own value
          if there is no such lane (<C>shfl_down</C>); <C>__shfl_xor_sync(mask, v, m)</C> returns the value from lane i XOR m
          (<C>shfl_xor</C>). The mask names the lanes taking part, all 32 here. Shuffles move data between registers without shared
          memory and without a barrier, since the lanes of a warp exchange values as one instruction. Five shuffle-and-add rounds sum a
          warp (<C>warp_reduce</C>).
        </p>
        <Code>{WARP}</Code>
      </Definition>

      <Theorem title="the shuffle-down reduction is correct">
        <p>
          Let 32 lanes hold <M>{"v_0, \\dots, v_{31}"}</M> and perform v += shfl_down(v, o) for o = 16, 8, 4, 2, 1. After the round with
          offset o, every lane i &lt; o holds <M>{"\\sum_{j \\equiv i \\ (\\mathrm{mod}\\ o)} v_j"}</M>. In particular lane 0 finally holds
          the sum of all 32 values, each counted once.
        </p>
      </Theorem>
      <Proof>
        <p>
          Before the first round, write the state as offset 32: lane i &lt; 32 holds the sum over j &#8801; i (mod 32), which is just{" "}
          <M>{"v_i"}</M>. Suppose before the round with offset o every lane i &lt; 2o holds the sum over j &#8801; i (mod 2o). In the round,
          lane i &lt; o adds the value of lane i + o, which is below 2o, so it now holds the sum over j &#8801; i (mod 2o) plus the sum over
          j &#8801; i + o (mod 2o). These two residue classes partition the class of i modulo o, giving the claim. Lanes at or above o may
          receive their own value and double it, but no later round reads them: the round with offset o/2 reads only lanes below o.
          With o = 1, lane 0 holds the sum over all j.
        </p>
      </Proof>

      <Definition title="the whole hierarchy">
        <p>
          A fast sum combines the levels. Each thread first accumulates many elements in a grid-stride loop, which keeps the memory system
          busy and makes the tree small. Each warp reduces with shuffles, lane 0 of each warp writes to shared memory, and after one
          barrier the first warp reduces the warp totals. Finally each block adds its total to the result with one atomic operation, or
          writes it to an array of partials that a second, small kernel sums.
        </p>
        <Code>{SHFL}</Code>
      </Definition>

      <Remark title="order, rounding and reproducibility">
        <p>
          Floating-point addition is not associative (e5.4.2), so every way of grouping a sum is a different computation. A tree rounds a
          value about <M>{"\\log_2 n"}</M> times on its way to the total, a sequential loop up to n times, so trees are usually more
          accurate. The order in which atomics from different blocks arrive varies from run to run, which makes the last bits vary too.
          The two-pass version with a fixed tree is deterministic, and some training code requires it so that reruns match bit for bit.
          The Python below rounds to 32 bits after every addition to show the effect (<C>f32</C>, <C>seq_sum32</C>,{" "}
          <C>tree_sum32</C>).
        </p>
        <Code>{ORDER}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A single thread uses one of tens of thousands of lanes. A billion atomics on one address are serialised by the memory system, and
          they land in a different order each run, so the rounding differs. The hierarchy does almost all of the work in registers: a
          grid-stride loop per thread, five shuffle rounds per warp, one barrier per block, and one atomic or one partial per block. For a
          reproducible result, write partials and sum them in a fixed tree.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "warps",
      rung: "check",
      prompt: (
        <p>
          A block of 256 threads reduces with interleaved addressing. In the round in which only threads whose index is divisible by 8
          add, how many warps contain at least one active thread?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
    {
      key: "stall",
      rung: "check",
      prompt: (
        <p>
          A single thread adds 0.5 to a float32 running total, starting from zero, twenty million times, rounding to nearest after each
          addition. What total does it end with?
        </p>
      ),
      answer: { kind: "numeric", value: 8388608, tolerance: 0 },
    },
    {
      key: "atomic",
      rung: "apply",
      prompt: <p>A float32 sum computed with one atomicAdd per block differs slightly from run to run. Why?</p>,
      answer: {
        kind: "choice",
        options: [
          "Blocks finish in a different order each run, and floating-point addition is not associative",
          "Atomic operations lose updates when two blocks collide",
          "The GPU uses random rounding for atomics",
          "Shared memory is not cleared between runs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def shfl_down(vals, offset):
    return [vals[i + offset] if i + offset < len(vals) else vals[i] for i in range(len(vals))]

def warp_reduce(vals):
    off = len(vals) // 2
    while off:
        vals = [a + b for a, b in zip(vals, shfl_down(vals, off))]
        off //= 2
    return vals[0]

def shfl_xor(vals, mask):
    return [vals[i ^ mask] for i in range(len(vals))]

v = [1, 2, 3, 4, 5, 6, 7, 8]
print(shfl_down(v, 2), warp_reduce(v), shfl_xor(v, 1)[:4])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, 4, 5, 6, 7, 8, 7, 8] 36 [2, 1, 4, 3]",
          "[3, 4, 5, 6, 7, 8, 0, 0] 36 [2, 1, 4, 3]",
          "[3, 4, 5, 6, 7, 8, 7, 8] 44 [2, 1, 4, 3]",
          "[3, 4, 5, 6, 7, 8, 7, 8] 36 [2, 3, 4, 5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import struct

def f32(x):
    return struct.unpack("f", struct.pack("f", x))[0]

def seq_sum32(xs):
    s = 0.0
    for x in xs:
        s = f32(s + x)
    return s

def tree_sum32(xs):
    xs = [f32(x) for x in xs]
    while len(xs) > 1:
        if len(xs) % 2:
            xs.append(0.0)
        h = len(xs) // 2
        xs = [f32(xs[i] + xs[i + h]) for i in range(h)]
    return xs[0] if xs else 0.0

xs = [1.0, 1e8, -1e8, 1.0]
print(f32(0.1) == 0.1, seq_sum32(xs), tree_sum32(xs))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "False 1.0 0.0",
          "False 2.0 2.0",
          "True 1.0 0.0",
          "False 1.0 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shfl_down(vals, offset)</C>, where lane i receives the value of lane i + offset, or its own value if that lane does not
          exist; <C>warp_reduce(vals)</C>, which applies rounds of add-what-you-receive with offsets halving from half the warp size down
          to 1 and returns lane 0; and <C>shfl_xor(vals, mask)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def shfl_down(vals, offset):
    return list(vals)

def warp_reduce(vals):
    return vals[0]

def shfl_xor(vals, mask):
    return list(vals)
`,
        solution: WARP,
        tests: [
          { name: "shuffle", code: `assert shfl_down([5, 6, 7], 1) == [6, 7, 7]\nassert shfl_xor([0, 1, 2, 3], 2) == [2, 3, 0, 1]` },
          { name: "reduce", code: `assert warp_reduce(list(range(32))) == 496\nassert warp_reduce([2.5]) == 2.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>f32(x)</C>, x rounded to the nearest float32 (use <C>struct</C>); <C>seq_sum32(xs)</C>, a left-to-right sum rounding
          after every addition; and <C>tree_sum32(xs)</C>, which rounds the inputs, then repeatedly pads to even length with 0.0 and adds
          element i to element i + h for the first half h, rounding each sum, and returns 0.0 for an empty list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import struct

def f32(x):
    return x

def seq_sum32(xs):
    return sum(xs)

def tree_sum32(xs):
    return sum(xs)
`,
        solution: ORDER,
        tests: [
          { name: "round", code: `assert f32(16777217.0) == 16777216.0 and f32(0.5) == 0.5` },
          { name: "order", code: `assert seq_sum32([16777216.0, 1.0, 0.0, 1.0]) == 16777216.0\nassert tree_sum32([16777216.0, 1.0, 0.0, 1.0]) == 16777218.0\nassert tree_sum32([]) == 0.0 and tree_sum32([1.0, 2.0, 3.0]) == 6.0` },
        ],
      },
    },
    {
      key: "passes",
      rung: "stretch",
      prompt: (
        <p>
          A sum of <M>{"10^8"}</M> floats uses blocks of 256 threads, each thread first adding k elements, and each block writing one
          partial. A second kernel with a single block of 1024 threads must sum the partials with each thread adding at most 4 of them.
          What is the smallest whole k that makes this possible?
        </p>
      ),
      answer: { kind: "numeric", value: 96, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Reductions over rows, such as the sums inside softmax and layer normalisation, are everywhere in neural networks. Before writing
        them in a higher-level language, the next chapter turns to the kernel that dominates training: matrix multiplication.
      </p>
    </>
  ),
};
