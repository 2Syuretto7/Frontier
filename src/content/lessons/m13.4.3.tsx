import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LeapfrogViz } from "@/components/viz/LeapfrogViz";
import type { LessonContent } from "@/lib/types";

const HMC = `import numpy as np

def leapfrog(grad_U, x, p, eps, L):
    x, p = x.copy(), p - 0.5 * eps * grad_U(x)
    for i in range(L):
        x = x + eps * p
        if i < L - 1:
            p = p - eps * grad_U(x)
    return x, p - 0.5 * eps * grad_U(x)

def hmc(rng, U, grad_U, x0, eps, L, n):
    x, out, acc = np.asarray(x0, float), [], 0
    for _ in range(n):
        p = rng.normal(size=x.shape)
        y, q = leapfrog(grad_U, x, p, eps, L)
        dH = U(y) + 0.5 * q @ q - U(x) - 0.5 * p @ p
        if np.log(rng.random()) < -dH:
            x, acc = y, acc + 1
        out.append(x)
    return np.array(out), acc / n`;

const LF = `import numpy as np

def leapfrog_map(eps):
    return np.array([[1 - eps ** 2 / 2, eps], [-eps * (1 - eps ** 2 / 4), 1 - eps ** 2 / 2]])

def energy_error(eps, L):
    M, z, worst = leapfrog_map(eps), np.array([1.0, 0.0]), 0.0
    for _ in range(L):
        z = M @ z
        worst = max(worst, abs(0.5 * float(z @ z) - 0.5))
    return worst`;

