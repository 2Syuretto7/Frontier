import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FusionTimelineViz } from "@/components/viz/FusionTimelineViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

def epilogue(x, w, b, mask, res):
    return torch.nn.functional.gelu(x @ w + b) * mask + res

fast = torch.compile(epilogue)            # nothing happens yet
y = fast(x, w, b, mask, res)               # first call: Dynamo traces bytecode, Inductor emits
                                           # a matmul call plus one fused Triton kernel
y = fast(x, w, b, mask, res)               # guards pass (same dtypes, shapes, devices): cached code

torch._dynamo.config.cache_size_limit      # 8 recompiles per function, then it runs eagerly
torch._dynamo.mark_dynamic(x, 0)           # batch dimension symbolic from the start
explain = torch._dynamo.explain(epilogue)(x, w, b, mask, res)
print(explain.graph_break_count)           # breaks: .item(), print, data-dependent if, unsupported calls
# TORCH_LOGS="graph_breaks,recompiles" python train.py   shows why`;

const TRACE = `class Proxy:
    def __init__(self, graph, name):
        self.graph, self.name = graph, name

    def _emit(self, op, *args):
        name = f'v{len(self.graph)}'
        self.graph.append((name, op, [a.name if isinstance(a, Proxy) else a for a in args]))
        return Proxy(self.graph, name)

    def __add__(self, o): return self._emit('add', self, o)
    def __mul__(self, o): return self._emit('mul', self, o)
    def __matmul__(self, o): return self._emit('matmul', self, o)
    def relu(self): return self._emit('relu', self)

    def __bool__(self):
        raise RuntimeError('graph break: data-dependent control flow')

def trace(fn, n_inputs):
    graph = []
    out = fn(*[Proxy(graph, f'x{i}') for i in range(n_inputs)])
    return graph, out.name

def fuse(graph):
    kernels, current = [], []
    for node in graph:
        if node[1] == 'matmul':
            kernels += ([current] if current else []) + [[node]]
            current = []
        else:
            current.append(node)
    return kernels + ([current] if current else [])

def traffic(graph, kernels, out):
    tensors = lambda args: {a for a in args if isinstance(a, str)}
    eager = sum(len(tensors(args)) + 1 for _, _, args in graph)
    fused = 0
    for k in kernels:
        inside = {name for name, _, _ in k}
        later = {out}.union(*[tensors(args) for kk in kernels if kk is not k for _, _, args in kk])
        fused += len(set().union(*[tensors(args) for _, _, args in k]) - inside) + len(inside & later)
    return eager, fused`;

const GUARD = `import numpy as np

def guard_key(args, dynamic=False):
    return tuple((str(a.dtype), tuple('s' if dynamic else d for d in a.shape)) for a in args)

class Compiled:
    def __init__(self, fn, automatic_dynamic=True, limit=8):
        self.fn, self.auto, self.limit = fn, automatic_dynamic, limit
        self.cache, self.dynamic, self.compiles, self.fallbacks = {}, False, 0, 0

    def __call__(self, *args):
        key = guard_key(args, self.dynamic)
        if key not in self.cache and self.cache and self.auto and not self.dynamic:
            self.dynamic = True
            key = guard_key(args, True)
        if key not in self.cache:
            if self.compiles == self.limit:
                self.fallbacks += 1
                return self.fn(*args)
            self.cache[key] = self.fn
            self.compiles += 1
        return self.cache[key](*args)

def compiles_for(shapes, automatic_dynamic=True, limit=8):
    c = Compiled(lambda x: x * 2, automatic_dynamic, limit)
    for s in shapes:
        c(np.zeros(s, dtype=np.float32))
    return c.compiles, c.fallbacks`;

