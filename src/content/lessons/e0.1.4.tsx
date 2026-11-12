import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.1.4";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

export const lesson: LessonContent = {
  id: "e0.1.4",
  minutes: 45,
  links: {
    revisits: ["e0.1.2", "e0.1.3"],
    foreshadows: ["e1.1.3", "e0.5.1"],
  },

  puzzle: (
    <>
      <p>
        A program asks you &ldquo;How old are you?&rdquo; and you type 16. It then tries to work out your age next year by
        adding 1, and stops with an error.
      </p>
      <p>
        You typed a number, and adding 1 to a number is surely fine. What could the program have received from the keyboard
        that makes adding 1 an error? Think about what a keyboard actually sends.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A keyboard sends characters. When you type 16, the program receives the two characters &ldquo;1&rdquo; and
        &ldquo;6&rdquo;, a string, not the number sixteen. Python cannot know whether you meant a number, a name or a phone
        number, so it hands you the text and leaves the converting to you.
      </p>
      <p>
        In the program below, the user types two answers. Watch the type of <C>year</C> when it arrives, and the line that
        converts it.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="input">
        <p>
          <C>input(prompt)</C> prints the prompt, waits for the user to type a line and press Enter, and returns the line as
          a <strong>str</strong>, without the Enter. To use the answer as a number, convert it with <C>int</C> or{" "}
          <C>float</C>. If the text is not a valid number, such as <C>int(&quot;sixteen&quot;)</C>, the conversion stops
          with a <C>ValueError</C>; a later lesson shows how to handle that.
        </p>
      </Definition>

      <Definition title="print">
        <p>
          <C>print(a, b, c)</C> writes the values separated by single spaces and then moves to a new line. Two optional
          arguments change this: <C>sep</C> is put between values and <C>end</C> is put after the last one.
        </p>
        <Playground code={`
print("a", "b", sep="-")    # a-b
print("Hi", end="")
print("there")              # Hithere
`} />
      </Definition>

      <Definition title="f-strings">
        <p>
          A string with an <C>f</C> before its opening quotation mark is a <strong>formatted string</strong>. Any expression
          inside curly brackets is evaluated and its value inserted. After a colon, a <strong>format specification</strong>{" "}
          controls how it looks:
        </p>
        <Code>{`
f"{3.14159:.2f}"     # '3.14'       two decimal places
f"{1234567:,}"       # '1,234,567'  thousands separators
f"[{42:>6}]"         # '[    42]'   right-aligned in 6 places
`}</Code>
      </Definition>

      <Example title="a tip calculator">
        <Code>{`
bill = float(input("Bill in rupees? "))
tip = bill * 0.10
print(f"Tip: {tip:.2f}, total: {bill + tip:.2f}")
`}</Code>
        <p>
          If the user types 1250, the program prints <C>Tip: 125.00, total: 1375.00</C>. The conversion happens as soon as
          the text arrives, so the rest of the program works only with numbers. Converting at the edge, where data enters
          the program, is a good habit.
        </p>
      </Example>

      <Remark title="programs talking to programs">
        <p>
          Underneath, <C>print</C> writes to a stream called <em>standard output</em> and <C>input</C> reads from{" "}
          <em>standard input</em>. Usually these are the screen and the keyboard, but the terminal can connect them to files
          or to other programs instead, so that the output of one program becomes the input of the next. Much of the
          tooling around large models is built from small programs joined this way.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "inputtype",
      rung: "check",
      prompt: <p>What is the type of the value returned by <C>input</C>?</p>,
      answer: { kind: "choice", options: ["int", "float", "str", "It depends on what the user types"], correct: [2] },
    },
    {
      key: "sep",
      rung: "check",
      prompt: <p>What does <C>print(&quot;a&quot;, &quot;b&quot;, sep=&quot;-&quot;)</C> print?</p>,
      answer: { kind: "choice", options: ["a-b", "a b", "a - b", "ab"], correct: [0] },
    },
    {
      key: "twice",
      rung: "apply",
      prompt: (
        <>
          <p>The user types 12 and presses Enter. What does the program print after the prompt?</p>
          <Code>{`
n = input("Number? ")
print(n * 2)
`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["24", "1212", "An error"], correct: [1] },
    },
    {
      key: "fmt",
      rung: "apply",
      prompt: <p>What number is shown by <C>f&quot;{"{"}3.14159:.2f{"}"}&quot;</C>?</p>,
      answer: { kind: "numeric", value: 3.14 },
    },
    {
      key: "end",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
print("Hi", end="")
print("there")
`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["Hithere", "Hi there", "Hi, then there on the next line"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`name = "Asha"
score = 9.5
print(f"{name} scored {score:.0f}", end="!")
print(" Done")`}</Code>
          <p>An f-string, a format and a changed line ending. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["Asha scored 10! Done", "Asha scored 9.5! Done", "Asha scored 10 Done", "Asha scored 9! Done"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`name, score = "Asha", 7.256
print(f"{name:>6}|{score:.1f}|{score:6.2f}|{42:03d}")`}</Code>
          <p>Format specifications in an f-string: width, alignment and decimals. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["  Asha|7.3|  7.26|042", "Asha  |7.3|7.26  |042", "  Asha|7.2|  7.25|42", "  Asha|7.3|7.26|042"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Given <C>item</C> and <C>price</C>, print one line of a bill like <C>Tea: Rs 12.50</C>, with the price shown to two decimal places, using an f-string.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `item = "Tea"
price = 12.5
print(item, price)
`,
        solution: `item = "Tea"
price = 12.5
print(f"{item}: Rs {price:.2f}")
`,
        tests: [
          { name: "format", code: `assert printed.strip() == 'Tea: Rs 12.50', 'Use {price:.2f} for two decimal places.'` },
          { name: "one line", code: `assert item == 'Tea' and price == 12.5 and printed.count('\\n') == 1, 'Print exactly one line, and keep the variables as given.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Format a receipt with f-strings. Write <C>item_line(name, qty, price)</C>, the line <C>{`f"{name:<10}{qty:>3}{qty * price:>8.2f}"`}</C> with the name cut to its first 10 characters (<C>name[:10]</C>), and <C>total_line(total)</C>, the line <C>{`f"{'TOTAL':<13}{total:>8.2f}"`}</C>. Every line is then 21 characters wide.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def item_line(name, qty, price):
    return name

def total_line(total):
    return 'TOTAL'
`,
        solution: `def item_line(name, qty, price):
    return f'{name[:10]:<10}{qty:>3}{qty * price:>8.2f}'

def total_line(total):
    return f"{'TOTAL':<13}{total:>8.2f}"
`,
        tests: [
          { name: "item", code: `assert item_line('Tea', 2, 12.5) == 'Tea         2   25.00' and item_line('Samosa', 3, 15) == 'Samosa      3   45.00', 'Columns of width 10, 3 and 8.'` },
          { name: "long name", code: `assert item_line('Masala dosa extra', 1, 120) == 'Masala dos  1  120.00', 'Cut the name to 10 characters.'` },
          { name: "total", code: `assert total_line(70) == 'TOTAL           70.00' and total_line(0) == 'TOTAL            0.00' and len(total_line(1234.5)) == 21, 'TOTAL in 13 columns, then the amount in 8.'` },
        ],
      },
    },
    {
      key: "gst",
      rung: "prove",
      prompt: (
        <p>
          Describe a program that asks for a price and a quantity, adds 18% GST, and prints the total with two decimal
          places. Write its lines, and explain where and why each conversion between strings and numbers happens.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Reads both answers with input and converts them, for example with float for the price and int for the quantity.",
          "Explains that input returns strings, so arithmetic on them would fail or repeat text instead of multiplying.",
          "Computes the total as price times quantity times 1.18 (or adds 18% of the subtotal).",
          "Prints using an f-string with :.2f, or equivalent rounding, to show two decimal places.",
        ],
      },
    },
    {
      key: "third",
      rung: "stretch",
      prompt: <p>What number is shown by <C>f&quot;{"{"}7 / 3:.3f{"}"}&quot;</C>?</p>,
      answer: { kind: "numeric", value: 2.333, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why input always gives a string, how to turn it into a number, and how print and f-strings control what the user sees.",

  glimpse: (
    <p>
      This completes First programs. Next, programs that make decisions with if and else. In Python, NumPy and the Command
      Line you will connect programs together with pipes, and later in this course you will read and write files instead of
      the keyboard and screen.
    </p>
  ),
};
