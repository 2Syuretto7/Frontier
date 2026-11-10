import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BranchViz } from "@/components/viz/BranchViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.2.1",
  minutes: 45,
  links: {
    revisits: ["e0.1.3"],
    parallels: ["l0.3.3", "l0.4.1", "m0.2.4"],
  },

  puzzle: (
    <>
      <p>
        A bus charges no fare for children under 5, half fare of &#8377;20 for anyone aged 60 or over, and &#8377;40 for
        everyone else.
      </p>
      <p>
        Write instructions, in plain words, that a literal-minded helper could follow to charge the right fare for any age.
        What questions must the helper ask, in what order? Does the order matter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        So far every line of every program has run. Real programs must choose: do this if a condition holds, otherwise do
        that. Python&rsquo;s <C>if</C> statement makes the choice, using a condition whose value is <C>True</C> or{" "}
        <C>False</C>.
      </p>
      <p>
        Move the temperature and watch which lines run. Try 35, 34, 25, 24 and 0 especially.
      </p>
      <BranchViz />
      <p>
        At 40 degrees, the second condition, <C>temp &gt;= 25</C>, is also true, yet &ldquo;Warm&rdquo; is not printed.
        Python stops checking as soon as one condition is true. That is why the conditions are ordered from hottest down.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="if, elif and else">
        <Code>{`
if condition_1:
    block_1
elif condition_2:
    block_2
else:
    block_3
`}</Code>
        <p>
          Python evaluates the conditions in order and runs the block of the <em>first</em> one that is true, then skips to
          the line after the whole statement. If none is true, the <C>else</C> block runs. There may be any number of{" "}
          <C>elif</C> parts, and the <C>else</C> part may be left out, in which case nothing runs when every condition is
          false.
        </p>
      </Definition>

      <Definition title="blocks and indentation">
        <p>
          A <strong>block</strong> is a group of lines that belong together. In Python, a block is marked by its
          indentation, conventionally four spaces, and introduced by a line ending in a colon. Indentation is not decoration:
          moving a line in or out changes which block it belongs to, and so changes what the program does. Blocks can contain
          further <C>if</C> statements, indented again, which is called <strong>nesting</strong>.
        </p>
      </Definition>

      <Example title="the bus fare">
        <Code>{`
age = int(input("Age? "))
if age < 5:
    fare = 0
elif age >= 60:
    fare = 20
else:
    fare = 40
print("Fare:", fare)
`}</Code>
        <p>
          For age 70, the first condition is false, the second true, so the fare is 20. Each age reaches exactly one
          assignment, so <C>fare</C> always has a value when it is printed.
        </p>
      </Example>

      <Example title="combining conditions">
        <p>
          A year is a leap year if it is divisible by 4, except that years divisible by 100 are not, except that years
          divisible by 400 are. As one condition:
        </p>
        <Code>{`
leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
`}</Code>
        <p>So 2024 and 2000 are leap years, while 1900 and 2023 are not.</p>
      </Example>

      <Remark title="truthiness">
        <p>
          A condition does not have to be a bool. Python treats <C>0</C>, <C>0.0</C>, the empty string <C>&quot;&quot;</C>{" "}
          and a few other empty values as false, and almost everything else as true. So <C>if name:</C> means &ldquo;if the
          name is not empty&rdquo;. This is convenient, but write the comparison out in full when it makes the meaning
          clearer.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: <p>In the program of the visualisation, what is printed first when <C>temp</C> is 25?</p>,
      answer: { kind: "choice", options: ["Very hot", "Warm", "Mild", "Warm, then Mild"], correct: [1] },
    },
    {
      key: "indent",
      rung: "check",
      prompt: <p>In Python, what tells you which lines belong to the block of an <C>if</C>?</p>,
      answer: { kind: "choice", options: ["Their indentation", "Curly brackets", "A blank line after the block"], correct: [0] },
    },
    {
      key: "twoifs",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
x = 7
if x % 2 == 0:
    print("even")
else:
    print("odd")
if x > 5:
    print("big")
`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["odd, then big", "odd", "even, then big", "big"], correct: [0] },
    },
    {
      key: "order",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
score = 92
if score >= 50:
    grade = "C"
elif score >= 70:
    grade = "B"
elif score >= 90:
    grade = "A"
print(grade)
`}</Code>
        </>
      ),
      answer: { kind: "choice", options: ["A", "B", "C", "A, B and C"], correct: [2] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: (
        <>
          <p>What number does this program print?</p>
          <Code>{`
n = 15
count = 0
if n % 3 == 0:
    count = count + 1
if n % 5 == 0:
    count = count + 2
if n % 7 == 0:
    count = count + 4
print(count)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "fix",
      rung: "prove",
      prompt: (
        <p>
          Explain why the grade program in the exercise above gives every passing student a C, and rewrite it so that 90
          and above is an A, 70 to 89 a B, 50 to 69 a C, and below 50 an F. Explain why your version is correct for every
          score.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that only the first true condition runs, and score >= 50 is true for every passing score, so the later branches are never reached.",
          "Orders the conditions from the highest threshold down (>= 90, then >= 70, then >= 50), with else giving F.",
          "Argues that each score reaches the first threshold it meets, which is the right band because all higher thresholds were already false.",
        ],
      },
    },
    {
      key: "leap",
      rung: "stretch",
      prompt: <p>How many of the years 1900, 2000, 2023 and 2024 are leap years by the rule in the lesson?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend how if, elif and else choose which block runs, why the order of the conditions matters, and what indentation does in Python.",

  glimpse: (
    <p>
      Next, loops, which run a block again and again. The decision trees of How Machines Learn are nothing but nested if
      statements whose conditions were chosen from data, and the expert systems of its history lesson were thousands of them
      written by hand.
    </p>
  ),
};
