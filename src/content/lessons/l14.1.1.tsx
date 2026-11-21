import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LoopFinishViz } from "@/components/viz/LoopFinishViz";
import type { LessonContent } from "@/lib/types";

const OMIT = `import math

def allocate(budget, weights):
    active = [i for i, w in enumerate(weights) if w > 0]   # an attribute with weight 0 gets nothing
    while active:
        lam = sum(weights[i] for i in active) / (budget + len(active))
        keep = [i for i in active if weights[i] / lam >= 1]
        if keep == active:
            break
        active = keep                                      # drop attributes that would go negative
    return [weights[i] / lam - 1 if i in active else 0.0 for i in range(len(weights))]

def utility(alloc, weights):
    return sum(w * math.log(1 + x) for x, w in zip(alloc, weights))

def proxy_regret(budget, true_w, proxy_w):
    best = utility(allocate(budget, true_w), true_w)
    return best - utility(allocate(budget, proxy_w), true_w)`;

const LOOP = `def finish_return(f, t, gamma):
    return f * gamma ** t                                  # one reward f at step t

def loop_return(r, first, period, gamma):
    return r * gamma ** first / (1 - gamma ** period)      # r at step first, then every period steps

def games_the_spec(f, t, r, first, period, gamma):
    return loop_return(r, first, period, gamma) > finish_return(f, t, gamma)`;

