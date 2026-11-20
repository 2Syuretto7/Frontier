import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AgentParetoViz } from "@/components/viz/AgentParetoViz";
import type { LessonContent } from "@/lib/types";

const REPORT = `def pareto_frontier(points):
    best = float("-inf")
    front = []
    for cost, acc in sorted(points, key=lambda p: (p[0], -p[1])):
        if acc > best:
            front.append((cost, acc))
            best = acc
    return front

def cost_per_success(total_cost, n_tasks, success_rate):
    return total_cost / (n_tasks * success_rate)

def validity_adjusted(score, valid_fraction):
    return score / valid_fraction`;

const GRADE = `def state_matches(state, required):
    return all(state.get(k) == v for k, v in required.items())

def no_side_effects(state, forbidden):
    return not any(state.get(k) == v for k, v in forbidden.items())

def grade(state, required, forbidden):
    return 1 if state_matches(state, required) and no_side_effects(state, forbidden) else 0`;

export const lesson: LessonContent = {
  id: "l10.4.1",
  minutes: 50,
  links: {
    requires: ["l10.3.4", "l10.3.1"],
    revisits: ["l10.1.1", "l10.2.3", "l9.7.1"],
    foreshadows: ["l10.4.2", "l13.3.1", "l13.4.1"],
  },

  puzzle: (
    <>
      <p>
        SWE-bench gives an agent a real GitHub repository and an issue, and counts the task solved if the agent&apos;s patch makes the
        repository&apos;s hidden tests pass. When OpenAI had engineers review a sample of its tasks in 2024, many were found to be
        underspecified or to have tests that rejected valid fixes; the reviewed subset, SWE-bench Verified, has 500 tasks. If a
        sizeable share of a benchmark&apos;s tasks cannot be solved as posed, what does a score of 40% on it mean, and how should
        agents that cost a hundred times more per task be compared with cheap ones?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An agentic task suite has three parts: an environment the agent acts in, tasks with goals, and a grader that inspects the
        outcome. Each can fail. Environments are flaky, tasks can be broken, and graders can pass wrong solutions or fail right ones.
        Scores also depend on the scaffold around the model and on how much computation it is allowed. A good report states all of
        this and puts cost next to success.
      </p>
      <AgentParetoViz />
    </>
  ),

  theory: (
    <>
      <Definition title="anatomy of a suite">
        <p>
          SWE-bench grades code changes with tests. WebArena and OSWorld give agents websites or a desktop and check the final state of
          the page or files. τ-bench simulates a customer talking to an agent with tools over a database, and grades by comparing the
          database at the end with the expected state. GAIA asks questions needing browsing and tool use, with short answers that can be
          matched exactly. Grading by outcome state, rather than by the steps taken, allows any valid route to the goal.
        </p>
      </Definition>

      <Definition title="grading the final state">
        <p>
          A state-based grader requires certain values to hold at the end (<C>state_matches</C>) and, just as important, checks that
          nothing forbidden happened along the way, such as an unrequested refund or a deleted file (<C>no_side_effects</C>). A task is
          passed only if both hold (<C>grade</C>). A grader that checks only the required changes rewards agents that achieve them by
          brute force.
        </p>
        <Code>{GRADE}</Code>
      </Definition>

      <Theorem title="invalid tasks cap the score">
        <p>
          If a fraction v of tasks is solvable and graded correctly, the rest always fail, and an agent solves a fraction a of the valid
          ones, its score is s = va. The ceiling is v, and the agent&apos;s rate on valid tasks is s/v (<C>validity_adjusted</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The score is the mean over tasks of the pass indicator. Invalid tasks contribute 0 and valid ones a in expectation, so the
          mean is <M>{"v \\cdot a + (1-v)\\cdot 0"}</M>. Two consequences: progress near the ceiling looks like saturation (l10.1.2) when the
          remaining tasks are simply broken, and comparing scores across versions of a suite with different v is meaningless unless
          they are adjusted. If invalid tasks are instead passed by chance at some rate, the same algebra applies with an extra
          additive term.
        </p>
      </Proof>

      <Remark title="cost and the Pareto frontier">
        <p>
          Kapoor et al. (2024) showed that simple baselines, such as retrying a cheap agent a few times, matched elaborate agents on
          some leaderboards at a fraction of the cost, and argued that agent evaluations must report cost. An agent is dominated if
          another is at least as cheap and at least as accurate, with one strictly better; the undominated ones form the Pareto frontier
          (<C>pareto_frontier</C>). Cost per solved task (<C>cost_per_success</C>) is the figure a user pays.
        </p>
        <Code>{REPORT}</Code>
      </Remark>

      <Example title="what to report">
        <p>
          The suite version and any tasks excluded; the scaffold, tools and limits on steps, time and tokens; the number of attempts per
          task and whether a selection rule was used; success with error bars clustered by task family (l10.2.3), and pass^k for
          reliability (l10.3.1); cost per task; and a breakdown of failures by cause, since a timeout, a crashed environment and a wrong
          answer call for different fixes.
        </p>
      </Example>

      <Remark title="agents can game the environment">
        <p>
          A capable agent may find shortcuts the designers missed: reading the test files, editing the grader, or finding the answer in
          the environment&apos;s history. Such runs score as successes but measure the environment, not the skill. Sandboxing, hidden
          graders and manual review of a sample of successful trajectories are the defences (l13.4.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "valid",
      rung: "check",
      prompt: (
        <p>
          An agent scores 45% on a suite. An audit finds 20% of tasks unsolvable as posed, and those always fail. What is its success
          rate on the valid tasks? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.563, tolerance: 0.001 },
    },
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          Running an agent on 300 tasks costs 90 units in total and it succeeds on 45% of them. What is the cost per successful task?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.667, tolerance: 0.001 },
    },
    {
      key: "side",
      rung: "apply",
      prompt: (
        <p>
          In a customer-service suite, an agent asked to change a flight also cancels the customer&apos;s hotel booking, and the task is
          marked as passed. What is wrong with the grader?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "It checks only that the required change happened, not that nothing else changed; it needs a check for forbidden side effects",
          "It should grade the agent's steps rather than the final state",
          "Nothing; the requested change was made",
          "It should use a model judge instead of the database state",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pareto_frontier(points):
    best = float("-inf")
    front = []
    for cost, acc in sorted(points, key=lambda p: (p[0], -p[1])):
        if acc > best:
            front.append((cost, acc))
            best = acc
    return front

def cost_per_success(total_cost, n_tasks, success_rate):
    return total_cost / (n_tasks * success_rate)

def validity_adjusted(score, valid_fraction):
    return score / valid_fraction

print(pareto_frontier([(2, 0.5), (1, 0.6), (3, 0.7), (1, 0.4)]))
print(cost_per_success(50, 100, 0.25), validity_adjusted(0.3, 0.6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(1, 0.6), (3, 0.7)]\n2.0 0.5",
          "[(1, 0.6), (2, 0.5), (3, 0.7)]\n2.0 0.5",
          "[(1, 0.4), (1, 0.6), (3, 0.7)]\n2.0 0.5",
          "[(1, 0.6), (3, 0.7)]\n0.5 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def state_matches(state, required):
    return all(state.get(k) == v for k, v in required.items())

def no_side_effects(state, forbidden):
    return not any(state.get(k) == v for k, v in forbidden.items())

def grade(state, required, forbidden):
    return 1 if state_matches(state, required) and no_side_effects(state, forbidden) else 0

print(state_matches({"a": 1, "b": 2}, {"a": 1}), state_matches({"a": 1}, {"b": None}))
print(no_side_effects({"x": 0}, {"x": 1}), grade({"o": "paid", "r": True}, {"o": "paid"}, {"r": True}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True True\nTrue 0",
          "True False\nTrue 0",
          "True True\nTrue 1",
          "True False\nFalse 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pareto_frontier(points)</C>, returning the undominated (cost, accuracy) pairs sorted by cost, and keeping only the
          most accurate of equal-cost points, <C>cost_per_success(total_cost, n_tasks, success_rate)</C>, and{" "}
          <C>validity_adjusted(score, valid_fraction)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pareto_frontier(points):
    return sorted(points)

def cost_per_success(total_cost, n_tasks, success_rate):
    return total_cost / n_tasks

def validity_adjusted(score, valid_fraction):
    return score
`,
        solution: REPORT,
        tests: [
          { name: "front", code: `assert pareto_frontier([(1, 0.3), (1, 0.5), (2, 0.5), (3, 0.8), (5, 0.7), (0.5, 0.1)]) == [(0.5, 0.1), (1, 0.5), (3, 0.8)] and pareto_frontier([]) == []` },
          { name: "rates", code: `assert abs(cost_per_success(60, 200, 0.6) - 0.5) < 1e-12 and abs(validity_adjusted(0.36, 0.9) - 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          States are dictionaries. Write <C>state_matches(state, required)</C>, true when every required key has the required value,{" "}
          <C>no_side_effects(state, forbidden)</C>, true when no forbidden key has its forbidden value, and{" "}
          <C>grade(state, required, forbidden)</C>, returning 1 or 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def state_matches(state, required):
    return True

def no_side_effects(state, forbidden):
    return True

def grade(state, required, forbidden):
    return 1
`,
        solution: GRADE,
        tests: [
          { name: "match", code: `assert state_matches({"seat": "12A", "paid": True}, {"seat": "12A"}) and not state_matches({"seat": "3C"}, {"seat": "12A"}) and not state_matches({}, {"paid": True})` },
          { name: "grade", code: `s = {"flight": "AI101", "hotel": "cancelled"}\nassert not no_side_effects(s, {"hotel": "cancelled"}) and grade(s, {"flight": "AI101"}, {"hotel": "cancelled"}) == 0 and grade(s, {"flight": "AI101"}, {"hotel": "deleted"}) == 1` },
        ],
      },
    },
    {
      key: "retry",
      rung: "stretch",
      prompt: (
        <p>
          A cheap agent succeeds on a task with probability 0.3 per attempt, at a cost of 0.2 units per attempt, and a reliable checker
          lets you stop at the first success. With at most three attempts, what is the expected cost per task? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.438, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Most tasks in these suites take a person minutes. The next lesson looks at tasks that take hours or days, where small
        per-step error rates compound and the trajectory itself becomes the object of evaluation.
      </p>
    </>
  ),
};
