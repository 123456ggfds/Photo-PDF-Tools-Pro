import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument } from "pdf-lib";
import { FileSymlink, GripVertical, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolPdfReorder() {
  const { t } = useI18n();
  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFileName(f.name);
    f.arrayBuffer().then(buf => {
      setFile(buf);
      setBytes(null);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false
  });

  const run = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const src = await PDFDocument.load(file);
      // 真實邏輯：目前預設執行「倒序」，但結構已準備好支援自定義排序
      const indices = src.getPageIndices().reverse();
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach(p => out.addPage(p));
      setBytes(await out.save());
    } catch (err) {
      console.error("PDF Reorder failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!bytes) return;
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reordered-${fileName || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-emerald-400 bg-emerald-500/10" : "border-white/15 bg-white/[0.02] hover:border-white/30"}`}>
        <input {...getInputProps()} />
        <FileSymlink className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{fileName || t("pdf_drop_hint")}</p>
      </div>
      
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/35 flex items-center gap-2">
        <GripVertical className="w-4 h-4" />
        {t("pdf_reorder_auto")}
      </div>

      <Button 
        onClick={run} 
        disabled={processing || !file} 
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-10 font-semibold"
      >
        {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("processing")}</> : t("pdf_reorder_action")}
      </Button>

      {bytes && (
        <Button onClick={download} className="w-full rounded-xl bg-white text-black h-10 font-bold shadow-lg">
          <Download className="w-4 h-4 mr-2" />
          {t("pdf_download_pdf")}
        </Button>
      )}
    </div>
  );
}
