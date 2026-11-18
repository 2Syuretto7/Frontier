import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RandomAnglesViz } from "@/components/viz/RandomAnglesViz";
import type { LessonContent } from "@/lib/types";

const COS = `import math

def cosine(u, v):
    dot = sum(a * b for a, b in zip(u, v))
    return dot / (math.sqrt(sum(a * a for a in u)) * math.sqrt(sum(b * b for b in v)))

def orth_bound(d, eps):
    return min(1.0, 2 * math.exp(-d * eps * eps / 2))

def packing_size(d, eps):
    return math.floor(math.exp(d * eps * eps / 4))`;

const PACK = `import math

def random_signs(n, d, rng):
    return [[rng.choice((-1, 1)) for _ in range(d)] for _ in range(n)]

def max_abs_cos(vectors):
    best = 0.0
    for i in range(len(vectors)):
        for j in range(i + 1, len(vectors)):
            u, v = vectors[i], vectors[j]
            dot = sum(a * b for a, b in zip(u, v))
            nu = math.sqrt(sum(a * a for a in u))
            nv = math.sqrt(sum(b * b for b in v))
            best = max(best, abs(dot) / (nu * nv))
    return best

def orth_dim(n, eps, delta):
    return math.ceil(2 * math.log(n * (n - 1) / delta) / (eps * eps))`;

