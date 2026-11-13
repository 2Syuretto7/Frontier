import { M, MD } from "@/components/Math";
import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MemoryTimelineViz } from "@/components/viz/MemoryTimelineViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.5.2",
  minutes: 55,
  links: {
    requires: ["e4.5.1"],
    revisits: ["e1.5.4", "e1.5.6"],
    foreshadows: ["e4.5.3", "e10.1.1"],
  },

  puzzle: (
    <>
      <p>
        Your training run uses 9 GB of a 16 GB GPU at step 1, 11 GB at step 1,000 and 13 GB at step 2,000. At step 3,100 it
        dies with &ldquo;CUDA out of memory&rdquo;. The model, batch size and data never changed.
      </p>
      <p>What is growing?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Memory in a training step has a shape: parameters and optimiser state sit there throughout, activations pile up
        through the forward pass because backward will need them, and they are freed as backward consumes them. The peak, not
        the average, decides whether you run out. A leak is memory that should have been freed and was not, usually because
        something still refers to it.
      </p>
      <MemoryTimelineViz />
      <p>
        The leak here is a single innocent line, <C>losses.append(loss)</C>. A loss tensor remembers the graph that produced
        it, so keeping it keeps every activation of that step alive. <C>losses.append(loss.item())</C> keeps only a number.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="where training memory goes">
        <ul>
          <li><strong>Parameters</strong>: N numbers.</li>
          <li><strong>Gradients</strong>: another N, from the backward pass until the optimiser step.</li>
          <li><strong>Optimiser state</strong>: none for SGD, N for momentum, 2N for Adam, usually kept in float32.</li>
          <li>
            <strong>Activations</strong> saved for backward: proportional to batch × sequence length × width × layers, so they
            dominate for large batches and long sequences.
          </li>
          <li><strong>Temporaries</strong> and fragmentation: buffers that exist only inside an operation, and gaps the allocator cannot reuse.</li>
        </ul>
        <p>
          Training in float32 with Adam costs <M>{"4 + 4 + 8 = 16"}</M> bytes per parameter before any activations, so 7
          billion parameters need 112 GB.
        </p>
      </Definition>

      <Example title="measuring">
        <Code>{`import tracemalloc                       # Python objects
tracemalloc.start()
before = tracemalloc.take_snapshot()
run_some_steps()
after = tracemalloc.take_snapshot()
for stat in after.compare_to(before, "lineno")[:5]:
    print(stat)                            # the lines whose allocations grew most

torch.cuda.reset_peak_memory_stats()     # GPU tensors
step()
print(torch.cuda.max_memory_allocated() / 2**30, "GB at peak")`}</Code>
        <p>
          A leak shows as memory that grows step after step; compare snapshots a few steps apart and look for the same line
          growing every time.
        </p>
      </Example>

      <Definition title="common leaks and wastes">
        <ul>
          <li>Keeping tensors that hold a graph: losses, outputs or hidden states stored in a list across steps.</li>
          <li>Caches without a bound, such as memoising features of every example seen.</li>
          <li>A small view keeping a large array alive: <C>x[:10]</C> refers to all of x&rsquo;s memory.</li>
          <li>Evaluation without <C>torch.no_grad()</C>, which saves activations that will never be used.</li>
        </ul>
      </Definition>

      <Proposition title="gradient checkpointing">
        <p>
          In an L-layer network, storing every layer&rsquo;s activations needs L layers&rsquo; worth of memory. Storing only
          the input of every k-th layer, and recomputing a block of k layers during backward when it is needed, needs about{" "}
          <M>{"L/k + k"}</M>, which is smallest at <M>{"k = \\sqrt L"}</M>:
        </p>
        <MD>{"\\min_k \\Big(\\frac{L}{k} + k\\Big) = 2\\sqrt{L},"}</MD>
        <p>at the cost of one extra forward pass, roughly a third more compute.</p>
      </Proposition>

      <Remark title="peak, not total">
        <p>
          Out-of-memory errors happen at the peak, usually late in the forward pass or early in backward. Reducing anything
          that is not alive at the peak saves nothing. Mixed precision halves activations; smaller micro-batches with gradient
          accumulation reduce them in proportion; checkpointing trades compute for them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dominant",
      rung: "check",
      prompt: <p>For a large model trained with a long sequence length and a large batch, which usually dominates the peak memory?</p>,
      answer: {
        kind: "choice",
        options: ["Activations saved for the backward pass", "The Python interpreter", "The learning-rate schedule", "The data loader's file handles"],
        correct: [0],
      },
    },
    {
      key: "adam",
      rung: "apply",
      prompt: <p>How many GB do parameters, gradients and Adam state take for a 7-billion-parameter model trained in float32 (1 GB = 10⁹ bytes)?</p>,
      answer: { kind: "numeric", value: 112, tolerance: 0 },
    },
    {
      key: "leak",
      rung: "apply",
      prompt: <p>Memory grows every step. The training loop contains <C>history.append(loss)</C>. What is the fix?</p>,
      answer: {
        kind: "choice",
        options: [
          "history.append(loss.item()), which keeps a Python float instead of a tensor with its graph",
          "Call gc.collect() every step",
          "Use a smaller batch",
          "Delete history at the end of training",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`cache = {}
def features(x):
    if x not in cache:
        cache[x] = [x] * 1000
    return cache[x]

a = features(1)
b = features(1)
c = features(2)
a.append(0)
print(len(cache), len(b), b is a, len(c))`}</Code>
          <p>A memoising cache. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 1001 True 1000", "3 1000 False 1000", "2 1000 True 1000", "2 1001 False 1000"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.zeros((1000, 1000))
v = x[::2]
c = x[::2].copy()
print(x.nbytes // 10**6, v.nbytes // 10**6, c.nbytes // 10**6, v.base is x, c.base is None)`}</Code>
          <p>A view and a copy of half the rows. What does this print? (Note that v keeps all 8 MB of x alive, even after <C>del x</C>.)</p>
        </>
      ),
      answer: { kind: "choice", options: ["8 4 4 True True", "8 0 4 True True", "8 4 4 False True", "8 8 4 True False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <Code>{`memory_budget(n_params, optimizer, dtype_bytes, batch,
              tokens, hidden, layers, saved_per_layer)`}</Code>
          <p>
            Write this function,
            returning a dict of bytes with keys params, grads, optimizer, activations and total. Parameters and gradients take
            dtype_bytes each; the optimiser state is float32, with 0, 1 or 2 numbers per parameter for{" "}
            <C>&apos;sgd&apos;</C>, <C>&apos;momentum&apos;</C> and <C>&apos;adam&apos;</C>; activations are batch × tokens ×
            hidden × layers × saved_per_layer numbers of dtype_bytes each.
          </p>
          <p>
            Then write <C>max_batch(limit, **kw)</C>, the largest batch whose total fits in limit bytes, given every other
            argument as a keyword; return 0 if not even the fixed part fits.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def memory_budget(n_params, optimizer, dtype_bytes, batch, tokens, hidden, layers, saved_per_layer):
    return {'total': 0}

def max_batch(limit, **kw):
    return 0
`,
        solution: `STATE = {'sgd': 0, 'momentum': 1, 'adam': 2}

def memory_budget(n_params, optimizer, dtype_bytes, batch, tokens, hidden, layers, saved_per_layer):
    parts = {
        'params': n_params * dtype_bytes,
        'grads': n_params * dtype_bytes,
        'optimizer': n_params * STATE[optimizer] * 4,
        'activations': batch * tokens * hidden * layers * saved_per_layer * dtype_bytes,
    }
    parts['total'] = sum(parts.values())
    return parts

def max_batch(limit, **kw):
    fixed = memory_budget(batch=0, **kw)['total']
    per_example = memory_budget(batch=1, **kw)['total'] - fixed
    return max(0, (limit - fixed) // per_example)
`,
        tests: [
          { name: "budget", code: `m = memory_budget(7 * 10**9, 'adam', 4, 0, 2048, 4096, 32, 16)
assert m['params'] == 28 * 10**9 and m['optimizer'] == 56 * 10**9 and m['total'] == 112 * 10**9, m
m = memory_budget(10**9, 'momentum', 2, 8, 1024, 2048, 24, 20)
assert m == {'params': 2 * 10**9, 'grads': 2 * 10**9, 'optimizer': 4 * 10**9,
             'activations': 8 * 1024 * 2048 * 24 * 20 * 2, 'total': 8 * 10**9 + 8 * 1024 * 2048 * 24 * 20 * 2}, m
assert memory_budget(100, 'sgd', 4, 1, 1, 1, 1, 1)['total'] == 804` },
          { name: "max batch", code: `kw = dict(n_params=10**9, optimizer='adam', dtype_bytes=2, tokens=1024, hidden=2048, layers=24, saved_per_layer=20)
per = 1024 * 2048 * 24 * 20 * 2
fixed = 12 * 10**9
assert max_batch(80 * 10**9, **kw) == (68 * 10**9) // per
b = max_batch(80 * 10**9, **kw)
assert memory_budget(batch=b, **kw)['total'] <= 80 * 10**9 < memory_budget(batch=b + 1, **kw)['total']
assert max_batch(10 * 10**9, **kw) == 0, 'If the fixed part does not fit, return 0.'
assert max_batch(fixed + per - 1, **kw) == 0 and max_batch(fixed + per, **kw) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>leaks(snapshots, top=3)</C>. Each snapshot, taken after a training step, maps an allocation site (such as{" "}
          <C>&apos;train.py:42&apos;</C>) to bytes. Return the sites present in every snapshot whose size strictly increased
          between every pair of consecutive snapshots, sorted by total growth from first to last, largest first, ties by name,
          at most top of them.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def leaks(snapshots, top=3):
    return []
`,
        solution: `def leaks(snapshots, top=3):
    sites = set(snapshots[0])
    for s in snapshots[1:]:
        sites &= set(s)
    growing = [n for n in sites if all(b[n] > a[n] for a, b in zip(snapshots, snapshots[1:]))]
    growing.sort(key=lambda n: (snapshots[0][n] - snapshots[-1][n], n))
    return growing[:top]
`,
        tests: [
          { name: "finds growth", code: `snaps = [
    {'train.py:42': 100, 'data.py:10': 500, 'model.py:7': 900, 'cache.py:3': 10},
    {'train.py:42': 200, 'data.py:10': 480, 'model.py:7': 900, 'cache.py:3': 20, 'eval.py:1': 5},
    {'train.py:42': 300, 'data.py:10': 520, 'model.py:7': 900, 'cache.py:3': 30},
    {'train.py:42': 400, 'data.py:10': 530, 'model.py:7': 900, 'cache.py:3': 40},
]
assert leaks(snaps) == ['train.py:42', 'cache.py:3'], leaks(snaps)
assert leaks(snaps, top=1) == ['train.py:42']` },
          { name: "ties and edges", code: `snaps = [{'b': 1, 'a': 1, 'c': 5}, {'b': 3, 'a': 3, 'c': 6}]
assert leaks(snaps) == ['a', 'b', 'c'], 'Equal growth goes in name order.'
assert leaks([{'x': 1}, {'x': 1}]) == [], 'No growth, no leak.'
assert leaks([{'x': 1}, {'y': 2}, {'x': 3, 'y': 4}]) == [], 'A site missing from a snapshot is skipped.'` },
        ],
      },
    },
    {
      key: "sqrt",
      rung: "prove",
      prompt: (
        <p>
          With checkpointing every k layers in an L-layer network, memory is about <M>{"L/k + k"}</M> layers&rsquo; worth.
          Explain where each term comes from, and prove that the minimum over k &gt; 0 is <M>{"2\\sqrt L"}</M>, at{" "}
          <M>{"k = \\sqrt L"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains L/k as the stored block inputs and k as the activations of the one block being recomputed during backward.",
          "Minimises, by calculus (derivative −L/k² + 1 = 0) or by AM–GM (L/k + k ≥ 2√(L/k · k)), finding k = √L.",
          "Evaluates the minimum as 2√L.",
        ],
      },
    },
    {
      key: "sixty4",
      rung: "stretch",
      prompt: <p>For a 64-layer network, how many layers&rsquo; worth of activations does the best checkpointing schedule keep, in this model?</p>,
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend where the memory of a training step goes, why the peak matters more than the average, and how appending a loss tensor to a list can crash a run hours later.",

  glimpse: (
    <p>
      A single process can only use one core of Python at a time. Next, multiprocessing and the GIL: why threads do not speed
      up Python arithmetic, and when processes do.
    </p>
  ),
};
