import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DualityGapViz } from "@/components/viz/DualityGapViz";
import type { LessonContent } from "@/lib/types";

const SETS = `import numpy as np

def value_set(f0, f1, xs):
    return f1(xs), f0(xs)

def primal_from_set(U, T):
    return float(T[U <= 0].min())

def dual_from_set(U, T, lams):
    g = np.array([(T + l * U).min() for l in lams])
    k = int(np.argmax(g))
    return float(lams[k]), float(g[k])`;

const LPD = `import numpy as np

def lp_pair(c, A, b, x, y, tol=1e-9):
    primal_ok = np.allclose(A @ x, b) and np.all(x >= -tol)
    dual_ok = np.all(A.T @ y <= c + tol)
    return bool(primal_ok), bool(dual_ok), float(c @ x), float(b @ y)

def comp_slack(c, A, x, y, tol=1e-9):
    return bool(np.all(np.abs(x * (c - A.T @ y)) <= tol))`;

export const lesson: LessonContent = {
  id: "m10.4.2",
  minutes: 55,
  links: {
    requires: ["m10.4.1", "m10.1.3"],
    revisits: ["m10.3.1"],
    foreshadows: ["m10.4.3", "m10.4.4"],
  },

  puzzle: (
    <>
      <p>
        Every choice of multipliers gives a lower bound, and the best of them is the dual optimal value d*. A primal
        feasible point gives an upper bound. If the two meet, you hold a proof of optimality that anyone can check in
        seconds. Do they always meet? If not, what property of the problem makes them meet?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Plot, for every x, the pair (constraint value, cost). The dual function at λ is where a line of slope −λ, resting
        below this cloud, crosses the vertical axis. The optimal value p* is the lowest point of the cloud on the feasible
        side. When the lower boundary of the cloud is convex, some resting line passes right through p*. When it has a
        dent, every line resting below the cloud misses p*, and a gap remains.
      </p>
      <DualityGapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the dual problem">
        <p>
          The dual problem is to maximise <M>{"g(\\lambda, \\nu)"}</M> subject to <M>{"\\lambda \\geq 0"}</M>, with optimal
          value d*. Weak duality, <M>{"d^* \\leq p^*"}</M>, holds always, and <M>{"p^* - d^*"}</M> is the duality gap.
          Strong duality means <M>{"d^* = p^*"}</M>. If x is feasible and (λ, ν) dual feasible, then{" "}
          <M>{"f_0(x) - g(\\lambda, \\nu)"}</M> bounds how far x is from optimal.
        </p>
        <Code>{SETS}</Code>
      </Definition>

      <Theorem title="Slater's condition">
        <p>
          Consider a convex problem: <M>{"f_0, f_1, \\dots, f_m"}</M> convex and equality constraints affine. If some x in the
          interior of the domain is strictly feasible, <M>{"f_i(x) < 0"}</M> for all i and Ax = b, and p* is finite, then{" "}
          <M>{"d^* = p^*"}</M> and the dual optimum is attained.
        </p>
      </Theorem>
      <Proof>
        <p>
          We give the proof without equality constraints. Let{" "}
          <M>{"\\mathcal A = \\{(u, t) : f_i(x) \\leq u_i \\text{ for all } i \\text{ and } f_0(x) \\leq t \\text{ for some } x\\}"}</M>,
          which is convex because the <M>{"f_i"}</M> are, and{" "}
          <M>{"\\mathcal B = \\{(0, s) : s < p^*\\}"}</M>. They are disjoint, since a common point would be a feasible x with
          cost below p*. A separating hyperplane gives <M>{"(\\tilde\\lambda, \\mu) \\neq 0"}</M> with{" "}
          <M>{"\\tilde\\lambda^\\top u + \\mu t \\geq \\mu p^*"}</M> on <M>{"\\mathcal A"}</M> (using that s can approach p*).
          Since u and t can be increased freely in <M>{"\\mathcal A"}</M>, <M>{"\\tilde\\lambda \\geq 0"}</M> and{" "}
          <M>{"\\mu \\geq 0"}</M>. If μ were 0, then <M>{"\\tilde\\lambda^\\top f(x) \\geq 0"}</M> for all x, which fails at the
          Slater point because <M>{"\\tilde\\lambda \\neq 0"}</M> and <M>{"f_i(x) < 0"}</M>. So μ &gt; 0; dividing by it and
          setting <M>{"\\lambda = \\tilde\\lambda/\\mu"}</M>, the point <M>{"(f(x), f_0(x)) \\in \\mathcal A"}</M> gives{" "}
          <M>{"L(x, \\lambda) \\geq p^*"}</M> for every x. Hence <M>{"g(\\lambda) \\geq p^* \\geq d^* \\geq g(\\lambda)"}</M>.
        </p>
      </Proof>

      <Theorem title="LP duality">
        <p>
          The LP of minimising <M>{"c^\\top x"}</M> subject to Ax = b, x ≥ 0 has the dual: maximise <M>{"b^\\top y"}</M> subject
          to <M>{"A^\\top y \\leq c"}</M>. If either has a finite optimum, both do and the values agree. Feasible x and y are
          both optimal exactly when <M>{"x_k(c - A^\\top y)_k = 0"}</M> for every k (complementary slackness).
        </p>
      </Theorem>
      <Proof>
        <p>
          The dual is the previous lesson&apos;s, with y = −ν. For feasible x and y,{" "}
          <M>{"c^\\top x - b^\\top y = c^\\top x - y^\\top Ax = x^\\top(c - A^\\top y) \\geq 0"}</M>, a sum of nonnegative
          terms, which is weak duality; it is zero exactly when every term vanishes, which proves the complementary
          slackness criterion. That a zero-gap pair exists is strong duality for LPs, which follows from a refined Slater
          condition (linear inequalities need not hold strictly) or from Farkas&apos; lemma; we take it as given.
        </p>
        <Code>{LPD}</Code>
      </Proof>

      <Remark title="when duality fails or is fragile">
        <p>
          In the code, the non-convex problem with cost min((x + 2)², (x − 2)² + 0.5) and constraint x ≥ 0 has p* = 0.5 but
          d* = 0.2461, reached at λ = 0.125; the convex problem x² with x ≥ 1 has p* = d* = 1 at λ = 2. The LP pair x =
          (0.5, 0.5, 0), y = (1.5, −0.5) have equal values 1.5 and satisfy complementary slackness, so both are optimal; x =
          (0, 0, 1) with y = (1, 0) only shows the optimum lies between 1 and 3. Without Slater&apos;s condition the dual
          optimum may not be attained: for minimising x subject to x² ≤ 0, p* = 0 and{" "}
          <M>{"g(\\lambda) = -1/(4\\lambda)"}</M> approaches 0 but never reaches it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cert",
      rung: "check",
      prompt: <p>A feasible point has cost 3 and a dual feasible point has dual value 1. At most how far above the optimal value can the feasible point be?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "noattain",
      rung: "check",
      prompt: <p>For minimising x subject to x² ≤ 0, the dual function is g(λ) = −1/(4λ). What is g(0.25)?</p>,
      answer: { kind: "numeric", value: -1, tolerance: 0.0001 },
    },
    {
      key: "slater",
      rung: "apply",
      prompt: <p>Which assumption guarantees strong duality for a convex problem with finite optimal value?</p>,
      answer: {
        kind: "choice",
        options: [
          "Some point satisfies every inequality constraint strictly and every equality constraint",
          "The objective is differentiable",
          "The feasible set is bounded",
          "The dual function is concave",
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

def value_set(f0, f1, xs):
    return f1(xs), f0(xs)

def primal_from_set(U, T):
    return float(T[U <= 0].min())

def dual_from_set(U, T, lams):
    g = np.array([(T + l * U).min() for l in lams])
    k = int(np.argmax(g))
    return float(lams[k]), float(g[k])

xs = np.linspace(-6, 6, 120001); lams = np.linspace(0, 2, 2001)
f0 = lambda x: np.minimum((x + 2) ** 2, (x - 2) ** 2 + 0.5); f1 = lambda x: -x
U, T = value_set(f0, f1, xs)
print(round(primal_from_set(U, T), 4), [round(v, 4) for v in dual_from_set(U, T, lams)])
U2, T2 = value_set(lambda x: x ** 2, lambda x: 1 - x, xs)
print(round(primal_from_set(U2, T2), 4), [round(v, 4) for v in dual_from_set(U2, T2, np.linspace(0, 5, 501))])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 [0.125, 0.2461]\n1.0 [2.0, 1.0]", "0.5 [0.125, 0.5]\n1.0 [2.0, 1.0]", "0.0 [0.125, 0.2461]\n1.0 [2.0, 1.0]", "0.5 [0.125, 0.2461]\n1.0 [1.0, 0.75]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def lp_pair(c, A, b, x, y, tol=1e-9):
    primal_ok = np.allclose(A @ x, b) and np.all(x >= -tol)
    dual_ok = np.all(A.T @ y <= c + tol)
    return bool(primal_ok), bool(dual_ok), float(c @ x), float(b @ y)

def comp_slack(c, A, x, y, tol=1e-9):
    return bool(np.all(np.abs(x * (c - A.T @ y)) <= tol))

c = np.array([1.0, 2.0, 3.0]); A = np.array([[1.0, 1.0, 1.0], [1.0, -1.0, 0.0]]); b = np.array([1.0, 0.0])
x = np.array([0.5, 0.5, 0.0]); y = np.array([1.5, -0.5])
print(lp_pair(c, A, b, x, y), comp_slack(c, A, x, y))
print(lp_pair(c, A, b, np.array([0.0, 0.0, 1.0]), np.array([1.0, 0.0])), comp_slack(c, A, np.array([0.0, 0.0, 1.0]), y))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(True, True, 1.5, 1.5) True\n(True, True, 3.0, 1.0) False", "(True, True, 1.5, 1.5) True\n(True, False, 3.0, 1.0) False", "(True, True, 1.5, 1.5) False\n(True, True, 3.0, 1.0) False", "(True, True, 1.5, -1.5) True\n(True, True, 3.0, 1.0) False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a one-variable problem sampled on a grid, write <C>value_set(f0, f1, xs)</C>, returning the arrays U = f1(xs)
          and T = f0(xs), <C>primal_from_set(U, T)</C>, the smallest T with U ≤ 0, and{" "}
          <C>dual_from_set(U, T, lams)</C>, returning the λ with the largest min(T + λU) and that value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def value_set(f0, f1, xs):
    return xs, xs

def primal_from_set(U, T):
    return 0.0

def dual_from_set(U, T, lams):
    return 0.0, 0.0
`,
        solution: SETS,
        tests: [
          { name: "set", code: `xs = np.linspace(-5, 5, 10001); U, T = value_set(lambda x: (x - 3) ** 2, lambda x: x - 1, xs)
assert abs(primal_from_set(U, T) - 4.0) < 1e-9` },
          { name: "dual", code: `xs = np.linspace(-5, 5, 10001); U, T = value_set(lambda x: (x - 3) ** 2, lambda x: x - 1, xs)
l, v = dual_from_set(U, T, np.linspace(0, 10, 1001))
assert abs(l - 4.0) < 1e-9 and abs(v - 4.0) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For the LP pair (minimise cᵀx subject to Ax = b, x ≥ 0) and (maximise bᵀy subject to Aᵀy ≤ c), write{" "}
          <C>lp_pair(c, A, b, x, y, tol=1e-9)</C>, returning (x feasible, y feasible, cᵀx, bᵀy), and{" "}
          <C>comp_slack(c, A, x, y, tol=1e-9)</C>, checking xₖ(c − Aᵀy)ₖ = 0 for every k.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lp_pair(c, A, b, x, y, tol=1e-9):
    return True, True, 0.0, 0.0

def comp_slack(c, A, x, y, tol=1e-9):
    return True
`,
        solution: LPD,
        tests: [
          { name: "pair", code: `c = np.array([2.0, 3.0]); A = np.array([[1.0, 1.0]]); b = np.array([4.0])
assert lp_pair(c, A, b, np.array([4.0, 0.0]), np.array([2.0])) == (True, True, 8.0, 8.0) and lp_pair(c, A, b, np.array([5.0, -1.0]), np.array([2.5]))[:2] == (False, False)` },
          { name: "cs", code: `c = np.array([2.0, 3.0]); A = np.array([[1.0, 1.0]])
assert comp_slack(c, A, np.array([4.0, 0.0]), np.array([2.0])) and not comp_slack(c, A, np.array([0.0, 4.0]), np.array([2.0]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For the LP pair minimise cᵀx subject to Ax = b, x ≥ 0 and maximise bᵀy subject to Aᵀy ≤ c, prove that cᵀx ≥ bᵀy for
          every feasible x and y, and that if cᵀx = bᵀy then both x and y are optimal.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes cᵀx − bᵀy = cᵀx − yᵀAx = xᵀ(c − Aᵀy) using Ax = b.",
          "Notes each term xₖ(c − Aᵀy)ₖ is nonnegative because x ≥ 0 and Aᵀy ≤ c, giving weak duality.",
          "Argues that if the values are equal then no feasible x′ has smaller cost (it would be below bᵀy) and no feasible y′ has larger value, so both are optimal.",
        ],
      },
    },
    {
      key: "lstar",
      rung: "stretch",
      prompt: <p>For the non-convex problem in the code, g(λ) = 2λ − λ²/4 for λ ≤ 1/8 and 0.5 − 2λ − λ²/4 for λ ≥ 1/8. What is d*? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2461, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the dual problem is, why weak duality always holds, what Slater's condition is and why it closes the gap for convex problems, how LP duality and complementary slackness certify optimality, and how a non-convex problem can leave a gap.",

  glimpse: (
    <>
      <p>
        When strong duality holds, the primal and dual optima are tied together by a short list of conditions: feasibility,
        a stationarity equation and complementary slackness. These KKT conditions are what most algorithms actually solve.
      </p>
    </>
  ),
};
