import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CondMeanViz } from "@/components/viz/CondMeanViz";
import type { LessonContent } from "@/lib/types";

const TABLE = `def cond_mean_table(xs, ys, J):
    out = {}
    for i, x in enumerate(xs):
        px = sum(J[i])
        out[x] = sum(J[i][j] * ys[j] for j in range(len(ys))) / px
    return out

def mean_of_cond_mean(xs, ys, J):
    g = cond_mean_table(xs, ys, J)
    return sum(sum(J[i]) * g[x] for i, x in enumerate(xs))`;

const BINNED = `import numpy as np

def binned_cond_mean(x, y, edges):
    idx = np.digitize(x, edges) - 1
    return np.array([y[idx == k].mean() for k in range(len(edges) - 1)])

def mse(y, pred):
    return float(np.mean((y - pred) ** 2))`;

export const lesson: LessonContent = {
  id: "m7.6.1",
  minutes: 60,
  links: {
    requires: ["m7.5.1", "m7.2.3"],
    revisits: ["m7.5.5", "m7.3.1"],
    foreshadows: ["m7.6.2", "m7.6.3"],
  },

  puzzle: (
    <>
      <p>
        Break a stick of length 1 at a uniform point U, then break the left piece at a uniform point, leaving a piece of
        length V. If someone tells you U, your best guess for V is U/2. Before you are told, that guess is itself uncertain:
        it is a random variable, U/2. Treating "the average of V once U is known" as a random quantity is the idea that makes
        prediction, the tower rule and martingales work.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Group the outcomes by the value of X and average Y within each group. The result is a function of x, the regression
        function. Plug the random X back in and you get E[Y | X], a coarser version of Y that keeps only what X can see. The
        figure estimates it by averaging within bins and compares it with the exact answer.
      </p>
      <CondMeanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="conditional expectation given a value">
        <p>
          For discrete X and Y and a value x with <M>{"P(X = x) > 0"}</M>, the conditional expectation of Y given{" "}
          <M>{"X = x"}</M> is the mean of the conditional distribution:
        </p>
        <MD>{"g(x) = E[Y \\mid X = x] = \\sum_y y\\, P(Y = y \\mid X = x) = \\frac{\\sum_y y\\, p(x, y)}{p_X(x)}."}</MD>
        <p>
          With a joint density, replace the sums by integrals:{" "}
          <M>{"g(x) = \\int y\\, f(x, y)\\,dy \\,/\\, f_X(x)"}</M> wherever <M>{"f_X(x) > 0"}</M>.
        </p>
      </Definition>
      <Definition title="conditional expectation as a random variable">
        <p>
          <M>{"E[Y \\mid X]"}</M> is the random variable <M>{"g(X)"}</M>: on an outcome where X takes the value x, it takes the
          value g(x). It is a function of X, so it is constant on each event <M>{"\\{X = x\\}"}</M>, and there it equals the
          average of Y over that event.
        </p>
      </Definition>
      <Code>{TABLE}</Code>
      <p>
        The table above has <M>{"p_X(0) = 0.4"}</M>, <M>{"p_X(1) = 0.6"}</M>. Within X = 0 the mean of Y is 1, within X = 1 it
        is 5/6, so E[Y | X] is 1 with probability 0.4 and 5/6 with probability 0.6. Its own mean, 0.9, equals E[Y]: the next
        lesson proves this always happens.
      </p>

      <Theorem title="properties">
        <p>For random variables with finite means and any functions h:</p>
        <ul>
          <li>
            Linearity: <M>{"E[aY + bZ \\mid X] = aE[Y \\mid X] + bE[Z \\mid X]"}</M>.
          </li>
          <li>
            Taking out what is known: <M>{"E[h(X)Y \\mid X] = h(X)E[Y \\mid X]"}</M>, and in particular{" "}
            <M>{"E[h(X) \\mid X] = h(X)"}</M>.
          </li>
          <li>
            Independence: if X and Y are independent, <M>{"E[Y \\mid X] = E[Y]"}</M>, a constant.
          </li>
          <li>
            Monotonicity: if <M>{"Y \\le Z"}</M> then <M>{"E[Y \\mid X] \\le E[Z \\mid X]"}</M>.
          </li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          Fix x with <M>{"P(X = x) > 0"}</M>. Conditional on <M>{"X = x"}</M>, the conditional probabilities{" "}
          <M>{"P(\\cdot \\mid X = x)"}</M> form a probability measure, and <M>{"E[\\cdot \\mid X = x]"}</M> is ordinary expectation
          under it, so linearity and monotonicity carry over. Under that measure <M>{"h(X) = h(x)"}</M> with probability 1, so{" "}
          <M>{"E[h(X)Y \\mid X = x] = h(x)E[Y \\mid X = x]"}</M>. If X and Y are independent,{" "}
          <M>{"P(Y = y \\mid X = x) = P(Y = y)"}</M>, so the conditional mean is E[Y] for every x. Each identity holds for every
          x, hence as random variables.
        </p>
      </Proof>

      <Example title="the broken stick">
        <p>
          U ~ Uniform(0, 1), and given U = u, V ~ Uniform(0, u). The conditional density of V is 1/u on (0, u), so{" "}
          <M>{"E[V \\mid U = u] = u/2"}</M> and <M>{"E[V \\mid U] = U/2"}</M>. By taking out what is known,{" "}
          <M>{"E[UV \\mid U] = U \\cdot U/2 = U^2/2"}</M>. Write V = UW with W ~ Uniform(0, 1) independent of U: then{" "}
          <M>{"E[UW \\mid U] = U E[W \\mid U] = U E[W] = U/2"}</M>, the same answer from the properties alone.
        </p>
      </Example>

      <Example title="estimating g from data">
        <p>
          With samples instead of a formula, cut the range of X into bins and average Y in each. Narrow bins lower the bias,
          but fewer points per bin raise the variance: the first example of the bias-variance trade-off. The mean squared
          error of g(X) as a predictor of V is 1/36 ≈ 0.028, against Var(V) = 7/144 ≈ 0.049 for the best constant.
        </p>
        <Code>{BINNED}</Code>
      </Example>

      <Remark title="the general definition">
        <p>
          When <M>{"P(X = x) = 0"}</M> for every x and there is no joint density, the formulas above do not apply. The general
          definition says <M>{"E[Y \\mid X]"}</M> is the function of X satisfying{" "}
          <M>{"E[E[Y \\mid X]\\, h(X)] = E[Y h(X)]"}</M> for every bounded h. It exists and is unique with probability 1, and it
          agrees with our formulas whenever they make sense. Two lessons on, this definition is read as an orthogonal projection.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "given",
      rung: "check",
      prompt: <p>X is uniform on {"{1, 2, 3}"}, and given X = x, Y is uniform on {"{1, …, x}"}. What is E[Y | X = 3]?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "mean",
      rung: "check",
      prompt: <p>In the same model E[Y | X] = (X + 1)/2. What is the mean of this random variable?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "known",
      rung: "apply",
      prompt: <p>Which of these equals E[X²Y + 3 | X] for any X and Y with finite means (and X²Y integrable)?</p>,
      answer: {
        kind: "choice",
        options: ["X² E[Y | X] + 3", "E[X²] E[Y] + 3", "X² E[Y] + 3", "E[X² | Y] Y + 3"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cond_mean_table(xs, ys, J):
    out = {}
    for i, x in enumerate(xs):
        px = sum(J[i])
        out[x] = sum(J[i][j] * ys[j] for j in range(len(ys))) / px
    return out

def mean_of_cond_mean(xs, ys, J):
    g = cond_mean_table(xs, ys, J)
    return sum(sum(J[i]) * g[x] for i, x in enumerate(xs))

J = [[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]]
print(cond_mean_table([0, 1], [0, 1, 2], J), round(mean_of_cond_mean([0, 1], [0, 1, 2], J), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: 1.0, 1: 0.8333333333333334} 0.9",
          "{0: 0.4, 1: 0.5} 0.9",
          "{0: 1.0, 1: 0.8333333333333334} 0.9166666666666667",
          "{0: 1.0, 1: 0.8333333333333334} 1.8333333333333335",
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

def binned_cond_mean(x, y, edges):
    idx = np.digitize(x, edges) - 1
    return np.array([y[idx == k].mean() for k in range(len(edges) - 1)])

def mse(y, pred):
    return float(np.mean((y - pred) ** 2))

rng = np.random.default_rng(0)
u = rng.random(400000)
v = u * rng.random(400000)
print(np.round(binned_cond_mean(u, v, np.array([0.0, 0.25, 0.5, 0.75, 1.0])), 2))
print(round(mse(v, u / 2), 3), round(mse(v, np.full_like(v, v.mean())), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.06 0.19 0.31 0.44]\n0.028 0.049",
          "[0.12 0.38 0.62 0.88]\n0.028 0.049",
          "[0.06 0.19 0.31 0.44]\n0.049 0.028",
          "[0.25 0.25 0.25 0.25]\n0.028 0.049",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A joint pmf is given as a nested list J, with <C>J[i][j]</C> = P(X = xs[i], Y = ys[j]). Write{" "}
          <C>cond_mean_table(xs, ys, J)</C>, returning a dict from each x to E[Y | X = x] (every row has positive total), and{" "}
          <C>mean_of_cond_mean(xs, ys, J)</C>, returning the mean of the random variable E[Y | X].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cond_mean_table(xs, ys, J):
    return {}

def mean_of_cond_mean(xs, ys, J):
    return 0.0
`,
        solution: TABLE,
        tests: [
          { name: "table", code: `J = [[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]]
g = cond_mean_table([0, 1], [0, 1, 2], J)
assert set(g) == {0, 1} and abs(g[0] - 1.0) < 1e-12 and abs(g[1] - 5 / 6) < 1e-12
g = cond_mean_table(['a', 'b'], [10, 20], [[0.25, 0.25], [0.0, 0.5]])
assert abs(g['a'] - 15) < 1e-12 and abs(g['b'] - 20) < 1e-12` },
          { name: "mean equals E[Y]", code: `J = [[0.05, 0.1, 0.15], [0.2, 0.1, 0.0], [0.1, 0.2, 0.1]]
ys = [1, 4, 9]
EY = sum(J[i][j] * ys[j] for i in range(3) for j in range(3))
assert abs(mean_of_cond_mean([5, 6, 7], ys, J) - EY) < 1e-12
assert abs(mean_of_cond_mean([0, 1], [0, 1, 2], [[0.1, 0.2, 0.1], [0.2, 0.3, 0.1]]) - 0.9) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binned_cond_mean(x, y, edges)</C>, returning the average of y over the samples whose x lies in each bin
          [edges[k], edges[k+1]) (assume every bin is non-empty and every x lies in [edges[0], edges[−1])), and{" "}
          <C>mse(y, pred)</C>, the mean squared difference as a Python float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def binned_cond_mean(x, y, edges):
    return np.zeros(len(edges) - 1)

def mse(y, pred):
    return 0.0
`,
        solution: BINNED,
        tests: [
          { name: "bins", code: `x = np.array([0.1, 0.2, 0.6, 0.9, 0.5])
y = np.array([1.0, 3.0, 10.0, 20.0, 6.0])
out = binned_cond_mean(x, y, np.array([0.0, 0.5, 1.0]))
assert out.shape == (2,) and np.allclose(out, [2.0, 12.0])
out = binned_cond_mean(x, y, np.array([0.0, 0.3, 0.7, 1.0]))
assert np.allclose(out, [2.0, 8.0, 20.0])` },
          { name: "mse", code: `assert abs(mse(np.array([1.0, 2.0, 3.0]), np.array([1.0, 0.0, 4.0])) - 5 / 3) < 1e-12
assert isinstance(mse(np.ones(3), np.ones(3)), float) and mse(np.ones(3), np.ones(3)) == 0.0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          X and Y are discrete with finite means, and h is any function with h(X)Y integrable. Prove that{" "}
          <M>{"E[h(X)Y \\mid X = x] = h(x)\\,E[Y \\mid X = x]"}</M> for every x with <M>{"P(X = x) > 0"}</M>, and that if X and Y
          are independent then <M>{"E[Y \\mid X] = E[Y]"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes E[h(X)Y | X = x] as a sum over (x', y) of h(x')y P(X = x', Y = y)/P(X = x) and notes only x' = x contributes.",
          "Pulls the constant h(x) out of the remaining sum to get h(x) Σ_y y P(Y = y | X = x) = h(x) E[Y | X = x].",
          "For independence, uses P(Y = y | X = x) = P(Y = y) to get E[Y | X = x] = E[Y] for every x, so E[Y | X] is the constant E[Y].",
        ],
      },
    },
    {
      key: "stick",
      rung: "stretch",
      prompt: (
        <p>
          In the broken stick, U ~ Uniform(0, 1) and E[V | U] = U/2. Using taking out what is known and the fact that the
          mean of E[Z | U] is E[Z], find E[UV]. Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1667, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between E[Y | X = x], a number, and E[Y | X], a random variable, how to compute both from a joint table, and why E[h(X)Y | X] = h(X)E[Y | X].",

  glimpse: (
    <>
      <p>
        Averaging the conditional means gave back E[Y] in every example. The next lesson proves this law of total
        expectation, and its partner for variance, which splits the spread of Y into the part X explains and the part it
        does not.
      </p>
    </>
  ),
};
