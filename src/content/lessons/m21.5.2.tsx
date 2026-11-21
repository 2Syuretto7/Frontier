import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SymplecticViz } from "@/components/viz/SymplecticViz";
import type { LessonContent } from "@/lib/types";

const FORCES = `import numpy as np

def pair_energy(X):
    i, j = np.triu_indices(len(X), 1)
    r = np.linalg.norm(X[i] - X[j], axis=1)
    return float(np.sum((r - 1.0) ** 2))                       # invariant: depends on distances only

def forces(X):
    diff = X[:, None, :] - X[None, :, :]
    r = np.linalg.norm(diff, axis=-1); np.fill_diagonal(r, 1.0)
    return -np.sum((2 * (r - 1.0) / r)[:, :, None] * diff, axis=1)   # F_i = -dE/dx_i

def net_force_torque(X, F):
    return F.sum(0), np.cross(X, F).sum(0)                     # both vanish for an invariant energy`;

const STEPS = `import numpy as np

def euler_step(x, v, force, dt):
    return x + dt * v, v + dt * force(x)

def verlet_step(x, v, force, dt):
    vh = v + dt / 2 * force(x)                                 # half kick, drift, half kick
    xn = x + dt * vh
    return xn, vh + dt / 2 * force(xn)

def osc_energy(x, v):
    return 0.5 * (x ** 2 + v ** 2)                             # for force(x) = -x`;

