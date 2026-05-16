"use client";

import { useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Clock, Sparkles, AlertCircle, Loader2, Bug, ChevronDown, ChevronRight, Text, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OcrResponse } from "@/lib/types";

interface OcrResultProps {
  result: OcrResponse | null;
  loading: boolean;
  extracting?: boolean;
  extractionModel?: string;
}

function StructuredView({ raw, ocrText }: { raw: string; ocrText?: string }) {
  const [showRaw, setShowRaw] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  let fields: Array<{ name: string; display: string; description: string; type: string; value: string }> = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      fields = parsed as typeof fields;
    }
  } catch {
    return (
      <div className="divide-y">
        <div className="p-5">
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            Failed to parse structured output
          </div>
          <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-auto">{raw}</pre>
        </div>
        {ocrText && (
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto p-5 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">OCR Text</div>
            <Markdown remarkPlugins={[remarkGfm]}>{ocrText}</Markdown>
          </div>
        )}
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-5 space-y-3">
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          No fields were extracted from the document.
        </div>
        {ocrText && (
          <div className="border-t px-5 py-3">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showRaw ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Raw OCR text
            </button>
            {showRaw && (
              <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap max-h-48">{ocrText}</pre>
            )}
          </div>
        )}
        <div className="border-t px-5 py-3">
          <button
            onClick={() => setShowPayload(!showPayload)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPayload ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Structured JSON
          </button>
          {showPayload && (
            <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap max-h-72">{(() => { try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; } })()}</pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      <div className="px-5 py-4 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Text className="h-3.5 w-3.5" />
          {fields.length > 1 ? `${fields.length} fields` : "1 field"}
        </h4>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Display</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fields.map((f, i) => (
                <tr key={i} className="even:bg-muted/20">
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">{f.name}</td>
                  <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{f.display}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{f.type}</span>
                  </td>
                  <td className="px-3 py-2 text-xs break-words min-w-[120px] max-w-[300px]">{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw OCR text */}
      {ocrText && (
        <div className="px-5 py-3 border-t">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showRaw ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Raw OCR text
          </button>
          {showRaw && (
            <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap max-h-48">{ocrText}</pre>
          )}
        </div>
      )}

      {/* Raw JSON payload */}
      <div className="px-5 py-3 border-t">
        <button
          onClick={() => setShowPayload(!showPayload)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPayload ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Structured JSON
        </button>
          {showPayload && (
            <pre className="mt-2 rounded-lg bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap max-h-72">{(() => { try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; } })()}</pre>
          )}
        </div>
      </div>
    );
  }

export function OcrResult({ result, loading, extracting, extractionModel }: OcrResultProps) {
  const [copied, setCopied] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const copyText = useMemo(() => {
    if (!result || result.error) return "";
    if (result.structured) return `${result.text}\n\n--- Structured ---\n${result.structured}`;
    return result.text;
  }, [result]);

  const copy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = copyText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-5 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 pb-2 border-b border-indigo-100 dark:border-indigo-900">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {result?.structured !== undefined ? "Extracting structure..." : "Extracting text..."}
          </span>
        </div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-indigo-100 dark:bg-indigo-950" />
        <div className="h-4 w-full animate-pulse rounded bg-indigo-100 dark:bg-indigo-950" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-indigo-100 dark:bg-indigo-950" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-indigo-100 dark:bg-indigo-950" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-indigo-100 dark:bg-indigo-950" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-indigo-50/30 p-12 text-center animate-in fade-in duration-300 dark:bg-indigo-950/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-500 dark:from-indigo-900/50 dark:to-violet-900/50 dark:text-indigo-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium text-foreground">No results yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload an image and click Process to start OCR
          </p>
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in duration-300">
        <div className="flex items-start gap-3 border-b border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap break-words">
              {result.error}
            </p>

            {result.detail && (
              <>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  <Bug className="h-3.5 w-3.5" />
                  {showDebug ? "Hide details" : "Show details"}
                </button>
                {showDebug && (
                  <pre className="mt-2 rounded-lg bg-red-100/80 p-3 text-xs text-red-800 overflow-auto dark:bg-red-950/50 dark:text-red-200 whitespace-pre-wrap">
                    {result.detail}
                  </pre>
                )}
              </>
            )}

            {result.url && (
              <p className="mt-2 text-xs text-red-400 dark:text-red-500 font-mono">
                {result.url}
              </p>
            )}
          </div>
        </div>
        {result.text && (
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto p-5 border-t border-red-100 dark:border-red-900">
            <div className="text-xs font-medium text-muted-foreground mb-2">OCR Text</div>
            <Markdown remarkPlugins={[remarkGfm]}>{result.text}</Markdown>
          </div>
        )}
      </div>
    );
  }

  const isStructured = !!result.structured;

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={cn(
        "flex items-start justify-between gap-2 border-b px-5 py-3",
        isStructured
          ? "border-amber-100 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
          : "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
      )}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <span className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            isStructured
              ? "text-amber-700 dark:text-amber-400"
              : "text-emerald-700 dark:text-emerald-400"
          )}>
            <Check className="h-3.5 w-3.5" />
            {isStructured ? "Structured" : "Extracted"}
          </span>
          {result.ocrEvalDuration != null && result.gemmaEvalDuration != null ? (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title="GLM-OCR recognition time">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                OCR: {(result.ocrEvalDuration / 1_000_000_000).toFixed(1)}s
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title={`${extractionModel || "gemma3:4b"} extraction time`}>
                <Cpu className="h-3.5 w-3.5 text-amber-500" />
                Extract: {(result.gemmaEvalDuration / 1_000_000_000).toFixed(1)}s
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground" title="Total time (OCR + extraction)">
                Total: {((result.ocrEvalDuration + result.gemmaEvalDuration) / 1_000_000_000).toFixed(1)}s
              </span>
            </>
          ) : result.evalDuration != null && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              {result.evalDuration >= 1_000_000_000
                ? `${(result.evalDuration / 1_000_000_000).toFixed(1)}s`
                : `${(result.evalDuration / 1_000_000).toFixed(0)}ms`}
            </span>
          )}
          {result.evalCount != null && (
            <span className="text-xs text-violet-600 dark:text-violet-400">
              {result.evalCount} tokens
            </span>
          )}
        </div>
        <button
          onClick={copy}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            copied
              ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
              : "bg-white text-indigo-600 shadow-sm hover:bg-indigo-50 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/50"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>

      {extracting && (
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/50 px-5 py-2.5 dark:border-amber-900 dark:bg-amber-950/20">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Extracting fields via {extractionModel || "gemma3:4b"}...</span>
        </div>
      )}

      {isStructured ? (
        <StructuredView raw={result.structured!} ocrText={result.text} />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto p-5">
          <Markdown remarkPlugins={[remarkGfm]}>{result.text}</Markdown>
        </div>
      )}
    </div>
  );
}
