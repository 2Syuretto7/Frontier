import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PowerFitViz } from "@/components/viz/PowerFitViz";
import type { LessonContent } from "@/lib/types";

const FIT = `import math

def linfit(u, v):
    n = len(u)
    mu, mv = sum(u) / n, sum(v) / n
    slope = sum((a - mu) * (b - mv) for a, b in zip(u, v)) / sum((a - mu) ** 2 for a in u)
    return slope, mv - slope * mu

def fit_power(xs, ys, E):
    slope, icpt = linfit([math.log(x) for x in xs], [math.log(y - E) for y in ys])
    return math.exp(icpt), -slope

def fit_offset(xs, ys, grid):
    best = None
    for E in grid:
        if E >= min(ys):
            continue
        A, alpha = fit_power(xs, ys, E)
        sse = sum((math.log(E + A * x ** (-alpha)) - math.log(y)) ** 2 for x, y in zip(xs, ys))
        if best is None or sse < best[3]:
            best = (E, A, alpha, sse)
    return best`;

const ROBUST = `import math

def huber(r, delta):
    return 0.5 * r * r if abs(r) <= delta else delta * (abs(r) - 0.5 * delta)

def predict(params, x):
    E, A, alpha = params
    return E + A * x ** (-alpha)

def log_huber_objective(params, xs, ys, delta=1e-3):
    return sum(huber(math.log(predict(params, x)) - math.log(y), delta) for x, y in zip(xs, ys))`;

