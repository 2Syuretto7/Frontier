import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RepetitionViz } from "@/components/viz/RepetitionViz";
import type { LessonContent } from "@/lib/types";

const EFFECTIVE = `import math

def effective_data(unique, epochs, rstar=15.4):
    R = epochs - 1
    return unique + unique * rstar * (1 - math.exp(-R / rstar))

def chinchilla_loss(N, D):
    return 1.69 + 406.4 / N ** 0.34 + 410.7 / D ** 0.28

def loss_with_repeats(N, unique, epochs):
    return chinchilla_loss(N, effective_data(unique, epochs))`;

const FIT = `import math

def extra_value(R, rstar):
    return rstar * (1 - math.exp(-R / rstar))

def fit_rstar(points, lo=1.0, hi=50.0, steps=4901):
    best_err, best_r = None, None
    for i in range(steps):
        r = lo + (hi - lo) * i / (steps - 1)
        err = sum((extra_value(R, r) - v) ** 2 for R, v in points)
        if best_err is None or err < best_err:
            best_err, best_r = err, r
    return best_r

def half_value_epochs(rstar):
    return 1 + rstar * math.log(2)`;

export const lesson: LessonContent = {
  id: "l8.1.3",
  minutes: 50,
  links: {
    requires: ["l8.1.2", "m17.5.3"],
    revisits: ["m9.2.2", "l1.5.1"],
    foreshadows: ["l8.4.3", "l8.4.4"],
  },

  puzzle: (
    <>
      <p>
        Compute grows several-fold each year, and compute-optimal training asks for proportionally more tokens. Good public
        text does not grow that fast: estimates put the whole stock of usable human-written web text at a few hundred trillion
        tokens, within reach of frontier runs this decade. When the fresh data runs out, can you simply train on the same data
        again, and how much is a second pass worth?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A second look at a document teaches the model less than the first, because much of what it had to offer has already
        been learned, and every further pass teaches less again. Experiments show the decay is gentle at first: a few epochs
        are almost as good as fresh data. After that the value of each repeat falls away exponentially, and a pool of unique
        tokens can never be worth more than a fixed multiple of its size, however long you train on it.
      </p>
      <RepetitionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="effective data">
        <p>
          Train for <M>{"D = U(1 + R)"}</M> tokens on a pool of U unique tokens, so that R is the number of repetitions beyond the first
          epoch. Muennighoff and colleagues model the run as worth
        </p>
        <MD>{"D' = U + U R^*\\big(1 - e^{-R/R^*}\\big)"}</MD>
        <p>
          fresh tokens (<C>effective_data</C>), and fit <M>{"R^* \\approx 15.4"}</M> from hundreds of runs. Substituting D′ for D in the
          Chinchilla loss <M>{"L(N, D) = E + A/N^{\\alpha} + B/D^{\\beta}"}</M> predicts the loss of a data-constrained run (<C>chinchilla_loss</C>,{" "}
          <C>loss_with_repeats</C>). A similar decay with <M>{"R^*_N \\approx 5.3"}</M> discounts parameters that are in excess of what the unique
          data can use.
        </p>
        <Code>{EFFECTIVE}</Code>
      </Definition>

      <Theorem title="the value of a repeat">
        <p>
          Under this model the r-th repetition of a token is worth <M>{"e^{-r/R^*}"}</M> of a fresh token, and the whole pool can never be
          worth more than <M>{"U(1 + R^*)"}</M>. The extra value from R repeats (<C>extra_value</C>) is a fraction{" "}
          <M>{"R^*(1 - e^{-R/R^*})/R"}</M> of what R fresh epochs would give, which is above 0.9 for <M>{"R \\le 3"}</M>. A repeat is worth half a
          fresh token once <M>{"R = R^* \\ln 2"}</M>, that is after <M>{"1 + R^* \\ln 2"}</M> epochs (<C>half_value_epochs</C>).
        </p>
        <Code>{FIT}</Code>
      </Theorem>
      <Proof>
        <p>
          The derivative of <M>{"D'"}</M> with respect to the number of repeated tokens UR is{" "}
          <M>{"\\frac{d}{d(UR)}\\, U R^*\\big(1 - e^{-R/R^*}\\big) = e^{-R/R^*}"}</M>, the marginal worth of the next repeated token, which halves when{" "}
          <M>{"R = R^* \\ln 2"}</M>. As <M>{"R \\to \\infty"}</M> the exponential vanishes and <M>{"D' \\to U(1 + R^*)"}</M>. For the ratio, the function{" "}
          <M>{"(1 - e^{-x})/x"}</M> is decreasing and equals about 0.91 at <M>{"x = 3/15.4"}</M>.
        </p>
      </Proof>

      <Remark title="fitting the decay">
        <p>
          R* is not derived; it is fitted. Train models for different numbers of epochs, measure how many fresh tokens each run
          is worth by matching its loss on the fresh-data curve, and choose the R* that best fits those points (<C>fit_rstar</C>, here a
          grid search on squared error). Since a single constant summarises the decay, it can depend on the data: a pool of
          high-quality, diverse text tolerates more repetition than a narrow one, and very large models memorise faster.
        </p>
      </Remark>

      <Example title="what to do when the data runs out">
        <p>
          The data-constrained experiments rank the options. Up to about four epochs, repeating costs almost nothing. Mixing in
          code for up to about half the tokens costs nothing on natural-language tasks and stretches the budget. Relaxing quality
          filters adds tokens but each is worth less. Beyond these, current practice turns to synthetic data: rephrasing web
          pages into cleaner styles, such as encyclopaedia prose or question-and-answer pairs, lets the same underlying content
          be seen in new forms, and Maini and colleagues found it reached the same loss about three times faster. The
          compute-optimal rule itself bends when data is scarce: with fixed U, extra compute is better spent on more epochs than on
          more parameters, because excess parameters lose value faster (<M>{"R^*_N \\approx 5.3"}</M>) than repeated tokens. Training a model
          on more tokens than Chinchilla prescribes returns in l8.4.4, for a different reason.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "eff",
      rung: "check",
      prompt: <p>A run trains for three epochs on 200 billion unique tokens. With R* = 15.4, how many fresh tokens, in billions, is it worth? Give one decimal.</p>,
      answer: { kind: "numeric", value: 575.1, tolerance: 0.1 },
    },
    {
      key: "half",
      rung: "check",
      prompt: <p>With R* = 15.4, after how many epochs in total is the next repeated token worth half a fresh one? Give two decimals.</p>,
      answer: { kind: "numeric", value: 11.67, tolerance: 0.01 },
    },
    {
      key: "cap",
      rung: "apply",
      prompt: <p>Why can a fixed pool of U unique tokens never be worth more than about 16.4U fresh tokens under this model?</p>,
      answer: {
        kind: "choice",
        options: [
          "The worth of each further repetition decays exponentially, so the total extra value is a convergent sum bounded by R* times U",
          "After 16.4 epochs the training loss reaches zero",
          "The optimiser stops updating parameters once a token has been seen 16 times",
          "Chinchilla scaling forbids more than 16.4 tokens per parameter",
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

def effective_data(unique, epochs, rstar=15.4):
    R = epochs - 1
    return unique + unique * rstar * (1 - math.exp(-R / rstar))

def chinchilla_loss(N, D):
    return 1.69 + 406.4 / N ** 0.34 + 410.7 / D ** 0.28

def loss_with_repeats(N, unique, epochs):
    return chinchilla_loss(N, effective_data(unique, epochs))

print(effective_data(100, 1), round(effective_data(100, 2), 2), round(effective_data(10, 1000) / 10, 2))
print(round(chinchilla_loss(1e9, 2e10), 4), round(loss_with_repeats(1e9, 1e10, 2) - chinchilla_loss(1e9, 2e10), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "100.0 196.82 16.4\n2.58 0.0024",
          "100.0 200.0 16.4\n2.58 0.0",
          "100.0 196.82 1000.0\n2.58 0.0024",
          "115.4 196.82 16.4\n2.58 -0.0024",
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

def extra_value(R, rstar):
    return rstar * (1 - math.exp(-R / rstar))

def fit_rstar(points, lo=1.0, hi=50.0, steps=4901):
    best_err, best_r = None, None
    for i in range(steps):
        r = lo + (hi - lo) * i / (steps - 1)
        err = sum((extra_value(R, r) - v) ** 2 for R, v in points)
        if best_err is None or err < best_err:
            best_err, best_r = err, r
    return best_r

def half_value_epochs(rstar):
    return 1 + rstar * math.log(2)

print(round(extra_value(5, 10), 4), extra_value(0, 3), round(extra_value(1000, 3), 4))
print(fit_rstar([(R, extra_value(R, 7.0)) for R in [1, 4, 16]]), round(half_value_epochs(1 / math.log(2)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.9347 0.0 3.0\n7.0 2.0",
          "3.9347 0.0 1000.0\n7.0 2.0",
          "5.0 0.0 3.0\n7.0 2.0",
          "3.9347 0.0 3.0\n1.0 1.6931",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>effective_data(unique, epochs, rstar)</C>, <C>chinchilla_loss(N, D)</C> with E = 1.69, A = 406.4, B = 410.7, α = 0.34 and
          β = 0.28, and <C>loss_with_repeats(N, unique, epochs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def effective_data(unique, epochs, rstar=15.4):
    return unique * epochs

def chinchilla_loss(N, D):
    return 1.69 + 406.4 / N ** 0.34 + 410.7 / D ** 0.28

def loss_with_repeats(N, unique, epochs):
    return chinchilla_loss(N, unique * epochs)
`,
        solution: EFFECTIVE,
        tests: [
          { name: "effective", code: `assert abs(effective_data(10, 3, 10) - 10 * (1 + 10 * (1 - math.exp(-0.2)))) < 1e-9 and effective_data(7, 1) == 7` },
          { name: "loss", code: `assert abs(loss_with_repeats(1e10, 1e11, 2) - chinchilla_loss(1e10, effective_data(1e11, 2))) < 1e-12 and abs(loss_with_repeats(1e10, 1e11, 2) - 2.1343984) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>extra_value(R, rstar)</C>, <C>fit_rstar(points, lo, hi, steps)</C>, a grid search over evenly spaced values from lo to hi
          that returns the one with the smallest squared error against the (R, value) points, keeping the first on ties, and{" "}
          <C>half_value_epochs(rstar)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def extra_value(R, rstar):
    return R

def fit_rstar(points, lo=1.0, hi=50.0, steps=4901):
    return lo

def half_value_epochs(rstar):
    return rstar / 2
`,
        solution: FIT,
        tests: [
          { name: "value", code: `assert abs(extra_value(10, 10) - 10 * (1 - math.exp(-1))) < 1e-12 and abs(half_value_epochs(10) - (1 + 10 * math.log(2))) < 1e-12` },
          { name: "fit", code: `pts = [(R, extra_value(R, 12.5)) for R in [2, 8, 30]]\nassert abs(fit_rstar(pts) - 12.5) < 1e-9 and abs(fit_rstar(pts, 1.0, 20.0, 39) - 12.5) < 1e-9` },
        ],
      },
    },
    {
      key: "ninety",
      rung: "stretch",
      prompt: (
        <p>
          With R* = 15.4, after how many epochs in total does a run reach 90 percent of the maximum worth <M>{"U(1 + R^*)"}</M> of its pool?
          Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 35.49, tolerance: 0.02 },
    },
  ],

  glimpse: (
    <>
      <p>
        Code and mathematics came up twice in this chapter: as a source that helps reasoning, and as extra tokens when text
        runs short. The next lesson looks at what is special about them as training data.
      </p>
    </>
  ),
};
