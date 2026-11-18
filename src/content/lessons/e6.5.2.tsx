import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShapeBucketViz } from "@/components/viz/ShapeBucketViz";
import type { LessonContent } from "@/lib/types";

const JAX = `import jax
import jax.numpy as jnp
from functools import partial

@partial(jax.jit, static_argnames="n_layers")
def forward(params, x, n_layers):
    print("tracing", x.shape)                  # runs only while tracing
    for i in range(n_layers):                  # Python loop over a static value: unrolled
        x = jnp.tanh(x @ params[i])
    return jnp.where(x.sum() > 0, x, -x)       # value-dependent choice without Python if

print(jax.make_jaxpr(forward, static_argnums=2)(params, x, 2))   # the traced program
forward(params, x, 2)        # trace, lower to XLA, compile, run
forward(params, x + 1, 2)    # same shapes, dtypes and statics: cached executable
forward(params, x[:3], 2)    # new shape: trace and compile again

def rnn(params, xs):         # lax.scan traces the body once, however long xs is
    def step(h, x):
        h = jnp.tanh(h @ params["W"] + x @ params["U"])
        return h, h
    return jax.lax.scan(step, jnp.zeros(16), xs)`;

const JIT = `import numpy as np

OPS = {'add': np.add, 'mul': np.multiply, 'sin': np.sin}

class Tracer:
    def __init__(self, eqns, var, shape, dtype):
        self.eqns, self.var, self.shape, self.dtype = eqns, var, shape, dtype

    def _emit(self, op, *args):
        var = f'v{len(self.eqns)}'
        self.eqns.append((var, op, [a.var if isinstance(a, Tracer) else a for a in args]))
        return Tracer(self.eqns, var, self.shape, self.dtype)

    def __add__(self, o): return self._emit('add', self, o)
    def __mul__(self, o): return self._emit('mul', self, o)
    __radd__, __rmul__ = __add__, __mul__
    def sin(self): return self._emit('sin', self)

    def __bool__(self):
        raise TypeError('ConcretizationTypeError: abstract value in Python control flow')

def trace(fn, args, static=()):
    eqns = []
    targs = [a if i in static else Tracer(eqns, f'a{i}', np.shape(a), np.asarray(a).dtype.name) for i, a in enumerate(args)]
    out = fn(*targs)
    return eqns, out.var if isinstance(out, Tracer) else out

def evaluate(eqns, out, args):
    env = {f'a{i}': np.asarray(a) for i, a in enumerate(args)}
    look = lambda x: env[x] if isinstance(x, str) else x
    for var, op, ins in eqns:
        env[var] = OPS[op](*[look(x) for x in ins])
    return look(out)

def jit(fn, static_argnums=()):
    cache = {}
    def wrapped(*args):
        key = tuple(a if i in static_argnums else (np.shape(a), np.asarray(a).dtype.name) for i, a in enumerate(args))
        if key not in cache:
            cache[key] = trace(fn, args, static_argnums)
            wrapped.traces += 1
        return evaluate(*cache[key], args)
    wrapped.traces = 0
    return wrapped`;

const LAX = `import numpy as np

def fori_loop(lo, hi, body, init):
    val = init
    for i in range(lo, hi):
        val = body(i, val)
    return val

def while_loop(cond_fun, body_fun, init):
    val = init
    while cond_fun(val):
        val = body_fun(val)
    return val

def scan(f, init, xs):
    carry, ys = init, []
    for x in xs:
        carry, y = f(carry, x)
        ys.append(y)
    return carry, np.stack(ys)`;

