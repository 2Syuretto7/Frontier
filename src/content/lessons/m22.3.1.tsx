import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PotentialOutcomesViz } from "@/components/viz/PotentialOutcomesViz";
import type { LessonContent } from "@/lib/types";

const TABLE = `import numpy as np

def observed(y1, y0, t):
    return np.where(t == 1, y1, y0)                            # only one potential outcome is ever seen

def ate_att(y1, y0, t):
    tau = y1 - y0
    return float(tau.mean()), float(tau[t == 1].mean())        # need both columns: not computable from data

def diff_means(y, t):
    return float(y[t == 1].mean() - y[t == 0].mean())`;

const ESTIMATE = `import numpy as np

def neyman_var(y, t):
    a, b = y[t == 1], y[t == 0]
    return float(a.var(ddof=1) / len(a) + b.var(ddof=1) / len(b))   # conservative variance estimate

def randomisation_dist(y1, y0, n1, reps, seed=0):
    r, n, out = np.random.default_rng(seed), len(y1), []
    for _ in range(reps):
        t = np.zeros(n, int); t[r.choice(n, n1, replace=False)] = 1
        y = np.where(t == 1, y1, y0)
        out.append(y[t == 1].mean() - y[t == 0].mean())
    return np.array(out)

def aipw(y, t, mu1, mu0, e):
    return float(np.mean(mu1 - mu0 + t * (y - mu1) / e - (1 - t) * (y - mu0) / (1 - e)))`;

