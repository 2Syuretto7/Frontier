import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InferenceCostViz } from "@/components/viz/InferenceCostViz";
import type { LessonContent } from "@/lib/types";

const LIFETIME = `E, A, B, ALPHA, BETA = 1.69, 406.4, 410.7, 0.34, 0.28

def total_flops(N, D, D_inf):
    return 6 * N * D + 2 * N * D_inf

def tokens_needed(N, L_target):
    gap = L_target - E - A / N ** ALPHA
    return (B / gap) ** (1 / BETA) if gap > 0 else float("inf")

def best_size(L_target, D_inf, Ns):
    return min(Ns, key=lambda N: total_flops(N, tokens_needed(N, L_target), D_inf))`;

const BREAKEVEN = `def train_flops(N, D):
    return 6 * N * D

def infer_flops(N, T):
    return 2 * N * T

def break_even(N_small, D_small, N_big, D_big):
    return (train_flops(N_small, D_small) - train_flops(N_big, D_big)) / (2 * (N_big - N_small))`;

export const lesson: LessonContent = {
  id: "l8.4.4",
  minutes: 45,
  links: {
    requires: ["l8.4.3", "l5.3.3"],
    revisits: ["l8.2.2", "l8.1.3"],
    foreshadows: ["e12.1.1", "l8.4.5"],
  },

  puzzle: (
    <>
      <p>
        Llama 3 8B was trained on 15 trillion tokens, nearly two thousand tokens per parameter, a hundred times the Chinchilla
        ratio. By the compute-optimal rule, that compute would have been better spent on a model several times larger. Yet the
        choice was deliberate, and most open models since have made it. What objective makes it right?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Chinchilla minimises the cost of training. A deployed model is trained once and then generates text for millions of
        users, and each generated token costs compute in proportion to the number of parameters. If the model will serve more
        tokens than it was trained on, inference dominates the bill. A smaller model needs more training to reach the same
        quality, but every token it serves is cheaper, so the lifetime optimum moves towards small models trained long.
      </p>
      <InferenceCostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="lifetime compute">
        <p>
          Training costs about 6ND FLOPs and inference about 2N per token, so a model serving <M>{"D_{\\mathrm{inf}}"}</M> tokens costs
        </p>
        <MD>{"C_{\\mathrm{total}} = 6ND + 2ND_{\\mathrm{inf}}"}</MD>
        <p>
          (<C>total_flops</C>). To reach a target loss <M>{"L^*"}</M> with N parameters under the Chinchilla law takes{" "}
          <M>{"D(N) = \\big(B / (L^* - E - AN^{-\\alpha})\\big)^{1/\\beta}"}</M> tokens, infinite if N is too small to reach <M>{"L^*"}</M> at all
          (<C>tokens_needed</C>). Sardana and Frankle minimise <M>{"C_{\\mathrm{total}}"}</M> over N at fixed <M>{"L^*"}</M> (<C>best_size</C>).
        </p>
        <Code>{LIFETIME}</Code>
      </Definition>

      <Theorem title="the break-even point">
        <p>
          Compare a small model <M>{"(N_s, D_s)"}</M> trained longer with a large one <M>{"(N_b, D_b)"}</M>, <M>{"N_s < N_b"}</M>. Their lifetime costs are equal
          after serving
        </p>
        <MD>{"T^* = \\frac{6N_sD_s - 6N_bD_b}{2(N_b - N_s)}"}</MD>
        <p>
          tokens (<C>train_flops</C>, <C>infer_flops</C>, <C>break_even</C>), and beyond <M>{"T^*"}</M> the small model is cheaper. If the small model is also
          cheaper to train, <M>{"T^* \\le 0"}</M> and it wins from the start.
        </p>
        <Code>{BREAKEVEN}</Code>
      </Theorem>
      <Proof>
        <p>
          Set <M>{"6N_sD_s + 2N_sT = 6N_bD_b + 2N_bT"}</M> and solve the linear equation for T. The small model&apos;s cost grows more
          slowly in T, by <M>{"2(N_b - N_s)"}</M> per token, so it is cheaper for every T beyond the crossing.
        </p>
      </Proof>

      <Remark title="over-training is predictable">
        <p>
          A natural worry is that loss laws fitted near twenty tokens per parameter fail far from it. Gadre and colleagues trained
          families at fixed ratios M = D/N up to several hundred and found that, for each M, loss is still a power law in compute
          with nearly the same exponent, only shifted up; so the penalty for over-training can be measured on small runs. The
          penalty is modest: under the Chinchilla law a model several times smaller than the compute-optimal one can match its
          loss with enough extra tokens, spending more on training but a fraction as much per token served.
        </p>
      </Remark>

      <Example title="what this misses">
        <p>
          The 2N per token rule ignores attention over long contexts, the key-value cache of l8.2.2, and batching: on real
          hardware, decoding is limited by memory bandwidth, so a smaller model is cheaper by more than its FLOPs suggest.
          Latency matters as well as cost, and a smaller model answers faster. Data limits also intervene, since an over-trained
          model needs many more unique tokens, which brings back the repetition question of l8.1.3. All of these push in the
          same direction: deployed models are now routinely trained at hundreds or thousands of tokens per parameter.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "total",
      rung: "check",
      prompt: <p>A model with 8 billion parameters is trained on 15 trillion tokens and then serves 10 trillion tokens. What is its lifetime compute, in units of 10²³ FLOPs? Give one decimal.</p>,
      answer: { kind: "numeric", value: 8.8, tolerance: 0.05 },
    },
    {
      key: "even",
      rung: "check",
      prompt: (
        <p>
          An 8-billion-parameter model trained on 15 trillion tokens is compared with a 70-billion-parameter model trained on 1.4
          trillion. After how many served tokens, in trillions, are their lifetime costs equal? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.06, tolerance: 0.01 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does a large expected inference volume favour training a smaller model for longer?</p>,
      answer: {
        kind: "choice",
        options: [
          "Inference cost per token is proportional to the parameter count, so once serving dominates, the extra training a small model needs is repaid by its cheaper tokens",
          "Smaller models always reach lower loss than larger ones",
          "Training tokens are free once the data is collected",
          "Larger models cannot be used for inference at all",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`E, A, B, ALPHA, BETA = 1.69, 406.4, 410.7, 0.34, 0.28

def total_flops(N, D, D_inf):
    return 6 * N * D + 2 * N * D_inf

def tokens_needed(N, L_target):
    gap = L_target - E - A / N ** ALPHA
    return (B / gap) ** (1 / BETA) if gap > 0 else float("inf")

def best_size(L_target, D_inf, Ns):
    return min(Ns, key=lambda N: total_flops(N, tokens_needed(N, L_target), D_inf))

print(total_flops(10, 20, 0), total_flops(10, 20, 100), tokens_needed(1e9, 1.0))
print(round(tokens_needed(1e12, E + A / 1e12 ** ALPHA + B / 1e12 ** BETA) / 1e12, 6), best_size(2.2, 0, [1e9, 1e10, 1e11]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1200 3200 inf\n1.0 10000000000.0",
          "1200 2200 inf\n1.0 10000000000.0",
          "1200 3200 0.0\n1.0 10000000000.0",
          "1200 3200 inf\n1.0 100000000000.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def train_flops(N, D):
    return 6 * N * D

def infer_flops(N, T):
    return 2 * N * T

def break_even(N_small, D_small, N_big, D_big):
    return (train_flops(N_small, D_small) - train_flops(N_big, D_big)) / (2 * (N_big - N_small))

print(train_flops(2, 3), infer_flops(2, 3), break_even(1, 30, 2, 10))
print(break_even(1, 20, 4, 5), break_even(1, 5, 2, 20) < 0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "36 12 30.0\n0.0 True",
          "36 12 60.0\n0.0 True",
          "36 6 30.0\n0.0 True",
          "36 12 30.0\n0.0 False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>total_flops(N, D, D_inf)</C>, <C>tokens_needed(N, L_target)</C>, returning infinity when the target is out of reach, and{" "}
          <C>best_size(L_target, D_inf, Ns)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `E, A, B, ALPHA, BETA = 1.69, 406.4, 410.7, 0.34, 0.28

def total_flops(N, D, D_inf):
    return 6 * N * D

def tokens_needed(N, L_target):
    return 20 * N

def best_size(L_target, D_inf, Ns):
    return Ns[0]
`,
        solution: LIFETIME,
        tests: [
          { name: "tokens", code: `L = E + A / 3e10 ** ALPHA + B / 6e11 ** BETA\nassert abs(tokens_needed(3e10, L) / 6e11 - 1) < 1e-9 and tokens_needed(1e6, L) == float("inf") and total_flops(1, 2, 3) == 18` },
          { name: "best", code: `L = E + A / 7e10 ** ALPHA + B / 1.4e12 ** BETA\nNs = [10 ** (9.5 + 0.1 * i) for i in range(21)]\nassert best_size(L, 0, Ns) > best_size(L, 1e13, Ns) > best_size(L, 1e14, Ns)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_flops(N, D)</C>, <C>infer_flops(N, T)</C> and <C>break_even(N_small, D_small, N_big, D_big)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def train_flops(N, D):
    return 2 * N * D

def infer_flops(N, T):
    return 6 * N * T

def break_even(N_small, D_small, N_big, D_big):
    return 0.0
`,
        solution: BREAKEVEN,
        tests: [
          { name: "flops", code: `assert train_flops(3, 5) == 90 and infer_flops(3, 5) == 30` },
          { name: "even", code: `T = break_even(2, 50, 5, 10)\nassert abs(T - 50) < 1e-12 and abs(train_flops(2, 50) + infer_flops(2, T) - train_flops(5, 10) - infer_flops(5, T)) < 1e-9` },
        ],
      },
    },
    {
      key: "match",
      rung: "stretch",
      prompt: (
        <p>
          Under the Chinchilla law, how many training tokens, in trillions, does an 8-billion-parameter model need to match the loss
          of a 70-billion-parameter model trained on 1.4 trillion tokens? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 25.9, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Loss is what the laws predict, but users care about what the model can do. The next lesson asks whether benchmark
        scores can be predicted from small runs too.
      </p>
    </>
  ),
};