export const lesson: LessonContent = {
  id: "e6.4.2",
  minutes: 50,
  links: {
    requires: ["e6.4.1"],
    revisits: ["e6.1.1", "e5.5.2"],
    foreshadows: ["e6.5.2", "e6.4.5"],
  },

  puzzle: (
    <>
      <p>
        Adding one line, <C>model = torch.compile(model)</C>, makes a transformer train 1.4 times faster. On a second model
        the same line makes the first step take four minutes and the rest no faster; on a third, every new sequence length
        triggers another long pause, and after the eighth the speed-up disappears. What does the compiler do with your
        Python code, where does the speed come from, and what makes it give up?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Eager PyTorch runs each operation as its own kernel, so every intermediate tensor makes a round trip to GPU memory
        and every operation pays a launch. A compiler that can see a whole region of the program at once can fuse chains of
        elementwise operations into one kernel that reads the inputs once and writes the result once. To see the program it
        traces it with stand-in values that record operations instead of computing them. Anything the stand-ins cannot
        answer, such as an <C>if</C> on a tensor&apos;s value, ends the traced region. The traced code is only valid for
        inputs like the ones it was traced with, so each compiled version is stored with guards that check that.
      </p>
      <FusionTimelineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the torch.compile stack">
        <p>
          TorchDynamo intercepts the Python bytecode of the function and runs it with fake tensors, recording PyTorch
          operations into an FX graph and leaving everything else to ordinary Python. Where it meets something it cannot
          trace it inserts a graph break: the graph so far is compiled, the offending code runs eagerly, and tracing
          resumes. AOTAutograd traces the backward pass too. TorchInductor lowers the graph, fuses pointwise and reduction
          operations, and generates Triton kernels for GPUs or C++ for CPUs.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="memory traffic of a fused chain">
        <p>
          A chain of elementwise operations on tensors of n elements, executed eagerly, moves <C>n · Σ (rᵢ + 1)</C> elements,
          where rᵢ is the number of tensor inputs of operation i. Fused into one kernel it moves <C>n · (r + w)</C>, where r is
          the number of distinct tensors entering the chain from outside and w the number of its results used outside.
        </p>
      </Theorem>
      <Proof>
        <p>
          Eagerly, operation i is a kernel that reads each of its rᵢ inputs from memory and writes its output, n elements
          each. A fused kernel handles each element position independently, since elementwise operations at position j only
          read position j, so one thread can load the r outside inputs at j, keep every intermediate in registers, and store
          only the w results needed later. Each external input is read once and each needed output written once. Matrix
          multiplies are not elementwise and stay separate kernels, which is why the fuser below cuts the graph at them.
        </p>
        <Code>{TRACE}</Code>
      </Proof>

      <Example title="guards and recompilation">
        <p>
          A compiled graph is stored with guards on its inputs: dtypes, devices, shapes, and any Python values that were
          baked in. A call whose inputs fail every guard compiles again. When a shape changes, PyTorch recompiles once with
          that dimension symbolic, so later sizes reuse it; this is automatic dynamic shapes. After{" "}
          <C>cache_size_limit</C> compilations of the same code it stops compiling and runs eagerly.
        </p>
        <Code>{GUARD}</Code>
      </Example>

      <Remark title="getting the speed-up">
        <p>
          Compile the model or the training step once, warm it up on representative shapes, and pad or bucket sequence
          lengths so that few shapes occur. Remove graph breaks from hot code: <C>.item()</C>, <C>print</C>, Python control
          flow on tensor values, and calls into libraries Dynamo cannot trace. <C>mode=&quot;reduce-overhead&quot;</C> adds
          CUDA graphs, which remove launch costs for small batches; <C>mode=&quot;max-autotune&quot;</C> benchmarks kernel
          variants at the cost of a longer compile.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eager",
      rung: "check",
      prompt: <p>Eagerly, how many full-tensor reads and writes does <C>(x * y + z).relu()</C> perform, counting each read and each write?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0.1 },
    },
    {
      key: "fused",
      rung: "check",
      prompt: <p>Fused into one kernel, how many does it perform?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.1 },
    },
    {
      key: "item",
      rung: "apply",
      prompt: <p>A training step calls <C>loss.item()</C> inside the compiled function to log it. What does Dynamo do?</p>,
      answer: {
        kind: "choice",
        options: [
          "It breaks the graph there, because the Python float depends on the tensor's value; the step becomes two compiled graphs with eager code between them, and a device synchronisation",
          "It compiles the call into the kernel and returns the value lazily",
          "It raises an error and refuses to compile",
          "It skips the call, so nothing is logged",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Proxy:
    def __init__(self, graph, name):
        self.graph, self.name = graph, name

    def _emit(self, op, *args):
        name = f'v{len(self.graph)}'
        self.graph.append((name, op, [a.name if isinstance(a, Proxy) else a for a in args]))
        return Proxy(self.graph, name)

    def __add__(self, o): return self._emit('add', self, o)
    def __mul__(self, o): return self._emit('mul', self, o)
    def __matmul__(self, o): return self._emit('matmul', self, o)
    def relu(self): return self._emit('relu', self)

    def __bool__(self):
        raise RuntimeError('graph break: data-dependent control flow')

def trace(fn, n_inputs):
    graph = []
    out = fn(*[Proxy(graph, f'x{i}') for i in range(n_inputs)])
    return graph, out.name

def fuse(graph):
    kernels, current = [], []
    for node in graph:
        if node[1] == 'matmul':
            kernels += ([current] if current else []) + [[node]]
            current = []
        else:
            current.append(node)
    return kernels + ([current] if current else [])

def traffic(graph, kernels, out):
    tensors = lambda args: {a for a in args if isinstance(a, str)}
    eager = sum(len(tensors(args)) + 1 for _, _, args in graph)
    fused = 0
    for k in kernels:
        inside = {name for name, _, _ in k}
        later = {out}.union(*[tensors(args) for kk in kernels if kk is not k for _, _, args in kk])
        fused += len(set().union(*[tensors(args) for _, _, args in k]) - inside) + len(inside & later)
    return eager, fused

f = lambda x, w, b: ((x @ w) + b).relu() * 2.0 + x
g, out = trace(f, 3); print(len(g), [op for _, op, _ in g], out)
k = fuse(g); print([len(kk) for kk in k], traffic(g, k, out))
try: trace(lambda x: x.relu() if x else x, 1)
except RuntimeError as e: print(e)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5 ['matmul', 'add', 'relu', 'mul', 'add'] v4\n[1, 4] (13, 7)\ngraph break: data-dependent control flow",
          "5 ['matmul', 'add', 'relu', 'mul', 'add'] v4\n[1, 4] (13, 4)\ngraph break: data-dependent control flow",
          "5 ['matmul', 'add', 'relu', 'mul', 'add'] v4\n[5] (13, 4)\ngraph break: data-dependent control flow",
          "4 ['matmul', 'add', 'relu', 'add'] v3\n[1, 3] (11, 7)\ngraph break: data-dependent control flow",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def guard_key(args, dynamic=False):
    return tuple((str(a.dtype), tuple('s' if dynamic else d for d in a.shape)) for a in args)

class Compiled:
    def __init__(self, fn, automatic_dynamic=True, limit=8):
        self.fn, self.auto, self.limit = fn, automatic_dynamic, limit
        self.cache, self.dynamic, self.compiles, self.fallbacks = {}, False, 0, 0

    def __call__(self, *args):
        key = guard_key(args, self.dynamic)
        if key not in self.cache and self.cache and self.auto and not self.dynamic:
            self.dynamic = True
            key = guard_key(args, True)
        if key not in self.cache:
            if self.compiles == self.limit:
                self.fallbacks += 1
                return self.fn(*args)
            self.cache[key] = self.fn
            self.compiles += 1
        return self.cache[key](*args)

def compiles_for(shapes, automatic_dynamic=True, limit=8):
    c = Compiled(lambda x: x * 2, automatic_dynamic, limit)
    for s in shapes:
        c(np.zeros(s, dtype=np.float32))
    return c.compiles, c.fallbacks

print(guard_key([np.zeros((2, 3))]), guard_key([np.zeros((2, 3), dtype=np.float16)], True))
print(compiles_for([(8, 4), (8, 4), (16, 4), (32, 4)]), compiles_for([(8, 4), (16, 4), (32, 4)], False, 2), compiles_for([(8,), (8, 4)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(('float64', (2, 3)),) (('float16', ('s', 's')),)\n(2, 0) (2, 1) (2, 0)",
          "(('float64', (2, 3)),) (('float16', ('s', 's')),)\n(3, 0) (2, 1) (2, 0)",
          "(('float64', (2, 3)),) (('float16', ('s', 's')),)\n(2, 0) (3, 0) (1, 0)",
          "(('float64', (2, 3)),) (('float16', (2, 3)),)\n(2, 0) (2, 1) (2, 0)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>Proxy</C>, write <C>trace(fn, n_inputs)</C>, returning the recorded graph and the output&apos;s
          name, <C>fuse(graph)</C>, which groups consecutive non-matmul nodes into kernels and gives each matmul its own, and{" "}
          <C>traffic(graph, kernels, out)</C>, returning eager and fused tensor reads plus writes as in the theorem (string
          arguments are tensors; numbers are constants).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `class Proxy:
    def __init__(self, graph, name):
        self.graph, self.name = graph, name

    def _emit(self, op, *args):
        name = f'v{len(self.graph)}'
        self.graph.append((name, op, [a.name if isinstance(a, Proxy) else a for a in args]))
        return Proxy(self.graph, name)

    def __add__(self, o): return self._emit('add', self, o)
    def __mul__(self, o): return self._emit('mul', self, o)
    def __matmul__(self, o): return self._emit('matmul', self, o)
    def relu(self): return self._emit('relu', self)

    def __bool__(self):
        raise RuntimeError('graph break: data-dependent control flow')

def trace(fn, n_inputs):
    return [], None

def fuse(graph):
    return [[node] for node in graph]

def traffic(graph, kernels, out):
    return 0, 0
`,
        solution: TRACE,
        tests: [
          { name: "trace", code: `g, out = trace(lambda a, b: (a * b + a) @ b, 2)
assert g == [('v0', 'mul', ['x0', 'x1']), ('v1', 'add', ['v0', 'x0']), ('v2', 'matmul', ['v1', 'x1'])] and out == 'v2'
assert [[n for n, _, _ in k] for k in fuse(g)] == [['v0', 'v1'], ['v2']]
g2, _ = trace(lambda a: (a @ a) @ a, 1); assert [[n for n, _, _ in k] for k in fuse(g2)] == [['v0'], ['v1']]` },
          { name: "traffic", code: `g, out = trace(lambda x, y, z: (x * y + z).relu(), 3); assert traffic(g, fuse(g), out) == (8, 4)
g, out = trace(lambda x, w: (x @ w).relu() * 3.0 @ w, 2); k = fuse(g)
assert [len(kk) for kk in k] == [1, 2, 1] and traffic(g, k, out) == (10, 8)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>guard_key(args, dynamic=False)</C>, the tuple of (dtype string, shape) per array with every dimension
          replaced by &apos;s&apos; when dynamic, a class <C>Compiled(fn, automatic_dynamic=True, limit=8)</C> that caches by
          guard key, switches to dynamic keys at the first miss after something is cached, and runs fn eagerly (counting a
          fallback) once limit compilations are used, and <C>compiles_for(shapes, automatic_dynamic=True, limit=8)</C>,
          returning (compiles, fallbacks) for float32 zero arrays of those shapes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def guard_key(args, dynamic=False):
    return ()

class Compiled:
    def __init__(self, fn, automatic_dynamic=True, limit=8):
        self.fn = fn

    def __call__(self, *args):
        return self.fn(*args)

def compiles_for(shapes, automatic_dynamic=True, limit=8):
    return 0, 0
`,
        solution: GUARD,
        tests: [
          { name: "keys", code: `a, b = np.zeros((4, 2), dtype=np.int64), np.ones(3, dtype=np.float32)
assert guard_key([a, b]) == (('int64', (4, 2)), ('float32', (3,))) and guard_key([a], True) == (('int64', ('s', 's')),)
c = Compiled(lambda x: x + 1); assert c(np.zeros(2)).tolist() == [1.0, 1.0] and c.compiles == 1 and c(np.zeros(2)).tolist() == [1.0, 1.0] and c.compiles == 1` },
          { name: "recompile", code: `assert compiles_for([(1,), (2,), (3,), (4,)]) == (2, 0) and compiles_for([(1,), (2,), (3,), (4,)], False) == (4, 0)
assert compiles_for([(n,) for n in range(1, 13)], False, 8) == (8, 4) and compiles_for([(2, 2), (2,), (2, 2, 2)]) == (3, 0)` },
        ],
      },
    },
    {
      key: "amort",
      rung: "stretch",
      prompt: (
        <p>
          Compiling takes 90 s and makes each step 0.12 s faster, from 0.5 s. How many steps must the run have before
          compiling saves time overall?
        </p>
      ),
      answer: { kind: "numeric", value: 750, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Fusion keeps intermediates out of memory within one step. A different memory problem is the activations a forward
        pass must keep for its backward pass. The next lesson trades compute for that memory by recomputing activations
        instead of storing them.
      </p>
    </>
  ),
};