export const lesson: LessonContent = {
  id: "m22.3.1",
  minutes: 55,
  links: {
    requires: ["m22.1.3", "m9.8.5"],
    revisits: ["m22.2.2", "m22.2.1"],
    foreshadows: ["m22.3.2"],
  },

  puzzle: (
    <>
      <p>
        A patient took a drug and recovered. Did the drug help? The answer compares two numbers about this one patient: how
        they fared with the drug, and how they would have fared without it. Only one of them can ever be observed. Statistics
        compares groups, not individuals, so what exactly is a causal effect, which versions of it can data estimate, and under
        what conditions on how treatment was assigned?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give every unit two outcomes in advance, one for each treatment, and let the assignment decide which one we get to see.
        Causal effects are differences between the two columns of this table, and the unseen half of the table is missing data.
        When a coin decides who is treated, the seen halves are random samples of each column, so their means estimate the
        column means. When units choose for themselves, the seen halves are selected samples, and the comparison mixes the
        effect with the differences between the kinds of units that chose each option.
      </p>
      <PotentialOutcomesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="potential outcomes">
        <p>
          Each unit i has potential outcomes <M>{"Y_i(1)"}</M> and <M>{"Y_i(0)"}</M>, the outcomes it would have under
          treatment and control, and effect <M>{"\\tau_i = Y_i(1) - Y_i(0)"}</M>. With treatment <M>{"T_i"}</M>, the observed
          outcome is <M>{"Y_i = T_iY_i(1) + (1 - T_i)Y_i(0)"}</M> (consistency, <C>observed</C>). The average treatment effect is{" "}
          <M>{"\\mathbb{E}[\\tau]"}</M> and the effect on the treated is <M>{"\\mathbb{E}[\\tau \\mid T = 1]"}</M> (<C>ate_att</C>).
          The notation assumes no interference (one unit&apos;s treatment does not change another&apos;s outcome) and a single
          version of each treatment, together called SUTVA.
        </p>
        <Code>{TABLE}</Code>
      </Definition>

      <Remark title="the link to structural models">
        <p>
          In a structural causal model with noise U, <M>{"Y_u(x)"}</M> is the value of Y in the model with{" "}
          <M>{"\\mathrm{do}(X = x)"}</M> and noise fixed at u. Each unit is a value of u, so potential outcomes are random
          variables defined by the model, consistency holds automatically, and the do-distributions of m22.1.3 are their
          distributions: <M>{"P(Y(x) = y) = P(y \\mid \\mathrm{do}(x))"}</M>. The structural model also says which conditional
          independencies between potential outcomes and treatment hold, which the potential outcomes framework takes as
          assumptions.
        </p>
      </Remark>

      <Theorem title="randomisation identifies the average effect">
        <p>
          If T is independent of <M>{"(Y(0), Y(1))"}</M>, then{" "}
          <M>{"\\mathbb{E}[Y \\mid T = 1] - \\mathbb{E}[Y \\mid T = 0] = \\mathbb{E}[\\tau]"}</M>. In a finite population of n units
          with exactly <M>{"n_1"}</M> treated at random, the difference in observed means (<C>diff_means</C>) has expectation over
          assignments equal to the average of the <M>{"\\tau_i"}</M> (<C>randomisation_dist</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}[Y \\mid T = 1] = \\mathbb{E}[Y(1) \\mid T = 1] = \\mathbb{E}[Y(1)]"}</M> by consistency then independence,
          and likewise for T = 0; subtract. In the finite case, each unit is treated with probability <M>{"n_1/n"}</M>, so the
          expected treated mean is <M>{"\\frac1{n_1}\\sum_i \\frac{n_1}{n}Y_i(1) = \\overline{Y(1)}"}</M>, and the same for the
          control mean.
        </p>
      </Proof>

      <Theorem title="Neyman's variance">
        <p>
          Under complete randomisation, the variance of the difference in means over assignments is{" "}
          <M>{"S_1^2/n_1 + S_0^2/n_0 - S_\\tau^2/n"}</M>, where <M>{"S_1^2"}</M>, <M>{"S_0^2"}</M> and <M>{"S_\\tau^2"}</M> are the
          finite-population variances (divisor n − 1) of the columns <M>{"Y(1)"}</M>, <M>{"Y(0)"}</M> and <M>{"\\tau"}</M>. The last
          term involves the unseen joint table and cannot be estimated, so the usual estimate{" "}
          <M>{"s_1^2/n_1 + s_0^2/n_0"}</M> (<C>neyman_var</C>) is conservative: unbiased for an upper bound, exact when every unit
          has the same effect.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write the estimator as <M>{"\\sum_i T_i a_i - \\sum_i (1 - T_i)b_i"}</M> with <M>{"a_i = Y_i(1)/n_1"}</M> and{" "}
          <M>{"b_i = Y_i(0)/n_0"}</M>. Under sampling without replacement,{" "}
          <M>{"\\mathrm{Var}(T_i) = \\tfrac{n_1n_0}{n^2}"}</M> and <M>{"\\mathrm{Cov}(T_i, T_j) = -\\tfrac{n_1n_0}{n^2(n-1)}"}</M>, so{" "}
          <M>{"\\mathrm{Var}(\\sum_i T_ic_i) = \\tfrac{n_1n_0}{n(n-1)}\\sum_i(c_i - \\bar c)^2"}</M> for any constants c. The estimator
          equals <M>{"\\sum_i T_i(a_i + b_i) - \\sum_i b_i"}</M>, so its variance is this formula with{" "}
          <M>{"c_i = Y_i(1)/n_1 + Y_i(0)/n_0"}</M>. Expanding the square and using{" "}
          <M>{"2\\,\\mathrm{cov}(Y(1), Y(0)) = S_1^2 + S_0^2 - S_\\tau^2"}</M> gives the stated expression after simplification.
        </p>
      </Proof>

      <Theorem title="identification under ignorability">
        <p>
          If <M>{"(Y(0), Y(1))"}</M> is independent of T given covariates X (ignorability) and{" "}
          <M>{"0 < e(x) = P(T = 1 \\mid x) < 1"}</M> (positivity), then{" "}
          <M>{"\\mathbb{E}[\\tau] = \\mathbb{E}\\big[\\mathbb{E}[Y \\mid T = 1, X] - \\mathbb{E}[Y \\mid T = 0, X]\\big]"}</M>. With
          outcome regressions <M>{"\\mu_t(x)"}</M>, the augmented inverse propensity weighted estimator
        </p>
        <MD>{"\\hat\\tau = \\frac1n\\sum_i \\Big[\\mu_1(x_i) - \\mu_0(x_i) + \\frac{T_i(Y_i - \\mu_1(x_i))}{e(x_i)} - \\frac{(1 - T_i)(Y_i - \\mu_0(x_i))}{1 - e(x_i)}\\Big]"}</MD>
        <p>
          (<C>aipw</C>) has expectation <M>{"\\mathbb{E}[\\tau]"}</M> if either the outcome regressions or the propensity score are
          correct.
        </p>
        <Code>{ESTIMATE}</Code>
      </Theorem>
      <Proof>
        <p>
          Within each stratum X = x, ignorability makes T a coin with bias e(x), so the randomisation theorem applies stratum by
          stratum; average over X. For the estimator, condition on X = x. If e is correct,{" "}
          <M>{"\\mathbb{E}[T(Y - \\mu_1)/e \\mid x] = \\mathbb{E}[Y(1) \\mid x] - \\mu_1(x)"}</M>, which cancels the{" "}
          <M>{"\\mu_1"}</M> term whatever <M>{"\\mu_1"}</M> is; likewise for the control part. If instead the regressions are
          correct, <M>{"\\mathbb{E}[T(Y - \\mu_1(x)) \\mid x] = e(x)(\\mathbb{E}[Y(1) \\mid x] - \\mu_1(x)) = 0"}</M> whatever e is,
          and <M>{"\\mu_1 - \\mu_0"}</M> averages to the effect. Under the graph of m22.2.1, a backdoor set is a valid X here.
        </p>
      </Proof>

      <Example title="self-selection">
        <p>
          In the figure, when units with large gains choose treatment, the treated group is made of units with low baseline
          outcomes, and the difference in observed means, 1.00, understates the average effect of 1.50. Ignorability fails
          because the choice depends on the potential outcomes themselves; no measured covariate repairs this unless it captures
          why units chose.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "att",
      rung: "check",
      prompt: (
        <p>
          Four units have <M>{"Y(0)"}</M> = 1, 4, 2, 5 and <M>{"Y(1)"}</M> = 3, 4, 6, 4, and units 1 and 3 are treated. What is the
          average effect on the treated?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0005 },
    },
    {
      key: "dm",
      rung: "check",
      prompt: <p>For the same units and assignment, what is the difference in observed means, treated minus control?</p>,
      answer: { kind: "numeric", value: 0, tolerance: 0.0005 },
    },
    {
      key: "ign",
      rung: "apply",
      prompt: <p>Why does the difference in observed means estimate the average effect in a randomised experiment but not in an observational study where units choose treatment?</p>,
      answer: {
        kind: "choice",
        options: [
          "Randomisation makes treatment independent of the potential outcomes, so each observed group is a random sample of its column; choice can depend on the potential outcomes",
          "Because randomised experiments have larger samples",
          "Because observational studies violate consistency",
          "Because only randomised experiments satisfy SUTVA",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def observed(y1, y0, t):
    return np.where(t == 1, y1, y0)                            # only one potential outcome is ever seen

def ate_att(y1, y0, t):
    tau = y1 - y0
    return float(tau.mean()), float(tau[t == 1].mean())        # need both columns: not computable from data

def diff_means(y, t):
    return float(y[t == 1].mean() - y[t == 0].mean())

y1, y0, t = np.array([4, 6, 3, 7]), np.array([2, 6, 5, 3]), np.array([1, 0, 1, 0])
print(observed(y1, y0, t).tolist(), ate_att(y1, y0, t), diff_means(observed(y1, y0, t), t))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 6, 3, 3] (1.0, 0.0) -1.0",
          "[4, 6, 3, 3] (1.0, 0.0) 1.0",
          "[2, 6, 5, 7] (1.0, 0.0) -1.0",
          "[4, 6, 3, 3] (1.0, 1.0) -1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def neyman_var(y, t):
    a, b = y[t == 1], y[t == 0]
    return float(a.var(ddof=1) / len(a) + b.var(ddof=1) / len(b))   # conservative variance estimate

def randomisation_dist(y1, y0, n1, reps, seed=0):
    r, n, out = np.random.default_rng(seed), len(y1), []
    for _ in range(reps):
        t = np.zeros(n, int); t[r.choice(n, n1, replace=False)] = 1
        y = np.where(t == 1, y1, y0)
        out.append(y[t == 1].mean() - y[t == 0].mean())
    return np.array(out)

def aipw(y, t, mu1, mu0, e):
    return float(np.mean(mu1 - mu0 + t * (y - mu1) / e - (1 - t) * (y - mu0) / (1 - e)))

y, t = np.array([3.0, 5, 1, 2]), np.array([1, 1, 0, 0])
print(neyman_var(y, t), aipw(y, t, np.full(4, 4.0), np.full(4, 1.5), np.full(4, 0.5)), aipw(y, t, np.zeros(4), np.zeros(4), np.full(4, 0.5)), round(float(randomisation_dist(np.array([1.0, 2, 3, 4]), np.zeros(4), 2, 2000).mean()), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.25 2.5 2.5 2.5",
          "2.5 2.5 2.5 2.5",
          "1.25 2.5 0.0 2.5",
          "1.25 2.5 2.5 1.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>observed(y1, y0, t)</C>, <C>ate_att(y1, y0, t)</C> returning the pair (ATE, ATT) from the full table, and{" "}
          <C>diff_means(y, t)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def observed(y1, y0, t):
    return y1

def ate_att(y1, y0, t):
    return float(y1.mean() - y0.mean()), float(y1.mean() - y0.mean())

def diff_means(y, t):
    return float(y[t == 1].mean())
`,
        solution: TABLE,
        tests: [
          { name: "obs", code: `assert observed(np.array([1, 2]), np.array([3, 4]), np.array([0, 1])).tolist() == [3, 2]\nassert diff_means(np.array([5, 1, 3]), np.array([1, 0, 0])) == 3` },
          { name: "effects", code: `a, b = ate_att(np.array([2, 5, 1]), np.array([1, 1, 1]), np.array([1, 0, 1]))\nassert abs(a - 5 / 3) < 1e-12 and abs(b - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>neyman_var(y, t)</C>, <C>randomisation_dist(y1, y0, n1, reps, seed)</C> returning the differences in means
          over reps random assignments of exactly n1 treated units, and <C>aipw(y, t, mu1, mu0, e)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def neyman_var(y, t):
    return float(y.var())

def randomisation_dist(y1, y0, n1, reps, seed=0):
    return np.zeros(reps)

def aipw(y, t, mu1, mu0, e):
    return float(np.mean(mu1 - mu0))
`,
        solution: ESTIMATE,
        tests: [
          { name: "neyman", code: `assert abs(neyman_var(np.array([1.0, 3, 2, 6]), np.array([1, 1, 0, 0])) - 5) < 1e-12\nd = randomisation_dist(np.array([1.0, 2, 3, 4]), np.zeros(4), 2, 3000, 1)\nassert len(d) == 3000 and abs(d.mean() - 2.5) < 0.1 and d.std() > 0.5` },
          { name: "aipw", code: `r = np.random.default_rng(3); n = 200000; x = r.integers(0, 2, n); e = 0.2 + 0.6 * x\nt = (r.random(n) < e).astype(int); y = t * (1 + x) + x + r.normal(size=n)\nassert abs(aipw(y, t, np.zeros(n), np.zeros(n), e) - 1.5) < 0.05\nassert abs(aipw(y, t, 1 + 2.0 * x, 1.0 * x, np.full(n, 0.5)) - 1.5) < 0.05` },
        ],
      },
    },
    {
      key: "neyman",
      rung: "stretch",
      prompt: (
        <p>
          For the four units of the first check, two are treated by complete randomisation. Over the six equally likely
          assignments, what is the variance of the difference in observed means (dividing by 6)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.229, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Average effects need only the two column means. Questions about individuals, such as whether this patient would have
        recovered without the drug, need the joint table, which no experiment reveals. The next lesson shows how a structural
        model answers them, and how much of the answer depends on the model rather than the data.
      </p>
    </>
  ),
};
