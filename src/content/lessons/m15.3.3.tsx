import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MarchenkoPasturViz } from "@/components/viz/MarchenkoPasturViz";
import type { LessonContent } from "@/lib/types";

const MP = `import math

def mp_edges(gamma):
    return ((1 - math.sqrt(gamma)) ** 2, (1 + math.sqrt(gamma)) ** 2)

def mp_density(x, gamma):
    a, b = mp_edges(gamma)
    if not a < x < b:
        return 0.0
    return math.sqrt((b - x) * (x - a)) / (2 * math.pi * gamma * x)

def mp_moment(k, gamma):
    return sum(math.comb(k, j) * math.comb(k, j - 1) // k * gamma ** (j - 1) for j in range(1, k + 1))`;

const SPIKE = `import math

def bbp_location(ell, gamma):
    if ell <= 1 + math.sqrt(gamma):
        return (1 + math.sqrt(gamma)) ** 2
    return ell * (1 + gamma / (ell - 1))

def bbp_overlap(ell, gamma):
    if ell <= 1 + math.sqrt(gamma):
        return 0.0
    return (1 - gamma / (ell - 1) ** 2) / (1 + gamma / (ell - 1))

def count_spikes(eigs, gamma):
    return sum(1 for e in eigs if e > (1 + math.sqrt(gamma)) ** 2)`;

