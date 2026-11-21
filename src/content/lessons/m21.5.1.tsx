import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChiralAlignViz } from "@/components/viz/ChiralAlignViz";
import type { LessonContent } from "@/lib/types";

const ALIGN = `import numpy as np

def dist_matrix(X):
    return np.linalg.norm(X[:, None, :] - X[None, :, :], axis=-1)   # invariant under rotations, reflections, translations

def kabsch(X, Y):
    Xc, Yc = X - X.mean(0), Y - Y.mean(0)
    U, _, Vt = np.linalg.svd(Xc.T @ Yc)
    d = np.sign(np.linalg.det(U @ Vt))                         # forbid reflections: keep det R = +1
    return U @ np.diag([1.0] * (X.shape[1] - 1) + [d]) @ Vt   # R minimising |Xc R - Yc|

def rmsd_aligned(X, Y):
    Xc, Yc = X - X.mean(0), Y - Y.mean(0)
    return float(np.sqrt(np.mean(np.sum((Xc @ kabsch(X, Y) - Yc) ** 2, axis=1))))`;

const LAYER = `import numpy as np

def signed_volume(P):
    return float(np.linalg.det(P[1:] - P[0]) / 6)             # tetrahedron volume with sign: flips under reflection

def egnn_layer(X, h):
    diff = X[:, None, :] - X[None, :, :]
    m = np.tanh(h[:, None] * h[None, :] - np.sum(diff ** 2, axis=-1))
    np.fill_diagonal(m, 0.0)                                   # messages from invariants only
    return X + 0.1 * np.einsum('ij,ijk->ik', m, diff), h + m.sum(1)

def rot_z(t):
    c, s = np.cos(t), np.sin(t)
    return np.array([[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]])`;

