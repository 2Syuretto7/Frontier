import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RidgeLambdaViz } from "@/components/viz/RidgeLambdaViz";
import type { LessonContent } from "@/lib/types";

const TRADE = `import math

def excess_bound(lam, B, rho, m):
    return lam * B * B + 2 * rho * rho / (lam * m)

def best_lambda(B, rho, m):
    return math.sqrt(2 * rho * rho / (B * B * m))

def best_excess(B, rho, m):
    return rho * B * math.sqrt(8 / m)`;

const SRM = `import math

def srm_weight(n):
    return 6 / (math.pi ** 2 * n * n)

def srm_bound(emp, size, n, m, delta):
    return emp + math.sqrt((math.log(size) + math.log(2 / (srm_weight(n) * delta))) / (2 * m))

def srm_select(candidates, m, delta):
    return min(range(len(candidates)), key=lambda k: srm_bound(candidates[k][2], candidates[k][1], candidates[k][0], m, delta))`;

export const lesson: LessonContent = {
  id: "m16.4.2",
  minutes: 40,
  links: {
    requires: ["m16.4.1"],
    revisits: ["m16.1.2", "m9.6.4"],
    foreshadows: ["m16.5.2", "m16.7.4"],
  },

  puzzle: (
    <>
      <p>
        Weight decay appears in almost every training recipe, usually with a coefficient found by trial and error. Too little
        and the model memorises; too much and it cannot fit anything. Is there a principled value, how should it change as the
        data set grows, and what does the answer cost when the scale of the ideal solution is unknown?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A penalty λ‖w‖² does two things. It biases the solution towards small weights, which costs at most λ times the
        squared norm of the best predictor. And it makes the algorithm stable, which bounds the generalisation gap by a term
        that shrinks like 1/(λm). The first grows with λ and the second falls, so the best λ balances them, and it falls as the
        data set grows.
      </p>
      <RidgeLambdaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="regularised loss minimisation">
        <p>
          Given a convex loss ℓ, regularised loss minimisation returns{" "}
          <M>{"A(S) = \\arg\\min_w \\big(L_S(w) + \\lambda\\|w\\|^2\\big)"}</M>. Ridge regression and the soft-margin support vector
          machine are instances, with the squared and hinge losses.
        </p>
      </Definition>

      <Theorem title="an oracle inequality">
        <p>
          If ℓ is convex and ρ-Lipschitz, then for every w* with <M>{"\\|w^*\\| \\le B"}</M>,
        </p>
        <MD>{"\\mathbb E_S\\big[L_D(A(S))\\big] \\le L_D(w^*) + \\lambda B^2 + \\frac{2\\rho^2}{\\lambda m},"}</MD>
        <p>
          and choosing <M>{"\\lambda = \\sqrt{2\\rho^2/(B^2 m)}"}</M> gives excess risk at most{" "}
          <M>{"\\rho B\\sqrt{8/m}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\mathbb E L_D(A(S)) = \\mathbb E L_S(A(S)) + \\mathbb E[L_D(A(S)) - L_S(A(S))]"}</M>. The second term is at
          most the stability rate <M>{"2\\rho^2/(\\lambda m)"}</M> (m16.4.1). For the first, A(S) minimises the regularised
          objective, so{" "}
          <M>{"L_S(A(S)) \\le L_S(A(S)) + \\lambda\\|A(S)\\|^2 \\le L_S(w^*) + \\lambda\\|w^*\\|^2"}</M>, whose expectation is at most{" "}
          <M>{"L_D(w^*) + \\lambda B^2"}</M> (<C>excess_bound</C>). The sum <M>{"\\lambda B^2 + 2\\rho^2/(\\lambda m)"}</M> is
          minimised where its derivative vanishes, at the stated λ, where both terms equal{" "}
          <M>{"\\rho B\\sqrt{2/m}"}</M> (<C>best_lambda</C>, <C>best_excess</C>).
        </p>
        <Code>{TRADE}</Code>
      </Proof>

      <Remark title="what the rate says">
        <p>
          The excess risk falls like <M>{"1/\\sqrt m"}</M> with a constant that depends on the norm of the comparator and the
          Lipschitz constant, not on the dimension: the same picture as the margin bound (m16.3.2), reached through stability
          instead of uniform convergence. The optimal λ shrinks like <M>{"1/\\sqrt m"}</M>. For smooth losses, or when the
          loss at w* is small, faster rates and smaller λ are possible. In practice λ is tuned on held-out data, which is a
          small finite class and costs little by the bounds of m16.2.1.
        </p>
      </Remark>

      <Definition title="structural risk minimisation">
        <p>
          When the right complexity is unknown, take a nested sequence of classes <M>{"H_1 \\subset H_2 \\subset \\cdots"}</M>,
          assign them prior weights <M>{"w_n"}</M> with <M>{"\\sum_n w_n \\le 1"}</M>, for instance{" "}
          <M>{"w_n = 6/(\\pi^2 n^2)"}</M> (<C>srm_weight</C>), and run each class&apos;s bound with confidence{" "}
          <M>{"w_n\\delta"}</M>. By the union bound, all hold simultaneously with probability at least 1 − δ. For finite classes,
        </p>
        <MD>{"L_D(h) \\le L_S(h) + \\sqrt{\\frac{\\ln|H_n| + \\ln(2/(w_n\\delta))}{2m}} \\quad\\text{for all } n \\text{ and } h \\in H_n,"}</MD>
        <p>
          and SRM returns the hypothesis minimising the right-hand side (<C>srm_bound</C>, <C>srm_select</C>). With few
          examples it prefers a simple class with higher training error; with many it can afford a richer one.
        </p>
        <Code>{SRM}</Code>
      </Definition>

      <Remark title="penalties and priors">
        <p>
          A penalty <M>{"\\lambda\\|w\\|^2"}</M> and a prior weight <M>{"w_n"}</M> play the same role: they encode which
          hypotheses we are willing to believe with little evidence. Read as a negative log prior, the squared norm is a Gaussian
          prior and regularised minimisation is MAP estimation (m9.6.4). PAC-Bayes bounds (m16.7.4) make this correspondence
          exact, with the KL divergence from the prior as the complexity term.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "excess",
      rung: "check",
      prompt: <p>A 0.5-Lipschitz convex loss, a comparator of norm 3, and m = 900 examples. What excess risk bound ρB√(8/m) does tuned regularisation give? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1414, tolerance: 0.0001 },
    },
    {
      key: "srm",
      rung: "check",
      prompt: <p>In SRM with weights 6/(π²n²), class 4 has 10^6 hypotheses. A hypothesis in it has training error 0.05 on m = 10000 examples. What is its bound at δ = 0.01? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0835, tolerance: 0.0001 },
    },
    {
      key: "weights",
      rung: "apply",
      prompt: <p>Why must the SRM weights w_n sum to at most 1?</p>,
      answer: {
        kind: "choice",
        options: [
          "Class n is allowed failure probability w_n δ, so by the union bound the chance that any class's bound fails is at most δ times the sum",
          "So that the weights can be read as the sizes of the classes",
          "Because the classes are disjoint",
          "Otherwise the training error could exceed 1",
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

def excess_bound(lam, B, rho, m):
    return lam * B * B + 2 * rho * rho / (lam * m)

def best_lambda(B, rho, m):
    return math.sqrt(2 * rho * rho / (B * B * m))

def best_excess(B, rho, m):
    return rho * B * math.sqrt(8 / m)

print(round(excess_bound(0.1, 2, 1, 100), 4), round(best_lambda(2, 1, 50), 4), round(best_excess(2, 1, 50), 4))
print(round(excess_bound(best_lambda(2, 1, 50), 2, 1, 50), 4), excess_bound(1.0, 0, 1, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6 0.1 0.8\n0.8 0.5",
          "0.6 0.1 0.4\n0.8 0.5",
          "0.6 0.01 0.8\n0.8 0.5",
          "0.6 0.1 0.8\n0.4 0.5",
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

def srm_weight(n):
    return 6 / (math.pi ** 2 * n * n)

def srm_bound(emp, size, n, m, delta):
    return emp + math.sqrt((math.log(size) + math.log(2 / (srm_weight(n) * delta))) / (2 * m))

def srm_select(candidates, m, delta):
    return min(range(len(candidates)), key=lambda k: srm_bound(candidates[k][2], candidates[k][1], candidates[k][0], m, delta))

print(round(srm_weight(1), 4), round(srm_bound(0.1, 1, 1, 200, 0.05), 4))
C = [(1, 2, 0.3), (2, 1000, 0.1), (3, 10 ** 9, 0.08)]; print(srm_select(C, 500, 0.05), srm_select(C, 50000, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6079 0.2023\n1 2",
          "0.6079 0.2023\n1 1",
          "0.6079 0.2023\n0 2",
          "0.6079 0.1023\n1 2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>excess_bound(lam, B, rho, m)</C>, <C>best_lambda(B, rho, m)</C> and <C>best_excess(B, rho, m)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def excess_bound(lam, B, rho, m):
    return lam * B * B

def best_lambda(B, rho, m):
    return 1.0

def best_excess(B, rho, m):
    return 0.0
`,
        solution: TRADE,
        tests: [
          { name: "bound", code: `assert excess_bound(0.5, 2, 1, 4) == 3.0 and best_lambda(1, 2, 8) == 1.0 and abs(best_excess(1, 1, 8) - 1.0) < 1e-12` },
          { name: "optimum", code: `lam = best_lambda(3, 0.7, 50); v = excess_bound(lam, 3, 0.7, 50)
assert abs(v - best_excess(3, 0.7, 50)) < 1e-12 and excess_bound(lam * 1.1, 3, 0.7, 50) > v and excess_bound(lam * 0.9, 3, 0.7, 50) > v` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>srm_weight(n)</C>, <C>srm_bound(emp, size, n, m, delta)</C> and <C>srm_select(candidates, m, delta)</C>,
          where each candidate is (n, size, emp) and the result is the index with the smallest bound.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def srm_weight(n):
    return 1.0

def srm_bound(emp, size, n, m, delta):
    return emp

def srm_select(candidates, m, delta):
    return 0
`,
        solution: SRM,
        tests: [
          { name: "weights", code: `assert abs(sum(srm_weight(n) for n in range(1, 100000)) - 1) < 1e-4 and abs(srm_bound(0.2, 1, 1, 1, 2 / srm_weight(1)) - 0.2) < 1e-12` },
          { name: "select", code: `assert srm_select([(1, 1, 0.5), (2, 1, 0.0)], 10 ** 9, 0.1) == 1 and srm_select([(1, 1, 0.1), (2, 10 ** 12, 0.09)], 100, 0.1) == 0` },
        ],
      },
    },
    {
      key: "misspecified",
      rung: "stretch",
      prompt: (
        <p>
          With ρ = 1 and m = 1250, λ is tuned assuming B = 1, but the best predictor actually has norm 3. What is the resulting
          bound λB² + 2ρ²/(λm) on the excess risk, using B = 3?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Regularised linear methods depend on the data only through inner products. The next part replaces those inner
        products by a kernel, which turns the same theory into a theory of learning in infinite-dimensional function spaces.
      </p>
    </>
  ),
};
