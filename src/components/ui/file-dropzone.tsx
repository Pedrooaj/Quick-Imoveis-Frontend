"use client";

import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

export interface FileDropzoneProps {
  accept?: string;
  maxSize?: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function FileDropzone({
  accept = "*",
  maxSize,
  file,
  onFileChange,
  onError,
  disabled = false,
  className,
  label = "Arraste um arquivo ou clique para selecionar",
  placeholder = "Nenhum arquivo selecionado",
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  function validateFile(f: File): string | null {
    if (accept && accept !== "*") {
      const types = accept.split(",").map((t) => t.trim());
      const matches = types.some((t) => {
        if (t.endsWith("/*")) return f.type.startsWith(t.slice(0, -2));
        return f.type === t;
      });
      if (!matches) {
        return "Formato não aceito. Use JPEG, PNG, WebP ou GIF.";
      }
    }
    if (maxSize && f.size > maxSize) {
      return `Arquivo muito grande. Máximo ${(maxSize / 1024 / 1024).toFixed(1)}MB.`;
    }
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    const err = validateFile(f);
    if (err) {
      toast.error(err);
      onError?.(err);
      return;
    }
    onError?.("");
    onFileChange(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = "";
    onFileChange(null);
    onError?.("");
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors",
          "border-input bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging && "border-primary bg-primary/5",
          disabled && "pointer-events-none cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-label={label}
        />
        {file ? (
          <>
            <div className="flex items-center gap-3">
              <span className="truncate text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Remover arquivo"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Clique ou arraste outro arquivo para trocar</p>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground/80">{placeholder}</p>
          </>
        )}
      </div>
    </div>
  );
}
