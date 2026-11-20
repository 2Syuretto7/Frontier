import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TritonProgramsViz } from "@/components/viz/TritonProgramsViz";
import type { LessonContent } from "@/lib/types";

const PROGRAMS = `def block_offsets(pid, BLOCK):
    return [pid * BLOCK + i for i in range(BLOCK)]

def masked_load(x, offs, other=0.0):
    return [x[o] if o < len(x) else other for o in offs]

def run_add(x, y, BLOCK):
    out = [None] * len(x)
    for pid in range((len(x) + BLOCK - 1) // BLOCK):
        offs = block_offsets(pid, BLOCK)
        s = [a + b for a, b in zip(masked_load(x, offs), masked_load(y, offs))]
        for o, v in zip(offs, s):
            if o < len(x):
                out[o] = v
    return out`;

const POINTERS = `def ptrs_2d(offs_m, offs_n, stride_m, stride_n):
    return [[m * stride_m + n * stride_n for n in offs_n] for m in offs_m]

def mask_2d(offs_m, offs_n, M, N):
    return [[m < M and n < N for n in offs_n] for m in offs_m]

def next_pow2(n):
    p = 1
    while p < n:
        p *= 2
    return p`;

const ADD = `import torch
import triton
import triton.language as tl

@triton.jit
def add_kernel(x_ptr, y_ptr, out_ptr, n, BLOCK: tl.constexpr):
    pid = tl.program_id(axis=0)                 # which block this program handles
    offs = pid * BLOCK + tl.arange(0, BLOCK)    # a vector of BLOCK offsets
    mask = offs < n
    x = tl.load(x_ptr + offs, mask=mask, other=0.0)
    y = tl.load(y_ptr + offs, mask=mask, other=0.0)
    tl.store(out_ptr + offs, x + y, mask=mask)

def add(x, y):
    out = torch.empty_like(x)
    n = x.numel()
    grid = lambda meta: (triton.cdiv(n, meta["BLOCK"]),)
    add_kernel[grid](x, y, out, n, BLOCK=1024)
    return out`;

const MATMUL = `@triton.jit
def matmul_kernel(a_ptr, b_ptr, c_ptr, M, N, K, sam, sak, sbk, sbn, scm, scn,
                  BM: tl.constexpr, BN: tl.constexpr, BK: tl.constexpr):
    pid_m, pid_n = tl.program_id(0), tl.program_id(1)
    offs_m = pid_m * BM + tl.arange(0, BM)
    offs_n = pid_n * BN + tl.arange(0, BN)
    offs_k = tl.arange(0, BK)
    a_ptrs = a_ptr + offs_m[:, None] * sam + offs_k[None, :] * sak    # a BM x BK block of pointers
    b_ptrs = b_ptr + offs_k[:, None] * sbk + offs_n[None, :] * sbn    # a BK x BN block
    acc = tl.zeros((BM, BN), dtype=tl.float32)
    for k in range(0, K, BK):
        a = tl.load(a_ptrs, mask=(offs_m[:, None] < M) & (offs_k[None, :] + k < K), other=0.0)
        b = tl.load(b_ptrs, mask=(offs_k[:, None] + k < K) & (offs_n[None, :] < N), other=0.0)
        acc += tl.dot(a, b)                     # tensor cores, chosen by the compiler
        a_ptrs += BK * sak
        b_ptrs += BK * sbk
    c_ptrs = c_ptr + offs_m[:, None] * scm + offs_n[None, :] * scn
    tl.store(c_ptrs, acc, mask=(offs_m[:, None] < M) & (offs_n[None, :] < N))`;

