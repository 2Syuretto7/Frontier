import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShortCorridorViz } from "@/components/viz/ShortCorridorViz";
import type { LessonContent } from "@/lib/types";

const SOFTMAX = `import math

def softmax(z):
    m = max(z)
    e = [math.exp(x - m) for x in z]
    total = sum(e)
    return [x / total for x in e]

def score(z, a):
    p = softmax(z)
    return [(1.0 if b == a else 0.0) - p[b] for b in range(len(z))]

def bandit_gradient(z, q):
    p = softmax(z)
    avg = sum(pi * qi for pi, qi in zip(p, q))
    return [pi * (qi - avg) for pi, qi in zip(p, q)]`;

const CORRIDOR = `STEP = [(0, 1), (2, 0), (1, None)]

def evaluate(p, sweeps=2000):
    v = [0.0] * 3
    val = lambda s: 0.0 if s is None else v[s]
    for _ in range(sweeps):
        v = [-1 + (1 - p) * val(L) + p * val(R) for L, R in STEP]
    return v

def visits(p, sweeps=2000):
    eta = [0.0] * 3
    for _ in range(sweeps):
        new = [1.0, 0.0, 0.0]
        for s, (L, R) in enumerate(STEP):
            for nxt, prob in ((L, 1 - p), (R, p)):
                if nxt is not None:
                    new[nxt] += prob * eta[s]
        eta = new
    return eta

def corridor_gradient(p):
    v, eta = evaluate(p), visits(p)
    q = lambda s, a: -1 + (0.0 if STEP[s][a] is None else v[STEP[s][a]])
    return p * (1 - p) * sum(eta[s] * (q(s, 1) - q(s, 0)) for s in range(3))`;

