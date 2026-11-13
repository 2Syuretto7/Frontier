import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PmfCdfViz } from "@/components/viz/PmfCdfViz";
import type { LessonContent } from "@/lib/types";

const PUSH = `from fractions import Fraction

def pushforward(X, pmf):
    dist = {}
    for w, p in pmf.items():
        dist[X(w)] = dist.get(X(w), 0) + p
    return dict(sorted(dist.items()))

def cdf(dist):
    total, out = 0, []
    for x in sorted(dist):
        total += dist[x]
        out.append((x, total))
    return out`;

const EXTREMES = `from fractions import Fraction

def max_pmf(n, k):
    F = lambda m: Fraction(m, n) ** k
    return {m: F(m) - F(m - 1) for m in range(1, n + 1)}

def min_pmf(n, k):
    S = lambda m: Fraction(n - m + 1, n) ** k
    return {m: S(m) - S(m + 1) for m in range(1, n + 1)}`;

export const lesson: LessonContent = {
  id: "m7.2.1",
  minutes: 55,
  links: {
    requires: ["m7.1.5", "m4.6.3"],
    revisits: ["m0.8.4"],
    foreshadows: ["m7.2.2", "m7.3.1", "m7.3.3"],
  },

  puzzle: (
    <>
      <p>
        Roll three dice and record the largest. What is the probability that it is 5? Listing the 216 outcomes would work,
        but there is a two-line answer if you ask a different question first: what is the probability that the largest is
        at most 5?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A random variable is a number computed from the outcome. Its distribution says how the probability on Ω is carried
        over to the number line, and the cumulative distribution function F(x) = P(X ≤ x) records it as one increasing
        function. Events of the form &ldquo;X ≤ x&rdquo; are often far easier to compute than &ldquo;X = x&rdquo;, and the
        pmf is then recovered from the jumps of F.
      </p>
      <PmfCdfViz />
    </>
  ),

  theory: (
    <>
      <Definition title="random variable and distribution">
        <p>
          A random variable is a function X: Ω → ℝ such that every set {"{X ≤ x}"} is an event. Its distribution is the
          probability <M>{"S \\mapsto P(X \\in S)"}</M> on sets of real numbers. X is discrete if it takes values in a finite
          or countable set; then its probability mass function <M>{"p_X(x) = P(X = x)"}</M> determines the distribution, by{" "}
          <M>{"P(X \\in S) = \\sum_{x \\in S}p_X(x)"}</M>.
        </p>
        <Code>{PUSH}</Code>
      </Definition>

      <Remark title="a variable is not its distribution">
        <p>
          On one die, X = the face and Y = 7 − X have the same distribution, but X + Y = 7 always while 2X is spread out.
          Statements about one variable at a time depend only on its distribution; statements about several need their joint
          behaviour.
        </p>
      </Remark>

      <Definition title="cumulative distribution function">
        <p>
          The CDF of X is <M>{"F_X(x) = P(X \\le x)"}</M>, defined for every real x.
        </p>
      </Definition>

      <Theorem title="properties of a CDF">
        <p>
          F is non-decreasing, right-continuous, tends to 0 as x → −∞ and to 1 as x → ∞, and{" "}
          <M>{"P(X = x) = F(x) - F(x^-)"}</M>, where <M>{"F(x^-)"}</M> is the limit from the left. Also{" "}
          <M>{"P(a < X \\le b) = F(b) - F(a)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If x ≤ y then {"{X ≤ x}"} ⊆ {"{X ≤ y}"}, so F is non-decreasing. For <M>{"x_n \\downarrow x"}</M> the events{" "}
          {"{X ≤ xₙ}"} decrease to {"{X ≤ x}"}, so continuity of probability gives <M>{"F(x_n) \\to F(x)"}</M>. The events{" "}
          {"{X ≤ −n}"} decrease to ∅ and {"{X ≤ n}"} increase to Ω, giving the limits. For <M>{"x_n \\uparrow x"}</M> with{" "}
          <M>{"x_n < x"}</M>, {"{X ≤ xₙ}"} increase to {"{X < x}"}, so <M>{"F(x^-) = P(X < x)"}</M> and the jump is P(X = x).
          The last formula is additivity: {"{X ≤ b}"} is the disjoint union of {"{X ≤ a}"} and {"{a < X ≤ b}"}.
        </p>
      </Proof>
      <p>
        Conversely, every function with these properties is the CDF of some random variable, a fact the lesson on the
        universality of the uniform makes concrete.
      </p>

      <Theorem title="functions of a random variable">
        <p>
          If X is discrete and g is any function, Y = g(X) is discrete with{" "}
          <M>{"p_Y(y) = \\sum_{x:\\, g(x) = y}p_X(x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The event {"{Y = y}"} is the disjoint union over x with g(x) = y of the events {"{X = x}"}; apply countable
          additivity.
        </p>
      </Proof>

      <Definition title="independent random variables">
        <p>
          Discrete X and Y are independent if <M>{"P(X = x, Y = y) = P(X = x)P(Y = y)"}</M> for all x, y; equivalently, every
          event about X is independent of every event about Y. A family is independent if this holds for every finite
          subfamily, with the product over its members.
        </p>
      </Definition>

      <Example title="extremes through the CDF">
        <p>
          Let <M>{"M = \\max(X_1, \\dots, X_k)"}</M> for independent <M>{"X_i"}</M> with common CDF F. Then M ≤ m exactly when
          every <M>{"X_i \\le m"}</M>, so <M>{"F_M(m) = F(m)^k"}</M>. For three fair dice,{" "}
          <M>{"P(M = 5) = (5/6)^3 - (4/6)^3 = 61/216"}</M>. The minimum works the same way with the survival function{" "}
          <M>{"P(X > m)"}</M>: the minimum exceeds m exactly when all of them do.
        </p>
        <Code>{EXTREMES}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "max5",
      rung: "check",
      prompt: <p>Three fair dice are rolled. What is the probability that the largest is 5? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2824, tolerance: 0.0001 },
    },
    {
      key: "jump",
      rung: "check",
      prompt: <p>A CDF has F(2⁻) = 0.35 and F(2) = 0.6. What is P(X = 2)?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "notcdf",
      rung: "apply",
      prompt: <p>Which of these functions cannot be a CDF?</p>,
      answer: {
        kind: "choice",
        options: [
          "F(x) = 0 for x < 0 and F(x) = 1 − x/2 for x ≥ 0, capped below at 0",
          "F(x) = 0 for x < 1 and F(x) = 1 for x ≥ 1",
          "F(x) = 1/(1 + e^(−x))",
          "F(x) = 0 for x < 0, x for 0 ≤ x < 1, and 1 for x ≥ 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def pushforward(X, pmf):
    dist = {}
    for w, p in pmf.items():
        dist[X(w)] = dist.get(X(w), 0) + p
    return dict(sorted(dist.items()))

def cdf(dist):
    total, out = 0, []
    for x in sorted(dist):
        total += dist[x]
        out.append((x, total))
    return out

dice = {(a, b): Fraction(1, 36) for a in range(1, 7) for b in range(1, 7)}
d = pushforward(lambda w: max(w), dice)
print(d[1], d[6], len(d))
print([str(F) for x, F in cdf(d)][:3], *cdf(pushforward(lambda w: w[0] - w[1], dice))[5])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1/36 11/36 6\n['1/36', '1/9', '1/4'] 0 7/12",
          "1/36 11/36 6\n['1/36', '1/12', '5/36'] 0 7/12",
          "1/36 1/6 6\n['1/36', '1/9', '1/4'] 0 7/12",
          "1/36 11/36 6\n['1/36', '1/9', '1/4'] 0 1/6",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def max_pmf(n, k):
    F = lambda m: Fraction(m, n) ** k
    return {m: F(m) - F(m - 1) for m in range(1, n + 1)}

def min_pmf(n, k):
    S = lambda m: Fraction(n - m + 1, n) ** k
    return {m: S(m) - S(m + 1) for m in range(1, n + 1)}

m = max_pmf(6, 2)
print(m[6], m == {j: Fraction(2 * j - 1, 36) for j in range(1, 7)}, sum(max_pmf(6, 3).values()))
print(min_pmf(6, 2)[1], min_pmf(6, 2)[6], min_pmf(2, 3)[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["11/36 True 1\n11/36 1/36 7/8", "11/36 True 1\n1/36 11/36 7/8", "11/36 False 1\n11/36 1/36 7/8", "11/36 True 1\n11/36 1/36 1/8"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pushforward(X, pmf)</C>, the distribution of the random variable X (a function of the outcome) as a dict
          sorted by value, and <C>cdf(dist)</C>, the list of (x, F(x)) at each value of a discrete distribution, in
          increasing x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def pushforward(X, pmf):
    return {}

def cdf(dist):
    return []
`,
        solution: PUSH,
        tests: [
          { name: "pushforward", code: `dice = {(a, b): Fraction(1, 36) for a in range(1, 7) for b in range(1, 7)}
s = pushforward(lambda w: w[0] + w[1], dice)
assert list(s) == list(range(2, 13)) and s[7] == Fraction(1, 6) and s[12] == Fraction(1, 36)
p = pushforward(lambda w: w[0] % 2, dice)
assert p == {0: Fraction(1, 2), 1: Fraction(1, 2)}` },
          { name: "cdf", code: `c = cdf({3: 0.2, 1: 0.5, 2: 0.3})
assert [x for x, _ in c] == [1, 2, 3] and abs(c[0][1] - 0.5) < 1e-12 and abs(c[1][1] - 0.8) < 1e-12 and abs(c[2][1] - 1) < 1e-12
dice = {(a, b): Fraction(1, 36) for a in range(1, 7) for b in range(1, 7)}
assert cdf(pushforward(max, dice))[2] == (3, Fraction(1, 4))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_pmf(n, k)</C> and <C>min_pmf(n, k)</C>, the exact pmfs (Fractions) of the largest and the smallest of k
          independent fair n-sided dice, using the CDF and the survival function rather than enumeration.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def max_pmf(n, k):
    return {m: Fraction(1, n) for m in range(1, n + 1)}

def min_pmf(n, k):
    return {m: Fraction(1, n) for m in range(1, n + 1)}
`,
        solution: EXTREMES,
        tests: [
          { name: "max", code: `from itertools import product
for n, k in [(6, 2), (4, 3), (3, 4)]:
    m = max_pmf(n, k)
    brute = {}
    for t in product(range(1, n + 1), repeat=k):
        brute[max(t)] = brute.get(max(t), 0) + Fraction(1, n ** k)
    assert m == brute
assert max_pmf(6, 3)[5] == Fraction(61, 216)` },
          { name: "min", code: `from itertools import product
for n, k in [(6, 2), (5, 3)]:
    m = min_pmf(n, k)
    brute = {}
    for t in product(range(1, n + 1), repeat=k):
        brute[min(t)] = brute.get(min(t), 0) + Fraction(1, n ** k)
    assert m == brute
assert sum(min_pmf(10, 4).values()) == 1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that every CDF is right-continuous, and that <M>{"P(X = x) = F(x) - \\lim_{y \\uparrow x}F(y)"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "For xₙ decreasing to x, notes the events {X ≤ xₙ} decrease with intersection {X ≤ x}, and uses continuity from above (plus monotonicity of F for general approach from the right).",
          "For yₙ increasing to x with yₙ < x, notes the events {X ≤ yₙ} increase with union {X < x}, so the left limit is P(X < x).",
          "Concludes P(X = x) = P(X ≤ x) − P(X < x) by additivity.",
        ],
      },
    },
    {
      key: "min4",
      rung: "stretch",
      prompt: <p>Four fair dice are rolled. What is the probability that the smallest is exactly 3? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.135, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a random variable and its distribution are, what the CDF is and why it is right-continuous with jumps equal to the pmf, and how to find the distribution of a maximum through the CDF.",

  glimpse: (
    <>
      <p>
        A handful of distributions recur so often that they have names and stories: the next lesson meets the Bernoulli,
        binomial, geometric, Poisson and categorical. For continuous variables the CDF has no jumps at all, and its
        derivative, the density, takes over the role of the pmf.
      </p>
    </>
  ),
};
