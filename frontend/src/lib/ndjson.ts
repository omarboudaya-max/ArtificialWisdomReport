/** Server: build a streaming NDJSON response from an async producer. */
export function ndjsonStream(run: (emit: (obj: unknown) => void) => Promise<void>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) => {
        try { controller.enqueue(enc.encode(JSON.stringify(obj) + "\n")); } catch { /* closed */ }
      };
      try {
        await run(emit);
      } catch (e) {
        emit({ type: "error", message: (e as Error).message || "Unexpected error" });
      } finally {
        try { controller.close(); } catch { /* closed */ }
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}

/** Client: read NDJSON events from a fetch response. */
export async function readNdjson<T>(res: Response, onEvent: (e: T) => void) {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) onEvent(JSON.parse(line) as T);
    }
  }
  if (buf.trim()) onEvent(JSON.parse(buf) as T);
}
