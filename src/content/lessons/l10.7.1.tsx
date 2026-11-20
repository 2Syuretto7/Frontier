import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HypothesisGridViz } from "@/components/viz/HypothesisGridViz";
import type { LessonContent } from "@/lib/types";

const BELIEF = `def ppv(prior, power, alpha):
    tp = prior * power
    fp = (1 - prior) * alpha
    return tp / (tp + fp)

def bayes_factor(p_data_h1, p_data_h0):
    return p_data_h1 / p_data_h0

def posterior(prior, factor):
    odds = prior / (1 - prior) * factor
    return odds / (1 + odds)`;

const CHOOSE = `import math

def entropy(ps):
    return -sum(p * math.log2(p) for p in ps if p > 0)

def update(priors, likelihoods):
    joint = [p * l for p, l in zip(priors, likelihoods)]
    z = sum(joint)
    return [j / z for j in joint]

def info_gain(priors, p_success):
    gain = entropy(priors)
    for outcome in (True, False):
        lik = [q if outcome else 1 - q for q in p_success]
        prob = sum(p * l for p, l in zip(priors, lik))
        if prob > 0:
            gain -= prob * entropy(update(priors, lik))
    return gain`;

export const lesson: LessonContent = {
  id: "l10.7.1",
  minutes: 45,
  links: {
    requires: ["l10.6.4", "m9.4.1"],
    revisits: ["m9.4.5", "l10.2.4", "l10.1.4"],
    foreshadows: ["l10.7.2", "l10.7.3", "l10.7.4"],
  },

  puzzle: (
    <>
      <p>
        A researcher has a hunch that a new normalisation layer helps. They try it on three model sizes, two datasets and four learning
        rates, and find one setting where it wins by a statistically significant margin. They write it up. Is the hunch now supported?
        The answer depends less on the final test than on what was predicted before the experiments, how plausible the idea was, and
        how many other comparisons could have been reported instead.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An experiment is a question put to the world, and a good question is one whose answer would change your mind. That means
        writing down, before running, what you expect and why, and which result would count against the idea. Statistics then tells
        you how much the result should move your belief, and that depends heavily on how believable the idea was to begin with.
      </p>
      <HypothesisGridViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a testable hypothesis">
        <p>
          A useful hypothesis names a mechanism, predicts an observable consequence with a direction and rough size, and identifies a
          result that would refute it. &quot;The new layer helps&quot; is not one; &quot;the new layer reduces loss spikes at high learning rates
          because it bounds the update size, so the gain should grow with learning rate and vanish below 1e-4&quot; is. Platt (1964) called
          the practice of listing rival hypotheses and designing the experiment that best separates them strong inference.
        </p>
      </Definition>

      <Theorem title="how often a significant result is true">
        <p>
          If a fraction π of the hypotheses a field tests are true, tests have power <M>{"1-\\beta"}</M> and level α, the probability that a
          significant result reflects a true hypothesis is
        </p>
        <MD>{"\\mathrm{PPV} = \\frac{(1-\\beta)\\pi}{(1-\\beta)\\pi + \\alpha(1-\\pi)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Among all tests, true hypotheses that reach significance occur at rate <M>{"(1-\\beta)\\pi"}</M> and false ones at rate{" "}
          <M>{"\\alpha(1-\\pi)"}</M>; PPV is the first divided by their sum (<C>ppv</C>). Ioannidis (2005) used this to argue that many
          published findings are false: with π small and power low, false positives outnumber true ones, and flexibility in analysis
          raises the effective α further. In odds form, posterior odds equal prior odds times the Bayes factor, the ratio of the
          probabilities of the data under the two hypotheses (<C>bayes_factor</C>, <C>posterior</C>); a significant test at power{" "}
          <M>{"1-\\beta"}</M> has Bayes factor <M>{"(1-\\beta)/\\alpha"}</M>.
        </p>
        <Code>{BELIEF}</Code>
      </Proof>

      <Remark title="the garden of forking paths">
        <p>
          Gelman and Loken pointed out that even a researcher who runs a single test may have chosen it after seeing the data: which
          model size, which metric, which seeds to drop. Each choice is a hidden comparison, and together they inflate the false-positive
          rate (m9.4.5) without any deliberate fishing. Writing the hypothesis, the primary metric and the analysis down in advance, even
          informally in a lab notebook, removes this freedom; everything else is then labelled exploratory.
        </p>
      </Remark>

      <Definition title="choosing the most informative experiment">
        <p>
          Given rival hypotheses with prior probabilities, an experiment with a success-or-failure outcome is informative if the
          hypotheses predict different success rates. Its expected information gain is the entropy of the prior (<C>entropy</C>) minus the
          expected entropy of the posterior after the outcome (<C>update</C>, <C>info_gain</C>). An experiment on which every hypothesis
          predicts the same thing gains nothing, however expensive it is.
        </p>
        <Code>{CHOOSE}</Code>
      </Definition>

      <Example title="the puzzle">
        <p>
          The researcher made 24 comparisons and reported the best; at α = 0.05 the chance of at least one false positive among 24
          independent tests is <M>{"1 - 0.95^{24} \\approx 0.71"}</M>. The finding is a lead for a new, pre-specified test on fresh
          settings, not a result.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ppv",
      rung: "check",
      prompt: (
        <p>
          One in ten ideas a team tests is true, experiments have 80% power, and α = 0.05. What fraction of significant results reflect
          true ideas? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.64, tolerance: 0.005 },
    },
    {
      key: "post",
      rung: "check",
      prompt: (
        <p>
          You give a hypothesis probability 0.2 before an experiment whose result is 6 times as likely if the hypothesis is true as if it
          is false. What is your probability afterwards? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.005 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: (
        <p>
          Two explanations for a training instability are &quot;the learning rate is too high&quot; and &quot;the data contain bad batches&quot;. Which
          experiment is most informative?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Replay the same batches in the same order at a lower learning rate: the first explanation predicts stability, the second predicts spikes at the same batches",
          "Train a larger model, since both explanations predict it will be unstable",
          "Rerun the same configuration with a new seed and see if it is unstable again",
          "Train for longer to see whether the instability goes away",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ppv(prior, power, alpha):
    tp = prior * power
    fp = (1 - prior) * alpha
    return tp / (tp + fp)

def bayes_factor(p_data_h1, p_data_h0):
    return p_data_h1 / p_data_h0

def posterior(prior, factor):
    odds = prior / (1 - prior) * factor
    return odds / (1 + odds)

print(ppv(0.5, 1.0, 0.0), ppv(0.5, 0.5, 0.5), bayes_factor(0.6, 0.3))
print(posterior(0.5, 3.0), posterior(0.25, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.5 2.0\n0.75 0.25",
          "1.0 0.5 2.0\n0.6 0.25",
          "1.0 0.25 2.0\n0.75 0.25",
          "0.5 0.5 2.0\n0.75 0.25",
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

def entropy(ps):
    return -sum(p * math.log2(p) for p in ps if p > 0)

def update(priors, likelihoods):
    joint = [p * l for p, l in zip(priors, likelihoods)]
    z = sum(joint)
    return [j / z for j in joint]

def info_gain(priors, p_success):
    gain = entropy(priors)
    for outcome in (True, False):
        lik = [q if outcome else 1 - q for q in p_success]
        prob = sum(p * l for p, l in zip(priors, lik))
        if prob > 0:
            gain -= prob * entropy(update(priors, lik))
    return gain

print(entropy([0.5, 0.5]), entropy([1.0, 0.0]), update([0.5, 0.5], [0.8, 0.2]))
print(info_gain([0.5, 0.5], [0.7, 0.7]), info_gain([0.5, 0.5], [1.0, 0.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 -0.0 [0.8, 0.2]\n0.0 1.0",
          "1.0 0.0 [0.8, 0.2]\n0.0 1.0",
          "1.0 -0.0 [0.5, 0.5]\n0.0 1.0",
          "1.0 -0.0 [0.8, 0.2]\n0.7 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ppv(prior, power, alpha)</C>, <C>bayes_factor(p_data_h1, p_data_h0)</C> and <C>posterior(prior, factor)</C>, working in
          odds.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ppv(prior, power, alpha):
    return power

def bayes_factor(p_data_h1, p_data_h0):
    return 1.0

def posterior(prior, factor):
    return prior
`,
        solution: BELIEF,
        tests: [
          { name: "ppv", code: `assert abs(ppv(0.2, 0.5, 0.05) - 0.7142857143) < 1e-9 and abs(ppv(0.5, 0.8, 0.8) - 0.5) < 1e-12` },
          { name: "bayes", code: `assert abs(bayes_factor(0.3, 0.1) - 3) < 1e-12 and abs(posterior(0.1, 9) - 0.5) < 1e-12 and abs(posterior(0.5, 0.25) - 0.2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>entropy(ps)</C> in bits, skipping zero probabilities, <C>update(priors, likelihoods)</C>, and{" "}
          <C>info_gain(priors, p_success)</C>, where <C>p_success[i]</C> is the chance of success under hypothesis i.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def entropy(ps):
    return 0.0

def update(priors, likelihoods):
    return list(priors)

def info_gain(priors, p_success):
    return 0.0
`,
        solution: CHOOSE,
        tests: [
          { name: "entropy", code: `assert abs(entropy([0.25, 0.25, 0.5]) - 1.5) < 1e-12\nu = update([0.2, 0.3, 0.5], [1, 0.5, 0])\nassert abs(u[0] - 4 / 7) < 1e-12 and abs(u[1] - 3 / 7) < 1e-12 and u[2] == 0` },
          { name: "gain", code: `assert abs(info_gain([0.25, 0.75], [0.9, 0.1]) - 0.4122953056) < 1e-9 and abs(info_gain([0.5, 0.5], [0.4, 0.4])) < 1e-12` },
        ],
      },
    },
    {
      key: "gain",
      rung: "stretch",
      prompt: (
        <p>
          Two hypotheses are equally likely. An experiment succeeds with probability 0.9 under the first and 0.3 under the second. What is
          its expected information gain, in bits? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.296, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A hypothesis about a mechanism is tested by removing or changing the parts it names. The next lesson covers ablations and the
        controls that make them interpretable.
      </p>
    </>
  ),
};
