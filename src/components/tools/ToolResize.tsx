import { useEffect, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

const PRESETS = [
  { labelKey: "preset_instagram_square", w: 1080, h: 1080 },
  { labelKey: "preset_story", w: 1080, h: 1920 },
  { labelKey: "preset_youtube", w: 1280, h: 720 },
  { labelKey: "preset_twitter", w: 1500, h: 500 },
];

export function ToolResize({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [image, setImage] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockRatio, setLockRatio] = useState(true);
  const [mode, setMode] = useState<"exact" | "fit" | "fill">("exact");
  const origRef = useRef({ w: 1, h: 1 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const url = URL.createObjectURL(files[0]);
    const img = new Image();
    img.onload = () => {
      origRef.current = { w: img.width, h: img.height };
      setImage({ url, img });
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  const handleW = (v: number) => {
    setWidth(v);
    if (lockRatio) setHeight(Math.max(1, Math.round(v * origRef.current.h / origRef.current.w)));
  };
  const handleH = (v: number) => {
    setHeight(v);
    if (lockRatio) setWidth(Math.max(1, Math.round(v * origRef.current.w / origRef.current.h)));
  };

  useEffect(() => {
    if (!canvasRef.current || !image || width < 1 || height < 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (mode === "exact") {
      ctx.drawImage(image.img, 0, 0, width, height);
    } else if (mode === "fit") {
      const scale = Math.min(width / image.img.width, height / image.img.height);
      const dw = image.img.width * scale;
      const dh = image.img.height * scale;
      ctx.drawImage(image.img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    } else {
      const scale = Math.max(width / image.img.width, height / image.img.height);
      const dw = image.img.width * scale;
      const dh = image.img.height * scale;
      ctx.drawImage(image.img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    }
    onReadyRef.current(canvas);
  }, [image, width, height, mode]);

  const modes: Array<{ key: "exact" | "fit" | "fill"; labelKey: string }> = [
    { key: "exact", labelKey: "resize_mode_exact" },
    { key: "fit", labelKey: "resize_mode_fit" },
    { key: "fill", labelKey: "resize_mode_fill" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {!image ? (
        <div {...getRootProps()} data-testid="dropzone-resize"
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-orange-500 bg-orange-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-white/50 mb-2" />
          <p className="text-sm text-center text-white/60">{t("drag_drop")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button variant="outline" size="sm" onClick={() => setImage(null)} className="border-white/20">{t("change_image")}</Button>
          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{t("resize_presets")}</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map(p => (
                <Button key={p.labelKey} variant="outline" size="sm" className="border-white/20 text-xs" onClick={() => { setWidth(p.w); setHeight(p.h); }}>
                  {t(p.labelKey as any)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-white/50">{t("width")} (px)</Label>
              <Input type="number" value={width} min={1} max={8000} onChange={e => handleW(Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-9" />
            </div>
            <button onClick={() => setLockRatio(v => !v)} className={`mb-0.5 p-2 rounded-lg border text-base transition-colors ${lockRatio ? "border-blue-500 bg-blue-500/10" : "border-white/20 text-white/30"}`}>
              {lockRatio ? "🔒" : "🔓"}
            </button>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-white/50">{t("height")} (px)</Label>
              <Input type="number" value={height} min={1} max={8000} onChange={e => handleH(Number(e.target.value))} className="bg-white/5 border-white/10 text-white h-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{t("resize_mode")}</Label>
            <div className="flex gap-1.5">
              {modes.map(({ key, labelKey }) => (
                <Button key={key} size="sm" variant={mode === key ? "default" : "outline"} onClick={() => setMode(key)} className={mode === key ? "bg-gradient-to-r from-orange-500 to-red-500 border-0 flex-1" : "border-white/20 flex-1 text-xs"}>
                  {t(labelKey as any)}
                </Button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/8 px-4 py-3 text-xs text-white/50 flex justify-between">
            <span>{t("resize_mode")}</span>
            <span className="text-white/70 tabular-nums">{width} × {height} px</span>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
