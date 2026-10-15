// Server-only helper: calls Lovable AI Gateway (Responses API), streaming, and returns final text.
const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function runAI(opts: {
  instructions: string;
  input: string | ChatTurn[];
  schema?: { name: string; schema: Record<string, unknown> };
}): Promise<string> {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error("AI is not configured yet. Please set up the AI connection in project settings.");

  const body: Record<string, unknown> = {
    model: MODEL,
    instructions: opts.instructions,
    input: opts.input,
    stream: true,
    store: false,
    reasoning: { effort: "low", summary: "auto" },
    include: ["reasoning.encrypted_content"],
  };
  if (opts.schema) {
    body['text'] = { format: { type: "json_schema", name: opts.schema.name, schema: opts.schema.schema, strict: true } };
  }

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    let msg = "";
    try {
      const j = JSON.parse(text);
      msg = j?.error?.message ?? j?.message ?? "";
    } catch {}
    if (res.status === 429) throw new Error("The AI is busy right now. Please wait a moment and try again.");
    if (res.status === 402) throw new Error(msg || "AI credits are used up. Add credits in workspace billing settings.");
    if (res.status === 403) throw new Error(msg || "AI access is not enabled for this workspace.");
    throw new Error(msg || `AI request failed (${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let out = "";
  let refusal = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let ev: any;
      try {
        ev = JSON.parse(data);
      } catch {
        continue;
      }
      if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
      else if (ev.type === "response.refusal.delta") refusal += ev.delta ?? "";
      else if (ev.type === "error" || ev.type === "response.failed")
        throw new Error(ev?.error?.message ?? ev?.response?.error?.message ?? "AI request failed.");
    }
  }
  if (!out.trim()) throw new Error(refusal || "The AI could not produce a response for this request.");
  return out;
}
