import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AblationAttributionViz } from "@/components/viz/AblationAttributionViz";
import type { LessonContent } from "@/lib/types";

const FACTORIAL = `def main_effect(results, j):
    on = [y for x, y in results.items() if x[j] == 1]
    off = [y for x, y in results.items() if x[j] == 0]
    return sum(on) / len(on) - sum(off) / len(off)

def interaction(results, i, j):
    cell = {}
    for x, y in results.items():
        cell.setdefault((x[i], x[j]), []).append(y)
    m = {k: sum(v) / len(v) for k, v in cell.items()}
    return m[(1, 1)] - m[(1, 0)] - m[(0, 1)] + m[(0, 0)]

def loo_drops(results, k):
    full = results[(1,) * k]
    return [full - results[tuple(0 if t == j else 1 for t in range(k))] for j in range(k)]`;

const CREDIT = `import math
from itertools import permutations

def shapley(values, players):
    phi = {p: 0.0 for p in players}
    orders = list(permutations(players))
    for order in orders:
        seen = frozenset()
        for p in order:
            phi[p] += values[seen | {p}] - values[seen]
            seen = seen | {p}
    return {p: v / len(orders) for p, v in phi.items()}

def add_one_in(values, players):
    base = values[frozenset()]
    return {p: values[frozenset([p])] - base for p in players}

def paired_seed_diff(a_runs, b_runs):
    d = [a - b for a, b in zip(a_runs, b_runs)]
    n = len(d)
    m = sum(d) / n
    return m, math.sqrt(sum((x - m) ** 2 for x in d) / (n - 1) / n)`;

