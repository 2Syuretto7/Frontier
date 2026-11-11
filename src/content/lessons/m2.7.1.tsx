import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PartsViz } from "@/components/viz/PartsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.7.1",
  minutes: 60,
  links: {
    requires: ["m2.6.4", "m2.4.2"],
    foreshadows: ["m2.7.3", "m2.8.5"],
  },

  puzzle: (
    <>
      <p>
        Substitution handles <M>{"\\int x e^{x^2}\\,dx"}</M>, because x is, up to a constant, the derivative of the inside
        function. But <M>{"\\int x e^x\\,dx"}</M> has no inside function at all, and no substitution seems to help.
      </p>
      <p>
        Even simpler-looking: what is <M>{"\\int \\ln x\\,dx"}</M>? You know the derivative of ln x, but which function has ln
        x as its derivative?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Substitution reversed the chain rule. Integration by parts reverses the product rule,{" "}
        <M>{"(uv)' = u'v + uv'"}</M>. Integrating both sides says the two areas <M>{"\\int v\\,du"}</M> and{" "}
        <M>{"\\int u\\,dv"}</M> add up to the change in uv. The picture shows it: trace a curve with coordinates u and v, and
        the region under it and the region beside it fill a rectangle.
      </p>
      <PartsViz />
      <p>
        So if one of the two integrals is hard and the other easy, trade one for the other.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="integration by parts">
        <p>If u and v have continuous derivatives on <M>{"[a, b]"}</M>, then</p>
        <MD>{"\\int_a^b u(x)\\,v'(x)\\,dx = \\Bigl[u(x)\\,v(x)\\Bigr]_a^b - \\int_a^b u'(x)\\,v(x)\\,dx."}</MD>
        <p>In short: <M>{"\\int u\\,dv = uv - \\int v\\,du"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"uv"}</M> is an antiderivative of <M>{"u'v + uv'"}</M> by the product rule, so by the fundamental theorem,{" "}
          <M>{"\\int_a^b (u'v + uv')\\,dx = [uv]_a^b"}</M>. Split the integral and rearrange.
        </p>
      </Proof>

      <Example title="choosing u and dv">
        <ul>
          <li>
            <M>{"\\int x e^x\\,dx"}</M>: take <M>{"u = x"}</M>, <M>{"dv = e^x dx"}</M>. Then <M>{"du = dx"}</M>,{" "}
            <M>{"v = e^x"}</M>, and the integral is <M>{"x e^x - \\int e^x\\,dx = (x - 1)e^x + C"}</M>. Differentiating u
            made it simpler; integrating dv did not make it worse.
          </li>
          <li>
            <M>{"\\int \\ln x\\,dx"}</M>: take <M>{"u = \\ln x"}</M>, <M>{"dv = dx"}</M>. Then the integral is{" "}
            <M>{"x\\ln x - \\int x \\cdot \\frac1x\\,dx = x\\ln x - x + C"}</M>.
          </li>
          <li>
            <M>{"\\int x^2 \\sin x\\,dx"}</M> needs two rounds, each lowering the power of x by one.
          </li>
        </ul>
      </Example>

      <Example title="the integral that comes back">
        <p>
          For <M>{"I = \\int e^x \\sin x\\,dx"}</M>, two rounds of parts give{" "}
          <M>{"I = e^x \\sin x - e^x \\cos x - I"}</M>. The original integral reappears with a minus sign, so you can solve for
          it: <M>{"I = \\tfrac12 e^x(\\sin x - \\cos x) + C"}</M>.
        </p>
      </Example>

      <Remark title="reduction formulas">
        <p>
          For <M>{"I_n = \\int_0^1 x^n e^x\\,dx"}</M>, one round of parts gives <M>{"I_n = e - n I_{n-1}"}</M>, a recurrence
          that computes every <M>{"I_n"}</M> from <M>{"I_0 = e - 1"}</M>. Parts on <M>{"\\int_0^\\infty x^n e^{-x}\\,dx"}</M>{" "}
          gives the same pattern and leads to <M>{"n!"}</M>, as the lesson on improper integrals will show. And repeated parts
          is how Taylor&rsquo;s theorem gets its remainder.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "source",
      rung: "check",
      prompt: <p>Integration by parts comes from integrating which rule?</p>,
      answer: { kind: "choice", options: ["The product rule", "The chain rule", "The quotient rule"], correct: [0] },
    },
    {
      key: "choose",
      rung: "check",
      prompt: <p>For <M>{"\\int x e^x\\,dx"}</M>, which choice of u makes the new integral simpler?</p>,
      answer: { kind: "choice", options: ["u = x", "u = eˣ", "u = x eˣ"], correct: [0] },
    },
    {
      key: "xex",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^1 x e^x\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "lnx",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_1^e \\ln x\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "xsin",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^\\pi x\\sin x\\,dx"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 3.1416, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.linspace(0, 1, 200001)
print(round(np.trapezoid(x * np.exp(x), x), 4))`}</Code>
          <p>By parts, the integral of x eˣ from 0 to 1 is [x eˣ − eˣ] from 0 to 1. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.0, tolerance: 0.0001 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            By parts, the integral from 0 to 1 of xⁿeˣ is Iₙ = e − n·Iₙ₋₁, with I₀ = e − 1. Write <C>I(n)</C> using this recurrence.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def I(n):
    return math.e - 1
`,
        solution: `import math

def I(n):
    v = math.e - 1
    for k in range(1, n + 1):
        v = math.e - k * v
    return v
`,
        tests: [
          { name: "first", code: `assert abs(I(1) - 1) < 1e-12, 'I₁ = e − (e − 1) = 1.'` },
          { name: "third", code: `import numpy as np
x = np.linspace(0, 1, 400001)
assert abs(I(3) - np.trapezoid(x ** 3 * np.exp(x), x)) < 1e-6, 'Apply the recurrence n times.'` },
        ],
      },
    },
    {
      key: "esin",
      rung: "prove",
      prompt: (
        <p>
          Show that <M>{"\\int e^x \\sin x\\,dx = \\tfrac12 e^x(\\sin x - \\cos x) + C"}</M> using integration by parts twice,
          and check your answer by differentiating it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "First round: u = sin x, dv = eˣ dx (or the reverse), giving eˣ sin x − ∫ eˣ cos x dx.",
          "Second round on ∫ eˣ cos x dx, keeping the same roles, giving eˣ cos x + ∫ eˣ sin x dx.",
          "Combines to I = eˣ sin x − eˣ cos x − I and solves 2I = eˣ(sin x − cos x).",
          "Differentiates ½eˣ(sin x − cos x) by the product rule and gets eˣ sin x.",
        ],
      },
    },
    {
      key: "reduce",
      rung: "stretch",
      prompt: (
        <p>
          Using <M>{"I_n = e - n I_{n-1}"}</M> with <M>{"I_0 = e - 1"}</M>, find <M>{"I_2 = \\int_0^1 x^2 e^x\\,dx"}</M>. Give
          four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7183, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend how integration by parts comes from the product rule, how to choose u and dv, and how an integral can be solved by making it reappear.",

  glimpse: (
    <p>
      Next, partial fractions, which split a rational function into simple pieces with logarithms and arctangents as
      integrals. Integration by parts returns in the lesson on improper integrals, where it turns the integral of xⁿe⁻ˣ into
      n!, and in Taylor&rsquo;s theorem, whose remainder it produces.
    </p>
  ),
};
