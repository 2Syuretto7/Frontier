import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AutotuneHeatmapViz } from "@/components/viz/AutotuneHeatmapViz";
import type { LessonContent } from "@/lib/types";

const TUNER = `import itertools

def product_configs(space):
    keys = list(space)
    return [dict(zip(keys, vals)) for vals in itertools.product(*space.values())]

def pick_best(configs, bench, reps):
    def median_time(cfg):
        t = sorted(bench(cfg) for _ in range(reps))
        return (t[(reps - 1) // 2] + t[reps // 2]) / 2
    return min(configs, key=median_time)          # ties keep the earlier config

def cached_best(cache, key, configs, bench, reps):
    if key not in cache:                          # tune once per distinct key
        cache[key] = pick_best(configs, bench, reps)
    return cache[key]`;

const WAVES = `def num_tiles(M, N, BM, BN):
    return -(-M // BM) * -(-N // BN)

def wave_efficiency(tiles, slots):
    waves = -(-tiles // slots)
    return tiles / (waves * slots)

def bucket_key(M, N, K):
    def up(n):
        p = 1
        while p < n:
            p *= 2
        return p
    return (up(M), up(N), up(K))`;

const AUTOTUNE = `@triton.autotune(
    configs=[
        triton.Config({"BM": 128, "BN": 256, "BK": 64}, num_warps=8, num_stages=3),
        triton.Config({"BM": 128, "BN": 128, "BK": 32}, num_warps=4, num_stages=4),
        triton.Config({"BM": 64, "BN": 64, "BK": 32}, num_warps=4, num_stages=5),
        triton.Config({"BM": 32, "BN": 64, "BK": 64}, num_warps=2, num_stages=5),
    ],
    key=["M", "N", "K"],                          # tune again when any of these changes
)
@triton.jit
def matmul_kernel(a_ptr, b_ptr, c_ptr, M, N, K, sam, sak, sbk, sbn, scm, scn,
                  BM: tl.constexpr, BN: tl.constexpr, BK: tl.constexpr):
    ...                                           # the kernel of e9.3.1

grid = lambda meta: (triton.cdiv(M, meta["BM"]), triton.cdiv(N, meta["BN"]))
matmul_kernel[grid](a, b, c, M, N, K, *a.stride(), *b.stride(), *c.stride())`;

