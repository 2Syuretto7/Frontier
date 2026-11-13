import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MixingCurveViz } from "@/components/viz/MixingCurveViz";
import type { LessonContent } from "@/lib/types";

const TV = `import numpy as np

def tv(mu, nu):
    return 0.5 * float(np.abs(np.asarray(mu) - np.asarray(nu)).sum())

def tv_curve(P, pi0, pi, n):
    out, d = [], np.asarray(pi0, dtype=float)
    for _ in range(n + 1):
        out.append(tv(d, pi))
        d = d @ P
    return np.array(out)`;

const SPEC = `import numpy as np

def lazy(P):
    return (np.eye(len(P)) + P) / 2

def slem(P):
    lam = np.sort(np.abs(np.linalg.eigvals(P)))[::-1]
    return float(lam[1])`;

export const lesson: LessonContent = {
  id: "m7.8.3",
  minutes: 65,
  links: {
    requires: ["m7.8.2"],
    revisits: ["m3.7.3", "m3.7.2"],
    foreshadows: ["m7.8.5", "m13.3.3"],
  },

  puzzle: (
    <>
      <p>
        How many riffle shuffles make a deck random? Seven, by a famous analysis, and fewer leave visible order. Every MCMC
        run faces the same question: how many steps before the chain has forgotten its start and its samples look like the
        target? Some chains never forget, and some forget fast. What decides it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A chain that moves in a rigid rhythm, like even, odd, even, odd, keeps remembering its start forever. Remove the
        rhythm and the distribution flows to π. How fast is set by the matrix: the part of the starting distribution
        orthogonal to π is multiplied by the eigenvalues other than 1 at every step, so the second largest one in size sets
        the rate.
      </p>
      <MixingCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="total variation distance">
        <p>For distributions μ and ν on a finite set,</p>
        <MD>{"\\|\\mu - \\nu\\|_{TV} = \\max_A |\\mu(A) - \\nu(A)| = \\tfrac12\\sum_i |\\mu_i - \\nu_i|."}</MD>
        <p>
          It is the largest disagreement about the probability of any event, between 0 and 1. The maximum is attained at
          the set of i where <M>{"\\mu_i > \\nu_i"}</M>.
        </p>
      </Definition>
      <Definition title="period">
        <p>
          The period of state i is <M>{"\\gcd\\{n \\ge 1 : (P^n)_{ii} > 0\\}"}</M>. In an irreducible chain all states share
          the same period, and the chain is aperiodic if it is 1. Any self-loop, <M>{"P_{ii} > 0"}</M>, makes an irreducible
          chain aperiodic.
        </p>
      </Definition>
      <p>
        The walk on an even cycle has period 2: from vertex 0 it is at an even vertex after every even number of steps, so{" "}
        <M>{"\\pi_0P^n"}</M> alternates and never converges, although the uniform π is stationary. The lazy chain{" "}
        <M>{"(I + P)/2"}</M> has the same stationary distribution and is aperiodic.
      </p>

      <Theorem title="convergence theorem">
        <p>
          If a finite chain is irreducible and aperiodic, then for every starting distribution{" "}
          <M>{"\\|\\pi_0P^n - \\pi\\|_{TV} \\to 0"}</M>, and the convergence is geometric: at most{" "}
          <M>{"C\\alpha^n"}</M> for some C and α &lt; 1.
        </p>
      </Theorem>
      <p>
        The general proof uses coupling or Perron–Frobenius theory. The core idea is in the following case, which covers the
        general one since an irreducible aperiodic chain has some power <M>{"P^r"}</M> with all entries positive.
      </p>
      <Theorem title="contraction (Doeblin)">
        <p>
          If every entry of the k × k matrix P is at least ε, then{" "}
          <M>{"\\|\\mu P - \\nu P\\|_{TV} \\le (1 - k\\varepsilon)\\|\\mu - \\nu\\|_{TV}"}</M>, so{" "}
          <M>{"\\|\\pi_0P^n - \\pi\\|_{TV} \\le (1 - k\\varepsilon)^n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let U be the matrix whose every row is the uniform distribution. Since <M>{"P_{ij} \\ge \\varepsilon"}</M>,{" "}
          <M>{"Q = (P - k\\varepsilon U)/(1 - k\\varepsilon)"}</M> is stochastic (if kε = 1, P = U and one step reaches π). With{" "}
          <M>{"x = \\mu - \\nu"}</M>, whose entries sum to 0, <M>{"xU = 0"}</M>, so <M>{"xP = (1 - k\\varepsilon)xQ"}</M>. For any
          stochastic Q, <M>{"\\sum_j |\\sum_i x_iQ_{ij}| \\le \\sum_i |x_i|\\sum_j Q_{ij} = \\sum_i |x_i|"}</M>. Halving gives the
          contraction. Apply it n times with ν = π, using πP = π, and note the starting distance is at most 1.
        </p>
      </Proof>
      <Code>{TV}</Code>

      <Remark title="the spectral view">
        <p>
          If P is diagonalisable with eigenvalues <M>{"1 = \\lambda_1, \\lambda_2, \\dots, \\lambda_k"}</M>, then{" "}
          <M>{"\\pi_0P^n - \\pi"}</M> is a combination of terms <M>{"\\lambda_j^n"}</M> with j ≥ 2, so the distance decays like{" "}
          <M>{"\\lambda_*^n"}</M>, where <M>{"\\lambda_* = \\max_{j \\ge 2}|\\lambda_j|"}</M>. The spectral gap{" "}
          <M>{"1 - \\lambda_*"}</M> measures speed: roughly <M>{"1/(1 - \\lambda_*)"}</M> steps per factor of e. A period-2 chain has
          eigenvalue −1, so <M>{"\\lambda_* = 1"}</M> and no convergence.
        </p>
      </Remark>
      <Example title="the lazy walk on a cycle">
        <p>
          Its eigenvalues are <M>{"\\tfrac12 + \\tfrac12\\cos(2\\pi j/k)"}</M>, so{" "}
          <M>{"1 - \\lambda_* = \\tfrac12(1 - \\cos(2\\pi/k)) \\approx \\pi^2/k^2"}</M>: mixing takes on the order of k² steps,
          as a diffusion needs about k² steps to travel distance k.
        </p>
        <Code>{SPEC}</Code>
      </Example>

      <Definition title="mixing time">
        <p>
          <M>{"t_{mix}(\\varepsilon) = \\min\\{n : \\max_{\\pi_0}\\|\\pi_0P^n - \\pi\\|_{TV} \\le \\varepsilon\\}"}</M>, usually with
          ε = 1/4. In MCMC it guides the burn-in, the steps thrown away before averaging, and the spacing at which samples
          are nearly independent.
        </p>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "tv",
      rung: "check",
      prompt: <p>What is the total variation distance between (0.5, 0.5, 0) and (0, 0.5, 0.5)?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "period",
      rung: "check",
      prompt: <p>What is the period of the simple random walk on a cycle of length 6?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "fix",
      rung: "apply",
      prompt: <p>A chain is irreducible with period 2. Which change makes it converge from every start while keeping the same stationary distribution?</p>,
      answer: {
        kind: "choice",
        options: ["Replace P by (I + P)/2", "Replace P by P²", "Replace P by Pᵀ", "Start from a different state"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def tv(mu, nu):
    return 0.5 * float(np.abs(np.asarray(mu) - np.asarray(nu)).sum())

def tv_curve(P, pi0, pi, n):
    out, d = [], np.asarray(pi0, dtype=float)
    for _ in range(n + 1):
        out.append(tv(d, pi))
        d = d @ P
    return np.array(out)

F = np.array([[0.0, 1.0], [1.0, 0.0]])
print(tv_curve(F, [1, 0], [0.5, 0.5], 3), tv_curve((np.eye(2) + F) / 2, [1, 0], [0.5, 0.5], 3))
print(tv([0.2, 0.8, 0.0], [0.5, 0.25, 0.25]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5 0.5 0.5 0.5] [0.5 0.  0.  0. ]\n0.55",
          "[0.5 0.  0.  0. ] [0.5 0.  0.  0. ]\n0.55",
          "[0.5 0.5 0.5 0.5] [0.5   0.25  0.125 0.062]\n0.55",
          "[0.5 0.5 0.5 0.5] [0.5 0.  0.  0. ]\n1.1",
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

def lazy(P):
    return (np.eye(len(P)) + P) / 2

def slem(P):
    lam = np.sort(np.abs(np.linalg.eigvals(P)))[::-1]
    return float(lam[1])

C = lambda k: (np.roll(np.eye(k), 1, axis=1) + np.roll(np.eye(k), -1, axis=1)) / 2
for k in (6, 12):
    print(k, round(slem(C(k)), 3), round(slem(lazy(C(k))), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6 1.0 0.75\n12 1.0 0.933",
          "6 0.5 0.75\n12 0.866 0.933",
          "6 1.0 0.5\n12 1.0 0.866",
          "6 0.75 0.75\n12 0.933 0.933",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tv(mu, nu)</C>, the total variation distance as a float, and <C>tv_curve(P, pi0, pi, n)</C>, returning the
          array of distances from pi after 0, 1, …, n steps starting from pi0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def tv(mu, nu):
    return 0.0

def tv_curve(P, pi0, pi, n):
    return np.zeros(n + 1)
`,
        solution: TV,
        tests: [
          { name: "tv", code: `assert abs(tv([0.5, 0.5, 0], [0, 0.5, 0.5]) - 0.5) < 1e-12 and tv([1, 0], [1, 0]) == 0.0
assert isinstance(tv(np.array([0.3, 0.7]), np.array([0.6, 0.4])), float) and abs(tv([0.3, 0.7], [0.6, 0.4]) - 0.3) < 1e-12` },
          { name: "curve", code: `P = np.array([[0.9, 0.1], [0.3, 0.7]])
c = tv_curve(P, [1.0, 0.0], [0.75, 0.25], 5)
assert len(c) == 6 and np.allclose(c, 0.25 * 0.6 ** np.arange(6))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lazy(P)</C>, returning (I + P)/2, and <C>slem(P)</C>, the second largest absolute value among the
          eigenvalues of P, as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lazy(P):
    return P

def slem(P):
    return 0.0
`,
        solution: SPEC,
        tests: [
          { name: "lazy", code: `F = np.array([[0.0, 1.0], [1.0, 0.0]])
assert np.allclose(lazy(F), 0.5) and np.allclose(lazy(np.eye(3)), np.eye(3))` },
          { name: "slem", code: `assert abs(slem(np.array([[0.9, 0.1], [0.3, 0.7]])) - 0.6) < 1e-12
assert abs(slem(np.array([[0.0, 1.0], [1.0, 0.0]])) - 1.0) < 1e-12
k = 8
C = (np.roll(np.eye(k), 1, axis=1) + np.roll(np.eye(k), -1, axis=1)) / 2
assert abs(slem(lazy(C)) - (0.5 + 0.5 * np.cos(2 * np.pi / k))) < 1e-9 and isinstance(slem(C), float)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let P be a k × k stochastic matrix with every entry at least ε &gt; 0, where kε &lt; 1. Prove that{" "}
          <M>{"\\|\\mu P - \\nu P\\|_{TV} \\le (1 - k\\varepsilon)\\|\\mu - \\nu\\|_{TV}"}</M> for all distributions μ, ν.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes P = kεU + (1 − kε)Q with U the matrix of uniform rows, and checks Q is stochastic (entries ≥ 0 from P_ij ≥ ε, rows sum to 1).",
          "Notes x = μ − ν has entries summing to 0, so xU = 0 and xP = (1 − kε)xQ.",
          "Shows Σ_j |(xQ)_j| ≤ Σ_i |x_i| using the triangle inequality and row sums of Q, and halves both sides to conclude.",
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: (
        <p>
          A 3-state chain has every transition probability at least 0.2. Use the contraction bound to give an upper bound on
          the total variation distance from π after 10 steps, from any start. Give the answer to seven decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0001049, tolerance: 0.0000002 },
    },
  ],

  teachBack:
    "Explain to a friend what total variation distance measures, why a periodic chain need not converge and how laziness fixes it, how the Doeblin contraction proves geometric convergence, and how the second largest eigenvalue sets the mixing speed.",

  glimpse: (
    <>
      <p>
        Random walks are the simplest chains with a geometry: a walker on the integers or a graph. The next lesson asks the
        classical questions about them, such as the chance of hitting one boundary before another and how long it takes.
      </p>
    </>
  ),
};
