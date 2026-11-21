import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GroupAverageViz } from "@/components/viz/GroupAverageViz";
import type { LessonContent } from "@/lib/types";

const AVG = `import itertools
import numpy as np

def perm_matrices(n):
    return [np.eye(n)[list(p)] for p in itertools.permutations(range(n))]

def is_equivariant(f, X, mats):
    return all(np.allclose(f(P @ x), P @ f(x)) for P in mats for x in X)      # f(g x) = g f(x) on the test inputs

def symmetrise(W, mats):
    return sum(P.T @ W @ P for P in mats) / len(mats)        # x -> mean over g of g^{-1} W g x`;

const SETS = `import numpy as np

def deepsets_layer(X, a, b):
    return a * X + b * X.sum(axis=0, keepdims=True)          # rows are set elements: (aI + b 11^T) X

def invariant_readout(X):
    return X.sum(axis=0)

def circulant_project(W):
    n = len(W)
    S = np.roll(np.eye(n), 1, axis=0)                        # the cyclic shift by one place
    return sum(np.linalg.matrix_power(S, k).T @ W @ np.linalg.matrix_power(S, k) for k in range(n)) / n`;

export const lesson: LessonContent = {
  id: "m21.1.3",
  minutes: 55,
  links: {
    requires: ["m21.1.2", "m6.6.3"],
    revisits: ["l4.5.1", "l4.1.1"],
    foreshadows: ["m21.2.1"],
  },

  puzzle: (
    <>
      <p>
        A model that reads a set of points, such as the atoms of a molecule or the items in a basket, should not care in which
        order they are listed. The most general linear layer from n inputs to n outputs has n² weights. How many of those survive
        if the layer must commute with every reordering of its inputs? The answer is two, for every n, and the same method tells
        you that the layers commuting with cyclic shifts are exactly the convolutions. What is the method?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A map is equivariant if transforming the input and then applying the map gives the same result as applying the map and
        then transforming the output; it is invariant if the output does not change at all. Any map can be made equivariant by
        averaging: transform the input, apply the map, transform back, and average over the whole group. For linear maps this
        averaging is an orthogonal projection, and the matrices it lands on are constant on the orbits of the group acting on pairs
        of indices.
      </p>
      <GroupAverageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="equivariance and invariance">
        <p>
          Let G act on X and on Y. A map <M>{"f : X \\to Y"}</M> is equivariant if{" "}
          <M>{"f(g \\cdot x) = g \\cdot f(x)"}</M> for all g and x, and invariant if <M>{"f(g \\cdot x) = f(x)"}</M>, which is
          equivariance when G acts trivially on Y. When the actions are by matrices, such as permutation matrices P acting on{" "}
          <M>{"\\mathbb{R}^n"}</M> (<C>perm_matrices</C>), a linear map W is equivariant exactly when <M>{"PW = WP"}</M> for every P
          (<C>is_equivariant</C> tests this on sample inputs).
        </p>
      </Definition>

      <Theorem title="the blueprint">
        <p>
          A composition of equivariant maps is equivariant, and an equivariant map followed by an invariant one is invariant.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"f_2(f_1(g \\cdot x)) = f_2(g \\cdot f_1(x)) = g \\cdot f_2(f_1(x))"}</M>, and replacing the last action by the trivial
          one gives the second claim. Pointwise nonlinearities commute with permutations of coordinates, so stacks of equivariant
          linear layers and pointwise activations, ending in an invariant pooling such as a sum, give invariant networks. This is
          the design of convolutional networks (l4.1.1), graph networks and Deep Sets (l4.5.1).
        </p>
      </Proof>

      <Theorem title="averaging is a projection">
        <p>
          Let G be a finite group of orthogonal matrices. The map{" "}
          <M>{"\\Pi(W) = \\frac{1}{|G|}\\sum_{P \\in G} P^\\top W P"}</M> (<C>symmetrise</C>) sends every matrix to an equivariant
          one, fixes equivariant matrices, and is the orthogonal projection, in the Frobenius inner product, onto the equivariant
          matrices.
        </p>
      </Theorem>
      <Proof>
        <p>
          For Q in G, <M>{"Q^\\top \\Pi(W) Q = \\frac{1}{|G|}\\sum_P (PQ)^\\top W (PQ) = \\Pi(W)"}</M>, because PQ runs over G as P
          does; so <M>{"\\Pi(W)Q = Q\\Pi(W)"}</M>. If W is equivariant every term <M>{"P^\\top W P"}</M> equals W, so{" "}
          <M>{"\\Pi(W) = W"}</M> and <M>{"\\Pi^2 = \\Pi"}</M>. Finally{" "}
          <M>{"\\langle P^\\top W P, V \\rangle = \\operatorname{tr}(P^\\top W^\\top P V) = \\langle W, P V P^\\top \\rangle"}</M>, and{" "}
          <M>{"P^\\top"}</M> also runs over G, so Π is self-adjoint. A self-adjoint idempotent is an orthogonal projection (m6.6.1).
          The same averaging <M>{"x \\mapsto \\frac{1}{|G|}\\sum_g g^{-1} \\cdot f(g \\cdot x)"}</M> makes any map, linear or not,
          equivariant.
        </p>
        <Code>{AVG}</Code>
      </Proof>

      <Theorem title="equivariant linear maps for permutation actions">
        <p>
          Let G act on the indices 1, …, n, and on <M>{"\\mathbb{R}^n"}</M> by the permutation matrices{" "}
          <M>{"P_g e_i = e_{g(i)}"}</M>. Then W is equivariant exactly when <M>{"W_{g(i)\\, g(j)} = W_{ij}"}</M> for all g, i and j,
          so the equivariant matrices are those constant on the orbits of G acting on pairs (i, j), and their dimension is the
          number of such orbits.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(P_g W P_g^\\top)_{g(i)\\, g(j)} = e_{g(i)}^\\top P_g W P_g^\\top e_{g(j)} = e_i^\\top W e_j = W_{ij}"}</M>, and{" "}
          <M>{"P_g W = W P_g"}</M> is the same as <M>{"P_g W P_g^\\top = W"}</M>. For <M>{"S_n"}</M> there are two orbits on pairs,
          the diagonal and the rest, so <M>{"W = aI + b\\mathbf{1}\\mathbf{1}^\\top"}</M>. For cyclic shifts the orbit of (i, j) is
          fixed by <M>{"j - i \\bmod n"}</M>, giving the n-dimensional space of circulant matrices, the convolutions of m6.6.3.
        </p>
      </Proof>

      <Example title="Deep Sets">
        <p>
          A set of n elements with c features each is a matrix X with one row per element. By the theorem applied to each pair of
          channels, the permutation-equivariant linear layers are{" "}
          <M>{"X \\mapsto XA + \\mathbf{1}\\mathbf{1}^\\top X B"}</M> with A and B of size <M>{"c_{\\mathrm{in}} \\times c_{\\mathrm{out}}"}</M>
          : each element is updated from its own features and the sum over the set (<C>deepsets_layer</C>, here with one channel).
          A sum over rows is invariant (<C>invariant_readout</C>). <C>circulant_project</C> averages over the cyclic shifts and
          returns the nearest circulant matrix.
        </p>
        <Code>{SETS}</Code>
      </Example>

      <Remark title="building in or learning symmetry">
        <p>
          Data augmentation trains an unconstrained model on transformed copies, so it can only learn approximate symmetry, and only
          on the data it sees. Building symmetry into the layers restricts the hypothesis class: fewer parameters, exact symmetry
          everywhere, and better sample efficiency when the symmetry is real. When it is only approximate, as with the orientation
          of natural images, which have a preferred up, exact constraints can hurt, and the trade-off is decided empirically.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: (
        <p>
          A permutation-equivariant linear layer maps sets with 3 features per element to sets with 4 features per element, as in
          the Deep Sets example. How many weights does it have, not counting biases?
        </p>
      ),
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
    {
      key: "avg",
      rung: "check",
      prompt: (
        <p>
          Make <M>{"f(x) = x_1^2"}</M> on <M>{"\\mathbb{R}^3"}</M> invariant to all permutations of coordinates by averaging{" "}
          <M>{"f(P x)"}</M> over the six permutations. What is the averaged function at x = (1, 2, 4)?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0.0005 },
    },
    {
      key: "pool",
      rung: "apply",
      prompt: <p>Why does a graph network built from permutation-equivariant layers followed by a sum over nodes give the same output for every ordering of the nodes?</p>,
      answer: {
        kind: "choice",
        options: [
          "Reordering the input reorders every intermediate representation in the same way, and the final sum does not depend on the order",
          "Because each layer is invariant on its own",
          "Because the weights are averaged over all orderings during training",
          "Because graphs have no natural ordering of edges",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import numpy as np

def perm_matrices(n):
    return [np.eye(n)[list(p)] for p in itertools.permutations(range(n))]

def is_equivariant(f, X, mats):
    return all(np.allclose(f(P @ x), P @ f(x)) for P in mats for x in X)      # f(g x) = g f(x) on the test inputs

def symmetrise(W, mats):
    return sum(P.T @ W @ P for P in mats) / len(mats)        # x -> mean over g of g^{-1} W g x

mats = perm_matrices(3); W = np.array([[1.0, 2.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 4.0]])
print(len(mats), is_equivariant(lambda x: W @ x, [np.array([1.0, 2.0, 3.0])], mats), symmetrise(W, mats).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6 False [[2.0, 0.333, 0.333], [0.333, 2.0, 0.333], [0.333, 0.333, 2.0]]",
          "6 True [[2.0, 0.333, 0.333], [0.333, 2.0, 0.333], [0.333, 0.333, 2.0]]",
          "6 False [[2.0, 0.667, 0.667], [0.667, 2.0, 0.667], [0.667, 0.667, 2.0]]",
          "3 False [[2.0, 0.333, 0.333], [0.333, 2.0, 0.333], [0.333, 0.333, 2.0]]",
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

def deepsets_layer(X, a, b):
    return a * X + b * X.sum(axis=0, keepdims=True)          # rows are set elements: (aI + b 11^T) X

def invariant_readout(X):
    return X.sum(axis=0)

def circulant_project(W):
    n = len(W)
    S = np.roll(np.eye(n), 1, axis=0)                        # the cyclic shift by one place
    return sum(np.linalg.matrix_power(S, k).T @ W @ np.linalg.matrix_power(S, k) for k in range(n)) / n

X = np.array([[1.0, 0.0], [2.0, 1.0], [3.0, 5.0]])
print(deepsets_layer(X, 2.0, -1.0)[0].tolist(), invariant_readout(X).tolist(), circulant_project(np.diag([3.0, 0.0, 0.0]))[1].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-4.0, -6.0] [6.0, 6.0] [0.0, 1.0, 0.0]",
          "[-4.0, -6.0] [2.0, 2.0] [0.0, 1.0, 0.0]",
          "[-4.0, -6.0] [6.0, 6.0] [0.0, 0.0, 0.0]",
          "[-1.0, -6.0] [6.0, 6.0] [0.0, 1.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>perm_matrices(n)</C>, all n × n permutation matrices, <C>is_equivariant(f, X, mats)</C>, which tests{" "}
          <M>{"f(Px) = Pf(x)"}</M> on the inputs in X, and <C>symmetrise(W, mats)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools
import numpy as np

def perm_matrices(n):
    return [np.eye(n)]

def is_equivariant(f, X, mats):
    return all(np.allclose(f(P @ x), f(x)) for P in mats for x in X)

def symmetrise(W, mats):
    return W
`,
        solution: AVG,
        tests: [
          { name: "perm", code: `mats = perm_matrices(3)\nx = np.array([1.0, 2.0, 4.0])\nassert len(mats) == 6 and is_equivariant(lambda v: 2 * v + v.sum(), [x], mats)\nassert not is_equivariant(lambda v: v[::-1] * np.arange(3), [x], mats)` },
          { name: "sym", code: `assert np.allclose(symmetrise(np.array([[0.0, 3.0], [0.0, 0.0]]), perm_matrices(2)), [[0.0, 1.5], [1.5, 0.0]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>deepsets_layer(X, a, b)</C>, the layer <M>{"(aI + b\\mathbf{1}\\mathbf{1}^\\top)X"}</M> for a set stored as rows
          of X, <C>invariant_readout(X)</C>, the sum over the set, and <C>circulant_project(W)</C>, the average of W over all
          cyclic shifts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def deepsets_layer(X, a, b):
    return a * X

def invariant_readout(X):
    return X[0]

def circulant_project(W):
    return W
`,
        solution: SETS,
        tests: [
          { name: "layer", code: `X = np.array([[1.0], [3.0]])\nassert np.allclose(deepsets_layer(X, 1.0, 1.0), [[5.0], [7.0]]) and np.allclose(invariant_readout(X), [4.0])` },
          { name: "circ", code: `C = circulant_project(np.array([[1.0, 2.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]))\nassert np.allclose(C, [[1 / 3, 2 / 3, 0], [0, 1 / 3, 2 / 3], [2 / 3, 0, 1 / 3]])` },
        ],
      },
    },
    {
      key: "d4maps",
      rung: "stretch",
      prompt: (
        <p>
          <M>{"D_4"}</M> acts on 3 × 3 images by permuting the nine pixels. What is the dimension of the space of linear maps from
          3 × 3 images to 3 × 3 images that are equivariant to this action? (Count orbits on pairs of pixels with Burnside&apos;s
          lemma.)
        </p>
      ),
      answer: { kind: "numeric", value: 15, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far groups acted by permuting coordinates. Rotations of the plane act on vectors by matrices that are not permutations,
        and features of a network may transform in still other ways. The next chapter studies representations, the general way a
        group acts linearly on a vector space.
      </p>
    </>
  ),
};
