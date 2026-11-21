import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RunBudgetViz } from "@/components/viz/RunBudgetViz";
import type { LessonContent } from "@/lib/types";

const TIME = `import math

def train_days(params, tokens, gpus, peak, mfu, goodput):
    rate = gpus * peak * mfu * goodput                     # useful FLOP/s across the cluster
    return 6 * params * tokens / rate / 86400

def gpus_needed(params, tokens, days, peak, mfu, goodput):
    return math.ceil(6 * params * tokens / (days * 86400 * peak * mfu * goodput))

def chinchilla_split(flops):
    n = math.sqrt(flops / 120)                             # C = 6 N D with D = 20 N
    return round(n), round(20 * n)`;

const OVERHEAD = `def total_hours(main, ablate, evals, waste):
    return main * (1 + ablate + evals) / (1 - waste)       # every useful hour needs its share of overheads

def max_main(budget, ablate, evals, waste):
    return budget * (1 - waste) / (1 + ablate + evals)

def waste_fraction(mtbf, restart, interval, ckpt_cost):
    return ckpt_cost / interval + (restart + interval / 2) / mtbf   # checkpoint time plus work lost per failure`;

export const lesson: LessonContent = {
  id: "e13.1.1",
  minutes: 45,
  links: {
    requires: ["e10.1.2", "l8.4.3"],
    revisits: ["e10.8.2", "e11.6.3"],
    foreshadows: ["e13.1.2", "e13.1.3"],
  },

  puzzle: (
    <>
      <p>
        A lab is given two million GPU-hours for its next model. The scaling laws of l8.4.3 say how to split a compute
        budget between parameters and tokens, but that budget is not two million GPU-hours of pure training: some goes
        to ablations that decide the recipe, some to evaluation, and some is lost to failures and restarts. How big a
        model can the lab actually train, and how many days will the run take?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Planning a large run starts with arithmetic. Training takes about 6ND operations; the cluster delivers its peak
        rate times the model FLOPs utilisation times the goodput, the share of wall-clock time spent making progress
        rather than restarting or checkpointing. The budget itself is shared between the main run and the work around it,
        and every overhead shrinks the model that fits. Doing this arithmetic first turns a vague ambition into a plan
        with a size, a token count, a cluster size and a date.
      </p>
      <RunBudgetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the quantities in a plan">
        <p>
          A run trains N parameters on D tokens, about 6ND operations as in e10.1.2. G GPUs with peak P operations per
          second achieve a fraction u of peak while running (MFU) and spend a fraction g of wall-clock time on useful
          progress (goodput), losing the rest to failures, restarts and checkpointing. The wall-clock time is{" "}
          <M>{"6ND/(GPug)"}</M> (<C>train_days</C>), so a deadline fixes the GPUs needed (<C>gpus_needed</C>). Under the
          compute-optimal rule D = 20N, a compute budget C gives <M>{"N = \\sqrt{C/120}"}</M> (<C>chinchilla_split</C>).
        </p>
        <Code>{TIME}</Code>
      </Definition>

      <Theorem title="the compute-optimal split">
        <p>
          If C = 6ND and D = 20N, then <M>{"N = \\sqrt{C/120}"}</M> and <M>{"D = 20\\sqrt{C/120}"}</M>. Doubling the
          budget multiplies both by <M>{"\\sqrt2"}</M>, and an overhead that removes a fraction x of the training compute
          shrinks the model by a factor <M>{"\\sqrt{1 - x}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substituting D = 20N gives <M>{"C = 120N^2"}</M>, so <M>{"N = \\sqrt{C/120}"}</M> and D follows. Both scale as{" "}
          <M>{"\\sqrt C"}</M>, so multiplying C by a factor multiplies N and D by its square root. The ratio 20 is the
          Chinchilla estimate; l8.4.4 showed why models meant for heavy inference are often trained on many more tokens
          than this, which shrinks N for the same C.
        </p>
      </Proof>

      <Theorem title="overheads come out of the main run">
        <p>
          If ablations cost a fraction a of the main run, evaluation a fraction e, and a fraction w of all GPU-hours is
          wasted by failures, then a main run of M hours needs <M>{"M(1 + a + e)/(1 - w)"}</M> in total{" "}
          (<C>total_hours</C>), so a budget B allows a main run of
        </p>
        <MD>{"M = \\frac{B(1 - w)}{1 + a + e}"}</MD>
        <p>
          (<C>max_main</C>). With failures every <M>{"T_f"}</M> hours, restarts taking r hours, checkpoints every τ hours
          costing c hours, the waste is about <M>{"c/\\tau + (r + \\tau/2)/T_f"}</M> (<C>waste_fraction</C>), the
          quantity e10.8.2 minimised to find the Young–Daly interval.
        </p>
        <Code>{OVERHEAD}</Code>
      </Theorem>
      <Proof>
        <p>
          Useful hours are M(1 + a + e), and they are the fraction 1 − w of all hours spent, which gives the total;
          solving for M gives the second formula. For the waste, a checkpoint every τ hours costs c, a fraction{" "}
          <M>{"c/\\tau"}</M> of time. Each failure costs the restart time plus the work since the last checkpoint, on
          average <M>{"\\tau/2"}</M>, and failures occur at rate <M>{"1/T_f"}</M> per hour, adding{" "}
          <M>{"(r + \\tau/2)/T_f"}</M>. This first-order estimate ignores failures during restarts, which matter only when
          failures are frequent relative to r.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          With ablations at a quarter of the main run, evaluation at a tenth, and 8% of all hours lost, two million
          GPU-hours leave well under one and a half million for the main run. At 40% utilisation on GPUs with a peak of 989 teraflops,
          that is enough for a compute-optimal model of well over a hundred billion parameters, but only if the
          failure rate assumed in the waste estimate holds, which the next lessons make it possible to check.
        </p>
      </Example>

      <Remark title="what to write in the plan">
        <p>
          Write the plan as a table: N, D, the GPU type and count, the assumed MFU and goodput with their sources, the
          expected days, and the budgets for ablations and evaluation. Measure MFU and goodput on a short proxy run before
          committing (e13.1.3), and track them during the run, since a 10% fall in either costs as much as a 10% cut in the
          budget. The ablation budget is where the small-scale data and architecture experiments of e11.6.3 and l8.2.4
          come from.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "days",
      rung: "check",
      prompt: (
        <p>
          How many days does a 70-billion-parameter model take to train on 2 trillion tokens with 512 GPUs, each with a
          peak of <M>{"9.89 \\times 10^{14}"}</M> operations per second, at 40% MFU and 90% goodput? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 53.33, tolerance: 0.01 },
    },
    {
      key: "main",
      rung: "check",
      prompt: (
        <p>
          A budget of 2,000,000 GPU-hours must cover ablations at 25% of the main run and evaluation at 10%, and 8% of all
          hours are lost to failures. How many GPU-hours can the main run use? Give the nearest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 1362963, tolerance: 1 },
    },
    {
      key: "goodput",
      rung: "apply",
      prompt: <p>What does goodput measure?</p>,
      answer: {
        kind: "choice",
        options: [
          "The share of wall-clock time the run spends making training progress, after restarts, lost work and checkpointing",
          "The share of peak FLOP/s achieved while the run is computing",
          "The fraction of tokens that pass the data filters",
          "The share of GPUs in the cluster that are available",
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

def train_days(params, tokens, gpus, peak, mfu, goodput):
    rate = gpus * peak * mfu * goodput                     # useful FLOP/s across the cluster
    return 6 * params * tokens / rate / 86400

def gpus_needed(params, tokens, days, peak, mfu, goodput):
    return math.ceil(6 * params * tokens / (days * 86400 * peak * mfu * goodput))

def chinchilla_split(flops):
    n = math.sqrt(flops / 120)                             # C = 6 N D with D = 20 N
    return round(n), round(20 * n)

print(round(train_days(1e9, 2e10, 8, 1e14, 0.5, 1.0), 4), gpus_needed(1e9, 2e10, 1, 1e14, 0.5, 1.0))
print(chinchilla_split(1.2e20))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.4722 28\n(1000000000, 20000000000)",
          "3.4722 27\n(1000000000, 20000000000)",
          "1.7361 28\n(1000000000, 20000000000)",
          "3.4722 28\n(10000000000, 200000000000)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def total_hours(main, ablate, evals, waste):
    return main * (1 + ablate + evals) / (1 - waste)       # every useful hour needs its share of overheads

def max_main(budget, ablate, evals, waste):
    return budget * (1 - waste) / (1 + ablate + evals)

def waste_fraction(mtbf, restart, interval, ckpt_cost):
    return ckpt_cost / interval + (restart + interval / 2) / mtbf   # checkpoint time plus work lost per failure

print(total_hours(100, 0.2, 0.1, 0.5), max_main(260, 0.2, 0.1, 0.5))
print(round(waste_fraction(100, 1, 2, 0.1), 4), round(max_main(1000, 0, 0, 0.2), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["260.0 100.0\n0.07 800.0", "65.0 100.0\n0.07 800.0", "260.0 100.0\n0.06 800.0", "260.0 50.0\n0.07 1250.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_days(params, tokens, gpus, peak, mfu, goodput)</C>,{" "}
          <C>gpus_needed(params, tokens, days, peak, mfu, goodput)</C>, rounded up, and <C>chinchilla_split(flops)</C>,
          returning N and D = 20N rounded to integers.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def train_days(params, tokens, gpus, peak, mfu, goodput):
    return params * tokens / (gpus * peak)

def gpus_needed(params, tokens, days, peak, mfu, goodput):
    return 1

def chinchilla_split(flops):
    return 0, 0
`,
        solution: TIME,
        tests: [
          { name: "days", code: `assert abs(train_days(1, 86400, 1, 6, 1, 1) - 1) < 1e-12 and abs(train_days(1, 86400, 2, 6, 0.5, 0.5) - 2) < 1e-12 and gpus_needed(1, 86400, 1, 6, 1, 1) == 1 and gpus_needed(10, 86400, 3, 6, 1, 1) == 4` },
          { name: "split", code: `assert chinchilla_split(120) == (1, 20) and chinchilla_split(4.8e21) == (6324555320, 126491106407)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>total_hours(main, ablate, evals, waste)</C>, <C>max_main(budget, ablate, evals, waste)</C> and{" "}
          <C>waste_fraction(mtbf, restart, interval, ckpt_cost)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def total_hours(main, ablate, evals, waste):
    return main + ablate + evals + waste

def max_main(budget, ablate, evals, waste):
    return budget

def waste_fraction(mtbf, restart, interval, ckpt_cost):
    return 0.0
`,
        solution: OVERHEAD,
        tests: [
          { name: "total", code: `assert abs(total_hours(10, 0.5, 0.5, 0.5) - 40) < 1e-12 and abs(max_main(40, 0.5, 0.5, 0.5) - 10) < 1e-12` },
          { name: "waste", code: `assert abs(waste_fraction(50, 2, 6, 0.3) - 0.15) < 1e-12 and abs(waste_fraction(1e9, 0, 4, 1) - 0.25) < 1e-6` },
        ],
      },
    },
    {
      key: "size",
      rung: "stretch",
      prompt: (
        <p>
          A main run of 1,000,000 GPU-hours runs at 40% MFU on GPUs with a peak of{" "}
          <M>{"9.89 \\times 10^{14}"}</M>, with D = 20N, how many parameters can the model have? Give the answer in
          billions, to two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 108.94, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        The plan assumed a utilisation, and utilisation depends on how the GPUs are connected. The next lesson looks at
        clusters and their topology: which links are fast, which are slow, and how that decides where each kind of
        parallelism runs.
      </p>
    </>
  ),
};
