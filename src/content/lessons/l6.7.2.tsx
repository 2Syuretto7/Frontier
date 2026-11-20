import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TrustRegionViz } from "@/components/viz/TrustRegionViz";
import type { LessonContent } from "@/lib/types";

const SOLVER = `import math

def conjugate_gradient(Avp, b, iters=10, tol=1e-12):
    x, r, p = [0.0] * len(b), list(b), list(b)
    rr = sum(v * v for v in r)
    for _ in range(iters):
        if rr < tol:
            break
        Ap = Avp(p)
        alpha = rr / sum(a * c for a, c in zip(p, Ap))
        x = [xi + alpha * pi for xi, pi in zip(x, p)]
        r = [ri - alpha * ai for ri, ai in zip(r, Ap)]
        new = sum(v * v for v in r)
        p = [ri + new / rr * pi for ri, pi in zip(r, p)]
        rr = new
    return x

def step_scale(x, Fx, delta):
    return math.sqrt(2 * delta / sum(a * b for a, b in zip(x, Fx)))

def line_search(theta, step, surrogate, kl, delta, backtracks=10):
    base = surrogate(theta)
    for k in range(backtracks):
        new = [t + 0.5 ** k * s for t, s in zip(theta, step)]
        if kl(new) <= delta and surrogate(new) > base:
            return new, k
    return list(theta), None`;

const SURROGATE = `import math

def surrogate(new_probs, old_probs, actions, adv):
    return sum(n[a] / o[a] * A for n, o, a, A in zip(new_probs, old_probs, actions, adv)) / len(adv)

def mean_kl(old_probs, new_probs):
    return sum(sum(p * math.log(p / q) for p, q in zip(o, n) if p > 0) for o, n in zip(old_probs, new_probs)) / len(old_probs)

def fvp_softmax(pi, v):
    pv = sum(p * x for p, x in zip(pi, v))
    return [p * (x - pv) for p, x in zip(pi, v)]`;

