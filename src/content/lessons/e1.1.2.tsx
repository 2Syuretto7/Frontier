import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShellViz } from "@/components/viz/ShellViz";
import { HOME_FILES } from "@/content/fixtures/shell";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.1.2",
  minutes: 50,
  links: {
    requires: ["e1.1.1"],
    revisits: ["e0.5.1"],
    parallels: ["m4.4.3"],
    foreshadows: ["e1.1.3", "e1.4.2"],
  },

  puzzle: (
    <>
      <p>
        You type <C>rm results.csv</C> to delete an old file, then realise it was the only copy of a week&rsquo;s experiment
        results. You look for the recycle bin.
      </p>
      <p>
        Is there one? Separately: a training script you started an hour ago is still running and you want to stop it, but its
        window is gone. How would you even find it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There is no recycle bin. <C>rm</C> removes the file&rsquo;s name immediately, and the shell assumes you meant it. The
        shell is a sharp tool: it does exactly what you say, so you learn to say exactly what you mean, and to keep copies of
        anything precious.
      </p>
      <p>
        As for the script: every running program is a <strong>process</strong> with a number, and the shell gives you commands
        to list processes and send them signals. First, files.
      </p>
      <ShellViz
        files={HOME_FILES}
        showTree
        script={["mkdir experiments", "touch experiments/run1.log", "cp notes.txt experiments/", "mv experiments/notes.txt experiments/todo.txt", "ls -l experiments", "rm experiments", "rm -r experiments", "ls"]}
        caption="Watch the tree on the right change as files are created, copied, renamed and removed."
      />
    </>
  ),

  theory: (
    <>
      <Definition title="working with files">
        <ul>
          <li><C>mkdir dir</C> makes a directory; <C>mkdir -p a/b/c</C> makes any missing parents too.</li>
          <li><C>touch file</C> creates an empty file, or updates the time stamp of an existing one.</li>
          <li><C>cp src dst</C> copies; if <C>dst</C> is a directory, the copy goes inside it.</li>
          <li><C>mv src dst</C> moves, which is also how you rename.</li>
          <li><C>rm file</C> deletes; <C>rm -r dir</C> deletes a directory and everything in it.</li>
        </ul>
        <p>
          <C>cp</C> and <C>mv</C> overwrite an existing destination without asking, and <C>rm</C> cannot be undone. Add{" "}
          <C>-i</C> to be asked first, and never run <C>rm -r</C> on a path built from a variable you have not printed.
        </p>
      </Definition>

      <Definition title="permissions">
        <p>
          <C>ls -l</C> starts each line with ten characters such as <C>-rwxr-xr--</C>. The first says what it is (<C>-</C>{" "}
          for a file, <C>d</C> for a directory). The next nine are three groups of read, write and execute permission: for
          the file&rsquo;s owner, for its group, and for everyone else.
        </p>
        <p>
          Each group is also written as a digit, adding 4 for <C>r</C>, 2 for <C>w</C> and 1 for <C>x</C>. So{" "}
          <C>rwxr-xr--</C> is 754, and <C>chmod 600 key</C> makes a file readable and writable by its owner only.
        </p>
      </Definition>

      <Definition title="processes">
        <p>
          A <strong>program</strong> is a file; a <strong>process</strong> is a running instance of it, with its own memory and
          a process identifier, the <strong>PID</strong>. The shell is itself a process, and each command you run starts a
          child process.
        </p>
        <Code>{`python train.py &        # start in the background; the shell prints its PID
ps aux | grep train      # find it again later
kill 48213               # politely ask PID 48213 to stop (signal TERM)
kill -9 48213            # force it (signal KILL), only if it ignores the first`}</Code>
        <p>
          <strong>Ctrl-C</strong> sends the interrupt signal to the program in the foreground, and <C>top</C> or{" "}
          <C>htop</C> shows live CPU and memory use. When a process ends it returns an <strong>exit status</strong>: 0 for
          success, anything else for failure.
        </p>
      </Definition>

      <Example title="environment variables">
        <p>
          Every process carries a set of named strings, its environment, which its children inherit. <C>echo $HOME</C> prints
          one. <C>PATH</C> lists the directories searched for commands, which is how typing <C>python</C> finds a program.{" "}
          <C>CUDA_VISIBLE_DEVICES=0 python train.py</C> sets a variable for one command only, here limiting it to the first GPU.
        </p>
      </Example>

      <Remark title="why this matters for training runs">
        <p>
          Long runs are processes that must survive your attention wandering. You will start them in the background or inside{" "}
          <C>tmux</C>, find them with <C>ps</C>, watch them with <C>nvidia-smi</C> and <C>top</C>, and stop them with signals.
          Well-written training scripts catch the TERM signal and save a checkpoint before exiting.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "undo",
      rung: "check",
      prompt: <p>What happens to a file removed with <C>rm</C>?</p>,
      answer: { kind: "choice", options: ["It is gone; the shell has no recycle bin", "It moves to a trash folder", "It is kept until you log out"], correct: [0] },
    },
    {
      key: "rename",
      rung: "check",
      prompt: <p>Which command renames <C>a.txt</C> to <C>b.txt</C>?</p>,
      answer: { kind: "choice", options: ["mv a.txt b.txt", "cp a.txt b.txt", "rename a.txt", "touch b.txt"], correct: [0] },
    },
    {
      key: "octal",
      rung: "apply",
      prompt: <p>What three-digit number does <C>chmod</C> use for the permissions <C>rwxr-x---</C>?</p>,
      answer: { kind: "numeric", value: 750 },
    },
    {
      key: "six44",
      rung: "apply",
      prompt: <p>A file has mode 644. Who may write to it?</p>,
      answer: { kind: "choice", options: ["Only its owner", "Its owner and group", "Everyone", "No one"], correct: [0] },
    },
    {
      key: "exit",
      rung: "apply",
      prompt: <p>A command succeeds. What exit status does it return?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`mode = 0o754
bits = "rwxrwxrwx"
print("".join(b if mode >> (8 - i) & 1 else "-" for i, b in enumerate(bits)))`}</Code>
          <p>File permissions 754 in octal, as ls -l shows them. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["rwxr-xr--", "rwxr-x-r-", "rwxrw-r--", "r-xr-xrwx"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>to_octal(perms)</C>, which turns a 9-character permission string such as <C>"rw-r--r--"</C> into its octal number as an int (here <C>0o644</C>, which is 420).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def to_octal(perms):
    return int(perms.count('r'))
`,
        solution: `def to_octal(perms):
    n = 0
    for ch in perms:
        n = n * 2 + (ch != '-')
    return n
`,
        tests: [
          { name: "644", code: `assert to_octal('rw-r--r--') == 0o644, 'Each character is one bit: set unless it is -.'` },
          { name: "others", code: `assert to_octal('rwxr-xr-x') == 0o755 and to_octal('---------') == 0, 'rwx is 7, r-x is 5.'` },
        ],
      },
    },
    {
      key: "stop",
      rung: "prove",
      prompt: (
        <p>
          A training job you started in the background has stopped improving and you want to stop it without losing its latest
          checkpoint. Describe, command by command, how you find it and stop it, and explain why you try one signal before the
          other.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Finds the process and its PID, for example with ps aux | grep train or with top.",
          "Sends the default TERM signal first with kill PID.",
          "Explains that TERM can be caught, so the program can save a checkpoint and clean up before exiting.",
          "Uses kill -9 only if the process ignores TERM, noting that KILL cannot be caught, so nothing is saved.",
        ],
      },
    },
    {
      key: "perm",
      rung: "stretch",
      prompt: <p>An SSH private key must be readable and writable by its owner and by nobody else. What mode should it have, as three digits?</p>,
      answer: { kind: "numeric", value: 600 },
    },
  ],

  teachBack:
    "Explain to a friend how cp, mv and rm behave, how to read rwxr-xr-x, and what a process and a PID are.",

  glimpse: (
    <p>
      Next, connecting commands with pipes and saving them as scripts. Environments later in this course rely on the PATH variable
      you met here to decide which Python runs.
    </p>
  ),
};
