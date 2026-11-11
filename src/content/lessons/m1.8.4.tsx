import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DartsViz } from "@/components/viz/DartsViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.8.4",
  minutes: 60,
  links: {
    revisits: ["m1.8.2", "m1.8.3"],
    parallels: ["m0.8.3"],
    foreshadows: ["m7.3.1", "m18.1.1", "m18.1.3"],
  },

  puzzle: (
    <>
      <p>
        A spinner stops at a random point of a circle whose rim is marked from 0 to 1, every point equally likely. What is
        the probability that it stops at exactly 0.5?
      </p>
      <p>
        Suppose the answer were some positive number <M>p</M>, the same for every point. How many points would you need to
        list before their probabilities added up to more than 1? So what must <M>p</M> be? And yet the spinner always stops
        somewhere. How can every outcome have probability zero?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If each point had probability <M>p &gt; 0</M>, then any <M>{"\\lceil 2/p \\rceil"}</M> different points would
        already have total probability above 1, which is impossible. So each single point has probability 0. What has
        positive probability is a <em>stretch</em> of the rim: landing between 0.4 and 0.6 has probability 0.2, its length.
      </p>
      <p>
        Throw random darts at the interval from 0 to 1 and count those landing in a window around 0.5. Then shrink the
        window.
      </p>
      <DartsViz />
      <p>
        The fraction of hits tracks the width of the window, and as the window closes in on the single point 0.5, it falls
        towards 0. This is no paradox, but it does mean that probability on an interval cannot work by adding up the
        probabilities of points. The reason is the cardinality of the last two lessons.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="discrete probability">
        <p>
          On a finite or countable set <M>S</M>, a probability distribution can be given by weights{" "}
          <M>{"p(x) \\ge 0"}</M>, one for each point, with <M>{"\\sum_{x \\in S} p(x) = 1"}</M>. The probability of any
          subset is the sum of the weights of its points:
        </p>
        <MD>{"P(A) = \\sum_{x \\in A} p(x)."}</MD>
        <p>
          This works for countable sets too. For example, <M>{"p(n) = (1/2)^n"}</M> for <M>{"n = 1, 2, 3, \\ldots"}</M> is
          a distribution on the natural numbers, since the geometric series sums to 1.
        </p>
      </Definition>

      <Theorem title="few points can carry probability">
        <p>
          For any probability on any set, at most countably many points have positive probability.
        </p>
      </Theorem>
      <Proof>
        <p>
          For each natural number <M>n</M>, let <M>{"A_n"}</M> be the set of points whose probability is at least{" "}
          <M>{"1/n"}</M>. If <M>{"A_n"}</M> had more than <M>n</M> points, those points would have total probability more
          than <M>{"n \\cdot \\tfrac{1}{n} = 1"}</M>, which is impossible. So each <M>{"A_n"}</M> is finite. Every point
          with positive probability <M>q</M> lies in <M>{"A_n"}</M> for any <M>{"n \\ge 1/q"}</M>, so the set of such points
          is the union <M>{"A_1 \\cup A_2 \\cup \\cdots"}</M>, a countable union of finite sets, which is countable.
        </p>
      </Proof>

      <p>
        So on an uncountable set such as <M>{"[0, 1]"}</M>, all but countably many points have probability 0, and a
        distribution that treats all points alike must give every point probability 0. Weights on points cannot describe it.
      </p>

      <Definition title="the uniform distribution on an interval">
        <p>
          The <strong>uniform distribution</strong> on <M>{"[0, 1]"}</M> gives each interval a probability equal to its
          length:
        </p>
        <MD>{"P\\big([a, b]\\big) = b - a \\quad \\text{for } 0 \\le a \\le b \\le 1."}</MD>
        <p>
          A single point is the interval <M>{"[a, a]"}</M>, of length 0. Probabilities of more complicated sets are built
          from intervals using <strong>countable additivity</strong>: if <M>{"A_1, A_2, \\ldots"}</M> are disjoint, then{" "}
          <M>{"P(A_1 \\cup A_2 \\cup \\cdots) = P(A_1) + P(A_2) + \\cdots"}</M>.
        </p>
      </Definition>

      <Example title="the rationals have probability zero">
        <p>
          The rational numbers in <M>{"[0, 1]"}</M> are countable, so they can be listed as{" "}
          <M>{"q_1, q_2, \\ldots"}</M>. By countable additivity their probability is{" "}
          <M>{"0 + 0 + \\cdots = 0"}</M>. A uniformly random number is, with probability 1, irrational, although the
          rationals are dense: between any two numbers there is a rational.
        </p>
      </Example>

      <Remark title="why additivity stops at countable">
        <p>
          The interval <M>{"[0, 1]"}</M> is the union of its points, each of probability 0, yet its probability is 1. If
          additivity held for <em>uncountable</em> unions, this would read <M>{"1 = 0"}</M>. So probability theory allows
          countable sums and no more, and Cantor&rsquo;s distinction between countable and uncountable is exactly the line
          it draws. Two more lessons follow from this. Probability 0 does not mean impossible: every outcome of the spinner
          had probability 0. And for continuous quantities, a model gives a <em>density</em>, whose integral over a set is the
          probability, rather than probabilities of points. When a model outputs a real number, such as a predicted
          temperature, its &ldquo;likelihood&rdquo; is a density. Measure-Theoretic Probability shows that, with the
          axiom of choice, some sets are so strange that no probability can be assigned to them at all, which is why
          probability is defined only on a chosen family of sets.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "point",
      rung: "check",
      prompt: <p><M>X</M> is uniform on <M>{"[0, 1]"}</M>. What is <M>{"P(X = 0.3)"}</M>?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "interval",
      rung: "check",
      prompt: <p><M>X</M> is uniform on <M>{"[0, 1]"}</M>. What is <M>{"P(0.2 \\le X \\le 0.45)"}</M>?</p>,
      answer: { kind: "numeric", value: 0.25 },
    },
    {
      key: "geometric",
      rung: "apply",
      prompt: (
        <p>
          A natural number <M>N</M> has <M>{"P(N = n) = (1/2)^n"}</M> for <M>{"n = 1, 2, 3, \\ldots"}</M>. What is the
          probability that <M>N</M> is even? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.002 },
    },
    {
      key: "rational",
      rung: "apply",
      prompt: <p><M>X</M> is uniform on <M>{"[0, 1]"}</M>. What is the probability that <M>X</M> is rational?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "atmost",
      rung: "apply",
      prompt: <p>For a probability on some set, at most how many points can each have probability at least 0.01?</p>,
      answer: { kind: "numeric", value: 100 },
    },
    {
      key: "countable",
      rung: "prove",
      prompt: (
        <p>
          Prove that for any probability on any set, the set of points with positive probability is countable. Then explain
          why this means the uniform distribution on <M>{"[0, 1]"}</M> cannot be described by giving each point a weight.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines A_n as the set of points with probability at least 1/n and shows A_n has at most n points, since otherwise the total would exceed 1.",
          "Notes that every point with positive probability lies in some A_n.",
          "Concludes the set is a countable union of finite sets, hence countable.",
          "Argues that the uniform distribution treats all points alike, so if one had positive weight, uncountably many would, which is impossible; hence every weight is 0, and weights summing to 0 cannot give total probability 1.",
        ],
      },
    },
    {
      key: "intervals",
      rung: "stretch",
      prompt: (
        <p>
          <M>X</M> is uniform on <M>{"[0, 1]"}</M>. What is the probability that <M>X</M> lies in one of the disjoint intervals{" "}
          <M>{"[0, \\tfrac12), [\\tfrac34, \\tfrac78), [\\tfrac{15}{16}, \\tfrac{31}{32}), \\ldots"}</M>, where each interval
          is a quarter of the length of the one before? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.667, tolerance: 0.002 },
    },
  ],

  teachBack:
    "Explain to a friend why a uniformly random number between 0 and 1 hits any particular value with probability zero, why probability can add up countably many pieces but not uncountably many, and what this has to do with Cantor.",

  glimpse: (
    <p>
      This completes Proof and Logic. In Probability you will meet densities, the right tool for continuous quantities, and
      Measure-Theoretic Probability builds the whole subject on sigma-algebras and Lebesgue measure, the rigorous version of
      &ldquo;probability equals length&rdquo;.
    </p>
  ),
};
