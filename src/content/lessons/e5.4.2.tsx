import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SumOrderViz } from "@/components/viz/SumOrderViz";
import type { LessonContent } from "@/lib/types";

const CLOSE = `def ulp_distance(a, b):
    a = np.asarray(a, dtype=np.float32).view(np.int32).astype(np.int64)
    b = np.asarray(b, dtype=np.float32).view(np.int32).astype(np.int64)
    a = np.where(a < 0, -2**31 - a, a)
    b = np.where(b < 0, -2**31 - b, b)
    return np.abs(a - b)

def assert_close(actual, expected, rtol, atol):
    actual, expected = np.asarray(actual), np.asarray(expected)
    if actual.shape != expected.shape:
        return False
    ok = np.abs(actual - expected) <= atol + rtol * np.abs(expected)
    ok |= actual == expected
    return bool(ok.all())
`;

const TORCHLIKE = `def adam_step_torch(p, g, m, v, t, lr, b1, b2, eps):
    f = np.float32
    m = m + (g - m) * f(1 - b1)
    v = v * f(b2) + g * g * f(1 - b2)
    step_size = f(lr / (1 - b1 ** t))
    denom = np.sqrt(v) / f(np.sqrt(1 - b2 ** t)) + f(eps)
    p = p - step_size * (m / denom)
    return p, m, v

def kahan_sum(x):
    s = np.float32(0.0)
    c = np.float32(0.0)
    for v in x:
        y = v - c
        t = s + y
        c = (t - s) - y
        s = t
    return s
`;

