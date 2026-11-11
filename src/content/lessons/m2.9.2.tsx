import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { C } from "@/components/lesson/Code";
import { DiffErrorViz } from "@/components/viz/DiffErrorViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.9.2",
  minutes: 60,
  links: {
    requires: ["m2.9.1"],
    revisits: ["m2.4.1"],
    foreshadows: ["l3.2.4", "e5.4.1", "m11.1.2"],
  },

  puzzle: (
    <>
      <p>
        You have written the backward pass of a new neural network layer by hand, and want to check it. The definition of the
        derivative suggests computing <M>{"(f(x + h) - f(x))/h"}</M> for a small h and comparing.
      </p>
      <p>
        So you try <M>{"h = 10^{-4}"}</M>, then <M>{"10^{-8}"}</M>, then <M>{"10^{-12}"}</M>, expecting ever better estimates.
        The second is better than the first. The third is no better than the first, and often worse. Smaller h should be closer to the limit. What went wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two errors pull in opposite directions. The formula is only an approximation, and Taylor&rsquo;s theorem says its
        error shrinks with h. But a computer stores numbers to about 16 significant digits, and subtracting two nearly equal
        values of f, then dividing by a tiny h, magnifies the rounding. The plot shows both, on log scales.
      </p>
      <DiffErrorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="finite differences">
        <p>
          The <strong>forward difference</strong> is <M>{"D_+(h) = \\dfrac{f(x + h) - f(x)}{h}"}</M> and the{" "}
          <strong>central difference</strong> is <M>{"D_0(h) = \\dfrac{f(x + h) - f(x - h)}{2h}"}</M>.
        </p>
      </Definition>

      <Theorem title="truncation errors">
        <p>If f is smooth enough near x, then as <M>{"h \\to 0"}</M>,</p>
        <MD>{"D_+(h) = f'(x) + \\tfrac12 f''(x)\\,h + O(h^2), \\qquad D_0(h) = f'(x) + \\tfrac16 f'''(x)\\,h^2 + O(h^4)."}</MD>
      </Theorem>
      <Remark title="where they come from">
        <p>
          Expand <M>{"f(x \\pm h) = f(x) \\pm f'(x)h + \\tfrac12 f''(x)h^2 \\pm \\tfrac16 f'''(x)h^3 + \\dots"}</M>. The forward
          difference keeps the <M>{"h^2"}</M> term, which becomes an error of order h after dividing. In the central difference
          the even powers cancel in the subtraction, leaving an error of order <M>{"h^2"}</M>, for one extra evaluation of f.
        </p>
      </Remark>

      <Theorem title="the rounding trade-off">
        <p>
          If each value of f is computed with relative error about ε (around <M>{"10^{-16}"}</M> in double precision), the
          difference quotient carries a rounding error of about <M>{"\\varepsilon|f|/h"}</M>. The total error of the forward
          difference is roughly
        </p>
        <MD>{"\\tfrac12|f''|\\,h + \\frac{\\varepsilon|f|}{h},"}</MD>
        <p>
          which is smallest near <M>{"h \\approx \\sqrt{\\varepsilon} \\approx 10^{-8}"}</M>, giving about 8 correct digits.
          For the central difference the best h is near <M>{"\\varepsilon^{1/3} \\approx 10^{-5}"}</M>, giving about 10 or 11
          digits.
        </p>
      </Theorem>

      <Example title="gradient checking">
        <p>
          Deep learning frameworks compute exact derivatives by the chain rule, but hand-written backward passes still need
          testing. The standard check compares them with central differences at <M>{"h \\approx 10^{-5}"}</M> in double
          precision, and reports the relative difference. In 32-bit floats, ε is about <M>{"10^{-7}"}</M>, the best attainable
          accuracy is far worse, and gradient checks done in low precision give misleading failures.
        </p>
      </Example>

      <Remark title="other everyday approximations">
        <p>
          <M>{"\\ln(1 + x) \\approx x"}</M> and <M>{"e^x - 1 \\approx x"}</M> for small x are first-order Taylor
          approximations. Computing <M>{"\\ln(1 + x)"}</M> naively for <M>{"x = 10^{-17}"}</M> gives 0, because{" "}
          <M>{"1 + x"}</M> rounds to 1; library functions <C>log1p</C> and <C>expm1</C> exist to avoid exactly this loss.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>How does the truncation error of the central difference scale with h?</p>,
      answer: { kind: "choice", options: ["Like h²", "Like h", "Like h⁴", "It does not depend on h"], correct: [0] },
    },
    {
      key: "why",
      rung: "check",
      prompt: <p>Why does the error grow again when h becomes very small?</p>,
      answer: {
        kind: "choice",
        options: ["Rounding: the difference of two nearly equal values is dominated by rounding error, then divided by a tiny h", "The Taylor series stops converging", "The derivative changes"],
        correct: [0],
      },
    },
    {
      key: "fwd",
      rung: "apply",
      prompt: <p>Compute the forward difference of <M>{"f(x) = x^2"}</M> at <M>{"x = 3"}</M> with <M>{"h = 0.1"}</M>.</p>,
      answer: { kind: "numeric", value: 6.1, tolerance: 0.0001 },
    },
    {
      key: "ctr",
      rung: "apply",
      prompt: <p>Compute the central difference of <M>{"f(x) = x^3"}</M> at <M>{"x = 1"}</M> with <M>{"h = 0.1"}</M>.</p>,
      answer: { kind: "numeric", value: 3.01, tolerance: 0.0001 },
    },
    {
      key: "besth",
      rung: "apply",
      prompt: (
        <p>
          With <M>{"\\varepsilon = 10^{-16}"}</M>, the best step for a forward difference is about <M>{"\\sqrt\\varepsilon = 10^k"}</M>.
          What is k?
        </p>
      ),
      answer: { kind: "numeric", value: -8 },
    },
    {
      key: "derive",
      rung: "prove",
      prompt: (
        <p>
          Using Taylor expansions of <M>{"f(x + h)"}</M> and <M>{"f(x - h)"}</M>, show that{" "}
          <M>{"D_0(h) = f'(x) + \\tfrac16 f'''(x)h^2 + O(h^4)"}</M> for a smooth f. Then explain why the error of{" "}
          <M>{"D_0"}</M> applied to any quadratic is exactly 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes both expansions up to the h⁵ term (or with an O(h⁵) remainder).",
          "Subtracts: the even-power terms cancel, leaving 2f′h + (1/3)f‴h³ + O(h⁵).",
          "Divides by 2h to get the stated formula.",
          "Notes a quadratic has f‴ = 0 and all higher derivatives zero, so every error term vanishes.",
        ],
      },
    },
    {
      key: "richardson",
      rung: "stretch",
      prompt: (
        <p>
          Since <M>{"D_+(h) = f' + Ch + O(h^2)"}</M>, the combination <M>{"2D_+(h/2) - D_+(h)"}</M> cancels the error of order
          h. Compute it for <M>{"f(x) = x^2"}</M> at <M>{"x = 3"}</M> with <M>{"h = 0.1"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a smaller step does not always give a better numerical derivative, and why the central difference is more accurate than the forward one.",

  glimpse: (
    <p>
      Next, Stirling&rsquo;s formula, an asymptotic approximation to n! that turns counting problems into calculus. Neural
      Networks from Scratch and Build a Deep Learning Framework use central differences to check every backward pass, and
      Numerical Linear Algebra and Scientific Computing explains floating-point rounding in full.
    </p>
  ),
};
