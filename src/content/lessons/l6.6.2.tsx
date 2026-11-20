import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReinforceCorridorViz } from "@/components/viz/ReinforceCorridorViz";
import type { LessonContent } from "@/lib/types";

const REINFORCE = `import math

STEP = [(0, 1), (2, 0), (1, None)]

def run_episode(theta, rng, max_steps=1000):
    p = 1 / (1 + math.exp(-theta))
    s, episode = 0, []
    while s is not None and len(episode) < max_steps:
        a = 1 if rng.random() < p else 0
        episode.append((s, a, -1.0))
        s = STEP[s][a]
    return episode

def returns(rewards, gamma):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + gamma * g
        out.append(g)
    return out[::-1]

def reinforce_update(theta, episode, alpha, gamma):
    p = 1 / (1 + math.exp(-theta))
    G = returns([r for _, _, r in episode], gamma)
    grad = sum(gamma ** t * g * ((1 - p) if a == 1 else -p) for t, ((_, a, _), g) in enumerate(zip(episode, G)))
    return theta + alpha * grad`;

const POLICIES = `import math

def sample(probs, u):
    acc = 0.0
    for a, p in enumerate(probs):
        acc += p
        if u < acc:
            return a
    return len(probs) - 1

def linear_score(theta, feats, a):
    prefs = [sum(t * x for t, x in zip(theta, f)) for f in feats]
    m = max(prefs)
    e = [math.exp(h - m) for h in prefs]
    pi = [x / sum(e) for x in e]
    return [feats[a][i] - sum(pi[b] * feats[b][i] for b in range(len(feats))) for i in range(len(theta))]

def gaussian_score(mu, sigma, a):
    return (a - mu) / sigma ** 2, ((a - mu) ** 2 - sigma ** 2) / sigma ** 3`;