export const lesson: LessonContent = {
  id: "e9.3.1",
  minutes: 55,
  links: {
    requires: ["e9.2.3", "e6.4.2"],
    revisits: ["e9.1.1", "e9.1.2"],
    foreshadows: ["e9.3.2", "e9.3.3"],
  },

  puzzle: (
    <>
      <p>
        The tiled matrix multiplication of the previous chapter took a hundred lines of CUDA: thread indices, shared-memory buffers,
        barriers, fragment layouts and swizzles. Written in Triton, a competitive version fits in twenty lines and never mentions a
        thread. Where did the threads go, and what did you give up in exchange?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In CUDA you write what one thread does. In Triton you write what one program does, and a program operates on whole blocks of
        data: vectors and small matrices of values, loaded and stored with masks, combined with ordinary arithmetic and a block matrix
        product. The compiler decides how the block is spread over threads, stages operands in shared memory, coalesces loads and uses
        tensor cores. You still choose the block sizes and the grid, which is where most of the performance decisions live.
      </p>
      <TritonProgramsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="programs, blocks and masks">
        <p>
          A Triton kernel is a Python function decorated with <C>@triton.jit</C>. It is launched on a grid of program instances; each
          finds its index with <C>tl.program_id</C> and builds a block of offsets with <C>tl.arange</C> (<C>block_offsets</C>), whose
          length must be a compile-time power of two marked <C>tl.constexpr</C>. Pointers plus offsets give blocks of addresses;{" "}
          <C>tl.load</C> and <C>tl.store</C> take a mask, and masked-off lanes read the <C>other</C> value and write nothing
          (<C>masked_load</C>). The Python below simulates the vector addition program by program (<C>run_add</C>).
        </p>
        <Code>{ADD}</Code>
        <Code>{PROGRAMS}</Code>
      </Definition>

      <Definition title="two-dimensional blocks">
        <p>
          Broadcasting builds a block of pointers from a column of row offsets and a row of column offsets:{" "}
          <C>{"base + offs_m[:, None] * stride_m + offs_n[None, :] * stride_n"}</C> (<C>ptrs_2d</C>), and the mask is built the same way
          (<C>mask_2d</C>). Passing strides instead of assuming a layout lets the same kernel read a transposed view. A matrix
          multiplication walks blocks of A and B along k and accumulates <C>tl.dot</C> products in float32.
        </p>
        <Code>{MATMUL}</Code>
        <Code>{POINTERS}</Code>
      </Definition>

      <Theorem title="the cost of power-of-two blocks">
        <p>
          A block that must cover n elements with a power-of-two length uses the smallest power of two p &#8805; n (<C>next_pow2</C>). The
          fraction of masked lanes, 1 - n/p, is always below 1/2, and is 0 exactly when n is a power of two.
        </p>
      </Theorem>
      <Proof>
        <p>
          By minimality p/2 &lt; n &#8804; p, for n &#8805; 2; for n = 1, p = 1 and nothing is masked. So n/p &gt; 1/2 and the masked fraction
          1 - n/p &lt; 1/2, with equality to 0 only when n = p. Masked lanes still occupy registers and issue instructions, so a row of
          length 513 processed as one block costs nearly twice a row of 512; such shapes are better split into several blocks or padded in
          memory.
        </p>
      </Proof>

      <Remark title="what the compiler decides, and what you do">
        <p>
          Triton lowers block operations to a layout that assigns elements to threads, inserts shared-memory staging and swizzling for{" "}
          <C>tl.dot</C>, vectorises contiguous loads, and pipelines the k loop. The programmer chooses block sizes, the number of warps
          per program, the number of pipeline stages, and the order in which programs map to tiles. That is less control than CUDA:
          warp-specialised designs and the newest hardware features have at times required CUDA or lower-level extensions first. In
          exchange, one kernel adapts to many shapes and GPUs by retuning a few constants, the subject of e9.3.3.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The threads went into the compiler, which maps each block onto the program&apos;s warps and handles shared memory, barriers and
          tensor core layouts. What remains in your hands is the tiling itself: block sizes, the grid, masks at the edges and the strides
          that describe each operand. You give up control below the level of a block.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "pad",
      rung: "check",
      prompt: (
        <p>
          A softmax kernel handles a row of 781 columns as a single block whose length must be a power of two. What fraction of the
          block&apos;s lanes are masked? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.237, tolerance: 0.001 },
    },
    {
      key: "stride",
      rung: "check",
      prompt: (
        <p>
          A kernel reads the transpose of a row-major 128 by 64 matrix by passing strides (1, 64). Which element offset does block
          position (3, 5) read?
        </p>
      ),
      answer: { kind: "numeric", value: 323, tolerance: 0 },
    },
    {
      key: "decide",
      rung: "apply",
      prompt: <p>Which of these does a Triton programmer still decide explicitly?</p>,
      answer: {
        kind: "choice",
        options: [
          "The block sizes each program works on",
          "Which thread loads which element",
          "Where to place barriers between shared-memory phases",
          "The register layout of tensor core fragments",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def block_offsets(pid, BLOCK):
    return [pid * BLOCK + i for i in range(BLOCK)]

def masked_load(x, offs, other=0.0):
    return [x[o] if o < len(x) else other for o in offs]

def run_add(x, y, BLOCK):
    out = [None] * len(x)
    for pid in range((len(x) + BLOCK - 1) // BLOCK):
        offs = block_offsets(pid, BLOCK)
        s = [a + b for a, b in zip(masked_load(x, offs), masked_load(y, offs))]
        for o, v in zip(offs, s):
            if o < len(x):
                out[o] = v
    return out

offs = block_offsets(2, 4)
print(offs, masked_load([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], offs, other=-1), run_add([1, 2, 3], [10, 20, 30], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[8, 9, 10, 11] [9, 10, -1, -1] [11, 22, 33]",
          "[8, 9, 10, 11] [9, 10, 0, 0] [11, 22, 33]",
          "[2, 3, 4, 5] [3, 4, 5, 6] [11, 22, 33]",
          "[8, 9, 10, 11] [9, 10, -1, -1] [11, 22, None]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ptrs_2d(offs_m, offs_n, stride_m, stride_n):
    return [[m * stride_m + n * stride_n for n in offs_n] for m in offs_m]

def mask_2d(offs_m, offs_n, M, N):
    return [[m < M and n < N for n in offs_n] for m in offs_m]

def next_pow2(n):
    p = 1
    while p < n:
        p *= 2
    return p

print(ptrs_2d([0, 1], [0, 1, 2], 8, 1), mask_2d([2, 3], [0, 1], 3, 1), next_pow2(5), next_pow2(64))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0, 1, 2], [8, 9, 10]] [[True, False], [False, False]] 8 64",
          "[[0, 8, 16], [1, 9, 17]] [[True, False], [False, False]] 8 64",
          "[[0, 1, 2], [8, 9, 10]] [[True, True], [False, False]] 8 64",
          "[[0, 1, 2], [8, 9, 10]] [[True, False], [False, False]] 8 128",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>block_offsets(pid, BLOCK)</C>; <C>masked_load(x, offs, other=0.0)</C>, which reads x at each offset below len(x) and
          returns other elsewhere; and <C>run_add(x, y, BLOCK)</C>, which runs one simulated program per block, each loading both blocks
          with masks and storing the sums only at valid offsets.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def block_offsets(pid, BLOCK):
    return [pid] * BLOCK

def masked_load(x, offs, other=0.0):
    return list(x)

def run_add(x, y, BLOCK):
    return list(x)
`,
        solution: PROGRAMS,
        tests: [
          { name: "offsets", code: `assert block_offsets(0, 3) == [0, 1, 2] and block_offsets(3, 2) == [6, 7]\nassert masked_load([5, 6], [1, 2, 3]) == [6, 0.0, 0.0]` },
          { name: "add", code: `x = list(range(11))\ny = [2 * v for v in x]\nassert run_add(x, y, 4) == [3 * v for v in x] and run_add([1.5], [2.5], 8) == [4.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ptrs_2d(offs_m, offs_n, stride_m, stride_n)</C> and <C>mask_2d(offs_m, offs_n, M, N)</C>, both as lists of rows, and{" "}
          <C>next_pow2(n)</C> for n &#8805; 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ptrs_2d(offs_m, offs_n, stride_m, stride_n):
    return [[0] * len(offs_n) for _ in offs_m]

def mask_2d(offs_m, offs_n, M, N):
    return [[True] * len(offs_n) for _ in offs_m]

def next_pow2(n):
    return n
`,
        solution: POINTERS,
        tests: [
          { name: "pointers", code: `assert ptrs_2d([1], [2, 3], 1, 64) == [[129, 193]]\nassert next_pow2(1) == 1 and next_pow2(1000) == 1024 and next_pow2(512) == 512` },
          { name: "masks", code: `assert mask_2d([0, 1], [5], 2, 6) == [[True], [True]]\nassert mask_2d([1], [0, 9], 1, 9) == [[False, False]]` },
        ],
      },
    },
    {
      key: "waste",
      rung: "stretch",
      prompt: (
        <p>
          A 1000 by 1000 output is computed by a Triton matrix multiplication with 128 by 128 blocks. What fraction of the output
          positions computed by all programs are masked off? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.046, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Block programs make fusion easy: a kernel can load a row once and do several operations on it before writing anything back. The
        next lesson writes fused elementwise and normalisation kernels.
      </p>
    </>
  ),
};
