import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EnsembleViz } from "@/components/viz/EnsembleViz";
import type { LessonContent } from "@/lib/types";

const AMBIGUITY = `def ensemble_mean(preds):
    return sum(preds) / len(preds)

def ambiguity(preds, y):
    m = ensemble_mean(preds)
    n = len(preds)
    avg_err = sum((p - y) ** 2 for p in preds) / n
    diversity = sum((p - m) ** 2 for p in preds) / n
    return (m - y) ** 2, avg_err, diversity

def averaged_error_var(sigma2, rho, m):
    return rho * sigma2 + (1 - rho) * sigma2 / m`;

const LOGLOSS = `import math

def ensemble_nll(member_probs, label):
    return -math.log(sum(p[label] for p in member_probs) / len(member_probs))

def mean_member_nll(member_probs, label):
    return sum(-math.log(p[label]) for p in member_probs) / len(member_probs)

def majority_vote(member_probs):
    votes = [max(range(len(p)), key=lambda k: p[k]) for p in member_probs]
    return max(sorted(set(votes)), key=votes.count)`;

export const lesson: LessonContent = {
  id: "l7.7.2",
  minutes: 40,
  links: {
    requires: ["l7.7.1", "l2.4.2"],
    revisits: ["l1.5.1", "l2.8.1"],
    foreshadows: ["l7.7.3", "l7.7.4", "l9.2.1"],
  },

  puzzle: (
    <>
      <p>
        Train the same network on the same data five times, changing nothing but the random seed. Each run reaches about the
        same test accuracy. Average their predicted probabilities, and the result is more accurate than any of them, far better
        calibrated, and knows when it is out of its depth. Bagging, the classical recipe for ensembles, resamples the data to
        make members differ; here nothing about the data changed. Where does the gain come from, and how many runs is it worth?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A deep network&apos;s loss has many good minima that compute genuinely different functions. Different random starts and
        data orders lead to different ones. Near the training data these functions are forced to agree; away from it nothing
        pins them down, so they disagree. Averaging cancels the parts of their errors that differ and keeps the parts they
        share, and the disagreement itself is a measure of epistemic uncertainty.
      </p>
      <EnsembleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="deep ensemble">
        <p>
          Train M networks independently on the same data with different random initialisations and data orders, each with a
          proper scoring rule such as the negative log-likelihood (l2.8.1). Predict with the average of their predictive
          distributions, <M>{"p(y \\mid x) = \\tfrac1M \\sum_m p(y \\mid x, \\theta_m)"}</M>. For classification this averages
          class probabilities; for regression with Gaussian heads it is a mixture whose variance splits into aleatoric and
          epistemic parts as in l7.7.1.
        </p>
      </Definition>

      <Theorem title="ambiguity decomposition">
        <p>For predictions <M>{"f_1, \\dots, f_M"}</M> with mean <M>{"\\bar f"}</M> and a target y,</p>
        <MD>{"(\\bar f - y)^2 = \\frac1M \\sum_m (f_m - y)^2 - \\frac1M \\sum_m (f_m - \\bar f)^2 ."}</MD>
        <p>The ensemble is never worse than the average member, and better by exactly the diversity.</p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"f_m - y = (f_m - \\bar f) + (\\bar f - y)"}</M>, square and average over m. The cross term is{" "}
          <M>{"2(\\bar f - y) \\cdot \\tfrac1M \\sum_m (f_m - \\bar f) = 0"}</M>, leaving the average squared error as the
          diversity plus <M>{"(\\bar f - y)^2"}</M> (<C>ambiguity</C>). The diversity is not free: pushing members apart
          tends to raise their individual errors, which is why ensembles are built from members that are each as good as
          possible and differ only where the data do not decide.
        </p>
        <Code>{AMBIGUITY}</Code>
      </Proof>

      <Theorem title="correlated errors">
        <p>
          If each member&apos;s error has variance <M>{"\\sigma^2"}</M> and every pair has correlation ρ, the error of the
          average has variance
        </p>
        <MD>{"\\rho\\, \\sigma^2 + \\frac{1 - \\rho}{M}\\, \\sigma^2 ."}</MD>
      </Theorem>
      <Proof>
        <p>
          The variance of a sum is the sum of all M² covariances: M variances <M>{"\\sigma^2"}</M> and{" "}
          <M>{"M(M-1)"}</M> covariances <M>{"\\rho \\sigma^2"}</M>. Divide by M² (<C>averaged_error_var</C>). The shared
          part <M>{"\\rho \\sigma^2"}</M> never averages away, and the rest falls like 1/M, so returns diminish quickly: in
          practice five to ten members capture most of the gain, as in the bias and variance picture of l1.5.1.
        </p>
      </Proof>

      <Theorem title="ensembles and log-loss">
        <p>
          The negative log-likelihood of the averaged prediction is at most the average of the members&apos; negative
          log-likelihoods.
        </p>
      </Theorem>
      <Proof>
        <p>
          The function <M>{"-\\log"}</M> is convex, so by Jensen&apos;s inequality{" "}
          <M>{"-\\log \\tfrac1M \\sum_m p_m \\le \\tfrac1M \\sum_m (-\\log p_m)"}</M>, where <M>{"p_m"}</M> is the
          probability member m gives to the true label (<C>ensemble_nll</C>, <C>mean_member_nll</C>). The gap is largest
          when one member is confidently wrong and another is not: averaging rescues the example from an enormous loss.
          Averaging probabilities differs from a majority vote (<C>majority_vote</C>), which discards confidence and can pick
          a different class.
        </p>
        <Code>{LOGLOSS}</Code>
      </Proof>

      <Remark title="why random seeds suffice">
        <p>
          Lakshminarayanan, Pritzel and Blundell (2017) found that random initialisation alone gives enough diversity, and
          that bagging makes deep ensembles worse: each bootstrap sample omits about a third of the distinct examples (l2.4.2),
          which hurts a data-hungry network more than the extra diversity helps. Fort, Hu and Lakshminarayanan (2019) showed
          that independently trained networks land in different modes that disagree on many test inputs, while samples near a
          single mode barely differ. This is also why one cannot average the <em>weights</em> of independently trained
          networks, whereas averaging weights along one training run, as in stochastic weight averaging, works.
        </p>
      </Remark>

      <Remark title="cost">
        <p>
          An ensemble costs M times as much to train, store and run. Cheaper relatives share work: snapshot ensembles collect
          members along one run with a cyclic learning rate, BatchEnsemble gives members a shared weight matrix times rank-one
          factors, and Monte Carlo dropout (l7.7.3) samples sub-networks of one model. Distilling an ensemble into a single
          student (l9.2.1) keeps much of the accuracy but loses the disagreement, and with it the epistemic signal, unless the
          student is trained to predict the spread too.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "jensen",
      rung: "check",
      prompt: <p>Three members give the true label probabilities 0.6, 0.9 and 0.3. By how much is the ensemble&apos;s negative log-likelihood below the members&apos; average? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0959, tolerance: 0.0001 },
    },
    {
      key: "corr",
      rung: "check",
      prompt: <p>Five members have error variance 2 and pairwise error correlation 0.5. What is the variance of the averaged error? Give two decimals.</p>,
      answer: { kind: "numeric", value: 1.2, tolerance: 0.01 },
    },
    {
      key: "bag",
      rung: "apply",
      prompt: <p>Why do deep ensembles usually train every member on the full data set rather than on bootstrap resamples?</p>,
      answer: {
        kind: "choice",
        options: [
          "Different random starts already reach different modes, and dropping about a third of the distinct examples hurts each member more than the extra diversity helps",
          "Bootstrap resampling makes the members identical",
          "Averaging probabilities is only valid when all members saw the same data",
          "Bagging cannot be used with stochastic gradient descent",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ensemble_mean(preds):
    return sum(preds) / len(preds)

def ambiguity(preds, y):
    m = ensemble_mean(preds)
    n = len(preds)
    avg_err = sum((p - y) ** 2 for p in preds) / n
    diversity = sum((p - m) ** 2 for p in preds) / n
    return (m - y) ** 2, avg_err, diversity

def averaged_error_var(sigma2, rho, m):
    return rho * sigma2 + (1 - rho) * sigma2 / m

print(ambiguity([1, 3], 2), ambiguity([2, 2, 5], 2))
print(averaged_error_var(1.0, 0.0, 4), averaged_error_var(2.0, 1.0, 10), averaged_error_var(1.0, 0.5, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.0, 1.0, 1.0) (1.0, 3.0, 2.0)\n0.25 2.0 0.6",
          "(0.0, 1.0, 1.0) (1.0, 3.0, 2.0)\n0.25 0.2 0.6",
          "(0.0, 1.0, 0.0) (1.0, 3.0, 2.0)\n0.25 2.0 0.6",
          "(1.0, 1.0, 1.0) (1.0, 3.0, 2.0)\n1.0 2.0 0.6",
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

def ensemble_nll(member_probs, label):
    return -math.log(sum(p[label] for p in member_probs) / len(member_probs))

def mean_member_nll(member_probs, label):
    return sum(-math.log(p[label]) for p in member_probs) / len(member_probs)

def majority_vote(member_probs):
    votes = [max(range(len(p)), key=lambda k: p[k]) for p in member_probs]
    return max(sorted(set(votes)), key=votes.count)

P = [[0.4, 0.6], [0.45, 0.55], [1.0, 0.0]]
print(majority_vote(P), round(ensemble_nll(P, 0), 4), round(ensemble_nll(P, 1), 4), round(mean_member_nll([[0.5, 0.5], [0.8, 0.2]], 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 0.4834 0.9589 1.1513",
          "0 0.4834 0.9589 1.1513",
          "1 0.9589 0.4834 1.1513",
          "1 0.4834 0.9589 1.0498",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ensemble_mean(preds)</C>, <C>ambiguity(preds, y)</C>, returning the ensemble&apos;s squared error, the
          average member&apos;s squared error and the diversity, and <C>averaged_error_var(sigma2, rho, m)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ensemble_mean(preds):
    return preds[0]

def ambiguity(preds, y):
    return 0.0, 0.0, 0.0

def averaged_error_var(sigma2, rho, m):
    return sigma2
`,
        solution: AMBIGUITY,
        tests: [
          { name: "decomposition", code: `e, a, d = ambiguity([0, 4, 5], 1); assert abs(e - 4.0) < 1e-12 and abs(a - 26 / 3) < 1e-12 and abs(e - (a - d)) < 1e-12
assert ensemble_mean([1, 2, 6]) == 3 and ambiguity([7, 7], 7) == (0, 0, 0)` },
          { name: "correlation", code: `assert abs(averaged_error_var(4.0, 0.25, 3) - 2.0) < 1e-12 and abs(averaged_error_var(3.0, 0.0, 6) - 0.5) < 1e-12 and abs(averaged_error_var(1.5, 1.0, 9) - 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ensemble_nll(member_probs, label)</C>, <C>mean_member_nll(member_probs, label)</C> and{" "}
          <C>majority_vote(member_probs)</C>, which returns the class most members rank first, breaking ties towards the
          smaller class index.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ensemble_nll(member_probs, label):
    return 0.0

def mean_member_nll(member_probs, label):
    return 0.0

def majority_vote(member_probs):
    return 0
`,
        solution: LOGLOSS,
        tests: [
          { name: "log-losses", code: `P = [[0.2, 0.8], [0.6, 0.4]]
assert abs(ensemble_nll(P, 1) + math.log(0.6)) < 1e-12 and abs(mean_member_nll(P, 1) + 0.5 * math.log(0.32)) < 1e-12 and ensemble_nll(P, 1) <= mean_member_nll(P, 1)` },
          { name: "voting", code: `assert majority_vote([[0.1, 0.9], [0.3, 0.7], [0.9, 0.1]]) == 1 and majority_vote([[0.1, 0.2, 0.7], [0.2, 0.5, 0.3]]) == 1 and majority_vote([[0.6, 0.4], [0.3, 0.7]]) == 0` },
        ],
      },
    },
    {
      key: "members",
      rung: "stretch",
      prompt: (
        <p>
          Members&apos; errors have equal variance and pairwise correlation 0.25. What is the smallest ensemble size whose
          averaged error variance is within 10% of the limit reached by an infinitely large ensemble?
        </p>
      ),
      answer: { kind: "numeric", value: 30, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        An ensemble is a handful of points standing in for a whole distribution over weights. The next lesson approaches
        that distribution directly: the Laplace approximation, variational inference over weights, Monte Carlo dropout and
        stochastic-gradient sampling, each a different trade between faithfulness and cost.
      </p>
    </>
  ),
};
