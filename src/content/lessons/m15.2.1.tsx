import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NormShellViz } from "@/components/viz/NormShellViz";
import type { LessonContent } from "@/lib/types";

const NORM = `import math

def norms(vectors):
    return [math.sqrt(sum(x * x for x in v)) for v in vectors]

def shell_bound(t):
    return min(1.0, 2 * math.exp(-t * t / 8))

def expected_norm(d):
    return math.sqrt(2) * math.exp(math.lgamma((d + 1) / 2) - math.lgamma(d / 2))`;

const DIST = `import math

def sample_gauss(n, d, rng):
    return [[rng.gauss(0, 1) for _ in range(d)] for _ in range(n)]

def pairwise_dists(points):
    out = []
    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            out.append(math.dist(points[i], points[j]))
    return out

def relative_contrast(dists):
    return (max(dists) - min(dists)) / min(dists)`;

export const lesson: LessonContent = {
  id: "m15.2.1",
  minutes: 55,
  links: {
    requires: ["m15.1.1"],
    revisits: ["m7.5.4", "l1.4.2"],
    foreshadows: ["m15.2.2", "m15.2.4"],
  },

  puzzle: (
    <>
      <p>
        Draw a vector of 1000 independent standard Gaussian coordinates. Its density is largest at the origin, so you
        might expect a typical draw to be fairly short. Yet if you draw a thousand such vectors, every one of them has length
        between about 29 and 34, and none comes anywhere near the origin. Where does the probability actually sit, and why so
        precisely?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The squared length is a sum of d independent terms, each with mean 1. By the law of large numbers it is close to d,
        so the length is close to √d. What is surprising is how close: the squared length fluctuates by about √d, and taking
        the square root divides that by roughly 2√d, leaving fluctuations of order 1 however large d is. A Gaussian vector
        lives on a thin shell of radius √d and constant thickness.
      </p>
      <NormShellViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the norm of a Gaussian vector">
        <p>
          Let <M>{"X = (X_1, \\dots, X_d)"}</M> have independent standard Gaussian coordinates, the multivariate normal{" "}
          <M>{"N(0, I_d)"}</M> of m7.5.4. Then <M>{"\\|X\\|^2 = \\sum_i X_i^2"}</M> has mean d, and{" "}
          <M>{"\\|X\\|"}</M> has the chi distribution with d degrees of freedom, whose mean is
        </p>
        <MD>{"\\mathbb{E}\\|X\\| = \\sqrt2\\,\\frac{\\Gamma((d+1)/2)}{\\Gamma(d/2)} \\approx \\sqrt{d - \\tfrac12}."}</MD>
        <p>
          <C>expected_norm</C> evaluates it through <C>math.lgamma</C>, since the Gamma values themselves overflow for large d.
          Because <M>{"\\mathrm{Var}\\|X\\| = d - (\\mathbb{E}\\|X\\|)^2"}</M>, the approximation says the variance of the length
          tends to 1/2.
        </p>
        <Code>{NORM}</Code>
      </Definition>

      <Theorem title="concentration of the norm">
        <p>For every <M>{"\\delta \\ge 0"}</M> and <M>{"t \\ge 0"}</M>,</p>
        <MD>{"P\\Bigl(\\Bigl|\\frac{\\|X\\|}{\\sqrt d} - 1\\Bigr| \\ge \\delta\\Bigr) \\le 2e^{-d\\delta^2/8}, \\qquad P\\bigl(\\bigl|\\|X\\| - \\sqrt d\\bigr| \\ge t\\bigr) \\le 2e^{-t^2/8}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Each <M>{"X_i^2 - 1"}</M> is sub-exponential with parameters (2, 4) (m15.1.1), so <M>{"\\|X\\|^2 - d"}</M> is
          sub-exponential with <M>{"\\nu^2 = 4d"}</M> and b = 4. Applying the sub-exponential tail bound to it and to its
          negative, <M>{"P(|\\|X\\|^2 - d| \\ge s) \\le 2e^{-s^2/(8d)}"}</M> for <M>{"s \\le d"}</M> and{" "}
          <M>{"2e^{-s/8}"}</M> for <M>{"s > d"}</M>. Write <M>{"z = \\|X\\|/\\sqrt d \\ge 0"}</M>. Since{" "}
          <M>{"|z^2 - 1| = |z - 1|(z + 1)"}</M> and <M>{"z + 1"}</M> is at least both 1 and <M>{"|z - 1|"}</M>, the event{" "}
          <M>{"|z - 1| \\ge \\delta"}</M> forces <M>{"|z^2 - 1| \\ge \\max(\\delta, \\delta^2)"}</M>. Take{" "}
          <M>{"s = d\\max(\\delta, \\delta^2)"}</M>. If <M>{"\\delta \\le 1"}</M> then s = dδ ≤ d and the first bound gives{" "}
          <M>{"2e^{-d^2\\delta^2/(8d)} = 2e^{-d\\delta^2/8}"}</M>; if <M>{"\\delta > 1"}</M> then <M>{"s = d\\delta^2 > d"}</M> and the
          second gives the same. The second form is the first with <M>{"\\delta = t/\\sqrt d"}</M>, and <C>shell_bound</C>{" "}
          computes it.
        </p>
      </Proof>

      <Remark title="the shell, not the centre">
        <p>
          The density <M>{"(2\\pi)^{-d/2}e^{-\\|x\\|^2/2}"}</M> is largest at 0, but the volume of a shell of radius r grows like{" "}
          <M>{"r^{d-1}"}</M>. Their product, the density of the length, is proportional to{" "}
          <M>{"r^{d-1}e^{-r^2/2}"}</M>, which peaks at <M>{"r = \\sqrt{d - 1}"}</M>. The most likely point and the typical
          point are very different things in high dimensions, which is why the mode of a high-dimensional posterior is rarely a
          representative sample from it.
        </p>
      </Remark>

      <Example title="all distances look alike">
        <p>
          If X and Y are independent <M>{"N(0, I_d)"}</M>, then X − Y is <M>{"N(0, 2I_d)"}</M>, so{" "}
          <M>{"\\|X - Y\\|/\\sqrt{2d}"}</M> concentrates around 1 at the same rate. For n points there are fewer than{" "}
          <M>{"n^2/2"}</M> pairs, and a union bound shows that once <M>{"d \\ge 8\\log(n^2/\\eta)/\\delta^2"}</M>, every pairwise
          distance lies within a factor <M>{"1 \\pm \\delta"}</M> of <M>{"\\sqrt{2d}"}</M> with probability at least{" "}
          <M>{"1 - \\eta"}</M>. The <em>relative contrast</em> (largest distance minus smallest, over the smallest) then tends to
          0: the nearest neighbour is barely nearer than the farthest. This is the precise form of the curse of
          dimensionality seen in l1.4.2.
        </p>
        <Code>{DIST}</Code>
      </Example>

      <Remark title="beyond Gaussians">
        <p>
          Nothing in the proof used more than independence and a sub-exponential bound for <M>{"X_i^2 - 1"}</M>. Any vector with
          independent, mean-zero, unit-variance sub-Gaussian coordinates has a norm within O(1) of √d with sub-Gaussian
          tails, the constant depending on the coordinates&apos; sub-Gaussian parameter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shell",
      rung: "check",
      prompt: <p>Bound the probability that the norm of a standard Gaussian vector differs from √d by at least 5. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0879, tolerance: 0.00006 },
    },
    {
      key: "mean3",
      rung: "check",
      prompt: <p>What is the expected norm of a standard Gaussian vector in three dimensions? Give three decimals.</p>,
      answer: { kind: "numeric", value: 1.596, tolerance: 0.0006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the standard deviation of <M>{"\\|X\\|"}</M> stay bounded as d grows, even though that of <M>{"\\|X\\|^2"}</M> grows like √d?</p>,
      answer: {
        kind: "choice",
        options: [
          "Near √d, the square root has slope about 1/(2√d), which scales fluctuations of size √d down to size 1",
          "The coordinates become more correlated as d grows",
          "The density of X is largest at the origin, which pulls the norm back",
          "The squared norm is bounded by d",
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

def norms(vectors):
    return [math.sqrt(sum(x * x for x in v)) for v in vectors]

def shell_bound(t):
    return min(1.0, 2 * math.exp(-t * t / 8))

def expected_norm(d):
    return math.sqrt(2) * math.exp(math.lgamma((d + 1) / 2) - math.lgamma(d / 2))

print(norms([[3, 4], [1, 1, 1, 1], []]), round(shell_bound(3), 4), shell_bound(0.5))
print(round(expected_norm(1), 4), round(expected_norm(2), 4), round(expected_norm(10000) - 100, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5.0, 2.0, 0.0] 0.6493 1.0\n0.7979 1.2533 -0.0025",
          "[5.0, 2.0, 0.0] 0.6493 1.0\n1.0 1.4142 -0.0025",
          "[5.0, 4.0, 0.0] 0.6493 1.0\n0.7979 1.2533 -0.0025",
          "[5.0, 2.0, 0.0] 0.2108 1.0\n0.7979 1.2533 0.0",
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

def sample_gauss(n, d, rng):
    return [[rng.gauss(0, 1) for _ in range(d)] for _ in range(n)]

def pairwise_dists(points):
    out = []
    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            out.append(math.dist(points[i], points[j]))
    return out

def relative_contrast(dists):
    return (max(dists) - min(dists)) / min(dists)

print([round(x, 4) for x in pairwise_dists([[0, 0], [3, 4], [0, 1]])], relative_contrast([2, 3, 4]))
import random; r = random.Random(0); print(relative_contrast(pairwise_dists(sample_gauss(20, 2, r))) > relative_contrast(pairwise_dists(sample_gauss(20, 1000, r))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5.0, 1.0, 4.2426] 1.0\nTrue",
          "[5.0, 1.0, 4.2426] 1.0\nFalse",
          "[5.0, 1.0, 4.2426] 0.5\nTrue",
          "[5.0, 1.0, 4.2426, 5.0, 1.0, 4.2426] 1.0\nTrue",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norms(vectors)</C>, the Euclidean length of each vector in a list; <C>shell_bound(t)</C>, the bound{" "}
          <M>{"2e^{-t^2/8}"}</M> capped at 1; and <C>expected_norm(d)</C>, the mean of the chi distribution, computed with{" "}
          <C>math.lgamma</C> so that it works for d in the millions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def norms(vectors):
    return []

def shell_bound(t):
    return 1.0

def expected_norm(d):
    return 0.0
`,
        solution: NORM,
        tests: [
          { name: "norms", code: `import math
assert norms([[3, 4], [], [-2], [1, 2, 2]]) == [5.0, 0.0, 2.0, 3.0]
assert shell_bound(0) == 1.0 and shell_bound(1) == 1.0 and abs(shell_bound(4) - 2 * math.exp(-2)) < 1e-15 and abs(shell_bound(10) - 2 * math.exp(-12.5)) < 1e-18` },
          { name: "mean", code: `import math
assert abs(expected_norm(1) - math.sqrt(2 / math.pi)) < 1e-12 and abs(expected_norm(2) - math.sqrt(math.pi / 2)) < 1e-12
assert abs(expected_norm(3) - 2 * math.sqrt(2 / math.pi)) < 1e-12
for d in [100, 10000]:
    assert abs(expected_norm(d) - math.sqrt(d - 0.5)) < 1 / d
assert abs(expected_norm(4000000) - math.sqrt(4000000 - 0.5)) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_gauss(n, d, rng)</C>, n vectors of d independent standard Gaussian coordinates drawn in order with{" "}
          <C>rng.gauss(0, 1)</C>; <C>pairwise_dists(points)</C>, the distances between points i and j for every pair i &lt; j, in
          order of i and then j; and <C>relative_contrast(dists)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sample_gauss(n, d, rng):
    return []

def pairwise_dists(points):
    return []

def relative_contrast(dists):
    return 0.0
`,
        solution: DIST,
        tests: [
          { name: "samples", code: `import random
r = random.Random(4); s = sample_gauss(3, 5, r)
r2 = random.Random(4); assert s == [[r2.gauss(0, 1) for _ in range(5)] for _ in range(3)]
assert sample_gauss(0, 4, r) == [] and sample_gauss(2, 0, r) == [[], []]` },
          { name: "dists", code: `import math, random
assert pairwise_dists([[0, 0], [3, 4], [6, 8]]) == [5.0, 10.0, 5.0] and pairwise_dists([[1]]) == []
assert relative_contrast([2, 3, 4]) == 1.0 and relative_contrast([5, 5]) == 0.0
r = random.Random(1); ds = pairwise_dists(sample_gauss(10, 2000, r))
assert len(ds) == 45 and relative_contrast(ds) < 0.15 and all(abs(x / math.sqrt(4000) - 1) < 0.07 for x in ds)` },
        ],
      },
    },
    {
      key: "dim",
      rung: "stretch",
      prompt: (
        <p>
          What is the smallest dimension d for which the theorem guarantees that the norm of a standard Gaussian vector is
          within 10% of √d with probability at least 99%?
        </p>
      ),
      answer: { kind: "numeric", value: 4239, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Lengths concentrate; so do angles. The next lesson shows that two independent random vectors in high dimensions are
        almost exactly orthogonal, and that exponentially many nearly orthogonal directions fit in a space of modest
        dimension.
      </p>
    </>
  ),
};
