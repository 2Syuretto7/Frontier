import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WaferYieldViz } from "@/components/viz/WaferYieldViz";
import type { LessonContent } from "@/lib/types";

const SIZING = `import math

def chips_to_fit(model_bytes, mem_per_chip, overhead=1.0):
    return math.ceil(model_bytes * overhead / mem_per_chip)

def decode_rate(model_bytes, bandwidth, chips=1):
    return chips * bandwidth / model_bytes

def chips_needed(model_bytes, mem_per_chip, bandwidth, target_rate):
    for_rate = math.ceil(target_rate * model_bytes / bandwidth)
    return max(chips_to_fit(model_bytes, mem_per_chip), for_rate)`;

const YIELD = `import math

def die_yield(area, defect_density):
    return math.exp(-area * defect_density)

def good_dies(wafer_area, die_area, defect_density):
    return int(wafer_area // die_area) * die_yield(die_area, defect_density)

def spare_yield(cores, spares, p_bad):
    return sum(math.comb(cores, j) * p_bad ** j * (1 - p_bad) ** (cores - j) for j in range(spares + 1))`;

export const lesson: LessonContent = {
  id: "e7.5.2",
  minutes: 50,
  links: {
    requires: ["e7.5.1"],
    revisits: ["e7.4.2", "e7.1.1"],
    foreshadows: ["e7.5.3", "e7.6.3"],
  },

  puzzle: (
    <>
      <p>
        One company sells a chip with no external memory at all, only a few hundred megabytes of on-chip SRAM, and serves
        large language models from racks of hundreds of them. Another builds a single chip the size of an entire silicon
        wafer, although every wafer has dozens of defects and a normal chip of that size would essentially never work.
        Both designs are attacks on the same bottleneck. Which one, and what does each trade away?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The bottleneck is memory bandwidth: generating text reads every weight for every token, and HBM delivers a few
        terabytes per second. On-chip SRAM is tens of times faster but holds far less per square millimetre, so a design
        that keeps weights in SRAM needs many chips, or one enormous one. Many chips need fast links between them. One
        enormous chip needs a way to survive the defects that a large area is certain to contain.
      </p>
      <WaferYieldViz />
    </>
  ),

  theory: (
    <>
      <Definition title="where the weights live">
        <p>
          Accelerators differ most in their memory. GPUs, TPUs, AMD&apos;s MI300X (192 GB of HBM at about 5.3 TB/s) and
          cloud chips such as AWS Trainium keep weights in HBM next to the die. SRAM-centred designs keep them on chip:
          Groq&apos;s LPU has about 230 MB of SRAM per chip, and Cerebras&apos;s wafer-scale engine about 44 GB spread over
          hundreds of thousands of cores, with aggregate bandwidth in the petabytes per second. Dataflow designs, such as
          SambaNova&apos;s, compile a model into a fixed pipeline of units. Each chooses a different point between capacity,
          bandwidth and flexibility.
        </p>
      </Definition>

      <Theorem title="sizing for memory-bound decoding">
        <p>
          To hold a model of W bytes on chips with memory c and serve it at r tokens per second when each token reads every
          weight once, a system with per-chip bandwidth β needs at least
        </p>
        <MD>{"\\max\\Bigl(\\Bigl\\lceil \\frac{W}{c} \\Bigr\\rceil,\\ \\Bigl\\lceil \\frac{rW}{\\beta} \\Bigr\\rceil\\Bigr)"}</MD>
        <p>chips, assuming the weights are split evenly and every chip reads its share at full bandwidth at the same time.</p>
      </Theorem>
      <Proof>
        <p>
          The chips together must store W bytes, so at least W/c of them. Each token requires W bytes to be read, so r tokens
          per second require rW bytes per second, and n chips supply at most nβ. Both bounds must hold. For a 140 GB model,
          HBM chips of 80 GB are limited by bandwidth beyond about 48 tokens per second, while 230 MB SRAM chips need 609
          chips for capacity alone and then have bandwidth to spare. Real systems fall short of the bound by the cost of
          communication between chips.
        </p>
        <Code>{SIZING}</Code>
      </Proof>

      <Theorem title="the Poisson yield model">
        <p>
          If fatal defects occur independently and uniformly at density D per unit area, a die of area A is defect-free with
          probability <M>{"e^{-DA}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Divide the die into n small cells of area A/n, each containing a defect independently with probability{" "}
          <M>{"DA/n"}</M>. The die is good if no cell has one, with probability <M>{"(1 - DA/n)^n"}</M>, which tends to{" "}
          <M>{"e^{-DA}"}</M> as n grows. The number of defects is then Poisson with mean DA. Doubling the area squares the
          yield, which is why large dies are expensive and a whole wafer at 460 cm² is hopeless without help.
        </p>
      </Proof>

      <Theorem title="redundancy">
        <p>
          A chip of n cores, each defective independently with probability p, of which s are spares, works whenever at most
          s cores are defective, with probability
        </p>
        <MD>{"\\sum_{j=0}^{s} \\binom{n}{j} p^j (1-p)^{n-j}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The number of defective cores is binomial with parameters n and p. If at most s are defective, the routing skips
          them and uses spares in their place, so the chip presents its full complement; otherwise it does not. Summing the
          binomial probabilities of 0 to s defects gives the formula. With expected defects np much smaller than s the sum
          is almost 1, which is how a wafer-scale chip with thousands of spare cores yields reliably.
        </p>
        <Code>{YIELD}</Code>
      </Proof>

      <Remark title="what each design gives up">
        <p>
          SRAM designs give up capacity: a long context&apos;s KV cache, or a large batch, may not fit, and the system must
          be sized for the largest model it serves. Wafer-scale designs give up modularity: one huge part, with its own
          packaging, power and cooling. Statically scheduled designs give up flexibility: dynamic shapes and new operators
          are harder to compile. GPUs give up peak efficiency on any one workload in exchange for running all of them, with
          the most mature software. Comparisons quoted by vendors usually pick the workload; the sizing above lets you check
          them for your own.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fit",
      rung: "check",
      prompt: <p>How many chips with 230 MB of SRAM are needed just to hold a 70-billion-parameter model stored in 8 bits?</p>,
      answer: { kind: "numeric", value: 305, tolerance: 0 },
    },
    {
      key: "yield",
      rung: "check",
      prompt: <p>With 0.2 fatal defects per cm², what is the yield of a 6 cm² die under the Poisson model? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.301, tolerance: 0.0006 },
    },
    {
      key: "wafer",
      rung: "apply",
      prompt: <p>How can a chip the size of a whole wafer work when a wafer always has dozens of defects?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is built from many small cores with spares, and routes around the cores that defects disable",
          "Wafer-scale chips are made in factories with no defects",
          "Defects only matter for chips smaller than a wafer",
          "Each defect is repaired by hand after manufacture",
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

def chips_to_fit(model_bytes, mem_per_chip, overhead=1.0):
    return math.ceil(model_bytes * overhead / mem_per_chip)

def decode_rate(model_bytes, bandwidth, chips=1):
    return chips * bandwidth / model_bytes

def chips_needed(model_bytes, mem_per_chip, bandwidth, target_rate):
    for_rate = math.ceil(target_rate * model_bytes / bandwidth)
    return max(chips_to_fit(model_bytes, mem_per_chip), for_rate)

print(chips_to_fit(140e9, 80e9), chips_to_fit(140e9, 230e6), chips_to_fit(140e9, 80e9, overhead=1.2), round(decode_rate(14e9, 3.35e12), 1))
print(decode_rate(140e9, 80e12, 609), chips_needed(140e9, 80e9, 3.35e12, 100), chips_needed(140e9, 230e6, 80e12, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 609 3 239.3\n348000.0 5 609",
          "2 609 3 239.3\n348000.0 2 609",
          "2 608 3 239.3\n348000.0 5 608",
          "1 609 2 239.3\n571.4 5 609",
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

def die_yield(area, defect_density):
    return math.exp(-area * defect_density)

def good_dies(wafer_area, die_area, defect_density):
    return int(wafer_area // die_area) * die_yield(die_area, defect_density)

def spare_yield(cores, spares, p_bad):
    return sum(math.comb(cores, j) * p_bad ** j * (1 - p_bad) ** (cores - j) for j in range(spares + 1))

print(round(die_yield(8, 0.1), 4), round(die_yield(460, 0.1), 22), round(good_dies(700, 8, 0.1), 1))
print(round(spare_yield(100, 0, 0.01), 4), round(spare_yield(100, 2, 0.01), 4), spare_yield(10, 10, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.4493 1.05e-20 39.1\n0.366 0.9206 1.0",
          "0.4493 1.05e-20 87.0\n0.366 0.9206 1.0",
          "0.9048 1.05e-20 39.1\n0.366 0.9206 1.0",
          "0.4493 1.05e-20 39.1\n0.99 0.9999 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chips_to_fit(model_bytes, mem_per_chip, overhead=1.0)</C>; <C>decode_rate(model_bytes, bandwidth, chips=1)</C>,
          the tokens per second when every token reads every weight once; and{" "}
          <C>chips_needed(model_bytes, mem_per_chip, bandwidth, target_rate)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def chips_to_fit(model_bytes, mem_per_chip, overhead=1.0):
    return 1

def decode_rate(model_bytes, bandwidth, chips=1):
    return 0.0

def chips_needed(model_bytes, mem_per_chip, bandwidth, target_rate):
    return 1
`,
        solution: SIZING,
        tests: [
          { name: "fit", code: `assert chips_to_fit(140e9, 80e9) == 2 and chips_to_fit(140e9, 230e6) == 609 and chips_to_fit(140e9, 80e9, overhead=1.2) == 3 and chips_to_fit(80e9, 80e9) == 1
assert abs(decode_rate(14e9, 3.35e12) - 3.35e12 / 14e9) < 1e-9 and decode_rate(1e9, 1e12, chips=4) == 4000.0` },
          { name: "sizing", code: `assert chips_needed(140e9, 80e9, 3.35e12, 100) == 5 and chips_needed(140e9, 230e6, 80e12, 100) == 609 and chips_needed(140e9, 80e9, 3.35e12, 40) == 2
assert chips_needed(10, 100, 10, 7) == 7 and chips_needed(1000, 1, 1e9, 1) == 1000` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>die_yield(area, defect_density)</C>; <C>good_dies(wafer_area, die_area, defect_density)</C>, the expected
          number of good dies when the wafer holds as many whole dies as fit by area; and{" "}
          <C>spare_yield(cores, spares, p_bad)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def die_yield(area, defect_density):
    return 1.0

def good_dies(wafer_area, die_area, defect_density):
    return 0.0

def spare_yield(cores, spares, p_bad):
    return 1.0
`,
        solution: YIELD,
        tests: [
          { name: "yield", code: `import math
assert abs(die_yield(8, 0.1) - math.exp(-0.8)) < 1e-12 and die_yield(0, 5) == 1.0 and abs(die_yield(6, 0.2) - math.exp(-1.2)) < 1e-12
assert abs(good_dies(700, 8, 0.1) - 87 * math.exp(-0.8)) < 1e-9 and good_dies(10, 20, 0.1) == 0` },
          { name: "spares", code: `assert abs(spare_yield(100, 0, 0.01) - 0.99 ** 100) < 1e-12 and abs(spare_yield(10, 10, 0.5) - 1.0) < 1e-12
assert abs(spare_yield(100, 2, 0.01) - (0.99 ** 100 + 100 * 0.01 * 0.99 ** 99 + 4950 * 0.01 ** 2 * 0.99 ** 98)) < 1e-12
assert abs(spare_yield(3, 1, 0.5) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "spares",
      rung: "stretch",
      prompt: (
        <p>
          A chip has 400 cores, each defective independently with probability 0.005. What is the fewest spare cores that gives
          a yield of at least 99%?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Hundreds of SRAM chips, or thousands of GPUs, only behave as one machine if they can exchange data quickly. The
        last lesson of this chapter looks at the links between chips and the cost of the collective operations that use
        them.
      </p>
    </>
  ),
};
