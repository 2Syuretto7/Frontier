import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LoadImbalanceViz } from "@/components/viz/LoadImbalanceViz";
import type { LessonContent } from "@/lib/types";

const PLACE = `def rank_loads(expert_counts, placement, R):
    loads = [0] * R
    for e, c in enumerate(expert_counts):
        loads[placement[e]] += c
    return loads

def lpt_place(loads, R, per_rank):
    placement, total, slots = [None] * len(loads), [0] * R, [per_rank] * R
    for e in sorted(range(len(loads)), key=lambda e: -loads[e]):   # heaviest expert first
        r = min((x for x in range(R) if slots[x]), key=lambda x: total[x])
        placement[e], total[r], slots[r] = r, total[r] + loads[e], slots[r] - 1
    return placement

def replicate(loads, extra):
    copies = [1] * len(loads)
    for _ in range(extra):                          # one more replica for the hottest per-replica load
        e = max(range(len(loads)), key=lambda e: loads[e] / copies[e])
        copies[e] += 1
    return [loads[e] / copies[e] for e in range(len(loads)) for _ in range(copies[e])]`;

const WAIT = `import math

def imbalance(loads):
    return max(loads) / (sum(loads) / len(loads))

def expected_max_load(T, k, R):
    mean, var = T * k / R, T * k * (1 / R) * (1 - 1 / R)   # slots per rank under uniform routing
    return mean + math.sqrt(2 * math.log(R) * var)          # normal approximation to the largest of R

def moe_step_time(loads, per_slot):
    return max(loads) * per_slot                    # every rank waits for the busiest`;

