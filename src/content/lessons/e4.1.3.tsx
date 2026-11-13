import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GradCheckViz } from "@/components/viz/GradCheckViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.1.3",
  minutes: 60,
  links: {
    requires: ["e4.1.1"],
    revisits: ["e1.5.2", "m2.2.1"],
    foreshadows: ["e4.3.1", "l1.2.4"],
  },

  puzzle: (
    <>
      <p>
        You write a test that your new attention kernel gives the same output as the simple version. It fails: the two
        outputs differ in the eighth decimal place. You loosen the test to compare only two decimal places, and it passes. A
        month later a bug that scaled the output by 1.001 sails straight through.
      </p>
      <p>How close is close enough, and how do you decide?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Floating-point numbers round after every operation, so two correct programs that add the same numbers in a different
        order usually disagree in the last few digits. Tests of numerical code must allow that much difference and no more.
        The allowance should be <em>relative</em> to the size of the numbers, because an error of 0.001 is tiny for a value of
        a million and enormous for a value of 0.001.
      </p>
      <p>
        The same tension appears when you check a gradient by finite differences. Below, the derivative of sin x at 1 is
        estimated by stepping a distance h. Move h and watch the error.
      </p>
      <GradCheckViz />
      <p>
        For large h the formula is simply inaccurate. For tiny h, <M>{"\\sin(1 + h)"}</M> and <M>{"\\sin 1"}</M> agree in
        nearly all their digits, and subtracting them leaves mostly rounding error, which dividing by h then magnifies. The best
        step lies between, and the central difference reaches a far smaller error than the forward one.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="relative and absolute tolerance">
        <p>Python&rsquo;s <C>math.isclose(a, b, rel_tol, abs_tol)</C> accepts a and b when</p>
        <MD>{"|a - b| \\le \\max\\big(\\text{rel\\_tol} \\cdot \\max(|a|, |b|),\\ \\text{abs\\_tol}\\big)."}</MD>
        <p>
          The default <C>rel_tol</C> is <M>{"10^{-9}"}</M> and the default <C>abs_tol</C> is 0, so nothing except 0 itself
          is close to 0. Comparing with a value that should be zero needs an absolute tolerance. NumPy&rsquo;s{" "}
          <C>np.allclose(a, b)</C> and <C>np.testing.assert_allclose</C> instead test{" "}
          <M>{"|a - b| \\le \\text{atol} + \\text{rtol} \\cdot |b|"}</M>, elementwise, with defaults{" "}
          <M>{"\\text{rtol} = 10^{-5}"}</M> and <M>{"\\text{atol} = 10^{-8}"}</M>; note that b, the expected value, sets the
          scale, so the test is not symmetric.
        </p>
      </Definition>

      <Example title="choosing a tolerance">
        <p>
          A single rounding in float64 has relative error at most about <M>{"1.1 \\times 10^{-16}"}</M>, in float32 about{" "}
          <M>{"6 \\times 10^{-8}"}</M>, and in bfloat16 about <M>{"4 \\times 10^{-3}"}</M>. A computation that adds n numbers
          can accumulate up to about n of these. So compare two float32 implementations of a 1000-term dot product with a
          relative tolerance near <M>{"10^{-5}"}</M>, not <M>{"10^{-9}"}</M>, and certainly not two decimal places. Set the
          tolerance from the arithmetic, and make it as tight as that allows.
        </p>
        <Code>{`import numpy as np
np.testing.assert_allclose(fast_attention(q, k, v), slow_attention(q, k, v), rtol=1e-5, atol=1e-6)`}</Code>
      </Example>

      <Theorem title="finite-difference error">
        <p>
          If f has a continuous third derivative near x, the central difference satisfies
        </p>
        <MD>{"\\frac{f(x + h) - f(x - h)}{2h} = f'(x) + \\frac{h^2}{6} f'''(\\xi)"}</MD>
        <p>
          for some ξ between x − h and x + h, while the forward difference <M>{"(f(x + h) - f(x))/h"}</M> has error of order
          h.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Taylor&rsquo;s theorem with remainder,{" "}
          <M>{"f(x \\pm h) = f(x) \\pm h f'(x) + \\tfrac{h^2}{2} f''(x) \\pm \\tfrac{h^3}{6} f'''(\\xi_\\pm)"}</M>. Subtracting
          cancels the even terms: <M>{"f(x + h) - f(x - h) = 2h f'(x) + \\tfrac{h^3}{6}(f'''(\\xi_+) + f'''(\\xi_-))"}</M>.
          The average of <M>{"f'''(\\xi_+)"}</M> and <M>{"f'''(\\xi_-)"}</M> lies between them, so by the intermediate value
          theorem it equals <M>{"f'''(\\xi)"}</M> for some ξ in the interval. Dividing by 2h gives the result. For the forward
          difference the <M>{"h^2 f''(x)/2"}</M> term survives, leaving an error of <M>{"h f''(x)/2"}</M> plus higher order.
        </p>
      </Proof>
      <p>
        Rounding adds an error of roughly <M>{"\\varepsilon |f| / h"}</M>, where ε is the machine precision. Balancing{" "}
        <M>h</M> against <M>{"\\varepsilon / h"}</M> gives the best forward step near <M>{"\\sqrt{\\varepsilon} \\approx 10^{-8}"}</M>
        ; balancing <M>{"h^2"}</M> against <M>{"\\varepsilon / h"}</M> gives the best central step near{" "}
        <M>{"\\varepsilon^{1/3} \\approx 10^{-5}"}</M>, exactly the bottoms of the two curves above.
      </p>

      <Definition title="gradient check">
        <p>
          To test hand-written backward code, compare its gradient g with the central-difference estimate ĝ, coordinate by
          coordinate, using the relative error <M>{"|g - \\hat g| / \\max(|g|, |\\hat g|)"}</M>. In float64 with a step near{" "}
          <M>{"10^{-5}"}</M>, a correct gradient typically gives a relative error below <M>{"10^{-7}"}</M>, while a real bug
          gives something near 1. Run gradient checks in float64: in float32 the rounding error alone is too large to tell.
        </p>
      </Definition>

      <Remark title="never compare floats with ==">
        <p>
          Exact equality is right only for values that are computed exactly, such as small integers, shapes and indices. For
          anything that has been through arithmetic, compare with a tolerance, and write down why you chose it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "why",
      rung: "check",
      prompt: <p>Why does <C>0.1 + 0.2 == 0.3</C> give False in Python?</p>,
      answer: {
        kind: "choice",
        options: [
          "0.1, 0.2 and 0.3 are each rounded to the nearest binary fraction, and the rounded sum is not the nearest binary fraction to 0.3",
          "Python adds floats in a random order",
          "== compares the identity of float objects, not their values",
          "The addition overflows",
        ],
        correct: [0],
      },
    },
    {
      key: "allclose",
      rung: "apply",
      prompt: (
        <p>
          With NumPy&rsquo;s default tolerances <M>{"\\text{rtol} = 10^{-5}"}</M> and <M>{"\\text{atol} = 10^{-8}"}</M>, what
          is the largest <M>{"|a - b|"}</M> that <C>np.allclose(a, b)</C> accepts when b = 1000?
        </p>
      ),
      answer: { kind: "numeric", value: 0.01000001, tolerance: 1e-10 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Which of these return True?</p>,
      answer: {
        kind: "choice",
        options: [
          "math.isclose(1e-12, 0.0)",
          "math.isclose(1e-12, 0.0, abs_tol=1e-9)",
          "math.isclose(1000.0, 1000.0000001)",
          "math.isclose(1.0, 1.001, rel_tol=1e-4)",
        ],
        correct: [1, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
pairs = [(0.1 + 0.2, 0.3), (1e-10, 0.0), (1e6 + 0.01, 1e6), (1e-10, 2e-10)]
print([math.isclose(a, b) for a, b in pairs])
print([math.isclose(a, b, abs_tol=1e-9) for a, b in pairs])`}</Code>
          <p>Default and absolute tolerances on four pairs. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[True, False, False, False]\n[True, True, False, True]",
          "[False, False, False, False]\n[True, True, True, True]",
          "[True, False, True, False]\n[True, True, True, True]",
          "[True, True, False, False]\n[True, True, False, True]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x: x ** 3
h = 0.1
fwd = (f(1 + h) - f(1)) / h
cen = (f(1 + h) - f(1 - h)) / (2 * h)
print(round(fwd, 4), round(cen, 4))`}</Code>
          <p>Two estimates of the derivative of x³ at 1, which is exactly 3. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.31 3.01", "3.0 3.0", "3.31 3.31", "3.1 3.01"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>close(a, b, rtol, atol)</C>, True when <M>{"|a - b| \\le \\max(\\text{rtol} \\cdot \\max(|a|, |b|), \\text{atol})"}</M>
            , as <C>math.isclose</C> does. Then write <C>assert_all_close(xs, ys, rtol=1e-9, atol=0.0)</C> for two lists, which
            raises <C>AssertionError</C> if their lengths differ, or with a message containing{" "}
            <C>{"f\"index {i}\""}</C> for the first position i where the items are not close, and otherwise returns None.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def close(a, b, rtol, atol):
    return a == b

def assert_all_close(xs, ys, rtol=1e-9, atol=0.0):
    assert xs == ys
`,
        solution: `def close(a, b, rtol, atol):
    return abs(a - b) <= max(rtol * max(abs(a), abs(b)), atol)

def assert_all_close(xs, ys, rtol=1e-9, atol=0.0):
    if len(xs) != len(ys):
        raise AssertionError(f'lengths differ: {len(xs)} and {len(ys)}')
    for i, (a, b) in enumerate(zip(xs, ys)):
        if not close(a, b, rtol, atol):
            raise AssertionError(f'index {i}: {a} and {b} are not close')
`,
        tests: [
          { name: "close", code: `import math, random
rng = random.Random(1)
for _ in range(2000):
    a = rng.choice([0.0, 1e-12, 1.0, -3.5, 1e6]) * (1 + rng.uniform(-1e-6, 1e-6))
    b = a + rng.choice([0, 1e-13, 1e-9, 1e-6, 1e-3]) * rng.choice([1, -1])
    r, t = rng.choice([1e-9, 1e-6, 1e-3]), rng.choice([0.0, 1e-12, 1e-6])
    assert close(a, b, r, t) == math.isclose(a, b, rel_tol=r, abs_tol=t), (a, b, r, t)` },
          { name: "lists", code: `assert assert_all_close([0.1 + 0.2, 1.0], [0.3, 1.0]) is None
for xs, ys, frag in [([1.0, 2.0, 3.0], [1.0, 2.1, 3.5], 'index 1'), ([0.0], [1e-12], 'index 0'), ([1.0], [1.0, 2.0], '')]:
    try:
        assert_all_close(xs, ys)
    except AssertionError as e:
        assert frag in str(e), f'The message should name the first bad {frag!r}; got {str(e)!r}.'
    else:
        assert False, f'{xs} and {ys} should not pass.'
assert_all_close([0.0], [1e-12], atol=1e-9)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a gradient checker for a function f of a list of floats. <C>numeric_grad(f, x, h)</C> returns the list of
            central differences <M>{"(f(x + h e_i) - f(x - h e_i)) / 2h"}</M>, without changing x.{" "}
            <C>grad_check(f, grad, x, h=1e-5)</C> returns the largest relative error{" "}
            <M>{"|g_i - \\hat g_i| / \\max(|g_i|, |\\hat g_i|, 10^{-12})"}</M> between <C>grad(x)</C> and the numeric
            gradient.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def numeric_grad(f, x, h):
    return [0.0 for _ in x]

def grad_check(f, grad, x, h=1e-5):
    return 0.0
`,
        solution: `def numeric_grad(f, x, h):
    out = []
    for i in range(len(x)):
        up = x[:i] + [x[i] + h] + x[i + 1:]
        down = x[:i] + [x[i] - h] + x[i + 1:]
        out.append((f(up) - f(down)) / (2 * h))
    return out

def grad_check(f, grad, x, h=1e-5):
    g, n = grad(x), numeric_grad(f, x, h)
    return max(abs(a - b) / max(abs(a), abs(b), 1e-12) for a, b in zip(g, n))
`,
        tests: [
          { name: "numeric", code: `x = [1.0, 2.0, -3.0]
f = lambda v: v[0] ** 2 + 3 * v[1] * v[2]
g = numeric_grad(f, x, 1e-5)
assert x == [1.0, 2.0, -3.0], 'Do not change x.'
assert all(abs(a - b) < 1e-8 for a, b in zip(g, [2.0, -9.0, 6.0])), 'Central differences, one coordinate at a time.'` },
          { name: "check", code: `import math
f = lambda v: math.log(sum(math.exp(t) for t in v))
def good(v):
    s = sum(math.exp(t) for t in v)
    return [math.exp(t) / s for t in v]
def bad(v):
    return [2 * g for g in good(v)]
x = [0.3, -1.2, 2.0, 0.0]
assert grad_check(f, good, x) < 1e-7, 'A correct gradient should agree to about 1e-7 or better.'
assert grad_check(f, bad, x) > 0.4, 'A gradient that is twice too big should be caught.'` },
        ],
      },
    },
    {
      key: "central",
      rung: "prove",
      prompt: (
        <p>
          Prove that if f has a continuous third derivative, then{" "}
          <M>{"\\frac{f(x + h) - f(x - h)}{2h} - f'(x) = \\frac{h^2}{6} f'''(\\xi)"}</M> for some ξ in [x − h, x + h], and
          explain why this makes the central difference more accurate than the forward difference for small h.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the Taylor expansions of f(x + h) and f(x − h) to second order with third-order remainders.",
          "Subtracts them so the f(x) and f''(x) terms cancel, leaving 2h f'(x) plus h³/6 times a sum of two third derivatives.",
          "Uses the intermediate value theorem on the continuous f''' to replace the average of the two third derivatives by f'''(ξ).",
          "Compares with the forward difference, whose error h f''(x)/2 is of order h, so for small h the h² error of the central difference is much smaller.",
        ],
      },
    },
    {
      key: "step",
      rung: "stretch",
      prompt: (
        <p>
          Model the total error of a forward difference as <M>{"E(h) = \\frac{h}{2} + \\frac{10^{-16}}{h}"}</M>. Which h
          minimises it? Give h in units of <M>{"10^{-8}"}</M>, to two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1.41, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend why tests of numerical code need a tolerance, why it should usually be relative, and why making the step of a finite difference smaller eventually makes the answer worse.",

  glimpse: (
    <p>
      Values can be approximately right; shapes must be exactly right. Next, asserting shapes and invariants, so that a
      transposed matrix or a broadcast you did not intend fails loudly instead of silently producing a number.
    </p>
  ),
};
