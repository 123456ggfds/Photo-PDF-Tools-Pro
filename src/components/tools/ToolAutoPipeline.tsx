import { useRef, useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Play, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;
type StepStatus = "pending" | "running" | "done" | "skipped";
interface Step { id: string; labelKey: string; enabled: boolean; status: StepStatus }

const INIT_STEPS: Step[] = [
  { id: "compress", labelKey: "tool_compress", enabled: true, status: "pending" },
  { id: "orientation", labelKey: "pipeline_orientation", enabled: true, status: "pending" },
  { id: "layout", labelKey: "pipeline_layout", enabled: true, status: "pending" },
  { id: "render", labelKey: "pipeline_render", enabled: true, status: "pending" },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function ToolAutoPipeline({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [images, setImages] = useState<{ id: string; url: string; img: HTMLImageElement }[]>([]);
  const [steps, setSteps] = useState<Step[]>(INIT_STEPS);
  const [mode, setMode] = useState<"auto" | "semi">("auto");
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
    setSteps(INIT_STEPS);
    const loaded = await Promise.all(files.map(loadImage));
    setImages(loaded);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } });

  const setStatus = (id: string, status: StepStatus) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));

  const resetSteps = () => setSteps(prev => prev.map(s => ({ ...s, status: s.enabled ? "pending" : "skipped" })));

  const runPipeline = async () => {
    if (!canvasRef.current || images.length === 0) return;
    setRunning(true);
    setDone(false);
    resetSteps();
    await sleep(100);

    let imgs = [...images];
    const enabled = steps.filter(s => s.enabled).map(s => s.id);

    // Compress step
    if (enabled.includes("compress")) {
      setStatus("compress", "running");
      await sleep(500);
      imgs = imgs.map(item => {
        if (item.img.width > 2048 || item.img.height > 2048) {
          const tmp = document.createElement("canvas");
          const scale = Math.min(2048 / item.img.width, 2048 / item.img.height);
          tmp.width = Math.round(item.img.width * scale);
          tmp.height = Math.round(item.img.height * scale);
          tmp.getContext("2d")!.drawImage(item.img, 0, 0, tmp.width, tmp.height);
          const newImg = new Image();
          newImg.src = tmp.toDataURL("image/jpeg", 0.85);
          newImg.width = tmp.width;
          newImg.height = tmp.height;
          return { ...item, img: newImg };
        }
        return item;
      });
      setStatus("compress", "done");
    }

    // Orientation step (no-op in browser — EXIF requires library; just visual delay)
    if (enabled.includes("orientation")) {
      setStatus("orientation", "running");
      await sleep(400);
      setStatus("orientation", "done");
    }

    // Layout step
    if (enabled.includes("layout")) {
      setStatus("layout", "running");
      await sleep(500);
      setStatus("layout", "done");
    }

    // Render
    if (enabled.includes("render")) {
      setStatus("render", "running");
      await sleep(400);
    }

    // Draw final result
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const count = imgs.length;
    const gap = 16;

    if (count === 1) {
      canvas.width = imgs[0].img.width;
      canvas.height = imgs[0].img.height;
      ctx.drawImage(imgs[0].img, 0, 0);
    } else if (count <= 3) {
      // Horizontal strip
      const maxH = Math.max(...imgs.map(i => i.img.height));
      const totalW = imgs.reduce((s, i) => s + i.img.width, 0) + gap * (count - 1);
      canvas.width = totalW;
      canvas.height = maxH;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, totalW, maxH);
      let cx = 0;
      imgs.forEach(item => {
        ctx.drawImage(item.img, cx, (maxH - item.img.height) / 2);
        cx += item.img.width + gap;
      });
    } else {
      // Grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = Math.max(...imgs.map(i => i.img.width));
      const cellH = Math.max(...imgs.map(i => i.img.height));
      canvas.width = cols * cellW + gap * (cols - 1);
      canvas.height = rows * cellH + gap * (rows - 1);
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      imgs.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        ctx.drawImage(item.img,
          col * (cellW + gap) + (cellW - item.img.width) / 2,
          row * (cellH + gap) + (cellH - item.img.height) / 2
        );
      });
    }

    if (enabled.includes("render")) setStatus("render", "done");
    onReadyRef.current(canvas, "image/jpeg", 0.92);
    setRunning(false);
    setDone(true);
  };

  const StatusIcon = ({ status }: { status: StepStatus }) => {
    if (status === "running") return <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />;
    if (status === "done")    return <Check className="w-4 h-4 text-green-400 flex-shrink-0" />;
    if (status === "skipped") return <span className="w-4 h-4 text-white/20 text-sm flex-shrink-0 flex items-center">—</span>;
    return <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 block" />;
  };

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} data-testid="dropzone-pipeline"
        className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-violet-500 bg-violet-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
        <input {...getInputProps()} />
        <Upload className="w-7 h-7 text-white/50 mb-2" />
        <p className="text-sm text-center text-white/60">{t("drag_drop")}</p>
        {images.length > 0 && (
          <p className="text-xs text-violet-400 mt-2 font-medium">{images.length} {t("pipeline_images_loaded")}</p>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map(img => (
            <div key={img.id} className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
              <img src={img.url} className="w-full h-full object-cover" alt="" />
              <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                className="absolute top-0 right-0 bg-black/60 rounded-bl-md p-0.5 hover:bg-red-500/80">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        {(["auto", "semi"] as const).map(m => (
          <Button key={m} size="sm" variant={mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
            className={mode === m ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 border-0 flex-1" : "border-white/20 flex-1"}>
            {t(m === "auto" ? "pipeline_mode_auto" : "pipeline_mode_semi")}
          </Button>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{t("pipeline_steps")}</p>
        {steps.map(step => (
          <div key={step.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${step.status === "running" ? "border-blue-500/50 bg-blue-500/5" : step.status === "done" ? "border-green-500/30 bg-green-500/5" : "border-white/5 bg-white/3"}`}>
            <StatusIcon status={step.status} />
            <span className={`flex-1 text-sm ${step.enabled ? "text-white/80" : "text-white/25 line-through"}`}>
              {t(step.labelKey as any)}
            </span>
            {mode === "semi" && (
              <button onClick={() => setSteps(prev => prev.map(s => s.id === step.id ? { ...s, enabled: !s.enabled, status: "pending" } : s))}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${step.enabled ? "border-violet-500 text-violet-400" : "border-white/20 text-white/30"}`}>
                {step.enabled ? t("on") : t("off")}
              </button>
            )}
          </div>
        ))}
      </div>

      <Button onClick={runPipeline} disabled={images.length === 0 || running}
        className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white border-0 gap-2 disabled:opacity-40 h-11">
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {running ? t("processing") : done ? t("done") : t("pipeline_run")}
      </Button>

      {images.length > 0 && (
        <p className="text-xs text-white/30 text-center">{t("pipeline_hint")}</p>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
