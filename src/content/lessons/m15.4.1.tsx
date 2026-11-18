import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CircleNetViz } from "@/components/viz/CircleNetViz";
import type { LessonContent } from "@/lib/types";

const NET = `import math

def greedy_net(points, eps):
    net = []
    for p in points:
        if all(math.dist(p, q) > eps for q in net):
            net.append(p)
    return net

def is_net(net, points, eps):
    return all(any(math.dist(p, q) <= eps for q in net) for p in points)

def volume_bound(d, eps):
    return (1 + 2 / eps) ** d`;

const USE = `import math

def sphere_points(n, d, rng):
    out = []
    for _ in range(n):
        g = [rng.gauss(0, 1) for _ in range(d)]
        r = math.sqrt(sum(x * x for x in g))
        out.append([x / r for x in g])
    return out

def cov_samples(d, eps, delta):
    return math.ceil(32 * (d * math.log(9) + math.log(2 / delta)) / (eps * eps))

def net_norm_bound(n, d, delta):
    return 2 * math.sqrt(2 * ((n + d) * math.log(9) + math.log(2 / delta)))`;

export const lesson: LessonContent = {
  id: "m15.4.1",
  minutes: 55,
  links: {
    requires: ["m15.3.4"],
    revisits: ["m15.3.1", "m15.2.3"],
    foreshadows: ["m15.4.2"],
  },

  puzzle: (
    <>
      <p>
        A union bound handles finitely many bad events. The operator norm of a random matrix is a supremum over every unit
        vector, uncountably many of them, and every one of them is a potential bad event. Yet m15.3.1 promised that a
        union bound proves covariance estimation with about d samples. How can a union bound over infinitely many events
        cost only a factor proportional to d?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Nearby directions give nearly the same value, so it is enough to check a finite set of directions that comes within
        ε of every other. Such a set needs about <M>{"(1/\\varepsilon)^d"}</M> points, which sounds enormous, but a union bound
        pays only the logarithm of the number of events: about <M>{"d\\log(1/\\varepsilon)"}</M>. Against tails like{" "}
        <M>{"e^{-nt^2}"}</M>, a cost proportional to d is affordable once n is a multiple of d.
      </p>
      <CircleNetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="nets and covering numbers">
        <p>
          A subset N of a set T in a metric space is an <em>ε-net</em> of T if every point of T is within distance ε of some
          point of N. The <em>covering number</em> <M>{"\\mathcal{N}(T, \\varepsilon)"}</M> is the smallest size of an ε-net. A
          set is <em>ε-separated</em> if its points are more than ε apart, and a maximal ε-separated subset of T is an ε-net
          (any point left uncovered could be added). <C>greedy_net</C> builds one from a finite sample by keeping each point
          that is more than ε from all those kept so far.
        </p>
        <Code>{NET}</Code>
      </Definition>

      <Theorem title="covering the sphere">
        <p>
          For <M>{"0 < \\varepsilon \\le 1"}</M>, the unit sphere <M>{"S^{d-1}"}</M> has an ε-net of size at most{" "}
          <M>{"(1 + 2/\\varepsilon)^d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let N be a maximal ε-separated subset of the sphere; it is an ε-net. The balls of radius ε/2 around its points are
          disjoint, and all lie inside the ball of radius 1 + ε/2. Comparing volumes, with the scaling{" "}
          <M>{"V_d(r) = V_dr^d"}</M> of m15.2.3,{" "}
          <M>{"|N|(\\varepsilon/2)^d \\le (1 + \\varepsilon/2)^d"}</M>, so <M>{"|N| \\le (1 + 2/\\varepsilon)^d"}</M>.
          This is <C>volume_bound</C>; for ε = 1/4 it is <M>{"9^d"}</M>.
        </p>
      </Proof>

      <Theorem title="norms from nets">
        <p>
          Let N be an ε-net of <M>{"S^{d-1}"}</M> and M an ε-net of <M>{"S^{n-1}"}</M> with <M>{"\\varepsilon < 1/2"}</M>. For any
          n × d matrix A, <M>{"\\|A\\| \\le (1 - 2\\varepsilon)^{-1}\\max_{u \\in N, v \\in M}\\langle Au, v\\rangle"}</M>. For a
          symmetric d × d matrix B, <M>{"\\|B\\| \\le (1 - 2\\varepsilon)^{-1}\\max_{u \\in N}|u^\\top Bu|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Choose unit x, y with <M>{"\\langle Ax, y\\rangle = \\|A\\|"}</M>, and u ∈ N, v ∈ M within ε of them. Then{" "}
          <M>{"\\langle Ax, y\\rangle - \\langle Au, v\\rangle = \\langle A(x - u), y\\rangle + \\langle Au, y - v\\rangle \\le 2\\varepsilon\\|A\\|"}</M>,
          so <M>{"\\langle Au, v\\rangle \\ge (1 - 2\\varepsilon)\\|A\\|"}</M>. For B, choose x with{" "}
          <M>{"|x^\\top Bx| = \\|B\\|"}</M> and u ∈ N near it:{" "}
          <M>{"|x^\\top Bx - u^\\top Bu| = |x^\\top B(x - u) + (x - u)^\\top Bu| \\le 2\\varepsilon\\|B\\|"}</M>.
        </p>
      </Proof>

      <Theorem title="covariance estimation, with constants">
        <p>
          For n independent <M>{"N(0, I_d)"}</M> samples, <M>{"0 < \\eta \\le 1"}</M> and <M>{"0 < \\delta < 1"}</M>: if{" "}
          <M>{"n \\ge 32(d\\log 9 + \\log(2/\\delta))/\\eta^2"}</M>, then <M>{"\\|\\hat\\Sigma - I\\| < \\eta"}</M> with probability at
          least <M>{"1 - \\delta"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take a 1/4-net N of the sphere with <M>{"|N| \\le 9^d"}</M>. By the previous theorem with ε = 1/4,{" "}
          <M>{"\\|\\hat\\Sigma - I\\| \\le 2\\max_{u \\in N}|u^\\top\\hat\\Sigma u - 1|"}</M>. For each fixed u, m15.3.1 gives{" "}
          <M>{"P(|u^\\top\\hat\\Sigma u - 1| \\ge \\eta/2) \\le 2e^{-n\\eta^2/32}"}</M>. The union bound over N gives{" "}
          <M>{"P(\\|\\hat\\Sigma - I\\| \\ge \\eta) \\le 9^d \\cdot 2e^{-n\\eta^2/32}"}</M>, which is at most δ under the stated
          condition. <C>cov_samples</C> computes the threshold; the d in it is the logarithm of the net size.
        </p>
      </Proof>

      <Example title="the norm of a Gaussian matrix">
        <p>
          For an n × d standard Gaussian A and fixed unit u, v, <M>{"\\langle Au, v\\rangle = \\sum_{i,j}A_{ij}u_jv_i"}</M> is standard
          Gaussian, since its variance is <M>{"\\sum_{i,j}u_j^2v_i^2 = 1"}</M>. With 1/4-nets on both spheres, at most{" "}
          <M>{"9^{n+d}"}</M> pairs, the union bound and the theorem above give{" "}
          <M>{"\\|A\\| \\le 2\\sqrt{2((n + d)\\log 9 + \\log(2/\\delta))}"}</M> with probability at least <M>{"1 - \\delta"}</M>,
          computed by <C>net_norm_bound</C>. That is a constant multiple of <M>{"\\sqrt n + \\sqrt d"}</M>, the right order, though
          for n = d = 100 it gives about 60 where Gordon&apos;s sharper argument (m15.3.4) gives 23.
        </p>
        <Code>{USE}</Code>
      </Example>

      <Remark title="what nets lose">
        <p>
          A net bound treats all points of the net as unrelated and pays for each. But nearby net points give strongly
          correlated values, and the union bound wastes most of its budget on near-duplicates. When the index set is not a
          sphere but something irregular, like the set of sparse unit vectors, this waste can be large. Chaining (m15.4.2)
          recovers it by using nets at every scale at once.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "vol",
      rung: "check",
      prompt: <p>How large is the volumetric bound on the size of a 0.1-net of the unit sphere in five dimensions?</p>,
      answer: { kind: "numeric", value: 4084101, tolerance: 0.5 },
    },
    {
      key: "cov",
      rung: "check",
      prompt: <p>How many samples does the covariance theorem require for d = 50, η = 0.5 and δ = 0.01?</p>,
      answer: { kind: "numeric", value: 14741, tolerance: 0.5 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does a union bound over a net of size <M>{"9^d"}</M> lead to a sample size proportional to d rather than to <M>{"9^d"}</M>?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each event has probability exponentially small in n, so the union bound needs n only of order log(9^d) = d log 9",
          "Most of the net's points are never used",
          "The events for different net points are independent",
          "The net has only d points that matter, one per coordinate axis",
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

def greedy_net(points, eps):
    net = []
    for p in points:
        if all(math.dist(p, q) > eps for q in net):
            net.append(p)
    return net

def is_net(net, points, eps):
    return all(any(math.dist(p, q) <= eps for q in net) for p in points)

def volume_bound(d, eps):
    return (1 + 2 / eps) ** d

P = [[0, 0], [0.5, 0], [1, 0], [2, 0], [2.4, 0]]; N = greedy_net(P, 0.6); print(N, is_net(N, P, 0.6), is_net(N[:2], P, 0.6))
print(volume_bound(2, 1), volume_bound(3, 0.5), round(math.log(volume_bound(100, 0.25)) / 100, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0, 0], [1, 0], [2, 0]] True False\n9.0 125.0 2.1972",
          "[[0, 0], [1, 0], [2, 0], [2.4, 0]] True False\n9.0 125.0 2.1972",
          "[[0, 0], [1, 0], [2, 0]] True True\n9.0 125.0 2.1972",
          "[[0, 0], [1, 0], [2, 0]] True False\n9.0 25.0 2.1972",
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

def sphere_points(n, d, rng):
    out = []
    for _ in range(n):
        g = [rng.gauss(0, 1) for _ in range(d)]
        r = math.sqrt(sum(x * x for x in g))
        out.append([x / r for x in g])
    return out

def cov_samples(d, eps, delta):
    return math.ceil(32 * (d * math.log(9) + math.log(2 / delta)) / (eps * eps))

def net_norm_bound(n, d, delta):
    return 2 * math.sqrt(2 * ((n + d) * math.log(9) + math.log(2 / delta)))

import random; S = sphere_points(200, 3, random.Random(0)); print(round(sum(x * x for x in S[7]), 6), all(abs(x) <= 1 for p in S for x in p))
print(cov_samples(1, 1, 2), round(net_norm_bound(10, 10, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 True\n71 18.7498", "1.0 False\n71 18.7498", "1.0 True\n70 18.7498", "3.0 True\n71 18.7498"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>greedy_net(points, eps)</C>, keeping each point in order if it is more than eps from every point kept so far;{" "}
          <C>is_net(net, points, eps)</C>, whether every point is within eps of the net; and <C>volume_bound(d, eps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def greedy_net(points, eps):
    return []

def is_net(net, points, eps):
    return False

def volume_bound(d, eps):
    return 0.0
`,
        solution: NET,
        tests: [
          { name: "greedy", code: `P = [[0, 0], [0.5, 0], [1, 0], [2, 0], [2.4, 0]]
assert greedy_net(P, 0.6) == [[0, 0], [1, 0], [2, 0]] and greedy_net(P, 0.4) == P[:4] and greedy_net(P, 5) == [[0, 0]] and greedy_net([], 1) == []
assert is_net([[0, 0], [1, 0], [2, 0]], P, 0.6) and not is_net([[0, 0], [1, 0]], P, 0.6) and is_net([[1, 0]], [[1, 1]], 1) and not is_net([], P, 1)` },
          { name: "cover", code: `import math, random
assert volume_bound(2, 1) == 9 and volume_bound(3, 0.5) == 125 and volume_bound(5, 0.1) - 4084101 < 1e-6
r = random.Random(1); S = []
for _ in range(400):
    g = [r.gauss(0, 1) for _ in range(3)]; n = math.sqrt(sum(x * x for x in g)); S.append([x / n for x in g])
for e in [0.5, 1.0]:
    N = greedy_net(S, e); assert is_net(N, S, e) and len(N) <= volume_bound(3, e) and all(math.dist(a, b) > e for i, a in enumerate(N) for b in N[i + 1:])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sphere_points(n, d, rng)</C>, n uniform points on the unit sphere, each a normalised vector of d values from{" "}
          <C>rng.gauss(0, 1)</C>; <C>cov_samples(d, eps, delta)</C>, the smallest whole n allowed by the covariance theorem
          with η = eps; and <C>net_norm_bound(n, d, delta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sphere_points(n, d, rng):
    return []

def cov_samples(d, eps, delta):
    return 0

def net_norm_bound(n, d, delta):
    return 0.0
`,
        solution: USE,
        tests: [
          { name: "sphere", code: `import math, random
S = sphere_points(50, 4, random.Random(2)); assert len(S) == 50 and all(abs(sum(x * x for x in p) - 1) < 1e-12 for p in S)
r = random.Random(3); g = [r.gauss(0, 1) for _ in range(3)]; n = math.sqrt(sum(x * x for x in g))
assert sphere_points(1, 3, random.Random(3)) == [[x / n for x in g]]` },
          { name: "bounds", code: `import math
assert cov_samples(1, 1, 2) == 71 and cov_samples(50, 0.5, 0.01) == 14741 and cov_samples(10, 0.1, 0.05) == math.ceil(3200 * (10 * math.log(9) + math.log(40)))
assert abs(net_norm_bound(10, 10, 2) - 2 * math.sqrt(80 * math.log(3))) < 1e-12 and abs(net_norm_bound(1, 2, 0.5) - 2 * math.sqrt(2 * (3 * math.log(9) + math.log(4)))) < 1e-12` },
        ],
      },
    },
    {
      key: "netnorm",
      rung: "stretch",
      prompt: (
        <p>
          What bound does the net argument give, with probability at least 99%, on the norm of a 100 × 100 standard Gaussian
          matrix? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 59.6485, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        One net at one scale is a blunt instrument. The next lesson bounds the expected supremum of a random process by
        chaining together nets at scales 1, 1/2, 1/4 and so on, and in doing so finds the right measure of the size of a set
        for this purpose.
      </p>
    </>
  ),
};
