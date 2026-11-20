import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OpRegistrationViz } from "@/components/viz/OpRegistrationViz";
import type { LessonContent } from "@/lib/types";

const REGISTRY = `def register(reg, name, key, fn):
    reg.setdefault(name, {})[key] = fn           # key: "cuda", "fake" or "backward"

def call(reg, name, key, *args):
    impls = reg.get(name, {})
    if key not in impls:
        raise RuntimeError(f"{name}: no {key} implementation")
    return impls[key](*args)

def opcheck(reg, name, args):
    def shape(t):                                 # nested lists stand in for tensors
        return (len(t),) + shape(t[0]) if isinstance(t, list) else ()
    problems = []
    impls = reg.get(name, {})
    if "fake" not in impls:
        problems.append("no fake")
    else:
        real = shape(call(reg, name, "cuda", *args))
        fake = call(reg, name, "fake", *[shape(a) if isinstance(a, list) else a for a in args])
        if real != fake:
            problems.append(f"fake shape {fake} != real shape {real}")
    if "backward" not in impls:
        problems.append("no backward")
    return problems`;

const GRADS = `def rmsnorm(x, w, eps):
    r = (sum(v * v for v in x) / len(x) + eps) ** -0.5
    return [v * r * wi for v, wi in zip(x, w)]

def rmsnorm_backward(x, w, gy, eps):
    n = len(x)
    r = (sum(v * v for v in x) / n + eps) ** -0.5   # rstd, saved by setup_context in practice
    dot = sum(g * wi * v for g, wi, v in zip(gy, w, x))
    gx = [r * wi * g - r ** 3 * v * dot / n for v, wi, g in zip(x, w, gy)]
    gw = [g * v * r for g, v in zip(gy, x)]
    return gx, gw

def numeric_grad(f, x, h=1e-6):
    g = []
    for i in range(len(x)):
        up = x[:i] + [x[i] + h] + x[i + 1:]
        dn = x[:i] + [x[i] - h] + x[i + 1:]
        g.append((f(up) - f(dn)) / (2 * h))       # central difference
    return g`;

const TORCH = `import torch
import triton

@torch.library.custom_op("mylib::rmsnorm", mutates_args=())
def rmsnorm(x: torch.Tensor, w: torch.Tensor, eps: float) -> tuple[torch.Tensor, torch.Tensor]:
    y = torch.empty_like(x)
    rstd = torch.empty(x.shape[0], device=x.device, dtype=torch.float32)
    rmsnorm_fwd[(x.shape[0],)](x, w, y, rstd, x.stride(0), x.shape[1], eps,
                               BLOCK=triton.next_power_of_2(x.shape[1]))
    return y, rstd

@rmsnorm.register_fake
def _(x, w, eps):                                 # shapes and dtypes only; no data, no kernel
    return torch.empty_like(x), x.new_empty(x.shape[0], dtype=torch.float32)

def setup_context(ctx, inputs, output):
    x, w, eps = inputs
    ctx.save_for_backward(x, w, output[1])        # keep rstd rather than recompute it
    ctx.eps = eps

def backward(ctx, gy, grstd):
    x, w, rstd = ctx.saved_tensors
    gx, gw = rmsnorm_bwd(x, w, rstd, gy)          # itself a custom op around a Triton kernel
    return gx, gw, None                           # one gradient per input; none for eps

rmsnorm.register_autograd(backward, setup_context=setup_context)

x = torch.randn(8, 64, device="cuda", requires_grad=True)
w = torch.randn(64, device="cuda", requires_grad=True)
torch.library.opcheck(rmsnorm, (x, w, 1e-6))      # schema, fake, autograd and compile checks`;

