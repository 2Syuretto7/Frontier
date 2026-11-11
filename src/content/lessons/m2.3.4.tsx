import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { UniformViz } from "@/components/viz/UniformViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.3.4",
  minutes: 75,
  links: {
    revisits: ["m2.2.2", "m1.2.4"],
    foreshadows: ["m8.5.3", "m8.5.3", "m2.6.2"],
  },

  puzzle: (
    <>
      <p>
        A machine cuts metal rods, and the customer wants every rod within 1 mm of the length ordered. The cutting arm is
        positioned by a dial, and the length cut depends continuously on the dial setting. So for each order there is some
        precision of dial setting that guarantees the 1 mm tolerance.
      </p>
      <p>
        But is there one precision that works for every order, long rods and short alike? Or might some lengths need the dial
        set more and more finely, without limit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the definition of continuity at a point, <M>{"\\delta"}</M> is allowed to depend on both{" "}
        <M>{"\\varepsilon"}</M> and the point. Where the graph is steep, a narrower strip is needed. If one{" "}
        <M>{"\\delta"}</M> works at every point at once, the function is called <strong>uniformly continuous</strong>.
      </p>
      <p>
        Below, fix <M>{"\\varepsilon"}</M> and move the point <M>{"x_0"}</M>. The lower graph shows the largest{" "}
        <M>{"\\delta"}</M> that works at each point. Uniform continuity asks whether that graph stays above some positive
        level. For <M>{"1/x"}</M>, it sinks to 0.
      </p>
      <UniformViz />
    </>
  ),

  theory: (
    <>
      <Definition title="uniform continuity">
        <p>
          f is <strong>uniformly continuous</strong> on a set D if for every <M>{"\\varepsilon > 0"}</M> there is a{" "}
          <M>{"\\delta > 0"}</M> such that, for all x and y in D,
        </p>
        <MD>{"|x - y| < \\delta \\implies |f(x) - f(y)| < \\varepsilon."}</MD>
      </Definition>

      <Remark title="the order of the quantifiers">
        <p>Compare the two definitions in quantifier form.</p>
        <ul>
          <li>
            Continuous on D: <M>{"\\forall y \\in D\\ \\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x \\in D\\ \\ldots"}</M>
          </li>
          <li>
            Uniformly continuous on D: <M>{"\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall y \\in D\\ \\forall x \\in D\\ \\ldots"}</M>
          </li>
        </ul>
        <p>
          The only difference is where <M>{"\\forall y"}</M> stands. In the first, <M>{"\\delta"}</M> is chosen after y and
          may depend on it; in the second, it is chosen before, and must serve every y. This is exactly the lesson of nested
          quantifiers in Proof and Logic: swapping a &ldquo;for all&rdquo; past a &ldquo;there exists&rdquo; makes a stronger
          statement.
        </p>
      </Remark>

      <Example title="a uniformly continuous function">
        <p>
          <M>{"f(x) = x^2"}</M> on <M>{"[0, 3]"}</M>. For x, y in the interval,{" "}
          <M>{"|x^2 - y^2| = |x + y|\\,|x - y| \\le 6|x - y|"}</M>. So <M>{"\\delta = \\varepsilon / 6"}</M> works for every
          pair at once. The bound 6 on the steepness came from the interval being bounded.
        </p>
      </Example>

      <Example title="a continuous function that is not uniformly continuous">
        <p>
          <M>{"f(x) = 1/x"}</M> on <M>{"(0, 1]"}</M>. Take <M>{"\\varepsilon = 1"}</M>, and suppose some <M>{"\\delta > 0"}</M>{" "}
          worked. Choose a whole number n with <M>{"1/n < \\delta"}</M>, and let <M>{"x = 1/n"}</M>,{" "}
          <M>{"y = 1/(n + 1)"}</M>. Then <M>{"|x - y| < 1/n < \\delta"}</M>, but <M>{"|f(x) - f(y)| = 1"}</M>, which is not
          less than <M>{"\\varepsilon"}</M>. So no <M>{"\\delta"}</M> works.
        </p>
        <p>
          The same happens for <M>{"x^2"}</M> on the whole real line: far out, the graph is so steep that points{" "}
          <M>{"\\delta"}</M> apart have values that differ by more than 1, however small <M>{"\\delta"}</M> is.
        </p>
      </Example>

      <Theorem title="continuity on a closed interval is uniform">
        <p>
          If f is continuous on <M>{"[a, b]"}</M>, then f is uniformly continuous on <M>{"[a, b]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A sketch, to be completed in Real Analysis. Suppose not. Then for some <M>{"\\varepsilon > 0"}</M>, every{" "}
          <M>{"\\delta = 1/n"}</M> fails, at some pair <M>{"x_n, y_n"}</M> with <M>{"|x_n - y_n| < 1/n"}</M> but{" "}
          <M>{"|f(x_n) - f(y_n)| \\ge \\varepsilon"}</M>. The points <M>{"x_n"}</M> all lie in the bounded interval{" "}
          <M>{"[a, b]"}</M>, and a theorem of Bolzano and Weierstrass, proved from completeness, says they cluster around some
          point c of <M>{"[a, b]"}</M>, and so do the <M>{"y_n"}</M>. Then continuity at c forces{" "}
          <M>{"f(x_n)"}</M> and <M>{"f(y_n)"}</M> both close to <M>{"f(c)"}</M> for suitable n, and so close to each other,
          contradicting <M>{"|f(x_n) - f(y_n)| \\ge \\varepsilon"}</M>.
        </p>
      </Proof>

      <Remark title="why it matters">
        <p>
          Uniform continuity answers the rod-cutting puzzle: if the dial ranges over a closed interval, one precision suits
          every order. In this course its main use comes soon: it is the key to proving that every continuous function on a
          closed interval can be integrated.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "difference",
      rung: "check",
      prompt: <p>In uniform continuity, δ may depend on&hellip;</p>,
      answer: { kind: "choice", options: ["ε only", "the point only", "both ε and the point", "neither"], correct: [0] },
    },
    {
      key: "closed",
      rung: "check",
      prompt: <p>Which of these must be uniformly continuous? Choose all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["any continuous function on [0, 1]", "1/x on (0, 1]", "x² on the whole real line", "3x + 2 on the whole real line"],
        correct: [0, 3],
      },
    },
    {
      key: "linear",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"f(x) = 4x - 1"}</M> on the real line, what is the largest <M>{"\\delta"}</M> that works for every pair of
          points when <M>{"\\varepsilon = 0.2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.05, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: (
        <p>
          On <M>{"[0, 5]"}</M>, <M>{"|x^2 - y^2| \\le K|x - y|"}</M>. What is the smallest such K that comes from the method of
          the lesson?
        </p>
      ),
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "witness",
      rung: "apply",
      prompt: (
        <p>
          In the proof that <M>{"1/x"}</M> is not uniformly continuous on <M>{"(0, 1]"}</M>, the points{" "}
          <M>{"x = 1/n"}</M> and <M>{"y = 1/(n + 1)"}</M> are used. What is <M>{"|f(x) - f(y)|"}</M> for every n?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
for d in [0.1, 0.01, 0.001]:
    x = d
    print(abs(1 / x - 1 / (x + d)))`}</Code>
          <p>For f(x) = 1/x near 0, points a distance d apart can have values far apart. How do the printed gaps behave as d shrinks?</p>
        </>
      ),
      answer: { kind: "choice", options: ["They grow, so f is not uniformly continuous on (0, 1)", "They shrink to 0", "They stay the same", "They are all 0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x: 1 / x
for a in (1.0, 0.1, 0.01):
    print(round(f(a) - f(a + 0.001), 3))`}</Code>
          <p>The same gap 0.001 in x near different points for 1/x. What is the last value printed?</p>
        </>
      ),
      answer: { kind: "choice", options: ["9.091", "0.001", "0.099", "90.909"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>worst_gap(f, a, b, d, n)</C>: over n evenly spaced x in [a, b − d], return the largest |f(x + d) − f(x)|. For a uniformly continuous f this goes to 0 as d does.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def worst_gap(f, a, b, d, n=1000):
    return abs(f(a + d) - f(a))
`,
        solution: `def worst_gap(f, a, b, d, n=1000):
    xs = [a + (b - d - a) * k / (n - 1) for k in range(n)]
    return max(abs(f(x + d) - f(x)) for x in xs)
`,
        tests: [
          { name: "square", code: `assert abs(worst_gap(lambda x: x * x, 0, 1, 0.01) - (1 - 0.99 ** 2)) < 1e-9, 'For x² on [0, 1] the worst gap is at the right end.'` },
          { name: "reciprocal", code: `assert worst_gap(lambda x: 1 / x, 0.001, 1, 0.001) > 400, 'For 1/x near 0 the worst gap is large.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>needed_delta(f, a, b, eps, n)</C>, the largest δ from the list 2⁻¹, 2⁻², …, 2⁻⁴⁰ such that |f(x) − f(y)| &lt; ε for every pair of grid points x, y of [a, b] (n + 1 points) with |x − y| ≤ δ, or <C>None</C>. Use the fact that the worst gap within distance δ can be found with sliding windows. Then write <C>uniform_profile(f, a, b, eps)</C>, the list of <C>needed_delta</C> values on [a + 2⁻ᵏ, b] for k = 1 … 4 with n = 4000, which stays bounded away from 0 for a uniformly continuous f and shrinks for one like 1/x on (0, 1].
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def needed_delta(f, a, b, eps, n):
    return 0.5

def uniform_profile(f, a, b, eps):
    return [0.5] * 4
`,
        solution: `def worst(ys, w):
    best = 0.0
    for i in range(len(ys)):
        seg = ys[i:i + w + 1]
        best = max(best, max(seg) - min(seg))
    return best

def needed_delta(f, a, b, eps, n):
    h = (b - a) / n
    ys = [f(a + i * h) for i in range(n + 1)]
    for k in range(1, 41):
        d = 2.0 ** -k
        w = int(d / h + 1e-9)
        if worst(ys, w) < eps:
            return d
    return None

def uniform_profile(f, a, b, eps):
    return [needed_delta(f, a + 2.0 ** -k, b, eps, 4000) for k in range(1, 5)]
`,
        tests: [
          { name: "linear", code: `d = needed_delta(lambda x: 10 * x, 0, 1, 0.5, 1000)
assert d == 2 ** -5, '10δ < 0.5 needs δ < 0.05; the largest power of ½ is 1/32.'` },
          { name: "sine", code: `import math
prof = uniform_profile(math.sin, 0, 3, 0.1)
assert len(set(prof)) == 1, 'sin is uniformly continuous: δ does not depend on the interval.'` },
          { name: "reciprocal", code: `prof = uniform_profile(lambda x: 1 / x, 0, 1, 0.1)
assert all(a > b for a, b in zip(prof, prof[1:])), '1/x needs smaller and smaller δ near 0.'` },
        ],
      },
    },
    {
      key: "sqrt",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\sqrt{x}"}</M> is uniformly continuous on <M>{"[0, \\infty)"}</M>. (Hint: first show{" "}
          <M>{"|\\sqrt{x} - \\sqrt{y}| \\le \\sqrt{|x - y|}"}</M>.)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves the hint, for example by assuming x ≥ y and squaring √x ≤ √y + √(x − y).",
          "Chooses δ = ε².",
          "Concludes |x − y| < δ gives |√x − √y| < ε for all x, y ≥ 0.",
        ],
      },
    },
    {
      key: "square-line",
      rung: "stretch",
      prompt: (
        <p>
          Prove that <M>{"x^2"}</M> is not uniformly continuous on the real line. Explain in words what goes wrong, and why the
          theorem about closed intervals does not apply.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes ε = 1 and an arbitrary δ > 0.",
          "Chooses points such as x = n and y = n + δ/2 with n large, so that |x² − y²| = nδ + δ²/4 ≥ 1.",
          "Explains that the graph grows ever steeper, and that the real line is not a closed, bounded interval.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the difference between continuity and uniform continuity, using 1/x on (0, 1] as an example.",

  glimpse: (
    <p>
      This completes continuity. Next, derivatives: the slope of a curve at a point. Uniform continuity first earns its keep in the definite integral, later in this course. Real Analysis completes the proof sketched here, and Lipschitz continuity, a stronger cousin, controls how fast gradient descent can safely move in Optimisation for Deep Learning.
    </p>
  ),
};
