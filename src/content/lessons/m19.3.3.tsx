import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FokkerPlanckViz } from "@/components/viz/FokkerPlanckViz";
import type { LessonContent } from "@/lib/types";

const GEN = `def generator(f1, f2, b, D, x):
    return b(x) * f1(x) + D * f2(x)                    # L f = b f' + (sigma^2 / 2) f'', with D = sigma^2 / 2

def stationary_flux(p, dp, b, D):
    return b * p - D * dp                              # probability current; zero everywhere for a stationary density

def langevin_drift(dlogp, D):
    return D * dlogp                                   # the drift that makes p stationary at noise level D`;

const FD = `import numpy as np

def fp_rhs(p, dx, b, D):
    flux = b * p - D * np.gradient(p, dx)              # drift carries mass along, diffusion spreads it
    return -np.gradient(flux, dx)                      # dp/dt = -d(flux)/dx

def fp_evolve(p, dx, b, D, dt, steps):
    for _ in range(steps):
        p = p + dt * fp_rhs(p, dx, b, D)
    return p

def mass(p, dx):
    return float(np.sum(p) * dx)`;

export const lesson: LessonContent = {
  id: "m19.3.3",
  minutes: 55,
  links: {
    requires: ["m19.3.2", "m19.2.3"],
    revisits: ["m13.3.2", "m13.4.4"],
    foreshadows: ["m19.4.1"],
  },

  puzzle: (
    <>
      <p>
        An SDE describes one random path at a time. A diffusion model cares about something else: how the whole distribution of
        images changes as noise is added, and how to undo that change. Simulating millions of paths and drawing histograms answers
        this only approximately. Is there an equation for the density itself, and can it tell, without simulation, which densities a
        given drift and noise level leave unchanged?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Probability is conserved, so the density can change only by flowing. The drift carries mass along at velocity b, a current{" "}
        <M>{"b\\,p"}</M>; the noise spreads mass from crowded places to empty ones, a current <M>{"-D\\,p'"}</M> with{" "}
        <M>{"D = \\sigma^2/2"}</M>, like heat. The density at a point rises when more current flows in than out. A density is
        stationary when the two currents cancel, and that happens for <M>{"p \\propto e^{\\int b/D}"}</M>: the drift must point up the
        gradient of <M>{"\\log p"}</M>, scaled by D. This is why Langevin dynamics with drift <M>{"\\nabla \\log p"}</M> samples from p.
      </p>
      <FokkerPlanckViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the generator">
        <p>
          For <M>{"dX = b(X)\\, dt + \\sigma(X)\\, dB"}</M>, Itô&apos;s formula gives, for smooth bounded f with bounded derivatives,{" "}
          <M>{"\\frac{d}{dt}\\mathbb{E}f(X_t) = \\mathbb{E}[\\mathcal{L}f(X_t)]"}</M> with the generator
        </p>
        <MD>{"\\mathcal{L}f = b f' + \\tfrac12 \\sigma^2 f''"}</MD>
        <p>
          (<C>generator</C>), since the dB term has mean zero. <C>stationary_flux</C> is the probability current{" "}
          <M>{"b p - D p'"}</M> at a point, with constant <M>{"D = \\sigma^2/2"}</M>, and <C>langevin_drift</C> the drift{" "}
          <M>{"D(\\log p)'"}</M> that makes p stationary.
        </p>
        <Code>{GEN}</Code>
      </Definition>

      <Theorem title="the Fokker–Planck equation">
        <p>If <M>{"X_t"}</M> has a smooth density <M>{"p(t, x)"}</M> decaying fast at infinity, then</p>
        <MD>{"\\partial_t p = -\\partial_x (b\\, p) + \\tfrac12 \\partial_x^2(\\sigma^2 p)."}</MD>
      </Theorem>
      <Proof>
        <p>
          For any smooth f with compact support,{" "}
          <M>{"\\frac{d}{dt}\\int f p\\, dx = \\frac{d}{dt}\\mathbb{E}f(X_t) = \\int (b f' + \\tfrac12\\sigma^2 f'') p\\, dx"}</M>.
          Integrate by parts, once for the first term and twice for the second; the boundary terms vanish because f has compact
          support: <M>{"\\int f\\, \\partial_t p\\, dx = \\int f\\left(-\\partial_x(b p) + \\tfrac12\\partial_x^2(\\sigma^2 p)\\right) dx"}</M>
          . This holds for every such f, so the integrands agree. In d dimensions the same argument gives{" "}
          <M>{"\\partial_t p = -\\nabla \\cdot (b p) + \\tfrac12 \\sum_{ij} \\partial_i \\partial_j ((\\sigma\\sigma^\\top)_{ij} p)"}</M>.
        </p>
      </Proof>

      <Theorem title="stationary densities">
        <p>
          In one dimension with constant <M>{"D = \\sigma^2/2"}</M>, a density p with <M>{"p > 0"}</M> is stationary with zero current
          exactly when <M>{"b = D(\\log p)'"}</M>. In particular, Langevin dynamics{" "}
          <M>{"dX = \\nabla \\log \\pi(X)\\, dt + \\sqrt2\\, dB"}</M> leaves π invariant in any dimension.
        </p>
      </Theorem>
      <Proof>
        <p>
          The equation is <M>{"\\partial_t p = -\\partial_x J"}</M> with current <M>{"J = b p - D p'"}</M>. If{" "}
          <M>{"b = D p'/p"}</M>, then J = 0 and p does not change. Conversely, zero current means <M>{"b p = D p'"}</M>, that is{" "}
          <M>{"b = D(\\log p)'"}</M>. For Langevin dynamics D = 1 and <M>{"b = \\nabla \\log \\pi"}</M>, so the current{" "}
          <M>{"\\pi \\nabla \\log \\pi - \\nabla \\pi"}</M> vanishes identically. Zero current is the continuous form of detailed
          balance (m13.3.2): no net flow between any two regions.
        </p>
      </Proof>

      <Definition title="solving the equation numerically">
        <p>
          <C>fp_rhs</C> evaluates the right side on a grid with spacing dx by central differences, for a drift given on the grid and
          constant D. <C>fp_evolve</C> takes explicit Euler steps, which are stable when <M>{"D\\,dt/dx^2"}</M> is below about 1/2, and{" "}
          <C>mass</C> checks that total probability is conserved.
        </p>
        <Code>{FD}</Code>
      </Definition>

      <Example title="the OU process again">
        <p>
          For <M>{"dX = -\\theta X\\, dt + \\sigma\\, dB"}</M>, the stationary condition{" "}
          <M>{"-\\theta x = \\tfrac12\\sigma^2(\\log p)'"}</M> gives <M>{"\\log p = -\\theta x^2/\\sigma^2 + c"}</M>, the Gaussian with
          variance <M>{"\\sigma^2/(2\\theta)"}</M> found in the previous lesson by solving the SDE. For the double well in the
          visualisation, <M>{"b = -U'"}</M> and D = 1/2 give <M>{"p \\propto e^{-2U}"}</M>. The approach to that law is slow because
          mass must cross the barrier, at a rate that falls exponentially with the barrier height divided by D.
        </p>
      </Example>

      <Remark title="why diffusion models need this">
        <p>
          The forward process of a diffusion model changes the data density into noise according to its Fokker–Planck equation. The
          reverse-time SDE of the next chapter is built so that its Fokker–Planck equation runs the same family of densities backwards,
          and the probability flow ODE of Chapter 5 is the deterministic process whose continuity equation, a Fokker–Planck equation
          with no diffusion term, produces the same densities.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          For <M>{"dX = -X^3\\, dt + dB"}</M>, what is the ratio <M>{"p(1)/p(0)"}</M> of the stationary density? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.607, tolerance: 0.0006 },
    },
    {
      key: "gen",
      rung: "check",
      prompt: (
        <p>
          For <M>{"dX = -2X\\, dt + dB"}</M> and <M>{"f(x) = x^2"}</M>, what is <M>{"\\mathcal{L}f(1.5)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -8, tolerance: 0.0005 },
    },
    {
      key: "flux",
      rung: "apply",
      prompt: <p>Why does Langevin dynamics with drift <M>{"\\nabla \\log \\pi"}</M> and noise <M>{"\\sqrt 2\\, dB"}</M> leave π unchanged?</p>,
      answer: {
        kind: "choice",
        options: [
          "Under π the drift current π∇log π equals the diffusion current ∇π, so the net current is zero everywhere",
          "The noise averages to zero, so the density cannot change",
          "The drift is zero at the modes of π",
          "Any drift leaves π unchanged once the noise is large enough",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def generator(f1, f2, b, D, x):
    return b(x) * f1(x) + D * f2(x)                    # L f = b f' + (sigma^2 / 2) f'', with D = sigma^2 / 2

def stationary_flux(p, dp, b, D):
    return b * p - D * dp                              # probability current; zero everywhere for a stationary density

def langevin_drift(dlogp, D):
    return D * dlogp                                   # the drift that makes p stationary at noise level D

f1, f2, b = lambda x: 2 * x, lambda x: 2.0, lambda x: -x
print(generator(f1, f2, b, 0.5, 3.0), stationary_flux(0.2, -0.4, -1.0, 0.5), langevin_drift(-3.0, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["-17.0 0.0 -1.5", "-17.0 -0.4 -1.5", "-19.0 0.0 -1.5", "-17.0 0.0 -6.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fp_rhs(p, dx, b, D):
    flux = b * p - D * np.gradient(p, dx)              # drift carries mass along, diffusion spreads it
    return -np.gradient(flux, dx)                      # dp/dt = -d(flux)/dx

def fp_evolve(p, dx, b, D, dt, steps):
    for _ in range(steps):
        p = p + dt * fp_rhs(p, dx, b, D)
    return p

def mass(p, dx):
    return float(np.sum(p) * dx)

x = np.linspace(-5, 5, 201); dx = x[1] - x[0]; p = np.exp(-x ** 2 / 2) / np.sqrt(2 * np.pi)
print(round(mass(p, dx), 4), round(float(np.max(np.abs(fp_rhs(p, dx, -x, 1.0)))), 2), round(float(np.max(np.abs(fp_rhs(p, dx, -x, 0.5)))), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.0 0.2", "1.0 0.2 0.0", "1.0 0.0 0.4", "0.5 0.0 0.2"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>generator(f1, f2, b, D, x)</C>, where f1 and f2 are the first and second derivatives of f,{" "}
          <C>stationary_flux(p, dp, b, D)</C> and <C>langevin_drift(dlogp, D)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def generator(f1, f2, b, D, x):
    return b(x) * f1(x)

def stationary_flux(p, dp, b, D):
    return b * p

def langevin_drift(dlogp, D):
    return dlogp
`,
        solution: GEN,
        tests: [
          { name: "gen", code: `assert generator(lambda x: 1.0, lambda x: x, lambda x: 2.0, 3.0, 2.0) == 8.0 and stationary_flux(2.0, 1.0, 1.5, 3.0) == 0.0` },
          { name: "drift", code: `assert langevin_drift(-4.0, 0.25) == -1.0 and langevin_drift(2.0, 1.0) == 2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fp_rhs(p, dx, b, D)</C> using <C>np.gradient</C> for both derivatives, <C>fp_evolve(p, dx, b, D, dt, steps)</C> and{" "}
          <C>mass(p, dx)</C>, returning a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fp_rhs(p, dx, b, D):
    return D * np.gradient(np.gradient(p, dx), dx)

def fp_evolve(p, dx, b, D, dt, steps):
    return p

def mass(p, dx):
    return float(np.sum(p))
`,
        solution: FD,
        tests: [
          { name: "rhs", code: `p = np.array([0.0, 1.0, 4.0, 9.0, 16.0])\nassert np.allclose(fp_rhs(p, 1.0, np.ones(5), 0.0), -np.gradient(p, 1.0)) and mass(p, 0.5) == 15.0` },
          { name: "evolve", code: `p = np.array([0.0, 1.0, 2.0, 1.0, 0.0])\nq = fp_evolve(p, 1.0, np.zeros(5), 0.5, 0.1, 2)\nr = p + 0.1 * fp_rhs(p, 1.0, np.zeros(5), 0.5)\nassert np.allclose(q, r + 0.1 * fp_rhs(r, 1.0, np.zeros(5), 0.5)) and not np.allclose(q, p)` },
        ],
      },
    },
    {
      key: "well",
      rung: "stretch",
      prompt: (
        <p>
          The density <M>{"p(x) \\propto e^{-(x^2 - 1)^2}"}</M> should be stationary for <M>{"dX = b(X)\\, dt + dB"}</M>. What must{" "}
          <M>{"b(0.5)"}</M> be? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        The forward noising process turns data into noise along a path of densities. The next chapter asks what process runs that path
        backwards, and finds that its drift needs exactly one unknown: the gradient of the log density at every noise level.
      </p>
    </>
  ),
};
