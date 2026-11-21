import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MultiAgentTimeViz } from "@/components/viz/MultiAgentTimeViz";
import type { LessonContent } from "@/lib/types";

const SPLIT = `def split_tasks(items, n):
    return [items[i::n] for i in range(n)]                 # round robin

def wall_clock(costs, n):
    return max(sum(part) for part in split_tasks(costs, n))   # workers run in parallel; the slowest decides

def total_tokens(costs, n, overhead):
    return sum(costs) + n * overhead                       # every worker also reads its own brief`;

const MODEL = `def time_model(n, f, c):
    return f + (1 - f) / n + c * n                         # serial part, parallel part, coordination

def best_n(f, c, n_max):
    return min(range(1, n_max + 1), key=lambda n: time_model(n, f, c))

def debate_round(answers):
    for a in set(answers):
        if answers.count(a) * 2 > len(answers):
            return [a] * len(answers)                      # a strict majority persuades everyone
    return list(answers)`;

export const lesson: LessonContent = {
  id: "l13.3.4",
  minutes: 50,
  links: {
    requires: ["l13.3.2"],
    revisits: ["l13.1.2", "l13.3.1"],
    foreshadows: ["l13.5.3"],
  },

  puzzle: (
    <>
      <p>
        Asked to survey every company that makes a certain kind of chip, a single agent searches, reads and notes one
        company at a time, and its context fills with pages it no longer needs. A lead agent that sends ten helpers off in
        parallel, each with a fresh context and one slice of the list, finishes far sooner. But each helper must be briefed,
        their findings must be merged, and the whole system reads many more tokens. When does dividing the work among agents
        pay, and when is one agent better?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Several agents help in the same ways several people do: they work in parallel, each holds only its own part of the
        problem in mind, and they can take different roles. They also cost what teams cost: briefing, waiting for the slowest,
        merging results, and losing information at every handoff. Work that splits cleanly into independent pieces, such as
        broad research, gains most; tightly coupled work, such as editing one program, often gains nothing.
      </p>
      <MultiAgentTimeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="orchestrator and workers">
        <p>
          A lead agent plans, splits the task into subtasks (<C>split_tasks</C>), and starts worker agents, each with its own
          context containing only its brief. Workers run in parallel, so the elapsed time is set by the slowest
          (<C>wall_clock</C>), and each returns a condensed result. The lead merges them and may start further workers. Total
          tokens are the sum over all agents plus the cost of every brief (<C>total_tokens</C>), typically several times what
          one agent would use. One report on a research system of this kind found it answered broad research questions far
          better than a single agent with the same model, and that the number of tokens used explained most of the
          difference in performance.
        </p>
        <Code>{SPLIT}</Code>
      </Definition>

      <Theorem title="how many agents">
        <p>
          Let a share f of the work be serial, the rest divide evenly among n agents, and coordination cost c per agent, so
          that the time relative to one agent is <M>{"T(n) = f + (1 - f)/n + cn"}</M> (<C>time_model</C>). For c &gt; 0,{" "}
          <M>{"T"}</M> is minimised over n &gt; 0 at
        </p>
        <MD>{"n^* = \\sqrt{(1 - f)/c}, \\qquad T(n^*) = f + 2\\sqrt{c(1 - f)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"T'(n) = -(1-f)/n^2 + c"}</M> vanishes at <M>{"n^*"}</M>, and <M>{"T''(n) = 2(1-f)/n^3 > 0"}</M>, so this is the
          unique minimum. Substituting, both <M>{"(1-f)/n^*"}</M> and <M>{"cn^*"}</M> equal <M>{"\\sqrt{c(1-f)}"}</M>. Over
          whole numbers the best n is one of the two integers around <M>{"n^*"}</M> (<C>best_n</C>). With c = 0 this is
          Amdahl&apos;s law, whose speed-up <M>{"1/(f + (1-f)/n)"}</M> never exceeds 1/f; coordination cost makes adding agents
          eventually harmful.
        </p>
        <Code>{MODEL}</Code>
      </Proof>

      <Definition title="debate and ensembles">
        <p>
          Agents can also work on the same problem. In multi-agent debate, several instances answer, read each other&apos;s
          answers and reasoning, and revise over a few rounds; reported gains on arithmetic and factual questions came from
          agents abandoning answers they could not defend (<C>debate_round</C> is a crude version in which a strict majority
          persuades everyone). Other designs assign roles, such as a coder and a reviewer, so that one agent checks
          another&apos;s work.
        </p>
      </Definition>

      <Remark title="correlated agents">
        <p>
          Copies of one model share its knowledge and blind spots. If n agents&apos; errors each have variance{" "}
          <M>{"\\sigma^2"}</M> and pairwise correlation ρ, the variance of their average is{" "}
          <M>{"\\sigma^2(\\rho + (1 - \\rho)/n)"}</M>, which never falls below <M>{"\\rho\\sigma^2"}</M>, however many agents
          are added. Diversity of prompts, tools, information or models, not the count of agents, is what reduces shared
          errors, as with the self-consistency vote earlier in the course.
        </p>
      </Remark>

      <Example title="when one agent is better">
        <p>
          Writing software usually needs every part to agree on shared decisions: names, interfaces, the data format. Workers
          that each see only their part make choices that conflict, and the merge costs more than the parallelism saved; in
          the model above, f is large. Practical systems therefore use subagents for read-heavy, separable work, such as
          searching a codebase or the web and returning a summary, and keep writing with a single agent that holds the
          decisions.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "best",
      rung: "check",
      prompt: (
        <p>
          With serial share f = 0.2 and coordination cost c = 0.005 per agent, what whole number of agents minimises{" "}
          <M>{"T(n)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 13, tolerance: 0 },
    },
    {
      key: "amdahl",
      rung: "check",
      prompt: (
        <p>
          Ignoring coordination cost, what is the speed-up of 8 agents on a task whose serial share is 0.1?
        </p>
      ),
      answer: { kind: "numeric", value: 4.7059, tolerance: 0.001 },
    },
    {
      key: "when",
      rung: "apply",
      prompt: <p>Which task gains most from splitting among several agents?</p>,
      answer: {
        kind: "choice",
        options: [
          "Surveying many independent sources and summarising each",
          "Refactoring one module whose functions all call each other",
          "Answering a short factual question",
          "Any task, since more agents always finish sooner",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def split_tasks(items, n):
    return [items[i::n] for i in range(n)]                 # round robin

def wall_clock(costs, n):
    return max(sum(part) for part in split_tasks(costs, n))   # workers run in parallel; the slowest decides

def total_tokens(costs, n, overhead):
    return sum(costs) + n * overhead                       # every worker also reads its own brief

print(split_tasks(list("abcde"), 2), wall_clock([5, 1, 1, 1, 4], 2))
print(total_tokens([5, 1, 1, 1, 4], 2, 3), wall_clock([2, 2], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[['a', 'c', 'e'], ['b', 'd']] 10\n18 2",
          "[['a', 'b', 'c'], ['d', 'e']] 7\n18 2",
          "[['a', 'c', 'e'], ['b', 'd']] 10\n15 2",
          "[['a', 'c', 'e'], ['b', 'd']] 6\n18 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def time_model(n, f, c):
    return f + (1 - f) / n + c * n                         # serial part, parallel part, coordination

def best_n(f, c, n_max):
    return min(range(1, n_max + 1), key=lambda n: time_model(n, f, c))

def debate_round(answers):
    for a in set(answers):
        if answers.count(a) * 2 > len(answers):
            return [a] * len(answers)                      # a strict majority persuades everyone
    return list(answers)

print(round(time_model(4, 0.1, 0.01), 4), best_n(0.1, 0.02, 50))
print(debate_round(["4", "4", "5"]), debate_round(["a", "b", "c", "a"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.365 7\n['4', '4', '4'] ['a', 'b', 'c', 'a']",
          "0.365 50\n['4', '4', '4'] ['a', 'b', 'c', 'a']",
          "0.365 7\n['4', '4', '5'] ['a', 'b', 'c', 'a']",
          "0.365 7\n['4', '4', '4'] ['a', 'a', 'a', 'a']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>split_tasks(items, n)</C> dealing items round robin into n lists, <C>wall_clock(costs, n)</C>, the
          largest total cost of any worker under that split, and <C>total_tokens(costs, n, overhead)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def split_tasks(items, n):
    return [items]

def wall_clock(costs, n):
    return sum(costs) / n

def total_tokens(costs, n, overhead):
    return sum(costs)
`,
        solution: SPLIT,
        tests: [
          { name: "split", code: `assert split_tasks([1, 2, 3], 3) == [[1], [2], [3]] and wall_clock([3, 1, 2], 2) == 5` },
          { name: "tokens", code: `assert total_tokens([1, 2], 3, 10) == 33` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>time_model(n, f, c)</C>, <C>best_n(f, c, n_max)</C> returning the smallest minimiser among 1 to n_max,
          and <C>debate_round(answers)</C>, which replaces every answer by one held by a strict majority, if there is one.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def time_model(n, f, c):
    return f + (1 - f) / n

def best_n(f, c, n_max):
    return n_max

def debate_round(answers):
    return list(answers)
`,
        solution: MODEL,
        tests: [
          { name: "model", code: `assert abs(time_model(2, 0.5, 0.1) - 0.95) < 1e-12 and best_n(0.0, 1.0, 10) == 1` },
          { name: "debate", code: `assert debate_round(["x", "y", "y"]) == ["y", "y", "y"] and debate_round(["p", "q"]) == ["p", "q"]` },
        ],
      },
    },
    {
      key: "speedup",
      rung: "stretch",
      prompt: (
        <p>
          With f = 0.2 and c = 0.005, what speed-up over a single agent, 1/T(n), does the best whole number of agents give?
        </p>
      ),
      answer: { kind: "numeric", value: 3.0624, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Everything in this chapter used a model trained for something else and arranged it with prompts and harnesses. The
        next chapter trains the model for the agent&apos;s job itself, starting with the environments in which it practises.
      </p>
    </>
  ),
};
