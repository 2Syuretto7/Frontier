import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RotationRepViz } from "@/components/viz/RotationRepViz";
import type { LessonContent } from "@/lib/types";

const REP = `import numpy as np

def rot2(theta):
    c, s = np.cos(theta), np.sin(theta)
    return np.array([[c, -s], [s, c]])

def is_rep(rho, elements, op):
    return all(np.allclose(rho(op(g, h)), rho(g) @ rho(h)) for g in elements for h in elements)   # a homomorphism

def averaged_inner(rho, elements, B):
    return sum(rho(g).T @ B @ rho(g) for g in elements) / len(elements)   # Gram matrix of the invariant inner product`;

const CHAR = `import numpy as np

def character(rho, elements):
    return [float(np.trace(rho(g))) for g in elements]

def invariant_dim(rho, elements):
    return round(sum(character(rho, elements)) / len(elements))   # the trace of the averaging projector

def invariant_projector(rho, elements):
    return sum(rho(g) for g in elements) / len(elements)`;

export const lesson: LessonContent = {
  id: "m21.2.1",
  minutes: 55,
  links: {
    requires: ["m21.1.3", "m6.3.1"],
    revisits: ["m6.7.2", "m6.2.2"],
    foreshadows: ["m21.2.2"],
  },

  puzzle: (
    <>
      <p>
        Rotate a molecule and the positions of its atoms rotate, the forces on them rotate the same way, the charges on them do
        not change at all, and a stress tensor at each atom transforms by the rotation on both sides. One group, several different
        ways of acting on the numbers a network stores. Equivariant layers must map each of these kinds of feature to the others
        consistently. What is the right general notion of a group acting linearly on features, and how can one tell how many
        features of a given space are left unchanged by every symmetry without solving any equations?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A representation assigns to every group element an invertible matrix, so that multiplying group elements corresponds to
        multiplying matrices. The same group can be represented in many ways: a quarter turn can act on the plane as a rotation
        by 90°, by 180°, or not at all. The trace of each matrix, the character, turns out to carry most of the information. In
        particular, averaging the matrices over the group projects onto the vectors that every element fixes, and the dimension of
        that space is the average of the character.
      </p>
      <RotationRepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="representation">
        <p>
          A representation of G on a finite-dimensional real vector space V is a homomorphism{" "}
          <M>{"\\rho : G \\to GL(V)"}</M>, that is, <M>{"\\rho(gh) = \\rho(g)\\rho(h)"}</M> for all g, h (<C>is_rep</C>). It is an
          action of G on V by linear maps. Examples: the trivial representation <M>{"\\rho(g) = 1"}</M>; the sign of a permutation;
          the permutation representation of <M>{"S_n"}</M> on <M>{"\\mathbb{R}^n"}</M>; the rotation representations{" "}
          <M>{"\\rho_m(k) = R(2\\pi mk/n)"}</M> of <M>{"\\mathbb{Z}_n"}</M> on <M>{"\\mathbb{R}^2"}</M> (<C>rot2</C>); and the regular
          representation, by the permutation matrices of Cayley&apos;s theorem (m21.1.1).
        </p>
      </Definition>

      <Definition title="intertwiners and subrepresentations">
        <p>
          A linear map <M>{"W : V_1 \\to V_2"}</M> between representations is an intertwiner, or equivariant, if{" "}
          <M>{"W\\rho_1(g) = \\rho_2(g)W"}</M> for all g; an invertible one makes the representations equivalent. A subspace U is
          invariant if <M>{"\\rho(g)U \\subseteq U"}</M> for all g (m6.3.1), and then ρ restricted to U is a subrepresentation. For
          the permutation representation, the line of constant vectors and the hyperplane of vectors summing to zero are both
          invariant.
        </p>
      </Definition>

      <Theorem title="every representation of a finite group is orthogonal">
        <p>
          For any inner product with Gram matrix B, the matrix{" "}
          <M>{"B_G = \\frac{1}{|G|}\\sum_g \\rho(g)^\\top B \\rho(g)"}</M> (<C>averaged_inner</C>) defines an inner product for which
          every <M>{"\\rho(g)"}</M> is orthogonal. Consequently, every invariant subspace U has an invariant complement.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"B_G"}</M> is symmetric, and <M>{"u^\\top B_G u = \\frac{1}{|G|}\\sum_g |\\rho(g)u|_B^2 > 0"}</M> for u ≠ 0. For h in G,{" "}
          <M>{"\\rho(h)^\\top B_G \\rho(h) = \\frac{1}{|G|}\\sum_g \\rho(gh)^\\top B \\rho(gh) = B_G"}</M>, since gh runs over G. Now
          let <M>{"U^\\perp"}</M> be the orthogonal complement of U for <M>{"B_G"}</M>. If w is in <M>{"U^\\perp"}</M> and u in U,
          then <M>{"\\langle \\rho(g)w, u\\rangle_G = \\langle w, \\rho(g)^{-1}u\\rangle_G = 0"}</M> because{" "}
          <M>{"\\rho(g^{-1})u"}</M> is in U, so <M>{"\\rho(g)w"}</M> is in <M>{"U^\\perp"}</M>. This is Maschke&apos;s theorem for
          real representations: in a basis adapted to <M>{"V = U \\oplus U^\\perp"}</M> (m6.2.2), every matrix is block diagonal.
        </p>
        <Code>{REP}</Code>
      </Proof>

      <Definition title="character">
        <p>
          The character of ρ is <M>{"\\chi(g) = \\operatorname{tr}\\rho(g)"}</M> (<C>character</C>). It is the same for equivalent
          representations, since <M>{"\\operatorname{tr}(A\\rho A^{-1}) = \\operatorname{tr}\\rho"}</M>, and it is constant on
          conjugacy classes: <M>{"\\chi(hgh^{-1}) = \\chi(g)"}</M>. For a permutation representation, <M>{"\\chi(g)"}</M> is the
          number of points g fixes, since a permutation matrix has a 1 on the diagonal exactly at fixed points.
        </p>
      </Definition>

      <Theorem title="counting invariant vectors">
        <p>
          The matrix <M>{"Q = \\frac{1}{|G|}\\sum_g \\rho(g)"}</M> (<C>invariant_projector</C>) is a projection onto the invariant
          vectors <M>{"V^G = \\{v : \\rho(g)v = v \\text{ for all } g\\}"}</M>, and{" "}
          <M>{"\\dim V^G = \\frac{1}{|G|}\\sum_g \\chi(g)"}</M> (<C>invariant_dim</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\rho(h)Q = \\frac{1}{|G|}\\sum_g \\rho(hg) = Q"}</M>, so every vector Qv is invariant; and if v is invariant every
          term fixes it, so Qv = v. Hence <M>{"Q^2 = Q"}</M> with image <M>{"V^G"}</M>. A projection is diagonalisable with
          eigenvalues 0 and 1, so its trace is the dimension of its image, and the trace of Q is the average character. For a
          permutation representation the invariant vectors are the functions constant on orbits, and the formula becomes
          Burnside&apos;s lemma (m21.1.2).
        </p>
        <Code>{CHAR}</Code>
      </Proof>

      <Example title="features as tensors">
        <p>
          If ρ acts on V, then G acts on matrices <M>{"X \\in V \\otimes V"}</M> by <M>{"X \\mapsto \\rho(g)X\\rho(g)^\\top"}</M>, the
          tensor product representation (m6.7.2), with character <M>{"\\chi(g)^2"}</M>. Positions and forces in a molecule are
          vectors (ρ = the rotation matrix), charges are scalars (trivial), and stress or polarisability tensors live in{" "}
          <M>{"V \\otimes V"}</M>. The number of independent invariant tensors of each order is again an average of powers of the
          character.
        </p>
      </Example>

      <Remark title="what this buys a network designer">
        <p>
          An equivariant network is specified by choosing, for each layer, a representation of the group on the feature space, and
          then using only intertwiners between consecutive layers. The space of intertwiners from <M>{"\\rho_1"}</M> to{" "}
          <M>{"\\rho_2"}</M> is itself the space of invariant vectors of a representation on matrices,{" "}
          <M>{"W \\mapsto \\rho_2(g)W\\rho_1(g)^{-1}"}</M>, so its dimension is computable from characters. The next lesson shows
          that representations split into irreducible building blocks, which makes this computation, and the intertwiners
          themselves, explicit.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fixed",
      rung: "check",
      prompt: (
        <p>
          <M>{"D_4"}</M> acts on 3 × 3 images by permuting pixels. Use the character to find the dimension of the space of images
          left unchanged by all eight symmetries.
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "chi",
      rung: "check",
      prompt: (
        <p>
          <M>{"\\mathbb{Z}_5"}</M> acts on the plane with k acting as rotation by <M>{"2\\pi k/5"}</M>. What is the character at k =
          1? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.618, tolerance: 0.0006 },
    },
    {
      key: "proj",
      rung: "apply",
      prompt: <p>Why is the average of the matrices of a representation over a finite group a projection onto the invariant vectors?</p>,
      answer: {
        kind: "choice",
        options: [
          "Multiplying the average by any ρ(h) only reorders the terms, so its outputs are invariant, and it leaves invariant vectors unchanged",
          "Because every ρ(g) is a projection",
          "Because the average of orthogonal matrices is orthogonal",
          "Because the trace of the average is an integer",
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

def rot2(theta):
    c, s = np.cos(theta), np.sin(theta)
    return np.array([[c, -s], [s, c]])

def is_rep(rho, elements, op):
    return all(np.allclose(rho(op(g, h)), rho(g) @ rho(h)) for g in elements for h in elements)   # a homomorphism

def averaged_inner(rho, elements, B):
    return sum(rho(g).T @ B @ rho(g) for g in elements) / len(elements)   # Gram matrix of the invariant inner product

rho = lambda k: rot2(np.pi * k / 2); add4 = lambda a, b: (a + b) % 4
print(np.round(rho(1) @ np.array([1.0, 0.0]), 3).tolist(), is_rep(rho, range(4), add4), is_rep(rot2, range(4), add4), averaged_inner(rho, range(4), np.diag([1.0, 3.0])).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 1.0] True False [[2.0, 0.0], [0.0, 2.0]]",
          "[0.0, 1.0] True True [[2.0, 0.0], [0.0, 2.0]]",
          "[0.0, -1.0] True False [[2.0, 0.0], [0.0, 2.0]]",
          "[0.0, 1.0] True False [[1.0, 0.0], [0.0, 3.0]]",
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

def character(rho, elements):
    return [float(np.trace(rho(g))) for g in elements]

def invariant_dim(rho, elements):
    return round(sum(character(rho, elements)) / len(elements))   # the trace of the averaging projector

def invariant_projector(rho, elements):
    return sum(rho(g) for g in elements) / len(elements)

P = lambda k: np.roll(np.eye(4), k, axis=0)
print(character(P, range(4)), invariant_dim(P, range(4)), invariant_projector(P, range(4))[0].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 0.0, 0.0, 0.0] 1 [0.25, 0.25, 0.25, 0.25]",
          "[4.0, 0.0, 0.0, 0.0] 4 [0.25, 0.25, 0.25, 0.25]",
          "[4.0, 1.0, 1.0, 1.0] 1 [0.25, 0.25, 0.25, 0.25]",
          "[4.0, 0.0, 0.0, 0.0] 1 [1.0, 0.0, 0.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rot2(theta)</C>, the anticlockwise rotation matrix, <C>is_rep(rho, elements, op)</C>, which checks{" "}
          <M>{"\\rho(gh) = \\rho(g)\\rho(h)"}</M> on all pairs, and <C>averaged_inner(rho, elements, B)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rot2(theta):
    c, s = np.cos(theta), np.sin(theta)
    return np.array([[c, s], [-s, c]])

def is_rep(rho, elements, op):
    return True

def averaged_inner(rho, elements, B):
    return B
`,
        solution: REP,
        tests: [
          { name: "rot", code: `add3 = lambda a, b: (a + b) % 3\nassert np.allclose(rot2(np.pi / 2) @ np.array([1.0, 0.0]), [0.0, 1.0])\nassert is_rep(lambda k: rot2(2 * np.pi * k / 3), range(3), add3) and not is_rep(rot2, range(3), add3)` },
          { name: "inner", code: `rho = lambda k: np.eye(2) if k == 0 else np.array([[0.0, 1.0], [1.0, 0.0]])\nassert np.allclose(averaged_inner(rho, [0, 1], np.diag([1.0, 5.0])), np.diag([3.0, 3.0]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>character(rho, elements)</C> as a list of floats, <C>invariant_dim(rho, elements)</C> from the character, and{" "}
          <C>invariant_projector(rho, elements)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def character(rho, elements):
    return [float(rho(g)[0, 0]) for g in elements]

def invariant_dim(rho, elements):
    return len(rho(0))

def invariant_projector(rho, elements):
    return np.eye(len(rho(0)))
`,
        solution: CHAR,
        tests: [
          { name: "chi", code: `P = lambda k: np.roll(np.eye(3), k, axis=0)\nassert character(P, range(3)) == [3.0, 0.0, 0.0] and invariant_dim(P, range(3)) == 1` },
          { name: "proj", code: `S = lambda k: np.diag([1.0, (-1.0) ** k])\nQ = invariant_projector(S, range(2))\nassert np.allclose(Q, np.diag([1.0, 0.0])) and np.allclose(Q @ Q, Q)` },
        ],
      },
    },
    {
      key: "tensor3",
      rung: "stretch",
      prompt: (
        <p>
          <M>{"S_3"}</M> permutes the coordinates of <M>{"\\mathbb{R}^3"}</M>, and hence acts on third-order tensors{" "}
          <M>{"T_{ijk}"}</M> by permuting all three indices at once. What is the dimension of the space of invariant tensors?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Invariant complements let any representation be split, and split again, until the pieces cannot be split further. The next
        lesson shows that these irreducible pieces are unique, that the characters of different irreducibles are orthogonal, and
        that Schur&apos;s lemma pins down every intertwiner between them.
      </p>
    </>
  ),
};
