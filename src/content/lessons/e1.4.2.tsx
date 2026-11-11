import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EnvViz } from "@/components/viz/EnvViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.4.2",
  minutes: 45,
  links: {
    requires: ["e1.4.1"],
    revisits: ["e1.1.2"],
    foreshadows: ["e1.4.3"],
  },

  puzzle: (
    <>
      <p>
        You are reproducing a paper whose code needs NumPy 1.26. Your own project needs NumPy 2. Python can only import one
        version of a module at a time, and <C>pip install</C> replaces whatever version is there.
      </p>
      <p>How can both projects live on one laptop, and both work?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give each project its own private set of installed packages. A <strong>virtual environment</strong> is a folder
        holding a link to a Python interpreter and its own <C>site-packages</C>. Activate it, and <C>python</C> and{" "}
        <C>pip</C> refer to that folder&rsquo;s copies; install something, and it goes only there.
      </p>
      <EnvViz />
    </>
  ),

  theory: (
    <>
      <Definition title="virtual environments">
        <Code>{`python -m venv .venv            # create an environment in the folder .venv
source .venv/bin/activate        # put .venv/bin first on PATH (Windows: .venv\\Scripts\\activate)
which python                     # now .../project/.venv/bin/python
python -m pip install numpy      # installs into .venv only
deactivate                       # back to the system Python`}</Code>
        <p>
          Activation works by changing the <C>PATH</C> variable from the shell lessons, so that <C>python</C> is found in{" "}
          <C>.venv/bin</C> first. The environment is disposable: delete the folder and create it again whenever you like. Never
          commit it to Git.
        </p>
      </Definition>

      <Definition title="uv">
        <p>
          <strong>uv</strong> is a fast tool that manages Python versions, environments and packages together, and is the
          default in this course.
        </p>
        <Code>{`uv init trainer                  # new project with a pyproject.toml
cd trainer
uv add numpy torch               # record dependencies and install them into .venv
uv run python train.py           # run inside the project's environment, creating it if needed
uv python install 3.12           # fetch a specific Python version`}</Code>
        <p>
          <C>uv run</C> makes activation unnecessary: it always uses the project&rsquo;s environment, which removes the commonest
          mistake, running the wrong Python.
        </p>
      </Definition>

      <Example title="pyproject.toml">
        <Code>{`[project]
name = "trainer"
requires-python = ">=3.12"
dependencies = [
    "numpy>=2.0",
    "torch>=2.4",
]`}</Code>
        <p>This file declares what the project needs, in ranges. The next lesson turns those ranges into exact, repeatable versions.</p>
      </Example>

      <Remark title="beyond Python packages">
        <p>
          Some dependencies live outside Python: the CUDA driver on a GPU machine, or system libraries. Those are handled by the
          operating system, by containers such as Docker, or by environment managers such as conda. On shared clusters you will
          often load them with a module system before creating your Python environment.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "what",
      rung: "check",
      prompt: <p>What does a virtual environment give a project?</p>,
      answer: { kind: "choice", options: ["Its own site-packages, so its installs do not affect other projects", "A separate copy of the operating system", "A faster Python"], correct: [0] },
    },
    {
      key: "activate",
      rung: "check",
      prompt: <p>How does activating an environment make <C>python</C> mean the environment&rsquo;s interpreter?</p>,
      answer: { kind: "choice", options: ["It puts the environment's bin folder first on PATH", "It deletes the system Python", "It edits every script"], correct: [0] },
    },
    {
      key: "broken",
      rung: "apply",
      prompt: <p>In the demonstration, with one global environment, you install the paper&rsquo;s requirements and then the new project&rsquo;s. How many of the two projects run?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "commit",
      rung: "apply",
      prompt: <p>Which of these should be committed to Git? Select all that apply.</p>,
      answer: { kind: "choice", options: ["pyproject.toml", ".venv/", "the lock file, uv.lock"], correct: [0, 2] },
    },
    {
      key: "uvrun",
      rung: "apply",
      prompt: <p>Why does <C>uv run python train.py</C> avoid the &ldquo;installed it but cannot import it&rdquo; problem?</p>,
      answer: { kind: "choice", options: ["It always runs inside the project's own environment", "It installs every package on PyPI", "It disables imports from site-packages"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sys
print(sys.prefix == sys.base_prefix)`}</Code>
          <p>Inside a virtual environment sys.prefix points at the environment, not the base Python. Frontier runs Python directly, with no virtual environment. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import os
path = os.pathsep.join(["/venv/bin", "/usr/local/bin", "/usr/bin"])
dirs = path.split(os.pathsep)
print(len(dirs), dirs[0], os.pathsep)`}</Code>
          <p>The PATH variable on Linux after activating an environment. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 /venv/bin :", "3 /usr/bin :", "1 /venv/bin:/usr/local/bin:/usr/bin ;", "3 /venv/bin ;"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>which(name, path_dirs, installed)</C>, which models how a shell finds a command: return the first directory in <C>path_dirs</C> whose set in the dict <C>installed</C> contains <C>name</C>, or <C>None</C>. This is why activating an environment, which puts <C>.venv/bin</C> first, changes which <C>python</C> runs.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def which(name, path_dirs, installed):
    for d in reversed(path_dirs):
        if name in installed.get(d, set()):
            return d
    return None
`,
        solution: `def which(name, path_dirs, installed):
    for d in path_dirs:
        if name in installed.get(d, set()):
            return d
    return None
`,
        tests: [
          { name: "first wins", code: `inst = {'/usr/bin': {'python', 'ls'}, '.venv/bin': {'python', 'pip'}}
assert which('python', ['.venv/bin', '/usr/bin'], inst) == '.venv/bin' and which('ls', ['.venv/bin', '/usr/bin'], inst) == '/usr/bin', 'The earliest directory on PATH wins.'` },
          { name: "missing", code: `assert which('uv', ['/usr/bin'], {'/usr/bin': {'ls'}}) is None, 'Return None when no directory has the command.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Model what <C>source .venv/bin/activate</C> does to the environment variables. Write <C>activate(env, venv)</C>, which returns a new dict where PATH starts with <C>venv + "/bin"</C> (joined to the old PATH with <C>":"</C>, or alone if PATH was empty or missing), VIRTUAL_ENV is venv, and the original PATH is saved under <C>_OLD_PATH</C>; activating while another environment is active must first deactivate it. Then write <C>deactivate(env)</C>, which returns a new dict with PATH restored and VIRTUAL_ENV and _OLD_PATH removed (unchanged if nothing is active). Never change the input dict.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def activate(env, venv):
    env['PATH'] = venv + '/bin:' + env.get('PATH', '')
    return env

def deactivate(env):
    return env
`,
        solution: `def activate(env, venv):
    e = deactivate(env)
    old = e.get('PATH', '')
    e['_OLD_PATH'] = old
    e['PATH'] = venv + '/bin' + (':' + old if old else '')
    e['VIRTUAL_ENV'] = venv
    return e

def deactivate(env):
    e = dict(env)
    if 'VIRTUAL_ENV' not in e:
        return e
    e['PATH'] = e.pop('_OLD_PATH', e.get('PATH', ''))
    del e['VIRTUAL_ENV']
    return e
`,
        tests: [
          { name: "activate", code: `env = {'PATH': '/usr/bin:/bin', 'HOME': '/home/a'}
a = activate(env, '/p/.venv')
assert a['PATH'] == '/p/.venv/bin:/usr/bin:/bin' and a['VIRTUAL_ENV'] == '/p/.venv' and a['HOME'] == '/home/a' and env == {'PATH': '/usr/bin:/bin', 'HOME': '/home/a'}, 'Prepend the bin directory; leave the input alone.'` },
          { name: "round trip", code: `env = {'PATH': '/usr/bin'}
assert deactivate(activate(env, '/v')) == env and deactivate(env) == env and activate({}, '/v')['PATH'] == '/v/bin'` },
          { name: "switch", code: `env = {'PATH': '/usr/bin'}
b = activate(activate(env, '/one'), '/two')
assert b['PATH'] == '/two/bin:/usr/bin' and b['VIRTUAL_ENV'] == '/two' and deactivate(b) == env, 'Switching environments must not stack PATH entries.'` },
        ],
      },
    },
    {
      key: "debug",
      rung: "prove",
      prompt: (
        <p>
          A teammate says &ldquo;I ran pip install torch but import torch still fails.&rdquo; Describe the commands you would run
          to diagnose the problem, what each tells you, and the fix.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Runs which python (and which pip) to see which interpreter and installer are being used.",
          "Runs python -c \"import sys; print(sys.executable, sys.path)\" or python -m pip show torch to see where torch was installed.",
          "Identifies the mismatch: pip belonged to a different Python or environment from the one running the script.",
          "Fixes by activating the project environment and installing with python -m pip install torch, or by using uv add and uv run.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: <p>You work on 4 projects, each needing a different version of the same library. How many virtual environments do you need so that all 4 run, at minimum?</p>,
      answer: { kind: "numeric", value: 4 },
    },
  ],

  teachBack:
    "Explain to a friend what a virtual environment is, how activation works through PATH, and what uv run does for you.",

  glimpse: (
    <p>
      Next, pinning: recording the exact version of every package, so that the environment on the GPU machine next month matches
      the one on your laptop today.
    </p>
  ),
};
