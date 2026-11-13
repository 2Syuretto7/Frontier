import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HmmPosteriorViz } from "@/components/viz/HmmPosteriorViz";
import type { LessonContent } from "@/lib/types";

const FB = `import numpy as np

def forward(pi, A, B, obs):
    alpha, c = np.zeros((len(obs), len(pi))), np.zeros(len(obs))
    a = pi * B[:, obs[0]]
    for t in range(len(obs)):
        if t > 0:
            a = (alpha[t - 1] @ A) * B[:, obs[t]]
        c[t] = a.sum(); alpha[t] = a / c[t]
    return alpha, c

def backward(A, B, obs, c):
    beta = np.ones((len(obs), A.shape[0]))
    for t in range(len(obs) - 2, -1, -1):
        beta[t] = A @ (B[:, obs[t + 1]] * beta[t + 1]) / c[t + 1]
    return beta

def posteriors(pi, A, B, obs):
    alpha, c = forward(pi, A, B, obs)
    return alpha * backward(A, B, obs, c), float(np.log(c).sum())`;

const VIT = `import numpy as np
from itertools import product

def viterbi(pi, A, B, obs):
    d, back = np.log(pi) + np.log(B[:, obs[0]]), []
    for o in obs[1:]:
        s = d[:, None] + np.log(A)
        back.append(s.argmax(axis=0)); d = s.max(axis=0) + np.log(B[:, o])
    path = [int(d.argmax())]
    for b in reversed(back):
        path.append(int(b[path[-1]]))
    return path[::-1], float(d.max())

def brute_force_loglik(pi, A, B, obs):
    total = 0.0
    for z in product(range(len(pi)), repeat=len(obs)):
        p = pi[z[0]] * B[z[0], obs[0]]
        for t in range(1, len(obs)):
            p *= A[z[t - 1], z[t]] * B[z[t], obs[t]]
        total += p
    return float(np.log(total))`;

