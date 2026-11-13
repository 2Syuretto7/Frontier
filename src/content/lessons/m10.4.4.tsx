import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SensitivityViz } from "@/components/viz/SensitivityViz";
import type { LessonContent } from "@/lib/types";

const LN = `import numpy as np

def least_norm_value(A, b):
    return float(b @ np.linalg.solve(A @ A.T, b))

def least_norm_nu(A, b):
    return -2 * np.linalg.solve(A @ A.T, b)

def fd_grad(f, v, h=1e-6):
    E = np.eye(len(v))
    return np.array([(f(v + h * e) - f(v - h * e)) / (2 * h) for e in E])`;

const CAP = `import numpy as np

def level(alpha, total):
    a = np.sort(alpha)
    for k in range(len(a), 0, -1):
        L = (total + a[:k].sum()) / k
        if L > a[k - 1]:
            return float(L)

def capacity(alpha, total):
    return float(np.log(np.maximum(alpha, level(alpha, total))).sum())`;

export const lesson: LessonContent = {
  id: "m10.4.4",
  minutes: 45,
  links: {
    requires: ["m10.4.3", "m10.2.3"],
    revisits: ["m10.4.2"],
    foreshadows: ["m10.5.1"],
  },

  puzzle: (
    <>
      <p>
        A factory&apos;s production plan is optimal, and the manager is offered one more hour of machine time for a fee. Is
        it worth buying? Re-solving the whole problem for every possible offer is one answer. The multipliers from the
        solution you already have give another, immediately. How much is a little more of each resource worth, and when is
        that estimate trustworthy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Loosen a constraint and the optimal cost can only go down; tighten it and the cost goes up. The optimal multiplier
        of a constraint is exactly the rate of that change. A large multiplier marks a constraint the solution is pressing
        hard against; a zero multiplier marks one that does not matter at the margin. For convex problems the multiplier
        gives more than a rate: a straight-line bound that holds for any size of change.
      </p>
      <SensitivityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the perturbed problem">
        <p>
          For a convex problem, let <M>{"p^*(u, v)"}</M> be the optimal value of minimising <M>{"f_0(x)"}</M> subject to{" "}
          <M>{"f_i(x) \\leq u_i"}</M> and <M>{"h_j(x) = v_j"}</M>, so <M>{"p^*(0, 0) = p^*"}</M>. It is a convex function of
          (u, v): it is the partial minimum over x of <M>{"f_0(x)"}</M> restricted to the set of (x, u, v) satisfying the
          constraints, which is convex.
        </p>
      </Definition>

      <Theorem title="global sensitivity">
        <p>If strong duality holds and (λ*, ν*) is dual optimal, then for all u and v,</p>
        <MD>{"p^*(u, v) \\geq p^*(0, 0) - \\lambda^{*\\top}u - \\nu^{*\\top}v."}</MD>
      </Theorem>
      <Proof>
        <p>Let x be feasible for the perturbed problem. Then</p>
        <MD>{"p^*(0, 0) = g(\\lambda^*, \\nu^*) \\leq f_0(x) + \\sum_i\\lambda_i^*f_i(x) + \\sum_j\\nu_j^*h_j(x) \\leq f_0(x) + \\lambda^{*\\top}u + \\nu^{*\\top}v,"}</MD>
        <p>
          using <M>{"\\lambda^* \\geq 0"}</M>, <M>{"f_i(x) \\leq u_i"}</M> and <M>{"h_j(x) = v_j"}</M>. Rearranging and taking
          the infimum over such x gives the claim.
        </p>
      </Proof>

      <Theorem title="local sensitivity">
        <p>
          If, in addition, <M>{"p^*(u, v)"}</M> is differentiable at 0, then{" "}
          <M>{"\\lambda_i^* = -\\partial p^*/\\partial u_i"}</M> and <M>{"\\nu_j^* = -\\partial p^*/\\partial v_j"}</M> at 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take <M>{"u = te_i"}</M>, v = 0. The global bound gives{" "}
          <M>{"\\frac{p^*(te_i, 0) - p^*}{t} \\geq -\\lambda_i^*"}</M> for t &gt; 0 and the reverse inequality for t &lt; 0.
          Letting t → 0 from each side, the derivative is both at least and at most <M>{"-\\lambda_i^*"}</M>. The same
          argument applies to each <M>{"v_j"}</M>.
        </p>
        <Code>{LN}</Code>
      </Proof>

      <Remark title="reading the multipliers">
        <p>
          Tightening constraint i by a small amount ε raises the optimal value by about <M>{"\\lambda_i^*\\varepsilon"}</M>,
          and by at least that much for any ε; loosening it lowers the value by about <M>{"\\lambda_i^*\\varepsilon"}</M>,
          though possibly by more for large ε, as the convex curve in the viz shows. If <M>{"\\lambda_i^* = 0"}</M>, small
          changes to constraint i do not affect the optimum to first order. In an LP whose constraints are resource limits,
          the multipliers are shadow prices: the most you should pay for one more unit of each resource. In the code, the
          least-norm problem with constraints x₁ + x₂ + x₃ = 3 and x₁ − x₂ = 1 has value 3.5 and ν* = (−2, −1), and a
          finite-difference gradient of the value with respect to b is (2, 1) = −ν*. For water-filling with budget 1,
          the level is 0.6, and the marginal capacity of extra budget is 1/0.6 ≈ 1.6667, which is the multiplier of the
          budget constraint.
        </p>
        <Code>{CAP}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pred",
      rung: "check",
      prompt: <p>An optimal value is 10 and the multiplier of a constraint is 3. Using the local sensitivity, what is the predicted optimal value after loosening that constraint by 0.1?</p>,
      answer: { kind: "numeric", value: 9.7, tolerance: 0.0001 },
    },
    {
      key: "db",
      rung: "check",
      prompt: <p>Minimise ‖x‖² subject to x₁ + x₂ = b. At b = 2, what is the derivative of the optimal value with respect to b?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>The optimal multiplier of an inequality constraint is 0. What does that tell you?</p>,
      answer: {
        kind: "choice",
        options: [
          "Small changes to that constraint do not change the optimal value to first order",
          "The constraint can be deleted without changing the optimal value, whatever its size",
          "The constraint is tight at the optimum",
          "The problem has no optimal solution",
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

def least_norm_value(A, b):
    return float(b @ np.linalg.solve(A @ A.T, b))

def least_norm_nu(A, b):
    return -2 * np.linalg.solve(A @ A.T, b)

def fd_grad(f, v, h=1e-6):
    E = np.eye(len(v))
    return np.array([(f(v + h * e) - f(v - h * e)) / (2 * h) for e in E])

A = np.array([[1.0, 1.0, 1.0], [1.0, -1.0, 0.0]]); b = np.array([3.0, 1.0])
print(round(least_norm_value(A, b), 4), np.round(least_norm_nu(A, b), 4))
g = fd_grad(lambda v: least_norm_value(A, b + v), np.zeros(2))
print(np.round(g, 4), np.allclose(g, -least_norm_nu(A, b), atol=1e-5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.5 [-2. -1.]\n[2. 1.] True", "3.5 [-2. -1.]\n[-2. -1.] False", "3.5 [2. 1.]\n[2. 1.] False", "5.0 [-2. -1.]\n[2. 1.] True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def level(alpha, total):
    a = np.sort(alpha)
    for k in range(len(a), 0, -1):
        L = (total + a[:k].sum()) / k
        if L > a[k - 1]:
            return float(L)

def capacity(alpha, total):
    return float(np.log(np.maximum(alpha, level(alpha, total))).sum())

alpha = np.array([0.2, 0.5, 1.0, 0.1])
print(level(alpha, 1.0), round(capacity(alpha, 1.0), 4))
h = 1e-5
print(round((capacity(alpha, 1 + h) - capacity(alpha, 1 - h)) / (2 * h), 4), round(1 / level(alpha, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.6 -1.5325\n1.6667 1.6667", "0.6 -1.5325\n0.6 1.6667", "0.45 -1.5325\n1.6667 1.6667", "0.6 1.5325\n1.6667 1.6667"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>least_norm_value(A, b)</C>, the optimal value of minimising ‖x‖² subject to Ax = b (A with full row rank),{" "}
          <C>least_norm_nu(A, b)</C>, the optimal multiplier, and <C>fd_grad(f, v, h=1e-6)</C>, a central-difference
          gradient.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def least_norm_value(A, b):
    return 0.0

def least_norm_nu(A, b):
    return np.zeros(len(b))

def fd_grad(f, v, h=1e-6):
    return np.zeros(len(v))
`,
        solution: LN,
        tests: [
          { name: "value", code: `A = np.array([[1.0, 1.0]]); b = np.array([2.0])
assert abs(least_norm_value(A, b) - 2.0) < 1e-12 and np.allclose(least_norm_nu(A, b), [-2.0])` },
          { name: "grad", code: `A = np.array([[1.0, 0.0, 2.0], [0.0, 1.0, 1.0]]); b = np.array([1.0, -1.0])
g = fd_grad(lambda v: least_norm_value(A, b + v), np.zeros(2))
assert np.allclose(g, -least_norm_nu(A, b), atol=1e-5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>level(alpha, total)</C>, the water-filling level in closed form (sort the floors and find the largest
          number k of filled channels with level above the k-th floor), and <C>capacity(alpha, total)</C>, the optimal
          Σ log(αᵢ + xᵢ).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def level(alpha, total):
    return 0.0

def capacity(alpha, total):
    return 0.0
`,
        solution: CAP,
        tests: [
          { name: "level", code: `assert abs(level(np.array([0.0, 1.0]), 3.0) - 2.0) < 1e-12 and abs(level(np.array([0.0, 1.0]), 0.5) - 0.5) < 1e-12` },
          { name: "cap", code: `a = np.array([0.3, 0.9, 0.5]); h = 1e-6
d = (capacity(a, 0.8 + h) - capacity(a, 0.8 - h)) / (2 * h)
assert abs(d - 1 / level(a, 0.8)) < 1e-5 and abs(capacity(a, 0.0 + 1e-12) - np.log(a).sum()) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Assume strong duality holds for a problem with dual optimum (λ*, ν*). Prove that the perturbed optimal value
          satisfies p*(u, v) ≥ p*(0, 0) − λ*ᵀu − ν*ᵀv for all u, v.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Starts from p*(0, 0) = g(λ*, ν*) ≤ L(x, λ*, ν*) for any x, using strong duality and the definition of g.",
          "For x feasible for the perturbed problem, bounds Σλᵢ*fᵢ(x) ≤ λ*ᵀu (using λ* ≥ 0) and Σνⱼ*hⱼ(x) = ν*ᵀv.",
          "Rearranges to f₀(x) ≥ p*(0, 0) − λ*ᵀu − ν*ᵀv and takes the infimum over perturbed-feasible x.",
        ],
      },
    },
    {
      key: "marg",
      rung: "stretch",
      prompt: <p>Water-filling with floors (0, 1) and budget 3. What is the marginal capacity, the rate at which the optimal Σ log(αᵢ + xᵢ) grows with the budget?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the perturbed optimal value is, why the optimal multipliers give a global linear lower bound on it, why they equal minus its derivatives when it is differentiable, and how this makes multipliers into prices for resources.",

  glimpse: (
    <>
      <p>
        Duality tells you what an optimum looks like. The next chapter turns to how to reach one, starting with the
        simplest algorithm, gradient descent, and the inequality that guarantees each step makes progress.
      </p>
    </>
  ),
};
