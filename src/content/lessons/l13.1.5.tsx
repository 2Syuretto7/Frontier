import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VerifierBonViz } from "@/components/viz/VerifierBonViz";
import type { LessonContent } from "@/lib/types";

const SELECT = `import math

def bon_verifier_acc(p, t, f, n):
    a = p * t + (1 - p) * f                                # chance one sample is accepted
    none = (1 - a) ** n
    return (1 - none) * p * t / a + none * p * (1 - t) / (1 - a)   # random accepted one, else random rejected one

def precision(p, t, f):
    return p * t / (p * t + (1 - p) * f)

def ucb(q, n_parent, n_child, c):
    if n_child == 0:
        return math.inf                                    # try every child once
    return q + c * math.sqrt(math.log(n_parent) / n_child)`;

const BEAM = `def beam_step(beams, expand, score, b):
    cands = [beam + [s] for beam in beams for s in expand(beam)]
    return sorted(cands, key=lambda c: -score(c))[:b]      # keep the b best partial chains

def beam_search(start, expand, score, b, depth):
    beams = [start]
    for _ in range(depth):
        beams = beam_step(beams, expand, score, b)
    return beams[0]

def beam_cost(depth, b, m):
    beams, total = 1, 0
    for _ in range(depth):
        total += beams * m                                 # steps generated at this level
        beams = min(b, beams * m)
    return total`;

