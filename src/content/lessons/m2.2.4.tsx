import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { ApproachViz } from "@/components/viz/ApproachViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.2.4",
  minutes: 70,
  links: {
    revisits: ["m2.2.2", "m0.3.2"],
    foreshadows: ["m2.5.5", "m2.7.3"],
  },

  puzzle: (
    <>
      <p>
        A postal service charges by weight: up to 1 kg costs 40 rupees, and anything heavier, up to 2 kg, costs 60. As the
        weight of a parcel creeps up towards 1 kg, what does posting it cost? And as the weight comes down towards 1 kg from
        above?
      </p>
      <p>
        A second question. What happens to <M>{"1/x"}</M> as x approaches 0? Is &ldquo;infinity&rdquo; an answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The postage approaches 40 from one side and 60 from the other. There is no single limit at 1 kg, but there are two
        perfectly good <strong>one-sided</strong> limits. Many functions defined piece by piece behave like this, and so do
        functions like <M>{"\\sqrt{x}"}</M> that only make sense on one side of a point.
      </p>
      <p>
        As for <M>{"1/x"}</M>, its values near 0 grow beyond every bound. That is not a limit in the sense of the last two
        lessons, since no number L fits. But it is a very definite kind of behaviour, and we describe it by writing{" "}
        <M>{"\\infty"}</M>. Explore the four functions below.
      </p>
      <ApproachViz set="onesided" />
    </>
  ),

  theory: (
    <>
      <Definition title="one-sided limits">
        <p>
          <M>{"\\lim_{x \\to a^+} f(x) = L"}</M>, the limit from the right, means: for every <M>{"\\varepsilon > 0"}</M> there
          is a <M>{"\\delta > 0"}</M> such that <M>{"a < x < a + \\delta"}</M> implies <M>{"|f(x) - L| < \\varepsilon"}</M>.
          The limit from the left, <M>{"\\lim_{x \\to a^-} f(x)"}</M>, is the same with <M>{"a - \\delta < x < a"}</M>.
        </p>
      </Definition>

      <Theorem title="two sides make a limit">
        <p>
          <M>{"\\lim_{x \\to a} f(x) = L"}</M> if and only if both one-sided limits exist and equal L.
        </p>
      </Theorem>
      <p>
        One direction is immediate: the two-sided condition includes both one-sided ones. For the other, take the smaller of
        the two deltas.
      </p>

      <Example title="a jump">
        <p>
          For <M>{"f(x) = x/|x|"}</M>, every x &gt; 0 gives 1 and every x &lt; 0 gives <M>{"-1"}</M>. So{" "}
          <M>{"\\lim_{x \\to 0^+} f(x) = 1"}</M> and <M>{"\\lim_{x \\to 0^-} f(x) = -1"}</M>. They differ, so{" "}
          <M>{"\\lim_{x \\to 0} f(x)"}</M> does not exist. The postage function has a jump of the same kind at 1 kg.
        </p>
      </Example>

      <Definition title="infinite limits">
        <p>
          <M>{"\\lim_{x \\to a} f(x) = \\infty"}</M> means: for every number B there is a <M>{"\\delta > 0"}</M> such that{" "}
          <M>{"0 < |x - a| < \\delta"}</M> implies <M>{"f(x) > B"}</M>. Similarly for <M>{"-\\infty"}</M> (with{" "}
          <M>{"f(x) < B"}</M>) and for one-sided versions. The line <M>{"x = a"}</M> is then a{" "}
          <strong>vertical asymptote</strong> of the graph.
        </p>
      </Definition>

      <Remark title="infinity is not a number">
        <p>
          Writing <M>{"\\lim_{x \\to 0} 1/x^2 = \\infty"}</M> does not say the limit exists and equals a number called{" "}
          <M>{"\\infty"}</M>. It says, precisely, that the limit does not exist, and fails to in a particular way. The field
          axioms contain no <M>{"\\infty"}</M>, and the limit laws do not apply to it: <M>{"\\infty - \\infty"}</M> and{" "}
          <M>{"\\infty/\\infty"}</M> have no meaning.
        </p>
      </Remark>

      <Example title="from both sides">
        <p>
          <M>{"\\lim_{x \\to 0^+} 1/x = \\infty"}</M> and <M>{"\\lim_{x \\to 0^-} 1/x = -\\infty"}</M>: given B &gt; 0, take{" "}
          <M>{"\\delta = 1/B"}</M>, and then <M>{"0 < x < \\delta"}</M> gives <M>{"1/x > B"}</M>. Since the two sides
          disagree, we cannot write anything for the two-sided limit of <M>{"1/x"}</M>. For <M>{"1/x^2"}</M>, both sides go to{" "}
          <M>{"\\infty"}</M>, so <M>{"\\lim_{x \\to 0} 1/x^2 = \\infty"}</M>.
        </p>
      </Example>

      <Definition title="limits at infinity">
        <p>
          <M>{"\\lim_{x \\to \\infty} f(x) = L"}</M> means: for every <M>{"\\varepsilon > 0"}</M> there is a number N such
          that <M>{"x > N"}</M> implies <M>{"|f(x) - L| < \\varepsilon"}</M>. The line <M>{"y = L"}</M> is then a{" "}
          <strong>horizontal asymptote</strong>. The limit laws hold for limits at infinity too.
        </p>
      </Definition>

      <Example title="rational functions at infinity">
        <p>Divide top and bottom by the highest power of x on the bottom:</p>
        <MD>{"\\lim_{x \\to \\infty} \\frac{3x^2 + 1}{2x^2 - x} = \\lim_{x \\to \\infty} \\frac{3 + 1/x^2}{2 - 1/x} = \\frac{3}{2},"}</MD>
        <p>
          using <M>{"1/x \\to 0"}</M> and <M>{"1/x^2 \\to 0"}</M> as <M>{"x \\to \\infty"}</M>, which is the Archimedean
          property in disguise.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "postage",
      rung: "check",
      prompt: <p>In the postage puzzle, what is the limit of the cost as the weight approaches 1 kg from above?</p>,
      answer: { kind: "numeric", value: 60 },
    },
    {
      key: "two-sided",
      rung: "check",
      prompt: (
        <p>
          If <M>{"\\lim_{x \\to a^-} f(x) = 2"}</M> and <M>{"\\lim_{x \\to a^+} f(x) = 2"}</M>, and <M>{"f(a) = 5"}</M>, what
          is <M>{"\\lim_{x \\to a} f(x)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "infinity",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle\\lim_{x \\to \\infty} \\frac{5x^3 - x}{2x^3 + 4}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 2.5 },
    },
    {
      key: "asymptote",
      rung: "apply",
      prompt: (
        <p>
          What is <M>{"\\displaystyle\\lim_{x \\to 3^-} \\frac{1}{x - 3}"}</M>?
        </p>
      ),
      answer: { kind: "choice", options: ["∞", "−∞", "0", "it does not exist and is neither ∞ nor −∞"], correct: [1] },
    },
    {
      key: "lower",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\displaystyle\\lim_{x \\to \\infty} \\frac{x + 1}{x^2 + 1}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`for x in [0.1, 0.01, -0.01, -0.1]:
    print(x, 1 / x)`}</Code>
          <p>As x approaches 0 from the left, what does 1/x do?</p>
        </>
      ),
      answer: { kind: "choice", options: ["It tends to −∞", "It tends to +∞", "It tends to 0", "It tends to 1"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
f = lambda x: math.floor(x) + (x - math.floor(x)) ** 2
h = 1e-9
print(round(f(2 - h), 6), round(f(2 + h), 6), f(2))`}</Code>
          <p>One-sided limits at an integer of floor(x) + frac(x)². What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.0 2.0 2", "1.0 2.0 2", "2.0 2.0 4", "1.999998 2.0 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>one_sided(f, a)</C>, which returns (left, right): f evaluated at a − 10⁻⁹ and a + 10⁻⁹, as estimates of the one-sided limits.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def one_sided(f, a):
    return f(a), f(a)
`,
        solution: `def one_sided(f, a):
    return f(a - 1e-9), f(a + 1e-9)
`,
        tests: [
          { name: "step", code: `l, r = one_sided(lambda x: 1.0 if x >= 0 else 0.0, 0)
assert (l, r) == (0.0, 1.0), 'The step jumps at 0: the left limit is 0 and the right limit is 1.'` },
          { name: "abs over x", code: `l, r = one_sided(lambda x: abs(x) / x, 0)
assert (l, r) == (-1.0, 1.0), '|x|/x is −1 on the left and 1 on the right.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>classify(f, a)</C>, which inspects f near a using h = 10⁻ᵏ for k = 3 … 8 on both sides and returns one of <C>"continuous"</C> (both sides settle to f(a)), <C>"removable"</C> (both sides settle to the same value but not f(a), or f(a) raises an exception), <C>"jump"</C> (both sides settle to different values), <C>"infinite"</C> (|f| exceeds 10⁶ on some side at the smallest h) or <C>"oscillating"</C> (otherwise). A side settles if its last three values agree to within 10⁻⁴; take the limit as the last value.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def classify(f, a):
    return 'continuous'
`,
        solution: `def classify(f, a):
    hs = [10.0 ** -k for k in range(3, 9)]
    try:
        L = [f(a - h) for h in hs]
        Rv = [f(a + h) for h in hs]
    except (ZeroDivisionError, ValueError, OverflowError):
        return 'oscillating'
    if abs(L[-1]) > 1e6 or abs(Rv[-1]) > 1e6:
        return 'infinite'
    settled = lambda v: max(v[-3:]) - min(v[-3:]) < 1e-4
    if not (settled(L) and settled(Rv)):
        return 'oscillating'
    if abs(L[-1] - Rv[-1]) > 1e-4:
        return 'jump'
    try:
        fa = f(a)
    except (ZeroDivisionError, ValueError, OverflowError):
        return 'removable'
    return 'continuous' if abs(fa - L[-1]) < 1e-4 else 'removable'
`,
        tests: [
          { name: "continuous", code: `import math
assert classify(math.cos, 1) == 'continuous' and classify(lambda x: x * x, -2) == 'continuous', 'Polynomials and cosine are continuous.'` },
          { name: "removable", code: `import math
assert classify(lambda x: math.sin(x) / x, 0) == 'removable' and classify(lambda x: 5 if x == 1 else x, 1) == 'removable', 'A hole or a misplaced point.'` },
          { name: "jump", code: `import math
assert classify(math.floor, 3) == 'jump' and classify(lambda x: abs(x) / x if x else 0, 0) == 'jump', 'Floor jumps at integers.'` },
          { name: "infinite", code: `assert classify(lambda x: 1 / (x - 2), 2) == 'infinite' and classify(lambda x: 1 / (x * x) if x else 0, 0) == 'infinite', 'A vertical asymptote.'` },
          { name: "oscillating", code: `import math
assert classify(lambda x: math.sin(1 / x) if x else 0, 0) == 'oscillating', 'sin(1/x) never settles.'` },
        ],
      },
    },
    {
      key: "prove-infinite",
      rung: "prove",
      prompt: (
        <p>
          Prove from the definition that <M>{"\\lim_{x \\to 0} \\dfrac{1}{x^2} = \\infty"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Lets B be given; notes that only B > 0 needs work (for B ≤ 0 any δ works).",
          "Chooses δ = 1/√B.",
          "Shows that 0 < |x| < δ gives x² < 1/B and so 1/x² > B.",
        ],
      },
    },
    {
      key: "floor",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"\\lfloor x \\rfloor"}</M> be the greatest integer not exceeding x. At which real numbers a does{" "}
          <M>{"\\lim_{x \\to a} \\lfloor x \\rfloor"}</M> exist? Find both one-sided limits at an integer n, and justify your
          answers from the definitions.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "At a non-integer a, the function is constant on an interval around a, so the limit exists and equals ⌊a⌋.",
          "At an integer n, the right-hand limit is n and the left-hand limit is n − 1.",
          "Concludes the limit exists exactly at non-integers, with δ chosen as the distance to the nearest integer.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what one-sided limits are, how they decide whether a limit exists, and what it really means to write that a limit equals infinity.",

  glimpse: (
    <p>
      Infinite limits and limits at infinity are the raw material of two later lessons in this course: L&rsquo;Hôpital&rsquo;s
      rule, which tames forms like ∞/∞, and improper integrals, which measure areas that stretch off to infinity.
    </p>
  ),
};
