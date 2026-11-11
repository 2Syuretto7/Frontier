import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PageTableViz } from "@/components/viz/PageTableViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.3.3",
  minutes: 60,
  links: {
    requires: ["e3.3.1"],
    revisits: ["e3.2.2", "e3.3.2", "e3.1.3"],
    foreshadows: ["e3.4.1", "e3.4.3", "e4.5.2"],
  },

  puzzle: (
    <>
      <p>
        Run two copies of the same program and print the address of a global variable in each: on many systems both print the
        same number, yet each copy changes its own variable without touching the other. A laptop with 16 GiB of memory can{" "}
        <C>np.memmap</C> a 100 GiB file and index it like an array. And a program that touches memory it never asked for gets
        a segmentation fault rather than reading someone else&rsquo;s data. How can one address mean different bytes in
        different programs?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every address a program uses is <strong>virtual</strong>. Memory is divided into <strong>pages</strong>, usually 4
        KiB, and each process has a <strong>page table</strong> mapping its virtual pages to physical <strong>frames</strong>.
        The hardware translates every access: it keeps the page number&rsquo;s frame and the offset within the page unchanged.
        A page with no frame causes a <strong>page fault</strong>, and the operating system either loads the page (from disk,
        or a fresh zeroed one) or kills the program. A small cache of recent translations, the <strong>TLB</strong>, keeps
        this fast. Access a few addresses below and watch all three cases.
      </p>
      <PageTableViz />
    </>
  ),

  theory: (
    <>
      <Definition title="address translation">
        <p>
          With pages of P = <M>{"2^p"}</M> bytes, a virtual address v splits into page number <M>{"\\lfloor v / P \\rfloor"}</M>{" "}
          and offset v mod P (the low p bits). The page table entry (PTE) for that page holds a frame number f, a valid bit,
          and permission bits (read, write, execute, user). The physical address is f·P + offset. Writing to a read-only page,
          executing a data page, or using an invalid one traps to the operating system.
        </p>
        <Code>{`vpn, offset = divmod(vaddr, PAGE)
frame = page_table[vpn]          # missing: page fault
paddr = frame * PAGE + offset`}</Code>
      </Definition>

      <Theorem title="multi-level page tables">
        <p>
          With 48-bit virtual addresses, 4 KiB pages and 8-byte entries, a flat page table per process would need 512 GiB. A
          four-level table, where each level is a 4 KiB page of 512 entries indexed by 9 bits of the address, maps the same
          space, and a process using k pages needs at most 3k + 1 table pages.
        </p>
      </Theorem>
      <Proof>
        <p>
          Offsets take 12 bits, leaving 36 bits of page number: <M>{"2^{36}"}</M> entries of 8 bytes is{" "}
          <M>{"2^{39}"}</M> bytes, 512 GiB. A 4 KiB table page holds 512 = <M>{"2^9"}</M> entries, so four levels of 9 bits
          cover the 36 bits. Only tables on the path to a used page need exist: one root, and for each used page at most one
          table at each of the three lower levels. So k pages need at most 1 + 3k table pages, and far fewer when the pages
          are close together and share tables. A process using 100 MiB in one region needs about 25,600 leaf entries, which
          fit in 50 leaf tables, plus a handful above.
        </p>
      </Proof>

      <Example title="the TLB">
        <p>
          A walk of a four-level table costs four memory reads before the real one. The translation lookaside buffer caches
          recent page-to-frame translations, typically 64 entries in L1 and a couple of thousand in L2, so most accesses skip
          the walk. With 4 KiB pages, 2,000 entries cover only 8 MiB; programs with large, scattered working sets (big hash
          tables, embedding lookups) suffer TLB misses, which <strong>huge pages</strong> of 2 MiB or 1 GiB reduce.
        </p>
      </Example>

      <Example title="what paging buys">
        <p>
          <strong>Isolation</strong>: each process has its own table, so it cannot even name another&rsquo;s memory.{" "}
          <strong>Demand paging</strong>: pages are loaded only when first touched, so a program starts before it is all in
          memory. <strong>Memory-mapped files</strong>: <C>mmap</C> maps a file&rsquo;s pages into the address space, and
          faults read them from disk, which is how <C>np.memmap</C>, safetensors and many dataset loaders avoid reading whole
          files. <strong>Copy-on-write</strong>: <C>fork</C> shares all pages read-only between parent and child, copying a
          page only when one of them writes to it. When memory runs short the OS evicts pages, choosing victims with an
          approximation of LRU.
        </p>
      </Example>

      <Remark title="GPUs">
        <p>
          GPUs translate addresses too. CUDA&rsquo;s unified memory lets the CPU and GPU share one virtual address space, and
          pages migrate across PCIe on fault, which is convenient but slow if it happens in a hot loop. Serving systems for
          large language models borrow the idea directly: vLLM&rsquo;s PagedAttention stores each request&rsquo;s key-value
          cache in fixed-size blocks with a block table per sequence, so memory is allocated on demand without fragmentation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "offset",
      rung: "check",
      prompt: <p>With 4 KiB pages, how many low bits of an address form the offset within the page?</p>,
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "flat",
      rung: "apply",
      prompt: <p>A 32-bit machine uses 4 KiB pages and 4-byte page table entries. How many KiB does a flat (single-level) page table for one process take?</p>,
      answer: { kind: "numeric", value: 4096 },
    },
    {
      key: "eat",
      rung: "apply",
      prompt: <p>A memory access takes 100 ns. On a TLB miss the hardware walks a four-level page table, one memory access per level, before the access itself. If 98% of accesses hit the TLB (lookup time negligible), what is the average time per access in nanoseconds?</p>,
      answer: { kind: "numeric", value: 108 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`PAGE = 4096
table = {0: 7, 1: 3, 2: None, 5: 12}     # virtual page -> physical frame

def translate(va):
    vpn, off = divmod(va, PAGE)
    frame = table.get(vpn)
    if frame is None:
        return 'fault'
    return frame * PAGE + off

print(translate(100), translate(4096 + 20), translate(8200), hex(translate(0x5ABC)), translate(3 * PAGE))`}</Code>
          <p>Translating addresses. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["28772 12308 fault 0xcabc fault", "28772 12308 fault 0x5abc fault", "100 12308 fault 0xcabc 12288", "28772 12308 8200 0xcabc fault"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def faults(refs, frames, policy):
    mem, n = [], 0
    for p in refs:
        if p in mem:
            if policy == 'lru':
                mem.remove(p)
                mem.append(p)
            continue
        n += 1
        if len(mem) == frames:
            mem.pop(0)
        mem.append(p)
    return n

refs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
print(faults(refs, 3, 'fifo'), faults(refs, 4, 'fifo'), faults(refs, 3, 'lru'), faults(refs, 4, 'lru'))`}</Code>
          <p>Page replacement with 3 and 4 frames. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["9 10 10 8", "9 9 10 8", "10 9 10 8", "9 10 8 10"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Define an exception class <C>PageFault</C>. Write <C>translate(vaddr, table, page_size=4096)</C> for a flat
            table (a dict from page number to frame; a missing page faults), and <C>walk(vaddr, root, bits=(9, 9, 12))</C> for
            a multi-level table: <C>bits</C> gives the index width at each level, top first, then the offset width; each level
            is a dict from index to the next level, and the last level maps to a frame number.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class PageFault(Exception):
    pass


def translate(vaddr, table, page_size=4096):
    return vaddr


def walk(vaddr, root, bits=(9, 9, 12)):
    return vaddr
`,
        solution: `class PageFault(Exception):
    pass


def translate(vaddr, table, page_size=4096):
    vpn, offset = divmod(vaddr, page_size)
    frame = table.get(vpn)
    if frame is None:
        raise PageFault(vpn)
    return frame * page_size + offset


def walk(vaddr, root, bits=(9, 9, 12)):
    # bits: index widths from the top level down, then the offset width
    *levels, off_bits = bits
    offset = vaddr & ((1 << off_bits) - 1)
    shift = off_bits + sum(levels)
    node = root
    for width in levels:
        shift -= width
        idx = (vaddr >> shift) & ((1 << width) - 1)
        if not isinstance(node, dict) or idx not in node:
            raise PageFault(vaddr)
        node = node[idx]
    return (node << off_bits) | offset
`,
        tests: [
          { name: "flat table", code: `table = {0: 7, 1: 3, 5: 12}
assert translate(100, table) == 7 * 4096 + 100
assert translate(4096 + 20, table) == 3 * 4096 + 20
assert translate(0x5ABC, table) == 0xCABC, 'Page 5 maps to frame 12: only the page number changes.'
assert translate(300, {1: 4}, 256) == 4 * 256 + 44, 'Pages of 256 bytes.'
for bad in [2 * 4096, 3 * 4096 + 5, 10 ** 9]:
    try:
        translate(bad, table)
        assert False, f'{bad} is unmapped and should raise PageFault.'
    except PageFault:
        pass
assert issubclass(PageFault, Exception)` },
          { name: "multi-level walk", code: `root = {0: {0: 5, 3: 9}, 2: {1: 0x1F}}
assert walk(0x023, root, (2, 2, 8)) == 0x523, 'Indices 0 and 0: frame 5.'
assert walk((0 << 12) | (3 << 8) | 0xAB, root, (4, 4, 8)) == 0x9AB
va = (2 << 18) | (1 << 12) | 0xFFF
assert walk(va, root, (6, 6, 12)) == (0x1F << 12) | 0xFFF
for bad in [(1 << 18), (2 << 18) | (2 << 12)]:
    try:
        walk(bad, root, (6, 6, 12))
        assert False, f'{hex(bad)} has no mapping and should raise PageFault.'
    except PageFault:
        pass
deep = {1: {2: {3: {4: 77}}}}
va = (1 << 39) | (2 << 30) | (3 << 21) | (4 << 12) | 0x345
assert walk(va, deep, (9, 9, 9, 9, 12)) == (77 << 12) | 0x345, 'Four levels, as on x86-64.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>count_faults(refs, frames, policy)</C>: the number of page faults when the page numbers in refs are
            accessed in order with the given number of frames, starting empty, for policy <C>&apos;fifo&apos;</C> (evict the
            page loaded earliest), <C>&apos;lru&apos;</C> (evict the least recently used) or <C>&apos;opt&apos;</C> (evict the
            page whose next use is furthest away, or never). Then write <C>fault_curve(refs, policy, max_frames)</C>, the fault
            counts for 1 to max_frames frames.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_faults(refs, frames, policy):
    return len(set(refs))


def fault_curve(refs, policy, max_frames):
    return [len(set(refs))] * max_frames
`,
        solution: `def count_faults(refs, frames, policy):
    mem, faults = [], 0
    for t, p in enumerate(refs):
        if p in mem:
            if policy == 'lru':
                mem.remove(p)
                mem.append(p)
            continue
        faults += 1
        if len(mem) == frames:
            if policy == 'opt':
                rest = refs[t + 1:]
                victim = max(mem, key=lambda q: rest.index(q) if q in rest else len(rest))
                mem.remove(victim)
            else:
                mem.pop(0)
        mem.append(p)
    return faults


def fault_curve(refs, policy, max_frames):
    return [count_faults(refs, f, policy) for f in range(1, max_frames + 1)]
`,
        tests: [
          { name: "FIFO and LRU", code: `def ref(refs, frames, lru):
    mem, n = [], 0
    for p in refs:
        if p in mem:
            if lru:
                mem.remove(p); mem.append(p)
            continue
        n += 1
        if len(mem) == frames:
            mem.pop(0)
        mem.append(p)
    return n

B = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
assert count_faults(B, 3, 'fifo') == 9 and count_faults(B, 4, 'fifo') == 10, 'Belady: FIFO with 4 frames faults more than with 3.'
assert count_faults(B, 3, 'lru') == 10 and count_faults(B, 4, 'lru') == 8
assert count_faults([7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2], 3, 'lru') == 9
import random
rng = random.Random(8)
for _ in range(40):
    refs = [rng.randrange(8) for _ in range(rng.randrange(1, 60))]
    f = rng.randrange(1, 6)
    assert count_faults(refs, f, 'fifo') == ref(refs, f, False), f'FIFO wrong on {refs} with {f} frames.'
    assert count_faults(refs, f, 'lru') == ref(refs, f, True), f'LRU wrong on {refs} with {f} frames.'
assert fault_curve(B, 'fifo', 5) == [12, 12, 9, 10, 5], 'The FIFO curve goes up between 3 and 4 frames.'` },
          { name: "optimal", code: `assert count_faults([7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], 3, 'opt') == 9, 'The textbook string needs 9 faults under OPT.'
assert count_faults([1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 4, 'opt') == 6
assert count_faults([1, 2, 1, 3, 1, 4], 2, 'opt') == 4, 'OPT keeps page 1, needed soonest.'
import random
rng = random.Random(21)
for _ in range(60):
    refs = [rng.randrange(7) for _ in range(rng.randrange(1, 50))]
    for f in range(1, 5):
        o = count_faults(refs, f, 'opt')
        assert o <= count_faults(refs, f, 'lru') and o <= count_faults(refs, f, 'fifo'), f'OPT can never lose, but did on {refs} with {f} frames.'
    curve = fault_curve(refs, 'lru', 6)
    assert all(a >= b for a, b in zip(curve, curve[1:])), f'LRU never gets worse with more frames, but {curve}.'
    assert curve[-1] == len(set(refs)) or len(set(refs)) > 6` },
        ],
      },
    },
    {
      key: "levels",
      rung: "prove",
      prompt: <p>A process maps k pages that are contiguous in its virtual address space, with a four-level table of 512 entries per level. Prove that it needs at most ⌈k/512⌉ + 1 leaf tables, and hence that its page tables take about k/512 pages, a 0.2% overhead.</p>,
      answer: {
        kind: "written",
        rubric: [
          "A leaf table covers 512 consecutive virtual pages aligned to a multiple of 512.",
          "k consecutive pages meet at most ⌈k/512⌉ + 1 such aligned blocks (the run can start part-way into a block).",
          "Each higher level is 512 times sparser, so it adds at most about 1/512 as many tables again, plus one or two at each level for misaligned ends.",
          "Concludes the total is about k/512 table pages for k data pages, roughly 0.2%, compared with 512 GiB for a flat table.",
        ],
      },
    },
    {
      key: "anomaly",
      rung: "stretch",
      prompt: <p>The second program above shows FIFO faulting more with 4 frames than with 3 (Belady&rsquo;s anomaly). Prove that LRU can never do this: with more frames it never faults more.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Observes that with n frames, LRU holds exactly the n most recently used distinct pages (or all pages so far, if fewer).",
          "So at every time the set held with n frames is contained in the set held with n + 1 frames (the inclusion, or stack, property).",
          "A hit with n frames is therefore a hit with n + 1 frames, so faults with n + 1 frames are a subset of those with n.",
          "Notes FIFO lacks inclusion: in the example, after some accesses the 3-frame memory holds a page the 4-frame memory has evicted.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how two programs can both use address 0x601040 without interfering, and what the hardware does on each access.",

  glimpse: (
    <p>
      The page table is per process, and switching tables switches worlds. Next chapter: processes and threads, what the
      operating system keeps for each, and how it shares one processor among them.
    </p>
  ),
};
