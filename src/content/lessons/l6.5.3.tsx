import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DeadlyTriadViz } from "@/components/viz/DeadlyTriadViz";
import type { LessonContent } from "@/lib/types";

const EXPECTED = `def td_update(w, x, x2, r, gamma, alpha):
    v = sum(a * b for a, b in zip(w, x))
    v2 = 0.0 if x2 is None else sum(a * b for a, b in zip(w, x2))
    delta = r + gamma * v2 - v
    return [wi + alpha * delta * xi for wi, xi in zip(w, x)]

def td_matrix(phi, d, P, gamma):
    n, k = len(phi), len(phi[0])
    A = [[0.0] * k for _ in range(k)]
    for s in range(n):
        nxt = [sum(P[s][t] * phi[t][j] for t in range(n)) for j in range(k)]
        for i in range(k):
            for j in range(k):
                A[i][j] += d[s] * phi[s][i] * (phi[s][j] - gamma * nxt[j])
    return A

def expected_step(w, A, b, alpha):
    return [wi + alpha * (bi - sum(a * x for a, x in zip(row, w))) for wi, bi, row in zip(w, b, A)]`;

const GTD = `def growth(x1, x2, gamma, alpha):
    return 1 + alpha * x1 * (gamma * x2 - x1)

def stable(A):
    tr = A[0][0] + A[1][1]
    det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
    return tr > 0 and det > 0

def tdc_step(w, h, x, x2, r, gamma, alpha, beta, rho=1.0):
    dot = lambda u, v: sum(a * b for a, b in zip(u, v))
    delta = r + gamma * dot(w, x2) - dot(w, x)
    xh = dot(x, h)
    w = [wi + alpha * rho * (delta * xi - gamma * x2i * xh) for wi, xi, x2i in zip(w, x, x2)]
    h = [hi + beta * rho * (delta - xh) * xi for hi, xi in zip(h, x)]
    return w, h`;

