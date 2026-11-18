import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShampooPowerViz } from "@/components/viz/ShampooPowerViz";
import type { LessonContent } from "@/lib/types";

const SHAMPOO = `import numpy as np

def inv_root(A, p, eps=0.0):
    lam, V = np.linalg.eigh(np.asarray(A, float))
    return (V * (np.maximum(lam, 0.0) + eps) ** (-p)) @ V.T

def kron_stats(Gs):
    L = sum(G @ G.T for G in Gs)
    R = sum(G.T @ G for G in Gs)
    return L, R

def shampoo_dir(G, L, R, p=0.25, eps=1e-12):
    return inv_root(L, p, eps) @ G @ inv_root(R, p, eps)`;

const SOAP = `import numpy as np

def eigenbases(L, R):
    return np.linalg.eigh(L)[1], np.linalg.eigh(R)[1]

def rotated_second_moment(Gs, QL, QR):
    return np.mean([(QL.T @ G @ QR) ** 2 for G in Gs], axis=0)

def soap_dir(G, QL, QR, V, eps=1e-12):
    Gr = QL.T @ G @ QR
    return QL @ (Gr / (np.sqrt(V) + eps)) @ QR.T`;

export const lesson: LessonContent = {
  id: "m14.3.3",
  minutes: 50,
  links: {
    requires: ["m14.3.2", "m11.7.2"],
    revisits: ["m14.2.3", "m6.3.4"],
    foreshadows: ["m14.3.4"],
  },

  puzzle: (
    <>
      <p>
        Shampoo preconditions a weight matrix&apos;s gradient G by <M>{"L^{-1/4}GR^{-1/4}"}</M>, where L and R accumulate{" "}
        <M>{"GG^\\top"}</M> and <M>{"G^\\top G"}</M>. Full-matrix AdaGrad uses the power −1/2. Why would two quarter-powers
        stand in for a half-power, and when are they the wrong choice? And SOAP, which won optimiser benchmarks by running
        Adam &quot;inside Shampoo&apos;s eigenbasis&quot;: what does that phrase mean, and what does it buy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Treat a weight matrix&apos;s gradient as a random matrix. If its rows are correlated in one way and its columns in
        another, independently, its covariance is a Kronecker product A ⊗ B, and the m × m and n × n statistics L and R
        recover A and B up to scale. Whitening by both square roots then whitens the whole gradient, just as full-matrix
        AdaGrad would, for the price of two small matrices. With a single gradient the story flips: the same half-powers
        invert the singular values, while quarter-powers make them all 1. Shampoo&apos;s 1/4 is a compromise that is safe
        in both regimes. SOAP goes further: in the eigenbases of L and R the preconditioner is diagonal, so it can be
        replaced by an Adam that tracks each rotated entry separately.
      </p>
      <ShampooPowerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Shampoo">
        <p>
          For a weight matrix with gradients <M>{"G_1, G_2, \\dots"}</M> of size m × n, keep{" "}
          <M>{"L_t = \\sum_{s\\le t}G_sG_s^\\top"}</M> and <M>{"R_t = \\sum_{s\\le t}G_s^\\top G_s"}</M> and step along{" "}
          <M>{"L_t^{-p}G_tR_t^{-p}"}</M>, with p = 1/4 in the original method and a small damping added before the roots.
        </p>
      </Definition>

      <Theorem title="Kronecker-structured gradients">
        <p>
          If <M>{"E[G_{ij}G_{kl}] = A_{ik}B_{jl}"}</M>, that is, vec(G) has covariance A ⊗ B, then{" "}
          <M>{"E[GG^\\top] = \\operatorname{tr}(B)A"}</M> and <M>{"E[G^\\top G] = \\operatorname{tr}(A)B"}</M>, and the
          full-matrix whitening of G is
        </p>
        <MD>{"(A\\otimes B)^{-1/2}\\operatorname{vec}(G) = \\operatorname{vec}(A^{-1/2}GB^{-1/2}) = \\sqrt{\\operatorname{tr}A\\,\\operatorname{tr}B}\;\\operatorname{vec}\\big(E[GG^\\top]^{-1/2}\\,G\\,E[G^\\top G]^{-1/2}\\big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"E[GG^\\top]_{ik} = \\sum_j E[G_{ij}G_{kj}] = A_{ik}\\sum_j B_{jj}"}</M>, and the same with rows and columns
          exchanged gives R. In row-major order the covariance of vec(G) is the Kronecker product A ⊗ B, whose powers are{" "}
          <M>{"A^{q}\\otimes B^{q}"}</M>, and <M>{"(A^{q}\\otimes B^{q})\\operatorname{vec}(G) = \\operatorname{vec}(A^{q}GB^{q})"}</M>{" "}
          for symmetric B. Substituting <M>{"A = E[GG^\\top]/\\operatorname{tr}B"}</M> and{" "}
          <M>{"B = E[G^\\top G]/\\operatorname{tr}A"}</M> gives the last form. So with this structure the right exponent is
          1/2 on each side.
        </p>
      </Proof>

      <Theorem title="one gradient">
        <p>
          If <M>{"L = GG^\\top"}</M> and <M>{"R = G^\\top G"}</M> for a single G = UΣVᵀ of full rank, then{" "}
          <M>{"L^{-p}GR^{-p} = U\\Sigma^{1-4p}V^\\top"}</M>: the orthogonalised <M>{"UV^\\top"}</M> for p = 1/4 and{" "}
          <M>{"U\\Sigma^{-1}V^\\top"}</M> for p = 1/2.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"L = U\\Sigma^2U^\\top"}</M> and <M>{"R = V\\Sigma^2V^\\top"}</M>, so{" "}
          <M>{"L^{-p}GR^{-p} = U\\Sigma^{-2p}U^\\top U\\Sigma V^\\top V\\Sigma^{-2p}V^\\top = U\\Sigma^{1-4p}V^\\top"}</M>. Early in
          training, when L and R are dominated by a few gradients, p = 1/2 would blow up the smallest singular directions;
          p = 1/4 keeps every direction at unit size. Shampoo&apos;s regret analysis uses the bound{" "}
          <M>{"\\sum gg^\\top \\preceq r\\,L^{1/2}\\otimes R^{1/2}"}</M> for gradients of rank at most r, which is where the
          quarter powers come from.
        </p>
        <Code>{SHAMPOO}</Code>
      </Proof>

      <Theorem title="SOAP is Adam in Shampoo's eigenbasis">
        <p>
          Let <M>{"L = Q_L\\Lambda Q_L^\\top"}</M>, <M>{"R = Q_RMQ_R^\\top"}</M> and <M>{"\\tilde G = Q_L^\\top GQ_R"}</M>. Then
          Shampoo with exponent p scales entry (i, j) of <M>{"\\tilde G"}</M> by <M>{"\\lambda_i^{-p}\\mu_j^{-p}"}</M> and
          rotates back. SOAP instead divides each entry by the root of its own running second moment{" "}
          <M>{"V_{ij}"}</M>, as Adam would. Under the Kronecker structure above, SOAP and Shampoo with p = 1/2 point in the
          same direction.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"L^{-p}GR^{-p} = Q_L\\Lambda^{-p}Q_L^\\top GQ_RM^{-p}Q_R^\\top = Q_L(\\Lambda^{-p}\\tilde GM^{-p})Q_R^\\top"}</M>,
          and multiplying by diagonal matrices on both sides scales entry (i, j) by <M>{"\\lambda_i^{-p}\\mu_j^{-p}"}</M>. With
          covariance A ⊗ B, the eigenvectors of L and R are those of A and B, with eigenvalues{" "}
          <M>{"\\lambda_i = \\operatorname{tr}(B)a_i"}</M> and <M>{"\\mu_j = \\operatorname{tr}(A)b_j"}</M>, and{" "}
          <M>{"E\\tilde G_{ij}^2 = a_ib_j"}</M>. So{" "}
          <M>{"V_{ij}^{-1/2} = \\sqrt{\\operatorname{tr}A\\operatorname{tr}B}\\,\\lambda_i^{-1/2}\\mu_j^{-1/2}"}</M>, a constant
          multiple of Shampoo&apos;s scaling. When the structure is not exactly Kronecker, the product form{" "}
          <M>{"\\lambda_i\\mu_j"}</M> is only an approximation, and SOAP&apos;s per-entry estimate can correct it.
        </p>
        <Code>{SOAP}</Code>
      </Proof>

      <Remark title="in practice">
        <p>
          Eigendecompositions of L and R cost <M>{"O(m^3 + n^3)"}</M>, so both methods refresh them only every few dozen
          steps, in higher precision. SOAP keeps Adam&apos;s momentum and second moments in the rotated basis and updates
          them every step, which makes it robust to infrequent refreshes; the extra memory is the two factor matrices and
          one more mn array. Both methods are Adam-like in that they scale away the gradient&apos;s magnitude, and both
          are expensive enough that a cheaper route to the orthogonalised direction is attractive: that is the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "half",
      rung: "check",
      prompt: <p>A single gradient has singular values 8 and 2. With L = GGᵀ and R = GᵀG, what is the largest singular value of L^(−1/2) G R^(−1/2)?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "stat",
      rung: "check",
      prompt: <p>A 2 × 2 gradient has covariance A ⊗ B with A = diag(4, 1) and B = diag(9, 1). What is E[GGᵀ] in position (1, 1)?</p>,
      answer: { kind: "numeric", value: 40, tolerance: 0.0001 },
    },
    {
      key: "soap",
      rung: "apply",
      prompt: <p>What does SOAP change relative to Shampoo?</p>,
      answer: {
        kind: "choice",
        options: [
          "It keeps Shampoo's eigenbases but replaces the product scaling λᵢ^(−p)μⱼ^(−p) with Adam's per-entry second moments of the rotated gradient",
          "It replaces the eigenbases with the identity, which makes it plain Adam",
          "It drops the right factor R and preconditions only the rows",
          "It uses exponent 1 instead of 1/4, which makes it Newton's method",
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

def inv_root(A, p, eps=0.0):
    lam, V = np.linalg.eigh(np.asarray(A, float))
    return (V * (np.maximum(lam, 0.0) + eps) ** (-p)) @ V.T

def kron_stats(Gs):
    L = sum(G @ G.T for G in Gs)
    R = sum(G.T @ G for G in Gs)
    return L, R

def shampoo_dir(G, L, R, p=0.25, eps=1e-12):
    return inv_root(L, p, eps) @ G @ inv_root(R, p, eps)

G = np.array([[3.0, 0.0], [0.0, 1.0]])
L, R = kron_stats([G])
print(L.diagonal(), shampoo_dir(G, L, R).round(3).tolist(), shampoo_dir(G, L, R, p=0.5).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[9. 1.] [[1.0, 0.0], [0.0, 1.0]] [[0.333, 0.0], [0.0, 1.0]]",
          "[9. 1.] [[1.0, 0.0], [0.0, 1.0]] [[1.0, 0.0], [0.0, 1.0]]",
          "[3. 1.] [[1.0, 0.0], [0.0, 1.0]] [[0.333, 0.0], [0.0, 1.0]]",
          "[9. 1.] [[0.577, 0.0], [0.0, 1.0]] [[0.333, 0.0], [0.0, 1.0]]",
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

def eigenbases(L, R):
    return np.linalg.eigh(L)[1], np.linalg.eigh(R)[1]

def rotated_second_moment(Gs, QL, QR):
    return np.mean([(QL.T @ G @ QR) ** 2 for G in Gs], axis=0)

def soap_dir(G, QL, QR, V, eps=1e-12):
    Gr = QL.T @ G @ QR
    return QL @ (Gr / (np.sqrt(V) + eps)) @ QR.T

Gs = [np.array([[2.0, 0.0], [0.0, 1.0]]), np.array([[-2.0, 0.0], [0.0, 3.0]])]
QL, QR = np.eye(2), np.eye(2)
V = rotated_second_moment(Gs, QL, QR)
print(V.tolist(), soap_dir(Gs[1], QL, QR, V).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[4.0, 0.0], [0.0, 5.0]] [[-1.0, 0.0], [0.0, 1.342]]",
          "[[4.0, 0.0], [0.0, 5.0]] [[-1.0, 0.0], [0.0, 0.6]]",
          "[[0.0, 0.0], [0.0, 4.0]] [[-1.0, 0.0], [0.0, 1.342]]",
          "[[4.0, 0.0], [0.0, 5.0]] [[-1.0, 0.0], [0.0, 1.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>inv_root(A, p, eps=0.0)</C>, returning <C>(A + εI)^(−p)</C> for symmetric A with negative eigenvalues
          clipped to zero; <C>kron_stats(Gs)</C>, returning L = ΣGGᵀ and R = ΣGᵀG; and{" "}
          <C>shampoo_dir(G, L, R, p=0.25, eps=1e-12)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inv_root(A, p, eps=0.0):
    return np.asarray(A, float) ** (-p)

def kron_stats(Gs):
    return Gs[0] @ Gs[0].T, Gs[0].T @ Gs[0]

def shampoo_dir(G, L, R, p=0.25, eps=1e-12):
    return G
`,
        solution: SHAMPOO,
        tests: [
          { name: "roots", code: `S = inv_root(np.array([[5.0, 3.0], [3.0, 5.0]]), 0.5); assert np.allclose(S, [[0.53033009, -0.1767767], [-0.1767767, 0.53033009]])
L, R = kron_stats([np.eye(2), 2 * np.eye(2), np.array([[0.0, 1.0], [0.0, 0.0]])]); assert np.allclose(L, [[6, 0], [0, 5]]) and np.allclose(R, [[5, 0], [0, 6]])` },
          { name: "shampoo", code: `rng = np.random.default_rng(1); G = rng.standard_normal((4, 3)); L, R = kron_stats([G])
U, s, Vt = np.linalg.svd(G, full_matrices=False)
assert np.allclose(shampoo_dir(G, L, R), U @ Vt, atol=1e-6) and np.allclose(shampoo_dir(G, L, R, 0.5), (U / s) @ Vt, atol=1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eigenbases(L, R)</C>, the eigenvector matrices of L and R; <C>rotated_second_moment(Gs, QL, QR)</C>, the
          mean over the gradients of the entrywise square of <C>QLᵀ G QR</C>; and <C>soap_dir(G, QL, QR, V, eps=1e-12)</C>,
          which rotates G, divides each entry by <C>√V + ε</C>, and rotates back.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def eigenbases(L, R):
    return np.eye(len(L)), np.eye(len(R))

def rotated_second_moment(Gs, QL, QR):
    return np.ones_like(Gs[0])

def soap_dir(G, QL, QR, V, eps=1e-12):
    return G
`,
        solution: SOAP,
        tests: [
          { name: "basics", code: `L = np.array([[2.0, 1.0], [1.0, 2.0]]); QL, QR = eigenbases(L, np.diag([1.0, 3.0])); assert np.allclose(QL.T @ L @ QL, np.diag([1.0, 3.0])) and np.allclose(np.abs(QR), np.eye(2))
Gs = [np.array([[2.0, 0.0], [0.0, 1.0]]), np.array([[-2.0, 0.0], [0.0, 3.0]])]; V = rotated_second_moment(Gs, np.eye(2), np.eye(2))
assert np.allclose(V, [[4, 0], [0, 5]]) and np.allclose(soap_dir(Gs[1], np.eye(2), np.eye(2), V), [[-1, 0], [0, 3 / np.sqrt(5)]])` },
          { name: "kron", code: `rng = np.random.default_rng(0); A = np.array([[4.0, 1.0, 0.0], [1.0, 2.0, 0.0], [0.0, 0.0, 0.5]]); B = np.diag([9.0, 1.0, 0.25])
Ah, Bh = np.linalg.cholesky(A), np.linalg.cholesky(B); Gs = [Ah @ rng.standard_normal((3, 3)) @ Bh.T for _ in range(20000)]
L = sum(G @ G.T for G in Gs); R = sum(G.T @ G for G in Gs); QL, QR = eigenbases(L, R); V = rotated_second_moment(Gs, QL, QR)
lam, mu = np.linalg.eigvalsh(L) / len(Gs), np.linalg.eigvalsh(R) / len(Gs); ratio = V / np.outer(lam, mu)
assert np.allclose(ratio, ratio.mean(), rtol=0.06) and abs(ratio.mean() * np.trace(A) * np.trace(B) - 1) < 0.06` },
        ],
      },
    },
    {
      key: "const",
      rung: "stretch",
      prompt: (
        <p>
          With covariance A ⊗ B, A = diag(4, 1) and B = diag(9, 1), the SOAP direction equals a constant times the Shampoo
          direction with p = 1/2 built from E[GGᵀ] and E[GᵀG]. What is the constant? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 7.07, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        For a single gradient, Shampoo&apos;s direction is the orthogonalised gradient <M>{"UV^\\top"}</M>. Muon keeps only
        that: it applies momentum, then pushes every singular value towards 1 with a few Newton–Schulz iterations, with no
        statistics and no eigendecompositions at all.
      </p>
    </>
  ),
};
