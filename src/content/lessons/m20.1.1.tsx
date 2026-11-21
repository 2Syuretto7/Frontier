import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MongeMatchViz } from "@/components/viz/MongeMatchViz";
import type { LessonContent } from "@/lib/types";

const MAPS = `import itertools

def push_forward(xs, w, T):
    out = {}
    for x, m in zip(xs, w):
        out[T(x)] = out.get(T(x), 0) + m            # mass at x moves to T(x)
    return out

def assignment_cost(X, Y, perm, c):
    return sum(c(X[i], Y[j]) for i, j in enumerate(perm))

def brute_force_assignment(X, Y, c):
    best = min(itertools.permutations(range(len(Y))), key=lambda p: assignment_cost(X, Y, p, c))
    return best, assignment_cost(X, Y, best, c)`;

const LINE = `import numpy as np

def monotone_map(xs, ys):
    perm = np.empty(len(xs), dtype=int)
    perm[np.argsort(xs)] = np.argsort(ys)            # k-th smallest x goes to k-th smallest y
    return perm.tolist()

def quantile_transport(x, cdf_mu, quantile_nu):
    return quantile_nu(cdf_mu(x))                    # T = F_nu^{-1} o F_mu

def is_monotone(xs, ys, perm):
    n = len(xs)
    return all((xs[i] - xs[k]) * (ys[perm[i]] - ys[perm[k]]) >= 0 for i in range(n) for k in range(n))`;

