import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MetricShapeViz } from "@/components/viz/MetricShapeViz";
import type { LessonContent } from "@/lib/types";

const TWOSTEP = `import math

def loss_from_compute(C, E, a, b):
    return E + a * C ** (-b)

def acc_from_loss(L, chance, k, L0):
    return chance + (1 - chance) / (1 + math.exp(k * (L - L0)))

def predict_acc(C, law, link):
    return acc_from_loss(loss_from_compute(C, *law), *link)`;

const LINK = `import math

def logit(y):
    return math.log(y / (1 - y))

def fit_link(Ls, accs, chance):
    u = Ls
    v = [logit((a - chance) / (1 - chance)) for a in accs]
    mu, mv = sum(u) / len(u), sum(v) / len(v)
    slope = sum((x - mu) * (y - mv) for x, y in zip(u, v)) / sum((x - mu) ** 2 for x in u)
    k = -slope
    L0 = mu + mv / k
    return k, L0

def exact_match(p, length):
    return p ** length`;

export const lesson: LessonContent = {
  id: "l8.4.5",
  minutes: 50,
  links: {
    requires: ["l8.4.1", "l1.3.1"],
    revisits: ["l8.1.1", "m9.6.1"],
    foreshadows: ["l8.6.3", "l10.1.1"],
  },

  puzzle: (
    <>
      <p>
        Pretraining loss follows smooth power laws across many orders of magnitude, but nobody deploys a model for its loss.
        What matters is whether it answers questions, writes working code, solves problems. Benchmark scores can sit at chance
        for several model sizes and then shoot up. Before spending a training budget, the Llama 3 team predicted the score of
        the final 405-billion-parameter model on a reasoning benchmark from runs a thousand times smaller, and the prediction
        held. How?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Benchmark scores are coarse summaries of a quantity that does change smoothly: the probability the model assigns to the
        correct answer. Predict that probability, or its negative log, from compute with a power law, then map it to the
        score through a fixed link function fitted on existing models. The sudden jumps come from the link: a metric that needs
        every token right, or that only counts the top choice, turns smooth progress into a threshold.
      </p>
      <MetricShapeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="two-step prediction">
        <p>
          Step one fits the loss on a task&apos;s correct answers against compute, <M>{"L(C) = E + aC^{-b}"}</M> (<C>loss_from_compute</C>). Step
          two fits a link from that loss to accuracy, for multiple choice with chance level c,
        </p>
        <MD>{"\\mathrm{acc}(L) = c + \\frac{1 - c}{1 + e^{k(L - L_0)}}"}</MD>
        <p>
          (<C>acc_from_loss</C>), and the prediction composes the two (<C>predict_acc</C>). The link can be fitted on models of any family
          trained on similar data, since it relates two measured quantities of the same model, not compute.
        </p>
        <Code>{TWOSTEP}</Code>
      </Definition>

      <Theorem title="the link is linear in the logit">
        <p>
          With <M>{"y = (\\mathrm{acc} - c)/(1 - c)"}</M>, the link above is equivalent to
        </p>
        <MD>{"\\operatorname{logit}(y) = \\ln\\frac{y}{1-y} = k(L_0 - L)"}</MD>
        <p>
          so k and <M>{"L_0"}</M> follow from a straight-line fit of the logit of the rescaled accuracy against loss (<C>logit</C>, <C>fit_link</C>).
        </p>
        <Code>{LINK}</Code>
      </Theorem>
      <Proof>
        <p>
          From the link, <M>{"y = 1/(1 + e^{k(L - L_0)})"}</M>, so <M>{"1/y - 1 = e^{k(L - L_0)}"}</M> and <M>{"(1 - y)/y = e^{k(L - L_0)}"}</M>. Taking logs,{" "}
          <M>{"\\ln(y/(1-y)) = k(L_0 - L)"}</M>, a line in L with slope −k that crosses zero at <M>{"L = L_0"}</M>.
        </p>
      </Proof>

      <Remark title="where jumps come from">
        <p>
          If the model gets each of ℓ answer tokens right with probability p, exact match scores <M>{"p^{\\ell}"}</M> (<C>exact_match</C>). With
          ℓ = 20, raising p from 0.95 to 0.99 lifts the score from about 0.36 to 0.82: a smooth change in the per-token quantity
          becomes a steep one in the metric. Schaeffer and colleagues argued that many reported emergent abilities are of this
          kind, a theme taken up in l8.6.3. Not every jump disappears under a better metric, though, and tasks that need a
          capability to be composed of several sub-skills can genuinely improve sharply.
        </p>
      </Remark>

      <Example title="Llama 3's forecast">
        <p>
          The Llama 3 team fitted the negative log-likelihood of the correct answer on ARC-Challenge against compute using small
          models up to about 10²² FLOPs, then fitted a sigmoid from that likelihood to accuracy using the small models and the
          earlier Llama 2 family. Composing the two predicted the 405-billion-parameter model&apos;s score, at almost 4 × 10²⁵
          FLOPs, to within a small margin, slightly underestimating it. The method works best when the benchmark&apos;s format
          is stable and its answers are in the training distribution; it is weaker for tasks unlocked by post-training.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "em",
      rung: "check",
      prompt: <p>A model gets each token of a 20-token answer right with probability 0.9, independently. What is its exact-match rate? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1216, tolerance: 0.0002 },
    },
    {
      key: "link",
      rung: "check",
      prompt: <p>A four-way multiple-choice link has c = 0.25, k = 5 and L₀ = 1.0. What accuracy does it predict at loss 0.8? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.7983, tolerance: 0.0002 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can the loss-to-accuracy link be fitted on a different model family from the one being forecast?</p>,
      answer: {
        kind: "choice",
        options: [
          "It relates two measurements of the same model, its answer loss and its accuracy, which depend on each other much more than on how the model was built or how much compute it used",
          "Because all model families have identical scaling laws in compute",
          "Because accuracy does not depend on loss",
          "Because the link is fixed by the number of answer options alone",
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

def loss_from_compute(C, E, a, b):
    return E + a * C ** (-b)

def acc_from_loss(L, chance, k, L0):
    return chance + (1 - chance) / (1 + math.exp(k * (L - L0)))

def predict_acc(C, law, link):
    return acc_from_loss(loss_from_compute(C, *law), *link)

print(loss_from_compute(100, 1.0, 10.0, 0.5), acc_from_loss(1.0, 0.25, 3.0, 1.0), acc_from_loss(50.0, 0.0, 1.0, 0.0) < 1e-20)
print(round(predict_acc(1e4, (0.5, 50.0, 0.5), (0.5, 2.0, 1.0)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 0.625 True\n0.75",
          "2.0 0.5 True\n0.75",
          "11.0 0.625 True\n0.75",
          "2.0 0.625 False\n0.5",
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

def logit(y):
    return math.log(y / (1 - y))

def fit_link(Ls, accs, chance):
    u = Ls
    v = [logit((a - chance) / (1 - chance)) for a in accs]
    mu, mv = sum(u) / len(u), sum(v) / len(v)
    slope = sum((x - mu) * (y - mv) for x, y in zip(u, v)) / sum((x - mu) ** 2 for x in u)
    k = -slope
    L0 = mu + mv / k
    return k, L0

def exact_match(p, length):
    return p ** length

print(logit(0.5), [round(v, 4) for v in fit_link([1.0, 2.0], [0.25 + 0.75 / (1 + math.exp(-2)), 0.25 + 0.75 / (1 + math.exp(-1))], 0.25)])
print(exact_match(0.5, 3), round(exact_match(0.99, 100), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 [1.0, 3.0]\n0.125 0.366",
          "0.0 [-1.0, 3.0]\n0.125 0.366",
          "1.0 [1.0, 3.0]\n0.125 0.366",
          "0.0 [1.0, 3.0]\n1.5 0.99",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>loss_from_compute(C, E, a, b)</C>, <C>acc_from_loss(L, chance, k, L0)</C> and <C>predict_acc(C, law, link)</C>, where{" "}
          <C>law</C> is (E, a, b) and <C>link</C> is (chance, k, L0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def loss_from_compute(C, E, a, b):
    return a * C ** (-b)

def acc_from_loss(L, chance, k, L0):
    return 1 / (1 + math.exp(k * (L - L0)))

def predict_acc(C, law, link):
    return acc_from_loss(C, *link)
`,
        solution: TWOSTEP,
        tests: [
          { name: "link", code: `assert abs(acc_from_loss(1.0, 0.25, 7.0, 1.0) - 0.625) < 1e-12 and abs(acc_from_loss(0.5, 0.2, 2.0, 1.0) - (0.2 + 0.8 / (1 + math.exp(-1)))) < 1e-12` },
          { name: "predict", code: `assert abs(loss_from_compute(16, 1.0, 8.0, 0.25) - 5.0) < 1e-12 and abs(predict_acc(16, (1.0, 8.0, 0.25), (0.0, 1.0, 5.0)) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logit(y)</C>, <C>fit_link(Ls, accs, chance)</C>, returning (k, L0) from a least-squares line through the logits of the
          rescaled accuracies, and <C>exact_match(p, length)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def logit(y):
    return math.log(y)

def fit_link(Ls, accs, chance):
    return 1.0, sum(Ls) / len(Ls)

def exact_match(p, length):
    return p
`,
        solution: LINK,
        tests: [
          { name: "fit", code: `k, L0 = fit_link([0.5, 1.0, 1.5], [0.2 + 0.8 / (1 + math.exp(3 * (L - 1.2))) for L in [0.5, 1.0, 1.5]], 0.2)\nassert abs(k - 3) < 1e-9 and abs(L0 - 1.2) < 1e-9` },
          { name: "em", code: `assert abs(exact_match(0.8, 3) - 0.512) < 1e-12 and abs(logit(0.75) - math.log(3)) < 1e-12` },
        ],
      },
    },
    {
      key: "invert",
      rung: "stretch",
      prompt: (
        <p>
          On a four-way benchmark, models with answer loss 1.2 score 0.40 and models with loss 0.9 score 0.70. Fit the link through
          these two points. At what loss does it predict 0.85? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7358, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The scaling chapter is complete. The next chapter turns from what to train to how: the hyperparameters that must change
        as models grow, starting with the maximal update parametrisation in practice.
      </p>
    </>
  ),
};
