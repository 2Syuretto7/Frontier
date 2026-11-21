import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LadderFitViz } from "@/components/viz/LadderFitViz";
import type { LessonContent } from "@/lib/types";

const FIT = `import math

def fit_power(xs, ys, E):
    u = [math.log(x) for x in xs]
    v = [math.log(y - E) for y in ys]                      # log(L - E) = log a - b log C
    mu, mv = sum(u) / len(u), sum(v) / len(v)
    slope = sum((p - mu) * (q - mv) for p, q in zip(u, v)) / sum((p - mu) ** 2 for p in u)
    return math.exp(mv - slope * mu), -slope

def predict(a, b, E, x):
    return E + a * x ** -b

def best_E(xs, ys, grid):
    def sse(E):
        a, b = fit_power(xs, ys, E)
        return sum((math.log(y - E) - math.log(a * x ** -b)) ** 2 for x, y in zip(xs, ys))
    return min((E for E in grid if E < min(ys)), key=sse)`;

const SWEEP = `import math

def vertex_lr(lrs, losses):
    i = min(range(1, len(lrs) - 1), key=lambda j: losses[j])   # interior point with the lowest loss
    y0, y1, y2 = losses[i - 1], losses[i], losses[i + 1]
    h = math.log2(lrs[i + 1] / lrs[i])                     # sweep spaced evenly in log2
    shift = h * (y0 - y2) / (2 * (y0 - 2 * y1 + y2))
    return lrs[i] * 2 ** shift

def mup_lr(lr_base, width_base, width):
    return lr_base * width_base / width                    # hidden-layer Adam rate under muP

def ladder(c_main, rungs, factor, runs_per_rung):
    sizes = [c_main / factor ** k for k in range(rungs, 0, -1)]
    return sizes, runs_per_rung * sum(sizes) / c_main      # share of the main run the ladder costs`;

