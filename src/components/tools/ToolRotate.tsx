import { useEffect, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

export function ToolRotate({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [image, setImage] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const url = URL.createObjectURL(files[0]);
    const img = new Image();
    img.onload = () => { setImage({ url, img }); setRotation(0); setFlipH(false); setFlipV(false); };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  useEffect(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    canvas.width = Math.round(image.img.width * cos + image.img.height * sin);
    canvas.height = Math.round(image.img.width * sin + image.img.height * cos);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(image.img, -image.img.width / 2, -image.img.height / 2);
    ctx.restore();
    onReadyRef.current(canvas);
  }, [image, rotation, flipH, flipV]);

  const flipState = [flipH && t("flip_h"), flipV && t("flip_v")].filter(Boolean).join(" + ") || t("none");

  return (
    <div className="flex flex-col gap-5">
      {!image ? (
        <div {...getRootProps()} data-testid="dropzone-rotate"
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-yellow-500 bg-yellow-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-white/50 mb-2" />
          <p className="text-sm text-center text-white/60">{t("drag_drop")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Button variant="outline" size="sm" onClick={() => setImage(null)} className="border-white/20">{t("change_image")}</Button>

          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">{t("rotate_title")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setRotation(r => (r - 90 + 360) % 360)} className="border-white/20 gap-2">
                <RotateCcw className="w-4 h-4" /> {t("rotate_ccw")}
              </Button>
              <Button variant="outline" onClick={() => setRotation(r => (r + 90) % 360)} className="border-white/20 gap-2">
                <RotateCw className="w-4 h-4" /> {t("rotate_cw")}
              </Button>
              <Button variant="outline" onClick={() => setRotation(r => (r + 180) % 360)} className="border-white/20 col-span-2">
                180°
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">{t("flip_title")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={flipH ? "default" : "outline"} onClick={() => setFlipH(v => !v)}
                className={flipH ? "bg-gradient-to-r from-yellow-400 to-orange-500 border-0 gap-2" : "border-white/20 gap-2"}>
                <FlipHorizontal className="w-4 h-4" /> {t("flip_h")}
              </Button>
              <Button variant={flipV ? "default" : "outline"} onClick={() => setFlipV(v => !v)}
                className={flipV ? "bg-gradient-to-r from-yellow-400 to-orange-500 border-0 gap-2" : "border-white/20 gap-2"}>
                <FlipVertical className="w-4 h-4" /> {t("flip_v")}
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/8 divide-y divide-white/5">
            <div className="flex justify-between px-4 py-3">
              <span className="text-xs text-white/50">{t("rotate_current")}</span>
              <span className="text-sm text-white/80 tabular-nums">{rotation}°</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-xs text-white/50">{t("flip_state")}</span>
              <span className="text-sm text-white/80">{flipState}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => { setRotation(0); setFlipH(false); setFlipV(false); }} className="border-white/20">
            {t("reset")}
          </Button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
