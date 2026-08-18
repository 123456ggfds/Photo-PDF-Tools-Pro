import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { ImageDown, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PageImage { url: string; page: number; width: number; height: number }

export function ToolPdfToImage() {
  const { t } = useI18n();
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer; pageCount: number } | null>(null);
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");
  const [scale, setScale] = useState(2);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<PageImage[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    f.arrayBuffer().then(async buf => {
      const originalData = buf.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      setFile({ name: f.name, data: originalData, pageCount: pdf.numPages });
      setImages([]);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setImages([]);
    setProgress(0);
    try {
      const workingCopy = file.data.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(workingCopy) }).promise;
      const results: PageImage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const url = canvas.toDataURL(`image/${format}`, format === "jpeg" ? 0.92 : 1);
        results.push({ url, page: i, width: viewport.width, height: viewport.height });
        setProgress(Math.round((i / pdf.numPages) * 100));
      }
      if (results[0]) results[0].url = results[0].url;
      setImages(results);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const downloadOne = (img: PageImage) => {
    const a = document.createElement("a");
    a.href = img.url;
    a.download = `page-${img.page}.${format === "jpeg" ? "jpg" : "png"}`;
    a.click();
  };

  const downloadAll = () => images.forEach(downloadOne);

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-orange-400 bg-orange-500/10" : "border-white/15 hover:border-white/30 bg-white/[0.02]"}`}
      >
        <input {...getInputProps()} />
        <ImageDown className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{t("pdf_drop_hint")}</p>
        <p className="text-xs text-white/25 mt-1">{t("pdf_only")}</p>
      </div>

      {file && (
        <>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{file.pageCount} {t("pdf_pages")}</p>
          </div>

          {/* Format */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-[0.15em] block mb-1.5">{t("pdf_output_format")}</label>
            <div className="flex gap-2">
              {(["jpeg", "png"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded-xl border text-sm py-2 font-medium transition-colors uppercase ${format === f ? "border-orange-500/50 bg-orange-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs text-white/40 uppercase tracking-[0.15em]">{t("pdf_image_scale")}</label>
              <span className="text-xs text-white/60">{scale}x</span>
            </div>
            <input
              type="range"
              min={1} max={4} step={0.5}
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className="w-full accent-orange-400"
            />
            <div className="flex justify-between text-xs text-white/25 mt-0.5">
              <span>1x</span><span>4x</span>
            </div>
          </div>

          <Button
            onClick={convert}
            disabled={processing}
            className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold h-10 gap-2"
          >
            {processing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress}%</>
              : t("pdf_convert_action")}
          </Button>
        </>
      )}

      {images.length > 0 && (
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 uppercase tracking-[0.15em]">{t("pdf_images_result")} ({images.length})</span>
            <button onClick={downloadAll} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">{t("pdf_download_all")}</button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-auto pr-1">
            {images.map((img, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black">
                <img src={img.url} alt={`page ${img.page}`} className="w-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => downloadOne(img)}
                    className="rounded-full bg-white text-black p-2 hover:bg-white/90"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-1 left-2 text-xs text-white/60 pointer-events-none">P{img.page}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
