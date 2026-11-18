import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BallMassViz } from "@/components/viz/BallMassViz";
import type { LessonContent } from "@/lib/types";

const VOL = `import math

def ball_volume(d, r=1.0):
    return math.exp(d / 2 * math.log(math.pi) + d * math.log(r) - math.lgamma(d / 2 + 1))

def shell_fraction(d, eps):
    return 1 - (1 - eps) ** d

def ball_cube_ratio(d):
    return ball_volume(d, 0.5)`;

const CAP = `import math

def uniform_ball(n, d, rng):
    points = []
    for _ in range(n):
        g = [rng.gauss(0, 1) for _ in range(d)]
        norm = math.sqrt(sum(x * x for x in g))
        r = rng.random() ** (1 / d)
        points.append([r * x / norm for x in g])
    return points

def equator_fraction(points, t):
    return sum(1 for p in points if abs(p[0]) < t) / len(points)

def cap_bound(d, t):
    return min(1.0, 2 * (1 - t * t) ** (d / 2))`;

export const lesson: LessonContent = {
  id: "m15.2.3",
  minutes: 55,
  links: {
    requires: ["m15.2.2"],
    revisits: ["m2.7.4", "l1.4.2"],
    foreshadows: ["m15.2.4", "m15.4.1"],
  },

  puzzle: (
    <>
      <p>
        To sample a point uniformly from a ball, a natural method is to sample from the surrounding cube and throw away
        points that fall outside the ball. In the plane about 79% of points are kept. In 20 dimensions, how many of a
        million samples would you expect to keep? And if you did get one, where in the ball would it be?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Volume scales like the d-th power of length. Shrinking a ball by 10% shrinks its volume by a factor{" "}
        <M>{"0.9^d"}</M>, so in high dimension the inner ball of radius 0.9 holds almost nothing and nearly all the volume is
        in a thin outer shell. The same arithmetic, applied to slices, puts nearly all the volume near every equator at once.
        And the ball is a vanishing fraction of its bounding cube, whose volume is in the corners.
      </p>
      <BallMassViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="volume of the ball">
        <p>The ball of radius r in <M>{"\\mathbb{R}^d"}</M> has volume</p>
        <MD>{"V_d(r) = \\frac{\\pi^{d/2}}{\\Gamma(d/2 + 1)}\\,r^d."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"V_d(r) = V_dr^d"}</M>, so the shell between r and r + dr has volume <M>{"dV_dr^{d-1}\\,dr"}</M>. Compute{" "}
          <M>{"\\int_{\\mathbb{R}^d} e^{-\\|x\\|^2}dx"}</M> two ways. It factorises into d copies of the Gaussian integral of
          m2.7.4, giving <M>{"\\pi^{d/2}"}</M>. Integrating over shells instead gives{" "}
          <M>{"\\int_0^\\infty e^{-r^2}dV_dr^{d-1}dr"}</M>, and the substitution <M>{"u = r^2"}</M> turns this into{" "}
          <M>{"\\tfrac d2V_d\\Gamma(d/2) = V_d\\Gamma(d/2 + 1)"}</M>. Equating the two gives the formula.
        </p>
      </Proof>

      <Remark title="the ball vanishes">
        <p>
          The unit-ball volume rises to its maximum, about 5.26, at d = 5 and then falls faster than any exponential, since{" "}
          <M>{"\\Gamma(d/2 + 1)"}</M> grows like <M>{"(d/2e)^{d/2}"}</M>. The ball inscribed in the unit cube has radius 1/2, so
          it fills a fraction <M>{"V_d(1/2)"}</M> of the cube: 79% for d = 2, 0.25% for d = 10 and about{" "}
          <M>{"2.5 \\times 10^{-8}"}</M> for d = 20. Rejection sampling from the cube keeps about 0.025 points per million in 20
          dimensions, so a million draws usually keep none. <C>ball_volume</C> works in logarithms because both factors
          overflow separately.
        </p>
        <Code>{VOL}</Code>
      </Remark>

      <Theorem title="volume is near the boundary">
        <p>
          The fraction of the unit ball&apos;s volume within distance ε of its boundary is{" "}
          <M>{"1 - (1 - \\varepsilon)^d \\ge 1 - e^{-\\varepsilon d}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The points within ε of the boundary are the ball minus the ball of radius 1 − ε, whose volume is a fraction{" "}
          <M>{"(1 - \\varepsilon)^d"}</M> of the whole; and <M>{"1 - \\varepsilon \\le e^{-\\varepsilon}"}</M>.
        </p>
      </Proof>

      <Theorem title="volume is near the equator">
        <p>
          For a uniform point x in the unit ball and <M>{"0 \\le t \\le 1"}</M>,{" "}
          <M>{"P(|x_1| \\ge t) \\le 2(1 - t^2)^{d/2} \\le 2e^{-dt^2/2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"e_1"}</M> be the first basis vector. If <M>{"\\|x\\| \\le 1"}</M> and <M>{"x_1 \\ge t"}</M>, then{" "}
          <M>{"\\|x - te_1\\|^2 = \\|x\\|^2 - 2tx_1 + t^2 \\le 1 - t^2"}</M>, so the cap <M>{"\\{x_1 \\ge t\\}"}</M> lies inside a ball
          of radius <M>{"\\sqrt{1 - t^2}"}</M>, whose volume is a fraction <M>{"(1 - t^2)^{d/2}"}</M> of the unit ball. The cap{" "}
          <M>{"\\{x_1 \\le -t\\}"}</M> is its mirror image. Finally <M>{"1 - t^2 \\le e^{-t^2}"}</M>.
        </p>
      </Proof>

      <Example title="checking by sampling">
        <p>
          To sample uniformly from the ball without rejection, take a Gaussian vector, normalise it to get a uniform direction
          (rotation invariance), and scale by <M>{"U^{1/d}"}</M> with U uniform on [0, 1], since the radius R of a uniform
          point satisfies <M>{"P(R \\le r) = r^d"}</M>. <C>uniform_ball</C> does this, and <C>equator_fraction</C> confirms the
          slab bound computed by <C>cap_bound</C>.
        </p>
        <Code>{CAP}</Code>
      </Example>

      <Remark title="near the boundary and near every equator">
        <p>
          The two theorems do not conflict. A typical point has norm close to 1 and every coordinate of size about{" "}
          <M>{"1/\\sqrt d"}</M>, which is what m15.2.1 said about a scaled Gaussian vector. Since the slab bound holds for every
          direction, a typical point is nearly orthogonal to any fixed direction, as in m15.2.2. For a cube the picture is
          different again: its volume is in its corners, at distance about <M>{"\\sqrt{d/12}"}</M> from the centre for the unit
          cube, far outside the inscribed ball. Grid search, histograms, and nearest-neighbour methods all suffer from this
          (l1.4.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "vol",
      rung: "check",
      prompt: <p>What is the volume of the unit ball in ten dimensions? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.5502, tolerance: 0.00006 },
    },
    {
      key: "shell",
      rung: "check",
      prompt: <p>What fraction of the volume of the unit ball in 100 dimensions lies within 0.05 of its boundary? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.9941, tolerance: 0.00006 },
    },
    {
      key: "reject",
      rung: "apply",
      prompt: <p>Why does sampling uniformly from a ball by rejection from the bounding cube fail in high dimension?</p>,
      answer: {
        kind: "choice",
        options: [
          "The acceptance rate is the ball's share of the cube's volume, which falls faster than any exponential in d",
          "The accepted points are not uniformly distributed in the ball",
          "Random number generators cannot produce points in many dimensions",
          "Accepted points all lie near the centre of the ball",
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

def ball_volume(d, r=1.0):
    return math.exp(d / 2 * math.log(math.pi) + d * math.log(r) - math.lgamma(d / 2 + 1))

def shell_fraction(d, eps):
    return 1 - (1 - eps) ** d

def ball_cube_ratio(d):
    return ball_volume(d, 0.5)

print(round(ball_volume(2), 4), round(ball_volume(3, 2), 4), round(ball_volume(20), 4), shell_fraction(3, 0.5))
print(round(ball_cube_ratio(2), 4), round(shell_fraction(50, 0.1), 4), max(range(1, 30), key=ball_volume))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.1416 33.5103 0.0258 0.875\n0.7854 0.9948 5",
          "3.1416 4.1888 0.0258 0.875\n0.7854 0.9948 5",
          "3.1416 33.5103 0.0258 0.125\n0.7854 0.9948 5",
          "3.1416 33.5103 0.0258 0.875\n0.7854 0.9948 7",
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

def uniform_ball(n, d, rng):
    points = []
    for _ in range(n):
        g = [rng.gauss(0, 1) for _ in range(d)]
        norm = math.sqrt(sum(x * x for x in g))
        r = rng.random() ** (1 / d)
        points.append([r * x / norm for x in g])
    return points

def equator_fraction(points, t):
    return sum(1 for p in points if abs(p[0]) < t) / len(points)

def cap_bound(d, t):
    return min(1.0, 2 * (1 - t * t) ** (d / 2))

import random; ps = uniform_ball(500, 200, random.Random(0)); print(round(equator_fraction([[0.5, 1], [-0.05, 0], [0.2, 0.3]], 0.25), 4), cap_bound(4, 0.5))
print(all(sum(x * x for x in p) <= 1 for p in ps), equator_fraction(ps, 0.2) > 1 - cap_bound(200, 0.2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6667 1.0\nTrue True", "0.3333 1.0\nTrue True", "0.6667 1.125\nTrue True", "0.6667 1.0\nTrue False"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ball_volume(d, r=1.0)</C> for r &gt; 0, computed in logarithms with <C>math.lgamma</C> so that it works when the Gamma value and the power of r would overflow;{" "}
          <C>shell_fraction(d, eps)</C>, the share of the unit ball within eps of its boundary; and{" "}
          <C>ball_cube_ratio(d)</C>, the share of the unit cube filled by its inscribed ball.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ball_volume(d, r=1.0):
    return 0.0

def shell_fraction(d, eps):
    return 0.0

def ball_cube_ratio(d):
    return 0.0
`,
        solution: VOL,
        tests: [
          { name: "volume", code: `import math
assert abs(ball_volume(1) - 2) < 1e-12 and abs(ball_volume(2, 3) - 9 * math.pi) < 1e-12 and abs(ball_volume(3) - 4 * math.pi / 3) < 1e-12
assert abs(ball_volume(10) - math.pi ** 5 / 120) < 1e-12 
v = ball_volume(400, 3); assert v > 0 and abs(math.log(v) - (200 * math.log(math.pi) + 400 * math.log(3) - math.lgamma(201))) < 1e-9` },
          { name: "fractions", code: `import math
assert abs(shell_fraction(3, 0.5) - 0.875) < 1e-15 and shell_fraction(10, 0) == 0 and abs(shell_fraction(100, 0.05) - (1 - 0.95 ** 100)) < 1e-15
assert abs(ball_cube_ratio(2) - math.pi / 4) < 1e-12 and abs(ball_cube_ratio(3) - math.pi / 6) < 1e-12 and ball_cube_ratio(20) < 3e-8` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>uniform_ball(n, d, rng)</C>, returning n points uniform in the unit d-ball: for each, draw d values with{" "}
          <C>rng.gauss(0, 1)</C>, normalise, then scale by <C>rng.random() ** (1 / d)</C>;{" "}
          <C>equator_fraction(points, t)</C>, the share of points with <M>{"|x_1| < t"}</M>; and <C>cap_bound(d, t)</C>, the bound{" "}
          <M>{"2(1 - t^2)^{d/2}"}</M> capped at 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def uniform_ball(n, d, rng):
    return []

def equator_fraction(points, t):
    return 0.0

def cap_bound(d, t):
    return 1.0
`,
        solution: CAP,
        tests: [
          { name: "sample", code: `import math, random
r = random.Random(7); ps = uniform_ball(3, 4, r)
r2 = random.Random(7); g = [r2.gauss(0, 1) for _ in range(4)]; nrm = math.sqrt(sum(x * x for x in g)); s = r2.random() ** 0.25
assert len(ps) == 3 and all(abs(a - s * b / nrm) < 1e-12 for a, b in zip(ps[0], g))
qs = uniform_ball(4000, 5, random.Random(1)); rs = [math.sqrt(sum(x * x for x in p)) for p in qs]
assert max(rs) <= 1 and abs(sum(x <= 0.5 ** 0.2 for x in rs) / 4000 - 0.5) < 0.03` },
          { name: "equator", code: `assert equator_fraction([[0.5, 1], [-0.05, 0], [0.2, 0.3], [-0.1]], 0.25) == 0.75 and equator_fraction([[0.3]], 0.3) == 0
assert cap_bound(4, 0.5) == 1.0 and abs(cap_bound(200, 0.2) - 2 * 0.96 ** 100) < 1e-15 and abs(cap_bound(1000, 0.1) - 2 * 0.99 ** 500) < 1e-15` },
        ],
      },
    },
    {
      key: "dim",
      rung: "stretch",
      prompt: (
        <p>
          What is the smallest dimension d for which the bound <M>{"2(1 - t^2)^{d/2}"}</M> guarantees that at least 99% of
          the unit ball&apos;s volume lies in the slab <M>{"|x_1| < 0.1"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1055, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Distances concentrate, angles concentrate, and mass sits on a thin shell. The next lesson turns these facts into a
        tool: a random linear map to a much lower dimension that keeps every pairwise distance among n points nearly intact.
      </p>
    </>
  ),
};
