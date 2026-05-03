import { useEffect, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

export function ToolWatermark({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [image, setImage] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [text, setText] = useState(t("watermark_default_text") || "© My Photo");
  const [opacity, setOpacity] = useState(70);
  const [fontSize, setFontSize] = useState(48);
  const [position, setPosition] = useState(8);
  const [tiled, setTiled] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const url = URL.createObjectURL(files[0]);
    const img = new Image();
    img.onload = () => setImage({ url, img });
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  useEffect(() => {
    if (!canvasRef.current || !image || !text.trim()) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = image.img.width;
    canvas.height = image.img.height;
    ctx.drawImage(image.img, 0, 0);

    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";

    const pad = fontSize * 0.8;
    const textW = ctx.measureText(text).width;

    if (tiled) {
      ctx.save();
      ctx.rotate(-Math.PI / 6);
      const stepX = textW + fontSize * 3;
      const stepY = fontSize * 4;
      for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
    } else {
      const col = position % 3;
      const row = Math.floor(position / 3);
      let x: number, y: number;
      if (col === 0) { ctx.textAlign = "left"; x = pad; }
      else if (col === 1) { ctx.textAlign = "center"; x = canvas.width / 2; }
      else { ctx.textAlign = "right"; x = canvas.width - pad; }
      if (row === 0) y = pad + fontSize / 2;
      else if (row === 1) y = canvas.height / 2;
      else y = canvas.height - pad - fontSize / 2;
      ctx.fillText(text, x, y);
    }

    ctx.globalAlpha = 1;
    onReadyRef.current(canvas);
  }, [image, text, opacity, fontSize, position, tiled, color]);

  return (
    <div className="flex flex-col gap-5">
      {!image ? (
        <div {...getRootProps()} data-testid="dropzone-watermark"
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-white/50 mb-2" />
          <p className="text-sm text-center text-white/60">{t("drag_drop")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Button variant="outline" size="sm" onClick={() => setImage(null)} className="border-white/20">{t("change_image")}</Button>

          <div className="space-y-2">
            <Label className="text-sm">{t("watermark_text")}</Label>
            <Input value={text} onChange={e => setText(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
          </div>

          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{t("watermark_position")}</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }, (_, i) => (
                <button key={i} onClick={() => setPosition(i)}
                  className={`h-10 rounded-lg border transition-all ${position === i ? "border-cyan-500 bg-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "border-white/10 hover:border-white/30"}`} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">{t("watermark_opacity")}</Label>
              <span className="text-xs text-white/40 tabular-nums">{opacity}%</span>
            </div>
            <Slider value={[opacity]} onValueChange={v => setOpacity(v[0])} min={10} max={100} step={1} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">{t("watermark_size")}</Label>
              <span className="text-xs text-white/40 tabular-nums">{fontSize}px</span>
            </div>
            <Slider value={[fontSize]} onValueChange={v => setFontSize(v[0])} min={12} max={200} step={2} />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm flex-1">{t("watermark_color")}</Label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5" />
            <span className="text-xs text-white/40 font-mono">{color}</span>
          </div>

          <button onClick={() => setTiled(v => !v)}
            className={`flex items-center justify-center gap-2 text-sm rounded-lg px-3 py-2 border transition-colors ${tiled ? "border-cyan-500 text-cyan-400 bg-cyan-500/10" : "border-white/20 text-white/50 hover:border-white/40"}`}>
            {t("watermark_tile")}
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
