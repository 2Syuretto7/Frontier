import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RkhsNormViz } from "@/components/viz/RkhsNormViz";
import type { LessonContent } from "@/lib/types";

const KERNELS = `import math

def gaussian_kernel(x, z, s):
    return math.exp(-sum((a - b) ** 2 for a, b in zip(x, z)) / (2 * s * s))

def gram(xs, k):
    return [[k(a, b) for b in xs] for a in xs]

def quad_form(K, a):
    n = len(a)
    return sum(a[i] * K[i][j] * a[j] for i in range(n) for j in range(n))`;

const FUNCTIONS = `import math

def rkhs_eval(alpha, xs, k, x):
    return sum(a * k(xi, x) for a, xi in zip(alpha, xs))

def rkhs_norm(alpha, xs, k):
    return math.sqrt(sum(a * b * k(x, z) for a, x in zip(alpha, xs) for b, z in zip(alpha, xs)))

def kernel_distance(k, x, z):
    return math.sqrt(k(x, x) + k(z, z) - 2 * k(x, z))`;

export const lesson: LessonContent = {
  id: "m16.5.1",
  minutes: 50,
  links: {
    requires: ["m16.3.2", "m8.9.1"],
    revisits: ["m6.1.1", "m3.5.1"],
    foreshadows: ["m16.5.2", "m16.5.3", "m16.5.4"],
  },

  puzzle: (
    <>
      <p>
        A linear method on polynomial features of degree 10 in 100 variables would need about 4.7 × 10^13 coordinates, and a
        Gaussian kernel corresponds to infinitely many. Yet the computation needs only the numbers k(x, z), one per pair of
        inputs. What space are these methods really working in, what does &ldquo;the norm of w&rdquo; mean there, and why do
        the margin and stability bounds still apply?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A kernel is an inner product in disguise: <M>{"k(x, z) = \\langle \\phi(x), \\phi(z) \\rangle"}</M> for some feature map φ.
        Linear functions <M>{"\\langle w, \\phi(x) \\rangle"}</M> of those features form a space of ordinary functions of x, and
        the norm of w becomes a norm on functions. For a Gaussian kernel that norm penalises roughness: a function is cheap if
        it varies on the scale of the kernel and expensive if it wiggles faster.
      </p>
      <RkhsNormViz />
    </>
  ),

  theory: (
    <>
      <Definition title="positive semidefinite kernels">
        <p>
          A symmetric function <M>{"k : X \\times X \\to \\mathbb R"}</M> is a positive semidefinite kernel if every Gram matrix{" "}
          <M>{"K_{ij} = k(x_i, x_j)"}</M> (<C>gram</C>) satisfies <M>{"a^\\top K a \\ge 0"}</M> for all a (<C>quad_form</C>). Examples
          are the linear kernel <M>{"\\langle x, z \\rangle"}</M>, the polynomial kernel <M>{"(1 + \\langle x, z\\rangle)^p"}</M> and the
          Gaussian kernel <M>{"\\exp(-\\|x - z\\|^2 / 2\\sigma^2)"}</M> (<C>gaussian_kernel</C>). Sums, products, positive
          multiples and limits of kernels are kernels; the product rule is the Schur product theorem.
        </p>
        <Code>{KERNELS}</Code>
      </Definition>

      <Theorem title="Moore-Aronszajn">
        <p>
          For every positive semidefinite kernel k there is a unique Hilbert space H of functions on X such that{" "}
          <M>{"k(x, \\cdot) \\in H"}</M> for every x and
        </p>
        <MD>{"f(x) = \\langle f, k(x, \\cdot) \\rangle_H \\quad \\text{for all } f \\in H,\\ x \\in X."}</MD>
        <p>H is the reproducing kernel Hilbert space (RKHS) of k.</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"H_0"}</M> be the finite combinations <M>{"f = \\sum_i \\alpha_i k(x_i, \\cdot)"}</M> (<C>rkhs_eval</C>) with{" "}
          <M>{"\\langle \\sum_i \\alpha_i k(x_i, \\cdot), \\sum_j \\beta_j k(z_j, \\cdot)\\rangle = \\sum_{i,j} \\alpha_i \\beta_j k(x_i, z_j)"}</M>.
          This is well defined, since it equals <M>{"\\sum_j \\beta_j f(z_j)"}</M>, which depends on f only through its values,
          and positive semidefinite by assumption. The reproducing property holds on <M>{"H_0"}</M> by construction, and
          Cauchy-Schwarz then gives <M>{"|f(x)| \\le \\|f\\| \\sqrt{k(x, x)}"}</M>, so <M>{"\\|f\\| = 0"}</M> forces f = 0 and the
          form is an inner product. Completing <M>{"H_0"}</M> (m8.9.1), with Cauchy sequences converging pointwise thanks to the
          same inequality, gives H; uniqueness follows because any such space must contain <M>{"H_0"}</M> with this inner product
          as a dense subspace.
        </p>
      </Proof>

      <Theorem title="the norm controls variation">
        <p>For f in H and any x, z,</p>
        <MD>{"|f(x) - f(z)| \\le \\|f\\|_H \\sqrt{k(x, x) + k(z, z) - 2k(x, z)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          By the reproducing property <M>{"f(x) - f(z) = \\langle f, k(x, \\cdot) - k(z, \\cdot)\\rangle"}</M>, and Cauchy-Schwarz bounds
          it by <M>{"\\|f\\|"}</M> times <M>{"\\|k(x, \\cdot) - k(z, \\cdot)\\|"}</M>, whose square expands to the expression under the
          root (<C>kernel_distance</C>). For f in <M>{"H_0"}</M> the norm is <M>{"\\sqrt{\\alpha^\\top K \\alpha}"}</M> (<C>rkhs_norm</C>).
          Small norm forces f to vary only where the kernel geometry separates points, which is the sense in which the RKHS norm
          is a smoothness penalty.
        </p>
        <Code>{FUNCTIONS}</Code>
      </Proof>

      <Example title="feature maps">
        <p>
          For the polynomial kernel <M>{"(1 + xz)^2"}</M> in one dimension,{" "}
          <M>{"\\phi(x) = (1, \\sqrt 2 x, x^2)"}</M>, and the RKHS is the quadratics with{" "}
          <M>{"\\|a + bx + cx^2\\|^2 = a^2 + b^2/2 + c^2"}</M>. Mercer&apos;s theorem gives, for continuous kernels on compact sets,
          an expansion <M>{"k(x, z) = \\sum_j \\mu_j e_j(x) e_j(z)"}</M> in orthonormal eigenfunctions, so{" "}
          <M>{"\\phi(x) = (\\sqrt{\\mu_j} e_j(x))_j"}</M>. For the Gaussian kernel the eigenvalues decay rapidly, and functions with
          large high-frequency components have large norm.
        </p>
      </Example>

      <Remark title="why the earlier theory carries over">
        <p>
          The margin and stability bounds used only inner products and norms, so they hold verbatim in an RKHS with X replaced
          by <M>{"\\sup_x \\sqrt{k(x, x)}"}</M>, which is 1 for the Gaussian kernel. The dimension of the feature space, even when
          infinite, never enters. What remains is to show that the infinite-dimensional optimisation is in fact finite, which is
          the representer theorem.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dist",
      rung: "check",
      prompt: <p>For the Gaussian kernel with σ = 1, what is √(k(x, x) + k(z, z) − 2k(x, z)) for two points at Euclidean distance 1? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.8871, tolerance: 0.0001 },
    },
    {
      key: "norm",
      rung: "check",
      prompt: <p>In the RKHS of the one-dimensional Gaussian kernel with σ = 1, what is the norm of f = 2k(0, ·) − k(1, ·)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.6043, tolerance: 0.0001 },
    },
    {
      key: "closure",
      rung: "apply",
      prompt: <p>Given two positive semidefinite kernels k₁ and k₂, which of these is always a positive semidefinite kernel?</p>,
      answer: {
        kind: "choice",
        options: [
          "Their product k₁(x, z) k₂(x, z)",
          "Their difference k₁(x, z) − k₂(x, z)",
          "Their ratio k₁(x, z) / k₂(x, z)",
          "Their pointwise minimum",
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

def gaussian_kernel(x, z, s):
    return math.exp(-sum((a - b) ** 2 for a, b in zip(x, z)) / (2 * s * s))

def gram(xs, k):
    return [[k(a, b) for b in xs] for a in xs]

def quad_form(K, a):
    n = len(a)
    return sum(a[i] * K[i][j] * a[j] for i in range(n) for j in range(n))

k = lambda x, z: (1 + sum(a * b for a, b in zip(x, z))) ** 2; X = [(0,), (1,), (-1,)]; print(gram(X, k), quad_form(gram(X, k), [1, -1, 0]))
print(round(gaussian_kernel((0, 0), (1, 1), 1.0), 4), gaussian_kernel((2,), (2,), 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 1, 1], [1, 4, 0], [1, 0, 4]] 3\n0.3679 1.0",
          "[[1, 1, 1], [1, 4, 0], [1, 0, 4]] 7\n0.3679 1.0",
          "[[1, 1, 1], [1, 4, 0], [1, 0, 4]] 3\n0.6065 1.0",
          "[[1, 1, 1], [1, 2, 0], [1, 0, 2]] 3\n0.3679 1.0",
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

def rkhs_eval(alpha, xs, k, x):
    return sum(a * k(xi, x) for a, xi in zip(alpha, xs))

def rkhs_norm(alpha, xs, k):
    return math.sqrt(sum(a * b * k(x, z) for a, x in zip(alpha, xs) for b, z in zip(alpha, xs)))

def kernel_distance(k, x, z):
    return math.sqrt(k(x, x) + k(z, z) - 2 * k(x, z))

g = lambda x, z: x * z + 1; xs = [1.0, -1.0]; print(rkhs_eval([1, 2], xs, g, 3.0), round(rkhs_norm([1, 2], xs, g), 4))
print(round(kernel_distance(g, 1.0, -1.0), 4), kernel_distance(lambda x, z: math.exp(-(x - z) ** 2), 5.0, 5.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 3.1623\n2.0 0.0",
          "0.0 10.0\n2.0 0.0",
          "4.0 3.1623\n2.0 0.0",
          "0.0 3.1623\n4.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_kernel(x, z, s)</C> for vectors x and z, <C>gram(xs, k)</C> and <C>quad_form(K, a)</C>, the value
          aᵀKa.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_kernel(x, z, s):
    return 1.0

def gram(xs, k):
    return []

def quad_form(K, a):
    return 0.0
`,
        solution: KERNELS,
        tests: [
          { name: "kernel and gram", code: `assert abs(gaussian_kernel((0,), (2,), 1.0) - math.exp(-2)) < 1e-12 and abs(gaussian_kernel((1, 1), (1, 2), 0.5) - math.exp(-2)) < 1e-12 and gram([1, 2], lambda a, b: a * b) == [[1, 2], [2, 4]]` },
          { name: "quadratic form", code: `assert quad_form([[2, 0], [0, 3]], [1, 1]) == 5 and quad_form([[1, 2], [2, 1]], [1, -1]) == -2 and quad_form([[4]], [0.5]) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rkhs_eval(alpha, xs, k, x)</C> for f = Σ α_i k(x_i, ·), <C>rkhs_norm(alpha, xs, k)</C> and{" "}
          <C>kernel_distance(k, x, z)</C>, the RKHS distance between k(x, ·) and k(z, ·).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rkhs_eval(alpha, xs, k, x):
    return 0.0

def rkhs_norm(alpha, xs, k):
    return 0.0

def kernel_distance(k, x, z):
    return 0.0
`,
        solution: FUNCTIONS,
        tests: [
          { name: "evaluate and norm", code: `assert rkhs_eval([2], [0.0], lambda a, b: a + b + 1, 1.0) == 4.0 and rkhs_norm([3], [(0,)], lambda a, b: 4.0) == 6.0 and abs(rkhs_norm([1, 1], [0, 1], lambda a, b: float(a == b)) - math.sqrt(2)) < 1e-12` },
          { name: "distance", code: `assert abs(kernel_distance(lambda a, b: a * b, 3.0, 1.0) - 2.0) < 1e-12 and kernel_distance(lambda a, b: 1.0, 0, 9) == 0.0` },
        ],
      },
    },
    {
      key: "lipschitz",
      rung: "stretch",
      prompt: (
        <p>
          A function in the RKHS of the Gaussian kernel with σ = 0.5 has norm at most 2. What is the largest possible difference
          between its values at two points 0.3 apart? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.148, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Minimising a loss plus the RKHS norm looks like a search over an infinite-dimensional space. The representer theorem
        shows that the minimiser always lies in the span of the m functions k(x_i, ·), so the search is over m numbers.
      </p>
    </>
  ),
};
