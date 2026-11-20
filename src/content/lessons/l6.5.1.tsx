import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AggregationViz } from "@/components/viz/AggregationViz";
import type { LessonContent } from "@/lib/types";

const GRAD = `def aggregate(s, n_states, n_groups):
    x = [0.0] * n_groups
    x[s * n_groups // n_states] = 1.0
    return x

def mc_update(w, x, G, alpha):
    v = sum(wi * xi for wi, xi in zip(w, x))
    return [wi + alpha * (G - v) * xi for wi, xi in zip(w, x)]

def semi_td_update(w, x, r, x2, alpha, gamma):
    v = sum(wi * xi for wi, xi in zip(w, x))
    v2 = sum(wi * xi for wi, xi in zip(w, x2)) if x2 is not None else 0.0
    return [wi + alpha * (r + gamma * v2 - v) * xi for wi, xi in zip(w, x)]`;

const LSTD = `def solve(A, b):
    n = len(b)
    T = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda i: abs(T[i][c]))
        T[c], T[p] = T[p], T[c]
        for i in range(c + 1, n):
            f = T[i][c] / T[c][c]
            T[i] = [u - f * v for u, v in zip(T[i], T[c])]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (T[i][n] - sum(T[i][j] * x[j] for j in range(i + 1, n))) / T[i][i]
    return x

def lstd(transitions, gamma, k):
    A = [[0.0] * k for _ in range(k)]
    b = [0.0] * k
    for x, r, x2 in transitions:
        d = [xi - gamma * (x2[i] if x2 is not None else 0.0) for i, xi in enumerate(x)]
        for i in range(k):
            b[i] += r * x[i]
            for j in range(k):
                A[i][j] += x[i] * d[j]
    return solve(A, b)

def weighted_error(v_true, w, feats, mu):
    return sum(m * (v - sum(wi * xi for wi, xi in zip(w, f))) ** 2 for v, f, m in zip(v_true, feats, mu))`;

