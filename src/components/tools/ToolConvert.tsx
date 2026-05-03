import { useEffect, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type Format = "image/jpeg" | "image/png" | "image/webp";
type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

export function ToolConvert({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [image, setImage] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [bgColor, setBgColor] = useState("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const url = URL.createObjectURL(files[0]);
    const img = new Image();
    img.onload = () => setImage({ url, img });
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (format === "image/jpeg") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image.img, 0, 0);
    onReadyRef.current(canvas, format, quality / 100);
  }, [image, format, bgColor, quality]);

  const fmtLabel = (f: Format) => f === "image/jpeg" ? "JPG" : f === "image/png" ? "PNG" : "WEBP";
  const formats: Format[] = ["image/jpeg", "image/png", "image/webp"];

  return (
    <div className="flex flex-col gap-5">
      {!image ? (
        <div {...getRootProps()} data-testid="dropzone-convert"
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-white/50 mb-2" />
          <p className="text-sm text-center text-white/60">{t("drag_drop")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Button variant="outline" size="sm" onClick={() => setImage(null)} className="border-white/20">{t("change_image")}</Button>

          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{t("convert_format")}</Label>
            <div className="flex gap-1.5">
              {formats.map(f => (
                <Button key={f} size="sm" variant={format === f ? "default" : "outline"}
                  onClick={() => setFormat(f)}
                  className={format === f ? "bg-gradient-to-r from-indigo-500 to-purple-500 border-0 flex-1" : "border-white/20 flex-1"}>
                  {fmtLabel(f)}
                </Button>
              ))}
            </div>
          </div>

          {format !== "image/png" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t("quality")}</Label>
                <span className="text-xs text-white/40 tabular-nums">{quality}%</span>
              </div>
              <Slider value={[quality]} onValueChange={v => setQuality(v[0])} min={10} max={100} step={1} />
            </div>
          )}

          {format === "image/jpeg" && (
            <div className="flex items-center gap-3">
              <Label className="text-sm flex-1">{t("convert_bg")}</Label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5" />
              <span className="text-xs text-white/40 tabular-nums font-mono">{bgColor}</span>
            </div>
          )}

          <div className="rounded-xl bg-white/5 border border-white/8 divide-y divide-white/5">
            <div className="flex justify-between px-4 py-3">
              <span className="text-xs text-white/50">{t("convert_from")}</span>
              <span className="text-sm text-white/80 tabular-nums">{image.img.width} × {image.img.height}px</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-xs text-white/50">{t("convert_to")}</span>
              <span className="text-sm text-white/80">{fmtLabel(format)}{format !== "image/png" ? ` · ${quality}%` : ""}</span>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
