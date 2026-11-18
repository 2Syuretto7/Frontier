import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StateDictViz } from "@/components/viz/StateDictViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch
from torch import nn

class Block(nn.Module):
    def __init__(self, d):
        super().__init__()
        self.ff = nn.Linear(d, d)                         # submodule: registered by __setattr__
        self.gain = nn.Parameter(torch.ones(d))           # parameter: trained and saved
        self.register_buffer("seen", torch.zeros(()))     # buffer: saved, moved by .to(), not trained
        self.register_buffer("mask", torch.ones(d), persistent=False)  # moved, not saved
        self.note = torch.zeros(d)                        # plain attribute: invisible to all of it

m = nn.Sequential(Block(64), Block(64)).to("cuda")
print([n for n, _ in m.named_parameters()])   # ['0.ff.weight', '0.ff.bias', '0.gain', '1.ff.weight', ...]
m[0].requires_grad_(False)                       # freeze the first block
opt = torch.optim.AdamW([p for p in m.parameters() if p.requires_grad])

sd = torch.load("ddp.pt")                        # keys look like 'module.0.ff.weight'
torch.nn.modules.utils.consume_prefix_in_state_dict_if_present(sd, "module.")
result = m.load_state_dict(sd, strict=False)     # result.missing_keys, result.unexpected_keys`;

const MODULE = `import numpy as np

class Parameter:
    def __init__(self, data, requires_grad=True):
        self.data = np.array(data, dtype=float)
        self.requires_grad = requires_grad

class Module:
    def __init__(self):
        self.__dict__.update(_params={}, _buffers={}, _modules={}, _transient=set())

    def __setattr__(self, name, value):
        if isinstance(value, Parameter):
            self._params[name] = value
        elif isinstance(value, Module):
            self._modules[name] = value
        elif name in self._buffers:
            self._buffers[name] = np.array(value, dtype=float)
        else:
            self.__dict__[name] = value

    def __getattr__(self, name):
        for d in (self._params, self._buffers, self._modules):
            if name in d:
                return d[name]
        raise AttributeError(name)

    def register_buffer(self, name, value, persistent=True):
        self._buffers[name] = np.array(value, dtype=float)
        if not persistent:
            self._transient.add(name)

    def named_parameters(self, prefix=''):
        for n, p in self._params.items():
            yield prefix + n, p
        for n, m in self._modules.items():
            yield from m.named_parameters(prefix + n + '.')

    def state_dict(self, prefix=''):
        sd = {prefix + n: p.data.copy() for n, p in self._params.items()}
        sd.update({prefix + n: b.copy() for n, b in self._buffers.items() if n not in self._transient})
        for n, m in self._modules.items():
            sd.update(m.state_dict(prefix + n + '.'))
        return sd`;

const LOAD = `import numpy as np

def strip_prefix(sd, prefix):
    return {k[len(prefix):] if k.startswith(prefix) else k: v for k, v in sd.items()}

def check_load(model_sd, sd):
    missing = sorted(set(model_sd) - set(sd))
    unexpected = sorted(set(sd) - set(model_sd))
    mismatched = sorted(k for k in set(sd) & set(model_sd) if np.shape(sd[k]) != np.shape(model_sd[k]))
    return missing, unexpected, mismatched

def load(model_sd, sd, strict=True):
    missing, unexpected, mismatched = check_load(model_sd, sd)
    if mismatched:
        raise ValueError(f'shape mismatch: {mismatched}')
    if strict and (missing or unexpected):
        raise KeyError(f'missing {missing}, unexpected {unexpected}')
    out = {k: v.copy() for k, v in model_sd.items()}
    out.update({k: np.array(sd[k], dtype=float) for k in sd if k in model_sd})
    return out`;

