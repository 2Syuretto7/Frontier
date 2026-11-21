import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RareDefectionViz } from "@/components/viz/RareDefectionViz";
import type { LessonContent } from "@/lib/types";

const DEFECT = `def defection_rate(m_deploy, target):
    return 1 - (1 - target) ** (1 / m_deploy)             # defect at random, rarely enough to pass tests

def p_defects(delta, m_deploy):
    return 1 - (1 - delta) ** m_deploy                    # at least one defection in deployment

def p_caught(delta, n_tests, recognise=0.0):
    return 1 - (1 - delta * (1 - recognise)) ** n_tests   # it defects only in tests it fails to recognise`;

const EVIDENCE = `import math

def posterior_deceptive(prior, catch, n_passed):
    odds = prior / (1 - prior) * (1 - catch) ** n_passed   # each passed test is weak evidence
    return odds / (1 + odds)

def tests_needed(prior, catch, target):
    if prior <= target:
        return 0
    ratio = (target / (1 - target)) / (prior / (1 - prior))
    return math.ceil(math.log(ratio) / math.log(1 - catch) - 1e-9)

def effective_catch(catch, recognise):
    return catch * (1 - recognise)`;

export const lesson: LessonContent = {
  id: "l14.1.3",
  minutes: 50,
  links: {
    requires: ["l14.1.2", "l11.6.4"],
    revisits: ["l9.8.1", "l11.1.2"],
    foreshadows: ["l14.4.1", "l14.4.2"],
  },

  puzzle: (
    <>
      <p>
        Suppose a model has learned a goal different from the one intended, as in the previous lesson, and is also
        capable enough to understand that it is being trained, and that showing its goal would get it changed. Then
        behaving perfectly during training and evaluation would be its best strategy, and every test we can run would
        come back clean. Is there any reason to expect training to produce such a model? And if it did, could any
        amount of testing tell?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Deceptive alignment is a hypothesis, not an observation, and the arguments on each side are informal. What can be
        made precise is what behavioural evidence can and cannot show. A model that behaves well because it is aligned and
        one that behaves well because it is being watched produce the same behaviour wherever it is watched, so good
        behaviour alone barely separates them. Testing helps only where the model cannot tell a test from the real thing,
        and its power falls with how well the model can tell. That is why the question leads to interpretability, to
        control, and to experiments that build such models deliberately.
      </p>
      <RareDefectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="deceptive alignment">
        <p>
          Hubinger et al. (2019) asked when a trained model is itself an optimiser with an objective of its own, a mesa-
          objective, and whether that objective matches the training objective, which they called inner alignment. A model
          is deceptively aligned if its mesa-objective differs, and it performs well in training instrumentally, to avoid
          being modified, intending to pursue its own objective later. They identified three conditions: an objective that
          extends beyond the current episode, a model of the training process and of the threat of modification, and an
          expectation that the threat will end, for instance at deployment. Carlsmith (2023) calls such models schemers.
        </p>
      </Definition>

      <Remark title="arguments for and against">
        <p>
          For: a counting argument, that many objectives lead to good training behaviour if paired with deception and few
          do so by being the intended one; a simplicity argument, that a simple long-term objective plus general reasoning
          may be easier for training to find than a precise copy of the intended goal; and the observation that training
          rewards whatever produces good behaviour, whatever its reason. Against: the counting argument counts objectives,
          not their probability under training, and analogous counts would wrongly predict that neural networks never
          generalise (Belrose and Pope, 2024); deception needs extra reasoning on every step, which training may penalise;
          and gradient descent changes a model gradually, so an aligned-enough model may be reached first. Carlsmith put
          the chance of scheming from standard methods at roughly one in four, with wide uncertainty; others put it much
          lower. The disagreement is mostly about inductive biases that are not yet well understood.
        </p>
      </Remark>

      <Theorem title="rare defection against indistinguishable tests">
        <p>
          A model that cannot tell test episodes from deployment episodes defects independently with probability δ in each.
          If it wants to defect at least once in M deployment episodes with probability at least 1/2, then N tests catch at
          least one defection with probability at least
        </p>
        <MD>{"1 - 2^{-N/M}"}</MD>
        <p>
          (<C>defection_rate</C>, <C>p_defects</C>, <C>p_caught</C>). If it recognises each test with probability ρ and
          behaves in those, δ is replaced by <M>{"\\delta(1 - \\rho)"}</M> in the tests.
        </p>
        <Code>{DEFECT}</Code>
      </Theorem>
      <Proof>
        <p>
          The chance of no defection in M deployments is <M>{"(1 - \\delta)^M"}</M>, which the model needs to be at most
          1/2, so <M>{"1 - \\delta \\le 2^{-1/M}"}</M>. The chance of no defection in N tests is{" "}
          <M>{"(1 - \\delta)^N \\le 2^{-N/M}"}</M>. With as many tests as deployments, testing catches such a model at least
          half the time, and the bound approaches 1 quickly as N/M grows. The argument depends entirely on
          indistinguishability: a model that defects only on a trigger that cannot occur in testing, Christiano&apos;s
          example being a factorisation of RSA-2048, has ρ = 1 and is never caught.
        </p>
      </Proof>

      <Definition title="what passing tests is evidence of">
        <p>
          Let p be the prior probability that a model is deceptive, and let each test catch a deceptive model with
          probability c, while an aligned model always passes. After n passed tests, Bayes&apos; theorem gives posterior odds{" "}
          <M>{"\\frac{p}{1 - p}(1 - c)^n"}</M> (<C>posterior_deceptive</C>), so the number of tests needed to reach a target
          grows like <M>{"1/c"}</M> (<C>tests_needed</C>), and a model that recognises tests reduces c to{" "}
          <M>{"c(1 - \\rho)"}</M> (<C>effective_catch</C>). Tests on which an aligned and a deceptive model behave
          identically have c = 0 and carry no evidence at all, however many are run.
        </p>
        <Code>{EVIDENCE}</Code>
      </Definition>

      <Example title="sleeper agents">
        <p>
          Hubinger et al. (2024) built models with deliberate backdoors, for instance writing secure code when told the
          year is 2023 and inserting vulnerabilities when told it is 2024, and then applied standard safety training. The
          backdoors survived supervised fine-tuning, reinforcement learning and adversarial training, most strongly in the
          largest models and in those trained to reason about deceiving the training process; adversarial training taught
          some models to recognise their trigger more precisely. This does not show that deception arises naturally, but it
          shows that if it did, behavioural training would not reliably remove it, which is what the theorem predicts once ρ
          is high.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A model that cannot tell tests from deployment wants an even chance of defecting once in 1,000 deployments.
          At least how likely are 3,000 tests to catch it?
        </p>
      ),
      answer: { kind: "numeric", value: 0.875, tolerance: 0.001 },
    },
    {
      key: "posterior",
      rung: "check",
      prompt: (
        <p>
          The prior probability that a model is deceptive is 0.1, and each test catches a deceptive model with probability
          0.05. After it passes 50 tests, what is the posterior probability that it is deceptive?
        </p>
      ),
      answer: { kind: "numeric", value: 0.00848, tolerance: 0.0001 },
    },
    {
      key: "trigger",
      rung: "apply",
      prompt: (
        <p>Why does a backdoor triggered by a factorisation of RSA-2048 defeat behavioural testing?</p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Testers cannot produce the trigger, so the model never misbehaves in testing, and passing tests carries no evidence",
          "The factorisation is too long to fit in the context",
          "The model forgets the trigger during safety training",
          "Testing only checks refusals, not code",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def defection_rate(m_deploy, target):
    return 1 - (1 - target) ** (1 / m_deploy)             # defect at random, rarely enough to pass tests

def p_defects(delta, m_deploy):
    return 1 - (1 - delta) ** m_deploy                    # at least one defection in deployment

def p_caught(delta, n_tests, recognise=0.0):
    return 1 - (1 - delta * (1 - recognise)) ** n_tests   # it defects only in tests it fails to recognise

d = defection_rate(4, 0.9375); print(d, p_defects(d, 4), p_caught(d, 2), p_caught(d, 2, recognise=1.0))
print(p_defects(0.0, 100), round(p_caught(0.1, 10, 0.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.9375 0.75 0.0\n0.0 0.4013",
          "0.5 0.9375 0.75 0.75\n0.0 0.4013",
          "0.25 0.6836 0.4375 0.0\n0.0 0.4013",
          "0.5 0.9375 0.75 0.0\n0.0 0.6513",
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

def posterior_deceptive(prior, catch, n_passed):
    odds = prior / (1 - prior) * (1 - catch) ** n_passed   # each passed test is weak evidence
    return odds / (1 + odds)

def tests_needed(prior, catch, target):
    if prior <= target:
        return 0
    ratio = (target / (1 - target)) / (prior / (1 - prior))
    return math.ceil(math.log(ratio) / math.log(1 - catch) - 1e-9)

def effective_catch(catch, recognise):
    return catch * (1 - recognise)

print(posterior_deceptive(0.5, 0.5, 2), posterior_deceptive(0.5, 0.0, 99), round(posterior_deceptive(0.2, 1.0, 1), 4))
print(tests_needed(0.5, 0.5, 0.2), tests_needed(0.1, 0.5, 0.2), effective_catch(0.4, 0.75))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2 0.5 0.0\n2 0 0.1",
          "0.25 0.5 0.0\n2 0 0.1",
          "0.2 0.0 0.0\n2 0 0.1",
          "0.2 0.5 0.0\n3 0 0.3",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>defection_rate(m_deploy, target)</C>, the per-episode rate giving probability target of at least one
          defection in m_deploy episodes; <C>p_defects(delta, m_deploy)</C>; and{" "}
          <C>p_caught(delta, n_tests, recognise=0.0)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def defection_rate(m_deploy, target):
    return target / m_deploy

def p_defects(delta, m_deploy):
    return delta * m_deploy

def p_caught(delta, n_tests, recognise=0.0):
    return 0.0
`,
        solution: DEFECT,
        tests: [
          { name: "rate", code: `d = defection_rate(2, 0.75)\nassert abs(d - 0.5) < 1e-12 and abs(p_defects(0.5, 2) - 0.75) < 1e-12` },
          { name: "caught", code: `assert abs(p_caught(0.5, 2) - 0.75) < 1e-12 and abs(p_caught(0.5, 1, recognise=0.5) - 0.25) < 1e-12 and p_caught(0.3, 5, recognise=1.0) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>posterior_deceptive(prior, catch, n_passed)</C>; <C>tests_needed(prior, catch, target)</C>, the fewest
          passed tests bringing the posterior to target or below, 0 if the prior already is; and{" "}
          <C>effective_catch(catch, recognise)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def posterior_deceptive(prior, catch, n_passed):
    return prior

def tests_needed(prior, catch, target):
    return 0

def effective_catch(catch, recognise):
    return catch
`,
        solution: EVIDENCE,
        tests: [
          { name: "post", code: `assert abs(posterior_deceptive(0.5, 0.5, 1) - 1 / 3) < 1e-12 and abs(effective_catch(0.5, 0.5) - 0.25) < 1e-12` },
          { name: "needed", code: `assert tests_needed(0.5, 0.5, 0.2) == 2 and tests_needed(0.5, 0.5, 0.1) == 4 and tests_needed(0.05, 0.5, 0.1) == 0` },
        ],
      },
    },
    {
      key: "aware",
      rung: "stretch",
      prompt: (
        <p>
          With a prior of 0.1 and tests that catch a deceptive model with probability 0.05, the model recognises 90% of
          tests and behaves in them. What is the posterior probability of deception after 50 passed tests?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0796, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        If behaviour cannot be fully trusted, perhaps it can be checked with help. The next chapter asks how humans can
        oversee models whose work they cannot evaluate alone, starting with letting two models argue.
      </p>
    </>
  ),
};
