import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GradHookViz } from "@/components/viz/GradHookViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

x = torch.tensor(3.0, requires_grad=True)
y = torch.tensor(4.0, requires_grad=True)
u = x * y
z = u + x
z.grad_fn                         # <AddBackward0>
z.grad_fn.next_functions          # ((<MulBackward0>, 0), (<AccumulateGrad>, 0))
u.register_hook(lambda g: 2 * g)  # rewrite the gradient arriving at u
z.backward()
x.grad, y.grad, u.grad            # tensor(9.), tensor(6.), None (u is not a leaf)

acts = {}
model = torch.nn.Sequential(torch.nn.Linear(4, 8), torch.nn.ReLU())
handle = model[0].register_forward_hook(lambda mod, inp, out: acts.update(lin=out.detach()))
model(torch.randn(2, 4)); handle.remove()`;

const ENGINE = `def leaf(v):
    return {"value": float(v), "grad": None, "parents": (), "hooks": [], "retain": False}

def op(value, parents):
    return {"value": value, "grad": None, "parents": parents, "hooks": [], "retain": False}

def mul(a, b):
    return op(a["value"] * b["value"], ((a, b["value"]), (b, a["value"])))

def add(a, b):
    return op(a["value"] + b["value"], ((a, 1.0), (b, 1.0)))

def backward(root):
    order, seen = [], set()
    def visit(t):
        if id(t) not in seen:
            seen.add(id(t))
            for p, _ in t["parents"]:
                visit(p)
            order.append(t)
    visit(root)
    g = {id(root): 1.0}
    for t in reversed(order):
        gt = g.get(id(t), 0.0)
        for h in t["hooks"]:
            r = h(gt)
            gt = gt if r is None else r
        if not t["parents"] or t["retain"]:
            t["grad"] = gt if t["grad"] is None else t["grad"] + gt
        for p, local in t["parents"]:
            g[id(p)] = g.get(id(p), 0.0) + gt * local`;

const HOOKS = `def register_hook(t, fn):
    t["hooks"].append(fn)
    return lambda: t["hooks"].remove(fn)

def clip_hook(limit):
    return lambda g: max(-limit, min(limit, g))

