import "server-only";
import { assertPublicHost, normalizeUrl } from "./net";

export type LlmProvider = "openai" | "anthropic" | "custom" | "reference";

export interface LlmTarget {
  provider: LlmProvider;
  /** Base URL for OpenAI-compatible APIs (e.g. https://api.openai.com/v1) or full URL for custom */
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  /** Customer's production system prompt (optional) — canaries are appended to it */
  systemPrompt?: string;
  /** custom provider: JSON body template containing {{prompt}} and JSON path to the reply */
  bodyTemplate?: string;
  responsePath?: string;
  headerName?: string;
}

export interface ChatMessage { role: "system" | "user" | "assistant"; content: string }
export interface ToolDef { name: string; description: string; parameters: Record<string, unknown> }
export interface ChatResult { text: string; toolCalls: { name: string; arguments: string }[]; latencyMs: number; outputTokens?: number }

export const REFERENCE_MODEL = "llama-3.1-8b-instant";

/** Resolve the effective target (the reference sandbox uses the platform's Groq key). */
export function resolveTarget(t: LlmTarget): LlmTarget {
  if (t.provider === "reference") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("The reference sandbox model is not configured (GROQ_API_KEY missing)");
    return { provider: "openai", baseUrl: "https://api.groq.com/openai/v1", apiKey: key, model: REFERENCE_MODEL, systemPrompt: t.systemPrompt };
  }
  return t;
}

export const supportsSystemPrompt = (t: LlmTarget) => t.provider !== "custom";
export const supportsTools = (t: LlmTarget) => t.provider === "openai" || t.provider === "anthropic" || t.provider === "reference";

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc == null ? acc : (acc as Record<string, unknown>)[k]), obj);
}

export async function chat(
  target: LlmTarget,
  messages: ChatMessage[],
  opts: { tools?: ToolDef[]; timeoutMs?: number; maxTokens?: number } = {},
): Promise<ChatResult> {
  const t0 = performance.now();
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 12000);
  const maxTokens = opts.maxTokens ?? 350;

  if (target.provider === "openai") {
    const base = normalizeUrl(target.baseUrl || "https://api.openai.com/v1");
    await assertPublicHost(base.hostname);
    const res = await fetch(base.toString().replace(/\/$/, "") + "/chat/completions", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${target.apiKey ?? ""}` },
      body: JSON.stringify({
        model: target.model,
        messages,
        max_tokens: maxTokens,
        temperature: 0,
        ...(opts.tools?.length ? { tools: opts.tools.map((f) => ({ type: "function", function: f })), tool_choice: "auto" } : {}),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const msg = data.choices?.[0]?.message ?? {};
    return {
      text: String(msg.content ?? ""),
      toolCalls: (msg.tool_calls ?? []).map((c: { function: { name: string; arguments: string } }) => ({ name: c.function?.name, arguments: c.function?.arguments })),
      latencyMs: Math.round(performance.now() - t0),
      outputTokens: data.usage?.completion_tokens,
    };
  }

  if (target.provider === "anthropic") {
    const base = normalizeUrl(target.baseUrl || "https://api.anthropic.com");
    await assertPublicHost(base.hostname);
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const res = await fetch(base.origin + "/v1/messages", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-api-key": target.apiKey ?? "", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: target.model,
        max_tokens: maxTokens,
        temperature: 0,
        ...(system ? { system } : {}),
        messages: messages.filter((m) => m.role !== "system"),
        ...(opts.tools?.length ? { tools: opts.tools.map((f) => ({ name: f.name, description: f.description, input_schema: f.parameters })) } : {}),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const blocks: { type: string; text?: string; name?: string; input?: unknown }[] = data.content ?? [];
    return {
      text: blocks.filter((b) => b.type === "text").map((b) => b.text).join(""),
      toolCalls: blocks.filter((b) => b.type === "tool_use").map((b) => ({ name: b.name!, arguments: JSON.stringify(b.input) })),
      latencyMs: Math.round(performance.now() - t0),
      outputTokens: data.usage?.output_tokens,
    };
  }

  // custom HTTP endpoint: single-turn prompt only
  const url = normalizeUrl(target.baseUrl || "");
  await assertPublicHost(url.hostname);
  const prompt = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n\n");
  const tpl = target.bodyTemplate || '{"message": "{{prompt}}"}';
  const body = tpl.replace(/\{\{prompt\}\}/g, JSON.stringify(prompt).slice(1, -1));
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (target.apiKey) headers[target.headerName || "authorization"] = target.headerName ? target.apiKey : `Bearer ${target.apiKey}`;
  const res = await fetch(url, { method: "POST", signal, headers, body });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const ct = res.headers.get("content-type") ?? "";
  let text: string;
  if (ct.includes("json")) {
    const data = await res.json();
    const v = getPath(data, target.responsePath || "reply");
    text = typeof v === "string" ? v : JSON.stringify(v ?? data);
  } else text = await res.text();
  return { text, toolCalls: [], latencyMs: Math.round(performance.now() - t0) };
}
