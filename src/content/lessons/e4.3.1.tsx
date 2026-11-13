import { M } from "@/components/Math";
import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeedViz } from "@/components/viz/SeedViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.3.1",
  minutes: 55,
  links: {
    requires: ["e4.2.3"],
    revisits: ["e1.5.1", "e4.1.3"],
    foreshadows: ["e4.3.2", "e10.8.4"],
  },

  puzzle: (
    <>
      <p>
        You set <C>random.seed(0)</C> at the top of your script. Then you add a dropout layer, and suddenly your baseline, with
        dropout switched off, no longer reproduces its old numbers. Nothing in the baseline changed.
      </p>
      <p>How can code that never runs change the result?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A pseudo-random generator is a deterministic machine: the seed fixes the whole stream of numbers it will produce. But
        if several parts of a program draw from one stream, each part&rsquo;s numbers depend on how many the others took first.
        Creating a layer, even one that is switched off, may draw numbers for its weights and shift everything after it.
      </p>
      <SeedViz />
      <p>
        Give each purpose its own generator, seeded from the experiment&rsquo;s seed, and a change in one place stops
        rippling through the rest.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="generators and seeds">
        <p>
          A generator holds a state; each draw returns a number and updates the state. The seed sets the initial state. Prefer
          explicit generator objects to the hidden global ones:
        </p>
        <Code>{`rng = random.Random(seed)                  # Python
rng = np.random.default_rng(seed)          # NumPy
g = torch.Generator().manual_seed(seed)    # PyTorch, passed to the DataLoader and to init functions`}</Code>
        <p>
          A library that uses the global generator shares it with your code, so seed the globals too, but do not rely on them.
          Derive one generator per purpose (initialisation, data order, augmentation, dropout) from the experiment seed and a
          name, so that each stream depends only on its own uses.
        </p>
      </Definition>

      <Definition title="hidden sources of nondeterminism">
        <ul>
          <li>Data loader worker processes, each with its own generator, and the order in which their batches arrive.</li>
          <li>
            Iteration over a <C>set</C> of strings, whose order depends on string hashing, which Python randomises in every
            process unless <C>PYTHONHASHSEED</C> is set.
          </li>
          <li>
            Floating-point sums whose order varies: GPU atomic adds, parallel reductions, and different library versions or
            hardware choosing different kernels.
          </li>
          <li>Anything read from the clock, the file system&rsquo;s listing order, or the network.</li>
        </ul>
      </Definition>

      <Proposition title="addition is not associative">
        <p>
          Floating-point addition is commutative but not associative: rounding after each step means{" "}
          <M>{"(a + b) + c"}</M> and <M>{"a + (b + c)"}</M> can differ. With <M>{"a = 10^{16}"}</M> and b = c = 1, adding b
          to a rounds back to a, because the spacing of doubles near <M>{"10^{16}"}</M> is 2, while b + c = 2 survives. So the
          same numbers summed in a different order can give a different result, and a sum whose order depends on thread
          timing is not reproducible bit for bit.
        </p>
      </Proposition>

      <Example title="what reproducible means">
        <p>
          Bit-for-bit reproducibility needs the same seeds, deterministic kernels (<C>torch.use_deterministic_algorithms(True)</C>
          ), the same library versions and the same hardware. That is worth having for debugging, where replaying a run must
          hit the same NaN. For science it is not enough: a result should hold across seeds. Run several seeds and report the
          mean and the spread; a difference between two methods smaller than the seed-to-seed spread is not evidence of
          anything.
        </p>
      </Example>

      <Remark title="resuming">
        <p>
          A run resumed from a checkpoint reproduces the uninterrupted run only if the checkpoint also saves every
          generator&rsquo;s state, or if the randomness for each epoch and example is derived afresh from the seed and its
          position, such as <C>random.Random(f&quot;{"{seed}"}-{"{epoch}"}&quot;)</C>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sources",
      rung: "check",
      prompt: <p>Which of these can make two runs with the same seed give different results?</p>,
      answer: {
        kind: "choice",
        options: [
          "A GPU kernel that adds into one value with atomic adds",
          "Iterating over a set of strings to build the vocabulary",
          "Data loader workers whose batches are used in the order they arrive",
          "Calling rng.random() on a generator made with random.Random(seed), in the same order each run",
        ],
        correct: [0, 1, 2],
      },
    },
    {
      key: "spread",
      rung: "apply",
      prompt: (
        <p>
          A baseline reaches accuracies 71.2, 70.4, 71.8, 70.9 and 71.2 over five seeds. What is the sample standard deviation
          (dividing by n − 1)? Give two decimal places. Is a new method&rsquo;s single run at 71.4 evidence of an improvement?
        </p>
      ),
      answer: { kind: "numeric", value: 0.51, tolerance: 0.005 },
    },
    {
      key: "shared",
      rung: "apply",
      prompt: <p>In the viz above, why does a wider model change the data order when one generator is shared?</p>,
      answer: {
        kind: "choice",
        options: [
          "Initialising more weights draws more numbers first, so the shuffle starts from a later point in the stream",
          "The seed depends on the size of the model",
          "Wider models use a different random number algorithm",
          "The data order depends on the model's outputs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
a = random.Random(0)
b = random.Random(0)
x = [a.random() for _ in range(3)]
b.random()
y = [b.random() for _ in range(3)]
print(x[1:] == y[:2], x == y)`}</Code>
          <p>Two generators with the same seed, one of which draws an extra number. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False", "False False", "True True", "False True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def add(xs):
    total = 0.0
    for x in xs:
        total += x
    return total

xs = [1e16, 1.0, -1e16, 1.0]
print(add(xs), add(sorted(xs)), add([1.0, 1.0, 1e16, -1e16]))`}</Code>
          <p>The same four numbers added in three orders. Doubles near 10¹⁶ are spaced 2 apart. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0 0.0 2.0", "2.0 2.0 2.0", "0.0 0.0 0.0", "1.0 1.0 2.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>make_generators(seed, names)</C>, returning a dict from each name to its own <C>random.Random</C>, whose
            stream depends only on the seed and that name. Do not use <C>hash()</C>, which changes between Python processes
            for strings; <C>random.Random</C> accepts a string seed such as <C>{"f'{seed}:{name}'"}</C> and treats it the same
            way in every process.
          </p>
          <p>
            Then write <C>epoch_order(n, seed, epoch)</C>, a shuffled list of <C>range(n)</C> that depends only on n, seed and
            epoch, so that a run resumed at any epoch sees the same order as one that never stopped.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import random

def make_generators(seed, names):
    rng = random.Random(seed)
    return {name: rng for name in names}

def epoch_order(n, seed, epoch):
    return list(range(n))
`,
        solution: `import random

def make_generators(seed, names):
    return {name: random.Random(f'{seed}:{name}') for name in names}

def epoch_order(n, seed, epoch):
    order = list(range(n))
    random.Random(f'{seed}-epoch-{epoch}').shuffle(order)
    return order
`,
        tests: [
          { name: "independent streams", code: `import builtins
real_hash = builtins.hash
builtins.hash = lambda x: (_ for _ in ()).throw(AssertionError('Do not call hash(); it differs between processes.'))
try:
    g1 = make_generators(7, ['init', 'data', 'dropout'])
    g2 = make_generators(7, ['data', 'aug'])
    g3 = make_generators(8, ['data'])
finally:
    builtins.hash = real_hash
assert len({id(g) for g in g1.values()}) == 3, 'Each name needs its own generator object.'
for _ in range(5):
    g1['init'].random()
a = [g1['data'].random() for _ in range(5)]
b = [g2['data'].random() for _ in range(5)]
assert a == b, 'The data stream must depend only on the seed and the name, not on other names or their draws.'
assert [g3['data'].random() for _ in range(5)] != b, 'A different seed must give a different stream.'
assert [g1['dropout'].random() for _ in range(5)] != a, 'Different names must give different streams.'` },
          { name: "resumable order", code: `o = epoch_order(20, 3, 5)
assert sorted(o) == list(range(20)), 'The order must be a permutation of range(n).'
assert o == epoch_order(20, 3, 5), 'The same n, seed and epoch must give the same order.'
orders = [tuple(epoch_order(20, 3, e)) for e in range(6)]
assert len(set(orders)) == 6, 'Each epoch should be shuffled differently.'
assert epoch_order(20, 4, 5) != o, 'The seed must matter.'
import random
random.seed(123); first = epoch_order(20, 3, 2)
random.seed(999); random.random(); second = epoch_order(20, 3, 2)
assert first == second, 'Do not use the global generator; its state depends on everything else in the program.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two tools for checking determinism.</p>
          <ul>
            <li>
              <C>check_determinism(fn, runs=3)</C> calls <C>fn()</C> runs times; each call returns a dict of named results.
              Return the sorted list of keys whose values are not exactly equal in every run.
            </li>
            <li>
              <C>first_divergence(a, b)</C> takes two lists of logged losses and returns the first index where they differ,
              treating two NaNs as equal. If one list is a prefix of the other, return the length of the shorter; if they are
              identical, return None.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def check_determinism(fn, runs=3):
    return []

def first_divergence(a, b):
    return None
`,
        solution: `import math

def check_determinism(fn, runs=3):
    results = [fn() for _ in range(runs)]
    return sorted(k for k in results[0] if any(r[k] != results[0][k] for r in results[1:]))

def first_divergence(a, b):
    for i, (x, y) in enumerate(zip(a, b)):
        if x != y and not (math.isnan(x) and math.isnan(y)):
            return i
    return None if len(a) == len(b) else min(len(a), len(b))
`,
        tests: [
          { name: "determinism", code: `import random
def train():
    rng = random.Random(5)
    noisy = random.random()
    order = sorted({'cat', 'dog', 'emu', 'fox'})
    return {'loss': sum(rng.random() for _ in range(10)), 'noise': noisy, 'vocab': order, 'steps': 10}
assert check_determinism(train) == ['noise'], check_determinism(train)
assert check_determinism(lambda: {'a': 1, 'b': [1, 2]}, runs=5) == []
calls = []
def counted():
    calls.append(1)
    return {'x': len(calls) // 3}
assert check_determinism(counted, runs=4) == ['x'] and len(calls) == 4` },
          { name: "divergence", code: `nan = float('nan')
assert first_divergence([2.3, 2.1, 1.9], [2.3, 2.1, 1.9]) is None
assert first_divergence([2.3, 2.1, 1.9], [2.3, 2.1000001, 1.9]) == 1
assert first_divergence([2.3, nan, nan], [2.3, nan, nan]) is None, 'Two NaNs at the same step count as equal.'
assert first_divergence([2.3, nan], [2.3, 1.0]) == 1
assert first_divergence([1.0, 2.0], [1.0, 2.0, 3.0]) == 2
assert first_divergence([], [1.0]) == 0` },
        ],
      },
    },
    {
      key: "order",
      rung: "prove",
      prompt: (
        <p>
          Give three doubles a, b, c for which <M>{"(a + b) + c \\ne a + (b + c)"}</M>, explaining the rounding. Then argue why a
          parallel sum that combines the workers&rsquo; partial sums in the order they finish may differ between runs, while
          one that combines them in a fixed order does not.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a valid example, such as a = 1e16 and b = c = 1, and explains that a + b rounds back to a while b + c is exact.",
          "Notes that the finishing order of workers can vary from run to run, so the sequence of additions, and therefore the rounding, varies too.",
          "Notes that with a fixed combining order every addition, and so every rounding, is the same in each run, giving the same bits.",
        ],
      },
    },
    {
      key: "collide",
      rung: "stretch",
      prompt: (
        <p>
          You pick a random 32-bit seed for each of 10,000 runs. What is the expected number of pairs of runs that get the same
          seed? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0116, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why setting one global seed is not enough to make a training run reproducible, and what else has to be pinned down.",

  glimpse: (
    <p>
      A seed is one of many settings that decide what a run does. Next, configuration management: keeping every setting in one
      place, saved with the results, so you can always say exactly what produced a number.
    </p>
  ),
};
