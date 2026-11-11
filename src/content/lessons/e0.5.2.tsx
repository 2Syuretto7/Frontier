import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.5.2";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.5.2",
  minutes: 45,
  links: {
    revisits: ["e0.5.1", "e0.4.2", "e0.4.3"],
    parallels: ["m0.8.1"],
    foreshadows: ["e1.7.1", "e1.7.2"],
  },

  puzzle: (
    <>
      <p>A spreadsheet of marks is saved as plain text, one row per line, with commas between the columns:</p>
      <Code>{`
name,maths,physics
Asha,78,85
Ravi,62,70
Meera,91,88
`}</Code>
      <p>
        Using what you know about files and strings, how would you compute the average maths mark? Now suppose a name is
        written <C>&quot;Rao, Asha&quot;</C>, with a comma inside it. What goes wrong with your method?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Reading each line and splitting at commas works until a value itself contains a comma. The CSV format handles that
        by putting such values in quotation marks, and reading it correctly means following those rules exactly. Python&rsquo;s{" "}
        <C>csv</C> module does this for you.
      </p>
      <p>
        Below, the file of the puzzle is read with a <C>DictReader</C>, which turns each row into a dictionary keyed by the
        column names. Look carefully at the values in <C>row</C>.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="CSV">
        <p>
          A <strong>CSV</strong> file, for comma-separated values, stores a table as text: one row per line, with the values
          in each row separated by commas. Usually the first line is a <strong>header</strong> giving the column names. A
          value containing a comma, a quotation mark or a newline is enclosed in double quotation marks, and a quotation
          mark inside it is written twice. Spreadsheet programs and databases can all read and write CSV, which makes it the
          commonest way to exchange tables.
        </p>
      </Definition>

      <Definition title="reading with the csv module">
        <p>
          <C>csv.reader(f)</C> gives each row as a list of strings, header included. <C>csv.DictReader(f)</C> reads the
          header itself and gives each later row as a dictionary from column name to value. Either way, every value is a{" "}
          <strong>string</strong>: CSV has no types, so numbers must be converted with <C>int</C> or <C>float</C>.
        </p>
      </Definition>

      <Definition title="writing">
        <Code>{`
import csv

with open("totals.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "total"])
    writer.writerow(["Asha", 163])
`}</Code>
        <p>
          <C>writerow</C> takes a list of values, converts them to strings, and adds commas and quotation marks where
          needed. Opening the file with <C>newline=&quot;&quot;</C> lets the module control line endings, which avoids
          blank lines between rows on some systems.
        </p>
      </Definition>

      <Example title="why not split at commas">
        <p>
          The line <C>&quot;Rao, Asha&quot;,78,85</C> split with <C>split(&quot;,&quot;)</C> gives four pieces, with the
          name broken in two and stray quotation marks. The <C>csv</C> module gives the three correct values,{" "}
          <C>[&apos;Rao, Asha&apos;, &apos;78&apos;, &apos;85&apos;]</C>. Whenever a format has rules, use a library that
          follows them rather than an approximation that works on the examples you happened to test.
        </p>
      </Example>

      <Remark title="real data is messy">
        <p>
          Real CSV files have missing values, extra spaces, numbers written as <C>1,250</C>, dates in several styles, and
          rows with the wrong number of columns. A program reading them must decide, for each problem, whether to fix,
          skip or reject the row. Much of the work of preparing data for machine learning is exactly this cleaning, done
          carefully and at enormous scale.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "header",
      rung: "check",
      prompt: <p>What does the first line of a typical CSV file contain?</p>,
      answer: { kind: "choice", options: ["The column names", "The number of rows", "The first data row", "The file's encoding"], correct: [0] },
    },
    {
      key: "strtype",
      rung: "check",
      prompt: <p>In the traced program, what is the type of <C>row[&quot;maths&quot;]</C>?</p>,
      answer: { kind: "choice", options: ["str", "int", "float"], correct: [0] },
    },
    {
      key: "physics",
      rung: "apply",
      prompt: <p>Using the same file, what is the average physics mark?</p>,
      answer: { kind: "numeric", value: 81 },
    },
    {
      key: "pieces",
      rung: "apply",
      prompt: <p>How many items are in <C>line.split(&quot;,&quot;)</C> when <C>line</C> is <C>&quot;Rao, Asha&quot;,78,85</C>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "rows",
      rung: "apply",
      prompt: <p>If the marks file is read with <C>csv.reader</C> instead of <C>csv.DictReader</C>, how many rows does the reader give?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import csv, io
data = io.StringIO("city,temp\\nPune,31\\nLeh,4\\nChennai,35\\n")
rows = list(csv.DictReader(data))
print(len(rows), max(rows, key=lambda r: int(r["temp"]))["city"])`}</Code>
          <p>csv.DictReader turns each line after the header into a dictionary. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 Chennai", "4 Chennai", "3 Leh", "3 Pune"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            The file <C>sales.csv</C> has columns <C>region</C> and <C>amount</C>. Write <C>totals(path)</C>, which returns a dictionary from region to the total amount, as floats, using the <C>csv</C> module.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def totals(path):
    return {}
`,
        solution: `import csv

def totals(path):
    out = {}
    with open(path, newline='') as f:
        for row in csv.DictReader(f):
            out[row['region']] = out.get(row['region'], 0.0) + float(row['amount'])
    return out
`,
        tests: [
          { name: "totals", code: `assert totals('sales.csv') == {'North': 120.0, 'South': 40.5}, 'Add each amount, as a float, to its region.'` },
        ],
        setup: `with open('sales.csv', 'w') as f:
    f.write('region,amount\\nNorth,100\\nSouth,40.5\\nNorth,20\\n')
`,
      },
    },
    {
      key: "totals",
      rung: "prove",
      prompt: (
        <p>
          Describe a program that reads <C>marks.csv</C> and writes <C>totals.csv</C>, with a header and one row per student
          giving the name and the sum of the two marks. Write its lines, and point out every place where a value must be
          converted between a string and a number.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Opens marks.csv for reading and totals.csv for writing (with newline=\"\"), using with.",
          "Reads rows with csv.DictReader (or csv.reader, skipping the header).",
          "Converts both marks with int before adding, because CSV values are strings.",
          "Writes a header row and one row per student with csv.writer, noting that writerow turns the number back into text.",
        ],
      },
    },
    {
      key: "diff",
      rung: "stretch",
      prompt: <p>For the marks file, what is the sum over all students of the maths mark minus the physics mark?</p>,
      answer: { kind: "numeric", value: -12 },
    },
  ],

  teachBack:
    "Explain to a friend what a CSV file is, why you should read it with the csv module rather than splitting at commas, and why every value comes back as a string.",

  glimpse: (
    <p>
      Next, errors and exceptions: what happens when something goes wrong, and how a program can recover. In Python, NumPy
      and the Command Line you will load the same kind of table into a dataframe, which does the conversions and summaries
      for you, and clean messy real data.
    </p>
  ),
};
