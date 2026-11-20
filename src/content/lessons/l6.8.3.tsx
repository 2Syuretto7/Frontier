import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PuctSearchViz } from "@/components/viz/PuctSearchViz";
import type { LessonContent } from "@/lib/types";

const PIECES = `import math

def puct_score(q, p, n_parent, n, c):
    return q + c * p * math.sqrt(n_parent) / (1 + n)

def visit_policy(counts, tau):
    if tau == 0:
        best = counts.index(max(counts))
        return [1.0 if i == best else 0.0 for i in range(len(counts))]
    w = [n ** (1 / tau) for n in counts]
    return [x / sum(w) for x in w]

def add_noise(prior, noise, eps):
    return [(1 - eps) * p + eps * x for p, x in zip(prior, noise)]`;

const LOOP = `import math

def az_loss(z, v, pi, p):
    return (z - v) ** 2 - sum(a * math.log(b) for a, b in zip(pi, p) if a > 0)

def game_targets(T):
    return [1 if (T - 1 - t) % 2 == 0 else -1 for t in range(T)]

def puct_search(n0, sims, prior_fn, value_fn, c):
    P, N, W = {}, {}, {}
    def expand(n):
        P[n] = prior_fn(n)
        for k in P[n]:
            N[(n, k)], W[(n, k)] = 0, 0.0
    expand(n0)
    for _ in range(sims):
        path, n = [], n0
        while n > 0 and n in P:
            total = sum(N[(n, k)] for k in P[n])
            score = lambda k: (W[(n, k)] / N[(n, k)] if N[(n, k)] else 0.0) + c * P[n][k] * math.sqrt(total) / (1 + N[(n, k)])
            k = max(P[n], key=score)
            path.append((n, k))
            n -= k
        if n == 0:
            v = -1.0
        else:
            expand(n)
            v = value_fn(n)
        for m, k in reversed(path):
            v = -v
            N[(m, k)] += 1
            W[(m, k)] += v
    return {k: N[(n0, k)] for k in P[n0]}`;

