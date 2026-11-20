import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TimeHorizonViz } from "@/components/viz/TimeHorizonViz";
import type { LessonContent } from "@/lib/types";

const FIT = `import math

def predict(a, b, minutes):
    return 1 / (1 + math.exp(-(a + b * math.log2(minutes))))

def fit_logistic(minutes, success, iters, lr):
    a = b = 0.0
    xs = [math.log2(m) for m in minutes]
    for _ in range(iters):
        ga = gb = 0.0
        for x, y in zip(xs, success):
            p = 1 / (1 + math.exp(-(a + b * x)))
            ga += y - p
            gb += (y - p) * x
        a += lr * ga / len(xs)
        b += lr * gb / len(xs)
    return a, b

def horizon(a, b, p=0.5):
    return 2 ** ((math.log(p / (1 - p)) - a) / b)`;

const TREND = `import math

def log2_trend(years, horizons):
    ys = [math.log2(h) for h in horizons]
    n = len(years)
    mx, my = sum(years) / n, sum(ys) / n
    slope = sum((x - mx) * (y - my) for x, y in zip(years, ys)) / sum((x - mx) ** 2 for x in years)
    return slope, my - slope * mx

def doubling_months(slope):
    return 12 / slope

def extrapolate(h0, months, doubling):
    return h0 * 2 ** (months / doubling)`;

