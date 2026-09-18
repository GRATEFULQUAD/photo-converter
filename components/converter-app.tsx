"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Trash,
} from "lucide-react";
import { convertFile, OutputFormat, FORMAT_EXT, ConversionResult } from "@/lib/convert";
import { cn } from "@/lib/utils";

interface QueueItem {
  file: File;
  status: "pending" | "done" | "error";
  result?: ConversionResult;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG (.png)" },
  { value: "jpeg", label: "JPEG (.jpg)" },
  { value: "webp", label: "WebP (.webp)" },
  { value: "bmp", label: "Bitmap (.bmp)" },
];

export function ConverterApp() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif|heic|tiff?)$/i.test(f.name));
    setQueue((prev) => [
      ...prev,
      ...imageFiles.map((file) => ({ file, status: "pending" as const })),
    ]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles]
  );

  const removeItem = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
    setProgress(0);
  }, []);

  const doneCount = useMemo(() => queue.filter((q) => q.status === "done").length, [queue]);
  const errorCount = useMemo(() => queue.filter((q) => q.status === "error").length, [queue]);

  const convertAll = useCallback(async () => {
    if (queue.length === 0) return;
    setConverting(true);
    setProgress(0);

    const updated = [...queue];
    for (let i = 0; i < updated.length; i++) {
      const result = await convertFile(updated[i].file, format, 0.92);
      updated[i] = {
        ...updated[i],
        status: result.error ? "error" : "done",
        result,
      };
      setQueue([...updated]);
      setProgress(Math.round(((i + 1) / updated.length) * 100));
    }

    setConverting(false);
  }, [queue, format]);

  const downloadAll = useCallback(async () => {
    const converted = queue.filter((q) => q.status === "done" && q.result);
    if (converted.length === 0) return;

    const zip = new JSZip();
    const usedNames = new Set<string>();
    for (const item of converted) {
      let name = item.result!.outputName;
      let counter = 1;
      while (usedNames.has(name)) {
        const base = name.replace(/\.[^.]+$/, "");
        name = `${base}-${counter}.${FORMAT_EXT[format]}`;
        counter++;
      }
      usedNames.add(name);
      zip.file(name, item.result!.blob);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted-${format}-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [queue, format]);

  const downloadSingle = useCallback((item: QueueItem) => {
    if (!item.result) return;
    const url = URL.createObjectURL(item.result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.result.outputName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center space-y-3 py-4">
          <p className="font-display text-xs tracking-[0.5em] neon-text-magenta uppercase">
            // batch protocol
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight neon-text-cyan uppercase">
            Photo Converter
          </h1>
          <div className="neon-divider mx-auto w-40" />
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Drop in any images, pick a target format, and get converted copies —
            your originals are never modified or deleted.
          </p>
        </div>

        <Card className="glass-panel hud-corners rounded-xl">
          <CardHeader>
            <CardTitle className="font-display text-sm tracking-widest uppercase neon-text-cyan">
              01 // Add Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-[rgb(255,0,230)] bg-[rgba(255,0,230,0.08)] shadow-[0_0_30px_rgba(255,0,230,0.35)]"
                  : "border-[rgba(0,255,240,0.35)] hover:border-[rgba(0,255,240,0.8)] hover:shadow-[0_0_24px_rgba(0,255,240,0.25)]"
              )}
            >
              <Upload className="h-8 w-8 neon-text-cyan" />
              <p className="text-sm font-medium tracking-wide">
                Click to browse or drag &amp; drop images here
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, WebP, GIF, BMP, SVG and more — batch up to hundreds of files at once
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleSelect}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel-magenta glass-panel hud-corners rounded-xl">
          <CardHeader>
            <CardTitle className="font-display text-sm tracking-widest uppercase neon-text-magenta">
              02 // Choose Output Format
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
              <SelectTrigger className="w-full sm:w-56 border-[rgba(0,255,240,0.5)] bg-black/40 shadow-[0_0_16px_rgba(0,255,240,0.15)]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-[rgba(0,255,240,0.5)]">
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={convertAll}
              disabled={queue.length === 0 || converting}
              className="gap-2 bg-[rgb(0,255,240)] text-black hover:bg-[rgb(0,220,210)] shadow-[0_0_20px_rgba(0,255,240,0.45)] font-semibold tracking-wide"
            >
              {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              Convert {queue.length > 0 ? `${queue.length} file${queue.length > 1 ? "s" : ""}` : ""}
            </Button>
            {queue.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={converting}
                className="gap-2 border-[rgba(255,0,230,0.5)] bg-black/30 hover:bg-[rgba(255,0,230,0.1)] hover:text-[rgb(255,0,230)]"
              >
                <Trash className="h-4 w-4" />
                Clear
              </Button>
            )}
          </CardContent>
        </Card>

        {queue.length > 0 && (
          <Card className="glass-panel hud-corners rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="font-display text-sm tracking-widest uppercase neon-text-cyan">
                03 // Queue ({queue.length}) — {doneCount} done
                {errorCount > 0 ? `, ${errorCount} failed` : ""}
              </CardTitle>
              <Button
                size="sm"
                onClick={downloadAll}
                disabled={doneCount === 0}
                className="gap-2 bg-[rgb(255,0,230)] text-black hover:bg-[rgb(220,0,200)] shadow-[0_0_20px_rgba(255,0,230,0.45)] font-semibold"
              >
                <Download className="h-4 w-4" />
                Download all as .zip
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {converting && (
                <Progress
                  value={progress}
                  className="bg-black/50 border border-[rgba(0,255,240,0.3)] [&>div]:bg-[rgb(0,255,240)] [&>div]:shadow-[0_0_10px_rgba(0,255,240,0.7)]"
                />
              )}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {queue.map((item, i) => (
                  <div
                    key={`${item.file.name}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-[rgba(0,255,240,0.25)] bg-black/30 p-2 text-sm backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.status === "done" && (
                        <CheckCircle className="h-4 w-4 text-[rgb(0,255,240)] shrink-0" />
                      )}
                      {item.status === "error" && (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      {item.status === "pending" && (
                        <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate">{item.file.name}</span>
                      {item.status === "done" && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-[rgba(255,0,230,0.15)] text-[rgb(255,0,230)] border border-[rgba(255,0,230,0.4)]"
                        >
                          {item.result?.outputName}
                        </Badge>
                      )}
                      {item.status === "error" && (
                        <span className="text-xs text-destructive truncate">{item.result?.error}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.status === "done" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadSingle(item)}
                          className="hover:bg-[rgba(0,255,240,0.12)] hover:text-[rgb(0,255,240)]"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(i)}
                        disabled={converting}
                        className="hover:bg-[rgba(255,0,230,0.12)] hover:text-[rgb(255,0,230)]"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground pb-4">
          Everything happens locally in your browser — files are never uploaded to a server,
          and your original files on disk are left untouched.
        </p>
      </div>
    </div>
  );
}