export const lesson: LessonContent = {
  id: "e15.3.1",
  minutes: 50,
  links: {
    requires: ["e15.2.2"],
    revisits: ["l8.4.1", "l8.5.1", "l8.5.2", "e13.1.3"],
    foreshadows: ["e15.3.2"],
  },

  puzzle: (
    <>
      <p>
        The main run will use more than half the budget and cannot be repeated. Its learning rate, its batch size and
        even whether its data mixture beats the alternative all have to be right the first time. Yet none of them can be
        tested at full scale. How can a ladder of runs, each a fraction of the size, set those choices and predict the
        main run&apos;s loss before it starts?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Train the same recipe at several sizes, each a few times smaller than the next. At each size, sweep the learning
        rate and keep the best. If the model is parametrised with μP, the best learning rate stays nearly constant across
        widths, which the ladder confirms rather than assumes. Then fit a power law to the best losses against compute and
        extrapolate it to the main run. The fit gives a target: if the main run&apos;s loss lands well above it, something
        is wrong.
      </p>
      <LadderFitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="fitting the ladder">
        <p>
          The losses of compute-optimal runs follow <M>{"L(C) = E + aC^{-b}"}</M>, as in l8.4.1. For a fixed E, taking
          logarithms gives the line <M>{"\\log(L - E) = \\log a - b \\log C"}</M>, fitted by least squares{" "}
          (<C>fit_power</C>) and extrapolated (<C>predict</C>). E is chosen as the value from a grid whose fit has the
          smallest squared error in log space (<C>best_E</C>). With few points, nearby values of E fit almost equally well
          but predict different losses far away, so the prediction should be reported as a range.
        </p>
        <Code>{FIT}</Code>
      </Definition>

      <Theorem title="the vertex of a learning-rate sweep">
        <p>
          Let losses <M>{"y_0, y_1, y_2"}</M> be measured at learning rates evenly spaced by h in <M>{"\\log_2"}</M>, with{" "}
          <M>{"y_1"}</M> the smallest. The parabola through the three points has its minimum at
        </p>
        <MD>{"\\log_2 \\eta^* = \\log_2 \\eta_1 + \\frac{h\\,(y_0 - y_2)}{2\\,(y_0 - 2y_1 + y_2)}"}</MD>
      </Theorem>
      <Proof>
        <p>
          Put the origin at <M>{"\\log_2 \\eta_1"}</M>, so the points are at −h, 0 and h. A parabola{" "}
          <M>{"y = \\alpha t^2 + \\beta t + \\gamma"}</M> through them has <M>{"\\gamma = y_1"}</M>,{" "}
          <M>{"\\alpha h^2 = (y_0 + y_2)/2 - y_1"}</M> and <M>{"\\beta h = (y_2 - y_0)/2"}</M>. Its minimum is at{" "}
          <M>{"t = -\\beta/(2\\alpha) = h(y_0 - y_2)/(2(y_0 - 2y_1 + y_2))"}</M>, and α &gt; 0 because{" "}
          <M>{"y_1"}</M> is below the average of its neighbours. Since <M>{"y_1"}</M> is the smallest, the shift is at
          most h/2 in either direction (<C>vertex_lr</C>).
        </p>
      </Proof>

      <Definition title="transfer and cost">
        <p>
          Under μP, as in l8.5.1, the Adam learning rate of hidden matrices scales as the inverse of width, so a rate
          tuned at width <M>{"d_0"}</M> becomes <M>{"\\eta_0 d_0 / d"}</M> (<C>mup_lr</C>); the ladder checks that the
          swept optimum agrees. A ladder whose rungs are a factor f apart in compute, ending a factor f below the main
          run, with several runs per rung, costs a fixed share of the main run (<C>ladder</C>), which the budget of
          e15.1.2 set aside.
        </p>
        <Code>{SWEEP}</Code>
      </Definition>

      <Example title="the capstone ladder">
        <p>
          Five rungs from about 10 to 100 million parameters, each trained compute-optimally, with four learning rates
          per rung spaced by factors of two. The two smallest rungs also compare the data mixtures still under
          consideration, as small-scale ablations in the sense of e13.1.3, and the winner carries to the larger rungs.
          The fit then predicts the main run&apos;s loss in bits per byte on each held-out source.
        </p>
      </Example>

      <Remark title="what can go wrong">
        <p>
          Rungs that are too small sit in a regime where the power law has not yet set in; rungs trained with a
          learning rate schedule that does not match the main run fit a different curve, which is why warmup-stable-decay
          schedules, which can be cut short with a decay, suit ladders. And a power law fitted over one decade of compute
          and extrapolated over two should be trusted to about the second decimal of the loss, no more.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "predict",
      rung: "check",
      prompt: (
        <p>
          Ladder runs at 10¹⁷, 10¹⁸ and 10¹⁹ FLOPs reach losses 3.0, 2.64 and 2.388. Taking E = 1.8, what loss does the
          fitted power law predict at 10²⁰ FLOPs? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.2116, tolerance: 0.0002 },
    },
    {
      key: "vertex",
      rung: "check",
      prompt: (
        <p>
          A sweep at learning rates 1, 2 and 4 × 10⁻³ gives losses 3.10, 3.02 and 3.06. Where does the parabola in log₂ of
          the learning rate put the optimum, in units of 10⁻³, to three decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 2.245, tolerance: 0.001 },
    },
    {
      key: "range",
      rung: "apply",
      prompt: <p>Why should the ladder&apos;s prediction for the main run be reported as a range?</p>,
      answer: {
        kind: "choice",
        options: [
          "Several values of the irreducible loss fit the rungs almost equally well but extrapolate differently",
          "Losses are random, so no prediction is possible",
          "Power laws cannot be extrapolated at all",
          "The main run uses a different tokeniser",
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

def fit_power(xs, ys, E):
    u = [math.log(x) for x in xs]
    v = [math.log(y - E) for y in ys]                      # log(L - E) = log a - b log C
    mu, mv = sum(u) / len(u), sum(v) / len(v)
    slope = sum((p - mu) * (q - mv) for p, q in zip(u, v)) / sum((p - mu) ** 2 for p in u)
    return math.exp(mv - slope * mu), -slope

def predict(a, b, E, x):
    return E + a * x ** -b

def best_E(xs, ys, grid):
    def sse(E):
        a, b = fit_power(xs, ys, E)
        return sum((math.log(y - E) - math.log(a * x ** -b)) ** 2 for x, y in zip(xs, ys))
    return min((E for E in grid if E < min(ys)), key=sse)

a, b = fit_power([1, 100], [3, 1.2], 1); print(round(a, 6), round(b, 6), round(predict(a, b, 1, 10 ** 4), 6))
print(best_E([1, 10, 100], [2.0, 1.5, 1.25], [0, 0.5, 1, 1.5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.0 0.5 1.02\n1", "2.0 0.5 1.2\n1", "2.0 -0.5 1.02\n1", "2.0 0.5 1.02\n0.5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def vertex_lr(lrs, losses):
    i = min(range(1, len(lrs) - 1), key=lambda j: losses[j])   # interior point with the lowest loss
    y0, y1, y2 = losses[i - 1], losses[i], losses[i + 1]
    h = math.log2(lrs[i + 1] / lrs[i])                     # sweep spaced evenly in log2
    shift = h * (y0 - y2) / (2 * (y0 - 2 * y1 + y2))
    return lrs[i] * 2 ** shift

def mup_lr(lr_base, width_base, width):
    return lr_base * width_base / width                    # hidden-layer Adam rate under muP

def ladder(c_main, rungs, factor, runs_per_rung):
    sizes = [c_main / factor ** k for k in range(rungs, 0, -1)]
    return sizes, runs_per_rung * sum(sizes) / c_main      # share of the main run the ladder costs

print(vertex_lr([1, 2, 4], [5, 3, 5]), vertex_lr([1, 2, 4, 8], [9, 4, 2, 4]), mup_lr(0.01, 256, 1024))
print(ladder(1000, 3, 10, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 4.0 0.0025\n([1.0, 10.0, 100.0], 0.222)",
          "2.0 2.0 0.0025\n([1.0, 10.0, 100.0], 0.222)",
          "2.0 4.0 0.04\n([1.0, 10.0, 100.0], 0.222)",
          "2.0 4.0 0.0025\n([100.0, 10.0, 1.0], 0.111)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_power(xs, ys, E)</C>, returning (a, b) from least squares on the logarithms;{" "}
          <C>predict(a, b, E, x)</C>; and <C>best_E(xs, ys, grid)</C>, the first value below every loss whose fit has the
          smallest squared error in log space.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fit_power(xs, ys, E):
    return 1.0, 0.0

def predict(a, b, E, x):
    return E

def best_E(xs, ys, grid):
    return grid[0]
`,
        solution: FIT,
        tests: [
          { name: "fit", code: `a, b = fit_power([1, 2, 4], [5, 3, 2], 1); assert abs(a - 4) < 1e-9 and abs(b - 1) < 1e-9 and abs(predict(a, b, 1, 8) - 1.5) < 1e-9` },
          { name: "E", code: `assert best_E([1, 2, 4], [5, 3, 2], [0, 1, 1.5]) == 1 and best_E([1, 2, 4], [5, 3, 2], [3, 1, 0]) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vertex_lr(lrs, losses)</C>, using the interior point with the lowest loss and its two neighbours;{" "}
          <C>mup_lr(lr_base, width_base, width)</C>; and <C>ladder(c_main, rungs, factor, runs_per_rung)</C>, returning
          the rung budgets from smallest to largest and the ladder&apos;s cost as a share of the main run.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def vertex_lr(lrs, losses):
    return lrs[0]

def mup_lr(lr_base, width_base, width):
    return lr_base

def ladder(c_main, rungs, factor, runs_per_rung):
    return [], 0.0
`,
        solution: SWEEP,
        tests: [
          { name: "vertex", code: `assert abs(vertex_lr([1, 2, 4], [4, 1, 2]) - 2 * 2 ** 0.25) < 1e-12 and vertex_lr([1, 4, 16, 64], [9, 5, 1, 5]) == 16.0` },
          { name: "cost", code: `assert mup_lr(0.02, 512, 2048) == 0.005 and ladder(64, 2, 4, 1) == ([4.0, 16.0], 0.3125)` },
        ],
      },
    },
    {
      key: "grid",
      rung: "stretch",
      prompt: (
        <p>
          Four rungs at 10¹⁶, 10¹⁷, 10¹⁸ and 10¹⁹ FLOPs reach losses 3.07, 2.60, 2.31 and 2.11. Choosing E from 1.5, 1.6,
          1.7, 1.8, 1.9 and 2.0 by the smallest squared error of the log-space fit, what loss is predicted at 10²⁰ FLOPs?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.974, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the learning rate, mixture and a target loss in hand, the next lesson launches the main run and watches it
        against that target.
      </p>
    </>
  ),
};
