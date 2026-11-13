import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GpuGridViz } from "@/components/viz/GpuGridViz";
import type { LessonContent } from "@/lib/types";

const CUDA = `__global__ void add(const float *a, const float *b, float *out, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;   /* one element per thread */
    if (i < n) out[i] = a[i] + b[i];
}

/* on the host: enough blocks of 256 threads to cover n */
add<<<(n + 255) / 256, 256>>>(a_dev, b_dev, out_dev, n);`;

const REDUCE = `__global__ void block_sum(const float *x, float *partial, int n) {
    __shared__ float s[256];
    int t = threadIdx.x, i = blockIdx.x * 256 + t;
    s[t] = i < n ? x[i] : 0.0f;
    __syncthreads();
    for (int stride = 128; stride > 0; stride /= 2) {
        if (t < stride) s[t] += s[t + stride];
        __syncthreads();
    }
    if (t == 0) partial[blockIdx.x] = s[0];
}`;

const SIM = `def grid_size(n, block):
    return (n + block - 1) // block

def launch(kernel, grid, block, *args):
    for b in range(grid):
        for t in range(block):
            kernel(b, block, t, *args)

def add_kernel(block_idx, block_dim, thread_idx, a, b, out, n):
    i = block_idx * block_dim + thread_idx
    if i < n:
        out[i] = a[i] + b[i]

def gpu_add(a, b, block=256):
    out = [0.0] * len(a)
    launch(add_kernel, grid_size(len(a), block), block, a, b, out, len(a))
    return out
`;

const SIM2 = `def transactions(addresses, warp=32, segment=32):
    count = 0
    for w in range(0, len(addresses), warp):
        count += len({a // segment for a in addresses[w:w + warp]})
    return count

def block_reduce(values):
    vals, steps = list(values), 0
    stride = len(vals) // 2
    while stride > 0:
        for t in range(stride):
            vals[t] += vals[t + stride]
        stride //= 2
        steps += 1
    return vals[0], steps
`;

