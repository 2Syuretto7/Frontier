import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ElicitationViz } from "@/components/viz/ElicitationViz";
import type { LessonContent } from "@/lib/types";

const CEILING = `import math

def aitken_ceiling(p0, p1, p2):
    r = (p2 - p1) / (p1 - p0)
    return p0 + (p1 - p0) / (1 - r)

def shrink_ratio(p0, p1, p2):
    return (p2 - p1) / (p1 - p0)

def steps_to_close(p0, p1, p2, frac):
    return math.ceil(math.log(frac) / math.log(shrink_ratio(p0, p1, p2)))`;

const TECHNIQUES = `def union_rate(results):
    n = len(next(iter(results.values())))
    return sum(any(r[i] for r in results.values()) for i in range(n)) / n

def best_single(results):
    return max(sum(r) / len(r) for r in results.values())

def marginal_gains(results, order):
    n = len(results[order[0]])
    solved = [False] * n
    gains = []
    for name in order:
        before = sum(solved)
        solved = [s or r for s, r in zip(solved, results[name])]
        gains.append((sum(solved) - before) / n)
    return gains`;

export const lesson: LessonContent = {
  id: "l10.5.2",
  minutes: 45,
  links: {
    requires: ["l10.5.1", "l10.3.1"],
    revisits: ["l9.7.4", "l10.4.1", "l10.1.2"],
    foreshadows: ["l10.5.3", "l13.1.5", "l14.3.3"],
  },

  puzzle: (
    <>
      <p>
        An evaluation team asks a model to exploit a vulnerable web server and it fails. A month later, outside researchers give the
        same model a shell, a few example exploits and permission to try twenty times, and it succeeds. Which result describes the
        model? For a safety decision, the relevant capability is what a determined user could get out of the model, and an evaluation
        that underestimates it is worse than useless, because it is reassuring.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Elicitation is the work of drawing out a model&apos;s full capability before measuring it. Each technique, from better prompts to
        tools to fine-tuning, typically adds some success, with diminishing returns. The evaluator&apos;s task is to push until the gains
        flatten, report how hard they pushed, and estimate how much further a better-resourced adversary could go.
      </p>
      <ElicitationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the toolbox">
        <p>
          Prompting: clear instructions, worked examples, asking for step-by-step reasoning, and removing refusals that block an
          evaluation of a deliberately harmful skill (often by testing a version without safety training). Scaffolding: tools such as a
          shell, a browser or a code interpreter, and an agent loop with memory and planning (l10.4.1). Sampling: many attempts with a
          checker (l10.3.1), or majority voting and longer thinking budgets (l9.7.4). Fine-tuning on task demonstrations, which can
          unlock capabilities that no prompt reaches. A real attacker may have all of these, so an evaluation should too.
        </p>
      </Definition>

      <Theorem title="extrapolating to the ceiling">
        <p>
          Suppose each round of extra effort closes a fixed fraction of the remaining gap to a ceiling c, so the success rate after round
          k is <M>{"p_k = c - (c - p_0)r^k"}</M> with 0 &lt; r &lt; 1. Then from any three consecutive rounds,
        </p>
        <MD>{"r = \\frac{p_2 - p_1}{p_1 - p_0}, \\qquad c = p_0 + \\frac{p_1 - p_0}{1 - r}."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"p_{k+1} - p_k = (c - p_0) r^k (1 - r)"}</M>, so successive differences shrink by the factor r (<C>shrink_ratio</C>). The total
          remaining gain after round 0 is the geometric series <M>{"(p_1 - p_0)(1 + r + r^2 + \\dots) = (p_1 - p_0)/(1-r)"}</M>, which gives c
          (<C>aitken_ceiling</C>). This is Aitken&apos;s <M>{"\\Delta^2"}</M> extrapolation. The gap shrinks by r per round, so closing all but a
          fraction f of it takes <M>{"\\lceil \\ln f / \\ln r \\rceil"}</M> rounds (<C>steps_to_close</C>). With measurement noise, three
          points give unstable estimates; fitting the curve to all rounds by least squares, as the figure does, is more robust.
        </p>
        <Code>{CEILING}</Code>
      </Proof>

      <Definition title="combining techniques">
        <p>
          For a capability claim, a task counts as within reach if any technique solves it, so the right summary is the union across
          techniques (<C>union_rate</C>), not the best single technique (<C>best_single</C>). Adding techniques one at a time and
          recording how many new tasks each solves (<C>marginal_gains</C>) shows whether the search is saturating; large late gains mean
          the evaluation has not finished eliciting.
        </p>
        <Code>{TECHNIQUES}</Code>
      </Definition>

      <Remark title="how much is enough">
        <p>
          No amount of effort proves a capability absent; the aim is to make the remaining gap small relative to the safety margin. Good
          practice spends effort in proportion to the stakes, records the techniques tried and their gains, uses a team with domain
          expertise and time comparable to a motivated attacker, and adds an explicit allowance to measured scores for the elicitation
          not done. Evaluators need access deep enough for this, such as fine-tuning and versions without safety training; an
          evaluation limited to a consumer interface measures the interface, not the model.
        </p>
      </Remark>

      <Example title="a saturating search">
        <p>
          Rounds of effort give success rates 0.20, 0.40 and 0.50. The ratio is 0.5, so the extrapolated ceiling is{" "}
          <M>{"0.2 + 0.2/0.5 = 0.6"}</M>, well above the best measured rate. Reporting 0.5 as the model&apos;s capability would understate it
          by a sixth.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "union",
      rung: "check",
      prompt: (
        <p>
          Of 20 tasks, prompt strategy A solves tasks 1 to 6, strategy B solves tasks 4 to 9 and strategy C solves tasks 8 to 11. What
          fraction of tasks is within reach of at least one strategy? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.55, tolerance: 0.001 },
    },
    {
      key: "steps",
      rung: "check",
      prompt: (
        <p>
          Each round of elicitation closes 40% of the remaining gap to the ceiling, so r = 0.6. How many rounds are needed to close all
          but 5% of the initial gap?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
    {
      key: "access",
      rung: "apply",
      prompt: (
        <p>
          An evaluator can query a model only through its public chat interface, with safety filters on. It finds no dangerous
          capability. What does this show?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Only that the capability was not reached through that interface; tools, fine-tuning and unfiltered versions might reveal it",
          "That the model lacks the capability",
          "That the safety filters are unnecessary",
          "That the capability will not appear in later models",
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

def aitken_ceiling(p0, p1, p2):
    r = (p2 - p1) / (p1 - p0)
    return p0 + (p1 - p0) / (1 - r)

def shrink_ratio(p0, p1, p2):
    return (p2 - p1) / (p1 - p0)

def steps_to_close(p0, p1, p2, frac):
    return math.ceil(math.log(frac) / math.log(shrink_ratio(p0, p1, p2)))

print(aitken_ceiling(0.0, 0.5, 0.75), shrink_ratio(0.0, 0.5, 0.75))
print(steps_to_close(0.0, 0.5, 0.75, 0.125), steps_to_close(0.0, 0.5, 0.75, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.5\n3 4",
          "0.875 0.5\n3 4",
          "1.0 0.5\n3 3",
          "1.0 2.0\n3 4",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def union_rate(results):
    n = len(next(iter(results.values())))
    return sum(any(r[i] for r in results.values()) for i in range(n)) / n

def best_single(results):
    return max(sum(r) / len(r) for r in results.values())

def marginal_gains(results, order):
    n = len(results[order[0]])
    solved = [False] * n
    gains = []
    for name in order:
        before = sum(solved)
        solved = [s or r for s, r in zip(solved, results[name])]
        gains.append((sum(solved) - before) / n)
    return gains

R = {"plain": [1, 0, 0, 0], "cot": [1, 1, 0, 0], "tools": [0, 0, 1, 0]}
print(union_rate(R), best_single(R), marginal_gains(R, ["plain", "cot", "tools"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 0.5 [0.25, 0.25, 0.25]",
          "0.75 0.5 [0.25, 0.5, 0.25]",
          "0.5 0.5 [0.25, 0.25, 0.25]",
          "0.75 0.25 [0.25, 0.25, 0.25]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>aitken_ceiling(p0, p1, p2)</C>, <C>shrink_ratio(p0, p1, p2)</C> and <C>steps_to_close(p0, p1, p2, frac)</C>, the
          number of rounds, rounded up, after which the gap is at most <C>frac</C> of what it was.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def aitken_ceiling(p0, p1, p2):
    return p2

def shrink_ratio(p0, p1, p2):
    return 0.5

def steps_to_close(p0, p1, p2, frac):
    return 1
`,
        solution: CEILING,
        tests: [
          { name: "ceiling", code: `assert abs(aitken_ceiling(0.2, 0.4, 0.5) - 0.6) < 1e-12 and abs(shrink_ratio(0.2, 0.4, 0.5) - 0.5) < 1e-12` },
          { name: "steps", code: `assert steps_to_close(0.1, 0.3, 0.4, 0.01) == 7 and steps_to_close(0.2, 0.32, 0.38, 0.05) == 5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Results map each technique to a list of 0 or 1 per task. Write <C>union_rate(results)</C>, <C>best_single(results)</C>, and{" "}
          <C>marginal_gains(results, order)</C>, the fraction of tasks newly solved by each technique when added in the given order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def union_rate(results):
    return 0.0

def best_single(results):
    return 0.0

def marginal_gains(results, order):
    return []
`,
        solution: TECHNIQUES,
        tests: [
          { name: "rates", code: `R = {"a": [1, 1, 0, 0, 0], "b": [0, 1, 1, 0, 0], "c": [0, 0, 0, 0, 1]}\nassert abs(union_rate(R) - 0.8) < 1e-12 and abs(best_single(R) - 0.4) < 1e-12` },
          { name: "gains", code: `R = {"a": [1, 1, 0, 0, 0], "b": [0, 1, 1, 0, 0], "c": [0, 0, 0, 0, 1]}\nassert marginal_gains(R, ["c", "a", "b"]) == [0.2, 0.4, 0.2]` },
        ],
      },
    },
    {
      key: "ceil",
      rung: "stretch",
      prompt: (
        <p>
          Three rounds of increasing elicitation effort give success rates 0.10, 0.25 and 0.34. Assuming each round closes a fixed fraction
          of the remaining gap, what is the extrapolated ceiling? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.475, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Elicitation assumes the model is not working against the evaluator. The next lesson asks what happens if it is: a model that
        underperforms on purpose when it suspects it is being evaluated.
      </p>
    </>
  ),
};
