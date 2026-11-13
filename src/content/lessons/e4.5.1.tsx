import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AmdahlViz } from "@/components/viz/AmdahlViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.5.1",
  minutes: 55,
  links: {
    requires: ["e4.4.3"],
    revisits: ["e1.5.2", "e1.3.4"],
    foreshadows: ["e4.5.2", "e4.5.3"],
  },

  puzzle: (
    <>
      <p>
        Training is slow, so you spend two days writing a custom fused kernel for the attention layer. It is three times
        faster than the original. The training step gets 4% faster.
      </p>
      <p>What should you have done before writing the kernel?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Programs spend their time in surprising places, and intuition about where is usually wrong. A profiler measures it.
        Only then is it clear what is worth speeding up, because a part that takes a small share of the time can only ever
        save that share.
      </p>
      <AmdahlViz />
      <p>
        Speeding up logging, 10% of the step, by a factor of a thousand saves barely 10%. Halving the data loading saves 15%.
        Optimise the biggest part first, then measure again: the ranking changes after every improvement.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="profilers">
        <p>
          A <em>deterministic</em> profiler such as <C>cProfile</C> records every function call and return; it is exact about
          call counts but slows the program, especially one with many small calls. A <em>sampling</em> profiler such as{" "}
          <C>py-spy</C> looks at the call stack many times a second; it adds little overhead and can attach to a running
          process, at the cost of statistical noise.
        </p>
        <Code>{`python -m cProfile -s cumtime train.py | head -30
py-spy record -o profile.svg --pid 12345        # a flame graph of a running job`}</Code>
        <p>
          For each function, <em>self</em> time (cProfile&rsquo;s <C>tottime</C>) is time spent in its own code, and{" "}
          <em>cumulative</em> time (<C>cumtime</C>) includes everything it called. Large cumulative and small self time means
          look inside; large self time means this is where the work is.
        </p>
      </Definition>

      <Example title="flame graphs">
        <p>
          A flame graph draws each sampled call stack as a column of boxes, callers below callees, and merges identical stacks.
          A box&rsquo;s width is the fraction of samples in which that function was on the stack. Wide boxes at the top are
          where time goes.
        </p>
      </Example>

      <Theorem title="Amdahl's law">
        <p>If a fraction p of the running time is sped up by a factor s and the rest is unchanged, the overall speed-up is</p>
        <MD>{"S = \\frac{1}{(1 - p) + p / s} < \\frac{1}{1 - p}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Take the original time as 1. The unchanged part still takes <M>{"1 - p"}</M>, and the improved part takes{" "}
          <M>{"p / s"}</M>, so the new time is <M>{"(1 - p) + p/s"}</M> and S is its reciprocal. Since{" "}
          <M>{"p/s > 0"}</M>, the new time exceeds <M>{"1 - p"}</M>, which gives the bound.
        </p>
      </Proof>

      <Remark title="timing GPU code">
        <p>
          GPU work is asynchronous: a call such as <C>y = model(x)</C> returns as soon as the kernels are queued. Timing it
          with a clock measures the launch, not the work, and the time shows up later in whatever line waits, often{" "}
          <C>loss.item()</C>. Call <C>torch.cuda.synchronize()</C> before reading the clock, or use{" "}
          <C>torch.profiler</C>, which records the GPU timeline. A GPU that is idle while the next batch loads is the most
          common bottleneck of all.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tottime",
      rung: "check",
      prompt: <p>In cProfile output, <C>train_step</C> has cumtime 95 s and tottime 0.2 s. What does that tell you?</p>,
      answer: {
        kind: "choice",
        options: [
          "Almost all the time is spent in functions that train_step calls, so look at those",
          "train_step itself is the bottleneck",
          "train_step was called 95 times",
          "The profiler overhead is 95 s",
        ],
        correct: [0],
      },
    },
    {
      key: "amdahl",
      rung: "apply",
      prompt: <p>Data loading takes 40% of each step. You make it 4 times faster. What is the overall speed-up? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 1.43, tolerance: 0.005 },
    },
    {
      key: "gpu",
      rung: "apply",
      prompt: (
        <p>
          You time <C>model(x)</C> on a GPU with <C>time.perf_counter()</C> before and after and get 0.3 ms, then{" "}
          <C>loss.item()</C> takes 80 ms. What is the likely explanation?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The forward pass was only queued; .item() waits for the GPU to finish it",
          ".item() is a slow function",
          "The model is very fast and the loss is slow",
          "perf_counter does not work with GPUs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`tree = ('step', 2, [('load', 5, []),
                    ('forward', 1, [('matmul', 6, []), ('softmax', 2, [])]),
                    ('log', 4, [])])

def cum(node):
    name, self_t, kids = node
    return self_t + sum(cum(k) for k in kids)

def flat(node, out):
    name, self_t, kids = node
    out[name] = (self_t, cum(node))
    for k in kids:
        flat(k, out)
    return out

f = flat(tree, {})
print(f['step'], f['forward'], max(f, key=lambda n: f[n][0]))`}</Code>
          <p>Self and cumulative times from a call tree. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(2, 20) (1, 9) matmul", "(2, 20) (1, 9) load", "(20, 20) (9, 9) step", "(2, 11) (1, 9) matmul"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def speedup(parts, which, factor):
    before = sum(parts.values())
    after = sum(t / factor if k == which else t for k, t in parts.items())
    return round(before / after, 2)

parts = {'data': 30, 'forward': 25, 'backward': 35, 'log': 10}
print(speedup(parts, 'backward', 2), speedup(parts, 'log', 1000), speedup(parts, 'data', 1e9))`}</Code>
          <p>Amdahl&rsquo;s law on the step from the viz. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.21 1.11 1.43", "2.0 1000.0 1e9", "1.21 1.11 1.3", "1.18 1.11 1.43"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write a small section profiler. <C>Profiler(clock)</C> takes a function returning the current time.{" "}
          <C>with prof.section(name):</C> times a block; sections can nest. <C>prof.report()</C> returns a dict from name to
          (calls, total, self), where total sums the block&rsquo;s elapsed times and self subtracts the time spent in sections
          directly nested inside it. A section that raises must still be recorded.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import contextlib

