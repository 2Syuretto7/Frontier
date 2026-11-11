import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShellViz } from "@/components/viz/ShellViz";
import { PIPE_FILES } from "@/content/fixtures/shell";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.1.3",
  minutes: 55,
  links: {
    requires: ["e1.1.2"],
    revisits: ["e0.5.2"],
    parallels: ["m4.5.1"],
    foreshadows: ["e1.7.3", "e1.2.1"],
  },

  puzzle: (
    <>
      <p>
        A file <C>orders.csv</C> holds one order per line: the date, the city and the amount. You want to know which city
        ordered most often.
      </p>
      <p>
        You could write a Python program. Could you instead combine a few tiny commands, each doing one job, so that the output
        of one becomes the input of the next?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Unix commands are built to be chained. Each reads lines, does one thing to them, and writes lines. The pipe symbol{" "}
        <C>|</C> connects one command&rsquo;s output to the next one&rsquo;s input, so a few small tools add up to a
        program written in one line.
      </p>
      <ShellViz
        files={PIPE_FILES}
        stages
        script={[
          "cat orders.csv",
          "grep Pune orders.csv | wc -l",
          "grep -v date orders.csv | cut -d , -f 2 | sort | uniq -c | sort -rn",
          "grep -v date orders.csv | cut -d , -f 2 | sort | uniq -c | sort -rn > counts.txt",
          "cat counts.txt",
          "cat city.sh",
          "./city.sh Delhi",
          "./city.sh Kochi || echo none",
        ]}
        caption="For each pipeline, the indented block shows what flowed out of every stage before the last."
      />
    </>
  ),

  theory: (
    <>
      <Definition title="streams and redirection">
        <p>
          Every process starts with three streams: <strong>standard input</strong> (stdin), <strong>standard output</strong>{" "}
          (stdout) and <strong>standard error</strong> (stderr). By default the first reads the keyboard and the other two write
          to the screen. The shell can reconnect them:
        </p>
        <ul>
          <li><C>cmd &gt; file</C> sends stdout to a file, replacing it; <C>&gt;&gt;</C> appends instead.</li>
          <li><C>cmd &lt; file</C> reads stdin from a file.</li>
          <li><C>cmd 2&gt; errors.log</C> sends stderr to a file.</li>
          <li><C>a | b</C> connects the stdout of <C>a</C> to the stdin of <C>b</C>.</li>
        </ul>
      </Definition>

      <Example title="a toolkit of filters">
        <ul>
          <li><C>grep pattern</C> keeps lines matching a pattern; <C>-v</C> keeps the rest, <C>-c</C> counts, <C>-i</C> ignores case.</li>
          <li><C>cut -d , -f 2</C> keeps the second comma-separated field.</li>
          <li><C>sort</C> sorts lines; <C>-n</C> numerically, <C>-r</C> in reverse.</li>
          <li><C>uniq</C> drops repeated <em>adjacent</em> lines, so it usually follows <C>sort</C>; <C>-c</C> counts them.</li>
          <li><C>head -n 5</C> and <C>tail -n 5</C> keep the first or last lines; <C>wc -l</C> counts lines.</li>
        </ul>
      </Example>

      <Definition title="scripts">
        <p>A script is a file of commands. The first line says which program should run it:</p>
        <Code>{`#!/bin/bash
set -euo pipefail          # stop at the first error, unset variable or failed pipe stage
# Count the orders from one city, given as the first argument
grep -c "$1" orders.csv`}</Code>
        <p>
          Make it executable once with <C>chmod +x city.sh</C>, then run <C>./city.sh Delhi</C>. Inside, <C>$1</C>,{" "}
          <C>$2</C>, &hellip; are the arguments. Quote them, <C>&quot;$1&quot;</C>, so that an argument containing spaces
          stays one word.
        </p>
      </Definition>

      <Definition title="combining by success">
        <p>
          <C>a &amp;&amp; b</C> runs <C>b</C> only if <C>a</C> succeeded (exit status 0). <C>a || b</C> runs <C>b</C> only
          if <C>a</C> failed. <C>grep -c</C> exits with status 1 when it finds nothing, which is why{" "}
          <C>./city.sh Kochi || echo none</C> prints both 0 and none.
        </p>
      </Definition>

      <Remark title="when to stop">
        <p>
          Pipelines are perfect for a quick look at logs and data files: how many lines, which errors, which values. Once the
          logic needs real conditions, loops or numbers with decimals, move to Python. A good rule: if a pipeline no longer fits
          on one line, it wants to be a program.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pipe",
      rung: "check",
      prompt: <p>What does the <C>|</C> in <C>a | b</C> do?</p>,
      answer: { kind: "choice", options: ["Sends the output of a into the input of b", "Runs a, then b, independently", "Runs b only if a fails"], correct: [0] },
    },
    {
      key: "uniq",
      rung: "check",
      prompt: <p>Why does <C>uniq</C> usually come after <C>sort</C>?</p>,
      answer: { kind: "choice", options: ["It only merges repeated lines that are next to each other", "It needs numbers", "It cannot read files"], correct: [0] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>Using the file in the terminal above, what does <C>cut -d , -f 2 orders.csv | sort | uniq | wc -l</C> print? (The header line counts.)</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "delhi",
      rung: "apply",
      prompt: <p>What does <C>grep Delhi orders.csv | cut -d , -f 3 | head -n 1</C> print?</p>,
      answer: { kind: "numeric", value: 1200 },
    },
    {
      key: "append",
      rung: "apply",
      prompt: <p>You run <C>echo a &gt; f.txt</C>, then <C>echo b &gt;&gt; f.txt</C>, then <C>echo c &gt; f.txt</C>. How many lines does <C>f.txt</C> have?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`text = "b\\na\\nb\\nc\\nb\\n"
lines = sorted(text.split())
uniq = [l for i, l in enumerate(lines) if i == 0 or l != lines[i - 1]]
print(len(uniq))`}</Code>
          <p>This is sort | uniq | wc -l written in Python. What does it print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>pipeline(text, *stages)</C>, which feeds text through each stage function in turn, like a shell pipe. Then write <C>grep(word)</C>, which returns a stage keeping only the lines containing <C>word</C>, and <C>wc_l(text)</C>, which counts lines.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def pipeline(text, *stages):
    return text

def grep(word):
    return lambda text: text

def wc_l(text):
    return 0
`,
        solution: `def pipeline(text, *stages):
    for stage in stages:
        text = stage(text)
    return text

def grep(word):
    return lambda text: ''.join(l for l in text.splitlines(keepends=True) if word in l)

def wc_l(text):
    return text.count('\\n')
`,
        tests: [
          { name: "grep", code: `assert grep('err')('ok\\nerror 1\\nerr 2\\n') == 'error 1\\nerr 2\\n', 'Keep whole lines, newlines included.'` },
          { name: "pipe", code: `log = 'INFO a\\nERROR b\\nINFO c\\nERROR d\\n'
assert pipeline(log, grep('ERROR'), wc_l) == 2, 'Each stage receives the previous stage’s output.'` },
        ],
      },
    },
    {
      key: "script",
      rung: "prove",
      prompt: (
        <p>
          Write a script <C>top_cities.sh</C> that takes a CSV file name and a number <C>N</C> as arguments and prints the{" "}
          <C>N</C> cities with the most orders. Explain each stage, how you make it runnable, and why the arguments are quoted.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Begins with a #!/bin/bash line, and ideally set -euo pipefail.",
          "Uses a pipeline such as grep -v date \"$1\" | cut -d , -f 2 | sort | uniq -c | sort -rn | head -n \"$2\", explaining each stage.",
          "Makes it executable with chmod +x and runs it as ./top_cities.sh orders.csv 3.",
          "Explains that quoting \"$1\" keeps a file name with spaces as a single argument.",
        ],
      },
    },
    {
      key: "andor",
      rung: "stretch",
      prompt: <p>In this terminal, <C>./city.sh Pune &amp;&amp; echo found || echo none</C> prints how many lines?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend the three standard streams, what > , >> and | do, and how to turn a pipeline into a script that takes arguments.",

  glimpse: (
    <p>
      Next, running all of this on a machine on the other side of the world, over SSH. SQL, later in this course, asks the same
      questions as these pipelines, of tables far too big for a text file.
    </p>
  ),
};