export const lesson: LessonContent = {
  id: "e5.4.2",
  minutes: 55,
  links: {
    requires: ["e5.4.1", "e3.1.2"],
    revisits: ["e5.3.2", "e4.1.3"],
    foreshadows: ["e5.4.3", "e5.5.2"],
  },

  puzzle: (
    <>
      <p>
        You run your framework and PyTorch on the same weights and the same batch. The losses agree to six digits; the seventh
        differs. After a thousand Adam steps the weights differ in the fourth digit. Is one of them wrong? And what would it
        take to make them agree exactly?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every floating-point operation rounds its result to the nearest representable number, so two formulas that are equal
        in algebra, or the same sum taken in a different order, can differ in the last bit. Such differences are not bugs.
        A comparison must therefore allow a tolerance sized to the dtype; and an exact match, bit for bit, requires doing the
        same operations, in the same order, in the same dtype.
      </p>
      <SumOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="units in the last place">
        <p>
          Between two adjacent float32 numbers near x, the gap is one ULP, 2^(e − 23) where 2^e ≤ |x| &lt; 2^(e+1); near 1 it
          is 2⁻²³ ≈ 1.19 × 10⁻⁷. Reinterpreting a float32&rsquo;s bits as an integer orders the numbers (after a fix for the
          sign), so the difference of those integers counts the ULPs between two floats.
        </p>
        <Code>{CLOSE}</Code>
      </Definition>

      <Definition title="closeness, as PyTorch tests it">
        <p>
          <C>torch.testing.assert_close</C> accepts actual a against expected e when |a − e| ≤ atol + rtol·|e| entrywise. Its
          defaults are rtol = 1.3 × 10⁻⁶ and atol = 10⁻⁵ for float32, and rtol = atol = 10⁻⁷ for float64: a few ULPs of
          relative slack, plus an absolute floor for values near 0.
        </p>
      </Definition>

      <Theorem title="rounding error of a sum">
        <p>
          Each addition returns fl(a + b) = (a + b)(1 + δ) with |δ| ≤ u, where u = 2⁻²⁴ for float32. Summing n numbers left to
          right gives a result within (n − 1)·u·Σ|xᵢ| of the exact sum, up to terms of order u².
        </p>
      </Theorem>
      <Proof>
        <p>
          Let sₖ be the computed partial sum, with sₖ = (sₖ₋₁ + xₖ)(1 + δₖ). Unrolling, xᵢ is multiplied by the product of the
          (1 + δₖ) for every later addition, at most n − 1 of them, and each such product lies within (n − 1)u + O(u²) of 1.
          So the error is at most Σ|xᵢ|·((n − 1)u + O(u²)). Pairwise summation has depth log₂n instead of n − 1, which is why
          it is so much more accurate.
        </p>
      </Proof>

      <Example title="matching an optimiser bit for bit">
        <p>
          PyTorch&rsquo;s Adam does not compute m̂ / (√v̂ + ε). It folds the bias corrections into a step size and a
          denominator, and recent versions update m with a linear interpolation. Algebraically the same; in float32 it differs
          from the textbook formula by a few ULPs per step. To match it exactly, a framework must copy the order of
          operations:
        </p>
        <Code>{TORCHLIKE}</Code>
      </Example>

      <Remark title="why bother">
        <p>
          A tolerance-based match catches real bugs: a missing bias correction or a wrong reduction is off by far more than a
          few ULPs. An exact match is stricter: it lets a training run be replayed, and it turns any later divergence, after
          a refactor say, into a definite signal rather than a judgement call. Even then, GPU kernels may reorder reductions
          between runs, so exact matches are usually demanded on the CPU in a fixed order.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "assoc",
      rung: "check",
      prompt: <p>Why can summing the same float32 numbers in a different order give a different result?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each addition rounds, so floating-point addition is not associative",
          "NumPy sums in parallel with race conditions",
          "float32 cannot represent negative numbers exactly",
          "It cannot; any difference is a bug",
        ],
        correct: [0],
      },
    },
    {
      key: "ulp",
      rung: "check",
      prompt: <p>The gap between 1.0 and the next float32 is 2ᵏ. What is k?</p>,
      answer: { kind: "numeric", value: -23 },
    },
    {
      key: "tol",
      rung: "apply",
      prompt: <p>With rtol = 1.3e-6 and atol = 1e-5, is 1000.001 accepted as close to the expected 1000.0?</p>,
      answer: {
        kind: "choice",
        options: [
          "Yes: the allowance is 1e-5 + 1.3e-3 ≈ 1.31e-3, and the difference is 1e-3",
          "No: the difference 1e-3 is more than atol",
          "No: the difference is more than rtol",
          "Yes: float32 cannot tell them apart",
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

x = np.array([1e8, 1.0, -1e8, 1.0], dtype=np.float32)
left = np.float32(0)
for v in x:
    left = left + v
right = (x[0] + x[2]) + (x[1] + x[3])
print(left, right, left == right)`}</Code>
          <p>Two orders of the same float32 sum. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0 2.0 False", "2.0 2.0 True", "0.0 2.0 False", "1.0 1.0 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ulp_distance(a, b):
    a = np.asarray(a, dtype=np.float32).view(np.int32).astype(np.int64)
    b = np.asarray(b, dtype=np.float32).view(np.int32).astype(np.int64)
    a = np.where(a < 0, -2**31 - a, a)
    b = np.where(b < 0, -2**31 - b, b)
    return np.abs(a - b)

def assert_close(actual, expected, rtol, atol):
    actual, expected = np.asarray(actual), np.asarray(expected)
    if actual.shape != expected.shape:
        return False
    ok = np.abs(actual - expected) <= atol + rtol * np.abs(expected)
    ok |= actual == expected
    return bool(ok.all())

def adam_step_torch(p, g, m, v, t, lr, b1, b2, eps):
    f = np.float32
    m = m + (g - m) * f(1 - b1)
    v = v * f(b2) + g * g * f(1 - b2)
    step_size = f(lr / (1 - b1 ** t))
    denom = np.sqrt(v) / f(np.sqrt(1 - b2 ** t)) + f(eps)
    p = p - step_size * (m / denom)
    return p, m, v

def kahan_sum(x):
    s = np.float32(0.0)
    c = np.float32(0.0)
    for v in x:
        y = v - c
        t = s + y
        c = (t - s) - y
        s = t
    return s
f = np.float32
def adam_step_plain(p, g, m, v, t, lr, b1, b2, eps):
    m = f(b1) * m + f(1 - b1) * g
    v = f(b2) * v + f(1 - b2) * g * g
    m_hat = m / f(1 - b1 ** t)
    v_hat = v / f(1 - b2 ** t)
    return p - f(lr) * m_hat / (np.sqrt(v_hat) + f(eps)), m, v
rng = np.random.default_rng(0)
pa = pb = rng.normal(size=1000).astype(f)
ma = mb = va = vb = np.zeros(1000, f)
for t in range(1, 11):
    g = rng.normal(size=1000).astype(f)
    pa, ma, va = adam_step_torch(pa, g, ma, va, t, 1e-3, 0.9, 0.999, 1e-8)
    pb, mb, vb = adam_step_plain(pb, g, mb, vb, t, 1e-3, 0.9, 0.999, 1e-8)
print(np.array_equal(pa, pb), int(ulp_distance(pa, pb).max()), assert_close(pa, pb, 1.3e-6, 1e-5))`}</Code>
          <p>Ten Adam steps with two algebraically equal formulas. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["False 3 True", "True 0 True", "False 3 False", "False 3000 False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ulp_distance(a, b)</C> for float32 values or arrays, returning the number of representable float32 numbers
          between them (view the bits as int32, map negatives with x ↦ −2³¹ − x so that order is preserved, use int64 for the
          difference), and <C>assert_close(actual, expected, rtol, atol)</C>, returning False on a shape mismatch and otherwise
          whether every entry satisfies |a − e| ≤ atol + rtol·|e| or is exactly equal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ulp_distance(a, b):
    return np.abs(np.float32(a) - np.float32(b))

def assert_close(actual, expected, rtol, atol):
    return True
`,
        solution: `import numpy as np

${CLOSE}`,
        tests: [
          { name: "ulps", code: `one = np.float32(1.0)
nxt = np.nextafter(one, np.float32(2.0))
assert int(ulp_distance(one, nxt)) == 1 and int(ulp_distance(one, one)) == 0
assert int(ulp_distance(np.float32(-0.0), np.float32(0.0))) == 0
tiny = np.nextafter(np.float32(0.0), np.float32(1.0))
assert int(ulp_distance(-tiny, tiny)) == 2
a = np.array([1.0, 2.0], np.float32)
assert ulp_distance(a, a + np.float32(2 ** -22)).tolist() == [2, 1]` },
          { name: "closeness", code: `assert assert_close(np.array([1000.001]), np.array([1000.0]), 1.3e-6, 1e-5)
assert not assert_close(np.array([1000.01]), np.array([1000.0]), 1.3e-6, 1e-5)
assert assert_close(np.array([1e-6]), np.array([0.0]), 1.3e-6, 1e-5)
assert not assert_close(np.ones(3), np.ones(4), 1e-3, 1e-3)
assert assert_close(np.array([np.inf]), np.array([np.inf]), 1e-6, 1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>adam_step_torch(p, g, m, v, t, lr, b1, b2, eps)</C> on float32 arrays in exactly this order: m ← m + (g −
          m)·(1 − b1); v ← v·b2 + g·g·(1 − b2); step_size = lr / (1 − b1ᵗ); denom = √v / √(1 − b2ᵗ) + eps; p ← p − step_size ·
          (m / denom). Cast each Python scalar factor to float32 before it touches an array. Return (p, m, v). Then write{" "}
          <C>kahan_sum(x)</C>, compensated summation in float32.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adam_step_torch(p, g, m, v, t, lr, b1, b2, eps):
    return p, m, v

def kahan_sum(x):
    return np.float32(x.sum())
`,
        solution: `import numpy as np

${TORCHLIKE}`,
        tests: [
          { name: "bit-exact order", code: `f = np.float32
rng = np.random.default_rng(5)
p = rng.normal(size=50).astype(f)
m = np.zeros(50, f); v = np.zeros(50, f)
for t in range(1, 6):
    g = rng.normal(size=50).astype(f)
    p2, m2, v2 = adam_step_torch(p, g, m, v, t, 1e-3, 0.9, 0.999, 1e-8)
    m = m + (g - m) * f(0.1)
    v = v * f(0.999) + g * g * f(1 - 0.999)
    den = np.sqrt(v) / f(np.sqrt(1 - 0.999 ** t)) + f(1e-8)
    p = p - f(1e-3 / (1 - 0.9 ** t)) * (m / den)
    assert p2.dtype == f and np.array_equal(p2, p) and np.array_equal(m2, m) and np.array_equal(v2, v), t` },
          { name: "compensated sum", code: `x = np.array([1e8] + [1.0] * 1000, dtype=np.float32)
assert float(kahan_sum(x)) == 100001000.0, kahan_sum(x)
rng = np.random.default_rng(0)
y = rng.uniform(size=100000).astype(np.float32)
exact = y.astype(np.float64).sum()
assert abs(float(kahan_sum(y)) - exact) <= 0.01, (kahan_sum(y), exact)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Using fl(a + b) = (a + b)(1 + δ) with |δ| ≤ u, show that summing x₁, …, xₙ left to right has error at most (n − 1)u·Σ|xᵢ|
          plus terms of order u², and explain why pairwise summation does better.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the computed partial sums with one factor (1 + δₖ) per addition and unrolls them, so each xᵢ is multiplied by at most n − 1 such factors.",
          "Bounds each product of factors as 1 + θ with |θ| ≤ (n − 1)u + O(u²), and sums to get |error| ≤ (n − 1)u Σ|xᵢ| + O(u²).",
          "Explains that in pairwise summation each xᵢ passes through only about log₂ n additions, so the bound becomes about u·log₂n·Σ|xᵢ|.",
        ],
      },
    },
    {
      key: "bits",
      rung: "stretch",
      prompt: <p>How many bits of precision does a float32 significand have, counting the implicit leading 1?</p>,
      answer: { kind: "numeric", value: 24 },
    },
  ],

  teachBack:
    "Explain to a friend why two correct frameworks can disagree in the last digits, how ULPs and rtol/atol tolerances make comparisons fair, and what it takes to match bit for bit.",

  glimpse: (
    <p>
      Rounding in the last bit is harmless. Overflow, underflow, nan and −0 are not. Next: the numerical edge cases a framework
      must survive, and how to test for each.
    </p>
  ),
};
