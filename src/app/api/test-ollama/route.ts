import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { host } = await request.json();
    const cleanHost = (host || "http://192.168.1.9:11434").replace(/\/+$/, "");
    const apiUrl = `${cleanHost}/api/tags`;

    console.error("[OCR-TEST] Testing connection to:", apiUrl);

    let res: Response;
    try {
      res = await fetch(apiUrl, {
        method: "GET",
        signal: AbortSignal.timeout(10_000),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const cause = fetchErr instanceof Error && fetchErr.cause ? String(fetchErr.cause) : "";
      console.error("[OCR-TEST] Fetch failed:", msg, cause);
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot reach Ollama at ${cleanHost}`,
          detail: `${msg}${cause ? `\nCause: ${cause}` : ""}`,
        },
        { status: 200 }
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[OCR-TEST] HTTP error:", res.status, text.slice(0, 200));
      return NextResponse.json(
        {
          ok: false,
          error: `Ollama returned HTTP ${res.status}`,
          detail: text.slice(0, 300),
        },
        { status: 200 }
      );
    }

    const data = await res.json();
    const models = (data.models || []) as { name: string }[];
    const modelNames = models.map((m) => m.name);

    console.error("[OCR-TEST] Success. Models:", modelNames);

    return NextResponse.json(
      {
        ok: true,
        models: modelNames,
        count: models.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[OCR-TEST] Unhandled error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
