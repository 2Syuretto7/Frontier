import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ScoopTimingViz } from "@/components/viz/ScoopTimingViz";
import type { LessonContent } from "@/lib/types";

const PORTFOLIO = `def ev_per_month(p, value, months):
    return p * value / months

def best_portfolio(projects, budget):
    best = {0: (0.0, [])}                                  # months used -> (expected value, chosen projects)
    for name, (p, value, months) in sorted(projects.items()):
        for used, (ev, chosen) in list(best.items()):
            t = used + months
            if t <= budget and (t not in best or ev + p * value > best[t][0]):
                best[t] = (ev + p * value, chosen + [name])
    ev, chosen = max(best.values(), key=lambda b: b[0])
    return round(ev, 6), chosen

def prob_any_success(ps):
    fail = 1.0
    for p in ps:
        fail *= 1 - p                                      # independent projects
    return 1 - fail`;

const SCOOP = `import math

def p_not_scooped(rate, months):
    return math.exp(-rate * months)                        # no competitor arrival in a Poisson process

def adjusted_value(p, value, months, rate):
    return p * value * p_not_scooped(rate, months)

def best_by_adjusted(projects, rate):
    return max(sorted(projects), key=lambda n: adjusted_value(*projects[n], rate))`;

export const lesson: LessonContent = {
  id: "l15.2.1",
  minutes: 45,
  links: {
    requires: ["l15.1.3"],
    revisits: ["l15.1.1"],
    foreshadows: ["l15.2.2", "l15.4.1"],
  },

  puzzle: (
    <>
      <p>
        You have a year and three ideas. One is a safe improvement to a popular benchmark that ten other groups are
        probably also trying. One is an ambitious new method that will most likely fail. One is a careful study of why an
        existing method works, which few people are working on. Which should you choose, and can the choice be reasoned
        about, rather than made on taste alone?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A research problem is a bet. Its worth is roughly the chance of success times the value of success, spread over
        the time it takes, and discounted by the chance that someone else publishes first. Most of the judgement lies in
        estimating those numbers honestly; once estimated, they can be compared, combined into a portfolio of several
        bets, and used to decide how long to work before publishing. The arithmetic does not replace taste, but it
        makes the trade-offs explicit and shows when a crowded problem is a poor bet however promising it looks.
      </p>
      <ScoopTimingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="questions to ask of a problem">
        <p>
          Richard Hamming&apos;s 1986 talk &quot;You and Your Research&quot; urged researchers to know the important
          problems of their field and to work on one where they had a plausible line of attack: an important problem with
          no attack is not a good problem. George Heilmeier&apos;s questions, used at DARPA, make the same point as a
          checklist: what are you trying to do, how is it done today and what limits it, what is new in your approach,
          who cares, what are the risks, how long will it take and what will it cost, and what are the mid-term and final
          tests of success. A good problem also uses your comparative advantage, such as a dataset, a tool or a skill that
          few others have, which both raises the chance of success and lowers the chance of being scooped.
        </p>
      </Definition>

      <Theorem title="choosing a portfolio">
        <p>
          Give each project a success probability p, a value V and a duration in months, so its expected value is pV and
          its rate is pV per month (<C>ev_per_month</C>). The set of projects with the largest total expected value that
          fits a budget of B months is found exactly by dynamic programming over months used (<C>best_portfolio</C>). If
          the projects succeed independently, the chance that at least one succeeds is{" "}
          <M>{"1 - \\prod_i (1 - p_i)"}</M> (<C>prob_any_success</C>).
        </p>
        <Code>{PORTFOLIO}</Code>
      </Theorem>
      <Proof>
        <p>
          Expected value is additive, so the problem is a 0/1 knapsack with integer weights. After processing the first k
          projects, the table holds, for each total duration t, the largest expected value achievable by a subset of those
          k with duration exactly t. This holds for k = 0. For the step, an optimal subset of the first k + 1 with
          duration t either omits project k + 1, and is in the old table at t, or includes it, and the rest is an optimal
          subset of the first k with duration <M>{"t - m_{k+1}"}</M>; the update considers both, iterating over a copy of
          the old table so no project is used twice. The answer is the best entry with t ≤ B. Independence gives the
          probability that all fail as the product of the <M>{"1 - p_i"}</M>.
        </p>
      </Proof>

      <Theorem title="when to publish">
        <p>
          Suppose competitors who would scoop the result arrive as a Poisson process with rate λ per month{" "}
          (<C>p_not_scooped</C>, <C>adjusted_value</C>), and the chance of having succeeded by time T is{" "}
          <M>{"1 - e^{-\\mu T}"}</M>. The expected share of the value kept by finishing at T is{" "}
          <M>{"f(T) = e^{-\\lambda T}(1 - e^{-\\mu T})"}</M>, maximised at
        </p>
        <MD>{"T^* = \\frac{1}{\\mu}\\ln\\frac{\\lambda + \\mu}{\\lambda}."}</MD>
        <p>
          Comparing projects by <M>{"p V e^{-\\lambda T}"}</M> rather than pV can reverse a ranking (<C>best_by_adjusted</C>).
        </p>
        <Code>{SCOOP}</Code>
      </Theorem>
      <Proof>
        <p>
          The probability of no arrival in time T of a Poisson process with rate λ is <M>{"e^{-\\lambda T}"}</M>.
          Differentiating,{" "}
          <M>{"f'(T) = e^{-\\lambda T}\\left[-\\lambda(1 - e^{-\\mu T}) + \\mu e^{-\\mu T}\\right]"}</M>, which is zero
          when <M>{"(\\lambda + \\mu)e^{-\\mu T} = \\lambda"}</M>, that is at <M>{"T^*"}</M>. The bracket is decreasing in
          T, positive at T = 0 where it equals μ, and tends to −λ, so f rises before <M>{"T^*"}</M> and falls after it,
          and <M>{"T^*"}</M> is the unique maximum. A larger λ, a more crowded problem, shortens <M>{"T^*"}</M>.
        </p>
      </Proof>

      <Example title="the puzzle's three ideas">
        <p>
          Suppose the safe idea has p = 0.8 and value 10 but takes 6 months in a field where a competitor appears every 5
          months on average (λ = 0.2); its adjusted value is <M>{"8e^{-1.2} \\approx 2.4"}</M>. The careful study has p =
          0.6, value 10, 8 months and λ = 0.02, giving <M>{"6e^{-0.16} \\approx 5.1"}</M>. The ambitious method has p = 0.1
          and value 100 over 12 months with λ = 0.05, giving <M>{"10e^{-0.6} \\approx 5.5"}</M>, but with a 90% chance
          of nothing. A year allows the study plus a short exploratory phase on the ambitious idea, which is the next
          lesson&apos;s subject.
        </p>
      </Example>

      <Remark title="what the numbers miss">
        <p>
          The values are guesses, and research value is heavy-tailed: a few results matter far more than the rest, so
          a portfolio with one long shot can beat a set of safe bets. Sutton&apos;s 2019 essay &quot;The Bitter
          Lesson&quot; offers one heuristic for estimating value in machine learning: methods that scale with computation
          have repeatedly overtaken methods built on human knowledge, so prefer problems whose solutions will still matter
          when models are larger. Finally, a problem you find interesting enough to persist with is worth more than its
          estimate suggests, because persistence raises p.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tstar",
      rung: "check",
      prompt: (
        <p>
          Competitors arrive at rate 0.05 per month and your chance of success by time T is{" "}
          <M>{"1 - e^{-0.2T}"}</M>. When should you publish to maximise the expected share of value? Give the answer in
          months to three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 8.047, tolerance: 0.002 },
    },
    {
      key: "knap",
      rung: "check",
      prompt: (
        <p>
          Five projects have (probability, value, months) p = (0.3, 20, 5), q = (0.6, 8, 3), r = (0.8, 5, 2), s = (0.1,
          60, 7) and t = (0.5, 12, 4). What is the largest total expected value that fits in 12 months?
        </p>
      ),
      answer: { kind: "numeric", value: 16.8, tolerance: 0.001 },
    },
    {
      key: "attack",
      rung: "apply",
      prompt: <p>According to Hamming, what makes an important problem a good one to work on?</p>,
      answer: {
        kind: "choice",
        options: [
          "Having a plausible line of attack on it",
          "Its being the most famous open problem in the field",
          "Its needing the largest compute budget",
          "Its having no prior work at all",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ev_per_month(p, value, months):
    return p * value / months

def best_portfolio(projects, budget):
    best = {0: (0.0, [])}                                  # months used -> (expected value, chosen projects)
    for name, (p, value, months) in sorted(projects.items()):
        for used, (ev, chosen) in list(best.items()):
            t = used + months
            if t <= budget and (t not in best or ev + p * value > best[t][0]):
                best[t] = (ev + p * value, chosen + [name])
    ev, chosen = max(best.values(), key=lambda b: b[0])
    return round(ev, 6), chosen

def prob_any_success(ps):
    fail = 1.0
    for p in ps:
        fail *= 1 - p                                      # independent projects
    return 1 - fail

projects = {"a": (0.5, 10, 4), "b": (0.2, 40, 6), "c": (0.9, 3, 2)}
print(ev_per_month(*projects["a"]), best_portfolio(projects, 8), round(prob_any_success([0.5, 0.2, 0.9]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.25 (10.7, ['b', 'c']) 0.96",
          "1.25 (7.7, ['a', 'c']) 0.96",
          "1.25 (10.7, ['b', 'c']) 0.09",
          "5.0 (10.7, ['b', 'c']) 0.96",
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

def p_not_scooped(rate, months):
    return math.exp(-rate * months)                        # no competitor arrival in a Poisson process

def adjusted_value(p, value, months, rate):
    return p * value * p_not_scooped(rate, months)

def best_by_adjusted(projects, rate):
    return max(sorted(projects), key=lambda n: adjusted_value(*projects[n], rate))

projs = {"x": (0.5, 10, 2), "y": (0.9, 10, 12)}
print(round(p_not_scooped(0.1, 5), 4), round(adjusted_value(0.5, 10, 5, 0.1), 3), best_by_adjusted(projs, 0.1), best_by_adjusted(projs, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6065 3.033 x y", "0.6065 3.033 y y", "0.6065 3.033 x x", "0.5 2.5 x y"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Projects map names to (p, value, months). Write <C>ev_per_month(p, value, months)</C>;{" "}
          <C>best_portfolio(projects, budget)</C>, returning the largest total expected value rounded to six decimals
          and the chosen names in alphabetical order; and <C>prob_any_success(ps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ev_per_month(p, value, months):
    return p * value

def best_portfolio(projects, budget):
    return 0.0, []

def prob_any_success(ps):
    return max(ps)
`,
        solution: PORTFOLIO,
        tests: [
          { name: "ev", code: `assert abs(ev_per_month(0.5, 8, 2) - 2) < 1e-12 and abs(prob_any_success([0.5, 0.5]) - 0.75) < 1e-12 and prob_any_success([]) == 0` },
          { name: "knapsack", code: `P = {"a": (1, 6, 3), "b": (1, 5, 2), "c": (1, 5, 2), "d": (0.5, 30, 5)}\nassert best_portfolio(P, 4) == (10, ["b", "c"]) and best_portfolio(P, 5) == (15, ["d"]) and best_portfolio(P, 1) == (0, [])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>p_not_scooped(rate, months)</C>, <C>adjusted_value(p, value, months, rate)</C> and{" "}
          <C>best_by_adjusted(projects, rate)</C>, the name with the largest adjusted value, alphabetically first on
          ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def p_not_scooped(rate, months):
    return 1.0

def adjusted_value(p, value, months, rate):
    return p * value

def best_by_adjusted(projects, rate):
    return sorted(projects)[0]
`,
        solution: SCOOP,
        tests: [
          { name: "scoop", code: `assert abs(p_not_scooped(0.5, 2) - math.exp(-1)) < 1e-12 and abs(adjusted_value(0.5, 4, 1, math.log(2)) - 1) < 1e-12` },
          { name: "best", code: `P = {"a": (1, 1, 1), "b": (1, 3, 10)}\nassert best_by_adjusted(P, 0.01) == "b" and best_by_adjusted(P, 0.5) == "a" and best_by_adjusted({"y": (1, 1, 1), "x": (1, 1, 1)}, 0.1) == "x"` },
        ],
      },
    },
    {
      key: "share",
      rung: "stretch",
      prompt: (
        <p>
          With competitors arriving at rate 0.1 per month and success by time T having probability{" "}
          <M>{"1 - e^{-0.3T}"}</M>, what share of the value is kept by publishing at the best time? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4725, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every estimate of p here is uncertain, and the cheapest way to improve it is a small experiment. The next lesson
        is about designing those experiments so that a doomed project is found out in days rather than months.
      </p>
    </>
  ),
};
