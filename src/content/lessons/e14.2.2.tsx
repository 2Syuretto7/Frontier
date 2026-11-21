import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LayoutStridesViz } from "@/components/viz/LayoutStridesViz";
import type { LessonContent } from "@/lib/types";

const STRIDES = `def strides(shape):
    out, s = [], 1
    for d in reversed(shape):
        out.append(s)
        s *= d                                             # the last dimension varies fastest
    return tuple(reversed(out))

def offset(idx, st):
    return sum(i * s for i, s in zip(idx, st))

def permute_view(shape, st, perm):
    return tuple(shape[p] for p in perm), tuple(st[p] for p in perm)   # no data moves`;

const PERMS = `def compose(p, q):
    return tuple(p[i] for i in q)                          # permute by p, then by q

def simplify(chain):
    r = tuple(range(len(chain[0])))
    for p in chain:
        r = compose(r, p)
    return None if r == tuple(range(len(r))) else r        # an identity permutation disappears

def transposes_needed(prefs, start):
    count, cur = 0, start
    for p in prefs:
        if p != cur:
            count += 1                                     # convert before this operation
            cur = p
    return count`;

export const lesson: LessonContent = {
  id: "e14.2.2",
  minutes: 40,
  links: {
    requires: ["e14.2.1"],
    revisits: ["e5.5.1", "e9.1.2", "e7.5.1"],
    foreshadows: ["e14.3.1"],
  },

  puzzle: (
    <>
      <p>
        A convolutional network written with PyTorch&apos;s default NCHW tensors runs noticeably faster on a modern GPU
        after one line converts the model and inputs to channels-last memory format. Nothing about the mathematics
        changed; the same numbers sit in memory in a different order. Why does the order matter so much, and how can a
        compiler choose it without the user&apos;s help?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A tensor&apos;s layout maps each index to a position in memory. Hardware reads memory in contiguous chunks, so
        a kernel is fast when its innermost loop walks along the dimension that is contiguous, and tensor cores further
        want the reduction dimension packed tightly. Different operations prefer different layouts. A layout pass assigns
        one to every tensor and inserts transposes, real copies, where neighbours disagree, trying to keep those copies
        few.
      </p>
      <LayoutStridesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="strides and views">
        <p>
          A strided layout stores the element at index <M>{"(i_0, \\dots, i_{d-1})"}</M> at offset{" "}
          <M>{"\\sum_k i_k s_k"}</M>, for strides <M>{"s_k"}</M> (<C>offset</C>). The row-major layout, the default
          almost everywhere, makes the last dimension contiguous, with each stride the product of the sizes after it{" "}
          (<C>strides</C>). Permuting dimensions only reorders shape and strides together, a view that moves no data{" "}
          (<C>permute_view</C>); but the result is no longer row-major, and a kernel that needs a contiguous inner
          dimension must first copy it.
        </p>
        <Code>{STRIDES}</Code>
      </Definition>

      <Theorem title="transposes compose">
        <p>
          If y is x with dimensions permuted by p, so that dimension i of y is dimension <M>{"p_i"}</M> of x, and z is y
          permuted by q, then z is x permuted by r with <M>{"r_i = p_{q_i}"}</M>. A chain of transposes is therefore one
          transpose, and none at all when the composed permutation is the identity.
        </p>
      </Theorem>
      <Proof>
        <p>
          Dimension i of z is dimension <M>{"q_i"}</M> of y, which is dimension <M>{"p_{q_i}"}</M> of x, so z&apos;s
          shape, strides and elements are those of x permuted by r (<C>compose</C>). By induction, a chain of any length
          composes to a single permutation, and a pass can replace the chain by one transpose or remove it{" "}
          (<C>simplify</C>). Because each physical transpose reads and writes the whole tensor, removing them is a
          memory-traffic saving of the same kind as fusion.
        </p>
        <Code>{PERMS}</Code>
      </Proof>

      <Example title="layouts that matter">
        <p>
          Convolutions on tensor cores prefer NHWC, with channels contiguous, because the reduction runs over channels;
          normalisations over channels also favour it, while some older kernels assumed NCHW. Attention implementations
          differ in whether heads come before or after the sequence dimension, (B, S, H, D) or (B, H, S, D). TPUs go
          further, with tiled layouts that store the two minor dimensions in fixed tiles of 8 by 128 elements for 32-bit
          types, so a dimension that is not a multiple of the tile is padded, which is why shapes like 130 waste memory
          and time there (e7.5.1).
        </p>
      </Example>

      <Remark title="layout assignment">
        <p>
          A layout pass records each operation&apos;s preferred layouts, propagates them along the graph so that runs of
          operations agree, and inserts a transpose wherever two neighbours disagree; along a chain the count of
          conversions is the number of preference changes (<C>transposes_needed</C>). It then moves transposes through
          pointwise operations, which work in any layout, until they meet and cancel. Layout and fusion interact: a
          transpose fused into a neighbouring kernel becomes a change of indexing rather than a copy.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "offset",
      rung: "check",
      prompt: (
        <p>
          An activation of logical shape (N, C, H, W) = (8, 64, 56, 56) is stored channels-last, as a row-major array of
          shape (N, H, W, C). At what offset, in elements, is the element with n = 2, c = 10, h = 5, w = 7?
        </p>
      ),
      answer: { kind: "numeric", value: 419786, tolerance: 0 },
    },
    {
      key: "copy",
      rung: "check",
      prompt: (
        <p>
          Converting a (64, 256, 56, 56) BF16 activation between NCHW and NHWC reads it once and writes it once. At 3.35
          TB/s, how many microseconds does the copy take, to two decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 61.35, tolerance: 0.002 },
    },
    {
      key: "view",
      rung: "apply",
      prompt: (
        <p>
          <C>x.transpose(0, 1)</C> in PyTorch returns immediately whatever the tensor&apos;s size, but a following
          matrix multiplication may then run slower than on <C>x.transpose(0, 1).contiguous()</C>. Why?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The transpose only swaps strides, so the data is unmoved and the multiplication must read it with a large stride or copy it first",
          "The transpose copies the data twice",
          "Transposed tensors use a lower precision",
          "contiguous() changes the values",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def strides(shape):
    out, s = [], 1
    for d in reversed(shape):
        out.append(s)
        s *= d                                             # the last dimension varies fastest
    return tuple(reversed(out))

def offset(idx, st):
    return sum(i * s for i, s in zip(idx, st))

def permute_view(shape, st, perm):
    return tuple(shape[p] for p in perm), tuple(st[p] for p in perm)   # no data moves

st = strides((2, 3, 4))
print(st, offset((1, 2, 3), st), permute_view((2, 3, 4), st, (2, 0, 1)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(12, 4, 1) 23 ((4, 2, 3), (1, 12, 4))",
          "(1, 2, 6) 23 ((4, 2, 3), (1, 12, 4))",
          "(12, 4, 1) 23 ((3, 4, 2), (4, 1, 12))",
          "(12, 4, 1) 6 ((4, 2, 3), (1, 12, 4))",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def compose(p, q):
    return tuple(p[i] for i in q)                          # permute by p, then by q

def simplify(chain):
    r = tuple(range(len(chain[0])))
    for p in chain:
        r = compose(r, p)
    return None if r == tuple(range(len(r))) else r        # an identity permutation disappears

def transposes_needed(prefs, start):
    count, cur = 0, start
    for p in prefs:
        if p != cur:
            count += 1                                     # convert before this operation
            cur = p
    return count

print(compose((1, 0, 2), (0, 2, 1)), simplify([(1, 0), (1, 0)]), simplify([(0, 2, 3, 1), (0, 3, 1, 2), (1, 0, 2, 3)]))
print(transposes_needed(["NHWC", "NHWC", "NCHW", "NHWC"], "NCHW"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1, 2, 0) None (1, 0, 2, 3)\n3",
          "(2, 0, 1) None (1, 0, 2, 3)\n3",
          "(1, 2, 0) (0, 1) (1, 0, 2, 3)\n3",
          "(1, 2, 0) None (1, 0, 2, 3)\n2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>strides(shape)</C> for the row-major layout, <C>offset(idx, st)</C>, and{" "}
          <C>permute_view(shape, st, perm)</C>, returning the permuted shape and strides.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def strides(shape):
    return tuple(1 for _ in shape)

def offset(idx, st):
    return sum(idx)

def permute_view(shape, st, perm):
    return shape, st
`,
        solution: STRIDES,
        tests: [
          { name: "strides", code: `assert strides((5,)) == (1,) and strides((2, 1, 3)) == (3, 3, 1) and strides(()) == () and offset((0, 1, 2), strides((3, 4, 5))) == 7` },
          { name: "view", code: `assert permute_view((3, 4), (4, 1), (1, 0)) == ((4, 3), (1, 4))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>compose(p, q)</C>, the single permutation equal to permuting by p and then by q;{" "}
          <C>simplify(chain)</C>, the composition of a non-empty chain, or None if it is the identity; and{" "}
          <C>transposes_needed(prefs, start)</C>, the conversions needed along a chain of operations with preferred
          layouts, starting in layout start.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def compose(p, q):
    return p

def simplify(chain):
    return chain[-1]

def transposes_needed(prefs, start):
    return len(prefs)
`,
        solution: PERMS,
        tests: [
          { name: "compose", code: `assert compose((2, 0, 1), (2, 0, 1)) == (1, 2, 0) and simplify([(2, 0, 1)] * 3) is None and simplify([(1, 2, 0), (1, 0, 2)]) == (2, 1, 0)` },
          { name: "count", code: `assert transposes_needed([], "a") == 0 and transposes_needed(["a", "b", "b", "a"], "a") == 2` },
        ],
      },
    },
    {
      key: "tiles",
      rung: "stretch",
      prompt: (
        <p>
          A 32-bit array of shape (300, 130) is stored in tiles of 8 rows by 128 columns, each dimension padded up to a
          whole number of tiles. What fraction of the allocated memory is padding, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4989, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every tensor in the graph now has a layout and a size. The next lesson decides where in memory each one lives,
        and when its space can be reused.
      </p>
    </>
  ),
};
