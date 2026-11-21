import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShardingPropViz } from "@/components/viz/ShardingPropViz";
import type { LessonContent } from "@/lib/types";

const SPECS = `def local_shape(shape, spec, mesh):
    return tuple(d // mesh[a] if a else d for d, a in zip(shape, spec))

def matmul_out(a_spec, b_spec):
    (m, k), (k2, n) = a_spec, b_spec
    if k != k2:
        raise ValueError("contracting dimensions sharded differently")
    if m and m == n:
        raise ValueError("one mesh axis cannot shard two dimensions")
    return (m, n), k                                       # k set: each device holds a partial sum over k

def propagate(n, edges, known):
    spec = [known.get(i) for i in range(n)]
    changed = True
    while changed:
        changed = False
        for u, v in edges:                                 # elementwise edges: both ends share a sharding
            for a, b in ((u, v), (v, u)):
                if spec[a] is not None and spec[b] is None:
                    spec[b], changed = spec[a], True
                elif spec[a] is not None and spec[b] != spec[a]:
                    raise ValueError(f"conflict between {a} and {b}")
    return spec`;

const COMM = `def all_reduce_bytes(size, n):
    return 2 * (n - 1) / n * size                          # ring: reduce-scatter, then all-gather

def all_gather_bytes(size, n):
    return (n - 1) / n * size                              # size is the full, gathered tensor

def matmul_comm(m, n, out_spec, red, mesh, width):
    if red is None:
        return 0.0
    out = m * n * width
    for a in out_spec:
        if a:
            out //= mesh[a]                                # each device reduces only its own output block
    return all_reduce_bytes(out, mesh[red])`;

