import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RademacherViz } from "@/components/viz/RademacherViz";
import type { LessonContent } from "@/lib/types";

const EXACT = `import math
from itertools import product

def threshold_values(points, ts):
    return [[1 if x >= t else -1 for x in points] for t in ts]

def rademacher_exact(values):
    m = len(values[0])
    total = 0.0
    for s in product([-1, 1], repeat=m):
        total += max(sum(si * v for si, v in zip(s, row)) for row in values) / m
    return total / 2 ** m

def massart_bound(values):
    m = len(values[0])
    r = max(math.sqrt(sum(v * v for v in row)) for row in values)
    return r * math.sqrt(2 * math.log(len(values))) / m`;

const LINEAR = `import math

def sup_linear(xs, sigma, B):
    v = [sum(s * x[j] for s, x in zip(sigma, xs)) for j in range(len(xs[0]))]
    return B * math.sqrt(sum(c * c for c in v)) / len(xs)

def linear_rad_upper(xs, B):
    return B * math.sqrt(sum(sum(c * c for c in x) for x in xs)) / len(xs)

def rademacher_bound(emp_risk, rad, m, delta):
    return emp_risk + 2 * rad + 3 * math.sqrt(math.log(2 / delta) / (2 * m))`;

export const lesson: LessonContent = {
  id: "m16.3.1",
  minutes: 50,
  links: {
    requires: ["m16.2.3", "m15.1.3"],
    revisits: ["m16.2.1"],
    foreshadows: ["m16.3.2", "m16.3.3", "m16.5.3"],
  },

  puzzle: (
    <>
      <p>
        Give a class random labels, coin flips with no pattern at all, and see how well it can fit them. A class that fits
        noise well can fit anything, including the accidents of a particular training set; a class that cannot fit noise must
        be picking up real structure when it fits the data. Can this experiment, run on the actual inputs, replace the
        worst-case VC dimension?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Rademacher complexity is the average best correlation between the class and random signs on the sample. It
        depends on the data: points that are hard to separate make the class weaker, and a class of linear functions with
        bounded weights is weak however many parameters it has. Because it is computed on the sample, it can be estimated, and
        the resulting bounds adapt to the distribution in front of us.
      </p>
      <RademacherViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Rademacher complexity">
        <p>
          For a class F of real functions and a sample <M>{"S = (z_1, \\dots, z_m)"}</M>, with independent signs{" "}
          <M>{"\\sigma_i"}</M> equal to ±1 with probability 1/2, the empirical Rademacher complexity is
        </p>
        <MD>{"\\hat{\\mathfrak R}_S(F) = \\mathbb E_\\sigma\\Big[\\sup_{f \\in F} \\frac1m \\sum_{i=1}^m \\sigma_i f(z_i)\\Big]"}</MD>
        <p>
          (<C>rademacher_exact</C> enumerates all sign vectors), and <M>{"\\mathfrak R_m(F) = \\mathbb E_S \\hat{\\mathfrak R}_S(F)"}</M>.
          A single function has complexity 0; the class of all ±1 functions has complexity 1.
        </p>
        <Code>{EXACT}</Code>
      </Definition>

      <Theorem title="the Rademacher bound">
        <p>If every f in F takes values in [0, 1], then with probability at least 1 − δ, for all f in F,</p>
        <MD>{"\\mathbb E f \\le \\hat{\\mathbb E}_S f + 2\\mathfrak R_m(F) + \\sqrt{\\frac{\\ln(1/\\delta)}{2m}} \\quad\\text{and}\\quad \\mathbb E f \\le \\hat{\\mathbb E}_S f + 2\\hat{\\mathfrak R}_S(F) + 3\\sqrt{\\frac{\\ln(2/\\delta)}{2m}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\Phi(S) = \\sup_f (\\mathbb E f - \\hat{\\mathbb E}_S f)"}</M>. Changing one point changes Φ by at most 1/m, so
          McDiarmid&apos;s inequality (m15.1.3) gives <M>{"\\Phi(S) \\le \\mathbb E\\Phi + \\sqrt{\\ln(1/\\delta)/2m}"}</M>. For the
          expectation, introduce a ghost sample S′: <M>{"\\mathbb E f = \\mathbb E_{S'} \\hat{\\mathbb E}_{S'} f"}</M>, and moving the
          supremum inside the expectation can only increase it, so{" "}
          <M>{"\\mathbb E\\Phi \\le \\mathbb E_{S, S'} \\sup_f \\frac1m \\sum_i (f(z'_i) - f(z_i))"}</M>. Swapping <M>{"z_i"}</M> and{" "}
          <M>{"z'_i"}</M> does not change the distribution, so each difference may be multiplied by a random sign{" "}
          <M>{"\\sigma_i"}</M>; splitting the supremum gives at most <M>{"2\\mathfrak R_m(F)"}</M>. The second form replaces{" "}
          <M>{"\\mathfrak R_m"}</M> by its empirical value with one more application of McDiarmid (<C>rademacher_bound</C>).
          For classification, apply it to the loss class <M>{"\\{(x, y) \\mapsto \\mathbf 1[h(x) \\neq y]\\}"}</M>, whose complexity
          is half that of H with ±1 outputs.
        </p>
      </Proof>

      <Theorem title="Massart's finite class lemma">
        <p>
          If the restriction of F to S is a finite set A of vectors in <M>{"\\mathbb R^m"}</M> with{" "}
          <M>{"\\max_{a \\in A} \\|a\\|_2 \\le r"}</M>, then <M>{"\\hat{\\mathfrak R}_S(F) \\le r\\sqrt{2 \\ln |A|} / m"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For λ &gt; 0, Jensen gives{" "}
          <M>{"\\exp(\\lambda\\, \\mathbb E \\max_a \\langle \\sigma, a\\rangle) \\le \\sum_a \\mathbb E e^{\\lambda \\langle \\sigma, a\\rangle} \\le |A| e^{\\lambda^2 r^2 / 2}"}</M>,
          since each <M>{"\\sigma_i a_i"}</M> is sub-Gaussian with parameter <M>{"|a_i|"}</M>. Take logarithms, divide by λ, and choose{" "}
          <M>{"\\lambda = \\sqrt{2\\ln|A|}/r"}</M> (<C>massart_bound</C>). For ±1 classifiers <M>{"r = \\sqrt m"}</M> and{" "}
          <M>{"|A| \\le \\tau_H(m)"}</M>, which with Sauer-Shelah recovers a VC-type bound <M>{"O(\\sqrt{d \\ln m / m})"}</M>.
        </p>
      </Proof>

      <Theorem title="bounded linear functions">
        <p>
          For <M>{"F = \\{x \\mapsto \\langle w, x\\rangle : \\|w\\|_2 \\le B\\}"}</M>,{" "}
          <M>{"\\hat{\\mathfrak R}_S(F) \\le \\frac{B}{m}\\sqrt{\\sum_i \\|x_i\\|^2} \\le \\frac{BX}{\\sqrt m}"}</M> when every{" "}
          <M>{"\\|x_i\\| \\le X"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Cauchy-Schwarz the supremum over w is attained in the direction of <M>{"\\sum_i \\sigma_i x_i"}</M>, giving{" "}
          <M>{"\\tfrac{B}{m}\\|\\sum_i \\sigma_i x_i\\|"}</M> (<C>sup_linear</C>). By Jensen,{" "}
          <M>{"\\mathbb E\\|\\sum_i \\sigma_i x_i\\| \\le \\sqrt{\\mathbb E \\|\\sum_i \\sigma_i x_i\\|^2} = \\sqrt{\\sum_i \\|x_i\\|^2}"}</M>,
          because the cross terms have mean zero (<C>linear_rad_upper</C>). The dimension of x never appears: the norm of the
          weights, not their number, controls the complexity.
        </p>
        <Code>{LINEAR}</Code>
      </Proof>

      <Remark title="contraction">
        <p>
          Talagrand&apos;s contraction lemma says that composing every function with a fixed L-Lipschitz map multiplies the
          Rademacher complexity by at most L. So bounds for a linear class pass directly to the hinge or logistic loss of that
          class, which is how the next lesson obtains margin bounds, and layer by layer to some neural network classes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "linear",
      rung: "check",
      prompt: <p>Linear functions with ‖w‖ ≤ 1 act on 400 points, each of norm 1. What bound does BX/√m give on the empirical Rademacher complexity?</p>,
      answer: { kind: "numeric", value: 0.05, tolerance: 0.0001 },
    },
    {
      key: "massart",
      rung: "check",
      prompt: <p>A class produces at most 100 distinct ±1 labellings of 50 points. What does Massart&apos;s lemma give for its empirical Rademacher complexity? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.4292, tolerance: 0.0001 },
    },
    {
      key: "adapt",
      rung: "apply",
      prompt: <p>What is the main advantage of the empirical Rademacher complexity over the VC dimension?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is computed on the actual sample, so the bound adapts to the data and applies to real-valued classes such as norm-bounded linear functions",
          "It is always exactly zero for classes that generalise",
          "It does not require the training points to be independent",
          "It removes the need for a confidence parameter δ",
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
from itertools import product

def threshold_values(points, ts):
    return [[1 if x >= t else -1 for x in points] for t in ts]

def rademacher_exact(values):
    m = len(values[0])
    total = 0.0
    for s in product([-1, 1], repeat=m):
        total += max(sum(si * v for si, v in zip(s, row)) for row in values) / m
    return total / 2 ** m

def massart_bound(values):
    m = len(values[0])
    r = max(math.sqrt(sum(v * v for v in row)) for row in values)
    return r * math.sqrt(2 * math.log(len(values))) / m

V = threshold_values([1, 2], [0, 1.5, 3]); print(V, rademacher_exact(V))
print(rademacher_exact([[1, 1, 1]]), rademacher_exact([[1, -1], [-1, 1]]), round(massart_bound(V), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 1], [-1, 1], [-1, -1]] 0.75\n0.0 0.5 1.0481",
          "[[1, 1], [-1, 1], [-1, -1]] 0.5\n0.0 0.5 1.0481",
          "[[1, 1], [-1, 1], [-1, -1]] 0.75\n0.0 1.0 1.0481",
          "[[1, 1], [1, -1], [-1, -1]] 0.75\n0.0 0.5 1.0481",
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

def sup_linear(xs, sigma, B):
    v = [sum(s * x[j] for s, x in zip(sigma, xs)) for j in range(len(xs[0]))]
    return B * math.sqrt(sum(c * c for c in v)) / len(xs)

def linear_rad_upper(xs, B):
    return B * math.sqrt(sum(sum(c * c for c in x) for x in xs)) / len(xs)

def rademacher_bound(emp_risk, rad, m, delta):
    return emp_risk + 2 * rad + 3 * math.sqrt(math.log(2 / delta) / (2 * m))

xs = [(3, 4), (0, 0)]; print(linear_rad_upper(xs, 2), sup_linear(xs, [1, -1], 2), sup_linear([(1, 0), (1, 0)], [1, -1], 5))
print(round(rademacher_bound(0.1, 0.05, 1000, 0.05), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5.0 5.0 0.0\n0.3288",
          "5.0 5.0 5.0\n0.3288",
          "10.0 5.0 0.0\n0.3288",
          "5.0 5.0 0.0\n0.2788",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>threshold_values(points, ts)</C>, the ±1 outputs of each threshold on the points,{" "}
          <C>rademacher_exact(values)</C>, averaging over all sign vectors the best correlation (1/m) Σ σ_i v_i over the rows,
          and <C>massart_bound(values)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from itertools import product

def threshold_values(points, ts):
    return []

def rademacher_exact(values):
    return 0.0

def massart_bound(values):
    return 1.0
`,
        solution: EXACT,
        tests: [
          { name: "values and exact", code: `assert threshold_values([0, 5], [1]) == [[-1, 1]] and rademacher_exact([[1, 1], [-1, -1]]) == 0.5 and rademacher_exact([[1, -1], [1, 1], [-1, 1], [-1, -1]]) == 1.0` },
          { name: "massart", code: `assert abs(massart_bound([[1, 1, 1, 1], [-1, -1, -1, -1]]) - 2 * math.sqrt(2 * math.log(2)) / 4) < 1e-12 and massart_bound([[3, 4]]) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sup_linear(xs, sigma, B)</C>, the supremum over ‖w‖ ≤ B of (1/m) Σ σ_i ⟨w, x_i⟩,{" "}
          <C>linear_rad_upper(xs, B)</C> and <C>rademacher_bound(emp_risk, rad, m, delta)</C>, the data-dependent bound.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sup_linear(xs, sigma, B):
    return 0.0

def linear_rad_upper(xs, B):
    return B

def rademacher_bound(emp_risk, rad, m, delta):
    return emp_risk
`,
        solution: LINEAR,
        tests: [
          { name: "linear", code: `assert abs(sup_linear([(1, 2), (2, 1)], [1, 1], 1) - 3 * math.sqrt(2) / 2) < 1e-12 and abs(sup_linear([(1, 0)], [-1], 3) - 3.0) < 1e-12 and abs(linear_rad_upper([(1, 0), (0, 2)], 1) - math.sqrt(5) / 2) < 1e-12` },
          { name: "bound", code: `assert abs(rademacher_bound(0.2, 0.1, 50, 2 * math.exp(-1)) - 0.7) < 1e-12` },
        ],
      },
    },
    {
      key: "constants",
      rung: "stretch",
      prompt: (
        <p>
          The class has just the two constant functions +1 and −1. What is its empirical Rademacher complexity on 4 points?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.375, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Bounded-norm linear functions have complexity independent of dimension. The next lesson turns this into the first
        explanation of why large-margin classifiers generalise: the margin, not the number of features, controls the error.
      </p>
    </>
  ),
};
