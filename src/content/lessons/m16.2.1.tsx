import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UniformGapViz } from "@/components/viz/UniformGapViz";
import type { LessonContent } from "@/lib/types";

const RADII = `import math

def hoeffding_radius(m, delta):
    return math.sqrt(math.log(2 / delta) / (2 * m))

def uniform_radius(n_hyp, m, delta):
    return math.sqrt(math.log(2 * n_hyp / delta) / (2 * m))

def agnostic_sample_size(n_hyp, eps, delta):
    return math.ceil(2 * math.log(2 * n_hyp / delta) / eps ** 2)`;

const GAPS = `def max_gap(hyps, samples, true_risks):
    gaps = []
    for h, r in zip(hyps, true_risks):
        emp = sum(h(x) != y for x, y in samples) / len(samples)
        gaps.append(abs(emp - r))
    return max(gaps)

def bits_class_size(d, b):
    return 2 ** (d * b)

def erm_excess_bound(radius):
    return 2 * radius`;

export const lesson: LessonContent = {
  id: "m16.2.1",
  minutes: 45,
  links: {
    requires: ["m16.1.2", "m15.1.2"],
    revisits: ["m16.1.1"],
    foreshadows: ["m16.2.2", "m16.3.1", "m16.7.4"],
  },

  puzzle: (
    <>
      <p>
        Hoeffding&apos;s inequality says that the training error of one fixed rule is within 0.14 of its true error, with
        95% confidence, after 100 examples. But ERM does not use a fixed rule: it looks at the data and picks the rule that
        looks best. A rule chosen because it looked good on this sample is exactly the one whose training error is most
        likely to be flattering. How much does the act of choosing cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the training error is close to the true error for <em>every</em> hypothesis simultaneously, then choosing among them
        cannot fool us: whichever one we pick, its training error is honest. So the question becomes how large a sample must
        be for all the estimates to be good at once. With finitely many hypotheses, the union bound answers it, and the price
        of choosing among |H| rules turns out to be only logarithmic in |H|.
      </p>
      <UniformGapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ε-representative samples and uniform convergence">
        <p>
          A sample S is ε-representative for H and D if <M>{"|L_S(h) - L_D(h)| \\le \\varepsilon"}</M> for every h in H. The
          class has the uniform convergence property if, for some <M>{"m^{UC}_H(\\varepsilon, \\delta)"}</M>, a sample of that
          size is ε-representative with probability at least 1 − δ, for every D.
        </p>
      </Definition>

      <Theorem title="ERM on a representative sample">
        <p>
          If S is ε/2-representative, ERM returns <M>{"h_S"}</M> with{" "}
          <M>{"L_D(h_S) \\le \\min_{h \\in H} L_D(h) + \\varepsilon"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For any h, <M>{"L_D(h_S) \\le L_S(h_S) + \\varepsilon/2 \\le L_S(h) + \\varepsilon/2 \\le L_D(h) + \\varepsilon"}</M>.
          The middle step is the definition of ERM; the outer two use representativeness (<C>erm_excess_bound</C> doubles the
          radius).
        </p>
      </Proof>

      <Theorem title="finite classes converge uniformly">
        <p>For a finite class and a loss in [0, 1], a sample is ε-representative with probability at least 1 − δ once</p>
        <MD>{"m \\ge \\frac{\\ln(2|H|/\\delta)}{2\\varepsilon^2},"}</MD>
        <p>so agnostic ERM is within ε of the best in class once <M>{"m \\ge 2\\ln(2|H|/\\delta)/\\varepsilon^2"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          For a fixed h, <M>{"L_S(h)"}</M> is a mean of m independent losses in [0, 1] with mean <M>{"L_D(h)"}</M>. Hoeffding&apos;s
          inequality (m15.1.2) gives <M>{"\\Pr[|L_S(h) - L_D(h)| > \\varepsilon] \\le 2e^{-2m\\varepsilon^2}"}</M>
          (<C>hoeffding_radius</C> solves for ε). The sample fails to be representative only if this happens for some h, so by
          the union bound the failure probability is at most <M>{"2|H| e^{-2m\\varepsilon^2}"}</M>. Setting it to δ gives the
          radius <M>{"\\sqrt{\\ln(2|H|/\\delta) / 2m}"}</M> (<C>uniform_radius</C>). Replacing ε by ε/2 and applying the previous
          theorem gives the sample size for ERM (<C>agnostic_sample_size</C>).
        </p>
        <Code>{RADII}</Code>
      </Proof>

      <Remark title="the price of agnosticism">
        <p>
          Compare the realisable bound <M>{"\\ln(|H|/\\delta)/\\varepsilon"}</M> (m16.1.2) with the agnostic{" "}
          <M>{"2\\ln(2|H|/\\delta)/\\varepsilon^2"}</M>. When some hypothesis is perfect, a single mistake rules a bad
          hypothesis out; when none is, errors must be estimated, and estimating a probability to accuracy ε takes on the order
          of <M>{"1/\\varepsilon^2"}</M> samples.
        </p>
      </Remark>

      <Remark title="the discretisation trick">
        <p>
          A model with d parameters each stored in b bits is a finite class of at most <M>{"2^{db}"}</M> hypotheses
          (<C>bits_class_size</C>), so <M>{"\\ln|H| \\le db \\ln 2"}</M> and the sample complexity grows linearly in the number of
          parameters. This is a valid bound for any computer-implemented model, but for a modern network it asks for far more
          examples than the network needs. The union bound wastes most of its budget: as the visualisation shows, the empirical
          risks of similar hypotheses move together (<C>max_gap</C>), and the next lessons measure a class by how many
          genuinely different behaviours it has.
        </p>
        <Code>{GAPS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "radius",
      rung: "check",
      prompt: <p>A class has 100 hypotheses. With m = 1000 examples and δ = 0.05, what radius √(ln(2|H|/δ)/2m) holds for every hypothesis at once? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0644, tolerance: 0.0001 },
    },
    {
      key: "size",
      rung: "check",
      prompt: <p>How many examples does the agnostic bound 2 ln(2|H|/δ)/ε² require for |H| = 50, ε = 0.05 and δ = 0.01?</p>,
      answer: { kind: "numeric", value: 7369, tolerance: 0.5 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is a Hoeffding bound for a single fixed hypothesis not enough to bound the true error of the hypothesis returned by ERM?</p>,
      answer: {
        kind: "choice",
        options: [
          "ERM chooses its hypothesis after seeing the sample, so the chosen hypothesis is not fixed in advance and its training error is biased towards looking good",
          "Hoeffding's inequality needs Gaussian losses",
          "ERM's training error is always zero",
          "Hoeffding's inequality only applies to the realisable case",
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

def hoeffding_radius(m, delta):
    return math.sqrt(math.log(2 / delta) / (2 * m))

def uniform_radius(n_hyp, m, delta):
    return math.sqrt(math.log(2 * n_hyp / delta) / (2 * m))

def agnostic_sample_size(n_hyp, eps, delta):
    return math.ceil(2 * math.log(2 * n_hyp / delta) / eps ** 2)

print(round(hoeffding_radius(100, 0.05), 4), round(uniform_radius(1, 100, 0.05), 4), round(uniform_radius(1000, 100, 0.05), 4))
print(agnostic_sample_size(1, 0.1, 0.05), agnostic_sample_size(10 ** 6, 0.1, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1358 0.1358 0.2302\n738 3501",
          "0.1358 0.1224 0.2302\n738 3501",
          "0.1358 0.1358 0.2302\n369 1751",
          "0.1358 0.1358 0.1358\n738 3501",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def max_gap(hyps, samples, true_risks):
    gaps = []
    for h, r in zip(hyps, true_risks):
        emp = sum(h(x) != y for x, y in samples) / len(samples)
        gaps.append(abs(emp - r))
    return max(gaps)

def bits_class_size(d, b):
    return 2 ** (d * b)

def erm_excess_bound(radius):
    return 2 * radius

H = [lambda x: 0, lambda x: 1, lambda x: int(x >= 2)]; S = [(0, 0), (1, 1), (2, 1), (3, 1)]
print(max_gap(H, S, [0.5, 0.5, 0.25]), bits_class_size(3, 2), erm_excess_bound(0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 64 0.1",
          "0.0 64 0.1",
          "0.25 8 0.1",
          "0.25 64 0.05",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hoeffding_radius(m, delta)</C> for one hypothesis, <C>uniform_radius(n_hyp, m, delta)</C> for a finite class,
          and <C>agnostic_sample_size(n_hyp, eps, delta)</C>, the sample size at which ERM is within eps of the best in class.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def hoeffding_radius(m, delta):
    return 0.0

def uniform_radius(n_hyp, m, delta):
    return 0.0

def agnostic_sample_size(n_hyp, eps, delta):
    return 1
`,
        solution: RADII,
        tests: [
          { name: "radii", code: `assert abs(hoeffding_radius(50, 2 * math.exp(-1)) - 0.1) < 1e-12 and abs(uniform_radius(5, 8, 1.0) - math.sqrt(math.log(10) / 16)) < 1e-12 and abs(uniform_radius(1, 30, 0.1) - hoeffding_radius(30, 0.1)) < 1e-15` },
          { name: "size", code: `assert agnostic_sample_size(10, 0.5, 0.2) == 37 and agnostic_sample_size(1, 1.0, 2.0) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_gap(hyps, samples, true_risks)</C>, the largest |empirical − true| 0-1 risk over the hypotheses,{" "}
          <C>bits_class_size(d, b)</C> and <C>erm_excess_bound(radius)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def max_gap(hyps, samples, true_risks):
    return 0.0

def bits_class_size(d, b):
    return d * b

def erm_excess_bound(radius):
    return radius
`,
        solution: GAPS,
        tests: [
          { name: "gap", code: `H = [lambda x: 1, lambda x: int(x > 0)]; S = [(0, 0), (1, 1), (2, 0), (3, 1)]
assert max_gap(H, S, [0.5, 0.0]) == 0.25 and max_gap(H[:1], S, [0.2]) == 0.3` },
          { name: "size and excess", code: `assert bits_class_size(4, 8) == 2 ** 32 and bits_class_size(1, 1) == 2 and erm_excess_bound(0.125) == 0.25` },
        ],
      },
    },
    {
      key: "network",
      rung: "stretch",
      prompt: (
        <p>
          A model has 1000 parameters stored as 32-bit floats. Using the discretisation trick and the agnostic finite-class
          bound, how many millions of examples guarantee that ERM is within 0.1 of the best in class with probability 0.95?
          Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.44, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Thresholds on the real line form an infinite class, yet they generalise as well as a small finite one. The next
        lesson finds the right measure of their size: not how many hypotheses there are, but how many ways they can label a
        sample.
      </p>
    </>
  ),
};
