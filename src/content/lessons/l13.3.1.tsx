import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AgentCostViz } from "@/components/viz/AgentCostViz";
import type { LessonContent } from "@/lib/types";

const LOOP = `import re

def parse_action(text):
    m = re.search(r"Final:\\s*(.*)", text)
    if m:
        return "final", m.group(1).strip()
    m = re.search(r"Action:\\s*(\\w+)\\[(.*)\\]", text)
    return (m.group(1), m.group(2)) if m else None

def observe(action, tools):
    if action is None:
        return "Observation: invalid action"
    name, arg = action
    if name not in tools:
        return f"Observation: unknown tool {name}"
    return f"Observation: {tools[name](arg)}"

def run_agent(policy, tools, max_steps):
    history = []
    for step in range(1, max_steps + 1):
        text = policy(history)                             # think and choose an action given everything so far
        action = parse_action(text)
        if action and action[0] == "final":
            return action[1], step
        history += [text, observe(action, tools)]          # act, then read the result
    return None, max_steps`;

const COST = `def input_tokens(T, P, o):
    return T * P + o * T * (T - 1) // 2                    # step t rereads the prompt and t - 1 earlier steps

def cached_cost(T, P, o, c):
    cost = P
    for t in range(2, T + 1):
        cost += c * (P + (t - 2) * o) + o                  # the old prefix at the cached price, the newest step in full
    return cost

def max_steps_for(budget, P, o):
    T = 0
    while input_tokens(T + 1, P, o) <= budget:
        T += 1
    return T`;

