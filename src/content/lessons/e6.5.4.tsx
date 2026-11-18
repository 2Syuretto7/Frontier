import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MeshShardViz } from "@/components/viz/MeshShardViz";
import type { LessonContent } from "@/lib/types";

const JAX = `import jax
import jax.numpy as jnp
from jax.sharding import Mesh, NamedSharding, PartitionSpec as P
from jax.experimental import mesh_utils

devices = jax.devices()                                  # say 8 accelerators
mesh = Mesh(mesh_utils.create_device_mesh((2, 4)), axis_names=("data", "model"))

x = jax.device_put(x, NamedSharding(mesh, P("data", None)))    # batch split over data
w = jax.device_put(w, NamedSharding(mesh, P(None, "model")))   # columns split over model

@jax.jit
def layer(x, w):
    y = x @ w                                            # P('data', 'model'): no communication
    return jax.lax.with_sharding_constraint(y, NamedSharding(mesh, P("data", None)))

jax.debug.visualize_array_sharding(w)                    # which device holds which block
# The compiler (GSPMD) propagates shardings through the program and inserts
# all-gathers, reduce-scatters and all-reduces wherever layouts require them.`;

const SHARD = `import itertools
import math

def _axes(entry):
    return () if entry is None else entry if isinstance(entry, tuple) else (entry,)

def shard_shape(shape, spec, mesh):
    out = []
    for n, entry in zip(shape, tuple(spec) + (None,) * (len(shape) - len(spec))):
        k = math.prod(mesh[a] for a in _axes(entry))
        if n % k:
            raise ValueError(f'dimension {n} not divisible by {k}')
        out.append(n // k)
    return tuple(out)

def device_slices(shape, spec, mesh):
    local = shard_shape(shape, spec, mesh)
    spec = tuple(spec) + (None,) * (len(shape) - len(spec))
    out = {}
    for coords in itertools.product(*[range(s) for s in mesh.values()]):
        c = dict(zip(mesh, coords))
        idx = []
        for entry, size in zip(spec, local):
            i = 0
            for a in _axes(entry):
                i = i * mesh[a] + c[a]
            idx.append((i * size, (i + 1) * size))
        out[coords] = tuple(idx)
    return out

def matmul_rule(x_spec, w_spec):
    (a, b), (b2, c) = x_spec, w_spec
    if b != b2:
        raise ValueError('contracting dimensions sharded differently: reshard first')
    if a is not None and a == c:
        raise ValueError('one mesh axis used twice')
    return (a, c), (None if b is None else ('psum', b))`;

const COMM = `def collective_bytes(kind, size, n):
    frac = (n - 1) / n
    return {'all_reduce': 2 * frac, 'all_gather': frac, 'reduce_scatter': frac}[kind] * size

def collective_time(kind, size, n, bandwidth, latency=0.0):
    steps = {'all_reduce': 2, 'all_gather': 1, 'reduce_scatter': 1}[kind] * (n - 1)
    return collective_bytes(kind, size, n) / bandwidth + steps * latency

def step_comm(mode, params, n, itemsize=2):
    size = params * itemsize
    if mode == 'ddp':
        return collective_bytes('all_reduce', size, n)
    if mode == 'fsdp':
        return 2 * collective_bytes('all_gather', size, n) + collective_bytes('reduce_scatter', size, n)
    raise ValueError(mode)`;

