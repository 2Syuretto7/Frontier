import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WeakStrongViz } from "@/components/viz/WeakStrongViz";
import type { LessonContent } from "@/lib/types";

const GAP = `from collections import Counter

def pgr(weak, w2s, strong):
    return (w2s - weak) / (strong - weak)                  # share of the gap the strong student recovers

def fit_mode(examples):
    votes = {}
    for x, y in examples:
        votes.setdefault(x, Counter())[y] += 1
    return {x: c.most_common(1)[0][0] for x, c in votes.items()}   # an ideal learner of the weak labels

def accuracy(model, truth):
    return sum(model[x] == y for x, y in truth.items()) / len(truth)`;

const CONF = `import math

def ce(p, q):
    return -(p * math.log(q) + (1 - p) * math.log(1 - q))  # target probability p, prediction q

def aux_conf_loss(weak_p, strong_p, alpha):
    hard = 1.0 if strong_p > 0.5 else 0.0                  # the student's own confident guess
    return (1 - alpha) * ce(weak_p, strong_p) + alpha * ce(hard, strong_p)

def predicted_pgr(eps_sys, eps_rand):
    rand = (1 - eps_sys) * eps_rand                        # errors that average away
    return rand / (eps_sys + rand)`;

export const lesson: LessonContent = {
  id: "l14.2.3",
  minutes: 45,
  links: {
    requires: ["l14.2.2", "l9.2.1"],
    revisits: ["l9.1.3", "l11.1.2"],
    foreshadows: ["l14.3.1"],
  },

  puzzle: (
    <>
      <p>
        Future models may be better than their human overseers at the tasks they are trained on, so the labels and
        preferences used to train them will come from weaker judges. That situation can be studied now in miniature: take
        a small model as the supervisor and a large one as the student, fine-tune the student on the small model&apos;s
        labels, and measure the result against the truth. Will the student just copy its teacher&apos;s mistakes, or can
        it do better than the labels it was given?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A large pretrained model already represents much of what the task needs; fine-tuning mostly tells it which of its
        abilities to use. Weak labels can point at the right ability even when they are often wrong, as long as their
        mistakes look like noise rather than like a different rule. The student then generalises past its teacher. Where
        the teacher&apos;s mistakes form a pattern the student can represent, the student learns the pattern, and the
        teacher&apos;s blind spots become the student&apos;s.
      </p>
      <WeakStrongViz />
    </>
  ),

  theory: (
    <>
      <Definition title="performance gap recovered">
        <p>
          Burns et al. (2023) compared three accuracies on a task: the weak supervisor&apos;s, the strong model&apos;s when
          fine-tuned on the weak model&apos;s labels, and the strong model&apos;s when fine-tuned on true labels, its
          ceiling. The performance gap recovered is
        </p>
        <MD>{"\\mathrm{PGR} = \\frac{\\text{weak-to-strong} - \\text{weak}}{\\text{ceiling} - \\text{weak}}"}</MD>
        <p>
          (<C>pgr</C>): 0 if the student does no better than its teacher, 1 if weak supervision is as good as true labels.
          An idealised student fits the most common weak label for each input (<C>fit_mode</C>, <C>accuracy</C>).
        </p>
        <Code>{GAP}</Code>
      </Definition>

      <Theorem title="only random errors are recovered">
        <p>
          Consider binary labels. Let the weak supervisor be wrong on every presentation of a set S of inputs of
          probability <M>{"\\varepsilon_s"}</M>, and on other inputs wrong independently with probability{" "}
          <M>{"\\varepsilon_r < 1/2"}</M> per presentation. A student that, with enough data, predicts the most common
          weak label of each input reaches accuracy <M>{"1 - \\varepsilon_s"}</M>, and if its ceiling is 1,
        </p>
        <MD>{"\\mathrm{PGR} = \\frac{(1 - \\varepsilon_s)\\,\\varepsilon_r}{\\varepsilon_s + (1 - \\varepsilon_s)\\,\\varepsilon_r}"}</MD>
        <p>the share of the supervisor&apos;s errors that are random (<C>predicted_pgr</C>).</p>
      </Theorem>
      <Proof>
        <p>
          On S every weak label is wrong, so the most common label is wrong. Off S, the correct label appears with
          probability <M>{"1 - \\varepsilon_r > 1/2"}</M> on each presentation, so with enough presentations it is the most
          common by the law of large numbers. The student&apos;s accuracy is therefore <M>{"1 - \\varepsilon_s"}</M>. The
          supervisor&apos;s accuracy is <M>{"1 - \\varepsilon_s - (1 - \\varepsilon_s)\\varepsilon_r"}</M>, its error being
          the sum of the systematic and random parts. Substituting into the definition, the numerator is the random part
          and the denominator is the whole error. A real student is not an ideal mode-fitter: it has inductive biases that
          may resist even systematic errors it could represent, which is what makes PGR an empirical question.
        </p>
      </Proof>

      <Definition title="the auxiliary confidence loss">
        <p>
          To discourage imitation of the supervisor&apos;s errors, Burns et al. mixed the usual cross-entropy to the weak
          label with a cross-entropy to the student&apos;s own hardened prediction (<C>ce</C>, <C>aux_conf_loss</C>):
        </p>
        <MD>{"(1 - \\alpha)\\,\\mathrm{CE}(p_w, q) + \\alpha\\,\\mathrm{CE}(h(q), q)"}</MD>
        <p>
          where <M>{"p_w"}</M> is the weak probability, q the student&apos;s and h(q) is 1 if q &gt; 1/2 and 0 otherwise.
          Because cross-entropy is linear in its target, for fixed h the loss equals{" "}
          <M>{"\\mathrm{CE}((1 - \\alpha)p_w + \\alpha h, q)"}</M>, minimised at <M>{"q = (1 - \\alpha)p_w + \\alpha h"}</M>:
          the student is pulled toward its own confident answer and allowed to disagree with its teacher.
        </p>
        <Code>{CONF}</Code>
      </Definition>

      <Example title="what the experiments showed">
        <p>
          On NLP classification tasks, naive fine-tuning of GPT-4-family students on labels from much smaller models
          recovered a substantial part of the gap, and the confidence loss raised it to about 80% when GPT-2-level models
          supervised GPT-4, giving performance close to GPT-3.5. On chess puzzles recovery was poor for large gaps, and on
          reward modelling for chat preferences it was poor throughout. Students also overfit to weak labels as training
          continued, so early stopping helped. The authors stressed the disanalogies: future models may imitate human
          errors more readily than students imitate small models, because human errors are better represented in
          pretraining data.
        </p>
      </Example>

      <Remark title="why this matters for oversight">
        <p>
          Every method in this chapter ends with a model trained on judgements that are imperfect. Weak-to-strong
          generalisation asks how much of the model&apos;s own knowledge survives that training. The theorem says what to
          worry about: not the rate of human error but its structure. Consistent, learnable human mistakes, such as
          preferring confident or flattering answers, are exactly the ones a strong student will learn.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pgr",
      rung: "check",
      prompt: (
        <p>
          A weak supervisor is 60% accurate, the strong model trained on true labels 90%, and the strong model trained on
          weak labels 80%. What is the performance gap recovered?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.001 },
    },
    {
      key: "predict",
      rung: "check",
      prompt: (
        <p>
          The supervisor is consistently wrong on 10% of inputs and randomly wrong with probability 0.2 on the rest. For an
          ideal mode-fitting student with ceiling 1, what is the PGR?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6429, tolerance: 0.001 },
    },
    {
      key: "worry",
      rung: "apply",
      prompt: <p>Which kind of human mistake is most likely to be learned by a strong model trained on human labels?</p>,
      answer: {
        kind: "choice",
        options: [
          "A consistent bias, such as preferring confident answers, that the model can represent",
          "Occasional random slips that differ between raters",
          "Mistakes on inputs that appear only once in training",
          "Mistakes that the weak supervisor makes with probability below one half at random",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter

def pgr(weak, w2s, strong):
    return (w2s - weak) / (strong - weak)                  # share of the gap the strong student recovers

def fit_mode(examples):
    votes = {}
    for x, y in examples:
        votes.setdefault(x, Counter())[y] += 1
    return {x: c.most_common(1)[0][0] for x, c in votes.items()}   # an ideal learner of the weak labels

def accuracy(model, truth):
    return sum(model[x] == y for x, y in truth.items()) / len(truth)

m = fit_mode([("a", 1), ("a", 1), ("a", 0), ("b", 0), ("b", 0), ("c", 1)]); print(m, accuracy(m, {"a": 1, "b": 1, "c": 1}))
print(round(pgr(0.6, 0.8, 0.9), 4), pgr(0.7, 0.7, 0.9), fit_mode([("z", 0), ("z", 1)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'a': 1, 'b': 0, 'c': 1} 0.6666666666666666\n0.6667 0.0 {'z': 0}",
          "{'a': 1, 'b': 0, 'c': 1} 0.6666666666666666\n0.6667 0.0 {'z': 1}",
          "{'a': 1, 'b': 0, 'c': 1} 1.0\n0.6667 0.0 {'z': 0}",
          "{'a': 0, 'b': 0, 'c': 1} 0.3333333333333333\n0.6667 0.0 {'z': 0}",
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

def ce(p, q):
    return -(p * math.log(q) + (1 - p) * math.log(1 - q))  # target probability p, prediction q

def aux_conf_loss(weak_p, strong_p, alpha):
    hard = 1.0 if strong_p > 0.5 else 0.0                  # the student's own confident guess
    return (1 - alpha) * ce(weak_p, strong_p) + alpha * ce(hard, strong_p)

def predicted_pgr(eps_sys, eps_rand):
    rand = (1 - eps_sys) * eps_rand                        # errors that average away
    return rand / (eps_sys + rand)

print(round(ce(1.0, 0.5), 4), round(ce(0.5, 0.5), 4), round(aux_conf_loss(0.2, 0.9, 1.0), 4), round(aux_conf_loss(0.2, 0.4, 1.0), 4))
print(predicted_pgr(0.0, 0.3), predicted_pgr(0.2, 0.0), round(predicted_pgr(0.1, 0.1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6931 0.6931 0.1054 0.5108\n1.0 0.0 0.4737",
          "0.6931 0.0 0.1054 0.5108\n1.0 0.0 0.4737",
          "0.6931 0.6931 0.1054 0.9163\n1.0 0.0 0.4737",
          "0.6931 0.6931 0.1054 0.5108\n1.0 0.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pgr(weak, w2s, strong)</C>; <C>fit_mode(examples)</C>, mapping each input in a list of (input, label)
          pairs to its most common label, ties going to the label seen first; and <C>accuracy(model, truth)</C> for dicts
          from input to label.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter

def pgr(weak, w2s, strong):
    return w2s - weak

def fit_mode(examples):
    return dict(examples)

def accuracy(model, truth):
    return 1.0
`,
        solution: GAP,
        tests: [
          { name: "mode", code: `assert fit_mode([("x", 1), ("x", 0), ("x", 1), ("y", 2)]) == {"x": 1, "y": 2} and fit_mode([("q", 5), ("q", 3)]) == {"q": 5}` },
          { name: "pgr", code: `assert abs(pgr(0.5, 0.75, 1.0) - 0.5) < 1e-12 and accuracy({"x": 1, "y": 0}, {"x": 1, "y": 1}) == 0.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ce(p, q)</C>, the binary cross-entropy of prediction q against target probability p;{" "}
          <C>aux_conf_loss(weak_p, strong_p, alpha)</C>, with the hardened target 1 when strong_p &gt; 0.5 and 0
          otherwise; and <C>predicted_pgr(eps_sys, eps_rand)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ce(p, q):
    return 0.0

def aux_conf_loss(weak_p, strong_p, alpha):
    return ce(weak_p, strong_p)

def predicted_pgr(eps_sys, eps_rand):
    return 1 - eps_sys
`,
        solution: CONF,
        tests: [
          { name: "ce", code: `assert abs(ce(1.0, 0.25) - math.log(4)) < 1e-12 and abs(aux_conf_loss(0.5, 0.75, 0.5) - (0.5 * ce(0.5, 0.75) + 0.5 * math.log(4 / 3))) < 1e-12` },
          { name: "pred", code: `assert abs(predicted_pgr(0.5, 0.5) - 1 / 3) < 1e-12 and predicted_pgr(0.0, 0.1) == 1.0` },
        ],
      },
    },
    {
      key: "override",
      rung: "stretch",
      prompt: (
        <p>
          The weak supervisor gives probability 0.4 to the positive class, the student currently gives more than 0.5, and
          α = 0.75. Holding the hardened target fixed, what student probability minimises the auxiliary confidence loss?
        </p>
      ),
      answer: { kind: "numeric", value: 0.85, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Oversight asks whether we can tell good behaviour from bad. Robustness asks whether good behaviour holds up when
        someone is trying to break it, starting with inputs changed by amounts too small to notice.
      </p>
    </>
  ),
};
