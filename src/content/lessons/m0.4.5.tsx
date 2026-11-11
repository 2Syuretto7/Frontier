import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { CompoundingViz } from "@/components/viz/CompoundingViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.4.5",
  minutes: 70,
  links: {
    revisits: ["m0.4.1", "m0.4.3"],
    foreshadows: ["m8.2.2"],
  },

  puzzle: (
    <>
      <p>
        A generous bank offers 100 percent interest a year. Put in Rs 1, and after a year you have Rs 2. A rival bank offers
        the same rate but adds interest twice a year: 50 percent after six months, then 50 percent on the new balance. A
        third adds it every month, a twelfth of 100 percent each time.
      </p>
      <p>
        Which bank gives most? If a bank added interest every day, every second, every instant, would your rupee grow
        without limit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Twice a year gives <M>{"1.5^2 = 2.25"}</M>, because the second half-year earns interest on the first half&rsquo;s
        interest. Monthly gives <M>{"(1 + \\tfrac1{12})^{12} \\approx 2.613"}</M>. More frequent compounding always helps,
        but by less each time, and the totals do not grow without limit. They creep up towards a particular number,
        2.71828&hellip;, which Jacob Bernoulli met in exactly this question in 1683. It is now called <M>e</M>.
      </p>
      <CompoundingViz />
      <p>
        This number turns out to be the natural base for every kind of continuous growth, and the logarithm to base{" "}
        <M>e</M> is the one mathematicians use by default.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the number e">
        <p>
          The numbers <M>{"\\left(1 + \\tfrac1n\\right)^n"}</M> increase with <M>n</M> and stay below 3, and as <M>n</M>{" "}
          grows they approach a single real number, called <M>e</M>:
        </p>
        <MD>{"e = \\lim_{n \\to \\infty} \\left(1 + \\frac1n\\right)^n = 2.718281828459\\ldots"}</MD>
        <p>
          We take on trust here that the limit exists; it follows from the completeness of the reals and is proved in
          Analysis, where it is also shown that <M>{"e = 1 + 1 + \\tfrac1{2!} + \\tfrac1{3!} + \\cdots"}</M> and that{" "}
          <M>e</M> is irrational.
        </p>
      </Definition>

      <Proposition title="never less than 2">
        <p>For every whole number <M>{"n \\ge 1"}</M>, <M>{"\\left(1 + \\tfrac1n\\right)^n \\ge 2"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          In the growth lesson we saw that <M>{"(1 + p)^n \\ge 1 + np"}</M> for <M>{"p > 0"}</M>, since each of the{" "}
          <M>n</M> multiplications adds at least <M>p</M> times the starting amount. With <M>{"p = \\tfrac1n"}</M> this gives{" "}
          <M>{"(1 + \\tfrac1n)^n \\ge 1 + 1 = 2"}</M>.
        </p>
      </Proof>

      <Definition title="the natural logarithm">
        <p>
          The <strong>natural logarithm</strong> is the logarithm to base <M>e</M>, written <M>{"\\ln x = \\log_e x"}</M>.
          So <M>{"\\ln e = 1"}</M>, <M>{"\\ln 1 = 0"}</M>, and <M>{"e^{\\ln x} = x"}</M> for <M>{"x > 0"}</M>.
        </p>
      </Definition>

      <Theorem title="continuous compounding">
        <p>
          A principal <M>P</M> earning interest at rate <M>r</M> per year (for example <M>{"r = 0.05"}</M> for 5 percent),
          compounded <M>n</M> times a year for <M>t</M> years, grows to <M>{"P(1 + \\tfrac{r}{n})^{nt}"}</M>. As <M>n</M>{" "}
          grows without bound this approaches
        </p>
        <MD>{"P e^{rt}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"m = \\tfrac{n}{r}"}</M>. Then <M>{"(1 + \\tfrac{r}{n})^{nt} = \\left((1 + \\tfrac1m)^m\\right)^{rt}"}</M>.
          As <M>n</M> grows so does <M>m</M>, and the inner bracket approaches <M>e</M>. (That the power of a limit is the
          limit of the powers is a fact about continuity, proved in Calculus.)
        </p>
      </Proof>

      <p>
        Every exponential function can be written with base <M>e</M>: since <M>{"b = e^{\\ln b}"}</M>, we have{" "}
        <M>{"b^t = e^{t \\ln b}"}</M>. So growth by factor <M>b</M> per unit time is continuous growth at rate{" "}
        <M>{"k = \\ln b"}</M>, and decay has <M>{"k < 0"}</M>. Scientists write almost every growth law as{" "}
        <M>{"N(t) = N_0 e^{kt}"}</M> for this reason.
      </p>

      <Example title="the rule of 70, explained">
        <p>
          At continuous rate <M>r</M>, money doubles when <M>{"e^{rt} = 2"}</M>, that is, at <M>{"t = \\tfrac{\\ln 2}{r}"}</M>.
          Since <M>{"\\ln 2 \\approx 0.693"}</M>, the doubling time in years is about <M>70</M> divided by the percentage
          rate. For yearly compounding at a small rate the answer is nearly the same, because{" "}
          <M>{"\\ln(1 + r) \\approx r"}</M> when <M>r</M> is small: at 7 percent, <M>{"\\ln 1.07 \\approx 0.0677"}</M>.
        </p>
      </Example>

      <Remark title="why e is natural">
        <p>
          Among all the curves <M>{"y = b^x"}</M>, which all pass through <M>{"(0, 1)"}</M>, exactly one crosses with
          slope 1 there: the one with <M>{"b = e"}</M>. Calculus shows that the slope of <M>{"e^x"}</M> at every point equals
          its height, so <M>{"e^x"}</M> is the function whose rate of growth is itself. That property, not banking, is why{" "}
          <M>e</M> is everywhere in mathematics, from differential equations to probability, and why Euler&rsquo;s identity{" "}
          <M>{"e^{i\\pi} + 1 = 0"}</M> awaits you with the complex numbers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ln-power",
      rung: "check",
      prompt: <p>What is <M>{"\\ln(e^3)"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "twice",
      rung: "check",
      prompt: <p>Rs 1 at 100 percent a year, compounded twice a year. How many rupees after one year?</p>,
      answer: { kind: "numeric", value: 2.25 },
    },
    {
      key: "continuous",
      rung: "apply",
      prompt: <p>Rs 1000 grows at 5 percent a year, compounded continuously. How much is there after 10 years, to the nearest rupee?</p>,
      answer: { kind: "numeric", value: 1649, tolerance: 1 },
    },
    {
      key: "doubling",
      rung: "apply",
      prompt: <p>A population grows continuously at 2 percent a year. What is its doubling time in years, to one decimal place?</p>,
      answer: { kind: "numeric", value: 34.7, tolerance: 0.1 },
    },
    {
      key: "rewrite",
      rung: "apply",
      prompt: <p>Writing <M>{"5^t = e^{kt}"}</M>, what is <M>k</M>, to three decimal places?</p>,
      answer: { kind: "numeric", value: 1.609, tolerance: 0.001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`for n in [1, 10, 1000]:
    print(round((1 + 1 / n) ** n, 4))`}</Code>
          <p>Compounding n times a year at 100%. What is the last line printed?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2.7169, tolerance: 0.0001 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>e_series(n)</C>, the sum 1 + 1/1! + 1/2! + … + 1/n!, building each term from the previous one rather than computing factorials afresh.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def e_series(n):
    return 1 + 1 / n
`,
        solution: `def e_series(n):
    total, term = 1.0, 1.0
    for k in range(1, n + 1):
        term /= k
        total += term
    return total
`,
        tests: [
          { name: "few terms", code: `assert abs(e_series(0) - 1) < 1e-12 and abs(e_series(3) - (1 + 1 + 0.5 + 1 / 6)) < 1e-12, 'Each term is the previous one divided by k.'` },
          { name: "converges", code: `import math
assert abs(e_series(15) - math.e) < 1e-10, 'The series reaches e quickly.'` },
        ],
      },
    },
    {
      key: "bound",
      rung: "prove",
      prompt: (
        <p>
          Explain carefully why <M>{"(1 + \\tfrac{1}{n})^n \\ge 2"}</M> for every whole number <M>{"n \\ge 1"}</M>. Your
          argument should show why <M>{"(1 + p)^n \\ge 1 + np"}</M> for <M>{"p > 0"}</M>, not just quote it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains why (1 + p)ⁿ ≥ 1 + np, for instance step by step: each multiplication by (1 + p) adds p times the current amount, which is at least p.",
          "Substitutes p = 1/n.",
          "Concludes (1 + 1/n)ⁿ ≥ 1 + n · (1/n) = 2.",
        ],
      },
    },
    {
      key: "half-life",
      rung: "stretch",
      prompt: (
        <p>
          A substance decays as <M>{"N(t) = N_0 e^{-0.1t}"}</M>, with <M>t</M> in years. What is its half-life in years, to
          two decimal places?
        </p>
      ),
      answer: { kind: "numeric", value: 6.93, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend why compounding more and more often does not make your money grow without limit, and where the number e comes from.",

  glimpse: (
    <p>
      This completes exponentials and logarithms. In Calculus, <M>{"e^x"}</M> is the function equal to its own derivative,
      and it is rebuilt from its power series. Real Analysis proves that <M>{"(1 + \\tfrac1n)^n"}</M> converges by the
      monotone convergence theorem. In Numerical Linear Algebra and Scientific Computing, Euler&rsquo;s method grows a
      quantity in many small compounding steps, exactly as here, to solve equations of change on a computer.
    </p>
  ),
};