export const lesson: LessonContent = {
  id: "m21.5.2",
  minutes: 55,
  links: {
    requires: ["m21.5.1", "m21.2.2"],
    revisits: ["m11.8.1", "m13.4.3"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A network trained to predict the forces on atoms can match a quantum chemistry code to within a few per cent on every
        test configuration, and still make a simulated molecule heat up until it falls apart after a few thousand time steps.
        Another network, no more accurate on the test set, runs stably for millions of steps. What does the second network
        respect that the first does not, and what must the time-stepping scheme respect as well?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Physics has symmetries beyond turning the coordinates: the laws are the same at every place, in every direction and at
        every time. By Noether&apos;s principle these symmetries become conservation laws of momentum, angular momentum and
        energy. A model that predicts an invariant energy and takes forces as its gradient inherits all three for free. The
        integrator must then not destroy them: a naive step leaks energy every time, while a step that preserves the geometry of
        phase space keeps the error bounded forever.
      </p>
      <SymplecticViz />
    </>
  ),

  theory: (
    <>
      <Definition title="features of every type">
        <p>
          Scalars such as energies are unchanged by rotations, vectors such as forces and velocities rotate with them, and quantities
          such as stresses and quadrupole moments transform by larger representations. By m21.2.2 every representation of the
          rotation group SO(3) splits into irreducible ones, one of dimension <M>{"2\\ell + 1"}</M> for each degree{" "}
          <M>{"\\ell = 0, 1, 2, \\dots"}</M>, realised by the spherical harmonics of degree <M>{"\\ell"}</M>. Equivariant networks
          such as Tensor Field Networks, NequIP and MACE give each atom features of several degrees, and combine them with tensor
          products followed by a projection onto irreducible parts, the Clebsch–Gordan decomposition. For two vectors this is
          familiar: their tensor product, of dimension 9, splits as 1 + 3 + 5, namely the dot product, the cross product and a
          symmetric traceless matrix.
        </p>
      </Definition>

      <Theorem title="forces from an invariant energy">
        <p>
          Let <M>{"E(x_1, \\dots, x_N)"}</M> be invariant under translations and rotations, and set{" "}
          <M>{"F_i = -\\partial E/\\partial x_i"}</M> (<C>forces</C>). Then the forces are rotation equivariant, the net force{" "}
          <M>{"\\sum_i F_i"}</M> is zero and the net torque <M>{"\\sum_i x_i \\times F_i"}</M> is zero (<C>net_force_torque</C>).
        </p>
        <Code>{FORCES}</Code>
      </Theorem>
      <Proof>
        <p>
          Differentiating <M>{"E(Qx) = E(x)"}</M> by the chain rule gives <M>{"Q^\\top \\nabla E(Qx) = \\nabla E(x)"}</M>, that is{" "}
          <M>{"F(Qx) = QF(x)"}</M>. For any vector a, <M>{"E(x_1 + \\varepsilon a, \\dots, x_N + \\varepsilon a)"}</M> is constant in ε,
          and its derivative at 0 is <M>{"-a\\cdot\\sum_i F_i = 0"}</M>. For any axis ω, the rotations{" "}
          <M>{"x_i \\mapsto x_i + \\varepsilon\\, \\omega \\times x_i + O(\\varepsilon^2)"}</M> leave E unchanged, so{" "}
          <M>{"0 = -\\sum_i (\\omega \\times x_i)\\cdot F_i = -\\omega\\cdot\\sum_i x_i \\times F_i"}</M>. Since a and ω are arbitrary,
          both sums vanish. By Newton&apos;s second law the total momentum and angular momentum are then constant in time.
        </p>
      </Proof>

      <Remark title="direct force prediction">
        <p>
          A network can also output an equivariant vector per atom directly, which is cheaper than differentiating an energy. Such
          a force field is equivariant but need not be the gradient of anything: around a closed loop of configurations it can
          do net work, and a simulation driven by it can gain energy steadily, which is the failure in the puzzle. Gradient-based
          models are conservative by construction, at the price of one backward pass (m5.3.3) per step.
        </p>
      </Remark>

      <Theorem title="explicit Euler leaks energy">
        <p>
          For the oscillator <M>{"\\ddot x = -x"}</M> with energy <M>{"\\tfrac12(x^2 + v^2)"}</M> (<C>osc_energy</C>), one step of
          explicit Euler (<C>euler_step</C>, m11.8.1) with step dt multiplies the energy by exactly <M>{"1 + dt^2"}</M>, whatever the
          state, and multiplies areas in the (x, v) plane by the same factor.
        </p>
      </Theorem>
      <Proof>
        <p>
          The step is linear: <M>{"(x, v) \\mapsto (x + dt\\,v,\\ v - dt\\,x)"}</M>, and{" "}
          <M>{"(x + dt\\,v)^2 + (v - dt\\,x)^2 = (1 + dt^2)(x^2 + v^2)"}</M> because the cross terms cancel. The matrix{" "}
          <M>{"\\begin{pmatrix}1 & dt\\\\ -dt & 1\\end{pmatrix}"}</M> has determinant <M>{"1 + dt^2"}</M>, the area factor.
        </p>
      </Proof>

      <Theorem title="velocity Verlet is symplectic">
        <p>
          Velocity Verlet (<C>verlet_step</C>) is a half kick of the velocity, a drift of the position and another half kick, the
          leapfrog of m13.4.3. Each of the three maps is a shear, so the step preserves area in phase space, and for the
          oscillator it exactly conserves the modified energy <M>{"\\tfrac12\\big(v^2 + (1 - dt^2/4)\\,x^2\\big)"}</M> when dt &lt; 2. The
          true energy therefore only oscillates within a band of width of order <M>{"dt^2"}</M>, for all time.
        </p>
        <Code>{STEPS}</Code>
      </Theorem>
      <Proof>
        <p>
          A kick <M>{"(x, v) \\mapsto (x, v + c\\,f(x))"}</M> and a drift <M>{"(x, v) \\mapsto (x + c\\,v, v)"}</M> have triangular
          Jacobians with ones on the diagonal, so determinant 1, and a composition of area-preserving maps preserves area. For the
          oscillator, the step is the linear map with matrix{" "}
          <M>{"\\begin{pmatrix}1 - dt^2/2 & dt\\\\ -dt(1 - dt^2/4) & 1 - dt^2/2\\end{pmatrix}"}</M>, and substituting it into the
          modified energy and expanding shows that the quadratic form is unchanged; the computation is a two-line check.
        </p>
      </Proof>

      <Example title="learned simulators">
        <p>
          Machine-learned interatomic potentials combine the pieces of this chapter: an SE(3)-invariant energy from an equivariant
          network over atoms, forces by differentiation, and a symplectic integrator, which lets simulations reach time scales
          that quantum chemistry cannot. The same ideas carry over to other physical systems: graph network simulators for fluids
          and granular materials pass messages between particles using relative positions, and weather models such as GraphCast
          work on a mesh over the sphere, whose symmetry group is the rotation group again.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dim",
      rung: "check",
      prompt: (
        <p>
          An equivariant network gives each atom one feature of every degree <M>{"\\ell = 0, 1, 2, 3"}</M>. How many numbers is that
          per atom?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
    {
      key: "euler",
      rung: "check",
      prompt: (
        <p>
          Explicit Euler with dt = 0.1 runs for 10 steps on the oscillator <M>{"\\ddot x = -x"}</M>. By what factor has the energy
          grown? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.1046, tolerance: 0.0001 },
    },
    {
      key: "drift",
      rung: "apply",
      prompt: <p>Why can a simulation driven by directly predicted equivariant forces gain energy without bound, even when each prediction is accurate?</p>,
      answer: {
        kind: "choice",
        options: [
          "Equivariance does not make a force field the gradient of an energy, so it can do net work around closed loops, and small errors accumulate as steady heating",
          "Because equivariant forces always point away from the centre of mass",
          "Because directly predicted forces break translation invariance",
          "Because any integrator gains energy when the forces come from a network",
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

def pair_energy(X):
    i, j = np.triu_indices(len(X), 1)
    r = np.linalg.norm(X[i] - X[j], axis=1)
    return float(np.sum((r - 1.0) ** 2))                       # invariant: depends on distances only

def forces(X):
    diff = X[:, None, :] - X[None, :, :]
    r = np.linalg.norm(diff, axis=-1); np.fill_diagonal(r, 1.0)
    return -np.sum((2 * (r - 1.0) / r)[:, :, None] * diff, axis=1)   # F_i = -dE/dx_i

def net_force_torque(X, F):
    return F.sum(0), np.cross(X, F).sum(0)                     # both vanish for an invariant energy

X = np.array([[0.0, 0, 0], [3, 0, 0]]); F = forces(X)
print(pair_energy(X), F[0, 0], F[1, 0], [a.tolist() for a in net_force_torque(X, F)], round(pair_energy(X + [5, -2, 1]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 4.0 -4.0 [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] 4.0",
          "4.0 -4.0 4.0 [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] 4.0",
          "2.0 4.0 -4.0 [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] 2.0",
          "4.0 4.0 -4.0 [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] 28.0",
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

def euler_step(x, v, force, dt):
    return x + dt * v, v + dt * force(x)

def verlet_step(x, v, force, dt):
    vh = v + dt / 2 * force(x)                                 # half kick, drift, half kick
    xn = x + dt * vh
    return xn, vh + dt / 2 * force(xn)

def osc_energy(x, v):
    return 0.5 * (x ** 2 + v ** 2)                             # for force(x) = -x

x, v = euler_step(*euler_step(1.0, 0.0, lambda y: -y, 0.5), lambda y: -y, 0.5)
print(x, v, osc_energy(x, v), round(osc_energy(*verlet_step(1.0, 0.0, lambda y: -y, 0.5)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 -1.0 0.78125 0.4927",
          "0.75 -1.0 0.78125 0.5",
          "1.0 -0.5 0.625 0.4927",
          "0.75 -0.5 0.40625 0.4927",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For the energy <M>{"E = \\sum_{i<j} (|x_i - x_j| - 1)^2"}</M>, write <C>pair_energy(X)</C>, <C>forces(X)</C> returning{" "}
          <M>{"-\\partial E/\\partial x_i"}</M> for every atom, and <C>net_force_torque(X, F)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pair_energy(X):
    return float(np.sum(X ** 2))

def forces(X):
    return -2 * X

def net_force_torque(X, F):
    return np.zeros(3), np.zeros(3)
`,
        solution: FORCES,
        tests: [
          { name: "energy", code: `X = np.array([[0.0, 0, 0], [2, 0, 0], [0, 0, 2]])\nassert abs(pair_energy(X) - (2 + (np.sqrt(8) - 1) ** 2)) < 1e-12 and abs(pair_energy(X + 3.0) - pair_energy(X)) < 1e-12` },
          { name: "forces", code: `X = np.random.default_rng(2).normal(size=(5, 3)); F = forces(X); e = np.zeros_like(X); e[1, 2] = 1e-6\nE0 = np.sum([(np.linalg.norm(X[i] - X[j]) - 1) ** 2 for i in range(5) for j in range(i + 1, 5)])\nE1 = np.sum([(np.linalg.norm((X + e)[i] - (X + e)[j]) - 1) ** 2 for i in range(5) for j in range(i + 1, 5)])\nassert abs(-(E1 - E0) / 1e-6 - F[1, 2]) < 1e-4\nf, t = net_force_torque(X, F + [1.0, 0, 0]); assert np.allclose(f, [5, 0, 0]) and np.allclose(t, np.cross(X.sum(0), [1.0, 0, 0]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>euler_step(x, v, force, dt)</C>, <C>verlet_step(x, v, force, dt)</C> (half kick, drift, half kick) and{" "}
          <C>osc_energy(x, v)</C> for the oscillator with force −x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def euler_step(x, v, force, dt):
    return x, v

def verlet_step(x, v, force, dt):
    return x, v

def osc_energy(x, v):
    return 0.0
`,
        solution: STEPS,
        tests: [
          { name: "euler", code: `x, v = euler_step(1.0, 2.0, lambda y: -y, 0.1)\nassert abs(x - 1.2) < 1e-12 and abs(v - 1.9) < 1e-12 and abs(osc_energy(3.0, 4.0) - 12.5) < 1e-12` },
          { name: "verlet", code: `x, v, E = 1.0, 0.0, []\nfor _ in range(2000):\n    x, v = verlet_step(x, v, lambda y: -y, 0.2); E.append(0.5 * (x * x + v * v))\nassert max(E) <= 0.5 + 1e-9 and min(E) > 0.49\nx1, v1 = verlet_step(1.0, 0.0, lambda y: -y, 0.2)\nassert abs(x1 - 0.98) < 1e-12 and abs(v1 + 0.198) < 1e-12` },
        ],
      },
    },
    {
      key: "force3",
      rung: "stretch",
      prompt: (
        <p>
          With <M>{"E = \\sum_{i<j}(|x_i - x_j| - 1)^2"}</M>, atoms sit at (0, 0, 0), (3, 0, 0) and (0, 4, 0). What is the
          magnitude of the force on the atom at the origin? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 7.211, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        This closes the course. Symmetry entered as a group acting on inputs, became representations and Fourier analysis,
        produced convolutions, graph networks and transformers as the equivariant layers for grids, graphs and sets, extended to
        curved spaces and statistical models through metrics, and ended in molecules and physical simulation, where the
        symmetries of nature also bring conservation laws.
      </p>
    </>
  ),
};
