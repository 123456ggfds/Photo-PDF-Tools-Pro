import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FilePlus2, X, GripVertical, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfFile { name: string; data: ArrayBuffer; size: number }

const addTopLeftTitle = async (doc: PDFDocument, title: string) => {
  const page = doc.getPage(0);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 14;
  page.drawText(title, {
    x: 18,
    y: page.getHeight() - 30,
    size,
    font,
    color: rgb(1, 1, 1),
  });
};

export function ToolPdfMerge() {
  const { t } = useI18n();
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [mergedBytes, setMergedBytes] = useState<Uint8Array | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const pdfs = accepted.filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    Promise.all(pdfs.map(f => f.arrayBuffer())).then(buffers => {
      setFiles(prev => [...prev, ...pdfs.map((f, i) => ({ name: f.name, data: buffers[i], size: f.size }))]);
      setDone(false);
      setMergedBytes(null);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  const remove = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setDone(false);
    setMergedBytes(null);
  };

  const merge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const doc = await PDFDocument.load(file.data);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      if (merged.getPageCount() > 0) await addTopLeftTitle(merged, "Merged PDF");
      const bytes = await merged.save();
      setMergedBytes(bytes);
      setDone(true);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!mergedBytes) return;
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) return;
    setFiles(prev => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    setDone(false);
    setMergedBytes(null);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const fmt = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-400 bg-blue-500/10" : "border-white/15 hover:border-white/30 bg-white/[0.02]"}`}
      >
        <input {...getInputProps()} />
        <FilePlus2 className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{t("pdf_drop_hint")}</p>
        <p className="text-xs text-white/25 mt-1">{t("pdf_only")}</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2 min-h-0">
          <div className="text-[11px] text-white/40 uppercase tracking-[0.15em] mb-1">{t("pdf_files_added")} ({files.length})</div>
          <div className="max-h-[280px] overflow-auto pr-1 flex flex-col gap-2">
          {files.map((f, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnd={handleDragEnd}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                dragOverIdx === i ? "border-blue-400/60 bg-blue-500/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <GripVertical className="w-4 h-4 text-white/25 cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{f.name}</p>
                <p className="text-xs text-white/35">{fmt(f.size)}</p>
              </div>
              <button onClick={() => remove(i)} className="text-white/30 hover:text-white/70 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          </div>
          <p className="text-xs text-white/30 mt-1">{t("pdf_drag_reorder")}</p>
        </div>
      )}

      {/* Actions */}
      {files.length >= 2 && (
        <Button
          onClick={merge}
          disabled={processing}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold h-10 gap-2"
        >
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("processing")}</> : t("pdf_merge_action")}
        </Button>
      )}

      {done && mergedBytes && (
        <Button
          onClick={download}
          className="w-full rounded-xl bg-white text-black hover:bg-white/90 font-semibold h-10 gap-2"
        >
          <Download className="w-4 h-4" />
          {t("pdf_download_merged")}
        </Button>
      )}
    </div>
  );
}