export const lesson: LessonContent = {
  id: "l6.6.2",
  minutes: 50,
  links: {
    requires: ["l6.6.1", "l6.4.1"],
    revisits: ["m13.6.1", "l3.3.2"],
    foreshadows: ["l6.6.3", "l6.7.3"],
  },

  puzzle: (
    <>
      <p>
        The policy gradient theorem weights each action&apos;s score by its value <M>{"q_\\pi(s, a)"}</M>, which the agent does not know.
        Learning q first would bring back all the difficulties of value learning. Is there a way to follow the policy gradient
        using nothing but the episodes the policy plays?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The return that followed an action is a sample of that action&apos;s value, exactly as in Monte Carlo evaluation. Put it in
        place of q: after each episode, make every action that was taken more likely in proportion to the return that came
        after it. Actions followed by good returns gain probability and actions followed by poor ones lose it, and on average
        this is the true gradient. The catch is noise: one episode is a poor estimate, so the step size must be small, and too
        large a step can throw the policy somewhere it cannot recover from.
      </p>
      <ReinforceCorridorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="REINFORCE">
        <p>
          (Williams, 1992.) Play an episode <M>{"S_0, A_0, R_1, \\dots, S_{T-1}, A_{T-1}, R_T"}</M> with <M>{"\\pi_\\theta"}</M>, compute the returns{" "}
          <M>{"G_t = \\sum_{k > t}\\gamma^{k-t-1}R_k"}</M> (<C>returns</C>), and update
        </p>
        <MD>{"\\theta \\leftarrow \\theta + \\alpha\\sum_{t=0}^{T-1}\\gamma^tG_t\\,\\nabla\\log\\pi(A_t \\mid S_t, \\theta)."}</MD>
        <p>
          On the corridor with <M>{"\\pi(\\text{right}) = p = \\sigma(\\theta)"}</M>, the score is 1 − p after right and −p after left (
          <C>reinforce_update</C>). Here θ is held fixed for the whole episode, which is how the method is usually run.
        </p>
        <Code>{REINFORCE}</Code>
      </Definition>

      <Theorem title="REINFORCE is unbiased">
        <p>
          With γ = 1, the expected update direction equals the policy gradient:{" "}
          <M>{"\\mathbb{E}\\bigl[\\sum_tG_t\\nabla\\log\\pi(A_t \\mid S_t)\\bigr] = \\nabla J(\\theta)"}</M>. So with suitably decreasing steps
          REINFORCE is stochastic gradient ascent on J, and converges to a local optimum.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the Markov property, given <M>{"S_t = s"}</M> and <M>{"A_t = a"}</M> the rewards after t are distributed as from a fresh
          start in s with first action a, so <M>{"\\mathbb{E}[G_t \\mid S_t, A_t] = q_\\pi(S_t, A_t)"}</M>. The score depends only on{" "}
          <M>{"(S_t, A_t)"}</M>, so by the tower rule{" "}
          <M>{"\\mathbb{E}[G_t\\nabla\\log\\pi(A_t \\mid S_t)] = \\mathbb{E}[q_\\pi(S_t, A_t)\\nabla\\log\\pi(A_t \\mid S_t)]"}</M>. Summing over t gives
          the score-function form of the policy gradient theorem (l6.6.1).
        </p>
      </Proof>

      <Theorem title="past rewards contribute nothing">
        <p>
          For any quantity X determined by the history before <M>{"A_t"}</M>, including the rewards already received,{" "}
          <M>{"\\mathbb{E}[X\\,\\nabla\\log\\pi(A_t \\mid S_t)] = 0"}</M>. So weighting every score by the whole episode&apos;s return is also
          unbiased, but it adds noise; using the reward-to-go <M>{"G_t"}</M> drops terms whose mean is zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          Condition on the history up to <M>{"S_t"}</M>. Then X is fixed and{" "}
          <M>{"\\mathbb{E}[\\nabla\\log\\pi(A_t \\mid S_t) \\mid \\text{history}] = \\sum_a\\pi(a \\mid S_t)\\frac{\\nabla\\pi(a \\mid S_t)}{\\pi(a \\mid S_t)} = \\nabla\\sum_a\\pi(a \\mid S_t) = \\nabla 1 = 0"}</M>.
          This is the identity behind the score-function estimator (m13.6.1).
        </p>
      </Proof>

      <Definition title="policy parametrisations">
        <p>
          With linear preferences <M>{"h(s, a) = \\theta^\\top x(s, a)"}</M> and a softmax (l3.3.2), the score is{" "}
          <M>{"x(s, a) - \\sum_b\\pi(b \\mid s)x(s, b)"}</M>: the features of the chosen action minus their average under the policy (
          <C>linear_score</C>, with one feature vector per action). For a continuous action drawn from a Gaussian{" "}
          <M>{"\\mathcal{N}(\\mu, \\sigma^2)"}</M>, the score is <M>{"(a - \\mu)/\\sigma^2"}</M> for μ and{" "}
          <M>{"((a - \\mu)^2 - \\sigma^2)/\\sigma^3"}</M> for σ (<C>gaussian_score</C>); a network that outputs μ and σ is then trained by
          the chain rule. Actions are drawn from a discrete policy by inverting its cumulative distribution (<C>sample</C>).
        </p>
        <Code>{POLICIES}</Code>
      </Definition>

      <Remark title="variance and step size">
        <p>
          Each <M>{"G_t"}</M> sums many random rewards, so its variance grows with the length of the episode, and every update
          is a single noisy sample. The picture shows the consequence: a step small enough to average out the noise learns
          slowly, and a large step can push the policy close to deterministic, where the score is nearly zero and learning
          stalls. The next lesson (l6.6.3) cuts the variance without adding bias. REINFORCE is also strictly on-policy: an
          episode is used for one update and then discarded, because after the update it no longer comes from{" "}
          <M>{"\\pi_\\theta"}</M>; reusing data safely is the subject of PPO (l6.7.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "g",
      rung: "check",
      prompt: <p>An episode has rewards 0, 0 and 1, and γ = 0.9. What is the return from the first step?</p>,
      answer: { kind: "numeric", value: 0.81, tolerance: 0.0001 },
    },
    {
      key: "step",
      rung: "check",
      prompt: (
        <p>
          A one-step task has π(right) = σ(θ) with θ = 0. The agent goes right and receives 4. With α = 0.1, what is θ after the
          REINFORCE update?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does REINFORCE need many episodes even though its updates are unbiased?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each return is a single noisy sample of the action value, so the updates have high variance and the step size must be small",
          "Its updates point in the opposite direction to the gradient half the time by design",
          "It must first learn the dynamics of the environment",
          "It only updates the policy at the end of training",
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

STEP = [(0, 1), (2, 0), (1, None)]

def run_episode(theta, rng, max_steps=1000):
    p = 1 / (1 + math.exp(-theta))
    s, episode = 0, []
    while s is not None and len(episode) < max_steps:
        a = 1 if rng.random() < p else 0
        episode.append((s, a, -1.0))
        s = STEP[s][a]
    return episode

def returns(rewards, gamma):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + gamma * g
        out.append(g)
    return out[::-1]

def reinforce_update(theta, episode, alpha, gamma):
    p = 1 / (1 + math.exp(-theta))
    G = returns([r for _, _, r in episode], gamma)
    grad = sum(gamma ** t * g * ((1 - p) if a == 1 else -p) for t, ((_, a, _), g) in enumerate(zip(episode, G)))
    return theta + alpha * grad

ep = [(0, 1, -1.0), (1, 0, -1.0), (2, 1, -1.0)]
print(returns([1.0, 0.0, 2.0], 0.5), returns([r for _, _, r in ep], 1.0), reinforce_update(0.0, ep, 0.5, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5, 1.0, 2.0] [-3.0, -2.0, -1.0] -0.5",
          "[2.0, 1.0, 1.5] [-3.0, -2.0, -1.0] -0.5",
          "[1.5, 1.0, 2.0] [-1.0, -2.0, -3.0] 0.5",
          "[1.5, 1.0, 2.0] [-3.0, -2.0, -1.0] -1.5",
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

def sample(probs, u):
    acc = 0.0
    for a, p in enumerate(probs):
        acc += p
        if u < acc:
            return a
    return len(probs) - 1

def linear_score(theta, feats, a):
    prefs = [sum(t * x for t, x in zip(theta, f)) for f in feats]
    m = max(prefs)
    e = [math.exp(h - m) for h in prefs]
    pi = [x / sum(e) for x in e]
    return [feats[a][i] - sum(pi[b] * feats[b][i] for b in range(len(feats))) for i in range(len(theta))]

def gaussian_score(mu, sigma, a):
    return (a - mu) / sigma ** 2, ((a - mu) ** 2 - sigma ** 2) / sigma ** 3

print([sample([0.2, 0.5, 0.3], u) for u in (0.1, 0.2, 0.69, 0.95)], linear_score([0.0, 0.0], [[1.0, 0.0], [0.0, 1.0]], 0))
print(linear_score([math.log(3), 0.0], [[1.0, 0.0], [0.0, 1.0]], 1), gaussian_score(1.0, 2.0, 3.0), gaussian_score(0.0, 1.0, 2.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 1, 1, 2] [0.5, -0.5]\n[-0.75, 0.75] (0.5, 0.0) (2.0, 3.0)",
          "[0, 0, 1, 2] [0.5, -0.5]\n[-0.75, 0.75] (0.5, 0.0) (2.0, 3.0)",
          "[0, 1, 1, 2] [0.5, 0.5]\n[-0.25, 0.25] (0.5, 0.0) (2.0, 3.0)",
          "[0, 1, 1, 2] [0.5, -0.5]\n[-0.75, 0.75] (1.0, 0.5) (2.0, 4.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          On the corridor with <C>STEP</C>, write <C>run_episode(theta, rng, max_steps=1000)</C>, choosing right when{" "}
          <C>rng.random() &lt; p</C> and recording (s, a, −1.0) with a = 1 for right; <C>returns(rewards, gamma)</C>; and{" "}
          <C>reinforce_update(theta, episode, alpha, gamma)</C> with the factor <M>{"\\gamma^t"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

STEP = [(0, 1), (2, 0), (1, None)]

def run_episode(theta, rng, max_steps=1000):
    return []

def returns(rewards, gamma):
    return [0.0] * len(rewards)

def reinforce_update(theta, episode, alpha, gamma):
    return theta
`,
        solution: REINFORCE,
        tests: [
          { name: "episode", code: `class Seq:
    def __init__(self, xs): self.xs = iter(xs)
    def random(self): return next(self.xs)
assert run_episode(0.0, Seq([0.1, 0.9, 0.1])) == [(0, 1, -1.0), (1, 0, -1.0), (2, 1, -1.0)]
assert [s for s, _, _ in run_episode(0.0, Seq([0.9, 0.1, 0.1, 0.9, 0.1]), 5)] == [0, 0, 1, 0, 0]
assert returns([1.0, 0.0, 2.0], 0.5) == [1.5, 1.0, 2.0] and returns([], 0.9) == []` },
          { name: "update", code: `ep = [(0, 1, -1.0), (1, 0, -1.0), (2, 1, -1.0)]
assert abs(reinforce_update(0.0, ep, 0.5, 1.0) + 0.5) < 1e-12 and abs(reinforce_update(0.0, ep, 1.0, 0.5) + 0.625) < 1e-12
assert abs(reinforce_update(math.log(3), ep, 1.0, 1.0) - math.log(3) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample(probs, u)</C>, returning the first action whose cumulative probability exceeds u;{" "}
          <C>linear_score(theta, feats, a)</C> for a softmax over <C>theta · feats[b]</C>; and <C>gaussian_score(mu, sigma, a)</C>, the
          pair of derivatives of <M>{"\\log\\mathcal{N}(a; \\mu, \\sigma^2)"}</M> with respect to μ and σ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sample(probs, u):
    return 0

def linear_score(theta, feats, a):
    return [0.0] * len(theta)

def gaussian_score(mu, sigma, a):
    return 0.0, 0.0
`,
        solution: POLICIES,
        tests: [
          { name: "sample", code: `assert [sample([0.2, 0.5, 0.3], u) for u in (0.0, 0.1, 0.2, 0.69, 0.7, 0.95)] == [0, 0, 1, 1, 2, 2] and sample([0.0, 1.0], 0.0) == 1
s = gaussian_score(1.0, 2.0, 3.0)
assert abs(s[0] - 0.5) < 1e-12 and abs(s[1]) < 1e-12 and all(abs(x - y) < 1e-12 for x, y in zip(gaussian_score(0.0, 1.0, 2.0), (2.0, 3.0)))` },
          { name: "score", code: `th, F = [0.3, -0.7], [[1.0, 0.0], [0.5, 2.0], [-1.0, 1.0]]
def logp(t, a):
    h = [sum(x * y for x, y in zip(t, f)) for f in F]
    return h[a] - math.log(sum(math.exp(v) for v in h))
for a in range(3):
    fd = [(logp([th[j] + 1e-6 * (j == i) for j in range(2)], a) - logp([th[j] - 1e-6 * (j == i) for j in range(2)], a)) / 2e-6 for i in range(2)]
    assert all(abs(x - y) < 1e-6 for x, y in zip(linear_score(th, F, a), fd))` },
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: (
        <p>
          A one-step task has π(right) = σ(θ) with θ = 0, and the rewards are always 4 for right and 2 for left. What is the
          variance of the REINFORCE estimate <M>{"G\\,\\partial\\log\\pi(A)/\\partial\\theta"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2.25, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        In the stretch exercise most of the variance comes from the rewards being large and positive whichever action is
        taken. Subtracting a baseline from the return, the subject of the next lesson (l6.6.3), removes that part without
        changing the expected update.
      </p>
    </>
  ),
};
