import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ResumeGapViz } from "@/components/viz/ResumeGapViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import os, random, numpy as np, torch

def save_checkpoint(path, model, opt, sched, scaler, step, loader_state):
    state = {
        "model": model.state_dict(),
        "optimizer": opt.state_dict(),        # momentum and Adam moments, per parameter
        "scheduler": sched.state_dict(),      # where the learning-rate schedule is
        "scaler": scaler.state_dict(),        # mixed-precision loss scale
        "step": step,
        "data": loader_state,                 # epoch and position, or a stateful loader's state
        "rng": {
            "python": random.getstate(),
            "numpy": np.random.get_state(),
            "torch": torch.get_rng_state(),
            "cuda": torch.cuda.get_rng_state_all(),
        },
    }
    tmp = path + ".tmp"
    torch.save(state, tmp)
    os.replace(tmp, path)                     # atomic on POSIX: old or new, never half

# resume: load each piece back with load_state_dict / set_rng_state, then continue from state["step"]`;

const RESUME = `import copy
import numpy as np

X = np.random.default_rng(42).normal(size=(12, 3))
Y = X @ np.array([1.0, -2.0, 0.5])

def init_state(seed=0):
    return {'w': np.zeros(3), 'm': np.zeros(3), 'step': 0, 'seed': seed, 'rng': np.random.default_rng(seed)}

def train_step(s, batch=4, lr=0.05, beta=0.9):
    epoch, k = divmod(s['step'], len(X) // batch)
    idx = np.random.default_rng(s['seed'] + epoch).permutation(len(X))[k * batch:(k + 1) * batch]
    xb = X[idx] * (s['rng'].random(3) > 0.2) / 0.8
    s['m'] = beta * s['m'] + xb.T @ (xb @ s['w'] - Y[idx]) / batch
    s['w'] = s['w'] - lr * s['m']
    s['step'] += 1

def save(s):
    c = {k: (v.copy() if isinstance(v, np.ndarray) else v) for k, v in s.items() if k != 'rng'}
    c['rng'] = copy.deepcopy(s['rng'].bit_generator.state)
    return c

def restore(c):
    s = {k: (v.copy() if isinstance(v, np.ndarray) else v) for k, v in c.items() if k != 'rng'}
    s['rng'] = np.random.default_rng()
    s['rng'].bit_generator.state = copy.deepcopy(c['rng'])
    return s

def resume_gap(seed, total, stop, drop=()):
    a, b = init_state(seed), init_state(seed)
    for _ in range(total):
        train_step(a)
    for _ in range(stop):
        train_step(b)
    c, fresh = save(b), save(init_state(seed))
    c.update({k: fresh[k] for k in drop})
    b = restore(c)
    for _ in range(total - stop):
        train_step(b)
    return float(np.max(np.abs(a['w'] - b['w'])))`;

const FILES = `import zlib

def encode(payload):
    return zlib.crc32(payload).to_bytes(4, 'big') + payload

def valid(blob):
    return len(blob) >= 4 and zlib.crc32(blob[4:]) == int.from_bytes(blob[:4], 'big')

def save_ckpt(fs, step, payload, keep=2, crash=False):
    tmp = f'ckpt_{step:08d}.tmp'
    blob = encode(payload)
    fs[tmp] = blob[:len(blob) // 2] if crash else blob
    if crash:
        return
    fs[tmp[:-4] + '.pt'] = fs.pop(tmp)
    for old in sorted(k for k in fs if k.endswith('.pt'))[:-keep]:
        del fs[old]

def latest(fs):
    for name in sorted((k for k in fs if k.endswith('.pt')), reverse=True):
        if valid(fs[name]):
            return int(name[5:13]), fs[name][4:]
    return None`;