export const lesson: LessonContent = {
  id: "l13.1.5",
  minutes: 50,
  links: {
    requires: ["l13.1.4"],
    revisits: ["l9.3.3", "l13.1.3"],
    foreshadows: ["l13.3.2"],
  },

  puzzle: (
    <>
      <p>
        With a verifier in hand, the obvious plan is to draw a thousand samples and keep the one it likes best. Yet
        experiments find that accuracy stops improving, and sometimes falls, as n grows into the thousands. Searching over
        partial solutions with the same verifier helps on hard problems at small budgets but loses to plain sampling at large
        ones. What limits selection by a verifier, and when is it worth searching step by step instead of sampling whole
        solutions?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A verifier that sometimes accepts a wrong answer is a filter with a leak. With few samples, the filter mostly finds
        a correct one if any exists. With many, there is always something accepted, and among accepted answers the share of
        wrong ones is fixed by the verifier, not by n. Searching step by step lets the verifier prune bad branches early,
        but it also applies the verifier&apos;s errors many more times, and an optimiser will find the verifier&apos;s blind
        spots.
      </p>
      <VerifierBonViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="best-of-n is limited by the verifier's precision">
        <p>
          Let each of n independent samples be correct with probability p, and let a verifier accept a correct sample with
          probability t and a wrong one with probability f. Return a uniformly random accepted sample, or a random sample if
          none is accepted. With <M>{"a = pt + (1-p)f"}</M>, the accuracy is
        </p>
        <MD>{"\\big(1 - (1-a)^n\\big)\\frac{pt}{a} + (1-a)^n \\frac{p(1-t)}{1-a}"}</MD>
        <p>
          (<C>bon_verifier_acc</C>), which tends to the precision <M>{"pt/a"}</M> (<C>precision</C>) as n grows.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each sample is accepted independently with probability a, and an accepted sample is correct with probability{" "}
          <M>{"pt/a"}</M> by Bayes&apos; rule. Given that k ≥ 1 samples are accepted, they are independent draws from the
          accepted distribution, so a random one of them is correct with probability <M>{"pt/a"}</M>, whatever k is. No sample
          is accepted with probability <M>{"(1-a)^n"}</M>, and then a random rejected sample is correct with probability{" "}
          <M>{"p(1-t)/(1-a)"}</M>. Adding the two cases gives the formula, and the second term vanishes as n grows. Graded
          verifiers behave worse: taking the maximum of a noisy score over many samples selects for the noise, so accuracy can
          peak and then decline, the inference-time form of reward over-optimisation.
        </p>
        <Code>{SELECT}</Code>
      </Proof>

      <Definition title="beam search over steps">
        <p>
          Treat a solution as a sequence of steps. Keep b partial solutions; extend each with m sampled next steps, score
          every extension with a process reward model, and keep the b best (<C>beam_step</C>, <C>beam_search</C>). The cost is
          the number of steps generated (<C>beam_cost</C>). Unlike best-of-n, poor branches are abandoned early and the saved
          compute goes into continuing good ones. A greedy beam (b = 1) commits to whatever looks best now, which can be a
          trap that a wider beam avoids.
        </p>
        <Code>{BEAM}</Code>
      </Definition>

      <Definition title="tree search with exploration">
        <p>
          Monte Carlo tree search grows a tree of partial solutions, choosing which node to extend by the upper confidence
          bound
        </p>
        <MD>{"Q(s') + c\\,\\sqrt{\\frac{\\ln N(s)}{N(s')}}"}</MD>
        <p>
          (<C>ucb</C>), where Q is the average value seen below the child s&apos;, N counts visits, and an unvisited child is
          always tried first. The bonus shrinks as a child is visited, so the search balances exploiting high-value branches
          with exploring uncertain ones. Values come from a PRM, from rollouts to a verifiable answer, or from the model
          judging its own partial work, as in Tree of Thoughts, which raised GPT-4&apos;s success at the Game of 24 from 4% with a
          single chain to 74% by breadth-first search over candidate steps scored by the model.
        </p>
      </Definition>

      <Remark title="which search for which budget">
        <p>
          Comparisons on competition mathematics with a fixed PRM found beam search better than best-of-n at small budgets and
          on harder problems, and worse at large budgets on easier ones, where the search over-optimised the PRM and its
          solutions degraded. The best strategy depended on the problem&apos;s difficulty, which is why adaptive allocation
          helped. The same tension, search power against verifier reliability, returns in agents, whose plans are searched
          over and whose verifiers are often weak.
        </p>
      </Remark>

      <Example title="search versus learning">
        <p>
          Reasoning models trained with reinforcement learning do much of this search inside one long chain: they propose,
          check and backtrack in text, using the same network as generator and verifier. Explicit tree search remains useful
          where an exact verifier exists, such as formal proofs checked by a proof assistant and programs checked by tests,
          because there over-optimisation is impossible: the verifier cannot be fooled.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "limit",
      rung: "check",
      prompt: (
        <p>
          Samples are correct with probability 0.2. A verifier accepts 80% of correct samples and 5% of wrong ones. What
          accuracy does best-of-n approach as n grows?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "ucb",
      rung: "check",
      prompt: (
        <p>
          A child node has average value 0.4 and 5 visits; its parent has 50 visits. With <M>{"c = \\sqrt 2"}</M>, what is
          its upper confidence bound?
        </p>
      ),
      answer: { kind: "numeric", value: 1.6509, tolerance: 0.001 },
    },
    {
      key: "plateau",
      rung: "apply",
      prompt: <p>Why does best-of-n with a binary verifier stop improving as n grows?</p>,
      answer: {
        kind: "choice",
        options: [
          "Once some sample is almost surely accepted, accuracy is the share of accepted samples that are correct, which n does not change",
          "Because the samples become correlated",
          "Because the verifier gets tired",
          "Because coverage stops growing",
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

def bon_verifier_acc(p, t, f, n):
    a = p * t + (1 - p) * f                                # chance one sample is accepted
    none = (1 - a) ** n
    return (1 - none) * p * t / a + none * p * (1 - t) / (1 - a)   # random accepted one, else random rejected one

def precision(p, t, f):
    return p * t / (p * t + (1 - p) * f)

def ucb(q, n_parent, n_child, c):
    if n_child == 0:
        return math.inf                                    # try every child once
    return q + c * math.sqrt(math.log(n_parent) / n_child)

print(round(bon_verifier_acc(0.3, 0.9, 0.1, 1), 4), round(bon_verifier_acc(0.3, 0.9, 0.1, 50), 4), round(precision(0.3, 0.9, 0.1), 4))
print(ucb(0.5, 100, 10, 1.0) > ucb(0.6, 100, 40, 1.0), ucb(0.0, 5, 0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3 0.7941 0.7941\nTrue inf",
          "0.27 0.7941 0.7941\nTrue inf",
          "0.3 1.0 0.7941\nTrue inf",
          "0.3 0.7941 0.7941\nFalse inf",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def beam_step(beams, expand, score, b):
    cands = [beam + [s] for beam in beams for s in expand(beam)]
    return sorted(cands, key=lambda c: -score(c))[:b]      # keep the b best partial chains

def beam_search(start, expand, score, b, depth):
    beams = [start]
    for _ in range(depth):
        beams = beam_step(beams, expand, score, b)
    return beams[0]

def beam_cost(depth, b, m):
    beams, total = 1, 0
    for _ in range(depth):
        total += beams * m                                 # steps generated at this level
        beams = min(b, beams * m)
    return total

ex = lambda s: [1, 2]; sc = lambda s: sum(s) - (5 if len(s) >= 2 and s[0] == 2 else 0)
print(beam_search([], ex, sc, 1, 2), beam_search([], ex, sc, 2, 2), beam_cost(3, 4, 2), beam_cost(3, 1, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 2] [1, 2] 14 15",
          "[1, 2] [1, 2] 14 15",
          "[2, 2] [2, 2] 14 15",
          "[2, 2] [1, 2] 24 15",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bon_verifier_acc(p, t, f, n)</C> from the theorem, <C>precision(p, t, f)</C>, and{" "}
          <C>ucb(q, n_parent, n_child, c)</C>, returning infinity for an unvisited child.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bon_verifier_acc(p, t, f, n):
    return p

def precision(p, t, f):
    return t

def ucb(q, n_parent, n_child, c):
    return q
`,
        solution: SELECT,
        tests: [
          { name: "acc", code: `assert abs(bon_verifier_acc(0.5, 1.0, 0.0, 3) - 0.875) < 1e-12 and precision(0.5, 1.0, 1.0) == 0.5` },
          { name: "ucb", code: `import math\nassert ucb(1.0, 1, 3, 2.0) == 1.0 and abs(ucb(0.0, math.e, 1, 3.0) - 3.0) < 1e-12 and ucb(0, 9, 0, 1) == math.inf` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>beam_step(beams, expand, score, b)</C>, keeping the b highest-scoring extensions in a stable order,{" "}
          <C>beam_search(start, expand, score, b, depth)</C> returning the best final beam, and{" "}
          <C>beam_cost(depth, b, m)</C>, the number of steps generated when every beam is extended m ways.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def beam_step(beams, expand, score, b):
    return beams

def beam_search(start, expand, score, b, depth):
    return start

def beam_cost(depth, b, m):
    return depth * m
`,
        solution: BEAM,
        tests: [
          { name: "step", code: `assert beam_step([[0]], lambda s: [1, 5, 3], sum, 2) == [[0, 5], [0, 3]]` },
          { name: "search", code: `assert beam_cost(2, 2, 3) == 9 and beam_search([], lambda s: [1, 2], sum, 1, 3) == [2, 2, 2]` },
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          A beam search of depth 4 keeps 8 beams and extends each in 4 ways, starting from one empty prefix. How many steps
          does it generate?
        </p>
      ),
      answer: { kind: "numeric", value: 84, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the model has only thought. The next chapter lets it act: call functions, run code and look things up, so
        that facts and computations it cannot do reliably in its head come from tools that can.
      </p>
    </>
  ),
};
