import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OverOptimisationViz } from "@/components/viz/OverOptimisationViz";
import type { LessonContent } from "@/lib/types";

const LAWS = `import math

def bon_kl(n):
    return math.log(n) - (n - 1) / n

def gold_bon(kl, alpha, beta):
    d = math.sqrt(kl)
    return d * (alpha - beta * d)

def gold_rl(kl, alpha, beta):
    d = math.sqrt(kl)
    if d == 0:
        return 0.0
    return d * (alpha - beta * math.log(d))`;

const GUARD = `import math

def pick_best(proxy, gold):
    i = max(range(len(proxy)), key=lambda k: proxy[k])
    return gold[i]

def ensemble_reward(preds, lam):
    m = sum(preds) / len(preds)
    var = sum((p - m) ** 2 for p in preds) / len(preds)
    return m - lam * math.sqrt(var)

def worst_case(preds):
    return min(preds)`;

export const lesson: LessonContent = {
  id: "l9.3.3",
  minutes: 50,
  links: {
    requires: ["l9.3.2", "m12.2.1"],
    revisits: ["m9.1.3", "l6.7.4"],
    foreshadows: ["l9.4.2", "l9.8.2", "l10.1.4"],
  },

  puzzle: (
    <>
      <p>
        A reward model agrees with human raters about 70% of the time. A policy is then optimised to score as highly as
        possible under it. Early in training, people like the outputs more and more. Later the reward model&apos;s score keeps
        climbing while the outputs grow long, flattering and padded with confident filler, and people like them less. Nothing
        in the training loss signals the turn. How far can a learned reward be pushed before it stops meaning what it was
        trained to mean, and can that distance be predicted?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A reward model is right on average over the responses it was trained on. Optimisation does not sample responses on
        average; it seeks out the ones the reward model scores highest, and among those, a growing share score highly because of
        the model&apos;s errors rather than real quality. This is Goodhart&apos;s law: when a measure becomes a target, it ceases to be a
        good measure. The useful quantity for measuring how hard the policy has been pushed is the KL divergence from where it
        started. Plotted against it, the true reward rises, peaks and falls, and a better reward model moves the peak further out.
      </p>
      <OverOptimisationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="proxy and gold rewards">
        <p>
          The <em>proxy</em> is the learned reward model that is optimised. The <em>gold</em> reward is what is actually wanted,
          approximated in experiments by human evaluation or, in Gao, Schulman and Hilton&apos;s 2022 study, by a much larger reward model
          that labelled the training data for smaller proxies. Optimisation strength is measured by{" "}
          <M>{"\\mathrm{KL}(\\pi \\,\\|\\, \\pi_{\\text{ref}})"}</M>, the divergence of the optimised policy from the starting one.
        </p>
      </Definition>

      <Theorem title="KL of best-of-n">
        <p>
          Draw n samples from <M>{"\\pi_{\\text{ref}}"}</M> and keep the one the proxy scores highest, with no ties. The resulting
          policy satisfies
        </p>
        <MD>{"\\mathrm{KL}(\\pi_{\\text{bon}} \\,\\|\\, \\pi_{\\text{ref}}) = \\log n - \\frac{n-1}{n}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Map each response y to its quantile <M>{"u = F(r(y))"}</M> under the proxy, which is uniform on [0, 1] under <M>{"\\pi_{\\text{ref}}"}</M>.
          The best of n has the distribution of the largest of n uniforms (m9.1.3), with density <M>{"n u^{n-1}"}</M>, so the likelihood
          ratio of <M>{"\\pi_{\\text{bon}}"}</M> to <M>{"\\pi_{\\text{ref}}"}</M> at y is <M>{"n u^{n-1}"}</M>. Then
        </p>
        <MD>{"\\mathrm{KL} = \\mathbb{E}_{u \\sim \\mathrm{Beta}(n,1)}\\big[\\log n + (n-1)\\log u\\big] = \\log n + (n-1)\\Big(-\\frac{1}{n}\\Big),"}</MD>
        <p>
          using <M>{"\\mathbb{E}[\\log u] = \\int_0^1 n u^{n-1}\\log u \\, du = -1/n"}</M>. When responses tie in reward, as with discrete
          outputs, the formula is an upper bound. The KL grows only like log n, so best-of-n is a gentle optimiser: best-of-64
          moves just 3.2 nats.
        </p>
      </Proof>

      <Definition title="the over-optimisation laws">
        <p>
          Writing <M>{"d = \\sqrt{\\mathrm{KL}}"}</M>, Gao et al. found the gold reward, measured from its value at the start, follows
        </p>
        <MD>{"R_{\\text{bon}}(d) = d(\\alpha_{\\text{bon}} - \\beta_{\\text{bon}} d), \\qquad R_{\\text{RL}}(d) = d(\\alpha_{\\text{RL}} - \\beta_{\\text{RL}} \\log d)"}</MD>
        <p>
          for best-of-n and for PPO respectively (<C>bon_kl</C>, <C>gold_bon</C>, <C>gold_rl</C>). Each rises, peaks and declines. The
          coefficients vary smoothly with the proxy&apos;s parameter count and with the amount of preference data: larger proxies have a
          larger <M>{"\\alpha"}</M> relative to <M>{"\\beta"}</M>, so the peak is higher and later. RL spends KL far less efficiently
          than best-of-n, reaching a given gold reward only at a much larger KL.
        </p>
        <Code>{LAWS}</Code>
      </Definition>

      <Remark title="kinds of Goodhart">
        <p>
          Manheim and Garrabrant distinguish four. <em>Regressional</em>: the proxy is the goal plus noise, so selecting extremes
          selects noise too. <em>Extremal</em>: optimisation reaches inputs unlike the training data, where the proxy&apos;s fit fails,
          the case in the visualisation. <em>Causal</em>: the proxy tracks a correlate, such as length, and pushing it does not push
          quality. <em>Adversarial</em>: the optimiser finds inputs that exploit the model&apos;s specific flaws. Length is the best
          documented exploit: Singhal et al. found much of the gain from RLHF on several datasets could be reproduced by
          rewarding length alone. Sycophancy, telling raters what they want to hear, is another (l9.8.2).
        </p>
      </Remark>

      <Definition title="mitigations">
        <p>
          A KL penalty keeps the policy near the reference (l9.4.2), though Gao et al. found that in their setting it acted like early
          stopping without improving the gold–KL frontier. Larger reward models and more data delay the peak. An ensemble of reward
          models trained with different seeds can be optimised pessimistically: the minimum over members (<C>worst_case</C>), or the
          mean minus a multiple of their disagreement (<C>ensemble_reward</C>), since members disagree most where the proxy is
          least trustworthy. Iterated RLHF collects fresh comparisons on the current policy&apos;s outputs and retrains the reward
          model, as Llama 2 did over five rounds. Evaluations check outcomes directly, as in best-of-n with a held-out judge
          (<C>pick_best</C>).
        </p>
        <Code>{GUARD}</Code>
      </Definition>

      <Example title="reading a peak from the fitted form">
        <p>
          For best-of-n with <M>{"\\alpha = 1.2"}</M> and <M>{"\\beta = 0.4"}</M>, <M>{"R(d) = 1.2d - 0.4d^2"}</M> is a downward parabola
          in d, maximised at <M>{"d^* = \\alpha/(2\\beta) = 1.5"}</M>, that is KL = 2.25 nats, where the gold gain is 0.9. Past it,
          larger n spends compute to make outputs worse.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bonkl",
      rung: "check",
      prompt: <p>What is the KL divergence, in nats, between best-of-20 sampling and the base policy? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.046, tolerance: 0.001 },
    },
    {
      key: "peak",
      rung: "check",
      prompt: (
        <p>
          A best-of-n fit gives <M>{"\\alpha = 0.8"}</M> and <M>{"\\beta = 0.15"}</M>. At what KL, in nats, does the gold reward peak?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 7.111, tolerance: 0.002 },
    },
    {
      key: "length",
      rung: "apply",
      prompt: (
        <p>
          During RLHF the proxy reward climbs steadily, mean response length doubles, and a held-out human evaluation stops
          improving. Which response is best supported by this lesson?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Treat it as over-optimisation of a length correlate: stop earlier or raise the KL penalty, and refresh or penalise the reward model on length",
          "Train longer, since the proxy reward is still rising",
          "Raise the learning rate so that the policy escapes the plateau",
          "Conclude that people prefer long responses, so the human evaluation must be wrong",
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

def bon_kl(n):
    return math.log(n) - (n - 1) / n

def gold_bon(kl, alpha, beta):
    d = math.sqrt(kl)
    return d * (alpha - beta * d)

def gold_rl(kl, alpha, beta):
    d = math.sqrt(kl)
    if d == 0:
        return 0.0
    return d * (alpha - beta * math.log(d))

print(round(bon_kl(1), 3), round(bon_kl(2), 3), round(bon_kl(4), 3))
print(round(gold_bon(4.0, 1.0, 0.5), 3), round(gold_bon(1.0, 1.0, 0.5), 3), gold_rl(0.0, 1.0, 0.5), round(gold_rl(1.0, 1.0, 0.5), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.193 0.636\n0.0 0.5 0.0 1.0",
          "0.0 0.693 1.386\n0.0 0.5 0.0 1.0",
          "0.0 0.193 0.636\n1.0 0.5 0.0 1.0",
          "0.0 0.193 0.636\n0.0 0.5 0.0 0.5",
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

def pick_best(proxy, gold):
    i = max(range(len(proxy)), key=lambda k: proxy[k])
    return gold[i]

def ensemble_reward(preds, lam):
    m = sum(preds) / len(preds)
    var = sum((p - m) ** 2 for p in preds) / len(preds)
    return m - lam * math.sqrt(var)

def worst_case(preds):
    return min(preds)

print(pick_best([0.2, 0.9, 0.5], [1.0, -0.3, 0.8]), worst_case([0.4, -0.1, 0.7]))
print(round(ensemble_reward([1.0, 3.0], 1.0), 3), ensemble_reward([2.0, 2.0, 2.0], 5.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.3 -0.1\n1.0 2.0",
          "0.9 -0.1\n1.0 2.0",
          "-0.3 -0.1\n0.586 2.0",
          "1.0 0.7\n1.0 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bon_kl(n)</C>, <C>gold_bon(kl, alpha, beta)</C> and <C>gold_rl(kl, alpha, beta)</C>, where both gold functions take
          the KL, use <M>{"d = \\sqrt{\\mathrm{KL}}"}</M>, and <C>gold_rl</C> returns 0 at zero KL.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bon_kl(n):
    return math.log(n)

def gold_bon(kl, alpha, beta):
    return kl * (alpha - beta * kl)

def gold_rl(kl, alpha, beta):
    return kl * (alpha - beta * math.log(kl))
`,
        solution: LAWS,
        tests: [
          { name: "bon", code: `assert bon_kl(1) == 0 and abs(bon_kl(10) - (math.log(10) - 0.9)) < 1e-12 and abs(gold_bon(9.0, 1.0, 0.2) - 1.2) < 1e-12` },
          { name: "rl", code: `assert gold_rl(0.0, 1.0, 0.5) == 0.0 and abs(gold_rl(math.exp(2), 1.0, 0.5) - math.e * 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pick_best(proxy, gold)</C>, returning the gold score of the candidate with the highest proxy score (the first on a
          tie), <C>ensemble_reward(preds, lam)</C>, the mean minus lam times the population standard deviation, and{" "}
          <C>worst_case(preds)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pick_best(proxy, gold):
    return max(gold)

def ensemble_reward(preds, lam):
    return sum(preds) / len(preds)

def worst_case(preds):
    return max(preds)
`,
        solution: GUARD,
        tests: [
          { name: "pick", code: `assert pick_best([3, 1, 3], [-1, 5, 2]) == -1 and worst_case([2, -4, 1]) == -4` },
          { name: "ens", code: `assert abs(ensemble_reward([0.0, 4.0], 0.5) - 1.0) < 1e-12 and abs(ensemble_reward([1.0, 1.0], 9.0) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "rlpeak",
      rung: "stretch",
      prompt: (
        <p>
          An RL fit gives <M>{"R(d) = d(0.5 - 0.2\\log d)"}</M>. What is the largest gold gain it predicts? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.896, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Best-of-n is simple but expensive at inference. The next module trains the policy itself against the reward model with
        reinforcement learning, where the KL penalty becomes part of the objective.
      </p>
    </>
  ),
};
