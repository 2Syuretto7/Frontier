import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VcBoundViz } from "@/components/viz/VcBoundViz";
import type { LessonContent } from "@/lib/types";

const BOUND = `import math

def growth_bound(m, d):
    return (math.e * m / d) ** d if m >= d else 2.0 ** m

def vc_radius(m, d, delta):
    return math.sqrt(8 * (math.log(growth_bound(2 * m, d)) + math.log(4 / delta)) / m)

def vc_sample_size(d, eps, delta):
    lo, hi = 1, 1
    while vc_radius(hi, d, delta) > eps:
        hi *= 2
    while lo < hi:
        mid = (lo + hi) // 2
        if vc_radius(mid, d, delta) <= eps:
            hi = mid
        else:
            lo = mid + 1
    return lo`;

const GHOST = `def threshold_risks(sample, ts):
    return [sum((x >= t) != y for x, y in sample) / len(sample) for t in ts]

def ghost_gap(s1, s2, ts):
    return max(abs(a - b) for a, b in zip(threshold_risks(s1, ts), threshold_risks(s2, ts)))

def distinct_behaviours(points, ts):
    return len({tuple(int(x >= t) for x in points) for t in ts})`;

export const lesson: LessonContent = {
  id: "m16.2.3",
  minutes: 50,
  links: {
    requires: ["m16.2.2", "m16.2.1"],
    revisits: ["m16.1.3"],
    foreshadows: ["m16.3.1", "m16.7.1"],
  },

  puzzle: (
    <>
      <p>
        Four properties of a hypothesis class sound different. Training error converges to true error uniformly over the
        class. ERM learns the class. Some algorithm learns it in the realisable case. Some algorithm learns it even with
        noisy labels. Remarkably, for binary classification they are all the same property, and a single integer decides
        whether it holds. Which integer, and how does a finite number control an infinite class?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The finite-class proof bounded the chance that any of |H| hypotheses has a misleading training error. For an infinite
        class the trick is to compare the training sample with a second, imaginary &ldquo;ghost&rdquo; sample. Whether
        hypotheses look different on the two samples depends only on how they label the 2m points involved, and by the
        Sauer-Shelah lemma there are at most polynomially many such labellings. The union bound then runs over labellings,
        not hypotheses.
      </p>
      <VcBoundViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the fundamental theorem of statistical learning">
        <p>For a class H of binary classifiers with the 0-1 loss, the following are equivalent:</p>
        <ol>
          <li>H has the uniform convergence property;</li>
          <li>any ERM rule is an agnostic PAC learner for H;</li>
          <li>H is agnostic PAC learnable;</li>
          <li>H is PAC learnable;</li>
          <li>any ERM rule is a PAC learner for H;</li>
          <li>H has finite VC dimension.</li>
        </ol>
        <p>Moreover, if VCdim(H) = d is finite, there are constants such that</p>
        <MD>{"m_H^{\\text{realisable}}(\\varepsilon, \\delta) = \\Theta\\!\\left(\\frac{d + \\ln(1/\\delta)}{\\varepsilon}\\right), \\qquad m_H^{\\text{agnostic}}(\\varepsilon, \\delta) = \\Theta\\!\\left(\\frac{d + \\ln(1/\\delta)}{\\varepsilon^2}\\right),"}</MD>
        <p>where the classical upper bound for the realisable case has an extra factor ln(1/ε), later removed.</p>
      </Theorem>
      <Proof>
        <p>
          The chain 1 ⇒ 2 is the representative-sample argument of m16.2.1; 2 ⇒ 3 and 3 ⇒ 4 are immediate, as is 2 ⇒ 5 ⇒ 4. No
          free lunch gives 4 ⇒ 6: a class of infinite VC dimension shatters a set of any size 2m, and on it the construction of
          m16.1.3 defeats every learner. The substance is 6 ⇒ 1, sketched next. The lower bounds on sample size come from a
          sharper version of the no-free-lunch construction on a shattered set of size d.
        </p>
      </Proof>

      <Theorem title="the VC inequality">
        <p>For every distribution D and m ≥ 1,</p>
        <MD>{"\\Pr_S\\Big[\\sup_{h \\in H} |L_S(h) - L_D(h)| > \\varepsilon\\Big] \\le 4\\, \\tau_H(2m)\\, e^{-m\\varepsilon^2/8},"}</MD>
        <p>
          so with probability at least 1 − δ the gap is at most{" "}
          <M>{"\\sqrt{8(\\ln \\tau_H(2m) + \\ln(4/\\delta))/m}"}</M>, which with Sauer-Shelah is{" "}
          <M>{"O\\big(\\sqrt{(d \\ln(m/d) + \\ln(1/\\delta))/m}\\big)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <em>Symmetrisation.</em> Draw a ghost sample S′ of size m. If some h has <M>{"|L_S(h) - L_D(h)| > \\varepsilon"}</M>,
          then, for m ≥ 2/ε², <M>{"L_{S'}(h)"}</M> lies within ε/2 of <M>{"L_D(h)"}</M> with probability at least 1/2 by
          Chebyshev, so <M>{"|L_S(h) - L_{S'}(h)| > \\varepsilon/2"}</M>. Hence the probability in the theorem is at most twice{" "}
          <M>{"\\Pr[\\sup_h |L_S(h) - L_{S'}(h)| > \\varepsilon/2]"}</M> (<C>ghost_gap</C>).
        </p>
        <p>
          <em>Swapping.</em> The joint sample of 2m points is exchangeable, so randomly swapping each pair (z_i, z′_i) leaves the
          distribution unchanged. Condition on the 2m points. Now H acts only through its labellings of them, of which there
          are at most <M>{"\\tau_H(2m)"}</M> (<C>distinct_behaviours</C>). For each labelling, the difference of the two halves
          under random swaps is a sum of m bounded symmetric terms, and Hoeffding gives probability at most{" "}
          <M>{"2e^{-m\\varepsilon^2/8}"}</M> of exceeding ε/2. A union bound over labellings finishes the proof
          (<C>growth_bound</C>, <C>vc_radius</C>; <C>vc_sample_size</C> inverts it numerically).
        </p>
        <Code>{BOUND}</Code>
        <Code>{GHOST}</Code>
      </Proof>

      <Remark title="what the theorem does and does not say">
        <p>
          It is a complete answer for binary classification in the distribution-free setting: finite VC dimension is necessary
          and sufficient, and d is the right measure of sample complexity up to constants and logarithms. It does not transfer
          unchanged to regression or multiclass problems, where other dimensions take the place of VC. And its worst-case
          constants are loose: for a particular distribution the true gap can be far smaller, which the next part addresses with
          data-dependent complexity measures. For deep networks, whose VC dimension exceeds the number of training examples,
          the bound is vacuous, a puzzle taken up in Part 7.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "radius",
      rung: "check",
      prompt: <p>For VC dimension 10, m = 5000 and δ = 0.01, what is √(8(ln τ(2m) + ln(4/δ))/m) using the bound τ(2m) ≤ (2em/d)^d? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3689, tolerance: 0.0001 },
    },
    {
      key: "size",
      rung: "check",
      prompt: <p>Using the same bound, what is the smallest m at which the radius is at most 0.1 for d = 10 and δ = 0.05?</p>,
      answer: { kind: "numeric", value: 89880, tolerance: 0.5 },
    },
    {
      key: "equiv",
      rung: "apply",
      prompt: <p>A class of binary classifiers is PAC learnable in the realisable case. What follows from the fundamental theorem?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its VC dimension is finite, so it is also agnostic PAC learnable and ERM learns it",
          "It is learnable only when the labels are noise-free",
          "Its VC dimension is at most 1",
          "Only some special algorithm, not ERM, can learn it",
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

def growth_bound(m, d):
    return (math.e * m / d) ** d if m >= d else 2.0 ** m

def vc_radius(m, d, delta):
    return math.sqrt(8 * (math.log(growth_bound(2 * m, d)) + math.log(4 / delta)) / m)

def vc_sample_size(d, eps, delta):
    lo, hi = 1, 1
    while vc_radius(hi, d, delta) > eps:
        hi *= 2
    while lo < hi:
        mid = (lo + hi) // 2
        if vc_radius(mid, d, delta) <= eps:
            hi = mid
        else:
            lo = mid + 1
    return lo

print(round(growth_bound(10, 2), 2), growth_bound(3, 5), round(vc_radius(1000, 3, 0.05), 4))
print(vc_sample_size(1, 0.5, 0.1), vc_sample_size(3, 0.2, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "184.73 8.0 0.4638\n361 6501",
          "184.73 32.0 0.4638\n361 6501",
          "184.73 8.0 0.2319\n361 6501",
          "184.73 8.0 0.4638\n360 6500",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def threshold_risks(sample, ts):
    return [sum((x >= t) != y for x, y in sample) / len(sample) for t in ts]

def ghost_gap(s1, s2, ts):
    return max(abs(a - b) for a, b in zip(threshold_risks(s1, ts), threshold_risks(s2, ts)))

def distinct_behaviours(points, ts):
    return len({tuple(int(x >= t) for x in points) for t in ts})

s1 = [(0.1, 0), (0.6, 1)]; s2 = [(0.3, 1), (0.7, 1)]; ts = [0.0, 0.2, 0.5, 0.9]
print(threshold_risks(s1, ts), threshold_risks(s2, ts), ghost_gap(s1, s2, ts), distinct_behaviours([0.1, 0.3, 0.6, 0.7], ts + [0.65, 0.35]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.0, 0.0, 0.5] [0.0, 0.0, 0.5, 1.0] 0.5 5",
          "[0.5, 0.0, 0.0, 0.5] [0.0, 0.0, 0.5, 1.0] 0.5 6",
          "[0.5, 0.0, 0.0, 0.5] [0.0, 0.0, 0.5, 1.0] 1.0 5",
          "[0.5, 0.0, 0.5, 0.5] [0.0, 0.0, 0.5, 1.0] 0.5 5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>growth_bound(m, d)</C>, using (em/d)^d when m ≥ d and 2^m otherwise, <C>vc_radius(m, d, delta)</C>, and{" "}
          <C>vc_sample_size(d, eps, delta)</C>, the smallest m whose radius is at most eps, found by doubling and then bisection.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def growth_bound(m, d):
    return 2.0 ** m

def vc_radius(m, d, delta):
    return 1.0

def vc_sample_size(d, eps, delta):
    return 1
`,
        solution: BOUND,
        tests: [
          { name: "growth and radius", code: `assert abs(growth_bound(4, 4) - math.e ** 4) < 1e-9 and growth_bound(2, 3) == 4.0 and abs(vc_radius(100, 1, 4.0) - math.sqrt(8 * (1 + math.log(200)) / 100)) < 1e-12` },
          { name: "sample size", code: `m = vc_sample_size(2, 0.3, 0.1); assert vc_radius(m, 2, 0.1) <= 0.3 < vc_radius(m - 1, 2, 0.1) and vc_sample_size(1, 0.5, 0.1) == 361` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>threshold_risks(sample, ts)</C>, the 0-1 risks of the thresholds 1[x ≥ t], <C>ghost_gap(s1, s2, ts)</C>, the
          largest difference between two samples&apos; risks, and <C>distinct_behaviours(points, ts)</C>, the number of
          different labellings of the points.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def threshold_risks(sample, ts):
    return [0.0 for t in ts]

def ghost_gap(s1, s2, ts):
    return 0.0

def distinct_behaviours(points, ts):
    return len(ts)
`,
        solution: GHOST,
        tests: [
          { name: "risks and gap", code: `assert threshold_risks([(0.5, 1), (0.2, 0)], [0.0, 0.3, 0.6]) == [0.5, 0.0, 0.5] and ghost_gap([(0.5, 1)], [(0.5, 0)], [0.0, 0.9]) == 1.0` },
          { name: "behaviours", code: `assert distinct_behaviours([1, 2, 3], [0, 1.5, 2.5, 10]) == 4 and distinct_behaviours([1, 2], [5, 6]) == 1 and distinct_behaviours([3, 1], [0, 2, 2.5]) == 2` },
        ],
      },
    },
    {
      key: "scale",
      rung: "stretch",
      prompt: (
        <p>
          The agnostic sample complexity scales like (d + ln(1/δ))/ε². Ten thousand examples suffice for a class of VC
          dimension 20 at accuracy 0.05. Ignoring the ln(1/δ) term, about how many suffice for VC dimension 40 at accuracy
          0.025?
        </p>
      ),
      answer: { kind: "numeric", value: 80000, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The VC bound is the same for every distribution, which is why it is loose for the one in front of us. The next part
        measures complexity on the actual data: Rademacher complexity asks how well the class can fit random noise on this
        sample.
      </p>
    </>
  ),
};