export const lesson: LessonContent = {
  id: "e9.6.1",
  minutes: 50,
  links: {
    requires: ["e9.3.2", "e6.2.2"],
    revisits: ["e6.4.2", "e5.5.2"],
    foreshadows: ["e9.6.2"],
  },

  puzzle: (
    <>
      <p>
        A Triton RMSNorm kernel twice as fast as PyTorch&apos;s is called from a model. Eager training works. Under{" "}
        <C>torch.compile</C> the program either fails while tracing or runs with the kernel cut out of the graph, and the backward pass
        has no idea the kernel exists. What does a framework need to know about a kernel before it can treat it like one of its own
        operators?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        PyTorch does not just run operators; it routes each call through a dispatcher that may record it for autograd, trace it with
        fake tensors to build a graph, or run it on a device. A Python function that launches a kernel can only be run. Registering it
        as a custom operator gives it a name and a schema, and lets you attach the other pieces: a fake implementation that computes
        output shapes and dtypes without data, and a backward formula with the context it needs. Then the compiler and autograd can
        treat it as a single opaque but well-described node.
      </p>
      <OpRegistrationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a custom operator">
        <p>
          <C>torch.library.custom_op</C> turns a Python function into an operator named <C>namespace::name</C>, with a schema inferred
          from its type annotations. <C>mutates_args</C> must list every input the function writes to, and outputs must be new tensors,
          never views of inputs, so that the compiler can reason about aliasing. <C>register_fake</C> attaches the implementation used
          during tracing: it receives fake tensors (shape, dtype, device, no storage) and returns fake outputs.{" "}
          <C>register_autograd</C> attaches a <C>backward</C> and a <C>setup_context</C> that saves what backward needs.
        </p>
        <Code>{TORCH}</Code>
        <p>
          The Python model below keeps one registry entry per operator, with a real kernel, a fake and a backward, and a check that the
          fake predicts the real output shape, in the spirit of <C>opcheck</C>.
        </p>
        <Code>{REGISTRY}</Code>
      </Definition>

      <Definition title="what each piece is for">
        <p>
          The fake implementation lets <C>torch.compile</C> trace the whole model without running anything, so the operator becomes one
          node and the compiler can still fuse and schedule around it. The autograd registration makes the operator differentiable; the
          backward usually calls further custom operators wrapping backward kernels. <C>torch.library.triton_op</C> is an alternative
          for Triton kernels that lets the compiler see inside them rather than treating them as opaque.
        </p>
      </Definition>

      <Theorem title="the RMSNorm backward formula">
        <p>
          For <M>{"y_i = x_i r w_i"}</M> with <M>{"r = (\\tfrac{1}{n}\\sum_k x_k^2 + \\varepsilon)^{-1/2}"}</M> and upstream gradient g,
        </p>
        <p>
          <M>{"\\frac{\\partial L}{\\partial w_i} = g_i x_i r, \\qquad \\frac{\\partial L}{\\partial x_j} = r w_j g_j - \\frac{r^3 x_j}{n}\\sum_i g_i w_i x_i."}</M>
        </p>
      </Theorem>
      <Proof>
        <p>
          The first is immediate since <M>{"y_i"}</M> is linear in <M>{"w_i"}</M>. For the second,{" "}
          <M>{"\\partial r / \\partial x_j = -\\tfrac{1}{2}(\\tfrac{1}{n}\\sum x_k^2 + \\varepsilon)^{-3/2} \\cdot 2x_j/n = -r^3 x_j / n"}</M>.
          By the product rule <M>{"\\partial y_i / \\partial x_j = \\delta_{ij} r w_i + x_i w_i \\,\\partial r/\\partial x_j"}</M>, and
          summing against <M>{"g_i"}</M> gives <M>{"r w_j g_j - (r^3 x_j/n)\\sum_i g_i w_i x_i"}</M>. Saving r from the forward pass
          means backward needs one reduction, the dot product, and no square root.
        </p>
        <Code>{GRADS}</Code>
      </Proof>

      <Remark title="common mistakes">
        <ul>
          <li>
            A fake implementation that returns the wrong shape or dtype does not fail at once; the compiled graph is built on false
            shapes and fails, or computes nonsense, somewhere downstream.
          </li>
          <li>
            Writing into an input without listing it in <C>mutates_args</C> lets the compiler reorder or eliminate operations that
            depend on the old value.
          </li>
          <li>
            A backward that is right for contiguous inputs but launched on a transposed gradient reads the wrong elements; kernels should
            take strides or call <C>.contiguous()</C> on their inputs.
          </li>
          <li>
            Returning gradients in the wrong order, or the wrong number of them, is caught only by a gradient check. That is the subject
            of the next lesson.
          </li>
        </ul>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The framework needs a name and schema for the call, a way to compute output shapes without running it, a declaration of what
          it mutates, and a backward formula with saved context. <C>custom_op</C>, <C>register_fake</C> and <C>register_autograd</C>{" "}
          supply exactly these, and <C>opcheck</C> tests that they agree with the kernel.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "fake",
      rung: "check",
      prompt: (
        <p>
          A custom operator packs 4-bit codes, stored one per int8 element in a tensor of shape [4096, 11008], two to a byte along the
          last dimension. What size must its fake implementation report for the output&apos;s last dimension?
        </p>
      ),
      answer: { kind: "numeric", value: 5504, tolerance: 0 },
    },
    {
      key: "grad",
      rung: "check",
      prompt: (
        <p>
          RMSNorm with eps 0 and weights (1, 1) is applied to x = (1, 2), and the upstream gradient is g = (1, 0). What is the gradient
          with respect to the first element of x? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.506, tolerance: 0.001 },
    },
    {
      key: "mutate",
      rung: "apply",
      prompt: (
        <p>
          A custom operator updates an optimiser state tensor in place but is declared with <C>mutates_args=()</C>. What is the risk?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The compiler may reorder or drop operations that read the state, because it believes nothing writes to it",
          "The operator will always raise an error in eager mode",
          "Autograd will compute the gradient twice",
          "The fake implementation will be called on real data",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def register(reg, name, key, fn):
    reg.setdefault(name, {})[key] = fn           # key: "cuda", "fake" or "backward"

def call(reg, name, key, *args):
    impls = reg.get(name, {})
    if key not in impls:
        raise RuntimeError(f"{name}: no {key} implementation")
    return impls[key](*args)

def opcheck(reg, name, args):
    def shape(t):                                 # nested lists stand in for tensors
        return (len(t),) + shape(t[0]) if isinstance(t, list) else ()
    problems = []
    impls = reg.get(name, {})
    if "fake" not in impls:
        problems.append("no fake")
    else:
        real = shape(call(reg, name, "cuda", *args))
        fake = call(reg, name, "fake", *[shape(a) if isinstance(a, list) else a for a in args])
        if real != fake:
            problems.append(f"fake shape {fake} != real shape {real}")
    if "backward" not in impls:
        problems.append("no backward")
    return problems

reg = {}; register(reg, "mylib::double", "cuda", lambda x: [2 * v for v in x]); register(reg, "mylib::double", "fake", lambda s: s)
print(call(reg, "mylib::double", "cuda", [1, 2]), call(reg, "mylib::double", "fake", (2,)), opcheck(reg, "mylib::double", [[1, 2, 3]]), sorted(reg["mylib::double"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 4] (2,) ['no backward'] ['cuda', 'fake']",
          "[2, 4] (2,) [] ['cuda', 'fake']",
          "[2, 4] (2,) ['fake shape (3,) != real shape (2,)', 'no backward'] ['cuda', 'fake']",
          "[2, 4] [4, 8] ['no backward'] ['cuda', 'fake']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rmsnorm(x, w, eps):
    r = (sum(v * v for v in x) / len(x) + eps) ** -0.5
    return [v * r * wi for v, wi in zip(x, w)]

def rmsnorm_backward(x, w, gy, eps):
    n = len(x)
    r = (sum(v * v for v in x) / n + eps) ** -0.5   # rstd, saved by setup_context in practice
    dot = sum(g * wi * v for g, wi, v in zip(gy, w, x))
    gx = [r * wi * g - r ** 3 * v * dot / n for v, wi, g in zip(x, w, gy)]
    gw = [g * v * r for g, v in zip(gy, x)]
    return gx, gw

def numeric_grad(f, x, h=1e-6):
    g = []
    for i in range(len(x)):
        up = x[:i] + [x[i] + h] + x[i + 1:]
        dn = x[:i] + [x[i] - h] + x[i + 1:]
        g.append((f(up) - f(dn)) / (2 * h))       # central difference
    return g

x, w = [3.0, 4.0], [1.0, 2.0]
print([round(v, 3) for v in rmsnorm(x, w, 0.0)], [[round(v, 3) for v in g] for g in rmsnorm_backward(x, w, [1.0, 0.0], 0.0)], [round(v, 3) for v in numeric_grad(lambda v: rmsnorm(v, w, 0.0)[0], x)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.849, 2.263] [[0.181, -0.136], [0.849, 0.0]] [0.181, -0.136]",
          "[0.849, 2.263] [[0.283, 0.0], [0.849, 0.0]] [0.181, -0.136]",
          "[0.849, 2.263] [[0.181, -0.136], [0.849, 1.131]] [0.181, -0.136]",
          "[0.6, 1.6] [[0.181, -0.136], [0.849, 0.0]] [0.181, -0.136]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>register(reg, name, key, fn)</C>; <C>call(reg, name, key, *args)</C>, which raises <C>RuntimeError</C> when the
          implementation is missing; and <C>opcheck(reg, name, args)</C>, returning a list of problems: &quot;no fake&quot; if there is
          no fake, a message if the fake&apos;s shape (computed from argument shapes, with non-list arguments passed through) differs from
          the shape of the real output, and &quot;no backward&quot; if there is no backward.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def register(reg, name, key, fn):
    reg[name] = fn

def call(reg, name, key, *args):
    return None

def opcheck(reg, name, args):
    return []
`,
        solution: REGISTRY,
        tests: [
          { name: "dispatch", code: `reg = {}\nregister(reg, "lib::sq", "cuda", lambda x: [v * v for v in x])\nregister(reg, "lib::sq", "backward", lambda g, x: [2 * a * b for a, b in zip(g, x)])\nassert call(reg, "lib::sq", "cuda", [3, 4]) == [9, 16] and call(reg, "lib::sq", "backward", [1, 1], [3, 4]) == [6, 8]\ntry:\n    call(reg, "lib::sq", "fake", (2,))\n    assert False\nexcept RuntimeError:\n    pass` },
          { name: "check", code: `reg = {}\nregister(reg, "lib::pair", "cuda", lambda x, k: [[v] * k for v in x])\nregister(reg, "lib::pair", "fake", lambda s, k: (s[0], k + 1))\nassert opcheck(reg, "lib::pair", [[1, 2, 3], 2]) == ["fake shape (3, 3) != real shape (3, 2)", "no backward"]\nregister(reg, "lib::pair", "fake", lambda s, k: (s[0], k))\nregister(reg, "lib::pair", "backward", lambda g: g)\nassert opcheck(reg, "lib::pair", [[1, 2, 3], 2]) == []\nassert opcheck({}, "lib::none", [[1]]) == ["no fake", "no backward"]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rmsnorm(x, w, eps)</C> for one row, <C>rmsnorm_backward(x, w, gy, eps)</C>, returning (gx, gw) by the theorem, and{" "}
          <C>numeric_grad(f, x, h=1e-6)</C>, the central-difference gradient of a scalar function of a list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rmsnorm(x, w, eps):
    return list(x)

def rmsnorm_backward(x, w, gy, eps):
    return list(gy), list(gy)

def numeric_grad(f, x, h=1e-6):
    return [0.0] * len(x)
`,
        solution: GRADS,
        tests: [
          { name: "forward", code: `y = rmsnorm([1.0, -1.0, 1.0, -1.0], [2.0, 2.0, 2.0, 2.0], 0.0)\nassert all(abs(a - b) < 1e-12 for a, b in zip(y, [2.0, -2.0, 2.0, -2.0]))\ng = numeric_grad(lambda v: v[0] * v[1], [3.0, 5.0])\nassert abs(g[0] - 5.0) < 1e-6 and abs(g[1] - 3.0) < 1e-6` },
          { name: "backward", code: `x, w, gy = [0.5, -1.2, 2.0], [1.5, 0.7, -0.3], [0.4, 1.1, -0.8]\ngx, gw = rmsnorm_backward(x, w, gy, 1e-3)\nL = lambda v: sum(g * y for g, y in zip(gy, rmsnorm(v, w, 1e-3)))\nLw = lambda u: sum(g * y for g, y in zip(gy, rmsnorm(x, u, 1e-3)))\nassert all(abs(a - b) < 1e-6 for a, b in zip(gx, numeric_grad(L, x)))\nassert all(abs(a - b) < 1e-6 for a, b in zip(gw, numeric_grad(Lw, w)))` },
        ],
      },
    },
    {
      key: "batch",
      rung: "stretch",
      prompt: (
        <p>
          RMSNorm with eps 0 and weights (1, 1) is applied to two rows, (1, 2) and (2, 0), and every upstream gradient is 1. The weight is
          shared by both rows. What is the gradient with respect to the first weight? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.047, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A registered operator that passes <C>opcheck</C> can still be wrong: off by one at a block edge, inaccurate in bfloat16, or racy
        under atomics. The last lesson asks how to test kernels so that such bugs are found before training finds them.
      </p>
    </>
  ),
};