class Profiler:
    def __init__(self, clock):
        self.clock = clock

    @contextlib.contextmanager
    def section(self, name):
        yield

    def report(self):
        return {}
`,
        solution: `import contextlib

class Profiler:
    def __init__(self, clock):
        self.clock = clock
        self.stats = {}
        self.children = []

    @contextlib.contextmanager
    def section(self, name):
        start = self.clock()
        self.children.append(0.0)
        try:
            yield
        finally:
            elapsed = self.clock() - start
            inner = self.children.pop()
            calls, total, own = self.stats.get(name, (0, 0.0, 0.0))
            self.stats[name] = (calls + 1, total + elapsed, own + elapsed - inner)
            if self.children:
                self.children[-1] += elapsed

    def report(self):
        return dict(self.stats)
`,
        tests: [
          { name: "nested", code: `times = iter([0, 1, 4, 4, 5, 9, 10, 12])
prof = Profiler(lambda: next(times))
with prof.section('step'):
    with prof.section('data'):
        pass
    with prof.section('forward'):
        with prof.section('matmul'):
            pass
r = prof.report()
assert r == {'data': (1, 3, 3), 'matmul': (1, 4, 4), 'forward': (1, 6, 2), 'step': (1, 12, 3)}, r` },
          { name: "repeats and errors", code: `t = [0.0]
def clock():
    t[0] += 1.0
    return t[0]
prof = Profiler(clock)
for _ in range(3):
    with prof.section('step'):
        with prof.section('load'):
            pass
r = prof.report()
assert r['load'] == (3, 3.0, 3.0) and r['step'] == (3, 9.0, 6.0), r
try:
    with prof.section('crash'):
        raise RuntimeError('boom')
except RuntimeError:
    pass
assert prof.report()['crash'][0] == 1, 'A section that raises must still be recorded.'
with prof.section('after'):
    pass
assert prof.report()['after'][2] == prof.report()['after'][1], 'After an error, a new top-level section has no parent.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>A sampling profiler records call stacks, outermost first, such as <C>(&apos;main&apos;, &apos;step&apos;, &apos;matmul&apos;)</C>.</p>
          <ul>
            <li>
              <C>summarise(samples)</C> returns a dict from each function to (self, inclusive): the fraction of samples in which
              it is the innermost frame, and the fraction in which it appears anywhere, counting a sample once even if the
              function appears several times through recursion.
            </li>
            <li>
              <C>collapse(samples)</C> returns the counts of identical stacks keyed by the names joined with <C>;</C>, the
              input format of flame-graph tools.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def summarise(samples):
    return {}

def collapse(samples):
    return {}
`,
        solution: `def summarise(samples):
    n = len(samples)
    own, incl = {}, {}
    for stack in samples:
        own[stack[-1]] = own.get(stack[-1], 0) + 1
        for f in set(stack):
            incl[f] = incl.get(f, 0) + 1
    return {f: (own.get(f, 0) / n, incl[f] / n) for f in incl}

def collapse(samples):
    out = {}
    for stack in samples:
        key = ';'.join(stack)
        out[key] = out.get(key, 0) + 1
    return out
`,
        tests: [
          { name: "summarise", code: `S = [('main', 'step', 'load')] * 3 + [('main', 'step', 'fwd', 'matmul')] * 5 + [('main', 'step', 'fwd')] + [('main', 'log')]
s = summarise(S)
assert s['matmul'] == (0.5, 0.5) and s['fwd'] == (0.1, 0.6) and s['main'] == (0.0, 1.0) and s['log'] == (0.1, 0.1), s
rec = [('main', 'walk', 'walk', 'walk'), ('main', 'walk'), ('main',)]
r = summarise(rec)
assert r['walk'] == (2 / 3, 2 / 3), f'Count a recursive function once per sample; got {r["walk"]}'
assert r['main'] == (1 / 3, 1.0)` },
          { name: "collapse", code: `S = [('main', 'step', 'load'), ('main', 'step', 'load'), ('main', 'log'), ('main', 'step', 'load')]
assert collapse(S) == {'main;step;load': 3, 'main;log': 1}
assert collapse([]) == {}` },
        ],
      },
    },
    {
      key: "law",
      rung: "prove",
      prompt: (
        <p>
          Prove Amdahl&rsquo;s law: if a fraction p of the time is sped up by a factor s, the overall speed-up is{" "}
          <M>{"1/((1 - p) + p/s)"}</M>, and it is less than <M>{"1/(1 - p)"}</M> however large s is.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Normalises the original time to 1 and writes the new time as (1 − p) + p/s.",
          "Takes the ratio of old to new time to get the formula.",
          "Notes that p/s is positive, so the new time is more than 1 − p and the speed-up is less than 1/(1 − p), the limit as s grows.",
        ],
      },
    },
    {
      key: "need",
      rung: "stretch",
      prompt: <p>A part takes 60% of the step. By what factor must it be sped up to make the whole step twice as fast?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend why you should profile before optimising, and why making a part of a program a thousand times faster may barely change the total.",

  glimpse: (
    <p>
      Time is one resource; memory is the other, and running out of it stops a run outright. Next, memory profiling: where
      the memory of a training step goes, and how to find what is holding on to it.
    </p>
  ),
};
