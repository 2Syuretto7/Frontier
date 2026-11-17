import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RoundErrSawViz } from "@/components/viz/RoundErrSawViz";
import type { LessonContent } from "@/lib/types";

const EP = `import numpy as np

def eps_of(dtype):
    one, e = dtype(1), dtype(1)
    while one + e / dtype(2) != one:
        e = e / dtype(2)
    return float(e)

def rel_err(x, dtype):
    return abs(float(dtype(x)) - x) / abs(x)`;

const SUMS = `import math
import numpy as np

def recursive_sum(xs):
    s = np.float32(0)
    for x in xs:
        s = np.float32(s + x)
    return s

def pairwise_sum(xs):
    if len(xs) <= 2:
        return np.float32(sum(xs, np.float32(0)))
    m = len(xs) // 2
    return np.float32(pairwise_sum(xs[:m]) + pairwise_sum(xs[m:]))

def gamma(n, u):
    return n * u / (1 - n * u)`;

export const lesson: LessonContent = {
  id: "m11.1.2",
  minutes: 45,
  links: {
    requires: ["m11.1.1"],
    revisits: ["e3.1.2"],
    foreshadows: ["m11.1.3", "m11.2.2"],
  },

  puzzle: (
    <>
      <p>
        Add a hundred thousand numbers between 0 and 1 in single precision, one after another, and the answer is wrong in
        the sixth significant digit. Add the same numbers in a balanced tree of pairs, and it is right to within one rounding.
        Every individual addition is correctly rounded in both cases. Where does the difference come from, and can you
        predict how large the error can be before running anything?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Correct rounding means every operation is exact up to a relative error of at most u, the unit roundoff. That single
        number turns floating point into algebra: replace each operation by the exact one times a factor 1 + δ with |δ| ≤ u,
        and track how the factors pile up. In a running sum, the first terms pass through every later addition and collect
        n − 1 factors; in a tree they pass through only log₂ n. The viz shows where the single bound u comes from: the
        relative error of rounding one number.
      </p>
      <RoundErrSawViz />
    </>
  ),

  theory: (
    <>
      <Definition title="machine epsilon and unit roundoff">
        <p>
          For a binary format with p fraction bits, machine epsilon <M>{"\\varepsilon = 2^{-p}"}</M> is the gap between 1 and
          the next float, and the unit roundoff for round-to-nearest is <M>{"u = \\varepsilon/2 = 2^{-(p+1)}"}</M>. For double
          precision <M>{"u = 2^{-53} \\approx 1.1 \\times 10^{-16}"}</M>; for single precision{" "}
          <M>{"u = 2^{-24} \\approx 6.0 \\times 10^{-8}"}</M>; for half precision <M>{"u = 2^{-11} \\approx 4.9 \\times 10^{-4}"}</M>.
          (NumPy&apos;s <C>finfo(...).eps</C> reports ε.)
        </p>
      </Definition>

      <Theorem title="the standard model">
        <p>
          If x lies in the normal range, then <M>{"\\mathrm{fl}(x) = x(1 + \\delta)"}</M> with <M>{"|\\delta| \\leq u"}</M>.
          Consequently, for each basic operation on floats with a result in the normal range,
        </p>
        <MD>{"\\mathrm{fl}(x \\mathbin{\\mathrm{op}} y) = (x \\mathbin{\\mathrm{op}} y)(1 + \\delta), \\qquad |\\delta| \\leq u."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"2^e \\leq |x| < 2^{e+1}"}</M>. The floats in this binade are spaced <M>{"2^{e-p}"}</M> apart, and so are
          the endpoints, so rounding to nearest moves x by at most half a spacing:{" "}
          <M>{"|\\mathrm{fl}(x) - x| \\leq 2^{e-p-1}"}</M>. Dividing by <M>{"|x| \\geq 2^e"}</M> gives{" "}
          <M>{"|\\delta| \\leq 2^{-p-1} = u"}</M>. The second statement is the first applied to the exact result, which is what
          correct rounding rounds.
        </p>
        <Code>{EP}</Code>
      </Proof>

      <Theorem title="accumulated rounding">
        <p>
          If <M>{"|\\delta_i| \\leq u"}</M> for i = 1, …, n and nu &lt; 1, then{" "}
          <M>{"\\prod_{i=1}^n(1 + \\delta_i) = 1 + \\theta_n"}</M> with{" "}
          <M>{"|\\theta_n| \\leq \\gamma_n = \\frac{nu}{1 - nu}"}</M>. Hence recursive summation of <M>{"x_1, \\dots, x_n"}</M>{" "}
          satisfies <M>{"|\\hat s - s| \\leq \\gamma_{n-1}\\sum_i|x_i|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction, <M>{"\\prod(1 + \\delta_i) \\leq (1 + u)^n \\leq 1/(1 - nu)"}</M>, using{" "}
          <M>{"(1 + u)^n \\leq e^{nu}"}</M> and <M>{"e^{nu} \\leq 1/(1 - nu)"}</M>, so <M>{"\\theta_n \\leq nu/(1 - nu)"}</M>. On
          the other side <M>{"\\prod(1 + \\delta_i) \\geq (1 - u)^n \\geq 1 - nu \\geq 1 - \\gamma_n"}</M>. In recursive
          summation, <M>{"x_1"}</M> and <M>{"x_2"}</M> pass through n − 1 additions, <M>{"x_k"}</M> through n − k + 1 for k ≥ 2,
          so <M>{"\\hat s = \\sum x_i(1 + \\theta^{(i)})"}</M> with every <M>{"|\\theta^{(i)}| \\leq \\gamma_{n-1}"}</M>.
        </p>
      </Proof>

      <Remark title="what the bounds mean in practice">
        <p>
          The bound <M>{"\\gamma_{n-1}"}</M> is a worst case; rounding errors usually behave more like random signs and grow
          like <M>{"\\sqrt n\\,u"}</M>. Pairwise summation passes each term through only <M>{"\\lceil\\log_2 n\\rceil"}</M>{" "}
          additions, so its bound is <M>{"\\gamma_{\\lceil\\log_2 n\\rceil}"}</M>; NumPy&apos;s <C>sum</C> uses a blocked
          pairwise scheme for this reason. In the code, ε for float32 and float16 is found by halving until 1 + ε/2 rounds
          back to 1; 0.1 and 1/3 round within u; and 10⁵ uniform numbers summed in float32 have relative error 4.1 × 10⁻⁶
          recursively and 7.8 × 10⁻⁸ pairwise, both far below the worst-case bound 6.0 × 10⁻³.
        </p>
        <Code>{SUMS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bf16",
      rung: "check",
      prompt: <p>bfloat16 has 7 fraction bits. What is its machine epsilon ε = 2⁻ᵖ?</p>,
      answer: { kind: "numeric", value: 0.0078125, tolerance: 0.000001 },
    },
    {
      key: "gap",
      rung: "check",
      prompt: <p>Doubles in [1024, 2048) are spaced 2ᵏ apart. What is k?</p>,
      answer: { kind: "numeric", value: -42, tolerance: 0.5 },
    },
    {
      key: "pair",
      rung: "apply",
      prompt: <p>Why does pairwise summation have a much smaller worst-case error bound than recursive summation?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each term passes through about log₂ n additions instead of up to n − 1, so it collects fewer factors 1 + δ",
          "Each addition in pairwise summation is computed in higher precision",
          "Pairwise summation sorts the terms before adding them",
          "Pairwise summation avoids rounding entirely when n is a power of two",
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

def eps_of(dtype):
    one, e = dtype(1), dtype(1)
    while one + e / dtype(2) != one:
        e = e / dtype(2)
    return float(e)

def rel_err(x, dtype):
    return abs(float(dtype(x)) - x) / abs(x)

print(eps_of(np.float64) == 2.0 ** -52, eps_of(np.float32), eps_of(np.float16))
print(rel_err(0.1, np.float32) <= 2.0 ** -24, round(rel_err(1 / 3, np.float16) / 2.0 ** -11, 4), 1.0 + 2.0 ** -53 == 1.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True 1.1920928955078125e-07 0.0009765625\nTrue 0.5 True", "True 5.960464477539063e-08 0.00048828125\nTrue 0.5 True", "True 1.1920928955078125e-07 0.0009765625\nTrue 0.5 False", "False 1.1920928955078125e-07 0.0009765625\nTrue 1.0 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
import numpy as np

def recursive_sum(xs):
    s = np.float32(0)
    for x in xs:
        s = np.float32(s + x)
    return s

def pairwise_sum(xs):
    if len(xs) <= 2:
        return np.float32(sum(xs, np.float32(0)))
    m = len(xs) // 2
    return np.float32(pairwise_sum(xs[:m]) + pairwise_sum(xs[m:]))

def gamma(n, u):
    return n * u / (1 - n * u)

xs = list(np.random.default_rng(0).uniform(0, 1, 100000).astype(np.float32))
exact = math.fsum(float(x) for x in xs)
r, p = recursive_sum(xs), pairwise_sum(xs)
print(f"{abs(r - exact) / exact:.1e} {abs(p - exact) / exact:.1e} {gamma(99999, 2.0 ** -24):.1e}")`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.1e-06 7.8e-08 6.0e-03", "7.8e-08 4.1e-06 6.0e-03", "4.1e-06 7.8e-08 6.0e-08", "0.0e+00 0.0e+00 6.0e-03"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eps_of(dtype)</C>, machine epsilon found by halving e from 1 while 1 + e/2 ≠ 1 in that dtype, and{" "}
          <C>rel_err(x, dtype)</C>, the relative error of converting the Python float x to dtype.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def eps_of(dtype):
    return 0.0

def rel_err(x, dtype):
    return 0.0
`,
        solution: EP,
        tests: [
          { name: "eps", code: `assert eps_of(np.float64) == np.finfo(np.float64).eps and eps_of(np.float32) == np.finfo(np.float32).eps and eps_of(np.float16) == 2.0 ** -10` },
          { name: "rel", code: `rng = np.random.default_rng(0)
for x in rng.uniform(-1e4, 1e4, 300):
    assert rel_err(float(x), np.float32) <= 2.0 ** -24 and rel_err(float(x), np.float16) <= 2.0 ** -11
assert rel_err(0.5, np.float16) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>recursive_sum(xs)</C> and <C>pairwise_sum(xs)</C>, both accumulating in float32 (pairwise splits the list
          in half and adds directly when at most two items remain), and <C>gamma(n, u)</C> = nu/(1 − nu).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import numpy as np

def recursive_sum(xs):
    return np.float32(0)

def pairwise_sum(xs):
    return np.float32(0)

def gamma(n, u):
    return 0.0
`,
        solution: SUMS,
        tests: [
          { name: "small", code: `xs = [np.float32(v) for v in [1.0, 2.0 ** -24, 2.0 ** -24]]
assert recursive_sum(xs) == np.float32(1.0) and isinstance(pairwise_sum(xs), np.float32) and abs(gamma(10, 0.01) - 0.1 / 0.9) < 1e-15` },
          { name: "bound", code: `rng = np.random.default_rng(3); xs = list(rng.normal(size=4096).astype(np.float32))
exact = math.fsum(float(x) for x in xs); scale = math.fsum(abs(float(x)) for x in xs); u = 2.0 ** -24
assert abs(float(recursive_sum(xs)) - exact) <= gamma(4095, u) * scale
assert abs(float(pairwise_sum(xs)) - exact) <= gamma(12, u) * scale` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          With p fraction bits and round-to-nearest, prove that every x in the normal range satisfies fl(x) = x(1 + δ) with
          |δ| ≤ 2^−(p+1).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Places x in a binade 2ᵉ ≤ |x| < 2ᵉ⁺¹ and notes the floats there (including the endpoints) are spaced 2^(e−p) apart.",
          "Concludes that rounding to nearest changes x by at most half a spacing, 2^(e−p−1).",
          "Divides by |x| ≥ 2ᵉ to get |δ| ≤ 2^−(p+1).",
        ],
      },
    },
    {
      key: "g1000",
      rung: "stretch",
      prompt: <p>Evaluate γ_n = nu/(1 − nu) for n = 1000 and single precision u = 2⁻²⁴.</p>,
      answer: { kind: "numeric", value: 0.0000596082, tolerance: 0.000000001 },
    },
  ],

  teachBack:
    "Explain to a friend what machine epsilon and the unit roundoff are, why every correctly rounded operation satisfies fl(x op y) = (x op y)(1 + δ) with |δ| ≤ u, how the factors accumulate into γ_n in a running sum, and why pairwise summation is so much more accurate.",

  glimpse: (
    <>
      <p>
        A relative error of u in each operation sounds harmless. The next lesson shows how one subtraction can turn tiny
        relative errors in its inputs into a huge relative error in its output: catastrophic cancellation.
      </p>
    </>
  ),
};
