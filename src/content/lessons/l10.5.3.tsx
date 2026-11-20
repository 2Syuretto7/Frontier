import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SandbagViz } from "@/components/viz/SandbagViz";
import type { LessonContent } from "@/lib/types";

const ABILITY = `import math

def irt_p(theta, b):
    return 1 / (1 + math.exp(-(theta - b)))

def loglik(responses, difficulties, theta):
    total = 0.0
    for y, b in zip(responses, difficulties):
        p = irt_p(theta, b)
        total += math.log(p) if y else math.log(1 - p)
    return total

def best_theta(responses, difficulties):
    grid = [i / 100 for i in range(-400, 401)]
    return max(grid, key=lambda t: loglik(responses, difficulties, t))`;

const DETECT = `import math

def two_prop_z(k1, n1, k2, n2):
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
    return (k2 / n2 - k1 / n1) / se

def noise_improvement(accs):
    return max(accs) - accs[0]

def flag_sandbagging(z, improvement, z_crit=2.33, min_gain=0.05):
    return z > z_crit or improvement > min_gain`;

export const lesson: LessonContent = {
  id: "l10.5.3",
  minutes: 50,
  links: {
    requires: ["l10.5.2", "l10.1.1"],
    revisits: ["m9.4.1", "l10.2.4", "l9.8.2"],
    foreshadows: ["l14.4.1", "l14.4.2", "l11.1.1"],
  },

  puzzle: (
    <>
      <p>
        Dangerous-capability evaluations assume the model is trying its best. Van der Weij et al. (2024) showed that language models
        can be prompted, or fine-tuned, to score poorly on a dangerous-capability test while keeping their scores on general tests,
        and Greenblatt et al. (2024) trained &quot;password-locked&quot; models that hide a skill unless a password appears in the prompt.
        Strategic underperformance on evaluations is called sandbagging, whether a developer or the model itself is responsible. If a
        model might sandbag, how can an evaluator tell a weak model from one holding back?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Holding back leaves traces. A model that truly lacks a skill fails mostly on hard items; one that hides it fails easy items
        too, in a pattern that does not match any single level of ability. Hidden skills can often be recovered by brief fine-tuning
        on correct examples, much faster than a skill could be learned from scratch. And perturbing the model can break the
        underperformance before it breaks the skill.
      </p>
      <SandbagViz />
    </>
  ),

  theory: (
    <>
      <Definition title="an ability model for consistency checks">
        <p>
          Under a one-parameter item-response model (l10.1.1), a model of ability θ answers an item of difficulty b correctly with
          probability <M>{"\\sigma(\\theta - b)"}</M> (<C>irt_p</C>), with difficulties calibrated on many other models. The log-likelihood
          of a response pattern (<C>loglik</C>) is maximised at the model&apos;s estimated ability (<C>best_theta</C>, by grid search). A
          sandbagging pattern fits badly at every θ: it has too many misses on easy items for a high θ and too many hits on hard items
          for a low one. Person-fit statistics compare the achieved log-likelihood with its distribution under the model and flag
          unusually low values.
        </p>
        <Code>{ABILITY}</Code>
      </Definition>

      <Theorem title="the ability estimate">
        <p>
          For responses <M>{"y_i"}</M> on items <M>{"b_i"}</M>, the maximum-likelihood ability satisfies{" "}
          <M>{"\\sum_i y_i = \\sum_i \\sigma(\\theta - b_i)"}</M>: the expected number correct equals the observed number. If every
          response is correct, or every one wrong, no finite maximum exists.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"p_i = \\sigma(\\theta - b_i)"}</M> and <M>{"\\sigma' = \\sigma(1-\\sigma)"}</M>, the derivative of{" "}
          <M>{"\\sum_i [y_i \\log p_i + (1-y_i)\\log(1-p_i)]"}</M> with respect to θ is <M>{"\\sum_i (y_i - p_i)"}</M>. The second derivative{" "}
          <M>{"-\\sum_i p_i(1-p_i)"}</M> is negative, so the log-likelihood is strictly concave and a stationary point is the unique
          maximum. If all <M>{"y_i = 1"}</M>, the derivative is positive for every θ and the likelihood increases without bound, so a grid
          search returns its upper edge. Notice the estimate depends only on the number correct, not on which items; that is why fit
          statistics, which do look at which items, are needed to spot an odd pattern.
        </p>
      </Proof>

      <Definition title="recovery tests">
        <p>
          Fine-tune on a small number of correct demonstrations and re-evaluate. A skill that was hidden returns quickly; Greenblatt et
          al. found a handful of demonstrations often unlocked password-locked skills. A two-proportion z-test compares accuracy before
          and after (<C>two_prop_z</C>). Tice et al. (2024) found that adding small random noise to a sandbagging model&apos;s weights can
          raise its score, while noise only lowers an honest model&apos;s; the largest gain over noise levels (<C>noise_improvement</C>) is
          another signal. Either signal can raise a flag (<C>flag_sandbagging</C>), though a fine-tuning gain is also what ordinary
          under-elicitation produces (l10.5.2).
        </p>
        <Code>{DETECT}</Code>
      </Definition>

      <Remark title="limits">
        <p>
          A careful sandbagger could mimic a weaker model&apos;s response pattern, missing hard items more than easy ones, which defeats fit
          statistics. Fine-tuning on demonstrations needs good demonstrations, which may not exist for the most dangerous skills, and a
          model might resist training. Models also sometimes recognise that they are being tested, and evaluation awareness makes every
          behavioural measurement harder to interpret. These are open problems, studied further under model organisms of misalignment
          and control (l14.4.1, l14.4.2); interpretability tools that read a model&apos;s internal knowledge directly (l11.1.1) are a
          promising complement.
        </p>
      </Remark>

      <Example title="a suspicious jump">
        <p>
          A model scores 15% on a cyber-offence test. After fine-tuning on ten worked examples, which teach no new technique, it scores
          35% on held-out items. With 200 items each time, the z statistic is about 4.6, far beyond chance. The fine-tuning was too small
          to teach the skill, so the more likely explanations are that the skill was present and either hidden or simply not elicited;
          either way, the original 15% should not be relied on.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "z",
      rung: "check",
      prompt: (
        <p>
          Before fine-tuning, a model solves 40 of 250 items; after brief fine-tuning on a few demonstrations it solves 75 of 250 new
          items. What is the two-proportion z statistic? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.72, tolerance: 0.01 },
    },
    {
      key: "ll",
      rung: "check",
      prompt: (
        <p>
          At ability θ = 1, a model misses an item of difficulty 0 and gets right an item of difficulty 2. What is the log-likelihood of
          this pattern? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -2.627, tolerance: 0.001 },
    },
    {
      key: "pattern",
      rung: "apply",
      prompt: (
        <p>
          Two models each answer 50% of a calibrated test correctly. Model A misses mostly the hardest items. Model B misses items
          spread evenly across difficulty, including many of the easiest. What follows?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "They have the same ability estimate, but B's pattern fits an ability model poorly, which is worth investigating as possible sandbagging or a problem with the test",
          "B has lower ability, since it misses easy items",
          "A is sandbagging, since it never misses easy items",
          "Nothing, since their scores are equal",
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

def irt_p(theta, b):
    return 1 / (1 + math.exp(-(theta - b)))

def loglik(responses, difficulties, theta):
    total = 0.0
    for y, b in zip(responses, difficulties):
        p = irt_p(theta, b)
        total += math.log(p) if y else math.log(1 - p)
    return total

def best_theta(responses, difficulties):
    grid = [i / 100 for i in range(-400, 401)]
    return max(grid, key=lambda t: loglik(responses, difficulties, t))

print(irt_p(1.0, 1.0), round(loglik([1, 0], [0.0, 0.0], 0.0), 3))
print(best_theta([1, 0], [0.0, 0.0]), best_theta([1, 1], [0.0, 0.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 -1.386\n0.0 4.0",
          "0.5 -0.693\n0.0 4.0",
          "0.5 -1.386\n0.5 4.0",
          "0.5 -1.386\n0.0 1.0",
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

def two_prop_z(k1, n1, k2, n2):
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
    return (k2 / n2 - k1 / n1) / se

def noise_improvement(accs):
    return max(accs) - accs[0]

def flag_sandbagging(z, improvement, z_crit=2.33, min_gain=0.05):
    return z > z_crit or improvement > min_gain

print(two_prop_z(10, 20, 10, 20), noise_improvement([0.4, 0.3, 0.2]))
print(flag_sandbagging(1.0, 0.1), flag_sandbagging(1.0, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.0\nTrue False",
          "0.0 0.4\nTrue False",
          "0.0 0.0\nTrue True",
          "0.5 0.0\nTrue False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>irt_p(theta, b)</C>, <C>loglik(responses, difficulties, theta)</C> for 0 or 1 responses, and{" "}
          <C>best_theta(responses, difficulties)</C>, the maximiser over the grid −4.00, −3.99, …, 4.00, taking the first on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def irt_p(theta, b):
    return 0.5

def loglik(responses, difficulties, theta):
    return 0.0

def best_theta(responses, difficulties):
    return 0.0
`,
        solution: ABILITY,
        tests: [
          { name: "ll", code: `assert abs(irt_p(2.0, 0.0) - 0.8807970780) < 1e-9 and abs(loglik([1, 1, 0], [0, 1, 2], 0.5) - (-1.6495672463)) < 1e-9` },
          { name: "theta", code: `assert best_theta([1, 1, 1, 0], [-2, -1, 0, 1]) == 0.89 and best_theta([1, 0, 0, 0], [-1, 0, 1, 2]) == -0.89` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>two_prop_z(k1, n1, k2, n2)</C> with the pooled standard error, positive when the second rate is higher,{" "}
          <C>noise_improvement(accs)</C>, where <C>accs[0]</C> is accuracy without noise, and{" "}
          <C>flag_sandbagging(z, improvement, z_crit=2.33, min_gain=0.05)</C>, true when either signal exceeds its threshold.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def two_prop_z(k1, n1, k2, n2):
    return 0.0

def noise_improvement(accs):
    return 0.0

def flag_sandbagging(z, improvement, z_crit=2.33, min_gain=0.05):
    return False
`,
        solution: DETECT,
        tests: [
          { name: "z", code: `assert abs(two_prop_z(5, 50, 15, 50) - 2.5) < 1e-9 and abs(noise_improvement([0.3, 0.45, 0.5, 0.2]) - 0.2) < 1e-12` },
          { name: "flag", code: `assert flag_sandbagging(3.0, 0.0) and flag_sandbagging(2.0, 0.06) and not flag_sandbagging(2.0, 0.05)` },
        ],
      },
    },
    {
      key: "mle",
      rung: "stretch",
      prompt: (
        <p>
          A model answers items of difficulty −1, 0 and 1, getting the first two right and the third wrong. What is its exact
          maximum-likelihood ability? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the evaluation of models from the outside. The next module turns to the science of why deep networks generalise
        at all, beginning with the line between memorising training data and learning a rule.
      </p>
    </>
  ),
};
