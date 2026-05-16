"use client";

import { useState } from "react";
import { X, Settings, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Settings as SettingsType } from "@/lib/types";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: SettingsType;
  onSave: (s: SettingsType) => void;
}

export function SettingsDialog({
  open,
  onClose,
  settings,
  onSave,
}: SettingsDialogProps) {
  const [host, setHost] = useState(settings.host);
  const [model, setModel] = useState(settings.model);
  const [extractionModel, setExtractionModel] = useState(settings.extractionModel || "gemma3:4b");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMessage, setTestMessage] = useState("");

  const testConnection = async () => {
    setTestStatus("testing");
    setTestMessage("");
    try {
      const res = await fetch("/api/test-ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });
      const data = await res.json();

      if (data.ok) {
        const found = data.models.some(
          (n: string) => n.startsWith(model.split(":")[0])
        );
        setTestStatus("ok");
        setTestMessage(
          found
            ? `Connected · ${model} found`
            : `Connected · ${data.count} model(s) available:\n${data.models.join(", ")}`
        );
      } else {
        setTestStatus("fail");
        setTestMessage(data.error + (data.detail ? `\n\n${data.detail}` : ""));
      }
    } catch (err) {
      setTestStatus("fail");
      setTestMessage(err instanceof Error ? err.message : "Request failed");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <Settings className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold flex-1">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Ollama Host URL
            </label>
            <input
              type="text"
              defaultValue={host}
              onChange={(e) => {
                setHost(e.target.value);
                setTestStatus("idle");
              }}
              placeholder="http://192.168.1.9:11434"
              className={cn(
                "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors font-mono",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Model Name
            </label>
            <input
              type="text"
              defaultValue={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestStatus("idle");
              }}
              placeholder="glm-ocr:q8_0"
              className={cn(
                "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors font-mono",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Extraction Model
            </label>
            <select
              value={extractionModel}
              onChange={(e) => setExtractionModel(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              )}
            >
              <option value="gemma3:4b">gemma3:4b</option>
              <option value="gemma4:12b-cloud">gemma4:12b-cloud</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Used for structured field extraction after OCR
            </p>
          </div>

          <button
            onClick={testConnection}
            disabled={testStatus === "testing"}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              "border bg-background hover:bg-accent",
              "disabled:opacity-50"
            )}
          >
            {testStatus === "testing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing connection...
              </>
            ) : (
              "Test Connection"
            )}
          </button>

          {testStatus === "ok" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 whitespace-pre-wrap">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              {testMessage}
            </div>
          )}

          {testStatus === "fail" && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400 whitespace-pre-wrap">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{testMessage}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors",
              "border bg-background hover:bg-accent"
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ host, model, extractionModel });
              onClose();
            }}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all",
              "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
              "hover:from-indigo-500 hover:to-violet-500 shadow-sm"
            )}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
