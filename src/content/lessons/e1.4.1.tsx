import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ImportViz } from "@/components/viz/ImportViz";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

export const lesson: LessonContent = {
  id: "e1.4.1",
  minutes: 45,
  links: {
    requires: ["e1.3.5"],
    revisits: ["e0.3.4", "e1.1.2"],
    foreshadows: ["e1.4.2"],
  },

  puzzle: (
    <>
      <p>
        You save a quick experiment as <C>random.py</C> in your project folder. The next day, a completely different script in
        the same folder fails with <C>AttributeError: module &apos;random&apos; has no attribute &apos;shuffle&apos;</C>.
      </p>
      <p>
        Nothing changed in that script. How could naming one file break another, and what does that tell you about how{" "}
        <C>import</C> finds its modules?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <C>import random</C> does not know where the standard library lives. It searches a list of folders,{" "}
        <C>sys.path</C>, in order, and takes the first <C>random</C> it finds. The script&rsquo;s own folder comes first, so your
        experiment file was found before the real module. Choose an import and watch the search.
      </p>
      <ImportViz />
    </>
  ),

  theory: (
    <>
      <Definition title="modules and packages">
        <p>
          A <strong>module</strong> is a Python file; its name is the file name without <C>.py</C>. A <strong>package</strong> is
          a folder of modules, usually with an <C>__init__.py</C> file, imported as <C>import utils</C> or{" "}
          <C>from utils import metrics</C>. Importing runs the module&rsquo;s top-level code once and caches the result in{" "}
          <C>sys.modules</C>; later imports reuse it.
        </p>
      </Definition>

      <Definition title="the search path">
        <p>
          <C>sys.path</C> is a list of folders searched in order: the folder of the script being run (or the current folder, for
          an interactive session), any folders in the <C>PYTHONPATH</C> variable, the standard library, and the{" "}
          <C>site-packages</C> folder where installed packages go. The first match wins.
        </p>
      </Definition>

      <Example title="the main guard">
        <Playground code={`# metrics.py
def accuracy(pred, true):
    return sum(p == t for p, t in zip(pred, true)) / len(true)

if __name__ == "__main__":
    print(accuracy([1, 0, 1], [1, 1, 1]))   # runs only with: python metrics.py`} />
        <p>
          When a file is run directly, its <C>__name__</C> is <C>&quot;__main__&quot;</C>; when it is imported, it is the
          module&rsquo;s name. The guard lets one file be both a reusable module and a small script, without the demonstration
          running on every import.
        </p>
      </Example>

      <Remark title="installed packages">
        <p>
          <C>pip install numpy</C> (or <C>uv add numpy</C>) downloads a package from the Python Package Index and places it in
          the <C>site-packages</C> of the Python that ran the command. The most common confusion in Python is installing into one
          Python and running another. <C>python -m pip</C> and <C>which python</C> remove the doubt: the first installs into
          exactly the Python you name, the second shows which one <C>python</C> means.
        </p>
      </Remark>

      <Remark title="laying out a project">
        <p>
          Put reusable code in a package, for example <C>src/trainer/</C>, with scripts and notebooks importing from it. Then the
          same code serves experiments, tests and the final run, instead of being copied between notebooks.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: <p>When several folders on <C>sys.path</C> contain a module with the requested name, which one is imported?</p>,
      answer: { kind: "choice", options: ["The one in the earliest folder on the path", "The newest one", "The largest one", "Python raises an error"], correct: [0] },
    },
    {
      key: "main",
      rung: "check",
      prompt: <p>What is <C>__name__</C> inside <C>metrics.py</C> when another file runs <C>import metrics</C>?</p>,
      answer: { kind: "choice", options: ["\"metrics\"", "\"__main__\"", "\"__init__\""], correct: [0] },
    },
    {
      key: "shadow",
      rung: "apply",
      prompt: <p>In the demonstration, with the local file still called <C>random.py</C>, which folder supplies <C>import random</C>? Give its number.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "once",
      rung: "apply",
      prompt: <p>A module prints <C>loading</C> at its top level. A program runs <C>import m</C> three times, in three different functions. How many times is <C>loading</C> printed?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "missing",
      rung: "apply",
      prompt: <p><C>import tqdm</C> fails with <C>ModuleNotFoundError</C>, but you are sure you installed it. What is the most likely cause?</p>,
      answer: { kind: "choice", options: ["It was installed into a different Python from the one running the script", "The module is corrupted", "Imports must be at the top of the file"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sys, types
mod = types.ModuleType("geometry")
exec("PI = 3.14159\\ndef area(r):\\n    return PI * r * r", mod.__dict__)
sys.modules["geometry"] = mod
from geometry import area
import geometry
geometry.PI = 3
print(area(2))`}</Code>
          <p>area looks up PI in its module each time it runs. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sys, types
m = types.ModuleType("cfg")
m.x = 1
sys.modules["cfg"] = m
import cfg
cfg.x += 1
import cfg as again
print(again.x, again is m, "cfg" in sys.modules)`}</Code>
          <p>Importing a module that is already in sys.modules. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 True True", "1 False True", "1 True True", "2 False False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A package <C>stats</C> has been written to the file system with a module <C>stats/basic.py</C> holding <C>mean</C>. Complete <C>stats/__init__.py</C> by writing a string <C>INIT</C> containing the import that lets users write <C>from stats import mean</C>. The tests write your string to the file and import it.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `INIT = ""
`,
        solution: `INIT = "from .basic import mean\\n"
`,
        tests: [
          { name: "import", code: `import sys, importlib
sys.path.insert(0, '.')
with open('stats/__init__.py', 'w') as f:
    f.write(INIT)
for m in [k for k in sys.modules if k == 'stats' or k.startswith('stats.')]:
    del sys.modules[m]
importlib.invalidate_caches()
import stats
assert hasattr(stats, 'mean') and stats.mean([1, 2, 3]) == 2, 'Use a relative import: from .basic import mean.'` },
          { name: "from import", code: `import sys, importlib
sys.path.insert(0, '.')
with open('stats/__init__.py', 'w') as f:
    f.write(INIT)
for m in [k for k in sys.modules if k == 'stats' or k.startswith('stats.')]:
    del sys.modules[m]
importlib.invalidate_caches()
from stats import mean as m
assert isinstance(INIT, str) and m([2, 4]) == 3 and 'stats.basic' in sys.modules, 'from stats import mean must work.'` },
        ],
        setup: `import os
os.makedirs('stats', exist_ok=True)
with open('stats/basic.py', 'w') as f:
    f.write('def mean(xs):\\n    return sum(xs) / len(xs)\\n')
`,
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>resolve(name, package, level)</C>, the absolute module name for a relative import such as <C>from ..utils import x</C> (name <C>"utils"</C>, level 2) inside package <C>"pkg.sub"</C>: level 1 means the package itself, each further level goes up one, and going above the top raises <C>ImportError</C>; an empty name means the package reached. Then write <C>import_order(deps)</C> for a dict from module to the modules it imports: an order where every module comes after its imports, choosing the alphabetically smallest ready module each time, and raising <C>ImportError</C> on a circular import.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def resolve(name, package, level):
    return package + '.' + name

def import_order(deps):
    return sorted(deps)
`,
        solution: `import heapq

def resolve(name, package, level):
    parts = package.split('.')
    if level - 1 >= len(parts):
        raise ImportError('beyond top-level package')
    base = parts[:len(parts) - (level - 1)]
    return '.'.join(base + ([name] if name else []))

def import_order(deps):
    mods = set(deps) | {d for ds in deps.values() for d in ds}
    need = {m: set(deps.get(m, [])) for m in mods}
    users = {m: [] for m in mods}
    for m, ds in need.items():
        for d in ds:
            users[d].append(m)
    ready = [m for m in mods if not need[m]]
    heapq.heapify(ready)
    out = []
    while ready:
        m = heapq.heappop(ready)
        out.append(m)
        for u in users[m]:
            need[u].discard(m)
            if not need[u]:
                heapq.heappush(ready, u)
    if len(out) < len(mods):
        raise ImportError('circular import')
    return out
`,
        tests: [
          { name: "resolve", code: `assert resolve('utils', 'pkg.sub', 1) == 'pkg.sub.utils' and resolve('utils', 'pkg.sub', 2) == 'pkg.utils' and resolve('', 'pkg.sub', 2) == 'pkg'` },
          { name: "importlib", code: `import importlib.util
for name, pkg, level in [('a', 'x.y.z', 1), ('a.b', 'x.y.z', 3), ('', 'x.y', 1), ('m', 'top', 1)]:
    assert resolve(name, pkg, level) == importlib.util.resolve_name('.' * level + name, pkg), f'{name}, {pkg}, {level}'
try:
    resolve('a', 'top', 2)
    assert False, 'Going above the top-level package must raise ImportError.'
except ImportError:
    pass` },
          { name: "order", code: `deps = {'app': ['models', 'utils'], 'models': ['utils', 'db'], 'db': [], 'utils': []}
assert import_order(deps) == ['db', 'utils', 'models', 'app'] and import_order({'x': ['numpy']}) == ['numpy', 'x']` },
          { name: "cycle", code: `try:
    import_order({'a': ['b'], 'b': ['c'], 'c': ['a'], 'd': []})
    assert False, 'A circular import must raise ImportError.'
except ImportError:
    pass` },
        ],
      },
    },
    {
      key: "explain",
      rung: "prove",
      prompt: (
        <p>
          Explain step by step why saving <C>random.py</C> in a project folder broke a different script in that folder, and give
          two ways to prevent this kind of problem.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States that the script's folder is the first entry on sys.path.",
          "Explains that import random therefore found the local random.py before the standard library's, and the local file lacks shuffle.",
          "Suggests never naming files after standard-library or installed modules, for example renaming to random_experiment.py.",
          "Suggests a second safeguard, such as putting code in a uniquely named package, or checking random.__file__ to see which file was imported.",
        ],
      },
    },
    {
      key: "path",
      rung: "stretch",
      prompt: <p>How many folders in the demonstration&rsquo;s search path does Python look inside before it finds <C>numpy</C>, counting the one where it is found?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend how Python finds a module to import, how a local file can shadow a library, and what the __main__ guard is for.",

  glimpse: (
    <p>
      Next, virtual environments, which give each project its own site-packages so that projects stop fighting over versions.
    </p>
  ),
};