export const lesson: LessonContent = {
  id: "m15.3.3",
  minutes: 55,
  links: {
    requires: ["m15.3.2"],
    revisits: ["m15.3.1", "m6.4.5"],
    foreshadows: ["m15.5.2"],
  },

  puzzle: (
    <>
      <p>
        You run principal component analysis on 800 samples of 200 features and find that the top eigenvalue of the sample
        covariance is 2.2, although the eigenvalues average 1. Is there a real direction of high variance in your data, or
        would pure noise produce the same? And if there is a real direction of variance 1.4, would PCA even notice it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The spread of the sample eigenvalues seen in m15.3.1 has an exact limiting shape that depends only on the ratio{" "}
        <M>{"\\gamma = d/n"}</M>. It is the yardstick for noise: an eigenvalue inside the noise band says nothing, and a real
        signal must be strong enough to push its eigenvalue out of the band. Below a sharp threshold, it cannot, however
        cleverly you look.
      </p>
      <MarchenkoPasturViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Marchenko-Pastur law">
        <p>
          For <M>{"0 < \\gamma \\le 1"}</M>, let <M>{"a = (1 - \\sqrt\\gamma)^2"}</M> and <M>{"b = (1 + \\sqrt\\gamma)^2"}</M>. The{" "}
          <em>Marchenko-Pastur law</em> with ratio γ has density
        </p>
        <MD>{"\\rho_\\gamma(x) = \\frac{\\sqrt{(b - x)(x - a)}}{2\\pi\\gamma x}, \\qquad a < x < b."}</MD>
        <p>
          Its moments are the <em>Narayana polynomials</em>{" "}
          <M>{"\\int x^k\\rho_\\gamma = \\sum_{j=1}^k N(k, j)\\gamma^{j-1}"}</M>, with{" "}
          <M>{"N(k, j) = \\tfrac1k\\binom kj\\binom k{j-1}"}</M>: 1, <M>{"1 + \\gamma"}</M>, <M>{"1 + 3\\gamma + \\gamma^2"}</M>, and so
          on. At γ = 1 they are the Catalan numbers again.
        </p>
        <Code>{MP}</Code>
      </Definition>

      <Theorem title="Marchenko-Pastur theorem">
        <p>
          Let <M>{"x_1, \\dots, x_n"}</M> be independent vectors in <M>{"\\mathbb{R}^d"}</M> with independent mean-zero,
          unit-variance entries, and <M>{"\\hat\\Sigma = \\tfrac1n\\sum_k x_kx_k^\\top"}</M>. If{" "}
          <M>{"d, n \\to \\infty"}</M> with <M>{"d/n \\to \\gamma \\in (0, 1]"}</M>, the empirical spectral distribution of{" "}
          <M>{"\\hat\\Sigma"}</M> converges with probability 1 to <M>{"\\rho_\\gamma"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (The second moment; the rest follows the walk-counting of m15.3.2, with walks that alternate between sample indices
          and coordinate indices.) For Gaussian entries,{" "}
          <M>{"\\tfrac1d\\mathbb{E}\\,\\mathrm{tr}\\,\\hat\\Sigma^2 = \\tfrac{1}{dn^2}\\sum_{i,j}\\mathbb{E}\\bigl(\\sum_k x_{ki}x_{kj}\\bigr)^2"}</M>.
          For i ≠ j only the terms with the same k survive, giving n each. For i = j the sum is{" "}
          <M>{"\\sum_{k,l}\\mathbb{E}x_{ki}^2x_{li}^2 = 3n + n(n - 1)"}</M>. Altogether{" "}
          <M>{"\\tfrac{1}{dn^2}\\bigl(d(d - 1)n + d(n^2 + 2n)\\bigr) = 1 + \\tfrac{d + 1}{n} \\to 1 + \\gamma"}</M>, the second
          Narayana polynomial. The true covariance is I, whose second moment is 1: the excess γ is the spreading.
        </p>
      </Proof>

      <Remark title="when d > n">
        <p>
          If <M>{"\\gamma > 1"}</M>, <M>{"\\hat\\Sigma"}</M> has rank n, so a fraction <M>{"1 - 1/\\gamma"}</M> of its eigenvalues
          are exactly 0, and the nonzero ones follow the law with ratio 1/γ, rescaled by γ, since they are also the nonzero eigenvalues of the n × n matrix of inner products. Either way the
          bulk ends at <M>{"(1 + \\sqrt\\gamma)^2"}</M>, so an eigenvalue of 2.2 with d = 200 and n = 800 (edge 2.25) is just what
          noise produces.
        </p>
      </Remark>

      <Theorem title="the BBP phase transition">
        <p>
          Let the true covariance be <M>{"\\Sigma = I + (\\ell - 1)vv^\\top"}</M> for a unit vector v and <M>{"\\ell > 1"}</M>, a
          single <em>spike</em>, with Gaussian data and <M>{"d/n \\to \\gamma"}</M>. If <M>{"\\ell \\le 1 + \\sqrt\\gamma"}</M>, the
          top eigenvalue of <M>{"\\hat\\Sigma"}</M> converges to the bulk edge <M>{"(1 + \\sqrt\\gamma)^2"}</M> and the top
          eigenvector <M>{"\\hat v"}</M> is asymptotically orthogonal to v. If <M>{"\\ell > 1 + \\sqrt\\gamma"}</M>, the top
          eigenvalue converges to <M>{"\\ell(1 + \\gamma/(\\ell - 1))"}</M>, outside the bulk, and
        </p>
        <MD>{"\\langle\\hat v, v\\rangle^2 \\to \\frac{1 - \\gamma/(\\ell - 1)^2}{1 + \\gamma/(\\ell - 1)}."}</MD>
      </Theorem>
      <Remark title="reading the theorem">
        <p>
          This result is due to Baik, Ben Arous and Péché (2005) and to Paul (2007); its proof uses the resolvent of{" "}
          <M>{"\\hat\\Sigma"}</M> and is beyond this lesson. Its message is sharp. Below the threshold, PCA does not just find
          the spike poorly, it finds nothing: the top direction is as good as random, as m15.2.2 says a random direction is.
          Above it, the outlier is biased upwards and the eigenvector is only partly aligned, with the overlap rising from 0 at
          the threshold towards 1 as ℓ grows. A spike of variance 1.4 at γ = 0.25 (threshold 1.5) is invisible to PCA.
        </p>
      </Remark>

      <Example title="choosing the number of components">
        <p>
          A principled rule for PCA (m6.4.5) on standardised data: keep only the components whose eigenvalues exceed the
          Marchenko-Pastur edge <M>{"(1 + \\sqrt{d/n})^2"}</M>, since anything below is indistinguishable from noise.{" "}
          <C>count_spikes</C> applies this rule; <C>bbp_location</C> and <C>bbp_overlap</C> predict where a spike lands and how
          well its direction is recovered.
        </p>
        <Code>{SPIKE}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "edge",
      rung: "check",
      prompt: <p>With 400 samples in 200 dimensions and identity covariance, where does the top of the eigenvalue bulk of the sample covariance converge? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.9142, tolerance: 0.00006 },
    },
    {
      key: "m3",
      rung: "check",
      prompt: <p>What is the third moment of the Marchenko-Pastur law with γ = 0.5? Give two decimals.</p>,
      answer: { kind: "numeric", value: 2.75, tolerance: 0.006 },
    },
    {
      key: "below",
      rung: "apply",
      prompt: <p>A dataset has d/n = 0.25 and one true direction of variance 1.3 on top of unit noise. What does PCA find?</p>,
      answer: {
        kind: "choice",
        options: [
          "A top eigenvalue near the bulk edge 2.25, with an eigenvector essentially unrelated to the true direction",
          "A top eigenvalue near 1.3, with the right eigenvector",
          "A top eigenvalue near 1.3 + 2.25, with the right eigenvector",
          "A top eigenvalue near 1.3, with an eigenvector that is half right",
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

def mp_edges(gamma):
    return ((1 - math.sqrt(gamma)) ** 2, (1 + math.sqrt(gamma)) ** 2)

def mp_density(x, gamma):
    a, b = mp_edges(gamma)
    if not a < x < b:
        return 0.0
    return math.sqrt((b - x) * (x - a)) / (2 * math.pi * gamma * x)

def mp_moment(k, gamma):
    return sum(math.comb(k, j) * math.comb(k, j - 1) // k * gamma ** (j - 1) for j in range(1, k + 1))

print(mp_edges(0.25), mp_edges(1), mp_density(3, 0.25), round(mp_density(1, 0.25), 4))
print([mp_moment(k, 1) for k in range(1, 5)], mp_moment(2, 0.5), mp_moment(3, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.25, 2.25) (0.0, 4.0) 0.0 0.6164\n[1, 2, 5, 14] 1.5 1.31",
          "(0.25, 2.25) (0.0, 4.0) 0.0 0.6164\n[1, 2, 5, 14] 1.25 1.31",
          "(0.5, 1.5) (0.0, 4.0) 0.0 0.6164\n[1, 2, 5, 14] 1.5 1.31",
          "(0.25, 2.25) (0.0, 4.0) 0.0 0.6164\n[1, 2, 6, 24] 1.5 1.31",
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

def bbp_location(ell, gamma):
    if ell <= 1 + math.sqrt(gamma):
        return (1 + math.sqrt(gamma)) ** 2
    return ell * (1 + gamma / (ell - 1))

def bbp_overlap(ell, gamma):
    if ell <= 1 + math.sqrt(gamma):
        return 0.0
    return (1 - gamma / (ell - 1) ** 2) / (1 + gamma / (ell - 1))

def count_spikes(eigs, gamma):
    return sum(1 for e in eigs if e > (1 + math.sqrt(gamma)) ** 2)

print(bbp_location(1.2, 0.25), bbp_location(3, 0.25), bbp_overlap(1.5, 0.25), round(bbp_overlap(3, 0.25), 4))
print(count_spikes([0.4, 1.1, 2.3, 9.0], 0.25), count_spikes([4.1, 3.9], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.25 3.375 0.0 0.8333\n2 1", "1.2 3.375 0.0 0.8333\n2 1", "2.25 3.375 0.0 0.8333\n3 1", "2.25 3.375 0.0 0.8333\n2 2"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mp_edges(gamma)</C>, the pair (a, b); <C>mp_density(x, gamma)</C>, 0 outside the open interval (a, b); and{" "}
          <C>mp_moment(k, gamma)</C>, the k-th Narayana polynomial at γ for k ≥ 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mp_edges(gamma):
    return (0.0, 0.0)

def mp_density(x, gamma):
    return 0.0

def mp_moment(k, gamma):
    return 0.0
`,
        solution: MP,
        tests: [
          { name: "density", code: `import math
assert mp_edges(0.25) == (0.25, 2.25) and mp_edges(1) == (0.0, 4.0) and mp_density(3, 0.25) == 0.0 and mp_density(0.25, 0.25) == 0.0
assert abs(mp_density(1, 0.25) - math.sqrt(1.25 * 0.75) / (0.5 * math.pi)) < 1e-15
for g in [0.1, 0.4, 1.0]:
    a, b = mp_edges(g); N = 100000; h = (b - a) / N
    xs = [a + (i + 0.5) * h for i in range(N)]
    assert abs(sum(mp_density(x, g) for x in xs) * h - 1) < 2e-3 and abs(sum(x * mp_density(x, g) for x in xs) * h - 1) < 2e-3` },
          { name: "moments", code: `assert [mp_moment(k, 1) for k in range(1, 7)] == [1, 2, 5, 14, 42, 132]
assert mp_moment(1, 0.3) == 1 and abs(mp_moment(2, 0.3) - 1.3) < 1e-12 and abs(mp_moment(3, 0.5) - 2.75) < 1e-12 and abs(mp_moment(4, 0.5) - (1 + 3 + 1.5 + 0.125)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bbp_location(ell, gamma)</C>, the limit of the top sample eigenvalue for a spike of size ℓ (the bulk edge at
          or below the threshold); <C>bbp_overlap(ell, gamma)</C>, the limit of <M>{"\\langle\\hat v, v\\rangle^2"}</M> (0 at or
          below the threshold); and <C>count_spikes(eigs, gamma)</C>, the number of eigenvalues above the bulk edge.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bbp_location(ell, gamma):
    return ell

def bbp_overlap(ell, gamma):
    return 1.0

def count_spikes(eigs, gamma):
    return 0
`,
        solution: SPIKE,
        tests: [
          { name: "bbp", code: `assert bbp_location(1.2, 0.25) == 2.25 and bbp_location(1.5, 0.25) == 2.25 and bbp_location(3, 0.25) == 3.375 and bbp_location(2, 1) == 4
assert bbp_overlap(1.5, 0.25) == 0.0 and abs(bbp_overlap(3, 0.25) - 0.9375 / 1.125) < 1e-15 and abs(bbp_overlap(5, 1) - (15 / 16) / 1.25) < 1e-15
assert abs(bbp_location(1.5000001, 0.25) - 2.25) < 1e-5 and bbp_overlap(1.5000001, 0.25) < 1e-6` },
          { name: "count", code: `assert count_spikes([0.4, 1.1, 2.3, 9.0], 0.25) == 2 and count_spikes([4.1, 3.9], 1) == 1 and count_spikes([], 0.5) == 0 and count_spikes([2.25], 0.25) == 0` },
        ],
      },
    },
    {
      key: "overlap",
      rung: "stretch",
      prompt: (
        <p>
          With d/n = 0.5 and a spike of size ℓ = 2.5, what fraction of the true direction&apos;s squared length does the top
          sample eigenvector capture, in the limit? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5833, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The bulk edge <M>{"(1 + \\sqrt\\gamma)^2"}</M> says that the largest singular value of an n × d Gaussian matrix is about{" "}
        <M>{"\\sqrt n + \\sqrt d"}</M>. The next lesson proves bounds of this kind directly, without limits, for every n and d.
      </p>
    </>
  ),
};
