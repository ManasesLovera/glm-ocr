"use client";

import { cn } from "@/lib/utils";
import type { OcrMode } from "@/lib/types";
import { FileText, Table, Image } from "lucide-react";

interface ModeSelectorProps {
  mode: OcrMode;
  onChange: (mode: OcrMode) => void;
  disabled?: boolean;
}

const modes: {
  value: OcrMode;
  label: string;
  icon: typeof FileText;
  colors: {
    light: string;
    dark: string;
    bg: string;
    darkBg: string;
  };
}[] = [
  {
    value: "text",
    label: "Text",
    icon: FileText,
    colors: {
      light: "text-blue-700 bg-blue-100 border-blue-200",
      dark: "dark:text-blue-300 dark:bg-blue-950 dark:border-blue-800",
      bg: "bg-blue-50",
      darkBg: "dark:bg-blue-950/50",
    },
  },
  {
    value: "table",
    label: "Table",
    icon: Table,
    colors: {
      light: "text-emerald-700 bg-emerald-100 border-emerald-200",
      dark: "dark:text-emerald-300 dark:bg-emerald-950 dark:border-emerald-800",
      bg: "bg-emerald-50",
      darkBg: "dark:bg-emerald-950/50",
    },
  },
  {
    value: "figure",
    label: "Figure",
    icon: Image,
    colors: {
      light: "text-violet-700 bg-violet-100 border-violet-200",
      dark: "dark:text-violet-300 dark:bg-violet-950 dark:border-violet-800",
      bg: "bg-violet-50",
      darkBg: "dark:bg-violet-950/50",
    },
  },
];

export function ModeSelector({ mode, onChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex overflow-hidden rounded-lg border bg-muted/50 p-0.5">
      {modes.map((m) => {
        const Icon = m.icon;
        const active = mode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            disabled={disabled}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
              active
                ? cn(
                    "bg-background shadow-sm border",
                    m.colors.light,
                    m.colors.dark,
                    m.colors.bg,
                    m.colors.darkBg
                  )
                : "text-muted-foreground hover:text-foreground",
              active && "scale-[1.02]",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                active ? cn(m.colors.light, m.colors.dark) : "text-muted-foreground"
              )}
            />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
