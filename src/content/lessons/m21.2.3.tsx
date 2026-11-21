import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ConvTheoremViz } from "@/components/viz/ConvTheoremViz";
import type { LessonContent } from "@/lib/types";

const CYC = `import numpy as np

def cyclic_conv(f, h):
    n = len(f)
    return np.array([sum(f[u] * h[(g - u) % n] for u in range(n)) for g in range(n)])

def cyclic_fourier(f):
    k = np.arange(len(f))
    return np.exp(2j * np.pi * np.outer(k, k) / len(f)) @ f     # f_hat(m) = sum_k f(k) rho_m(k)

def cyclic_inverse(F):
    n = len(F)
    k = np.arange(n)
    return (np.exp(-2j * np.pi * np.outer(k, k) / n) @ F / n).real   # rho_m(g^{-1}) is the conjugate; d = 1`;

const GEN = `import numpy as np

def group_conv(f, h, G, mul, inv):
    return {g: sum(f[u] * h[mul(inv(u), g)] for u in G) for g in G}   # (f * h)(g) = sum_u f(u) h(u^{-1} g)

def fourier(f, rho):
    return sum(f[g] * rho(g) for g in f)                               # one matrix per representation

def plancherel_rhs(f, irreps, n):
    g0 = next(iter(f))
    return sum(rho(g0).shape[0] * np.sum(np.abs(fourier(f, rho)) ** 2) for rho in irreps) / n`;