export const lesson: LessonContent = {
  id: "m20.1.1",
  minutes: 50,
  links: {
    requires: ["m18.3.1", "m10.2.1"],
    revisits: ["m10.3.1", "m19.5.3"],
    foreshadows: ["m20.1.2"],
  },

  puzzle: (
    <>
      <p>
        In 1781 Gaspard Monge asked how to move a pile of earth into a hole of the same volume while making the total distance
        travelled as small as possible. Each grain must go somewhere, and the hole must end up exactly filled. Stated for
        probability distributions, the question is how to turn one distribution into another by moving mass as cheaply as possible.
        When is there a best way, what does it look like on a line, and why can the question have no answer at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of each grain at x being carried to a destination T(x). The rule T must deliver exactly the target distribution, and
        its cost is the average of c(x, T(x)). With equal numbers of equally weighted points, T is a matching, and the problem is to
        choose the cheapest of the n! matchings. On a line with a convex cost, such as the squared distance, the best matching never
        lets two paths cross: if they did, swapping their destinations would be cheaper. So the answer is to send the smallest
        source point to the smallest target, the next to the next, and so on.
      </p>
      <MongeMatchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="push-forward and Monge's problem">
        <p>
          For a measurable map T and a probability measure μ, the push-forward <M>{"T_\\# \\mu"}</M> is the measure{" "}
          <M>{"(T_\\#\\mu)(B) = \\mu(T^{-1}(B))"}</M>: the law of T(X) when <M>{"X \\sim \\mu"}</M> (m18.3.1). Given probability
          measures μ, ν and a cost <M>{"c(x, y) \\ge 0"}</M>, Monge&apos;s problem is
        </p>
        <MD>{"\\inf_T \\Big\\{ \\int c(x, T(x))\\, d\\mu(x) : T_\\#\\mu = \\nu \\Big\\} ."}</MD>
        <p>
          A map with <M>{"T_\\#\\mu = \\nu"}</M> is a transport map. For <M>{"\\mu = \\frac1n \\sum_i \\delta_{x_i}"}</M> and{" "}
          <M>{"\\nu = \\frac1n \\sum_j \\delta_{y_j}"}</M> with distinct points, the transport maps are exactly the bijections{" "}
          <M>{"x_i \\mapsto y_{\\sigma(i)}"}</M>, and the problem is the assignment problem: minimise{" "}
          <M>{"\\sum_i c(x_i, y_{\\sigma(i)})"}</M> over permutations σ. <C>push_forward</C>, <C>assignment_cost</C> and{" "}
          <C>brute_force_assignment</C> compute these for small examples.
        </p>
        <Code>{MAPS}</Code>
      </Definition>

      <Theorem title="monotone matching is optimal for convex costs on a line">
        <p>
          Let <M>{"c(x, y) = h(y - x)"}</M> with h convex, and let <M>{"x_1 \\le \\dots \\le x_n"}</M> and{" "}
          <M>{"y_1 \\le \\dots \\le y_n"}</M>. Then the identity matching <M>{"x_i \\mapsto y_i"}</M> is optimal among all
          permutations.
        </p>
      </Theorem>
      <Proof>
        <p>
          First two points: if <M>{"x_1 \\le x_2"}</M> and <M>{"y_1 \\le y_2"}</M>, then{" "}
          <M>{"h(y_1 - x_1) + h(y_2 - x_2) \\le h(y_2 - x_1) + h(y_1 - x_2)"}</M>. Indeed, put <M>{"a = y_1 - x_2"}</M> and{" "}
          <M>{"b = y_2 - x_1"}</M>, the smallest and largest of the four differences; both <M>{"y_1 - x_1"}</M> and{" "}
          <M>{"y_2 - x_2"}</M> lie in [a, b] and sum to a + b, so they are <M>{"\\lambda a + (1-\\lambda)b"}</M> and{" "}
          <M>{"(1-\\lambda)a + \\lambda b"}</M>, and convexity bounds the sum of their h values by h(a) + h(b). Now take any
          permutation σ that is not the identity. Some i &lt; k has <M>{"\\sigma(i) > \\sigma(k)"}</M>, a crossing; swapping the two
          destinations does not raise the cost and strictly reduces the number of inversions of σ. After finitely many swaps σ is the
          identity, at no greater cost.
        </p>
      </Proof>

      <Theorem title="the monotone map on the line">
        <p>
          If μ on <M>{"\\mathbb{R}"}</M> has a continuous distribution function <M>{"F_\\mu"}</M> and <M>{"F_\\nu^{-1}"}</M> is the
          quantile function of ν, then <M>{"T = F_\\nu^{-1} \\circ F_\\mu"}</M> is a non-decreasing transport map from μ to ν.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"X \\sim \\mu"}</M>, then <M>{"F_\\mu(X)"}</M> is uniform on (0, 1) because <M>{"F_\\mu"}</M> is continuous, and{" "}
          <M>{"F_\\nu^{-1}(U)"}</M> has law ν for uniform U, which is inverse transform sampling. Both functions are non-decreasing.
          The discrete theorem, applied to finer and finer empirical approximations, suggests that this map is optimal for every
          convex h; m20.3.1 proves it. <C>monotone_map</C> and <C>quantile_transport</C> are the discrete and continuous versions,
          and <C>is_monotone</C> checks that no two pairs cross.
        </p>
        <Code>{LINE}</Code>
      </Proof>

      <Example title="no transport map at all">
        <p>
          Let <M>{"\\mu = \\delta_0"}</M> and <M>{"\\nu = \\frac12\\delta_{-1} + \\frac12\\delta_1"}</M>. Any map sends all the mass
          at 0 to the single point T(0), so <M>{"T_\\#\\mu"}</M> is a point mass and never equals ν. Monge&apos;s problem has no
          admissible map, although moving half the mass each way is obviously the answer. Splitting mass is the idea of the next
          lesson.
        </p>
      </Example>

      <Remark title="why Monge's problem is hard">
        <p>
          The constraint <M>{"T_\\#\\mu = \\nu"}</M> is not convex in T: the average of two transport maps is usually not a
          transport map. For concave costs, such as <M>{"\\sqrt{|x - y|}"}</M>, the visualisation shows that the optimum can cross,
          leaving nearby mass in place and sending some far. These difficulties disappear when maps are replaced by couplings, which
          turns the problem into a linear program (m10.3.1).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          μ is uniform on {"{0, 1}"} and ν is uniform on {"{0.5, 4}"}. What is the optimal value of Monge&apos;s problem for the cost{" "}
          <M>{"c(x, y) = (x - y)^2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 4.625, tolerance: 0.0005 },
    },
    {
      key: "quantile",
      rung: "check",
      prompt: (
        <p>
          The monotone map sends the uniform distribution on [0, 1] to the exponential distribution with rate 2. Where does it send
          x = 0.75? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.693, tolerance: 0.0006 },
    },
    {
      key: "nomap",
      rung: "apply",
      prompt: <p>Why can there be no transport map from a point mass to a measure with two atoms?</p>,
      answer: {
        kind: "choice",
        options: [
          "A map sends all the mass at the point to a single destination, so its push-forward is again a point mass",
          "The cost of moving mass to two places is infinite",
          "Transport maps must be continuous, and no continuous map splits a point",
          "The two measures have different total mass",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools

def push_forward(xs, w, T):
    out = {}
    for x, m in zip(xs, w):
        out[T(x)] = out.get(T(x), 0) + m            # mass at x moves to T(x)
    return out

def assignment_cost(X, Y, perm, c):
    return sum(c(X[i], Y[j]) for i, j in enumerate(perm))

def brute_force_assignment(X, Y, c):
    best = min(itertools.permutations(range(len(Y))), key=lambda p: assignment_cost(X, Y, p, c))
    return best, assignment_cost(X, Y, best, c)

X, Y, c = [0.0, 1.0, 2.0], [1.5, 0.0, 3.0], lambda x, y: (x - y) ** 2
print(sorted(push_forward(X, [0.2, 0.3, 0.5], lambda x: x % 2).items()), assignment_cost(X, Y, (0, 1, 2), c), brute_force_assignment(X, Y, c))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0.0, 0.7), (1.0, 0.3)] 4.25 ((1, 0, 2), 1.25)",
          "[(0.0, 0.5), (1.0, 0.5)] 4.25 ((1, 0, 2), 1.25)",
          "[(0.0, 0.7), (1.0, 0.3)] 1.25 ((1, 0, 2), 1.25)",
          "[(0.0, 0.7), (1.0, 0.3)] 4.25 ((0, 1, 2), 4.25)",
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

def monotone_map(xs, ys):
    perm = np.empty(len(xs), dtype=int)
    perm[np.argsort(xs)] = np.argsort(ys)            # k-th smallest x goes to k-th smallest y
    return perm.tolist()

def quantile_transport(x, cdf_mu, quantile_nu):
    return quantile_nu(cdf_mu(x))                    # T = F_nu^{-1} o F_mu

def is_monotone(xs, ys, perm):
    n = len(xs)
    return all((xs[i] - xs[k]) * (ys[perm[i]] - ys[perm[k]]) >= 0 for i in range(n) for k in range(n))

t = quantile_transport(1.0, lambda x: x / 4, lambda u: -np.log(1 - u))
print(monotone_map([2.0, 0.0, 1.0], [4.0, 5.0, 3.0]), round(float(t), 4), is_monotone([0.0, 1.0], [0.0, 1.0], [1, 0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1, 2, 0] 0.2877 False", "[2, 0, 1] 0.2877 False", "[1, 2, 0] 1.3863 False", "[1, 2, 0] 0.2877 True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>push_forward(xs, w, T)</C> returning a dict from destinations to mass, <C>assignment_cost(X, Y, perm, c)</C> and{" "}
          <C>brute_force_assignment(X, Y, c)</C> returning the best permutation as a tuple and its cost.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools

def push_forward(xs, w, T):
    return {T(x): m for x, m in zip(xs, w)}

def assignment_cost(X, Y, perm, c):
    return sum(c(X[i], Y[i]) for i in range(len(X)))

def brute_force_assignment(X, Y, c):
    p = tuple(range(len(Y)))
    return p, assignment_cost(X, Y, p, c)
`,
        solution: MAPS,
        tests: [
          { name: "push", code: `d = push_forward([1, -1, 2], [0.5, 0.25, 0.25], lambda x: x * x)\nassert d == {1: 0.75, 4: 0.25}` },
          { name: "assign", code: `c = lambda x, y: (x - y) ** 2\nassert assignment_cost([0, 1], [5, 1], (1, 0), c) == 17 and brute_force_assignment([0, 1], [5, 1], c) == ((1, 0), 17)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>monotone_map(xs, ys)</C> returning a list perm with x[i] sent to y[perm[i]] in rank order,{" "}
          <C>quantile_transport(x, cdf_mu, quantile_nu)</C> and <C>is_monotone(xs, ys, perm)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def monotone_map(xs, ys):
    return np.argsort(ys).tolist()

def quantile_transport(x, cdf_mu, quantile_nu):
    return cdf_mu(quantile_nu(x))

def is_monotone(xs, ys, perm):
    return True
`,
        solution: LINE,
        tests: [
          { name: "map", code: `assert monotone_map([3.0, 1.0, 2.0], [10.0, 30.0, 20.0]) == [1, 0, 2]\nassert abs(quantile_transport(0.5, lambda x: x, lambda u: 2 * u + 1) - 2.0) < 1e-12` },
          { name: "mono", code: `assert is_monotone([0.0, 1.0, 2.0], [5.0, 6.0, 7.0], [0, 1, 2]) and not is_monotone([0.0, 1.0, 2.0], [5.0, 6.0, 7.0], [0, 2, 1])` },
        ],
      },
    },
    {
      key: "concave",
      rung: "stretch",
      prompt: (
        <p>
          μ is uniform on {"{0, 1}"} and ν is uniform on {"{1, 2}"}. With the concave cost <M>{"c(x, y) = \\sqrt{|x - y|}"}</M>, what
          is the smallest total cost <M>{"\\sum_i c(x_i, y_{\\sigma(i)})"}</M> over the two matchings? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.414, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Monge&apos;s problem fails when mass must split. The next lesson lets it split: instead of a map, choose a joint distribution
        with the right marginals. The problem becomes linear, always has a solution, and contains Monge&apos;s problem as a special case.
      </p>
    </>
  ),
};