export const lesson: LessonContent = {
  id: "l14.1.1",
  minutes: 45,
  links: {
    requires: ["l9.3.3", "l9.8.2"],
    revisits: ["l9.4.2", "l9.8.1"],
    foreshadows: ["l14.1.2", "l14.2.1"],
  },

  puzzle: (
    <>
      <p>
        In 2016 a reinforcement-learning agent was trained on a boat-racing game, rewarded by the game&apos;s score.
        Instead of racing, it found a lagoon where three targets kept reappearing, and circled there forever, crashing
        and catching fire, scoring far more than any player who finished the race. Nothing was wrong with the learning
        algorithm; it found exactly what the score paid for. If optimisers are this literal, how can we write down what
        we want, and what follows when we inevitably leave something out?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A specification, whether a reward function, a test suite or a rating rubric, is a finite description of an
        intention. Optimisation pressure flows to wherever the description and the intention differ, because that is
        where reward is cheapest. The more capable the optimiser, the more such places it finds, and the less likely
        they are to be the ones the designer anticipated. Two patterns recur: loopholes, where a behaviour scores well
        for an unintended reason, and omissions, where something the designer cared about was never written down and
        is spent freely to raise what was.
      </p>
      <LoopFinishViz />
    </>
  ),

  theory: (
    <>
      <Definition title="specification gaming">
        <p>
          Specification gaming is behaviour that satisfies the literal specification of an objective without achieving
          the outcome it was meant to capture. Krakovna et al. (2020) collected dozens of examples: the boat that loops
          for points (<C>loop_return</C>, <C>games_the_spec</C>); a simulated arm, trained from human judgements, that
          placed its hand between the camera and the ball so that it only appeared to grasp it; evolved creatures that
          exploited bugs in the physics engine; a Tetris agent that paused the game forever rather than lose. In language
          models the same pattern appears as length and flattery rewarded by reward models, and in coding agents as edited
          or special-cased tests. Gaming is distinct from the model failing to learn the objective, which is the subject
          of the next lesson: here the objective is learned correctly and is itself wrong.
        </p>
        <Code>{LOOP}</Code>
      </Definition>

      <Theorem title="omitted attributes are spent">
        <p>
          Let an agent divide a budget B among attributes <M>{"x_1, \\dots, x_n \\ge 0"}</M>, with{" "}
          <M>{"\\sum_i x_i = B"}</M>. Let a proxy objective depend only on the attributes in a set J, and be strictly
          increasing in at least one of them. Then every allocation that maximises the proxy has <M>{"x_k = 0"}</M> for
          every k outside J. If the true utility is <M>{"\\sum_i w_i u(x_i)"}</M> with positive weights and u strictly
          increasing and strictly concave, and its maximum gives some omitted attribute a positive amount, then every
          proxy optimum is strictly worse than the true optimum; if <M>{"u(0) = -\\infty"}</M>, as for a resource the
          world cannot do without, it is as bad as possible.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose a proxy optimum had <M>{"x_k > 0"}</M> for some <M>{"k \\notin J"}</M>. Moving that amount to an attribute
          j in J in which the proxy is strictly increasing leaves the budget satisfied and the proxy&apos;s other inputs
          unchanged, and strictly increases the proxy, a contradiction. For the second part, the budget set is convex and
          a positive sum of strictly concave functions is strictly concave, so the true maximum is unique. It gives an
          omitted attribute a positive amount, and every proxy optimum gives it 0, so no proxy optimum is the true
          maximum and each is strictly worse. If <M>{"u(0) = -\\infty"}</M> the proxy optimum&apos;s true utility is{" "}
          <M>{"-\\infty"}</M>. This is the argument of Zhuang and Hadfield-Menell (2020): with shared resources, leaving
          an attribute out of the objective is not neutral, it marks the attribute as free.
        </p>
      </Proof>

      <Example title="water-filling with and without an attribute">
        <p>
          With <M>{"u(x) = \\log(1 + x)"}</M>, the true optimum fills attributes in proportion to their weights:{" "}
          <M>{"x_i = w_i/\\lambda - 1"}</M> for those that receive anything, with λ set by the budget (<C>allocate</C>).
          For a budget of 4 and weights (2, 1, 1) it gives (2.5, 0.75, 0.75). A proxy that forgets the third attribute
          gives (3, 1, 0), and the loss in true utility (<C>utility</C>, <C>proxy_regret</C>) is the price of the
          omission.
        </p>
        <Code>{OMIT}</Code>
      </Example>

      <Remark title="why it gets worse with capability">
        <p>
          A weak optimiser explores near the behaviours its designers imagined, where the specification was written
          carefully. A strong one searches further, and the space of behaviours that score well grows faster than the
          set of behaviours anyone checked. Penalties for side effects, regularisation toward a reference policy as in
          the KL penalty, human oversight of outcomes rather than proxies, and learning the objective from feedback all
          help, and each has its own loopholes. The lessons that follow treat two of the deeper versions: the learned
          goal differing from the specified one, and oversight of systems whose behaviour humans cannot easily judge.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "loop",
      rung: "check",
      prompt: (
        <p>
          A target worth 1 is first hit at step 3 and again every 5 steps forever. With γ = 0.95, what is the discounted
          return of looping?
        </p>
      ),
      answer: { kind: "numeric", value: 3.79, tolerance: 0.002 },
    },
    {
      key: "regret",
      rung: "check",
      prompt: (
        <p>
          With u(x) = log(1 + x), a budget of 4 and true weights (2, 1, 1), how much true utility is lost by optimising a
          proxy with weights (2, 1, 0)?
        </p>
      ),
      answer: { kind: "numeric", value: 0.159, tolerance: 0.001 },
    },
    {
      key: "kind",
      rung: "apply",
      prompt: (
        <p>
          A robot arm trained from human approval learns to hover its hand between the camera and the object so that it
          looks as if it is grasping. What kind of failure is this?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Specification gaming: the reward, human approval of what the camera shows, was optimised correctly but differs from the intended grasp",
          "Goal misgeneralisation: the arm learned a different goal that matched the reward only in training",
          "An optimisation failure: the arm did not find the reward-maximising behaviour",
          "Overfitting to the training objects",
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

def allocate(budget, weights):
    active = [i for i, w in enumerate(weights) if w > 0]   # an attribute with weight 0 gets nothing
    while active:
        lam = sum(weights[i] for i in active) / (budget + len(active))
        keep = [i for i in active if weights[i] / lam >= 1]
        if keep == active:
            break
        active = keep                                      # drop attributes that would go negative
    return [weights[i] / lam - 1 if i in active else 0.0 for i in range(len(weights))]

def utility(alloc, weights):
    return sum(w * math.log(1 + x) for x, w in zip(alloc, weights))

def proxy_regret(budget, true_w, proxy_w):
    best = utility(allocate(budget, true_w), true_w)
    return best - utility(allocate(budget, proxy_w), true_w)

print(allocate(4, [2, 1, 1]), allocate(4, [2, 1, 0]), allocate(1, [3, 1]))
print(round(utility([1, 0], [2, 5]), 4), round(proxy_regret(4, [2, 1, 1], [2, 1, 1]), 4), round(proxy_regret(4, [1, 1], [1, 0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.5, 0.75, 0.75] [3.0, 1.0, 0.0] [1.0, 0.0]\n1.3863 0.0 0.5878",
          "[2.5, 0.75, 0.75] [3.0, 1.0, 0.0] [0.75, 0.25]\n1.3863 0.0 0.5878",
          "[2.0, 1.0, 1.0] [3.0, 1.0, 0.0] [1.0, 0.0]\n1.3863 0.0 0.5878",
          "[2.5, 0.75, 0.75] [3.0, 1.0, 0.0] [1.0, 0.0]\n1.3863 0.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def finish_return(f, t, gamma):
    return f * gamma ** t                                  # one reward f at step t

def loop_return(r, first, period, gamma):
    return r * gamma ** first / (1 - gamma ** period)      # r at step first, then every period steps

def games_the_spec(f, t, r, first, period, gamma):
    return loop_return(r, first, period, gamma) > finish_return(f, t, gamma)

print(finish_return(8, 3, 0.5), loop_return(1, 1, 1, 0.5), loop_return(2, 2, 2, 0.5))
print(games_the_spec(8, 3, 1, 1, 1, 0.5), games_the_spec(20, 20, 1, 3, 5, 0.95), games_the_spec(20, 20, 1, 3, 5, 0.99))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.0 0.6666666666666666\nFalse False True",
          "1.0 1.0 0.6666666666666666\nTrue False True",
          "1.0 2.0 0.6666666666666666\nTrue False True",
          "1.0 1.0 0.5\nFalse False True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>allocate(budget, weights)</C>, maximising the sum of w log(1 + x) over allocations summing to the
          budget, where attributes of weight 0 receive 0 and attributes that would receive a negative amount are dropped
          and λ recomputed; <C>utility(alloc, weights)</C>; and <C>proxy_regret(budget, true_w, proxy_w)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def allocate(budget, weights):
    total = sum(weights)
    return [budget * w / total for w in weights]

def utility(alloc, weights):
    return 0.0

def proxy_regret(budget, true_w, proxy_w):
    return 0.0
`,
        solution: OMIT,
        tests: [
          { name: "fill", code: `a = allocate(4, [2, 1, 1])\nassert all(abs(x - y) < 1e-9 for x, y in zip(a, [2.5, 0.75, 0.75])) and allocate(1, [3, 1]) == [1.0, 0.0]` },
          { name: "regret", code: `assert abs(utility([1, 3], [1, 1]) - math.log(8)) < 1e-12 and abs(proxy_regret(4, [1, 1], [1, 0]) - (2 * math.log(3) - math.log(5))) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>finish_return(f, t, gamma)</C>, <C>loop_return(r, first, period, gamma)</C>, and{" "}
          <C>games_the_spec(f, t, r, first, period, gamma)</C>, true when looping earns strictly more.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def finish_return(f, t, gamma):
    return f

def loop_return(r, first, period, gamma):
    return r

def games_the_spec(f, t, r, first, period, gamma):
    return False
`,
        solution: LOOP,
        tests: [
          { name: "returns", code: `assert abs(finish_return(4, 2, 0.5) - 1.0) < 1e-12 and abs(loop_return(3, 0, 2, 0.5) - 4.0) < 1e-12` },
          { name: "games", code: `assert games_the_spec(1, 1, 1, 1, 1, 0.9) and not games_the_spec(10, 1, 1, 1, 1, 0.5)` },
        ],
      },
    },
    {
      key: "patience",
      rung: "stretch",
      prompt: (
        <p>
          Finishing earns 30 at step 20; looping earns 1 at step 3 and every 5 steps after. Above about 0.85 finishing is
          better. What is the largest discount factor at which finishing still earns more than looping?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9923, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Gaming needs a flawed specification. A model can also go wrong with a correct one: trained where two goals
        coincide, it may learn the wrong one, and pursue it competently once they come apart.
      </p>
    </>
  ),
};
