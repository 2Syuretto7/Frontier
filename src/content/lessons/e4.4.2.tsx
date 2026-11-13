import { M } from "@/components/Math";
import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CouplingViz } from "@/components/viz/CouplingViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.4.2",
  minutes: 55,
  links: {
    requires: ["e4.4.1"],
    revisits: ["e0.3.4", "e1.3.3", "e1.4.1"],
    foreshadows: ["e4.4.3", "e4.6.3"],
  },

  puzzle: (
    <>
      <p>
        You want to try a new optimiser. In your training script, the optimiser&rsquo;s learning rate is read from a global,
        updated inside the evaluation function when validation loss stalls, and printed by the logger, which also decides when
        to save checkpoints. Swapping the optimiser breaks checkpointing.
      </p>
      <p>Why should the optimiser and the checkpoints know anything about each other?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A module is a part of a program with a small, explicit interface: the inputs it takes and the outputs it returns. As
        long as the interface stays the same, its insides can change without anything else noticing. Global variables and
        reaching into other parts&rsquo; internals create hidden interfaces, so a change anywhere can ripple everywhere.
      </p>
      <CouplingViz />
      <p>
        In the modular version, the training loop is the only place that knows about everything; each other part knows only
        what it is given. That is what makes each part testable alone, and replaceable.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="coupling and cohesion">
        <p>
          <em>Coupling</em> is how much modules depend on each other&rsquo;s details; <em>cohesion</em> is how closely the
          contents of one module belong together. Aim for low coupling and high cohesion: a module does one job, and talks to
          others only through its interface. Information hiding means each module keeps a decision that is likely to change,
          such as a file format or an optimiser&rsquo;s state, inside itself.
        </p>
      </Definition>

      <Definition title="pure functions and dependency injection">
        <p>
          A <em>pure</em> function&rsquo;s output depends only on its arguments and it changes nothing else, so it can be
          tested with a single call. Where a function needs something with state, such as a random generator, a logger or a data
          source, pass it in as an argument instead of reaching for a global. This is <em>dependency injection</em>, and it lets
          a test pass in a fake: a generator with a fixed seed, a logger that writes to a list.
        </p>
        <Code>{`def fit(w, data, loss_grad, lr, epochs, rng, log):   # every dependency is a parameter
    ...`}</Code>
      </Definition>

      <Example title="a training program in parts">
        <ul>
          <li><strong>data</strong>: a dataset with <C>__len__</C> and <C>__getitem__</C>, and a loader that batches it;</li>
          <li><strong>model</strong>: parameters and a forward function, nothing about data or optimisation;</li>
          <li><strong>loss</strong> and <strong>metrics</strong>: pure functions of predictions and targets;</li>
          <li><strong>optimiser</strong>: holds its state and updates parameters from gradients;</li>
          <li><strong>training loop</strong>: the one place that connects them, plus logging and checkpointing.</li>
        </ul>
        <p>
          A <em>registry</em> maps names in the config to implementations, so <C>model.name=transformer</C> picks a class
          without an <C>if</C> chain that every new model must edit.
        </p>
      </Example>

      <Proposition title="counting interactions">
        <p>
          Among n components, there are <M>{"\\binom{n}{2} = n(n-1)/2"}</M> pairs that could interact. Through shared global
          state any of them can; in a pipeline where each part talks only to the next, only n − 1 can. The difference is why a
          large tangled script becomes impossible to change safely while a modular one does not.
        </p>
      </Proposition>

      <Remark title="not too many pieces">
        <p>
          Modularity is a means, not a goal. A ten-line function split across four files, or an abstract base class with one
          subclass, adds interfaces without hiding anything. Split along the lines where things actually change independently.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pure",
      rung: "check",
      prompt: <p>Which function is easiest to test?</p>,
      answer: {
        kind: "choice",
        options: [
          "def accuracy(preds, labels): returns the fraction equal",
          "def accuracy(): reads the global model and val_loader, returns the fraction correct",
          "def accuracy(model): runs the model on the global val_loader and prints the result",
          "def accuracy(path): loads a checkpoint from disk and evaluates it",
        ],
        correct: [0],
      },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>A training program has 8 components that all read and write shared global state. How many pairs of components could interact?</p>,
      answer: { kind: "numeric", value: 28, tolerance: 0 },
    },
    {
      key: "inject",
      rung: "apply",
      prompt: <p>A function shuffles data with <C>random.shuffle</C>. Which change makes it testable with a fixed, known order?</p>,
      answer: {
        kind: "choice",
        options: [
          "Take a generator as a parameter and call rng.shuffle, so a test can pass random.Random(0)",
          "Call random.seed(0) inside the function",
          "Remove the shuffling",
          "Print the order so the test can read it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`history = []
def train_step(x, lr=0.1):
    history.append(x)
    return x - lr * 2 * x

def report():
    return len(history), round(history[-1], 3)

x = 1.0
for _ in range(3):
    x = train_step(x)
print(report())`}</Code>
          <p>Two functions coupled through a global list. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(3, 0.64)", "(3, 0.512)", "(4, 0.512)", "(3, 1.0)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Squares:
    def __init__(self, n):
        self.n = n
    def __len__(self):
        return self.n
    def __getitem__(self, i):
        if i >= self.n:
            raise IndexError(i)
        return i * i

def batches(ds, size):
    for start in range(0, len(ds), size):
        yield [ds[i] for i in range(start, min(start + size, len(ds)))]

print(list(batches(Squares(5), 2)), sum(Squares(4)))`}</Code>
          <p>A dataset defined only by its interface. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[[0, 1], [4, 9], [16]] 14", "[[0, 1], [4, 9]] 14", "[[0, 1], [4, 9], [16]] 30", "[[1, 4], [9, 16], [25]] 30"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit(w, data, loss_grad, lr, epochs, rng, log)</C> with every dependency injected. data is a list of (x, y)
          pairs and <C>loss_grad(w, x, y)</C> returns (loss, gradient) for a scalar w. Each epoch, shuffle a copy of the
          indices with <C>rng.shuffle</C> (leave data untouched), take an SGD step <C>w -= lr * grad</C> for each example in that
          order, then call <C>log(epoch, mean_loss)</C> with the mean of that epoch&rsquo;s losses, counting epochs from 0.
          Return w.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fit(w, data, loss_grad, lr, epochs, rng, log):
    return w
`,
        solution: `def fit(w, data, loss_grad, lr, epochs, rng, log):
    for epoch in range(epochs):
        order = list(range(len(data)))
        rng.shuffle(order)
        losses = []
        for i in order:
            loss, grad = loss_grad(w, *data[i])
            losses.append(loss)
            w -= lr * grad
        log(epoch, sum(losses) / len(losses))
    return w
`,
        tests: [
          { name: "fake generator and logger", code: `class Reverse:
    def __init__(self):
        self.calls = 0
    def shuffle(self, xs):
        self.calls += 1
        xs.reverse()
seen, logged = [], []
def lg(w, x, y):
    seen.append(x)
    return (w * x - y) ** 2, 2 * (w * x - y) * x
data = [(1.0, 2.0), (2.0, 4.0), (3.0, 6.0)]
rng = Reverse()
w = fit(0.0, data, lg, 0.01, 2, rng, lambda e, m: logged.append((e, m)))
assert rng.calls == 2, 'Shuffle once per epoch with the generator you were given.'
assert seen == [3.0, 2.0, 1.0] * 2, f'Visit examples in the shuffled order; saw {seen}'
assert data == [(1.0, 2.0), (2.0, 4.0), (3.0, 6.0)], 'Do not change the data.'
assert [e for e, _ in logged] == [0, 1] and logged[1][1] < logged[0][1], logged
assert abs(logged[0][1] - (36 + 3.28 ** 2 + 1.5088 ** 2) / 3) < 1e-9, f'Log the mean loss of the epoch; got {logged[0][1]}'` },
          { name: "learns and is reproducible", code: `import random
lg = lambda w, x, y: ((w * x - y) ** 2, 2 * (w * x - y) * x)
data = [(x / 10, 3 * x / 10) for x in range(1, 11)]
a, b, logs = [], [], []
w1 = fit(0.0, data, lg, 0.1, 30, random.Random(5), lambda e, m: a.append(m))
w2 = fit(0.0, data, lg, 0.1, 30, random.Random(5), lambda e, m: b.append(m))
assert abs(w1 - 3.0) < 1e-3, w1
assert w1 == w2 and a == b, 'The same injected generator must give exactly the same run.'
assert a[-1] < 1e-6 < a[0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write a class <C>Registry</C>. <C>@reg.register(&apos;name&apos;)</C> is a decorator that records a class or
          function under that name and returns it unchanged; registering a name twice raises <C>ValueError</C>.{" "}
          <C>reg.build(name, **kwargs)</C> calls the registered object with kwargs; an unknown name raises <C>KeyError</C>{" "}
          whose message lists the registered names in sorted order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `class Registry:
    pass
`,
        solution: `class Registry:
    def __init__(self):
        self.items = {}

    def register(self, name):
        def decorate(obj):
            if name in self.items:
                raise ValueError(f'{name!r} is already registered')
            self.items[name] = obj
            return obj
        return decorate

    def build(self, name, **kwargs):
        if name not in self.items:
            raise KeyError(f'unknown {name!r}; choose from {sorted(self.items)}')
        return self.items[name](**kwargs)
`,
        tests: [
          { name: "register and build", code: `models = Registry()
@models.register('mlp')
class MLP:
    def __init__(self, width=64, depth=2):
        self.width, self.depth = width, depth
@models.register('linear')
def linear(dim):
    return ('linear', dim)
assert MLP.__name__ == 'MLP' and MLP(1).width == 1, 'register must return the class unchanged.'
m = models.build('mlp', width=128)
assert isinstance(m, MLP) and m.width == 128 and m.depth == 2
assert models.build('linear', dim=3) == ('linear', 3)
other = Registry()
try:
    other.build('mlp')
except KeyError:
    pass
else:
    assert False, 'Each registry has its own entries; do not share them between instances.'` },
          { name: "errors", code: `r = Registry()
r.register('b')(lambda: 1)
r.register('a')(lambda: 2)
try:
    r.register('a')(lambda: 3)
except ValueError:
    pass
else:
    assert False, 'Registering a name twice should raise ValueError.'
assert r.build('a') == 2, 'A failed registration must not replace the first.'
try:
    r.build('c')
except KeyError as e:
    assert "['a', 'b']" in str(e), f'List the choices in sorted order; got {e}'
else:
    assert False, 'An unknown name should raise KeyError.'` },
        ],
      },
    },
    {
      key: "ripple",
      rung: "prove",
      prompt: (
        <p>
          In a pipeline of n stages where stage i receives only the output of stage i − 1, argue that a change inside stage i
          that keeps its outputs the same for every input cannot change any other stage&rsquo;s behaviour, and that a change
          to its outputs can only affect stages after it. Contrast this with stages that share global state.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Argues that every later stage's behaviour is a function of the outputs it receives, so identical outputs mean identical behaviour downstream.",
          "Notes that earlier stages never receive anything from stage i, so they are unaffected in either case.",
          "Contrasts with shared global state, where any stage may read what stage i writes, so a change can affect any other stage.",
        ],
      },
    },
    {
      key: "diff",
      rung: "stretch",
      prompt: <p>With 8 components, how many more pairs could interact under shared global state than in a pipeline where each talks only to the next?</p>,
      answer: { kind: "numeric", value: 21, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend why passing a random generator and a logger into a training function as arguments makes it easier to test and to change than reading them from globals.",

  glimpse: (
    <p>
      Modular code is easier to read, and somebody else will read it. Next, code review: what to look for in a colleague&rsquo;s
      change, and how to write changes that are easy to review.
    </p>
  ),
};
