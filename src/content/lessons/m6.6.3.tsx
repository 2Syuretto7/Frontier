import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CirculantViz } from "@/components/viz/CirculantViz";
import type { LessonContent } from "@/lib/types";

const CIRC = `import numpy as np

def circulant(c):
    c = np.asarray(c, dtype=float)
    n = len(c)
    return np.array([[c[(i - j) % n] for j in range(n)] for i in range(n)])

def circ_conv_fft(c, x):
    return np.real(np.fft.ifft(np.fft.fft(c) * np.fft.fft(x)))`;

const TOEP = `def toeplitz_matvec(col, row, x):
    n = len(x)
    c = np.concatenate([col, row[:0:-1]])
    xp = np.concatenate([x, np.zeros(n - 1)])
    return np.real(np.fft.ifft(np.fft.fft(c) * np.fft.fft(xp)))[:n]

def conv_spectral_norm(c):
    return float(np.abs(np.fft.fft(c)).max())`;

export const lesson: LessonContent = {
  id: "m6.6.3",
  minutes: 60,
  links: {
    requires: ["m6.6.2", "m6.3.3"],
    revisits: ["m6.3.1"],
    foreshadows: ["m6.6.5"],
  },

  puzzle: (
    <>
      <p>
        A convolutional layer is a linear map with a very particular structure: the same small kernel slides along the input.
        Why does that structure force the map to be diagonal in the Fourier basis, so that convolution becomes pointwise
        multiplication? And how can that be used to multiply by an n×n matrix in O(n log n) time or to compute a
        convolution layer&apos;s spectral norm exactly?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Shifting the input and then convolving is the same as convolving and then shifting. A matrix that commutes with the
        shift has to share its eigenvectors, and the eigenvectors of a cyclic shift are the Fourier modes, waves that come
        back to themselves times a phase when shifted. So every circulant matrix, every circular convolution, is diagonal in
        the Fourier basis, with the Fourier transform of the kernel on the diagonal.
      </p>
      <CirculantViz />
    </>
  ),

  theory: (
    <>
      <Definition title="circulant and Toeplitz matrices">
        <p>
          For <M>{"c \\in \\mathbb{C}^n"}</M>, the circulant matrix <M>{"C = \\operatorname{circ}(c)"}</M> has entries{" "}
          <M>{"C_{ij} = c_{(i - j) \\bmod n}"}</M>, indices from 0, so its first column is c and each column is the previous
          one shifted down cyclically. Then <M>{"(Cx)_i = \\sum_j c_{i-j}x_j"}</M> is the circular convolution c ⊛ x. A
          Toeplitz matrix has <M>{"T_{ij} = t_{i-j}"}</M> without wrap-around: constant along each diagonal.
        </p>
      </Definition>
      <p>
        Let S = circ(0, 1, 0, …, 0) be the cyclic shift, <M>{"(Sx)_i = x_{i-1}"}</M>. Then{" "}
        <M>{"\\operatorname{circ}(c) = \\sum_k c_kS^k"}</M>, a polynomial in S.
      </p>

      <Theorem title="circulants are exactly the shift-commuting matrices">
        <p>A square matrix A satisfies AS = SA if and only if A is circulant.</p>
      </Theorem>
      <Proof>
        <p>
          A circulant is a polynomial in S, so it commutes with S. Conversely, if AS = SA then{" "}
          <M>{"AS^k = S^kA"}</M> for all k. Let c be the first column of A, <M>{"c = Ae_0"}</M>. Since{" "}
          <M>{"e_k = S^ke_0"}</M>, column k of A is <M>{"Ae_k = AS^ke_0 = S^kAe_0 = S^kc"}</M>, which is c shifted down k
          places. That is circ(c).
        </p>
      </Proof>

      <Theorem title="the DFT diagonalises every circulant">
        <p>
          Let <M>{"\\omega = e^{2\\pi i/n}"}</M> and <M>{"f_k = (1, \\omega^k, \\omega^{2k}, \\dots, \\omega^{(n-1)k})/\\sqrt n"}</M>.
          The <M>{"f_k"}</M> form an orthonormal basis of <M>{"\\mathbb{C}^n"}</M>, and{" "}
          <M>{"\\operatorname{circ}(c)f_k = \\hat c_k f_k"}</M> with{" "}
          <M>{"\\hat c_k = \\sum_j c_j\\omega^{-jk}"}</M>, the k-th entry of the discrete Fourier transform of c.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\langle f_k, f_l\\rangle = \\frac1n\\sum_j\\omega^{j(k-l)}"}</M>, a geometric series that is 1 when k = l and
          0 otherwise, since <M>{"\\omega^{k-l} \\ne 1"}</M> is an n-th root of unity. For the shift,{" "}
          <M>{"(Sf_k)_j = (f_k)_{j-1} = \\omega^{-k}(f_k)_j"}</M>, so <M>{"Sf_k = \\omega^{-k}f_k"}</M>, and therefore{" "}
          <M>{"\\operatorname{circ}(c)f_k = \\sum_j c_jS^jf_k = \\sum_j c_j\\omega^{-jk}f_k"}</M>.
        </p>
      </Proof>
      <p>
        With F the unitary DFT matrix, <M>{"\\operatorname{circ}(c) = F^*\\operatorname{diag}(\\hat c)F"}</M>. So circular
        convolution is <M>{"c \\circledast x = \\mathrm{IDFT}(\\hat c \\odot \\hat x)"}</M>, computable in O(n log n) with the
        FFT; all circulants commute; they are normal; and their singular values are <M>{"|\\hat c_k|"}</M>, so{" "}
        <M>{"\\|\\operatorname{circ}(c)\\|_2 = \\max_k|\\hat c_k|"}</M>.
      </p>
      <Code>{CIRC}</Code>

      <Example title="Toeplitz matrices by embedding">
        <p>
          An n×n Toeplitz matrix is the top-left block of a circulant of size 2n − 1 whose first column is{" "}
          <M>{"(t_0, t_1, \\dots, t_{n-1}, t_{-(n-1)}, \\dots, t_{-1})"}</M>. To multiply by it, pad x with n − 1 zeros,
          multiply by the circulant with FFTs, and keep the first n entries. Ordinary (non-circular) convolution is a
          Toeplitz matrix, which is why zero-padding turns FFT convolution into linear convolution.
        </p>
        <Code>{TOEP}</Code>
      </Example>

      <Remark title="convolutional layers">
        <p>
          A one-channel convolution with circular padding is a circulant matrix, so its spectral norm is the largest
          magnitude of the kernel&apos;s DFT (computed on the input length): this gives exact Lipschitz constants for
          convolutional layers. With several channels, each Fourier frequency gets a small matrix instead of a scalar, and the
          layer&apos;s singular values are the singular values of those small matrices. Translation equivariance and weight
          sharing are the same statement as &ldquo;commutes with the shift&rdquo;.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dc",
      rung: "check",
      prompt: <p>What is the eigenvalue of circ(1, 2, 0, 3) for the constant eigenvector (1, 1, 1, 1)?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "norm",
      rung: "check",
      prompt: <p>What is the spectral norm of circ(1, −1, 0, 0)?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
    {
      key: "commute",
      rung: "apply",
      prompt: <p>Which n×n matrices commute with the cyclic shift S?</p>,
      answer: {
        kind: "choice",
        options: ["exactly the circulant matrices", "exactly the diagonal matrices", "exactly the symmetric matrices", "only multiples of the identity"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def circulant(c):
    c = np.asarray(c, dtype=float)
    n = len(c)
    return np.array([[c[(i - j) % n] for j in range(n)] for i in range(n)])

def circ_conv_fft(c, x):
    return np.real(np.fft.ifft(np.fft.fft(c) * np.fft.fft(x)))

c = np.array([1.0, 2.0, 0.0, 3.0])
C = circulant(c)
print(C)
print(np.round(np.abs(np.fft.fft(c)), 4))
x = np.array([1.0, -1.0, 2.0, 0.0])
print(np.round(circ_conv_fft(c, x), 4) + 0.0, C @ x)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1. 3. 0. 2.]\n [2. 1. 3. 0.]\n [0. 2. 1. 3.]\n [3. 0. 2. 1.]]\n[6.     1.4142 4.     1.4142]\n[-2.  7.  0.  7.] [-2.  7.  0.  7.]",
          "[[1. 2. 0. 3.]\n [3. 1. 2. 0.]\n [0. 3. 1. 2.]\n [2. 0. 3. 1.]]\n[6.     1.4142 4.     1.4142]\n[-2.  7.  0.  7.] [-2.  7.  0.  7.]",
          "[[1. 3. 0. 2.]\n [2. 1. 3. 0.]\n [0. 2. 1. 3.]\n [3. 0. 2. 1.]]\n[6. 1. 4. 1.]\n[-2.  7.  0.  7.] [-2.  7.  0.  7.]",
          "[[1. 3. 0. 2.]\n [2. 1. 3. 0.]\n [0. 2. 1. 3.]\n [3. 0. 2. 1.]]\n[6.     1.4142 4.     1.4142]\n[ 7.  0.  7. -2.] [-2.  7.  0.  7.]",
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

def toeplitz_matvec(col, row, x):
    n = len(x)
    c = np.concatenate([col, row[:0:-1]])
    xp = np.concatenate([x, np.zeros(n - 1)])
    return np.real(np.fft.ifft(np.fft.fft(c) * np.fft.fft(xp)))[:n]

def conv_spectral_norm(c):
    return float(np.abs(np.fft.fft(c)).max())

col, row = np.array([1.0, 2.0, 3.0]), np.array([1.0, -1.0, 4.0])
print(np.round(toeplitz_matvec(col, row, np.ones(3)), 4) + 0.0)
print(conv_spectral_norm(np.array([1.0, 2.0, 0.0, 3.0])), conv_spectral_norm(np.array([1.0, -1.0, 0.0, 0.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[4. 2. 6.]\n6.0 2.0", "[6. 2. 4.]\n6.0 2.0", "[4. 2. 6.]\n6.0 1.4142", "[7. 2. 6.]\n4.0 2.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>circulant(c)</C>, the matrix with entries c[(i − j) mod n], and <C>circ_conv_fft(c, x)</C>, the circular
          convolution of real vectors computed with <C>np.fft</C> (return the real part).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def circulant(c):
    return np.diag(c)

def circ_conv_fft(c, x):
    return np.convolve(c, x)[: len(x)]
`,
        solution: CIRC,
        tests: [
          { name: "matrix", code: `C = circulant([1.0, 2.0, 0.0, 3.0])
assert np.allclose(C, [[1, 3, 0, 2], [2, 1, 3, 0], [0, 2, 1, 3], [3, 0, 2, 1]])
S = circulant([0.0, 1.0, 0.0, 0.0])
assert np.allclose(C @ S, S @ C)
F = np.fft.fft(np.eye(4))
assert np.allclose(F @ C @ np.linalg.inv(F), np.diag(np.fft.fft([1.0, 2.0, 0.0, 3.0])))` },
          { name: "fft conv", code: `rng = np.random.default_rng(0)
c, x = rng.normal(size=7), rng.normal(size=7)
assert np.allclose(circ_conv_fft(c, x), circulant(c) @ x)
assert np.allclose(circ_conv_fft(c, x), circ_conv_fft(x, c))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>toeplitz_matvec(col, row, x)</C>: multiply the Toeplitz matrix with first column col and first row row
          (row[0] = col[0]) by x using a circulant embedding of size 2n − 1 and FFTs. Also write{" "}
          <C>conv_spectral_norm(c)</C>, the spectral norm of circ(c).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def toeplitz_matvec(col, row, x):
    return col * x

def conv_spectral_norm(c):
    return float(np.abs(c).sum())
`,
        solution: `import numpy as np

${TOEP}`,
        tests: [
          { name: "toeplitz", code: `rng = np.random.default_rng(1)
n = 6
col, row = rng.normal(size=n), rng.normal(size=n); row[0] = col[0]
T = np.array([[col[i - j] if i >= j else row[j - i] for j in range(n)] for i in range(n)])
x = rng.normal(size=n)
assert np.allclose(toeplitz_matvec(col, row, x), T @ x)
assert np.allclose(toeplitz_matvec(np.array([1.0, 2.0, 3.0]), np.array([1.0, -1.0, 4.0]), np.ones(3)), [4.0, 2.0, 6.0])` },
          { name: "norm", code: `c = np.random.default_rng(2).normal(size=8)
C = np.array([[c[(i - j) % 8] for j in range(8)] for i in range(8)])
assert np.isclose(conv_spectral_norm(c), np.linalg.norm(C, 2))
assert np.isclose(conv_spectral_norm(np.array([1.0, -1.0, 0.0, 0.0])), 2.0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if an n×n matrix A commutes with the cyclic shift S, then A is circulant.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes AS^k = S^kA for all k (by induction) and that eₖ = S^ke₀.",
          "Computes column k of A as Aeₖ = AS^ke₀ = S^k(Ae₀), the first column shifted cyclically k places.",
          "Concludes A = circ(first column of A).",
        ],
      },
    },
    {
      key: "det",
      rung: "stretch",
      prompt: <p>What is the determinant of the 3×3 circulant circ(1, 1, 0)?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend why circulant matrices are exactly the shift-commuting ones, why the Fourier basis diagonalises all of them, and how that gives fast convolution and exact spectral norms of convolutions.",

  glimpse: (
    <>
      <p>
        Circulants are cheap because they are diagonal in a known basis. Another cheap structure is &ldquo;diagonal plus
        low rank&rdquo;, which appears in Gaussian process approximations, factor analysis and quasi-Newton methods. The
        Woodbury identity inverts it at the cost of the rank, which is the next lesson.
      </p>
      <p>
        Two-dimensional convolutions are block circulant with circulant blocks, diagonalised by the 2-D DFT, a Kronecker
        product of two 1-D DFTs. Kronecker products are the last structured family in this chapter.
      </p>
    </>
  ),
};
