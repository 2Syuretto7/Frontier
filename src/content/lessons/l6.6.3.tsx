import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AdvantageVarianceViz } from "@/components/viz/AdvantageVarianceViz";
import type { LessonContent } from "@/lib/types";

const VARIANCE = `def advantages(rewards, values, gamma):
    out, g = [], 0.0
    for r, v in zip(reversed(rewards), reversed(values)):
        g = r + gamma * g
        out.append(g - v)
    return out[::-1]

def estimator_stats(probs, scores, rewards, b):
    k = len(scores[0])
    mean = [sum(p * (r - b) * s[i] for p, s, r in zip(probs, scores, rewards)) for i in range(k)]
    second = sum(p * (r - b) ** 2 * sum(x * x for x in s) for p, s, r in zip(probs, scores, rewards))
    return mean, second - sum(m * m for m in mean)

def optimal_baseline(probs, scores, rewards):
    sq = [sum(x * x for x in s) for s in scores]
    return sum(p * r * q for p, r, q in zip(probs, rewards, sq)) / sum(p * q for p, q in zip(probs, sq))`;

const BASELINE = `import math

def update_baseline(V, episode, gamma, alpha):
    V, g, G = list(V), 0.0, []
    for _, _, r in reversed(episode):
        g = r + gamma * g
        G.append(g)
    for (s, _, _), g in zip(episode, reversed(G)):
        V[s] += alpha * (g - V[s])
    return V

def policy_step(theta, episode, V, gamma, alpha):
    new, g, G = [list(row) for row in theta], 0.0, []
    for _, _, r in reversed(episode):
        g = r + gamma * g
        G.append(g)
    for t, ((s, a, _), g) in enumerate(zip(episode, reversed(G))):
        e = [math.exp(x - max(theta[s])) for x in theta[s]]
        pi = [x / sum(e) for x in e]
        for b in range(len(pi)):
            new[s][b] += alpha * gamma ** t * (g - V[s]) * ((b == a) - pi[b])
    return new

def normalise(xs, eps=1e-8):
    m = sum(xs) / len(xs)
    sd = math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))
    return [(x - m) / (sd + eps) for x in xs]`;

