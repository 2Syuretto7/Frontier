import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KeyedInitViz } from "@/components/viz/KeyedInitViz";
import type { LessonContent } from "@/lib/types";

const JAX = `import jax
import jax.numpy as jnp

def init(key, sizes):
    keys = jax.random.split(key, len(sizes) - 1)
    return [{"w": jax.random.normal(k, (m, n)) / jnp.sqrt(m), "b": jnp.zeros(n)}
            for k, m, n in zip(keys, sizes[:-1], sizes[1:])]

def loss(params, x, y):                       # pure: output depends only on arguments
    for layer in params[:-1]:
        x = jax.nn.relu(x @ layer["w"] + layer["b"])
    return jnp.mean((x @ params[-1]["w"] + params[-1]["b"] - y) ** 2)

def sgd(params, grads, lr):                    # returns new parameters, mutates nothing
    return jax.tree.map(lambda p, g: p - lr * g, params, grads)

key = jax.random.key(0)
key, init_key, data_key = jax.random.split(key, 3)   # never reuse a key
params = init(init_key, [8, 32, 1])
x = jax.random.normal(data_key, (64, 8))
params = sgd(params, jax.grad(loss)(params, x, x[:, :1]), 0.1)
v = jnp.zeros(4).at[2].set(1.0)                # functional update: a new array`;

const TREES = `def tree_flatten(t):
    if isinstance(t, dict):
        keys = sorted(t)
        parts = [tree_flatten(t[k]) for k in keys]
        return [x for p in parts for x in p[0]], ('dict', keys, [p[1] for p in parts])
    if isinstance(t, (list, tuple)):
        parts = [tree_flatten(c) for c in t]
        return [x for p in parts for x in p[0]], (type(t).__name__, None, [p[1] for p in parts])
    return [t], None

def tree_unflatten(defn, leaves):
    it = iter(leaves)
    def build(d):
        if d is None:
            return next(it)
        kind, keys, kids = d
        vals = [build(k) for k in kids]
        return dict(zip(keys, vals)) if kind == 'dict' else list(vals) if kind == 'list' else tuple(vals)
    return build(defn)

def tree_map(f, tree, *rest):
    leaves, defn = tree_flatten(tree)
    others = [tree_flatten(r) for r in rest]
    if any(d != defn for _, d in others):
        raise ValueError('tree structures differ')
    return tree_unflatten(defn, [f(*xs) for xs in zip(leaves, *[l for l, _ in others])])`;

const KEYS = `import hashlib
import numpy as np

def split(key, num=2):
    return [int.from_bytes(hashlib.sha256(f'{key}:{i}'.encode()).digest()[:8], 'little') for i in range(num)]

def init_mlp(key, sizes):
    keys = split(key, len(sizes) - 1)
    return [{'w': np.random.default_rng(k).normal(size=(m, n)) / np.sqrt(m), 'b': np.zeros(n)}
            for k, m, n in zip(keys, sizes[:-1], sizes[1:])]

def dropout(key, x, rate):
    keep = np.random.default_rng(key).random(x.shape) >= rate
    return np.where(keep, x / (1 - rate), 0.0)`;