export const lesson: LessonContent = {
  id: "m21.2.3",
  minutes: 55,
  links: {
    requires: ["m21.2.2", "m6.6.3"],
    revisits: ["l4.1.1", "m21.1.3"],
    foreshadows: ["m21.3.1"],
  },

  puzzle: (
    <>
      <p>
        The discrete Fourier transform turns circular convolution into pointwise multiplication, which is why convolutions are
        diagonalised by Fourier modes and why fast convolutions go through the FFT. Spherical CNNs and networks equivariant to 3D
        rotations rely on the same trick for groups that are not cyclic and not even commutative. What plays the role of the
        Fourier modes there, and why does multiplication of numbers become multiplication of matrices?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Fourier transform of a function on a group records, for each irreducible representation ρ, the sum of the function&apos;s
        values weighted by the matrices ρ(g). For a cyclic group the irreducibles are one-dimensional and these sums are the usual
        Fourier coefficients. Because ρ is a homomorphism, convolving two functions multiplies their transforms, one irreducible
        at a time; for non-commutative groups the transforms are matrices, and they multiply as matrices.
      </p>
      <ConvTheoremViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convolution and Fourier transform on a group">
        <p>
          For functions f and h on a finite group G, the convolution is{" "}
          <M>{"(f * h)(g) = \\sum_{u \\in G} f(u)\\, h(u^{-1}g)"}</M> (<C>group_conv</C>); on <M>{"\\mathbb{Z}_n"}</M> it is the
          circular convolution <M>{"\\sum_u f(u)h(g - u)"}</M> (<C>cyclic_conv</C>). The Fourier transform of f at a representation
          ρ is the matrix <M>{"\\hat f(\\rho) = \\sum_g f(g)\\rho(g)"}</M> (<C>fourier</C>). For <M>{"\\mathbb{Z}_n"}</M> with{" "}
          <M>{"\\rho_m(k) = e^{2\\pi i mk/n}"}</M> this is <M>{"\\hat f(m) = \\sum_k f(k) e^{2\\pi i mk/n}"}</M>
          (<C>cyclic_fourier</C>), the DFT up to the sign convention of the exponent.
        </p>
      </Definition>

      <Theorem title="the convolution theorem">
        <p>For every representation ρ, <M>{"\\widehat{f * h}(\\rho) = \\hat f(\\rho)\\, \\hat h(\\rho)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\widehat{f*h}(\\rho) = \\sum_g \\sum_u f(u)h(u^{-1}g)\\rho(g)"}</M>. Substitute <M>{"v = u^{-1}g"}</M>, so g = uv and{" "}
          <M>{"\\rho(g) = \\rho(u)\\rho(v)"}</M>; as g runs over G so does v. The sum becomes{" "}
          <M>{"\\sum_u f(u)\\rho(u) \\sum_v h(v)\\rho(v) = \\hat f(\\rho)\\hat h(\\rho)"}</M>. The order of the factors matters when
          the group is not commutative.
        </p>
        <Code>{CYC}</Code>
      </Proof>

      <Theorem title="inversion">
        <p>
          Let <M>{"\\rho_1, \\dots, \\rho_r"}</M> be the irreducible representations, chosen unitary, with dimensions{" "}
          <M>{"d_i"}</M>. Then <M>{"f(g) = \\frac{1}{|G|}\\sum_i d_i \\operatorname{tr}\\big(\\rho_i(g^{-1}) \\hat f(\\rho_i)\\big)"}</M>
          (<C>cyclic_inverse</C> for the cyclic case).
        </p>
      </Theorem>
      <Proof>
        <p>
          The right side is <M>{"\\frac{1}{|G|}\\sum_u f(u) \\sum_i d_i \\chi_i(g^{-1}u)"}</M>. The regular representation contains{" "}
          <M>{"\\rho_i"}</M> exactly <M>{"d_i"}</M> times (m21.2.2), so <M>{"\\sum_i d_i \\chi_i = \\chi_{\\mathrm{reg}}"}</M>, which
          is |G| at the identity and 0 elsewhere. Only u = g survives, leaving f(g).
        </p>
      </Proof>

      <Theorem title="Plancherel">
        <p>
          <M>{"\\sum_g |f(g)|^2 = \\frac{1}{|G|}\\sum_i d_i \\|\\hat f(\\rho_i)\\|_F^2"}</M> (<C>plancherel_rhs</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"f^*(g) = \\overline{f(g^{-1})}"}</M>. Then <M>{"(f * f^*)(e) = \\sum_u f(u)\\overline{f(u)} = \\sum |f|^2"}</M>, and
          for unitary ρ, <M>{"\\widehat{f^*}(\\rho) = \\sum_g \\overline{f(g^{-1})}\\rho(g) = \\big(\\sum_v f(v)\\rho(v)\\big)^* = \\hat f(\\rho)^*"}</M>
          , using <M>{"\\rho(v^{-1}) = \\rho(v)^*"}</M>. Apply inversion at g = e to <M>{"f * f^*"}</M>, whose transform is{" "}
          <M>{"\\hat f\\hat f^*"}</M> by the convolution theorem, and use{" "}
          <M>{"\\operatorname{tr}(AA^*) = \\|A\\|_F^2"}</M>.
        </p>
        <Code>{GEN}</Code>
      </Proof>

      <Example title="the symmetric group on three letters">
        <p>
          For <M>{"S_3"}</M> the transform of f consists of two numbers, at the trivial and sign representations, and a 2 × 2
          matrix at the standard one: <M>{"1 + 1 + 4 = 6"}</M> numbers, as many as f has values. If f is constant on conjugacy
          classes, <M>{"\\hat f(\\rho)"}</M> commutes with every <M>{"\\rho(h)"}</M>, so by Schur&apos;s lemma it is a scalar,{" "}
          <M>{"\\frac{1}{d}\\sum_g f(g)\\chi(g)"}</M> times the identity. For the indicator of the three transpositions this gives
          3, −3 and the zero matrix.
        </p>
      </Example>

      <Remark title="why equivariant networks care">
        <p>
          A linear map on functions on G that commutes with translations <M>{"(L_u f)(g) = f(u^{-1}g)"}</M> is a convolution with
          some kernel acting on the right, as the next chapter shows, so in the Fourier domain it acts on each irreducible block
          by matrix multiplication. Group convolutions can therefore be computed blockwise, and the irreducible blocks are the
          natural feature types of equivariant networks: spherical CNNs and SO(3)-equivariant networks store features as
          coefficients on irreducibles, the spherical harmonics, and mix them only through intertwiners.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "coef",
      rung: "check",
      prompt: (
        <p>
          On <M>{"\\mathbb{Z}_6"}</M> let f = (1, 1, 1, 0, 0, 0). What is <M>{"|\\hat f(1)|"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.0005 },
    },
    {
      key: "plan",
      rung: "check",
      prompt: (
        <p>
          On <M>{"\\mathbb{Z}_4"}</M> let f = (1, 2, 0, 0). What is <M>{"\\sum_m |\\hat f(m)|^2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 20, tolerance: 0.0005 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>Why does the convolution theorem on a non-commutative group need the factors in the order <M>{"\\hat f(\\rho)\\hat h(\\rho)"}</M>?</p>,
      answer: {
        kind: "choice",
        options: [
          "The proof writes ρ(uv) = ρ(u)ρ(v) with u from f and v from h, and matrices of a non-commutative group need not commute",
          "Because convolution is not associative on non-commutative groups",
          "Because the transforms are always symmetric matrices",
          "Because only one-dimensional representations appear",
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

def cyclic_conv(f, h):
    n = len(f)
    return np.array([sum(f[u] * h[(g - u) % n] for u in range(n)) for g in range(n)])

def cyclic_fourier(f):
    k = np.arange(len(f))
    return np.exp(2j * np.pi * np.outer(k, k) / len(f)) @ f     # f_hat(m) = sum_k f(k) rho_m(k)

def cyclic_inverse(F):
    n = len(F)
    k = np.arange(n)
    return (np.exp(-2j * np.pi * np.outer(k, k) / n) @ F / n).real   # rho_m(g^{-1}) is the conjugate; d = 1

f = np.array([1.0, 2.0, 0.0, 0.0]); h = np.array([0.0, 1.0, 0.0, 1.0])
print(cyclic_conv(f, h).tolist(), np.round(np.abs(cyclic_fourier(f)), 3).tolist(), np.allclose(cyclic_inverse(cyclic_fourier(f)), f))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 1.0, 2.0, 1.0] [3.0, 2.236, 1.0, 2.236] True",
          "[1.0, 2.0, 1.0, 2.0] [3.0, 2.236, 1.0, 2.236] True",
          "[2.0, 1.0, 2.0, 1.0] [3.0, 2.236, 3.0, 2.236] True",
          "[2.0, 1.0, 2.0, 1.0] [3.0, 2.236, 1.0, 2.236] False",
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

def group_conv(f, h, G, mul, inv):
    return {g: sum(f[u] * h[mul(inv(u), g)] for u in G) for g in G}   # (f * h)(g) = sum_u f(u) h(u^{-1} g)

def fourier(f, rho):
    return sum(f[g] * rho(g) for g in f)                               # one matrix per representation

def plancherel_rhs(f, irreps, n):
    g0 = next(iter(f))
    return sum(rho(g0).shape[0] * np.sum(np.abs(fourier(f, rho)) ** 2) for rho in irreps) / n

f = {0: 1.0, 1: 2.0}; h = {0: 0.0, 1: 3.0}; triv = lambda g: np.eye(1); sgn = lambda g: np.array([[(-1.0) ** g]])
print(group_conv(f, h, [0, 1], lambda a, b: (a + b) % 2, lambda a: a), fourier(f, sgn).item(), plancherel_rhs(f, [triv, sgn], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: 6.0, 1: 3.0} -1.0 5.0",
          "{0: 3.0, 1: 6.0} -1.0 5.0",
          "{0: 6.0, 1: 3.0} 3.0 5.0",
          "{0: 6.0, 1: 3.0} -1.0 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cyclic_conv(f, h)</C>, <C>cyclic_fourier(f)</C> with the convention <M>{"\\hat f(m) = \\sum_k f(k)e^{2\\pi i mk/n}"}</M>,
          and <C>cyclic_inverse(F)</C> returning the real signal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cyclic_conv(f, h):
    return f * h

def cyclic_fourier(f):
    return np.fft.fft(f)

def cyclic_inverse(F):
    return F.real
`,
        solution: CYC,
        tests: [
          { name: "conv", code: `assert np.allclose(cyclic_conv(np.array([1.0, 2.0, 3.0]), np.array([0.0, 1.0, 0.0])), [3.0, 1.0, 2.0])` },
          { name: "fourier", code: `assert np.allclose(cyclic_fourier(np.array([0.0, 1.0, 0.0, 0.0])), [1, 1j, -1, -1j])\nassert np.allclose(cyclic_inverse(cyclic_fourier(np.array([3.0, 1.0, 4.0]))), [3.0, 1.0, 4.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Functions on a finite group are dictionaries from elements to values. Write <C>group_conv(f, h, G, mul, inv)</C>,{" "}
          <C>fourier(f, rho)</C> and <C>plancherel_rhs(f, irreps, n)</C>, the right side of Plancherel&apos;s formula for a group of
          order n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def group_conv(f, h, G, mul, inv):
    return {g: f[g] * h[g] for g in G}

def fourier(f, rho):
    return sum(rho(g) for g in f)

def plancherel_rhs(f, irreps, n):
    return sum(np.sum(np.abs(fourier(f, rho)) ** 2) for rho in irreps)
`,
        solution: GEN,
        tests: [
          { name: "conv", code: `c = group_conv({0: 1.0, 1: 0.0, 2: 2.0}, {0: 0.0, 1: 1.0, 2: 0.0}, range(3), lambda a, b: (a + b) % 3, lambda a: (-a) % 3)\nassert c == {0: 2.0, 1: 1.0, 2: 0.0}` },
          { name: "planch", code: `f = {0: 1.0, 1: 2.0, 2: 2.0}\nirreps = [lambda g, m=m: np.array([[np.exp(2j * np.pi * m * g / 3)]]) for m in range(3)]\nassert np.allclose(fourier(f, irreps[0]), [[5.0]]) and abs(plancherel_rhs(f, irreps, 3) - 9.0) < 1e-9` },
        ],
      },
    },
    {
      key: "s3conv",
      rung: "stretch",
      prompt: (
        <p>
          On <M>{"S_3"}</M> let f be the indicator of the three transpositions. Using the example&apos;s transform and the inversion
          formula (or directly), find <M>{"(f * f)(g)"}</M> when g is a 3-cycle.
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        With groups, representations and Fourier analysis in hand, the next chapter builds equivariant architectures. It starts
        by proving that the convolutional layer is not just one translation-equivariant layer but the only linear one.
      </p>
    </>
  ),
};