export const lesson: LessonContent = {
  id: "l6.6.3",
  minutes: 50,
  links: {
    requires: ["l6.6.2"],
    revisits: ["m13.1.2", "m13.6.1", "l6.2.3"],
    foreshadows: ["l6.6.4", "l6.6.5", "l6.7.3"],
  },

  puzzle: (
    <>
      <p>
        Add 10 to every reward of a fixed-length task. No decision changes, and the policy gradient is exactly the same. But
        REINFORCE now multiplies every score by a large positive return, so every action taken is pushed up, and only the
        small differences between those pushes carry information. The estimate becomes far noisier. How can the learner be
        made indifferent to such a shift?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        What matters is not whether a return is large, but whether it is larger than expected. Subtract from each return a
        baseline that does not depend on the action taken, ideally the value of the state, and use the difference: positive
        means the action did better than usual and should become more likely, negative means worse. The expected update does
        not change, because the subtracted part averages to zero, but most of the noise goes with it.
      </p>
      <AdvantageVarianceViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="baselines add no bias">
        <p>
          For any function b of the state (or of the history before the action, but not of the action itself),
        </p>
        <MD>{"\\nabla J(\\theta) = \\mathbb{E}\\Bigl[\\sum_t\\bigl(G_t - b(S_t)\\bigr)\\nabla\\log\\pi(A_t \\mid S_t, \\theta)\\Bigr]."}</MD>
      </Theorem>
      <Proof>
        <p>
          Conditioning on <M>{"S_t"}</M>, <M>{"\\mathbb{E}[b(S_t)\\nabla\\log\\pi(A_t \\mid S_t) \\mid S_t] = b(S_t)\\nabla\\sum_a\\pi(a \\mid S_t) = 0"}</M>, as
          in l6.6.2. So subtracting the baseline term removes something whose mean is zero. The baseline is a control variate
          (m13.1.2): a quantity with known mean zero that is correlated with the estimate.
        </p>
      </Proof>

      <Definition title="the advantage">
        <p>
          The <em>advantage</em> of an action is <M>{"a_\\pi(s, a) = q_\\pi(s, a) - v_\\pi(s)"}</M>: how much better it is than the
          policy&apos;s average in that state (l6.2.3). It satisfies <M>{"\\sum_a\\pi(a \\mid s)a_\\pi(s, a) = 0"}</M>, and the policy gradient
          theorem holds with <M>{"a_\\pi"}</M> in place of <M>{"q_\\pi"}</M>. With the baseline <M>{"b = v_\\pi"}</M>, the weight{" "}
          <M>{"G_t - v_\\pi(S_t)"}</M> is an unbiased estimate of the advantage (<C>advantages</C>).
        </p>
      </Definition>

      <Theorem title="the variance-minimising constant baseline">
        <p>
          For a one-step estimate <M>{"g = (G - b)s"}</M> with score <M>{"s = \\nabla\\log\\pi(A)"}</M>, the total variance{" "}
          <M>{"\\mathbb{E}\\|g\\|^2 - \\|\\mathbb{E}g\\|^2"}</M> is minimised over constants b by
        </p>
        <MD>{"b^* = \\frac{\\mathbb{E}\\bigl[G\\,\\|s\\|^2\\bigr]}{\\mathbb{E}\\bigl[\\|s\\|^2\\bigr]},"}</MD>
        <p>
          a weighted average of the returns, with weights given by the squared length of the score. It equals the value{" "}
          <M>{"\\mathbb{E}[G]"}</M> only when <M>{"\\|s\\|^2"}</M> is uncorrelated with G.
        </p>
      </Theorem>
      <Proof>
        <p>
          The mean <M>{"\\mathbb{E}g"}</M> does not depend on b, by the previous theorem. The second moment{" "}
          <M>{"\\mathbb{E}[(G - b)^2\\|s\\|^2] = \\mathbb{E}[G^2\\|s\\|^2] - 2b\\,\\mathbb{E}[G\\|s\\|^2] + b^2\\,\\mathbb{E}[\\|s\\|^2]"}</M> is a quadratic in b
          with positive leading coefficient, minimised where its derivative vanishes, at <M>{"b^*"}</M>. The code computes the
          exact mean and variance for a discrete policy (<C>estimator_stats</C>) and <M>{"b^*"}</M> (<C>optimal_baseline</C>); m13.6.1 met
          the same formula for a Bernoulli variable.
        </p>
        <Code>{VARIANCE}</Code>
      </Proof>

      <Remark title="why the state value">
        <p>
          The optimal baseline depends on the score, which changes with θ, and is awkward to estimate. The state value is
          nearly as good, easy to learn, and above all it moves with the state: in the picture, returns shrink as the episode
          runs out, and only a baseline that depends on the state can follow them. A learned value also gives the baseline a
          meaning, the advantage, that the next lessons build on.
        </p>
      </Remark>

      <Definition title="REINFORCE with baseline">
        <p>
          Keep a value estimate <M>{"\\hat v(s, w)"}</M>. After each episode, move it towards the returns by gradient Monte Carlo (l6.5.1;
          tabular here, <C>update_baseline</C>), and update the policy with the weights <M>{"G_t - \\hat v(S_t, w)"}</M>:{" "}
          <M>{"\\theta \\leftarrow \\theta + \\alpha\\sum_t\\gamma^t(G_t - \\hat v(S_t, w))\\nabla\\log\\pi(A_t \\mid S_t, \\theta)"}</M> (
          <C>policy_step</C>, for a tabular softmax with the probabilities taken before the update). The baseline need not be
          accurate for the estimate to stay unbiased; it only has to be fixed while the episode is scored.
        </p>
        <Code>{BASELINE}</Code>
      </Definition>

      <Remark title="normalising advantages">
        <p>
          Many implementations standardise the advantages in each batch to mean zero and unit standard deviation (
          <C>normalise</C>). Subtracting the batch mean is a data-dependent baseline, and dividing by the spread rescales the
          step so that its size no longer depends on the scale of the rewards. Both introduce a small bias, since the batch
          statistics depend on the actions, but they make one step size work across tasks; PPO (l6.7.3) does this by default.
          Replacing the return itself by a bootstrapped estimate cuts the variance further at the price of bias, the subject of
          l6.6.4 and l6.6.5.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "adv",
      rung: "check",
      prompt: <p>In some state, q(s, a) = 5 and v(s) = 3.5. What is the advantage of a?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "var1",
      rung: "check",
      prompt: (
        <p>
          A one-step task has π(right) = σ(θ) with θ = 0 and deterministic rewards 4 for right and 2 for left. With the baseline b
          = 1, what is the variance of the estimate <M>{"(G - b)\\,\\partial\\log\\pi(A)/\\partial\\theta"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "dep",
      rung: "apply",
      prompt: <p>Which of these can be used as a baseline without biasing the policy gradient estimate?</p>,
      answer: {
        kind: "choice",
        options: [
          "Any function of the state, such as a learned estimate of its value",
          "The value of the action actually taken, q(S_t, A_t)",
          "The return G_t itself",
          "Any function of the action taken",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def advantages(rewards, values, gamma):
    out, g = [], 0.0
    for r, v in zip(reversed(rewards), reversed(values)):
        g = r + gamma * g
        out.append(g - v)
    return out[::-1]

def estimator_stats(probs, scores, rewards, b):
    k = len(scores[0])
    mean = [sum(p * (r - b) * s[i] for p, s, r in zip(probs, scores, rewards)) for i in range(k)]
    second = sum(p * (r - b) ** 2 * sum(x * x for x in s) for p, s, r in zip(probs, scores, rewards))
    return mean, second - sum(m * m for m in mean)

def optimal_baseline(probs, scores, rewards):
    sq = [sum(x * x for x in s) for s in scores]
    return sum(p * r * q for p, r, q in zip(probs, rewards, sq)) / sum(p * q for p, q in zip(probs, sq))

print(advantages([0.0, 0.0, 1.0], [0.5, 0.75, 0.25], 1.0), advantages([1.0, 1.0], [0.0, 0.0], 0.5))
print(estimator_stats([0.5, 0.5], [[0.5], [-0.5]], [4.0, 2.0], 0.0), estimator_stats([0.5, 0.5], [[0.5], [-0.5]], [4.0, 2.0], 3.0), optimal_baseline([0.5, 0.5], [[0.5], [-0.5]], [4.0, 2.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.25, 0.75] [1.5, 1.0]\n([0.5], 2.25) ([0.5], 0.0) 3.0",
          "[0.5, 0.25, 0.75] [1.5, 1.0]\n([0.5], 2.25) ([0.0], 0.0) 3.0",
          "[-0.5, -0.75, 0.75] [1.5, 1.0]\n([0.5], 2.25) ([0.5], 0.0) 3.0",
          "[0.5, 0.25, 0.75] [1.0, 1.5]\n([0.5], 2.5) ([0.5], 0.25) 3.0",
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

def update_baseline(V, episode, gamma, alpha):
    V, g, G = list(V), 0.0, []
    for _, _, r in reversed(episode):
        g = r + gamma * g
        G.append(g)
    for (s, _, _), g in zip(episode, reversed(G)):
        V[s] += alpha * (g - V[s])
    return V

def policy_step(theta, episode, V, gamma, alpha):
    new, g, G = [list(row) for row in theta], 0.0, []
    for _, _, r in reversed(episode):
        g = r + gamma * g
        G.append(g)
    for t, ((s, a, _), g) in enumerate(zip(episode, reversed(G))):
        e = [math.exp(x - max(theta[s])) for x in theta[s]]
        pi = [x / sum(e) for x in e]
        for b in range(len(pi)):
            new[s][b] += alpha * gamma ** t * (g - V[s]) * ((b == a) - pi[b])
    return new

def normalise(xs, eps=1e-8):
    m = sum(xs) / len(xs)
    sd = math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))
    return [(x - m) / (sd + eps) for x in xs]

ep = [(0, 1, 0.0), (1, 0, 2.0)]; print(update_baseline([0.0, 0.0], ep, 1.0, 0.5), policy_step([[0.0, 0.0], [0.0, 0.0]], ep, [1.0, 1.0], 1.0, 1.0))
print([round(x, 4) for x in normalise([1.0, 2.0, 3.0])], [round(x, 4) for x in normalise([5.0, 5.0])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0] [[-0.5, 0.5], [0.5, -0.5]]\n[-1.2247, 0.0, 1.2247] [0.0, 0.0]",
          "[1.0, 1.0] [[-1.0, 1.0], [1.0, -1.0]]\n[-1.2247, 0.0, 1.2247] [0.0, 0.0]",
          "[0.0, 1.0] [[-0.5, 0.5], [0.5, -0.5]]\n[-1.2247, 0.0, 1.2247] [0.0, 0.0]",
          "[1.0, 1.0] [[-0.5, 0.5], [0.5, -0.5]]\n[-1.0, 0.0, 1.0] [0.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>advantages(rewards, values, gamma)</C>, returning <M>{"G_t - V_t"}</M> for each step;{" "}
          <C>estimator_stats(probs, scores, rewards, b)</C>, returning the mean vector and total variance of the one-step estimate (G
          − b)·score when action a has probability <C>probs[a]</C>, score vector <C>scores[a]</C> and reward <C>rewards[a]</C>; and{" "}
          <C>optimal_baseline(probs, scores, rewards)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def advantages(rewards, values, gamma):
    return []

def estimator_stats(probs, scores, rewards, b):
    return [0.0] * len(scores[0]), 0.0

def optimal_baseline(probs, scores, rewards):
    return 0.0
`,
        solution: VARIANCE,
        tests: [
          { name: "advantages", code: `assert advantages([0.0, 0.0, 1.0], [0.5, 0.75, 0.25], 1.0) == [0.5, 0.25, 0.75] and advantages([1.0, 1.0], [0.0, 0.0], 0.5) == [1.5, 1.0]
assert advantages([], [], 0.9) == [] and advantages([2.0], [3.0], 0.0) == [-1.0]` },
          { name: "variance", code: `m, v = estimator_stats([0.5, 0.5], [[0.5], [-0.5]], [4.0, 2.0], 1.0)
assert abs(m[0] - 0.5) < 1e-12 and abs(v - 1.0) < 1e-12
P, S, Rw = [0.5, 0.3, 0.2], [[0.5, -0.3, -0.2], [-0.5, 0.7, -0.2], [-0.5, -0.3, 0.8]], [8.0, 10.0, 12.0]
b = optimal_baseline(P, S, Rw)
assert abs(b - 6.212 / 0.62) < 1e-9 and all(estimator_stats(P, S, Rw, b)[1] < estimator_stats(P, S, Rw, b + d)[1] for d in (-0.5, 0.5))
assert all(abs(x - y) < 1e-12 for x, y in zip(estimator_stats(P, S, Rw, b)[0], estimator_stats(P, S, Rw, 0.0)[0]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For episodes of (s, a, r) triples, write <C>update_baseline(V, episode, gamma, alpha)</C>, moving <C>V[s]</C> towards each
          return in order and returning a new list; <C>policy_step(theta, episode, V, gamma, alpha)</C> for a tabular softmax, using
          the probabilities of the original <C>theta</C> and returning new rows; and <C>normalise(xs, eps=1e-8)</C>, using the
          population standard deviation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def update_baseline(V, episode, gamma, alpha):
    return list(V)

def policy_step(theta, episode, V, gamma, alpha):
    return [list(row) for row in theta]

def normalise(xs, eps=1e-8):
    return list(xs)
`,
        solution: BASELINE,
        tests: [
          { name: "baseline", code: `ep = [(0, 1, 0.0), (1, 0, 2.0)]
V0 = [0.0, 0.0]
assert update_baseline(V0, ep, 1.0, 0.5) == [1.0, 1.0] and V0 == [0.0, 0.0]
assert update_baseline([0.0], [(0, 0, 1.0), (0, 0, 1.0)], 1.0, 0.5) == [1.0]
n = normalise([1.0, 2.0, 3.0])
assert abs(n[0] + 1.5 ** 0.5) < 1e-6 and abs(sum(n)) < 1e-9 and normalise([5.0, 5.0]) == [0.0, 0.0]` },
          { name: "policy", code: `ep = [(0, 1, 0.0), (1, 0, 2.0)]
th = [[0.0, 0.0], [0.0, 0.0]]
assert policy_step(th, ep, [1.0, 1.0], 1.0, 1.0) == [[-0.5, 0.5], [0.5, -0.5]] and th == [[0.0, 0.0], [0.0, 0.0]]
out = policy_step([[math.log(3), 0.0]], [(0, 0, 1.0), (0, 1, 1.0)], [0.5], 0.5, 1.0)
assert all(abs(x - y) < 1e-12 for x, y in zip(out[0], [math.log(3) + 0.0625, -0.0625]))` },
        ],
      },
    },
    {
      key: "opt",
      rung: "stretch",
      prompt: (
        <p>
          A one-step task has π(right) = σ(θ) = 0.8 and deterministic rewards 4 for right and 2 for left. What is the
          variance-minimising constant baseline?
        </p>
      ),
      answer: { kind: "numeric", value: 2.4, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The baseline removes the part of the return that the state predicts, but <M>{"G_t"}</M> still carries the noise of every
        later reward. The next lesson (l6.6.4) blends Monte Carlo returns with bootstrapped values to trade that variance
        against bias, with one parameter that slides between the two.
      </p>
    </>
  ),
};