export const lesson: LessonContent = {
  id: "e5.5.3",
  minutes: 55,
  links: {
    requires: ["e5.5.2", "e3.5.1"],
    revisits: ["e5.5.1", "e3.3.1"],
    foreshadows: ["e7.3.1", "e9.1.1"],
  },

  puzzle: (
    <>
      <p>
        On a CPU, an elementwise add is a loop: one core visits the elements one after another. A GPU has thousands of simple
        cores and no fast way to run one long loop. How is the same add written for it, how does each core know which element
        is its own, and why does the layout of memory matter even more there than on a CPU?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A GPU kernel is the body of the loop, written for one element. The launch starts a grid of blocks, each a group of
        threads, and every thread computes its own element index from its block number and its position in the block. Threads
        run in lock-step groups called warps; when the threads of a warp read neighbouring addresses, the hardware serves them
        all with one wide memory transaction.
      </p>
      <GpuGridViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a CUDA kernel and its launch">
        <p>
          <C>__global__</C> marks a function that runs on the GPU, once per thread. <C>blockIdx.x</C>, <C>blockDim.x</C> and{" "}
          <C>threadIdx.x</C> give the thread its coordinates. The launch syntax <C>&lt;&lt;&lt;grid, block&gt;&gt;&gt;</C> sets
          how many blocks and how many threads per block.
        </p>
        <Code>{CUDA}</Code>
      </Definition>

      <Definition title="the same model in Python">
        <p>
          The exercises simulate the launch sequentially, which gives the same result as long as threads write disjoint
          elements, as they do in an elementwise kernel.
        </p>
        <Code>{SIM}</Code>
      </Definition>

      <Theorem title="a tree reduction">
        <p>
          A block of n = 2ᵏ threads can sum n values in k steps: at each step, every thread t below the current stride adds the
          value at t + stride into its own, and the stride halves. The total number of additions is n − 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Before the step with stride s, positions 0, …, 2s − 1 together hold the sum of all n values (true at the start, with s
          = n/2). The step adds position t + s into t for every t &lt; s, so positions 0, …, s − 1 now hold that same total. After
          the step with stride 1, position 0 holds the whole sum. The strides n/2, n/4, …, 1 are k steps, using n/2 + n/4 + … +
          1 = n − 1 additions.
        </p>
      </Proof>

      <Example title="a block reduction in CUDA">
        <Code>{REDUCE}</Code>
        <p>
          <C>__shared__</C> memory is fast storage shared by a block, and <C>__syncthreads()</C> waits until every thread of the
          block reaches it, so no thread reads a value before it has been written. Each block writes one partial sum; a second
          launch, or the CPU, adds the partials.
        </p>
        <Code>{SIM2}</Code>
      </Example>

      <Remark title="what a framework adds">
        <p>
          A GPU backend registers kernels like these under the "gpu" device in the dispatch table, allocates tensors in GPU
          memory, and copies to and from the host only when asked. Its kernels are launched asynchronously, so the CPU queues
          work and moves on; a value is only waited for when the host needs it, such as when printing a loss. Much of the
          speed of real frameworks comes from fusing several elementwise kernels into one, so that each element is read from
          memory once instead of once per operation.
        </p>
      </Remark>

      <Remark title="trying it cheaply">
        <p>
          Running real kernels needs an NVIDIA GPU. The simulations here teach the indexing and the access patterns; for real
          timing, the smallest GPU instance a free notebook service or cloud provider offers is plenty for kernels of this size.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "blocks",
      rung: "check",
      prompt: <p>n = 1000 elements, 256 threads per block. How many blocks does the launch need?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "index",
      rung: "check",
      prompt: <p>Which expression gives a thread its global element index in a one-dimensional launch?</p>,
      answer: {
        kind: "choice",
        options: ["blockIdx.x * blockDim.x + threadIdx.x", "threadIdx.x * blockDim.x + blockIdx.x", "blockIdx.x + threadIdx.x", "blockDim.x * threadIdx.x"],
        correct: [0],
      },
    },
    {
      key: "check",
      rung: "apply",
      prompt: <p>Why does the add kernel test <C>if (i &lt; n)</C>?</p>,
      answer: {
        kind: "choice",
        options: [
          "The grid is rounded up to whole blocks, so the last block may have threads past the end of the arrays",
          "Threads may run in any order",
          "To skip elements that are zero",
          "Because blockDim may be negative",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${SIM}
def unsafe_add(block_idx, block_dim, thread_idx, a, b, out, n):
    i = block_idx * block_dim + thread_idx
    out[i] = a[i] + b[i]
a, b = [1.0] * 10, [2.0] * 10
out = [0.0] * 10
launch(add_kernel, grid_size(10, 4), 4, a, b, out, 10)
try:
    launch(unsafe_add, grid_size(10, 4), 4, a, b, [0.0] * 10, 10)
    msg = "ok"
except IndexError:
    msg = "IndexError"
print(grid_size(10, 4), sum(out), msg)`}</Code>
          <p>A launch with and without the bounds check. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 30.0 IndexError", "3 30.0 ok", "2 24.0 ok", "3 36.0 IndexError"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${SIM2}
coalesced = list(range(64))
strided = [t * 32 for t in range(64)]
print(transactions(coalesced), transactions(strided), block_reduce(range(16)))`}</Code>
          <p>Coalesced against strided loads, and a tree reduction. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 64 (120, 4)", "2 2 (120, 4)", "64 64 (120, 15)", "2 64 (120, 15)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          <C>grid_size(n, block)</C> is already defined. Write a sequential simulator <C>launch(kernel, grid, block, *args)</C> that calls{" "}
          <C>kernel(block_idx, block_dim, thread_idx, *args)</C> for every thread, an <C>add_kernel</C> with the bounds check,
          and <C>gpu_add(a, b, block=256)</C>, which allocates the output, launches, and returns it.
        </p>
      ),
      answer: {
        kind: "code",
        setup: SIM.split("\n\n")[0],
        starter: `# grid_size(n, block) is already defined.

def launch(kernel, grid, block, *args):
    pass

def add_kernel(block_idx, block_dim, thread_idx, a, b, out, n):
    pass

def gpu_add(a, b, block=256):
    return [x + y for x, y in zip(a, b)]
`,
        solution: SIM.split("\n\n").slice(1).join("\n\n"),
        tests: [
          { name: "grid arithmetic", code: `assert grid_size(1000, 256) == 4 and grid_size(1024, 256) == 4 and grid_size(1, 256) == 1
calls = []
launch(lambda b, d, t: calls.append((b, d, t)), 2, 3)
assert calls == [(0, 3, 0), (0, 3, 1), (0, 3, 2), (1, 3, 0), (1, 3, 1), (1, 3, 2)], calls` },
          { name: "adds any length", code: `for n, blk in ((10, 4), (7, 7), (300, 128)):
    a = [float(i) for i in range(n)]
    b = [2.0 * i for i in range(n)]
    assert gpu_add(a, b, blk) == [3.0 * i for i in range(n)]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>transactions(addresses, warp=32, segment=32)</C>, which splits the per-thread addresses into warps of
          consecutive threads and counts, summed over warps, the distinct segments (address // segment) each warp touches;
          and <C>block_reduce(values)</C> for a power-of-two number of values, the tree reduction above, returning (sum, number
          of steps).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def transactions(addresses, warp=32, segment=32):
    return len(addresses)

def block_reduce(values):
    return sum(values), 0
`,
        solution: SIM2,
        tests: [
          { name: "coalescing", code: `assert transactions(list(range(64))) == 2
assert transactions([t * 32 for t in range(64)]) == 64
assert transactions([t * 2 for t in range(32)]) == 2
assert transactions(list(range(16, 48))) == 2 and transactions([5] * 32) == 1` },
          { name: "tree reduction", code: `assert block_reduce(range(16)) == (120, 4)
assert block_reduce([1.5]) == (1.5, 0)
s, k = block_reduce([float(i % 7) for i in range(256)])
assert s == sum(float(i % 7) for i in range(256)) and k == 8` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          A block holds n = 2ᵏ values. At each step, every position t below the current stride s adds position t + s into
          itself, and s goes n/2, n/4, …, 1. Prove that position 0 ends with the sum of all n values, after k steps and n − 1
          additions.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States an invariant: before the step with stride s, positions 0 to 2s − 1 hold values whose total is the sum of all n inputs.",
          "Shows the step preserves it: adding t + s into t for t < s moves the total into positions 0 to s − 1, so the invariant holds for stride s/2.",
          "Concludes after stride 1 that position 0 holds the total, and counts k steps and n/2 + n/4 + … + 1 = n − 1 additions.",
        ],
      },
    },
    {
      key: "warp",
      rung: "stretch",
      prompt: <p>How many threads are in a warp on NVIDIA GPUs?</p>,
      answer: { kind: "numeric", value: 32 },
    },
  ],

  teachBack:
    "Explain to a friend how a GPU kernel replaces a loop, how each thread finds its element, why the bounds check is needed, and why coalesced access and tree reductions matter.",

  glimpse: (
    <p>
      With autograd, tensors, modules, optimisers, testing and a backend, the framework is complete in outline. Every piece
      of PyTorch you use from here on is one of these, built at scale.
    </p>
  ),
};