export const lesson: LessonContent = {
  id: "m15.2.2",
  minutes: 55,
  links: {
    requires: ["m15.2.1", "m15.1.2"],
    revisits: ["m7.5.2"],
    foreshadows: ["m15.2.4", "m15.4.1"],
  },

  puzzle: (
    <>
      <p>
        In the plane you can fit only two mutually perpendicular directions, and in d dimensions only d. Relax
        &ldquo;perpendicular&rdquo; to &ldquo;at an angle between 84° and 96°&rdquo;. How many directions can you now fit in
        10,000 dimensions? A few tens of thousands, perhaps? This lesson shows there is room for more than seventy
        billion.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pick two directions at random. Their cosine is an average of d products of coordinates, and those products have
        random signs that cancel. An average of d independent bounded terms is within about 1/√d of zero, so in high
        dimension two random directions are nearly perpendicular. Since the chance of a large cosine is exponentially small
        in d, you can pick exponentially many random directions before any pair of them comes close.
      </p>
      <RandomAnglesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="cosine similarity">
        <p>
          For nonzero u and v in <M>{"\\mathbb{R}^d"}</M>,{" "}
          <M>{"\\cos\\theta(u, v) = \\langle u, v\\rangle / (\\|u\\|\\,\\|v\\|)"}</M>, the cosine of the angle between them. Vectors
          are <em>ε-orthogonal</em> if <M>{"|\\cos\\theta| < \\varepsilon"}</M>. For centred data vectors the cosine is the
          correlation of m7.5.2.
        </p>
        <Code>{COS}</Code>
      </Definition>

      <Theorem title="random sign vectors are nearly orthogonal">
        <p>
          Let u and v be independent and uniform on <M>{"\\{-1, 1\\}^d"}</M>. Then for every <M>{"\\varepsilon > 0"}</M>,
        </p>
        <MD>{"P\\bigl(|\\cos\\theta(u, v)| \\ge \\varepsilon\\bigr) \\le 2e^{-d\\varepsilon^2/2}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Both vectors have norm √d, so <M>{"\\cos\\theta = \\tfrac1d\\sum_i u_iv_i"}</M>. Condition on v. Each{" "}
          <M>{"u_iv_i"}</M> is then a uniform sign, independent across i, with mean 0 and values in [−1, 1]. Hoeffding&apos;s
          inequality (m15.1.2) for the mean of d such terms gives{" "}
          <M>{"P(|\\tfrac1d\\sum_i u_iv_i| \\ge \\varepsilon) \\le 2\\exp(-2d\\varepsilon^2/2^2)"}</M>, which is the bound. It
          holds for every v, so it holds unconditionally. <C>orth_bound</C> computes it.
        </p>
      </Proof>

      <Remark title="Gaussian directions">
        <p>
          For independent X, Y with distribution <M>{"N(0, I_d)"}</M>, rotation invariance makes{" "}
          <M>{"Z = \\langle X, Y\\rangle/\\|Y\\|"}</M> standard Gaussian whatever Y is, so{" "}
          <M>{"\\cos\\theta(X, Y) = Z/\\|X\\|"}</M>. By m15.2.1 the denominator is within O(1) of √d, so the cosine is close to{" "}
          <M>{"Z/\\sqrt d"}</M>: standard deviation 1/√d and Gaussian tails, as the picture above shows.
        </p>
      </Remark>

      <Theorem title="exponentially many nearly orthogonal directions">
        <p>
          For <M>{"0 < \\varepsilon < 1"}</M> there are <M>{"N = \\lfloor e^{d\\varepsilon^2/4}\\rfloor"}</M> vectors in{" "}
          <M>{"\\mathbb{R}^d"}</M> that are pairwise ε-orthogonal.
        </p>
      </Theorem>
      <Proof>
        <p>
          Draw N independent uniform sign vectors. By the union bound over the <M>{"N(N-1)/2"}</M> pairs, the probability that
          some pair has <M>{"|\\cos\\theta| \\ge \\varepsilon"}</M> is at most{" "}
          <M>{"N(N-1)e^{-d\\varepsilon^2/2} < N^2e^{-d\\varepsilon^2/2} \\le 1"}</M>. So with positive probability no pair fails,
          and some choice of N vectors works. <C>packing_size</C> gives N.
        </p>
      </Proof>

      <Example title="how many dimensions are needed">
        <p>
          Read the union bound the other way. For n random sign vectors to be pairwise ε-orthogonal with probability at least{" "}
          <M>{"1 - \\delta"}</M>, it suffices that <M>{"n(n-1)e^{-d\\varepsilon^2/2} \\le \\delta"}</M>, that is{" "}
          <M>{"d \\ge 2\\log(n(n-1)/\\delta)/\\varepsilon^2"}</M>. The dimension grows only with the logarithm of the number of
          vectors. With ε = 0.1 and δ = 0.01, a hundred vectors need 2762 dimensions, and a million need about 6450.{" "}
          <C>max_abs_cos</C> checks a sample directly.
        </p>
        <Code>{PACK}</Code>
      </Example>

      <Remark title="why it matters">
        <p>
          Near-orthogonality is why random features are nearly uncorrelated, why a learned embedding of modest dimension can
          hold far more nearly independent directions than it has coordinates, and why random projections keep distances
          (m15.2.4). It also says that a random direction is almost orthogonal to any fixed one, so a random guess carries
          almost no information about a hidden direction in high dimension.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: <p>Bound the probability that two independent random sign vectors in 1000 dimensions have a cosine of absolute value at least 0.1. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0135, tolerance: 0.00006 },
    },
    {
      key: "pack",
      rung: "check",
      prompt: <p>How many pairwise 0.2-orthogonal vectors in 400 dimensions does the packing theorem guarantee?</p>,
      answer: { kind: "numeric", value: 54, tolerance: 0.5 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can the number of ε-orthogonal directions be exponential in d, when at most d directions can be exactly orthogonal?</p>,
      answer: {
        kind: "choice",
        options: [
          "A single pair fails with probability exponentially small in d, so a union bound survives exponentially many pairs",
          "Exact orthogonality is a linear condition, and ε-orthogonality is not a condition at all",
          "Sign vectors are always exactly orthogonal",
          "Rounding errors make exactly orthogonal vectors only approximately orthogonal",
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

def cosine(u, v):
    dot = sum(a * b for a, b in zip(u, v))
    return dot / (math.sqrt(sum(a * a for a in u)) * math.sqrt(sum(b * b for b in v)))

def orth_bound(d, eps):
    return min(1.0, 2 * math.exp(-d * eps * eps / 2))

def packing_size(d, eps):
    return math.floor(math.exp(d * eps * eps / 4))

print(cosine([1, 0], [0, 3]), round(cosine([3, 4], [-6, -8]), 4), round(cosine([1, 2, 2], [2, -1, 2]), 4))
print(round(orth_bound(200, 0.2), 4), orth_bound(2, 0.5), packing_size(100, 0.3), packing_size(1000, 0.2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 -1.0 0.4444\n0.0366 1.0 9 22026",
          "0.0 1.0 0.4444\n0.0366 1.0 9 22026",
          "0.0 -1.0 0.4444\n0.0366 0.8825 9 22026",
          "0.0 -1.0 0.4444\n0.0366 1.0 94 22026",
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

def random_signs(n, d, rng):
    return [[rng.choice((-1, 1)) for _ in range(d)] for _ in range(n)]

def max_abs_cos(vectors):
    best = 0.0
    for i in range(len(vectors)):
        for j in range(i + 1, len(vectors)):
            u, v = vectors[i], vectors[j]
            dot = sum(a * b for a, b in zip(u, v))
            nu = math.sqrt(sum(a * a for a in u))
            nv = math.sqrt(sum(b * b for b in v))
            best = max(best, abs(dot) / (nu * nv))
    return best

def orth_dim(n, eps, delta):
    return math.ceil(2 * math.log(n * (n - 1) / delta) / (eps * eps))

print(max_abs_cos([[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1]]), max_abs_cos([[1, 1, 1, 1], [1, 1, 1, -1]]))
print(orth_dim(2, 0.5, 0.02), orth_dim(100, 0.1, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0 0.5\n37 2762", "0.0 0.75\n37 2762", "0.5 0.5\n37 2762", "0.0 0.5\n19 1381"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cosine(u, v)</C>; <C>orth_bound(d, eps)</C>, the bound <M>{"2e^{-d\\varepsilon^2/2}"}</M> capped at 1; and{" "}
          <C>packing_size(d, eps)</C>, the number <M>{"\\lfloor e^{d\\varepsilon^2/4}\\rfloor"}</M> of the packing theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def cosine(u, v):
    return 0.0

def orth_bound(d, eps):
    return 1.0

def packing_size(d, eps):
    return 0
`,
        solution: COS,
        tests: [
          { name: "cosine", code: `import math
assert cosine([1, 0], [0, 3]) == 0 and abs(cosine([1, 2], [2, 4]) - 1) < 1e-12 and abs(cosine([1, 0], [1, 1]) - 1 / math.sqrt(2)) < 1e-12
assert abs(cosine([1, 2, 3], [-1, -2, -3]) + 1) < 1e-12 and abs(cosine([2, 0, 0], [1, 1, 1]) - 1 / math.sqrt(3)) < 1e-12` },
          { name: "bounds", code: `import math
assert abs(orth_bound(1000, 0.1) - 2 * math.exp(-5)) < 1e-15 and orth_bound(1, 0.1) == 1.0 and abs(orth_bound(50, 0.4) - 2 * math.exp(-4)) < 1e-15
assert packing_size(400, 0.2) == 54 and packing_size(4, 0.5) == 1 and packing_size(100, 0.2) == 2 and packing_size(2500, 0.1) == 518` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>random_signs(n, d, rng)</C>, n vectors of d signs each drawn in order with <C>rng.choice((-1, 1))</C>;{" "}
          <C>max_abs_cos(vectors)</C>, the largest <M>{"|\\cos\\theta|"}</M> over all pairs (0 if there are fewer than two); and{" "}
          <C>orth_dim(n, eps, delta)</C>, the smallest whole d with <M>{"d \\ge 2\\log(n(n-1)/\\delta)/\\varepsilon^2"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def random_signs(n, d, rng):
    return []

def max_abs_cos(vectors):
    return 1.0

def orth_dim(n, eps, delta):
    return 0
`,
        solution: PACK,
        tests: [
          { name: "signs", code: `import random
r = random.Random(3); s = random_signs(4, 6, r)
r2 = random.Random(3); assert s == [[r2.choice((-1, 1)) for _ in range(6)] for _ in range(4)]
assert random_signs(0, 5, r) == [] and all(x in (-1, 1) for v in random_signs(5, 5, r) for x in v)` },
          { name: "cos", code: `import random
assert max_abs_cos([[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1], [1, -1, -1, 1]]) == 0 and max_abs_cos([[1, 2]]) == 0
assert abs(max_abs_cos([[1, 0], [1, 1], [0, -1]]) - 2 ** -0.5) < 1e-12 and abs(max_abs_cos([[1, 0], [-3, 0]]) - 1) < 1e-12
assert orth_dim(100, 0.1, 0.01) == 2762 and orth_dim(30, 0.3, 0.01) == 253
r = random.Random(5); assert max_abs_cos(random_signs(30, orth_dim(30, 0.3, 0.01), r)) < 0.3` },
        ],
      },
    },
    {
      key: "dim",
      rung: "stretch",
      prompt: (
        <p>
          What dimension does the union bound require for 1000 random sign vectors to be pairwise 0.1-orthogonal with
          probability at least 99%? Give the smallest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 3684, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Lengths concentrate at √d, and angles at 90°. The next lesson asks where the volume of a high-dimensional body is,
        and finds it in places that low-dimensional intuition would never look: near the boundary, and near the equator.
      </p>
    </>
  ),
};
