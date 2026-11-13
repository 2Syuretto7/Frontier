import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ExpectedScoreViz } from "@/components/viz/ExpectedScoreViz";
import type { LessonContent } from "@/lib/types";

const SCORES = `import numpy as np

def log_score(q, y):
    return float(-np.log(q[np.arange(len(y)), y]).mean())

def brier(q, y):
    return float(((q - np.eye(q.shape[1])[y]) ** 2).sum(axis=1).mean())

def expected(score, q, p):
    return sum(p[k] * score(q[None], np.array([k])) for k in range(len(p)))`;

const BEST = `import numpy as np

def abs_score(q, y):
    return float(np.abs(q - np.eye(q.shape[1])[y]).sum(axis=1).mean())

def best_binary(score, p, steps=999):
    qs = np.linspace(0.001, 0.999, steps)
    def exp_score(q):
        f = np.array([[1 - q, q]])
        return (1 - p) * score(f, np.array([0])) + p * score(f, np.array([1]))
    return float(qs[int(np.argmin([exp_score(q) for q in qs]))])`;

export const lesson: LessonContent = {
  id: "l2.8.1",
  minutes: 50,
  links: {
    requires: ["l2.1.4", "l2.2.3"],
    revisits: ["l2.5.3", "l2.1.1"],
    foreshadows: ["l2.8.2"],
  },

  puzzle: (
    <>
      <p>
        You pay a weather forecaster by how close their stated rain probability is to what happened: the penalty is the
        absolute difference between the forecast and 1 if it rains, 0 if not. The forecaster believes the chance of rain is
        70%. What number should they announce to minimise the expected penalty, and what does that say about the payment
        scheme?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A score for probabilistic forecasts should make honesty the best policy: if you believe p, announcing p should
        minimise your expected penalty. The absolute error fails this, because its expected value is a straight line in
        the announced number, so the minimum sits at 0 or 1. Squared error and the negative log probability curve upwards
        on both sides of the truth, so the minimum sits exactly at the belief.
      </p>
      <ExpectedScoreViz />
    </>
  ),

  theory: (
    <>
      <Definition title="proper scoring rule">
        <p>
          A scoring rule assigns a penalty <M>{"S(q, y)"}</M> to the forecast distribution q over K classes when outcome y
          occurs. Its expected value under a distribution p is <M>{"S(q; p) = \\sum_y p_y S(q, y)"}</M>. The rule is proper
          if <M>{"S(p; p) \\leq S(q; p)"}</M> for all p and q, and strictly proper if equality forces q = p. The log score
          is <M>{"-\\log q_y"}</M>; the Brier score is <M>{"\\sum_k (q_k - \\mathbb 1[y = k])^2"}</M>.
        </p>
        <Code>{SCORES}</Code>
      </Definition>

      <Theorem title="the log score is strictly proper">
        <p>
          <M>{"S_{\\log}(q; p) = H(p) + \\mathrm{KL}(p \\,\\Vert\\, q)"}</M>, where{" "}
          <M>{"H(p) = -\\sum_y p_y\\log p_y"}</M>, and the KL term is positive unless q = p.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"-\\sum_y p_y\\log q_y = -\\sum_y p_y\\log p_y + \\sum_y p_y\\log(p_y/q_y)"}</M>. For the second term, use{" "}
          <M>{"\\log t \\leq t - 1"}</M> with equality only at t = 1:{" "}
          <M>{"-\\sum_y p_y\\log(q_y/p_y) \\geq -\\sum_y p_y(q_y/p_y - 1) = 1 - \\sum_{y: p_y > 0} q_y \\geq 0"}</M>, with
          equality only if <M>{"q_y = p_y"}</M> wherever <M>{"p_y > 0"}</M> and q puts no mass elsewhere, that is q = p.
        </p>
      </Proof>

      <Theorem title="the Brier score is strictly proper">
        <MD>{"S_{\\mathrm{Brier}}(q; p) = \\sum_k (q_k - p_k)^2 + \\sum_k p_k(1 - p_k)."}</MD>
      </Theorem>
      <Proof>
        <p>
          For each k, the indicator <M>{"\\mathbb 1[y = k]"}</M> has mean <M>{"p_k"}</M> and variance{" "}
          <M>{"p_k(1 - p_k)"}</M>. The expected square of <M>{"q_k - \\mathbb 1[y = k]"}</M> is its squared mean plus its
          variance, <M>{"(q_k - p_k)^2 + p_k(1 - p_k)"}</M>. Summing over k gives the formula, whose only q-dependent part
          is zero exactly when q = p.
        </p>
        <Code>{BEST}</Code>
      </Proof>

      <Remark title="choosing a score">
        <p>
          The absolute score is improper: for a binary event its expected value is <M>{"2(p(1 - q) + (1 - p)q)"}</M>,
          linear in q, so the code&apos;s search reports 0.999 for p = 0.7 and 0.001 for p = 0.3, while the squared score
          returns the truth. Accuracy, which scores only the most likely class, is not strictly proper either: it cannot
          tell 51% from 99%. The log score is the negative log-likelihood, so fitting by maximum likelihood is minimising a
          proper score; it is unbounded and punishes confident mistakes very hard, which makes it sensitive to a few
          outliers. The Brier score is bounded and gentler. In the code, reporting (0.6, 0.3, 0.1) against the truth (0.5,
          0.3, 0.2) costs 1.0771 − 1.0297 = KL in log score and 0.02 = Σ(q − p)² in Brier score. Every proper score splits
          into a part that measures calibration and a part that measures how sharply forecasts separate outcomes, which
          the next lesson takes up.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "log",
      rung: "check",
      prompt: <p>You forecast 0.8 for an event and it happens. What is your log score, −ln q? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2231, tolerance: 0.0001 },
    },
    {
      key: "brier",
      rung: "check",
      prompt: <p>For a binary event you forecast (no, yes) = (0.3, 0.7), and the event does not happen. What is the Brier score summed over both classes?</p>,
      answer: { kind: "numeric", value: 0.98, tolerance: 0.0001 },
    },
    {
      key: "improper",
      rung: "apply",
      prompt: <p>Why does paying a forecaster by the absolute error |q − y| encourage dishonest forecasts?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its expected value is linear in q, so it is minimised at q = 0 or q = 1 rather than at the forecaster's belief",
          "It is unbounded, so a single mistake can cost too much",
          "It is minimised at q = 0.5 whatever the belief",
          "It does not depend on the outcome",
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

def log_score(q, y):
    return float(-np.log(q[np.arange(len(y)), y]).mean())

def brier(q, y):
    return float(((q - np.eye(q.shape[1])[y]) ** 2).sum(axis=1).mean())

def expected(score, q, p):
    return sum(p[k] * score(q[None], np.array([k])) for k in range(len(p)))

q = np.array([[0.7, 0.2, 0.1], [0.1, 0.1, 0.8]]); y = np.array([0, 2])
print(round(log_score(q, y), 4), round(brier(q, y), 4))
p = np.array([0.5, 0.3, 0.2]); r = np.array([0.6, 0.3, 0.1])
print(round(expected(log_score, p, p), 4), round(expected(log_score, r, p), 4), round(expected(brier, p, p), 2), round(expected(brier, r, p), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.2899 0.1\n1.0297 1.0771 0.62 0.64", "0.2899 0.1\n1.0771 1.0297 0.64 0.62", "0.5798 0.2\n1.0297 1.0771 0.62 0.64", "0.2899 0.1\n1.0297 1.0771 0.62 0.62"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def abs_score(q, y):
    return float(np.abs(q - np.eye(q.shape[1])[y]).sum(axis=1).mean())

def best_binary(score, p, steps=999):
    qs = np.linspace(0.001, 0.999, steps)
    def exp_score(q):
        f = np.array([[1 - q, q]])
        return (1 - p) * score(f, np.array([0])) + p * score(f, np.array([1]))
    return float(qs[int(np.argmin([exp_score(q) for q in qs]))])

sq = lambda q, y: float(((q - np.eye(2)[y]) ** 2).sum(axis=1).mean())
print(round(best_binary(sq, 0.7), 3), round(best_binary(sq, 0.2), 3))
print(round(best_binary(abs_score, 0.7), 3), round(best_binary(abs_score, 0.3), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.7 0.2\n0.999 0.001", "0.7 0.2\n0.7 0.3", "0.999 0.001\n0.999 0.001", "0.7 0.2\n0.001 0.999"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Forecasts are rows of an n-by-K array and labels an integer array. Write <C>log_score(q, y)</C> and{" "}
          <C>brier(q, y)</C>, each returning the mean over rows, and <C>expected(score, q, p)</C>, the expected score of a
          single forecast vector q when the label has distribution p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_score(q, y):
    return 0.0

def brier(q, y):
    return 0.0

def expected(score, q, p):
    return 0.0
`,
        solution: SCORES,
        tests: [
          { name: "scores", code: `q = np.array([[0.5, 0.5], [0.9, 0.1]]); y = np.array([1, 0])
assert abs(log_score(q, y) - (np.log(2) - np.log(0.9)) / 2) < 1e-12 and abs(brier(q, y) - (0.5 + 0.02) / 2) < 1e-12` },
          { name: "expected", code: `p = np.array([0.2, 0.5, 0.3]); q = np.array([0.3, 0.3, 0.4])
assert abs(expected(brier, q, p) - (((q - p) ** 2).sum() + (p * (1 - p)).sum())) < 1e-12
assert abs(expected(log_score, q, p) - expected(log_score, p, p) - (p * np.log(p / q)).sum()) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>abs_score(q, y)</C>, the mean over rows of the summed absolute differences between q and the one-hot
          label, and <C>best_binary(score, p, steps=999)</C>, which searches q on an even grid from 0.001 to 0.999 and returns
          the q for which the report (1 − q, q) has the smallest expected score when the event has probability p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def abs_score(q, y):
    return 0.0

def best_binary(score, p, steps=999):
    return p
`,
        solution: BEST,
        tests: [
          { name: "abs", code: `q = np.array([[0.2, 0.8], [0.6, 0.4]])
assert abs(abs_score(q, np.array([1, 1])) - (0.4 + 1.2) / 2) < 1e-12` },
          { name: "best", code: `lg = lambda q, y: float(-np.log(q[np.arange(len(y)), y]).mean())
assert abs(best_binary(lg, 0.35) - 0.35) < 1e-9 and best_binary(abs_score, 0.6) == 0.999 and best_binary(abs_score, 0.45) == 0.001` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the Brier score Σ_k (q_k − 1[y = k])² is strictly proper: its expected value under y ~ p is uniquely
          minimised over forecasts q at q = p.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes the expectation of (q_k − 1[y = k])² for each k, using that 1[y = k] has mean p_k and variance p_k(1 − p_k), or by expanding the square.",
          "Obtains Σ_k (q_k − p_k)² + Σ_k p_k(1 − p_k), with the second sum independent of q.",
          "Concludes that the minimum is at q = p and is unique because Σ(q_k − p_k)² is zero only there.",
        ],
      },
    },
    {
      key: "expl",
      rung: "stretch",
      prompt: <p>A coin is fair, but you report (0.8, 0.2). What is your expected log score, in nats? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.9163, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a scoring rule proper, why the log and Brier scores are strictly proper while absolute error and accuracy are not, how the log score relates to KL divergence and maximum likelihood, and how the two scores differ in practice.",

  glimpse: (
    <>
      <p>
        A proper score rewards honest probabilities on average, but a single number cannot say what went wrong. Calibration
        asks a sharper question: among all the times the model said 70%, did the event happen 70% of the time?
      </p>
    </>
  ),
};
