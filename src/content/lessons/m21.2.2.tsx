import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CharacterTableViz } from "@/components/viz/CharacterTableViz";
import type { LessonContent } from "@/lib/types";

const TABLE = `import numpy as np

def inner(chi1, chi2, sizes):
    s = np.array(sizes)                               # class functions are listed by conjugacy class
    return complex(np.sum(s * np.array(chi1) * np.conj(np.array(chi2))) / np.sum(s))

def multiplicities(chi, table, sizes):
    return [round(inner(chi, row, sizes).real) for row in table]

def is_irreducible(chi, sizes):
    return abs(inner(chi, chi, sizes) - 1) < 1e-9`;

const CYCLIC = `import numpy as np

def cyclic_characters(n):
    k = np.arange(n)
    return np.exp(2j * np.pi * np.outer(k, k) / n)    # row m: the character k -> exp(2 pi i m k / n)

def decompose(chi_values):
    n = len(chi_values)
    m = cyclic_characters(n).conj() @ np.array(chi_values) / n
    return [int(round(v.real)) for v in m]            # multiplicity of each irreducible

def schur_average(rho1, rho2, elements, A):
    return sum(rho2(g) @ A @ np.linalg.inv(rho1(g)) for g in elements) / len(elements)`;

export const lesson: LessonContent = {
  id: "m21.2.2",
  minutes: 55,
  links: {
    requires: ["m21.2.1", "m6.1.1"],
    revisits: ["m6.3.3", "m21.1.2"],
    foreshadows: ["m21.2.3"],
  },

  puzzle: (
    <>
      <p>
        The previous lesson split representations into invariant pieces. Can the splitting always be continued until the pieces
        are as small as possible, and are the final pieces the same however one splits? For the permutations of three objects,
        every representation, whether on vectors, matrices or tensors of any order, turns out to be built from just three
        irreducible blocks, and a short table of nine numbers tells you how many copies of each block it contains. Why does a
        table of traces carry so much information?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An irreducible representation has no invariant subspaces except the trivial ones, so it cannot be split. Schur&apos;s lemma
        says that equivariant maps between irreducibles are as rigid as possible: zero between different ones, a scalar from one
        to itself. Counting equivariant maps with characters then turns into an orthogonality relation, and the characters of the
        irreducibles behave like an orthonormal basis in which any character can be expanded. The coefficients are the
        multiplicities.
      </p>
      <CharacterTableViz />
    </>
  ),

  theory: (
    <>
      <Definition title="irreducible representations">
        <p>
          A representation on V ≠ 0 is irreducible if its only invariant subspaces are 0 and V. In this lesson representations are
          on complex vector spaces (m6.1.1), where every finite group representation is unitary by the averaging argument of
          m21.2.1 with a Hermitian inner product, so <M>{"\\rho(g^{-1}) = \\rho(g)^*"}</M> and{" "}
          <M>{"\\chi(g^{-1}) = \\overline{\\chi(g)}"}</M>. The inner product of class functions is{" "}
          <M>{"\\langle \\chi, \\psi \\rangle = \\frac{1}{|G|}\\sum_g \\chi(g)\\overline{\\psi(g)}"}</M>, a sum over conjugacy
          classes weighted by their sizes (<C>inner</C>).
        </p>
      </Definition>

      <Theorem title="complete reducibility">
        <p>Every representation of a finite group is a direct sum of irreducible representations.</p>
      </Theorem>
      <Proof>
        <p>
          By induction on the dimension. If V is irreducible we are done. Otherwise it has an invariant subspace U with 0 ≠ U ≠ V,
          which by m21.2.1 has an invariant complement, so <M>{"V = U \\oplus U'"}</M> with both of smaller dimension, and each is a
          sum of irreducibles by induction.
        </p>
      </Proof>

      <Theorem title="Schur's lemma">
        <p>
          Let W be an intertwiner from an irreducible <M>{"V_1"}</M> to an irreducible <M>{"V_2"}</M>. Then W = 0 or W is an
          isomorphism. If <M>{"V_1 = V_2"}</M> over the complex numbers, then W = λI for a scalar λ.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"Wv = 0"}</M> then <M>{"W\\rho_1(g)v = \\rho_2(g)Wv = 0"}</M>, so ker W is invariant, hence 0 or{" "}
          <M>{"V_1"}</M>. Likewise the image is invariant, hence 0 or <M>{"V_2"}</M>. So W is zero or bijective. Over the complex
          numbers W has an eigenvalue λ, and <M>{"W - \\lambda I"}</M> is an intertwiner with a nonzero kernel, so it is not
          bijective and must be zero.
        </p>
      </Proof>

      <Theorem title="orthogonality of characters">
        <p>
          If <M>{"\\chi_i"}</M> and <M>{"\\chi_j"}</M> are the characters of irreducible representations, then{" "}
          <M>{"\\langle \\chi_j, \\chi_i \\rangle = 1"}</M> if they are equivalent and 0 otherwise.
        </p>
      </Theorem>
      <Proof>
        <p>
          G acts on linear maps <M>{"A : V_i \\to V_j"}</M> by <M>{"A \\mapsto \\rho_j(g)A\\rho_i(g)^{-1}"}</M>, and the fixed points
          of this action are the intertwiners. The trace of the map <M>{"A \\mapsto BAC"}</M> is{" "}
          <M>{"\\operatorname{tr}B \\cdot \\operatorname{tr}C"}</M>, so the character of this action is{" "}
          <M>{"\\chi_j(g)\\chi_i(g^{-1}) = \\chi_j(g)\\overline{\\chi_i(g)}"}</M>. By m21.2.1 the dimension of the space of
          intertwiners is the average of this character, which is <M>{"\\langle \\chi_j, \\chi_i \\rangle"}</M>. By Schur&apos;s lemma
          the intertwiners are 0 when the representations differ, and the multiples of one isomorphism when they agree, a space of
          dimension 1. The averaging <M>{"\\frac{1}{|G|}\\sum_g \\rho_j(g)A\\rho_i(g)^{-1}"}</M> (<C>schur_average</C>) projects any
          A onto the intertwiners.
        </p>
      </Proof>

      <Theorem title="multiplicities and dimensions">
        <p>
          If <M>{"V \\cong \\bigoplus_i m_i V_i"}</M> with distinct irreducibles <M>{"V_i"}</M>, then{" "}
          <M>{"m_i = \\langle \\chi_V, \\chi_i \\rangle"}</M> (<C>multiplicities</C>), so the decomposition is unique;{" "}
          <M>{"\\langle \\chi_V, \\chi_V \\rangle = \\sum_i m_i^2"}</M>, which is 1 exactly when V is irreducible
          (<C>is_irreducible</C>) and is the dimension of the space of intertwiners from V to itself; and the dimensions{" "}
          <M>{"d_i"}</M> of all the irreducibles satisfy <M>{"\\sum_i d_i^2 = |G|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The character of a direct sum is the sum of characters, so <M>{"\\chi_V = \\sum_i m_i\\chi_i"}</M>, and orthonormality
          gives the first two claims; the intertwiner count is the argument of the previous proof with <M>{"V_i = V_j = V"}</M>.
          The regular representation permutes the elements of G by left multiplication, which fixes no element unless g = e, so its
          character is |G| at e and 0 elsewhere. Then <M>{"\\langle \\chi_{\\mathrm{reg}}, \\chi_i \\rangle = d_i"}</M>: every
          irreducible appears <M>{"d_i"}</M> times, and comparing dimensions gives <M>{"|G| = \\sum_i d_i \\cdot d_i"}</M>.
        </p>
        <Code>{TABLE}</Code>
      </Proof>

      <Example title="two character tables">
        <p>
          For <M>{"S_3"}</M>, with classes of sizes 1, 3 and 2 (identity, transpositions, 3-cycles), the irreducible characters are
          trivial (1, 1, 1), sign (1, −1, 1) and standard (2, 0, −1), and <M>{"1 + 1 + 4 = 6"}</M>. The permutation character
          (3, 1, 0) is trivial plus standard: the constant vectors and the vectors summing to zero. For the cyclic group{" "}
          <M>{"\\mathbb{Z}_n"}</M>, every element is its own class and the irreducibles are the n one-dimensional characters{" "}
          <M>{"\\chi_m(k) = e^{2\\pi i mk/n}"}</M> (<C>cyclic_characters</C>), so <M>{"\\sum d_i^2 = n"}</M>. Expanding a
          character in them (<C>decompose</C>) is a discrete Fourier transform.
        </p>
        <Code>{CYCLIC}</Code>
      </Example>

      <Remark title="real and complex">
        <p>
          Networks usually carry real features. Over the real numbers Schur&apos;s lemma allows the intertwiners of an irreducible to
          itself to form the reals, the complex numbers or the quaternions. The rotation representation of{" "}
          <M>{"\\mathbb{Z}_n"}</M> by angle <M>{"2\\pi mk/n"}</M> on <M>{"\\mathbb{R}^2"}</M> is irreducible over the reals for{" "}
          <M>{"0 < m < n/2"}</M> but splits over the complex numbers into <M>{"\\chi_m \\oplus \\chi_{-m}"}</M>, and its real
          intertwiners are the rotation-scalings, a copy of the complex numbers. Equivariant architectures handle this either by
          working with complex features or by keeping track of these extra intertwiners.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dims",
      rung: "check",
      prompt: (
        <p>
          The symmetric group <M>{"S_5"}</M> has 120 elements and seven irreducible representations, of dimensions 1, 1, 4, 4, 5, 5
          and d. What is d?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
    {
      key: "mult",
      rung: "check",
      prompt: (
        <p>
          <M>{"S_3"}</M> acts on 3 × 3 matrices by <M>{"X \\mapsto PXP^\\top"}</M>, with character (9, 1, 0) on the classes of the
          example. How many copies of the two-dimensional standard representation does it contain?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "schur",
      rung: "apply",
      prompt: <p>Why must an equivariant linear map from an irreducible representation to a different irreducible one be zero?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its kernel and image are invariant subspaces, so it is zero or an isomorphism, and an isomorphism would make the representations equivalent",
          "Because the two spaces have different dimensions",
          "Because irreducible representations have no invariant vectors",
          "Because the characters of the two representations are equal",
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

def inner(chi1, chi2, sizes):
    s = np.array(sizes)                               # class functions are listed by conjugacy class
    return complex(np.sum(s * np.array(chi1) * np.conj(np.array(chi2))) / np.sum(s))

def multiplicities(chi, table, sizes):
    return [round(inner(chi, row, sizes).real) for row in table]

def is_irreducible(chi, sizes):
    return abs(inner(chi, chi, sizes) - 1) < 1e-9

S3 = [[1, 1, 1], [1, -1, 1], [2, 0, -1]]; sizes = [1, 3, 2]
print(multiplicities([3, 1, 0], S3, sizes), multiplicities([6, 0, 0], S3, sizes), is_irreducible([2, 0, -1], sizes), is_irreducible([3, 1, 0], sizes))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0, 1] [1, 1, 2] True False",
          "[1, 1, 1] [1, 1, 2] True False",
          "[1, 0, 1] [1, 1, 1] True False",
          "[1, 0, 1] [1, 1, 2] True True",
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

def cyclic_characters(n):
    k = np.arange(n)
    return np.exp(2j * np.pi * np.outer(k, k) / n)    # row m: the character k -> exp(2 pi i m k / n)

def decompose(chi_values):
    n = len(chi_values)
    m = cyclic_characters(n).conj() @ np.array(chi_values) / n
    return [int(round(v.real)) for v in m]            # multiplicity of each irreducible

def schur_average(rho1, rho2, elements, A):
    return sum(rho2(g) @ A @ np.linalg.inv(rho1(g)) for g in elements) / len(elements)

P = lambda k: np.roll(np.eye(4), k, axis=0); sgn = lambda k: np.array([[(-1.0) ** k]])
print(decompose([4, 0, 0, 0]), decompose([2, 0, -2, 0]), schur_average(sgn, P, range(4), np.eye(4)[:, :1]).ravel().tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 1, 1, 1] [0, 1, 0, 1] [0.25, -0.25, 0.25, -0.25]",
          "[4, 0, 0, 0] [0, 1, 0, 1] [0.25, -0.25, 0.25, -0.25]",
          "[1, 1, 1, 1] [1, 0, 1, 0] [0.25, -0.25, 0.25, -0.25]",
          "[1, 1, 1, 1] [0, 1, 0, 1] [0.25, 0.25, 0.25, 0.25]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Characters are given as lists of values on conjugacy classes with class sizes <C>sizes</C>. Write{" "}
          <C>inner(chi1, chi2, sizes)</C>, <C>multiplicities(chi, table, sizes)</C> for a list of irreducible characters, and{" "}
          <C>is_irreducible(chi, sizes)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inner(chi1, chi2, sizes):
    return complex(np.mean(np.array(chi1) * np.array(chi2)))

def multiplicities(chi, table, sizes):
    return [0] * len(table)

def is_irreducible(chi, sizes):
    return True
`,
        solution: TABLE,
        tests: [
          { name: "ip", code: `assert abs(inner([2, 0, -1], [2, 0, -1], [1, 3, 2]) - 1) < 1e-12\nassert abs(inner([1, 1j, -1, -1j], [1, 1j, -1, -1j], [1, 1, 1, 1]) - 1) < 1e-12` },
          { name: "mult", code: `assert multiplicities([4, 0, 1], [[1, 1, 1], [1, -1, 1], [2, 0, -1]], [1, 3, 2]) == [1, 1, 1]\nassert not is_irreducible([3, 1, 0], [1, 3, 2])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cyclic_characters(n)</C>, the n × n matrix whose row m is <M>{"\\chi_m"}</M>, <C>decompose(chi_values)</C>, the
          list of integer multiplicities of a character of <M>{"\\mathbb{Z}_n"}</M>, and <C>schur_average(rho1, rho2, elements, A)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cyclic_characters(n):
    return np.ones((n, n))

def decompose(chi_values):
    return list(chi_values)

def schur_average(rho1, rho2, elements, A):
    return A
`,
        solution: CYCLIC,
        tests: [
          { name: "chars", code: `C = cyclic_characters(4)\nassert np.allclose(C @ C.conj().T, 4 * np.eye(4)) and decompose([5, 1, 1, 1]) == [2, 1, 1, 1]` },
          { name: "avg", code: `W = schur_average(lambda k: np.eye(1), lambda k: np.roll(np.eye(3), k, axis=0), range(3), np.array([[3.0], [0.0], [0.0]]))\nassert np.allclose(W, [[1.0], [1.0], [1.0]])` },
        ],
      },
    },
    {
      key: "maron",
      rung: "stretch",
      prompt: (
        <p>
          <M>{"S_4"}</M> acts on 4 × 4 matrices by <M>{"X \\mapsto PXP^\\top"}</M>. Its classes have sizes 1, 6, 3, 8 and 6
          (identity, transpositions, double transpositions, 3-cycles, 4-cycles). What is the dimension of the space of linear maps
          from 4 × 4 matrices to themselves that commute with this action?
        </p>
      ),
      answer: { kind: "numeric", value: 15, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        For the cyclic group, decomposing into irreducibles is the discrete Fourier transform. The next lesson develops this view
        for general groups: Fourier analysis on a group turns convolution into multiplication, block by block, one block per
        irreducible.
      </p>
    </>
  ),
};
