import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RooflineOverlapViz } from "@/components/viz/RooflineOverlapViz";
import type { LessonContent } from "@/lib/types";

const ROOF = `def attainable(I, peak, bw):
    return min(peak, I * bw)

def time_bounds(flops, nbytes, peak, bw):
    tc, tm = flops / peak, nbytes / bw
    return max(tc, tm), tc + tm

def serial_perf(I, peak, bw):
    return 1 / (1 / peak + 1 / (I * bw))`;

const DIAG = `def level_bound(flops, levels, peak):
    best, name = peak, 'compute'
    for level, nbytes, bw in levels:
        if flops / nbytes * bw < best:
            best, name = flops / nbytes * bw, level
    return best, name

def efficiency(flops, nbytes, seconds, peak, bw):
    return (flops / seconds) / min(peak, flops / nbytes * bw)

def upgrade_speedup(I, old, new):
    return min(new[0], I * new[1]) / min(old[0], I * old[1])`;

export const lesson: LessonContent = {
  id: "e7.4.3",
  minutes: 50,
  links: {
    requires: ["e7.4.2"],
    revisits: ["e6.4.5", "e7.3.4"],
    foreshadows: ["e7.4.4", "e7.6.3"],
  },

  puzzle: (
    <>
      <p>
        Your team is deciding whether to move a workload from A100 to H100 GPUs. The H100 has 3.2 times the bf16 compute
        but only 1.7 times the memory bandwidth. One of your kernels gets 3.2 times faster on the new GPU, another 1.7
        times, and a third, which you expected to gain 3.2 times, gains only 2.1. Can you predict all three numbers before
        buying anything?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The roofline turns two hardware numbers and one kernel number into a bound on speed: a kernel with intensity I
        can run no faster than the lower of the compute peak and I times the bandwidth. The bound assumes that data
        transfer and arithmetic overlap perfectly. Real kernels overlap them imperfectly, and the loss is worst exactly at
        the ridge, where the two take equal time.
      </p>
      <RooflineOverlapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the roofline">
        <p>
          For a machine with peak compute Π and bandwidth β, the <em>roofline</em> is{" "}
          <M>{"P(I) = \\min(\\Pi, I\\beta)"}</M>, the most FLOP/s a kernel of intensity I can attain (e6.4.5). On log-log
          axes it is a slope of 1 up to the ridge <M>{"\\Pi/\\beta"}</M> and flat after it. Lower <em>ceilings</em> describe
          what a kernel can reach without some feature: without tensor cores the flat part drops to the fp32 peak, and
          with uncoalesced access the sloped part drops to the bandwidth actually delivered.
        </p>
        <Code>{ROOF}</Code>
      </Definition>

      <Theorem title="bounds on the time">
        <p>
          A kernel of F FLOPs and Q bytes, computing at rate Π and transferring at rate β, takes a time t with
        </p>
        <MD>{"\\max\\Bigl(\\frac{F}{\\Pi}, \\frac{Q}{\\beta}\\Bigr) \\le t \\le \\frac{F}{\\Pi} + \\frac{Q}{\\beta} \\le 2\\max\\Bigl(\\frac{F}{\\Pi}, \\frac{Q}{\\beta}\\Bigr),"}</MD>
        <p>
          the lower bound when the two fully overlap and the upper when they do not overlap at all. The factor 2 is attained
          exactly when the intensity equals the ridge.
        </p>
      </Theorem>
      <Proof>
        <p>
          The compute alone needs <M>{"F/\\Pi"}</M> and the transfers alone <M>{"Q/\\beta"}</M>, so t is at least the larger;
          doing one after the other takes the sum, and a sum of two non-negative numbers is at most twice the larger, with
          equality only when they are equal: <M>{"F/\\Pi = Q/\\beta"}</M>, that is <M>{"F/Q = \\Pi/\\beta"}</M>. With no
          overlap the attained rate is F divided by the sum, <M>{"1/(1/\\Pi + 1/(I\\beta))"}</M>, which is{" "}
          <C>serial_perf</C>: a smooth curve under the roof that meets it only far from the ridge.
        </p>
      </Proof>

      <Theorem title="the hierarchical roofline">
        <p>
          If a kernel moves <M>{"Q_\\ell"}</M> bytes through memory level <M>{"\\ell"}</M> of bandwidth{" "}
          <M>{"\\beta_\\ell"}</M>, its rate is at most <M>{"\\min\\bigl(\\Pi,\\ \\min_\\ell (F/Q_\\ell)\\,\\beta_\\ell\\bigr)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each level needs at least <M>{"Q_\\ell/\\beta_\\ell"}</M> seconds, and the compute <M>{"F/\\Pi"}</M>, so t is at
          least the largest of these and the rate <M>{"F/t"}</M> at most the smallest of the corresponding rates. The level
          that attains the minimum is the bottleneck, which <C>level_bound</C> reports. A kernel tiled well for HBM can still
          be limited by shared memory or L2 (e7.4.2), so measuring traffic at each level tells you where to work.
        </p>
        <Code>{DIAG}</Code>
      </Proof>

      <Example title="the puzzle">
        <p>
          A100: 312 TFLOP/s and 2.0 TB/s, ridge 156. H100: 989 TFLOP/s and 3.35 TB/s, ridge 295. A kernel at intensity 1000
          is compute-bound on both and gains <M>{"989/312 \\approx 3.17"}</M>. A kernel at intensity 1 is memory-bound on
          both and gains <M>{"3.35/2.0 \\approx 1.68"}</M>. A kernel at intensity 200 is compute-bound on the A100 but
          memory-bound on the H100, and gains <M>{"200 \\cdot 3.35/312 \\approx 2.15"}</M>: more compute is wasted the closer
          a kernel sits to the new, higher ridge. <C>upgrade_speedup</C> computes this ratio for any intensity.
        </p>
      </Example>

      <Remark title="using the roofline">
        <p>
          A profiler such as Nsight Compute reports a kernel&apos;s FLOPs, its bytes at each level and its time, which places
          it on the plot; its efficiency is achieved over attainable. Far below a sloped roof, look at access patterns and
          coalescing. Below the flat roof with high intensity, look at whether tensor cores are used and at occupancy and
          instruction overheads. Near the ridge, look at overlap: asynchronous copies and double buffering, which load the
          next tile while computing on the current one, exist to close the gap between the dashed curve and the roof.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "roof",
      rung: "check",
      prompt: <p>On an H100 (989 TFLOP/s, 3.35 TB/s), what is the attainable rate, in TFLOP/s, of a kernel with intensity 50? Give one decimal.</p>,
      answer: { kind: "numeric", value: 167.5, tolerance: 0.05 },
    },
    {
      key: "lower",
      rung: "check",
      prompt: <p>A kernel does 10<sup>12</sup> FLOPs and moves 4 × 10<sup>9</sup> bytes on an H100. What is the lower bound on its time, in milliseconds? Give three decimals.</p>,
      answer: { kind: "numeric", value: 1.194, tolerance: 0.0006 },
    },
    {
      key: "upgrade",
      rung: "apply",
      prompt: <p>A kernel sits at intensity 2 FLOPs per byte. Which hardware change would speed it up most?</p>,
      answer: {
        kind: "choice",
        options: [
          "More memory bandwidth",
          "More tensor-core FLOP/s",
          "A larger register file",
          "A higher ridge point",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def attainable(I, peak, bw):
    return min(peak, I * bw)

def time_bounds(flops, nbytes, peak, bw):
    tc, tm = flops / peak, nbytes / bw
    return max(tc, tm), tc + tm

def serial_perf(I, peak, bw):
    return 1 / (1 / peak + 1 / (I * bw))

print(attainable(10, 100, 4), attainable(50, 100, 4), time_bounds(400, 100, 100, 4), serial_perf(25, 100, 4))
print(round(serial_perf(1, 100, 4), 3), round(serial_perf(1000, 100, 4), 2), time_bounds(1, 1, 1, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "40 100 (25.0, 29.0) 50.0\n3.846 97.56 (1.0, 2.0)",
          "40 100 (25.0, 29.0) 100\n3.846 97.56 (1.0, 2.0)",
          "40 200 (25.0, 29.0) 50.0\n3.846 97.56 (1.0, 2.0)",
          "40 100 (4.0, 29.0) 50.0\n4 100 (1.0, 1.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def level_bound(flops, levels, peak):
    best, name = peak, 'compute'
    for level, nbytes, bw in levels:
        if flops / nbytes * bw < best:
            best, name = flops / nbytes * bw, level
    return best, name

def efficiency(flops, nbytes, seconds, peak, bw):
    return (flops / seconds) / min(peak, flops / nbytes * bw)

def upgrade_speedup(I, old, new):
    return min(new[0], I * new[1]) / min(old[0], I * old[1])

print(level_bound(1000, [('hbm', 100, 30), ('l2', 200, 80)], 500), level_bound(1000, [('hbm', 10, 30)], 500))
print(efficiency(1000, 100, 20, 1000, 10), upgrade_speedup(1, (312, 2.0), (989, 3.35)), round(upgrade_speedup(1000, (312, 2.0), (989, 3.35)), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(300.0, 'hbm') (500, 'compute')\n0.5 1.675 3.17",
          "(400.0, 'l2') (500, 'compute')\n0.5 1.675 3.17",
          "(300.0, 'hbm') (3000.0, 'hbm')\n0.5 1.675 3.17",
          "(300.0, 'hbm') (500, 'compute')\n5.0 3.17 1.675",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>attainable(I, peak, bw)</C>; <C>time_bounds(flops, nbytes, peak, bw)</C>, returning the overlapped and
          the serial time; and <C>serial_perf(I, peak, bw)</C>, the FLOP/s attained with no overlap.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def attainable(I, peak, bw):
    return peak

def time_bounds(flops, nbytes, peak, bw):
    return 0.0, 0.0

def serial_perf(I, peak, bw):
    return peak
`,
        solution: ROOF,
        tests: [
          { name: "roof", code: `assert attainable(10, 100, 4) == 40 and attainable(50, 100, 4) == 100 and attainable(25, 100, 4) == 100
assert time_bounds(400, 100, 100, 4) == (25.0, 29.0) and time_bounds(1, 1, 1, 1) == (1.0, 2.0) and time_bounds(0, 8, 1, 2) == (4.0, 4.0)` },
          { name: "serial", code: `assert serial_perf(25, 100, 4) == 50.0 and abs(serial_perf(1, 100, 4) - 100 / 26) < 1e-12
for I in [0.5, 3, 25, 400]:
    s, a = serial_perf(I, 100, 4), attainable(I, 100, 4)
    assert a / 2 - 1e-9 <= s <= a, I
    t, u = time_bounds(I * 8, 8, 100, 4)
    assert abs(I * 8 / u - s) < 1e-9 and abs(I * 8 / t - a) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>level_bound(flops, levels, peak)</C>, where levels lists (name, bytes, bandwidth), returning the bound and
          the name of the binding level, or <C>&apos;compute&apos;</C> if none binds (ties keep the earlier one);{" "}
          <C>efficiency(flops, nbytes, seconds, peak, bw)</C>, achieved over attainable; and{" "}
          <C>upgrade_speedup(I, old, new)</C>, with each machine given as (peak, bandwidth).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def level_bound(flops, levels, peak):
    return peak, 'compute'

def efficiency(flops, nbytes, seconds, peak, bw):
    return 1.0

def upgrade_speedup(I, old, new):
    return new[0] / old[0]
`,
        solution: DIAG,
        tests: [
          { name: "levels", code: `assert level_bound(1000, [('hbm', 100, 30), ('l2', 200, 80)], 500) == (300.0, 'hbm') and level_bound(1000, [('hbm', 10, 30)], 500) == (500, 'compute')
assert level_bound(1000, [('hbm', 100, 30), ('smem', 1000, 20)], 500) == (20.0, 'smem') and level_bound(10, [], 7) == (7, 'compute')
assert level_bound(100, [('a', 10, 1), ('b', 20, 2)], 50)[1] == 'a'` },
          { name: "efficiency", code: `assert efficiency(1000, 100, 20, 1000, 10) == 0.5 and efficiency(100, 1, 1, 100, 1000) == 1.0
assert upgrade_speedup(1, (312, 2.0), (989, 3.35)) == 1.675 and abs(upgrade_speedup(1000, (312, 2.0), (989, 3.35)) - 989 / 312) < 1e-12
assert abs(upgrade_speedup(200, (312, 2.0), (989, 3.35)) - 670 / 312) < 1e-12` },
        ],
      },
    },
    {
      key: "ninety",
      rung: "stretch",
      prompt: (
        <p>
          On an H100, a kernel does no overlap at all. Below the ridge, up to what intensity does it still attain at least 90%
          of the roofline? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 32.8, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The roofline judges one kernel. A training run is millions of kernels, and the last lesson of this chapter measures
        the whole run against the hardware: model FLOPs utilisation.
      </p>
    </>
  ),
};
