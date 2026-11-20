import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ThreadMappingViz } from "@/components/viz/ThreadMappingViz";
import type { LessonContent } from "@/lib/types";

const LAUNCH = `def num_blocks(n, block):
    return (n + block - 1) // block

def global_index(block_idx, block_dim, thread_idx):
    return block_idx * block_dim + thread_idx

def launch(kernel, grid, block):
    return [kernel(b, block, t) for b in range(grid) for t in range(block)]`;

const GRID2D = `def grid2d(h, w, bh, bw):
    return (h + bh - 1) // bh, (w + bw - 1) // bw

def pixel(by, bx, ty, tx, bh, bw):
    return by * bh + ty, bx * bw + tx

def grid_stride(tid, stride, n):
    return list(range(tid, n, stride))`;

const VECADD = `__global__ void add(const float* x, const float* y, float* out, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) out[i] = x[i] + y[i];
}

// host code
float *x, *y, *out;
cudaMalloc(&x, n * sizeof(float));  // likewise y and out
cudaMemcpy(x, x_host, n * sizeof(float), cudaMemcpyHostToDevice);
int block = 256;
int grid = (n + block - 1) / block;
add<<<grid, block>>>(x, y, out, n);
cudaError_t err = cudaGetLastError();      // launch errors
cudaMemcpy(out_host, out, n * sizeof(float), cudaMemcpyDeviceToHost);  // waits for the kernel`;

const STRIDE = `__global__ void scale(float* x, float a, int n) {
    int stride = gridDim.x * blockDim.x;
    for (int i = blockIdx.x * blockDim.x + threadIdx.x; i < n; i += stride)
        x[i] *= a;
}`;

