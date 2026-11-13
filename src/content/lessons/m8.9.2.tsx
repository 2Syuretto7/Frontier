import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RampCauchyViz } from "@/components/viz/RampCauchyViz";
import type { LessonContent } from "@/lib/types";

const RAMP = `def ramp(n):
    return lambda x: min(1.0, max(0.0, n * (x - 0.5) + 0.5))

def tail_spread(seq, dist, ns):
    return max(dist(seq(m), seq(n)) for m in ns for n in ns)`;

const NEWTON = `from fractions import Fraction

def newton_sqrt2(k):
    xs = [Fraction(1)]
    for _ in range(k):
        x = xs[-1]
        xs.append((x + 2 / x) / 2)
    return xs

def gaps(xs):
    return [float(abs(b - a)) for a, b in zip(xs, xs[1:])]`;

export const lesson: LessonContent = {
  id: "m8.9.2",
  minutes: 55,
  links: {
    requires: ["m8.9.1", "m8.2.4"],
    revisits: ["m8.8.1", "m8.1.2"],
    foreshadows: ["m8.9.3", "m8.9.4"],
  },

  puzzle: (
    <>
      <p>
        Newton&apos;s method for √2, run in exact fractions, produces 1, 3/2, 17/12, 577/408, … The terms crowd together
        faster and faster, yet no fraction is their limit. The iteration is fine; the space is missing a point. Many existence
        proofs in analysis build a sequence that ought to converge and then need the space to supply the limit. Which spaces
        always do?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Cauchy sequence is one whose terms eventually stay within any ε of each other; it looks convergent from the inside.
        A space is complete when every such sequence actually has a limit in the space. ℝ is complete by construction. On
        functions, the sup metric gives a complete space and the integral metric does not: continuous ramps can steepen
        towards a step, which is not continuous.
      </p>
      <RampCauchyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="complete metric space">
        <p>
          A metric space is complete if every Cauchy sequence in it converges to a point of the space. A complete normed space
          is a Banach space.
        </p>
      </Definition>

      <Example title="complete and incomplete">
        <p>
          ℝ is complete (the Cauchy lesson), and so is ℝⁿ in any of its usual norms: a Cauchy sequence has Cauchy coordinates,
          each converges, and the limits assemble into the limit. ℚ is not complete: the Newton iterates for √2 are rational
          and Cauchy, and their real limit √2 is irrational.
        </p>
        <Code>{NEWTON}</Code>
      </Example>

      <Theorem title="closed subsets">
        <p>
          A closed subset of a complete metric space is complete. Conversely, a subset of any metric space that is complete
          in the inherited metric is closed.
        </p>
      </Theorem>
      <Proof>
        <p>
          If F is closed in complete X and <M>{"(x_n)"}</M> in F is Cauchy, it converges to some x ∈ X; as a limit of points
          of F, x ∈ F. Conversely, if F is complete and <M>{"x_n \\to x"}</M> with <M>{"x_n \\in F"}</M>, then{" "}
          <M>{"(x_n)"}</M> is Cauchy, so it has a limit in F, which must be x by uniqueness of limits.
        </p>
      </Proof>

      <Theorem title="the continuous functions under the sup metric">
        <p>C[a, b] with <M>{"d_\\infty"}</M> is complete.</p>
      </Theorem>
      <Proof>
        <p>
          A Cauchy sequence in <M>{"d_\\infty"}</M> is uniformly Cauchy, so by the Cauchy criterion for uniform convergence it
          converges uniformly to some function f. A uniform limit of continuous functions is continuous, so f ∈ C[a, b], and
          uniform convergence is exactly <M>{"d_\\infty(f_n, f) \\to 0"}</M>.
        </p>
      </Proof>

      <Example title="the integral metric is not complete">
        <p>
          The ramp <M>{"f_n"}</M> rises linearly from 0 to 1 on an interval of length 1/n centred at 1/2. For m &lt; n,{" "}
          <M>{"d_1(f_m, f_n) = 1/(4m) - 1/(4n)"}</M>, so the sequence is Cauchy in <M>{"d_1"}</M>. If it converged to a
          continuous f, then f would have to be 0 on [0, 1/2) and 1 on (1/2, 1], since <M>{"f_n"}</M> converges to those values in{" "}
          <M>{"d_1"}</M> on every interval avoiding 1/2; no continuous function does that. The same ramps are not Cauchy in{" "}
          <M>{"d_\\infty"}</M>, where <M>{"d_\\infty(f_n, f_{2n}) = 1/4"}</M>.
        </p>
        <Code>{RAMP}</Code>
      </Example>

      <Remark title="completions">
        <p>
          Every metric space sits densely inside a complete one, its completion, built from Cauchy sequences just as ℝ can be
          built from ℚ. The polynomials under <M>{"d_\\infty"}</M> complete to C[a, b], by Weierstrass. C[a, b] under{" "}
          <M>{"d_1"}</M> completes to the space L¹ of Lebesgue-integrable functions, and under the <M>{"d_2"}</M> metric to L², a
          Hilbert space; these are where probability and much of learning theory are done. Completeness is what turns
          &ldquo;this sequence should converge&rdquo; into an existence proof, as the next lesson shows.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "d1",
      rung: "check",
      prompt: <p>What is d₁ between the ramps f₄ and f₈?</p>,
      answer: { kind: "numeric", value: 0.03125, tolerance: 0.00001 },
    },
    {
      key: "den",
      rung: "check",
      prompt: <p>Newton&apos;s map x ↦ (x + 2/x)/2 sends 17/12 to a fraction in lowest terms. What is its denominator?</p>,
      answer: { kind: "numeric", value: 408, tolerance: 0.0001 },
    },
    {
      key: "complete",
      rung: "apply",
      prompt: <p>Which of these metric spaces is complete?</p>,
      answer: {
        kind: "choice",
        options: ["C[0, 1] with the sup metric", "C[0, 1] with the integral metric d₁", "ℚ with |x − y|", "the polynomials on [0, 1] with the sup metric"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ramp(n):
    return lambda x: min(1.0, max(0.0, n * (x - 0.5) + 0.5))

def tail_spread(seq, dist, ns):
    return max(dist(seq(m), seq(n)) for m in ns for n in ns)

d1 = lambda f, g: sum(abs(f((i + 0.5) / 4000) - g((i + 0.5) / 4000)) for i in range(4000)) / 4000
dsup = lambda f, g: max(abs(f(i / 4000) - g(i / 4000)) for i in range(4001))
print(round(d1(ramp(4), ramp(8)), 6), dsup(ramp(4), ramp(8)))
print(round(tail_spread(ramp, d1, [10, 20, 40, 80]), 5), round(tail_spread(ramp, dsup, [10, 20, 40, 80]), 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.03125 0.25\n0.02188 0.4375", "0.03125 0.25\n0.02188 0.25", "0.0625 0.5\n0.02188 0.4375", "0.03125 0.25\n0.00313 0.4375"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def newton_sqrt2(k):
    xs = [Fraction(1)]
    for _ in range(k):
        x = xs[-1]
        xs.append((x + 2 / x) / 2)
    return xs

def gaps(xs):
    return [float(abs(b - a)) for a, b in zip(xs, xs[1:])]

xs = newton_sqrt2(4)
print([str(x) for x in xs])
print([f"{g:.1e}" for g in gaps(xs)], any(x * x == 2 for x in xs))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['1', '3/2', '17/12', '577/408', '665857/470832']\n['5.0e-01', '8.3e-02', '2.5e-03', '2.1e-06'] False",
          "['1', '3/2', '17/12', '577/408', '665857/470832']\n['5.0e-01', '8.3e-02', '2.5e-03', '2.1e-06'] True",
          "['1', '3/2', '7/5', '17/12', '41/29']\n['5.0e-01', '1.0e-01', '1.7e-02', '2.9e-03'] False",
          "['1', '1.5', '1.4166666666666667', '1.4142156862745099', '1.4142135623746899']\n['5.0e-01', '8.3e-02', '2.5e-03', '2.1e-06'] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ramp(n)</C>, returning the function min(1, max(0, n(x − 1/2) + 1/2)), and <C>tail_spread(seq, dist, ns)</C>,
          the largest dist(seq(m), seq(n)) over all m, n in ns: a finite check of the Cauchy condition.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ramp(n):
    return lambda x: 0.0

def tail_spread(seq, dist, ns):
    return 0
`,
        solution: RAMP,
        tests: [
          { name: "ramp", code: `assert ramp(2)(0.5) == 0.5 and ramp(2)(0.0) == 0.0 and ramp(2)(1.0) == 1.0 and abs(ramp(2)(0.6) - 0.7) < 1e-12` },
          { name: "spread", code: `assert tail_spread(lambda n: (lambda x: 1 / n), lambda f, g: abs(f(0) - g(0)), [1, 2, 4]) == 0.75` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using fractions.Fraction, write <C>newton_sqrt2(k)</C>, the list of k + 1 exact iterates of x ↦ (x + 2/x)/2 from x = 1,
          and <C>gaps(xs)</C>, the successive absolute differences as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def newton_sqrt2(k):
    return [Fraction(1)]

def gaps(xs):
    return []
`,
        solution: NEWTON,
        tests: [
          { name: "newton", code: `assert [str(x) for x in newton_sqrt2(2)] == ['1', '3/2', '17/12']` },
          { name: "gaps", code: `from fractions import Fraction
assert gaps([Fraction(1), Fraction(3, 2), Fraction(5, 4)]) == [0.5, 0.25]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a closed subset F of a complete metric space X is complete.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes a Cauchy sequence in F and notes it is also Cauchy in X.",
          "Uses completeness of X to get a limit x ∈ X.",
          "Uses that F is closed (contains the limits of its convergent sequences) to conclude x ∈ F.",
        ],
      },
    },
    {
      key: "n",
      rung: "stretch",
      prompt: <p>d₁ between the ramp fₙ and the unit step at 1/2 is 1/(4n). What is the smallest n with this below 0.001?</p>,
      answer: { kind: "numeric", value: 251, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a complete metric space is, why ℚ is not complete, why closed subsets of complete spaces are complete, why C[a, b] is complete under the sup metric, and how steepening ramps show it is not complete under the integral metric.",

  glimpse: (
    <>
      <p>
        In a complete space, a map that shrinks every distance by a fixed factor has exactly one fixed point, and iterating
        the map finds it. That is the contraction mapping theorem, next.
      </p>
    </>
  ),
};