def capture(layers, x, store):
    for name, fn in layers:
        x = fn(x)
        store[name] = x
    return x`;

export const lesson: LessonContent = {
  id: "e6.2.1",
  minutes: 50,
  links: {
    requires: ["e6.1.3", "e5.1.2"],
    revisits: ["l3.2.1"],
    foreshadows: ["e6.2.2"],
  },

  puzzle: (
    <>
      <p>
        After <C>loss.backward()</C>, the weights have a <C>.grad</C> but an intermediate activation you wanted to inspect
        has <C>None</C>. Calling <C>backward()</C> a second time raises an error about buffers already freed, and when you
        pass <C>retain_graph=True</C> the gradients come out doubled. Meanwhile a library you use clips gradients without
        touching the optimiser at all. All of this follows from how PyTorch records the graph during the forward pass and
        what it does when walking it backwards.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every operation on a tensor that requires gradients creates a node, its <C>grad_fn</C>, that remembers which nodes
        produced its inputs and whatever values it needs to compute local derivatives. <C>backward()</C> walks these nodes
        from the loss in reverse topological order. Gradients are stored in <C>.grad</C> only for leaves, the tensors you
        created yourself, and they are added to whatever is already there. After the walk, the saved values are freed. Hooks
        are callbacks at chosen points of this walk, or of the forward pass, that can look at a value or replace it.
      </p>
      <GradHookViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the recorded graph">
        <p>
          A tensor with <C>requires_grad=True</C> created by the user is a leaf; its <C>grad_fn</C> is None, and an{" "}
          <C>AccumulateGrad</C> node adds incoming gradients to its <C>.grad</C>. Every other result of a differentiable
          operation has a <C>grad_fn</C> whose <C>next_functions</C> point to the nodes of its inputs. Non-leaf tensors do not
          keep <C>.grad</C> unless <C>retain_grad()</C> is called. Inside <C>torch.no_grad()</C>, or for tensors from{" "}
          <C>detach()</C>, nothing is recorded.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="accumulation is the chain rule">
        <p>
          When a tensor feeds several operations, the gradient reaching it is the sum of the contributions along each
          outgoing edge, and processing nodes in reverse topological order ensures each node&apos;s total is complete before it
          is passed on. Adding new gradients to <C>.grad</C> across separate <C>backward()</C> calls therefore computes the
          gradient of the sum of the losses.
        </p>
      </Theorem>
      <Proof>
        <p>
          The multivariate chain rule writes <C>∂L/∂t</C> as the sum over consumers c of t of <C>∂L/∂c · ∂c/∂t</C>. In reverse
          topological order every consumer of t is processed before t, so all terms have arrived when t is reached. Across
          calls, the gradient of <C>L₁ + L₂</C> is the sum of the gradients, which is exactly what accumulation into{" "}
          <C>.grad</C> gives; this is why training loops call <C>zero_grad()</C>, and why gradient accumulation over
          micro-batches needs no special code. The error on a second backward comes from the saved values, not the graph: they
          are released after the first walk unless <C>retain_graph=True</C>.
        </p>
        <Code>{ENGINE}</Code>
      </Proof>

      <Definition title="hooks">
        <p>
          <C>t.register_hook(fn)</C> calls fn with the gradient with respect to t when it has been computed; a returned tensor
          replaces it for the rest of the walk. Module forward hooks receive the module, its inputs and its output, and are
          the standard way to capture activations; full backward hooks receive gradients with respect to a module&apos;s inputs
          and outputs. Every registration returns a handle whose <C>remove()</C> unregisters it.
        </p>
        <Code>{HOOKS}</Code>
      </Definition>

      <Example title="hooks in the figure">
        <p>
          For z = x·y + x with x = 3 and y = 4, backward gives x.grad = 5 and y.grad = 3. Doubling the gradient at u gives 9
          and 6, clipping it to 0.5 gives 3 and 1.5, and zeroing it gives 1 and 0: x still receives the gradient from the direct
          edge z = … + x, which no hook on u can touch.
        </p>
      </Example>

      <Remark title="using hooks well">
        <p>
          Store detached copies of activations in forward hooks, or the stored tensors keep the whole graph alive. Remove
          hooks when done, since they persist across calls. Per-parameter hooks are how distributed data parallel overlaps
          gradient communication with the rest of the backward pass: as soon as a bucket of gradients is complete, a hook
          launches its all-reduce.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "double",
      rung: "check",
      prompt: <p>In the figure&apos;s graph with x = 3 and y = 4, what is x.grad when the hook on u multiplies by 2?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.001 },
    },
    {
      key: "acc",
      rung: "check",
      prompt: (
        <p>
          A loss whose gradient with respect to w is 0.5 is backpropagated three times with <C>retain_graph=True</C> and no
          zeroing. What is w.grad?
        </p>
      ),
      answer: { kind: "numeric", value: 1.5, tolerance: 0.001 },
    },
    {
      key: "none",
      rung: "apply",
      prompt: <p>After <C>loss.backward()</C>, <C>h.grad</C> is None for a hidden activation h. What is the best way to get its gradient?</p>,
      answer: {
        kind: "choice",
        options: [
          "Set h.requires_grad = True after the forward pass",
          "Call h.retain_grad() before backward, or register a hook on h that stores the gradient",
          "Call backward() twice",
          "Wrap the forward pass in torch.no_grad()",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def leaf(v):
    return {"value": float(v), "grad": None, "parents": (), "hooks": [], "retain": False}

def op(value, parents):
    return {"value": value, "grad": None, "parents": parents, "hooks": [], "retain": False}

def mul(a, b):
    return op(a["value"] * b["value"], ((a, b["value"]), (b, a["value"])))

def add(a, b):
    return op(a["value"] + b["value"], ((a, 1.0), (b, 1.0)))

def backward(root):
    order, seen = [], set()
    def visit(t):
        if id(t) not in seen:
            seen.add(id(t))
            for p, _ in t["parents"]:
                visit(p)
            order.append(t)
    visit(root)
    g = {id(root): 1.0}
    for t in reversed(order):
        gt = g.get(id(t), 0.0)
        for h in t["hooks"]:
            r = h(gt)
            gt = gt if r is None else r
        if not t["parents"] or t["retain"]:
            t["grad"] = gt if t["grad"] is None else t["grad"] + gt
        for p, local in t["parents"]:
            g[id(p)] = g.get(id(p), 0.0) + gt * local

x, y = leaf(3.0), leaf(4.0); z = add(mul(x, y), x); backward(z); print(x["grad"], y["grad"], z["grad"])
backward(z); u = mul(x, x); u["retain"] = True; backward(mul(u, y)); print(x["grad"], u["grad"])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["5.0 3.0 None\n34.0 4.0", "5.0 3.0 1.0\n34.0 4.0", "5.0 3.0 None\n24.0 4.0", "4.0 3.0 None\n34.0 None"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def register_hook(t, fn):
    t["hooks"].append(fn)
    return lambda: t["hooks"].remove(fn)

def clip_hook(limit):
    return lambda g: max(-limit, min(limit, g))

def capture(layers, x, store):
    for name, fn in layers:
        x = fn(x)
        store[name] = x
    return x

t = {"hooks": []}; remove = register_hook(t, clip_hook(1.0)); print(t["hooks"][0](5.0), t["hooks"][0](-0.3)); remove(); print(len(t["hooks"]))
store = {}; print(capture([("double", lambda v: 2 * v), ("inc", lambda v: v + 1)], 3, store), store)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 -0.3\n0\n7 {'double': 6, 'inc': 7}",
          "1.0 -1.0\n0\n7 {'double': 6, 'inc': 7}",
          "1.0 -0.3\n1\n7 {'double': 6, 'inc': 7}",
          "1.0 -0.3\n0\n7 {'inc': 7}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Tensors are dictionaries built by the given <C>leaf</C>, <C>op</C>, <C>mul</C> and <C>add</C>. Write{" "}
          <C>backward(root)</C>: visit the graph in reverse topological order from root, apply each tensor&apos;s hooks to its
          total incoming gradient (a hook returning None leaves it unchanged), accumulate into <C>grad</C> for leaves and for
          tensors with retain set, and pass gradients to parents times the local derivatives.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def leaf(v):
    return {"value": float(v), "grad": None, "parents": (), "hooks": [], "retain": False}

def op(value, parents):
    return {"value": value, "grad": None, "parents": parents, "hooks": [], "retain": False}

def mul(a, b):
    return op(a["value"] * b["value"], ((a, b["value"]), (b, a["value"])))

def add(a, b):
    return op(a["value"] + b["value"], ((a, 1.0), (b, 1.0)))

def backward(root):
    pass
`,
        solution: ENGINE,
        tests: [
          { name: "chain", code: `x = leaf(2.0); u = mul(x, x); z = mul(u, x); backward(z); assert x["grad"] == 12.0 and u["grad"] is None
a, b = leaf(1.5), leaf(-2.0); s = add(mul(a, b), mul(a, a)); backward(s); backward(s); assert a["grad"] == 2 * (-2.0 + 3.0) and b["grad"] == 3.0` },
          { name: "hooks", code: `x = leaf(2.0); u = mul(x, x); u["hooks"].append(lambda g: 0.0); u["retain"] = True; z = mul(u, x); backward(z); assert x["grad"] == 4.0 and u["grad"] == 0.0
y = leaf(3.0); seen = []; y["hooks"].append(lambda g: seen.append(g)); backward(add(y, mul(y, y))); assert seen == [7.0] and y["grad"] == 7.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>register_hook(t, fn)</C>, appending to t&apos;s hooks and returning a function that removes it,{" "}
          <C>clip_hook(limit)</C>, returning a hook that clips a gradient to [−limit, limit], and{" "}
          <C>capture(layers, x, store)</C>, which runs x through named layer functions in order, records each output under its
          name, and returns the final output.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def register_hook(t, fn):
    return lambda: None

def clip_hook(limit):
    return lambda g: g

def capture(layers, x, store):
    return x
`,
        solution: HOOKS,
        tests: [
          { name: "register", code: `t = {"hooks": [print]}; f = lambda g: g; rm = register_hook(t, f); assert t["hooks"] == [print, f]; rm(); assert t["hooks"] == [print]
h = clip_hook(2.5); assert h(10) == 2.5 and h(-7) == -2.5 and h(1.25) == 1.25` },
          { name: "capture", code: `st = {}; out = capture([("a", abs), ("b", lambda v: v * 10), ("c", str)], -4, st); assert out == "40" and st == {"a": 4, "b": 40, "c": "40"} and capture([], 5, {}) == 5` },
        ],
      },
    },
    {
      key: "stop",
      rung: "stretch",
      prompt: (
        <p>
          With x = 2, u = x·x and z = u·x, a hook on u replaces its gradient by 0. What is x.grad after <C>z.backward()</C>?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Hooks adjust gradients that autograd already knows how to compute. The next lesson defines new operations with their
        own backward formulas, for when the automatic one is wrong, unstable or too expensive.
      </p>
    </>
  ),
};
