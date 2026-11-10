import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const PARTON_MODEL = "claude-opus-5-5";

type Effort = "low" | "medium" | "high";

/** A failure with a message that is safe and useful to show the learner. */
export class PartonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartonError";
  }
}

export const partonConnected = () => Boolean(process.env.ANTHROPIC_API_KEY);

let client: Anthropic | null = null;

/**
 * One call to Claude that returns JSON matching `schema`.
 * - Adaptive thinking (always on for this model), with the effort set per task.
 * - Streamed, so long thinking never hits a request timeout; we only need the final message.
 * - Server-side refusal fallback: if the model declines, the API retries on Anthropic's
 *   recommended fallback model inside the same call.
 * - The system prompt is cached, so follow-up questions in a lesson are cheaper and faster.
 */
export async function structured<T>({
  system,
  messages,
  schema,
  effort,
  maxTokens = 16000,
}: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: Record<string, unknown>;
  effort: Effort;
  maxTokens?: number;
}): Promise<T> {
  if (!partonConnected()) throw new PartonError("Parton is not connected yet.");
  client ??= new Anthropic({ maxRetries: 2, timeout: 110_000 });
  let message: Anthropic.Beta.BetaMessage;
  try {
    const stream = client.beta.messages.stream({
      model: PARTON_MODEL,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort, format: { type: "json_schema", schema } },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
    });
    message = await stream.finalMessage();
  } catch (error) {
    throw new PartonError(describeError(error));
  }

  if (message.stop_reason === "refusal") {
    throw new PartonError("Parton can't help with that request. Try asking about the lesson in another way.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new PartonError("Parton's reply ran too long and was cut off. Please ask again.");
  }
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PartonError("Parton's reply came back garbled. Please ask again.");
  }
}

function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return "Parton's API key was rejected. Check ANTHROPIC_API_KEY in Vercel.";
  }
  if (error instanceof Anthropic.RateLimitError) return "Parton is getting too many questions at once. Try again in a minute.";
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "Parton took too long to answer. Please try again.";
  if (error instanceof Anthropic.APIConnectionError) return "Parton couldn't be reached. Check your connection and try again.";
  if (error instanceof Anthropic.BadRequestError) {
    console.error("Parton bad request:", error.message);
    return "Parton couldn't process that. Please try again, and if it keeps happening, tell Claude in the project.";
  }
  if (error instanceof Anthropic.InternalServerError || (error instanceof Anthropic.APIError && error.status === 529)) {
    return "Parton's service is busy right now. Try again in a minute.";
  }
  if (error instanceof Anthropic.APIError) {
    console.error("Parton API error:", error.status, error.message);
    return "Parton ran into a problem. Please try again.";
  }
  console.error("Parton error:", error);
  return "Parton ran into a problem. Please try again.";
}
