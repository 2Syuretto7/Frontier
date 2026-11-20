import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NimMctsViz } from "@/components/viz/NimMctsViz";
import type { LessonContent } from "@/lib/types";

const PARTS = `import math

def moves(n):
    return [k for k in (1, 2, 3) if k <= n]

def uct_score(w, n, n_parent, c):
    return math.inf if n == 0 else w / n + c * math.sqrt(math.log(n_parent) / n)

def rollout(n, rng):
    sign = 1
    while n > 0:
        n -= rng.choice(moves(n))
        if n == 0:
            return sign
        sign = -sign
    return -1`;

const SEARCH = `import math

def minimax(n, memo={}):
    if n not in memo:
        memo[n] = -1 if n == 0 else max(-minimax(n - k) for k in (1, 2, 3) if k <= n)
    return memo[n]

def mcts(n0, iters, c, rng):
    N, E = {}, {}
    acts = lambda n: [k for k in (1, 2, 3) if k <= n]
    def score(n, k):
        cnt, tot = E.get((n, k), (0, 0.0))
        return math.inf if cnt == 0 else tot / cnt + c * math.sqrt(math.log(N[n]) / cnt)
    for _ in range(iters):
        path, n = [], n0
        while n in N and n > 0:
            k = max(acts(n), key=lambda k: score(n, k))
            path.append((n, k))
            n -= k
        v, m, sign = -1.0, n, 1.0
        while m > 0:
            m -= rng.choice(acts(m))
            v, sign = (sign, -sign) if m == 0 else (v, -sign)
        if n > 0:
            N[n] = N.get(n, 0) + 1
        for m, k in reversed(path):
            v = -v
            cnt, tot = E.get((m, k), (0, 0.0))
            E[(m, k)] = (cnt + 1, tot + v)
            N[m] += 1
    return {k: E.get((n0, k), (0, 0.0))[0] for k in acts(n0)}

def best_move(counts):
    return max(counts, key=lambda k: counts[k])`;

