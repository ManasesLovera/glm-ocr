"use client";

import { Clock, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { OcrModeLabels, type HistoryItem, type OcrMode } from "@/lib/types";

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  activeId: string | null;
}

const modeBorderColors: Record<OcrMode, string> = {
  text: "border-l-blue-500",
  table: "border-l-emerald-500",
  figure: "border-l-violet-500",
};

const modeActiveBg: Record<OcrMode, string> = {
  text: "bg-blue-50 dark:bg-blue-950/30",
  table: "bg-emerald-50 dark:bg-emerald-950/30",
  figure: "bg-violet-50 dark:bg-violet-950/30",
};

export function HistoryPanel({
  items,
  onSelect,
  onClear,
  activeId,
}: HistoryPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-500 dark:from-indigo-900/50 dark:to-violet-900/50 dark:text-indigo-400">
          <Clock className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">No history yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          History
        </span>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={cn(
              "flex w-full items-start gap-3 border-b border-l-[3px] px-4 py-3 text-left transition-all duration-150",
              "hover:bg-accent/50",
              activeId === item.id
                ? cn(modeBorderColors[item.mode], modeActiveBg[item.mode])
                : "border-l-transparent"
            )}
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
              <img
                src={item.image}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {item.filename}
              </p>
              <p className="text-xs" style={{ color: `var(--mode-${item.mode})` }}>
                {OcrModeLabels[item.mode]}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">
                {item.result.slice(0, 80)}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
