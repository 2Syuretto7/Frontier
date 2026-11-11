import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { GrowthViz } from "@/components/viz/GrowthViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.4.1",
  minutes: 60,
  links: {
    revisits: ["m0.2.5", "m0.3.3"],
    foreshadows: ["m0.7.1", "m0.7.3"],
  },

  puzzle: (
    <>
      <p>
        An old Indian legend tells of the inventor of chess. Offered any reward by the king, the inventor asked only for
        rice: one grain on the first square of the board, two on the second, four on the third, and so on, doubling on each
        of the 64 squares. The king laughed at so modest a request.
      </p>
      <p>
        A courtier suggested a different deal: 1000 grains on the first square, 2000 on the second, 3000 on the third,
        adding 1000 each time. Which deal should the inventor take? Guess first, then estimate how much rice the doubling
        deal comes to.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The adding deal starts far ahead: 1000 grains against 1 on the first square, and still 10,000 against 512 on the
        tenth. But by the 15th square doubling gives 16,384 grains against 15,000, and from then on it is not a race. The 64th
        square alone holds <M>{"2^{63}"}</M>, about <M>{"9 \\times 10^{18}"}</M> grains, far more rice than the world has
        ever grown. The adding deal&rsquo;s last square holds 64,000.
      </p>
      <p>
        The difference is between growing by a fixed <em>amount</em> and growing by a fixed <em>factor</em>. A fixed
        factor means a fixed <em>percentage</em>, and anything that grows in proportion to its own size, such as money
        earning interest, a population breeding or a rumour spreading, behaves this way. Compare the two kinds of growth
        below.
      </p>
      <GrowthViz />
    </>
  ),

  theory: (
    <>
      <Definition title="arithmetic and geometric growth">
        <p>A quantity that changes in equal steps <M>{"n = 0, 1, 2, \\ldots"}</M> grows</p>
        <ul>
          <li><strong>arithmetically</strong> (or linearly) if it adds the same amount <M>d</M> each step: <M>{"a_n = a_0 + nd"}</M>;</li>
          <li><strong>geometrically</strong> (or exponentially) if it multiplies by the same factor <M>{"r > 0"}</M> each step: <M>{"a_n = a_0 r^n"}</M>.</li>
        </ul>
        <p>
          Geometric change with <M>{"r > 1"}</M> is <strong>growth</strong>; with <M>{"0 < r < 1"}</M> it is{" "}
          <strong>decay</strong>. Growth by <M>p</M> percent per step means <M>{"r = 1 + \\tfrac{p}{100}"}</M>, and decay by{" "}
          <M>p</M> percent means <M>{"r = 1 - \\tfrac{p}{100}"}</M>.
        </p>
      </Definition>

      <p>
        The test for geometric change is that the <em>ratio</em> of consecutive terms is constant, just as the test for
        linear change is that the <em>difference</em> is constant. So 3, 6, 12, 24 is geometric, and 3, 6, 9, 12 is not.
      </p>

      <Proposition title="the total on the chessboard">
        <p>For every whole number <M>n</M>, <M>{"1 + 2 + 4 + \\cdots + 2^{n-1} = 2^n - 1"}</M>.</p>
      </Proposition>
      <Proof>
        <p>Call the sum <M>S</M>. Doubling it shifts every term one place along:</p>
        <MD>{"2S = 2 + 4 + \\cdots + 2^{n-1} + 2^n."}</MD>
        <p>
          Subtract the first line from the second. Everything cancels except the last term of <M>{"2S"}</M> and the first term
          of <M>S</M>, leaving <M>{"S = 2^n - 1"}</M>.
        </p>
      </Proof>
      <p>
        The whole board holds <M>{"2^{64} - 1 \\approx 1.8 \\times 10^{19}"}</M> grains. The same trick sums any geometric
        series, as you will see with sequences.
      </p>

      <Definition title="doubling time and half-life">
        <p>
          Under geometric growth, the time to double is the same wherever you start: if <M>{"r^k = 2"}</M>, then{" "}
          <M>{"a_{n+k} = a_n r^k = 2a_n"}</M> for every <M>n</M>. This fixed <M>k</M> is the <strong>doubling time</strong>.
          For decay, the time to halve is the <strong>half-life</strong>.
        </p>
      </Definition>

      <Example title="radiocarbon">
        <p>
          Carbon-14 decays with a half-life of about 5730 years. A sample with 80 micrograms of it has 40 after 5730 years,
          20 after 11,460 and 10 after 17,190. A bone that has <M>{"\\tfrac18"}</M> of the carbon-14 of living tissue is
          therefore about <M>{"3 \\times 5730 \\approx 17{,}000"}</M> years old. Solving for the age when the fraction is
          not a neat power of <M>{"\\tfrac12"}</M> needs logarithms, two lessons from now.
        </p>
      </Example>

      <Proposition title="percentages do not cancel">
        <p>
          Increasing by <M>q</M> percent and then decreasing by <M>q</M> percent leaves you below where you started, for any{" "}
          <M>{"q > 0"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>
          With <M>{"s = \\tfrac{q}{100}"}</M>, the two steps multiply by <M>{"(1 + s)(1 - s) = 1 - s^2 < 1"}</M>. The order
          does not matter, since multiplication is commutative.
        </p>
      </Proof>

      <Remark title="why exponential growth always wins">
        <p>
          For <M>{"p > 0"}</M>, multiplying by <M>{"1 + p"}</M> once adds <M>p</M> times the current amount, which is at
          least <M>p</M> times the starting amount. So after <M>n</M> steps you have at least <M>{"1 + np"}</M> times what you
          began with, <M>{"(1 + p)^n \\ge 1 + np"}</M>, and in fact far more, because later steps add a share of an already
          larger amount. Turning &ldquo;far more&rdquo; into a proof that <M>{"r^n"}</M> eventually beats any linear, and
          indeed any polynomial, expression is a classic use of induction and returns in Calculus. In the world, nothing grows
          exponentially for ever: rice, money and bacteria all run out of room. But over the period when it does, it surprises
          everyone.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "square-ten",
      rung: "check",
      prompt: <p>On the doubling chessboard, how many grains are on the 10th square?</p>,
      answer: { kind: "numeric", value: 512 },
    },
    {
      key: "geometric",
      rung: "check",
      prompt: <p>Select every sequence that is geometric.</p>,
      answer: {
        kind: "choice",
        options: ["5, 10, 20, 40", "5, 10, 15, 20", "81, 27, 9, 3", "1, 4, 9, 16"],
        correct: [0, 2],
      },
    },
    {
      key: "interest",
      rung: "apply",
      prompt: <p>Rs 1000 earns 10 percent interest a year, added to the balance each year. What is the balance after 2 years, in rupees?</p>,
      answer: { kind: "numeric", value: 1210 },
    },
    {
      key: "up-down",
      rung: "apply",
      prompt: <p>A price rises by 20 percent and then falls by 20 percent. By what percentage has it changed overall? (Give a negative number for a fall.)</p>,
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "first-ten",
      rung: "apply",
      prompt: <p>How many grains are on the first 10 squares of the doubling chessboard altogether?</p>,
      answer: { kind: "numeric", value: 1023 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`v = 1000
for year in range(3):
    v *= 1.10
print(round(v, 2))`}</Code>
          <p>A value grows by 10% a year for three years. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1331.0, tolerance: 0.01 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`balance, years = 1000, 0
while balance < 2000:
    balance *= 1.07
    years += 1
print(years, round(balance, 2), round(72 / 7, 1))`}</Code>
          <p>Money grows by 7% a year. When does it first reach 2000, and what does the rule of 72 predict?</p>
        </>
      ),
      answer: { kind: "choice", options: ["11 2104.85 10.3", "10 1967.15 10.3", "11 2104.85 10.0", "10 2104.85 10.3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>doubling_time(rate)</C>, the number of whole periods before a quantity growing by <C>rate</C> per period (0.05 means 5%) first at least doubles, by simulating it.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def doubling_time(rate):
    return round(70 / (rate * 100))
`,
        solution: `def doubling_time(rate):
    v, n = 1.0, 0
    while v < 2:
        v *= 1 + rate
        n += 1
    return n
`,
        tests: [
          { name: "ten percent", code: `assert doubling_time(0.10) == 8, '1.1⁷ ≈ 1.95 and 1.1⁸ ≈ 2.14.'` },
          { name: "one percent", code: `assert doubling_time(0.01) == 70, '1.01⁶⁹ ≈ 1.987 and 1.01⁷⁰ ≈ 2.007.'` },
          { name: "large", code: `assert doubling_time(1.0) == 1, 'Growing by 100% doubles in one period.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            A drug has a half-life of h hours. Write <C>remaining(dose, h, t)</C>, the amount left after t hours, and <C>schedule(dose, h, every, n)</C>, the amount in the body just after each of n doses taken every <C>every</C> hours (each dose adds to whatever is left), returned as a list. Then write <C>steady_state(dose, h, every)</C>, the limit of that list, using the sum of a geometric series.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def remaining(dose, h, t):
    return dose / 2

def schedule(dose, h, every, n):
    return [dose] * n

def steady_state(dose, h, every):
    return dose
`,
        solution: `def remaining(dose, h, t):
    return dose * 0.5 ** (t / h)

def schedule(dose, h, every, n):
    out, amt = [], 0.0
    for _ in range(n):
        amt = remaining(amt, h, every) + dose
        out.append(amt)
    return out

def steady_state(dose, h, every):
    r = 0.5 ** (every / h)
    return dose / (1 - r)
`,
        tests: [
          { name: "decay", code: `assert abs(remaining(100, 6, 6) - 50) < 1e-9 and abs(remaining(100, 6, 18) - 12.5) < 1e-9 and abs(remaining(80, 4, 0) - 80) < 1e-12, 'Each half-life halves the amount.'` },
          { name: "schedule", code: `s = schedule(100, 6, 6, 4)
assert all(abs(a - b) < 1e-9 for a, b in zip(s, [100, 150, 175, 187.5])) and len(s) == 4, 'Halve what is left, then add a dose.'` },
          { name: "limit", code: `assert abs(steady_state(100, 6, 6) - 200) < 1e-9 and abs(schedule(100, 6, 6, 60)[-1] - 200) < 1e-6, 'dose / (1 − r) with r = ½^(every/h).'` },
          { name: "uneven", code: `ss = steady_state(50, 8, 12)
assert abs(schedule(50, 8, 12, 200)[-1] - ss) < 1e-9 and abs(ss - 50 / (1 - 0.5 ** 1.5)) < 1e-9, 'The ratio is ½ raised to every/h.'` },
        ],
      },
    },
    {
      key: "sum-proof",
      rung: "prove",
      prompt: (
        <p>
          Using the doubling-and-subtracting trick, prove that <M>{"1 + 3 + 9 + \\cdots + 3^{n-1} = \\dfrac{3^n - 1}{2}"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Names the sum S and multiplies it by 3.",
          "Writes 3S = 3 + 9 + … + 3ⁿ and lines it up against S.",
          "Subtracts to get 3S − S = 3ⁿ − 1.",
          "Divides by 2 to conclude S = (3ⁿ − 1)/2.",
        ],
      },
    },
    {
      key: "fold",
      rung: "stretch",
      prompt: (
        <p>
          A sheet of paper 0.1 mm thick is folded in half again and again, doubling its thickness each time. What is the
          least number of folds after which it would be thicker than the distance to the Moon, about 384,000 km? (Ignore that
          real paper cannot be folded this often. You may use <M>{"2^{10} \\approx 1000"}</M> to estimate, then check.)
        </p>
      ),
      answer: { kind: "numeric", value: 42 },
    },
  ],

  teachBack:
    "Explain to a friend why the inventor of chess should prefer doubling to adding 1000 each square, even though adding is far ahead at first. Use the words 'amount' and 'factor'.",

  glimpse: (
    <p>
      Next, exponential functions: what <M>{"2^x"}</M> means when <M>x</M> is not a whole number, so that growth can be
      measured at any moment rather than only at each step. Geometric sequences and their sums return in the chapter on
      sequences, and induction there makes the &ldquo;always wins&rdquo; argument a proof. In Calculus, a quantity that
      grows in proportion to its size turns out to be exactly an exponential function.
    </p>
  ),
};
