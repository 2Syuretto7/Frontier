import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MemoryArenaViz } from "@/components/viz/MemoryArenaViz";
import type { LessonContent } from "@/lib/types";

const LIVENESS = `def live_intervals(order, ins, outputs):
    pos = {n: i for i, n in enumerate(order)}
    iv = {n: [pos[n], pos[n]] for n in order}
    for n in order:
        for i in ins.get(n, []):
            if i in iv:
                iv[i][1] = max(iv[i][1], pos[n])           # alive until its last reader runs
    for o in outputs:
        iv[o][1] = len(order) - 1
    return {n: tuple(v) for n, v in iv.items()}

def peak_memory(iv, size):
    end = max((e for _, e in iv.values()), default=-1)
    return max((sum(size[n] for n, (s, e) in iv.items() if s <= t <= e) for t in range(end + 1)), default=0)

def best_order(orders, ins, size, outputs):
    return min(orders, key=lambda o: peak_memory(live_intervals(o, ins, outputs), size))`;

const PACKING = `def overlaps(a, b):
    return a[0] <= b[1] and b[0] <= a[1]

def assign_offsets(iv, size):
    placed = {}
    for n in sorted(iv, key=lambda n: (-size[n], n)):      # largest buffers first
        busy = sorted((placed[m], placed[m] + size[m]) for m in placed if overlaps(iv[n], iv[m]))
        off = 0
        for lo, hi in busy:
            if off + size[n] <= lo:
                break                                      # fits in the gap below this block
            off = max(off, hi)
        placed[n] = off
    return placed

def arena_size(offs, size):
    return max((offs[n] + size[n] for n in offs), default=0)`;

