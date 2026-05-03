import { useParams, Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Download, ImageIcon, Lock, Zap, Grid2X2, Minimize, Scaling, Crop, Repeat, RefreshCcw, SlidersHorizontal, Stamp, Wand2, Scissors, BadgeCheck, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useCallback } from "react";
import { ToolMerge } from "@/components/tools/ToolMerge";
import { ToolCompress } from "@/components/tools/ToolCompress";
import { ToolResize } from "@/components/tools/ToolResize";
import { ToolCrop } from "@/components/tools/ToolCrop";
import { ToolConvert } from "@/components/tools/ToolConvert";
import { ToolRotate } from "@/components/tools/ToolRotate";
import { ToolAdjustments } from "@/components/tools/ToolAdjustments";
import { ToolWatermark } from "@/components/tools/ToolWatermark";
import { ToolAutoPipeline } from "@/components/tools/ToolAutoPipeline";
import { ToolBatchCrop } from "@/components/tools/ToolBatchCrop";
import { ToolExifFix } from "@/components/tools/ToolExifFix";
import { ToolBgRemove } from "@/components/tools/ToolBgRemove";
import { Navbar } from "@/components/layout/navbar";

const TOOL_KEYS: Record<string, string> = {
  merge: "tool_merge", compress: "tool_compress", resize: "tool_resize",
  crop: "tool_crop", convert: "tool_convert", rotate: "tool_rotate",
  adjustments: "tool_adjustments", watermark: "tool_watermark", auto: "tool_auto",
  "batch-crop": "tool_batch_crop", "exif-fix": "tool_exif_fix", "bg-remove": "tool_bg_remove",
};

const TOOL_ICONS: Record<string, any> = {
  merge: Grid2X2, compress: Minimize, resize: Scaling, crop: Crop,
  convert: Repeat, rotate: RefreshCcw, adjustments: SlidersHorizontal,
  watermark: Stamp, auto: Wand2, "batch-crop": Scissors, "exif-fix": BadgeCheck, "bg-remove": Eraser,
};

const TOOL_COLORS: Record<string, string> = {
  merge: "from-blue-500 to-cyan-400", compress: "from-purple-500 to-pink-500",
  resize: "from-orange-500 to-red-500", crop: "from-green-500 to-emerald-400",
  convert: "from-indigo-500 to-purple-500", rotate: "from-yellow-400 to-orange-500",
  adjustments: "from-pink-500 to-rose-400", watermark: "from-cyan-500 to-blue-500",
  auto: "from-violet-600 to-fuchsia-500", "batch-crop": "from-emerald-500 to-teal-400",
  "exif-fix": "from-sky-500 to-blue-500", "bg-remove": "from-amber-500 to-orange-500",
};

interface OutputInfo { canvas: HTMLCanvasElement; format: string; quality: number; w: number; h: number }

