import "server-only";

/**
 * The few GitHub calls Frontier makes, with the learner's own token (GITHUB_TOKEN). A fine-grained personal access
 * token with access to all repositories, and read and write permission for Administration and Contents, is enough.
 */

const API = "https://api.github.com";

export const githubConnected = () => Boolean(process.env.GITHUB_TOKEN);

export class GitHubError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
    this.name = "GitHubError";
  }
}

async function gh<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Frontier",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token && init.auth !== false) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new GitHubError("Couldn't reach GitHub. Try again in a minute.");
  }
  if (res.ok) return (res.status === 204 ? null : await res.json()) as T;
  const detail = await res.json().catch(() => null) as { message?: string; errors?: { message?: string }[] } | null;
  const said = [detail?.message, ...(detail?.errors ?? []).map((e) => e.message)].filter(Boolean).join(": ");
  if (res.status === 401) throw new GitHubError("GitHub rejected the token. Check GITHUB_TOKEN in Vercel.", 401);
  if (res.status === 403) throw new GitHubError(`GitHub refused: ${said || "the token lacks a permission"}. The token needs read and write access to Administration and Contents.`, 403);
  throw new GitHubError(said ? `GitHub said: ${said}` : `GitHub answered ${res.status}.`, res.status);
}

export async function viewer(): Promise<string> {
  const me = await gh<{ login: string }>("/user");
  return me.login;
}

/** Creates a public repository under the token's account. Returns its web address and owner/name. */
export async function createPublicRepo(name: string, description: string): Promise<{ url: string; owner: string; name: string }> {
  try {
    const repo = await gh<{ html_url: string; name: string; owner: { login: string } }>("/user/repos", {
      method: "POST",
      body: { name, description, private: false, has_issues: true, has_wiki: false, auto_init: false },
    });
    return { url: repo.html_url, owner: repo.owner.login, name: repo.name };
  } catch (error) {
    if (error instanceof GitHubError && error.status === 422 && /already exists/i.test(error.message)) {
      throw new GitHubError(`You already have a repository called ${name}. Choose another name.`, 422);
    }
    throw error;
  }
}

/** Writes one file, creating it or replacing what is there. */
export async function putFile(owner: string, repo: string, path: string, content: string, message: string): Promise<void> {
  const where = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  let sha: string | undefined;
  try {
    sha = (await gh<{ sha: string }>(where)).sha;
  } catch (error) {
    if (!(error instanceof GitHubError && error.status === 404)) throw error;
  }
  await gh(where, { method: "PUT", body: { message, content: Buffer.from(content, "utf8").toString("base64"), ...(sha ? { sha } : {}) } });
}

/** The names at the top level of a public repository. Works without a token. */
export async function topLevelFiles(owner: string, repo: string): Promise<string[]> {
  try {
    const items = await gh<{ name: string }[]>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/`);
    return Array.isArray(items) ? items.map((i) => i.name) : [];
  } catch (error) {
    // An empty repository has no contents yet.
    if (error instanceof GitHubError && (error.status === 404 || error.status === 409)) return [];
    throw error;
  }
}

/** The README's text, or null if there is none. */
export async function readme(owner: string, repo: string): Promise<string | null> {
  try {
    const file = await gh<{ content: string; encoding: string }>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`);
    return file.encoding === "base64" ? Buffer.from(file.content, "base64").toString("utf8") : file.content;
  } catch (error) {
    if (error instanceof GitHubError && (error.status === 404 || error.status === 409)) return null;
    throw error;
  }
}
