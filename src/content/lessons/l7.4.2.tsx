import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CouplingViz } from "@/components/viz/CouplingViz";
import type { LessonContent } from "@/lib/types";

const COUPLING = `import math

def coupling_forward(x, s, t, d):
    xa, xb = x[:d], x[d:]
    sa, ta = s(xa), t(xa)
    yb = [b * math.exp(si) + ti for b, si, ti in zip(xb, sa, ta)]
    return xa + yb, sum(sa)

def coupling_inverse(y, s, t, d):
    ya, yb = y[:d], y[d:]
    sa, ta = s(ya), t(ya)
    return ya + [(b - ti) * math.exp(-si) for b, si, ti in zip(yb, sa, ta)]

def permute(x, perm):
    return [x[p] for p in perm]`;

const AUTOREG = `import math

def maf_density_pass(x, mu, alpha):
    z = [(xi - mu(x[:i])) * math.exp(-alpha(x[:i])) for i, xi in enumerate(x)]
    return z, -sum(alpha(x[:i]) for i in range(len(x)))

def maf_sample(z, mu, alpha):
    x = []
    for zi in z:
        x.append(zi * math.exp(alpha(x)) + mu(x))
    return x

def conv1x1_logdet(W, h, w):
    return h * w * math.log(abs(W[0][0] * W[1][1] - W[0][1] * W[1][0]))`;