export default function ToolWorkspace() {
  const { toolId } = useParams();
  const { t } = useI18n();
  const [output, setOutput] = useState<OutputInfo | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleCanvasReady = useCallback((sourceCanvas: HTMLCanvasElement, format = "image/png", quality = 0.92) => {
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      previewCanvas.width = sourceCanvas.width;
      previewCanvas.height = sourceCanvas.height;
      const ctx = previewCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.drawImage(sourceCanvas, 0, 0);
      }
    }
    setOutput({ canvas: sourceCanvas, format, quality, w: sourceCanvas.width, h: sourceCanvas.height });
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const { canvas, format, quality } = output;
    const ext = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
    const a = document.createElement("a");
    a.href = canvas.toDataURL(format, quality);
    a.download = `photo-merge-pro-${toolId}-${Date.now()}.${ext}`;
    a.click();
  };

  const renderToolControls = () => {
    switch (toolId) {
      case "merge":       return <ToolMerge onReady={handleCanvasReady} />;
      case "compress":    return <ToolCompress onReady={handleCanvasReady} />;
      case "resize":      return <ToolResize onReady={handleCanvasReady} />;
      case "crop":        return <ToolCrop onReady={handleCanvasReady} />;
      case "convert":     return <ToolConvert onReady={handleCanvasReady} />;
      case "rotate":      return <ToolRotate onReady={handleCanvasReady} />;
      case "adjustments": return <ToolAdjustments onReady={handleCanvasReady} />;
      case "watermark":   return <ToolWatermark onReady={handleCanvasReady} />;
      case "auto":        return <ToolAutoPipeline onReady={handleCanvasReady} />;
      case "batch-crop":  return <ToolBatchCrop onReady={handleCanvasReady} />;
      case "exif-fix":    return <ToolExifFix onReady={handleCanvasReady} />;
      case "bg-remove":   return <ToolBgRemove onReady={handleCanvasReady} />;
      default: return null;
    }
  };

  const nameKey = toolId ? TOOL_KEYS[toolId] : undefined;
  const ToolIcon = toolId ? TOOL_ICONS[toolId] : null;
  const toolColor = toolId ? TOOL_COLORS[toolId] : "from-blue-500 to-violet-500";
  const toolName = nameKey ? t(nameKey as any) : toolId;
  const hasOutput = output !== null;
  const formatLabel = output?.format === "image/jpeg" ? "JPG" : output?.format === "image/webp" ? "WEBP" : "PNG";

  return (
    <div className="h-screen bg-[#0f1117] text-white flex flex-col overflow-hidden">
      {/* ─── Top bar ─────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.07] bg-[#0f1117]/90 backdrop-blur sticky top-0 z-50 flex items-center justify-between px-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("back_to_home")}
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            {ToolIcon && (
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${toolColor} flex items-center justify-center shrink-0`}>
                <ToolIcon className="w-4 h-4 text-white" />
              </div>
            )}
            <h1 className="font-semibold text-base truncate text-white">{toolName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3 text-xs text-white/35 mr-2">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-yellow-400/70" /> {t("workspace_local_only")}</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400/70" /> {t("workspace_private")}</span>
          </div>
          <Navbar inlineMode />
          <Button
            data-testid="button-download"
            disabled={!hasOutput}
            onClick={handleDownload}
            className="h-9 px-4 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-30 text-sm font-semibold gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            {t("download")}
          </Button>
        </div>
      </header>

      {/* ─── Body ────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] overflow-hidden">

        {/* Sidebar */}
        <aside className="border-r border-white/[0.07] bg-[#12151e] overflow-y-auto flex flex-col min-w-0">
          {/* Tool header inside sidebar */}
          <div className="px-4 py-4 border-b border-white/[0.07] shrink-0">
            <div className="flex items-center gap-3">
              {ToolIcon && (
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${toolColor} flex items-center justify-center shrink-0 shadow-lg`}>
                  <ToolIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-white">{toolName}</div>
                <div className="text-xs text-white/40 mt-0.5">{t("controls")}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 p-4">
            {renderToolControls()}
          </div>
        </aside>

        {/* Canvas area */}
        <main className="relative overflow-hidden flex flex-col bg-[#0a0c10] min-w-0">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <div className="relative w-full max-w-[1120px] h-full flex items-center justify-center">
              {!hasOutput && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-white/25" />
                  </div>
                  <div className="text-center">
                    <p className="text-white/35 text-sm font-medium">{t("select_image_to_begin")}</p>
                    <p className="text-white/20 text-xs mt-1">{t("workspace_upload_hint")}</p>
                  </div>
                </div>
              )}
              {/* Checkerboard bg when output exists */}
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  opacity: hasOutput ? 0.3 : 0,
                  backgroundImage: "repeating-conic-gradient(#1a1d2a 0% 25%, #111318 0% 50%)",
                  backgroundSize: "24px 24px",
                }}
              />
              <canvas
                id="main-canvas"
                ref={previewCanvasRef}
                data-testid="main-canvas"
                className="relative z-10 block max-w-full shadow-2xl transition-all duration-300 rounded-lg"
                style={{
                  maxHeight: "calc(100vh - 8rem)",
                  objectFit: "contain",
                  opacity: hasOutput ? 1 : 0,
                  transform: hasOutput ? "scale(1)" : "scale(0.97)",
                }}
                width={800}
                height={600}
              />
            </div>
          </div>

          {/* Status bar */}
          {hasOutput && (
            <div className="h-9 border-t border-white/[0.07] bg-[#0f1117]/80 flex items-center px-4 gap-4 text-xs text-white/40 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
                {t("workspace_ready_to_download")}
              </span>
              <span className="text-white/20">·</span>
              <span>{output.w} × {output.h}px</span>
              <span className="text-white/20">·</span>
              <span>{formatLabel}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
