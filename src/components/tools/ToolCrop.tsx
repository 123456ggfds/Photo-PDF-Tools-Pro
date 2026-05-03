import { useEffect, useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

const RATIOS = [
  { labelKey: "crop_free", w: 0, h: 0 },
  { labelKey: "crop_ratio_11", w: 1, h: 1 },
  { labelKey: "crop_ratio_43", w: 4, h: 3 },
  { labelKey: "crop_ratio_169", w: 16, h: 9 },
  { labelKey: "crop_ratio_34", w: 3, h: 4 },
  { labelKey: "crop_ratio_916", w: 9, h: 16 },
];

interface Box { x: number; y: number; w: number; h: number }

export function ToolCrop({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [image, setImage] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [showGrid, setShowGrid] = useState(true);
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 100, h: 100 });
  const displayRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ mode: string; sx: number; sy: number; orig: Box } | null>(null);
  const scaleRef = useRef(1);

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return;
    const url = URL.createObjectURL(files[0]);
    const img = new Image();
    img.onload = () => {
      setImage({ url, img });
      const initBox: Box = { x: img.width * 0.1, y: img.height * 0.1, w: img.width * 0.8, h: img.height * 0.8 };
      setBox(initBox);
    };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  const commitCrop = useCallback((b: Box, img: HTMLImageElement) => {
    const out = outputRef.current;
    if (!out) return;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const sw = Math.max(1, Math.round(b.w));
    const sh = Math.max(1, Math.round(b.h));
    out.width = sw;
    out.height = sh;
    ctx.drawImage(img, b.x, b.y, sw, sh, 0, 0, sw, sh);
    onReadyRef.current(out);
  }, []);

  const drawDisplay = useCallback((b: Box) => {
    const disp = displayRef.current;
    if (!disp || !image) return;
    const containerW = disp.parentElement?.clientWidth ?? 260;
    const scale = Math.min(1, containerW / image.img.width);
    scaleRef.current = scale;
    const dw = Math.round(image.img.width * scale);
    const dh = Math.round(image.img.height * scale);
    disp.width = dw;
    disp.height = dh;
    const ctx = disp.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image.img, 0, 0, dw, dh);

    const sb = { x: b.x * scale, y: b.y * scale, w: b.w * scale, h: b.h * scale };
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, dw, dh);
    ctx.clearRect(sb.x, sb.y, sb.w, sb.h);
    ctx.drawImage(image.img, b.x, b.y, b.w, b.h, sb.x, sb.y, sb.w, sb.h);
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    ctx.strokeRect(sb.x, sb.y, sb.w, sb.h);

    if (showGrid) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(sb.x + sb.w * i / 3, sb.y); ctx.lineTo(sb.x + sb.w * i / 3, sb.y + sb.h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sb.x, sb.y + sb.h * i / 3); ctx.lineTo(sb.x + sb.w, sb.y + sb.h * i / 3); ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    const corners = [[sb.x, sb.y], [sb.x + sb.w, sb.y], [sb.x + sb.w, sb.y + sb.h], [sb.x, sb.y + sb.h]];
    corners.forEach(([hx, hy]) => {
      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(hx - 5, hy - 5, 10, 10);
    });
  }, [image, showGrid]);

  useEffect(() => { if (image) { drawDisplay(box); commitCrop(box, image.img); } }, [image, box, showGrid, drawDisplay, commitCrop]);

  const applyRatioToBox = useCallback((r: typeof ratio, b: Box, img: HTMLImageElement): Box => {
    if (r.w === 0) return b;
    const aspect = r.w / r.h;
    const newW = Math.min(b.w, img.width);
    const newH = newW / aspect;
    const clampedH = Math.min(newH, img.height);
    const clampedW = clampedH * aspect;
    return { x: Math.max(0, b.x), y: Math.max(0, b.y), w: clampedW, h: clampedH };
  }, []);

  useEffect(() => {
    if (!image || ratio.w === 0) return;
    setBox(prev => applyRatioToBox(ratio, prev, image.img));
  }, [ratio, image, applyRatioToBox]);

  const getImgPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = scaleRef.current;
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  const getHandle = (pos: { x: number; y: number }, b: Box) => {
    const tol = 10 / scaleRef.current;
    const corners = [
      { id: "tl", x: b.x, y: b.y }, { id: "tr", x: b.x + b.w, y: b.y },
      { id: "br", x: b.x + b.w, y: b.y + b.h }, { id: "bl", x: b.x, y: b.y + b.h },
    ];
    return corners.find(c => Math.abs(c.x - pos.x) < tol && Math.abs(c.y - pos.y) < tol)?.id ?? null;
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const pos = getImgPos(e);
    const handle = getHandle(pos, box);
    if (handle) {
      dragRef.current = { mode: handle, sx: pos.x, sy: pos.y, orig: { ...box } };
    } else if (pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h) {
      dragRef.current = { mode: "move", sx: pos.x, sy: pos.y, orig: { ...box } };
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image || !dragRef.current) return;
    const pos = getImgPos(e);
    const { mode, sx, sy, orig } = dragRef.current;
    const dx = pos.x - sx;
    const dy = pos.y - sy;
    const imgW = image.img.width;
    const imgH = image.img.height;

    setBox(prev => {
      let { x, y, w, h } = orig;
      if (mode === "move") {
        x = Math.max(0, Math.min(imgW - w, orig.x + dx));
        y = Math.max(0, Math.min(imgH - h, orig.y + dy));
      } else {
        if (mode === "tl") {
          const nx = Math.max(0, Math.min(orig.x + orig.w - 20, orig.x + dx));
          const ny = Math.max(0, Math.min(orig.y + orig.h - 20, orig.y + dy));
          w = orig.x + orig.w - nx;
          h = orig.y + orig.h - ny;
          x = nx; y = ny;
        } else if (mode === "tr") {
          const ny = Math.max(0, Math.min(orig.y + orig.h - 20, orig.y + dy));
          w = Math.max(20, Math.min(imgW - orig.x, orig.w + dx));
          h = orig.y + orig.h - ny;
          y = ny;
        } else if (mode === "br") {
          w = Math.max(20, Math.min(imgW - x, orig.w + dx));
          h = Math.max(20, Math.min(imgH - y, orig.h + dy));
        } else if (mode === "bl") {
          const nx = Math.max(0, Math.min(orig.x + orig.w - 20, orig.x + dx));
          w = orig.x + orig.w - nx;
          h = Math.max(20, Math.min(imgH - y, orig.h + dy));
          x = nx;
        }
        if (ratio.w !== 0) h = w / (ratio.w / ratio.h);
      }
      return { x, y, w: Math.max(1, w), h: Math.max(1, h) };
    });
  };

  const onMouseUp = () => { dragRef.current = null; };

  return (
    <div className="flex flex-col gap-5">
      {!image ? (
        <div {...getRootProps()} data-testid="dropzone-crop"
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? "border-green-500 bg-green-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
          <input {...getInputProps()} />
          <Upload className="w-7 h-7 text-white/50 mb-2" />
          <p className="text-sm text-center text-white/60">{t("drag_drop")}</p>
        </div>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={() => setImage(null)} className="border-white/20">{t("change_image")}</Button>
          <div>
            <Label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">{t("crop_ratio")}</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {RATIOS.map(r => (
                <Button key={r.labelKey} size="sm" variant={ratio.labelKey === r.labelKey ? "default" : "outline"} onClick={() => setRatio(r)} className={ratio.labelKey === r.labelKey ? "bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-xs" : "border-white/20 text-xs"}>
                  {t(r.labelKey as any)}
                </Button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowGrid(v => !v)} className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border transition-colors ${showGrid ? "border-green-500 text-green-400 bg-green-500/10" : "border-white/20 text-white/40"}`}>
            {t("crop_grid")}
          </button>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black cursor-crosshair">
            <canvas ref={displayRef} className="w-full block" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} />
          </div>
          <div className="rounded-xl bg-white/5 border border-white/8 px-4 py-3 text-xs text-white/50 flex justify-between">
            <span>{t("crop_ratio")}</span>
            <span className="text-white/70 tabular-nums">{Math.round(box.w)} × {Math.round(box.h)} px</span>
          </div>
          <p className="text-xs text-white/30 text-center">{t("crop_hint")}</p>
        </>
      )}
      <canvas ref={outputRef} className="hidden" />
    </div>
  );
}