export const lesson: LessonContent = {
  id: "l6.5.3",
  minutes: 55,
  links: {
    requires: ["l6.5.1", "l6.5.2"],
    revisits: ["m3.7.1", "m13.1.3"],
    foreshadows: ["l6.6.5", "l6.7.3"],
  },

  puzzle: (
    <>
      <p>
        Two states share one weight w, with features 1 and 2, so their estimated values are w and 2w. The first state leads to
        the second, the second ends the episode, and every reward is 0, so w = 0 represents the true values exactly. Yet
        semi-gradient TD(0) that updates only the first transition sends w to infinity whenever γ is above one half. Nothing
        about the problem is hard. What goes wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Raising w to fix the first state&apos;s value also raises the second state&apos;s value, which is the target, and raises it twice as
        much. If the second state is never updated, nothing pulls it back down, and each update raises the target faster than
        the estimate catches up. Updating the second state too, as happens when learning from the policy&apos;s own visits, supplies
        that pull. Three ingredients are needed for this runaway: generalisation between states, targets built from the
        current estimates, and a distribution of updates that is not the one the policy produces.
      </p>
      <DeadlyTriadViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the deadly triad">
        <p>
          (Sutton and Barto.) The combination of <em>function approximation</em>, <em>bootstrapping</em> and <em>off-policy training</em>{" "}
          can make value learning diverge. With any two of the three, the standard methods are stable: tabular methods with
          bootstrapping off-policy (Q-learning), on-policy TD with linear features, and Monte Carlo with any features.
        </p>
      </Definition>

      <Definition title="the expected update">
        <p>
          Let Φ be the matrix whose rows are the feature vectors <M>{"x(s)^\\top"}</M>, P the transition matrix of the target policy,
          r the expected rewards and <M>{"D = \\mathrm{diag}(d)"}</M> the distribution of the states that are updated. Averaging the
          linear semi-gradient TD(0) update (<C>td_update</C>, with <C>x2 = None</C> at the end of an episode) over d gives
        </p>
        <MD>{"w \\leftarrow w + \\alpha(b - Aw), \\qquad A = \\Phi^\\top D(I - \\gamma P)\\Phi, \\qquad b = \\Phi^\\top D r,"}</MD>
        <p>
          computed by <C>td_matrix</C> and <C>expected_step</C>. In l6.5.1 d was the on-policy distribution; here it can be any.
        </p>
        <Code>{EXPECTED}</Code>
      </Definition>

      <Theorem title="when a linear iteration converges">
        <p>
          The iteration <M>{"w \\leftarrow w + \\alpha(b - Aw)"}</M> converges from every start for all small enough α &gt; 0 if and only if
          every eigenvalue of A has positive real part. It then converges to <M>{"A^{-1}b"}</M>. If some eigenvalue has negative real
          part, it diverges from almost every start for every α &gt; 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"w^* = A^{-1}b"}</M> when A is invertible. The error <M>{"e = w - w^*"}</M> obeys <M>{"e \\leftarrow (I - \\alpha A)e"}</M>, which
          shrinks to zero for every start exactly when every eigenvalue <M>{"1 - \\alpha\\lambda"}</M> of <M>{"I - \\alpha A"}</M> has modulus
          below 1 (m3.7.1). Now <M>{"|1 - \\alpha\\lambda|^2 = 1 - 2\\alpha\\,\\mathrm{Re}\\,\\lambda + \\alpha^2|\\lambda|^2"}</M>, which is below 1
          exactly when <M>{"0 < \\alpha < 2\\,\\mathrm{Re}\\,\\lambda/|\\lambda|^2"}</M>. If <M>{"\\mathrm{Re}\\,\\lambda > 0"}</M> for all λ this holds for
          small α; if <M>{"\\mathrm{Re}\\,\\lambda < 0"}</M> for some λ it fails for every α &gt; 0, and the component of e along that
          eigenvector grows geometrically. For a real 2 × 2 matrix, both eigenvalues have positive real part exactly when the
          trace and the determinant are positive (<C>stable</C>).
        </p>
      </Proof>

      <Theorem title="on-policy linear TD is stable">
        <p>
          (Tsitsiklis and Van Roy, 1997.) If <M>{"d^\\top P \\le d^\\top"}</M> entrywise, as for the state distribution generated by
          following the policy, d &gt; 0 and Φ has independent columns, then A is positive definite:{" "}
          <M>{"u^\\top Au > 0"}</M> for every u ≠ 0. Hence every eigenvalue of A has positive real part and expected TD converges.
        </p>
      </Theorem>
      <Proof>
        <p>
          Put <M>{"v = \\Phi u \\ne 0"}</M> and <M>{"\\|v\\|_D^2 = \\sum_sd_sv_s^2"}</M>. By the Cauchy–Schwarz inequality, with the rows of P
          summing to at most 1, <M>{"(Pv)_s^2 \\le \\sum_tP_{st}v_t^2"}</M>, so{" "}
          <M>{"\\|Pv\\|_D^2 \\le \\sum_t(d^\\top P)_tv_t^2 \\le \\|v\\|_D^2"}</M>. Then{" "}
          <M>{"u^\\top Au = v^\\top Dv - \\gamma v^\\top DPv \\ge \\|v\\|_D^2 - \\gamma\\|v\\|_D\\|Pv\\|_D \\ge (1 - \\gamma)\\|v\\|_D^2 > 0"}</M>. For an
          eigenvalue λ with complex eigenvector z = x + iy, <M>{"\\mathrm{Re}(\\bar z^\\top Az) = x^\\top Ax + y^\\top Ay > 0"}</M>, and this equals{" "}
          <M>{"\\mathrm{Re}\\,\\lambda\\,|z|^2"}</M>. The proof uses <M>{"d^\\top P \\le d^\\top"}</M> in exactly one place, which is where
          an off-policy d can break it.
        </p>
      </Proof>

      <Example title="the two states">
        <p>
          With features 1 and 2, the transition from the first state to the second, and weights <M>{"d = (1 - f, f)"}</M> on the two
          states, A is the single number <M>{"(1 - f)(1 - 2\\gamma) + 4f"}</M>. Updating only the first state (f = 0) gives{" "}
          <M>{"A = 1 - 2\\gamma"}</M>, negative for γ &gt; 1/2, and each update multiplies w by <M>{"1 + \\alpha(2\\gamma - 1)"}</M>{" "}
          (<C>growth</C>). The on-policy distribution visits both states once per episode, f = 1/2, and A ={" "}
          <M>{"(5 - 2\\gamma)/2 > 0"}</M>. Baird&apos;s counterexample (1995) shows the same failure with seven states, features rich enough
          to represent the true values exactly, and expected rather than sampled updates.
        </p>
      </Example>

      <Remark title="removing one leg">
        <p>
          Each leg can be removed at a price. Monte Carlo targets remove bootstrapping, so the update is a true gradient of a
          convex objective (l6.5.1), at the cost of high variance; n-step and λ-returns move part of the way. Tabular features
          remove generalisation, at the cost of scale. On-policy learning removes the mismatch, at the cost of discarding replay
          and old data. A smaller step size does not help: a negative eigenvalue diverges at every α.
        </p>
      </Remark>

      <Definition title="gradient TD">
        <p>
          (Sutton et al., 2009.) Gradient-TD methods do true stochastic gradient descent on the <em>projected Bellman error</em>{" "}
          <M>{"(b - Aw)^\\top C^{-1}(b - Aw)"}</M> with <M>{"C = \\mathbb{E}[xx^\\top]"}</M>, whose minimum is the TD fixed point. The gradient
          involves a product of two expectations, so a second weight vector h learns <M>{"C^{-1}(b - Aw)"}</M> on a faster time scale.
          TDC (<C>tdc_step</C>) updates
        </p>
        <MD>{"w \\leftarrow w + \\alpha\\rho\\bigl(\\delta x - \\gamma x'(x^\\top h)\\bigr), \\qquad h \\leftarrow h + \\beta\\rho(\\delta - x^\\top h)x,"}</MD>
        <p>
          where ρ = π(a | s)/μ(a | s) is the importance ratio that corrects for the behaviour policy μ (m13.1.3). The correction
          term <M>{"-\\gamma x'(x^\\top h)"}</M> is what TD leaves out; with it the method converges off-policy with linear features.
        </p>
        <Code>{GTD}</Code>
      </Definition>

      <Remark title="in deep reinforcement learning">
        <p>
          DQN (l6.5.2) has all three legs. Studies of deep Q-learning (van Hasselt et al., 2018) found that values that grow
          without bound are rare in practice, while temporary blow-ups of the estimates are common; target networks, multi-step
          returns and double Q-learning all reduce them. Policy-gradient methods (l6.6.5) and trust-region methods (l6.7.3) keep
          bootstrapping in the critic but stay close to on-policy data, which is one reason for their stability.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "grow",
      rung: "check",
      prompt: (
        <p>
          In the two-state example, w = 1, α = 0.1 and γ = 0.9. What is w after one semi-gradient TD(0) update on the first
          transition?
        </p>
      ),
      answer: { kind: "numeric", value: 1.08, tolerance: 0.0001 },
    },
    {
      key: "a",
      rung: "check",
      prompt: (
        <p>
          In the two-state example with γ = 0.9, both states are updated equally often, d = (0.5, 0.5). What is the number A?
        </p>
      ),
      answer: { kind: "numeric", value: 1.6, tolerance: 0.0001 },
    },
    {
      key: "fix",
      rung: "apply",
      prompt: (
        <p>
          An agent learns values by semi-gradient TD(0) with linear features from a replay buffer filled by an older policy. Which
          change guarantees that the expected update cannot diverge?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Replace the TD targets by Monte Carlo returns, so the update is a true gradient of a convex objective",
          "Use a smaller step size",
          "Add more features, so the true values can be represented exactly",
          "Raise the discount factor",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def td_update(w, x, x2, r, gamma, alpha):
    v = sum(a * b for a, b in zip(w, x))
    v2 = 0.0 if x2 is None else sum(a * b for a, b in zip(w, x2))
    delta = r + gamma * v2 - v
    return [wi + alpha * delta * xi for wi, xi in zip(w, x)]

def td_matrix(phi, d, P, gamma):
    n, k = len(phi), len(phi[0])
    A = [[0.0] * k for _ in range(k)]
    for s in range(n):
        nxt = [sum(P[s][t] * phi[t][j] for t in range(n)) for j in range(k)]
        for i in range(k):
            for j in range(k):
                A[i][j] += d[s] * phi[s][i] * (phi[s][j] - gamma * nxt[j])
    return A

def expected_step(w, A, b, alpha):
    return [wi + alpha * (bi - sum(a * x for a, x in zip(row, w))) for wi, bi, row in zip(w, b, A)]

w = [1.0]
for _ in range(3): w = td_update(w, [1.0], [2.0], 0.0, 1.0, 0.5)
P = [[0, 1], [0, 0]]; print(w, td_update([1.0], [2.0], None, 0.0, 1.0, 0.5), td_matrix([[1.0], [2.0]], [1, 0], P, 1.0), td_matrix([[1.0], [2.0]], [0.5, 0.5], P, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.375] [-1.0] [[-1.0]] [[1.5]]",
          "[2.5] [-1.0] [[-1.0]] [[1.5]]",
          "[3.375] [0.0] [[-1.0]] [[1.5]]",
          "[3.375] [-1.0] [[1.0]] [[2.5]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def growth(x1, x2, gamma, alpha):
    return 1 + alpha * x1 * (gamma * x2 - x1)

def stable(A):
    tr = A[0][0] + A[1][1]
    det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
    return tr > 0 and det > 0

def tdc_step(w, h, x, x2, r, gamma, alpha, beta, rho=1.0):
    dot = lambda u, v: sum(a * b for a, b in zip(u, v))
    delta = r + gamma * dot(w, x2) - dot(w, x)
    xh = dot(x, h)
    w = [wi + alpha * rho * (delta * xi - gamma * x2i * xh) for wi, xi, x2i in zip(w, x, x2)]
    h = [hi + beta * rho * (delta - xh) * xi for hi, xi in zip(h, x)]
    return w, h

w, h = [1.0], [0.0]
for _ in range(2): w, h = tdc_step(w, h, [1.0], [2.0], 0.0, 1.0, 0.5, 0.5); print(w, h)
print(growth(1, 2, 1.0, 0.5), growth(2, 0, 1.0, 0.25), stable([[1, 2], [-3, 1]]), stable([[1, 0], [0, -1]]), stable([[-1, 0], [0, -1]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5] [0.5]\n[1.75] [1.0]\n1.5 0.0 True False False",
          "[1.5] [0.5]\n[2.25] [1.0]\n1.5 0.0 True False False",
          "[1.5] [0.5]\n[1.75] [1.0]\n1.5 0.0 True False True",
          "[1.5] [0.5]\n[1.75] [1.0]\n1.5 1.0 True True False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>td_update(w, x, x2, r, gamma, alpha)</C>, one linear semi-gradient TD(0) update in which <C>x2 = None</C> means the
          episode ended; <C>td_matrix(phi, d, P, gamma)</C>, returning A as a list of rows; and <C>expected_step(w, A, b, alpha)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def td_update(w, x, x2, r, gamma, alpha):
    return w

def td_matrix(phi, d, P, gamma):
    return []

def expected_step(w, A, b, alpha):
    return w
`,
        solution: EXPECTED,
        tests: [
          { name: "updates", code: `assert td_update([1.0], [1.0], [2.0], 0.0, 1.0, 0.5) == [1.5] and td_update([1.0], [2.0], None, 0.0, 1.0, 0.5) == [-1.0]
assert td_update([1.0, 2.0], [1.0, 0.0], [0.0, 1.0], 1.0, 0.5, 0.5) == [1.5, 2.0]
assert expected_step([1.0], [[-1.0]], [0.0], 0.5) == [1.5] and expected_step([1.0, 1.0], [[2.0, 0.0], [0.0, 1.0]], [1.0, 1.0], 0.5) == [0.5, 1.0]` },
          { name: "matrix", code: `close = lambda X, Y: len(X) == len(Y) and all(len(a) == len(b) and all(abs(u - v) < 1e-9 for u, v in zip(a, b)) for a, b in zip(X, Y))
P = [[0, 1], [0, 0]]
assert close(td_matrix([[1.0], [2.0]], [1, 0], P, 1.0), [[-1.0]]) and close(td_matrix([[1.0], [2.0]], [0.5, 0.5], P, 0.9), [[1.6]])
assert close(td_matrix([[1.0, 0.0], [0.0, 1.0]], [0.5, 0.5], P, 1.0), [[0.5, -0.5], [0.0, 0.5]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>growth(x1, x2, gamma, alpha)</C>, the factor by which one update of the first transition multiplies w when the
          features are x1 and x2; <C>stable(A)</C> for a 2 × 2 matrix, true when both eigenvalues have positive real part; and{" "}
          <C>tdc_step(w, h, x, x2, r, gamma, alpha, beta, rho=1.0)</C>, returning the new <C>(w, h)</C> and using the old h in the
          update of w.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def growth(x1, x2, gamma, alpha):
    return 1.0

def stable(A):
    return False

def tdc_step(w, h, x, x2, r, gamma, alpha, beta, rho=1.0):
    return w, h
`,
        solution: GTD,
        tests: [
          { name: "stability", code: `assert growth(1, 2, 1.0, 0.5) == 1.5 and abs(growth(1, 2, 0.9, 0.1) - 1.08) < 1e-12 and growth(2, 0, 1.0, 0.25) == 0
assert stable([[1, 2], [-3, 1]]) and stable([[1, -5], [5, 1]]) and not stable([[1, 0], [0, -1]]) and not stable([[-1, 0], [0, -1]]) and not stable([[0, 1], [-1, 0]])` },
          { name: "tdc", code: `w, h = [1.0], [0.0]
for _ in range(2): w, h = tdc_step(w, h, [1.0], [2.0], 0.0, 1.0, 0.5, 0.5)
assert abs(w[0] - 1.75) < 1e-12 and abs(h[0] - 1.0) < 1e-12
w2, h2 = tdc_step([1.0, 0.0], [0.5, 0.0], [1.0, 0.0], [0.0, 1.0], 2.0, 0.5, 0.5, 0.5, 2.0)
assert all(abs(a - b) < 1e-12 for a, b in zip(w2 + h2, [2.0, -0.25, 1.0, 0.0])) and tdc_step([3.0], [1.0], [1.0], [1.0], 5.0, 0.9, 0.5, 0.5, 0.0) == ([3.0], [1.0])` },
        ],
      },
    },
    {
      key: "share",
      rung: "stretch",
      prompt: (
        <p>
          In the two-state example with γ = 0.95, the second state receives the fraction f of the updates and the first the
          rest. Below what value of f does the expected update diverge? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1837, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Value-based methods learn a value function and act greedily on it, and the deadly triad is one of their weak points.
        The next part turns the problem around: parametrise the policy itself and follow the gradient of its expected return,
        starting with the policy gradient theorem (l6.6.1).
      </p>
    </>
  ),
};
