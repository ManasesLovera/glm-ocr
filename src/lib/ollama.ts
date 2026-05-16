import type { OcrRequest, OcrResponse } from "./types";

export async function performOcr(req: OcrRequest): Promise<OcrResponse> {
  const apiUrl = `${req.host.replace(/\/+$/, "")}/api/generate`;

  const prompts: Record<string, string> = {
    text: "Text Recognition:",
    table: "Table Recognition:",
    figure: "Figure Recognition:",
  };

  const body = JSON.stringify({
    model: req.model,
    prompt: prompts[req.mode] || "Text Recognition:",
    images: [req.image],
    stream: false,
  });

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "no body");
    throw new Error(`Ollama returned ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    text: data.response ?? "",
    done: data.done ?? false,
    evalCount: data.eval_count,
    evalDuration: data.eval_duration,
  };
}
