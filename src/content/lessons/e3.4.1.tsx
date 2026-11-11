import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ForkViz } from "@/components/viz/ForkViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.4.1",
  minutes: 60,
  links: {
    requires: ["e3.3.3"],
    revisits: ["e3.2.1", "e3.2.3"],
    foreshadows: ["e3.4.2", "e3.5.1", "e4.5.3"],
  },

  puzzle: (
    <>
      <p>
        Your laptop runs hundreds of programs at once on a handful of cores. A PyTorch <C>DataLoader</C> with{" "}
        <C>num_workers=8</C> starts eight copies of your Python program in a fraction of a second, even though the dataset
        object they all hold may be gigabytes. And in C, a single call to <C>fork()</C> returns twice. What is a running
        program, from the operating system&rsquo;s point of view, and how does one become two?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>process</strong> is a running program together with everything the operating system keeps for it: its own
        virtual address space, open files, a process id, and one or more <strong>threads</strong>. A thread is a flow of
        execution: a program counter, registers and a stack. Threads of one process share its memory; separate processes do
        not. On Unix a process is created by <C>fork()</C>, which copies the calling process: both copies continue from the
        same line, and fork returns 0 in the child and the child&rsquo;s id in the parent. Put fork in a loop below.
      </p>
      <ForkViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the process lifecycle">
        <Code>{`pid = fork()            # now two processes
if pid == 0:
    exec(program, args)  # child: replace its memory with a new program
else:
    status = wait(pid)   # parent: block until the child exits`}</Code>
        <p>
          <C>exec</C> loads a new program into the calling process, keeping its pid and open files; this is how a shell runs
          a command. A process that exits becomes a <strong>zombie</strong>: its memory is freed, but its exit status waits in
          the process table until the parent collects it with <C>wait</C>. If the parent dies first, the orphan is adopted by
          process 1 (init), which reaps it. Each process is in one of a few states: running on a core, ready to run, or
          blocked waiting for something such as disk, network or a child.
        </p>
      </Definition>

      <Theorem title="forks in a loop">
        <p>
          If every process executes <C>for i in range(n): fork(); print()</C>, starting from one process, then{" "}
          <M>{"2^n"}</M> processes exist at the end and <M>{"2^{n+1} - 2"}</M> lines are printed.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction, <M>{"2^i"}</M> processes are at the top of iteration i: true for i = 0, and each of them forks once,
          each fork adding one process, so <M>{"2^{i+1}"}</M> reach the print and the next iteration. Each of those prints
          once, so iteration i prints <M>{"2^{i+1}"}</M> lines, and the total is{" "}
          <M>{"2 + 4 + \\cdots + 2^n = 2^{n+1} - 2"}</M>.
        </p>
      </Proof>

      <Example title="threads versus processes">
        <p>
          Creating a thread is cheap and its threads share every object, so they communicate by simply reading and writing
          memory, which is also why they need locks. Processes are isolated: a crash or a stray write in one cannot corrupt
          another, and they communicate through pipes, sockets, files or explicitly shared memory. In CPython the global
          interpreter lock lets only one thread run Python bytecode at a time, so CPU-heavy Python code uses processes, through{" "}
          <C>multiprocessing</C>, while threads suit waiting on I/O.
        </p>
      </Example>

      <Remark title="fork and copy-on-write in practice">
        <p>
          fork is fast because it copies the page table, not the memory: pages are shared read-only and copied only on write.
          DataLoader workers start this way. But CPython writes a reference count into every object it touches, so merely
          reading a large list of Python objects in a worker gradually copies its pages, and memory use grows with the number
          of workers. Keeping data in NumPy arrays or tensors, which are a few objects holding large buffers, avoids this.
          CUDA cannot survive fork, which is why <C>multiprocessing</C> uses the spawn start method with GPUs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>A C program calls <C>fork();</C> three times in a row, unconditionally, and then each process prints one line. How many lines are printed?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "loop",
      rung: "apply",
      prompt: <p>Every process runs <C>for (int i = 0; i &lt; 3; i++) {"{"} fork(); printf(&quot;x\n&quot;); {"}"}</C>, starting from one process. How many lines are printed in total?</p>,
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "brk",
      rung: "apply",
      prompt: <p>Starting from one process, how many processes in total (including the original) run <C>for (int i = 0; i &lt; 4; i++) if (fork() == 0) break;</C>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import multiprocessing as mp
import os
import threading

counter = [0]

def work(n):
    counter[0] += n

t = threading.Thread(target=work, args=(5,))
t.start()
t.join()
p = mp.Process(target=work, args=(7,))
p.start()
p.join()
print(counter[0], p.exitcode, t.is_alive(), p.pid != os.getpid())`}</Code>
          <p>A thread and a process run the same function on Linux. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5 0 False True", "12 0 False True", "5 None False True", "12 0 True True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    int x = 1;
    pid_t pid = fork();
    if (pid == 0) {                 /* child */
        x += 10;
        printf("child %d ", x);
        fflush(stdout);
        exit(3);
    }
    int status;
    waitpid(pid, &status, 0);       /* parent waits for the child */
    printf("parent %d %d ", x, WEXITSTATUS(status));
    fflush(stdout);

    int fd[2];
    pipe(fd);
    pid_t a = fork();
    pid_t b = fork();
    write(fd[1], "x", 1);           /* every process writes one byte */
    while (wait(NULL) > 0) {}       /* and waits for its own children */
    if (a == 0 || b == 0) exit(0);
    close(fd[1]);
    char buf[16];
    printf("%zd", read(fd[0], buf, sizeof buf));
    return 0;
}`}</Code>
          <p>fork, wait and a pipe. What does this C program print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["child 11 parent 1 3 4", "child 11 parent 11 3 4", "child 11 parent 1 0 4", "child 11 parent 1 3 3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>ProcessTable</C> modelling Unix process bookkeeping. It starts with init, pid 1.{" "}
            <C>spawn(parent)</C> returns a new pid (2, 3, … never reused) and raises <C>ValueError</C> unless the parent is
            running. <C>exit(pid, status)</C> makes a process a zombie; its children are adopted by init; init reaps its
            zombie children at once. <C>wait(parent)</C> reaps the lowest-numbered zombie child and returns{" "}
            <C>(pid, status)</C>, returns None if it has children but none has exited, and raises{" "}
            <C>ChildProcessError</C> if it has none. <C>state(pid)</C> is <C>&apos;running&apos;</C>,{" "}
            <C>&apos;zombie&apos;</C> or None. Exiting init or a process that is not running is a <C>ValueError</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class ProcessTable:
    def __init__(self):
        self.next_pid = 2

    def state(self, pid):
        return 'running'

    def spawn(self, parent):
        self.next_pid += 1
        return self.next_pid - 1

    def exit(self, pid, status=0):
        pass

    def wait(self, parent):
        return None
`,
        solution: `class ProcessTable:
    def __init__(self):
        self.parent = {1: 0}
        self.status = {}            # pid -> exit status, for zombies
        self.next_pid = 2

    def state(self, pid):
        if pid not in self.parent:
            return None
        return 'zombie' if pid in self.status else 'running'

    def children(self, pid):
        return sorted(c for c, p in self.parent.items() if p == pid)

    def spawn(self, parent):
        if self.state(parent) != 'running':
            raise ValueError(f'process {parent} is not running')
        pid = self.next_pid
        self.next_pid += 1
        self.parent[pid] = parent
        return pid

    def exit(self, pid, status=0):
        if pid == 1 or self.state(pid) != 'running':
            raise ValueError(f'process {pid} cannot exit')
        self.status[pid] = status
        for c in self.children(pid):
            self.parent[c] = 1
            if c in self.status:
                self._reap(c)
        if self.parent[pid] == 1:
            self._reap(pid)

    def _reap(self, pid):
        del self.parent[pid]
        return pid, self.status.pop(pid)

    def wait(self, parent):
        kids = self.children(parent)
        if not kids:
            raise ChildProcessError(f'process {parent} has no children')
        for c in kids:
            if c in self.status:
                return self._reap(c)
        return None
`,
        tests: [
          { name: "zombies and wait", code: `pt = ProcessTable()
a = pt.spawn(1)
b = pt.spawn(a)
c = pt.spawn(a)
assert (a, b, c) == (2, 3, 4), 'pids count up from 2.'
assert pt.state(b) == 'running'
assert pt.wait(a) is None, 'Children still running: wait would block, so return None.'
pt.exit(c, 7)
assert pt.state(c) == 'zombie', 'An exited child stays a zombie until its parent waits.'
pt.exit(b, 3)
assert pt.wait(a) == (b, 3), 'wait reaps the lowest-numbered zombie child first.'
assert pt.wait(a) == (c, 7)
assert pt.state(b) is None and pt.state(c) is None, 'Reaped processes are gone.'
try:
    pt.wait(a)
    assert False, 'No children left: ChildProcessError.'
except ChildProcessError:
    pass
for bad in [lambda: pt.spawn(b), lambda: pt.exit(1), lambda: pt.exit(b)]:
    try:
        bad()
        assert False, 'Spawning from or exiting a missing process, or exiting init, is a ValueError.'
    except ValueError:
        pass` },
          { name: "orphans", code: `pt = ProcessTable()
a = pt.spawn(1)
b = pt.spawn(a)
c = pt.spawn(a)
pt.exit(c, 1)
pt.exit(a, 0)
assert pt.state(a) is None, 'A child of init is reaped by init at once.'
assert pt.state(b) == 'running', 'An orphan keeps running.'
assert pt.state(c) is None, 'A zombie orphan is reaped by init.'
pt.exit(b, 5)
assert pt.state(b) is None, 'b was adopted by init, which reaps it.'
d = pt.spawn(1)
e = pt.spawn(d)
f = pt.spawn(e)
pt.exit(f, 9)
pt.exit(e, 0)
assert pt.state(f) is None and pt.state(e) == 'zombie', 'f is adopted and reaped; e waits for d.'
assert pt.wait(d) == (e, 0)
assert d == 5 and pt.spawn(d) == 8, 'pids are never reused here.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>run_forks(program)</C>, which runs a tiny language and returns{" "}
            <C>(processes created including the first, lines printed)</C>. A program is a list of statements:
          </p>
          <ul>
            <li><C>&apos;print&apos;</C>, <C>&apos;exit&apos;</C> (the process ends), <C>&apos;fork&apos;</C> (both copies carry on);</li>
            <li><C>(&apos;child&apos;, body)</C>: fork, and only the child runs body, then carries on after the statement as the parent does;</li>
            <li><C>(&apos;repeat&apos;, n, body)</C>: run body n times.</li>
          </ul>
          <p>Raise <C>ValueError</C> for anything else.</p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def run_forks(program):
    forks = sum(1 for s in program if s == 'fork')
    prints = sum(1 for s in program if s == 'print')
    return 1 + forks, prints
`,
        solution: `def run_forks(program):
    # each process is a stack of [statements, next index, repeats left] frames
    procs = [[[program, 0, 1]]]
    total, prints = 1, 0
    while procs:
        stack = procs.pop()
        while stack:
            frame = stack[-1]
            body, i, left = frame
            if i == len(body):
                if left > 1:
                    frame[1], frame[2] = 0, left - 1
                else:
                    stack.pop()
                continue
            frame[1] += 1
            s = body[i]
            if s == 'print':
                prints += 1
            elif s == 'exit':
                break
            elif s == 'fork':
                total += 1
                procs.append([f[:] for f in stack])
            elif s[0] == 'child':
                total += 1
                child = [f[:] for f in stack]
                child.append([s[1], 0, 1])
                procs.append(child)
            elif s[0] == 'repeat':
                if s[1] > 0:
                    stack.append([s[2], 0, s[1]])
            else:
                raise ValueError(f'unknown statement {s!r}')
    return total, prints
`,
        tests: [
          { name: "fork and repeat", code: `assert run_forks([]) == (1, 0)
assert run_forks(['print']) == (1, 1)
assert run_forks(['fork', 'print']) == (2, 2), 'Both processes print.'
assert run_forks(['fork', 'fork', 'fork', 'print']) == (8, 8)
assert run_forks(['print', 'fork', 'print', 'fork', 'print']) == (4, 7), '1 + 2 + 4 lines.'
assert run_forks([('repeat', 3, ['fork', 'print'])]) == (8, 14), 'The loop: 2 + 4 + 8 prints.'
assert run_forks([('repeat', 0, ['fork'])]) == (1, 0)
assert run_forks([('repeat', 2, [('repeat', 2, ['fork'])]), 'print']) == (16, 16), 'Nested loops: four forks in sequence.'` },
          { name: "child bodies and exit", code: `assert run_forks([('child', ['print', 'exit']), 'print']) == (2, 2)
assert run_forks([('child', ['print']), 'print']) == (2, 3), 'Without exit, the child carries on after the if.'
assert run_forks([('repeat', 4, [('child', ['exit'])])]) == (5, 0), 'Only the parent keeps forking.'
assert run_forks([('repeat', 3, [('child', ['print', 'exit'])]), 'print']) == (4, 4)
assert run_forks(['fork', ('child', ['exit']), 'print']) == (4, 2)
assert run_forks([('repeat', 2, ['fork', ('child', ['print', 'exit'])])]) == (10, 6), 'Two rounds: 2 then 4 processes fork, and each also makes a printing child.'
assert run_forks([('repeat', 3, ['fork', 'exit', 'print'])]) == (2, 0), 'exit ends a process even inside a loop.'
try:
    run_forks(['spawn'])
    assert False, 'Unknown statements raise ValueError.'
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "breakproof",
      rung: "prove",
      prompt: <p>Starting from one process, every process runs <C>for i in range(n): if fork() != 0: break</C> (now the parent leaves the loop). Prove that exactly n + 1 processes are created in total, and that they form a chain in which each process is the parent of the next.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows by induction that exactly one process is in the loop at the top of each iteration.",
          "That process forks: the parent (fork returns non-zero) breaks out, and only the child continues to the next iteration.",
          "So each iteration creates one process, giving 1 + n in total.",
          "Each new process is the child of the process that was in the loop in the previous iteration, so they form a chain of length n + 1.",
        ],
      },
    },
    {
      key: "cow",
      rung: "stretch",
      prompt: <p>A training script loads a list of 10 million Python strings (2 GB) and forks 8 DataLoader workers, each of which only reads the list. Explain why total memory can approach 18 GB over an epoch, and propose two fixes.</p>,
      answer: {
        kind: "written",
        rubric: [
          "fork shares pages copy-on-write, so at first the workers use almost no extra memory.",
          "Reading a Python object increments and decrements its reference count, a write to the page holding it, which copies that page into the worker.",
          "Over an epoch every page is touched, so each worker ends with its own 2 GB copy: about 2 + 8 × 2 = 18 GB.",
          "Fixes: store the data as a few large NumPy arrays (offsets plus one byte buffer), or memory-map it from a file, or use gc.freeze; any two sound ones count.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what fork() does and why a loop of three forks ends with eight processes.",

  glimpse: (
    <p>
      Hundreds of processes and only a few cores. Next, scheduling: how the operating system decides who runs next, and
      what it trades off in doing so.
    </p>
  ),
};
