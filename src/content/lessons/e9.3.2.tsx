import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VarianceCancellationViz } from "@/components/viz/VarianceCancellationViz";
import type { LessonContent } from "@/lib/types";

const ROWS = `import math

def softmax_block(x, BLOCK):
    row = x + [-math.inf] * (BLOCK - len(x))      # masked lanes load -inf
    m = max(row)
    e = [math.exp(v - m) for v in row]            # exp(-inf) = 0
    s = sum(e)
    return [v / s for v in e[:len(x)]]

def layer_norm_block(x, w, b, BLOCK, eps=1e-5):
    n = len(x)
    row = x + [0.0] * (BLOCK - n)                 # masked lanes load 0
    mean = sum(row) / n
    diff = [v - mean if i < n else 0.0 for i, v in enumerate(row)]
    var = sum(d * d for d in diff) / n
    rstd = 1 / math.sqrt(var + eps)
    return [d * rstd * wi + bi for d, wi, bi in zip(diff, w, b)]

def rms_norm_block(x, w, BLOCK, eps=1e-6):
    row = x + [0.0] * (BLOCK - len(x))
    rstd = 1 / math.sqrt(sum(v * v for v in row) / len(x) + eps)
    return [v * rstd * wi for v, wi in zip(row, w)]`;

const CHUNKS = `def chunk_stats(xs):
    n = len(xs)
    mean = sum(xs) / n
    return (n, mean, sum((v - mean) ** 2 for v in xs))

def combine_stats(a, b):
    na, ma, qa = a
    nb, mb, qb = b
    n = na + nb
    d = mb - ma
    return (n, ma + d * nb / n, qa + qb + d * d * na * nb / n)

def layer_norm_chunked(x, w, b, BLOCK, eps=1e-5):
    st = chunk_stats(x[:BLOCK])
    for i in range(BLOCK, len(x), BLOCK):
        st = combine_stats(st, chunk_stats(x[i:i + BLOCK]))
    n, mean, q = st
    rstd = (q / n + eps) ** -0.5
    return [(v - mean) * rstd * wi + bi for v, wi, bi in zip(x, w, b)]`;

const LN = `@triton.jit
def layer_norm_fwd(x_ptr, y_ptr, w_ptr, b_ptr, mean_ptr, rstd_ptr, stride, N, eps,
                   BLOCK: tl.constexpr):
    row = tl.program_id(0)                        # one program per row
    cols = tl.arange(0, BLOCK)
    mask = cols < N
    x = tl.load(x_ptr + row * stride + cols, mask=mask, other=0.0).to(tl.float32)
    mean = tl.sum(x, axis=0) / N
    diff = tl.where(mask, x - mean, 0.0)          # masked lanes must not count
    var = tl.sum(diff * diff, axis=0) / N
    rstd = 1 / tl.sqrt(var + eps)
    w = tl.load(w_ptr + cols, mask=mask)
    b = tl.load(b_ptr + cols, mask=mask)
    tl.store(y_ptr + row * stride + cols, diff * rstd * w + b, mask=mask)
    tl.store(mean_ptr + row, mean)                # saved for the backward pass
    tl.store(rstd_ptr + row, rstd)`;

const SOFTMAX = `@triton.jit
def softmax_kernel(x_ptr, y_ptr, stride, N, BLOCK: tl.constexpr):
    row = tl.program_id(0)
    cols = tl.arange(0, BLOCK)
    x = tl.load(x_ptr + row * stride + cols, mask=cols < N, other=-float("inf"))
    x = x - tl.max(x, axis=0)                     # exp(-inf) = 0 in the masked lanes
    e = tl.exp(x)
    tl.store(y_ptr + row * stride + cols, e / tl.sum(e, axis=0), mask=cols < N)`;

