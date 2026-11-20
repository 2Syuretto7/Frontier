import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CoveringViz } from "@/components/viz/CoveringViz";
import type { LessonContent } from "@/lib/types";

const COVER = `import math

def emp_dist(f, g):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(f, g)) / len(f))

def greedy_cover(vectors, eps):
    centres = []
    for v in vectors:
        if all(emp_dist(v, c) > eps for c in centres):
            centres.append(v)
    return centres

def single_scale_bound(n_cover, eps, m):
    return eps + math.sqrt(2 * math.log(n_cover) / m)`;

const DUDLEY = `import math

def ball_cover_bound(d, eps, radius=1.0):
    return (1 + 2 * radius / eps) ** d

def dudley(log_cover, m, alpha, steps=1000):
    h = (1 - alpha) / steps
    integral = sum(math.sqrt(log_cover(alpha + (k + 0.5) * h) / m) for k in range(steps)) * h
    return 4 * alpha + 12 * integral

def best_single_scale(log_cover, m, grid):
    return min(e + math.sqrt(2 * log_cover(e) / m) for e in grid)`;

export const lesson: LessonContent = {
  id: "m16.3.3",
  minutes: 45,
  links: {
    requires: ["m16.3.1", "m15.4.1"],
    revisits: ["m15.4.2"],
    foreshadows: ["m16.5.4", "m16.7.4"],
  },

  puzzle: (
    <>
      <p>
        A class of real-valued functions has infinitely many members and no VC dimension, since it does not output labels. But
        many of its members are nearly identical: two predictors that differ by 0.001 everywhere are, for the purposes of
        generalisation, the same predictor. If we count functions only up to such small differences, how many are there, and
        is that count enough to bound the generalisation gap?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cover the class with balls of radius ε and keep only their centres: a finite class, to which the union bound or
        Massart&apos;s lemma applies, plus an error of at most ε for replacing each function by its centre. Small ε means many
        centres; large ε means a crude approximation. A single scale balances the two, and Dudley&apos;s chaining uses every
        scale at once, approximating coarsely first and then refining (m15.4.2).
      </p>
      <CoveringViz />
    </>
  ),

  theory: (
    <>
      <Definition title="covering numbers">
        <p>
          For a class F and a sample <M>{"x_1, \\dots, x_m"}</M>, the empirical <M>{"L_2"}</M> distance is{" "}
          <M>{"d(f, g) = \\big(\\tfrac1m \\sum_i (f(x_i) - g(x_i))^2\\big)^{1/2}"}</M> (<C>emp_dist</C>). The covering number{" "}
          <M>{"N(\\varepsilon, F, d)"}</M> is the fewest centres such that every f is within ε of one. Any maximal set of points
          pairwise more than ε apart is an ε-cover, which is what a greedy pass produces (<C>greedy_cover</C>).
        </p>
        <Code>{COVER}</Code>
      </Definition>

      <Theorem title="single-scale bound">
        <p>If every f takes values in [−1, 1], then for every ε &gt; 0</p>
        <MD>{"\\hat{\\mathfrak R}_S(F) \\le \\varepsilon + \\sqrt{\\frac{2 \\ln N(\\varepsilon, F, d)}{m}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let C be an ε-cover and write each f as its nearest centre c plus a remainder r = f − c with{" "}
          <M>{"d(r, 0) \\le \\varepsilon"}</M>. Then{" "}
          <M>{"\\tfrac1m \\sum_i \\sigma_i f(x_i) \\le \\tfrac1m \\sum_i \\sigma_i c(x_i) + \\tfrac1m \\|\\sigma\\| \\|r\\|"}</M> by
          Cauchy-Schwarz, and the last term is at most ε because <M>{"\\|\\sigma\\| = \\sqrt m"}</M> and{" "}
          <M>{"\\|r\\| \\le \\varepsilon\\sqrt m"}</M>. Massart&apos;s lemma (m16.3.1) on the finite set C, whose vectors have norm
          at most <M>{"\\sqrt m"}</M>, bounds the first term by <M>{"\\sqrt{2\\ln|C|/m}"}</M> (<C>single_scale_bound</C>).
        </p>
      </Proof>

      <Theorem title="covering a ball">
        <p>
          The unit ball of any norm on <M>{"\\mathbb R^d"}</M> has covering number at most <M>{"(1 + 2/\\varepsilon)^d"}</M> in that
          norm.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take a maximal ε-separated set in the ball; it is an ε-cover. Balls of radius ε/2 around its points are disjoint and lie
          in the ball of radius 1 + ε/2, so comparing volumes, their number N satisfies{" "}
          <M>{"N(\\varepsilon/2)^d \\le (1 + \\varepsilon/2)^d"}</M> (<C>ball_cover_bound</C>, m15.4.1). A class parametrised by
          a ball in <M>{"\\mathbb R^d"}</M> through an L-Lipschitz map inherits{" "}
          <M>{"\\ln N(\\varepsilon) \\le d \\ln(1 + 2L/\\varepsilon)"}</M>: the logarithm of the covering number grows like d
          log(1/ε), the signature of a d-dimensional class.
        </p>
      </Proof>

      <Theorem title="Dudley's entropy integral">
        <p>For a class with values in [−1, 1] and every α in [0, 1],</p>
        <MD>{"\\hat{\\mathfrak R}_S(F) \\le 4\\alpha + 12 \\int_\\alpha^1 \\sqrt{\\frac{\\ln N(\\varepsilon, F, d)}{m}}\\, d\\varepsilon."}</MD>
      </Theorem>
      <Proof>
        <p>
          Take covers <M>{"C_k"}</M> at scales <M>{"\\varepsilon_k = 2^{-k}"}</M> and write f as a telescoping sum of differences
          between its nearest centres at successive scales, stopping at scale about α. The differences at level k are among at
          most <M>{"|C_k||C_{k-1}|"}</M> vectors of size about <M>{"3\\varepsilon_k"}</M>, so Massart bounds their contribution
          by a multiple of <M>{"\\varepsilon_k \\sqrt{\\ln|C_k| / m}"}</M>. Summing over k is a Riemann sum for the integral, and
          the tail below α costs at most a multiple of α (<C>dudley</C>). For a d-dimensional class the integral is of order{" "}
          <M>{"\\sqrt{d/m}"}</M>, whereas the best single scale (<C>best_single_scale</C>) gives{" "}
          <M>{"\\sqrt{d \\ln m / m}"}</M>: chaining removes the logarithm, although with these constants it only wins for very
          large m.
        </p>
        <Code>{DUDLEY}</Code>
      </Proof>

      <Remark title="covers in practice">
        <p>
          Covering numbers turn any bound on the size of a class at a given resolution into a generalisation bound: for
          Lipschitz function classes, for neural networks through products of layer norms, and for compressed models, whose
          description length bounds the logarithm of a cover. They also link learning to approximation: a class that can
          approximate the target well with a small cover is exactly what learning needs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ball",
      rung: "check",
      prompt: <p>What is the logarithm of the volumetric bound (1 + 2/ε)^d on the covering number of the unit ball for d = 10 and ε = 0.1? Give four decimals.</p>,
      answer: { kind: "numeric", value: 30.4452, tolerance: 0.0001 },
    },
    {
      key: "single",
      rung: "check",
      prompt: <p>A class has ln N(0.05) = 50 on a sample of m = 1000 points. What does the single-scale bound give for its empirical Rademacher complexity? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3662, tolerance: 0.0001 },
    },
    {
      key: "chain",
      rung: "apply",
      prompt: <p>What does Dudley&apos;s integral gain over the best single-scale covering bound?</p>,
      answer: {
        kind: "choice",
        options: [
          "It uses covers at every scale, so coarse covers handle the large-scale structure and fine covers only the small differences, removing a logarithmic factor for parametric classes",
          "It needs no covering numbers at all",
          "It replaces the empirical distance by the true distribution's distance",
          "It gives a bound that does not depend on m",
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

def emp_dist(f, g):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(f, g)) / len(f))

def greedy_cover(vectors, eps):
    centres = []
    for v in vectors:
        if all(emp_dist(v, c) > eps for c in centres):
            centres.append(v)
    return centres

def single_scale_bound(n_cover, eps, m):
    return eps + math.sqrt(2 * math.log(n_cover) / m)

V = [(1, 1), (1, 0.8), (-1, -1), (0.9, 1)]; print([round(emp_dist(V[0], v), 4) for v in V], len(greedy_cover(V, 0.2)), len(greedy_cover(V, 0.1)))
print(round(single_scale_bound(100, 0.1, 400), 4), single_scale_bound(1, 0.0, 50))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.1414, 2.0, 0.0707] 2 3\n0.2517 0.0",
          "[0.0, 0.1414, 2.0, 0.0707] 2 2\n0.2517 0.0",
          "[0.0, 0.2, 2.8284, 0.1] 2 3\n0.2517 0.0",
          "[0.0, 0.1414, 2.0, 0.0707] 3 3\n0.2517 0.0",
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

def ball_cover_bound(d, eps, radius=1.0):
    return (1 + 2 * radius / eps) ** d

def dudley(log_cover, m, alpha, steps=1000):
    h = (1 - alpha) / steps
    integral = sum(math.sqrt(log_cover(alpha + (k + 0.5) * h) / m) for k in range(steps)) * h
    return 4 * alpha + 12 * integral

def best_single_scale(log_cover, m, grid):
    return min(e + math.sqrt(2 * log_cover(e) / m) for e in grid)

print(ball_cover_bound(2, 1.0), ball_cover_bound(3, 0.5, 2.0), round(dudley(lambda e: 4 * math.log(3 / e), 100, 0.01), 3))
print(round(best_single_scale(lambda e: 4 * math.log(3 / e), 100, [0.05, 0.1, 0.2, 0.4]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "9.0 729.0 3.376\n0.6216",
          "9.0 125.0 3.376\n0.6216",
          "4.0 729.0 3.376\n0.6216",
          "9.0 729.0 3.376\n0.05",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>emp_dist(f, g)</C>, the empirical L2 distance between two vectors of function values,{" "}
          <C>greedy_cover(vectors, eps)</C>, keeping each vector farther than eps from all centres kept so far, and{" "}
          <C>single_scale_bound(n_cover, eps, m)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def emp_dist(f, g):
    return 0.0

def greedy_cover(vectors, eps):
    return vectors[:1]

def single_scale_bound(n_cover, eps, m):
    return eps
`,
        solution: COVER,
        tests: [
          { name: "distance and cover", code: `assert abs(emp_dist((0, 0, 0, 0), (1, 1, 1, 1)) - 1.0) < 1e-12 and greedy_cover([(0, 0), (0.1, 0), (1, 1), (1, 1.05)], 0.2) == [(0, 0), (1, 1)] and len(greedy_cover([(0,), (1,), (2,)], 0.5)) == 3` },
          { name: "bound", code: `assert abs(single_scale_bound(math.exp(4), 0.1, 8) - 1.1) < 1e-12 and single_scale_bound(1, 0.25, 10) == 0.25` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ball_cover_bound(d, eps, radius=1.0)</C>, <C>dudley(log_cover, m, alpha, steps=1000)</C> with a midpoint
          rule for the integral, and <C>best_single_scale(log_cover, m, grid)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ball_cover_bound(d, eps, radius=1.0):
    return 1.0

def dudley(log_cover, m, alpha, steps=1000):
    return 4 * alpha

def best_single_scale(log_cover, m, grid):
    return grid[0]
`,
        solution: DUDLEY,
        tests: [
          { name: "ball", code: `assert ball_cover_bound(1, 2.0) == 2.0 and ball_cover_bound(2, 1.0, 0.5) == 4.0` },
          { name: "dudley and single scale", code: `assert abs(dudley(lambda e: 4.0, 16, 0.0) - 6.0) < 1e-9 and abs(dudley(lambda e: 0.0, 9, 0.5) - 2.0) < 1e-12
assert abs(best_single_scale(lambda e: 8.0 * (e < 0.5), 4, [0.25, 0.5]) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "integral",
      rung: "stretch",
      prompt: (
        <p>
          For a class with ln N(ε) = d ln(3/ε), Dudley&apos;s integral with α = 0 is 12 √(d/m) times ∫₀¹ √(ln(3/ε)) dε. Evaluate
          that integral to three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.416, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every bound so far has been about the class, uniformly over its members. The next part looks at the algorithm instead:
        if the learned predictor barely changes when one training example is replaced, it cannot have memorised that example.
      </p>
    </>
  ),
};
