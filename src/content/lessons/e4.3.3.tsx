import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EmaSmoothViz } from "@/components/viz/EmaSmoothViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.3.3",
  minutes: 55,
  links: {
    requires: ["e4.3.2"],
    revisits: ["e1.6.3", "e0.5.1"],
    foreshadows: ["e4.3.4", "e4.6.2"],
  },

  puzzle: (
    <>
      <p>
        After a month of experiments you have 340 runs. Your advisor asks a simple question: did the learning-rate warm-up
        help? Some runs had it, some did not, some crashed, and some used a version of the code with a bug you fixed on the
        12th.
      </p>
      <p>What would you need to have recorded to answer in five minutes?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every run should leave behind a record complete enough that you never need to remember anything about it: what code
        and settings produced it, what it measured along the way, and where its outputs are. With such records, a question
        about 340 runs becomes a query. Curves are part of the record, and reading them well needs smoothing, since raw
        per-step losses are noisy.
      </p>
      <EmaSmoothViz />
      <p>
        Smoothing trades noise for lag: a large β gives a calm curve that reacts late. Without bias correction, a smoothed loss
        starts near zero and seems to rise, which has fooled many people into thinking training started well.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="a run record">
        <p>For every run, log automatically:</p>
        <ul>
          <li>the resolved configuration and the seed;</li>
          <li>the commit hash, and the diff if the working tree had uncommitted changes;</li>
          <li>versions of Python and key libraries, and the hardware;</li>
          <li>metrics against the step: training loss often, validation metrics periodically, plus learning rate and gradient norm;</li>
          <li>where checkpoints and other outputs were written, and how the run ended: finished, crashed or killed.</li>
        </ul>
        <p>
          Tools such as Weights &amp; Biases, MLflow and TensorBoard store this and draw the curves; a JSON-lines file per run,
          one object per line, appended as you go, is the simplest version, survives crashes, and is easy to load.
        </p>
      </Definition>

      <Example title="the simplest logger">
        <Code>{`import json, subprocess, time

commit = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
with open(f"runs/{run_id}.jsonl", "a") as f:
    f.write(json.dumps({"type": "config", "commit": commit, **config}) + "\\n")
    for step in range(steps):
        loss = train_step()
        if step % 100 == 0:
            f.write(json.dumps({"type": "metric", "step": step, "loss": loss, "time": time.time()}) + "\\n")
            f.flush()`}</Code>
      </Example>

      <Definition title="exponential moving average">
        <p>
          The smoothed value <M>{"m_t = \\beta m_{t-1} + (1 - \\beta) x_t"}</M>, with <M>{"m_0 = 0"}</M>, weights the
          observation from k steps ago by <M>{"(1 - \\beta)\\beta^k"}</M>, so it averages over roughly the last{" "}
          <M>{"1 / (1 - \\beta)"}</M> steps. The bias-corrected value is <M>{"\\hat m_t = m_t / (1 - \\beta^t)"}</M>.
        </p>
      </Definition>

      <Proposition title="bias correction">
        <p>The weights in <M>{"m_t"}</M> sum to <M>{"1 - \\beta^t"}</M>, so <M>{"\\hat m_t"}</M> is a weighted average of <M>{"x_1, \\dots, x_t"}</M>.</p>
      </Proposition>
      <Proof>
        <p>Unrolling the recursion,</p>
        <MD>{"m_t = (1 - \\beta) \\sum_{k=0}^{t-1} \\beta^k x_{t-k}, \\qquad (1 - \\beta) \\sum_{k=0}^{t-1} \\beta^k = 1 - \\beta^t."}</MD>
        <p>
          Dividing by <M>{"1 - \\beta^t"}</M> makes the weights non-negative and sum to 1. In particular a constant sequence
          is returned unchanged, while the uncorrected <M>{"m_t"}</M> would be <M>{"c(1 - \\beta^t)"}</M>. The same correction
          appears in the Adam optimiser.
        </p>
      </Proof>

      <Remark title="comparing runs honestly">
        <p>
          Group runs by configuration ignoring the seed, and compare means with their spread across seeds. Choose
          checkpoints and hyperparameters on the validation set; a test set used for choosing is no longer a test. Keep failed
          and crashed runs in the records: a method that diverges one time in three has a property worth knowing.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "record",
      rung: "check",
      prompt: <p>Which of these should a run record contain?</p>,
      answer: {
        kind: "choice",
        options: [
          "The commit hash and any uncommitted changes",
          "The resolved configuration",
          "Library versions and the hardware",
          "Only the final validation metric, to save space",
        ],
        correct: [0, 1, 2],
      },
    },
    {
      key: "bias",
      rung: "apply",
      prompt: (
        <p>
          An uncorrected moving average with β = 0.9 starts at <M>{"m_0 = 0"}</M> and sees the value 2.0 at every step. What
          is <M>{"m_3"}</M>? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.542, tolerance: 0.001 },
    },
    {
      key: "select",
      rung: "apply",
      prompt: <p>You pick the checkpoint with the best test accuracy out of 50 saved during training, and report that accuracy. What is wrong?</p>,
      answer: {
        kind: "choice",
        options: [
          "The reported number is biased upwards, because the test set was used to choose; choose on validation and report test once",
          "Nothing, as long as the test set is large",
          "The checkpoints should be averaged instead",
          "Test accuracy should be smoothed first",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import json
lines = ['{"step": 0, "loss": 2.3}',
         '{"step": 100, "loss": 1.7, "val": 1.9}',
         '{"step": 200, "loss": 1.2}',
         '{"step": 200, "val": 1.5}']
rows = [json.loads(l) for l in lines]
val = {r['step']: r['val'] for r in rows if 'val' in r}
print(val, max(r['step'] for r in rows if 'loss' in r))`}</Code>
          <p>Reading a JSON-lines log. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["{100: 1.9, 200: 1.5} 200", "{100: 1.9} 200", "{100: 1.9, 200: 1.5} 100", "{'100': 1.9, '200': 1.5} 200"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ema(xs, beta):
    m, out = 0.0, []
    for t, x in enumerate(xs, 1):
        m = beta * m + (1 - beta) * x
        out.append(round(m / (1 - beta ** t), 3))
    return out

print(ema([4.0, 4.0, 2.0], 0.5))`}</Code>
          <p>A bias-corrected moving average. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[4.0, 4.0, 2.857]", "[2.0, 3.0, 2.5]", "[4.0, 4.0, 3.0]", "[4.0, 4.0, 2.5]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>Write a JSON-lines run logger and its loader.</p>
          <ul>
            <li>
              <C>RunLogger(path, config)</C> creates the file and writes one line <C>{`{"type": "config", "config": config}`}</C>.
              Its method <C>log(step, **metrics)</C> appends <C>{`{"type": "metric", "step": step, ...metrics}`}</C> and
              flushes, so the file is complete even if the program crashes.
            </li>
            <li>
              <C>load_run(path)</C> returns <C>(config, history)</C>, where history maps each metric name to a list of (step,
              value) pairs in file order.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import json

class RunLogger:
    def __init__(self, path, config):
        pass

    def log(self, step, **metrics):
        pass

def load_run(path):
    return {}, {}
`,
        solution: `import json

class RunLogger:
    def __init__(self, path, config):
        self.f = open(path, 'w')
        self._write({'type': 'config', 'config': config})

    def _write(self, record):
        self.f.write(json.dumps(record) + '\\n')
        self.f.flush()

    def log(self, step, **metrics):
        self._write({'type': 'metric', 'step': step, **metrics})

def load_run(path):
    config, history = None, {}
    with open(path) as f:
        for line in f:
            r = json.loads(line)
            if r['type'] == 'config':
                config = r['config']
            else:
                for k, v in r.items():
                    if k not in ('type', 'step'):
                        history.setdefault(k, []).append((r['step'], v))
    return config, history
`,
        tests: [
          { name: "round trip", code: `cfg = {'lr': 0.1, 'model': {'depth': 4}}
log = RunLogger('test_run.jsonl', cfg)
log.log(0, loss=2.3)
log.log(100, loss=1.7, val=1.9)
log.log(200, loss=1.2)
config, history = load_run('test_run.jsonl')
assert config == cfg, config
assert history == {'loss': [(0, 2.3), (100, 1.7), (200, 1.2)], 'val': [(100, 1.9)]}, history` },
          { name: "survives a crash", code: `import json
log = RunLogger('crash_run.jsonl', {'seed': 1})
log.log(5, loss=0.5)
with open('crash_run.jsonl') as f:
    lines = f.read().splitlines()
assert len(lines) == 2, 'Flush after every write, so a crash loses nothing already logged.'
assert json.loads(lines[0]) == {'type': 'config', 'config': {'seed': 1}}
assert json.loads(lines[1]) == {'type': 'metric', 'step': 5, 'loss': 0.5}
assert load_run('crash_run.jsonl') == ({'seed': 1}, {'loss': [(5, 0.5)]})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>compare_runs(runs, metric, ignore=(&apos;seed&apos;,))</C>. Each run is a pair (config, results) of flat
          dicts. Group runs whose configs agree on every key not in ignore, and return a list of tuples (group_config, mean,
          std, n) for metric, where group_config is the config without the ignored keys, std is the sample standard deviation
          (0.0 when n = 1), and the list is sorted by mean, smallest first. Skip runs whose results lack the metric.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import statistics

def compare_runs(runs, metric, ignore=('seed',)):
    return []
`,
        solution: `import statistics

def compare_runs(runs, metric, ignore=('seed',)):
    groups = {}
    for config, results in runs:
        if metric not in results:
            continue
        key = tuple(sorted((k, v) for k, v in config.items() if k not in ignore))
        groups.setdefault(key, []).append(results[metric])
    out = []
    for key, vals in groups.items():
        std = statistics.stdev(vals) if len(vals) > 1 else 0.0
        out.append((dict(key), statistics.mean(vals), std, len(vals)))
    return sorted(out, key=lambda r: r[1])
`,
        tests: [
          { name: "groups", code: `runs = [
    ({'warmup': True, 'lr': 0.1, 'seed': 0}, {'val': 1.50}),
    ({'warmup': True, 'lr': 0.1, 'seed': 1}, {'val': 1.54}),
    ({'warmup': False, 'lr': 0.1, 'seed': 0}, {'val': 1.60}),
    ({'warmup': False, 'lr': 0.1, 'seed': 1}, {'val': 1.48}),
    ({'warmup': False, 'lr': 0.1, 'seed': 2}, {'val': 1.66}),
    ({'warmup': True, 'lr': 0.3, 'seed': 0}, {'crashed': True}),
    ({'lr': 0.3, 'warmup': True, 'seed': 1}, {'val': 1.70}),
]
got = compare_runs(runs, 'val')
assert [g[0] for g in got] == [{'warmup': True, 'lr': 0.1}, {'warmup': False, 'lr': 0.1}, {'warmup': True, 'lr': 0.3}], got
assert [g[3] for g in got] == [2, 3, 1]
assert abs(got[0][1] - 1.52) < 1e-9 and abs(got[1][1] - 1.58) < 1e-9 and got[2][2] == 0.0
assert abs(got[1][2] - 0.0916515) < 1e-6, got[1][2]` },
          { name: "ignore", code: `runs = [({'a': 1, 'seed': 0, 'host': 'x'}, {'m': 3.0}), ({'a': 1, 'seed': 1, 'host': 'y'}, {'m': 5.0})]
assert compare_runs(runs, 'm', ignore=('seed', 'host')) == [({'a': 1}, 4.0, statistics.stdev([3.0, 5.0]), 2)]
assert len(compare_runs(runs, 'm')) == 2, 'With only seed ignored, different hosts are different groups.'
assert compare_runs(runs, 'missing') == []` },
        ],
      },
    },
    {
      key: "weights",
      rung: "prove",
      prompt: (
        <p>
          For <M>{"m_t = \\beta m_{t-1} + (1 - \\beta) x_t"}</M> with <M>{"m_0 = 0"}</M>, prove that{" "}
          <M>{"m_t = (1 - \\beta)\\sum_{k=0}^{t-1}\\beta^k x_{t-k}"}</M> and that these weights sum to{" "}
          <M>{"1 - \\beta^t"}</M>. Explain why this makes the uncorrected average too small early in training.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves the unrolled formula, by induction on t or by repeated substitution.",
          "Sums the geometric series to get 1 − β^t.",
          "Concludes that for small t the weights sum to much less than 1, so a constant or positive sequence is pulled towards the initial value 0.",
        ],
      },
    },
    {
      key: "window",
      rung: "stretch",
      prompt: (
        <p>
          With β = 0.99, what fraction of the weight in <M>{"m_t"}</M>, for large t, lies on observations at least 100 steps
          old? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.366, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what an experiment record should contain so that a question about hundreds of old runs can be answered without remembering anything, and why a smoothed loss curve can mislead at the start.",

  glimpse: (
    <p>
      Tracking records what happened; it does not record why you ran it or what you concluded. Next, the lab notebook: writing
      down hypotheses, decisions and results as you go, so that your future self can follow your reasoning.
    </p>
  ),
};
