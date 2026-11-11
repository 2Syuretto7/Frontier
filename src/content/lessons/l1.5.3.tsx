import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { RegPathViz } from "@/components/viz/RegPathViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.5.3",
  minutes: 60,
  links: {
    requires: ["l1.2.1", "l1.5.1"],
    revisits: ["l1.2.2"],
    parallels: ["m3.7.5", "m3.5.3"],
    foreshadows: ["l2.1.3", "l3.7.1"],
  },

  puzzle: (
    <>
      <p>
        A model predicts house prices from 50 features using 60 houses. Least squares fits the training data almost perfectly
        and gives some features enormous coefficients, one large and positive, a near-duplicate of it large and negative.
      </p>
      <p>
        You suspect most of the 50 features do not matter. Could you change the fitting objective so that it prefers small
        coefficients, or even prefers to switch features off entirely?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Add a price for large coefficients to the loss. <strong>Ridge</strong> charges the sum of their squares;{" "}
        <strong>lasso</strong> charges the sum of their absolute values. A strength <M>{"\\lambda"}</M> sets how much the
        price matters compared with fitting the data. Raising it accepts some bias to cut variance, the trade from the last
        two lessons, now on a dial.
      </p>
      <RegPathViz />
      <p>
        The two penalties behave differently. Ridge shrinks every coefficient smoothly and shares weight between correlated
        features. Lasso drives coefficients to exactly zero, one by one, so it also selects features.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="ridge and lasso">
        <p>
          For features <M>X</M> (an <M>{"n \\times d"}</M> matrix) and targets <M>y</M>, with <M>{"\\lambda \\ge 0"}</M>:
        </p>
        <MD>{"\\text{ridge:}\\ \\min_w \\tfrac12\\lVert y - Xw \\rVert^2 + \\tfrac{\\lambda}{2}\\lVert w \\rVert_2^2, \\qquad \\text{lasso:}\\ \\min_w \\tfrac12\\lVert y - Xw \\rVert^2 + \\lambda \\lVert w \\rVert_1 ,"}</MD>
        <p>
          where <M>{"\\lVert w \\rVert_1 = \\sum_j |w_j|"}</M>. The intercept is not penalised, and features are standardised
          first, since otherwise the penalty would depend on their units.
        </p>
      </Definition>

      <Theorem title="ridge always has a unique solution">
        <p>
          For <M>{"\\lambda > 0"}</M>, the ridge solution is <M>{"w = (X^\\top X + \\lambda I)^{-1} X^\\top y"}</M>, and the
          inverse always exists, even when <M>{"d > n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Setting the gradient <M>{"-X^\\top(y - Xw) + \\lambda w"}</M> to zero gives{" "}
          <M>{"(X^\\top X + \\lambda I)w = X^\\top y"}</M>. For any non-zero <M>v</M>,
        </p>
        <MD>{"v^\\top (X^\\top X + \\lambda I) v = \\lVert Xv \\rVert^2 + \\lambda \\lVert v \\rVert^2 > 0,"}</MD>
        <p>
          so the matrix sends no non-zero vector to zero, and is invertible. The objective is strictly convex, so this
          stationary point is the unique minimum.
        </p>
      </Proof>

      <Theorem title="the orthonormal case">
        <p>
          If <M>{"X^\\top X = I"}</M> and <M>{"z = X^\\top y"}</M> is the least-squares solution, then
        </p>
        <MD>{"w^{\\text{ridge}}_j = \\frac{z_j}{1 + \\lambda}, \\qquad w^{\\text{lasso}}_j = \\operatorname{sign}(z_j)\\max(|z_j| - \\lambda,\\ 0)."}</MD>
      </Theorem>
      <p>
        Ridge scales every coefficient by the same factor and never reaches zero. Lasso subtracts <M>{"\\lambda"}</M> from
        each size and stops at zero, called <strong>soft thresholding</strong>. You will derive the lasso formula in the
        practice.
      </p>

      <Example title="the formulas in use">
        <p>
          With <M>{"z_j = 3"}</M> and <M>{"\\lambda = 0.5"}</M>, ridge gives <M>{"3/1.5 = 2"}</M> and lasso gives{" "}
          <M>{"3 - 0.5 = 2.5"}</M>. With <M>{"z_j = -0.4"}</M>, lasso gives exactly 0, while ridge gives about{" "}
          <M>{"-0.27"}</M>.
        </p>
      </Example>

      <Remark title="why corners make zeros">
        <p>
          Equivalently, ridge minimises the squared error subject to <M>{"\\lVert w \\rVert_2 \\le t"}</M>, a disc, and lasso
          subject to <M>{"\\lVert w \\rVert_1 \\le t"}</M>, a diamond whose corners lie on the axes. The first point where the
          error&rsquo;s elliptical contours touch a diamond is very often a corner, where some coefficients are zero. A disc has
          no corners.
        </p>
      </Remark>

      <Remark title="setting the strength">
        <p>
          <M>{"\\lambda"}</M> is a hyperparameter: choose it by cross-validation, usually over a grid spaced evenly in{" "}
          <M>{"\\log \\lambda"}</M>. In neural networks the ridge penalty is called <strong>weight decay</strong>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "zeros",
      rung: "check",
      prompt: <p>Which penalty can set coefficients exactly to zero at moderate strength?</p>,
      answer: { kind: "choice", options: ["Lasso", "Ridge", "Both", "Neither"], correct: [0] },
    },
    {
      key: "std",
      rung: "check",
      prompt: <p>Why are features standardised before fitting ridge or lasso?</p>,
      answer: { kind: "choice", options: ["So the penalty treats every feature equally, whatever its units", "So the model trains faster", "Because the penalty needs positive features"], correct: [0] },
    },
    {
      key: "ridge",
      rung: "apply",
      prompt: <p>With orthonormal features, a least-squares coefficient is 3. What is the ridge coefficient with <M>{"\\lambda = 0.5"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "lasso",
      rung: "apply",
      prompt: <p>Same setting: what is the lasso coefficient with <M>{"\\lambda = 0.5"}</M>?</p>,
      answer: { kind: "numeric", value: 2.5 },
    },
    {
      key: "lassozero",
      rung: "apply",
      prompt: <p>A least-squares coefficient is <M>{"-0.4"}</M>. What is the lasso coefficient with <M>{"\\lambda = 0.5"}</M>?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from sklearn.linear_model import Lasso, Ridge
rng = np.random.default_rng(0)
X = rng.normal(size=(100, 5)); y = 3 * X[:, 0] + rng.normal(0, 0.1, 100)
print(int((Lasso(alpha=0.1).fit(X, y).coef_ == 0).sum()), int((Ridge(alpha=10).fit(X, y).coef_ == 0).sum()))`}</Code>
          <p>Lasso sets coefficients exactly to zero; ridge shrinks them. How many zero coefficients does each have?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 0", "0 4", "4 4", "5 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>ridge(X, y, lam)</C>, the closed-form ridge solution w = (XᵀX + λI)⁻¹Xᵀy with no intercept, using <C>np.linalg.solve</C>. Larger λ shrinks w towards zero.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ridge(X, y, lam):
    return np.linalg.solve(X.T @ X, X.T @ y)
`,
        solution: `import numpy as np

def ridge(X, y, lam):
    return np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)
`,
        tests: [
          { name: "sklearn", code: `import numpy as np
from sklearn.linear_model import Ridge
rng = np.random.default_rng(0)
X = rng.normal(size=(50, 4)); y = X @ [1, 2, 0, -1] + rng.normal(0, 0.5, 50)
assert np.allclose(ridge(X, y, 5.0), Ridge(alpha=5.0, fit_intercept=False).fit(X, y).coef_), 'Add λ to the diagonal of XᵀX.'` },
          { name: "shrinks", code: `import numpy as np
rng = np.random.default_rng(1)
X = rng.normal(size=(50, 4)); y = X @ [1, 2, 0, -1]
assert np.linalg.norm(ridge(X, y, 100.0)) < np.linalg.norm(ridge(X, y, 0.1)), 'More regularisation, smaller weights.'` },
        ],
      },
    },
    {
      key: "soft",
      rung: "prove",
      prompt: (
        <p>
          Show that the minimiser of <M>{"\\tfrac12(w - z)^2 + \\lambda|w|"}</M> over real <M>w</M>, for <M>{"\\lambda > 0"}</M>, is{" "}
          <M>{"\\operatorname{sign}(z)\\max(|z| - \\lambda, 0)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "On w > 0, the derivative is w − z + λ, so a minimiser there is w = z − λ, which is valid only when z > λ.",
          "On w < 0, symmetrically, w = z + λ, valid only when z < −λ.",
          "When |z| ≤ λ, shows the function is decreasing for w < 0 and increasing for w > 0, so the minimum is at w = 0.",
          "Combines the cases into sign(z) max(|z| − λ, 0), noting the objective is convex so the minimiser is unique.",
        ],
      },
    },
    {
      key: "oned",
      rung: "stretch",
      prompt: (
        <p>
          With one feature and no intercept, data <M>{"x = (1, 2, 3)"}</M> and <M>{"y = (2, 4, 7)"}</M>, minimise{" "}
          <M>{"\\tfrac12\\sum_i (y_i - w x_i)^2 + \\tfrac12 w^2"}</M>. What is <M>w</M>? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 31 / 15, tolerance: 0.0003 },
    },
  ],

  teachBack:
    "Explain to a friend what ridge and lasso add to least squares, why lasso produces exact zeros and ridge does not, and how you would choose λ.",

  glimpse: (
    <p>
      Next, how to search for <M>{"\\lambda"}</M> and every other setting efficiently. Statistical Machine Learning reveals ridge
      as a Gaussian prior on the weights and lasso as a Laplace prior, and Neural Networks from Scratch shows why weight decay
      behaves differently inside the Adam optimiser.
    </p>
  ),
};
