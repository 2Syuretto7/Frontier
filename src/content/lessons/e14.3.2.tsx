import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AutotuneSearchViz } from "@/components/viz/AutotuneSearchViz";
import type { LessonContent } from "@/lib/types";

const SEARCH = `from itertools import product

def grid(space):
    keys = sorted(space)
    return [dict(zip(keys, vals)) for vals in product(*(space[k] for k in keys))]

def measure(run, cfg, reps):
    times = sorted(run(cfg) for _ in range(reps))
    return times[reps // 2]                                # the median resists slow outliers

def tune(space, run, reps):
    best, best_t = None, None
    for cfg in grid(space):
        t = measure(run, cfg, reps)
        if best_t is None or t < best_t:
            best, best_t = cfg, t
    return best, best_t`;

const GUIDED = `def rank_by_model(cands, model):
    return sorted(cands, key=model)                        # stable: ties keep their order

def top_k(cands, model, run, k):
    tried = rank_by_model(cands, model)[:k]
    return min(tried, key=run), len(tried)                 # measure only the most promising

def pair_accuracy(pred, actual):
    pairs = [(i, j) for i in range(len(pred)) for j in range(i + 1, len(pred)) if actual[i] != actual[j]]
    good = sum((pred[i] < pred[j]) == (actual[i] < actual[j]) for i, j in pairs)
    return good / len(pairs) if pairs else 1.0`;

