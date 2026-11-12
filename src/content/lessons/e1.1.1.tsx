import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShellViz } from "@/components/viz/ShellViz";
import { HOME_FILES } from "@/content/fixtures/shell";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.1.1",
  minutes: 45,
  links: {
    requires: ["e0.6.4"],
    revisits: ["e0.1.1"],
    parallels: ["m4.3.3"],
    foreshadows: ["e1.1.2", "e1.1.3", "e1.1.4"],
  },

  puzzle: (
    <>
      <p>
        You rent a GPU machine in a data centre for a training run. When you connect, there is no desktop, no folders to
        click and no mouse: just a line of text ending in <C>$</C> and a blinking cursor.
      </p>
      <p>
        How would you find out where you are, what files are around you, and how to move into the folder that holds your
        code? What would you want such a tool to let you do that clicking cannot?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        That line is a <strong>shell</strong>: a program that reads a command you type, runs it, prints the result and waits
        for the next. Every machine you will train models on is driven this way. It looks bare, but it is precise, it can be
        repeated exactly, and, as the coming lessons show, commands can be combined and saved as programs.
      </p>
      <p>
        Try it below. Press Run to step through a short tour, or type your own commands. Everything happens on a pretend file
        system, so nothing can break.
      </p>
      <ShellViz
        files={HOME_FILES}
        showTree
        script={["pwd", "ls", "ls -a", "cd projects", "ls", "cd mnist", "pwd", "cat README.md", "cd ../..", "cd data", "ls -l", "cd ~", "cd nowhere"]}
        caption="The tree on the right shows the files under your home folder, with the current folder highlighted."
      />
    </>
  ),

  theory: (
    <>
      <Definition title="commands, arguments and options">
        <p>A command line is a sequence of words separated by spaces. The first word names the program; the rest are its arguments.</p>
        <Code>{`ls -l projects
^  ^  ^
|  |  argument: what to list
|  option: how to list it (long format)
command`}</Code>
        <p>
          Options usually begin with <C>-</C> and change how the command behaves. Short options can be combined:{" "}
          <C>ls -la</C> means <C>ls -l -a</C>. Most commands explain themselves with <C>--help</C>, and{" "}
          <C>man ls</C> opens the full manual.
        </p>
      </Definition>

      <Definition title="the file system and paths">
        <p>
          Files live in a tree of <strong>directories</strong> (folders), starting from the root <C>/</C>. A{" "}
          <strong>path</strong> names a place in the tree:
        </p>
        <ul>
          <li>An <strong>absolute</strong> path starts at the root: <C>/home/asha/projects</C>.</li>
          <li>A <strong>relative</strong> path starts at the current directory: <C>projects/mnist</C>.</li>
          <li><C>.</C> means the current directory, <C>..</C> its parent, and <C>~</C> your home directory.</li>
        </ul>
      </Definition>

      <Example title="the first five commands">
        <ul>
          <li><C>pwd</C> prints the working directory: where you are.</li>
          <li><C>ls</C> lists what is here; <C>ls -a</C> includes hidden files, whose names start with a dot; <C>ls -l</C> adds sizes and permissions.</li>
          <li><C>cd path</C> changes directory; <C>cd</C> alone, or <C>cd ~</C>, goes home.</li>
          <li><C>cat file</C> prints a file.</li>
          <li><C>echo words</C> prints its arguments.</li>
        </ul>
      </Example>

      <Remark title="errors are messages, not failures">
        <p>
          When a command fails, it prints a message on its error stream and reports a non-zero <strong>exit status</strong>.
          <C> cd nowhere</C> says exactly what is wrong: there is no such directory. Read error messages word by word; they are
          usually right.
        </p>
      </Remark>

      <Remark title="habits that save hours">
        <p>
          Press <strong>Tab</strong> to complete a file or command name; press it twice to see the choices. Press the up arrow
          to recall earlier commands, and <strong>Ctrl-R</strong> to search them. Avoid spaces in file names, which then need
          quotes every time you type them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pwd",
      rung: "check",
      prompt: <p>Which command tells you which directory you are in?</p>,
      answer: { kind: "choice", options: ["pwd", "ls", "cd", "cat"], correct: [0] },
    },
    {
      key: "hidden",
      rung: "check",
      prompt: <p>Why does <C>ls</C> not show <C>.bashrc</C>?</p>,
      answer: { kind: "choice", options: ["Names beginning with a dot are hidden unless you use ls -a", "It is a directory", "It is empty"], correct: [0] },
    },
    {
      key: "relative",
      rung: "apply",
      prompt: <p>You are in <C>/home/asha/projects/mnist</C> and run <C>cd ../essay</C>. Where are you now?</p>,
      answer: { kind: "choice", options: ["/home/asha/projects/essay", "/home/asha/essay", "/home/asha/projects/mnist/essay"], correct: [0] },
    },
    {
      key: "dotdot",
      rung: "apply",
      prompt: <p>From <C>/home/asha/projects/mnist</C>, how many times must you run <C>cd ..</C> to reach the root <C>/</C>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "words",
      rung: "apply",
      prompt: <p>In <C>ls -l -a projects data</C>, how many arguments follow the command name?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import posixpath
cwd = "/home/asha/projects"
print(posixpath.normpath(posixpath.join(cwd, "../data/./raw")))`}</Code>
          <p>cd ../data/./raw from /home/asha/projects. Where do you end up?</p>
        </>
      ),
      answer: { kind: "choice", options: ["/home/asha/data/raw", "/home/asha/projects/data/raw", "/home/data/raw", "/home/asha/projects/../data/raw"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import shlex
cmd = 'grep -n "hello world" notes.txt | sort'
parts = shlex.split(cmd)
print(len(parts), parts[2], parts[-1])`}</Code>
          <p>How a shell splits a command line into words, quotes included. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6 hello world sort", "7 \"hello sort", "5 hello world sort", "6 \"hello world\" sort"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>cd(cwd, path)</C>, which returns the new working directory after <C>cd path</C> from <C>cwd</C>. Handle absolute paths, <C>.</C> and <C>..</C> yourself, without <C>posixpath</C> or <C>os.path</C>; <C>..</C> at the root stays at the root.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def cd(cwd, path):
    return cwd + '/' + path
