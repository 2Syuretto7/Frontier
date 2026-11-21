import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OccupancyCalcViz } from "@/components/viz/OccupancyCalcViz";
import type { LessonContent } from "@/lib/types";

const OCC = `LIMITS = {'blocks': 32, 'threads': 2048, 'regs': 65536, 'smem': 228 * 1024}

def per_resource(threads, regs, smem, lim=LIMITS):
    r = {'blocks': lim['blocks'], 'threads': lim['threads'] // threads, 'regs': lim['regs'] // (regs * threads)}
    if smem:
        r['smem'] = lim['smem'] // smem
    return r

def occupancy(threads, regs, smem, lim=LIMITS):
    blocks = min(per_resource(threads, regs, smem, lim).values())
    return blocks * threads / lim['threads']

def limiters(threads, regs, smem, lim=LIMITS):
    r = per_resource(threads, regs, smem, lim)
    return sorted(k for k, v in r.items() if v == min(r.values()))`;

const HIDE = `import math

def utilisation(warps, compute, latency):
    return min(1.0, warps * compute / (compute + latency))

def warps_needed(compute, latency):
    return math.ceil((compute + latency) / compute)

def bytes_in_flight(bandwidth, latency):
    return bandwidth * latency`;

export const lesson: LessonContent = {
  id: "e7.3.4",
  minutes: 50,
  links: {
    requires: ["e7.3.3"],
    revisits: ["e7.3.1", "e7.1.1"],
    foreshadows: ["e7.4.3"],
  },

  puzzle: (
    <>
      <p>
        You add a few local variables to a memory-bound GPU kernel and it runs at half the speed, although it does no more
        memory traffic than before. Nothing in the profile looks slower per instruction; the SMs simply spend more time
        idle. How can extra variables leave the hardware with nothing to do?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An SM hides the hundreds of cycles of a memory access by switching to another warp. That only works if enough warps
        are resident, and every resident warp needs its own registers and its share of the block&apos;s shared memory,
        both of which are fixed-size pools on the SM. More registers per thread means fewer threads fit, fewer warps to
        switch between, and more cycles in which every warp is waiting.
      </p>
      <OccupancyCalcViz />
    </>
  ),

  theory: (
    <>
      <Definition title="occupancy">
        <p>
          The <em>occupancy</em> of a kernel is the number of warps resident on an SM divided by the most the SM can hold.
          Blocks are placed whole, and each SM has fixed budgets: on an H100, 32 blocks, 2048 threads (64 warps), 65 536
          registers and 228 KB of shared memory.
        </p>
        <Code>{OCC}</Code>
      </Definition>

      <Theorem title="the resource bound">
        <p>
          A kernel with blocks of T threads, R registers per thread and S bytes of shared memory per block fits
        </p>
        <MD>{"b = \\min\\Bigl(B_{\\max},\\ \\Bigl\\lfloor \\frac{T_{\\max}}{T} \\Bigr\\rfloor,\\ \\Bigl\\lfloor \\frac{R_{\\max}}{RT} \\Bigr\\rfloor,\\ \\Bigl\\lfloor \\frac{S_{\\max}}{S} \\Bigr\\rfloor\\Bigr)"}</MD>
        <p>blocks on one SM, the last term omitted when S = 0, and its occupancy is <M>{"bT/T_{\\max}"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The b resident blocks need bT threads, bRT registers and bS bytes, and each total must fit its budget, which is
          exactly <M>{"b"}</M> at most each floor. The SM places blocks while all of them fit, so it reaches the minimum. If
          that minimum is 0 the kernel cannot be launched at all, as with 1024 threads of 128 registers, which would need
          twice the register file.
        </p>
      </Proof>

      <Theorem title="hiding latency">
        <p>
          Suppose each warp alternates c cycles of issuing instructions with a wait of L cycles for memory, and the SM issues
          one instruction per cycle. With W warps, the fraction of cycles in which the SM issues is at most
        </p>
        <MD>{"\\min\\Bigl(1,\\ \\frac{Wc}{c + L}\\Bigr),"}</MD>
        <p>
          and a round-robin schedule reaches it; full use needs <M>{"W \\ge \\lceil (c + L)/c \\rceil"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A warp needs at least c + L cycles per round, c of issuing and L of waiting, so in a long time t it contributes at
          most <M>{"ct/(c + L)"}</M> issue cycles, and the W warps together at most <M>{"Wct/(c+L)"}</M>, which together
          with the bound of one issue per cycle gives the formula. If the warps are served in turn, each issuing its c
          cycles when ready, then when <M>{"(W - 1)c \\ge L"}</M> a warp&apos;s wait is over by the time its turn comes again
          and the SM never idles; when <M>{"(W-1)c < L"}</M> each round takes exactly c + L cycles and contains Wc issue
          cycles, which is the bound.
        </p>
        <Code>{HIDE}</Code>
      </Proof>

      <Theorem title="Little’s law">
        <p>
          To sustain a bandwidth of B bytes per second through a memory with latency L seconds, on average{" "}
          <M>{"B \\cdot L"}</M> bytes must be in flight.
        </p>
      </Theorem>
      <Proof>
        <p>
          Over a long time t, Bt bytes are delivered, and each byte spends L seconds in flight, so the total of
          byte-seconds in flight is BtL. Dividing by t gives the average number of bytes in flight. For an H100,{" "}
          <M>{"3.35 \\times 10^{12} \\cdot 600 \\times 10^{-9}"}</M> is about 2 MB, or about 15 KB for each of its 132 SMs,
          which must come from many warps each with loads outstanding: the same quantity as for the CPU in e7.1.1.
        </p>
      </Proof>

      <Remark title="occupancy is a means, not the goal">
        <p>
          Warps are one source of independent work; another is independent instructions within a warp, as with the
          multiple accumulators of e7.2.1. Many of the fastest matrix-multiplication kernels run at low occupancy on purpose:
          they give each thread many registers, compute a large tile of outputs per thread, and keep many loads in flight per
          warp, so they reach the bandwidth Little&apos;s law asks for with fewer warps and more reuse. Raise occupancy when
          the profiler shows the SM stalled waiting for memory with few eligible warps, not as an end in itself.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "occ",
      rung: "check",
      prompt: <p>With the H100 limits of this lesson, what is the occupancy of a kernel with 128 threads per block, 40 registers per thread and no shared memory?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0005 },
    },
    {
      key: "warps",
      rung: "check",
      prompt: <p>Each warp issues for 10 cycles and then waits 500 cycles for memory. How many warps are needed to keep the SM issuing every cycle?</p>,
      answer: { kind: "numeric", value: 51, tolerance: 0 },
    },
    {
      key: "raise",
      rung: "apply",
      prompt: <p>A kernel uses 256-thread blocks, 64 registers per thread and no shared memory, so its occupancy is 50%. Which change raises occupancy?</p>,
      answer: {
        kind: "choice",
        options: [
          "Cutting registers to 32 per thread",
          "Using 512-thread blocks with the same registers",
          "Adding 16 KB of shared memory per block",
          "Using 96 registers per thread to avoid spills",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`LIMITS = {'blocks': 32, 'threads': 2048, 'regs': 65536, 'smem': 228 * 1024}

def per_resource(threads, regs, smem, lim=LIMITS):
    r = {'blocks': lim['blocks'], 'threads': lim['threads'] // threads, 'regs': lim['regs'] // (regs * threads)}
    if smem:
        r['smem'] = lim['smem'] // smem
    return r

def occupancy(threads, regs, smem, lim=LIMITS):
    blocks = min(per_resource(threads, regs, smem, lim).values())
    return blocks * threads / lim['threads']

def limiters(threads, regs, smem, lim=LIMITS):
    r = per_resource(threads, regs, smem, lim)
    return sorted(k for k, v in r.items() if v == min(r.values()))

print(per_resource(256, 64, 0), occupancy(256, 32, 0), occupancy(256, 64, 0))
print(occupancy(128, 32, 48 * 1024), occupancy(1024, 128, 0), limiters(256, 32, 0), limiters(64, 32, 0), limiters(128, 32, 48 * 1024))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'blocks': 32, 'threads': 8, 'regs': 4} 1.0 0.5\n0.25 0.0 ['regs', 'threads'] ['blocks', 'regs', 'threads'] ['smem']",
          "{'blocks': 32, 'threads': 8, 'regs': 4, 'smem': 0} 1.0 0.5\n0.25 0.0 ['regs', 'threads'] ['blocks', 'regs', 'threads'] ['smem']",
          "{'blocks': 32, 'threads': 8, 'regs': 4} 1.0 0.5\n0.25 0.5 ['regs', 'threads'] ['blocks', 'regs', 'threads'] ['smem']",
          "{'blocks': 32, 'threads': 8, 'regs': 4} 1.0 0.5\n0.25 0.0 ['threads'] ['blocks'] ['smem']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def utilisation(warps, compute, latency):
    return min(1.0, warps * compute / (compute + latency))

def warps_needed(compute, latency):
    return math.ceil((compute + latency) / compute)

def bytes_in_flight(bandwidth, latency):
    return bandwidth * latency

print(utilisation(4, 20, 380), utilisation(32, 20, 380), warps_needed(20, 380), warps_needed(100, 300))
print(round(bytes_in_flight(3.35e12, 600e-9) / 1024), round(bytes_in_flight(3.35e12 / 132, 600e-9) / 1024, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.2 1.0 20 4\n1963 14.9", "0.2 1.6 20 4\n1963 14.9", "0.2 1.0 19 3\n1963 14.9", "0.2 1.0 20 4\n2010 15.2"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With <C>LIMITS</C> as given, write <C>per_resource(threads, regs, smem, lim=LIMITS)</C>, a dict from{" "}
          <C>&apos;blocks&apos;</C>, <C>&apos;threads&apos;</C>, <C>&apos;regs&apos;</C> and, only when smem is not 0,{" "}
          <C>&apos;smem&apos;</C> to the blocks per SM each allows; <C>occupancy(threads, regs, smem, lim=LIMITS)</C>; and{" "}
          <C>limiters(threads, regs, smem, lim=LIMITS)</C>, the sorted names of the resources that attain the minimum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `LIMITS = {'blocks': 32, 'threads': 2048, 'regs': 65536, 'smem': 228 * 1024}

def per_resource(threads, regs, smem, lim=LIMITS):
    return {}

def occupancy(threads, regs, smem, lim=LIMITS):
    return 1.0

def limiters(threads, regs, smem, lim=LIMITS):
    return []
`,
        solution: OCC,
        tests: [
          { name: "resources", code: `assert per_resource(256, 64, 0) == {'blocks': 32, 'threads': 8, 'regs': 4}
assert per_resource(128, 32, 48 * 1024) == {'blocks': 32, 'threads': 16, 'regs': 16, 'smem': 4}
assert per_resource(1024, 128, 0)['regs'] == 0 and per_resource(32, 32, 1, lim={'blocks': 4, 'threads': 64, 'regs': 4096, 'smem': 10})['smem'] == 10` },
          { name: "occupancy", code: `assert occupancy(256, 32, 0) == 1.0 and occupancy(256, 64, 0) == 0.5 and occupancy(128, 40, 0) == 0.75 and occupancy(1024, 128, 0) == 0.0
assert occupancy(32, 32, 0) == 0.5 and occupancy(256, 32, 32 * 1024) == 0.875 and occupancy(96, 255, 0) == 0.09375
assert limiters(256, 32, 0) == ['regs', 'threads'] and limiters(32, 32, 0) == ['blocks'] and limiters(256, 32, 32 * 1024) == ['smem']` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>utilisation(warps, compute, latency)</C>, the issue fraction of the latency-hiding theorem;{" "}
          <C>warps_needed(compute, latency)</C>, the fewest warps that make it 1; and{" "}
          <C>bytes_in_flight(bandwidth, latency)</C>, from Little&apos;s law.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def utilisation(warps, compute, latency):
    return 1.0

def warps_needed(compute, latency):
    return 1

def bytes_in_flight(bandwidth, latency):
    return 0
`,
        solution: HIDE,
        tests: [
          { name: "hiding", code: `assert utilisation(4, 20, 380) == 0.2 and utilisation(32, 20, 380) == 1.0 and utilisation(1, 100, 0) == 1.0
assert warps_needed(20, 380) == 20 and warps_needed(100, 300) == 4 and warps_needed(10, 500) == 51 and warps_needed(7, 1) == 2
for c, l in [(20, 380), (10, 500), (7, 1), (3, 10)]:
    w = warps_needed(c, l)
    assert utilisation(w, c, l) == 1.0 and utilisation(w - 1, c, l) < 1.0` },
          { name: "little", code: `assert bytes_in_flight(1e9, 1e-6) == 1000.0 and round(bytes_in_flight(3.35e12, 600e-9) / 1024) == 1963 and bytes_in_flight(0, 5) == 0` },
        ],
      },
    },
    {
      key: "threads",
      rung: "stretch",
      prompt: (
        <p>
          An H100 has 132 SMs sharing 3.35 TB/s of bandwidth with a latency of 600 ns. If each thread keeps one 16-byte load
          outstanding, what is the fewest threads per SM that can sustain the full bandwidth?
        </p>
      ),
      answer: { kind: "numeric", value: 952, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        We now know what the hardware can do in each part. The next chapter turns this into a model that predicts the
        speed of a kernel from two numbers, the operations it performs and the bytes it moves.
      </p>
    </>
  ),
};
