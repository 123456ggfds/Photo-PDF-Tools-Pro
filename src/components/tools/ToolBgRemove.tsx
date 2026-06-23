import { useRef, useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Eraser, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;
type SamplePoint = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

const SAMPLE_POINTS: { id: SamplePoint; labelKey: string }[] = [
  { id: "top-left", labelKey: "bg_sample_tl" },
  { id: "top-right", labelKey: "bg_sample_tr" },
  { id: "bottom-left", labelKey: "bg_sample_bl" },
  { id: "bottom-right", labelKey: "bg_sample_br" },
  { id: "center", labelKey: "bg_sample_center" },
];

function getSampleColor(ctx: CanvasRenderingContext2D, w: number, h: number, point: SamplePoint): [number, number, number] {
  const m = 2;
  let x = m, y = m;
  if (point === "top-right") { x = w - m - 1; y = m; }
  else if (point === "bottom-left") { x = m; y = h - m - 1; }
  else if (point === "bottom-right") { x = w - m - 1; y = h - m - 1; }
  else if (point === "center") { x = Math.floor(w / 2); y = Math.floor(h / 2); }
  const d = ctx.getImageData(x, y, 1, 1).data;
  return [d[0], d[1], d[2]];
}

function removeBackground(ctx: CanvasRenderingContext2D, w: number, h: number, sampleColor: [number, number, number], tolerance: number): ImageData {
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const [r0, g0, b0] = sampleColor;
  for (let i = 0; i < px.length; i += 4) {
    const diff = Math.sqrt(
      Math.pow(px[i] - r0, 2) + 
      Math.pow(px[i+1] - g0, 2) + 
      Math.pow(px[i+2] - b0, 2)
    );
    if (diff < tolerance) {
      px[i + 3] = 0; // 真正移除背景（透明）
    }
  }
  return data;
}

export function ToolBgRemove({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [imgData, setImgData] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [tolerance, setTolerance] = useState(30);
  const [samplePoint, setSamplePoint] = useState<SamplePoint>("top-left");
  const [applied, setApplied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise(r => { img.onload = r; });
    setImgData({ url, img });
    setApplied(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, multiple: false });

  const drawPreview = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas || !imgData) return;
    const img = imgData.img;
    const maxW = 260;
    const scale = Math.min(maxW / img.width, 160 / img.height);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;
    
    // 背景棋盤格
    const cellSize = 10;
    for (let y = 0; y < canvas.height; y += cellSize) {
      for (let x = 0; x < canvas.width; x += cellSize) {
        ctx.fillStyle = ((x + y) / cellSize) % 2 === 0 ? "#1a1d2a" : "#111318";
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // 取樣點標示
    const pts: Record<SamplePoint, [number, number]> = {
      "top-left": [5, 5], "top-right": [canvas.width - 5, 5],
      "bottom-left": [5, canvas.height - 5], "bottom-right": [canvas.width - 5, canvas.height - 5],
      "center": [canvas.width / 2, canvas.height / 2],
    };
    const [px, py] = pts[samplePoint];
    ctx.fillStyle = "#f59e0b";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }, [imgData, samplePoint]);

  useEffect(() => { drawPreview(); }, [drawPreview]);

  const applyRemoval = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgData) return;
    const img = imgData.img;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const [r, g, b] = getSampleColor(ctx, img.width, img.height, samplePoint);
    const result = removeBackground(ctx, img.width, img.height, [r, g, b], tolerance);
    ctx.putImageData(result, 0, 0);
    
    // 更新預覽圖
    const pCanvas = previewRef.current;
    if (pCanvas) {
      const pCtx = pCanvas.getContext("2d")!;
      const cellSize = 10;
      for (let y = 0; y < pCanvas.height; y += cellSize) {
        for (let x = 0; x < pCanvas.width; x += cellSize) {
          pCtx.fillStyle = ((x + y) / cellSize) % 2 === 0 ? "#1a1d2a" : "#111318";
          pCtx.fillRect(x, y, cellSize, cellSize);
        }
      }
      pCtx.drawImage(canvas, 0, 0, pCanvas.width, pCanvas.height);
    }

    onReadyRef.current(canvas, "image/png", 1);
    setApplied(true);
  }, [imgData, samplePoint, tolerance]);

  const reset = useCallback(() => {
    setApplied(false);
    drawPreview();
  }, [drawPreview]);

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center cursor-pointer transition-colors ${isDragActive ? "border-amber-500 bg-amber-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
        <input {...getInputProps()} />
        <Upload className="w-6 h-6 text-white/50 mb-1" />
        <p className="text-xs text-center text-white/60">{imgData ? imgData.img.width + "x" + imgData.img.height : t("drag_drop_merge")}</p>
      </div>
      {imgData && (
        <>
          <div className="relative group">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">{t("bg_preview")}</p>
            <canvas ref={previewRef} className="w-full rounded-lg border border-white/10 shadow-inner" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{t("bg_sample_point")}</p>
            <div className="grid grid-cols-5 gap-1">
              {SAMPLE_POINTS.map(sp => (
                <button key={sp.id} onClick={() => { setSamplePoint(sp.id); setApplied(false); }} className={`py-1 rounded-md text-[10px] border transition-all ${samplePoint === sp.id ? "border-amber-500 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                  {t(sp.labelKey as any)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/50">
              <span>{t("bg_tolerance")}</span>
              <span className="text-amber-400 font-mono">{tolerance}</span>
            </div>
            <input type="range" min={5} max={150} value={tolerance} onChange={e => { setTolerance(+e.target.value); setApplied(false); }} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>
          <div className="flex gap-2 pt-1">
            {applied && (
              <Button onClick={reset} variant="outline" size="icon" className="border-white/10 bg-white/5 h-10 w-10 shrink-0">
                <RotateCcw className="w-4 h-4 text-white/60" />
              </Button>
            )}
            <Button onClick={applyRemoval} className={`flex-1 h-10 gap-2 font-bold shadow-lg transition-all ${applied ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gradient-to-r from-amber-600 to-orange-600 hover:scale-[1.02]"}`}>
              {applied ? <Check className="w-4 h-4" /> : <Eraser className="w-4 h-4" />}
              {applied ? t("done") : t("tool_bg_remove")}
            </Button>
          </div>
          <p className="text-[10px] text-white/30 text-center italic">{t("bg_download_png")}</p>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
