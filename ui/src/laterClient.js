// Streams the Later agent team from Cloud Run (ADK /run_sse).
const BASE = (import.meta.env.VITE_LATER_API || "https://later-puxir3jrda-uc.a.run.app").replace(/\/+$/, "");
const APP = "later";

function parseEvent(raw) {
  const author = raw.author || "agent";
  const parts = raw.content?.parts || [];
  const text = parts.map((p) => p?.text || "").join("").trim();
  const usage = raw.usageMetadata || raw.usage_metadata || {};
  const tokens = usage.totalTokenCount || usage.total_token_count ||
    ((usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0));
  return { author, text, tokens: tokens || 0 };
}

export async function runLater(message, { onEvent, signal } = {}) {
  const userId = "web";
  const sessionId = "s-" + Date.now().toString(36);
  await fetch(`${BASE}/apps/${APP}/users/${userId}/sessions/${sessionId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal,
  });
  const res = await fetch(`${BASE}/run_sse`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({
      app_name: APP, user_id: userId, session_id: sessionId,
      new_message: { role: "user", parts: [{ text: message }] }, streaming: false,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Later API error ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop() || "";
    for (const c of chunks) {
      const line = c.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const json = line.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try { onEvent?.(parseEvent(JSON.parse(json))); } catch { /* partial */ }
    }
  }
}

// Pull the composer's JSON dashboard out of a ```json fenced block (or raw).
export function extractDashboard(text) {
  if (!text) return null;
  let s = text;
  const m = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (m) s = m[1];
  else {
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    if (a >= 0 && b > a) s = text.slice(a, b + 1);
  }
  try { return JSON.parse(s); } catch { return null; }
}