export const lesson: LessonContent = {
  id: "l6.6.1",
  minutes: 55,
  links: {
    requires: ["l6.2.3", "l3.3.2"],
    revisits: ["m13.6.1", "l3.2.4", "l6.1.2"],
    foreshadows: ["l6.6.2", "l6.6.3", "l6.7.1"],
  },

  puzzle: (
    <>
      <p>
        So far every method learnt values and acted greedily, or nearly so, on them. Instead, give the policy its own
        parameters θ and climb the gradient of the expected return. But the return depends on θ in two ways: through the
        actions the policy picks, and through the states those actions lead to, whose distribution depends on dynamics the
        agent does not know. How can the agent compute a gradient through an environment it cannot differentiate?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The answer is that it does not need to. The policy gradient theorem says that the gradient is a sum, over the states
        the policy visits, of how much each action is worth there times how fast the policy&apos;s probability of that action
        changes. The effect of θ on which states are visited drops out. A parametrised policy can also be stochastic, which
        matters when the agent cannot tell states apart: in the corridor below the best policy is a coin flip with a bias,
        something no greedy or ε-greedy policy can express.
      </p>
      <ShortCorridorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="parametrised policies">
        <p>
          A policy <M>{"\\pi(a \\mid s, \\theta)"}</M> is differentiable in θ. For discrete actions the usual choice is a softmax of
          action preferences <M>{"h(s, a, \\theta)"}</M> (l3.3.2), which may be linear in features or the output of a network. The
          objective in an episodic task is the value of the start state, <M>{"J(\\theta) = v_{\\pi_\\theta}(s_0)"}</M>.
        </p>
      </Definition>

      <Theorem title="the policy gradient theorem">
        <p>
          (Sutton, McAllester, Singh and Mansour, 2000.) In an episodic task with γ = 1, let{" "}
          <M>{"\\eta(s) = \\sum_{k \\ge 0}\\Pr(S_k = s \\mid S_0 = s_0)"}</M> be the expected number of visits to s under{" "}
          <M>{"\\pi_\\theta"}</M>. Then
        </p>
        <MD>{"\\nabla J(\\theta) = \\sum_s\\eta(s)\\sum_aq_\\pi(s, a)\\,\\nabla\\pi(a \\mid s, \\theta)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"v(s) = \\sum_a\\pi(a \\mid s)q(s, a)"}</M> and <M>{"q(s, a) = \\sum_{s', r}p(s', r \\mid s, a)(r + v(s'))"}</M>, with v = 0 at
          the end. The rewards and the dynamics do not depend on θ, so by the product rule
        </p>
        <MD>{"\\nabla v(s) = \\underbrace{\\sum_a\\nabla\\pi(a \\mid s)q(s, a)}_{\\phi(s)} + \\sum_{s'}P_\\pi(s, s')\\nabla v(s'),"}</MD>
        <p>
          where <M>{"P_\\pi(s, s') = \\sum_a\\pi(a \\mid s)p(s' \\mid s, a)"}</M>. In vector form <M>{"\\nabla v = \\phi + P_\\pi\\nabla v"}</M>, and
          unrolling gives <M>{"\\nabla v = \\sum_{k \\ge 0}P_\\pi^k\\phi"}</M>, which converges because the episode ends with
          probability 1. Entry <M>{"s_0"}</M> is <M>{"\\sum_s\\sum_k\\Pr(S_k = s \\mid s_0)\\phi(s) = \\sum_s\\eta(s)\\phi(s)"}</M>. The gradient of
          the state distribution never appears: it is absorbed by the recursion.
        </p>
      </Proof>

      <Theorem title="the score-function form">
        <p>
          Since <M>{"\\nabla\\pi = \\pi\\nabla\\log\\pi"}</M>, the gradient is an expectation over episodes of the policy itself:
        </p>
        <MD>{"\\nabla J(\\theta) = \\mathbb{E}_\\pi\\Bigl[\\sum_tq_\\pi(S_t, A_t)\\,\\nabla\\log\\pi(A_t \\mid S_t, \\theta)\\Bigr]."}</MD>
        <p>
          For a softmax over preferences z, <M>{"\\nabla_z\\log\\pi(a) = e_a - \\pi"}</M> (<C>score</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sum_s\\eta(s)\\sum_a\\pi(a \\mid s)q(s, a)\\nabla\\log\\pi(a \\mid s)"}</M> sums, over every time step, the probability of being
          in s at that step and choosing a there, times the quantity inside; that is the expectation of the sum over t. This is
          the score-function estimator of m13.6.1 applied to the whole trajectory. For the softmax,{" "}
          <M>{"\\log\\pi(a) = z_a - \\log\\sum_be^{z_b}"}</M>, whose derivative in <M>{"z_b"}</M> is <M>{"[a = b] - \\pi(b)"}</M>.
        </p>
      </Proof>

      <Example title="one state">
        <p>
          With a single state and one step, the theorem gives <M>{"\\partial J/\\partial z_b = \\pi(b)(q(b) - \\bar q)"}</M>, where{" "}
          <M>{"\\bar q = \\sum_a\\pi(a)q(a)"}</M> (<C>bandit_gradient</C>): raise the preference of every action that beats the
          policy&apos;s average, in proportion to how often it is taken. The components sum to zero, because adding a constant to all
          preferences changes nothing.
        </p>
        <Code>{SOFTMAX}</Code>
      </Example>

      <Example title="the short corridor">
        <p>
          (Sutton and Barto, Example 13.1.) In the corridor of the picture, with p the probability of choosing right in every
          state, <M>{"J(p) = (2p - 4)/(p(1 - p))"}</M>. With <M>{"p = \\sigma(\\theta)"}</M> the theorem gives{" "}
          <M>{"dJ/d\\theta = p(1 - p)\\sum_s\\eta(s)\\bigl(q(s, \\text{right}) - q(s, \\text{left})\\bigr)"}</M>. The code below computes v and η by
          repeated sweeps (<C>evaluate</C>, <C>visits</C>) and then the gradient (<C>corridor_gradient</C>); a finite difference of J
          (l3.2.4) agrees with it.
        </p>
        <Code>{CORRIDOR}</Code>
      </Example>

      <Remark title="why stochastic policies">
        <p>
          A greedy policy changes abruptly when two action values cross, and ε-greedy fixes its randomness in advance (l6.1.2). A
          parametrised policy changes smoothly with θ, can approach a deterministic policy where that is best, and can settle
          on a genuinely stochastic one where states look alike, as in the corridor, or where an opponent could exploit
          predictability. It also extends to continuous actions, for example a Gaussian whose mean and spread are outputs of a
          network.
        </p>
      </Remark>

      <Remark title="discounting">
        <p>
          With discount γ the same proof gives <M>{"\\eta(s) = \\sum_k\\gamma^k\\Pr(S_k = s)"}</M>, so the sample form carries a factor{" "}
          <M>{"\\gamma^t"}</M>. Most implementations drop that factor, which follows a direction that is not exactly the gradient of
          any objective but works well in practice. The next lessons replace the unknown <M>{"q_\\pi"}</M> by the sampled return
          (l6.6.2), subtract a baseline to cut variance (l6.6.3), and later change the geometry in which the step is taken (l6.7.1).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "score",
      rung: "check",
      prompt: (
        <p>
          A softmax policy has preferences 0, 0 and ln 2 for three actions, and the third action is taken. What is the third
          component of <M>{"\\nabla_z\\log\\pi"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "two",
      rung: "check",
      prompt: (
        <p>
          A single state has two actions with values q(right) = 4 and q(left) = 2, and π(right) = σ(θ) with θ = 0. What is dJ/dθ?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the policy gradient theorem make policy gradients practical?</p>,
      answer: {
        kind: "choice",
        options: [
          "The gradient involves no derivative of the state distribution, so it can be estimated from the policy's own experience without a model",
          "It shows that the gradient is always zero at a deterministic policy",
          "It removes the need to estimate action values",
          "It shows that J is concave in θ, so gradient ascent finds the global optimum",
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

def softmax(z):
    m = max(z)
    e = [math.exp(x - m) for x in z]
    total = sum(e)
    return [x / total for x in e]

def score(z, a):
    p = softmax(z)
    return [(1.0 if b == a else 0.0) - p[b] for b in range(len(z))]

def bandit_gradient(z, q):
    p = softmax(z)
    avg = sum(pi * qi for pi, qi in zip(p, q))
    return [pi * (qi - avg) for pi, qi in zip(p, q)]

z = [0.0, 0.0, math.log(2)]; print([round(x, 4) for x in softmax(z)], [round(x, 4) for x in score(z, 0)])
print([round(x, 4) for x in bandit_gradient([0.0, 0.0, 0.0], [1.0, 2.0, 3.0])], [round(x, 4) for x in bandit_gradient([5.0, 5.0], [7.0, 7.0])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.25, 0.25, 0.5] [0.75, -0.25, -0.5]\n[-0.3333, 0.0, 0.3333] [0.0, 0.0]",
          "[0.25, 0.25, 0.5] [0.75, 0.25, 0.5]\n[-0.3333, 0.0, 0.3333] [0.0, 0.0]",
          "[0.25, 0.25, 0.5] [0.75, -0.25, -0.5]\n[0.1667, 0.3333, 0.5] [0.5, 0.5]",
          "[0.0, 0.0, 0.6931] [1.0, 0.0, 0.0]\n[-0.3333, 0.0, 0.3333] [0.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`STEP = [(0, 1), (2, 0), (1, None)]

def evaluate(p, sweeps=2000):
    v = [0.0] * 3
    val = lambda s: 0.0 if s is None else v[s]
    for _ in range(sweeps):
        v = [-1 + (1 - p) * val(L) + p * val(R) for L, R in STEP]
    return v

def visits(p, sweeps=2000):
    eta = [0.0] * 3
    for _ in range(sweeps):
        new = [1.0, 0.0, 0.0]
        for s, (L, R) in enumerate(STEP):
            for nxt, prob in ((L, 1 - p), (R, p)):
                if nxt is not None:
                    new[nxt] += prob * eta[s]
        eta = new
    return eta

def corridor_gradient(p):
    v, eta = evaluate(p), visits(p)
    q = lambda s, a: -1 + (0.0 if STEP[s][a] is None else v[STEP[s][a]])
    return p * (1 - p) * sum(eta[s] * (q(s, 1) - q(s, 0)) for s in range(3))

print([round(x, 6) for x in evaluate(0.5)], [round(x, 6) for x in visits(0.5)])
print(round(corridor_gradient(0.5), 6), corridor_gradient(0.5) > 0, corridor_gradient(0.7) > 0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-12.0, -10.0, -6.0] [6.0, 4.0, 2.0]\n2.0 True False",
          "[-12.0, -10.0, -6.0] [6.0, 4.0, 2.0]\n2.0 True True",
          "[-6.0, -10.0, -12.0] [2.0, 4.0, 6.0]\n2.0 True False",
          "[-12.0, -10.0, -6.0] [1.0, 1.0, 1.0]\n-2.0 False False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax(z)</C>, subtracting the maximum before exponentiating; <C>score(z, a)</C>, the gradient of{" "}
          <M>{"\\log\\pi(a)"}</M> with respect to z; and <C>bandit_gradient(z, q)</C>, the exact gradient of the expected value{" "}
          <M>{"\\sum_a\\pi(a)q(a)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax(z):
    return [1.0 / len(z)] * len(z)

def score(z, a):
    return [0.0] * len(z)

def bandit_gradient(z, q):
    return [0.0] * len(z)
`,
        solution: SOFTMAX,
        tests: [
          { name: "softmax", code: `close = lambda u, v: len(u) == len(v) and all(abs(a - b) < 1e-9 for a, b in zip(u, v))
assert close(softmax([1000.0, 1000.0]), [0.5, 0.5]) and close(softmax([0.0, math.log(3)]), [0.25, 0.75])
assert close(score([0.0, math.log(3)], 1), [-0.25, 0.25]) and close(score([0.0, 0.0, math.log(2)], 2), [-0.25, -0.25, 0.5])` },
          { name: "gradient", code: `close = lambda u, v: len(u) == len(v) and all(abs(a - b) < 1e-6 for a, b in zip(u, v))
assert close(bandit_gradient([0.0, 0.0, 0.0], [1.0, 2.0, 3.0]), [-1 / 3, 0.0, 1 / 3])
z, q = [0.3, -1.0, 0.5], [2.0, -1.0, 4.0]
f = lambda z: sum(p * x for p, x in zip(softmax(z), q))
fd = [(f([z[j] + 1e-6 * (j == i) for j in range(3)]) - f([z[j] - 1e-6 * (j == i) for j in range(3)])) / 2e-6 for i in range(3)]
assert close(bandit_gradient(z, q), fd) and abs(sum(bandit_gradient(z, q))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>STEP[s] = (next state after left, next state after right)</C> and None for the end, write <C>evaluate(p, sweeps=2000)</C>{" "}
          for the values of the three states, <C>visits(p, sweeps=2000)</C> for the expected visits η from the start state 0, and{" "}
          <C>corridor_gradient(p)</C>, the theorem&apos;s dJ/dθ for <M>{"p = \\sigma(\\theta)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `STEP = [(0, 1), (2, 0), (1, None)]

def evaluate(p, sweeps=2000):
    return [0.0] * 3

def visits(p, sweeps=2000):
    return [0.0] * 3

def corridor_gradient(p):
    return 0.0
`,
        solution: CORRIDOR,
        tests: [
          { name: "values", code: `close = lambda u, v: all(abs(a - b) < 1e-6 for a, b in zip(u, v))
assert close(evaluate(0.5), [-12.0, -10.0, -6.0]) and close(evaluate(0.8), [-15.0, -13.75, -3.75])
assert close(visits(0.5), [6.0, 4.0, 2.0]) and close(visits(0.8), [7.5, 6.25, 1.25])` },
          { name: "gradient", code: `import math
J = lambda t: evaluate(1 / (1 + math.exp(-t)))[0]
for p in (0.3, 0.5, 0.8):
    t = math.log(p / (1 - p))
    assert abs(corridor_gradient(p) - (J(t + 1e-5) - J(t - 1e-5)) / 2e-5) < 1e-4
assert abs(corridor_gradient(0.8) + 7.0) < 1e-6` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          Find the probability of choosing right that maximises the start value of the short corridor, where the gradient is
          zero. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5858, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The theorem needs <M>{"q_\\pi"}</M>, which is unknown. The next lesson (l6.6.2) uses the return that followed each action
        as an unbiased sample of it, which gives REINFORCE, the simplest policy-gradient algorithm.
      </p>
    </>
  ),
};
