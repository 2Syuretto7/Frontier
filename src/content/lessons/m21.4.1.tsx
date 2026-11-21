import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SphereGradViz } from "@/components/viz/SphereGradViz";
import type { LessonContent } from "@/lib/types";

const SPHERE = `import numpy as np

def sphere_project(x, g):
    return g - (x @ g) * x                                    # (I - x x^T) g: drop the normal component

def sphere_retract(x, v):
    y = x + v
    return y / np.linalg.norm(y)                              # step in the tangent direction, then back to the sphere

def rayleigh_descent(A, x, lr, steps):
    for _ in range(steps):
        x = sphere_retract(x, -lr * sphere_project(x, 2 * A @ x))   # Riemannian gradient descent on x^T A x
    return x`;

const ORTH = `import numpy as np

def skew(M):
    return (M - M.T) / 2

def orth_project(Q, G):
    return Q @ skew(Q.T @ G)                                  # tangent vectors at Q are Q Omega with Omega skew

def qr_retract(Q, V):
    q, r = np.linalg.qr(Q + V)
    return q * np.sign(np.diag(r))                            # signs fixed so the orthogonal factor is unique`;

export const lesson: LessonContent = {
  id: "m21.4.1",
  minutes: 55,
  links: {
    requires: ["m21.3.4", "m5.6.2"],
    revisits: ["m5.5.5", "m6.3.5"],
    foreshadows: ["m21.4.2"],
  },

  puzzle: (
    <>
      <p>
        Contrastive models normalise their embeddings to unit length, some recurrent networks keep their weight matrix orthogonal,
        and pose-estimation networks must output a rotation. In each case the quantity being learned lives on a curved surface
        inside a vector space: a sphere, the orthogonal group, the rotation group. A plain gradient step leaves the surface. How
        should gradient descent be adapted so that it stays on the surface and still goes downhill as fast as possible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A manifold is a set that looks like flat space near every point, and its tangent space at a point collects the directions
        in which one can move while staying on it, to first order. The steepest way down along the manifold is the part of the
        ordinary gradient that lies in the tangent space; the rest points off the surface and is wasted. After a small step along
        the tangent direction, a retraction pulls the point back onto the manifold.
      </p>
      <SphereGradViz />
    </>
  ),

  theory: (
    <>
      <Definition title="embedded manifolds and tangent spaces">
        <p>
          A subset M of <M>{"\\mathbb{R}^n"}</M> is a k-dimensional embedded manifold if near each of its points it is a regular
          level set: <M>{"M = \\{x : F(x) = 0\\}"}</M> locally, for a smooth <M>{"F : \\mathbb{R}^n \\to \\mathbb{R}^{n-k}"}</M>{" "}
          whose Jacobian DF(x) has full rank n − k on M. The tangent space <M>{"T_xM"}</M> is the set of velocities{" "}
          <M>{"\\gamma'(0)"}</M> of smooth curves γ in M with <M>{"\\gamma(0) = x"}</M>.
        </p>
      </Definition>

      <Theorem title="tangent spaces are kernels">
        <p>
          For a regular level set, <M>{"T_xM = \\ker DF(x)"}</M>, a subspace of dimension k, and M has local coordinates: near x it
          is the graph of a smooth function of k of the coordinates.
        </p>
      </Theorem>
      <Proof>
        <p>
          If γ lies in M then <M>{"F(\\gamma(t)) = 0"}</M>, and the chain rule gives <M>{"DF(x)\\gamma'(0) = 0"}</M>, so{" "}
          <M>{"T_xM \\subseteq \\ker DF(x)"}</M>, which has dimension k by rank-nullity. Since DF(x) has rank n − k, some n − k
          columns are independent, and the implicit function theorem (m5.6.2) solves F = 0 for those coordinates as a smooth
          function h of the other k near x. Then for any <M>{"u \\in \\mathbb{R}^k"}</M> the curve <M>{"t \\mapsto (y + tu, h(y + tu))"}</M>{" "}
          lies in M, and these velocities span a k-dimensional space, so the inclusion is equality.
        </p>
      </Proof>

      <Example title="spheres, orthogonal groups and frames">
        <p>
          The sphere <M>{"S^{n-1} = \\{|x|^2 = 1\\}"}</M> has <M>{"DF(x) = 2x^\\top"}</M>, so{" "}
          <M>{"T_xS^{n-1} = \\{v : x^\\top v = 0\\}"}</M>. The orthogonal group{" "}
          <M>{"O(n) = \\{Q : Q^\\top Q = I\\}"}</M> is cut out by the <M>{"n(n+1)/2"}</M> independent entries of the symmetric matrix{" "}
          <M>{"Q^\\top Q - I"}</M>; differentiating gives <M>{"Q^\\top V + V^\\top Q = 0"}</M>, so the tangent vectors are{" "}
          <M>{"V = Q\\Omega"}</M> with Ω skew-symmetric, and the dimension is <M>{"n(n-1)/2"}</M>. The Stiefel manifold of n × k
          matrices with orthonormal columns has dimension <M>{"nk - k(k+1)/2"}</M> by the same count.
        </p>
      </Example>

      <Theorem title="the Riemannian gradient">
        <p>
          Let f be smooth near M and give each tangent space the inner product of <M>{"\\mathbb{R}^n"}</M>. The orthogonal projection{" "}
          <M>{"\\operatorname{grad} f(x) = P_x \\nabla f(x)"}</M> of the ordinary gradient onto <M>{"T_xM"}</M> satisfies{" "}
          <M>{"\\tfrac{d}{dt}f(\\gamma(t))|_{t=0} = \\langle \\operatorname{grad} f(x), \\gamma'(0)\\rangle"}</M> for every curve in M,
          so among unit tangent vectors, <M>{"-\\operatorname{grad} f/|\\operatorname{grad} f|"}</M> decreases f fastest. On the
          sphere <M>{"P_x = I - xx^\\top"}</M> (<C>sphere_project</C>); on O(n),{" "}
          <M>{"P_Q(G) = Q\\operatorname{skew}(Q^\\top G)"}</M> with <M>{"\\operatorname{skew}(A) = (A - A^\\top)/2"}</M>
          (<C>skew</C>, <C>orth_project</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule the derivative is <M>{"\\langle \\nabla f(x), v\\rangle"}</M> with <M>{"v = \\gamma'(0)"}</M> tangent,
          and since <M>{"\\nabla f - P_x\\nabla f"}</M> is orthogonal to the tangent space, this equals{" "}
          <M>{"\\langle P_x\\nabla f, v\\rangle"}</M>. Cauchy-Schwarz gives the steepest direction. For O(n), the tangent space at Q
          is <M>{"Q"}</M> times the skew matrices, Q is orthogonal, and in the trace inner product the symmetric and skew matrices
          are orthogonal complements, so the projection of <M>{"Q^\\top G"}</M> onto the skew matrices is its skew part.
        </p>
        <Code>{ORTH}</Code>
      </Proof>

      <Definition title="retractions and Riemannian gradient descent">
        <p>
          A retraction maps a tangent step <M>{"x + v"}</M> back to M while agreeing with it to first order: normalising on the
          sphere (<C>sphere_retract</C>), or taking the orthogonal factor of a QR decomposition on O(n) (<C>qr_retract</C>).
          Riemannian gradient descent iterates <M>{"x \\leftarrow R_x(-\\eta\\operatorname{grad} f(x))"}</M>.
        </p>
      </Definition>

      <Example title="the Rayleigh quotient">
        <p>
          For symmetric A and <M>{"f(x) = x^\\top Ax"}</M> on the sphere, <M>{"\\operatorname{grad} f(x) = 2(Ax - (x^\\top Ax)x)"}</M>,
          which vanishes exactly when x is a unit eigenvector: the Lagrange condition of m5.5.5. Descent (<C>rayleigh_descent</C>)
          from a generic start converges to an eigenvector of the smallest eigenvalue, the minimum of the Rayleigh quotient
          (m6.3.5); the other eigenvectors are saddles or maxima.
        </p>
        <Code>{SPHERE}</Code>
      </Example>

      <Remark title="manifolds in deep learning">
        <p>
          Besides constrained parameters, manifolds appear as the space of outputs (rotations for pose, directions for normals, unit
          embeddings) and as a hypothesis about data: that natural images or molecules concentrate near a manifold of much lower
          dimension than the ambient space. Hyperbolic spaces, whose volume grows exponentially with radius, have been used to embed
          trees and hierarchies with low distortion. The next lesson replaces the inherited inner product by a general one, which
          is what changes the notion of steepest descent itself.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stiefel",
      rung: "check",
      prompt: <p>What is the dimension of the manifold of 5 × 2 real matrices with orthonormal columns?</p>,
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
    {
      key: "proj",
      rung: "check",
      prompt: (
        <p>
          At x = (0.6, 0, 0.8) on the unit sphere, what is the length of the Riemannian gradient of a function whose ordinary
          gradient is (1, 1, 1)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.02, tolerance: 0.0006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is the gradient projected onto the tangent space before taking a step on the sphere?</p>,
      answer: {
        kind: "choice",
        options: [
          "Only tangent directions move along the sphere to first order; the normal component changes the length, which renormalisation undoes, so it gives no descent",
          "Because the ordinary gradient is always zero on the sphere",
          "Because projection makes the step size smaller",
          "Because the retraction requires a unit-length input",
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

def sphere_project(x, g):
    return g - (x @ g) * x                                    # (I - x x^T) g: drop the normal component

def sphere_retract(x, v):
    y = x + v
    return y / np.linalg.norm(y)                              # step in the tangent direction, then back to the sphere

def rayleigh_descent(A, x, lr, steps):
    for _ in range(steps):
        x = sphere_retract(x, -lr * sphere_project(x, 2 * A @ x))   # Riemannian gradient descent on x^T A x
    return x

x = np.array([0.0, 0.0, 1.0]); g = np.array([1.0, 2.0, 3.0]); A = np.diag([3.0, 1.0, 2.0])
print(sphere_project(x, g).tolist(), sphere_retract(x, np.array([0.0, 2.0, 0.0])).round(3).tolist(), np.abs(rayleigh_descent(A, np.ones(3) / np.sqrt(3), 0.1, 200)).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 2.0, 0.0] [0.0, 0.894, 0.447] [0.0, 1.0, 0.0]",
          "[1.0, 2.0, 0.0] [0.0, 0.894, 0.447] [1.0, 0.0, 0.0]",
          "[0.0, 0.0, 3.0] [0.0, 0.894, 0.447] [0.0, 1.0, 0.0]",
          "[1.0, 2.0, 0.0] [0.0, 2.0, 1.0] [0.0, 1.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def skew(M):
    return (M - M.T) / 2

def orth_project(Q, G):
    return Q @ skew(Q.T @ G)                                  # tangent vectors at Q are Q Omega with Omega skew

def qr_retract(Q, V):
    q, r = np.linalg.qr(Q + V)
    return q * np.sign(np.diag(r))                            # signs fixed so the orthogonal factor is unique

Q = np.eye(2); G = np.array([[0.0, 2.0], [0.0, 0.0]]); R = qr_retract(Q, orth_project(Q, G))
print(skew(G).tolist(), orth_project(Q, G).tolist(), np.abs(R @ R.T).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, 1.0], [-1.0, 0.0]] [[0.0, 1.0], [-1.0, 0.0]] [[1.0, 0.0], [0.0, 1.0]]",
          "[[0.0, 2.0], [-2.0, 0.0]] [[0.0, 2.0], [-2.0, 0.0]] [[1.0, 0.0], [0.0, 1.0]]",
          "[[0.0, 1.0], [-1.0, 0.0]] [[0.0, 2.0], [0.0, 0.0]] [[1.0, 0.0], [0.0, 1.0]]",
          "[[0.0, 1.0], [-1.0, 0.0]] [[0.0, 1.0], [-1.0, 0.0]] [[2.0, 0.0], [0.0, 2.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sphere_project(x, g)</C>, <C>sphere_retract(x, v)</C> and <C>rayleigh_descent(A, x, lr, steps)</C>, Riemannian
          gradient descent on <M>{"x^\\top Ax"}</M> over the unit sphere.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sphere_project(x, g):
    return g

def sphere_retract(x, v):
    return x + v

def rayleigh_descent(A, x, lr, steps):
    return x
`,
        solution: SPHERE,
        tests: [
          { name: "proj", code: `x = np.array([0.6, 0.8]); t = sphere_project(x, np.array([1.0, 0.0]))\nassert abs(t @ x) < 1e-12 and np.allclose(t, [0.64, -0.48])\nassert np.allclose(sphere_retract(np.array([1.0, 0.0]), np.array([0.0, 1.0])), [2 ** -0.5, 2 ** -0.5])` },
          { name: "descent", code: `x = rayleigh_descent(np.diag([2.0, 5.0, 1.0]), np.ones(3) / np.sqrt(3), 0.05, 400)\nassert abs(np.linalg.norm(x) - 1) < 1e-12 and abs(abs(x[2]) - 1) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>skew(M)</C>, <C>orth_project(Q, G)</C>, the projection of G onto the tangent space of O(n) at Q, and{" "}
          <C>qr_retract(Q, V)</C>, the orthogonal factor of Q + V with the signs of the diagonal of R made positive.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def skew(M):
    return M

def orth_project(Q, G):
    return G

def qr_retract(Q, V):
    return Q + V
`,
        solution: ORTH,
        tests: [
          { name: "tangent", code: `r = np.random.default_rng(0); Q, _ = np.linalg.qr(r.normal(size=(3, 3))); G = r.normal(size=(3, 3))\nW = Q.T @ orth_project(Q, G)\nassert np.allclose(W, -W.T) and np.allclose(skew(np.array([[1.0, 4.0], [2.0, 3.0]])), [[0.0, 1.0], [-1.0, 0.0]])` },
          { name: "retract", code: `r = np.random.default_rng(1); Q, _ = np.linalg.qr(r.normal(size=(3, 3))); V = Q @ skew(r.normal(size=(3, 3)))\nR = qr_retract(Q, 0.1 * V)\nassert np.allclose(R.T @ R, np.eye(3)) and np.linalg.norm(R - Q) < 0.5 and np.allclose(qr_retract(np.eye(2), np.zeros((2, 2))), np.eye(2))` },
        ],
      },
    },
    {
      key: "crit",
      rung: "stretch",
      prompt: (
        <p>
          For a 3 × 3 diagonal matrix A with distinct diagonal entries, how many critical points does{" "}
          <M>{"f(x) = x^\\top Ax"}</M> have on the unit sphere <M>{"S^2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Here every tangent space borrowed the inner product of the surrounding space. A Riemannian metric lets the inner product
        vary from point to point, which changes lengths, distances and the direction of steepest descent, and is the language in
        which the Fisher metric and natural gradient are stated.
      </p>
    </>
  ),
};
