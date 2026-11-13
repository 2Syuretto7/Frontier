import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TaylorRemainderViz } from "@/components/viz/TaylorRemainderViz";
import type { LessonContent } from "@/lib/types";

const TAYLOR = `def taylor_poly(derivs, a, x):
    total, fact = 0.0, 1
    for k, d in enumerate(derivs):
        if k > 0:
            fact *= k
        total += d * (x - a) ** k / fact
    return total

def lagrange_bound(M, a, x, n):
    fact = 1
    for k in range(2, n + 2):
        fact *= k
    return M * abs(x - a) ** (n + 1) / fact`;

const EXP = `import math

def terms_needed(x, tol):
    M = math.exp(max(x, 0))
    n, term = 0, abs(x)
    while M * term >= tol:
        n += 1
        term *= abs(x) / (n + 1)
    return n

def exp_taylor(x, n):
    total, term = 0.0, 1.0
    for k in range(n + 1):
        total += term
        term *= x / (k + 1)
    return total`;

export const lesson: LessonContent = {
  id: "m8.6.3",
  minutes: 65,
  links: {
    requires: ["m8.6.2"],
    revisits: ["m2.8.5", "m2.4.1"],
    foreshadows: ["m8.8.3", "m8.8.4"],
  },

  puzzle: (
    <>
      <p>
        A calculator computes eˣ from a polynomial. How many terms does it need for six correct digits, and can it ever be
        sure? Taylor polynomials are the natural candidates, but a polynomial agreeing with f to many derivatives at a
        point need not be close to f anywhere else: e^(−1/x²) has every derivative 0 at 0, so all its Taylor polynomials are
        0. What is needed is a formula for the error.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The mean value theorem says f(x) = f(a) + f′(c)(x − a): a degree-zero approximation with an error term that looks like
        the next term evaluated at an unknown point. Taylor&apos;s theorem says the same for every degree: the error after the
        degree-n polynomial looks exactly like the next term, with the derivative taken somewhere between a and x.
      </p>
      <TaylorRemainderViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Taylor's theorem with Lagrange remainder">
        <p>
          Let f be n + 1 times differentiable on an open interval containing a and x, and let{" "}
          <M>{"P_n(t) = \\sum_{k=0}^{n} \\frac{f^{(k)}(a)}{k!}(t - a)^k"}</M>. Then for some c between a and x,
        </p>
        <MD>{"f(x) = P_n(x) + \\frac{f^{(n+1)}(c)}{(n+1)!}(x - a)^{n+1}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Fix x ≠ a and let R(t) = f(t) − P_n(t). P_n was built so that R and its first n derivatives vanish at a, and{" "}
          <M>{"R^{(n+1)} = f^{(n+1)}"}</M> since P_n has degree n. Let
        </p>
        <MD>{"g(t) = R(t) - R(x)\\frac{(t - a)^{n+1}}{(x - a)^{n+1}}."}</MD>
        <p>
          Then <M>{"g(a) = g'(a) = \\dots = g^{(n)}(a) = 0"}</M> and g(x) = 0. Rolle on [a, x] gives <M>{"c_1"}</M> with{" "}
          <M>{"g'(c_1) = 0"}</M>; Rolle on g′ between a and <M>{"c_1"}</M> gives <M>{"c_2"}</M> with <M>{"g''(c_2) = 0"}</M>; after
          n + 1 steps, <M>{"g^{(n+1)}(c) = 0"}</M> for some c between a and x. Since{" "}
          <M>{"g^{(n+1)}(t) = f^{(n+1)}(t) - R(x)(n+1)!/(x - a)^{n+1}"}</M>, solving for R(x) gives the formula.
        </p>
      </Proof>

      <Example title="bounding the error">
        <p>
          If <M>{"|f^{(n+1)}| \\leq M"}</M> between a and x, the error is at most <M>{"M|x - a|^{n+1}/(n+1)!"}</M>. For sin, M = 1
          always; for eˣ on [0, x], M = eˣ. The code evaluates a Taylor polynomial from its derivatives at a and the Lagrange
          bound; the true error is below the bound, as it must be.
        </p>
        <Code>{TAYLOR}</Code>
      </Example>

      <Theorem title="the exponential series">
        <p>For every real x, <M>{"\\sum_{k \\geq 0} x^k/k!"}</M> converges to eˣ.</p>
      </Theorem>
      <Proof>
        <p>
          The remainder after degree n is at most <M>{"e^{|x|}|x|^{n+1}/(n+1)!"}</M>, and <M>{"|x|^{n}/n! \\to 0"}</M> because
          successive ratios |x|/(n + 1) eventually stay below 1/2. The same bound tells you how many terms suffice for a given
          tolerance. In floating point there is a catch: for large negative x the terms are huge with alternating signs and
          cancel catastrophically, so one computes <M>{"e^{-x}"}</M> and takes the reciprocal.
        </p>
        <Code>{EXP}</Code>
      </Proof>

      <Theorem title="second derivative test">
        <p>If f′(c) = 0 and f″ is continuous at c with f″(c) &gt; 0, then f has a strict local minimum at c.</p>
      </Theorem>
      <Proof>
        <p>
          By continuity f″ &gt; 0 on some interval around c. For x ≠ c there, Taylor with n = 1 gives{" "}
          <M>{"f(x) = f(c) + \\tfrac12 f''(\\xi)(x - c)^2 > f(c)"}</M>.
        </p>
      </Proof>

      <Remark title="smooth is not analytic">
        <p>
          Taylor&apos;s theorem says nothing about whether the remainder tends to 0 as n grows. For e^(−1/x²) it does not: the
          remainder is the whole function. Functions whose Taylor series converge to them near each point are called
          analytic; power series, two chapters on, are exactly the right setting for them. The same remainder estimate also
          explains the numerical derivatives of the derivative lesson: the forward difference has error{" "}
          <M>{"\\tfrac12 f''(c)h"}</M>, and in the central difference the h terms cancel, leaving{" "}
          <M>{"\\tfrac16 f^{(3)}(c)h^2"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sin5",
      rung: "check",
      prompt: <p>Evaluate the degree-5 Taylor polynomial of sin at 0 at x = 1. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.8417, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>Bound the error of the degree-3 Taylor polynomial of eˣ at 0, evaluated at x = 0.5, using M = e^0.5. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0043, tolerance: 0.0001 },
    },
    {
      key: "test",
      rung: "apply",
      prompt: <p>f′(c) = 0, f″ is continuous at c and f″(c) &gt; 0. What follows?</p>,
      answer: {
        kind: "choice",
        options: ["f has a strict local minimum at c", "f has a local maximum at c", "f is convex on its whole domain", "c is a global minimum of f"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def taylor_poly(derivs, a, x):
    total, fact = 0.0, 1
    for k, d in enumerate(derivs):
        if k > 0:
            fact *= k
        total += d * (x - a) ** k / fact
    return total

def lagrange_bound(M, a, x, n):
    fact = 1
    for k in range(2, n + 2):
        fact *= k
    return M * abs(x - a) ** (n + 1) / fact

d = [0, 1, 0, -1] * 3
print(round(taylor_poly(d[:6], 0, 1), 6), round(math.sin(1), 6), f"{lagrange_bound(1, 0, 1, 5):.2e}")
e = abs(taylor_poly([1] * 4, 0, 0.5) - math.exp(0.5))
print(round(taylor_poly([1] * 4, 0, 0.5), 6), round(e, 6), round(lagrange_bound(math.exp(0.5), 0, 0.5, 3), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.841667 0.841471 1.39e-03\n1.645833 0.002888 0.004294",
          "0.841471 0.841471 1.39e-03\n1.645833 0.002888 0.004294",
          "0.841667 0.841471 8.33e-03\n1.645833 0.002888 0.004294",
          "0.841667 0.841471 1.39e-03\n1.645833 0.004294 0.002888",
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

def terms_needed(x, tol):
    M = math.exp(max(x, 0))
    n, term = 0, abs(x)
    while M * term >= tol:
        n += 1
        term *= abs(x) / (n + 1)
    return n

def exp_taylor(x, n):
    total, term = 0.0, 1.0
    for k in range(n + 1):
        total += term
        term *= x / (k + 1)
    return total

print(terms_needed(1, 1e-6), terms_needed(-2, 1e-6), terms_needed(10, 1e-6))
print(abs(exp_taylor(1, terms_needed(1, 1e-10)) - math.e) < 1e-10, f"{exp_taylor(-30, 150):.1e}", f"{1 / exp_taylor(30, 150):.1e}")`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["9 13 43\nTrue 6.1e-06 9.4e-14", "9 13 43\nTrue 9.4e-14 9.4e-14", "9 9 43\nTrue 6.1e-06 9.4e-14", "9 13 43\nFalse 6.1e-06 9.4e-14"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>taylor_poly(derivs, a, x)</C>, where derivs[k] is the k-th derivative of f at a, returning the Taylor
          polynomial of degree len(derivs) − 1 at x. Then write <C>lagrange_bound(M, a, x, n)</C>, returning{" "}
          <M>{"M|x - a|^{n+1}/(n+1)!"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def taylor_poly(derivs, a, x):
    return 0.0

def lagrange_bound(M, a, x, n):
    return 0.0
`,
        solution: TAYLOR,
        tests: [
          { name: "poly", code: `assert taylor_poly([1, 2, 3], 1, 2) == 4.5
assert abs(taylor_poly([0, 1, 0, -1], 0, 0.1) - (0.1 - 0.001 / 6)) < 1e-15` },
          { name: "bound", code: `assert abs(lagrange_bound(2, 0, 0.5, 2) - 0.25 / 6) < 1e-15 and lagrange_bound(1, 1, 3, 0) == 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>exp_taylor(x, n)</C>, the sum of <M>{"x^k/k!"}</M> for k = 0, …, n, building each term from the previous one.
          Then write <C>terms_needed(x, tol)</C>: the smallest n with <M>{"e^{\\max(x, 0)}|x|^{n+1}/(n+1)! < \\text{tol}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def terms_needed(x, tol):
    return 0

def exp_taylor(x, n):
    return 1.0
`,
        solution: EXP,
        tests: [
          { name: "exp", code: `assert exp_taylor(1, 0) == 1.0 and exp_taylor(2, 2) == 5.0` },
          { name: "terms", code: `assert terms_needed(0.5, 1e-3) == 4 and terms_needed(0, 1) == 0 and terms_needed(1, 1e-6) == 9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the second derivative test: if f′(c) = 0 and f″ is continuous at c with f″(c) &gt; 0, then f has a strict local minimum at c.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses continuity of f″ at c to get an interval around c on which f″ > 0.",
          "Applies Taylor's theorem with n = 1 (or the mean value theorem twice) to write f(x) = f(c) + f′(c)(x − c) + ½f″(ξ)(x − c)² with ξ between c and x.",
          "Uses f′(c) = 0 and f″(ξ) > 0 to conclude f(x) > f(c) for x ≠ c in the interval.",
        ],
      },
    },
    {
      key: "nsin",
      rung: "stretch",
      prompt: <p>Using the bound 1/(n + 1)!, what is the smallest degree n that guarantees the Taylor polynomial of sin at 0 is within 10⁻⁶ of sin 1?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the statement of Taylor's theorem with Lagrange remainder, the repeated-Rolle proof, how the remainder bound shows the exponential series converges everywhere, and why e^(−1/x²) shows that a smooth function need not equal its Taylor series.",

  glimpse: (
    <>
      <p>
        Differentiation is done. The next chapter builds the integral from scratch as a limit of upper and lower sums, decides
        which functions it applies to, and proves the fundamental theorem that ties it back to derivatives.
      </p>
    </>
  ),
};
