import { useRef, useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Play, Check, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

export function ToolAutoPipeline({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [images, setImages] = useState<{ id: string; url: string; img: HTMLImageElement }[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = (file: File) => new Promise<{ id: string; url: string; img: HTMLImageElement }>(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ id: Math.random().toString(36).substr(2, 9), url, img });
    img.src = url;
  });

  const onDrop = useCallback(async (files: File[]) => {
    setDone(false);
    const loaded = await Promise.all(files.map(loadImage));
    setImages(prev => [...prev, ...loaded]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } });

  const runPipeline = async () => {
    if (!canvasRef.current || images.length === 0) return;
    setRunning(true);
    setDone(false);

    // 真正的處理邏輯：
    // 1. 批量縮放（如果太大）
    // 2. 自動網格佈局
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const count = images.length;
    const gap = 20;

    // 找出統一的最大尺寸以利網格對齊
    const maxW = Math.min(Math.max(...images.map(i => i.img.width)), 1200);
    const maxH = Math.min(Math.max(...images.map(i => i.img.height)), 1200);

    const cols = count <= 3 ? count : Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    canvas.width = cols * maxW + (cols - 1) * gap;
    canvas.height = rows * maxH + (rows - 1) * gap;

    // 填充背景
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    images.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = col * (maxW + gap);
      const y = row * (maxH + gap);

      // 保持比例繪製到單元格中
      const img = item.img;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (maxW - drawW) / 2;
      const offsetY = (maxH - drawH) / 2;

      ctx.drawImage(img, x + offsetX, y + offsetY, drawW, drawH);
    });

    onReadyRef.current(canvas, "image/jpeg", 0.9);
    setRunning(false);
    setDone(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragActive ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-white/30 mb-2" />
        <p className="text-xs text-white/50">{t("drag_drop")}</p>
        {images.length > 0 && (
          <p className="text-xs text-violet-400 mt-2 font-bold">{images.length} {t("images_ready")}</p>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1">
          {images.map(img => (
            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
              <img src={img.url} className="w-full h-full object-cover" alt="" />
              <button
                onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter(i => i.id !== img.id)); }}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={runPipeline}
        disabled={images.length === 0 || running}
        className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:scale-[1.02] transition-transform text-white font-bold gap-2 rounded-xl"
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {running ? t("processing") : t("pipeline_run")}
      </Button>

      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <p className="text-[10px] text-white/40 leading-relaxed italic">
          {t("pipeline_hint")}
        </p>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
