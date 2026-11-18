import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MemoryFormatViz } from "@/components/viz/MemoryFormatViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

x = torch.arange(24).reshape(2, 3, 4)
x.stride(), x.is_contiguous()          # (12, 4, 1) True
y = x.transpose(1, 2)                   # shape (2, 4, 3), no copy
y.stride(), y.is_contiguous()          # (12, 1, 4) False
y.view(2, 12)                           # RuntimeError: view size is not compatible ...
y.reshape(2, 12)                        # works: copies because a view is impossible
y.contiguous().view(2, 12)              # explicit copy, then a free view

img = torch.randn(8, 3, 32, 32).to(memory_format=torch.channels_last)
img.shape, img.stride()                 # (8, 3, 32, 32) (3072, 1, 96, 3)
img.is_contiguous(memory_format=torch.channels_last)   # True

b = torch.randn(3, 1).expand(2, 3, 5)   # stride (0, 1, 0): one row stored, read many times`;

const LAYOUT = `def contiguous_strides(shape):
    strides, step = [], 1
    for size in reversed(shape):
        strides.append(step)
        step *= size
    return tuple(reversed(strides))

def is_contiguous(shape, strides):
    expected = 1
    for size, stride in zip(reversed(shape), reversed(strides)):
        if size != 1:
            if stride != expected:
                return False
            expected *= size
    return True

def channels_last_strides(n, c, h, w):
    return (h * w * c, 1, w * c, c)`;

const VIEW = `def view_strides(shape, strides, new):
    out, vd = [0] * len(new), len(new) - 1
    base, t_numel, v_numel = strides[-1], 1, 1
    for d in range(len(shape) - 1, -1, -1):
        t_numel *= shape[d]
        if d == 0 or (shape[d - 1] != 1 and strides[d - 1] != t_numel * base):
            while vd >= 0 and (v_numel < t_numel or new[vd] == 1):
                out[vd] = v_numel * base
                v_numel *= new[vd]
                vd -= 1
            if v_numel != t_numel:
                return None
            if d > 0:
                base, t_numel, v_numel = strides[d - 1], 1, 1
    return tuple(out) if vd == -1 else None

def expand_strides(shape, strides, new):
    lead = len(new) - len(shape)
    out = [0] * lead
    for size, stride, target in zip(shape, strides, new[lead:]):
        out.append(stride if size == target else 0)
    return tuple(out)`;

