import { useRef, useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, RotateCw, Check, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type OnReady = (canvas: HTMLCanvasElement, format?: string, quality?: number) => void;

const ORIENTATION_LABELS: Record<number, string> = {
  1: "Normal (no rotation needed)",
  2: "Mirrored horizontal",
  3: "180° rotated",
  4: "Mirrored vertical",
  5: "Mirrored + 90° CW",
  6: "90° CW",
  7: "Mirrored + 90° CCW",
  8: "90° CCW",
};

function readExifOrientation(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xFFD8) return 1;
  let offset = 2;
  const len = buffer.byteLength;
  while (offset < len) {
    const marker = view.getUint16(offset);
    offset += 2;
    if (marker === 0xFFE1) {
      if (view.getUint32(offset + 2) !== 0x45786966) return 1;
      const tiffOffset = offset + 8;
      const littleEndian = view.getUint16(tiffOffset) === 0x4949;
      const ifdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
      const entries = view.getUint16(ifdOffset, littleEndian);
      for (let i = 0; i < entries; i++) {
        const entryOffset = ifdOffset + 2 + i * 12;
        if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
          return view.getUint16(entryOffset + 8, littleEndian);
        }
      }
      return 1;
    }
    if ((marker & 0xFF00) !== 0xFF00) break;
    offset += view.getUint16(offset);
  }
  return 1;
}

function applyOrientation(img: HTMLImageElement, orientation: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const { naturalWidth: w, naturalHeight: h } = img;

  const swap = orientation >= 5;
  canvas.width = swap ? h : w;
  canvas.height = swap ? w : h;

  ctx.save();
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, w, 0); break;
    case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
    case 4: ctx.transform(1, 0, 0, -1, 0, h); break;
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
    case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
    case 7: ctx.transform(0, -1, -1, 0, h, w); break;
    case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
    default: break;
  }
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  return canvas;
}

export function ToolExifFix({ onReady }: { onReady: OnReady }) {
  const { t } = useI18n();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; });

  const [imgData, setImgData] = useState<{ url: string; img: HTMLImageElement; orientation: number; name: string } | null>(null);
  const [manualRot, setManualRot] = useState(0);
  const [applied, setApplied] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setApplied(false);
    setManualRot(0);

    const buf = await file.arrayBuffer();
    const orientation = readExifOrientation(buf);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise(r => { img.onload = r; });
    setImgData({ url, img, orientation, name: file.name });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, multiple: false });

  const applyFix = useCallback(() => {
    if (!imgData) return;
    let canvas = applyOrientation(imgData.img, imgData.orientation);
    if (manualRot !== 0) {
      const tmp = document.createElement("canvas");
      const rad = (manualRot * Math.PI) / 180;
      const swap = manualRot === 90 || manualRot === 270;
      tmp.width = swap ? canvas.height : canvas.width;
      tmp.height = swap ? canvas.width : canvas.height;
      const ctx = tmp.getContext("2d")!;
      ctx.translate(tmp.width / 2, tmp.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      canvas = tmp;
    }
    onReadyRef.current(canvas, "image/jpeg", 0.95);
    setApplied(true);
  }, [imgData, manualRot]);

  const orientationLabel = imgData ? (ORIENTATION_LABELS[imgData.orientation] ?? `Orientation ${imgData.orientation}`) : null;
  const needsFix = imgData && imgData.orientation !== 1;

  return (
    <div className="flex flex-col gap-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center cursor-pointer transition-colors ${isDragActive ? "border-sky-500 bg-sky-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}`}>
        <input {...getInputProps()} />
        <Upload className="w-6 h-6 text-white/50 mb-1" />
        <p className="text-xs text-center text-white/60">{t("drag_drop_merge")}</p>
        {imgData && <p className="text-xs text-sky-400 mt-1 font-medium">{imgData.name}</p>}
      </div>

      {imgData && (
        <>
          <div className={`rounded-xl border p-3 text-sm ${needsFix ? "border-amber-500/40 bg-amber-500/5" : "border-green-500/40 bg-green-500/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck className={`w-4 h-4 flex-shrink-0 ${needsFix ? "text-amber-400" : "text-green-400"}`} />
              <span className="font-medium text-white/80">{t("tool_exif_fix")} · {imgData.orientation}</span>
            </div>
            <p className="text-xs text-white/50 pl-6">{orientationLabel}</p>
          </div>

          <img src={imgData.url} className="w-full rounded-lg border border-white/10 object-contain max-h-40" alt="Original" />

          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{t("rotate_title")}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 90, 180, 270].map(deg => (
                <button key={deg} onClick={() => setManualRot(deg)} className={`py-1.5 rounded-lg text-xs border transition-colors ${manualRot === deg ? "border-sky-500 text-sky-400 bg-sky-500/10" : "border-white/15 text-white/50 hover:border-white/30"}`}>{deg}°</button>
              ))}
            </div>
          </div>

          <Button onClick={applyFix} className={`h-11 gap-2 border-0 ${applied ? "bg-green-600 hover:bg-green-700" : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"}`}>
            {applied ? <Check className="w-4 h-4" /> : <RotateCw className="w-4 h-4" />}
            {applied ? t("done") : t("tool_exif_fix")}
          </Button>
        </>
      )}
    </div>
  );
}