export const lesson: LessonContent = {
  id: "m21.5.1",
  minutes: 55,
  links: {
    requires: ["m21.3.3", "m21.1.3"],
    revisits: ["m3.8.3", "m3.6.3"],
    foreshadows: ["m21.5.2"],
  },

  puzzle: (
    <>
      <p>
        A molecule is a handful of atoms at positions in space. Turn it, move it, or list its atoms in another order, and its
        energy, its solubility and the way it binds to a protein stay the same. Yet a molecule and its mirror image, which have
        exactly the same bond lengths and angles, can act completely differently in the body. How should a network read a
        cloud of atoms so that it ignores the first kind of change but can still see the second?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The symmetries are rotations, translations and relabellings, together with reflections if the property does not care
        about handedness. Pairwise distances are blind to all of them, and they determine the shape completely, except that a
        shape and its mirror image have the same distances. Networks for molecules therefore pass messages built from
        distances, as the graph networks of m21.3.3 did with edges, and move atoms along difference vectors, which rotate with
        the molecule. Comparing two structures needs the same care: first find the rotation that lines them up best, then
        measure what is left.
      </p>
      <ChiralAlignViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the symmetries of a point cloud">
        <p>
          A molecule with N atoms is a matrix <M>{"X \\in \\mathbb{R}^{N \\times 3}"}</M> of positions with features{" "}
          <M>{"h_i"}</M> such as the element of each atom. The Euclidean group E(3) acts by <M>{"x_i \\mapsto Qx_i + t"}</M> with Q
          orthogonal, its subgroup SE(3) by rotations only (det Q = 1), and the permutation group <M>{"S_N"}</M> by relabelling.
          The energy is invariant under SE(3) and <M>{"S_N"}</M>, and the forces, minus the gradient of the energy, are equivariant:
          they rotate with the molecule (m21.1.3). Once rotations and translations are removed, a molecule whose atoms are not all
          on a line has <M>{"3N - 6"}</M> internal degrees of freedom.
        </p>
      </Definition>

      <Theorem title="distances determine a cloud up to E(3)">
        <p>
          Two clouds X and Y in <M>{"\\mathbb{R}^d"}</M> with the same matrix of pairwise distances (<C>dist_matrix</C>) are
          related by <M>{"y_i = Qx_i + t"}</M> for some orthogonal Q and vector t.
        </p>
      </Theorem>
      <Proof>
        <p>
          Translate both clouds so that their centroids are at the origin; distances do not change. For centred points,{" "}
          <M>{"x_i\\cdot x_j = \\tfrac12(|x_i|^2 + |x_j|^2 - |x_i - x_j|^2)"}</M>, and <M>{"|x_i|^2"}</M> is itself determined by the
          distances, since <M>{"\\sum_j |x_i - x_j|^2 = N|x_i|^2 + \\sum_j |x_j|^2"}</M> when <M>{"\\sum_j x_j = 0"}</M>. So the Gram
          matrices <M>{"XX^\\top"}</M> and <M>{"YY^\\top"}</M> are equal. Two matrices with the same Gram matrix have rows with the
          same inner products, so the linear map sending each <M>{"x_i"}</M> to <M>{"y_i"}</M> on the span of the rows is well
          defined and preserves inner products, and it extends to an orthogonal Q of the whole space.
        </p>
      </Proof>

      <Remark title="chirality">
        <p>
          The orthogonal Q in the theorem may be a reflection, and nothing in the distances can rule that out. A rotation-only
          invariant that does see handedness is the signed volume of four atoms,{" "}
          <M>{"\\tfrac16\\det[x_2 - x_1,\\ x_3 - x_1,\\ x_4 - x_1]"}</M> (<C>signed_volume</C>, m3.6.3), which keeps its sign under
          rotations and flips it under a reflection. Mirror-image molecules, enantiomers, can bind to proteins very differently,
          and proteins themselves are built from amino acids of one handedness, so a model of biological structure must be
          invariant under SE(3) but not under all of E(3).
        </p>
      </Remark>

      <Theorem title="the best rotation (Kabsch)">
        <p>
          For centred clouds X and Y with rows as points, let <M>{"X^\\top Y = U\\Sigma V^\\top"}</M> be a singular value
          decomposition (m3.8.3). Among orthogonal R, <M>{"\\|XR - Y\\|^2"}</M> is smallest at <M>{"R = UV^\\top"}</M>. Among
          rotations it is smallest at <M>{"R = U\\,\\mathrm{diag}(1, \\dots, 1, s)\\,V^\\top"}</M> with{" "}
          <M>{"s = \\operatorname{sign}\\det(UV^\\top)"}</M> (<C>kabsch</C>). The root mean square deviation after this rotation{" "}
          (<C>rmsd_aligned</C>) is the standard way to compare two structures of the same molecule.
        </p>
        <Code>{ALIGN}</Code>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\|XR - Y\\|^2 = \\|X\\|^2 + \\|Y\\|^2 - 2\\operatorname{tr}(R^\\top X^\\top Y)"}</M> because R is orthogonal, so we
          maximise <M>{"\\operatorname{tr}(R^\\top U\\Sigma V^\\top) = \\operatorname{tr}(\\Sigma\\, V^\\top R^\\top U)"}</M>. The
          matrix <M>{"W = V^\\top R^\\top U"}</M> is orthogonal, so its diagonal entries are at most 1 and the trace is at most{" "}
          <M>{"\\sum_i \\sigma_i"}</M>, reached at W = I, that is <M>{"R = UV^\\top"}</M>. If that R is a reflection, the best
          rotation instead gives up the smallest singular value: W ranges over orthogonal matrices of determinant{" "}
          <M>{"\\det(UV^\\top)"}</M>, and on those the largest value of <M>{"\\sum_i \\sigma_i W_{ii}"}</M> is{" "}
          <M>{"\\sigma_1 + \\dots + \\sigma_{d-1} - \\sigma_d"}</M>, at W = diag(1, …, 1, −1).
        </p>
      </Proof>

      <Definition title="an E(n)-equivariant message-passing layer">
        <p>
          The EGNN layer of Satorras, Hoogeboom and Welling updates positions and features together:
        </p>
        <MD>{"m_{ij} = \\phi(h_i, h_j, |x_i - x_j|^2), \\quad x_i' = x_i + c\\sum_{j \\ne i} m_{ij}(x_i - x_j), \\quad h_i' = h_i + \\sum_{j \\ne i} m_{ij}"}</MD>
        <p>
          In the code, <M>{"\\phi = \\tanh(h_ih_j - |x_i - x_j|^2)"}</M> and c = 0.1 (<C>egnn_layer</C>); a real model learns φ, with
          vector-valued messages and a separate scalar weight on the position update.
        </p>
      </Definition>

      <Theorem title="the layer is equivariant">
        <p>
          If every <M>{"x_i"}</M> is replaced by <M>{"Qx_i + t"}</M> with Q orthogonal, the output positions are{" "}
          <M>{"Qx_i' + t"}</M> and the output features are unchanged. Relabelling the atoms relabels the outputs in the same way.
        </p>
        <Code>{LAYER}</Code>
      </Theorem>
      <Proof>
        <p>
          The messages depend on the features and on distances, which are unchanged, so <M>{"m_{ij}"}</M> and{" "}
          <M>{"h_i'"}</M> are unchanged. The differences become <M>{"Q(x_i - x_j)"}</M>, the translation cancelling, so{" "}
          <M>{"Qx_i + t + c\\sum_j m_{ij}Q(x_i - x_j) = Qx_i' + t"}</M>. The sum over j does not depend on the order of the atoms,
          as in m21.3.3. Because Q may be a reflection, any invariant output of a stack of such layers is also reflection
          invariant, and cannot tell enantiomers apart.
        </p>
      </Proof>

      <Example title="proteins">
        <p>
          A protein is a chain of amino acid residues, and structure models usually give each residue a rigid frame, a rotation
          and a translation built from three backbone atoms. AlphaFold 2 updates these frames with an attention layer whose scores
          use points expressed in each residue&apos;s frame, which makes it SE(3)-invariant without being reflection invariant, and
          generative models such as RFdiffusion run diffusion over frames. Predictions are scored by RMSD after the Kabsch
          alignment, or by measures that avoid superposition entirely, such as lDDT, which compares local distances.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dof",
      rung: "check",
      prompt: (
        <p>
          A molecule has 12 atoms, not all on a line. How many internal degrees of freedom does it have once rotations and
          translations are removed?
        </p>
      ),
      answer: { kind: "numeric", value: 30, tolerance: 0 },
    },
    {
      key: "vol",
      rung: "check",
      prompt: (
        <p>
          What is the signed volume <M>{"\\tfrac16\\det[x_2 - x_1, x_3 - x_1, x_4 - x_1]"}</M> for the atoms (0, 0, 0), (2, 0, 0),
          (0, 3, 0) and (1, 1, 4)?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.0005 },
    },
    {
      key: "enant",
      rung: "apply",
      prompt: <p>Why can a stack of EGNN layers with an invariant readout never predict different binding for a molecule and its mirror image?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its messages depend only on features and distances, which a reflection leaves unchanged, so the layer is equivariant under all of E(3), reflections included",
          "Because the layer ignores the positions of the atoms",
          "Because reflections change the number of atoms",
          "Because the Kabsch rotation always has determinant −1",
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

def dist_matrix(X):
    return np.linalg.norm(X[:, None, :] - X[None, :, :], axis=-1)   # invariant under rotations, reflections, translations

def kabsch(X, Y):
    Xc, Yc = X - X.mean(0), Y - Y.mean(0)
    U, _, Vt = np.linalg.svd(Xc.T @ Yc)
    d = np.sign(np.linalg.det(U @ Vt))                         # forbid reflections: keep det R = +1
    return U @ np.diag([1.0] * (X.shape[1] - 1) + [d]) @ Vt   # R minimising |Xc R - Yc|

def rmsd_aligned(X, Y):
    Xc, Yc = X - X.mean(0), Y - Y.mean(0)
    return float(np.sqrt(np.mean(np.sum((Xc @ kabsch(X, Y) - Yc) ** 2, axis=1))))

X = np.array([[0.0, 0.0], [3.0, 0.0], [0.0, 4.0]]); Y = X @ np.array([[0.0, 1.0], [-1.0, 0.0]]) + 7.0
print(dist_matrix(X)[1].round(3).tolist(), round(rmsd_aligned(X, Y), 3), round(rmsd_aligned(X, X * [1, -1]), 3) > 0, kabsch(X, Y).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.0, 0.0, 5.0] 0.0 True [[0.0, 1.0], [-1.0, 0.0]]",
          "[3.0, 0.0, 5.0] 7.0 True [[0.0, 1.0], [-1.0, 0.0]]",
          "[3.0, 0.0, 5.0] 0.0 False [[0.0, 1.0], [-1.0, 0.0]]",
          "[3.0, 0.0, 5.0] 0.0 True [[0.0, -1.0], [1.0, 0.0]]",
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

def signed_volume(P):
    return float(np.linalg.det(P[1:] - P[0]) / 6)             # tetrahedron volume with sign: flips under reflection

def egnn_layer(X, h):
    diff = X[:, None, :] - X[None, :, :]
    m = np.tanh(h[:, None] * h[None, :] - np.sum(diff ** 2, axis=-1))
    np.fill_diagonal(m, 0.0)                                   # messages from invariants only
    return X + 0.1 * np.einsum('ij,ijk->ik', m, diff), h + m.sum(1)

def rot_z(t):
    c, s = np.cos(t), np.sin(t)
    return np.array([[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]])

P = np.array([[0.0, 0, 0], [1, 0, 0], [0, 2, 0], [0, 0, 3]]); X2, h2 = egnn_layer(P, np.ones(4))
print(signed_volume(P), signed_volume(P * [-1, 1, 1]), np.allclose(egnn_layer(P @ rot_z(1.0).T, np.ones(4))[0], X2 @ rot_z(1.0).T), round(float(h2[0]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 -1.0 True -0.995",
          "1.0 1.0 True -0.995",
          "6.0 -6.0 True -0.995",
          "1.0 -1.0 False -0.995",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dist_matrix(X)</C>, <C>kabsch(X, Y)</C> returning the rotation R (det R = 1) that minimises{" "}
          <M>{"\\|(X - \\bar X)R - (Y - \\bar Y)\\|"}</M> for clouds with rows as points, and <C>rmsd_aligned(X, Y)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dist_matrix(X):
    return X @ X.T

def kabsch(X, Y):
    return np.eye(X.shape[1])

def rmsd_aligned(X, Y):
    return float(np.sqrt(np.mean(np.sum((X - Y) ** 2, axis=1))))
`,
        solution: ALIGN,
        tests: [
          { name: "dist", code: `X = np.array([[1.0, 1, 1], [1, 1, 3], [1, 4, 1]])\nassert np.allclose(dist_matrix(X), [[0, 2, 3], [2, 0, np.sqrt(13)], [3, np.sqrt(13), 0]])` },
          { name: "align", code: `X = np.random.default_rng(0).normal(size=(6, 3)); c, s = np.cos(0.8), np.sin(0.8)\nR = np.array([[c, s, 0], [-s, c, 0], [0, 0, 1]]); Y = X @ R + 1.0\nassert np.allclose(kabsch(X, Y), R) and rmsd_aligned(X, Y) < 1e-9\nassert np.linalg.det(kabsch(X, X * [1, 1, -1])) > 0 and rmsd_aligned(X, X * [1, 1, -1]) > 0.1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>signed_volume(P)</C> for four atoms, <C>egnn_layer(X, h)</C> with{" "}
          <M>{"m_{ij} = \\tanh(h_ih_j - |x_i - x_j|^2)"}</M> for i ≠ j, <M>{"x_i' = x_i + 0.1\\sum_j m_{ij}(x_i - x_j)"}</M> and{" "}
          <M>{"h_i' = h_i + \\sum_j m_{ij}"}</M>, and <C>rot_z(t)</C>, the rotation by angle t about the z axis.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def signed_volume(P):
    return float(abs(np.linalg.det(P[1:] - P[0])) / 6)

def egnn_layer(X, h):
    return X, h

def rot_z(t):
    return np.eye(3)
`,
        solution: LAYER,
        tests: [
          { name: "chiral", code: `P = np.array([[1.0, 1, 1], [3, 1, 1], [1, 4, 1], [1, 1, 2]])\nassert abs(signed_volume(P) - 1.0) < 1e-12 and abs(signed_volume(P * [1, 1, -1]) + 1.0) < 1e-12` },
          { name: "layer", code: `X1, h1 = egnn_layer(np.array([[0.0, 0, 0], [1, 0, 0]]), np.array([2.0, 1.0]))\nassert np.allclose(h1, [2 + np.tanh(1), 1 + np.tanh(1)]) and np.allclose(X1[0], [-0.1 * np.tanh(1), 0, 0])\nR = rot_z(0.7); assert abs(R[1, 0] - np.sin(0.7)) < 1e-12\nX = np.random.default_rng(1).normal(size=(5, 3)); h = np.linspace(-1, 1, 5)\nA, a = egnn_layer(X, h); B, b = egnn_layer(X @ R.T + 2.0, h)\nassert np.allclose(B, A @ R.T + 2.0) and np.allclose(a, b)` },
        ],
      },
    },
    {
      key: "square",
      rung: "stretch",
      prompt: (
        <p>
          Atoms 1 to 4 sit at (1, 1, 0), (1, −1, 0), (−1, −1, 0) and (−1, 1, 0) in one structure and at (2, 0.5, 0), (2, −0.5, 0),
          (−2, −0.5, 0) and (−2, 0.5, 0) in another. What is the RMSD after the best rotation? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.118, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Molecules only need positions to be equivariant. The next lesson asks for more: networks that output vectors and
        higher-order quantities such as forces, velocities and stresses, built from the representations of the rotation group
        met in Chapter 2, and that respect the conservation laws of the physical systems they model.
      </p>
    </>
  ),
};
