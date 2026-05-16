import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const BASE_SCHEMA = {
  type: "object",
  properties: {
    documentType: { type: "string", description: "Type of document (invoice, form, receipt, letter, report, etc.)" },
    title: { type: "string", description: "Document title or main heading" },
    fields: {
      type: "array",
      description: "Extracted fields from the document",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          display: { type: "string" },
          description: { type: "string" },
          type: { type: "string" },
          value: { type: "string" },
        },
        required: ["name", "value"],
      },
    },
    tables: {
      type: "array",
      description: "Any tables found in the document",
      items: {
        type: "object",
        properties: {
          caption: { type: "string" },
          headers: { type: "array", items: { type: "string" } },
          rows: {
            type: "array",
            items: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    summary: { type: "string", description: "Brief summary of the document content" },
  },
};

function buildStructuredPrompt(ocrText: string, fields: { name: string; display: string; description: string; type: string }[]): string {
  let fieldList = "- Document type, title, tables, summary";
  if (fields.length > 0) {
    fieldList = fields
      .map((f) => {
        const parts = [`- ${f.name}`];
        if (f.display) parts.push(`(display: "${f.display}")`);
        if (f.type) parts.push(`[${f.type}]`);
        if (f.description) parts.push(`: ${f.description}`);
        return parts.join(" ");
      })
      .join("\n");
    fieldList += "\n- Document type, title, any tables, summary";
  }

  return `You are a document analysis assistant. Analyze this document image and its OCR text to extract structured information.

Document OCR Text:
${ocrText}

Extract the following specific fields from the document:
${fieldList}

For each field include: name (machine-readable identifier), display (human-readable label), description (what it represents), type (data type), and value (extracted content).

Return the result as valid JSON following the specified schema.`;
}

async function callOllama(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function handleFetchError(url: string, model: string, label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const cause = err instanceof Error && err.cause ? String(err.cause) : "";
  console.error(`[OCR] ${label} fetch failed:`, msg, cause, { url, model });
  return NextResponse.json(
    {
      error: `Failed to connect to Ollama (${label})`,
      detail: `${msg}${cause ? `\nCause: ${cause}` : ""}\n\nURL: ${url}\nModel: ${model}`,
      url,
      model,
    },
    { status: 502 }
  );
}

async function handleHttpError(url: string, model: string, label: string, res: Response) {
  const text = await res.text().catch(() => "no body");
  console.error(`[OCR] ${label} HTTP error:`, res.status, text.slice(0, 300), { url, model });
  return NextResponse.json(
    {
      error: `Ollama returned HTTP ${res.status} (${label})`,
      detail: `Status: ${res.status} ${res.statusText}\nBody: ${text.slice(0, 500)}\n\nURL: ${url}\nModel: ${model}`,
      url,
      model,
    },
    { status: 502 }
  );
}

function makeErrorResponse(error: string, detail: string, url: string, model: string, status = 500) {
  return NextResponse.json({ error, detail, url, model }, { status });
}

export async function POST(request: NextRequest) {
  let ollamaHost = "";
  let ollamaModel = "";
  let apiUrl = "";

  try {
    const body = await request.json();
    const { image, mode, host, model, useStructured, structuredFields, ocrText: preOcrText } = body;

    if (!image) return NextResponse.json({ error: "Image is required" }, { status: 400 });
    if (!mode) return NextResponse.json({ error: "Mode is required" }, { status: 400 });

    ollamaHost = host || "http://192.168.1.9:11434";
    ollamaModel = model || "glm-ocr:q8_0";
    const base = ollamaHost.replace(/\/+$/, "");

    let ocrText: string;
    let ocrEvalCount: number | undefined;
    let ocrEvalDuration: number | undefined;

    // If pre-computed OCR text was provided (two-phase mode), skip step 1
    if (preOcrText) {
      ocrText = preOcrText;
    } else {
      // --- Step 1: GLM-OCR text recognition ---
      apiUrl = `${base}/api/generate`;
      const prompts: Record<string, string> = {
        text: "Text Recognition:",
        table: "Table Recognition:",
        figure: "Figure Recognition:",
      };
      const ocrPrompt = prompts[mode as keyof typeof prompts] || "Text Recognition:";

      let res: Response;
      try {
        res = await callOllama(apiUrl, {
          model: ollamaModel,
          prompt: ocrPrompt,
          images: [image],
          stream: false,
        });
      } catch (err) {
        return handleFetchError(apiUrl, ollamaModel, "glm-ocr", err);
      }

      if (!res.ok) return handleHttpError(apiUrl, ollamaModel, "glm-ocr", res);

      let ocrData: Record<string, unknown>;
      try {
        ocrData = await res.json();
      } catch {
        return makeErrorResponse("Ollama returned invalid JSON", "glm-ocr response parse failed", apiUrl, ollamaModel, 502);
      }

      ocrText = (ocrData.response as string) ?? "";
      ocrEvalCount = (ocrData.eval_count as number) ?? undefined;
      ocrEvalDuration = (ocrData.eval_duration as number) ?? undefined;
    }

    // If structured extraction is not enabled, return immediately
    if (!useStructured) {
      return NextResponse.json({
        text: ocrText,
        done: true,
        evalCount: ocrEvalCount,
        evalDuration: ocrEvalDuration,
        ocrEvalCount,
        ocrEvalDuration,
      });
    }

    // --- Step 2: Gemma3 structured extraction ---
    const gemmaUrl = `${base}/api/chat`;
    const fields = (structuredFields as { name: string; display: string; description: string; type: string }[]) || [];
    const structuredPrompt = buildStructuredPrompt(ocrText, fields);

    let gemmaRes: Response;
    try {
      gemmaRes = await callOllama(gemmaUrl, {
        model: "gemma3:12b-cloud",
        messages: [{ role: "user", content: structuredPrompt, images: [image] }],
        stream: false,
        format: BASE_SCHEMA,
        options: { temperature: 0 },
      });
    } catch (err) {
      console.error("[OCR] Gemma3 fetch failed:", err);
      return NextResponse.json({
        text: ocrText,
        structured: null,
        error: "Structured extraction failed — connection to gemma3:4b failed",
        done: true,
        evalCount: ocrEvalCount,
        evalDuration: ocrEvalDuration,
      });
    }

    if (!gemmaRes.ok) {
      const gemmaText = await gemmaRes.text().catch(() => "no body");
      console.error("[OCR] Gemma3 HTTP error:", gemmaRes.status, gemmaText.slice(0, 300));
      return NextResponse.json({
        text: ocrText,
        structured: null,
        error: `Structured extraction failed — gemma3:4b returned HTTP ${gemmaRes.status}`,
        done: true,
        evalCount: ocrEvalCount,
        evalDuration: ocrEvalDuration,
      });
    }

    let gemmaData: Record<string, unknown>;
    try {
      gemmaData = await gemmaRes.json();
    } catch {
      console.error("[OCR] Gemma3 JSON parse failed");
      return NextResponse.json({
        text: ocrText,
        structured: null,
        error: "Structured extraction failed — gemma3:4b returned invalid JSON",
        done: true,
        evalCount: ocrEvalCount,
        evalDuration: ocrEvalDuration,
      });
    }

    console.error("[OCR] Gemma3 raw response:", JSON.stringify(gemmaData).slice(0, 500));

    // Handle both chat and generate response formats
    const msg = gemmaData.message as Record<string, unknown> | undefined;
    let structuredRaw = "";
    if (msg?.content && typeof msg.content === "string") {
      structuredRaw = msg.content;
    } else if (msg && typeof msg === "object") {
      structuredRaw = JSON.stringify(msg);
    } else if (gemmaData.response && typeof gemmaData.response === "string") {
      structuredRaw = gemmaData.response as string;
    }

    console.error("[OCR] Gemma3 extracted content length:", structuredRaw.length, structuredRaw.slice(0, 200));

    const gemmaEvalCount = (gemmaData.eval_count as number) ?? undefined;
    const gemmaEvalDuration = (gemmaData.eval_duration as number) ?? undefined;

    return NextResponse.json({
      text: ocrText,
      structured: structuredRaw,
      done: true,
      evalCount: ocrEvalCount && gemmaEvalCount ? ocrEvalCount + gemmaEvalCount : (ocrEvalCount ?? gemmaEvalCount),
      evalDuration: ocrEvalDuration && gemmaEvalDuration ? ocrEvalDuration + gemmaEvalDuration : (ocrEvalDuration ?? gemmaEvalDuration),
      ocrEvalCount,
      ocrEvalDuration,
      gemmaEvalCount,
      gemmaEvalDuration,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const stack = error instanceof Error && error.stack ? error.stack.split("\n").slice(0, 3).join("\n") : undefined;
    console.error("[OCR] Unhandled error:", message, stack, { url: apiUrl, model: ollamaModel });
    return NextResponse.json(
      { error: message, detail: `URL: ${apiUrl}\nModel: ${ollamaModel}\n\n${stack || ""}`, url: apiUrl, model: ollamaModel },
      { status: 500 }
    );
  }
}