export const lesson: LessonContent = {
  id: "e6.3.1",
  minutes: 45,
  links: {
    requires: ["e6.2.3"],
    revisits: ["e6.1.1"],
    foreshadows: ["e6.3.3", "e6.5.1"],
  },

  puzzle: (
    <>
      <p>
        A colleague adds a running average to a layer as <C>self.ema = torch.zeros(d)</C>. After{" "}
        <C>model.to(&quot;cuda&quot;)</C> the forward pass fails with a device mismatch, and after a restart the average
        has gone back to zero. Meanwhile a checkpoint saved from a data-parallel run refuses to load because every key
        begins with <C>module.</C>, and a fine-tuning script that froze the embedding still spends optimiser memory on it.
        All four come from one piece of bookkeeping that <C>nn.Module</C> does quietly. What does it record, and when?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A module intercepts attribute assignment. Assigning a <C>Parameter</C> files it under parameters; assigning another
        module files it under submodules; a tensor passed to <C>register_buffer</C> is filed under buffers. Everything else
        is an ordinary Python attribute that PyTorch does not know about. Every recursive operation, from{" "}
        <C>named_parameters</C> and <C>.to()</C> to <C>state_dict</C> and <C>train()</C>, walks those three registries and
        builds dotted names from the path. Knowing which registry a tensor sits in tells you whether it is trained, moved,
        saved or none of these.
      </p>
      <StateDictViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the three registries">
        <p>
          <C>nn.Module.__setattr__</C> places Parameters in <C>_parameters</C>, Modules in <C>_modules</C>, and updates{" "}
          <C>_buffers</C> when the name is already a buffer; <C>__getattr__</C> looks them up there, since they are not in
          the instance dictionary. Parameters are returned by <C>parameters()</C>, carry <C>requires_grad=True</C> by
          default, and are what you hand to an optimiser. Buffers are tensors that belong to the model but are not trained,
          such as batch-norm statistics; <C>persistent=False</C> keeps one out of the state dict.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="state dict keys">
        <p>
          The key of a parameter or persistent buffer is the sequence of attribute names from the root module to it, joined
          by dots, and <C>state_dict</C> contains exactly one key per such path. Two models whose modules are assigned under
          the same names in the same structure produce the same keys, whatever their class names.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on depth. A module with no submodules emits its own registered names with the given prefix. A module
          with submodules emits its own names, then, for each submodule assigned under name n, the keys of that submodule
          with prefix extended by <C>n.</C>, which by hypothesis are its paths. Distinct paths give distinct strings because
          names contain no dots. Only attribute names enter, so class names do not matter. A tensor reachable by two paths,
          as with tied weights, appears under both keys.
        </p>
        <Code>{MODULE}</Code>
      </Proof>

      <Example title="loading a checkpoint">
        <p>
          <C>DistributedDataParallel</C> wraps the model as <C>self.module</C>, so its keys gain a <C>module.</C> prefix,
          and <C>torch.compile</C> adds <C>_orig_mod.</C>. Strip the prefix, then compare key sets: missing keys are in the
          model but not the file, unexpected keys the reverse. Strict loading refuses either; a shape mismatch is always an
          error. Loading with <C>strict=False</C> is right for a new head on a pretrained body, and dangerous otherwise,
          because a typo in a prefix loads nothing and raises nothing.
        </p>
        <Code>{LOAD}</Code>
      </Example>

      <Remark title="freezing, modes and hooks">
        <p>
          Freezing is <C>requires_grad_(False)</C>; also leave frozen parameters out of the optimiser, or AdamW will keep
          state for them and weight decay will still shrink them. <C>train()</C> and <C>eval()</C> only set a{" "}
          <C>training</C> flag on every module, which dropout and batch norm read. PyTorch&apos;s <C>named_parameters</C>{" "}
          skips a tensor it has already yielded, so tied weights are counted once; the minimal version here does not.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "linear",
      rung: "check",
      prompt: <p>How many parameters does <C>nn.Linear(512, 256)</C> have, with bias?</p>,
      answer: { kind: "numeric", value: 131328, tolerance: 0.5 },
    },
    {
      key: "bn",
      rung: "check",
      prompt: (
        <p>
          <C>nn.BatchNorm1d(64)</C> has a weight and bias, and buffers running_mean, running_var (64 each) and a scalar
          num_batches_tracked. How many numbers does its state dict hold?
        </p>
      ),
      answer: { kind: "numeric", value: 257, tolerance: 0.5 },
    },
    {
      key: "attr",
      rung: "apply",
      prompt: <p>Why did the colleague&apos;s <C>self.ema = torch.zeros(d)</C> break after <C>model.to(&quot;cuda&quot;)</C>?</p>,
      answer: {
        kind: "choice",
        options: [
          "A plain tensor attribute is in none of the registries, so .to() did not move it and state_dict did not save it; register_buffer fixes both",
          "Tensors created in __init__ always live on the CPU",
          "It should have been a Parameter, since only parameters can be moved",
          "zeros creates a tensor that requires grad, which .to() cannot move",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

class Parameter:
    def __init__(self, data, requires_grad=True):
        self.data = np.array(data, dtype=float)
        self.requires_grad = requires_grad

class Module:
    def __init__(self):
        self.__dict__.update(_params={}, _buffers={}, _modules={}, _transient=set())

    def __setattr__(self, name, value):
        if isinstance(value, Parameter):
            self._params[name] = value
        elif isinstance(value, Module):
            self._modules[name] = value
        elif name in self._buffers:
            self._buffers[name] = np.array(value, dtype=float)
        else:
            self.__dict__[name] = value

    def __getattr__(self, name):
        for d in (self._params, self._buffers, self._modules):
            if name in d:
                return d[name]
        raise AttributeError(name)

    def register_buffer(self, name, value, persistent=True):
        self._buffers[name] = np.array(value, dtype=float)
        if not persistent:
            self._transient.add(name)

    def named_parameters(self, prefix=''):
        for n, p in self._params.items():
            yield prefix + n, p
        for n, m in self._modules.items():
            yield from m.named_parameters(prefix + n + '.')

    def state_dict(self, prefix=''):
        sd = {prefix + n: p.data.copy() for n, p in self._params.items()}
        sd.update({prefix + n: b.copy() for n, b in self._buffers.items() if n not in self._transient})
        for n, m in self._modules.items():
            sd.update(m.state_dict(prefix + n + '.'))
        return sd

class Norm(Module):
    def __init__(self, d):
        super().__init__(); self.scale = Parameter(np.ones(d)); self.register_buffer('mean', np.zeros(d)); self.register_buffer('cache', np.zeros(8), persistent=False)
class Net(Module):
    def __init__(self):
        super().__init__(); self.lin = Parameter(np.zeros((3, 2))); self.norm = Norm(3); self.norm.mean = [1, 2, 3]; self.steps = 0
net = Net(); print([n for n, _ in net.named_parameters()], sorted(net.state_dict()), net.norm.mean.tolist(), sorted(net.__dict__)[-1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['lin', 'norm.scale'] ['lin', 'norm.mean', 'norm.scale'] [1.0, 2.0, 3.0] steps",
          "['lin', 'norm.scale'] ['lin', 'norm.cache', 'norm.mean', 'norm.scale'] [1.0, 2.0, 3.0] steps",
          "['lin', 'scale'] ['lin', 'mean', 'scale'] [1.0, 2.0, 3.0] steps",
          "['lin', 'norm.scale'] ['lin', 'norm.mean', 'norm.scale'] [0.0, 0.0, 0.0] steps",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def strip_prefix(sd, prefix):
    return {k[len(prefix):] if k.startswith(prefix) else k: v for k, v in sd.items()}

def check_load(model_sd, sd):
    missing = sorted(set(model_sd) - set(sd))
    unexpected = sorted(set(sd) - set(model_sd))
    mismatched = sorted(k for k in set(sd) & set(model_sd) if np.shape(sd[k]) != np.shape(model_sd[k]))
    return missing, unexpected, mismatched

def load(model_sd, sd, strict=True):
    missing, unexpected, mismatched = check_load(model_sd, sd)
    if mismatched:
        raise ValueError(f'shape mismatch: {mismatched}')
    if strict and (missing or unexpected):
        raise KeyError(f'missing {missing}, unexpected {unexpected}')
    out = {k: v.copy() for k, v in model_sd.items()}
    out.update({k: np.array(sd[k], dtype=float) for k in sd if k in model_sd})
    return out

model = {'w': np.zeros(2), 'b': np.zeros(1)}; ckpt = strip_prefix({'module.w': np.ones(2), 'module.extra': np.ones(1)}, 'module.')
print(sorted(ckpt), check_load(model, ckpt), load(model, ckpt, strict=False)['w'].tolist())
try: load(model, {'w': np.ones(3), 'b': np.ones(1)})
except Exception as e: print(type(e).__name__)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['extra', 'w'] (['b'], ['extra'], [])\n[1.0, 1.0]\nValueError",
          "['extra', 'w'] (['b'], ['extra'], []) [1.0, 1.0]\nValueError",
          "['extra', 'w'] (['extra'], ['b'], []) [1.0, 1.0]\nValueError",
          "['extra', 'w'] (['b'], ['extra'], []) [1.0, 1.0]\nKeyError",
        ],
        correct: [1],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>Parameter</C>, write the class <C>Module</C> with <C>__setattr__</C> and <C>__getattr__</C>{" "}
          that keep parameters, buffers and submodules in three dictionaries, <C>register_buffer(name, value,
          persistent=True)</C>, a generator <C>named_parameters(prefix)</C> and <C>state_dict(prefix)</C>, which copies
          parameters and persistent buffers under dotted names.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

class Parameter:
    def __init__(self, data, requires_grad=True):
        self.data = np.array(data, dtype=float)
        self.requires_grad = requires_grad

class Module:
    def __init__(self):
        pass

    def named_parameters(self, prefix=''):
        return iter(())

    def state_dict(self, prefix=''):
        return {}
`,
        solution: MODULE,
        tests: [
          { name: "registry", code: `class Leaf(Module):
    def __init__(self):
        super().__init__(); self.w = Parameter([[1.0, 2.0]]); self.register_buffer('n', [0.0]); self.register_buffer('tmp', [5.0], persistent=False); self.tag = 'x'
class Root(Module):
    def __init__(self):
        super().__init__(); self.a = Leaf(); self.b = Leaf(); self.bias = Parameter([0.5])
r = Root(); r.a.n = [7.0]
assert [n for n, _ in r.named_parameters()] == ['bias', 'a.w', 'b.w'] and r.a.n.tolist() == [7.0] and r.a.tag == 'x' and 'w' not in r.a.__dict__
sd = r.state_dict(); assert sorted(sd) == ['a.n', 'a.w', 'b.n', 'b.w', 'bias'] and sd['a.n'].tolist() == [7.0]` },
          { name: "copies", code: `class Leaf(Module):
    def __init__(self):
        super().__init__(); self.w = Parameter([1.0, 2.0])
m = Leaf(); sd = m.state_dict('top.'); sd['top.w'][0] = 9.0
assert list(sd) == ['top.w'] and m.w.data.tolist() == [1.0, 2.0] and isinstance(m.w, Parameter)
try:
    m.missing
    assert False
except AttributeError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>strip_prefix(sd, prefix)</C>, <C>check_load(model_sd, sd)</C>, returning sorted lists of missing,
          unexpected and shape-mismatched keys, and <C>load(model_sd, sd, strict=True)</C>, which raises ValueError on any
          mismatch, KeyError on missing or unexpected keys when strict, and otherwise returns a new dict with the matching
          entries replaced by copies from sd.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def strip_prefix(sd, prefix):
    return sd

def check_load(model_sd, sd):
    return [], [], []

def load(model_sd, sd, strict=True):
    return model_sd
`,
        solution: LOAD,
        tests: [
          { name: "check", code: `sd = strip_prefix({'_orig_mod.a': np.ones(2), '_orig_mod.c': np.ones(1), 'd': np.ones((2, 2))}, '_orig_mod.')
assert sorted(sd) == ['a', 'c', 'd'] and check_load({'a': np.zeros(2), 'b': np.zeros(1), 'd': np.zeros(4)}, sd) == (['b'], ['c'], ['d'])` },
          { name: "load", code: `m = {'a': np.zeros(2), 'b': np.zeros(1)}; src = {'a': np.array([3.0, 4.0]), 'z': np.ones(1)}
out = load(m, src, strict=False); src['a'][0] = 0.0
assert out['a'].tolist() == [3.0, 4.0] and out['b'].tolist() == [0.0] and 'z' not in out and m['a'].tolist() == [0.0, 0.0]
for bad, err in [((m, src), KeyError), ((m, {'a': np.ones(3), 'b': np.ones(1)}, False), ValueError)]:
    try:
        load(*bad)
        assert False
    except err:
        pass` },
        ],
      },
    },
    {
      key: "untie",
      rung: "stretch",
      prompt: <p>A model ties a 50,257 × 768 embedding to its output head. How many parameters does untying them add?</p>,
      answer: { kind: "numeric", value: 38597376, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        A model that saves and loads correctly still has to be fed. The next lesson measures where a training step&apos;s
        time goes when the GPU waits on data, and how workers, pinned memory and prefetching keep it busy.
      </p>
    </>
  ),
};