export const lesson: LessonContent = {
  id: "e6.1.2",
  minutes: 45,
  links: {
    requires: ["e6.1.1", "e1.5.6"],
    revisits: ["e5.5.1", "e3.3.1"],
    foreshadows: ["e6.1.3"],
  },

  puzzle: (
    <>
      <p>
        <C>x.transpose(1, 2).view(2, 12)</C> raises an error, while <C>x.transpose(1, 2).reshape(2, 12)</C> works. Converting a
        batch of images to channels-last makes a ResNet train up to 30% faster on recent GPUs, yet the tensor&apos;s shape is
        unchanged and <C>is_contiguous()</C> starts returning False. Both behaviours are decided by four integers per tensor
        that most users never print. Which ones, and how does PyTorch decide when a reshape is free?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A PyTorch tensor, like a NumPy array, is a pointer into a flat block of memory plus a shape and a stride for every
        dimension: the number of elements to skip to move one step along it. Transposing swaps strides, slicing changes the
        offset and strides, and expanding sets a stride to zero, all without touching the data. A view to a new shape is
        possible only when the new shape can be described by strides over the same memory; otherwise a copy is needed.
        Memory formats such as channels-last choose a different stride order for the same logical shape, to suit the kernels
        that will read it.
      </p>
      <MemoryFormatViz />
    </>
  ),

  theory: (
    <>
      <Definition title="contiguity">
        <p>
          A tensor of shape <M>{"(s_0, \\dots, s_{n-1})"}</M> is contiguous if its strides equal the row-major strides{" "}
          <M>{"t_i = \\prod_{j > i} s_j"}</M>, ignoring dimensions of size 1, whose stride is never used. The channels-last
          format for an NCHW tensor uses strides <M>{"(CHW, 1, WC, C)"}</M>: the logical shape is unchanged, but the channels of
          one pixel are adjacent in memory.
        </p>
        <Code>{TORCH}</Code>
        <Code>{LAYOUT}</Code>
      </Definition>

      <Theorem title="when a view exists">
        <p>
          Split the dimensions of size greater than 1 into maximal chunks of consecutive dimensions with{" "}
          <M>{"\\text{stride}_k = \\text{stride}_{k+1}\\, s_{k+1}"}</M> inside each chunk. A reshape to a new shape is expressible as
          a view if and only if the new dimensions can be grouped, in order, into consecutive groups whose sizes multiply to the
          chunk sizes. Each group then gets row-major strides scaled by the stride of its chunk&apos;s last dimension.
        </p>
      </Theorem>
      <Proof>
        <p>
          Within a chunk, the dimensions address memory exactly like one flattened dimension of size equal to the product,
          with the stride of the last dimension, so any factorisation of that flat dimension is a view with row-major strides
          over it. Conversely, a new dimension that straddles a chunk boundary would have to step uniformly through elements
          that are not uniformly spaced: at the boundary the gap differs, so no single stride can describe it, and no view
          exists. Size-1 dimensions can be placed anywhere, since their stride is never used. PyTorch&apos;s{" "}
          <C>computeStride</C> walks the dimensions from the last, closing a chunk whenever the stride relation breaks, which is
          exactly the algorithm in the code.
        </p>
        <Code>{VIEW}</Code>
      </Proof>

      <Example title="views that do and do not exist">
        <p>
          A contiguous (2, 3, 4) tensor is one chunk of 24, so (6, 4) with strides (4, 1) and (2, 12) with strides (12, 1) are
          both views. Its transpose, shape (2, 4, 3) with strides (12, 1, 4), has three chunks of sizes 2, 4 and 3, so (2, 12)
          would merge the last two and is impossible; <C>reshape</C> copies, <C>view</C> refuses. A transposed (4, 3) matrix with
          strides (1, 4) can still be split into (2, 2, 3) with strides (2, 1, 4), because splitting stays inside a chunk.
        </p>
      </Example>

      <Remark title="layout and speed">
        <p>
          Elementwise kernels are fastest when consecutive threads read consecutive addresses, which for a non-contiguous
          tensor may fail, so many operations call <C>.contiguous()</C> internally and pay for a copy. Convolutions on tensor
          cores read all channels of a pixel together and prefer channels-last; converting the model and the inputs once
          avoids hidden transposes in every layer. A stride of 0 from <C>expand</C> saves memory, but writing into such a
          tensor in place is an error, since many logical elements share one address.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "s",
      rung: "check",
      prompt: <p>What is the stride of dimension 1 of a contiguous tensor of shape (2, 3, 4, 5)?</p>,
      answer: { kind: "numeric", value: 20, tolerance: 0.001 },
    },
    {
      key: "cl",
      rung: "check",
      prompt: <p>In channels-last format, what is the stride of the height dimension of a (16, 64, 56, 56) tensor?</p>,
      answer: { kind: "numeric", value: 3584, tolerance: 0.5 },
    },
    {
      key: "view",
      rung: "apply",
      prompt: <p><C>x.t().view(-1)</C> fails for a 2-D contiguous x with both sizes above 1. What is the right reading?</p>,
      answer: {
        kind: "choice",
        options: [
          "view only works on 1-D tensors",
          "The transpose has strides (1, n), which do not form one chunk, so flattening needs a copy; use reshape or contiguous first",
          "Transposes are lazily evaluated and must be materialised with .item()",
          "view(-1) is not valid syntax in PyTorch",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def contiguous_strides(shape):
    strides, step = [], 1
    for size in reversed(shape):
        strides.append(step)
        step *= size
    return tuple(reversed(strides))

def is_contiguous(shape, strides):
    expected = 1
    for size, stride in zip(reversed(shape), reversed(strides)):
        if size != 1:
            if stride != expected:
                return False
            expected *= size
    return True

def channels_last_strides(n, c, h, w):
    return (h * w * c, 1, w * c, c)

print(contiguous_strides((2, 3, 4)), is_contiguous((2, 3, 4), (12, 4, 1)), is_contiguous((3, 2), (1, 3)))
print(channels_last_strides(8, 3, 32, 32), is_contiguous((8, 3, 32, 32), channels_last_strides(8, 3, 32, 32)), is_contiguous((1, 5), (99, 1)), is_contiguous((4, 1), (1, 7)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(12, 4, 1) True False\n(3072, 1, 96, 3) False True True",
          "(1, 2, 6) True False\n(3072, 1, 96, 3) False True True",
          "(12, 4, 1) True True\n(3072, 1, 96, 3) True True True",
          "(12, 4, 1) True False\n(3072, 1, 96, 3) False False False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def view_strides(shape, strides, new):
    out, vd = [0] * len(new), len(new) - 1
    base, t_numel, v_numel = strides[-1], 1, 1
    for d in range(len(shape) - 1, -1, -1):
        t_numel *= shape[d]
        if d == 0 or (shape[d - 1] != 1 and strides[d - 1] != t_numel * base):
            while vd >= 0 and (v_numel < t_numel or new[vd] == 1):
                out[vd] = v_numel * base
                v_numel *= new[vd]
                vd -= 1
            if v_numel != t_numel:
                return None
            if d > 0:
                base, t_numel, v_numel = strides[d - 1], 1, 1
    return tuple(out) if vd == -1 else None

def expand_strides(shape, strides, new):
    lead = len(new) - len(shape)
    out = [0] * lead
    for size, stride, target in zip(shape, strides, new[lead:]):
        out.append(stride if size == target else 0)
    return tuple(out)

print(view_strides((2, 3, 4), (12, 4, 1), (6, 4)), view_strides((2, 3, 4), (12, 4, 1), (2, 12)), view_strides((3, 2), (1, 3), (6,)))
print(view_strides((4, 3), (1, 4), (2, 2, 3)), view_strides((4, 3), (1, 4), (12,)), expand_strides((3, 1), (1, 1), (2, 3, 5)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 1) (12, 1) None\n(2, 1, 4) None (0, 1, 0)",
          "(4, 1) (12, 1) (1, 3)\n(2, 1, 4) None (0, 1, 0)",
          "(4, 1) None None\n(2, 1, 4) (1,) (0, 1, 0)",
          "(4, 1) (12, 1) None\n(6, 3, 1) None (1, 1, 1)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>contiguous_strides(shape)</C>, <C>is_contiguous(shape, strides)</C> ignoring dimensions of size 1, and{" "}
          <C>channels_last_strides(n, c, h, w)</C>, all returning element strides as tuples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def contiguous_strides(shape):
    return tuple(1 for _ in shape)

def is_contiguous(shape, strides):
    return True

def channels_last_strides(n, c, h, w):
    return (c * h * w, h * w, w, 1)
`,
        solution: LAYOUT,
        tests: [
          { name: "strides", code: `assert contiguous_strides((5,)) == (1,) and contiguous_strides((2, 1, 3, 4)) == (12, 12, 4, 1) and channels_last_strides(2, 4, 5, 6) == (120, 1, 24, 4)` },
          { name: "contiguity", code: `assert is_contiguous((2, 1, 3), (3, 77, 1)) and not is_contiguous((2, 3), (1, 2)) and not is_contiguous((4, 2, 2), channels_last_strides(1, 4, 2, 2)[1:]) and is_contiguous((1, 1), (5, 9)) and not is_contiguous((3, 2), (4, 1))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>view_strides(shape, strides, new)</C>, returning the strides of a view with shape new or None when a copy is
          needed, following the chunk rule, and <C>expand_strides(shape, strides, new)</C> for broadcasting to new (size-1 or
          missing leading dimensions get stride 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def view_strides(shape, strides, new):
    return None

def expand_strides(shape, strides, new):
    return tuple(strides)
`,
        solution: VIEW,
        tests: [
          { name: "views", code: `assert view_strides((2, 3, 4), (12, 4, 1), (24,)) == (1,) and view_strides((2, 3, 4), (12, 4, 1), (4, 3, 2)) == (6, 2, 1) and view_strides((2, 4, 3), (12, 1, 4), (2, 2, 2, 3)) == (12, 2, 1, 4) and view_strides((2, 4, 3), (12, 1, 4), (8, 3)) is None
assert view_strides((2, 4, 3), (12, 1, 4), (2, 12)) is None and view_strides((6, 4), (1, 6), (3, 2, 4)) == (2, 1, 6) and view_strides((3, 4), (4, 1), (1, 12, 1))[1] == 1` },
          { name: "expand", code: `assert expand_strides((4,), (1,), (3, 4)) == (0, 1) and expand_strides((1, 4), (4, 1), (5, 4)) == (0, 1) and expand_strides((2, 1), (7, 7), (6, 2, 3)) == (0, 7, 0)` },
        ],
      },
    },
    {
      key: "split",
      rung: "stretch",
      prompt: (
        <p>
          A tensor of shape (6, 4) has strides (1, 6), the transpose of a contiguous (4, 6) tensor. It is viewed as (3, 2, 4).
          What is the stride of the first dimension of the view?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Views share memory with the tensor they come from, so writing through one changes the other. The next lesson tracks
        which operations return views and which return copies, and what that means for in-place updates and autograd.
      </p>
    </>
  ),
};