export const lesson: LessonContent = {
  id: "l8.4.1",
  minutes: 50,
  links: {
    requires: ["m17.5.1", "m9.6.2", "l8.2.4"],
    revisits: ["m9.5.2", "m17.5.3"],
    foreshadows: ["l8.4.2", "l8.4.3", "l8.4.5"],
  },

  puzzle: (
    <>
      <p>
        A lab trains a few dozen small models, plots their losses against compute, and fits a curve. On the strength of that
        curve it commits a hundred million dollars to a single large run. The fit is made on runs a thousand times smaller than
        the one it predicts. Which curve should be fitted, in which space, and how do you know whether to trust the
        extrapolation?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Loss does not fall to zero: it approaches the entropy of the data, an irreducible floor E. So the natural model is a
        power law plus a constant. Without the constant, the curve is a straight line on log-log axes, but the wrong one: the
        data bend towards the floor, the fitted exponent is too small, and extrapolations are far off. With the constant, three
        parameters must be found from points that span a narrow range, and E and the exponent can compensate for each other,
        so small fits that look excellent can still disagree at large scale.
      </p>
      <PowerFitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the saturating power law">
        <p>
          Model the loss as <M>{"L(x) = E + A x^{-\\alpha}"}</M>, with x the compute, parameters or tokens. For a known E,{" "}
          <M>{"\\log(L - E) = \\log A - \\alpha \\log x"}</M> is linear, so ordinary least squares on the logs gives A and α (<C>linfit</C>,{" "}
          <C>fit_power</C>). For unknown E, profile it: for each E on a grid, fit A and α, and keep the E with the smallest squared
          error in <M>{"\\log L"}</M> (<C>fit_offset</C>).
        </p>
        <Code>{FIT}</Code>
      </Definition>

      <Theorem title="three points determine the law">
        <p>
          If three points at <M>{"x_1, x_2 = r x_1, x_3 = r^2 x_1"}</M> lie exactly on <M>{"E + A x^{-\\alpha}"}</M>, then
        </p>
        <MD>{"E = \\frac{L_1 L_3 - L_2^2}{L_1 + L_3 - 2L_2}, \\qquad r^{-\\alpha} = \\frac{L_2 - E}{L_1 - E}"}</MD>
      </Theorem>
      <Proof>
        <p>
          The gaps <M>{"L_i - E"}</M> form a geometric sequence with ratio <M>{"r^{-\\alpha}"}</M>, so <M>{"(L_2 - E)^2 = (L_1 - E)(L_3 - E)"}</M>. Expanding,
          the <M>{"E^2"}</M> terms cancel and the equation is linear in E, giving the formula. The ratio then follows from the first two
          points. The denominator is the second difference of the losses, which is small when the points are nearly collinear,
          and that is exactly when E is poorly determined.
        </p>
      </Proof>

      <Definition title="robust fitting in log space">
        <p>
          Chinchilla&apos;s parametric fit minimised the Huber loss of the residuals in log space,{" "}
          <M>{"\\sum_i \\mathrm{Huber}_\\delta\\big(\\log \\hat L(x_i) - \\log L_i\\big)"}</M> with <M>{"\\delta = 10^{-3}"}</M> (<C>huber</C>, <C>predict</C>,{" "}
          <C>log_huber_objective</C>), from a grid of starting points with L-BFGS. Log space weights relative errors equally, so the
          small runs with large losses do not dominate; the Huber loss is quadratic for small residuals and linear beyond δ,
          so a few bad runs, diverged or mistuned, pull the fit less than under squared error.
        </p>
        <Code>{ROBUST}</Code>
      </Definition>

      <Remark title="how to know whether to trust it">
        <p>
          Hold out the largest runs, fit on the rest, and check the prediction, as in the viz. Bootstrap over runs (m9.5.2) to get
          intervals for the parameters and, more usefully, for the predicted loss at the target scale. Use only runs whose
          hyperparameters were tuned for their size, since a mistuned small run sits above the curve and tilts the exponent.
          Besiroglu and colleagues reconstructed the Chinchilla data from the published figure and refitted the parametric
          model: the original estimates were inconsistent with the paper&apos;s other two methods and came with intervals so
          narrow they would have needed hundreds of thousands of runs, while the refit agreed with the familiar rule of about
          twenty tokens per parameter.
        </p>
      </Remark>

      <Example title="what goes on the x-axis">
        <p>
          The same data can be fitted against parameters at fixed tokens, tokens at fixed parameters, or compute along the
          compute-optimal frontier, and each gives a different exponent. The next two lessons fit two-variable laws in N and D,
          whose shape decides how a compute budget should be split, and show how the earlier and later answers to that
          question came to differ.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "alpha",
      rung: "check",
      prompt: <p>With E = 1, two runs at compute 10 and 1,000 reach losses 3.0 and 1.5. What exponent α does the power law through them have? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.301, tolerance: 0.0002 },
    },
    {
      key: "huber",
      rung: "check",
      prompt: <p>What is the Huber loss with δ = 0.1 of a residual of 0.5? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.045, tolerance: 0.0005 },
    },
    {
      key: "zeroE",
      rung: "apply",
      prompt: <p>Why does fitting a pure power law, with E = 0, to runs that approach a floor underestimate the large-scale loss?</p>,
      answer: {
        kind: "choice",
        options: [
          "The data bend towards the floor, so the best straight line in log-log space has too small a slope, and continuing it predicts losses that keep falling towards zero",
          "Without E the fit has too many parameters and overfits",
          "Pure power laws cannot be fitted by least squares",
          "Setting E = 0 makes the exponent negative",
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

def linfit(u, v):
    n = len(u)
    mu, mv = sum(u) / n, sum(v) / n
    slope = sum((a - mu) * (b - mv) for a, b in zip(u, v)) / sum((a - mu) ** 2 for a in u)
    return slope, mv - slope * mu

def fit_power(xs, ys, E):
    slope, icpt = linfit([math.log(x) for x in xs], [math.log(y - E) for y in ys])
    return math.exp(icpt), -slope

def fit_offset(xs, ys, grid):
    best = None
    for E in grid:
        if E >= min(ys):
            continue
        A, alpha = fit_power(xs, ys, E)
        sse = sum((math.log(E + A * x ** (-alpha)) - math.log(y)) ** 2 for x, y in zip(xs, ys))
        if best is None or sse < best[3]:
            best = (E, A, alpha, sse)
    return best

print(linfit([0, 1, 2], [1, 3, 5]), [round(v, 4) for v in fit_power([1, 100], [3.0, 1.2], 1.0)])
xs = [1, 10, 100, 1000]; ys = [1.5 + 2.0 * x ** -0.5 for x in xs]; print([round(v, 4) for v in fit_offset(xs, ys, [1.0, 1.5, 2.0])[:3]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2.0, 1.0) [2.0, 0.5]\n[1.5, 2.0, 0.5]",
          "(2.0, 1.0) [2.0, -0.5]\n[1.5, 2.0, 0.5]",
          "(1.0, 2.0) [2.0, 0.5]\n[1.5, 2.0, 0.5]",
          "(2.0, 1.0) [2.0, 0.5]\n[1.0, 2.5, 0.4]",
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

def huber(r, delta):
    return 0.5 * r * r if abs(r) <= delta else delta * (abs(r) - 0.5 * delta)

def predict(params, x):
    E, A, alpha = params
    return E + A * x ** (-alpha)

def log_huber_objective(params, xs, ys, delta=1e-3):
    return sum(huber(math.log(predict(params, x)) - math.log(y), delta) for x, y in zip(xs, ys))

print(huber(0.5, 1.0), huber(3.0, 1.0), predict((1.0, 4.0, 0.5), 16))
print(round(log_huber_objective((0.0, 1.0, 1.0), [1.0, 2.0], [1.0, 0.5], 0.1), 6), round(log_huber_objective((0.0, 1.0, 1.0), [1.0], [math.e], 0.1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.125 2.5 2.0\n0.0 0.095",
          "0.125 4.5 2.0\n0.0 0.095",
          "0.125 2.5 2.0\n0.0 0.5",
          "0.25 2.5 5.0\n0.0 0.095",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>linfit(u, v)</C>, returning (slope, intercept), <C>fit_power(xs, ys, E)</C>, returning (A, α), and{" "}
          <C>fit_offset(xs, ys, grid)</C>, returning (E, A, α, error) for the grid value with the smallest squared error in log L, skipping
          values of E not below every loss.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def linfit(u, v):
    return (v[-1] - v[0]) / (u[-1] - u[0]), v[0]

def fit_power(xs, ys, E):
    slope, icpt = linfit(xs, ys)
    return icpt, -slope

def fit_offset(xs, ys, grid):
    E = grid[0]
    A, alpha = fit_power(xs, ys, E)
    return E, A, alpha, 0.0
`,
        solution: FIT,
        tests: [
          { name: "line", code: `s, c = linfit([0, 1, 2, 3], [1, 2, 2, 4])\nassert abs(s - 0.9) < 1e-12 and abs(c - 0.9) < 1e-12\nA, alpha = fit_power([10, 1000], [3.0, 1.5], 1.0)\nassert abs(alpha - math.log10(4) / 2) < 1e-12 and abs(A - 2 * 10 ** alpha) < 1e-9` },
          { name: "offset", code: `xs = [1, 3, 10, 30, 100]\nys = [2.0 + 3.0 * x ** -0.4 for x in xs]\nE, A, alpha, err = fit_offset(xs, ys, [1.0, 1.5, 2.0, 2.5, 6.0])\nassert E == 2.0 and abs(alpha - 0.4) < 1e-9 and err < 1e-20` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>huber(r, delta)</C>, <C>predict(params, x)</C> for params (E, A, α), and <C>log_huber_objective(params, xs, ys, delta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def huber(r, delta):
    return r * r

def predict(params, x):
    E, A, alpha = params
    return A * x ** (-alpha)

def log_huber_objective(params, xs, ys, delta=1e-3):
    return sum((predict(params, x) - y) ** 2 for x, y in zip(xs, ys))
`,
        solution: ROBUST,
        tests: [
          { name: "huber", code: `assert abs(huber(0.05, 0.1) - 0.00125) < 1e-15 and abs(huber(-2.0, 0.5) - 0.875) < 1e-12 and predict((2.0, 3.0, 1.0), 3) == 3.0` },
          { name: "objective", code: `p = (1.0, 2.0, 0.5)\nassert abs(log_huber_objective(p, [4, 16], [predict(p, 4), predict(p, 16)])) < 1e-15\nassert abs(log_huber_objective(p, [4], [2.0 * math.e], 0.1) - 0.1 * (1 - 0.05)) < 1e-12` },
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          Runs at compute 1, 10 and 100 reach losses 5, 3 and 2.2, and lie exactly on <M>{"E + Ax^{-\\alpha}"}</M>. What is E? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.6667, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        With a method for fitting in hand, the next lesson revisits the first large study of language-model scaling, its laws
        in parameters, data and compute, and the conclusions about model size that later work overturned.
      </p>
    </>
  ),
};
