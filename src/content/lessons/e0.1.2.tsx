import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.1.2";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.1.2",
  minutes: 45,
  links: {
    revisits: ["e0.1.1"],
    parallels: ["m0.2.1", "m0.1.4"],
    foreshadows: ["e1.3.1", "e3.1.1", "e3.1.2"],
  },

  puzzle: (
    <>
      <p>
        On a calculator, <em>3 + 4</em> is 7. On a phone, if you type 3 into a text box, then 4, you get 34.
      </p>
      <p>
        Both devices store &ldquo;3&rdquo; and &ldquo;4&rdquo;, yet they combine them differently. What does each device
        know about the 3 that makes it behave this way? How might a program keep track of that knowledge?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every piece of data in a program is a <strong>value</strong>, and every value has a <strong>type</strong> that
        says what kind of thing it is and what can be done with it. The number 3 and the text &ldquo;3&rdquo; are
        different values of different types, and <C>+</C> means addition for one and joining for the other.
      </p>
      <p>
        A <strong>variable</strong> is a name attached to a value. Step through the program and watch the names appear
        and change. Strings are shown with their quotation marks, so you can tell <C>&apos;17&apos;</C> from{" "}
        <C>17</C>.
      </p>
      <TraceViz code={code} steps={steps} />
      <p>
        Line 4 is the interesting one. In mathematics, <em>age = age + 1</em> would be a contradiction. In Python,{" "}
        <C>=</C> is an instruction, not a claim: work out the right side, then attach the name on the left to the result.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the basic types">
        <ul>
          <li><strong>int</strong>: a whole number, such as <C>16</C>, <C>-3</C> or <C>0</C>. Python ints can be as large as memory allows.</li>
          <li><strong>float</strong>: a number with a decimal point, such as <C>1.62</C> or <C>3.0</C>. Floats are stored in binary with about 16 significant digits, so they are approximate.</li>
          <li><strong>str</strong>: a string of characters, written in single or double quotation marks, such as <C>&quot;Asha&quot;</C> or <C>&apos;7&apos;</C>.</li>
          <li><strong>bool</strong>: a truth value, either <C>True</C> or <C>False</C>.</li>
        </ul>
        <p>
          The function <C>type</C> reports the type of any value: <C>type(3.0)</C> is <C>float</C>.
        </p>
      </Definition>

      <Definition title="assignment">
        <p>
          The statement <C>name = expression</C> is an <strong>assignment</strong>. Python evaluates the expression on the
          right, then binds the name on the left to the resulting value, replacing any value the name had before. A name
          must be assigned before it is used. A variable has no fixed type of its own: <C>x = 5</C> followed by{" "}
          <C>x = &quot;five&quot;</C> is allowed, and afterwards <C>x</C> refers to a string.
        </p>
      </Definition>

      <Definition title="names">
        <p>
          A variable name may contain letters, digits and underscores, must not start with a digit, and must not be one of
          Python&rsquo;s reserved words such as <C>if</C>, <C>for</C> or <C>class</C>. Case matters: <C>Price</C> and{" "}
          <C>price</C> are different names. Good names say what the value means: <C>total_cost</C>, not <C>tc</C>.
        </p>
      </Definition>

      <Example title="converting between types">
        <p>Functions named after the types convert values from one type to another:</p>
        <Code>{`
int("12") + 3       # 15
str(4) + str(2)     # '42'
float("2.5") * 2    # 5.0
int(3.9)            # 3, the decimal part is dropped
`}</Code>
        <p>
          Mixing types without converting usually fails: <C>&quot;12&quot; + 3</C> stops with a <C>TypeError</C>,
          because Python will not guess whether you meant addition or joining.
        </p>
      </Example>

      <Remark title="floats are approximate">
        <p>
          In Python, <C>0.1 + 0.2</C> gives <C>0.30000000000000004</C>. This is not a bug in Python: 0.1 has no exact
          binary representation, just as one third has no exact decimal one. Never test floats for exact equality; check
          that they are close instead. Machine learning lives with this every day, and choosing how many bits to give each
          float is a serious engineering decision for large models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "type",
      rung: "check",
      prompt: <p>What is the type of the value <C>3.0</C>?</p>,
      answer: { kind: "choice", options: ["int", "float", "str", "bool"], correct: [1] },
    },
    {
      key: "names",
      rung: "check",
      prompt: <p>Select every valid Python variable name.</p>,
      answer: { kind: "choice", options: ["total_cost", "2nd_place", "my-score", "_count", "class", "Price"], correct: [0, 3, 5] },
    },
    {
      key: "rebind",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
x = 5
x = "five"
print(x)
`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["5", "five", "An error, because x is an int", "5five"], correct: [1] },
    },
    {
      key: "convert",
      rung: "apply",
      prompt: <p>What is the value of <C>int(&quot;12&quot;) + 3</C>?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "join",
      rung: "apply",
      prompt: <p>What is the value of <C>str(4) + str(2)</C>?</p>,
      answer: { kind: "choice", options: ["6", "'42'", "42", "An error"], correct: [1] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a = "7"
b = 7
print(a * 2, b * 2, type(a * 2).__name__)`}</Code>
          <p>The same symbol does different things to different types. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["77 14 str", "14 14 int", "77 77 str", "14 77 int"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            The variable <C>raw</C> holds the text <C>"42"</C>. Make <C>n</C> the integer it represents, <C>doubled</C> twice that number, and <C>label</C> the string <C>"42 items"</C> built from <C>raw</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `raw = "42"
n = raw
doubled = n * 2
label = raw
`,
        solution: `raw = "42"
n = int(raw)
doubled = n * 2
label = raw + " items"
`,
        tests: [
          { name: "convert", code: `assert n == 42 and type(n) is int, 'Use int(raw) to turn text into a number.'` },
          { name: "double", code: `assert doubled == 84, 'Doubling the text "42" would give "4242".'` },
          { name: "label", code: `assert label == '42 items', 'Join strings with +, including the space.'` },
        ],
      },
    },
    {
      key: "equals",
      rung: "prove",
      prompt: (
        <p>
          Explain the difference between <em>x = x + 1</em> in mathematics and <C>x = x + 1</C> in Python, and describe
          exactly what Python does when it runs the statement.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that in mathematics the equation is a claim, and it has no solution.",
          "Explains that in Python = is an instruction to assign, not a statement of equality.",
          "Describes the order: evaluate the right side using the current value of x, then bind x to the result.",
          "Notes that x must already have a value, or Python raises an error.",
        ],
      },
    },
    {
      key: "repeat",
      rung: "stretch",
      prompt: (
        <>
          <p>What number does this program print?</p>
          <Code>{`
a = "2"
b = a * 3
print(int(b) + 1)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 223 },
    },
  ],

  teachBack:
    "Explain to a friend the four basic types of Python value, what a variable is, and why x = x + 1 makes sense in Python.",

  glimpse: (
    <p>
      Next, combining values with operators into expressions. In Python, NumPy and the Command Line you will see how Python
      really stores values as objects, and in Computer Systems how ints and floats are laid out in bits.
    </p>
  ),
};
