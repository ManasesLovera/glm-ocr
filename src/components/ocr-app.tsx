"use client";

import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { base64FromFile, generateId } from "@/lib/utils";
import type { Settings, OcrMode, OcrResponse, HistoryItem, StructuredField } from "@/lib/types";
import { Header } from "@/components/header";
import { ImageUploader } from "@/components/image-uploader";
import { ModeSelector } from "@/components/mode-selector";
import { OcrResult } from "@/components/ocr-result";
import { HistoryPanel } from "@/components/history-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { FieldConfigModal } from "@/components/field-config";

const DEFAULT_SETTINGS: Settings = {
  host: "http://192.168.1.9:11434",
  model: "glm-ocr:q8_0",
  extractionModel: "gemma3:4b",
};

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("glm-ocr-history");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function OcrApp() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<OcrMode>("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useStructured, setUseStructured] = useState(false);
  const [structuredFields, setStructuredFields] = useState<StructuredField[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldConfigOpen, setFieldConfigOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("glm-ocr-history", JSON.stringify(history));
    } catch {
      console.warn("History too large for localStorage — clearing old entries");
      const trimmed = history.slice(0, 10);
      setHistory(trimmed);
      try {
        localStorage.setItem("glm-ocr-history", JSON.stringify(trimmed));
      } catch {
        // give up
      }
    }
  }, [history]);

  const process = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setActiveHistoryId(null);
    setExtracting(false);

    try {
      const image = await base64FromFile(file);
      const dataUrl = `data:${file.type || "image/png"};base64,${image}`;

      // Check cache: same image + same mode + same structured flag
      const cached = history.find(
        (h) => h.image === dataUrl && h.mode === mode && (!!h.structured) === useStructured
      );
      if (cached) {
        setResult({
          text: cached.result,
          done: true,
          evalDuration: cached.evalDuration,
          evalCount: cached.evalCount,
          structured: cached.structured,
          ocrEvalDuration: cached.ocrEvalDuration,
          ocrEvalCount: cached.ocrEvalCount,
          gemmaEvalDuration: cached.gemmaEvalDuration,
          gemmaEvalCount: cached.gemmaEvalCount,
        });
        setActiveHistoryId(cached.id);
        setPreviewUrl(dataUrl);
        toast.success("Loaded from history");
        setLoading(false);
        return;
      }

      async function apiCall(body: Record<string, unknown>): Promise<OcrResponse & { error?: string }> {
        const r = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        return r.json();
      }

      if (useStructured) {
        // --- Phase 1: OCR only ---
        const ocrResult = await apiCall({ image, mode, ...settings, useStructured: false });
        if (!ocrResult || ocrResult.error) {
          setResult({ text: "", error: ocrResult?.error || "OCR failed", done: false });
          toast.error(ocrResult?.error || "OCR failed");
          setLoading(false);
          return;
        }

        // Show OCR result immediately
        setResult({ text: ocrResult.text, done: true, ocrEvalDuration: ocrResult.ocrEvalDuration, ocrEvalCount: ocrResult.ocrEvalCount });
        setLoading(false);
        setExtracting(true);

        // --- Phase 2: Structured extraction with pre-computed OCR text ---
        const structResult = await apiCall({ image, mode, ...settings, useStructured: true, structuredFields, ocrText: ocrResult.text });

        if (!structResult || structResult.error) {
          // Keep the OCR result, add the error
          setResult((prev) => prev ? { ...prev, error: structResult?.error || "Extraction failed" } : prev);
          toast.error(structResult?.error || "Extraction failed");
          setExtracting(false);
          return;
        }

        // Update with final structured result
        const final = {
          text: ocrResult.text,
          structured: structResult.structured,
          done: true,
          ocrEvalDuration: ocrResult.ocrEvalDuration,
          ocrEvalCount: ocrResult.ocrEvalCount,
          gemmaEvalDuration: structResult.gemmaEvalDuration,
          gemmaEvalCount: structResult.gemmaEvalCount,
          evalCount: (ocrResult.ocrEvalCount ?? 0) + (structResult.gemmaEvalCount ?? 0),
          evalDuration: (ocrResult.ocrEvalDuration ?? 0) + (structResult.gemmaEvalDuration ?? 0),
        };
        setResult(final);
        setExtracting(false);
        toast.success("Extraction complete");

        const item: HistoryItem = {
          id: generateId(),
          image: dataUrl,
          filename: file.name,
          mode,
          result: final.text,
          timestamp: Date.now(),
          evalDuration: final.evalDuration,
          evalCount: final.evalCount,
          structured: final.structured,
          ocrEvalDuration: final.ocrEvalDuration,
          ocrEvalCount: final.ocrEvalCount,
          gemmaEvalDuration: final.gemmaEvalDuration,
          gemmaEvalCount: final.gemmaEvalCount,
        };
        setHistory((prev) => [item, ...prev].slice(0, 50));
      } else {
        // Non-structured: single call
        const data = await apiCall({ image, mode, ...settings, useStructured: false });

        if (data.error) {
          setResult({ text: "", error: data.error || "OCR failed", detail: data.detail, url: data.url, model: data.model, done: false });
          toast.error(data.error || "OCR failed");
        } else {
          setResult(data);
          toast.success("OCR complete");

          const item: HistoryItem = {
            id: generateId(),
            image: dataUrl,
            filename: file.name,
            mode,
            result: data.text,
            timestamp: Date.now(),
            evalDuration: data.evalDuration,
            evalCount: data.evalCount,
            structured: data.structured,
            ocrEvalDuration: data.ocrEvalDuration,
            ocrEvalCount: data.ocrEvalCount,
          };
          setHistory((prev) => [item, ...prev].slice(0, 50));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setResult({ text: "", error: msg, detail: `Network error — could not reach server.\n\n${msg}`, done: false });
      toast.error(msg);
    } finally {
      setLoading(false);
      setExtracting(false);
    }
  }, [file, mode, settings, history, useStructured, structuredFields]);

  const selectHistory = (item: HistoryItem) => {
    setActiveHistoryId(item.id);
    setResult({ text: item.result, done: true, evalDuration: item.evalDuration, evalCount: item.evalCount, structured: item.structured, ocrEvalDuration: item.ocrEvalDuration, ocrEvalCount: item.ocrEvalCount, gemmaEvalDuration: item.gemmaEvalDuration, gemmaEvalCount: item.gemmaEvalCount });
    setFile(null);
    setPreviewUrl(item.image);
  };

  const clearHistory = () => {
    setHistory([]);
    setActiveHistoryId(null);
    setResult(null);
    setPreviewUrl(null);
  };

  return (
    <div className="flex h-screen flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 border-r bg-muted/20 lg:flex lg:flex-col">
          <HistoryPanel
            items={history}
            onSelect={selectHistory}
            onClear={clearHistory}
            activeId={activeHistoryId}
          />
        </aside>

        <main className="flex flex-1 flex-col overflow-auto">
          <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 md:p-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">OCR Document</h1>
              <p className="text-sm text-muted-foreground">
                Upload an image and choose recognition mode
              </p>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-6">
              <div className="space-y-6">
                <ModeSelector mode={mode} onChange={setMode} disabled={loading} />

                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Structured extraction</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Extract fields via gemma3:12b-cloud after OCR
                      </p>
                    </div>
                    <button
                      onClick={() => setUseStructured(!useStructured)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
                        useStructured ? "bg-amber-500" : "bg-muted"
                      )}
                      role="switch"
                      aria-checked={useStructured}
                    >
                      <span
                        className={cn(
                          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
                          useStructured ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {useStructured && (
                    <button
                      onClick={() => setFieldConfigOpen(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      Configure fields ({structuredFields.length})
                    </button>
                  )}
                </div>

                <ImageUploader
                  file={file}
                  previewUrl={previewUrl}
                  onFileSelected={(f) => {
                    setFile(f);
                    setPreviewUrl(null);
                    if (!f) return;
                    setResult(null);
                    setActiveHistoryId(null);
                  }}
                  disabled={loading}
                />

                <button
                  onClick={process}
                  disabled={!file || loading || extracting}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
                    "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
                    "hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-0.5",
                    "shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30",
                    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Process
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 md:mt-0">
                <OcrResult result={result} loading={loading} extracting={extracting} extractionModel={settings.extractionModel} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <SettingsDialog
        key={settings.host + settings.model}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      <FieldConfigModal
        fields={structuredFields}
        onChange={setStructuredFields}
        open={fieldConfigOpen}
        onClose={() => setFieldConfigOpen(false)}
      />

      <Toaster position="bottom-right" theme="system" />
    </div>
  );
}
