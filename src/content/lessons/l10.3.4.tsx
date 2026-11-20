import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EloOrderViz } from "@/components/viz/EloOrderViz";
import type { LessonContent } from "@/lib/types";

const ELO = `def expected_score(ra, rb):
    return 1 / (1 + 10 ** ((rb - ra) / 400))

def elo_update(ra, rb, outcome, k):
    delta = k * (outcome - expected_score(ra, rb))
    return ra + delta, rb - delta

def run_elo(matches, k, init=1000.0):
    r = {}
    for a, b, outcome in matches:
        ra, rb = r.get(a, init), r.get(b, init)
        r[a], r[b] = elo_update(ra, rb, outcome, k)
    return r`;

const BT = `import math

def bt_fit(wins, iters):
    n = len(wins)
    p = [1.0] * n
    for _ in range(iters):
        new = []
        for i in range(n):
            w = sum(wins[i])
            d = sum((wins[i][j] + wins[j][i]) / (p[i] + p[j]) for j in range(n) if j != i)
            new.append(w / d)
        g = math.exp(sum(math.log(x) for x in new) / n)
        p = [x / g for x in new]
    return p

def to_elo_scale(p, base=1000.0):
    return [base + 400 * math.log10(x) for x in p]

def win_prob(pi, pj):
    return pi / (pi + pj)`;

