export type SafeFetchResult<T> =
  | { ok: true; value: T; fetchedAt: string; status: number }
  | { ok: false; error: string; fetchedAt: string; status: number | null; detail?: string };

function pickErrorMessageFromJson(input: unknown): string | null {
  // PSI (and many APIs) return: { error: { message: "...", ... } }
  if (!input || typeof input !== "object") return null;
  const top = input as Record<string, unknown>;
  const err = top["error"];
  if (!err || typeof err !== "object") return null;
  const msg = (err as Record<string, unknown>)["message"];
  return typeof msg === "string" && msg.trim() ? msg.trim() : null;
}

async function readResponseDetail(res: Response): Promise<{ msg: string | null; detail: string | null }> {
  try {
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    const snippet = text.trim().slice(0, 2000);
    if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(text) as unknown;
        const msg = pickErrorMessageFromJson(parsed);
        return { msg, detail: snippet || null };
      } catch {
        // Fall through to returning a text snippet.
      }
    }
    return { msg: null, detail: snippet || null };
  } catch {
    return { msg: null, detail: null };
  }
}

export async function safeJsonFetch<T>(
  url: string,
  opts?: {
    timeoutMs?: number;
    headers?: Record<string, string>;
  },
): Promise<SafeFetchResult<T>> {
  const fetchedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? 5000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: opts?.headers,
      // Never send cookies/credentials to third parties from server routes.
      credentials: "omit",
      cache: "no-store",
    });
    if (!res.ok) {
      const { msg, detail } = await readResponseDetail(res);
      const suffix = msg ? `: ${msg}` : "";
      return { ok: false, error: `HTTP ${res.status}${suffix}`, fetchedAt, status: res.status, detail: detail ?? undefined };
    }
    const json = (await res.json()) as T;
    return { ok: true, value: json, fetchedAt, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, fetchedAt, status: null };
  } finally {
    clearTimeout(t);
  }
}
