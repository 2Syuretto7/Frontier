import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { ImproperViz } from "@/components/viz/ImproperViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.7.3",
  minutes: 60,
  links: {
    requires: ["m2.6.3", "m2.2.4"],
    revisits: ["m2.7.1"],
    foreshadows: ["m7.3.1", "m2.8.2"],
  },

  puzzle: (
    <>
      <p>
        The region under <M>{"y = 1/x^2"}</M> to the right of <M>{"x = 1"}</M> stretches out for ever. The region under{" "}
        <M>{"y = 1/x"}</M> does too, and the two curves look almost the same: both fall towards 0.
      </p>
      <p>
        Can a region of infinite length have a finite area? And if one of these does, why not the other?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An integral over an infinite interval is not something you can compute in one go. Instead, compute the area up to a
        finite right end R, then let R grow and see whether the areas settle. Try the three curves below, and push R as far as
        it goes.
      </p>
      <ImproperViz />
      <p>
        Everything depends on how fast the curve falls. <M>{"1/x^2"}</M> falls fast enough for the tail to add only a finite
        amount; <M>{"1/x"}</M> does not, though it fails only just.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="improper integrals">
        <p>If f is continuous on <M>{"[a, \\infty)"}</M>, define</p>
        <MD>{"\\int_a^\\infty f(x)\\,dx = \\lim_{R \\to \\infty} \\int_a^R f(x)\\,dx"}</MD>
        <p>
          when the limit exists; the integral then <strong>converges</strong>, and otherwise it <strong>diverges</strong>.
          Likewise, if f is continuous on <M>{"(a, b]"}</M> but unbounded near a, define{" "}
          <M>{"\\int_a^b f = \\lim_{t \\to a^+} \\int_t^b f"}</M>. An integral over the whole line is split at a point, and both
          halves must converge.
        </p>
      </Definition>

      <Theorem title="p-integrals">
        <p>
          <M>{"\\int_1^\\infty \\frac{dx}{x^p}"}</M> converges exactly when <M>{"p > 1"}</M>, to <M>{"\\frac{1}{p - 1}"}</M>.{" "}
          <M>{"\\int_0^1 \\frac{dx}{x^p}"}</M> converges exactly when <M>{"p < 1"}</M>, to <M>{"\\frac{1}{1 - p}"}</M>.
        </p>
      </Theorem>
      <Remark title="why">
        <p>
          For <M>{"p \\ne 1"}</M>, <M>{"\\int_1^R x^{-p}\\,dx = \\frac{R^{1-p} - 1}{1 - p}"}</M>, which has a limit exactly when
          the power <M>{"1 - p"}</M> is negative. For <M>{"p = 1"}</M> the integral is <M>{"\\ln R"}</M>, which grows without
          bound. Near 0 the roles reverse: there, larger p means a steeper blow-up.
        </p>
      </Remark>

      <Theorem title="comparison">
        <p>
          If <M>{"0 \\le f(x) \\le g(x)"}</M> for <M>{"x \\ge a"}</M> and <M>{"\\int_a^\\infty g"}</M> converges, so does{" "}
          <M>{"\\int_a^\\infty f"}</M>. If <M>{"\\int_a^\\infty f"}</M> diverges, so does <M>{"\\int_a^\\infty g"}</M>.
        </p>
      </Theorem>
      <Remark title="why comparison works">
        <p>
          For non-negative f, the area up to R only grows with R, and it is bounded by the total area under g. A growing,
          bounded quantity has a limit: this is the completeness of the reals at work. For example,{" "}
          <M>{"e^{-x^2} \\le e^{-x}"}</M> for <M>{"x \\ge 1"}</M>, so <M>{"\\int_1^\\infty e^{-x^2}\\,dx"}</M> converges,
          although no formula gives its value.
        </p>
      </Remark>

      <Example title="the Gamma function">
        <p>
          For <M>{"s > 0"}</M>, the integral <M>{"\\Gamma(s) = \\int_0^\\infty x^{s-1} e^{-x}\\,dx"}</M> converges, because the
          exponential beats any power. <M>{"\\Gamma(1) = 1"}</M>, and integration by parts gives{" "}
          <M>{"\\Gamma(s + 1) = s\\,\\Gamma(s)"}</M>. So <M>{"\\Gamma(n + 1) = n!"}</M> for whole numbers n: the factorial,
          extended to every positive real.
        </p>
      </Example>

      <Remark title="probability">
        <p>
          A probability density is a non-negative function with total integral 1, usually over an infinite interval. The
          waiting time until a radioactive atom decays has density <M>{"\\lambda e^{-\\lambda x}"}</M> on{" "}
          <M>{"[0, \\infty)"}</M>, and its average value, <M>{"\\int_0^\\infty x \\lambda e^{-\\lambda x}\\,dx = 1/\\lambda"}</M>,
          is an improper integral. Some densities, such as <M>{"1/(\\pi(1 + x^2))"}</M>, have no average at all, because{" "}
          <M>{"\\int x/(1 + x^2)"}</M> diverges.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pinf",
      rung: "check",
      prompt: <p>For which p does <M>{"\\int_1^\\infty x^{-p}\\,dx"}</M> converge?</p>,
      answer: { kind: "choice", options: ["p > 1", "p ≥ 1", "p < 1", "every p > 0"], correct: [0] },
    },
    {
      key: "pzero",
      rung: "check",
      prompt: <p>Which of these converge? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["∫₀¹ 1/√x dx", "∫₀¹ 1/x dx", "∫₀¹ 1/x² dx", "∫₁^∞ 1/x² dx"],
        correct: [0, 3],
      },
    },
    {
      key: "cube",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_1^\\infty x^{-3}\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "sqrt",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^1 x^{-1/2}\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "xex",
      rung: "apply",
      prompt: <p>Evaluate <M>{"\\int_0^\\infty x e^{-x}\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "gamma",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\Gamma(s + 1) = s\\,\\Gamma(s)"}</M> for <M>{"s > 0"}</M>, where{" "}
          <M>{"\\Gamma(s) = \\int_0^\\infty x^{s-1}e^{-x}\\,dx"}</M>. Deduce that <M>{"\\Gamma(n + 1) = n!"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies integration by parts on [0, R] with u = xˢ and dv = e⁻ˣ dx.",
          "Shows the boundary term Rˢe⁻ᴿ − 0 tends to 0 as R → ∞ (exponential beats power), and is 0 at x = 0 since s > 0.",
          "Obtains Γ(s + 1) = s ∫₀^∞ xˢ⁻¹ e⁻ˣ dx = s Γ(s).",
          "Computes Γ(1) = 1 and uses induction to get Γ(n + 1) = n!.",
        ],
      },
    },
    {
      key: "mean",
      rung: "stretch",
      prompt: (
        <p>
          A waiting time has density <M>{"4e^{-4x}"}</M> for <M>{"x \\ge 0"}</M>. What is its mean,{" "}
          <M>{"\\int_0^\\infty x \\cdot 4e^{-4x}\\,dx"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25 },
    },
  ],

  teachBack:
    "Explain to a friend how an area that stretches to infinity can be finite, why ∫ 1/x² converges while ∫ 1/x does not, and how comparison decides harder cases.",

  glimpse: (
    <p>
      Next, the most important improper integral of all: the area under the bell curve <M>{"e^{-x^2}"}</M>, which has no
      antiderivative in familiar functions, yet equals exactly √π. The integral test, later in this course, uses p-integrals
      to decide which infinite sums converge, and Probability builds the theory of densities on them.
    </p>
  ),
};
