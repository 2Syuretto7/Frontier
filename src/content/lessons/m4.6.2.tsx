import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DiceGridViz } from "@/components/viz/DiceGridViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.6.2",
  minutes: 60,
  links: {
    requires: ["m4.6.1"],
    foreshadows: ["m7.1.3", "m7.1.4", "m7.1.5"],
  },

  puzzle: (
    <>
      <p>
        A disease affects 1 person in 1000. A test catches 99% of cases and wrongly flags 2% of healthy people. You test
        positive. What is the chance you have the disease? Most people, including many doctors, guess about 98%.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Learning that an event B happened rules out every outcome outside B. The new probability of A is the share of B that A
        occupies. In the grid below, conditioning on the first die greys out the impossible rows; the probability of the total
        is recounted within what is left.
      </p>
      <DiceGridViz mode="conditional" />
    </>
  ),

  theory: (
    <>
      <Definition title="conditional probability">
        <p>
          For events A and B with P(B) &gt; 0, the <strong>probability of A given B</strong> is{" "}
          <M>{"P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)}"}</M>. With equally likely outcomes it is{" "}
          <M>{"|A \\cap B| / |B|"}</M>: count within B.
        </p>
      </Definition>

      <Theorem title="the multiplication rule">
        <p>
          <M>{"P(A \\cap B) = P(B)\\,P(A \\mid B)"}</M>, and more generally{" "}
          <M>{"P(A_1 \\cap \\dots \\cap A_n) = P(A_1)P(A_2 \\mid A_1)\\cdots P(A_n \\mid A_1 \\cap \\dots \\cap A_{n-1})"}</M>.
        </p>
      </Theorem>
      <Example title="drawing without replacement">
        <p>
          The chance that two cards drawn from a deck are both aces is{" "}
          <M>{"\\tfrac{4}{52}\\cdot\\tfrac{3}{51} = \\tfrac{1}{221}"}</M>.
        </p>
      </Example>

      <Theorem title="the law of total probability">
        <p>
          If <M>{"B_1, \\dots, B_k"}</M> partition Ω, each with positive probability, then{" "}
          <M>{"P(A) = \\sum_i P(A \\mid B_i)P(B_i)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A is the disjoint union of the sets <M>{"A \\cap B_i"}</M>, so <M>{"P(A) = \\sum P(A \\cap B_i)"}</M>, and each term
          is <M>{"P(A \\mid B_i)P(B_i)"}</M> by the multiplication rule.
        </p>
      </Proof>

      <Theorem title="Bayes' rule">
        <p>
          <M>{"P(B \\mid A) = \\dfrac{P(A \\mid B)\\,P(B)}{P(A)}"}</M>, with P(A) computed by total probability.
        </p>
      </Theorem>
      <Proof>
        <p>Both <M>{"P(B \\mid A)P(A)"}</M> and <M>{"P(A \\mid B)P(B)"}</M> equal <M>{"P(A \\cap B)"}</M>.</p>
      </Proof>

      <Example title="the test">
        <p>
          Think of 100 000 people: 100 are ill, of whom 99 test positive; 99 900 are healthy, of whom 1998 test positive. Of
          the 2097 positives only 99 are ill, so <M>{"P(\\text{ill} \\mid +) = 99/2097 \\approx 4.7\\%"}</M>. The base rate
          of 1 in 1000 dominates; ignoring it is the <strong>base-rate fallacy</strong>.
        </p>
      </Example>

      <Definition title="independence">
        <p>
          A and B are <strong>independent</strong> if <M>{"P(A \\cap B) = P(A)P(B)"}</M>; when P(B) &gt; 0 this says{" "}
          <M>{"P(A \\mid B) = P(A)"}</M>, that learning B tells you nothing about A.
        </p>
      </Definition>
      <Example title="dice">
        <p>
          &ldquo;The total is 7&rdquo; is independent of &ldquo;the first die shows 4&rdquo;: 1/6 either way. &ldquo;The total
          is 8&rdquo; is not: knowing the first die is 1 makes it impossible.
        </p>
      </Example>

      <Remark title="conditioning is not causation">
        <p>
          <M>{"P(A \\mid B)"}</M> describes what B tells you about A, not whether B causes A. And{" "}
          <M>{"P(A \\mid B)"}</M> is generally not <M>{"P(B \\mid A)"}</M>: most positives are healthy, though most of the ill
          are positive.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dice",
      rung: "check",
      prompt: <p>Two dice are rolled and the total is 8. What is the probability that both show 4? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "aces",
      rung: "check",
      prompt: <p>Two cards are drawn without replacement. Given that the first is an ace, what is the probability that the second is too? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0588, tolerance: 0.0001 },
    },
    {
      key: "boys",
      rung: "apply",
      prompt: <p>A family has two children, each equally likely to be a boy or a girl independently. Given that at least one is a girl, what is the probability both are girls? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "bayes",
      rung: "apply",
      prompt: <p>A spam filter flags 95% of spam and 1% of real mail. 20% of mail is spam. What is the probability a flagged message is spam? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.9596, tolerance: 0.0001 },
    },
    {
      key: "urns",
      rung: "apply",
      prompt: <p>Urn 1 has 3 red and 1 blue ball, urn 2 has 1 red and 3 blue. A fair coin picks an urn and a ball is drawn. What is the probability it is red?</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`p_ill, sens, fpr = 0.001, 0.99, 0.02
p_pos = sens * p_ill + fpr * (1 - p_ill)
print(round(sens * p_ill / p_pos, 3))`}</Code>
          <p>Bayes' rule for the disease test. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.047, tolerance: 0.0005 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
