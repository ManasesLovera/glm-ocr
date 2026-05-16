"use client";

import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StructuredField } from "@/lib/types";

const FIELD_TYPES: StructuredField["type"][] = ["string", "number", "date", "currency", "boolean"];

interface FieldConfigProps {
  fields: StructuredField[];
  onChange: (fields: StructuredField[]) => void;
}

interface FieldConfigModalProps {
  fields: StructuredField[];
  onChange: (fields: StructuredField[]) => void;
  open: boolean;
  onClose: () => void;
}

export function FieldConfig({ fields, onChange }: FieldConfigProps) {
  const update = (i: number, key: keyof StructuredField, value: string) => {
    const next = fields.map((f, j) =>
      j === i ? { ...f, [key]: key === "type" ? (value as StructuredField["type"]) : value } : f
    );
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(fields.filter((_, j) => j !== i));
  };

  const add = () => {
    onChange([...fields, { name: "", display: "", description: "", type: "string" }]);
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Extraction Fields
        </span>
        <span className="text-xs text-muted-foreground">{fields.length} configured</span>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No fields configured. All document content will be extracted.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Name</label>
                  <input
                    type="text"
                    value={f.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    placeholder="invoice_number"
                    className="flex h-8 w-full rounded-md border bg-background px-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Type</label>
                  <select
                    value={f.type}
                    onChange={(e) => update(i, "type", e.target.value)}
                    className="flex h-8 w-full rounded-md border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => remove(i)}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Remove field"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-0.5">Display label</label>
                <input
                  type="text"
                  value={f.display}
                  onChange={(e) => update(i, "display", e.target.value)}
                  placeholder="Invoice #"
                  className="flex h-8 w-full rounded-md border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-0.5">Description</label>
                <input
                  type="text"
                  value={f.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="The invoice number from the document"
                  className="flex h-8 w-full rounded-md border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
          "border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Field
      </button>
    </div>
  );
}

export function FieldConfigModal({ fields, onChange, open, onClose }: FieldConfigModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] overflow-auto rounded-xl border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Configure Fields</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <FieldConfig fields={fields} onChange={onChange} />
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 text-sm font-medium text-white hover:from-amber-500 hover:to-orange-500 shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
