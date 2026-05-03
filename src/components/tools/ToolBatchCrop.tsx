import { useRef, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Scissors, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

interface LoadedImage {
  id: string;
  url: string;
  img: HTMLImageElement;
  name: string;
}

const RATIOS = [
  { labelKey: "batch_ratio_free", value: 0 },
  { labelKey: "batch_ratio_11", value: 1 },
  { labelKey: "batch_ratio_43", value: 4 / 3 },
  { labelKey: "batch_ratio_169", value: 16 / 9 },
  { labelKey: "batch_ratio_32", value: 3 / 2 },
  { labelKey: "batch_ratio_34", value: 3 / 4 },
];

export function ToolBatchCrop({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [images, setImages] = useState<LoadedImage[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ratio, setRatio] = useState(0);
  const [cropX, setCropX] = useState(10);
  const [cropY, setCropY] = useState(10);
  const [cropW, setCropW] = useState(80);
  const [cropH, setCropH] = useState(80);
  const [processed, setProcessed] = useState<string[]>([]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = (file: File) => new Promise<LoadedImage>(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ id: Math.random().toString(36).slice(2), url, img, name: file.name });
    img.src = url;
  });

  const onDrop = async (files: File[]) => {
    const loaded = await Promise.all(files.map(loadImage));
    setImages(prev => [...prev, ...loaded]);
    setProcessed([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } });

  const applyRatio = (w: number) => {
    if (ratio === 0) return cropH;
    return Math.min(Math.round(w / ratio), 90);
  };

  const drawPreview = () => {
    const canvas = previewCanvasRef.current;
    const img = images[currentIdx]?.img;
    if (!canvas || !img) return;
    const maxW = 260;
    const scale = maxW / img.width;
    canvas.width = maxW;
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const px = (v: number, dim: number) => (v / 100) * dim;
    const ox = px(cropX, canvas.width);
    const oy = px(cropY, canvas.height);
    const ow = px(cropW, canvas.width);
    const oh = px(cropH, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(ox, oy, ow, oh);
    ctx.drawImage(img, px(cropX, img.width), px(cropY, img.height), px(cropW, img.width), px(cropH, img.height), ox, oy, ow, oh);
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, ow, oh);
    const third = { w: ow / 3, h: oh / 3 };
    ctx.strokeStyle = "rgba(139,92,246,0.4)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(ox + third.w * i, oy); ctx.lineTo(ox + third.w * i, oy + oh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, oy + third.h * i); ctx.lineTo(ox + ow, oy + third.h * i); ctx.stroke();
    }
  };

  useEffect(() => { drawPreview(); }, [images, currentIdx, cropX, cropY, cropW, cropH]);

  const applyToAll = () => {
    const urls: string[] = [];
    images.forEach(item => {
      const c = outputCanvasRef.current!;
      const img = item.img;
      const sx = (cropX / 100) * img.width;
      const sy = (cropY / 100) * img.height;
      const sw = (cropW / 100) * img.width;
      const sh = (cropH / 100) * img.height;
      c.width = sw;
      c.height = sh;
      c.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      urls.push(c.toDataURL("image/jpeg", 0.92));
    });
    setProcessed(urls);
    const c = outputCanvasRef.current!;
    const first = images[0];
    if (!first) return;
    const img = first.img;
    c.width = (cropW / 100) * img.width;
    c.height = (cropH / 100) * img.height;
    c.getContext("2d")!.drawImage(img, (cropX / 100) * img.width, (cropY / 100) * img.height, c.width, c.height, 0, 0, c.width, c.height);
    onReadyRef.current(c, "image/jpeg", 0.92);
  };

  const downloadAll = () => {
    processed.forEach((url, i) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch-crop-${i + 1}.jpg`;
      a.click();
    });
  };

  const handleCropWChange = (val: number) => {
    setCropW(val);
    if (ratio !== 0) setCropH(Math.min(applyRatio(val), 100 - cropY));
  };

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center cursor-pointer transition-colors ${isDragActive ? "border-emerald-500 bg-emerald-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
        <input {...getInputProps()} />
        <Upload className="w-6 h-6 text-white/50 mb-1" />
        <p className="text-xs text-center text-white/60">{t("drag_drop_merge")}</p>
        {images.length > 0 && <p className="text-xs text-emerald-400 mt-1 font-medium">{images.length} {t("pipeline_images_loaded")}</p>}
      </div>
      {images.length > 0 && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {images.map((img, i) => (
              <div key={img.id} className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${i === currentIdx ? "border-violet-500" : "border-white/10"}`} onClick={() => setCurrentIdx(i)}>
                <img src={img.url} className="w-full h-full object-cover" alt="" />
                <button onClick={e => { e.stopPropagation(); setImages(prev => prev.filter(x => x.id !== img.id)); setCurrentIdx(0); }} className="absolute top-0 right-0 bg-black/60 p-0.5 rounded-bl-md hover:bg-red-500/80"><X className="w-3 h-3 text-white" /></button>
              </div>
            ))}
          </div>
          <canvas ref={previewCanvasRef} className="w-full rounded-lg border border-white/10" />
          <div className="flex gap-1.5 flex-wrap">
            {RATIOS.map(r => (
              <button key={r.labelKey} onClick={() => { setRatio(r.value); if (r.value !== 0) setCropH(Math.min(applyRatio(cropW), 100 - cropY)); }} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${ratio === r.value ? "border-violet-500 text-violet-400 bg-violet-500/10" : "border-white/20 text-white/50 hover:border-white/40"}`}>
                {t(r.labelKey as any)}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { label: `X: ${cropX}%`, value: cropX, set: setCropX, min: 0, max: 80 },
              { label: `Y: ${cropY}%`, value: cropY, set: setCropY, min: 0, max: 80 },
              { label: `W: ${cropW}%`, value: cropW, set: handleCropWChange, min: 10, max: 100 - cropX },
              { label: `H: ${cropH}%`, value: cropH, set: setCropH, min: 10, max: 100 - cropY, disabled: ratio !== 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-xs text-white/50 mb-1"><span>{s.label}</span></div>
                <input type="range" min={s.min} max={s.max} value={s.value} disabled={s.disabled} onChange={e => s.set(+e.target.value)} className="w-full accent-violet-500 disabled:opacity-40" />
              </div>
            ))}
          </div>
          {processed.length === 0 ? (
            <Button onClick={applyToAll} className="bg-gradient-to-r from-emerald-600 to-teal-500 border-0 gap-2 h-11">
              <Scissors className="w-4 h-4" /> {t("batch_apply")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={applyToAll} variant="outline" className="border-white/20 flex-1 gap-2"><Scissors className="w-4 h-4" /> {t("batch_reapply")}</Button>
              <Button onClick={downloadAll} className="bg-gradient-to-r from-emerald-600 to-teal-500 border-0 flex-1 gap-2"><Check className="w-4 h-4" /> {t("batch_download_all")}</Button>
            </div>
          )}
        </>
      )}
      <canvas ref={outputCanvasRef} className="hidden" />
    </div>
  );
}