export const lesson: LessonContent = {
  id: "e14.5.1",
  minutes: 45,
  links: {
    requires: ["e14.4.3"],
    revisits: ["e10.7.3", "e10.4.1", "e8.2.4", "e6.5.4"],
    foreshadows: ["e14.5.2"],
  },

  puzzle: (
    <>
      <p>
        Megatron-style tensor parallelism, written by hand, needs a collective call placed at exactly the right line of
        every layer, and a different set of calls for every other way of splitting the model. With JAX one annotates
        the weights with a sharding and a mesh, and the compiler produces the same program, collectives included. Where
        does it get the shardings of the thousands of intermediate values nobody annotated, and how does it know where
        communication is needed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each operation constrains how its operands and results can be split. An elementwise operation produces a result
        split like its inputs; a matrix product splits its output rows like the left operand&apos;s rows and its
        columns like the right operand&apos;s columns; if both operands split the contracted dimension the same way,
        every device holds a partial sum. The compiler spreads the few annotations along these rules through the whole
        graph, and where the rules cannot be satisfied it inserts the collective that converts one sharding into
        another.
      </p>
      <ShardingPropViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sharding specs">
        <p>
          A device mesh gives named axes sizes, as in e6.5.4. A sharding spec assigns each tensor dimension either a mesh
          axis, splitting that dimension evenly across the axis, or nothing, replicating it. Each device holds a block
          of the local shape (<C>local_shape</C>). One mesh axis may shard at most one dimension of a tensor, since
          otherwise a device&apos;s block would not be a rectangle of the global tensor.
        </p>
      </Definition>

      <Definition title="propagation">
        <p>
          GSPMD, the partitioner behind XLA&apos;s SPMD mode, takes the annotations as fixed and assigns shardings to the
          other values by applying each operation&apos;s rules forwards and backwards until nothing changes, preferring
          the shardings that need no communication. For a product of an m × k and a k × n matrix, the result has spec
          (row axis of the left, column axis of the right); if the two k dimensions are sharded on the same axis, each
          device computes a partial sum over its slice of k, which must be all-reduced (<C>matmul_out</C>). Elementwise
          operations require equal specs on all sides, which in a graph of elementwise operations spreads a spec along
          every connected component and reports conflicts (<C>propagate</C>).
        </p>
        <Code>{SPECS}</Code>
      </Definition>

      <Theorem title="cost of a ring collective">
        <p>
          On a ring of n devices, an all-gather that assembles a tensor of S bytes from equal shards sends{" "}
          <M>{"(n-1)S/n"}</M> bytes into each device, and an all-reduce of S bytes sends <M>{"2(n-1)S/n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          In the ring all-gather of e8.2.4 each device starts with one shard of S/n bytes and must receive the other
          n − 1, one per step, for <M>{"(n-1)S/n"}</M> in total. An all-reduce is a reduce-scatter followed by an
          all-gather. The reduce-scatter moves the same amount: in each of n − 1 steps every device receives one chunk
          of S/n, adds its own contribution and passes it on, ending with one fully reduced chunk. Adding the two phases
          gives <M>{"2(n-1)S/n"}</M>, almost independent of n for large n, which is why ring collectives scale
          (<C>all_reduce_bytes</C>, <C>all_gather_bytes</C>). The partial sums of a sharded contraction need an all-reduce of
          each device&apos;s output block (<C>matmul_comm</C>).
        </p>
        <Code>{COMM}</Code>
      </Proof>

      <Example title="the Megatron MLP, derived">
        <p>
          Annotate the first weight of an MLP as column-sharded and the second as row-sharded. Propagation gives the
          hidden activation a column sharding, so the elementwise activation function needs no communication, and the
          second product contracts over the sharded dimension, producing partial sums. One all-reduce at the end
          restores the replicated output: exactly the layout of e10.4.1, derived rather than written by hand. Sharding
          both weights by columns would instead require all-gathering the hidden activation before the second product,
          which is larger.
        </p>
      </Example>

      <Remark title="propagation in practice">
        <p>
          Real propagation also handles reshapes, which can split or merge sharded dimensions, convolutions, gathers and
          scans, and may shard a dimension over several mesh axes at once. Where rules disagree, priorities decide:
          user annotations win, then shardings that avoid communication, and the partitioner may insert explicit
          resharding. In JAX, <C>jax.lax.with_sharding_constraint</C> pins an intermediate value, which is the tool for
          steering propagation when it chooses badly, as in e10.7.3. Shardy, the newer MLIR-based propagation system for
          XLA, makes these priorities and the reasons for each choice explicit.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "allreduce",
      rung: "check",
      prompt: (
        <p>
          An activation of shape 8192 × 28672, sharded along its columns over 8 devices, is multiplied by a weight of
          shape 28672 × 8192 sharded along its rows over the same axis. Values are bf16. How many MiB does each device
          receive in the ring all-reduce of the result?
        </p>
      ),
      answer: { kind: "numeric", value: 224, tolerance: 0 },
    },
    {
      key: "local",
      rung: "check",
      prompt: (
        <p>
          A bf16 tensor of shape 24 × 2048 × 6144 has spec (data, none, model) on a mesh with data of size 4 and model of
          size 2. How many MiB does each device hold?
        </p>
      ),
      answer: { kind: "numeric", value: 72, tolerance: 0 },
    },
    {
      key: "partial",
      rung: "apply",
      prompt: <p>When does a sharded matrix product leave each device with partial sums?</p>,
      answer: {
        kind: "choice",
        options: [
          "When both operands shard their contracted dimension on the same mesh axis",
          "Whenever the output is replicated",
          "When the left operand is sharded along its rows",
          "Whenever the two operands have different specs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def local_shape(shape, spec, mesh):
    return tuple(d // mesh[a] if a else d for d, a in zip(shape, spec))

def matmul_out(a_spec, b_spec):
    (m, k), (k2, n) = a_spec, b_spec
    if k != k2:
        raise ValueError("contracting dimensions sharded differently")
    if m and m == n:
        raise ValueError("one mesh axis cannot shard two dimensions")
    return (m, n), k                                       # k set: each device holds a partial sum over k

def propagate(n, edges, known):
    spec = [known.get(i) for i in range(n)]
    changed = True
    while changed:
        changed = False
        for u, v in edges:                                 # elementwise edges: both ends share a sharding
            for a, b in ((u, v), (v, u)):
                if spec[a] is not None and spec[b] is None:
                    spec[b], changed = spec[a], True
                elif spec[a] is not None and spec[b] != spec[a]:
                    raise ValueError(f"conflict between {a} and {b}")
    return spec

print(local_shape((8, 6, 4), ("x", None, "y"), {"x": 2, "y": 4}), matmul_out(("x", "y"), ("y", None)), matmul_out((None, None), (None, "x")))
print(propagate(4, [(0, 1), (2, 1)], {2: ("x",)}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 6, 1) (('x', None), 'y') ((None, 'x'), None)\n[('x',), ('x',), ('x',), None]",
          "(4, 6, 1) (('x', 'y'), 'y') ((None, 'x'), None)\n[('x',), ('x',), ('x',), None]",
          "(4, 6, 1) (('x', None), 'y') ((None, 'x'), None)\n[None, ('x',), ('x',), None]",
          "(2, 6, 4) (('x', None), 'y') ((None, 'x'), None)\n[('x',), ('x',), ('x',), None]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def all_reduce_bytes(size, n):
    return 2 * (n - 1) / n * size                          # ring: reduce-scatter, then all-gather

def all_gather_bytes(size, n):
    return (n - 1) / n * size                              # size is the full, gathered tensor

def matmul_comm(m, n, out_spec, red, mesh, width):
    if red is None:
        return 0.0
    out = m * n * width
    for a in out_spec:
        if a:
            out //= mesh[a]                                # each device reduces only its own output block
    return all_reduce_bytes(out, mesh[red])

print(all_reduce_bytes(100, 4), all_gather_bytes(100, 4))
print(matmul_comm(4, 6, ("x", None), "y", {"x": 2, "y": 4}, 2), matmul_comm(4, 6, (None, "x"), None, {"x": 2}, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["150.0 75.0\n36.0 0.0", "150.0 75.0\n72.0 0.0", "200.0 75.0\n36.0 0.0", "150.0 25.0\n36.0 12.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>local_shape(shape, spec, mesh)</C>; <C>matmul_out(a_spec, b_spec)</C>, returning the output spec and the
          axis of any partial sum, and raising ValueError if the contracted dimensions are sharded differently or the
          output would use one axis twice; and <C>propagate(n, edges, known)</C>, raising ValueError on a conflict.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def local_shape(shape, spec, mesh):
    return shape

def matmul_out(a_spec, b_spec):
    return (None, None), None

def propagate(n, edges, known):
    return [known.get(i) for i in range(n)]
`,
        solution: SPECS,
        tests: [
          { name: "shapes", code: `assert local_shape((6, 10), (None, "m"), {"m": 5}) == (6, 2) and matmul_out(("d", None), (None, "m")) == (("d", "m"), None) and matmul_out((None, "m"), ("m", "d")) == ((None, "d"), "m")` },
          { name: "errors", code: `bad = 0\nfor a, b in [((None, "m"), (None, None)), (("m", None), (None, "m"))]:\n    try:\n        matmul_out(a, b)\n    except ValueError:\n        bad += 1\nassert bad == 2` },
          { name: "spread", code: `assert propagate(5, [(3, 4), (1, 0), (4, 2)], {2: ("d",), 0: (None,)}) == [(None,), (None,), ("d",), ("d",), ("d",)]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>all_reduce_bytes(size, n)</C> and <C>all_gather_bytes(size, n)</C> for ring collectives, and{" "}
          <C>matmul_comm(m, n, out_spec, red, mesh, width)</C>, the bytes each device receives to all-reduce the partial
          sums of an m × n product output with the given spec over mesh axis red, with values of the given width, or 0.0
          if red is None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def all_reduce_bytes(size, n):
    return size

def all_gather_bytes(size, n):
    return size

def matmul_comm(m, n, out_spec, red, mesh, width):
    return 0.0
`,
        solution: COMM,
        tests: [
          { name: "ring", code: `assert all_reduce_bytes(60, 3) == 80 and all_gather_bytes(60, 3) == 40 and all_reduce_bytes(9, 1) == 0` },
          { name: "matmul", code: `assert matmul_comm(10, 6, ("r", None), "c", {"r": 5, "c": 2}, 4) == 48 and matmul_comm(10, 6, (None, "c"), None, {"c": 2}, 4) == 0` },
        ],
      },
    },
    {
      key: "gather",
      rung: "stretch",
      prompt: (
        <p>
          In the setting of the first check, suppose both weights of the MLP were column-sharded, so that the 8192 ×
          28672 hidden activation, sharded along its columns over 8 devices, must be all-gathered before the second
          product. How many MiB does each device receive for that all-gather?
        </p>
      ),
      answer: { kind: "numeric", value: 392, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Propagation fills in a layout from a few annotations, but someone still chooses the annotations. The last lesson
        lets the compiler choose them too, by searching over layouts with a cost model.
      </p>
    </>
  ),
};