`,
        solution: `def cd(cwd, path):
    parts = [] if path.startswith('/') else [p for p in cwd.split('/') if p]
    for p in path.split('/'):
        if p in ('', '.'):
            continue
        if p == '..':
            if parts:
                parts.pop()
        else:
            parts.append(p)
    return '/' + '/'.join(parts)
`,
        tests: [
          { name: "relative", code: `assert cd('/home/asha/projects', '../data/./raw') == '/home/asha/data/raw', '.. goes up one level and . stays put.'` },
          { name: "absolute", code: `assert cd('/home/asha', '/etc') == '/etc', 'A path starting with / ignores the current directory.'` },
          { name: "root", code: `assert cd('/', '../..') == '/', 'You cannot go above the root.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>glob_match(pattern, name)</C>, the shell&rsquo;s wildcard matching without <C>fnmatch</C> or <C>re</C>: <C>*</C> matches any run of characters (including none) and <C>?</C> any one character. A quick way is to keep a list saying, for each prefix of the name, whether the pattern so far matches it, and update the list one pattern character at a time. Then write <C>expand(pattern, names)</C>, the sorted names that match, where (as in a shell) a name starting with <C>.</C> only matches if the pattern also starts with <C>.</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def glob_match(pattern, name):
    return pattern == name

def expand(pattern, names):
    return sorted(n for n in names if glob_match(pattern, n))
`,
        solution: `def glob_match(pattern, name):
    ok = [True] + [False] * len(name)
    for c in pattern:
        if c == '*':
            new = [ok[0]]
            for j in range(1, len(name) + 1):
                new.append(new[j - 1] or ok[j])
        else:
            new = [False]
            for j in range(1, len(name) + 1):
                new.append(ok[j - 1] and (c == '?' or c == name[j - 1]))
        ok = new
    return ok[-1]

def expand(pattern, names):
    return sorted(n for n in names if glob_match(pattern, n) and (not n.startswith('.') or pattern.startswith('.')))
`,
        tests: [
          { name: "basic", code: `assert glob_match('*.py', 'main.py') and not glob_match('*.py', 'main.pyc') and glob_match('data_??.csv', 'data_07.csv') and not glob_match('data_??.csv', 'data_7.csv') and glob_match('*', '') and glob_match('a*b*c', 'aXXbYYc')` },
          { name: "fnmatch", code: `import fnmatch, random
random.seed(1)
for _ in range(3000):
    pat = ''.join(random.choice(['a', 'b', '.', '*', '?']) for _ in range(random.randint(0, 5)))
    name = ''.join(random.choice('ab.') for _ in range(random.randint(0, 6)))
    assert glob_match(pat, name) == fnmatch.fnmatchcase(name, pat), f'{pat!r} on {name!r}'` },
          { name: "dotfiles", code: `names = ['.env', 'a.py', 'b.py', '.hidden.py', 'notes']
assert expand('*.py', names) == ['a.py', 'b.py'] and expand('.*', names) == ['.env', '.hidden.py'] and expand('*', names) == ['a.py', 'b.py', 'notes'], 'A leading dot must be matched explicitly.'` },
          { name: "fast", code: `assert not glob_match('*a*a*a*a*a*a*b', 'a' * 60) and glob_match('*a*a*a*a*a*a*', 'a' * 60), 'Plain recursion tries too many ways here; keep track of prefixes instead.'` },
        ],
      },
    },
    {
      key: "explain",
      rung: "prove",
      prompt: (
        <p>
          A friend says absolute paths are always better because they work from anywhere. Give one situation where an absolute path
          is the right choice and one where a relative path is better, and explain why in each case.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that an absolute path names the same place whatever the current directory, so it suits fixed locations such as a shared dataset directory or a log file named in a configuration.",
          "Explains that a relative path is interpreted from the current directory, so it keeps working when a whole project folder is moved or copied to another machine.",
          "Gives a concrete example of each, such as /data/imagenet for a dataset and data/train.csv inside a project.",
          "Notes that a relative path silently means something else if the command runs from a different directory.",
        ],
      },
    },
    {
      key: "root",
      rung: "stretch",
      prompt: <p>You are in <C>/home/asha</C>. Which path names the same directory as <C>/home/asha/projects</C>? Select all that apply.</p>,
      answer: { kind: "choice", options: ["projects", "./projects", "~/projects", "../asha/projects", "/projects"], correct: [0, 1, 2, 3] },
    },
  ],

  teachBack:
    "Explain to a friend what a shell is, the difference between absolute and relative paths, and what . , .. and ~ mean.",

  glimpse: (
    <p>
      Next, creating, moving and deleting files, and the programs, called processes, that the shell starts. Later in this course
      you will drive a remote GPU machine with nothing but these commands.
    </p>
  ),
};