export const lesson: LessonContent = {
  id: "l10.3.4",
  minutes: 50,
  links: {
    requires: ["l10.3.3", "l9.3.1"],
    revisits: ["l10.1.4", "l10.2.2", "m9.5.2"],
    foreshadows: ["l10.4.1", "l10.6.1", "l10.7.4"],
  },

  puzzle: (
    <>
      <p>
        In Chatbot Arena, people type any prompt, see answers from two anonymous models side by side, and vote for the better one.
        Millions of votes produce a leaderboard of ratings like those used in chess. It has no fixed test set to leak and covers
        whatever people actually ask. Yet a model can climb it by being chattier, and a lab that privately tests many variants can
        publish only the luckiest. What exactly does an arena rating estimate, and how should the votes be turned into one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each vote is a noisy comparison. A model of comparisons, the Bradley–Terry model, gives every system a strength such that the
        chance of beating another depends only on the difference in strengths. Online Elo updates ratings one game at a time and is
        sensitive to the order of games; fitting the model to all votes at once is not. Either way, the rating summarises preference
        over the prompts and voters the arena happens to attract.
      </p>
      <EloOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Elo">
        <p>
          With ratings <M>{"r_a, r_b"}</M>, the expected score of a is <M>{"E_a = 1/(1 + 10^{(r_b - r_a)/400})"}</M> (<C>expected_score</C>).
          After a game with outcome <M>{"S \\in \\{0, \\tfrac12, 1\\}"}</M>, both ratings move by <M>{"K(S - E_a)"}</M> in opposite directions
          (<C>elo_update</C>), and the leaderboard is the result of processing all games in sequence (<C>run_elo</C>). A difference of
          400 points means odds of 10 to 1. Elo is stochastic gradient ascent on the Bradley–Terry log-likelihood with step K, so its
          final ratings depend on the order of the games and keep fluctuating by an amount that grows with K.
        </p>
        <Code>{ELO}</Code>
      </Definition>

      <Theorem title="the Bradley–Terry MM update">
        <p>
          Let <M>{"w_{ij}"}</M> be the number of times i beat j and <M>{"n_{ij} = w_{ij} + w_{ji}"}</M>. The model{" "}
          <M>{"P(i \\succ j) = p_i/(p_i + p_j)"}</M> (<C>win_prob</C>) has log-likelihood{" "}
          <M>{"\\ell(p) = \\sum_{i \\ne j} w_{ij}\\,[\\log p_i - \\log(p_i + p_j)]"}</M>, and the update
        </p>
        <MD>{"p_i \\leftarrow \\frac{W_i}{\\sum_{j \\ne i} n_{ij}/(p_i + p_j)}, \\qquad W_i = \\sum_j w_{ij},"}</MD>
        <p>never decreases it (Hunter, 2004).</p>
      </Theorem>
      <Proof>
        <p>
          Since log is concave, <M>{"-\\log x \\ge -\\log y - (x - y)/y"}</M> for any y &gt; 0, with equality at x = y. Applying this to each{" "}
          <M>{"-\\log(p_i + p_j)"}</M> at the current values gives a lower bound on <M>{"\\ell"}</M> that touches it at the current p. The
          bound separates into terms <M>{"W_i \\log p_i - p_i \\sum_{j} n_{ij}/(p_i^{\\text{old}} + p_j^{\\text{old}})"}</M> for each i, whose
          maximiser is the stated update. Maximising a minorising function that touches <M>{"\\ell"}</M> cannot lower <M>{"\\ell"}</M>.
          Updating every coordinate at once from the old values, as in <C>bt_fit</C>, uses the same bound and is also an ascent step.
          The strengths are defined only up to a common factor, so they are normalised to geometric mean 1, and ratings on the familiar
          scale are <M>{"1000 + 400\\log_{10} p_i"}</M> (<C>to_elo_scale</C>).
        </p>
        <Code>{BT}</Code>
      </Proof>

      <Remark title="uncertainty in ratings">
        <p>
          Bootstrap the votes (m9.5.2): resample them with replacement, refit, and read off the spread of each rating and of each rank.
          Models whose intervals overlap should be reported as tied. Pairs that rarely meet are poorly connected; their difference is
          inferred through chains of other models and is less certain than the counts suggest.
        </p>
      </Remark>

      <Remark title="what can go wrong">
        <p>
          Voters prefer longer, more heavily formatted answers; the arena now offers a style-controlled ranking that adds answer length
          and markdown counts as covariates in a logistic regression, so strengths are compared at equal style. The prompt mix is
          whatever users bring, heavy on chat and coding and light on specialist tasks. Singh et al. (2025) documented providers testing
          many private variants and publishing only the best, which inflates the published rating by selection (l10.1.4), and unequal
          sampling rates that give some providers far more feedback data than others. An arena rating is a well-defined estimate of
          preference on that population of prompts and voters, not a general measure of capability.
        </p>
      </Remark>

      <Example title="reading a rating gap">
        <p>
          Ratings 1300 and 1200 mean the higher model is expected to win <M>{"1/(1 + 10^{-0.25}) \\approx 64\\%"}</M> of comparisons. That
          is a clear but not overwhelming preference; across one tenth of the scale, most head-to-head votes are close.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "elo",
      rung: "check",
      prompt: (
        <p>
          Model A (rating 1100) loses to model B (rating 1000). With K = 32, what is A&apos;s new rating? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 1079.5, tolerance: 0.05 },
    },
    {
      key: "prob",
      rung: "check",
      prompt: (
        <p>
          On the 400-point scale, what is the probability that a model rated 1250 is preferred to one rated 1200? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.571, tolerance: 0.001 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: (
        <p>
          Two analysts process the same set of arena votes with online Elo, K = 32, but in different orders, and get different rankings
          for the top two models. What should they do?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Fit the Bradley–Terry model to all votes at once and bootstrap the votes for intervals; report a tie if the intervals overlap",
          "Use the order in which the votes were cast, since that is the true order",
          "Average the two Elo rankings",
          "Increase K so the ratings converge faster",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def expected_score(ra, rb):
    return 1 / (1 + 10 ** ((rb - ra) / 400))

def elo_update(ra, rb, outcome, k):
    delta = k * (outcome - expected_score(ra, rb))
    return ra + delta, rb - delta

def run_elo(matches, k, init=1000.0):
    r = {}
    for a, b, outcome in matches:
        ra, rb = r.get(a, init), r.get(b, init)
        r[a], r[b] = elo_update(ra, rb, outcome, k)
    return r

print(expected_score(1000, 1000), elo_update(1000, 1000, 1, 32))
print({m: round(v, 1) for m, v in run_elo([("a", "b", 1), ("b", "a", 1)], 32).items()})`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 (1016.0, 984.0)\n{'a': 998.5, 'b': 1001.5}",
          "0.5 (1016.0, 984.0)\n{'a': 1000.0, 'b': 1000.0}",
          "0.5 (1032.0, 968.0)\n{'a': 998.5, 'b': 1001.5}",
          "0.5 (1016.0, 984.0)\n{'a': 1001.5, 'b': 998.5}",
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

def bt_fit(wins, iters):
    n = len(wins)
    p = [1.0] * n
    for _ in range(iters):
        new = []
        for i in range(n):
            w = sum(wins[i])
            d = sum((wins[i][j] + wins[j][i]) / (p[i] + p[j]) for j in range(n) if j != i)
            new.append(w / d)
        g = math.exp(sum(math.log(x) for x in new) / n)
        p = [x / g for x in new]
    return p

def to_elo_scale(p, base=1000.0):
    return [base + 400 * math.log10(x) for x in p]

def win_prob(pi, pj):
    return pi / (pi + pj)

print(bt_fit([[0, 2], [2, 0]], 5), to_elo_scale([10.0, 1.0]))
print(win_prob(3.0, 1.0), [round(x, 3) for x in bt_fit([[0, 4], [1, 0]], 50)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0] [1400.0, 1000.0]\n0.75 [2.0, 0.5]",
          "[0.5, 0.5] [1400.0, 1000.0]\n0.75 [2.0, 0.5]",
          "[1.0, 1.0] [1400.0, 1000.0]\n0.75 [4.0, 1.0]",
          "[1.0, 1.0] [1040.0, 1000.0]\n0.75 [2.0, 0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expected_score(ra, rb)</C>, <C>elo_update(ra, rb, outcome, k)</C> returning both new ratings, and{" "}
          <C>run_elo(matches, k, init=1000.0)</C> for a list of (a, b, outcome) games, returning a dictionary of ratings.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def expected_score(ra, rb):
    return 0.5

def elo_update(ra, rb, outcome, k):
    return ra, rb

def run_elo(matches, k, init=1000.0):
    return {}
`,
        solution: ELO,
        tests: [
          { name: "update", code: `a, b = elo_update(1200, 1000, 1, 20)\nassert abs(expected_score(1200, 1000) - 0.7597469) < 1e-6 and abs(a - 1204.805062) < 1e-5 and abs(a + b - 2200) < 1e-9` },
          { name: "run", code: `r = run_elo([("x", "y", 1), ("y", "z", 0), ("x", "z", 1)], 16)\nassert abs(r["x"] - 1015.9957592) < 1e-6 and abs(r["y"] - 984.1841743) < 1e-6 and abs(r["z"] - 999.8200665) < 1e-6 and run_elo([], 32) == {}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bt_fit(wins, iters)</C>, applying the MM update to every model at once from the previous values and then dividing by
          the geometric mean, <C>to_elo_scale(p, base=1000.0)</C>, and <C>win_prob(pi, pj)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bt_fit(wins, iters):
    return [1.0] * len(wins)

def to_elo_scale(p, base=1000.0):
    return p

def win_prob(pi, pj):
    return 0.5
`,
        solution: BT,
        tests: [
          { name: "fit", code: `p = bt_fit([[0, 3, 1], [1, 0, 2], [1, 1, 0]], 500)\nassert abs(p[0] - 1.6169087) < 1e-6 and abs(p[1] - 0.8519129) < 1e-6 and abs(p[2] - 0.7259711) < 1e-6` },
          { name: "scale", code: `s = to_elo_scale([10.0, 0.1])\nassert abs(s[0] - 1400) < 1e-9 and abs(s[1] - 600) < 1e-9 and abs(win_prob(1.0, 4.0) - 0.2) < 1e-12` },
        ],
      },
    },
    {
      key: "mle",
      rung: "stretch",
      prompt: (
        <p>
          Two models meet 40 times: A wins 30 and B wins 10. By maximum likelihood under Bradley–Terry, how many points apart are their
          ratings on the 400-point scale? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 190.8, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        Arenas judge single replies. The next module evaluates models that act: agents that take many steps in an environment, where
        success depends on a whole trajectory.
      </p>
    </>
  ),
};
