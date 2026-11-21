import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CTransformViz } from "@/components/viz/CTransformViz";
import type { LessonContent } from "@/lib/types";

const CT = `import numpy as np

def c_transform(phi, C):
    return np.min(C - phi[:, None], axis=0)          # psi_j = min_i C_ij - phi_i

def cbar_transform(psi, C):
    return np.min(C - psi[None, :], axis=1)          # phi_i = min_j C_ij - psi_j

def dual_from_phi(phi, C, a, b):
    return float(phi @ a + c_transform(phi, C) @ b)  # the dual reduced to one function`;

const CONV = `import numpy as np

def legendre(f_vals, xs, ys):
    return np.max(np.outer(ys, xs) - f_vals[None, :], axis=1)    # f*(y) = max_x x y - f(x)

def ctransform_quadratic(phi_vals, xs, ys):
    return ys ** 2 / 2 - legendre(xs ** 2 / 2 - phi_vals, xs, ys)   # c(x, y) = (x - y)^2 / 2

def lipschitz_const(xs, f):
    d = np.abs(np.subtract.outer(f, f)); h = np.abs(np.subtract.outer(xs, xs))
    return float(np.max(d[h > 0] / h[h > 0]))`;

export const lesson: LessonContent = {
  id: "m20.2.2",
  minutes: 50,
  links: {
    requires: ["m20.2.1", "m10.2.4"],
    revisits: ["m10.2.1", "m8.5.4"],
    foreshadows: ["m20.3.1"],
  },

  puzzle: (
    <>
      <p>
        The dual of optimal transport asks for two functions, a price φ at each source and a price ψ at each target. Two unknown
        functions is a lot to search over. But once the source prices are fixed, the most a competitor can charge for delivery to
        each target is forced. Can the dual be reduced to a search over one function, and what shape must the optimal prices have?
        For the squared distance the answer turns out to be a familiar object from convex analysis.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Given φ, the constraint <M>{"\\varphi(x) + \\psi(y) \\le c(x, y)"}</M> for every x says that ψ(y) must lie below every
        function <M>{"c(x, y) - \\varphi(x)"}</M> of y. The largest such ψ is their lower envelope, the c-transform. Using it never
        lowers the dual value, so only envelope-shaped prices matter. For the squared distance the envelope of shifted parabolas is
        a convex conjugate in disguise, and for the distance itself the optimal prices are exactly the 1-Lipschitz functions.
      </p>
      <CTransformViz />
    </>
  ),

  theory: (
    <>
      <Definition title="c-transforms">
        <p>
          For a function φ on X, its c-transform is the function on Y
        </p>
        <MD>{"\\varphi^c(y) = \\inf_x \\, \\big(c(x, y) - \\varphi(x)\\big) ,"}</MD>
        <p>
          and for ψ on Y, <M>{"\\psi^{\\bar c}(x) = \\inf_y \\, (c(x, y) - \\psi(y))"}</M>. A function of the form{" "}
          <M>{"\\psi^{\\bar c}"}</M> is called c-concave. On finite sets these are column and row minima of{" "}
          <M>{"C_{ij} - \\varphi_i"}</M> and <M>{"C_{ij} - \\psi_j"}</M> (<C>c_transform</C>, <C>cbar_transform</C>).
        </p>
        <Code>{CT}</Code>
      </Definition>

      <Theorem title="the transform improves any feasible pair">
        <p>
          If (φ, ψ) is feasible, then so is <M>{"(\\varphi, \\varphi^c)"}</M>, and <M>{"\\psi \\le \\varphi^c"}</M>. Hence the dual
          value equals <M>{"\\sup_\\varphi \\big( \\int \\varphi\\, d\\mu + \\int \\varphi^c\\, d\\nu \\big)"}</M>, which{" "}
          <C>dual_from_phi</C> evaluates.
        </p>
      </Theorem>
      <Proof>
        <p>
          Feasibility of (φ, ψ) says <M>{"\\psi(y) \\le c(x, y) - \\varphi(x)"}</M> for all x, so ψ(y) is at most the infimum,{" "}
          <M>{"\\varphi^c(y)"}</M>. The pair <M>{"(\\varphi, \\varphi^c)"}</M> is feasible because{" "}
          <M>{"\\varphi^c(y) \\le c(x, y) - \\varphi(x)"}</M> for each x by definition of the infimum. Raising ψ to{" "}
          <M>{"\\varphi^c"}</M> raises <M>{"\\int \\psi\\, d\\nu"}</M>.
        </p>
      </Proof>

      <Theorem title="double transforms">
        <p>
          <M>{"\\varphi^{c\\bar c} \\ge \\varphi"}</M> and <M>{"\\varphi^{c \\bar c c} = \\varphi^c"}</M>. So the dual can be
          restricted to pairs <M>{"(\\varphi, \\varphi^c)"}</M> with φ c-concave, and φ is c-concave exactly when{" "}
          <M>{"\\varphi^{c\\bar c} = \\varphi"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The pair <M>{"(\\varphi, \\varphi^c)"}</M> is feasible, so applying the previous theorem with the roles of the two sides
          exchanged, <M>{"\\varphi \\le (\\varphi^c)^{\\bar c}"}</M>. The c-transform reverses order: if{" "}
          <M>{"\\varphi_1 \\le \\varphi_2"}</M> then <M>{"\\varphi_1^c \\ge \\varphi_2^c"}</M>. Applied to{" "}
          <M>{"\\varphi \\le \\varphi^{c\\bar c}"}</M> it gives <M>{"\\varphi^c \\ge \\varphi^{c\\bar c c}"}</M>, while the first
          claim for <M>{"\\bar c"}</M> applied to <M>{"\\psi = \\varphi^c"}</M> gives <M>{"\\psi^{\\bar c c} \\ge \\psi"}</M>. Together
          they give equality. Replacing φ by <M>{"\\varphi^{c\\bar c}"}</M> keeps <M>{"\\varphi^c"}</M> and raises{" "}
          <M>{"\\int \\varphi\\, d\\mu"}</M>.
        </p>
      </Proof>

      <Theorem title="quadratic cost and convex conjugates">
        <p>
          On <M>{"\\mathbb{R}^d"}</M> with <M>{"c(x, y) = \\tfrac12 |x - y|^2"}</M>, let{" "}
          <M>{"u(x) = \\tfrac12 |x|^2 - \\varphi(x)"}</M>. Then <M>{"\\varphi^c(y) = \\tfrac12 |y|^2 - u^*(y)"}</M>, where{" "}
          <M>{"u^*"}</M> is the convex conjugate (m10.2.4). In particular φ is c-concave exactly when u is convex and lower
          semicontinuous.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand <M>{"\\tfrac12|x - y|^2 - \\varphi(x) = \\tfrac12|y|^2 - (\\langle x, y \\rangle - u(x))"}</M> and take the
          infimum over x: it is <M>{"\\tfrac12|y|^2 - \\sup_x(\\langle x, y \\rangle - u(x)) = \\tfrac12|y|^2 - u^*(y)"}</M>. Applying
          the same identity twice, <M>{"\\varphi^{c\\bar c} = \\tfrac12|x|^2 - u^{**}"}</M>, which equals φ exactly when{" "}
          <M>{"u = u^{**}"}</M>, that is, when u is convex and lower semicontinuous. <C>legendre</C> and{" "}
          <C>ctransform_quadratic</C> compute this on a grid.
        </p>
      </Proof>

      <Theorem title="distance cost: Kantorovich-Rubinstein">
        <p>
          If c = d is a metric and φ is 1-Lipschitz, then <M>{"\\varphi^c = -\\varphi"}</M>. Every c-concave function is
          1-Lipschitz, so the dual becomes <M>{"\\sup \\{ \\int \\varphi\\, d(\\mu - \\nu) : \\varphi \\text{ 1-Lipschitz} \\}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Taking x = y gives <M>{"\\varphi^c(y) \\le -\\varphi(y)"}</M>, and <M>{"\\varphi(x) - \\varphi(y) \\le d(x, y)"}</M> gives{" "}
          <M>{"d(x, y) - \\varphi(x) \\ge -\\varphi(y)"}</M> for all x, so equality holds. A c-transform{" "}
          <M>{"\\psi^{\\bar c}(x) = \\inf_y (d(x, y) - \\psi(y))"}</M> is an infimum of 1-Lipschitz functions of x (m8.5.4), hence
          1-Lipschitz, provided it is finite. <C>lipschitz_const</C> computes the best Lipschitz constant on finitely many points.
        </p>
        <Code>{CONV}</Code>
      </Proof>

      <Example title="a linear potential">
        <p>
          On the line with <M>{"c = \\tfrac12(x - y)^2"}</M> and <M>{"\\varphi(x) = ax"}</M>, the infimum of{" "}
          <M>{"\\tfrac12(x - y)^2 - ax"}</M> is at x = y + a, so <M>{"\\varphi^c(y) = -ay - \\tfrac12 a^2"}</M>. Here{" "}
          <M>{"u(x) = \\tfrac12 x^2 - ax"}</M> is convex, so φ is c-concave, and the transport it describes is the translation by a:
          each x is sent to the point where its constraint is tight.
        </p>
      </Example>

      <Remark title="why this matters">
        <p>
          The reduction to one function is what makes the dual computable: semi-discrete solvers and the Wasserstein GAN critic of
          m20.5.1 optimise over a single potential. The link with convex conjugates is the heart of Brenier&apos;s theorem in the
          next chapter: the optimal map for the squared distance is the gradient of the convex function u.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lin",
      rung: "check",
      prompt: (
        <p>
          With <M>{"c(x, y) = \\tfrac12 (x - y)^2"}</M> on the real line and <M>{"\\varphi(x) = 2x"}</M>, what is{" "}
          <M>{"\\varphi^c(1)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -4, tolerance: 0.0005 },
    },
    {
      key: "lip",
      rung: "check",
      prompt: (
        <p>
          With <M>{"c(x, y) = |x - y|"}</M> on the real line and <M>{"\\varphi(x) = \\min(|x|, 1)"}</M>, what is{" "}
          <M>{"\\varphi^c(0.5)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -0.5, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why may the dual be restricted to pairs of the form (φ, φ^c)?</p>,
      answer: {
        kind: "choice",
        options: [
          "For a feasible pair, φ^c is the largest ψ compatible with φ, so replacing ψ by φ^c keeps feasibility and does not lower the dual value",
          "Because φ^c = φ for every cost",
          "Because the optimal plan is always a map",
          "Because ψ does not appear in the dual objective",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def c_transform(phi, C):
    return np.min(C - phi[:, None], axis=0)          # psi_j = min_i C_ij - phi_i

def cbar_transform(psi, C):
    return np.min(C - psi[None, :], axis=1)          # phi_i = min_j C_ij - psi_j

def dual_from_phi(phi, C, a, b):
    return float(phi @ a + c_transform(phi, C) @ b)  # the dual reduced to one function

C, phi, a = np.array([[0.0, 1.0], [1.0, 0.0]]), np.array([0.0, 3.0]), np.array([0.5, 0.5])
print(c_transform(phi, C).tolist(), cbar_transform(c_transform(phi, C), C).tolist(), dual_from_phi(phi, C, a, a))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[-2.0, -3.0] [2.0, 3.0] -1.0", "[0.0, -2.0] [2.0, 3.0] -1.0", "[-2.0, -3.0] [0.0, 3.0] -1.0", "[-2.0, -3.0] [2.0, 3.0] 1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def legendre(f_vals, xs, ys):
    return np.max(np.outer(ys, xs) - f_vals[None, :], axis=1)    # f*(y) = max_x x y - f(x)

def ctransform_quadratic(phi_vals, xs, ys):
    return ys ** 2 / 2 - legendre(xs ** 2 / 2 - phi_vals, xs, ys)   # c(x, y) = (x - y)^2 / 2

def lipschitz_const(xs, f):
    d = np.abs(np.subtract.outer(f, f)); h = np.abs(np.subtract.outer(xs, xs))
    return float(np.max(d[h > 0] / h[h > 0]))

xs = np.array([-1.0, 0.0, 1.0])
print(legendre(xs ** 2 / 2, xs, np.array([0.5, 2.0])).tolist(), lipschitz_const(xs, np.array([0.0, 2.0, 1.0])), ctransform_quadratic(xs, xs, np.array([1.0])).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.0, 1.5] 2.0 [-1.0]", "[0.125, 2.0] 2.0 [-1.0]", "[0.0, 1.5] 1.0 [-1.0]", "[0.0, 1.5] 2.0 [0.5]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>c_transform(phi, C)</C>, <C>cbar_transform(psi, C)</C> and <C>dual_from_phi(phi, C, a, b)</C> for a cost
          matrix C with rows indexed by sources.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def c_transform(phi, C):
    return np.min(C, axis=0) - np.max(phi)

def cbar_transform(psi, C):
    return np.max(C - psi[None, :], axis=1)

def dual_from_phi(phi, C, a, b):
    return float(phi @ a)
`,
        solution: CT,
        tests: [
          { name: "ct", code: `C = np.array([[0.0, 2.0, 5.0], [3.0, 1.0, 0.0]])\npsi = c_transform(np.array([1.0, 2.0]), C)\nassert psi.shape == (3,)\nassert np.allclose(psi, [-1.0, -1.0, -2.0]) and np.allclose(cbar_transform(psi, C), [1.0, 2.0])` },
          { name: "dual", code: `C = np.array([[0.0, 1.0], [1.0, 0.0]]); a = np.array([0.5, 0.5])\nassert abs(dual_from_phi(np.array([0.0, 0.0]), C, a, a)) < 1e-12 and abs(dual_from_phi(np.array([1.0, 0.0]), C, a, a) - 0.0) < 1e-12 and abs(dual_from_phi(np.array([0.5, -0.5]), C, np.array([1.0, 0.0]), np.array([0.0, 1.0])) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>legendre(f_vals, xs, ys)</C>, the discrete convex conjugate, <C>ctransform_quadratic(phi_vals, xs, ys)</C> for{" "}
          <M>{"c = \\tfrac12(x - y)^2"}</M>, and <C>lipschitz_const(xs, f)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def legendre(f_vals, xs, ys):
    return np.min(np.outer(ys, xs) - f_vals[None, :], axis=1)

def ctransform_quadratic(phi_vals, xs, ys):
    return legendre(phi_vals, xs, ys)

def lipschitz_const(xs, f):
    return float(np.max(np.abs(np.diff(f))))
`,
        solution: CONV,
        tests: [
          { name: "conj", code: `xs = np.array([0.0, 1.0, 2.0])\nr = legendre(np.array([0.0, 1.0, 4.0]), xs, np.array([1.0, 3.0]))\nassert r.shape == (2,)\nassert np.allclose(r, [0.0, 2.0]) and np.allclose(ctransform_quadratic(np.zeros(3), xs, np.array([1.5])), [0.125])` },
          { name: "lip", code: `assert abs(lipschitz_const(np.array([0.0, 0.5, 2.0]), np.array([0.0, 1.0, 1.5])) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "double",
      rung: "stretch",
      prompt: (
        <p>
          With a = b = (0.5, 0.5), cost matrix <M>{"C = \\begin{pmatrix} 0 & 4 \\\\ 1 & 1 \\end{pmatrix}"}</M> and φ = (0, 5),
          compute <M>{"\\psi = \\varphi^c"}</M> and then <M>{"\\varphi' = \\psi^{\\bar c}"}</M>. What is the dual value of{" "}
          <M>{"(\\varphi', \\psi)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        With duality in hand, the optimal cost becomes a distance between distributions. The next chapter defines the Wasserstein
        distances, proves Brenier&apos;s theorem that optimal plans for the squared distance are gradients of convex functions, and
        computes the distance exactly in one dimension and for Gaussians.
      </p>
    </>
  ),
};
