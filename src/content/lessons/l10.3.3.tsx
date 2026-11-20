import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RaterDesignViz } from "@/components/viz/RaterDesignViz";
import type { LessonContent } from "@/lib/types";

const AGREE = `def observed_agreement(counts):
    r = sum(counts[0])
    return sum(sum(c * (c - 1) for c in row) / (r * (r - 1)) for row in counts) / len(counts)

def chance_agreement(counts):
    total = sum(sum(row) for row in counts)
    return sum((sum(row[j] for row in counts) / total) ** 2 for j in range(len(counts[0])))

def fleiss_kappa(counts):
    po, pe = observed_agreement(counts), chance_agreement(counts)
    return (po - pe) / (1 - pe)`;

const RATERS = `def item_means(ratings, offsets):
    tot, cnt = {}, {}
    for item, rater, score in ratings:
        tot[item] = tot.get(item, 0.0) + score - offsets.get(rater, 0.0)
        cnt[item] = cnt.get(item, 0) + 1
    return {i: tot[i] / cnt[i] for i in tot}

def rater_offsets(ratings, means):
    tot, cnt = {}, {}
    for item, rater, score in ratings:
        tot[rater] = tot.get(rater, 0.0) + score - means[item]
        cnt[rater] = cnt.get(rater, 0) + 1
    raw = {r: tot[r] / cnt[r] for r in tot}
    centre = sum(raw.values()) / len(raw)
    return {r: v - centre for r, v in raw.items()}

def fit_additive(ratings, iters):
    offsets = {}
    for _ in range(iters):
        offsets = rater_offsets(ratings, item_means(ratings, offsets))
    return item_means(ratings, offsets), offsets`;

