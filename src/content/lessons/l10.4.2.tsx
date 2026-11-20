import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StepErrorViz } from "@/components/viz/StepErrorViz";
import type { LessonContent } from "@/lib/types";

const CHAIN = `import math

def chain_success(eps, n):
    return (1 - eps) ** n

def half_life(eps):
    return math.log(0.5) / math.log(1 - eps)

def with_recovery(eps, recover, n):
    return chain_success(eps * (1 - recover), n)`;

const PARTIAL = `def progress(done):
    k = 0
    for d in done:
        if not d:
            break
        k += 1
    return k / len(done)

def weighted_progress(done, weights):
    return sum(w for d, w in zip(done, weights) if d) / sum(weights)

def expected_progress(p, m):
    return sum(p ** i for i in range(1, m + 1)) / m`;

export const lesson: LessonContent = {
  id: "l10.4.2",
  minutes: 45,
  links: {
    requires: ["l10.4.1", "m7.2.4"],
    revisits: ["l10.3.1", "l10.2.3", "m7.3.2"],
    foreshadows: ["l10.4.3", "l13.4.2", "l13.3.1"],
  },

  puzzle: (
    <>
      <p>
        An agent that gets 99% of individual actions right sounds reliable. A task that needs 300 actions, each of which must go
        right, is then finished about 5% of the time. Long tasks, such as building a feature across a codebase or running an
        experiment end to end, expose small per-step error rates that short benchmarks hide. How should such tasks be evaluated, and
        what do their results reveal about where agents fail?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Success on a long task behaves like a chain: it breaks at its weakest link, and the more links, the likelier a break.
        Two things change the picture. Agents that notice and repair their mistakes break far less often than their raw error rate
        suggests. And a pass-or-fail score throws away most of what a long run reveals, so long tasks are usually scored by milestones
        as well as by final success.
      </p>
      <StepErrorViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="exponential decay and the half-life">
        <p>
          If each of n steps fails independently with probability ε and any failure ends the task, the success probability is{" "}
          <M>{"(1-\\varepsilon)^n"}</M> (<C>chain_success</C>). It halves every{" "}
          <M>{"n_{1/2} = \\ln 2 / (-\\ln(1-\\varepsilon)) \\approx 0.693/\\varepsilon"}</M> steps (<C>half_life</C>). If a fraction ρ of
          failures is caught and repaired, the effective error is <M>{"\\varepsilon(1-\\rho)"}</M> (<C>with_recovery</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Independence gives the product. Setting <M>{"(1-\\varepsilon)^n = 1/2"}</M> and taking logarithms gives the half-life; for
          small ε, <M>{"-\\ln(1-\\varepsilon) \\approx \\varepsilon"}</M>. A step now ends the task only if it fails and the failure is not
          repaired, with probability <M>{"\\varepsilon(1-\\rho)"}</M>, assuming repairs succeed and cost no further risk. Ord (2025) noted
          that agents&apos; measured success on tasks of different lengths fits such a constant-hazard decay reasonably well, which makes
          the half-life a single-number summary of an agent&apos;s reliability.
        </p>
        <Code>{CHAIN}</Code>
      </Proof>

      <Remark title="when the model is wrong">
        <p>
          Steps are not equally hard: a long task often has a few critical decisions and many routine actions. Errors are not
          independent: one misunderstanding of the goal ruins every later step, while an agent that has recovered once may be more
          careful. And per-task error rates vary, so averaging exponential curves with different rates gives a curve that decays more
          slowly than any single exponential at long lengths. Treat the half-life as a summary, not a law, and check the fit.
        </p>
      </Remark>

      <Definition title="milestones and partial credit">
        <p>
          Split a long task into ordered milestones that can each be checked. Sequential progress is the fraction completed before the
          first failure (<C>progress</C>); when milestones can be completed out of order, a weighted fraction rewards each by its
          importance (<C>weighted_progress</C>). If each milestone is passed with probability p given that the previous ones were, the
          expected sequential progress over m milestones is <M>{"\\frac1m\\sum_{i=1}^m p^i"}</M> (<C>expected_progress</C>), a smoother and
          less noisy measure than final success, which is <M>{"p^m"}</M>.
        </p>
        <Code>{PARTIAL}</Code>
      </Definition>

      <Example title="evaluating a long run">
        <p>
          Long tasks are expensive, so suites are small and noisy: a dozen tasks, each run a few times, gives wide error bars; cluster
          them by task (l10.2.3). Record the whole trajectory, not just the outcome, and classify where each failed run went wrong:
          misread goal, wrong tool use, lost track of state, gave up early, or ran out of budget. Fix limits on time, steps and tokens in
          advance, since a generous budget can turn failures into slow successes. Report reliability across repeats as well as
          average success (l10.3.1).
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "chain",
      rung: "check",
      prompt: (
        <p>
          An agent fails each step of a 50-step task independently with probability 0.02, and any failure ends the task. What is the
          chance it finishes? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.364, tolerance: 0.001 },
    },
    {
      key: "half",
      rung: "check",
      prompt: (
        <p>
          With a per-step error of 0.4%, after how many steps has the chance of finishing fallen to one half? Use the exact formula and
          give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 172.9, tolerance: 0.05 },
    },
    {
      key: "fix",
      rung: "apply",
      prompt: (
        <p>
          An agent&apos;s per-step error rate is 1%. Which change doubles its half-life?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Catching and repairing half of its errors, which halves the effective error rate",
          "Giving it twice as many steps",
          "Running each task twice and keeping the better run",
          "Splitting each task into milestones",
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

def chain_success(eps, n):
    return (1 - eps) ** n

def half_life(eps):
    return math.log(0.5) / math.log(1 - eps)

def with_recovery(eps, recover, n):
    return chain_success(eps * (1 - recover), n)

print(chain_success(0.5, 3), round(half_life(0.5), 3))
print(with_recovery(0.5, 1.0, 10), with_recovery(0.2, 0.5, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.125 1.0\n1.0 0.81",
          "0.125 2.0\n1.0 0.81",
          "0.125 1.0\n0.0 0.81",
          "0.125 1.0\n1.0 0.64",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def progress(done):
    k = 0
    for d in done:
        if not d:
            break
        k += 1
    return k / len(done)

def weighted_progress(done, weights):
    return sum(w for d, w in zip(done, weights) if d) / sum(weights)

def expected_progress(p, m):
    return sum(p ** i for i in range(1, m + 1)) / m

print(progress([True, False, True, True]), weighted_progress([True, False, True, True], [1, 1, 1, 1]))
print(expected_progress(0.5, 2), expected_progress(1.0, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 0.75\n0.375 1.0",
          "0.75 0.75\n0.375 1.0",
          "0.25 0.75\n0.25 1.0",
          "0.25 0.5\n0.375 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chain_success(eps, n)</C>, <C>half_life(eps)</C> with the exact logarithm, and{" "}
          <C>with_recovery(eps, recover, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def chain_success(eps, n):
    return 1 - eps * n

def half_life(eps):
    return 0.5 / eps

def with_recovery(eps, recover, n):
    return chain_success(eps, n)
`,
        solution: CHAIN,
        tests: [
          { name: "chain", code: `assert abs(chain_success(0.1, 2) - 0.81) < 1e-12 and abs(half_life(0.01) - 68.9675639) < 1e-6` },
          { name: "recover", code: `assert abs(with_recovery(0.01, 0.9, 100) - 0.9047921471) < 1e-9 and with_recovery(0.3, 1.0, 50) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>progress(done)</C>, the fraction of milestones completed before the first failure, <C>weighted_progress(done,
          weights)</C>, and <C>expected_progress(p, m)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def progress(done):
    return sum(done) / len(done)

def weighted_progress(done, weights):
    return sum(done) / len(done)

def expected_progress(p, m):
    return p ** m
`,
        solution: PARTIAL,
        tests: [
          { name: "progress", code: `assert progress([False, True]) == 0.0 and progress([True, True, False, True]) == 0.5 and abs(weighted_progress([True, False, True], [3, 1, 1]) - 0.8) < 1e-12` },
          { name: "expected", code: `assert abs(expected_progress(0.8, 3) - 0.6506666667) < 1e-9 and expected_progress(1.0, 3) == 1.0` },
        ],
      },
    },
    {
      key: "miles",
      rung: "stretch",
      prompt: (
        <p>
          A task has 5 sequential milestones, each passed with probability 0.9 given the previous ones. What is the expected fraction of
          milestones completed before the first failure? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.737, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The half-life measures length in steps, which differ between tasks. The next lesson measures it in something comparable across
        all tasks, the time a skilled human needs, and tracks how that horizon has grown.
      </p>
    </>
  ),
};
