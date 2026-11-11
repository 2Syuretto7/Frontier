import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReduceViz } from "@/components/viz/ReduceViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.1.3",
  minutes: 45,
  links: {
    revisits: ["e0.1.2"],
    parallels: ["m0.1.2", "m0.2.1"],
    foreshadows: ["e3.1.3", "e1.5.2"],
  },

  puzzle: (
    <>
      <p>
        A film lasts 137 minutes. You want to display it as hours and minutes: 2 hours 17 minutes.
      </p>
      <p>
        Using only whole-number arithmetic, with no decimals, how would you compute the 2 and the 17 from 137 and 60?
        Describe the two calculations in words. Then do the same for 3,725 seconds as hours, minutes and seconds.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The two calculations are &ldquo;how many whole 60s fit in 137&rdquo; and &ldquo;what is left over&rdquo;. Python has
        an operator for each: <C>137 // 60</C> is 2 and <C>137 % 60</C> is 17. Combinations of values, variables and
        operators like these are called <strong>expressions</strong>, and Python reduces every expression to a single value.
      </p>
      <p>
        When an expression has several operators, Python follows fixed rules about which goes first, much as in school
        arithmetic. Predict each value, then step through.
      </p>
      <ReduceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="expression">
        <p>
          An <strong>expression</strong> is any piece of code that has a value: a literal such as <C>3</C>, a variable such
          as <C>price</C>, or operators and function calls combining them, such as <C>price * count + 50</C>. Evaluating an
          expression produces a value with a type.
        </p>
      </Definition>

      <Definition title="arithmetic operators">
        <Code>{`
7 + 2     # 9     addition
7 - 2     # 5     subtraction
7 * 2     # 14    multiplication
7 / 2     # 3.5   true division, always a float
7 // 2    # 3     floor division, rounds down
7 % 2     # 1     remainder
7 ** 2    # 49    power
`}</Code>
        <p>
          The <strong>precedence</strong> from tightest to loosest is: brackets; <C>**</C>; unary minus; then{" "}
          <C>*</C>, <C>/</C>, <C>//</C> and <C>%</C> together; then <C>+</C> and <C>-</C>. Operators of equal precedence go
          from left to right, except <C>**</C>, which goes from right to left. When in doubt, add brackets: they cost nothing
          and help the reader.
        </p>
      </Definition>

      <Definition title="comparisons and logic">
        <p>
          The comparison operators <C>==</C>, <C>!=</C>, <C>&lt;</C>, <C>&lt;=</C>, <C>&gt;</C> and <C>&gt;=</C> produce a
          bool. Note that <C>==</C> tests equality, while a single <C>=</C> assigns. The logical operators{" "}
          <C>and</C>, <C>or</C> and <C>not</C> combine bools. They bind more loosely than comparisons, so{" "}
          <C>x &gt; 0 and x &lt; 10</C> means what it looks like. Python evaluates <C>and</C> and <C>or</C> lazily: if the
          left side already decides the answer, the right side is not evaluated.
        </p>
      </Definition>

      <Example title="hours, minutes and seconds">
        <p>For a whole number of seconds <C>t</C>:</p>
        <Code>{`
t = 3725
hours = t // 3600           # 1
minutes = t % 3600 // 60    # 2
seconds = t % 60            # 5
`}</Code>
        <p>
          The pair <C>//</C> and <C>%</C> always fit together: for a positive divisor <C>d</C>,{" "}
          <C>(n // d) * d + n % d</C> equals <C>n</C>. The remainder is also the standard way to test divisibility:{" "}
          <C>n % 2 == 0</C> is True exactly when <C>n</C> is even.
        </p>
      </Example>

      <Remark title="negative numbers">
        <p>
          Floor division rounds <em>down</em>, towards minus infinity, not towards zero. So <C>-7 // 2</C> is{" "}
          <C>-4</C>, and to keep the rule above true, <C>-7 % 2</C> is <C>1</C>. Some other languages round towards zero
          instead, which is a common source of bugs when code is translated.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "floor",
      rung: "check",
      prompt: <p>What is the value of <C>7 // 2</C>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "divtype",
      rung: "check",
      prompt: <p>What is the type of <C>6 / 3</C>?</p>,
      answer: { kind: "choice", options: ["int", "float", "str"], correct: [1] },
    },
    {
      key: "prec",
      rung: "apply",
      prompt: <p>What is the value of <C>(1 + 2) * 3 ** 2</C>?</p>,
      answer: { kind: "numeric", value: 27 },
    },
    {
      key: "mins",
      rung: "apply",
      prompt: <p>A video is 125 minutes long. What is <C>125 % 60</C>, the minutes left over after the whole hours?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "bools",
      rung: "apply",
      prompt: <p>Select every expression whose value is <C>True</C>.</p>,
      answer: {
        kind: "choice",
        options: ["10 % 3 == 1", "2 ** 3 == 6", "5 > 2 and 1 > 2", "not 5 > 2 or 4 >= 4"],
        correct: [0, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(17 // 5, 17 % 5, 2 + 3 * 4 ** 2)`}</Code>
          <p>Integer division, remainder and precedence. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 2 50", "3.4 2 400", "3 2 400", "3 3 50"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(7 // 2, 7 % 2, -7 // 2, 2 ** 3 ** 2, 1 + 2 * 3 - 4 / 2)`}</Code>
          <p>Floor division of a negative number, a right-associative power, and mixed precedence. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 1 -4 512 5.0", "3 1 -3 64 5.0", "3.5 1 -4 512 5", "3 1 -4 64 1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            <C>seconds</C> is a whole number of seconds. Use <C>//</C> and <C>%</C> to set <C>hours</C>, <C>minutes</C> and <C>secs</C> so that seconds = 3600 · hours + 60 · minutes + secs, with minutes and secs below 60.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `seconds = 7384
hours = seconds // 3600
minutes = 0
secs = 0
`,
        solution: `seconds = 7384
hours = seconds // 3600
minutes = seconds % 3600 // 60
secs = seconds % 60
`,
        tests: [
          { name: "split", code: `assert (hours, minutes, secs) == (2, 3, 4), '7384 seconds is 2 hours, 3 minutes and 4 seconds.'` },
          { name: "invariant", code: `assert seconds == 7384 and 3600 * hours + 60 * minutes + secs == seconds and 0 <= minutes < 60 and 0 <= secs < 60, 'The parts must add back up to the total.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Work with digits using only arithmetic, never <C>str</C>. Write <C>digit_sum(n)</C> for n ≥ 0 by repeatedly taking n % 10 and n // 10; <C>reverse_digits(n)</C>, the number with its digits reversed (so 1200 gives 21); and <C>is_armstrong(n)</C>, true when n equals the sum of its digits each raised to the power of the number of digits (153 = 1³ + 5³ + 3³).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def digit_sum(n):
    return n

def reverse_digits(n):
    return n

def is_armstrong(n):
    return False
`,
        solution: `def digit_sum(n):
    s = 0
    while n > 0:
        s += n % 10
        n //= 10
    return s

def reverse_digits(n):
    r = 0
    while n > 0:
        r = r * 10 + n % 10
        n //= 10
    return r

def _digits(n):
    k = 1
    while n >= 10:
        n //= 10
        k += 1
    return k

def is_armstrong(n):
    k = _digits(n)
    s, m = 0, n
    while m > 0:
        s += (m % 10) ** k
        m //= 10
    return s == n
`,
        tests: [
          { name: "sum", code: `assert digit_sum(0) == 0 and digit_sum(7) == 7 and digit_sum(9875) == 29 and digit_sum(10 ** 30) == 1` },
          { name: "reverse", code: `assert reverse_digits(1234) == 4321 and reverse_digits(1200) == 21 and reverse_digits(0) == 0 and reverse_digits(5) == 5` },
          { name: "armstrong", code: `assert [n for n in range(1000) if is_armstrong(n)] == [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407] and is_armstrong(9474), 'Every one-digit number is an Armstrong number.'` },
          { name: "no str", code: `import builtins
real = builtins.str
def banned(*a, **k):
    raise AssertionError('Use arithmetic, not str.')
builtins.str = banned
try:
    r = (digit_sum(4321), reverse_digits(4321), is_armstrong(371))
finally:
    builtins.str = real
assert r == (10, 1234, True)` },
        ],
      },
    },
    {
      key: "divmod",
      rung: "prove",
      prompt: (
        <p>
          Write expressions that turn a whole number of seconds <C>t</C> into hours, minutes and seconds, and explain why{" "}
          <C>(n // d) * d + n % d</C> always equals <C>n</C> for a positive whole number <C>d</C>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives hours as t // 3600, minutes as t % 3600 // 60 (or equivalent), and seconds as t % 60.",
          "Explains that n // d is the number of whole times d fits into n.",
          "Explains that n % d is what remains after removing those whole multiples of d.",
          "Concludes that the whole multiples plus the remainder give back n.",
        ],
      },
    },
    {
      key: "tower",
      rung: "stretch",
      prompt: <p>What is the value of <C>2 ** 3 ** 2</C>? Remember which way <C>**</C> groups.</p>,
      answer: { kind: "numeric", value: 512 },
    },
  ],

  teachBack:
    "Explain to a friend what Python's seven arithmetic operators do, how precedence decides the order, and how // and % split a number into whole parts and a remainder.",

  glimpse: (
    <p>
      Next, getting values into a program from its user and printing results neatly. In Computer Systems you will meet
      operators that work on the individual bits of an int, and in Python, NumPy and the Command Line you will apply one
      expression to millions of numbers at once.
    </p>
  ),
};