prior, sens, spec = Fraction(1, 100), Fraction(9, 10), Fraction(9, 10)
p_pos = prior * sens + (1 - prior) * (1 - spec)
print(p_pos, prior * sens / p_pos)`}</Code>
          <p>A test that is 90 per cent accurate for a condition with 1 per cent prevalence. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["27/250 1/12", "27/250 9/10", "1/10 1/11", "27/250 1/11"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>posterior(prior, likelihoods)</C>, which takes a dict of prior probabilities for hypotheses and a dict of P(evidence | hypothesis), and returns the dict of posterior probabilities by Bayes&rsquo; rule with the law of total probability. Then use it twice in a row for two independent tests.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def posterior(prior, likelihoods):
    return dict(prior)
`,
        solution: `def posterior(prior, likelihoods):
    joint = {h: prior[h] * likelihoods[h] for h in prior}
    total = sum(joint.values())
    return {h: v / total for h, v in joint.items()}
`,
        tests: [
          { name: "one test", code: `post = posterior({'ill': 0.001, 'well': 0.999}, {'ill': 0.99, 'well': 0.02})
assert abs(post['ill'] - 99 / 2097) < 1e-9 and abs(sum(post.values()) - 1) < 1e-12, 'Multiply prior by likelihood, then divide by the total.'` },
          { name: "two tests", code: `lik = {'ill': 0.99, 'well': 0.02}
post = posterior(posterior({'ill': 0.001, 'well': 0.999}, lik), lik)
assert abs(post['ill'] - 0.7104) < 1e-4, 'Yesterday’s posterior is today’s prior.'` },
          { name: "urns", code: `post = posterior({1: 0.5, 2: 0.5}, {1: 0.75, 2: 0.25})
assert abs(post[1] - 0.75) < 1e-12, 'A red ball favours the urn with more red balls.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>conditional(space, A, B)</C>, P(A | B) as a <C>Fraction</C> for a finite list of equally likely outcomes and predicates A and B, raising <C>ValueError</C> if no outcome satisfies B. Then generalise Monty Hall: there are n doors, you pick one, the host (who knows where the car is) opens k empty doors other than yours, and you switch to one of the other unopened doors uniformly at random. Write <C>monty_exact(n, k)</C>, the exact winning probability (n − 1)/(n(n − k − 1)), and <C>monty_sim(n, k, trials, seed)</C>, a simulation of the game with <C>random.Random(seed)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def conditional(space, A, B):
    return Fraction(sum(1 for w in space if A(w)), len(space))

def monty_exact(n, k):
    return Fraction(1, n)

def monty_sim(n, k, trials, seed):
    return 1 / n
`,
        solution: `from fractions import Fraction
import random

def conditional(space, A, B):
    b = [w for w in space if B(w)]
    if not b:
        raise ValueError('P(B) = 0')
    return Fraction(sum(1 for w in b if A(w)), len(b))

def monty_exact(n, k):
    return Fraction(n - 1, n * (n - k - 1))

def monty_sim(n, k, trials, seed):
    rng = random.Random(seed)
    wins = 0
    for _ in range(trials):
        car, pick = rng.randrange(n), rng.randrange(n)
        opened = set(rng.sample([d for d in range(n) if d != pick and d != car], k))
        new = rng.choice([d for d in range(n) if d != pick and d not in opened])
        wins += new == car
    return wins / trials
`,
        tests: [
          { name: "conditional", code: `from itertools import product
from fractions import Fraction
dice = list(product(range(1, 7), repeat=2))
assert conditional(dice, lambda w: sum(w) == 8, lambda w: w[0] == w[1]) == Fraction(1, 6) and conditional(dice, lambda w: w[0] == 6, lambda w: sum(w) >= 11) == Fraction(2, 3), 'Given doubles, only (4, 4) totals 8.'
try:
    conditional(dice, lambda w: True, lambda w: sum(w) > 12)
    assert False, 'P(B) = 0 must raise.'
except ValueError:
    pass` },
          { name: "exact", code: `from fractions import Fraction
assert monty_exact(3, 1) == Fraction(2, 3) and monty_exact(100, 98) == Fraction(99, 100) and monty_exact(4, 1) == Fraction(3, 8) and monty_exact(4, 2) == Fraction(3, 4), 'Switching after one of three: 2/3.'` },
          { name: "simulate", code: `for n, k in ((3, 1), (4, 1), (10, 5)):
    s = monty_sim(n, k, 20000, 3)
    assert abs(s - (n - 1) / (n * (n - k - 1))) < 0.02, f'Simulation for n={n}, k={k} gave {s}'` },
        ],
      },
    },
    {
      key: "complement",
      rung: "prove",
      prompt: <p>Prove that if A and B are independent, then so are A and the complement of B.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes A as the disjoint union of A ∩ B and A ∩ Bᶜ, so P(A ∩ Bᶜ) = P(A) − P(A ∩ B).",
          "Substitutes P(A ∩ B) = P(A)P(B).",
          "Factors to P(A)(1 − P(B)) = P(A)P(Bᶜ).",
        ],
      },
    },
    {
      key: "retest",
      rung: "stretch",
      prompt: <p>In the disease example (1 in 1000, 99% detection, 2% false positives), a person tests positive twice, the tests being independent given their health. What is the probability they are ill? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.7104, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what P(A | B) means, why a positive result on a good test for a rare disease is usually a false alarm, and what independence says.",

  glimpse: (
    <p>
      Probability develops conditional probability, Bayes&rsquo; rule and independence in full. Bayes&rsquo; rule is the engine
      of Bayesian inference, and the naive Bayes classifier applies it with an independence assumption to label text.
    </p>
  ),
};
