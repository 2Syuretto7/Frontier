import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PartitionKlViz } from "@/components/viz/PartitionKlViz";
import type { LessonContent } from "@/lib/types";

const KL = `import math

def kl(q, p):
    total = 0.0
    for x, qx in q.items():
        if qx == 0:
            continue
        if p.get(x, 0) == 0:
            return math.inf
        total += qx * math.log(qx / p[x])
    return total

def coarse(w, T):
    out = {}
    for x, wx in w.items():
        out[T(x)] = out.get(T(x), 0) + wx
    return out

def pinsker(kl_value):
    return math.sqrt(kl_value / 2)`;

const VARIATIONAL = `import math

def partition_kl(Fq, Fp, k):
    n, total = 2 ** k, 0.0
    for j in range(n):
        q = Fq((j + 1) / n) - Fq(j / n)
        p = Fp((j + 1) / n) - Fp(j / n)
        if q > 0:
            total += q * math.log(q / p) if p > 0 else math.inf
    return total

def dv_value(g, q, p):
    return sum(q[x] * g[x] for x in q) - math.log(sum(p[x] * math.exp(g[x]) for x in p))

def best_g(q, p):
    return {x: math.log(q[x] / p[x]) for x in p if q.get(x, 0) > 0}`;

export const lesson: LessonContent = {
  id: "m18.4.3",
  minutes: 45,
  links: {
    requires: ["m18.4.2", "m12.2.1"],
    revisits: ["m7.4.2", "m18.4.1"],
    foreshadows: ["m18.5.1", "m18.5.2"],
  },

  puzzle: (
    <>
      <p>
        KL divergence was first defined as a sum over a mass function, then as an integral of densities. What is the KL
        divergence between a Gaussian and a distribution with no density, such as the Cantor law or a law on a curve in the
        plane? And why does every summary of the data, from binning to a neural network&apos;s features, only ever lose
        divergence and never create it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Measure two laws through a coarse instrument: record only which cell of a partition the outcome falls in. Their
        divergence as seen through that instrument is a finite sum. Refining the instrument can only reveal more
        difference, never less, and the true divergence is what the finest instruments see. If one law puts mass where the
        other puts none, finer cells expose this without limit.
      </p>
      <PartitionKlViz />
    </>
  ),

  theory: (
    <>
      <Definition title="KL divergence for measures">
        <p>For probability measures Q and P on the same space,</p>
        <MD>{"\\mathrm{KL}(Q \\,\\|\\, P) = \\int \\log \\frac{dQ}{dP}\\, dQ \\quad \\text{if } Q \\ll P, \\qquad \\mathrm{KL}(Q \\,\\|\\, P) = \\infty \\text{ otherwise.}"}</MD>
        <p>
          The Radon-Nikodym derivative of m18.4.2 makes this meaningful with no reference measure. If both have densities q
          and p with respect to any common μ, the chain rule gives dQ/dP = q/p, and the formula is the familiar one of m12.2.1.
          On a finite set it is a sum (<C>kl</C>).
        </p>
        <Code>{KL}</Code>
      </Definition>

      <Theorem title="Gibbs' inequality">
        <p>KL(Q ‖ P) ≥ 0, with equality exactly when Q = P.</p>
      </Theorem>
      <Proof>
        <p>
          Let L = dQ/dP. Then <M>{"\\mathrm{KL} = \\mathbb E_P[L \\log L]"}</M>, and <M>{"\\varphi(t) = t \\log t"}</M> is strictly convex. Jensen
          (m7.4.2) gives <M>{"\\mathbb E_P \\varphi(L) \\ge \\varphi(\\mathbb E_P L) = \\varphi(1) = 0"}</M>, with equality only if L is constant P-almost
          surely, that is L = 1 and Q = P.
        </p>
      </Proof>

      <Theorem title="data processing">
        <p>For any measurable map T, the laws of T under Q and P satisfy</p>
        <MD>{"\\mathrm{KL}(Q \\circ T^{-1} \\,\\|\\, P \\circ T^{-1}) \\le \\mathrm{KL}(Q \\,\\|\\, P)."}</MD>
      </Theorem>
      <Proof>
        <p>
          For a finite partition <M>{"\\{A_i\\}"}</M>, apply Jensen inside each cell: under the conditional law{" "}
          <M>{"P(\\cdot \\mid A_i)"}</M>, the average of L is <M>{"Q(A_i)/P(A_i)"}</M>, so{" "}
          <M>{"\\int_{A_i} L \\log L\\, dP \\ge Q(A_i) \\log \\frac{Q(A_i)}{P(A_i)}"}</M>. Summing gives the coarse divergence (<C>coarse</C>). For a
          general T the same step uses the conditional expectation of L given T, constructed in m18.5.1.
        </p>
      </Proof>

      <Theorem title="KL as a supremum over partitions">
        <p>KL(Q ‖ P) is the supremum of the coarse divergences over all finite measurable partitions.</p>
      </Theorem>
      <Proof>
        <p>
          Data processing gives ≤. If Q is not ≪ P there is a set A with P(A) = 0 &lt; Q(A), and the partition {"{A, Aᶜ}"} already
          gives ∞. Otherwise, partition by the level sets of L in cells <M>{"\\{j\\varepsilon \\le \\log L < (j + 1)\\varepsilon\\}"}</M>: within each cell L
          varies by a factor of at most <M>{"e^\\varepsilon"}</M>, so the coarse sum is within ε of the integral on the cells where it converges,
          and monotone convergence handles the rest. On [0, 1] the dyadic cells play the same role (<C>partition_kl</C>), which is
          what the figure shows.
        </p>
      </Proof>

      <Theorem title="Donsker-Varadhan">
        <MD>{"\\mathrm{KL}(Q \\,\\|\\, P) = \\sup_g \\Big( \\mathbb E_Q\\, g - \\log \\mathbb E_P\\, e^{g} \\Big),"}</MD>
        <p>over bounded measurable g, with the supremum approached by g = log dQ/dP.</p>
      </Theorem>
      <Proof>
        <p>
          Given g, tilt P to <M>{"P_g"}</M> with <M>{"dP_g/dP = e^g / \\mathbb E_P e^g"}</M>. When Q ≪ P,{" "}
          <M>{"\\mathrm{KL}(Q \\| P) - \\mathrm{KL}(Q \\| P_g) = \\mathbb E_Q\\, g - \\log \\mathbb E_P e^g"}</M> by the chain rule, and the second
          divergence is ≥ 0, so every g gives a lower bound (<C>dv_value</C>), with equality when <M>{"P_g = Q"}</M> (<C>best_g</C>). This is
          the formula behind neural estimators of mutual information, which search over g.
        </p>
        <Code>{VARIATIONAL}</Code>
      </Proof>

      <Remark title="Pinsker's inequality">
        <p>
          Total variation (m18.4.1) is controlled by divergence: <M>{"\\|Q - P\\| \\le \\sqrt{\\mathrm{KL}(Q \\| P)/2}"}</M> (<C>pinsker</C>). By data
          processing it suffices to prove it for the two-cell partition {"{A, Aᶜ}"} that attains the total variation, which is a
          one-variable calculus inequality between Bernoulli laws.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bern",
      rung: "check",
      prompt: <p>Compute KL(Bernoulli(0.5) ‖ Bernoulli(0.1)) in nats. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5108, tolerance: 0.0001 },
    },
    {
      key: "pinsker",
      rung: "check",
      prompt: <p>KL(Q ‖ P) = 0.18. What upper bound does Pinsker&apos;s inequality give on the total variation distance?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "singular",
      rung: "apply",
      prompt: <p>Q is the Cantor law and P is uniform on [0, 1]. What is KL(Q ‖ P), and why?</p>,
      answer: {
        kind: "choice",
        options: [
          "Infinite, because Q is not absolutely continuous with respect to P",
          "Zero, because both laws have mean 1/2",
          "Finite, because Q has no atoms",
          "Undefined, because Q has no density",
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

def kl(q, p):
    total = 0.0
    for x, qx in q.items():
        if qx == 0:
            continue
        if p.get(x, 0) == 0:
            return math.inf
        total += qx * math.log(qx / p[x])
    return total

def coarse(w, T):
    out = {}
    for x, wx in w.items():
        out[T(x)] = out.get(T(x), 0) + wx
    return out

def pinsker(kl_value):
    return math.sqrt(kl_value / 2)

q = {0: 0.5, 1: 0.25, 2: 0.25}; p = {0: 0.25, 1: 0.25, 2: 0.5}; print(round(kl(q, p), 4), round(kl(p, q), 4), kl({0: 1.0}, {1: 1.0}), kl(q, q))
print(coarse(q, lambda x: x > 0), round(kl(coarse(q, lambda x: x > 0), coarse(p, lambda x: x > 0)), 4), round(pinsker(0.08), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1733 0.1733 inf 0.0\n{False: 0.5, True: 0.5} 0.1438 0.2",
          "0.1733 0.1438 inf 0.0\n{False: 0.5, True: 0.5} 0.1438 0.2",
          "0.1733 0.1733 0.0 0.0\n{False: 0.5, True: 0.5} 0.0 0.2",
          "0.3466 0.1733 inf 0.0\n{0: 0.5, 1: 0.5} 0.1438 0.04",
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

def partition_kl(Fq, Fp, k):
    n, total = 2 ** k, 0.0
    for j in range(n):
        q = Fq((j + 1) / n) - Fq(j / n)
        p = Fp((j + 1) / n) - Fp(j / n)
        if q > 0:
            total += q * math.log(q / p) if p > 0 else math.inf
    return total

def dv_value(g, q, p):
    return sum(q[x] * g[x] for x in q) - math.log(sum(p[x] * math.exp(g[x]) for x in p))

def best_g(q, p):
    return {x: math.log(q[x] / p[x]) for x in p if q.get(x, 0) > 0}

print(round(partition_kl(lambda x: x * x, lambda x: x, 1), 4), partition_kl(lambda x: x, lambda x: x, 3), round(partition_kl(lambda x: min(1, 2 * x), lambda x: x, 2), 4))
print(round(dv_value({0: 0.0, 1: 0.0}, {0: 0.5, 1: 0.5}, {0: 0.9, 1: 0.1}), 4), best_g({0: 0.5, 1: 0.5}, {0: 0.5, 1: 0.5}), round(dv_value({0: math.log(2), 1: 0.0}, {0: 1.0, 1: 0.0}, {0: 0.5, 1: 0.5}), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1308 0.0 0.6931\n0.0 {0: 0.0, 1: 0.0} 0.2877",
          "0.1308 0.0 inf\n0.0 {0: 0.0, 1: 0.0} 0.2877",
          "0.1308 0.0 0.6931\n0.5108 {0: 0.0, 1: 0.0} 0.6931",
          "0.1931 0.0 0.6931\n0.0 {0: 1.0, 1: 1.0} 0.2877",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For dicts of weights, write <C>kl(q, p)</C> in nats, returning <C>math.inf</C> when q puts mass where p has none;{" "}
          <C>coarse(w, T)</C>, the law of T(x) under w; and <C>pinsker(kl_value)</C>, the bound on total variation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def kl(q, p):
    return 0.0

def coarse(w, T):
    return {}

def pinsker(kl_value):
    return 0.0
`,
        solution: KL,
        tests: [
          { name: "kl", code: `assert abs(kl({0: 0.5, 1: 0.5}, {0: 0.25, 1: 0.75}) - 0.1438410362) < 1e-9 and abs(kl({0: 1.0}, {0: 0.5, 1: 0.5}) - math.log(2)) < 1e-12
assert kl({1: 1.0}, {0: 1.0}) == math.inf` },
          { name: "coarse", code: `c = coarse({1: 0.2, 2: 0.3, 3: 0.5}, lambda x: x % 2)
assert len(c) == 2 and abs(c[1] - 0.7) < 1e-12 and abs(c[0] - 0.3) < 1e-12 and abs(pinsker(0.5) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>partition_kl(Fq, Fp, k)</C>, the KL divergence of two laws on [0, 1] given by distribution functions after
          coarse-graining to the 2ᵏ dyadic cells; <C>dv_value(g, q, p)</C>, the Donsker-Varadhan objective for dicts; and{" "}
          <C>best_g(q, p)</C>, the log-ratio on the points where q is positive.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def partition_kl(Fq, Fp, k):
    return 0.0

def dv_value(g, q, p):
    return 0.0

def best_g(q, p):
    return {}
`,
        solution: VARIATIONAL,
        tests: [
          { name: "partition", code: `assert abs(partition_kl(lambda x: x ** 2, lambda x: x, 2) - 0.1739804809) < 1e-9 and abs(partition_kl(lambda x: min(1, 2 * x), lambda x: x, 1) - math.log(2)) < 1e-12` },
          { name: "variational", code: `q, p = {0: 0.75, 1: 0.25}, {0: 0.5, 1: 0.5}
assert abs(dv_value(best_g(q, p), q, p) - 0.1308120359) < 1e-9 and abs(dv_value({0: 0.1, 1: -0.3}, q, p) - 0.0801319282) < 1e-9
assert list(best_g({0: 1.0, 1: 0.0}, p)) == [0]` },
        ],
      },
    },
    {
      key: "exps",
      rung: "stretch",
      prompt: <p>Compute KL(Exponential(1) ‖ Exponential(2)) in nats, where the arguments are rates. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3069, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Data processing for a general map needed the conditional expectation of a likelihood ratio given a σ-algebra. Part 5
        builds conditional expectation from the Radon-Nikodym theorem and follows it to martingales.
      </p>
    </>
  ),
};
