import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CollisionViz } from "@/components/viz/CollisionViz";
import type { LessonContent } from "@/lib/types";

const BDAY = `import math

def birthday_exact(k, n):
    p_distinct = 1.0
    for i in range(k):
        p_distinct *= (n - i) / n
    return 1 - p_distinct

def birthday_approx(k, n):
    return 1 - math.exp(-k * (k - 1) / (2 * n))

def k_for(p, n):
    k = 1
    while birthday_exact(k, n) < p:
        k += 1
    return k`;

const MULTI = `from collections import Counter
from fractions import Fraction
from itertools import product
from math import comb

def multiset_probs(n, k):
    counts = Counter(tuple(sorted(t)) for t in product(range(n), repeat=k))
    return {m: Fraction(c, n ** k) for m, c in counts.items()}

def hypergeom(N, K, n, k):
    return Fraction(comb(K, k) * comb(N - K, n - k), comb(N, n))`;

export const lesson: LessonContent = {
  id: "m7.1.2",
  minutes: 55,
  links: {
    requires: ["m7.1.1", "m4.1.2"],
    revisits: ["m4.6.1"],
    foreshadows: ["m7.2.2", "m7.1.5"],
  },

  puzzle: (
    <>
      <p>
        Leibniz, one of the inventors of calculus, believed that with two dice a total of 11 is exactly as likely as a total
        of 12, since each can be made in only one way: 5 and 6, or 6 and 6. He was wrong by a factor of two. When is
        &ldquo;count the outcomes&rdquo; a correct way to find a probability, and when does it quietly fail?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Counting works only when the outcomes being counted are equally likely, and that is a fact about the experiment, not
        about how you choose to describe it. Dice are physically distinguishable, so the 36 ordered pairs are equally likely
        and the 21 unordered pairs are not. Once the right sample space is in hand, counting gives exact answers, and a
        couple of inequalities turn them into formulas you can reason with, such as the √n rule for collisions.
      </p>
      <CollisionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="naive probability">
        <p>
          If Ω is finite and every outcome has the same probability, then <M>{"P(A) = |A|/|\\Omega|"}</M>. This follows from
          the axioms: the singletons are disjoint with total probability 1, so each has probability <M>{"1/|\\Omega|"}</M>. The
          assumption must come from symmetry of the physical experiment.
        </p>
      </Definition>

      <Theorem title="the sampling table">
        <p>Choosing k items from n, the number of possible results is</p>
        <MD>{"\\begin{array}{l|cc} & \\text{with replacement} & \\text{without replacement} \\\\ \\hline \\text{ordered} & n^k & n(n-1)\\cdots(n-k+1) \\\\ \\text{unordered} & \\binom{n+k-1}{k} & \\binom{n}{k} \\end{array}"}</MD>
      </Theorem>
      <Proof>
        <p>
          The ordered counts are the product rule. Unordered without replacement divides the ordered count by the k! orders
          of each set. Unordered with replacement is stars and bars: a multiset is a row of k stars split into n groups by n
          − 1 bars, and choosing which k of the n + k − 1 positions hold stars determines it.
        </p>
      </Proof>

      <Remark title="the Bose–Einstein trap">
        <p>
          Three of the four cells give equally likely outcomes when the sampling is uniform. The fourth does not: when k
          draws are made with replacement, the multiset {"{0, 1}"} arises from two ordered sequences and {"{0, 0}"} from one.
          Leibniz counted unordered pairs. (Photons, remarkably, do behave as if the multisets were equally likely, which is
          the physics of Bose–Einstein statistics; dice do not.)
        </p>
        <Code>{MULTI}</Code>
      </Remark>

      <Theorem title="symmetry of positions">
        <p>
          Shuffle n distinct cards uniformly. For every position j and card c, P(card c is at position j) = 1/n. In
          particular the second card is an ace with probability 4/52, the same as the first.
        </p>
      </Theorem>
      <Proof>
        <p>
          Exactly (n − 1)! of the n! orderings put c at position j, since the other cards fill the remaining positions in any
          order. Dividing by n! gives 1/n.
        </p>
      </Proof>

      <Example title="hypergeometric probabilities">
        <p>
          An urn holds N balls, K of them white. Draw n without replacement. All <M>{"\\binom{N}{n}"}</M> subsets are equally
          likely, and those with exactly k white balls number <M>{"\\binom{K}{k}\\binom{N-K}{n-k}"}</M>, so
        </p>
        <MD>{"P(k \\text{ white}) = \\binom{K}{k}\\binom{N-K}{n-k}\\Big/\\binom{N}{n}."}</MD>
        <p>
          Since these probabilities add to 1, multiplying through gives Vandermonde&apos;s identity: a story proof, where an
          identity follows from counting one thing two ways.
        </p>
      </Example>

      <Theorem title="collisions">
        <p>Draw k values uniformly and independently from n. Then</p>
        <MD>{"P(\\text{no repeat}) = \\prod_{i=0}^{k-1}\\Big(1 - \\frac{i}{n}\\Big) \\le e^{-k(k-1)/2n}, \\qquad P(\\text{some repeat}) \\le \\frac{k(k-1)}{2n}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The ordered sequences with no repeat number <M>{"n(n-1)\\cdots(n-k+1)"}</M> out of <M>{"n^k"}</M>, which is the
          product. Since <M>{"1 - x \\le e^{-x}"}</M>, the product is at most{" "}
          <M>{"\\exp(-\\sum_{i<k} i/n) = e^{-k(k-1)/2n}"}</M>. For the second bound, a repeat means some pair of draws agree;
          each of the <M>{"\\binom{k}{2}"}</M> pairs agrees with probability 1/n, and the union bound gives{" "}
          <M>{"k(k-1)/2n"}</M>.
        </p>
        <Code>{BDAY}</Code>
      </Proof>
      <p>
        So a collision becomes likely once k is of order √n: about 23 people for 365 birthdays, and about{" "}
        <M>{"2^{32}"}</M> items for a 64-bit hash. This is the birthday bound that sets hash and random-identifier lengths.
      </p>
    </>
  ),

  practice: [
    {
      key: "twelve",
      rung: "check",
      prompt: <p>Two fair dice are rolled. What is the probability that the total is 11? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0556, tolerance: 0.0001 },
    },
    {
      key: "multisets",
      rung: "check",
      prompt: <p>How many multisets of size 3 can be formed from 4 types of item?</p>,
      answer: { kind: "numeric", value: 20 },
    },
    {
      key: "hats",
      rung: "apply",
      prompt: <p>Ten people&apos;s hats are returned in a uniformly random order. What is the probability that the seventh person gets their own hat?</p>,
      answer: { kind: "choice", options: ["1/10", "1/7", "1/4", "It depends on whether the first six got their own hats, so it cannot be given."], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def birthday_exact(k, n):
    p_distinct = 1.0
    for i in range(k):
        p_distinct *= (n - i) / n
    return 1 - p_distinct

def birthday_approx(k, n):
    return 1 - math.exp(-k * (k - 1) / (2 * n))

def k_for(p, n):
    k = 1
    while birthday_exact(k, n) < p:
        k += 1
    return k

print(round(birthday_exact(23, 365), 4), round(birthday_approx(23, 365), 4))
print(k_for(0.5, 365), k_for(0.5, 2 ** 16), birthday_exact(366, 365))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5073 0.5\n23 302 1.0", "0.4927 0.5\n23 302 1.0", "0.5073 0.5\n183 32768 1.0", "0.5073 0.5\n23 302 0.9973"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter
from fractions import Fraction
from itertools import product
from math import comb

def multiset_probs(n, k):
    counts = Counter(tuple(sorted(t)) for t in product(range(n), repeat=k))
    return {m: Fraction(c, n ** k) for m, c in counts.items()}

def hypergeom(N, K, n, k):
    return Fraction(comb(K, k) * comb(N - K, n - k), comb(N, n))

d = multiset_probs(2, 2)
print(sorted((m, str(p)) for m, p in d.items()))
print(len(multiset_probs(3, 2)), hypergeom(10, 4, 3, 2), sum(hypergeom(10, 4, 3, j) for j in range(4)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[((0, 0), '1/4'), ((0, 1), '1/2'), ((1, 1), '1/4')]\n6 3/10 1",
          "[((0, 0), '1/3'), ((0, 1), '1/3'), ((1, 1), '1/3')]\n6 3/10 1",
          "[((0, 0), '1/4'), ((0, 1), '1/2'), ((1, 1), '1/4')]\n9 3/10 1",
          "[((0, 0), '1/4'), ((0, 1), '1/2'), ((1, 1), '1/4')]\n6 1/5 1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>birthday_exact(k, n)</C>, the probability of at least one repeat among k uniform draws from n values;{" "}
          <C>birthday_approx(k, n)</C> = 1 − exp(−k(k−1)/2n); and <C>k_for(p, n)</C>, the smallest k whose exact collision
          probability is at least p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def birthday_exact(k, n):
    return k / n

def birthday_approx(k, n):
    return 0.0

def k_for(p, n):
    return 1
`,
        solution: BDAY,
        tests: [
          { name: "values", code: `assert birthday_exact(1, 365) == 0 and birthday_exact(366, 365) == 1.0
assert abs(birthday_exact(23, 365) - 0.507297) < 1e-6 and abs(birthday_exact(2, 10) - 0.1) < 1e-12
assert abs(birthday_approx(23, 365) - (1 - math.exp(-253 / 365))) < 1e-12
for k in (5, 20, 40):
    assert birthday_exact(k, 365) >= birthday_approx(k, 365) - 1e-12 and birthday_exact(k, 365) <= k * (k - 1) / 730 + 1e-12` },
          { name: "thresholds", code: `assert k_for(0.5, 365) == 23 and k_for(0.9, 365) == 41
assert k_for(0.5, 2 ** 16) == 302 and k_for(0.0, 10) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>multiset_probs(n, k)</C>, the exact distribution (Fractions) of the sorted outcome when k values are drawn
          uniformly with replacement from range(n), keyed by sorted tuples; and <C>hypergeom(N, K, n, k)</C>, the probability
          of exactly k white balls when n are drawn without replacement from N balls of which K are white.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter
from fractions import Fraction
from itertools import product
from math import comb

def multiset_probs(n, k):
    return {}

def hypergeom(N, K, n, k):
    return Fraction(0)
`,
        solution: MULTI,
        tests: [
          { name: "multisets", code: `d = multiset_probs(6, 2)
assert len(d) == 21 and sum(d.values()) == 1
assert d[(5, 5)] == Fraction(1, 36) and d[(4, 5)] == Fraction(1, 18)
d3 = multiset_probs(3, 3)
assert len(d3) == comb(5, 3) and d3[(0, 1, 2)] == Fraction(6, 27) and d3[(1, 1, 1)] == Fraction(1, 27)` },
          { name: "hypergeometric", code: `assert hypergeom(10, 4, 3, 2) == Fraction(3, 10)
assert sum(hypergeom(52, 13, 5, k) for k in range(6)) == 1
assert hypergeom(52, 4, 5, 4) == Fraction(48, comb(52, 5))
assert hypergeom(5, 2, 3, 3) == 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          k values are drawn uniformly and independently from n. Prove that the probability that some two of them are equal
          is at most k(k − 1)/(2n).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the event as the union over the k(k−1)/2 pairs i < j of the events Eᵢⱼ = {draw i equals draw j}.",
          "Shows P(Eᵢⱼ) = 1/n, for example by counting: n of the n² equally likely values of the pair agree.",
          "Applies the union bound to get at most (k(k−1)/2)·(1/n) = k(k−1)/(2n).",
        ],
      },
    },
    {
      key: "hash32",
      rung: "stretch",
      prompt: <p>What is the smallest number of independent uniform 32-bit values for which the probability of a repeat is at least 1/2?</p>,
      answer: { kind: "numeric", value: 77164, tolerance: 1 },
    },
  ],

  teachBack:
    "Explain to a friend when counting outcomes gives correct probabilities, why Leibniz's unordered pairs of dice were not equally likely, and why collisions among n possible values become likely after about √n draws.",

  glimpse: (
    <>
      <p>
        Every experiment in this lesson had a symmetry that made outcomes equally likely. Most do not, and the rest of the
        course works with probabilities that are not uniform: first by conditioning, which updates probabilities when
        information arrives, and then with random variables and their named distributions, where the hypergeometric reappears
        beside the binomial it approaches when the urn is large.
      </p>
    </>
  ),
};
