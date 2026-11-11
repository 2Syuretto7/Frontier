import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SequenceViz } from "@/components/viz/SequenceViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.7.1",
  minutes: 70,
  links: {
    revisits: ["m0.2.2", "m0.4.1"],
    foreshadows: ["m2.8.1", "m2.8.2", "m4.2.2"],
  },

  puzzle: (
    <>
      <p>
        A legend about the invention of chess in India: the king offered the inventor any reward he liked. He asked for one
        grain of rice on the first square of the board, two on the second, four on the third, and so on, doubling each time
        to the sixty-fourth square. The king laughed at so modest a request. Should he have?
      </p>
      <p>
        A second, gentler question: what is <M>{"1 + 2 + 3 + \\cdots + 100"}</M>? There is a way to find it in your head in
        a few seconds.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two kinds of steady pattern run through this chapter. In one, you <em>add</em> the same amount each time:{" "}
        <M>{"1, 2, 3, \\ldots"}</M> or <M>{"5, 8, 11, \\ldots"}</M>. In the other, you <em>multiply</em> by the same amount:{" "}
        <M>{"1, 2, 4, 8, \\ldots"}</M>. The first grows in a straight line; the second, as the growth chapter showed,
        eventually leaves any straight line behind. The rice on the chessboard comes to{" "}
        <M>{"2^{64} - 1"}</M> grains, about eighteen billion billion: roughly a thousand years of the whole world&rsquo;s present rice harvest.
      </p>
      <p>
        For <M>{"1 + 2 + \\cdots + 100"}</M>, pair the first term with the last, the second with the second-last, and so
        on: fifty pairs, each adding to 101, so 5050. The story goes that the young Carl Friedrich Gauss did exactly this
        when his teacher set the sum to keep the class busy.
      </p>
      <SequenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sequences">
        <p>
          A <strong>sequence</strong> is a list of numbers <M>{"a_1, a_2, a_3, \\ldots"}</M> in order, one for each whole
          number <M>n</M>; formally, a function from the positive whole numbers to the reals. It is{" "}
          <strong>arithmetic</strong> if each term is the previous one plus a fixed <strong>common difference</strong>{" "}
          <M>d</M>, and <strong>geometric</strong> if each term is the previous one times a fixed{" "}
          <strong>common ratio</strong> <M>r</M>. Then
        </p>
        <MD>{"a_n = a_1 + (n-1)d \\qquad \\text{or} \\qquad a_n = a_1 r^{\\,n-1}."}</MD>
      </Definition>

      <Theorem title="the arithmetic sum">
        <p>The sum of the first <M>n</M> terms of an arithmetic sequence is</p>
        <MD>{"S_n = \\frac{n}{2}\\,(a_1 + a_n) = \\frac{n}{2}\\big(2a_1 + (n-1)d\\big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write the sum forwards and backwards and add the two, term by term. Each pair <M>{"a_k + a_{n+1-k}"}</M> equals{" "}
          <M>{"a_1 + a_n"}</M>, since moving one step in from each end adds <M>d</M> to one term and takes it from the other.
          There are <M>n</M> pairs, so <M>{"2S_n = n(a_1 + a_n)"}</M>.
        </p>
      </Proof>

      <Theorem title="the geometric sum">
        <p>If <M>{"r \\neq 1"}</M>, the sum of the first <M>n</M> terms of a geometric sequence is</p>
        <MD>{"S_n = a_1 \\,\\frac{1 - r^n}{1 - r}."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"S_n = a_1 + a_1 r + \\cdots + a_1 r^{n-1}"}</M> and <M>{"rS_n = a_1 r + \\cdots + a_1 r^{n-1} + a_1 r^n"}</M>.
          Subtracting, everything cancels except the ends: <M>{"S_n - rS_n = a_1 - a_1 r^n"}</M>. Divide by{" "}
          <M>{"1 - r"}</M>.
        </p>
      </Proof>

      <Theorem title="the infinite geometric sum">
        <p>If <M>{"-1 < r < 1"}</M>, the sums <M>{"S_n"}</M> get as close as we like to <M>{"\\dfrac{a_1}{1 - r}"}</M> as <M>n</M> grows. We write</p>
        <MD>{"a_1 + a_1 r + a_1 r^2 + \\cdots = \\frac{a_1}{1 - r}."}</MD>
      </Theorem>
      <Proof>
        <p>
          By the last theorem, <M>{"S_n"}</M> differs from <M>{"\\tfrac{a_1}{1-r}"}</M> by <M>{"\\tfrac{a_1 r^n}{1-r}"}</M>, and
          when <M>{"|r| < 1"}</M> the powers <M>{"r^n"}</M> shrink towards 0. (What &ldquo;as close as we like&rdquo; means
          exactly is the subject of limits, in Calculus.)
        </p>
      </Proof>

      <Example title="a recurring decimal">
        <p>
          <M>{"0.333\\ldots = \\tfrac{3}{10} + \\tfrac{3}{100} + \\cdots"}</M> is geometric with <M>{"a_1 = \\tfrac{3}{10}"}</M> and{" "}
          <M>{"r = \\tfrac{1}{10}"}</M>, so it equals <M>{"\\tfrac{3/10}{9/10} = \\tfrac13"}</M>. In the same way{" "}
          <M>{"0.999\\ldots = 1"}</M>: not approximately, exactly.
        </p>
      </Example>

      <Remark title="Zeno’s paradox">
        <p>
          Zeno of Elea argued that you can never cross a room: first you must cross half of it, then half of what remains, and
          so on, an infinity of tasks. The geometric sum answers him, at least as mathematics:{" "}
          <M>{"\\tfrac12 + \\tfrac14 + \\tfrac18 + \\cdots = 1"}</M>, and if each half takes half the time, the infinitely many
          steps fit into a finite time. Whether that settles the philosophical worry is a question philosophers still discuss.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "nth-term",
      rung: "check",
      prompt: <p>What is the 20th term of the arithmetic sequence <M>{"3, 7, 11, \\ldots"}</M>?</p>,
      answer: { kind: "numeric", value: 79 },
    },
    {
      key: "gauss",
      rung: "check",
      prompt: <p>What is <M>{"1 + 2 + 3 + \\cdots + 200"}</M>?</p>,
      answer: { kind: "numeric", value: 20100 },
    },
    {
      key: "geometric-term",
      rung: "apply",
      prompt: <p>What is the 8th term of the geometric sequence <M>{"2, 6, 18, \\ldots"}</M>?</p>,
      answer: { kind: "numeric", value: 4374 },
    },
    {
      key: "powers-of-two",
      rung: "apply",
      prompt: <p>What is <M>{"1 + 2 + 4 + \\cdots + 2^9"}</M>?</p>,
      answer: { kind: "numeric", value: 1023 },
    },
    {
      key: "infinite",
      rung: "apply",
      prompt: <p>What is <M>{"9 + 3 + 1 + \\tfrac13 + \\tfrac19 + \\cdots"}</M>, continued for ever?</p>,
      answer: { kind: "numeric", value: 13.5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a = [5 + 3 * n for n in range(5)]
g = [2 * 3 ** n for n in range(5)]
print(a[-1], g[-1], sum(a))`}</Code>
          <p>An arithmetic and a geometric sequence. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["17 162 55", "17 486 55", "20 162 55", "17 162 85"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>arith_sum(a, d, n)</C> and <C>geom_sum(a, r, n)</C>, the sums of the first n terms, using the closed forms n(2a + (n − 1)d)/2 and a(1 − rⁿ)/(1 − r), with the case r = 1 handled separately.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def arith_sum(a, d, n):
    return a * n

def geom_sum(a, r, n):
    return a * (1 - r ** n) / (1 - r)
`,
        solution: `def arith_sum(a, d, n):
    return n * (2 * a + (n - 1) * d) / 2

def geom_sum(a, r, n):
    if r == 1:
        return a * n
    return a * (1 - r ** n) / (1 - r)
`,
        tests: [
          { name: "arithmetic", code: `assert abs(arith_sum(5, 3, 5) - 55) < 1e-9 and abs(arith_sum(1, 1, 100) - 5050) < 1e-9, 'Pair the first and last terms.'` },
          { name: "geometric", code: `assert abs(geom_sum(2, 3, 5) - 242) < 1e-9 and abs(geom_sum(1, 0.5, 10) - 1.998046875) < 1e-12, '2 + 6 + 18 + 54 + 162 = 242.'` },
          { name: "ratio one", code: `assert geom_sum(4, 1, 6) == 24, 'When r = 1 every term is a.'` },
        ],
      },
    },
    {
      key: "arith-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that the sum of the first <M>n</M> terms of an arithmetic sequence with first term <M>a</M> and difference{" "}
          <M>d</M> is <M>{"\\tfrac{n}{2}\\big(2a + (n-1)d\\big)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the sum forwards, from a to a + (n − 1)d, and backwards.",
          "Adds the two lines term by term and shows each pair is 2a + (n − 1)d.",
          "Counts n pairs, so twice the sum is n(2a + (n − 1)d).",
          "Divides by 2.",
        ],
      },
    },
    {
      key: "recurring",
      rung: "stretch",
      prompt: (
        <p>
          Write <M>{"0.272727\\ldots"}</M> as a fraction <M>{"\\tfrac{p}{q}"}</M> in lowest terms, using a geometric sum. What is{" "}
          <M>q</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 11 },
    },
  ],

  teachBack:
    "Explain to a friend the trick for adding 1 + 2 + ... + 100, and the trick for adding a geometric sequence by multiplying it by r and subtracting.",

  glimpse: (
    <p>
      Next, sigma notation, a compact way to write sums like these. Infinite geometric sums are the first and most important
      example of a series, and Calculus builds the theory of when an infinite sum makes sense on exactly this one. Sequences
      defined by a rule from earlier terms, recurrences, return in Discrete Mathematics.
    </p>
  ),
};
