import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e0.5.1";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.5.1",
  minutes: 45,
  links: {
    revisits: ["e0.1.4", "e0.4.3"],
    foreshadows: ["e1.1.2", "e3.4.3"],
  },

  puzzle: (
    <>
      <p>
        You write a program that keeps a list of your daily expenses. It works well, but every time you close it and run it
        again, the list is empty.
      </p>
      <p>
        Where do a program&rsquo;s variables live while it runs, and what happens to them when it ends? Where could the
        program put its data so that the next run can find it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Variables live in the computer&rsquo;s working memory, which belongs to the running program and is wiped when it
        ends. To keep data, a program must write it to a <strong>file</strong> on disk, and the next run must read it back.
      </p>
      <p>
        The program below writes two lines to a file, reads them back, and then adds a third. Watch the file object{" "}
        <C>f</C>: it is open inside each <C>with</C> block and closed after it.
      </p>
      <TraceViz code={code} steps={steps} />
    </>
  ),

  theory: (
    <>
      <Definition title="files and paths">
        <p>
          A <strong>file</strong> is a named sequence of bytes kept on a disk. Its <strong>path</strong> says where to find
          it. A plain name such as <C>notes.txt</C> is a <em>relative</em> path, looked for in the folder the program was run
          from, called the working directory. A path such as <C>/home/asha/notes.txt</C> is <em>absolute</em>.
        </p>
      </Definition>

      <Definition title="opening a file">
        <p>
          <C>open(path, mode)</C> returns a file object. The mode says what you intend to do:
        </p>
        <ul>
          <li><C>&quot;r&quot;</C>, the default: read. The file must exist, or Python raises <C>FileNotFoundError</C>.</li>
          <li><C>&quot;w&quot;</C>: write. Creates the file, or <em>empties it first</em> if it already exists.</li>
          <li><C>&quot;a&quot;</C>: append. Creates the file if needed, and adds new text after the existing text.</li>
        </ul>
      </Definition>

      <Definition title="reading and writing">
        <p>
          <C>f.read()</C> returns the whole file as one string, <C>f.readlines()</C> returns a list of lines, and{" "}
          <C>for line in f:</C> visits the lines one at a time, which works even for files too large to fit in memory. Each
          line keeps its newline character at the end; <C>line.strip()</C> removes it. <C>f.write(s)</C> writes the string{" "}
          <C>s</C> exactly, with no newline added, and it accepts only strings, so numbers must be converted with{" "}
          <C>str</C>.
        </p>
      </Definition>

      <Definition title="the with statement">
        <p>
          Writing <C>with open(...) as f:</C> opens the file, runs the indented block, and then <strong>closes</strong> the
          file, even if the block stops with an error. Closing matters: written text may wait in memory until the file is
          closed, and a program that crashes with files open can lose data. Always use <C>with</C>.
        </p>
      </Definition>

      <Example title="saving and loading numbers">
        <Code>{`
with open("nums.txt", "w") as f:
    for i in range(1, 6):
        f.write(str(i * i) + "\\n")

total = 0
with open("nums.txt") as f:
    for line in f:
        total = total + int(line)
print(total)   # 55
`}</Code>
        <p>
          The file holds the text <C>1</C>, <C>4</C>, <C>9</C>, <C>16</C>, <C>25</C> on separate lines. Reading
          gives strings back, so each line is converted with <C>int</C>, which ignores the newline.
        </p>
      </Example>

      <Remark title="text is stored as bytes">
        <p>
          A disk stores bytes, not characters. A text file uses an <em>encoding</em> to turn characters into bytes; almost
          all modern files use UTF-8, which handles every language. If a file opens with strange symbols in place of
          letters, it was probably written in a different encoding; <C>open(path, encoding=&quot;utf-8&quot;)</C> states
          the encoding explicitly. The datasets used to train language models are, at bottom, enormous collections of such
          files.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "wmode",
      rung: "check",
      prompt: <p>What does <C>open(&quot;data.txt&quot;, &quot;w&quot;)</C> do if <C>data.txt</C> already exists?</p>,
      answer: { kind: "choice", options: ["Empties it, ready for new text", "Adds new text at the end", "Raises an error", "Opens it for reading"], correct: [0] },
    },
    {
      key: "with",
      rung: "check",
      prompt: <p>What is the main reason to open files with a <C>with</C> statement?</p>,
      answer: { kind: "choice", options: ["The file is closed automatically when the block ends, even after an error", "It makes reading faster", "It is the only way to write to a file"], correct: [0] },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>After the traced program finishes, how many lines does <C>notes.txt</C> contain?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "newlines",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
with open("log.txt", "w") as f:
    f.write("a")
    f.write("b\\n")
    f.write("c\\n")

with open("log.txt") as f:
    lines = f.readlines()
print(len(lines))
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "twice",
      rung: "apply",
      prompt: <p>The traced program is run a second time, straight after the first. How many lines does <C>notes.txt</C> contain afterwards?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "modes",
      rung: "prove",
      prompt: (
        <p>
          A program appends one line to a log file each time it runs. Its author used mode <C>&quot;w&quot;</C> instead of{" "}
          <C>&quot;a&quot;</C>. Describe what the log will contain after five runs, and why. Then explain why the file
          should be closed after writing, and how <C>with</C> guarantees it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that mode w empties the file each time it is opened, so after five runs only the last run's line remains.",
          "Explains that mode a would keep earlier lines and add the new one at the end.",
          "Explains that written text may be held in memory until the file is closed, so not closing it risks losing data.",
          "Explains that with closes the file when the block ends, even if an error occurs inside it.",
        ],
      },
    },
    {
      key: "squares",
      rung: "stretch",
      prompt: <p>In the example that saves and loads numbers, what would be printed if the first loop were <C>for i in range(1, 11):</C>?</p>,
      answer: { kind: "numeric", value: 385 },
    },
  ],

  teachBack:
    "Explain to a friend why programs need files, what the modes r, w and a do, and why files should be opened with a with statement.",

  glimpse: (
    <p>
      Next, CSV files, the commonest way to store tables of data as text. In Python, NumPy and the Command Line you will
      manage files from the terminal, and in Computer Systems you will see how a file system turns paths into blocks on a
      disk.
    </p>
  ),
};
