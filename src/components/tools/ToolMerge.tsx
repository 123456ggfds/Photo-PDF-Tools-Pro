import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

export function ToolMerge({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [images, setImages] = useState<{ id: string; url: string; img: HTMLImageElement }[]>([]);
  const [gap, setGap] = useState(20);
  const [direction, setDirection] = useState<"vertical" | "horizontal" | "grid">("vertical");
  const [padding, setPadding] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const newImages = await Promise.all(
      acceptedFiles.map(file => new Promise<{ id: string; url: string; img: HTMLImageElement }>(resolve => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve({ id: Math.random().toString(36).substr(2, 9), url, img });
        img.src = url;
      }))
    );
    setImages(prev => [...prev, ...newImages]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } });

  useEffect(() => {
    if (!canvasRef.current || images.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let totalWidth = padding * 2;
    let totalHeight = padding * 2;

    if (direction === "vertical") {
      const maxWidth = Math.max(...images.map(i => i.img.width));
      totalWidth += maxWidth;
      totalHeight += images.reduce((acc, i) => acc + i.img.height, 0) + gap * (images.length - 1);
    } else if (direction === "horizontal") {
      const maxHeight = Math.max(...images.map(i => i.img.height));
      totalHeight += maxHeight;
      totalWidth += images.reduce((acc, i) => acc + i.img.width, 0) + gap * (images.length - 1);
    } else {
      const cols = Math.ceil(Math.sqrt(images.length));
      const rows = Math.ceil(images.length / cols);
      const maxW = Math.max(...images.map(i => i.img.width));
      const maxH = Math.max(...images.map(i => i.img.height));
      totalWidth += cols * maxW + gap * (cols - 1);
      totalHeight += rows * maxH + gap * (rows - 1);
    }

    canvas.width = Math.max(1, totalWidth);
    canvas.height = Math.max(1, totalHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let cx = padding, cy = padding;
    if (direction === "vertical") {
      images.forEach(i => { ctx.drawImage(i.img, cx, cy); cy += i.img.height + gap; });
    } else if (direction === "horizontal") {
      images.forEach(i => { ctx.drawImage(i.img, cx, cy); cx += i.img.width + gap; });
    } else {
      const cols = Math.ceil(Math.sqrt(images.length));
      const maxW = Math.max(...images.map(i => i.img.width));
      const maxH = Math.max(...images.map(i => i.img.height));
      images.forEach((im, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        ctx.drawImage(im.img, padding + col * (maxW + gap), padding + row * (maxH + gap));
      });
    }
    onReadyRef.current(canvas);
  }, [images, gap, direction, padding]);

  const dirs: Array<{ key: "vertical" | "horizontal" | "grid"; label: string }> = [
    { key: "vertical", label: t("vertical") },
    { key: "horizontal", label: t("horizontal") },
    { key: "grid", label: t("grid") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div {...getRootProps()} data-testid="dropzone-merge"
        className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
        <input {...getInputProps()} />
        <Upload className="w-7 h-7 text-white/50 mb-2" />
        <p className="text-sm text-center text-white/60">{t("drag_drop_merge")}</p>
      </div>

      {images.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map(img => (
              <div key={img.id} className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
                <img src={img.url} className="w-full h-full object-cover" alt="" />
                <button data-testid={`remove-image-${img.id}`}
                  onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                  className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 hover:bg-red-500/80">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{t("direction")}</Label>
            <div className="flex gap-1.5">
              {dirs.map(({ key, label }) => (
                <Button key={key} data-testid={`direction-${key}`} size="sm"
                  variant={direction === key ? "default" : "outline"}
                  onClick={() => setDirection(key)}
                  className={direction === key ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 flex-1" : "border-white/20 flex-1 text-xs"}>
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t("gap")}</Label>
                <span className="text-xs text-white/40 tabular-nums">{gap}px</span>
              </div>
              <Slider value={[gap]} onValueChange={v => setGap(v[0])} max={100} step={1} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">{t("padding")}</Label>
                <span className="text-xs text-white/40 tabular-nums">{padding}px</span>
              </div>
              <Slider value={[padding]} onValueChange={v => setPadding(v[0])} max={100} step={1} />
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