export const lesson: LessonContent = {
  id: "l6.8.3",
  minutes: 55,
  links: {
    requires: ["l6.8.2", "l6.3.2"],
    revisits: ["l3.3.2", "l6.1.3"],
    foreshadows: ["l6.8.4"],
  },

  puzzle: (
    <>
      <p>
        Monte Carlo tree search improves any policy it is given: its visit counts at the root are a better policy than the one
        that guided it. And a network can be trained to imitate any policy. Put the two together and let them chase each
        other: search with the network, train the network on the search, search again with the better network. Starting
        from random play and the rules alone, does this loop lead anywhere?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In 2017 it led to superhuman play in Go, chess and shogi within days. One network outputs a prior over moves and a
        value for the position. The search uses the prior to decide which moves deserve attention and the value in place of
        random rollouts. The visit counts of the search become the training target for the prior, and the final result of
        each self-play game becomes the target for the value. Each improves the other, as policy evaluation and improvement
        do in policy iteration.
      </p>
      <PuctSearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the network">
        <p>
          A single network <M>{"f_\\theta(s) = (p, v)"}</M> outputs a probability vector p over moves (a softmax, l3.3.2) and a scalar{" "}
          <M>{"v \\in [-1, 1]"}</M> estimating the outcome for the player to move.
        </p>
      </Definition>

      <Definition title="PUCT search">
        <p>
          (Silver et al., 2017 and 2018.) Each node stores N(s, a), W(s, a) and the prior P(s, a). Selection picks
        </p>
        <MD>{"a = \\arg\\max_a\\ Q(s, a) + c_{\\text{puct}}\\,P(s, a)\\frac{\\sqrt{N(s)}}{1 + N(s, a)}"}</MD>
        <p>
          (<C>puct_score</C>), with Q = W/N and Q = 0 for unvisited moves. Unlike UCT (l6.8.2, l6.1.3), the exploration bonus is
          proportional to the prior, so the search spends its effort on moves the network finds plausible and almost never on
          the others. A new leaf is expanded by evaluating the network once: its p becomes the leaf&apos;s prior and its v is
          backed up, with signs alternating, in place of a rollout (<C>puct_search</C>, on Nim, with a prior function returning a
          dictionary of move probabilities and a value function).
        </p>
      </Definition>

      <Definition title="self-play">
        <p>
          At each move of a self-play game the program runs a search (800 simulations in AlphaZero) and samples its move from
          the visit distribution <M>{"\\pi(a) \\propto N(s_0, a)^{1/\\tau}"}</M> (<C>visit_policy</C>): τ = 1 for the first moves, to diversify
          the games, and τ → 0, the most visited move, afterwards. To keep exploring, the prior at the root is mixed with
          Dirichlet noise, <M>{"(1 - \\varepsilon)p + \\varepsilon\\eta"}</M> with ε = 0.25 (<C>add_noise</C>, given the noise vector).
        </p>
        <Code>{PIECES}</Code>
      </Definition>

      <Definition title="the training loss">
        <p>
          Each position s of a finished game is stored with its search policy π and the final outcome z ∈ {"{−1, +1}"} from the
          viewpoint of the player to move there; in a game where the last mover wins, z alternates backwards from +1 (
          <C>game_targets</C>). The network minimises
        </p>
        <MD>{"\\ell(\\theta) = (z - v)^2 - \\pi^\\top\\log p + c\\|\\theta\\|^2"}</MD>
        <p>(<C>az_loss</C>, without the weight decay term).</p>
        <Code>{LOOP}</Code>
      </Definition>

      <Theorem title="what the loss asks the network to learn">
        <p>
          For a fixed position, among all outputs (p, v), the expected loss over the stored targets is minimised by{" "}
          <M>{"v = \\mathbb{E}[z \\mid s]"}</M> and <M>{"p = \\mathbb{E}[\\pi \\mid s]"}</M>: the network learns the expected outcome under
          self-play and the average search policy.
        </p>
      </Theorem>
      <Proof>
        <p>
          The two terms involve different outputs and can be minimised separately. <M>{"\\mathbb{E}[(z - v)^2]"}</M> is a quadratic in v
          minimised at the mean of z. For the policy term, with <M>{"\\bar\\pi = \\mathbb{E}[\\pi]"}</M>,{" "}
          <M>{"-\\mathbb{E}[\\pi]^\\top\\log p = H(\\bar\\pi) + \\mathrm{KL}(\\bar\\pi \\,\\|\\, p)"}</M>, which is smallest when the divergence is zero,
          at <M>{"p = \\bar\\pi"}</M>.
        </p>
      </Proof>

      <Remark title="search as policy improvement">
        <p>
          The loop is approximate policy iteration (l6.3.2). Search with the current network is a policy improvement operator:
          with enough simulations it plays better than the network&apos;s own prior, as in the picture. Training on the search policy
          and the game outcomes is the evaluation and distillation step. Grill et al. (2020) showed that the visit
          distribution of PUCT approximately solves a regularised problem, maximising <M>{"q^\\top\\pi"}</M> minus a multiple of{" "}
          <M>{"\\mathrm{KL}(p \\,\\|\\, \\pi)"}</M> that shrinks as simulations grow, which links the search to the KL-regularised policies of
          l6.7.4.
        </p>
      </Remark>

      <Remark title="what it needed">
        <p>
          AlphaZero needed a perfect simulator of the game, a great deal of computation (thousands of TPUs generating self-play
          games), and two-player zero-sum games with a clear outcome. MuZero (l6.8.4) removed the first requirement by
          searching inside a learned model of the game.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "puct",
      rung: "check",
      prompt: (
        <p>
          A move has Q = 0.2, prior 0.6 and 4 visits; its parent has 25 visits and <M>{"c_{\\text{puct}}"}</M> = 1.5. What is its PUCT
          score?
        </p>
      ),
      answer: { kind: "numeric", value: 1.1, tolerance: 0.0001 },
    },
    {
      key: "tau",
      rung: "check",
      prompt: (
        <p>
          The root visit counts are 10, 30 and 60. With τ = 0.5, what probability does the visit policy give the third move? Give
          four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7826, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is the policy network trained towards the visit distribution of the search rather than towards the moves it would have chosen itself?</p>,
      answer: {
        kind: "choice",
        options: [
          "The search, guided by the network and checked by looking ahead, is a better policy than the network's prior, so training on it improves the network",
          "The visit distribution is always uniform, which keeps exploration high",
          "The network's own choices are not available during self-play",
          "The visit distribution is the exact minimax policy after one simulation",
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

def puct_score(q, p, n_parent, n, c):
    return q + c * p * math.sqrt(n_parent) / (1 + n)

def visit_policy(counts, tau):
    if tau == 0:
        best = counts.index(max(counts))
        return [1.0 if i == best else 0.0 for i in range(len(counts))]
    w = [n ** (1 / tau) for n in counts]
    return [x / sum(w) for x in w]

def add_noise(prior, noise, eps):
    return [(1 - eps) * p + eps * x for p, x in zip(prior, noise)]

print(puct_score(0.5, 0.25, 16, 3, 2.0), puct_score(0.0, 0.5, 0, 0, 1.0), visit_policy([1, 3, 0], 1.0), visit_policy([1, 3, 0], 0.5), visit_policy([1, 3, 0], 0))
print(add_noise([0.5, 0.5], [1.0, 0.0], 0.25), add_noise([0.2, 0.8], [0.5, 0.5], 0.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.0 [0.25, 0.75, 0.0] [0.1, 0.9, 0.0] [0.0, 1.0, 0.0]\n[0.625, 0.375] [0.2, 0.8]",
          "1.0 0.5 [0.25, 0.75, 0.0] [0.1, 0.9, 0.0] [0.0, 1.0, 0.0]\n[0.625, 0.375] [0.2, 0.8]",
          "1.0 0.0 [0.25, 0.75, 0.0] [0.5, 0.5, 0.0] [0.0, 1.0, 0.0]\n[0.625, 0.375] [0.2, 0.8]",
          "2.0 0.0 [0.25, 0.75, 0.0] [0.1, 0.9, 0.0] [0.25, 0.75, 0.0]\n[0.75, 0.25] [0.2, 0.8]",
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

def az_loss(z, v, pi, p):
    return (z - v) ** 2 - sum(a * math.log(b) for a, b in zip(pi, p) if a > 0)

def game_targets(T):
    return [1 if (T - 1 - t) % 2 == 0 else -1 for t in range(T)]

def puct_search(n0, sims, prior_fn, value_fn, c):
    P, N, W = {}, {}, {}
    def expand(n):
        P[n] = prior_fn(n)
        for k in P[n]:
            N[(n, k)], W[(n, k)] = 0, 0.0
    expand(n0)
    for _ in range(sims):
        path, n = [], n0
        while n > 0 and n in P:
            total = sum(N[(n, k)] for k in P[n])
            score = lambda k: (W[(n, k)] / N[(n, k)] if N[(n, k)] else 0.0) + c * P[n][k] * math.sqrt(total) / (1 + N[(n, k)])
            k = max(P[n], key=score)
            path.append((n, k))
            n -= k
        if n == 0:
            v = -1.0
        else:
            expand(n)
            v = value_fn(n)
        for m, k in reversed(path):
            v = -v
            N[(m, k)] += 1
            W[(m, k)] += v
    return {k: N[(n0, k)] for k in P[n0]}

uniform = lambda n: {k: 1 / min(3, n) for k in (1, 2, 3) if k <= n}; value = lambda n: 0.5 if n % 4 else -0.5; print(round(az_loss(1.0, 0.5, [0.5, 0.5, 0.0], [0.5, 0.25, 0.25]), 4), game_targets(4), game_targets(3))
counts = puct_search(10, 200, uniform, value, 1.5); print(max(counts, key=counts.get), sum(counts.values()), puct_search(1, 5, uniform, value, 1.5), puct_search(2, 1, uniform, value, 1.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.2897 [-1, 1, -1, 1] [1, -1, 1]\n2 200 {1: 5} {1: 1, 2: 0}",
          "1.2897 [1, -1, 1, -1] [1, -1, 1]\n2 200 {1: 5} {1: 1, 2: 0}",
          "1.2897 [-1, 1, -1, 1] [1, -1, 1]\n1 199 {1: 5} {1: 0, 2: 1}",
          "0.25 [-1, 1, -1, 1] [-1, 1, -1]\n2 200 {1: 4} {1: 1, 2: 0}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>puct_score(q, p, n_parent, n, c)</C>; <C>visit_policy(counts, tau)</C>, returning a one-hot list on the first most
          visited move when τ = 0; and <C>add_noise(prior, noise, eps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def puct_score(q, p, n_parent, n, c):
    return q

def visit_policy(counts, tau):
    return [1.0 / len(counts)] * len(counts)

def add_noise(prior, noise, eps):
    return list(prior)
`,
        solution: PIECES,
        tests: [
          { name: "puct", code: `assert puct_score(0.5, 0.25, 16, 3, 2.0) == 1.0 and puct_score(0.0, 0.5, 0, 0, 1.0) == 0.0 and abs(puct_score(-0.2, 0.1, 9, 2, 3.0) - (-0.2 + 0.3)) < 1e-12
assert add_noise([0.5, 0.5], [1.0, 0.0], 0.25) == [0.625, 0.375] and add_noise([0.2, 0.8], [0.5, 0.5], 0.0) == [0.2, 0.8] and add_noise([0.2, 0.8], [0.5, 0.5], 1.0) == [0.5, 0.5]` },
          { name: "policy", code: `close = lambda u, v: all(abs(a - b) < 1e-12 for a, b in zip(u, v))
assert close(visit_policy([1, 3, 0], 1.0), [0.25, 0.75, 0.0]) and close(visit_policy([1, 3, 0], 0.5), [0.1, 0.9, 0.0])
assert visit_policy([1, 3, 0], 0) == [0.0, 1.0, 0.0] and visit_policy([5, 2, 5], 0) == [1.0, 0.0, 0.0] and close(visit_policy([2, 2], 3.0), [0.5, 0.5])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>az_loss(z, v, pi, p)</C>, skipping zero entries of π; <C>game_targets(T)</C> for a game of T moves in which the last
          mover wins; and <C>puct_search(n0, sims, prior_fn, value_fn, c)</C> for Nim, expanding the root before the first simulation,
          breaking ties by the first move in the prior&apos;s order, and returning the root visit counts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def az_loss(z, v, pi, p):
    return 0.0

def game_targets(T):
    return [1] * T

def puct_search(n0, sims, prior_fn, value_fn, c):
    return {k: 0 for k in (1, 2, 3) if k <= n0}
`,
        solution: LOOP,
        tests: [
          { name: "loss", code: `assert abs(az_loss(1.0, 0.5, [0.5, 0.5, 0.0], [0.5, 0.25, 0.25]) - (0.25 + 1.5 * math.log(2))) < 1e-12 and az_loss(1.0, 1.0, [1.0, 0.0], [1.0, 0.0]) == 0
assert game_targets(4) == [-1, 1, -1, 1] and game_targets(3) == [1, -1, 1] and game_targets(1) == [1] and game_targets(0) == []` },
          { name: "search", code: `uniform = lambda n: {k: 1 / min(3, n) for k in (1, 2, 3) if k <= n}
value = lambda n: 0.5 if n % 4 else -0.5
assert puct_search(1, 5, uniform, value, 1.5) == {1: 5} and puct_search(2, 1, uniform, value, 1.5) == {1: 1, 2: 0}
for n in (6, 7, 10, 13):
    c = puct_search(n, 300, uniform, value, 1.5)
    assert max(c, key=c.get) == n % 4 and sum(c.values()) == 300
bad = lambda n: {k: (0.8 if k == 1 else 0.1) for k in (1, 2, 3) if k <= n}
c = puct_search(10, 800, bad, value, 1.5)
assert max(c, key=c.get) == 2` },
        ],
      },
    },
    {
      key: "loss",
      rung: "stretch",
      prompt: (
        <p>
          After a search the root visit counts are 2, 6 and 12, so with τ = 1 the target π is their proportions. The network
          outputs p = (0.2, 0.3, 0.5) and v = 0.2, and the game was lost, z = −1. What is the loss without weight decay? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.378, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        AlphaZero plans with the true rules of the game. The final lesson (l6.8.4) asks what happens when the agent must learn
        a model of its world, from pixels or from raw observations, and plan or learn inside that model instead.
      </p>
    </>
  ),
};
