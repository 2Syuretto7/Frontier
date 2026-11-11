import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TypeCheckViz } from "@/components/viz/TypeCheckViz";
import type { LessonContent } from "@/lib/types";
import { Playground } from "@/components/code/Playground";

export const lesson: LessonContent = {
  id: "e1.3.5",
  minutes: 45,
  links: {
    requires: ["e1.3.3"],
    revisits: ["e0.1.2"],
    parallels: ["m1.7.1"],
    foreshadows: ["e1.4.1"],
  },

  puzzle: (
    <>
      <p>
        A training run fails after six hours, at the very end, because a function that returns <C>None</C> when a checkpoint
        is missing was used as if it always returned a number.
      </p>
      <p>
        The mistake was visible in the code all along. What would a tool need to know about each function to have pointed at
        it before the run started?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        It would need to know what types each function takes and returns. Python lets you write that down as{" "}
        <strong>type hints</strong>. Python itself ignores them when running, but a <strong>type checker</strong> such as mypy
        or pyright reads them and reports mismatches in seconds, without running anything. Try being the checker.
      </p>
      <TypeCheckViz />
    </>
  ),

  theory: (
    <>
      <Definition title="annotations">
        <Code>{`def load_step(path: str) -> int | None:
    ...

scores: dict[str, float] = {}
layers: list[int] = [512, 256]`}</Code>
        <p>
          Parameters get <C>name: type</C>, return values <C>-&gt; type</C>, and variables can be annotated too. Common types:{" "}
          <C>int</C>, <C>float</C>, <C>str</C>, <C>bool</C>, <C>list[T]</C>, <C>dict[K, V]</C>, <C>tuple[int, int]</C>,{" "}
          <C>T | None</C> for &ldquo;a T or nothing&rdquo;, <C>Callable[[int], float]</C> for functions, and <C>Any</C> to
          switch checking off.
        </p>
      </Definition>

      <Remark title="hints are not enforced">
        <p>
          <C>x: int = &quot;seven&quot;</C> runs without complaint. Hints are documentation that a tool can check; they change
          nothing at run time. Run the checker as part of your tests and CI, so mistakes are caught on every change.
        </p>
      </Remark>

      <Definition title="dataclasses">
        <p>
          A <strong>dataclass</strong> writes the routine parts of a class from its annotated fields:
        </p>
        <Playground code={`from dataclasses import dataclass, field

@dataclass(frozen=True)
class TrainConfig:
    lr: float = 3e-4
    batch_size: int = 64
    layers: tuple[int, ...] = (512, 256)

cfg = TrainConfig(lr=1e-3)
print(cfg)    # TrainConfig(lr=0.001, batch_size=64, layers=(512, 256))`} />
        <p>
          It generates <C>__init__</C>, <C>__repr__</C> and <C>__eq__</C>. <C>frozen=True</C> forbids changing fields after
          creation, so a configuration cannot be altered by accident halfway through a run.
        </p>
      </Definition>

      <Example title="mutable defaults, again">
        <p>
          A field like <C>tags: list[str] = []</C> would share one list among all instances, the trap from the data-model lesson.
          Dataclasses refuse it with a <C>ValueError</C>; write <C>tags: list[str] = field(default_factory=list)</C> to create a
          fresh list for each instance.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "enforce",
      rung: "check",
      prompt: <p>Does Python check type hints when the program runs?</p>,
      answer: { kind: "choice", options: ["No; a separate checker such as mypy or pyright does", "Yes, every call is checked", "Only for function return values"], correct: [0] },
    },
    {
      key: "optional",
      rung: "check",
      prompt: <p>Which annotation means &ldquo;an int, or nothing&rdquo;?</p>,
      answer: { kind: "choice", options: ["int | None", "list[int]", "Any", "int = None"], correct: [0] },
    },
    {
      key: "seven",
      rung: "apply",
      prompt: <p>What happens when Python runs <C>x: int = &quot;seven&quot;</C> followed by <C>print(x)</C>?</p>,
      answer: { kind: "choice", options: ["It prints seven", "It raises a TypeError", "It prints 7"], correct: [0] },
    },
    {
      key: "eq",
      rung: "apply",
      prompt: (
        <>
          <Code>{`@dataclass
class C:
    a: int
    b: int = 2`}</Code>
          <p>What is <C>C(1) == C(1, 2)</C>?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False", "An error"], correct: [0] },
    },
    {
      key: "frozen",
      rung: "apply",
      prompt: <p><C>cfg = TrainConfig()</C> as defined above, then <C>cfg.lr = 0.1</C>. What happens?</p>,
      answer: { kind: "choice", options: ["An error, because the dataclass is frozen", "lr becomes 0.1", "A new TrainConfig is returned"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from dataclasses import dataclass, field
@dataclass(order=True)
class Job:
    priority: int
    name: str = field(compare=False)
jobs = [Job(3, "train"), Job(1, "fetch"), Job(2, "clean")]
print([j.name for j in sorted(jobs)])`}</Code>
          <p>A dataclass compares by its fields in order. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['fetch', 'clean', 'train']", "['train', 'clean', 'fetch']", "['clean', 'fetch', 'train']", "An error"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from dataclasses import dataclass, field, asdict
@dataclass
class Run:
    name: str
    tags: list = field(default_factory=list)
    lr: float = 0.1
a, b = Run("x"), Run("y", lr=0.01)
a.tags.append("fast")
print(b.tags, asdict(a), a == Run("x", ["fast"]))`}</Code>
          <p>A dataclass with a mutable default made safely. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[] {'name': 'x', 'tags': ['fast'], 'lr': 0.1} True", "['fast'] {'name': 'x', 'tags': ['fast'], 'lr': 0.1} True", "[] {'name': 'x', 'tags': ['fast'], 'lr': 0.1} False", "[] Run(name='x', tags=['fast'], lr=0.1) True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a frozen dataclass <C>Config</C> with typed fields <C>lr: float</C>, <C>batch_size: int = 32</C> and <C>layers: tuple = (64, 64)</C>, and a method <C>scaled(self, k)</C> that returns a new Config with <C>batch_size</C> multiplied by k and <C>lr</C> multiplied by k.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Config:
    pass
`,
        solution: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Config:
    lr: float
    batch_size: int = 32
    layers: tuple = (64, 64)

    def scaled(self, k):
        return replace(self, lr=self.lr * k, batch_size=self.batch_size * k)
`,
        tests: [
          { name: "defaults", code: `c = Config(0.001)
assert c.batch_size == 32 and c.layers == (64, 64) and c == Config(0.001, 32, (64, 64)), 'Use @dataclass with defaults.'` },
          { name: "frozen", code: `import dataclasses
c = Config(0.1)
try:
    c.lr = 1.0
    ok = False
except dataclasses.FrozenInstanceError:
    ok = True
assert ok, 'Make it frozen=True so fields cannot be changed.'` },
          { name: "scaled", code: `c = Config(0.1, 32).scaled(4)
assert c.batch_size == 128 and abs(c.lr - 0.4) < 1e-12, 'Return a new Config with both values scaled.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Type hints are not checked at run time, so check them yourself. Write <C>type_errors(obj)</C> for a dataclass instance: using <C>dataclasses.fields</C> and <C>typing.get_type_hints</C>, return the sorted names of fields whose values do not match their hints. Support <C>int</C> (but not bool), <C>float</C> (ints allowed, bools not), <C>str</C>, <C>bool</C>, <C>list[X]</C> (a list whose items all match X) and <C>Optional[X]</C> (None or X), using <C>typing.get_origin</C> and <C>typing.get_args</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def type_errors(obj):
    return []
`,
        solution: `import dataclasses, typing

def _ok(value, hint):
    origin, args = typing.get_origin(hint), typing.get_args(hint)
    if origin is typing.Union:
        return any(_ok(value, a) for a in args)
    if hint is type(None):
        return value is None
    if origin is list:
        return isinstance(value, list) and all(_ok(v, args[0]) for v in value)
    if hint is bool:
        return isinstance(value, bool)
    if hint is int:
        return isinstance(value, int) and not isinstance(value, bool)
    if hint is float:
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return isinstance(value, hint)

def type_errors(obj):
    hints = typing.get_type_hints(type(obj))
    return sorted(f.name for f in dataclasses.fields(obj) if not _ok(getattr(obj, f.name), hints[f.name]))
`,
        tests: [
          { name: "ok", code: `from dataclasses import dataclass
from typing import Optional
@dataclass
class Cfg:
    name: str
    epochs: int
    lr: float
    layers: list[int]
    seed: Optional[int] = None
    debug: bool = False
assert type_errors(Cfg('a', 3, 1, [64, 32])) == [] and type_errors(Cfg('a', 3, 0.1, [], 7, True)) == [], 'An int is a fine float; an empty list is fine.'` },
          { name: "errors", code: `from dataclasses import dataclass
from typing import Optional
@dataclass
class Cfg:
    name: str
    epochs: int
    lr: float
    layers: list[int]
    seed: Optional[int] = None
    debug: bool = False
assert type_errors(Cfg(5, True, '0.1', [64, '32'], 1.5, 1)) == ['debug', 'epochs', 'layers', 'lr', 'name', 'seed'], 'bool is not int, and 1 is not a bool.'
assert type_errors(Cfg('x', 2, False, (1,))) == ['layers', 'lr']` },
        ],
      },
    },
    {
      key: "factory",
      rung: "prove",
      prompt: (
        <p>
          Explain why a dataclass refuses <C>items: list = []</C>, what would go wrong if it allowed it, and how{" "}
          <C>field(default_factory=list)</C> fixes the problem.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the default is evaluated once, when the class is defined, producing a single list.",
          "Explains every instance created without items would share that list, so appending through one instance changes all of them.",
          "States that default_factory is called anew for each instance, giving each its own empty list.",
          "Connects this to the mutable default argument trap for functions.",
        ],
      },
    },
    {
      key: "fields",
      rung: "stretch",
      prompt: <p>How many fields does <C>TrainConfig</C> above have, as reported by <C>len(dataclasses.fields(TrainConfig))</C>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what type hints are, why they help even though Python ignores them, and what a dataclass writes for you.",

  glimpse: (
    <p>
      Next, packages and modules: how Python finds the code you import. Configurations written as frozen dataclasses reappear in
      Software Engineering for ML Research, where every run records exactly the settings it used.
    </p>
  ),
};