export const lesson: LessonContent = {
  id: "e9.3.3",
  minutes: 50,
  links: {
    requires: ["e9.3.1", "e9.2.4"],
    revisits: ["e9.3.2", "e9.1.1"],
    foreshadows: ["e9.4.2"],
  },

  puzzle: (
    <>
      <p>
        A Triton matrix multiplication with 128 by 128 tiles runs near peak on large square problems. In a language model server the
        same kernel is called with sixteen rows at a time during decoding, and there it is five times slower than it could be. Nothing in
        the code is wrong. What is, and how can one kernel be fast on both?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A kernel&apos;s constants, the block sizes, the warps per program and the number of pipeline stages, trade operand reuse
        against parallelism and register pressure, and the best balance depends on the problem&apos;s shape and the GPU. Rather than
        reason it out for every case, an autotuner compiles a handful of candidate configurations, times each on the actual inputs, and
        remembers the winner for that shape. The skill moves from picking constants to choosing a good candidate list, a sensible cache
        key, and timings that can be trusted.
      </p>
      <AutotuneHeatmapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="configurations and the tuning cache">
        <p>
          A configuration assigns a value to each <C>tl.constexpr</C> parameter plus <C>num_warps</C> and <C>num_stages</C>. The
          decorator <C>@triton.autotune</C> takes a list of configurations and a <C>key</C>, a list of argument names. On the first call
          with a new value of the key it compiles and benchmarks every configuration, keeps the fastest, and stores it under that key;
          later calls with the same key go straight to the stored choice. The grid is a function of the chosen configuration, because the
          number of programs depends on the block sizes.
        </p>
        <Code>{AUTOTUNE}</Code>
        <p>
          The Python below is the same logic: a search space is a product of option lists (<C>product_configs</C>), each candidate is
          timed several times and summarised by the median of e9.2.4 (<C>pick_best</C>), and the winner is cached by key
          (<C>cached_best</C>).
        </p>
        <Code>{TUNER}</Code>
      </Definition>

      <Definition title="waves and wave efficiency">
        <p>
          A kernel with T programs on a GPU that can run S programs at once (the number of SMs times the programs each SM holds)
          executes in <M>{"\\lceil T/S \\rceil"}</M> waves, and the last wave may leave SMs idle. The wave efficiency{" "}
          <M>{"T / (S\\lceil T/S \\rceil)"}</M> is the fraction of SM time slots doing work. Small problems with large tiles make few
          programs and leave most SMs idle; tiles that slightly overshoot a multiple of S waste most of a wave. Rounding a dimension to a
          power of two (<C>bucket_key</C>) is a common way to keep the key from growing with every new shape.
        </p>
        <Code>{WAVES}</Code>
      </Definition>

      <Theorem title="selecting from noisy timings">
        <p>
          Let candidate i have true time <M>{"\\mu_i"}</M>, and let each timing be <M>{"\\mu_i"}</M> plus independent noise.
        </p>
        <ol>
          <li>
            The expected time of the measured winner, as measured, is at most the smallest true time:{" "}
            <M>{"\\mathbb{E}[\\min_i \\hat{T}_i] \\le \\min_i \\mu_i"}</M> when each <M>{"\\hat{T}_i"}</M> is unbiased.
          </li>
          <li>
            If two candidates differ by <M>{"\\Delta = \\mu_2 - \\mu_1 > 0"}</M>, the noise is normal with standard deviation{" "}
            <M>{"\\sigma"}</M>, and each is summarised by the mean of r timings, the slower one is picked with probability{" "}
            <M>{"\\Phi(-\\Delta\\sqrt{r}/(\\sigma\\sqrt{2}))"}</M>.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          (1) For every j, <M>{"\\min_i \\hat{T}_i \\le \\hat{T}_j"}</M>, so <M>{"\\mathbb{E}[\\min_i \\hat{T}_i] \\le \\mu_j"}</M> for every
          j, and hence for the smallest. (2) The two means are independent normals with variance <M>{"\\sigma^2/r"}</M>, so their
          difference <M>{"\\hat{T}_2 - \\hat{T}_1"}</M> is normal with mean <M>{"\\Delta"}</M> and variance <M>{"2\\sigma^2/r"}</M>. The
          wrong candidate wins when this difference is negative, which has probability{" "}
          <M>{"\\Phi(-\\Delta / \\sqrt{2\\sigma^2/r})"}</M>.
        </p>
      </Proof>

      <Remark title="what the theorem means in practice">
        <p>
          Part 1 says the time an autotuner reports for its winner is optimistic: the more candidates, the more likely one of them had a
          lucky run. Part 2 says how many repetitions a close call needs. To separate configurations 1% apart under 2% noise with at most
          5% error, <M>{"\\sqrt{r} \\ge 1.645 \\cdot 2\\sqrt{2}"}</M>, so r &#8805; 22. Candidates within the noise of each other are
          not worth separating; a short list of genuinely different configurations beats a long list of near-duplicates.
        </p>
      </Remark>

      <Remark title="pitfalls">
        <ul>
          <li>
            A key that includes a dimension that changes on every call, such as the sequence length in a server, makes every call a
            tuning run; bucket it. A key that leaves out a dimension that matters reuses a configuration where it is poor.
          </li>
          <li>
            Benchmarking runs the kernel many times. A kernel that accumulates into its output or updates its input in place gives wrong
            results unless the tuner resets those tensors between runs (Triton&apos;s <C>reset_to_zero</C> and <C>restore_value</C>).
          </li>
          <li>
            Search spaces grow as products. Prune configurations that cannot fit in registers or shared memory, or that are obviously
            wrong for the shape, before timing them; Triton accepts a pruning function for this.
          </li>
          <li>
            The cache lives in the process. Tuning cost recurs at every start-up unless the choices are saved, and choices made on one GPU
            model need not suit another.
          </li>
        </ul>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With sixteen rows, a 128 by 128 tile computes 112 masked rows for every 16 real ones, and an 8192-wide output makes only 64
          programs for 132 SMs. Smaller tiles in M and N waste less and fill the machine. In the figure&apos;s model the best decoding
          tile is 32 by 64. Autotuning with M in the key, bucketed, picks a different configuration for decoding and for prefill, and the
          same source serves both.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "space",
      rung: "check",
      prompt: (
        <p>
          A search space has BM and BN each in {"{64, 128, 256}"}, BK in {"{32, 64}"}, num_warps in {"{4, 8}"} and num_stages in{" "}
          {"{2, 3, 4}"}. Configurations with BM = BN = 256 are pruned. How many configurations are timed?
        </p>
      ),
      answer: { kind: "numeric", value: 96, tolerance: 0 },
    },
    {
      key: "waves",
      rung: "check",
      prompt: (
        <p>
          A 2560 by 2560 output is computed with 128 by 128 tiles on a GPU with 132 SMs, one program per SM at a time. What is the wave
          efficiency? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.758, tolerance: 0.001 },
    },
    {
      key: "key",
      rung: "apply",
      prompt: (
        <p>
          An inference server calls an autotuned attention kernel with <C>key=["seq_len"]</C>, and sequence lengths vary from call to
          call. Latency spikes on many requests. What is the best fix?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Round seq_len up to a power of two before using it as the key",
          "Remove seq_len from the key so that one configuration is always used",
          "Add more configurations so that the best one is found sooner",
          "Reduce the number of timing repetitions to zero",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools

def product_configs(space):
    keys = list(space)
    return [dict(zip(keys, vals)) for vals in itertools.product(*space.values())]

def pick_best(configs, bench, reps):
    def median_time(cfg):
        t = sorted(bench(cfg) for _ in range(reps))
        return (t[(reps - 1) // 2] + t[reps // 2]) / 2
    return min(configs, key=median_time)          # ties keep the earlier config

def cached_best(cache, key, configs, bench, reps):
    if key not in cache:                          # tune once per distinct key
        cache[key] = pick_best(configs, bench, reps)
    return cache[key]

cfgs, cache, t = product_configs({"BM": [64, 128], "warps": [4, 8]}), {}, lambda c: abs(c["BM"] - 100) + c["warps"]
print(len(cfgs), cfgs[1], cached_best(cache, (512,), cfgs, t, 3), len(cache))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 {'BM': 64, 'warps': 8} {'BM': 128, 'warps': 4} 1",
          "4 {'BM': 128, 'warps': 4} {'BM': 128, 'warps': 4} 1",
          "4 {'BM': 64, 'warps': 8} {'BM': 64, 'warps': 4} 1",
          "4 {'BM': 64, 'warps': 8} {'BM': 128, 'warps': 4} 4",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def num_tiles(M, N, BM, BN):
    return -(-M // BM) * -(-N // BN)

def wave_efficiency(tiles, slots):
    waves = -(-tiles // slots)
    return tiles / (waves * slots)

def bucket_key(M, N, K):
    def up(n):
        p = 1
        while p < n:
            p *= 2
        return p
    return (up(M), up(N), up(K))

n = num_tiles(1000, 1000, 128, 128)
print(n, round(wave_efficiency(n, 132), 3), bucket_key(1000, 4096, 33))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "64 0.485 (1024, 4096, 64)",
          "49 0.371 (1024, 4096, 64)",
          "64 0.485 (1024, 4096, 32)",
          "64 1.0 (1024, 4096, 64)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>product_configs(space)</C>, turning a dict of option lists into the list of all dicts, in the order of{" "}
          <C>itertools.product</C>; <C>pick_best(configs, bench, reps)</C>, which calls <C>bench(cfg)</C> reps times per configuration and
          returns the configuration with the smallest median, the earlier one on ties; and{" "}
          <C>cached_best(cache, key, configs, bench, reps)</C>, which tunes only for keys not yet in the cache.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools

def product_configs(space):
    return []

def pick_best(configs, bench, reps):
    return configs[-1]

def cached_best(cache, key, configs, bench, reps):
    return configs[0]
`,
        solution: TUNER,
        tests: [
          { name: "search", code: `assert product_configs({"a": [1, 2], "b": [0]}) == [{"a": 1, "b": 0}, {"a": 2, "b": 0}]\nseq = iter([9.0, 1.0, 1.0, 2.0, 2.0, 2.0])\nassert pick_best([{"k": 0}, {"k": 1}], lambda c: next(seq), 3) == {"k": 0}` },
          { name: "cache", code: `n = []\nb = lambda c: n.append(1) or c["x"]\ncache, cfgs = {}, [{"x": 3}, {"x": 1}]\nassert cached_best(cache, "k", cfgs, b, 5) == {"x": 1} and len(n) == 10\nassert cached_best(cache, "k", cfgs, b, 5) == {"x": 1} and len(n) == 10\ncached_best(cache, "j", cfgs, b, 5)\nassert len(n) == 20 and set(cache) == {"k", "j"}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>num_tiles(M, N, BM, BN)</C>, the number of programs that cover an M by N output; <C>wave_efficiency(tiles, slots)</C>;
          and <C>bucket_key(M, N, K)</C>, which rounds each dimension up to a power of two.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def num_tiles(M, N, BM, BN):
    return 0

def wave_efficiency(tiles, slots):
    return 1.0

def bucket_key(M, N, K):
    return (M, N, K)
`,
        solution: WAVES,
        tests: [
          { name: "tiles", code: `assert num_tiles(4096, 4096, 128, 256) == 512 and num_tiles(1, 1, 64, 64) == 1\nassert bucket_key(1, 3, 1024) == (1, 4, 1024)` },
          { name: "waves", code: `assert wave_efficiency(264, 132) == 1.0\nassert abs(wave_efficiency(133, 132) - 133 / 264) < 1e-12` },
        ],
      },
    },
    {
      key: "noise",
      rung: "stretch",
      prompt: (
        <p>
          Two configurations take 1.00 ms and 1.02 ms, and each timing has independent normal noise with standard deviation 0.02 ms. The
          tuner times each once. What is the probability that it picks the slower one? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.24, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        With programs, fusion and tuning in hand, the next chapter writes the most important fused kernel of recent years. It begins with
        a way to compute softmax in one pass over data that never fits in a block.
      </p>
    </>
  ),
};
