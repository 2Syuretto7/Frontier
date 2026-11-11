import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { RiemannViz } from "@/components/viz/RiemannViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.6.1",
  minutes: 80,
  links: {
    revisits: ["m0.7.2"],
    foreshadows: ["m5.7.1", "m18.2.1"],
  },

  puzzle: (
    <>
      <p>
        A car&rsquo;s speedometer is broken, but a passenger noted its speed every ten seconds: 0, 5, 12, 20 and 26 metres
        per second. How far did the car travel in those forty seconds? At a steady speed, distance would be speed times
        time. But the speed never stayed steady.
      </p>
      <p>
        The same question in another form: how much area lies under the curve <M>{"y = x^2"}</M> between 0 and 1? Areas of
        rectangles and triangles are easy. How do you find the area of a shape with a curved side?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cut the region into thin vertical strips. Each strip is nearly a rectangle, whose area is easy: width times a
        height read off the curve. Add up the rectangles. The answer is not exact, because each strip&rsquo;s top is
        curved, but the thinner the strips, the smaller the error. The area is the number these sums approach.
      </p>
      <RiemannViz />
    </>
  ),

  theory: (
    <>
      <Definition title="partitions and Riemann sums">
        <p>
          A <strong>partition</strong> P of <M>{"[a, b]"}</M> is a finite list of points{" "}
          <M>{"a = x_0 < x_1 < \\cdots < x_n = b"}</M>. It cuts the interval into n pieces of widths{" "}
          <M>{"\\Delta x_i = x_i - x_{i-1}"}</M>. Choose a sample point <M>{"t_i"}</M> in each piece. The{" "}
          <strong>Riemann sum</strong> is
        </p>
        <MD>{"\\sum_{i=1}^{n} f(t_i)\\, \\Delta x_i."}</MD>
        <p>
          With equal pieces, <M>{"\\Delta x = (b - a)/n"}</M>, and the left, right and midpoint sums take{" "}
          <M>{"t_i"}</M> at the left end, right end or middle of each piece.
        </p>
      </Definition>

      <Example title="the parabola">
        <p>
          Take <M>{"f(x) = x^2"}</M> on <M>{"[0, 1]"}</M> with n equal pieces and right endpoints, so{" "}
          <M>{"t_k = k/n"}</M>. Using the formula for the sum of the first n squares, proved by induction earlier,
        </p>
        <MD>{"R_n = \\sum_{k=1}^{n} \\left(\\frac{k}{n}\\right)^2 \\frac{1}{n} = \\frac{1}{n^3} \\cdot \\frac{n(n+1)(2n+1)}{6} = \\frac{(1 + 1/n)(2 + 1/n)}{6} \\to \\frac{1}{3}."}</MD>
        <p>
          The left sum is <M>{"L_n = R_n - \\frac{1}{n}"}</M> (it drops the last rectangle, of height 1, and gains a first
          one of height 0), so it has the same limit. Since <M>{"x^2"}</M> is increasing, the true area lies between{" "}
          <M>{"L_n"}</M> and <M>{"R_n"}</M> for every n, so it must be exactly <M>{"\\tfrac{1}{3}"}</M>.
        </p>
      </Example>

      <Remark title="the car">
        <p>
          Over each ten-second interval, if we take the speed at the start as the speed throughout, the distance is about{" "}
          <M>{"10 \\times (0 + 5 + 12 + 20) = 370"}</M> metres. Taking the speed at the end gives{" "}
          <M>{"10 \\times (5 + 12 + 20 + 26) = 630"}</M>. The truth lies between, if the car was speeding up all the
          time. These are a left and a right Riemann sum for the speed. Distance is the area under the graph of speed
          against time, and more frequent readings would pin it down.
        </p>
      </Remark>

      <Remark title="signed area">
        <p>
          Where f is negative, <M>{"f(t_i)\\Delta x_i"}</M> is negative, so area below the axis counts with a minus sign.
          For a car, this is travel in reverse: a negative velocity reduces the net distance from the start. The Riemann
          sum measures <strong>signed area</strong>, area above the axis minus area below.
        </p>
      </Remark>

      <Remark title="an old idea">
        <p>
          Archimedes found the area of a parabolic segment more than two thousand years ago, by filling it with ever
          smaller triangles and summing a geometric series. His answer agrees with the <M>{"\\tfrac{1}{3}"}</M> above. What
          the Riemann sum adds is a single method that works for every reasonable function, not a separate trick for each
          shape.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "right",
      rung: "check",
      prompt: (
        <p>
          Find the right-endpoint sum for <M>{"f(x) = x"}</M> on <M>{"[0, 2]"}</M> with 2 equal pieces.
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "left",
      rung: "check",
      prompt: (
        <p>
          Find the left-endpoint sum for <M>{"f(x) = x^2"}</M> on <M>{"[0, 2]"}</M> with 2 equal pieces.
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "mid",
      rung: "apply",
      prompt: (
        <p>
          Find the midpoint sum for <M>{"f(x) = x^2"}</M> on <M>{"[0, 2]"}</M> with 2 equal pieces.
        </p>
      ),
      answer: { kind: "numeric", value: 2.5 },
    },
    {
      key: "car",
      rung: "apply",
      prompt: (
        <p>
          A cyclist&rsquo;s speed is recorded every 20 seconds: 4, 6, 7, 5 and 3 metres per second. Using the speed at the
          start of each interval, estimate the distance in metres covered over the 80 seconds.
        </p>
      ),
      answer: { kind: "numeric", value: 440 },
    },
    {
      key: "closed",
      rung: "apply",
      prompt: (
        <p>
          The right-endpoint sum for <M>{"f(x) = x"}</M> on <M>{"[0, 1]"}</M> with n equal pieces is{" "}
          <M>{"\\sum_{k=1}^n \\frac{k}{n} \\cdot \\frac{1}{n}"}</M>. Write it in closed form, as an expression in n.
        </p>
      ),
      answer: { kind: "expression", value: "(n + 1)/(2n)", variables: ["n"] },
    },
    {
      key: "cubes",
      rung: "prove",
      prompt: (
        <p>
          Using <M>{"\\sum_{k=1}^n k^3 = \\left(\\frac{n(n+1)}{2}\\right)^2"}</M>, find the limit of the right-endpoint
          sums for <M>{"x^3"}</M> on <M>{"[0, 1]"}</M>, and explain why it is the area under the curve.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes R_n = (1/n⁴) Σ k³ and substitutes the formula.",
          "Simplifies to (1 + 1/n)²/4 and finds the limit 1/4.",
          "Notes that the left sums differ by 1/n and that, as x³ is increasing, the area lies between the left and right sums, so it is 1/4.",
        ],
      },
    },
    {
      key: "fermat",
      rung: "stretch",
      prompt: (
        <p>
          Fermat found the area under <M>{"x^2"}</M> on <M>{"[0, b]"}</M> with unequal pieces. Fix q with{" "}
          <M>{"0 < q < 1"}</M>, and use the points <M>{"b, bq, bq^2, bq^3, \\ldots"}</M>, which crowd towards 0. Using the
          right end of each piece, sum the infinitely many rectangles as a geometric series, and let{" "}
          <M>{"q \\to 1"}</M>. Do you get <M>{"b^3/3"}</M>?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the k-th piece as [bq^(k+1), bq^k], of width bq^k(1 − q), with height (bq^k)².",
          "Sums the series b³(1 − q) Σ q^(3k) = b³(1 − q)/(1 − q³) = b³/(1 + q + q²).",
          "Lets q → 1 to get b³/3.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how adding up thin rectangles gives the area under a curve, and why the answer for x² from 0 to 1 must be exactly one third.",

  glimpse: (
    <p>
      The next lesson asks when such sums really do settle on one number, whatever the choice of points. In Multivariable and Matrix Calculus, the strips become small boxes and the area becomes volume. And in Measure-Theoretic Probability, Lebesgue cuts the range of the function instead of the domain, and integrates functions that defeat Riemann sums entirely.
    </p>
  ),
};
