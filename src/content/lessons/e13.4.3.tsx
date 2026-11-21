import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SdcDetectViz } from "@/components/viz/SdcDetectViz";
import type { LessonContent } from "@/lib/types";

const LOCATE = `def bad_devices(results, expected, tol):
    return [d for d, r in enumerate(results) if abs(r - expected) > tol * max(1.0, abs(expected))]

def first_mismatch(step_sums):
    for step, sums in enumerate(step_sums):
        common = max(set(sums), key=sums.count)
        odd = [r for r, s in enumerate(sums) if s != common]
        if odd:
            return step, odd                               # first step where replicas disagree
    return None

def most_suspect(odd_lists):
    counts = {}
    for odd in odd_lists:
        for r in odd:
            counts[r] = counts.get(r, 0) + 1
    return max(sorted(counts), key=lambda r: counts[r]) if counts else None`;

const SAMPLE = `import math

def p_detect(rate, frac, steps):
    return 1 - math.exp(-rate * frac * steps)              # some corrupted step is among those recomputed

def steps_to_detect(rate, frac):
    return 1 / (rate * frac)                               # mean steps until the first caught event

def frac_for(rate, steps, target):
    return -math.log(1 - target) / (rate * steps)          # sampling fraction that reaches the target`;

export const lesson: LessonContent = {
  id: "e13.4.3",
  minutes: 40,
  links: {
    requires: ["e13.4.2"],
    revisits: ["e13.3.3", "e13.4.1"],
    foreshadows: ["e13.6.1"],
  },

  puzzle: (
    <>
      <p>
        A run&apos;s loss drifts slightly above its proxy prediction for two days, then spikes. Rolling back and
        replaying the same batches on the same nodes reproduces the spike; replaying on a different set of nodes does
        not. No node reported an error, and every hardware health check passed. Where did the wrong numbers come from,
        and how could the run have caught them sooner?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A small fraction of processors compute some operations wrongly, rarely and without raising any error: a bit
        flips in an arithmetic unit at a particular temperature or voltage, and the result is simply a different number.
        In a single job such faults are rare, but a large run uses so many chips for so long that it should expect them.
        Since nothing reports them, they must be detected by redundancy: computing something twice and comparing, or
        computing something whose answer is already known.
      </p>
      <SdcDetectViz />
    </>
  ),

  theory: (
    <>
      <Definition title="silent data corruption">
        <p>
          Silent data corruption (SDC) is a wrong result returned with no error signal. Three tools locate it. A
          known-answer test runs a fixed computation, such as a large matrix multiplication with a stored result, on every
          device and flags those that differ (<C>bad_devices</C>). Replica comparison checks that data-parallel replicas,
          which should hold identical parameters, agree step by step and reports the first disagreement{" "}
          (<C>first_mismatch</C>). Across incidents, the device implicated most often is the first to replace{" "}
          (<C>most_suspect</C>).
        </p>
        <Code>{LOCATE}</Code>
      </Definition>

      <Theorem title="what replica comparison can see">
        <p>
          In data-parallel training, where every replica applies the same averaged gradient with the same optimiser, a
          fault is caught by comparing replica parameters if and only if it makes some replica&apos;s parameters
          differ from another&apos;s. A fault in one rank&apos;s forward or backward pass, before the gradient
          all-reduce, is never caught this way.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first claim is the definition of the check. For the second, a wrong local gradient enters the all-reduce,
          which returns the same average, wrong in the same way, to every rank. Each replica then applies the identical
          update to identical parameters, so all replicas stay identical and wrong. A fault in a rank&apos;s optimiser
          step or parameter memory, by contrast, changes that rank alone. Catching gradient-side faults needs a different
          redundancy: recomputing a step&apos;s local gradient on other hardware and comparing.
        </p>
      </Proof>

      <Example title="published rates">
        <p>
          Studies of large server fleets by Google and Meta in 2021 found processors that silently miscompute at rates on
          the order of one per thousand machines, often only for particular instructions, data or temperatures. The
          Gemini report noted that at its training scale it expected SDC to affect training every week or two, and
          described deterministic replay to isolate incorrect computations together with proactive scanners run on idle
          machines and hot standbys. Accelerators are no exception: their arithmetic units and memory see the same
          manufacturing defects and ageing.
        </p>
      </Example>

      <Remark title="sampling redundant work">
        <p>
          Recomputing every step on other hardware would double the cost, so runs recompute a random fraction f of steps.
          If corrupted steps occur at rate r per step, the caught ones form a Poisson process of rate rf, which fixes the
          probability of catching one in a window, the mean time to the first catch, and the fraction needed for a target
          probability (<C>p_detect</C>, <C>steps_to_detect</C>, <C>frac_for</C>). With sharded optimisers, replicas hold
          shards rather than whole copies, so the comparison runs between ranks that hold the same shard. A suspected
          device is confirmed by deterministic replay on and off it, as in e13.3.3, before it is drained.
        </p>
        <Code>{SAMPLE}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fleet",
      rung: "check",
      prompt: (
        <p>
          One node in 1000 has a processor that silently miscomputes, independently of the others. A job runs on 2000
          nodes. What is the probability that it includes at least one such node, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8648, tolerance: 0.001 },
    },
    {
      key: "sample",
      rung: "check",
      prompt: (
        <p>
          Silent corruption hits one step in 50,000 on average, and a random 2% of steps are recomputed on other
          hardware. What is the probability of catching at least one corrupted step within 100,000 steps, to four
          decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0392, tolerance: 0.002 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: (
        <p>
          Replica checksums have agreed on every step, yet a replay on different nodes gives a different loss. Which
          fault fits?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "A miscomputed local gradient before the all-reduce, which every replica received equally",
          "A bit flip in one rank's stored parameters",
          "A bug in the optimiser on one rank only",
          "A corrupted checkpoint on one rank",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bad_devices(results, expected, tol):
    return [d for d, r in enumerate(results) if abs(r - expected) > tol * max(1.0, abs(expected))]

def first_mismatch(step_sums):
    for step, sums in enumerate(step_sums):
        common = max(set(sums), key=sums.count)
        odd = [r for r, s in enumerate(sums) if s != common]
        if odd:
            return step, odd                               # first step where replicas disagree
    return None

def most_suspect(odd_lists):
    counts = {}
    for odd in odd_lists:
        for r in odd:
            counts[r] = counts.get(r, 0) + 1
    return max(sorted(counts), key=lambda r: counts[r]) if counts else None

print(bad_devices([12.0, 12.5, 12.0, 11.99], 12.0, 0.01), first_mismatch([[3, 3, 3], [4, 4, 5], [6, 7, 7]]))
print(most_suspect([[2], [1, 2], [1], [2]]), most_suspect([]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1] (1, [2])\n2 None",
          "[1, 3] (1, [2])\n2 None",
          "[1] (2, [0])\n2 None",
          "[1] (1, [2])\n1 None",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def p_detect(rate, frac, steps):
    return 1 - math.exp(-rate * frac * steps)              # some corrupted step is among those recomputed

def steps_to_detect(rate, frac):
    return 1 / (rate * frac)                               # mean steps until the first caught event

def frac_for(rate, steps, target):
    return -math.log(1 - target) / (rate * steps)          # sampling fraction that reaches the target

print(round(p_detect(0.001, 0.5, 2000), 4), steps_to_detect(0.001, 0.5))
print(round(frac_for(0.001, 1000, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6321 2000.0\n0.6931", "1.0 2000.0\n0.5", "0.6321 1000.0\n0.6931", "0.3935 2000.0\n0.6931"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bad_devices(results, expected, tol)</C>, the devices whose result differs from expected by more than
          tol times the larger of 1 and |expected|; <C>first_mismatch(step_sums)</C>, the first step and the ranks that
          differ from that step&apos;s most common checksum, or None; and <C>most_suspect(odd_lists)</C>, the rank
          appearing most often, the smallest on ties, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bad_devices(results, expected, tol):
    return []

def first_mismatch(step_sums):
    return None

def most_suspect(odd_lists):
    return None
`,
        solution: LOCATE,
        tests: [
          { name: "devices", code: `assert bad_devices([1.0, 1.2, 0.95], 1.0, 0.1) == [1] and bad_devices([200.0, 230.0], 210.0, 0.1) == []` },
          { name: "mismatch", code: `assert first_mismatch([[1, 1], [2, 2]]) is None and first_mismatch([[5, 5, 5, 6]]) == (0, [3]) and most_suspect([[0, 3], [3], [0]]) == 0 and most_suspect([[4], [4, 1]]) == 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>p_detect(rate, frac, steps)</C>, <C>steps_to_detect(rate, frac)</C> and{" "}
          <C>frac_for(rate, steps, target)</C> for random sampling of recomputed steps, as in the Poisson model above.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def p_detect(rate, frac, steps):
    return rate * frac * steps

def steps_to_detect(rate, frac):
    return 1 / rate

def frac_for(rate, steps, target):
    return target / (rate * steps)
`,
        solution: SAMPLE,
        tests: [
          { name: "detect", code: `assert round(p_detect(0.01, 0.3, 1000), 4) == 0.9502 and p_detect(1, 0, 5) == 0.0` },
          { name: "steps", code: `assert steps_to_detect(0.004, 0.25) == 1000.0 and round(frac_for(0.01, 1000, 0.75), 4) == 0.1386` },
        ],
      },
    },
    {
      key: "kat",
      rung: "stretch",
      prompt: (
        <p>
          A known-answer test runs on every one of 16,384 GPUs every 6 hours. Each GPU develops a silent defect at a rate
          of one per million GPU-hours, at a uniformly random time between tests, and corrupts training from then until
          its next test. How many hours of training are corrupted in a 30-day month, in expectation?
        </p>
      ),
      answer: { kind: "numeric", value: 35.39, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        A run that survives its hardware still has to show that it is learning the right things. The next chapter builds
        the evaluation machinery that runs beside training.
      </p>
    </>
  ),
};