export const lesson: LessonContent = {
  id: "e10.6.2",
  minutes: 45,
  links: {
    requires: ["e10.6.1", "l8.3.2"],
    revisits: ["l8.3.3", "e10.4.3"],
    foreshadows: ["e10.7.1", "e10.8.3"],
  },

  puzzle: (
    <>
      <p>
        A mixture-of-experts model trains with an auxiliary balancing loss, and averaged over a day every expert receives almost the
        same share of tokens. Yet profiles show expert-parallel ranks idle for a fifth of each MoE layer. Where does the imbalance come
        from when the averages are equal, and what can the system do that the loss cannot?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every rank waits at the combine all-to-all for the busiest rank, so a layer&apos;s time is set by the maximum load, not the
        mean. Balanced averages still leave per-batch fluctuations, and the maximum of many fluctuating counts sits above their mean.
        Popular experts that happen to share a rank add up. The system can choose which experts share a rank, and can copy the hottest
        experts to several ranks to split their load.
      </p>
      <LoadImbalanceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="loads and placement">
        <p>
          An expert&apos;s load is the number of token slots routed to it in a step; a rank&apos;s load is the sum over the experts it
          holds (<C>rank_loads</C>). The imbalance is the maximum rank load over the mean (<C>imbalance</C>), and the MoE layer takes
          time proportional to the maximum (<C>moe_step_time</C>). A placement assigns experts to ranks, a fixed number each.
        </p>
      </Definition>

      <Theorem title="random routing is not balanced">
        <p>
          With T tokens routed top-k uniformly over R ranks, each rank receives on average <M>{"\\mu = Tk/R"}</M> slots with
          variance about <M>{"\\sigma^2 = Tk\\,\\frac1R(1 - \\frac1R)"}</M>, and the busiest of R ranks is approximately
        </p>
        <MD>{"\\mu + \\sigma\\sqrt{2\\ln R}."}</MD>
        <p>
          The relative excess <M>{"\\sigma\\sqrt{2 \\ln R}/\\mu"}</M> shrinks like <M>{"1/\\sqrt{Tk}"}</M>: small batches per step are
          the least balanced.
        </p>
      </Theorem>
      <Proof>
        <p>
          Treating the slots as independent, a rank&apos;s count is binomial with Tk trials and probability 1/R, so the mean and
          variance follow. For large Tk the counts are nearly normal, and the largest of R roughly independent normals lies about{" "}
          <M>{"\\sqrt{2\\ln R}"}</M> standard deviations above the mean (<C>expected_max_load</C>). Since{" "}
          <M>{"\\sigma/\\mu \\approx \\sqrt{R/(Tk)}"}</M>, the excess falls as the batch grows.
        </p>
        <Code>{WAIT}</Code>
      </Proof>

      <Definition title="placement and replication">
        <p>
          Given measured loads, placing experts heaviest first, each on the least-loaded rank with a free slot, evens the totals (
          <C>lpt_place</C>). Replicating an expert puts copies on several ranks and splits its tokens among them; spare slots go one
          at a time to the expert with the highest load per copy (<C>replicate</C>). Systems re-plan both every few hundred steps from
          recent statistics.
        </p>
        <Code>{PLACE}</Code>
      </Definition>

      <Theorem title="heaviest first is within a third of the best">
        <p>
          Without the fixed number of experts per rank, the heaviest-first rule gives a maximum rank load at most{" "}
          <M>{"\\tfrac43 - \\tfrac{1}{3R}"}</M> times the smallest achievable.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is Graham&apos;s bound for longest-processing-time scheduling. Let ℓ be the load of the last expert placed on the
          busiest rank; experts placed after it can be dropped without changing that rank or lowering OPT. When it was placed its rank
          was the least loaded, so it started from at most <M>{"(S - \\ell)/R"}</M> for total load S, and{" "}
          <M>{"S/R \\le \\text{OPT}"}</M> gives a maximum of at most <M>{"\\text{OPT} + \\ell(1 - 1/R)"}</M>. If{" "}
          <M>{"\\ell \\le \\text{OPT}/3"}</M> this is the bound. Otherwise every remaining expert exceeds OPT/3, so an optimal
          placement puts at most two on each rank, and for such instances heaviest-first pairs the largest with the smallest and is
          optimal.
        </p>
      </Proof>

      <Remark title="the loss and the system">
        <p>
          The balancing losses and bias updates of l8.3.2 act on averages over many steps and must not distort routing too much, so
          per-step fluctuations and slow drifts remain. Capacity limits (l8.3.3) cap the busiest expert by dropping tokens, which
          bounds the wait but changes the model&apos;s computation. Placement and replication change only where experts run, so they
          leave the mathematics untouched. Replication costs memory for the extra copies and an all-reduce of their gradients.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Equal daily averages do not mean equal loads in each step: fluctuations lift the busiest rank above the mean by about{" "}
          <M>{"\\sqrt{2\\ln R}"}</M> standard deviations, and popular experts that share a rank add up. The layer runs at the pace of
          the maximum. Larger batches per step, heaviest-first placement and replicating the hottest experts bring the maximum down
          without touching the model.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "lpt",
      rung: "check",
      prompt: (
        <p>
          Eight experts have loads 9, 7, 6, 5, 4, 3, 2 and 2, to be placed two per rank on four ranks heaviest first. What is the
          busiest rank&apos;s load?
        </p>
      ),
      answer: { kind: "numeric", value: 11, tolerance: 0 },
    },
    {
      key: "maxload",
      rung: "check",
      prompt: (
        <p>
          A step routes 65,536 tokens top-8 uniformly over 64 ranks. Using the normal approximation, how many slots does the busiest
          rank receive? Round to the nearest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 8451, tolerance: 1 },
    },
    {
      key: "small",
      rung: "apply",
      prompt: <p>Why do small per-step batches make expert-parallel layers less balanced?</p>,
      answer: {
        kind: "choice",
        options: [
          "The relative fluctuation of each rank's count grows like one over the square root of the slots routed",
          "Small batches use more experts per token",
          "The balancing loss is switched off for small batches",
          "Small batches need more all-to-all calls",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rank_loads(expert_counts, placement, R):
    loads = [0] * R
    for e, c in enumerate(expert_counts):
        loads[placement[e]] += c
    return loads

def lpt_place(loads, R, per_rank):
    placement, total, slots = [None] * len(loads), [0] * R, [per_rank] * R
    for e in sorted(range(len(loads)), key=lambda e: -loads[e]):   # heaviest expert first
        r = min((x for x in range(R) if slots[x]), key=lambda x: total[x])
        placement[e], total[r], slots[r] = r, total[r] + loads[e], slots[r] - 1
    return placement

def replicate(loads, extra):
    copies = [1] * len(loads)
    for _ in range(extra):                          # one more replica for the hottest per-replica load
        e = max(range(len(loads)), key=lambda e: loads[e] / copies[e])
        copies[e] += 1
    return [loads[e] / copies[e] for e in range(len(loads)) for _ in range(copies[e])]

p = lpt_place([5, 1, 2, 4], 2, 2)
print(rank_loads([5, 1, 2, 4], [0, 1, 1, 0], 2), p, replicate([6, 2, 2], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[9, 3] [0, 0, 1, 1] [3.0, 3.0, 2.0, 2.0]",
          "[9, 3] [0, 1, 1, 0] [3.0, 3.0, 2.0, 2.0]",
          "[6, 6] [0, 0, 1, 1] [3.0, 3.0, 2.0, 2.0]",
          "[9, 3] [0, 0, 1, 1] [6.0, 2.0, 2.0]",
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

def imbalance(loads):
    return max(loads) / (sum(loads) / len(loads))

def expected_max_load(T, k, R):
    mean, var = T * k / R, T * k * (1 / R) * (1 - 1 / R)   # slots per rank under uniform routing
    return mean + math.sqrt(2 * math.log(R) * var)          # normal approximation to the largest of R

def moe_step_time(loads, per_slot):
    return max(loads) * per_slot                    # every rank waits for the busiest

x = imbalance([6, 2, 4, 4])
print(x, round(expected_max_load(1000, 2, 4), 2), moe_step_time([6, 2, 4, 4], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.5 532.24 3.0", "1.5 532.24 2.0", "1.5 500.0 3.0", "3.0 532.24 3.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rank_loads(expert_counts, placement, R)</C>; <C>lpt_place(loads, R, per_rank)</C>, placing experts heaviest first
          (lower index on ties) on the least-loaded rank with room (lower rank on ties); and <C>replicate(loads, extra)</C>, returning
          each copy&apos;s load, copies of an expert adjacent and in expert order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rank_loads(expert_counts, placement, R):
    return [0] * R

def lpt_place(loads, R, per_rank):
    return [e % R for e in range(len(loads))]

def replicate(loads, extra):
    return [float(x) for x in loads]
`,
        solution: PLACE,
        tests: [
          { name: "place", code: `assert rank_loads([1, 2, 3, 4], [1, 1, 0, 0], 2) == [7, 3]\nassert lpt_place([4, 4, 3, 3], 2, 2) == [0, 1, 0, 1] and lpt_place([10, 1, 1, 1, 1, 6], 3, 2) == [0, 2, 2, 1, 0, 1]` },
          { name: "replicate", code: `assert replicate([9, 3], 2) == [3.0, 3.0, 3.0, 3.0] and replicate([4, 4], 1) == [2.0, 2.0, 4.0] and replicate([1], 0) == [1.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>imbalance(loads)</C>, the maximum over the mean; <C>expected_max_load(T, k, R)</C> by the normal approximation; and{" "}
          <C>moe_step_time(loads, per_slot)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def imbalance(loads):
    return 1.0

def expected_max_load(T, k, R):
    return T * k / R

def moe_step_time(loads, per_slot):
    return 0.0
`,
        solution: WAIT,
        tests: [
          { name: "imbalance", code: `assert imbalance([3, 1]) == 1.5 and moe_step_time([2, 5], 2.0) == 10.0` },
          { name: "expected", code: `import math\nassert abs(expected_max_load(800, 1, 2) - (400 + math.sqrt(2 * math.log(2) * 200))) < 1e-9` },
        ],
      },
    },
    {
      key: "hot",
      rung: "stretch",
      prompt: (
        <p>
          Eight experts have loads 40, 10, 10, 10, 10, 10, 5 and 5. Two spare slots allow two extra copies, assigned one at a time to
          the expert with the highest load per copy. What is the largest load of any copy afterwards? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 13.333, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Data, tensor, sequence, context, pipeline and expert parallelism each split a different dimension. The next section combines
        them on one cluster and asks how many GPUs each dimension should get.
      </p>
    </>
  ),
};