export const lesson: LessonContent = {
  id: "l2.5.4",
  minutes: 60,
  links: {
    requires: ["l2.5.2", "m7.8.1"],
    revisits: ["m7.1.3", "l2.1.1"],
    foreshadows: ["l2.7.3"],
  },

  puzzle: (
    <>
      <p>
        A monitoring system sees only response times: fast, slow, or timeout. Behind them the server is either healthy or
        degraded, and its state persists from one minute to the next. After a day of minutes, there are 2¹⁴⁴⁰ possible state
        histories. How can you compute the probability that the server was degraded at 14:05, using everything observed
        before and after, in a fraction of a second?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The hidden state forms a Markov chain, and each observation depends only on the current state. So the probability of
        everything up to time t, ending in state j, can be updated from the same quantity at time t − 1 with one small
        matrix product. A pass forwards and a pass backwards then give the posterior at every time, and replacing sums with
        maximums gives the single most likely history.
      </p>
      <HmmPosteriorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="hidden Markov model">
        <p>
          Hidden states <M>{"z_1, \\dots, z_T \\in \\{1, \\dots, K\\}"}</M> form a Markov chain with initial distribution π
          and transition matrix <M>{"A_{ij} = P(z_{t+1} = j \\mid z_t = i)"}</M>. Each observation depends only on the
          current state: <M>{"P(x_t = o \\mid z_t = j) = B_{jo}"}</M>. The joint probability is
        </p>
        <MD>{"p(x, z) = \\pi_{z_1}B_{z_1x_1}\\prod_{t=2}^T A_{z_{t-1}z_t}B_{z_tx_t}."}</MD>
      </Definition>

      <Theorem title="the forward recursion">
        <p>
          Let <M>{"\\alpha_t(j) = p(x_1, \\dots, x_t, z_t = j)"}</M>. Then <M>{"\\alpha_1(j) = \\pi_jB_{jx_1}"}</M>,{" "}
          <M>{"\\alpha_t(j) = \\big(\\sum_i \\alpha_{t-1}(i)A_{ij}\\big)B_{jx_t}"}</M>, and{" "}
          <M>{"p(x_1, \\dots, x_T) = \\sum_j \\alpha_T(j)"}</M>. The cost is <M>{"O(TK^2)"}</M> instead of{" "}
          <M>{"O(TK^T)"}</M> for summing over all paths.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sum over the previous state:{" "}
          <M>{"\\alpha_t(j) = \\sum_i p(x_{1:t-1}, z_{t-1} = i)\\,P(z_t = j \\mid z_{t-1} = i, x_{1:t-1})\\,P(x_t \\mid z_t = j, z_{t-1} = i, x_{1:t-1})"}</M>.
          By the model&apos;s structure, the next state depends only on the previous state and the observation only on the
          current state, so the factors are <M>{"\\alpha_{t-1}(i)"}</M>, <M>{"A_{ij}"}</M> and <M>{"B_{jx_t}"}</M>. Summing
          the final α over j marginalises <M>{"z_T"}</M>. Each step is a K-by-K matrix-vector product.
        </p>
      </Proof>

      <Theorem title="smoothing with the backward pass">
        <p>
          Let <M>{"\\beta_t(i) = p(x_{t+1}, \\dots, x_T \\mid z_t = i)"}</M>, with <M>{"\\beta_T = 1"}</M> and{" "}
          <M>{"\\beta_t(i) = \\sum_j A_{ij}B_{jx_{t+1}}\\beta_{t+1}(j)"}</M>. Then{" "}
          <M>{"P(z_t = i \\mid x_{1:T}) = \\alpha_t(i)\\beta_t(i)/p(x_{1:T})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The recursion follows by summing over <M>{"z_{t+1}"}</M> exactly as before. Given <M>{"z_t"}</M>, the future
          observations are independent of the past ones, so{" "}
          <M>{"p(x_{1:T}, z_t = i) = p(x_{1:t}, z_t = i)\\,p(x_{t+1:T} \\mid z_t = i) = \\alpha_t(i)\\beta_t(i)"}</M>; divide by{" "}
          <M>{"p(x_{1:T})"}</M>.
        </p>
      </Proof>
      <Example title="scaling">
        <p>
          The α values shrink geometrically and underflow after a few hundred steps. Normalise each <M>{"\\alpha_t"}</M> to
          sum to 1 and keep the normaliser <M>{"c_t = p(x_t \\mid x_{1:t-1})"}</M>; then{" "}
          <M>{"\\log p(x_{1:T}) = \\sum_t\\log c_t"}</M>, and dividing each backward step by the same <M>{"c_{t+1}"}</M> makes
          the product of the scaled α and β the posterior directly. The normalised α itself is the filtered distribution{" "}
          <M>{"P(z_t \\mid x_{1:t})"}</M>.
        </p>
        <Code>{FB}</Code>
      </Example>

      <Remark title="the most likely path">
        <p>
          The Viterbi algorithm replaces the sum in the forward recursion with a maximum, works in logs, and remembers which
          previous state achieved each maximum; tracing these back gives{" "}
          <M>{"\\arg\\max_z p(z \\mid x)"}</M>. It is not the sequence of individually most likely states: in the example the
          last step has posterior probability 0.386 of being degraded, yet the best overall path ends degraded. A brute-force
          sum over all 128 paths confirms the forward log-likelihood. Fitting π, A and B from observations alone is EM, called
          Baum-Welch, with the E-step supplied by forward-backward.
        </p>
        <Code>{VIT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "paths",
      rung: "check",
      prompt: <p>An HMM with 2 states observed for 7 steps has how many possible hidden state sequences?</p>,
      answer: { kind: "numeric", value: 128, tolerance: 0.001 },
    },
    {
      key: "a1",
      rung: "check",
      prompt: <p>With π = (0.8, 0.2) and P(fast | healthy) = 0.7, P(fast | degraded) = 0.2, what is the probability that the first observation is fast?</p>,
      answer: { kind: "numeric", value: 0.6, tolerance: 0.0001 },
    },
    {
      key: "cost",
      rung: "apply",
      prompt: <p>How does the cost of the forward algorithm grow with the number of states K and the length T?</p>,
      answer: { kind: "choice", options: ["O(TK²)", "O(Kᵀ)", "O(T²K)", "O(TK)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def forward(pi, A, B, obs):
    alpha, c = np.zeros((len(obs), len(pi))), np.zeros(len(obs))
    a = pi * B[:, obs[0]]
    for t in range(len(obs)):
        if t > 0:
            a = (alpha[t - 1] @ A) * B[:, obs[t]]
        c[t] = a.sum(); alpha[t] = a / c[t]
    return alpha, c

def backward(A, B, obs, c):
    beta = np.ones((len(obs), A.shape[0]))
    for t in range(len(obs) - 2, -1, -1):
        beta[t] = A @ (B[:, obs[t + 1]] * beta[t + 1]) / c[t + 1]
    return beta

def posteriors(pi, A, B, obs):
    alpha, c = forward(pi, A, B, obs)
    return alpha * backward(A, B, obs, c), float(np.log(c).sum())

pi = np.array([0.8, 0.2]); A = np.array([[0.9, 0.1], [0.2, 0.8]]); B = np.array([[0.7, 0.25, 0.05], [0.2, 0.5, 0.3]])
obs = [0, 0, 1, 2, 2, 1, 0]
gamma, ll = posteriors(pi, A, B, obs)
print(np.round(gamma[:, 1], 3), round(ll, 4))
print(np.allclose(gamma.sum(axis=1), 1), round(float(forward(pi, A, B, obs)[1][0]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.079 0.181 0.629 0.874 0.886 0.708 0.386] -7.9055\nTrue 0.6", "[0.079 0.181 0.629 0.874 0.886 0.708 0.386] -7.9055\nTrue 0.56", "[0.2   0.2   0.2   0.2   0.2   0.2   0.2  ] -7.9055\nTrue 0.6", "[0.079 0.181 0.629 0.874 0.886 0.708 0.386] -9.6407\nTrue 0.6"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from itertools import product

def viterbi(pi, A, B, obs):
    d, back = np.log(pi) + np.log(B[:, obs[0]]), []
    for o in obs[1:]:
        s = d[:, None] + np.log(A)
        back.append(s.argmax(axis=0)); d = s.max(axis=0) + np.log(B[:, o])
    path = [int(d.argmax())]
    for b in reversed(back):
        path.append(int(b[path[-1]]))
    return path[::-1], float(d.max())

def brute_force_loglik(pi, A, B, obs):
    total = 0.0
    for z in product(range(len(pi)), repeat=len(obs)):
        p = pi[z[0]] * B[z[0], obs[0]]
        for t in range(1, len(obs)):
            p *= A[z[t - 1], z[t]] * B[z[t], obs[t]]
        total += p
    return float(np.log(total))

pi = np.array([0.8, 0.2]); A = np.array([[0.9, 0.1], [0.2, 0.8]]); B = np.array([[0.7, 0.25, 0.05], [0.2, 0.5, 0.3]])
obs = [0, 0, 1, 2, 2, 1, 0]
path, lp = viterbi(pi, A, B, obs)
print(path, round(lp, 4), round(brute_force_loglik(pi, A, B, obs), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, 0, 1, 1, 1, 1, 1] -9.6407 -7.9055", "[0, 0, 1, 1, 1, 1, 0] -9.6407 -7.9055", "[0, 0, 1, 1, 1, 1, 1] -7.9055 -9.6407", "[0, 0, 0, 0, 0, 0, 0] -9.6407 -7.9055"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>forward(pi, A, B, obs)</C>, returning the normalised α as a (T, K) array and the normalisers c;{" "}
          <C>backward(A, B, obs, c)</C>, returning β scaled by the same normalisers; and{" "}
          <C>posteriors(pi, A, B, obs)</C>, returning the (T, K) smoothed posteriors and log p(obs) as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def forward(pi, A, B, obs):
    return np.zeros((len(obs), len(pi))), np.ones(len(obs))

def backward(A, B, obs, c):
    return np.ones((len(obs), A.shape[0]))

def posteriors(pi, A, B, obs):
    return np.zeros((len(obs), len(pi))), 0.0
`,
        solution: FB,
        tests: [
          { name: "two", code: `pi = np.array([0.8, 0.2]); A = np.array([[0.9, 0.1], [0.2, 0.8]]); B = np.array([[0.7, 0.3], [0.2, 0.8]])
g, ll = posteriors(pi, A, B, [0, 0])
assert abs(ll - np.log(0.376)) < 1e-12 and np.allclose(forward(pi, A, B, [0])[1], [0.6])` },
          { name: "smooth", code: `pi = np.array([0.5, 0.5]); A = np.eye(2); B = np.array([[0.9, 0.1], [0.1, 0.9]])
g, ll = posteriors(pi, A, B, [0, 0, 1])
assert np.allclose(g.sum(axis=1), 1) and np.allclose(g[0], g[2]) and abs(g[0, 0] - 0.9) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>viterbi(pi, A, B, obs)</C>, returning the most likely state path as a list and its log joint probability,
          and <C>brute_force_loglik(pi, A, B, obs)</C>, which sums p(x, z) over every path.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from itertools import product

def viterbi(pi, A, B, obs):
    return [0] * len(obs), 0.0

def brute_force_loglik(pi, A, B, obs):
    return 0.0
`,
        solution: VIT,
        tests: [
          { name: "bf", code: `pi = np.array([0.8, 0.2]); A = np.array([[0.9, 0.1], [0.2, 0.8]]); B = np.array([[0.7, 0.3], [0.2, 0.8]])
assert abs(brute_force_loglik(pi, A, B, [0, 0]) - np.log(0.376)) < 1e-12` },
          { name: "vit", code: `pi = np.array([0.5, 0.5]); A = np.array([[0.6, 0.4], [0.4, 0.6]]); B = np.array([[0.9, 0.1], [0.1, 0.9]])
path, lp = viterbi(pi, A, B, [0, 0, 1, 1])
assert path == [0, 0, 1, 1] and abs(lp - np.log(0.5 * 0.9 * 0.6 * 0.9 * 0.4 * 0.9 * 0.6 * 0.9)) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the forward recursion α_t(j) = (Σᵢ α_(t−1)(i)·A_ij)·B(j, x_t), where α_t(j) = p(x_1, …, x_t, z_t = j), stating which independence assumptions of the HMM you use.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes α_t(j) as a sum over i of p(x_1, …, x_(t−1), z_(t−1) = i, z_t = j, x_t) and factorises it by the chain rule.",
          "Uses the Markov property (z_t depends on the past only through z_(t−1)) and that x_t depends only on z_t, to identify the factors A_ij and B(j, x_t).",
          "Identifies the remaining factor as α_(t−1)(i) and concludes the recursion.",
        ],
      },
    },
    {
      key: "two",
      rung: "stretch",
      prompt: (
        <p>
          With π = (0.8, 0.2), A = [[0.9, 0.1], [0.2, 0.8]], P(fast | healthy) = 0.7 and P(fast | degraded) = 0.2, what is
          the probability of observing fast twice in a row?
        </p>
      ),
      answer: { kind: "numeric", value: 0.376, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a hidden Markov model is, how the forward recursion computes the likelihood in O(TK²), how the backward pass gives smoothed posteriors, why scaling is needed, and how Viterbi differs from picking the most likely state at each step.",

  glimpse: (
    <>
      <p>
        Latent variables can also be continuous. The next chapter models high-dimensional data as a few hidden continuous
        factors plus noise, starting from principal component analysis derived as an optimisation problem.
      </p>
    </>
  ),
};
