import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ThesisPlanViz } from "@/components/viz/ThesisPlanViz";
import type { LessonContent } from "@/lib/types";

const BUDGET = `def train_flops(params, tokens):
    return 6 * params * tokens                             # 2 for the forward pass, 4 for the backward

def gpu_hours(flops, peak, mfu):
    return flops / (peak * mfu) / 3600                     # mfu: share of peak throughput actually achieved

def plan_hours(runs, peak, mfu):
    return sum(gpu_hours(train_flops(n, d) * seeds, peak, mfu) for n, d, seeds in runs)`;

const PLAN = `def earliest_finish(tasks):
    done = {}
    def finish(t):
        if t not in done:
            weeks, deps = tasks[t]
            done[t] = weeks + max((finish(d) for d in deps), default=0)
        return done[t]
    return {t: finish(t) for t in tasks}

def project_length(tasks):
    return max(earliest_finish(tasks).values())

def critical_path(tasks):
    f = earliest_finish(tasks)
    t = max(tasks, key=lambda x: f[x])                     # the task that finishes last
    path = [t]
    while tasks[t][1]:
        t = max(tasks[t][1], key=lambda d: f[d])           # the dependency that held it up
        path.append(t)
    return path[::-1]`;

export const lesson: LessonContent = {
  id: "l15.4.1",
  minutes: 50,
  links: {
    requires: ["l15.2.1", "l8.4.3"],
    revisits: ["l15.2.2", "l15.1.3"],
    foreshadows: ["l15.4.2", "l15.4.3"],
  },

  puzzle: (
    <>
      <p>
        The thesis of this course has four parts: a proposal, a reproduction of a published result, an extension with one
        new idea, and a paper defended against hard questions. The proposal comes first and is the easiest to get wrong,
        because it is written when you know least. How do you write a plan that is specific enough to be tested, and how
        do you know it fits in the time and compute you have?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A proposal is a contract with yourself. It names one question, the paper whose result you will reproduce as a
        foundation, the single new idea you will test, and the result that would count as success or failure, decided
        before any experiment. It then checks feasibility in two currencies: compute, which can be estimated from the
        size of the models and data, and time, which depends on which tasks wait for which. The longest chain of
        dependent tasks sets the length of the project, so that is the chain to plan around.
      </p>
      <ThesisPlanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="what the proposal contains">
        <p>
          A good proposal answers Heilmeier&apos;s questions from l15.2.1 in a page or two. It states the research
          question; places it on the map of the subfield from l15.1.3; names the paper to reproduce and the number that
          will count as reproduced, with its margin; describes the one new idea and why it might work; lists the
          experiments, each with the outcome that would support or refute the idea; identifies the riskiest assumption
          and the cheap pilot that tests it first, as in l15.2.2; and gives a compute budget and a timeline with a
          fallback if the idea fails, such as a careful negative result.
        </p>
      </Definition>

      <Theorem title="estimating training compute">
        <p>
          Training a dense transformer with N parameters on D tokens takes about 6ND floating-point operations{" "}
          (<C>train_flops</C>). On hardware with peak throughput P operations per second, of which a fraction u (the model
          FLOPs utilisation) is achieved, this takes <M>{"6ND/(Pu)"}</M> seconds (<C>gpu_hours</C>), and a plan is the sum
          over its runs and seeds (<C>plan_hours</C>).
        </p>
        <Code>{BUDGET}</Code>
      </Theorem>
      <Proof>
        <p>
          Almost all the work is matrix multiplication by the weights. In the forward pass each parameter takes part in
          one multiply and one add per token, 2N operations per token. The backward pass computes gradients with respect
          to both the activations and the weights, two matrix products of the same size for each forward one, so about
          4N. The total over D tokens is 6ND. Attention adds a term that grows with context length, small for short
          contexts, and l8.4.3 used the same count to find compute-optimal sizes. Dividing by the achieved rate Pu gives
          the time; u is typically between 0.3 and 0.6 for well-tuned training.
        </p>
      </Proof>

      <Theorem title="the critical path sets the length">
        <p>
          Give each task a duration and a set of tasks it must wait for, with no cycles. The earliest finish of a task
          is its duration plus the latest earliest finish among its dependencies (<C>earliest_finish</C>); the project
          length is the largest earliest finish (<C>project_length</C>), and it equals the total duration of the longest
          chain of dependent tasks, found by walking back from the last task through the dependency that finished latest
          (<C>critical_path</C>).
        </p>
        <Code>{PLAN}</Code>
      </Theorem>
      <Proof>
        <p>
          The recursion is well defined because the dependencies form a directed acyclic graph, so memoised evaluation
          terminates. By induction along a topological order, a task cannot finish before its dependencies, so its finish
          is at least the recursion&apos;s value, and starting each task as soon as its dependencies end achieves that
          value. Unrolling the maximum from the last task back to a task with no dependencies gives a chain whose
          durations sum to the project length, and every chain&apos;s sum is at most that length, so this chain is the
          longest. Shortening a task not on it leaves the length unchanged until another chain becomes longest, which
          is what the viz shows.
        </p>
      </Proof>

      <Example title="a feasible plan">
        <p>
          Reproducing a 125-million-parameter model trained on 2.5 billion tokens, three seeds, on a GPU with a peak of
          65 teraflops at 40% utilisation, takes about three times the single-run time. If the budget allows only one
          full-size seed, the proposal should say so and plan smaller-scale runs with more seeds for the comparisons where
          seed noise matters, following l15.1.1.
        </p>
      </Example>

      <Remark title="writing it">
        <p>
          Keep the proposal short enough to reread every week. Write the success criteria as numbers. Show the draft to
          Parton and ask it to answer Heilmeier&apos;s questions about it as a sceptical reviewer would; any question it
          cannot answer from the text is a gap. Expect to revise the plan after the pilot, but record the revision and
          its reason, so the final paper can say honestly what was planned and what changed.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hours",
      rung: "check",
      prompt: (
        <p>
          How many GPU-hours does one training run of a 125-million-parameter model on 2.5 billion tokens take, on a GPU
          with a peak of <M>{"6.5 \\times 10^{13}"}</M> operations per second at 40% utilisation? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 20.03, tolerance: 0.01 },
    },
    {
      key: "path",
      rung: "check",
      prompt: (
        <p>
          A plan has tasks read (2 weeks), reproduce (4, after read), pilot (2, after read), extend (6, after reproduce and
          pilot), write (3, after extend) and figures (1, after extend). How many weeks does it take at the earliest?
        </p>
      ),
      answer: { kind: "numeric", value: 15, tolerance: 0.001 },
    },
    {
      key: "criteria",
      rung: "apply",
      prompt: <p>Why should the proposal state the success criteria before any experiment is run?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that results cannot be reinterpreted afterwards as success, and so that pilots can be judged by whether they change a decision",
          "Because reviewers require a fixed number of experiments",
          "Because criteria stated later are always too strict",
          "So that the compute budget can be ignored",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def train_flops(params, tokens):
    return 6 * params * tokens                             # 2 for the forward pass, 4 for the backward

def gpu_hours(flops, peak, mfu):
    return flops / (peak * mfu) / 3600                     # mfu: share of peak throughput actually achieved

def plan_hours(runs, peak, mfu):
    return sum(gpu_hours(train_flops(n, d) * seeds, peak, mfu) for n, d, seeds in runs)

print(train_flops(10, 100), round(gpu_hours(3.6e15, 1e12, 0.5), 3))
print(round(plan_hours([(1e6, 1e8, 3), (2e6, 1e8, 1)], 1e12, 0.5), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["6000 2.0\n1.667", "6000 1.0\n1.667", "1000 2.0\n0.833", "6000 2.0\n2.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def earliest_finish(tasks):
    done = {}
    def finish(t):
        if t not in done:
            weeks, deps = tasks[t]
            done[t] = weeks + max((finish(d) for d in deps), default=0)
        return done[t]
    return {t: finish(t) for t in tasks}

def project_length(tasks):
    return max(earliest_finish(tasks).values())

def critical_path(tasks):
    f = earliest_finish(tasks)
    t = max(tasks, key=lambda x: f[x])                     # the task that finishes last
    path = [t]
    while tasks[t][1]:
        t = max(tasks[t][1], key=lambda d: f[d])           # the dependency that held it up
        path.append(t)
    return path[::-1]

tasks = {"read": (2, []), "repro": (4, ["read"]), "pilot": (1, ["read"]), "ext": (3, ["repro", "pilot"]), "fig": (1, ["pilot"])}
print(earliest_finish(tasks), project_length(tasks), critical_path(tasks))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'read': 2, 'repro': 6, 'pilot': 3, 'ext': 9, 'fig': 4} 9 ['read', 'repro', 'ext']",
          "{'read': 2, 'repro': 6, 'pilot': 3, 'ext': 9, 'fig': 4} 11 ['read', 'repro', 'pilot', 'ext']",
          "{'read': 2, 'repro': 4, 'pilot': 1, 'ext': 3, 'fig': 1} 9 ['read', 'repro', 'ext']",
          "{'read': 2, 'repro': 6, 'pilot': 3, 'ext': 9, 'fig': 4} 9 ['read', 'pilot', 'ext']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_flops(params, tokens)</C>, <C>gpu_hours(flops, peak, mfu)</C> and{" "}
          <C>plan_hours(runs, peak, mfu)</C> for runs given as (params, tokens, seeds).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def train_flops(params, tokens):
    return 2 * params * tokens

def gpu_hours(flops, peak, mfu):
    return flops / peak

def plan_hours(runs, peak, mfu):
    return 0.0
`,
        solution: BUDGET,
        tests: [
          { name: "flops", code: `assert train_flops(5, 7) == 210 and abs(gpu_hours(7.2e6, 1000, 0.5) - 4) < 1e-12` },
          { name: "plan", code: `assert abs(plan_hours([(10, 60, 2), (100, 30, 1)], 1, 1) - 7) < 1e-12 and plan_hours([], 1, 1) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Tasks map names to (weeks, dependencies). Write <C>earliest_finish(tasks)</C>, a dict in the order of{" "}
          <C>tasks</C>; <C>project_length(tasks)</C>; and <C>critical_path(tasks)</C>, from the first task to the last,
          walking back from the latest-finishing task through the dependency that finishes latest, taking the first in
          order on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def earliest_finish(tasks):
    return {t: w for t, (w, _) in tasks.items()}

def project_length(tasks):
    return sum(w for w, _ in tasks.values())

def critical_path(tasks):
    return list(tasks)
`,
        solution: PLAN,
        tests: [
          { name: "finish", code: `T = {"c": (1, ["a", "b"]), "a": (2, []), "b": (5, ["a"])}\nassert earliest_finish(T) == {"c": 8, "a": 2, "b": 7} and project_length(T) == 8` },
          { name: "path", code: `T = {"a": (2, []), "b": (5, ["a"]), "c": (1, ["a", "b"]), "d": (3, ["a"])}\nassert critical_path(T) == ["a", "b", "c"] and critical_path({"x": (1, []), "y": (1, [])}) == ["x"]` },
        ],
      },
    },
    {
      key: "size",
      rung: "stretch",
      prompt: (
        <p>
          With 100 GPU-hours on that GPU at 40% utilisation, and training compute-optimally on D = 20N tokens, what is
          the largest model you can train once? Give N in millions of parameters, to one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 279.3, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the plan written, the work begins where every good project begins: by reproducing the result you will
        build on. The next lesson is that reproduction.
      </p>
    </>
  ),
};
