import { useEffect, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;
interface Adj { brightness: number; contrast: number; saturation: number; exposure: number; temperature: number }
const DEFAULT: Adj = { brightness: 100, contrast: 100, saturation: 100, exposure: 100, temperature: 0 };

export function ToolAdjustments({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [image, setImage] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [adj, setAdj] = useState<Adj>(DEFAULT);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const url = URL.createObjectURL(files[0]);
    const img = new Image();
    img.onload = () => { setImage({ url, img }); setAdj(DEFAULT); };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  useEffect(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = image.img.width;
    canvas.height = image.img.height;

    const bVal = (adj.brightness / 100) * (adj.exposure / 100);
    const hueRot = adj.temperature > 0
      ? `hue-rotate(${adj.temperature * 0.15}deg) sepia(${adj.temperature * 0.3}%)`
      : `hue-rotate(${adj.temperature * 0.15}deg)`;

    ctx.filter = `brightness(${bVal}) contrast(${adj.contrast}%) saturate(${adj.saturation}%) ${hueRot}`;
    ctx.drawImage(image.img, 0, 0);
    ctx.filter = "none";
    onReadyRef.current(canvas);
  }, [image, adj]);

  const set = (key: keyof Adj, value: number) => setAdj(prev => ({ ...prev, [key]: value }));

  const sliders: Array<{ key: keyof Adj; labelKey: string; min: number; max: number; center?: number }> = [
    { key: "brightness", labelKey: "adj_brightness", min: 0, max: 200, center: 100 },
    { key: "contrast", labelKey: "adj_contrast", min: 0, max: 200, center: 100 },
    { key: "saturation", labelKey: "adj_saturation", min: 0, max: 200, center: 100 },
    { key: "exposure", labelKey: "adj_exposure", min: 10, max: 300, center: 100 },
    { key: "temperature", labelKey: "adj_temperature", min: -100, max: 100, center: 0 },
  ];

  const displayVal = (key: keyof Adj, val: number) => {
    if (key === "temperature") return (val > 0 ? "+" : "") + val;
    return val + "%";
  };

  const isModified = JSON.stringify(adj) !== JSON.stringify(DEFAULT);

  return (
    <div className="flex flex-col gap-5">
      {!image ? (
        <div {...getRootProps()} data-testid="dropzone-adjustments"
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-pink-500 bg-pink-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-white/50 mb-2" />
          <p className="text-sm text-center text-white/60">{t("drag_drop")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImage(null)} className="border-white/20 flex-1">{t("change_image")}</Button>
            {isModified && (
              <Button variant="outline" size="sm" onClick={() => setAdj(DEFAULT)} className="border-white/20 flex-1">{t("reset")}</Button>
            )}
          </div>

          <div className="space-y-5">
            {sliders.map(({ key, labelKey, min, max }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">{t(labelKey as any)}</Label>
                  <span className={`text-xs tabular-nums font-medium ${adj[key] !== DEFAULT[key] ? "text-pink-400" : "text-white/40"}`}>
                    {displayVal(key, adj[key])}
                  </span>
                </div>
                <Slider value={[adj[key]]} onValueChange={v => set(key, v[0])} min={min} max={max} step={1} />
              </div>
            ))}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
