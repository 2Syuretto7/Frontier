import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VideoFramesViz } from "@/components/viz/VideoFramesViz";
import type { LessonContent } from "@/lib/types";

const TOKENS = `def video_latent_shape(T, H, W, ft, fs, c):
    return 1 + (T - 1) // ft, H // fs, W // fs, c             # the first frame is encoded on its own

def video_tokens(shape, pt, ps):
    t, h, w, _ = shape
    return (t // pt) * (h // ps) * (w // ps)

def attention_costs(nt, ns, d):
    full = 2 * (nt * ns) ** 2 * d                              # every token attends to every token
    factorised = 2 * d * (nt * ns * ns + ns * nt * nt)         # within each frame, then along time at each position
    return full, factorised`;

const FRAMES = `def ar1_frames(x0, rho, zs):
    out = [x0]
    for z in zs:
        out.append(rho * out[-1] + (1 - rho * rho) ** 0.5 * z)  # stationary with unit variance if x0 is
    return out

def flicker(frames):
    return sum((b - a) ** 2 for a, b in zip(frames, frames[1:])) / (len(frames) - 1)

def corr(a, b):
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    return cov / (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5`;

export const lesson: LessonContent = {
  id: "l12.4.2",
  minutes: 50,
  links: {
    requires: ["l12.4.1"],
    revisits: ["l12.3.3", "l12.1.3"],
    foreshadows: ["l12.4.3"],
  },

  puzzle: (
    <>
      <p>
        A good image model already knows what a single frame of a cat should look like. Why not make a video by generating
        each frame with it? Try it, and every frame is a fine cat, but a different cat, in a different place, from frame to
        frame. Try it with the same starting noise for every frame, and the cat is frozen. What does a video model know
        that a frame model does not, and how do we afford to give it that knowledge when a few seconds of video hold
        hundreds of images?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A video is one sample from a joint distribution over all its frames. A frame model knows only each frame&apos;s
        marginal, so the relation between frames has to come from somewhere else, and neither fresh nor shared noise
        supplies the right one. The remedy is to denoise all frames together, as one big latent cut into space-time patches,
        so that attention can see the same object in different frames. The price is the token count, which multiplies by
        the number of latent frames, and attention, which multiplies by its square.
      </p>
      <VideoFramesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="video latents and space-time tokens">
        <p>
          A causal video autoencoder compresses T frames of H × W pixels by a factor <M>{"f_t"}</M> in time and{" "}
          <M>{"f_s"}</M> in space, encoding the first frame on its own so that a single image is a valid one-frame video:{" "}
          <M>{"1 + (T - 1)/f_t"}</M> latent frames of size <M>{"(H/f_s) \\times (W/f_s) \\times c"}</M>{" "}
          (<C>video_latent_shape</C>). Cutting the latent into patches of <M>{"p_t \\times p_s \\times p_s"}</M> gives the
          tokens of a diffusion transformer (<C>video_tokens</C>); variable durations, resolutions and aspect ratios simply
          change the token count.
        </p>
        <Code>{TOKENS}</Code>
      </Definition>

      <Theorem title="full against factorised attention">
        <p>
          With <M>{"n_t"}</M> latent frames of <M>{"n_s"}</M> tokens each, full space-time attention costs{" "}
          <M>{"2 (n_t n_s)^2 d"}</M> multiply-adds per layer, while attention within each frame followed by attention along
          time at each position costs <M>{"2 d\\, n_t n_s (n_s + n_t)"}</M> (<C>attention_costs</C>). Factorising saves a factor{" "}
          <M>{"n_t n_s/(n_t + n_s)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Full attention compares each of <M>{"n_t n_s"}</M> tokens with all of them. Spatial attention runs{" "}
          <M>{"n_t"}</M> independent problems of size <M>{"n_s"}</M>, costing <M>{"2 n_t n_s^2 d"}</M>; temporal attention runs{" "}
          <M>{"n_s"}</M> problems of size <M>{"n_t"}</M>, costing <M>{"2 n_s n_t^2 d"}</M>. Divide.
        </p>
      </Proof>

      <Remark title="which to choose">
        <p>
          Factorised attention, used by early video models built on image U-Nets, is far cheaper but needs two layers to
          relate a patch of one frame to a different place in another frame, which is exactly what a moving object requires.
          Several recent large models use full attention over all space-time tokens and pay for it with sequence parallelism
          across many accelerators.
        </p>
      </Remark>

      <Theorem title="a frame model cannot supply the joint law">
        <p>
          Let g be a deterministic sampler, such as the probability flow, that maps noise z to a sample of the frame marginal.
          Generating two frames as <M>{"g(z_1)"}</M> and <M>{"g(z_2)"}</M> with independent <M>{"z_1, z_2"}</M> yields
          independent frames; with <M>{"z_1 = z_2"}</M> it yields identical frames. Neither has the joint law of a video in
          which consecutive frames are dependent but not equal.
        </p>
      </Theorem>
      <Proof>
        <p>
          Functions of independent variables are independent, so the joint law is the product of the marginals, and
          dependent frames do not have that law. If <M>{"z_1 = z_2"}</M>, then <M>{"g(z_1) = g(z_2)"}</M> exactly, a law
          concentrated on the diagonal, which a video with any motion does not have. A stochastic per-frame sampler with shared
          initial noise adds independent noise at every step and gives yet another law, determined by the sampler rather than
          by the data.
        </p>
      </Proof>

      <Example title="the figure">
        <p>
          In the two-frame toy, the object near −1 or +1 moves by about 0.12 between frames. The joint model, denoising the
          pair with the joint score, reproduces this. Fresh noise per frame sends the object to the other side in about half
          the videos; shared noise leaves it almost still, moving only because the two frames&apos; marginals differ slightly.
          Real frame-by-frame methods show both failures: flicker and frozen content.
        </p>
      </Example>

      <Definition title="measuring temporal consistency">
        <p>
          Simple diagnostics compare consecutive frames: the mean squared difference (<C>flicker</C>) and the correlation
          between a frame and the next (<C>corr</C>). For a stationary sequence with unit variance and lag-one correlation ρ,
          such as the autoregressive process <C>ar1_frames</C>, the expected flicker is <M>{"2(1 - \\rho)"}</M>: too low means
          frozen, too high means flicker, and the right value depends on how much the content moves.
        </p>
        <Code>{FRAMES}</Code>
      </Definition>

      <Remark title="how video models are trained">
        <p>
          Training mixes images, as one-frame videos, with videos at increasing resolutions and durations, because video data
          are scarcer and costlier to process. Many more tokens mean a larger effective signal-to-noise ratio, so schedules
          are shifted further towards noise, as in l12.3.3. Longer videos are made by conditioning on the latents of frames
          already generated, which makes the model partly autoregressive in time.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tok",
      rung: "check",
      prompt: (
        <p>
          A 49-frame 512 × 512 clip is encoded with <M>{"f_t = 4"}</M>, <M>{"f_s = 8"}</M> (first frame alone) and cut into
          patches with <M>{"p_t = 1"}</M>, <M>{"p_s = 2"}</M>. How many tokens result?
        </p>
      ),
      answer: { kind: "numeric", value: 13312, tolerance: 0 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>For that clip, by what factor is factorised attention cheaper than full attention?</p>,
      answer: { kind: "numeric", value: 12.837, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does generating each frame with an excellent image model and fresh noise give poor videos?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each frame has the right marginal law, but independent noise makes the frames independent, so nothing ties them together",
          "Image models cannot generate the right resolution for video",
          "The frames all come out identical",
          "Fresh noise makes each frame blurry",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def video_latent_shape(T, H, W, ft, fs, c):
    return 1 + (T - 1) // ft, H // fs, W // fs, c             # the first frame is encoded on its own

def video_tokens(shape, pt, ps):
    t, h, w, _ = shape
    return (t // pt) * (h // ps) * (w // ps)

def attention_costs(nt, ns, d):
    full = 2 * (nt * ns) ** 2 * d                              # every token attends to every token
    factorised = 2 * d * (nt * ns * ns + ns * nt * nt)         # within each frame, then along time at each position
    return full, factorised

s = video_latent_shape(121, 480, 848, 4, 8, 16); n = video_tokens(s, 1, 2)
print(s, n, attention_costs(4, 9, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(31, 60, 106, 16) 49290 (2592, 936)",
          "(30, 60, 106, 16) 47700 (2592, 936)",
          "(31, 60, 106, 16) 49290 (2592, 1296)",
          "(31, 60, 106, 16) 197160 (2592, 936)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ar1_frames(x0, rho, zs):
    out = [x0]
    for z in zs:
        out.append(rho * out[-1] + (1 - rho * rho) ** 0.5 * z)  # stationary with unit variance if x0 is
    return out

def flicker(frames):
    return sum((b - a) ** 2 for a, b in zip(frames, frames[1:])) / (len(frames) - 1)

def corr(a, b):
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    cov = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    return cov / (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5

f = ar1_frames(1.0, 0.5, [0.0, 2.0])
print([round(v, 4) for v in f], round(flicker(f), 4), round(corr([1.0, 2.0, 3.0], [2.0, 4.0, 7.0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.5, 1.9821] 1.2232 0.9934",
          "[1.0, 0.5, 2.25] 1.4063 0.9934",
          "[1.0, 0.5, 1.9821] 2.4464 0.9934",
          "[1.0, 0.5, 1.9821] 1.2232 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>video_latent_shape(T, H, W, ft, fs, c)</C> with the first frame encoded alone,{" "}
          <C>video_tokens(shape, pt, ps)</C>, and <C>attention_costs(nt, ns, d)</C> returning full and factorised costs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def video_latent_shape(T, H, W, ft, fs, c):
    return T // ft, H // fs, W // fs, c

def video_tokens(shape, pt, ps):
    t, h, w, _ = shape
    return t * h * w

def attention_costs(nt, ns, d):
    return nt * ns * d, nt * ns * d
`,
        solution: TOKENS,
        tests: [
          { name: "shape", code: `s = video_latent_shape(17, 256, 128, 4, 16, 8)\nassert tuple(s) == (5, 16, 8, 8) and video_tokens(s, 1, 2) == 160` },
          { name: "attn", code: `assert tuple(attention_costs(2, 3, 5)) == (360, 300) and tuple(attention_costs(1, 4, 2)) == (64, 80)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ar1_frames(x0, rho, zs)</C>, <C>flicker(frames)</C>, the mean squared difference of consecutive frames, and{" "}
          <C>corr(a, b)</C>, the Pearson correlation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ar1_frames(x0, rho, zs):
    return [x0] + list(zs)

def flicker(frames):
    return 0.0

def corr(a, b):
    return 1.0
`,
        solution: FRAMES,
        tests: [
          { name: "ar", code: `f = ar1_frames(2.0, 0.6, [1.0, -1.0])\nassert abs(f[1] - 2.0) < 1e-12 and abs(f[2] - 0.4) < 1e-12 and len(f) == 3\nassert abs(flicker([0.0, 1.0, 3.0]) - 2.5) < 1e-12` },
          { name: "corr", code: `assert abs(corr([1.0, 2.0, 3.0], [3.0, 2.0, 1.0]) + 1) < 1e-12 and abs(corr([1.0, 2.0, 3.0, 4.0], [1.0, 3.0, 2.0, 4.0]) - 0.8) < 1e-12` },
        ],
      },
    },
    {
      key: "flick",
      rung: "stretch",
      prompt: (
        <p>
          Frames follow a stationary process with unit variance and lag-one correlation 0.95. What is the expected squared
          difference between consecutive frames?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Images, video and soon audio all reduce to the same recipe: a learned latent, a transformer over patches, a flow or
        diffusion objective. That uniformity makes it possible to ask how quality scales with compute and data, as for
        language models, the subject of the last lesson of this chapter.
      </p>
    </>
  ),
};
