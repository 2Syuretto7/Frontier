import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Quote, Remark, Theorem } from "@/components/lesson/Blocks";
import { EpsDeltaViz } from "@/components/viz/EpsDeltaViz";
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
