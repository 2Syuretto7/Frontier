import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PowerSumRootsViz } from "@/components/viz/PowerSumRootsViz";
import type { LessonContent } from "@/lib/types";

const POOL = `import numpy as np

def pool(H, how):
    return {"sum": H.sum(axis=0), "mean": H.mean(axis=0), "max": H.max(axis=0)}[how]

def power_sums(x, n):
    return np.array([np.sum(x ** k) for k in range(1, n + 1)])

def deep_set(X, phi, rho):
    return rho(phi(X).sum(axis=0))`;

const NEWTON = `import numpy as np
from itertools import permutations

def elementary(p):
    e = [1.0]
    for k in range(1, len(p) + 1):
        e.append(sum((-1) ** (i - 1) * e[k - i] * p[i - 1] for i in range(1, k + 1)) / k)
    return np.array(e)

def recover(p):
    e = elementary(p)
    coeffs = [(-1) ** k * e[k] for k in range(len(e))]
    return np.sort(np.roots(coeffs).real) + 0.0

def symmetrise(f, X):
    return float(np.mean([f(X[list(s)]) for s in permutations(range(len(X)))]))`;

export const lesson: LessonContent = {
  id: "l4.5.1",
  minutes: 50,
  links: {
    requires: ["l4.4.3"],
    revisits: ["l4.1.2", "l4.1.1"],
    foreshadows: ["l4.5.2"],
  },

  puzzle: (
    <>
      <p>
        A point cloud from a lidar scanner, the atoms of a molecule, the players on a pitch: in each case the data is a set,
        and listing it in a different order should not change the answer. An MLP on the concatenated list does change its
        answer, and would need to see every one of the n! orderings to learn not to. Is there a way to build order-blindness
        into the architecture without losing the ability to represent any function of the set?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Apply the same small network to every element, add up the results, and feed the sum to a second network. Addition
        does not care about order, so the whole function does not either. The surprise is that nothing is lost: with a rich
        enough per-element feature, the sum determines the set completely, so any order-blind function can be written this
        way. For sets of numbers the sums of powers already suffice, as the figure shows by rebuilding a set from its power sums.
      </p>
      <PowerSumRootsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="invariance and equivariance">
        <p>
          A function f on lists of n elements is permutation invariant if <M>{"f(x_{\\pi(1)}, \\dots, x_{\\pi(n)}) = f(x_1, \\dots, x_n)"}</M>{" "}
          for every permutation π, and a function F producing one output per element is equivariant if permuting the inputs
          permutes the outputs in the same way. Self-attention without positions is equivariant; pooling its output gives an
          invariant function. The Deep Sets architecture is <M>{"f(X) = \\rho\\bigl(\\sum_{x \\in X}\\varphi(x)\\bigr)"}</M> with φ
          and ρ neural networks; sum can be replaced by mean or max at some cost.
        </p>
        <Code>{POOL}</Code>
      </Definition>

      <Theorem title="sum decomposition is universal for sets of numbers">
        <p>
          Let f be a permutation-invariant function of n real numbers. With{" "}
          <M>{"\\varphi(x) = (x, x^2, \\dots, x^n)"}</M> there is a function ρ on <M>{"\\mathbb R^n"}</M> with{" "}
          <M>{"f(X) = \\rho\\bigl(\\sum_{x \\in X}\\varphi(x)\\bigr)"}</M> for every multiset X of size n.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum is the vector of power sums <M>{"p_k = \\sum_i x_i^k"}</M>. Newton&apos;s identities{" "}
          <M>{"k e_k = \\sum_{i=1}^{k} (-1)^{i-1} e_{k-i} p_i"}</M>, with <M>{"e_0 = 1"}</M>, determine the elementary symmetric
          polynomials <M>{"e_1, \\dots, e_n"}</M> from <M>{"p_1, \\dots, p_n"}</M>. These are, up to sign, the coefficients of{" "}
          <M>{"\\prod_i (t - x_i)"}</M>, whose roots with multiplicity are the multiset, by the fundamental theorem of algebra. So
          the map from multisets to power sums is injective, and ρ can be defined on its image as f of the unique preimage.
          The ρ so built may be badly behaved; in practice φ is learned and wider than n.
        </p>
        <Code>{NEWTON}</Code>
      </Proof>

      <Theorem title="equivariant linear layers">
        <p>
          A linear map <M>{"L: \\mathbb R^n \\to \\mathbb R^n"}</M> commutes with every permutation matrix if and only if{" "}
          <M>{"L = aI + b\\mathbf 1\\mathbf 1^\\top"}</M> for scalars a and b.
        </p>
      </Theorem>
      <Proof>
        <p>
          Such an L commutes with permutations, since <M>{"P\\mathbf 1 = \\mathbf 1"}</M>. Conversely, if{" "}
          <M>{"PL = LP"}</M> for all P then <M>{"L_{\\pi(i)\\pi(j)} = L_{ij}"}</M> for every π. Any diagonal position can be moved to
          any other, so all diagonal entries equal some a + b, and any off-diagonal pair (i, j) with i ≠ j can be moved to any
          other, so all off-diagonal entries equal some b. An equivariant layer thus mixes each element with the sum of all of
          them, which is exactly the structure Deep Sets and message passing generalise.
        </p>
      </Proof>

      <Example title="choosing the pooling">
        <p>
          With φ the identity, the sets {"{1, 3}"}, {"{1, 1, 3, 3}"} and {"{1, 3, 3}"} have sums 4, 8 and 7, means 2, 2 and 2.333,
          and maxima 3, 3 and 3. Mean pooling cannot see multiplicity scaled uniformly, and max pooling cannot count at all, but
          both are bounded in the set size, which helps when test sets are larger than training sets. Sum pooling is the most
          expressive and the least stable.
        </p>
      </Example>

      <Remark title="symmetrising instead of designing">
        <p>
          Any function can be made invariant by averaging it over all orderings, but that costs n! evaluations. Sorting the
          input first is cheap and invariant but discontinuous where elements tie. Sampling a few random orderings during
          training, called Janossy pooling, sits in between. Building the symmetry into the architecture is cheaper than all
          three and generalises to every ordering at once.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "perms",
      rung: "check",
      prompt: <p>How many evaluations are needed to symmetrise a function of a set of 10 elements by averaging over all orderings?</p>,
      answer: { kind: "numeric", value: 3628800, tolerance: 0.5 },
    },
    {
      key: "p2",
      rung: "check",
      prompt: <p>What is the second power sum of the multiset {"{1, 2, 2}"}?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.001 },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>A model must output how many points in a cloud lie above the floor, and test clouds may be much larger than training clouds. Which design fits best?</p>,
      answer: {
        kind: "choice",
        options: [
          "Max pooling over per-point features, since it is bounded",
          "Mean pooling over per-point features, then multiply by a learned constant",
          "Sum pooling of a per-point feature that indicates being above the floor",
          "An MLP on the concatenated, sorted coordinates",
        ],
        correct: [2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def pool(H, how):
    return {"sum": H.sum(axis=0), "mean": H.mean(axis=0), "max": H.max(axis=0)}[how]

def power_sums(x, n):
    return np.array([np.sum(x ** k) for k in range(1, n + 1)])

def deep_set(X, phi, rho):
    return rho(phi(X).sum(axis=0))

A, B, C = np.array([[1.0], [3.0]]), np.array([[1.0], [1.0], [3.0], [3.0]]), np.array([[1.0], [3.0], [3.0]])
for how in ["sum", "mean", "max"]: print(how, [round(float(pool(S, how)[0]), 3) for S in (A, B, C)])
print(power_sums(np.array([1.0, 2.0, 3.0]), 3).tolist(), np.array_equal(power_sums(np.array([3.0, 1.0, 2.0]), 3), power_sums(np.array([1.0, 2.0, 3.0]), 3)), round(float(deep_set(np.array([2.0, -1.0, 4.0]), lambda X: np.stack([np.ones_like(X), X], 1), lambda s: s[1] / s[0])), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "sum [4.0, 8.0, 7.0]\nmean [2.0, 2.0, 2.333]\nmax [3.0, 3.0, 3.0]\n[6.0, 14.0, 36.0] True 1.667",
          "sum [4.0, 8.0, 7.0]\nmean [2.0, 2.0, 2.333]\nmax [3.0, 3.0, 3.0]\n[6.0, 14.0, 36.0] False 1.667",
          "sum [4.0, 4.0, 4.0]\nmean [2.0, 2.0, 2.333]\nmax [3.0, 3.0, 3.0]\n[6.0, 14.0, 36.0] True 1.667",
          "sum [4.0, 8.0, 7.0]\nmean [2.0, 2.0, 2.333]\nmax [3.0, 3.0, 3.0]\n[6.0, 14.0, 98.0] True 5.0",
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
from itertools import permutations

def elementary(p):
    e = [1.0]
    for k in range(1, len(p) + 1):
        e.append(sum((-1) ** (i - 1) * e[k - i] * p[i - 1] for i in range(1, k + 1)) / k)
    return np.array(e)

def recover(p):
    e = elementary(p)
    coeffs = [(-1) ** k * e[k] for k in range(len(e))]
    return np.sort(np.roots(coeffs).real) + 0.0

def symmetrise(f, X):
    return float(np.mean([f(X[list(s)]) for s in permutations(range(len(X)))]))

print(np.round(elementary(np.array([6.0, 14.0, 36.0])), 6).tolist(), np.round(recover(np.array([6.0, 14.0, 36.0])), 6).tolist(), np.round(recover(np.array([3.0, 9.0, 27.0])), 6).tolist())
print(symmetrise(lambda X: X[0] - X[-1], np.array([1.0, 5.0, 2.0])), round(symmetrise(lambda X: X[0] * X[1], np.array([1.0, 5.0, 2.0])), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 6.0, 11.0, 6.0] [1.0, 2.0, 3.0] [0.0, 0.0, 3.0]\n0.0 5.667",
          "[1.0, 6.0, 11.0, 6.0] [1.0, 2.0, 3.0] [1.0, 1.0, 1.0]\n0.0 5.667",
          "[1.0, -6.0, 11.0, -6.0] [1.0, 2.0, 3.0] [0.0, 0.0, 3.0]\n0.0 5.667",
          "[1.0, 6.0, 11.0, 6.0] [1.0, 2.0, 3.0] [0.0, 0.0, 3.0]\n-1.0 5.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pool(H, how)</C> pooling the rows of H by &quot;sum&quot;, &quot;mean&quot; or &quot;max&quot;,{" "}
          <C>power_sums(x, n)</C> returning <M>{"p_1, \\dots, p_n"}</M>, and <C>deep_set(X, phi, rho)</C>, where phi maps the
          stacked elements to one feature row each.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pool(H, how):
    return H[0]

def power_sums(x, n):
    return np.zeros(n)

def deep_set(X, phi, rho):
    return rho(phi(X)[0])
`,
        solution: POOL,
        tests: [
          { name: "pooling", code: `H = np.array([[1.0, -2], [3, 0], [2, 5]]); assert np.allclose(pool(H, "sum"), [6, 3]) and np.allclose(pool(H, "mean"), [2, 1]) and np.allclose(pool(H, "max"), [3, 5])
assert np.allclose(power_sums(np.array([1.0, -1, 2]), 4), [2, 6, 8, 18])` },
          { name: "invariant", code: `rng = np.random.default_rng(0); W1, W2 = rng.normal(size=(1, 8)), rng.normal(size=8); X = rng.normal(size=6)
phi = lambda X: np.tanh(X[:, None] @ W1); rho = lambda s: float(np.tanh(s) @ W2); v = deep_set(X, phi, rho)
assert abs(v - deep_set(X[::-1], phi, rho)) < 1e-12 and abs(v - rho(np.tanh(X[:, None] @ W1).sum(0))) < 1e-12 and abs(v - deep_set(X[:5], phi, rho)) > 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>elementary(p)</C> returning <M>{"e_0, \\dots, e_n"}</M> from power sums by Newton&apos;s identities,{" "}
          <C>recover(p)</C> returning the sorted real multiset with those power sums, and <C>symmetrise(f, X)</C>, the average
          of f over all orderings of the array X.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from itertools import permutations

def elementary(p):
    return np.ones(len(p) + 1)

def recover(p):
    return np.zeros(len(p))

def symmetrise(f, X):
    return float(f(X))
`,
        solution: NEWTON,
        tests: [
          { name: "newton", code: `x = np.array([-1.5, 0.5, 2.0, 4.0]); p = np.array([np.sum(x ** k) for k in range(1, 5)]); e = elementary(p)
assert np.allclose(e, [1, x.sum(), -1.5 * 0.5 - 1.5 * 2 - 1.5 * 4 + 0.5 * 2 + 0.5 * 4 + 2 * 4, np.poly(x)[3] * -1, np.prod(x)]) and np.allclose(recover(p), x)` },
          { name: "symmetrise", code: `X = np.array([3.0, -1.0, 4.0, 1.0]); assert abs(symmetrise(lambda Z: Z[0], X) - X.mean()) < 1e-12 and abs(symmetrise(lambda Z: Z[0] * Z[1], X) - (X.sum() ** 2 - (X ** 2).sum()) / 12) < 1e-12` },
        ],
      },
    },
    {
      key: "pair",
      rung: "stretch",
      prompt: <p>Two numbers have power sums p₁ = 4 and p₂ = 10. What is their product?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sets have no structure beyond membership. Graphs add edges, and the next lesson builds layers that let each node pool
        over its neighbours instead of over everything.
      </p>
    </>
  ),
};
