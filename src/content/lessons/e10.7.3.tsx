import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShardPropViz } from "@/components/viz/ShardPropViz";
import type { LessonContent } from "@/lib/types";

const PROPAGATE = `def reshard(src, dst):
    (s, p), (d, q) = src, dst                       # a layout is (spec, axis of a pending sum or None)
    if q is not None and q != p:
        raise ValueError('a layout change cannot create a partial sum')
    if p is not None and q is None:
        return 'reduce_scatter' if any(d) else 'all_reduce'
    if s == d:
        return 'none'
    if not any(s):
        return 'slice'                              # each device keeps its block; no communication
    if not any(d):
        return 'all_gather'
    return 'all_to_all'                             # sharded along one dimension to sharded along another

def _move(out, layout, target):
    c = reshard(layout, target)
    if c != 'none':
        out.append(c)
    return target

def run(layout, ops):
    out = []
    for op in ops:
        spec, partial = layout
        if op[0] == 'constrain':
            layout = _move(out, layout, op[1])
        elif op[0] == 'pointwise':
            if partial is not None:                 # a nonlinearity needs the complete sum
                layout = _move(out, layout, (spec, None))
        else:                                       # ('matmul', weight spec): x @ w
            w = op[1]
            if partial is not None:                 # kept simple: complete sums before any product
                layout = _move(out, layout, (spec, None))
            if layout[0][1] != w[0]:                # the contracted dimension must match the weight's rows
                layout = _move(out, layout, ((layout[0][0], w[0]), None))
            layout = ((layout[0][0], w[1]), w[0])   # contracting over a sharded axis leaves partial sums
    return out, layout`;

const COSTS = `def coll_bytes(kind, size, n):
    frac = (n - 1) / n                              # per device, for an array of size bytes in total
    return {'all_reduce': 2 * frac * size, 'all_gather': frac * size, 'reduce_scatter': frac * size,
            'all_to_all': frac * size / n, 'slice': 0, 'none': 0}[kind]

def plan_bytes(collectives, size, n):
    return sum(coll_bytes(c, size, n) for c in collectives)

def placements(spec, partial):
    if partial is not None:
        return 'Partial()'                          # PyTorch DTensor names on a one-axis mesh
    for i, a in enumerate(spec):
        if a is not None:
            return f'Shard({i})'
    return 'Replicate()'`;

const DTENSOR = `from torch.distributed.tensor import distribute_tensor, Shard, Replicate
from torch.distributed.tensor.parallel import parallelize_module, ColwiseParallel, RowwiseParallel

tp = init_device_mesh("cuda", (8,), mesh_dim_names=("tp",))
w = distribute_tensor(torch.randn(4096, 16384), tp, [Shard(1)])   # columns split: spec (None, 'tp')
parallelize_module(mlp, tp, {"up": ColwiseParallel(), "down": RowwiseParallel()})
# RowwiseParallel's output is Partial() until it is redistributed: to Replicate() by an
# all-reduce, or to Shard(0) by a reduce-scatter for sequence parallelism.`;