export const lesson: LessonContent = {
  id: "e6.5.4",
  minutes: 55,
  links: {
    requires: ["e6.5.3"],
    revisits: ["e6.4.4"],
    foreshadows: ["e8.2.2", "e10.3.2", "e10.4.1"],
  },

  puzzle: (
    <>
      <p>
        A model&apos;s weights no longer fit on one accelerator, and its batch is too large for one as well. You could write
        the communication by hand: which device sends which slice of which matrix where, and when. JAX instead asks for
        two things, a grid of devices with named axes and, for each array, a note saying which of its dimensions is split
        along which axis. Everything else, including the collectives, is derived. How does a one-line annotation determine
        where every element lives, and when does a matrix multiply have to communicate?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Arrange the devices in a mesh, say 2 × 4, and name the axes, say data and model. A partition spec gives, for each
        array dimension, the mesh axes that split it, or None to keep it whole. Each device then holds the block selected
        by its coordinates along those axes, and devices that differ only along unmentioned axes hold the same block. A
        matrix multiply whose contracted dimension is whole on every device computes its output block locally; if the
        contracted dimension is split, each device holds a partial sum, and the partial sums must be added across that axis.
      </p>
      <MeshShardViz />
    </>
  ),

  theory: (
    <>
      <Definition title="meshes and partition specs">
        <p>
          A <C>Mesh</C> is an n-dimensional array of devices with a name for each axis. A <C>PartitionSpec</C> has one entry
          per array dimension: None, a mesh axis name, or a tuple of names, split major to minor. A{" "}
          <C>NamedSharding(mesh, spec)</C> fixes the layout of an array. Inside <C>jit</C>, the compiler propagates layouts
          from inputs and constraints and inserts collectives, the SPMD partitioning approach (GSPMD).
        </p>
        <Code>{JAX}</Code>
      </Definition>

      <Theorem title="sharded matrix multiply">
        <p>
          Let X have spec (a, b) and W spec (b, c), with a ≠ c. Then XW can be computed with output spec (a, c), and it
          needs no communication if b is None and one all-reduce over b otherwise.
        </p>
      </Theorem>
      <Proof>
        <p>
          A device at coordinates holds rows R of X, selected by its coordinate on a, and columns S of W, selected by c. If
          b is None it holds all of the contracted dimension, so it computes the block (XW)[R, S] = X[R, :] W[:, S]
          directly, which is exactly its block under (a, c). If b is an axis, the device also holds only a slice K of the
          contracted dimension and computes X[R, K] W[K, S], one term of the sum over the slices; the devices that share
          R and S differ only along b, and summing their terms gives the block, an all-reduce over b. If a = c the output
          would need one mesh axis to split two dimensions, which a single coordinate cannot do.
        </p>
        <Code>{SHARD}</Code>
      </Proof>

      <Example title="what the collectives cost">
        <p>
          On a ring of n devices, all-gather and reduce-scatter each move (n − 1)/n of the full array through each device,
          and all-reduce, a reduce-scatter followed by an all-gather, moves twice that. Data parallelism all-reduces the
          gradients once per step. Fully sharded data parallelism all-gathers the weights for the forward pass and again
          for the backward pass and reduce-scatters the gradients: 1.5 times the traffic, in exchange for 1/n of the
          memory.
        </p>
        <Code>{COMM}</Code>
      </Example>

      <Remark title="common layouts">
        <p>
          Data parallel: batch on data, weights replicated. FSDP: batch on data and weights split on data too, gathered
          per layer. Megatron tensor parallelism: in an MLP, the first weight split by columns on model and the second by
          rows, so the only collective is one all-reduce at the end of the block. These combine on a 2-D or 3-D mesh, and
          later courses treat each in detail.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "block",
      rung: "check",
      prompt: <p>On a mesh of 4 × 8 devices (data × model), how many elements of a 1024 × 4096 array with spec P(&apos;data&apos;, &apos;model&apos;) does each device hold?</p>,
      answer: { kind: "numeric", value: 131072, tolerance: 0.5 },
    },
    {
      key: "copies",
      rung: "check",
      prompt: <p>With spec P(None, &apos;model&apos;) on that mesh, on how many devices is each element stored?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.1 },
    },
    {
      key: "megatron",
      rung: "apply",
      prompt: (
        <p>
          An MLP computes (X W₁) W₂ with X spec (&apos;data&apos;, None), W₁ spec (None, &apos;model&apos;) and W₂ spec
          (&apos;model&apos;, None). Where is communication needed?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Only after the second product: the hidden activation comes out as ('data', 'model'), so the second product contracts a dimension split on model and needs one all-reduce over model",
          "After both products",
          "Only after the first product",
          "Nowhere, because every weight is sharded",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import math

def _axes(entry):
    return () if entry is None else entry if isinstance(entry, tuple) else (entry,)

def shard_shape(shape, spec, mesh):
    out = []
    for n, entry in zip(shape, tuple(spec) + (None,) * (len(shape) - len(spec))):
        k = math.prod(mesh[a] for a in _axes(entry))
        if n % k:
            raise ValueError(f'dimension {n} not divisible by {k}')
        out.append(n // k)
    return tuple(out)

def device_slices(shape, spec, mesh):
    local = shard_shape(shape, spec, mesh)
    spec = tuple(spec) + (None,) * (len(shape) - len(spec))
    out = {}
    for coords in itertools.product(*[range(s) for s in mesh.values()]):
        c = dict(zip(mesh, coords))
        idx = []
        for entry, size in zip(spec, local):
            i = 0
            for a in _axes(entry):
                i = i * mesh[a] + c[a]
            idx.append((i * size, (i + 1) * size))
        out[coords] = tuple(idx)
    return out

def matmul_rule(x_spec, w_spec):
    (a, b), (b2, c) = x_spec, w_spec
    if b != b2:
        raise ValueError('contracting dimensions sharded differently: reshard first')
    if a is not None and a == c:
        raise ValueError('one mesh axis used twice')
    return (a, c), (None if b is None else ('psum', b))

mesh = {'data': 2, 'model': 4}
print(shard_shape((8, 16), ('data', 'model'), mesh), shard_shape((8, 16), (None, ('data', 'model')), mesh), shard_shape((8, 16), (), mesh))
s = device_slices((8, 16), ('data', 'model'), mesh); print(len(s), s[(1, 2)], device_slices((8, 16), (('data', 'model'),), mesh)[(1, 2)])
print(matmul_rule(('data', None), (None, 'model')), matmul_rule(('data', 'model'), ('model', None)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 4) (8, 2) (8, 16)\n8 ((4, 8), (8, 12)) ((6, 7), (0, 16))\n(('data', 'model'), None) (('data', None), ('psum', 'model'))",
          "(4, 4) (8, 2) (8, 16)\n8 ((4, 8), (8, 12)) ((3, 4), (0, 16))\n(('data', 'model'), None) (('data', None), ('psum', 'model'))",
          "(4, 4) (8, 2) (8, 16)\n8 ((4, 8), (12, 16)) ((6, 7), (0, 16))\n(('data', 'model'), None) (('data', None), ('psum', 'model'))",
          "(4, 4) (8, 8) (8, 16)\n8 ((4, 8), (8, 12)) ((6, 7), (0, 16))\n(('data', 'model'), None) (('data', None), None)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def collective_bytes(kind, size, n):
    frac = (n - 1) / n
    return {'all_reduce': 2 * frac, 'all_gather': frac, 'reduce_scatter': frac}[kind] * size

def collective_time(kind, size, n, bandwidth, latency=0.0):
    steps = {'all_reduce': 2, 'all_gather': 1, 'reduce_scatter': 1}[kind] * (n - 1)
    return collective_bytes(kind, size, n) / bandwidth + steps * latency

def step_comm(mode, params, n, itemsize=2):
    size = params * itemsize
    if mode == 'ddp':
        return collective_bytes('all_reduce', size, n)
    if mode == 'fsdp':
        return 2 * collective_bytes('all_gather', size, n) + collective_bytes('reduce_scatter', size, n)
    raise ValueError(mode)

print(collective_bytes('all_reduce', 100, 4), collective_bytes('all_gather', 100, 4), round(collective_time('all_reduce', 8e9, 8, 1e11, 1e-5), 5))
print(step_comm('ddp', 1e9, 8) / 1e9, step_comm('fsdp', 1e9, 8) / 1e9)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["150.0 75.0 0.14014\n3.5 5.25", "150.0 75.0 0.14007\n3.5 5.25", "200.0 100.0 0.14014\n3.5 5.25", "150.0 75.0 0.14014\n3.5 7.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>_axes</C>, write <C>shard_shape(shape, spec, mesh)</C>, padding a short spec with None and
          raising ValueError when a dimension does not divide, <C>device_slices(shape, spec, mesh)</C>, mapping each
          device&apos;s coordinates (in mesh axis order) to its (start, stop) range per dimension, and{" "}
          <C>matmul_rule(x_spec, w_spec)</C>, returning the output spec and None or (&apos;psum&apos;, axis), with ValueError
          for mismatched contracting specs or a repeated axis.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools
import math

def _axes(entry):
    return () if entry is None else entry if isinstance(entry, tuple) else (entry,)

def shard_shape(shape, spec, mesh):
    return tuple(shape)

def device_slices(shape, spec, mesh):
    return {}

def matmul_rule(x_spec, w_spec):
    return (x_spec[0], w_spec[1]), None
`,
        solution: SHARD,
        tests: [
          { name: "shapes", code: `mesh = {'x': 2, 'y': 3}
assert shard_shape((6, 12, 5), ('y', ('x', 'y')), mesh) == (2, 2, 5) and shard_shape((4,), (None,), mesh) == (4,)
try:
    shard_shape((5, 6), ('x',), mesh)
    assert False
except ValueError:
    pass
s = device_slices((6, 12), (('y', 'x'), None), mesh); assert len(s) == 6 and s[(1, 0)] == ((1, 2), (0, 12)) and s[(0, 2)] == ((4, 5), (0, 12))
t = device_slices((4, 6), (None, 'y'), mesh); assert t[(0, 1)] == t[(1, 1)] == ((0, 4), (2, 4))` },
          { name: "rule", code: `assert matmul_rule((None, None), (None, 'm')) == ((None, 'm'), None) and matmul_rule(('d', 'm'), ('m', None)) == (('d', None), ('psum', 'm'))
for xs, ws in [(('d', 'm'), (None, 'm')), (('d', None), (None, 'd'))]:
    try:
        matmul_rule(xs, ws)
        assert False
    except ValueError:
        pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>collective_bytes(kind, size, n)</C> for &apos;all_reduce&apos;, &apos;all_gather&apos; and
          &apos;reduce_scatter&apos; on a ring, <C>collective_time(kind, size, n, bandwidth, latency=0.0)</C>, adding one
          latency per ring step (2(n − 1) for all-reduce, n − 1 otherwise), and{" "}
          <C>step_comm(mode, params, n, itemsize=2)</C>, the bytes per device per step for &apos;ddp&apos; and
          &apos;fsdp&apos;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def collective_bytes(kind, size, n):
    return size

def collective_time(kind, size, n, bandwidth, latency=0.0):
    return size / bandwidth

def step_comm(mode, params, n, itemsize=2):
    return params * itemsize
`,
        solution: COMM,
        tests: [
          { name: "bytes", code: `assert collective_bytes('all_reduce', 80, 8) == 140.0 and collective_bytes('reduce_scatter', 80, 8) == 70.0 and collective_bytes('all_gather', 80, 1) == 0.0
assert abs(collective_time('all_gather', 1000, 5, 100, 0.5) - (8 + 2.0)) < 1e-12 and abs(collective_time('all_reduce', 1000, 5, 100, 0.5) - (16 + 4.0)) < 1e-12` },
          { name: "step", code: `assert step_comm('ddp', 100, 4) == 300.0 and step_comm('fsdp', 100, 4) == 450.0 and step_comm('fsdp', 10, 2, 4) == 60.0
try:
    step_comm('tp', 1, 2)
    assert False
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "time",
      rung: "stretch",
      prompt: (
        <p>
          Data parallel training of a 7-billion-parameter model on 64 GPUs all-reduces bfloat16 gradients over links of
          50 GB/s. Ignoring latency and overlap, how many seconds does the all-reduce take per step?
        </p>
      ),
      answer: { kind: "numeric", value: 0.55125, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The machinery is now complete; the last section is about what goes wrong with it. The next lesson hunts the NaN
        that appears at step 41,000: where it came from, and how to find the first operation that produced it.
      </p>
    </>
  ),
};