export const lesson: LessonContent = {
  id: "l13.3.1",
  minutes: 50,
  links: {
    requires: ["l13.2.1", "l13.1.1"],
    revisits: ["l13.2.3", "l9.4.1"],
    foreshadows: ["l13.3.2", "l13.4.1"],
  },

  puzzle: (
    <>
      <p>
        &quot;Find the cheapest train from Pune to Mumbai tomorrow that arrives before noon, and book it.&quot; No single
        tool call answers this. The model must search, read the results, notice that one train is sold out, search again,
        compare, and only then book, each action chosen after seeing the result of the last. How is a language model turned
        into something that acts over many steps like this, and why does a fifty-step task cost far more than fifty times a
        one-step one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An agent is a language model in a loop: it reads everything that has happened, writes its reasoning and one action,
        the harness carries out the action and appends what it observed, and the loop repeats until the model declares an
        answer or a step limit is reached. The model is the policy and the conversation is its memory. Because the whole
        history is reread at every step, the tokens processed grow with the square of the number of steps.
      </p>
      <AgentCostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ReAct">
        <p>
          At each step the model writes a thought, free text reasoning about what to do, and an action in a fixed format
          such as <C>search[query]</C>, or a final answer (<C>parse_action</C>). The harness executes the action and appends
          an observation (<C>observe</C>); unknown or malformed actions produce an observation saying so, which the model can
          correct. The loop stops at a final answer or after a maximum number of steps (<C>run_agent</C>). Interleaving
          reasoning with acting improved on acting alone in question answering with a search tool and in text-based
          household and shopping environments, because the thoughts track progress, handle exceptions and decide what to look
          up next.
        </p>
        <Code>{LOOP}</Code>
      </Definition>

      <Definition title="the agent as a policy">
        <p>
          Formally the environment is a partially observable Markov decision process: a hidden state <M>{"s_t"}</M>, actions{" "}
          <M>{"a_t"}</M>, observations <M>{"o_t"}</M> and a reward, often given only at the end for success. The agent cannot
          see <M>{"s_t"}</M>, so its policy conditions on the history <M>{"h_t = (o_1, a_1, \\dots, o_t)"}</M>, which here is
          literally the context window: <M>{"a_t \\sim \\pi_\\theta(\\cdot \\mid h_t)"}</M>. Everything the agent knows about
          the task must be in that history or in its weights, which is why context management, the subject of the next
          lesson, matters.
        </p>
      </Definition>

      <Theorem title="the cost of rereading">
        <p>
          Let the prompt have P tokens and each step add o tokens of action and observation. Over T steps the model reads
        </p>
        <MD>{"TP + o\\,\\frac{T(T-1)}{2}"}</MD>
        <p>
          input tokens (<C>input_tokens</C>). If a cached prefix is charged a fraction c of the full price and only the newest
          step is new, the cost is <M>{"P + \\sum_{t=2}^{T} \\big(c(P + (t-2)o) + o\\big)"}</M> (<C>cached_cost</C>), and its
          ratio to the uncached count tends to c as T grows.
        </p>
      </Theorem>
      <Proof>
        <p>
          At step t the context holds the prompt and t − 1 earlier steps, <M>{"P + (t-1)o"}</M> tokens; summing over t = 1,
          …, T gives <M>{"TP + o(0 + 1 + \\dots + (T-1))"}</M>. With caching, at step t ≥ 2 everything except the step just
          added was read before and is cached, <M>{"P + (t-2)o"}</M> tokens at price c, plus o new tokens. The cached sum has
          leading term <M>{"c\\,oT^2/2"}</M> while the uncached one has <M>{"oT^2/2"}</M>; the remaining terms grow only
          linearly, so the ratio tends to c. Caching therefore divides the cost but does not change its quadratic growth,
          and generated output tokens, usually priced higher, come on top.
        </p>
        <Code>{COST}</Code>
      </Proof>

      <Remark title="limits and failure">
        <p>
          A step limit bounds cost (<C>max_steps_for</C>) and catches loops, where the agent repeats an action whose result
          it ignores. Errors compound over steps as they do along a chain of thought, but an agent can observe a failure and
          recover, so its reliability depends on how well it notices mistakes rather than only on how rarely it makes them.
          The design of the action space matters as much as the model: a few well-documented tools with informative errors
          are easier to use than many overlapping ones.
        </p>
      </Remark>

      <Example title="a trace">
        <p>
          Thought: I need tomorrow&apos;s trains. Action: <C>search[Pune to Mumbai trains 22 November]</C>. Observation: five
          trains with times and prices. Thought: the cheapest arriving before noon is the 07:15, but I should check
          availability. Action: <C>check_seats[11010]</C>. Observation: sold out. Thought: the next cheapest is the 06:00.
          Action: <C>check_seats[12124]</C>. Observation: 40 seats. Thought: booking is irreversible, so I confirm with the
          user first. Each observation changes what the next action should be, which a fixed pipeline cannot do.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "tokens",
      rung: "check",
      prompt: (
        <p>
          An agent has a 2000-token prompt and each step adds 500 tokens. How many input tokens does it read over 20 steps?
        </p>
      ),
      answer: { kind: "numeric", value: 135000, tolerance: 0 },
    },
    {
      key: "cached",
      rung: "check",
      prompt: (
        <p>
          The same agent caches its prefix at a tenth of the price, the newest step being new each time. What is its cost
          over 20 steps, in full-price token equivalents?
        </p>
      ),
      answer: { kind: "numeric", value: 23850, tolerance: 0.5 },
    },
    {
      key: "history",
      rung: "apply",
      prompt: <p>Why does an agent&apos;s policy condition on the whole history rather than the latest observation?</p>,
      answer: {
        kind: "choice",
        options: [
          "The environment's state is hidden, and the history is all the agent has to infer it from",
          "Because language models cannot read short inputs",
          "To make each step cheaper",
          "Because rewards are given at every step",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import re

def parse_action(text):
    m = re.search(r"Final:\\s*(.*)", text)
    if m:
        return "final", m.group(1).strip()
    m = re.search(r"Action:\\s*(\\w+)\\[(.*)\\]", text)
    return (m.group(1), m.group(2)) if m else None

def observe(action, tools):
    if action is None:
        return "Observation: invalid action"
    name, arg = action
    if name not in tools:
        return f"Observation: unknown tool {name}"
    return f"Observation: {tools[name](arg)}"

def run_agent(policy, tools, max_steps):
    history = []
    for step in range(1, max_steps + 1):
        text = policy(history)                             # think and choose an action given everything so far
        action = parse_action(text)
        if action and action[0] == "final":
            return action[1], step
        history += [text, observe(action, tools)]          # act, then read the result
    return None, max_steps

print(parse_action("Thought: look up\\nAction: search[Pune]"), parse_action("Final: 42"), parse_action("hmm"))
pol = lambda h: "Action: double[21]" if not h else "Final: " + h[-1].split(": ")[1]; print(run_agent(pol, {"double": lambda x: str(2 * int(x))}, 5), observe(("fly", "x"), {}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('search', 'Pune') ('final', '42') None\n('42', 2) Observation: unknown tool fly",
          "('search', 'Pune') ('final', '42') None\n('42', 1) Observation: unknown tool fly",
          "('search', 'Pune') ('final', '42') None\n('21', 2) Observation: unknown tool fly",
          "('search', '[Pune]') ('final', '42') None\n('42', 2) Observation: unknown tool fly",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def input_tokens(T, P, o):
    return T * P + o * T * (T - 1) // 2                    # step t rereads the prompt and t - 1 earlier steps

def cached_cost(T, P, o, c):
    cost = P
    for t in range(2, T + 1):
        cost += c * (P + (t - 2) * o) + o                  # the old prefix at the cached price, the newest step in full
    return cost

def max_steps_for(budget, P, o):
    T = 0
    while input_tokens(T + 1, P, o) <= budget:
        T += 1
    return T

print(input_tokens(3, 100, 50), input_tokens(1, 100, 50), round(cached_cost(3, 100, 50, 0.1), 1))
print(max_steps_for(450, 100, 50), max_steps_for(449, 100, 50), max_steps_for(50, 100, 50))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["450 100 225.0\n3 2 0", "600 100 225.0\n3 2 0", "450 100 210.0\n3 2 0", "450 100 225.0\n3 3 1"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>parse_action(text)</C> returning (&quot;final&quot;, answer) for &quot;Final: …&quot;, (name, arg) for
          &quot;Action: name[arg]&quot;, or None; <C>observe(action, tools)</C> returning &quot;Observation: …&quot; with
          &quot;invalid action&quot; or &quot;unknown tool name&quot; for bad actions; and{" "}
          <C>run_agent(policy, tools, max_steps)</C>, where the policy receives the list of past outputs and observations,
          returning (answer, steps) or (None, max_steps).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def parse_action(text):
    return None

def observe(action, tools):
    return "Observation: invalid action"

def run_agent(policy, tools, max_steps):
    return None, max_steps
`,
        solution: LOOP,
        tests: [
          { name: "parse", code: `assert parse_action("Action: calc[1+2]") == ("calc", "1+2") and observe(("calc", "1+2"), {"calc": lambda s: 3}) == "Observation: 3"` },
          { name: "loop", code: `pol = lambda h: "Final: done" if len(h) == 4 else "oops"\nassert run_agent(pol, {}, 9) == ("done", 3) and run_agent(pol, {}, 2) == (None, 2)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>input_tokens(T, P, o)</C>, <C>cached_cost(T, P, o, c)</C>, and <C>max_steps_for(budget, P, o)</C>, the
          largest T whose input tokens fit the budget.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def input_tokens(T, P, o):
    return T * (P + o)

def cached_cost(T, P, o, c):
    return c * input_tokens(T, P, o)

def max_steps_for(budget, P, o):
    return budget // (P + o)
`,
        solution: COST,
        tests: [
          { name: "tokens", code: `assert input_tokens(4, 10, 2) == 52 and abs(cached_cost(2, 10, 2, 0.5) - 17.0) < 1e-12` },
          { name: "steps", code: `assert max_steps_for(52, 10, 2) == 4 and max_steps_for(51, 10, 2) == 3` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          With a 2000-token prompt and 500 tokens per step, how many steps fit in a budget of one million input tokens?
        </p>
      ),
      answer: { kind: "numeric", value: 59, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A long task outgrows the context window and the budget long before it is done. The next lesson gives agents plans
        that structure the work and memory outside the context, so that what matters survives and what does not is dropped.
      </p>
    </>
  ),
};