export const lesson: LessonContent = {
  id: "e6.5.2",
  minutes: 50,
  links: {
    requires: ["e6.5.1"],
    revisits: ["e6.4.2"],
    foreshadows: ["e6.5.3", "e6.5.4"],
  },

  puzzle: (
    <>
      <p>
        Decorating a JAX training step with <C>jax.jit</C> makes it ten times faster. Then three things go wrong. A{" "}
        <C>print</C> inside the step prints once and never again. An <C>if loss &gt; 10:</C> raises a ConcretizationTypeError.
        And a version that handles variable-length batches spends most of its time compiling. All three follow from one fact
        about how <C>jit</C> sees a function. What is it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <C>jit</C> does not run your Python on the data. It runs it once on tracers, placeholders that know only the shape and
        dtype of each argument, and records every array operation they pass through. The recording, a jaxpr, is compiled by
        XLA and cached under the shapes, dtypes and static arguments it was traced with. Python itself, its prints, loops
        and ifs, runs only during tracing: a loop over a Python number unrolls, a print fires once, and an if on a traced
        value has nothing to decide with. A new shape means a new trace and a new compilation.
      </p>
      <ShapeBucketViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tracing and the cache">
        <p>
          Calling a jitted function computes a cache key from the abstract value (shape and dtype) of each array argument
          and the value of each static argument, which must be hashable. On a miss, the Python function runs with tracers,
          producing a jaxpr; XLA compiles it, fusing operations, and the executable is stored under the key. On a hit, the
          executable runs directly, without touching the Python function.
        </p>
        <Code>{JAX}</Code>
      </Definition>

      <Theorem title="when a traced program is valid">
        <p>
          If a function is pure and its control flow depends only on shapes, dtypes and static arguments, then evaluating
          its jaxpr on any arguments with the cached key gives the same result as running the function on them.
        </p>
      </Theorem>
      <Proof>
        <p>
          Under those conditions, running the function on two argument lists with the same key takes the same path through
          the Python code: every branch and loop bound is decided by quantities in the key. So it performs the same
          sequence of array operations, with the same constants, on different array values. The jaxpr is exactly that
          sequence with the arguments as variables, so evaluating it replays the computation. If a branch depended on an
          array value, the tracer could not choose, which is why it raises instead of guessing; impure code, such as a
          print or a counter in a global, is not part of the sequence and is not replayed.
        </p>
        <Code>{JIT}</Code>
      </Proof>

      <Example title="structured control flow">
        <p>
          Loops and branches that depend on traced values go through primitives that take functions:{" "}
          <C>jax.lax.fori_loop</C>, <C>while_loop</C>, <C>cond</C> and <C>scan</C>. Each traces its body once and lets the
          compiled program do the iteration, so compile time no longer grows with the loop length. <C>scan</C> carries a
          state through a sequence and stacks the per-step outputs, which covers RNNs, layer stacks with shared shapes and
          optimiser loops. The reference semantics, without tracing, are short.
        </p>
        <Code>{LAX}</Code>
      </Example>

      <Remark title="practical rules">
        <p>
          Mark arguments that steer Python control flow as static, and keep their set of values small. Pad batches to a few
          bucket sizes. Use <C>jnp.where</C> or <C>lax.cond</C> instead of an if on an array, and <C>jax.debug.print</C>{" "}
          to print traced values at run time. Avoid unrolling long Python loops: compile time grows with the jaxpr. Use{" "}
          <C>donate_argnums</C> so the buffers of old parameters can be reused for the new ones.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unroll",
      rung: "check",
      prompt: <p>A jitted function runs a Python <C>for</C> loop over a static n = 12, with 3 array operations per iteration. How many equations does its jaxpr have for those loops?</p>,
      answer: { kind: "numeric", value: 36, tolerance: 0.1 },
    },
    {
      key: "buckets",
      rung: "check",
      prompt: <p>Sequence lengths range from 1 to 2048 and are padded to powers of two. How many distinct shapes, and so compilations, can occur at most?</p>,
      answer: { kind: "numeric", value: 12, tolerance: 0.1 },
    },
    {
      key: "concrete",
      rung: "apply",
      prompt: <p>Why does <C>if loss &gt; 10:</C> inside a jitted function raise a ConcretizationTypeError?</p>,
      answer: {
        kind: "choice",
        options: [
          "During tracing, loss is a tracer with a shape and dtype but no value, so Python cannot decide the branch; use jnp.where or lax.cond, or make the value static",
          "Comparisons are not supported on JAX arrays",
          "loss is on the GPU and must be copied first",
          "jit forbids if statements entirely",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

OPS = {'add': np.add, 'mul': np.multiply, 'sin': np.sin}

class Tracer:
    def __init__(self, eqns, var, shape, dtype):
        self.eqns, self.var, self.shape, self.dtype = eqns, var, shape, dtype

    def _emit(self, op, *args):
        var = f'v{len(self.eqns)}'
        self.eqns.append((var, op, [a.var if isinstance(a, Tracer) else a for a in args]))
        return Tracer(self.eqns, var, self.shape, self.dtype)

    def __add__(self, o): return self._emit('add', self, o)
    def __mul__(self, o): return self._emit('mul', self, o)
    __radd__, __rmul__ = __add__, __mul__
    def sin(self): return self._emit('sin', self)

    def __bool__(self):
        raise TypeError('ConcretizationTypeError: abstract value in Python control flow')

def trace(fn, args, static=()):
    eqns = []
    targs = [a if i in static else Tracer(eqns, f'a{i}', np.shape(a), np.asarray(a).dtype.name) for i, a in enumerate(args)]
    out = fn(*targs)
    return eqns, out.var if isinstance(out, Tracer) else out

def evaluate(eqns, out, args):
    env = {f'a{i}': np.asarray(a) for i, a in enumerate(args)}
    look = lambda x: env[x] if isinstance(x, str) else x
    for var, op, ins in eqns:
        env[var] = OPS[op](*[look(x) for x in ins])
    return look(out)

def jit(fn, static_argnums=()):
    cache = {}
    def wrapped(*args):
        key = tuple(a if i in static_argnums else (np.shape(a), np.asarray(a).dtype.name) for i, a in enumerate(args))
        if key not in cache:
            cache[key] = trace(fn, args, static_argnums)
            wrapped.traces += 1
        return evaluate(*cache[key], args)
    wrapped.traces = 0
    return wrapped

def f(x, n):
    print('tracing', x.shape)
    for _ in range(n): x = x * 2.0 + 1.0
    return x.sin() if n > 1 else x
g = jit(f, static_argnums=(1,))
print(g(np.zeros(3), 2).round(3).tolist(), g(np.ones(3), 2).round(3).tolist(), g.traces)
print(g(np.zeros(4), 2).shape, g(np.zeros(3), 1).tolist(), g.traces, len(trace(f, (np.zeros(2), 3), (1,))[0]))
try: jit(lambda x: x * 2.0 if x else x)(np.ones(2))
except TypeError as e: print(str(e).split(':')[0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "tracing (3,)\n[0.141, 0.141, 0.141] [0.657, 0.657, 0.657] 1\ntracing (4,)\ntracing (3,)\ntracing (2,)\n(4,) [1.0, 1.0, 1.0] 3 7\nConcretizationTypeError",
          "tracing (3,)\ntracing (3,)\n[0.141, 0.141, 0.141] [0.657, 0.657, 0.657] 2\ntracing (4,)\ntracing (3,)\ntracing (2,)\n(4,) [1.0, 1.0, 1.0] 4 7\nConcretizationTypeError",
          "tracing (3,)\n[0.141, 0.141, 0.141] [0.657, 0.657, 0.657] 1\ntracing (4,)\ntracing (2,)\n(4,) [1.0, 1.0, 1.0] 2 7\nConcretizationTypeError",
          "tracing (3,)\n[0.141, 0.141, 0.141] [0.141, 0.141, 0.141] 1\ntracing (4,)\ntracing (3,)\ntracing (2,)\n(4,) [1.0, 1.0, 1.0] 3 7\nConcretizationTypeError",
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

def fori_loop(lo, hi, body, init):
    val = init
    for i in range(lo, hi):
        val = body(i, val)
    return val

def while_loop(cond_fun, body_fun, init):
    val = init
    while cond_fun(val):
        val = body_fun(val)
    return val

def scan(f, init, xs):
    carry, ys = init, []
    for x in xs:
        carry, y = f(carry, x)
        ys.append(y)
    return carry, np.stack(ys)

print(fori_loop(0, 4, lambda i, v: v + i, 10), while_loop(lambda v: v < 100, lambda v: v * 3, 1))
c, ys = scan(lambda c, x: (c + x, c * x), 0, np.array([1, 2, 3, 4])); print(c, ys.tolist())
print(scan(lambda c, x: (c * 2, c), 1, np.zeros(4))[1].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["16 243\n10 [0, 2, 9, 24]\n[1, 2, 4, 8]", "16 81\n10 [0, 2, 9, 24]\n[1, 2, 4, 8]", "16 243\n10 [1, 3, 6, 10]\n[1, 2, 4, 8]", "10 243\n10 [0, 2, 9, 24]\n[2, 4, 8, 16]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>Tracer</C> and <C>OPS</C>, write <C>trace(fn, args, static=())</C>, which calls fn with
          tracers named a0, a1, … for non-static arguments and returns the equations and the output variable (or constant),{" "}
          <C>evaluate(eqns, out, args)</C>, and <C>jit(fn, static_argnums=())</C>, which caches traces by shape, dtype name and
          static values and counts them in a <C>traces</C> attribute.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

OPS = {'add': np.add, 'mul': np.multiply, 'sin': np.sin}

class Tracer:
    def __init__(self, eqns, var, shape, dtype):
        self.eqns, self.var, self.shape, self.dtype = eqns, var, shape, dtype

    def _emit(self, op, *args):
        var = f'v{len(self.eqns)}'
        self.eqns.append((var, op, [a.var if isinstance(a, Tracer) else a for a in args]))
        return Tracer(self.eqns, var, self.shape, self.dtype)

    def __add__(self, o): return self._emit('add', self, o)
    def __mul__(self, o): return self._emit('mul', self, o)
    __radd__, __rmul__ = __add__, __mul__
    def sin(self): return self._emit('sin', self)

    def __bool__(self):
        raise TypeError('ConcretizationTypeError: abstract value in Python control flow')

def trace(fn, args, static=()):
    return [], None

def evaluate(eqns, out, args):
    return None

def jit(fn, static_argnums=()):
    return fn
`,
        solution: JIT,
        tests: [
          { name: "trace", code: `eqns, out = trace(lambda x, y: (x * y + 1.0).sin(), (np.ones(2), np.ones(2)))
assert eqns == [('v0', 'mul', ['a0', 'a1']), ('v1', 'add', ['v0', 1.0]), ('v2', 'sin', ['v1'])] and out == 'v2'
x, y = np.array([0.5, -1.0]), np.array([2.0, 3.0]); assert np.allclose(evaluate(eqns, out, (x, y)), np.sin(x * y + 1.0))
assert trace(lambda x, k: x * k, (np.ones(1), 3.0), (1,))[0] == [('v0', 'mul', ['a0', 3.0])]` },
          { name: "jit", code: `calls = []
def f(x, k):
    calls.append(1)
    return x * k + x
g = jit(f, static_argnums=(1,))
assert g(np.ones(3), 2.0).tolist() == [3.0] * 3 and g(np.full(3, 2.0), 2.0).tolist() == [6.0] * 3 and g.traces == 1 and len(calls) == 1
g(np.ones(3, dtype=np.float32), 2.0); g(np.ones(4), 2.0); g(np.ones(3), 5.0); assert g.traces == 4 and len(calls) == 4
try:
    jit(lambda x: x if x else x)(np.ones(1))
    assert False
except TypeError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write the reference semantics of <C>fori_loop(lo, hi, body, init)</C>, where body takes (i, val),{" "}
          <C>while_loop(cond_fun, body_fun, init)</C>, and <C>scan(f, init, xs)</C>, where f maps (carry, x) to (carry, y)
          and the result is the final carry and the ys stacked with <C>np.stack</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fori_loop(lo, hi, body, init):
    return init

def while_loop(cond_fun, body_fun, init):
    return init

def scan(f, init, xs):
    return init, np.array([])
`,
        solution: LAX,
        tests: [
          { name: "loops", code: `assert fori_loop(1, 6, lambda i, v: v * i, 1) == 120 and fori_loop(3, 3, lambda i, v: v + 1, 7) == 7
assert while_loop(lambda s: s[0] > 1, lambda s: (s[0] // 2, s[1] + 1), (40, 0)) == (1, 5) and while_loop(lambda v: False, lambda v: v + 1, 2) == 2` },
          { name: "scan", code: `W = np.array([[0.5, 0.0], [0.0, 2.0]]); xs = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
h, hs = scan(lambda h, x: (W @ h + x, h.sum()), np.zeros(2), xs)
assert h.tolist() == [1.25, 3.0] and hs.tolist() == [0.0, 1.0, 1.5]
c, ys = scan(lambda c, x: (c, np.array([x, -x])), 0, np.arange(3)); assert ys.shape == (3, 2) and ys[:, 1].tolist() == [0, -1, -2]` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          Each compilation takes 40 s. Lengths from 1 to 2048 padded to multiples of 128 can all occur. Compared with padding
          to powers of two, how many more seconds of compilation is that at worst?
        </p>
      ),
      answer: { kind: "numeric", value: 160, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Tracing records a program as data, and data can be transformed. The next lesson uses the same tracers to build{" "}
        <C>grad</C> and <C>vmap</C>, and shows how transformations compose.
      </p>
    </>
  ),
};
