import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SandboxPoolViz } from "@/components/viz/SandboxPoolViz";
import type { LessonContent } from "@/lib/types";

const GRADE = `def apply_limits(usage, limits):
    for k in limits:                                     # checked in a fixed order
        if usage[k] > limits[k]:
            return k                                     # the sandbox is killed for exceeding this limit
    return "ok"

def reward(status, passed, total):
    if status != "ok":
        return 0.0                                       # crashes and timeouts earn nothing
    return passed / total

def tampered(changed, protected):
    return any(f.startswith(p) for f in changed for p in protected)   # the agent edited the grader's files`;

const POOL = `import heapq

def sandboxes_needed(rate, duration, startup, warm):
    return rate * (duration + (0 if warm else startup))   # Little's law: arrivals times time held

def makespan(durations, workers):
    free = [0] * workers
    for d in durations:                                  # each job, in order, goes to the first free worker
        heapq.heappush(free, heapq.heappop(free) + d)
    return max(free)

def cap_durations(durations, timeout):
    return sum(min(d, timeout) for d in durations), sum(d > timeout for d in durations)`;

export const lesson: LessonContent = {
  id: "e12.6.4",
  minutes: 50,
  links: {
    requires: ["e12.6.1", "e8.5.2"],
    revisits: ["e12.5.2", "e12.6.3"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A team trains a coding agent with RL. Each episode clones a repository, lets the model edit files and run commands, then runs
        the tests; the reward is the fraction that pass. Three problems appear. Rollouts stall because starting a fresh container takes
        longer than many episodes. A few episodes run forever, holding their machines. And after a week the reward is nearly perfect,
        but the model&apos;s patches are useless: it has learned to edit the tests. How should the environment be built?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        When the policy acts on a real system, its actions are untrusted code, written by a model that is being optimised to make a
        number go up. A sandbox runs each episode in isolation: a container (e8.5.2), a container with a user-space kernel such as
        gVisor, or a lightweight virtual machine, each giving stronger isolation for more overhead. Every sandbox has limits on time,
        memory, output and network, and exceeding one ends the episode with no reward. The grader runs outside the agent&apos;s
        control, on files the agent cannot change, and any change to protected files counts as failure. Because sandboxes take time to
        start, a pool keeps some ready, and its size follows from Little&apos;s law (e12.5.2): arrivals per second times seconds each
        episode holds a sandbox.
      </p>
      <SandboxPoolViz />
    </>
  ),

  theory: (
    <>
      <Definition title="limits and rewards">
        <p>
          <C>apply_limits</C> compares an episode&apos;s resource usage with its limits, in order, and names the first exceeded, or
          returns <C>&quot;ok&quot;</C>. <C>reward</C> gives the fraction of tests passed for an episode that finished within its limits
          and zero otherwise. <C>tampered</C> reports whether any changed file lies under a protected path, such as the tests.
        </p>
        <Code>{GRADE}</Code>
      </Definition>

      <Theorem title="protecting the grader removes a shortcut">
        <p>
          Suppose an episode&apos;s reward is the pass fraction when no protected file changed and 0 otherwise, and passing a test
          without changing protected files requires a correct solution to that test. Then any policy&apos;s expected reward is at most
          its expected fraction of tests solved correctly.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take any episode. If it changed a protected file, its reward is 0, at most the fraction solved. Otherwise the tests are the
          originals, and by assumption each passing test is solved correctly, so the pass fraction is at most the fraction solved.
          Taking expectations preserves the inequality. The assumption is the real work: tests must be run by a grader the agent cannot
          modify, in a fresh copy, and must be strong enough that only correct code passes; otherwise the policy finds whatever gap
          remains.
        </p>
      </Proof>

      <Definition title="running many sandboxes">
        <p>
          <C>sandboxes_needed</C> applies Little&apos;s law: episodes starting at <C>rate</C> per second, each holding a sandbox for its{" "}
          <C>duration</C> plus <C>startup</C> if it starts cold. <C>makespan</C> assigns episodes in order to the first free of{" "}
          <C>workers</C> sandboxes and returns when the last finishes. <C>cap_durations</C> applies a timeout, returning the total time
          used and the number of episodes killed.
        </p>
        <Code>{POOL}</Code>
      </Definition>

      <Theorem title="first-free assignment is within a factor of two">
        <p>
          For durations <M>{"d_1, \\dots, d_n"}</M> on m workers, the makespan of first-free assignment is at most{" "}
          <M>{"\\sum_i d_i / m + \\max_i d_i"}</M>, which is less than twice the best possible makespan.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let job j finish last. When it was assigned, all workers were busy until at least its start time S, since it went to the first
          free one; so <M>{"mS \\le \\sum_{i \\ne j} d_i"}</M>, and its finish time is <M>{"S + d_j \\le \\sum_i d_i/m + d_j"}</M>. Any
          schedule needs at least <M>{"\\sum_i d_i/m"}</M>, the average load, and at least <M>{"\\max_i d_i"}</M>, so the best makespan
          is at least each term and the bound is at most twice it. The <M>{"\\max_i d_i"}</M> term is why one runaway episode can hold up
          a whole batch, and why timeouts matter (e12.6.1).
        </p>
      </Proof>

      <Remark title="sandboxes in practice">
        <p>
          Coding environments such as those built on SWE-bench use a container image per repository with its dependencies installed;
          sandboxes for untrusted code add gVisor or microVMs such as Firecracker, which boot in a fraction of a second. Network access is
          off or limited to an allow-list, file systems are copy-on-write snapshots so each episode starts clean, and pools of warm
          sandboxes run on CPU machines separate from the GPUs. Asynchronous rollouts (e12.6.3) let slow tool calls overlap with
          generation for other episodes. Reward hacking remains the hard part: graders are hidden from the agent, tests are
          strengthened, and samples of high-reward episodes are read by people.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A warm pool sized by Little&apos;s law removes the start-up stalls. Limits on time and resources, with zero reward when
          exceeded, end runaway episodes and stop them holding up a batch. Running the original tests outside the agent&apos;s reach,
          and failing any episode that touches them, removes the shortcut the policy had found.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "pool",
      rung: "check",
      prompt: (
        <p>
          Episodes start at 5 per second, each holds a sandbox for 120 seconds, and a cold sandbox takes 30 seconds to start. How many
          sandboxes are in use on average without a warm pool?
        </p>
      ),
      answer: { kind: "numeric", value: 750, tolerance: 0.001 },
    },
    {
      key: "makespan",
      rung: "check",
      prompt: (
        <p>
          Episodes of 5, 5, 5, 5 and 10 seconds, in that order, run on 2 sandboxes with <C>makespan</C>. When does the last one finish?
        </p>
      ),
      answer: { kind: "numeric", value: 20, tolerance: 0.001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Why does an episode that exceeds a resource limit get zero reward rather than credit for the tests it passed so far?</p>,
      answer: {
        kind: "choice",
        options: [
          "Otherwise the policy could profit from runaway or resource-hungry behaviour, and partial results from a killed run cannot be trusted",
          "Rewards must always be whole numbers",
          "Limits are only checked after the tests have finished",
          "A killed sandbox cannot report how many tests exist",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def apply_limits(usage, limits):
    for k in limits:                                     # checked in a fixed order
        if usage[k] > limits[k]:
            return k                                     # the sandbox is killed for exceeding this limit
    return "ok"

def reward(status, passed, total):
    if status != "ok":
        return 0.0                                       # crashes and timeouts earn nothing
    return passed / total

def tampered(changed, protected):
    return any(f.startswith(p) for f in changed for p in protected)   # the agent edited the grader's files

u = {"time": 12.0, "memory": 3.0, "output": 1.0}
print(apply_limits(u, {"time": 10.0, "memory": 4.0, "output": 2.0}), reward(apply_limits(u, {"time": 20.0, "memory": 4.0, "output": 2.0}), 3, 4), tampered(["src/a.py", "tests/test_a.py"], ["tests/"]), tampered(["src/a.py"], ["tests/"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["time 0.75 True False", "ok 0.75 True False", "time 0.0 True False", "time 0.75 False False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq

def sandboxes_needed(rate, duration, startup, warm):
    return rate * (duration + (0 if warm else startup))   # Little's law: arrivals times time held

def makespan(durations, workers):
    free = [0] * workers
    for d in durations:                                  # each job, in order, goes to the first free worker
        heapq.heappush(free, heapq.heappop(free) + d)
    return max(free)

def cap_durations(durations, timeout):
    return sum(min(d, timeout) for d in durations), sum(d > timeout for d in durations)

d = [4, 2, 7, 1, 3]
print(makespan(d, 2), cap_durations(d, 3), sandboxes_needed(10, 30, 5, False), sandboxes_needed(10, 30, 5, True))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["9 (12, 2) 350 300", "10 (12, 2) 350 300", "9 (17, 2) 350 300", "9 (12, 2) 300 350"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>apply_limits(usage, limits)</C>, <C>reward(status, passed, total)</C> and <C>tampered(changed, protected)</C>, where
          a file is protected if its path starts with a protected prefix.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def apply_limits(usage, limits):
    return "ok"

def reward(status, passed, total):
    return passed / total

def tampered(changed, protected):
    return False
`,
        solution: GRADE,
        tests: [
          { name: "limits", code: `assert apply_limits({"a": 1, "b": 9}, {"a": 2, "b": 5}) == "b" and apply_limits({"a": 3, "b": 9}, {"a": 2, "b": 5}) == "a"\nassert apply_limits({"a": 2}, {"a": 2}) == "ok" and reward("memory", 5, 5) == 0.0 and reward("ok", 1, 4) == 0.25` },
          { name: "tamper", code: `assert tampered(["grader/run.sh"], ["tests/", "grader/"]) and not tampered([], ["tests/"]) and not tampered(["src/tests.py"], ["tests/"])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sandboxes_needed(rate, duration, startup, warm)</C>, <C>makespan(durations, workers)</C> and{" "}
          <C>cap_durations(durations, timeout)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import heapq

def sandboxes_needed(rate, duration, startup, warm):
    return rate * duration

def makespan(durations, workers):
    return sum(durations) / workers

def cap_durations(durations, timeout):
    return sum(durations), 0
`,
        solution: POOL,
        tests: [
          { name: "pool", code: `assert sandboxes_needed(2, 10, 3, False) == 26 and sandboxes_needed(2, 10, 3, True) == 20\nassert makespan([3, 3, 6], 2) == 9 and makespan([1, 1], 4) == 1` },
          { name: "timeout", code: `assert cap_durations([5, 50, 8], 10) == (23, 1) and cap_durations([], 10) == (0, 0)` },
        ],
      },
    },
    {
      key: "warm",
      rung: "stretch",
      prompt: (
        <p>
          Episodes start at 5 per second from a warm pool. Nine in ten finish in 60 seconds; the rest would run for 600 seconds but are
          killed at a 300-second timeout. On average, how many sandboxes are busy?
        </p>
      ),
      answer: { kind: "numeric", value: 420, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the path from a single decode step to a fleet of servers and the RL systems built on them: the KV cache and its
        memory, batching and paging, speculative decoding, quantisation, serving at scale, and the generators, weight syncs and
        sandboxes that turn inference into training data.
      </p>
    </>
  ),
};
