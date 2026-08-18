import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useI18n } from "@/lib/i18n";
import { PDFDocument } from "pdf-lib";
import { Shield, Download, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bytesToBlobPart } from "@/lib/blob";

export function ToolPdfProtect() {
  const { t } = useI18n();
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    f.arrayBuffer().then(buf => {
      setFile({ name: f.name, data: buf });
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
      // 由於瀏覽器端 pdf-lib 不支援強加密，我們執行「隱私清理」
      // 移除作者、建立工具、標題等可能洩漏隱私的中繼資料
      const doc = await PDFDocument.load(file.data);
      doc.setTitle("");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setCreator("");
      doc.setProducer("");

      setBytes(await doc.save());
    } catch (err) {
      console.error("PDF Privacy clean failed:", err);
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!bytes) return;
    const blob = new Blob([bytesToBlobPart(bytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `private-${file?.name ?? "output.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? "border-slate-400 bg-slate-500/10" : "border-white/15 bg-white/[0.02] hover:border-white/30"}`}>
        <input {...getInputProps()} />
        <Shield className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/50">{file?.name || t("pdf_drop_hint")}</p>
      </div>

      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-200/70 leading-relaxed">
          {t("pdf_protect_notice")}
        </p>
      </div>

      <Button
        onClick={run}
        disabled={processing || !file}
        className="w-full rounded-xl bg-slate-700 hover:bg-slate-600 text-white h-10 font-semibold"
      >
        {processing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("processing")}</> : t("pdf_protect_action")}
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