export const lesson: LessonContent = {
  id: "l6.7.2",
  minutes: 60,
  links: {
    requires: ["l6.7.1", "l6.6.3"],
    revisits: ["m11.5.2", "m13.1.3"],
    foreshadows: ["l6.7.3"],
  },

  puzzle: (
    <>
      <p>
        A policy-gradient step uses data from the current policy to predict how a new policy will do. That prediction is
        accurate only for new policies close to the old one, because the new policy will visit different states. How far can
        a step go before the prediction stops being trustworthy, and can the step be chosen so that the true return is
        guaranteed not to fall?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write the change in return exactly as an average of the old policy&apos;s advantages, taken over the states and actions of
        the new policy. Replace the new policy&apos;s states with the old ones, which is the only part that cannot be estimated from
        old data, and the result is a surrogate that agrees with the true objective to first order. Then maximise the
        surrogate only inside a region where the new policy is close to the old one in KL divergence: a trust region. In the
        picture a modest region lands near the best policy, while a large one follows the surrogate to a worse policy.
      </p>
      <TrustRegionViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the performance difference lemma">
        <p>
          (Kakade and Langford, 2002.) For any two policies, with <M>{"d^{\\pi'}(s) = (1 - \\gamma)\\sum_t\\gamma^t\\Pr(S_t = s \\mid \\pi')"}</M> the
          normalised discounted state distribution of π&apos;,
        </p>
        <MD>{"J(\\pi') - J(\\pi) = \\frac{1}{1 - \\gamma}\\,\\mathbb{E}_{s \\sim d^{\\pi'},\\,a \\sim \\pi'(\\cdot \\mid s)}\\bigl[a_\\pi(s, a)\\bigr]."}</MD>
      </Theorem>
      <Proof>
        <p>
          Along a trajectory of π&apos;, the sum <M>{"\\sum_t\\gamma^t(\\gamma v_\\pi(S_{t+1}) - v_\\pi(S_t))"}</M> telescopes to{" "}
          <M>{"-v_\\pi(S_0)"}</M>. So <M>{"J(\\pi') - J(\\pi) = \\mathbb{E}_{\\pi'}\\bigl[\\sum_t\\gamma^t(R_{t+1} + \\gamma v_\\pi(S_{t+1}) - v_\\pi(S_t))\\bigr]"}</M>.
          Conditioning each term on <M>{"(S_t, A_t)"}</M>, the bracket has mean <M>{"q_\\pi(S_t, A_t) - v_\\pi(S_t) = a_\\pi(S_t, A_t)"}</M>. Summing{" "}
          <M>{"\\gamma^t"}</M> times the probability of each state at time t gives the discounted state distribution.
        </p>
      </Proof>

      <Definition title="the surrogate objective">
        <p>
          Replace <M>{"d^{\\pi'}"}</M> by <M>{"d^\\pi"}</M> and sample the actions from π with an importance ratio (m13.1.3):
        </p>
        <MD>{"L_\\pi(\\pi') = J(\\pi) + \\frac{1}{1 - \\gamma}\\,\\mathbb{E}_{s \\sim d^\\pi,\\,a \\sim \\pi}\\Bigl[\\frac{\\pi'(a \\mid s)}{\\pi(a \\mid s)}a_\\pi(s, a)\\Bigr]."}</MD>
        <p>
          Everything in it can be estimated from data collected with π (<C>surrogate</C> computes the sample average of ratio
          times advantage). Since advantages average to zero under π, <M>{"L_\\pi(\\pi) = J(\\pi)"}</M>, and differentiating the ratio
          at π&apos; = π gives exactly the policy gradient, so <M>{"\\nabla L_\\pi = \\nabla J"}</M> there.
        </p>
      </Definition>

      <Remark title="a guarantee">
        <p>
          Schulman et al. (2015) prove, by coupling the two policies&apos; trajectories, that{" "}
          <M>{"J(\\pi') \\ge L_\\pi(\\pi') - \\frac{4\\varepsilon\\gamma}{(1 - \\gamma)^2}\\max_s\\mathrm{KL}\\bigl(\\pi(\\cdot \\mid s)\\,\\|\\,\\pi'(\\cdot \\mid s)\\bigr)"}</M> with{" "}
          <M>{"\\varepsilon = \\max_{s,a}|a_\\pi(s, a)|"}</M>. The right side equals J(π) at π&apos; = π, so maximising it never decreases J: a
          minorise-maximise scheme. The constant is far too cautious in practice, which is why TRPO uses a constraint instead
          of the penalty.
        </p>
      </Remark>

      <Definition title="trust region policy optimisation">
        <p>
          (Schulman, Levine, Moritz, Jordan and Abbeel, 2015.) Each iteration collects data with <M>{"\\pi_{\\theta_{\\text{old}}}"}</M>,
          estimates advantages (l6.6.4), and solves
        </p>
        <MD>{"\\max_\\theta L(\\theta) \\quad\\text{subject to}\\quad \\overline{\\mathrm{KL}}(\\theta_{\\text{old}}, \\theta) \\le \\delta,"}</MD>
        <p>
          with the KL averaged over visited states (<C>mean_kl</C>) and δ around 0.01. Linearising L and using the quadratic KL of
          l6.7.1 turns this into a natural gradient step: solve Fx = g, then step <M>{"\\beta x"}</M> with{" "}
          <M>{"\\beta = \\sqrt{2\\delta/x^\\top Fx}"}</M> (<C>step_scale</C>). Because both approximations can fail, a backtracking line
          search halves the step until the exact KL is within δ and the surrogate actually improves (<C>line_search</C>).
        </p>
        <Code>{SOLVER}</Code>
      </Definition>

      <Theorem title="conjugate gradient needs only products with F">
        <p>
          For a symmetric positive definite F of size n, conjugate gradient (m11.5.2, <C>conjugate_gradient</C>) reaches the exact
          solution of Fx = g in at most n iterations in exact arithmetic, and each iteration uses one product Fp.
        </p>
      </Theorem>
      <Proof>
        <p>
          The search directions are F-conjugate, <M>{"p_i^\\top Fp_j = 0"}</M> for i ≠ j, and each step minimises{" "}
          <M>{"\\tfrac12x^\\top Fx - g^\\top x"}</M> exactly along its direction while keeping the residual orthogonal to all earlier
          directions. n conjugate directions span the whole space, so after n steps the residual is orthogonal to everything and
          is zero. The algorithm touches F only through <C>Avp(p)</C>.
        </p>
      </Proof>

      <Remark title="Fisher-vector products">
        <p>
          A network with millions of parameters cannot store F, but Fv is cheap: it is the product of the Hessian of the mean
          KL with v, computed by differentiating <M>{"(\\nabla\\overline{\\mathrm{KL}})^\\top v"}</M> a second time. For a single softmax,{" "}
          <M>{"Fv = \\pi \\odot v - \\pi(\\pi^\\top v)"}</M> (<C>fvp_softmax</C>); adding the same constant to every preference changes
          nothing, so constant vectors give Fv = 0. In practice 10 iterations of conjugate gradient with a little damping are
          enough.
        </p>
        <Code>{SURROGATE}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          The old policy chose an action with probability 0.4 and the new policy would choose it with probability 0.6. What is
          the importance ratio in the surrogate?
        </p>
      ),
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "kl",
      rung: "check",
      prompt: (
        <p>
          In one state the old policy chooses right with probability 0.5 and the new with 0.8. What is{" "}
          <M>{"\\mathrm{KL}(\\pi_{\\text{old}} \\,\\|\\, \\pi_{\\text{new}})"}</M> there, in nats? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.2231, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does the surrogate stop being trustworthy for policies far from the old one?</p>,
      answer: {
        kind: "choice",
        options: [
          "It weights advantages by the old policy's state distribution, which differs more and more from the states the new policy would visit",
          "Importance ratios are undefined for actions the old policy took",
          "The advantages change sign when the policy changes",
          "It ignores the rewards and uses only the KL divergence",
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

def conjugate_gradient(Avp, b, iters=10, tol=1e-12):
    x, r, p = [0.0] * len(b), list(b), list(b)
    rr = sum(v * v for v in r)
    for _ in range(iters):
        if rr < tol:
            break
        Ap = Avp(p)
        alpha = rr / sum(a * c for a, c in zip(p, Ap))
        x = [xi + alpha * pi for xi, pi in zip(x, p)]
        r = [ri - alpha * ai for ri, ai in zip(r, Ap)]
        new = sum(v * v for v in r)
        p = [ri + new / rr * pi for ri, pi in zip(r, p)]
        rr = new
    return x

def step_scale(x, Fx, delta):
    return math.sqrt(2 * delta / sum(a * b for a, b in zip(x, Fx)))

def line_search(theta, step, surrogate, kl, delta, backtracks=10):
    base = surrogate(theta)
    for k in range(backtracks):
        new = [t + 0.5 ** k * s for t, s in zip(theta, step)]
        if kl(new) <= delta and surrogate(new) > base:
            return new, k
    return list(theta), None

print([round(v, 6) for v in conjugate_gradient(lambda v: [2 * v[0], 0.5 * v[1]], [1.0, 2.0])], conjugate_gradient(lambda v: [2 * v[0], 0.5 * v[1]], [1.0, 2.0], iters=1), step_scale([1.0, 0.0], [2.0, 0.0], 0.01))
print(line_search([0.0], [4.0], lambda t: -(t[0] - 1) ** 2, lambda t: t[0] ** 2 / 2, 0.5), line_search([0.0], [4.0], lambda t: -(t[0] - 1) ** 2, lambda t: t[0] ** 2 / 2, 0.5, backtracks=2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 4.0] [1.25, 2.5] 0.1\n([1.0], 2) ([0.0], None)",
          "[0.5, 4.0] [0.5, 4.0] 0.1\n([1.0], 2) ([0.0], None)",
          "[0.5, 4.0] [1.25, 2.5] 0.1\n([2.0], 1) ([2.0], 1)",
          "[2.0, 1.0] [1.25, 2.5] 0.01\n([1.0], 2) ([0.0], None)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def surrogate(new_probs, old_probs, actions, adv):
    return sum(n[a] / o[a] * A for n, o, a, A in zip(new_probs, old_probs, actions, adv)) / len(adv)

def mean_kl(old_probs, new_probs):
    return sum(sum(p * math.log(p / q) for p, q in zip(o, n) if p > 0) for o, n in zip(old_probs, new_probs)) / len(old_probs)

def fvp_softmax(pi, v):
    pv = sum(p * x for p, x in zip(pi, v))
    return [p * (x - pv) for p, x in zip(pi, v)]

print(round(surrogate([[0.6, 0.4], [0.5, 0.5]], [[0.5, 0.5], [0.5, 0.5]], [0, 1], [1.0, -2.0]), 4), mean_kl([[0.5, 0.5]], [[0.5, 0.5]]), round(mean_kl([[1.0, 0.0], [0.5, 0.5]], [[0.5, 0.5], [0.5, 0.5]]), 4))
print(fvp_softmax([0.5, 0.5], [1.0, -1.0]), fvp_softmax([0.5, 0.3, 0.2], [1.0, 1.0, 1.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.4 0.0 0.3466\n[0.5, -0.5] [0.0, 0.0, 0.0]",
          "-0.5 0.0 0.3466\n[0.5, -0.5] [0.0, 0.0, 0.0]",
          "-0.4 0.0 0.6931\n[0.5, -0.5] [0.0, 0.0, 0.0]",
          "-0.4 0.0 0.3466\n[0.5, 0.5] [0.5, 0.3, 0.2]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conjugate_gradient(Avp, b, iters=10, tol=1e-12)</C>, starting from zero and stopping when the squared residual
          falls below tol; <C>step_scale(x, Fx, delta)</C>; and <C>line_search(theta, step, surrogate, kl, delta, backtracks=10)</C>, trying
          fractions 1, 1/2, 1/4, … of the step and returning the first acceptable point and its index k, or the old θ and None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def conjugate_gradient(Avp, b, iters=10, tol=1e-12):
    return [0.0] * len(b)

def step_scale(x, Fx, delta):
    return 1.0

def line_search(theta, step, surrogate, kl, delta, backtracks=10):
    return list(theta), None
`,
        solution: SOLVER,
        tests: [
          { name: "cg", code: `close = lambda u, v, e=1e-9: all(abs(a - b) < e for a, b in zip(u, v))
assert close(conjugate_gradient(lambda v: [2 * v[0], 0.5 * v[1]], [1.0, 2.0]), [0.5, 4.0]) and close(conjugate_gradient(lambda v: [2 * v[0], 0.5 * v[1]], [1.0, 2.0], iters=1), [1.25, 2.5])
F, x = [[4.0, 1.0, 0.0], [1.0, 3.0, 1.0], [0.0, 1.0, 2.0]], [1.0, -2.0, 0.5]
Fv = lambda v: [sum(F[i][j] * v[j] for j in range(3)) for i in range(3)]
assert close(conjugate_gradient(Fv, Fv(x)), x) and conjugate_gradient(Fv, [0.0, 0.0, 0.0]) == [0.0, 0.0, 0.0]
assert abs(step_scale([1.0, 0.0], [2.0, 0.0], 0.01) - 0.1) < 1e-12 and abs(step_scale([1.0, 2.0], [2.0, 1.0], 0.02) - 0.1) < 1e-12` },
          { name: "search", code: `f, k = lambda t: -(t[0] - 1) ** 2, lambda t: t[0] ** 2 / 2
assert line_search([0.0], [4.0], f, k, 0.5) == ([1.0], 2) and line_search([0.0], [4.0], f, k, 0.5, backtracks=2) == ([0.0], None)
assert line_search([0.0], [1.0], f, k, 0.5) == ([1.0], 0) and line_search([1.0], [1.0], f, k, 10.0) == ([1.0], None)
t0 = [0.0]; line_search(t0, [4.0], f, k, 0.5)
assert t0 == [0.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With one probability list per sample, write <C>surrogate(new_probs, old_probs, actions, adv)</C>, the average of ratio
          times advantage; <C>mean_kl(old_probs, new_probs)</C>, the average of <M>{"\\mathrm{KL}(\\text{old} \\,\\|\\, \\text{new})"}</M>; and{" "}
          <C>fvp_softmax(pi, v)</C>, the Fisher-vector product for a softmax in its preferences.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def surrogate(new_probs, old_probs, actions, adv):
    return 0.0

def mean_kl(old_probs, new_probs):
    return 0.0

def fvp_softmax(pi, v):
    return list(v)
`,
        solution: SURROGATE,
        tests: [
          { name: "surrogate", code: `assert abs(surrogate([[0.6, 0.4], [0.5, 0.5]], [[0.5, 0.5], [0.5, 0.5]], [0, 1], [1.0, -2.0]) + 0.4) < 1e-12
assert abs(surrogate([[0.2, 0.8]], [[0.4, 0.6]], [1], [3.0]) - 4.0) < 1e-12
assert mean_kl([[0.5, 0.5]], [[0.5, 0.5]]) == 0 and abs(mean_kl([[1.0, 0.0], [0.5, 0.5]], [[0.5, 0.5], [0.5, 0.5]]) - math.log(2) / 2) < 1e-12` },
          { name: "fvp", code: `pi, v = [0.5, 0.3, 0.2], [1.0, -2.0, 0.5]
F = [[pi[i] * (i == j) - pi[i] * pi[j] for j in range(3)] for i in range(3)]
assert all(abs(a - sum(F[i][j] * v[j] for j in range(3))) < 1e-12 for i, a in enumerate(fvp_softmax(pi, v)))
assert all(abs(a) < 1e-12 for a in fvp_softmax(pi, [2.0, 2.0, 2.0])) and fvp_softmax([0.5, 0.5], [1.0, -1.0]) == [0.5, -0.5]` },
        ],
      },
    },
    {
      key: "beta",
      rung: "stretch",
      prompt: (
        <p>
          The policy gradient is g = (1, 2), the Fisher matrix is diag(2, 0.5) and δ = 0.01. What is the scale β of TRPO&apos;s full
          step? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0485, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        TRPO works, but conjugate gradient, Fisher-vector products and a line search make it awkward to implement and hard to
        combine with shared networks. PPO (l6.7.3) keeps the idea, staying close to the old policy, with nothing more than a
        clipped surrogate and ordinary minibatch gradient steps.
      </p>
    </>
  ),
};
