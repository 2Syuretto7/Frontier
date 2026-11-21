import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BudgetFrontierViz } from "@/components/viz/BudgetFrontierViz";
import type { LessonContent } from "@/lib/types";

const LAWS = `import math

def chinchilla(C, r=20):
    N = math.sqrt(C / (6 * r))                             # C = 6 N D with D = r N
    return N, r * N

def effective_tokens(unique, epochs, r_star=15.4):
    R = epochs - 1                                         # repetitions beyond the first pass
    return unique + unique * r_star * (1 - math.exp(-R / r_star))

def loss(N, D, E=1.69, A=406.4, B=410.7, a=0.34, b=0.28):
    return E + A / N ** a + B / D ** b`;

const PLAN = `def split(total, fractions):
    plan = {k: total * f for k, f in fractions.items()}
    plan["contingency"] = total - sum(plan.values())       # whatever is not allocated is held back
    return plan

def lifetime_flops(N, D, served):
    return 6 * N * D + 2 * N * served                      # training, then inference on served tokens

def best_size(budget, served, sizes, loss):
    best = None
    for N in sizes:
        D = (budget - 2 * N * served) / (6 * N)            # tokens left for training after serving
        if D > 0 and (best is None or loss(N, D) < best[2]):
            best = (N, D, loss(N, D))
    return best`;

