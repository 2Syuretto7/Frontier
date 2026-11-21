import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TestOrderViz } from "@/components/viz/TestOrderViz";
import type { LessonContent } from "@/lib/types";

const ORDER = `def expected_cost(order, tests):
    total, reach = 0.0, 1.0                                # reach: chance every earlier test passed
    for name in order:
        cost, p_pass = tests[name]
        total += reach * cost
        reach *= p_pass
    return total

def best_order(tests):
    def key(name):
        cost, p_pass = tests[name]
        return (cost / (1 - p_pass) if p_pass < 1 else float("inf"), name)
    return sorted(tests, key=key)                          # cost per unit chance of killing the project

def brute_best(tests):
    from itertools import permutations
    return min(expected_cost(o, tests) for o in permutations(tests))`;

const PILOT = `def posterior(prior, sens, fpr, positive):
    if positive:
        return prior * sens / (prior * sens + (1 - prior) * fpr)
    return prior * (1 - sens) / (prior * (1 - sens) + (1 - prior) * (1 - fpr))

def ev_without(prior, value, cost):
    return max(0.0, prior * value - cost)                  # run the full project only if it pays

def ev_with_pilot(prior, value, cost, sens, fpr, pilot_cost):
    p_pos = prior * sens + (1 - prior) * fpr
    pos = ev_without(posterior(prior, sens, fpr, True), value, cost)
    neg = ev_without(posterior(prior, sens, fpr, False), value, cost)
    return p_pos * pos + (1 - p_pos) * neg - pilot_cost`;

