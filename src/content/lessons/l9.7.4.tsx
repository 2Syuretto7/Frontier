import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TestTimeViz } from "@/components/viz/TestTimeViz";
import type { LessonContent } from "@/lib/types";

const VOTE = `import math

def majority_vote(answers):
    counts = {}
    for a in answers:
        counts[a] = counts.get(a, 0) + 1
    return max(counts, key=lambda a: counts[a])

def majority_accuracy(p, n):
    return sum(math.comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n // 2 + 1, n + 1))

def length_reward(lengths, correct):
    lo, hi = min(lengths), max(lengths)
    if hi == lo:
        return [0.0] * len(lengths)
    out = []
    for L, c in zip(lengths, correct):
        lam = 0.5 - (L - lo) / (hi - lo)
        out.append(lam if c else min(0.0, lam))
    return out`;

const BUDGET = `def cost_of(tokens, price_per_mtok):
    return tokens / 1e6 * price_per_mtok

def budget_force(thinking_tokens, budget):
    if len(thinking_tokens) <= budget:
        return list(thinking_tokens)
    return thinking_tokens[:budget] + ["</think>"]

def compute_optimal(options, budget):
    feasible = [acc for tokens, acc in options if tokens <= budget]
    return max(feasible) if feasible else None`;

export const lesson: LessonContent = {
  id: "l9.7.4",
  minutes: 50,
  links: {
    requires: ["l9.7.3"],
    revisits: ["l9.7.1", "l9.3.3"],
    foreshadows: ["e12.5.1", "l13.4.2"],
  },

  puzzle: (
    <>
      <p>
        A reasoning model asked &quot;what is 2 + 3?&quot; may think for hundreds of tokens, checking the sum several ways. Asked a hard
        olympiad problem, it may think for tens of thousands and still be wrong. Each token costs time and money at inference,
        multiplied by every user. Meanwhile, sampling the same model 64 times and voting can beat a single long answer. Given a
        fixed budget of tokens, how should it be spent: one long chain, many short ones, or a mixture that depends on the
        problem?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Test-time compute can be spent in parallel, by sampling several answers and choosing among them, or in sequence, by
        thinking longer or revising. Parallel sampling only helps as far as the selection method can find the right sample:
        majority vote when correct answers agree and wrong ones scatter, a verifier or reward model otherwise. Sequential
        thinking helps when the model can actually find and fix its errors. Easy problems need little of either, and training
        can teach a model to stop early on them.
      </p>
      <TestTimeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="self-consistency">
        <p>
          Sample n reasoning chains and return the most common final answer (<C>majority_vote</C>), as proposed by Wang et al. (2022).
          With two possible answers, the right one with probability p per sample and n odd, the vote is right with probability
        </p>
        <MD>{"\\sum_{k > n/2}\\binom{n}{k}p^k(1-p)^{n-k}"}</MD>
        <p>(<C>majority_accuracy</C>).</p>
        <Code>{VOTE}</Code>
      </Definition>

      <Theorem title="voting amplifies the majority">
        <p>
          In the two-answer case, as n grows the vote&apos;s accuracy tends to 1 if p &gt; 1/2 and to 0 if p &lt; 1/2.
        </p>
      </Theorem>
      <Proof>
        <p>
          The number of correct samples is Binomial(n, p) with mean np and standard deviation <M>{"\\sqrt{np(1-p)}"}</M>. If p &gt; 1/2, the
          threshold n/2 lies <M>{"n(p - 1/2)"}</M> below the mean, which is a growing number of standard deviations because{" "}
          <M>{"n/\\sqrt{n} \\to \\infty"}</M>, so by Chebyshev&apos;s inequality the probability of falling below it tends to 0. The case p &lt; 1/2
          is symmetric. Voting therefore helps problems the model mostly gets right and harms those where one wrong answer
          dominates; with many scattered wrong answers, what matters is whether the correct answer is the single most common one.
        </p>
      </Proof>

      <Definition title="controlling length">
        <p>
          Kimi k1.5 adds a length reward within each group of samples: with <M>{"\\lambda = 0.5 - (L - L_{\\min})/(L_{\\max} - L_{\\min})"}</M>,
          a correct response receives <M>{"\\lambda"}</M> and an incorrect one <M>{"\\min(0, \\lambda)"}</M>, so shorter correct answers are
          preferred and long wrong ones penalised (<C>length_reward</C>). At inference, budget forcing caps thinking by cutting it off
          and closing the think block (<C>budget_force</C>); s1 also extended thinking by suppressing the end of thinking and
          appending &quot;Wait&quot;, which improved accuracy up to a point. Some models take a thinking budget as an input and are trained
          to respect it.
        </p>
      </Definition>

      <Remark title="compute-optimal test-time scaling">
        <p>
          Snell et al. (2024) found the best way to spend test-time compute depends on difficulty: sequential revision helps more
          on easier problems, parallel search with a verifier on harder ones, and choosing per problem was about four times as
          efficient as best-of-n. On problems where the smaller model already had some success, extra inference compute could
          substitute for a model about fourteen times larger; on the hardest, pretraining compute was worth more. Choosing a
          strategy within a budget is a small optimisation (<C>compute_optimal</C>), and serving cost scales with tokens
          generated (<C>cost_of</C>).
        </p>
        <Code>{BUDGET}</Code>
      </Remark>

      <Example title="overthinking">
        <p>
          A model averages 2,000 thinking tokens on grade-school arithmetic it gets right in 200 in the first pass. Over ten million
          queries that is 18 billion extra tokens. A length reward during RL, or routing easy queries to a short-thinking mode,
          recovers most of it without loss of accuracy; the hard part is recognising difficulty before thinking.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "vote",
      rung: "check",
      prompt: (
        <p>
          Each sample answers a yes-or-no question correctly with probability 0.6. What is the accuracy of a majority vote over 5
          samples? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.683, tolerance: 0.001 },
    },
    {
      key: "lenrew",
      rung: "check",
      prompt: (
        <p>
          A group of four correct responses has lengths 100, 300, 500 and 450 tokens. What length reward does the 450-token response
          receive under the Kimi k1.5 rule? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.375, tolerance: 0.001 },
    },
    {
      key: "strategy",
      rung: "apply",
      prompt: (
        <p>
          On a set of hard problems, accuracy with 64 samples and a perfect checker is 95%, but majority vote over the same samples
          gives 57%. Where should effort go?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Into a better verifier or reward model for selecting among samples, since the right answer is usually present but voting cannot find it",
          "Into more samples per problem for majority voting",
          "Into lowering the sampling temperature",
          "Into shorter answers",
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

def majority_vote(answers):
    counts = {}
    for a in answers:
        counts[a] = counts.get(a, 0) + 1
    return max(counts, key=lambda a: counts[a])

def majority_accuracy(p, n):
    return sum(math.comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n // 2 + 1, n + 1))

def length_reward(lengths, correct):
    lo, hi = min(lengths), max(lengths)
    if hi == lo:
        return [0.0] * len(lengths)
    out = []
    for L, c in zip(lengths, correct):
        lam = 0.5 - (L - lo) / (hi - lo)
        out.append(lam if c else min(0.0, lam))
    return out

print(majority_vote(["3", "5", "3", "7"]), majority_vote(["a", "b"]), round(majority_accuracy(0.5, 1), 3))
print(majority_accuracy(1.0, 3), length_reward([10, 30], [True, False]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3 a 0.5\n1.0 [0.5, -0.5]",
          "3 b 0.5\n1.0 [0.5, -0.5]",
          "3 a 0.5\n1.0 [0.5, 0.0]",
          "3 a 0.0\n1.0 [0.5, -0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cost_of(tokens, price_per_mtok):
    return tokens / 1e6 * price_per_mtok

def budget_force(thinking_tokens, budget):
    if len(thinking_tokens) <= budget:
        return list(thinking_tokens)
    return thinking_tokens[:budget] + ["</think>"]

def compute_optimal(options, budget):
    feasible = [acc for tokens, acc in options if tokens <= budget]
    return max(feasible) if feasible else None

print(cost_of(2000000, 3.0), budget_force(["a", "b", "c"], 2), budget_force(["a"], 2))
print(compute_optimal([(100, 0.5), (400, 0.7), (1600, 0.8)], 500), compute_optimal([(100, 0.5)], 50))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6.0 ['a', 'b', '</think>'] ['a']\n0.7 None",
          "6.0 ['a', 'b'] ['a']\n0.7 None",
          "6.0 ['a', 'b', '</think>'] ['a', '</think>']\n0.7 None",
          "6.0 ['a', 'b', '</think>'] ['a']\n0.8 None",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>majority_vote(answers)</C>, breaking ties in favour of the answer seen first, <C>majority_accuracy(p, n)</C> for odd n, and{" "}
          <C>length_reward(lengths, correct)</C>, returning zeros when all lengths are equal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def majority_vote(answers):
    return answers[0]

def majority_accuracy(p, n):
    return p

def length_reward(lengths, correct):
    return [1.0 if c else 0.0 for c in correct]
`,
        solution: VOTE,
        tests: [
          { name: "vote", code: `assert majority_vote(["x", "y", "y", "x", "z"]) == "x" and majority_vote(["q", "r", "r"]) == "r" and abs(majority_accuracy(0.9, 3) - 0.972) < 1e-12` },
          { name: "len", code: `assert length_reward([5, 5], [True, False]) == [0.0, 0.0] and length_reward([0, 50, 100], [True, False, False]) == [0.5, 0.0, -0.5]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cost_of(tokens, price_per_mtok)</C>, <C>budget_force(thinking_tokens, budget)</C>, which truncates and appends
          &quot;&lt;/think&gt;&quot; only when over budget, and <C>compute_optimal(options, budget)</C>, the best accuracy among (tokens, accuracy) options
          within budget, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cost_of(tokens, price_per_mtok):
    return tokens * price_per_mtok

def budget_force(thinking_tokens, budget):
    return thinking_tokens[:budget]

def compute_optimal(options, budget):
    return max(acc for tokens, acc in options)
`,
        solution: BUDGET,
        tests: [
          { name: "cost", code: `assert abs(cost_of(500000, 8.0) - 4.0) < 1e-12 and budget_force(list("abcd"), 1) == ["a", "</think>"] and budget_force(list("ab"), 2) == ["a", "b"]` },
          { name: "opt", code: `assert compute_optimal([(10, 0.2), (20, 0.9), (30, 0.95)], 25) == 0.9 and compute_optimal([(10, 0.2)], 9) is None` },
        ],
      },
    },
    {
      key: "hurt",
      rung: "stretch",
      prompt: (
        <p>
          Each sample answers a yes-or-no question correctly with probability 0.4. What is the accuracy of a majority vote over 7
          samples? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.29, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This module trained models to be right. The last module of the course turns to who the model is: the written
        specifications of how it should behave, honesty and sycophancy, and when it should decline.
      </p>
    </>
  ),
};
