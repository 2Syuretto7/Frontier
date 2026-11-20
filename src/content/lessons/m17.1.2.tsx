import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SawtoothViz } from "@/components/viz/SawtoothViz";
import type { LessonContent } from "@/lib/types";

const SAW = `def tent(x):
    return 2 * max(0.0, x) - 4 * max(0.0, x - 0.5)

def sawtooth(x, k):
    for _ in range(k):
        x = tent(x)
    return x

def count_pieces(f, m=4096):
    xs = [i / m for i in range(m + 1)]
    slopes = [round((f(xs[i + 1]) - f(xs[i])) * m, 6) for i in range(m)]
    return 1 + sum(1 for i in range(1, m) if slopes[i] != slopes[i - 1])`;

const SQUARE = `def square_approx(x, m):
    total, g = x, x
    for s in range(1, m + 1):
        g = 2 * max(0.0, g) - 4 * max(0.0, g - 0.5)
        total -= g / 4 ** s
    return total

def max_error(m, n=2048):
    return max(abs(square_approx(i / n, m) - (i / n) ** 2) for i in range(n + 1))

def layers_needed(eps):
    m = 0
    while 4.0 ** -(m + 1) > eps:
        m += 1
    return m`;

export const lesson: LessonContent = {
  id: "m17.1.2",
  minutes: 45,
  links: {
    requires: ["m17.1.1"],
    revisits: ["l3.5.3", "m8.8.5"],
    foreshadows: ["m17.1.3", "m17.2.4"],
  },

  puzzle: (
    <>
      <p>
        One hidden layer is universal, so depth is never necessary for approximation. Yet every successful architecture is
        deep. Is depth merely an optimisation convenience, or are there functions that a deep network computes with a
        handful of units and a shallow one cannot match without an astronomical width?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A ReLU network in one variable computes a piecewise-linear function, and the number of pieces measures its
        complexity. Adding units adds pieces; composing layers multiplies them. The tent map folds [0, 1] onto itself, so k
        folds produce <M>{"2^k"}</M> teeth from 2k units, while a single layer of m units makes at most m + 1 pieces.
      </p>
      <SawtoothViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="counting pieces">
        <p>Let f and g be continuous piecewise-linear functions on an interval with p and q pieces. Then</p>
        <ul>
          <li>f + g has at most p + q − 1 pieces;</li>
          <li>relu ∘ f has at most 2p pieces;</li>
          <li>g ∘ f has at most p·q pieces.</li>
        </ul>
        <p>
          Hence a one-hidden-layer ReLU network with m units has at most m + 1 pieces, and a network of depth L with m units per
          layer has at most <M>{"(2m)^L"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The breakpoints of a sum are among the union of breakpoints, giving at most (p − 1) + (q − 1) of them. On each piece
          of f, relu ∘ f breaks at most once, where f crosses 0. On each piece of f, g ∘ f is g restricted to an interval, which
          has at most q pieces. The bounds for networks follow by induction over units and layers.
        </p>
      </Proof>

      <Example title="the tent map">
        <p>
          <M>{"t(x) = 2\\,\\mathrm{relu}(x) - 4\\,\\mathrm{relu}(x - \\tfrac12)"}</M> maps [0, 1] onto itself, rising on the left half and falling
          on the right. Its k-fold composition <M>{"t^{(k)}"}</M> is a sawtooth with <M>{"2^k"}</M> pieces and <M>{"2^{k-1}"}</M> teeth, built from 2k units
          in k layers (<C>tent</C>, <C>sawtooth</C>, <C>count_pieces</C>).
        </p>
        <Code>{SAW}</Code>
      </Example>

      <Theorem title="Telgarsky's separation">
        <p>If g is continuous piecewise linear on [0, 1] with at most p pieces, then</p>
        <MD>{"\\int_0^1 \\big| t^{(k)}(x) - g(x) \\big|\\, dx \\ge \\frac18 \\Big(1 - \\frac{p}{2^k}\\Big)."}</MD>
        <p>
          So a shallow ReLU network needs at least <M>{"2^{k-1}"}</M> units to reach error 1/16 against a deep network of 2k units.
        </p>
      </Theorem>
      <Proof>
        <p>
          The graph of <M>{"t^{(k)}"}</M> and the line y = ½ bound <M>{"2^{k+1}"}</M> triangles, alternately above and below the line, each with
          base <M>{"2^{-k-1}"}</M>, height ½ and area <M>{"2^{-k-3}"}</M>. Group them into <M>{"2^k"}</M> consecutive pairs, one above and one below. Each
          linear piece of g crosses ½ at most once (a piece lying on ½ can be counted on either side), so g − ½ changes sign
          inside at most p of the pairs&apos; base intervals. On every other pair, g stays on one side of ½ across both triangles,
          so the error over the triangle on the other side is at least its area. That leaves at least <M>{"2^k - p"}</M> triangles, and{" "}
          <M>{"(2^k - p)\\, 2^{-k-3}"}</M> is the bound.
        </p>
      </Proof>

      <Theorem title="deep networks square efficiently">
        <p>
          With <M>{"g_s = t^{(s)}"}</M>, the function <M>{"x - \\sum_{s=1}^{m} g_s(x)/4^s"}</M> is the piecewise-linear interpolant of x² at the
          points <M>{"j/2^m"}</M>, so its error on [0, 1] is <M>{"4^{-(m+1)}"}</M> (<C>square_approx</C>, <C>max_error</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The interpolant of x² on a grid of spacing h differs from the interpolant on spacing 2h by a sum of tents of height{" "}
          <M>{"h^2"}</M>, one per coarse cell; these tents are exactly <M>{"g_s/4^s"}</M> for <M>{"h = 2^{-s}"}</M>. The error of linear interpolation of x² on
          spacing h is <M>{"h^2/4"}</M>. Since xy = ((x + y)² − x² − y²)/2, deep ReLU networks multiply to accuracy ε with O(log 1/ε)
          units, and so approximate polynomials and smooth functions far more cheaply than shallow ones (Yarotsky).
        </p>
        <Code>{SQUARE}</Code>
      </Proof>

      <Remark title="what separations do and do not show">
        <p>
          In higher dimensions, Eldan and Shamir found radial functions on <M>{"\\mathbb R^d"}</M> computed by depth-3 networks of
          polynomial size that depth-2 networks approximate only with width exponential in d. These results are about
          expressivity: they do not say that gradient descent finds the efficient deep representation, and highly
          oscillating functions like the sawtooth are in fact hard to train. Residual connections (l3.5.3) and careful
          scaling (m17.2.4) are what make depth usable.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pieces",
      rung: "check",
      prompt: <p>How many linear pieces does the 5-fold composition of the tent map have on [0, 1]?</p>,
      answer: { kind: "numeric", value: 32, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A shallow network with at most 16 pieces approximates the 6-fold tent composition. Evaluate Telgarsky&apos;s lower bound on
          the L¹ error. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0938, tolerance: 0.0001 },
    },
    {
      key: "compose",
      rung: "apply",
      prompt: <p>Why do layers multiply the number of pieces while units within a layer only add them?</p>,
      answer: {
        kind: "choice",
        options: [
          "Composition applies the outer function's pieces inside each piece of the inner function",
          "Deeper layers have more parameters per unit",
          "ReLU doubles the number of pieces at every unit",
          "Sums of piecewise-linear functions are always linear",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tent(x):
    return 2 * max(0.0, x) - 4 * max(0.0, x - 0.5)

def sawtooth(x, k):
    for _ in range(k):
        x = tent(x)
    return x

def count_pieces(f, m=4096):
    xs = [i / m for i in range(m + 1)]
    slopes = [round((f(xs[i + 1]) - f(xs[i])) * m, 6) for i in range(m)]
    return 1 + sum(1 for i in range(1, m) if slopes[i] != slopes[i - 1])

print(tent(0.25), tent(0.75), sawtooth(0.25, 2), sawtooth(0.125, 3), round(sawtooth(1 / 3, 4), 4))
print(count_pieces(tent), count_pieces(lambda x: sawtooth(x, 3)), count_pieces(lambda x: tent(x) + x), count_pieces(lambda x: abs(x - 0.5)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.5 1.0 1.0 0.6667\n2 8 2 2",
          "0.5 0.5 1.0 0.0 0.6667\n2 8 2 2",
          "0.5 0.5 1.0 1.0 0.3333\n2 6 3 2",
          "0.5 1.5 0.0 1.0 0.6667\n2 8 2 3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def square_approx(x, m):
    total, g = x, x
    for s in range(1, m + 1):
        g = 2 * max(0.0, g) - 4 * max(0.0, g - 0.5)
        total -= g / 4 ** s
    return total

def max_error(m, n=2048):
    return max(abs(square_approx(i / n, m) - (i / n) ** 2) for i in range(n + 1))

def layers_needed(eps):
    m = 0
    while 4.0 ** -(m + 1) > eps:
        m += 1
    return m

print(square_approx(0.5, 1), square_approx(0.25, 1), square_approx(0.25, 2), max_error(0) == 0.25)
print(round(max_error(1), 4), round(max_error(2), 4), layers_needed(0.01), layers_needed(0.25))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 0.125 0.0625 True\n0.0625 0.0156 3 0",
          "0.25 0.25 0.0625 True\n0.0625 0.0156 3 0",
          "0.25 0.125 0.0625 False\n0.125 0.0312 4 1",
          "0.5 0.125 0.0625 True\n0.0625 0.0156 2 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tent(x)</C> as 2·relu(x) − 4·relu(x − ½), <C>sawtooth(x, k)</C> composing it k times, and{" "}
          <C>count_pieces(f, m)</C>, counting linear pieces of f on [0, 1] from slopes between the grid points i/m, rounded to 6
          decimals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tent(x):
    return x

def sawtooth(x, k):
    return x

def count_pieces(f, m=4096):
    return 1
`,
        solution: SAW,
        tests: [
          { name: "tent", code: `assert abs(tent(0.1) - 0.2) < 1e-12 and abs(tent(0.9) - 0.2) < 1e-12 and abs(sawtooth(0.1, 3) - 0.8) < 1e-12` },
          { name: "pieces", code: `assert count_pieces(lambda x: sawtooth(x, 2)) == 4 and count_pieces(lambda x: 0.0) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>square_approx(x, m)</C> = x − Σ g_s(x)/4ˢ for s = 1, …, m, where g_s is the s-fold tent; <C>max_error(m, n)</C>, its
          largest error against x² on the points i/n; and <C>layers_needed(eps)</C>, the smallest m with <M>{"4^{-(m+1)} \\le"}</M> eps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def square_approx(x, m):
    return x

def max_error(m, n=2048):
    return 0.0

def layers_needed(eps):
    return 0
`,
        solution: SQUARE,
        tests: [
          { name: "square", code: `assert abs(square_approx(0.75, 1) - 0.625) < 1e-12 and abs(square_approx(0.5, 2) - 0.25) < 1e-12` },
          { name: "error", code: `assert abs(max_error(1) - 0.0625) < 1e-9 and layers_needed(0.001) == 4` },
        ],
      },
    },
    {
      key: "yarotsky",
      rung: "stretch",
      prompt: (
        <p>
          The deep squaring network uses three tent layers (m = 3). Using the interpolation argument, compute its sup error
          against x² on [0, 1]. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0039, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Depth buys composition. Transformers compose attention and MLP layers, and the right question about them is what
        computations a fixed number of layers can carry out: which formal languages they recognise, and what they can count.
      </p>
    </>
  ),
};