export const lesson: LessonContent = {
  id: "e14.3.2",
  minutes: 40,
  links: {
    requires: ["e14.3.1"],
    revisits: ["e9.3.3", "e9.2.4", "e7.1.3"],
    foreshadows: ["e14.4.2"],
  },

  puzzle: (
    <>
      <p>
        A matrix-multiplication kernel has a handful of knobs: block sizes in three dimensions, the number of warps,
        the number of pipeline stages. Together they give hundreds of configurations, and the fastest for one shape is
        often mediocre for another. The traffic model of the last lesson ranks them only roughly. Measuring every one
        takes minutes per shape, and the measurements themselves are noisy. How should a compiler choose?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Let the hardware decide, but spend measurements wisely. Generate candidate configurations, run each a few times,
        and keep the fastest by its median time. When the space is too large to measure, rank it first with a cheap cost
        model, which need not predict times accurately as long as it orders configurations roughly correctly, and
        measure only the most promising. Cache the winner for each shape and device, so the search is paid once.
      </p>
      <AutotuneSearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="autotuning">
        <p>
          A search space assigns each knob a list of values, and its configurations are all combinations (<C>grid</C>).
          Each configuration is compiled and timed several times, keeping the median, which ignores occasional slow
          runs caused by other activity (<C>measure</C>). Exhaustive tuning returns the configuration with the smallest
          median (<C>tune</C>).
        </p>
        <Code>{SEARCH}</Code>
      </Definition>

      <Theorem title="noise and the wrong winner">
        <p>
          Suppose two configurations have true times differing by δ, and each measurement adds independent noise with
          standard deviation σ. Comparing the means of n measurements of each picks the slower configuration with
          probability <M>{"\\Phi\\left(-\\delta\\sqrt{n} / (\\sigma\\sqrt{2})\\right)"}</M> when the noise is normal.
        </p>
      </Theorem>
      <Proof>
        <p>
          The difference between the two means is normal with mean δ, favouring the faster configuration, and variance{" "}
          <M>{"2\\sigma^2/n"}</M>, the sum of the two variances of means. The comparison goes wrong when the difference
          falls below zero, which happens with probability{" "}
          <M>{"\\Phi(-\\delta / \\sqrt{2\\sigma^2/n})"}</M>. Configurations within a few per cent of each other are
          therefore hard to separate, which matters little, since choosing either loses only those few per cent; the
          danger is noise with heavy tails, which the median handles better than the mean.
        </p>
      </Proof>

      <Example title="tuners in use">
        <p>
          Triton&apos;s autotune decorator (e9.3.3) measures a list of configurations the first time a kernel runs on
          a new shape and caches the winner. TorchInductor&apos;s max-autotune mode benchmarks Triton templates against
          library kernels when compiling. TVM&apos;s AutoTVM and Ansor generate schedules automatically, train a
          gradient-boosted tree on the measurements to predict the times of unmeasured schedules, and use evolutionary
          search guided by that model. XLA has used a learned performance model for TPU kernels in a similar role.
        </p>
      </Example>

      <Remark title="cost models and measurement">
        <p>
          A cost model is used to rank, so its quality is how often it orders a pair of configurations correctly{" "}
          (<C>pair_accuracy</C>), not its error in microseconds. Ranking candidates by the model and measuring only the
          top few (<C>rank_by_model</C>, <C>top_k</C>) gets most of the benefit for a fraction of the measurements.
          Measurements must follow the hygiene of e9.2.4: warm up, flush caches where the real workload would not find
          data in them, and synchronise before reading the clock, or the tuner will optimise for an artefact.
        </p>
        <Code>{GUIDED}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "budget",
      rung: "check",
      prompt: (
        <p>
          A space has block_m and block_n each in {"{"}32, 64, 128, 256{"}"}, block_k in {"{"}32, 64, 128{"}"},
          num_warps in {"{"}2, 4, 8{"}"} and num_stages in {"{"}2, 3, 4, 5{"}"}. Compiling and timing each
          configuration takes 0.8 seconds. How many seconds does exhaustive tuning take for one shape?
        </p>
      ),
      answer: { kind: "numeric", value: 460.8, tolerance: 0.001 },
    },
    {
      key: "wrong",
      rung: "check",
      prompt: (
        <p>
          Two configurations take 1.00 and 1.02 ms, and each single measurement has independent normal noise with
          standard deviation 0.03 ms. Measuring each once, what is the probability of picking the slower one, to four
          decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.3187, tolerance: 0.002 },
    },
    {
      key: "model",
      rung: "apply",
      prompt: (
        <p>
          A cost model predicts every configuration&apos;s time 30% too high, but orders all pairs correctly. How useful
          is it for guiding a search?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Fully useful: only the order matters when choosing what to measure",
          "Useless, because its predictions are wrong",
          "Useful only after its predictions are rescaled",
          "Harmful, because it will pick slow configurations",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def grid(space):
    keys = sorted(space)
    return [dict(zip(keys, vals)) for vals in product(*(space[k] for k in keys))]

def measure(run, cfg, reps):
    times = sorted(run(cfg) for _ in range(reps))
    return times[reps // 2]                                # the median resists slow outliers

def tune(space, run, reps):
    best, best_t = None, None
    for cfg in grid(space):
        t = measure(run, cfg, reps)
        if best_t is None or t < best_t:
            best, best_t = cfg, t
    return best, best_t

seq = iter([5, 1, 9, 4, 4, 2]); print(grid({"b": [1, 2], "a": [3]}), measure(lambda c: next(seq), {}, 3))
print(tune({"x": [1, 2, 3]}, lambda c: (c["x"] - 2) ** 2, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[{'a': 3, 'b': 1}, {'a': 3, 'b': 2}] 5\n({'x': 2}, 0)",
          "[{'b': 1, 'a': 3}, {'b': 2, 'a': 3}] 5\n({'x': 2}, 0)",
          "[{'a': 3, 'b': 1}, {'a': 3, 'b': 2}] 1\n({'x': 2}, 0)",
          "[{'a': 3, 'b': 1}, {'a': 3, 'b': 2}] 5\n({'x': 1}, 1)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rank_by_model(cands, model):
    return sorted(cands, key=model)                        # stable: ties keep their order

def top_k(cands, model, run, k):
    tried = rank_by_model(cands, model)[:k]
    return min(tried, key=run), len(tried)                 # measure only the most promising

def pair_accuracy(pred, actual):
    pairs = [(i, j) for i in range(len(pred)) for j in range(i + 1, len(pred)) if actual[i] != actual[j]]
    good = sum((pred[i] < pred[j]) == (actual[i] < actual[j]) for i, j in pairs)
    return good / len(pairs) if pairs else 1.0

cands = [1, 2, 3, 4]; print(rank_by_model(cands, lambda c: -c), top_k(cands, lambda c: c % 3, lambda c: 10 - c, 2))
print(pair_accuracy([1, 2, 3], [1, 3, 2]), pair_accuracy([1, 1], [2, 2]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 3, 2, 1] (3, 2)\n0.6666666666666666 1.0",
          "[4, 3, 2, 1] (1, 2)\n0.6666666666666666 1.0",
          "[4, 3, 2, 1] (3, 2)\n0.3333333333333333 1.0",
          "[1, 2, 3, 4] (3, 2)\n0.6666666666666666 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grid(space)</C>, every configuration as a dict, iterating keys in sorted order with the last key
          varying fastest; <C>measure(run, cfg, reps)</C>, the element at index reps // 2 of the sorted times; and{" "}
          <C>tune(space, run, reps)</C>, the first configuration with the smallest measured time and that time.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def grid(space):
    return [space]

def measure(run, cfg, reps):
    return run(cfg)

def tune(space, run, reps):
    return None, None
`,
        solution: SEARCH,
        tests: [
          { name: "grid", code: `assert grid({}) == [{}] and grid({"z": [1], "y": [2, 3]}) == [{"y": 2, "z": 1}, {"y": 3, "z": 1}]` },
          { name: "tune", code: `it = iter([3, 1, 2]); assert measure(lambda c: next(it), None, 3) == 2 and tune({"a": [1, 2], "b": [1, 2]}, lambda c: c["a"] * 10 + c["b"] if c["a"] != 1 else 50, 1) == ({"a": 2, "b": 1}, 21)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rank_by_model(cands, model)</C>, a stable sort by predicted time; <C>top_k(cands, model, run, k)</C>,
          measuring the k best-ranked candidates once each and returning the fastest and how many were measured; and{" "}
          <C>pair_accuracy(pred, actual)</C>, the fraction of pairs with different actual times whose predicted order is
          right, or 1.0 if there are none.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rank_by_model(cands, model):
    return cands

def top_k(cands, model, run, k):
    return cands[0], k

def pair_accuracy(pred, actual):
    return 1.0
`,
        solution: GUIDED,
        tests: [
          { name: "rank", code: `assert rank_by_model(["p", "q", "r"], lambda c: 0) == ["p", "q", "r"] and top_k([5, 6, 7], lambda c: -c, lambda c: c, 1) == (7, 1)` },
          { name: "pairs", code: `assert pair_accuracy([3, 2, 1], [1, 2, 3]) == 0.0 and abs(pair_accuracy([1, 2, 3, 4], [1, 2, 4, 3]) - 5 / 6) < 1e-9` },
        ],
      },
    },
    {
      key: "reps",
      rung: "stretch",
      prompt: (
        <p>
          For the two configurations of the second check, what is the smallest number n of measurements of each, compared
          by their means, that brings the probability of picking the slower one to at most 0.01?
        </p>
      ),
      answer: { kind: "numeric", value: 25, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        That completes the stages of a compiler. The next chapter looks at three real compilers, starting with XLA, and
        sees how each arranges capture, passes, code generation and tuning.
      </p>
    </>
  ),
};