export const lesson: LessonContent = {
  id: "e14.2.3",
  minutes: 45,
  links: {
    requires: ["e14.2.2"],
    revisits: ["e6.4.3", "e7.6.2"],
    foreshadows: ["e14.4.1"],
  },

  puzzle: (
    <>
      <p>
        A compiled training step allocates hundreds of intermediate tensors. Giving each its own memory would need
        several times what the GPU has, yet most of them are dead a few operations after they are created. Before the
        step runs, the compiler knows every tensor&apos;s size and every operation&apos;s order. How should it lay out
        one block of memory so that everything fits, and how close to the theoretical minimum can it get?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each tensor is live from the operation that produces it to the last operation that reads it. Two tensors whose
        lifetimes do not overlap can share the same addresses. Drawn with time across and memory up, each tensor is a
        box that cannot overlap any other box, and planning memory means packing the boxes as low as possible. The order
        of operations changes the lifetimes, and so the packing, which is why the schedule and the memory plan are
        decided together.
      </p>
      <MemoryArenaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="liveness and peak memory">
        <p>
          For a schedule, a list of operations in execution order, the live interval of a value runs from the step that
          produces it to the last step that reads it, or to the end for outputs (<C>live_intervals</C>). The peak of a
          schedule is the largest total size of values live at one step (<C>peak_memory</C>). Among several valid
          schedules, the one with the smallest peak can be chosen directly (<C>best_order</C>), though the number of
          schedules grows too fast to enumerate them all.
        </p>
        <Code>{LIVENESS}</Code>
      </Definition>

      <Theorem title="the peak bounds every plan">
        <p>
          Any assignment of non-overlapping addresses to values with overlapping lifetimes needs at least the peak. If
          all values have the same size, an assignment achieving the peak exists.
        </p>
      </Theorem>
      <Proof>
        <p>
          At the step where the peak occurs, all values live then must occupy disjoint addresses at once, so the arena is
          at least their total size. For equal sizes, take slots of that size and process values in order of start step,
          giving each the lowest slot free at its start. When a value starts, the values occupying slots are exactly
          those live at that step, so the number of slots ever in use is the largest number live at once, which is the
          peak divided by the size. With unequal sizes the problem is NP-hard, and a free gap may be too small even when
          enough total space is free, so compilers use heuristics such as placing the largest values first at the lowest
          offset that does not conflict (<C>overlaps</C>, <C>assign_offsets</C>, <C>arena_size</C>).
        </p>
        <Code>{PACKING}</Code>
      </Proof>

      <Example title="memory planners in use">
        <p>
          XLA&apos;s buffer assignment simulates the heap over a chosen order of instructions and assigns offsets within
          a few large allocations, letting an output share its input&apos;s buffer when the input dies at that
          operation. JAX exposes the same idea to users as buffer donation, which lets a step write its updated
          parameters over the old ones. TorchInductor reuses buffers between kernels in the code it generates, while
          eager PyTorch relies on a caching allocator that reuses freed blocks at run time without seeing the future.
        </p>
      </Example>

      <Remark title="trading compute for memory">
        <p>
          When even the best plan does not fit, the compiler can recompute values instead of keeping them, the
          activation checkpointing of e6.4.3 applied automatically. In a chain of n layers whose activations are needed
          in the backward pass, keeping every k-th activation and recomputing the others one segment at a time keeps
          about n/k + k activations at once, at the cost of roughly one extra forward pass. Training memory is dominated
          by such activations and by optimiser state (e7.6.2), so these choices decide the largest model and batch that
          fit.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "peak",
      rung: "check",
      prompt: (
        <p>
          A schedule computes x (2 GB), then y = f(x) (8 GB), then z = g(y) (2 GB), then the output o = h(z, x) (1 GB).
          A value is live from its step through the last step that reads it, and o is live at the end. What is the
          peak, in GB?
        </p>
      ),
      answer: { kind: "numeric", value: 12, tolerance: 0 },
    },
    {
      key: "order",
      rung: "check",
      prompt: (
        <p>
          A graph has a (2 GB) feeding b (7 GB) and c (7 GB); d (1 GB) reads b; e (1 GB) reads c; and the output f (1 GB)
          reads d and e. a runs first and f last. Over all valid orders of b, c, d and e, what is the smallest peak, in
          GB?
        </p>
      ),
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: (
        <p>
          A plan has 6 GB free in total at some step, yet a new 4 GB tensor that is live then cannot be placed. How
          can that be?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The free space is split into gaps between longer-lived buffers, and no single gap is 4 GB",
          "Free memory is always contiguous",
          "Tensors must be placed at offset zero",
          "The peak bound forbids it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def live_intervals(order, ins, outputs):
    pos = {n: i for i, n in enumerate(order)}
    iv = {n: [pos[n], pos[n]] for n in order}
    for n in order:
        for i in ins.get(n, []):
            if i in iv:
                iv[i][1] = max(iv[i][1], pos[n])           # alive until its last reader runs
    for o in outputs:
        iv[o][1] = len(order) - 1
    return {n: tuple(v) for n, v in iv.items()}

def peak_memory(iv, size):
    end = max((e for _, e in iv.values()), default=-1)
    return max((sum(size[n] for n, (s, e) in iv.items() if s <= t <= e) for t in range(end + 1)), default=0)

def best_order(orders, ins, size, outputs):
    return min(orders, key=lambda o: peak_memory(live_intervals(o, ins, outputs), size))

ins = {"b": ["a"], "c": ["a"], "d": ["b"], "e": ["c", "d"]}; iv = live_intervals(["a", "b", "c", "d", "e"], ins, ["e"]); print(iv["a"], iv["b"], peak_memory(iv, dict.fromkeys("abcde", 1)))
print(best_order([["a", "b", "c", "d", "e"], ["a", "b", "d", "c", "e"]], ins, {"a": 1, "b": 4, "c": 4, "d": 1, "e": 1}, ["e"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0, 2) (1, 3) 3\n['a', 'b', 'd', 'c', 'e']",
          "(0, 1) (1, 3) 3\n['a', 'b', 'd', 'c', 'e']",
          "(0, 2) (1, 3) 4\n['a', 'b', 'd', 'c', 'e']",
          "(0, 2) (1, 3) 3\n['a', 'b', 'c', 'd', 'e']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def overlaps(a, b):
    return a[0] <= b[1] and b[0] <= a[1]

def assign_offsets(iv, size):
    placed = {}
    for n in sorted(iv, key=lambda n: (-size[n], n)):      # largest buffers first
        busy = sorted((placed[m], placed[m] + size[m]) for m in placed if overlaps(iv[n], iv[m]))
        off = 0
        for lo, hi in busy:
            if off + size[n] <= lo:
                break                                      # fits in the gap below this block
            off = max(off, hi)
        placed[n] = off
    return placed

def arena_size(offs, size):
    return max((offs[n] + size[n] for n in offs), default=0)

offs = assign_offsets({"x": (0, 1), "y": (1, 2), "z": (2, 3)}, {"x": 4, "y": 2, "z": 4}); print(offs, arena_size(offs, {"x": 4, "y": 2, "z": 4}))
print(overlaps((0, 2), (3, 4)), overlaps((0, 2), (2, 4)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'x': 0, 'z': 0, 'y': 4} 6\nFalse True",
          "{'x': 0, 'z': 4, 'y': 8} 10\nFalse True",
          "{'x': 0, 'z': 0, 'y': 4} 6\nFalse False",
          "{'x': 0, 'z': 6, 'y': 4} 10\nFalse True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>live_intervals(order, ins, outputs)</C>, mapping each scheduled value to (start, end) steps;{" "}
          <C>peak_memory(iv, size)</C>, 0 for no values; and <C>best_order(orders, ins, size, outputs)</C>, the first
          order with the smallest peak.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def live_intervals(order, ins, outputs):
    return {n: (i, i) for i, n in enumerate(order)}

def peak_memory(iv, size):
    return sum(size.values())

def best_order(orders, ins, size, outputs):
    return orders[-1]
`,
        solution: LIVENESS,
        tests: [
          { name: "live", code: `iv = live_intervals(["a", "b", "c", "d"], {"b": ["a"], "c": ["b"], "d": ["a", "c"]}, ["d"]); assert iv == {"a": (0, 3), "b": (1, 2), "c": (2, 3), "d": (3, 3)} and live_intervals(["p"], {}, []) == {"p": (0, 0)}` },
          { name: "peak", code: `assert peak_memory({"a": (0, 3), "b": (1, 2), "c": (2, 3), "d": (3, 3)}, {"a": 3, "b": 2, "c": 6, "d": 1}) == 11 and peak_memory({}, {}) == 0 and best_order([["a", "b"], ["b", "a"]], {}, {"a": 1, "b": 1}, []) == ["a", "b"]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>overlaps(a, b)</C> for inclusive intervals; <C>assign_offsets(iv, size)</C>, placing values largest
          first, ties by name, each at the lowest offset clear of every placed value it overlaps in time; and{" "}
          <C>arena_size(offs, size)</C>, 0 for no values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def overlaps(a, b):
    return False

def assign_offsets(iv, size):
    offs, total = {}, 0
    for n in sorted(iv):
        offs[n] = total
        total += size[n]
    return offs

def arena_size(offs, size):
    return 0
`,
        solution: PACKING,
        tests: [
          { name: "offsets", code: `sz = {"p": 2, "q": 3, "r": 3, "s": 1}; o = assign_offsets({"p": (0, 3), "q": (0, 1), "r": (2, 3), "s": (1, 2)}, sz); assert o == {"q": 0, "r": 0, "p": 3, "s": 5} and arena_size(o, sz) == 6` },
          { name: "edges", code: `assert overlaps((0, 2), (2, 4)) and not overlaps((0, 1), (2, 3)) and arena_size({}, {}) == 0` },
        ],
      },
    },
    {
      key: "remat",
      rung: "stretch",
      prompt: (
        <p>
          A chain of 72 layers each keeps a 1 GB activation for the backward pass. Checkpointing every k-th activation,
          with k a divisor of 72, keeps 72/k + k GB of activations at once. What is the smallest achievable, in GB?
        </p>
      ),
      answer: { kind: "numeric", value: 17, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The graph is now fused, laid out and planned. The next chapter turns each fused group into fast code, starting
        with how loops are tiled and ordered for the memory hierarchy.
      </p>
    </>
  ),
};
