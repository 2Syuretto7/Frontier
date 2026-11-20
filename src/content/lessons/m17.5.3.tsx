import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IsoFlopViz } from "@/components/viz/IsoFlopViz";
import type { LessonContent } from "@/lib/types";

const SPLIT = `def chinchilla_loss(N, D, p):
    return p['E'] + p['A'] / N ** p['alpha'] + p['B'] / D ** p['beta']

def flops(N, D):
    return 6 * N * D

def optimal_split(C, p):
    a, b = p['alpha'], p['beta']
    G = (a * p['A'] / (b * p['B'])) ** (1 / (a + b))
    return G * (C / 6) ** (b / (a + b)), (C / 6) ** (a / (a + b)) / G`;

const SEARCH = `import math

def isoflop_min(C, loss, lo, hi, steps):
    Ns = [lo * (hi / lo) ** (i / steps) for i in range(steps + 1)]
    return min(Ns, key=lambda N: loss(N, C / (6 * N)))

def tokens_per_param(N, D):
    return D / N

def fit_exponent(Cs, Ns):
    lx = [math.log(c) for c in Cs]
    ly = [math.log(n) for n in Ns]
    mx, my = sum(lx) / len(lx), sum(ly) / len(ly)
    return sum((u - mx) * (v - my) for u, v in zip(lx, ly)) / sum((u - mx) ** 2 for u in lx)`;

