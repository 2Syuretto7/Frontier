import { M } from "@/components/Math";
import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DDMinViz } from "@/components/viz/DDMinViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.2.2",
  minutes: 55,
  links: {
    requires: ["e4.2.1"],
    revisits: ["e0.6.1", "e4.1.2"],
    foreshadows: ["e4.2.3", "e4.3.1"],
  },

  puzzle: (
    <>
      <p>
        A training run produces a NaN loss after three hours, at step 41,200, on eight GPUs. Every experiment you run to test
        a hypothesis costs three hours, so you can test two ideas a day.
      </p>
      <p>How do you turn a three-hour failure into a three-second one?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A minimal reproduction is the smallest program, input and setting that still fail. You get there by removing things
        and keeping each removal only if the failure survives. Removing things one at a time is slow on a long script. Delta
        debugging removes big chunks first, and only splits more finely when no chunk can go.
      </p>
      <DDMinViz />
      <p>
        Two lines out of sixteen remain, and together they tell the story: half precision plus a learning rate of 1.0
        overflows. Neither line alone fails, which is why chunks that separate them pass and the algorithm has to refine.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="minimal reproduction">
        <p>A good reproduction of a bug is</p>
        <ul>
          <li><strong>fast</strong>: seconds, so you can run many experiments;</li>
          <li><strong>deterministic</strong>: it fails every time, so a pass means something;</li>
          <li><strong>small</strong>: every line, flag and input dimension that remains is needed for the failure;</li>
          <li><strong>self-contained</strong>: it runs on someone else&rsquo;s machine with no private data.</li>
        </ul>
      </Definition>

      <Example title="getting to the failing step fast">
        <p>
          For a failure late in training, save a checkpoint shortly before it, along with the batch and random state at the
          failing step. Reloading them reproduces the step in seconds. Then shrink everything else: batch size, sequence
          length, number of layers, width, and every optional feature such as mixed precision, augmentation or gradient
          clipping, keeping each change only while the failure survives. Finally replace the real data with a small random
          array of the same shape and dtype, if the failure survives that too.
        </p>
      </Example>

      <Definition title="delta debugging">
        <p>
          Zeller&rsquo;s <em>ddmin</em> algorithm shrinks a failing list of parts, such as lines, files or examples. Start
          with n = 2. Split the list into n nearly equal chunks. If some chunk fails on its own, keep it and set n = 2. Else,
          if n &gt; 2 and some complement (the list without one chunk) fails, keep it and set n = max(n − 1, 2). Else, if
          the chunks are single items, stop; otherwise double n, up to the length of the list. The result is{" "}
          <em>1-minimal</em>: removing any single part makes the failure go away.
        </p>
      </Definition>

      <Proposition title="cost">
        <p>
          If the failure needs a single part out of n, ddmin halves the list with at most two tests per halving, so it finds the
          part with at most <M>{"2 \\log_2 n"}</M> tests. Removing parts one at a time needs about n tests. For failures that
          need several parts the cost grows, but it is rarely worse than the one-at-a-time approach.
        </p>
      </Proposition>

      <Remark title="when the failure is flaky">
        <p>
          A shrinking step that keeps a reduction because it passed once is only as good as the test. If the full program fails
          only one time in fifty, a single pass says little; repeat the test, or first make the failure deterministic by fixing
          seeds, the topic of the next chapter.
        </p>
      </Remark>

      <Example title="a good bug report">
        <Code>{`Title: NaN loss with model.half() and lr=1.0 on a two-layer MLP

Versions: Python 3.12.3, numpy 2.1.0, torch 2.5.1, CUDA 12.4, one A100
Reproduction (runs in two seconds, no data needed):
    ...twelve lines...
Expected: finite loss on every step.
Actual: loss is nan from step 3; the gradient norm is inf at step 2.
Not affected: float32, or lr=0.1.`}</Code>
        <p>
          Writing this often finds the bug: the &ldquo;not affected&rdquo; line is a list of experiments you already ran.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "report",
      rung: "check",
      prompt: <p>Which of these belong in a bug report for a library?</p>,
      answer: {
        kind: "choice",
        options: [
          "The versions of Python, the library and anything it depends on",
          "A short program that shows the failure",
          "What you expected and what actually happened",
          "Your full 2,000-line training script and a link to your private dataset",
        ],
        correct: [0, 1, 2],
      },
    },
    {
      key: "tests",
      rung: "apply",
      prompt: <p>A 1,024-line script fails because of a single line. At most how many tests does ddmin run to find it?</p>,
      answer: { kind: "numeric", value: 20, tolerance: 0 },
    },
    {
      key: "fast",
      rung: "apply",
      prompt: <p>A NaN appears at step 41,200, three hours into training. What is the best first step towards a fast reproduction?</p>,
      answer: {
        kind: "choice",
        options: [
          "Save a checkpoint, the batch and the random state just before the failing step, then reload them and run that one step",
          "Rerun the whole training with more print statements",
          "Shrink the model to one layer and train again from scratch",
          "Switch everything to float64 and train again",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`calls = 0
def fails(xs):
    global calls
    calls += 1
    return 3 in xs and 7 in xs

xs = list(range(10))
i = 0
while i < len(xs):
    trial = xs[:i] + xs[i + 1:]
    if fails(trial):
        xs = trial
    else:
        i += 1
print(xs, calls)`}</Code>
          <p>Removing one item at a time. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[3, 7] 10", "[3, 7] 8", "[3, 7] 45", "[7] 10"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`cfg = {'batch': 64, 'seq': 100}
fails = lambda c: c['batch'] * c['seq'] > 300
for k in cfg:
    while cfg[k] > 1 and fails({**cfg, k: cfg[k] // 2}):
        cfg[k] //= 2
print(cfg)`}</Code>
          <p>Halving each setting while the failure survives. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["{'batch': 4, 'seq': 100}", "{'batch': 1, 'seq': 301}", "{'batch': 4, 'seq': 75}", "{'batch': 2, 'seq': 100}"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ddmin(items, fails)</C> exactly as defined in the theory, returning the 1-minimal failing list with items in
          their original order. Split a list of length L into n chunks at positions <C>i * L // n</C> for i = 0, …, n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ddmin(items, fails):
    return list(items)
`,
        solution: `def ddmin(items, fails):
    items, n = list(items), 2
    while len(items) >= 2:
        chunks = [items[i * len(items) // n:(i + 1) * len(items) // n] for i in range(n)]
        for c in chunks:
            if fails(c):
                items, n = c, 2
                break
        else:
            for c in chunks if n > 2 else []:
                rest = [x for x in items if x not in c]
                if fails(rest):
                    items, n = rest, max(n - 1, 2)
                    break
            else:
                if n >= len(items):
                    break
                n = min(2 * n, len(items))
    return items
`,
        tests: [
          { name: "one culprit", code: `for k in [0, 13, 63]:
    calls = []
    def fails(xs):
        calls.append(1)
        return k in xs
    got = ddmin(list(range(64)), fails)
    assert got == [k], f'Culprit {k}: got {got}'
    assert len(calls) <= 14, f'Culprit {k}: {len(calls)} tests; halving needs at most 12.'` },
          { name: "several culprits", code: `for need, n in [((6, 10), 16), ((3, 40, 90), 100), ((10, 11, 12), 100), ((0, 99), 100)]:
    fails = lambda xs: all(x in xs for x in need)
    got = ddmin(list(range(n)), fails)
    assert got == list(need), f'Needs {need}: got {got}'
odd = lambda xs: sum(xs) % 2 == 1 and len(xs) >= 2
got = ddmin([2, 4, 1, 6, 8, 3, 5], odd)
assert odd(got) and all(not odd(got[:i] + got[i + 1:]) for i in range(len(got))), f'{got} is not 1-minimal.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shrink_config(config, fails)</C>, which returns a new dict and leaves config unchanged. Go through the keys
          in order. A True flag becomes False if the failure survives. An int is halved (integer division) while it is above 1
          and the failure survives, and then reduced by 1 while it is above 1 and the failure survives. Leave other values
          alone. Check for bool before int, since True is also an int.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def shrink_config(config, fails):
    return dict(config)
`,
        solution: `def shrink_config(config, fails):
    cfg = dict(config)
    for k, v in config.items():
        if isinstance(v, bool):
            if v and fails({**cfg, k: False}):
                cfg[k] = False
        elif isinstance(v, int):
            while cfg[k] > 1 and fails({**cfg, k: cfg[k] // 2}):
                cfg[k] //= 2
            while cfg[k] > 1 and fails({**cfg, k: cfg[k] - 1}):
                cfg[k] -= 1
    return cfg
`,
        tests: [
          { name: "nan bug", code: `cfg = {'batch': 256, 'seq_len': 512, 'layers': 12, 'amp': True, 'dropout': True, 'name': 'run7', 'lr': 0.5}
fails = lambda c: c['seq_len'] > 4 and c['batch'] >= 2 and c['amp']
got = shrink_config(cfg, fails)
want = {'batch': 2, 'seq_len': 5, 'layers': 1, 'amp': True, 'dropout': False, 'name': 'run7', 'lr': 0.5}
assert got == want, got
assert cfg['batch'] == 256 and cfg['dropout'] is True, 'Do not change the dict you were given.'` },
          { name: "always failing", code: `seen = []
def fails(c):
    seen.append(dict(c))
    return c['width'] % 3 == 0 or c['width'] == 1
got = shrink_config({'width': 96, 'bias': False}, fails)
assert got == {'width': 1, 'bias': False}, got
assert all(set(c) == {'width', 'bias'} for c in seen), 'Pass fails the whole config each time.'
assert shrink_config({'width': 7}, lambda c: c['width'] >= 7) == {'width': 7}` },
        ],
      },
    },
    {
      key: "minimal",
      rung: "prove",
      prompt: (
        <p>
          Suppose the failure is monotone: if a list fails, every list containing it fails too. Prove that the one-at-a-time
          loop in the first reading exercise ends with a 1-minimal failing list. Then give an example showing that without
          monotonicity it can end with a list from which one item can still be removed.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the current list always fails, because a trial replaces it only when the trial fails.",
          "Notes that every remaining item x was tested once, when the list was some L containing the final list F, and L without x passed.",
          "Uses monotonicity: if F without x failed, its superset L without x would fail too, a contradiction, so removing any single item from F passes.",
          "Gives a valid non-monotone counterexample, such as a failure that needs an even number of items or that needs one item absent, and traces the loop to show a removable item is left.",
        ],
      },
    },
    {
      key: "flaky",
      rung: "stretch",
      prompt: (
        <p>
          The full program fails in 1 run out of 50, independently. After removing some lines, how many consecutive passing runs
          do you need before the chance of seeing them, if the bug were still there, is at most 5%?
        </p>
      ),
      answer: { kind: "numeric", value: 149, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend why it is worth spending an hour making a failure reproduce in seconds before trying to fix it, and how delta debugging finds the few lines that matter.",

  glimpse: (
    <p>
      A minimal reproduction shows where to look. Next, debuggers and bisection: stepping through the failing program line by
      line, and searching through history or through a long computation for the first moment things go wrong.
    </p>
  ),
};
