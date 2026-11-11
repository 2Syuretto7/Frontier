import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SqueezeViz } from "@/components/viz/SqueezeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.2.3",
  minutes: 80,
  links: {
    revisits: ["m2.1.3", "m0.5.3"],
    foreshadows: ["m8.2.1", "m2.4.2"],
  },

  puzzle: (
    <>
      <p>
        Proving <M>{"\\lim_{x \\to 2} x^2 = 4"}</M> from the definition took real work. Must we do that again for{" "}
        <M>{"x^3 + 7x - 1"}</M>, and for every other function we meet? Surely, if <M>{"f(x) \\to 3"}</M> and{" "}
        <M>{"g(x) \\to 5"}</M>, then <M>{"f(x) + g(x) \\to 8"}</M>, and we should be able to prove that once and for all.
      </p>
      <p>
        And what about <M>{"x \\sin(1/x)"}</M> as <M>{"x \\to 0"}</M>? The sine factor has no limit at all. Can the product
        have one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The limit laws say that limits respect arithmetic: the limit of a sum is the sum of the limits, and the same for
        differences, products and quotients (when the bottom limit is not 0). With them, limits of polynomials and of most
        formulas can be found by simple substitution.
      </p>
      <p>
        The laws fail for <M>{"x \\sin(1/x)"}</M>, since one factor has no limit. Another tool, the squeeze theorem, handles
        it: trap the function between two simpler ones that share a limit. Zoom in below and watch the wild curve stay pinned
        between its bounds.
      </p>
      <SqueezeViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the limit laws">
        <p>
          Suppose <M>{"\\lim_{x \\to a} f(x) = L"}</M> and <M>{"\\lim_{x \\to a} g(x) = M"}</M>, and let c be a constant. Then,
          all limits being as <M>{"x \\to a"}</M>:
        </p>
        <ol>
          <li>
            <M>{"\\lim\\, (f + g) = L + M"}</M> and <M>{"\\lim\\, (f - g) = L - M"}</M>;
          </li>
          <li>
            <M>{"\\lim\\, cf = cL"}</M>;
          </li>
          <li>
            <M>{"\\lim\\, fg = LM"}</M>;
          </li>
          <li>
            <M>{"\\lim\\, f/g = L/M"}</M>, provided <M>{"M \\ne 0"}</M>.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          We prove the sum law; the others follow the same plan with more care. Let <M>{"\\varepsilon > 0"}</M>. Since{" "}
          <M>{"f \\to L"}</M>, there is a <M>{"\\delta_1"}</M> with <M>{"|f(x) - L| < \\varepsilon/2"}</M> whenever{" "}
          <M>{"0 < |x - a| < \\delta_1"}</M>, and similarly a <M>{"\\delta_2"}</M> for g. Let{" "}
          <M>{"\\delta = \\min(\\delta_1, \\delta_2)"}</M>. If <M>{"0 < |x - a| < \\delta"}</M>, both hold, and by the
          triangle inequality
        </p>
        <MD>{"|(f(x) + g(x)) - (L + M)| \\le |f(x) - L| + |g(x) - M| < \\tfrac{\\varepsilon}{2} + \\tfrac{\\varepsilon}{2} = \\varepsilon."}</MD>
        <p>
          For the product law, write <M>{"fg - LM = f(g - M) + M(f - L)"}</M>, and first use <M>{"f \\to L"}</M> to keep{" "}
          <M>{"|f(x)|"}</M> below <M>{"|L| + 1"}</M>.
        </p>
      </Proof>

      <Example title="polynomials and rational functions">
        <p>
          Plainly <M>{"\\lim_{x \\to a} c = c"}</M> and <M>{"\\lim_{x \\to a} x = a"}</M> (take{" "}
          <M>{"\\delta = \\varepsilon"}</M>). Repeated use of the sum and product laws then gives{" "}
          <M>{"\\lim_{x \\to a} p(x) = p(a)"}</M> for every polynomial p, and the quotient law gives{" "}
          <M>{"\\lim_{x \\to a} p(x)/q(x) = p(a)/q(a)"}</M> whenever <M>{"q(a) \\ne 0"}</M>. For instance,
        </p>
        <MD>{"\\lim_{x \\to 2} \\frac{x^3 + 7x - 1}{x + 1} = \\frac{8 + 14 - 1}{3} = 7."}</MD>
        <p>
          When the bottom limit is 0, as with <M>{"(x^2 - 1)/(x - 1)"}</M> at 1, the quotient law says nothing, and you must
          first simplify.
        </p>
      </Example>

      <Theorem title="the squeeze theorem">
        <p>
          Suppose <M>{"g(x) \\le f(x) \\le h(x)"}</M> for all x near a (except perhaps at a), and{" "}
          <M>{"\\lim_{x \\to a} g(x) = \\lim_{x \\to a} h(x) = L"}</M>. Then <M>{"\\lim_{x \\to a} f(x) = L"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\varepsilon > 0"}</M>. For x close enough to a (take the smallest of the deltas for g, for h, and for the
          interval where the inequalities hold), <M>{"L - \\varepsilon < g(x)"}</M> and <M>{"h(x) < L + \\varepsilon"}</M>. So{" "}
          <M>{"L - \\varepsilon < g(x) \\le f(x) \\le h(x) < L + \\varepsilon"}</M>, that is,{" "}
          <M>{"|f(x) - L| < \\varepsilon"}</M>.
        </p>
      </Proof>

      <Example title="a wild function tamed">
        <p>
          Since <M>{"|\\sin(1/x)| \\le 1"}</M>, we have <M>{"-|x| \\le x \\sin(1/x) \\le |x|"}</M>. Both bounds tend to 0, so{" "}
          <M>{"\\lim_{x \\to 0} x \\sin(1/x) = 0"}</M>.
        </p>
      </Example>

      <Example title="the most important trigonometric limit">
        <p>
          For <M>{"0 < x < \\pi/2"}</M>, compare three areas in the unit circle: the triangle with vertices the centre,{" "}
          <M>{"(1, 0)"}</M> and <M>{"(\\cos x, \\sin x)"}</M>; the sector of angle x; and the larger right triangle with legs
          1 and <M>{"\\tan x"}</M>. They give
        </p>
        <MD>{"\\tfrac12 \\sin x \\le \\tfrac12 x \\le \\tfrac12 \\tan x, \\quad\\text{so}\\quad \\cos x \\le \\frac{\\sin x}{x} \\le 1."}</MD>
        <p>
          The same holds for <M>{"-\\pi/2 < x < 0"}</M>, since both sides are even. As <M>{"x \\to 0"}</M>,{" "}
          <M>{"\\cos x \\to 1"}</M>, so by the squeeze theorem
        </p>
        <MD>{"\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1."}</MD>
      </Example>

      <Remark title="a caution about the argument">
        <p>
          The area argument uses the area of a sector, and with it some geometry that the axioms of this chapter do not
          supply. A later chapter defines sine by a power series, and then this limit is proved without pictures. For now,
          trust the picture: it is right.
        </p>
      </Remark>

      <Remark title="the limit of a composition">
        <p>
          One more law is often needed. If <M>{"g(x) \\to M"}</M> as <M>{"x \\to a"}</M>, and f is continuous at M (a notion
          made precise in the next chapter: it means <M>{"f(y) \\to f(M)"}</M> as <M>{"y \\to M"}</M>), then{" "}
          <M>{"f(g(x)) \\to f(M)"}</M>. For example, <M>{"\\sqrt{x^2 + 5} \\to 3"}</M> as <M>{"x \\to 2"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "poly",
      rung: "check",
      prompt: (
        <p>
          Find <M>{"\\lim_{x \\to 2} (x^3 - 3x + 4)"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "laws",
      rung: "check",
      prompt: (
        <p>
          If <M>{"f(x) \\to 3"}</M> and <M>{"g(x) \\to -2"}</M> as <M>{"x \\to a"}</M>, what is the limit of{" "}
          <M>{"2f(x) g(x) + g(x)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -14 },
    },
    {
      key: "quotient",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle\\lim_{x \\to 1} \\frac{x^2 + 3x}{2x + 2}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "sin3x",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle\\lim_{x \\to 0} \\frac{\\sin 3x}{x}"}</M>. (Write it as{" "}
          <M>{"3 \\cdot \\frac{\\sin 3x}{3x}"}</M>.)
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "squeeze",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\lim_{x \\to 0} x^2 \\cos(1/x^2)"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
f = lambda x: (math.exp(x) - 1) / x
g = lambda x: x ** 2 + 3
x = 1e-7
print(round(f(x) * g(x), 4))`}</Code>
          <p>By the product law, the limit as x → 0 is (lim f)(lim g). What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3.0, tolerance: 0.0001 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
p = np.poly1d([1, 0, -4])
q = np.poly1d([1, -2])
quot, rem = p / q
print(quot(2), p(2), q(2))`}</Code>
          <p>(x² − 4)/(x − 2) at x = 2: both are 0, but the quotient polynomial gives the limit. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.0 0 0", "0.0 0 0", "4.0 4 0", "2.0 0 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>limit_of_quotient(p, q, a)</C> for polynomials given as coefficient lists (highest power first). If q(a) ≠ 0 return p(a)/q(a) by the quotient law; otherwise return <C>None</C>. Use <C>np.polyval</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def limit_of_quotient(p, q, a):
    return np.polyval(p, a) / np.polyval(q, a)
`,
        solution: `import numpy as np

def limit_of_quotient(p, q, a):
    d = np.polyval(q, a)
    if d == 0:
        return None
    return np.polyval(p, a) / d
`,
        tests: [
          { name: "law applies", code: `assert abs(limit_of_quotient([1, 0, 1], [1, 2], 2) - 1.25) < 1e-12, '(x² + 1)/(x + 2) at x = 2 is 5/4.'` },
          { name: "law does not apply", code: `assert limit_of_quotient([1, 0, -1], [1, -1], 1) is None, 'When the denominator is 0 at a, the quotient law says nothing: return None.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>rational_limit(p, q, a)</C>, the limit of p(x)/q(x) as x → a for polynomials given as integer coefficient lists, highest power first, computed exactly with <C>Fraction</C>: while both p(a) and q(a) are 0, divide each by (x − a) using synthetic division; then return p(a)/q(a) as a <C>Fraction</C> if q(a) ≠ 0, or <C>None</C> if the limit is infinite or does not exist.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def rational_limit(p, q, a):
    return None
`,
        solution: `from fractions import Fraction

def ev(p, a):
    r = Fraction(0)
    for c in p:
        r = r * a + c
    return r

def deflate(p, a):
    out, r = [], Fraction(0)
    for c in p[:-1]:
        r = r * a + c
        out.append(r)
    return out

def rational_limit(p, q, a):
    a = Fraction(a)
    p, q = [Fraction(c) for c in p], [Fraction(c) for c in q]
    while ev(p, a) == 0 and ev(q, a) == 0:
        p, q = deflate(p, a), deflate(q, a)
    if ev(q, a) == 0:
        return None
    return ev(p, a) / ev(q, a)
`,
        tests: [
          { name: "simple", code: `from fractions import Fraction
assert rational_limit([1, 0, -4], [1, -2], 2) == 4 and rational_limit([1, 1], [1, 2], 0) == Fraction(1, 2), 'Cancel (x − 2) once.'` },
          { name: "double", code: `assert rational_limit([1, -2, 1], [1, -1, 0], 1) == 0 and rational_limit([1, -3, 3, -1], [1, -2, 1], 1) == 0 and rational_limit([1, -2, 1], [2, -4, 2], 1) == 0.5, 'Repeated roots need several cancellations.'` },
          { name: "fraction", code: `from fractions import Fraction
assert rational_limit([1, 0, 0, -8], [1, 0, -4], 2) == 3 and rational_limit([3, -1, -2], [2, 1, -3], 1) == Fraction(5, 5), '(x³ − 8)/(x² − 4) → 12/4.'` },
          { name: "infinite", code: `assert rational_limit([1], [1, -3], 3) is None and rational_limit([1, 0], [1, 0, 0], 0) is None, 'A leftover zero in the denominator means no finite limit.'` },
        ],
      },
    },
    {
      key: "product-law",
      rung: "prove",
      prompt: (
        <p>
          Prove the constant multiple law: if <M>{"f(x) \\to L"}</M> as <M>{"x \\to a"}</M>, then{" "}
          <M>{"c f(x) \\to cL"}</M>, for any constant c.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Handles c = 0 separately, or uses a tolerance that avoids dividing by zero, such as ε/(|c| + 1).",
          "Uses the δ for f with the adjusted tolerance.",
          "Shows |cf(x) − cL| = |c| |f(x) − L| < ε.",
        ],
      },
    },
    {
      key: "fails",
      rung: "stretch",
      prompt: (
        <p>
          Give functions f and g such that neither <M>{"\\lim_{x \\to 0} f(x)"}</M> nor <M>{"\\lim_{x \\to 0} g(x)"}</M>{" "}
          exists, but <M>{"\\lim_{x \\to 0} (f(x) + g(x))"}</M> and <M>{"\\lim_{x \\to 0} f(x)g(x)"}</M> both do. What does this
          show about the limit laws?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a valid example, such as f(x) = x/|x| and g(x) = −x/|x| (sum 0, product −1).",
          "Checks that neither limit exists but the sum and product limits do.",
          "Concludes that the laws only work in one direction: they need the separate limits to exist, and cannot be reversed.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the limit of a sum is the sum of the limits, and how the squeeze theorem shows that x sin(1/x) tends to 0.",

  glimpse: (
    <p>
      With these laws, most limits reduce to algebra. Next come limits from one side and limits at infinity. Their first big use is the next chapter&rsquo;s theory of continuity, and then the rules for derivatives, which are limit laws in disguise. Real Analysis proves the same laws for sequences.
    </p>
  ),
};