export const lesson: LessonContent = {
  id: "e15.1.2",
  minutes: 45,
  links: {
    requires: ["e15.1.1"],
    revisits: ["l8.4.3", "l8.4.4", "l8.1.3", "e13.1.1"],
    foreshadows: ["e15.2.1", "e15.3.1"],
  },

  puzzle: (
    <>
      <p>
        The capstone has a fixed amount of GPU time. Spending it all on one big run leaves nothing for the experiments
        that tell you how to configure that run, or for post-training, or for the run that crashes on day two. And
        even the main run&apos;s share can be spent on a larger model trained briefly or a smaller one trained long,
        which also changes what the model costs to serve. How should the budget be divided?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Divide first by purpose: a ladder of small runs, the main run, mid-training, post-training, evaluation, and a
        reserve for failures. Then size the main run with the scaling laws of l8.4.3: for a fixed compute budget there
        is a loss-minimising model size, and the data needed follows from it. If the model will be served heavily,
        inference compute counts too and shifts the choice towards a smaller model trained longer, as in l8.4.4. Finally
        check the data: if there are not enough unique tokens, repeating them for a few epochs costs little.
      </p>
      <BudgetFrontierViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the parametric loss">
        <p>
          Hoffmann and colleagues fitted the final loss of a model with N parameters trained on D tokens as
        </p>
        <MD>{"L(N, D) = E + \\frac{A}{N^{\\alpha}} + \\frac{B}{D^{\\beta}}"}</MD>
        <p>
          with <M>{"E = 1.69"}</M>, <M>{"A = 406.4"}</M>, <M>{"B = 410.7"}</M>, <M>{"\\alpha = 0.34"}</M> and{" "}
          <M>{"\\beta = 0.28"}</M> (<C>loss</C>). The constants depend on the data and tokeniser, so the capstone&apos;s
          ladder will fit its own, but the form guides the plan. The rule of thumb D ≈ 20N with C = 6ND gives the size{" "}
          <M>{"N = \\sqrt{C/120}"}</M> (<C>chinchilla</C>).
        </p>
      </Definition>

      <Theorem title="the compute-optimal size">
        <p>
          Minimising L(N, D) subject to 6ND = C gives{" "}
          <M>{"N^* = G\\,(C/6)^{\\beta/(\\alpha+\\beta)}"}</M> and{" "}
          <M>{"D^* = G^{-1}(C/6)^{\\alpha/(\\alpha+\\beta)}"}</M>, where{" "}
          <M>{"G = \\left(\\alpha A / (\\beta B)\\right)^{1/(\\alpha+\\beta)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substitute D = C/(6N), so the loss is <M>{"E + AN^{-\\alpha} + B(6N/C)^{\\beta}"}</M>. Its derivative in N is{" "}
          <M>{"-\\alpha A N^{-\\alpha-1} + \\beta B (6/C)^{\\beta} N^{\\beta-1}"}</M>, which is zero when{" "}
          <M>{"N^{\\alpha+\\beta} = (\\alpha A / \\beta B)(C/6)^{\\beta}"}</M>, giving <M>{"N^*"}</M>. The second
          derivative is positive, so this is the minimum. Then <M>{"D^* = C/(6N^*)"}</M>, which simplifies to the stated
          form because the exponents of C/6 add to one. With the constants above, β/(α + β) ≈ 0.45, so the optimal size
          grows a little slower than the square root of compute.
        </p>
      </Proof>

      <Definition title="repeated data">
        <p>
          Muennighoff and colleagues found that U unique tokens repeated for R extra epochs are worth{" "}
          <M>{"U + U R^* (1 - e^{-R/R^*})"}</M> fresh tokens, with <M>{"R^* \\approx 15.4"}</M> (<C>effective_tokens</C>).
          Up to about four epochs, repetition is almost as good as new data, as l8.1.3 discussed; well beyond that it adds
          little. The capstone&apos;s corpus can therefore be about a quarter of the training tokens without much loss.
        </p>
        <Code>{LAWS}</Code>
      </Definition>

      <Definition title="the budget plan">
        <p>
          The plan allocates fractions of the total to each purpose and holds the rest as contingency (<C>split</C>). If
          the model will serve S tokens in its life, the lifetime cost is <M>{"6ND + 2NS"}</M> (<C>lifetime_flops</C>);
          for a fixed lifetime budget, each candidate size gets the training tokens left after serving, and the best is
          the size with the lowest predicted loss (<C>best_size</C>).
        </p>
        <Code>{PLAN}</Code>
      </Definition>

      <Example title="a plan for the capstone">
        <p>
          A reasonable split is about 15% for the scaling ladder, 55% for the main run, 10% for mid-training, 10% for
          post-training and evaluation, and 10% held back. Teams that skip the reserve tend to discover, as in e13.1.1, that
          the first main run rarely finishes cleanly. The ladder&apos;s share buys the fitted constants that turn this
          lesson&apos;s generic plan into the capstone&apos;s own.
        </p>
      </Example>

      <Remark title="what the laws do not say">
        <p>
          The fit predicts pretraining loss, not downstream ability, and it assumes a fixed data distribution and a
          well-tuned learning rate schedule. Changing the data mixture, as the next chapter will, changes the constants.
          The plan should therefore be read as a starting point that the ladder in e15.3.1 corrects.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: (
        <p>
          With the rule D = 20N and C = 6ND, how many millions of parameters should a model trained with 7.2 × 10¹⁸ FLOPs
          have, to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 244.9, tolerance: 0.05 },
    },
    {
      key: "epochs",
      rung: "check",
      prompt: (
        <p>
          A corpus has 4 billion unique tokens and is trained on for 4 epochs. How many billion fresh tokens is that worth
          by the formula of this lesson, to two decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 14.9, tolerance: 0.01 },
    },
    {
      key: "serve",
      rung: "apply",
      prompt: <p>Why does expected serving traffic push the best model size down?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each served token costs 2N FLOPs, so a smaller model leaves more of a fixed lifetime budget for training tokens",
          "Smaller models always have lower loss",
          "Serving requires the model to fit on one GPU",
          "The scaling law constants change when a model is served",
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

def chinchilla(C, r=20):
    N = math.sqrt(C / (6 * r))                             # C = 6 N D with D = r N
    return N, r * N

def effective_tokens(unique, epochs, r_star=15.4):
    R = epochs - 1                                         # repetitions beyond the first pass
    return unique + unique * r_star * (1 - math.exp(-R / r_star))

def loss(N, D, E=1.69, A=406.4, B=410.7, a=0.34, b=0.28):
    return E + A / N ** a + B / D ** b

print(chinchilla(600, 1), effective_tokens(10, 1), round(effective_tokens(10, 2, 1), 3))
print(round(loss(10 ** 6, 10 ** 8, E=1, A=100, B=100, a=0.5, b=0.5), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(10.0, 10.0) 10.0 16.321\n1.11",
          "(10.0, 10.0) 10.0 20.0\n1.11",
          "(10.0, 10.0) 25.4 16.321\n1.11",
          "(10.0, 10.0) 10.0 16.321\n1.2",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def split(total, fractions):
    plan = {k: total * f for k, f in fractions.items()}
    plan["contingency"] = total - sum(plan.values())       # whatever is not allocated is held back
    return plan

def lifetime_flops(N, D, served):
    return 6 * N * D + 2 * N * served                      # training, then inference on served tokens

def best_size(budget, served, sizes, loss):
    best = None
    for N in sizes:
        D = (budget - 2 * N * served) / (6 * N)            # tokens left for training after serving
        if D > 0 and (best is None or loss(N, D) < best[2]):
            best = (N, D, loss(N, D))
    return best

print(split(100, {"main": 0.6, "ladder": 0.15}), lifetime_flops(2, 10, 30))
print(best_size(1200, 10, [5, 10, 20, 70], lambda N, D: 1 / N + 1 / D))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'main': 60.0, 'ladder': 15.0, 'contingency': 25.0} 240\n(10, 16.666666666666668, 0.16)",
          "{'main': 60.0, 'ladder': 15.0} 240\n(10, 16.666666666666668, 0.16)",
          "{'main': 60.0, 'ladder': 15.0, 'contingency': 25.0} 180\n(10, 16.666666666666668, 0.16)",
          "{'main': 60.0, 'ladder': 15.0, 'contingency': 25.0} 240\n(20, 6.666666666666667, 0.2)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chinchilla(C, r=20)</C>, returning (N, D); <C>effective_tokens(unique, epochs, r_star=15.4)</C>; and{" "}
          <C>loss(N, D, ...)</C> with the default constants of this lesson.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def chinchilla(C, r=20):
    return C / 6, r

def effective_tokens(unique, epochs, r_star=15.4):
    return unique * epochs

def loss(N, D, E=1.69, A=406.4, B=410.7, a=0.34, b=0.28):
    return E
`,
        solution: LAWS,
        tests: [
          { name: "size", code: `N, D = chinchilla(2400, 4); assert abs(N - 10) < 1e-9 and abs(D - 40) < 1e-9 and effective_tokens(7, 1) == 7` },
          { name: "fit", code: `assert abs(effective_tokens(3, 3, 2) - (3 + 6 * (1 - math.exp(-1)))) < 1e-12 and abs(loss(16, 81, E=0, A=8, B=6, a=0.75, b=0.5) - 5 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>split(total, fractions)</C>, adding a contingency entry for the remainder;{" "}
          <C>lifetime_flops(N, D, served)</C>; and <C>best_size(budget, served, sizes, loss)</C>, returning (N, D, loss)
          for the first size with the lowest loss among those with positive training tokens, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def split(total, fractions):
    return dict(fractions)

def lifetime_flops(N, D, served):
    return 6 * N * D

def best_size(budget, served, sizes, loss):
    return None
`,
        solution: PLAN,
        tests: [
          { name: "plan", code: `assert split(40, {"a": 0.5}) == {"a": 20.0, "contingency": 20.0} and lifetime_flops(3, 5, 7) == 132` },
          { name: "best", code: `r = best_size(60, 1, [1, 2, 40], lambda N, D: 1 / N + 1 / D); assert r[0] == 2 and abs(r[1] - 14 / 3) < 1e-9 and abs(r[2] - (0.5 + 3 / 14)) < 1e-9 and best_size(10, 5, [1], lambda N, D: 0) is None` },
        ],
      },
    },
    {
      key: "lifetime",
      rung: "stretch",
      prompt: (
        <p>
          A lifetime budget of 2 × 10¹⁹ FLOPs must also pay for serving 5 billion tokens. Among sizes of 100, 200, 300, 500 and 800 million parameters, using the parametric loss of
          this lesson, what is the lowest predicted loss, to three decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 2.883, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The budget says how many tokens to train on. The next lesson decides how the model will be judged, before
        any training begins, so that the results cannot quietly redefine the goal.
      </p>
    </>
  ),
};
