import { M } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ConfigLayersViz } from "@/components/viz/ConfigLayersViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.3.2",
  minutes: 50,
  links: {
    requires: ["e4.3.1"],
    revisits: ["e1.3.5", "e0.4.2"],
    foreshadows: ["e4.3.3", "e4.4.2"],
  },

  puzzle: (
    <>
      <p>
        Three weeks ago a run reached the best validation loss you have ever seen. Its learning rate was set in the script,
        which you have edited forty times since, and the batch size was passed on a command line you no longer have.
      </p>
      <p>Can you run it again?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every setting that can change a result belongs in one configuration, not scattered through the code as constants. A
        run is then defined by its code version and its resolved configuration, and saving both with the results means any
        number you report can be traced back and reproduced. Configurations are usually built in layers: defaults, then an
        experiment file, then command-line overrides.
      </p>
      <ConfigLayersViz />
      <p>
        Layering keeps experiment files short, since they say only what differs. Its danger is the typo that silently does
        nothing, which strict validation catches before the run starts.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="configuration">
        <p>
          A <em>configuration</em> is a nested mapping of every setting a run depends on: model sizes, optimiser and schedule,
          data paths and preprocessing, seeds, and the number of steps. Code reads settings only from it. The{" "}
          <em>resolved</em> configuration, after all layers and overrides are applied, is saved next to the run&rsquo;s
          outputs, together with the commit hash of the code.
        </p>
      </Definition>

      <Example title="typed configs">
        <Code>{`from dataclasses import dataclass, field

@dataclass
class Model:
    width: int = 256
    depth: int = 4

@dataclass
class Config:
    model: Model = field(default_factory=Model)
    lr: float = 0.1
    steps: int = 10_000
    seed: int = 0`}</Code>
        <p>
          Dataclasses give defaults, attribute access with autocompletion, and a place to check types. Libraries such as
          Hydra and OmegaConf add YAML files, layering and command-line overrides like <C>model.depth=12</C> on top of the same
          idea.
        </p>
      </Example>

      <Definition title="validation">
        <p>Check the configuration before doing any work:</p>
        <ul>
          <li>unknown keys are errors, because they are almost always typos;</li>
          <li>values have the right types, so <C>lr=&quot;0.1&quot;</C> or <C>steps=1e4</C> fail at once;</li>
          <li>values are in range and consistent: the batch size divides by the number of devices, the warm-up is shorter than training.</li>
        </ul>
      </Definition>

      <Definition title="identity and sweeps">
        <p>
          Serialising the resolved configuration canonically, with sorted keys, and hashing it gives a short run identifier
          that is the same for the same settings. A sweep is a list of configurations: a grid takes the product of the values
          for each setting, so k settings with n values each give <M>{"n^k"}</M> runs, and random search samples
          configurations instead.
        </p>
      </Definition>

      <Remark title="what does not belong in the config">
        <p>
          Secrets such as API keys belong in the environment, not in a file saved with every run. Settings that cannot change
          the result, such as how often to print, can live in the config, but should be left out of the run identifier.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "save",
      rung: "check",
      prompt: <p>Why save the resolved configuration, rather than the experiment file, with each run?</p>,
      answer: {
        kind: "choice",
        options: [
          "The resolved configuration includes defaults and command-line overrides, and defaults may change in the code later",
          "Experiment files cannot be saved",
          "The resolved configuration is smaller",
          "It makes the run faster",
        ],
        correct: [0],
      },
    },
    {
      key: "grid",
      rung: "apply",
      prompt: <p>A grid sweep tries 4 learning rates, 3 batch sizes and 2 depths, each with 5 seeds. How many runs is that?</p>,
      answer: { kind: "numeric", value: 120, tolerance: 0 },
    },
    {
      key: "typo",
      rung: "apply",
      prompt: (
        <p>
          The defaults have keys <C>optim.lr</C>, <C>optim.name</C> and <C>data.batch</C>. Which of these command-line
          overrides would be silently ignored by a loader that accepts unknown keys?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["optim.lrr=0.01", "data.batch_size=128", "optim.name=adam", "data.batch=128"],
        correct: [0, 1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def merge(a, b):
    out = dict(a)
    for k, v in b.items():
        out[k] = merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out

base = {'model': {'width': 256, 'depth': 4}, 'lr': 0.1}
exp = {'model': {'depth': 8}, 'lr': 0.01, 'tag': 'deep'}
print(merge(base, exp))
print(base['model'])`}</Code>
          <p>A recursive merge of an experiment over defaults. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'model': {'width': 256, 'depth': 8}, 'lr': 0.01, 'tag': 'deep'}\n{'width': 256, 'depth': 4}",
          "{'model': {'depth': 8}, 'lr': 0.01, 'tag': 'deep'}\n{'width': 256, 'depth': 4}",
          "{'model': {'width': 256, 'depth': 8}, 'lr': 0.01, 'tag': 'deep'}\n{'width': 256, 'depth': 8}",
          "{'model': {'width': 256, 'depth': 8}, 'lr': 0.01}\n{'width': 256, 'depth': 4}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import json, hashlib
def run_id(cfg):
    s = json.dumps(cfg, sort_keys=True)
    return hashlib.sha256(s.encode()).hexdigest()[:8]

a = {'lr': 0.1, 'model': {'depth': 4, 'width': 256}}
b = {'model': {'width': 256, 'depth': 4}, 'lr': 0.1}
c = {'lr': 0.10000000000000001, 'model': {'depth': 4, 'width': 256}}
d = {'lr': '0.1', 'model': {'depth': 4, 'width': 256}}
print(run_id(a) == run_id(b), run_id(a) == run_id(c), run_id(a) == run_id(d))`}</Code>
          <p>Run identifiers from hashed configs. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True False", "False True False", "True False False", "True True True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>apply_overrides(cfg, overrides)</C> for a nested dict and a list of strings such as{" "}
          <C>{"'optim.lr=0.01'"}</C>. Parse each value with <C>json.loads</C>, so <C>0.01</C>, <C>3</C>, <C>true</C>,{" "}
          <C>null</C> and <C>[1, 2]</C> become numbers, booleans, None and lists, and keep the text as a string if that fails.
          A key that is not already in the config raises <C>KeyError</C>. Return a new dict and leave cfg unchanged.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import copy, json

def apply_overrides(cfg, overrides):
    return cfg
`,
        solution: `import copy, json

def apply_overrides(cfg, overrides):
    cfg = copy.deepcopy(cfg)
    for item in overrides:
        key, text = item.split('=', 1)
        *path, last = key.split('.')
        node = cfg
        for p in path:
            if not isinstance(node.get(p), dict):
                raise KeyError(key)
            node = node[p]
        if last not in node:
            raise KeyError(key)
        try:
            node[last] = json.loads(text)
        except ValueError:
            node[last] = text
    return cfg
`,
        tests: [
          { name: "overrides", code: `cfg = {'model': {'width': 256, 'depth': 4}, 'optim': {'lr': 0.1, 'name': 'sgd', 'betas': None}, 'seed': 0, 'amp': False}
got = apply_overrides(cfg, ['optim.lr=0.01', 'model.depth=12', 'optim.name=adam', 'seed=3', 'amp=true', 'optim.betas=[0.9, 0.95]', 'optim.lr=1e-3'])
want = {'model': {'width': 256, 'depth': 12}, 'optim': {'lr': 0.001, 'name': 'adam', 'betas': [0.9, 0.95]}, 'seed': 3, 'amp': True}
assert got == want, got
assert cfg['model']['depth'] == 4 and cfg['optim']['lr'] == 0.1, 'Do not change the config you were given.'
assert apply_overrides(cfg, ['optim.name=a=b'])['optim']['name'] == 'a=b', 'Split only at the first ='
assert apply_overrides(cfg, []) == cfg` },
          { name: "unknown keys", code: `cfg = {'model': {'width': 256}, 'optim': {'lr': 0.1}, 'seed': 0}
for bad in ['optim.lrr=0.5', 'model.width.x=1', 'data.batch=64', 'sed=1']:
    try:
        apply_overrides(cfg, [bad])
    except KeyError:
        pass
    else:
        assert False, f'{bad} names a key that does not exist and should raise KeyError'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>from_dict(cls, d)</C>, which builds an instance of the dataclass cls from a nested dict, using defaults for
          missing keys. Use <C>dataclasses.fields(cls)</C>; each field&rsquo;s <C>.type</C> is int, float, str, bool or
          another dataclass. Raise <C>ValueError</C> naming any unknown key, and <C>TypeError</C> naming the key for a value
          of the wrong type. An int is accepted for a float field and converted, but a bool is never accepted where a number
          is expected. For a nested dataclass the value must be a dict.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import dataclasses

def from_dict(cls, d):
    return cls(**d)
`,
        solution: `import dataclasses

def from_dict(cls, d):
    fields = {f.name: f.type for f in dataclasses.fields(cls)}
    kwargs = {}
    for k, v in d.items():
        if k not in fields:
            raise ValueError(f'unknown key {k!r} for {cls.__name__}')
        t = fields[k]
        if dataclasses.is_dataclass(t):
            if not isinstance(v, dict):
                raise TypeError(f'{k}: expected a mapping, got {v!r}')
            v = from_dict(t, v)
        elif t is float and type(v) is int:
            v = float(v)
        elif not isinstance(v, t) or (isinstance(v, bool) and t is not bool):
            raise TypeError(f'{k}: expected {t.__name__}, got {v!r}')
        kwargs[k] = v
    return cls(**kwargs)
`,
        tests: [
          { name: "builds", code: `from dataclasses import dataclass, field
@dataclass
class Model:
    width: int = 256
    depth: int = 4
@dataclass
class Config:
    model: Model = field(default_factory=Model)
    lr: float = 0.1
    name: str = 'run'
    amp: bool = False
c = from_dict(Config, {'model': {'depth': 12}, 'lr': 1, 'amp': True})
assert c == Config(Model(256, 12), 1.0, 'run', True), c
assert type(c.lr) is float, 'An int for a float field should become a float.'
assert from_dict(Config, {}) == Config()` },
          { name: "rejects", code: `from dataclasses import dataclass, field
@dataclass
class Model:
    width: int = 256
@dataclass
class Config:
    model: Model = field(default_factory=Model)
    lr: float = 0.1
    steps: int = 100
for d, err, word in [
    ({'lrr': 0.5}, ValueError, 'lrr'),
    ({'model': {'widht': 3}}, ValueError, 'widht'),
    ({'lr': '0.1'}, TypeError, 'lr'),
    ({'steps': 1e4}, TypeError, 'steps'),
    ({'steps': True}, TypeError, 'steps'),
    ({'lr': False}, TypeError, 'lr'),
    ({'model': 5}, TypeError, 'model'),
]:
    try:
        from_dict(Config, d)
    except err as e:
        assert word in str(e), f'The error for {d} should name {word!r}; got {str(e)!r}'
    else:
        assert False, f'{d} should raise {err.__name__}'` },
        ],
      },
    },
    {
      key: "assoc",
      rung: "prove",
      prompt: (
        <p>
          Show with an example that the reading exercise&rsquo;s <C>merge</C> is not associative: <C>merge(merge(a, b), c)</C>{" "}
          can differ from <C>merge(a, merge(b, c))</C>. Then argue that it is associative when, for every key path, the value
          is either a dict in every config that has it or a dict in none.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a valid counterexample, typically where a key holds a dict in a and c but a non-dict in b, and computes both sides.",
          "For the argument, considers a single key and splits into cases by which of a, b, c contain it.",
          "Shows that for non-dict values both sides take the value from the last config containing the key, and that for dict values both sides merge recursively, so the result follows by induction on depth.",
        ],
      },
    },
    {
      key: "random",
      rung: "stretch",
      prompt: (
        <p>
          The best 5% of a large search space would give a result you would be happy with. If you sample 60 configurations
          independently and uniformly, what is the probability that at least one lands in that 5%? Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.954, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend why every setting of an experiment should live in one validated configuration that is saved with the results, and what goes wrong when it does not.",

  glimpse: (
    <p>
      Saving the configuration is the first half of keeping records. Next, experiment tracking: logging metrics, code
      versions and outputs for every run, so that hundreds of runs can be compared and none is lost.
    </p>
  ),
};
