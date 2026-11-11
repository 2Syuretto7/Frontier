import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { PolyFeaturesViz } from "@/components/viz/PolyFeaturesViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.2.3",
  minutes: 45,
  links: {
    revisits: ["l1.2.1", "l1.1.3"],
    parallels: ["m0.3.3", "m0.7.4"],
    foreshadows: ["l2.3.2", "l3.1.2"],
  },

  puzzle: (
    <>
      <p>
        A car uses the most fuel per kilometre in slow city traffic and at high motorway speeds, and the least at moderate
        speeds. Fuel use against speed is a U shape.
      </p>
      <p>
        Linear regression fits straight lines. Without inventing a new method, how could you get least squares to fit a U?
        Hint: you are free to choose what the features are.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give the model a second feature, the square of the speed. The prediction <M>{"w_0 + w_1 x + w_2 x^2"}</M> is a
        parabola in <M>x</M>, but it is still a weighted sum of features, so least squares fits it exactly as before. Curves
        come from the features, not from a new algorithm.
      </p>
      <PolyFeaturesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="feature maps">
        <p>
          A <strong>feature map</strong> <M>{"\\varphi"}</M> turns a raw input into a list of features, and the model is
          linear in those features:
        </p>
        <MD>{"\\hat y = w^\\top \\varphi(x), \\qquad \\varphi(x) = (1, x, x^2, \\ldots, x^k) \\text{ for polynomial features.}"}</MD>
        <p>
          The model is <strong>linear in the weights</strong> <M>w</M>, though not in <M>x</M>, so the normal equations still
          give the best weights, with <M>{"\\varphi(x_i)"}</M> as the rows of the feature matrix.
        </p>
      </Definition>

      <Definition title="interactions">
        <p>
          With several raw inputs, polynomial features include products such as <M>{"x_1 x_2"}</M>, called{" "}
          <strong>interactions</strong>, which let the effect of one input depend on another. The number of monomials of
          degree at most <M>k</M> in <M>d</M> variables, including the constant, is
        </p>
        <MD>{"\\binom{d + k}{k},"}</MD>
        <p>which grows quickly: degree 3 in 10 variables already gives 286 features.</p>
      </Definition>

      <Example title="evaluating a fitted curve">
        <p>
          With weights <M>{"(2, 3, -1)"}</M> on the features <M>{"(1, x, x^2)"}</M>, the prediction at <M>{"x = 2"}</M> is{" "}
          <M>{"2 + 3 \\cdot 2 - 1 \\cdot 4 = 4"}</M>. Before fitting, it is wise to scale <M>x</M> to a small range such as
          0 to 1, as the visualisation does by dividing speed by 100. Otherwise <M>{"x^4"}</M> for speeds near 100 is a
          hundred million, and the normal equations become numerically fragile.
        </p>
      </Example>

      <Remark title="power and danger">
        <p>
          Rich features make linear models flexible, which brings back overfitting: the degree is a hyperparameter to choose
          on validation data. Polynomials are also dangerous outside the range of the data, where high powers grow without
          limit; a model trained on speeds from 20 to 120 km/h says nothing reliable about 200. Kernel methods take the idea of
          feature maps to infinitely many features, and neural networks go further still: they <em>learn</em> the feature map
          instead of having it chosen by hand.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "linear",
      rung: "check",
      prompt: <p>A model <M>{"\\hat y = w_0 + w_1 x + w_2 x^2"}</M> is fitted by least squares. In what is it linear?</p>,
      answer: { kind: "choice", options: ["In the weights", "In x", "In neither"], correct: [0] },
    },
    {
      key: "count1",
      rung: "check",
      prompt: <p>How many features, including the constant 1, does a degree-3 polynomial in one variable use?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "eval",
      rung: "apply",
      prompt: <p>Weights <M>{"(2, 3, -1)"}</M> are fitted on features <M>{"(1, x, x^2)"}</M>. What is the prediction at <M>{"x = 2"}</M>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "count3",
      rung: "apply",
      prompt: <p>How many features, including the constant, are there in a polynomial of degree at most 2 in 3 variables?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "extrap",
      rung: "apply",
      prompt: <p>A degree-4 fit of fuel use against speed was trained on speeds from 20 to 120 km/h. How far should you trust its prediction at 200 km/h?</p>,
      answer: { kind: "choice", options: ["Not at all: it is far outside the data", "Fully, since the fit is good", "More than its predictions at 60 km/h"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from sklearn.preprocessing import PolynomialFeatures
import numpy as np
print(PolynomialFeatures(degree=2).fit_transform(np.array([[2.0, 3.0]])))`}</Code>
          <p>Degree-2 features of (a, b) = (2, 3): 1, a, b, a², ab, b². What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[1. 2. 3. 4. 6. 9.]]", "[[2. 3. 4. 9.]]", "[[1. 2. 3. 4. 9.]]", "[[1. 2. 3. 6.]]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from sklearn.preprocessing import PolynomialFeatures
P = PolynomialFeatures(2).fit(np.zeros((1, 2)))
print(P.get_feature_names_out(["a", "b"]).tolist(), P.n_output_features_)`}</Code>
          <p>Degree-2 polynomial features of two inputs. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['1', 'a', 'b', 'a^2', 'a b', 'b^2'] 6", "['a', 'b', 'a^2', 'a b', 'b^2'] 5", "['1', 'a', 'b', 'a^2', 'b^2'] 5", "['1', 'a', 'b', 'a b', 'a^2', 'b^2'] 6"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>poly_features(x, degree)</C>, which turns a 1-D array into the matrix with columns 1, x, x², …, x<sup>degree</sup>, and <C>fit_poly(x, y, degree)</C>, which returns least-squares coefficients for those columns. A linear model on polynomial features fits a curve.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def poly_features(x, degree):
    return np.column_stack([np.ones(len(x)), x])

def fit_poly(x, y, degree):
    return np.linalg.lstsq(poly_features(x, degree), y, rcond=None)[0]
`,
        solution: `import numpy as np

def poly_features(x, degree):
    return np.column_stack([x ** k for k in range(degree + 1)])

def fit_poly(x, y, degree):
    return np.linalg.lstsq(poly_features(x, degree), y, rcond=None)[0]
`,
        tests: [
          { name: "features", code: `import numpy as np
F = poly_features(np.array([2.0, 3.0]), 3)
assert F.shape == (2, 4) and np.allclose(F[1], [1, 3, 9, 27]), 'Columns are x to the powers 0 to degree.'` },
          { name: "fit", code: `import numpy as np
x = np.linspace(-2, 2, 30); y = 1 - 2 * x + 0.5 * x ** 2
assert np.allclose(fit_poly(x, y, 2), [1, -2, 0.5]), 'Recover the quadratic exactly.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>poly_features_multi(X, degree)</C> for a matrix with d columns: all monomials of total degree 0 … degree, in scikit-learn&rsquo;s order (by degree, and within a degree in the order of <C>itertools.combinations_with_replacement(range(d), k)</C>), each the product of the named columns. Then write <C>n_poly_features(d, degree)</C>, the count C(d + degree, degree), and <C>fit_poly_ridge(X, y, degree, lam)</C>, ridge on those features without penalising the constant column, returning the weights.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def poly_features_multi(X, degree):
    return np.column_stack([np.ones(len(X)), X])

def n_poly_features(d, degree):
    return d + 1

def fit_poly_ridge(X, y, degree, lam):
    return np.zeros(n_poly_features(X.shape[1], degree))
`,
        solution: `import numpy as np

from itertools import combinations_with_replacement
from math import comb

def poly_features_multi(X, degree):
    X = np.asarray(X, float)
    cols = []
    for k in range(degree + 1):
        for c in combinations_with_replacement(range(X.shape[1]), k):
            cols.append(np.prod(X[:, list(c)], axis=1) if c else np.ones(len(X)))
    return np.column_stack(cols)

def n_poly_features(d, degree):
    return comb(d + degree, degree)

def fit_poly_ridge(X, y, degree, lam):
    F = poly_features_multi(X, degree)
    P = lam * np.eye(F.shape[1])
    P[0, 0] = 0
    return np.linalg.solve(F.T @ F + P, F.T @ y)
`,
        tests: [
          { name: "sklearn", code: `import numpy as np
from sklearn.preprocessing import PolynomialFeatures
rng = np.random.default_rng(0)
X = rng.normal(size=(10, 3))
for deg in (1, 2, 3):
    assert np.allclose(poly_features_multi(X, deg), PolynomialFeatures(deg).fit_transform(X)), f'Degree {deg} in scikit-learn order.'` },
          { name: "count", code: `assert [n_poly_features(2, 2), n_poly_features(3, 3), n_poly_features(10, 2), n_poly_features(5, 0)] == [6, 20, 66, 1]` },
          { name: "ridge", code: `import numpy as np
from sklearn.linear_model import Ridge
from sklearn.preprocessing import PolynomialFeatures
rng = np.random.default_rng(1)
X = rng.normal(size=(50, 2)); y = 1 + X[:, 0] * X[:, 1] + rng.normal(0, 0.1, 50)
w = fit_poly_ridge(X, y, 2, 0.5)
F = PolynomialFeatures(2).fit_transform(X)[:, 1:]
m = Ridge(alpha=0.5).fit(F, y)
assert np.allclose(w, np.r_[m.intercept_, m.coef_]) and abs(w[4] - 1) < 0.1, 'The constant is not penalised; the a·b term is found.'` },
        ],
      },
    },
    {
      key: "why",
      rung: "prove",
      prompt: (
        <p>
          Explain why adding <M>{"x^2"}</M> as a feature lets least squares fit a parabola without any change to the fitting
          method, and why it helps to rescale <M>x</M> before forming high powers.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that the prediction is still a weighted sum of fixed features, so the squared error is the same kind of function of the weights and the normal equations apply.",
          "Notes that the rows of the feature matrix become (1, x_i, x_i²).",
          "Explains that powers of large x span enormous ranges, making the matrix XᵀX badly scaled.",
          "Concludes that scaling x to a small range keeps the computation numerically stable.",
        ],
      },
    },
    {
      key: "explode",
      rung: "stretch",
      prompt: <p>How many features, including the constant, does a polynomial of degree at most 3 in 10 variables have?</p>,
      answer: { kind: "numeric", value: 286 },
    },
  ],

  teachBack:
    "Explain to a friend how polynomial features let linear regression fit curves, why the model is still linear in its weights, and why such models are dangerous outside the data.",

  glimpse: (
    <p>
      Next, gradient descent, a way to find the best weights by walking downhill, which works even when there is no formula.
      Statistical Machine Learning shows how the kernel trick handles infinitely many features, and Neural Networks from
      Scratch learns the features themselves.
    </p>
  ),
};
