import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Quote, Remark, Theorem } from "@/components/lesson/Blocks";
import { EpsDeltaViz } from "@/components/viz/EpsDeltaViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.2.2",
  minutes: 85,
  links: {
    revisits: ["m1.2.4", "m2.1.3"],
    foreshadows: ["m8.5.1"],
  },

  puzzle: (
    <>
      <p>
        &ldquo;f(x) gets as close to L as we like when x is close enough to a.&rdquo; This sounds clear until you try to use it.
        How close is &ldquo;as close as we like&rdquo;? How close is &ldquo;close enough&rdquo;? And who decides?
      </p>
      <p>
        Imagine a sceptic who doubts that <M>{"x^2 \\to 4"}</M> as <M>{"x \\to 2"}</M>. What exactly would you have to do to
        convince them, once and for all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Turn the definition into a game with two players. The sceptic names a tolerance, a small positive number{" "}
        <M>{"\\varepsilon"}</M> (epsilon): &ldquo;get f(x) within <M>{"\\varepsilon"}</M> of L.&rdquo; You reply with a
        positive number <M>{"\\delta"}</M> (delta): &ldquo;then take x within <M>{"\\delta"}</M> of a.&rdquo; You win the
        round if every such x, other than a itself, really does put f(x) within <M>{"\\varepsilon"}</M> of L. The limit is L
        if you can win every round, however small the sceptic makes <M>{"\\varepsilon"}</M>.
      </p>
      <p>
        Below, the shaded band is the sceptic&rsquo;s challenge and the grey strip is your reply. Make <M>{"\\varepsilon"}</M>{" "}
        small, then find a <M>{"\\delta"}</M> that keeps the thick part of the graph inside the band. Then try the jump.
      </p>
      <EpsDeltaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="limit">
        <p>
          Let f be defined on an open interval around a, except possibly at a itself. Then{" "}
          <M>{"\\lim_{x \\to a} f(x) = L"}</M> means: for every <M>{"\\varepsilon > 0"}</M> there is a{" "}
          <M>{"\\delta > 0"}</M> such that
        </p>
        <MD>{"0 < |x - a| < \\delta \\implies |f(x) - L| < \\varepsilon."}</MD>
        <p>
          The condition <M>{"0 < |x - a|"}</M> says <M>{"x \\ne a"}</M>: the value at a is never consulted. In quantifiers,{" "}
          <M>{"\\forall \\varepsilon > 0\\ \\exists \\delta > 0\\ \\forall x\\ (0 < |x - a| < \\delta \\Rightarrow |f(x) - L| < \\varepsilon)"}</M>.
          The order matters: <M>{"\\delta"}</M> is chosen after <M>{"\\varepsilon"}</M>, and may depend on it.
        </p>
      </Definition>

      <Quote source={<>George Berkeley, <cite>The Analyst</cite> (1734)</>}>
        <p>
          And what are these fluxions? The velocities of evanescent increments? And what are these same evanescent
          increments? They are neither finite quantities, nor quantities infinitely small, nor yet nothing. May we not call
          them the ghosts of departed quantities?
        </p>
      </Quote>
      <p>
        Berkeley&rsquo;s complaint against Newton&rsquo;s calculus was fair, and it took over a century to answer. The answer,
        due to Cauchy, Bolzano and above all Weierstrass, is the definition above: it speaks only of ordinary numbers{" "}
        <M>{"\\varepsilon"}</M> and <M>{"\\delta"}</M>, and of no quantity that is infinitely small.
      </p>

      <Example title="a straight line">
        <p>
          Claim: <M>{"\\lim_{x \\to 1} (2x + 1) = 3"}</M>. Scratch work first: we want{" "}
          <M>{"|(2x + 1) - 3| = 2|x - 1| < \\varepsilon"}</M>, which holds when <M>{"|x - 1| < \\varepsilon/2"}</M>. So the
          proof is: given <M>{"\\varepsilon > 0"}</M>, let <M>{"\\delta = \\varepsilon / 2"}</M>. If{" "}
          <M>{"0 < |x - 1| < \\delta"}</M>, then <M>{"|(2x + 1) - 3| = 2|x - 1| < 2\\delta = \\varepsilon"}</M>.
        </p>
      </Example>

      <Example title="a curve">
        <p>
          Claim: <M>{"\\lim_{x \\to 2} x^2 = 4"}</M>. In the last chapter you saw that if <M>{"|x - 2| < 1"}</M>, then{" "}
          <M>{"|x^2 - 4| = |x - 2|\\,|x + 2| < 5|x - 2|"}</M>. So given <M>{"\\varepsilon > 0"}</M>, let{" "}
          <M>{"\\delta = \\min(1, \\varepsilon/5)"}</M>. If <M>{"0 < |x - 2| < \\delta"}</M>, then{" "}
          <M>{"|x - 2| < 1"}</M>, so <M>{"|x^2 - 4| < 5|x - 2| < 5 \\cdot \\varepsilon/5 = \\varepsilon"}</M>. The first
          condition, <M>{"\\delta \\le 1"}</M>, keeps x where the crude bound <M>{"|x + 2| < 5"}</M> is valid.
        </p>
      </Example>

      <Remark title="how to show a limit fails">
        <p>
          Negate the definition, as you learnt to in Proof and Logic: <M>{"\\lim_{x \\to a} f(x) \\ne L"}</M> means there is
          some <M>{"\\varepsilon > 0"}</M> such that for every <M>{"\\delta > 0"}</M> there is an x with{" "}
          <M>{"0 < |x - a| < \\delta"}</M> but <M>{"|f(x) - L| \\ge \\varepsilon"}</M>. For the jump in the visualisation,{" "}
          <M>{"\\varepsilon = 1/2"}</M> defeats the claim that the limit is 2: however small <M>{"\\delta"}</M> is, the
          point <M>{"x = 1 - \\delta/2"}</M> has <M>{"f(x) = 1"}</M>.
        </p>
      </Remark>

      <Theorem title="limits are unique">
        <p>
          If <M>{"\\lim_{x \\to a} f(x) = L"}</M> and <M>{"\\lim_{x \\to a} f(x) = M"}</M>, then <M>{"L = M"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose <M>{"L \\ne M"}</M>, and let <M>{"\\varepsilon = |L - M|/2 > 0"}</M>. There are <M>{"\\delta_1"}</M> and{" "}
          <M>{"\\delta_2"}</M> that work for L and for M with this <M>{"\\varepsilon"}</M>. Pick any x with{" "}
          <M>{"0 < |x - a| < \\min(\\delta_1, \\delta_2)"}</M>. By the triangle inequality,
        </p>
        <MD>{"|L - M| \\le |L - f(x)| + |f(x) - M| < \\varepsilon + \\varepsilon = |L - M|,"}</MD>
        <p>which is impossible. So <M>{"L = M"}</M>, and we may speak of <em>the</em> limit.</p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "linear-delta",
      rung: "check",
      prompt: (
        <p>
          To prove <M>{"\\lim_{x \\to 1} (2x + 1) = 3"}</M>, the lesson chooses <M>{"\\delta = \\varepsilon/2"}</M>. What is{" "}
          <M>{"\\delta"}</M> when <M>{"\\varepsilon = 0.03"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.015, tolerance: 0.0001 },
    },
    {
      key: "order",
      rung: "check",
      prompt: <p>In the definition of a limit, which is chosen first?</p>,
      answer: { kind: "choice", options: ["δ, then ε", "ε, then δ", "x, then ε", "it does not matter"], correct: [1] },
    },
    {
      key: "five",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"\\lim_{x \\to 2} (5x - 3) = 7"}</M>, what is the largest <M>{"\\delta"}</M> that works when{" "}
          <M>{"\\varepsilon = 0.1"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.02, tolerance: 0.0001 },
    },
    {
      key: "square-delta",
      rung: "apply",
      prompt: (
        <p>
          Using <M>{"\\delta = \\min(1, \\varepsilon / 5)"}</M> for <M>{"\\lim_{x \\to 2} x^2 = 4"}</M>, what is{" "}
          <M>{"\\delta"}</M> when <M>{"\\varepsilon = 10"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "negation",
      rung: "apply",
      prompt: (
        <p>
          Which statement says that <M>{"\\lim_{x \\to a} f(x) \\ne L"}</M>?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "For every ε > 0 and every δ > 0, every x with 0 < |x − a| < δ has |f(x) − L| ≥ ε.",
          "There is an ε > 0 such that for every δ > 0, some x with 0 < |x − a| < δ has |f(x) − L| ≥ ε.",
          "There is a δ > 0 such that for every ε > 0, |f(x) − L| ≥ ε.",
          "f(a) ≠ L.",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`eps = 0.01
delta = eps / 3
xs = [2 + delta * t for t in (-0.99, -0.5, 0.5, 0.99)]
print(all(abs((3 * x + 1) - 7) < eps for x in xs))`}</Code>
          <p>This tests the limit of 3x + 1 as x → 2. What does it print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`eps = 0.01
delta = min(1, eps / 7)
xs = [3 + delta * k / 100 for k in range(-99, 100)]
print(round(delta, 6), all(abs(x * x - 9) < eps for x in xs), abs((3 + 2 * delta) ** 2 - 9) < eps)`}</Code>
          <p>δ = min(1, ε/7) for x² → 9 at 3. Does it work inside the δ-window, and outside it?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.001429 True False", "0.001429 True True", "0.001429 False False", "0.01 True True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            For f(x) = x² near a = 3 with limit 9, a working choice is δ = min(1, ε/7). Write <C>delta_for(eps)</C> that returns it, and <C>check(eps)</C> that returns <C>True</C> when every one of 1000 evenly spread points with 0 &lt; |x − 3| &lt; δ has |x² − 9| &lt; ε.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def delta_for(eps):
    return eps

def check(eps):
    return True
`,
        solution: `def delta_for(eps):
    return min(1, eps / 7)

def check(eps):
    d = delta_for(eps)
    xs = [3 + d * (k / 500 - 1) * 0.999 for k in range(1001) if k != 500]
    return all(abs(x * x - 9) < eps for x in xs)
`,
        tests: [
          { name: "delta", code: `assert abs(delta_for(0.7) - 0.1) < 1e-12 and delta_for(70) == 1, 'δ = min(1, ε/7).'` },
          { name: "works", code: `assert all(check(e) for e in (5, 1, 0.1, 1e-4)), 'Every tested x should satisfy |x² − 9| < ε.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>find_delta(f, a, L, eps)</C>, an automatic search for a δ that works in the ε–δ definition: start at δ = 1 and halve it until every sample x = a ± δ·k/200 for k = 1 … 200 satisfies |f(x) − L| &lt; ε, giving up and returning <C>None</C> after 60 halvings. Then write <C>check_limit(f, a, L)</C>, which returns <C>True</C> when <C>find_delta</C> succeeds for ε = 10⁻¹, 10⁻², …, 10⁻⁶.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def find_delta(f, a, L, eps):
    return 1.0

def check_limit(f, a, L):
    return True
`,
        solution: `def find_delta(f, a, L, eps):
    d = 1.0
    for _ in range(61):
        if all(abs(f(a + s * d * k / 200) - L) < eps for k in range(1, 201) for s in (1, -1)):
            return d
        d /= 2
    return None

def check_limit(f, a, L):
    return all(find_delta(f, a, L, 10.0 ** -j) is not None for j in range(1, 7))
`,
        tests: [
          { name: "square", code: `d = find_delta(lambda x: x * x, 3, 9, 0.01)
assert d is not None and d <= 0.01 / 6 and all(abs((3 + t) ** 2 - 9) < 0.01 for t in [d * k / 200 for k in range(-200, 201)]), 'Halve until the window works.'` },
          { name: "good", code: `import math
assert check_limit(lambda x: x * x, 3, 9) and check_limit(lambda x: math.sin(x) / x, 0, 1), 'These limits are correct.'` },
          { name: "wrong limit", code: `assert not check_limit(lambda x: x * x, 3, 9.001), 'A wrong L fails once ε is small.'` },
          { name: "jump", code: `assert find_delta(lambda x: 1 if x > 0 else 0, 0, 1, 0.5) is None, 'A jump has no limit.'` },
        ],
      },
    },
    {
      key: "prove-square",
      rung: "prove",
      prompt: (
        <p>
          Prove from the definition that <M>{"\\lim_{x \\to 3} x^2 = 9"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Factorises |x² − 9| = |x − 3| |x + 3|.",
          "Restricts to |x − 3| < 1 to get |x + 3| < 7.",
          "Chooses δ = min(1, ε/7) or similar.",
          "Checks that 0 < |x − 3| < δ gives |x² − 9| < ε.",
        ],
      },
    },
    {
      key: "reciprocal",
      rung: "stretch",
      prompt: (
        <p>
          Prove from the definition that <M>{"\\lim_{x \\to 2} \\dfrac{1}{x} = \\dfrac{1}{2}"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes |1/x − 1/2| = |x − 2| / (2|x|).",
          "Restricts to |x − 2| < 1 to get |x| > 1, so the expression is less than |x − 2| / 2.",
          "Chooses δ = min(1, 2ε) or similar, and checks the conclusion.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the epsilon-delta definition of a limit as a game between a sceptic and a prover, and show how to win it for 2x + 1 near 1.",

  glimpse: (
    <p>
      This definition, with its alternating quantifiers, is the model for every precise definition in analysis. Next come the limit laws, which spare you from running the game by hand for every new function. In Multivariable and Matrix Calculus the absolute value is replaced by the length of a vector, and the same game defines limits and continuity in any number of dimensions.
    </p>
  ),
};
