import { Definition, Example, Proposition, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CallGraphViz } from "@/components/viz/CallGraphViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.6.3",
  minutes: 55,
  links: {
    requires: ["e4.6.2"],
    revisits: ["e1.2.4", "e1.1.3", "e1.4.1"],
    foreshadows: ["e5.1.1"],
  },

  puzzle: (
    <>
      <p>
        You join a project whose training code has 400 files and 60,000 lines. Your first task: change how the learning rate
        is warmed up. You open the files in alphabetical order and start reading.
      </p>
      <p>How long until you find the line, and is there a better way?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Nobody reads a large codebase from start to finish. You read the part on the path you care about: start from where the
        program begins, follow one example through it, and search for names. A codebase is a graph of calls, and most of it is
        irrelevant to any one question.
      </p>
      <CallGraphViz />
      <p>
        Two directions answer two questions: callers tell you when and with what a function runs; callees tell you what it
        relies on. Anything unreachable from the entry points can usually be ignored.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="a strategy">
        <ol>
          <li><strong>Run it.</strong> Follow the README until a small run works; that tells you the entry point and the config.</li>
          <li><strong>Find the entry point</strong> (<C>train.py</C>, <C>main()</C>, the console script in <C>pyproject.toml</C>) and read it top down.</li>
          <li><strong>Follow one batch</strong> from the data loader to the loss, noting each function and the shapes it sees.</li>
          <li><strong>Search</strong> for names, config keys and the exact text of error messages with <C>rg</C> (ripgrep) or <C>git grep</C>.</li>
          <li><strong>Read the tests</strong> for the part you will change; they show intended use and edge cases.</li>
          <li><strong>Ask history</strong>: <C>git log -p path</C> and <C>git blame</C> say who changed a line and why.</li>
          <li><strong>Make a small change</strong> and see what breaks, or step through it in a debugger.</li>
        </ol>
      </Definition>

      <Example title="searching">
        <Code>{`rg -n "warmup" --type py               # every mention, with line numbers
rg -n "def .*warmup|class .*Warmup"       # definitions only
rg -n "lr_warmup_steps" configs/           # where the config key is set
git log -S "warmup" --oneline             # commits that added or removed the word
git blame -L 120,140 trainer.py           # who last changed these lines`}</Code>
        <p>
          An editor&rsquo;s &ldquo;go to definition&rdquo; and &ldquo;find references&rdquo; do the same with an understanding of
          the language, which helps when a name is common. Python&rsquo;s <C>ast</C> module lets you build such tools yourself.
        </p>
      </Example>

      <Proposition title="reachability">
        <p>
          A depth-first or breadth-first search of the call graph from the entry points visits exactly the functions that can be
          reached from them, and each function once. Functions it does not visit cannot run from those entry points, apart from
          calls the static graph misses, such as functions looked up by name in a registry or with <C>getattr</C>.
        </p>
      </Proposition>

      <Remark title="write it down">
        <p>
          Keep notes as you go: the path a batch takes, the files that matter, and the surprises. That map is the most useful
          document a newcomer can write, for the next newcomer and for the README.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: <p>You need to change the learning-rate warm-up in an unfamiliar repository. What is a good first step?</p>,
      answer: {
        kind: "choice",
        options: [
          "Find the training entry point and search for warmup and the config key that controls it",
          "Read every file in alphabetical order",
          "Rewrite the scheduler from scratch",
          "Read the most recently changed file",
        ],
        correct: [0],
      },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>A line in the trainer clips gradients at 0.3, an unusual value. How do you find out why?</p>,
      answer: {
        kind: "choice",
        options: [
          "git blame on the line, then read the commit and its pull request",
          "Change it to 1.0 and see if anyone complains",
          "Search the internet for 0.3",
          "Read the whole trainer file again",
        ],
        correct: [0],
      },
    },
    {
      key: "error",
      rung: "apply",
      prompt: <p>A run fails with <C>ValueError: sequence length 4096 exceeds max_positions</C>. What is the fastest way to find where it is raised?</p>,
      answer: {
        kind: "choice",
        options: [
          "Read the traceback, or search the code for the text 'exceeds max_positions'",
          "Search for ValueError",
          "Search for 4096",
          "Step through the program from the start in a debugger",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import ast
src = '''
import torch
def build(cfg):
    return Model(cfg)
class Model:
    def forward(self, x):
        return helper(x)
def helper(x):
    return x
'''
tree = ast.parse(src)
defs = [n.name for n in tree.body if isinstance(n, (ast.FunctionDef, ast.ClassDef))]
calls = sorted({n.func.id for n in ast.walk(tree) if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)})
print(defs, calls)`}</Code>
          <p>Listing definitions and calls with the <C>ast</C> module. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['build', 'Model', 'helper'] ['Model', 'helper']",
          "['build', 'Model', 'forward', 'helper'] ['Model', 'helper']",
          "['build', 'Model', 'helper'] ['Model', 'helper', 'torch']",
          "['torch', 'build', 'Model', 'helper'] ['Model', 'helper']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`graph = {'main': ['train', 'evaluate'], 'train': ['step', 'log'], 'step': ['loss'],
         'evaluate': ['loss'], 'old_train': ['step'], 'loss': [], 'log': []}
seen, stack = set(), ['main']
while stack:
    f = stack.pop()
    if f not in seen:
        seen.add(f)
        stack.extend(graph[f])
print(sorted(set(graph) - seen), len(seen))`}</Code>
          <p>Reachability from the entry point. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['old_train'] 6", "[] 7", "['old_train', 'log'] 5", "['old_train'] 7"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>index_definitions(files)</C>, a tiny code index. files maps a path to Python source. Use <C>ast.parse</C> and
          return a dict from name to a list of <C>&apos;path:line&apos;</C> strings, for every top-level function and class,
          and every method as <C>&apos;Class.method&apos;</C>. Visit files in sorted path order and definitions in source
          order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import ast

def index_definitions(files):
    return {}
`,
        solution: `import ast

def index_definitions(files):
    index = {}
    def add(name, path, node):
        index.setdefault(name, []).append(f'{path}:{node.lineno}')
    for path in sorted(files):
        for node in ast.parse(files[path]).body:
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                add(node.name, path, node)
            if isinstance(node, ast.ClassDef):
                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        add(f'{node.name}.{item.name}', path, item)
    return index
`,
        tests: [
          { name: "index", code: `files = {
    'trainer.py': 'import math\\n\\ndef fit(cfg):\\n    pass\\n\\nclass Trainer:\\n    def step(self):\\n        pass\\n    def warmup(self, s):\\n        return s\\n',
    'sched.py': 'def warmup(step, n):\\n    return min(1, step / n)\\n',
}
idx = index_definitions(files)
assert idx['warmup'] == ['sched.py:1'], idx
assert idx['Trainer.warmup'] == ['trainer.py:9'] and idx['Trainer.step'] == ['trainer.py:7']
assert idx['fit'] == ['trainer.py:3'] and idx['Trainer'] == ['trainer.py:6']
assert 'step' not in idx and 'math' not in idx, 'Methods are listed as Class.method only; imports are not definitions.'` },
          { name: "duplicates", code: `files = {'b.py': 'def f():\\n    pass\\n', 'a.py': '\\n\\ndef f():\\n    pass\\ndef g():\\n    def inner():\\n        pass\\n'}
idx = index_definitions(files)
assert idx == {'f': ['a.py:3', 'b.py:1'], 'g': ['a.py:5']}, idx` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>call_graph(source)</C>, mapping each top-level function in the source to the sorted list of distinct names it
          calls: <C>f(...)</C> gives f and <C>obj.f(...)</C> gives f. Then write <C>unreachable(graph, roots)</C>, the sorted
          list of functions in graph that cannot be reached from any root by following calls (names not in graph are ignored).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import ast

def call_graph(source):
    return {}

def unreachable(graph, roots):
    return []
`,
        solution: `import ast

def call_graph(source):
    graph = {}
    for node in ast.parse(source).body:
        if isinstance(node, ast.FunctionDef):
            names = set()
            for n in ast.walk(node):
                if isinstance(n, ast.Call):
                    if isinstance(n.func, ast.Name):
                        names.add(n.func.id)
                    elif isinstance(n.func, ast.Attribute):
                        names.add(n.func.attr)
            graph[node.name] = sorted(names)
    return graph

def unreachable(graph, roots):
    seen, stack = set(), [r for r in roots if r in graph]
    while stack:
        f = stack.pop()
        if f not in seen:
            seen.add(f)
            stack.extend(c for c in graph[f] if c in graph)
    return sorted(set(graph) - seen)
`,
        tests: [
          { name: "graph", code: `src = '''
def main():
    cfg = load()
    model = build(cfg)
    fit(model, cfg)

def fit(model, cfg):
    for batch in loader(cfg):
        loss = model.forward(batch)
        print(loss)

def build(cfg):
    return dict(cfg)

def load():
    return {}

def old_fit():
    fit(None, None)

def forward(x):
    return x
'''
g = call_graph(src)
assert g['main'] == ['build', 'fit', 'load'], g['main']
assert g['fit'] == ['forward', 'loader', 'print'], g['fit']
assert g['build'] == ['dict'] and g['load'] == [] and set(g) == {'main', 'fit', 'build', 'load', 'old_fit', 'forward'}` },
          { name: "unreachable", code: `g = {'main': ['build', 'fit', 'load'], 'fit': ['forward', 'loader', 'print'], 'build': ['dict'], 'load': [], 'old_fit': ['fit'], 'forward': [], 'helper': ['helper']}
assert unreachable(g, ['main']) == ['helper', 'old_fit']
assert unreachable(g, ['main', 'old_fit']) == ['helper']
assert unreachable(g, ['missing']) == sorted(g)` },
        ],
      },
    },
    {
      key: "dfs",
      rung: "prove",
      prompt: (
        <p>
          Prove that the loop in the second reading exercise ends with <C>seen</C> equal to the set of functions reachable
          from main by following calls.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows every function added to seen is reachable, since everything pushed is main or a callee of something already in seen.",
          "Shows every reachable function is added, by induction on the length of a call path from main: when a function enters seen its callees are pushed and later popped.",
          "Argues the loop ends, because each function enters seen at most once and so only finitely many items are ever pushed.",
        ],
      },
    },
    {
      key: "pushes",
      rung: "stretch",
      prompt: <p>In the second reading exercise, how many items are pushed onto the stack in total, counting the initial main?</p>,
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend how to find the place to make a change in a large codebase they have never seen, without reading all of it.",

  glimpse: (
    <p>
      That completes the engineering habits: tests, debugging, reproducibility, design, performance and documentation. The
      next track puts them to work building a small automatic differentiation library from scratch, starting with a value
      that remembers how it was computed.
    </p>
  ),
};