export const lesson: LessonContent = {
  id: "l15.2.2",
  minutes: 45,
  links: {
    requires: ["l15.2.1", "l8.4.1"],
    revisits: ["l8.2.4"],
    foreshadows: ["l15.2.3", "l15.4.3"],
  },

  puzzle: (
    <>
      <p>
        Your idea needs a new data pipeline, a signal at small scale, and a win over a tuned baseline at full scale. Any
        of the three could kill it. Six months later, after building everything carefully in order, you discover that
        the small-scale signal was never there. Which check should have come first, and how much is a quick, imperfect
        pilot experiment worth before committing to the full project?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A project survives only if every one of its risky assumptions holds, so the aim early on is not to make progress
        but to find out cheaply whether the project is doomed. Test first the assumption that is cheapest to check
        relative to its chance of failing, because a failure there saves all the later work. And run a pilot only when
        its result could change what you do: an experiment whose every outcome leads to the same decision is worth
        nothing, however interesting it is.
      </p>
      <TestOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="small experiments that de-risk">
        <p>
          The useful small experiments are those that can fail. Overfitting a single batch checks that the model, loss
          and optimiser are wired correctly. A tiny model on a slice of data checks that the pipeline runs end to end. A
          sweep at two or three small scales, fitted with the power laws of l8.4.1, checks whether the effect grows or
          shrinks with scale. A baseline tuned with the same budget as the new method checks that the comparison is fair,
          as in l8.2.4. Karpathy&apos;s 2019 &quot;Recipe for Training Neural Networks&quot; orders the work in the same
          spirit: become one with the data, build a skeleton end to end, overfit, then regularise and tune.
        </p>
      </Definition>

      <Theorem title="the best order of independent checks">
        <p>
          Let the project need checks i = 1, …, k, with costs <M>{"c_i"}</M> and independent pass probabilities{" "}
          <M>{"p_i"}</M>, run one at a time and stopping at the first failure. The expected cost of an order is{" "}
          <M>{"\\sum_j c_{\\pi(j)}\\prod_{l<j} p_{\\pi(l)}"}</M> (<C>expected_cost</C>), and it is minimised by running the
          checks in increasing order of
        </p>
        <MD>{"\\frac{c_i}{1 - p_i}"}</MD>
        <p>
          (<C>best_order</C>; a check that always passes goes last). For a few checks, trying every order confirms it{" "}
          (<C>brute_best</C>).
        </p>
        <Code>{ORDER}</Code>
      </Theorem>
      <Proof>
        <p>
          Take any order and two adjacent checks i then j, reached with probability R. They contribute{" "}
          <M>{"R(c_i + p_i c_j)"}</M>, and every later check is reached with probability <M>{"R p_i p_j"}</M> whichever
          comes first. Swapping them changes the cost by{" "}
          <M>{"R[(c_j + p_j c_i) - (c_i + p_i c_j)] = R[c_j(1 - p_i) - c_i(1 - p_j)]"}</M>, which is non-negative
          exactly when <M>{"c_i/(1 - p_i) \\le c_j/(1 - p_j)"}</M>. So an adjacent pair out of increasing order can be
          swapped without raising the cost, and repeated swaps, as in bubble sort, reach the sorted order. Every order
          therefore costs at least as much as the sorted one.
        </p>
      </Proof>

      <Definition title="the value of a pilot">
        <p>
          Suppose the full project costs C, pays V if the idea works, and you believe it works with probability π. Without
          more information you run it only if <M>{"\\pi V > C"}</M>, for an expected gain of{" "}
          <M>{"\\max(0, \\pi V - C)"}</M> (<C>ev_without</C>). A pilot that comes out positive with probability s if the
          idea works and f if not updates π by Bayes&apos; rule (<C>posterior</C>), and you then decide again; its value
          is the expected gain after the pilot, minus its cost (<C>ev_with_pilot</C>).
        </p>
        <Code>{PILOT}</Code>
      </Definition>

      <Theorem title="information never hurts, but may not help">
        <p>
          Before its cost, a pilot&apos;s expected gain is at least <M>{"\\max(0, \\pi V - C)"}</M>. It is exactly equal
          when every possible pilot result leads to the same decision.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let Π be the posterior after the pilot. Bayes&apos; rule gives <M>{"\\mathbb{E}[\\Pi] = \\pi"}</M>, since
          averaging the posterior over the pilot&apos;s outcomes recovers the prior. The function{" "}
          <M>{"g(x) = \\max(0, xV - C)"}</M> is convex, so by Jensen&apos;s inequality{" "}
          <M>{"\\mathbb{E}[g(\\Pi)] \\ge g(\\mathbb{E}[\\Pi]) = g(\\pi)"}</M>. Equality in Jensen for this piecewise linear
          g holds when all values of Π lie on one linear piece, that is, when the decision to run or not is the same for
          every outcome. Such a pilot changes nothing and is worth only its cost, negatively.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          Suppose the pipeline costs 2 weeks and works with probability 0.9, the small-scale signal costs 5 and appears
          with probability 0.4, and the full-scale comparison costs 20 and succeeds with probability 0.7. Their ratios are
          20, about 8.3, and about 67, so the signal check should come first and the full-scale run last. Built in the
          order the puzzle used, pipeline then signal then scale, the expected cost is{" "}
          <M>{"2 + 0.9 \\times 5 + 0.36 \\times 20 = 13.7"}</M> weeks; the sorted order saves a little here, and much more
          when the cheap check is also the risky one.
        </p>
      </Example>

      <Remark title="decide before you look">
        <p>
          Write down, before running a pilot, what result would make you stop, continue or change course. This turns the
          pilot into a decision, guards against reading whatever comes out as encouraging, and exposes pilots whose every
          outcome leads to &quot;continue&quot;, which the theorem says are worthless. Keep pilots honest by making them
          able to fail: a small-scale result that would have been reported as success whichever way it came out tests
          nothing.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: (
        <p>
          With the three checks of the example, pipeline (cost 2, passes 0.9), signal (5, 0.4) and full scale (20, 0.7),
          what is the expected cost of the best order?
        </p>
      ),
      answer: { kind: "numeric", value: 13.0, tolerance: 0.001 },
    },
    {
      key: "voi",
      rung: "check",
      prompt: (
        <p>
          A project costs 40 and pays 100 if it works, which you believe with probability 0.3. A pilot costing 2 is
          positive with probability 0.8 if the idea works and 0.2 if not. What is the expected gain with the pilot,
          after its cost? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 6.8, tolerance: 0.01 },
    },
    {
      key: "useless",
      rung: "apply",
      prompt: <p>When is a pilot experiment worth nothing before its cost?</p>,
      answer: {
        kind: "choice",
        options: [
          "When every possible result would lead to the same decision about the full project",
          "When it is cheaper than the full project",
          "When its result is noisy",
          "When it uses a smaller model than the full project",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def expected_cost(order, tests):
    total, reach = 0.0, 1.0                                # reach: chance every earlier test passed
    for name in order:
        cost, p_pass = tests[name]
        total += reach * cost
        reach *= p_pass
    return total

def best_order(tests):
    def key(name):
        cost, p_pass = tests[name]
        return (cost / (1 - p_pass) if p_pass < 1 else float("inf"), name)
    return sorted(tests, key=key)                          # cost per unit chance of killing the project

def brute_best(tests):
    from itertools import permutations
    return min(expected_cost(o, tests) for o in permutations(tests))

tests = {"a": (1, 0.5), "b": (4, 0.9), "c": (2, 0.0)}
print(expected_cost(["a", "b", "c"], tests), expected_cost(["c", "a", "b"], tests), best_order(tests))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.9 2.0 ['a', 'c', 'b']",
          "3.9 2.0 ['c', 'a', 'b']",
          "7.0 2.0 ['a', 'c', 'b']",
          "3.9 7.0 ['a', 'b', 'c']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def posterior(prior, sens, fpr, positive):
    if positive:
        return prior * sens / (prior * sens + (1 - prior) * fpr)
    return prior * (1 - sens) / (prior * (1 - sens) + (1 - prior) * (1 - fpr))

def ev_without(prior, value, cost):
    return max(0.0, prior * value - cost)                  # run the full project only if it pays

def ev_with_pilot(prior, value, cost, sens, fpr, pilot_cost):
    p_pos = prior * sens + (1 - prior) * fpr
    pos = ev_without(posterior(prior, sens, fpr, True), value, cost)
    neg = ev_without(posterior(prior, sens, fpr, False), value, cost)
    return p_pos * pos + (1 - p_pos) * neg - pilot_cost

print(round(posterior(0.5, 0.8, 0.2, True), 3), round(posterior(0.5, 0.8, 0.2, False), 3), ev_without(0.5, 10, 6))
print(round(ev_with_pilot(0.5, 10, 6, 0.8, 0.2, 0), 3), round(ev_with_pilot(0.5, 10, 6, 0.5, 0.5, 1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.8 0.2 0.0\n1.0 -1.0", "0.8 0.2 0.0\n1.0 0.0", "0.8 0.2 -1.0\n1.0 -1.0", "0.4 0.1 0.0\n1.0 -1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Tests map names to (cost, pass probability). Write <C>expected_cost(order, tests)</C>;{" "}
          <C>best_order(tests)</C>, sorted by cost / (1 − p) with p = 1 counted as infinite and ties broken by name; and{" "}
          <C>brute_best(tests)</C>, the smallest expected cost over all orders.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def expected_cost(order, tests):
    return sum(tests[n][0] for n in order)

def best_order(tests):
    return sorted(tests, key=lambda n: tests[n][0])

def brute_best(tests):
    return expected_cost(list(tests), tests)
`,
        solution: ORDER,
        tests: [
          { name: "cost", code: `T = {"x": (2, 0.5), "y": (4, 0.25)}\nassert abs(expected_cost(["x", "y"], T) - 4) < 1e-12 and abs(expected_cost(["y", "x"], T) - 4.5) < 1e-12 and abs(brute_best(T) - 4) < 1e-12` },
          { name: "order", code: `T = {"a": (1, 1.0), "b": (10, 0.0), "c": (3, 0.5), "d": (6, 0.5)}\nassert best_order(T) == ["c", "b", "d", "a"] and abs(expected_cost(best_order(T), T) - brute_best(T)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>posterior(prior, sens, fpr, positive)</C>, <C>ev_without(prior, value, cost)</C> and{" "}
          <C>ev_with_pilot(prior, value, cost, sens, fpr, pilot_cost)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def posterior(prior, sens, fpr, positive):
    return prior

def ev_without(prior, value, cost):
    return prior * value - cost

def ev_with_pilot(prior, value, cost, sens, fpr, pilot_cost):
    return ev_without(prior, value, cost) - pilot_cost
`,
        solution: PILOT,
        tests: [
          { name: "bayes", code: `assert abs(posterior(0.2, 0.9, 0.1, True) - 0.18 / 0.26) < 1e-12 and abs(posterior(0.2, 0.9, 0.1, False) - 0.02 / 0.74) < 1e-12 and ev_without(0.1, 10, 5) == 0` },
          { name: "pilot", code: `assert abs(ev_with_pilot(0.5, 10, 4, 1.0, 0.0, 0) - 3) < 1e-12 and abs(ev_with_pilot(0.9, 10, 1, 0.6, 0.4, 0.5) - 7.5) < 1e-12` },
        ],
      },
    },
    {
      key: "four",
      rung: "stretch",
      prompt: (
        <p>
          Four checks have (cost, pass probability) w = (3, 0.8), x = (1, 0.95), y = (6, 0.5) and z = (10, 0.6). What is
          the smallest expected cost over all orders? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 11.7, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Fast, honest experiments need code that can be trusted and rerun. The next lesson is about the engineering habits
        that make research results reproducible by their own authors.
      </p>
    </>
  ),
};
