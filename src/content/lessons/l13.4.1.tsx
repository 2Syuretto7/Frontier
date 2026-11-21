import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CheckerNoiseViz } from "@/components/viz/CheckerNoiseViz";
import type { LessonContent } from "@/lib/types";

const ENV = `def reset(target, max_steps):
    return {"x": 1, "target": target, "left": max_steps}

def step(state, action):
    state["left"] -= 1
    if action == "+1":
        state["x"] += 1
    elif action == "*2":
        state["x"] *= 2
    else:
        return "invalid", 0, state["left"] == 0
    if state["x"] == state["target"]:
        return state["x"], 1, True                         # the checker: reward only for reaching the target
    return state["x"], 0, state["left"] == 0

def rollout(policy, target, max_steps):
    s = reset(target, max_steps)
    for t in range(1, max_steps + 1):
        _, r, done = step(s, policy(s["x"], target))
        if done:
            return r, t
    return 0, max_steps`;

const REWARD = `def measured_reward(p, f, g):
    return (1 - g) * p + f * (1 - p)                       # missed successes and accepted failures

def hack_wins(p, f, g, h):
    return h > measured_reward(p, f, g)                    # a policy that only fools the checker earns h

def curriculum_filter(stats, lo, hi):
    return sorted(t for t, (s, n) in stats.items() if lo <= s / n <= hi)`;

