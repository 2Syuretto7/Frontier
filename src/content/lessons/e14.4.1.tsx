import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BucketPaddingViz } from "@/components/viz/BucketPaddingViz";
import type { LessonContent } from "@/lib/types";

const SHAPES = `import bisect

def bucket(n, buckets):
    i = bisect.bisect_left(buckets, n)                     # buckets sorted ascending
    if i == len(buckets):
        raise ValueError("longer than the largest bucket")
    return buckets[i]

def compiled_shapes(lengths, buckets=None):
    if buckets is None:
        return len(set(lengths))                           # one program per distinct static shape
    return len({bucket(n, buckets) for n in lengths})

def pad_waste(lengths, buckets):
    padded = sum(bucket(n, buckets) for n in lengths)
    return (padded - sum(lengths)) / padded`;

const FUSION = `ELEMENTWISE = {"add", "sub", "mul", "exp", "gelu", "convert"}

def fusion_kind(p, c):
    if p in ELEMENTWISE and c in ELEMENTWISE:
        return "loop"
    if p in ELEMENTWISE and c == "reduce":
        return "input"                                     # producers computed as the reduction reads
    if p == "dot" and c in ELEMENTWISE:
        return "output"                                    # epilogue applied before the dot writes
    return None

def fuse_chain(chain):
    groups = [[chain[0]]]
    for p, c in zip(chain, chain[1:]):
        g = groups[-1]
        if fusion_kind(p, c) and not (c == "reduce" and "dot" in g):
            g.append(c)
        else:
            groups.append([c])
    return groups

def traffic(chain, x_bytes, out_bytes):
    total, i, inp = 0, 0, x_bytes
    for g in fuse_chain(chain):
        i += len(g)
        total += inp + out_bytes[i - 1]                    # each kernel reads its input, writes its last output
        inp = out_bytes[i - 1]
    return total`;

