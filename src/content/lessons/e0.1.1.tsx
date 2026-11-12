import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.1.1";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

export const lesson: LessonContent = {
  id: "e0.1.1",
  minutes: 40,
  links: {
    parallels: ["l0.1.1"],
    foreshadows: ["e1.1.1", "e3.2.1"],
  },

  puzzle: (
    <>
      <p>
        You have a helper who follows instructions perfectly literally and knows nothing you have not told them. You write:
        &ldquo;Put two spoons of sugar in the tea and stir it.&rdquo;
      </p>
      <p>
        List every way this instruction could go wrong for such a helper. Which spoon? What if there is no tea yet? Stir what,
        the sugar or the tea, and for how long? Then rewrite the instruction so that it cannot be misread.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A computer is that helper. It is astonishingly fast and never tired, but it has no common sense and cannot guess what
        you meant. A <strong>program</strong> is a list of instructions written so precisely that there is only one way to
        follow them.
      </p>
      <p>
        Here is a complete program in the language Python. Step through it and watch what each line does. The highlighted
        line is the one about to run; the boxes show the program&rsquo;s memory and what it has printed.
      </p>
      <TraceViz code={code} steps={steps} />
      <p>
        Notice three things. The lines run one at a time, from top to bottom. A line can use a value that an earlier line
        stored. And nothing appears on the screen until a line asks for it with <C>print</C>.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="program">
        <p>
          A <strong>program</strong> is a sequence of instructions that a computer can carry out. Each instruction in Python
          is called a <strong>statement</strong>; usually one statement is one line. Without loops, branches or functions,
          which come in later lessons, Python runs the statements in order, from the first line to the last, each exactly
          once.
        </p>
      </Definition>

      <Definition title="the interpreter">
        <p>
          The computer&rsquo;s processor understands only very simple numeric instructions. Python is a{" "}
          <strong>programming language</strong>: a precise notation that people can read. A program called the{" "}
          <strong>interpreter</strong> reads Python text and carries it out. In Frontier the interpreter runs inside your
          browser: type a program into an editor like the one below and press Run. Every runnable example in these
          lessons has its own editor, so you can change it and run it again, which is the quickest way to experiment.
        </p>
      </Definition>

      <Definition title="comments">
        <p>
          Anything after a <C>#</C> on a line is a <strong>comment</strong>. Python ignores it; it is a note for people.
        </p>
        <Playground code={`
# Work out the cost of three items at 120 rupees each.
price = 120
count = 3
total = price * count   # 360
print("Total:", total)
`} />
      </Definition>

      <Example title="a bug of order">
        <p>Move the multiplication to the top:</p>
        <Code>{`
total = price * count
price = 120
count = 3
`}</Code>
        <p>
          A person reading this would understand what was meant. Python does not: when it reaches the first line,{" "}
          <C>price</C> does not exist yet, so it stops with the error <C>NameError: name &apos;price&apos; is not defined</C>.
          A mistake in a program is called a <strong>bug</strong>, and finding and fixing bugs is called{" "}
          <strong>debugging</strong>. Most of a programmer&rsquo;s time goes on it.
        </p>
      </Example>

      <Remark title="why Python">
        <p>
          There are hundreds of programming languages. This curriculum uses Python because it is easy to read, and because
          almost all machine learning research is written in it: the libraries that train the largest models are driven
          from Python. Underneath, those libraries run code written in faster, lower-level languages, which the later
          engineering courses also teach. The ideas of this course, such as variables, conditions, loops and functions,
          are shared by nearly every language.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>In a program with no loops, branches or functions, in what order does Python run the lines?</p>,
      answer: { kind: "choice", options: ["From top to bottom, each once", "All at the same time", "In whatever order makes sense"], correct: [0] },
    },
    {
      key: "swap",
      rung: "check",
      prompt: <p>In the traced program, what would happen if line 3 were moved above line 1?</p>,
      answer: {
        kind: "choice",
        options: ["Python stops with an error, because price does not exist yet", "Python reorders the lines itself", "total is set to 0"],
        correct: [0],
      },
    },
    {
      key: "double",
      rung: "apply",
      prompt: (
        <>
          <p>What number does this program print?</p>
          <Code>{`
a = 5
b = a + 2
print(b * 2)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "again",
      rung: "apply",
      prompt: (
        <>
          <p>What number does this program print?</p>
          <Code>{`
x = 10
x = x + 5
x = x * 2
print(x)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 30 },
    },
    {
      key: "quotes",
      rung: "apply",
      prompt: (
        <>
          <p>What does this line print?</p>
          <Code>{`print("2 + 3")`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["2 + 3", "5", "Nothing"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`price = 45
count = 4
total = price * count
price = 50
print(total)`}</Code>
          <p>Changing price after total is computed does not change total. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 180 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x = 5
x = x + 2
y = x * 2
x = 1
print(x, y)`}</Code>
          <p>Each line runs once, top to bottom. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 14", "1 2", "7 14", "1 10"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a program that sets <C>rent</C> to 15000 and <C>food</C> to 6500, works out <C>total</C> as their sum, and prints <C>Monthly: 21500</C> using <C>print("Monthly:", total)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `rent = 15000
food = 6500
`,
        solution: `rent = 15000
food = 6500
total = rent + food
print("Monthly:", total)
`,
        tests: [
          { name: "variable", code: `assert total == 21500, 'total should be rent + food.'` },
          { name: "output", code: `assert printed.strip() == 'Monthly: 21500', 'Print exactly Monthly: 21500.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>to_fahrenheit(c)</C>, which converts a Celsius temperature to Fahrenheit with F = C × 9/5 + 32, and <C>to_celsius(f)</C>, which converts back with C = (F − 32) × 5/9. Round each result to one decimal place with <C>round(x, 1)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def to_fahrenheit(c):
    return c

def to_celsius(f):
    return f
`,
        solution: `def to_fahrenheit(c):
    return round(c * 9 / 5 + 32, 1)

def to_celsius(f):
    return round((f - 32) * 5 / 9, 1)
`,
        tests: [
          { name: "to F", code: `assert to_fahrenheit(100) == 212.0 and to_fahrenheit(37.5) == 99.5 and to_fahrenheit(-40) == -40.0, 'F = C × 9/5 + 32.'` },
          { name: "to C", code: `assert to_celsius(212) == 100.0 and to_celsius(98.6) == 37.0 and to_celsius(0) == -17.8, 'C = (F − 32) × 5/9, rounded to one place.'` },
        ],
      },
    },
    {
      key: "literal",
      rung: "prove",
      prompt: (
        <p>
          Explain why a computer does what a program says rather than what its author meant. Give an example of an
          instruction that a person would understand but that is too vague or out of order for a computer, and rewrite it
          precisely.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that the computer has no knowledge of the author's intention and follows each instruction exactly.",
          "Gives an instruction that relies on common sense, unstated context, or a sensible reordering by the reader.",
          "Rewrites it so that every step, quantity and object is stated and the steps are in an order that works.",
        ],
      },
    },
    {
      key: "swap3",
      rung: "stretch",
      prompt: (
        <>
          <p>What number does this program print? Trace it one line at a time.</p>
          <Code>{`
a = 3
b = 7
t = a
a = b
b = t
print(a * 10 + b)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 73 },
    },
  ],

  teachBack:
    "Explain to a friend what a program is, why the order of its lines matters, and what the interpreter does with it.",

  glimpse: (
    <p>
      Next, the values a program works with: numbers, text and truth values, and the names that hold them. In Python, NumPy
      and the Command Line you will run programs from the terminal like a professional, and in Computer Systems you will see
      what the processor actually does with them.
    </p>
  ),
};
