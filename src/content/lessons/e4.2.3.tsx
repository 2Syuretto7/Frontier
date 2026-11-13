import { M } from "@/components/Math";
import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PdbViz } from "@/components/viz/PdbViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.2.3",
  minutes: 60,
  links: {
    requires: ["e4.2.2"],
    revisits: ["e1.2.4", "e1.3.2", "e0.6.3"],
    foreshadows: ["e4.5.1", "e4.6.3"],
  },

  puzzle: (
    <>
      <p>
        A function crashes deep inside a data pipeline. You add a print statement, rerun for two minutes, see that you printed
        the wrong variable, add another print, and rerun again. After the fifth rerun you have the value you needed.
      </p>
      <p>Is there a way to ask the crashed program about all its variables at once, without rerunning it?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A debugger pauses a running program and lets you look at every variable, step one line at a time, and move up the call
        stack to see who called whom with what. After a crash, a <em>post-mortem</em> debugger opens at the line that failed,
        with everything still in memory. Step through this small function, or continue straight to its crash.
      </p>
      <PdbViz />
      <p>
        Stepping line by line is the slow way in; continuing to the crash and looking around is usually faster. For a failure
        that happens late in a long computation, there is a third way: search for the first moment it went wrong, by halving.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="pdb">
        <p>
          Put <C>breakpoint()</C> on a line to pause there, or run <C>python -m pdb -c continue script.py</C> to run a script
          and stop in the debugger if it crashes. In the debugger:
        </p>
        <ul>
          <li><C>p expr</C> and <C>pp expr</C> print a value; <C>l</C> lists the code around the current line;</li>
          <li><C>n</C> runs the next line, <C>s</C> steps into a function call, <C>r</C> runs until the current function returns, <C>c</C> continues;</li>
          <li><C>w</C> shows the stack, and <C>u</C> and <C>d</C> move up and down it, to the caller and back;</li>
          <li><C>b file.py:42, i == 999</C> sets a breakpoint that stops only when the condition holds.</li>
        </ul>
        <p>
          In Jupyter or IPython, <C>%debug</C> after a crash opens the post-mortem debugger on the last exception.
        </p>
      </Definition>

      <Example title="making silent failures loud">
        <p>
          A NaN does not crash anything; it spreads. Ask the libraries to raise at the first bad operation, so the debugger can
          stop where it happens:
        </p>
        <Code>{`np.seterr(all="raise")                   # numpy: FloatingPointError on divide by zero, overflow, invalid
torch.autograd.set_detect_anomaly(True)  # torch: error in backward, naming the forward op that made the NaN`}</Code>
        <p>Both slow the program down, so use them while debugging, not in every run.</p>
      </Example>

      <Definition title="bisection">
        <p>
          Suppose a predicate is true at 0 and false at n, and you want the first point where it is false: the first bad
          commit, the first training step with a NaN, the first layer whose output differs. Keep lo with the predicate true and
          hi with it false; test the midpoint and move whichever end it matches. When hi = lo + 1, hi is the answer.
        </p>
      </Definition>

      <Proposition title="cost and robustness">
        <p>
          Bisection makes at most <M>{"\\lceil \\log_2 n \\rceil"}</M> tests. If the predicate is monotone (once false, always
          false), hi is the first false point. If it is not, bisection still ends at a point where it switches from true to
          false, just not necessarily the first.
        </p>
      </Proposition>

      <Example title="bisecting a training run">
        <p>
          A NaN appears somewhere before step 100,000, and you saved checkpoints every 1,000 steps. Checking a checkpoint for
          NaNs is instant, so bisect over checkpoints first: at most 7 checks. Then replay from the last good checkpoint, at
          most 1,000 steps, checking after each. Training must be deterministic for the replay to find the same NaN, which is
          the subject of the next chapter. For bugs that appeared in the code&rsquo;s history,{" "}
          <C>git bisect run python repro.py</C> automates the same search over commits, using the exit code of a minimal
          reproduction.
        </p>
      </Example>

      <Remark title="print or debugger">
        <p>
          Prints are fine for a quick look and for code that runs on a remote machine or many processes. A debugger wins when
          you do not yet know which value matters. Logging, the permanent form of printing, wins when the failure is rare: you
          cannot attach a debugger to last night&rsquo;s run, but you can read its logs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "step",
      rung: "check",
      prompt: <p>You are paused on a line that calls <C>loss_fn(pred, y)</C> and want to see what happens inside it. Which pdb command do you use?</p>,
      answer: { kind: "choice", options: ["s", "n", "c", "u"], correct: [0] },
    },
    {
      key: "probes",
      rung: "apply",
      prompt: <p>The loss is finite at step 0 and NaN at step 100,000, and once NaN it stays NaN. If you can check any step, how many checks does bisection need, at most, to find the first NaN step?</p>,
      answer: { kind: "numeric", value: 17, tolerance: 0 },
    },
    {
      key: "seterr",
      rung: "apply",
      prompt: <p>What does <C>np.seterr(all=&quot;raise&quot;)</C> change?</p>,
      answer: {
        kind: "choice",
        options: [
          "Division by zero, overflow and invalid operations such as log of a negative number raise FloatingPointError instead of producing inf or NaN with a warning",
          "NumPy raises an error whenever an array contains a NaN, even one loaded from a file",
          "Every NumPy warning is printed, but nothing changes",
          "NumPy switches to float64 to avoid overflow",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def first_bad(n, ok):
    lo, hi = 0, n    # ok(lo) is True, ok(hi) is False
    probes = []
    while hi - lo > 1:
        mid = (lo + hi) // 2
        probes.append(mid)
        if ok(mid):
            lo = mid
        else:
            hi = mid
    return hi, probes

print(first_bad(16, lambda s: s < 11))`}</Code>
          <p>Bisection over 16 steps. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(11, [8, 12, 10, 11])", "(11, [8, 12, 10])", "(10, [8, 12, 10, 11])", "(11, [8, 4, 6, 7])"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
np.seterr(all='raise')
x = np.array([1.0, 0.0, 2.0])
out = []
for name, f in [('log', np.log), ('sqrt', np.sqrt), ('inv', lambda v: 1 / v), ('neg', lambda v: np.sqrt(-v))]:
    try:
        f(x)
        out.append(name + ' ok')
    except FloatingPointError as e:
        out.append(name + ' ' + str(e).split()[0])
print(out)`}</Code>
          <p>
            The error messages start with &ldquo;divide by zero&rdquo;, &ldquo;overflow&rdquo; or &ldquo;invalid value&rdquo;.
            What does this print?
          </p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['log divide', 'sqrt ok', 'inv divide', 'neg invalid']",
          "['log invalid', 'sqrt ok', 'inv divide', 'neg invalid']",
          "['log divide', 'sqrt ok', 'inv divide', 'neg ok']",
          "['log ok', 'sqrt ok', 'inv divide', 'neg invalid']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>first_bad_step(checkpoints, step, ok)</C>. <C>checkpoints</C> maps step numbers to saved states; the state
          at the smallest step is good and the state at the largest is bad, and once bad, every later state is bad.{" "}
          <C>step(state)</C> returns the state one step later. Bisect over the checkpoints to find the last good one, then
          replay from it with <C>step</C> and return the number of the first step whose state is bad.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def first_bad_step(checkpoints, step, ok):
    return max(checkpoints)
`,
        solution: `def first_bad_step(checkpoints, step, ok):
    keys = sorted(checkpoints)
    lo, hi = 0, len(keys) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if ok(checkpoints[keys[mid]]):
            lo = mid
        else:
            hi = mid
    k, state = keys[lo], checkpoints[keys[lo]]
    while ok(state):
        state, k = step(state), k + 1
    return k
`,
        tests: [
          { name: "finds the step", code: `import math
def make(first_nan, every, total):
    def state_at(k):
        return (k, float('nan') if k >= first_nan else 1.0 / (k + 1))
    return {k: state_at(k) for k in range(0, total + 1, every)}, (lambda s: state_at(s[0] + 1))
for first_nan in [1, 999, 1000, 1001, 41234, 99999, 100000]:
    cps, step = make(first_nan, 1000, 100000)
    calls = {'ok': 0, 'step': 0}
    def ok(s):
        calls['ok'] += 1
        return not math.isnan(s[1])
    def counted(s):
        calls['step'] += 1
        return step(s)
    got = first_bad_step(cps, counted, ok)
    assert got == first_nan, f'First NaN at {first_nan}, got {got}'
    assert calls['step'] <= 1000, f'{calls["step"]} replayed steps; replay only from the last good checkpoint.'
    assert calls['ok'] <= 1010, f'{calls["ok"]} checks; bisect over the checkpoints.'` },
          { name: "uneven checkpoints", code: `cps = {0: 0, 5: 5, 50: 50, 51: 51, 400: 400}
assert first_bad_step(cps, lambda s: s + 1, lambda s: s < 37) == 37
assert first_bad_step(cps, lambda s: s + 1, lambda s: s < 51) == 51
assert first_bad_step({3: 3, 4: 4}, lambda s: s + 1, lambda s: s < 4) == 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          A breakpoint written as code. Write <C>watch(name, log)</C>, a decorator factory. The decorated function appends{" "}
          <C>(name, args, result)</C> to the list <C>log</C> after every call (args is the tuple of positional arguments), and
          if the result is a float that is NaN or infinite, raises <C>FloatingPointError</C> with a message containing the name
          and the arguments, such as <C>{"'logp(0.0,) returned -inf'"}</C>. Keep the function&rsquo;s{" "}
          <C>__name__</C> with <C>functools.wraps</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import functools, math

def watch(name, log):
    def decorate(f):
        return f
    return decorate
`,
        solution: `import functools, math

def watch(name, log):
    def decorate(f):
        @functools.wraps(f)
        def wrapper(*args):
            result = f(*args)
            log.append((name, args, result))
            if isinstance(result, float) and not math.isfinite(result):
                raise FloatingPointError(f'{name}{args} returned {result}')
            return result
        return wrapper
    return decorate
`,
        tests: [
          { name: "logs calls", code: `log = []
@watch('ratio', log)
def ratio(a, b):
    return a / b if b else float('inf')
assert ratio(1.0, 2.0) == 0.5 and ratio(3, 3) == 1.0
assert log == [('ratio', (1.0, 2.0), 0.5), ('ratio', (3, 3), 1.0)], log
assert ratio.__name__ == 'ratio', 'Use functools.wraps.'
@watch('count', log)
def count(xs):
    return len(xs)
assert count([1, 2]) == 2 and log[-1] == ('count', ([1, 2],), 2)` },
          { name: "stops at the first bad value", code: `import math
log = []
@watch('ratio', log)
def ratio(a, b):
    return a / b if b else float('inf')
@watch('logp', log)
def logp(p):
    return math.log(p) if p > 0 else float('-inf')
try:
    logp(ratio(0.0, 4.0))
except FloatingPointError as e:
    assert 'logp' in str(e) and '(0.0,)' in str(e), str(e)
else:
    assert False, 'logp(0.0) returns -inf and should raise.'
assert [entry[0] for entry in log] == ['ratio', 'logp'], log
try:
    ratio(1.0, 0)
except FloatingPointError as e:
    assert 'ratio' in str(e) and '(1.0, 0)' in str(e), str(e)
else:
    assert False, 'An infinite result should raise.'
nan = watch('nan', [])(lambda: float('nan'))
try:
    nan()
except FloatingPointError:
    pass
else:
    assert False, 'A NaN result should raise.'` },
        ],
      },
    },
    {
      key: "robust",
      rung: "prove",
      prompt: (
        <p>
          For the reading exercise&rsquo;s <C>first_bad</C>, assume only that ok(0) is True and ok(n) is False, not that ok is
          monotone. Prove that it returns some hi with ok(hi − 1) True and ok(hi) False, and that it makes at most{" "}
          <M>{"\\lceil \\log_2 n \\rceil"}</M> probes.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States the invariant that ok(lo) is True and ok(hi) is False, and checks that it holds initially and is preserved by each update.",
          "Notes that the loop ends with hi = lo + 1, so the invariant gives ok(hi − 1) True and ok(hi) False.",
          "Shows that each probe at least halves hi − lo, rounding up, so after k probes the gap is at most ⌈n / 2^k⌉, and the loop stops once that reaches 1, after at most ⌈log₂ n⌉ probes.",
        ],
      },
    },
    {
      key: "minutes",
      rung: "stretch",
      prompt: (
        <p>
          A commit is good and a commit 256 commits later is bad. Each test with <C>git bisect run</C> takes 12 minutes. In the
          worst case, how many minutes does finding the first bad commit take?
        </p>
      ),
      answer: { kind: "numeric", value: 96, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend when to reach for a debugger rather than print statements, and how bisection finds the first bad training step or commit in a handful of tests.",

  glimpse: (
    <p>
      Bisection and replay only work if running the same thing twice gives the same result. Next, seeds and determinism: where
      randomness hides in a training run, and how to pin it down.
    </p>
  ),
};
