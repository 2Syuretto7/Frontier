import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TypeCheckViz } from "@/components/viz/TypeCheckViz";
import type { LessonContent } from "@/lib/types";

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
        <Code>{`from dataclasses import dataclass, field

@dataclass(frozen=True)
class TrainConfig:
    lr: float = 3e-4
    batch_size: int = 64
    layers: tuple[int, ...] = (512, 256)

cfg = TrainConfig(lr=1e-3)
print(cfg)    # TrainConfig(lr=0.001, batch_size=64, layers=(512, 256))`}</Code>
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
