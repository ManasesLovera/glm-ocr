"use client";

import { useEffect, useState } from "react";
import { Settings, Moon, Sun, ScanText } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <ScanText className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">GLM-OCR</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
