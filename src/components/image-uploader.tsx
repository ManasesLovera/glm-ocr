"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageUp, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  file: File | null;
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
  previewUrl?: string | null;
}

export function ImageUploader({
  file,
  onFileSelected,
  disabled,
  previewUrl,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      onFileSelected(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled,
  });

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onFileSelected(null);
  };

  const displayUrl = (file && preview) ? preview : (previewUrl ?? null);

  if (displayUrl) {
    const label = file?.name || (previewUrl ? "History" : null);
    const size = file?.size ? `${(file.size / 1024).toFixed(0)} KB` : null;
    return (
      <div className="relative mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-200 bg-muted/30 dark:border-indigo-800">
          <img
            src={displayUrl}
            alt={label || "Image preview"}
            className="max-h-[400px] w-full object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-indigo-900/70 via-indigo-900/30 to-transparent p-3">
            <div className="flex items-center gap-2 text-sm text-white">
              <FileImage className="h-4 w-4 shrink-0" />
              <span className="max-w-[200px] truncate">{label || "Image"}</span>
              {size && <span className="text-white/70">({size})</span>}
            </div>
            <button
              onClick={clearFile}
              disabled={disabled}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                "bg-white/20 text-white hover:bg-white/40"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "mx-auto max-w-lg cursor-pointer rounded-xl border-2 border-dashed p-12 transition-all duration-300",
        isDragActive
          ? "border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10 scale-[1.01] dark:bg-indigo-950/20"
          : "border-indigo-300/40 hover:border-indigo-400/60 hover:bg-indigo-50/30 dark:border-indigo-700/40 dark:hover:border-indigo-500/60 dark:hover:bg-indigo-950/20",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
            isDragActive
              ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20"
              : "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 dark:from-indigo-900/50 dark:to-violet-900/50 dark:text-indigo-400"
          )}
        >
          <ImageUp className="h-6 w-6" />
        </div>
        <div>
          {isDragActive ? (
            <p className="font-medium text-indigo-600 dark:text-indigo-400">
              Drop image here
            </p>
          ) : (
            <>
              <p className="font-medium text-foreground">
                Drag & drop image here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse · PNG, JPG, WebP
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