export const lesson: LessonContent = {
  id: "e6.5.1",
  minutes: 45,
  links: {
    requires: ["e6.4.5"],
    revisits: ["e6.3.1", "e1.3.2"],
    foreshadows: ["e6.5.2", "e6.5.3"],
  },

  puzzle: (
    <>
      <p>
        A PyTorch user moving to JAX finds that arrays cannot be modified in place, that a model is a nested dict of arrays
        passed into every function, that there is no global random seed, and that every random call takes a key that must
        be split by hand. It looks like ceremony. Yet these restrictions are what let JAX compile, differentiate, vectorise
        and shard any function the same way. What do they buy, and what are the data structures that make them bearable?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A function transformation such as <C>grad</C> or <C>jit</C> needs to know everything a function depends on and
        everything it produces. A pure function, whose output depends only on its arguments and which changes nothing
        outside itself, says this in its signature. So JAX asks for state to be passed in and returned: parameters,
        optimiser state, and randomness, represented as an explicit key. To keep this manageable, parameters live in
        pytrees, nested containers whose leaves are arrays, and one helper maps a function over all leaves at once.
      </p>
      <KeyedInitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="pure functions and pytrees">
        <p>
          A function is pure if it returns equal results for equal arguments and has no side effects. A pytree is a value
          built from registered containers (lists, tuples, dicts, None, and user classes that register themselves) with
          anything else as leaves. <C>tree_flatten</C> turns it into a list of leaves and a structure description;{" "}
          <C>tree_unflatten</C> rebuilds it; <C>jax.tree.map</C> applies a function leafwise to one or more trees of the
          same structure. Dict keys are visited in sorted order, so the flattening is deterministic.
        </p>
        <Code>{JAX}</Code>
      </Definition>

      <Theorem title="flattening round-trips">
        <p>
          For every pytree t, <C>tree_unflatten(*reversed(tree_flatten(t)))</C> equals t, and for trees t₁, …, tₖ with the
          same structure, <C>tree_map(f, t₁, …, tₖ)</C> has that structure and applies f to corresponding leaves.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on the tree. A leaf flattens to itself with an empty description and is rebuilt as the next leaf. A
          container flattens each child in a fixed order and concatenates their leaves, recording its kind, its keys and its
          children&apos;s descriptions; rebuilding visits the children in the same order, each consuming exactly the leaves
          its own flattening produced, so by hypothesis each child is rebuilt and the container is reassembled. Trees with
          equal descriptions have leaves in corresponding positions, so mapping over the zipped leaf lists and rebuilding
          gives the stated tree. Differing descriptions are an error rather than a silent misalignment.
        </p>
        <Code>{TREES}</Code>
      </Proof>

      <Example title="explicit random keys">
        <p>
          A key is a value, not a hidden state. Splitting a key gives new keys that are, for practical purposes, independent
          of it and of each other, and a random function given the same key returns the same numbers. Code that splits once
          per purpose and never reuses a key is reproducible no matter how it is reordered, compiled or run in parallel. The
          model below derives each child key by hashing the parent with an index, which is what <C>jax.random.fold_in</C>{" "}
          does with a counter-based generator.
        </p>
        <Code>{KEYS}</Code>
      </Example>

      <Remark title="where state goes">
        <p>
          Optimisers in Optax are pairs of pure functions, <C>init(params)</C> and{" "}
          <C>update(grads, state, params)</C>, returning new state. Libraries such as Flax and Equinox let you write classes
          but turn them into pytrees before any transformation. Python side effects in a jitted function, such as appending
          to a list or printing, run once while tracing and never again, which is the most common surprise.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "leaves",
      rung: "check",
      prompt: <p>How many leaves does the pytree <C>{"{'a': [1, 2, (3, 4)], 'b': {'c': 5}, 'd': ()}"}</C> have?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.1 },
    },
    {
      key: "keys",
      rung: "check",
      prompt: <p>A training loop splits its key into 3 every step (new loop key, dropout key, data key). How many keys has it created after 100 steps, counting the root?</p>,
      answer: { kind: "numeric", value: 301, tolerance: 0.1 },
    },
    {
      key: "reuse",
      rung: "apply",
      prompt: <p>A JAX program passes the same key to the dropout of every layer. What happens?</p>,
      answer: {
        kind: "choice",
        options: [
          "Layers of the same shape get identical dropout masks, so the masks are correlated rather than independent; nothing raises an error",
          "JAX raises an error when a key is used twice",
          "The masks are independent because each call advances the key",
          "Dropout is disabled",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tree_flatten(t):
    if isinstance(t, dict):
        keys = sorted(t)
        parts = [tree_flatten(t[k]) for k in keys]
        return [x for p in parts for x in p[0]], ('dict', keys, [p[1] for p in parts])
    if isinstance(t, (list, tuple)):
        parts = [tree_flatten(c) for c in t]
        return [x for p in parts for x in p[0]], (type(t).__name__, None, [p[1] for p in parts])
    return [t], None

def tree_unflatten(defn, leaves):
    it = iter(leaves)
    def build(d):
        if d is None:
            return next(it)
        kind, keys, kids = d
        vals = [build(k) for k in kids]
        return dict(zip(keys, vals)) if kind == 'dict' else list(vals) if kind == 'list' else tuple(vals)
    return build(defn)

def tree_map(f, tree, *rest):
    leaves, defn = tree_flatten(tree)
    others = [tree_flatten(r) for r in rest]
    if any(d != defn for _, d in others):
        raise ValueError('tree structures differ')
    return tree_unflatten(defn, [f(*xs) for xs in zip(leaves, *[l for l, _ in others])])

params = {'layers': [{'w': 1.0, 'b': 0.5}, {'w': -2.0, 'b': 0.0}], 'scale': (3.0,)}
leaves, d = tree_flatten(params); print(leaves, tree_unflatten(d, [10 * v for v in leaves]) == tree_map(lambda v: 10 * v, params))
grads = tree_map(lambda v: 0.5, params); print(tree_map(lambda p, g: p - g, params, grads)['scale'], params['scale'], type(tree_map(abs, params)['layers']).__name__)
try: tree_map(lambda a, b: a, params, {'layers': [], 'scale': (1.0,)})
except ValueError as e: print(e)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.0, 0.0, -2.0, 3.0] True\n(2.5,) (3.0,) list\ntree structures differ",
          "[1.0, 0.5, -2.0, 0.0, 3.0] True\n(2.5,) (3.0,) list\ntree structures differ",
          "[0.5, 1.0, 0.0, -2.0, 3.0] True\n(2.5,) (2.5,) list\ntree structures differ",
          "[0.5, 1.0, 0.0, -2.0, 3.0] True\n(2.5,) (3.0,) tuple\ntree structures differ",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import hashlib
import numpy as np

def split(key, num=2):
    return [int.from_bytes(hashlib.sha256(f'{key}:{i}'.encode()).digest()[:8], 'little') for i in range(num)]

def init_mlp(key, sizes):
    keys = split(key, len(sizes) - 1)
    return [{'w': np.random.default_rng(k).normal(size=(m, n)) / np.sqrt(m), 'b': np.zeros(n)}
            for k, m, n in zip(keys, sizes[:-1], sizes[1:])]

def dropout(key, x, rate):
    keep = np.random.default_rng(key).random(x.shape) >= rate
    return np.where(keep, x / (1 - rate), 0.0)

k0 = 42; a, b = split(k0); print(split(k0) == [a, b], a != b, len(split(k0, 5)), split(k0, 5)[:2] == [a, b])
p, q = init_mlp(k0, [2, 3, 4]), init_mlp(k0, [2, 3, 5]); print(np.array_equal(p[0]['w'], q[0]['w']), [l['w'].shape for l in q], q[1]['b'].tolist())
x = np.ones(6); print(np.array_equal(dropout(a, x, 0.5), dropout(a, x, 0.5)), sorted(set(dropout(b, x, 0.5).tolist())))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True True 5 True\nTrue [(2, 3), (3, 5)] [0.0, 0.0, 0.0, 0.0, 0.0]\nTrue [0.0, 2.0]",
          "True True 5 False\nTrue [(2, 3), (3, 5)] [0.0, 0.0, 0.0, 0.0, 0.0]\nTrue [0.0, 2.0]",
          "True True 5 True\nFalse [(2, 3), (3, 5)] [0.0, 0.0, 0.0, 0.0, 0.0]\nTrue [0.0, 2.0]",
          "True True 5 True\nTrue [(2, 3), (3, 5)] [0.0, 0.0, 0.0, 0.0, 0.0]\nFalse [0.0, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tree_flatten(t)</C> for dicts (sorted keys), lists and tuples, returning the leaves and a description
          (None for a leaf, otherwise (kind, keys, child descriptions)), <C>tree_unflatten(defn, leaves)</C>, and{" "}
          <C>tree_map(f, tree, *rest)</C>, raising ValueError when the structures differ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tree_flatten(t):
    return [t], None

def tree_unflatten(defn, leaves):
    return leaves[0]

def tree_map(f, tree, *rest):
    return f(tree, *rest)
`,
        solution: TREES,
        tests: [
          { name: "flatten", code: `t = {'z': [1, (2, 3)], 'a': {'y': 4, 'x': [5]}, 'm': ()}
leaves, d = tree_flatten(t); assert leaves == [5, 4, 1, 2, 3] and tree_unflatten(d, leaves) == t
r = tree_unflatten(d, list('abcde')); assert r == {'z': ['c', ('d', 'e')], 'a': {'y': 'b', 'x': ['a']}, 'm': ()} and isinstance(r['z'][1], tuple)
assert tree_flatten(7) == ([7], None)` },
          { name: "map", code: `p = {'w': [1.0, 2.0], 'b': (0.5,)}; g = {'b': (1.0,), 'w': [0.5, 0.5]}
assert tree_map(lambda a, b: a - 0.1 * b, p, g) == {'w': [0.95, 1.95], 'b': (0.4,)} and p == {'w': [1.0, 2.0], 'b': (0.5,)}
assert tree_map(lambda a, b, c: a + b + c, [1, (2,)], [10, (20,)], [100, (200,)]) == [111, (222,)]
for bad in [{'w': [1.0], 'b': (0.5,)}, {'w': (1.0, 2.0), 'b': (0.5,)}]:
    try:
        tree_map(lambda a, b: a, p, bad)
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
          Write <C>split(key, num=2)</C>, deriving key i from the first 8 bytes (little-endian) of the SHA-256 of the
          string <C>f&apos;&#123;key&#125;:&#123;i&#125;&apos;</C>, <C>init_mlp(key, sizes)</C>, giving each layer a dict
          with w drawn by <C>np.random.default_rng(k).normal</C> divided by the square root of its input size and zero b,
          and <C>dropout(key, x, rate)</C>, keeping entries whose uniform draw is at least rate and scaling them by 1/(1 −
          rate).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import hashlib
import numpy as np

def split(key, num=2):
    return [key] * num

def init_mlp(key, sizes):
    return []

def dropout(key, x, rate):
    return x
`,
        solution: KEYS,
        tests: [
          { name: "split", code: `k = split(7, 3); assert k[0] == int.from_bytes(hashlib.sha256(b'7:0').digest()[:8], 'little') and len(set(k)) == 3 and split(7) == k[:2]
p = init_mlp(7, [4, 2, 3]); assert [l['w'].shape for l in p] == [(4, 2), (2, 3)] and np.allclose(p[0]['w'], np.random.default_rng(k[0]).normal(size=(4, 2)) / 2) and p[1]['b'].tolist() == [0.0] * 3` },
          { name: "dropout", code: `x = np.arange(1.0, 9.0); y = dropout(11, x, 0.25); keep = np.random.default_rng(11).random(8) >= 0.25
assert np.allclose(y, np.where(keep, x / 0.75, 0.0)) and np.array_equal(dropout(11, x, 0.25), y) and not np.array_equal(dropout(12, x, 0.25), y) and np.array_equal(dropout(5, x, 0.0), x)` },
        ],
      },
    },
    {
      key: "tree",
      rung: "stretch",
      prompt: (
        <p>
          A transformer&apos;s parameter pytree has, per block, attention with four weight matrices and four biases, an MLP
          with two weights and two biases, and two norms with a scale and a bias each. With 24 blocks plus an embedding and a
          final norm (scale and bias), how many leaves does it have?
        </p>
      ),
      answer: { kind: "numeric", value: 387, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        With functions pure and state explicit, JAX can trace a function once with abstract values and compile the result.
        The next lesson looks at <C>jit</C>: what tracing records, what it cannot see, and when it retraces.
      </p>
    </>
  ),
};
