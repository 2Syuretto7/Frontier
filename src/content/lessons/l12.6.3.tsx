import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LengthRegulatorViz } from "@/components/viz/LengthRegulatorViz";
import type { LessonContent } from "@/lib/types";

const DUR = `def length_regulate(h, durs):
    return [v for v, d in zip(h, durs) for _ in range(d)]  # copy each phoneme's vector d times

def scale_durations(durs, rate):
    return [max(1, round(d / rate)) for d in durs]

def mas(logp):
    L, T = len(logp), len(logp[0])
    NEG = float("-inf")
    Q = [[NEG] * T for _ in range(L)]
    Q[0][0] = logp[0][0]
    for j in range(1, T):
        for i in range(min(j + 1, L)):
            Q[i][j] = logp[i][j] + max(Q[i][j - 1], Q[i - 1][j - 1] if i else NEG)   # stay or advance
    path, i = [], L - 1
    for j in range(T - 1, -1, -1):
        path.append(i)
        if j and i and Q[i - 1][j - 1] >= Q[i][j - 1]:
            i -= 1
    return path[::-1]`;

const CODECLM = `import math

def valle_steps(n_frames, n_q):
    return n_frames + n_q - 1                                # first codebook token by token, the rest one pass each

def cosine(u, v):
    return sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))

def rtf(compute_s, audio_s):
    return compute_s / audio_s                               # below one is faster than real time`;

