import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SmallSetsViz } from "@/components/viz/SmallSetsViz";
import type { LessonContent } from "@/lib/types";

const DISCRETE = `def abs_cont(nu, mu):
    return all(p == 0 for x, p in nu.items() if mu.get(x, 0) == 0)

def singular(nu, mu):
    return all(p == 0 or mu.get(x, 0) == 0 for x, p in nu.items())

def lebesgue_split(nu, mu):
    ac = {x: p for x, p in nu.items() if mu.get(x, 0) > 0}
    sing = {x: p for x, p in nu.items() if mu.get(x, 0) == 0}
    return ac, sing`;

const SMALL = `def cell_masses(f, n):
    return [f((i + 0.5) / n) / n for i in range(n)]

def worst_small_set(f, delta, n):
    masses = sorted(cell_masses(f, n), reverse=True)
    return sum(masses[:int(delta * n + 1e-9)])

def tv_distance(p, q):
    keys = set(p) | set(q)
    return sum(abs(p.get(k, 0) - q.get(k, 0)) for k in keys) / 2`;

export const lesson: LessonContent = {
  id: "m18.4.1",
  minutes: 40,
  links: {
    requires: ["m18.3.1", "m18.2.1"],
    revisits: ["m7.3.1", "m18.1.3"],
    foreshadows: ["m18.4.2", "m18.4.3"],
  },

  puzzle: (
    <>
      <p>
        A density turns Lebesgue measure into a probability: <M>{"P(A) = \\int_A f\\, d\\lambda"}</M>. Which probability measures on ℝ arise this way?
        Not the ones with atoms, since a point has length zero. The Cantor law has no atoms, yet it has no density either.
        What property of a measure, stated without mentioning densities, decides whether a density exists?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If <M>{"\\nu(A) = \\int_A f\\, d\\mu"}</M>, then a set that μ thinks is empty carries no ν-mass, and a set μ thinks is tiny carries little.
        So the test is whether ν can hide mass where μ sees nothing. An atom hides mass in a point; the Cantor law hides all
        of it in a set of length zero.
      </p>
      <SmallSetsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="absolute continuity and singularity">
        <p>Let μ and ν be measures on the same σ-algebra.</p>
        <ul>
          <li>
            ν is absolutely continuous with respect to μ, written <M>{"\\nu \\ll \\mu"}</M>, if μ(A) = 0 implies ν(A) = 0.
          </li>
          <li>
            μ and ν are mutually singular, <M>{"\\mu \\perp \\nu"}</M>, if some set S has μ(S) = 0 and <M>{"\\nu(S^c) = 0"}</M>: they live on
            disjoint sets.
          </li>
          <li>They are equivalent if each is absolutely continuous with respect to the other: they have the same null sets.</li>
        </ul>
        <p>
          On a finite set these are statements about supports (<C>abs_cont</C>, <C>singular</C>). If <M>{"\\nu(A) = \\int_A f\\, d\\mu"}</M> with f ≥ 0,
          then <M>{"\\nu \\ll \\mu"}</M>, since an integral over a null set is 0 (m18.2.1).
        </p>
      </Definition>

      <Theorem title="the ε-δ form">
        <p>
          If ν is finite, then <M>{"\\nu \\ll \\mu"}</M> if and only if for every ε &gt; 0 there is δ &gt; 0 with μ(A) &lt; δ ⟹ ν(A) &lt; ε.
        </p>
      </Theorem>
      <Proof>
        <p>
          The condition clearly forces ν(A) &lt; ε for every ε when μ(A) = 0. Conversely, suppose it fails for some ε: there
          are sets <M>{"A_n"}</M> with <M>{"\\mu(A_n) < 2^{-n}"}</M> and <M>{"\\nu(A_n) \\ge \\varepsilon"}</M>. Let <M>{"B = \\limsup_n A_n"}</M>. Since{" "}
          <M>{"\\sum \\mu(A_n) < \\infty"}</M>, the first Borel-Cantelli argument (m18.3.3) gives μ(B) = 0. But{" "}
          <M>{"\\nu\\big(\\bigcup_{k \\ge n} A_k\\big) \\ge \\varepsilon"}</M> for every n, and ν is finite, so continuity from above gives ν(B) ≥ ε. So{" "}
          <M>{"\\nu \\not\\ll \\mu"}</M>.
        </p>
      </Proof>

      <Example title="the heaviest small set">
        <p>
          For a density f on [0, 1], the largest ν-mass in a set of length δ comes from the cells where f is largest (
          <C>worst_small_set</C>). For f = 2x it is <M>{"2\\delta - \\delta^2"}</M>, which tends to 0, as the theorem demands. The figure shows
          the two failures: an atom of weight 0.3 keeps the worst mass above 0.3, and the Cantor law keeps it at 1.
        </p>
        <Code>{SMALL}</Code>
      </Example>

      <Definition title="absolutely continuous functions">
        <p>
          F on [a, b] is absolutely continuous if for every ε &gt; 0 there is δ &gt; 0 such that{" "}
          <M>{"\\sum_i |F(b_i) - F(a_i)| < \\varepsilon"}</M> for every finite family of disjoint intervals <M>{"(a_i, b_i)"}</M> of total length less
          than δ. A distribution function is absolutely continuous exactly when its law is <M>{"\\ll \\lambda"}</M>. The Cantor function is
          continuous but not absolutely continuous: the stage-m intervals have total length <M>{"(2/3)^m"}</M> and total increase 1.
        </p>
      </Definition>

      <Theorem title="Lebesgue decomposition">
        <p>
          If μ and ν are σ-finite, then ν splits uniquely as <M>{"\\nu = \\nu_{ac} + \\nu_s"}</M> with <M>{"\\nu_{ac} \\ll \\mu"}</M> and{" "}
          <M>{"\\nu_s \\perp \\mu"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          On a finite set put <M>{"\\nu_{ac}"}</M> on the support of μ and <M>{"\\nu_s"}</M> off it (<C>lebesgue_split</C>). In general the singular
          set is found from the Radon-Nikodym construction of m18.4.2. Uniqueness: if{" "}
          <M>{"\\nu_{ac} - \\nu_{ac}' = \\nu_s' - \\nu_s"}</M>, the left side is <M>{"\\ll \\mu"}</M> and the right side is <M>{"\\perp \\mu"}</M>, and a signed measure
          with both properties is zero. With μ = λ and the singular part split again into atoms and the rest, this is the
          three-way decomposition of laws from m18.3.1.
        </p>
        <Code>{DISCRETE}</Code>
      </Proof>

      <Remark title="total variation">
        <p>
          The total variation distance between probability measures is <M>{"\\|P - Q\\| = \\sup_A |P(A) - Q(A)|"}</M>. Both are absolutely
          continuous with respect to μ = P + Q, and if p and q are their densities then
        </p>
        <MD>{"\\|P - Q\\| = \\tfrac12 \\int |p - q|\\, d\\mu,"}</MD>
        <p>
          attained on A = {"{p > q}"} (<C>tv_distance</C> on a finite set). It equals 1 exactly when <M>{"P \\perp Q"}</M>. Densities with
          respect to a common measure are what m18.4.2 guarantees.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "delta",
      rung: "check",
      prompt: (
        <p>
          ν has density 3x² on [0, 1]. Find the largest δ such that every set A with λ(A) ≤ δ has ν(A) ≤ 0.1. Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0345, tolerance: 0.0001 },
    },
    {
      key: "split",
      rung: "check",
      prompt: <p>U is uniform on [0, 1] and X = max(U, 0.3). What is the total mass of the absolutely continuous part of the law of X?</p>,
      answer: { kind: "numeric", value: 0.7, tolerance: 0.0001 },
    },
    {
      key: "cantor",
      rung: "apply",
      prompt: <p>How are the Cantor law ν and Lebesgue measure λ on [0, 1] related?</p>,
      answer: {
        kind: "choice",
        options: [
          "Mutually singular: ν lives on the Cantor set, which λ gives measure 0",
          "ν ≪ λ, because ν has no atoms",
          "λ ≪ ν, because the Cantor function is continuous",
          "Equivalent, because both give [0, 1] measure 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def abs_cont(nu, mu):
    return all(p == 0 for x, p in nu.items() if mu.get(x, 0) == 0)

def singular(nu, mu):
    return all(p == 0 or mu.get(x, 0) == 0 for x, p in nu.items())

def lebesgue_split(nu, mu):
    ac = {x: p for x, p in nu.items() if mu.get(x, 0) > 0}
    sing = {x: p for x, p in nu.items() if mu.get(x, 0) == 0}
    return ac, sing

mu = {0: 0.5, 1: 0.5, 2: 0.0}; nu = {0: 0.2, 1: 0.3, 2: 0.5}; print(abs_cont(nu, mu), abs_cont(mu, nu), singular(nu, mu), lebesgue_split(nu, mu))
print(singular({2: 1.0}, mu), abs_cont({0: 0.0, 2: 0.0, 1: 1.0}, mu), lebesgue_split({5: 1.0}, mu))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "False True False ({0: 0.2, 1: 0.3}, {2: 0.5})\nTrue True ({}, {5: 1.0})",
          "True True False ({0: 0.2, 1: 0.3}, {2: 0.5})\nTrue True ({}, {5: 1.0})",
          "False True True ({0: 0.2, 1: 0.3}, {2: 0.5})\nTrue False ({}, {5: 1.0})",
          "False False False ({2: 0.5}, {0: 0.2, 1: 0.3})\nFalse True ({5: 1.0}, {})",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cell_masses(f, n):
    return [f((i + 0.5) / n) / n for i in range(n)]

def worst_small_set(f, delta, n):
    masses = sorted(cell_masses(f, n), reverse=True)
    return sum(masses[:int(delta * n + 1e-9)])

def tv_distance(p, q):
    keys = set(p) | set(q)
    return sum(abs(p.get(k, 0) - q.get(k, 0)) for k in keys) / 2

print(cell_masses(lambda x: 2 * x, 4), worst_small_set(lambda x: 2 * x, 0.5, 4), worst_small_set(lambda x: 1.0, 0.25, 8))
print(round(tv_distance({0: 0.5, 1: 0.5}, {0: 0.8, 1: 0.2}), 4), tv_distance({0: 1.0}, {1: 1.0}), round(worst_small_set(lambda x: 3 * x * x, 0.1, 10), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0625, 0.1875, 0.3125, 0.4375] 0.75 0.25\n0.3 1.0 0.2707",
          "[0.0625, 0.1875, 0.3125, 0.4375] 0.75 0.25\n0.6 2.0 0.2707",
          "[0.125, 0.375, 0.625, 0.875] 1.5 0.25\n0.3 1.0 0.2707",
          "[0.0625, 0.1875, 0.3125, 0.4375] 0.25 0.125\n0.3 1.0 0.1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Measures on a finite set are dicts of weights; a missing key has weight 0. Write <C>abs_cont(nu, mu)</C>,{" "}
          <C>singular(nu, mu)</C> and <C>lebesgue_split(nu, mu)</C>, returning the parts of nu on and off the support of mu.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def abs_cont(nu, mu):
    return False

def singular(nu, mu):
    return False

def lebesgue_split(nu, mu):
    return {}, {}
`,
        solution: DISCRETE,
        tests: [
          { name: "relations", code: `assert abs_cont({'a': 0.5, 'b': 0.5}, {'a': 0.1, 'b': 0.9}) and not abs_cont({'a': 0.5, 'c': 0.5}, {'a': 1.0})
assert singular({'c': 1.0}, {'a': 1.0}) and not singular({'a': 0.5, 'c': 0.5}, {'a': 1.0})` },
          { name: "split", code: `assert lebesgue_split({'a': 0.4, 'c': 0.6}, {'a': 1.0, 'c': 0}) == ({'a': 0.4}, {'c': 0.6})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Split [0, 1] into n equal cells. Write <C>cell_masses(f, n)</C> using the midpoint value of the density f in each
          cell, <C>worst_small_set(f, delta, n)</C>, the largest mass of a union of at most δn cells, and{" "}
          <C>tv_distance(p, q)</C> for dicts of weights.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cell_masses(f, n):
    return []

def worst_small_set(f, delta, n):
    return 0.0

def tv_distance(p, q):
    return 0.0
`,
        solution: SMALL,
        tests: [
          { name: "cells", code: `assert cell_masses(lambda x: 1.0, 2) == [0.5, 0.5] and abs(worst_small_set(lambda x: 4 * x ** 3, 0.5, 2) - 0.84375) < 1e-12` },
          { name: "tv", code: `assert abs(tv_distance({0: 0.25, 1: 0.75}, {1: 0.5, 2: 0.5}) - 0.5) < 1e-12 and tv_distance({0: 1.0}, {0: 1.0}) == 0` },
        ],
      },
    },
    {
      key: "tvnormal",
      rung: "stretch",
      prompt: (
        <p>
          Compute the total variation distance between N(0, 1) and N(1, 1). Find the set where the first density is larger,
          and express the answer with Φ. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3829, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Absolute continuity was defined without densities. The Radon-Nikodym theorem says it is exactly the condition for a
        density to exist, for any σ-finite pair of measures.
      </p>
    </>
  ),
};