export const lesson: LessonContent = {
  id: "l10.3.3",
  minutes: 50,
  links: {
    requires: ["l10.3.2", "l9.6.3"],
    revisits: ["l10.2.3", "l10.1.1", "m9.4.1"],
    foreshadows: ["l10.3.4", "l10.7.2", "l14.2.2"],
  },

  puzzle: (
    <>
      <p>
        Human judgement is the reference that model judges are checked against, but humans disagree with each other, differ in how
        generous they are, tire, and are swayed by fluent prose. Two labs can run &quot;human evaluations&quot; of the same pair of systems and
        reach opposite conclusions. What separates a human evaluation that measures quality from one that measures who happened to
        do the rating?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A human evaluation is an experiment with raters as a source of noise and bias. Three habits make it trustworthy: measure how
        much raters agree, so you know the ceiling on any measurement; assign raters to outputs at random, so rater differences
        cannot masquerade as system differences; and model rater effects in the analysis, so remaining imbalances are corrected.
      </p>
      <RaterDesignViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Fleiss' kappa">
        <p>
          For N items each labelled by R raters into categories, let <M>{"n_{ij}"}</M> be the number of raters putting item i in
          category j. The observed agreement is the chance that two different raters of the same item agree, averaged over items:
        </p>
        <MD>{"P_o = \\frac{1}{N}\\sum_i \\frac{\\sum_j n_{ij}(n_{ij}-1)}{R(R-1)}"}</MD>
        <p>
          (<C>observed_agreement</C>). Chance agreement uses the overall category shares <M>{"p_j"}</M>:{" "}
          <M>{"P_e = \\sum_j p_j^2"}</M> (<C>chance_agreement</C>). Then <M>{"\\kappa = (P_o - P_e)/(1 - P_e)"}</M> (<C>fleiss_kappa</C>),
          generalising Cohen&apos;s kappa (l9.6.3) to many raters. Values near 0.4 to 0.6 are common for judgements of helpfulness or quality;
          a kappa that low means individual labels are noisy, so several ratings per item are needed.
        </p>
        <Code>{AGREE}</Code>
      </Definition>

      <Remark title="agreement sets a ceiling">
        <p>
          If two humans agree with each other 70% of the time, a model judge that agrees with a single human 70% of the time is as good
          as another human, and no system can be shown to agree with humans much more than that. Report human–human agreement alongside
          any human–model agreement. Low agreement is also informative: it can mean the guidelines are ambiguous, which is fixed by
          rewriting them, or that the question is genuinely a matter of taste, in which case averaging hides real disagreement.
        </p>
      </Remark>

      <Theorem title="rater effects">
        <p>
          Model each rating as <M>{"y = \\mu_i + o_r + \\varepsilon"}</M>: the item&apos;s quality, the rater&apos;s leniency offset, and noise,
          with offsets summing to zero. The least-squares fit alternates two steps until they stop changing: item means after removing
          offsets (<C>item_means</C>), and rater offsets as the mean residual from the item means, re-centred (<C>rater_offsets</C>). This
          is coordinate descent on the squared error (<C>fit_additive</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The squared error <M>{"\\sum (y - \\mu_i - o_r)^2"}</M> is a convex quadratic. With the offsets fixed, setting the derivative with
          respect to <M>{"\\mu_i"}</M> to zero gives the mean over item i of <M>{"y - o_r"}</M>; with the item means fixed, the derivative
          with respect to <M>{"o_r"}</M> gives the mean over rater r of <M>{"y - \\mu_i"}</M>. Each step minimises exactly over one block, so
          the error never increases, and on a convex quadratic block coordinate descent converges to a minimiser. Centring the offsets
          shifts every item mean by the same constant without changing the fit, which pins down the free level. The offsets are
          identified only if raters overlap: the graph linking raters who rated a common item must be connected.
        </p>
        <Code>{RATERS}</Code>
      </Proof>

      <Example title="designing a study">
        <p>
          Randomise which rater sees which output and interleave the systems so no rater sees all of one system first. Hide which
          system produced each output. Prefer pairwise comparisons to absolute scores when differences are subtle; people are more
          consistent at saying which of two is better than at placing one on a scale. Include gold items with known answers to catch
          inattentive raters. Use clustered or rater-aware error bars (l10.2.3), since ratings by the same person are correlated.
        </p>
      </Example>

      <Remark title="who the raters are">
        <p>
          Crowd workers, domain experts and the system&apos;s intended users answer different questions. Fluent but wrong answers fool
          non-experts: for specialised content, such as medicine, law or advanced maths, experts are needed to judge correctness, while
          general users may be the right raters for tone and helpfulness. Rater pools also drift; some crowd workers now use language
          models to help them rate, which quietly turns a human evaluation into a model one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fleiss",
      rung: "check",
      prompt: (
        <p>
          Five raters label four items as acceptable or not. The counts (acceptable, not) are (5, 0), (4, 1), (3, 2) and (0, 5). What is
          Fleiss&apos; kappa? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.479, tolerance: 0.001 },
    },
    {
      key: "kappa",
      rung: "check",
      prompt: (
        <p>
          Raters agree on 72% of pairs of binary labels, and overall 60% of labels are one category and 40% the other. What is kappa?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.417, tolerance: 0.001 },
    },
    {
      key: "design",
      rung: "apply",
      prompt: (
        <p>
          A study uses one team of raters for system A in week one and another team for system B in week two. System B wins by a large
          margin. What is the main problem?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "System is confounded with rater team and time; the teams may differ in leniency, and no rater saw both systems, so offsets cannot even be estimated",
          "Two weeks is too short for a human evaluation",
          "Pairwise comparisons should have been used instead of scores",
          "Nothing, if each team had enough raters",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def observed_agreement(counts):
    r = sum(counts[0])
    return sum(sum(c * (c - 1) for c in row) / (r * (r - 1)) for row in counts) / len(counts)

def chance_agreement(counts):
    total = sum(sum(row) for row in counts)
    return sum((sum(row[j] for row in counts) / total) ** 2 for j in range(len(counts[0])))

def fleiss_kappa(counts):
    po, pe = observed_agreement(counts), chance_agreement(counts)
    return (po - pe) / (1 - pe)

print(observed_agreement([[2, 0], [1, 1]]), chance_agreement([[2, 0], [1, 1]]))
print(round(fleiss_kappa([[3, 0], [0, 3]]), 3), round(fleiss_kappa([[2, 1], [1, 2]]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.625\n1.0 -0.333",
          "0.75 0.625\n1.0 -0.333",
          "0.5 0.5\n1.0 -0.333",
          "0.5 0.625\n1.0 0.333",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def item_means(ratings, offsets):
    tot, cnt = {}, {}
    for item, rater, score in ratings:
        tot[item] = tot.get(item, 0.0) + score - offsets.get(rater, 0.0)
        cnt[item] = cnt.get(item, 0) + 1
    return {i: tot[i] / cnt[i] for i in tot}

def rater_offsets(ratings, means):
    tot, cnt = {}, {}
    for item, rater, score in ratings:
        tot[rater] = tot.get(rater, 0.0) + score - means[item]
        cnt[rater] = cnt.get(rater, 0) + 1
    raw = {r: tot[r] / cnt[r] for r in tot}
    centre = sum(raw.values()) / len(raw)
    return {r: v - centre for r, v in raw.items()}

def fit_additive(ratings, iters):
    offsets = {}
    for _ in range(iters):
        offsets = rater_offsets(ratings, item_means(ratings, offsets))
    return item_means(ratings, offsets), offsets

print(item_means([("x", "p", 4), ("x", "q", 2)], {"p": 1.0}), rater_offsets([("x", "p", 4), ("x", "q", 2)], {"x": 3.0}))
print(fit_additive([("x", "p", 5), ("x", "q", 3), ("y", "p", 4), ("y", "q", 2)], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'x': 2.5} {'p': 1.0, 'q': -1.0}\n({'x': 4.0, 'y': 3.0}, {'p': 1.0, 'q': -1.0})",
          "{'x': 3.0} {'p': 1.0, 'q': -1.0}\n({'x': 4.0, 'y': 3.0}, {'p': 1.0, 'q': -1.0})",
          "{'x': 2.5} {'p': 1.0, 'q': -1.0}\n({'x': 4.0, 'y': 3.0}, {'p': 0.0, 'q': 0.0})",
          "{'x': 2.5} {'p': 1.0, 'q': -1.0}\n({'x': 3.0, 'y': 4.0}, {'p': 1.0, 'q': -1.0})",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>observed_agreement(counts)</C>, <C>chance_agreement(counts)</C> and <C>fleiss_kappa(counts)</C>, where{" "}
          <C>counts</C> has one row per item and one column per category, and every row sums to the same number of raters.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def observed_agreement(counts):
    return 0.0

def chance_agreement(counts):
    return 0.5

def fleiss_kappa(counts):
    return 0.0
`,
        solution: AGREE,
        tests: [
          { name: "agree", code: `c = [[3, 0, 0], [0, 3, 0], [1, 2, 0], [0, 1, 2]]\nassert abs(observed_agreement(c) - 2 / 3) < 1e-12 and abs(chance_agreement(c) - 0.3888888889) < 1e-9` },
          { name: "kappa", code: `assert abs(fleiss_kappa([[4, 0], [0, 4], [2, 2]]) - 5 / 9) < 1e-12 and abs(fleiss_kappa([[3, 0, 0], [0, 3, 0], [1, 2, 0], [0, 1, 2]]) - 0.4545454545) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Ratings are (item, rater, score) tuples. Write <C>item_means(ratings, offsets)</C>, treating a missing rater as offset 0,{" "}
          <C>rater_offsets(ratings, means)</C>, centred to mean zero over raters, and <C>fit_additive(ratings, iters)</C>, which starts
          from no offsets, alternates <C>iters</C> times and returns the final item means and offsets.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def item_means(ratings, offsets):
    return {}

def rater_offsets(ratings, means):
    return {}

def fit_additive(ratings, iters):
    return {}, {}
`,
        solution: RATERS,
        tests: [
          { name: "steps", code: `assert item_means([("x", "p", 4), ("x", "q", 2), ("y", "p", 3)], {"p": 1.0}) == {"x": 2.5, "y": 2.0}\nassert rater_offsets([("x", "p", 4), ("x", "q", 2)], {"x": 3.0}) == {"p": 1.0, "q": -1.0}` },
          { name: "fit", code: `m, o = fit_additive([("a", "u", 4), ("a", "v", 2), ("b", "u", 5), ("b", "w", 4), ("c", "v", 1), ("c", "w", 2)], 200)\nassert abs(m["a"] - 3) < 1e-6 and abs(m["b"] - 4) < 1e-6 and abs(m["c"] - 2) < 1e-6 and abs(o["u"] - 1) < 1e-6 and abs(o["w"]) < 1e-6` },
        ],
      },
    },
    {
      key: "solve",
      rung: "stretch",
      prompt: (
        <p>
          Three outputs are rated by three raters: a by u (4) and v (3); b by u (5) and w (3); c by v (2) and w (1). The additive model
          fits these six ratings exactly with offsets summing to zero. What is output a&apos;s estimated quality? Its raw mean is 3.5.
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Pairwise judgements from many people, on prompts they choose themselves, can rank many models at once. The next lesson turns
        such votes into ratings and asks what an arena leaderboard really measures.
      </p>
    </>
  ),
};