export const lesson: LessonContent = {
  id: "l13.4.1",
  minutes: 50,
  links: {
    requires: ["l13.3.1", "l9.7.2"],
    revisits: ["l9.7.1", "l9.3.3"],
    foreshadows: ["l13.4.2", "l13.4.3"],
  },

  puzzle: (
    <>
      <p>
        To train a model to fix bugs as an agent, it needs somewhere to practise: thousands of real repositories, each with
        a bug, a working build, and tests that pass only when the bug is fixed, all resettable in seconds and isolated so
        that a careless command cannot do damage. Building such environments is now a large part of the work of training
        agents. What makes an environment good for reinforcement learning, and what happens when its checker is wrong
        some of the time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An environment is a task, a world the agent can act in, and a judge. The agent learns only what the judge rewards,
        so the judge&apos;s mistakes are taught as faithfully as its correct verdicts. A judge that sometimes misses real
        successes or accepts failures blunts the signal; a judge that some cheap trick can fool offers the agent a better
        deal than doing the task, and the agent will take it.
      </p>
      <CheckerNoiseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="an environment">
        <p>
          An environment exposes <C>reset(task)</C>, returning an initial state and observation, and{" "}
          <C>step(action)</C>, returning an observation, a reward and whether the episode has ended (<C>reset</C>,{" "}
          <C>step</C>). A rollout runs the agent&apos;s policy until the episode ends or a step limit is reached{" "}
          (<C>rollout</C>). For agents, the state is usually a sandbox, a container with a repository, a browser or a desktop,
          and the reward comes at the end from a checker: unit tests, a script that inspects the final state, or a comparison
          with a known answer.
        </p>
        <Code>{ENV}</Code>
      </Definition>

      <Definition title="what makes an environment useful">
        <p>
          It should be verifiable, with a checker that is cheap and rarely wrong; diverse, so that the agent learns skills
          rather than memorising tasks; of calibrated difficulty, since tasks always or never solved give group-relative
          methods no signal, as the previous course showed, which is why training pipelines estimate each task&apos;s success
          rate and keep those in between (<C>curriculum_filter</C>); fast to reset and run, since rollouts are long; and
          isolated, so that the agent cannot reach the checker, the network or the training infrastructure.
        </p>
      </Definition>

      <Theorem title="a noisy checker scales the signal">
        <p>
          Let a policy succeed at the task with probability p, and let the checker reward a real success with probability 1
          − g and a failure with probability f, where f and g do not depend on the policy. Then the expected reward is
        </p>
        <MD>{"R(p) = (1 - g)\\,p + f\\,(1 - p) = f + (1 - f - g)\\,p"}</MD>
        <p>
          (<C>measured_reward</C>), so maximising reward maximises true success exactly when f + g &lt; 1, and the gradient of
          the reward is the gradient of true success scaled by 1 − f − g.
        </p>
      </Theorem>
      <Proof>
        <p>
          Condition on whether the attempt succeeds: with probability p it does and is rewarded with probability 1 − g; with
          probability 1 − p it fails and is rewarded with probability f. R is affine in p with slope 1 − f − g, which is
          positive when f + g &lt; 1. For policy parameters θ, <M>{"\\nabla_\\theta R = (1 - f - g)\\nabla_\\theta p"}</M> by
          the chain rule, since f and g are constants. Noise of this kind slows learning but does not mislead it. The
          assumption that f does not depend on the policy is the fragile one: a behaviour that raises the chance of fooling
          the checker, say to h, earns h regardless of p, and is preferred whenever h &gt; R(p) (<C>hack_wins</C>).
        </p>
        <Code>{REWARD}</Code>
      </Proof>

      <Example title="environments for software agents">
        <p>
          Environments for software engineering are built from real repositories: take a merged pull request that fixed an
          issue, keep its new tests, revert the fix, and package the repository with its dependencies in a container. The
          task is the issue text, the checker runs the tests, and the agent works with a shell and an editor. Collections of
          thousands of such tasks were assembled from public repositories; most of the effort went into making builds
          reproducible and tests deterministic, since a flaky test is a checker with both f and g positive.
        </p>
      </Example>

      <Remark title="environments as the new dataset">
        <p>
          For pretraining the scarce resource was text; for agentic reinforcement learning it is environments with reliable
          checkers. Synthetic environments, such as generated puzzles or simulated websites, scale cheaply but risk teaching
          skills that do not transfer; real ones transfer but are expensive to build and check. The best checker is the
          one closest to what the user actually wants, which is often not what is easiest to test.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "reward",
      rung: "check",
      prompt: (
        <p>
          A policy truly succeeds 30% of the time. The checker accepts 5% of failures and misses 10% of successes. What is
          the expected reward?
        </p>
      ),
      answer: { kind: "numeric", value: 0.305, tolerance: 0.001 },
    },
    {
      key: "slope",
      rung: "check",
      prompt: (
        <p>
          With the same checker, by how much does the expected reward rise when true success improves from 0.3 to 0.4?
        </p>
      ),
      answer: { kind: "numeric", value: 0.085, tolerance: 0.001 },
    },
    {
      key: "flaky",
      rung: "apply",
      prompt: <p>Why is a flaky test a problem for training an agent with reinforcement learning?</p>,
      answer: {
        kind: "choice",
        options: [
          "It rewards some failures and punishes some successes, shrinking the signal and, if anything the agent does affects the flakiness, inviting it to exploit that",
          "It makes episodes longer",
          "It stops the environment from resetting",
          "It only matters at evaluation time, not in training",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def reset(target, max_steps):
    return {"x": 1, "target": target, "left": max_steps}

def step(state, action):
    state["left"] -= 1
    if action == "+1":
        state["x"] += 1
    elif action == "*2":
        state["x"] *= 2
    else:
        return "invalid", 0, state["left"] == 0
    if state["x"] == state["target"]:
        return state["x"], 1, True                         # the checker: reward only for reaching the target
    return state["x"], 0, state["left"] == 0

def rollout(policy, target, max_steps):
    s = reset(target, max_steps)
    for t in range(1, max_steps + 1):
        _, r, done = step(s, policy(s["x"], target))
        if done:
            return r, t
    return 0, max_steps

s = reset(5, 4); print(step(s, "+1"), step(s, "*2"), s)
print(rollout(lambda x, t: "*2" if 2 * x <= t else "+1", 5, 4), rollout(lambda x, t: "+1", 5, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2, 0, False) (4, 0, False) {'x': 4, 'target': 5, 'left': 2}\n(1, 3) (0, 3)",
          "(2, 0, False) (4, 0, False) {'x': 1, 'target': 5, 'left': 4}\n(1, 3) (0, 3)",
          "(2, 0, False) (4, 0, False) {'x': 4, 'target': 5, 'left': 2}\n(1, 4) (0, 3)",
          "(2, 0, False) (3, 0, False) {'x': 3, 'target': 5, 'left': 2}\n(1, 3) (0, 3)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def measured_reward(p, f, g):
    return (1 - g) * p + f * (1 - p)                       # missed successes and accepted failures

def hack_wins(p, f, g, h):
    return h > measured_reward(p, f, g)                    # a policy that only fools the checker earns h

def curriculum_filter(stats, lo, hi):
    return sorted(t for t, (s, n) in stats.items() if lo <= s / n <= hi)

print(round(measured_reward(0.5, 0.1, 0.2), 4), hack_wins(0.5, 0.1, 0.2, 0.5), hack_wins(0.9, 0.1, 0.2, 0.5))
print(curriculum_filter({"a": (0, 8), "b": (3, 8), "c": (8, 8), "d": (6, 8)}, 0.1, 0.9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.45 True False\n['b', 'd']",
          "0.4 True False\n['b', 'd']",
          "0.45 False False\n['b', 'd']",
          "0.45 True False\n['a', 'b', 'd']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The state starts at x = 1 with a target and a number of steps left. Write <C>reset(target, max_steps)</C>;{" "}
          <C>step(state, action)</C> for actions &quot;+1&quot; and &quot;*2&quot;, where any other action returns
          &quot;invalid&quot;, every action uses a step, reaching the target gives reward 1 and ends the episode, and running
          out of steps ends it; and <C>rollout(policy, target, max_steps)</C> returning (reward, steps), where the policy
          takes x and the target.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def reset(target, max_steps):
    return {"x": 1, "target": target, "left": max_steps}

def step(state, action):
    return state["x"], 0, True

def rollout(policy, target, max_steps):
    return 0, max_steps
`,
        solution: ENV,
        tests: [
          { name: "step", code: `s = reset(3, 2)\nassert step(s, "*2") == (2, 0, False) and step(s, "+1") == (3, 1, True)` },
          { name: "roll", code: `assert rollout(lambda x, t: "jump", 4, 2) == (0, 2) and rollout(lambda x, t: "+1", 3, 5) == (1, 2)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>measured_reward(p, f, g)</C>, <C>hack_wins(p, f, g, h)</C>, and <C>curriculum_filter(stats, lo, hi)</C>{" "}
          for stats mapping task names to (successes, attempts), returning the sorted names whose success rate lies in [lo,
          hi].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def measured_reward(p, f, g):
    return p

def hack_wins(p, f, g, h):
    return False

def curriculum_filter(stats, lo, hi):
    return sorted(stats)
`,
        solution: REWARD,
        tests: [
          { name: "reward", code: `assert abs(measured_reward(1.0, 0.3, 0.25) - 0.75) < 1e-12 and hack_wins(0.0, 0.0, 0.0, 0.1) is True` },
          { name: "filter", code: `assert curriculum_filter({"x": (1, 2), "y": (2, 2)}, 0.0, 0.99) == ["x"]` },
        ],
      },
    },
    {
      key: "threshold",
      rung: "stretch",
      prompt: (
        <p>
          The checker accepts 5% of failures and misses 10% of successes, and a hack passes it 60% of the time. Above what
          true success rate does the honest policy earn more reward than the hack?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6471, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        An episode in such an environment can last hundreds of steps with one reward at the end. Assigning credit across so
        many actions, and training efficiently when rollouts take minutes, are the problems of long-horizon reinforcement
        learning.
      </p>
    </>
  ),
};
