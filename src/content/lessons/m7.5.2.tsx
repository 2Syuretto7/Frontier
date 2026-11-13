import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CorrScatterViz } from "@/components/viz/CorrScatterViz";
import type { LessonContent } from "@/lib/types";

const COV = `import numpy as np

def cov(x, y):
    return float(np.mean((x - x.mean()) * (y - y.mean())))

def corr(x, y):
    return cov(x, y) / float(np.sqrt(cov(x, x) * cov(y, y)))

def best_line(x, y):
    b = cov(x, y) / cov(x, x)
    return float(y.mean() - b * x.mean()), b`;

const BILIN = `def cov_from_joint(xs, ys, J):
    ex = sum(J[i][j] * xs[i] for i in range(len(xs)) for j in range(len(ys)))
    ey = sum(J[i][j] * ys[j] for i in range(len(xs)) for j in range(len(ys)))
    exy = sum(J[i][j] * xs[i] * ys[j] for i in range(len(xs)) for j in range(len(ys)))
    return exy - ex * ey

def var_of_combination(a, S):
    return sum(a[i] * a[j] * S[i][j] for i in range(len(a)) for j in range(len(a)))`;

export const lesson: LessonContent = {
  id: "m7.5.2",
  minutes: 55,
  links: {
    requires: ["m7.5.1", "m7.2.4"],
    revisits: ["m3.5.3", "l1.2.1"],
    foreshadows: ["m7.5.3", "m7.6.3", "m9.6.1"],
  },

  puzzle: (
    <>
      <p>
        X is a standard normal and Y = X². Y is completely determined by X, yet their correlation is exactly zero. What,
        then, does a correlation coefficient actually measure, and why can it never exceed 1 in size?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Covariance measures whether X and Y tend to be above their means together: positive when they move together,
        negative when they move oppositely. Divided by the two standard deviations it becomes the correlation, a number in
        [−1, 1] that measures how well a straight line, and only a straight line, describes the relationship. For Y = X²,
        the points with negative X cancel those with positive X.
      </p>
      <CorrScatterViz />
    </>
  ),

  theory: (
    <>
      <Definition title="covariance and correlation">
        <p>
          <M>{"\\operatorname{Cov}(X, Y) = E[(X - EX)(Y - EY)] = E[XY] - E[X]E[Y]"}</M>, and, for positive variances,{" "}
          <M>{"\\rho(X, Y) = \\operatorname{Cov}(X, Y)/(\\sigma_X\\sigma_Y)"}</M>.
        </p>
      </Definition>

      <Theorem title="covariance is bilinear">
        <p>
          Cov is symmetric, Cov(X, X) = Var(X), Cov(X, c) = 0 for constants c, and{" "}
          <M>{"\\operatorname{Cov}(\\sum_i a_iX_i, \\sum_j b_jY_j) = \\sum_{i,j}a_ib_j\\operatorname{Cov}(X_i, Y_j)"}</M>. In
          particular <M>{"\\operatorname{Var}(\\sum a_iX_i) = \\sum_{i,j}a_ia_j\\operatorname{Cov}(X_i, X_j)"}</M>. Independent
          variables have covariance 0, but not conversely.
        </p>
      </Theorem>
      <Proof>
        <p>
          Using <M>{"\\operatorname{Cov}(X, Y) = E[XY] - E[X]E[Y]"}</M>, linearity of expectation in each argument gives
          bilinearity; the rest are special cases. Independence gives E[XY] = E[X]E[Y]. For the converse failure, with X
          symmetric about 0 and finite third moment, <M>{"\\operatorname{Cov}(X, X^2) = E[X^3] - E[X]E[X^2] = 0"}</M>.
        </p>
        <Code>{BILIN}</Code>
      </Proof>

      <Theorem title="correlation lies in [−1, 1]">
        <p>
          <M>{"|\\operatorname{Cov}(X, Y)| \\le \\sigma_X\\sigma_Y"}</M>, so |ρ| ≤ 1, and |ρ| = 1 exactly when Y = a + bX with
          probability 1 for some constants a and b ≠ 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          For every real t, <M>{"0 \\le \\operatorname{Var}(Y - tX) = \\sigma_Y^2 - 2t\\operatorname{Cov}(X, Y) + t^2\\sigma_X^2"}</M>.
          A quadratic in t that is never negative has discriminant at most 0:{" "}
          <M>{"4\\operatorname{Cov}^2 - 4\\sigma_X^2\\sigma_Y^2 \\le 0"}</M>. Equality means the quadratic has a root t, so
          Var(Y − tX) = 0 and Y − tX is constant with probability 1.
        </p>
      </Proof>

      <Theorem title="the best linear predictor">
        <p>
          Over all constants a, b, <M>{"E[(Y - a - bX)^2]"}</M> is minimised by{" "}
          <M>{"b = \\operatorname{Cov}(X, Y)/\\operatorname{Var}(X)"}</M> and <M>{"a = E[Y] - bE[X]"}</M>, and the minimum is{" "}
          <M>{"(1 - \\rho^2)\\operatorname{Var}(Y)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For fixed b, <M>{"E[(W - a)^2]"}</M> with W = Y − bX is smallest at a = E[W], leaving Var(Y − bX) ={" "}
          <M>{"\\sigma_Y^2 - 2b\\operatorname{Cov} + b^2\\sigma_X^2"}</M>, a quadratic in b minimised at{" "}
          <M>{"b = \\operatorname{Cov}/\\sigma_X^2"}</M>, where it equals <M>{"\\sigma_Y^2 - \\operatorname{Cov}^2/\\sigma_X^2 = \\sigma_Y^2(1 - \\rho^2)"}</M>.
        </p>
        <Code>{COV}</Code>
      </Proof>
      <p>
        So ρ² is the fraction of the variance of Y that the best straight line explains. This is the population version of
        least-squares regression with one feature.
      </p>

      <Example title="negative covariance by indicators">
        <p>
          Roll a die n times, and let <M>{"N_1, N_2"}</M> count ones and twos. Writing <M>{"N_1 = \\sum_k A_k"}</M> and{" "}
          <M>{"N_2 = \\sum_k B_k"}</M> with indicators for roll k, bilinearity gives{" "}
          <M>{"\\operatorname{Cov}(N_1, N_2) = \\sum_{k,l}\\operatorname{Cov}(A_k, B_l)"}</M>. Different rolls are independent,
          and on the same roll <M>{"A_kB_k = 0"}</M>, so each diagonal term is <M>{"0 - \\frac16\\cdot\\frac16"}</M>. Hence{" "}
          <M>{"\\operatorname{Cov}(N_1, N_2) = -n/36"}</M>: counts in a multinomial compete for the same trials.
        </p>
      </Example>

      <Remark title="reading correlations">
        <p>
          Correlation is unchanged by positive affine rescaling of either variable, flips sign under a negative one, is
          sensitive to a few outliers, and says nothing about causation or about non-linear dependence. A scatter plot is
          worth checking before trusting any single number.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rho",
      rung: "check",
      prompt: <p>Var(X) = 4, Var(Y) = 9 and Cov(X, Y) = 3. What is the correlation of X and Y?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "combo",
      rung: "check",
      prompt: <p>Var(X) = Var(Y) = 1 and Cov(X, Y) = 0.5. What is Var(X − 2Y)?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "true",
      rung: "apply",
      prompt: <p>Which statement is true for random variables with finite variances?</p>,
      answer: {
        kind: "choice",
        options: [
          "If Cov(X, Y) = 0, then Var(X + Y) = Var(X) + Var(Y).",
          "If Cov(X, Y) = 0, then X and Y are independent.",
          "ρ(2X, −3Y) = ρ(X, Y).",
          "If ρ(X, Y) = 0.9, then changing X causes Y to change.",
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

def cov(x, y):
    return float(np.mean((x - x.mean()) * (y - y.mean())))

def corr(x, y):
    return cov(x, y) / float(np.sqrt(cov(x, x) * cov(y, y)))

def best_line(x, y):
    b = cov(x, y) / cov(x, x)
    return float(y.mean() - b * x.mean()), b

x = np.array([1.0, 2.0, 3.0, 4.0])
print(cov(x, 2 * x + 1), corr(x, 2 * x + 1), corr(x, -x))
print(best_line(x, np.array([2.0, 4.0, 5.0, 9.0])), round(corr(np.array([-1.0, 0.0, 1.0]), np.array([1.0, 0.0, 1.0])), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.5 1.0 -1.0\n(-0.5, 2.2) 0.0",
          "3.3333333333333335 1.0 -1.0\n(-0.5, 2.2) 0.0",
          "2.5 1.0 -1.0\n(2.2, -0.5) 0.0",
          "2.5 1.0 -1.0\n(-0.5, 2.2) 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cov_from_joint(xs, ys, J):
    ex = sum(J[i][j] * xs[i] for i in range(len(xs)) for j in range(len(ys)))
    ey = sum(J[i][j] * ys[j] for i in range(len(xs)) for j in range(len(ys)))
    exy = sum(J[i][j] * xs[i] * ys[j] for i in range(len(xs)) for j in range(len(ys)))
    return exy - ex * ey

def var_of_combination(a, S):
    return sum(a[i] * a[j] * S[i][j] for i in range(len(a)) for j in range(len(a)))

print(round(cov_from_joint([0, 1], [0, 1, 2], [[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]]), 4))
S = [[1.0, 0.5], [0.5, 2.0]]
print(var_of_combination([1, 1], S), var_of_combination([1, -1], S), var_of_combination([2, 0], S))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["-0.04\n4.0 2.0 4.0", "0.04\n4.0 2.0 4.0", "-0.04\n3.0 2.0 4.0", "-0.04\n4.0 3.0 2.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For two equal-length arrays treated as a whole population (divide by n), write <C>cov(x, y)</C>, <C>corr(x, y)</C>{" "}
          and <C>best_line(x, y)</C>, returning the intercept and slope (a, b) of the best linear predictor of y from x. Return
          Python floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cov(x, y):
    return 0.0

def corr(x, y):
    return 0.0

def best_line(x, y):
    return 0.0, 0.0
`,
        solution: COV,
        tests: [
          { name: "cov and corr", code: `x = np.array([1.0, 2.0, 3.0, 4.0])
assert abs(cov(x, 2 * x + 1) - 2.5) < 1e-12 and abs(corr(x, -3 * x + 2) + 1) < 1e-12
assert abs(corr(np.array([-1.0, 0.0, 1.0]), np.array([1.0, 0.0, 1.0]))) < 1e-12
z = np.random.default_rng(0).normal(size=(2, 200000))
assert abs(corr(z[0], 0.6 * z[0] + 0.8 * z[1]) - 0.6) < 0.01` },
          { name: "best line", code: `a, b = best_line(np.array([1.0, 2.0, 3.0, 4.0]), np.array([2.0, 4.0, 5.0, 9.0]))
assert abs(a + 0.5) < 1e-12 and abs(b - 2.2) < 1e-12
x = np.random.default_rng(1).normal(size=1000); y = 3 - 2 * x
a, b = best_line(x, y)
assert abs(a - 3) < 1e-9 and abs(b + 2) < 1e-9 and isinstance(a, float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cov_from_joint(xs, ys, J)</C>, the covariance of X and Y from a joint pmf table J[i][j] = P(X = xs[i], Y =
          ys[j]), and <C>var_of_combination(a, S)</C>, the variance of Σ aᵢXᵢ given the covariance matrix S as nested lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cov_from_joint(xs, ys, J):
    return 0.0

def var_of_combination(a, S):
    return 0.0
`,
        solution: BILIN,
        tests: [
          { name: "joint", code: `assert abs(cov_from_joint([0, 1], [0, 1, 2], [[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]]) + 0.04) < 1e-12
assert abs(cov_from_joint([1, 2], [5, 7], [[0.06, 0.14], [0.24, 0.56]])) < 1e-12
assert abs(cov_from_joint([-1, 1], [-1, 1], [[0.5, 0.0], [0.0, 0.5]]) - 1) < 1e-12` },
          { name: "combinations", code: `S = [[1.0, 0.5], [0.5, 2.0]]
assert var_of_combination([1, 1], S) == 4.0 and var_of_combination([1, -1], S) == 2.0
S3 = [[1, 0, 0], [0, 4, 1], [0, 1, 9]]
assert var_of_combination([1, 2, 3], S3) == 1 + 16 + 81 + 2 * 6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for random variables with positive finite variances, |ρ(X, Y)| ≤ 1.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers Var(Y − tX) (or a similar combination) and notes it is non-negative for every real t.",
          "Expands it as σ_Y² − 2t·Cov(X, Y) + t²σ_X², a quadratic in t.",
          "Uses that a non-negative quadratic has non-positive discriminant (or substitutes t = Cov/σ_X²) to get Cov² ≤ σ_X²σ_Y², hence |ρ| ≤ 1.",
        ],
      },
    },
    {
      key: "multinom",
      rung: "stretch",
      prompt: <p>A die is rolled 10 times. What is the covariance of the number of ones and the number of twos? Give four decimal places.</p>,
      answer: { kind: "numeric", value: -0.2778, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what covariance and correlation measure, why the correlation is always between −1 and 1, what the best straight-line predictor is and how much variance it explains, and why zero correlation does not mean independence.",

  glimpse: (
    <>
      <p>
        With more than two variables the covariances form a matrix, which is symmetric and positive semidefinite: the next
        lesson puts the linear algebra of the previous course to work on it. In statistics, the sample versions of these
        quantities estimate the population ones, and regression generalises the best linear predictor to many features.
      </p>
    </>
  ),
};