export const lesson: LessonContent = {
  id: "l10.7.2",
  minutes: 50,
  links: {
    requires: ["l10.7.1", "l10.2.2"],
    revisits: ["m9.8.2", "l10.2.4", "l10.6.4"],
    foreshadows: ["l10.7.3", "l10.7.4", "l11.2.2"],
  },

  puzzle: (
    <>
      <p>
        A paper introduces a model with three new components and reports an ablation table: removing any one of them costs about a
        point. A reader concludes each is worth a point and the three together are worth three. Then someone trains the baseline with
        all three removed and finds it only one point worse than the full model. Both experiments were done correctly. What went wrong
        with the reading?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An ablation changes one thing and measures the effect, but the effect of a component depends on what else is present. Components
        can overlap, so each looks unnecessary when the others remain, or depend on each other, so each looks useless alone. A careful
        ablation varies components jointly, controls for side effects such as parameter count, and repeats runs across seeds.
      </p>
      <AblationAttributionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="factorial designs">
        <p>
          With k components each on or off, a full factorial design runs all <M>{"2^k"}</M> combinations. The main effect of component j
          is the mean result with it on minus the mean with it off, averaged over all settings of the others (<C>main_effect</C>). The
          two-way interaction of i and j is <M>{"\\bar y_{11} - \\bar y_{10} - \\bar y_{01} + \\bar y_{00}"}</M> (<C>interaction</C>): zero
          when their effects add. Leave-one-out ablation, the usual table, reports only the drop from the full system (<C>loo_drops</C>),
          which equals the main effect only when there are no interactions.
        </p>
        <Code>{FACTORIAL}</Code>
      </Definition>

      <Theorem title="Shapley values share the full gain">
        <p>
          Let v(S) be the score with components S switched on. The Shapley value of component p, the average over all orders of adding
          components of the gain when p is added (<C>shapley</C>), satisfies{" "}
          <M>{"\\sum_p \\varphi_p = v(\\text{all}) - v(\\varnothing)"}</M>, gives equal credit to components that are interchangeable, and
          gives zero to a component that never changes the score.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a fixed order, the gains telescope: their sum is <M>{"v(\\text{all}) - v(\\varnothing)"}</M>. Averaging over orders keeps the
          sum. If swapping p and q in every set leaves v unchanged, the map that swaps them in each order is a bijection of orders that
          turns p&apos;s gains into q&apos;s, so their averages are equal. A component whose addition never changes v contributes zero in every
          order. Neither leave-one-out drops nor add-one-in gains (<C>add_one_in</C>) sum to the full gain in general: overlapping
          components make the drops too small, as in the puzzle, and components that need each other make the gains too small.
        </p>
        <Code>{CREDIT}</Code>
      </Proof>

      <Remark title="controls">
        <p>
          Removing a component also removes its parameters and compute. A fair ablation replaces it with something of equal size and cost,
          for example a plain layer of the same width, so that the comparison isolates the idea rather than the capacity. Hyperparameters
          tuned for the full model may be wrong for the ablated one, so each variant needs its own small tuning sweep, or the ablation
          measures sensitivity to tuning. A random or shuffled control, such as random labels for a probe or a random direction for an
          intervention, shows what a null effect looks like.
        </p>
      </Remark>

      <Remark title="seeds and pairing">
        <p>
          Differences between variants are often similar in size to the variation between seeds (m9.8.2). Run several seeds per variant,
          and pair runs that share a seed and data order, so that shared noise cancels; the standard error of the mean paired difference
          (<C>paired_seed_diff</C>) is then the right yardstick (l10.2.2). A table of single-seed results with no error bars cannot
          support a claim of a one-point difference.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The three components overlap: each provides much of the same benefit, so removing any one costs a point while removing all
          three also costs about a point. The leave-one-out drops sum to three, but the full gain is one. Shapley values would assign
          about a third of a point to each.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "main",
      rung: "check",
      prompt: (
        <p>
          A 2×2 ablation gives scores 60 (neither), 64 (A only), 63 (B only) and 71 (both). What is the main effect of A?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
    {
      key: "shap",
      rung: "check",
      prompt: (
        <p>
          Scores are 0.40 with neither component, 0.55 with A only, 0.50 with B only and 0.58 with both. What is A&apos;s Shapley value? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.115, tolerance: 0.001 },
    },
    {
      key: "control",
      rung: "apply",
      prompt: (
        <p>
          Removing a proposed attention variant, and with it 15% of the parameters, lowers accuracy by 2 points. What control is most
          needed before crediting the variant?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Replace it with a standard component of the same parameter count and compute, tuned separately, and compare with that",
          "Remove a different 15% of the parameters at random",
          "Train the full model for longer",
          "Report the result on a second benchmark",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def main_effect(results, j):
    on = [y for x, y in results.items() if x[j] == 1]
    off = [y for x, y in results.items() if x[j] == 0]
    return sum(on) / len(on) - sum(off) / len(off)

def interaction(results, i, j):
    cell = {}
    for x, y in results.items():
        cell.setdefault((x[i], x[j]), []).append(y)
    m = {k: sum(v) / len(v) for k, v in cell.items()}
    return m[(1, 1)] - m[(1, 0)] - m[(0, 1)] + m[(0, 0)]

def loo_drops(results, k):
    full = results[(1,) * k]
    return [full - results[tuple(0 if t == j else 1 for t in range(k))] for j in range(k)]

R = {(0, 0): 1.0, (1, 0): 3.0, (0, 1): 2.0, (1, 1): 6.0}
print(main_effect(R, 0), interaction(R, 0, 1), loo_drops(R, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 2.0 [4.0, 3.0]",
          "3.0 2.0 [3.0, 4.0]",
          "2.0 2.0 [4.0, 3.0]",
          "3.0 4.0 [4.0, 3.0]",
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
from itertools import permutations

def shapley(values, players):
    phi = {p: 0.0 for p in players}
    orders = list(permutations(players))
    for order in orders:
        seen = frozenset()
        for p in order:
            phi[p] += values[seen | {p}] - values[seen]
            seen = seen | {p}
    return {p: v / len(orders) for p, v in phi.items()}

def add_one_in(values, players):
    base = values[frozenset()]
    return {p: values[frozenset([p])] - base for p in players}

def paired_seed_diff(a_runs, b_runs):
    d = [a - b for a, b in zip(a_runs, b_runs)]
    n = len(d)
    m = sum(d) / n
    return m, math.sqrt(sum((x - m) ** 2 for x in d) / (n - 1) / n)

V = {frozenset(): 0.0, frozenset("a"): 1.0, frozenset("b"): 1.0, frozenset("ab"): 1.0}
print(shapley(V, ["a", "b"]), add_one_in(V, ["a", "b"]), paired_seed_diff([3, 5], [1, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'a': 0.5, 'b': 0.5} {'a': 1.0, 'b': 1.0} (3.0, 1.0)",
          "{'a': 1.0, 'b': 1.0} {'a': 1.0, 'b': 1.0} (3.0, 1.0)",
          "{'a': 0.5, 'b': 0.5} {'a': 0.0, 'b': 0.0} (3.0, 1.0)",
          "{'a': 0.5, 'b': 0.5} {'a': 1.0, 'b': 1.0} (3.0, 1.414)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Results map tuples of 0 or 1, one per component, to scores. Write <C>main_effect(results, j)</C>,{" "}
          <C>interaction(results, i, j)</C>, averaging each of the four cells over the other components, and{" "}
          <C>loo_drops(results, k)</C>, the drop from the all-on result when each of the k components alone is switched off.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def main_effect(results, j):
    return 0.0

def interaction(results, i, j):
    return 0.0

def loo_drops(results, k):
    return []
`,
        solution: FACTORIAL,
        tests: [
          { name: "effects", code: `R = {(a, b, c): a + 2 * b + 3 * c + a * b for a in (0, 1) for b in (0, 1) for c in (0, 1)}\nassert abs(main_effect(R, 0) - 1.5) < 1e-12 and abs(interaction(R, 0, 1) - 1.0) < 1e-12 and abs(interaction(R, 0, 2)) < 1e-12` },
          { name: "loo", code: `R = {(a, b, c): a + 2 * b + 3 * c + a * b for a in (0, 1) for b in (0, 1) for c in (0, 1)}\nassert loo_drops(R, 3) == [2, 3, 3]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Values map frozensets of components to scores. Write <C>shapley(values, players)</C> by averaging over all orders,{" "}
          <C>add_one_in(values, players)</C>, and <C>paired_seed_diff(a_runs, b_runs)</C>, returning the mean difference and its
          standard error with the n − 1 variance.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from itertools import permutations

def shapley(values, players):
    return {p: 0.0 for p in players}

def add_one_in(values, players):
    return {p: 0.0 for p in players}

def paired_seed_diff(a_runs, b_runs):
    return 0.0, 0.0
`,
        solution: CREDIT,
        tests: [
          { name: "shapley", code: `V = {frozenset(): 0, frozenset("a"): .1, frozenset("b"): .25, frozenset("c"): .2, frozenset("ab"): .45, frozenset("ac"): .3, frozenset("bc"): .4, frozenset("abc"): .7}\ns = shapley(V, ["a", "b", "c"])\nassert abs(s["a"] - 0.1833333333) < 1e-9 and abs(s["b"] - 0.3083333333) < 1e-9 and abs(sum(s.values()) - 0.7) < 1e-12` },
          { name: "other", code: `V = {frozenset(): 0.5, frozenset("x"): 0.7, frozenset("y"): 0.4}\na = add_one_in(V, ["x", "y"])\nassert abs(a["x"] - 0.2) < 1e-12 and abs(a["y"] + 0.1) < 1e-12\nm, se = paired_seed_diff([0.71, 0.73, 0.70, 0.74], [0.70, 0.71, 0.70, 0.72])\nassert abs(m - 0.0125) < 1e-12 and abs(se - 0.0047871355) < 1e-9` },
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          Three components score 0 with none, 0.2 (a), 0.1 (b) and 0 (c) alone, 0.4 (a and b), 0.3 (a and c), 0.1 (b and c), and 0.6 with
          all three. What is a&apos;s Shapley value? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Factorial ablations multiply the number of runs, which is affordable only for small models. The next lesson asks when results on
        small models predict what happens on large ones.
      </p>
    </>
  ),
};
