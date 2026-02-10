import { spawn } from "node:child_process";

const port = Number(process.env.SMOKE_PORT ?? "3002");
const baseUrl = `http://localhost:${port}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function startDevServer() {
  const child = spawn("npm", ["run", "dev", "--", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  return child;
}

async function waitForReady(child, timeoutMs) {
  const startedAt = Date.now();
  let buf = "";

  const onData = (d) => {
    buf += d.toString("utf8");
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  try {
    while (Date.now() - startedAt < timeoutMs) {
      if (buf.includes("Ready in") || buf.includes("Ready on") || buf.includes(baseUrl)) return;
      if (child.exitCode != null) throw new Error(`dev server exited early (${child.exitCode})`);
      await sleep(50);
    }
    throw new Error("timed out waiting for dev server to become ready");
  } finally {
    child.stdout.off("data", onData);
    child.stderr.off("data", onData);
  }
}

async function main() {
  const child = startDevServer();
  try {
    await waitForReady(child, 20_000);

    const qs = new URLSearchParams({ url: "https://example.com", strategy: "both" });
    const res = await fetch(`${baseUrl}/api/pageload?${qs.toString()}`, { cache: "no-store" });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`expected JSON, got: ${text.slice(0, 200)}`);
    }

    const obj = json && typeof json === "object" ? json : null;
    const isRateLimitPayload =
      obj && typeof obj.error === "string" && typeof obj.retryAfterSec === "number";
    const isFullPayload =
      obj &&
      typeof obj.url === "string" &&
      "mobile" in obj &&
      "desktop" in obj;
    if (!isRateLimitPayload && !isFullPayload) {
      throw new Error("unexpected response shape from /api/pageload");
    }

    // We accept 200 (key configured, happy path) or 429/502 (no key / quota / upstream).
    if (![200, 429, 502].includes(res.status)) {
      throw new Error(`unexpected HTTP status: ${res.status}`);
    }

    process.stdout.write(`smoke ok: HTTP ${res.status}\n`);
  } finally {
    child.kill("SIGTERM");
  }
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack : String(e)}\n`);
  process.exitCode = 1;
});
