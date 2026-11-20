import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CapacityViz } from "@/components/viz/CapacityViz";
import type { LessonContent } from "@/lib/types";

const DISPATCH = `import math

def capacity(T, k, E, cf):
    return math.ceil(cf * T * k / E)

def dispatch_with_capacity(choices, E, cap):
    kept = [[] for _ in range(E)]
    dropped = []
    for t, experts in enumerate(choices):
        for e in experts:
            if len(kept[e]) < cap:
                kept[e].append(t)
            else:
                dropped.append((t, e))
    return kept, dropped

def padding_waste(kept, cap):
    return 1 - sum(len(k) for k in kept) / (cap * len(kept))`;

const OVERFLOW = `import math

def binom_pmf(n, p, x):
    return math.comb(n, x) * p ** x * (1 - p) ** (n - x)

def expected_overflow(n, p, cap):
    return sum((x - cap) * binom_pmf(n, p, x) for x in range(cap + 1, n + 1))

def expected_drop_rate(T, k, E, cf):
    cap = math.ceil(cf * T * k / E)
    return E * expected_overflow(T * k, 1 / E, cap) / (T * k)`;

export const lesson: LessonContent = {
  id: "l8.3.3",
  minutes: 45,
  links: {
    requires: ["l8.3.2", "m7.2.2", "m7.2.3"],
    revisits: ["e7.3.1"],
    foreshadows: ["e10.6.1"],
  },

  puzzle: (
    <>
      <p>
        Accelerators like fixed shapes: a matrix multiply over a known number of rows can be compiled once and run at full
        speed. But routing decides at run time how many tokens each expert receives, and that number changes every batch.
        The early fix was to give every expert a fixed-size buffer and simply skip the tokens that do not fit. How many
        tokens does that throw away, what does a larger buffer cost, and can the buffer be avoided altogether?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Even a perfectly fair router produces uneven loads, because each batch is a random sample: with 32 tokens expected per
        expert, some get 40 and some get 25. A buffer exactly at the average drops the excess at the busy experts and leaves
        the quiet ones half empty. Making every buffer larger catches more of the excess but pays for empty slots everywhere.
        Dropped tokens are not lost entirely, since the residual connection carries them past the layer, but they miss the
        computation they were routed to.
      </p>
      <CapacityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="expert capacity">
        <p>
          With T tokens per batch, k experts per token and E experts, each expert gets a buffer of
        </p>
        <MD>{"C = \\left\\lceil \\mathrm{CF}\\cdot \\frac{Tk}{E} \\right\\rceil"}</MD>
        <p>
          slots, with capacity factor CF ≥ 1 (<C>capacity</C>). Tokens are placed in order, and an assignment that finds its
          expert full is dropped (<C>dispatch_with_capacity</C>); the fraction of slots left empty is padding (<C>padding_waste</C>).
          Compute and activation memory scale with <M>{"E \\cdot C"}</M>, so CF is a direct multiplier on the cost of the layer.
        </p>
        <Code>{DISPATCH}</Code>
      </Definition>

      <Theorem title="expected drops under uniform routing">
        <p>
          If each of the Tk assignments goes to expert i independently with probability 1/E, the load of expert i is{" "}
          <M>{"X \\sim \\mathrm{Bin}(Tk, 1/E)"}</M>, and the expected fraction of assignments dropped is
        </p>
        <MD>{"\\frac{E\\,\\mathbb{E}\\big[(X - C)_+\\big]}{Tk} = \\frac{E}{Tk}\\sum_{x > C} (x - C)\\binom{Tk}{x}E^{-x}(1 - 1/E)^{Tk - x}"}</MD>
        <p>
          (<C>binom_pmf</C>, <C>expected_overflow</C>, <C>expected_drop_rate</C>).
        </p>
        <Code>{OVERFLOW}</Code>
      </Theorem>
      <Proof>
        <p>
          Expert i drops <M>{"(X_i - C)_+"}</M> assignments. By symmetry every expert has the same expectation, so the total is{" "}
          <M>{"E\\,\\mathbb{E}[(X - C)_+]"}</M>, and dividing by the Tk assignments gives the fraction. The loads are not independent across
          experts, since they sum to Tk, but linearity of expectation does not need independence.
        </p>
      </Proof>

      <Remark title="how the numbers scale">
        <p>
          The load has mean <M>{"Tk/E"}</M> and standard deviation about <M>{"\\sqrt{Tk/E}"}</M>, so the relative fluctuation shrinks like{" "}
          <M>{"1/\\sqrt{Tk/E}"}</M>. Large batches per expert need only a small margin; small ones, as in decoding or with very many
          fine-grained experts, need a large one. Real routers are not uniform, and skew adds to the overflow directly, which is
          why capacity and load balancing were always tuned together. GShard and the Switch Transformer used CF between 1 and
          2 in training and larger factors at evaluation.
        </p>
      </Remark>

      <Example title="dropless training">
        <p>
          MegaBlocks reformulated the expert computation as a block-sparse matrix multiply, so that each expert processes
          exactly the tokens it receives with no padding and no drops, at the cost of custom kernels and variable-sized
          communication. Grouped matrix multiplies now do the same in standard libraries. DeepSeek-V3 drops no tokens in
          training or inference, relying on its balancing to keep the per-device load even. Dropping survives mainly where fixed
          shapes are essential, for instance on some accelerators that compile static graphs.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cap",
      rung: "check",
      prompt: <p>A batch of 4,096 tokens is routed top-2 among 64 experts with capacity factor 1.25. What is the capacity of each expert?</p>,
      answer: { kind: "numeric", value: 160, tolerance: 0 },
    },
    {
      key: "drop",
      rung: "check",
      prompt: <p>Under uniform routing, 64 tokens go top-1 to 8 experts with capacity factor 1. What fraction of tokens is dropped in expectation? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1305, tolerance: 0.0002 },
    },
    {
      key: "resid",
      rung: "apply",
      prompt: <p>What happens to a token dropped by an expert layer in a standard transformer block?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its expert contribution is zero for that layer, and it continues to the next layer through the residual connection unchanged by this layer",
          "It is removed from the sequence for the rest of the forward pass",
          "Its loss is set to zero so that it does not affect training",
          "It is sent to the least loaded expert instead",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def capacity(T, k, E, cf):
    return math.ceil(cf * T * k / E)

def dispatch_with_capacity(choices, E, cap):
    kept = [[] for _ in range(E)]
    dropped = []
    for t, experts in enumerate(choices):
        for e in experts:
            if len(kept[e]) < cap:
                kept[e].append(t)
            else:
                dropped.append((t, e))
    return kept, dropped

def padding_waste(kept, cap):
    return 1 - sum(len(k) for k in kept) / (cap * len(kept))

print(capacity(10, 1, 4, 1.0), capacity(8, 2, 4, 1.25), dispatch_with_capacity([[0], [1], [0], [0]], 2, 2))
print(padding_waste([[0, 2], [1]], 2), padding_waste([[0], [1]], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 5 ([[0, 2], [1]], [(3, 0)])\n0.25 0.75",
          "3 4 ([[0, 2], [1]], [(3, 0)])\n0.25 0.75",
          "2 5 ([[0, 2, 3], [1]], [])\n0.0 0.75",
          "3 5 ([[2, 3], [1]], [(0, 0)])\n0.25 0.75",
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

def binom_pmf(n, p, x):
    return math.comb(n, x) * p ** x * (1 - p) ** (n - x)

def expected_overflow(n, p, cap):
    return sum((x - cap) * binom_pmf(n, p, x) for x in range(cap + 1, n + 1))

def expected_drop_rate(T, k, E, cf):
    cap = math.ceil(cf * T * k / E)
    return E * expected_overflow(T * k, 1 / E, cap) / (T * k)

print(binom_pmf(4, 0.5, 2), expected_overflow(2, 0.5, 1), expected_overflow(3, 0.5, 3))
print(round(expected_drop_rate(4, 1, 2, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.375 0.25 0\n0.1875",
          "0.375 0.25 0\n0.375",
          "0.375 0.5 0\n0.1875",
          "0.25 0.25 0\n0.1875",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>capacity(T, k, E, cf)</C>, <C>dispatch_with_capacity(choices, E, cap)</C>, filling buffers in token order and returning the
          token lists per expert and the dropped (token, expert) pairs, and <C>padding_waste(kept, cap)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def capacity(T, k, E, cf):
    return int(cf * T / E)

def dispatch_with_capacity(choices, E, cap):
    kept = [[] for _ in range(E)]
    for t, experts in enumerate(choices):
        for e in experts:
            kept[e].append(t)
    return kept, []

def padding_waste(kept, cap):
    return 0.0
`,
        solution: DISPATCH,
        tests: [
          { name: "capacity", code: `assert capacity(100, 2, 8, 1.1) == 28 and capacity(64, 1, 8, 1.0) == 8` },
          { name: "dispatch", code: `kept, dropped = dispatch_with_capacity([[0, 1], [0, 2], [0, 1], [2, 1]], 3, 2)\nassert kept == [[0, 1], [0, 2], [1, 3]] and dropped == [(2, 0), (3, 1)] and abs(padding_waste(kept, 2)) < 1e-12 and abs(padding_waste([[0], [], [1, 2]], 3) - 2 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binom_pmf(n, p, x)</C>, <C>expected_overflow(n, p, cap)</C>, the expectation of <M>{"(X - \\text{cap})_+"}</M>, and{" "}
          <C>expected_drop_rate(T, k, E, cf)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def binom_pmf(n, p, x):
    return p ** x * (1 - p) ** (n - x)

def expected_overflow(n, p, cap):
    return max(0, n * p - cap)

def expected_drop_rate(T, k, E, cf):
    return 0.0
`,
        solution: OVERFLOW,
        tests: [
          { name: "pmf", code: `assert abs(binom_pmf(5, 0.2, 2) - 10 * 0.04 * 0.512) < 1e-12 and abs(expected_overflow(4, 0.5, 2) - 0.375) < 1e-12` },
          { name: "rate", code: `assert abs(expected_drop_rate(64, 1, 8, 1.0) - 0.13054695972) < 1e-9 and expected_drop_rate(8, 1, 2, 1.0) > expected_drop_rate(8, 1, 2, 1.5)` },
        ],
      },
    },
    {
      key: "none",
      rung: "stretch",
      prompt: (
        <p>
          Ten tokens are routed top-1 between two experts, each choosing either with probability one half, and the capacity
          factor is 1.2. What is the probability that no token is dropped? Give five decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.65625, tolerance: 0.00001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Capacity effects worsen as experts get smaller and more numerous, yet the strongest recent models use hundreds of
        small experts. The next lesson explains why fine-grained experts, together with a shared expert every token uses, are
        worth that trouble.
      </p>
    </>
  ),
};
