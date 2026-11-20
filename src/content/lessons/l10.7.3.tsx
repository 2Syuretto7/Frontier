import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProxyExtrapolationViz } from "@/components/viz/ProxyExtrapolationViz";
import type { LessonContent } from "@/lib/types";

const EXTRAPOLATE = `import math

def fit_power(xs, ys):
    lx = [math.log(x) for x in xs]
    ly = [math.log(y) for y in ys]
    n = len(xs)
    mx, my = sum(lx) / n, sum(ly) / n
    b = sum((u - mx) * (v - my) for u, v in zip(lx, ly)) / sum((u - mx) ** 2 for u in lx)
    return math.exp(my - b * mx), b

def fit_power_floor(xs, ys, floors):
    best = None
    for e in floors:
        if e >= min(ys):
            continue
        a, b = fit_power(xs, [y - e for y in ys])
        sse = sum((e + a * x ** b - y) ** 2 for x, y in zip(xs, ys))
        if best is None or sse < best[0]:
            best = (sse, a, b, e)
    return best[1], best[2], best[3]

def predict(params, x):
    return params[0] * x ** params[1] + (params[2] if len(params) > 2 else 0.0)`;

const DECIDE = `import math

def kendall_tau(u, v):
    sgn = lambda t: (t > 0) - (t < 0)
    n = len(u)
    s = sum(sgn(u[i] - u[j]) * sgn(v[i] - v[j]) for i in range(n) for j in range(i + 1, n))
    return 2 * s / (n * (n - 1))

def top_choice_agrees(proxy, target):
    return max(range(len(proxy)), key=lambda i: proxy[i]) == max(range(len(target)), key=lambda i: target[i])

def flip_prob(gap, sd, seeds):
    return 0.5 * (1 + math.erf(-gap / (sd * math.sqrt(2 / seeds) * math.sqrt(2))))`;