export const lesson: LessonContent = {
  id: "l12.6.3",
  minutes: 50,
  links: {
    requires: ["l12.6.1", "l12.6.2"],
    revisits: ["l12.2.1", "l12.3.2"],
    foreshadows: ["l12.7.1"],
  },

  puzzle: (
    <>
      <p>
        The sentence &quot;I never said she stole it&quot; has seven meanings depending on which word is stressed, and can
        be spoken fast or slow, by a child or a grandmother. A transcript fixes none of this. A speech synthesiser must
        decide how long each sound lasts, how the pitch moves and whose voice it is, and it is trained on recordings that
        pair text with only one of the many possible readings. How do models learn to fill in what the text leaves out, and
        how can a few seconds of someone&apos;s voice be enough to imitate them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The text is much shorter than the speech, so something must stretch it. One approach predicts a duration for each
        sound and copies its representation that many frames, which also gives direct control over speed. Another treats
        speech as codec tokens and lets a language model continue a short recording of a speaker with new words, carrying
        the voice along as context.
      </p>
      <LengthRegulatorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the classical pipeline">
        <p>
          Text is normalised (&quot;Dr.&quot; to &quot;doctor&quot;, &quot;1990&quot; to words) and often converted to
          phonemes. An acoustic model maps phonemes to a mel spectrogram, and a vocoder maps the spectrogram to a waveform.
          Tacotron 2 used an attention-based sequence-to-sequence acoustic model, which occasionally skipped or repeated
          words when the attention lost its place; neural vocoders such as HiFi-GAN, trained adversarially, generate the
          waveform much faster than real time.
        </p>
      </Definition>

      <Definition title="non-autoregressive synthesis with durations">
        <p>
          FastSpeech encodes the phonemes, predicts an integer duration in frames for each, and repeats each phoneme&apos;s
          hidden vector that many times (<C>length_regulate</C>), giving a sequence of the speech&apos;s length that a decoder
          turns into the spectrogram in parallel. Alignment errors become impossible, since every phoneme gets at least one
          frame, and dividing the durations by a rate changes the speed (<C>scale_durations</C>). The duration targets come
          from an alignment of text to frames, which must itself be learned.
        </p>
      </Definition>

      <Theorem title="monotonic alignment search">
        <p>
          Let <M>{"\\ell_{ij}"}</M> be the log-likelihood of frame j under phoneme i, for L phonemes and T frames. Among
          alignments that assign frames to phonemes in order, each phoneme at least one frame, the one maximising{" "}
          <M>{"\\sum_j \\ell_{a(j), j}"}</M> is found in O(LT) time by
          <MD>{"Q_{i,j} = \\ell_{ij} + \\max(Q_{i,j-1},\\ Q_{i-1,j-1})"}</MD>
          and backtracking from <M>{"Q_{L-1,T-1}"}</M> (<C>mas</C>), out of <M>{"\\binom{T-1}{L-1}"}</M> alignments in all.
        </p>
      </Theorem>
      <Proof>
        <p>
          A monotonic alignment that ends with frame j on phoneme i had frame j − 1 on phoneme i or i − 1, since phonemes
          are visited in order without skipping. The best score of such an alignment is <M>{"\\ell_{ij}"}</M> plus the
          better of the best scores ending at those two states, which is the recursion; recording which was chosen
          recovers the alignment. An alignment is fixed by the L − 1 frames at which the phoneme advances, chosen from the
          T − 1 gaps between frames, which gives the count. Glow-TTS and VITS alternate this search with training, so
          durations are learned without an external aligner.
        </p>
        <Code>{DUR}</Code>
      </Proof>

      <Definition title="codec language models">
        <p>
          VALL-E treats synthesis as continuation. The input is the phonemes of the target text, a three-second recording
          of the speaker as codec tokens, and the start of the output; an autoregressive transformer generates the first
          codebook frame by frame, and a non-autoregressive one fills in each remaining codebook in one pass, conditioned on
          the coarser ones (<C>valle_steps</C>). Trained on 60,000 hours of speech, it imitates an unseen speaker&apos;s
          voice, and even the acoustic environment, from the prompt alone. Sampling gives varied prosody, but
          autoregression can also loop or skip words, as attention-based models did.
        </p>
        <Code>{CODECLM}</Code>
      </Definition>

      <Example title="flow matching for speech">
        <p>
          Voicebox trains a flow-matching model to fill in masked stretches of a mel spectrogram given the full transcript
          and the unmasked audio. Synthesis in a new voice is infilling after a prompt, and editing a word in a recording is
          infilling in the middle. F5-TTS removes the explicit duration model: the text is padded with filler tokens to the
          target length and the network learns the alignment itself, with classifier-free guidance on the text to sharpen
          pronunciation.
        </p>
      </Example>

      <Remark title="evaluation and misuse">
        <p>
          Synthesis is judged by listeners&apos; mean opinion scores, by the word error rate of a recogniser on the output
          for intelligibility, by the cosine similarity of speaker embeddings between the output and the prompt for voice
          similarity (<C>cosine</C>), and by the real-time factor, compute time over audio length (<C>rtf</C>). Imitating a
          voice from seconds of audio enables fraud and impersonation; several systems were not released openly for this
          reason, and inaudible watermarks and classifiers that detect synthetic speech are active areas of work.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "frames",
      rung: "check",
      prompt: (
        <p>
          Five phonemes have predicted durations 3, 7, 4, 10 and 6 frames. At speaking rate 1.5, with each duration divided by
          the rate and rounded to the nearest frame, how many frames does the utterance last?
        </p>
      ),
      answer: { kind: "numeric", value: 21, tolerance: 0 },
    },
    {
      key: "passes",
      rung: "check",
      prompt: (
        <p>
          A codec runs at 75 frames per second with eight codebooks. A VALL-E-style model generates 4 seconds of speech: the
          first codebook one frame per step, then one pass per remaining codebook. How many forward passes is that?
        </p>
      ),
      answer: { kind: "numeric", value: 307, tolerance: 0 },
    },
    {
      key: "prompt",
      rung: "apply",
      prompt: <p>How does a codec language model imitate a speaker it never saw in training?</p>,
      answer: {
        kind: "choice",
        options: [
          "It continues a short recording of the speaker given as codec tokens, so the voice is carried as context",
          "It is fine-tuned on the speaker for a few steps before synthesis",
          "It looks the speaker up in a table of embeddings learned in training",
          "It converts the prompt to phonemes and copies their durations",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def length_regulate(h, durs):
    return [v for v, d in zip(h, durs) for _ in range(d)]  # copy each phoneme's vector d times

def scale_durations(durs, rate):
    return [max(1, round(d / rate)) for d in durs]

def mas(logp):
    L, T = len(logp), len(logp[0])
    NEG = float("-inf")
    Q = [[NEG] * T for _ in range(L)]
    Q[0][0] = logp[0][0]
    for j in range(1, T):
        for i in range(min(j + 1, L)):
            Q[i][j] = logp[i][j] + max(Q[i][j - 1], Q[i - 1][j - 1] if i else NEG)   # stay or advance
    path, i = [], L - 1
    for j in range(T - 1, -1, -1):
        path.append(i)
        if j and i and Q[i - 1][j - 1] >= Q[i][j - 1]:
            i -= 1
    return path[::-1]

h = length_regulate(["a", "b", "c"], [2, 1, 3])
print(h, scale_durations([4, 6, 1], 2.0), mas([[0.0, -1.0, -5.0], [-3.0, -0.5, -0.2]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['a', 'a', 'b', 'c', 'c', 'c'] [2, 3, 1] [0, 1, 1]",
          "['a', 'a', 'b', 'c', 'c', 'c'] [2, 3, 0] [0, 1, 1]",
          "['a', 'a', 'b', 'c', 'c', 'c'] [2, 3, 1] [0, 0, 1]",
          "['a', 'b', 'c'] [2, 3, 1] [0, 1, 1]",
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

def valle_steps(n_frames, n_q):
    return n_frames + n_q - 1                                # first codebook token by token, the rest one pass each

def cosine(u, v):
    return sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))

def rtf(compute_s, audio_s):
    return compute_s / audio_s                               # below one is faster than real time

print(valle_steps(225, 8), round(cosine([1, 2, 2], [2, 1, 2]), 4))
print(rtf(0.5, 2.0), rtf(3.0, 2.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "232 0.8889\n0.25 1.5",
          "1800 0.8889\n0.25 1.5",
          "232 0.6667\n0.25 1.5",
          "232 0.8889\n4.0 0.6667",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>length_regulate(h, durs)</C>, <C>scale_durations(durs, rate)</C> rounding and keeping at least one frame,
          and <C>mas(logp)</C>, returning for each frame the phoneme index of the best monotonic alignment, where{" "}
          <C>logp[i][j]</C> scores frame j under phoneme i.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def length_regulate(h, durs):
    return h

def scale_durations(durs, rate):
    return durs

def mas(logp):
    return [0] * len(logp[0])
`,
        solution: DUR,
        tests: [
          { name: "reg", code: `assert length_regulate([7, 8], [0, 2]) == [8, 8] and scale_durations([3, 1], 0.5) == [6, 2]` },
          { name: "mas", code: `assert mas([[0, -2, -2, -9], [-9, 0, -1, -9], [-9, -9, 0, 0]]) == [0, 1, 2, 2] and mas([[-1, -1], [0, 0]]) == [0, 1]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>valle_steps(n_frames, n_q)</C>, <C>cosine(u, v)</C> for speaker similarity, and{" "}
          <C>rtf(compute_s, audio_s)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def valle_steps(n_frames, n_q):
    return n_frames * n_q

def cosine(u, v):
    return sum(a * b for a, b in zip(u, v))

def rtf(compute_s, audio_s):
    return compute_s * audio_s
`,
        solution: CODECLM,
        tests: [
          { name: "steps", code: `assert valle_steps(100, 4) == 103 and abs(cosine([3, 4], [4, 3]) - 0.96) < 1e-12` },
          { name: "rtf", code: `assert rtf(1.0, 4.0) == 0.25` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          How many monotonic alignments of 5 phonemes to 12 frames are there, with every phoneme given at least one frame?
        </p>
      ),
      answer: { kind: "numeric", value: 330, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Speech synthesis has moved between autoregressive token models and parallel denoising models, as images did. The
        last lesson asks whether text itself, the home ground of next-token prediction, can be generated by denoising
        instead.
      </p>
    </>
  ),
};
