import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PacBayesViz } from "@/components/viz/PacBayesViz";
import type { LessonContent } from "@/lib/types";

const KL = `import math

def kl_bern(q, p):
    s = q * math.log(q / p) if q > 0 else 0.0
    return s + ((1 - q) * math.log((1 - q) / (1 - p)) if q < 1 else 0.0)

def kl_inverse(q, c):
    lo, hi = q, 1.0 - 1e-12
    for _ in range(60):
        mid = (lo + hi) / 2
        if kl_bern(q, mid) > c:
            hi = mid
        else:
            lo = mid
    return lo

def seeger_bound(emp, kl, m, delta):
    return kl_inverse(emp, (kl + math.log(2 * math.sqrt(m) / delta)) / m)`;

const BOUNDS = `import math

def gaussian_kl(w, w0, sigma):
    return sum((a - b) ** 2 for a, b in zip(w, w0)) / (2 * sigma ** 2)

def mcallester_bound(emp, kl, m, delta):
    return emp + math.sqrt((kl + math.log(2 * math.sqrt(m) / delta)) / (2 * m))

def point_mass_kl(prior_prob):
    return -math.log(prior_prob)`;

export const lesson: LessonContent = {
  id: "m16.7.4",
  minutes: 50,
  links: {
    requires: ["m16.7.3", "m16.2.1", "m12.2.1"],
    revisits: ["m15.1.2", "m7.4.2"],
    foreshadows: ["m17.6.4"],
  },

  puzzle: (
    <>
      <p>
        For a network with millions of parameters, VC and Rademacher bounds on the test error are larger than one: true but
        useless. Yet the network does generalise, and the previous lessons suggest why: the solution found is special, flat,
        close to its initialisation. Is there a bound that rewards exactly that, and is small enough to say something about
        a real trained model?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of bounding the error of one hypothesis, bound the average error of a cloud of hypotheses around it. Before
        seeing data, fix a prior cloud. After training, the posterior cloud can be anything, and its price is how far it is
        from the prior, measured by the KL divergence. A solution in a wide flat region tolerates a wide posterior, which
        stays close to the prior; a sharp solution needs a narrow posterior, which costs more.
      </p>
      <PacBayesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Gibbs classifier">
        <p>
          For a distribution Q over hypotheses, the Gibbs classifier draws h ~ Q afresh for each prediction. Its risk and
          empirical risk are <M>{"L(Q) = \\mathbb E_{h \\sim Q} L(h)"}</M> and <M>{"\\hat L(Q) = \\mathbb E_{h\\sim Q} \\hat L(h)"}</M>. For losses in [0, 1]
          write <M>{"\\mathrm{kl}(q \\| p)"}</M> for the KL divergence between Bernoulli(q) and Bernoulli(p) (<C>kl_bern</C>).
        </p>
      </Definition>

      <Theorem title="change of measure (Donsker and Varadhan)">
        <p>For distributions Q ≪ P and any measurable f,</p>
        <MD>{"\\mathbb E_Q f \\le \\mathrm{KL}(Q \\| P) + \\ln \\mathbb E_P e^{f}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let G be the tilted distribution with density <M>{"e^f / \\mathbb E_P e^f"}</M> relative to P. Then{" "}
          <M>{"0 \\le \\mathrm{KL}(Q\\|G) = \\mathrm{KL}(Q\\|P) - \\mathbb E_Q f + \\ln \\mathbb E_P e^f"}</M>, which rearranges to the claim (m12.2.1).
        </p>
      </Proof>

      <Theorem title="PAC-Bayes (Seeger and Maurer)">
        <p>
          Fix a prior P before seeing the data. With probability at least 1 − δ over a sample of size m, for every posterior Q
          simultaneously,
        </p>
        <MD>{"\\mathrm{kl}\\big(\\hat L(Q) \\,\\|\\, L(Q)\\big) \\le \\frac{\\mathrm{KL}(Q\\|P) + \\ln(2\\sqrt m/\\delta)}{m}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Apply the change of measure with <M>{"f(h) = m\\,\\mathrm{kl}(\\hat L(h) \\| L(h))"}</M>, together with the joint convexity of kl, to get{" "}
          <M>{"m\\,\\mathrm{kl}(\\hat L(Q)\\|L(Q)) \\le \\mathrm{KL}(Q\\|P) + \\ln \\mathbb E_{h\\sim P} e^{f(h)}"}</M>. Because P does not depend on the sample,{" "}
          <M>{"\\mathbb E_S \\mathbb E_P e^{f} = \\mathbb E_P \\mathbb E_S e^{f}"}</M>, and Maurer showed that for a fixed h the inner expectation is at
          most <M>{"2\\sqrt m"}</M>, which is a sharpened form of the Chernoff argument behind Hoeffding (m15.1.2). By Markov&apos;s
          inequality (m7.4.2), <M>{"\\mathbb E_P e^f \\le 2\\sqrt m/\\delta"}</M> with probability at least 1 − δ. The bound holds for all Q at
          once because Q entered only through the deterministic inequality. To read off a risk bound, invert kl by
          bisection (<C>kl_inverse</C>, <C>seeger_bound</C>).
        </p>
        <Code>{KL}</Code>
      </Proof>

      <Theorem title="the square-root form (McAllester)">
        <p>Under the same conditions,</p>
        <MD>{"L(Q) \\le \\hat L(Q) + \\sqrt{\\frac{\\mathrm{KL}(Q\\|P) + \\ln(2\\sqrt m/\\delta)}{2m}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Pinsker&apos;s inequality gives <M>{"\\mathrm{kl}(q\\|p) \\ge 2(p - q)^2"}</M>; substitute (<C>mcallester_bound</C>). The kl form is
          tighter when <M>{"\\hat L(Q)"}</M> is small: with zero empirical risk it gives a rate of 1/m rather than <M>{"1/\\sqrt m"}</M>.
        </p>
      </Proof>

      <Remark title="old bounds as special cases">
        <p>
          Let P be uniform on a finite class H and Q a point mass on one h. Then <M>{"\\mathrm{KL}(Q\\|P) = \\ln|H|"}</M>{" "}
          (<C>point_mass_kl</C>) and the theorem becomes the finite-class bound of m16.2.1, up to the logarithmic term. With a
          non-uniform prior the cost of h is <M>{"-\\ln P(h)"}</M>, the description-length idea: hypotheses that were cheap to
          describe before seeing the data are cheap to choose after.
        </p>
      </Remark>

      <Theorem title="Gaussian posteriors on weights">
        <p>
          For <M>{"P = N(w_0, \\sigma^2 I)"}</M> and <M>{"Q = N(w, \\sigma^2 I)"}</M>, <M>{"\\mathrm{KL}(Q\\|P) = \\|w - w_0\\|^2/(2\\sigma^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The log density ratio at θ is <M>{"(\\|\\theta - w_0\\|^2 - \\|\\theta - w\\|^2)/(2\\sigma^2)"}</M>; its mean under Q is{" "}
          <M>{"\\|w - w_0\\|^2/(2\\sigma^2)"}</M> because the cross term vanishes (<C>gaussian_kl</C>). So the bound pays for distance from
          the initialisation, divided by the amount of noise the trained weights tolerate: flat minima, close to where
          training started, are cheap.
        </p>
        <Code>{BOUNDS}</Code>
      </Proof>

      <Remark title="non-vacuous bounds for networks">
        <p>
          Dziugaite and Roy optimised the PAC-Bayes bound directly over a Gaussian posterior around a trained network,
          with the prior centred at the random initialisation, and obtained test error bounds of about 0.2 for networks on
          MNIST with far more parameters than examples, where uniform-convergence bounds exceed 1. Choosing σ after seeing the
          data is allowed if one pays for a union bound over a grid of values, as in the figure. Data-dependent priors,
          built from a held-out part of the sample, tighten the bounds further. Implicit bias (m16.7.3) explains which
          solution is found; PAC-Bayes certifies how well it does.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gauss",
      rung: "check",
      prompt: <p>The trained weights are at distance 3 from the initialisation, and prior and posterior are isotropic Gaussians with σ = 0.5. What is the KL divergence?</p>,
      answer: { kind: "numeric", value: 18, tolerance: 0.0001 },
    },
    {
      key: "mcallester",
      rung: "check",
      prompt: <p>With empirical Gibbs risk 0.02, KL = 10, m = 10000 and δ = 0.05, what is McAllester&apos;s bound? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0502, tolerance: 0.0001 },
    },
    {
      key: "prior",
      rung: "apply",
      prompt: <p>Which requirement on the prior P is essential to the PAC-Bayes theorem?</p>,
      answer: {
        kind: "choice",
        options: [
          "It must be chosen without looking at the training sample",
          "It must be a Gaussian",
          "It must equal the posterior",
          "It must put all its mass on a single hypothesis",
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

def kl_bern(q, p):
    s = q * math.log(q / p) if q > 0 else 0.0
    return s + ((1 - q) * math.log((1 - q) / (1 - p)) if q < 1 else 0.0)

def kl_inverse(q, c):
    lo, hi = q, 1.0 - 1e-12
    for _ in range(60):
        mid = (lo + hi) / 2
        if kl_bern(q, mid) > c:
            hi = mid
        else:
            lo = mid
    return lo

def seeger_bound(emp, kl, m, delta):
    return kl_inverse(emp, (kl + math.log(2 * math.sqrt(m) / delta)) / m)

print(kl_bern(0.5, 0.5), round(kl_bern(0.0, 0.5), 4), round(kl_inverse(0.0, math.log(2)), 4), round(kl_inverse(0.5, 0.0), 4))
print(round(seeger_bound(0.0, 0.0, 100, 0.2), 4), seeger_bound(0.3, 1e6, 10, 0.1) > 0.999)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.6931 0.5 0.5\n0.045 True",
          "0.0 0.6931 0.25 0.5\n0.045 True",
          "0.0 0.6931 0.5 0.5\n0.0461 True",
          "0.0 0.0 0.5 1.0\n0.045 False",
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

def gaussian_kl(w, w0, sigma):
    return sum((a - b) ** 2 for a, b in zip(w, w0)) / (2 * sigma ** 2)

def mcallester_bound(emp, kl, m, delta):
    return emp + math.sqrt((kl + math.log(2 * math.sqrt(m) / delta)) / (2 * m))

def point_mass_kl(prior_prob):
    return -math.log(prior_prob)

print(gaussian_kl([1.0, 2.0], [1.0, 0.0], 0.5), gaussian_kl([3.0], [3.0], 2.0), round(point_mass_kl(0.5), 4), round(point_mass_kl(1 / 1024) / math.log(2), 6))
print(round(mcallester_bound(0.1, 0.0, 100, 0.2), 4), round(mcallester_bound(0.0, 50 * math.log(10) - math.log(2 * 10 / 0.1), 100, 0.1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8.0 0.0 0.6931 10.0\n0.2517 0.7587",
          "4.0 0.0 0.6931 10.0\n0.2517 0.7587",
          "8.0 0.0 0.6931 6.9315\n0.2517 0.7587",
          "8.0 0.0 0.6931 10.0\n0.1517 0.5587",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl_bern(q, p)</C> with 0 log 0 = 0, <C>kl_inverse(q, c)</C>, the largest p in [q, 1) with kl(q‖p) ≤ c, by 60
          steps of bisection starting from the interval [q, 1 − 10⁻¹²], and <C>seeger_bound(emp, kl, m, delta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def kl_bern(q, p):
    return 0.0

def kl_inverse(q, c):
    return q

def seeger_bound(emp, kl, m, delta):
    return emp
`,
        solution: KL,
        tests: [
          { name: "divergence", code: `assert abs(kl_bern(1.0, 0.25) - math.log(4)) < 1e-12 and abs(kl_bern(0.25, 0.5) - (0.25 * math.log(0.5) + 0.75 * math.log(1.5))) < 1e-12 and abs(kl_inverse(0.0, math.log(4)) - 0.75) < 1e-9 and abs(kl_bern(0.2, kl_inverse(0.2, 0.1)) - 0.1) < 1e-9` },
          { name: "bound", code: `assert abs(seeger_bound(0.0, math.log(2), 25, 0.2) - (1 - math.exp(-(math.log(2) + math.log(50)) / 25))) < 1e-9 and seeger_bound(0.1, 0.0, 10 ** 6, 0.5) > 0.1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_kl(w, w0, sigma)</C> for isotropic Gaussians of equal width, <C>mcallester_bound(emp, kl, m, delta)</C>{" "}
          and <C>point_mass_kl(prior_prob)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_kl(w, w0, sigma):
    return 0.0

def mcallester_bound(emp, kl, m, delta):
    return emp

def point_mass_kl(prior_prob):
    return 0.0
`,
        solution: BOUNDS,
        tests: [
          { name: "divergences", code: `assert gaussian_kl([0.0, 3.0, 4.0], [0.0, 0.0, 0.0], 1.0) == 12.5 and gaussian_kl([1.0], [0.0], 0.1) > 49.99 and abs(point_mass_kl(0.25) - math.log(4)) < 1e-12` },
          { name: "bound", code: `assert abs(mcallester_bound(0.0, math.log(25), 50, 2 * math.sqrt(50)) - math.sqrt(math.log(25) / 100)) < 1e-12 and abs(mcallester_bound(0.3, 0.0, 2, 2 * math.sqrt(2) / math.e) - 0.8) < 1e-12` },
        ],
      },
    },
    {
      key: "occam",
      rung: "stretch",
      prompt: (
        <p>
          A classifier is chosen from a class of 2²⁰ hypotheses under a uniform prior, with the posterior a point mass on it.
          It has empirical error 0.05 on m = 1000 examples. With δ = 0.05, what risk bound does the kl form of the PAC-Bayes
          theorem give? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.107, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course: from PAC learning and VC dimension, through Rademacher complexity, stability, kernels and
        online learning, to the questions that overparameterised models pose. The analysis of deep networks themselves,
        their training dynamics and their implicit biases, continues in the next course.
      </p>
    </>
  ),
};
