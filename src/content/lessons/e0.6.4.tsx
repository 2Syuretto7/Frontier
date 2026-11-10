import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.6.4";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.6.4",
  minutes: 60,
  links: {
    revisits: ["e0.3.4", "e0.4.2", "e0.5.2", "e0.5.3", "e0.6.2"],
    foreshadows: ["e1.2.1", "e4.4.1"],
  },

  puzzle: (
    <>
      <p>
        You have a month of expenses in a spreadsheet saved as <C>expenses.csv</C>, with columns for the date, the
        category and the amount. A few amounts were typed carelessly. You want a file <C>summary.txt</C> with the total
        for each category, in alphabetical order.
      </p>
      <p>
        Before writing any code: what are the stages of this job? What could go wrong with the input? In what order would you
        build and check the pieces?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The job splits into three stages: read the rows, total them by category, write the summary. Each becomes a function
        with a clear input and output, and the main program is one line per stage. A bad amount should be reported and
        skipped, not allowed to crash the program or silently vanish.
      </p>
      <p>
        Here is the finished project, run on a small file in which one amount is <C>abc</C>. Step through it and notice
        how every idea of this course appears: variables, loops, conditionals, functions, lists, tuples, dictionaries,
        strings, files, CSV and exceptions.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="from problem to program">
        <ol>
          <li><strong>Specify.</strong> Write down exactly what goes in, what must come out, and what should happen to bad input.</li>
          <li><strong>Plan.</strong> Break the job into stages, and decide each stage&rsquo;s function: its name, parameters and return value.</li>
          <li><strong>Build one stage at a time.</strong> Start with stubs so the whole program runs early, then replace each stub with real code.</li>
          <li><strong>Test each stage</strong> on its own, with cases chosen as in the testing lesson, before relying on it.</li>
          <li><strong>Handle the unexpected</strong>: catch only the errors you expect, and report what was skipped.</li>
          <li><strong>Review.</strong> Read the whole program again for clarity: names, comments, and anything repeated.</li>
        </ol>
      </Definition>

      <Example title="the specification">
        <p>
          Input: a CSV file with a header <C>date,category,amount</C>. Output: a file with one line per category, in
          alphabetical order, of the form <C>food: 430.00</C>, and the grand total on screen. A row whose amount is not a
          number is reported by date and left out of the totals.
        </p>
      </Example>

      <Example title="testing a stage on its own">
        <p>
          <C>totals_by_category</C> needs no file at all, because it takes a list of tuples. So it can be tested directly:
        </p>
        <Code>{`
assert totals_by_category([]) == {}
assert totals_by_category([("food", 10.0)]) == {"food": 10.0}
assert totals_by_category([("food", 10.0), ("food", 5.5), ("rent", 100.0)]) == {"food": 15.5, "rent": 100.0}
`}</Code>
        <p>
          Keeping file handling out of the middle stage made this possible. Programs whose stages pass plain values to each
          other are easier to test than programs where every function reads and writes files.
        </p>
      </Example>

      <Remark title="what real projects add">
        <p>
          Professional projects use the same process with more support: version control records every change so you can
          undo mistakes and work with others; automated tests run after every change; and code review means someone else
          reads your code before it is used. The next engineering courses teach these tools. But the core is what you have
          done here: a precise specification, small functions, honest handling of bad data, and tests.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>What is the best way to build a program with several stages?</p>,
      answer: {
        kind: "choice",
        options: ["One stage at a time, testing each before moving on", "Write all of it, then run it for the first time", "Write the hardest stage first and skip testing the easy ones"],
        correct: [0],
      },
    },
    {
      key: "good",
      rung: "check",
      prompt: <p>In the traced run, how many rows does <C>read_expenses</C> return?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "food",
      rung: "apply",
      prompt: <p>What is the total for the food category?</p>,
      answer: { kind: "numeric", value: 430 },
    },
    {
      key: "books",
      rung: "apply",
      prompt: <p>The bad amount <C>abc</C> is corrected to <C>75</C>. What total is printed now?</p>,
      answer: { kind: "numeric", value: 625 },
    },
    {
      key: "lines",
      rung: "apply",
      prompt: <p>With the corrected file, how many lines does <C>summary.txt</C> contain?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "extend",
      rung: "prove",
      prompt: (
        <p>
          Extend the project so that it also reports the single largest expense, with its date and category. Say which
          functions change or are added, what each takes and returns, how you would test the new part, and what should
          happen if every row is bad.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Keeps the date in the rows read (for example tuples of date, category and amount), and updates the other functions to match.",
          "Adds a separate function, such as largest_expense(rows), that returns the row with the greatest amount.",
          "Tests the new function directly on small lists, including a tie or a single row.",
          "Handles the empty case, for example by returning None and reporting that there were no valid rows, rather than crashing.",
        ],
      },
    },
    {
      key: "sorted",
      rung: "stretch",
      prompt: (
        <p>
          The categories are <C>travel</C>, <C>food</C>, <C>books</C> and <C>Rent</C>. In what order does{" "}
          <C>sorted</C> put them? (Python compares strings character by character using their Unicode numbers, and capital
          letters have smaller numbers than small ones.)
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["Rent, books, food, travel", "books, food, Rent, travel", "travel, Rent, food, books", "books, food, travel, Rent"],
        correct: [0],
      },
    },
  ],

  teachBack:
    "Explain to a friend how you would go from a problem description to a working program: specifying, planning stages as functions, building and testing one stage at a time, and handling bad input.",

  glimpse: (
    <p>
      This completes Programming from Zero. Python, NumPy and the Command Line follows: the terminal, version control with
      Git, Python in depth, and fast numerical computing. Software Engineering for ML Research later turns the habits of this
      lesson into the practices of a research team.
    </p>
  ),
};
