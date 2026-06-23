import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ImageUp, X, GripVertical, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bytesToBlobPart } from "@/lib/blob";

interface ImgFile { name: string; url: string; data: ArrayBuffer; size: number }

type FitMode = "fit" | "fill" | "original";

export function ToolImageToPdf() {
  const addTopLeftTitle = async (doc: PDFDocument, title: string) => {
    const page = doc.getPage(0);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    page.drawText(title, {
      x: 18,
      y: page.getHeight() - 30,
      size: 14,
      font,
      color: rgb(1, 1, 1),
    });
  };

  const { t } = useI18n();
  const [images, setImages] = useState<ImgFile[]>([]);
  const [fitMode, setFitMode] = useState<FitMode>("fit");
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "match">("a4");
  const [processing, setProcessing] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const imgs = accepted.filter(f => f.type.startsWith("image/"));
    Promise.all(
      imgs.map(f => f.arrayBuffer().then(buf => ({ name: f.name, url: URL.createObjectURL(f), data: buf, size: f.size })))
    ).then(items => {
      setImages(prev => [...prev, ...items]);
      setPdfBytes(null);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const remove = (idx: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
    setPdfBytes(null);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) return;
    setImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const PAGE_SIZES: Record<string, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792],
  };

  const convert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const img of images) {
        const isJpeg = img.name.match(/\.(jpg|jpeg)$/i);
        const isPng = img.name.match(/\.png$/i);
        let pdfImage;
        const bytes = new Uint8Array(img.data);
        if (isJpeg) {
          pdfImage = await pdfDoc.embedJpg(bytes);
        } else if (isPng) {
          pdfImage = await pdfDoc.embedPng(bytes);
        } else {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          const bmp = await createImageBitmap(new Blob([bytes]));
          canvas.width = bmp.width; canvas.height = bmp.height;
          ctx.drawImage(bmp, 0, 0);
          const jpegData = canvas.toDataURL("image/jpeg", 0.92);
          const res = await fetch(jpegData);
          const jpeg = new Uint8Array(await res.arrayBuffer());
          pdfImage = await pdfDoc.embedJpg(jpeg);
        }

        const imgW = pdfImage.width;
        const imgH = pdfImage.height;
        let pageW: number, pageH: number;

        if (pageSize === "match") {
          pageW = imgW; pageH = imgH;
        } else {
          [pageW, pageH] = PAGE_SIZES[pageSize];
        }

        const page = pdfDoc.addPage([pageW, pageH]);
        let drawW: number, drawH: number, x: number, y: number;

        if (fitMode === "original") {
          drawW = imgW; drawH = imgH;
          x = (pageW - imgW) / 2;
          y = (pageH - imgH) / 2;
        } else if (fitMode === "fill") {
          const ratio = Math.max(pageW / imgW, pageH / imgH);
          drawW = imgW * ratio; drawH = imgH * ratio;
          x = (pageW - drawW) / 2; y = (pageH - drawH) / 2;
        } else {
          const ratio = Math.min(pageW / imgW, pageH / imgH);
          drawW = imgW * ratio; drawH = imgH * ratio;
          x = (pageW - drawW) / 2; y = (pageH - drawH) / 2;
        }

        page.drawImage(pdfImage, { x, y, width: drawW, height: drawH });
      }
      if (pdfDoc.getPageCount() > 0) await addTopLeftTitle(pdfDoc, "Images PDF");
      const bytes = await pdfDoc.save();
      setPdfBytes(bytes);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!pdfBytes) return;
    const blob = new Blob([bytesToBlobPart(pdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "images.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-pink-400 bg-pink-500/10" : "border-white/15 hover:border-white/30 bg-white/[0.02]"}`}
      >
        <input {...getInputProps()} />
        <ImageUp className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{t("pdf_drop_images_hint")}</p>
        <p className="text-xs text-white/25 mt-1">JPG, PNG, WEBP</p>
      </div>

      {images.length > 0 && (
        <>
          {/* Thumbnail list */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="text-xs text-white/40 uppercase tracking-[0.15em] mb-1">{t("pdf_images_added")} ({images.length})</div>
            <div className="max-h-[280px] overflow-auto pr-1 flex flex-col gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnd={handleDragEnd}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={e => handleDrop(e, i)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${dragOverIdx === i ? "border-pink-400/60 bg-pink-500/10" : "border-white/10 bg-white/[0.03]"}`}
              >
                <GripVertical className="w-4 h-4 text-white/25 cursor-grab shrink-0" />
                <img src={img.url} alt={img.name} className="w-8 h-8 object-cover rounded-lg shrink-0" />
                <p className="flex-1 text-sm text-white truncate">{img.name}</p>
                <button onClick={() => remove(i)} className="text-white/30 hover:text-white/70 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            </div>
          </div>

          {/* Page size */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-[0.15em] block mb-1.5">{t("pdf_page_size")}</label>
            <div className="flex gap-2">
              {(["a4", "letter", "match"] as const).map(ps => (
                <button
                  key={ps}
                  onClick={() => setPageSize(ps)}
                  className={`flex-1 rounded-xl border text-xs py-2 font-medium transition-colors uppercase ${pageSize === ps ? "border-pink-500/50 bg-pink-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"}`}
                >
                  {ps === "match" ? t("pdf_match_image") : ps.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Fit mode */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-[0.15em] block mb-1.5">{t("pdf_fit_mode")}</label>
            <div className="flex gap-2">
              {(["fit", "fill", "original"] as const).map(fm => (
                <button
                  key={fm}
                  onClick={() => setFitMode(fm)}
                  className={`flex-1 rounded-xl border text-xs py-2 font-medium transition-colors ${fitMode === fm ? "border-pink-500/50 bg-pink-500/15 text-white" : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"}`}
                >
                  {t(`pdf_fit_${fm}` as any)}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={convert}
            disabled={processing}
            className="w-full rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold h-10 gap-2"
          >
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_img_to_pdf_action")}
          </Button>
        </>
      )}

      {pdfBytes && (
        <Button
          onClick={download}
          className="w-full rounded-xl bg-white text-black hover:bg-white/90 font-semibold h-10 gap-2"
        >
          <Download className="w-4 h-4" />
          {t("pdf_download_pdf")}
        </Button>
      )}
    </div>
  );
}