export const lesson: LessonContent = {
  id: "m17.5.3",
  minutes: 50,
  links: {
    requires: ["m17.5.2"],
    revisits: ["m5.5.5", "l5.3.3"],
    foreshadows: ["m17.6.1"],
  },

  puzzle: (
    <>
      <p>
        You have a fixed budget of floating point operations. You can train a large model on few tokens or a small model on
        many. In 2020 the accepted answer was to grow the model much faster than the data; in 2022 a careful study concluded
        that model size and data should grow in equal proportion, and that most large models of the day were undertrained.
        How can one decide, and why did the answers differ?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the loss has a power-law term for each resource, then at fixed compute, moving budget from data to parameters
        lowers one term and raises the other. The best split is where the marginal gains balance, and because both terms
        are powers, the optimum itself moves as a power of the budget, with an exponent set by the ratio of the two
        exponents.
      </p>
      <IsoFlopViz />
    </>
  ),

  theory: (
    <>
      <Definition title="compute and the parametric loss">
        <p>
          Training a dense transformer with N parameters on D tokens costs about <M>{"C = 6ND"}</M> floating point operations (<C>flops</C>):
          the forward pass does one multiply and one add per parameter per token, and the backward pass twice that. Model
          the final loss as
        </p>
        <MD>{"L(N, D) = E + \\frac{A}{N^\\alpha} + \\frac{B}{D^\\beta}"}</MD>
        <p>
          (<C>chinchilla_loss</C>), an irreducible term plus resolution-limited power laws in model size and data.
        </p>
        <Code>{SPLIT}</Code>
      </Definition>

      <Theorem title="the compute-optimal split">
        <p>
          Minimising L subject to 6ND = C gives
        </p>
        <MD>{"N^* = G\\Big(\\frac C6\\Big)^{\\frac{\\beta}{\\alpha+\\beta}}, \\qquad D^* = G^{-1}\\Big(\\frac C6\\Big)^{\\frac{\\alpha}{\\alpha+\\beta}}, \\qquad G = \\Big(\\frac{\\alpha A}{\\beta B}\\Big)^{\\frac{1}{\\alpha+\\beta}}"}</MD>
        <p>
          (<C>optimal_split</C>). At the optimum the two reducible terms are in the ratio <M>{"A N^{-\\alpha} : B D^{-\\beta} = \\beta : \\alpha"}</M>, and the
          reducible loss falls as <M>{"C^{-\\alpha\\beta/(\\alpha+\\beta)}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substitute <M>{"D = C/(6N)"}</M>: <M>{"L = E + AN^{-\\alpha} + B(C/6)^{-\\beta}N^{\\beta}"}</M>, a sum of a decreasing and an increasing
          power of N, strictly convex in log N, so the stationary point is the minimum. Setting{" "}
          <M>{"\\frac{dL}{dN} = -\\alpha A N^{-\\alpha-1} + \\beta B (C/6)^{-\\beta} N^{\\beta-1} = 0"}</M> gives{" "}
          <M>{"N^{\\alpha+\\beta} = \\frac{\\alpha A}{\\beta B}(C/6)^\\beta"}</M>, which is the formula for <M>{"N^*"}</M>, and <M>{"D^* = C/(6N^*)"}</M>. The same
          equation reads <M>{"\\alpha A N^{-\\alpha} = \\beta B D^{-\\beta}"}</M>, the stated ratio. Both terms are then proportional to{" "}
          <M>{"(N^*)^{-\\alpha} \\propto C^{-\\alpha\\beta/(\\alpha+\\beta)}"}</M>.
        </p>
      </Proof>

      <Example title="the Chinchilla fit">
        <p>
          Hoffmann and colleagues trained over 400 models and fitted E = 1.69, A = 406.4, B = 410.7, α = 0.34, β = 0.28, giving{" "}
          <M>{"N^* \\propto C^{0.45}"}</M> and <M>{"D^* \\propto C^{0.55}"}</M>, close to equal growth. Their two other methods, which find the
          optimum of each isoFLOP curve directly (<C>isoflop_min</C>) and fit exponents across budgets (<C>fit_exponent</C>), gave
          about 0.5 each and roughly 20 tokens per parameter (<C>tokens_per_param</C>). With the published rounded constants
          the parametric fit drifts from about 26 to about 98 tokens per parameter across the viz&apos;s range; a 2024
          replication by Besiroglu and colleagues found problems in that fit, and their corrected one agrees with about 20.
        </p>
        <Code>{SEARCH}</Code>
      </Example>

      <Remark title="why the 2020 answer differed, and what it leaves out">
        <p>
          Kaplan and colleagues had found <M>{"N^* \\propto C^{0.73}"}</M>. Later analyses attribute most of the difference to methodology:
          learning-rate schedules not matched to each run&apos;s length, which penalises the long runs of small models, and
          conventions for counting parameters and compute that matter at small scale. Compute-optimal is also not the only
          goal. A model that will serve many queries is cheaper to run when small, so modern models are often trained far
          beyond 20 tokens per parameter, accepting a worse loss for the compute in exchange for cheaper inference; and when
          unique data run out, repeated epochs are worth less than fresh tokens. Solvable random-feature models trained by
          gradient descent reproduce compute-optimal power laws and tie their exponents to the data spectrum of m17.5.1.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "flop",
      rung: "check",
      prompt: <p>How many FLOPs does it take to train a 7 billion parameter model on 2 trillion tokens? Give the answer in units of 10²².</p>,
      answer: { kind: "numeric", value: 8.4, tolerance: 0.001 },
    },
    {
      key: "expo",
      rung: "check",
      prompt: <p>With α = 0.34 and β = 0.28, N* grows as C to what power? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.4516, tolerance: 0.0002 },
    },
    {
      key: "ratio",
      rung: "apply",
      prompt: <p>At the compute-optimal split, how do the two reducible loss terms compare?</p>,
      answer: {
        kind: "choice",
        options: [
          "Their ratio, model term to data term, is β to α",
          "They are always equal",
          "The model term is always zero",
          "Their ratio is A to B",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def chinchilla_loss(N, D, p):
    return p['E'] + p['A'] / N ** p['alpha'] + p['B'] / D ** p['beta']

def flops(N, D):
    return 6 * N * D

def optimal_split(C, p):
    a, b = p['alpha'], p['beta']
    G = (a * p['A'] / (b * p['B'])) ** (1 / (a + b))
    return G * (C / 6) ** (b / (a + b)), (C / 6) ** (a / (a + b)) / G

p = {'E': 1.0, 'A': 1.0, 'B': 1.0, 'alpha': 0.5, 'beta': 0.5}; q = dict(p, A=4.0); print(chinchilla_loss(4, 16, p), flops(10, 100), optimal_split(600, p))
print(optimal_split(600, q), round(chinchilla_loss(40, 2.5, q), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.75 6000 (10.0, 10.0)\n(40.0, 2.5) 2.2649",
          "1.75 6000 (10.0, 10.0)\n(2.5, 40.0) 2.2649",
          "2.25 6000 (10.0, 10.0)\n(40.0, 2.5) 2.2649",
          "1.75 1000 (100.0, 1.0)\n(40.0, 2.5) 3.0",
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

def isoflop_min(C, loss, lo, hi, steps):
    Ns = [lo * (hi / lo) ** (i / steps) for i in range(steps + 1)]
    return min(Ns, key=lambda N: loss(N, C / (6 * N)))

def tokens_per_param(N, D):
    return D / N

def fit_exponent(Cs, Ns):
    lx = [math.log(c) for c in Cs]
    ly = [math.log(n) for n in Ns]
    mx, my = sum(lx) / len(lx), sum(ly) / len(ly)
    return sum((u - mx) * (v - my) for u, v in zip(lx, ly)) / sum((u - mx) ** 2 for u in lx)

L2 = lambda N, D: 1 / N ** 0.5 + 1 / D ** 0.5; print(tokens_per_param(1e9, 2e10), round(fit_exponent([1, 100], [3, 30]), 4), round(isoflop_min(600, L2, 1, 100, 200), 4))
L4 = lambda N, D: 4 / N ** 0.5 + 1 / D ** 0.5; print(round(isoflop_min(600, L4, 1, 100, 200), 2), round(fit_exponent([1e18, 1e20, 1e22], [1e8, 1e9, 1e10]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "20.0 0.5 10.0\n39.81 0.5",
          "20.0 1.0 10.0\n40.0 0.5",
          "0.05 0.5 10.0\n39.81 0.5",
          "20.0 0.5 1.0\n39.81 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chinchilla_loss(N, D, p)</C> for a dict p with keys E, A, B, alpha, beta; <C>flops(N, D)</C>; and{" "}
          <C>optimal_split(C, p)</C> returning (N*, D*).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def chinchilla_loss(N, D, p):
    return p['E']

def flops(N, D):
    return N * D

def optimal_split(C, p):
    return (C / 6) ** 0.5, (C / 6) ** 0.5
`,
        solution: SPLIT,
        tests: [
          { name: "loss", code: `p = {'E': 2.0, 'A': 8.0, 'B': 9.0, 'alpha': 1 / 3, 'beta': 0.5}\nassert abs(chinchilla_loss(8, 9, p) - 9.0) < 1e-12 and flops(2, 3) == 36` },
          { name: "split", code: `p = {'E': 0.0, 'A': 2.0, 'B': 1.0, 'alpha': 0.5, 'beta': 0.5}\nN, D = optimal_split(600, p)\nassert abs(N - 20) < 1e-9 and abs(D - 5) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>isoflop_min(C, loss, lo, hi, steps)</C>, the N minimising <C>loss(N, C / (6 * N))</C> on a log-spaced grid of
          steps + 1 points from lo to hi; <C>tokens_per_param(N, D)</C>; and <C>fit_exponent(Cs, Ns)</C>, the log-log least squares slope.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def isoflop_min(C, loss, lo, hi, steps):
    return lo

def tokens_per_param(N, D):
    return N / D

def fit_exponent(Cs, Ns):
    return 0.0
`,
        solution: SEARCH,
        tests: [
          { name: "search", code: `assert abs(isoflop_min(6 * 10 ** 4, lambda N, D: 1 / N ** 0.5 + 1 / D ** 0.5, 1, 10 ** 4, 400) - 100) < 1e-6` },
          { name: "fit", code: `assert tokens_per_param(2, 50) == 25 and abs(fit_exponent([1, 10, 1000], [2, 2 * 10 ** 0.4, 2 * 10 ** 1.2]) - 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "n3e23",
      rung: "stretch",
      prompt: (
        <p>
          Using the published Chinchilla constants, what is the compute-optimal model size for a budget of{" "}
          <M>{"3 \\times 10^{23}"}</M> FLOPs? Give it in billions of parameters to one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 24.0, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Scaling laws describe where training ends up. The last part of the course looks inside training itself: the
        plateaus and sudden drops of the loss curve, delayed generalisation, learning from context, and the hidden
        preferences of gradient descent.
      </p>
    </>
  ),
};