export const lesson: LessonContent = {
  id: "l6.5.1",
  minutes: 60,
  links: {
    requires: ["l6.4.2", "l1.2.4"],
    revisits: ["l6.4.1", "l6.2.4"],
    foreshadows: ["l6.5.2", "l6.5.3"],
  },

  puzzle: (
    <>
      <p>
        A board game has more positions than there are atoms in the universe, and a robot&apos;s joint angles take continuous
        values. A table with one entry per state cannot even be stored, and most states will never be seen twice. The values
        must be represented by a function with far fewer parameters than states, so that learning about one state teaches
        something about similar ones. Which of the learning rules of the previous part survive this change, and what do they
        converge to?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Choose features of a state and let the value be a weighted sum of them, or more generally a parametrised function.
        Learning becomes regression: nudge the parameters to bring the prediction closer to a target. With Monte Carlo targets
        this is ordinary stochastic gradient descent on squared error. With TD targets the target itself depends on the
        parameters, and the update ignores that dependence; it is only a semi-gradient, and its fixed point is a different and
        somewhat worse compromise, but it learns faster and online.
      </p>
      <AggregationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear value functions">
        <p>
          Map each state to a feature vector <M>{"x(s) \\in \\mathbb{R}^k"}</M> and approximate{" "}
          <M>{"\\hat v(s, w) = w^\\top x(s)"}</M>. <em>State aggregation</em> uses one-hot features, one per group of states (
          <C>aggregate</C>); tile coding, polynomial, Fourier and radial basis features are other common choices, and a neural
          network learns its features. The <em>value error</em> under a state distribution μ is
        </p>
        <MD>{"\\overline{VE}(w) = \\sum_s\\mu(s)\\bigl(v_\\pi(s) - \\hat v(s, w)\\bigr)^2,"}</MD>
        <p>with μ usually the on-policy distribution, the fraction of time spent in each state.</p>
      </Definition>

      <Theorem title="gradient Monte Carlo">
        <p>
          The update <M>{"w \\leftarrow w + \\alpha\\bigl(G_t - \\hat v(S_t, w)\\bigr)\\nabla\\hat v(S_t, w)"}</M> (<C>mc_update</C>) is
          stochastic gradient descent on <M>{"\\overline{VE}"}</M>. For linear <M>{"\\hat v"}</M> and step sizes satisfying the Robbins–Monro
          conditions it converges to the minimiser of <M>{"\\overline{VE}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"S_t"}</M> drawn from μ and <M>{"\\mathbb{E}[G_t \\mid S_t] = v_\\pi(S_t)"}</M>, the expected update is{" "}
          <M>{"\\alpha\\sum_s\\mu(s)(v_\\pi(s) - \\hat v(s, w))\\nabla\\hat v(s, w) = -\\tfrac\\alpha2\\nabla\\overline{VE}(w)"}</M>. For linear{" "}
          <M>{"\\hat v"}</M> the objective is a convex quadratic, so stochastic gradient descent (l1.2.4) converges to its minimum.
        </p>
      </Proof>

      <Definition title="semi-gradient TD(0)">
        <p>
          Replace <M>{"G_t"}</M> by the TD target:{" "}
          <M>{"w \\leftarrow w + \\alpha\\bigl(R_{t+1} + \\gamma\\hat v(S_{t+1}, w) - \\hat v(S_t, w)\\bigr)\\nabla\\hat v(S_t, w)"}</M> (
          <C>semi_td_update</C>). The target depends on w, but the update differentiates only the prediction, so it is not the
          gradient of any objective.
        </p>
        <Code>{GRAD}</Code>
      </Definition>

      <Theorem title="the TD fixed point">
        <p>
          For linear features with on-policy sampling, let <M>{"A = \\mathbb{E}[x_t(x_t - \\gamma x_{t+1})^\\top]"}</M> and{" "}
          <M>{"b = \\mathbb{E}[R_{t+1}x_t]"}</M>. The expected semi-gradient TD update is <M>{"\\alpha(b - Aw)"}</M>, and it converges to the{" "}
          <em>TD fixed point</em> <M>{"w_{TD} = A^{-1}b"}</M> (Tsitsiklis and Van Roy, 1997), which satisfies
        </p>
        <MD>{"\\overline{VE}(w_{TD}) \\le \\frac{1}{1 - \\gamma^2}\\min_w\\overline{VE}(w)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The update is <M>{"\\alpha x_t(R_{t+1} + \\gamma x_{t+1}^\\top w - x_t^\\top w) = \\alpha(R_{t+1}x_t - x_t(x_t - \\gamma x_{t+1})^\\top w)"}</M>,
          whose expectation is <M>{"\\alpha(b - Aw)"}</M>. Under the on-policy distribution A is positive definite, so the expected
          iteration contracts towards <M>{"A^{-1}b"}</M>. At that point <M>{"\\hat v"}</M> is the fixed point of the projected Bellman
          operator <M>{"\\Pi T^\\pi"}</M>, where Π is the μ-weighted least-squares projection onto the span of the features. Under μ,{" "}
          <M>{"T^\\pi"}</M> is a γ-contraction in the μ-weighted norm and Π is non-expansive; the bound follows by Pythagoras in that
          norm. With γ near 1 the bound is loose, and the picture shows TD&apos;s compromise visibly worse than Monte Carlo&apos;s.
        </p>
      </Proof>

      <Definition title="least-squares TD">
        <p>
          Instead of stochastic steps, accumulate the sample estimates{" "}
          <M>{"\\hat A = \\sum_tx_t(x_t - \\gamma x_{t+1})^\\top"}</M> and <M>{"\\hat b = \\sum_tR_{t+1}x_t"}</M> and solve{" "}
          <M>{"\\hat A w = \\hat b"}</M> (<C>lstd</C>, using <C>solve</C>). LSTD needs no step size and uses the data efficiently, at a
          cost of <M>{"k^2"}</M> per step. <C>weighted_error</C> computes <M>{"\\overline{VE}"}</M> when the true values are known.
        </p>
        <Code>{LSTD}</Code>
      </Definition>

      <Example title="the two fixed points differ">
        <p>
          With one feature, states A and B with x(A) = 1 and x(B) = 2, and the episode A → B → end with rewards 0 then 1 and γ = 1, both
          true values are 1, which no single weight fits. Least squares on the returns gives{" "}
          <M>{"w = \\sum xG/\\sum x^2 = 3/5"}</M>. The TD fixed point solves <M>{"(1 \\cdot (1 - 2) + 2 \\cdot 2)w = 0 \\cdot 1 + 1 \\cdot 2"}</M>,
          giving w = 2/3.
        </p>
      </Example>

      <Remark title="beyond linear">
        <p>
          With a neural network, <M>{"\\nabla\\hat v"}</M> is computed by backpropagation and the same updates apply; no convergence
          guarantee survives in general. Q-learning with a network is the starting point of DQN (l6.5.2), and combining function
          approximation, bootstrapping and off-policy data is the deadly triad (l6.5.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "td",
      rung: "check",
      prompt: (
        <p>
          Linear TD with w = (0.5, 0.2): a transition from a state with x = (1, 0) to one with x = (0, 1) earns reward 1, with γ = 0.9 and
          α = 0.1. What is the first weight after the semi-gradient TD(0) update?
        </p>
      ),
      answer: { kind: "numeric", value: 0.568, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          The best linear fit has value error 0.01 and γ = 0.9. What upper bound does the TD fixed-point theorem give on the value
          error of the TD solution? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0526, tolerance: 0.00006 },
    },
    {
      key: "semi",
      rung: "apply",
      prompt: <p>Why is the TD update called a semi-gradient?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its target also depends on the weights, but the update differentiates only the prediction, treating the target as a constant",
          "It uses only half of the features",
          "It takes half a gradient step each time",
          "It is the gradient of the value error with half the step size",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def aggregate(s, n_states, n_groups):
    x = [0.0] * n_groups
    x[s * n_groups // n_states] = 1.0
    return x

def mc_update(w, x, G, alpha):
    v = sum(wi * xi for wi, xi in zip(w, x))
    return [wi + alpha * (G - v) * xi for wi, xi in zip(w, x)]

def semi_td_update(w, x, r, x2, alpha, gamma):
    v = sum(wi * xi for wi, xi in zip(w, x))
    v2 = sum(wi * xi for wi, xi in zip(w, x2)) if x2 is not None else 0.0
    return [wi + alpha * (r + gamma * v2 - v) * xi for wi, xi in zip(w, x)]

print(aggregate(0, 10, 2), aggregate(7, 10, 2), aggregate(8, 9, 3), mc_update([0.5, 1.0], [1, 0], 2, 0.5))
print(semi_td_update([0.5, 0.25], [1, 0], 1, [0, 1], 0.5, 1.0), semi_td_update([0.5, 0.25], [0, 1], 3, None, 0.5, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.0] [0.0, 1.0] [0.0, 0.0, 1.0] [1.25, 1.0]\n[0.875, 0.25] [0.5, 1.625]",
          "[1.0, 0.0] [1.0, 0.0] [0.0, 0.0, 1.0] [1.25, 1.0]\n[0.875, 0.25] [0.5, 1.625]",
          "[1.0, 0.0] [0.0, 1.0] [0.0, 0.0, 1.0] [1.25, 1.5]\n[0.875, 0.25] [0.5, 1.625]",
          "[1.0, 0.0] [0.0, 1.0] [0.0, 0.0, 1.0] [1.25, 1.0]\n[0.75, 0.25] [0.5, 1.625]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def solve(A, b):
    n = len(b)
    T = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda i: abs(T[i][c]))
        T[c], T[p] = T[p], T[c]
        for i in range(c + 1, n):
            f = T[i][c] / T[c][c]
            T[i] = [u - f * v for u, v in zip(T[i], T[c])]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (T[i][n] - sum(T[i][j] * x[j] for j in range(i + 1, n))) / T[i][i]
    return x

def lstd(transitions, gamma, k):
    A = [[0.0] * k for _ in range(k)]
    b = [0.0] * k
    for x, r, x2 in transitions:
        d = [xi - gamma * (x2[i] if x2 is not None else 0.0) for i, xi in enumerate(x)]
        for i in range(k):
            b[i] += r * x[i]
            for j in range(k):
                A[i][j] += x[i] * d[j]
    return solve(A, b)

def weighted_error(v_true, w, feats, mu):
    return sum(m * (v - sum(wi * xi for wi, xi in zip(w, f))) ** 2 for v, f, m in zip(v_true, feats, mu))

print(solve([[2, 1], [1, 3]], [3, 5]), [round(x, 4) for x in lstd([([1], 0, [2]), ([2], 1, None)], 1.0, 1)], lstd([([1, 0], 0, [0, 1]), ([0, 1], 1, None)], 1.0, 2))
print(weighted_error([1, 2], [1], [[1], [1]], [0.5, 0.5]), weighted_error([0, 4], [1], [[0], [2]], [0.25, 0.75]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.8, 1.4] [0.6667] [1.0, 1.0]\n0.5 3.0",
          "[0.8, 1.4] [0.6] [1.0, 1.0]\n0.5 3.0",
          "[0.8, 1.4] [0.6667] [0.0, 1.0]\n0.5 3.0",
          "[0.8, 1.4] [0.6667] [1.0, 1.0]\n0.5 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>aggregate(s, n_states, n_groups)</C>, the one-hot feature of the group <C>s * n_groups // n_states</C>;{" "}
          <C>mc_update(w, x, G, alpha)</C>; and <C>semi_td_update(w, x, r, x2, alpha, gamma)</C>, with x2 None at termination. Both
          updates return new weight lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def aggregate(s, n_states, n_groups):
    return [0.0] * n_groups

def mc_update(w, x, G, alpha):
    return w

def semi_td_update(w, x, r, x2, alpha, gamma):
    return w
`,
        solution: GRAD,
        tests: [
          { name: "updates", code: `assert aggregate(0, 10, 2) == [1.0, 0.0] and aggregate(7, 10, 2) == [0.0, 1.0] and aggregate(8, 9, 3) == [0.0, 0.0, 1.0] and aggregate(4, 500, 10) == [1.0] + [0.0] * 9
assert mc_update([0.5, 1.0], [1, 0], 2, 0.5) == [1.25, 1.0] and all(abs(a - b) < 1e-12 for a, b in zip(mc_update([1.0, 1.0], [1, 2], 0, 0.1), [0.7, 0.4]))
assert semi_td_update([0.5, 0.25], [1, 0], 1, [0, 1], 0.5, 1.0) == [0.875, 0.25] and semi_td_update([0.5, 0.25], [0, 1], 3, None, 0.5, 1.0) == [0.5, 1.625]` },
          { name: "learn", code: `import random
r = random.Random(0); w = [0.0] * 5; u = [0.0] * 5
for _ in range(3000):
    s, traj = 3, []
    while 1 <= s <= 5:
        s2 = s + r.choice((-1, 1)); traj.append((s, 1 if s2 == 6 else 0, s2 if 1 <= s2 <= 5 else None)); s = s2
    G = traj[-1][1]
    for s, rew, s2 in traj:
        w = mc_update(w, aggregate(s - 1, 5, 5), G, 0.01)
        u = semi_td_update(u, aggregate(s - 1, 5, 5), rew, aggregate(s2 - 1, 5, 5) if s2 else None, 0.01, 1.0)
assert all(abs(w[i] - (i + 1) / 6) < 0.1 and abs(u[i] - (i + 1) / 6) < 0.1 for i in range(5))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve(A, b)</C>, Gaussian elimination with partial pivoting; <C>lstd(transitions, gamma, k)</C>, which builds{" "}
          <M>{"\\hat A"}</M> and <M>{"\\hat b"}</M> from (x, r, x2) triples, x2 None at termination, and solves; and{" "}
          <C>weighted_error(v_true, w, feats, mu)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def solve(A, b):
    return [0.0] * len(b)

def lstd(transitions, gamma, k):
    return [0.0] * k

def weighted_error(v_true, w, feats, mu):
    return 0.0
`,
        solution: LSTD,
        tests: [
          { name: "lstd", code: `assert solve([[2, 1], [1, 3]], [3, 5]) == [0.8, 1.4] and solve([[0, 1], [1, 0]], [2, 3]) == [3, 2]
assert abs(lstd([([1], 0, [2]), ([2], 1, None)], 1.0, 1)[0] - 2 / 3) < 1e-12 and lstd([([1, 0], 0, [0, 1]), ([0, 1], 1, None)], 1.0, 2) == [1.0, 1.0]
w = lstd([([1, 0], 0, [0, 1]), ([0, 1], 1, None)], 0.5, 2); assert abs(w[0] - 0.5) < 1e-12 and abs(w[1] - 1) < 1e-12` },
          { name: "error", code: `assert weighted_error([1, 2], [1], [[1], [1]], [0.5, 0.5]) == 0.5 and weighted_error([0, 4], [1], [[0], [2]], [0.25, 0.75]) == 3 and weighted_error([3], [1, 2], [[1, 1]], [1]) == 0` },
        ],
      },
    },
    {
      key: "fix",
      rung: "stretch",
      prompt: (
        <p>
          Repeat the example with x(A) = 1 and x(B) = 3, the same episode and γ = 1. What is the TD fixed point w? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4286, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Linear features must be designed by hand. Deep Q-networks (l6.5.2) learn them, by training a convolutional network with
        Q-learning targets on raw screen pixels, and they need two stabilising devices, experience replay and a target network,
        to make that work.
      </p>
    </>
  ),
};
