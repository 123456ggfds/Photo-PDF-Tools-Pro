import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

function formatBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(2) + " MB";
}

export function ToolCompress({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [image, setImage] = useState<{ url: string; img: HTMLImageElement; origSize: number } | null>(null);
  const [quality, setQuality] = useState(80);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onDrop = (files: File[]) => {
    if (!files[0]) return;
    const file = files[0];
    const origSize = file.size;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImage({ url, img, origSize });
    img.src = url;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  useEffect(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = image.img.width;
    canvas.height = image.img.height;
    ctx.drawImage(image.img, 0, 0);

    // Estimate output size from JPEG data URL
    const q = quality / 100;
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    const base64 = dataUrl.split(",")[1];
    const est = Math.round((base64.length * 3) / 4);
    setEstimatedSize(est);

    onReadyRef.current(canvas, "image/jpeg", q);
  }, [image, quality]);

  const ratio = image && estimatedSize ? Math.round((1 - estimatedSize / image.origSize) * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      {!image ? (
        <div {...getRootProps()} data-testid="dropzone-compress"
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-purple-500 bg-purple-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-white/50 mb-2" />
          <p className="text-sm text-center text-white/60">{t("upload_to_compress")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button variant="outline" size="sm" onClick={() => { setImage(null); setEstimatedSize(null); }} className="border-white/20">
            {t("change_image")}
          </Button>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">{t("quality")}</Label>
              <span className="text-xs text-white/40 tabular-nums">{quality}%</span>
            </div>
            <Slider value={[quality]} onValueChange={v => setQuality(v[0])} min={5} max={100} step={1} />
          </div>

          <div className="rounded-xl bg-white/5 border border-white/8 divide-y divide-white/5">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-white/50">{t("compress_original")}</span>
              <span className="text-sm font-medium text-white/80 tabular-nums">{formatBytes(image.origSize)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-white/50">{t("compress_output")}</span>
              <span className="text-sm font-medium text-blue-400 tabular-nums">{estimatedSize ? formatBytes(estimatedSize) : "—"}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-white/50">{t("compress_saved")}</span>
              <span className={`text-sm font-bold tabular-nums ${ratio !== null && ratio > 0 ? "text-green-400" : "text-white/40"}`}>
                {ratio !== null ? (ratio > 0 ? `-${ratio}%` : `+${Math.abs(ratio)}%`) : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
