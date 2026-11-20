import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReplayBufferViz } from "@/components/viz/ReplayBufferViz";
import type { LessonContent } from "@/lib/types";

const REPLAY = `def push(buffer, transition, capacity):
    buffer.append(transition)
    if len(buffer) > capacity:
        buffer.pop(0)

def sample(buffer, n, rng):
    return rng.sample(buffer, n)

def dqn_targets(batch, q_target, gamma):
    return [r if done else r + gamma * max(q_target(s2)) for s, a, r, s2, done in batch]`;

const DOUBLE = `def double_targets(batch, q_online, q_target, gamma):
    out = []
    for s, a, r, s2, done in batch:
        if done:
            out.append(r)
        else:
            q = q_online(s2)
            best = max(range(len(q)), key=lambda i: q[i])
            out.append(r + gamma * q_target(s2)[best])
    return out

def huber(x, delta=1.0):
    return 0.5 * x * x if abs(x) <= delta else delta * (abs(x) - 0.5 * delta)

def soft_update(target, online, tau):
    return [(1 - tau) * t + tau * o for t, o in zip(target, online)]`;

export const lesson: LessonContent = {
  id: "l6.5.2",
  minutes: 55,
  links: {
    requires: ["l6.5.1", "l6.4.5"],
    revisits: ["l3.2.1", "l6.1.2"],
    foreshadows: ["l6.5.3", "l6.6.5", "l6.8.4"],
  },

  puzzle: (
    <>
      <p>
        In 2013 a single program learnt to play dozens of video games from raw screen pixels and the score, often better than
        people, using the same network and settings for every game. Its learning rule was Q-learning, known since 1989, and
        Q-learning with neural networks had a reputation for diverging. What changed, so that a convolutional network trained
        on its own bootstrapped targets stayed stable?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two things make naive deep Q-learning unstable. Consecutive transitions are strongly correlated, so stochastic gradient
        descent sees a biased sample and the network chases whatever it saw last. And the target moves every time the network
        is updated, because the same network computes it. DQN fixes the first by storing transitions in a large replay buffer
        and training on random minibatches from it, and the second by computing targets with a copy of the network that is
        refreshed only occasionally.
      </p>
      <ReplayBufferViz />
    </>
  ),

  theory: (
    <>
      <Definition title="deep Q-network">
        <p>
          (Mnih et al., 2013 and 2015.) A network <M>{"Q(s, \\cdot\\,; \\theta)"}</M> outputs one value per action. For a transition{" "}
          <M>{"(s, a, r, s', d)"}</M> with d marking termination, the target and loss are
        </p>
        <MD>{"y = r + (1 - d)\\,\\gamma\\max_{a'}Q(s', a'; \\theta^-), \\qquad \\mathcal{L}(\\theta) = \\mathbb{E}\\bigl[\\ell\\bigl(y - Q(s, a; \\theta)\\bigr)\\bigr],"}</MD>
        <p>
          where <M>{"\\theta^-"}</M> are the parameters of the <em>target network</em> and ℓ is the squared or Huber loss. The gradient
          treats y as a constant: it is semi-gradient Q-learning (l6.5.1) on a network (l3.2.1).
        </p>
      </Definition>

      <Definition title="the training loop">
        <p>
          Act ε-greedily on <M>{"Q(\\cdot\\,; \\theta)"}</M>, with ε lowered from 1 to a small floor (l6.1.2). Store each transition in a
          replay buffer of fixed capacity, dropping the oldest (<C>push</C>). Every step, sample a minibatch uniformly (<C>sample</C>),
          compute targets with the target network (<C>dqn_targets</C>, where <C>q_target(s)</C> returns the list of action values),
          and take a gradient step on the loss. Every C steps copy <M>{"\\theta"}</M> into <M>{"\\theta^-"}</M>.
        </p>
        <Code>{REPLAY}</Code>
      </Definition>

      <Theorem title="a fixed target turns each phase into regression">
        <p>
          While <M>{"\\theta^-"}</M> and the buffer are held fixed, minimising the loss is ordinary least-squares regression of Q onto
          fixed targets, whose minimiser over all functions is <M>{"T^*Q(\\cdot\\,; \\theta^-)"}</M> on the state-action pairs of the
          buffer. So DQN approximates <em>fitted Q iteration</em>: each phase approximately applies the optimality operator to
          the previous Q.
        </p>
      </Theorem>
      <Proof>
        <p>
          For fixed <M>{"\\theta^-"}</M> the target y is a random variable depending only on the transition. The squared loss is
          minimised over all functions by the conditional mean, <M>{"\\mathbb{E}[y \\mid s, a] = \\sum_{s', r}p(s', r \\mid s, a)(r + \\gamma\\max_{a'}Q(s', a'; \\theta^-))"}</M>,
          which is <M>{"(T^*Q_{\\theta^-})(s, a)"}</M>. Exact minimisation would therefore be one step of Q-value iteration (l6.3.3);
          the network&apos;s approximation error and finite training make it an approximate step, and the contraction of{" "}
          <M>{"T^*"}</M> is no longer guaranteed once the projection onto the network&apos;s functions is included (l6.5.3).
        </p>
      </Proof>

      <Remark title="why replay helps">
        <p>
          Sampling uniformly from a large buffer makes minibatches closer to independent draws from a broad distribution,
          which is what stochastic gradient descent assumes, as the picture shows. Each transition is also reused many times,
          which matters when acting is expensive. The price is that the data come from older policies, so the learning must be
          off-policy: this is why replay is paired with Q-learning rather than SARSA. Prioritised replay samples transitions
          with large TD errors more often and corrects the bias with importance weights.
        </p>
      </Remark>

      <Definition title="double DQN and other refinements">
        <p>
          The maximum in the target overestimates values (l6.4.5). <em>Double DQN</em> (van Hasselt, Guez and Silver, 2016) chooses
          the next action with the online network and evaluates it with the target network:{" "}
          <M>{"y = r + \\gamma Q(s', \\arg\\max_{a'}Q(s', a'; \\theta); \\theta^-)"}</M> (<C>double_targets</C>). The <em>Huber loss</em> (
          <C>huber</C>) is quadratic for small errors and linear for large ones, which bounds the gradient from an outlying
          target. Instead of copying every C steps, many methods use <em>soft updates</em>{" "}
          <M>{"\\theta^- \\leftarrow (1 - \\tau)\\theta^- + \\tau\\theta"}</M> (<C>soft_update</C>).
        </p>
        <Code>{DOUBLE}</Code>
      </Definition>

      <Remark title="what the target network costs">
        <p>
          With soft updates, after n steps the target network has closed the fraction <M>{"1 - (1 - \\tau)^n"}</M> of its gap to a
          fixed online network: it lags by about <M>{"1/\\tau"}</M> steps. A slow target is stable but propagates new information
          slowly. Further refinements, such as separate value and advantage streams, multi-step targets and distributional
          values, were combined in Rainbow (Hessel et al., 2018). Continuous actions rule out the maximum over actions; actor-critic
          methods (l6.6.5) learn a policy to do that maximisation instead.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "y",
      rung: "check",
      prompt: (
        <p>
          A transition has reward 1 and does not end the episode. The target network&apos;s values in the next state are 2, 5 and 3,
          and γ = 0.99. What is the DQN target?
        </p>
      ),
      answer: { kind: "numeric", value: 5.95, tolerance: 0.0001 },
    },
    {
      key: "dy",
      rung: "check",
      prompt: (
        <p>
          For the same transition, the online network&apos;s values in the next state are 2, 5 and 3 and the target network&apos;s are 4, 1
          and 6. What is the double DQN target?
        </p>
      ),
      answer: { kind: "numeric", value: 1.99, tolerance: 0.0001 },
    },
    {
      key: "target",
      rung: "apply",
      prompt: <p>What problem does the target network address?</p>,
      answer: {
        kind: "choice",
        options: [
          "Without it, every update changes the targets as well as the predictions, so regression chases a moving target and can oscillate or diverge",
          "It removes the correlation between consecutive transitions",
          "It makes exploration unnecessary",
          "It removes the need for a discount factor",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def push(buffer, transition, capacity):
    buffer.append(transition)
    if len(buffer) > capacity:
        buffer.pop(0)

def sample(buffer, n, rng):
    return rng.sample(buffer, n)

def dqn_targets(batch, q_target, gamma):
    return [r if done else r + gamma * max(q_target(s2)) for s, a, r, s2, done in batch]

import random; buf = []; [push(buf, i, 3) for i in range(5)]; print(buf, len(sample(buf, 2, random.Random(0))), sorted(sample(buf, 3, random.Random(1))))
qt = {"x": [2.0, 5.0], "y": [1.0, 0.0]}.get; print(dqn_targets([("y", 0, 1.0, "x", False), ("x", 1, 3.0, "y", True), ("x", 0, 0.0, "y", False)], qt, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 3, 4] 2 [2, 3, 4]\n[3.5, 3.0, 0.5]",
          "[0, 1, 2] 2 [0, 1, 2]\n[3.5, 3.0, 0.5]",
          "[2, 3, 4] 2 [2, 3, 4]\n[3.5, 3.5, 0.5]",
          "[2, 3, 4] 2 [2, 3, 4]\n[2.0, 3.0, 0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def double_targets(batch, q_online, q_target, gamma):
    out = []
    for s, a, r, s2, done in batch:
        if done:
            out.append(r)
        else:
            q = q_online(s2)
            best = max(range(len(q)), key=lambda i: q[i])
            out.append(r + gamma * q_target(s2)[best])
    return out

def huber(x, delta=1.0):
    return 0.5 * x * x if abs(x) <= delta else delta * (abs(x) - 0.5 * delta)

def soft_update(target, online, tau):
    return [(1 - tau) * t + tau * o for t, o in zip(target, online)]

qo = {"x": [9.0, 1.0]}.get; qt = {"x": [2.0, 5.0]}.get; print(double_targets([("s", 0, 1.0, "x", False), ("s", 0, 4.0, "x", True)], qo, qt, 0.5), double_targets([("s", 0, 1.0, "x", False)], qt, qt, 0.5))
print(huber(0.5), huber(3.0), huber(-3.0, 2.0), soft_update([0.0, 10.0], [4.0, 0.0], 0.25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 4.0] [3.5]\n0.125 2.5 4.0 [1.0, 7.5]",
          "[3.5, 4.0] [3.5]\n0.125 2.5 4.0 [1.0, 7.5]",
          "[2.0, 4.0] [2.0]\n0.125 2.5 4.0 [1.0, 7.5]",
          "[2.0, 4.0] [3.5]\n0.125 4.5 4.0 [3.0, 2.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>push(buffer, transition, capacity)</C>, which appends and drops the oldest item when over capacity;{" "}
          <C>sample(buffer, n, rng)</C>, using <C>rng.sample</C>; and <C>dqn_targets(batch, q_target, gamma)</C> for a batch of (s, a, r, s2,
          done) tuples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def push(buffer, transition, capacity):
    pass

def sample(buffer, n, rng):
    return []

def dqn_targets(batch, q_target, gamma):
    return []
`,
        solution: REPLAY,
        tests: [
          { name: "buffer", code: `import random
buf = []
for i in range(5): push(buf, i, 3)
assert buf == [2, 3, 4]
buf2 = []
for i in range(2): push(buf2, i, 3)
assert buf2 == [0, 1] and sorted(sample(buf, 3, random.Random(1))) == [2, 3, 4] and sample(list(range(10)), 4, random.Random(7)) == random.Random(7).sample(list(range(10)), 4)` },
          { name: "targets", code: `qt = {"x": [2.0, 5.0], "y": [1.0, 0.0]}.get
assert dqn_targets([("y", 0, 1.0, "x", False), ("x", 1, 3.0, "y", True), ("x", 0, 0.0, "y", False)], qt, 0.5) == [3.5, 3.0, 0.5] and dqn_targets([], qt, 0.5) == []
assert abs(dqn_targets([("s", 0, 1.0, "t", False)], {"t": [2.0, 5.0, 3.0]}.get, 0.99)[0] - 5.95) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>double_targets(batch, q_online, q_target, gamma)</C>, choosing the first best action of the online network;{" "}
          <C>huber(x, delta=1.0)</C>; and <C>soft_update(target, online, tau)</C> for lists of weights.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def double_targets(batch, q_online, q_target, gamma):
    return []

def huber(x, delta=1.0):
    return 0.0

def soft_update(target, online, tau):
    return target
`,
        solution: DOUBLE,
        tests: [
          { name: "double", code: `qo = {"x": [9.0, 1.0]}.get; qt = {"x": [2.0, 5.0]}.get
assert double_targets([("s", 0, 1.0, "x", False), ("s", 0, 4.0, "x", True)], qo, qt, 0.5) == [2.0, 4.0] and double_targets([("s", 0, 1.0, "x", False)], qt, qt, 0.5) == [3.5]
assert abs(double_targets([("s", 0, 1.0, "t", False)], {"t": [2.0, 5.0, 3.0]}.get, {"t": [4.0, 1.0, 6.0]}.get, 0.99)[0] - 1.99) < 1e-12` },
          { name: "huber", code: `assert huber(0.5) == 0.125 and huber(3.0) == 2.5 and huber(-3.0, 2.0) == 4.0 and huber(-1.0) == 0.5 and huber(0) == 0
assert soft_update([0.0, 10.0], [4.0, 0.0], 0.25) == [1.0, 7.5] and soft_update([1.0], [5.0], 1.0) == [5.0] and soft_update([], [], 0.1) == []` },
        ],
      },
    },
    {
      key: "lag",
      rung: "stretch",
      prompt: (
        <p>
          With soft updates at τ = 0.005 and a fixed online network, after how many updates has the target network first closed at
          least 90% of the gap?
        </p>
      ),
      answer: { kind: "numeric", value: 460, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Replay and target networks tame the instability of deep Q-learning in practice but do not remove its cause. The next
        lesson (l6.5.3) shows, with a two-state example, that function approximation, bootstrapping and off-policy updates
        together can drive the weights to infinity, and looks at what can be done about it.
      </p>
    </>
  ),
};
