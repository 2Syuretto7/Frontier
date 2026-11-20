import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FineGrainViz } from "@/components/viz/FineGrainViz";
import type { LessonContent } from "@/lib/types";

const GRAIN = `import math

def routing_combinations(n, k):
    return math.comb(n, k)

def split_experts(n, k, h, m):
    return n * m, k * m, h // m

def moe_params(d, h, n_routed, n_shared, k):
    expert = 3 * d * h
    router = d * n_routed
    return (n_routed + n_shared) * expert + router, (k + n_shared) * expert + router`;

const SPECIAL = `import math

def entropy_bits(p):
    return -sum(x * math.log2(x) for x in p if x > 0)

def mutual_information(counts):
    total = sum(sum(row) for row in counts)
    pr = [sum(row) / total for row in counts]
    pc = [sum(row[j] for row in counts) / total for j in range(len(counts[0]))]
    pj = [c / total for row in counts for c in row]
    return entropy_bits(pr) + entropy_bits(pc) - entropy_bits(pj)

def specialisation(counts):
    total = sum(sum(row) for row in counts)
    pr = [sum(row) / total for row in counts]
    return mutual_information(counts) / entropy_bits(pr)`;

export const lesson: LessonContent = {
  id: "l8.3.4",
  minutes: 45,
  links: {
    requires: ["l8.3.3", "m12.2.3"],
    revisits: ["m4.1.3", "l8.2.4"],
    foreshadows: ["e10.6.1"],
  },

  puzzle: (
    <>
      <p>
        Mixtral uses 8 large experts and picks 2. DeepSeek-V3 uses 256 small experts, picks 8, and adds one expert that every
        token uses. Both spend similar compute per active parameter, so the difference is purely in how the capacity is cut
        up. Why would many small experts beat a few large ones with the same total size and the same compute per token, and
        what is the always-on expert for?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        With few large experts, each must cover a broad mix of skills, since a token can call on only a couple of them. Split
        every expert into narrower pieces and let the token choose correspondingly more, and the token can assemble exactly
        the pieces it needs from a vastly larger menu. Meanwhile some knowledge, such as common syntax, is needed by almost
        every token; without a shared expert, many routed experts each learn their own copy of it, which wastes their
        capacity.
      </p>
      <FineGrainViz />
    </>
  ),

  theory: (
    <>
      <Definition title="granularity">
        <p>
          Start from N experts of hidden width h with top-K routing. Splitting each into m experts of width h/m and routing to
          mK of them keeps the total parameters and the compute per token unchanged (<C>split_experts</C>). DeepSeekMoE further
          designates <M>{"K_s"}</M> of the active slots as shared experts that every token uses, and routes the remaining{" "}
          <M>{"mK - K_s"}</M> among the others. Parameter counts follow directly (<C>moe_params</C>).
        </p>
        <Code>{GRAIN}</Code>
      </Definition>

      <Theorem title="combinations grow super-exponentially with granularity">
        <p>
          The number of expert sets available to a token goes from <M>{"\\binom{N}{K}"}</M> to <M>{"\\binom{mN}{mK}"}</M> (<C>routing_combinations</C>),
          and for fixed <M>{"K/N = \\rho"}</M>,
        </p>
        <MD>{"\\log_2 \\binom{mN}{mK} = mN\\, H_2(\\rho) - O(\\log(mN))"}</MD>
        <p>
          with <M>{"H_2"}</M> the binary entropy, so the log of the count grows linearly in m.
        </p>
      </Theorem>
      <Proof>
        <p>
          The standard bounds <M>{"\\frac{1}{n+1}2^{nH_2(k/n)} \\le \\binom{n}{k} \\le 2^{nH_2(k/n)}"}</M> follow from the binomial theorem: the term{" "}
          <M>{"\\binom{n}{k}\\rho^k(1-\\rho)^{n-k}"}</M> with <M>{"\\rho = k/n"}</M> equals <M>{"\\binom{n}{k}2^{-nH_2(\\rho)}"}</M>, is at most the sum of all terms,
          which is 1, and is the largest of the n + 1 terms, so at least <M>{"1/(n+1)"}</M>. Apply with <M>{"n = mN"}</M>, <M>{"k = mK"}</M>.
        </p>
      </Proof>

      <Definition title="measuring specialisation">
        <p>
          Record how often tokens of each category, such as a language or a domain, are routed to each expert. The mutual
          information between category and expert, <M>{"I = H(\\text{category}) + H(\\text{expert}) - H(\\text{category}, \\text{expert})"}</M>{" "}
          (<C>entropy_bits</C>, <C>mutual_information</C>), is zero when routing ignores the category and equals the category
          entropy when the expert determines the category. Dividing by the category entropy gives a score between 0 and 1
          (<C>specialisation</C>).
        </p>
        <Code>{SPECIAL}</Code>
      </Definition>

      <Remark title="what the experiments show">
        <p>
          DeepSeekMoE found that, at equal total and active parameters, finer granularity and a shared expert both lowered
          loss, and that disabling top routed experts hurt the fine-grained model more, a sign of less redundancy among its
          experts. Krajewski and colleagues fitted scaling laws with granularity as a variable and found the best granularity
          rises with compute. The costs are practical: more, smaller matrix multiplies are less efficient, routing and
          all-to-all communication grow with the number of chosen experts, and capacity fluctuations worsen when each expert sees
          fewer tokens, which is why dropless kernels and careful placement across devices became essential.
        </p>
      </Remark>

      <Example title="DeepSeek-V3's layer">
        <p>
          With model width 7168, each expert is a SwiGLU layer of hidden width 2048. There are 256 routed experts, of which 8
          are chosen per token, and 1 shared expert. Routing restricts each token to experts on at most four nodes, to bound
          communication, a constraint that the combinatorics above can easily afford.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "combos",
      rung: "check",
      prompt: <p>Eight experts with top-2 routing are each split into 8, with top-16 routing among the 64. What is log₁₀ of the number of possible expert sets? Give two decimals.</p>,
      answer: { kind: "numeric", value: 14.69, tolerance: 0.01 },
    },
    {
      key: "active",
      rung: "check",
      prompt: (
        <p>
          A layer has width 7168, SwiGLU experts of hidden width 2048, 256 routed experts with top-8 routing, 1 shared expert
          and a router without bias. How many parameters are active per token, in millions? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 398.2, tolerance: 0.01 },
    },
    {
      key: "shared",
      rung: "apply",
      prompt: <p>What problem is a shared expert meant to solve?</p>,
      answer: {
        kind: "choice",
        options: [
          "Knowledge that nearly every token needs would otherwise be duplicated across many routed experts, wasting their capacity",
          "Without it, some tokens would not be routed to any expert",
          "It replaces the load-balancing mechanism",
          "It holds the router's parameters",
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

def routing_combinations(n, k):
    return math.comb(n, k)

def split_experts(n, k, h, m):
    return n * m, k * m, h // m

def moe_params(d, h, n_routed, n_shared, k):
    expert = 3 * d * h
    router = d * n_routed
    return (n_routed + n_shared) * expert + router, (k + n_shared) * expert + router

print(routing_combinations(8, 2), routing_combinations(32, 8) // routing_combinations(8, 2), split_experts(8, 2, 1024, 4))
print(moe_params(2, 4, 4, 1, 2), moe_params(2, 4, 4, 0, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "28 375653 (32, 8, 256)\n(128, 80) (104, 56)",
          "28 375653 (32, 8, 4096)\n(128, 80) (104, 56)",
          "56 375653 (32, 8, 256)\n(128, 80) (104, 56)",
          "28 375653 (32, 8, 256)\n(120, 72) (96, 48)",
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

def entropy_bits(p):
    return -sum(x * math.log2(x) for x in p if x > 0)

def mutual_information(counts):
    total = sum(sum(row) for row in counts)
    pr = [sum(row) / total for row in counts]
    pc = [sum(row[j] for row in counts) / total for j in range(len(counts[0]))]
    pj = [c / total for row in counts for c in row]
    return entropy_bits(pr) + entropy_bits(pc) - entropy_bits(pj)

def specialisation(counts):
    total = sum(sum(row) for row in counts)
    pr = [sum(row) / total for row in counts]
    return mutual_information(counts) / entropy_bits(pr)

print(entropy_bits([0.5, 0.25, 0.25]), mutual_information([[5, 0], [0, 5]]), mutual_information([[3, 3], [2, 2]]))
print(specialisation([[4, 0], [0, 4]]), round(specialisation([[3, 1], [1, 3]]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.5 1.0 0.0\n1.0 0.1887",
          "1.5 1.0 1.0\n1.0 0.1887",
          "1.0397 1.0 0.0\n1.0 0.1887",
          "1.5 2.0 0.0\n0.5 0.1887",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>routing_combinations(n, k)</C>, <C>split_experts(n, k, h, m)</C>, returning the new count, top-k and width, and{" "}
          <C>moe_params(d, h, n_routed, n_shared, k)</C>, returning (total, active) for SwiGLU experts plus a router over the routed experts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def routing_combinations(n, k):
    return n ** k

def split_experts(n, k, h, m):
    return n * m, k, h // m

def moe_params(d, h, n_routed, n_shared, k):
    expert = 3 * d * h
    return n_routed * expert, k * expert
`,
        solution: GRAIN,
        tests: [
          { name: "split", code: `assert routing_combinations(64, 16) == 488526937079580 and split_experts(16, 2, 4096, 4) == (64, 8, 1024)` },
          { name: "params", code: `assert moe_params(7168, 2048, 256, 1, 8) == (11320164352, 398196736) and moe_params(10, 20, 4, 2, 1) == (3640, 1840)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>entropy_bits(p)</C>, <C>mutual_information(counts)</C> for a table of counts with categories as rows and experts as columns,
          and <C>specialisation(counts)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def entropy_bits(p):
    return -sum(x * math.log(x) for x in p if x > 0)

def mutual_information(counts):
    return 0.0

def specialisation(counts):
    return 0.0
`,
        solution: SPECIAL,
        tests: [
          { name: "mi", code: `assert abs(entropy_bits([0.25] * 4) - 2) < 1e-12 and abs(mutual_information([[8, 0, 0], [0, 4, 4]]) - 1) < 1e-12 and abs(mutual_information([[2, 4], [1, 2]])) < 1e-12` },
          { name: "spec", code: `assert abs(specialisation([[6, 2, 0], [1, 1, 6]]) - 0.5689626905) < 1e-9 and abs(specialisation([[5, 0], [0, 5]]) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "mi",
      rung: "stretch",
      prompt: (
        <p>
          Two languages are routed among three experts with counts (30, 10, 0) for the first and (0, 10, 30) for the second. What
          is the mutual information between language and expert, in bits? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The mixture-of-experts chapter is complete. The next chapter steps back from the architecture to the laws that decide
        how big it should be, starting with how to fit a power law to training runs without fooling yourself.
      </p>
    </>
  ),
};