export const lesson: LessonContent = {
  id: "e9.1.1",
  minutes: 50,
  links: {
    requires: ["e7.3.1", "e7.3.4"],
    revisits: ["e7.3.2"],
    foreshadows: ["e9.1.2", "e9.6.1"],
  },

  puzzle: (
    <>
      <p>
        You want to add two vectors of a million floats on a GPU, one element per thread, in blocks of 256 threads. How many blocks do
        you launch, and what do the threads of the last block do? Now the vectors hold ten billion elements, more than the grid you are
        willing to launch. How can a fixed number of threads cover any length, each element exactly once?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A kernel is one function that every thread runs. Threads are grouped into blocks and blocks into a grid, and the only thing that
        distinguishes one thread from another is its position: its block index and its index within the block. From these each thread
        computes which piece of data is its own. Since the grid comes in whole blocks it usually overshoots the data, so every kernel
        checks bounds; and a thread can step through the data by the size of the whole grid to handle more than one element.
      </p>
      <ThreadMappingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a kernel and its launch">
        <p>
          In CUDA a kernel is a function marked <C>__global__</C>, launched from the host with <C>{"kernel<<<grid, block>>>(args)"}</C>.
          Inside it the built-in variables <C>blockIdx</C>, <C>blockDim</C>, <C>threadIdx</C> and <C>gridDim</C> give the thread&apos;s
          position (the execution model itself is in e7.3.1). The usual one-dimensional mapping is{" "}
          <M>{"i = \\text{blockIdx.x} \\cdot \\text{blockDim.x} + \\text{threadIdx.x}"}</M> (<C>global_index</C>), and the grid has{" "}
          <M>{"\\lceil n / b \\rceil"}</M> blocks of b threads (<C>num_blocks</C>). The host allocates device memory, copies inputs over,
          launches, and copies results back.
        </p>
        <Code>{VECADD}</Code>
        <p>
          The Python below simulates a launch: it calls the kernel once for every (block, thread) pair and collects what each returns
          (<C>launch</C>). A real GPU runs these calls in parallel and in no guaranteed order, so a correct kernel must not depend on the
          order.
        </p>
        <Code>{LAUNCH}</Code>
      </Definition>

      <Definition title="two-dimensional grids">
        <p>
          For an image or a matrix, blocks and grids are given as <C>dim3</C> shapes with x and y extents. A thread&apos;s pixel is row{" "}
          <M>{"\\text{blockIdx.y} \\cdot \\text{blockDim.y} + \\text{threadIdx.y}"}</M> and column{" "}
          <M>{"\\text{blockIdx.x} \\cdot \\text{blockDim.x} + \\text{threadIdx.x}"}</M> (<C>pixel</C>), with a grid of{" "}
          <M>{"\\lceil h / b_y \\rceil \\times \\lceil w / b_x \\rceil"}</M> blocks (<C>grid2d</C>). Threads are numbered with x varying
          fastest, so x should index the dimension that is contiguous in memory: for a row-major array, the column.
        </p>
        <Code>{GRID2D}</Code>
      </Definition>

      <Theorem title="the grid-stride loop covers every element once">
        <p>
          Launch S threads in total, numbered t = 0, ..., S - 1, and let thread t handle the indices t, t + S, t + 2S, ... below n
          (<C>grid_stride</C>). Then every index in 0, ..., n - 1 is handled by exactly one thread, exactly once, for any n and any S &#8805; 1.
          Thread t does <M>{"\\lceil (n - t)/S \\rceil"}</M> iterations when t &lt; n.
        </p>
      </Theorem>
      <Proof>
        <p>
          Thread t handles exactly the indices i in the range with i &#8801; t (mod S). By division with remainder, every i has a unique
          remainder r = i mod S in 0, ..., S - 1, so it belongs to thread r and to no other, and it appears once in that thread&apos;s
          arithmetic progression. Thread t&apos;s indices are t + kS for k = 0, 1, ... with t + kS &lt; n, that is k &lt; (n - t)/S, which
          gives <M>{"\\lceil (n - t)/S \\rceil"}</M> values of k.
        </p>
        <Code>{STRIDE}</Code>
      </Proof>

      <Remark title="practical rules">
        <p>
          Block sizes are multiples of the 32-thread warp, usually 128 to 512, and at most 1024. The grid&apos;s x extent can be up to{" "}
          <M>{"2^{31} - 1"}</M> blocks but y and z only 65535, which is one reason to prefer grid-stride loops for very large inputs. A
          launch returns immediately: the kernel runs asynchronously, launch errors are reported by <C>cudaGetLastError</C>, and errors
          during execution surface at the next synchronising call. Without the bounds check the threads of the last block write past the
          end of the array, a bug that often goes unnoticed until it corrupts something else.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A million elements in blocks of 256 need <M>{"\\lceil 10^6 / 256 \\rceil = 3907"}</M> blocks, which launch 1,000,192 threads;
          the last 192 fail the bounds check and do nothing. For ten billion elements, launch a grid that fills the GPU a few times over and
          let each thread stride through the array by the size of the grid. The theorem guarantees that every element is processed exactly
          once.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "idle",
      rung: "check",
      prompt: <p>A kernel processes 50,000 elements, one per thread, in blocks of 384 threads. How many launched threads do nothing?</p>,
      answer: { kind: "numeric", value: 304, tolerance: 0 },
    },
    {
      key: "blocks2d",
      rung: "check",
      prompt: <p>A 1080 by 1920 image is processed one pixel per thread with 16 by 16 blocks. How many blocks does the grid contain?</p>,
      answer: { kind: "numeric", value: 8160, tolerance: 0 },
    },
    {
      key: "xdim",
      rung: "apply",
      prompt: <p>A kernel reads a row-major matrix, one element per thread, with a two-dimensional grid. Which mapping is better?</p>,
      answer: {
        kind: "choice",
        options: [
          "threadIdx.x indexes the column, so that consecutive threads read consecutive addresses",
          "threadIdx.x indexes the row, so that each thread reads a different row",
          "Either; the hardware reorders threads to match memory",
          "threadIdx.y indexes the column, because y varies fastest",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def num_blocks(n, block):
    return (n + block - 1) // block

def global_index(block_idx, block_dim, thread_idx):
    return block_idx * block_dim + thread_idx

def launch(kernel, grid, block):
    return [kernel(b, block, t) for b in range(grid) for t in range(block)]

n = 5
print(num_blocks(n, 2), launch(lambda b, d, t: global_index(b, d, t) if global_index(b, d, t) < n else None, num_blocks(n, 2), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 [0, 1, 2, 3, 4, None]",
          "2 [0, 1, 2, 3]",
          "3 [0, 1, 2, 3, 4, 5]",
          "3 [0, 2, 4, 1, 3, None]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def grid2d(h, w, bh, bw):
    return (h + bh - 1) // bh, (w + bw - 1) // bw

def pixel(by, bx, ty, tx, bh, bw):
    return by * bh + ty, bx * bw + tx

def grid_stride(tid, stride, n):
    return list(range(tid, n, stride))

print(grid2d(5, 9, 2, 4), pixel(1, 2, 1, 3, 2, 4), grid_stride(3, 4, 14))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3, 3) (3, 11) [3, 7, 11]",
          "(2, 2) (3, 11) [3, 7, 11]",
          "(3, 3) (11, 3) [3, 7, 11]",
          "(3, 3) (3, 11) [3, 7, 11, 15]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>num_blocks(n, block)</C>, the number of blocks needed to give every element a thread; <C>global_index(block_idx,
          block_dim, thread_idx)</C>; and <C>launch(kernel, grid, block)</C>, which calls <C>kernel(b, block, t)</C> for every block b and
          thread t, blocks in order and threads in order within each, and returns the list of results.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def num_blocks(n, block):
    return n // block

def global_index(block_idx, block_dim, thread_idx):
    return thread_idx

def launch(kernel, grid, block):
    return []
`,
        solution: LAUNCH,
        tests: [
          { name: "index", code: `assert num_blocks(1000, 128) == 8 and num_blocks(1024, 128) == 8 and num_blocks(1, 256) == 1\nassert global_index(3, 64, 5) == 197` },
          { name: "launch", code: `assert launch(lambda b, d, t: (b, t), 2, 3) == [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (1, 2)]\nassert launch(lambda b, d, t: global_index(b, d, t), 3, 2) == list(range(6))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grid2d(h, w, bh, bw)</C>, the grid shape (rows of blocks, columns of blocks) covering an h by w array with blocks of bh
          by bw threads; <C>pixel(by, bx, ty, tx, bh, bw)</C>, the (row, column) of a thread; and <C>grid_stride(tid, stride, n)</C>, the
          indices a thread handles in a grid-stride loop.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def grid2d(h, w, bh, bw):
    return h // bh, w // bw

def pixel(by, bx, ty, tx, bh, bw):
    return ty, tx

def grid_stride(tid, stride, n):
    return [tid]
`,
        solution: GRID2D,
        tests: [
          { name: "grid", code: `assert grid2d(100, 70, 16, 32) == (7, 3) and grid2d(64, 64, 8, 8) == (8, 8)\nassert pixel(2, 1, 3, 4, 8, 16) == (19, 20)` },
          { name: "stride", code: `assert grid_stride(0, 5, 12) == [0, 5, 10]\nassert grid_stride(7, 8, 7) == []` },
        ],
      },
    },
    {
      key: "iters",
      rung: "stretch",
      prompt: (
        <p>
          A grid-stride kernel runs on 8 blocks of 128 threads over 10,000 elements. How many threads perform the largest number of
          iterations?
        </p>
      ),
      answer: { kind: "numeric", value: 784, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Which element a thread reads matters as much as how many threads there are. The next lesson shows how the addresses that the
        threads of a warp request together decide how many memory transactions the hardware performs.
      </p>
    </>
  ),
};