export const lesson: LessonContent = {
  id: "l10.7.3",
  minutes: 50,
  links: {
    requires: ["l10.7.2", "l8.4.1"],
    revisits: ["l8.4.5", "l8.5.1", "l8.6.3", "l10.2.4"],
    foreshadows: ["l10.7.4", "l11.3.1"],
  },

  puzzle: (
    <>
      <p>
        A team compares four data mixtures by training a 100-million-parameter model on each, picks the winner, and trains a
        70-billion-parameter model on it. A second team fits a power law to five small runs and predicts the large model&apos;s loss to
        within a percent. A third team finds that a trick which helped every small model hurts the large one. All three relied on small
        models standing in for a large one. When does that work, and how would you know in advance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A small-scale proxy is useful in two different ways. It can predict a number at large scale, which needs the right functional
        form and enough range to pin it down, or it can make a decision, which needs only that the proxy ranks the options in the same
        order as the target. The second is easier, but it fails when options interact with scale, when hyperparameters do not transfer,
        or when the gap between options is smaller than the noise of one small run.
      </p>
      <ProxyExtrapolationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="extrapolating a fit">
        <p>
          A power law <M>{"y = a x^{b}"}</M> is a straight line in log-log space, so it can be fitted by least squares on{" "}
          <M>{"\\log x"}</M> and <M>{"\\log y"}</M> (<C>fit_power</C>, l8.4.1). Losses usually approach an irreducible floor e, so a better
          form is <M>{"y = e + a x^{b}"}</M>, fitted by trying candidate floors and keeping the one with the smallest squared error in the
          original units (<C>fit_power_floor</C>). Predictions follow from the fitted parameters (<C>predict</C>).
        </p>
        <Code>{EXTRAPOLATE}</Code>
      </Definition>

      <Remark title="how extrapolation goes wrong">
        <p>
          Errors in the fitted exponent grow linearly in log-distance: a slope wrong by <M>{"\\delta"}</M> gives a prediction off by a
          factor <M>{"x^{\\delta}"}</M> relative to the fitted range, so extrapolating three decades turns a small slope error into a large
          one. A wrong form is worse than noise, because it gives a confident, biased answer, as the pure power law in the visualisation
          shows. Report the extrapolation distance in decades with every prediction, and check the method by holding out the largest
          small run: fit the rest, predict it, and see how far off you are. Downstream accuracy is harder still, because it can jump
          sharply with scale (l8.6.3); predict a smooth quantity such as loss first and then map loss to accuracy (l8.4.5).
        </p>
      </Remark>

      <Definition title="rank agreement">
        <p>
          When the proxy is used to choose, what matters is whether it orders the options as the target does. Kendall&apos;s tau compares
          every pair: <M>{"\\tau = \\frac{2}{n(n-1)} \\sum_{i<j} \\operatorname{sgn}(u_i - u_j)\\operatorname{sgn}(v_i - v_j)"}</M>, which is
          1 for identical orders and −1 for reversed ones (<C>kendall_tau</C>). For a single decision, the question is narrower: does the
          proxy&apos;s best option match the target&apos;s best (<C>top_choice_agrees</C>)?
        </p>
        <Code>{DECIDE}</Code>
      </Definition>

      <Theorem title="noise flips close decisions">
        <p>
          Suppose two options differ by a true gap g at proxy scale, and each run has independent noise of standard deviation{" "}
          <M>{"\\sigma"}</M>. Comparing the means of n seeds per option ranks them the wrong way with probability{" "}
          <M>{"\\Phi\\!\\left(-g \\big/ \\sigma\\sqrt{2/n}\\right)"}</M> (<C>flip_prob</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Each mean has variance <M>{"\\sigma^2/n"}</M>, and they are independent, so their difference is approximately normal with mean g
          and variance <M>{"2\\sigma^2/n"}</M>. The order is wrong when the difference is negative, which has probability{" "}
          <M>{"\\Phi(-g/\\sqrt{2\\sigma^2/n})"}</M>. Pairing runs by seed and data order lowers the variance of the difference when their
          noise is shared (l10.2.2), and the same formula then applies with the variance of the paired difference.
        </p>
      </Proof>

      <Remark title="when rankings do not transfer">
        <p>
          Some choices interact with scale. A regulariser that helps a small model starved of parameters can hurt a large one; a change
          that speeds early training can lose at a longer horizon; and hyperparameters tuned for one width are wrong for another unless the
          parametrisation is chosen so that they transfer (l8.5.1). The defence is to test the proxy before trusting it: run the comparison
          at two or three small scales, check that the ranking is stable and the gaps are not shrinking towards zero, and confirm on one
          intermediate scale before committing the large run.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The first team needed only the order, and data mixtures usually rank consistently across scales, though one small run per
          mixture can flip a close comparison. The second team predicted a smooth quantity with a form that had worked before and checked
          it on held-out small runs. The third team&apos;s trick interacted with scale, which runs at two small sizes with a shrinking gap would
          have hinted at.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "extrap",
      rung: "check",
      prompt: (
        <p>
          Two small runs reach loss 4.0 at 1e18 FLOPs and 3.2 at 1e20 FLOPs. Fitting a pure power law through them, what loss does it
          predict at 1e24 FLOPs? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.048, tolerance: 0.002 },
    },
    {
      key: "tau",
      rung: "check",
      prompt: (
        <p>
          Five configurations score 0.52, 0.55, 0.61, 0.58 and 0.49 on the proxy and 0.60, 0.66, 0.73, 0.70 and 0.62 at the target scale.
          What is Kendall&apos;s tau between the two?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "trust",
      rung: "apply",
      prompt: (
        <p>
          A change improves loss by 0.04 at 10 million parameters, 0.02 at 30 million and 0.01 at 100 million, with seed noise about 0.005.
          The target is 10 billion parameters. What is the best reading?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The gain is shrinking with scale and may vanish or reverse at the target, so test at a larger intermediate scale first",
          "The gain is significant at every scale, so it will help at the target",
          "Average the three gains and expect about 0.023 at the target",
          "Small models are uninformative, so ignore the results",
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

def fit_power(xs, ys):
    lx = [math.log(x) for x in xs]
    ly = [math.log(y) for y in ys]
    n = len(xs)
    mx, my = sum(lx) / n, sum(ly) / n
    b = sum((u - mx) * (v - my) for u, v in zip(lx, ly)) / sum((u - mx) ** 2 for u in lx)
    return math.exp(my - b * mx), b

def fit_power_floor(xs, ys, floors):
    best = None
    for e in floors:
        if e >= min(ys):
            continue
        a, b = fit_power(xs, [y - e for y in ys])
        sse = sum((e + a * x ** b - y) ** 2 for x, y in zip(xs, ys))
        if best is None or sse < best[0]:
            best = (sse, a, b, e)
    return best[1], best[2], best[3]

def predict(params, x):
    return params[0] * x ** params[1] + (params[2] if len(params) > 2 else 0.0)

a, b = fit_power([1, 10, 100], [8.0, 4.0, 2.0])
print(round(a, 3), round(b, 3), round(predict((a, b), 1000), 3), round(predict((a, b, 1.0), 1000), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8.0 -0.301 1.0 2.0",
          "8.0 -0.5 1.0 2.0",
          "8.0 -0.301 1.0 1.0",
          "4.0 -0.301 0.5 1.5",
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

def kendall_tau(u, v):
    sgn = lambda t: (t > 0) - (t < 0)
    n = len(u)
    s = sum(sgn(u[i] - u[j]) * sgn(v[i] - v[j]) for i in range(n) for j in range(i + 1, n))
    return 2 * s / (n * (n - 1))

def top_choice_agrees(proxy, target):
    return max(range(len(proxy)), key=lambda i: proxy[i]) == max(range(len(target)), key=lambda i: target[i])

def flip_prob(gap, sd, seeds):
    return 0.5 * (1 + math.erf(-gap / (sd * math.sqrt(2 / seeds) * math.sqrt(2))))

p, t = [0.61, 0.58, 0.64, 0.60], [0.70, 0.66, 0.71, 0.72]
print(round(kendall_tau(p, t), 3), top_choice_agrees(p, t), round(flip_prob(0.0, 1.0, 4), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.333 False 0.5",
          "0.667 False 0.5",
          "0.333 True 0.5",
          "0.333 False 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_power(xs, ys)</C>, returning a and b of <M>{"y = a x^{b}"}</M> by least squares in log-log space;{" "}
          <C>fit_power_floor(xs, ys, floors)</C>, which skips floors at or above the smallest y, fits the rest with <C>fit_power</C>, and
          returns (a, b, e) with the smallest squared error in the original units; and <C>predict(params, x)</C>, which adds the floor when
          params has three entries.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fit_power(xs, ys):
    return 1.0, 0.0

def fit_power_floor(xs, ys, floors):
    return 1.0, 0.0, 0.0

def predict(params, x):
    return 0.0
`,
        solution: EXTRAPOLATE,
        tests: [
          { name: "power", code: `a, b = fit_power([2, 4, 8], [5 * 2 ** -0.3, 5 * 4 ** -0.3, 5 * 8 ** -0.3])\nassert abs(a - 5) < 1e-9 and abs(b + 0.3) < 1e-9\nassert abs(predict((a, b, 0.5), 16) - 2.6763764082) < 1e-8` },
          { name: "floor", code: `xs = [1, 2, 4, 8, 16, 32]\na, b, e = fit_power_floor(xs, [2 + 3 * x ** -0.5 for x in xs], [i / 100 for i in range(400)])\nassert abs(a - 3) < 1e-9 and abs(b + 0.5) < 1e-9 and abs(e - 2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kendall_tau(u, v)</C>, counting tied pairs as zero; <C>top_choice_agrees(proxy, target)</C>, true when the index of
          the highest score is the same in both; and <C>flip_prob(gap, sd, seeds)</C>, the chance that comparing means of{" "}
          <C>seeds</C> runs per option orders them wrongly.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def kendall_tau(u, v):
    return 0.0

def top_choice_agrees(proxy, target):
    return False

def flip_prob(gap, sd, seeds):
    return 0.0
`,
        solution: DECIDE,
        tests: [
          { name: "tau", code: `assert abs(kendall_tau([1, 2, 3, 4], [4, 3, 2, 1]) + 1) < 1e-12\nassert abs(kendall_tau([1, 2, 2, 3], [1, 3, 2, 4]) - 5 / 6) < 1e-12` },
          { name: "decide", code: `assert top_choice_agrees([3, 9, 1], [2, 8, 5]) and not top_choice_agrees([3, 9, 1], [9, 8, 5])\nassert abs(flip_prob(1.0, 2.0, 2) - 0.3085375387) < 1e-9` },
        ],
      },
    },
    {
      key: "seeds",
      rung: "stretch",
      prompt: (
        <p>
          Two data mixtures differ by a true 0.5 points at proxy scale, and each proxy run has independent noise with standard deviation 0.4
          points. What is the smallest number of seeds per mixture for which comparing the means orders them wrongly less than 1% of the
          time?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Many proxy experiments end with no effect, or with an effect that vanished at scale. The next lesson is about reporting those
        results so that they are believed and useful.
      </p>
    </>
  ),
};