export const lesson: LessonContent = {
  id: "l7.4.2",
  minutes: 45,
  links: {
    requires: ["l7.4.1", "l7.2.1"],
    revisits: ["l7.2.2", "l4.1.1"],
    foreshadows: ["l7.4.3", "l12.2.1"],
  },

  puzzle: (
    <>
      <p>
        A flow layer must be invertible, have a cheap Jacobian determinant and still be expressive. A neural network fails the
        first two: it is not invertible in general, and its Jacobian determinant costs cubic time. An element-wise map passes
        the first two and fails the third, since it never mixes dimensions. Is there a layer that mixes dimensions through an
        arbitrary network while remaining trivially invertible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Split the input into two halves. Leave the first half alone and use it, through any network you like, to choose a
        shift and a scale for each coordinate of the second half. To invert, read the untouched first half, recompute the same
        shift and scale, and undo them. The network itself never needs inverting, and since each output of the second half
        depends on its own input only through a scale, the Jacobian is triangular with the scales on the diagonal.
      </p>
      <p>
        One such layer leaves half the coordinates unchanged, so layers alternate which half is transformed. A few layers can
        bend a Gaussian into curved shapes.
      </p>
      <CouplingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="affine coupling">
        <p>
          (Dinh, Sohl-Dickstein and Bengio, 2017.) Split <M>{"x = (x_a, x_b)"}</M> with <M>{"x_a"}</M> the first d coordinates. With
          arbitrary functions s and t from <M>{"\\mathbb{R}^d"}</M> to <M>{"\\mathbb{R}^{D-d}"}</M>, an <em>affine coupling layer</em> is
        </p>
        <MD>{"y_a = x_a, \\qquad y_b = x_b \\odot \\exp(s(x_a)) + t(x_a)"}</MD>
        <p>
          (<C>coupling_forward</C>). Its inverse is <M>{"x_a = y_a"}</M>,{" "}
          <M>{"x_b = (y_b - t(y_a)) \\odot \\exp(-s(y_a))"}</M> (<C>coupling_inverse</C>).
        </p>
      </Definition>

      <Theorem title="the coupling Jacobian">
        <p>The log-determinant of an affine coupling layer is <M>{"\\sum_j s_j(x_a)"}</M>, computed in one pass.</p>
      </Theorem>
      <Proof>
        <p>The Jacobian has block form</p>
        <MD>{"\\frac{\\partial y}{\\partial x} = \\begin{pmatrix} I & 0 \\\\ \\partial y_b / \\partial x_a & \\operatorname{diag}(\\exp s(x_a)) \\end{pmatrix},"}</MD>
        <p>
          since <M>{"y_a"}</M> does not depend on <M>{"x_b"}</M> and each <M>{"y_{b,j}"}</M> depends on <M>{"x_{b,j}"}</M> only through
          the factor <M>{"\\exp s_j(x_a)"}</M>. It is block lower triangular, so its determinant is the product of the diagonal
          blocks&apos; determinants, <M>{"\\prod_j \\exp s_j(x_a)"}</M>. The lower-left block, which holds all the complexity of s and t,
          never enters.
        </p>
      </Proof>

      <Remark title="building a flow">
        <p>
          Coupling layers are interleaved with permutations of the coordinates, which have determinant ±1 and log-determinant 0
          (<C>permute</C>), so every coordinate is transformed in turn. Glow (Kingma and Dhariwal, 2018) replaced fixed
          permutations by a learned invertible 1 by 1 convolution: a C by C matrix W applied at each of the h·w positions,
          contributing <M>{"h w \\log |\\det W|"}</M> to the log-determinant (<C>conv1x1_logdet</C>, for C = 2). For images, the split
          is by checkerboard or by channel, s and t are convolutional networks, and multi-scale architectures factor out half
          the dimensions every few layers. RealNVP reached 3.49 and Glow 3.35 bits per dimension on CIFAR-10, behind
          autoregressive models but with one-pass sampling.
        </p>
        <Code>{COUPLING}</Code>
      </Remark>

      <Definition title="autoregressive flows">
        <p>
          An <em>affine autoregressive flow</em> makes every coordinate a coupling on all earlier ones:{" "}
          <M>{"x_i = z_i \\exp(\\alpha_i(x_{<i})) + \\mu_i(x_{<i})"}</M>. The Jacobian is triangular with log-determinant{" "}
          <M>{"\\sum_i \\alpha_i"}</M>. Computing z from x needs all <M>{"\\mu_i, \\alpha_i"}</M>, which a MADE network (l7.2.1)
          produces in one pass from x (<C>maf_density_pass</C>); computing x from z must go one coordinate at a time
          (<C>maf_sample</C>).
        </p>
        <Code>{AUTOREG}</Code>
      </Definition>

      <Theorem title="MAF and IAF are inverses">
        <p>
          A masked autoregressive flow (MAF, conditioners read x) evaluates densities in one pass and samples in D passes. An
          inverse autoregressive flow (IAF, conditioners read z) samples in one pass and evaluates the density of arbitrary data
          in D passes.
        </p>
      </Theorem>
      <Proof>
        <p>
          In MAF, <M>{"z_i = (x_i - \\mu_i(x_{<i})) \\exp(-\\alpha_i(x_{<i}))"}</M>: given x, every term is known at once. Sampling must
          produce <M>{"x_{<i}"}</M> before <M>{"x_i"}</M>. IAF defines{" "}
          <M>{"x_i = z_i \\exp(\\alpha_i(z_{<i})) + \\mu_i(z_{<i})"}</M>, so sampling from z is one pass, but recovering z from given
          data needs <M>{"z_{<i}"}</M> first. So MAF suits density estimation and IAF suits sampling; Parallel WaveNet trained an IAF
          student to match a WaveNet teacher, making audio synthesis real-time.
        </p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "logdet",
      rung: "check",
      prompt: <p>A coupling layer on six dimensions conditions on the first three; for some input, s returns 0.1, −0.3 and 0.5. What is the layer&apos;s log-determinant?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "glow",
      rung: "check",
      prompt: <p>A 1 by 1 invertible convolution acts on a 32 by 32 feature map, and its matrix has determinant 2. What does it add to the log-determinant? Give two decimals.</p>,
      answer: { kind: "numeric", value: 709.78, tolerance: 0.01 },
    },
    {
      key: "maf",
      rung: "apply",
      prompt: <p>You need fast sampling and only need densities of your own samples. Which autoregressive flow fits, and why?</p>,
      answer: {
        kind: "choice",
        options: [
          "IAF: its conditioners read z, so sampling is one pass, and the density of its own samples is available because z is known",
          "MAF: it samples in one pass",
          "Either: both sample and evaluate densities in one pass",
          "Neither: autoregressive flows cannot sample",
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

def coupling_forward(x, s, t, d):
    xa, xb = x[:d], x[d:]
    sa, ta = s(xa), t(xa)
    yb = [b * math.exp(si) + ti for b, si, ti in zip(xb, sa, ta)]
    return xa + yb, sum(sa)

def coupling_inverse(y, s, t, d):
    ya, yb = y[:d], y[d:]
    sa, ta = s(ya), t(ya)
    return ya + [(b - ti) * math.exp(-si) for b, si, ti in zip(yb, sa, ta)]

def permute(x, perm):
    return [x[p] for p in perm]

s = lambda a: [0.5 * a[0]]; t = lambda a: [a[0]]; y, ld = coupling_forward([1.0, 2.0], s, t, 1); print([round(v, 4) for v in y], ld)
print([round(v, 4) for v in coupling_inverse(y, s, t, 1)], permute([1, 2, 3], [2, 0, 1]), coupling_forward([0.0, 5.0], s, t, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 4.2974] 0.5\n[1.0, 2.0] [3, 1, 2] ([0.0, 5.0], 0.0)",
          "[1.0, 3.2974] 0.5\n[1.0, 2.0] [3, 1, 2] ([0.0, 5.0], 0.0)",
          "[1.0, 4.2974] 1.6487\n[1.0, 2.0] [3, 1, 2] ([0.0, 5.0], 0.0)",
          "[1.0, 4.2974] 0.5\n[1.0, 2.0] [2, 3, 1] ([0.0, 5.0], 0.0)",
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

def maf_density_pass(x, mu, alpha):
    z = [(xi - mu(x[:i])) * math.exp(-alpha(x[:i])) for i, xi in enumerate(x)]
    return z, -sum(alpha(x[:i]) for i in range(len(x)))

def maf_sample(z, mu, alpha):
    x = []
    for zi in z:
        x.append(zi * math.exp(alpha(x)) + mu(x))
    return x

def conv1x1_logdet(W, h, w):
    return h * w * math.log(abs(W[0][0] * W[1][1] - W[0][1] * W[1][0]))

mu = lambda prev: sum(prev); alpha = lambda prev: 0.5 * len(prev); z, ld = maf_density_pass([1.0, 2.0, 4.0], mu, alpha); print([round(v, 4) for v in z], ld)
print([round(v, 4) for v in maf_sample(z, mu, alpha)], round(conv1x1_logdet([[2, 0], [0, 3]], 4, 4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.6065, 0.3679] -1.5\n[1.0, 2.0, 4.0] 28.6682",
          "[1.0, 1.0, 1.0] -1.5\n[1.0, 2.0, 4.0] 28.6682",
          "[1.0, 0.6065, 0.3679] 1.5\n[1.0, 2.0, 4.0] 28.6682",
          "[1.0, 0.6065, 0.3679] -1.5\n[1.0, 2.0, 4.0] 1.7918",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>coupling_forward(x, s, t, d)</C>, returning the output list and the log-determinant, where s and t map the
          first d coordinates to lists for the rest; <C>coupling_inverse(y, s, t, d)</C>; and <C>permute(x, perm)</C>, whose
          output i is <C>x[perm[i]]</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def coupling_forward(x, s, t, d):
    return x, 0.0

def coupling_inverse(y, s, t, d):
    return y

def permute(x, perm):
    return x
`,
        solution: COUPLING,
        tests: [
          { name: "forward", code: `s = lambda a: [a[0], -a[1]]; t = lambda a: [a[1], 1.0]
y, ld = coupling_forward([0.0, 2.0, 3.0, 4.0], s, t, 2); assert abs(y[2] - 5.0) < 1e-12 and abs(y[3] - (4 * math.exp(-2) + 1)) < 1e-12 and y[:2] == [0.0, 2.0] and abs(ld + 2) < 1e-12
assert permute([5, 6, 7], [1, 2, 0]) == [6, 7, 5] and permute([], []) == []` },
          { name: "inverse", code: `s = lambda a: [0.3 * a[0] + a[1]]; t = lambda a: [a[0] * a[1]]
x = [0.5, -1.0, 2.0]; y, _ = coupling_forward(x, s, t, 2); back = coupling_inverse(y, s, t, 2)
assert all(abs(u - v) < 1e-12 for u, v in zip(back, x)) and coupling_inverse([1.0, 3.0], lambda a: [0.0], lambda a: [1.0], 1) == [1.0, 2.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With conditioners <C>mu(prefix)</C> and <C>alpha(prefix)</C>, write <C>maf_density_pass(x, mu, alpha)</C>, returning z and
          the log-determinant of the map from x to z; <C>maf_sample(z, mu, alpha)</C>; and <C>conv1x1_logdet(W, h, w)</C> for a 2 by
          2 matrix W.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def maf_density_pass(x, mu, alpha):
    return list(x), 0.0

def maf_sample(z, mu, alpha):
    return list(z)

def conv1x1_logdet(W, h, w):
    return 0.0
`,
        solution: AUTOREG,
        tests: [
          { name: "density pass", code: `mu = lambda p: 2 * p[-1] if p else 1.0; al = lambda p: math.log(2) if p else 0.0
z, ld = maf_density_pass([3.0, 8.0], mu, al); assert abs(z[0] - 2) < 1e-12 and abs(z[1] - 1) < 1e-12 and abs(ld + math.log(2)) < 1e-12` },
          { name: "sample and 1x1", code: `mu = lambda p: 2 * p[-1] if p else 1.0; al = lambda p: math.log(2) if p else 0.0
x = maf_sample([2.0, 1.0], mu, al); assert abs(x[0] - 3) < 1e-12 and abs(x[1] - 8) < 1e-12
assert abs(conv1x1_logdet([[0, 1], [1, 0]], 5, 5)) < 1e-12 and abs(conv1x1_logdet([[1, 2], [3, 4]], 1, 2) - 2 * math.log(2)) < 1e-12` },
        ],
      },
    },
    {
      key: "conv",
      rung: "stretch",
      prompt: <p>A 1 by 1 convolution with matrix [[1, 2], [3, 4]] acts on a 16 by 16 map with two channels. What does it add to the log-determinant? Give three decimals.</p>,
      answer: { kind: "numeric", value: 177.446, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Stacking discrete layers is one way to build a bijection. Another is to let a point flow continuously along a learned
        velocity field. The next lesson shows that the log-determinant then becomes an integral of a trace, which is far cheaper
        to estimate.
      </p>
    </>
  ),
};