export const lesson: LessonContent = {
  id: "e10.7.3",
  minutes: 45,
  links: {
    requires: ["e6.5.4", "e10.7.1", "e10.4.2"],
    revisits: ["e8.2.2", "e10.3.2"],
    foreshadows: ["e10.8.1"],
  },

  puzzle: (
    <>
      <p>
        Hand-written tensor parallelism places every all-reduce and all-gather explicitly, and changing the layout means rewriting the
        model. Systems such as JAX&apos;s GSPMD and PyTorch&apos;s DTensor instead let the programmer annotate how a few tensors are
        laid out and work out the communication themselves. How does a compiler decide which collective to insert, and why can a
        single wrong annotation quietly multiply the traffic?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every tensor carries a layout: which dimensions are split over which mesh axis, and whether it is a partial sum still waiting
        to be added up. Each operation has rules for the layouts it accepts and produces. When an operation needs a different layout
        from the one its input has, the compiler inserts the collective that converts between them. The collective is determined by
        the pair of layouts, so annotations decide communication as surely as hand-written calls, only less visibly.
      </p>
      <ShardPropViz />
    </>
  ),

  theory: (
    <>
      <Definition title="layouts and resharding">
        <p>
          On a one-axis mesh, a layout of a matrix is a spec, one entry per dimension, None or the axis, plus an optional pending sum
          over the axis; PyTorch calls these Replicate, Shard(i) and Partial (<C>placements</C>). Converting between layouts needs
          (<C>reshard</C>): nothing if they agree; nothing but local slicing from replicated to sharded; an all-gather from sharded to
          replicated; an all-to-all from sharded along one dimension to another; an all-reduce from a partial sum to replicated; and a
          reduce-scatter from a partial sum to sharded.
        </p>
        <Code>{DTENSOR}</Code>
      </Definition>

      <Theorem title="propagation through a matrix product">
        <p>
          For <M>{"y = xW"}</M> with x of spec (a, b) and W of spec (b, c), a ≠ c, the output has spec (a, c), and it is a partial
          sum over b if b is an axis. If x&apos;s second dimension is laid out differently from W&apos;s first, x must be resharded
          first. A non-linear element-wise operation needs complete values, so a pending sum must be resolved before it.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first part is the sharded multiply of e6.5.4: each device multiplies its blocks, and if the contracted dimension is split
          each device holds one term of the sum. A non-linear function does not commute with summation,{" "}
          <M>{"\\phi(u + v) \\ne \\phi(u) + \\phi(v)"}</M> in general, so applying it to partial sums would be wrong; a linear
          operation could be applied to them, though the pass below completes them before any product for simplicity. The pass (<C>run</C>) applies these rules in order and records each collective.
        </p>
        <Code>{PROPAGATE}</Code>
      </Proof>

      <Theorem title="what each conversion costs">
        <p>
          For an array of S bytes on n devices, each device sends <M>{"(n-1)S/n"}</M> for an all-gather or reduce-scatter,{" "}
          <M>{"2(n-1)S/n"}</M> for an all-reduce, and <M>{"(n-1)S/n^2"}</M> for an all-to-all (<C>coll_bytes</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The first three are the ring costs of e8.2.2. In an all-to-all each device holds S/n bytes and keeps 1/n of them, sending the
          rest. The cost of a plan is the sum over its collectives (<C>plan_bytes</C>).
        </p>
        <Code>{COSTS}</Code>
      </Proof>

      <Remark title="annotate few, check many">
        <p>
          Programmers annotate weights and a few activations; the compiler propagates layouts to everything else, choosing among options
          by estimated cost when several are legal. Because the inserted collectives are invisible in the source, the reliable check is
          the compiled program: list its collectives and their sizes, and compare with what the design intended. An unexpected
          all-gather of a large activation is the usual sign of a missing or wrong annotation.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The compiler compares the layout an operation needs with the layout it has and inserts the conversion, which is fixed by the
          two layouts. Annotating both MLP weights by columns is legal, but the second product then needs the hidden activation whole,
          so it is gathered, four times larger than the output whose all-reduce the correct annotation needed. Nothing fails; the
          step is just slower.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "a2a",
      rung: "check",
      prompt: (
        <p>
          An 8192 by 8192 bf16 matrix is split by rows over 8 devices and must be split by columns instead. How many megabytes does each
          device send? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 14.68, tolerance: 0.01 },
    },
    {
      key: "count",
      rung: "check",
      prompt: (
        <p>
          A replicated input passes through x @ W₁, gelu and h @ W₂ to a replicated output, with both weights annotated (None,
          &apos;tp&apos;). How many collectives does propagation insert?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0 },
    },
    {
      key: "gelu",
      rung: "apply",
      prompt: <p>Why must a partial sum be completed before gelu but not before a further matrix product by a replicated weight?</p>,
      answer: {
        kind: "choice",
        options: [
          "A matrix product is linear, so it can be applied to each term of the sum, while gelu is not",
          "gelu runs on different devices",
          "Partial sums cannot be stored in bf16",
          "The matrix product would also need the sum completed; both must wait",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def reshard(src, dst):
    (s, p), (d, q) = src, dst                       # a layout is (spec, axis of a pending sum or None)
    if q is not None and q != p:
        raise ValueError('a layout change cannot create a partial sum')
    if p is not None and q is None:
        return 'reduce_scatter' if any(d) else 'all_reduce'
    if s == d:
        return 'none'
    if not any(s):
        return 'slice'                              # each device keeps its block; no communication
    if not any(d):
        return 'all_gather'
    return 'all_to_all'                             # sharded along one dimension to sharded along another

def _move(out, layout, target):
    c = reshard(layout, target)
    if c != 'none':
        out.append(c)
    return target

def run(layout, ops):
    out = []
    for op in ops:
        spec, partial = layout
        if op[0] == 'constrain':
            layout = _move(out, layout, op[1])
        elif op[0] == 'pointwise':
            if partial is not None:                 # a nonlinearity needs the complete sum
                layout = _move(out, layout, (spec, None))
        else:                                       # ('matmul', weight spec): x @ w
            w = op[1]
            if partial is not None:                 # kept simple: complete sums before any product
                layout = _move(out, layout, (spec, None))
            if layout[0][1] != w[0]:                # the contracted dimension must match the weight's rows
                layout = _move(out, layout, ((layout[0][0], w[0]), None))
            layout = ((layout[0][0], w[1]), w[0])   # contracting over a sharded axis leaves partial sums
    return out, layout

mlp = [('matmul', (None, 'x')), ('pointwise',), ('matmul', ('x', None))]
print(reshard(((None, 'x'), None), (('x', None), None)), reshard(((None, None), 'x'), (('x', None), None)), run(((None, None), None), mlp))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "all_to_all reduce_scatter ([], ((None, None), 'x'))",
          "all_to_all reduce_scatter (['all_reduce'], ((None, None), None))",
          "all_gather reduce_scatter ([], ((None, None), 'x'))",
          "all_to_all all_reduce ([], ((None, None), 'x'))",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def coll_bytes(kind, size, n):
    frac = (n - 1) / n                              # per device, for an array of size bytes in total
    return {'all_reduce': 2 * frac * size, 'all_gather': frac * size, 'reduce_scatter': frac * size,
            'all_to_all': frac * size / n, 'slice': 0, 'none': 0}[kind]

def plan_bytes(collectives, size, n):
    return sum(coll_bytes(c, size, n) for c in collectives)

def placements(spec, partial):
    if partial is not None:
        return 'Partial()'                          # PyTorch DTensor names on a one-axis mesh
    for i, a in enumerate(spec):
        if a is not None:
            return f'Shard({i})'
    return 'Replicate()'

x = coll_bytes('all_to_all', 64, 4)
print(x, coll_bytes('all_reduce', 64, 4), plan_bytes(['all_gather', 'all_gather'], 64, 4), placements(('x', None), None), placements((None, None), 'x'))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "12.0 96.0 96.0 Shard(0) Partial()",
          "48.0 96.0 96.0 Shard(0) Partial()",
          "12.0 48.0 96.0 Shard(0) Partial()",
          "12.0 96.0 96.0 Shard(1) Partial()",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With layouts as (spec, partial axis or None) for matrices on one mesh axis, write <C>reshard(src, dst)</C>, returning
          &apos;none&apos;, &apos;slice&apos;, &apos;all_gather&apos;, &apos;all_to_all&apos;, &apos;all_reduce&apos; or
          &apos;reduce_scatter&apos;; a helper <C>_move(out, layout, target)</C> that records any collective; and{" "}
          <C>run(layout, ops)</C> for ops (&apos;matmul&apos;, weight spec), (&apos;pointwise&apos;,) and (&apos;constrain&apos;,
          layout), returning the collectives in order and the final layout.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def reshard(src, dst):
    return 'none'

def _move(out, layout, target):
    return target

def run(layout, ops):
    return [], layout
`,
        solution: PROPAGATE,
        tests: [
          { name: "reshard", code: `assert reshard(((None, 'x'), None), ((None, None), None)) == 'all_gather' and reshard(((None, None), None), (('x', None), None)) == 'slice'\nassert reshard(((None, None), 'x'), ((None, None), None)) == 'all_reduce' and reshard((('x', None), None), (('x', None), None)) == 'none'` },
          { name: "run", code: `R = ((None, None), None)\nassert run(R, [('matmul', (None, 'x')), ('matmul', ('x', None)), ('constrain', (('x', None), None))]) == (['reduce_scatter'], (('x', None), None))\nassert run(((None, 'x'), None), [('matmul', ('x', None)), ('pointwise',)]) == (['all_reduce'], R)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>coll_bytes(kind, size, n)</C>, bytes each device sends for each kind including &apos;slice&apos; and
          &apos;none&apos;; <C>plan_bytes(collectives, size, n)</C>; and <C>placements(spec, partial)</C>, the DTensor placement
          name for a one-axis mesh.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def coll_bytes(kind, size, n):
    return size

def plan_bytes(collectives, size, n):
    return 0.0

def placements(spec, partial):
    return 'Replicate()'
`,
        solution: COSTS,
        tests: [
          { name: "bytes", code: `assert coll_bytes('all_gather', 10, 5) == 8.0 and coll_bytes('reduce_scatter', 10, 5) == 8.0\nassert coll_bytes('all_to_all', 50, 5) == 8.0 and coll_bytes('slice', 10, 5) == 0 and plan_bytes([], 10, 2) == 0` },
          { name: "placements", code: `assert placements((None, 'x'), None) == 'Shard(1)' and placements((None, None), None) == 'Replicate()'` },
        ],
      },
    },
    {
      key: "extra",
      rung: "stretch",
      prompt: (
        <p>
          The MLP has 4096 tokens, width 4096 and hidden width 16,384, in bf16 on 4 devices. With both weights annotated by columns
          rather than columns then rows, and a replicated output, how many more megabytes does each device send? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 75.5, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        A run on thousands of GPUs holds its state in thousands of shards laid out by such annotations. The final section keeps that
        state safe, starting with checkpoints that each rank writes in parallel and that can be reloaded on a different mesh.
      </p>
    </>
  ),
};