export const lesson: LessonContent = {
  id: "l10.4.3",
  minutes: 50,
  links: {
    requires: ["l10.4.2", "l1.3.1"],
    revisits: ["l8.4.5", "l10.1.2", "m9.5.2"],
    foreshadows: ["l10.5.1", "l10.7.3", "l13.4.2"],
  },

  puzzle: (
    <>
      <p>
        Benchmarks saturate and are replaced, so scores on different benchmarks cannot be put on one axis to track progress over years.
        METR (Kwa et al., 2025) proposed a common unit: the length of tasks, measured by how long skilled humans take, that a model can
        complete with 50% probability. Across models released from 2019 to 2024 they found this horizon doubling roughly every seven
        months. How is such a number estimated, and how far can a trend like that be trusted?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Human completion time is a rough but universal measure of difficulty: a task that takes an expert four hours is usually harder
        for a model than one that takes four minutes. Collect tasks of widely varying length, time humans on them, run the model, and
        fit a curve of success against the logarithm of human time. Where the curve crosses one half is the model&apos;s time horizon.
      </p>
      <TimeHorizonViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the time horizon">
        <p>
          Model the chance that the model solves a task taking humans t minutes as{" "}
          <M>{"P(\\text{success}) = \\sigma(a + b \\log_2 t)"}</M>, with b &lt; 0 (<C>predict</C>), fitted by maximum likelihood to
          per-task outcomes (<C>fit_logistic</C>, by gradient ascent on the mean log-likelihood; l1.3.1). The p-horizon is the t at which
          the curve equals p:
        </p>
        <MD>{"t_p = 2^{(\\operatorname{logit}(p) - a)/b}"}</MD>
        <p>
          (<C>horizon</C>). The 50% horizon is <M>{"2^{-a/b}"}</M>. Because the curve is shallow, the 80% horizon is several times shorter.
        </p>
        <Code>{FIT}</Code>
      </Definition>

      <Theorem title="a doubling time from a log-linear trend">
        <p>
          If <M>{"\\log_2 t_{50}"}</M> grows linearly with release date at slope s per year, the horizon doubles every 12/s months, and a
          horizon <M>{"h_0"}</M> becomes <M>{"h_0 \\cdot 2^{m/d}"}</M> after m months with doubling time d.
        </p>
      </Theorem>
      <Proof>
        <p>
          An increase of 1 in <M>{"\\log_2 t_{50}"}</M> is a doubling, and it takes 1/s years, or 12/s months (<C>doubling_months</C>). The
          slope is estimated by least squares of <M>{"\\log_2"}</M> horizon on date (<C>log2_trend</C>). After m months the log has
          increased by m/d, so the horizon has been multiplied by <M>{"2^{m/d}"}</M> (<C>extrapolate</C>). This is the same arithmetic as
          any exponential trend (l8.4.5); the uncertainty in s, from a bootstrap over tasks and models (m9.5.2), compounds when
          extrapolating, because an error in the slope multiplies the horizon by a factor that grows with the distance.
        </p>
        <Code>{TREND}</Code>
      </Proof>

      <Remark title="what the measure assumes">
        <p>
          Human time must be measured, not guessed, by timing skilled people who lack special context, and it varies between them. The
          task suite must cover a wide range of lengths, since the fit is anchored by tasks on both sides of the horizon. Tasks are
          mostly software and research engineering with automatic scoring; messier real work, with vague goals and no clear grader,
          may show shorter horizons. METR found horizons on its suite fairly consistent with other benchmarks, but the measure transfers
          only to tasks similar to those it was built from.
        </p>
      </Remark>

      <Example title="reading a horizon">
        <p>
          A fit gives a = 3 and b = −1 with t in minutes. The 50% horizon is <M>{"2^3 = 8"}</M> minutes and the 80% horizon is{" "}
          <M>{"2^{(1.386 - 3)/(-1)} \\approx 3.1"}</M> minutes. A system that must succeed reliably, not half the time, should be judged by
          the shorter figure.
        </p>
      </Example>

      <Remark title="extrapolation with care">
        <p>
          A doubling time fitted over a few years can change: METR noted that models released in 2024 and 2025 sat above the earlier
          trend, suggesting faster doubling. Trends in capability are driven by trends in compute, data and methods, any of which can
          speed up or stall. Forecasts should show a range of slopes, not one line, and should be checked as new models arrive.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "h50",
      rung: "check",
      prompt: (
        <p>
          A fit gives <M>{"P(\\text{success}) = \\sigma(2 - 0.5\\log_2 t)"}</M> with t in minutes. What is the 50% time horizon in minutes?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0.01 },
    },
    {
      key: "h80",
      rung: "check",
      prompt: <p>For the same fit, what is the 80% time horizon in minutes? Give two decimals.</p>,
      answer: { kind: "numeric", value: 2.34, tolerance: 0.01 },
    },
    {
      key: "slope",
      rung: "apply",
      prompt: (
        <p>
          Two models have the same 50% horizon of one hour, but model A&apos;s fitted slope b is much steeper (more negative) than B&apos;s.
          Which is more useful for tasks of ten minutes that must succeed almost every time?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "A: a steeper curve means higher success on tasks well below the horizon, so its 90% or 95% horizon is closer to an hour",
          "B: a shallower curve means it handles a wider range of tasks",
          "They are equally useful, since their 50% horizons are equal",
          "Neither, since the 50% horizon is above ten minutes",
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

def predict(a, b, minutes):
    return 1 / (1 + math.exp(-(a + b * math.log2(minutes))))

def fit_logistic(minutes, success, iters, lr):
    a = b = 0.0
    xs = [math.log2(m) for m in minutes]
    for _ in range(iters):
        ga = gb = 0.0
        for x, y in zip(xs, success):
            p = 1 / (1 + math.exp(-(a + b * x)))
            ga += y - p
            gb += (y - p) * x
        a += lr * ga / len(xs)
        b += lr * gb / len(xs)
    return a, b

def horizon(a, b, p=0.5):
    return 2 ** ((math.log(p / (1 - p)) - a) / b)

print(predict(0.0, -1.0, 1), round(predict(2.0, -1.0, 2), 3))
print(horizon(3.0, -1.0), round(horizon(3.0, -1.0, 0.8), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.731\n8.0 3.06",
          "0.5 0.731\n0.125 3.06",
          "0.5 0.269\n8.0 3.06",
          "0.5 0.731\n8.0 20.9",
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

def log2_trend(years, horizons):
    ys = [math.log2(h) for h in horizons]
    n = len(years)
    mx, my = sum(years) / n, sum(ys) / n
    slope = sum((x - mx) * (y - my) for x, y in zip(years, ys)) / sum((x - mx) ** 2 for x in years)
    return slope, my - slope * mx

def doubling_months(slope):
    return 12 / slope

def extrapolate(h0, months, doubling):
    return h0 * 2 ** (months / doubling)

print(log2_trend([0, 1, 2], [1, 4, 16]), doubling_months(2.0))
print(extrapolate(10, 14, 7), extrapolate(10, -7, 7))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2.0, 0.0) 6.0\n40.0 5.0",
          "(4.0, 1.0) 6.0\n40.0 5.0",
          "(2.0, 0.0) 24.0\n40.0 5.0",
          "(2.0, 0.0) 6.0\n20.0 5.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>predict(a, b, minutes)</C>, <C>fit_logistic(minutes, success, iters, lr)</C>, starting from a = b = 0 and taking{" "}
          <C>iters</C> steps of size <C>lr</C> along the gradient of the mean log-likelihood in <M>{"\\log_2"}</M> minutes, and{" "}
          <C>horizon(a, b, p=0.5)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def predict(a, b, minutes):
    return 0.5

def fit_logistic(minutes, success, iters, lr):
    return 0.0, 0.0

def horizon(a, b, p=0.5):
    return 1.0
`,
        solution: FIT,
        tests: [
          { name: "fit", code: `a, b = fit_logistic([1, 2, 4, 8, 16, 32, 1, 4, 16, 64], [1, 1, 1, 0, 1, 0, 1, 0, 0, 0], 5000, 0.5)\nassert abs(a - 2.7498596) < 1e-4 and abs(b + 1.0286945) < 1e-4` },
          { name: "horizon", code: `assert abs(horizon(2, -0.5) - 16) < 1e-9 and abs(horizon(1, -1, 0.5) - 2) < 1e-9 and abs(predict(1.0, -1.0, 2) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log2_trend(years, horizons)</C>, the least-squares slope and intercept of <M>{"\\log_2"}</M> horizon on year,{" "}
          <C>doubling_months(slope)</C>, and <C>extrapolate(h0, months, doubling)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log2_trend(years, horizons):
    return 0.0, 0.0

def doubling_months(slope):
    return slope

def extrapolate(h0, months, doubling):
    return h0
`,
        solution: TREND,
        tests: [
          { name: "trend", code: `s, c = log2_trend([2019, 2021, 2023], [0.1, 1.0, 8.0])\nassert abs(s - 1.5804820237) < 1e-9 and abs(c + 3194.2614793) < 1e-5` },
          { name: "double", code: `assert abs(doubling_months(1.5) - 8.0) < 1e-12 and abs(extrapolate(60, 21, 7) - 480) < 1e-9` },
        ],
      },
    },
    {
      key: "week",
      rung: "stretch",
      prompt: (
        <p>
          A model has a 50% horizon of one hour, and the horizon doubles every 7 months. If the trend holds, after how many months does it
          reach a 40-hour working week? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 37.3, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        Longer horizons bring capabilities that matter for safety as well as usefulness. The next module asks how to evaluate whether
        a model could cause serious harm, and how to be sure an evaluation has drawn out what the model can really do.
      </p>
    </>
  ),
};