export const lesson: LessonContent = {
  id: "e14.4.1",
  minutes: 45,
  links: {
    requires: ["e14.3.2"],
    revisits: ["e14.1.1", "e14.2.1", "e14.2.3"],
    foreshadows: ["e14.5.1"],
  },

  puzzle: (
    <>
      <p>
        A JAX function runs in a few milliseconds on a TPU, yet the first call takes forty seconds. Serving it to
        requests of varying length, the service spends more time compiling than computing. The same compiler that
        makes the steady state fast insists on knowing every tensor&apos;s exact shape before it generates a single
        instruction. Why does XLA demand static shapes, and how do people live with that demand?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        XLA compiles a whole program at once, from a graph in which every shape is a constant. Knowing the shapes lets
        it decide fusions, tile sizes and the exact address of every buffer ahead of time, with no allocation or
        dispatch decisions left for run time. The price is that a new shape is a new program. Systems built on XLA
        therefore pad inputs to a few fixed sizes, called buckets, trading some wasted arithmetic for a bounded number
        of compilations.
      </p>
      <BucketPaddingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="HLO and the XLA pipeline">
        <p>
          A front end (JAX, TensorFlow or PyTorch/XLA) traces the program, as in e14.1.1, and emits StableHLO, a
          versioned dialect of about a hundred operations: elementwise arithmetic, dot_general, reduce, broadcast,
          reshape, transpose, gather, scatter, while and conditional, and collectives such as all-reduce. Every value
          has a static shape and element type. XLA lowers it to its internal HLO and runs target-independent passes
          (simplification, common-subexpression elimination, layout assignment) and then target-specific ones: fusion,
          buffer assignment, and code generation through LLVM for GPUs and CPUs or a dedicated back end for TPUs.
          Because the whole program is visible, buffer assignment can plan every allocation ahead of time, as in
          e14.2.3, into one preallocated region.
        </p>
      </Definition>

      <Definition title="static shapes and buckets">
        <p>
          A compiled program is specialised to its input shapes, so the number of compilations is the number of
          distinct shapes seen (<C>compiled_shapes</C>). Choosing a sorted list of bucket sizes and padding each input to
          the smallest bucket at least as large (<C>bucket</C>) caps that number at the number of buckets, at the cost of
          computing on padding, measured as the fraction of computed positions that are padding (<C>pad_waste</C>).
          Padded positions must be masked so they do not change the result, for example in attention and in losses.
        </p>
        <Code>{SHAPES}</Code>
      </Definition>

      <Theorem title="geometric buckets">
        <p>
          Let the buckets be <M>{"b_0 < b_1 < \\dots < b_m"}</M> with <M>{"b_{i+1} \\le r\\,b_i"}</M> for some{" "}
          <M>{"r > 1"}</M>. Then every request of length n with <M>{"b_0 < n \\le b_m"}</M> is padded to fewer than{" "}
          <M>{"r\\,n"}</M> positions, so the padding is less than a fraction <M>{"1 - 1/r"}</M> of what is computed for it.
          With <M>{"b_{i+1} = r\\,b_i"}</M> exactly, the number of buckets needed to cover lengths up to L is{" "}
          <M>{"\\lceil \\log_r (L / b_0) \\rceil + 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The request goes to the smallest <M>{"b_{i+1} \\ge n"}</M>, and since <M>{"n > b_0"}</M>, the bucket below it
          satisfies <M>{"b_i < n"}</M>. Hence <M>{"b_{i+1} \\le r\\,b_i < r\\,n"}</M>, and the padded fraction{" "}
          <M>{"(b_{i+1} - n)/b_{i+1} = 1 - n/b_{i+1}"}</M> is less than <M>{"1 - 1/r"}</M>. For the count, the largest
          bucket <M>{"b_0 r^m"}</M> must reach L, so m is the smallest integer with <M>{"r^m \\ge L/b_0"}</M>, and the
          buckets number m + 1. Powers of two give at most half waste per request with a logarithmic number of programs;
          equal-width buckets waste almost everything on short requests unless they are numerous.
        </p>
      </Proof>

      <Definition title="fusion kinds">
        <p>
          XLA&apos;s fusion pass merges a producer into its consumer when the result can be computed in one kernel
          without writing the intermediate to memory. Elementwise operations chain into loop fusions; elementwise
          producers feeding a reduction form input fusions, computed as the reduction reads them; and on GPUs an
          elementwise epilogue can be applied to a matrix product before it is written, an output fusion. A reduction
          ends a fusion, and a kernel built around a matrix product does not also absorb a reduction. The code models a
          chain of operations under these simplified rules (<C>fusion_kind</C>, <C>fuse_chain</C>) and counts the bytes
          each resulting kernel reads and writes (<C>traffic</C>), as in e14.2.1.
        </p>
        <Code>{FUSION}</Code>
      </Definition>

      <Example title="what this looks like in JAX">
        <p>
          <C>jax.jit</C> traces a function on abstract values with shapes and types only, and caches compiled programs
          keyed on those shapes and on any arguments declared static. Calling it with a new sequence length compiles
          again, which the log reports if compilation logging is enabled. Serving systems built on JAX pad batches to
          a fixed batch size and sequence buckets; training pipelines pack documents into fixed-length sequences, which
          avoids padding altogether. The dumped HLO, after optimisation, shows each fusion as a single instruction with
          a fused computation inside it.
        </p>
      </Example>

      <Remark title="dynamic shapes">
        <p>
          XLA has limited support for dynamic dimensions with a static upper bound, where the program is compiled for
          the bound and carries the actual size at run time. Compilers that start from eager frameworks take the other
          path: TorchInductor, in the next lesson, can compile with symbolic sizes and guards, so one program serves
          many lengths. The static approach buys predictability, which is why it suits TPUs, whose compiled programs
          also schedule the collectives that the last chapter will partition automatically.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "waste",
      rung: "check",
      prompt: (
        <p>
          A service sees one request of each length from 1 to 1000 tokens and pads each to the next of the buckets 16,
          32, 64, 128, 256, 512 and 1024. What fraction of all computed positions is padding? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.258, tolerance: 0.0005 },
    },
    {
      key: "bytes",
      rung: "check",
      prompt: (
        <p>
          Under the fusion rules of this lesson, a chain applies convert, dot, add, gelu, dot, add, sub, exp, reduce, mul
          in turn to a 16 MB input. Their outputs are 16, 32, 64, 64, 32, 32, 32, 32, 1 and 1 MB. Counting only each
          kernel&apos;s read of its input and write of its final output, how many megabytes move to and from memory?
        </p>
      ),
      answer: { kind: "numeric", value: 243, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does XLA compile a separate program for each distinct input shape?</p>,
      answer: {
        kind: "choice",
        options: [
          "Fusion decisions, tiling and buffer offsets are all computed from the exact shapes, so they are baked into the program",
          "HLO has no operations that accept tensors",
          "Shapes are needed only to print the program, but caching is keyed on them for safety",
          "TPUs cannot execute loops",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import bisect

def bucket(n, buckets):
    i = bisect.bisect_left(buckets, n)                     # buckets sorted ascending
    if i == len(buckets):
        raise ValueError("longer than the largest bucket")
    return buckets[i]

def compiled_shapes(lengths, buckets=None):
    if buckets is None:
        return len(set(lengths))                           # one program per distinct static shape
    return len({bucket(n, buckets) for n in lengths})

def pad_waste(lengths, buckets):
    padded = sum(bucket(n, buckets) for n in lengths)
    return (padded - sum(lengths)) / padded

print(bucket(5, [4, 8, 16]), compiled_shapes([3, 5, 6, 9]), compiled_shapes([3, 5, 6, 9], [4, 8, 16]))
print(pad_waste([3, 5], [4, 8]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8 4 3\n0.3333333333333333",
          "4 4 3\n0.3333333333333333",
          "8 3 3\n0.3333333333333333",
          "8 4 3\n0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`ELEMENTWISE = {"add", "sub", "mul", "exp", "gelu", "convert"}

def fusion_kind(p, c):
    if p in ELEMENTWISE and c in ELEMENTWISE:
        return "loop"
    if p in ELEMENTWISE and c == "reduce":
        return "input"                                     # producers computed as the reduction reads
    if p == "dot" and c in ELEMENTWISE:
        return "output"                                    # epilogue applied before the dot writes
    return None

def fuse_chain(chain):
    groups = [[chain[0]]]
    for p, c in zip(chain, chain[1:]):
        g = groups[-1]
        if fusion_kind(p, c) and not (c == "reduce" and "dot" in g):
            g.append(c)
        else:
            groups.append([c])
    return groups

def traffic(chain, x_bytes, out_bytes):
    total, i, inp = 0, 0, x_bytes
    for g in fuse_chain(chain):
        i += len(g)
        total += inp + out_bytes[i - 1]                    # each kernel reads its input, writes its last output
        inp = out_bytes[i - 1]
    return total

print(fuse_chain(["dot", "add", "exp", "reduce", "mul"]))
print(traffic(["add", "mul", "reduce"], 8, [8, 8, 1]), traffic(["reduce", "add"], 8, [1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[['dot', 'add', 'exp'], ['reduce'], ['mul']]\n9 11",
          "[['dot', 'add', 'exp', 'reduce'], ['mul']]\n9 11",
          "[['dot', 'add', 'exp'], ['reduce', 'mul']]\n9 10",
          "[['dot'], ['add', 'exp', 'reduce'], ['mul']]\n17 11",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bucket(n, buckets)</C>, the smallest bucket at least n, raising ValueError if there is none;{" "}
          <C>compiled_shapes(lengths, buckets=None)</C>, the number of distinct shapes compiled with or without buckets;
          and <C>pad_waste(lengths, buckets)</C>, the fraction of padded positions that are padding.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import bisect

def bucket(n, buckets):
    return n

def compiled_shapes(lengths, buckets=None):
    return len(lengths)

def pad_waste(lengths, buckets):
    return 0.0
`,
        solution: SHAPES,
        tests: [
          { name: "bucket", code: `assert bucket(4, [4, 8]) == 4 and bucket(1, [2]) == 2 and compiled_shapes([7, 7, 2]) == 2 and compiled_shapes([1, 2, 30], [2, 32]) == 2` },
          { name: "waste", code: `assert abs(pad_waste([1, 2, 3], [4]) - 0.5) < 1e-12 and pad_waste([2, 2], [2, 4]) == 0 and bucket(8, [4, 8, 16]) == 8` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fusion_kind(p, c)</C>, returning &quot;loop&quot;, &quot;input&quot;, &quot;output&quot; or None by the
          rules of this lesson; <C>fuse_chain(chain)</C>, grouping a chain greedily from the left, never adding a reduce
          to a group containing a dot; and <C>traffic(chain, x_bytes, out_bytes)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `ELEMENTWISE = {"add", "sub", "mul", "exp", "gelu", "convert"}

def fusion_kind(p, c):
    return None

def fuse_chain(chain):
    return [[op] for op in chain]

def traffic(chain, x_bytes, out_bytes):
    return 0
`,
        solution: FUSION,
        tests: [
          { name: "kinds", code: `assert [fusion_kind("mul", "add"), fusion_kind("exp", "reduce"), fusion_kind("dot", "gelu"), fusion_kind("reduce", "add"), fusion_kind("add", "dot")] == ["loop", "input", "output", None, None]` },
          { name: "chain", code: `assert fuse_chain(["dot", "dot", "sub", "reduce"]) == [["dot"], ["dot", "sub"], ["reduce"]] and fuse_chain(["mul", "exp", "reduce"]) == [["mul", "exp", "reduce"]]` },
          { name: "bytes", code: `assert traffic(["exp", "reduce", "add"], 4, [4, 2, 2]) == 10 and traffic(["dot", "reduce"], 3, [5, 1]) == 14` },
        ],
      },
    },
    {
      key: "tradeoff",
      rung: "stretch",
      prompt: (
        <p>
          Lengths are uniform on 1 to 2048, and a service uses k equal-width buckets, with k a power of two. Each bucket
          costs one 30-second compilation, and over its lifetime the padding costs 10 seconds for every token of
          expected padding per request, the expected padding being (2048/k − 1)/2 tokens. What is the minimum total cost
          in seconds?
        </p>
      ),
      answer: { kind: "numeric", value: 1115, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        XLA starts from a static graph. The next lesson looks at TorchInductor, which starts from eager PyTorch,
        captures graphs with guards, and generates Triton kernels.
      </p>
    </>
  ),
};