export const lesson: LessonContent = {
  id: "l6.8.2",
  minutes: 55,
  links: {
    requires: ["l6.1.3", "l6.4.1"],
    revisits: ["l6.8.1"],
    foreshadows: ["l6.8.3"],
  },

  puzzle: (
    <>
      <p>
        In a board game the rules are a perfect model, so the agent can look ahead as far as it likes. But the game tree of
        Go has more positions than there are atoms in the universe, and for decades no evaluation function was good enough
        to cut the search short. How can a program search a tree it cannot enumerate and cannot evaluate, and still find good
        moves?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Estimate the value of a position by playing it out at random to the end, many times: a Monte Carlo estimate (l6.4.1).
        Keep a tree of the positions explored so far and grow it one node per playout, steering each new playout down the
        tree with a bandit rule that favours moves that have done well but still tries moves that have been tried little
        (l6.1.3). The tree grows deepest along the most promising lines, and inside it the random play is gradually replaced
        by the search&apos;s own choices.
      </p>
      <NimMctsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Monte Carlo tree search">
        <p>
          The tree stores, for every node s and move a, a visit count N(s, a) and a total value W(s, a), with{" "}
          <M>{"N(s) = \\sum_aN(s, a)"}</M>. Each simulation has four phases.
        </p>
        <ol>
          <li><em>Selection</em>: from the root, repeatedly choose a move by the tree policy until reaching a node not yet in the tree, or the end of the game.</li>
          <li><em>Expansion</em>: add that node to the tree.</li>
          <li><em>Simulation</em>: play from it to the end with a default policy, typically uniformly random (<C>rollout</C>, which returns +1 if the player to move wins).</li>
          <li><em>Backup</em>: add the result to N and W along the path; in a two-player zero-sum game, flip its sign at each level so that each edge stores the value for the player who made that move.</li>
        </ol>
        <p>After the simulations, play the root move with the most visits, which is less noisy than the highest mean.</p>
      </Definition>

      <Definition title="UCT">
        <p>
          (Kocsis and Szepesvári, 2006.) The tree policy treats each node as a bandit and applies UCB1:
        </p>
        <MD>{"a = \\arg\\max_a\\ \\frac{W(s, a)}{N(s, a)} + c\\sqrt{\\frac{\\ln N(s)}{N(s, a)}},"}</MD>
        <p>
          with untried moves first (<C>uct_score</C> returns infinity for them). The constant c sets the balance between
          exploitation and exploration; <M>{"\\sqrt2"}</M> is the textbook choice for values in [0, 1], and in practice it is tuned.
        </p>
        <Code>{PARTS}</Code>
      </Definition>

      <Remark title="what UCT guarantees">
        <p>
          Kocsis and Szepesvári proved that, in a finite game tree, the probability that UCT recommends a suboptimal root move
          tends to zero as the number of simulations grows, and its value estimate at the root converges to the minimax value.
          The idea is that the bandit at every node concentrates its plays on the best move at a rate fast enough that the
          estimates at its parent become accurate in turn, from the leaves up. The convergence can be slow in trees built to
          deceive it, but in practice the search is <em>anytime</em>: it can be stopped after any number of simulations and
          still return its best guess.
        </p>
      </Remark>

      <Theorem title="the minimax value of Nim">
        <p>
          In Nim with moves of 1, 2 or 3 stones, where taking the last stone wins, the player to move loses (with best play
          by the opponent) if and only if the number of stones is a multiple of 4 (<C>minimax</C>, which returns +1 for a win
          and −1 for a loss).
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on n. With 0 stones the player to move has already lost. If n is a multiple of 4 and positive, every
          move leaves n − 1, n − 2 or n − 3, none a multiple of 4, which are wins for the opponent by induction. Otherwise
          taking n mod 4 stones leaves a multiple of 4, a loss for the opponent. In the negamax form used by the code, the value
          of a position is the largest over moves of minus the value of the resulting position.
        </p>
      </Proof>

      <Definition title="the full search">
        <p>
          <C>mcts</C> stores the tree as dictionaries keyed by pile size (identical positions share statistics, a transposition
          table) and returns the root visit counts; <C>best_move</C> picks the most visited. The first simulation only expands
          the root, so the root counts add up to one less than the number of simulations.
        </p>
        <Code>{SEARCH}</Code>
      </Definition>

      <Remark title="beyond random rollouts">
        <p>
          Random rollouts are cheap but biased: they estimate the value of a position under random play, which can be far from
          its value under good play. Strong programs replaced them, first with handcrafted rollout policies, then with learned
          networks. AlphaGo (Silver et al., 2016) and AlphaZero (l6.8.3) use a policy network to guide selection and a value
          network instead of the rollout, which is the subject of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "uct",
      rung: "check",
      prompt: (
        <p>
          A move has been tried 4 times with total value 2, its parent has been visited 20 times and c = √2. What is its UCT
          score? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.7239, tolerance: 0.0005 },
    },
    {
      key: "nim",
      rung: "check",
      prompt: <p>In Nim with moves of 1, 2 or 3 stones, there are 10 stones. How many should the player to move take?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0 },
    },
    {
      key: "final",
      rung: "apply",
      prompt: <p>Why does MCTS usually play the root move with the most visits rather than the highest mean value?</p>,
      answer: {
        kind: "choice",
        options: [
          "The tree policy sends more simulations to moves that look best, so the visit count is a robust summary, while a rarely tried move can have a high mean by chance",
          "The visit count is always proportional to the minimax value",
          "Mean values are not stored in the tree",
          "The most visited move is the one tried first",
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

def moves(n):
    return [k for k in (1, 2, 3) if k <= n]

def uct_score(w, n, n_parent, c):
    return math.inf if n == 0 else w / n + c * math.sqrt(math.log(n_parent) / n)

def rollout(n, rng):
    sign = 1
    while n > 0:
        n -= rng.choice(moves(n))
        if n == 0:
            return sign
        sign = -sign
    return -1

class First: choice = staticmethod(lambda xs: xs[0])
print(moves(5), moves(2), round(uct_score(3, 4, 16, 1.0), 4), uct_score(0, 0, 5, 1.0), rollout(1, First()), rollout(2, First()), rollout(3, First()), rollout(0, First()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 2, 3] [1, 2] 1.5826 inf 1 -1 1 -1",
          "[1, 2, 3] [1, 2] 1.5826 inf 1 1 1 -1",
          "[1, 2, 3, 4, 5] [1, 2] 1.5826 inf 1 -1 1 -1",
          "[1, 2, 3] [1, 2] 0.75 inf 1 -1 -1 1",
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

def minimax(n, memo={}):
    if n not in memo:
        memo[n] = -1 if n == 0 else max(-minimax(n - k) for k in (1, 2, 3) if k <= n)
    return memo[n]

def mcts(n0, iters, c, rng):
    N, E = {}, {}
    acts = lambda n: [k for k in (1, 2, 3) if k <= n]
    def score(n, k):
        cnt, tot = E.get((n, k), (0, 0.0))
        return math.inf if cnt == 0 else tot / cnt + c * math.sqrt(math.log(N[n]) / cnt)
    for _ in range(iters):
        path, n = [], n0
        while n in N and n > 0:
            k = max(acts(n), key=lambda k: score(n, k))
            path.append((n, k))
            n -= k
        v, m, sign = -1.0, n, 1.0
        while m > 0:
            m -= rng.choice(acts(m))
            v, sign = (sign, -sign) if m == 0 else (v, -sign)
        if n > 0:
            N[n] = N.get(n, 0) + 1
        for m, k in reversed(path):
            v = -v
            cnt, tot = E.get((m, k), (0, 0.0))
            E[(m, k)] = (cnt + 1, tot + v)
            N[m] += 1
    return {k: E.get((n0, k), (0, 0.0))[0] for k in acts(n0)}

def best_move(counts):
    return max(counts, key=lambda k: counts[k])

import random; print([minimax(n) for n in range(9)], best_move({1: 5, 2: 12, 3: 7}))
print(best_move(mcts(10, 2000, 1.4, random.Random(0))), best_move(mcts(7, 2000, 1.4, random.Random(1))), sum(mcts(5, 300, 1.4, random.Random(2)).values()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-1, 1, 1, 1, -1, 1, 1, 1, -1] 2\n2 3 299",
          "[-1, 1, 1, 1, -1, 1, 1, 1, -1] 2\n2 3 300",
          "[1, -1, -1, -1, 1, -1, -1, -1, 1] 2\n2 3 299",
          "[-1, 1, 1, 1, -1, 1, 1, 1, -1] 12\n1 1 299",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For Nim with moves of 1 to 3 stones, write <C>moves(n)</C>; <C>uct_score(w, n, n_parent, c)</C>, returning{" "}
          <C>math.inf</C> for an untried move; and <C>rollout(n, rng)</C>, playing <C>rng.choice(moves(n))</C> for both sides and returning
          +1 if the player to move at n takes the last stone, −1 otherwise (including n = 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def moves(n):
    return []

def uct_score(w, n, n_parent, c):
    return 0.0

def rollout(n, rng):
    return 0
`,
        solution: PARTS,
        tests: [
          { name: "parts", code: `assert moves(5) == [1, 2, 3] and moves(2) == [1, 2] and moves(0) == []
assert abs(uct_score(3, 4, 16, 1.0) - (0.75 + math.sqrt(math.log(16) / 4))) < 1e-12 and uct_score(0, 0, 5, 1.0) == math.inf and uct_score(2, 2, 1, 3.0) == 1.0` },
          { name: "rollout", code: `class First: choice = staticmethod(lambda xs: xs[0])
class Last: choice = staticmethod(lambda xs: xs[-1])
assert [rollout(n, First()) for n in range(5)] == [-1, 1, -1, 1, -1] and [rollout(n, Last()) for n in (1, 2, 3, 4)] == [1, 1, 1, -1]
import random
r = random.Random(3)
assert all(rollout(n, r) in (1, -1) for n in range(1, 30))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>minimax(n)</C> for Nim with memoisation; <C>mcts(n0, iters, c, rng)</C>, the UCT search described above, returning a
          dictionary of root visit counts per move; and <C>best_move(counts)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def minimax(n, memo={}):
    return 1

def mcts(n0, iters, c, rng):
    return {k: 0 for k in (1, 2, 3) if k <= n0}

def best_move(counts):
    return min(counts)
`,
        solution: SEARCH,
        tests: [
          { name: "minimax", code: `assert [minimax(n) for n in range(13)] == [-1, 1, 1, 1] * 3 + [-1] and minimax(40) == -1 and minimax(41) == 1
assert best_move({1: 5, 2: 12, 3: 7}) == 2 and best_move({1: 9}) == 1` },
          { name: "search", code: `import random
for n, seed in ((10, 0), (7, 1), (13, 2), (6, 3)):
    counts = mcts(n, 2000, 1.4, random.Random(seed))
    assert best_move(counts) == n % 4 and sum(counts.values()) == 1999
c = mcts(3, 50, 1.4, random.Random(4))
assert best_move(c) == 3 and set(c) == {1, 2, 3}` },
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: (
        <p>
          Change the rules so that a move takes 1, 3 or 4 stones, still with the last stone winning. Counting from 1, what is
          the third pile size at which the player to move loses with best play?
        </p>
      ),
      answer: { kind: "numeric", value: 9, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        MCTS with random rollouts was enough for strong amateur Go, but not for professional play. AlphaZero (l6.8.3) replaces
        the rollout with a learned value and guides the search with a learned policy, then trains both networks on the
        results of the search itself.
      </p>
    </>
  ),
};
