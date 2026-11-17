import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { PARTON_MODEL, PartonError, partonConnected, structured } from "@/lib/parton/claude";
import { POSTINGS_MAX } from "./core";
import {
  BOARDS,
  PICK_SCHEMA,
  PICK_SYSTEM,
  SEARCH_SCHEMA,
  SEARCH_SYSTEM,
  acceptPicks,
  acceptSearch,
  boardUrl,
  candidates,
  parseBoard,
  pickRequest,
  searchRequest,
  type Board,
  type Opening,
  type PickOutput,
  type SearchOutput,
} from "./sourcing";

/** How many postings to gather: enough for a true picture, within what the scorecard holds. */
export const WANT = 16;
const PER_LAB_SEARCH = 3;

async function readBoard(board: Board): Promise<Opening[]> {
  const response = await fetch(boardUrl(board), {
    headers: { Accept: "application/json", "User-Agent": "Frontier readiness scorecard" },
    signal: AbortSignal.timeout(25_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${board.lab}: ${response.status}`);
  return parseBoard(board, await response.json());
}

let client: Anthropic | null = null;

/**
 * Parton searches the web for one lab's postings. Web search and web fetch run on Anthropic's servers; a long
 * search can pause, and is resumed a few times. Returns no postings rather than failing the whole run.
 */
async function searchLab(board: Board, role: string): Promise<Opening[]> {
  client ??= new Anthropic({ maxRetries: 2, timeout: 200_000 });
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: searchRequest(board, role, PER_LAB_SEARCH) }];
  try {
    for (let round = 0; round < 4; round++) {
      const stream = client.beta.messages.stream({
        model: PARTON_MODEL,
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort: "medium", format: { type: "json_schema", schema: SEARCH_SCHEMA } },
        system: SEARCH_SYSTEM,
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 6 },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 8 },
        ],
        messages,
      });
      const message = await stream.finalMessage();
      if (message.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: message.content });
        continue;
      }
      if (message.stop_reason !== "end_turn") return [];
      const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      return acceptSearch(JSON.parse(text) as SearchOutput, board, PER_LAB_SEARCH);
    }
  } catch (error) {
    console.error(`Readiness: web search for ${board.lab} failed:`, error);
  }
  return [];
}

export type FoundPostings = { openings: Opening[]; labs: { lab: string; count: number; via: "board" | "web" | "none" }[] };

/**
 * Finds current postings for the target role at every lab in BOARDS: read from each lab's public job board,
 * or found on the web where the board can't be read, then narrowed by Parton to the best matches.
 */
export async function findPostings(role: string): Promise<FoundPostings> {
  if (!partonConnected()) throw new PartonError("Parton is not connected yet.");
  const read = await Promise.all(
    BOARDS.map(async (board) => {
      try {
        return { board, openings: candidates(await readBoard(board)) };
      } catch (error) {
        console.error("Readiness: job board unreadable:", error);
        return { board, openings: null };
      }
    }),
  );

  const fromBoards = read.flatMap((r) => r.openings ?? []);
  const unreadable = read.filter((r) => r.openings === null).map((r) => r.board);

  const [picked, searched] = await Promise.all([
    fromBoards.length
      ? structured<PickOutput>({
          system: PICK_SYSTEM,
          messages: [{ role: "user", content: pickRequest(role, fromBoards, WANT) }],
          schema: PICK_SCHEMA,
          effort: "medium",
        }).then((out) => acceptPicks(out, fromBoards, WANT))
      : Promise.resolve([] as Opening[]),
    Promise.all(unreadable.map((board) => searchLab(board, role))),
  ]);

  const openings = [...picked, ...searched.flat()].slice(0, POSTINGS_MAX);
  const labs = BOARDS.map((b) => {
    const count = openings.filter((o) => o.lab === b.lab).length;
    const via = unreadable.includes(b) ? (count ? "web" : "none") : count ? "board" : "none";
    return { lab: b.lab, count, via } as const;
  });
  return { openings, labs };
}
