import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StructLayoutViz } from "@/components/viz/StructLayoutViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.2.2",
  minutes: 60,
  links: {
    requires: ["e3.2.1"],
    revisits: ["e0.3.3", "e0.6.3", "e2.2.1", "e1.5.6"],
    foreshadows: ["e3.3.2", "e3.3.3", "e4.5.2"],
  },

  puzzle: (
    <>
      <p>
        In Python, <C>b = a</C> for a list makes no copy, and changing b changes a. A C struct of a char, a double and a char
        takes 24 bytes, not 10. A Python list of a million small integers uses about 36 MB, and a NumPy array of the same
        values 8 MB. And the most common crash message in C, &ldquo;segmentation fault&rdquo;, means a program used an address
        it had no right to. All four come from the same picture: memory as one long row of numbered bytes. What does that
        picture look like for a running program?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every byte has an address, a number. A <strong>pointer</strong> is a variable holding an address, so it says where
        something is rather than what it is. Arrays are runs of equal-sized elements, and <C>p + 1</C> means the next element,
        not the next byte. Structs place fields one after another, but each field must start at an address that is a
        multiple of its own alignment, because the hardware reads aligned values fastest (or only). So the order of fields
        decides how much padding is wasted. Rearrange the fields below.
      </p>
      <StructLayoutViz />
    </>
  ),

  theory: (
    <>
      <Definition title="pointers">
        <Code>{`int x = 42;
int *p = &x;        /* p holds the address of x */
*p = 7;             /* writes through p: x is now 7 */
int a[4] = {1, 2, 3, 4};
int *q = a;         /* an array name decays to its first element's address */
q[2] == *(q + 2);   /* true: indexing is pointer arithmetic */`}</Code>
        <p>
          <C>&amp;x</C> takes an address and <C>*p</C> follows one. For a pointer to type T, <C>p + k</C> is the address{" "}
          <C>k × sizeof(T)</C> bytes further on, and the difference of two pointers into one array counts elements. A{" "}
          <C>NULL</C> pointer points nowhere; following it, or any address the program has not been given, faults.
        </p>
      </Definition>

      <Definition title="the address space">
        <p>
          A running program sees one range of addresses holding: its machine code; global variables; the{" "}
          <strong>heap</strong>, from which <C>malloc(n)</C> hands out blocks that live until <C>free</C>; and the{" "}
          <strong>stack</strong>, where each function call gets a frame for its local variables and return address, popped
          when it returns. A local variable&rsquo;s address is therefore valid only until its function returns: returning a
          pointer to it leaves a <em>dangling pointer</em> to memory the next call will reuse.
        </p>
      </Definition>

      <Theorem title="struct layout">
        <p>
          Placing each field at the next multiple of its alignment, and rounding the total up to a multiple of the largest
          alignment, gives a layout in which every field of every element of an array of the struct is aligned. If every
          field&rsquo;s size is a multiple of its alignment (as for all C scalar types), ordering fields by decreasing
          alignment leaves no padding between fields.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let A be the largest alignment and S the padded size, a multiple of A. Element j of an array starts at jS, a multiple
          of A and hence of every field&rsquo;s alignment a (alignments are powers of two, so a divides A); a field at offset o
          with a | o is then at jS + o, also a multiple of a. For the second claim, with fields in decreasing alignment, every
          field so far has a size that is a multiple of its alignment, which is a multiple of the current field&rsquo;s
          alignment; so the running offset is already a multiple of the current alignment and no padding is inserted.
        </p>
      </Proof>

      <Example title="the heap">
        <p>
          An allocator keeps a list of free blocks. <C>malloc</C> finds one big enough (first fit, best fit or size classes),
          splits it, and returns its address; <C>free</C> returns the block and merges it with free neighbours. Forgetting{" "}
          <C>free</C> leaks memory; freeing twice or using a block after freeing corrupts the allocator&rsquo;s lists. Even
          without bugs, memory can <strong>fragment</strong>: plenty free in total but no single block large enough. GPU
          frameworks fight the same problem: PyTorch&rsquo;s caching allocator keeps freed blocks to reuse and reports
          &ldquo;reserved but unallocated&rdquo; memory when fragmentation strikes.
        </p>
      </Example>

      <Remark title="Python's memory model">
        <p>
          Every Python value is a heap-allocated C struct holding a reference count, a pointer to its type, and its data; a
          small int takes 28 bytes. A variable is a pointer to such an object, so <C>b = a</C> copies a pointer, and a list is
          an array of pointers to objects scattered across the heap. <C>id(x)</C> in CPython is the object&rsquo;s address.
          When the count of references to an object drops to zero it is freed at once, with a separate collector for cycles.
          A NumPy array instead holds one contiguous block of raw 8-byte values, which is why it is compact, fast to scan, and
          can be handed to C or the GPU without conversion.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "arith",
      rung: "check",
      prompt: <p>p is a <C>double *</C> holding the address 1000. What address does <C>p + 3</C> hold?</p>,
      answer: { kind: "numeric", value: 1024 },
    },
    {
      key: "dangling",
      rung: "apply",
      prompt: <p>A C function returns the address of one of its local variables. What is wrong?</p>,
      answer: {
        kind: "choice",
        options: ["The variable lived in the function's stack frame, which is reused after it returns", "Local variables have no address", "The pointer is automatically freed twice", "Nothing: the variable moves to the heap"],
        correct: [0],
      },
    },
    {
      key: "pylist",
      rung: "apply",
      prompt: <p>On a 64-bit machine, a Python list stores an 8-byte pointer per element, and each distinct int object takes 28 bytes. About how many bytes per element does a list of a million distinct large ints use, ignoring the list&rsquo;s spare capacity?</p>,
      answer: { kind: "numeric", value: 36 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`#include <stdio.h>

int main(void) {
    int a[5] = {10, 20, 30, 40, 50};
    int *p = a + 1;
    int *q = &a[4];
    *p += 5;
    p[2] = *q - *a;
    printf("%d %d %d %ld\\n", a[1], a[3], *(p + 1), (long)(q - p));
    return 0;
}`}</Code>
          <p>Pointer arithmetic. What does this C program print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["25 40 30 3", "25 40 30 12", "20 40 30 3", "25 45 30 3"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`#include <stdio.h>
#include <stddef.h>

struct A { char c; int i; char d; };
struct B { int i; char c; char d; };
struct C { char c; double x; };

int main(void) {
    printf("%zu %zu %zu %zu\\n", sizeof(struct A), sizeof(struct B),
           sizeof(struct C), offsetof(struct C, x));
    return 0;
}`}</Code>
          <p>Struct sizes on 64-bit Linux. What does this C program print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["12 8 16 8", "6 6 9 1", "12 8 16 4", "12 12 16 8"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Fields are <C>(name, size, align)</C> triples. Write <C>layout(fields)</C>, returning{" "}
            <C>(offsets, size, align)</C> by C&rsquo;s rules: each field at the next multiple of its alignment, the struct&rsquo;s
            alignment the largest of its fields&rsquo; (1 if none), and the size padded to a multiple of it. Then write{" "}
            <C>best_order(fields)</C>, returning a list of names in an order of least total size, and that size.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def layout(fields):
    offsets, pos = {}, 0
    for name, size, a in fields:
        offsets[name] = pos
        pos += size
    return offsets, pos, 1

def best_order(fields):
    return [f[0] for f in fields], layout(fields)[1]
`,
        solution: `def layout(fields):
    offsets, pos, align = {}, 0, 1
    for name, size, a in fields:
        pos = (pos + a - 1) // a * a          # round up to the field's alignment
        offsets[name] = pos
        pos += size
        align = max(align, a)
    size = (pos + align - 1) // align * align  # pad the end so arrays stay aligned
    return offsets, size, align

def best_order(fields):
    order = sorted(fields, key=lambda f: -f[2])
    return [f[0] for f in order], layout(order)[1]
`,
        tests: [
          { name: "layout", code: `CHAR, SHORT, INT, DOUBLE = 1, 2, 4, 8
A = [('c', 1, 1), ('i', 4, 4), ('d', 1, 1)]
assert layout(A) == ({'c': 0, 'i': 4, 'd': 8}, 12, 4)
assert layout([('i', 4, 4), ('c', 1, 1), ('d', 1, 1)]) == ({'i': 0, 'c': 4, 'd': 5}, 8, 4)
assert layout([('c', 1, 1), ('x', 8, 8)]) == ({'c': 0, 'x': 8}, 16, 8)
assert layout([('s', 2, 2), ('c', 1, 1)]) == ({'s': 0, 'c': 2}, 4, 2), 'Pad the end to a multiple of the alignment.'
assert layout([('buf', 3, 1)]) == ({'buf': 0}, 3, 1) and layout([]) == ({}, 0, 1)
assert layout([('c', 1, 1), ('v', 12, 4), ('d', 8, 8), ('e', 1, 1)]) == ({'c': 0, 'v': 4, 'd': 16, 'e': 24}, 32, 8)` },
          { name: "best order", code: `import itertools, random
def ref_size(fs):
    pos, al = 0, 1
    for _, size, a in fs:
        pos = (pos + a - 1) // a * a + size
        al = max(al, a)
    return (pos + al - 1) // al * al
fields = [('a', 1, 1), ('b', 8, 8), ('c', 2, 2), ('d', 4, 4), ('e', 1, 1)]
order, size = best_order(fields)
assert size == 16 and sorted(order) == list('abcde'), (order, size)
assert ref_size([next(f for f in fields if f[0] == n) for n in order]) == 16, 'The order you return must achieve the size.'
rng = random.Random(13)
kinds = [(1, 1), (2, 2), (4, 4), (8, 8), (3, 1), (12, 4)]
for _ in range(150):
    fs = [(f'f{i}',) + rng.choice(kinds) for i in range(rng.randint(1, 6))]
    best = min(ref_size(p) for p in itertools.permutations(fs))
    order, size = best_order(fs)
    assert size == best, (fs, size, best)
    assert ref_size([next(f for f in fs if f[0] == n) for n in order]) == size` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>Heap(size)</C> simulating an allocator over addresses 0 to size − 1. <C>malloc(n)</C> rounds n up to
            a multiple of 8 (at least 8), takes the lowest-addressed free block that is big enough, splits it, and returns the
            start address, raising <C>MemoryError</C> if none fits. <C>free(addr)</C> returns a block and merges it with free
            neighbours, raising <C>ValueError</C> if addr is not currently allocated. <C>largest_free()</C> gives the size of
            the largest free block.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Heap:
    def __init__(self, size):
        self.top, self.size = 0, size

    def malloc(self, n):
        addr = self.top
        self.top += n
        return addr

    def free(self, addr):
        pass

    def largest_free(self):
        return self.size - self.top
`,
        solution: `class Heap:
    def __init__(self, size):
        self.free_list = [(0, size)]          # (start, length), sorted, never adjacent
        self.used = {}                        # start -> length

    def malloc(self, n):
        n = max(8, (n + 7) // 8 * 8)
        for k, (start, length) in enumerate(self.free_list):
            if length >= n:                    # first fit
                if length == n:
                    del self.free_list[k]
                else:
                    self.free_list[k] = (start + n, length - n)
                self.used[start] = n
                return start
        raise MemoryError(f'no free block of {n} bytes')

    def free(self, addr):
        if addr not in self.used:
            raise ValueError('free of an address that is not allocated')
        n = self.used.pop(addr)
        blocks = sorted(self.free_list + [(addr, n)])
        merged = []
        for s, l in blocks:
            if merged and merged[-1][0] + merged[-1][1] == s:
                merged[-1] = (merged[-1][0], merged[-1][1] + l)
            else:
                merged.append((s, l))
        self.free_list = merged

    def largest_free(self):
        return max((l for _, l in self.free_list), default=0)
`,
        tests: [
          { name: "malloc and free", code: `h = Heap(64)
a = h.malloc(10)
b = h.malloc(8)
c = h.malloc(1)
assert (a, b, c) == (0, 16, 24), 'Round sizes up to multiples of 8 and use the first block that fits.'
assert h.largest_free() == 32
h.free(b)
assert h.largest_free() == 32 and h.malloc(8) == 16, 'First fit reuses the freed hole.'
h.free(16)
h.free(a)
assert h.largest_free() == 32, 'Freed neighbours 0..16 and 16..24 coalesce to 24 bytes, but 32 at the end is still larger.'
h.free(c)
assert h.largest_free() == 64, 'Everything freed coalesces back into one block.'
try:
    h.free(c)
    assert False, 'Double free raises ValueError.'
except ValueError:
    pass
try:
    Heap(16).malloc(24)
    assert False, 'Not enough memory: raise MemoryError.'
except MemoryError:
    pass` },
          { name: "fragmentation", code: `import random
h = Heap(100 * 8)
blocks = [h.malloc(8) for _ in range(100)]
for b in blocks[::2]:
    h.free(b)
assert h.largest_free() == 8, 'Half the memory is free, yet no 16-byte block exists: fragmentation.'
try:
    h.malloc(16)
    assert False, 'Fragmented: MemoryError.'
except MemoryError:
    pass
for b in blocks[1::2]:
    h.free(b)
assert h.largest_free() == 800
rng = random.Random(14)
h = Heap(4096)
live = {}
for _ in range(3000):
    if live and rng.random() < 0.5:
        addr = rng.choice(list(live))
        h.free(addr)
        del live[addr]
    else:
        n = rng.randint(1, 100)
        try:
            addr = h.malloc(n)
        except MemoryError:
            continue
        need = max(8, -(-n // 8) * 8)
        assert addr % 8 == 0 and 0 <= addr and addr + need <= 4096
        for o, m in live.items():
            assert addr + need <= o or o + m <= addr, 'Blocks overlap.'
        live[addr] = need
for addr in list(live):
    h.free(addr)
assert h.largest_free() == 4096` },
        ],
      },
    },
    {
      key: "aliasing",
      rung: "prove",
      prompt: <p>Explain, in terms of pointers and objects, why <C>grid = [[0] * 3] * 3</C> followed by <C>grid[0][0] = 1</C> changes all three rows in Python, and prove that <C>[[0] * 3 for _ in range(3)]</C> does not.</p>,
      answer: {
        kind: "written",
        rubric: [
          "[0] * 3 creates one list object; multiplying the outer list copies the pointer to it three times.",
          "So grid[0], grid[1] and grid[2] are the same object (same id), and a change through one is seen through all.",
          "The comprehension evaluates [0] * 3 afresh on each iteration, creating three distinct list objects.",
          "Assigning grid[0][0] changes only the first object's slot, so the other rows are unchanged.",
        ],
      },
    },
    {
      key: "frag",
      rung: "stretch",
      prompt: <p>Show that a first-fit allocator can fail a request for 2k bytes when half of memory is free, and explain why no allocator that never moves allocated blocks can rule this out.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Gives a sequence: fill memory with k-byte blocks, then free every other one.",
          "Half of memory is free, but every free block has k bytes, so a 2k request fails.",
          "Notes that whatever placement policy is used, the program chooses which blocks to free, and can always free alternate ones.",
          "Concludes that only moving live blocks (compaction, which C pointers forbid) can always repair fragmentation, which garbage-collected runtimes can do.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what a pointer is, and why a struct of a char, a double and a char takes 24 bytes in C.",

  glimpse: (
    <p>
      Pointers and layouts are what the processor finally sees. Next, a look at the processor&rsquo;s own language, assembly,
      and how a few dozen simple instructions run every program.
    </p>
  ),
};