export const lesson: LessonContent = {
  id: "e9.3.2",
  minutes: 55,
  links: {
    requires: ["e9.3.1", "l3.5.2"],
    revisits: ["e6.4.2", "e9.1.4", "m11.2.3"],
    foreshadows: ["e9.3.3", "e9.4.1"],
  },

  puzzle: (
    <>
      <p>
        Layer normalisation does a handful of arithmetic operations per element, yet in eager PyTorch a model can spend a noticeable
        share of its time in it. A hand-written replacement that computes the variance as the mean of the squares minus the square of
        the mean is faster, but on some activations it returns a negative variance and the training run produces NaNs. What makes a
        normalisation kernel both fast and correct?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Normalisation and softmax are memory-bound: each element is read, combined with a few statistics of its row, and written. Speed
        therefore comes from touching memory as few times as possible, which means one program per row that loads the row once, keeps it
        in registers while it computes the statistics, and writes the result once. Correctness comes from two details that a fused
        kernel must get right by hand: masked lanes must not contaminate the statistics, and the variance must be computed from
        deviations, not from a difference of two large sums.
      </p>
      <VarianceCancellationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="row-wise fused kernels">
        <p>
          Lesson e6.4.2 counted the traffic of an unfused chain of elementwise operations: every intermediate tensor is written and read
          back. A Triton program fuses such a chain trivially, since it loads its block, applies every operation to values already in
          registers, and stores once. A row-wise reduction is fused the same way when the whole row fits in one block: the program
          loads a row of N values into a block of length BLOCK = next power of two &#8805; N, reduces it with <C>tl.sum</C> or{" "}
          <C>tl.max</C> (which lower to the warp shuffles of e9.1.4), and uses the results on the same registers.
        </p>
        <Code>{SOFTMAX}</Code>
        <Code>{LN}</Code>
        <p>
          The <C>other</C> value of a masked load must be the identity of the reduction that follows: <M>{"-\\infty"}</M> for a maximum,
          0 for a sum. Even then, lanes that are neutral for one reduction can be wrong for the next: after subtracting the mean, the
          padded zeros become <M>{"-\\mu"}</M>, so the layer norm kernel masks the deviations again with <C>tl.where</C>. The Python
          below simulates one program on one row, padding to BLOCK exactly as the masked loads do.
        </p>
        <Code>{ROWS}</Code>
      </Definition>

      <Definition title="rows longer than a block">
        <p>
          When a row is too long for one block, a program loops over it in chunks. For each chunk it computes the count, mean and sum of
          squared deviations <M>{"(n, \\mu, M_2)"}</M>, and merges them into a running triple (<C>chunk_stats</C>,{" "}
          <C>combine_stats</C>). A second loop normalises and stores. The row is now read twice, so the kernel moves three row-sized
          tensors instead of two, which is still far better than unfused code.
        </p>
        <Code>{CHUNKS}</Code>
      </Definition>

      <Theorem title="merging statistics (Chan, Golub and LeVeque)">
        <p>
          If two disjoint sets have statistics <M>{"(n_a, \\mu_a, M_a)"}</M> and <M>{"(n_b, \\mu_b, M_b)"}</M>, with{" "}
          <M>{"M = \\sum (x - \\mu)^2"}</M>, then their union has <M>{"n = n_a + n_b"}</M>,{" "}
          <M>{"\\mu = \\mu_a + \\delta n_b / n"}</M> and <M>{"M = M_a + M_b + \\delta^2 n_a n_b / n"}</M>, where{" "}
          <M>{"\\delta = \\mu_b - \\mu_a"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The mean of the union is the weighted mean <M>{"(n_a\\mu_a + n_b\\mu_b)/n = \\mu_a + \\delta n_b/n"}</M>. For set a, expanding
          about <M>{"\\mu_a"}</M> gives <M>{"\\sum_a (x-\\mu)^2 = M_a + n_a(\\mu_a - \\mu)^2"}</M>, because the cross term{" "}
          <M>{"2(\\mu_a - \\mu)\\sum_a (x - \\mu_a)"}</M> vanishes; likewise for b. Since <M>{"\\mu - \\mu_a = \\delta n_b/n"}</M> and{" "}
          <M>{"\\mu_b - \\mu = \\delta n_a/n"}</M>, the two correction terms add to{" "}
          <M>{"\\delta^2 (n_a n_b^2 + n_b n_a^2)/n^2 = \\delta^2 n_a n_b / n"}</M>. Every term is a sum of squares of deviations or a
          product of counts, so nothing large is subtracted; merging one element at a time is Welford&apos;s update.
        </p>
      </Proof>

      <Remark title="numerics">
        <p>
          The one-pass formula <M>{"\\operatorname{var} = \\overline{x^2} - \\bar{x}^2"}</M> subtracts two numbers of size{" "}
          <M>{"\\bar{x}^2"}</M> to get one of size <M>{"\\sigma^2"}</M>; in float32, with about seven significant digits, the result
          is noise once <M>{"\\bar{x}^2/\\sigma^2"}</M> approaches <M>{"10^7"}</M>, as the figure shows for a mean of 1000. Fused kernels
          therefore subtract the mean before squaring, accumulate in float32 even when the tensors are bfloat16, and store the mean and
          reciprocal standard deviation of each row so that the backward pass need not recompute them. RMS normalisation has no mean to
          subtract and no such hazard.
        </p>
      </Remark>

      <Remark title="shape matters">
        <p>
          One program per row suits rows of a few thousand elements. Very short rows leave most of a program&apos;s threads idle, so
          kernels then process several rows per program; very long rows spill registers, so kernels switch to chunks. The best block size
          and number of warps depend on N, which is why such kernels are autotuned (e9.3.3).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Eager PyTorch runs normalisation as several kernels, each reading and writing a full tensor; one fused program per row reads
          the input once and writes the output once. The NaNs came from the one-pass variance: activations with a large mean relative to
          their spread make the two sums agree to more digits than float32 holds, the difference becomes negative, and its square root is
          NaN. Subtracting the mean first, or merging chunk statistics with the theorem, removes the cancellation.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "passes",
      rung: "check",
      prompt: (
        <p>
          Unfused softmax over a large matrix runs five kernels: row maximum (reads the matrix), subtract (reads and writes), exponential
          (reads and writes), row sum (reads) and divide (reads and writes). Ignoring the small per-row vectors, how many times more bytes
          does it move than a fused kernel that reads the matrix once and writes it once?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
    {
      key: "ln",
      rung: "check",
      prompt: (
        <p>
          Layer normalisation with weight 1, bias 0 and eps 0 is applied to the row [1, 2, 3, 6]. What is the output for the element 6?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.604, tolerance: 0.001 },
    },
    {
      key: "other",
      rung: "apply",
      prompt: (
        <p>
          A kernel computes the maximum of each row with <C>tl.max</C> after a masked load. The rows contain negative numbers. Which{" "}
          <C>other</C> value gives the right answer?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ['-float("inf")', "0.0", "The first element of the row", "Any value, since masked lanes are ignored by tl.max"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def softmax_block(x, BLOCK):
    row = x + [-math.inf] * (BLOCK - len(x))      # masked lanes load -inf
    m = max(row)
    e = [math.exp(v - m) for v in row]            # exp(-inf) = 0
    s = sum(e)
    return [v / s for v in e[:len(x)]]

def layer_norm_block(x, w, b, BLOCK, eps=1e-5):
    n = len(x)
    row = x + [0.0] * (BLOCK - n)                 # masked lanes load 0
    mean = sum(row) / n
    diff = [v - mean if i < n else 0.0 for i, v in enumerate(row)]
    var = sum(d * d for d in diff) / n
    rstd = 1 / math.sqrt(var + eps)
    return [d * rstd * wi + bi for d, wi, bi in zip(diff, w, b)]

def rms_norm_block(x, w, BLOCK, eps=1e-6):
    row = x + [0.0] * (BLOCK - len(x))
    rstd = 1 / math.sqrt(sum(v * v for v in row) / len(x) + eps)
    return [v * rstd * wi for v, wi in zip(row, w)]

y = layer_norm_block([1.0, 3.0], [1.0, 1.0], [0.0, 0.5], 4, 0.0)
print([round(v, 3) for v in softmax_block([1.0, 2.0, 3.0], 4)], [round(v, 3) for v in y], [round(v, 3) for v in rms_norm_block([3.0, 4.0], [1.0, 2.0], 4, 0.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.09, 0.245, 0.665] [-1.0, 1.5] [0.849, 2.263]",
          "[0.087, 0.237, 0.644] [-1.0, 1.5] [0.849, 2.263]",
          "[0.09, 0.245, 0.665] [-0.447, 0.947] [0.849, 2.263]",
          "[0.09, 0.245, 0.665] [-1.0, 1.5] [0.6, 1.6]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def chunk_stats(xs):
    n = len(xs)
    mean = sum(xs) / n
    return (n, mean, sum((v - mean) ** 2 for v in xs))

def combine_stats(a, b):
    na, ma, qa = a
    nb, mb, qb = b
    n = na + nb
    d = mb - ma
    return (n, ma + d * nb / n, qa + qb + d * d * na * nb / n)

def layer_norm_chunked(x, w, b, BLOCK, eps=1e-5):
    st = chunk_stats(x[:BLOCK])
    for i in range(BLOCK, len(x), BLOCK):
        st = combine_stats(st, chunk_stats(x[i:i + BLOCK]))
    n, mean, q = st
    rstd = (q / n + eps) ** -0.5
    return [(v - mean) * rstd * wi + bi for v, wi, bi in zip(x, w, b)]

s = combine_stats(chunk_stats([1.0, 3.0]), chunk_stats([5.0]))
print(chunk_stats([2.0, 4.0]), s, [round(v, 3) for v in layer_norm_chunked([0.0, 2.0, 4.0], [1.0] * 3, [0.0] * 3, 2, 0.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2, 3.0, 2.0) (3, 3.0, 8.0) [-1.225, 0.0, 1.225]",
          "(2, 3.0, 2.0) (3, 3.0, 2.0) [-1.225, 0.0, 1.225]",
          "(2, 3.0, 1.0) (3, 3.0, 8.0) [-1.225, 0.0, 1.225]",
          "(2, 3.0, 2.0) (3, 2.5, 8.0) [-1.0, 0.0, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax_block(x, BLOCK)</C>, <C>layer_norm_block(x, w, b, BLOCK, eps=1e-5)</C> and{" "}
          <C>rms_norm_block(x, w, BLOCK, eps=1e-6)</C>. Each pads the row to BLOCK as a masked load would (with -inf for softmax and 0
          for the norms), computes the row&apos;s statistics over the valid elements only, and returns the len(x) outputs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax_block(x, BLOCK):
    return [1.0 / len(x)] * len(x)

def layer_norm_block(x, w, b, BLOCK, eps=1e-5):
    return list(x)

def rms_norm_block(x, w, BLOCK, eps=1e-6):
    return list(x)
`,
        solution: ROWS,
        tests: [
          { name: "softmax", code: `import math\ny = softmax_block([0.0, 0.0], 8)\nassert len(y) == 2 and all(abs(v - 0.5) < 1e-9 for v in y)\nassert abs(softmax_block([1000.0, 1000.0 + math.log(3)], 2)[1] - 0.75) < 1e-9` },
          { name: "norms", code: `y = layer_norm_block([2.0, 4.0, 6.0], [1.0] * 3, [0.0] * 3, 8, 0.0)\nassert all(abs(a - e) < 1e-6 for a, e in zip(y, [-1.5 ** 0.5, 0.0, 1.5 ** 0.5])) and len(y) == 3\nz = rms_norm_block([1.0, -1.0, 1.0], [2.0] * 3, 4, 0.0)\nassert all(abs(a - e) < 1e-9 for a, e in zip(z, [2.0, -2.0, 2.0])) and len(z) == 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chunk_stats(xs)</C>, returning (count, mean, sum of squared deviations); <C>combine_stats(a, b)</C>, merging two such
          triples by the theorem; and <C>layer_norm_chunked(x, w, b, BLOCK, eps=1e-5)</C>, which gathers the statistics chunk by chunk
          and then normalises.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def chunk_stats(xs):
    return (len(xs), 0.0, 0.0)

def combine_stats(a, b):
    return a

def layer_norm_chunked(x, w, b, BLOCK, eps=1e-5):
    return list(x)
`,
        solution: CHUNKS,
        tests: [
          { name: "stats", code: `assert chunk_stats([1.0, 2.0, 3.0, 4.0]) == (4, 2.5, 5.0)\nassert combine_stats((2, 0.0, 2.0), (2, 4.0, 2.0)) == (4, 2.0, 20.0)` },
          { name: "chunked", code: `x = [float((7 * i) % 11) for i in range(10)]\nm = sum(x) / 10\nr = (sum((v - m) ** 2 for v in x) / 10 + 1e-5) ** -0.5\ny = layer_norm_chunked(x, [2.0] * 10, [1.0] * 10, 3)\nassert len(y) == 10 and all(abs(a - ((v - m) * r * 2 + 1)) < 1e-9 for a, v in zip(y, x))` },
        ],
      },
    },
    {
      key: "merge",
      rung: "stretch",
      prompt: (
        <p>
          A long row is processed in two chunks. The first has 4 elements with mean 2 and sum of squared deviations 8; the second has 4
          elements with mean 6 and sum of squared deviations 8. What is the population variance of the whole row?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every kernel in this lesson has a block size and a number of warps that suit some row lengths and not others. The next lesson
        lets Triton choose them by timing candidates, and shows what autotuning can and cannot fix.
      </p>
    </>
  ),
};
