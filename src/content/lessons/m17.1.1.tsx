import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ActivationWidthViz } from "@/components/viz/ActivationWidthViz";
import type { LessonContent } from "@/lib/types";

const RELU = `def relu(z):
    return max(0.0, z)

def interp_net(f, n):
    knots = [i / n for i in range(n + 1)]
    slopes = [(f(knots[i + 1]) - f(knots[i])) * n for i in range(n)]
    units = [(knots[0], slopes[0])] + [(knots[i], slopes[i] - slopes[i - 1]) for i in range(1, n)]
    return f(0.0), units

def eval_net(net, x):
    c, units = net
    return c + sum(w * relu(x - t) for t, w in units)`;

const SIGMOID = `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-max(-60.0, min(60.0, z))))

def staircase(f, n, k, x):
    total = f(0.0)
    for i in range(1, n + 1):
        t = (i - 0.5) / n
        total += (f(i / n) - f((i - 1) / n)) * sigmoid(k * (x - t))
    return total

def sup_error(f, g, m=1000):
    return max(abs(f(i / m) - g(i / m)) for i in range(m + 1))`;

export const lesson: LessonContent = {
  id: "m17.1.1",
  minutes: 50,
  links: {
    requires: ["m8.8.5", "l3.1.4"],
    revisits: ["m8.8.4", "m16.5.4"],
    foreshadows: ["m17.1.2", "m17.3.1"],
  },

  puzzle: (
    <>
      <p>
        One hidden layer of ReLU units can approximate any continuous function on an interval: place a bend at each knot of
        a piecewise-linear interpolant. Does the same hold in many dimensions, and for every activation? A network whose
        units compute z² is perfectly non-linear, yet something must go wrong with it. And even when approximation is
        possible, how many units does it cost: does the count explode with the dimension, as it does for grids?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A one-hidden-layer network is a sum of ridge functions σ(w·x + b), each constant along a hyperplane. Universality
        asks whether such sums are dense. The answer depends only on whether σ is a polynomial: polynomials of bounded
        degree stay polynomials of that degree however many you add, while any other continuous σ can be bent into
        everything. How many units you need is a separate question, answered by how smooth the target is in a Fourier
        sense rather than by the dimension.
      </p>
      <ActivationWidthViz />
    </>
  ),

  theory: (
    <>
      <Definition title="shallow networks and universality">
        <p>For an activation σ : ℝ → ℝ, let</p>
        <MD>{"\\mathcal N_\\sigma = \\operatorname{span}\\{\\, x \\mapsto \\sigma(w \\cdot x + b) : w \\in \\mathbb R^d,\\ b \\in \\mathbb R \\,\\}."}</MD>
        <p>
          σ is universal if <M>{"\\mathcal N_\\sigma"}</M> is dense in C(K) under the sup norm for every compact <M>{"K \\subset \\mathbb R^d"}</M> and every d.
          In one dimension the ReLU interpolant of m8.8.5 shows ReLU is universal, with sup error at most{" "}
          <M>{"\\|f''\\|_\\infty / (8n^2)"}</M> for n pieces when f is twice differentiable (<C>interp_net</C>, <C>eval_net</C>).
        </p>
        <Code>{RELU}</Code>
      </Definition>

      <Theorem title="Leshno, Lin, Pinkus and Schocken">
        <p>A continuous activation σ is universal if and only if σ is not a polynomial.</p>
      </Theorem>
      <Proof>
        <p>
          If σ is a polynomial of degree p, every element of <M>{"\\mathcal N_\\sigma"}</M> is a polynomial of degree at most p, a closed
          finite-dimensional subspace, so it cannot be dense. That is the flat error of the square activation in the figure.
        </p>
        <p>
          Conversely, take σ smooth (the general case follows by convolving σ with a smooth bump, which keeps it non-polynomial
          and keeps the convolved units in the closure). <strong>Reduce to one dimension:</strong> sums of ridge functions{" "}
          <M>{"g(w \\cdot x)"}</M> with g continuous on ℝ include every <M>{"e^{w \\cdot x}"}</M>, whose span is a subalgebra separating points,
          hence dense in C(K) by Stone-Weierstrass. So it suffices that <M>{"\\mathcal N_\\sigma"}</M> in one variable approximates every
          continuous g on an interval. <strong>One dimension:</strong> difference quotients in w of <M>{"\\sigma(wt + b)"}</M> lie in the closure,
          and their limit at w = 0 is <M>{"\\partial_w^k \\sigma(wt + b)|_{w=0} = t^k \\sigma^{(k)}(b)"}</M>. Since σ is not a polynomial, for each k
          there is b with <M>{"\\sigma^{(k)}(b) \\ne 0"}</M>, so every monomial <M>{"t^k"}</M> is in the closure, and Weierstrass (m8.8.4) finishes.
        </p>
      </Proof>

      <Example title="sigmoid staircases">
        <p>
          Cybenko&apos;s original argument for the logistic sigmoid has a constructive shadow. A steep sigmoid <M>{"\\sigma(k(x - t))"}</M> is
          nearly a step at t, so a sum of n steep sigmoids with jumps <M>{"f(i/n) - f((i - 1)/n)"}</M> is a staircase that stays within
          the oscillation of f over one step of length 1/n (<C>staircase</C>, <C>sup_error</C>).
        </p>
        <Code>{SIGMOID}</Code>
      </Example>

      <Theorem title="Barron's rate">
        <p>
          Let f on <M>{"\\mathbb R^d"}</M> have Fourier transform with <M>{"C_f = \\int |\\omega|\\, |\\hat f(\\omega)|\\, d\\omega < \\infty"}</M>. For every
          probability measure μ on the ball of radius r and every n there is a network with n sigmoid units such that
        </p>
        <MD>{"\\Big( \\int (f - f_n)^2\\, d\\mu \\Big)^{1/2} \\le \\frac{2 r C_f}{\\sqrt n}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Writing f through its Fourier transform shows <M>{"f - f(0)"}</M> is in the closed convex hull of the functions{" "}
          <M>{"\\pm 2rC_f\\, \\sigma(w \\cdot x + b)"}</M>, up to an approximation of steps by sigmoids. Maurey&apos;s sampling argument: if f is an average{" "}
          <M>{"\\mathbb E\\, g_\\theta"}</M> of functions with <M>{"\\|g_\\theta\\| \\le B"}</M>, draw <M>{"\\theta_1, \\dots, \\theta_n"}</M> independently; the mean
          of <M>{"g_{\\theta_i}"}</M> has expected squared error at most <M>{"B^2/n"}</M>, as for any sample mean, so some choice does at least as well.
        </p>
      </Proof>

      <Remark title="the curse and its escape">
        <p>
          The exponent in Barron&apos;s rate does not depend on d. Grid constructions, by contrast, need about <M>{"\\varepsilon^{-d}"}</M> pieces for
          a Lipschitz target, and no method whose parameters depend continuously on f does better on the whole Lipschitz class.
          The escape is not free: <M>{"C_f"}</M> can itself grow with d, and the theorem says nothing about finding the network by
          training. Random features (m16.5.4) fix the inner weights and train only the output layer, which is what the figure
          does.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hat",
      rung: "check",
      prompt: <p>How many ReLU units are needed to write the hat function max(0, 1 − |x|) exactly as Σ cᵢ ReLU(x − tᵢ)?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "square",
      rung: "check",
      prompt: <p>The ReLU interpolant of x² on [0, 1] uses 10 equal pieces. What is its sup error?</p>,
      answer: { kind: "numeric", value: 0.0025, tolerance: 0.0001 },
    },
    {
      key: "poly",
      rung: "apply",
      prompt: <p>Why can no network with one hidden layer of units σ(z) = z³ approximate |x| on [−1, 1] to within 0.01?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every such network is a polynomial of degree at most 3, and these stay a fixed distance from |x|",
          "The units saturate for large inputs",
          "z³ is not continuous",
          "|x| is not differentiable, so no network can approximate it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def relu(z):
    return max(0.0, z)

def interp_net(f, n):
    knots = [i / n for i in range(n + 1)]
    slopes = [(f(knots[i + 1]) - f(knots[i])) * n for i in range(n)]
    units = [(knots[0], slopes[0])] + [(knots[i], slopes[i] - slopes[i - 1]) for i in range(1, n)]
    return f(0.0), units

def eval_net(net, x):
    c, units = net
    return c + sum(w * relu(x - t) for t, w in units)

net = interp_net(lambda x: x * x, 2); print(net, eval_net(net, 0.25), eval_net(net, 0.75), eval_net(net, 1.0))
hat = interp_net(lambda x: max(0.0, 1 - abs(4 * x - 2)), 4); print(hat[1], eval_net(hat, 0.5), eval_net(hat, 0.375))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.0, [(0.0, 0.5), (0.5, 1.0)]) 0.125 0.625 1.0\n[(0.0, 0.0), (0.25, 4.0), (0.5, -8.0), (0.75, 4.0)] 1.0 0.5",
          "(0.0, [(0.0, 0.5), (0.5, 1.5)]) 0.125 0.625 1.0\n[(0.0, 0.0), (0.25, 4.0), (0.5, -8.0), (0.75, 4.0)] 1.0 0.5",
          "(0.0, [(0.0, 0.5), (0.5, 1.0)]) 0.0625 0.5625 1.0\n[(0.0, 0.0), (0.25, 4.0), (0.5, -4.0), (0.75, -4.0)] 1.0 0.5",
          "(0.0, [(0.0, 0.5), (0.5, 1.0)]) 0.125 0.625 1.0\n[(0.25, 4.0), (0.5, -8.0), (0.75, 4.0)] 1.0 0.75",
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

def sigmoid(z):
    return 1 / (1 + math.exp(-max(-60.0, min(60.0, z))))

def staircase(f, n, k, x):
    total = f(0.0)
    for i in range(1, n + 1):
        t = (i - 0.5) / n
        total += (f(i / n) - f((i - 1) / n)) * sigmoid(k * (x - t))
    return total

def sup_error(f, g, m=1000):
    return max(abs(f(i / m) - g(i / m)) for i in range(m + 1))

print(round(sigmoid(0), 4), round(sigmoid(3), 4), round(staircase(lambda x: x, 2, 1000, 0.6), 4), round(staircase(lambda x: x, 2, 1000, 0.1), 4))
print(sup_error(lambda x: x, lambda x: x), round(sup_error(lambda x: x * x, lambda x: eval_net(interp_net(lambda y: y * y, 4), x)), 4), round(staircase(lambda y: y, 4, 1000, 0.9), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.9526 0.5 0.0\n0.0 0.0156 1.0",
          "0.5 0.9526 0.6 0.0\n0.0 0.0156 1.0",
          "0.5 0.9526 0.5 0.0\n0.0 0.0625 0.75",
          "0.0 0.9526 1.0 0.5\n0.0 0.0156 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relu(z)</C>; <C>interp_net(f, n)</C>, returning (c, units) where the network c + Σ w·relu(x − t) interpolates f
          at the knots i/n on [0, 1] and units lists (t, w) for t = 0, 1/n, …, (n − 1)/n; and <C>eval_net(net, x)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def relu(z):
    return 0.0

def interp_net(f, n):
    return 0.0, []

def eval_net(net, x):
    return 0.0
`,
        solution: RELU,
        tests: [
          { name: "linear", code: `c, units = interp_net(lambda x: 3 * x, 3)
assert c == 0.0 and len(units) == 3 and abs(units[0][1] - 3) < 1e-12 and all(abs(w) < 1e-12 for t, w in units[1:])` },
          { name: "values", code: `assert abs(eval_net(interp_net(lambda x: abs(x - 0.5), 2), 0.75) - 0.25) < 1e-12 and abs(eval_net(interp_net(lambda x: x ** 3, 2), 0.5) - 0.125) < 1e-12 and relu(-2) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sigmoid(z)</C>, clipping z to [−60, 60]; <C>staircase(f, n, k, x)</C>, equal to f(0) plus, for i = 1, …, n, the
          jump f(i/n) − f((i − 1)/n) times σ(k(x − (i − ½)/n)); and <C>sup_error(f, g, m)</C> over the points i/m of [0, 1].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sigmoid(z):
    return 0.5

def staircase(f, n, k, x):
    return 0.0

def sup_error(f, g, m=1000):
    return 0.0
`,
        solution: SIGMOID,
        tests: [
          { name: "steps", code: `assert sigmoid(-100) < 1e-20 and abs(staircase(lambda x: 2 * x, 1, 1000, 1.0) - 2.0) < 1e-9 and abs(staircase(lambda x: 2 * x, 1, 1000, 0.0)) < 1e-9` },
          { name: "error", code: `assert abs(sup_error(lambda x: x, lambda x: 0.0, 10) - 1.0) < 1e-12 and sup_error(math.sin, math.sin) == 0.0` },
        ],
      },
    },
    {
      key: "units",
      rung: "stretch",
      prompt: (
        <p>
          Using the bound <M>{"\\|f''\\|_\\infty h^2 / 8"}</M> for the interpolant on pieces of length h, find the smallest number of equal pieces
          that guarantees sup error at most 0.01 for f(x) = sin 2πx on [0, 1].
        </p>
      ),
      answer: { kind: "numeric", value: 23, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        One hidden layer suffices in principle, but the width it needs can be enormous. Some functions computed by small deep
        networks require exponentially wide shallow ones: that is depth separation.
      </p>
    </>
  ),
};