export const lesson: LessonContent = {
  id: "m13.4.3",
  minutes: 65,
  links: {
    requires: ["m13.4.1"],
    revisits: ["m13.3.2", "m13.4.2"],
    foreshadows: ["m13.4.4"],
  },

  puzzle: (
    <>
      <p>
        A random walk proposal has to be small to be accepted, so it explores by diffusion and needs order d steps to cross a
        d-dimensional target. Suppose instead you could fire the sampler across the distribution like a frictionless puck
        sliding over a landscape whose height is −log π: far from the start, yet accepted almost every time. How can a long
        deterministic flight still leave π exactly invariant, and what goes wrong when you simulate it with finite steps?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give the position x a momentum p, drawn fresh at random, and let the pair evolve under Hamiltonian dynamics with
        potential energy <M>{"U = -\\log\\pi"}</M>. The puck speeds up going downhill and slows going uphill, so it naturally
        spends time in proportion to the density. Exact dynamics conserve energy and phase-space volume, which together make the
        move a perfect Metropolis proposal that is always accepted. A numerical integrator only approximately conserves
        energy, and the Metropolis test corrects the error, provided the integrator still preserves volume and can be run
        backwards. The leapfrog scheme does both.
      </p>
      <LeapfrogViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Hamiltonian">
        <p>
          With <M>{"U(x) = -\\log\\pi(x)"}</M> and an independent momentum <M>{"p \\sim N(0, I)"}</M>, the joint density is{" "}
          <M>{"\\exp(-H(x, p))"}</M> with <M>{"H = U(x) + \\tfrac12\\lVert p\\rVert^2"}</M>, whose x-marginal is π. Hamilton&apos;s
          equations are <M>{"\\dot x = p"}</M>, <M>{"\\dot p = -\\nabla U(x)"}</M>.
        </p>
      </Definition>

      <Theorem title="three properties of the flow">
        <p>
          The Hamiltonian flow <M>{"\\Phi_t"}</M> conserves H, preserves volume in (x, p) space, and is reversible:{" "}
          <M>{"R\\,\\Phi_t\\,R = \\Phi_t^{-1}"}</M>, where <M>{"R(x, p) = (x, -p)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Along the flow, <M>{"\\dot H = \\nabla U\\cdot\\dot x + p\\cdot\\dot p = \\nabla U\\cdot p - p\\cdot\\nabla U = 0"}</M>. The
          vector field <M>{"(p, -\\nabla U(x))"}</M> has divergence{" "}
          <M>{"\\sum_i \\partial p_i/\\partial x_i - \\partial_i U/\\partial p_i = 0"}</M>, so by Liouville&apos;s theorem volume is
          preserved. If (x(t), p(t)) solves the equations then so does (x(−t), −p(−t)), which is the reversibility statement.
        </p>
      </Proof>

      <Definition title="leapfrog">
        <p>
          One step of size ε is a half kick <M>{"p \\leftarrow p - \\tfrac{\\varepsilon}{2}\\nabla U(x)"}</M>, a drift{" "}
          <M>{"x \\leftarrow x + \\varepsilon p"}</M>, and another half kick. Each piece is a shear, changing one block of
          variables by an amount depending only on the other block, so it has Jacobian determinant 1; and the symmetric
          arrangement makes the step reversible in the same sense as the flow.
        </p>
      </Definition>

      <Theorem title="Hamiltonian Monte Carlo is exact">
        <p>
          Draw <M>{"p \\sim N(0, I)"}</M>, apply L leapfrog steps to reach (y, q), and accept y with probability{" "}
          <M>{"\\min(1, \\exp(H(x, p) - H(y, q)))"}</M>. The resulting chain on x leaves π invariant.
        </p>
      </Theorem>
      <Proof>
        <p>
          Refreshing p is a Gibbs step for the joint density, so it preserves <M>{"e^{-H}"}</M>. For the second part consider the
          deterministic proposal <M>{"F = R \\circ \\Psi"}</M>, with Ψ the L leapfrog steps. Reversibility gives{" "}
          <M>{"F \\circ F = \\mathrm{id}"}</M>, and F preserves volume. For a volume-preserving involution, Metropolis-Hastings
          with proposal F and acceptance <M>{"\\min(1, e^{-H(F(z))}/e^{-H(z)})"}</M> satisfies detailed balance: the flow of mass
          from a small set A to F(A) is <M>{"\\int_A \\min(e^{-H(z)}, e^{-H(F z)})\\,dz"}</M>, which is symmetric under the
          substitution z ↦ Fz because the Jacobian is 1. The final flip of momentum does not matter in practice because the
          next refresh discards p.
        </p>
        <Code>{HMC}</Code>
      </Proof>

      <Example title="the harmonic oscillator">
        <p>
          For <M>{"U = x^2/2"}</M> one leapfrog step is linear, with matrix{" "}
          <M>{"\\begin{pmatrix} 1 - \\varepsilon^2/2 & \\varepsilon \\\\ -\\varepsilon(1 - \\varepsilon^2/4) & 1 - \\varepsilon^2/2\\end{pmatrix}"}</M>,
          determinant 1 and trace <M>{"2 - \\varepsilon^2"}</M>. A real 2 × 2 matrix of determinant 1 is conjugate to a rotation
          when its trace lies in (−2, 2), so the scheme is stable exactly when ε &lt; 2. One checks that it conserves the shadow
          energy <M>{"(1 - \\varepsilon^2/4)x^2 + p^2"}</M> exactly; comparing with the true energy shows the error in H never
          exceeds <M>{"\\varepsilon^2/8"}</M>, however many steps are taken. For a Gaussian target with standard deviations{" "}
          <M>{"\\sigma_i"}</M> the same analysis applies coordinate by coordinate after scaling, so the step must satisfy{" "}
          <M>{"\\varepsilon < 2\\sigma_{min}"}</M>: the narrowest direction limits the step, while the widest sets how many steps
          are needed to cross.
        </p>
        <Code>{LF}</Code>
      </Example>

      <Remark title="tuning and scaling">
        <p>
          For product targets the mean energy error over a trajectory of fixed length grows like <M>{"d\\varepsilon^4"}</M>, so the
          step can shrink as slowly as <M>{"d^{-1/4}"}</M>, against <M>{"d^{-1/2}"}</M> for random-walk Metropolis, and the optimal
          acceptance rate is about 0.65. A preconditioning mass matrix, the covariance of p, removes the dependence on{" "}
          <M>{"\\sigma_{max}/\\sigma_{min}"}</M> when it matches the target&apos;s scales. The trajectory length is delicate:
          too short and HMC becomes a random walk, while a length close to a half-period sends each coordinate to its mirror
          image and can make estimates of variances badly wrong. Randomising L, or letting the No-U-Turn Sampler stop each
          trajectory when it starts to double back, avoids this. A sudden huge energy error, a divergence, signals a region
          of curvature the step size cannot handle.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stable",
      rung: "check",
      prompt: <p>A Gaussian target has independent coordinates with standard deviations 0.1 and 10, and HMC uses identity mass. Above what step size is leapfrog unstable?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>For the oscillator H = (x² + p²)/2, what is the largest possible energy error of leapfrog with ε = 0.4?</p>,
      answer: { kind: "numeric", value: 0.02, tolerance: 0.0001 },
    },
    {
      key: "flip",
      rung: "apply",
      prompt: <p>Why does the correctness proof compose the leapfrog steps with a momentum flip?</p>,
      answer: {
        kind: "choice",
        options: [
          "The flipped map is a volume-preserving involution, so the proposal undoes itself and the Hastings ratio reduces to the ratio of joint densities",
          "Flipping the momentum reduces the energy error",
          "It makes the chain periodic, which speeds up mixing",
          "Without the flip, leapfrog would not preserve volume",
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

def leapfrog(grad_U, x, p, eps, L):
    x, p = x.copy(), p - 0.5 * eps * grad_U(x)
    for i in range(L):
        x = x + eps * p
        if i < L - 1:
            p = p - eps * grad_U(x)
    return x, p - 0.5 * eps * grad_U(x)

def hmc(rng, U, grad_U, x0, eps, L, n):
    x, out, acc = np.asarray(x0, float), [], 0
    for _ in range(n):
        p = rng.normal(size=x.shape)
        y, q = leapfrog(grad_U, x, p, eps, L)
        dH = U(y) + 0.5 * q @ q - U(x) - 0.5 * p @ p
        if np.log(rng.random()) < -dH:
            x, acc = y, acc + 1
        out.append(x)
    return np.array(out), acc / n

x, p = leapfrog(lambda x: x, np.array([0.3]), np.array([0.7]), 0.4, 5); y, q = leapfrog(lambda x: x, x, -p, 0.4, 5); print(np.allclose(y, 0.3), np.allclose(-q, 0.7))
S = np.array([[1, 0.95], [0.95, 1]]); Si = np.linalg.inv(S); o, a = hmc(np.random.default_rng(0), lambda x: 0.5 * x @ Si @ x, lambda x: Si @ x, np.zeros(2), 0.2, 15, 5000)
print(round(a, 2), abs(np.corrcoef(o.T)[0, 1] - 0.95) < 0.02)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True\n0.93 True", "False False\n0.93 True", "True True\n0.23 True", "True True\n0.93 False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def leapfrog_map(eps):
    return np.array([[1 - eps ** 2 / 2, eps], [-eps * (1 - eps ** 2 / 4), 1 - eps ** 2 / 2]])

def energy_error(eps, L):
    M, z, worst = leapfrog_map(eps), np.array([1.0, 0.0]), 0.0
    for _ in range(L):
        z = M @ z
        worst = max(worst, abs(0.5 * float(z @ z) - 0.5))
    return worst

print(round(float(np.linalg.det(leapfrog_map(1.5))), 6) + 0.0, round(float(np.trace(leapfrog_map(1.5))), 3))
print([round(energy_error(e, 200), 3) for e in (0.5, 1.9)], energy_error(2.1, 200) > 1e6)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 -0.25\n[0.031, 0.451] True",
          "1.0 -0.25\n[0.031, 0.451] False",
          "0.4375 -0.25\n[0.031, 0.451] True",
          "1.0 2.0\n[0.0, 0.0] True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>leapfrog(grad_U, x, p, eps, L)</C>, returning the position and momentum after L steps, and{" "}
          <C>hmc(rng, U, grad_U, x0, eps, L, n)</C>, returning the n states of the chain as an array and the acceptance rate.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def leapfrog(grad_U, x, p, eps, L):
    return x, p

def hmc(rng, U, grad_U, x0, eps, L, n):
    return np.zeros((n, len(x0))), 0.0
`,
        solution: HMC,
        tests: [
          { name: "leapfrog", code: `x, p = leapfrog(lambda x: x, np.array([1.0]), np.array([0.0]), 0.3, 50); y, q = leapfrog(lambda x: x, x, -p, 0.3, 50)
assert abs(0.5 * (x @ x + p @ p) - 0.5) < 0.0113 and not np.allclose(x, 1.0) and np.allclose(y, 1.0) and np.allclose(q, 0.0)` },
          { name: "hmc", code: `w = np.array([1, 0.25]); o, a = hmc(np.random.default_rng(1), lambda x: 0.5 * x @ (w * x), lambda x: w * x, np.zeros(2), 0.4, 5, 6000); v = o[500:].var(axis=0)
assert a > 0.9 and abs(v[0] - 1) < 0.1 and abs(v[1] - 4) < 0.4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>leapfrog_map(eps)</C>, the 2 × 2 matrix of one leapfrog step for <M>{"U = x^2/2"}</M> acting on (x, p), and{" "}
          <C>energy_error(eps, L)</C>, the largest |H − ½| over L steps started at (1, 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def leapfrog_map(eps):
    return np.eye(2)

def energy_error(eps, L):
    return 0.0
`,
        solution: LF,
        tests: [
          { name: "map", code: `M = leapfrog_map(0.7); z = M @ M @ np.array([0.2, -0.5]); assert abs(np.linalg.det(M) - 1) < 1e-12 and np.allclose(z, [-0.5005, -0.2555], atol=1e-4)` },
          { name: "energy", code: `assert abs(energy_error(0.5, 200) - 0.03125) < 1e-3 and energy_error(2.1, 200) > 1e6 and energy_error(1.0, 200) <= 0.125 + 1e-12` },
        ],
      },
    },
    {
      key: "accept",
      rung: "stretch",
      prompt: <p>A leapfrog trajectory ends with the total energy 0.3 higher than it started. With what probability is it accepted?</p>,
      answer: { kind: "numeric", value: 0.7408, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Shrink the trajectory to a single leapfrog step and HMC becomes a gradient step with noise. Taking that limit carefully
        leads to the Langevin diffusion, the continuous-time process behind both a family of samplers and diffusion models.
      </p>
    </>
  ),
};