export const lesson: LessonContent = {
  id: "e6.3.3",
  minutes: 50,
  links: {
    requires: ["e6.3.2"],
    revisits: ["e5.3.2"],
    foreshadows: ["e6.6.3", "e6.4.1"],
  },

  puzzle: (
    <>
      <p>
        A two-week run is preempted on day six and restarted from its last checkpoint. The loss curve shows a spike at the
        restart, the learning rate jumps back to its warm-up value, and the next epoch replays samples the model saw an hour
        earlier. Worse, the newest checkpoint file turns out to be half written, because the job was killed while saving it.
        What exactly is the state of a training run, and how do you save it so that stopping and resuming is invisible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A training run is a deterministic function of its state at each step: the weights, the optimiser&apos;s buffers,
        the schedule&apos;s position, the step counter, the position in the data and the state of every random generator.
        Save all of them and a resumed run computes exactly the same numbers as one that never stopped; leave one out and
        the run silently becomes a different run. The file holding that state must itself be written so that a crash at
        any moment leaves either the old checkpoint or the new one, never something in between.
      </p>
      <ResumeGapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the full training state">
        <p>
          Model parameters and buffers; optimiser state (momentum, Adam&apos;s first and second moments and its step count);
          learning-rate scheduler and loss-scaler state; the global step; the data position (epoch, and how far into it);
          and the states of Python&apos;s, NumPy&apos;s, PyTorch&apos;s CPU and every GPU&apos;s random generators. Each
          library exposes these as a <C>state_dict</C> or a get/set pair.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="exact resumption">
        <p>
          If one training step is a deterministic function <C>S → step(S)</C> of a state S that includes every quantity read
          or written by the step, then restoring a saved copy of S after k steps and running n − k more gives the same final
          state as running n steps without stopping.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let Sₖ be the state after k steps. The saved copy equals Sₖ, so after restoring, the next step computes step(Sₖ) =
          Sₖ₊₁, and by induction every later state is the same, ending at Sₙ. Each omission breaks the hypothesis: resetting
          the momentum changes the update; a fresh generator draws the masks of steps 1, 2, … again; a reset step counter
          replays the first epoch&apos;s order and the warm-up schedule. Deriving the data order from (seed, epoch), as here,
          makes the step counter enough to recover it. GPU kernels that are not bitwise deterministic, such as some atomic
          reductions, also break it, which <C>torch.use_deterministic_algorithms</C> addresses.
        </p>
        <Code>{RESUME}</Code>
      </Proof>

      <Example title="writing the file safely">
        <p>
          Write the checkpoint to a temporary name and rename it to the final name only when complete, since a rename
          within one file system is atomic. Store a checksum, keep the last few checkpoints, and on start-up take the newest
          one whose checksum matches. Then a crash during writing, or a corrupted file, costs one checkpoint interval rather
          than the run.
        </p>
        <Code>{FILES}</Code>
      </Example>

      <Remark title="at scale">
        <p>
          Sharded models save one file per rank, or use <C>torch.distributed.checkpoint</C>, which writes shards in parallel
          and can reload them into a different number of GPUs. Saving asynchronously, by copying state to CPU memory and
          writing in a background thread, keeps the GPUs training while the file is written. How often to save trades the
          cost of saving against the work lost at a failure.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>How many gigabytes (10⁹ bytes) does a checkpoint of a 10⁹-parameter model take with float32 weights and Adam&apos;s two float32 moments?</p>,
      answer: { kind: "numeric", value: 12, tolerance: 0.01 },
    },
    {
      key: "lost",
      rung: "check",
      prompt: <p>A job checkpoints every 30 minutes and is preempted at a uniformly random moment. How many minutes of work does it lose on average?</p>,
      answer: { kind: "numeric", value: 15, tolerance: 0.01 },
    },
    {
      key: "atomic",
      rung: "apply",
      prompt: <p>A script saves directly to <C>latest.pt</C>, overwriting it. What can a preemption during the save do?</p>,
      answer: {
        kind: "choice",
        options: [
          "Leave latest.pt truncated, so the only checkpoint is unreadable and the run must start over; writing to a temporary file and renaming avoids this",
          "Nothing, because torch.save writes atomically",
          "Leave the previous checkpoint intact, because the operating system buffers the write",
          "Corrupt the optimiser state but not the weights",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import copy
import numpy as np

X = np.random.default_rng(42).normal(size=(12, 3))
Y = X @ np.array([1.0, -2.0, 0.5])

def init_state(seed=0):
    return {'w': np.zeros(3), 'm': np.zeros(3), 'step': 0, 'seed': seed, 'rng': np.random.default_rng(seed)}

def train_step(s, batch=4, lr=0.05, beta=0.9):
    epoch, k = divmod(s['step'], len(X) // batch)
    idx = np.random.default_rng(s['seed'] + epoch).permutation(len(X))[k * batch:(k + 1) * batch]
    xb = X[idx] * (s['rng'].random(3) > 0.2) / 0.8
    s['m'] = beta * s['m'] + xb.T @ (xb @ s['w'] - Y[idx]) / batch
    s['w'] = s['w'] - lr * s['m']
    s['step'] += 1

def save(s):
    c = {k: (v.copy() if isinstance(v, np.ndarray) else v) for k, v in s.items() if k != 'rng'}
    c['rng'] = copy.deepcopy(s['rng'].bit_generator.state)
    return c

def restore(c):
    s = {k: (v.copy() if isinstance(v, np.ndarray) else v) for k, v in c.items() if k != 'rng'}
    s['rng'] = np.random.default_rng()
    s['rng'].bit_generator.state = copy.deepcopy(c['rng'])
    return s

def resume_gap(seed, total, stop, drop=()):
    a, b = init_state(seed), init_state(seed)
    for _ in range(total):
        train_step(a)
    for _ in range(stop):
        train_step(b)
    c, fresh = save(b), save(init_state(seed))
    c.update({k: fresh[k] for k in drop})
    b = restore(c)
    for _ in range(total - stop):
        train_step(b)
    return float(np.max(np.abs(a['w'] - b['w'])))

s = init_state(1); train_step(s); c = save(s); u = s['rng'].random(); t = restore(c)
print(c['step'], t['rng'].random() == u, t['w'] is s['w'], np.array_equal(t['w'], s['w']))
print([resume_gap(0, 40, 17, d) == 0.0 for d in [(), ('m',), ('rng',), ('step',)]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 True False True\n[True, False, False, False]",
          "1 False False True\n[True, False, False, False]",
          "1 True True True\n[True, False, False, False]",
          "1 True False True\n[True, True, False, False]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import zlib

def encode(payload):
    return zlib.crc32(payload).to_bytes(4, 'big') + payload

def valid(blob):
    return len(blob) >= 4 and zlib.crc32(blob[4:]) == int.from_bytes(blob[:4], 'big')

def save_ckpt(fs, step, payload, keep=2, crash=False):
    tmp = f'ckpt_{step:08d}.tmp'
    blob = encode(payload)
    fs[tmp] = blob[:len(blob) // 2] if crash else blob
    if crash:
        return
    fs[tmp[:-4] + '.pt'] = fs.pop(tmp)
    for old in sorted(k for k in fs if k.endswith('.pt'))[:-keep]:
        del fs[old]

def latest(fs):
    for name in sorted((k for k in fs if k.endswith('.pt')), reverse=True):
        if valid(fs[name]):
            return int(name[5:13]), fs[name][4:]
    return None

fs = {}; save_ckpt(fs, 100, b'a'); save_ckpt(fs, 200, b'b'); save_ckpt(fs, 300, b'c'); save_ckpt(fs, 400, b'd', crash=True)
print(sorted(fs), latest(fs))
fs['ckpt_00000300.pt'] = fs['ckpt_00000300.pt'][:-1] + b'x'; print(latest(fs), valid(encode(b'')), latest({}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['ckpt_00000200.pt', 'ckpt_00000300.pt', 'ckpt_00000400.tmp'] (300, b'c')\n(200, b'b') True None",
          "['ckpt_00000300.pt', 'ckpt_00000400.tmp'] (300, b'c')\n(200, b'b') True None",
          "['ckpt_00000200.pt', 'ckpt_00000300.pt', 'ckpt_00000400.tmp'] (400, b'd')\n(300, b'c') True None",
          "['ckpt_00000200.pt', 'ckpt_00000300.pt', 'ckpt_00000400.tmp'] (300, b'c')\nNone True None",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given data, <C>init_state</C> and <C>train_step</C>, write <C>save(s)</C>, which copies the arrays and
          stores the generator&apos;s <C>bit_generator.state</C>, <C>restore(c)</C>, which rebuilds an independent state, and{" "}
          <C>resume_gap(seed, total, stop, drop=())</C>, which compares an uninterrupted run with one stopped at{" "}
          <C>stop</C> and resumed from a checkpoint whose keys in <C>drop</C> were replaced by a fresh state&apos;s values,
          returning the largest absolute weight difference as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import copy
import numpy as np

X = np.random.default_rng(42).normal(size=(12, 3))
Y = X @ np.array([1.0, -2.0, 0.5])

def init_state(seed=0):
    return {'w': np.zeros(3), 'm': np.zeros(3), 'step': 0, 'seed': seed, 'rng': np.random.default_rng(seed)}

def train_step(s, batch=4, lr=0.05, beta=0.9):
    epoch, k = divmod(s['step'], len(X) // batch)
    idx = np.random.default_rng(s['seed'] + epoch).permutation(len(X))[k * batch:(k + 1) * batch]
    xb = X[idx] * (s['rng'].random(3) > 0.2) / 0.8
    s['m'] = beta * s['m'] + xb.T @ (xb @ s['w'] - Y[idx]) / batch
    s['w'] = s['w'] - lr * s['m']
    s['step'] += 1

def save(s):
    return s

def restore(c):
    return c

def resume_gap(seed, total, stop, drop=()):
    return 1.0
`,
        solution: RESUME,
        tests: [
          { name: "roundtrip", code: `s = init_state(5)
for _ in range(4):
    train_step(s)
c = save(s); u = [s['rng'].random() for _ in range(3)]; train_step(s)
t = restore(c); t2 = restore(c); assert [t['rng'].random() for _ in range(3)] == u and t['step'] == 4 and not np.array_equal(t['w'], s['w'])
t2['m'][0] = 99.0; assert c['m'][0] != 99.0 and restore(c)['m'][0] != 99.0` },
          { name: "gap", code: `assert resume_gap(3, 30, 11) == 0.0 and resume_gap(3, 30, 11, ('m',)) > 1e-3 and resume_gap(3, 30, 11, ('rng',)) > 1e-3 and resume_gap(3, 30, 11, ('step',)) > 1e-3
assert isinstance(resume_gap(3, 10, 0), float) and resume_gap(3, 10, 0, ('m', 'rng', 'step')) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the given <C>encode</C>, write <C>valid(blob)</C>, <C>save_ckpt(fs, step, payload, keep=2, crash=False)</C>,
          which writes <C>ckpt_</C> plus the step in eight digits plus <C>.tmp</C> into the dict fs (only half the bytes if
          crash), renames it to <C>.pt</C> and deletes all but the newest keep checkpoints, and <C>latest(fs)</C>, returning
          (step, payload) for the newest valid checkpoint, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import zlib

def encode(payload):
    return zlib.crc32(payload).to_bytes(4, 'big') + payload

def valid(blob):
    return True

def save_ckpt(fs, step, payload, keep=2, crash=False):
    fs[f'ckpt_{step:08d}.pt'] = encode(payload)

def latest(fs):
    return None
`,
        solution: FILES,
        tests: [
          { name: "save", code: `fs = {}
for s in [5, 10, 15, 20]:
    save_ckpt(fs, s, str(s).encode(), keep=3)
save_ckpt(fs, 25, b'25', keep=3, crash=True)
assert sorted(fs) == ['ckpt_00000010.pt', 'ckpt_00000015.pt', 'ckpt_00000020.pt', 'ckpt_00000025.tmp'] and len(fs['ckpt_00000025.tmp']) == 3
assert valid(encode(b'xyz')) and not valid(encode(b'xyz')[:-1]) and not valid(b'ab')` },
          { name: "latest", code: `fs = {}
save_ckpt(fs, 1, b'one'); save_ckpt(fs, 2, b'two'); assert latest(fs) == (2, b'two')
fs['ckpt_00000002.pt'] = b'\\x00' + fs['ckpt_00000002.pt'][1:]; assert latest(fs) == (1, b'one') and latest({'ckpt_00000009.tmp': encode(b'x')}) is None` },
        ],
      },
    },
    {
      key: "young",
      rung: "stretch",
      prompt: (
        <p>
          Young&apos;s approximation puts the best interval between checkpoints at √(2 · C · M), where C is the time to save
          and M the mean time between failures. With C = 2 minutes and M = 24 hours, what interval is that, in minutes?
        </p>
      ),
      answer: { kind: "numeric", value: 75.89, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        Half of a checkpoint&apos;s bytes are optimiser state kept in float32, and most of a step&apos;s arithmetic could run
        in sixteen bits. The next lesson looks at mixed precision: what to keep in which format, and why a loss scale is
        needed.
      </p>
    </>
  ),
};
